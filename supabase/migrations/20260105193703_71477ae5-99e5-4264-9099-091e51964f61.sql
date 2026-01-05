
-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.generate_dossier_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_annee INTEGER;
  v_mois INTEGER;
  v_annee_court TEXT;
  v_mois_text TEXT;
  v_sequence INTEGER;
  v_numero TEXT;
BEGIN
  v_annee := EXTRACT(year FROM CURRENT_DATE);
  v_mois := EXTRACT(month FROM CURRENT_DATE);
  v_annee_court := RIGHT(v_annee::TEXT, 2);
  v_mois_text := LPAD(v_mois::TEXT, 2, '0');
  
  INSERT INTO public.dossier_sequences (annee, mois, dernier_numero)
  VALUES (v_annee, v_mois, 0)
  ON CONFLICT (annee, mois) DO NOTHING;
  
  UPDATE public.dossier_sequences
  SET dernier_numero = dernier_numero + 1, updated_at = now()
  WHERE annee = v_annee AND mois = v_mois
  RETURNING dernier_numero INTO v_sequence;
  
  v_numero := 'ARTI' || v_mois_text || v_annee_court || LPAD(v_sequence::TEXT, 6, '0');
  
  NEW.numero := v_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
