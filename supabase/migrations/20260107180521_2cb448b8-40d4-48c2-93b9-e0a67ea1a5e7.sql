-- =====================================================
-- Migration : Mode Exercice budgétaire fonctionnel
-- =====================================================

-- 1. Ajouter colonne exercice sur marches si absente
ALTER TABLE marches ADD COLUMN IF NOT EXISTS exercice INTEGER;

-- 2. Remplir avec la valeur de 'annee' si présente
UPDATE marches SET exercice = annee WHERE exercice IS NULL AND annee IS NOT NULL;

-- 3. Remplir avec l'année de création pour les lignes sans valeur
UPDATE marches SET exercice = EXTRACT(YEAR FROM created_at)::INTEGER 
WHERE exercice IS NULL;

-- 4. Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_marches_exercice ON marches(exercice);

-- 5. Créer fonction pour empêcher suppression d'exercice avec données
CREATE OR REPLACE FUNCTION prevent_exercice_deletion()
RETURNS TRIGGER AS $$
DECLARE
  engagement_count INTEGER;
  budget_line_count INTEGER;
  liquidation_count INTEGER;
  ordonnancement_count INTEGER;
BEGIN
  -- Vérifier les engagements
  SELECT COUNT(*) INTO engagement_count FROM budget_engagements WHERE exercice = OLD.annee;
  IF engagement_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer l''exercice % : % engagement(s) existant(s)', OLD.annee, engagement_count;
  END IF;
  
  -- Vérifier les lignes budgétaires
  SELECT COUNT(*) INTO budget_line_count FROM budget_lines WHERE exercice = OLD.annee;
  IF budget_line_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer l''exercice % : % ligne(s) budgétaire(s) existante(s)', OLD.annee, budget_line_count;
  END IF;
  
  -- Vérifier les liquidations
  SELECT COUNT(*) INTO liquidation_count FROM budget_liquidations WHERE exercice = OLD.annee;
  IF liquidation_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer l''exercice % : % liquidation(s) existante(s)', OLD.annee, liquidation_count;
  END IF;
  
  -- Vérifier les ordonnancements
  SELECT COUNT(*) INTO ordonnancement_count FROM budget_ordonnancements WHERE exercice = OLD.annee;
  IF ordonnancement_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer l''exercice % : % ordonnancement(s) existant(s)', OLD.annee, ordonnancement_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger (drop d'abord s'il existe)
DROP TRIGGER IF EXISTS check_exercice_deletion ON exercices_budgetaires;
CREATE TRIGGER check_exercice_deletion
  BEFORE DELETE ON exercices_budgetaires
  FOR EACH ROW EXECUTE FUNCTION prevent_exercice_deletion();