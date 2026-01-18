-- ============================================
-- STABILISATION DES RÉFÉRENTIELS SYGFP
-- ============================================
-- OBJECTIF: Stabiliser OS/Actions/Missions/Directions/Plans/Activités + Exercice
-- CONTRAINTES: Ne supprime aucun champ existant, ajoute seulement les colonnes manquantes
-- ============================================

-- ============================================
-- 1. TABLE PLANS_TRAVAIL (nouvelle)
-- ============================================
-- Un plan de travail lie une Direction à un Exercice avec un ensemble d'activités

CREATE TABLE IF NOT EXISTS plans_travail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    libelle TEXT NOT NULL,
    description TEXT,

    -- Relations
    exercice_id UUID NOT NULL,
    direction_id UUID NOT NULL,

    -- Métadonnées
    statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'valide', 'en_cours', 'cloture')),
    date_debut DATE,
    date_fin DATE,
    budget_alloue NUMERIC(18,2) DEFAULT 0,
    budget_consomme NUMERIC(18,2) DEFAULT 0,

    -- Responsables
    responsable_id UUID,
    validateur_id UUID,
    date_validation TIMESTAMP WITH TIME ZONE,

    -- Tracking
    est_actif BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_file TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,

    -- Contrainte d'unicité
    CONSTRAINT plans_travail_code_exercice_direction_unique UNIQUE (code, exercice_id, direction_id)
);

-- Index pour plans_travail
CREATE INDEX IF NOT EXISTS idx_plans_travail_exercice_id ON plans_travail(exercice_id);
CREATE INDEX IF NOT EXISTS idx_plans_travail_direction_id ON plans_travail(direction_id);
CREATE INDEX IF NOT EXISTS idx_plans_travail_code ON plans_travail(code);
CREATE INDEX IF NOT EXISTS idx_plans_travail_statut ON plans_travail(statut) WHERE est_actif = true;

-- Clés étrangères pour plans_travail (ajout conditionnel)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'plans_travail_exercice_id_fkey'
    ) THEN
        ALTER TABLE plans_travail
        ADD CONSTRAINT plans_travail_exercice_id_fkey
        FOREIGN KEY (exercice_id) REFERENCES exercices_budgetaires(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'plans_travail_direction_id_fkey'
    ) THEN
        ALTER TABLE plans_travail
        ADD CONSTRAINT plans_travail_direction_id_fkey
        FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'plans_travail_responsable_id_fkey'
    ) THEN
        ALTER TABLE plans_travail
        ADD CONSTRAINT plans_travail_responsable_id_fkey
        FOREIGN KEY (responsable_id) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_plans_travail_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_plans_travail_updated_at ON plans_travail;
CREATE TRIGGER set_plans_travail_updated_at
    BEFORE UPDATE ON plans_travail
    FOR EACH ROW EXECUTE FUNCTION update_plans_travail_updated_at();

-- RLS pour plans_travail
ALTER TABLE plans_travail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_travail_select_all" ON plans_travail;
CREATE POLICY "plans_travail_select_all" ON plans_travail
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "plans_travail_insert_admin" ON plans_travail;
CREATE POLICY "plans_travail_insert_admin" ON plans_travail
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profil_fonctionnel IN ('Admin', 'DAAF', 'CB'))
    );

DROP POLICY IF EXISTS "plans_travail_update_admin" ON plans_travail;
CREATE POLICY "plans_travail_update_admin" ON plans_travail
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profil_fonctionnel IN ('Admin', 'DAAF', 'CB'))
    );

-- ============================================
-- 2. ENRICHIR LA TABLE ACTIVITES (lien plan_travail)
-- ============================================

-- Ajouter colonne plan_travail_id si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'activites' AND column_name = 'plan_travail_id'
    ) THEN
        ALTER TABLE activites ADD COLUMN plan_travail_id UUID;
    END IF;

    -- Ajouter colonne direction_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'activites' AND column_name = 'direction_id'
    ) THEN
        ALTER TABLE activites ADD COLUMN direction_id UUID;
    END IF;

    -- Ajouter colonne exercice_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'activites' AND column_name = 'exercice_id'
    ) THEN
        ALTER TABLE activites ADD COLUMN exercice_id UUID;
    END IF;
END $$;

-- Index sur activites
CREATE INDEX IF NOT EXISTS idx_activites_plan_travail_id ON activites(plan_travail_id);
CREATE INDEX IF NOT EXISTS idx_activites_direction_id ON activites(direction_id);
CREATE INDEX IF NOT EXISTS idx_activites_exercice_id ON activites(exercice_id);

-- Clés étrangères conditionnelles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'activites_plan_travail_id_fkey'
    ) THEN
        ALTER TABLE activites
        ADD CONSTRAINT activites_plan_travail_id_fkey
        FOREIGN KEY (plan_travail_id) REFERENCES plans_travail(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'activites_direction_id_fkey'
    ) THEN
        ALTER TABLE activites
        ADD CONSTRAINT activites_direction_id_fkey
        FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'activites_exercice_id_fkey'
    ) THEN
        ALTER TABLE activites
        ADD CONSTRAINT activites_exercice_id_fkey
        FOREIGN KEY (exercice_id) REFERENCES exercices_budgetaires(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- 3. ENRICHIR LA TABLE ACTIONS (lien direction)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'actions' AND column_name = 'direction_id'
    ) THEN
        ALTER TABLE actions ADD COLUMN direction_id UUID;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_actions_direction_id ON actions(direction_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'actions_direction_id_fkey'
    ) THEN
        ALTER TABLE actions
        ADD CONSTRAINT actions_direction_id_fkey
        FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- 4. ENRICHIR LA TABLE MISSIONS (lien direction)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'missions' AND column_name = 'direction_id'
    ) THEN
        ALTER TABLE missions ADD COLUMN direction_id UUID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'missions' AND column_name = 'os_id'
    ) THEN
        ALTER TABLE missions ADD COLUMN os_id UUID;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_missions_direction_id ON missions(direction_id);
CREATE INDEX IF NOT EXISTS idx_missions_os_id ON missions(os_id);
CREATE INDEX IF NOT EXISTS idx_missions_code ON missions(code);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'missions_direction_id_fkey'
    ) THEN
        ALTER TABLE missions
        ADD CONSTRAINT missions_direction_id_fkey
        FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'missions_os_id_fkey'
    ) THEN
        ALTER TABLE missions
        ADD CONSTRAINT missions_os_id_fkey
        FOREIGN KEY (os_id) REFERENCES objectifs_strategiques(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- 5. TABLE IMPORT_LOGS (nouvelle)
-- ============================================

CREATE TABLE IF NOT EXISTS import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Type d'import
    type_import TEXT NOT NULL CHECK (type_import IN (
        'os', 'missions', 'actions', 'activites', 'sous_activites',
        'directions', 'plans_travail', 'budget_lines', 'tiers', 'other'
    )),

    -- Source
    nom_fichier TEXT NOT NULL,
    format_fichier TEXT, -- csv, xlsx, json
    taille_fichier INTEGER,

    -- Résultat
    nb_lignes_total INTEGER DEFAULT 0,
    nb_lignes_importees INTEGER DEFAULT 0,
    nb_lignes_erreur INTEGER DEFAULT 0,
    nb_lignes_ignorees INTEGER DEFAULT 0,

    -- Détails des erreurs (JSON array)
    erreurs JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,

    -- Statut
    statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'erreur', 'annule')),
    message TEXT,

    -- Métadonnées
    exercice_id UUID,
    user_id UUID,
    ip_address TEXT,

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour import_logs
CREATE INDEX IF NOT EXISTS idx_import_logs_type ON import_logs(type_import);
CREATE INDEX IF NOT EXISTS idx_import_logs_user ON import_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_exercice ON import_logs(exercice_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_statut ON import_logs(statut);
CREATE INDEX IF NOT EXISTS idx_import_logs_created ON import_logs(created_at DESC);

-- Clés étrangères
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'import_logs_user_id_fkey'
    ) THEN
        ALTER TABLE import_logs
        ADD CONSTRAINT import_logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'import_logs_exercice_id_fkey'
    ) THEN
        ALTER TABLE import_logs
        ADD CONSTRAINT import_logs_exercice_id_fkey
        FOREIGN KEY (exercice_id) REFERENCES exercices_budgetaires(id) ON DELETE SET NULL;
    END IF;
END $$;

-- RLS pour import_logs
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "import_logs_select_admin" ON import_logs;
CREATE POLICY "import_logs_select_admin" ON import_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profil_fonctionnel IN ('Admin', 'DAAF', 'Auditeur'))
    );

DROP POLICY IF EXISTS "import_logs_insert_admin" ON import_logs;
CREATE POLICY "import_logs_insert_admin" ON import_logs
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profil_fonctionnel IN ('Admin', 'DAAF'))
    );

-- ============================================
-- 6. TABLE DIRECTION_OS_MAPPING (liaison OS-Direction)
-- ============================================

CREATE TABLE IF NOT EXISTS direction_os_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    direction_id UUID NOT NULL,
    os_id UUID NOT NULL,
    exercice_id UUID NOT NULL,

    -- Budget alloué pour cet OS par cette direction
    budget_alloue NUMERIC(18,2) DEFAULT 0,
    budget_consomme NUMERIC(18,2) DEFAULT 0,

    -- Responsabilité
    est_pilote BOOLEAN DEFAULT false, -- Direction pilote de cet OS
    est_contributeur BOOLEAN DEFAULT true, -- Direction contribue à cet OS

    -- Métadonnées
    est_actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT direction_os_mapping_unique UNIQUE (direction_id, os_id, exercice_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_direction_os_mapping_direction ON direction_os_mapping(direction_id);
CREATE INDEX IF NOT EXISTS idx_direction_os_mapping_os ON direction_os_mapping(os_id);
CREATE INDEX IF NOT EXISTS idx_direction_os_mapping_exercice ON direction_os_mapping(exercice_id);

-- Clés étrangères
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'direction_os_mapping_direction_id_fkey'
    ) THEN
        ALTER TABLE direction_os_mapping
        ADD CONSTRAINT direction_os_mapping_direction_id_fkey
        FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'direction_os_mapping_os_id_fkey'
    ) THEN
        ALTER TABLE direction_os_mapping
        ADD CONSTRAINT direction_os_mapping_os_id_fkey
        FOREIGN KEY (os_id) REFERENCES objectifs_strategiques(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'direction_os_mapping_exercice_id_fkey'
    ) THEN
        ALTER TABLE direction_os_mapping
        ADD CONSTRAINT direction_os_mapping_exercice_id_fkey
        FOREIGN KEY (exercice_id) REFERENCES exercices_budgetaires(id) ON DELETE CASCADE;
    END IF;
END $$;

-- RLS
ALTER TABLE direction_os_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "direction_os_mapping_select_all" ON direction_os_mapping;
CREATE POLICY "direction_os_mapping_select_all" ON direction_os_mapping
    FOR SELECT USING (true);

-- ============================================
-- 7. FONCTIONS DE VALIDATION DE COHÉRENCE
-- ============================================

-- Fonction: Vérifier qu'une activité ne peut pas référencer un plan d'une autre direction
CREATE OR REPLACE FUNCTION validate_activite_plan_coherence()
RETURNS TRIGGER AS $$
BEGIN
    -- Si plan_travail_id est défini, vérifier la cohérence avec direction_id
    IF NEW.plan_travail_id IS NOT NULL AND NEW.direction_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM plans_travail
            WHERE id = NEW.plan_travail_id
            AND direction_id = NEW.direction_id
        ) THEN
            RAISE EXCEPTION 'Incohérence: Le plan de travail % n''appartient pas à la direction %',
                NEW.plan_travail_id, NEW.direction_id;
        END IF;
    END IF;

    -- Si plan_travail_id est défini, hériter la direction
    IF NEW.plan_travail_id IS NOT NULL AND NEW.direction_id IS NULL THEN
        SELECT direction_id INTO NEW.direction_id
        FROM plans_travail WHERE id = NEW.plan_travail_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_activite_plan_coherence ON activites;
CREATE TRIGGER check_activite_plan_coherence
    BEFORE INSERT OR UPDATE ON activites
    FOR EACH ROW EXECUTE FUNCTION validate_activite_plan_coherence();

-- Fonction: Vérifier cohérence Action-Mission-OS
CREATE OR REPLACE FUNCTION validate_action_coherence()
RETURNS TRIGGER AS $$
BEGIN
    -- Si mission_id a un os_id, vérifier qu'il correspond à l'os_id de l'action
    IF NEW.mission_id IS NOT NULL AND NEW.os_id IS NOT NULL THEN
        DECLARE
            v_mission_os_id UUID;
        BEGIN
            SELECT os_id INTO v_mission_os_id FROM missions WHERE id = NEW.mission_id;

            IF v_mission_os_id IS NOT NULL AND v_mission_os_id != NEW.os_id THEN
                RAISE WARNING 'Attention: La mission % est rattachée à l''OS %, mais l''action est rattachée à l''OS %',
                    NEW.mission_id, v_mission_os_id, NEW.os_id;
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_action_coherence ON actions;
CREATE TRIGGER check_action_coherence
    BEFORE INSERT OR UPDATE ON actions
    FOR EACH ROW EXECUTE FUNCTION validate_action_coherence();

-- Fonction: Valider la cohérence hiérarchique complète
CREATE OR REPLACE FUNCTION validate_hierarchie_referentiels(
    p_activite_id UUID DEFAULT NULL,
    p_action_id UUID DEFAULT NULL,
    p_mission_id UUID DEFAULT NULL,
    p_os_id UUID DEFAULT NULL,
    p_direction_id UUID DEFAULT NULL,
    p_exercice_id UUID DEFAULT NULL
) RETURNS TABLE (
    niveau TEXT,
    entite_id UUID,
    code TEXT,
    parent_attendu UUID,
    parent_reel UUID,
    est_coherent BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Vérifier activité → action
    IF p_activite_id IS NOT NULL THEN
        RETURN QUERY
        SELECT
            'activite'::TEXT,
            a.id,
            a.code,
            p_action_id,
            a.action_id,
            (p_action_id IS NULL OR a.action_id = p_action_id),
            CASE
                WHEN p_action_id IS NOT NULL AND a.action_id != p_action_id
                THEN 'Activité rattachée à une action différente'
                ELSE 'OK'
            END
        FROM activites a WHERE a.id = p_activite_id;
    END IF;

    -- Vérifier action → OS/Mission
    IF p_action_id IS NOT NULL THEN
        RETURN QUERY
        SELECT
            'action'::TEXT,
            a.id,
            a.code,
            p_os_id,
            a.os_id,
            (p_os_id IS NULL OR a.os_id = p_os_id),
            CASE
                WHEN p_os_id IS NOT NULL AND a.os_id != p_os_id
                THEN 'Action rattachée à un OS différent'
                ELSE 'OK'
            END
        FROM actions a WHERE a.id = p_action_id;
    END IF;

    -- Vérifier direction-OS mapping
    IF p_direction_id IS NOT NULL AND p_os_id IS NOT NULL AND p_exercice_id IS NOT NULL THEN
        RETURN QUERY
        SELECT
            'direction_os'::TEXT,
            m.id,
            d.code || '-' || os.code,
            p_os_id,
            m.os_id,
            m.id IS NOT NULL,
            CASE
                WHEN m.id IS NULL
                THEN 'Direction non mappée à cet OS pour cet exercice'
                ELSE 'OK'
            END
        FROM directions d
        CROSS JOIN objectifs_strategiques os
        LEFT JOIN direction_os_mapping m ON m.direction_id = d.id AND m.os_id = os.id AND m.exercice_id = p_exercice_id
        WHERE d.id = p_direction_id AND os.id = p_os_id;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. VUE MATÉRIALISÉE POUR HIÉRARCHIE COMPLÈTE
-- ============================================

CREATE OR REPLACE VIEW v_hierarchie_referentiels AS
SELECT
    os.id AS os_id,
    os.code AS os_code,
    os.libelle AS os_libelle,
    m.id AS mission_id,
    m.code AS mission_code,
    m.libelle AS mission_libelle,
    a.id AS action_id,
    a.code AS action_code,
    a.libelle AS action_libelle,
    act.id AS activite_id,
    act.code AS activite_code,
    act.libelle AS activite_libelle,
    sa.id AS sous_activite_id,
    sa.code AS sous_activite_code,
    sa.libelle AS sous_activite_libelle,
    d.id AS direction_id,
    d.code AS direction_code,
    d.label AS direction_libelle,
    pt.id AS plan_travail_id,
    pt.code AS plan_travail_code,
    pt.libelle AS plan_travail_libelle,
    e.id AS exercice_id,
    e.annee AS exercice_annee
FROM objectifs_strategiques os
LEFT JOIN actions a ON a.os_id = os.id
LEFT JOIN missions m ON m.id = a.mission_id
LEFT JOIN activites act ON act.action_id = a.id
LEFT JOIN sous_activites sa ON sa.activite_id = act.id
LEFT JOIN directions d ON d.id = COALESCE(act.direction_id, a.direction_id, m.direction_id)
LEFT JOIN plans_travail pt ON pt.id = act.plan_travail_id
LEFT JOIN exercices_budgetaires e ON e.id = COALESCE(act.exercice_id, pt.exercice_id)
WHERE os.est_actif = true;

-- ============================================
-- 9. INDEX ADDITIONNELS POUR PERFORMANCE
-- ============================================

-- Index composites pour les listes filtrées
CREATE INDEX IF NOT EXISTS idx_actions_os_mission ON actions(os_id, mission_id) WHERE est_active = true;
CREATE INDEX IF NOT EXISTS idx_activites_action_direction ON activites(action_id, direction_id) WHERE est_active = true;
CREATE INDEX IF NOT EXISTS idx_sous_activites_activite_active ON sous_activites(activite_id) WHERE est_active = true;
CREATE INDEX IF NOT EXISTS idx_plans_travail_exercice_direction ON plans_travail(exercice_id, direction_id) WHERE est_actif = true;

-- Index pour exercice sur toutes les tables
CREATE INDEX IF NOT EXISTS idx_directions_est_active ON directions(est_active) WHERE est_active = true;
CREATE INDEX IF NOT EXISTS idx_objectifs_strategiques_actif ON objectifs_strategiques(est_actif) WHERE est_actif = true;
CREATE INDEX IF NOT EXISTS idx_missions_active ON missions(est_active) WHERE est_active = true;

-- ============================================
-- 10. FONCTION HELPER: Créer un import log
-- ============================================

CREATE OR REPLACE FUNCTION create_import_log(
    p_type_import TEXT,
    p_nom_fichier TEXT,
    p_format_fichier TEXT DEFAULT NULL,
    p_taille_fichier INTEGER DEFAULT NULL,
    p_exercice_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_import_id UUID;
BEGIN
    INSERT INTO import_logs (
        type_import,
        nom_fichier,
        format_fichier,
        taille_fichier,
        exercice_id,
        user_id,
        statut
    ) VALUES (
        p_type_import,
        p_nom_fichier,
        p_format_fichier,
        p_taille_fichier,
        p_exercice_id,
        auth.uid(),
        'en_cours'
    ) RETURNING id INTO v_import_id;

    RETURN v_import_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour finaliser un import log
CREATE OR REPLACE FUNCTION finalize_import_log(
    p_import_id UUID,
    p_nb_lignes_total INTEGER,
    p_nb_lignes_importees INTEGER,
    p_nb_lignes_erreur INTEGER DEFAULT 0,
    p_nb_lignes_ignorees INTEGER DEFAULT 0,
    p_erreurs JSONB DEFAULT '[]'::jsonb,
    p_warnings JSONB DEFAULT '[]'::jsonb,
    p_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE import_logs
    SET
        nb_lignes_total = p_nb_lignes_total,
        nb_lignes_importees = p_nb_lignes_importees,
        nb_lignes_erreur = p_nb_lignes_erreur,
        nb_lignes_ignorees = p_nb_lignes_ignorees,
        erreurs = p_erreurs,
        warnings = p_warnings,
        message = p_message,
        statut = CASE WHEN p_nb_lignes_erreur > 0 THEN 'erreur' ELSE 'termine' END,
        completed_at = now(),
        duration_ms = EXTRACT(EPOCH FROM (now() - started_at)) * 1000
    WHERE id = p_import_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. AUDIT LOG POUR LES MODIFICATIONS
-- ============================================

INSERT INTO audit_logs (entity_type, entity_id, action, new_values, exercice, created_at)
VALUES (
    'system',
    gen_random_uuid(),
    'MIGRATION',
    jsonb_build_object(
        'migration', '20260118400000_stabilize_referentiels',
        'description', 'Stabilisation des référentiels OS/Actions/Missions/Directions/Plans/Activités',
        'tables_created', jsonb_build_array('plans_travail', 'import_logs', 'direction_os_mapping'),
        'columns_added', jsonb_build_array(
            'activites.plan_travail_id', 'activites.direction_id', 'activites.exercice_id',
            'actions.direction_id', 'missions.direction_id', 'missions.os_id'
        ),
        'functions_created', jsonb_build_array(
            'validate_activite_plan_coherence', 'validate_action_coherence',
            'validate_hierarchie_referentiels', 'create_import_log', 'finalize_import_log'
        )
    ),
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    NOW()
);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
