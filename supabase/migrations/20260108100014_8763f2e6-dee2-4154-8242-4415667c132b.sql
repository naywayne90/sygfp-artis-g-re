-- Ajouter la colonne import_run_id à budget_lines pour traçabilité
ALTER TABLE public.budget_lines 
ADD COLUMN IF NOT EXISTS import_run_id UUID REFERENCES public.import_runs(id);

-- Index pour recherche rapide par import run
CREATE INDEX IF NOT EXISTS idx_budget_lines_import_run_id ON public.budget_lines(import_run_id);

-- Ajouter des colonnes computed supplémentaires au staging si absentes
ALTER TABLE public.import_budget_staging
ADD COLUMN IF NOT EXISTS computed_montant NUMERIC,
ADD COLUMN IF NOT EXISTS computed_libelle TEXT,
ADD COLUMN IF NOT EXISTS computed_direction_id UUID,
ADD COLUMN IF NOT EXISTS computed_os_id UUID,
ADD COLUMN IF NOT EXISTS computed_action_id UUID,
ADD COLUMN IF NOT EXISTS computed_activite_id UUID,
ADD COLUMN IF NOT EXISTS computed_sous_activite_id UUID,
ADD COLUMN IF NOT EXISTS computed_nbe_id UUID,
ADD COLUMN IF NOT EXISTS computed_source_financement TEXT,
ADD COLUMN IF NOT EXISTS budget_line_id UUID REFERENCES public.budget_lines(id);

-- Remplacer la fonction finalize_import_run avec stratégie UPSERT
CREATE OR REPLACE FUNCTION public.finalize_import_run(p_run_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run RECORD;
  v_staging RECORD;
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_errors INTEGER := 0;
  v_line_id UUID;
  v_existing_line RECORD;
  v_direction_id UUID;
  v_os_id UUID;
  v_action_id UUID;
  v_activite_id UUID;
  v_sous_activite_id UUID;
  v_nbe_id UUID;
  v_montant NUMERIC;
  v_imputation TEXT;
  v_libelle TEXT;
BEGIN
  -- Vérifier que le run existe et est validé
  SELECT * INTO v_run FROM public.import_runs WHERE id = p_run_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Run introuvable', 'imported_count', 0, 'error_count', 1);
  END IF;
  
  IF v_run.status NOT IN ('validated', 'draft') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le run doit être validé avant import (status actuel: ' || v_run.status || ')', 'imported_count', 0, 'error_count', 1);
  END IF;
  
  -- Mettre le statut en "importing"
  UPDATE public.import_runs SET status = 'importing' WHERE id = p_run_id;
  
  -- Log début
  PERFORM public.log_import_event(p_run_id, 'info', 'Début de l''import vers budget_lines pour exercice ' || v_run.exercice);
  
  -- Parcourir les lignes OK/warning du staging
  FOR v_staging IN 
    SELECT * FROM public.import_budget_staging 
    WHERE run_id = p_run_id AND validation_status IN ('ok', 'warning')
    ORDER BY row_number
  LOOP
    BEGIN
      -- Récupérer l'imputation (calculée ou brute)
      v_imputation := COALESCE(v_staging.computed_imputation, v_staging.raw_imputation);
      
      IF v_imputation IS NULL OR v_imputation = '' THEN
        v_errors := v_errors + 1;
        PERFORM public.log_import_event(p_run_id, 'error', 'Ligne ' || v_staging.row_number || ': Imputation vide, ignorée');
        CONTINUE;
      END IF;
      
      -- Parser le montant depuis raw_montant
      v_montant := COALESCE(
        v_staging.computed_montant,
        NULLIF(REGEXP_REPLACE(COALESCE(v_staging.raw_montant, '0'), '[^0-9,.-]', '', 'g'), '')::NUMERIC
      );
      IF v_montant IS NULL THEN v_montant := 0; END IF;
      
      -- Construire le libellé
      v_libelle := COALESCE(
        v_staging.computed_libelle,
        v_staging.raw_libelle,
        'Ligne ' || v_imputation
      );
      
      -- Résoudre les IDs des référentiels depuis les codes bruts
      -- Direction (par code)
      SELECT id INTO v_direction_id 
      FROM public.directions 
      WHERE code = LPAD(COALESCE(REGEXP_REPLACE(v_staging.raw_direction, '[^0-9]', '', 'g'), ''), 2, '0')
        AND est_active = true
      LIMIT 1;
      
      -- OS (par code)
      SELECT id INTO v_os_id 
      FROM public.objectifs_strategiques 
      WHERE code = LPAD(COALESCE(REGEXP_REPLACE(v_staging.raw_os, '[^0-9]', '', 'g'), ''), 2, '0')
        AND est_actif = true
      LIMIT 1;
      
      -- Action (par code) - peut être null
      IF v_staging.raw_action IS NOT NULL AND v_staging.raw_action != '' THEN
        SELECT id INTO v_action_id 
        FROM public.actions 
        WHERE code = LPAD(COALESCE(REGEXP_REPLACE(v_staging.raw_action, '[^0-9]', '', 'g'), ''), 2, '0')
          AND est_active = true
        LIMIT 1;
      ELSE
        v_action_id := NULL;
      END IF;
      
      -- Activité (par code)
      SELECT id INTO v_activite_id 
      FROM public.activites 
      WHERE code = LPAD(COALESCE(REGEXP_REPLACE(v_staging.raw_activite, '[^0-9]', '', 'g'), ''), 3, '0')
        AND est_active = true
      LIMIT 1;
      
      -- Sous-activité (par code)
      SELECT id INTO v_sous_activite_id 
      FROM public.sous_activites 
      WHERE code = LPAD(COALESCE(REGEXP_REPLACE(v_staging.raw_sous_activite, '[^0-9]', '', 'g'), ''), 3, '0')
        AND est_active = true
      LIMIT 1;
      
      -- NBE (par code 6 chiffres)
      SELECT id INTO v_nbe_id 
      FROM public.nomenclature_nbe 
      WHERE code = v_staging.computed_nbe_code
        AND est_actif = true
      LIMIT 1;
      
      -- Vérifier si la ligne existe déjà (clé unique: exercice + code)
      SELECT * INTO v_existing_line 
      FROM public.budget_lines 
      WHERE exercice = v_run.exercice AND code = v_imputation;
      
      IF FOUND THEN
        -- UPDATE: mettre à jour la ligne existante
        UPDATE public.budget_lines SET
          dotation_initiale = v_montant,
          label = v_libelle,
          direction_id = COALESCE(v_direction_id, direction_id),
          os_id = COALESCE(v_os_id, os_id),
          action_id = v_action_id,
          activite_id = COALESCE(v_activite_id, activite_id),
          sous_activite_id = COALESCE(v_sous_activite_id, sous_activite_id),
          nbe_id = COALESCE(v_nbe_id, nbe_id),
          import_run_id = p_run_id,
          updated_at = now(),
          commentaire = COALESCE(commentaire, '') || ' | MAJ import ' || v_run.filename || ' (' || to_char(now(), 'DD/MM/YYYY HH24:MI') || ')'
        WHERE id = v_existing_line.id
        RETURNING id INTO v_line_id;
        
        v_updated := v_updated + 1;
        
        PERFORM public.log_import_event(
          p_run_id, 'info', 
          'Ligne ' || v_staging.row_number || ': MAJ existante ' || v_imputation || ' (montant: ' || v_montant || ')'
        );
      ELSE
        -- INSERT: créer une nouvelle ligne
        INSERT INTO public.budget_lines (
          exercice,
          code,
          label,
          level,
          dotation_initiale,
          direction_id,
          os_id,
          action_id,
          activite_id,
          sous_activite_id,
          nbe_id,
          import_run_id,
          statut,
          commentaire
        ) VALUES (
          v_run.exercice,
          v_imputation,
          v_libelle,
          'ligne',
          v_montant,
          v_direction_id,
          v_os_id,
          v_action_id,
          v_activite_id,
          v_sous_activite_id,
          v_nbe_id,
          p_run_id,
          'brouillon',
          'Importé depuis ' || v_run.filename || ' le ' || to_char(now(), 'DD/MM/YYYY HH24:MI')
        )
        RETURNING id INTO v_line_id;
        
        v_inserted := v_inserted + 1;
        
        PERFORM public.log_import_event(
          p_run_id, 'info', 
          'Ligne ' || v_staging.row_number || ': Création ' || v_imputation || ' (montant: ' || v_montant || ')'
        );
      END IF;
      
      -- Lier la ligne staging à la ligne métier
      UPDATE public.import_budget_staging 
      SET budget_line_id = v_line_id 
      WHERE id = v_staging.id;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      PERFORM public.log_import_event(
        p_run_id, 'error', 
        'Ligne ' || v_staging.row_number || ' (' || COALESCE(v_imputation, 'null') || '): ' || SQLERRM
      );
    END;
  END LOOP;
  
  -- Mettre à jour le statut final du run
  IF v_errors = 0 THEN
    UPDATE public.import_runs 
    SET status = 'imported', 
        imported_at = now(), 
        imported_by = auth.uid(),
        ok_rows = v_inserted + v_updated,
        error_rows = v_errors
    WHERE id = p_run_id;
  ELSE
    UPDATE public.import_runs 
    SET status = CASE WHEN (v_inserted + v_updated) > 0 THEN 'imported' ELSE 'failed' END,
        imported_at = now(),
        imported_by = auth.uid(),
        ok_rows = v_inserted + v_updated,
        error_rows = v_errors,
        notes = COALESCE(notes, '') || ' Import partiel avec erreurs.'
    WHERE id = p_run_id;
  END IF;
  
  -- Log final
  PERFORM public.log_import_event(
    p_run_id, 
    CASE WHEN v_errors = 0 THEN 'info' ELSE 'warn' END,
    'Import terminé: ' || v_inserted || ' créées, ' || v_updated || ' mises à jour, ' || v_errors || ' erreurs'
  );
  
  -- Enregistrer dans le journal d'audit
  INSERT INTO public.audit_logs (entity_type, entity_id, action, user_id, exercice, new_values)
  VALUES (
    'import_run', 
    p_run_id, 
    'BUDGET_IMPORT_FINALIZED', 
    auth.uid(),
    v_run.exercice,
    jsonb_build_object(
      'exercice', v_run.exercice,
      'filename', v_run.filename,
      'sheet_name', v_run.sheet_name,
      'inserted', v_inserted,
      'updated', v_updated,
      'errors', v_errors,
      'total_processed', v_inserted + v_updated + v_errors
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'imported_count', v_inserted + v_updated,
    'inserted', v_inserted,
    'updated', v_updated,
    'error_count', v_errors
  );
END;
$$;