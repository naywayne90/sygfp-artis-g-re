import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExpressionBesoin } from './useExpressionsBesoin';

/**
 * Lazy-loading hook for a single Expression de Besoin detail.
 * Fetches the full row (including liste_articles, attachments, validations)
 * only when the detail dialog is open.
 */
export function useExpressionBesoinDetail(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['expression-besoin-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expressions_besoin')
        .select(
          `
          *,
          direction:directions(id, code, label, sigle),
          marche:marches!expressions_besoin_marche_id_fkey(
            id, numero, objet, montant, mode_passation,
            prestataire:prestataires(id, raison_sociale)
          ),
          imputation:imputations!expressions_besoin_imputation_id_fkey(
            id, reference, objet, montant, code_imputation,
            budget_line:budget_lines(id, code, label)
          ),
          attachments:expression_besoin_attachments(
            id, document_type, file_name, file_path, file_size, file_type, uploaded_by, created_at
          ),
          dossier:dossiers(id, numero, objet),
          creator:profiles!expressions_besoin_created_by_fkey(id, full_name),
          validator:profiles!expressions_besoin_validated_by_fkey(id, full_name),
          validations:expression_besoin_validations(
            id, expression_besoin_id, step_order, role, status, validated_by, validated_at, comments,
            validator:profiles!expression_besoin_validations_validated_by_fkey(id, full_name)
          )
        `
        )
        .eq('id', id as string)
        .single();

      if (error) throw error;

      const eb = data as unknown as ExpressionBesoin;

      // Derive verifier from CB validation step
      if (!eb.verifier && eb.verified_by && eb.validations) {
        const cbValidation = eb.validations.find((v) => v.role === 'CB' && v.status === 'approved');
        if (cbValidation?.validator) {
          eb.verifier = cbValidation.validator;
        }
      }

      return eb;
    },
    enabled: enabled && !!id,
    staleTime: 30_000,
  });
}
