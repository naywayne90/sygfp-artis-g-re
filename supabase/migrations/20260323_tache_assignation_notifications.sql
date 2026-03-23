-- Notification quand un responsable est assigne a une tache
CREATE OR REPLACE FUNCTION fn_notify_tache_assignation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify when responsable_id changes (assigned or reassigned)
  IF NEW.responsable_id IS NOT NULL AND
     (OLD.responsable_id IS NULL OR NEW.responsable_id != OLD.responsable_id) THEN
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
    VALUES (
      NEW.responsable_id,
      'tache_assignee',
      'Tache assignee — ' || NEW.libelle,
      'Vous avez ete assigne comme responsable de la tache "' || NEW.libelle || '" (code: ' || NEW.code || '). Priorite: ' || COALESCE(NEW.priorite, 'normale') || '.',
      'taches', NEW.id, 'workflow'
    );
  END IF;

  -- Notify RACI accountable when assigned
  IF NEW.raci_accountable IS NOT NULL AND
     (OLD.raci_accountable IS NULL OR NEW.raci_accountable != OLD.raci_accountable) THEN
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
    VALUES (
      NEW.raci_accountable::UUID,
      'tache_raci_accountable',
      'Vous etes Accountable — ' || NEW.libelle,
      'Vous avez ete designe comme accountable pour la tache "' || NEW.libelle || '".',
      'taches', NEW.id, 'information'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_tache_assignation ON taches;
CREATE TRIGGER trg_notify_tache_assignation
  AFTER INSERT OR UPDATE OF responsable_id, raci_accountable ON taches
  FOR EACH ROW EXECUTE FUNCTION fn_notify_tache_assignation();

-- Notification quand un responsable est assigne a un plan de travail
CREATE OR REPLACE FUNCTION fn_notify_plan_assignation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.responsable_id IS NOT NULL AND
     (OLD.responsable_id IS NULL OR NEW.responsable_id != OLD.responsable_id) THEN
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
    VALUES (
      NEW.responsable_id,
      'plan_travail_assigne',
      'Plan de travail assigne — ' || NEW.libelle,
      'Vous etes responsable du plan "' || NEW.libelle || '".',
      'plans_travail', NEW.id, 'workflow'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_plan_assignation ON plans_travail;
CREATE TRIGGER trg_notify_plan_assignation
  AFTER INSERT OR UPDATE OF responsable_id ON plans_travail
  FOR EACH ROW EXECUTE FUNCTION fn_notify_plan_assignation();
