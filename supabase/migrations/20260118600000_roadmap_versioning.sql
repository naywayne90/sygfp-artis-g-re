-- ============================================
-- Migration: Versioning des Feuilles de Route
-- Date: 2026-01-18
-- Description: Gestion des versions et diff pour le réaménagement
--              des feuilles de route sans perte de données
-- ============================================

-- Ajout de colonnes de versioning sur activites
ALTER TABLE activites ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE activites ADD COLUMN IF NOT EXISTS est_active BOOLEAN DEFAULT true;
ALTER TABLE activites ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES activites(id);
ALTER TABLE activites ADD COLUMN IF NOT EXISTS replaced_by_id UUID REFERENCES activites(id);
ALTER TABLE activites ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE activites ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id);
ALTER TABLE activites ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Index pour les requêtes de versioning
CREATE INDEX IF NOT EXISTS idx_activites_version ON activites(version);
CREATE INDEX IF NOT EXISTS idx_activites_est_active ON activites(est_active);
CREATE INDEX IF NOT EXISTS idx_activites_previous_version ON activites(previous_version_id);

-- Table pour stocker les snapshots de version avant réaménagement
CREATE TABLE IF NOT EXISTS roadmap_version_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contexte
    direction_id UUID NOT NULL REFERENCES directions(id),
    exercice_id UUID NOT NULL REFERENCES exercices_budgetaires(id),
    submission_id UUID REFERENCES roadmap_submissions(id),

    -- Métadonnées version
    version_number INTEGER NOT NULL,
    snapshot_date TIMESTAMPTZ DEFAULT now(),
    snapshot_by UUID REFERENCES auth.users(id),

    -- Données complètes
    snapshot_data JSONB NOT NULL, -- Array des activités avec toutes leurs données

    -- Stats
    nb_activites INTEGER DEFAULT 0,
    montant_total NUMERIC(18, 2) DEFAULT 0,

    -- Motif
    reason TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT unique_direction_version UNIQUE (direction_id, exercice_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_direction ON roadmap_version_snapshots(direction_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_exercice ON roadmap_version_snapshots(exercice_id);

-- Table pour les changements de réaménagement en attente
CREATE TABLE IF NOT EXISTS roadmap_pending_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contexte
    direction_id UUID NOT NULL REFERENCES directions(id),
    exercice_id UUID NOT NULL REFERENCES exercices_budgetaires(id),
    import_batch_id UUID,

    -- Activité concernée
    activite_id UUID REFERENCES activites(id), -- null si nouvelle

    -- Type de changement
    change_type TEXT NOT NULL CHECK (change_type IN (
        'add',      -- Nouvelle activité
        'modify',   -- Modification
        'remove'    -- Désactivation (pas suppression)
    )),

    -- Données
    old_data JSONB, -- Données actuelles (pour modify/remove)
    new_data JSONB, -- Nouvelles données (pour add/modify)
    diff_fields JSONB, -- Liste des champs modifiés avec old/new values

    -- Validation hiérarchique
    parent_action_id UUID REFERENCES actions(id),
    parent_action_code TEXT,
    is_hierarchy_valid BOOLEAN DEFAULT true,
    hierarchy_warning TEXT,

    -- Sélection utilisateur
    is_selected BOOLEAN DEFAULT true, -- Par défaut, tous les changements sont sélectionnés

    -- Statut
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',   -- En attente de validation
        'applied',   -- Appliqué
        'rejected',  -- Rejeté
        'skipped'    -- Ignoré (non sélectionné)
    )),

    applied_at TIMESTAMPTZ,
    applied_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_pending_changes_direction ON roadmap_pending_changes(direction_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_exercice ON roadmap_pending_changes(exercice_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_status ON roadmap_pending_changes(status);
CREATE INDEX IF NOT EXISTS idx_pending_changes_batch ON roadmap_pending_changes(import_batch_id);

-- ============================================
-- Fonctions utilitaires
-- ============================================

-- Fonction pour créer un snapshot avant réaménagement
CREATE OR REPLACE FUNCTION create_roadmap_snapshot(
    p_direction_id UUID,
    p_exercice_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
    v_version_number INTEGER;
    v_snapshot_data JSONB;
    v_nb_activites INTEGER;
    v_montant_total NUMERIC(18, 2);
BEGIN
    -- Calculer le prochain numéro de version
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM roadmap_version_snapshots
    WHERE direction_id = p_direction_id
    AND exercice_id = p_exercice_id;

    -- Collecter les données des activités actives
    SELECT
        jsonb_agg(
            jsonb_build_object(
                'id', a.id,
                'code', a.code,
                'libelle', a.libelle,
                'description', a.description,
                'montant_prevu', a.montant_prevu,
                'montant_engage', a.montant_engage,
                'action_id', a.action_id,
                'responsable', a.responsable,
                'date_debut_prevue', a.date_debut_prevue,
                'date_fin_prevue', a.date_fin_prevue,
                'version', a.version,
                'import_batch_id', a.import_batch_id,
                'created_at', a.created_at
            )
        ),
        COUNT(*),
        COALESCE(SUM(a.montant_prevu), 0)
    INTO v_snapshot_data, v_nb_activites, v_montant_total
    FROM activites a
    JOIN actions ac ON a.action_id = ac.id
    JOIN missions m ON ac.mission_id = m.id
    WHERE m.direction_id = p_direction_id
    AND a.exercice_id = p_exercice_id
    AND a.est_active = true;

    -- Créer le snapshot
    INSERT INTO roadmap_version_snapshots (
        direction_id,
        exercice_id,
        version_number,
        snapshot_by,
        snapshot_data,
        nb_activites,
        montant_total,
        reason
    ) VALUES (
        p_direction_id,
        p_exercice_id,
        v_version_number,
        auth.uid(),
        COALESCE(v_snapshot_data, '[]'::jsonb),
        COALESCE(v_nb_activites, 0),
        COALESCE(v_montant_total, 0),
        p_reason
    )
    RETURNING id INTO v_snapshot_id;

    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer le diff entre import et données existantes
CREATE OR REPLACE FUNCTION calculate_import_diff(
    p_import_batch_id UUID,
    p_direction_id UUID,
    p_exercice_id UUID
)
RETURNS TABLE (
    change_id UUID,
    change_type TEXT,
    activite_id UUID,
    code TEXT,
    libelle TEXT,
    old_montant NUMERIC,
    new_montant NUMERIC,
    diff_fields JSONB,
    is_hierarchy_valid BOOLEAN,
    hierarchy_warning TEXT
) AS $$
DECLARE
    v_imported RECORD;
    v_existing RECORD;
    v_change_id UUID;
    v_diff JSONB;
    v_action_id UUID;
    v_action_code TEXT;
    v_is_valid BOOLEAN;
    v_warning TEXT;
BEGIN
    -- Supprimer les changements précédents pour ce batch
    DELETE FROM roadmap_pending_changes
    WHERE import_batch_id = p_import_batch_id
    AND status = 'pending';

    -- 1. Détecter les nouvelles activités et modifications
    FOR v_imported IN
        SELECT a.*
        FROM activites a
        WHERE a.import_batch_id = p_import_batch_id
    LOOP
        -- Chercher une activité existante avec le même code
        SELECT * INTO v_existing
        FROM activites a
        JOIN actions ac ON a.action_id = ac.id
        JOIN missions m ON ac.mission_id = m.id
        WHERE a.code = v_imported.code
        AND m.direction_id = p_direction_id
        AND a.exercice_id = p_exercice_id
        AND a.est_active = true
        AND a.id != v_imported.id
        LIMIT 1;

        -- Vérifier la hiérarchie (l'action existe-t-elle ?)
        v_is_valid := true;
        v_warning := NULL;

        IF v_imported.action_id IS NOT NULL THEN
            SELECT ac.id, ac.code INTO v_action_id, v_action_code
            FROM actions ac
            JOIN missions m ON ac.mission_id = m.id
            WHERE ac.id = v_imported.action_id
            AND m.direction_id = p_direction_id;

            IF v_action_id IS NULL THEN
                v_is_valid := false;
                v_warning := 'Action non trouvée pour cette direction';
            END IF;
        END IF;

        IF v_existing.id IS NOT NULL THEN
            -- Modification détectée
            v_diff := '[]'::jsonb;

            IF v_existing.libelle IS DISTINCT FROM v_imported.libelle THEN
                v_diff := v_diff || jsonb_build_object(
                    'field', 'libelle',
                    'old', v_existing.libelle,
                    'new', v_imported.libelle
                );
            END IF;

            IF v_existing.montant_prevu IS DISTINCT FROM v_imported.montant_prevu THEN
                v_diff := v_diff || jsonb_build_object(
                    'field', 'montant_prevu',
                    'old', v_existing.montant_prevu,
                    'new', v_imported.montant_prevu
                );
            END IF;

            IF v_existing.description IS DISTINCT FROM v_imported.description THEN
                v_diff := v_diff || jsonb_build_object(
                    'field', 'description',
                    'old', v_existing.description,
                    'new', v_imported.description
                );
            END IF;

            IF v_existing.responsable IS DISTINCT FROM v_imported.responsable THEN
                v_diff := v_diff || jsonb_build_object(
                    'field', 'responsable',
                    'old', v_existing.responsable,
                    'new', v_imported.responsable
                );
            END IF;

            -- Ne créer un changement que s'il y a des différences
            IF jsonb_array_length(v_diff) > 0 THEN
                INSERT INTO roadmap_pending_changes (
                    direction_id, exercice_id, import_batch_id,
                    activite_id, change_type,
                    old_data, new_data, diff_fields,
                    parent_action_id, parent_action_code,
                    is_hierarchy_valid, hierarchy_warning,
                    created_by
                ) VALUES (
                    p_direction_id, p_exercice_id, p_import_batch_id,
                    v_existing.id, 'modify',
                    row_to_json(v_existing)::jsonb,
                    row_to_json(v_imported)::jsonb,
                    v_diff,
                    v_action_id, v_action_code,
                    v_is_valid, v_warning,
                    auth.uid()
                )
                RETURNING id INTO v_change_id;

                RETURN QUERY SELECT
                    v_change_id,
                    'modify'::TEXT,
                    v_existing.id,
                    v_imported.code,
                    v_imported.libelle,
                    v_existing.montant_prevu,
                    v_imported.montant_prevu,
                    v_diff,
                    v_is_valid,
                    v_warning;
            END IF;
        ELSE
            -- Nouvelle activité
            INSERT INTO roadmap_pending_changes (
                direction_id, exercice_id, import_batch_id,
                activite_id, change_type,
                old_data, new_data, diff_fields,
                parent_action_id, parent_action_code,
                is_hierarchy_valid, hierarchy_warning,
                created_by
            ) VALUES (
                p_direction_id, p_exercice_id, p_import_batch_id,
                NULL, 'add',
                NULL,
                row_to_json(v_imported)::jsonb,
                NULL,
                v_action_id, v_action_code,
                v_is_valid, v_warning,
                auth.uid()
            )
            RETURNING id INTO v_change_id;

            RETURN QUERY SELECT
                v_change_id,
                'add'::TEXT,
                NULL::UUID,
                v_imported.code,
                v_imported.libelle,
                NULL::NUMERIC,
                v_imported.montant_prevu,
                NULL::JSONB,
                v_is_valid,
                v_warning;
        END IF;
    END LOOP;

    -- 2. Détecter les suppressions (activités existantes non présentes dans l'import)
    FOR v_existing IN
        SELECT a.*
        FROM activites a
        JOIN actions ac ON a.action_id = ac.id
        JOIN missions m ON ac.mission_id = m.id
        WHERE m.direction_id = p_direction_id
        AND a.exercice_id = p_exercice_id
        AND a.est_active = true
        AND NOT EXISTS (
            SELECT 1 FROM activites imp
            WHERE imp.import_batch_id = p_import_batch_id
            AND imp.code = a.code
        )
    LOOP
        INSERT INTO roadmap_pending_changes (
            direction_id, exercice_id, import_batch_id,
            activite_id, change_type,
            old_data, new_data, diff_fields,
            is_hierarchy_valid, hierarchy_warning,
            is_selected, -- Non sélectionné par défaut pour les suppressions
            created_by
        ) VALUES (
            p_direction_id, p_exercice_id, p_import_batch_id,
            v_existing.id, 'remove',
            row_to_json(v_existing)::jsonb,
            NULL,
            NULL,
            true, NULL,
            false, -- Les suppressions ne sont pas sélectionnées par défaut
            auth.uid()
        )
        RETURNING id INTO v_change_id;

        RETURN QUERY SELECT
            v_change_id,
            'remove'::TEXT,
            v_existing.id,
            v_existing.code,
            v_existing.libelle,
            v_existing.montant_prevu,
            NULL::NUMERIC,
            NULL::JSONB,
            true,
            NULL::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour appliquer les changements sélectionnés
CREATE OR REPLACE FUNCTION apply_selected_changes(
    p_import_batch_id UUID
)
RETURNS TABLE (
    applied_count INTEGER,
    skipped_count INTEGER,
    error_count INTEGER
) AS $$
DECLARE
    v_change RECORD;
    v_applied INTEGER := 0;
    v_skipped INTEGER := 0;
    v_errors INTEGER := 0;
    v_new_id UUID;
BEGIN
    FOR v_change IN
        SELECT * FROM roadmap_pending_changes
        WHERE import_batch_id = p_import_batch_id
        AND status = 'pending'
        ORDER BY change_type -- add, modify, remove
    LOOP
        IF NOT v_change.is_selected THEN
            -- Marquer comme ignoré
            UPDATE roadmap_pending_changes
            SET status = 'skipped'
            WHERE id = v_change.id;
            v_skipped := v_skipped + 1;
            CONTINUE;
        END IF;

        -- Vérifier la validité hiérarchique
        IF NOT v_change.is_hierarchy_valid THEN
            UPDATE roadmap_pending_changes
            SET status = 'rejected'
            WHERE id = v_change.id;
            v_errors := v_errors + 1;
            CONTINUE;
        END IF;

        BEGIN
            CASE v_change.change_type
                WHEN 'add' THEN
                    -- Marquer l'activité importée comme active
                    UPDATE activites
                    SET est_active = true,
                        version = 1
                    WHERE id = (v_change.new_data->>'id')::UUID;

                WHEN 'modify' THEN
                    -- Désactiver l'ancienne version
                    UPDATE activites
                    SET est_active = false,
                        deactivated_at = now(),
                        deactivated_by = auth.uid(),
                        deactivation_reason = 'Remplacé par nouvelle version',
                        replaced_by_id = (v_change.new_data->>'id')::UUID
                    WHERE id = v_change.activite_id;

                    -- Activer la nouvelle version avec lien vers l'ancienne
                    UPDATE activites
                    SET est_active = true,
                        version = (SELECT version + 1 FROM activites WHERE id = v_change.activite_id),
                        previous_version_id = v_change.activite_id
                    WHERE id = (v_change.new_data->>'id')::UUID;

                WHEN 'remove' THEN
                    -- Désactiver l'activité (pas de suppression)
                    UPDATE activites
                    SET est_active = false,
                        deactivated_at = now(),
                        deactivated_by = auth.uid(),
                        deactivation_reason = 'Supprimé lors du réaménagement'
                    WHERE id = v_change.activite_id;
            END CASE;

            -- Marquer le changement comme appliqué
            UPDATE roadmap_pending_changes
            SET status = 'applied',
                applied_at = now(),
                applied_by = auth.uid()
            WHERE id = v_change.id;

            v_applied := v_applied + 1;

        EXCEPTION WHEN OTHERS THEN
            -- En cas d'erreur, marquer comme rejeté
            UPDATE roadmap_pending_changes
            SET status = 'rejected'
            WHERE id = v_change.id;
            v_errors := v_errors + 1;
        END;
    END LOOP;

    RETURN QUERY SELECT v_applied, v_skipped, v_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour basculer la sélection d'un changement
CREATE OR REPLACE FUNCTION toggle_change_selection(
    p_change_id UUID,
    p_is_selected BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE roadmap_pending_changes
    SET is_selected = p_is_selected
    WHERE id = p_change_id
    AND status = 'pending';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE roadmap_version_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_pending_changes ENABLE ROW LEVEL SECURITY;

-- Snapshots: lecture pour admin, DG, DAAF, directeur de la direction
CREATE POLICY "snapshots_select" ON roadmap_version_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.profil_fonctionnel IN ('ADMIN', 'DG', 'DAAF', 'AUDITEUR')
                OR (p.profil_fonctionnel = 'DIRECTEUR' AND p.direction_id = roadmap_version_snapshots.direction_id)
            )
        )
    );

CREATE POLICY "snapshots_insert" ON roadmap_version_snapshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.profil_fonctionnel IN ('ADMIN', 'DAAF')
        )
    );

-- Changements en attente
CREATE POLICY "pending_changes_select" ON roadmap_pending_changes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.profil_fonctionnel IN ('ADMIN', 'DG', 'DAAF', 'AUDITEUR')
                OR (p.profil_fonctionnel = 'DIRECTEUR' AND p.direction_id = roadmap_pending_changes.direction_id)
            )
        )
    );

CREATE POLICY "pending_changes_insert" ON roadmap_pending_changes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.profil_fonctionnel IN ('ADMIN', 'DAAF', 'DIRECTEUR')
        )
    );

CREATE POLICY "pending_changes_update" ON roadmap_pending_changes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.profil_fonctionnel IN ('ADMIN', 'DAAF')
                OR (p.profil_fonctionnel = 'DIRECTEUR' AND p.direction_id = roadmap_pending_changes.direction_id)
            )
        )
        AND status = 'pending'
    );

-- ============================================
-- Commentaires
-- ============================================
COMMENT ON TABLE roadmap_version_snapshots IS 'Snapshots des feuilles de route avant réaménagement';
COMMENT ON TABLE roadmap_pending_changes IS 'Changements en attente de validation lors du réaménagement';
COMMENT ON FUNCTION create_roadmap_snapshot IS 'Crée un snapshot de toutes les activités avant modification';
COMMENT ON FUNCTION calculate_import_diff IS 'Calcule les différences entre un import et les données existantes';
COMMENT ON FUNCTION apply_selected_changes IS 'Applique les changements sélectionnés par l utilisateur';
