-- Migration: Réaménagement Budgétaire
-- Date: 2026-02-04
-- Description: Ajoute le système de transfert budgétaire entre imputations
-- Basé sur l'analyse de l'ancien SYGFP (arti-ci.com:8001)

-- ============================================================================
-- TABLE: reamenagements_budgetaires
-- ============================================================================
CREATE TABLE IF NOT EXISTS reamenagements_budgetaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercice_id UUID REFERENCES exercices(id),

  -- Imputation Source
  imputation_source TEXT NOT NULL,
  nature_nbe_source TEXT,
  libelle_source TEXT,
  budget_source_avant NUMERIC(15,2) NOT NULL,
  budget_source_apres NUMERIC(15,2) NOT NULL,

  -- Imputation Destination
  imputation_destination TEXT NOT NULL,
  nature_nbe_destination TEXT,
  libelle_destination TEXT,
  budget_destination_avant NUMERIC(15,2) NOT NULL,
  budget_destination_apres NUMERIC(15,2) NOT NULL,

  -- Montant transféré
  montant NUMERIC(15,2) NOT NULL CHECK (montant > 0),

  -- Justification
  motif TEXT NOT NULL,
  reference_note TEXT, -- Référence de la note autorisant le réaménagement

  -- Statut et validation
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
  valide_par UUID REFERENCES profiles(id),
  date_validation TIMESTAMP WITH TIME ZONE,
  motif_rejet TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte: source et destination différentes
  CONSTRAINT chk_imputations_differentes CHECK (imputation_source != imputation_destination)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_reamenagements_exercice ON reamenagements_budgetaires(exercice_id);
CREATE INDEX IF NOT EXISTS idx_reamenagements_source ON reamenagements_budgetaires(imputation_source);
CREATE INDEX IF NOT EXISTS idx_reamenagements_destination ON reamenagements_budgetaires(imputation_destination);
CREATE INDEX IF NOT EXISTS idx_reamenagements_statut ON reamenagements_budgetaires(statut);
CREATE INDEX IF NOT EXISTS idx_reamenagements_date ON reamenagements_budgetaires(created_at);

-- ============================================================================
-- FONCTION: Obtenir le budget actuel d'une imputation
-- ============================================================================
CREATE OR REPLACE FUNCTION get_budget_imputation(
  p_imputation TEXT,
  p_exercice_id UUID DEFAULT NULL
)
RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_budget_initial NUMERIC(15,2) := 0;
  v_reamenagements_in NUMERIC(15,2) := 0;
  v_reamenagements_out NUMERIC(15,2) := 0;
BEGIN
  -- Budget initial depuis imputations budgétaires
  SELECT COALESCE(ib.montant_initial, 0)
  INTO v_budget_initial
  FROM imputations_budgetaires ib
  WHERE ib.code_imputation = p_imputation
    AND (p_exercice_id IS NULL OR ib.exercice_id = p_exercice_id);

  -- Réaménagements entrants (validés)
  SELECT COALESCE(SUM(montant), 0)
  INTO v_reamenagements_in
  FROM reamenagements_budgetaires
  WHERE imputation_destination = p_imputation
    AND statut = 'valide'
    AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id);

  -- Réaménagements sortants (validés)
  SELECT COALESCE(SUM(montant), 0)
  INTO v_reamenagements_out
  FROM reamenagements_budgetaires
  WHERE imputation_source = p_imputation
    AND statut = 'valide'
    AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id);

  RETURN v_budget_initial + v_reamenagements_in - v_reamenagements_out;
END;
$$;

-- ============================================================================
-- FONCTION: Obtenir le cumul des engagements d'une imputation
-- ============================================================================
CREATE OR REPLACE FUNCTION get_cumul_engagements_imputation(
  p_imputation TEXT,
  p_exercice_id UUID DEFAULT NULL
)
RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_cumul NUMERIC(15,2) := 0;
BEGIN
  SELECT COALESCE(SUM(COALESCE(e.montant_ttc, e.montant_ht, 0)), 0)
  INTO v_cumul
  FROM engagements e
  WHERE e.code_imputation = p_imputation
    AND e.statut != 'rejete'
    AND (p_exercice_id IS NULL OR e.exercice_id = p_exercice_id);

  RETURN v_cumul;
END;
$$;

-- ============================================================================
-- FONCTION: Obtenir le disponible budgétaire d'une imputation
-- ============================================================================
CREATE OR REPLACE FUNCTION get_disponible_imputation(
  p_imputation TEXT,
  p_exercice_id UUID DEFAULT NULL
)
RETURNS NUMERIC(15,2)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN get_budget_imputation(p_imputation, p_exercice_id)
       - get_cumul_engagements_imputation(p_imputation, p_exercice_id);
END;
$$;

-- ============================================================================
-- FONCTION RPC: Créer un réaménagement budgétaire
-- ============================================================================
CREATE OR REPLACE FUNCTION create_reamenagement_budgetaire(
  p_imputation_source TEXT,
  p_imputation_destination TEXT,
  p_montant NUMERIC(15,2),
  p_motif TEXT,
  p_reference_note TEXT DEFAULT NULL,
  p_exercice_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_budget_source NUMERIC(15,2);
  v_disponible_source NUMERIC(15,2);
  v_budget_destination NUMERIC(15,2);
  v_new_id UUID;
  v_exercice_id UUID;
  v_nbe_source TEXT;
  v_nbe_dest TEXT;
  v_libelle_source TEXT;
  v_libelle_dest TEXT;
BEGIN
  -- Utiliser l'exercice courant si non spécifié
  IF p_exercice_id IS NULL THEN
    SELECT id INTO v_exercice_id FROM exercices WHERE est_courant = true LIMIT 1;
  ELSE
    v_exercice_id := p_exercice_id;
  END IF;

  -- Vérifier que les imputations sont différentes
  IF p_imputation_source = p_imputation_destination THEN
    RETURN jsonb_build_object('success', false, 'error', 'Les imputations source et destination doivent être différentes');
  END IF;

  -- Vérifier que le montant est positif
  IF p_montant <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le montant doit être positif');
  END IF;

  -- Récupérer les informations de l'imputation source
  SELECT
    ib.montant_initial,
    ib.nature_economique,
    COALESCE(a.libelle, 'N/A')
  INTO v_budget_source, v_nbe_source, v_libelle_source
  FROM imputations_budgetaires ib
  LEFT JOIN activites a ON ib.activite_id = a.id
  WHERE ib.code_imputation = p_imputation_source
    AND (v_exercice_id IS NULL OR ib.exercice_id = v_exercice_id);

  IF v_budget_source IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Imputation source non trouvée');
  END IF;

  -- Calculer le budget actuel et le disponible de la source
  v_budget_source := get_budget_imputation(p_imputation_source, v_exercice_id);
  v_disponible_source := get_disponible_imputation(p_imputation_source, v_exercice_id);

  -- Vérifier que le montant ne dépasse pas le disponible
  IF p_montant > v_disponible_source THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Montant (%s) supérieur au disponible (%s)', p_montant, v_disponible_source),
      'disponible', v_disponible_source
    );
  END IF;

  -- Récupérer les informations de l'imputation destination
  SELECT
    ib.montant_initial,
    ib.nature_economique,
    COALESCE(a.libelle, 'N/A')
  INTO v_budget_destination, v_nbe_dest, v_libelle_dest
  FROM imputations_budgetaires ib
  LEFT JOIN activites a ON ib.activite_id = a.id
  WHERE ib.code_imputation = p_imputation_destination
    AND (v_exercice_id IS NULL OR ib.exercice_id = v_exercice_id);

  IF v_budget_destination IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Imputation destination non trouvée');
  END IF;

  v_budget_destination := get_budget_imputation(p_imputation_destination, v_exercice_id);

  -- Créer le réaménagement
  INSERT INTO reamenagements_budgetaires (
    exercice_id,
    imputation_source,
    nature_nbe_source,
    libelle_source,
    budget_source_avant,
    budget_source_apres,
    imputation_destination,
    nature_nbe_destination,
    libelle_destination,
    budget_destination_avant,
    budget_destination_apres,
    montant,
    motif,
    reference_note,
    statut,
    created_by
  ) VALUES (
    v_exercice_id,
    p_imputation_source,
    v_nbe_source,
    v_libelle_source,
    v_budget_source,
    v_budget_source - p_montant,
    p_imputation_destination,
    v_nbe_dest,
    v_libelle_dest,
    v_budget_destination,
    v_budget_destination + p_montant,
    p_montant,
    p_motif,
    p_reference_note,
    'en_attente',
    auth.uid()
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'reamenagement_id', v_new_id,
    'budget_source_avant', v_budget_source,
    'budget_source_apres', v_budget_source - p_montant,
    'budget_destination_avant', v_budget_destination,
    'budget_destination_apres', v_budget_destination + p_montant
  );
END;
$$;

-- ============================================================================
-- FONCTION RPC: Valider un réaménagement budgétaire
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_reamenagement_budgetaire(
  p_reamenagement_id UUID,
  p_action TEXT, -- 'valider' ou 'rejeter'
  p_motif_rejet TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reamenagement RECORD;
  v_disponible_source NUMERIC(15,2);
BEGIN
  -- Récupérer le réaménagement
  SELECT * INTO v_reamenagement
  FROM reamenagements_budgetaires
  WHERE id = p_reamenagement_id;

  IF v_reamenagement IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Réaménagement non trouvé');
  END IF;

  -- Vérifier le statut actuel
  IF v_reamenagement.statut != 'en_attente' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce réaménagement a déjà été traité');
  END IF;

  IF p_action = 'valider' THEN
    -- Vérifier à nouveau le disponible (au cas où d'autres engagements ont été faits)
    v_disponible_source := get_disponible_imputation(
      v_reamenagement.imputation_source,
      v_reamenagement.exercice_id
    );

    IF v_reamenagement.montant > v_disponible_source THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Le disponible actuel (%s) est insuffisant pour ce réaménagement (%s)',
                        v_disponible_source, v_reamenagement.montant)
      );
    END IF;

    -- Valider le réaménagement
    UPDATE reamenagements_budgetaires
    SET statut = 'valide',
        valide_par = auth.uid(),
        date_validation = NOW(),
        updated_at = NOW()
    WHERE id = p_reamenagement_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Réaménagement validé avec succès',
      'nouveau_budget_source', get_budget_imputation(v_reamenagement.imputation_source, v_reamenagement.exercice_id),
      'nouveau_budget_destination', get_budget_imputation(v_reamenagement.imputation_destination, v_reamenagement.exercice_id)
    );

  ELSIF p_action = 'rejeter' THEN
    -- Rejeter le réaménagement
    UPDATE reamenagements_budgetaires
    SET statut = 'rejete',
        valide_par = auth.uid(),
        date_validation = NOW(),
        motif_rejet = p_motif_rejet,
        updated_at = NOW()
    WHERE id = p_reamenagement_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Réaménagement rejeté'
    );

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Action non reconnue. Utilisez valider ou rejeter');
  END IF;
END;
$$;

-- ============================================================================
-- VUE: Réaménagements avec détails
-- ============================================================================
CREATE OR REPLACE VIEW v_reamenagements_details AS
SELECT
  r.id,
  r.exercice_id,
  e.libelle as exercice_libelle,

  -- Source
  r.imputation_source,
  r.nature_nbe_source,
  r.libelle_source,
  r.budget_source_avant,
  r.budget_source_apres,

  -- Destination
  r.imputation_destination,
  r.nature_nbe_destination,
  r.libelle_destination,
  r.budget_destination_avant,
  r.budget_destination_apres,

  -- Transfert
  r.montant,
  r.motif,
  r.reference_note,

  -- Statut
  r.statut,
  r.valide_par,
  pv.full_name as valide_par_nom,
  r.date_validation,
  r.motif_rejet,

  -- Audit
  r.created_at,
  r.created_by,
  pc.full_name as created_by_nom

FROM reamenagements_budgetaires r
LEFT JOIN exercices e ON r.exercice_id = e.id
LEFT JOIN profiles pv ON r.valide_par = pv.id
LEFT JOIN profiles pc ON r.created_by = pc.id;

-- ============================================================================
-- VUE: État d'exécution par imputation (avec réaménagements)
-- ============================================================================
CREATE OR REPLACE VIEW v_etat_execution_imputation AS
SELECT
  ib.id,
  ib.code_imputation,
  ib.exercice_id,
  ib.nature_economique,
  a.libelle as libelle_activite,
  os.libelle as libelle_os,

  -- Budget
  ib.montant_initial as budget_initial,
  COALESCE(ib.montant_reporte, 0) as budget_reporte,

  -- Réaménagements
  COALESCE((
    SELECT SUM(montant) FROM reamenagements_budgetaires
    WHERE imputation_destination = ib.code_imputation
      AND exercice_id = ib.exercice_id
      AND statut = 'valide'
  ), 0) as reamenagements_entrants,

  COALESCE((
    SELECT SUM(montant) FROM reamenagements_budgetaires
    WHERE imputation_source = ib.code_imputation
      AND exercice_id = ib.exercice_id
      AND statut = 'valide'
  ), 0) as reamenagements_sortants,

  -- Budget actuel
  ib.montant_initial
    + COALESCE(ib.montant_reporte, 0)
    + COALESCE((
        SELECT SUM(montant) FROM reamenagements_budgetaires
        WHERE imputation_destination = ib.code_imputation
          AND exercice_id = ib.exercice_id AND statut = 'valide'
      ), 0)
    - COALESCE((
        SELECT SUM(montant) FROM reamenagements_budgetaires
        WHERE imputation_source = ib.code_imputation
          AND exercice_id = ib.exercice_id AND statut = 'valide'
      ), 0)
  as budget_actuel,

  -- Cumul engagements
  COALESCE((
    SELECT SUM(COALESCE(montant_ttc, montant_ht, 0))
    FROM engagements
    WHERE code_imputation = ib.code_imputation
      AND exercice_id = ib.exercice_id
      AND statut != 'rejete'
  ), 0) as cumul_engagements,

  -- Disponible (calculé)
  ib.montant_initial
    + COALESCE(ib.montant_reporte, 0)
    + COALESCE((
        SELECT SUM(montant) FROM reamenagements_budgetaires
        WHERE imputation_destination = ib.code_imputation
          AND exercice_id = ib.exercice_id AND statut = 'valide'
      ), 0)
    - COALESCE((
        SELECT SUM(montant) FROM reamenagements_budgetaires
        WHERE imputation_source = ib.code_imputation
          AND exercice_id = ib.exercice_id AND statut = 'valide'
      ), 0)
    - COALESCE((
        SELECT SUM(COALESCE(montant_ttc, montant_ht, 0))
        FROM engagements
        WHERE code_imputation = ib.code_imputation
          AND exercice_id = ib.exercice_id
          AND statut != 'rejete'
      ), 0)
  as disponible

FROM imputations_budgetaires ib
LEFT JOIN activites a ON ib.activite_id = a.id
LEFT JOIN objectifs_strategiques os ON ib.os_id = os.id;

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE reamenagements_budgetaires ENABLE ROW LEVEL SECURITY;

-- Lecture: tous les utilisateurs authentifiés
CREATE POLICY "Lecture reamenagements" ON reamenagements_budgetaires
  FOR SELECT TO authenticated USING (true);

-- Insertion: utilisateurs avec rôle approprié
CREATE POLICY "Insertion reamenagements" ON reamenagements_budgetaires
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'validateur', 'operationnel'))
    )
  );

-- Update: validateurs et admin uniquement
CREATE POLICY "Update reamenagements" ON reamenagements_budgetaires
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'validateur'))
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_reamenagements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reamenagements_updated_at
  BEFORE UPDATE ON reamenagements_budgetaires
  FOR EACH ROW
  EXECUTE FUNCTION update_reamenagements_updated_at();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON TABLE reamenagements_budgetaires IS 'Transferts budgétaires entre lignes d''imputation';
COMMENT ON VIEW v_reamenagements_details IS 'Vue détaillée des réaménagements avec noms';
COMMENT ON VIEW v_etat_execution_imputation IS 'État d''exécution budgétaire par imputation avec réaménagements';
COMMENT ON FUNCTION create_reamenagement_budgetaire IS 'Crée un nouveau réaménagement budgétaire avec validation';
COMMENT ON FUNCTION validate_reamenagement_budgetaire IS 'Valide ou rejette un réaménagement en attente';
COMMENT ON FUNCTION get_budget_imputation IS 'Calcule le budget actuel d''une imputation (initial + réaménagements)';
COMMENT ON FUNCTION get_disponible_imputation IS 'Calcule le disponible budgétaire (budget - engagements)';
