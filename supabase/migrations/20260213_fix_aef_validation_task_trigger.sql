-- Migration: Fix trigger create_aef_validation_task
-- Bug: Uses wrong column names (type→task_type, etape/label don't exist)
-- The trigger fires when notes_dg status changes to 'soumis'

CREATE OR REPLACE FUNCTION public.create_aef_validation_task()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand une AEF passe en soumis
  IF NEW.statut = 'soumis' AND (OLD.statut IS NULL OR OLD.statut = 'brouillon') THEN
    INSERT INTO workflow_tasks (
      task_type,
      entity_type,
      entity_id,
      entity_code,
      entity_title,
      assignee_role,
      priority,
      status,
      due_date,
      dossier_id,
      exercice
    ) VALUES (
      'validation',
      'note_aef',
      NEW.id,
      COALESCE(NEW.reference_pivot, NEW.numero),
      'Valider Note AEF: ' || COALESCE(NEW.objet, NEW.reference_pivot, ''),
      'DG',
      CASE NEW.priorite WHEN 'urgente' THEN 'urgente' WHEN 'haute' THEN 'haute' ELSE 'normale' END,
      'open',
      NOW() + INTERVAL '3 days',
      NEW.dossier_id,
      COALESCE(NEW.exercice, EXTRACT(year FROM CURRENT_DATE)::integer)
    );
  END IF;

  -- Fermer la tâche quand validé/rejeté/imputé
  IF NEW.statut IN ('a_imputer', 'impute', 'rejete') AND OLD.statut IN ('soumis', 'a_valider') THEN
    UPDATE workflow_tasks
    SET status = 'done',
        completed_at = NOW()
    WHERE entity_type = 'note_aef'
    AND entity_id = NEW.id
    AND status = 'open';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
