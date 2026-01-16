-- ==============================================
-- SECURITY FIX: Error-level issues
-- ==============================================

-- 1. Enable RLS on transfer_sequences table
ALTER TABLE IF EXISTS public.transfer_sequences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transfer_sequences (internal sequence counter)
-- Only admins and financial officers should access this
DROP POLICY IF EXISTS "Admins can manage transfer sequences" ON public.transfer_sequences;

CREATE POLICY "Admins can manage transfer sequences"
ON public.transfer_sequences
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('ADMIN', 'DG', 'DAF', 'DAAF')
    AND ur.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('ADMIN', 'DG', 'DAF', 'DAAF')
    AND ur.is_active = true
  )
);

-- 2. Fix Security Definer Views - Add security_invoker=true to views without it
-- PostgreSQL 15+ has SECURITY INVOKER for views by default but older versions default to DEFINER

-- Fix notes_imputees_disponibles view
ALTER VIEW IF EXISTS public.notes_imputees_disponibles SET (security_invoker = on);

-- Fix notes_sef_audit_log view
ALTER VIEW IF EXISTS public.notes_sef_audit_log SET (security_invoker = on);

-- Fix pending_tasks_by_role view
ALTER VIEW IF EXISTS public.pending_tasks_by_role SET (security_invoker = on);

-- Fix prestataires_actifs view
ALTER VIEW IF EXISTS public.prestataires_actifs SET (security_invoker = on);

-- Fix v_dossier_chaine view
ALTER VIEW IF EXISTS public.v_dossier_chaine SET (security_invoker = on);

-- 3. Create a limited profile view for organizational purposes
-- This provides a safer way to display user names in the UI without exposing sensitive data
DROP VIEW IF EXISTS public.profiles_display;

CREATE VIEW public.profiles_display 
WITH (security_invoker = on)
AS
SELECT 
  id,
  full_name,
  first_name,
  last_name,
  poste,
  direction_id,
  direction_code,
  is_active
FROM public.profiles;

-- Grant access to the view (RLS on underlying table will apply)
GRANT SELECT ON public.profiles_display TO authenticated;