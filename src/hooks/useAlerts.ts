import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export interface Alert {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string | null;
  entity_table: string | null;
  entity_id: string | null;
  entity_code: string | null;
  module: string | null;
  owner_role: string | null;
  status: "open" | "acknowledged" | "resolved";
  auto_generated: boolean;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_comment: string | null;
  metadata: Record<string, unknown> | null;
}

export function useAlerts(options?: { status?: string; severity?: string }) {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts", options?.status, options?.severity],
    queryFn: async () => {
      let query = supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (options?.status) {
        query = query.eq("status", options.status);
      }
      if (options?.severity) {
        query = query.eq("severity", options.severity);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as Alert[];
    },
  });

  // Stats
  const stats = {
    total: alerts.length,
    open: alerts.filter(a => a.status === "open").length,
    critical: alerts.filter(a => a.severity === "critical" && a.status === "open").length,
    warning: alerts.filter(a => a.severity === "warning" && a.status === "open").length,
    info: alerts.filter(a => a.severity === "info" && a.status === "open").length,
  };

  // Resolve alert
  const resolveMutation = useMutation({
    mutationFn: async ({ alertId, comment }: { alertId: string; comment?: string }) => {
      const { error } = await supabase.rpc("resolve_alert", {
        p_alert_id: alertId,
        p_comment: comment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alerte résolue");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Acknowledge alert
  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alerte prise en compte");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    alerts,
    isLoading,
    stats,
    resolveAlert: resolveMutation.mutate,
    acknowledgeAlert: acknowledgeMutation.mutate,
    isResolving: resolveMutation.isPending,
  };
}

// Hook for dashboard alerts with aggregation
export function useDashboardAlertsAggregated() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["dashboard-alerts-aggregated", exercice],
    queryFn: async () => {
      // Fetch persistent alerts
      const { data: persistentAlerts } = await supabase
        .from("alerts")
        .select("*")
        .eq("status", "open")
        .order("severity")
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch dynamic alerts (computed)
      const dynamicAlerts: Alert[] = [];

      // Pending transfers
      const { count: pendingTransfers } = await supabase
        .from("credit_transfers")
        .select("*", { count: "exact", head: true })
        .eq("exercice", exercice)
        .eq("status", "pending");

      if (pendingTransfers && pendingTransfers > 0) {
        dynamicAlerts.push({
          id: "pending-transfers",
          type: "virement_attente",
          severity: "warning",
          title: `${pendingTransfers} virement(s) en attente`,
          description: "Des demandes de virement nécessitent une validation.",
          entity_table: "credit_transfers",
          entity_id: null,
          entity_code: null,
          module: "virements",
          owner_role: "DAF",
          status: "open",
          auto_generated: true,
          created_at: new Date().toISOString(),
          acknowledged_at: null,
          acknowledged_by: null,
          resolved_at: null,
          resolved_by: null,
          resolution_comment: null,
          metadata: null,
        });
      }

      // Expired supplier documents
      const { count: expiredDocs } = await supabase
        .from("supplier_documents")
        .select("*", { count: "exact", head: true })
        .eq("statut", "expire");

      if (expiredDocs && expiredDocs > 0) {
        dynamicAlerts.push({
          id: "expired-docs",
          type: "document_expire",
          severity: "critical",
          title: `${expiredDocs} document(s) prestataire expiré(s)`,
          description: "Des documents obligatoires ont expiré et doivent être renouvelés.",
          entity_table: "supplier_documents",
          entity_id: null,
          entity_code: null,
          module: "prestataires",
          owner_role: "DAF",
          status: "open",
          auto_generated: true,
          created_at: new Date().toISOString(),
          acknowledged_at: null,
          acknowledged_by: null,
          resolved_at: null,
          resolved_by: null,
          resolution_comment: null,
          metadata: null,
        });
      }

      // Contracts expiring soon
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: expiringContracts } = await supabase
        .from("contrats")
        .select("*", { count: "exact", head: true })
        .lte("date_fin", thirtyDaysFromNow.toISOString())
        .gt("date_fin", new Date().toISOString())
        .not("statut", "in", '("termine","annule")');

      if (expiringContracts && expiringContracts > 0) {
        dynamicAlerts.push({
          id: "expiring-contracts",
          type: "contrat_echeance",
          severity: "warning",
          title: `${expiringContracts} contrat(s) à échéance (< 30j)`,
          description: "Des contrats arrivent bientôt à échéance.",
          entity_table: "contrats",
          entity_id: null,
          entity_code: null,
          module: "contrats",
          owner_role: "SDPM",
          status: "open",
          auto_generated: true,
          created_at: new Date().toISOString(),
          acknowledged_at: null,
          acknowledged_by: null,
          resolved_at: null,
          resolved_by: null,
          resolution_comment: null,
          metadata: null,
        });
      }

      // Combine and sort
      const allAlerts = [...(persistentAlerts || []), ...dynamicAlerts] as Alert[];
      
      // Sort by severity then date
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      allAlerts.sort((a, b) => {
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return allAlerts;
    },
    enabled: !!exercice,
    refetchInterval: 5 * 60 * 1000,
  });
}
