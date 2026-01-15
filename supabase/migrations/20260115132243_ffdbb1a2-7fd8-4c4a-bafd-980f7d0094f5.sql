-- ================================================================
-- CONSOLIDATION BACKEND NOTES SEF - Migration incrémentale
-- Ajout colonnes manquantes SANS casser l'existant
-- ================================================================

-- 1. Ajout colonne soft delete si manquante
ALTER TABLE public.notes_sef
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- 2. Ajout snapshots demandeur/bénéficiaire pour historique
ALTER TABLE public.notes_sef
ADD COLUMN IF NOT EXISTS demandeur_display text;

ALTER TABLE public.notes_sef
ADD COLUMN IF NOT EXISTS beneficiaire_nom text;

ALTER TABLE public.notes_sef
ADD COLUMN IF NOT EXISTS beneficiaire_type text;

-- 3. Index sur is_deleted pour filtrer les notes actives
CREATE INDEX IF NOT EXISTS idx_notes_sef_is_deleted 
ON public.notes_sef(is_deleted) 
WHERE is_deleted = false;

-- 4. Index composite pour les requêtes de liste principales
CREATE INDEX IF NOT EXISTS idx_notes_sef_active_list 
ON public.notes_sef(exercice, statut, is_deleted, updated_at DESC) 
WHERE is_deleted = false;

-- 5. Créer une vue notes_sef_audit_log comme alias de notes_sef_history
-- pour compatibilité avec le schéma demandé
CREATE OR REPLACE VIEW public.notes_sef_audit_log AS
SELECT 
  id,
  note_id,
  action,
  old_statut AS from_status,
  new_statut AS to_status,
  commentaire AS message,
  performed_by AS actor_id,
  performed_at AS created_at,
  ip_address
FROM public.notes_sef_history;

-- 6. Trigger pour remplir automatiquement les snapshots à la création/mise à jour
CREATE OR REPLACE FUNCTION public.sync_notes_sef_snapshots()
RETURNS TRIGGER AS $$
BEGIN
  -- Snapshot demandeur
  IF NEW.demandeur_id IS NOT NULL AND (NEW.demandeur_display IS NULL OR TG_OP = 'INSERT') THEN
    SELECT COALESCE(first_name || ' ' || last_name, email, 'Utilisateur')
    INTO NEW.demandeur_display
    FROM public.profiles
    WHERE id = NEW.demandeur_id;
  END IF;
  
  -- Snapshot bénéficiaire externe
  IF NEW.beneficiaire_id IS NOT NULL AND (NEW.beneficiaire_nom IS NULL OR TG_OP = 'INSERT') THEN
    SELECT raison_sociale
    INTO NEW.beneficiaire_nom
    FROM public.prestataires
    WHERE id = NEW.beneficiaire_id;
    NEW.beneficiaire_type := 'PRESTATAIRE_EXTERNE';
  END IF;
  
  -- Snapshot bénéficiaire interne
  IF NEW.beneficiaire_interne_id IS NOT NULL AND (NEW.beneficiaire_nom IS NULL OR TG_OP = 'INSERT') THEN
    SELECT COALESCE(first_name || ' ' || last_name, email, 'Agent')
    INTO NEW.beneficiaire_nom
    FROM public.profiles
    WHERE id = NEW.beneficiaire_interne_id;
    NEW.beneficiaire_type := 'AGENT_INTERNE';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Supprimer trigger existant s'il existe
DROP TRIGGER IF EXISTS trigger_sync_notes_sef_snapshots ON public.notes_sef;

-- Créer le trigger
CREATE TRIGGER trigger_sync_notes_sef_snapshots
BEFORE INSERT OR UPDATE ON public.notes_sef
FOR EACH ROW
EXECUTE FUNCTION public.sync_notes_sef_snapshots();

-- 7. Mettre à jour les snapshots pour les données existantes
UPDATE public.notes_sef n
SET 
  demandeur_display = COALESCE(
    (SELECT COALESCE(p.first_name || ' ' || p.last_name, p.email) FROM public.profiles p WHERE p.id = n.demandeur_id),
    n.demandeur_display
  ),
  beneficiaire_nom = COALESCE(
    CASE 
      WHEN n.beneficiaire_id IS NOT NULL THEN 
        (SELECT pr.raison_sociale FROM public.prestataires pr WHERE pr.id = n.beneficiaire_id)
      WHEN n.beneficiaire_interne_id IS NOT NULL THEN 
        (SELECT COALESCE(p.first_name || ' ' || p.last_name, p.email) FROM public.profiles p WHERE p.id = n.beneficiaire_interne_id)
      ELSE NULL
    END,
    n.beneficiaire_nom
  ),
  beneficiaire_type = COALESCE(
    CASE 
      WHEN n.beneficiaire_id IS NOT NULL THEN 'PRESTATAIRE_EXTERNE'
      WHEN n.beneficiaire_interne_id IS NOT NULL THEN 'AGENT_INTERNE'
      ELSE NULL
    END,
    n.beneficiaire_type
  )
WHERE n.demandeur_display IS NULL 
   OR n.beneficiaire_nom IS NULL 
   OR n.beneficiaire_type IS NULL;

-- 8. Commentaires sur les colonnes pour documentation
COMMENT ON COLUMN public.notes_sef.is_deleted IS 'Soft delete flag - true si la note est supprimée';
COMMENT ON COLUMN public.notes_sef.demandeur_display IS 'Snapshot du nom du demandeur au moment de la création';
COMMENT ON COLUMN public.notes_sef.beneficiaire_nom IS 'Snapshot du nom du bénéficiaire';
COMMENT ON COLUMN public.notes_sef.beneficiaire_type IS 'Type de bénéficiaire: PRESTATAIRE_EXTERNE ou AGENT_INTERNE';
COMMENT ON VIEW public.notes_sef_audit_log IS 'Vue alias de notes_sef_history pour compatibilité';