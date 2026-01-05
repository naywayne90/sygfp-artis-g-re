-- Table pour les Notes SEF (Sans Effet Financier)
CREATE TABLE public.notes_sef (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT UNIQUE,
  exercice INTEGER NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE),
  direction_id UUID REFERENCES public.directions(id),
  demandeur_id UUID REFERENCES public.profiles(id),
  objet TEXT NOT NULL,
  description TEXT,
  urgence TEXT DEFAULT 'normale' CHECK (urgence IN ('basse', 'normale', 'haute', 'urgente')),
  commentaire TEXT,
  
  -- Workflow
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'soumis', 'a_valider', 'valide', 'rejete', 'differe')),
  
  -- Rejet
  rejection_reason TEXT,
  rejected_by UUID REFERENCES public.profiles(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Différé
  differe_motif TEXT,
  differe_condition TEXT,
  differe_date_reprise DATE,
  differe_by UUID REFERENCES public.profiles(id),
  differe_at TIMESTAMP WITH TIME ZONE,
  
  -- Validation
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Soumission
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les pièces jointes des notes SEF
CREATE TABLE public.notes_sef_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes_sef(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'historique des actions sur les notes SEF
CREATE TABLE public.notes_sef_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes_sef(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_statut TEXT,
  new_statut TEXT,
  commentaire TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT
);

-- Séquence pour la numérotation des notes SEF
CREATE TABLE public.notes_sef_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL,
  dernier_numero INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(annee)
);

-- Fonction pour générer le numéro de note SEF
CREATE OR REPLACE FUNCTION public.generate_note_sef_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_sequence INTEGER;
  v_numero TEXT;
BEGIN
  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Insérer ou mettre à jour la séquence
  INSERT INTO public.notes_sef_sequences (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee)
  DO UPDATE SET 
    dernier_numero = notes_sef_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_sequence;
  
  -- Format: SEF-2026-000001
  v_numero := 'SEF-' || v_annee || '-' || LPAD(v_sequence::TEXT, 6, '0');
  
  NEW.numero := v_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour la génération automatique du numéro
CREATE TRIGGER trigger_generate_note_sef_numero
  BEFORE INSERT ON public.notes_sef
  FOR EACH ROW
  WHEN (NEW.numero IS NULL)
  EXECUTE FUNCTION public.generate_note_sef_numero();

-- Trigger pour updated_at
CREATE TRIGGER update_notes_sef_updated_at
  BEFORE UPDATE ON public.notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activer RLS
ALTER TABLE public.notes_sef ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_sef_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_sef_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_sef_sequences ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour notes_sef
CREATE POLICY "Users can view notes from their direction or if authorized"
  ON public.notes_sef FOR SELECT
  USING (
    direction_id IN (SELECT direction_id FROM profiles WHERE id = auth.uid())
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create notes SEF"
  ON public.notes_sef FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their drafts or authorized roles can update"
  ON public.notes_sef FOR UPDATE
  USING (
    (created_by = auth.uid() AND statut = 'brouillon')
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

CREATE POLICY "Only admins can delete notes SEF"
  ON public.notes_sef FOR DELETE
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Politiques pour les attachments
CREATE POLICY "Users can view note attachments"
  ON public.notes_sef_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notes_sef n 
      WHERE n.id = note_id 
      AND (
        n.direction_id IN (SELECT direction_id FROM profiles WHERE id = auth.uid())
        OR n.created_by = auth.uid()
        OR has_role(auth.uid(), 'ADMIN'::app_role)
        OR has_role(auth.uid(), 'DG'::app_role)
        OR has_role(auth.uid(), 'DAAF'::app_role)
      )
    )
  );

CREATE POLICY "Users can add attachments to their notes"
  ON public.notes_sef_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes_sef n 
      WHERE n.id = note_id 
      AND (n.created_by = auth.uid() OR has_role(auth.uid(), 'ADMIN'::app_role))
    )
  );

CREATE POLICY "Users can delete attachments from their draft notes"
  ON public.notes_sef_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM notes_sef n 
      WHERE n.id = note_id 
      AND n.created_by = auth.uid() 
      AND n.statut = 'brouillon'
    )
  );

-- Politiques pour l'historique
CREATE POLICY "Authorized users can view history"
  ON public.notes_sef_history FOR SELECT
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
    OR EXISTS (
      SELECT 1 FROM notes_sef n WHERE n.id = note_id AND n.created_by = auth.uid()
    )
  );

CREATE POLICY "System can insert history"
  ON public.notes_sef_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Politique pour les séquences
CREATE POLICY "System can manage sequences"
  ON public.notes_sef_sequences FOR ALL
  USING (true);

-- Index pour performance
CREATE INDEX idx_notes_sef_exercice ON public.notes_sef(exercice);
CREATE INDEX idx_notes_sef_direction ON public.notes_sef(direction_id);
CREATE INDEX idx_notes_sef_statut ON public.notes_sef(statut);
CREATE INDEX idx_notes_sef_created_by ON public.notes_sef(created_by);
CREATE INDEX idx_notes_sef_attachments_note ON public.notes_sef_attachments(note_id);
CREATE INDEX idx_notes_sef_history_note ON public.notes_sef_history(note_id);