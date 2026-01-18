-- ============================================
-- Migration: Soumission des Feuilles de Route
-- Date: 2026-01-18
-- Description: Table et triggers pour la gestion des soumissions
--              de feuilles de route par direction
-- ============================================

-- Table principale des soumissions
CREATE TABLE IF NOT EXISTS roadmap_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    direction_id UUID NOT NULL REFERENCES directions(id),
    exercice_id UUID NOT NULL REFERENCES exercices_budgetaires(id),
    import_batch_id UUID, -- Lien vers l'import batch si créé via import

    -- Métadonnées
    libelle TEXT NOT NULL,
    description TEXT,
    nb_activites INTEGER DEFAULT 0,
    montant_total NUMERIC(18, 2) DEFAULT 0,

    -- Statut workflow
    status TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN (
        'brouillon',    -- En cours de préparation
        'soumis',       -- Soumis pour validation
        'en_revision',  -- Retourné pour révision
        'valide',       -- Validé
        'rejete'        -- Rejeté définitivement
    )),

    -- Soumission
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ,

    -- Validation
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMPTZ,
    validation_comment TEXT,

    -- Rejet
    rejected_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Historique des versions (pour diff)
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES roadmap_submissions(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),

    -- Contrainte unicité: une seule soumission active par direction/exercice
    CONSTRAINT unique_active_submission UNIQUE (direction_id, exercice_id, version)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_roadmap_submissions_direction ON roadmap_submissions(direction_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_submissions_exercice ON roadmap_submissions(exercice_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_submissions_status ON roadmap_submissions(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_submissions_import_batch ON roadmap_submissions(import_batch_id);

-- Table de liaison soumission <-> activités
CREATE TABLE IF NOT EXISTS roadmap_submission_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES roadmap_submissions(id) ON DELETE CASCADE,
    activite_id UUID NOT NULL REFERENCES activites(id) ON DELETE CASCADE,

    -- Snapshot des données au moment de la soumission (pour diff)
    snapshot_data JSONB,

    -- Status de l'activité dans la soumission
    status TEXT DEFAULT 'inclus' CHECK (status IN ('inclus', 'modifie', 'nouveau', 'supprime')),

    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_submission_activity UNIQUE (submission_id, activite_id)
);

CREATE INDEX IF NOT EXISTS idx_submission_activities_submission ON roadmap_submission_activities(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_activities_activite ON roadmap_submission_activities(activite_id);

-- Historique des actions sur les soumissions
CREATE TABLE IF NOT EXISTS roadmap_submission_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES roadmap_submissions(id) ON DELETE CASCADE,

    action TEXT NOT NULL CHECK (action IN (
        'created', 'submitted', 'validated', 'rejected',
        'revision_requested', 'resubmitted', 'updated'
    )),

    -- Détails
    old_status TEXT,
    new_status TEXT,
    comment TEXT,

    -- Auteur
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT now(),

    -- Métadonnées additionnelles
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_submission_history_submission ON roadmap_submission_history(submission_id);

-- ============================================
-- Triggers
-- ============================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_roadmap_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_roadmap_submission_timestamp ON roadmap_submissions;
CREATE TRIGGER trigger_update_roadmap_submission_timestamp
    BEFORE UPDATE ON roadmap_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_roadmap_submission_timestamp();

-- Trigger pour enregistrer l'historique
CREATE OR REPLACE FUNCTION log_roadmap_submission_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO roadmap_submission_history (
            submission_id, action, new_status, performed_by
        ) VALUES (
            NEW.id, 'created', NEW.status, NEW.created_by
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO roadmap_submission_history (
            submission_id,
            action,
            old_status,
            new_status,
            comment,
            performed_by
        ) VALUES (
            NEW.id,
            CASE
                WHEN NEW.status = 'soumis' THEN 'submitted'
                WHEN NEW.status = 'valide' THEN 'validated'
                WHEN NEW.status = 'rejete' THEN 'rejected'
                WHEN NEW.status = 'en_revision' THEN 'revision_requested'
                ELSE 'updated'
            END,
            OLD.status,
            NEW.status,
            CASE
                WHEN NEW.status = 'valide' THEN NEW.validation_comment
                WHEN NEW.status = 'rejete' THEN NEW.rejection_reason
                ELSE NULL
            END,
            CASE
                WHEN NEW.status = 'soumis' THEN NEW.submitted_by
                WHEN NEW.status = 'valide' THEN NEW.validated_by
                WHEN NEW.status = 'rejete' THEN NEW.rejected_by
                ELSE auth.uid()
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_roadmap_submission_change ON roadmap_submissions;
CREATE TRIGGER trigger_log_roadmap_submission_change
    AFTER INSERT OR UPDATE ON roadmap_submissions
    FOR EACH ROW
    EXECUTE FUNCTION log_roadmap_submission_change();

-- Trigger pour activer les activités lors de la validation
CREATE OR REPLACE FUNCTION activate_activities_on_validation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'valide' AND OLD.status != 'valide' THEN
        -- Activer toutes les activités liées à cette soumission
        UPDATE activites
        SET est_active = true,
            updated_at = now()
        WHERE id IN (
            SELECT activite_id
            FROM roadmap_submission_activities
            WHERE submission_id = NEW.id
            AND status != 'supprime'
        );

        -- Créer une notification pour l'auteur
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            entity_type,
            entity_id,
            is_read
        ) VALUES (
            NEW.submitted_by,
            'validation',
            'Feuille de route validée',
            'Votre feuille de route pour ' || (
                SELECT d.label FROM directions d WHERE d.id = NEW.direction_id
            ) || ' a été validée.',
            'roadmap_submission',
            NEW.id,
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_activate_activities_on_validation ON roadmap_submissions;
CREATE TRIGGER trigger_activate_activities_on_validation
    AFTER UPDATE ON roadmap_submissions
    FOR EACH ROW
    EXECUTE FUNCTION activate_activities_on_validation();

-- Trigger pour notifier en cas de rejet
CREATE OR REPLACE FUNCTION notify_rejection()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'rejete' AND OLD.status != 'rejete' THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            entity_type,
            entity_id,
            is_read
        ) VALUES (
            NEW.submitted_by,
            'rejet',
            'Feuille de route rejetée',
            'Votre feuille de route a été rejetée. Motif: ' || COALESCE(NEW.rejection_reason, 'Non spécifié'),
            'roadmap_submission',
            NEW.id,
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_rejection ON roadmap_submissions;
CREATE TRIGGER trigger_notify_rejection
    AFTER UPDATE ON roadmap_submissions
    FOR EACH ROW
    EXECUTE FUNCTION notify_rejection();

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE roadmap_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_submission_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_submission_history ENABLE ROW LEVEL SECURITY;

-- Lecture: Admin, DG, DAAF voient tout, Directeurs voient leur direction
CREATE POLICY "roadmap_submissions_select" ON roadmap_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.profil_fonctionnel IN ('ADMIN', 'DG', 'DAAF', 'AUDITEUR')
                OR (p.profil_fonctionnel = 'DIRECTEUR' AND p.direction_id = roadmap_submissions.direction_id)
                OR roadmap_submissions.created_by = auth.uid()
            )
        )
    );

-- Création: Directeurs pour leur direction, Admin/DAAF pour tous
CREATE POLICY "roadmap_submissions_insert" ON roadmap_submissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.profil_fonctionnel IN ('ADMIN', 'DAAF')
                OR (p.profil_fonctionnel = 'DIRECTEUR' AND p.direction_id = direction_id)
            )
        )
    );

-- Modification: selon le status et le rôle
CREATE POLICY "roadmap_submissions_update" ON roadmap_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.profil_fonctionnel IN ('ADMIN', 'DG', 'DAAF')
                OR (p.profil_fonctionnel = 'DIRECTEUR' AND p.direction_id = roadmap_submissions.direction_id AND status IN ('brouillon', 'en_revision'))
            )
        )
    );

-- Policies pour les activités de soumission
CREATE POLICY "submission_activities_select" ON roadmap_submission_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM roadmap_submissions rs
            WHERE rs.id = roadmap_submission_activities.submission_id
            AND (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND (
                        p.profil_fonctionnel IN ('ADMIN', 'DG', 'DAAF', 'AUDITEUR')
                        OR (p.profil_fonctionnel = 'DIRECTEUR' AND p.direction_id = rs.direction_id)
                        OR rs.created_by = auth.uid()
                    )
                )
            )
        )
    );

CREATE POLICY "submission_activities_insert" ON roadmap_submission_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM roadmap_submissions rs
            WHERE rs.id = submission_id
            AND rs.status = 'brouillon'
            AND (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND (
                        p.profil_fonctionnel IN ('ADMIN', 'DAAF')
                        OR (p.profil_fonctionnel = 'DIRECTEUR' AND p.direction_id = rs.direction_id)
                    )
                )
            )
        )
    );

-- Policies pour l'historique (lecture seule pour les autorisés)
CREATE POLICY "submission_history_select" ON roadmap_submission_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM roadmap_submissions rs
            WHERE rs.id = roadmap_submission_history.submission_id
            AND (
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.profil_fonctionnel IN ('ADMIN', 'DG', 'DAAF', 'AUDITEUR', 'DIRECTEUR')
                )
            )
        )
    );

-- ============================================
-- Fonctions utilitaires
-- ============================================

-- Fonction pour créer une soumission depuis un import batch
CREATE OR REPLACE FUNCTION create_submission_from_import(
    p_import_batch_id UUID,
    p_direction_id UUID,
    p_exercice_id UUID,
    p_libelle TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_submission_id UUID;
    v_nb_activites INTEGER;
    v_montant_total NUMERIC(18,2);
BEGIN
    -- Compter les activités et calculer le montant
    SELECT COUNT(*), COALESCE(SUM(a.montant_prevu), 0)
    INTO v_nb_activites, v_montant_total
    FROM activites a
    WHERE a.import_batch_id = p_import_batch_id;

    IF v_nb_activites = 0 THEN
        RAISE EXCEPTION 'Aucune activité trouvée pour ce batch';
    END IF;

    -- Créer la soumission
    INSERT INTO roadmap_submissions (
        direction_id,
        exercice_id,
        import_batch_id,
        libelle,
        nb_activites,
        montant_total,
        status,
        created_by
    ) VALUES (
        p_direction_id,
        p_exercice_id,
        p_import_batch_id,
        COALESCE(p_libelle, 'Import du ' || to_char(now(), 'DD/MM/YYYY HH24:MI')),
        v_nb_activites,
        v_montant_total,
        'brouillon',
        auth.uid()
    )
    RETURNING id INTO v_submission_id;

    -- Lier les activités à la soumission
    INSERT INTO roadmap_submission_activities (submission_id, activite_id, status, snapshot_data)
    SELECT
        v_submission_id,
        a.id,
        'nouveau',
        jsonb_build_object(
            'code', a.code,
            'libelle', a.libelle,
            'montant_prevu', a.montant_prevu,
            'created_at', a.created_at
        )
    FROM activites a
    WHERE a.import_batch_id = p_import_batch_id;

    RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour soumettre une feuille de route
CREATE OR REPLACE FUNCTION submit_roadmap(p_submission_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_submission roadmap_submissions%ROWTYPE;
BEGIN
    SELECT * INTO v_submission FROM roadmap_submissions WHERE id = p_submission_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Soumission non trouvée';
    END IF;

    IF v_submission.status NOT IN ('brouillon', 'en_revision') THEN
        RAISE EXCEPTION 'Seules les soumissions en brouillon ou en révision peuvent être soumises';
    END IF;

    UPDATE roadmap_submissions
    SET status = 'soumis',
        submitted_by = auth.uid(),
        submitted_at = now()
    WHERE id = p_submission_id;

    -- Notifier les validateurs (DG, DAAF)
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, is_read)
    SELECT
        p.id,
        'soumission',
        'Nouvelle feuille de route à valider',
        'Une feuille de route de ' || (SELECT label FROM directions WHERE id = v_submission.direction_id) || ' est en attente de validation.',
        'roadmap_submission',
        p_submission_id,
        false
    FROM profiles p
    WHERE p.profil_fonctionnel IN ('DG', 'DAAF')
    AND p.est_actif = true;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider une feuille de route
CREATE OR REPLACE FUNCTION validate_roadmap(
    p_submission_id UUID,
    p_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_submission roadmap_submissions%ROWTYPE;
BEGIN
    SELECT * INTO v_submission FROM roadmap_submissions WHERE id = p_submission_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Soumission non trouvée';
    END IF;

    IF v_submission.status != 'soumis' THEN
        RAISE EXCEPTION 'Seules les soumissions en attente peuvent être validées';
    END IF;

    -- Vérifier le rôle
    IF NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.profil_fonctionnel IN ('ADMIN', 'DG', 'DAAF')
    ) THEN
        RAISE EXCEPTION 'Permission refusée';
    END IF;

    UPDATE roadmap_submissions
    SET status = 'valide',
        validated_by = auth.uid(),
        validated_at = now(),
        validation_comment = p_comment
    WHERE id = p_submission_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rejeter une feuille de route
CREATE OR REPLACE FUNCTION reject_roadmap(
    p_submission_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_submission roadmap_submissions%ROWTYPE;
BEGIN
    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'Le motif de rejet est obligatoire';
    END IF;

    SELECT * INTO v_submission FROM roadmap_submissions WHERE id = p_submission_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Soumission non trouvée';
    END IF;

    IF v_submission.status != 'soumis' THEN
        RAISE EXCEPTION 'Seules les soumissions en attente peuvent être rejetées';
    END IF;

    -- Vérifier le rôle
    IF NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.profil_fonctionnel IN ('ADMIN', 'DG', 'DAAF')
    ) THEN
        RAISE EXCEPTION 'Permission refusée';
    END IF;

    UPDATE roadmap_submissions
    SET status = 'rejete',
        rejected_by = auth.uid(),
        rejected_at = now(),
        rejection_reason = p_reason
    WHERE id = p_submission_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour demander une révision
CREATE OR REPLACE FUNCTION request_revision_roadmap(
    p_submission_id UUID,
    p_comment TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_submission roadmap_submissions%ROWTYPE;
BEGIN
    SELECT * INTO v_submission FROM roadmap_submissions WHERE id = p_submission_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Soumission non trouvée';
    END IF;

    IF v_submission.status != 'soumis' THEN
        RAISE EXCEPTION 'Seules les soumissions en attente peuvent être renvoyées pour révision';
    END IF;

    UPDATE roadmap_submissions
    SET status = 'en_revision',
        validation_comment = p_comment
    WHERE id = p_submission_id;

    -- Notifier l'auteur
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, is_read)
    VALUES (
        v_submission.submitted_by,
        'revision',
        'Révision demandée',
        'Des modifications sont demandées sur votre feuille de route. ' || COALESCE(p_comment, ''),
        'roadmap_submission',
        p_submission_id,
        false
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Commentaire final
-- ============================================
COMMENT ON TABLE roadmap_submissions IS 'Soumissions de feuilles de route par direction pour validation';
COMMENT ON TABLE roadmap_submission_activities IS 'Activités incluses dans chaque soumission avec snapshot pour diff';
COMMENT ON TABLE roadmap_submission_history IS 'Historique des actions sur les soumissions';
