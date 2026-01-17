
-- ============================================================
-- Migration: Finalisation chaîne paiement + intégration Trésorerie
-- ============================================================

-- 1. Vue pour les paiements à venir (ordres validés non soldés)
CREATE OR REPLACE VIEW v_paiements_a_venir AS
SELECT 
  o.id AS ordonnancement_id,
  o.numero AS numero_ordonnancement,
  o.montant AS montant_total,
  COALESCE(o.montant_paye, 0) AS montant_paye,
  o.montant - COALESCE(o.montant_paye, 0) AS reste_a_payer,
  o.beneficiaire,
  o.banque AS banque_beneficiaire,
  o.rib AS rib_beneficiaire,
  o.mode_paiement,
  o.objet,
  o.created_at AS date_ordonnancement,
  o.exercice,
  l.numero AS numero_liquidation,
  e.numero AS numero_engagement,
  e.fournisseur,
  bl.code AS code_ligne_budgetaire,
  bl.label AS libelle_ligne_budgetaire,
  d.numero AS numero_dossier,
  d.id AS dossier_id,
  -- Priorité basée sur ancienneté (plus ancien = plus prioritaire)
  ROW_NUMBER() OVER (ORDER BY o.created_at ASC) AS priorite
FROM ordonnancements o
  LEFT JOIN budget_liquidations l ON o.liquidation_id = l.id
  LEFT JOIN budget_engagements e ON l.engagement_id = e.id
  LEFT JOIN budget_lines bl ON e.budget_line_id = bl.id
  LEFT JOIN dossiers d ON e.dossier_id = d.id OR o.dossier_id = d.id
WHERE o.statut IN ('valide', 'signe', 'en_signature')
  AND o.montant > COALESCE(o.montant_paye, 0);

-- 2. Vue statistiques règlements avec taux de paiement
CREATE OR REPLACE VIEW v_reglement_stats AS
SELECT 
  bl.id AS budget_line_id,
  bl.code,
  bl.label,
  bl.exercice,
  bl.dotation_initiale,
  COALESCE(bl.dotation_modifiee, bl.dotation_initiale) AS dotation_courante,
  COALESCE(bl.total_engage, 0) AS total_engage,
  COALESCE(bl.total_liquide, 0) AS total_liquide,
  COALESCE(bl.total_ordonnance, 0) AS total_ordonnance,
  COALESCE(bl.total_paye, 0) AS total_paye,
  -- Taux de paiement
  CASE 
    WHEN COALESCE(bl.total_ordonnance, 0) > 0 
    THEN ROUND((COALESCE(bl.total_paye, 0) / bl.total_ordonnance) * 100, 2)
    ELSE 0
  END AS taux_paiement,
  -- Taux d'exécution global (payé / dotation)
  CASE 
    WHEN COALESCE(bl.dotation_modifiee, bl.dotation_initiale) > 0 
    THEN ROUND((COALESCE(bl.total_paye, 0) / COALESCE(bl.dotation_modifiee, bl.dotation_initiale)) * 100, 2)
    ELSE 0
  END AS taux_execution
FROM budget_lines bl
WHERE bl.is_active = true;

-- 3. Vue position de trésorerie avec prévisions
CREATE OR REPLACE VIEW v_position_tresorerie AS
SELECT 
  exercice,
  -- Solde actuel
  (SELECT COALESCE(SUM(solde_actuel), 0) FROM comptes_bancaires WHERE est_actif = true) AS solde_disponible,
  -- Montant total à payer (ordres non soldés)
  COALESCE(SUM(montant - COALESCE(montant_paye, 0)) FILTER (WHERE statut IN ('valide', 'signe')), 0) AS montant_a_payer,
  -- Nombre d'ordres à payer
  COUNT(*) FILTER (WHERE statut IN ('valide', 'signe') AND montant > COALESCE(montant_paye, 0)) AS nb_ordres_a_payer,
  -- Partiellement payés
  COUNT(*) FILTER (WHERE montant_paye > 0 AND montant_paye < montant) AS nb_partiels
FROM ordonnancements
GROUP BY exercice;

-- 4. Fonction pour créer automatiquement une opération de trésorerie lors d'un règlement
CREATE OR REPLACE FUNCTION create_tresorerie_operation_from_reglement()
RETURNS TRIGGER AS $$
DECLARE
  v_compte_id uuid;
  v_ordonnancement record;
  v_solde_avant numeric;
  v_solde_apres numeric;
  v_numero_operation text;
  v_seq_num integer;
BEGIN
  -- Ne créer l'opération que si le règlement a un statut confirmé/validé et un compte bancaire
  IF NEW.statut NOT IN ('annule', 'brouillon') AND NEW.compte_bancaire_arti IS NOT NULL THEN
    
    -- Récupérer l'ordonnancement lié
    SELECT * INTO v_ordonnancement FROM ordonnancements WHERE id = NEW.ordonnancement_id;
    
    -- Trouver le compte bancaire correspondant
    SELECT id, solde_actuel INTO v_compte_id, v_solde_avant
    FROM comptes_bancaires 
    WHERE code = NEW.compte_bancaire_arti OR libelle ILIKE '%' || NEW.banque_arti || '%'
    LIMIT 1;
    
    -- Si un compte est trouvé, créer l'opération
    IF v_compte_id IS NOT NULL THEN
      v_solde_apres := v_solde_avant - NEW.montant;
      
      -- Générer le numéro d'opération
      INSERT INTO operation_tresorerie_sequences (annee, dernier_numero)
      VALUES (EXTRACT(YEAR FROM CURRENT_DATE)::integer, 1)
      ON CONFLICT (annee) DO UPDATE SET dernier_numero = operation_tresorerie_sequences.dernier_numero + 1
      RETURNING dernier_numero INTO v_seq_num;
      
      v_numero_operation := 'OP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_seq_num::text, 5, '0');
      
      -- Créer l'opération de sortie
      INSERT INTO operations_tresorerie (
        numero,
        compte_id,
        type_operation,
        date_operation,
        date_valeur,
        montant,
        solde_avant,
        solde_apres,
        libelle,
        reference_externe,
        reglement_id,
        exercice,
        created_by
      ) VALUES (
        v_numero_operation,
        v_compte_id,
        'sortie',
        NEW.date_paiement,
        NEW.date_paiement,
        NEW.montant,
        v_solde_avant,
        v_solde_apres,
        'Règlement ' || NEW.numero || ' - ' || COALESCE(v_ordonnancement.beneficiaire, 'Bénéficiaire'),
        NEW.reference_paiement,
        NEW.id,
        NEW.exercice,
        NEW.created_by
      );
      
      -- Mettre à jour le solde du compte
      UPDATE comptes_bancaires 
      SET solde_actuel = v_solde_apres
      WHERE id = v_compte_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Trigger pour créer l'opération de trésorerie après insertion d'un règlement
DROP TRIGGER IF EXISTS trg_create_tresorerie_operation ON reglements;
CREATE TRIGGER trg_create_tresorerie_operation
AFTER INSERT ON reglements
FOR EACH ROW
EXECUTE FUNCTION create_tresorerie_operation_from_reglement();

-- 6. Fonction pour mettre à jour les totaux et clôturer le dossier
CREATE OR REPLACE FUNCTION update_budget_and_close_dossier_on_reglement()
RETURNS TRIGGER AS $$
DECLARE
  v_ordonnancement record;
  v_engagement record;
  v_dossier_id uuid;
  v_total_engage numeric;
  v_total_paye numeric;
  v_budget_line_id uuid;
BEGIN
  -- Récupérer l'ordonnancement
  SELECT o.*, l.engagement_id INTO v_ordonnancement
  FROM ordonnancements o
    LEFT JOIN budget_liquidations l ON o.liquidation_id = l.id
  WHERE o.id = NEW.ordonnancement_id;
  
  -- Récupérer l'engagement et la ligne budgétaire
  SELECT * INTO v_engagement 
  FROM budget_engagements 
  WHERE id = v_ordonnancement.engagement_id;
  
  v_budget_line_id := v_engagement.budget_line_id;
  v_dossier_id := COALESCE(v_ordonnancement.dossier_id, v_engagement.dossier_id);
  
  -- Calculer le total payé pour cette ligne budgétaire
  SELECT COALESCE(SUM(r.montant), 0) INTO v_total_paye
  FROM reglements r
    JOIN ordonnancements o ON r.ordonnancement_id = o.id
    JOIN budget_liquidations l ON o.liquidation_id = l.id
    JOIN budget_engagements e ON l.engagement_id = e.id
  WHERE e.budget_line_id = v_budget_line_id
    AND r.statut NOT IN ('annule', 'brouillon');
  
  -- Mettre à jour total_paye sur la ligne budgétaire
  UPDATE budget_lines 
  SET 
    total_paye = v_total_paye,
    updated_at = now()
  WHERE id = v_budget_line_id;
  
  -- Enregistrer dans l'historique budgétaire
  INSERT INTO budget_history (
    budget_line_id,
    event_type,
    delta,
    ref_id,
    ref_code,
    commentaire,
    created_by
  ) VALUES (
    v_budget_line_id,
    'reglement',
    NEW.montant,
    NEW.id,
    NEW.numero,
    'Règlement enregistré: ' || NEW.numero,
    NEW.created_by
  );
  
  -- Vérifier si le dossier doit être soldé
  IF v_dossier_id IS NOT NULL THEN
    -- Calculer le total engagé et payé pour ce dossier
    SELECT 
      COALESCE(SUM(e.montant), 0),
      COALESCE(SUM(r_total.total_paye), 0)
    INTO v_total_engage, v_total_paye
    FROM budget_engagements e
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(r.montant), 0) AS total_paye
        FROM reglements r
          JOIN ordonnancements o ON r.ordonnancement_id = o.id
          JOIN budget_liquidations l ON o.liquidation_id = l.id
        WHERE l.engagement_id = e.id
          AND r.statut NOT IN ('annule', 'brouillon')
      ) r_total ON true
    WHERE e.dossier_id = v_dossier_id
      AND e.statut = 'valide';
    
    -- Si totalement payé, clôturer le dossier
    IF v_total_paye >= v_total_engage AND v_total_engage > 0 THEN
      UPDATE dossiers 
      SET 
        statut_global = 'solde',
        statut_paiement = 'solde',
        etape_courante = 'reglement',
        montant_paye = v_total_paye,
        date_cloture = CURRENT_DATE,
        updated_at = now()
      WHERE id = v_dossier_id;
      
      -- Résoudre la tâche workflow si elle existe
      UPDATE workflow_tasks 
      SET 
        status = 'completed',
        completed_at = now(),
        completed_by = NEW.created_by
      WHERE entity_type = 'reglement'
        AND entity_id = NEW.ordonnancement_id
        AND status = 'pending';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Trigger pour mettre à jour après règlement
DROP TRIGGER IF EXISTS trg_update_budget_on_reglement ON reglements;
CREATE TRIGGER trg_update_budget_on_reglement
AFTER INSERT ON reglements
FOR EACH ROW
EXECUTE FUNCTION update_budget_and_close_dossier_on_reglement();

-- 8. Fonction pour calculer le délai de validation des règlements
CREATE OR REPLACE FUNCTION track_reglement_step_timing()
RETURNS TRIGGER AS $$
BEGIN
  -- Si nouveau règlement, initialiser date_entree_etape
  IF TG_OP = 'INSERT' THEN
    NEW.date_entree_etape := COALESCE(NEW.date_entree_etape, now());
  END IF;
  
  -- Si statut change vers validé/confirmé, calculer le délai
  IF TG_OP = 'UPDATE' AND OLD.statut IS DISTINCT FROM NEW.statut THEN
    IF NEW.statut IN ('valide', 'confirme') AND NEW.date_entree_etape IS NOT NULL THEN
      NEW.delai_validation_jours := EXTRACT(DAY FROM (now() - NEW.date_entree_etape));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 9. Trigger pour le suivi des délais règlement
DROP TRIGGER IF EXISTS trg_track_reglement_timing ON reglements;
CREATE TRIGGER trg_track_reglement_timing
BEFORE INSERT OR UPDATE ON reglements
FOR EACH ROW
EXECUTE FUNCTION track_reglement_step_timing();

-- 10. Vue KPI taux de paiement par exercice
CREATE OR REPLACE VIEW v_kpi_paiement AS
SELECT 
  bl.exercice,
  COUNT(DISTINCT bl.id) AS nb_lignes_budget,
  COALESCE(SUM(bl.dotation_initiale), 0) AS dotation_totale,
  COALESCE(SUM(bl.total_engage), 0) AS total_engage,
  COALESCE(SUM(bl.total_liquide), 0) AS total_liquide,
  COALESCE(SUM(bl.total_ordonnance), 0) AS total_ordonnance,
  COALESCE(SUM(bl.total_paye), 0) AS total_paye,
  -- Taux engagement
  CASE 
    WHEN SUM(bl.dotation_initiale) > 0 
    THEN ROUND((SUM(COALESCE(bl.total_engage, 0)) / SUM(bl.dotation_initiale)) * 100, 2)
    ELSE 0
  END AS taux_engagement,
  -- Taux liquidation
  CASE 
    WHEN SUM(COALESCE(bl.total_engage, 0)) > 0 
    THEN ROUND((SUM(COALESCE(bl.total_liquide, 0)) / SUM(COALESCE(bl.total_engage, 0))) * 100, 2)
    ELSE 0
  END AS taux_liquidation,
  -- Taux ordonnancement
  CASE 
    WHEN SUM(COALESCE(bl.total_liquide, 0)) > 0 
    THEN ROUND((SUM(COALESCE(bl.total_ordonnance, 0)) / SUM(COALESCE(bl.total_liquide, 0))) * 100, 2)
    ELSE 0
  END AS taux_ordonnancement,
  -- Taux paiement
  CASE 
    WHEN SUM(COALESCE(bl.total_ordonnance, 0)) > 0 
    THEN ROUND((SUM(COALESCE(bl.total_paye, 0)) / SUM(COALESCE(bl.total_ordonnance, 0))) * 100, 2)
    ELSE 0
  END AS taux_paiement,
  -- Taux exécution global
  CASE 
    WHEN SUM(bl.dotation_initiale) > 0 
    THEN ROUND((SUM(COALESCE(bl.total_paye, 0)) / SUM(bl.dotation_initiale)) * 100, 2)
    ELSE 0
  END AS taux_execution_global
FROM budget_lines bl
WHERE bl.is_active = true
GROUP BY bl.exercice;

-- 11. Vue pour l'état de caisse simplifié
CREATE OR REPLACE VIEW v_etat_caisse AS
SELECT 
  cb.id AS compte_id,
  cb.code,
  cb.libelle,
  cb.banque,
  cb.type_compte,
  cb.solde_initial,
  cb.solde_actuel,
  cb.solde_actuel - cb.solde_initial AS variation,
  cb.devise,
  cb.est_actif,
  -- Dernière opération
  (SELECT date_operation FROM operations_tresorerie WHERE compte_id = cb.id ORDER BY date_operation DESC LIMIT 1) AS derniere_operation_date,
  -- Opérations du mois
  COALESCE((
    SELECT SUM(montant) 
    FROM operations_tresorerie 
    WHERE compte_id = cb.id 
      AND type_operation = 'entree'
      AND date_operation >= DATE_TRUNC('month', CURRENT_DATE)
  ), 0) AS entrees_mois,
  COALESCE((
    SELECT SUM(montant) 
    FROM operations_tresorerie 
    WHERE compte_id = cb.id 
      AND type_operation = 'sortie'
      AND date_operation >= DATE_TRUNC('month', CURRENT_DATE)
  ), 0) AS sorties_mois
FROM comptes_bancaires cb;

-- 12. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reglements_ordonnancement ON reglements(ordonnancement_id);
CREATE INDEX IF NOT EXISTS idx_reglements_statut ON reglements(statut);
CREATE INDEX IF NOT EXISTS idx_reglements_exercice ON reglements(exercice);
CREATE INDEX IF NOT EXISTS idx_operations_tresorerie_reglement ON operations_tresorerie(reglement_id);
CREATE INDEX IF NOT EXISTS idx_operations_tresorerie_compte ON operations_tresorerie(compte_id);
CREATE INDEX IF NOT EXISTS idx_operations_tresorerie_date ON operations_tresorerie(date_operation);

-- 13. Ajouter contrainte unique sur annee pour operation_tresorerie_sequences (si n'existe pas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'operation_tresorerie_sequences_annee_key'
  ) THEN
    ALTER TABLE operation_tresorerie_sequences ADD CONSTRAINT operation_tresorerie_sequences_annee_key UNIQUE (annee);
  END IF;
END $$;
