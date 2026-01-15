-- ============================================================
-- PHASE 1: Migration AEF - Colonnes manquantes + Format ARTI
-- ============================================================

-- 1.1 Ajouter colonnes manquantes sur notes_dg
ALTER TABLE notes_dg ADD COLUMN IF NOT EXISTS note_sef_id UUID REFERENCES notes_sef(id);
ALTER TABLE notes_dg ADD COLUMN IF NOT EXISTS is_direct_aef BOOLEAN DEFAULT false;
ALTER TABLE notes_dg ADD COLUMN IF NOT EXISTS type_depense TEXT DEFAULT 'fonctionnement';
ALTER TABLE notes_dg ADD COLUMN IF NOT EXISTS justification TEXT;
ALTER TABLE notes_dg ADD COLUMN IF NOT EXISTS reference_pivot TEXT;

-- Créer index pour les recherches
CREATE INDEX IF NOT EXISTS idx_notes_dg_note_sef_id ON notes_dg(note_sef_id);
CREATE INDEX IF NOT EXISTS idx_notes_dg_is_direct_aef ON notes_dg(is_direct_aef);

-- 1.2 Fonction pour générer la référence AEF au format ARTI
-- Format: ARTI + 1 (étape AEF) + MM (mois) + YY (année) + NNNN (compteur)
-- Exemple: ARTI101260001 pour la 1ère AEF de janvier 2026
CREATE OR REPLACE FUNCTION generate_note_aef_reference(p_exercice INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mois TEXT;
  v_annee TEXT;
  v_counter INTEGER;
  v_reference TEXT;
  v_prefix TEXT;
BEGIN
  -- Mois courant (2 chiffres)
  v_mois := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
  
  -- Année (2 derniers chiffres)
  v_annee := LPAD((p_exercice % 100)::TEXT, 2, '0');
  
  -- Préfixe pour le compteur: ARTI1 + MOIS + ANNEE
  v_prefix := 'ARTI1' || v_mois || v_annee;
  
  -- Récupérer ou initialiser le compteur via reference_counters
  INSERT INTO reference_counters (prefix, exercice, current_value)
  VALUES (v_prefix, p_exercice, 1)
  ON CONFLICT (prefix, exercice)
  DO UPDATE SET 
    current_value = reference_counters.current_value + 1,
    updated_at = NOW()
  RETURNING current_value INTO v_counter;
  
  -- Construire la référence finale
  v_reference := v_prefix || LPAD(v_counter::TEXT, 4, '0');
  
  RETURN v_reference;
END;
$$;

-- 1.3 Trigger pour générer automatiquement le numéro AEF
CREATE OR REPLACE FUNCTION trg_set_note_aef_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Générer le numéro seulement si non fourni
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := generate_note_aef_reference(COALESCE(NEW.exercice, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER));
    NEW.reference_pivot := NEW.numero;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_notes_dg_set_numero ON notes_dg;

-- Créer le nouveau trigger
CREATE TRIGGER trg_notes_dg_set_numero
  BEFORE INSERT ON notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION trg_set_note_aef_numero();

-- 1.4 Mettre à jour les RLS pour notes_dg (AEF)
-- Permettre aux DG de créer des AEF directes
DROP POLICY IF EXISTS "notes_sef_insert_policy" ON notes_dg;
CREATE POLICY "notes_dg_insert_policy" ON notes_dg
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (created_by IS NULL OR created_by = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

-- Permettre lecture par créateur, direction, ou rôles autorisés
DROP POLICY IF EXISTS "notes_sef_select_policy" ON notes_dg;
CREATE POLICY "notes_dg_select_policy" ON notes_dg
  FOR SELECT
  USING (
    -- Créateur peut voir
    created_by = auth.uid()
    -- Admins peuvent voir
    OR has_role(auth.uid(), 'ADMIN'::app_role)
    -- DG peut voir toutes
    OR has_role(auth.uid(), 'DG'::app_role)
    -- DAAF peut voir les validées/imputées
    OR (has_role(auth.uid(), 'DAAF'::app_role) AND statut IN ('valide', 'impute'))
    -- CB peut voir les validées
    OR (has_role(auth.uid(), 'CB'::app_role) AND statut IN ('valide', 'impute'))
    -- Même direction peut voir les validées
    OR (
      direction_id IN (SELECT direction_id FROM profiles WHERE id = auth.uid())
      AND statut = 'valide'
    )
  );

-- Permettre mise à jour par créateur (brouillon/différé) ou rôles autorisés
DROP POLICY IF EXISTS "notes_sef_update_policy" ON notes_dg;
CREATE POLICY "notes_dg_update_policy" ON notes_dg
  FOR UPDATE
  USING (
    -- Admin peut tout modifier
    has_role(auth.uid(), 'ADMIN'::app_role)
    -- Créateur peut modifier brouillon/différé
    OR (created_by = auth.uid() AND statut IN ('brouillon', 'differe'))
    -- DG peut valider/rejeter/différer les soumises
    OR (has_role(auth.uid(), 'DG'::app_role) AND statut IN ('soumis', 'a_valider', 'differe'))
    -- DAAF/CB peut imputer les validées
    OR (has_role(auth.uid(), 'DAAF'::app_role) AND statut = 'valide')
    OR (has_role(auth.uid(), 'CB'::app_role) AND statut = 'valide')
  );

-- Permettre suppression brouillon par créateur ou admin
DROP POLICY IF EXISTS "notes_sef_delete_policy" ON notes_dg;
CREATE POLICY "notes_dg_delete_policy" ON notes_dg
  FOR DELETE
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );

-- 1.5 Créer table notes_aef_history pour audit
CREATE TABLE IF NOT EXISTS notes_aef_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes_dg(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_statut TEXT,
  new_statut TEXT,
  commentaire TEXT,
  ip_address TEXT,
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_notes_aef_history_note_id ON notes_aef_history(note_id);
CREATE INDEX IF NOT EXISTS idx_notes_aef_history_performed_at ON notes_aef_history(performed_at);

-- RLS pour notes_aef_history
ALTER TABLE notes_aef_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_aef_history_insert" ON notes_aef_history
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notes_aef_history_select" ON notes_aef_history
  FOR SELECT
  USING (
    -- Peut voir l'historique de ses propres notes
    EXISTS (
      SELECT 1 FROM notes_dg n 
      WHERE n.id = note_id 
      AND (n.created_by = auth.uid() OR has_role(auth.uid(), 'ADMIN'::app_role) OR has_role(auth.uid(), 'DG'::app_role))
    )
  );

-- 1.6 Trigger pour log automatique des changements de statut AEF
CREATE OR REPLACE FUNCTION trg_log_note_aef_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Logger uniquement les changements de statut
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    INSERT INTO notes_aef_history (note_id, action, old_statut, new_statut, performed_by)
    VALUES (NEW.id, 'status_change', OLD.statut, NEW.statut, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notes_dg_status_log ON notes_dg;
CREATE TRIGGER trg_notes_dg_status_log
  AFTER UPDATE ON notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION trg_log_note_aef_status_change();

-- 1.7 Commentaires pour documentation
COMMENT ON COLUMN notes_dg.note_sef_id IS 'Lien vers la Note SEF source (NULL si AEF directe par DG)';
COMMENT ON COLUMN notes_dg.is_direct_aef IS 'True si créée directement par le DG sans Note SEF';
COMMENT ON COLUMN notes_dg.type_depense IS 'Type de dépense: fonctionnement, investissement, transfert';
COMMENT ON COLUMN notes_dg.justification IS 'Justification détaillée de la demande';
COMMENT ON COLUMN notes_dg.reference_pivot IS 'Référence au format ARTI pour chaînage inter-modules';
COMMENT ON TABLE notes_aef_history IS 'Historique des actions sur les Notes AEF';