-- ==============================================
-- Migration: Finaliser chaîne Ordonnancement -> Règlement -> Clôture Dossier
-- ==============================================

-- 1. Ajouter dossier_id aux ordonnancements et reglements
ALTER TABLE public.ordonnancements 
ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES public.dossiers(id);

ALTER TABLE public.reglements 
ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES public.dossiers(id);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_ordonnancements_dossier ON public.ordonnancements(dossier_id);
CREATE INDEX IF NOT EXISTS idx_reglements_dossier ON public.reglements(dossier_id);
CREATE INDEX IF NOT EXISTS idx_ordonnancements_liq ON public.ordonnancements(liquidation_id);
CREATE INDEX IF NOT EXISTS idx_reglements_ord ON public.reglements(ordonnancement_id);

-- 3. Trigger pour propager dossier_id et mettre à jour étape lors création ordonnancement
CREATE OR REPLACE FUNCTION public.update_dossier_on_ordonnancement()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_id UUID;
BEGIN
  -- Récupérer le dossier_id depuis la liquidation → engagement → expression_besoin
  SELECT COALESCE(
    l.dossier_id,
    e.dossier_id,
    eb.dossier_id
  ) INTO v_dossier_id
  FROM public.budget_liquidations l
  LEFT JOIN public.budget_engagements e ON l.engagement_id = e.id
  LEFT JOIN public.expressions_besoin eb ON e.expression_besoin_id = eb.id
  WHERE l.id = NEW.liquidation_id;

  -- Mettre à jour le dossier_id sur l'ordonnancement
  IF v_dossier_id IS NOT NULL THEN
    NEW.dossier_id := v_dossier_id;
    
    -- Mettre à jour l'étape courante du dossier
    UPDATE public.dossiers
    SET etape_courante = 'ordonnancement',
        montant_ordonnance = COALESCE(montant_ordonnance, 0) + NEW.montant,
        updated_at = now()
    WHERE id = v_dossier_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_dossier_on_ordonnancement ON public.ordonnancements;
CREATE TRIGGER trg_update_dossier_on_ordonnancement
  BEFORE INSERT ON public.ordonnancements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dossier_on_ordonnancement();

-- 4. Trigger pour propager dossier_id et mettre à jour étape lors création règlement
CREATE OR REPLACE FUNCTION public.update_dossier_on_reglement()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_id UUID;
  v_montant_ord NUMERIC;
  v_montant_paye NUMERIC;
BEGIN
  -- Récupérer le dossier_id depuis l'ordonnancement
  SELECT o.dossier_id, o.montant INTO v_dossier_id, v_montant_ord
  FROM public.ordonnancements o
  WHERE o.id = NEW.ordonnancement_id;

  -- Mettre à jour le dossier_id sur le règlement
  IF v_dossier_id IS NOT NULL THEN
    NEW.dossier_id := v_dossier_id;
    
    -- Mettre à jour l'étape courante du dossier
    UPDATE public.dossiers
    SET etape_courante = 'reglement',
        montant_paye = COALESCE(montant_paye, 0) + NEW.montant,
        updated_at = now()
    WHERE id = v_dossier_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_dossier_on_reglement ON public.reglements;
CREATE TRIGGER trg_update_dossier_on_reglement
  BEFORE INSERT ON public.reglements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dossier_on_reglement();

-- 5. Trigger pour clôturer le dossier après règlement complet
CREATE OR REPLACE FUNCTION public.cloture_dossier_on_reglement_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_dossier_id UUID;
  v_montant_ord NUMERIC;
  v_total_paye NUMERIC;
BEGIN
  -- Récupérer l'ordonnancement
  SELECT o.dossier_id, o.montant INTO v_dossier_id, v_montant_ord
  FROM public.ordonnancements o
  WHERE o.id = NEW.ordonnancement_id;

  IF v_dossier_id IS NOT NULL THEN
    -- Calculer le total payé pour cet ordonnancement
    SELECT COALESCE(SUM(montant), 0) INTO v_total_paye
    FROM public.reglements
    WHERE ordonnancement_id = NEW.ordonnancement_id
      AND statut NOT IN ('annule', 'rejete');

    -- Si l'ordonnancement est entièrement payé, vérifier si le dossier est complet
    IF v_total_paye >= v_montant_ord THEN
      -- Vérifier si tous les ordonnancements du dossier sont soldés
      IF NOT EXISTS (
        SELECT 1 FROM public.ordonnancements o
        WHERE o.dossier_id = v_dossier_id
          AND o.statut = 'valide'
          AND (o.montant - COALESCE(o.montant_paye, 0)) > 0
      ) THEN
        -- Clôturer le dossier
        UPDATE public.dossiers
        SET etape_courante = 'reglement',
            statut_global = 'cloture',
            statut_paiement = 'solde',
            date_cloture = now(),
            updated_at = now()
        WHERE id = v_dossier_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_cloture_dossier_on_reglement ON public.reglements;
CREATE TRIGGER trg_cloture_dossier_on_reglement
  AFTER INSERT OR UPDATE ON public.reglements
  FOR EACH ROW
  EXECUTE FUNCTION public.cloture_dossier_on_reglement_complete();

-- 6. Trigger pour mettre à jour dossier lors de validation ordonnancement
CREATE OR REPLACE FUNCTION public.update_dossier_on_ordonnancement_validated()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'valide' AND OLD.statut != 'valide' AND NEW.dossier_id IS NOT NULL THEN
    UPDATE public.dossiers
    SET statut_global = 'en_cours',
        updated_at = now()
    WHERE id = NEW.dossier_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_dossier_on_ordonnancement_validated ON public.ordonnancements;
CREATE TRIGGER trg_update_dossier_on_ordonnancement_validated
  AFTER UPDATE ON public.ordonnancements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dossier_on_ordonnancement_validated();

-- 7. Ajouter colonnes manquantes à dossiers si nécessaire
ALTER TABLE public.dossiers 
ADD COLUMN IF NOT EXISTS montant_ordonnance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS montant_paye NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_cloture TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT 'en_attente';