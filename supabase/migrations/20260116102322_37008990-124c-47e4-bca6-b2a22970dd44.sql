-- =====================================================
-- Migration: Sécuriser les policies storage pour pièces jointes
-- Buckets: notes-sef, note-attachments
-- Arborescence: /<exercice>/<type>/<noteId>/<filename>
-- =====================================================

-- =========================
-- 1) BUCKET notes-sef (SEF)
-- =========================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "notes_sef_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "notes_sef_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "notes_sef_bucket_delete" ON storage.objects;
DROP POLICY IF EXISTS "sef_storage_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "sef_storage_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "sef_storage_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "sef_storage_update_policy" ON storage.objects;

-- SELECT: Rôles autorisés (ADMIN/DG/DAAF/DAF/CB) + créateur/demandeur de la note
CREATE POLICY "sef_storage_secure_select" ON storage.objects
FOR SELECT USING (
  bucket_id = 'notes-sef'
  AND auth.uid() IS NOT NULL
  AND (
    -- Rôles privilégiés peuvent tout voir
    has_role(auth.uid(), 'ADMIN') OR 
    has_role(auth.uid(), 'DG') OR 
    has_role(auth.uid(), 'DAAF') OR
    has_role(auth.uid(), 'DAF') OR
    has_role(auth.uid(), 'CB') OR
    -- Créateur ou demandeur de la note peut voir ses fichiers
    EXISTS (
      SELECT 1 FROM notes_sef n
      WHERE n.exercice::text = split_part(name, '/', 1)
        AND n.id::text = split_part(name, '/', 3)
        AND (n.created_by = auth.uid() OR n.demandeur_id = auth.uid())
    )
  )
);

-- INSERT: Créateur de la note (brouillon) ou admin
CREATE POLICY "sef_storage_secure_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'notes-sef'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'ADMIN') OR
    EXISTS (
      SELECT 1 FROM notes_sef n
      WHERE n.exercice::text = split_part(name, '/', 1)
        AND n.id::text = split_part(name, '/', 3)
        AND n.created_by = auth.uid()
        AND n.statut = 'brouillon'
    )
  )
);

-- DELETE: Créateur de la note (brouillon) ou admin
CREATE POLICY "sef_storage_secure_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'notes-sef'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'ADMIN') OR
    EXISTS (
      SELECT 1 FROM notes_sef n
      WHERE n.exercice::text = split_part(name, '/', 1)
        AND n.id::text = split_part(name, '/', 3)
        AND n.created_by = auth.uid()
        AND n.statut = 'brouillon'
    )
  )
);

-- =========================
-- 2) BUCKET note-attachments (AEF)
-- =========================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their own attachments or authorized roles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

-- SELECT: Rôles autorisés + créateur de la note AEF
CREATE POLICY "aef_storage_secure_select" ON storage.objects
FOR SELECT USING (
  bucket_id = 'note-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    -- Rôles privilégiés peuvent tout voir
    has_role(auth.uid(), 'ADMIN') OR 
    has_role(auth.uid(), 'DG') OR 
    has_role(auth.uid(), 'DAAF') OR
    has_role(auth.uid(), 'DAF') OR
    has_role(auth.uid(), 'CB') OR
    -- Créateur de la note peut voir ses fichiers
    EXISTS (
      SELECT 1 FROM notes_dg n
      WHERE n.exercice::text = split_part(name, '/', 1)
        AND n.id::text = split_part(name, '/', 3)
        AND n.created_by = auth.uid()
    )
  )
);

-- INSERT: Créateur de la note (brouillon) ou admin
CREATE POLICY "aef_storage_secure_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'note-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'ADMIN') OR
    EXISTS (
      SELECT 1 FROM notes_dg n
      WHERE n.exercice::text = split_part(name, '/', 1)
        AND n.id::text = split_part(name, '/', 3)
        AND n.created_by = auth.uid()
        AND n.statut = 'brouillon'
    )
  )
);

-- DELETE: Créateur de la note (brouillon) ou admin
CREATE POLICY "aef_storage_secure_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'note-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'ADMIN') OR
    EXISTS (
      SELECT 1 FROM notes_dg n
      WHERE n.exercice::text = split_part(name, '/', 1)
        AND n.id::text = split_part(name, '/', 3)
        AND n.created_by = auth.uid()
        AND n.statut = 'brouillon'
    )
  )
);