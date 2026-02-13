import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface ImputationDetailView {
  id: string;
  reference: string | null;
  note_aef_id: string;
  budget_line_id: string | null;
  direction_id: string | null;
  dossier_id: string | null;
  exercice: number;
  montant: number;
  statut: string;
  code_imputation: string | null;
  objet: string;
  commentaire: string | null;
  motif_rejet: string | null;
  motif_differe: string | null;
  date_differe: string | null;
  forcer_imputation: boolean | null;
  justification_depassement: string | null;
  source_financement: string | null;
  disponible_au_moment: number | null;
  is_multi_ligne: boolean | null;
  is_migrated: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  submitted_by: string | null;
  validated_at: string | null;
  validated_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  differed_at: string | null;
  differed_by: string | null;
  // Joined
  direction_nom: string | null;
  direction_code: string | null;
  direction_sigle: string | null;
  createur_nom: string | null;
  validateur_nom: string | null;
  naef_numero: string | null;
  naef_reference_pivot: string | null;
  naef_objet: string | null;
  naef_montant: number | null;
  naef_statut: string | null;
  naef_note_sef_id: string | null;
  nsef_numero: string | null;
  nsef_objet: string | null;
  budget_line_code: string | null;
  budget_line_libelle: string | null;
  dotation: number;
  engage_avant: number;
  disponible: number;
  dossier_numero: string | null;
  dossier_statut: string | null;
  os_code: string | null;
  os_libelle: string | null;
  mission_code: string | null;
  mission_libelle: string | null;
  action_code: string | null;
  action_libelle: string | null;
  activite_code: string | null;
  activite_libelle: string | null;
  nbe_code: string | null;
  nbe_libelle: string | null;
  sysco_code: string | null;
  sysco_libelle: string | null;
}

export interface LinkedNoteSEF {
  id: string;
  numero: string | null;
  objet: string | null;
  statut: string | null;
}

export interface LinkedExpressionBesoin {
  id: string;
  numero: string | null;
  objet: string;
  statut: string | null;
  montant_estime: number | null;
}

// ============================================
// HOOK
// ============================================

export function useImputationDetail(imputationId: string | null) {
  // 1. Detail view (dénormalisé)
  const { data: detail = null, isLoading: loadingDetail } = useQuery<ImputationDetailView | null>({
    queryKey: ['imputation-detail', imputationId],
    queryFn: async () => {
      if (!imputationId) return null;
      const { data, error } = await supabase
        .from('v_imputations_detail' as 'imputations')
        .select('*')
        .eq('id', imputationId)
        .single();
      if (error) {
        console.error('Error fetching imputation detail:', error);
        return null;
      }
      return data as unknown as ImputationDetailView;
    },
    enabled: !!imputationId,
    staleTime: 30_000,
  });

  // 2. Note SEF liée (via note AEF → note_sef_id)
  const { data: linkedNoteSEF = null, isLoading: loadingSEF } = useQuery<LinkedNoteSEF | null>({
    queryKey: ['imputation-linked-sef', imputationId, detail?.naef_note_sef_id],
    queryFn: async (): Promise<LinkedNoteSEF | null> => {
      if (!detail?.naef_note_sef_id) return null;
      const { data, error } = await supabase
        .from('notes_sef')
        .select('id, numero, objet, statut')
        .eq('id', detail.naef_note_sef_id)
        .single();
      if (error) return null;
      return data as LinkedNoteSEF;
    },
    enabled: !!detail?.naef_note_sef_id,
    staleTime: 60_000,
  });

  // 3. Expression de besoin liée (via imputation_id)
  const { data: linkedExpressionBesoin = null, isLoading: loadingEB } =
    useQuery<LinkedExpressionBesoin | null>({
      queryKey: ['imputation-linked-eb', imputationId],
      queryFn: async (): Promise<LinkedExpressionBesoin | null> => {
        if (!imputationId) return null;
        const { data, error } = await supabase
          .from('expressions_besoin')
          .select('id, numero, objet, statut, montant_estime')
          .eq('imputation_id', imputationId)
          .limit(1)
          .maybeSingle();
        if (error) return null;
        return data as LinkedExpressionBesoin | null;
      },
      enabled: !!imputationId,
      staleTime: 30_000,
    });

  return {
    detail,
    linkedNoteSEF,
    linkedExpressionBesoin,
    isLoading: loadingDetail,
    loadingDetail,
    loadingSEF,
    loadingEB,
  };
}
