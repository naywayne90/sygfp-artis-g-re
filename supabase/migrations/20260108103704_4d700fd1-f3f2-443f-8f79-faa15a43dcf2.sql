-- Add sync tracking columns to reference tables
ALTER TABLE public.directions 
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_sync_file TEXT;

ALTER TABLE public.objectifs_strategiques 
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_sync_file TEXT;

ALTER TABLE public.actions 
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_sync_file TEXT;

ALTER TABLE public.activites 
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_sync_file TEXT;

ALTER TABLE public.sous_activites 
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_sync_file TEXT;

ALTER TABLE public.nomenclature_nbe 
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_sync_file TEXT;

-- Create unique constraints for upsert if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'directions_code_key') THEN
    ALTER TABLE public.directions ADD CONSTRAINT directions_code_key UNIQUE (code);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'objectifs_strategiques_code_key') THEN
    ALTER TABLE public.objectifs_strategiques ADD CONSTRAINT objectifs_strategiques_code_key UNIQUE (code);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nomenclature_nbe_code_key') THEN
    ALTER TABLE public.nomenclature_nbe ADD CONSTRAINT nomenclature_nbe_code_key UNIQUE (code);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- Constraints already exist
  NULL;
END
$$;

-- Create indexes for lookup performance
CREATE INDEX IF NOT EXISTS idx_directions_code ON public.directions(code);
CREATE INDEX IF NOT EXISTS idx_objectifs_strategiques_code ON public.objectifs_strategiques(code);
CREATE INDEX IF NOT EXISTS idx_activites_code ON public.activites(code);
CREATE INDEX IF NOT EXISTS idx_sous_activites_code ON public.sous_activites(code);
CREATE INDEX IF NOT EXISTS idx_nomenclature_nbe_code ON public.nomenclature_nbe(code);
CREATE INDEX IF NOT EXISTS idx_actions_code ON public.actions(code);

-- Function to sync reference data from import
CREATE OR REPLACE FUNCTION public.sync_referentiels_from_import(
  p_filename TEXT,
  p_directions JSONB DEFAULT '[]'::jsonb,
  p_objectifs_strategiques JSONB DEFAULT '[]'::jsonb,
  p_activites JSONB DEFAULT '[]'::jsonb,
  p_sous_activites JSONB DEFAULT '[]'::jsonb,
  p_nbe JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_directions_count INT := 0;
  v_os_count INT := 0;
  v_activites_count INT := 0;
  v_sous_activites_count INT := 0;
  v_nbe_count INT := 0;
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_item JSONB;
  v_code TEXT;
  v_libelle TEXT;
BEGIN
  -- Sync Directions
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_directions)
  LOOP
    v_code := v_item->>'code';
    v_libelle := v_item->>'libelle';
    
    IF v_code IS NOT NULL AND v_code != '' THEN
      INSERT INTO public.directions (code, label, est_active, last_sync_at, last_sync_file, created_at, updated_at)
      VALUES (v_code, COALESCE(NULLIF(v_libelle, ''), 'Direction ' || v_code), true, v_now, p_filename, v_now, v_now)
      ON CONFLICT (code) DO UPDATE SET
        label = CASE WHEN NULLIF(EXCLUDED.label, '') IS NOT NULL AND directions.label IS NULL 
                     THEN EXCLUDED.label ELSE directions.label END,
        last_sync_at = v_now,
        last_sync_file = p_filename,
        updated_at = v_now;
      v_directions_count := v_directions_count + 1;
    END IF;
  END LOOP;

  -- Sync Objectifs Strategiques
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_objectifs_strategiques)
  LOOP
    v_code := v_item->>'code';
    v_libelle := v_item->>'libelle';
    
    IF v_code IS NOT NULL AND v_code != '' THEN
      INSERT INTO public.objectifs_strategiques (code, libelle, est_actif, last_sync_at, last_sync_file, created_at, updated_at)
      VALUES (v_code, COALESCE(NULLIF(v_libelle, ''), 'OS ' || v_code), true, v_now, p_filename, v_now, v_now)
      ON CONFLICT (code) DO UPDATE SET
        libelle = CASE WHEN NULLIF(EXCLUDED.libelle, '') IS NOT NULL AND (objectifs_strategiques.libelle IS NULL OR objectifs_strategiques.libelle = 'OS ' || objectifs_strategiques.code)
                       THEN EXCLUDED.libelle ELSE objectifs_strategiques.libelle END,
        last_sync_at = v_now,
        last_sync_file = p_filename,
        updated_at = v_now;
      v_os_count := v_os_count + 1;
    END IF;
  END LOOP;

  -- Sync Activites (simplified - without parent links for now)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_activites)
  LOOP
    v_code := v_item->>'code';
    v_libelle := v_item->>'libelle';
    
    IF v_code IS NOT NULL AND v_code != '' THEN
      -- Try to update existing, or check if we can insert
      UPDATE public.activites SET
        libelle = CASE WHEN NULLIF(v_libelle, '') IS NOT NULL AND (activites.libelle IS NULL OR activites.libelle = 'Activité ' || activites.code)
                       THEN v_libelle ELSE activites.libelle END,
        last_sync_at = v_now,
        last_sync_file = p_filename,
        updated_at = v_now
      WHERE code = v_code;
      
      IF FOUND THEN
        v_activites_count := v_activites_count + 1;
      END IF;
    END IF;
  END LOOP;

  -- Sync Sous-Activites (simplified - without parent links for now)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_sous_activites)
  LOOP
    v_code := v_item->>'code';
    v_libelle := v_item->>'libelle';
    
    IF v_code IS NOT NULL AND v_code != '' THEN
      UPDATE public.sous_activites SET
        libelle = CASE WHEN NULLIF(v_libelle, '') IS NOT NULL AND (sous_activites.libelle IS NULL OR sous_activites.libelle = 'Sous-activité ' || sous_activites.code)
                       THEN v_libelle ELSE sous_activites.libelle END,
        last_sync_at = v_now,
        last_sync_file = p_filename,
        updated_at = v_now
      WHERE code = v_code;
      
      IF FOUND THEN
        v_sous_activites_count := v_sous_activites_count + 1;
      END IF;
    END IF;
  END LOOP;

  -- Sync NBE
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_nbe)
  LOOP
    v_code := v_item->>'code';
    v_libelle := v_item->>'libelle';
    
    IF v_code IS NOT NULL AND v_code != '' THEN
      INSERT INTO public.nomenclature_nbe (code, libelle, niveau, est_active, last_sync_at, last_sync_file, created_at, updated_at)
      VALUES (v_code, COALESCE(NULLIF(v_libelle, ''), 'NBE ' || v_code), 'detail', true, v_now, p_filename, v_now, v_now)
      ON CONFLICT (code) DO UPDATE SET
        libelle = CASE WHEN NULLIF(EXCLUDED.libelle, '') IS NOT NULL AND (nomenclature_nbe.libelle IS NULL OR nomenclature_nbe.libelle = 'NBE ' || nomenclature_nbe.code)
                       THEN EXCLUDED.libelle ELSE nomenclature_nbe.libelle END,
        last_sync_at = v_now,
        last_sync_file = p_filename,
        updated_at = v_now;
      v_nbe_count := v_nbe_count + 1;
    END IF;
  END LOOP;

  -- Log the sync operation
  INSERT INTO public.audit_logs (action, entity_type, new_values)
  VALUES (
    'SYNC_REFERENTIELS',
    'referentiels',
    jsonb_build_object(
      'filename', p_filename,
      'directions', v_directions_count,
      'objectifs_strategiques', v_os_count,
      'activites', v_activites_count,
      'sous_activites', v_sous_activites_count,
      'nbe', v_nbe_count
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'counts', jsonb_build_object(
      'directions', v_directions_count,
      'objectifs_strategiques', v_os_count,
      'activites', v_activites_count,
      'sous_activites', v_sous_activites_count,
      'nbe', v_nbe_count
    )
  );
END;
$$;