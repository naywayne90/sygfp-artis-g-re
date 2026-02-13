-- =====================================================
-- Prompt 6 : Validation Imputation - Engagement Reel des Credits
-- =====================================================
-- Quand une imputation passe de a_valider -> valide, le montant doit
-- etre reserve sur la ligne budgetaire (montant_reserve).
-- Le disponible diminue en consequence.
-- =====================================================

-- =====================================================
-- 1. RPC validate_imputation(p_imputation_id UUID)
--    Atomique : verifie budget, reserve fonds, met a jour statut
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_imputation(p_imputation_id UUID)
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
  -- 1. Verifier l'authentification
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifie');
  END IF;

  -- 2. Verifier le role (ADMIN, DAAF, CB, DG)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_user_id
    AND role IN ('ADMIN', 'DAAF', 'CB', 'DG')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission refusee');
  END IF;

  -- 3. Charger l'imputation + budget_line (FOR UPDATE = lock)
  SELECT
    i.id,
    i.reference,
    i.objet,
    i.montant,
    i.statut,
    i.budget_line_id,
    i.dossier_id,
    i.forcer_imputation,
    bl.dotation_initiale,
    bl.dotation_modifiee,
    bl.montant_reserve,
    bl.total_engage,
    bl.disponible_calcule,
    bl.code AS budget_code,
    bl.label AS budget_label
  INTO v_imp
  FROM imputations i
  JOIN budget_lines bl ON bl.id = i.budget_line_id
  WHERE i.id = p_imputation_id
  FOR UPDATE OF i, bl;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Imputation non trouvee ou ligne budgetaire manquante');
  END IF;

  -- 4. Verifier le statut = a_valider
  IF v_imp.statut != 'a_valider' THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Statut invalide: %s (attendu: a_valider)', v_imp.statut));
  END IF;

  -- 5. Calculer la disponibilite (formule canonique)
  v_dotation_actuelle := COALESCE(v_imp.dotation_modifiee, v_imp.dotation_initiale);
  v_disponible_avant := v_dotation_actuelle
    - COALESCE(v_imp.total_engage, 0)
    - COALESCE(v_imp.montant_reserve, 0);
  v_disponible_apres := v_disponible_avant - v_imp.montant;

  -- 6. Verifier la disponibilite (sauf si forcer_imputation=true)
  IF v_disponible_apres < 0
     AND COALESCE(v_imp.forcer_imputation, false) = false
  THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Budget insuffisant',
      'dotation', v_dotation_actuelle,
      'engage', COALESCE(v_imp.total_engage, 0),
      'reserve_avant', COALESCE(v_imp.montant_reserve, 0),
      'disponible_avant', v_disponible_avant,
      'montant_imputation', v_imp.montant,
      'disponible_apres', v_disponible_apres
    );
  END IF;

  -- 7. Mettre a jour l'imputation -> valide
  UPDATE imputations SET
    statut = 'valide',
    validated_at = NOW(),
    validated_by = v_user_id,
    disponible_au_moment = v_disponible_avant
  WHERE id = p_imputation_id;

  -- 8. Reserver le montant sur la ligne budgetaire
  UPDATE budget_lines SET
    montant_reserve = COALESCE(montant_reserve, 0) + v_imp.montant,
    disponible_calcule = COALESCE(disponible_calcule, v_dotation_actuelle) - v_imp.montant,
    updated_at = NOW()
  WHERE id = v_imp.budget_line_id;

  -- 9. Mettre a jour le dossier
  IF v_imp.dossier_id IS NOT NULL THEN
    UPDATE dossiers SET
      etape_courante = 'imputation',
      updated_at = NOW()
    WHERE id = v_imp.dossier_id;
  END IF;

  -- 10. Log dans budget_history
  INSERT INTO budget_history (
    budget_line_id, event_type, delta,
    disponible_avant, disponible_apres,
    ref_code, ref_id, commentaire, created_by
  ) VALUES (
    v_imp.budget_line_id,
    'imputation_validee',
    v_imp.montant,
    v_disponible_avant,
    v_disponible_apres,
    v_imp.reference,
    p_imputation_id,
    format('Validation imputation %s - %s', COALESCE(v_imp.reference, ''), v_imp.objet),
    v_user_id
  );

  -- 11. Log dans audit_logs
  INSERT INTO audit_logs (
    entity_type, entity_id, action, new_values, user_id
  ) VALUES (
    'imputation',
    p_imputation_id::text,
    'validate',
    jsonb_build_object(
      'statut', 'valide',
      'montant', v_imp.montant,
      'budget_line_id', v_imp.budget_line_id,
      'disponible_avant', v_disponible_avant,
      'disponible_apres', v_disponible_apres
    ),
    v_user_id
  );

  -- 12. Retourner le resultat
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

-- Grant
GRANT EXECUTE ON FUNCTION public.validate_imputation(UUID) TO authenticated;

COMMENT ON FUNCTION public.validate_imputation IS
  'Valide une imputation (a_valider -> valide). Verifie le budget, reserve les fonds sur la ligne budgetaire, et met a jour le statut de facon atomique.';


-- =====================================================
-- 2. RPC get_budget_impact_preview(p_imputation_id UUID)
--    Lecture seule : retourne les donnees budget pour
--    l'affichage dans le dialog de confirmation
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_budget_impact_preview(p_imputation_id UUID)
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
  -- 1. Verifier l'authentification
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifie');
  END IF;

  -- 2. Charger l'imputation + budget_line (READ-ONLY, pas de FOR UPDATE)
  SELECT
    i.id,
    i.reference,
    i.objet,
    i.montant,
    i.statut,
    i.budget_line_id,
    i.forcer_imputation,
    bl.dotation_initiale,
    bl.dotation_modifiee,
    bl.montant_reserve,
    bl.total_engage,
    bl.code AS budget_code,
    bl.label AS budget_label
  INTO v_imp
  FROM imputations i
  LEFT JOIN budget_lines bl ON bl.id = i.budget_line_id
  WHERE i.id = p_imputation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Imputation non trouvee');
  END IF;

  -- 3. Si pas de budget_line, retourner un apercu partiel
  IF v_imp.budget_line_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'has_budget_line', false,
      'reference', v_imp.reference,
      'montant', v_imp.montant,
      'statut', v_imp.statut
    );
  END IF;

  -- 4. Calculer la disponibilite
  v_dotation_actuelle := COALESCE(v_imp.dotation_modifiee, v_imp.dotation_initiale);
  v_disponible_avant := v_dotation_actuelle
    - COALESCE(v_imp.total_engage, 0)
    - COALESCE(v_imp.montant_reserve, 0);
  v_disponible_apres := v_disponible_avant - v_imp.montant;

  -- 5. Retourner l'apercu
  RETURN jsonb_build_object(
    'success', true,
    'has_budget_line', true,
    'reference', v_imp.reference,
    'objet', v_imp.objet,
    'montant', v_imp.montant,
    'statut', v_imp.statut,
    'forced', COALESCE(v_imp.forcer_imputation, false),
    'budget_line_id', v_imp.budget_line_id,
    'budget_code', v_imp.budget_code,
    'budget_label', v_imp.budget_label,
    'dotation', v_dotation_actuelle,
    'engage', COALESCE(v_imp.total_engage, 0),
    'reserve', COALESCE(v_imp.montant_reserve, 0),
    'disponible_avant', v_disponible_avant,
    'disponible_apres', v_disponible_apres,
    'is_sufficient', (v_disponible_apres >= 0)
  );
END;
$$;

-- Grant
GRANT EXECUTE ON FUNCTION public.get_budget_impact_preview(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_budget_impact_preview IS
  'Apercu de l''impact budgetaire d''une imputation. Lecture seule, utilise pour le dialog de confirmation avant validation.';
