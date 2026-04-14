-- =============================================================================
-- P2 — Intégration et traçabilité du module Règlement (2026-04-07)
-- =============================================================================
-- Objectifs :
--   1. Vue `reglements_chain_view` : remonte la chaîne complète pour un règlement
--        engagement → liquidation → ordonnancement → règlement → mouvement bancaire
--   2. RPC `get_reglement_traceability(reglement_id)` : renvoie un timeline jsonb
--      d'événements datés (création, validation, visa, paiement, rapprochement)
--   3. RPC `get_reglements_delais(exercice)` : métriques P50/P90 des délais
--      (ordonnancement→visa, visa→paiement, paiement→rapprochement)
--
-- Conformité : OHADA/IPSAS — indicateurs de performance du contrôle interne
-- et base de reporting pour l'Auditeur interne et la Direction Générale.
-- =============================================================================

-- =============================================================================
-- 1. VUE reglements_chain_view (lecture seule, join complet de la chaîne)
-- =============================================================================
CREATE OR REPLACE VIEW public.reglements_chain_view
WITH (security_invoker = true) AS
SELECT
  r.id                           AS reglement_id,
  r.numero                       AS reglement_numero,
  r.montant                      AS reglement_montant,
  r.date_paiement,
  r.mode_paiement,
  r.reference_paiement,
  r.statut                       AS reglement_statut,
  r.vise_at,
  r.vise_par,
  r.vise_hash,
  r.statut_rapprochement,
  r.rapproche_at,
  r.rapproche_par,
  r.mouvement_bancaire_id,
  r.created_at                   AS reglement_created_at,
  r.created_by                   AS reglement_created_by,
  -- ordonnancement
  o.id                           AS ordonnancement_id,
  o.numero                       AS ordonnancement_numero,
  o.montant                      AS ordonnancement_montant,
  o.montant_paye                 AS ordonnancement_montant_paye,
  o.is_locked                    AS ordonnancement_is_locked,
  o.statut                       AS ordonnancement_statut,
  o.created_at                   AS ordonnancement_created_at,
  o.validated_at                 AS ordonnancement_validated_at,
  o.validated_by                 AS ordonnancement_validated_by,
  -- liquidation
  l.id                           AS liquidation_id,
  l.numero                       AS liquidation_numero,
  l.montant                      AS liquidation_montant,
  l.date_liquidation,
  l.statut                       AS liquidation_statut,
  -- engagement
  e.id                           AS engagement_id,
  e.numero                       AS engagement_numero,
  e.montant                      AS engagement_montant,
  e.date_engagement,
  e.statut                       AS engagement_statut,
  e.dossier_id                   AS engagement_dossier_id,
  -- mouvement bancaire
  m.id                           AS mouvement_id,
  m.reference                    AS mouvement_reference,
  m.montant                      AS mouvement_montant,
  m.date_reglement               AS mouvement_date
FROM public.reglements r
LEFT JOIN public.ordonnancements     o ON o.id = r.ordonnancement_id
LEFT JOIN public.budget_liquidations l ON l.id = o.liquidation_id
LEFT JOIN public.budget_engagements  e ON e.id = l.engagement_id
LEFT JOIN public.mouvements_bancaires m ON m.id = r.mouvement_bancaire_id;

COMMENT ON VIEW public.reglements_chain_view IS
  'P2.1 — Vue dénormalisée : engagement → liquidation → ordonnancement → règlement → mouvement bancaire. security_invoker ⇒ hérite de la RLS des tables sources.';

-- =============================================================================
-- 2. RPC get_reglement_traceability : timeline d'événements pour un règlement
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_reglement_traceability(p_reglement_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_chain   public.reglements_chain_view;
  v_events  jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_chain
  FROM public.reglements_chain_view
  WHERE reglement_id = p_reglement_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Règlement introuvable ou inaccessible');
  END IF;

  -- 1. Engagement
  IF v_chain.engagement_id IS NOT NULL THEN
    v_events := v_events || jsonb_build_array(jsonb_build_object(
      'step',  'engagement',
      'at',    v_chain.date_engagement,
      'label', 'Engagement ' || COALESCE(v_chain.engagement_numero, '—'),
      'montant', v_chain.engagement_montant,
      'statut', v_chain.engagement_statut,
      'ref_id', v_chain.engagement_id
    ));
  END IF;

  -- 2. Liquidation
  IF v_chain.liquidation_id IS NOT NULL THEN
    v_events := v_events || jsonb_build_array(jsonb_build_object(
      'step',  'liquidation',
      'at',    v_chain.date_liquidation,
      'label', 'Liquidation ' || COALESCE(v_chain.liquidation_numero, '—'),
      'montant', v_chain.liquidation_montant,
      'statut', v_chain.liquidation_statut,
      'ref_id', v_chain.liquidation_id
    ));
  END IF;

  -- 3. Ordonnancement créé
  IF v_chain.ordonnancement_id IS NOT NULL THEN
    v_events := v_events || jsonb_build_array(jsonb_build_object(
      'step',  'ordonnancement_cree',
      'at',    v_chain.ordonnancement_created_at,
      'label', 'Ordonnancement ' || COALESCE(v_chain.ordonnancement_numero, '—') || ' créé',
      'montant', v_chain.ordonnancement_montant,
      'ref_id', v_chain.ordonnancement_id
    ));
    -- 3b. Ordonnancement validé
    IF v_chain.ordonnancement_validated_at IS NOT NULL THEN
      v_events := v_events || jsonb_build_array(jsonb_build_object(
        'step',  'ordonnancement_valide',
        'at',    v_chain.ordonnancement_validated_at,
        'label', 'Ordonnancement validé',
        'actor', v_chain.ordonnancement_validated_by,
        'ref_id', v_chain.ordonnancement_id
      ));
    END IF;
  END IF;

  -- 4. Règlement créé (soumis par Trésorier)
  v_events := v_events || jsonb_build_array(jsonb_build_object(
    'step',  'reglement_cree',
    'at',    v_chain.reglement_created_at,
    'label', 'Règlement ' || COALESCE(v_chain.reglement_numero, '—') || ' émis',
    'montant', v_chain.reglement_montant,
    'mode',    v_chain.mode_paiement,
    'actor',   v_chain.reglement_created_by,
    'ref_id',  v_chain.reglement_id
  ));

  -- 5. Visa numérique (P0.3)
  IF v_chain.vise_at IS NOT NULL THEN
    v_events := v_events || jsonb_build_array(jsonb_build_object(
      'step',  'visa',
      'at',    v_chain.vise_at,
      'label', 'Visa numérique du Trésorier',
      'actor', v_chain.vise_par,
      'hash',  v_chain.vise_hash,
      'ref_id', v_chain.reglement_id
    ));
  END IF;

  -- 6. Paiement (date_paiement)
  IF v_chain.date_paiement IS NOT NULL THEN
    v_events := v_events || jsonb_build_array(jsonb_build_object(
      'step',  'paiement',
      'at',    v_chain.date_paiement,
      'label', 'Décaissement effectif',
      'montant', v_chain.reglement_montant,
      'ref',     v_chain.reference_paiement,
      'ref_id',  v_chain.reglement_id
    ));
  END IF;

  -- 7. Rapprochement bancaire (P0.1)
  IF v_chain.rapproche_at IS NOT NULL THEN
    v_events := v_events || jsonb_build_array(jsonb_build_object(
      'step',  'rapprochement',
      'at',    v_chain.rapproche_at,
      'label', 'Rapproché avec mouvement bancaire ' || COALESCE(v_chain.mouvement_reference, '—'),
      'statut_rapprochement', v_chain.statut_rapprochement,
      'actor', v_chain.rapproche_par,
      'ref_id', v_chain.mouvement_id
    ));
  END IF;

  RETURN jsonb_build_object(
    'reglement_id', p_reglement_id,
    'chain',        row_to_json(v_chain),
    'events',       v_events,
    'computed_at',  now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_reglement_traceability(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_reglement_traceability(uuid) IS
  'P2.1 — Renvoie la chaîne complète + timeline ordonnée des événements pour un règlement (engagement → rapprochement).';

-- =============================================================================
-- 3. RPC get_reglements_delais : métriques de performance (P50/P90)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_reglements_delais(p_exercice integer DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      r.id,
      r.exercice,
      r.vise_at,
      r.date_paiement,
      r.rapproche_at,
      o.validated_at                 AS ord_validated_at,
      -- délai ordonnancement validé → visa (en heures)
      CASE
        WHEN r.vise_at IS NOT NULL AND o.validated_at IS NOT NULL
        THEN GREATEST(EXTRACT(EPOCH FROM (r.vise_at - o.validated_at)) / 3600.0, 0)
      END AS h_ord_to_visa,
      -- délai visa → paiement (en heures) — date_paiement est une date, pas un timestamp
      CASE
        WHEN r.vise_at IS NOT NULL AND r.date_paiement IS NOT NULL
        THEN GREATEST(EXTRACT(EPOCH FROM (r.date_paiement::timestamptz - r.vise_at)) / 3600.0, 0)
      END AS h_visa_to_paiement,
      -- délai paiement → rapprochement (en heures)
      CASE
        WHEN r.rapproche_at IS NOT NULL AND r.date_paiement IS NOT NULL
        THEN GREATEST(EXTRACT(EPOCH FROM (r.rapproche_at - r.date_paiement::timestamptz)) / 3600.0, 0)
      END AS h_paiement_to_rapprochement
    FROM public.reglements r
    LEFT JOIN public.ordonnancements o ON o.id = r.ordonnancement_id
    WHERE (p_exercice IS NULL OR r.exercice = p_exercice)
      AND r.statut <> 'rejete'
  )
  SELECT jsonb_build_object(
    'exercice', p_exercice,
    'total_reglements', COUNT(*),
    'total_vises',           COUNT(*) FILTER (WHERE vise_at IS NOT NULL),
    'total_payes',           COUNT(*) FILTER (WHERE date_paiement IS NOT NULL),
    'total_rapproches',      COUNT(*) FILTER (WHERE rapproche_at IS NOT NULL),
    'ord_to_visa_h', jsonb_build_object(
      'count',  COUNT(h_ord_to_visa),
      'avg',    ROUND(AVG(h_ord_to_visa)::numeric, 1),
      'p50',    ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY h_ord_to_visa)::numeric, 1),
      'p90',    ROUND(percentile_cont(0.9) WITHIN GROUP (ORDER BY h_ord_to_visa)::numeric, 1),
      'max',    ROUND(MAX(h_ord_to_visa)::numeric, 1)
    ),
    'visa_to_paiement_h', jsonb_build_object(
      'count',  COUNT(h_visa_to_paiement),
      'avg',    ROUND(AVG(h_visa_to_paiement)::numeric, 1),
      'p50',    ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY h_visa_to_paiement)::numeric, 1),
      'p90',    ROUND(percentile_cont(0.9) WITHIN GROUP (ORDER BY h_visa_to_paiement)::numeric, 1),
      'max',    ROUND(MAX(h_visa_to_paiement)::numeric, 1)
    ),
    'paiement_to_rapprochement_h', jsonb_build_object(
      'count',  COUNT(h_paiement_to_rapprochement),
      'avg',    ROUND(AVG(h_paiement_to_rapprochement)::numeric, 1),
      'p50',    ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY h_paiement_to_rapprochement)::numeric, 1),
      'p90',    ROUND(percentile_cont(0.9) WITHIN GROUP (ORDER BY h_paiement_to_rapprochement)::numeric, 1),
      'max',    ROUND(MAX(h_paiement_to_rapprochement)::numeric, 1)
    ),
    'computed_at', now()
  )
  FROM base;
$$;

GRANT EXECUTE ON FUNCTION public.get_reglements_delais(integer) TO authenticated;

COMMENT ON FUNCTION public.get_reglements_delais(integer) IS
  'P2.2 — Métriques de performance du circuit règlement : P50/P90/max des délais ordonnancement→visa→paiement→rapprochement (en heures).';

-- =============================================================================
-- Vérifications post-migration :
--
--   SELECT 'view' AS kind, schemaname||'.'||viewname AS obj FROM pg_views WHERE viewname='reglements_chain_view'
--   UNION ALL
--   SELECT 'function', proname FROM pg_proc WHERE proname IN ('get_reglement_traceability','get_reglements_delais');
--   → 3 lignes
-- =============================================================================
