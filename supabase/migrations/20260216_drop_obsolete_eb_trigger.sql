-- Drop obsolete workflow_tasks trigger (replaced by fn_notify_eb_transition in 20260216_eb_double_validation.sql)
-- The old trigger fn_create_eb_workflow_task() used wrong column names for workflow_tasks table
-- causing: column "title" of relation "workflow_tasks" does not exist
DROP TRIGGER IF EXISTS trg_create_eb_workflow_task ON expressions_besoin;
DROP TRIGGER IF EXISTS trg_create_eb_workflow_task_insert ON expressions_besoin;
DROP FUNCTION IF EXISTS fn_create_eb_workflow_task();
