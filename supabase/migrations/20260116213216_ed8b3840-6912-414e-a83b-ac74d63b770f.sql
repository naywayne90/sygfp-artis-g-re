
-- Create missing table first
CREATE TABLE IF NOT EXISTS public.ordonnancement_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordonnancement_id uuid NOT NULL REFERENCES public.ordonnancements(id) ON DELETE CASCADE,
  signataire_role text NOT NULL,
  signataire_label text NOT NULL,
  signature_order integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  signed_at timestamp with time zone,
  signed_by uuid REFERENCES public.profiles(id),
  comments text,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ordonnancement_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated access ordonnancement_signatures" ON public.ordonnancement_signatures;
CREATE POLICY "Authenticated access ordonnancement_signatures"
ON public.ordonnancement_signatures FOR ALL
USING (true)
WITH CHECK (true);

-- Create pieces table
CREATE TABLE IF NOT EXISTS public.ordonnancement_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordonnancement_id uuid NOT NULL REFERENCES public.ordonnancements(id) ON DELETE CASCADE,
  piece_type text NOT NULL,
  piece_label text NOT NULL,
  file_path text,
  file_name text,
  source_entity_type text,
  source_entity_id uuid,
  included_in_parapheur boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ordonnancement_pieces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated access ordonnancement_pieces" ON public.ordonnancement_pieces;
CREATE POLICY "Authenticated access ordonnancement_pieces"
ON public.ordonnancement_pieces FOR ALL
USING (true)
WITH CHECK (true);

-- Now create the functions
CREATE OR REPLACE FUNCTION check_ordonnancement_signature_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_all_signed boolean;
  v_ordonnancement_id uuid;
BEGIN
  IF NEW.status != 'signed' THEN
    RETURN NEW;
  END IF;

  v_ordonnancement_id := NEW.ordonnancement_id;
  
  SELECT NOT EXISTS (
    SELECT 1 FROM ordonnancement_signatures
    WHERE ordonnancement_id = v_ordonnancement_id
    AND status != 'signed'
  ) INTO v_all_signed;
  
  IF v_all_signed THEN
    UPDATE ordonnancements
    SET 
      statut = 'signe',
      signature_status = 'signed',
      signed_at = now(),
      signed_by = NEW.signed_by,
      workflow_status = 'signe'
    WHERE id = v_ordonnancement_id;
    
    UPDATE dossiers
    SET etape_courante = 'ordonnancement_signe',
        updated_at = now()
    WHERE id = (SELECT dossier_id FROM ordonnancements WHERE id = v_ordonnancement_id);
    
    INSERT INTO workflow_tasks (
      dossier_id, etape, action, statut, assigne_a_role,
      source_entity_id, source_entity_type, description
    )
    SELECT
      o.dossier_id, 'reglement', 'Procéder au règlement', 'en_attente', 'TRESORIER',
      o.id, 'ordonnancement', 'Ordonnancement ' || o.numero || ' signé - Procéder au paiement'
    FROM ordonnancements o
    WHERE o.id = v_ordonnancement_id AND o.dossier_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_ordonnancement_signature_complete ON ordonnancement_signatures;
CREATE TRIGGER trg_check_ordonnancement_signature_complete
AFTER UPDATE ON ordonnancement_signatures
FOR EACH ROW
EXECUTE FUNCTION check_ordonnancement_signature_complete();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ordonnancement_signatures_ord_id ON ordonnancement_signatures(ordonnancement_id);
CREATE INDEX IF NOT EXISTS idx_ordonnancement_pieces_ord_id ON ordonnancement_pieces(ordonnancement_id);
