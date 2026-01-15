-- =====================================================
-- PROMPT 2/10: Complément backend Notes SEF
-- Bucket Storage dédié + Trigger reference_pivot
-- =====================================================

-- Créer le bucket notes-sef s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notes-sef',
  'notes-sef',
  false,
  10485760, -- 10MB max
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- RLS pour le bucket notes-sef (utiliser DO block pour idempotence)
DO $$
BEGIN
  -- Policy SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'notes_sef_bucket_select'
  ) THEN
    CREATE POLICY "notes_sef_bucket_select" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'notes-sef' AND auth.uid() IS NOT NULL
      );
  END IF;
  
  -- Policy INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'notes_sef_bucket_insert'
  ) THEN
    CREATE POLICY "notes_sef_bucket_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'notes-sef' AND auth.uid() IS NOT NULL
      );
  END IF;
  
  -- Policy DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'notes_sef_bucket_delete'
  ) THEN
    CREATE POLICY "notes_sef_bucket_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'notes-sef' AND auth.uid() IS NOT NULL
      );
  END IF;
END $$;

-- Créer ou remplacer le trigger pour la référence pivot sur notes_sef
DROP TRIGGER IF EXISTS trigger_note_sef_reference_pivot ON public.notes_sef;
CREATE TRIGGER trigger_note_sef_reference_pivot
  BEFORE INSERT ON public.notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_note_sef_reference_pivot();

-- S'assurer que le trigger numero existe aussi
DROP TRIGGER IF EXISTS trigger_note_sef_numero ON public.notes_sef;
CREATE TRIGGER trigger_note_sef_numero
  BEFORE INSERT ON public.notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_note_sef_numero();

-- Ajouter les colonnes manquantes
DO $$
BEGIN
  -- dg_validation_required
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notes_sef' AND column_name = 'dg_validation_required'
  ) THEN
    ALTER TABLE public.notes_sef ADD COLUMN dg_validation_required BOOLEAN DEFAULT TRUE;
  END IF;
  
  -- decided_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notes_sef' AND column_name = 'decided_by'
  ) THEN
    ALTER TABLE public.notes_sef ADD COLUMN decided_by UUID REFERENCES public.profiles(id);
  END IF;
  
  -- decided_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notes_sef' AND column_name = 'decided_at'
  ) THEN
    ALTER TABLE public.notes_sef ADD COLUMN decided_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- decision_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notes_sef' AND column_name = 'decision_reason'
  ) THEN
    ALTER TABLE public.notes_sef ADD COLUMN decision_reason TEXT;
  END IF;
END $$;

-- Index sur reference_pivot pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_notes_sef_reference_pivot ON public.notes_sef(reference_pivot);
CREATE INDEX IF NOT EXISTS idx_notes_sef_exercice_statut ON public.notes_sef(exercice, statut);
CREATE INDEX IF NOT EXISTS idx_notes_sef_direction ON public.notes_sef(direction_id);
CREATE INDEX IF NOT EXISTS idx_notes_sef_created_by ON public.notes_sef(created_by);