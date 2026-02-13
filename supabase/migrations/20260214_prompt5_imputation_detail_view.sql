-- ============================================================================
-- Prompt 5 Backend : Fix grants + index audit_logs
-- Date: 2026-02-14
-- Description:
--   1. Revoke anon access on v_imputations_detail (security)
--   2. Add composite index on audit_logs for entity-based lookups
-- ============================================================================

-- 1. Fix grants: revoke anon, keep authenticated + service_role
REVOKE ALL ON v_imputations_detail FROM anon;
GRANT SELECT ON v_imputations_detail TO authenticated, service_role;

-- 2. Index for audit_logs (accelerates DossierAuditLog loading)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id, created_at DESC);
