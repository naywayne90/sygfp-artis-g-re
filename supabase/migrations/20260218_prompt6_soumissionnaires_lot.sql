-- Prompt 6: Table soumissionnaires_lot pour les soumissionnaires par lot/passation
-- Lien: passation_marche_id (toujours), lot_marche_id (si alloti)

-- 1. Table soumissionnaires_lot
CREATE TABLE IF NOT EXISTS soumissionnaires_lot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passation_marche_id UUID NOT NULL REFERENCES passation_marche(id) ON DELETE CASCADE,
  lot_marche_id UUID REFERENCES lots_marche(id) ON DELETE CASCADE,
  -- Prestataire (nullable si saisie manuelle)
  prestataire_id UUID REFERENCES prestataires(id),
  is_manual_entry BOOLEAN DEFAULT false,
  -- Infos entreprise (toujours renseignees, meme si prestataire_id est set)
  raison_sociale TEXT NOT NULL,
  contact_nom TEXT,
  email TEXT,
  telephone TEXT,
  rccm TEXT,
  -- Offres
  offre_technique_url TEXT,
  offre_financiere NUMERIC(18,2),
  date_depot TIMESTAMPTZ,
  -- Evaluation
  note_technique NUMERIC(5,2),
  note_financiere NUMERIC(5,2),
  -- Workflow: recu -> conforme -> qualifie -> retenu / elimine
  statut TEXT NOT NULL DEFAULT 'recu' CHECK (statut IN ('recu', 'conforme', 'qualifie', 'retenu', 'elimine')),
  motif_elimination TEXT,
  observations TEXT,
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_soum_lot_passation ON soumissionnaires_lot(passation_marche_id);
CREATE INDEX IF NOT EXISTS idx_soum_lot_lot ON soumissionnaires_lot(lot_marche_id);
CREATE INDEX IF NOT EXISTS idx_soum_lot_prestataire ON soumissionnaires_lot(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_soum_lot_statut ON soumissionnaires_lot(statut);

-- 3. Trigger updated_at
CREATE TRIGGER trg_soumissionnaires_lot_updated_at
  BEFORE UPDATE ON soumissionnaires_lot
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. RLS Policies
ALTER TABLE soumissionnaires_lot ENABLE ROW LEVEL SECURITY;

-- SELECT: tous les authentifies
CREATE POLICY "soum_lot_select" ON soumissionnaires_lot FOR SELECT TO authenticated
  USING (passation_marche_id IN (SELECT id FROM passation_marche));

-- INSERT: createur de la passation ou admin
CREATE POLICY "soum_lot_insert" ON soumissionnaires_lot FOR INSERT TO authenticated
  WITH CHECK (passation_marche_id IN (
    SELECT id FROM passation_marche WHERE created_by = auth.uid()
  ) OR has_role(auth.uid(), 'ADMIN'::app_role));

-- UPDATE: createur de la passation ou admin
CREATE POLICY "soum_lot_update" ON soumissionnaires_lot FOR UPDATE TO authenticated
  USING (passation_marche_id IN (
    SELECT id FROM passation_marche WHERE created_by = auth.uid()
  ) OR has_role(auth.uid(), 'ADMIN'::app_role));

-- DELETE: createur ou admin
CREATE POLICY "soum_lot_delete" ON soumissionnaires_lot FOR DELETE TO authenticated
  USING (passation_marche_id IN (
    SELECT id FROM passation_marche WHERE created_by = auth.uid()
  ) OR has_role(auth.uid(), 'ADMIN'::app_role));
