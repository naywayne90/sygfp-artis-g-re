-- ================================================================
-- WORKFLOW NOTES SEF - Validation des transitions + Protection
-- ================================================================

-- 1. Fonction de validation des transitions de statut
CREATE OR REPLACE FUNCTION public.validate_notes_sef_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean := false;
  v_is_dg boolean := false;
  v_is_creator boolean := false;
BEGIN
  v_user_id := auth.uid();
  
  -- Vérifier les rôles de l'utilisateur
  SELECT 
    bool_or(role = 'ADMIN'),
    bool_or(role IN ('DG', 'DAAF'))
  INTO v_is_admin, v_is_dg
  FROM public.user_roles
  WHERE user_id = v_user_id;
  
  v_is_creator := (OLD.created_by = v_user_id);
  
  -- Si pas de changement de statut, on laisse passer (autres modifications)
  IF OLD.statut = NEW.statut THEN
    -- Mais bloquer les modifications sur notes validées/rejetées (sauf admin)
    IF OLD.statut IN ('valide', 'rejete') AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Les notes validées ou rejetées ne peuvent pas être modifiées';
    END IF;
    
    -- Bloquer les modifications de fond sur notes soumises (sauf admin/DG)
    IF OLD.statut IN ('soumis', 'a_valider') AND NOT (v_is_admin OR v_is_dg) THEN
      -- Permettre uniquement les modifications de commentaire
      IF OLD.objet IS DISTINCT FROM NEW.objet OR
         OLD.description IS DISTINCT FROM NEW.description OR
         OLD.justification IS DISTINCT FROM NEW.justification OR
         OLD.direction_id IS DISTINCT FROM NEW.direction_id OR
         OLD.demandeur_id IS DISTINCT FROM NEW.demandeur_id OR
         OLD.date_souhaitee IS DISTINCT FROM NEW.date_souhaitee OR
         OLD.urgence IS DISTINCT FROM NEW.urgence THEN
        RAISE EXCEPTION 'Les notes soumises ne peuvent pas être modifiées (lecture seule)';
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- =============================================
  -- VALIDATION DES TRANSITIONS DE STATUT
  -- =============================================
  
  -- BROUILLON -> SOUMIS/A_VALIDER (par créateur ou admin)
  IF OLD.statut = 'brouillon' AND NEW.statut IN ('soumis', 'a_valider') THEN
    IF NOT (v_is_creator OR v_is_admin) THEN
      RAISE EXCEPTION 'Seul le créateur peut soumettre cette note';
    END IF;
    -- Valider les champs obligatoires
    IF NEW.objet IS NULL OR trim(NEW.objet) = '' THEN
      RAISE EXCEPTION 'L''objet est obligatoire pour soumettre';
    END IF;
    IF NEW.direction_id IS NULL THEN
      RAISE EXCEPTION 'La direction est obligatoire pour soumettre';
    END IF;
    IF NEW.demandeur_id IS NULL THEN
      RAISE EXCEPTION 'Le demandeur est obligatoire pour soumettre';
    END IF;
    IF NEW.justification IS NULL OR trim(NEW.justification) = '' THEN
      RAISE EXCEPTION 'La justification est obligatoire pour soumettre';
    END IF;
    IF NEW.date_souhaitee IS NULL THEN
      RAISE EXCEPTION 'La date souhaitée est obligatoire pour soumettre';
    END IF;
    RETURN NEW;
  END IF;
  
  -- SOUMIS/A_VALIDER -> VALIDE (par DG/ADMIN uniquement)
  IF OLD.statut IN ('soumis', 'a_valider') AND NEW.statut = 'valide' THEN
    IF NOT (v_is_admin OR v_is_dg) THEN
      RAISE EXCEPTION 'Seuls les utilisateurs DG ou ADMIN peuvent valider une note';
    END IF;
    RETURN NEW;
  END IF;
  
  -- SOUMIS/A_VALIDER -> REJETE (par DG/ADMIN uniquement, motif obligatoire)
  IF OLD.statut IN ('soumis', 'a_valider') AND NEW.statut = 'rejete' THEN
    IF NOT (v_is_admin OR v_is_dg) THEN
      RAISE EXCEPTION 'Seuls les utilisateurs DG ou ADMIN peuvent rejeter une note';
    END IF;
    IF NEW.rejection_reason IS NULL OR trim(NEW.rejection_reason) = '' THEN
      RAISE EXCEPTION 'Le motif de rejet est obligatoire';
    END IF;
    RETURN NEW;
  END IF;
  
  -- SOUMIS/A_VALIDER -> DIFFERE (par DG/ADMIN uniquement, motif obligatoire)
  IF OLD.statut IN ('soumis', 'a_valider') AND NEW.statut = 'differe' THEN
    IF NOT (v_is_admin OR v_is_dg) THEN
      RAISE EXCEPTION 'Seuls les utilisateurs DG ou ADMIN peuvent différer une note';
    END IF;
    IF NEW.differe_motif IS NULL OR trim(NEW.differe_motif) = '' THEN
      RAISE EXCEPTION 'Le motif de report est obligatoire';
    END IF;
    RETURN NEW;
  END IF;
  
  -- DIFFERE -> SOUMIS/A_VALIDER (re-soumission par créateur ou admin)
  IF OLD.statut = 'differe' AND NEW.statut IN ('soumis', 'a_valider') THEN
    IF NOT (v_is_creator OR v_is_admin) THEN
      RAISE EXCEPTION 'Seul le créateur peut re-soumettre cette note';
    END IF;
    RETURN NEW;
  END IF;
  
  -- DIFFERE -> VALIDE (par DG/ADMIN uniquement)
  IF OLD.statut = 'differe' AND NEW.statut = 'valide' THEN
    IF NOT (v_is_admin OR v_is_dg) THEN
      RAISE EXCEPTION 'Seuls les utilisateurs DG ou ADMIN peuvent valider une note différée';
    END IF;
    RETURN NEW;
  END IF;
  
  -- Toute autre transition est interdite
  RAISE EXCEPTION 'Transition de statut non autorisée: % -> %', OLD.statut, NEW.statut;
END;
$$;

-- Supprimer les anciens triggers de validation qui pourraient interférer
DROP TRIGGER IF EXISTS trigger_check_dg_validation ON public.notes_sef;
DROP TRIGGER IF EXISTS trigger_prevent_final_modification ON public.notes_sef;
DROP TRIGGER IF EXISTS trigger_validate_notes_sef_transition ON public.notes_sef;

-- Créer le nouveau trigger unifié
CREATE TRIGGER trigger_validate_notes_sef_transition
BEFORE UPDATE ON public.notes_sef
FOR EACH ROW
EXECUTE FUNCTION public.validate_notes_sef_transition();

-- 2. Commentaire de documentation
COMMENT ON FUNCTION public.validate_notes_sef_transition IS 
'Valide les transitions de statut des Notes SEF:
- BROUILLON -> SOUMIS/A_VALIDER (créateur, champs obligatoires)
- SOUMIS/A_VALIDER -> VALIDE (DG/ADMIN)
- SOUMIS/A_VALIDER -> REJETE (DG/ADMIN, motif requis)
- SOUMIS/A_VALIDER -> DIFFERE (DG/ADMIN, motif requis)
- DIFFERE -> SOUMIS/A_VALIDER (re-soumission par créateur)
- DIFFERE -> VALIDE (DG/ADMIN)
Bloque aussi les modifications sur notes soumises/validées/rejetées.';