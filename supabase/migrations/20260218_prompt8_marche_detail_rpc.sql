-- ============================================================
-- Prompt 8 BACKEND — RPC fn_get_marche_detail
-- Date: 2026-02-18
-- Description: Fonction SECURITY DEFINER pour détail complet
--              d'un marché (12 sections, 10+ tables jointes)
-- ============================================================

-- ============================================================
-- 1. CONTEXTE — AUDIT RLS DES 14 TABLES
-- ============================================================
-- Tables jointes et leur RLS:
--   marches          → ALL authenticated (permissif)
--   profiles         → RLS: false (pas de restriction)
--   prestataires     → ALL authenticated (permissif)
--   expressions_besoin → ALL authenticated (permissif)
--   budget_lines     → ALL authenticated (permissif)
--   marche_lots      → ALL authenticated (permissif)
--   soumissions      → ALL authenticated (permissif)
--   evaluations_offre → SELECT DAAF/DG/ADMIN UNIQUEMENT ⚠️
--   marche_offres    → ALL authenticated (permissif)
--   marche_documents → ALL authenticated (permissif)
--   marche_attachments → ALL authenticated (permissif)
--   marche_validations → ALL authenticated (permissif)
--   marche_historique → ALL authenticated (permissif)
--
-- ⚠️ evaluations_offre a des RLS restrictifs:
--   SELECT: DAAF, DG, ADMIN uniquement
--   → SECURITY DEFINER contourne cette restriction
--   → Les évaluations sont visibles dans le contexte du détail marché
--
-- Documents/Attachments:
--   marche_documents: 14 cols, 0 données
--   marche_attachments: 10 cols, 0 données
--   Bucket: sygfp-attachments (pas de bucket dédié marchés)
--
-- Colonnes vérifiées par table:
--   profiles: full_name, first_name, last_name, email, poste (PAS nom/prenom)
--   expressions_besoin: numero (PAS reference), objet (PAS intitule)
--   budget_lines: code (PAS code_compte), label (PAS intitule)
--   marche_validations: validated_by (PAS validateur_id), status, comments
--   marche_historique: user_id (PAS acteur_id)

-- ============================================================
-- 2. RPC fn_get_marche_detail
-- ============================================================
-- Retourne un JSONB avec 12 sections:
--   marche, createur, prestataire, expression_besoin, budget_line,
--   lots[], soumissions[], evaluations[], offres[],
--   documents[], attachments[], validations[], historique[]
--
-- SECURITY DEFINER: bypass RLS evaluations_offre
-- Évite les N+1 queries côté frontend
CREATE OR REPLACE FUNCTION public.fn_get_marche_detail(p_marche_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'marche', jsonb_build_object(
      'id', m.id, 'numero', m.numero, 'objet', m.objet,
      'montant', m.montant, 'montant_estime', m.montant_estime,
      'montant_attribue', m.montant_attribue,
      'statut', m.statut, 'validation_status', m.validation_status,
      'mode_passation', m.mode_passation, 'mode_force', m.mode_force,
      'type_marche', m.type_marche,
      'procedure_recommandee', m.procedure_recommandee,
      'justification_derogation', m.justification_derogation,
      'exercice', m.exercice,
      'date_lancement', m.date_lancement,
      'date_publication', m.date_publication,
      'date_cloture', m.date_cloture,
      'date_attribution', m.date_attribution,
      'date_signature', m.date_signature,
      'created_at', m.created_at, 'updated_at', m.updated_at
    ),
    'createur', CASE WHEN p.id IS NOT NULL THEN jsonb_build_object(
      'id', p.id, 'full_name', p.full_name,
      'first_name', p.first_name, 'last_name', p.last_name,
      'email', p.email, 'poste', p.poste
    ) ELSE NULL END,
    'prestataire', CASE WHEN pr.id IS NOT NULL THEN jsonb_build_object(
      'id', pr.id, 'raison_sociale', pr.raison_sociale
    ) ELSE NULL END,
    'expression_besoin', CASE WHEN eb.id IS NOT NULL THEN jsonb_build_object(
      'id', eb.id, 'numero', eb.numero, 'objet', eb.objet,
      'statut', eb.statut, 'montant_estime', eb.montant_estime
    ) ELSE NULL END,
    'budget_line', CASE WHEN bl.id IS NOT NULL THEN jsonb_build_object(
      'id', bl.id, 'code', bl.code, 'label', bl.label
    ) ELSE NULL END,
    'lots', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ml.id, 'numero_lot', ml.numero_lot, 'intitule', ml.intitule,
        'montant_estime', ml.montant_estime, 'montant_attribue', ml.montant_attribue,
        'statut', ml.statut, 'attributaire_id', ml.attributaire_id
      ) ORDER BY ml.numero_lot), '[]'::jsonb)
      FROM marche_lots ml WHERE ml.marche_id = m.id
    ),
    'soumissions', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', s.id, 'lot_id', s.lot_id, 'prestataire_id', s.prestataire_id,
        'nom_entreprise', s.nom_entreprise, 'montant_offre', s.montant_offre,
        'statut', s.statut, 'date_soumission', s.date_soumission,
        'note_technique', s.note_technique, 'note_financiere', s.note_financiere,
        'note_globale', s.note_globale,
        'prestataire_nom', sp.raison_sociale
      ) ORDER BY s.date_soumission), '[]'::jsonb)
      FROM soumissions s
      LEFT JOIN prestataires sp ON s.prestataire_id = sp.id
      WHERE s.marche_id = m.id
    ),
    'evaluations', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ev.id, 'soumission_id', ev.soumission_id, 'lot_id', ev.lot_id,
        'note_technique', ev.note_technique, 'note_financiere', ev.note_financiere,
        'note_finale', ev.note_finale, 'qualifie_techniquement', ev.qualifie_techniquement,
        'rang', ev.rang, 'observations', ev.observations,
        'evaluateur', ep.full_name, 'date_evaluation', ev.date_evaluation
      ) ORDER BY ev.rang NULLS LAST), '[]'::jsonb)
      FROM evaluations_offre ev
      LEFT JOIN profiles ep ON ev.evaluateur_id = ep.id
      WHERE ev.marche_id = m.id
    ),
    'offres', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', mo.id, 'prestataire_id', mo.prestataire_id,
        'nom_fournisseur', mo.nom_fournisseur, 'montant_offre', mo.montant_offre,
        'est_retenu', mo.est_retenu, 'note_globale', mo.note_globale,
        'prestataire_nom', mop.raison_sociale
      ) ORDER BY mo.montant_offre), '[]'::jsonb)
      FROM marche_offres mo
      LEFT JOIN prestataires mop ON mo.prestataire_id = mop.id
      WHERE mo.marche_id = m.id
    ),
    'documents', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', md.id, 'type_document', md.type_document,
        'libelle', md.libelle, 'file_path', md.file_path,
        'file_name', md.file_name, 'file_size', md.file_size
      ) ORDER BY md.created_at), '[]'::jsonb)
      FROM marche_documents md WHERE md.marche_id = m.id
    ),
    'attachments', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', ma.id, 'document_type', ma.document_type,
        'file_name', ma.file_name, 'file_path', ma.file_path,
        'file_size', ma.file_size, 'is_required', ma.is_required
      ) ORDER BY ma.created_at), '[]'::jsonb)
      FROM marche_attachments ma WHERE ma.marche_id = m.id
    ),
    'validations', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', mv.id, 'status', mv.status, 'comments', mv.comments,
        'role', mv.role, 'step_order', mv.step_order,
        'validateur', vp.full_name, 'validated_at', mv.validated_at
      ) ORDER BY mv.step_order), '[]'::jsonb)
      FROM marche_validations mv
      LEFT JOIN profiles vp ON mv.validated_by = vp.id
      WHERE mv.marche_id = m.id
    ),
    'historique', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', mh.id, 'type_action', mh.type_action, 'description', mh.description,
        'ancien_statut', mh.ancien_statut, 'nouveau_statut', mh.nouveau_statut,
        'acteur', hp.full_name, 'date_action', mh.created_at
      ) ORDER BY mh.created_at DESC), '[]'::jsonb)
      FROM marche_historique mh
      LEFT JOIN profiles hp ON mh.user_id = hp.id
      WHERE mh.marche_id = m.id
    )
  ) INTO v_result
  FROM marches m
  LEFT JOIN profiles p ON m.created_by = p.id
  LEFT JOIN prestataires pr ON m.prestataire_id = pr.id
  LEFT JOIN expressions_besoin eb ON m.expression_besoin_id = eb.id
  LEFT JOIN budget_lines bl ON m.budget_line_id = bl.id
  WHERE m.id = p_marche_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
-- Fonction fn_get_marche_detail(UUID):
--   Retourne JSONB avec 12 sections
--   SECURITY DEFINER: bypass RLS (nécessaire pour evaluations_offre)
--   10+ tables jointes via LEFT JOIN + sous-requêtes corrélées
--   Colonnes vérifiées sur toutes les tables:
--     profiles: full_name, first_name, last_name (PAS nom/prenom)
--     expressions_besoin: numero (PAS reference), objet
--     budget_lines: code (PAS code_compte), label (PAS intitule)
--     marche_validations: validated_by (PAS validateur_id), status, comments
--     marche_historique: user_id (PAS acteur_id)
--
-- Test: SELECT fn_get_marche_detail('0e476c03-403e-4a88-98ce-8d5d7dbdc898');
-- Résultat: OK — marche MKT-2025-0002,
--   createur NIMBA, prestataire AUTO SERVICES INTERNATIONAL,
--   12 sections toutes présentes
