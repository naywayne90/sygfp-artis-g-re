-- =====================================================
-- PROMPT 09: Table budget_movements pour traçabilité
-- =====================================================

-- 1. Table des mouvements budgétaires
CREATE TABLE IF NOT EXISTS public.budget_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_line_id UUID NOT NULL REFERENCES public.budget_lines(id) ON DELETE CASCADE,
  
  -- Type de mouvement
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN (
    'reservation', 'liberation_reservation', 
    'engagement', 'annulation_engagement',
    'liquidation', 'ordonnancement', 'paiement',
    'virement_entrant', 'virement_sortant',
    'ajustement', 'cloture_exercice'
  )),
  
  -- Montants
  montant NUMERIC(18,2) NOT NULL,
  sens TEXT NOT NULL CHECK (sens IN ('debit', 'credit')),
  
  -- Soldes avant/après pour traçabilité complète
  disponible_avant NUMERIC(18,2),
  disponible_apres NUMERIC(18,2),
  reserve_avant NUMERIC(18,2),
  reserve_apres NUMERIC(18,2),
  
  -- Entité liée
  entity_type TEXT, -- 'imputation', 'engagement', 'liquidation', 'ordonnancement', 'reglement', 'credit_transfer'
  entity_id UUID,
  entity_code TEXT,
  
  -- Contexte
  dossier_id UUID REFERENCES public.dossiers(id),
  exercice INTEGER NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE),
  motif TEXT,
  commentaire TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Statut du mouvement
  statut TEXT NOT NULL DEFAULT 'valide' CHECK (statut IN ('brouillon', 'valide', 'annule'))
);

-- Index pour performances
CREATE INDEX idx_budget_movements_line ON public.budget_movements(budget_line_id);
CREATE INDEX idx_budget_movements_entity ON public.budget_movements(entity_type, entity_id);
CREATE INDEX idx_budget_movements_exercice ON public.budget_movements(exercice);
CREATE INDEX idx_budget_movements_type ON public.budget_movements(type_mouvement);
CREATE INDEX idx_budget_movements_dossier ON public.budget_movements(dossier_id);
CREATE INDEX idx_budget_movements_created ON public.budget_movements(created_at DESC);

-- RLS Policies
ALTER TABLE public.budget_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view budget movements" ON public.budget_movements
  FOR SELECT USING (true);

CREATE POLICY "Authorized roles can manage budget movements" ON public.budget_movements
  FOR ALL USING (
    has_role(auth.uid(), 'ADMIN') OR 
    has_role(auth.uid(), 'DAAF') OR 
    has_role(auth.uid(), 'CB')
  );

-- 2. Table d'imputations multi-lignes (ventilation)
CREATE TABLE IF NOT EXISTS public.imputation_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imputation_id UUID NOT NULL REFERENCES public.imputations(id) ON DELETE CASCADE,
  budget_line_id UUID NOT NULL REFERENCES public.budget_lines(id),
  
  -- Ventilation
  montant NUMERIC(18,2) NOT NULL CHECK (montant > 0),
  pourcentage NUMERIC(5,2), -- Pour info
  
  -- Disponibilité au moment de l'imputation
  disponible_avant NUMERIC(18,2),
  disponible_apres NUMERIC(18,2),
  
  -- Mouvement associé
  movement_id UUID REFERENCES public.budget_movements(id),
  
  -- Statut
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'annulee')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_imputation_lignes_imputation ON public.imputation_lignes(imputation_id);
CREATE INDEX idx_imputation_lignes_budget ON public.imputation_lignes(budget_line_id);

ALTER TABLE public.imputation_lignes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view imputation lignes" ON public.imputation_lignes
  FOR SELECT USING (true);

CREATE POLICY "Authorized roles can manage imputation lignes" ON public.imputation_lignes
  FOR ALL USING (
    has_role(auth.uid(), 'ADMIN') OR 
    has_role(auth.uid(), 'DAAF') OR 
    has_role(auth.uid(), 'CB')
  );

-- 3. Ajouter colonnes manquantes sur imputations si absentes
DO $$
BEGIN
  -- Ajouter validated_at si absent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'imputations' AND column_name = 'validated_at') THEN
    ALTER TABLE public.imputations ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Ajouter validated_by si absent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'imputations' AND column_name = 'validated_by') THEN
    ALTER TABLE public.imputations ADD COLUMN validated_by UUID REFERENCES auth.users(id);
  END IF;
  
  -- Ajouter disponible_au_moment si absent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'imputations' AND column_name = 'disponible_au_moment') THEN
    ALTER TABLE public.imputations ADD COLUMN disponible_au_moment NUMERIC(18,2);
  END IF;
  
  -- Ajouter is_multi_ligne si absent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'imputations' AND column_name = 'is_multi_ligne') THEN
    ALTER TABLE public.imputations ADD COLUMN is_multi_ligne BOOLEAN DEFAULT false;
  END IF;
END
$$;

-- 4. Ajouter statut IMPUTE et READY_FOR_PASSATION aux dossiers si nécessaire
-- (Le statut est déjà géré par la colonne statut_global TEXT)

-- 5. Vue améliorée pour disponibilités avec réservations
CREATE OR REPLACE VIEW public.v_budget_disponibilite_complet AS
SELECT 
  bl.id,
  bl.code,
  bl.label,
  bl.exercice,
  bl.direction_id,
  d.code as direction_code,
  d.label as direction_label,
  bl.os_id,
  os.code as os_code,
  os.libelle as os_libelle,
  bl.mission_id,
  bl.nbe_id,
  bl.sysco_id,
  bl.dotation_initiale,
  COALESCE(bl.dotation_modifiee, bl.dotation_initiale) as dotation_modifiee,
  -- Calcul dotation actuelle avec virements
  COALESCE(bl.dotation_initiale, 0) 
    + COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE to_budget_line_id = bl.id AND status = 'execute'), 0)
    - COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE from_budget_line_id = bl.id AND status = 'execute'), 0)
  as dotation_actuelle,
  -- Engagements
  COALESCE(bl.total_engage, 0) as total_engage,
  -- Réservations (imputations non encore engagées)
  COALESCE(bl.montant_reserve, 0) as montant_reserve,
  -- Disponible brut
  COALESCE(bl.dotation_initiale, 0) 
    + COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE to_budget_line_id = bl.id AND status = 'execute'), 0)
    - COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE from_budget_line_id = bl.id AND status = 'execute'), 0)
    - COALESCE(bl.total_engage, 0)
  as disponible_brut,
  -- Disponible net (après réservations)
  COALESCE(bl.dotation_initiale, 0) 
    + COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE to_budget_line_id = bl.id AND status = 'execute'), 0)
    - COALESCE((SELECT SUM(amount) FROM credit_transfers WHERE from_budget_line_id = bl.id AND status = 'execute'), 0)
    - COALESCE(bl.total_engage, 0)
    - COALESCE(bl.montant_reserve, 0)
  as disponible_net,
  -- Flags
  bl.is_active,
  bl.statut
FROM budget_lines bl
LEFT JOIN directions d ON d.id = bl.direction_id
LEFT JOIN objectifs_strategiques os ON os.id = bl.os_id
WHERE bl.is_active = true;