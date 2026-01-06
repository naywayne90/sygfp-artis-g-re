-- =====================================================
-- CHAÎNE DE DÉPENSE: EB → PM (Passation Marché) → ENG
-- Migration simplifiée sans vue problématique
-- =====================================================

-- 1) Table des offres pour la passation de marché
CREATE TABLE IF NOT EXISTS public.marche_offres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marche_id UUID NOT NULL REFERENCES public.marches(id) ON DELETE CASCADE,
    prestataire_id UUID REFERENCES public.prestataires(id),
    nom_fournisseur TEXT, -- Si prestataire non enregistré
    montant_offre NUMERIC NOT NULL,
    delai_execution INTEGER, -- en jours
    note_technique NUMERIC, -- Note sur 100
    note_financiere NUMERIC, -- Note sur 100
    note_globale NUMERIC, -- Pondération
    observations TEXT,
    est_retenu BOOLEAN DEFAULT FALSE,
    motif_selection TEXT, -- Motif si retenu
    document_path TEXT, -- Chemin vers l'offre uploadée
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_marche_offres_marche_id ON public.marche_offres(marche_id);
CREATE INDEX IF NOT EXISTS idx_marche_offres_prestataire_id ON public.marche_offres(prestataire_id);

-- RLS pour marche_offres
ALTER TABLE public.marche_offres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all offres" ON public.marche_offres
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert offres" ON public.marche_offres
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update offres" ON public.marche_offres
    FOR UPDATE TO authenticated USING (true);

-- 2) Ajouter colonnes manquantes à la table marches
ALTER TABLE public.marches 
    ADD COLUMN IF NOT EXISTS calendrier_lancement DATE,
    ADD COLUMN IF NOT EXISTS calendrier_ouverture DATE,
    ADD COLUMN IF NOT EXISTS calendrier_attribution DATE,
    ADD COLUMN IF NOT EXISTS calendrier_notification DATE,
    ADD COLUMN IF NOT EXISTS commission_membres TEXT[], -- Liste des évaluateurs
    ADD COLUMN IF NOT EXISTS pv_attribution_path TEXT, -- Chemin du PV
    ADD COLUMN IF NOT EXISTS annee INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- 3) Ajouter colonnes pour lier EB à une note imputée
ALTER TABLE public.expressions_besoin
    ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES public.notes_dg(id),
    ADD COLUMN IF NOT EXISTS ligne_budgetaire_id UUID REFERENCES public.budget_lines(id),
    ADD COLUMN IF NOT EXISTS criteres_evaluation TEXT,
    ADD COLUMN IF NOT EXISTS type_procedure TEXT DEFAULT 'consultation';

-- 4) Créer une vue pour les notes imputées disponibles pour EB
CREATE OR REPLACE VIEW public.notes_imputees_disponibles AS
SELECT 
    n.id,
    n.numero,
    n.objet,
    n.montant_estime,
    n.budget_line_id,
    n.direction_id,
    n.exercice,
    n.imputed_at,
    d.label as direction_label,
    d.sigle as direction_sigle,
    bl.code as ligne_code,
    bl.label as ligne_label
FROM public.notes_dg n
LEFT JOIN public.directions d ON n.direction_id = d.id
LEFT JOIN public.budget_lines bl ON n.budget_line_id = bl.id
WHERE n.statut = 'impute'
AND NOT EXISTS (
    SELECT 1 FROM public.expressions_besoin eb 
    WHERE eb.note_id = n.id 
    AND eb.statut NOT IN ('annule', 'rejeté')
);

-- 5) Mettre à jour timestamp automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_marche_offres_updated_at ON public.marche_offres;
CREATE TRIGGER update_marche_offres_updated_at
    BEFORE UPDATE ON public.marche_offres
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6) Fonction pour créer un engagement depuis une EB validée
CREATE OR REPLACE FUNCTION public.create_engagement_from_eb(
    p_expression_besoin_id UUID,
    p_budget_line_id UUID,
    p_montant NUMERIC,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_engagement_id UUID;
    v_numero TEXT;
    v_count INTEGER;
    v_exercice INTEGER;
    v_eb RECORD;
BEGIN
    -- Récupérer l'EB
    SELECT * INTO v_eb FROM public.expressions_besoin WHERE id = p_expression_besoin_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expression de besoin non trouvée';
    END IF;
    
    IF v_eb.statut != 'validé' THEN
        RAISE EXCEPTION 'L''expression de besoin doit être validée';
    END IF;
    
    v_exercice := COALESCE(v_eb.exercice, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    
    -- Générer le numéro
    SELECT COUNT(*) + 1 INTO v_count 
    FROM public.budget_engagements 
    WHERE exercice = v_exercice;
    
    v_numero := 'ENG-' || v_exercice || '-' || LPAD(v_count::TEXT, 4, '0');
    
    -- Créer l'engagement
    INSERT INTO public.budget_engagements (
        numero,
        objet,
        montant,
        budget_line_id,
        expression_besoin_id,
        marche_id,
        exercice,
        date_engagement,
        statut,
        workflow_status,
        current_step,
        created_by
    ) VALUES (
        v_numero,
        v_eb.objet,
        p_montant,
        p_budget_line_id,
        p_expression_besoin_id,
        v_eb.marche_id,
        v_exercice,
        CURRENT_DATE,
        'brouillon',
        'en_attente',
        0,
        p_user_id
    ) RETURNING id INTO v_engagement_id;
    
    RETURN v_engagement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;