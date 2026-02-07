-- =====================================================
-- Migration : Configuration workflow DGPECRP
-- Date : 2026-02-07
-- Description : Configure les 2 chemins de validation pour la DGPECRP
--   Chemin A (Depenses RH): Agent RH -> Simon FOFANA (Chef Svc Admin RH)
--       -> Ferdinand AFFI (SD Dev RH) -> Karen BENDEY-DIBY (Dir DGPECRP) -> DG
--   Chemin B (Depenses Com): Agent Com -> Lisette ANOH (Chef Svc Com Digital)
--       -> Gabrielle KOUAME (SD Relations Publiques) -> Karen BENDEY-DIBY (Dir DGPECRP) -> DG
-- =====================================================

BEGIN;

-- =====================================================
-- 1. VERIFIER QUE LA DIRECTION DGPECRP EXISTE
-- =====================================================
-- La direction DGPECRP existe deja avec id = 7af769e8-852f-4a7b-b719-030d75685f4d
-- On s'assure qu'elle est active
UPDATE directions
SET est_active = true
WHERE code = 'DGPECRP';

-- =====================================================
-- 2. CORRIGER LES ROLES HIERARCHIQUES DES SOUS-DIRECTEURS
-- =====================================================
-- Ferdinand AFFI et Gabrielle KOUAME sont des Sous-Directeurs,
-- pas des Directeurs. On corrige role_hierarchique.
-- Note: On les laisse en "Validateur" pour profil_fonctionnel car ils valident.

UPDATE profiles
SET role_hierarchique = 'Sous-Directeur'
WHERE id = '31ce15f7-b63e-49a0-9a2a-904a553c3831'  -- AFFI Ferdinand
  AND role_hierarchique = 'Directeur';

UPDATE profiles
SET role_hierarchique = 'Sous-Directeur'
WHERE id = '0800d549-7b7b-40a6-a0d6-43420ee4a752'  -- KOUAME Gabrielle
  AND role_hierarchique = 'Directeur';

-- =====================================================
-- 3. CREER LES 2 WORKFLOWS DGPECRP
-- =====================================================
-- Workflow A: Depenses RH (personnel, transfert)
-- Workflow B: Depenses Communication

INSERT INTO wf_definitions (entity_type, nom, description, est_actif)
VALUES
  (
    'budget_engagements_dgpecrp_rh',
    'Validation Engagement DGPECRP - Depenses RH',
    'Circuit de validation des engagements DGPECRP pour les depenses de personnel et transferts. '
    || 'Agent RH -> Chef Svc Admin RH (FOFANA) -> SD Dev RH (AFFI) -> Dir DGPECRP (BENDEY-DIBY) -> DG'
  ),
  (
    'budget_engagements_dgpecrp_com',
    'Validation Engagement DGPECRP - Depenses Communication',
    'Circuit de validation des engagements DGPECRP pour les depenses de communication. '
    || 'Agent Com -> Chef Svc Com Digital (ANOH) -> SD Relations Publiques (KOUAME) -> Dir DGPECRP (BENDEY-DIBY) -> DG'
  )
ON CONFLICT (entity_type) DO NOTHING;

-- =====================================================
-- 4. CREER LES ETAPES (WF_STEPS)
-- =====================================================

-- 4a. Etapes Workflow A - Depenses RH
DO $$
DECLARE
  v_wf_rh_id UUID;
BEGIN
  SELECT id INTO v_wf_rh_id
  FROM wf_definitions
  WHERE entity_type = 'budget_engagements_dgpecrp_rh';

  IF v_wf_rh_id IS NOT NULL THEN
    INSERT INTO wf_steps (workflow_id, step_order, role_required, direction_required, label, description, delai_max_heures)
    VALUES
      (v_wf_rh_id, 1, 'AGENT', 'DGPECRP',
       'Creation Agent RH',
       'Creation de l''engagement par un agent RH de la DGPECRP (DOSSO, YAO, GRAH)',
       24),
      (v_wf_rh_id, 2, 'CHEF_SERVICE', 'DGPECRP',
       'Validation Chef Service Admin RH',
       'Validation par le Chef de Service Administration des RH (FOFANA Seydou Simon)',
       48),
      (v_wf_rh_id, 3, 'SOUS_DIRECTEUR', 'DGPECRP',
       'Validation SD Dev RH',
       'Validation par le Sous-Directeur du Developpement des RH (AFFI Ferdinand)',
       48),
      (v_wf_rh_id, 4, 'DIRECTEUR', 'DGPECRP',
       'Validation Directrice DGPECRP',
       'Validation par la Directrice DGPECRP (BENDEY-DIBY Karen)',
       72),
      (v_wf_rh_id, 5, 'DG', NULL,
       'Validation DG',
       'Validation finale par le Directeur General',
       72)
    ON CONFLICT (workflow_id, step_order) DO NOTHING;
  END IF;
END $$;

-- 4b. Etapes Workflow B - Depenses Communication
DO $$
DECLARE
  v_wf_com_id UUID;
BEGIN
  SELECT id INTO v_wf_com_id
  FROM wf_definitions
  WHERE entity_type = 'budget_engagements_dgpecrp_com';

  IF v_wf_com_id IS NOT NULL THEN
    INSERT INTO wf_steps (workflow_id, step_order, role_required, direction_required, label, description, delai_max_heures)
    VALUES
      (v_wf_com_id, 1, 'AGENT', 'DGPECRP',
       'Creation Agent Communication',
       'Creation de l''engagement par un agent Communication de la DGPECRP (SEYNOU, KOUAME Berenice)',
       24),
      (v_wf_com_id, 2, 'CHEF_SERVICE', 'DGPECRP',
       'Validation Chef Service Com Digital',
       'Validation par le Chef de Service Communication Digital et Site Web (ANOH Ama Lisette Desiree)',
       48),
      (v_wf_com_id, 3, 'SOUS_DIRECTEUR', 'DGPECRP',
       'Validation SD Relations Publiques',
       'Validation par la Sous-Directrice des Relations Publiques et de la Communication (KOUAME Yah Noelie Gabrielle)',
       48),
      (v_wf_com_id, 4, 'DIRECTEUR', 'DGPECRP',
       'Validation Directrice DGPECRP',
       'Validation par la Directrice DGPECRP (BENDEY-DIBY Karen)',
       72),
      (v_wf_com_id, 5, 'DG', NULL,
       'Validation DG',
       'Validation finale par le Directeur General',
       72)
    ON CONFLICT (workflow_id, step_order) DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- 5. CONFIGURER LA HIERARCHIE (SUPERVISOR_ID)
-- =====================================================
-- S'assurer que la colonne supervisor_id existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'supervisor_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN supervisor_id UUID REFERENCES profiles(id);
    CREATE INDEX IF NOT EXISTS idx_profiles_supervisor_id ON profiles(supervisor_id);
  END IF;
END $$;

-- 5a. Agents RH -> Chef Service Admin RH (FOFANA Seydou Simon)
-- DOSSO Moussa (Assistant RH) -> FOFANA
UPDATE profiles
SET supervisor_id = 'ff67b700-4dad-4949-bcca-683d8b98fc03'
WHERE id = 'e2b5d21c-a634-4458-84f3-6418c44f35ea';

-- YAO Anyela Marie-Colombe (Assistante RH) -> FOFANA
UPDATE profiles
SET supervisor_id = 'ff67b700-4dad-4949-bcca-683d8b98fc03'
WHERE id = 'a298e128-a09a-412d-95c5-c9e732845a35';

-- GRAH Franck (Agent d'accueil) -> FOFANA
UPDATE profiles
SET supervisor_id = 'ff67b700-4dad-4949-bcca-683d8b98fc03'
WHERE id = 'd07c4563-6153-49f2-a291-f5b7e453b4c3';

-- 5b. Agents Communication -> Chef Service Com Digital (ANOH Ama Lisette Desiree)
-- SEYNOU Aicha (Assistante Communication) -> ANOH
UPDATE profiles
SET supervisor_id = '6cb59657-3e72-490a-ba40-81af80c7491e'
WHERE id = 'd868aac8-40f8-403b-9340-f9351eab3e82';

-- KOUAME Berenice (Stagiaire Publicite Marketing) -> ANOH
UPDATE profiles
SET supervisor_id = '6cb59657-3e72-490a-ba40-81af80c7491e'
WHERE id = '719f31c4-099a-47c3-ad69-8d5c3aedff66';

-- 5c. Chef Service Admin RH + Resp Pool Dirigeants -> SD Dev RH (AFFI Ferdinand)
-- FOFANA Seydou Simon (Chef Svc Admin RH) -> AFFI
UPDATE profiles
SET supervisor_id = '31ce15f7-b63e-49a0-9a2a-904a553c3831'
WHERE id = 'ff67b700-4dad-4949-bcca-683d8b98fc03';

-- AMANGOUA Constance Josette (Resp Pool Dirigeants Sociaux) -> AFFI
UPDATE profiles
SET supervisor_id = '31ce15f7-b63e-49a0-9a2a-904a553c3831'
WHERE id = '1ebdc551-c39c-40fc-bb54-98818b50aebf';

-- 5d. Chef Service Com Digital -> SD Relations Publiques (KOUAME Gabrielle)
-- ANOH Ama Lisette Desiree (Chef Svc Com Digital) -> KOUAME Gabrielle
UPDATE profiles
SET supervisor_id = '0800d549-7b7b-40a6-a0d6-43420ee4a752'
WHERE id = '6cb59657-3e72-490a-ba40-81af80c7491e';

-- 5e. Les 2 Sous-Directeurs -> Directrice DGPECRP (BENDEY-DIBY Karen)
-- AFFI Ferdinand (SD Dev RH) -> BENDEY-DIBY
UPDATE profiles
SET supervisor_id = 'd89ea787-6bc1-465e-9eec-4a20467f72e3'
WHERE id = '31ce15f7-b63e-49a0-9a2a-904a553c3831';

-- KOUAME Gabrielle (SD Relations Publiques) -> BENDEY-DIBY
UPDATE profiles
SET supervisor_id = 'd89ea787-6bc1-465e-9eec-4a20467f72e3'
WHERE id = '0800d549-7b7b-40a6-a0d6-43420ee4a752';

-- =====================================================
-- 6. AJOUTER LE SERVICE DGPECRP DANS WF_SERVICES (si pas deja present)
-- =====================================================
INSERT INTO wf_services (code, label, description, responsable_role_code)
VALUES
  ('DGPECRP', 'Direction GPECRP',
   'Direction de la Gestion Previsionnelle de l''Emploi, des Competences et des Relations Publiques',
   'DIRECTEUR'),
  ('SD_DEV_RH', 'Sous-Direction Dev RH',
   'Sous-Direction du Developpement des Ressources Humaines',
   'SOUS_DIRECTEUR'),
  ('SD_REL_PUB', 'Sous-Direction Relations Publiques',
   'Sous-Direction des Relations Publiques et de la Communication',
   'SOUS_DIRECTEUR'),
  ('SVC_ADMIN_RH', 'Service Admin RH',
   'Service Administration des Ressources Humaines',
   'CHEF_SERVICE'),
  ('SVC_COM_DIGITAL', 'Service Com Digital',
   'Service Communication Digital et Site Web',
   'CHEF_SERVICE')
ON CONFLICT (code) DO NOTHING;

COMMIT;
