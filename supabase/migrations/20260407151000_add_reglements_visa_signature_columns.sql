-- =============================================================================
-- P0.3 — Visa & Signature numérique du Trésorier (RGCP, OHADA)
-- =============================================================================
-- Principe : avant d'être effectivement payé, un règlement doit être "visé"
-- par le trésorier (comptable public). Le visa est :
--   1. nominatif (vise_par)
--   2. horodaté (vise_at)
--   3. lié à un hash SHA-256 du payload canonique du règlement (vise_hash)
--      → preuve d'intégrité, non-répudiation, ré-vérifiable à l'audit.
--
-- Statuts du règlement :
--   - 'soumis'    : créé, en attente du visa du trésorier
--   - 'vise'      : visé numériquement, prêt pour décaissement
--   - 'enregistre': décaissement effectif (statut historique conservé)
--   - 'rapproche' : rapproché avec le mouvement bancaire (P0.1)
--   - 'rejete'    : rejeté (motif obligatoire)
--
-- Le `vise_hash` est calculé côté frontend (subtle.crypto SHA-256) sur un
-- payload canonique du règlement (id, montant, beneficiaire, date_paiement,
-- mode_paiement, reference_paiement) → conservé en DB → ré-vérifiable.
-- =============================================================================

ALTER TABLE public.reglements
  ADD COLUMN IF NOT EXISTS vise_par   uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS vise_at    timestamptz,
  ADD COLUMN IF NOT EXISTS vise_hash  text,
  ADD COLUMN IF NOT EXISTS vise_ip    text;

COMMENT ON COLUMN public.reglements.vise_par  IS 'Trésorier ayant apposé le visa numérique (P0.3)';
COMMENT ON COLUMN public.reglements.vise_at   IS 'Date/heure du visa numérique';
COMMENT ON COLUMN public.reglements.vise_hash IS 'Hash SHA-256 du payload canonique au moment du visa (preuve intégrité)';
COMMENT ON COLUMN public.reglements.vise_ip   IS 'Adresse IP utilisée pour apposer le visa (audit non-répudiation)';

-- Contrainte d'intégrité : si l'un des champs visa est rempli, les 3 essentiels le sont
ALTER TABLE public.reglements
  DROP CONSTRAINT IF EXISTS reglements_visa_consistency;

ALTER TABLE public.reglements
  ADD CONSTRAINT reglements_visa_consistency
  CHECK (
    (vise_par IS NULL AND vise_at IS NULL AND vise_hash IS NULL)
    OR
    (vise_par IS NOT NULL AND vise_at IS NOT NULL AND vise_hash IS NOT NULL)
  );

-- Index pour le suivi "règlements en attente de visa"
CREATE INDEX IF NOT EXISTS idx_reglements_statut_vise
  ON public.reglements (statut)
  WHERE vise_at IS NULL;

-- Index pour le tableau de bord trésorier (mes visas)
CREATE INDEX IF NOT EXISTS idx_reglements_vise_par
  ON public.reglements (vise_par, vise_at DESC)
  WHERE vise_par IS NOT NULL;

-- =============================================================================
-- Fonction RPC : visa numérique d'un règlement
-- =============================================================================
CREATE OR REPLACE FUNCTION public.viser_reglement(
  p_reglement_id uuid,
  p_payload_hash text,
  p_ip text DEFAULT NULL
)
RETURNS public.reglements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result  public.reglements;
BEGIN
  -- 1. Auth check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  -- 2. Rôle check : seul TRESORERIE ou ADMIN peut viser
  IF NOT (
    has_role(v_user_id, 'TRESORERIE'::app_role)
    OR has_role(v_user_id, 'ADMIN'::app_role)
  ) THEN
    RAISE EXCEPTION 'Seul le Trésorier peut viser un règlement';
  END IF;

  -- 3. Validation du hash
  IF p_payload_hash IS NULL OR length(p_payload_hash) < 32 THEN
    RAISE EXCEPTION 'Hash de visa invalide (SHA-256 attendu)';
  END IF;

  -- 4. Le règlement doit exister et ne pas être déjà visé
  IF NOT EXISTS (SELECT 1 FROM public.reglements WHERE id = p_reglement_id) THEN
    RAISE EXCEPTION 'Règlement introuvable';
  END IF;

  IF EXISTS (SELECT 1 FROM public.reglements WHERE id = p_reglement_id AND vise_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Règlement déjà visé';
  END IF;

  -- 5. Apposer le visa
  UPDATE public.reglements
  SET vise_par   = v_user_id,
      vise_at    = now(),
      vise_hash  = p_payload_hash,
      vise_ip    = p_ip,
      statut     = 'vise',
      updated_at = now()
  WHERE id = p_reglement_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.viser_reglement(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.viser_reglement(uuid, text, text) IS
  'P0.3 — Apposer le visa numérique trésorier sur un règlement (SECURITY DEFINER, contrôle TRESORERIE/ADMIN, hash SHA-256 obligatoire)';

-- =============================================================================
-- Vérification post-migration :
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='reglements' AND column_name LIKE 'vise%';
--   → 4 lignes : vise_par, vise_at, vise_hash, vise_ip
--
--   SELECT proname FROM pg_proc WHERE proname='viser_reglement';
--   → 1 ligne
-- =============================================================================
