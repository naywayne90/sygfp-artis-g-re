-- =====================================================
-- MIGRATION: Unifier la formule de calcul du disponible budgetaire
-- =====================================================
-- Formule canonique:
--   Disponible = Dotation_initiale
--              + Virements_recus (credit_transfers WHERE status='execute')
--              - Virements_emis  (credit_transfers WHERE status='execute')
--              - Engages         (budget_engagements WHERE statut='valide')
--              - Reserves        (montant_reserve sur budget_lines)
--
-- Corrections:
-- 1. check_budget_availability() : inclure virements + reserves
-- 2. execute_credit_transfer()   : modifier dotation_modifiee au lieu de dotation_initiale
-- 3. v_engagement_stats          : inclure virements dans dotation_actuelle et disponible
-- =====================================================

-- =====================================================
-- 1. CORRIGER check_budget_availability()
--    Probleme: ignorait les virements de credits et les reserves
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_budget_availability(
  p_budget_line_id UUID,
  p_montant NUMERIC
)
RETURNS TABLE (
  is_available BOOLEAN,
  dotation NUMERIC,
  engaged NUMERIC,
  disponible NUMERIC,
  message TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dotation_initiale NUMERIC;
  v_virements_recus NUMERIC;
  v_virements_emis NUMERIC;
  v_dotation_actuelle NUMERIC;
  v_engaged NUMERIC;
  v_reserve NUMERIC;
  v_disponible NUMERIC;
BEGIN
  -- Recuperer la dotation initiale
  SELECT COALESCE(bl.dotation_initiale, 0)
  INTO v_dotation_initiale
  FROM budget_lines bl
  WHERE bl.id = p_budget_line_id;

  IF v_dotation_initiale IS NULL THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Ligne budgetaire introuvable'::TEXT;
    RETURN;
  END IF;

  -- Calculer les virements executes recus
  SELECT COALESCE(SUM(ct.amount), 0)
  INTO v_virements_recus
  FROM credit_transfers ct
  WHERE ct.to_budget_line_id = p_budget_line_id
    AND ct.status = 'execute';

  -- Calculer les virements executes emis
  SELECT COALESCE(SUM(ct.amount), 0)
  INTO v_virements_emis
  FROM credit_transfers ct
  WHERE ct.from_budget_line_id = p_budget_line_id
    AND ct.status = 'execute';

  -- Dotation actuelle = initiale + recus - emis
  v_dotation_actuelle := v_dotation_initiale + v_virements_recus - v_virements_emis;

  -- Calculer le total engage (uniquement engagements valides)
  SELECT COALESCE(SUM(be.montant), 0)
  INTO v_engaged
  FROM budget_engagements be
  WHERE be.budget_line_id = p_budget_line_id
    AND be.statut = 'valide';

  -- Recuperer le montant reserve (pre-engagements/imputations)
  SELECT COALESCE(bl.montant_reserve, 0)
  INTO v_reserve
  FROM budget_lines bl
  WHERE bl.id = p_budget_line_id;

  -- Disponible = dotation_actuelle - engages - reserves
  v_disponible := v_dotation_actuelle - v_engaged - v_reserve;

  RETURN QUERY SELECT
    (p_montant <= v_disponible) AS is_available,
    v_dotation_actuelle AS dotation,
    v_engaged AS engaged,
    v_disponible AS disponible,
    CASE
      WHEN p_montant <= v_disponible THEN 'Budget disponible'
      ELSE 'Budget insuffisant: ' || v_disponible::TEXT || ' FCFA disponibles'
    END AS message;
END;
$$;

COMMENT ON FUNCTION public.check_budget_availability IS
  'Verifie la disponibilite budgetaire. Formule: Disponible = Dotation_initiale + Virements_recus - Virements_emis - Engages - Reserves';

-- =====================================================
-- 2. CORRIGER execute_credit_transfer()
--    Probleme: modifiait dotation_initiale au lieu de dotation_modifiee
-- =====================================================
CREATE OR REPLACE FUNCTION public.execute_credit_transfer(
  p_transfer_id UUID,
  p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_transfer RECORD;
  v_from_line RECORD;
  v_to_line RECORD;
  v_from_engaged NUMERIC;
  v_to_engaged NUMERIC;
  v_from_virements_recus NUMERIC;
  v_from_virements_emis NUMERIC;
  v_to_virements_recus NUMERIC;
  v_to_virements_emis NUMERIC;
  v_from_dotation_actuelle NUMERIC;
  v_to_dotation_actuelle NUMERIC;
  v_from_disponible NUMERIC;
  v_to_disponible NUMERIC;
BEGIN
  -- Get transfer details
  SELECT * INTO v_transfer FROM public.credit_transfers WHERE id = p_transfer_id;

  IF v_transfer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Virement non trouve');
  END IF;

  IF v_transfer.status NOT IN ('approuve', 'valide') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le virement doit etre valide avant execution');
  END IF;

  -- Get destination line (always required)
  SELECT * INTO v_to_line FROM public.budget_lines WHERE id = v_transfer.to_budget_line_id;
  IF v_to_line IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ligne destination non trouvee');
  END IF;

  -- Calculate destination dotation actuelle with virements
  SELECT COALESCE(SUM(amount), 0) INTO v_to_virements_recus
  FROM public.credit_transfers
  WHERE to_budget_line_id = v_to_line.id AND status = 'execute';

  SELECT COALESCE(SUM(amount), 0) INTO v_to_virements_emis
  FROM public.credit_transfers
  WHERE from_budget_line_id = v_to_line.id AND status = 'execute';

  v_to_dotation_actuelle := COALESCE(v_to_line.dotation_initiale, 0) + v_to_virements_recus - v_to_virements_emis;

  SELECT COALESCE(SUM(montant), 0) INTO v_to_engaged
  FROM public.budget_engagements
  WHERE budget_line_id = v_to_line.id AND statut IN ('valide', 'en_cours');
  v_to_disponible := v_to_dotation_actuelle - v_to_engaged;

  -- Handle source line if it's a transfer (not adjustment)
  IF v_transfer.from_budget_line_id IS NOT NULL THEN
    SELECT * INTO v_from_line FROM public.budget_lines WHERE id = v_transfer.from_budget_line_id;
    IF v_from_line IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Ligne source non trouvee');
    END IF;

    -- Check same exercice
    IF v_from_line.exercice != v_to_line.exercice THEN
      RETURN jsonb_build_object('success', false, 'error', 'Virements inter-exercices interdits');
    END IF;

    -- Calculate source dotation actuelle with virements
    SELECT COALESCE(SUM(amount), 0) INTO v_from_virements_recus
    FROM public.credit_transfers
    WHERE to_budget_line_id = v_from_line.id AND status = 'execute';

    SELECT COALESCE(SUM(amount), 0) INTO v_from_virements_emis
    FROM public.credit_transfers
    WHERE from_budget_line_id = v_from_line.id AND status = 'execute';

    v_from_dotation_actuelle := COALESCE(v_from_line.dotation_initiale, 0) + v_from_virements_recus - v_from_virements_emis;

    SELECT COALESCE(SUM(montant), 0) INTO v_from_engaged
    FROM public.budget_engagements
    WHERE budget_line_id = v_from_line.id AND statut IN ('valide', 'en_cours');
    v_from_disponible := v_from_dotation_actuelle - v_from_engaged;

    -- Check available balance on source
    IF v_from_disponible < v_transfer.amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Solde insuffisant sur la ligne source');
    END IF;

    -- Store before values (using dotation_modifiee for tracking)
    UPDATE public.credit_transfers SET
      from_dotation_avant = COALESCE(v_from_line.dotation_modifiee, v_from_line.dotation_initiale),
      from_disponible_avant = v_from_disponible,
      to_dotation_avant = COALESCE(v_to_line.dotation_modifiee, v_to_line.dotation_initiale),
      to_disponible_avant = v_to_disponible
    WHERE id = p_transfer_id;

    -- Debit source line: modify dotation_modifiee (NOT dotation_initiale)
    UPDATE public.budget_lines SET
      dotation_modifiee = COALESCE(dotation_modifiee, dotation_initiale) - v_transfer.amount,
      updated_at = now()
    WHERE id = v_from_line.id;

    -- Record history for source
    INSERT INTO public.budget_history (
      budget_line_id, event_type, delta,
      dotation_avant, dotation_apres,
      disponible_avant, disponible_apres,
      ref_code, ref_id, commentaire, created_by
    ) VALUES (
      v_from_line.id, 'virement_debit', -v_transfer.amount,
      COALESCE(v_from_line.dotation_modifiee, v_from_line.dotation_initiale),
      COALESCE(v_from_line.dotation_modifiee, v_from_line.dotation_initiale) - v_transfer.amount,
      v_from_disponible, v_from_disponible - v_transfer.amount,
      v_transfer.code, p_transfer_id, v_transfer.motif, p_user_id
    );
  END IF;

  -- Store before values for destination (if not already done)
  IF v_transfer.from_budget_line_id IS NULL THEN
    UPDATE public.credit_transfers SET
      to_dotation_avant = COALESCE(v_to_line.dotation_modifiee, v_to_line.dotation_initiale),
      to_disponible_avant = v_to_disponible
    WHERE id = p_transfer_id;
  END IF;

  -- Credit destination line: modify dotation_modifiee (NOT dotation_initiale)
  UPDATE public.budget_lines SET
    dotation_modifiee = COALESCE(dotation_modifiee, dotation_initiale) + v_transfer.amount,
    updated_at = now()
  WHERE id = v_to_line.id;

  -- Record history for destination
  INSERT INTO public.budget_history (
    budget_line_id, event_type, delta,
    dotation_avant, dotation_apres,
    disponible_avant, disponible_apres,
    ref_code, ref_id, commentaire, created_by
  ) VALUES (
    v_to_line.id,
    CASE WHEN v_transfer.type_transfer = 'ajustement' THEN 'ajustement' ELSE 'virement_credit' END,
    v_transfer.amount,
    COALESCE(v_to_line.dotation_modifiee, v_to_line.dotation_initiale),
    COALESCE(v_to_line.dotation_modifiee, v_to_line.dotation_initiale) + v_transfer.amount,
    v_to_disponible, v_to_disponible + v_transfer.amount,
    v_transfer.code, p_transfer_id, v_transfer.motif, p_user_id
  );

  -- Update transfer status and after values
  UPDATE public.credit_transfers SET
    status = 'execute',
    executed_at = now(),
    executed_by = p_user_id,
    from_dotation_apres = CASE WHEN from_budget_line_id IS NOT NULL
      THEN (SELECT COALESCE(dotation_modifiee, dotation_initiale) FROM public.budget_lines WHERE id = from_budget_line_id)
      ELSE NULL END,
    from_disponible_apres = CASE WHEN from_budget_line_id IS NOT NULL
      THEN from_disponible_avant - amount
      ELSE NULL END,
    to_dotation_apres = (SELECT COALESCE(dotation_modifiee, dotation_initiale) FROM public.budget_lines WHERE id = to_budget_line_id),
    to_disponible_apres = to_disponible_avant + amount
  WHERE id = p_transfer_id;

  -- Log to audit
  INSERT INTO public.audit_logs (
    entity_type, entity_id, action, new_values, exercice, user_id
  ) VALUES (
    'credit_transfer', p_transfer_id, 'transfer_executed',
    jsonb_build_object(
      'code', v_transfer.code,
      'type', v_transfer.type_transfer,
      'amount', v_transfer.amount,
      'from_line', v_transfer.from_budget_line_id,
      'to_line', v_transfer.to_budget_line_id
    ),
    v_transfer.exercice, p_user_id
  );

  RETURN jsonb_build_object('success', true, 'code', v_transfer.code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.execute_credit_transfer IS
  'Execute un virement de credits. Modifie dotation_modifiee (pas dotation_initiale) et calcule le disponible avec virements.';

-- =====================================================
-- 3. CORRIGER v_engagement_stats
--    Probleme: ignorait les virements dans le calcul de dotation_actuelle et disponible
-- =====================================================
CREATE OR REPLACE VIEW public.v_engagement_stats AS
SELECT
  bl.id as budget_line_id,
  bl.code,
  bl.label,
  bl.exercice,
  bl.dotation_initiale,
  -- Dotation actuelle = initiale + virements recus - virements emis
  COALESCE(bl.dotation_initiale, 0)
    + COALESCE((SELECT SUM(ct.amount) FROM credit_transfers ct WHERE ct.to_budget_line_id = bl.id AND ct.status = 'execute'), 0)
    - COALESCE((SELECT SUM(ct.amount) FROM credit_transfers ct WHERE ct.from_budget_line_id = bl.id AND ct.status = 'execute'), 0)
  as dotation_actuelle,
  COALESCE(bl.total_engage, 0) as total_engage,
  COALESCE(bl.total_engage, 0) as engage_valide,
  -- Taux engagement base sur dotation actuelle
  CASE
    WHEN (COALESCE(bl.dotation_initiale, 0)
      + COALESCE((SELECT SUM(ct.amount) FROM credit_transfers ct WHERE ct.to_budget_line_id = bl.id AND ct.status = 'execute'), 0)
      - COALESCE((SELECT SUM(ct.amount) FROM credit_transfers ct WHERE ct.from_budget_line_id = bl.id AND ct.status = 'execute'), 0)) > 0
    THEN ROUND(
      (COALESCE(bl.total_engage, 0)::NUMERIC /
        (COALESCE(bl.dotation_initiale, 0)
          + COALESCE((SELECT SUM(ct.amount) FROM credit_transfers ct WHERE ct.to_budget_line_id = bl.id AND ct.status = 'execute'), 0)
          - COALESCE((SELECT SUM(ct.amount) FROM credit_transfers ct WHERE ct.from_budget_line_id = bl.id AND ct.status = 'execute'), 0))
      ) * 100, 2)
    ELSE 0
  END as taux_engagement,
  -- Disponible = dotation_actuelle - engages
  COALESCE(bl.dotation_initiale, 0)
    + COALESCE((SELECT SUM(ct.amount) FROM credit_transfers ct WHERE ct.to_budget_line_id = bl.id AND ct.status = 'execute'), 0)
    - COALESCE((SELECT SUM(ct.amount) FROM credit_transfers ct WHERE ct.from_budget_line_id = bl.id AND ct.status = 'execute'), 0)
    - COALESCE(bl.total_engage, 0)
  as disponible,
  d.sigle as direction_sigle,
  os.code as os_code
FROM public.budget_lines bl
LEFT JOIN public.directions d ON bl.direction_id = d.id
LEFT JOIN public.objectifs_strategiques os ON bl.os_id = os.id
WHERE bl.is_active = true;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
