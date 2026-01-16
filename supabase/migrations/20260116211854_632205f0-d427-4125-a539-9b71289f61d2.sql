-- =====================================================
-- MIGRATION: Enrichissement Engagements - Pièces obligatoires & taux
-- =====================================================

-- 1. Table pour les documents/pièces de l'engagement
CREATE TABLE IF NOT EXISTS public.engagement_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engagement_id UUID NOT NULL REFERENCES public.budget_engagements(id) ON DELETE CASCADE,
  type_document TEXT NOT NULL, -- 'marche', 'bon_commande', 'devis', 'justificatif', 'autre'
  libelle TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  est_obligatoire BOOLEAN DEFAULT false,
  est_fourni BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engagement_documents_engagement_id ON public.engagement_documents(engagement_id);

ALTER TABLE public.engagement_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view engagement documents"
  ON public.engagement_documents FOR SELECT USING (true);

CREATE POLICY "Authorized roles can manage engagement documents"
  ON public.engagement_documents FOR ALL USING (
    has_role(auth.uid(), 'ADMIN'::app_role) OR 
    has_role(auth.uid(), 'DAAF'::app_role) OR 
    has_role(auth.uid(), 'CB'::app_role) OR
    has_role(auth.uid(), 'SAF'::app_role)
  );

-- 2. Créer les pièces obligatoires automatiquement à la création d'un engagement
CREATE OR REPLACE FUNCTION public.fn_create_engagement_required_docs()
RETURNS TRIGGER AS $$
BEGIN
  -- Documents obligatoires standards
  INSERT INTO public.engagement_documents (engagement_id, type_document, libelle, est_obligatoire, est_fourni)
  VALUES
    (NEW.id, 'marche', 'Contrat/Marché signé', true, false),
    (NEW.id, 'bon_commande', 'Bon de commande', true, false),
    (NEW.id, 'devis', 'Devis/Proforma', true, false),
    (NEW.id, 'justificatif', 'Justificatif de la dépense', true, false);
    
  -- Si lié à un marché, ajouter le PV d'attribution
  IF NEW.marche_id IS NOT NULL THEN
    INSERT INTO public.engagement_documents (engagement_id, type_document, libelle, est_obligatoire, est_fourni)
    VALUES (NEW.id, 'pv_attribution', 'PV d''attribution du marché', true, false);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_create_engagement_docs ON public.budget_engagements;
CREATE TRIGGER trg_create_engagement_docs
AFTER INSERT ON public.budget_engagements
FOR EACH ROW
EXECUTE FUNCTION public.fn_create_engagement_required_docs();

-- 3. Ajouter colonnes pour la checklist sur l'engagement
ALTER TABLE public.budget_engagements
ADD COLUMN IF NOT EXISTS checklist_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS checklist_verified_at TIMESTAMP WITH TIME ZONE;

-- 4. Fonction pour vérifier la checklist avant validation
CREATE OR REPLACE FUNCTION public.fn_check_engagement_checklist()
RETURNS TRIGGER AS $$
DECLARE
  v_docs_obligatoires INTEGER;
  v_docs_fournis INTEGER;
BEGIN
  -- Si on passe en statut "valide", vérifier la checklist
  IF NEW.statut = 'valide' AND OLD.statut IS DISTINCT FROM 'valide' THEN
    SELECT 
      COUNT(*) FILTER (WHERE est_obligatoire = true),
      COUNT(*) FILTER (WHERE est_obligatoire = true AND est_fourni = true)
    INTO v_docs_obligatoires, v_docs_fournis
    FROM public.engagement_documents
    WHERE engagement_id = NEW.id;
    
    IF v_docs_obligatoires > 0 AND v_docs_fournis < v_docs_obligatoires THEN
      RAISE EXCEPTION 'Toutes les pièces obligatoires doivent être fournies avant validation (% / %)', 
        v_docs_fournis, v_docs_obligatoires;
    END IF;
    
    -- Marquer la checklist comme complète
    NEW.checklist_complete := true;
    NEW.checklist_verified_at := now();
    NEW.checklist_verified_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_engagement_checklist ON public.budget_engagements;
CREATE TRIGGER trg_check_engagement_checklist
BEFORE UPDATE ON public.budget_engagements
FOR EACH ROW
EXECUTE FUNCTION public.fn_check_engagement_checklist();

-- 5. Trigger pour mettre à jour le taux d'engagement après validation
CREATE OR REPLACE FUNCTION public.fn_update_engagement_rate()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_line RECORD;
  v_total_engage NUMERIC;
  v_taux_engagement NUMERIC;
BEGIN
  -- Si l'engagement passe à "valide"
  IF NEW.statut = 'valide' AND OLD.statut IS DISTINCT FROM 'valide' THEN
    -- Calculer le total engagé validé sur la ligne
    SELECT COALESCE(SUM(montant), 0) INTO v_total_engage
    FROM public.budget_engagements
    WHERE budget_line_id = NEW.budget_line_id
      AND statut = 'valide'
      AND exercice = NEW.exercice;
    
    -- Récupérer la dotation de la ligne
    SELECT dotation_initiale, COALESCE(dotation_modifiee, dotation_initiale) as dotation_actuelle
    INTO v_budget_line
    FROM public.budget_lines
    WHERE id = NEW.budget_line_id;
    
    -- Calculer le taux
    IF v_budget_line.dotation_actuelle > 0 THEN
      v_taux_engagement := (v_total_engage / v_budget_line.dotation_actuelle) * 100;
    ELSE
      v_taux_engagement := 0;
    END IF;
    
    -- Mettre à jour la ligne budgétaire
    UPDATE public.budget_lines
    SET total_engage = v_total_engage,
        updated_at = now()
    WHERE id = NEW.budget_line_id;
    
    -- Mettre à jour le dossier si lié
    IF NEW.dossier_id IS NOT NULL THEN
      UPDATE public.dossiers
      SET etape_courante = 'engagement_valide',
          montant_engage = NEW.montant,
          updated_at = now()
      WHERE id = NEW.dossier_id;
      
      -- Mettre à jour l'étape dans dossier_etapes
      UPDATE public.dossier_etapes
      SET statut = 'valide',
          validated_at = now()
      WHERE dossier_id = NEW.dossier_id 
        AND type_etape = 'engagement'
        AND ref_id = NEW.id;
        
      -- Créer l'entrée pour l'étape Liquidation
      INSERT INTO public.dossier_etapes (
        dossier_id,
        type_etape,
        montant,
        statut
      ) VALUES (
        NEW.dossier_id,
        'liquidation',
        NEW.montant,
        'en_attente'
      ) ON CONFLICT DO NOTHING;
    END IF;
    
    -- Log dans budget_history
    INSERT INTO public.budget_history (
      budget_line_id,
      event_type,
      delta,
      ref_id,
      ref_code,
      commentaire,
      created_by
    ) VALUES (
      NEW.budget_line_id,
      'engagement_valide',
      NEW.montant,
      NEW.id,
      NEW.numero,
      'Engagement validé',
      NEW.created_by
    );
    
    -- Créer une tâche workflow pour la liquidation
    INSERT INTO public.workflow_tasks (
      task_type,
      entity_type,
      entity_id,
      title,
      description,
      owner_role,
      status,
      priority,
      dossier_id
    ) VALUES (
      'liquidation',
      'engagement',
      NEW.id,
      'Créer la liquidation pour ' || NEW.numero,
      'L''engagement a été validé. Procéder à la liquidation après service fait.',
      'SAF',
      'pending',
      'high',
      NEW.dossier_id
    );
    
    -- Générer une alerte si taux d'engagement > 80%
    IF v_taux_engagement >= 80 THEN
      INSERT INTO public.alerts (
        type,
        severity,
        title,
        description,
        module,
        entity_table,
        entity_id,
        owner_role
      ) VALUES (
        'budget_threshold',
        CASE WHEN v_taux_engagement >= 100 THEN 'critical' ELSE 'warning' END,
        'Taux d''engagement élevé',
        'La ligne ' || (SELECT code FROM public.budget_lines WHERE id = NEW.budget_line_id) || 
        ' a atteint ' || ROUND(v_taux_engagement, 1) || '% d''engagement.',
        'budget',
        'budget_lines',
        NEW.budget_line_id,
        'CB'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_engagement_rate ON public.budget_engagements;
CREATE TRIGGER trg_update_engagement_rate
AFTER UPDATE ON public.budget_engagements
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_engagement_rate();

-- 6. Vue pour les statistiques d'engagement par ligne budgétaire
CREATE OR REPLACE VIEW public.v_engagement_stats AS
SELECT 
  bl.id as budget_line_id,
  bl.code,
  bl.label,
  bl.exercice,
  bl.dotation_initiale,
  COALESCE(bl.dotation_modifiee, bl.dotation_initiale) as dotation_actuelle,
  COALESCE(bl.total_engage, 0) as total_engage,
  COALESCE(bl.total_engage, 0) as engage_valide,
  CASE 
    WHEN COALESCE(bl.dotation_modifiee, bl.dotation_initiale) > 0 
    THEN ROUND((COALESCE(bl.total_engage, 0) / COALESCE(bl.dotation_modifiee, bl.dotation_initiale)) * 100, 2)
    ELSE 0 
  END as taux_engagement,
  COALESCE(bl.dotation_modifiee, bl.dotation_initiale) - COALESCE(bl.total_engage, 0) as disponible,
  d.sigle as direction_sigle,
  os.code as os_code
FROM public.budget_lines bl
LEFT JOIN public.directions d ON bl.direction_id = d.id
LEFT JOIN public.objectifs_strategiques os ON bl.os_id = os.id
WHERE bl.is_active = true;

-- 7. Index pour performance des requêtes engagement
CREATE INDEX IF NOT EXISTS idx_budget_engagements_statut ON public.budget_engagements(statut);
CREATE INDEX IF NOT EXISTS idx_budget_engagements_workflow ON public.budget_engagements(workflow_status);
CREATE INDEX IF NOT EXISTS idx_budget_engagements_budget_line ON public.budget_engagements(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_budget_engagements_exercice_statut ON public.budget_engagements(exercice, statut);