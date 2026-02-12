/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BudgetLineAuditEntry {
  id: string;
  date: string;
  user: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  source: 'audit_log' | 'field_history';
}

export function useBudgetLineAudit(budgetLineId: string | null) {
  const { data: auditLogs, isLoading: loadingAudit } = useQuery({
    queryKey: ['budget-line-audit-logs', budgetLineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, details, created_at, user_id, profiles:user_id(full_name)')
        .eq('entity_type', 'budget_line')
        .eq('entity_id', budgetLineId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((log): BudgetLineAuditEntry => {
        const profile = log.profiles as unknown as { full_name: string } | null;
        return {
          id: `audit-${log.id}`,
          date: log.created_at,
          user: profile?.full_name || log.user_id || 'Système',
          action: log.action || 'modification',
          field: null,
          oldValue: null,
          newValue: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
          source: 'audit_log',
        };
      });
    },
    enabled: !!budgetLineId,
    staleTime: 30_000,
  });

  const { data: fieldHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['budget-line-field-history', budgetLineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_line_history')
        .select(
          'id, field_name, old_value, new_value, changed_at, changed_by, profiles:changed_by(full_name)'
        )
        .eq('budget_line_id', budgetLineId!)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((h): BudgetLineAuditEntry => {
        const profile = h.profiles as unknown as { full_name: string } | null;
        return {
          id: `history-${h.id}`,
          date: h.changed_at,
          user: profile?.full_name || h.changed_by || 'Système',
          action: 'modification_champ',
          field: h.field_name,
          oldValue: h.old_value,
          newValue: h.new_value,
          source: 'field_history',
        };
      });
    },
    enabled: !!budgetLineId,
    staleTime: 30_000,
  });

  // Merge and sort by date DESC
  const entries: BudgetLineAuditEntry[] = [...(auditLogs || []), ...(fieldHistory || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return {
    entries,
    isLoading: loadingAudit || loadingHistory,
  };
}
