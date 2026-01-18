-- ============================================
-- MIGRATION: Amélioration gestion comptes bancaires
-- ============================================
-- Ajoute les contraintes et fonctions pour:
-- - Validation unicité (numero_compte + banque)
-- - Protection contre la suppression si mouvements
-- - Soft-delete via statut
-- ============================================

-- 1. Ajouter contrainte unique sur (numero_compte, banque)
-- Note: Les valeurs NULL sont permises pour numero_compte
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_numero_compte_banque'
  ) THEN
    -- Créer un index unique partiel (seulement quand numero_compte n'est pas null)
    CREATE UNIQUE INDEX unique_numero_compte_banque
    ON public.comptes_bancaires (numero_compte, banque)
    WHERE numero_compte IS NOT NULL AND banque IS NOT NULL;
  END IF;
END $$;

-- 2. Ajouter colonne pour tracking des mouvements (optionnel pour soft-delete)
ALTER TABLE public.comptes_bancaires
ADD COLUMN IF NOT EXISTS has_movements BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- 3. Fonction pour vérifier si un compte a des mouvements
CREATE OR REPLACE FUNCTION check_compte_has_movements(p_compte_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_movements BOOLEAN := false;
BEGIN
  -- Vérifier opérations de trésorerie
  IF EXISTS (
    SELECT 1 FROM public.operations_tresorerie
    WHERE compte_id = p_compte_id OR compte_destination_id = p_compte_id
  ) THEN
    v_has_movements := true;
  END IF;

  -- Vérifier règlements
  IF NOT v_has_movements AND EXISTS (
    SELECT 1 FROM public.reglements
    WHERE compte_id = p_compte_id
  ) THEN
    v_has_movements := true;
  END IF;

  -- Vérifier recettes
  IF NOT v_has_movements AND EXISTS (
    SELECT 1 FROM public.recettes
    WHERE compte_id = p_compte_id
  ) THEN
    v_has_movements := true;
  END IF;

  RETURN v_has_movements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour désactiver un compte (pas supprimer)
CREATE OR REPLACE FUNCTION deactivate_compte_bancaire(
  p_compte_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS public.comptes_bancaires AS $$
DECLARE
  v_compte public.comptes_bancaires;
BEGIN
  -- Mettre à jour le compte
  UPDATE public.comptes_bancaires
  SET
    est_actif = false,
    deactivated_at = NOW(),
    deactivated_by = auth.uid(),
    deactivation_reason = COALESCE(p_reason, 'Désactivation manuelle'),
    updated_at = NOW()
  WHERE id = p_compte_id
  RETURNING * INTO v_compte;

  IF v_compte IS NULL THEN
    RAISE EXCEPTION 'Compte non trouvé: %', p_compte_id;
  END IF;

  RETURN v_compte;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour réactiver un compte
CREATE OR REPLACE FUNCTION reactivate_compte_bancaire(
  p_compte_id UUID
) RETURNS public.comptes_bancaires AS $$
DECLARE
  v_compte public.comptes_bancaires;
BEGIN
  UPDATE public.comptes_bancaires
  SET
    est_actif = true,
    deactivated_at = NULL,
    deactivated_by = NULL,
    deactivation_reason = NULL,
    updated_at = NOW()
  WHERE id = p_compte_id
  RETURNING * INTO v_compte;

  IF v_compte IS NULL THEN
    RAISE EXCEPTION 'Compte non trouvé: %', p_compte_id;
  END IF;

  RETURN v_compte;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger pour bloquer suppression si mouvements
CREATE OR REPLACE FUNCTION prevent_compte_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF check_compte_has_movements(OLD.id) THEN
    RAISE EXCEPTION 'Impossible de supprimer ce compte: des mouvements y sont associés. Utilisez la désactivation à la place.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_compte_deletion ON public.comptes_bancaires;
CREATE TRIGGER trigger_prevent_compte_deletion
  BEFORE DELETE ON public.comptes_bancaires
  FOR EACH ROW
  EXECUTE FUNCTION prevent_compte_deletion();

-- 7. Vue pour les comptes actifs uniquement (pour les sélecteurs)
CREATE OR REPLACE VIEW v_comptes_bancaires_actifs AS
SELECT
  id,
  code,
  libelle,
  banque,
  numero_compte,
  iban,
  bic,
  solde_initial,
  solde_actuel,
  devise,
  type_compte
FROM public.comptes_bancaires
WHERE est_actif = true
ORDER BY code;

-- 8. Index pour performance
CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_est_actif
ON public.comptes_bancaires(est_actif);

CREATE INDEX IF NOT EXISTS idx_comptes_bancaires_banque
ON public.comptes_bancaires(banque);

-- 9. Mettre à jour has_movements pour les comptes existants
UPDATE public.comptes_bancaires
SET has_movements = check_compte_has_movements(id);

-- Commenter les objets
COMMENT ON FUNCTION check_compte_has_movements IS 'Vérifie si un compte bancaire a des mouvements associés';
COMMENT ON FUNCTION deactivate_compte_bancaire IS 'Désactive un compte bancaire (soft-delete)';
COMMENT ON FUNCTION reactivate_compte_bancaire IS 'Réactive un compte bancaire désactivé';
COMMENT ON VIEW v_comptes_bancaires_actifs IS 'Vue des comptes bancaires actifs pour les sélecteurs';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
