-- ============================================================================
-- SYGFP - Ajout des champs QR Code et PDF pour les Notes DG
-- Migration: 20260119140000_add_notedg_qr_pdf_fields.sql
--
-- Ajoute les champs nécessaires pour la génération de PDF et la vérification QR
-- ============================================================================

-- ============================================================================
-- 1. AJOUT DES COLONNES QR ET PDF
-- ============================================================================

-- Token QR unique pour la vérification
ALTER TABLE notes_direction_generale
ADD COLUMN IF NOT EXISTS qr_token UUID UNIQUE;

-- Date de génération du QR
ALTER TABLE notes_direction_generale
ADD COLUMN IF NOT EXISTS qr_generated_at TIMESTAMPTZ;

-- URL du PDF stocké
ALTER TABLE notes_direction_generale
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Date de génération du PDF
ALTER TABLE notes_direction_generale
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Hash d'intégrité du PDF
ALTER TABLE notes_direction_generale
ADD COLUMN IF NOT EXISTS pdf_hash TEXT;

-- Observations du DG (page 2 du PDF)
ALTER TABLE notes_direction_generale
ADD COLUMN IF NOT EXISTS observations_dg TEXT;

-- ============================================================================
-- 2. INDEX POUR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notes_dg_qr_token ON notes_direction_generale(qr_token);

-- ============================================================================
-- 3. FONCTION: Génération du token QR lors de la validation
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_note_dg_qr_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer un QR token uniquement lors de la validation DG
  IF NEW.statut = 'dg_valide' AND OLD.statut = 'soumise_dg' AND NEW.qr_token IS NULL THEN
    NEW.qr_token := gen_random_uuid();
    NEW.qr_generated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-génération du QR token
DROP TRIGGER IF EXISTS trg_note_dg_qr_token ON notes_direction_generale;
CREATE TRIGGER trg_note_dg_qr_token
  BEFORE UPDATE ON notes_direction_generale
  FOR EACH ROW
  EXECUTE FUNCTION generate_note_dg_qr_token();

-- ============================================================================
-- 4. FONCTION RPC: Vérification d'une note via QR token
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_note_dg_by_token(p_token UUID)
RETURNS TABLE (
  reference TEXT,
  objet TEXT,
  date_note DATE,
  statut TEXT,
  validated_at TIMESTAMPTZ,
  validated_by_name TEXT,
  direction_name TEXT,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.reference,
    n.objet,
    n.date_note,
    n.statut,
    n.signed_at AS validated_at,
    COALESCE(p.first_name || ' ' || p.last_name, 'Non disponible') AS validated_by_name,
    COALESCE(d.label, 'Non spécifiée') AS direction_name,
    (n.statut IN ('dg_valide', 'diffusee'))::BOOLEAN AS is_valid
  FROM notes_direction_generale n
  LEFT JOIN profiles p ON p.id = n.signed_by
  LEFT JOIN directions d ON d.id = n.direction_id
  WHERE n.qr_token = p_token;

  -- Si aucune ligne retournée, le token est invalide
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      NULL::TEXT,
      NULL::TEXT,
      NULL::DATE,
      NULL::TEXT,
      NULL::TIMESTAMPTZ,
      NULL::TEXT,
      NULL::TEXT,
      FALSE::BOOLEAN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accès public pour la vérification (sans authentification)
GRANT EXECUTE ON FUNCTION verify_note_dg_by_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION verify_note_dg_by_token(UUID) TO authenticated;

-- ============================================================================
-- 5. COMMENTAIRES
-- ============================================================================

COMMENT ON COLUMN notes_direction_generale.qr_token IS 'Token unique pour la vérification QR de la note';
COMMENT ON COLUMN notes_direction_generale.qr_generated_at IS 'Date de génération du QR token (lors de la validation DG)';
COMMENT ON COLUMN notes_direction_generale.pdf_url IS 'URL du fichier PDF généré et stocké';
COMMENT ON COLUMN notes_direction_generale.pdf_generated_at IS 'Date de génération du PDF';
COMMENT ON COLUMN notes_direction_generale.pdf_hash IS 'Hash SHA-256 du PDF pour vérification d''intégrité';
COMMENT ON COLUMN notes_direction_generale.observations_dg IS 'Observations du DG (affichées sur la page 2 du PDF)';
COMMENT ON FUNCTION verify_note_dg_by_token IS 'Vérifie une note DG via son QR token et retourne les informations publiques';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
