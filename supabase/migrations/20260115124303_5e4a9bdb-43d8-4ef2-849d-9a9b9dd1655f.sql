-- =====================================================
-- PROMPT 8/10: DG Validation - RLS policies for approve/reject/defer
-- =====================================================

-- Update RLS policy to ensure only DG/ADMIN can validate notes
-- (The existing update policy allows creator or admin, we need to be more specific)

-- Drop existing policy if any conflicts
DROP POLICY IF EXISTS "notes_sef_validate_authorized" ON public.notes_sef;

-- Create a policy specifically for validation actions (changing to valide/rejete/differe)
-- This policy allows updating when:
-- 1. User is the creator updating their own draft
-- 2. User has ADMIN or DG role (can do any update including validation)
CREATE POLICY "notes_sef_validate_authorized"
ON public.notes_sef
FOR UPDATE
USING (
  -- The user can update if they're the creator of a draft
  (auth.uid() = created_by AND statut = 'brouillon')
  OR
  -- Or if they have ADMIN/DG role (can update any note including validation)
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('ADMIN', 'DG')
  )
);

-- Create a function to validate that only DG can change status to valide/rejete/differe
CREATE OR REPLACE FUNCTION public.check_dg_validation_permission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_has_dg_role BOOLEAN;
BEGIN
  -- If status is not changing to a validation status, allow
  IF NEW.statut NOT IN ('valide', 'rejete', 'differe') THEN
    RETURN NEW;
  END IF;
  
  -- If old status was already a final status and we're trying to change, block
  IF OLD.statut IN ('valide', 'rejete') THEN
    RAISE EXCEPTION 'Cette note a déjà été traitée définitivement (%). Aucune modification possible.', OLD.statut;
  END IF;
  
  -- Check if the user has DG or ADMIN role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('ADMIN', 'DG')
  ) INTO user_has_dg_role;
  
  IF NOT user_has_dg_role THEN
    RAISE EXCEPTION 'Seuls les utilisateurs DG ou ADMIN peuvent valider, rejeter ou différer une note.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for DG validation check
DROP TRIGGER IF EXISTS trigger_check_dg_validation ON public.notes_sef;

CREATE TRIGGER trigger_check_dg_validation
BEFORE UPDATE ON public.notes_sef
FOR EACH ROW
WHEN (
  OLD.statut IS DISTINCT FROM NEW.statut 
  AND NEW.statut IN ('valide', 'rejete', 'differe')
)
EXECUTE FUNCTION public.check_dg_validation_permission();