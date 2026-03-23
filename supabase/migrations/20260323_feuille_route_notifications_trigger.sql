-- Migration: Triggers notifications pour Feuille de Route
-- Applied: 23/03/2026
-- Purpose: Notifications automatiques sur changements de statut plans_travail + taches

-- 1. Plans de travail: soumis → notif DG/DAAF, validé → notif créateur, rejeté → notif créateur (urgent)
CREATE OR REPLACE FUNCTION fn_notify_plan_travail_workflow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_direction_label TEXT; v_recipient RECORD;
BEGIN
  IF NEW.statut = OLD.statut THEN RETURN NEW; END IF;
  SELECT label INTO v_direction_label FROM directions WHERE id = NEW.direction_id;
  CASE NEW.statut
    WHEN 'soumis' THEN
      FOR v_recipient IN SELECT p.id FROM profiles p JOIN user_roles ur ON ur.user_id = p.id WHERE ur.role IN ('DG', 'DAAF') LOOP
        INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
        VALUES (v_recipient.id, 'plan_travail_soumis', 'Plan soumis — ' || COALESCE(v_direction_label, ''), 'Le plan "' || NEW.libelle || '" soumis pour validation.', 'plans_travail', NEW.id, 'workflow');
      END LOOP;
    WHEN 'valide' THEN
      IF NEW.created_by IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
        VALUES (NEW.created_by, 'plan_travail_valide', 'Plan validé — ' || NEW.libelle, 'Votre plan a été validé.', 'plans_travail', NEW.id, 'workflow');
      END IF;
    WHEN 'rejete' THEN
      IF NEW.created_by IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category, is_urgent)
        VALUES (NEW.created_by, 'plan_travail_rejete', 'Plan rejeté — ' || NEW.libelle, 'Veuillez réviser votre plan.', 'plans_travail', NEW.id, 'workflow', true);
      END IF;
  END CASE;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_plan_travail_workflow ON plans_travail;
CREATE TRIGGER trg_notify_plan_travail_workflow AFTER UPDATE OF statut ON plans_travail FOR EACH ROW EXECUTE FUNCTION fn_notify_plan_travail_workflow();

-- 2. Tâches: terminé → notif accountable, en_retard → notif responsable (urgent)
CREATE OR REPLACE FUNCTION fn_notify_tache_workflow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.statut = OLD.statut THEN RETURN NEW; END IF;
  CASE NEW.statut
    WHEN 'termine' THEN
      IF NEW.raci_accountable IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
        VALUES (NEW.raci_accountable::UUID, 'tache_terminee', 'Tâche terminée — ' || NEW.libelle, 'Code: ' || NEW.code, 'taches', NEW.id, 'information');
      END IF;
    WHEN 'en_retard' THEN
      IF NEW.responsable_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category, is_urgent)
        VALUES (NEW.responsable_id, 'tache_en_retard', 'Tâche en retard — ' || NEW.libelle, 'Date prévue: ' || COALESCE(NEW.date_fin::TEXT, 'N/A'), 'taches', NEW.id, 'alert', true);
      END IF;
  END CASE;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_tache_workflow ON taches;
CREATE TRIGGER trg_notify_tache_workflow AFTER UPDATE OF statut ON taches FOR EACH ROW EXECUTE FUNCTION fn_notify_tache_workflow();

-- 3. Tâches: avancement 100% → notif accountable
CREATE OR REPLACE FUNCTION fn_notify_tache_avancement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.avancement = 100 AND (OLD.avancement IS NULL OR OLD.avancement < 100) THEN
    IF NEW.raci_accountable IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, category)
      VALUES (NEW.raci_accountable::UUID, 'tache_100_pourcent', 'Tâche 100% — ' || NEW.libelle, 'Veuillez vérifier et valider.', 'taches', NEW.id, 'workflow');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_tache_avancement ON taches;
CREATE TRIGGER trg_notify_tache_avancement AFTER UPDATE OF avancement ON taches FOR EACH ROW EXECUTE FUNCTION fn_notify_tache_avancement();
