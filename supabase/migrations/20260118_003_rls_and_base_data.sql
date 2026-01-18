-- ============================================
-- MIGRATION 003: RLS ET DONNÉES DE BASE
-- ============================================

-- ============================================
-- ACTIVATION RLS
-- ============================================
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_sef ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_aef ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLITIQUES RLS
-- ============================================

-- Exercices: lecture pour tous les authentifiés
CREATE POLICY "exercises_select_authenticated" ON public.exercises
  FOR SELECT TO authenticated USING (true);

-- Directions: lecture pour tous les authentifiés
CREATE POLICY "directions_select_authenticated" ON public.directions
  FOR SELECT TO authenticated USING (true);

-- Profiles: lecture pour tous, modification pour soi-même ou admin
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_level = 'ADMIN'
  ));

-- Fournisseurs: lecture pour tous, modification pour admin/daaf
CREATE POLICY "fournisseurs_select_authenticated" ON public.fournisseurs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "fournisseurs_insert_authorized" ON public.fournisseurs
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role_level IN ('ADMIN', 'DG') OR direction_id = (
      SELECT id FROM public.directions WHERE code = '02'
    ))
  ));

-- Notes SEF: DG voit tout, autres voient leur direction ou leurs propres notes
CREATE POLICY "notes_sef_select" ON public.notes_sef
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_level = 'DG')
    OR created_by = auth.uid()
    OR direction_id = (SELECT direction_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "notes_sef_insert" ON public.notes_sef
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notes_sef_update" ON public.notes_sef
  FOR UPDATE TO authenticated USING (
    (created_by = auth.uid() AND status = 'DRAFT')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_level = 'DG')
  );

-- Notes AEF: mêmes règles que SEF
CREATE POLICY "notes_aef_select" ON public.notes_aef
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_level = 'DG')
    OR created_by = auth.uid()
    OR direction_id = (SELECT direction_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "notes_aef_insert" ON public.notes_aef
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Budget lines: lecture pour tous, modification pour admin/daaf
CREATE POLICY "budget_lines_select" ON public.budget_lines
  FOR SELECT TO authenticated USING (true);

-- Attachments: voir si on a accès à l'entité parente
CREATE POLICY "attachments_select" ON public.attachments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "attachments_insert" ON public.attachments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "attachments_delete" ON public.attachments
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- Audit events: lecture pour tous
CREATE POLICY "audit_events_select" ON public.audit_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "audit_events_insert" ON public.audit_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- DONNÉES DE BASE
-- ============================================

-- Directions ARTI
INSERT INTO public.directions (code, name, short_name) VALUES
  ('01', 'Direction Générale', 'DG'),
  ('02', 'Direction des Affaires Administratives et Financières', 'DAAF'),
  ('03', 'Direction des Systèmes d''Information', 'DSI'),
  ('04', 'Direction du Contrôle et de la Régulation', 'DCR'),
  ('05', 'Direction de la Communication et des Relations Publiques', 'DCP'),
  ('06', 'Direction des Études et de la Planification', 'DEP'),
  ('07', 'Sous-Direction Comptabilité et Trésorerie', 'SDCT'),
  ('08', 'Sous-Direction Passation des Marchés', 'SDPM'),
  ('09', 'Sous-Direction des Ressources Humaines', 'SDRH'),
  ('10', 'Contrôleur Budgétaire', 'CB'),
  ('11', 'Agent Comptable / Trésorerie', 'AC')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name;

-- Exercice 2026 comme exercice courant
UPDATE public.exercises SET is_current = FALSE WHERE is_current = TRUE;

INSERT INTO public.exercises (year, label, status, start_date, end_date, is_current)
VALUES (2026, 'Exercice 2026', 'OPEN', '2026-01-01', '2026-12-31', TRUE)
ON CONFLICT (year) DO UPDATE SET
  status = 'OPEN',
  is_current = TRUE,
  updated_at = NOW();

-- ============================================
-- TRIGGER AUTO-CRÉATION PROFIL
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FONCTION EXERCICE COURANT
-- ============================================
CREATE OR REPLACE FUNCTION get_current_exercise_id()
RETURNS UUID AS $$
  SELECT id FROM public.exercises WHERE is_current = TRUE LIMIT 1;
$$ LANGUAGE sql STABLE;
