-- ============================================
-- MIGRATION: Backend AEF complet aligné sur UI (v2)
-- ============================================

-- Supprimer la vue qui bloque les modifications
DROP VIEW IF EXISTS public.notes_imputees_disponibles CASCADE;

-- 1) Ajout des colonnes manquantes sur notes_dg (AEF)
-- ============================================

-- Origin: permet de distinguer AEF issue d'une SEF vs directe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes_dg' AND column_name = 'origin') THEN
    ALTER TABLE public.notes_dg 
    ADD COLUMN origin TEXT DEFAULT 'DIRECT' 
    CHECK (origin IN ('FROM_SEF', 'DIRECT'));
  END IF;
END $$;

-- beneficiaire_id (lien vers prestataires)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes_dg' AND column_name = 'beneficiaire_id') THEN
    ALTER TABLE public.notes_dg 
    ADD COLUMN beneficiaire_id UUID REFERENCES public.prestataires(id);
  END IF;
END $$;

-- ligne_budgetaire_id (pour pré-sélection avant imputation)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes_dg' AND column_name = 'ligne_budgetaire_id') THEN
    ALTER TABLE public.notes_dg 
    ADD COLUMN ligne_budgetaire_id UUID REFERENCES public.budget_lines(id);
  END IF;
END $$;

-- os_id, action_id, activite_id pour hiérarchie programmatique
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes_dg' AND column_name = 'os_id') THEN
    ALTER TABLE public.notes_dg 
    ADD COLUMN os_id UUID REFERENCES public.objectifs_strategiques(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes_dg' AND column_name = 'action_id') THEN
    ALTER TABLE public.notes_dg 
    ADD COLUMN action_id UUID REFERENCES public.actions(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes_dg' AND column_name = 'activite_id') THEN
    ALTER TABLE public.notes_dg 
    ADD COLUMN activite_id UUID REFERENCES public.activites(id);
  END IF;
END $$;

-- rejected_by et rejected_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes_dg' AND column_name = 'rejected_by') THEN
    ALTER TABLE public.notes_dg 
    ADD COLUMN rejected_by UUID REFERENCES public.profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes_dg' AND column_name = 'rejected_at') THEN
    ALTER TABLE public.notes_dg 
    ADD COLUMN rejected_at TIMESTAMPTZ;
  END IF;
END $$;

-- submitted_by
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes_dg' AND column_name = 'submitted_by') THEN
    ALTER TABLE public.notes_dg 
    ADD COLUMN submitted_by UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- 2) Mettre à jour la logique des statuts
-- ============================================
-- BROUILLON -> SOUMIS -> A_IMPUTER (après validation DG) -> IMPUTE
-- Ou: DIFFERE / REJETE

COMMENT ON COLUMN public.notes_dg.statut IS 
'Statuts possibles: brouillon, soumis, a_imputer (validé par DG, en attente imputation), impute, differe, rejete';

-- Mettre à jour le statut "valide" existant vers "a_imputer" pour cohérence
UPDATE public.notes_dg 
SET statut = 'a_imputer' 
WHERE statut = 'valide' AND imputed_at IS NULL;

-- 3) Table notes_dg_attachments (pièces jointes AEF)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notes_dg_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes_dg(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  fichier_url TEXT NOT NULL,
  type_fichier TEXT,
  taille INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index sur note_id
CREATE INDEX IF NOT EXISTS idx_notes_dg_attachments_note_id ON public.notes_dg_attachments(note_id);

-- RLS pour notes_dg_attachments
ALTER TABLE public.notes_dg_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_dg_attachments_select" ON public.notes_dg_attachments;
CREATE POLICY "notes_dg_attachments_select" ON public.notes_dg_attachments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "notes_dg_attachments_insert" ON public.notes_dg_attachments;
CREATE POLICY "notes_dg_attachments_insert" ON public.notes_dg_attachments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notes_dg_attachments_delete" ON public.notes_dg_attachments;
CREATE POLICY "notes_dg_attachments_delete" ON public.notes_dg_attachments
  FOR DELETE USING (
    uploaded_by = auth.uid() OR 
    has_role(auth.uid(), 'ADMIN'::app_role)
  );

-- 4) Trigger ARTI pour génération de référence AEF (etape=1)
-- ============================================
CREATE OR REPLACE FUNCTION public.set_arti_reference_aef()
RETURNS TRIGGER AS $$
DECLARE
  v_reference TEXT;
BEGIN
  -- Générer seulement si numero est null ou vide
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    -- Utiliser la fonction existante avec etape=1 (AEF)
    SELECT generate_arti_reference(1, COALESCE(NEW.created_at, now()))
    INTO v_reference;
    
    NEW.numero := v_reference;
    NEW.reference_pivot := v_reference;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_notes_dg_set_arti_reference ON public.notes_dg;

-- Créer le trigger
CREATE TRIGGER trg_notes_dg_set_arti_reference
  BEFORE INSERT ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION public.set_arti_reference_aef();

-- 5) Triggers d'historisation automatique pour notes_dg
-- ============================================

-- Ajout colonne metadata si manquante
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes_aef_history' AND column_name = 'metadata') THEN
    ALTER TABLE public.notes_aef_history ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Fonction pour logger les changements de statut
CREATE OR REPLACE FUNCTION public.log_note_aef_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_comment TEXT;
BEGIN
  -- Détecter le type d'action basé sur le changement de statut
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    CASE NEW.statut
      WHEN 'soumis' THEN v_action := 'SUBMIT';
      WHEN 'a_imputer' THEN v_action := 'VALIDATE';
      WHEN 'impute' THEN v_action := 'IMPUTE';
      WHEN 'rejete' THEN v_action := 'REJECT';
      WHEN 'differe' THEN v_action := 'DEFER';
      ELSE v_action := 'STATUS_CHANGE';
    END CASE;
    
    -- Commentaire basé sur l'action
    IF NEW.statut = 'rejete' AND NEW.rejection_reason IS NOT NULL THEN
      v_comment := NEW.rejection_reason;
    ELSIF NEW.statut = 'differe' AND NEW.motif_differe IS NOT NULL THEN
      v_comment := NEW.motif_differe;
    ELSIF NEW.statut = 'impute' AND NEW.budget_line_id IS NOT NULL THEN
      v_comment := 'Imputé sur ligne budgétaire';
    END IF;
    
    INSERT INTO public.notes_aef_history (
      note_id,
      action,
      old_statut,
      new_statut,
      commentaire,
      performed_by,
      performed_at
    ) VALUES (
      NEW.id,
      v_action,
      OLD.statut,
      NEW.statut,
      v_comment,
      COALESCE(
        CASE 
          WHEN NEW.statut = 'a_imputer' THEN NEW.validated_by
          WHEN NEW.statut = 'impute' THEN NEW.imputed_by
          WHEN NEW.statut = 'rejete' THEN NEW.rejected_by
          WHEN NEW.statut = 'differe' THEN NEW.differe_by
          WHEN NEW.statut = 'soumis' THEN NEW.submitted_by
          ELSE auth.uid()
        END,
        auth.uid()
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_note_aef_status_change ON public.notes_dg;
CREATE TRIGGER trg_log_note_aef_status_change
  AFTER UPDATE ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION public.log_note_aef_status_change();

-- Fonction pour logger la création
CREATE OR REPLACE FUNCTION public.log_note_aef_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notes_aef_history (
    note_id,
    action,
    new_statut,
    commentaire,
    performed_by,
    performed_at
  ) VALUES (
    NEW.id,
    'CREATE_DRAFT',
    NEW.statut,
    CASE 
      WHEN NEW.note_sef_id IS NOT NULL THEN 'Créée depuis Note SEF'
      ELSE 'Création directe'
    END,
    COALESCE(NEW.created_by, auth.uid()),
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_note_aef_creation ON public.notes_dg;
CREATE TRIGGER trg_log_note_aef_creation
  AFTER INSERT ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION public.log_note_aef_creation();

-- Fonction pour logger les attachments
CREATE OR REPLACE FUNCTION public.log_note_aef_attachment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notes_aef_history (
      note_id,
      action,
      commentaire,
      performed_by,
      performed_at
    ) VALUES (
      NEW.note_id,
      'ADD_ATTACHMENT',
      'Pièce jointe: ' || NEW.nom,
      COALESCE(NEW.uploaded_by, auth.uid()),
      now()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.notes_aef_history (
      note_id,
      action,
      commentaire,
      performed_by,
      performed_at
    ) VALUES (
      OLD.note_id,
      'REMOVE_ATTACHMENT',
      'Pièce supprimée: ' || OLD.nom,
      auth.uid(),
      now()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_note_aef_attachment ON public.notes_dg_attachments;
CREATE TRIGGER trg_log_note_aef_attachment
  AFTER INSERT OR DELETE ON public.notes_dg_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_note_aef_attachment_change();

-- 6) RLS ajustée pour notes_aef_history
-- ============================================
ALTER TABLE public.notes_aef_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_aef_history_select" ON public.notes_aef_history;
CREATE POLICY "notes_aef_history_select" ON public.notes_aef_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "notes_aef_history_insert" ON public.notes_aef_history;
CREATE POLICY "notes_aef_history_insert" ON public.notes_aef_history
  FOR INSERT WITH CHECK (true);

-- 7) Vue pour notes à imputer (recréée avec toutes les colonnes)
-- ============================================
CREATE OR REPLACE VIEW public.notes_imputees_disponibles AS
SELECT 
  nd.id,
  nd.numero,
  nd.objet,
  nd.contenu,
  nd.montant_estime,
  nd.priorite,
  nd.statut,
  nd.direction_id,
  nd.exercice,
  nd.created_at,
  nd.created_by,
  nd.note_sef_id,
  nd.origin,
  nd.beneficiaire_id,
  nd.validated_at,
  nd.validated_by,
  nd.reference_pivot,
  d.label as direction_label,
  d.sigle as direction_sigle
FROM public.notes_dg nd
LEFT JOIN public.directions d ON d.id = nd.direction_id
WHERE nd.statut = 'a_imputer';

COMMENT ON VIEW public.notes_imputees_disponibles IS 
'Notes AEF validées par le DG, en attente d''imputation sur ligne budgétaire';

-- 8) Index de performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notes_dg_statut ON public.notes_dg(statut);
CREATE INDEX IF NOT EXISTS idx_notes_dg_exercice ON public.notes_dg(exercice);
CREATE INDEX IF NOT EXISTS idx_notes_dg_note_sef_id ON public.notes_dg(note_sef_id);
CREATE INDEX IF NOT EXISTS idx_notes_dg_origin ON public.notes_dg(origin);
CREATE INDEX IF NOT EXISTS idx_notes_dg_direction_id ON public.notes_dg(direction_id);

-- 9) Index unique sur numero (référence ARTI)
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_dg_numero_unique 
ON public.notes_dg(numero) 
WHERE numero IS NOT NULL AND numero != '';

-- 10) Mise à jour de l'origin pour les notes existantes
-- ============================================
UPDATE public.notes_dg 
SET origin = CASE 
  WHEN note_sef_id IS NOT NULL THEN 'FROM_SEF'
  ELSE 'DIRECT'
END
WHERE origin IS NULL;

-- 11) Commentaires de documentation
-- ============================================
COMMENT ON TABLE public.notes_dg IS 
'Notes AEF (Avec Effet Financier). Peuvent être créées depuis une Note SEF (origin=FROM_SEF) ou directement (origin=DIRECT).
Workflow: BROUILLON -> SOUMIS -> A_IMPUTER (validé DG) -> IMPUTE (imputé sur ligne budgétaire)
Alternatives: DIFFERE (reporté) ou REJETE';

COMMENT ON COLUMN public.notes_dg.origin IS 'FROM_SEF = issue d''une Note SEF validée, DIRECT = création directe';
COMMENT ON COLUMN public.notes_dg.note_sef_id IS 'Référence vers la Note SEF parente (nullable si création directe)';
COMMENT ON COLUMN public.notes_dg.is_direct_aef IS 'DEPRECATED: Utiliser origin à la place';
COMMENT ON COLUMN public.notes_dg.reference_pivot IS 'Référence ARTI unique au format ARTI1MMYYNNNN';