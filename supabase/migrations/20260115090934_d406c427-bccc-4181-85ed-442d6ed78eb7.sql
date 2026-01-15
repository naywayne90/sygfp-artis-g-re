-- =====================================================
-- MIGRATION ADDITIVE : Notes SEF - Champs manquants
-- =====================================================

-- 1. Ajout des colonnes manquantes à notes_sef
ALTER TABLE public.notes_sef 
  ADD COLUMN IF NOT EXISTS justification TEXT,
  ADD COLUMN IF NOT EXISTS date_souhaitee DATE,
  ADD COLUMN IF NOT EXISTS reference_pivot TEXT,
  ADD COLUMN IF NOT EXISTS beneficiaire_id UUID REFERENCES public.prestataires(id),
  ADD COLUMN IF NOT EXISTS beneficiaire_interne_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES public.dossiers(id);

-- 2. Index composite pour recherche par exercice et référence pivot
CREATE INDEX IF NOT EXISTS idx_notes_sef_exercice_ref_pivot 
  ON public.notes_sef(exercice, reference_pivot);

-- 3. Index pour bénéficiaires
CREATE INDEX IF NOT EXISTS idx_notes_sef_beneficiaire 
  ON public.notes_sef(beneficiaire_id);

CREATE INDEX IF NOT EXISTS idx_notes_sef_beneficiaire_interne 
  ON public.notes_sef(beneficiaire_interne_id);

-- 4. Index pour dossier lié
CREATE INDEX IF NOT EXISTS idx_notes_sef_dossier 
  ON public.notes_sef(dossier_id);

-- 5. Index GIN pour recherche full-text sur objet et numéro
CREATE INDEX IF NOT EXISTS idx_notes_sef_objet_search 
  ON public.notes_sef USING GIN(to_tsvector('french', COALESCE(objet, '') || ' ' || COALESCE(numero, '')));

-- 6. Contrainte unique sur reference_pivot (si non null)
ALTER TABLE public.notes_sef 
  DROP CONSTRAINT IF EXISTS notes_sef_reference_pivot_unique;
ALTER TABLE public.notes_sef 
  ADD CONSTRAINT notes_sef_reference_pivot_unique UNIQUE (reference_pivot);

-- =====================================================
-- 7. Création table pièces jointes Notes SEF
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notes_sef_pieces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes_sef(id) ON DELETE CASCADE,
  fichier_url TEXT NOT NULL,
  nom TEXT NOT NULL,
  type_fichier TEXT,
  taille INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour retrouver les pièces d'une note
CREATE INDEX IF NOT EXISTS idx_notes_sef_pieces_note 
  ON public.notes_sef_pieces(note_id);

-- 8. Activer RLS sur notes_sef_pieces
ALTER TABLE public.notes_sef_pieces ENABLE ROW LEVEL SECURITY;

-- Politique : tous les utilisateurs authentifiés peuvent voir les pièces
CREATE POLICY "Authenticated users can view notes_sef_pieces" 
  ON public.notes_sef_pieces 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Politique : utilisateurs authentifiés peuvent insérer des pièces
CREATE POLICY "Authenticated users can insert notes_sef_pieces" 
  ON public.notes_sef_pieces 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Politique : le créateur peut supprimer ses pièces
CREATE POLICY "Uploaders can delete their notes_sef_pieces" 
  ON public.notes_sef_pieces 
  FOR DELETE 
  USING (uploaded_by = auth.uid());

-- =====================================================
-- 9. Fonction pour générer reference_pivot automatique
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_note_sef_reference_pivot()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
  dir_sigle TEXT;
BEGIN
  -- Récupérer le sigle de la direction
  SELECT sigle INTO dir_sigle 
  FROM public.directions 
  WHERE id = NEW.direction_id;
  
  -- Récupérer le prochain numéro de séquence pour l'exercice
  SELECT COALESCE(MAX(
    CAST(NULLIF(regexp_replace(reference_pivot, '[^0-9]', '', 'g'), '') AS INTEGER)
  ), 0) + 1 INTO seq_num
  FROM public.notes_sef
  WHERE exercice = NEW.exercice;
  
  -- Format: SEF-{ANNEE}-{DIRECTION}-{SEQ}
  NEW.reference_pivot := 'SEF-' || NEW.exercice || '-' || COALESCE(dir_sigle, 'XX') || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour générer automatiquement reference_pivot à l'insertion
DROP TRIGGER IF EXISTS tr_generate_note_sef_reference ON public.notes_sef;
CREATE TRIGGER tr_generate_note_sef_reference
  BEFORE INSERT ON public.notes_sef
  FOR EACH ROW
  WHEN (NEW.reference_pivot IS NULL)
  EXECUTE FUNCTION public.generate_note_sef_reference_pivot();

-- =====================================================
-- 10. Commentaires pour documentation
-- =====================================================
COMMENT ON COLUMN public.notes_sef.justification IS 'Justification obligatoire de la demande';
COMMENT ON COLUMN public.notes_sef.date_souhaitee IS 'Date souhaitée de réalisation';
COMMENT ON COLUMN public.notes_sef.reference_pivot IS 'Référence unique lisible auto-générée (SEF-YYYY-DIR-NNNN)';
COMMENT ON COLUMN public.notes_sef.beneficiaire_id IS 'Prestataire externe bénéficiaire';
COMMENT ON COLUMN public.notes_sef.beneficiaire_interne_id IS 'Agent interne bénéficiaire';
COMMENT ON COLUMN public.notes_sef.dossier_id IS 'Dossier de dépense lié après validation';

COMMENT ON TABLE public.notes_sef_pieces IS 'Pièces jointes associées aux Notes SEF';