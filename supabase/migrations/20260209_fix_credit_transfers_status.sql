-- ============================================
-- MIGRATION CRITIQUE: Fix credit_transfers constraints & functions
-- Date: 9 février 2026
-- ============================================
-- INSTRUCTIONS: Copier ce SQL dans Supabase Dashboard > SQL Editor > Run
-- ============================================

-- ============================================
-- 1. Fix CHECK constraint on status column
-- L'ancienne contrainte ne permettait que: en_attente, approuve, rejete
-- L'application a besoin de TOUS les statuts du workflow
-- ============================================

ALTER TABLE public.credit_transfers
  DROP CONSTRAINT IF EXISTS credit_transfers_status_check;

ALTER TABLE public.credit_transfers
  ADD CONSTRAINT credit_transfers_status_check
  CHECK (status IN (
    'brouillon',   -- Brouillon (non soumis)
    'soumis',      -- Soumis pour validation
    'en_attente',  -- En attente d'approbation
    'valide',      -- Validé par le contrôleur
    'approuve',    -- Approuvé par l'autorité
    'execute',     -- Exécuté - montants transférés
    'rejete',      -- Rejeté avec motif
    'annule'       -- Annulé avec motif
  ));

-- ============================================
-- 2. Fix execute_credit_transfer function
-- Problème: modifiait dotation_initiale au lieu de dotation_modifiee
-- ============================================

CREATE OR REPLACE FUNCTION public.execute_credit_transfer(p_transfer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer RECORD;
  v_from_line RECORD;
  v_to_line RECORD;
  v_from_dotation_avant NUMERIC;
  v_from_dotation_apres NUMERIC;
  v_from_disponible_avant NUMERIC;
  v_from_disponible_apres NUMERIC;
  v_to_dotation_avant NUMERIC;
  v_to_dotation_apres NUMERIC;
  v_to_disponible_avant NUMERIC;
  v_to_disponible_apres NUMERIC;
BEGIN
  -- Get transfer
  SELECT * INTO v_transfer FROM credit_transfers WHERE id = p_transfer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Virement non trouvé');
  END IF;

  IF v_transfer.status NOT IN ('approuve', 'valide') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le virement doit être validé/approuvé pour être exécuté. Statut actuel: ' || v_transfer.status);
  END IF;

  -- For virements (not ajustements), check source line
  IF v_transfer.type_transfer = 'virement' AND v_transfer.from_budget_line_id IS NOT NULL THEN
    SELECT * INTO v_from_line FROM budget_lines WHERE id = v_transfer.from_budget_line_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Ligne budgétaire source non trouvée');
    END IF;

    -- Calculate current available (dotation_modifiee - engagements)
    v_from_dotation_avant := COALESCE(v_from_line.dotation_modifiee, v_from_line.dotation_initiale);
    v_from_disponible_avant := v_from_dotation_avant - COALESCE(v_from_line.total_engage, 0);

    IF v_from_disponible_avant < v_transfer.amount THEN
      RETURN jsonb_build_object('success', false, 'error',
        format('Solde insuffisant: %s FCFA disponibles, %s FCFA demandés',
          to_char(v_from_disponible_avant, 'FM999G999G999G999'),
          to_char(v_transfer.amount, 'FM999G999G999G999')));
    END IF;

    -- Debit source: use dotation_modifiee (NOT dotation_initiale)
    v_from_dotation_apres := v_from_dotation_avant - v_transfer.amount;
    v_from_disponible_apres := v_from_disponible_avant - v_transfer.amount;

    UPDATE budget_lines
    SET dotation_modifiee = v_from_dotation_apres,
        disponible_calcule = v_from_disponible_apres
    WHERE id = v_transfer.from_budget_line_id;

    -- Record history for source
    INSERT INTO budget_history (budget_line_id, event_type, delta, dotation_avant, dotation_apres, disponible_avant, disponible_apres, ref_code, ref_id, commentaire, created_by)
    VALUES (v_transfer.from_budget_line_id, 'virement_sortant', -v_transfer.amount, v_from_dotation_avant, v_from_dotation_apres, v_from_disponible_avant, v_from_disponible_apres, v_transfer.code, v_transfer.id, v_transfer.motif, v_transfer.approved_by);
  ELSE
    v_from_dotation_avant := NULL;
    v_from_dotation_apres := NULL;
    v_from_disponible_avant := NULL;
    v_from_disponible_apres := NULL;
  END IF;

  -- Credit destination
  SELECT * INTO v_to_line FROM budget_lines WHERE id = v_transfer.to_budget_line_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ligne budgétaire destination non trouvée');
  END IF;

  v_to_dotation_avant := COALESCE(v_to_line.dotation_modifiee, v_to_line.dotation_initiale);
  v_to_disponible_avant := v_to_dotation_avant - COALESCE(v_to_line.total_engage, 0);
  v_to_dotation_apres := v_to_dotation_avant + v_transfer.amount;
  v_to_disponible_apres := v_to_disponible_avant + v_transfer.amount;

  UPDATE budget_lines
  SET dotation_modifiee = v_to_dotation_apres,
      disponible_calcule = v_to_disponible_apres
  WHERE id = v_transfer.to_budget_line_id;

  -- Determine event type for destination
  INSERT INTO budget_history (budget_line_id, event_type, delta, dotation_avant, dotation_apres, disponible_avant, disponible_apres, ref_code, ref_id, commentaire, created_by)
  VALUES (v_transfer.to_budget_line_id,
    CASE WHEN v_transfer.type_transfer = 'ajustement' THEN 'ajustement_positif' ELSE 'virement_entrant' END,
    v_transfer.amount, v_to_dotation_avant, v_to_dotation_apres, v_to_disponible_avant, v_to_disponible_apres, v_transfer.code, v_transfer.id, v_transfer.motif, v_transfer.approved_by);

  -- Update transfer record
  UPDATE credit_transfers
  SET status = 'execute',
      executed_at = NOW(),
      executed_by = v_transfer.approved_by,
      from_dotation_avant = v_from_dotation_avant,
      from_dotation_apres = v_from_dotation_apres,
      from_disponible_avant = v_from_disponible_avant,
      from_disponible_apres = v_from_disponible_apres,
      to_dotation_avant = v_to_dotation_avant,
      to_dotation_apres = v_to_dotation_apres,
      to_disponible_avant = v_to_disponible_avant,
      to_disponible_apres = v_to_disponible_apres
  WHERE id = p_transfer_id;

  -- Audit log
  INSERT INTO audit_logs (entity_type, entity_id, action, new_values, exercice)
  VALUES ('credit_transfer', p_transfer_id, 'transfer_executed',
    jsonb_build_object('code', v_transfer.code, 'amount', v_transfer.amount, 'type', v_transfer.type_transfer),
    v_transfer.exercice);

  RETURN jsonb_build_object('success', true, 'code', v_transfer.code);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- 3. Update existing test data to proper statuses
-- (run after constraint fix)
-- ============================================

-- Update en_attente records to soumis (more accurate workflow state)
-- Only do this for records that don't have approved_by set
UPDATE public.credit_transfers
SET status = 'soumis'
WHERE status = 'en_attente' AND approved_by IS NULL AND code IN ('VIR-2026-0003', 'AJU-2026-0002', 'VIR-2026-0002');

-- Clean up any TEST-* records
DELETE FROM public.credit_transfers WHERE code LIKE 'TEST-%';

-- Insert additional test records for complete workflow coverage
INSERT INTO public.credit_transfers (code, type_transfer, status, amount, motif, from_budget_line_id, to_budget_line_id, exercice, requested_at, requested_by)
VALUES
  ('VIR-2026-0004', 'virement', 'brouillon', 5000000, 'Réaffectation crédits indemnités vers travaux d''aménagement bureaux',
   'bddba97c-ac60-43ad-834e-0f96da35a278', '39ab4b55-58c9-411f-9c62-406c1211c975', 2026, '2026-02-07T08:00:00Z', 'a26d7c24-7fe3-4bce-a6a0-0f175fae0399')
ON CONFLICT DO NOTHING;

-- Add an executed transfer (VIR-2026-0001 should be executed, not just approuvé)
UPDATE public.credit_transfers
SET status = 'execute',
    executed_at = '2026-01-15T10:00:00Z',
    executed_by = 'd20a598b-0521-487a-b541-ac9335912890',
    from_dotation_avant = 850000000,
    from_dotation_apres = 835000000,
    from_disponible_avant = 850000000,
    from_disponible_apres = 835000000,
    to_dotation_avant = 220000000,
    to_dotation_apres = 235000000,
    to_disponible_avant = 220000000,
    to_disponible_apres = 235000000
WHERE code = 'VIR-2026-0001';

-- Execute the ajustement as well
UPDATE public.credit_transfers
SET status = 'execute',
    executed_at = '2026-01-18T14:30:00Z',
    executed_by = 'd20a598b-0521-487a-b541-ac9335912890',
    to_dotation_avant = 500000000,
    to_dotation_apres = 600000000,
    to_disponible_avant = 500000000,
    to_disponible_apres = 600000000
WHERE code = 'AJU-2026-0001';

-- Add a cancelled transfer
INSERT INTO public.credit_transfers (code, type_transfer, status, amount, motif, from_budget_line_id, to_budget_line_id, exercice, requested_at, requested_by, cancelled_at, cancel_reason)
VALUES
  ('VIR-2026-0007', 'virement', 'annule', 12000000, 'Transfert vers formation du personnel - annulé suite à report',
   'a565a807-7692-4024-958f-c001e09a36a6', 'bddba97c-ac60-43ad-834e-0f96da35a278', 2026, '2026-01-25T11:00:00Z', '06a0868d-f260-4c31-a16b-de94b76bc463', '2026-01-26T09:00:00Z', 'Report de la formation au T2 suite à indisponibilité du prestataire')
ON CONFLICT DO NOTHING;
