-- Table pour les délégations temporaires de pouvoir
CREATE TABLE IF NOT EXISTS public.delegations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delegateur_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delegataire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  perimetre TEXT[] NOT NULL DEFAULT '{}', -- ex: ['notes', 'engagements', 'liquidations']
  motif TEXT,
  est_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT delegation_dates_check CHECK (date_fin >= date_debut),
  CONSTRAINT delegation_different_users CHECK (delegateur_id != delegataire_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_delegations_delegateur ON public.delegations(delegateur_id);
CREATE INDEX IF NOT EXISTS idx_delegations_delegataire ON public.delegations(delegataire_id);
CREATE INDEX IF NOT EXISTS idx_delegations_dates ON public.delegations(date_debut, date_fin);

-- RLS
ALTER TABLE public.delegations ENABLE ROW LEVEL SECURITY;

-- Policies pour les délégations
CREATE POLICY "delegations_select_authenticated"
ON public.delegations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "delegations_insert_authenticated"
ON public.delegations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "delegations_update_authenticated"
ON public.delegations FOR UPDATE
TO authenticated
USING (true);

-- Fonction pour vérifier si un utilisateur a une délégation active
CREATE OR REPLACE FUNCTION public.has_active_delegation(
  p_delegataire_id UUID,
  p_perimetre TEXT DEFAULT NULL
)
RETURNS TABLE(delegateur_id UUID, delegateur_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.delegateur_id, p.full_name
  FROM delegations d
  JOIN profiles p ON p.id = d.delegateur_id
  WHERE d.delegataire_id = p_delegataire_id
    AND d.est_active = true
    AND CURRENT_DATE BETWEEN d.date_debut AND d.date_fin
    AND (p_perimetre IS NULL OR p_perimetre = ANY(d.perimetre));
END;
$$;

-- Ajout de données par défaut dans system_config si nécessaire
INSERT INTO public.system_config (key, label, value, category, description)
VALUES 
  ('format_numero_engagement', 'Format N° Engagement', '"ENG-{EXERCICE}-{SEQUENCE:5}"', 'numerotation', 'Format de numérotation des engagements'),
  ('format_numero_liquidation', 'Format N° Liquidation', '"LIQ-{EXERCICE}-{SEQUENCE:5}"', 'numerotation', 'Format de numérotation des liquidations'),
  ('format_numero_ordonnancement', 'Format N° Ordonnancement', '"ORD-{EXERCICE}-{SEQUENCE:5}"', 'numerotation', 'Format de numérotation des ordonnancements'),
  ('format_numero_note', 'Format N° Note', '"NOTE-{EXERCICE}-{SEQUENCE:4}"', 'numerotation', 'Format de numérotation des notes'),
  ('format_numero_marche', 'Format N° Marché', '"MARCH-{EXERCICE}-{SEQUENCE:4}"', 'numerotation', 'Format de numérotation des marchés'),
  ('seuil_alerte_budget', 'Seuil Alerte Budget (%)', '80', 'alertes', 'Pourcentage de consommation déclenchant une alerte'),
  ('seuil_critique_budget', 'Seuil Critique Budget (%)', '95', 'alertes', 'Pourcentage de consommation critique'),
  ('delai_validation_notes', 'Délai Validation Notes (jours)', '3', 'workflow', 'Délai maximum pour valider une note'),
  ('delai_validation_engagements', 'Délai Validation Engagements (jours)', '5', 'workflow', 'Délai maximum pour valider un engagement')
ON CONFLICT (key) DO NOTHING;

-- Trigger pour updated_at sur delegations
CREATE TRIGGER update_delegations_updated_at
  BEFORE UPDATE ON public.delegations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();