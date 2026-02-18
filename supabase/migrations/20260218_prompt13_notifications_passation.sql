-- ============================================================
-- Prompt 13 BACKEND — Notifications passation, badge perf, QR
-- Date: 2026-02-18
-- Description:
--   1. Corriger la syntaxe des templates marchés ({var} → {{var}})
--   2. Ajouter notification_recipients pour marchés
--   3. Vérifier performance badge sidebar (indexes déjà OK)
--   4. QR code confirmé client-side (aucun backend nécessaire)
-- ============================================================

-- ============================================================
-- STEP 1: Corriger les templates marchés ({var} → {{var}})
-- La fonction render_notification_template() remplace {{var}},
-- mais les templates prompt 9 utilisaient {var} par erreur
-- ============================================================

UPDATE notification_templates
SET titre_template = 'Marché publié: {{numero}}',
    corps_template = 'Le marché "{{objet}}" (réf. {{numero}}) a été publié. Montant estimé: {{montant}} FCFA. Prestataire: {{prestataire}}. Statut: publié. Date de clôture: {{date_cloture}}.',
    variables_disponibles = '["numero","objet","montant","prestataire","statut","date_publication","date_cloture"]'::jsonb
WHERE code = 'MARCHE_PUBLIE';

UPDATE notification_templates
SET titre_template = 'Clôture marché: {{numero}}',
    corps_template = 'La période de soumission du marché "{{objet}}" (réf. {{numero}}) est clôturée. Montant estimé: {{montant}} FCFA. Statut: clôturé.',
    variables_disponibles = '["numero","objet","montant","statut"]'::jsonb
WHERE code = 'MARCHE_CLOTURE';

UPDATE notification_templates
SET titre_template = 'Évaluation en cours: {{numero}}',
    corps_template = 'Le marché "{{objet}}" (réf. {{numero}}) est en cours d''évaluation. {{nb_soumissions}} soumission(s) reçue(s). Montant estimé: {{montant}} FCFA. Statut: en évaluation.',
    variables_disponibles = '["numero","objet","montant","nb_soumissions","statut"]'::jsonb
WHERE code = 'MARCHE_EN_EVALUATION';

UPDATE notification_templates
SET titre_template = 'Marché attribué: {{numero}}',
    corps_template = 'Le marché "{{objet}}" (réf. {{numero}}) a été attribué à {{prestataire}} pour un montant de {{montant}} FCFA. Statut: attribué.',
    variables_disponibles = '["numero","objet","montant","prestataire","statut"]'::jsonb
WHERE code = 'MARCHE_ATTRIBUE';

UPDATE notification_templates
SET titre_template = 'Marché approuvé: {{numero}}',
    corps_template = 'Le marché "{{objet}}" (réf. {{numero}}) a été approuvé par {{approbateur}}. Prestataire: {{prestataire}}. Montant: {{montant}} FCFA. Statut: approuvé. Procéder à la signature.',
    variables_disponibles = '["numero","objet","montant","prestataire","statut","approbateur"]'::jsonb
WHERE code = 'MARCHE_APPROUVE';

UPDATE notification_templates
SET titre_template = 'Marché signé: {{numero}}',
    corps_template = 'Le marché "{{objet}}" (réf. {{numero}}) est signé. Prestataire: {{prestataire}}. Montant: {{montant}} FCFA. Date de signature: {{date_signature}}. Statut: signé. Créer l''engagement budgétaire.',
    variables_disponibles = '["numero","objet","montant","prestataire","statut","date_signature"]'::jsonb
WHERE code = 'MARCHE_SIGNE';

UPDATE notification_templates
SET titre_template = 'ANNULATION marché: {{numero}}',
    corps_template = 'Le marché "{{objet}}" (réf. {{numero}}) a été annulé. Prestataire: {{prestataire}}. Montant: {{montant}} FCFA. Motif: {{motif}}. Statut: annulé.',
    variables_disponibles = '["numero","objet","montant","prestataire","statut","motif"]'::jsonb
WHERE code = 'MARCHE_ANNULE';

UPDATE notification_templates
SET titre_template = 'Marché REJETÉ: {{numero}}',
    corps_template = 'Le marché "{{objet}}" (réf. {{numero}}) a été rejeté par le DG. Prestataire: {{prestataire}}. Montant: {{montant}} FCFA. Motif: {{motif}}. Statut: rejeté. Veuillez corriger et resoumettre.',
    variables_disponibles = '["numero","objet","montant","prestataire","statut","motif"]'::jsonb
WHERE code = 'MARCHE_REJETE';

-- ============================================================
-- STEP 2: Ajouter notification_recipients pour marchés
-- ============================================================
-- DG reçoit toutes les notifications marchés
INSERT INTO notification_recipients (type_evenement, role_hierarchique)
VALUES
  ('marche_publie', 'DG'),
  ('marche_cloture', 'DG'),
  ('marche_en_evaluation', 'DG'),
  ('marche_attribue', 'DG'),
  ('marche_approuve', 'DG'),
  ('marche_signe', 'DG'),
  ('marche_annule', 'DG'),
  ('marche_rejete', 'DG')
ON CONFLICT DO NOTHING;

-- DAAF reçoit toutes les notifications marchés
INSERT INTO notification_recipients (type_evenement, role_hierarchique)
VALUES
  ('marche_publie', 'DAAF'),
  ('marche_cloture', 'DAAF'),
  ('marche_en_evaluation', 'DAAF'),
  ('marche_attribue', 'DAAF'),
  ('marche_approuve', 'DAAF'),
  ('marche_signe', 'DAAF'),
  ('marche_annule', 'DAAF'),
  ('marche_rejete', 'DAAF')
ON CONFLICT DO NOTHING;

-- CB reçoit les notifications critiques (attribution, signature, annulation)
INSERT INTO notification_recipients (type_evenement, role_hierarchique)
VALUES
  ('marche_attribue', 'CB'),
  ('marche_approuve', 'CB'),
  ('marche_signe', 'CB'),
  ('marche_annule', 'CB'),
  ('marche_rejete', 'CB')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 3: Vérification performance badge sidebar
-- ============================================================
-- La requête du hook useSidebarBadges pour les marchés est:
--   SELECT count(*) FROM passation_marche
--   WHERE exercice = ? AND statut IN ('brouillon', 'attribue')
--
-- Indexes existants (vérifiés):
--   idx_passation_marche_statut ON passation_marche(statut)
--   idx_passation_marche_exercice_statut ON passation_marche(exercice, statut)
--
-- Le hook utilise { count: 'exact', head: true } → SELECT count(*) sans data
-- Refetch: 30s, stale: 15s → charge réseau minimale
--
-- CONCLUSION: Aucun changement nécessaire, requête déjà optimale.

-- ============================================================
-- STEP 4: QR Code — Vérification
-- ============================================================
-- Le type 'MARCHE' est dans DOCUMENT_TYPES (src/lib/qrcode-utils.ts)
-- Génération client-side via Web Crypto API SHA256
-- Fonctions: generateHash(), encodePayload(), generateVerifyUrl()
-- Aucune Edge Function nécessaire.
--
-- CONCLUSION: Aucun changement nécessaire, déjà client-side.

-- ============================================================
-- RÉSUMÉ PROMPT 13
-- ============================================================
-- 1. ✅ Templates marchés: 8 templates corrigés ({var} → {{var}})
--    Variables uniformisées: numero, objet, montant, prestataire, statut
-- 2. ✅ notification_recipients: 21 entrées pour 8 types d'événements
--    DG: 8 types, DAAF: 8 types, CB: 5 types critiques
-- 3. ✅ Badge sidebar: performant (index composites, COUNT head:true)
-- 4. ✅ QR code: client-side (Web Crypto API, pas d'Edge Function)
