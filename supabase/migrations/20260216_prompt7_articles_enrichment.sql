-- ============================================================
-- Prompt 7: Enrichir la gestion des articles et les calculs
-- ============================================================

-- 1a. Trigger BEFORE UPDATE : recalcul montant_estime depuis JSONB liste_articles
CREATE OR REPLACE FUNCTION fn_recalc_eb_montant_from_jsonb()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  article jsonb;
  total numeric := 0;
  qte numeric;
  pu numeric;
  correct_pt numeric;
BEGIN
  -- Only fire when liste_articles actually changes
  IF NEW.liste_articles IS NOT DISTINCT FROM OLD.liste_articles THEN
    RETURN NEW;
  END IF;

  -- If liste_articles is null or not an array, leave montant_estime as-is
  IF NEW.liste_articles IS NULL OR jsonb_typeof(NEW.liste_articles) != 'array' THEN
    RETURN NEW;
  END IF;

  -- Iterate JSONB array: validate integrity and compute total
  FOR article IN SELECT jsonb_array_elements(NEW.liste_articles)
  LOOP
    qte := COALESCE((article->>'quantite')::numeric, 0);
    pu  := COALESCE((article->>'prix_unitaire')::numeric, 0);
    correct_pt := qte * pu;

    -- Fix prix_total if incorrect
    IF COALESCE((article->>'prix_total')::numeric, 0) != correct_pt THEN
      article := jsonb_set(article, '{prix_total}', to_jsonb(correct_pt));
    END IF;

    total := total + correct_pt;
  END LOOP;

  -- Rebuild the array with corrected prix_total values
  NEW.liste_articles := (
    SELECT jsonb_agg(
      jsonb_set(
        elem,
        '{prix_total}',
        to_jsonb(
          COALESCE((elem->>'quantite')::numeric, 0) *
          COALESCE((elem->>'prix_unitaire')::numeric, 0)
        )
      )
    )
    FROM jsonb_array_elements(NEW.liste_articles) AS elem
  );

  -- Update montant_estime
  NEW.montant_estime := total;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, then create
DROP TRIGGER IF EXISTS trg_recalc_eb_montant_jsonb ON expressions_besoin;
CREATE TRIGGER trg_recalc_eb_montant_jsonb
  BEFORE UPDATE ON expressions_besoin
  FOR EACH ROW
  EXECUTE FUNCTION fn_recalc_eb_montant_from_jsonb();


-- 1b. Extend audit function for article modifications
CREATE OR REPLACE FUNCTION fn_audit_expression_besoin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  action_type text;
  details_json jsonb;
  old_count int;
  new_count int;
  old_total numeric;
  new_total numeric;
BEGIN
  -- Detect article changes
  IF TG_OP = 'UPDATE' AND NEW.liste_articles IS DISTINCT FROM OLD.liste_articles THEN
    action_type := 'update_articles';

    old_count := CASE
      WHEN OLD.liste_articles IS NOT NULL AND jsonb_typeof(OLD.liste_articles) = 'array'
      THEN jsonb_array_length(OLD.liste_articles) ELSE 0 END;

    new_count := CASE
      WHEN NEW.liste_articles IS NOT NULL AND jsonb_typeof(NEW.liste_articles) = 'array'
      THEN jsonb_array_length(NEW.liste_articles) ELSE 0 END;

    old_total := COALESCE((
      SELECT SUM(COALESCE((elem->>'prix_total')::numeric, 0))
      FROM jsonb_array_elements(COALESCE(OLD.liste_articles, '[]'::jsonb)) AS elem
    ), 0);

    new_total := COALESCE((
      SELECT SUM(COALESCE((elem->>'prix_total')::numeric, 0))
      FROM jsonb_array_elements(COALESCE(NEW.liste_articles, '[]'::jsonb)) AS elem
    ), 0);

    details_json := jsonb_build_object(
      'articles_count_before', old_count,
      'articles_count_after', new_count,
      'articles_total_before', old_total,
      'articles_total_after', new_total
    );

    INSERT INTO audit_logs (entity_type, entity_id, action, new_values, user_id)
    VALUES (
      'expression_besoin',
      NEW.id,
      action_type,
      details_json,
      COALESCE(auth.uid(), NEW.created_by)
    );
  END IF;

  -- Detect status changes
  IF TG_OP = 'UPDATE' AND NEW.statut IS DISTINCT FROM OLD.statut THEN
    action_type := 'status_change';
    details_json := jsonb_build_object(
      'old_status', OLD.statut,
      'new_status', NEW.statut
    );

    INSERT INTO audit_logs (entity_type, entity_id, action, new_values, user_id)
    VALUES (
      'expression_besoin',
      NEW.id,
      action_type,
      details_json,
      COALESCE(auth.uid(), NEW.created_by)
    );
  END IF;

  -- INSERT audit
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (entity_type, entity_id, action, new_values, user_id)
    VALUES (
      'expression_besoin',
      NEW.id,
      'create',
      jsonb_build_object('statut', NEW.statut, 'objet', NEW.objet),
      COALESCE(auth.uid(), NEW.created_by)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, then create
DROP TRIGGER IF EXISTS trg_audit_expression_besoin ON expressions_besoin;
CREATE TRIGGER trg_audit_expression_besoin
  AFTER INSERT OR UPDATE ON expressions_besoin
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_expression_besoin();
