
-- ======================================================================
-- Migration: Validation backend pour AEF directe sans SEF
-- ======================================================================

-- ÉTAPE 0: Désactiver temporairement le trigger de protection
ALTER TABLE notes_dg DISABLE TRIGGER trigger_prevent_final_note_modification;

-- ÉTAPE 1: Corriger les données existantes AVANT d'ajouter la validation
-- Ajouter une justification par défaut aux notes DIRECT existantes sans justification
UPDATE notes_dg 
SET justification = 'Note AEF créée avant la mise en place de la validation d''origine (migration automatique)',
    is_direct_aef = TRUE
WHERE note_sef_id IS NULL 
  AND (justification IS NULL OR TRIM(justification) = '');

-- Mettre à jour les notes existantes pour cohérence origin
UPDATE notes_dg 
SET origin = 'FROM_SEF', is_direct_aef = FALSE
WHERE note_sef_id IS NOT NULL;

UPDATE notes_dg 
SET origin = 'DIRECT', is_direct_aef = TRUE
WHERE note_sef_id IS NULL;

-- Réactiver le trigger de protection
ALTER TABLE notes_dg ENABLE TRIGGER trigger_prevent_final_note_modification;

-- ÉTAPE 2: Créer la fonction de validation
CREATE OR REPLACE FUNCTION public.validate_note_aef_origin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sef_statut TEXT;
  v_user_is_dg BOOLEAN := FALSE;
BEGIN
  -- Déterminer si l'utilisateur est DG/ADMIN
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = COALESCE(NEW.created_by, auth.uid())
    AND role IN ('ADMIN', 'DG')
  ) INTO v_user_is_dg;

  -- Définir origin en fonction de note_sef_id et is_direct_aef
  IF NEW.note_sef_id IS NOT NULL THEN
    NEW.origin := 'FROM_SEF';
    NEW.is_direct_aef := FALSE;
    
    -- Vérifier que la Note SEF existe et est validée
    SELECT statut INTO v_sef_statut
    FROM notes_sef
    WHERE id = NEW.note_sef_id;
    
    IF v_sef_statut IS NULL THEN
      RAISE EXCEPTION 'Note SEF introuvable (id: %)', NEW.note_sef_id;
    END IF;
    
    IF v_sef_statut != 'valide' THEN
      RAISE EXCEPTION 'La Note SEF doit être validée pour créer une AEF (statut actuel: %)', v_sef_statut;
    END IF;
    
  ELSIF NEW.is_direct_aef = TRUE OR NEW.origin = 'DIRECT' THEN
    NEW.origin := 'DIRECT';
    NEW.is_direct_aef := TRUE;
    
    -- Vérifier que l'utilisateur est DG/ADMIN pour créer une AEF directe (sauf pour les brouillons en cours de mise à jour)
    IF TG_OP = 'INSERT' AND NOT v_user_is_dg THEN
      RAISE EXCEPTION 'Seuls les utilisateurs DG ou ADMIN peuvent créer une Note AEF directe (sans Note SEF)';
    END IF;
    
    -- Justification obligatoire pour AEF directe à la soumission
    IF NEW.statut IN ('soumis', 'a_valider', 'a_imputer', 'impute') THEN
      IF NEW.justification IS NULL OR TRIM(NEW.justification) = '' THEN
        RAISE EXCEPTION 'Une justification est obligatoire pour une Note AEF directe';
      END IF;
    END IF;
    
  ELSE
    -- Par défaut, sans note_sef_id et sans is_direct_aef, on exige une SEF à la soumission
    IF NEW.statut IN ('soumis', 'a_valider', 'a_imputer', 'impute') THEN
      RAISE EXCEPTION 'Une Note AEF doit être liée à une Note SEF validée ou créée comme AEF directe (DG uniquement)';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_validate_note_aef_origin ON notes_dg;

-- Créer le trigger de validation
CREATE TRIGGER trg_validate_note_aef_origin
  BEFORE INSERT OR UPDATE ON notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION validate_note_aef_origin();

-- ÉTAPE 3: Mettre à jour la fonction de logging pour distinguer CREATE_DIRECT_AEF
CREATE OR REPLACE FUNCTION public.log_note_aef_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notes_aef_history (
    note_id,
    action,
    new_statut,
    commentaire,
    performed_by,
    performed_at,
    metadata
  ) VALUES (
    NEW.id,
    CASE 
      WHEN NEW.is_direct_aef = TRUE OR NEW.origin = 'DIRECT' THEN 'CREATE_DIRECT_AEF'
      ELSE 'CREATE_DRAFT'
    END,
    NEW.statut,
    CASE 
      WHEN NEW.is_direct_aef = TRUE OR NEW.origin = 'DIRECT' THEN 
        'AEF directe créée par DG - Justification: ' || COALESCE(SUBSTRING(NEW.justification FROM 1 FOR 100), 'N/A')
      WHEN NEW.note_sef_id IS NOT NULL THEN 
        'Créée depuis Note SEF'
      ELSE 
        'Création brouillon'
    END,
    COALESCE(NEW.created_by, auth.uid()),
    now(),
    jsonb_build_object(
      'origin', NEW.origin,
      'is_direct_aef', NEW.is_direct_aef,
      'note_sef_id', NEW.note_sef_id,
      'justification_preview', CASE WHEN NEW.justification IS NOT NULL THEN SUBSTRING(NEW.justification FROM 1 FOR 200) ELSE NULL END
    )
  );
  
  RETURN NEW;
END;
$$;

-- ÉTAPE 4: Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notes_dg_origin ON notes_dg(origin);
CREATE INDEX IF NOT EXISTS idx_notes_dg_is_direct_aef ON notes_dg(is_direct_aef) WHERE is_direct_aef = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_dg_note_sef_id ON notes_dg(note_sef_id) WHERE note_sef_id IS NOT NULL;

-- ÉTAPE 5: Commentaires pour documentation
COMMENT ON COLUMN notes_dg.origin IS 'Origine de la note AEF: FROM_SEF (liée à une Note SEF) ou DIRECT (créée directement par DG)';
COMMENT ON COLUMN notes_dg.is_direct_aef IS 'Indique si la note AEF a été créée directement (sans Note SEF préalable). Réservé aux DG/ADMIN.';
COMMENT ON COLUMN notes_dg.note_sef_id IS 'Référence vers la Note SEF validée (nullable pour les AEF directes)';
COMMENT ON COLUMN notes_dg.justification IS 'Justification obligatoire pour les AEF directes (sans Note SEF)';
