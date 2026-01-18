-- ============================================================
-- MIGRATION: ATTACHMENTS UNIFIÉ
-- Prompt 06/25 - Storage unifié pièces jointes
-- Convention: sygfp/attachments/{exercise}/{dossier_ref}/{step}/...
-- ============================================================

-- ============================================================
-- 1. TABLE ATTACHMENTS UNIFIÉE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence au dossier (pivot immuable)
  dossier_ref TEXT NOT NULL,

  -- Étape de la chaîne de dépense
  step TEXT NOT NULL CHECK (step IN (
    'note_sef', 'note_aef', 'imputation', 'expression_besoin',
    'passation_marche', 'engagement', 'liquidation',
    'ordonnancement', 'reglement', 'marche', 'prestataire'
  )),

  -- Infos fichier
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0,

  -- Type de pièce (optionnel)
  type_piece TEXT,

  -- Lien vers entité spécifique (optionnel)
  entity_id UUID,

  -- Traçabilité
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDEX POUR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_attachments_dossier_ref ON attachments(dossier_ref);
CREATE INDEX IF NOT EXISTS idx_attachments_dossier_step ON attachments(dossier_ref, step);
CREATE INDEX IF NOT EXISTS idx_attachments_entity_id ON attachments(entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_step ON attachments(step);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les authentifiés
DROP POLICY IF EXISTS "attachments_select_authenticated" ON attachments;
CREATE POLICY "attachments_select_authenticated" ON attachments
  FOR SELECT TO authenticated USING (true);

-- Insertion pour les authentifiés
DROP POLICY IF EXISTS "attachments_insert_authenticated" ON attachments;
CREATE POLICY "attachments_insert_authenticated" ON attachments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Suppression par le créateur uniquement
DROP POLICY IF EXISTS "attachments_delete_own" ON attachments;
CREATE POLICY "attachments_delete_own" ON attachments
  FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by);

-- Mise à jour par le créateur ou admin
DROP POLICY IF EXISTS "attachments_update_authorized" ON attachments;
CREATE POLICY "attachments_update_authorized" ON attachments
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('ADMIN', 'DG')
    )
  );

-- ============================================================
-- 4. TRIGGER UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attachments_updated_at ON attachments;
CREATE TRIGGER trg_attachments_updated_at
  BEFORE UPDATE ON attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_attachments_updated_at();

-- ============================================================
-- 5. FONCTION DE COMPTAGE DES PIÈCES PAR DOSSIER
-- ============================================================
CREATE OR REPLACE FUNCTION public.count_attachments_by_dossier(p_dossier_ref TEXT)
RETURNS TABLE(
  step TEXT,
  count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT step, COUNT(*)
  FROM attachments
  WHERE dossier_ref = p_dossier_ref
  GROUP BY step
  ORDER BY step;
$$;

-- ============================================================
-- 6. FONCTION DE VÉRIFICATION PIÈCES OBLIGATOIRES
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_required_attachments(
  p_dossier_ref TEXT,
  p_step TEXT
)
RETURNS TABLE(
  type_piece TEXT,
  is_present BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Liste des pièces obligatoires par étape
  RETURN QUERY
  WITH required_pieces AS (
    SELECT unnest(CASE p_step
      WHEN 'engagement' THEN ARRAY['PROFORMA', 'BON_COMMANDE']
      WHEN 'liquidation' THEN ARRAY['FACTURE', 'BON_LIVRAISON', 'PV_RECEPTION']
      WHEN 'ordonnancement' THEN ARRAY['FICHE_LIQUIDATION']
      WHEN 'reglement' THEN ARRAY['ORDRE_PAYER', 'RIB']
      ELSE ARRAY[]::TEXT[]
    END) AS piece
  )
  SELECT
    rp.piece AS type_piece,
    EXISTS (
      SELECT 1 FROM attachments a
      WHERE a.dossier_ref = p_dossier_ref
        AND a.step = p_step
        AND a.type_piece = rp.piece
    ) AS is_present
  FROM required_pieces rp;
END;
$$;

-- ============================================================
-- 7. COMMENTAIRES
-- ============================================================
COMMENT ON TABLE attachments IS 'Table unifiée des pièces jointes pour toutes les étapes de la chaîne de dépense';
COMMENT ON COLUMN attachments.dossier_ref IS 'Référence pivot du dossier (format ARTI0126000001)';
COMMENT ON COLUMN attachments.step IS 'Étape de la chaîne de dépense associée';
COMMENT ON COLUMN attachments.storage_path IS 'Chemin complet dans le storage (R2 ou Supabase)';
COMMENT ON COLUMN attachments.type_piece IS 'Type de pièce (PROFORMA, FACTURE, etc.)';
COMMENT ON COLUMN attachments.entity_id IS 'UUID de l''entité spécifique (note_sef.id, engagement.id, etc.)';

-- ============================================================
-- 8. BUCKET STORAGE SUPABASE (FALLBACK)
-- ============================================================
-- Note: Ce bucket est utilisé si R2 n'est pas configuré
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sygfp-attachments',
  'sygfp-attachments',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policies Storage
DROP POLICY IF EXISTS "sygfp_attachments_select" ON storage.objects;
CREATE POLICY "sygfp_attachments_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'sygfp-attachments');

DROP POLICY IF EXISTS "sygfp_attachments_insert" ON storage.objects;
CREATE POLICY "sygfp_attachments_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sygfp-attachments');

DROP POLICY IF EXISTS "sygfp_attachments_delete" ON storage.objects;
CREATE POLICY "sygfp_attachments_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'sygfp-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
