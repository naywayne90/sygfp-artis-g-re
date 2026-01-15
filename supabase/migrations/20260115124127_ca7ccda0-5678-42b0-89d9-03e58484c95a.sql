-- ============================================
-- Migration: Sécurisation soumission Note SEF
-- Validation champs obligatoires + policy simplifiée
-- ============================================

-- 1. Fonction de validation des champs obligatoires avant soumission
CREATE OR REPLACE FUNCTION public.validate_note_sef_before_submit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier uniquement lors du passage en statut 'soumis'
  IF NEW.statut = 'soumis' AND (OLD.statut IS NULL OR OLD.statut = 'brouillon') THEN
    -- Champs obligatoires pour la soumission
    IF NEW.objet IS NULL OR TRIM(NEW.objet) = '' THEN
      RAISE EXCEPTION 'Le champ "Objet" est obligatoire pour soumettre la note';
    END IF;
    
    IF NEW.direction_id IS NULL THEN
      RAISE EXCEPTION 'Le champ "Direction" est obligatoire pour soumettre la note';
    END IF;
    
    IF NEW.demandeur_id IS NULL THEN
      RAISE EXCEPTION 'Le champ "Demandeur" est obligatoire pour soumettre la note';
    END IF;
    
    IF NEW.urgence IS NULL THEN
      RAISE EXCEPTION 'Le champ "Urgence" est obligatoire pour soumettre la note';
    END IF;
    
    IF NEW.justification IS NULL OR TRIM(NEW.justification) = '' THEN
      RAISE EXCEPTION 'Le champ "Justification" est obligatoire pour soumettre la note';
    END IF;
    
    IF NEW.date_souhaitee IS NULL THEN
      RAISE EXCEPTION 'Le champ "Date souhaitée" est obligatoire pour soumettre la note';
    END IF;
    
    -- Mettre à jour submitted_at si non déjà défini
    IF NEW.submitted_at IS NULL THEN
      NEW.submitted_at := NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_validate_note_sef_submit ON public.notes_sef;

-- Créer le trigger BEFORE UPDATE pour la validation
CREATE TRIGGER trigger_validate_note_sef_submit
BEFORE UPDATE ON public.notes_sef
FOR EACH ROW
WHEN (NEW.statut = 'soumis')
EXECUTE FUNCTION public.validate_note_sef_before_submit();

-- 2. RLS Policy: Seuls les utilisateurs autorisés peuvent modifier
-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "notes_sef_update_authorized" ON public.notes_sef;
DROP POLICY IF EXISTS "notes_sef_update_policy" ON public.notes_sef;

-- Policy pour UPDATE: créateur, admin, ou DG
CREATE POLICY "notes_sef_update_authorized" ON public.notes_sef
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Créateur de la note
    created_by = auth.uid()
    -- OU admin/DG (peuvent tout modifier)
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('ADMIN', 'DG')
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('ADMIN', 'DG')
    )
  )
);

-- 3. Commentaires
COMMENT ON FUNCTION public.validate_note_sef_before_submit IS 'Valide les champs obligatoires avant soumission dune note SEF';
COMMENT ON POLICY "notes_sef_update_authorized" ON public.notes_sef IS 'Seul le créateur ou admin/DG peut modifier/soumettre';