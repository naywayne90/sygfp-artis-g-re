-- ============================================================================
-- Migration Prompt 7: Trigger montant robuste, CHECK constraints, Audit lignes
-- Date: 2026-02-16
-- Context: Prompt 7 - Robustesse calcul montant, contraintes données, historique
--
-- Changes:
--   1. RENFORCER fn_update_eb_montant_from_lignes (gestion UPDATE cross-EB)
--   2. CHECK constraints: quantite > 0, prix_unitaire >= 0, designation non vide
--   3. Audit trigger fn_audit_eb_lignes → audit_logs (entity_type='expression_besoin_ligne')
--
-- Column name note:
--   User prompt says montant_total → actual column is montant_estime
--
-- Integrity check (run after deployment, must return 0 rows):
--   SELECT eb.id, eb.numero, eb.montant_estime,
--          SUM(l.quantite * l.prix_unitaire) as calcule
--   FROM expressions_besoin eb
--   JOIN expression_besoin_lignes l ON l.expression_besoin_id = eb.id
--   GROUP BY eb.id, eb.numero, eb.montant_estime
--   HAVING eb.montant_estime != SUM(l.quantite * l.prix_unitaire);
-- ============================================================================

BEGIN;

-- =============================================
-- POINT 1: RENFORCER fn_update_eb_montant_from_lignes
-- Gestion UPDATE cross-EB (si expression_besoin_id change)
-- =============================================

CREATE OR REPLACE FUNCTION public.fn_update_eb_montant_from_lignes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total NUMERIC;
  v_eb_id UUID;
  v_old_eb_id UUID;
BEGIN
  -- Identifier l'expression_besoin_id selon l'opération
  IF TG_OP = 'DELETE' THEN
    v_eb_id := OLD.expression_besoin_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_eb_id := NEW.expression_besoin_id;
    v_old_eb_id := OLD.expression_besoin_id;
  ELSE
    v_eb_id := NEW.expression_besoin_id;
  END IF;

  -- Calculer le total des lignes pour l'EB actuel
  SELECT COALESCE(SUM(quantite * prix_unitaire), 0)
  INTO v_total
  FROM expression_besoin_lignes
  WHERE expression_besoin_id = v_eb_id;

  -- Mettre à jour montant_estime de l'EB parent
  UPDATE expressions_besoin
  SET montant_estime = v_total,
      updated_at = now()
  WHERE id = v_eb_id;

  -- Si UPDATE a changé l'expression_besoin_id, recalculer l'ancien EB aussi
  IF TG_OP = 'UPDATE' AND v_old_eb_id IS DISTINCT FROM v_eb_id THEN
    SELECT COALESCE(SUM(quantite * prix_unitaire), 0)
    INTO v_total
    FROM expression_besoin_lignes
    WHERE expression_besoin_id = v_old_eb_id;

    UPDATE expressions_besoin
    SET montant_estime = v_total,
        updated_at = now()
    WHERE id = v_old_eb_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================
-- POINT 2: CHECK CONSTRAINTS sur expression_besoin_lignes
-- =============================================

ALTER TABLE public.expression_besoin_lignes
  ADD CONSTRAINT chk_ebl_quantite_positive CHECK (quantite > 0);

ALTER TABLE public.expression_besoin_lignes
  ADD CONSTRAINT chk_ebl_prix_unitaire_non_negatif CHECK (prix_unitaire >= 0);

ALTER TABLE public.expression_besoin_lignes
  ADD CONSTRAINT chk_ebl_designation_non_vide CHECK (designation IS NOT NULL AND LENGTH(TRIM(designation)) > 0);

-- =============================================
-- POINT 3: TRIGGER AUDIT pour expression_besoin_lignes
-- Enregistre chaque INSERT/UPDATE/DELETE dans audit_logs
-- =============================================

CREATE OR REPLACE FUNCTION public.fn_audit_eb_lignes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_eb_exercice INTEGER;
BEGIN
  -- Récupérer l'exercice de l'EB parent
  IF TG_OP = 'DELETE' THEN
    SELECT exercice INTO v_eb_exercice
    FROM expressions_besoin WHERE id = OLD.expression_besoin_id;
  ELSE
    SELECT exercice INTO v_eb_exercice
    FROM expressions_besoin WHERE id = NEW.expression_besoin_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, entity_type, entity_id, action, new_values, exercice)
    VALUES (
      auth.uid(),
      'expression_besoin_ligne',
      NEW.id,
      'create',
      jsonb_build_object(
        'expression_besoin_id', NEW.expression_besoin_id,
        'numero', NEW.numero,
        'designation', NEW.designation,
        'quantite', NEW.quantite,
        'prix_unitaire', NEW.prix_unitaire,
        'unite', NEW.unite
      ),
      v_eb_exercice
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Log seulement si des champs significatifs changent
    IF NEW.designation IS DISTINCT FROM OLD.designation
       OR NEW.quantite IS DISTINCT FROM OLD.quantite
       OR NEW.prix_unitaire IS DISTINCT FROM OLD.prix_unitaire
       OR NEW.unite IS DISTINCT FROM OLD.unite
       OR NEW.numero IS DISTINCT FROM OLD.numero THEN
      INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values, exercice)
      VALUES (
        auth.uid(),
        'expression_besoin_ligne',
        NEW.id,
        'update',
        jsonb_build_object(
          'expression_besoin_id', OLD.expression_besoin_id,
          'designation', OLD.designation,
          'quantite', OLD.quantite,
          'prix_unitaire', OLD.prix_unitaire,
          'unite', OLD.unite,
          'numero', OLD.numero
        ),
        jsonb_build_object(
          'expression_besoin_id', NEW.expression_besoin_id,
          'designation', NEW.designation,
          'quantite', NEW.quantite,
          'prix_unitaire', NEW.prix_unitaire,
          'unite', NEW.unite,
          'numero', NEW.numero
        ),
        v_eb_exercice
      );
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, exercice)
    VALUES (
      auth.uid(),
      'expression_besoin_ligne',
      OLD.id,
      'delete',
      jsonb_build_object(
        'expression_besoin_id', OLD.expression_besoin_id,
        'designation', OLD.designation,
        'quantite', OLD.quantite,
        'prix_unitaire', OLD.prix_unitaire,
        'unite', OLD.unite,
        'numero', OLD.numero
      ),
      v_eb_exercice
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_eb_lignes ON public.expression_besoin_lignes;

CREATE TRIGGER trg_audit_eb_lignes
  AFTER INSERT OR UPDATE OR DELETE ON public.expression_besoin_lignes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_eb_lignes();

COMMIT;
