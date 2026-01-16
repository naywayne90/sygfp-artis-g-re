-- =====================================================
-- MIGRATION: Enrichissement module Marchés - Structuration passation
-- =====================================================

-- 1. Table pour historique complet des documents/pièces du marché
CREATE TABLE IF NOT EXISTS public.marche_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID NOT NULL REFERENCES public.marches(id) ON DELETE CASCADE,
  type_document TEXT NOT NULL, -- 'pv_lancement', 'pv_ouverture', 'pv_attribution', 'devis', 'contrat', 'bon_commande', 'autre'
  libelle TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_marche_documents_marche_id ON public.marche_documents(marche_id);
CREATE INDEX IF NOT EXISTS idx_marche_documents_type ON public.marche_documents(type_document);

-- RLS
ALTER TABLE public.marche_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view marche documents"
  ON public.marche_documents FOR SELECT USING (true);

CREATE POLICY "Authorized roles can manage marche documents"
  ON public.marche_documents FOR ALL USING (
    has_role(auth.uid(), 'ADMIN'::app_role) OR 
    has_role(auth.uid(), 'DAAF'::app_role) OR 
    has_role(auth.uid(), 'CB'::app_role)
  );

-- 2. Table historique des décisions/actions sur le marché
CREATE TABLE IF NOT EXISTS public.marche_historique (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marche_id UUID NOT NULL REFERENCES public.marches(id) ON DELETE CASCADE,
  type_action TEXT NOT NULL, -- 'creation', 'validation', 'rejet', 'differe', 'attribution', 'modification'
  description TEXT NOT NULL,
  ancien_statut TEXT,
  nouveau_statut TEXT,
  commentaire TEXT,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marche_historique_marche_id ON public.marche_historique(marche_id);
CREATE INDEX IF NOT EXISTS idx_marche_historique_created_at ON public.marche_historique(created_at DESC);

ALTER TABLE public.marche_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view marche history"
  ON public.marche_historique FOR SELECT USING (true);

CREATE POLICY "System can insert marche history"
  ON public.marche_historique FOR INSERT WITH CHECK (true);

-- 3. Ajouter colonnes manquantes à marches
ALTER TABLE public.marches 
ADD COLUMN IF NOT EXISTS type_marche TEXT DEFAULT 'fourniture',
ADD COLUMN IF NOT EXISTS type_procedure TEXT DEFAULT 'consultation',
ADD COLUMN IF NOT EXISTS nombre_lots INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS numero_lot INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS intitule_lot TEXT,
ADD COLUMN IF NOT EXISTS duree_execution INTEGER,
ADD COLUMN IF NOT EXISTS observations TEXT,
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'en_attente',
ADD COLUMN IF NOT EXISTS current_validation_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS differe_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS differe_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS differe_motif TEXT,
ADD COLUMN IF NOT EXISTS differe_date_reprise DATE;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_marches_validation_status ON public.marches(validation_status);
CREATE INDEX IF NOT EXISTS idx_marches_exercice_statut ON public.marches(exercice, statut);
CREATE INDEX IF NOT EXISTS idx_marches_dossier_id ON public.marches(dossier_id);
CREATE INDEX IF NOT EXISTS idx_marches_expression_besoin_id ON public.marches(expression_besoin_id);

-- 4. Trigger: historiser les changements de statut
CREATE OR REPLACE FUNCTION public.fn_log_marche_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log uniquement si le statut ou validation_status change
  IF (OLD.statut IS DISTINCT FROM NEW.statut) OR 
     (OLD.validation_status IS DISTINCT FROM NEW.validation_status) THEN
    INSERT INTO public.marche_historique (
      marche_id,
      type_action,
      description,
      ancien_statut,
      nouveau_statut,
      user_id,
      metadata
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.validation_status = 'valide' THEN 'validation'
        WHEN NEW.validation_status = 'rejete' THEN 'rejet'
        WHEN NEW.validation_status = 'differe' THEN 'differe'
        WHEN NEW.statut = 'attribue' THEN 'attribution'
        ELSE 'modification'
      END,
      'Changement de statut du marché',
      COALESCE(OLD.validation_status, OLD.statut),
      COALESCE(NEW.validation_status, NEW.statut),
      auth.uid(),
      jsonb_build_object(
        'numero', NEW.numero,
        'montant', NEW.montant,
        'prestataire_id', NEW.prestataire_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_marche_status ON public.marches;
CREATE TRIGGER trg_log_marche_status
AFTER UPDATE ON public.marches
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_marche_status_change();

-- 5. Trigger: Mettre à jour le dossier et préparer l'engagement après validation complète
CREATE OR REPLACE FUNCTION public.fn_marche_validation_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand le marché passe à "valide"
  IF NEW.validation_status = 'valide' AND OLD.validation_status IS DISTINCT FROM 'valide' THEN
    -- Mettre à jour le dossier lié
    IF NEW.dossier_id IS NOT NULL THEN
      UPDATE public.dossiers 
      SET etape_courante = 'marche_valide',
          updated_at = now()
      WHERE id = NEW.dossier_id;
      
      -- Mettre à jour l'étape dans dossier_etapes
      UPDATE public.dossier_etapes
      SET statut = 'valide',
          validated_at = now(),
          validated_by = NEW.validated_by
      WHERE dossier_id = NEW.dossier_id 
        AND type_etape = 'marche'
        AND ref_id = NEW.id;
        
      -- Créer l'entrée pour l'étape Engagement
      INSERT INTO public.dossier_etapes (
        dossier_id,
        type_etape,
        montant,
        statut
      ) VALUES (
        NEW.dossier_id,
        'engagement',
        NEW.montant,
        'en_attente'
      ) ON CONFLICT DO NOTHING;
    END IF;
    
    -- Log dans l'historique
    INSERT INTO public.marche_historique (
      marche_id,
      type_action,
      description,
      ancien_statut,
      nouveau_statut,
      user_id,
      metadata
    ) VALUES (
      NEW.id,
      'validation_complete',
      'Marché entièrement validé - Prêt pour engagement',
      OLD.validation_status,
      'valide',
      NEW.validated_by,
      jsonb_build_object(
        'prestataire_id', NEW.prestataire_id,
        'montant', NEW.montant,
        'dossier_id', NEW.dossier_id
      )
    );
    
    -- Créer une tâche workflow pour l'engagement
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
      'engagement',
      'marche',
      NEW.id,
      'Créer l''engagement pour ' || COALESCE(NEW.numero, 'marché'),
      'Le marché a été validé. Procéder à la création de l''engagement budgétaire.',
      'CB',
      'pending',
      'high',
      NEW.dossier_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_marche_validation_complete ON public.marches;
CREATE TRIGGER trg_marche_validation_complete
AFTER UPDATE ON public.marches
FOR EACH ROW
EXECUTE FUNCTION public.fn_marche_validation_complete();

-- 6. Trigger: Créer entrée historique à la création du marché
CREATE OR REPLACE FUNCTION public.fn_marche_created_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.marche_historique (
    marche_id,
    type_action,
    description,
    nouveau_statut,
    user_id,
    metadata
  ) VALUES (
    NEW.id,
    'creation',
    'Création du marché ' || COALESCE(NEW.numero, ''),
    NEW.validation_status,
    NEW.created_by,
    jsonb_build_object(
      'objet', NEW.objet,
      'montant', NEW.montant,
      'mode_passation', NEW.mode_passation,
      'type_procedure', NEW.type_procedure
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_marche_created ON public.marches;
CREATE TRIGGER trg_marche_created
AFTER INSERT ON public.marches
FOR EACH ROW
EXECUTE FUNCTION public.fn_marche_created_log();

-- 7. Vue pour les statistiques des marchés par type de procédure
CREATE OR REPLACE VIEW public.v_marches_stats AS
SELECT 
  m.exercice,
  m.type_procedure,
  m.type_marche,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE m.validation_status = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE m.validation_status = 'valide') as valides,
  COUNT(*) FILTER (WHERE m.validation_status = 'rejete') as rejetes,
  SUM(m.montant) as montant_total,
  SUM(m.montant) FILTER (WHERE m.validation_status = 'valide') as montant_valide
FROM public.marches m
GROUP BY m.exercice, m.type_procedure, m.type_marche;

-- 8. Fonction pour vérifier si un marché peut être créé (EB doit être validée)
CREATE OR REPLACE FUNCTION public.check_marche_prerequisites(p_expression_besoin_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_eb RECORD;
BEGIN
  IF p_expression_besoin_id IS NULL THEN
    RETURN jsonb_build_object('valid', true, 'message', 'Création sans EB');
  END IF;
  
  SELECT statut INTO v_eb 
  FROM public.expressions_besoin 
  WHERE id = p_expression_besoin_id;
  
  IF v_eb IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Expression de besoin introuvable');
  END IF;
  
  IF v_eb.statut != 'validee' THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'message', 'L''expression de besoin doit être validée avant de créer un marché'
    );
  END IF;
  
  RETURN jsonb_build_object('valid', true, 'message', 'Prérequis OK');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;