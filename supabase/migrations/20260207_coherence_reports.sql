-- Migration: Table coherence_reports
-- Date: 2026-02-07
-- Description: Stockage persistant des rapports de cohérence et anomalies

-- ============================================
-- 1. Table coherence_reports
-- ============================================
CREATE TABLE IF NOT EXISTS coherence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercice_id TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  source TEXT NOT NULL CHECK (source IN ('import', 'manual', 'scheduled')),
  source_details TEXT,
  total_checks INTEGER NOT NULL DEFAULT 0,
  anomalies_count INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  warnings_count INTEGER NOT NULL DEFAULT 0,
  infos_count INTEGER NOT NULL DEFAULT 0,
  anomalies JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commentaire
COMMENT ON TABLE coherence_reports IS 'Rapports de vérification de cohérence des données budgétaires';

-- ============================================
-- 2. Index
-- ============================================
CREATE INDEX IF NOT EXISTS idx_coherence_reports_exercice
ON coherence_reports(exercice_id);

CREATE INDEX IF NOT EXISTS idx_coherence_reports_generated_at
ON coherence_reports(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_coherence_reports_generated_by
ON coherence_reports(generated_by);

CREATE INDEX IF NOT EXISTS idx_coherence_reports_status
ON coherence_reports(status);

-- ============================================
-- 3. Trigger updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_coherence_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coherence_reports_updated_at
  BEFORE UPDATE ON coherence_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_coherence_reports_updated_at();

-- ============================================
-- 4. RLS
-- ============================================
ALTER TABLE coherence_reports ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les utilisateurs authentifiés
CREATE POLICY coherence_reports_select_policy ON coherence_reports
  FOR SELECT TO authenticated
  USING (true);

-- Insertion pour tous les utilisateurs authentifiés
CREATE POLICY coherence_reports_insert_policy ON coherence_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = generated_by);

-- Mise à jour pour l'auteur ou les admins
CREATE POLICY coherence_reports_update_policy ON coherence_reports
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = generated_by
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.profil_fonctionnel IN ('Admin', 'Validateur')
    )
  );

-- ============================================
-- 5. Grants
-- ============================================
GRANT SELECT, INSERT, UPDATE ON coherence_reports TO authenticated;
