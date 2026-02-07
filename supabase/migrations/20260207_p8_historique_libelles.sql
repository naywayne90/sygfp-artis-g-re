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
  modifie_par UUID REFERENCES auth.users(id),
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
  p_champ TEXT,
  p_nouvelle_valeur TEXT,
  p_motif TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_ancienne_valeur TEXT;
BEGIN
  -- Recuperer l'ancienne valeur
  IF p_champ = 'label' THEN
    SELECT label INTO v_ancienne_valeur FROM budget_lines WHERE id = p_budget_line_id;
  ELSIF p_champ = 'commentaire' THEN
    SELECT commentaire INTO v_ancienne_valeur FROM budget_lines WHERE id = p_budget_line_id;
  ELSE
    RAISE EXCEPTION 'Champ non supporte: %', p_champ;
  END IF;

  -- Ne rien faire si la valeur n'a pas change
  IF v_ancienne_valeur IS NOT DISTINCT FROM p_nouvelle_valeur THEN
    RETURN;
  END IF;

  -- Inserer dans l'historique
  INSERT INTO historique_libelles (budget_line_id, champ_modifie, ancienne_valeur, nouvelle_valeur, modifie_par, motif)
  VALUES (p_budget_line_id, p_champ, v_ancienne_valeur, p_nouvelle_valeur, auth.uid(), p_motif);

  -- Mettre a jour la ligne budgetaire
  IF p_champ = 'label' THEN
    UPDATE budget_lines
    SET label = p_nouvelle_valeur,
        libelle_modifie = p_nouvelle_valeur,
        date_modification = now(),
        updated_at = now()
    WHERE id = p_budget_line_id;
  ELSIF p_champ = 'commentaire' THEN
    UPDATE budget_lines
    SET commentaire = p_nouvelle_valeur,
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
