-- =====================================================
-- Migration: Triggers pour système unifié Dossier
-- =====================================================

-- 1. Fonction pour créer automatiquement un dossier à la validation SEF
CREATE OR REPLACE FUNCTION public.create_dossier_on_sef_validation()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_id UUID;
  v_existing_dossier_id UUID;
BEGIN
  -- Seulement si le statut passe à 'valide' ou 'valide_auto' et qu'aucun dossier n'existe
  IF (NEW.statut IN ('valide', 'valide_auto')) 
     AND (OLD.statut IS DISTINCT FROM NEW.statut OR OLD.statut IS NULL)
     AND (NEW.dossier_id IS NULL) THEN
    
    -- Vérifier qu'un dossier n'existe pas déjà pour cette SEF
    SELECT id INTO v_existing_dossier_id 
    FROM dossiers 
    WHERE note_sef_id = NEW.id 
    LIMIT 1;
    
    IF v_existing_dossier_id IS NOT NULL THEN
      -- Dossier existe déjà, on le lie
      NEW.dossier_id := v_existing_dossier_id;
      RETURN NEW;
    END IF;
    
    -- Créer le dossier
    INSERT INTO dossiers (
      numero,
      objet,
      exercice,
      direction_id,
      demandeur_id,
      beneficiaire_id,
      type_dossier,
      note_sef_id,
      etape_courante,
      statut_global,
      montant_estime,
      created_by
    ) VALUES (
      COALESCE(NEW.reference_pivot, NEW.numero) || '-D',
      NEW.objet,
      NEW.exercice,
      NEW.direction_id,
      NEW.demandeur_id,
      NEW.beneficiaire_id,
      CASE WHEN NEW.statut = 'valide_auto' THEN 'AEF_DIRECT' ELSE 'SEF' END,
      NEW.id,
      'note_sef',
      'en_cours',
      NEW.montant_estime,
      COALESCE(NEW.validated_by, NEW.created_by)
    )
    RETURNING id INTO v_dossier_id;
    
    -- Lier le dossier à la SEF
    NEW.dossier_id := v_dossier_id;
    
    -- Créer la première étape dans dossier_etapes (utilise entity_id)
    INSERT INTO dossier_etapes (
      dossier_id,
      type_etape,
      entity_id,
      statut,
      montant,
      created_by
    ) VALUES (
      v_dossier_id,
      'note_sef',
      NEW.id,
      'valide',
      NEW.montant_estime,
      COALESCE(NEW.validated_by, NEW.created_by)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_create_dossier_on_sef_validation ON public.notes_sef;

-- Créer le nouveau trigger
CREATE TRIGGER trg_create_dossier_on_sef_validation
  BEFORE UPDATE ON public.notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION public.create_dossier_on_sef_validation();

-- 2. Fonction pour mettre à jour le dossier quand une AEF est validée/imputée
CREATE OR REPLACE FUNCTION public.update_dossier_on_aef_change()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_id UUID;
BEGIN
  -- Récupérer le dossier_id depuis la SEF liée si pas directement sur l'AEF
  IF NEW.dossier_id IS NOT NULL THEN
    v_dossier_id := NEW.dossier_id;
  ELSIF NEW.note_sef_id IS NOT NULL THEN
    SELECT dossier_id INTO v_dossier_id 
    FROM notes_sef 
    WHERE id = NEW.note_sef_id;
    
    -- Mettre à jour le dossier_id sur l'AEF
    IF v_dossier_id IS NOT NULL AND NEW.dossier_id IS NULL THEN
      NEW.dossier_id := v_dossier_id;
    END IF;
  END IF;
  
  -- Si un dossier existe, mettre à jour l'étape courante
  IF v_dossier_id IS NOT NULL THEN
    -- Lors de la validation AEF (passage à a_imputer ou valide)
    IF NEW.statut IN ('valide', 'a_imputer') AND (OLD.statut IS NULL OR OLD.statut NOT IN ('valide', 'a_imputer', 'impute')) THEN
      UPDATE dossiers 
      SET etape_courante = 'note_aef',
          updated_at = now()
      WHERE id = v_dossier_id;
      
      -- Insérer l'étape AEF (ignorer si existe déjà)
      INSERT INTO dossier_etapes (dossier_id, type_etape, entity_id, statut, montant)
      VALUES (v_dossier_id, 'note_aef', NEW.id, 'valide', NEW.montant_estime)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Lors de l'imputation
    IF NEW.statut = 'impute' AND (OLD.statut IS NULL OR OLD.statut != 'impute') THEN
      UPDATE dossiers 
      SET etape_courante = 'imputation',
          updated_at = now()
      WHERE id = v_dossier_id;
      
      -- Insérer l'étape imputation
      INSERT INTO dossier_etapes (dossier_id, type_etape, entity_id, statut, montant)
      VALUES (v_dossier_id, 'imputation', NEW.id, 'valide', NEW.montant_estime)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_update_dossier_on_aef_change ON public.notes_dg;

-- Créer le trigger
CREATE TRIGGER trg_update_dossier_on_aef_change
  BEFORE UPDATE ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dossier_on_aef_change();