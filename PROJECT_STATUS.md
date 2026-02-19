# INVENTAIRE COMPLET DU PROJET SYGFP

**Date :** 19 fevrier 2026
**Version :** v2.0
**Branche :** main
**Dernier commit :** d24e7df (feat(passation): Prompt 11 - Edge Function generate-export)

> Ce document est la memoire permanente du projet. Si on perd tmux, ce fichier suffit a tout reprendre.

---

## RESUME EXECUTIF

| Metrique            | Valeur                                        |
| ------------------- | --------------------------------------------- |
| **Pages**           | 115                                           |
| **Composants**      | 439 fichiers / 49 modules                     |
| **Hooks**           | 165                                           |
| **Services**        | 17                                            |
| **Routes**          | 111                                           |
| **Contextes**       | 2                                             |
| **Lib modules**     | 41 fichiers / 13 sous-dossiers                |
| **Types**           | 3 fichiers + 18,220 lignes types auto-generes |
| **Edge Functions**  | 12                                            |
| **Migrations SQL**  | 253                                           |
| **Tables**          | 197                                           |
| **Vues**            | 37+ (types) / ~42 (avec vues SQL Editor)      |
| **Fonctions SQL**   | 174                                           |
| **RLS Policies**    | 621                                           |
| **Tests unitaires** | 369 (Vitest)                                  |
| **Tests E2E**       | 69 spec files (Playwright)                    |
| **Build**           | OK (24.73s)                                   |
| **TypeScript**      | 0 erreurs                                     |

---

## 1. ARCHITECTURE TECHNIQUE

```
Frontend : React 18 + TypeScript + Vite (port 8080)
UI       : Tailwind CSS + shadcn/ui (Radix)
State    : TanStack Query (React Query) + React Context
Forms    : React Hook Form + Zod
Backend  : Supabase (PostgreSQL + Auth + RLS + Edge Functions)
Tests    : Vitest (unit) + Playwright (E2E)
PDF      : jsPDF + jspdf-autotable
Excel    : ExcelJS
Storage  : Supabase Storage + Cloudflare R2
```

### Supabase

```
Project ID : tjagvgqthlibdpvztvaf
URL        : https://tjagvgqthlibdpvztvaf.supabase.co
Dashboard  : https://supabase.com/dashboard/project/tjagvgqthlibdpvztvaf
```

### GitHub

```
Repo : naywayne90/sygfp-artis-g-re
URL  : https://github.com/naywayne90/sygfp-artis-g-re
```

---

## 2. CHAINE DE DEPENSE (9 ETAPES)

```
PREPARATION                           EXECUTION
---------                             ---------
1. Note SEF                           6. Engagement
2. Note AEF                           7. Liquidation
3. Imputation                         8. Ordonnancement
4. Expression de Besoin               9. Reglement
5. Passation de Marche (CERTIFIE)
```

---

## 3. FRONTEND — INVENTAIRE COMPLET

### 3.1 Pages (115 fichiers .tsx)

#### Racine (34 fichiers)

| Fichier                    | Description                  |
| -------------------------- | ---------------------------- |
| Dashboard.tsx              | Tableau de bord principal    |
| DashboardDMG.tsx           | Dashboard DMG                |
| DashboardFinancier.tsx     | Dashboard financier          |
| AlertesBudgetaires.tsx     | Alertes budget               |
| Alertes.tsx                | Alertes generales            |
| Engagements.tsx            | Liste engagements            |
| Liquidations.tsx           | Liste liquidations           |
| Ordonnancements.tsx        | Liste ordonnancements        |
| Reglements.tsx             | Liste reglements             |
| Marches.tsx                | Liste marches                |
| NotesSEF.tsx               | Liste notes SEF              |
| NoteSEFDetail.tsx          | Detail note SEF              |
| NotesAEF.tsx               | Liste notes AEF              |
| NoteAEFDetail.tsx          | Detail note AEF              |
| NotesDirectionGenerale.tsx | Notes DG                     |
| ValidationNotesSEF.tsx     | Validation SEF               |
| ValidationNotesAEF.tsx     | Validation AEF               |
| ValidationNotesDG.tsx      | Validation DG                |
| VerificationNoteDG.tsx     | Verification DG (token)      |
| VerifyDocument.tsx         | Verification document (hash) |
| NoteCanvasPage.tsx         | Editeur canvas               |
| SuiviDossiers.tsx          | Suivi dossiers               |
| DossierDetails.tsx         | Detail dossier               |
| EtatsExecution.tsx         | Etats execution              |
| EspaceDirection.tsx        | Espace direction             |
| MonProfil.tsx              | Profil utilisateur           |
| Notifications.tsx          | Centre notifications         |
| Recherche.tsx              | Recherche globale            |
| WorkflowTasks.tsx          | Taches workflow              |
| ScanningEngagement.tsx     | Scan QR engagement           |
| ScanningLiquidation.tsx    | Scan QR liquidation          |
| SelectExercice.tsx         | Selection exercice           |
| NoOpenExercise.tsx         | Pas d'exercice ouvert        |
| AdminDashboardFallback.tsx | Fallback admin               |
| ComingSoon.tsx             | Page placeholder             |
| NotFound.tsx               | 404                          |
| TestNonRegression.tsx      | Tests non-regression         |

#### Admin (29 fichiers dans `src/pages/admin/`)

| Fichier                       | Description                |
| ----------------------------- | -------------------------- |
| GestionUtilisateurs.tsx       | Gestion utilisateurs       |
| GestionRoles.tsx              | Gestion roles              |
| GestionAutorisations.tsx      | Autorisations              |
| GestionDelegations.tsx        | Delegations                |
| GestionExercices.tsx          | Exercices budgetaires      |
| GestionDoublons.tsx           | Detection doublons         |
| GestionLibellesBudget.tsx     | Libelles budget            |
| GestionAnomalies.tsx          | Anomalies                  |
| Interims.tsx                  | Interims                   |
| ParametresSysteme.tsx         | Parametres systeme         |
| ParametresExercice.tsx        | Parametres exercice        |
| ParametresProgrammatiques.tsx | Parametres programmatiques |
| CompteursReferences.tsx       | Compteurs references       |
| CompteBancaires.tsx           | Comptes bancaires          |
| OriginesFonds.tsx             | Origines des fonds         |
| ImportBudgetAdmin.tsx         | Import budget              |
| JournalAudit.tsx              | Journal audit              |
| ArchitectureSYGFP.tsx         | Architecture SYGFP         |
| DictionnaireVariables.tsx     | Dictionnaire variables     |
| ReferentielCodification.tsx   | Codification               |
| SecteursActivite.tsx          | Secteurs activite          |
| DocumentationModules.tsx      | Documentation modules      |
| MatriceRACI.tsx               | Matrice RACI               |
| ChecklistProduction.tsx       | Checklist production       |
| LiensLambda.tsx               | Liens Lambda               |
| WorkflowAdmin.tsx             | Admin workflow             |
| NotificationSettings.tsx      | Config notifications       |
| HistoriqueLibelles.tsx        | Historique libelles        |

#### Auth (3 fichiers)

- LoginPage.tsx, ForgotPasswordPage.tsx, ResetPasswordPage.tsx

#### Execution (8 fichiers)

- DashboardExecution.tsx, DashboardDGPage.tsx, DashboardDirectionPage.tsx
- ExpressionBesoin.tsx, ImputationPage.tsx
- PassationMarche.tsx, PassationApprobation.tsx, TaskExecutionPage.tsx

#### DG (2 fichiers)

- NotesAValider.tsx, ValiderNoteDG.tsx

#### Planification (16 fichiers)

- PlanificationBudgetaire.tsx, PlanificationPhysique.tsx, StructureBudgetaire.tsx
- PlanTravail.tsx, Virements.tsx, ImportExport.tsx
- DocumentationImport.tsx, HistoriqueImports.tsx, AideImportBudget.tsx
- NotificationsBudgetaires.tsx, FeuilleRouteImportPage.tsx
- RoadmapDashboard.tsx, RoadmapDirection.tsx, RoadmapSubmissionsPage.tsx
- ProjetsList.tsx, ProjetDetail.tsx

#### Gestion Taches (4 fichiers)

- EtatExecutionTachesPage.tsx, TachesRealiseesPage.tsx
- TachesDiffereesPage.tsx, MajFeuillesRoutePage.tsx

#### Programmatique (4 fichiers)

- ChargerBudget.tsx, ListeBudget.tsx, MiseAJourBudget.tsx, Reamenagement.tsx

#### Budget (1 fichier)

- ReamenementsImputations.tsx

#### Tresorerie (5 fichiers)

- GestionTresorerie.tsx, ApprovisionnementsBanque.tsx, ApprovisionnementsCaisse.tsx
- MouvementsBanque.tsx, MouvementsCaisse.tsx

#### Contractualisation (5 fichiers)

- Prestataires.tsx, Contrats.tsx, ComptabiliteMatiere.tsx
- DemandePrestataire.tsx, ValidationPrestataires.tsx

#### Approvisionnement (1) / Recettes (1)

- Approvisionnement.tsx, DeclarationRecette.tsx

### 3.2 Composants (439 fichiers / 49 modules)

| Module               | Fichiers | Description                                                   |
| -------------------- | -------- | ------------------------------------------------------------- |
| ui                   | 49       | shadcn/ui + Radix (boutons, dialogues, tables...)             |
| budget               | 32       | Gestion budget, import, transferts, validation                |
| dashboard            | 26       | Widgets et layouts tableaux de bord                           |
| notes-sef            | 22       | Notes SEF (formulaire, liste, export, validation)             |
| passation-marche     | 16       | Passation marche (lots, soumissionnaires, evaluation COJO)    |
| shared               | 16       | Composants reutilisables (NotesPagination, formatCurrency...) |
| workflow             | 15       | Machine a etats, transitions, paniers                         |
| dossier              | 14       | Suivi dossiers, timeline, chaine                              |
| expression-besoin    | 12       | Expressions besoin, articles, validation                      |
| imputation           | 12       | Imputations, detail, validation                               |
| engagement           | 11       | Engagement (formulaire, detail, validation, timeline)         |
| liquidation          | 11       | Liquidation (formulaire, detail, validation)                  |
| ordonnancement       | 11       | Ordonnancement (signatures, validation)                       |
| marches              | 10       | Marches (liste, detail, documents)                            |
| notifications        | 10       | Notifications (centre, badges, realtime)                      |
| prestataires         | 10       | Prestataires (CRUD, validation, documents)                    |
| notes-aef            | 9        | Notes AEF                                                     |
| canvas               | 9        | Editeur canvas notes                                          |
| attachments          | 9        | Gestion pieces jointes                                        |
| planification        | 9        | Planification budgetaire                                      |
| import-export        | 8        | Import/export donnees                                         |
| reglement            | 8        | Reglements, paiements partiels                                |
| audit                | 6        | Journal audit, trail                                          |
| notes-dg-officielles | 6        | Notes DG officielles                                          |
| etats                | 6        | Etats d'execution                                             |
| auth                 | 5        | Authentification                                              |
| exercice             | 5        | Selection exercice, guard                                     |
| approvisionnement    | 5        | Approvisionnement                                             |
| validation           | 5        | Validation generique                                          |
| codification         | 4        | Codification reference                                        |
| coherence            | 4        | Controle coherence                                            |
| dmg                  | 4        | Dashboard DMG                                                 |
| export               | 4        | Export generique                                              |
| ged                  | 4        | GED documents                                                 |
| interim              | 4        | Gestion interims                                              |
| liquidations         | 4        | Liquidations specifiques                                      |
| qrcode               | 4        | QR code scan/affichage                                        |
| search               | 4        | Recherche                                                     |
| tresorerie           | 4        | Tresorerie                                                    |
| layout               | 3        | Layouts (sidebar, header)                                     |
| notification         | 3        | Notification UI                                               |
| contrats             | 2        | Contrats                                                      |
| execution            | 2        | Execution                                                     |
| recettes             | 2        | Recettes                                                      |
| command-palette      | 1        | Palette de commandes                                          |
| direction            | 1        | Direction                                                     |
| help                 | 1        | Aide                                                          |
| admin                | 15       | Admin (composants specifiques)                                |
| roadmap              | 1        | Roadmap                                                       |

### 3.3 Hooks (165 fichiers)

**Categories principales :**

| Categorie           | Hooks cles                                                                                                                                                          | Nb approx |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Donnees metier      | useNotesSEF, useNotesAEF, useEngagements, useLiquidations, useOrdonnancements, useReglements, useMarches, useExpressionsBesoin, useImputations, usePassationsMarche | 25        |
| Budget              | useBudgetLines, useBudgetTransfers, useBudgetImport, useBudgetAvailability, useBudgetMovements, useBudgetAlerts, useBudgetNotifications                             | 15        |
| Export/PDF          | useExportExcel, useExportNoteSEFPdf, useNoteDGPdf, usePassationExport, usePassationMarcheExport, useStandardExport, useGenerateReport                               | 13        |
| Validation/Workflow | useValidation, useValidationDG, useWorkflowEngine, useWorkflowDossier, useWorkflowTasks, useWorkflowTransitions                                                     | 12        |
| RBAC/Permissions    | useRBAC, useRBACHelpers, useRBACEnforcer, usePermissions, useDelegations, useInterim, useInterimPermissions, useSeparationOfDuties                                  | 11        |
| Dashboard           | useDashboardData, useDashboardStats, useDMGDashboard, useExecutionDashboard, usePaymentKPIs, useHRDashboardData                                                     | 12        |
| Notes specifiques   | useNotesSEFList, useNoteSEFDetail, useNoteSEFAutosave, useNotesAEFList, useNoteAEFDetail, useNotesDirectionGenerale, useNoteCanvas                                  | 25        |
| Fichiers/Storage    | useAttachments, useFileUpload, useDocumentUpload, useR2Storage, useMarcheDocuments                                                                                  | 8         |
| Referentiels        | useReferentiels, useARTIReference, useCodification, useFundingSources, useSecteursActivite                                                                          | 15        |
| Notifications       | useNotifications, useNotificationsRealtime, useNotificationsEnhanced, useNotificationsAuto                                                                          | 6         |
| Autres              | useBreadcrumbs, useSidebarBadges, useQRCode, useExerciceFilter, useDoublonsDetection                                                                                | 23        |

### 3.4 Services (17 fichiers)

| Service                               | Description                      |
| ------------------------------------- | -------------------------------- |
| attachmentService.ts                  | Operations pieces jointes        |
| expressionBesoinArticlesPdfService.ts | PDF articles EB                  |
| migratedFilesService.ts               | Fichiers migres                  |
| noteDGPdfService.ts                   | PDF notes DG                     |
| noteDirectionDocxService.ts           | DOCX notes direction             |
| noteDirectionPdfService.ts            | PDF notes direction              |
| noteSEFPdfService.ts                  | PDF notes SEF                    |
| passationExportService.ts             | Export passation (Excel/PDF/CSV) |
| pvCojoPdfService.ts                   | PV COJO PDF                      |
| r2Storage.ts                          | Cloudflare R2                    |
| storage/index.ts                      | Abstraction storage              |
| storage/localProvider.ts              | Provider local                   |
| storage/namingService.ts              | Conventions nommage              |
| storage/r2Provider.ts                 | Provider R2                      |
| storage/storageFactory.ts             | Factory pattern                  |
| storage/supabaseProvider.ts           | Provider Supabase                |
| storage/types.ts                      | Types storage                    |

### 3.5 Lib (41 fichiers / 13 sous-dossiers)

| Module         | Fichiers | Cle                                                                 |
| -------------- | -------- | ------------------------------------------------------------------- |
| rbac/          | 4        | config, permissions, types, index                                   |
| workflow/      | 5        | workflowEngine, transitions, paniers, statuts, index                |
| pdf/           | 5        | pdfHeader, pdfFooter, pdfStyles, generateNotePDF, index             |
| excel/         | 4        | excelFormats, excelStyles, generateExcel, index                     |
| export/        | 4        | export-branding, export-service, export-templates, index            |
| notes-sef/     | 6        | constants, helpers, notesSefService, referenceService, types, index |
| notes-aef/     | 3        | constants, notesAefService, types                                   |
| config/        | 3        | rbac-config, document-permissions, sygfp-constants                  |
| validations/   | 1        | notesSchemas (Zod)                                                  |
| templates/     | 1        | feuilleRouteTemplate                                                |
| feature-flags/ | 1        | flags                                                               |
| errors/        | 1        | messages                                                            |
| budget/        | 1        | imputation-utils                                                    |
| (racine)       | 3        | utils.ts, qrcode-utils.ts, r2-storage.ts                            |

### 3.6 Contextes (2 fichiers)

- **ExerciceContext.tsx** : Gestion exercice budgetaire courant
- **RBACContext.tsx** : Roles, permissions, delegations, interims

### 3.7 Routes (111 chemins)

| Groupe             | Routes                                                                                                                                            | Nb  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| Auth               | /auth, /auth/forgot-password, /auth/reset-password                                                                                                | 3   |
| Selection          | /select-exercice, /no-open-exercice                                                                                                               | 2   |
| Verification       | /verification/note-dg/:token, /dg/valider/:token, /verify/:hash                                                                                   | 3   |
| Dashboard          | /, /execution/dashboard, /execution/dashboard-dg, /execution/dashboard-direction, /dashboard-dmg, /dashboard-financier                            | 6   |
| Admin              | /admin/\*                                                                                                                                         | 29  |
| Notes              | /notes-sef, /notes-sef/validation, /notes-sef/:id, /notes-aef/_, /notes-dg/_, /dg/notes-a-valider                                                 | 9   |
| Execution          | /execution/imputation, /execution/expression-besoin, /execution/passation-marche, /execution/passation-marche/approbation, /execution/scanning-\* | 6   |
| Chaine depense     | /marches, /engagements, /liquidations, /ordonnancements, /reglements                                                                              | 5   |
| Suivi              | /suivi-dossiers, /suivi-dossiers/:id, /etats-execution                                                                                            | 3   |
| Planification      | /planification/\*                                                                                                                                 | 16  |
| Gestion taches     | /gestion-taches/\*                                                                                                                                | 3   |
| Tresorerie         | /tresorerie/\*                                                                                                                                    | 5   |
| Programmatique     | /programmatique/\*                                                                                                                                | 4   |
| Budget             | /budget/reamenagements-imputations                                                                                                                | 1   |
| Contractualisation | /contractualisation/\*                                                                                                                            | 3   |
| Espace             | /espace-direction, /espace-direction/notes/:id/canvas                                                                                             | 2   |
| Divers             | /recherche, /notifications, /alertes-budgetaires, /alertes, /mon-profil, /taches, /approvisionnement, /recettes                                   | 8   |
| 404                | \*                                                                                                                                                | 1   |

---

## 4. BACKEND — INVENTAIRE COMPLET

### 4.1 Tables (197)

**Source :** `src/integrations/supabase/types.ts` (Tables section)

<details>
<summary>Liste complete des 197 tables</summary>

actions, activites, affectations_notes, alerts, archived_documents, articles, arti_reference_counters, audit_logs, avenants, budg_alert_rules, budg_alerts, budget_activities, budget_code_sequences, budget_engagements, budget_history, budget_imports, budget_kpis, budget_line_history, budget_lines, budget_liquidations, budget_movements, budget_versions, codif_variables, coherence_reports, comptes_bancaires, config_affectations, config_affectations_type_demande, contrat_attachments, contrats, contrat_sequences, credit_transfers, custom_roles, data_dictionary, delegations, demande_achat_lignes, demande_achat_sequences, demandes_achat, directions, dmg_alert_config, documents_generes, document_workflow_rules, dossier_documents, dossier_etapes, dossiers, dossier_sequences, email_templates, engagement_attachments, engagement_documents, engagement_validations, exercices_budgetaires, export_jobs, expression_besoin_attachments, expression_besoin_sequences, expression_besoin_validations, expressions_besoin, historique_libelles, import_budget_staging, import_history, import_jobs, import_logs, import_rows, import_runs, imputation_lignes, imputations, interims, inventaire_lignes, inventaires, inventaire_sequences, lambda_links, lambda_link_types, lignes_budgetaires_referentiel, liquidation_attachments, liquidation_sequences, liquidation_validations, logs_actions, lots_marche, marche_attachments, marche_documents, marche_historique, marche_lots, marche_offres, marches, marche_sequences, marche_validations, migration_staging, missions, module_documentation, module_registry, mouvements_bancaires, mouvement_sequences, mouvements_stock, natures_depense, nomenclature_nbe, note_attachments, notes_aef_history, notes_dg, notes_dg_attachments, notes_direction, notes_sef, notes_sef_attachments, notes_sef_history, notes_sef_imputations, notes_sef_pieces, notes_sef_sequences, notification_logs, notification_preferences, notification_recipients, notification_role_settings, notifications, notification_templates, objectifs_strategiques, operations_tresorerie, operation_tresorerie_sequences, ordonnancement_attachments, ordonnancement_pieces, ordonnancements, ordonnancement_sequences, ordonnancement_signatures, ordonnancement_validations, passation_marche, permission_actions, personnel_arti, plan_comptable_sysco, positions, prestataire_requests, prestataires, production_checklist, profiles, project_progress_updates, projects, projets, raci_matrix, rate_limit_qrcode, reamenagements_budgetaires, reception_attachments, reception_lignes, receptions, reception_sequences, recette_attachments, recettes, recette_sequences, ref_actions, ref_codification_rules, reference_counters, reference_sequences, ref_modules, ref_nve, ref_secteurs_activite, ref_sequences, ref_variables, reglement_attachments, reglements, reglement_sequences, regles_imputation, reminder_history, reminder_rules, required_document_types, role_permissions, sequence_counters, soumissionnaires_lot, soumissions, sous_activites, supplier_bank_accounts, supplier_documents, supplier_required_documents, system_config, system_variables_connexion, tache_attachments, tache_progress_history, taches, transfer_sequences, treasury_accounts, treasury_movements, types_demande, types_depenses, user_exercices, user_positions, user_roles, validation_hierarchy, verifications_qrcode, wf_actions, wf_conditions, wf_definitions, wf_instances, wf_roles, wf_services, wf_step_actions, wf_step_history, wf_step_permissions, wf_steps, workflow_etapes, workflow_instances, workflow_modules, workflow_statuses, workflow_tasks, workflow_transition_history, workflow_transitions

</details>

### 4.2 Vues (37+ dans types, ~42 total)

<details>
<summary>Liste des vues</summary>

**Read-only (types.ts Views section) :**
documents_index, notes_imputees_disponibles, notes_sef_audit_log, pending_tasks_by_role, prestataires_actifs, profiles_display, projects_with_financial, projets_avec_disponible, v_activite_recente, v_affectations_notes, v_alertes_dmg, v_alertes_financieres, v_budget_disponibilite, v_budget_disponibilite_complet, v_dashboard_dmg, v_dashboard_kpis, v_dossier_chaine, v_dossiers_urgents, v_engagement_stats, v_etape_delais, v_etat_caisse, v_expressions_besoin_stats, v_kpi_paiement, v_liquidations_urgentes, v_logs_actions, v_marches_stats, v_mouvements_details, v_paiements_a_venir, v_position_tresorerie, v_reamenagements_budgetaires, v_reglements_paiements, v_reglement_stats, v_stats_par_direction, v_stats_par_type_depense, v_tableau_financier, v_top_directions_imputations, v_top_os_imputations

**Vues additionnelles (SQL Editor) :**
v_budget_lines_execution, v_expressions_besoin_detail, v_imputation_chain_diagnostic, v_imputations_detail, v_notes_aef_detail, expression_besoin_stats

</details>

### 4.3 Fonctions SQL (174)

<details>
<summary>Categories de fonctions</summary>

**Generation references (~20)** : generate_arti_reference, generate_note_sef_reference_pivot, generate_note_aef_reference, generate_imputation_numero, generate_reference, generate_transfer_code, generate_unique_code, get_next_sequence, get_next_budget_code_seq, etc.

**Verification permissions (~20)** : has_role, has_permission, has_profil_fonctionnel, has_role_hierarchique, has_active_delegation, can_transition, can_validate_as_interim, can_view_note_sef, can_engage_on_budget_line, can_export_notes_sef, can_manage_dictionaries, can_qualify_supplier, can_delete_dictionary_element, check_permission_with_conditions, check_separation_of_duties, user_has_role, user_has_any_role, user_has_permission

**Budget (~15)** : check_budget_availability, check_budget_alerts, fn_verifier_budget_disponible, execute_credit_transfer, get_exercice_budget_summary, validate_budget, copy_budget_structure, get_tableau_financier

**Workflow (~15)** : advance_workflow, start_workflow, resume_workflow, get_available_transitions, execute_transition, get_workflow_status, get_workflow_config, create_workflow_task, close_workflow_task, cancel_workflow_tasks, check_marche_prerequisites

**Dashboard/Stats (~15)** : get_dashboard_data, get_dmg_dashboard_data, get_evolution_mensuelle, get_depense_summary, get_stats_paiements, get_stats_utilisateurs, get_delai_moyen_traitement, get_urgent_liquidations_count, get_urgent_liquidations_stats

**Notifications (~10)** : create_notification, create_note_sef_notification, get_notification_recipients, get_notification_summary, get_unread_notification_count, mark_notification_read, mark_all_notifications_read, send_bulk_notifications, render_notification_template, notify_imputed_directions

**Audit (~8)** : log_action, log_audit_action, log_audit_with_exercice, log_import_event, get_historique_libelle, get_libelle_effectif, get_entity_transition_history

**Import (~8)** : create_import_run, finalize_import_run, validate_import_run, update_import_run_stats, sync_referentiels_from_import, sync_arti_counter_from_import, import_prestataires

**Utilisateur (~8)** : get_user_direction, get_user_direction_id, get_user_roles, get_user_permissions, get_user_exercice_actif, user_can_access_exercice, fn_get_user_initiales, fn_extract_initiales

**Dossier (~6)** : bloquer_dossier, debloquer_dossier, get_dossier_current_step, get_dossier_workflow_progress, recalculer_montants_dossier

**Interims/Delegations (~4)** : create_interim, end_interim, deactivate_expired_interims, get_active_interim_for_user

**Workflow Admin (~10)** : wf_admin_upsert_workflow, wf_admin_upsert_step, wf_admin_upsert_action, wf_admin_upsert_role, wf_admin_upsert_service, wf_admin_delete_step, wf_admin_reorder_steps, wf_admin_set_step_actions, wf_admin_set_step_permission

**Autres (~35)** : Codification, prestataires, reglements, reamenagements, liquidations urgentes, QR code verification, etc.

</details>

### 4.4 RLS Policies (621)

**Repartition :** 621 policies sur ~196 tables/vues

Les tables les plus protegees :

- `storage` : 32 policies (buckets sygfp-attachments, imports, exports, notes-sef, etc.)
- `notes_sef` : 12+ policies (par role, par direction, par statut)
- `soumissionnaires_lot` : 8 policies
- `lots_marche` : 8 policies
- `passation_marche` : 6+ policies
- `budget_engagements` : 6+ policies

**Pattern RLS :** `has_role(auth.uid(), 'ROLE'::app_role)` via table `user_roles`
**Fonctions helper :** has_role(), get_user_direction_id() — **ATTENTION:** is_admin(), is_dg(), is_daaf() N'EXISTENT PAS en base

### 4.5 Edge Functions (12)

| Fonction                 | Description                                       |
| ------------------------ | ------------------------------------------------- |
| budget-alerts            | Alertes budget (triggers)                         |
| bulk-operations          | Operations en masse                               |
| create-user              | Creation utilisateur                              |
| generate-bordereau       | Generation bordereau                              |
| generate-dashboard-stats | Stats dashboard                                   |
| generate-export          | Export Excel/PDF/CSV (passation marche + PV COJO) |
| generate-report          | Generation rapports                               |
| process-reglement        | Traitement reglements                             |
| r2-storage               | Operations Cloudflare R2                          |
| send-notification-email  | Envoi emails                                      |
| validate-workflow        | Validation workflow                               |
| workflow-validation      | Validation workflow avancee                       |

### 4.6 Migrations (253 fichiers SQL)

**Les 15 plus recentes (module Passation de Marche) :**

1. `20260219_passation_7step_lifecycle.sql`
2. `20260218_prompt13_notifications_passation.sql`
3. `20260218_prompt12_securite_perf.sql`
4. `20260218_prompt9_workflow_columns.sql`
5. `20260218_prompt9_transitions_contraintes.sql`
6. `20260218_prompt8_marche_detail_rpc.sql`
7. `20260218_prompt7_evaluations_offre_backend.sql`
8. `20260218_prompt7_evaluation_cojo.sql`
9. `20260218_prompt6_soumissionnaires_lot.sql`
10. `20260218_prompt6_soumissionnaires_table.sql`
11. `20260218_prompt6_soumissions_backend.sql`
12. `20260218_prompt5_lots_marche_table.sql`
13. `20260218_prompt5_marche_lots_backend.sql`
14. `20260218_prompt4_references_fk_seuils.sql`
15. `20260218_prompt4_marches_backend.sql`

---

## 5. TESTS — INVENTAIRE COMPLET

### 5.1 Tests unitaires Vitest (369 tests / 7 fichiers)

| Fichier                                           | Tests   | Description                                          |
| ------------------------------------------------- | ------- | ---------------------------------------------------- |
| src/test/example.test.ts                          | 4       | Tests de base                                        |
| src/test/passation-utils.test.ts                  | 74      | Seuils, prerequis workflow, constantes passation     |
| src/test/passation-evaluation.test.ts             | 20      | computeEvaluations (COJO), qualification, classement |
| src/test/qrcode-utils.test.ts                     | 33      | Utilitaires QR code                                  |
| src/lib/rbac/**tests**/permissions.test.ts        | 91      | Permissions RBAC                                     |
| src/lib/workflow/**tests**/workflowEngine.test.ts | 95      | Machine a etats workflow                             |
| src/lib/budget/**tests**/imputation-utils.test.ts | 52      | Calculs imputation                                   |
| **TOTAL**                                         | **369** |                                                      |

### 5.2 Tests E2E Playwright (69 fichiers)

**Specs principales :**
| Fichier | Tests | Module |
|---------|-------|--------|
| passation-marche-complete.spec.ts | 66 | Passation marche |
| expression-besoin-complete.spec.ts | 51 | Expression besoin |
| imputation-complete.spec.ts | 46 | Imputation |
| notes-aef-complete.spec.ts | 51 | Notes AEF |
| notes-sef.spec.ts | 25 | Notes SEF |
| audit-passation-marche.spec.ts | 22 | Audit passation |
| audit-marches-detail.spec.ts | 26 | Audit marches |
| structure-budgetaire.spec.ts | 19 | Structure budget |

**Specs par prompt (21 fichiers) :**
prompt3 (3), prompt4 (3), prompt5 (3), prompt6 (3), prompt7 (3), prompt8 (3), prompt9 (1), prompt10 (2), prompt11 (1), prompt12 (1), prompt13 (1)

**Specs par module (36 fichiers dans sous-dossiers) :**
| Dossier | Fichiers | Tests approx |
|---------|----------|--------------|
| reglements/ | 11 | ~138 |
| notifications/ | 4 | ~85 |
| documents/ | 4 | ~41 |
| dmg/ | 3 | ~80 |
| notes-sef/ | 3 | ~30 |
| dashboard/ | 2 | ~22 |
| notes/ | 2 | ~16 |
| workflow/ | 2 | ~17 |
| engagements/ | 1 | ~10 |
| liquidations/ | 1 | ~8 |
| virements/ | 1 | ~9 |
| tests/ | 2 | duplicates |

### 5.3 Configuration tests

**Vitest :**

```
Environnement : jsdom
Seuil couverture : 50% (statements, branches, functions, lines)
Timeout : 10s
Setup : src/test/setup.ts (mocks ResizeObserver, IntersectionObserver, matchMedia)
```

**Playwright :**

```
Navigateur : Chromium
Retries : 2 (CI) / 0 (local)
Workers : 1 (CI) / defaut (local)
URL base : http://localhost:8080
Traces : on-first-retry
Screenshots : only-on-failure
```

---

## 6. QA — ETAT AU 19 FEVRIER 2026

| Verification       | Resultat                      |
| ------------------ | ----------------------------- |
| `npx tsc --noEmit` | 0 erreurs                     |
| `npx vite build`   | Succes (24.73s, 4884 modules) |
| `npx vitest run`   | 369/369 PASS                  |
| ESLint             | 0 warnings (pre-commit hook)  |

---

## 7. MODULE PASSATION DE MARCHE — CERTIFIE

**Score : 100/100** (voir `docs/CERTIFICATION_PASSATION_MARCHE.md`)

### Tables specifiques (11 + 1 vue)

passation_marche, lots_marche, soumissionnaires_lot, soumissions, marche_attachments, marche_documents, marche_historique, marche_lots, marche_offres, marche_sequences, marche_validations + v_marches_stats

### Fonctionnalites certifiees (16/16)

1. Tables backend (passation_marche, lots, soumissionnaires)
2. Seuils DGMP (PSD/PSC/PSL/PSO)
3. Allotissement (creation lots, coherence montants)
4. Soumissionnaires (CRUD, conformite, elimination)
5. Evaluation COJO (70% tech + 30% fin, seuil 70)
6. Seuil technique (70/100, qualification)
7. Workflow 7 etapes (brouillon→signe)
8. Detail 6 onglets
9. Tableau comparatif
10. Exports (Excel/PDF/CSV/PV COJO)
11. QR code verification
12. RLS policies
13. RBAC menu + approbation DG
14. Notifications (dispatch + Edge Function)
15. 94 tests unitaires passation
16. Non-regression (369/369)

---

## 8. MODULE ENGAGEMENT — ETAT ACTUEL

**Table :** `budget_engagements` (2,805 enregistrements migres)
**FK passation :** `passation_marche_id` existe mais NON peuple
**Workflow :** 4 etapes (SAF→CB→DAF→DG) via `engagement_validations`
**Reference :** ENG-YYYY-NNNN via `get_next_sequence()`
**Impact budget :** `budget_lines.total_engage += montant` quand `statut='valide'`

### 5 Gaps identifies (voir `docs/TRANSITION_VERS_ENGAGEMENT.md`)

1. FK passation_marche_id non peuple dans EngagementFromPMForm
2. Pas de navigation retour Engagement → Passation
3. Notifications workflow non implementees
4. Pre-remplissage depuis passation incomplet
5. 0 tests unitaires engagement

---

## 9. UTILISATEURS TEST

| Email             | Password  | Role               |
| ----------------- | --------- | ------------------ |
| dg@arti.ci        | Test2026! | DG / Validateur    |
| daaf@arti.ci      | Test2026! | DAAF / Validateur  |
| agent.dsi@arti.ci | Test2026! | DSI / Operationnel |

---

## 10. ACCES SERVEURS

### Supabase

```
URL       : https://tjagvgqthlibdpvztvaf.supabase.co
Dashboard : https://supabase.com/dashboard/project/tjagvgqthlibdpvztvaf
Login     : artiabidjan@yahoo.com / VEGet@9008
```

### SQL Server ARTI (migration terminee)

```
Server : 192.168.0.8:1433
User   : ARTI\admin / tranSPort2021!
Bases  : eARTI_DB2, eARTIDB_2025, eARTIDB_2026
```

---

## 11. DOCUMENTS CLES

| Document                               | Description                           |
| -------------------------------------- | ------------------------------------- |
| CLAUDE.md                              | Instructions Claude Code              |
| PROJECT_STATUS.md                      | CE DOCUMENT                           |
| docs/CERTIFICATION_PASSATION_MARCHE.md | Certification passation 100/100       |
| docs/TRANSITION_VERS_ENGAGEMENT.md     | Spec transition vers engagement       |
| docs/AUDIT_TECHNIQUE_COMPLET.md        | Audit technique complet               |
| docs/RAPPORT_MIGRATION_COMPLETE.md     | Rapport migration SQL Server→Supabase |
| docs/AUDIT_MIGRATION_COMPLET.md        | Audit migration                       |
| docs/CREDENTIALS_GUIDE.md              | Guide credentials                     |
| docs/ARCHITECTURE_TECHNIQUE.md         | Architecture technique                |
| docs/GUIDE_SUPABASE.md                 | Guide Supabase                        |
| docs/GUIDE_CODE_SPLITTING.md           | Guide code splitting                  |
| docs/RELEASE_NOTES_v2.md               | Notes de version v2                   |

---

## 12. SCRIPTS UTILES

```bash
npm run dev          # Serveur dev (port 8080)
npm run build        # Build production
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (watch)
npm run test:ui      # Vitest UI
npm run test:coverage # Couverture
npm run test:e2e     # Playwright
npm run test:e2e:ui  # Playwright UI
npm run format       # Prettier
npm run verify       # typecheck + lint + test
```

---

## 13. PROCHAINES ETAPES

1. **Engagement (10 prompts)** : Corriger FK, calcul disponibilite, formulaire enrichi, workflow 4 etapes, detail 6 onglets, RLS/RBAC, notifications, exports, performance, certification
2. **Liquidation** : Apres certification engagement
3. **Ordonnancement** : Apres certification liquidation
4. **Reglement** : Apres certification ordonnancement

---

_Document genere le 19/02/2026 — SYGFP v2.0_
_ARTI = Autorite de Regulation du Transport Interieur (Cote d'Ivoire)_
