
-- =============================================
-- STRUCTURE PROGRAMMATIQUE DYNAMIQUE
-- =============================================

-- Table des Objectifs Stratégiques
CREATE TABLE public.objectifs_strategiques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  description TEXT,
  annee_debut INTEGER NOT NULL,
  annee_fin INTEGER NOT NULL,
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des Missions
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  est_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des Actions (liées à un OS et une Mission)
CREATE TABLE public.actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID NOT NULL REFERENCES public.objectifs_strategiques(id) ON DELETE RESTRICT,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  est_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(code, os_id)
);

-- Table des Activités
CREATE TABLE public.activites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  est_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(code, action_id)
);

-- Table des Sous-Activités
CREATE TABLE public.sous_activites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activite_id UUID NOT NULL REFERENCES public.activites(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  est_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(code, activite_id)
);

-- Ajout des colonnes manquantes à la table directions existante
ALTER TABLE public.directions 
ADD COLUMN IF NOT EXISTS sigle TEXT,
ADD COLUMN IF NOT EXISTS est_active BOOLEAN DEFAULT true;

-- Ajout des colonnes manquantes à la table profiles existante
DO $$ 
BEGIN
  -- Création des types ENUM s'ils n'existent pas
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_hierarchique') THEN
    CREATE TYPE role_hierarchique AS ENUM ('Agent', 'Chef de Service', 'Sous-Directeur', 'Directeur', 'DG');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profil_fonctionnel') THEN
    CREATE TYPE profil_fonctionnel AS ENUM ('Admin', 'Validateur', 'Operationnel', 'Controleur', 'Auditeur');
  END IF;
END $$;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS matricule TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS telephone TEXT,
ADD COLUMN IF NOT EXISTS role_hierarchique role_hierarchique DEFAULT 'Agent',
ADD COLUMN IF NOT EXISTS profil_fonctionnel profil_fonctionnel DEFAULT 'Operationnel';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Objectifs Stratégiques
ALTER TABLE public.objectifs_strategiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view objectifs_strategiques"
ON public.objectifs_strategiques FOR SELECT
USING (true);

CREATE POLICY "Admins can manage objectifs_strategiques"
ON public.objectifs_strategiques FOR ALL
USING (has_role(auth.uid(), 'ADMIN'));

-- Missions
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view missions"
ON public.missions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage missions"
ON public.missions FOR ALL
USING (has_role(auth.uid(), 'ADMIN'));

-- Actions
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view actions"
ON public.actions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage actions"
ON public.actions FOR ALL
USING (has_role(auth.uid(), 'ADMIN'));

-- Activités
ALTER TABLE public.activites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view activites"
ON public.activites FOR SELECT
USING (true);

CREATE POLICY "Admins can manage activites"
ON public.activites FOR ALL
USING (has_role(auth.uid(), 'ADMIN'));

-- Sous-Activités
ALTER TABLE public.sous_activites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view sous_activites"
ON public.sous_activites FOR SELECT
USING (true);

CREATE POLICY "Admins can manage sous_activites"
ON public.sous_activites FOR ALL
USING (has_role(auth.uid(), 'ADMIN'));

-- =============================================
-- TRIGGERS POUR UPDATED_AT
-- =============================================

CREATE TRIGGER update_objectifs_strategiques_updated_at
BEFORE UPDATE ON public.objectifs_strategiques
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_actions_updated_at
BEFORE UPDATE ON public.actions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activites_updated_at
BEFORE UPDATE ON public.activites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sous_activites_updated_at
BEFORE UPDATE ON public.sous_activites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEX POUR PERFORMANCE
-- =============================================

CREATE INDEX idx_actions_os_id ON public.actions(os_id);
CREATE INDEX idx_actions_mission_id ON public.actions(mission_id);
CREATE INDEX idx_activites_action_id ON public.activites(action_id);
CREATE INDEX idx_sous_activites_activite_id ON public.sous_activites(activite_id);
CREATE INDEX idx_profiles_direction_id ON public.profiles(direction_id);
