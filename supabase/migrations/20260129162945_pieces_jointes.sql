-- ============================================================================
-- MIGRATION: Gestion des pieces jointes numerotees (max 3 par entite)
-- Date: 29/01/2026
-- Auteur: TRESOR (Agent Backend SYGFP)
-- ============================================================================
--
-- SPECIFICATIONS:
--   - Maximum 3 pieces jointes par entite (numero 1, 2, 3)
--   - PJ n1 peut etre obligatoire selon le contexte
--   - Stockage: Cloudflare R2 (bucket: lovable-storage/sygfp/)
--   - Taille max: 10 MB par fichier, 25 MB total par entite
--
-- TYPES MIME AUTORISES:
--   - PDF, Images (PNG, JPEG, GIF, WEBP)
--   - Documents Office (Word, Excel, PowerPoint)
--   - Texte, CSV, ZIP
-- ============================================================================

-- 1. Table des pieces jointes numerotees
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pieces_jointes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification de l'entite parente
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'notes_sef', 'notes_dg', 'imputations', 'expressions_besoin',
    'passations_marche', 'budget_engagements', 'budget_liquidations',
    'ordonnancements', 'reglements', 'marches', 'contrats', 'dossiers'
  )),
  entity_id UUID NOT NULL,

  -- Numerotation (1, 2 ou 3)
  numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 3),

  -- Informations du fichier
  nom_fichier TEXT NOT NULL,                    -- Nom stocke (avec timestamp ou uuid)
  nom_original TEXT NOT NULL,                   -- Nom original du fichier
  type_mime TEXT NOT NULL,
  taille_octets INTEGER NOT NULL CHECK (taille_octets > 0 AND taille_octets <= 10485760),

  -- Chemin de stockage R2
  chemin_r2 TEXT NOT NULL,                      -- lovable-storage/sygfp/{exercice}/{entity_type}/{entity_id}/{numero}_{filename}

  -- Type/categorie de piece (optionnel)
  type_piece TEXT,                              -- PROFORMA, FACTURE, BON_COMMANDE, DEVIS, etc.
  description TEXT,                             -- Description libre

  -- Statut
  est_obligatoire BOOLEAN NOT NULL DEFAULT false,
  est_valide BOOLEAN DEFAULT true,              -- Pour marquer une PJ comme invalide sans la supprimer

  -- Tracabilite
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,                       -- Soft delete
  deleted_by UUID REFERENCES public.profiles(id),

  -- Metadata supplementaires
  metadata JSONB DEFAULT '{}',

  -- Contrainte d'unicite: une seule PJ par numero par entite
  CONSTRAINT pieces_jointes_unique_numero UNIQUE (entity_type, entity_id, numero)
);

-- 2. Index pour performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_pj_entity
ON public.pieces_jointes(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_pj_entity_numero
ON public.pieces_jointes(entity_type, entity_id, numero);

CREATE INDEX IF NOT EXISTS idx_pj_uploaded_by
ON public.pieces_jointes(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_pj_type_piece
ON public.pieces_jointes(type_piece)
WHERE type_piece IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pj_not_deleted
ON public.pieces_jointes(entity_type, entity_id)
WHERE deleted_at IS NULL;

-- 3. RLS Policies
-- ============================================================================
ALTER TABLE public.pieces_jointes ENABLE ROW LEVEL SECURITY;

-- Lecture: tous les utilisateurs authentifies peuvent voir les PJ non supprimees
DROP POLICY IF EXISTS "pj_select_authenticated" ON public.pieces_jointes;
CREATE POLICY "pj_select_authenticated" ON public.pieces_jointes
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Insertion: utilisateurs authentifies peuvent ajouter
DROP POLICY IF EXISTS "pj_insert_authenticated" ON public.pieces_jointes;
CREATE POLICY "pj_insert_authenticated" ON public.pieces_jointes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by
    AND deleted_at IS NULL
  );

-- Mise a jour: createur ou admin
DROP POLICY IF EXISTS "pj_update_authorized" ON public.pieces_jointes;
CREATE POLICY "pj_update_authorized" ON public.pieces_jointes
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.profil_fonctionnel = 'Admin'
    )
  );

-- Suppression: createur ou admin (soft delete uniquement)
DROP POLICY IF EXISTS "pj_delete_authorized" ON public.pieces_jointes;
CREATE POLICY "pj_delete_authorized" ON public.pieces_jointes
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.profil_fonctionnel = 'Admin'
    )
  );

-- 4. Fonction de validation: verifier que la PJ obligatoire existe
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_pieces_jointes(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_require_pj1 BOOLEAN DEFAULT false
)
RETURNS TABLE(
  is_valid BOOLEAN,
  pj_count INTEGER,
  has_pj1 BOOLEAN,
  total_size INTEGER,
  message TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_has_pj1 BOOLEAN;
  v_total_size INTEGER;
  v_message TEXT;
  v_is_valid BOOLEAN;
BEGIN
  -- Compter les PJ et verifier la presence de PJ n1
  SELECT
    COUNT(*),
    bool_or(numero = 1),
    COALESCE(SUM(taille_octets), 0)
  INTO v_count, v_has_pj1, v_total_size
  FROM pieces_jointes
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND deleted_at IS NULL;

  -- Par defaut, v_has_pj1 peut etre NULL si aucune PJ
  v_has_pj1 := COALESCE(v_has_pj1, false);

  -- Validation
  IF p_require_pj1 AND NOT v_has_pj1 THEN
    v_is_valid := false;
    v_message := 'La piece jointe n°1 est obligatoire';
  ELSIF v_total_size > 26214400 THEN  -- 25 MB
    v_is_valid := false;
    v_message := 'La taille totale des pieces jointes depasse 25 MB';
  ELSIF v_count > 3 THEN
    v_is_valid := false;
    v_message := 'Maximum 3 pieces jointes autorisees';
  ELSE
    v_is_valid := true;
    v_message := 'OK';
  END IF;

  RETURN QUERY SELECT v_is_valid, v_count, v_has_pj1, v_total_size, v_message;
END;
$$;

-- 5. Fonction pour obtenir les PJ d'une entite
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_pieces_jointes(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS TABLE(
  id UUID,
  numero INTEGER,
  nom_original TEXT,
  type_mime TEXT,
  taille_octets INTEGER,
  chemin_r2 TEXT,
  type_piece TEXT,
  description TEXT,
  est_obligatoire BOOLEAN,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ,
  uploader_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pj.id,
    pj.numero,
    pj.nom_original,
    pj.type_mime,
    pj.taille_octets,
    pj.chemin_r2,
    pj.type_piece,
    pj.description,
    pj.est_obligatoire,
    pj.uploaded_by,
    pj.uploaded_at,
    p.full_name AS uploader_name
  FROM pieces_jointes pj
  LEFT JOIN profiles p ON p.id = pj.uploaded_by
  WHERE pj.entity_type = p_entity_type
    AND pj.entity_id = p_entity_id
    AND pj.deleted_at IS NULL
  ORDER BY pj.numero;
END;
$$;

-- 6. Fonction pour ajouter une piece jointe
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_piece_jointe(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_numero INTEGER,
  p_nom_fichier TEXT,
  p_nom_original TEXT,
  p_type_mime TEXT,
  p_taille_octets INTEGER,
  p_chemin_r2 TEXT,
  p_type_piece TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_est_obligatoire BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_current_count INTEGER;
  v_current_size INTEGER;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifie';
  END IF;

  -- Verifier le numero (1, 2, 3)
  IF p_numero < 1 OR p_numero > 3 THEN
    RAISE EXCEPTION 'Le numero de piece jointe doit etre 1, 2 ou 3';
  END IF;

  -- Verifier la taille du fichier (max 10 MB)
  IF p_taille_octets > 10485760 THEN
    RAISE EXCEPTION 'La taille du fichier depasse 10 MB (% octets)', p_taille_octets;
  END IF;

  -- Verifier qu'il n'y a pas deja 3 PJ et la taille totale
  SELECT COUNT(*), COALESCE(SUM(taille_octets), 0)
  INTO v_current_count, v_current_size
  FROM pieces_jointes
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND deleted_at IS NULL
    AND numero != p_numero;  -- Exclure le numero qu'on va remplacer

  IF v_current_count >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 pieces jointes par entite';
  END IF;

  IF (v_current_size + p_taille_octets) > 26214400 THEN
    RAISE EXCEPTION 'La taille totale des pieces jointes depasserait 25 MB';
  END IF;

  -- Soft delete de l'ancienne PJ si elle existe
  UPDATE pieces_jointes
  SET
    deleted_at = now(),
    deleted_by = v_user_id
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND numero = p_numero
    AND deleted_at IS NULL;

  -- Inserer la nouvelle PJ
  INSERT INTO pieces_jointes (
    entity_type, entity_id, numero,
    nom_fichier, nom_original, type_mime, taille_octets, chemin_r2,
    type_piece, description, est_obligatoire,
    uploaded_by, metadata
  ) VALUES (
    p_entity_type, p_entity_id, p_numero,
    p_nom_fichier, p_nom_original, p_type_mime, p_taille_octets, p_chemin_r2,
    p_type_piece, p_description, p_est_obligatoire,
    v_user_id, p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 7. Fonction pour supprimer une piece jointe (soft delete)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.delete_piece_jointe(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_numero INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_deleted_count INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifie';
  END IF;

  -- Soft delete
  UPDATE pieces_jointes
  SET
    deleted_at = now(),
    deleted_by = v_user_id
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND numero = p_numero
    AND deleted_at IS NULL
    AND (
      uploaded_by = v_user_id
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = v_user_id
          AND p.profil_fonctionnel = 'Admin'
      )
    );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count > 0;
END;
$$;

-- 8. Trigger pour verifier les contraintes avant insertion
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_check_piece_jointe_constraints()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_count INTEGER;
  v_current_size INTEGER;
BEGIN
  -- Verifier le type MIME
  IF NEW.type_mime NOT IN (
    'application/pdf',
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-zip-compressed'
  ) THEN
    RAISE EXCEPTION 'Type MIME non autorise: %', NEW.type_mime;
  END IF;

  -- Verifier la taille totale (en excluant l'eventuel ancien fichier au meme numero)
  SELECT COALESCE(SUM(taille_octets), 0)
  INTO v_current_size
  FROM pieces_jointes
  WHERE entity_type = NEW.entity_type
    AND entity_id = NEW.entity_id
    AND deleted_at IS NULL
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND numero != NEW.numero;

  IF (v_current_size + NEW.taille_octets) > 26214400 THEN
    RAISE EXCEPTION 'La taille totale des pieces jointes depasserait 25 MB (actuel: % + nouveau: % = %)',
      v_current_size, NEW.taille_octets, (v_current_size + NEW.taille_octets);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_pj_constraints ON public.pieces_jointes;
CREATE TRIGGER trg_check_pj_constraints
  BEFORE INSERT OR UPDATE ON public.pieces_jointes
  FOR EACH ROW
  EXECUTE FUNCTION trg_check_piece_jointe_constraints();

-- 9. Vue pour afficher les PJ avec informations utilisateur
-- ============================================================================
CREATE OR REPLACE VIEW public.v_pieces_jointes AS
SELECT
  pj.id,
  pj.entity_type,
  pj.entity_id,
  pj.numero,
  pj.nom_fichier,
  pj.nom_original,
  pj.type_mime,
  pj.taille_octets,
  ROUND(pj.taille_octets / 1024.0, 2) AS taille_ko,
  ROUND(pj.taille_octets / 1048576.0, 2) AS taille_mo,
  pj.chemin_r2,
  pj.type_piece,
  pj.description,
  pj.est_obligatoire,
  pj.est_valide,
  pj.uploaded_by,
  p.full_name AS uploader_name,
  p.email AS uploader_email,
  pj.uploaded_at,
  pj.deleted_at IS NOT NULL AS is_deleted
FROM pieces_jointes pj
LEFT JOIN profiles p ON p.id = pj.uploaded_by
WHERE pj.deleted_at IS NULL;

-- 10. Table de configuration des PJ obligatoires par type d'entite
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.config_pieces_obligatoires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  type_piece TEXT NOT NULL,              -- PROFORMA, FACTURE, etc.
  numero_obligatoire INTEGER CHECK (numero_obligatoire BETWEEN 1 AND 3),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, type_piece)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_config_pj_entity
ON public.config_pieces_obligatoires(entity_type)
WHERE is_active = true;

-- RLS
ALTER TABLE public.config_pieces_obligatoires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_pj_select" ON public.config_pieces_obligatoires;
CREATE POLICY "config_pj_select" ON public.config_pieces_obligatoires
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "config_pj_manage_admin" ON public.config_pieces_obligatoires;
CREATE POLICY "config_pj_manage_admin" ON public.config_pieces_obligatoires
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.profil_fonctionnel = 'Admin'
    )
  );

-- Donnees de configuration par defaut
INSERT INTO config_pieces_obligatoires (entity_type, type_piece, numero_obligatoire, description)
VALUES
  ('budget_engagements', 'PROFORMA', 1, 'Facture proforma ou devis obligatoire'),
  ('budget_engagements', 'BON_COMMANDE', NULL, 'Bon de commande (optionnel)'),
  ('budget_liquidations', 'FACTURE', 1, 'Facture definitive obligatoire'),
  ('budget_liquidations', 'BON_LIVRAISON', NULL, 'Bon de livraison'),
  ('budget_liquidations', 'PV_RECEPTION', NULL, 'PV de reception'),
  ('ordonnancements', 'FICHE_LIQUIDATION', 1, 'Fiche de liquidation obligatoire'),
  ('reglements', 'ORDRE_PAYER', 1, 'Ordre de paiement obligatoire'),
  ('reglements', 'RIB', NULL, 'RIB du beneficiaire'),
  ('marches', 'CONTRAT', 1, 'Contrat signe obligatoire'),
  ('marches', 'CAHIER_CHARGES', NULL, 'Cahier des charges'),
  ('notes_sef', 'JUSTIFICATIF', NULL, 'Justificatif de la demande'),
  ('notes_dg', 'NOTE_VALIDATION', NULL, 'Note de validation')
ON CONFLICT (entity_type, type_piece) DO NOTHING;

-- 11. Fonction pour verifier les PJ obligatoires selon la config
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_required_pieces_jointes(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS TABLE(
  type_piece TEXT,
  numero_obligatoire INTEGER,
  is_present BOOLEAN,
  is_required BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.type_piece,
    c.numero_obligatoire,
    EXISTS (
      SELECT 1 FROM pieces_jointes pj
      WHERE pj.entity_type = p_entity_type
        AND pj.entity_id = p_entity_id
        AND pj.deleted_at IS NULL
        AND (
          pj.type_piece = c.type_piece
          OR (c.numero_obligatoire IS NOT NULL AND pj.numero = c.numero_obligatoire)
        )
    ) AS is_present,
    c.numero_obligatoire IS NOT NULL AS is_required
  FROM config_pieces_obligatoires c
  WHERE c.entity_type = p_entity_type
    AND c.is_active = true
  ORDER BY c.numero_obligatoire NULLS LAST, c.type_piece;
END;
$$;

-- 12. Commentaires de documentation
-- ============================================================================
COMMENT ON TABLE public.pieces_jointes IS
'Table des pieces jointes numerotees (max 3 par entite).
Stockage: Cloudflare R2 (bucket: lovable-storage/sygfp/).
Taille max: 10 MB par fichier, 25 MB total par entite.';

COMMENT ON COLUMN public.pieces_jointes.numero IS 'Position de la piece jointe (1, 2 ou 3)';
COMMENT ON COLUMN public.pieces_jointes.chemin_r2 IS 'Chemin complet dans Cloudflare R2';
COMMENT ON COLUMN public.pieces_jointes.est_obligatoire IS 'Indique si cette PJ est obligatoire pour validation';
COMMENT ON COLUMN public.pieces_jointes.deleted_at IS 'Soft delete - date de suppression';

COMMENT ON TABLE public.config_pieces_obligatoires IS
'Configuration des pieces jointes obligatoires par type d''entite';

COMMENT ON FUNCTION public.add_piece_jointe IS
'Ajoute une piece jointe avec verification des contraintes (max 3, taille max 25MB total)';

COMMENT ON FUNCTION public.validate_pieces_jointes IS
'Valide les pieces jointes d''une entite (presence PJ1 si obligatoire, taille totale)';

COMMENT ON FUNCTION public.check_required_pieces_jointes IS
'Verifie la presence des pieces jointes obligatoires selon la configuration';
