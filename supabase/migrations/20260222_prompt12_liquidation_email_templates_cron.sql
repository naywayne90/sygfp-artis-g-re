-- ===========================================================================
-- Prompt 12 Backend : Templates email liquidation + RPC alertes + pg_cron
-- Date : 22 février 2026
-- ===========================================================================

-- ============================================================================
-- 0. Élargir la contrainte CHECK type_evenement pour accepter les types liquidation
-- ============================================================================

ALTER TABLE notification_templates DROP CONSTRAINT IF EXISTS notification_templates_type_evenement_check;

ALTER TABLE notification_templates ADD CONSTRAINT notification_templates_type_evenement_check
CHECK (type_evenement = ANY (ARRAY[
  'ordonnancement'::text, 'reglement'::text, 'reglement_partiel'::text,
  'note_soumise'::text, 'note_validee'::text, 'note_rejetee'::text,
  'engagement_cree'::text, 'liquidation_validee'::text,
  'imputation_soumise'::text, 'imputation_validee'::text, 'imputation_rejetee'::text,
  'marche_publie'::text, 'marche_cloture'::text, 'marche_en_evaluation'::text,
  'marche_attribue'::text, 'marche_approuve'::text, 'marche_rejete'::text,
  'marche_signe'::text, 'marche_annule'::text,
  -- Engagement types (Prompt 11)
  'engagement_soumis'::text, 'engagement_visa'::text,
  'engagement_valide'::text, 'engagement_rejete'::text,
  'engagement_degage'::text, 'engagement_differe'::text,
  -- Liquidation types (Prompt 12)
  'liquidation_soumise'::text, 'liquidation_visa_daaf'::text,
  'liquidation_visa_dg'::text, 'liquidation_rejetee'::text,
  'liquidation_differee'::text, 'liquidation_urgente'::text
]));

-- ============================================================================
-- 1. Templates email liquidation dans notification_templates
-- ============================================================================

INSERT INTO notification_templates (code, type_evenement, titre_template, corps_template, variables_disponibles, est_actif)
VALUES
  ('LIQUIDATION_SOUMISE', 'liquidation_soumise',
   'Liquidation soumise — {{numero}}',
   'La liquidation n° {{numero}} relative à l''engagement {{objet_engagement}} d''un montant TTC de {{montant}} FCFA (net à payer : {{net_a_payer}} FCFA) a été soumise pour validation par {{createur}}. Direction : {{direction}}. Fournisseur : {{fournisseur}}.',
   '["numero", "objet_engagement", "montant", "net_a_payer", "createur", "direction", "fournisseur", "date"]'::jsonb,
   true),

  ('LIQUIDATION_VISA_DAAF', 'liquidation_visa_daaf',
   'Visa DAAF accordé — Liquidation {{numero}}',
   'Le visa DAAF de la liquidation n° {{numero}} d''un montant TTC de {{montant}} FCFA (net à payer : {{net_a_payer}} FCFA) a été accordé par {{validateur}}. Direction : {{direction}}. La liquidation est maintenant en attente de validation DG.',
   '["numero", "montant", "net_a_payer", "validateur", "direction", "date"]'::jsonb,
   true),

  ('LIQUIDATION_VISA_DG', 'liquidation_visa_dg',
   'Visa DG accordé — Liquidation {{numero}}',
   'Le visa DG de la liquidation n° {{numero}} d''un montant TTC de {{montant}} FCFA (net à payer : {{net_a_payer}} FCFA) a été accordé par {{validateur}}. Direction : {{direction}}. La liquidation est prête pour ordonnancement.',
   '["numero", "montant", "net_a_payer", "validateur", "direction", "date"]'::jsonb,
   true),

  ('LIQUIDATION_VALIDEE', 'liquidation_validee',
   'Liquidation validée — {{numero}}',
   'La liquidation n° {{numero}} d''un montant TTC de {{montant}} FCFA (net à payer : {{net_a_payer}} FCFA) a été entièrement validée par {{validateur}}. Fournisseur : {{fournisseur}}. Direction : {{direction}}. La liquidation est prête pour ordonnancement.',
   '["numero", "montant", "net_a_payer", "validateur", "fournisseur", "direction", "date"]'::jsonb,
   true),

  ('LIQUIDATION_REJETEE', 'liquidation_rejetee',
   'Liquidation rejetée — {{numero}}',
   'La liquidation n° {{numero}} d''un montant de {{montant}} FCFA a été rejetée à l''étape {{etape}} par {{validateur}}. Motif : {{motif}}.',
   '["numero", "montant", "validateur", "etape", "motif", "date"]'::jsonb,
   true),

  ('LIQUIDATION_DIFFEREE', 'liquidation_differee',
   'Liquidation différée — {{numero}}',
   'La liquidation n° {{numero}} d''un montant de {{montant}} FCFA a été différée par {{validateur}}. Motif : {{motif}}. Date de reprise prévue : {{deadline}}.',
   '["numero", "montant", "validateur", "motif", "deadline", "date"]'::jsonb,
   true),

  ('LIQUIDATION_URGENTE', 'liquidation_urgente',
   'Liquidation urgente — {{numero}}',
   'La liquidation n° {{numero}} d''un montant TTC de {{montant}} FCFA (net à payer : {{net_a_payer}} FCFA) a été marquée comme urgente par {{createur}}. Motif d''urgence : {{motif_urgence}}. Traitement prioritaire requis.',
   '["numero", "montant", "net_a_payer", "motif_urgence", "createur", "date"]'::jsonb,
   true)

ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. Destinataires liquidation (notification_recipients)
-- ============================================================================

INSERT INTO notification_recipients (type_evenement, role_hierarchique, est_actif)
VALUES
  -- Soumission → DAAF + DMG
  ('liquidation_soumise', 'DAAF', true),
  ('liquidation_soumise', 'DMG', true),
  -- Visa DAAF → DG + DMG
  ('liquidation_visa_daaf', 'DG', true),
  ('liquidation_visa_daaf', 'DMG', true),
  -- Visa DG → Trésorier + DMG
  ('liquidation_visa_dg', 'TRESORIER', true),
  ('liquidation_visa_dg', 'DMG', true),
  -- Validation finale → DAAF + Trésorier + DMG
  ('liquidation_validee', 'DAAF', true),
  ('liquidation_validee', 'TRESORIER', true),
  ('liquidation_validee', 'DMG', true),
  -- Rejet → ADMIN + Directeur
  ('liquidation_rejetee', 'ADMIN', true),
  ('liquidation_rejetee', 'Directeur', true),
  -- Différé → CB + DAAF
  ('liquidation_differee', 'CB', true),
  ('liquidation_differee', 'DAAF', true),
  -- Urgente → DG + DMG + DAAF
  ('liquidation_urgente', 'DG', true),
  ('liquidation_urgente', 'DMG', true),
  ('liquidation_urgente', 'DAAF', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. Fonctions RPC alertes liquidation
-- ============================================================================

-- 3.1 Alertes taux liquidation/engagement élevé sur lignes budgétaires
CREATE OR REPLACE FUNCTION get_alertes_liquidation_budget(
  p_exercice INT DEFAULT NULL,
  p_seuil NUMERIC DEFAULT 0.8
)
RETURNS TABLE(
  budget_line_id UUID,
  code TEXT,
  label TEXT,
  dotation_actuelle NUMERIC,
  total_engage NUMERIC,
  total_liquide NUMERIC,
  taux_liquidation NUMERIC,
  direction_code TEXT,
  direction_label TEXT,
  nb_liquidations_validees BIGINT,
  derniere_liquidation TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS budget_line_id,
    v.code,
    v.label,
    COALESCE(v.dotation_actuelle, 0) AS dotation_actuelle,
    COALESCE(v.total_engage, 0) AS total_engage,
    COALESCE(liq_agg.total_liq, 0) AS total_liquide,
    CASE
      WHEN COALESCE(v.total_engage, 0) = 0 THEN 0
      ELSE ROUND(COALESCE(liq_agg.total_liq, 0) / v.total_engage * 100, 1)
    END AS taux_liquidation,
    v.direction_code,
    v.direction_label,
    COALESCE(liq_agg.nb, 0) AS nb_liquidations_validees,
    liq_agg.derniere AS derniere_liquidation
  FROM v_budget_disponibilite v
  LEFT JOIN LATERAL (
    SELECT
      SUM(bl2.montant) AS total_liq,
      COUNT(bl2.id) AS nb,
      MAX(bl2.created_at) AS derniere
    FROM budget_liquidations bl2
    INNER JOIN budget_engagements be ON be.id = bl2.engagement_id
    WHERE be.budget_line_id = v.id
      AND bl2.statut IN ('validé_daaf', 'validé_dg')
      AND (p_exercice IS NULL OR bl2.exercice = p_exercice)
  ) liq_agg ON true
  WHERE (p_exercice IS NULL OR v.exercice = p_exercice)
    AND COALESCE(v.total_engage, 0) > 0
    AND COALESCE(liq_agg.total_liq, 0) / v.total_engage > p_seuil
  ORDER BY
    COALESCE(liq_agg.total_liq, 0) / NULLIF(v.total_engage, 0) DESC NULLS LAST,
    v.code ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_alertes_liquidation_budget TO authenticated;

-- 3.2 Alertes liquidations différées dont deadline dépassée
CREATE OR REPLACE FUNCTION get_alertes_liquidation_echeance(
  p_exercice INT DEFAULT NULL
)
RETURNS TABLE(
  liquidation_id UUID,
  numero TEXT,
  montant NUMERIC,
  motif_differe TEXT,
  deadline_correction TIMESTAMPTZ,
  date_differe TIMESTAMPTZ,
  jours_depasses INT,
  engagement_numero TEXT,
  engagement_objet TEXT,
  direction_label TEXT,
  created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bl.id AS liquidation_id,
    bl.numero,
    bl.montant,
    bl.motif_differe,
    bl.deadline_correction,
    bl.date_differe,
    EXTRACT(DAY FROM (NOW() - bl.deadline_correction))::INT AS jours_depasses,
    be.numero AS engagement_numero,
    be.objet AS engagement_objet,
    d.label AS direction_label,
    bl.created_by
  FROM budget_liquidations bl
  INNER JOIN budget_engagements be ON be.id = bl.engagement_id
  LEFT JOIN budget_lines bline ON bline.id = be.budget_line_id
  LEFT JOIN directions d ON d.id = bline.direction_id
  WHERE bl.statut = 'differe'
    AND bl.deadline_correction IS NOT NULL
    AND bl.deadline_correction < NOW()
    AND (p_exercice IS NULL OR bl.exercice = p_exercice)
  ORDER BY bl.deadline_correction ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_alertes_liquidation_echeance TO authenticated;

-- 3.3 Alertes liquidations urgentes non validées depuis > N heures
CREATE OR REPLACE FUNCTION get_alertes_liquidation_urgentes(
  p_exercice INT DEFAULT NULL,
  p_age_heures INT DEFAULT 24
)
RETURNS TABLE(
  liquidation_id UUID,
  numero TEXT,
  montant NUMERIC,
  net_a_payer NUMERIC,
  motif_urgence TEXT,
  date_urgence TIMESTAMPTZ,
  heures_attente NUMERIC,
  statut TEXT,
  engagement_numero TEXT,
  engagement_objet TEXT,
  direction_label TEXT,
  created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bl.id AS liquidation_id,
    bl.numero,
    bl.montant,
    bl.net_a_payer,
    bl.reglement_urgent_motif AS motif_urgence,
    bl.reglement_urgent_date AS date_urgence,
    ROUND(EXTRACT(EPOCH FROM (NOW() - bl.reglement_urgent_date)) / 3600, 1) AS heures_attente,
    bl.statut,
    be.numero AS engagement_numero,
    be.objet AS engagement_objet,
    d.label AS direction_label,
    bl.created_by
  FROM budget_liquidations bl
  INNER JOIN budget_engagements be ON be.id = bl.engagement_id
  LEFT JOIN budget_lines bline ON bline.id = be.budget_line_id
  LEFT JOIN directions d ON d.id = bline.direction_id
  WHERE bl.reglement_urgent = true
    AND bl.statut IN ('soumis', 'validé_daaf')
    AND bl.reglement_urgent_date < NOW() - (p_age_heures || ' hours')::INTERVAL
    AND (p_exercice IS NULL OR bl.exercice = p_exercice)
  ORDER BY bl.reglement_urgent_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_alertes_liquidation_urgentes TO authenticated;

-- ============================================================================
-- 4. pg_cron — Jobs automatisés liquidation
-- ============================================================================

-- Activer l'extension pg_cron (si pas déjà active)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 4.1 Fonction cron : vérification alertes budget engagements (existante, réutilisée)
-- (déjà créée dans prompt 11 via get_alertes_engagement_budget)

-- 4.2 Fonction cron : vérification échéances liquidations différées
CREATE OR REPLACE FUNCTION fn_cron_check_liquidation_echeances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  v_exercice INT := EXTRACT(YEAR FROM NOW())::INT;
  v_targets UUID[];
BEGIN
  -- Parcourir les liquidations différées dont la deadline est dépassée
  FOR r IN
    SELECT * FROM get_alertes_liquidation_echeance(v_exercice)
  LOOP
    -- Récupérer les destinataires : créateur + DAAF + CB + DMG
    v_targets := ARRAY[]::UUID[];

    -- Créateur
    IF r.created_by IS NOT NULL THEN
      v_targets := v_targets || r.created_by;
    END IF;

    -- DAAF, CB, DMG
    SELECT array_agg(ur.user_id) INTO v_targets
    FROM (
      SELECT DISTINCT unnest(v_targets) AS user_id
      UNION
      SELECT user_id FROM user_roles WHERE role IN ('DAAF', 'CB', 'DMG')
    ) ur;

    -- Créer notification pour chaque destinataire
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
    SELECT
      uid,
      'echeance',
      'Échéance liquidation dépassée — ' || r.numero,
      'La liquidation ' || r.numero || ' est différée depuis ' || r.jours_depasses || ' jour(s) au-delà de la deadline. Motif initial : ' || COALESCE(r.motif_differe, 'N/A') || '. Engagement : ' || COALESCE(r.engagement_numero, 'N/A'),
      'liquidation',
      r.liquidation_id
    FROM unnest(v_targets) AS uid
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 4.3 Fonction cron : vérification liquidations urgentes non validées
CREATE OR REPLACE FUNCTION fn_cron_check_liquidation_urgentes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  v_exercice INT := EXTRACT(YEAR FROM NOW())::INT;
  v_targets UUID[];
BEGIN
  -- Parcourir les liquidations urgentes non validées depuis > 24h
  FOR r IN
    SELECT * FROM get_alertes_liquidation_urgentes(v_exercice, 24)
  LOOP
    -- Destinataires : DG + DAAF + DMG + TRESORIER
    SELECT array_agg(user_id) INTO v_targets
    FROM user_roles
    WHERE role IN ('DG', 'DAAF', 'DMG', 'TRESORIER');

    IF v_targets IS NULL THEN
      CONTINUE;
    END IF;

    -- Créer notification pour chaque destinataire
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
    SELECT
      uid,
      'alerte',
      'Liquidation urgente en attente > 24h — ' || r.numero,
      'La liquidation urgente ' || r.numero || ' attend validation depuis ' || r.heures_attente || 'h. Montant : ' || r.montant || ' FCFA. Motif urgence : ' || COALESCE(r.motif_urgence, 'N/A') || '. Statut actuel : ' || r.statut,
      'liquidation',
      r.liquidation_id
    FROM unnest(v_targets) AS uid
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 4.4 Fonction cron : alertes budget (engagement) — chaque heure
CREATE OR REPLACE FUNCTION fn_cron_check_budget_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  v_exercice INT := EXTRACT(YEAR FROM NOW())::INT;
  v_targets UUID[];
  v_severity TEXT;
  v_title TEXT;
BEGIN
  FOR r IN
    SELECT * FROM get_alertes_engagement_budget(v_exercice, 0.8)
  LOOP
    -- Déterminer la sévérité
    IF r.taux >= 100 THEN
      v_severity := 'critique';
      v_title := 'DÉPASSEMENT BUDGÉTAIRE — ' || r.code;
    ELSIF r.taux >= 95 THEN
      v_severity := 'critique';
      v_title := 'Alerte budget CRITIQUE (>' || r.taux || '%) — ' || r.code;
    ELSE
      v_severity := 'warning';
      v_title := 'Alerte budget (>' || r.taux || '%) — ' || r.code;
    END IF;

    -- Destinataires selon sévérité
    IF r.taux >= 95 THEN
      SELECT array_agg(user_id) INTO v_targets
      FROM user_roles WHERE role IN ('DG', 'DAAF', 'CB', 'DMG');
    ELSE
      SELECT array_agg(user_id) INTO v_targets
      FROM user_roles WHERE role IN ('CB', 'DAAF');
    END IF;

    IF v_targets IS NULL THEN
      CONTINUE;
    END IF;

    -- Insérer alerte budgétaire
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
    SELECT
      uid,
      'alerte',
      v_title,
      'Ligne ' || r.code || ' (' || r.label || ') : taux=' || r.taux || '%. Dotation=' || r.dotation_actuelle || ', Engagé=' || r.total_engage || ', Disponible=' || r.disponible_net || '. Direction : ' || COALESCE(r.direction_label, 'N/A'),
      'budget_alert',
      r.budget_line_id
    FROM unnest(v_targets) AS uid
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 4.5 Planification des jobs pg_cron
-- Alertes budget : chaque heure à :15
SELECT cron.schedule(
  'check_budget_alerts',
  '15 * * * *',
  $$SELECT fn_cron_check_budget_alerts()$$
);

-- Échéances liquidations différées : chaque jour à 7h UTC (= 7h Abidjan, UTC+0)
SELECT cron.schedule(
  'check_liquidation_echeances',
  '0 7 * * *',
  $$SELECT fn_cron_check_liquidation_echeances()$$
);

-- Liquidations urgentes non traitées : chaque jour à 8h UTC
SELECT cron.schedule(
  'check_liquidation_urgentes',
  '0 8 * * *',
  $$SELECT fn_cron_check_liquidation_urgentes()$$
);

-- ============================================================================
-- FIN Prompt 12
-- ============================================================================
