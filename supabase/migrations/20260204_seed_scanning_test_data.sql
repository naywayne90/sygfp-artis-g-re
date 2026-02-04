-- ============================================
-- SEED: Données de test pour Scanning
-- Date: 2026-02-04
--
-- Ce script crée des engagements et liquidations
-- avec les statuts appropriés pour tester le scanning
-- ============================================

-- Variables
DO $$
DECLARE
    v_budget_line_id UUID;
    v_engagement_id_1 UUID;
    v_engagement_id_2 UUID;
    v_engagement_id_3 UUID;
    v_liquidation_id_1 UUID;
    v_liquidation_id_2 UUID;
    v_user_id UUID;
BEGIN
    -- Récupérer une ligne budgétaire existante
    SELECT id INTO v_budget_line_id
    FROM budget_lines
    LIMIT 1;

    -- Récupérer un utilisateur existant
    SELECT id INTO v_user_id
    FROM profiles
    WHERE email = 'agent.dsi@arti.ci'
    LIMIT 1;

    -- Si pas de budget line, on en crée une minimale
    IF v_budget_line_id IS NULL THEN
        RAISE NOTICE 'Aucune ligne budgétaire trouvée, création impossible';
        RETURN;
    END IF;

    -- ============================================
    -- ENGAGEMENTS DE TEST (statut brouillon)
    -- ============================================

    -- Engagement 1: Brouillon - Documents incomplets
    INSERT INTO budget_engagements (
        id, budget_line_id, numero, objet, montant,
        date_engagement, fournisseur, statut,
        exercice, created_by, workflow_status
    ) VALUES (
        gen_random_uuid(),
        v_budget_line_id,
        'ENG-SCAN-TEST-001',
        'Achat de matériel informatique - TEST SCANNING',
        2500000,
        CURRENT_DATE,
        'TECH SOLUTIONS GABON',
        'brouillon',
        2026,
        v_user_id,
        'pending'
    ) RETURNING id INTO v_engagement_id_1;

    -- Engagement 2: Brouillon - Documents complets
    INSERT INTO budget_engagements (
        id, budget_line_id, numero, objet, montant,
        date_engagement, fournisseur, statut,
        exercice, created_by, workflow_status
    ) VALUES (
        gen_random_uuid(),
        v_budget_line_id,
        'ENG-SCAN-TEST-002',
        'Fournitures de bureau - TEST SCANNING',
        850000,
        CURRENT_DATE,
        'PAPETERIE CENTRALE',
        'brouillon',
        2026,
        v_user_id,
        'pending'
    ) RETURNING id INTO v_engagement_id_2;

    -- Engagement 3: Soumis - En attente de validation
    INSERT INTO budget_engagements (
        id, budget_line_id, numero, objet, montant,
        date_engagement, fournisseur, statut,
        exercice, created_by, workflow_status
    ) VALUES (
        gen_random_uuid(),
        v_budget_line_id,
        'ENG-SCAN-TEST-003',
        'Services de maintenance - TEST SCANNING',
        1200000,
        CURRENT_DATE - INTERVAL '2 days',
        'MAINTENANCE PRO',
        'soumis',
        2026,
        v_user_id,
        'pending'
    ) RETURNING id INTO v_engagement_id_3;

    -- ============================================
    -- DOCUMENTS ENGAGEMENT (Checklist)
    -- ============================================

    -- Documents pour Engagement 1 (incomplets - 0/4 fournis)
    INSERT INTO engagement_documents (engagement_id, type_document, libelle, est_obligatoire, est_fourni)
    VALUES
        (v_engagement_id_1, 'marche', 'Contrat/Marché signé', true, false),
        (v_engagement_id_1, 'bon_commande', 'Bon de commande', true, false),
        (v_engagement_id_1, 'devis', 'Devis/Proforma', true, false),
        (v_engagement_id_1, 'justificatif', 'Justificatif de la dépense', true, false),
        (v_engagement_id_1, 'autre', 'Document complémentaire', false, false);

    -- Documents pour Engagement 2 (complets - 4/4 fournis)
    INSERT INTO engagement_documents (engagement_id, type_document, libelle, est_obligatoire, est_fourni, file_name)
    VALUES
        (v_engagement_id_2, 'marche', 'Contrat/Marché signé', true, true, 'contrat_papeterie.pdf'),
        (v_engagement_id_2, 'bon_commande', 'Bon de commande', true, true, 'bc_001.pdf'),
        (v_engagement_id_2, 'devis', 'Devis/Proforma', true, true, 'devis_papeterie.pdf'),
        (v_engagement_id_2, 'justificatif', 'Justificatif de la dépense', true, true, 'justif_001.pdf');

    -- Documents pour Engagement 3 (partiellement complets - 2/4 fournis)
    INSERT INTO engagement_documents (engagement_id, type_document, libelle, est_obligatoire, est_fourni, file_name)
    VALUES
        (v_engagement_id_3, 'marche', 'Contrat/Marché signé', true, true, 'contrat_maintenance.pdf'),
        (v_engagement_id_3, 'bon_commande', 'Bon de commande', true, false, NULL),
        (v_engagement_id_3, 'devis', 'Devis/Proforma', true, true, 'devis_maintenance.pdf'),
        (v_engagement_id_3, 'justificatif', 'Justificatif de la dépense', true, false, NULL);

    -- ============================================
    -- LIQUIDATIONS DE TEST
    -- ============================================

    -- D'abord, mettre un engagement existant en "valide" pour pouvoir créer des liquidations
    -- (Règle: pas de liquidation sans engagement validé)

    -- Liquidation 1: Brouillon - Documents incomplets (liée à engagement validé existant)
    -- On utilise l'engagement ENG-TEST qui est déjà validé
    INSERT INTO budget_liquidations (
        id, engagement_id, numero, montant, net_a_payer,
        date_liquidation, reference_facture, service_fait,
        statut, exercice
    )
    SELECT
        gen_random_uuid(),
        id,
        'LIQ-SCAN-TEST-001',
        80000000,
        78500000,
        CURRENT_DATE,
        'FACT-2026-001',
        true,
        'brouillon',
        2026
    FROM budget_engagements
    WHERE statut = 'valide'
    LIMIT 1
    RETURNING id INTO v_liquidation_id_1;

    -- Liquidation 2: Soumis
    INSERT INTO budget_liquidations (
        id, engagement_id, numero, montant, net_a_payer,
        date_liquidation, reference_facture, service_fait,
        statut, exercice
    )
    SELECT
        gen_random_uuid(),
        id,
        'LIQ-SCAN-TEST-002',
        15000000,
        14800000,
        CURRENT_DATE - INTERVAL '1 day',
        'FACT-2026-002',
        true,
        'soumis',
        2026
    FROM budget_engagements
    WHERE statut = 'valide'
    LIMIT 1
    RETURNING id INTO v_liquidation_id_2;

    -- ============================================
    -- DOCUMENTS LIQUIDATION (si la table existe)
    -- ============================================

    -- Vérifier si la table liquidation_documents existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'liquidation_documents') THEN
        -- Documents pour Liquidation 1 (incomplets)
        IF v_liquidation_id_1 IS NOT NULL THEN
            INSERT INTO liquidation_documents (liquidation_id, type_document, libelle, is_required, is_provided)
            VALUES
                (v_liquidation_id_1, 'facture', 'Facture définitive', true, false),
                (v_liquidation_id_1, 'pv_reception', 'PV de réception', true, false),
                (v_liquidation_id_1, 'attestation_service_fait', 'Attestation service fait', true, true),
                (v_liquidation_id_1, 'bordereau', 'Bordereau de livraison', false, false);
        END IF;

        -- Documents pour Liquidation 2 (complets)
        IF v_liquidation_id_2 IS NOT NULL THEN
            INSERT INTO liquidation_documents (liquidation_id, type_document, libelle, is_required, is_provided, file_name)
            VALUES
                (v_liquidation_id_2, 'facture', 'Facture définitive', true, true, 'facture_002.pdf'),
                (v_liquidation_id_2, 'pv_reception', 'PV de réception', true, true, 'pv_reception_002.pdf'),
                (v_liquidation_id_2, 'attestation_service_fait', 'Attestation service fait', true, true, 'asf_002.pdf');
        END IF;
    END IF;

    RAISE NOTICE '✅ Données de test pour Scanning créées avec succès!';
    RAISE NOTICE '   - 3 Engagements (2 brouillon, 1 soumis)';
    RAISE NOTICE '   - 2 Liquidations (1 brouillon, 1 soumis)';

END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Afficher les engagements de test
SELECT
    numero,
    objet,
    fournisseur,
    montant,
    statut,
    (SELECT COUNT(*) FROM engagement_documents ed WHERE ed.engagement_id = be.id) as total_docs,
    (SELECT COUNT(*) FROM engagement_documents ed WHERE ed.engagement_id = be.id AND ed.est_fourni = true) as docs_fournis
FROM budget_engagements be
WHERE numero LIKE 'ENG-SCAN-TEST%'
ORDER BY numero;

-- Afficher les liquidations de test
SELECT
    numero,
    montant,
    net_a_payer,
    reference_facture,
    statut
FROM budget_liquidations
WHERE numero LIKE 'LIQ-SCAN-TEST%'
ORDER BY numero;
