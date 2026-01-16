-- =====================================================
-- Migration: Améliorer système Notes AEF avec liens Dossier
-- et validation budgétaire automatique
-- =====================================================

-- 1. Ajouter les colonnes manquantes à notes_dg si nécessaire
DO $$
BEGIN
  -- S'assurer que dossier_id existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notes_dg' AND column_name = 'dossier_id') THEN
    ALTER TABLE public.notes_dg ADD COLUMN dossier_id UUID REFERENCES public.dossiers(id);
  END IF;
  
  -- Montant autorisé (après validation)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notes_dg' AND column_name = 'montant_autorise') THEN
    ALTER TABLE public.notes_dg ADD COLUMN montant_autorise NUMERIC(15,2);
  END IF;
  
  -- Flag de blocage budget insuffisant
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notes_dg' AND column_name = 'budget_bloque') THEN
    ALTER TABLE public.notes_dg ADD COLUMN budget_bloque BOOLEAN DEFAULT false;
  END IF;
  
  -- Raison de blocage budget
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notes_dg' AND column_name = 'budget_bloque_raison') THEN
    ALTER TABLE public.notes_dg ADD COLUMN budget_bloque_raison TEXT;
  END IF;
END $$;

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_notes_dg_dossier_id ON public.notes_dg(dossier_id);
CREATE INDEX IF NOT EXISTS idx_notes_dg_note_sef_id ON public.notes_dg(note_sef_id);
CREATE INDEX IF NOT EXISTS idx_notes_dg_budget_bloque ON public.notes_dg(budget_bloque) WHERE budget_bloque = true;

-- 3. Fonction pour vérifier la disponibilité budgétaire
CREATE OR REPLACE FUNCTION public.check_budget_availability(
  p_budget_line_id UUID,
  p_montant NUMERIC
)
RETURNS TABLE (
  is_available BOOLEAN,
  dotation NUMERIC,
  engaged NUMERIC,
  disponible NUMERIC,
  message TEXT
) 
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dotation NUMERIC;
  v_engaged NUMERIC;
  v_disponible NUMERIC;
BEGIN
  -- Récupérer la dotation
  SELECT COALESCE(dotation_modifiee, dotation_initiale, 0)
  INTO v_dotation
  FROM budget_lines
  WHERE id = p_budget_line_id;
  
  IF v_dotation IS NULL THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Ligne budgétaire introuvable'::TEXT;
    RETURN;
  END IF;
  
  -- Calculer le total engagé (uniquement engagements validés)
  SELECT COALESCE(SUM(montant), 0)
  INTO v_engaged
  FROM budget_engagements
  WHERE budget_line_id = p_budget_line_id
  AND statut = 'valide';
  
  v_disponible := v_dotation - v_engaged;
  
  RETURN QUERY SELECT 
    (p_montant <= v_disponible) AS is_available,
    v_dotation AS dotation,
    v_engaged AS engaged,
    v_disponible AS disponible,
    CASE 
      WHEN p_montant <= v_disponible THEN 'Budget disponible'
      ELSE 'Budget insuffisant: ' || v_disponible::TEXT || ' FCFA disponibles'
    END AS message;
END;
$$;

-- 4. Trigger pour mettre à jour le dossier après validation AEF
CREATE OR REPLACE FUNCTION public.update_dossier_on_aef_validation()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_id UUID;
  v_note_sef RECORD;
BEGIN
  -- Seulement si le statut passe à 'impute' (AEF validée et imputée)
  IF NEW.statut = 'impute' AND (OLD.statut IS DISTINCT FROM 'impute') THEN
    -- Récupérer le dossier_id depuis la note SEF liée
    IF NEW.note_sef_id IS NOT NULL THEN
      SELECT dossier_id INTO v_dossier_id
      FROM notes_sef
      WHERE id = NEW.note_sef_id;
      
      -- Mettre à jour la note AEF avec le dossier_id
      IF v_dossier_id IS NOT NULL AND NEW.dossier_id IS NULL THEN
        NEW.dossier_id := v_dossier_id;
      END IF;
      
      -- Mettre à jour l'étape actuelle du dossier
      IF v_dossier_id IS NOT NULL THEN
        UPDATE dossiers
        SET etape_actuelle = 'AEF validée',
            updated_at = NOW()
        WHERE id = v_dossier_id
        AND etape_actuelle IN ('SEF validée', 'initié', 'brouillon');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger
DROP TRIGGER IF EXISTS trg_update_dossier_on_aef_validation ON public.notes_dg;
CREATE TRIGGER trg_update_dossier_on_aef_validation
  BEFORE UPDATE ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dossier_on_aef_validation();

-- 5. Trigger pour générer une alerte si budget insuffisant
CREATE OR REPLACE FUNCTION public.check_aef_budget_on_submit()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_check RECORD;
BEGIN
  -- Seulement si soumis et ligne budgétaire définie
  IF NEW.statut = 'soumis' AND NEW.ligne_budgetaire_id IS NOT NULL AND NEW.montant_estime > 0 THEN
    -- Vérifier la disponibilité budgétaire
    SELECT * INTO v_budget_check
    FROM check_budget_availability(NEW.ligne_budgetaire_id, NEW.montant_estime);
    
    IF NOT v_budget_check.is_available THEN
      -- Marquer comme bloqué
      NEW.budget_bloque := true;
      NEW.budget_bloque_raison := v_budget_check.message;
      
      -- Créer une alerte
      INSERT INTO alerts (
        title,
        type,
        severity,
        description,
        module,
        entity_table,
        entity_id,
        entity_code,
        status
      ) VALUES (
        'Budget insuffisant pour Note AEF',
        'budget_insuffisant',
        'high',
        'La Note AEF ' || COALESCE(NEW.reference_pivot, NEW.numero, NEW.id::text) || 
        ' demande ' || NEW.montant_estime || ' FCFA mais seulement ' || 
        v_budget_check.disponible || ' FCFA sont disponibles.',
        'notes_aef',
        'notes_dg',
        NEW.id,
        NEW.reference_pivot,
        'open'
      );
    ELSE
      -- Réinitialiser le blocage si budget OK
      NEW.budget_bloque := false;
      NEW.budget_bloque_raison := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_aef_budget_on_submit ON public.notes_dg;
CREATE TRIGGER trg_check_aef_budget_on_submit
  BEFORE INSERT OR UPDATE ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION public.check_aef_budget_on_submit();

-- 6. Créer une tâche workflow automatiquement pour validation AEF
CREATE OR REPLACE FUNCTION public.create_aef_validation_task()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand une AEF passe en soumis
  IF NEW.statut = 'soumis' AND (OLD.statut IS NULL OR OLD.statut = 'brouillon') THEN
    INSERT INTO workflow_tasks (
      type,
      etape,
      entity_type,
      entity_id,
      entity_code,
      label,
      assignee_role,
      priority,
      status,
      due_date,
      dossier_id,
      exercice
    ) VALUES (
      'validation',
      'AEF',
      'note_aef',
      NEW.id,
      NEW.reference_pivot,
      'Valider Note AEF: ' || COALESCE(NEW.objet, NEW.reference_pivot, ''),
      'DG',
      CASE NEW.priorite WHEN 'urgente' THEN 'urgente' WHEN 'haute' THEN 'haute' ELSE 'normale' END,
      'open',
      NOW() + INTERVAL '3 days',
      NEW.dossier_id,
      NEW.exercice
    );
  END IF;
  
  -- Fermer la tâche quand validé/rejeté/imputé
  IF NEW.statut IN ('a_imputer', 'impute', 'rejete') AND OLD.statut = 'soumis' THEN
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

DROP TRIGGER IF EXISTS trg_create_aef_validation_task ON public.notes_dg;
CREATE TRIGGER trg_create_aef_validation_task
  AFTER INSERT OR UPDATE ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION public.create_aef_validation_task();