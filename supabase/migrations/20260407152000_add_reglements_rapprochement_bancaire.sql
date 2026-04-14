-- =============================================================================
-- P0.1 — Rapprochement bancaire automatique des règlements
-- =============================================================================
-- Principe : un règlement n'est pas "définitivement" acquitté tant que le
-- mouvement bancaire correspondant n'a pas été constaté sur le relevé. Le
-- rapprochement bancaire est l'opération comptable qui apparie le règlement
-- (côté ARTI) avec la sortie de fonds réelle (côté banque).
--
-- Conformité : OHADA, RGCP, IPSAS — c'est l'un des piliers du contrôle
-- interne en comptabilité publique.
--
-- Architecture choisie :
--   - `mouvements_bancaires.reglement_id` devient NULLABLE → autorise
--     l'import d'un mouvement bancaire SANS règlement associé (ce sera
--     "non rapproché" tant qu'on n'a pas trouvé le règlement correspondant).
--   - On ajoute sur `reglements` 4 colonnes de tracking :
--       statut_rapprochement, mouvement_bancaire_id, rapproche_at, rapproche_par
--   - Une fonction RPC `rapprocher_reglement(reglement, mouvement)` fait le
--     lien atomique des deux côtés et met à jour les statuts.
-- =============================================================================

-- 1. Rendre nullable mouvements_bancaires.reglement_id
ALTER TABLE public.mouvements_bancaires
  ALTER COLUMN reglement_id DROP NOT NULL;

COMMENT ON COLUMN public.mouvements_bancaires.reglement_id IS
  'Règlement rapproché à ce mouvement (NULL = mouvement non encore rapproché). P0.1';

-- 2. Ajouter les colonnes de rapprochement sur reglements
ALTER TABLE public.reglements
  ADD COLUMN IF NOT EXISTS statut_rapprochement   text NOT NULL DEFAULT 'non_rapproche',
  ADD COLUMN IF NOT EXISTS mouvement_bancaire_id  uuid REFERENCES public.mouvements_bancaires(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rapproche_at           timestamptz,
  ADD COLUMN IF NOT EXISTS rapproche_par          uuid REFERENCES auth.users(id);

ALTER TABLE public.reglements
  DROP CONSTRAINT IF EXISTS reglements_statut_rapprochement_check;

ALTER TABLE public.reglements
  ADD CONSTRAINT reglements_statut_rapprochement_check
  CHECK (statut_rapprochement IN ('non_rapproche', 'rapproche_auto', 'rapproche_manuel', 'ecart_detecte'));

COMMENT ON COLUMN public.reglements.statut_rapprochement IS
  'P0.1 — État du rapprochement bancaire : non_rapproche / rapproche_auto / rapproche_manuel / ecart_detecte';
COMMENT ON COLUMN public.reglements.mouvement_bancaire_id IS
  'P0.1 — Mouvement bancaire rapproché à ce règlement (FK soft, set null si suppression)';
COMMENT ON COLUMN public.reglements.rapproche_at IS 'P0.1 — Date/heure du rapprochement';
COMMENT ON COLUMN public.reglements.rapproche_par IS 'P0.1 — Utilisateur ayant rapproché le règlement';

-- Index pour le tableau de bord "Règlements non rapprochés > 7 jours"
CREATE INDEX IF NOT EXISTS idx_reglements_non_rapproches
  ON public.reglements (date_paiement)
  WHERE statut_rapprochement = 'non_rapproche';

-- =============================================================================
-- 3. Fonction RPC : rapprocher un règlement et un mouvement bancaire
-- =============================================================================
CREATE OR REPLACE FUNCTION public.rapprocher_reglement(
  p_reglement_id uuid,
  p_mouvement_id uuid,
  p_force_ecart boolean DEFAULT false
)
RETURNS public.reglements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_reglement public.reglements;
  v_mouvement public.mouvements_bancaires;
  v_statut text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  IF NOT (
    has_role(v_user_id, 'TRESORERIE'::app_role)
    OR has_role(v_user_id, 'ADMIN'::app_role)
  ) THEN
    RAISE EXCEPTION 'Seul le Trésorier peut rapprocher un règlement';
  END IF;

  SELECT * INTO v_reglement FROM public.reglements WHERE id = p_reglement_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Règlement introuvable';
  END IF;

  SELECT * INTO v_mouvement FROM public.mouvements_bancaires WHERE id = p_mouvement_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mouvement bancaire introuvable';
  END IF;

  -- Vérification du montant : doit être strictement égal sinon ecart_detecte
  IF v_reglement.montant <> v_mouvement.montant THEN
    IF NOT p_force_ecart THEN
      RAISE EXCEPTION 'Écart détecté : règlement % FCFA vs mouvement % FCFA. Utilisez p_force_ecart=true pour forcer.',
        v_reglement.montant, v_mouvement.montant;
    END IF;
    v_statut := 'ecart_detecte';
  ELSE
    v_statut := 'rapproche_manuel';
  END IF;

  -- Mise à jour atomique des deux tables
  UPDATE public.mouvements_bancaires
  SET reglement_id = p_reglement_id,
      updated_at   = now()
  WHERE id = p_mouvement_id;

  UPDATE public.reglements
  SET mouvement_bancaire_id = p_mouvement_id,
      statut_rapprochement  = v_statut,
      rapproche_at          = now(),
      rapproche_par         = v_user_id,
      updated_at            = now()
  WHERE id = p_reglement_id
  RETURNING * INTO v_reglement;

  RETURN v_reglement;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rapprocher_reglement(uuid, uuid, boolean) TO authenticated;

COMMENT ON FUNCTION public.rapprocher_reglement(uuid, uuid, boolean) IS
  'P0.1 — Rapprocher un règlement avec un mouvement bancaire (TRESORERIE/ADMIN, vérifie montant, gère ecart_detecte)';

-- =============================================================================
-- 4. Fonction RPC : suggestion de rapprochement automatique par référence + montant
-- =============================================================================
CREATE OR REPLACE FUNCTION public.suggerer_rapprochements_auto(p_exercice integer DEFAULT NULL)
RETURNS TABLE(
  reglement_id uuid,
  reglement_numero text,
  reglement_montant numeric,
  reglement_reference text,
  mouvement_id uuid,
  mouvement_reference text,
  mouvement_montant numeric,
  match_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id   AS reglement_id,
    r.numero::text AS reglement_numero,
    r.montant AS reglement_montant,
    r.reference_paiement::text AS reglement_reference,
    m.id   AS mouvement_id,
    m.reference AS mouvement_reference,
    m.montant AS mouvement_montant,
    CASE
      WHEN r.reference_paiement IS NOT NULL
       AND m.reference = r.reference_paiement
       AND r.montant   = m.montant THEN 100
      WHEN r.montant = m.montant
       AND r.date_paiement = m.date_reglement THEN 80
      WHEN r.montant = m.montant THEN 50
      ELSE 0
    END AS match_score
  FROM public.reglements r
  CROSS JOIN public.mouvements_bancaires m
  WHERE r.statut_rapprochement = 'non_rapproche'
    AND m.reglement_id IS NULL
    AND (p_exercice IS NULL OR r.exercice = p_exercice)
    AND (
      (r.reference_paiement IS NOT NULL AND m.reference = r.reference_paiement)
      OR r.montant = m.montant
    )
  ORDER BY match_score DESC, r.date_paiement DESC;
$$;

GRANT EXECUTE ON FUNCTION public.suggerer_rapprochements_auto(integer) TO authenticated;

COMMENT ON FUNCTION public.suggerer_rapprochements_auto(integer) IS
  'P0.1 — Liste les paires (règlement, mouvement) susceptibles d''être rapprochées automatiquement, scorées 0-100';

-- =============================================================================
-- Vérification post-migration :
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='reglements' AND column_name LIKE '%rapproch%';
--   → 4 colonnes : statut_rapprochement, mouvement_bancaire_id, rapproche_at, rapproche_par
--
--   SELECT proname FROM pg_proc WHERE proname IN ('rapprocher_reglement','suggerer_rapprochements_auto');
--   → 2 lignes
-- =============================================================================
