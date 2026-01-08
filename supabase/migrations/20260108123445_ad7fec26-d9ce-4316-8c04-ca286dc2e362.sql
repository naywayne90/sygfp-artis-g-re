-- Storage bucket for prestataires documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('prestataires_docs', 'prestataires_docs', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for prestataires_docs bucket
CREATE POLICY "Authenticated users can upload prestataires docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prestataires_docs');

CREATE POLICY "Authenticated users can view prestataires docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'prestataires_docs');

CREATE POLICY "Authenticated users can update prestataires docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'prestataires_docs');

CREATE POLICY "Authenticated users can delete prestataires docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'prestataires_docs');

-- Function to generate next prestataire code
CREATE OR REPLACE FUNCTION generate_prestataire_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_number INT;
  v_new_code TEXT;
BEGIN
  -- Get the last number from existing codes
  SELECT COALESCE(MAX(
    CASE 
      WHEN code ~ '^PREST-[0-9]+$' 
      THEN CAST(SUBSTRING(code FROM 'PREST-([0-9]+)') AS INTEGER)
      ELSE 0 
    END
  ), 0) INTO v_last_number
  FROM prestataires;
  
  -- Generate new code
  v_new_code := 'PREST-' || LPAD((v_last_number + 1)::TEXT, 4, '0');
  
  RETURN v_new_code;
END;
$$;

-- Function to import/upsert prestataires from Excel
CREATE OR REPLACE FUNCTION import_prestataires(
  p_rows JSONB,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_code TEXT;
  v_existing_id UUID;
  v_success_count INT := 0;
  v_error_count INT := 0;
  v_warnings JSONB := '[]'::JSONB;
  v_errors JSONB := '[]'::JSONB;
  v_row_num INT := 0;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_row_num := v_row_num + 1;
    
    BEGIN
      -- Get code from row or generate new one
      v_code := COALESCE(NULLIF(TRIM(v_row->>'code'), ''), NULL);
      
      -- Check if code exists
      IF v_code IS NOT NULL THEN
        SELECT id INTO v_existing_id FROM prestataires WHERE code = v_code;
      ELSE
        v_existing_id := NULL;
      END IF;
      
      -- Generate code if not provided
      IF v_code IS NULL THEN
        v_code := generate_prestataire_code();
        v_warnings := v_warnings || jsonb_build_object(
          'row', v_row_num,
          'message', 'Code généré automatiquement: ' || v_code
        );
      END IF;
      
      IF v_existing_id IS NOT NULL THEN
        -- Update existing
        UPDATE prestataires SET
          raison_sociale = COALESCE(NULLIF(TRIM(v_row->>'raison_sociale'), ''), raison_sociale),
          sigle = COALESCE(NULLIF(TRIM(v_row->>'sigle'), ''), sigle),
          ninea = COALESCE(NULLIF(TRIM(v_row->>'ninea'), ''), ninea),
          nif = COALESCE(NULLIF(TRIM(v_row->>'nif'), ''), nif),
          ifu = COALESCE(NULLIF(TRIM(v_row->>'ifu'), ''), ifu),
          rccm = COALESCE(NULLIF(TRIM(v_row->>'rccm'), ''), rccm),
          cc = COALESCE(NULLIF(TRIM(v_row->>'cc'), ''), cc),
          adresse = COALESCE(NULLIF(TRIM(v_row->>'adresse'), ''), adresse),
          ville = COALESCE(NULLIF(TRIM(v_row->>'ville'), ''), ville),
          telephone = COALESCE(NULLIF(TRIM(v_row->>'telephone'), ''), telephone),
          email = COALESCE(NULLIF(TRIM(v_row->>'email'), ''), email),
          contact_nom = COALESCE(NULLIF(TRIM(v_row->>'contact_nom'), ''), contact_nom),
          contact_telephone = COALESCE(NULLIF(TRIM(v_row->>'contact_telephone'), ''), contact_telephone),
          contact_email = COALESCE(NULLIF(TRIM(v_row->>'contact_email'), ''), contact_email),
          secteur_activite = COALESCE(NULLIF(TRIM(v_row->>'secteur_activite'), ''), secteur_activite),
          type_prestataire = COALESCE(NULLIF(TRIM(v_row->>'type_prestataire'), ''), type_prestataire),
          statut = COALESCE(NULLIF(UPPER(TRIM(v_row->>'statut')), ''), statut),
          updated_at = NOW()
        WHERE id = v_existing_id;
      ELSE
        -- Insert new
        INSERT INTO prestataires (
          code, raison_sociale, sigle, ninea, nif, ifu, rccm, cc,
          adresse, ville, telephone, email,
          contact_nom, contact_telephone, contact_email,
          secteur_activite, type_prestataire, statut, created_by
        ) VALUES (
          v_code,
          COALESCE(NULLIF(TRIM(v_row->>'raison_sociale'), ''), 'Non renseigné'),
          NULLIF(TRIM(v_row->>'sigle'), ''),
          NULLIF(TRIM(v_row->>'ninea'), ''),
          NULLIF(TRIM(v_row->>'nif'), ''),
          NULLIF(TRIM(v_row->>'ifu'), ''),
          NULLIF(TRIM(v_row->>'rccm'), ''),
          NULLIF(TRIM(v_row->>'cc'), ''),
          NULLIF(TRIM(v_row->>'adresse'), ''),
          NULLIF(TRIM(v_row->>'ville'), ''),
          NULLIF(TRIM(v_row->>'telephone'), ''),
          NULLIF(TRIM(v_row->>'email'), ''),
          NULLIF(TRIM(v_row->>'contact_nom'), ''),
          NULLIF(TRIM(v_row->>'contact_telephone'), ''),
          NULLIF(TRIM(v_row->>'contact_email'), ''),
          NULLIF(TRIM(v_row->>'secteur_activite'), ''),
          NULLIF(TRIM(v_row->>'type_prestataire'), ''),
          COALESCE(NULLIF(UPPER(TRIM(v_row->>'statut')), ''), 'ACTIF'),
          p_user_id
        );
      END IF;
      
      v_success_count := v_success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'row', v_row_num,
        'code', v_code,
        'message', SQLERRM
      );
    END;
  END LOOP;
  
  -- Audit log
  INSERT INTO audit_logs (entity_type, action, new_values, user_id)
  VALUES ('prestataires', 'import', jsonb_build_object(
    'total_rows', v_row_num,
    'success', v_success_count,
    'errors', v_error_count
  ), p_user_id);
  
  RETURN jsonb_build_object(
    'success', v_success_count,
    'errors', v_error_count,
    'warnings', v_warnings,
    'error_details', v_errors
  );
END;
$$;

-- Function to update document statuses based on expiration
CREATE OR REPLACE FUNCTION update_supplier_document_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rappel_jours INT;
BEGIN
  -- Get rappel days from document type or default
  SELECT COALESCE(srd.rappel_jours_defaut, 30) INTO v_rappel_jours
  FROM supplier_required_documents srd
  WHERE srd.code = NEW.type_document;
  
  IF v_rappel_jours IS NULL THEN
    v_rappel_jours := NEW.rappel_jours;
  END IF;
  
  -- Calculate status based on expiration date
  IF NEW.date_expiration IS NULL THEN
    NEW.statut := 'valide';
  ELSIF NEW.date_expiration < CURRENT_DATE THEN
    NEW.statut := 'expire';
  ELSIF NEW.date_expiration <= CURRENT_DATE + (v_rappel_jours || ' days')::INTERVAL THEN
    NEW.statut := 'a_renouveler';
  ELSE
    NEW.statut := 'valide';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_update_supplier_document_status ON supplier_documents;
CREATE TRIGGER trg_update_supplier_document_status
  BEFORE INSERT OR UPDATE ON supplier_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_document_status();

-- Create index for expired documents queries
CREATE INDEX IF NOT EXISTS idx_supplier_documents_status ON supplier_documents(statut) WHERE statut IN ('expire', 'a_renouveler');
CREATE INDEX IF NOT EXISTS idx_supplier_documents_expiration ON supplier_documents(date_expiration) WHERE date_expiration IS NOT NULL;