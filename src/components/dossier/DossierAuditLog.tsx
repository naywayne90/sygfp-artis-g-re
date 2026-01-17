import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Search,
  Eye,
  Download,
  RefreshCw,
  User,
  Calendar,
  ArrowLeftRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
  ip_address: string | null;
  user: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface DossierAuditLogProps {
  dossierId?: string;
  entityType?: string;
  entityId?: string;
  title?: string;
  maxItems?: number;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: "Création", color: "bg-blue-500" },
  UPDATE: { label: "Modification", color: "bg-amber-500" },
  DELETE: { label: "Suppression", color: "bg-red-500" },
  VALIDATE: { label: "Validation", color: "bg-green-500" },
  REJECT: { label: "Rejet", color: "bg-red-500" },
  SUBMIT: { label: "Soumission", color: "bg-purple-500" },
  DEFER: { label: "Report", color: "bg-yellow-500" },
  RESUME: { label: "Reprise", color: "bg-blue-500" },
  IMPUTE: { label: "Imputation", color: "bg-indigo-500" },
  SIGN: { label: "Signature", color: "bg-cyan-500" },
  EXECUTE: { label: "Exécution", color: "bg-green-500" },
  UPLOAD: { label: "Upload", color: "bg-teal-500" },
  SERVICE_FAIT: { label: "Service fait", color: "bg-emerald-500" },
  CONTROLE_SDCT: { label: "Contrôle SDCT", color: "bg-orange-500" },
  VALIDATION_DG: { label: "Validation DG", color: "bg-green-600" },
  UPDATE_LOCKED_FIELD: { label: "Modif. champ verrouillé", color: "bg-red-400" },
};

export function DossierAuditLog({
  dossierId,
  entityType,
  entityId,
  title = "Journal d'audit",
  maxItems = 100,
}: DossierAuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  useEffect(() => {
    loadAuditLog();
  }, [dossierId, entityType, entityId]);

  const loadAuditLog = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          entity_type,
          entity_id,
          old_values,
          new_values,
          created_at,
          ip_address,
          user:profiles!audit_logs_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(maxItems);

      if (entityType && entityId) {
        query = query.eq("entity_type", entityType).eq("entity_id", entityId);
      } else if (dossierId) {
        // Récupérer les entités liées au dossier
        const { data: etapes } = await supabase
          .from("dossier_etapes")
          .select("id")
          .eq("dossier_id", dossierId);

        const entityIds = etapes?.map(e => e.id).filter(Boolean) || [];
        entityIds.push(dossierId);

        if (entityIds.length > 0) {
          query = query.in("entity_id", entityIds);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Erreur chargement audit:", error);
      toast.error("Erreur lors du chargement du journal");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Heure", "Utilisateur", "Action", "Entité", "ID Entité", "Détails"];
    const rows = filteredEntries.map(entry => [
      format(new Date(entry.created_at), "dd/MM/yyyy"),
      format(new Date(entry.created_at), "HH:mm:ss"),
      entry.user?.full_name || entry.user?.email || "N/A",
      ACTION_LABELS[entry.action]?.label || entry.action,
      entry.entity_type,
      entry.entity_id || "N/A",
      JSON.stringify(entry.new_values || {}).replace(/"/g, '""'),
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_log_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Export CSV téléchargé");
  };

  const filteredEntries = entries.filter(entry => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      entry.action.toLowerCase().includes(search) ||
      entry.entity_type.toLowerCase().includes(search) ||
      entry.user?.full_name?.toLowerCase().includes(search) ||
      entry.user?.email?.toLowerCase().includes(search) ||
      JSON.stringify(entry.new_values).toLowerCase().includes(search)
    );
  });

  const formatDiff = (oldVal: any, newVal: any) => {
    const changes: { field: string; old: any; new: any }[] = [];
    const excludeFields = ['_timestamp', '_action_type', 'updated_at', 'created_at'];

    const allKeys = new Set([
      ...Object.keys(oldVal || {}),
      ...Object.keys(newVal || {}),
    ]);

    allKeys.forEach(key => {
      if (excludeFields.includes(key)) return;
      const oldValue = oldVal?.[key];
      const newValue = newVal?.[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field: key, old: oldValue, new: newValue });
      }
    });

    return changes;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            {title}
            <Badge variant="outline">{filteredEntries.length}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAuditLog}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Date/Heure</TableHead>
                <TableHead className="w-[140px]">Utilisateur</TableHead>
                <TableHead className="w-[120px]">Action</TableHead>
                <TableHead className="w-[100px]">Entité</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune entrée trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => {
                  const actionConfig = ACTION_LABELS[entry.action] || {
                    label: entry.action,
                    color: "bg-muted",
                  };

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(entry.created_at), "dd/MM/yy HH:mm", { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">
                            {entry.user?.full_name || entry.user?.email || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${actionConfig.color} text-white text-xs`}
                        >
                          {actionConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {entry.entity_type}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {entry.new_values && typeof entry.new_values === 'object'
                          ? Object.entries(entry.new_values)
                              .filter(([k]) => !['_timestamp', '_action_type'].includes(k))
                              .slice(0, 2)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEntry(entry)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Badge className={`${actionConfig.color} text-white`}>
                                  {actionConfig.label}
                                </Badge>
                                <span className="text-muted-foreground text-sm font-normal">
                                  {entry.entity_type} • {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                                </span>
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                              {/* Métadonnées */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Utilisateur:</span>
                                  <span className="ml-2 font-medium">
                                    {entry.user?.full_name || entry.user?.email || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">IP:</span>
                                  <span className="ml-2 font-mono">
                                    {entry.ip_address || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">ID Entité:</span>
                                  <span className="ml-2 font-mono text-xs">
                                    {entry.entity_id || "N/A"}
                                  </span>
                                </div>
                              </div>

                              {/* Différences */}
                              {(entry.old_values || entry.new_values) && (
                                <div>
                                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <ArrowLeftRight className="h-4 w-4" />
                                    Modifications
                                  </h4>
                                  <ScrollArea className="h-[200px] border rounded-lg p-3">
                                    <div className="space-y-2">
                                      {formatDiff(entry.old_values, entry.new_values).map((change, i) => (
                                        <div key={i} className="text-sm p-2 bg-muted rounded">
                                          <div className="font-medium text-xs text-muted-foreground mb-1">
                                            {change.field}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {change.old !== undefined && (
                                              <span className="line-through text-destructive text-xs">
                                                {typeof change.old === 'object' 
                                                  ? JSON.stringify(change.old) 
                                                  : String(change.old)}
                                              </span>
                                            )}
                                            <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-success text-xs">
                                              {typeof change.new === 'object' 
                                                ? JSON.stringify(change.new) 
                                                : String(change.new)}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      {formatDiff(entry.old_values, entry.new_values).length === 0 && (
                                        <p className="text-muted-foreground text-sm">
                                          Aucune modification détectée
                                        </p>
                                      )}
                                    </div>
                                  </ScrollArea>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
