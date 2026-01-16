-- Ajouter les colonnes manquantes à la table imputations
ALTER TABLE imputations 
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS commentaire TEXT,
ADD COLUMN IF NOT EXISTS pieces_jointes TEXT[],
ADD COLUMN IF NOT EXISTS motif_rejet TEXT,
ADD COLUMN IF NOT EXISTS motif_differe TEXT,
ADD COLUMN IF NOT EXISTS date_differe TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS differed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS differed_by UUID REFERENCES profiles(id);

-- Créer un index sur le statut
CREATE INDEX IF NOT EXISTS idx_imputations_statut ON imputations(statut);
CREATE INDEX IF NOT EXISTS idx_imputations_exercice ON imputations(exercice);
CREATE INDEX IF NOT EXISTS idx_imputations_created_at ON imputations(created_at);

-- Trigger pour générer la référence
CREATE OR REPLACE FUNCTION generate_imputation_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_sequence INTEGER;
  v_direction_code TEXT;
BEGIN
  -- Obtenir le code direction
  IF NEW.direction_id IS NOT NULL THEN
    SELECT COALESCE(code, sigle, 'DIR') INTO v_direction_code 
    FROM directions WHERE id = NEW.direction_id;
  ELSE
    v_direction_code := 'GEN';
  END IF;

  -- Obtenir le prochain numéro de séquence
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM imputations
  WHERE exercice = NEW.exercice;

  -- Générer la référence : IMP-2026-DIRECTION-0001
  NEW.reference := 'IMP-' || NEW.exercice || '-' || v_direction_code || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_imputation_reference ON imputations;
CREATE TRIGGER trg_generate_imputation_reference
  BEFORE INSERT ON imputations
  FOR EACH ROW
  WHEN (NEW.reference IS NULL)
  EXECUTE FUNCTION generate_imputation_reference();

-- Mettre à jour les RLS policies
ALTER TABLE imputations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture imputations authentifiés" ON imputations;
CREATE POLICY "Lecture imputations authentifiés" ON imputations
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Création imputations authentifiés" ON imputations;
CREATE POLICY "Création imputations authentifiés" ON imputations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Mise à jour imputations" ON imputations;
CREATE POLICY "Mise à jour imputations" ON imputations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Suppression imputations créateur" ON imputations;
CREATE POLICY "Suppression imputations créateur" ON imputations
  FOR DELETE USING (auth.uid() = created_by AND statut = 'brouillon');