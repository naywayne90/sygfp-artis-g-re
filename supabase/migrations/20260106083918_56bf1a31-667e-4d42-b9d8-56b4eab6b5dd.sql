-- Insertion des comptes bancaires par défaut (si non existants)
INSERT INTO comptes_bancaires (code, libelle, banque, numero_compte, solde_initial, solde_actuel, devise, est_actif, type_compte)
SELECT 'SGBCI-001', 'Compte Principal SGBCI', 'SGBCI', '0001234567890', 0, 0, 'XOF', true, 'courant'
WHERE NOT EXISTS (SELECT 1 FROM comptes_bancaires WHERE code = 'SGBCI-001');

INSERT INTO comptes_bancaires (code, libelle, banque, numero_compte, solde_initial, solde_actuel, devise, est_actif, type_compte)
SELECT 'BICICI-001', 'Compte Courant BICICI', 'BICICI', '0009876543210', 0, 0, 'XOF', true, 'courant'
WHERE NOT EXISTS (SELECT 1 FROM comptes_bancaires WHERE code = 'BICICI-001');

INSERT INTO comptes_bancaires (code, libelle, banque, numero_compte, solde_initial, solde_actuel, devise, est_actif, type_compte)
SELECT 'ECOBANK-001', 'Compte Opérations ECOBANK', 'ECOBANK', '0005555666677', 0, 0, 'XOF', true, 'courant'
WHERE NOT EXISTS (SELECT 1 FROM comptes_bancaires WHERE code = 'ECOBANK-001');

INSERT INTO comptes_bancaires (code, libelle, banque, numero_compte, solde_initial, solde_actuel, devise, est_actif, type_compte)
SELECT 'BOA-001', 'Compte Trésorerie BOA', 'BOA', '0004444333322', 0, 0, 'XOF', true, 'tresorerie'
WHERE NOT EXISTS (SELECT 1 FROM comptes_bancaires WHERE code = 'BOA-001');