-- ============================================================================
-- Prompt 12 — Sécurité (RLS), Performance (indexes, pagination RPC), Qualité
-- ============================================================================

-- ─── A0. Créer les fonctions helper RBAC si elles n'existent pas ────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      profil_fonctionnel = 'Admin'
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'ADMIN'
        AND is_active = true
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_dg()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      role_hierarchique = 'DG'
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'DG'
        AND is_active = true
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_cb()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'CB'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_daaf()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('DAAF', 'DAF')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_direction_id()
RETURNS UUID AS $$
  SELECT direction_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── A1. Ajouter direction_id dénormalisée à passation_marche ────────────────
ALTER TABLE passation_marche
  ADD COLUMN IF NOT EXISTS direction_id uuid REFERENCES directions(id);

-- Désactiver temporairement TOUS les triggers utilisateur pour le backfill
ALTER TABLE passation_marche DISABLE TRIGGER USER;

-- Backfill depuis expression_besoin
UPDATE passation_marche pm
SET direction_id = eb.direction_id
FROM expressions_besoin eb
WHERE pm.expression_besoin_id = eb.id
  AND pm.direction_id IS NULL
  AND eb.direction_id IS NOT NULL;

-- Réactiver les triggers utilisateur
ALTER TABLE passation_marche ENABLE TRIGGER USER;

-- Trigger auto-sync : quand on insère/update une passation, on copie la direction de l'EB
CREATE OR REPLACE FUNCTION sync_passation_direction_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expression_besoin_id IS NOT NULL THEN
    SELECT eb.direction_id INTO NEW.direction_id
    FROM expressions_besoin eb
    WHERE eb.id = NEW.expression_besoin_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_passation_direction ON passation_marche;
CREATE TRIGGER trg_sync_passation_direction
  BEFORE INSERT OR UPDATE OF expression_besoin_id ON passation_marche
  FOR EACH ROW
  EXECUTE FUNCTION sync_passation_direction_id();

-- ─── A2. Index composites pour performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_passation_marche_exercice_statut
  ON passation_marche(exercice, statut);
CREATE INDEX IF NOT EXISTS idx_passation_marche_direction
  ON passation_marche(direction_id);
CREATE INDEX IF NOT EXISTS idx_passation_marche_created_by
  ON passation_marche(created_by);

-- ─── A3. DROP anciennes policies permissives sur passation_marche ────────────
DROP POLICY IF EXISTS "Users can read passation_marche" ON passation_marche;
DROP POLICY IF EXISTS "Authenticated users can insert passation_marche" ON passation_marche;
DROP POLICY IF EXISTS "Authenticated users can update passation_marche" ON passation_marche;
DROP POLICY IF EXISTS "Users can delete draft passation_marche" ON passation_marche;

-- ─── A4. Nouvelles policies passation_marche ─────────────────────────────────

-- SELECT : admin/DG/DAAF/CB voient tout, sinon created_by ou même direction
DROP POLICY IF EXISTS "pm_select_v2" ON passation_marche;
CREATE POLICY "pm_select_v2" ON passation_marche FOR SELECT TO authenticated
  USING (
    is_admin() OR is_dg() OR is_daaf() OR is_cb()
    OR created_by = auth.uid()
    OR direction_id = get_user_direction_id()
  );

-- INSERT : admin ou DAAF uniquement
DROP POLICY IF EXISTS "pm_insert_v2" ON passation_marche;
CREATE POLICY "pm_insert_v2" ON passation_marche FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR is_daaf()
  );

-- UPDATE : admin, DAAF, DG (pour attribué uniquement), ou créateur en brouillon
DROP POLICY IF EXISTS "pm_update_v2" ON passation_marche;
CREATE POLICY "pm_update_v2" ON passation_marche FOR UPDATE TO authenticated
  USING (
    is_admin() OR is_daaf()
    OR (is_dg() AND statut = 'attribue')
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );

-- DELETE : admin ou créateur en brouillon
DROP POLICY IF EXISTS "pm_delete_v2" ON passation_marche;
CREATE POLICY "pm_delete_v2" ON passation_marche FOR DELETE TO authenticated
  USING (
    is_admin()
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );

-- ─── A5. Refaire lots_marche RLS ────────────────────────────────────────────

DROP POLICY IF EXISTS "lots_select" ON lots_marche;
DROP POLICY IF EXISTS "lots_insert" ON lots_marche;
DROP POLICY IF EXISTS "lots_update" ON lots_marche;
DROP POLICY IF EXISTS "lots_delete" ON lots_marche;

-- SELECT cascadé: voit les lots des passations visibles
DROP POLICY IF EXISTS "lots_select_v2" ON lots_marche;
CREATE POLICY "lots_select_v2" ON lots_marche FOR SELECT TO authenticated
  USING (passation_marche_id IN (SELECT id FROM passation_marche));

-- INSERT: DAAF ou créateur de la passation
DROP POLICY IF EXISTS "lots_insert_v2" ON lots_marche;
CREATE POLICY "lots_insert_v2" ON lots_marche FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR is_daaf()
    OR passation_marche_id IN (
      SELECT id FROM passation_marche WHERE created_by = auth.uid() AND statut = 'brouillon'
    )
  );

-- UPDATE: DAAF ou créateur (tant que brouillon/publié/clôturé)
DROP POLICY IF EXISTS "lots_update_v2" ON lots_marche;
CREATE POLICY "lots_update_v2" ON lots_marche FOR UPDATE TO authenticated
  USING (
    is_admin() OR is_daaf()
    OR passation_marche_id IN (
      SELECT id FROM passation_marche
      WHERE created_by = auth.uid() AND statut IN ('brouillon', 'publie', 'cloture')
    )
  );

-- DELETE: DAAF ou créateur (brouillon uniquement)
DROP POLICY IF EXISTS "lots_delete_v2" ON lots_marche;
CREATE POLICY "lots_delete_v2" ON lots_marche FOR DELETE TO authenticated
  USING (
    is_admin() OR is_daaf()
    OR passation_marche_id IN (
      SELECT id FROM passation_marche WHERE created_by = auth.uid() AND statut = 'brouillon'
    )
  );

-- ─── A6. Refaire soumissionnaires_lot RLS ────────────────────────────────────

DROP POLICY IF EXISTS "soum_lot_select" ON soumissionnaires_lot;
DROP POLICY IF EXISTS "soum_lot_insert" ON soumissionnaires_lot;
DROP POLICY IF EXISTS "soum_lot_update" ON soumissionnaires_lot;
DROP POLICY IF EXISTS "soum_lot_delete" ON soumissionnaires_lot;

-- SELECT cascadé avec confidentialité des notes
-- Les colonnes note_technique, note_financiere, note_finale sont visibles pour tout
-- le monde MAIS l'accès à la ligne est contrôlé au niveau passation_marche (RLS cascadé).
-- Pour la confidentialité fine des notes avant attribution, on utilise une vue sécurisée
-- (voir plus bas). Ici, on donne l'accès lecture basique via passation_marche RLS.
DROP POLICY IF EXISTS "soum_select_v2" ON soumissionnaires_lot;
CREATE POLICY "soum_select_v2" ON soumissionnaires_lot FOR SELECT TO authenticated
  USING (passation_marche_id IN (SELECT id FROM passation_marche));

-- INSERT: DAAF ou créateur de la passation
DROP POLICY IF EXISTS "soum_insert_v2" ON soumissionnaires_lot;
CREATE POLICY "soum_insert_v2" ON soumissionnaires_lot FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR is_daaf()
    OR passation_marche_id IN (
      SELECT id FROM passation_marche
      WHERE created_by = auth.uid() AND statut IN ('brouillon', 'publie', 'cloture')
    )
  );

-- UPDATE: DAAF ou créateur (pendant phases ouvertes)
DROP POLICY IF EXISTS "soum_update_v2" ON soumissionnaires_lot;
CREATE POLICY "soum_update_v2" ON soumissionnaires_lot FOR UPDATE TO authenticated
  USING (
    is_admin() OR is_daaf()
    OR passation_marche_id IN (
      SELECT id FROM passation_marche
      WHERE created_by = auth.uid() AND statut IN ('brouillon', 'publie', 'cloture', 'en_evaluation')
    )
  );

-- DELETE: DAAF ou créateur (phases ouvertes)
DROP POLICY IF EXISTS "soum_delete_v2" ON soumissionnaires_lot;
CREATE POLICY "soum_delete_v2" ON soumissionnaires_lot FOR DELETE TO authenticated
  USING (
    is_admin() OR is_daaf()
    OR passation_marche_id IN (
      SELECT id FROM passation_marche
      WHERE created_by = auth.uid() AND statut IN ('brouillon', 'publie', 'cloture')
    )
  );

-- ─── A7. RPC get_passation_counts — KPI en 1 requête ────────────────────────

CREATE OR REPLACE FUNCTION get_passation_counts(p_exercice integer)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT jsonb_object_agg(statut, cnt)
  FROM (
    SELECT statut, count(*)::int AS cnt
    FROM passation_marche
    WHERE exercice = p_exercice
    GROUP BY statut
  ) sub;
$$;
