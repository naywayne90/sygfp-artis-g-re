-- ============================================
-- Migration: Ajout champ source pour TaskExecution
-- Date: 2026-01-18
-- Description: Traçabilité de l'origine des données
-- ============================================

-- Ajouter le champ source à task_executions
ALTER TABLE task_executions
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manuel'
CHECK (source IN ('manuel', 'import', 'auto'));

-- Commentaire
COMMENT ON COLUMN task_executions.source IS 'Origine de la donnée: manuel (saisie utilisateur), import (fichier Excel), auto (système)';

-- Mettre à jour l'historique pour inclure la source
ALTER TABLE task_execution_history
ADD COLUMN IF NOT EXISTS source TEXT;

-- Mise à jour du trigger pour enregistrer la source
CREATE OR REPLACE FUNCTION log_task_execution_change()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO task_execution_history (
            task_execution_id, action, new_status, new_taux, performed_by, source
        ) VALUES (
            NEW.id, 'created', NEW.status, NEW.taux_avancement, NEW.created_by, NEW.source
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Déterminer l'action
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            v_action := CASE
                WHEN NEW.status = 'en_cours' AND OLD.status = 'non_demarre' THEN 'started'
                WHEN NEW.status = 'realise' THEN 'completed'
                WHEN NEW.status = 'bloque' THEN 'blocked'
                WHEN OLD.status = 'bloque' AND NEW.status != 'bloque' THEN 'unblocked'
                WHEN NEW.status = 'annule' THEN 'cancelled'
                ELSE 'updated'
            END;
        ELSIF OLD.taux_avancement IS DISTINCT FROM NEW.taux_avancement THEN
            v_action := 'progress_updated';
        ELSE
            v_action := 'updated';
        END IF;

        INSERT INTO task_execution_history (
            task_execution_id, action,
            old_status, new_status,
            old_taux, new_taux,
            comment, performed_by, source
        ) VALUES (
            NEW.id, v_action,
            OLD.status, NEW.status,
            OLD.taux_avancement, NEW.taux_avancement,
            NEW.commentaire, auth.uid(), NEW.source
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la vue pour inclure la source
DROP VIEW IF EXISTS v_task_executions;

CREATE VIEW v_task_executions AS
SELECT
    te.*,
    a.code AS activite_code,
    a.libelle AS activite_libelle,
    a.montant_prevu AS activite_montant,
    ac.id AS action_id,
    ac.code AS action_code,
    ac.libelle AS action_libelle,
    m.id AS mission_id,
    m.code AS mission_code,
    m.libelle AS mission_libelle,
    d.id AS direction_id,
    d.code AS direction_code,
    d.label AS direction_label,
    os.id AS os_id,
    os.code AS os_code,
    os.libelle AS os_libelle,
    e.annee AS exercice_annee,
    e.libelle AS exercice_libelle,
    p.full_name AS responsable_full_name,
    COALESCE(te.responsable_nom, p.full_name) AS responsable_display,
    -- Informations audit
    pc.full_name AS created_by_name,
    pu.full_name AS updated_by_name
FROM task_executions te
JOIN activites a ON te.activite_id = a.id
JOIN actions ac ON a.action_id = ac.id
JOIN missions m ON ac.mission_id = m.id
JOIN directions d ON m.direction_id = d.id
LEFT JOIN objectifs_strategiques os ON m.objectif_strategique_id = os.id
JOIN exercices_budgetaires e ON te.exercice_id = e.id
LEFT JOIN profiles p ON te.responsable_id = p.id
LEFT JOIN profiles pc ON te.created_by = pc.id
LEFT JOIN profiles pu ON te.updated_by = pu.id;

COMMENT ON VIEW v_task_executions IS 'Vue enrichie des exécutions avec hiérarchie complète et audit';
