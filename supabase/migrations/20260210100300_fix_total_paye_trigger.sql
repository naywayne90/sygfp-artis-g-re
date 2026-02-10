-- =====================================================
-- MIGRATION: Fix trigger total_paye sur reglements
-- =====================================================
-- Defauts dans update_budget_and_close_dossier_on_reglement:
-- 1. Ne fire que sur INSERT (pas UPDATE ni DELETE)
-- 2. Exclusion incomplète: NOT IN ('annule','brouillon') ne exclut PAS 'rejete'
-- 3. Utilise NEW.ordonnancement_id qui ne fonctionne pas sur DELETE
--
-- Fix: Recrire avec le pattern SUM WHERE statut IN ('enregistre','valide')
-- et supporter INSERT/UPDATE/DELETE
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_budget_and_close_dossier_on_reglement()
RETURNS TRIGGER AS $$
DECLARE
  v_ordonnancement_id UUID;
  v_ordonnancement RECORD;
  v_engagement RECORD;
  v_dossier_id UUID;
  v_total_engage NUMERIC;
  v_total_paye NUMERIC;
  v_budget_line_id UUID;
  v_record RECORD;
BEGIN
  -- Determine which record to use (NEW for INSERT/UPDATE, OLD for DELETE)
  IF TG_OP = 'DELETE' THEN
    v_record := OLD;
  ELSE
    v_record := NEW;
  END IF;

  v_ordonnancement_id := v_record.ordonnancement_id;

  -- Recuperer l'ordonnancement et la chaine vers la ligne budgetaire
  SELECT o.*, l.engagement_id INTO v_ordonnancement
  FROM ordonnancements o
    LEFT JOIN budget_liquidations l ON o.liquidation_id = l.id
  WHERE o.id = v_ordonnancement_id;

  IF v_ordonnancement IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Recuperer l'engagement et la ligne budgetaire
  SELECT * INTO v_engagement
  FROM budget_engagements
  WHERE id = v_ordonnancement.engagement_id;

  IF v_engagement IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  v_budget_line_id := v_engagement.budget_line_id;
  v_dossier_id := COALESCE(v_ordonnancement.dossier_id, v_engagement.dossier_id);

  -- Recalculer le total paye (uniquement statuts actifs: enregistre, valide)
  SELECT COALESCE(SUM(r.montant), 0) INTO v_total_paye
  FROM reglements r
    JOIN ordonnancements o ON r.ordonnancement_id = o.id
    JOIN budget_liquidations l ON o.liquidation_id = l.id
    JOIN budget_engagements e ON l.engagement_id = e.id
  WHERE e.budget_line_id = v_budget_line_id
    AND r.statut NOT IN ('annule', 'brouillon', 'rejete');

  -- Mettre a jour total_paye sur la ligne budgetaire
  UPDATE budget_lines
  SET total_paye = v_total_paye,
      updated_at = now()
  WHERE id = v_budget_line_id;

  -- Log dans budget_history
  IF TG_OP = 'INSERT' THEN
    INSERT INTO budget_history (
      budget_line_id, event_type, delta,
      ref_id, ref_code, commentaire, created_by
    ) VALUES (
      v_budget_line_id, 'reglement', v_record.montant,
      v_record.id, v_record.numero,
      'Reglement enregistre: ' || v_record.numero,
      v_record.created_by
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.statut IS DISTINCT FROM NEW.statut THEN
    INSERT INTO budget_history (
      budget_line_id, event_type, delta,
      ref_id, ref_code, commentaire, created_by
    ) VALUES (
      v_budget_line_id,
      CASE
        WHEN NEW.statut IN ('annule', 'rejete') THEN 'reglement_annule'
        ELSE 'reglement_update'
      END,
      CASE
        WHEN NEW.statut IN ('annule', 'rejete') THEN -v_record.montant
        ELSE v_record.montant
      END,
      v_record.id, v_record.numero,
      CASE
        WHEN NEW.statut = 'annule' THEN 'Reglement annule - credits liberes'
        WHEN NEW.statut = 'rejete' THEN 'Reglement rejete - credits liberes'
        ELSE 'Reglement mis a jour: ' || v_record.numero
      END,
      v_record.created_by
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO budget_history (
      budget_line_id, event_type, delta,
      ref_id, ref_code, commentaire, created_by
    ) VALUES (
      v_budget_line_id, 'reglement_supprime', -v_record.montant,
      v_record.id, v_record.numero,
      'Reglement supprime: ' || v_record.numero,
      v_record.created_by
    );
  END IF;

  -- Verifier si le dossier doit etre solde (seulement sur INSERT/UPDATE avec statut actif)
  IF TG_OP IN ('INSERT', 'UPDATE') AND v_dossier_id IS NOT NULL THEN
    -- Calculer le total engage et paye pour ce dossier
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
          AND r.statut NOT IN ('annule', 'brouillon', 'rejete')
      ) r_total ON true
    WHERE e.dossier_id = v_dossier_id
      AND e.statut = 'valide';

    -- Si totalement paye, cloturer le dossier
    IF v_total_paye >= v_total_engage AND v_total_engage > 0 THEN
      UPDATE dossiers
      SET statut_global = 'solde',
          statut_paiement = 'solde',
          etape_courante = 'reglement',
          montant_paye = v_total_paye,
          date_cloture = CURRENT_DATE,
          updated_at = now()
      WHERE id = v_dossier_id;

      -- Resoudre la tache workflow si elle existe
      UPDATE workflow_tasks
      SET status = 'completed',
          completed_at = now(),
          completed_by = v_record.created_by
      WHERE entity_type = 'reglement'
        AND entity_id = v_ordonnancement_id
        AND status = 'pending';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger: now fires on INSERT, UPDATE, and DELETE
DROP TRIGGER IF EXISTS trg_update_budget_on_reglement ON reglements;
CREATE TRIGGER trg_update_budget_on_reglement
AFTER INSERT OR UPDATE OR DELETE ON reglements
FOR EACH ROW
EXECUTE FUNCTION update_budget_and_close_dossier_on_reglement();

COMMENT ON FUNCTION public.update_budget_and_close_dossier_on_reglement IS
  'Met a jour budget_lines.total_paye et clot le dossier si totalement paye. Fire sur INSERT/UPDATE/DELETE. Exclut statuts annule, brouillon et rejete.';
