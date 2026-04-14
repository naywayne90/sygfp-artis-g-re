import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useNotificationsAuto } from '@/hooks/useNotificationsAuto';
import { formatCurrency } from '@/lib/utils';

/** Profil minimal pour affichage traçabilité */
interface ProfileRef {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export interface Imputation {
  id: string;
  reference: string | null;
  note_aef_id: string;
  budget_line_id: string | null;
  dossier_id: string | null;
  objet: string;
  montant: number;
  direction_id: string | null;
  os_id: string | null;
  mission_id: string | null;
  action_id: string | null;
  activite_id: string | null;
  sous_activite_id: string | null;
  nbe_id: string | null;
  sysco_id: string | null;
  source_financement: string | null;
  code_imputation: string | null;
  commentaire: string | null;
  statut: string;
  exercice: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  // Visa CB (étape 2)
  vise_at: string | null;
  vise_by: string | null;
  // Validation DG (étape 3)
  validated_at: string | null;
  validated_by: string | null;
  // Rejet
  rejected_at: string | null;
  rejected_by: string | null;
  motif_rejet: string | null;
  // Report
  differed_at: string | null;
  differed_by: string | null;
  motif_differe: string | null;
  date_differe: string | null;
  is_migrated: boolean | null;
  // Relations
  direction?: { id: string; label: string; sigle: string | null } | null;
  note_aef?: { id: string; numero: string; objet: string } | null;
  budget_line?: {
    id: string;
    code: string;
    label: string;
    dotation_initiale: number | null;
    dotation_modifiee: number | null;
    total_engage: number | null;
    montant_reserve: number | null;
  } | null;
  // Profils de traçabilité
  created_by_profile?: ProfileRef | null;
  vise_by_profile?: ProfileRef | null;
  validated_by_profile?: ProfileRef | null;
  rejected_by_profile?: ProfileRef | null;
  differed_by_profile?: ProfileRef | null;
}

export type ImputationStatus = 'soumis' | 'vise' | 'valide' | 'rejete' | 'differe';

export interface ImputationFilters {
  statut?: ImputationStatus | ImputationStatus[];
  search?: string;
  directionId?: string;
  page?: number;
  pageSize?: number;
}

export function useImputations(filters?: ImputationFilters) {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const { notifyRole, onValidation, onRejet, onDiffere } = useNotificationsAuto();

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 50;

  // Fetch imputations avec filtres + pagination serveur
  const {
    data: queryResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['imputations', exercice, filters],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Requête avec traçabilité complète (tous les profils)
      const fullSelect = `
        *,
        direction:directions(id, label, sigle),
        note_aef:notes_dg!imputations_note_aef_id_fkey(id, numero, objet),
        budget_line:budget_lines(id, code, label, dotation_initiale, dotation_modifiee, total_engage, montant_reserve),
        created_by_profile:profiles!imputations_created_by_fkey(id, first_name, last_name),
        vise_by_profile:profiles!imputations_vise_by_fkey(id, first_name, last_name),
        validated_by_profile:profiles!imputations_validated_by_fkey(id, first_name, last_name),
        rejected_by_profile:profiles!imputations_rejected_by_fkey(id, first_name, last_name),
        differed_by_profile:profiles!imputations_differed_by_fkey(id, first_name, last_name)
      `;

      // Fallback sans vise_by_profile (si FK non résolue)
      const safeSelect = `
        *,
        direction:directions(id, label, sigle),
        note_aef:notes_dg!imputations_note_aef_id_fkey(id, numero, objet),
        budget_line:budget_lines(id, code, label, dotation_initiale, dotation_modifiee, total_engage, montant_reserve),
        created_by_profile:profiles!imputations_created_by_fkey(id, first_name, last_name),
        validated_by_profile:profiles!imputations_validated_by_fkey(id, first_name, last_name),
        rejected_by_profile:profiles!imputations_rejected_by_fkey(id, first_name, last_name),
        differed_by_profile:profiles!imputations_differed_by_fkey(id, first_name, last_name)
      `;

      const buildQuery = (selectStr: string) => {
        let q = supabase
          .from('imputations')
          .select(selectStr, { count: 'exact' })
          .eq('exercice', exercice || new Date().getFullYear())
          .order('created_at', { ascending: false })
          .range(from, to);

        if (filters?.statut) {
          if (Array.isArray(filters.statut)) {
            q = q.in('statut', filters.statut);
          } else {
            q = q.eq('statut', filters.statut);
          }
        }
        if (filters?.directionId) {
          q = q.eq('direction_id', filters.directionId);
        }
        if (filters?.search?.trim()) {
          const term = `%${filters.search.trim()}%`;
          q = q.or(`objet.ilike.${term},reference.ilike.${term},code_imputation.ilike.${term}`);
        }
        return q;
      };

      // Essayer la requête complète, fallback si FK vise_by non résolue
      let result = await buildQuery(fullSelect);
      if (result.error) {
        console.warn(
          'Requête complète échouée, fallback sans vise_by_profile:',
          result.error.message
        );
        result = await buildQuery(safeSelect);
        if (result.error) throw result.error;

        // Résoudre vise_by_profile manuellement
        const items = result.data as unknown as Imputation[];
        const viseByIds = [...new Set(items.map((i) => i.vise_by).filter(Boolean))] as string[];
        if (viseByIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', viseByIds);
          if (profiles) {
            const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
            items.forEach((item) => {
              if (item.vise_by) {
                item.vise_by_profile = profileMap[item.vise_by] || null;
              }
            });
          }
        }
        return { items, totalCount: result.count ?? 0 };
      }

      return {
        items: result.data as unknown as Imputation[],
        totalCount: result.count ?? 0,
      };
    },
    enabled: !!exercice,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const imputations = queryResult?.items ?? [];
  const totalCount = queryResult?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Compteurs par statut
  const { data: counts = { soumis: 0, vise: 0, valide: 0, rejete: 0, differe: 0, total: 0 } } =
    useQuery({
      queryKey: ['imputations-counts', exercice],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('imputations')
          .select('statut')
          .eq('exercice', exercice || new Date().getFullYear());

        if (error) throw error;

        const counts = {
          soumis: 0,
          vise: 0,
          valide: 0,
          rejete: 0,
          differe: 0,
          total: data.length,
        };

        data.forEach((imp) => {
          if (imp.statut in counts) {
            counts[imp.statut as keyof typeof counts]++;
          }
        });

        return counts;
      },
      enabled: !!exercice,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    });

  // Visa CB : soumis → vise (contrôle a priori du Contrôleur Budgétaire)
  // Utilise la RPC atomique viser_imputation (verrouillage + audit côté serveur)
  const visaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc(
        'viser_imputation' as 'acknowledge_budget_alert',
        { p_imputation_id: id } as never
      );
      if (error) throw error;
      const result = data as unknown as {
        success: boolean;
        error?: string;
        reference?: string;
        montant?: number;
        [key: string]: unknown;
      };
      if (!result.success) throw new Error(result.error || 'Visa échoué');
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['imputations'] });
      queryClient.invalidateQueries({ queryKey: ['imputations-counts'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      toast({
        title: 'Visa CB accordé',
        description:
          "L'imputation a reçu le visa du Contrôleur Budgétaire. En attente de validation DG.",
      });
      // Notifier le DG qu'une imputation est prête pour validation
      const ref = typeof result.reference === 'string' ? result.reference : '';
      const montant = typeof result.montant === 'number' ? result.montant : 0;
      notifyRole({
        type: 'dossier_a_valider',
        title: 'Imputation visée — à valider',
        message: `L'imputation ${ref} (${formatCurrency(montant)}) a reçu le visa du CB et nécessite votre validation.`,
        entityType: 'imputation',
        entityId:
          typeof result === 'object' && result !== null
            ? String((result as Record<string, unknown>).imputation_id || '')
            : '',
        isUrgent: false,
        recipientRole: 'DG',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur visa', description: error.message, variant: 'destructive' });
    },
  });

  // Valider une imputation via RPC atomique (réserve les crédits)
  const validateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc(
        'validate_imputation' as 'acknowledge_budget_alert',
        { p_imputation_id: id } as never
      );
      if (error) throw error;
      const result = data as unknown as {
        success: boolean;
        error?: string;
        montant?: number;
        disponible_apres?: number;
        reference?: string;
        [key: string]: unknown;
      };
      if (!result.success) throw new Error(result.error || 'Validation échouée');
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['imputations'] });
      queryClient.invalidateQueries({ queryKey: ['imputations-counts'] });
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
      queryClient.invalidateQueries({ queryKey: ['budget-line-detail'] });
      queryClient.invalidateQueries({ queryKey: ['budget-impact-preview'] });
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      const montant = typeof result.montant === 'number' ? result.montant : 0;
      const disponible = typeof result.disponible_apres === 'number' ? result.disponible_apres : 0;
      const ref = typeof result.reference === 'string' ? result.reference : '';
      toast({
        title: 'Imputation validée',
        description: `${formatCurrency(montant)} réservés. Disponible: ${formatCurrency(disponible)}`,
      });
      // Notifier la DAAF que l'imputation est validée (peut créer EB)
      notifyRole({
        type: 'validation',
        title: 'Imputation validée par le DG',
        message: `L'imputation ${ref} (${formatCurrency(montant)}) a été validée. Vous pouvez créer l'Expression de Besoin.`,
        entityType: 'imputation',
        entityId:
          typeof result === 'object' && result !== null
            ? String((result as Record<string, unknown>).imputation_id || '')
            : '',
        recipientRole: 'DAAF',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur de validation', description: error.message, variant: 'destructive' });
    },
  });

  // Rejeter une imputation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('imputations')
        .update({
          statut: 'rejete',
          motif_rejet: motif,
          rejected_at: new Date().toISOString(),
          rejected_by: user.id,
        })
        .eq('id', id)
        .select(
          '*, created_by_profile:profiles!imputations_created_by_fkey(id, first_name, last_name)'
        )
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'imputation',
        entityId: id,
        action: 'reject',
        newValues: { statut: 'rejete', motif },
      });

      return data as Imputation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imputations'] });
      queryClient.invalidateQueries({ queryKey: ['imputations-counts'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      toast({ title: 'Imputation rejetée', description: "L'imputation a été rejetée." });
      // Notifier le créateur (DAAF)
      if (data.created_by) {
        onRejet(
          'Imputation',
          data.id,
          data.reference || data.id,
          data.created_by,
          data.motif_rejet || 'Rejetée par le DG'
        );
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Différer une imputation
  const deferMutation = useMutation({
    mutationFn: async ({
      id,
      motif,
      dateReprise,
    }: {
      id: string;
      motif: string;
      dateReprise?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('imputations')
        .update({
          statut: 'differe',
          motif_differe: motif,
          date_differe: dateReprise || null,
          differed_at: new Date().toISOString(),
          differed_by: user.id,
        })
        .eq('id', id)
        .select(
          '*, created_by_profile:profiles!imputations_created_by_fkey(id, first_name, last_name)'
        )
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'imputation',
        entityId: id,
        action: 'defer',
        newValues: { statut: 'differe', motif },
      });

      return data as Imputation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imputations'] });
      queryClient.invalidateQueries({ queryKey: ['imputations-counts'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      toast({ title: 'Imputation différée', description: "L'imputation a été mise en attente." });
      // Notifier le créateur (DAAF)
      if (data.created_by) {
        onDiffere(
          'Imputation',
          data.id,
          data.reference || data.id,
          data.created_by,
          data.motif_differe || 'Différée par le DG',
          data.date_differe || undefined
        );
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Supprimer une imputation (soumis uniquement)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('imputations').delete().eq('id', id);
      if (error) throw error;

      await logAction({
        entityType: 'imputation',
        entityId: id,
        action: 'delete',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imputations'] });
      queryClient.invalidateQueries({ queryKey: ['imputations-counts'] });
      toast({ title: 'Imputation supprimée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    imputations,
    counts,
    totalCount,
    totalPages,
    page,
    pageSize,
    isLoading,
    error: error?.message || null,
    refetch,
    viserImputation: visaMutation.mutateAsync,
    validateImputation: validateMutation.mutateAsync,
    rejectImputation: rejectMutation.mutateAsync,
    deferImputation: deferMutation.mutateAsync,
    deleteImputation: deleteMutation.mutateAsync,
    isVisaing: visaMutation.isPending,
    isValidating: validateMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isDeferring: deferMutation.isPending,
  };
}
