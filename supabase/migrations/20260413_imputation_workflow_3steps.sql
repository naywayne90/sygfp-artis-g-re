-- ============================================================
-- MIGRATION: Imputation workflow 3 étapes (DAAF → CB → DG)
-- Date: 2026-04-13
-- Description: Aligne le module Imputation sur le circuit réglementaire
--   de la dépense publique pour les EPN en Côte d'Ivoire.
--   Étape 1: DAAF crée (soumis)
--   Étape 2: CB vise (vise)
--   Étape 3: DG valide (valide) / rejette (rejete) / diffère (differe)
-- ============================================================

-- 1. Ajouter colonnes vise_at et vise_by
ALTER TABLE imputations
ADD COLUMN IF NOT EXISTS vise_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vise_by UUID REFERENCES auth.users(id);

-- 2. Remplacer le CHECK constraint — 5 statuts propres
ALTER TABLE imputations DROP CONSTRAINT IF EXISTS imputations_statut_check;
ALTER TABLE imputations ADD CONSTRAINT imputations_statut_check
CHECK (statut IN ('soumis', 'vise', 'valide', 'rejete', 'differe'));

-- 3. Nettoyer les données avec des statuts morts
UPDATE imputations SET statut = 'soumis'
WHERE statut IN ('a_valider', 'active', 'annulee', 'en_validation', 'annule', 'termine');

-- 4. Index pour les requêtes de visa
CREATE INDEX IF NOT EXISTS idx_imputations_vise_by ON imputations(vise_by);
CREATE INDEX IF NOT EXISTS idx_imputations_statut_vise ON imputations(statut) WHERE statut = 'vise';

-- 5. RLS UPDATE : ajouter CB pour le visa
DROP POLICY IF EXISTS imputations_update_policy ON imputations;
CREATE POLICY imputations_update_policy ON imputations FOR UPDATE USING (
  has_role(auth.uid(), 'ADMIN'::app_role)
  OR has_role(auth.uid(), 'DAAF'::app_role)
  OR has_role(auth.uid(), 'DAF'::app_role)
  OR has_role(auth.uid(), 'SAF'::app_role)
  OR has_role(auth.uid(), 'CHEF_SERVICE_BUDGET'::app_role)
  OR has_role(auth.uid(), 'DG'::app_role)
  OR has_role(auth.uid(), 'CB'::app_role)
  OR (created_by = auth.uid() AND statut = 'soumis')
) WITH CHECK (true);

-- 6. RPC viser_imputation (soumis → vise, CB uniquement)
CREATE OR REPLACE FUNCTION viser_imputation(p_imputation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_imp RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_user_id AND role IN ('ADMIN', 'CB')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seul le Contrôleur Budgétaire peut accorder le visa');
  END IF;

  SELECT id, reference, objet, montant, statut, budget_line_id
  INTO v_imp
  FROM imputations
  WHERE id = p_imputation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Imputation non trouvée');
  END IF;

  IF v_imp.statut != 'soumis' THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Statut invalide: %s (attendu: soumis)', v_imp.statut));
  END IF;

  UPDATE imputations SET
    statut = 'vise',
    vise_at = NOW(),
    vise_by = v_user_id,
    updated_at = NOW()
  WHERE id = p_imputation_id;

  INSERT INTO audit_logs (entity_type, entity_id, action, new_values, user_id)
  VALUES ('imputation', p_imputation_id::text, 'visa_cb',
    jsonb_build_object('statut', 'vise', 'reference', v_imp.reference, 'montant', v_imp.montant),
    v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'imputation_id', p_imputation_id,
    'reference', v_imp.reference,
    'montant', v_imp.montant,
    'message', 'Visa CB accordé'
  );
END;
$$;

-- 7. Mettre à jour validate_imputation : accepte 'vise' (plus 'a_valider')
-- + restriction DG/ADMIN uniquement
CREATE OR REPLACE FUNCTION validate_imputation(p_imputation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_imp RECORD;
  v_user_id UUID;
  v_dotation_actuelle NUMERIC;
  v_disponible_avant NUMERIC;
  v_disponible_apres NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifie');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_user_id AND role IN ('ADMIN', 'DG')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seul le DG peut valider une imputation visée');
  END IF;

  SELECT
    i.id, i.reference, i.objet, i.montant, i.statut,
    i.budget_line_id, i.dossier_id, i.forcer_imputation,
    bl.dotation_initiale, bl.dotation_modifiee,
    bl.montant_reserve, bl.total_engage, bl.disponible_calcule,
    bl.code AS budget_code, bl.label AS budget_label
  INTO v_imp
  FROM imputations i
  JOIN budget_lines bl ON bl.id = i.budget_line_id
  WHERE i.id = p_imputation_id
  FOR UPDATE OF i, bl;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Imputation non trouvee ou ligne budgetaire manquante');
  END IF;

  IF v_imp.statut != 'vise' THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Statut invalide: %s (attendu: vise). Le visa CB est requis avant la validation DG.', v_imp.statut));
  END IF;

  v_dotation_actuelle := COALESCE(v_imp.dotation_modifiee, v_imp.dotation_initiale);
  v_disponible_avant := v_dotation_actuelle
    - COALESCE(v_imp.total_engage, 0)
    - COALESCE(v_imp.montant_reserve, 0);
  v_disponible_apres := v_disponible_avant - v_imp.montant;

  IF v_disponible_apres < 0
     AND COALESCE(v_imp.forcer_imputation, false) = false
  THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'Budget insuffisant',
      'dotation', v_dotation_actuelle,
      'engage', COALESCE(v_imp.total_engage, 0),
      'reserve_avant', COALESCE(v_imp.montant_reserve, 0),
      'disponible_avant', v_disponible_avant,
      'montant_imputation', v_imp.montant,
      'disponible_apres', v_disponible_apres
    );
  END IF;

  UPDATE imputations SET
    statut = 'valide',
    validated_at = NOW(),
    validated_by = v_user_id,
    disponible_au_moment = v_disponible_avant,
    updated_at = NOW()
  WHERE id = p_imputation_id;

  UPDATE budget_lines SET
    montant_reserve = COALESCE(montant_reserve, 0) + v_imp.montant,
    disponible_calcule = COALESCE(disponible_calcule, v_dotation_actuelle) - v_imp.montant,
    updated_at = NOW()
  WHERE id = v_imp.budget_line_id;

  IF v_imp.dossier_id IS NOT NULL THEN
    UPDATE dossiers SET etape_courante = 'imputation', updated_at = NOW()
    WHERE id = v_imp.dossier_id;
  END IF;

  INSERT INTO budget_history (
    budget_line_id, event_type, delta, disponible_avant, disponible_apres,
    ref_code, ref_id, commentaire, created_by
  ) VALUES (
    v_imp.budget_line_id, 'imputation_validee', v_imp.montant,
    v_disponible_avant, v_disponible_apres, v_imp.reference,
    p_imputation_id,
    format('Validation DG imputation %s - %s', COALESCE(v_imp.reference, ''), v_imp.objet),
    v_user_id
  );

  INSERT INTO audit_logs (entity_type, entity_id, action, new_values, user_id)
  VALUES ('imputation', p_imputation_id::text, 'validate_dg',
    jsonb_build_object('statut', 'valide', 'montant', v_imp.montant,
      'budget_line_id', v_imp.budget_line_id,
      'disponible_avant', v_disponible_avant, 'disponible_apres', v_disponible_apres),
    v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'imputation_id', p_imputation_id,
    'reference', v_imp.reference,
    'montant', v_imp.montant,
    'budget_line_id', v_imp.budget_line_id,
    'budget_code', v_imp.budget_code,
    'budget_label', v_imp.budget_label,
    'dotation', v_dotation_actuelle,
    'engage', COALESCE(v_imp.total_engage, 0),
    'reserve_avant', COALESCE(v_imp.montant_reserve, 0),
    'reserve_apres', COALESCE(v_imp.montant_reserve, 0) + v_imp.montant,
    'disponible_avant', v_disponible_avant,
    'disponible_apres', v_disponible_apres,
    'forced', COALESCE(v_imp.forcer_imputation, false)
  );
END;
$$;
