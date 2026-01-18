-- ============================================
-- MIGRATION: Notifications Budgétaires
-- ============================================
-- Table pour gérer les notifications budgétaires
-- avec support des pièces jointes
-- ============================================

-- 1. Table des notifications budgétaires
CREATE TABLE IF NOT EXISTS public.budget_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence unique par exercice
  reference VARCHAR(50) NOT NULL,
  numero_ordre INTEGER NOT NULL DEFAULT 1,

  -- Lien exercice
  exercice_id UUID NOT NULL REFERENCES public.exercices_budgetaires(id),
  annee INTEGER NOT NULL,

  -- Contenu
  objet TEXT NOT NULL,
  montant NUMERIC(18, 2) NOT NULL CHECK (montant > 0),

  -- Origine des fonds (lien vers funding_sources ou valeur legacy)
  origine_fonds_id UUID REFERENCES public.funding_sources(id),
  origine_fonds_code VARCHAR(50), -- Pour compatibilité legacy

  -- Nature de dépense
  nature_depense VARCHAR(100),

  -- Dates
  date_notification DATE NOT NULL DEFAULT CURRENT_DATE,
  date_reception DATE,

  -- Workflow
  statut VARCHAR(20) NOT NULL DEFAULT 'brouillon' CHECK (statut IN (
    'brouillon', 'soumis', 'valide', 'rejete', 'annule'
  )),

  -- Validation
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),

  -- Notes
  commentaire TEXT,

  -- Contrainte unicité référence par exercice
  CONSTRAINT unique_notification_reference UNIQUE (exercice_id, reference)
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_budget_notifications_exercice ON public.budget_notifications(exercice_id);
CREATE INDEX IF NOT EXISTS idx_budget_notifications_annee ON public.budget_notifications(annee);
CREATE INDEX IF NOT EXISTS idx_budget_notifications_statut ON public.budget_notifications(statut);
CREATE INDEX IF NOT EXISTS idx_budget_notifications_origine ON public.budget_notifications(origine_fonds_id);
CREATE INDEX IF NOT EXISTS idx_budget_notifications_date ON public.budget_notifications(date_notification DESC);

-- 3. RLS
ALTER TABLE public.budget_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view budget notifications" ON public.budget_notifications
  FOR SELECT USING (true);

CREATE POLICY "Authorized roles can manage notifications" ON public.budget_notifications
  FOR ALL USING (
    public.has_role(auth.uid(), 'ADMIN') OR
    public.has_role(auth.uid(), 'DAAF') OR
    public.has_role(auth.uid(), 'CB') OR
    public.has_role(auth.uid(), 'DG')
  );

-- 4. Table des pièces jointes (générique pour toutes les entités)
CREATE TABLE IF NOT EXISTS public.entity_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entité liée (polymorphique)
  entity_type VARCHAR(50) NOT NULL, -- 'budget_notification', 'engagement', etc.
  entity_id UUID NOT NULL,

  -- Fichier
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(100), -- MIME type
  file_size INTEGER, -- en bytes
  file_url TEXT NOT NULL,

  -- Intégrité
  checksum VARCHAR(64), -- SHA-256

  -- Catégorie
  category VARCHAR(50) DEFAULT 'document', -- document, justificatif, visa, etc.
  description TEXT,

  -- Audit
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- 5. Index pour attachments
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON public.entity_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded ON public.entity_attachments(uploaded_at DESC);

-- 6. RLS pour attachments
ALTER TABLE public.entity_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view attachments" ON public.entity_attachments
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can upload attachments" ON public.entity_attachments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own attachments" ON public.entity_attachments
  FOR UPDATE USING (
    uploaded_by = auth.uid() OR
    public.has_role(auth.uid(), 'ADMIN')
  );

-- 7. Séquence pour numéro d'ordre par exercice
CREATE OR REPLACE FUNCTION get_next_notification_numero(p_exercice_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_ordre), 0) + 1
  INTO v_next
  FROM public.budget_notifications
  WHERE exercice_id = p_exercice_id;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour générer la référence automatique
CREATE OR REPLACE FUNCTION generate_notification_reference(p_exercice_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
BEGIN
  -- Récupérer l'année de l'exercice
  SELECT annee INTO v_annee
  FROM public.exercices_budgetaires
  WHERE id = p_exercice_id;

  -- Récupérer le prochain numéro
  v_numero := get_next_notification_numero(p_exercice_id);

  -- Format: NB-2026-0001
  RETURN 'NB-' || v_annee || '-' || LPAD(v_numero::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger pour auto-remplir référence et numéro
CREATE OR REPLACE FUNCTION set_notification_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := generate_notification_reference(NEW.exercice_id);
  END IF;

  IF NEW.numero_ordre IS NULL OR NEW.numero_ordre = 0 THEN
    NEW.numero_ordre := get_next_notification_numero(NEW.exercice_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_notification_reference ON public.budget_notifications;
CREATE TRIGGER trigger_set_notification_reference
  BEFORE INSERT ON public.budget_notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_reference();

-- 10. Trigger updated_at
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notification_updated ON public.budget_notifications;
CREATE TRIGGER trigger_notification_updated
  BEFORE UPDATE ON public.budget_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

-- 11. Vue enrichie des notifications
CREATE OR REPLACE VIEW v_budget_notifications AS
SELECT
  bn.*,
  e.libelle as exercice_libelle,
  fs.libelle as origine_fonds_libelle,
  fs.type as origine_fonds_type,
  p_created.full_name as created_by_name,
  p_validated.full_name as validated_by_name,
  (
    SELECT COUNT(*)
    FROM public.entity_attachments ea
    WHERE ea.entity_type = 'budget_notification'
    AND ea.entity_id = bn.id
    AND ea.deleted_at IS NULL
  ) as attachments_count
FROM public.budget_notifications bn
LEFT JOIN public.exercices_budgetaires e ON e.id = bn.exercice_id
LEFT JOIN public.funding_sources fs ON fs.id = bn.origine_fonds_id
LEFT JOIN public.profiles p_created ON p_created.id = bn.created_by
LEFT JOIN public.profiles p_validated ON p_validated.id = bn.validated_by;

-- Commenter les objets
COMMENT ON TABLE public.budget_notifications IS 'Notifications budgétaires avec workflow de validation';
COMMENT ON TABLE public.entity_attachments IS 'Pièces jointes génériques pour toutes les entités';
COMMENT ON FUNCTION generate_notification_reference IS 'Génère une référence unique pour une notification';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
