-- Prompt 5: Table lots_marche, FK, CRUD, Calculs
-- Créé le 2026-02-18

-- 1a. Colonne allotissement sur passation_marche
ALTER TABLE passation_marche ADD COLUMN IF NOT EXISTS allotissement BOOLEAN DEFAULT false;

-- 1b. Table lots_marche
CREATE TABLE IF NOT EXISTS lots_marche (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passation_marche_id UUID NOT NULL REFERENCES passation_marche(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL DEFAULT 1,
  designation TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  montant_estime NUMERIC(15,2) DEFAULT 0,
  montant_retenu NUMERIC(15,2),
  prestataire_retenu_id UUID REFERENCES prestataires(id),
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'attribue', 'annule', 'infructueux')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(passation_marche_id, numero)
);

-- 1c. Index + trigger updated_at
CREATE INDEX IF NOT EXISTS idx_lots_marche_passation ON lots_marche(passation_marche_id);
CREATE INDEX IF NOT EXISTS idx_lots_marche_statut ON lots_marche(statut);

CREATE TRIGGER trg_lots_marche_updated_at
  BEFORE UPDATE ON lots_marche
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 1d. RLS Policies
ALTER TABLE lots_marche ENABLE ROW LEVEL SECURITY;

-- SELECT: tous les authentifiés voient les lots des passations qu'ils peuvent voir
CREATE POLICY "lots_select" ON lots_marche FOR SELECT TO authenticated
  USING (passation_marche_id IN (SELECT id FROM passation_marche));

-- INSERT: créateur de la passation ou admin
CREATE POLICY "lots_insert" ON lots_marche FOR INSERT TO authenticated
  WITH CHECK (passation_marche_id IN (
    SELECT id FROM passation_marche WHERE created_by = auth.uid()
  ) OR has_role(auth.uid(), 'ADMIN'::app_role));

-- UPDATE: créateur de la passation ou admin
CREATE POLICY "lots_update" ON lots_marche FOR UPDATE TO authenticated
  USING (passation_marche_id IN (
    SELECT id FROM passation_marche WHERE created_by = auth.uid()
  ) OR has_role(auth.uid(), 'ADMIN'::app_role));

-- DELETE: créateur ou admin
CREATE POLICY "lots_delete" ON lots_marche FOR DELETE TO authenticated
  USING (passation_marche_id IN (
    SELECT id FROM passation_marche WHERE created_by = auth.uid()
  ) OR has_role(auth.uid(), 'ADMIN'::app_role));

-- 1e. Migration données existantes (JSONB → table)
INSERT INTO lots_marche (passation_marche_id, numero, designation, description, montant_estime, statut)
SELECT pm.id,
  (lot->>'numero')::integer,
  COALESCE(lot->>'designation', ''),
  COALESCE(lot->>'description', ''),
  COALESCE((lot->>'montant_estime')::numeric, 0),
  COALESCE(lot->>'statut', 'en_cours')
FROM passation_marche pm, jsonb_array_elements(pm.analyse_offres->'lots') AS lot
WHERE pm.analyse_offres->'lots' IS NOT NULL
  AND jsonb_array_length(pm.analyse_offres->'lots') > 0
ON CONFLICT (passation_marche_id, numero) DO NOTHING;

UPDATE passation_marche
SET allotissement = COALESCE((analyse_offres->>'allotissement')::boolean, false)
WHERE analyse_offres IS NOT NULL;
