-- ============================================
-- Migration: Correction contrainte statut engagement
-- Date: 2026-02-04
--
-- La contrainte actuelle n'accepte pas "brouillon" et "soumis"
-- Cette migration ajoute ces statuts pour le workflow de scanning
-- ============================================

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE budget_engagements
DROP CONSTRAINT IF EXISTS budget_engagements_statut_check;

-- 2. Créer la nouvelle contrainte avec tous les statuts nécessaires
ALTER TABLE budget_engagements
ADD CONSTRAINT budget_engagements_statut_check
CHECK (statut IN (
    'brouillon',      -- En cours de création, documents à fournir
    'soumis',         -- Soumis pour validation
    'en_attente',     -- En attente de traitement (legacy)
    'a_valider',      -- À valider par le responsable
    'valide',         -- Validé et approuvé
    'rejete',         -- Rejeté
    'differe',        -- Différé
    'annule',         -- Annulé
    'en_cours'        -- En cours de traitement
));

-- 3. Mettre à jour les engagements "en_attente" vers "brouillon" pour le scanning
-- (Optionnel - décommenter si souhaité)
-- UPDATE budget_engagements
-- SET statut = 'brouillon'
-- WHERE statut = 'en_attente';

-- ============================================
-- Même correction pour les liquidations
-- ============================================

ALTER TABLE budget_liquidations
DROP CONSTRAINT IF EXISTS budget_liquidations_statut_check;

ALTER TABLE budget_liquidations
ADD CONSTRAINT budget_liquidations_statut_check
CHECK (statut IN (
    'brouillon',      -- En cours de création
    'soumis',         -- Soumis pour validation
    'en_attente',     -- En attente (legacy)
    'a_valider',      -- À valider
    'valide',         -- Validé
    'rejete',         -- Rejeté
    'differe',        -- Différé
    'annule',         -- Annulé
    'paye'            -- Payé (pour le règlement)
));

RAISE NOTICE '✅ Contraintes de statut mises à jour pour engagements et liquidations';
