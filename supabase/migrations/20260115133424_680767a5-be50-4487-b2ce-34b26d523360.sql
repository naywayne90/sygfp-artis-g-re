-- =====================================================
-- Notes SEF Attachments - Sécurité et validation fichiers
-- =====================================================
-- Règles fichiers:
--   - Types: PDF, Word, Excel, Images (jpg, png, gif, webp)
--   - Max 10MB par fichier (géré côté client)
--   - Extensions dangereuses bloquées
--   - Accès basé sur le statut de la note
-- =====================================================

-- 1. NETTOYAGE des politiques storage dupliquées
DROP POLICY IF EXISTS "notes_sef_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "notes_sef_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "notes_sef_bucket_delete" ON storage.objects;

-- 2. NOUVELLES POLITIQUES STORAGE plus granulaires

-- SELECT: Créateur + gestionnaires + validateurs peuvent lire
CREATE POLICY "sef_storage_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'notes-sef'
  AND auth.uid() IS NOT NULL
  AND (
    -- Admin peut tout voir
    public.has_role(auth.uid(), 'ADMIN')
    OR public.has_role(auth.uid(), 'DG')
    OR public.has_role(auth.uid(), 'DAAF')
    OR
    -- Créateur ou demandeur de la note associée peut voir
    EXISTS (
      SELECT 1 FROM public.notes_sef n
      WHERE (storage.foldername(objects.name))[2]::uuid = n.id
        AND (n.created_by = auth.uid() OR n.demandeur_id = auth.uid())
    )
  )
);

-- INSERT: Seulement en BROUILLON (créateur/gestionnaire)
CREATE POLICY "sef_storage_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'notes-sef'
  AND auth.uid() IS NOT NULL
  AND (
    -- Admin peut toujours ajouter
    public.has_role(auth.uid(), 'ADMIN')
    OR
    -- Créateur peut ajouter seulement si brouillon
    EXISTS (
      SELECT 1 FROM public.notes_sef n
      WHERE (storage.foldername(objects.name))[2]::uuid = n.id
        AND n.created_by = auth.uid()
        AND n.statut = 'brouillon'
    )
  )
  -- Blocage des extensions dangereuses (validation du nom de fichier)
  AND NOT (
    objects.name ~* '\.(exe|bat|cmd|sh|ps1|vbs|js|msi|dll|scr|pif|com|jar|hta|reg)$'
  )
);

-- UPDATE: Restreint (rarement nécessaire)
CREATE POLICY "sef_storage_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'notes-sef'
  AND auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'ADMIN')
);

-- DELETE: Créateur en brouillon ou admin
CREATE POLICY "sef_storage_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'notes-sef'
  AND auth.uid() IS NOT NULL
  AND (
    -- Admin peut supprimer
    public.has_role(auth.uid(), 'ADMIN')
    OR
    -- Créateur peut supprimer seulement si brouillon
    EXISTS (
      SELECT 1 FROM public.notes_sef n
      WHERE (storage.foldername(objects.name))[2]::uuid = n.id
        AND n.created_by = auth.uid()
        AND n.statut = 'brouillon'
    )
  )
);

-- 3. NETTOYAGE des politiques notes_sef_pieces dupliquées
DROP POLICY IF EXISTS "Authenticated users can insert notes_sef_pieces" ON public.notes_sef_pieces;
DROP POLICY IF EXISTS "Authenticated users can view notes_sef_pieces" ON public.notes_sef_pieces;
DROP POLICY IF EXISTS "Uploaders can delete their notes_sef_pieces" ON public.notes_sef_pieces;
DROP POLICY IF EXISTS "notes_sef_pieces_insert_policy" ON public.notes_sef_pieces;
DROP POLICY IF EXISTS "notes_sef_pieces_select_policy" ON public.notes_sef_pieces;
DROP POLICY IF EXISTS "notes_sef_pieces_delete_policy" ON public.notes_sef_pieces;

-- 4. NOUVELLES POLITIQUES notes_sef_pieces cohérentes

-- SELECT: Tous les utilisateurs authentifiés ayant accès à l'exercice
CREATE POLICY "sef_pieces_select" ON public.notes_sef_pieces
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.notes_sef n
    WHERE n.id = notes_sef_pieces.note_id
      AND (
        -- Admin/DG/DAAF voient tout
        public.has_role(auth.uid(), 'ADMIN')
        OR public.has_role(auth.uid(), 'DG')
        OR public.has_role(auth.uid(), 'DAAF')
        -- Créateur ou demandeur voit ses pièces
        OR n.created_by = auth.uid()
        OR n.demandeur_id = auth.uid()
      )
  )
);

-- INSERT: Seulement en BROUILLON par créateur ou admin
CREATE POLICY "sef_pieces_insert" ON public.notes_sef_pieces
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.notes_sef n
    WHERE n.id = notes_sef_pieces.note_id
      AND (
        -- Admin peut ajouter à tout moment
        public.has_role(auth.uid(), 'ADMIN')
        OR
        -- Créateur peut ajouter seulement en brouillon
        (n.created_by = auth.uid() AND n.statut = 'brouillon')
      )
  )
  -- Validation type fichier (MIME types autorisés)
  AND (
    notes_sef_pieces.type_fichier IS NULL
    OR notes_sef_pieces.type_fichier ~* '^(application/pdf|application/msword|application/vnd\.openxmlformats|application/vnd\.ms-excel|image/(jpeg|jpg|png|gif|webp|bmp)).*$'
    OR notes_sef_pieces.type_fichier = 'application/octet-stream' -- Fallback navigateur
  )
  -- Blocage extensions dangereuses dans le nom
  AND NOT (
    notes_sef_pieces.nom ~* '\.(exe|bat|cmd|sh|ps1|vbs|js|msi|dll|scr|pif|com|jar|hta|reg)$'
  )
);

-- UPDATE: Rarement nécessaire, admin seulement
CREATE POLICY "sef_pieces_update" ON public.notes_sef_pieces
FOR UPDATE USING (
  auth.uid() IS NOT NULL
  AND public.has_role(auth.uid(), 'ADMIN')
);

-- DELETE: Créateur en brouillon ou admin
CREATE POLICY "sef_pieces_delete" ON public.notes_sef_pieces
FOR DELETE USING (
  auth.uid() IS NOT NULL
  AND (
    -- Admin peut supprimer
    public.has_role(auth.uid(), 'ADMIN')
    OR
    -- Uploader peut supprimer sa pièce si note en brouillon
    (
      notes_sef_pieces.uploaded_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.notes_sef n
        WHERE n.id = notes_sef_pieces.note_id
          AND n.statut = 'brouillon'
      )
    )
  )
);

-- 5. Ajouter une colonne pour stocker le hash de fichier (anti-doublon future)
ALTER TABLE public.notes_sef_pieces
ADD COLUMN IF NOT EXISTS file_hash text;

-- 6. Index pour optimiser les requêtes sur notes_sef_pieces
CREATE INDEX IF NOT EXISTS idx_notes_sef_pieces_note_id ON public.notes_sef_pieces(note_id);
CREATE INDEX IF NOT EXISTS idx_notes_sef_pieces_uploaded_by ON public.notes_sef_pieces(uploaded_by);

-- 7. Commentaire documentation
COMMENT ON TABLE public.notes_sef_pieces IS 'Pièces jointes des Notes SEF. Types autorisés: PDF, Word, Excel, Images. Max 10MB/fichier. Extensions dangereuses bloquées.';