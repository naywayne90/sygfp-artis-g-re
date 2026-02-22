-- ===========================================================================
-- Prompt 11 Backend : Templates email engagement + RPC alertes budget
-- Date : 20 février 2026
-- ===========================================================================

-- ============================================================================
-- 0. Élargir la contrainte CHECK type_evenement pour accepter les types engagement
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
  'engagement_degage'::text, 'engagement_differe'::text
]));

-- ============================================================================
-- 1. Templates email engagement dans notification_templates
--    Colonnes réelles : code, type_evenement, titre_template, corps_template,
--                       variables_disponibles (jsonb), est_actif
-- ============================================================================

INSERT INTO notification_templates (code, type_evenement, titre_template, corps_template, variables_disponibles, est_actif)
VALUES
  ('ENGAGEMENT_SOUMIS', 'engagement_soumis',
   'Engagement soumis — {{numero}}',
   'L''engagement n° {{numero}} ({{objet}}) d''un montant de {{montant}} FCFA a été soumis pour validation par {{createur}}. Direction : {{direction}}. Ligne budgétaire : {{ligne_budgetaire}}.',
   '["numero", "objet", "montant", "createur", "direction", "ligne_budgetaire", "date"]'::jsonb,
   true),

  ('ENGAGEMENT_VISA_SAF', 'engagement_visa',
   'Visa SAF accordé — {{numero}}',
   'Le visa SAF de l''engagement n° {{numero}} ({{objet}}) a été accordé par {{validateur}} le {{date}}. L''engagement est maintenant en attente du visa CB.',
   '["numero", "objet", "montant", "validateur", "date", "direction", "ligne_budgetaire"]'::jsonb,
   true),

  ('ENGAGEMENT_VISA_CB', 'engagement_visa',
   'Visa CB accordé — {{numero}}',
   'Le visa CB de l''engagement n° {{numero}} ({{objet}}) a été accordé par {{validateur}} le {{date}}. L''engagement est maintenant en attente du visa DAAF.',
   '["numero", "objet", "montant", "validateur", "date", "direction", "ligne_budgetaire"]'::jsonb,
   true),

  ('ENGAGEMENT_VISA_DAAF', 'engagement_visa',
   'Visa DAAF accordé — {{numero}}',
   'Le visa DAAF de l''engagement n° {{numero}} ({{objet}}) a été accordé par {{validateur}} le {{date}}. L''engagement est maintenant en attente de la validation DG.',
   '["numero", "objet", "montant", "validateur", "date", "direction", "ligne_budgetaire"]'::jsonb,
   true),

  ('ENGAGEMENT_VALIDE', 'engagement_valide',
   'Engagement validé — {{numero}}',
   'L''engagement n° {{numero}} ({{objet}}) d''un montant de {{montant}} FCFA a été entièrement validé par le DG ({{validateur}}) le {{date}}. Fournisseur : {{fournisseur}}. Direction : {{direction}}.',
   '["numero", "objet", "montant", "validateur", "fournisseur", "date", "direction", "ligne_budgetaire"]'::jsonb,
   true),

  ('ENGAGEMENT_REJETE', 'engagement_rejete',
   'Engagement rejeté — {{numero}}',
   'L''engagement n° {{numero}} ({{objet}}) a été rejeté à l''étape {{etape}} par {{validateur}} le {{date}}. Motif : {{motif}}.',
   '["numero", "objet", "montant", "validateur", "etape", "motif", "date", "direction"]'::jsonb,
   true),

  ('ENGAGEMENT_DEGAGE', 'engagement_degage',
   'Dégagement engagement — {{numero}}',
   'L''engagement n° {{numero}} ({{objet}}) a fait l''objet d''un dégagement de {{montant_degage}} FCFA par {{validateur}} le {{date}}. Motif : {{motif}}. Type : {{type_degagement}}.',
   '["numero", "objet", "montant", "montant_degage", "validateur", "motif", "type_degagement", "date"]'::jsonb,
   true)

ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. Destinataires engagement (notification_recipients)
--    Colonne réelle : role_hierarchique (pas role_destinataire)
-- ============================================================================

INSERT INTO notification_recipients (type_evenement, role_hierarchique, est_actif)
VALUES
  -- Soumission → SAF (premier validateur)
  ('engagement_soumis', 'SAF', true),
  -- Visa → créateur + prochain validateur (géré par le frontend)
  ('engagement_visa', 'CB', true),
  ('engagement_visa', 'DAAF', true),
  ('engagement_visa', 'DG', true),
  -- Validation finale → créateur + DAAF
  ('engagement_valide', 'DAAF', true),
  ('engagement_valide', 'DG', true),
  -- Rejet → créateur (géré par le frontend)
  ('engagement_rejete', 'ADMIN', true),
  -- Dégagement → créateur + CB
  ('engagement_degage', 'CB', true),
  ('engagement_degage', 'DAAF', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. RPC : Alertes lignes budgétaires à taux d'engagement élevé
-- Corrige la requête du prompt (colonnes réelles) :
--   libelle → label
--   engage → total_engage (via v_budget_disponibilite)
--   dotation_actuelle → calculée dans v_budget_disponibilite
-- ============================================================================

CREATE OR REPLACE FUNCTION get_alertes_engagement_budget(
  p_exercice INT DEFAULT NULL,
  p_seuil NUMERIC DEFAULT 0.8
)
RETURNS TABLE(
  budget_line_id UUID,
  code TEXT,
  label TEXT,
  dotation_actuelle NUMERIC,
  total_engage NUMERIC,
  disponible_net NUMERIC,
  taux NUMERIC,
  direction_code TEXT,
  direction_label TEXT,
  nb_engagements_valides BIGINT,
  dernier_engagement TIMESTAMPTZ
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
    COALESCE(v.disponible_net, 0) AS disponible_net,
    CASE
      WHEN COALESCE(v.dotation_actuelle, 0) = 0 THEN 0
      ELSE ROUND(COALESCE(v.total_engage, 0) / v.dotation_actuelle * 100, 1)
    END AS taux,
    v.direction_code,
    v.direction_label,
    COALESCE(agg.nb, 0) AS nb_engagements_valides,
    agg.dernier AS dernier_engagement
  FROM v_budget_disponibilite v
  LEFT JOIN LATERAL (
    SELECT
      COUNT(be.id) AS nb,
      MAX(be.created_at) AS dernier
    FROM budget_engagements be
    WHERE be.budget_line_id = v.id
      AND be.statut = 'valide'
  ) agg ON true
  WHERE (p_exercice IS NULL OR v.exercice = p_exercice)
    AND COALESCE(v.dotation_actuelle, 0) > 0
    AND COALESCE(v.total_engage, 0) / v.dotation_actuelle > p_seuil
  ORDER BY
    COALESCE(v.total_engage, 0) / v.dotation_actuelle DESC,
    v.code ASC;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_alertes_engagement_budget TO authenticated;
