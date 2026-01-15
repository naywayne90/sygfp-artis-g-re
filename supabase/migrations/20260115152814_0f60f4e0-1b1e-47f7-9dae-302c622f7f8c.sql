-- =============================================================================
-- SÉCURITÉ SYGFP NOTES SEF - RLS COMPLÈTES (v3)
-- Utilise les fonctions existantes avec les bons types enum
-- =============================================================================

-- 1. Ajouter colonne direction_code si manquante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'direction_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN direction_code text;
    UPDATE profiles p SET direction_code = d.code
    FROM directions d WHERE p.direction_id = d.id;
  END IF;
END $$;

-- 2. Créer fonction helper pour récupérer direction de l'utilisateur
CREATE OR REPLACE FUNCTION get_user_direction_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT direction_id FROM profiles WHERE id = p_user_id
$$;

-- 3. Créer fonction pour vérifier si utilisateur peut voir note SEF
CREATE OR REPLACE FUNCTION can_view_note_sef(
  p_user_id uuid,
  p_note_created_by uuid,
  p_note_direction_id uuid,
  p_note_statut text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Admin (profil fonctionnel) voit tout
    has_profil_fonctionnel(p_user_id, 'Admin'::profil_fonctionnel)
    -- DG (app_role) voit tout
    OR has_role(p_user_id, 'DG'::app_role)
    -- DAAF voit tout (gestionnaire finances)
    OR has_role(p_user_id, 'DAAF'::app_role)
    -- DAF voit tout
    OR has_role(p_user_id, 'DAF'::app_role)
    -- Créateur voit ses propres notes
    OR p_note_created_by = p_user_id
    -- OPERATEUR voient les notes soumises et validées
    OR (
      has_role(p_user_id, 'OPERATEUR'::app_role)
      AND p_note_statut IN ('soumis', 'valide', 'impute', 'differe')
    )
    -- Même direction: consultation des notes validées uniquement
    OR (
      get_user_direction_id(p_user_id) = p_note_direction_id
      AND p_note_statut IN ('valide', 'impute')
    )
    -- Auditeurs (profil) voient les notes validées
    OR (
      has_profil_fonctionnel(p_user_id, 'Auditeur'::profil_fonctionnel)
      AND p_note_statut IN ('valide', 'impute')
    )
    -- Contrôleurs (profil) voient les notes validées
    OR (
      has_profil_fonctionnel(p_user_id, 'Controleur'::profil_fonctionnel)
      AND p_note_statut IN ('valide', 'impute')
    )
    -- AUDITOR (app_role) voit les notes validées
    OR (
      has_role(p_user_id, 'AUDITOR'::app_role)
      AND p_note_statut IN ('valide', 'impute')
    )
  )
$$;

-- 4. Supprimer anciennes policies sur notes_dg
DROP POLICY IF EXISTS "Users can view notes from their direction or if DG/Admin" ON notes_dg;
DROP POLICY IF EXISTS "Users can create notes" ON notes_dg;
DROP POLICY IF EXISTS "Users can update their own draft notes" ON notes_dg;
DROP POLICY IF EXISTS "Users can update their own draft notes or authorized roles can " ON notes_dg;
DROP POLICY IF EXISTS "Admin can manage all notes" ON notes_dg;
DROP POLICY IF EXISTS "DG can read all notes" ON notes_dg;
DROP POLICY IF EXISTS "DG can validate and update notes" ON notes_dg;
DROP POLICY IF EXISTS "DAAF can impute validated notes" ON notes_dg;

-- 5. Nouvelles policies RLS pour notes_dg (Notes SEF)

-- SELECT: Lecture selon règles SYGFP
CREATE POLICY "notes_sef_select_policy" ON notes_dg
FOR SELECT USING (
  can_view_note_sef(auth.uid(), created_by, direction_id, statut)
);

-- INSERT: Création par utilisateur authentifié
CREATE POLICY "notes_sef_insert_policy" ON notes_dg
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_active = true
  )
);

-- UPDATE: Modification selon statut et rôle
CREATE POLICY "notes_sef_update_policy" ON notes_dg
FOR UPDATE USING (
  -- Admin peut tout modifier
  has_profil_fonctionnel(auth.uid(), 'Admin'::profil_fonctionnel)
  -- Créateur peut modifier en brouillon
  OR (created_by = auth.uid() AND statut = 'brouillon')
  -- Créateur peut re-soumettre une note différée
  OR (created_by = auth.uid() AND statut = 'differe')
  -- DG peut valider/rejeter/différer les notes soumises
  OR (has_role(auth.uid(), 'DG'::app_role) AND statut IN ('soumis', 'differe'))
  -- DAAF peut imputer les notes validées
  OR (has_role(auth.uid(), 'DAAF'::app_role) AND statut = 'valide')
  -- CB peut imputer les notes validées
  OR (has_role(auth.uid(), 'CB'::app_role) AND statut = 'valide')
);

-- DELETE: Suppression très restreinte
CREATE POLICY "notes_sef_delete_policy" ON notes_dg
FOR DELETE USING (
  has_profil_fonctionnel(auth.uid(), 'Admin'::profil_fonctionnel)
  OR (created_by = auth.uid() AND statut = 'brouillon')
);

-- 6. Fonction pour vérifier si export autorisé
CREATE OR REPLACE FUNCTION can_export_notes_sef(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    has_profil_fonctionnel(p_user_id, 'Admin'::profil_fonctionnel)
    OR has_role(p_user_id, 'DG'::app_role)
    OR has_role(p_user_id, 'DAAF'::app_role)
    OR has_role(p_user_id, 'DAF'::app_role)
    OR has_role(p_user_id, 'CB'::app_role)
    OR has_role(p_user_id, 'OPERATEUR'::app_role)
  )
$$;

-- 7. Trigger pour empêcher modification de documents finaux
CREATE OR REPLACE FUNCTION prevent_final_note_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.statut IN ('valide', 'rejete', 'impute') THEN
    IF NOT has_profil_fonctionnel(auth.uid(), 'Admin'::profil_fonctionnel) THEN
      IF NEW.statut != OLD.statut THEN
        IF OLD.statut = 'valide' AND NEW.statut = 'impute' THEN
          IF has_role(auth.uid(), 'DAAF'::app_role) OR has_role(auth.uid(), 'CB'::app_role) THEN
            RETURN NEW;
          END IF;
        END IF;
        RAISE EXCEPTION 'Document en statut final non modifiable';
      END IF;
      RAISE EXCEPTION 'Document en statut final non modifiable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_final_note_modification ON notes_dg;
CREATE TRIGGER trigger_prevent_final_note_modification
  BEFORE UPDATE ON notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION prevent_final_note_modification();

-- 8. Documentation
COMMENT ON FUNCTION get_user_direction_id(uuid) IS 'Retourne la direction_id de l''utilisateur';
COMMENT ON FUNCTION can_view_note_sef(uuid, uuid, uuid, text) IS 'Détermine si un utilisateur peut voir une note SEF selon les règles SYGFP';
COMMENT ON FUNCTION can_export_notes_sef(uuid) IS 'Vérifie les droits d''export des notes SEF';
COMMENT ON FUNCTION prevent_final_note_modification IS 'Empêche la modification des notes en statut final';