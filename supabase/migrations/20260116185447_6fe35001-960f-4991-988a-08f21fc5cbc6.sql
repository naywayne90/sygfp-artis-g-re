-- =====================================================
-- Migration: Passation Marché (PM) depuis Expression de Besoin
-- =====================================================

-- 1. Créer la table passation_marche
CREATE TABLE IF NOT EXISTS passation_marche (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID REFERENCES dossiers(id),
  expression_besoin_id UUID REFERENCES expressions_besoin(id),
  reference TEXT,
  
  -- Mode de passation
  mode_passation TEXT NOT NULL DEFAULT 'gre_a_gre',
  type_procedure TEXT,
  seuil_montant TEXT,
  
  -- Prestataires sollicités
  prestataires_sollicites JSONB DEFAULT '[]'::jsonb,
  
  -- Analyse des offres
  analyse_offres JSONB DEFAULT '{}'::jsonb,
  criteres_evaluation JSONB DEFAULT '[]'::jsonb,
  
  -- Documents
  pv_ouverture TEXT,
  pv_evaluation TEXT,
  rapport_analyse TEXT,
  
  -- Décision
  decision TEXT,
  prestataire_retenu_id UUID REFERENCES prestataires(id),
  montant_retenu NUMERIC(15,2),
  motif_selection TEXT,
  
  -- Statut workflow
  statut TEXT DEFAULT 'brouillon',
  exercice INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  
  -- Métadonnées
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES profiles(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  differed_at TIMESTAMPTZ,
  differed_by UUID REFERENCES profiles(id),
  motif_differe TEXT,
  date_reprise TIMESTAMPTZ,
  
  -- Pièces jointes
  pieces_jointes JSONB DEFAULT '[]'::jsonb
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_passation_marche_dossier ON passation_marche(dossier_id);
CREATE INDEX IF NOT EXISTS idx_passation_marche_eb ON passation_marche(expression_besoin_id);
CREATE INDEX IF NOT EXISTS idx_passation_marche_exercice ON passation_marche(exercice);
CREATE INDEX IF NOT EXISTS idx_passation_marche_statut ON passation_marche(statut);

-- 3. Enable RLS
ALTER TABLE passation_marche ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - simplified
CREATE POLICY "Users can read passation_marche"
ON passation_marche FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert passation_marche"
ON passation_marche FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update passation_marche"
ON passation_marche FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete draft passation_marche"
ON passation_marche FOR DELETE
USING (auth.uid() = created_by AND statut = 'brouillon');

-- 5. Trigger pour générer la référence PM automatiquement
CREATE OR REPLACE FUNCTION generate_passation_marche_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_sequence INTEGER;
  v_direction_code TEXT;
  v_exercice INTEGER;
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    v_exercice := COALESCE(NEW.exercice, EXTRACT(YEAR FROM NOW())::INTEGER);
    
    -- Obtenir le code direction via le dossier
    IF NEW.dossier_id IS NOT NULL THEN
      SELECT COALESCE(d.sigle, d.code, 'DIR') INTO v_direction_code
      FROM dossiers dos
      LEFT JOIN directions d ON d.id = dos.direction_id
      WHERE dos.id = NEW.dossier_id;
    END IF;
    
    IF v_direction_code IS NULL THEN
      v_direction_code := 'GEN';
    END IF;

    -- Séquence annuelle
    SELECT COALESCE(MAX(
      CASE 
        WHEN reference ~ 'PM-[0-9]{4}-[A-Z]+-([0-9]+)$' THEN
          CAST(SUBSTRING(reference FROM 'PM-[0-9]{4}-[A-Z]+-([0-9]+)$') AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO v_sequence
    FROM passation_marche
    WHERE exercice = v_exercice;

    NEW.reference := 'PM-' || v_exercice || '-' || v_direction_code || '-' || LPAD(v_sequence::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_generate_passation_marche_reference ON passation_marche;
CREATE TRIGGER trg_generate_passation_marche_reference
BEFORE INSERT ON passation_marche
FOR EACH ROW
EXECUTE FUNCTION generate_passation_marche_reference();

-- 6. Trigger pour mettre à jour le dossier
CREATE OR REPLACE FUNCTION update_dossier_on_passation_marche()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dossier_id IS NOT NULL THEN
    UPDATE dossiers 
    SET etape_courante = 'marche', 
        updated_at = NOW()
    WHERE id = NEW.dossier_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_dossier_on_passation_marche ON passation_marche;
CREATE TRIGGER trg_update_dossier_on_passation_marche
AFTER INSERT ON passation_marche
FOR EACH ROW
EXECUTE FUNCTION update_dossier_on_passation_marche();

-- 7. Trigger updated_at
CREATE OR REPLACE FUNCTION update_passation_marche_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_passation_marche_updated_at ON passation_marche;
CREATE TRIGGER trg_update_passation_marche_updated_at
BEFORE UPDATE ON passation_marche
FOR EACH ROW
EXECUTE FUNCTION update_passation_marche_updated_at();