-- ============================================
-- MIGRATION: Caisses, Approvisionnements et Mouvements Trésorerie
-- PROMPT 32
-- ============================================

-- 1. Table CAISSES
CREATE TABLE IF NOT EXISTS public.caisses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  solde_initial NUMERIC(18,2) DEFAULT 0,
  solde_actuel NUMERIC(18,2) DEFAULT 0,
  devise VARCHAR(3) DEFAULT 'XAF',
  plafond NUMERIC(18,2), -- Plafond de caisse optionnel
  responsable_id UUID REFERENCES public.profiles(id),
  direction_id UUID REFERENCES public.directions(id),
  est_actif BOOLEAN DEFAULT true,

  -- Désactivation
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id),
  deactivation_reason TEXT,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_caisses_est_actif ON public.caisses(est_actif);
CREATE INDEX IF NOT EXISTS idx_caisses_direction ON public.caisses(direction_id);

-- RLS
ALTER TABLE public.caisses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view caisses" ON public.caisses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/DAAF/Tresorerie can manage caisses" ON public.caisses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        profil_fonctionnel IN ('Admin', 'DAAF', 'Tresorerie')
        OR role_hierarchique = 'DG'
      )
    )
  );

-- 2. Séquences pour approvisionnements
CREATE TABLE IF NOT EXISTS public.approvisionnement_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('BANK', 'CASH')),
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(annee, type)
);

-- 3. Table APPROVISIONNEMENTS (Entrées de fonds)
CREATE TABLE IF NOT EXISTS public.approvisionnements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('BANK', 'CASH')),

  -- Destination
  compte_bancaire_id UUID REFERENCES public.comptes_bancaires(id),
  caisse_id UUID REFERENCES public.caisses(id),

  -- Montant et date
  montant NUMERIC(18,2) NOT NULL CHECK (montant > 0),
  date_operation DATE NOT NULL DEFAULT CURRENT_DATE,
  date_valeur DATE,

  -- Origine
  origine_fonds_id UUID REFERENCES public.funding_sources(id),
  origine_fonds_code VARCHAR(50), -- Pour compatibilité legacy

  -- Références
  reference_piece VARCHAR(100),
  description TEXT,

  -- Pièces jointes
  pj_url TEXT,
  pj_filename VARCHAR(255),

  -- Traçabilité
  exercice INTEGER NOT NULL,
  statut VARCHAR(20) DEFAULT 'valide' CHECK (statut IN ('brouillon', 'valide', 'annule')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES public.profiles(id),

  -- Contrainte: soit compte_bancaire soit caisse selon le type
  CONSTRAINT check_destination CHECK (
    (type = 'BANK' AND compte_bancaire_id IS NOT NULL AND caisse_id IS NULL) OR
    (type = 'CASH' AND caisse_id IS NOT NULL AND compte_bancaire_id IS NULL)
  )
);

-- Index
CREATE INDEX IF NOT EXISTS idx_approvisionnements_type ON public.approvisionnements(type);
CREATE INDEX IF NOT EXISTS idx_approvisionnements_exercice ON public.approvisionnements(exercice);
CREATE INDEX IF NOT EXISTS idx_approvisionnements_compte ON public.approvisionnements(compte_bancaire_id);
CREATE INDEX IF NOT EXISTS idx_approvisionnements_caisse ON public.approvisionnements(caisse_id);
CREATE INDEX IF NOT EXISTS idx_approvisionnements_date ON public.approvisionnements(date_operation);

-- RLS
ALTER TABLE public.approvisionnements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approvisionnements" ON public.approvisionnements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/DAAF/Tresorerie can manage approvisionnements" ON public.approvisionnements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        profil_fonctionnel IN ('Admin', 'DAAF', 'Tresorerie')
        OR role_hierarchique = 'DG'
      )
    )
  );

-- 4. Séquences pour mouvements trésorerie
CREATE TABLE IF NOT EXISTS public.mouvement_tresorerie_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('BANK', 'CASH')),
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(annee, type)
);

-- 5. Table MOUVEMENTS TRESORERIE (unifie banque et caisse)
CREATE TABLE IF NOT EXISTS public.mouvements_tresorerie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('BANK', 'CASH')),
  sens VARCHAR(20) NOT NULL CHECK (sens IN ('ENTREE', 'SORTIE')),

  -- Source/Destination
  compte_bancaire_id UUID REFERENCES public.comptes_bancaires(id),
  caisse_id UUID REFERENCES public.caisses(id),

  -- Montant
  montant NUMERIC(18,2) NOT NULL CHECK (montant > 0),
  solde_avant NUMERIC(18,2),
  solde_apres NUMERIC(18,2),

  -- Date
  date_operation DATE NOT NULL DEFAULT CURRENT_DATE,
  date_valeur DATE,

  -- Détails
  libelle VARCHAR(500) NOT NULL,
  description TEXT,

  -- Origine des fonds (pour entrées)
  origine_fonds_id UUID REFERENCES public.funding_sources(id),
  origine_fonds_code VARCHAR(50),

  -- Références
  reference_piece VARCHAR(100),
  reference_externe VARCHAR(100),

  -- Liens
  approvisionnement_id UUID REFERENCES public.approvisionnements(id),
  reglement_id UUID REFERENCES public.reglements(id),
  recette_id UUID REFERENCES public.recettes(id),

  -- Pièces jointes
  pj_url TEXT,
  pj_filename VARCHAR(255),

  -- Traçabilité
  exercice INTEGER NOT NULL,
  statut VARCHAR(20) DEFAULT 'valide' CHECK (statut IN ('brouillon', 'valide', 'annule')),

  -- Rapprochement bancaire
  rapproche BOOLEAN DEFAULT false,
  date_rapprochement DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),

  -- Contrainte: soit compte_bancaire soit caisse selon le type
  CONSTRAINT check_mouvement_destination CHECK (
    (type = 'BANK' AND compte_bancaire_id IS NOT NULL AND caisse_id IS NULL) OR
    (type = 'CASH' AND caisse_id IS NOT NULL AND compte_bancaire_id IS NULL)
  )
);

-- Index
CREATE INDEX IF NOT EXISTS idx_mouvements_tresorerie_type ON public.mouvements_tresorerie(type);
CREATE INDEX IF NOT EXISTS idx_mouvements_tresorerie_sens ON public.mouvements_tresorerie(sens);
CREATE INDEX IF NOT EXISTS idx_mouvements_tresorerie_exercice ON public.mouvements_tresorerie(exercice);
CREATE INDEX IF NOT EXISTS idx_mouvements_tresorerie_compte ON public.mouvements_tresorerie(compte_bancaire_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_tresorerie_caisse ON public.mouvements_tresorerie(caisse_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_tresorerie_date ON public.mouvements_tresorerie(date_operation);

-- RLS
ALTER TABLE public.mouvements_tresorerie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mouvements_tresorerie" ON public.mouvements_tresorerie
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/DAAF/Tresorerie can manage mouvements_tresorerie" ON public.mouvements_tresorerie
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        profil_fonctionnel IN ('Admin', 'DAAF', 'Tresorerie')
        OR role_hierarchique = 'DG'
      )
    )
  );

-- 6. Fonction de génération de numéro d'approvisionnement
CREATE OR REPLACE FUNCTION generate_approvisionnement_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_prefix VARCHAR(10);
  v_numero INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM NEW.date_operation);
  v_prefix := CASE NEW.type WHEN 'BANK' THEN 'APB' ELSE 'APC' END;

  -- Incrémenter le compteur
  INSERT INTO public.approvisionnement_sequences (annee, type, dernier_numero)
  VALUES (v_annee, NEW.type, 1)
  ON CONFLICT (annee, type)
  DO UPDATE SET dernier_numero = approvisionnement_sequences.dernier_numero + 1, updated_at = NOW()
  RETURNING dernier_numero INTO v_numero;

  NEW.numero := v_prefix || '-' || v_annee || '-' || LPAD(v_numero::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_approvisionnement_numero ON public.approvisionnements;
CREATE TRIGGER trigger_generate_approvisionnement_numero
  BEFORE INSERT ON public.approvisionnements
  FOR EACH ROW
  WHEN (NEW.numero IS NULL)
  EXECUTE FUNCTION generate_approvisionnement_numero();

-- 7. Fonction de génération de numéro de mouvement trésorerie
CREATE OR REPLACE FUNCTION generate_mouvement_tresorerie_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_prefix VARCHAR(10);
  v_numero INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM NEW.date_operation);
  v_prefix := CASE NEW.type WHEN 'BANK' THEN 'MVB' ELSE 'MVC' END;

  -- Incrémenter le compteur
  INSERT INTO public.mouvement_tresorerie_sequences (annee, type, dernier_numero)
  VALUES (v_annee, NEW.type, 1)
  ON CONFLICT (annee, type)
  DO UPDATE SET dernier_numero = mouvement_tresorerie_sequences.dernier_numero + 1, updated_at = NOW()
  RETURNING dernier_numero INTO v_numero;

  NEW.numero := v_prefix || '-' || v_annee || '-' || LPAD(v_numero::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_mouvement_tresorerie_numero ON public.mouvements_tresorerie;
CREATE TRIGGER trigger_generate_mouvement_tresorerie_numero
  BEFORE INSERT ON public.mouvements_tresorerie
  FOR EACH ROW
  WHEN (NEW.numero IS NULL)
  EXECUTE FUNCTION generate_mouvement_tresorerie_numero();

-- 8. Fonction de mise à jour des soldes
CREATE OR REPLACE FUNCTION update_solde_mouvement_tresorerie()
RETURNS TRIGGER AS $$
DECLARE
  v_solde_avant NUMERIC(18,2);
BEGIN
  -- Récupérer le solde actuel
  IF NEW.type = 'BANK' THEN
    SELECT solde_actuel INTO v_solde_avant
    FROM public.comptes_bancaires
    WHERE id = NEW.compte_bancaire_id;
  ELSE
    SELECT solde_actuel INTO v_solde_avant
    FROM public.caisses
    WHERE id = NEW.caisse_id;
  END IF;

  NEW.solde_avant := COALESCE(v_solde_avant, 0);

  -- Calculer le nouveau solde
  IF NEW.sens = 'ENTREE' THEN
    NEW.solde_apres := NEW.solde_avant + NEW.montant;
  ELSE
    NEW.solde_apres := NEW.solde_avant - NEW.montant;
  END IF;

  -- Mettre à jour le solde du compte/caisse
  IF NEW.type = 'BANK' THEN
    UPDATE public.comptes_bancaires
    SET solde_actuel = NEW.solde_apres, updated_at = NOW()
    WHERE id = NEW.compte_bancaire_id;
  ELSE
    UPDATE public.caisses
    SET solde_actuel = NEW.solde_apres, updated_at = NOW()
    WHERE id = NEW.caisse_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_solde_mouvement ON public.mouvements_tresorerie;
CREATE TRIGGER trigger_update_solde_mouvement
  BEFORE INSERT ON public.mouvements_tresorerie
  FOR EACH ROW
  EXECUTE FUNCTION update_solde_mouvement_tresorerie();

-- 9. Fonction de mise à jour solde approvisionnement
CREATE OR REPLACE FUNCTION update_solde_approvisionnement()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le solde du compte/caisse
  IF NEW.type = 'BANK' THEN
    UPDATE public.comptes_bancaires
    SET solde_actuel = solde_actuel + NEW.montant, updated_at = NOW()
    WHERE id = NEW.compte_bancaire_id;
  ELSE
    UPDATE public.caisses
    SET solde_actuel = solde_actuel + NEW.montant, updated_at = NOW()
    WHERE id = NEW.caisse_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_solde_approvisionnement ON public.approvisionnements;
CREATE TRIGGER trigger_update_solde_approvisionnement
  AFTER INSERT ON public.approvisionnements
  FOR EACH ROW
  WHEN (NEW.statut = 'valide')
  EXECUTE FUNCTION update_solde_approvisionnement();

-- 10. Fonctions RPC pour désactivation/réactivation des caisses
CREATE OR REPLACE FUNCTION deactivate_caisse(
  p_caisse_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS public.caisses AS $$
DECLARE
  v_caisse public.caisses;
BEGIN
  UPDATE public.caisses
  SET
    est_actif = false,
    deactivated_at = NOW(),
    deactivated_by = auth.uid(),
    deactivation_reason = COALESCE(p_reason, 'Désactivation manuelle'),
    updated_at = NOW()
  WHERE id = p_caisse_id
  RETURNING * INTO v_caisse;

  IF v_caisse IS NULL THEN
    RAISE EXCEPTION 'Caisse non trouvée: %', p_caisse_id;
  END IF;

  RETURN v_caisse;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reactivate_caisse(
  p_caisse_id UUID
) RETURNS public.caisses AS $$
DECLARE
  v_caisse public.caisses;
BEGIN
  UPDATE public.caisses
  SET
    est_actif = true,
    deactivated_at = NULL,
    deactivated_by = NULL,
    deactivation_reason = NULL,
    updated_at = NOW()
  WHERE id = p_caisse_id
  RETURNING * INTO v_caisse;

  IF v_caisse IS NULL THEN
    RAISE EXCEPTION 'Caisse non trouvée: %', p_caisse_id;
  END IF;

  RETURN v_caisse;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Données de démo (caisses)
INSERT INTO public.caisses (code, libelle, description, solde_initial, solde_actuel, devise)
SELECT 'CAISSE-CENT', 'Caisse Centrale', 'Caisse principale de l''ARTI', 0, 0, 'XAF'
WHERE NOT EXISTS (SELECT 1 FROM public.caisses WHERE code = 'CAISSE-CENT');

INSERT INTO public.caisses (code, libelle, description, solde_initial, solde_actuel, devise)
SELECT 'CAISSE-MEN', 'Caisse Menues Dépenses', 'Caisse pour dépenses courantes', 0, 0, 'XAF'
WHERE NOT EXISTS (SELECT 1 FROM public.caisses WHERE code = 'CAISSE-MEN');

-- Commentaires
COMMENT ON TABLE public.caisses IS 'Caisses de trésorerie';
COMMENT ON TABLE public.approvisionnements IS 'Approvisionnements des comptes bancaires et caisses';
COMMENT ON TABLE public.mouvements_tresorerie IS 'Mouvements (entrées/sorties) des comptes bancaires et caisses';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
