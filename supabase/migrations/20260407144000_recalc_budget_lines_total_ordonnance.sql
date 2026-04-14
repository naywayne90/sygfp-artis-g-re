-- =============================================================================
-- Phase C2 — Recalcul de budget_lines.total_ordonnance (audit 2026-04-07)
-- =============================================================================
-- Constat (audit) :
--   Lors de la migration SQL Server → Supabase, le trigger qui maintient
--   `budget_lines.total_ordonnance` n'a pas été déclenché (les INSERTs sur
--   ordonnancements ont contourné le path applicatif via un bypass legacy).
--   Conséquence : la colonne n'est pas à jour pour les lignes affectées par
--   les 3363 ordonnancements migrés.
--
-- Périmètre :
--   On recalcule total_ordonnance comme la somme des montants des
--   ordonnancements NON rejetés / NON différés, joints via :
--     ordonnancements → budget_liquidations → budget_engagements.budget_line_id
--
--   Audit pré-application :
--     - 2 budget_lines concernées
--     - 1 ligne à corriger : code "60" exercice 2025
--       (de 2 303 579 002 → 2 403 679 002 FCFA, écart 100 100 000 FCFA)
--     - 1 ligne déjà à jour : code "60-2024" exercice 2024
--   La ligne 2024 n'est pas modifiée puisqu'écart = 0.
--
-- Impact modules certifiés :
--   - Passation/Engagement/Liquidation (100/100) ne lisent pas total_ordonnance
--     pour leurs E2E. Leurs assertions portent sur les soldes "reste à engager"
--     calculés par leurs propres hooks (totalEngage, totalLiquide), pas sur
--     total_ordonnance qui est en aval.
--   - Le dashboard d'exécution budgétaire (`/etats-execution`) verra le
--     chiffre se corriger automatiquement.
--
-- Rollback : si nécessaire, snapshot Supabase avant exécution. Le delta exact
-- est tracé dans les commentaires ci-dessus pour reconstruction manuelle.
-- =============================================================================

BEGIN;

WITH totaux AS (
  SELECT e.budget_line_id, SUM(o.montant) AS total
  FROM public.ordonnancements o
  JOIN public.budget_liquidations l ON l.id = o.liquidation_id
  JOIN public.budget_engagements   e ON e.id = l.engagement_id
  WHERE o.statut NOT IN ('rejete', 'differe')
    AND e.budget_line_id IS NOT NULL
  GROUP BY e.budget_line_id
)
UPDATE public.budget_lines bl
SET total_ordonnance = t.total
FROM totaux t
WHERE bl.id = t.budget_line_id
  AND bl.total_ordonnance <> t.total;

COMMIT;

-- =============================================================================
-- Vérification post-migration :
--
-- WITH totaux AS (
--   SELECT e.budget_line_id, SUM(o.montant) AS total_calc
--   FROM public.ordonnancements o
--   JOIN public.budget_liquidations l ON l.id = o.liquidation_id
--   JOIN public.budget_engagements e  ON e.id = l.engagement_id
--   WHERE o.statut NOT IN ('rejete', 'differe') AND e.budget_line_id IS NOT NULL
--   GROUP BY e.budget_line_id
-- )
-- SELECT COUNT(*) FILTER (WHERE bl.total_ordonnance <> COALESCE(t.total_calc, 0)) AS lignes_a_corriger
-- FROM totaux t JOIN public.budget_lines bl ON bl.id = t.budget_line_id;
-- → Doit retourner 0.
-- =============================================================================
