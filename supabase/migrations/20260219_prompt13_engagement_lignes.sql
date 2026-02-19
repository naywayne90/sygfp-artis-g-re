-- ===========================================================================
-- Prompt 13 : Engagement multi-lignes budgétaires
-- Table : engagement_lignes + colonne is_multi_ligne
-- ===========================================================================

-- 1. Ajouter la colonne is_multi_ligne sur budget_engagements
ALTER TABLE budget_engagements
  ADD COLUMN IF NOT EXISTS is_multi_ligne BOOLEAN DEFAULT false;

-- 2. Créer la table engagement_lignes
CREATE TABLE IF NOT EXISTS engagement_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES budget_engagements(id) ON DELETE CASCADE,
  budget_line_id UUID NOT NULL REFERENCES budget_lines(id),
  montant NUMERIC(15,2) NOT NULL CHECK (montant > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Index de performance
CREATE INDEX IF NOT EXISTS idx_engagement_lignes_engagement_id
  ON engagement_lignes (engagement_id);

CREATE INDEX IF NOT EXISTS idx_engagement_lignes_budget_line_id
  ON engagement_lignes (budget_line_id);

-- 4. RLS sur engagement_lignes (hérite du parent)
ALTER TABLE engagement_lignes ENABLE ROW LEVEL SECURITY;

-- SELECT : visible si l'engagement parent est visible
CREATE POLICY "engagement_lignes_select"
  ON engagement_lignes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_engagements be
      WHERE be.id = engagement_lignes.engagement_id
    )
  );

-- INSERT : si l'utilisateur peut insérer des engagements
CREATE POLICY "engagement_lignes_insert"
  ON engagement_lignes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE : si l'engagement parent est modifiable
CREATE POLICY "engagement_lignes_update"
  ON engagement_lignes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_engagements be
      WHERE be.id = engagement_lignes.engagement_id
        AND be.statut = 'brouillon'
    )
  );

-- DELETE : si l'engagement parent est en brouillon
CREATE POLICY "engagement_lignes_delete"
  ON engagement_lignes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_engagements be
      WHERE be.id = engagement_lignes.engagement_id
        AND be.statut = 'brouillon'
    )
  );

-- 5. Trigger : vérifier que SUM(lignes) = montant engagement
CREATE OR REPLACE FUNCTION fn_check_engagement_lignes_sum()
RETURNS TRIGGER AS $$
DECLARE
  v_engagement_id UUID;
  v_sum NUMERIC(15,2);
  v_montant NUMERIC(15,2);
  v_is_multi BOOLEAN;
BEGIN
  -- Déterminer l'engagement_id concerné
  IF TG_OP = 'DELETE' THEN
    v_engagement_id := OLD.engagement_id;
  ELSE
    v_engagement_id := NEW.engagement_id;
  END IF;

  -- Vérifier si l'engagement est multi-ligne
  SELECT is_multi_ligne, montant INTO v_is_multi, v_montant
  FROM budget_engagements
  WHERE id = v_engagement_id;

  -- Si pas multi-ligne, pas de vérification
  IF NOT COALESCE(v_is_multi, false) THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Calculer la somme des lignes
  SELECT COALESCE(SUM(montant), 0) INTO v_sum
  FROM engagement_lignes
  WHERE engagement_id = v_engagement_id;

  -- Tolérance de 1 FCFA pour les arrondis
  IF ABS(v_sum - v_montant) > 1 THEN
    RAISE EXCEPTION 'La somme des lignes (%) ne correspond pas au montant de l''engagement (%)',
      v_sum, v_montant;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Le trigger est CONSTRAINT DEFERRED pour permettre l'insertion séquentielle des lignes
-- puis la vérification à la fin de la transaction
DROP TRIGGER IF EXISTS trg_check_engagement_lignes_sum ON engagement_lignes;
CREATE CONSTRAINT TRIGGER trg_check_engagement_lignes_sum
  AFTER INSERT OR UPDATE OR DELETE ON engagement_lignes
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_engagement_lignes_sum();

-- 6. ANALYZE
ANALYZE engagement_lignes;
ANALYZE budget_engagements;
