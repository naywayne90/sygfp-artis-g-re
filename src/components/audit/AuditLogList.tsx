import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuditJournal, ENTITY_TYPES, ACTION_TYPES, AuditLogEntry, AuditFilters } from "@/hooks/useAuditJournal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download, Eye, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  validate: "bg-primary/20 text-primary",
  reject: "bg-orange-100 text-orange-800",
  submit: "bg-indigo-100 text-indigo-800",
  DIFFERE: "bg-yellow-100 text-yellow-800",
  ROLE_ADDED: "bg-purple-100 text-purple-800",
  ROLE_REMOVED: "bg-pink-100 text-pink-800",
};

export function AuditLogList() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const auditLogs = useAuditJournal(filters);

  // Récupérer les utilisateurs pour le filtre
  const users = useQuery({
    queryKey: ["profiles-for-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const clearFilters = () => {
    setFilters({});
  };

  const hasFilters = Object.values(filters).some(v => v);

  const exportCSV = () => {
    const headers = ["Date", "Utilisateur", "Action", "Entité", "ID Entité"];
    const rows = (auditLogs.data || []).map(log => [
      log.created_at,
      log.user?.full_name || log.user?.email || "-",
      log.action,
      log.entity_type,
      log.entity_id || "",
    ]);
    const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `journal_audit_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getActionLabel = (action: string) => {
    return ACTION_TYPES.find(a => a.value === action)?.label || action;
  };

  const getEntityLabel = (entity: string) => {
    return ENTITY_TYPES.find(e => e.value === entity)?.label || entity;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Journal d'audit</CardTitle>
            <CardDescription>Historique des actions dans le système</CardDescription>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-wrap gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs">Type d'entité</Label>
              <Select value={filters.entityType || "all"} onValueChange={(v) => setFilters({ ...filters, entityType: v === "all" ? undefined : v })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {ENTITY_TYPES.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Action</Label>
              <Select value={filters.action || "all"} onValueChange={(v) => setFilters({ ...filters, action: v === "all" ? undefined : v })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {ACTION_TYPES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Utilisateur</Label>
              <Select value={filters.userId || "all"} onValueChange={(v) => setFilters({ ...filters, userId: v === "all" ? undefined : v })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {users.data?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date début</Label>
              <Input
                type="date"
                className="w-[150px]"
                value={filters.startDate || ""}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date fin</Label>
              <Input
                type="date"
                className="w-[150px]"
                value={filters.endDate || ""}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
              />
            </div>
            {hasFilters && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Effacer
                </Button>
              </div>
            )}
          </div>

          {auditLogs.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : !auditLogs.data?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun log trouvé
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Heure</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entité</TableHead>
                    <TableHead>ID Entité</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.data.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{log.user?.full_name || "-"}</span>
                          <span className="text-xs text-muted-foreground">{log.user?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getEntityLabel(log.entity_type)}</TableCell>
                      <TableCell className="font-mono text-xs">{log.entity_id?.slice(0, 8) || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedLog(log); setDetailsOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-2 text-sm text-muted-foreground">
            {auditLogs.data?.length || 0} entrées affichées (max 500)
          </div>
        </CardContent>
      </Card>

      {/* Dialog Détails */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Date/Heure</Label>
                  <p className="font-medium">{format(new Date(selectedLog.created_at), "dd MMMM yyyy HH:mm:ss", { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Utilisateur</Label>
                  <p className="font-medium">{selectedLog.user?.full_name || selectedLog.user?.email || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Action</Label>
                  <div className="mt-1">
                    <Badge className={ACTION_COLORS[selectedLog.action] || ""}>
                      {getActionLabel(selectedLog.action)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entité</Label>
                  <p className="font-medium">{getEntityLabel(selectedLog.entity_type)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">ID Entité</Label>
                <p className="font-mono text-sm">{selectedLog.entity_id || "-"}</p>
              </div>
              {selectedLog.ip_address && (
                <div>
                  <Label className="text-muted-foreground">Adresse IP</Label>
                  <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                </div>
              )}
              {selectedLog.old_values && (
                <div>
                  <Label className="text-muted-foreground">Anciennes valeurs</Label>
                  <ScrollArea className="h-32 rounded-md border p-2 mt-1">
                    <pre className="text-xs">{JSON.stringify(selectedLog.old_values, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}
              {selectedLog.new_values && (
                <div>
                  <Label className="text-muted-foreground">Nouvelles valeurs</Label>
                  <ScrollArea className="h-32 rounded-md border p-2 mt-1">
                    <pre className="text-xs">{JSON.stringify(selectedLog.new_values, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
