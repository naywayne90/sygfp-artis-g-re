-- ============================================
-- SEED DE DÉMO POUR SYGFP - PROMPT 25/25
-- ============================================
-- IMPORTANT: Ce script est ADDITIF UNIQUEMENT
-- Il ne supprime AUCUNE donnée existante
-- Utilise INSERT ... WHERE NOT EXISTS pour éviter les doublons
-- ============================================

-- 1. EXERCICE DE DÉMO 2026
-- ============================================
INSERT INTO exercices_budgetaires (annee, libelle, statut, date_debut, date_fin, created_at)
SELECT 2026, 'Exercice 2026 - Démo', 'ouvert', '2026-01-01', '2026-12-31', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM exercices_budgetaires WHERE annee = 2026
);

-- 2. DONNÉES DE RÉFÉRENCE (si manquantes)
-- ============================================

-- Sources de financement de démo
INSERT INTO sources_financement (code, libelle, type, active, created_at)
SELECT 'BN', 'Budget National', 'interne', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sources_financement WHERE code = 'BN');

INSERT INTO sources_financement (code, libelle, type, active, created_at)
SELECT 'PTF', 'Partenaires Techniques et Financiers', 'externe', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sources_financement WHERE code = 'PTF');

-- Tiers de démo (bénéficiaires)
INSERT INTO tiers (code, raison_sociale, type_tiers, statut, created_at)
SELECT 'DEMO-001', 'Fournisseur Démo SA', 'fournisseur', 'actif', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tiers WHERE code = 'DEMO-001');

INSERT INTO tiers (code, raison_sociale, type_tiers, statut, created_at)
SELECT 'DEMO-002', 'Prestataire Démo SARL', 'prestataire', 'actif', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tiers WHERE code = 'DEMO-002');

-- 3. LIGNE BUDGÉTAIRE DE DÉMO
-- ============================================
-- Crée une ligne budgétaire avec dotation suffisante pour les tests
DO $$
DECLARE
    v_exercice_id UUID;
    v_direction_id UUID;
    v_source_id UUID;
BEGIN
    -- Get exercice 2026
    SELECT id INTO v_exercice_id FROM exercices_budgetaires WHERE annee = 2026 LIMIT 1;

    -- Get first direction
    SELECT id INTO v_direction_id FROM directions LIMIT 1;

    -- Get source financement
    SELECT id INTO v_source_id FROM sources_financement WHERE code = 'BN' LIMIT 1;

    IF v_exercice_id IS NOT NULL AND v_direction_id IS NOT NULL THEN
        -- Insert ligne budget if not exists
        INSERT INTO lignes_budget (
            code,
            libelle,
            exercice_id,
            direction_id,
            source_financement_id,
            dotation_initiale,
            dotation_actuelle,
            engage,
            liquide,
            ordonnance,
            paye,
            created_at
        )
        SELECT
            'DEMO-2026-001',
            'Ligne budgétaire de démonstration',
            v_exercice_id,
            v_direction_id,
            v_source_id,
            100000000, -- 100 millions pour tests
            100000000,
            0,
            0,
            0,
            0,
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM lignes_budget WHERE code = 'DEMO-2026-001'
        );
    END IF;
END $$;

-- 4. DOSSIER DE DÉMO #1 - DRAFT SEF
-- ============================================
-- Note SEF en brouillon (début de workflow)
DO $$
DECLARE
    v_exercice_id UUID;
    v_user_id UUID;
    v_note_sef_id UUID;
BEGIN
    SELECT id INTO v_exercice_id FROM exercices_budgetaires WHERE annee = 2026 LIMIT 1;
    SELECT id INTO v_user_id FROM profiles LIMIT 1;

    IF v_exercice_id IS NOT NULL THEN
        -- Create Note SEF draft
        INSERT INTO notes_sef (
            reference,
            exercice_id,
            objet,
            montant_total,
            statut,
            created_by,
            created_at
        )
        SELECT
            'DEMO-SEF-001',
            v_exercice_id,
            '[DÉMO] Note SEF en brouillon - Achat fournitures bureau',
            5000000,
            'brouillon',
            v_user_id,
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM notes_sef WHERE reference = 'DEMO-SEF-001'
        )
        RETURNING id INTO v_note_sef_id;

        -- Log audit
        IF v_note_sef_id IS NOT NULL THEN
            INSERT INTO audit_logs (
                entity_type,
                entity_id,
                action,
                user_id,
                new_values,
                exercice,
                created_at
            ) VALUES (
                'note_sef',
                v_note_sef_id,
                'CREATE',
                v_user_id,
                jsonb_build_object(
                    'reference', 'DEMO-SEF-001',
                    'statut', 'brouillon',
                    '_demo_seed', true
                ),
                2026,
                NOW()
            );
        END IF;
    END IF;
END $$;

-- 5. DOSSIER DE DÉMO #2 - AEF VALIDÉE
-- ============================================
-- Workflow avancé: SEF validée → AEF validée (prêt pour imputation)
DO $$
DECLARE
    v_exercice_id UUID;
    v_direction_id UUID;
    v_user_id UUID;
    v_note_sef_id UUID;
    v_note_aef_id UUID;
BEGIN
    SELECT id INTO v_exercice_id FROM exercices_budgetaires WHERE annee = 2026 LIMIT 1;
    SELECT id INTO v_direction_id FROM directions LIMIT 1;
    SELECT id INTO v_user_id FROM profiles LIMIT 1;

    IF v_exercice_id IS NOT NULL AND v_direction_id IS NOT NULL THEN
        -- Create Note SEF validée
        INSERT INTO notes_sef (
            reference,
            exercice_id,
            objet,
            montant_total,
            statut,
            date_validation,
            validated_by,
            created_by,
            created_at
        )
        SELECT
            'DEMO-SEF-002',
            v_exercice_id,
            '[DÉMO] Note SEF validée - Acquisition matériel informatique',
            25000000,
            'valide',
            NOW(),
            v_user_id,
            v_user_id,
            NOW() - INTERVAL '2 days'
        WHERE NOT EXISTS (
            SELECT 1 FROM notes_sef WHERE reference = 'DEMO-SEF-002'
        )
        RETURNING id INTO v_note_sef_id;

        -- Create Note AEF validée
        IF v_note_sef_id IS NOT NULL THEN
            INSERT INTO notes_aef (
                reference,
                exercice_id,
                note_sef_id,
                direction_id,
                objet,
                montant_demande,
                statut,
                date_validation,
                validated_by,
                created_by,
                created_at
            )
            SELECT
                'DEMO-AEF-002',
                v_exercice_id,
                v_note_sef_id,
                v_direction_id,
                '[DÉMO] Note AEF validée - Acquisition matériel informatique',
                25000000,
                'valide',
                NOW(),
                v_user_id,
                v_user_id,
                NOW() - INTERVAL '1 day'
            WHERE NOT EXISTS (
                SELECT 1 FROM notes_aef WHERE reference = 'DEMO-AEF-002'
            )
            RETURNING id INTO v_note_aef_id;

            -- Log audits
            IF v_note_aef_id IS NOT NULL THEN
                INSERT INTO audit_logs (entity_type, entity_id, action, user_id, new_values, exercice, created_at)
                VALUES
                    ('note_sef', v_note_sef_id, 'VALIDATE', v_user_id,
                     jsonb_build_object('reference', 'DEMO-SEF-002', 'statut', 'valide', '_demo_seed', true),
                     2026, NOW() - INTERVAL '2 days'),
                    ('note_aef', v_note_aef_id, 'VALIDATE', v_user_id,
                     jsonb_build_object('reference', 'DEMO-AEF-002', 'statut', 'valide', '_demo_seed', true),
                     2026, NOW() - INTERVAL '1 day');
            END IF;
        END IF;
    END IF;
END $$;

-- 6. DOSSIER DE DÉMO #3 - COMPLET JUSQU'AU RÈGLEMENT
-- ============================================
-- Workflow complet: SEF → AEF → Imputation → Engagement → Liquidation → Ordonnancement → Règlement
DO $$
DECLARE
    v_exercice_id UUID;
    v_direction_id UUID;
    v_user_id UUID;
    v_ligne_budget_id UUID;
    v_tiers_id UUID;
    v_source_id UUID;
    v_note_sef_id UUID;
    v_note_aef_id UUID;
    v_imputation_id UUID;
    v_engagement_id UUID;
    v_liquidation_id UUID;
    v_ordonnancement_id UUID;
    v_reglement_id UUID;
BEGIN
    SELECT id INTO v_exercice_id FROM exercices_budgetaires WHERE annee = 2026 LIMIT 1;
    SELECT id INTO v_direction_id FROM directions LIMIT 1;
    SELECT id INTO v_user_id FROM profiles LIMIT 1;
    SELECT id INTO v_ligne_budget_id FROM lignes_budget WHERE code = 'DEMO-2026-001' LIMIT 1;
    SELECT id INTO v_tiers_id FROM tiers WHERE code = 'DEMO-001' LIMIT 1;
    SELECT id INTO v_source_id FROM sources_financement WHERE code = 'BN' LIMIT 1;

    IF v_exercice_id IS NOT NULL AND v_direction_id IS NOT NULL THEN
        -- 1. Create Note SEF
        INSERT INTO notes_sef (reference, exercice_id, objet, montant_total, statut, date_validation, validated_by, created_by, created_at)
        SELECT 'DEMO-SEF-003', v_exercice_id, '[DÉMO] Note SEF complète - Travaux rénovation', 50000000, 'valide', NOW() - INTERVAL '10 days', v_user_id, v_user_id, NOW() - INTERVAL '12 days'
        WHERE NOT EXISTS (SELECT 1 FROM notes_sef WHERE reference = 'DEMO-SEF-003')
        RETURNING id INTO v_note_sef_id;

        IF v_note_sef_id IS NULL THEN
            SELECT id INTO v_note_sef_id FROM notes_sef WHERE reference = 'DEMO-SEF-003';
        END IF;

        -- 2. Create Note AEF
        IF v_note_sef_id IS NOT NULL THEN
            INSERT INTO notes_aef (reference, exercice_id, note_sef_id, direction_id, objet, montant_demande, statut, date_validation, validated_by, created_by, created_at)
            SELECT 'DEMO-AEF-003', v_exercice_id, v_note_sef_id, v_direction_id, '[DÉMO] Note AEF complète - Travaux rénovation', 50000000, 'valide', NOW() - INTERVAL '8 days', v_user_id, v_user_id, NOW() - INTERVAL '9 days'
            WHERE NOT EXISTS (SELECT 1 FROM notes_aef WHERE reference = 'DEMO-AEF-003')
            RETURNING id INTO v_note_aef_id;

            IF v_note_aef_id IS NULL THEN
                SELECT id INTO v_note_aef_id FROM notes_aef WHERE reference = 'DEMO-AEF-003';
            END IF;
        END IF;

        -- 3. Create Imputation
        IF v_note_aef_id IS NOT NULL AND v_ligne_budget_id IS NOT NULL THEN
            INSERT INTO imputations (note_aef_id, ligne_budget_id, exercice_id, montant, statut, created_at)
            SELECT v_note_aef_id, v_ligne_budget_id, v_exercice_id, 50000000, 'valide', NOW() - INTERVAL '7 days'
            WHERE NOT EXISTS (SELECT 1 FROM imputations WHERE note_aef_id = v_note_aef_id)
            RETURNING id INTO v_imputation_id;
        END IF;

        -- 4. Create Engagement
        IF v_note_aef_id IS NOT NULL AND v_tiers_id IS NOT NULL THEN
            INSERT INTO engagements (reference, note_aef_id, exercice_id, tiers_id, source_financement_id, montant, objet, date_engagement, statut, created_at)
            SELECT 'DEMO-ENG-003', v_note_aef_id, v_exercice_id, v_tiers_id, v_source_id, 50000000, '[DÉMO] Engagement complet - Travaux rénovation', (NOW() - INTERVAL '6 days')::date, 'valide', NOW() - INTERVAL '6 days'
            WHERE NOT EXISTS (SELECT 1 FROM engagements WHERE reference = 'DEMO-ENG-003')
            RETURNING id INTO v_engagement_id;

            IF v_engagement_id IS NULL THEN
                SELECT id INTO v_engagement_id FROM engagements WHERE reference = 'DEMO-ENG-003';
            END IF;
        END IF;

        -- 5. Create Liquidation
        IF v_engagement_id IS NOT NULL THEN
            INSERT INTO liquidations (reference, engagement_id, exercice_id, montant, date_liquidation, motif, statut, created_at)
            SELECT 'DEMO-LIQ-003', v_engagement_id, v_exercice_id, 50000000, (NOW() - INTERVAL '4 days')::date, '[DÉMO] Liquidation complète - Travaux rénovation', 'valide', NOW() - INTERVAL '4 days'
            WHERE NOT EXISTS (SELECT 1 FROM liquidations WHERE reference = 'DEMO-LIQ-003')
            RETURNING id INTO v_liquidation_id;

            IF v_liquidation_id IS NULL THEN
                SELECT id INTO v_liquidation_id FROM liquidations WHERE reference = 'DEMO-LIQ-003';
            END IF;
        END IF;

        -- 6. Create Ordonnancement
        IF v_liquidation_id IS NOT NULL THEN
            INSERT INTO ordonnancements (reference, liquidation_id, exercice_id, montant, date_ordonnancement, statut, created_at)
            SELECT 'DEMO-ORD-003', v_liquidation_id, v_exercice_id, 50000000, (NOW() - INTERVAL '2 days')::date, 'signe', NOW() - INTERVAL '2 days'
            WHERE NOT EXISTS (SELECT 1 FROM ordonnancements WHERE reference = 'DEMO-ORD-003')
            RETURNING id INTO v_ordonnancement_id;

            IF v_ordonnancement_id IS NULL THEN
                SELECT id INTO v_ordonnancement_id FROM ordonnancements WHERE reference = 'DEMO-ORD-003';
            END IF;
        END IF;

        -- 7. Create Règlement
        IF v_ordonnancement_id IS NOT NULL THEN
            INSERT INTO reglements (reference, ordonnancement_id, exercice_id, montant, date_reglement, mode_paiement, statut, created_at)
            SELECT 'DEMO-REG-003', v_ordonnancement_id, v_exercice_id, 50000000, NOW()::date, 'virement', 'execute', NOW()
            WHERE NOT EXISTS (SELECT 1 FROM reglements WHERE reference = 'DEMO-REG-003')
            RETURNING id INTO v_reglement_id;
        END IF;

        -- Log complete workflow in audit
        INSERT INTO audit_logs (entity_type, entity_id, action, user_id, new_values, exercice, created_at)
        SELECT 'dossier_demo', gen_random_uuid(), 'CREATE', v_user_id,
               jsonb_build_object(
                   'type', 'DEMO_COMPLETE_WORKFLOW',
                   'note_sef', 'DEMO-SEF-003',
                   'note_aef', 'DEMO-AEF-003',
                   'engagement', 'DEMO-ENG-003',
                   'liquidation', 'DEMO-LIQ-003',
                   'ordonnancement', 'DEMO-ORD-003',
                   'reglement', 'DEMO-REG-003',
                   '_demo_seed', true
               ),
               2026, NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM audit_logs
            WHERE new_values->>'type' = 'DEMO_COMPLETE_WORKFLOW'
        );
    END IF;
END $$;

-- 7. COMPTEUR ARTI (pour références pivot)
-- ============================================
INSERT INTO arti_reference_counters (prefix, exercice, current_value, created_at)
SELECT 'ARTI', 2026, 3, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM arti_reference_counters WHERE prefix = 'ARTI' AND exercice = 2026
);

-- 8. LOG FINAL DU SEED
-- ============================================
INSERT INTO audit_logs (entity_type, entity_id, action, new_values, exercice, created_at)
VALUES (
    'system',
    gen_random_uuid(),
    'SEED_DEMO',
    jsonb_build_object(
        'version', '1.0.0',
        'date', NOW(),
        'description', 'Seed de démo SYGFP - Prompt 25/25',
        'dossiers_crees', jsonb_build_array(
            'DEMO-SEF-001 (brouillon)',
            'DEMO-SEF-002 + DEMO-AEF-002 (validés)',
            'DEMO-SEF-003 → DEMO-REG-003 (workflow complet)'
        )
    ),
    2026,
    NOW()
);

-- ============================================
-- FIN DU SEED DE DÉMO
-- ============================================
