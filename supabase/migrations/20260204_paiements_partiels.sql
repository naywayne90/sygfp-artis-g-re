-- Migration: Système de Paiements Partiels
-- Date: 2026-02-04
-- Description: Ajoute le support des paiements partiels avec mouvements bancaires multiples
-- Basé sur l'analyse de l'ancien SYGFP (arti-ci.com:8001)

-- ============================================================================
-- TABLE: comptes_bancaires (référentiel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS comptes_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  libelle TEXT NOT NULL,
  type_compte TEXT NOT NULL CHECK (type_compte IN ('tresor', 'commercial', 'autre')),
  banque TEXT,
  numero_compte TEXT,
  est_actif BOOLEAN DEFAULT true,
  solde_initial NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les comptes bancaires de l'ancien système
INSERT INTO comptes_bancaires (code, libelle, type_compte, banque, est_actif) VALUES
  ('FISCALITE-CST-BDT', 'Fiscalité - Compte Spécial du Trésor BDT', 'tresor', 'Banque des Dépôts du Trésor', true),
  ('SUBVENTION-BDT', 'Subvention - Banque des Dépôts du Trésor', 'tresor', 'Banque des Dépôts du Trésor', true),
  ('BHCI', 'Banque de l''Habitat de Côte d''Ivoire', 'commercial', 'BHCI', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- TABLE: mouvements_bancaires (paiements partiels)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mouvements_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reglement_id UUID NOT NULL REFERENCES reglements(id) ON DELETE CASCADE,
  compte_bancaire_id UUID REFERENCES comptes_bancaires(id),
  compte_bancaire_code TEXT NOT NULL, -- Code pour compatibilité
  montant NUMERIC(15,2) NOT NULL CHECK (montant > 0),
  reference TEXT NOT NULL, -- Numéro de référence bancaire
  objet TEXT,
  piece_justificative_url TEXT, -- URL du PDF justificatif
  date_reglement DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte: référence unique par compte
  UNIQUE(compte_bancaire_code, reference)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_mouvements_bancaires_reglement ON mouvements_bancaires(reglement_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_bancaires_compte ON mouvements_bancaires(compte_bancaire_code);
CREATE INDEX IF NOT EXISTS idx_mouvements_bancaires_date ON mouvements_bancaires(date_reglement);

-- ============================================================================
-- FONCTION: Calculer le statut de paiement d'un règlement
-- ============================================================================
CREATE OR REPLACE FUNCTION get_statut_paiement(p_reglement_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_montant_total NUMERIC(15,2);
  v_montant_paye NUMERIC(15,2);
BEGIN
  -- Récupérer le montant total du règlement
  SELECT COALESCE(montant_ttc, montant_ht, 0) INTO v_montant_total
  FROM reglements WHERE id = p_reglement_id;

  -- Calculer la somme des mouvements
  SELECT COALESCE(SUM(montant), 0) INTO v_montant_paye
  FROM mouvements_bancaires WHERE reglement_id = p_reglement_id;

  -- Déterminer le statut
  IF v_montant_paye = 0 THEN
    RETURN 'non_effectue';
  ELSIF v_montant_paye < v_montant_total THEN
    RETURN 'partiel';
  ELSE
    RETURN 'total';
  END IF;
END;
$$;

-- ============================================================================
-- FONCTION: Calculer le reste à payer
-- ============================================================================
CREATE OR REPLACE FUNCTION get_reste_a_payer(p_reglement_id UUID)
RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_montant_total NUMERIC(15,2);
  v_montant_paye NUMERIC(15,2);
BEGIN
  SELECT COALESCE(montant_ttc, montant_ht, 0) INTO v_montant_total
  FROM reglements WHERE id = p_reglement_id;

  SELECT COALESCE(SUM(montant), 0) INTO v_montant_paye
  FROM mouvements_bancaires WHERE reglement_id = p_reglement_id;

  RETURN GREATEST(v_montant_total - v_montant_paye, 0);
END;
$$;

-- ============================================================================
-- VUE: Règlements avec informations de paiement
-- ============================================================================
CREATE OR REPLACE VIEW v_reglements_paiements AS
SELECT
  r.id,
  r.numero_reglement,
  r.ordonnancement_id,
  r.montant_ht,
  r.montant_ttc,
  r.date_reglement,
  r.statut,
  r.exercice_id,
  r.created_at,

  -- Informations de paiement calculées
  COALESCE(SUM(m.montant), 0) as montant_paye,
  COALESCE(r.montant_ttc, r.montant_ht, 0) - COALESCE(SUM(m.montant), 0) as reste_a_payer,
  COUNT(m.id) as nombre_mouvements,

  -- Statut de paiement
  CASE
    WHEN COALESCE(SUM(m.montant), 0) = 0 THEN 'non_effectue'
    WHEN COALESCE(SUM(m.montant), 0) < COALESCE(r.montant_ttc, r.montant_ht, 0) THEN 'partiel'
    ELSE 'total'
  END as statut_paiement,

  -- Dernier mouvement
  MAX(m.date_reglement) as date_dernier_paiement

FROM reglements r
LEFT JOIN mouvements_bancaires m ON r.id = m.reglement_id
GROUP BY r.id, r.numero_reglement, r.ordonnancement_id, r.montant_ht,
         r.montant_ttc, r.date_reglement, r.statut, r.exercice_id, r.created_at;

-- ============================================================================
-- VUE: Détails mouvements par règlement
-- ============================================================================
CREATE OR REPLACE VIEW v_mouvements_details AS
SELECT
  m.id,
  m.reglement_id,
  m.compte_bancaire_code,
  cb.libelle as compte_bancaire_libelle,
  cb.banque,
  m.montant,
  m.reference,
  m.objet,
  m.piece_justificative_url,
  m.date_reglement,
  m.created_at,
  m.created_by,
  p.full_name as created_by_name,

  -- Infos règlement
  r.numero_reglement,
  COALESCE(r.montant_ttc, r.montant_ht) as montant_total_reglement

FROM mouvements_bancaires m
LEFT JOIN comptes_bancaires cb ON m.compte_bancaire_code = cb.code
LEFT JOIN reglements r ON m.reglement_id = r.id
LEFT JOIN profiles p ON m.created_by = p.id;

-- ============================================================================
-- FONCTION RPC: Ajouter un mouvement bancaire avec validation
-- ============================================================================
CREATE OR REPLACE FUNCTION add_mouvement_bancaire(
  p_reglement_id UUID,
  p_compte_bancaire_code TEXT,
  p_montant NUMERIC(15,2),
  p_reference TEXT,
  p_objet TEXT DEFAULT NULL,
  p_piece_justificative_url TEXT DEFAULT NULL,
  p_date_reglement DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reste_a_payer NUMERIC(15,2);
  v_new_id UUID;
  v_compte_id UUID;
BEGIN
  -- Vérifier que le règlement existe
  IF NOT EXISTS (SELECT 1 FROM reglements WHERE id = p_reglement_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Règlement non trouvé');
  END IF;

  -- Vérifier que le compte bancaire existe
  SELECT id INTO v_compte_id FROM comptes_bancaires WHERE code = p_compte_bancaire_code;
  IF v_compte_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Compte bancaire non trouvé');
  END IF;

  -- Calculer le reste à payer
  v_reste_a_payer := get_reste_a_payer(p_reglement_id);

  -- Vérifier que le montant ne dépasse pas le reste à payer
  IF p_montant > v_reste_a_payer THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Le montant (%s) dépasse le reste à payer (%s)', p_montant, v_reste_a_payer)
    );
  END IF;

  -- Insérer le mouvement
  INSERT INTO mouvements_bancaires (
    reglement_id,
    compte_bancaire_id,
    compte_bancaire_code,
    montant,
    reference,
    objet,
    piece_justificative_url,
    date_reglement,
    created_by
  ) VALUES (
    p_reglement_id,
    v_compte_id,
    p_compte_bancaire_code,
    p_montant,
    p_reference,
    p_objet,
    p_piece_justificative_url,
    p_date_reglement,
    auth.uid()
  )
  RETURNING id INTO v_new_id;

  -- Mettre à jour le statut du règlement si paiement complet
  IF get_reste_a_payer(p_reglement_id) = 0 THEN
    UPDATE reglements
    SET statut = 'valide',
        updated_at = NOW()
    WHERE id = p_reglement_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'mouvement_id', v_new_id,
    'nouveau_reste', get_reste_a_payer(p_reglement_id),
    'statut_paiement', get_statut_paiement(p_reglement_id)
  );
END;
$$;

-- ============================================================================
-- FONCTION RPC: Obtenir les statistiques de paiement
-- ============================================================================
CREATE OR REPLACE FUNCTION get_stats_paiements(p_exercice_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_reglements', COUNT(*),
    'montant_total', SUM(COALESCE(montant_ttc, montant_ht, 0)),
    'reglements_total', COUNT(*) FILTER (WHERE get_statut_paiement(id) = 'total'),
    'reglements_partiel', COUNT(*) FILTER (WHERE get_statut_paiement(id) = 'partiel'),
    'reglements_non_effectue', COUNT(*) FILTER (WHERE get_statut_paiement(id) = 'non_effectue'),
    'montant_paye', (
      SELECT COALESCE(SUM(montant), 0)
      FROM mouvements_bancaires mb
      JOIN reglements r2 ON mb.reglement_id = r2.id
      WHERE p_exercice_id IS NULL OR r2.exercice_id = p_exercice_id
    ),
    'montant_reste', SUM(get_reste_a_payer(id))
  ) INTO v_result
  FROM reglements r
  WHERE p_exercice_id IS NULL OR r.exercice_id = p_exercice_id;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE mouvements_bancaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes_bancaires ENABLE ROW LEVEL SECURITY;

-- Politique lecture: tous les utilisateurs authentifiés
CREATE POLICY "Lecture mouvements bancaires" ON mouvements_bancaires
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lecture comptes bancaires" ON comptes_bancaires
  FOR SELECT TO authenticated USING (true);

-- Politique insertion: utilisateurs avec rôle approprié
CREATE POLICY "Insertion mouvements bancaires" ON mouvements_bancaires
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'validateur', 'operationnel'))
    )
  );

-- Politique update: créateur ou admin
CREATE POLICY "Update mouvements bancaires" ON mouvements_bancaires
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_mouvements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mouvements_updated_at
  BEFORE UPDATE ON mouvements_bancaires
  FOR EACH ROW
  EXECUTE FUNCTION update_mouvements_updated_at();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON TABLE mouvements_bancaires IS 'Mouvements bancaires pour les paiements partiels des règlements';
COMMENT ON TABLE comptes_bancaires IS 'Référentiel des comptes bancaires disponibles pour les paiements';
COMMENT ON VIEW v_reglements_paiements IS 'Vue agrégée des règlements avec statut de paiement';
COMMENT ON VIEW v_mouvements_details IS 'Vue détaillée des mouvements bancaires avec informations enrichies';
COMMENT ON FUNCTION add_mouvement_bancaire IS 'Ajoute un mouvement bancaire avec validation du montant';
COMMENT ON FUNCTION get_statut_paiement IS 'Retourne le statut de paiement: non_effectue, partiel, total';
COMMENT ON FUNCTION get_reste_a_payer IS 'Calcule le montant restant à payer pour un règlement';
