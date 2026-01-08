-- =====================================================
-- TABLES "ZONE TAMPON" POUR IMPORT EXCEL BUDGET
-- =====================================================

-- 1. Table de suivi des sessions d'import
CREATE TABLE public.import_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  exercice_id UUID REFERENCES public.exercices_budgetaires(id),
  exercice INTEGER,
  filename TEXT NOT NULL,
  sheet_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validating', 'validated', 'importing', 'imported', 'failed', 'cancelled')),
  total_rows INTEGER DEFAULT 0,
  ok_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  warning_rows INTEGER DEFAULT 0,
  notes TEXT,
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES public.profiles(id),
  imported_at TIMESTAMP WITH TIME ZONE,
  imported_by UUID REFERENCES public.profiles(id),
  error_summary JSONB,
  column_mapping JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_import_runs_exercice ON public.import_runs(exercice);
CREATE INDEX idx_import_runs_status ON public.import_runs(status);
CREATE INDEX idx_import_runs_created_by ON public.import_runs(created_by);
CREATE INDEX idx_import_runs_created_at ON public.import_runs(created_at DESC);

-- 2. Table staging pour les lignes importées (zone tampon)
CREATE TABLE public.import_budget_staging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.import_runs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  
  -- Données brutes (raw) extraites du fichier Excel
  raw_imputation TEXT,
  raw_os TEXT,
  raw_action TEXT,
  raw_activite TEXT,
  raw_sous_activite TEXT,
  raw_direction TEXT,
  raw_nature_depense TEXT,
  raw_nbe TEXT,
  raw_montant TEXT,
  raw_libelle TEXT,
  raw_source_financement TEXT,
  raw_data JSONB, -- Toutes les colonnes brutes pour référence
  
  -- Données calculées/résolues après mapping
  computed_imputation TEXT,
  computed_os_id UUID,
  computed_action_id UUID,
  computed_activite_id UUID,
  computed_sous_activite_id UUID,
  computed_direction_id UUID,
  computed_nbe_id UUID,
  computed_nbe_code TEXT,
  computed_nature_depense_code TEXT,
  computed_montant NUMERIC(18,2),
  computed_libelle TEXT,
  computed_source_financement TEXT,
  
  -- Statut de validation
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'ok', 'warning', 'error')),
  validation_errors TEXT,
  validation_warnings TEXT,
  validation_details JSONB,
  
  -- Référence vers la ligne métier créée (après import final)
  budget_line_id UUID REFERENCES public.budget_lines(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_import_staging_run_id ON public.import_budget_staging(run_id);
CREATE INDEX idx_import_staging_validation ON public.import_budget_staging(validation_status);
CREATE INDEX idx_import_staging_row ON public.import_budget_staging(run_id, row_number);

-- Contrainte d'unicité pour éviter doublons dans un même run
ALTER TABLE public.import_budget_staging 
  ADD CONSTRAINT unique_staging_row UNIQUE (run_id, row_number);

-- 3. Table de logs pour traçabilité détaillée
CREATE TABLE public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.import_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  step TEXT, -- upload, parse, validate, resolve, import, etc.
  row_number INTEGER, -- Numéro de ligne concernée si applicable
  message TEXT NOT NULL,
  details JSONB,
  user_id UUID REFERENCES public.profiles(id)
);

-- Index pour recherche dans les logs
CREATE INDEX idx_import_logs_run_id ON public.import_logs(run_id);
CREATE INDEX idx_import_logs_level ON public.import_logs(level);
CREATE INDEX idx_import_logs_timestamp ON public.import_logs(timestamp DESC);

-- =====================================================
-- TRIGGERS POUR updated_at
-- =====================================================

CREATE TRIGGER set_import_runs_updated_at
  BEFORE UPDATE ON public.import_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_budget_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour import_runs
CREATE POLICY "Users can view their own import runs"
  ON public.import_runs FOR SELECT
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'DAAF'));

CREATE POLICY "Users can create import runs"
  ON public.import_runs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own import runs"
  ON public.import_runs FOR UPDATE
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can delete import runs"
  ON public.import_runs FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- Policies pour import_budget_staging
CREATE POLICY "Users can view staging for their runs"
  ON public.import_budget_staging FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.import_runs r 
      WHERE r.id = run_id 
      AND (r.created_by = auth.uid() OR public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'DAAF'))
    )
  );

CREATE POLICY "Users can insert staging data"
  ON public.import_budget_staging FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.import_runs r 
      WHERE r.id = run_id 
      AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their staging data"
  ON public.import_budget_staging FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.import_runs r 
      WHERE r.id = run_id 
      AND (r.created_by = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'))
    )
  );

CREATE POLICY "Users can delete their staging data"
  ON public.import_budget_staging FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.import_runs r 
      WHERE r.id = run_id 
      AND (r.created_by = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'))
    )
  );

-- Policies pour import_logs
CREATE POLICY "Users can view logs for their runs"
  ON public.import_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.import_runs r 
      WHERE r.id = run_id 
      AND (r.created_by = auth.uid() OR public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'DAAF'))
    )
  );

CREATE POLICY "System can insert logs"
  ON public.import_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour créer un nouveau run d'import
CREATE OR REPLACE FUNCTION public.create_import_run(
  p_exercice INTEGER,
  p_filename TEXT,
  p_sheet_name TEXT DEFAULT NULL,
  p_column_mapping JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_run_id UUID;
  v_exercice_id UUID;
BEGIN
  -- Récupérer l'ID de l'exercice
  SELECT id INTO v_exercice_id FROM public.exercices_budgetaires WHERE annee = p_exercice LIMIT 1;
  
  INSERT INTO public.import_runs (
    created_by, exercice, exercice_id, filename, sheet_name, column_mapping, status
  ) VALUES (
    auth.uid(), p_exercice, v_exercice_id, p_filename, p_sheet_name, p_column_mapping, 'draft'
  )
  RETURNING id INTO v_run_id;
  
  -- Log création
  INSERT INTO public.import_logs (run_id, level, step, message, user_id)
  VALUES (v_run_id, 'info', 'create', 'Session d''import créée pour ' || p_filename, auth.uid());
  
  RETURN v_run_id;
END;
$$;

-- Fonction pour ajouter un log d'import
CREATE OR REPLACE FUNCTION public.log_import_event(
  p_run_id UUID,
  p_level TEXT,
  p_message TEXT,
  p_step TEXT DEFAULT NULL,
  p_row_number INTEGER DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.import_logs (run_id, level, step, row_number, message, details, user_id)
  VALUES (p_run_id, p_level, p_step, p_row_number, p_message, p_details, auth.uid())
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Fonction pour mettre à jour les statistiques d'un run
CREATE OR REPLACE FUNCTION public.update_import_run_stats(p_run_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.import_runs
  SET
    total_rows = (SELECT COUNT(*) FROM public.import_budget_staging WHERE run_id = p_run_id),
    ok_rows = (SELECT COUNT(*) FROM public.import_budget_staging WHERE run_id = p_run_id AND validation_status = 'ok'),
    warning_rows = (SELECT COUNT(*) FROM public.import_budget_staging WHERE run_id = p_run_id AND validation_status = 'warning'),
    error_rows = (SELECT COUNT(*) FROM public.import_budget_staging WHERE run_id = p_run_id AND validation_status = 'error'),
    updated_at = now()
  WHERE id = p_run_id;
END;
$$;

-- Fonction pour valider un run (passer de draft à validated)
CREATE OR REPLACE FUNCTION public.validate_import_run(p_run_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_stats RECORD;
  v_can_validate BOOLEAN;
BEGIN
  -- Calculer les stats
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE validation_status = 'ok') as ok_count,
    COUNT(*) FILTER (WHERE validation_status = 'warning') as warning_count,
    COUNT(*) FILTER (WHERE validation_status = 'error') as error_count
  INTO v_stats
  FROM public.import_budget_staging
  WHERE run_id = p_run_id;
  
  -- On peut valider si au moins 1 ligne OK et aucune erreur bloquante
  v_can_validate := v_stats.error_count = 0 AND v_stats.ok_count > 0;
  
  IF v_can_validate THEN
    UPDATE public.import_runs
    SET status = 'validated', validated_at = now(), validated_by = auth.uid()
    WHERE id = p_run_id;
    
    PERFORM public.log_import_event(p_run_id, 'info', 'Import validé avec ' || v_stats.ok_count || ' lignes OK', 'validate');
  ELSE
    PERFORM public.log_import_event(p_run_id, 'error', 'Validation impossible: ' || v_stats.error_count || ' erreurs', 'validate');
  END IF;
  
  RETURN jsonb_build_object(
    'success', v_can_validate,
    'total', v_stats.total,
    'ok', v_stats.ok_count,
    'warnings', v_stats.warning_count,
    'errors', v_stats.error_count
  );
END;
$$;

-- Fonction pour finaliser l'import (copier staging vers budget_lines)
CREATE OR REPLACE FUNCTION public.finalize_import_run(p_run_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_run RECORD;
  v_staging RECORD;
  v_inserted INTEGER := 0;
  v_errors INTEGER := 0;
  v_new_line_id UUID;
BEGIN
  -- Vérifier que le run est validé
  SELECT * INTO v_run FROM public.import_runs WHERE id = p_run_id;
  
  IF v_run.status != 'validated' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le run doit être validé avant import');
  END IF;
  
  -- Mettre le statut en "importing"
  UPDATE public.import_runs SET status = 'importing' WHERE id = p_run_id;
  
  -- Parcourir les lignes OK du staging
  FOR v_staging IN 
    SELECT * FROM public.import_budget_staging 
    WHERE run_id = p_run_id AND validation_status IN ('ok', 'warning')
    ORDER BY row_number
  LOOP
    BEGIN
      INSERT INTO public.budget_lines (
        exercice,
        code,
        label,
        level,
        dotation_initiale,
        direction_id,
        os_id,
        mission_id,
        action_id,
        activite_id,
        sous_activite_id,
        nbe_id,
        source_financement,
        statut,
        commentaire
      ) VALUES (
        v_run.exercice,
        COALESCE(v_staging.computed_imputation, 'IMP-' || v_staging.row_number),
        COALESCE(v_staging.computed_libelle, v_staging.raw_libelle, 'Ligne importée #' || v_staging.row_number),
        'ligne',
        COALESCE(v_staging.computed_montant, 0),
        v_staging.computed_direction_id,
        v_staging.computed_os_id,
        NULL, -- mission_id à résoudre si besoin
        v_staging.computed_action_id,
        v_staging.computed_activite_id,
        v_staging.computed_sous_activite_id,
        v_staging.computed_nbe_id,
        v_staging.computed_source_financement,
        'brouillon',
        'Importé depuis ' || v_run.filename || ' (run: ' || p_run_id || ')'
      )
      RETURNING id INTO v_new_line_id;
      
      -- Lier la ligne staging à la ligne métier créée
      UPDATE public.import_budget_staging 
      SET budget_line_id = v_new_line_id 
      WHERE id = v_staging.id;
      
      v_inserted := v_inserted + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      PERFORM public.log_import_event(
        p_run_id, 'error', 'Erreur insertion ligne ' || v_staging.row_number || ': ' || SQLERRM, 
        'import', v_staging.row_number
      );
    END;
  END LOOP;
  
  -- Mettre à jour le statut final
  IF v_errors = 0 THEN
    UPDATE public.import_runs 
    SET status = 'imported', imported_at = now(), imported_by = auth.uid()
    WHERE id = p_run_id;
  ELSE
    UPDATE public.import_runs 
    SET status = 'failed', 
        error_summary = jsonb_build_object('inserted', v_inserted, 'errors', v_errors)
    WHERE id = p_run_id;
  END IF;
  
  PERFORM public.log_import_event(
    p_run_id, 
    CASE WHEN v_errors = 0 THEN 'info' ELSE 'warn' END,
    'Import terminé: ' || v_inserted || ' lignes créées, ' || v_errors || ' erreurs',
    'import'
  );
  
  -- Enregistrer dans le journal d'audit
  INSERT INTO public.audit_logs (entity_type, entity_id, action, user_id, new_values)
  VALUES (
    'import_run', p_run_id, 'IMPORT_FINALIZED', auth.uid(),
    jsonb_build_object(
      'exercice', v_run.exercice,
      'filename', v_run.filename,
      'inserted', v_inserted,
      'errors', v_errors
    )
  );
  
  RETURN jsonb_build_object(
    'success', v_errors = 0,
    'inserted', v_inserted,
    'errors', v_errors
  );
END;
$$;