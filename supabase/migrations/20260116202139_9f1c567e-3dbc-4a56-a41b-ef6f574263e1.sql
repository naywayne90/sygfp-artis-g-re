-- ============================================
-- TABLE workflow_tasks : Centre de travail des tâches
-- ============================================

CREATE TABLE IF NOT EXISTS public.workflow_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Type de tâche
  task_type TEXT NOT NULL CHECK (task_type IN (
    'validation', 'correction', 'signature', 'paiement', 
    'imputation', 'approbation', 'verification', 'autre'
  )),
  
  -- Entité liée
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'note_sef', 'note_aef', 'imputation', 'engagement', 
    'liquidation', 'ordonnancement', 'reglement', 'virement', 'marche'
  )),
  entity_id UUID NOT NULL,
  entity_code TEXT NOT NULL,
  entity_title TEXT,
  
  -- Dossier parent (pour regroupement)
  dossier_id UUID REFERENCES public.dossiers(id) ON DELETE CASCADE,
  
  -- Assignation
  assignee_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignee_role TEXT NOT NULL,
  direction_id UUID REFERENCES public.directions(id) ON DELETE SET NULL,
  
  -- SLA et priorité
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT NOT NULL DEFAULT 'normale' CHECK (priority IN ('basse', 'normale', 'haute', 'urgente')),
  sla_hours INTEGER DEFAULT 48,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  
  -- Métadonnées
  montant NUMERIC,
  metadata JSONB DEFAULT '{}',
  
  -- Actions
  action_taken TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completion_comment TEXT,
  
  -- Créateur et dates
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Exercice budgétaire
  exercice INTEGER NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assignee_user ON public.workflow_tasks(assignee_user_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assignee_role ON public.workflow_tasks(assignee_role) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON public.workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_entity ON public.workflow_tasks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_dossier ON public.workflow_tasks(dossier_id) WHERE dossier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_due_date ON public.workflow_tasks(due_date) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_exercice ON public.workflow_tasks(exercice);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_direction ON public.workflow_tasks(direction_id) WHERE status = 'open';

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_workflow_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_workflow_tasks_updated_at ON public.workflow_tasks;
CREATE TRIGGER update_workflow_tasks_updated_at
  BEFORE UPDATE ON public.workflow_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workflow_tasks_updated_at();

-- ============================================
-- FONCTIONS DE GÉNÉRATION AUTOMATIQUE DE TÂCHES
-- ============================================

-- Fonction générique pour créer une tâche
CREATE OR REPLACE FUNCTION public.create_workflow_task(
  p_task_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_code TEXT,
  p_entity_title TEXT,
  p_dossier_id UUID,
  p_assignee_role TEXT,
  p_direction_id UUID,
  p_priority TEXT DEFAULT 'normale',
  p_sla_hours INTEGER DEFAULT 48,
  p_montant NUMERIC DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_exercice INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_task_id UUID;
  v_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculer la date limite
  v_due_date := now() + (p_sla_hours || ' hours')::INTERVAL;
  
  -- Insérer la tâche
  INSERT INTO public.workflow_tasks (
    task_type, entity_type, entity_id, entity_code, entity_title,
    dossier_id, assignee_role, direction_id, priority, sla_hours,
    due_date, montant, created_by, exercice
  ) VALUES (
    p_task_type, p_entity_type, p_entity_id, p_entity_code, p_entity_title,
    p_dossier_id, p_assignee_role, p_direction_id, p_priority, p_sla_hours,
    v_due_date, p_montant, p_created_by, COALESCE(p_exercice, EXTRACT(year FROM CURRENT_DATE)::INTEGER)
  )
  RETURNING id INTO v_task_id;
  
  RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour fermer une tâche
CREATE OR REPLACE FUNCTION public.close_workflow_task(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_user_id UUID DEFAULT NULL,
  p_comment TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.workflow_tasks
  SET 
    status = 'done',
    action_taken = p_action,
    completed_at = now(),
    completed_by = p_user_id,
    completion_comment = p_comment
  WHERE entity_type = p_entity_type 
    AND entity_id = p_entity_id 
    AND status IN ('open', 'in_progress');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour annuler les tâches d'une entité
CREATE OR REPLACE FUNCTION public.cancel_workflow_tasks(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.workflow_tasks
  SET status = 'cancelled', updated_at = now()
  WHERE entity_type = p_entity_type 
    AND entity_id = p_entity_id 
    AND status IN ('open', 'in_progress');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- TRIGGERS AUTOMATIQUES PAR TYPE D'ENTITÉ
-- ============================================

-- Trigger pour notes_dg (SEF/AEF)
CREATE OR REPLACE FUNCTION public.trg_create_task_for_note()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_task_type TEXT;
  v_entity_type TEXT;
  v_direction_id UUID;
BEGIN
  -- Déterminer le type d'entité et le rôle cible
  IF NEW.type_note = 'SEF' THEN
    v_entity_type := 'note_sef';
    v_role := 'DG';
    v_task_type := 'validation';
  ELSE
    v_entity_type := 'note_aef';
    v_role := 'DIRECTEUR';
    v_task_type := 'validation';
  END IF;
  
  -- Récupérer la direction
  v_direction_id := NEW.direction_id;
  
  -- Créer une tâche quand le statut passe à "soumis"
  IF NEW.statut = 'soumis' AND (OLD IS NULL OR OLD.statut != 'soumis') THEN
    PERFORM public.create_workflow_task(
      v_task_type,
      v_entity_type,
      NEW.id,
      NEW.numero,
      NEW.objet,
      NEW.dossier_id,
      v_role,
      v_direction_id,
      COALESCE(NEW.urgence, 'normale'),
      CASE WHEN NEW.urgence = 'urgente' THEN 24 ELSE 48 END,
      NEW.montant_estime,
      NEW.created_by,
      NEW.exercice
    );
  END IF;
  
  -- Fermer la tâche quand validé/rejeté
  IF NEW.statut IN ('valide', 'rejete') AND OLD.statut = 'soumis' THEN
    PERFORM public.close_workflow_task(
      v_entity_type,
      NEW.id,
      CASE WHEN NEW.statut = 'valide' THEN 'validated' ELSE 'rejected' END,
      NEW.validated_by,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_workflow_task_note ON public.notes_dg;
CREATE TRIGGER trg_workflow_task_note
  AFTER INSERT OR UPDATE OF statut ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_create_task_for_note();

-- Trigger pour engagements
CREATE OR REPLACE FUNCTION public.trg_create_task_for_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une tâche quand soumis pour validation CB
  IF NEW.statut = 'soumis' AND (OLD IS NULL OR OLD.statut != 'soumis') THEN
    PERFORM public.create_workflow_task(
      'validation',
      'engagement',
      NEW.id,
      NEW.numero,
      NEW.objet,
      NEW.dossier_id,
      'CB',
      NULL,
      'normale',
      48,
      NEW.montant,
      NEW.created_by,
      NEW.exercice
    );
  END IF;
  
  -- Fermer la tâche quand validé/rejeté
  IF NEW.statut IN ('valide', 'rejete') AND OLD.statut = 'soumis' THEN
    PERFORM public.close_workflow_task(
      'engagement',
      NEW.id,
      CASE WHEN NEW.statut = 'valide' THEN 'validated' ELSE 'rejected' END,
      NULL,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_workflow_task_engagement ON public.budget_engagements;
CREATE TRIGGER trg_workflow_task_engagement
  AFTER INSERT OR UPDATE OF statut ON public.budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_create_task_for_engagement();

-- Trigger pour liquidations
CREATE OR REPLACE FUNCTION public.trg_create_task_for_liquidation()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une tâche quand soumis pour validation DAAF
  IF NEW.statut = 'soumis' AND (OLD IS NULL OR OLD.statut != 'soumis') THEN
    PERFORM public.create_workflow_task(
      'validation',
      'liquidation',
      NEW.id,
      NEW.numero,
      NULL,
      NEW.dossier_id,
      'DAAF',
      NULL,
      'normale',
      48,
      NEW.montant,
      NEW.created_by,
      NEW.exercice
    );
  END IF;
  
  -- Fermer la tâche quand validé/rejeté
  IF NEW.statut IN ('valide', 'rejete') AND OLD.statut = 'soumis' THEN
    PERFORM public.close_workflow_task(
      'liquidation',
      NEW.id,
      CASE WHEN NEW.statut = 'valide' THEN 'validated' ELSE 'rejected' END,
      NEW.validated_by,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_workflow_task_liquidation ON public.budget_liquidations;
CREATE TRIGGER trg_workflow_task_liquidation
  AFTER INSERT OR UPDATE OF statut ON public.budget_liquidations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_create_task_for_liquidation();

-- Trigger pour ordonnancements
CREATE OR REPLACE FUNCTION public.trg_create_task_for_ordonnancement()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une tâche pour signature DG
  IF NEW.statut = 'soumis' AND (OLD IS NULL OR OLD.statut != 'soumis') THEN
    PERFORM public.create_workflow_task(
      'signature',
      'ordonnancement',
      NEW.id,
      NEW.numero,
      NULL,
      NEW.dossier_id,
      'DG',
      NULL,
      'normale',
      24,
      NEW.montant,
      NEW.created_by,
      NEW.exercice
    );
  END IF;
  
  -- Fermer la tâche quand signé/rejeté
  IF NEW.statut IN ('signe', 'rejete') AND OLD.statut = 'soumis' THEN
    PERFORM public.close_workflow_task(
      'ordonnancement',
      NEW.id,
      CASE WHEN NEW.statut = 'signe' THEN 'signed' ELSE 'rejected' END,
      NEW.signe_par,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_workflow_task_ordonnancement ON public.ordonnancements;
CREATE TRIGGER trg_workflow_task_ordonnancement
  AFTER INSERT OR UPDATE OF statut ON public.ordonnancements
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_create_task_for_ordonnancement();

-- Trigger pour règlements
CREATE OR REPLACE FUNCTION public.trg_create_task_for_reglement()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une tâche pour paiement Trésorerie
  IF NEW.statut = 'en_attente' AND (OLD IS NULL OR OLD.statut != 'en_attente') THEN
    PERFORM public.create_workflow_task(
      'paiement',
      'reglement',
      NEW.id,
      NEW.numero,
      NULL,
      NEW.dossier_id,
      'TRESORERIE',
      NULL,
      'normale',
      72,
      NEW.montant,
      NEW.created_by,
      NEW.exercice
    );
  END IF;
  
  -- Fermer la tâche quand payé/annulé
  IF NEW.statut IN ('paye', 'annule') AND OLD.statut = 'en_attente' THEN
    PERFORM public.close_workflow_task(
      'reglement',
      NEW.id,
      CASE WHEN NEW.statut = 'paye' THEN 'paid' ELSE 'cancelled' END,
      NEW.execute_par,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_workflow_task_reglement ON public.reglements;
CREATE TRIGGER trg_workflow_task_reglement
  AFTER INSERT OR UPDATE OF statut ON public.reglements
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_create_task_for_reglement();

-- Trigger pour virements
CREATE OR REPLACE FUNCTION public.trg_create_task_for_virement()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une tâche pour approbation CB
  IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
    PERFORM public.create_workflow_task(
      'approbation',
      'virement',
      NEW.id,
      NEW.reference,
      NEW.motif,
      NULL,
      'CB',
      NULL,
      'normale',
      48,
      NEW.montant,
      NEW.requested_by,
      NEW.exercice
    );
  END IF;
  
  -- Fermer la tâche quand approuvé/rejeté
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    PERFORM public.close_workflow_task(
      'virement',
      NEW.id,
      NEW.status,
      NEW.approved_by,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_workflow_task_virement ON public.credit_transfers;
CREATE TRIGGER trg_workflow_task_virement
  AFTER INSERT OR UPDATE OF status ON public.credit_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_create_task_for_virement();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Lecture : selon rôle et direction
CREATE POLICY "workflow_tasks_select" ON public.workflow_tasks
  FOR SELECT
  USING (
    -- Admin/DG/CB/DAAF voient tout
    has_role(auth.uid(), 'ADMIN'::app_role) OR
    has_role(auth.uid(), 'DG'::app_role) OR
    has_role(auth.uid(), 'CB'::app_role) OR
    has_role(auth.uid(), 'DAAF'::app_role) OR
    has_role(auth.uid(), 'TRESORERIE'::app_role) OR
    -- Utilisateur assigné
    assignee_user_id = auth.uid() OR
    -- Tâche de sa direction
    (direction_id IS NOT NULL AND direction_id IN (
      SELECT direction_id FROM profiles WHERE id = auth.uid()
    )) OR
    -- Tâche créée par l'utilisateur
    created_by = auth.uid()
  );

-- Insertion : utilisateurs authentifiés
CREATE POLICY "workflow_tasks_insert" ON public.workflow_tasks
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Mise à jour : assigné ou admin/validateur
CREATE POLICY "workflow_tasks_update" ON public.workflow_tasks
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role) OR
    has_role(auth.uid(), 'DG'::app_role) OR
    has_role(auth.uid(), 'CB'::app_role) OR
    has_role(auth.uid(), 'DAAF'::app_role) OR
    has_role(auth.uid(), 'TRESORERIE'::app_role) OR
    assignee_user_id = auth.uid() OR
    created_by = auth.uid()
  );

-- Suppression : admin seulement
CREATE POLICY "workflow_tasks_delete" ON public.workflow_tasks
  FOR DELETE
  USING (has_role(auth.uid(), 'ADMIN'::app_role));