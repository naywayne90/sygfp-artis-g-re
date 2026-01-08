-- Add budget_valide column to track validated budget
ALTER TABLE exercices_budgetaires 
ADD COLUMN IF NOT EXISTS budget_valide BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS budget_valide_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS budget_valide_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS budget_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_lignes_count INTEGER DEFAULT 0;

-- Function to copy budget structure from previous year
CREATE OR REPLACE FUNCTION copy_budget_structure(
  p_source_exercice INTEGER,
  p_target_exercice INTEGER,
  p_user_id UUID,
  p_copy_dotations BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_copied_count INTEGER := 0;
  v_source_line RECORD;
  v_new_id UUID;
  v_id_mapping JSONB := '{}'::JSONB;
BEGIN
  -- Check if target exercice exists
  IF NOT EXISTS (SELECT 1 FROM exercices_budgetaires WHERE annee = p_target_exercice) THEN
    RAISE EXCEPTION 'Exercice cible % n''existe pas', p_target_exercice;
  END IF;
  
  -- Check if source exercice has lines
  IF NOT EXISTS (SELECT 1 FROM budget_lines WHERE exercice = p_source_exercice LIMIT 1) THEN
    RAISE EXCEPTION 'Exercice source % n''a pas de lignes budgétaires', p_source_exercice;
  END IF;
  
  -- Delete existing lines for target exercice (if any)
  DELETE FROM budget_lines WHERE exercice = p_target_exercice;
  
  -- Copy lines (first pass: lines without parent)
  FOR v_source_line IN 
    SELECT * FROM budget_lines 
    WHERE exercice = p_source_exercice 
    AND parent_id IS NULL
    ORDER BY code
  LOOP
    v_new_id := gen_random_uuid();
    v_id_mapping := v_id_mapping || jsonb_build_object(v_source_line.id::TEXT, v_new_id::TEXT);
    
    INSERT INTO budget_lines (
      id, code, label, level, exercice, 
      direction_id, os_id, mission_id, action_id, activite_id, 
      sous_activite_id, tache_id, sysco_id, nbe_id,
      dotation_initiale, source_financement, commentaire,
      type_ligne, statut, is_active
    ) VALUES (
      v_new_id,
      v_source_line.code,
      v_source_line.label,
      v_source_line.level,
      p_target_exercice,
      v_source_line.direction_id,
      v_source_line.os_id,
      v_source_line.mission_id,
      v_source_line.action_id,
      v_source_line.activite_id,
      v_source_line.sous_activite_id,
      v_source_line.tache_id,
      v_source_line.sysco_id,
      v_source_line.nbe_id,
      CASE WHEN p_copy_dotations THEN v_source_line.dotation_initiale ELSE 0 END,
      v_source_line.source_financement,
      v_source_line.commentaire,
      v_source_line.type_ligne,
      'brouillon',
      true
    );
    
    v_copied_count := v_copied_count + 1;
  END LOOP;
  
  -- Copy lines (second pass: lines with parent)
  FOR v_source_line IN 
    SELECT * FROM budget_lines 
    WHERE exercice = p_source_exercice 
    AND parent_id IS NOT NULL
    ORDER BY code
  LOOP
    v_new_id := gen_random_uuid();
    v_id_mapping := v_id_mapping || jsonb_build_object(v_source_line.id::TEXT, v_new_id::TEXT);
    
    INSERT INTO budget_lines (
      id, code, label, level, exercice, parent_id,
      direction_id, os_id, mission_id, action_id, activite_id, 
      sous_activite_id, tache_id, sysco_id, nbe_id,
      dotation_initiale, source_financement, commentaire,
      type_ligne, statut, is_active
    ) VALUES (
      v_new_id,
      v_source_line.code,
      v_source_line.label,
      v_source_line.level,
      p_target_exercice,
      (v_id_mapping->>v_source_line.parent_id::TEXT)::UUID,
      v_source_line.direction_id,
      v_source_line.os_id,
      v_source_line.mission_id,
      v_source_line.action_id,
      v_source_line.activite_id,
      v_source_line.sous_activite_id,
      v_source_line.tache_id,
      v_source_line.sysco_id,
      v_source_line.nbe_id,
      CASE WHEN p_copy_dotations THEN v_source_line.dotation_initiale ELSE 0 END,
      v_source_line.source_financement,
      v_source_line.commentaire,
      v_source_line.type_ligne,
      'brouillon',
      true
    );
    
    v_copied_count := v_copied_count + 1;
  END LOOP;
  
  -- Update exercice stats
  UPDATE exercices_budgetaires SET
    budget_lignes_count = v_copied_count,
    budget_total = (SELECT COALESCE(SUM(dotation_initiale), 0) FROM budget_lines WHERE exercice = p_target_exercice)
  WHERE annee = p_target_exercice;
  
  -- Audit log
  INSERT INTO audit_logs (entity_type, action, new_values, user_id, exercice)
  VALUES ('budget_lines', 'copy_structure', jsonb_build_object(
    'source_exercice', p_source_exercice,
    'target_exercice', p_target_exercice,
    'copied_count', v_copied_count,
    'copy_dotations', p_copy_dotations
  ), p_user_id, p_target_exercice);
  
  RETURN jsonb_build_object(
    'success', true,
    'copied_count', v_copied_count,
    'source_exercice', p_source_exercice,
    'target_exercice', p_target_exercice
  );
END;
$$;

-- Function to validate budget (lock structure)
CREATE OR REPLACE FUNCTION validate_budget(
  p_exercice INTEGER,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lignes_count INTEGER;
  v_total_dotation NUMERIC;
BEGIN
  -- Get budget stats
  SELECT COUNT(*), COALESCE(SUM(dotation_initiale), 0)
  INTO v_lignes_count, v_total_dotation
  FROM budget_lines
  WHERE exercice = p_exercice;
  
  IF v_lignes_count = 0 THEN
    RAISE EXCEPTION 'Aucune ligne budgétaire à valider pour l''exercice %', p_exercice;
  END IF;
  
  -- Lock all budget lines
  UPDATE budget_lines SET
    statut = 'valide',
    validated_at = NOW(),
    validated_by = p_user_id,
    dotation_modifiee = dotation_initiale, -- Figer la dotation
    disponible_calcule = dotation_initiale -- Initialiser le disponible
  WHERE exercice = p_exercice;
  
  -- Update exercice status
  UPDATE exercices_budgetaires SET
    budget_valide = TRUE,
    budget_valide_at = NOW(),
    budget_valide_by = p_user_id,
    budget_total = v_total_dotation,
    budget_lignes_count = v_lignes_count,
    statut = 'en_cours'
  WHERE annee = p_exercice;
  
  -- Audit log
  INSERT INTO audit_logs (entity_type, action, new_values, user_id, exercice)
  VALUES ('exercice', 'validate_budget', jsonb_build_object(
    'exercice', p_exercice,
    'lignes_count', v_lignes_count,
    'total_dotation', v_total_dotation
  ), p_user_id, p_exercice);
  
  RETURN jsonb_build_object(
    'success', true,
    'exercice', p_exercice,
    'lignes_count', v_lignes_count,
    'total_dotation', v_total_dotation
  );
END;
$$;

-- Function to get exercice initialization summary
CREATE OR REPLACE FUNCTION get_exercice_budget_summary(p_exercice INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'exercice', p_exercice,
    'lignes_count', COUNT(*),
    'dotation_totale', COALESCE(SUM(dotation_initiale), 0),
    'lignes_par_niveau', jsonb_object_agg(COALESCE(level, 'undefined'), cnt),
    'lignes_par_direction', (
      SELECT jsonb_object_agg(COALESCE(d.code, 'undefined'), lignes.cnt)
      FROM (
        SELECT direction_id, COUNT(*) as cnt
        FROM budget_lines
        WHERE exercice = p_exercice AND direction_id IS NOT NULL
        GROUP BY direction_id
      ) lignes
      LEFT JOIN directions d ON d.id = lignes.direction_id
    )
  )
  INTO v_result
  FROM (
    SELECT level, COUNT(*) as cnt
    FROM budget_lines
    WHERE exercice = p_exercice
    GROUP BY level
  ) levels;
  
  IF v_result IS NULL THEN
    v_result := jsonb_build_object(
      'exercice', p_exercice,
      'lignes_count', 0,
      'dotation_totale', 0,
      'lignes_par_niveau', '{}'::JSONB,
      'lignes_par_direction', '{}'::JSONB
    );
  END IF;
  
  RETURN v_result;
END;
$$;