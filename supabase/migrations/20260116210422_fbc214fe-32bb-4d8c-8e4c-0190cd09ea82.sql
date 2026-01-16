-- =====================================================
-- MIGRATION : Expression de Besoin - Workflow complet
-- =====================================================

-- 1. Fonction pour mettre à jour le dossier quand une EB est validée
CREATE OR REPLACE FUNCTION fn_update_dossier_on_eb_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quand une EB passe au statut "validé", on met à jour l'étape courante du dossier
  IF NEW.statut = 'validé' AND (OLD.statut IS NULL OR OLD.statut != 'validé') THEN
    -- Mettre à jour le dossier lié
    IF NEW.dossier_id IS NOT NULL THEN
      UPDATE dossiers 
      SET etape_courante = 'expression_besoin',
          updated_at = now()
      WHERE id = NEW.dossier_id;
    END IF;
    
    -- Fermer la tâche workflow si elle existe
    UPDATE workflow_tasks 
    SET status = 'done',
        completed_at = now(),
        completed_by = NEW.validated_by
    WHERE entity_type = 'expression_besoin'
      AND entity_id = NEW.id
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour la validation EB
DROP TRIGGER IF EXISTS trg_update_dossier_on_eb_validation ON expressions_besoin;
CREATE TRIGGER trg_update_dossier_on_eb_validation
  AFTER UPDATE ON expressions_besoin
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_dossier_on_eb_validation();

-- 2. Fonction pour créer une tâche de workflow quand une EB est soumise
CREATE OR REPLACE FUNCTION fn_create_eb_workflow_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_direction_label TEXT;
  v_next_role TEXT;
BEGIN
  -- Quand une EB est soumise, créer une tâche de validation
  IF NEW.statut = 'soumis' AND (OLD.statut IS NULL OR OLD.statut != 'soumis') THEN
    -- Récupérer le nom de la direction
    SELECT label INTO v_direction_label
    FROM directions 
    WHERE id = NEW.direction_id;
    
    -- Déterminer le rôle du validateur selon l'étape
    v_next_role := CASE NEW.current_validation_step
      WHEN 1 THEN 'CHEF_SERVICE'
      WHEN 2 THEN 'SOUS_DIRECTEUR'
      WHEN 3 THEN 'DIRECTEUR'
      ELSE 'CB'
    END;
    
    -- Créer la tâche
    INSERT INTO workflow_tasks (
      entity_type,
      entity_id,
      entity_code,
      task_type,
      title,
      description,
      assigned_role,
      assigned_direction_id,
      priority,
      due_date,
      status,
      created_by
    ) VALUES (
      'expression_besoin',
      NEW.id,
      NEW.numero,
      'validation',
      'Valider EB: ' || COALESCE(NEW.numero, 'En attente'),
      'Expression de besoin à valider - ' || COALESCE(v_direction_label, 'Direction') || ' - Montant: ' || COALESCE(NEW.montant_estime::text, 'N/A') || ' FCFA',
      v_next_role,
      NEW.direction_id,
      CASE NEW.urgence 
        WHEN 'tres_urgent' THEN 1 
        WHEN 'urgent' THEN 2 
        ELSE 3 
      END,
      CASE WHEN NEW.calendrier_debut IS NOT NULL 
           THEN NEW.calendrier_debut::timestamp 
           ELSE (now() + interval '7 days') 
      END,
      'pending',
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour création de tâche workflow
DROP TRIGGER IF EXISTS trg_create_eb_workflow_task ON expressions_besoin;
CREATE TRIGGER trg_create_eb_workflow_task
  AFTER UPDATE ON expressions_besoin
  FOR EACH ROW
  EXECUTE FUNCTION fn_create_eb_workflow_task();

-- Aussi pour les INSERT (soumission directe)
DROP TRIGGER IF EXISTS trg_create_eb_workflow_task_insert ON expressions_besoin;
CREATE TRIGGER trg_create_eb_workflow_task_insert
  AFTER INSERT ON expressions_besoin
  FOR EACH ROW
  WHEN (NEW.statut = 'soumis')
  EXECUTE FUNCTION fn_create_eb_workflow_task();

-- 3. Ajouter le lieu de livraison à la table expressions_besoin
ALTER TABLE expressions_besoin 
ADD COLUMN IF NOT EXISTS lieu_livraison TEXT,
ADD COLUMN IF NOT EXISTS delai_livraison TEXT,
ADD COLUMN IF NOT EXISTS contact_livraison TEXT;

-- 4. Vue pour les stats des expressions de besoin
CREATE OR REPLACE VIEW v_expressions_besoin_stats AS
SELECT 
  exercice,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE statut = 'brouillon') as brouillon,
  COUNT(*) FILTER (WHERE statut = 'soumis') as soumis,
  COUNT(*) FILTER (WHERE statut = 'validé') as valide,
  COUNT(*) FILTER (WHERE statut = 'rejeté') as rejete,
  COUNT(*) FILTER (WHERE statut = 'différé') as differe,
  COALESCE(SUM(montant_estime) FILTER (WHERE statut = 'validé'), 0) as montant_valide_total
FROM expressions_besoin
GROUP BY exercice;

-- 5. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_expressions_besoin_exercice_statut 
ON expressions_besoin(exercice, statut);

CREATE INDEX IF NOT EXISTS idx_expressions_besoin_dossier_id 
ON expressions_besoin(dossier_id);

CREATE INDEX IF NOT EXISTS idx_expressions_besoin_direction_id 
ON expressions_besoin(direction_id);

-- 6. Fonction pour générer le numéro EB avec séquence atomique
CREATE OR REPLACE FUNCTION generate_eb_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_annee INTEGER;
  v_seq INTEGER;
  v_numero TEXT;
BEGIN
  -- Si pas de numéro et statut soumis
  IF NEW.numero IS NULL AND NEW.statut = 'soumis' THEN
    v_annee := COALESCE(NEW.exercice, EXTRACT(YEAR FROM NOW())::INTEGER);
    
    -- Incrémenter atomiquement
    INSERT INTO expression_besoin_sequences (annee, dernier_numero, updated_at)
    VALUES (v_annee, 1, now())
    ON CONFLICT (annee) DO UPDATE
    SET dernier_numero = expression_besoin_sequences.dernier_numero + 1,
        updated_at = now()
    RETURNING dernier_numero INTO v_seq;
    
    -- Générer le numéro
    NEW.numero := 'EB-' || v_annee || '-' || LPAD(v_seq::TEXT, 5, '0');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour génération numéro EB
DROP TRIGGER IF EXISTS trg_generate_eb_numero ON expressions_besoin;
CREATE TRIGGER trg_generate_eb_numero
  BEFORE UPDATE ON expressions_besoin
  FOR EACH ROW
  EXECUTE FUNCTION generate_eb_numero();

-- Aussi pour INSERT
DROP TRIGGER IF EXISTS trg_generate_eb_numero_insert ON expressions_besoin;
CREATE TRIGGER trg_generate_eb_numero_insert
  BEFORE INSERT ON expressions_besoin
  FOR EACH ROW
  WHEN (NEW.statut = 'soumis')
  EXECUTE FUNCTION generate_eb_numero();

-- 7. Ajouter contrainte d'unicité sur le numéro de séquence
ALTER TABLE expression_besoin_sequences
DROP CONSTRAINT IF EXISTS expression_besoin_sequences_annee_key;

ALTER TABLE expression_besoin_sequences
ADD CONSTRAINT expression_besoin_sequences_annee_key UNIQUE (annee);