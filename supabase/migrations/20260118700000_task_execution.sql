-- ============================================
-- Migration: Exécution Physique des Activités
-- Date: 2026-01-18
-- Description: Suivi de l'avancement des activités
--              avec statuts, dates, preuves et responsables
-- ============================================

-- Table principale d'exécution des tâches
CREATE TABLE IF NOT EXISTS task_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations obligatoires
    activite_id UUID NOT NULL REFERENCES activites(id) ON DELETE CASCADE,
    exercice_id UUID NOT NULL REFERENCES exercices_budgetaires(id),

    -- Statut d'exécution
    status TEXT NOT NULL DEFAULT 'non_demarre' CHECK (status IN (
        'non_demarre',  -- Pas encore commencé
        'en_cours',     -- En cours de réalisation
        'realise',      -- Réalisé/Terminé
        'bloque',       -- Bloqué (problème)
        'annule'        -- Annulé
    )),

    -- Dates d'exécution
    date_debut_prevue DATE,
    date_fin_prevue DATE,
    date_debut_reelle DATE,
    date_fin_reelle DATE,

    -- Avancement
    taux_avancement INTEGER DEFAULT 0 CHECK (taux_avancement >= 0 AND taux_avancement <= 100),

    -- Responsable principal
    responsable_id UUID REFERENCES auth.users(id),
    responsable_nom TEXT, -- Pour affichage si pas d'utilisateur système

    -- Commentaires et blocages
    commentaire TEXT,
    motif_blocage TEXT,
    date_blocage TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Contrainte unicité: une seule exécution par activité/exercice
    CONSTRAINT unique_task_execution UNIQUE (activite_id, exercice_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_task_exec_activite ON task_executions(activite_id);
CREATE INDEX IF NOT EXISTS idx_task_exec_exercice ON task_executions(exercice_id);
CREATE INDEX IF NOT EXISTS idx_task_exec_status ON task_executions(status);
CREATE INDEX IF NOT EXISTS idx_task_exec_responsable ON task_executions(responsable_id);

-- Table des contributeurs (optionnel)
CREATE TABLE IF NOT EXISTS task_execution_contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_execution_id UUID NOT NULL REFERENCES task_executions(id) ON DELETE CASCADE,

    -- Contributeur
    user_id UUID REFERENCES auth.users(id),
    nom TEXT NOT NULL,
    role TEXT, -- Ex: "Appui technique", "Validation", etc.

    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_contributor UNIQUE (task_execution_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_contributors_task ON task_execution_contributors(task_execution_id);

-- Table des preuves d'exécution
CREATE TABLE IF NOT EXISTS task_execution_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_execution_id UUID NOT NULL REFERENCES task_executions(id) ON DELETE CASCADE,

    -- Type de preuve
    type TEXT NOT NULL CHECK (type IN (
        'document',     -- Document justificatif
        'photo',        -- Photo/Image
        'rapport',      -- Rapport
        'pv',           -- Procès-verbal
        'attestation',  -- Attestation
        'autre'         -- Autre
    )),

    -- Métadonnées
    libelle TEXT NOT NULL,
    description TEXT,
    filename TEXT,
    file_path TEXT, -- Chemin R2
    file_size INTEGER,
    mime_type TEXT,

    -- Dates
    date_piece DATE,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    uploaded_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_proofs_task ON task_execution_proofs(task_execution_id);

-- Historique des changements de statut
CREATE TABLE IF NOT EXISTS task_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_execution_id UUID NOT NULL REFERENCES task_executions(id) ON DELETE CASCADE,

    -- Changement
    action TEXT NOT NULL CHECK (action IN (
        'created', 'started', 'progress_updated', 'completed',
        'blocked', 'unblocked', 'cancelled', 'updated'
    )),

    old_status TEXT,
    new_status TEXT,
    old_taux INTEGER,
    new_taux INTEGER,
    comment TEXT,

    -- Auteur
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_history_task ON task_execution_history(task_execution_id);

-- ============================================
-- Triggers
-- ============================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_task_execution_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_task_execution_timestamp ON task_executions;
CREATE TRIGGER trigger_update_task_execution_timestamp
    BEFORE UPDATE ON task_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_task_execution_timestamp();

-- Trigger pour enregistrer l'historique
CREATE OR REPLACE FUNCTION log_task_execution_change()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO task_execution_history (
            task_execution_id, action, new_status, new_taux, performed_by
        ) VALUES (
            NEW.id, 'created', NEW.status, NEW.taux_avancement, NEW.created_by
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
            comment, performed_by
        ) VALUES (
            NEW.id, v_action,
            OLD.status, NEW.status,
            OLD.taux_avancement, NEW.taux_avancement,
            NEW.commentaire, auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_task_execution_change ON task_executions;
CREATE TRIGGER trigger_log_task_execution_change
    AFTER INSERT OR UPDATE ON task_executions
    FOR EACH ROW
    EXECUTE FUNCTION log_task_execution_change();

-- Trigger pour validation cohérence exercice
CREATE OR REPLACE FUNCTION validate_task_execution()
RETURNS TRIGGER AS $$
DECLARE
    v_exercice_statut TEXT;
BEGIN
    -- Vérifier que l'exercice est ouvert
    SELECT statut INTO v_exercice_statut
    FROM exercices_budgetaires
    WHERE id = NEW.exercice_id;

    IF v_exercice_statut != 'ouvert' AND NEW.status = 'realise' THEN
        RAISE EXCEPTION 'Impossible de marquer comme réalisé sur un exercice non ouvert';
    END IF;

    -- Vérifier cohérence dates
    IF NEW.date_fin_reelle IS NOT NULL AND NEW.date_debut_reelle IS NULL THEN
        RAISE EXCEPTION 'La date de début réelle doit être renseignée avant la date de fin';
    END IF;

    IF NEW.date_fin_reelle IS NOT NULL AND NEW.date_debut_reelle IS NOT NULL
       AND NEW.date_fin_reelle < NEW.date_debut_reelle THEN
        RAISE EXCEPTION 'La date de fin ne peut pas être antérieure à la date de début';
    END IF;

    -- Auto-complétion du taux si réalisé
    IF NEW.status = 'realise' AND NEW.taux_avancement < 100 THEN
        NEW.taux_avancement := 100;
    END IF;

    -- Auto-remplir date de fin si réalisé
    IF NEW.status = 'realise' AND NEW.date_fin_reelle IS NULL THEN
        NEW.date_fin_reelle := CURRENT_DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_task_execution ON task_executions;
CREATE TRIGGER trigger_validate_task_execution
    BEFORE INSERT OR UPDATE ON task_executions
    FOR EACH ROW
    EXECUTE FUNCTION validate_task_execution();

-- ============================================
-- Fonctions utilitaires
-- ============================================

-- Créer ou mettre à jour une exécution
CREATE OR REPLACE FUNCTION upsert_task_execution(
    p_activite_id UUID,
    p_exercice_id UUID,
    p_status TEXT DEFAULT NULL,
    p_taux_avancement INTEGER DEFAULT NULL,
    p_date_debut_reelle DATE DEFAULT NULL,
    p_date_fin_reelle DATE DEFAULT NULL,
    p_commentaire TEXT DEFAULT NULL,
    p_responsable_nom TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_current task_executions%ROWTYPE;
BEGIN
    -- Chercher une exécution existante
    SELECT * INTO v_current
    FROM task_executions
    WHERE activite_id = p_activite_id
    AND exercice_id = p_exercice_id;

    IF FOUND THEN
        -- Mise à jour
        UPDATE task_executions SET
            status = COALESCE(p_status, status),
            taux_avancement = COALESCE(p_taux_avancement, taux_avancement),
            date_debut_reelle = COALESCE(p_date_debut_reelle, date_debut_reelle),
            date_fin_reelle = COALESCE(p_date_fin_reelle, date_fin_reelle),
            commentaire = COALESCE(p_commentaire, commentaire),
            responsable_nom = COALESCE(p_responsable_nom, responsable_nom)
        WHERE id = v_current.id
        RETURNING id INTO v_id;
    ELSE
        -- Création
        INSERT INTO task_executions (
            activite_id, exercice_id,
            status, taux_avancement,
            date_debut_reelle, date_fin_reelle,
            commentaire, responsable_nom,
            created_by
        ) VALUES (
            p_activite_id, p_exercice_id,
            COALESCE(p_status, 'non_demarre'),
            COALESCE(p_taux_avancement, 0),
            p_date_debut_reelle, p_date_fin_reelle,
            p_commentaire, p_responsable_nom,
            auth.uid()
        )
        RETURNING id INTO v_id;
    END IF;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Marquer comme réalisé (action rapide)
CREATE OR REPLACE FUNCTION mark_task_completed(
    p_activite_id UUID,
    p_exercice_id UUID,
    p_commentaire TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    PERFORM upsert_task_execution(
        p_activite_id,
        p_exercice_id,
        'realise',
        100,
        NULL,
        CURRENT_DATE,
        p_commentaire
    );
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Marquer comme bloqué
CREATE OR REPLACE FUNCTION mark_task_blocked(
    p_activite_id UUID,
    p_exercice_id UUID,
    p_motif TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_id UUID;
BEGIN
    v_id := upsert_task_execution(
        p_activite_id,
        p_exercice_id,
        'bloque',
        NULL,
        NULL,
        NULL,
        NULL
    );

    UPDATE task_executions
    SET motif_blocage = p_motif,
        date_blocage = now()
    WHERE id = v_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Démarrer une tâche
CREATE OR REPLACE FUNCTION start_task(
    p_activite_id UUID,
    p_exercice_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    PERFORM upsert_task_execution(
        p_activite_id,
        p_exercice_id,
        'en_cours',
        10,
        CURRENT_DATE,
        NULL,
        NULL
    );
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Vue pour liste avec jointures
-- ============================================

CREATE OR REPLACE VIEW v_task_executions AS
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
    COALESCE(te.responsable_nom, p.full_name) AS responsable_display
FROM task_executions te
JOIN activites a ON te.activite_id = a.id
JOIN actions ac ON a.action_id = ac.id
JOIN missions m ON ac.mission_id = m.id
JOIN directions d ON m.direction_id = d.id
LEFT JOIN objectifs_strategiques os ON m.objectif_strategique_id = os.id
JOIN exercices_budgetaires e ON te.exercice_id = e.id
LEFT JOIN profiles p ON te.responsable_id = p.id;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_execution_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_execution_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_execution_history ENABLE ROW LEVEL SECURITY;

-- Lecture: tous les utilisateurs authentifiés
CREATE POLICY "task_executions_select" ON task_executions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Création: Admin, DAAF, Directeurs, Opérateurs
CREATE POLICY "task_executions_insert" ON task_executions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.profil_fonctionnel IN ('ADMIN', 'DAAF', 'DIRECTEUR', 'OPERATEUR')
        )
    );

-- Modification: Admin, DAAF, Directeurs, Responsable
CREATE POLICY "task_executions_update" ON task_executions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.profil_fonctionnel IN ('ADMIN', 'DAAF', 'DIRECTEUR')
                OR task_executions.responsable_id = auth.uid()
                OR task_executions.created_by = auth.uid()
            )
        )
    );

-- Policies pour contributeurs
CREATE POLICY "contributors_select" ON task_execution_contributors
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "contributors_manage" ON task_execution_contributors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM task_executions te
            WHERE te.id = task_execution_contributors.task_execution_id
            AND (
                te.responsable_id = auth.uid()
                OR te.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.profil_fonctionnel IN ('ADMIN', 'DAAF')
                )
            )
        )
    );

-- Policies pour preuves
CREATE POLICY "proofs_select" ON task_execution_proofs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "proofs_insert" ON task_execution_proofs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM task_executions te
            WHERE te.id = task_execution_id
            AND (
                te.responsable_id = auth.uid()
                OR te.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.profil_fonctionnel IN ('ADMIN', 'DAAF', 'DIRECTEUR')
                )
            )
        )
    );

-- Policies pour historique (lecture seule)
CREATE POLICY "history_select" ON task_execution_history
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- Commentaires
-- ============================================
COMMENT ON TABLE task_executions IS 'Suivi de l''exécution physique des activités';
COMMENT ON TABLE task_execution_contributors IS 'Contributeurs optionnels sur les tâches';
COMMENT ON TABLE task_execution_proofs IS 'Preuves et pièces justificatives d''exécution';
COMMENT ON TABLE task_execution_history IS 'Historique des changements de statut';
COMMENT ON VIEW v_task_executions IS 'Vue enrichie des exécutions avec hiérarchie complète';
