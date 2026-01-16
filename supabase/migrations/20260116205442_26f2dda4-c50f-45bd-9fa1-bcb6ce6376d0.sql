-- ===========================================
-- IMPUTATION ROBUSTE : Réservation budgétaire + protection exercice
-- ===========================================

-- 1. Ajouter colonne montant_reserve sur budget_lines si absente
ALTER TABLE budget_lines 
ADD COLUMN IF NOT EXISTS montant_reserve numeric DEFAULT 0;

COMMENT ON COLUMN budget_lines.montant_reserve IS 'Montant réservé par les imputations en cours (pré-engagement)';

-- 2. Créer une vue pour disponibilité temps réel
CREATE OR REPLACE VIEW v_budget_disponibilite AS
SELECT 
  bl.id,
  bl.code,
  bl.label,
  bl.exercice,
  bl.direction_id,
  bl.os_id,
  bl.mission_id,
  bl.dotation_initiale,
  bl.dotation_modifiee,
  COALESCE(bl.dotation_modifiee, bl.dotation_initiale) + 
    COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE to_budget_line_id = bl.id AND status = 'execute'), 0) -
    COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE from_budget_line_id = bl.id AND status = 'execute'), 0) 
    AS dotation_actuelle,
  COALESCE(bl.total_engage, 0) AS total_engage,
  COALESCE(bl.montant_reserve, 0) AS montant_reserve,
  COALESCE(bl.dotation_modifiee, bl.dotation_initiale) + 
    COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE to_budget_line_id = bl.id AND status = 'execute'), 0) -
    COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE from_budget_line_id = bl.id AND status = 'execute'), 0) -
    COALESCE(bl.total_engage, 0) - 
    COALESCE(bl.montant_reserve, 0) AS disponible_net,
  d.code AS direction_code,
  d.label AS direction_label,
  os.code AS os_code,
  os.libelle AS os_libelle
FROM budget_lines bl
LEFT JOIN directions d ON d.id = bl.direction_id
LEFT JOIN objectifs_strategiques os ON os.id = bl.os_id
WHERE bl.is_active = true;

-- 3. Fonction pour vérifier si l'exercice permet les écritures
CREATE OR REPLACE FUNCTION check_exercice_writable(p_exercice integer)
RETURNS boolean AS $$
DECLARE
  v_statut text;
BEGIN
  SELECT statut INTO v_statut
  FROM exercices_budgetaires
  WHERE annee = p_exercice;
  
  IF v_statut IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN v_statut IN ('en_preparation', 'ouvert', 'actif');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour réserver le budget lors d'une imputation
CREATE OR REPLACE FUNCTION fn_reserve_budget_on_imputation()
RETURNS TRIGGER AS $$
DECLARE
  v_disponible numeric;
  v_exercice_ok boolean;
BEGIN
  -- Vérifier que l'exercice est ouvert
  v_exercice_ok := check_exercice_writable(NEW.exercice);
  IF NOT v_exercice_ok THEN
    RAISE EXCEPTION 'Exercice % clos - Aucune imputation possible', NEW.exercice;
  END IF;

  -- Si statut passe à 'active' (nouvelle imputation validée)
  IF NEW.statut = 'active' AND NEW.budget_line_id IS NOT NULL THEN
    -- Vérifier le disponible
    SELECT 
      COALESCE(dotation_modifiee, dotation_initiale) + 
        COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE to_budget_line_id = NEW.budget_line_id AND status = 'execute'), 0) -
        COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE from_budget_line_id = NEW.budget_line_id AND status = 'execute'), 0) -
        COALESCE(total_engage, 0) - 
        COALESCE(montant_reserve, 0)
    INTO v_disponible
    FROM budget_lines
    WHERE id = NEW.budget_line_id;
    
    -- Bloquer si insuffisant et pas de forcer_imputation
    IF v_disponible < NEW.montant AND NOT COALESCE(NEW.forcer_imputation, false) THEN
      RAISE EXCEPTION 'Disponible insuffisant (% FCFA) pour le montant demandé (% FCFA). Utilisez forcer_imputation avec justification.', 
        v_disponible, NEW.montant;
    END IF;
    
    -- Réserver le budget (pré-engagement)
    UPDATE budget_lines
    SET montant_reserve = COALESCE(montant_reserve, 0) + NEW.montant,
        updated_at = now()
    WHERE id = NEW.budget_line_id;
    
    -- Créer une alerte si dépassement forcé
    IF v_disponible < NEW.montant AND COALESCE(NEW.forcer_imputation, false) THEN
      INSERT INTO alerts (
        type, severity, title, description, entity_table, entity_id, module, auto_generated
      ) VALUES (
        'BUDGET_DEPASSEMENT',
        'error',
        'Imputation en dépassement budgétaire',
        format('Imputation de %s FCFA forcée sur ligne %s (disponible: %s FCFA). Justification: %s',
          NEW.montant, NEW.code_imputation, v_disponible, COALESCE(NEW.justification_depassement, 'Non fournie')),
        'imputations',
        NEW.id,
        'imputation',
        true
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger sur insert/update imputations
DROP TRIGGER IF EXISTS trg_reserve_budget_imputation ON imputations;
CREATE TRIGGER trg_reserve_budget_imputation
  BEFORE INSERT ON imputations
  FOR EACH ROW
  EXECUTE FUNCTION fn_reserve_budget_on_imputation();

-- 6. Fonction pour libérer la réservation si imputation annulée
CREATE OR REPLACE FUNCTION fn_release_budget_on_imputation_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'annulee' ou 'rejetee', libérer la réservation
  IF NEW.statut IN ('annulee', 'rejetee') AND OLD.statut = 'active' AND NEW.budget_line_id IS NOT NULL THEN
    UPDATE budget_lines
    SET montant_reserve = GREATEST(0, COALESCE(montant_reserve, 0) - OLD.montant),
        updated_at = now()
    WHERE id = NEW.budget_line_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_release_budget_imputation ON imputations;
CREATE TRIGGER trg_release_budget_imputation
  AFTER UPDATE ON imputations
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION fn_release_budget_on_imputation_cancel();

-- 7. Fonction pour mettre à jour l'étape dossier sur imputation validée
CREATE OR REPLACE FUNCTION fn_update_dossier_on_imputation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'active' AND NEW.dossier_id IS NOT NULL THEN
    UPDATE dossiers
    SET etape_actuelle = 'imputation_validee',
        etape_courante = 'imputation',
        updated_at = now()
    WHERE id = NEW.dossier_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_dossier_imputation ON imputations;
CREATE TRIGGER trg_update_dossier_imputation
  AFTER INSERT OR UPDATE ON imputations
  FOR EACH ROW
  WHEN (NEW.statut = 'active')
  EXECUTE FUNCTION fn_update_dossier_on_imputation();

-- 8. Fonction pour vérifier cohérence OS/Mission lors imputation
CREATE OR REPLACE FUNCTION fn_check_imputation_coherence()
RETURNS TRIGGER AS $$
DECLARE
  v_action_os_id uuid;
  v_action_mission_id uuid;
BEGIN
  -- Si une action est sélectionnée, vérifier la cohérence avec OS/Mission
  IF NEW.action_id IS NOT NULL THEN
    SELECT os_id, mission_id INTO v_action_os_id, v_action_mission_id
    FROM actions
    WHERE id = NEW.action_id;
    
    IF NEW.os_id IS NOT NULL AND NEW.os_id != v_action_os_id THEN
      RAISE EXCEPTION 'Incohérence: L''action sélectionnée n''appartient pas à l''OS choisi';
    END IF;
    
    IF NEW.mission_id IS NOT NULL AND NEW.mission_id != v_action_mission_id THEN
      RAISE EXCEPTION 'Incohérence: L''action sélectionnée n''appartient pas à la mission choisie';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_imputation_coherence ON imputations;
CREATE TRIGGER trg_check_imputation_coherence
  BEFORE INSERT OR UPDATE ON imputations
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_imputation_coherence();

-- 9. Index pour performances des rapports Top OS / Top Directions
CREATE INDEX IF NOT EXISTS idx_imputations_os_id ON imputations(os_id) WHERE statut = 'active';
CREATE INDEX IF NOT EXISTS idx_imputations_direction_id ON imputations(direction_id) WHERE statut = 'active';
CREATE INDEX IF NOT EXISTS idx_imputations_exercice_statut ON imputations(exercice, statut);
CREATE INDEX IF NOT EXISTS idx_budget_lines_direction_os ON budget_lines(direction_id, os_id) WHERE is_active = true;

-- 10. Vue pour rapports Top OS
CREATE OR REPLACE VIEW v_top_os_imputations AS
SELECT 
  os.id AS os_id,
  os.code AS os_code,
  os.libelle AS os_libelle,
  i.exercice,
  COUNT(DISTINCT i.id) AS nb_imputations,
  SUM(i.montant) AS montant_total,
  SUM(CASE WHEN i.forcer_imputation THEN i.montant ELSE 0 END) AS montant_force
FROM imputations i
JOIN objectifs_strategiques os ON os.id = i.os_id
WHERE i.statut = 'active'
GROUP BY os.id, os.code, os.libelle, i.exercice
ORDER BY montant_total DESC;

-- 11. Vue pour rapports Top Directions
CREATE OR REPLACE VIEW v_top_directions_imputations AS
SELECT 
  d.id AS direction_id,
  d.code AS direction_code,
  d.label AS direction_label,
  d.sigle AS direction_sigle,
  i.exercice,
  COUNT(DISTINCT i.id) AS nb_imputations,
  SUM(i.montant) AS montant_total,
  SUM(CASE WHEN i.forcer_imputation THEN i.montant ELSE 0 END) AS montant_force
FROM imputations i
JOIN directions d ON d.id = i.direction_id
WHERE i.statut = 'active'
GROUP BY d.id, d.code, d.label, d.sigle, i.exercice
ORDER BY montant_total DESC;