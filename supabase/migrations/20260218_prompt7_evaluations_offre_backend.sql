-- ============================================================
-- Prompt 7 BACKEND — Table evaluations_offre
-- Date: 2026-02-18
-- Description: Création table, triggers, RLS pour évaluations
-- ============================================================

-- ============================================================
-- 1. CONTEXTE
-- ============================================================
-- Tables existantes liées:
--   soumissions (25 cols, 0 données, FK→marche_lots + marches + prestataires)
--   marche_offres (15 cols, 0 données, FK→marches + prestataires)
--   marche_lots (12 cols, 0 données)
--   marches (47+ cols, 16 marchés)
--
-- Table evaluations_offre: N'EXISTAIT PAS → création complète
-- Mapping noms réels:
--   soumissionnaires → soumissions (table réelle)
--   lots_marche → marche_lots (table réelle)

-- ============================================================
-- 2. CRÉATION TABLE evaluations_offre
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations_offre (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soumission_id UUID NOT NULL REFERENCES soumissions(id) ON DELETE CASCADE,
  marche_id UUID NOT NULL REFERENCES marches(id),
  lot_id UUID REFERENCES marche_lots(id),
  note_technique NUMERIC(5,2) CHECK (note_technique >= 0 AND note_technique <= 100),
  note_financiere NUMERIC(5,2) CHECK (note_financiere >= 0 AND note_financiere <= 100),
  note_finale NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN note_technique IS NOT NULL AND note_technique >= 70
         AND note_financiere IS NOT NULL
    THEN ROUND(note_technique * 0.7 + note_financiere * 0.3, 2)
    ELSE NULL END
  ) STORED,
  qualifie_techniquement BOOLEAN DEFAULT false,
  rang INTEGER,
  observations TEXT,
  evaluateur_id UUID REFERENCES profiles(id),
  date_evaluation TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. INDEXES (+5 + 1 unique)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_evaluations_offre_soumission ON evaluations_offre(soumission_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_offre_marche ON evaluations_offre(marche_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_offre_lot ON evaluations_offre(lot_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_offre_evaluateur ON evaluations_offre(evaluateur_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_offre_rang ON evaluations_offre(rang);

-- Unique: une seule évaluation par soumission
ALTER TABLE evaluations_offre ADD CONSTRAINT evaluations_offre_soumission_unique UNIQUE(soumission_id);

-- ============================================================
-- 4. TRIGGER updated_at
-- ============================================================
DROP TRIGGER IF EXISTS update_evaluations_offre_updated_at ON evaluations_offre;
CREATE TRIGGER update_evaluations_offre_updated_at
  BEFORE UPDATE ON evaluations_offre
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. TRIGGER qualification technique
-- ============================================================
-- Contrainte: note_technique < 70 → qualifie_techniquement = false,
--             note_financiere = NULL (pas évaluée financièrement)
CREATE OR REPLACE FUNCTION public.fn_enforce_qualification_technique()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.note_technique IS NOT NULL AND NEW.note_technique >= 70 THEN
    NEW.qualifie_techniquement := true;
  ELSE
    NEW.qualifie_techniquement := false;
    NEW.note_financiere := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_qualification ON evaluations_offre;
CREATE TRIGGER trg_enforce_qualification
  BEFORE INSERT OR UPDATE OF note_technique ON evaluations_offre
  FOR EACH ROW
  EXECUTE FUNCTION fn_enforce_qualification_technique();

-- ============================================================
-- 6. TRIGGER classement auto
-- ============================================================
-- Après évaluation, recalcul du rang par lot/marché:
--   rang = ROW_NUMBER() OVER (ORDER BY note_finale DESC)
--   Seuls les qualifiés techniquement sont classés
CREATE OR REPLACE FUNCTION public.fn_recalc_classement_evaluations()
RETURNS TRIGGER AS $$
DECLARE
  v_marche_id UUID;
  v_lot_id UUID;
BEGIN
  v_marche_id := COALESCE(NEW.marche_id, OLD.marche_id);
  v_lot_id := COALESCE(NEW.lot_id, OLD.lot_id);

  -- Recalculer le rang pour toutes les évaluations qualifiées du même lot/marché
  WITH ranked AS (
    SELECT id,
      ROW_NUMBER() OVER (ORDER BY note_finale DESC NULLS LAST) AS new_rang
    FROM evaluations_offre
    WHERE marche_id = v_marche_id
      AND (v_lot_id IS NULL OR lot_id = v_lot_id)
      AND qualifie_techniquement = true
      AND note_finale IS NOT NULL
  )
  UPDATE evaluations_offre e
  SET rang = r.new_rang
  FROM ranked r
  WHERE e.id = r.id AND (e.rang IS DISTINCT FROM r.new_rang);

  -- Mettre rang = NULL pour les non qualifiés
  UPDATE evaluations_offre
  SET rang = NULL
  WHERE marche_id = v_marche_id
    AND (v_lot_id IS NULL OR lot_id = v_lot_id)
    AND (qualifie_techniquement = false OR note_finale IS NULL)
    AND rang IS NOT NULL;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_recalc_classement ON evaluations_offre;
CREATE TRIGGER trg_recalc_classement
  AFTER INSERT OR UPDATE OF note_technique, note_financiere OR DELETE ON evaluations_offre
  FOR EACH ROW
  EXECUTE FUNCTION fn_recalc_classement_evaluations();

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================
-- Seuls DAAF, DG, ADMIN peuvent voir/modifier les évaluations
-- Pattern: has_role(auth.uid(), 'ROLE'::app_role)
ALTER TABLE evaluations_offre ENABLE ROW LEVEL SECURITY;

-- SELECT: DAAF, DG, ADMIN
CREATE POLICY evaluations_offre_select ON evaluations_offre
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

-- INSERT: DAAF, ADMIN
CREATE POLICY evaluations_offre_insert ON evaluations_offre
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

-- UPDATE: DAAF, ADMIN
CREATE POLICY evaluations_offre_update ON evaluations_offre
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

-- DELETE: ADMIN uniquement
CREATE POLICY evaluations_offre_delete ON evaluations_offre
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
-- Table evaluations_offre:
--   14 colonnes (dont 1 GENERATED ALWAYS AS STORED: note_finale)
--   4 FK: soumission_id→soumissions, marche_id→marches,
--         lot_id→marche_lots, evaluateur_id→profiles
--   2 CHECK: note_technique [0,100], note_financiere [0,100]
--   7 indexes: PK + soumission + marche + lot + evaluateur + rang + unique(soumission_id)
--   6 trigger events:
--     - trg_enforce_qualification (INSERT, UPDATE OF note_technique)
--     - trg_recalc_classement (INSERT, UPDATE OF note_technique/note_financiere, DELETE)
--     - update_evaluations_offre_updated_at (UPDATE)
--   4 RLS policies: SELECT(DAAF,DG,ADMIN), INSERT(DAAF,ADMIN),
--                   UPDATE(DAAF,ADMIN), DELETE(ADMIN)
--   2 fonctions: fn_enforce_qualification_technique(),
--                fn_recalc_classement_evaluations()
--   0 données (table neuve)
--
-- Colonne GENERATED note_finale:
--   Pondération 70/30 (technique/financière)
--   Seuil technique: >= 70 pour être qualifié
--   Si non qualifié: note_financiere = NULL, note_finale = NULL, rang = NULL
