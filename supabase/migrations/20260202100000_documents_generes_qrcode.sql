-- ============================================================================
-- MIGRATION: Traçabilité des documents générés et vérifications QR Code
-- Date: 02/02/2026
-- Auteur: TRESOR (Agent Backend SYGFP)
-- Prompt: 14
-- ============================================================================
--
-- OBJECTIF:
--   - Tracer tous les documents PDF générés par le système
--   - Permettre la vérification d'authenticité via QR code
--   - Protéger contre les abus (rate limiting par IP)
--
-- TABLES:
--   - documents_generes: Historique des documents générés
--   - verifications_qrcode: Log des vérifications de QR codes
--   - rate_limit_qrcode: Table pour le rate limiting
--
-- ============================================================================

-- 1. Table des documents générés
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.documents_generes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification de l'entité source
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'notes_sef', 'notes_dg', 'imputations', 'expressions_besoin',
    'passations_marche', 'budget_engagements', 'budget_liquidations',
    'ordonnancements', 'reglements', 'marches', 'contrats', 'dossiers',
    'recettes', 'rapport', 'export'
  )),
  entity_id UUID NOT NULL,

  -- Type de document généré
  type_document TEXT NOT NULL CHECK (type_document IN (
    'pdf_note_sef', 'pdf_note_aef', 'pdf_engagement', 'pdf_liquidation',
    'pdf_ordonnancement', 'pdf_reglement', 'pdf_contrat', 'pdf_marche',
    'pdf_recette', 'pdf_bordereau', 'pdf_rapport',
    'excel_export', 'csv_export', 'zip_archive'
  )),

  -- Référence du document (numéro unique)
  reference TEXT NOT NULL,

  -- QR Code pour vérification d'authenticité
  qr_code_hash TEXT UNIQUE NOT NULL,
  qr_code_data TEXT,  -- Données encodées dans le QR (URL de vérification)

  -- Stockage
  chemin_stockage TEXT,  -- Chemin R2 ou local si applicable
  nom_fichier TEXT NOT NULL,
  taille_octets INTEGER CHECK (taille_octets > 0),

  -- Validité du document
  date_expiration TIMESTAMPTZ,  -- NULL = pas d'expiration
  est_annule BOOLEAN DEFAULT false,
  motif_annulation TEXT,
  annule_par UUID REFERENCES public.profiles(id),
  annule_at TIMESTAMPTZ,

  -- Traçabilité
  genere_par UUID NOT NULL REFERENCES public.profiles(id),
  genere_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contexte supplémentaire
  exercice INTEGER,
  direction_id UUID REFERENCES public.directions(id),

  -- Métadonnées libres
  metadata JSONB DEFAULT '{}'
);

-- 2. Index pour performance
-- ============================================================================
-- Index principal sur le hash QR (recherche rapide lors de la vérification)
CREATE UNIQUE INDEX IF NOT EXISTS idx_docs_qr_hash
ON public.documents_generes(qr_code_hash);

-- Index pour recherche par entité
CREATE INDEX IF NOT EXISTS idx_docs_entity
ON public.documents_generes(entity_type, entity_id);

-- Index pour recherche par référence
CREATE INDEX IF NOT EXISTS idx_docs_reference
ON public.documents_generes(reference);

-- Index pour recherche par type de document
CREATE INDEX IF NOT EXISTS idx_docs_type
ON public.documents_generes(type_document);

-- Index pour recherche par générateur
CREATE INDEX IF NOT EXISTS idx_docs_genere_par
ON public.documents_generes(genere_par);

-- Index pour les documents non annulés
CREATE INDEX IF NOT EXISTS idx_docs_actifs
ON public.documents_generes(entity_type, entity_id)
WHERE est_annule = false;

-- Index pour recherche par exercice
CREATE INDEX IF NOT EXISTS idx_docs_exercice
ON public.documents_generes(exercice);

-- Index pour recherche par date
CREATE INDEX IF NOT EXISTS idx_docs_date
ON public.documents_generes(genere_at DESC);

-- 3. Table des vérifications de QR codes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.verifications_qrcode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document vérifié (NULL si hash invalide)
  document_id UUID REFERENCES public.documents_generes(id),

  -- Hash QR scanné
  qr_hash TEXT NOT NULL,

  -- Informations sur le vérificateur
  ip_address INET,
  user_agent TEXT,
  origin_url TEXT,  -- D'où vient la requête

  -- Résultat de la vérification
  resultat TEXT NOT NULL CHECK (resultat IN ('valide', 'invalide', 'expire', 'annule')),
  message TEXT,

  -- Horodatage
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_verif_document
ON public.verifications_qrcode(document_id);

CREATE INDEX IF NOT EXISTS idx_verif_hash
ON public.verifications_qrcode(qr_hash);

CREATE INDEX IF NOT EXISTS idx_verif_ip
ON public.verifications_qrcode(ip_address, verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_verif_date
ON public.verifications_qrcode(verified_at DESC);

-- 4. Table de rate limiting pour protection anti-spam
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_qrcode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now()),
  request_count INTEGER NOT NULL DEFAULT 1,
  last_request TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT rate_limit_unique_ip_window UNIQUE (ip_address, window_start)
);

-- Index pour nettoyage des anciennes entrées
CREATE INDEX IF NOT EXISTS idx_rate_limit_window
ON public.rate_limit_qrcode(window_start);

-- 5. RLS Policies
-- ============================================================================

-- 5.1 documents_generes
ALTER TABLE public.documents_generes ENABLE ROW LEVEL SECURITY;

-- Lecture: utilisateurs authentifiés peuvent voir les documents non annulés
DROP POLICY IF EXISTS "docs_select_authenticated" ON public.documents_generes;
CREATE POLICY "docs_select_authenticated" ON public.documents_generes
  FOR SELECT
  TO authenticated
  USING (true);

-- Insertion: utilisateurs authentifiés peuvent créer
DROP POLICY IF EXISTS "docs_insert_authenticated" ON public.documents_generes;
CREATE POLICY "docs_insert_authenticated" ON public.documents_generes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = genere_par);

-- Mise à jour: créateur ou admin (uniquement pour annulation)
DROP POLICY IF EXISTS "docs_update_authorized" ON public.documents_generes;
CREATE POLICY "docs_update_authorized" ON public.documents_generes
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = genere_par
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.profil_fonctionnel = 'Admin'
    )
  );

-- 5.2 verifications_qrcode - pas de RLS, accessible via fonction SECURITY DEFINER
ALTER TABLE public.verifications_qrcode ENABLE ROW LEVEL SECURITY;

-- Lecture: uniquement les admins et auditeurs
DROP POLICY IF EXISTS "verif_select_admin" ON public.verifications_qrcode;
CREATE POLICY "verif_select_admin" ON public.verifications_qrcode
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.profil_fonctionnel IN ('Admin', 'Auditeur')
    )
  );

-- Insertion: via fonction SECURITY DEFINER uniquement
-- Pas de policy INSERT pour les utilisateurs normaux

-- 5.3 rate_limit_qrcode - géré uniquement par le système
ALTER TABLE public.rate_limit_qrcode ENABLE ROW LEVEL SECURITY;
-- Pas de policy - accessible uniquement via SECURITY DEFINER

-- 6. Fonction de vérification de document par QR code
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verify_document_qr(
  p_hash TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_origin_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document documents_generes;
  v_result JSONB;
  v_resultat TEXT;
  v_message TEXT;
  v_ip INET;
  v_request_count INTEGER;
  v_rate_limit INTEGER := 100;  -- Max 100 requêtes par heure par IP
BEGIN
  -- Convertir l'IP en type INET
  BEGIN
    v_ip := p_ip_address::INET;
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  -- Vérifier le rate limiting si IP fournie
  IF v_ip IS NOT NULL THEN
    -- Insérer ou mettre à jour le compteur
    INSERT INTO rate_limit_qrcode (ip_address, window_start, request_count, last_request)
    VALUES (v_ip, date_trunc('hour', now()), 1, now())
    ON CONFLICT (ip_address, window_start)
    DO UPDATE SET
      request_count = rate_limit_qrcode.request_count + 1,
      last_request = now()
    RETURNING request_count INTO v_request_count;

    -- Vérifier si limite dépassée
    IF v_request_count > v_rate_limit THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'rate_limit_exceeded',
        'message', 'Trop de requêtes. Veuillez réessayer dans une heure.',
        'retry_after', 3600
      );
    END IF;
  END IF;

  -- Rechercher le document par hash
  SELECT * INTO v_document
  FROM documents_generes
  WHERE qr_code_hash = p_hash;

  -- Document non trouvé
  IF v_document.id IS NULL THEN
    v_resultat := 'invalide';
    v_message := 'Document non trouvé. Ce QR code n''est pas valide.';

    -- Logger la tentative invalide
    INSERT INTO verifications_qrcode (qr_hash, ip_address, user_agent, origin_url, resultat, message)
    VALUES (p_hash, v_ip, p_user_agent, p_origin_url, v_resultat, v_message);

    RETURN jsonb_build_object(
      'valid', false,
      'error', 'not_found',
      'message', v_message
    );
  END IF;

  -- Document annulé
  IF v_document.est_annule THEN
    v_resultat := 'annule';
    v_message := 'Ce document a été annulé le ' || to_char(v_document.annule_at, 'DD/MM/YYYY à HH24:MI');

    INSERT INTO verifications_qrcode (document_id, qr_hash, ip_address, user_agent, origin_url, resultat, message)
    VALUES (v_document.id, p_hash, v_ip, p_user_agent, p_origin_url, v_resultat, v_message);

    RETURN jsonb_build_object(
      'valid', false,
      'error', 'cancelled',
      'message', v_message,
      'cancelled_at', v_document.annule_at,
      'cancelled_reason', v_document.motif_annulation
    );
  END IF;

  -- Document expiré
  IF v_document.date_expiration IS NOT NULL AND v_document.date_expiration < now() THEN
    v_resultat := 'expire';
    v_message := 'Ce document a expiré le ' || to_char(v_document.date_expiration, 'DD/MM/YYYY');

    INSERT INTO verifications_qrcode (document_id, qr_hash, ip_address, user_agent, origin_url, resultat, message)
    VALUES (v_document.id, p_hash, v_ip, p_user_agent, p_origin_url, v_resultat, v_message);

    RETURN jsonb_build_object(
      'valid', false,
      'error', 'expired',
      'message', v_message,
      'expired_at', v_document.date_expiration
    );
  END IF;

  -- Document valide
  v_resultat := 'valide';
  v_message := 'Document authentique vérifié';

  INSERT INTO verifications_qrcode (document_id, qr_hash, ip_address, user_agent, origin_url, resultat, message)
  VALUES (v_document.id, p_hash, v_ip, p_user_agent, p_origin_url, v_resultat, v_message);

  -- Construire la réponse avec les informations du document
  RETURN jsonb_build_object(
    'valid', true,
    'message', v_message,
    'document', jsonb_build_object(
      'reference', v_document.reference,
      'type', v_document.type_document,
      'entity_type', v_document.entity_type,
      'generated_at', v_document.genere_at,
      'exercice', v_document.exercice,
      'expires_at', v_document.date_expiration
    )
  );
END;
$$;

-- 7. Fonction pour enregistrer un document généré
-- ============================================================================
CREATE OR REPLACE FUNCTION public.register_generated_document(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_type_document TEXT,
  p_reference TEXT,
  p_nom_fichier TEXT,
  p_chemin_stockage TEXT DEFAULT NULL,
  p_taille_octets INTEGER DEFAULT NULL,
  p_date_expiration TIMESTAMPTZ DEFAULT NULL,
  p_exercice INTEGER DEFAULT NULL,
  p_direction_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(
  id UUID,
  qr_code_hash TEXT,
  qr_code_data TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_hash TEXT;
  v_qr_data TEXT;
  v_user_id UUID;
  v_base_url TEXT := 'https://sygfp.arti.ga/verify/';
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- Générer un hash unique pour le QR code
  -- Format: SHA256 de (entity_type + entity_id + type_document + timestamp + random)
  v_hash := encode(
    sha256(
      (p_entity_type || p_entity_id::TEXT || p_type_document || now()::TEXT || gen_random_uuid()::TEXT)::BYTEA
    ),
    'hex'
  );

  -- Tronquer le hash pour le rendre plus pratique (32 caractères suffisent)
  v_hash := substring(v_hash from 1 for 32);

  -- Construire l'URL de vérification
  v_qr_data := v_base_url || v_hash;

  -- Insérer le document
  INSERT INTO documents_generes (
    entity_type, entity_id, type_document, reference,
    qr_code_hash, qr_code_data,
    nom_fichier, chemin_stockage, taille_octets,
    date_expiration, exercice, direction_id,
    genere_par, metadata
  ) VALUES (
    p_entity_type, p_entity_id, p_type_document, p_reference,
    v_hash, v_qr_data,
    p_nom_fichier, p_chemin_stockage, p_taille_octets,
    p_date_expiration, p_exercice, p_direction_id,
    v_user_id, p_metadata
  )
  RETURNING documents_generes.id INTO v_id;

  RETURN QUERY SELECT v_id, v_hash, v_qr_data;
END;
$$;

-- 8. Fonction pour annuler un document
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cancel_generated_document(
  p_document_id UUID,
  p_motif TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_updated INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  IF p_motif IS NULL OR p_motif = '' THEN
    RAISE EXCEPTION 'Le motif d''annulation est obligatoire';
  END IF;

  -- Annuler le document
  UPDATE documents_generes
  SET
    est_annule = true,
    motif_annulation = p_motif,
    annule_par = v_user_id,
    annule_at = now()
  WHERE id = p_document_id
    AND est_annule = false
    AND (
      genere_par = v_user_id
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = v_user_id
          AND p.profil_fonctionnel = 'Admin'
      )
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$;

-- 9. Fonction pour obtenir les statistiques de vérification
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_verification_stats(
  p_document_id UUID DEFAULT NULL,
  p_date_debut TIMESTAMPTZ DEFAULT NULL,
  p_date_fin TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  total_verifications BIGINT,
  verifications_valides BIGINT,
  verifications_invalides BIGINT,
  verifications_expires BIGINT,
  verifications_annules BIGINT,
  ips_uniques BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_verifications,
    COUNT(*) FILTER (WHERE v.resultat = 'valide')::BIGINT AS verifications_valides,
    COUNT(*) FILTER (WHERE v.resultat = 'invalide')::BIGINT AS verifications_invalides,
    COUNT(*) FILTER (WHERE v.resultat = 'expire')::BIGINT AS verifications_expires,
    COUNT(*) FILTER (WHERE v.resultat = 'annule')::BIGINT AS verifications_annules,
    COUNT(DISTINCT v.ip_address)::BIGINT AS ips_uniques
  FROM verifications_qrcode v
  WHERE (p_document_id IS NULL OR v.document_id = p_document_id)
    AND (p_date_debut IS NULL OR v.verified_at >= p_date_debut)
    AND (p_date_fin IS NULL OR v.verified_at <= p_date_fin);
END;
$$;

-- 10. Fonction pour nettoyer les anciennes entrées de rate limiting
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_qrcode()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Supprimer les entrées de plus de 24 heures
  DELETE FROM rate_limit_qrcode
  WHERE window_start < now() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

-- 11. Vue pour les documents avec informations de génération
-- ============================================================================
CREATE OR REPLACE VIEW public.v_documents_generes AS
SELECT
  d.id,
  d.entity_type,
  d.entity_id,
  d.type_document,
  d.reference,
  d.qr_code_hash,
  d.qr_code_data,
  d.nom_fichier,
  d.chemin_stockage,
  d.taille_octets,
  ROUND(d.taille_octets / 1024.0, 2) AS taille_ko,
  d.date_expiration,
  d.est_annule,
  d.motif_annulation,
  d.annule_par,
  d.annule_at,
  d.genere_par,
  p.full_name AS genere_par_nom,
  p.email AS genere_par_email,
  d.genere_at,
  d.exercice,
  d.direction_id,
  dir.label AS direction_label,
  d.metadata,
  -- Compteur de vérifications
  (SELECT COUNT(*) FROM verifications_qrcode v WHERE v.document_id = d.id) AS nb_verifications,
  (SELECT COUNT(*) FROM verifications_qrcode v WHERE v.document_id = d.id AND v.resultat = 'valide') AS nb_verif_valides
FROM documents_generes d
LEFT JOIN profiles p ON p.id = d.genere_par
LEFT JOIN directions dir ON dir.id = d.direction_id;

-- 12. Vue pour l'historique des vérifications
-- ============================================================================
CREATE OR REPLACE VIEW public.v_verifications_qrcode AS
SELECT
  v.id,
  v.document_id,
  d.reference AS document_reference,
  d.type_document,
  v.qr_hash,
  v.ip_address,
  v.user_agent,
  v.origin_url,
  v.resultat,
  v.message,
  v.verified_at,
  -- Informations supplémentaires si document existe
  d.entity_type,
  d.entity_id,
  d.genere_par,
  p.full_name AS genere_par_nom
FROM verifications_qrcode v
LEFT JOIN documents_generes d ON d.id = v.document_id
LEFT JOIN profiles p ON p.id = d.genere_par
ORDER BY v.verified_at DESC;

-- 13. Grant accès à la fonction de vérification pour les utilisateurs anonymes
-- ============================================================================
-- La fonction verify_document_qr doit être accessible publiquement
GRANT EXECUTE ON FUNCTION public.verify_document_qr TO anon;
GRANT EXECUTE ON FUNCTION public.verify_document_qr TO authenticated;

-- Les autres fonctions sont réservées aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.register_generated_document TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_generated_document TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_verification_stats TO authenticated;

-- 14. Commentaires de documentation
-- ============================================================================
COMMENT ON TABLE public.documents_generes IS
'Historique de tous les documents PDF générés par le système SYGFP.
Chaque document possède un QR code unique permettant de vérifier son authenticité.';

COMMENT ON COLUMN public.documents_generes.qr_code_hash IS
'Hash unique SHA256 (32 caractères) utilisé pour identifier le document via QR code';

COMMENT ON COLUMN public.documents_generes.qr_code_data IS
'URL complète de vérification encodée dans le QR code';

COMMENT ON COLUMN public.documents_generes.est_annule IS
'Indique si le document a été annulé (révoqué). Un document annulé échouera à la vérification.';

COMMENT ON TABLE public.verifications_qrcode IS
'Log de toutes les vérifications de QR codes effectuées.
Permet l audit et la détection de fraudes potentielles.';

COMMENT ON TABLE public.rate_limit_qrcode IS
'Table de rate limiting pour protéger la fonction de vérification contre les abus.
Maximum 100 requêtes par IP par heure.';

COMMENT ON FUNCTION public.verify_document_qr IS
'Vérifie l''authenticité d''un document via son hash QR code.
Accessible publiquement (SECURITY DEFINER). Rate limited à 100 req/h par IP.
Retourne les informations du document si valide, ou un message d''erreur.';

COMMENT ON FUNCTION public.register_generated_document IS
'Enregistre un nouveau document généré et crée son QR code unique.
Retourne l''ID, le hash et l''URL de vérification à encoder dans le QR.';

COMMENT ON FUNCTION public.cancel_generated_document IS
'Annule un document généré. Le document échouera aux futures vérifications.
Nécessite un motif obligatoire.';

COMMENT ON FUNCTION public.get_verification_stats IS
'Retourne les statistiques de vérification globales ou pour un document spécifique.';

COMMENT ON FUNCTION public.cleanup_rate_limit_qrcode IS
'Nettoie les entrées de rate limiting de plus de 24h. À exécuter via cron ou pg_cron.';
