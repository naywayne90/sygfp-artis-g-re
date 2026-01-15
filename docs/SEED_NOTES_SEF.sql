-- =====================================================
-- SEED DATA : Notes SEF de démonstration
-- À exécuter manuellement dans le SQL Editor Supabase
-- =====================================================

-- IMPORTANT: Remplacer les UUIDs par vos vraies données !

DO $$
DECLARE
  v_exercice INT := 2026;
  v_direction_dg UUID;
  v_direction_dsi UUID;
  v_direction_daaf UUID;
  v_user_agent UUID;
  v_user_chef UUID;
  v_user_dg UUID;
  v_note_id UUID;
BEGIN
  -- =====================================================
  -- 1. Récupérer les directions existantes
  -- =====================================================
  SELECT id INTO v_direction_dg FROM directions WHERE label ILIKE '%direction générale%' LIMIT 1;
  SELECT id INTO v_direction_dsi FROM directions WHERE label ILIKE '%systèmes d''information%' LIMIT 1;
  SELECT id INTO v_direction_daaf FROM directions WHERE label ILIKE '%statistiques%' LIMIT 1;
  
  -- Si pas de directions, utiliser la première disponible
  IF v_direction_dg IS NULL THEN
    SELECT id INTO v_direction_dg FROM directions WHERE est_active = true LIMIT 1;
  END IF;
  IF v_direction_dsi IS NULL THEN
    v_direction_dsi := v_direction_dg;
  END IF;
  IF v_direction_daaf IS NULL THEN
    v_direction_daaf := v_direction_dg;
  END IF;
  
  -- =====================================================
  -- 2. Récupérer un utilisateur existant
  -- =====================================================
  SELECT id INTO v_user_agent FROM profiles WHERE is_active = true LIMIT 1;
  v_user_chef := v_user_agent;
  v_user_dg := v_user_agent;
  
  IF v_user_agent IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur actif trouvé. Créez d''abord des utilisateurs.';
  END IF;
  
  RAISE NOTICE 'Utilisation: direction=%, user=%', v_direction_dg, v_user_agent;
  
  -- =====================================================
  -- 3. Créer 10 notes SEF avec différents statuts
  -- =====================================================
  
  -- Note 1: Brouillon
  INSERT INTO notes_sef (
    exercice, objet, direction_id, demandeur_id, created_by,
    urgence, justification, date_souhaitee, statut
  ) VALUES (
    v_exercice, 
    'Acquisition de fournitures de bureau', 
    v_direction_dg, v_user_agent, v_user_agent,
    'normale',
    'Besoin urgent pour le fonctionnement des services',
    CURRENT_DATE + 15,
    'brouillon'
  );
  
  -- Note 2: Brouillon urgent
  INSERT INTO notes_sef (
    exercice, objet, direction_id, demandeur_id, created_by,
    urgence, justification, date_souhaitee, statut, description
  ) VALUES (
    v_exercice, 
    'Réparation climatisation salle serveur', 
    v_direction_dsi, v_user_agent, v_user_agent,
    'très_urgent',
    'Risque de surchauffe des équipements',
    CURRENT_DATE + 3,
    'brouillon',
    'La climatisation de la salle serveur est en panne depuis ce matin.'
  );
  
  -- Note 3: Soumis (en attente validation)
  INSERT INTO notes_sef (
    exercice, objet, direction_id, demandeur_id, created_by,
    urgence, justification, date_souhaitee, statut,
    submitted_at, submitted_by
  ) VALUES (
    v_exercice, 
    'Organisation atelier de formation', 
    v_direction_dg, v_user_chef, v_user_chef,
    'normale',
    'Renforcement des capacités du personnel',
    CURRENT_DATE + 30,
    'soumis',
    NOW() - INTERVAL '2 days', v_user_chef
  );
  
  -- Note 4: Soumis urgent
  INSERT INTO notes_sef (
    exercice, objet, direction_id, demandeur_id, created_by,
    urgence, justification, date_souhaitee, statut,
    submitted_at, submitted_by
  ) VALUES (
    v_exercice, 
    'Déplacement mission Abidjan', 
    v_direction_daaf, v_user_agent, v_user_agent,
    'urgent',
    'Participation au séminaire régional',
    CURRENT_DATE + 7,
    'soumis',
    NOW() - INTERVAL '1 day', v_user_agent
  );
  
  -- Note 5: Validée
  INSERT INTO notes_sef (
    exercice, objet, direction_id, demandeur_id, created_by,
    urgence, justification, date_souhaitee, statut,
    submitted_at, submitted_by,
    validated_at, validated_by
  ) VALUES (
    v_exercice, 
    'Achat consommables imprimantes', 
    v_direction_dg, v_user_agent, v_user_agent,
    'normale',
    'Stock épuisé - besoin immédiat',
    CURRENT_DATE + 10,
    'valide',
    NOW() - INTERVAL '5 days', v_user_agent,
    NOW() - INTERVAL '3 days', v_user_dg
  ) RETURNING id INTO v_note_id;
  
  -- Note 6: Validée avec dossier
  INSERT INTO notes_sef (
    exercice, objet, direction_id, demandeur_id, created_by,
    urgence, justification, date_souhaitee, statut,
    submitted_at, submitted_by,
    validated_at, validated_by
  ) VALUES (
    v_exercice, 
    'Maintenance préventive véhicules', 
    v_direction_daaf, v_user_chef, v_user_chef,
    'normale',
    'Entretien programmé du parc automobile',
    CURRENT_DATE + 20,
    'valide',
    NOW() - INTERVAL '7 days', v_user_chef,
    NOW() - INTERVAL '5 days', v_user_dg
  );
  
  -- Note 7: Rejetée
  INSERT INTO notes_sef (
    exercice, objet, direction_id, demandeur_id, created_by,
    urgence, justification, date_souhaitee, statut,
    submitted_at, submitted_by,
    rejected_at, rejected_by, rejection_reason
  ) VALUES (
    v_exercice, 
    'Achat téléphone portable haut de gamme', 
    v_direction_dsi, v_user_agent, v_user_agent,
    'normale',
    'Remplacement téléphone de service',
    CURRENT_DATE + 15,
    'rejete',
    NOW() - INTERVAL '4 days', v_user_agent,
    NOW() - INTERVAL '2 days', v_user_dg,
    'Budget insuffisant. Merci de proposer un modèle moins coûteux ou attendre le prochain exercice.'
  );
  
  -- Note 8: Rejetée (justification insuffisante)
  INSERT INTO notes_sef (
    exercice, objet, direction_id, demandeur_id, created_by,
    urgence, justification, date_souhaitee, statut,
    submitted_at, submitted_by,
    rejected_at, rejected_by, rejection_reason
  ) VALUES (
    v_exercice, 
    'Mission exploratoire Paris', 
    v_direction_dg, v_user_agent, v_user_agent,
    'normale',
    'Benchmark',
    CURRENT_DATE + 30,
    'rejete',
    NOW() - INTERVAL '3 days', v_user_agent,
    NOW() - INTERVAL '1 day', v_user_dg,
    'Justification insuffisante. Merci de détailler les objectifs et livrables attendus.'
  );
  
  -- Note 9: Différée
  INSERT INTO notes_sef (
    exercice, objet, direction_id, demandeur_id, created_by,
    urgence, justification, date_souhaitee, statut,
    submitted_at, submitted_by,
    differe_at, differe_by, differe_motif, differe_condition, differe_date_reprise
  ) VALUES (
    v_exercice, 
    'Acquisition licences logicielles', 
    v_direction_dsi, v_user_chef, v_user_chef,
    'normale',
    'Renouvellement licences Microsoft',
    CURRENT_DATE + 45,
    'differe',
    NOW() - INTERVAL '6 days', v_user_chef,
    NOW() - INTERVAL '4 days', v_user_dg,
    'En attente de la validation du budget 2026',
    'Vote du budget par le conseil d''administration',
    CURRENT_DATE + 30
  );
  
  -- Note 10: Différée (en attente financement)
  INSERT INTO notes_sef (
    exercice, objet, direction_id, demandeur_id, created_by,
    urgence, justification, date_souhaitee, statut,
    submitted_at, submitted_by,
    differe_at, differe_by, differe_motif, differe_condition, differe_date_reprise
  ) VALUES (
    v_exercice, 
    'Rénovation salle de conférence', 
    v_direction_daaf, v_user_agent, v_user_agent,
    'normale',
    'Modernisation des équipements audiovisuels',
    CURRENT_DATE + 60,
    'differe',
    NOW() - INTERVAL '8 days', v_user_agent,
    NOW() - INTERVAL '6 days', v_user_dg,
    'Financement non disponible pour cet exercice',
    'Déblocage du financement complémentaire',
    CURRENT_DATE + 45
  );
  
  -- =====================================================
  -- 4. Créer des entrées d'historique pour les notes soumises/validées/rejetées
  -- =====================================================
  
  INSERT INTO notes_sef_history (note_id, action, old_statut, new_statut, performed_by, commentaire)
  SELECT 
    id, 'creation', NULL, 'brouillon', created_by, 'Note créée'
  FROM notes_sef 
  WHERE exercice = v_exercice;
  
  INSERT INTO notes_sef_history (note_id, action, old_statut, new_statut, performed_by, commentaire)
  SELECT 
    id, 'soumission', 'brouillon', 'soumis', submitted_by, 'Note soumise pour validation'
  FROM notes_sef 
  WHERE exercice = v_exercice AND submitted_at IS NOT NULL;
  
  INSERT INTO notes_sef_history (note_id, action, old_statut, new_statut, performed_by, commentaire)
  SELECT 
    id, 'validation', 'soumis', 'valide', validated_by, 'Note validée par DG'
  FROM notes_sef 
  WHERE exercice = v_exercice AND statut = 'valide';
  
  INSERT INTO notes_sef_history (note_id, action, old_statut, new_statut, performed_by, commentaire)
  SELECT 
    id, 'rejet', 'soumis', 'rejete', rejected_by, rejection_reason
  FROM notes_sef 
  WHERE exercice = v_exercice AND statut = 'rejete';
  
  INSERT INTO notes_sef_history (note_id, action, old_statut, new_statut, performed_by, commentaire)
  SELECT 
    id, 'differe', 'soumis', 'differe', differe_by, differe_motif
  FROM notes_sef 
  WHERE exercice = v_exercice AND statut = 'differe';
  
  RAISE NOTICE 'Seed terminé: 10 notes SEF créées pour exercice %', v_exercice;
  
END $$;

-- Vérification
SELECT 
  statut,
  COUNT(*) as nombre,
  ARRAY_AGG(reference_pivot ORDER BY reference_pivot) as references
FROM notes_sef 
WHERE exercice = 2026
GROUP BY statut
ORDER BY statut;
