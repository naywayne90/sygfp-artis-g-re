-- =============================================
-- Gap 2 + Gap 3 : Colonnes audit trail pour delegations/interims
-- Tracabilite : QUI a valide et AU NOM DE QUI
-- =============================================

-- 1. Ajouter les colonnes audit trail a notes_sef
ALTER TABLE notes_sef
  ADD COLUMN IF NOT EXISTS validation_mode TEXT DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS validated_on_behalf_of UUID REFERENCES profiles(id);

COMMENT ON COLUMN notes_sef.validation_mode IS 'Mode de validation: direct, delegation, interim';
COMMENT ON COLUMN notes_sef.validated_on_behalf_of IS 'ID du mandant si validation par delegation ou interim';

-- 2. Ajouter les colonnes audit trail a engagement_validations
ALTER TABLE engagement_validations
  ADD COLUMN IF NOT EXISTS validation_mode TEXT DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS validated_on_behalf_of UUID REFERENCES profiles(id);

COMMENT ON COLUMN engagement_validations.validation_mode IS 'Mode de validation: direct, delegation, interim';
COMMENT ON COLUMN engagement_validations.validated_on_behalf_of IS 'ID du mandant si validation par delegation ou interim';

-- 3. Contrainte CHECK sur les valeurs autorisees
ALTER TABLE notes_sef
  DROP CONSTRAINT IF EXISTS chk_notes_sef_validation_mode;
ALTER TABLE notes_sef
  ADD CONSTRAINT chk_notes_sef_validation_mode
  CHECK (validation_mode IN ('direct', 'delegation', 'interim'));

ALTER TABLE engagement_validations
  DROP CONSTRAINT IF EXISTS chk_engagement_val_validation_mode;
ALTER TABLE engagement_validations
  ADD CONSTRAINT chk_engagement_val_validation_mode
  CHECK (validation_mode IN ('direct', 'delegation', 'interim'));
