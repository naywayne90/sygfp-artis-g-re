
-- Add delay tracking columns to all tables FIRST
ALTER TABLE public.budget_liquidations
ADD COLUMN IF NOT EXISTS date_entree_etape timestamp with time zone,
ADD COLUMN IF NOT EXISTS delai_validation_jours integer;

ALTER TABLE public.budget_engagements
ADD COLUMN IF NOT EXISTS date_entree_etape timestamp with time zone,
ADD COLUMN IF NOT EXISTS delai_validation_jours integer;

ALTER TABLE public.ordonnancements
ADD COLUMN IF NOT EXISTS date_entree_etape timestamp with time zone,
ADD COLUMN IF NOT EXISTS delai_validation_jours integer;

ALTER TABLE public.reglements
ADD COLUMN IF NOT EXISTS date_entree_etape timestamp with time zone,
ADD COLUMN IF NOT EXISTS delai_validation_jours integer;

-- Trigger for liquidation timing
CREATE OR REPLACE FUNCTION track_liquidation_step_timing()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.statut = 'brouillon' AND NEW.statut = 'soumis' THEN
    NEW.date_entree_etape := now();
  END IF;
  
  IF NEW.statut = 'valide' AND OLD.statut != 'valide' THEN
    IF NEW.date_entree_etape IS NOT NULL THEN
      NEW.delai_validation_jours := EXTRACT(DAY FROM (now() - NEW.date_entree_etape));
    END IF;
  END IF;
  
  IF NEW.current_step IS NOT NULL AND (OLD.current_step IS NULL OR NEW.current_step != OLD.current_step) THEN
    NEW.date_entree_etape := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_track_liquidation_step_timing ON budget_liquidations;
CREATE TRIGGER trg_track_liquidation_step_timing
BEFORE UPDATE ON budget_liquidations
FOR EACH ROW
EXECUTE FUNCTION track_liquidation_step_timing();

-- Trigger for engagement timing
CREATE OR REPLACE FUNCTION track_engagement_step_timing()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.statut = 'brouillon' AND NEW.statut = 'soumis' THEN
    NEW.date_entree_etape := now();
  END IF;
  
  IF NEW.statut = 'valide' AND OLD.statut != 'valide' THEN
    IF NEW.date_entree_etape IS NOT NULL THEN
      NEW.delai_validation_jours := EXTRACT(DAY FROM (now() - NEW.date_entree_etape));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_track_engagement_step_timing ON budget_engagements;
CREATE TRIGGER trg_track_engagement_step_timing
BEFORE UPDATE ON budget_engagements
FOR EACH ROW
EXECUTE FUNCTION track_engagement_step_timing();

-- Trigger for ordonnancement timing
CREATE OR REPLACE FUNCTION track_ordonnancement_step_timing()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.statut = 'brouillon' AND NEW.statut = 'soumis' THEN
    NEW.date_entree_etape := now();
  END IF;
  
  IF NEW.statut = 'valide' AND OLD.statut != 'valide' THEN
    IF NEW.date_entree_etape IS NOT NULL THEN
      NEW.delai_validation_jours := EXTRACT(DAY FROM (now() - NEW.date_entree_etape));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_track_ordonnancement_step_timing ON ordonnancements;
CREATE TRIGGER trg_track_ordonnancement_step_timing
BEFORE UPDATE ON ordonnancements
FOR EACH ROW
EXECUTE FUNCTION track_ordonnancement_step_timing();

-- Updated view with all modules
DROP VIEW IF EXISTS v_etape_delais;
CREATE VIEW v_etape_delais AS
SELECT
  'liquidation' as module,
  exercice,
  COALESCE(AVG(delai_validation_jours), 0) as delai_moyen_validation,
  MIN(delai_validation_jours) as delai_min,
  MAX(delai_validation_jours) as delai_max,
  COUNT(*) FILTER (WHERE statut = 'valide') as count_valides
FROM budget_liquidations
WHERE delai_validation_jours IS NOT NULL
GROUP BY exercice
UNION ALL
SELECT
  'engagement' as module,
  exercice,
  COALESCE(AVG(delai_validation_jours), 0) as delai_moyen_validation,
  MIN(delai_validation_jours) as delai_min,
  MAX(delai_validation_jours) as delai_max,
  COUNT(*) FILTER (WHERE statut = 'valide') as count_valides
FROM budget_engagements
WHERE delai_validation_jours IS NOT NULL
GROUP BY exercice
UNION ALL
SELECT
  'ordonnancement' as module,
  exercice,
  COALESCE(AVG(delai_validation_jours), 0) as delai_moyen_validation,
  MIN(delai_validation_jours) as delai_min,
  MAX(delai_validation_jours) as delai_max,
  COUNT(*) FILTER (WHERE statut = 'valide' OR statut = 'signe') as count_valides
FROM ordonnancements
WHERE delai_validation_jours IS NOT NULL
GROUP BY exercice;
