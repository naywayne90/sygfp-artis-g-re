// @ts-nocheck
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Eye, History, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AuditLogViewerProps {
  entityType: string;
  entityId: string;
  title?: string;
}

interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  user_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  exercice: number | null;
  created_at: string;
  user?: { full_name: string; email: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  VALIDATE: "bg-primary/20 text-primary",
  REJECT: "bg-orange-100 text-orange-800",
  SUBMIT: "bg-indigo-100 text-indigo-800",
  DEFER: "bg-yellow-100 text-yellow-800",
  RESUME: "bg-cyan-100 text-cyan-800",
  UPLOAD: "bg-purple-100 text-purple-800",
  SUBMIT_TO_SIGNATURE: "bg-violet-100 text-violet-800",
  CLOSE: "bg-emerald-100 text-emerald-800",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
  VALIDATE: "Validation",
  REJECT: "Rejet",
  SUBMIT: "Soumission",
  DEFER: "Report",
  RESUME: "Reprise",
  UPLOAD: "Upload document",
  SUBMIT_TO_SIGNATURE: "Envoi signature",
  CLOSE: "Clôture",
};

export function AuditLogViewer({ entityType, entityId, title }: AuditLogViewerProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_journal")
        .select(`
          *,
          user:profiles!audit_journal_user_id_fkey(full_name, email)
        `)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!entityId,
  });

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {title || "Journal d'audit"}
        </CardTitle>
        <CardDescription>
          Historique des modifications et actions sur cet élément
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune entrée dans le journal d'audit
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="w-[80px]">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge className={ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}>
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.user?.full_name || "Système"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Dialog pour les détails */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'entrée d'audit</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), "dd MMMM yyyy à HH:mm:ss", { locale: fr })}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Action:</span>
                  <div className="mt-1">
                    <Badge className={ACTION_COLORS[selectedLog.action] || "bg-gray-100 text-gray-800"}>
                      {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Utilisateur:</span>
                  <p className="font-medium">{selectedLog.user?.full_name || "Système"}</p>
                  {selectedLog.user?.email && (
                    <p className="text-xs text-muted-foreground">{selectedLog.user.email}</p>
                  )}
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Adresse IP:</span>
                  <p className="font-medium">{selectedLog.ip_address || "—"}</p>
                </div>
              </div>

              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">Anciennes valeurs:</span>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">Nouvelles valeurs:</span>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
