-- ============================================
-- MIGRATION: RLS RBAC SOCLE
-- Prompt 04/25 - Utilisateurs, rôles, profils + RLS "socle"
-- ============================================

-- ============================================
-- FONCTIONS HELPER RBAC
-- ============================================

-- Vérifie si l'utilisateur est admin (Admin profil OU role ADMIN)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      profil_fonctionnel = 'Admin'
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'ADMIN'
        AND is_active = true
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est DG
CREATE OR REPLACE FUNCTION public.is_dg()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      role_hierarchique = 'DG'
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'DG'
        AND is_active = true
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est Contrôleur Budgétaire
CREATE OR REPLACE FUNCTION public.is_cb()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'CB'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est DAAF
CREATE OR REPLACE FUNCTION public.is_daaf()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('DAAF', 'DAF')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est Trésorerie
CREATE OR REPLACE FUNCTION public.is_tresorerie()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('TRESORERIE', 'TRESORIER')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur peut valider une étape workflow
CREATE OR REPLACE FUNCTION public.can_validate_step(step_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_profil TEXT;
  user_role_hier TEXT;
BEGIN
  -- Récupérer profil et rôle hiérarchique
  SELECT profil_fonctionnel, role_hierarchique
  INTO user_profil, user_role_hier
  FROM public.profiles
  WHERE id = auth.uid();

  -- Admin ou DG peuvent tout valider
  IF user_profil = 'Admin' OR user_role_hier = 'DG' THEN
    RETURN TRUE;
  END IF;

  -- Validation DG obligatoire sur SEF
  IF step_code = 'SEF' THEN
    RETURN user_role_hier = 'DG' OR public.is_dg();
  END IF;

  -- AEF: DG ou Directeur
  IF step_code = 'AEF' THEN
    RETURN user_role_hier IN ('DG', 'Directeur') OR public.is_dg();
  END IF;

  -- Engagement: CB
  IF step_code = 'ENG' THEN
    RETURN public.is_cb();
  END IF;

  -- Liquidation: CB ou DAAF
  IF step_code = 'LIQ' THEN
    RETURN public.is_cb() OR public.is_daaf();
  END IF;

  -- Ordonnancement: DAAF ou DG
  IF step_code = 'ORD' THEN
    RETURN public.is_daaf() OR public.is_dg() OR user_role_hier IN ('DG', 'Directeur');
  END IF;

  -- Règlement: Trésorerie
  IF step_code = 'REG' THEN
    RETURN public.is_tresorerie();
  END IF;

  -- Par défaut, les validateurs peuvent valider
  RETURN user_profil IN ('Validateur', 'Controleur');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Récupère la direction de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_user_direction_id()
RETURNS UUID AS $$
  SELECT direction_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Récupère l'exercice actif de l'utilisateur
CREATE OR REPLACE FUNCTION public.get_user_exercice()
RETURNS INTEGER AS $$
  SELECT exercice_actif FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur peut créer dans un module
CREATE OR REPLACE FUNCTION public.can_create_in_module(module_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_profil TEXT;
BEGIN
  SELECT profil_fonctionnel INTO user_profil
  FROM public.profiles WHERE id = auth.uid();

  -- Admin peut tout créer
  IF user_profil = 'Admin' THEN RETURN TRUE; END IF;

  -- Notes SEF/AEF: Operationnel, Validateur
  IF module_code IN ('notes_sef', 'notes_aef') THEN
    RETURN user_profil IN ('Operationnel', 'Validateur');
  END IF;

  -- Engagement, liquidation, etc: Controleur, Validateur
  IF module_code IN ('engagements', 'liquidations', 'ordonnancements') THEN
    RETURN user_profil IN ('Controleur', 'Validateur');
  END IF;

  -- Règlement: Trésorerie via rôle
  IF module_code = 'reglements' THEN
    RETURN public.is_tresorerie();
  END IF;

  -- Par défaut: Operationnel ou Validateur
  RETURN user_profil IN ('Operationnel', 'Validateur', 'Controleur');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ACTIVATION RLS SUR TABLES PRINCIPALES
-- ============================================

-- Exercices budgétaires
ALTER TABLE public.exercices_budgetaires ENABLE ROW LEVEL SECURITY;

-- Notes SEF
ALTER TABLE public.notes_sef ENABLE ROW LEVEL SECURITY;

-- Notes DG (AEF)
ALTER TABLE public.notes_dg ENABLE ROW LEVEL SECURITY;

-- Engagements
ALTER TABLE public.budget_engagements ENABLE ROW LEVEL SECURITY;

-- Liquidations
ALTER TABLE public.budget_liquidations ENABLE ROW LEVEL SECURITY;

-- Ordonnancements
ALTER TABLE public.ordonnancements ENABLE ROW LEVEL SECURITY;

-- Règlements
ALTER TABLE public.reglements ENABLE ROW LEVEL SECURITY;

-- Imputations
ALTER TABLE public.imputations ENABLE ROW LEVEL SECURITY;

-- Budget lines
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;

-- Marchés
ALTER TABLE public.marches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: EXERCICES BUDGETAIRES
-- ============================================

-- Lecture: tous les authentifiés
DROP POLICY IF EXISTS "exercices_select_authenticated" ON public.exercices_budgetaires;
CREATE POLICY "exercices_select_authenticated" ON public.exercices_budgetaires
  FOR SELECT TO authenticated USING (true);

-- Modification: Admin seulement
DROP POLICY IF EXISTS "exercices_all_admin" ON public.exercices_budgetaires;
CREATE POLICY "exercices_all_admin" ON public.exercices_budgetaires
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- POLICIES: NOTES SEF
-- ============================================

-- Lecture: DG voit tout, autres voient leur direction ou créés par eux
DROP POLICY IF EXISTS "notes_sef_select" ON public.notes_sef;
CREATE POLICY "notes_sef_select" ON public.notes_sef
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_dg()
    OR created_by = auth.uid()
    OR direction_id = public.get_user_direction_id()
  );

-- Insertion: utilisateurs autorisés
DROP POLICY IF EXISTS "notes_sef_insert" ON public.notes_sef;
CREATE POLICY "notes_sef_insert" ON public.notes_sef
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.can_create_in_module('notes_sef')
  );

-- Modification: créateur (si brouillon) ou DG
DROP POLICY IF EXISTS "notes_sef_update" ON public.notes_sef;
CREATE POLICY "notes_sef_update" ON public.notes_sef
  FOR UPDATE TO authenticated USING (
    public.is_admin()
    OR public.is_dg()
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );

-- Suppression: créateur (si brouillon) ou admin
DROP POLICY IF EXISTS "notes_sef_delete" ON public.notes_sef;
CREATE POLICY "notes_sef_delete" ON public.notes_sef
  FOR DELETE TO authenticated USING (
    public.is_admin()
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );

-- ============================================
-- POLICIES: NOTES DG (AEF)
-- ============================================

DROP POLICY IF EXISTS "notes_dg_select" ON public.notes_dg;
CREATE POLICY "notes_dg_select" ON public.notes_dg
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_dg()
    OR created_by = auth.uid()
    OR direction_id = public.get_user_direction_id()
  );

DROP POLICY IF EXISTS "notes_dg_insert" ON public.notes_dg;
CREATE POLICY "notes_dg_insert" ON public.notes_dg
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.can_create_in_module('notes_aef')
  );

DROP POLICY IF EXISTS "notes_dg_update" ON public.notes_dg;
CREATE POLICY "notes_dg_update" ON public.notes_dg
  FOR UPDATE TO authenticated USING (
    public.is_admin()
    OR public.is_dg()
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );

-- ============================================
-- POLICIES: BUDGET ENGAGEMENTS
-- ============================================

DROP POLICY IF EXISTS "engagements_select" ON public.budget_engagements;
CREATE POLICY "engagements_select" ON public.budget_engagements
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_dg()
    OR public.is_cb()
    OR created_by = auth.uid()
    OR direction_id = public.get_user_direction_id()
  );

DROP POLICY IF EXISTS "engagements_insert" ON public.budget_engagements;
CREATE POLICY "engagements_insert" ON public.budget_engagements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.can_create_in_module('engagements')
  );

DROP POLICY IF EXISTS "engagements_update" ON public.budget_engagements;
CREATE POLICY "engagements_update" ON public.budget_engagements
  FOR UPDATE TO authenticated USING (
    public.is_admin()
    OR public.is_cb()
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'en_attente'))
  );

-- ============================================
-- POLICIES: BUDGET LIQUIDATIONS
-- ============================================

DROP POLICY IF EXISTS "liquidations_select" ON public.budget_liquidations;
CREATE POLICY "liquidations_select" ON public.budget_liquidations
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_dg()
    OR public.is_cb()
    OR public.is_daaf()
    OR created_by = auth.uid()
    OR direction_id = public.get_user_direction_id()
  );

DROP POLICY IF EXISTS "liquidations_insert" ON public.budget_liquidations;
CREATE POLICY "liquidations_insert" ON public.budget_liquidations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.can_create_in_module('liquidations')
  );

DROP POLICY IF EXISTS "liquidations_update" ON public.budget_liquidations;
CREATE POLICY "liquidations_update" ON public.budget_liquidations
  FOR UPDATE TO authenticated USING (
    public.is_admin()
    OR public.is_cb()
    OR public.is_daaf()
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'en_attente'))
  );

-- ============================================
-- POLICIES: ORDONNANCEMENTS
-- ============================================

DROP POLICY IF EXISTS "ordonnancements_select" ON public.ordonnancements;
CREATE POLICY "ordonnancements_select" ON public.ordonnancements
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_dg()
    OR public.is_daaf()
    OR created_by = auth.uid()
    OR direction_id = public.get_user_direction_id()
  );

DROP POLICY IF EXISTS "ordonnancements_insert" ON public.ordonnancements;
CREATE POLICY "ordonnancements_insert" ON public.ordonnancements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.can_create_in_module('ordonnancements')
  );

DROP POLICY IF EXISTS "ordonnancements_update" ON public.ordonnancements;
CREATE POLICY "ordonnancements_update" ON public.ordonnancements
  FOR UPDATE TO authenticated USING (
    public.is_admin()
    OR public.is_daaf()
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'en_attente'))
  );

-- ============================================
-- POLICIES: REGLEMENTS
-- ============================================

DROP POLICY IF EXISTS "reglements_select" ON public.reglements;
CREATE POLICY "reglements_select" ON public.reglements
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_dg()
    OR public.is_tresorerie()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "reglements_insert" ON public.reglements;
CREATE POLICY "reglements_insert" ON public.reglements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.is_tresorerie()
  );

DROP POLICY IF EXISTS "reglements_update" ON public.reglements;
CREATE POLICY "reglements_update" ON public.reglements
  FOR UPDATE TO authenticated USING (
    public.is_admin()
    OR public.is_tresorerie()
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'en_attente'))
  );

-- ============================================
-- POLICIES: IMPUTATIONS
-- ============================================

DROP POLICY IF EXISTS "imputations_select" ON public.imputations;
CREATE POLICY "imputations_select" ON public.imputations
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_dg()
    OR public.is_cb()
    OR created_by = auth.uid()
    OR direction_id = public.get_user_direction_id()
  );

DROP POLICY IF EXISTS "imputations_insert" ON public.imputations;
CREATE POLICY "imputations_insert" ON public.imputations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.can_create_in_module('imputation')
  );

DROP POLICY IF EXISTS "imputations_update" ON public.imputations;
CREATE POLICY "imputations_update" ON public.imputations
  FOR UPDATE TO authenticated USING (
    public.is_admin()
    OR public.is_cb()
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'en_attente'))
  );

-- ============================================
-- POLICIES: BUDGET LINES
-- ============================================

DROP POLICY IF EXISTS "budget_lines_select" ON public.budget_lines;
CREATE POLICY "budget_lines_select" ON public.budget_lines
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "budget_lines_all_admin" ON public.budget_lines;
CREATE POLICY "budget_lines_all_admin" ON public.budget_lines
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_daaf())
  WITH CHECK (public.is_admin() OR public.is_daaf());

-- ============================================
-- POLICIES: MARCHES
-- ============================================

DROP POLICY IF EXISTS "marches_select" ON public.marches;
CREATE POLICY "marches_select" ON public.marches
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_dg()
    OR created_by = auth.uid()
    OR direction_id = public.get_user_direction_id()
  );

DROP POLICY IF EXISTS "marches_insert" ON public.marches;
CREATE POLICY "marches_insert" ON public.marches
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.can_create_in_module('marches')
  );

DROP POLICY IF EXISTS "marches_update" ON public.marches;
CREATE POLICY "marches_update" ON public.marches
  FOR UPDATE TO authenticated USING (
    public.is_admin()
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'en_cours'))
  );

-- ============================================
-- COMMENTAIRE FINAL
-- ============================================
COMMENT ON FUNCTION public.is_admin() IS 'Vérifie si l''utilisateur courant est admin (profil_fonctionnel=Admin ou role=ADMIN)';
COMMENT ON FUNCTION public.is_dg() IS 'Vérifie si l''utilisateur courant est DG (role_hierarchique=DG ou role=DG)';
COMMENT ON FUNCTION public.can_validate_step(TEXT) IS 'Vérifie si l''utilisateur peut valider une étape workflow (SEF, AEF, ENG, LIQ, ORD, REG)';
COMMENT ON FUNCTION public.can_create_in_module(TEXT) IS 'Vérifie si l''utilisateur peut créer dans un module spécifique';
