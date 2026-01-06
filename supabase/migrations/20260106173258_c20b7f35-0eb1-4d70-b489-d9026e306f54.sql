-- Add standard roles if not exist
INSERT INTO custom_roles (code, label, description, is_system, is_active, color) VALUES
('ADMIN', 'Administrateur', 'Accès complet au système', true, true, '#ef4444'),
('DG', 'Directeur Général', 'Validation finale et signatures', true, true, '#8b5cf6'),
('DAAF', 'Dir. Admin & Financier', 'Gestion budgétaire et financière', true, true, '#3b82f6'),
('APPRO', 'Approvisionnement', 'Gestion des achats et stocks', true, true, '#10b981'),
('TRESORERIE', 'Trésorerie', 'Gestion des paiements', true, true, '#f59e0b'),
('LECTEUR', 'Lecteur', 'Consultation uniquement', true, true, '#6b7280'),
('OPERATEUR', 'Opérateur', 'Saisie et suivi', true, true, '#06b6d4')
ON CONFLICT (code) DO NOTHING;

-- Add more permission actions
INSERT INTO permission_actions (code, label, category, is_active) VALUES
('budget_voir', 'Consulter le budget', 'Budget', true),
('budget_creer', 'Créer une ligne', 'Budget', true),
('budget_modifier', 'Modifier une ligne', 'Budget', true),
('budget_valider', 'Valider le budget', 'Budget', true),
('engagement_voir', 'Consulter les engagements', 'Engagement', true),
('engagement_creer', 'Créer un engagement', 'Engagement', true),
('engagement_valider', 'Valider un engagement', 'Engagement', true),
('liquidation_voir', 'Consulter les liquidations', 'Liquidation', true),
('liquidation_creer', 'Créer une liquidation', 'Liquidation', true),
('liquidation_valider', 'Valider une liquidation', 'Liquidation', true),
('ordonnancement_voir', 'Consulter les ordonnancements', 'Ordonnancement', true),
('ordonnancement_creer', 'Créer un ordonnancement', 'Ordonnancement', true),
('ordonnancement_signer', 'Signer un mandat', 'Ordonnancement', true),
('reglement_voir', 'Consulter les règlements', 'Règlement', true),
('reglement_creer', 'Enregistrer un paiement', 'Règlement', true),
('admin_users', 'Gérer les utilisateurs', 'Administration', true),
('admin_roles', 'Gérer les rôles', 'Administration', true),
('admin_audit', 'Consulter le journal d''audit', 'Administration', true),
('export_data', 'Exporter les données', 'Export', true)
ON CONFLICT (code) DO NOTHING;

-- Grant default permissions to ADMIN
INSERT INTO role_permissions (role_code, action_code, is_granted)
SELECT 'ADMIN', code, true FROM permission_actions WHERE is_active = true
ON CONFLICT DO NOTHING;