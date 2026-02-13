-- ============================================================================
-- Prompt 5 Backend : Vue v_imputations_detail
-- Date: 2026-02-14
-- Description:
--   Vue dénormalisée pour le frontend du module Imputation.
--   Joint imputations + direction + créateur + note AEF + note SEF
--   + ligne budgétaire + données de consommation budget.
--
-- Colonnes adaptées aux noms réels en base :
--   directions.label (pas nom), profiles.first_name/last_name (pas full_name),
--   notes_dg.numero (pas reference), notes_sef.numero (pas reference),
--   budget_lines.label (pas libelle),
--   v_budget_disponibilite_complet pour dotation/engage/disponible
-- ============================================================================

DROP VIEW IF EXISTS v_imputations_detail CASCADE;

CREATE VIEW v_imputations_detail AS
SELECT
  -- Colonnes de imputations (noms vérifiés en base)
  i.id,
  i.reference,
  i.note_aef_id,
  i.budget_line_id,
  i.direction_id,
  i.dossier_id,
  i.exercice,
  i.montant,
  i.statut,
  i.code_imputation,
  i.objet,
  i.commentaire,
  i.motif_rejet,
  i.motif_differe,
  i.date_differe,
  i.forcer_imputation,
  i.justification_depassement,
  i.source_financement,
  i.disponible_au_moment,
  i.is_multi_ligne,
  i.is_migrated,
  i.pieces_jointes,
  i.created_by,
  i.created_at,
  i.updated_at,
  i.submitted_at,
  i.submitted_by,
  i.validated_at,
  i.validated_by,
  i.rejected_at,
  i.rejected_by,
  i.differed_at,
  i.differed_by,

  -- Direction
  d.label   AS direction_nom,
  d.code    AS direction_code,
  d.sigle   AS direction_sigle,

  -- Créateur (CB / agent qui a fait l'imputation)
  p.first_name || ' ' || p.last_name AS createur_nom,

  -- Validateur
  pv.first_name || ' ' || pv.last_name AS validateur_nom,

  -- Note AEF (notes_dg)
  na.numero         AS naef_numero,
  na.reference_pivot AS naef_reference_pivot,
  na.objet          AS naef_objet,
  na.montant_estime AS naef_montant,
  na.statut         AS naef_statut,
  na.note_sef_id    AS naef_note_sef_id,

  -- Note SEF (via notes_dg → notes_sef)
  ns.numero AS nsef_numero,
  ns.objet  AS nsef_objet,

  -- Ligne budgétaire
  bl.code   AS budget_line_code,
  bl.label  AS budget_line_libelle,

  -- Données de consommation budget (via v_budget_disponibilite_complet)
  COALESCE(vb.dotation_actuelle, 0) AS dotation,
  COALESCE(vb.total_engage, 0)      AS engage_avant,
  COALESCE(vb.disponible_net, 0)    AS disponible,

  -- Dossier
  dos.numero        AS dossier_numero,
  dos.statut_global AS dossier_statut,

  -- Nomenclatures (pour affichage code imputation décomposé)
  os.code    AS os_code,
  os.libelle AS os_libelle,
  m.code     AS mission_code,
  m.libelle  AS mission_libelle,
  act.code   AS action_code,
  act.libelle AS action_libelle,
  atv.code   AS activite_code,
  atv.libelle AS activite_libelle,
  nbe.code   AS nbe_code,
  nbe.libelle AS nbe_libelle,
  sysco.code  AS sysco_code,
  sysco.libelle AS sysco_libelle

FROM public.imputations i

-- Direction
LEFT JOIN public.directions d ON i.direction_id = d.id

-- Créateur
LEFT JOIN public.profiles p ON i.created_by = p.id

-- Validateur
LEFT JOIN public.profiles pv ON i.validated_by = pv.id

-- Note AEF
LEFT JOIN public.notes_dg na ON i.note_aef_id = na.id

-- Note SEF (via note AEF)
LEFT JOIN public.notes_sef ns ON na.note_sef_id = ns.id

-- Ligne budgétaire
LEFT JOIN public.budget_lines bl ON i.budget_line_id = bl.id

-- Consommation budget
LEFT JOIN public.v_budget_disponibilite_complet vb ON bl.id = vb.id

-- Dossier
LEFT JOIN public.dossiers dos ON i.dossier_id = dos.id

-- Nomenclatures
LEFT JOIN public.objectifs_strategiques os ON i.os_id = os.id
LEFT JOIN public.missions m ON i.mission_id = m.id
LEFT JOIN public.actions act ON i.action_id = act.id
LEFT JOIN public.activites atv ON i.activite_id = atv.id
LEFT JOIN public.nomenclature_nbe nbe ON i.nbe_id = nbe.id
LEFT JOIN public.plan_comptable_sysco sysco ON i.sysco_id = sysco.id;

-- Permissions
GRANT SELECT ON v_imputations_detail TO authenticated, anon, service_role;

-- Commentaire
COMMENT ON VIEW v_imputations_detail IS
  'Vue dénormalisée des imputations avec direction, créateur, notes AEF/SEF, '
  'budget line, consommation budget, dossier et nomenclatures. '
  'Créée par Prompt 5 Backend (2026-02-14).';
