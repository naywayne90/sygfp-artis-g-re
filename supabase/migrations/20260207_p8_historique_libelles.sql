-- ============================================================
-- P8: Historique des modifications de libelles budgetaires
-- Migration: 20260207_p8_historique_libelles.sql
-- ============================================================
-- Schema reel budget_lines:
--   label TEXT (pas "libelle"), commentaire TEXT
--   libelle_modifie TEXT, date_modification TIMESTAMPTZ
-- ============================================================

-- Table pour tracer les modifications de libelles budgetaires
CREATE TABLE IF NOT EXISTS historique_libelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_line_id UUID REFERENCES budget_lines(id) ON DELETE SET NULL,
  champ_modifie TEXT NOT NULL, -- 'label', 'commentaire', etc.
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,
  modifie_par UUID REFERENCES profiles(id),
  motif TEXT, -- Justification du changement
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historique_libelles_budget_line ON historique_libelles(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_historique_libelles_created_at ON historique_libelles(created_at DESC);

-- RLS
ALTER TABLE historique_libelles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins et DAAF peuvent voir l historique"
  ON historique_libelles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.profil_fonctionnel IN ('Admin', 'ADMIN', 'Validateur', 'Auditeur')
    )
  );

CREATE POLICY "Admins et DAAF peuvent inserer"
  ON historique_libelles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.profil_fonctionnel IN ('Admin', 'ADMIN', 'Validateur')
    )
  );

-- ============================================================
-- RPC pour modifier un libelle avec tracabilite
-- Champs supportes: 'label', 'commentaire'
-- ============================================================
CREATE OR REPLACE FUNCTION update_budget_libelle(
  p_budget_line_id UUID,
  p_field_name TEXT,
  p_new_value TEXT,
  p_motif TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_ancienne_valeur TEXT;
  v_champ TEXT;
BEGIN
  -- Map field names: 'libelle' -> 'label', 'description' -> 'commentaire'
  IF p_field_name = 'libelle' OR p_field_name = 'label' THEN
    v_champ := 'label';
    SELECT label INTO v_ancienne_valeur FROM budget_lines WHERE id = p_budget_line_id;
  ELSIF p_field_name = 'description' OR p_field_name = 'commentaire' THEN
    v_champ := 'commentaire';
    SELECT commentaire INTO v_ancienne_valeur FROM budget_lines WHERE id = p_budget_line_id;
  ELSE
    RAISE EXCEPTION 'Champ non supporte: %', p_field_name;
  END IF;

  -- Ne rien faire si la valeur n'a pas change
  IF v_ancienne_valeur IS NOT DISTINCT FROM p_new_value THEN
    RETURN;
  END IF;

  -- Inserer dans l'historique
  INSERT INTO historique_libelles (budget_line_id, champ_modifie, ancienne_valeur, nouvelle_valeur, modifie_par, motif)
  VALUES (p_budget_line_id, v_champ, v_ancienne_valeur, p_new_value, auth.uid(), p_motif);

  -- Mettre a jour la ligne budgetaire
  IF v_champ = 'label' THEN
    UPDATE budget_lines
    SET label = p_new_value,
        libelle_modifie = p_new_value,
        date_modification = now(),
        updated_at = now()
    WHERE id = p_budget_line_id;
  ELSIF v_champ = 'commentaire' THEN
    UPDATE budget_lines
    SET commentaire = p_new_value,
        updated_at = now()
    WHERE id = p_budget_line_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC pour recuperer l'historique d'une ligne budgetaire
-- ============================================================
CREATE OR REPLACE FUNCTION get_libelle_history(p_budget_line_id UUID)
RETURNS TABLE (
  id UUID,
  champ_modifie TEXT,
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,
  modifie_par_nom TEXT,
  motif TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hl.id,
    hl.champ_modifie,
    hl.ancienne_valeur,
    hl.nouvelle_valeur,
    p.full_name AS modifie_par_nom,
    hl.motif,
    hl.created_at
  FROM historique_libelles hl
  LEFT JOIN profiles p ON p.id = hl.modifie_par
  WHERE hl.budget_line_id = p_budget_line_id
  ORDER BY hl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
