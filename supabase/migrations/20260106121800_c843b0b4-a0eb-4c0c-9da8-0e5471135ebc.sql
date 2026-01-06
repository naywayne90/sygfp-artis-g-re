-- =====================================================
-- PHASE A: Consolidation Exercice + Dossier + Workflow
-- =====================================================

-- 1. Enrichir exercices_budgetaires
ALTER TABLE exercices_budgetaires 
ADD COLUMN IF NOT EXISTS code_exercice TEXT,
ADD COLUMN IF NOT EXISTS libelle TEXT;

-- Mise à jour des valeurs existantes
UPDATE exercices_budgetaires SET 
  code_exercice = annee::TEXT,
  libelle = 'Exercice budgétaire ' || annee
WHERE code_exercice IS NULL;

-- 2. Enrichir dossiers
ALTER TABLE dossiers 
ADD COLUMN IF NOT EXISTS type_dossier TEXT DEFAULT 'AEF' CHECK (type_dossier IN ('AEF', 'SEF')),
ADD COLUMN IF NOT EXISTS beneficiaire_id UUID REFERENCES prestataires(id);

-- 3. Créer workflow_etapes (définition des étapes de la chaîne de la dépense)
CREATE TABLE IF NOT EXISTS workflow_etapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  libelle TEXT NOT NULL,
  ordre INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS sur workflow_etapes
ALTER TABLE workflow_etapes ENABLE ROW LEVEL SECURITY;

-- Politique lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can view workflow_etapes"
ON workflow_etapes FOR SELECT
TO authenticated
USING (true);

-- Politique admin pour modifications
CREATE POLICY "Admins can manage workflow_etapes"
ON workflow_etapes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- Seed des étapes de la chaîne de la dépense
INSERT INTO workflow_etapes (code, libelle, ordre, description) VALUES
  ('NOTE_AEF', 'Note AEF', 1, 'Note d''Autorisation d''Engagement Financier'),
  ('NOTE_SEF', 'Note SEF', 2, 'Note de Service d''Exécution Financière'),
  ('IMPUTATION', 'Imputation budgétaire', 3, 'Affectation aux lignes budgétaires'),
  ('EXPRESSION_BESOIN', 'Expression de besoin', 4, 'Formulation du besoin par la direction'),
  ('PASSATION_MARCHE', 'Passation de marché', 5, 'Processus de sélection du prestataire'),
  ('ENGAGEMENT', 'Engagement', 6, 'Engagement juridique de la dépense'),
  ('LIQUIDATION', 'Liquidation', 7, 'Certification du service fait'),
  ('ORDONNANCEMENT', 'Ordonnancement', 8, 'Ordre de paiement'),
  ('REGLEMENT', 'Règlement', 9, 'Paiement effectif au bénéficiaire')
ON CONFLICT (code) DO UPDATE SET
  libelle = EXCLUDED.libelle,
  ordre = EXCLUDED.ordre,
  description = EXCLUDED.description;

-- 4. Créer workflow_instances (suivi du workflow par dossier)
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  etape_code TEXT NOT NULL REFERENCES workflow_etapes(code),
  entity_id UUID,
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'soumis', 'a_valider', 'valide', 'rejete', 'annule', 'differe')),
  assigned_to UUID REFERENCES profiles(id),
  date_debut TIMESTAMPTZ DEFAULT now(),
  date_fin TIMESTAMPTZ,
  commentaire TEXT,
  pieces_jointes TEXT[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dossier_id, etape_code)
);

-- Activer RLS sur workflow_instances
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

-- Politique lecture basée sur l'accès au dossier
CREATE POLICY "Users can view workflow_instances for accessible dossiers"
ON workflow_instances FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = workflow_instances.dossier_id
    AND (
      d.created_by = auth.uid()
      OR d.demandeur_id = auth.uid()
      OR public.has_role(auth.uid(), 'ADMIN')
      OR public.has_role(auth.uid(), 'DG')
      OR public.has_role(auth.uid(), 'DAAF')
    )
  )
);

-- Politique création
CREATE POLICY "Users can create workflow_instances"
ON workflow_instances FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dossiers d
    WHERE d.id = workflow_instances.dossier_id
    AND (
      d.created_by = auth.uid()
      OR public.has_role(auth.uid(), 'ADMIN')
      OR public.has_role(auth.uid(), 'DG')
      OR public.has_role(auth.uid(), 'DAAF')
    )
  )
);

-- Politique mise à jour
CREATE POLICY "Users can update workflow_instances"
ON workflow_instances FOR UPDATE
TO authenticated
USING (
  workflow_instances.assigned_to = auth.uid()
  OR workflow_instances.created_by = auth.uid()
  OR public.has_role(auth.uid(), 'ADMIN')
  OR public.has_role(auth.uid(), 'DG')
  OR public.has_role(auth.uid(), 'DAAF')
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_workflow_instances_dossier ON workflow_instances(dossier_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_etape ON workflow_instances(etape_code);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_statut ON workflow_instances(statut);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_assigned ON workflow_instances(assigned_to);

-- Trigger pour updated_at
CREATE TRIGGER update_workflow_instances_updated_at
  BEFORE UPDATE ON workflow_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Créer user_exercices (autorisations par exercice)
CREATE TABLE IF NOT EXISTS user_exercices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercice_id UUID NOT NULL REFERENCES exercices_budgetaires(id) ON DELETE CASCADE,
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, exercice_id)
);

-- Activer RLS sur user_exercices
ALTER TABLE user_exercices ENABLE ROW LEVEL SECURITY;

-- Politique lecture - utilisateur voit ses propres autorisations
CREATE POLICY "Users can view their own exercice permissions"
ON user_exercices FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'ADMIN')
);

-- Politique admin pour gestion
CREATE POLICY "Admins can manage user_exercices"
ON user_exercices FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_exercices_user ON user_exercices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exercices_exercice ON user_exercices(exercice_id);

-- 6. Fonction helper pour vérifier accès exercice
CREATE OR REPLACE FUNCTION user_can_access_exercice(p_exercice INTEGER)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_exercices ue
    JOIN exercices_budgetaires eb ON eb.id = ue.exercice_id
    WHERE ue.user_id = auth.uid()
      AND eb.annee = p_exercice
      AND ue.can_read = true
  )
  OR public.has_role(auth.uid(), 'ADMIN')
  OR public.has_role(auth.uid(), 'DG')
$$;

-- 7. Seed: donner accès aux exercices actifs à tous les utilisateurs existants
INSERT INTO user_exercices (user_id, exercice_id, can_read, can_write)
SELECT p.id, eb.id, true, true
FROM profiles p
CROSS JOIN exercices_budgetaires eb
WHERE eb.est_actif = true
ON CONFLICT (user_id, exercice_id) DO NOTHING;

-- 8. Fonction pour obtenir l'étape courante d'un dossier
CREATE OR REPLACE FUNCTION get_dossier_current_step(p_dossier_id UUID)
RETURNS TABLE (
  etape_code TEXT,
  etape_libelle TEXT,
  etape_ordre INTEGER,
  statut TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    we.code,
    we.libelle,
    we.ordre,
    wi.statut
  FROM workflow_instances wi
  JOIN workflow_etapes we ON we.code = wi.etape_code
  WHERE wi.dossier_id = p_dossier_id
    AND wi.statut NOT IN ('valide', 'annule')
  ORDER BY we.ordre
  LIMIT 1;
$$;

-- 9. Fonction pour obtenir la progression complète d'un dossier
CREATE OR REPLACE FUNCTION get_dossier_workflow_progress(p_dossier_id UUID)
RETURNS TABLE (
  etape_code TEXT,
  etape_libelle TEXT,
  etape_ordre INTEGER,
  statut TEXT,
  date_debut TIMESTAMPTZ,
  date_fin TIMESTAMPTZ,
  assigned_to_name TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    we.code,
    we.libelle,
    we.ordre,
    COALESCE(wi.statut, 'pending') as statut,
    wi.date_debut,
    wi.date_fin,
    p.full_name as assigned_to_name
  FROM workflow_etapes we
  LEFT JOIN workflow_instances wi ON wi.etape_code = we.code AND wi.dossier_id = p_dossier_id
  LEFT JOIN profiles p ON p.id = wi.assigned_to
  WHERE we.is_active = true
  ORDER BY we.ordre;
$$;