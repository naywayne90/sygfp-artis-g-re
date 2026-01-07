import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export interface BudgetAlert {
  id: string;
  rule_id: string | null;
  exercice: number;
  ligne_budgetaire_id: string | null;
  niveau: 'info' | 'warning' | 'critical' | 'blocking';
  seuil_atteint: number;
  taux_actuel: number | null;
  montant_dotation: number | null;
  montant_engage: number | null;
  montant_disponible: number | null;
  message: string;
  context: Record<string, any>;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_comment: string | null;
  // Relations
  budget_line?: {
    id: string;
    code: string;
    label: string;
  } | null;
}

export interface AlertRule {
  id: string;
  exercice: number | null;
  scope: 'GLOBAL' | 'PAR_LIGNE';
  seuil_pct: number;
  actif: boolean;
  destinataires_roles: string[];
  destinataires_users: string[];
  canal: string;
  description: string | null;
  created_at: string;
}

const NIVEAU_COLORS = {
  info: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  critical: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  blocking: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

const NIVEAU_LABELS = {
  info: 'Information',
  warning: 'Attention',
  critical: 'Critique',
  blocking: 'Bloquant',
};

export function useBudgetAlerts() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  // Fetch all alerts for the current exercise
  const alerts = useQuery({
    queryKey: ["budget-alerts", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budg_alerts")
        .select(`
          *,
          budget_lines:ligne_budgetaire_id (id, code, label)
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as BudgetAlert[];
    },
    enabled: !!exercice,
  });

  // Count unacknowledged alerts
  const unacknowledgedCount = useQuery({
    queryKey: ["budget-alerts-unack-count", exercice],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("budg_alerts")
        .select("*", { count: "exact", head: true })
        .eq("exercice", exercice)
        .is("acknowledged_at", null)
        .is("resolved_at", null);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!exercice,
  });

  // Fetch alert rules
  const rules = useQuery({
    queryKey: ["budget-alert-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budg_alert_rules")
        .select("*")
        .order("seuil_pct");

      if (error) throw error;
      return (data || []) as AlertRule[];
    },
  });

  // Check and trigger alerts for current exercise
  const checkAlerts = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("check_budget_alerts", {
        p_exercice: exercice,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budget-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["budget-alerts-unack-count"] });
      if (data && data.length > 0) {
        toast.warning(`${data.length} nouvelle(s) alerte(s) budgétaire(s) détectée(s)`);
      } else {
        toast.success("Aucune nouvelle alerte détectée");
      }
    },
    onError: (error) => {
      console.error("Error checking alerts:", error);
      toast.error("Erreur lors de la vérification des alertes");
    },
  });

  // Acknowledge an alert
  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase.rpc("acknowledge_budget_alert", {
        p_alert_id: alertId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["budget-alerts-unack-count"] });
      toast.success("Alerte accusée de réception");
    },
    onError: (error) => {
      console.error("Error acknowledging alert:", error);
      toast.error("Erreur lors de l'accusé de réception");
    },
  });

  // Resolve an alert
  const resolveAlert = useMutation({
    mutationFn: async ({ alertId, comment }: { alertId: string; comment?: string }) => {
      const { data, error } = await supabase.rpc("resolve_budget_alert", {
        p_alert_id: alertId,
        p_comment: comment || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["budget-alerts-unack-count"] });
      toast.success("Alerte résolue");
    },
    onError: (error) => {
      console.error("Error resolving alert:", error);
      toast.error("Erreur lors de la résolution");
    },
  });

  // Update a rule
  const updateRule = useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: Partial<AlertRule> }) => {
      const { error } = await supabase
        .from("budg_alert_rules")
        .update(updates)
        .eq("id", ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-alert-rules"] });
      toast.success("Règle mise à jour");
    },
    onError: (error) => {
      console.error("Error updating rule:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  return {
    alerts: alerts.data || [],
    isLoadingAlerts: alerts.isLoading,
    unacknowledgedCount: unacknowledgedCount.data || 0,
    rules: rules.data || [],
    isLoadingRules: rules.isLoading,
    checkAlerts,
    acknowledgeAlert,
    resolveAlert,
    updateRule,
    NIVEAU_COLORS,
    NIVEAU_LABELS,
  };
}
