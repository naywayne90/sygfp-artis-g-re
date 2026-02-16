-- ============================================================================
-- Migration Prompt 4: Expression de Besoin - Backend DDL
-- Date: 2026-02-16
-- Context: Prompt 4 - Table lignes, trigger total, reference ARTI03, indexes, RLS
--
-- Changes:
--   1. FK on expressions_besoin: ALREADY EXIST (imputation_id, ligne_budgetaire_id)
--   2. CREATE TABLE expression_besoin_lignes (articles détaillés)
--   3. Trigger fn_update_eb_montant_from_lignes → calcul montant_estime
--   4. Fix generate_eb_numero → ARTI03MMYYNNNN via generate_arti_reference(3)
--   5. Indexes: ligne_budgetaire_id, created_by, eb_lignes FK, designation GIN
--   6. RLS on expression_besoin_lignes (hérite du parent)
-- ============================================================================

BEGIN;

-- =============================================
-- POINT 2: CREATE TABLE expression_besoin_lignes
-- =============================================

CREATE TABLE IF NOT EXISTS public.expression_besoin_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expression_besoin_id UUID NOT NULL REFERENCES public.expressions_besoin(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL DEFAULT 1,
  designation TEXT NOT NULL,
  description TEXT,
  quantite NUMERIC(12,2) NOT NULL DEFAULT 1,
  unite TEXT DEFAULT 'unité',
  prix_unitaire NUMERIC(15,2) NOT NULL DEFAULT 0,
  prix_total NUMERIC(15,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.expression_besoin_lignes IS 'Lignes détaillées des expressions de besoin (articles)';

-- =============================================
-- POINT 3: TRIGGER calcul montant_total sur EB parent
-- =============================================

CREATE OR REPLACE FUNCTION public.fn_update_eb_montant_from_lignes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total NUMERIC;
  v_eb_id UUID;
BEGIN
  -- Identifier l'expression_besoin_id selon l'opération
  IF TG_OP = 'DELETE' THEN
    v_eb_id := OLD.expression_besoin_id;
  ELSE
    v_eb_id := NEW.expression_besoin_id;
  END IF;

  -- Calculer le total des lignes
  SELECT COALESCE(SUM(quantite * prix_unitaire), 0)
  INTO v_total
  FROM expression_besoin_lignes
  WHERE expression_besoin_id = v_eb_id;

  -- Mettre à jour le montant estimé de l'EB parent
  UPDATE expressions_besoin
  SET montant_estime = v_total,
      updated_at = now()
  WHERE id = v_eb_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_eb_montant
  AFTER INSERT OR UPDATE OR DELETE ON public.expression_besoin_lignes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_eb_montant_from_lignes();

-- updated_at auto-trigger on lignes
CREATE TRIGGER update_expression_besoin_lignes_updated_at
  BEFORE UPDATE ON public.expression_besoin_lignes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- POINT 4: Fix reference generator → ARTI03MMYYNNNN
-- Replace generate_eb_numero to use generate_arti_reference(3, ...)
-- Old format: EB-2026-00001
-- New format: ARTI03MMYYNNNN (e.g. ARTI0302260001)
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_eb_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Générer la référence ARTI03MMYYNNNN quand soumis
  IF NEW.numero IS NULL AND NEW.statut = 'soumis' THEN
    NEW.numero := generate_arti_reference(3, now());
  END IF;
  RETURN NEW;
END;
$function$;

-- =============================================
-- POINT 5: Missing indexes
-- =============================================

-- Index manquant sur ligne_budgetaire_id (expressions_besoin)
CREATE INDEX IF NOT EXISTS idx_expressions_besoin_ligne_budgetaire
  ON public.expressions_besoin (ligne_budgetaire_id);

-- Index manquant sur created_by (expressions_besoin) - used in RLS
CREATE INDEX IF NOT EXISTS idx_expressions_besoin_created_by
  ON public.expressions_besoin (created_by);

-- Indexes sur expression_besoin_lignes
CREATE INDEX IF NOT EXISTS idx_eb_lignes_expression_besoin_id
  ON public.expression_besoin_lignes (expression_besoin_id);

CREATE INDEX IF NOT EXISTS idx_eb_lignes_designation
  ON public.expression_besoin_lignes USING gin (to_tsvector('french', designation));

-- =============================================
-- POINT 6: RLS on expression_besoin_lignes
-- Hérite du parent expressions_besoin
-- =============================================

ALTER TABLE public.expression_besoin_lignes ENABLE ROW LEVEL SECURITY;

-- SELECT: Visible si l'EB parent est visible
CREATE POLICY "ebl_select_policy"
  ON public.expression_besoin_lignes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM expressions_besoin eb
      WHERE eb.id = expression_besoin_lignes.expression_besoin_id
        AND (
          eb.created_by = auth.uid()
          OR has_role(auth.uid(), 'ADMIN'::app_role)
          OR has_role(auth.uid(), 'DG'::app_role)
          OR has_role(auth.uid(), 'DAAF'::app_role)
          OR has_role(auth.uid(), 'CB'::app_role)
          OR (
            eb.direction_id IS NOT NULL
            AND eb.direction_id IN (
              SELECT p.direction_id FROM profiles p WHERE p.id = auth.uid()
            )
          )
        )
    )
  );

-- INSERT: Seulement si l'EB parent est en brouillon et appartient au user
CREATE POLICY "ebl_insert_policy"
  ON public.expression_besoin_lignes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expressions_besoin eb
      WHERE eb.id = expression_besoin_lignes.expression_besoin_id
        AND (
          (eb.created_by = auth.uid() AND eb.statut IN ('brouillon', 'rejeté'))
          OR has_role(auth.uid(), 'ADMIN'::app_role)
        )
    )
  );

-- UPDATE: Seulement si l'EB parent est en brouillon et appartient au user
CREATE POLICY "ebl_update_policy"
  ON public.expression_besoin_lignes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM expressions_besoin eb
      WHERE eb.id = expression_besoin_lignes.expression_besoin_id
        AND (
          (eb.created_by = auth.uid() AND eb.statut IN ('brouillon', 'rejeté'))
          OR has_role(auth.uid(), 'ADMIN'::app_role)
        )
    )
  );

-- DELETE: Seulement si l'EB parent est en brouillon et appartient au user
CREATE POLICY "ebl_delete_policy"
  ON public.expression_besoin_lignes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM expressions_besoin eb
      WHERE eb.id = expression_besoin_lignes.expression_besoin_id
        AND (
          (eb.created_by = auth.uid() AND eb.statut IN ('brouillon', 'rejeté'))
          OR has_role(auth.uid(), 'ADMIN'::app_role)
        )
    )
  );

COMMIT;
