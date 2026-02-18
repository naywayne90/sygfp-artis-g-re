-- ============================================================
-- Prompt 6 BACKEND — Renforcement tables soumissions & marche_offres
-- Date: 2026-02-18
-- Description: Colonnes, CHECK, indexes, triggers pour soumissions
-- ============================================================

-- ============================================================
-- 1. TABLE EXISTANTE soumissions (16 colonnes initiales)
-- ============================================================
-- La table existait déjà avec la structure complète:
--   id (uuid PK), lot_id (uuid FK NOT NULL → marche_lots),
--   prestataire_id (uuid FK NOT NULL → prestataires),
--   date_soumission (timestamptz NOT NULL, default now()),
--   montant_offre (numeric NOT NULL), delai_execution (int),
--   note_technique (numeric), note_financiere (numeric),
--   note_globale (numeric), classement (int),
--   statut (varchar, default 'recue'), motif_rejet (text),
--   observations (text), created_by (uuid FK → profiles),
--   created_at (timestamptz), updated_at (timestamptz)
--
-- Existant:
--   RLS: activé ✅
--   Policy: "Authenticated access soumissions" (ALL, authenticated) — permissif
--   FK: created_by→profiles, lot_id→marche_lots, prestataire_id→prestataires
--   Index: PK + idx_soumissions_lot
--   Triggers: AUCUN ⚠️
--   Données: 0 soumissions

-- ============================================================
-- 2. TABLE EXISTANTE marche_offres (15 colonnes)
-- ============================================================
-- Structure: id, marche_id (FK→marches), prestataire_id (FK→prestataires),
--   nom_fournisseur, montant_offre, delai_execution,
--   note_technique, note_financiere, note_globale,
--   observations, est_retenu, motif_selection, document_path,
--   created_at, updated_at
--
-- Existant:
--   RLS: activé ✅
--   FK: marche_id→marches, prestataire_id→prestataires
--   Index: PK + idx_marche_offres_marche_id + idx_marche_offres_prestataire_id
--   Triggers: AUCUN ⚠️
--   Données: 0 offres

-- ============================================================
-- 3. COLONNES AJOUTÉES sur soumissions (+9)
-- ============================================================
ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS marche_id UUID REFERENCES marches(id);
ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS nom_entreprise TEXT;
ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS rccm TEXT;
ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS contact_nom TEXT;
ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS contact_telephone TEXT;
ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS document_offre_url TEXT;
ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS document_administratif_url TEXT;
ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS document_technique_url TEXT;

-- ============================================================
-- 4. CHECK CONSTRAINT sur statut
-- ============================================================
ALTER TABLE soumissions DROP CONSTRAINT IF EXISTS soumissions_statut_check;
ALTER TABLE soumissions ADD CONSTRAINT soumissions_statut_check
  CHECK (statut IN ('recue','en_evaluation','conforme','non_conforme','retenue','eliminee','annulee'));

-- ============================================================
-- 5. INDEXES (+4 nouveaux)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_soumissions_marche ON soumissions(marche_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_prestataire ON soumissions(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_soumissions_statut ON soumissions(statut);
CREATE INDEX IF NOT EXISTS idx_soumissions_date ON soumissions(date_soumission);

-- ============================================================
-- 6. TRIGGER updated_at sur soumissions
-- ============================================================
DROP TRIGGER IF EXISTS update_soumissions_updated_at ON soumissions;
CREATE TRIGGER update_soumissions_updated_at
  BEFORE UPDATE ON soumissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. TRIGGER note_globale auto-calculée (soumissions + marche_offres)
-- ============================================================
-- Pondération standard marchés publics CI:
--   note_globale = (note_technique * 0.6) + (note_financiere * 0.4)
CREATE OR REPLACE FUNCTION public.fn_calc_soumission_note_globale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.note_technique IS NOT NULL AND NEW.note_financiere IS NOT NULL THEN
    NEW.note_globale := ROUND((NEW.note_technique * 0.6) + (NEW.note_financiere * 0.4), 2);
  ELSIF NEW.note_technique IS NOT NULL THEN
    NEW.note_globale := NEW.note_technique;
  ELSIF NEW.note_financiere IS NOT NULL THEN
    NEW.note_globale := NEW.note_financiere;
  ELSE
    NEW.note_globale := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_calc_soumission_note ON soumissions;
CREATE TRIGGER trg_calc_soumission_note
  BEFORE INSERT OR UPDATE OF note_technique, note_financiere ON soumissions
  FOR EACH ROW
  EXECUTE FUNCTION fn_calc_soumission_note_globale();

-- ============================================================
-- 8. TRIGGERS marche_offres (cohérence — même logique)
-- ============================================================
DROP TRIGGER IF EXISTS trg_calc_offre_note ON marche_offres;
CREATE TRIGGER trg_calc_offre_note
  BEFORE INSERT OR UPDATE OF note_technique, note_financiere ON marche_offres
  FOR EACH ROW
  EXECUTE FUNCTION fn_calc_soumission_note_globale();

DROP TRIGGER IF EXISTS update_marche_offres_updated_at ON marche_offres;
CREATE TRIGGER update_marche_offres_updated_at
  BEFORE UPDATE ON marche_offres
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. VÉRIFICATION — Liens prestataires
-- ============================================================
-- 431 prestataires existants (raison_sociale, pas nom)
-- FK soumissions.prestataire_id → prestataires.id ✅
-- FK marche_offres.prestataire_id → prestataires.id ✅
-- Nouveau: FK soumissions.marche_id → marches.id ✅
--
-- Résumé des changements:
--   soumissions:
--     +9 colonnes: marche_id, nom_entreprise, rccm, contact_nom,
--                  contact_email, contact_telephone,
--                  document_offre_url, document_administratif_url,
--                  document_technique_url
--     +1 CHECK constraint: statut IN (7 valeurs)
--     +4 indexes: marche, prestataire, statut, date
--     +2 triggers: update_soumissions_updated_at, trg_calc_soumission_note
--     +1 FK: marche_id → marches
--   marche_offres:
--     +2 triggers: update_marche_offres_updated_at, trg_calc_offre_note
--   Fonction partagée:
--     +1 fonction: fn_calc_soumission_note_globale()
--     Pondération: technique 60% + financière 40%
