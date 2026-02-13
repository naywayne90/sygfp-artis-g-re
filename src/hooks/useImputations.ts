import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';

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
  validated_at: string | null;
  rejected_at: string | null;
  motif_rejet: string | null;
  motif_differe: string | null;
  is_migrated: boolean | null;
  // Relations
  direction?: { id: string; label: string; sigle: string | null } | null;
  note_aef?: { id: string; numero: string; objet: string } | null;
  budget_line?: { id: string; code: string; label: string } | null;
  created_by_profile?: { id: string; first_name: string | null; last_name: string | null } | null;
  validated_by_profile?: { id: string; first_name: string | null; last_name: string | null } | null;
}

export type ImputationStatus = 'brouillon' | 'a_valider' | 'valide' | 'rejete' | 'differe';

export interface ImputationFilters {
  statut?: ImputationStatus | ImputationStatus[];
  search?: string;
  directionId?: string;
}

export function useImputations(filters?: ImputationFilters) {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Fetch imputations avec filtres
  const {
    data: imputations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['imputations', exercice, filters],
    queryFn: async () => {
      let query = supabase
        .from('imputations')
        .select(
          `
          *,
          direction:directions(id, label, sigle),
          note_aef:notes_dg!imputations_note_aef_id_fkey(id, numero, objet),
          budget_line:budget_lines(id, code, label),
          created_by_profile:profiles!imputations_created_by_fkey(id, first_name, last_name),
          validated_by_profile:profiles!imputations_validated_by_fkey(id, first_name, last_name)
        `
        )
        .eq('exercice', exercice || new Date().getFullYear())
        .order('created_at', { ascending: false });

      // Filtrer par statut
      if (filters?.statut) {
        if (Array.isArray(filters.statut)) {
          query = query.in('statut', filters.statut);
        } else {
          query = query.eq('statut', filters.statut);
        }
      }

      // Filtrer par direction
      if (filters?.directionId) {
        query = query.eq('direction_id', filters.directionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Imputation[];
    },
    enabled: !!exercice,
  });

  // Compteurs par statut
  const {
    data: counts = { brouillon: 0, a_valider: 0, valide: 0, rejete: 0, differe: 0, total: 0 },
  } = useQuery({
    queryKey: ['imputations-counts', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imputations')
        .select('statut')
        .eq('exercice', exercice || new Date().getFullYear());

      if (error) throw error;

      const counts = {
        brouillon: 0,
        a_valider: 0,
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
  });

  // Filtrer côté client si recherche textuelle
  const filteredImputations = filters?.search
    ? imputations.filter((imp) => {
        const searchLower = (filters.search ?? '').toLowerCase();
        return (
          imp.objet?.toLowerCase().includes(searchLower) ||
          imp.reference?.toLowerCase().includes(searchLower) ||
          imp.code_imputation?.toLowerCase().includes(searchLower) ||
          imp.direction?.label?.toLowerCase().includes(searchLower)
        );
      })
    : imputations;

  // Soumettre une imputation
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('imputations')
        .update({
          statut: 'a_valider',
          submitted_at: new Date().toISOString(),
          submitted_by: user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'imputation',
        entityId: id,
        action: 'submit',
        newValues: { statut: 'a_valider' },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imputations'] });
      queryClient.invalidateQueries({ queryKey: ['imputations-counts'] });
      toast({
        title: 'Imputation soumise',
        description: "L'imputation a été soumise pour validation.",
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Valider une imputation
  const validateMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('imputations')
        .update({
          statut: 'valide',
          validated_at: new Date().toISOString(),
          validated_by: user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour l'étape du dossier
      if (data.dossier_id) {
        await supabase
          .from('dossiers')
          .update({ etape_courante: 'imputation', updated_at: new Date().toISOString() })
          .eq('id', data.dossier_id);
      }

      await logAction({
        entityType: 'imputation',
        entityId: id,
        action: 'validate',
        newValues: { statut: 'valide' },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imputations'] });
      queryClient.invalidateQueries({ queryKey: ['imputations-counts'] });
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      toast({
        title: 'Imputation validée',
        description: "L'imputation a été validée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
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
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'imputation',
        entityId: id,
        action: 'reject',
        newValues: { statut: 'rejete', motif },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imputations'] });
      queryClient.invalidateQueries({ queryKey: ['imputations-counts'] });
      toast({ title: 'Imputation rejetée', description: "L'imputation a été rejetée." });
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
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: 'imputation',
        entityId: id,
        action: 'defer',
        newValues: { statut: 'differe', motif },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imputations'] });
      queryClient.invalidateQueries({ queryKey: ['imputations-counts'] });
      toast({ title: 'Imputation différée', description: "L'imputation a été mise en attente." });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Supprimer une imputation (brouillon uniquement)
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
    imputations: filteredImputations,
    counts,
    isLoading,
    error: error?.message || null,
    refetch,
    submitImputation: submitMutation.mutateAsync,
    validateImputation: validateMutation.mutateAsync,
    rejectImputation: rejectMutation.mutateAsync,
    deferImputation: deferMutation.mutateAsync,
    deleteImputation: deleteMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isDeferring: deferMutation.isPending,
  };
}
