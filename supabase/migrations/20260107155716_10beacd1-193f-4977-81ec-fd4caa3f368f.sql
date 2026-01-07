
-- Ajouter les colonnes manquantes à ref_codification_rules
ALTER TABLE public.ref_codification_rules 
ADD COLUMN IF NOT EXISTS objet VARCHAR(50),
ADD COLUMN IF NOT EXISTS format_numero VARCHAR(100),
ADD COLUMN IF NOT EXISTS reset_seq VARCHAR(20) DEFAULT 'par_exercice' CHECK (reset_seq IN ('par_exercice', 'par_annee', 'jamais')),
ADD COLUMN IF NOT EXISTS champs_contexte JSONB DEFAULT '["exercice"]'::jsonb;

-- Table des séquences pour garantir unicité
CREATE TABLE IF NOT EXISTS public.ref_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objet VARCHAR(50) NOT NULL,
  scope_key VARCHAR(100) NOT NULL,
  last_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(objet, scope_key)
);

-- RLS pour ref_sequences
ALTER TABLE public.ref_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref_sequences_read" ON public.ref_sequences FOR SELECT TO authenticated USING (true);
CREATE POLICY "ref_sequences_write" ON public.ref_sequences FOR ALL TO authenticated USING (true);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_ref_sequences_objet ON public.ref_sequences(objet);
CREATE INDEX IF NOT EXISTS idx_ref_sequences_scope ON public.ref_sequences(scope_key);

-- Mettre à jour les règles existantes avec le champ objet
UPDATE public.ref_codification_rules SET objet = code_type WHERE objet IS NULL;

-- Supprimer les règles existantes pour les recréer avec les bons presets
DELETE FROM public.ref_codification_rules WHERE code_type IN (
  'LIGNE_BUDGETAIRE', 'PRESTATAIRE', 'CONTRAT', 'MARCHE', 'NOTE_AEF', 'NOTE_SEF',
  'ENGAGEMENT', 'LIQUIDATION', 'ORDONNANCEMENT', 'REGLEMENT', 'VIREMENT'
);

-- Insérer les presets de codification
INSERT INTO public.ref_codification_rules (code_type, objet, prefixe, format, format_numero, separateur, longueur_seq, reset_seq, champs_contexte, exemple, description, actif) VALUES
  ('LIGNE_BUDGETAIRE', 'budget_lines', 'LB', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ6}', '-', 6, 'par_exercice', '["exercice"]'::jsonb, 'LB-2026-000001', 'Code des lignes budgétaires', true),
  ('PRESTATAIRE', 'prestataires', 'SUP', '{prefixe}{sep}{SEQ}', '{SEQ5}', '-', 5, 'jamais', '[]'::jsonb, 'SUP-00001', 'Code des prestataires/fournisseurs', true),
  ('CONTRAT', 'contrats', 'CTR', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ4}', '-', 4, 'par_annee', '["annee"]'::jsonb, 'CTR-2026-0001', 'Numéro des contrats', true),
  ('MARCHE', 'marches', 'MAR', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ4}', '-', 4, 'par_annee', '["annee"]'::jsonb, 'MAR-2026-0001', 'Numéro des marchés', true),
  ('NOTE_AEF', 'notes_aef', 'AEF', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ4}', '-', 4, 'par_exercice', '["exercice"]'::jsonb, 'AEF-2026-0001', 'Numéro des notes AEF', true),
  ('NOTE_SEF', 'notes_sef', 'SEF', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ4}', '-', 4, 'par_exercice', '["exercice"]'::jsonb, 'SEF-2026-0001', 'Numéro des notes SEF', true),
  ('ENGAGEMENT', 'budget_engagements', 'ENG', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ4}', '-', 4, 'par_exercice', '["exercice"]'::jsonb, 'ENG-2026-0001', 'Numéro des engagements', true),
  ('LIQUIDATION', 'budget_liquidations', 'LIQ', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ4}', '-', 4, 'par_exercice', '["exercice"]'::jsonb, 'LIQ-2026-0001', 'Numéro des liquidations', true),
  ('ORDONNANCEMENT', 'ordonnancements', 'ORD', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ4}', '-', 4, 'par_exercice', '["exercice"]'::jsonb, 'ORD-2026-0001', 'Numéro des ordonnancements', true),
  ('REGLEMENT', 'reglements', 'PAY', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ4}', '-', 4, 'par_exercice', '["exercice"]'::jsonb, 'PAY-2026-0001', 'Numéro des paiements', true),
  ('VIREMENT', 'credit_transfers', 'VIR', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ4}', '-', 4, 'par_exercice', '["exercice"]'::jsonb, 'VIR-2026-0001', 'Numéro des virements de crédits', true),
  ('DOSSIER', 'dossiers', 'DOS', '{prefixe}{sep}{YYYY}{sep}{MM}{sep}{SEQ}', '{YYYY}-{MM}-{SEQ6}', '-', 6, 'par_annee', '["annee", "mois"]'::jsonb, 'DOS-2026-01-000001', 'Numéro des dossiers', true),
  ('EXPRESSION_BESOIN', 'expressions_besoin', 'EB', '{prefixe}{sep}{YYYY}{sep}{SEQ}', '{YYYY}-{SEQ4}', '-', 4, 'par_exercice', '["exercice"]'::jsonb, 'EB-2026-0001', 'Numéro des expressions de besoin', true)
ON CONFLICT (code_type) DO UPDATE SET 
  objet = EXCLUDED.objet,
  prefixe = EXCLUDED.prefixe,
  format = EXCLUDED.format,
  format_numero = EXCLUDED.format_numero,
  separateur = EXCLUDED.separateur,
  longueur_seq = EXCLUDED.longueur_seq,
  reset_seq = EXCLUDED.reset_seq,
  champs_contexte = EXCLUDED.champs_contexte,
  exemple = EXCLUDED.exemple,
  description = EXCLUDED.description;

-- Ajouter colonnes code_locked sur les tables transactionnelles
ALTER TABLE public.budget_engagements ADD COLUMN IF NOT EXISTS code_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.budget_liquidations ADD COLUMN IF NOT EXISTS code_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.ordonnancements ADD COLUMN IF NOT EXISTS code_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reglements ADD COLUMN IF NOT EXISTS code_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.credit_transfers ADD COLUMN IF NOT EXISTS code_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.marches ADD COLUMN IF NOT EXISTS code_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS code_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.expressions_besoin ADD COLUMN IF NOT EXISTS code_locked BOOLEAN DEFAULT FALSE;

-- Fonction pour générer un code unique
CREATE OR REPLACE FUNCTION public.generate_unique_code(
  p_objet VARCHAR,
  p_exercice INTEGER DEFAULT NULL,
  p_annee INTEGER DEFAULT NULL,
  p_mois INTEGER DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_scope_key TEXT;
  v_seq INTEGER;
  v_code TEXT;
  v_year INTEGER;
  v_month TEXT;
BEGIN
  -- Récupérer la règle de codification active
  SELECT * INTO v_rule 
  FROM ref_codification_rules 
  WHERE (objet = p_objet OR code_type = UPPER(p_objet)) AND actif = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucune règle de codification active pour l''objet: %', p_objet;
  END IF;
  
  -- Déterminer l'année et le mois
  v_year := COALESCE(p_exercice, p_annee, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  v_month := LPAD(COALESCE(p_mois, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER)::TEXT, 2, '0');
  
  -- Construire le scope_key selon reset_seq
  CASE v_rule.reset_seq
    WHEN 'par_exercice' THEN
      v_scope_key := v_rule.objet || '|' || v_year;
    WHEN 'par_annee' THEN
      v_scope_key := v_rule.objet || '|' || v_year;
    WHEN 'jamais' THEN
      v_scope_key := v_rule.objet;
    ELSE
      v_scope_key := v_rule.objet || '|' || v_year;
  END CASE;
  
  -- Obtenir et incrémenter la séquence
  INSERT INTO ref_sequences (objet, scope_key, last_value)
  VALUES (v_rule.objet, v_scope_key, 1)
  ON CONFLICT (objet, scope_key) 
  DO UPDATE SET 
    last_value = ref_sequences.last_value + 1,
    updated_at = now()
  RETURNING last_value INTO v_seq;
  
  -- Construire le code final
  v_code := v_rule.prefixe || v_rule.separateur || 
            v_year::TEXT || v_rule.separateur || 
            LPAD(v_seq::TEXT, v_rule.longueur_seq, '0');
  
  -- Cas spéciaux avec mois
  IF v_rule.champs_contexte ? 'mois' THEN
    v_code := v_rule.prefixe || v_rule.separateur || 
              v_year::TEXT || v_rule.separateur || 
              v_month || v_rule.separateur ||
              LPAD(v_seq::TEXT, v_rule.longueur_seq, '0');
  END IF;
  
  -- Cas sans année (prestataires)
  IF v_rule.reset_seq = 'jamais' AND NOT (v_rule.champs_contexte ? 'annee' OR v_rule.champs_contexte ? 'exercice') THEN
    v_code := v_rule.prefixe || v_rule.separateur || LPAD(v_seq::TEXT, v_rule.longueur_seq, '0');
  END IF;
  
  -- Log dans audit
  INSERT INTO audit_logs (entity_type, entity_id, action, user_id, new_values)
  VALUES (
    'codification',
    gen_random_uuid(),
    'CODE_GENERATED',
    auth.uid(),
    jsonb_build_object(
      'objet', p_objet,
      'code', v_code,
      'scope_key', v_scope_key,
      'sequence', v_seq
    )
  );
  
  RETURN v_code;
END;
$$;

-- Fonction pour vérifier si un préfixe est réservé
CREATE OR REPLACE FUNCTION public.is_prefix_reserved(p_code TEXT)
RETURNS TABLE(is_reserved BOOLEAN, reserved_for VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_rule RECORD;
BEGIN
  -- Extraire le préfixe du code (avant le premier séparateur)
  v_prefix := SPLIT_PART(p_code, '-', 1);
  
  -- Vérifier si ce préfixe est réservé
  SELECT * INTO v_rule
  FROM ref_codification_rules
  WHERE prefixe = v_prefix AND actif = true
  LIMIT 1;
  
  IF FOUND THEN
    is_reserved := TRUE;
    reserved_for := v_rule.code_type;
  ELSE
    is_reserved := FALSE;
    reserved_for := NULL;
  END IF;
  
  RETURN NEXT;
END;
$$;

-- Fonction pour tester une règle de codification
CREATE OR REPLACE FUNCTION public.test_codification_rule(
  p_rule_id UUID,
  p_exercice INTEGER DEFAULT NULL,
  p_annee INTEGER DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_year INTEGER;
  v_month TEXT;
  v_preview TEXT;
BEGIN
  SELECT * INTO v_rule FROM ref_codification_rules WHERE id = p_rule_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Règle non trouvée';
  END IF;
  
  v_year := COALESCE(p_exercice, p_annee, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
  v_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER::TEXT, 2, '0');
  
  -- Générer un aperçu sans incrémenter la séquence
  IF v_rule.reset_seq = 'jamais' AND NOT (v_rule.champs_contexte ? 'annee') THEN
    v_preview := v_rule.prefixe || v_rule.separateur || LPAD('1', v_rule.longueur_seq, '0');
  ELSIF v_rule.champs_contexte ? 'mois' THEN
    v_preview := v_rule.prefixe || v_rule.separateur || v_year::TEXT || v_rule.separateur || v_month || v_rule.separateur || LPAD('1', v_rule.longueur_seq, '0');
  ELSE
    v_preview := v_rule.prefixe || v_rule.separateur || v_year::TEXT || v_rule.separateur || LPAD('1', v_rule.longueur_seq, '0');
  END IF;
  
  RETURN v_preview;
END;
$$;

-- Trigger pour verrouiller le code lors de la validation
CREATE OR REPLACE FUNCTION public.lock_code_on_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verrouiller le code quand le statut passe à validé/approuvé
  IF NEW.statut IN ('valide', 'validé', 'approuve', 'approuvé', 'signe', 'signé', 'paye', 'payé') 
     AND (OLD.statut IS NULL OR OLD.statut NOT IN ('valide', 'validé', 'approuve', 'approuvé', 'signe', 'signé', 'paye', 'payé')) THEN
    NEW.code_locked := TRUE;
  END IF;
  
  -- Empêcher la modification du numéro si verrouillé (sauf admin)
  IF OLD.code_locked = TRUE AND OLD.numero IS DISTINCT FROM NEW.numero THEN
    IF NOT public.has_role(auth.uid(), 'ADMIN') THEN
      RAISE EXCEPTION 'Le code ne peut pas être modifié après validation. Contactez un administrateur.';
    ELSE
      -- Log la modification par admin
      INSERT INTO audit_logs (entity_type, entity_id, action, user_id, old_values, new_values)
      VALUES (
        TG_TABLE_NAME,
        NEW.id,
        'CODE_OVERRIDE',
        auth.uid(),
        jsonb_build_object('numero', OLD.numero),
        jsonb_build_object('numero', NEW.numero, 'reason', 'Admin override')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Appliquer le trigger sur les tables transactionnelles
DROP TRIGGER IF EXISTS lock_code_engagements ON public.budget_engagements;
CREATE TRIGGER lock_code_engagements
  BEFORE UPDATE ON public.budget_engagements
  FOR EACH ROW EXECUTE FUNCTION public.lock_code_on_validation();

DROP TRIGGER IF EXISTS lock_code_liquidations ON public.budget_liquidations;
CREATE TRIGGER lock_code_liquidations
  BEFORE UPDATE ON public.budget_liquidations
  FOR EACH ROW EXECUTE FUNCTION public.lock_code_on_validation();

DROP TRIGGER IF EXISTS lock_code_ordonnancements ON public.ordonnancements;
CREATE TRIGGER lock_code_ordonnancements
  BEFORE UPDATE ON public.ordonnancements
  FOR EACH ROW EXECUTE FUNCTION public.lock_code_on_validation();

DROP TRIGGER IF EXISTS lock_code_marches ON public.marches;
CREATE TRIGGER lock_code_marches
  BEFORE UPDATE ON public.marches
  FOR EACH ROW EXECUTE FUNCTION public.lock_code_on_validation();

-- Trigger updated_at pour ref_sequences
CREATE OR REPLACE TRIGGER set_ref_sequences_updated_at
  BEFORE UPDATE ON public.ref_sequences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
