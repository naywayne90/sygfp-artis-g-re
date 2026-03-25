-- Ajouter reference au plan de passation des marches (Art. 20.3 CMP)
ALTER TABLE expressions_besoin
ADD COLUMN IF NOT EXISTS reference_plan_passation TEXT;

COMMENT ON COLUMN expressions_besoin.reference_plan_passation IS 'Référence au Plan de Passation des Marchés (Art. 20.3 CMP - obligatoire sous peine de nullité)';
