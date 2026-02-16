-- ============================================================================
-- Migration Prompt 5: Vue détaillée, Audit logs, Storage policies
-- Date: 2026-02-16
-- Context: Prompt 5 - Backend view, audit trail, attachment access
--
-- Changes:
--   1. CREATE VIEW v_expressions_besoin_detail (joins: direction, profile,
--      imputation, AEF note, budget_line, budget consumption)
--   2. Audit trigger fn_audit_expression_besoin on expressions_besoin
--   3. Storage policies for sygfp-attachments bucket
--
-- Column name corrections vs user proposal:
--   d.nom → d.label (directions uses label not nom)
--   eb.budget_line_id → eb.ligne_budgetaire_id
--   bl.libelle → bl.label (budget_lines uses label not libelle)
--   v_budget_lines_consumption → v_budget_disponibilite_complet
--   v.engage → v.total_engage
--   v.disponible → v.disponible_net
--   na.reference → na.reference_pivot (notes_dg uses reference_pivot)
-- ============================================================================

BEGIN;

-- =============================================
-- POINT 1: CREATE VIEW v_expressions_besoin_detail
-- =============================================

CREATE OR REPLACE VIEW public.v_expressions_besoin_detail AS
SELECT
  eb.*,
  d.label AS direction_nom,
  d.sigle AS direction_sigle,
  p.full_name AS demandeur_nom,
  imp.reference AS imputation_reference,
  na.reference_pivot AS naef_reference,
  bl.code AS budget_line_code,
  bl.label AS budget_line_libelle,
  COALESCE(v.total_engage, 0) AS engage,
  COALESCE(v.disponible_net, 0) AS disponible,
  (SELECT COUNT(*) FROM expression_besoin_lignes WHERE expression_besoin_id = eb.id) AS nb_articles,
  (SELECT COALESCE(SUM(prix_total), 0) FROM expression_besoin_lignes WHERE expression_besoin_id = eb.id) AS total_articles
FROM expressions_besoin eb
LEFT JOIN directions d ON eb.direction_id = d.id
LEFT JOIN profiles p ON eb.created_by = p.id
LEFT JOIN imputations imp ON eb.imputation_id = imp.id
LEFT JOIN notes_dg na ON imp.note_aef_id = na.id
LEFT JOIN budget_lines bl ON eb.ligne_budgetaire_id = bl.id
LEFT JOIN v_budget_disponibilite_complet v ON bl.id = v.id;

COMMENT ON VIEW public.v_expressions_besoin_detail IS 'Vue détaillée des expressions de besoin avec jointures direction, demandeur, imputation, AEF, budget';

-- =============================================
-- POINT 2: Audit trigger for expressions_besoin
-- =============================================

CREATE OR REPLACE FUNCTION public.fn_audit_expression_besoin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, entity_type, entity_id, action, new_values, exercice)
    VALUES (
      auth.uid(),
      'expression_besoin',
      NEW.id,
      'create',
      jsonb_build_object(
        'numero', NEW.numero,
        'objet', NEW.objet,
        'statut', NEW.statut,
        'montant_estime', NEW.montant_estime,
        'direction_id', NEW.direction_id
      ),
      NEW.exercice
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log meaningful changes (not just updated_at)
    IF NEW.statut IS DISTINCT FROM OLD.statut
       OR NEW.montant_estime IS DISTINCT FROM OLD.montant_estime
       OR NEW.validated_by IS DISTINCT FROM OLD.validated_by
       OR NEW.numero IS DISTINCT FROM OLD.numero THEN
      INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values, exercice)
      VALUES (
        auth.uid(),
        'expression_besoin',
        NEW.id,
        CASE
          WHEN NEW.statut = 'soumis' AND OLD.statut = 'brouillon' THEN 'submit'
          WHEN NEW.statut = 'vérifié' THEN 'verify'
          WHEN NEW.statut = 'validé' THEN 'validate'
          WHEN NEW.statut = 'rejeté' THEN 'reject'
          ELSE 'update'
        END,
        jsonb_build_object(
          'statut', OLD.statut,
          'montant_estime', OLD.montant_estime,
          'validated_by', OLD.validated_by
        ),
        jsonb_build_object(
          'statut', NEW.statut,
          'montant_estime', NEW.montant_estime,
          'validated_by', NEW.validated_by,
          'numero', NEW.numero
        ),
        NEW.exercice
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, exercice)
    VALUES (
      auth.uid(),
      'expression_besoin',
      OLD.id,
      'delete',
      jsonb_build_object(
        'numero', OLD.numero,
        'objet', OLD.objet,
        'statut', OLD.statut,
        'montant_estime', OLD.montant_estime
      ),
      OLD.exercice
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_expression_besoin ON public.expressions_besoin;

CREATE TRIGGER trg_audit_expression_besoin
  AFTER INSERT OR UPDATE OR DELETE ON public.expressions_besoin
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_expression_besoin();

-- =============================================
-- POINT 3: Storage policies for sygfp-attachments bucket
-- (EB attachments are stored in this bucket)
-- =============================================

-- SELECT: Authenticated users can view/download files
CREATE POLICY "Authenticated users can view sygfp attachments"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'sygfp-attachments'
    AND auth.uid() IS NOT NULL
  );

-- INSERT: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload sygfp attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'sygfp-attachments'
    AND auth.uid() IS NOT NULL
  );

-- UPDATE: Owner or admin can update files
CREATE POLICY "Users can update own sygfp attachments"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'sygfp-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR has_role(auth.uid(), 'ADMIN'::app_role)
    )
  );

-- DELETE: Owner or admin can delete files
CREATE POLICY "Users can delete own sygfp attachments"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'sygfp-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR has_role(auth.uid(), 'ADMIN'::app_role)
    )
  );

COMMIT;
