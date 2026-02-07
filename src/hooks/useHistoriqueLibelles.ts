import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistoriqueLibelleRow {
  id: string;
  budget_line_id: string | null;
  champ_modifie: string | null;
  ancienne_valeur: string | null;
  nouvelle_valeur: string | null;
  motif: string | null;
  modifie_par: string | null;
  created_at: string;
  budget_line: {
    label: string | null;
    code: string | null;
  } | null;
  profile: {
    full_name: string | null;
  } | null;
}

export function useHistoriqueLibelles(filters?: {
  directionId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ['historique-libelles', filters],
    queryFn: async () => {
      let query = supabase
        .from('historique_libelles')
        .select(
          `
          *,
          budget_line:budget_lines(label, code),
          profile:profiles!historique_libelles_modifie_par_fkey(full_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as HistoriqueLibelleRow[];
    },
  });
}
