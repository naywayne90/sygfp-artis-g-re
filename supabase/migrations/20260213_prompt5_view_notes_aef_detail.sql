-- =============================================================================
-- Migration: Prompt 5 - Vue v_notes_aef_detail
-- =============================================================================
-- Date: 2026-02-13
--
-- Cree une vue qui JOIN notes_dg avec toutes les tables liees
-- pour faciliter l'affichage du panneau de detail AEF.
--
-- JOINs:
--   - directions (via direction_id) -> sigle, label
--   - profiles (via created_by)     -> creator name
--   - profiles (via validated_by)   -> validator name
--   - profiles (via imputed_by)     -> imputer name
--   - profiles (via differe_by)     -> differer name
--   - profiles (via rejected_by)    -> rejecter name
--   - profiles (via submitted_by)   -> submitter name
--   - notes_sef (via note_sef_id)   -> SEF numero, objet, reference_pivot
--   - budget_lines (via budget_line_id) -> code, label, disponible
-- =============================================================================

-- Supprimer si existe deja
DROP VIEW IF EXISTS v_notes_aef_detail;

CREATE VIEW v_notes_aef_detail AS
SELECT
  -- Notes DG (toutes colonnes principales)
  n.id,
  n.numero,
  n.reference_pivot,
  n.objet,
  n.contenu,
  n.montant_estime,
  n.montant_autorise,
  n.priorite,
  n.statut,
  n.type_depense,
  n.exercice,
  n.origin,
  n.is_direct_aef,
  n.justification,
  n.created_at,
  n.updated_at,
  n.submitted_at,
  n.validated_at,
  n.imputed_at,
  n.rejected_at,
  n.motif_differe,
  n.date_differe,
  n.deadline_correction,
  n.rejection_reason,
  n.budget_bloque,
  n.budget_bloque_raison,
  n.depassement_budget,
  n.montant_depassement,
  n.budget_disponible_soumission,
  n.justification_depassement,
  n.is_migrated,
  n.dossier_id,

  -- FK IDs
  n.direction_id,
  n.created_by,
  n.validated_by,
  n.imputed_by,
  n.differe_by,
  n.rejected_by,
  n.submitted_by,
  n.note_sef_id,
  n.budget_line_id,
  n.beneficiaire_id,
  n.redacteur_id,
  n.initiales_redacteur,

  -- Direction
  d.sigle   AS direction_sigle,
  d.label   AS direction_label,
  d.code    AS direction_code,

  -- Createur
  pc.first_name AS creator_first_name,
  pc.last_name  AS creator_last_name,
  pc.email      AS creator_email,

  -- Validateur
  pv.first_name AS validator_first_name,
  pv.last_name  AS validator_last_name,

  -- Imputeur
  pi.first_name AS imputer_first_name,
  pi.last_name  AS imputer_last_name,

  -- Differeur
  pd.first_name AS differer_first_name,
  pd.last_name  AS differer_last_name,

  -- Rejecteur
  pr.first_name AS rejecter_first_name,
  pr.last_name  AS rejecter_last_name,

  -- Soumetteur
  ps.first_name AS submitter_first_name,
  ps.last_name  AS submitter_last_name,

  -- Note SEF liee
  sef.numero           AS sef_numero,
  sef.objet            AS sef_objet,
  sef.statut           AS sef_statut,
  sef.reference_pivot  AS sef_reference_pivot,

  -- Ligne budgetaire
  bl.code              AS budget_code,
  bl.label             AS budget_label,
  bl.dotation_initiale AS budget_dotation,
  bl.disponible_calcule AS budget_disponible

FROM notes_dg n
  LEFT JOIN directions  d   ON n.direction_id = d.id
  LEFT JOIN profiles    pc  ON n.created_by   = pc.id
  LEFT JOIN profiles    pv  ON n.validated_by  = pv.id
  LEFT JOIN profiles    pi  ON n.imputed_by    = pi.id
  LEFT JOIN profiles    pd  ON n.differe_by    = pd.id
  LEFT JOIN profiles    pr  ON n.rejected_by   = pr.id
  LEFT JOIN profiles    ps  ON n.submitted_by  = ps.id
  LEFT JOIN notes_sef   sef ON n.note_sef_id   = sef.id
  LEFT JOIN budget_lines bl ON n.budget_line_id = bl.id;

-- Commentaire
COMMENT ON VIEW v_notes_aef_detail IS
'Vue denormalisee pour le panneau de detail AEF.
JOIN notes_dg + directions + profiles (x6) + notes_sef + budget_lines.';

-- Grant acces pour authenticated (PostgREST)
GRANT SELECT ON v_notes_aef_detail TO authenticated;
GRANT SELECT ON v_notes_aef_detail TO anon;
