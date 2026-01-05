-- =====================================================
-- SYGFP ARTI - Ajouts sans suppression de l'existant
-- =====================================================

-- 1. Table exercices_budgetaires (nouvelle)
CREATE TABLE IF NOT EXISTS public.exercices_budgetaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL UNIQUE,
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'en_cours', 'cloture', 'archive')),
  date_ouverture DATE,
  date_cloture DATE,
  est_actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index sur annee pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_exercices_budgetaires_annee ON public.exercices_budgetaires(annee);

-- 2. Améliorer user_roles existante avec colonnes supplémentaires
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Index pour recherche par utilisateur
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 3. Améliorer audit_logs avec colonne exercice si absente
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS exercice INTEGER;

-- 4. Ajouter colonne exercice_actif à profiles si absente
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exercice_actif INTEGER;

-- 5. Triggers pour updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_exercices_budgetaires_updated_at ON public.exercices_budgetaires;
CREATE TRIGGER set_exercices_budgetaires_updated_at
  BEFORE UPDATE ON public.exercices_budgetaires
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER set_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Enable RLS sur exercices_budgetaires
ALTER TABLE public.exercices_budgetaires ENABLE ROW LEVEL SECURITY;

-- 7. Policies pour exercices_budgetaires
CREATE POLICY "Everyone can view exercices_budgetaires"
  ON public.exercices_budgetaires FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage exercices_budgetaires"
  ON public.exercices_budgetaires FOR ALL
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- 8. Fonction helper pour vérifier multi-rôles
CREATE OR REPLACE FUNCTION public.user_has_any_role(p_user_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id 
    AND role = ANY(p_roles)
    AND (is_active IS NULL OR is_active = true)
    AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Insérer les exercices 2025 et 2026 (si non existants)
INSERT INTO public.exercices_budgetaires (annee, statut, date_ouverture, est_actif)
VALUES 
  (2025, 'en_cours', '2025-01-01', true),
  (2026, 'ouvert', '2026-01-01', true)
ON CONFLICT (annee) DO NOTHING;

-- 10. Fonction d'audit améliorée avec exercice
CREATE OR REPLACE FUNCTION public.log_audit_with_exercice(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_exercice INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (entity_type, entity_id, action, old_values, new_values, user_id, exercice)
  VALUES (p_entity_type, p_entity_id, p_action, p_old_values, p_new_values, auth.uid(), p_exercice)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;