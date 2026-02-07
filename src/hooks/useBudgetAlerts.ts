import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { toast } from 'sonner';

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
  context: Record<string, unknown>;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_comment: string | null;
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

interface EdgeFunctionResponse {
  success?: boolean;
  error?: string;
  count?: number;
  alerts?: BudgetAlert[];
  new_alerts?: number;
  critical_count?: number;
}

const NIVEAU_COLORS = {
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  critical: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
  blocking: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
  },
};

const NIVEAU_LABELS = {
  info: 'Information',
  warning: 'Attention',
  critical: 'Critique',
  blocking: 'Bloquant',
};

async function invokeBudgetAlerts(body: Record<string, unknown>): Promise<EdgeFunctionResponse> {
  const { data, error } = await supabase.functions.invoke('budget-alerts', {
    body,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error as string);
  return data as EdgeFunctionResponse;
}

export function useBudgetAlerts() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  // Fetch all alerts for the current exercise via Edge Function
  const alerts = useQuery({
    queryKey: ['budget-alerts', exercice],
    queryFn: async () => {
      const response = await invokeBudgetAlerts({
        action: 'list',
        exercice,
      });
      return (response.alerts || []) as BudgetAlert[];
    },
    enabled: !!exercice,
  });

  // Derive unacknowledged count from the alerts list
  const unacknowledgedCount =
    alerts.data?.filter((a) => !a.acknowledged_at && !a.resolved_at).length ?? 0;

  // Fetch alert rules (direct query - the Edge Function doesn't manage rules)
  const rules = useQuery({
    queryKey: ['budget-alert-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budg_alert_rules')
        .select('*')
        .order('seuil_pct');

      if (error) throw error;
      return (data || []) as AlertRule[];
    },
  });

  // Check and trigger alerts via Edge Function
  const checkAlerts = useMutation({
    mutationFn: async () => {
      return invokeBudgetAlerts({
        action: 'check',
        exercice,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget-alerts'] });
      const count = data.new_alerts ?? 0;
      if (count > 0) {
        const critical = data.critical_count ?? 0;
        if (critical > 0) {
          toast.warning(`${count} nouvelle(s) alerte(s) dont ${critical} critique(s)`);
        } else {
          toast.warning(`${count} nouvelle(s) alerte(s) budgetaire(s) detectee(s)`);
        }
      } else {
        toast.success('Aucune nouvelle alerte detectee');
      }
    },
    onError: (error: Error) => {
      console.error('Error checking alerts:', error);
      toast.error('Erreur lors de la verification des alertes');
    },
  });

  // Acknowledge an alert via Edge Function
  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      return invokeBudgetAlerts({
        action: 'acknowledge',
        alert_id: alertId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-alerts'] });
      toast.success('Alerte accusee de reception');
    },
    onError: (error: Error) => {
      console.error('Error acknowledging alert:', error);
      toast.error("Erreur lors de l'accuse de reception");
    },
  });

  // Resolve an alert via Edge Function
  const resolveAlert = useMutation({
    mutationFn: async ({ alertId, comment }: { alertId: string; comment?: string }) => {
      return invokeBudgetAlerts({
        action: 'resolve',
        alert_id: alertId,
        comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-alerts'] });
      toast.success('Alerte resolue');
    },
    onError: (error: Error) => {
      console.error('Error resolving alert:', error);
      toast.error('Erreur lors de la resolution');
    },
  });

  // Update a rule (direct query - Edge Function doesn't manage rules)
  const updateRule = useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: Partial<AlertRule> }) => {
      const { error } = await supabase.from('budg_alert_rules').update(updates).eq('id', ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-alert-rules'] });
      toast.success('Regle mise a jour');
    },
    onError: (error: Error) => {
      console.error('Error updating rule:', error);
      toast.error('Erreur lors de la mise a jour');
    },
  });

  return {
    alerts: alerts.data || [],
    isLoadingAlerts: alerts.isLoading,
    unacknowledgedCount,
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
