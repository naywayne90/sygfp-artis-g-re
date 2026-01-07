-- ============================================
-- PROMPT 3: Module Dossiers - Améliorations
-- ============================================

-- 1) Ajouter les colonnes manquantes à la table dossiers
ALTER TABLE dossiers 
  ADD COLUMN IF NOT EXISTS mission_id UUID REFERENCES missions(id),
  ADD COLUMN IF NOT EXISTS action_id UUID REFERENCES actions(id),
  ADD COLUMN IF NOT EXISTS activite_id UUID REFERENCES activites(id),
  ADD COLUMN IF NOT EXISTS responsable_suivi_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS date_ouverture DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS date_cloture DATE,
  ADD COLUMN IF NOT EXISTS montant_paye NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS piece_principale_path TEXT,
  ADD COLUMN IF NOT EXISTS motif_blocage TEXT,
  ADD COLUMN IF NOT EXISTS date_blocage TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bloque_par UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS debloque_par UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS date_deblocage TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commentaire_deblocage TEXT,
  ADD COLUMN IF NOT EXISTS urgence VARCHAR(20) DEFAULT 'normale',
  ADD COLUMN IF NOT EXISTS priorite INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS code_budgetaire TEXT,
  ADD COLUMN IF NOT EXISTS budget_line_id UUID REFERENCES budget_lines(id);

-- 2) Ajouter index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_dossiers_mission ON dossiers(mission_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_action ON dossiers(action_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_activite ON dossiers(activite_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_responsable ON dossiers(responsable_suivi_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_statut_global ON dossiers(statut_global);
CREATE INDEX IF NOT EXISTS idx_dossiers_bloque ON dossiers(bloque_par) WHERE motif_blocage IS NOT NULL;

-- 3) Mise à jour du statut_global pour inclure BLOQUE
-- (pas de modification de type car c'est un TEXT)

-- 4) Fonction pour bloquer un dossier
CREATE OR REPLACE FUNCTION bloquer_dossier(
  p_dossier_id UUID,
  p_motif TEXT,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE dossiers 
  SET 
    statut_global = 'bloque',
    motif_blocage = p_motif,
    date_blocage = NOW(),
    bloque_par = p_user_id,
    updated_at = NOW()
  WHERE id = p_dossier_id;

  -- Log audit
  INSERT INTO audit_logs (entity_type, entity_id, action, new_values, user_id)
  VALUES ('dossier', p_dossier_id, 'bloquer', jsonb_build_object('motif', p_motif), p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Fonction pour débloquer un dossier
CREATE OR REPLACE FUNCTION debloquer_dossier(
  p_dossier_id UUID,
  p_commentaire TEXT,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_ancien_statut TEXT;
BEGIN
  -- Récupérer l'ancien statut si possible, sinon 'en_cours'
  SELECT COALESCE(
    (SELECT new_values->>'statut_global' FROM audit_logs 
     WHERE entity_type = 'dossier' AND entity_id = p_dossier_id::text 
     AND action = 'bloquer' ORDER BY created_at DESC LIMIT 1),
    'en_cours'
  ) INTO v_ancien_statut;

  UPDATE dossiers 
  SET 
    statut_global = 'en_cours',
    debloque_par = p_user_id,
    date_deblocage = NOW(),
    commentaire_deblocage = p_commentaire,
    updated_at = NOW()
  WHERE id = p_dossier_id;

  -- Log audit
  INSERT INTO audit_logs (entity_type, entity_id, action, new_values, user_id)
  VALUES ('dossier', p_dossier_id, 'debloquer', jsonb_build_object('commentaire', p_commentaire), p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Trigger pour empêcher suppression d'un dossier avec écritures
CREATE OR REPLACE FUNCTION prevent_dossier_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Vérifier s'il y a des engagements liés
  SELECT COUNT(*) INTO v_count 
  FROM budget_engagements 
  WHERE project_id = OLD.id OR note_id IN (
    SELECT entity_id FROM dossier_etapes WHERE dossier_id = OLD.id AND type_etape = 'note'
  );
  
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer ce dossier : % engagement(s) lié(s)', v_count;
  END IF;

  -- Vérifier s'il y a des étapes validées
  SELECT COUNT(*) INTO v_count 
  FROM dossier_etapes 
  WHERE dossier_id = OLD.id AND statut = 'valide';
  
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer ce dossier : % étape(s) validée(s)', v_count;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_dossier_deletion ON dossiers;
CREATE TRIGGER trg_prevent_dossier_deletion
  BEFORE DELETE ON dossiers
  FOR EACH ROW EXECUTE FUNCTION prevent_dossier_deletion();

-- 7) Fonction pour recalculer les montants d'un dossier
CREATE OR REPLACE FUNCTION recalculer_montants_dossier(p_dossier_id UUID)
RETURNS VOID AS $$
DECLARE
  v_engage NUMERIC := 0;
  v_liquide NUMERIC := 0;
  v_ordonnance NUMERIC := 0;
  v_paye NUMERIC := 0;
BEGIN
  -- Calculer depuis les étapes
  SELECT 
    COALESCE(SUM(CASE WHEN type_etape = 'engagement' AND statut = 'valide' THEN montant ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type_etape = 'liquidation' AND statut = 'valide' THEN montant ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type_etape = 'ordonnancement' AND statut = 'valide' THEN montant ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type_etape = 'reglement' AND statut = 'valide' THEN montant ELSE 0 END), 0)
  INTO v_engage, v_liquide, v_ordonnance, v_paye
  FROM dossier_etapes
  WHERE dossier_id = p_dossier_id;

  UPDATE dossiers
  SET 
    montant_engage = v_engage,
    montant_liquide = v_liquide,
    montant_ordonnance = v_ordonnance,
    montant_paye = v_paye,
    updated_at = NOW()
  WHERE id = p_dossier_id;
END;
$$ LANGUAGE plpgsql;

-- 8) Trigger pour mettre à jour les montants quand une étape est validée
CREATE OR REPLACE FUNCTION update_dossier_on_etape_validation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'valide' AND (OLD.statut IS NULL OR OLD.statut <> 'valide') THEN
    -- Recalculer les montants
    PERFORM recalculer_montants_dossier(NEW.dossier_id);
    
    -- Mettre à jour l'étape courante
    UPDATE dossiers 
    SET etape_courante = NEW.type_etape, updated_at = NOW()
    WHERE id = NEW.dossier_id;
  END IF;
  
  -- Si une étape est rejetée, bloquer le dossier
  IF NEW.statut = 'rejete' AND (OLD.statut IS NULL OR OLD.statut <> 'rejete') THEN
    UPDATE dossiers 
    SET 
      statut_global = 'bloque',
      motif_blocage = COALESCE(NEW.commentaire, 'Étape ' || NEW.type_etape || ' rejetée'),
      date_blocage = NOW(),
      bloque_par = NEW.created_by,
      updated_at = NOW()
    WHERE id = NEW.dossier_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_dossier_on_etape ON dossier_etapes;
CREATE TRIGGER trg_update_dossier_on_etape
  AFTER UPDATE ON dossier_etapes
  FOR EACH ROW EXECUTE FUNCTION update_dossier_on_etape_validation();

-- 9) Ajouter dossier_id aux tables liées si manquant
ALTER TABLE budget_engagements ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES dossiers(id);
ALTER TABLE budget_liquidations ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES dossiers(id);
ALTER TABLE ordonnancements ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES dossiers(id);
ALTER TABLE reglements ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES dossiers(id);
ALTER TABLE marches ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES dossiers(id);
ALTER TABLE notes_dg ADD COLUMN IF NOT EXISTS dossier_id UUID REFERENCES dossiers(id);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_engagements_dossier ON budget_engagements(dossier_id);
CREATE INDEX IF NOT EXISTS idx_liquidations_dossier ON budget_liquidations(dossier_id);
CREATE INDEX IF NOT EXISTS idx_ordonnancements_dossier ON ordonnancements(dossier_id);
CREATE INDEX IF NOT EXISTS idx_reglements_dossier ON reglements(dossier_id);
CREATE INDEX IF NOT EXISTS idx_marches_dossier ON marches(dossier_id);
CREATE INDEX IF NOT EXISTS idx_notes_dg_dossier ON notes_dg(dossier_id);

-- 10) Vue pour le suivi complet d'un dossier avec sa chaîne
CREATE OR REPLACE VIEW v_dossier_chaine AS
SELECT 
  d.id as dossier_id,
  d.numero as dossier_numero,
  d.objet,
  d.exercice,
  d.statut_global,
  d.montant_estime,
  d.montant_engage,
  d.montant_liquide,
  d.montant_ordonnance,
  d.montant_paye,
  dir.sigle as direction_sigle,
  dir.label as direction_label,
  -- Compter les documents à chaque étape
  (SELECT COUNT(*) FROM dossier_etapes WHERE dossier_id = d.id AND type_etape = 'note') as nb_notes,
  (SELECT COUNT(*) FROM dossier_etapes WHERE dossier_id = d.id AND type_etape = 'engagement') as nb_engagements,
  (SELECT COUNT(*) FROM dossier_etapes WHERE dossier_id = d.id AND type_etape = 'liquidation') as nb_liquidations,
  (SELECT COUNT(*) FROM dossier_etapes WHERE dossier_id = d.id AND type_etape = 'ordonnancement') as nb_ordonnancements,
  (SELECT COUNT(*) FROM dossier_etapes WHERE dossier_id = d.id AND type_etape = 'reglement') as nb_reglements,
  -- Dernière activité
  (SELECT MAX(created_at) FROM dossier_etapes WHERE dossier_id = d.id) as derniere_activite
FROM dossiers d
LEFT JOIN directions dir ON d.direction_id = dir.id;