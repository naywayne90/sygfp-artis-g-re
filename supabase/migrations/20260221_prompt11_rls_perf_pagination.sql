-- ══════════════════════════════════════════════════════════════
-- Prompt 11 — Sécurité et performance liquidations
-- Date: 2026-02-21
-- RLS complet, pagination serveur, indexes, ANALYZE
-- ══════════════════════════════════════════════════════════════

-- ┌──────────────────────────────────────┐
-- │ 1. RPC — Compteurs par statut       │
-- │    (KPIs, onglets, sidebar)         │
-- └──────────────────────────────────────┘
CREATE OR REPLACE FUNCTION get_liquidation_counts(p_exercice INT)
RETURNS JSON
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total',        COUNT(*),
    'brouillon',    COUNT(*) FILTER (WHERE statut = 'brouillon'),
    'certifie_sf',  COUNT(*) FILTER (WHERE statut = 'certifié_sf'),
    'soumis',       COUNT(*) FILTER (WHERE statut = 'soumis'),
    'valide_daaf',  COUNT(*) FILTER (WHERE statut = 'validé_daaf'),
    'valide_dg',    COUNT(*) FILTER (WHERE statut = 'validé_dg'),
    'rejete',       COUNT(*) FILTER (WHERE statut = 'rejete'),
    'differe',      COUNT(*) FILTER (WHERE statut = 'differe'),
    'annule',       COUNT(*) FILTER (WHERE statut = 'annule'),
    'urgent',       COUNT(*) FILTER (WHERE reglement_urgent = true
                      AND statut IN ('soumis','validé_daaf','validé_dg')),
    'service_fait', COUNT(*) FILTER (WHERE service_fait = true),
    'total_montant', COALESCE(SUM(montant), 0)::NUMERIC,
    'a_valider',    COUNT(*) FILTER (WHERE statut IN ('soumis','validé_daaf'))
  )
  FROM budget_liquidations
  WHERE exercice = p_exercice;
$$;

-- ┌──────────────────────────────────────┐
-- │ 2. INDEXES — Pagination + filtrage  │
-- └──────────────────────────────────────┘

-- Composite pour pagination par onglet (exercice + statut + tri)
CREATE INDEX IF NOT EXISTS idx_liq_exercice_statut_created
  ON budget_liquidations(exercice, statut, created_at DESC);

-- Recherche par numéro (LIKE prefix)
CREATE INDEX IF NOT EXISTS idx_liq_numero_pattern
  ON budget_liquidations(numero text_pattern_ops);

-- Filtre urgents + statut (partial index)
CREATE INDEX IF NOT EXISTS idx_liq_urgent_statut
  ON budget_liquidations(exercice, statut)
  WHERE reglement_urgent = true;

-- FK index sur liquidation_attachments
CREATE INDEX IF NOT EXISTS idx_liq_att_liquidation_id
  ON liquidation_attachments(liquidation_id);

-- FK index sur liquidation_validations
CREATE INDEX IF NOT EXISTS idx_liq_val_liquidation_id
  ON liquidation_validations(liquidation_id);

-- Index engagement_id sur budget_liquidations (si manquant)
CREATE INDEX IF NOT EXISTS idx_liq_engagement_id
  ON budget_liquidations(engagement_id);

-- ┌──────────────────────────────────────┐
-- │ 3. RLS — liquidation_attachments    │
-- └──────────────────────────────────────┘
ALTER TABLE liquidation_attachments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- SELECT: tout utilisateur authentifié peut lire
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'liquidation_attachments'
      AND policyname = 'liq_att_select_auth'
  ) THEN
    CREATE POLICY liq_att_select_auth
      ON liquidation_attachments FOR SELECT
      TO authenticated USING (true);
  END IF;

  -- INSERT: tout utilisateur authentifié
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'liquidation_attachments'
      AND policyname = 'liq_att_insert_auth'
  ) THEN
    CREATE POLICY liq_att_insert_auth
      ON liquidation_attachments FOR INSERT
      TO authenticated WITH CHECK (true);
  END IF;

  -- UPDATE: créateur ou ADMIN/DAAF
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'liquidation_attachments'
      AND policyname = 'liq_att_update_workflow'
  ) THEN
    CREATE POLICY liq_att_update_workflow
      ON liquidation_attachments FOR UPDATE
      TO authenticated
      USING (
        uploaded_by = auth.uid()
        OR has_role(auth.uid(), 'ADMIN'::app_role)
        OR has_role(auth.uid(), 'DAAF'::app_role)
        OR has_role(auth.uid(), 'DAF'::app_role)
      );
  END IF;

  -- DELETE: créateur ou ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'liquidation_attachments'
      AND policyname = 'liq_att_delete_owner'
  ) THEN
    CREATE POLICY liq_att_delete_owner
      ON liquidation_attachments FOR DELETE
      TO authenticated
      USING (
        uploaded_by = auth.uid()
        OR has_role(auth.uid(), 'ADMIN'::app_role)
      );
  END IF;
END $$;

-- ┌──────────────────────────────────────┐
-- │ 4. RLS — liquidation_validations    │
-- └──────────────────────────────────────┘
ALTER TABLE liquidation_validations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- SELECT: tout utilisateur authentifié
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'liquidation_validations'
      AND policyname = 'liq_val_select_auth'
  ) THEN
    CREATE POLICY liq_val_select_auth
      ON liquidation_validations FOR SELECT
      TO authenticated USING (true);
  END IF;

  -- INSERT: tout utilisateur authentifié (création à la soumission)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'liquidation_validations'
      AND policyname = 'liq_val_insert_auth'
  ) THEN
    CREATE POLICY liq_val_insert_auth
      ON liquidation_validations FOR INSERT
      TO authenticated WITH CHECK (true);
  END IF;

  -- UPDATE: valideurs (DAAF/DAF/DG/ADMIN)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'liquidation_validations'
      AND policyname = 'liq_val_update_validators'
  ) THEN
    CREATE POLICY liq_val_update_validators
      ON liquidation_validations FOR UPDATE
      TO authenticated
      USING (
        has_role(auth.uid(), 'DAAF'::app_role)
        OR has_role(auth.uid(), 'DAF'::app_role)
        OR has_role(auth.uid(), 'DG'::app_role)
        OR has_role(auth.uid(), 'ADMIN'::app_role)
      );
  END IF;
END $$;

-- ┌──────────────────────────────────────┐
-- │ 5. DELETE policy budget_liquidations │
-- └──────────────────────────────────────┘
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'budget_liquidations'
      AND policyname = 'liquidation_delete_admin'
  ) THEN
    CREATE POLICY liquidation_delete_admin
      ON budget_liquidations FOR DELETE
      TO authenticated
      USING (
        has_role(auth.uid(), 'ADMIN'::app_role)
      );
  END IF;
END $$;

-- ┌──────────────────────────────────────┐
-- │ 6. ANALYZE — Statistiques planner   │
-- └──────────────────────────────────────┘
ANALYZE budget_liquidations;
ANALYZE liquidation_attachments;
ANALYZE liquidation_validations;
ANALYZE budget_engagements;
ANALYZE budget_lines;
