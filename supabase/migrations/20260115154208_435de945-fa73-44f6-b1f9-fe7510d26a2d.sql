-- ============================================
-- MIGRATION: Liaison Notes SEF → Dossiers → Notes AEF
-- Objectif: Créer automatiquement un dossier à la validation SEF
-- ============================================

-- 1. Ajouter note_sef_id sur la table dossiers si manquant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dossiers' AND column_name = 'note_sef_id'
  ) THEN
    ALTER TABLE public.dossiers ADD COLUMN note_sef_id uuid REFERENCES public.notes_dg(id);
    CREATE INDEX idx_dossiers_note_sef_id ON public.dossiers(note_sef_id);
    COMMENT ON COLUMN public.dossiers.note_sef_id IS 'Référence à la note SEF source ayant déclenché ce dossier';
  END IF;
END $$;

-- 2. Ajouter dossier_id sur notes_dg si manquant (normalement déjà existant)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes_dg' AND column_name = 'dossier_id'
  ) THEN
    ALTER TABLE public.notes_dg ADD COLUMN dossier_id uuid REFERENCES public.dossiers(id);
  END IF;
END $$;

-- 3. Fonction pour créer le dossier lors de la validation d'une note SEF
CREATE OR REPLACE FUNCTION create_dossier_on_sef_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_dossier_id uuid;
  note_direction_id uuid;
  note_demandeur_id uuid;
  note_beneficiaire_id uuid;
  note_objet text;
  note_exercice int;
  note_montant numeric;
BEGIN
  -- Seulement si le statut passe à 'valide' (validation DG)
  IF NEW.statut = 'valide' AND (OLD.statut IS DISTINCT FROM 'valide') THEN
    -- Vérifier qu'il n'existe pas déjà un dossier lié
    IF NEW.dossier_id IS NULL THEN
      -- Récupérer les infos de la note
      note_direction_id := NEW.direction_id;
      note_demandeur_id := NEW.created_by;
      note_objet := NEW.objet;
      note_exercice := COALESCE(NEW.exercice, EXTRACT(year FROM CURRENT_DATE)::int);
      note_montant := COALESCE(NEW.montant_estime, 0);
      
      -- Récupérer le bénéficiaire si présent
      note_beneficiaire_id := NEW.beneficiaire_id;
      
      -- Créer le dossier
      INSERT INTO public.dossiers (
        objet,
        exercice,
        direction_id,
        demandeur_id,
        beneficiaire_id,
        type_dossier,
        montant_estime,
        statut_global,
        etape_courante,
        note_sef_id,
        created_by
      ) VALUES (
        note_objet,
        note_exercice,
        note_direction_id,
        note_demandeur_id,
        note_beneficiaire_id,
        'AEF',
        note_montant,
        'en_cours',
        'note_aef',
        NEW.id,
        NEW.validated_by
      )
      RETURNING id INTO new_dossier_id;
      
      -- Lier le dossier à la note SEF
      NEW.dossier_id := new_dossier_id;
      
      -- Créer l'étape initiale (note_sef validée)
      INSERT INTO public.dossier_etapes (
        dossier_id,
        type_etape,
        entity_id,
        statut,
        montant,
        commentaire,
        created_by
      ) VALUES (
        new_dossier_id,
        'note_sef',
        NEW.id,
        'valide',
        note_montant,
        'Note SEF validée par DG - dossier créé automatiquement',
        NEW.validated_by
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_create_dossier_on_sef_validation ON public.notes_dg;

-- 5. Créer le trigger BEFORE UPDATE pour pouvoir modifier NEW.dossier_id
CREATE TRIGGER trg_create_dossier_on_sef_validation
  BEFORE UPDATE ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION create_dossier_on_sef_validation();

-- 6. Ajouter commentaires
COMMENT ON FUNCTION create_dossier_on_sef_validation() IS 'Crée automatiquement un dossier de dépense lors de la validation DG d''une note SEF';
COMMENT ON TRIGGER trg_create_dossier_on_sef_validation ON public.notes_dg IS 'Trigger pour créer un dossier à la validation SEF';