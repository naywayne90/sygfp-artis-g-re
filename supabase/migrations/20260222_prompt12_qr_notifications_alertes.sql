-- =====================================================
-- Prompt 12 — QR Code Traçabilité, Notifications Workflow, Alertes
-- Date: 2026-02-22
-- =====================================================

-- =====================================================
-- Gap 6a — Relaxer le CHECK type_evenement pour les nouveaux types
-- =====================================================

DO $$
BEGIN
  -- Drop old constraint if it exists
  ALTER TABLE notification_templates
    DROP CONSTRAINT IF EXISTS notification_templates_type_evenement_check;

  -- Add expanded constraint
  ALTER TABLE notification_templates
    ADD CONSTRAINT notification_templates_type_evenement_check
    CHECK (type_evenement IN (
      'ordonnancement',
      'reglement',
      'reglement_partiel',
      'note_soumise',
      'note_validee',
      'note_rejetee',
      'engagement_cree',
      'liquidation_validee',
      -- Nouveaux types Prompt 12
      'liquidation_certifiee_sf',
      'liquidation_soumise',
      'liquidation_rejetee',
      'liquidation_urgente',
      'ordonnancement_cree',
      'ordonnancement_valide'
    ));
END $$;

-- =====================================================
-- Gap 6a — Templates liquidation
-- =====================================================

INSERT INTO notification_templates (code, type_evenement, titre_template, corps_template, variables_disponibles, est_actif)
VALUES
  ('LIQUIDATION_CERTIFIEE_SF', 'liquidation_certifiee_sf',
   'Service fait certifié — {{numero}}',
   'Le service fait de la liquidation {{numero}} ({{montant}} FCFA, fournisseur: {{fournisseur}}) a été certifié par {{certifieur}} le {{date}}. La liquidation est prête pour soumission.',
   '["numero","montant","fournisseur","certifieur","date"]'::jsonb, true),

  ('LIQUIDATION_SOUMISE', 'liquidation_soumise',
   'Liquidation soumise — {{numero}}',
   'La liquidation {{numero}} ({{montant}} FCFA, fournisseur: {{fournisseur}}) a été soumise par {{createur}} le {{date}} et attend votre validation.',
   '["numero","montant","fournisseur","createur","date"]'::jsonb, true),

  ('LIQUIDATION_VALIDEE', 'liquidation_validee',
   'Liquidation validée — {{numero}}',
   'La liquidation {{numero}} (Montant TTC: {{montant}} FCFA, Net à payer: {{net_a_payer}} FCFA, fournisseur: {{fournisseur}}) a été validée par {{validateur}} le {{date}}. Un ordonnancement peut être créé.',
   '["numero","montant","net_a_payer","fournisseur","validateur","date"]'::jsonb, true),

  ('LIQUIDATION_REJETEE', 'liquidation_rejetee',
   'Liquidation rejetée — {{numero}}',
   'La liquidation {{numero}} ({{montant}} FCFA, fournisseur: {{fournisseur}}) a été rejetée par {{validateur}} à l''étape {{etape}}. Motif: {{motif}}. Date: {{date}}.',
   '["numero","montant","fournisseur","validateur","motif","etape","date"]'::jsonb, true),

  ('LIQUIDATION_URGENTE', 'liquidation_urgente',
   'Liquidation urgente — {{numero}}',
   'La liquidation {{numero}} ({{montant}} FCFA, fournisseur: {{fournisseur}}) a été marquée comme urgente. Motif: {{motif}}. Date: {{date}}.',
   '["numero","montant","fournisseur","motif","date"]'::jsonb, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Gap 6b — Templates ordonnancement (exigence TOURÉ)
-- =====================================================

INSERT INTO notification_templates (code, type_evenement, titre_template, corps_template, variables_disponibles, est_actif)
VALUES
  ('ORDONNANCEMENT_CREE', 'ordonnancement_cree',
   'Ordonnancement créé — {{reference}}',
   'Réf: {{reference}} | Fournisseur: {{fournisseur}} | Montant net: {{montant_net}} FCFA | Réglé: {{montant_regle}} FCFA | Restant: {{montant_restant}} FCFA',
   '["reference","fournisseur","montant_net","montant_regle","montant_restant"]'::jsonb, true),

  ('ORDONNANCEMENT_VALIDE', 'ordonnancement_valide',
   'Ordonnancement validé — {{reference}}',
   'Réf: {{reference}} | Fournisseur: {{fournisseur}} | Montant net: {{montant_net}} FCFA | Réglé: {{montant_regle}} FCFA | Restant: {{montant_restant}} FCFA',
   '["reference","fournisseur","montant_net","montant_regle","montant_restant"]'::jsonb, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Gap 7a — RPC : Liquidations urgentes en retard > 48h
-- =====================================================

CREATE OR REPLACE FUNCTION get_overdue_urgent_liquidations(p_exercice INT)
RETURNS TABLE(
  id UUID,
  numero TEXT,
  montant NUMERIC,
  fournisseur TEXT,
  reglement_urgent_date TIMESTAMPTZ,
  heures_en_attente NUMERIC
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    bl.id,
    bl.numero,
    bl.montant,
    be.fournisseur,
    bl.reglement_urgent_date,
    ROUND(EXTRACT(EPOCH FROM (now() - bl.reglement_urgent_date)) / 3600, 1)
  FROM budget_liquidations bl
  JOIN budget_engagements be ON be.id = bl.engagement_id
  WHERE bl.exercice = p_exercice
    AND bl.reglement_urgent = true
    AND bl.statut IN ('soumis', 'validé_daaf')
    AND bl.reglement_urgent_date < now() - interval '48 hours'
  ORDER BY bl.reglement_urgent_date ASC;
$$;

-- =====================================================
-- Gap 8a — RPC : Engagements validés sans liquidation > 30 jours
-- =====================================================

CREATE OR REPLACE FUNCTION get_engagements_sans_liquidation(p_exercice INT, p_jours INT DEFAULT 30)
RETURNS TABLE(
  id UUID,
  numero TEXT,
  objet TEXT,
  montant NUMERIC,
  fournisseur TEXT,
  validated_at TIMESTAMPTZ,
  jours_depuis_validation INT
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    be.id,
    be.numero,
    be.objet,
    be.montant,
    be.fournisseur,
    be.visa_dg_date::timestamptz,
    EXTRACT(DAY FROM (now() - be.visa_dg_date::timestamptz))::INT
  FROM budget_engagements be
  WHERE be.exercice = p_exercice
    AND be.statut = 'valide'
    AND be.visa_dg_date IS NOT NULL
    AND be.visa_dg_date::timestamptz < now() - (p_jours || ' days')::interval
    AND NOT EXISTS (
      SELECT 1 FROM budget_liquidations bl
      WHERE bl.engagement_id = be.id AND bl.statut NOT IN ('annule')
    )
  ORDER BY be.visa_dg_date ASC;
$$;

-- Index performance pour les nouvelles RPC
CREATE INDEX IF NOT EXISTS idx_bl_urgent_overdue
  ON budget_liquidations (exercice, reglement_urgent, statut, reglement_urgent_date)
  WHERE reglement_urgent = true;

CREATE INDEX IF NOT EXISTS idx_be_sans_liquidation
  ON budget_engagements (exercice, statut, visa_dg_date)
  WHERE statut = 'valide' AND visa_dg_date IS NOT NULL;

-- =====================================================
-- DONE
-- =====================================================
