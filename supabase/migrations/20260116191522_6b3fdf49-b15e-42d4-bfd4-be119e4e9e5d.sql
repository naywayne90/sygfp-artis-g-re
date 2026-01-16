-- ==============================================
-- Migration: Lier Engagements et Liquidations à la chaîne Dossier
-- ==============================================

-- 1. Ajouter la colonne passation_marche_id à budget_engagements
ALTER TABLE public.budget_engagements 
ADD COLUMN IF NOT EXISTS passation_marche_id UUID REFERENCES public.passation_marche(id);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_engagements_pm ON public.budget_engagements(passation_marche_id);
CREATE INDEX IF NOT EXISTS idx_liquidations_dossier ON public.budget_liquidations(dossier_id);

-- 3. Table pour les pièces jointes des engagements (scanning)
CREATE TABLE IF NOT EXISTS public.engagement_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engagement_id UUID NOT NULL REFERENCES public.budget_engagements(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_engagement_attachments_eng ON public.engagement_attachments(engagement_id);

-- RLS pour engagement_attachments
ALTER TABLE public.engagement_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read engagement attachments"
  ON public.engagement_attachments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert engagement attachments"
  ON public.engagement_attachments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Creator can delete engagement attachments"
  ON public.engagement_attachments FOR DELETE
  TO authenticated USING (auth.uid() = uploaded_by);

-- 4. Trigger pour mettre à jour dossier.etape_courante sur engagement
CREATE OR REPLACE FUNCTION public.update_dossier_on_engagement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dossier_id IS NOT NULL THEN
    UPDATE public.dossiers
    SET etape_courante = 'engagement',
        montant_engage = NEW.montant,
        updated_at = now()
    WHERE id = NEW.dossier_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_dossier_on_engagement ON public.budget_engagements;
CREATE TRIGGER trg_update_dossier_on_engagement
  AFTER INSERT ON public.budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dossier_on_engagement();

-- 5. Trigger pour mettre à jour dossier.etape_courante sur liquidation
CREATE OR REPLACE FUNCTION public.update_dossier_on_liquidation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dossier_id IS NOT NULL THEN
    UPDATE public.dossiers
    SET etape_courante = 'liquidation',
        montant_liquide = COALESCE(montant_liquide, 0) + NEW.montant,
        updated_at = now()
    WHERE id = NEW.dossier_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_dossier_on_liquidation ON public.budget_liquidations;
CREATE TRIGGER trg_update_dossier_on_liquidation
  AFTER INSERT ON public.budget_liquidations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dossier_on_liquidation();

-- 6. Trigger pour mettre à jour dossier lors de validation engagement
CREATE OR REPLACE FUNCTION public.update_dossier_on_engagement_validated()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_dossier_on_engagement_validated ON public.budget_engagements;
CREATE TRIGGER trg_update_dossier_on_engagement_validated
  AFTER UPDATE ON public.budget_engagements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dossier_on_engagement_validated();

-- 7. Trigger pour mettre à jour dossier lors de validation liquidation
CREATE OR REPLACE FUNCTION public.update_dossier_on_liquidation_validated()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_dossier_on_liquidation_validated ON public.budget_liquidations;
CREATE TRIGGER trg_update_dossier_on_liquidation_validated
  AFTER UPDATE ON public.budget_liquidations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dossier_on_liquidation_validated();