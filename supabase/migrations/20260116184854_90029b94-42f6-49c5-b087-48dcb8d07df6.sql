-- =====================================================
-- Migration: Expression de Besoin depuis Imputation validée
-- =====================================================

-- 1. Ajouter colonne imputation_id à expressions_besoin
ALTER TABLE expressions_besoin 
ADD COLUMN IF NOT EXISTS imputation_id UUID REFERENCES imputations(id);

-- 2. Ajouter champ liste_articles (JSONB pour articles/quantités)
ALTER TABLE expressions_besoin
ADD COLUMN IF NOT EXISTS liste_articles JSONB DEFAULT '[]'::jsonb;

-- 3. Index pour performance
CREATE INDEX IF NOT EXISTS idx_expressions_besoin_imputation 
ON expressions_besoin(imputation_id);

-- 4. Fonction pour générer la référence EB automatiquement
CREATE OR REPLACE FUNCTION generate_expression_besoin_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_sequence INTEGER;
  v_direction_code TEXT;
  v_exercice INTEGER;
BEGIN
  -- Générer le numéro si non fourni
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_exercice := COALESCE(NEW.exercice, EXTRACT(YEAR FROM NOW())::INTEGER);
    
    -- Obtenir le code direction
    IF NEW.direction_id IS NOT NULL THEN
      SELECT COALESCE(sigle, code, 'DIR') INTO v_direction_code 
      FROM directions WHERE id = NEW.direction_id;
    ELSE
      v_direction_code := 'GEN';
    END IF;

    -- Séquence annuelle
    SELECT COALESCE(MAX(
      CASE 
        WHEN numero ~ 'EB-[0-9]{4}-[A-Z]+-([0-9]+)$' THEN
          CAST(SUBSTRING(numero FROM 'EB-[0-9]{4}-[A-Z]+-([0-9]+)$') AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO v_sequence
    FROM expressions_besoin
    WHERE exercice = v_exercice;

    -- Référence : EB-2026-DG-0001
    NEW.numero := 'EB-' || v_exercice || '-' || v_direction_code || '-' || LPAD(v_sequence::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_generate_expression_besoin_reference ON expressions_besoin;

-- 5. Créer le trigger
CREATE TRIGGER trg_generate_expression_besoin_reference
BEFORE INSERT ON expressions_besoin
FOR EACH ROW
EXECUTE FUNCTION generate_expression_besoin_reference();

-- 6. Fonction pour mettre à jour le dossier quand une EB est créée
CREATE OR REPLACE FUNCTION update_dossier_on_expression_besoin()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'EB a un dossier_id, mettre à jour l'étape courante
  IF NEW.dossier_id IS NOT NULL THEN
    UPDATE dossiers 
    SET etape_courante = 'expression_besoin', 
        updated_at = NOW()
    WHERE id = NEW.dossier_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_update_dossier_on_expression_besoin ON expressions_besoin;

-- 7. Créer le trigger pour mise à jour du dossier
CREATE TRIGGER trg_update_dossier_on_expression_besoin
AFTER INSERT ON expressions_besoin
FOR EACH ROW
EXECUTE FUNCTION update_dossier_on_expression_besoin();

-- 8. RLS - Policy pour lecture via imputation
CREATE POLICY "Users can read expressions linked to accessible imputations"
ON expressions_besoin
FOR SELECT
USING (
  imputation_id IS NULL 
  OR EXISTS (
    SELECT 1 FROM imputations i 
    WHERE i.id = expressions_besoin.imputation_id
  )
);