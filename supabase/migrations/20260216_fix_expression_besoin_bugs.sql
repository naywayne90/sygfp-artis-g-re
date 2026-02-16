-- Prompt 3: Fix Expression de Besoin bugs B7, B8, P0-4
-- B7: Fix check_marche_prerequisites comparing 'validee' instead of 'valide'
-- B8: Fix v_expressions_besoin_stats view using accented values
-- P0-4: Drop conflicting triggers on expressions_besoin

-- B7: Drop and recreate function with correct statut value
DROP FUNCTION IF EXISTS check_marche_prerequisites(UUID);

CREATE OR REPLACE FUNCTION check_marche_prerequisites(p_marche_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_all_valid BOOLEAN;
BEGIN
  SELECT bool_and(statut = 'valide')
  INTO v_all_valid
  FROM expressions_besoin
  WHERE marche_id = p_marche_id;
  RETURN COALESCE(v_all_valid, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B8: Recreate stats view with accent-free statut values
DROP VIEW IF EXISTS v_expressions_besoin_stats;

CREATE OR REPLACE VIEW v_expressions_besoin_stats AS
SELECT
  exercice,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE statut = 'brouillon') AS brouillons,
  COUNT(*) FILTER (WHERE statut = 'soumis') AS soumis,
  COUNT(*) FILTER (WHERE statut = 'valide') AS valides,
  COUNT(*) FILTER (WHERE statut = 'rejete') AS rejetes,
  COUNT(*) FILTER (WHERE statut = 'differe') AS differes,
  COUNT(*) FILTER (WHERE statut = 'satisfaite') AS satisfaites,
  COALESCE(SUM(montant_estime), 0) AS montant_total,
  COALESCE(SUM(montant_estime) FILTER (WHERE statut = 'valide'), 0) AS montant_valides
FROM expressions_besoin
GROUP BY exercice;

-- P0-4: Drop conflicting triggers that cause duplicate numero generation
DROP TRIGGER IF EXISTS set_expression_besoin_numero ON expressions_besoin;
DROP TRIGGER IF EXISTS trg_generate_expression_besoin_reference ON expressions_besoin;
