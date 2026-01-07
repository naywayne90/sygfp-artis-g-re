-- =============================================
-- WORKFLOW PRESTATAIRES : Panier → Validation → Référentiel
-- =============================================

-- 1) Compléter la table prestataires (référentiel officiel)
ALTER TABLE public.prestataires
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS code_admission TEXT,
  ADD COLUMN IF NOT EXISTS code_comptable TEXT,
  ADD COLUMN IF NOT EXISTS rccm TEXT,
  ADD COLUMN IF NOT EXISTS cc TEXT;

-- Index pour filtrage rapide des prestataires actifs
CREATE INDEX IF NOT EXISTS idx_prestataires_statut ON public.prestataires(statut);

-- 2) Table prestataire_requests (Panier de demandes)
CREATE TABLE IF NOT EXISTS public.prestataire_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations du prestataire
  raison_sociale TEXT NOT NULL,
  secteur_principal_id UUID REFERENCES public.ref_secteurs_activite(id),
  secteur_secondaire_id UUID REFERENCES public.ref_secteurs_activite(id),
  adresse TEXT,
  email TEXT,
  telephone TEXT,
  ninea TEXT,
  rccm TEXT,
  cc TEXT,
  
  -- Informations bancaires (optionnel)
  rib_banque TEXT,
  rib_numero TEXT,
  rib_cle TEXT,
  
  -- Codes obligatoires
  code_admission TEXT,
  code_comptable TEXT,
  
  -- Workflow
  statut TEXT NOT NULL DEFAULT 'ENREGISTRE' CHECK (statut IN ('ENREGISTRE', 'EN_VERIF', 'VALIDE', 'REFUSE')),
  commentaire_controle TEXT,
  
  -- Traçabilité soumission
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_email TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  
  -- Traçabilité validation
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  
  -- Source de la demande
  source TEXT DEFAULT 'INTERNE' CHECK (source IN ('PUBLIC_LINK', 'INTERNE', 'IMPORT')),
  
  -- Lien vers le prestataire créé (après validation)
  prestataire_id UUID REFERENCES public.prestataires(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contrainte : au moins email ou téléphone
  CONSTRAINT check_contact CHECK (email IS NOT NULL OR telephone IS NOT NULL)
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at_prestataire_requests ON public.prestataire_requests;
CREATE TRIGGER set_updated_at_prestataire_requests
  BEFORE UPDATE ON public.prestataire_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_prestataire_requests_statut ON public.prestataire_requests(statut);
CREATE INDEX IF NOT EXISTS idx_prestataire_requests_submitted_by ON public.prestataire_requests(submitted_by);

-- RLS
ALTER TABLE public.prestataire_requests ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Lecture demandes prestataires pour authentifiés" ON public.prestataire_requests;
DROP POLICY IF EXISTS "Création demandes prestataires pour authentifiés" ON public.prestataire_requests;
DROP POLICY IF EXISTS "Modification demandes pour ADMIN" ON public.prestataire_requests;

-- Lecture pour tous les authentifiés
CREATE POLICY "Lecture demandes prestataires pour authentifiés"
  ON public.prestataire_requests FOR SELECT
  TO authenticated USING (true);

-- Création pour tous les authentifiés
CREATE POLICY "Création demandes prestataires pour authentifiés"
  ON public.prestataire_requests FOR INSERT
  TO authenticated WITH CHECK (true);

-- Modification pour ADMIN et SDMG (Services Généraux)
CREATE POLICY "Modification demandes pour ADMIN"
  ON public.prestataire_requests FOR UPDATE
  TO authenticated USING (
    public.has_role(auth.uid(), 'ADMIN') OR 
    public.has_role(auth.uid(), 'SDMG')
  );

-- 3) Fonction pour valider une demande et créer le prestataire
CREATE OR REPLACE FUNCTION public.validate_prestataire_request(
  p_request_id UUID,
  p_validator_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_prestataire_id UUID;
  v_code TEXT;
  v_count INTEGER;
BEGIN
  -- Récupérer la demande
  SELECT * INTO v_request FROM public.prestataire_requests WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée';
  END IF;
  
  IF v_request.statut NOT IN ('ENREGISTRE', 'EN_VERIF') THEN
    RAISE EXCEPTION 'Demande déjà traitée (statut: %)', v_request.statut;
  END IF;
  
  -- Générer un code prestataire unique
  SELECT COUNT(*) + 1 INTO v_count FROM public.prestataires;
  v_code := 'PREST-' || LPAD(v_count::TEXT, 5, '0');
  
  -- Créer le prestataire dans le référentiel officiel
  INSERT INTO public.prestataires (
    code,
    raison_sociale,
    secteur_principal_id,
    secteur_secondaire_id,
    adresse,
    email,
    telephone,
    ninea,
    rccm,
    cc,
    rib_banque,
    rib_numero,
    rib_cle,
    code_admission,
    code_comptable,
    statut,
    created_by,
    validated_by,
    validated_at
  ) VALUES (
    v_code,
    v_request.raison_sociale,
    v_request.secteur_principal_id,
    v_request.secteur_secondaire_id,
    v_request.adresse,
    v_request.email,
    v_request.telephone,
    v_request.ninea,
    v_request.rccm,
    v_request.cc,
    v_request.rib_banque,
    v_request.rib_numero,
    v_request.rib_cle,
    v_request.code_admission,
    v_request.code_comptable,
    'ACTIF',
    v_request.submitted_by,
    p_validator_id,
    now()
  ) RETURNING id INTO v_prestataire_id;
  
  -- Mettre à jour la demande
  UPDATE public.prestataire_requests
  SET 
    statut = 'VALIDE',
    validated_by = p_validator_id,
    validated_at = now(),
    prestataire_id = v_prestataire_id
  WHERE id = p_request_id;
  
  -- Log audit
  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    new_values
  ) VALUES (
    'prestataire_request',
    p_request_id,
    'VALIDE',
    p_validator_id,
    jsonb_build_object(
      'prestataire_id', v_prestataire_id,
      'raison_sociale', v_request.raison_sociale
    )
  );
  
  RETURN v_prestataire_id;
END;
$$;

-- 4) Fonction pour refuser une demande
CREATE OR REPLACE FUNCTION public.refuse_prestataire_request(
  p_request_id UUID,
  p_validator_id UUID,
  p_commentaire TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  IF p_commentaire IS NULL OR TRIM(p_commentaire) = '' THEN
    RAISE EXCEPTION 'Le commentaire est obligatoire pour un refus';
  END IF;
  
  SELECT * INTO v_request FROM public.prestataire_requests WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée';
  END IF;
  
  IF v_request.statut NOT IN ('ENREGISTRE', 'EN_VERIF') THEN
    RAISE EXCEPTION 'Demande déjà traitée';
  END IF;
  
  -- Mettre à jour la demande
  UPDATE public.prestataire_requests
  SET 
    statut = 'REFUSE',
    commentaire_controle = p_commentaire,
    validated_by = p_validator_id,
    validated_at = now()
  WHERE id = p_request_id;
  
  -- Log audit
  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    new_values
  ) VALUES (
    'prestataire_request',
    p_request_id,
    'REFUSE',
    p_validator_id,
    jsonb_build_object(
      'raison_sociale', v_request.raison_sociale,
      'commentaire', p_commentaire
    )
  );
  
  RETURN TRUE;
END;
$$;

-- 5) Vue pour les prestataires actifs uniquement (pour les selects)
CREATE OR REPLACE VIEW public.prestataires_actifs AS
SELECT * FROM public.prestataires WHERE statut = 'ACTIF';