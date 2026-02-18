-- ============================================================
-- Prompt 4 BACKEND — Renforcement table marches
-- Date: 2026-02-18
-- Description: Colonnes, index, triggers pour passation marché
-- ============================================================

-- ============================================================
-- 1. COLONNES AJOUTÉES (6 nouvelles)
-- ============================================================
-- Déjà existantes: expression_besoin_id, type_marche, mode_passation,
--   date_attribution, date_signature, montant, exercice, statut

ALTER TABLE marches ADD COLUMN IF NOT EXISTS budget_line_id UUID REFERENCES budget_lines(id);
ALTER TABLE marches ADD COLUMN IF NOT EXISTS date_publication DATE;
ALTER TABLE marches ADD COLUMN IF NOT EXISTS date_cloture DATE;
ALTER TABLE marches ADD COLUMN IF NOT EXISTS montant_estime NUMERIC;
ALTER TABLE marches ADD COLUMN IF NOT EXISTS montant_attribue NUMERIC;
ALTER TABLE marches ADD COLUMN IF NOT EXISTS procedure_recommandee TEXT;

-- ============================================================
-- 2. INDEX (6 nouveaux)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_marches_expression_besoin ON marches(expression_besoin_id);
CREATE INDEX IF NOT EXISTS idx_marches_budget_line ON marches(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_marches_statut ON marches(statut);
CREATE INDEX IF NOT EXISTS idx_marches_type ON marches(type_marche);
CREATE INDEX IF NOT EXISTS idx_marches_mode_passation ON marches(mode_passation);
CREATE INDEX IF NOT EXISTS idx_marches_exercice ON marches(exercice);

-- ============================================================
-- 3a. TRIGGER DOUBLON SUPPRIMÉ
-- ============================================================
-- Avant: generate_marche_numero_trigger + trg_generate_marche_numero (même fonction)
-- Après: uniquement trg_generate_marche_numero
DROP TRIGGER IF EXISTS generate_marche_numero_trigger ON marches;

-- ============================================================
-- 3b. TRIGGER RÉFÉRENCE CORRIGÉ (exercice au lieu d'année courante)
-- ============================================================
-- Avant: MKT-{CURRENT_DATE year}-NNNN (bug: année courante)
-- Après: MKT-{exercice}-NNNN (utilise le champ exercice du marché)
CREATE OR REPLACE FUNCTION public.generate_marche_numero()
RETURNS TRIGGER AS $$
DECLARE
  v_exercice integer;
  v_numero integer;
BEGIN
  -- Utiliser l'exercice du marché (pas l'année courante)
  v_exercice := COALESCE(NEW.exercice, EXTRACT(year FROM CURRENT_DATE)::integer);

  INSERT INTO public.marche_sequences (annee, dernier_numero)
  VALUES (v_exercice, 1)
  ON CONFLICT (annee)
  DO UPDATE SET
    dernier_numero = marche_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_numero;

  NEW.numero := 'MKT-' || v_exercice || '-' || LPAD(v_numero::text, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 4. TRIGGER PROCÉDURE RECOMMANDÉE (auto-calculée)
-- ============================================================
-- Seuils FCFA conformes au Code des marchés publics CI:
--   < 5M    → bon_commande
--   < 30M   → demande_cotation
--   < 100M  → appel_offres_restreint
--   >= 100M → appel_offres_ouvert
CREATE OR REPLACE FUNCTION public.fn_set_procedure_recommandee()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.montant, NEW.montant_estime, 0) < 5000000 THEN
    NEW.procedure_recommandee := 'bon_commande';
  ELSIF COALESCE(NEW.montant, NEW.montant_estime, 0) < 30000000 THEN
    NEW.procedure_recommandee := 'demande_cotation';
  ELSIF COALESCE(NEW.montant, NEW.montant_estime, 0) < 100000000 THEN
    NEW.procedure_recommandee := 'appel_offres_restreint';
  ELSE
    NEW.procedure_recommandee := 'appel_offres_ouvert';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_procedure_recommandee ON marches;
CREATE TRIGGER trg_set_procedure_recommandee
  BEFORE INSERT OR UPDATE OF montant, montant_estime ON marches
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_procedure_recommandee();

-- ============================================================
-- 5. BACKFILL procedure_recommandee sur les 16 marchés existants
-- ============================================================
UPDATE marches SET procedure_recommandee = CASE
  WHEN COALESCE(montant, montant_estime, 0) < 5000000 THEN 'bon_commande'
  WHEN COALESCE(montant, montant_estime, 0) < 30000000 THEN 'demande_cotation'
  WHEN COALESCE(montant, montant_estime, 0) < 100000000 THEN 'appel_offres_restreint'
  ELSE 'appel_offres_ouvert'
END
WHERE procedure_recommandee IS NULL;

-- ============================================================
-- VÉRIFICATION FINALE — 16 marchés
-- ============================================================
-- expression_besoin_id rempli: 0/16 (attendu — aucune EB liée)
-- procedure_recommandee rempli: 16/16 ✅
--   bon_commande (< 5M):           6 marchés
--   demande_cotation (5M-30M):     6 marchés
--   appel_offres_restreint (30M-100M): 4 marchés
--   appel_offres_ouvert (>= 100M): 0 marchés
--
-- Résumé des changements:
--   +6 colonnes: budget_line_id, date_publication, date_cloture,
--                montant_estime, montant_attribue, procedure_recommandee
--   +6 index: expression_besoin, budget_line, statut, type, mode_passation, exercice
--   -1 trigger doublon: generate_marche_numero_trigger (supprimé)
--   ~1 trigger corrigé: generate_marche_numero (exercice au lieu d'année courante)
--   +1 trigger: trg_set_procedure_recommandee (auto-calcul seuils)
--   +1 fonction: fn_set_procedure_recommandee()
