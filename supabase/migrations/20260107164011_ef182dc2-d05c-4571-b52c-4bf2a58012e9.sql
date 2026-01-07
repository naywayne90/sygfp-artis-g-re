-- Enhance credit_transfers table with full workflow support
ALTER TABLE public.credit_transfers 
ADD COLUMN IF NOT EXISTS code VARCHAR(50),
ADD COLUMN IF NOT EXISTS type_transfer VARCHAR(20) DEFAULT 'virement' CHECK (type_transfer IN ('virement', 'ajustement')),
ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS executed_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS justification_renforcee TEXT,
ADD COLUMN IF NOT EXISTS from_dotation_avant NUMERIC,
ADD COLUMN IF NOT EXISTS from_dotation_apres NUMERIC,
ADD COLUMN IF NOT EXISTS to_dotation_avant NUMERIC,
ADD COLUMN IF NOT EXISTS to_dotation_apres NUMERIC,
ADD COLUMN IF NOT EXISTS from_disponible_avant NUMERIC,
ADD COLUMN IF NOT EXISTS from_disponible_apres NUMERIC,
ADD COLUMN IF NOT EXISTS to_disponible_avant NUMERIC,
ADD COLUMN IF NOT EXISTS to_disponible_apres NUMERIC;

-- Update status enum to include all workflow states
-- First update existing values to match new enum
UPDATE public.credit_transfers SET status = 'en_attente' WHERE status IS NULL;

-- Allow null from_budget_line_id for adjustments
ALTER TABLE public.credit_transfers ALTER COLUMN from_budget_line_id DROP NOT NULL;

-- Create budget_history table if not exists
CREATE TABLE IF NOT EXISTS public.budget_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_line_id UUID NOT NULL REFERENCES public.budget_lines(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'virement_debit', 'virement_credit', 'ajustement', 'import', 'creation', 'modification'
  delta NUMERIC NOT NULL DEFAULT 0,
  dotation_avant NUMERIC,
  dotation_apres NUMERIC,
  disponible_avant NUMERIC,
  disponible_apres NUMERIC,
  ref_code VARCHAR(50), -- Reference to transfer code
  ref_id UUID, -- Reference to credit_transfer id
  commentaire TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_budget_history_line ON public.budget_history(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_ref ON public.budget_history(ref_id);

-- Create sequence for transfer codes
CREATE TABLE IF NOT EXISTS public.transfer_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercice INTEGER NOT NULL,
  type_transfer VARCHAR(20) NOT NULL,
  dernier_numero INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exercice, type_transfer)
);

-- Function to generate transfer code
CREATE OR REPLACE FUNCTION public.generate_transfer_code(
  p_exercice INTEGER,
  p_type VARCHAR DEFAULT 'virement'
) RETURNS VARCHAR AS $$
DECLARE
  v_prefix VARCHAR;
  v_seq INTEGER;
  v_code VARCHAR;
BEGIN
  -- Determine prefix based on type
  v_prefix := CASE p_type 
    WHEN 'ajustement' THEN 'AJU'
    ELSE 'VIR'
  END;

  -- Get and increment sequence
  INSERT INTO public.transfer_sequences (exercice, type_transfer, dernier_numero)
  VALUES (p_exercice, p_type, 1)
  ON CONFLICT (exercice, type_transfer) 
  DO UPDATE SET 
    dernier_numero = transfer_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_seq;

  -- Build code
  v_code := v_prefix || '-' || p_exercice || '-' || LPAD(v_seq::TEXT, 4, '0');
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute a transfer (apply to budget lines)
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
  v_from_disponible NUMERIC;
  v_to_disponible NUMERIC;
BEGIN
  -- Get transfer details
  SELECT * INTO v_transfer FROM public.credit_transfers WHERE id = p_transfer_id;
  
  IF v_transfer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Virement non trouvé');
  END IF;
  
  IF v_transfer.status NOT IN ('approuve', 'valide') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le virement doit être validé avant exécution');
  END IF;

  -- Get destination line (always required)
  SELECT * INTO v_to_line FROM public.budget_lines WHERE id = v_transfer.to_budget_line_id;
  IF v_to_line IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ligne destination non trouvée');
  END IF;

  -- Calculate destination engaged amount
  SELECT COALESCE(SUM(montant), 0) INTO v_to_engaged 
  FROM public.budget_engagements 
  WHERE budget_line_id = v_to_line.id AND statut IN ('valide', 'en_cours');
  v_to_disponible := COALESCE(v_to_line.dotation_initiale, 0) - v_to_engaged;

  -- Handle source line if it's a transfer (not adjustment)
  IF v_transfer.from_budget_line_id IS NOT NULL THEN
    SELECT * INTO v_from_line FROM public.budget_lines WHERE id = v_transfer.from_budget_line_id;
    IF v_from_line IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Ligne source non trouvée');
    END IF;

    -- Check same exercice
    IF v_from_line.exercice != v_to_line.exercice THEN
      RETURN jsonb_build_object('success', false, 'error', 'Virements inter-exercices interdits');
    END IF;

    -- Calculate source engaged amount
    SELECT COALESCE(SUM(montant), 0) INTO v_from_engaged 
    FROM public.budget_engagements 
    WHERE budget_line_id = v_from_line.id AND statut IN ('valide', 'en_cours');
    v_from_disponible := COALESCE(v_from_line.dotation_initiale, 0) - v_from_engaged;

    -- Check available balance
    IF v_from_disponible < v_transfer.amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Solde insuffisant sur la ligne source');
    END IF;

    -- Store before values
    UPDATE public.credit_transfers SET
      from_dotation_avant = v_from_line.dotation_initiale,
      from_disponible_avant = v_from_disponible,
      to_dotation_avant = v_to_line.dotation_initiale,
      to_disponible_avant = v_to_disponible
    WHERE id = p_transfer_id;

    -- Debit source line
    UPDATE public.budget_lines SET
      dotation_initiale = dotation_initiale - v_transfer.amount,
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
      v_from_line.dotation_initiale, v_from_line.dotation_initiale - v_transfer.amount,
      v_from_disponible, v_from_disponible - v_transfer.amount,
      v_transfer.code, p_transfer_id, v_transfer.motif, p_user_id
    );
  END IF;

  -- Store before values for destination (if not already done)
  IF v_transfer.from_budget_line_id IS NULL THEN
    UPDATE public.credit_transfers SET
      to_dotation_avant = v_to_line.dotation_initiale,
      to_disponible_avant = v_to_disponible
    WHERE id = p_transfer_id;
  END IF;

  -- Credit destination line
  UPDATE public.budget_lines SET
    dotation_initiale = dotation_initiale + v_transfer.amount,
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
    v_to_line.dotation_initiale, v_to_line.dotation_initiale + v_transfer.amount,
    v_to_disponible, v_to_disponible + v_transfer.amount,
    v_transfer.code, p_transfer_id, v_transfer.motif, p_user_id
  );

  -- Update transfer status and after values
  UPDATE public.credit_transfers SET
    status = 'execute',
    executed_at = now(),
    executed_by = p_user_id,
    from_dotation_apres = CASE WHEN from_budget_line_id IS NOT NULL 
      THEN (SELECT dotation_initiale FROM public.budget_lines WHERE id = from_budget_line_id)
      ELSE NULL END,
    from_disponible_apres = CASE WHEN from_budget_line_id IS NOT NULL 
      THEN from_disponible_avant - amount
      ELSE NULL END,
    to_dotation_apres = (SELECT dotation_initiale FROM public.budget_lines WHERE id = to_budget_line_id),
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

-- Enable RLS
ALTER TABLE public.budget_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for budget_history
CREATE POLICY "Users can view budget history" ON public.budget_history
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert budget history" ON public.budget_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger for updated_at on transfer_sequences
CREATE OR REPLACE FUNCTION public.update_transfer_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transfer_sequences_updated_at ON public.transfer_sequences;
CREATE TRIGGER update_transfer_sequences_updated_at
  BEFORE UPDATE ON public.transfer_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_transfer_sequences_updated_at();