-- ===========================================
-- PROMPT 4/10 : RLS Notes SEF par rôles
-- ===========================================

-- 1. Créer une fonction helper pour vérifier le profil fonctionnel
CREATE OR REPLACE FUNCTION public.has_profil_fonctionnel(_user_id uuid, _profil profil_fonctionnel)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _user_id AND profil_fonctionnel = _profil
  )
$$;

COMMENT ON FUNCTION public.has_profil_fonctionnel IS 'Vérifie si un utilisateur a un profil fonctionnel spécifique';

-- 2. Créer une fonction helper pour vérifier le rôle hiérarchique
CREATE OR REPLACE FUNCTION public.has_role_hierarchique(_user_id uuid, _role role_hierarchique)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _user_id AND role_hierarchique = _role
  )
$$;

COMMENT ON FUNCTION public.has_role_hierarchique IS 'Vérifie si un utilisateur a un rôle hiérarchique spécifique';

-- 3. Créer une fonction pour obtenir la direction de l'utilisateur
CREATE OR REPLACE FUNCTION public.get_user_direction(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT direction_id FROM profiles WHERE id = _user_id
$$;

COMMENT ON FUNCTION public.get_user_direction IS 'Retourne la direction_id de l utilisateur';

-- 4. Créer une fonction pour obtenir l'exercice actif de l'utilisateur
CREATE OR REPLACE FUNCTION public.get_user_exercice_actif(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(exercice_actif, EXTRACT(year FROM CURRENT_DATE)::integer) 
  FROM profiles 
  WHERE id = _user_id
$$;

COMMENT ON FUNCTION public.get_user_exercice_actif IS 'Retourne l exercice actif de l utilisateur ou l annee courante';

-- 5. Fonction centralisée pour vérifier si l'utilisateur est validateur
CREATE OR REPLACE FUNCTION public.is_notes_sef_validator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Admins
    public.has_role(_user_id, 'ADMIN'::app_role) OR
    -- DG (hiérarchique ou app_role)
    public.has_role(_user_id, 'DG'::app_role) OR
    public.has_role_hierarchique(_user_id, 'DG'::role_hierarchique) OR
    -- DAAF
    public.has_role(_user_id, 'DAAF'::app_role) OR
    -- Profil fonctionnel Validateur
    public.has_profil_fonctionnel(_user_id, 'Validateur'::profil_fonctionnel) OR
    -- Directeurs peuvent valider dans leur direction
    public.has_role_hierarchique(_user_id, 'Directeur'::role_hierarchique)
  )
$$;

COMMENT ON FUNCTION public.is_notes_sef_validator IS 'Vérifie si l utilisateur peut valider/rejeter/différer les notes SEF';

-- 6. Fonction pour vérifier si l'utilisateur a accès admin
CREATE OR REPLACE FUNCTION public.is_notes_sef_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.has_role(_user_id, 'ADMIN'::app_role) OR
    public.has_profil_fonctionnel(_user_id, 'Admin'::profil_fonctionnel)
  )
$$;

COMMENT ON FUNCTION public.is_notes_sef_admin IS 'Vérifie si l utilisateur a les droits admin sur les notes SEF';

-- 7. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view notes from their direction or if authorized" ON public.notes_sef;
DROP POLICY IF EXISTS "Users can create notes SEF" ON public.notes_sef;
DROP POLICY IF EXISTS "Users can update their drafts or authorized roles can update" ON public.notes_sef;
DROP POLICY IF EXISTS "Only admins can delete notes SEF" ON public.notes_sef;

-- 8. Nouvelle politique SELECT avec filtrage exercice
CREATE POLICY "notes_sef_select_policy"
ON public.notes_sef
FOR SELECT
TO authenticated
USING (
  -- Filtre par exercice actif de l'utilisateur
  exercice = public.get_user_exercice_actif(auth.uid())
  AND (
    -- Admins voient tout
    public.is_notes_sef_admin(auth.uid())
    OR
    -- Créateur voit ses propres notes
    created_by = auth.uid()
    OR
    -- Validateurs voient les notes à valider
    (
      public.is_notes_sef_validator(auth.uid()) 
      AND statut IN ('soumis', 'a_valider', 'valide', 'rejete', 'differe')
    )
    OR
    -- Même direction : voit les notes validées + celles qu'il a créées
    (
      direction_id = public.get_user_direction(auth.uid())
      AND (statut = 'valide' OR created_by = auth.uid())
    )
    OR
    -- Profil Controleur/Auditeur : consultation des notes validées
    (
      (public.has_profil_fonctionnel(auth.uid(), 'Controleur'::profil_fonctionnel) 
       OR public.has_profil_fonctionnel(auth.uid(), 'Auditeur'::profil_fonctionnel))
      AND statut = 'valide'
    )
  )
);

COMMENT ON POLICY "notes_sef_select_policy" ON public.notes_sef IS 'Lecture notes SEF selon rôle et exercice actif';

-- 9. Nouvelle politique INSERT
CREATE POLICY "notes_sef_insert_policy"
ON public.notes_sef
FOR INSERT
TO authenticated
WITH CHECK (
  -- Tout utilisateur authentifié peut créer
  auth.uid() IS NOT NULL
  AND
  -- Le créateur doit être l'utilisateur courant
  (created_by IS NULL OR created_by = auth.uid())
  AND
  -- L'exercice doit correspondre à l'exercice actif
  exercice = public.get_user_exercice_actif(auth.uid())
);

COMMENT ON POLICY "notes_sef_insert_policy" ON public.notes_sef IS 'Création notes SEF par utilisateurs authentifiés sur exercice actif';

-- 10. Nouvelle politique UPDATE
CREATE POLICY "notes_sef_update_policy"
ON public.notes_sef
FOR UPDATE
TO authenticated
USING (
  -- Filtre exercice
  exercice = public.get_user_exercice_actif(auth.uid())
  AND (
    -- Admins peuvent tout modifier
    public.is_notes_sef_admin(auth.uid())
    OR
    -- Créateur peut modifier ses brouillons
    (created_by = auth.uid() AND statut = 'brouillon')
    OR
    -- Validateurs peuvent modifier le statut (valider/rejeter/différer)
    (
      public.is_notes_sef_validator(auth.uid())
      AND statut IN ('soumis', 'a_valider', 'differe')
    )
  )
)
WITH CHECK (
  -- Même conditions que USING pour cohérence
  exercice = public.get_user_exercice_actif(auth.uid())
  AND (
    public.is_notes_sef_admin(auth.uid())
    OR
    (created_by = auth.uid() AND statut IN ('brouillon', 'soumis'))
    OR
    public.is_notes_sef_validator(auth.uid())
  )
);

COMMENT ON POLICY "notes_sef_update_policy" ON public.notes_sef IS 'Modification notes SEF selon statut et rôle';

-- 11. Nouvelle politique DELETE (uniquement admins)
CREATE POLICY "notes_sef_delete_policy"
ON public.notes_sef
FOR DELETE
TO authenticated
USING (
  -- Filtre exercice
  exercice = public.get_user_exercice_actif(auth.uid())
  AND (
    -- Seuls les admins peuvent supprimer
    public.is_notes_sef_admin(auth.uid())
    OR
    -- Ou le créateur peut supprimer ses brouillons
    (created_by = auth.uid() AND statut = 'brouillon')
  )
);

COMMENT ON POLICY "notes_sef_delete_policy" ON public.notes_sef IS 'Suppression notes SEF par admin ou créateur (brouillon)';

-- 12. Appliquer les mêmes politiques sur notes_sef_pieces
DROP POLICY IF EXISTS "Authenticated users can view pieces" ON public.notes_sef_pieces;
DROP POLICY IF EXISTS "Authenticated users can insert pieces" ON public.notes_sef_pieces;
DROP POLICY IF EXISTS "Uploaders can delete their pieces" ON public.notes_sef_pieces;

CREATE POLICY "notes_sef_pieces_select_policy"
ON public.notes_sef_pieces
FOR SELECT
TO authenticated
USING (
  -- L'utilisateur doit pouvoir voir la note parente
  EXISTS (
    SELECT 1 FROM public.notes_sef n
    WHERE n.id = note_id
    AND n.exercice = public.get_user_exercice_actif(auth.uid())
  )
);

CREATE POLICY "notes_sef_pieces_insert_policy"
ON public.notes_sef_pieces
FOR INSERT
TO authenticated
WITH CHECK (
  -- L'utilisateur doit pouvoir modifier la note parente
  EXISTS (
    SELECT 1 FROM public.notes_sef n
    WHERE n.id = note_id
    AND n.exercice = public.get_user_exercice_actif(auth.uid())
    AND (
      public.is_notes_sef_admin(auth.uid())
      OR (n.created_by = auth.uid() AND n.statut = 'brouillon')
    )
  )
);

CREATE POLICY "notes_sef_pieces_delete_policy"
ON public.notes_sef_pieces
FOR DELETE
TO authenticated
USING (
  -- L'uploader ou admin peut supprimer
  uploaded_by = auth.uid() 
  OR public.is_notes_sef_admin(auth.uid())
);