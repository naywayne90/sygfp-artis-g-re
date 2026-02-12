-- Performance indexes for budget module queries
-- These indexes support the useBudgetLineELOP hook and v_budget_lines_execution view

-- budget_lines: composite index for common filtered queries (exercice + is_active + code sort)
CREATE INDEX IF NOT EXISTS idx_budget_lines_exercice_active_code
ON budget_lines (exercice, code) WHERE is_active = true;

-- budget_lines: composite index for filtered queries with direction
CREATE INDEX IF NOT EXISTS idx_budget_lines_exercice_direction
ON budget_lines (exercice, direction_id) WHERE is_active = true;

-- budget_lines: index on parent_id for tree view hierarchy queries
CREATE INDEX IF NOT EXISTS idx_budget_lines_parent_id
ON budget_lines (parent_id) WHERE parent_id IS NOT NULL;

-- budget_liquidations: index on budget_line_id for direct lookups from useBudgetLineELOP
CREATE INDEX IF NOT EXISTS idx_budget_liquidations_budget_line_id
ON budget_liquidations (budget_line_id);

-- budget_line_history: index for audit queries
CREATE INDEX IF NOT EXISTS idx_budget_line_history_budget_line_id
ON budget_line_history (budget_line_id);

-- audit_logs: composite index for entity lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id
ON audit_logs (entity_type, entity_id);
