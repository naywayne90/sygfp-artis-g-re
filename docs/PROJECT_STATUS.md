# Etat du Projet SYGFP

> **Suivi de l'avancement et roadmap**
> Version: 2.2 | Derniere mise a jour: 2026-02-19

---

## 1. Vue d'Ensemble

| Metrique            | Valeur                       |
| ------------------- | ---------------------------- |
| **Version**         | 1.2 RC                       |
| **Fichiers source** | 802 (TS + TSX)               |
| **Lignes de code**  | 279 872                      |
| **Composants TSX**  | 417 fichiers (50 modules)    |
| **Hooks**           | 165 fichiers (58 733 lignes) |
| **Pages**           | 115 fichiers (12 sections)   |
| **Routes**          | 111                          |
| **Lib/Utils**       | 45 fichiers (12 951 lignes)  |
| **Services**        | 17 fichiers (5 757 lignes)   |
| **Contextes**       | 2 (640 lignes)               |
| **Types**           | 3 fichiers (572 lignes)      |
| **Integrations**    | 2 fichiers (18 262 lignes)   |
| **Migrations DB**   | 253                          |
| **Edge Functions**  | 12 (5 567 lignes)            |
| **Tests unitaires** | 7 fichiers                   |
| **Tests E2E**       | 69 fichiers                  |
| **Docs modules**    | 13 fiches                    |

---

## INVENTAIRE FRONTEND COMPLET

> Inventaire exhaustif au 2026-02-19 — 802 fichiers, 279 872 lignes de code

---

### F1. Hooks (165 fichiers, 58 733 lignes)

#### F1.1 Chaine de depense — Notes SEF (8 hooks, 3 738 lignes)

| Hook                | Fichier                            | Lignes | Role                               |
| ------------------- | ---------------------------------- | ------ | ---------------------------------- |
| useNotesSEF         | `src/hooks/useNotesSEF.ts`         | 896    | CRUD principal, mutations, filters |
| useNotesSEFExport   | `src/hooks/useNotesSEFExport.ts`   | 936    | Export Excel/PDF/CSV               |
| useNotesSEFList     | `src/hooks/useNotesSEFList.ts`     | 230    | Liste paginee, tri, recherche      |
| useNotesSEFAudit    | `src/hooks/useNotesSEFAudit.ts`    | 268    | Historique audit trail             |
| useExportNoteSEFPdf | `src/hooks/useExportNoteSEFPdf.ts` | 235    | Generation PDF individuel          |
| useNoteSEFAutosave  | `src/hooks/useNoteSEFAutosave.ts`  | 175    | Sauvegarde auto brouillon          |
| useNoteSEFDetail    | `src/hooks/useNoteSEFDetail.ts`    | 112    | Detail note par ID                 |
| useNotesSEFCounts   | `src/hooks/useNotesSEFCounts.ts`   | 84     | Compteurs par statut               |

#### F1.2 Chaine de depense — Notes AEF (5 hooks, 2 974 lignes)

| Hook                    | Fichier                                | Lignes | Role                       |
| ----------------------- | -------------------------------------- | ------ | -------------------------- |
| useNotesAEF             | `src/hooks/useNotesAEF.ts`             | 1 421  | CRUD principal, mutations  |
| useNotesAEFExport       | `src/hooks/useNotesAEFExport.ts`       | 874    | Export Excel/PDF/CSV       |
| useLignesEstimativesAEF | `src/hooks/useLignesEstimativesAEF.ts` | 270    | Gestion lignes estimatives |
| useNotesAEFList         | `src/hooks/useNotesAEFList.ts`         | 247    | Liste paginee              |
| useNoteAEFDetail        | `src/hooks/useNoteAEFDetail.ts`        | 162    | Detail note AEF            |

#### F1.3 Chaine de depense — Notes DG (4 hooks, 1 884 lignes)

| Hook                      | Fichier                                  | Lignes | Role                    |
| ------------------------- | ---------------------------------------- | ------ | ----------------------- |
| useNotesDirectionGenerale | `src/hooks/useNotesDirectionGenerale.ts` | 921    | CRUD principal notes DG |
| useNotesDirection         | `src/hooks/useNotesDirection.ts`         | 401    | Notes par direction     |
| useValidationDG           | `src/hooks/useValidationDG.ts`           | 298    | Workflow validation DG  |
| useNoteDGPdf              | `src/hooks/useNoteDGPdf.ts`              | 264    | Generation PDF note DG  |

#### F1.4 Chaine de depense — Imputation (6 hooks, 2 357 lignes)

| Hook                    | Fichier                                | Lignes | Role                 |
| ----------------------- | -------------------------------------- | ------ | -------------------- |
| useImputation           | `src/hooks/useImputation.ts`           | 851    | CRUD principal       |
| useImputations          | `src/hooks/useImputations.ts`          | 388    | Liste imputations    |
| useNoteImputations      | `src/hooks/useNoteImputations.ts`      | 356    | Imputations par note |
| useImputationValidation | `src/hooks/useImputationValidation.ts` | 302    | Workflow validation  |
| useImputationsExport    | `src/hooks/useImputationsExport.ts`    | 299    | Export Excel/PDF/CSV |
| useImputationDetail     | `src/hooks/useImputationDetail.ts`     | 161    | Detail imputation    |

#### F1.5 Chaine de depense — Expression de besoin (3 hooks, 1 398 lignes)

| Hook                       | Fichier                                   | Lignes | Role                 |
| -------------------------- | ----------------------------------------- | ------ | -------------------- |
| useExpressionsBesoin       | `src/hooks/useExpressionsBesoin.ts`       | 826    | CRUD principal       |
| useExpressionsBesoinExport | `src/hooks/useExpressionsBesoinExport.ts` | 512    | Export Excel/PDF/CSV |
| useExpressionBesoinDetail  | `src/hooks/useExpressionBesoinDetail.ts`  | 60     | Detail EB            |

#### F1.6 Chaine de depense — Passation de marche (6 hooks, 4 548 lignes)

| Hook                     | Fichier                                 | Lignes | Role                                   |
| ------------------------ | --------------------------------------- | ------ | -------------------------------------- |
| usePassationsMarche      | `src/hooks/usePassationsMarche.ts`      | 1 583  | CRUD, workflow, lots, soumissionnaires |
| usePassationMarcheExport | `src/hooks/usePassationMarcheExport.ts` | 893    | Export Excel 4 feuilles/PDF/CSV        |
| useMarches               | `src/hooks/useMarches.ts`               | 542    | Liste marches (contractualisation)     |
| usePassationExport       | `src/hooks/usePassationExport.ts`       | 530    | Export rapide passations               |
| useMarcheDocuments       | `src/hooks/useMarcheDocuments.ts`       | --     | Documents marche                       |
| useMarcheOffres          | `src/hooks/useMarcheOffres.ts`          | --     | Offres marche                          |

#### F1.7 Chaine de depense — Engagement (2 hooks, 1 022 lignes)

| Hook                   | Fichier                               | Lignes | Role                 |
| ---------------------- | ------------------------------------- | ------ | -------------------- |
| useEngagements         | `src/hooks/useEngagements.ts`         | 768    | CRUD principal       |
| useEngagementDocuments | `src/hooks/useEngagementDocuments.ts` | 254    | Documents engagement |

#### F1.8 Chaine de depense — Liquidation (3 hooks, 1 256 lignes)

| Hook                    | Fichier                                | Lignes | Role                  |
| ----------------------- | -------------------------------------- | ------ | --------------------- |
| useLiquidations         | `src/hooks/useLiquidations.ts`         | 719    | CRUD principal        |
| useUrgentLiquidations   | `src/hooks/useUrgentLiquidations.ts`   | 296    | Liquidations urgentes |
| useLiquidationDocuments | `src/hooks/useLiquidationDocuments.ts` | 241    | Documents liquidation |

#### F1.9 Chaine de depense — Ordonnancement (2 hooks, 1 029 lignes)

| Hook                        | Fichier                                    | Lignes | Role                     |
| --------------------------- | ------------------------------------------ | ------ | ------------------------ |
| useOrdonnancements          | `src/hooks/useOrdonnancements.ts`          | 847    | CRUD principal           |
| useOrdonnancementSignatures | `src/hooks/useOrdonnancementSignatures.ts` | 182    | Signatures electroniques |

#### F1.10 Chaine de depense — Reglement (2 hooks, 1 218 lignes)

| Hook                 | Fichier                             | Lignes | Role                       |
| -------------------- | ----------------------------------- | ------ | -------------------------- |
| useReglements        | `src/hooks/useReglements.ts`        | 840    | CRUD principal             |
| usePaiementsPartiels | `src/hooks/usePaiementsPartiels.ts` | 378    | Gestion paiements partiels |

#### F1.11 Budget (13 hooks, 5 185 lignes)

| Hook                       | Fichier                                   | Lignes | Role                     |
| -------------------------- | ----------------------------------------- | ------ | ------------------------ |
| useBudgetImport            | `src/hooks/useBudgetImport.ts`            | 687    | Import Excel budget      |
| useExportBudgetChain       | `src/hooks/useExportBudgetChain.ts`       | 672    | Export chaine budget     |
| useBudgetLines             | `src/hooks/useBudgetLines.ts`             | 554    | Lignes budgetaires CRUD  |
| useBudgetLineVersions      | `src/hooks/useBudgetLineVersions.ts`      | 467    | Historique versions      |
| useBudgetTransfers         | `src/hooks/useBudgetTransfers.ts`         | 454    | Virements de credits     |
| useBudgetLabelEditor       | `src/hooks/useBudgetLabelEditor.ts`       | 399    | Edition libelles         |
| useBudgetAvailability      | `src/hooks/useBudgetAvailability.ts`      | 386    | Controle disponibilite   |
| useBudgetMovements         | `src/hooks/useBudgetMovements.ts`         | 367    | Mouvements budgetaires   |
| useBudgetNotifications     | `src/hooks/useBudgetNotifications.ts`     | 626    | Alertes et notifications |
| useBudgetAlerts            | `src/hooks/useBudgetAlerts.ts`            | 222    | Alertes seuils           |
| useReamenagementBudgetaire | `src/hooks/useReamenagementBudgetaire.ts` | --     | Reamenagements           |
| useBudgetLineELOP          | `src/hooks/useBudgetLineELOP.ts`          | 180    | Detail ELOP              |
| useBudgetLineAudit         | `src/hooks/useBudgetLineAudit.ts`         | 89     | Audit ligne budget       |

#### F1.12 Dashboard (10 hooks, 3 786 lignes)

| Hook                  | Fichier                                        | Lignes | Role                         |
| --------------------- | ---------------------------------------------- | ------ | ---------------------------- |
| useDashboardByRole    | `src/hooks/useDashboardByRole.ts`              | 914    | Dashboard adaptatif par role |
| useDashboardStats     | `src/hooks/useDashboardStats.ts`               | 744    | Statistiques globales        |
| useDashboardData      | `src/hooks/useDashboardData.ts`                | 423    | Donnees brutes dashboard     |
| useDirectionDashboard | `src/hooks/dashboard/useDirectionDashboard.ts` | 280    | Dashboard direction          |
| useExecutionDashboard | `src/hooks/useExecutionDashboard.ts`           | 219    | Dashboard execution          |
| useDSIDashboardStats  | `src/hooks/useDSIDashboardStats.ts`            | 200    | Dashboard DSI                |
| useDashboardAlerts    | `src/hooks/useDashboardAlerts.ts`              | 189    | Alertes dashboard            |
| useRoadmapDashboard   | `src/hooks/useRoadmapDashboard.ts`             | --     | Dashboard feuilles route     |
| useDMGDashboard       | `src/hooks/useDMGDashboard.ts`                 | 127    | Dashboard DMG                |
| useHRDashboardData    | `src/hooks/useHRDashboardData.ts`              | 110    | Dashboard RH                 |

#### F1.13 Workflow (6 hooks, 1 515 lignes)

| Hook                   | Fichier                               | Lignes | Role                    |
| ---------------------- | ------------------------------------- | ------ | ----------------------- |
| useWorkflowAdmin       | `src/hooks/useWorkflowAdmin.ts`       | 371    | Administration workflow |
| useWorkflowEngine      | `src/hooks/useWorkflowEngine.ts`      | 360    | Moteur de transitions   |
| useWorkflowTasks       | `src/hooks/useWorkflowTasks.ts`       | 291    | Taches workflow         |
| useWorkflowDossier     | `src/hooks/useWorkflowDossier.ts`     | 281    | Workflow par dossier    |
| useWorkflowTransitions | `src/hooks/useWorkflowTransitions.ts` | 181    | Transitions possibles   |
| useWorkflowEtapes      | `src/hooks/useWorkflowEtapes.ts`      | 31     | Etapes workflow         |

#### F1.14 RBAC / Permissions (7 hooks, 1 731 lignes)

| Hook                         | Fichier                                     | Lignes | Role                    |
| ---------------------------- | ------------------------------------------- | ------ | ----------------------- |
| useRBACEnforcer              | `src/hooks/useRBACEnforcer.ts`              | 337    | Enforcement RBAC        |
| useRoleBasedAccess           | `src/hooks/useRoleBasedAccess.ts`           | 284    | Acces par role          |
| useRoleValidation            | `src/hooks/useRoleValidation.ts`            | 245    | Validation roles        |
| usePermissions               | `src/hooks/usePermissions.ts`               | 237    | Permissions utilisateur |
| useDocumentPermissions       | `src/hooks/useDocumentPermissions.ts`       | --     | Permissions documents   |
| useInterimPermissions        | `src/hooks/useInterimPermissions.ts`        | --     | Permissions interims    |
| useCheckValidationPermission | `src/hooks/useCheckValidationPermission.ts` | --     | Check validation        |

#### F1.15 Hooks transverses (80+ hooks, ~24 800 lignes)

| Hook                            | Lignes | Role                          |
| ------------------------------- | ------ | ----------------------------- |
| useReferentielSync              | 884    | Synchronisation referentiels  |
| useARTIImport                   | 862    | Import donnees ARTI           |
| useEtatsExecution               | 763    | Etats d'execution globaux     |
| useCoherenceCheck               | 724    | Controle coherence donnees    |
| useApprovisionnement            | 698    | Module approvisionnement      |
| useDossiers                     | 678    | Gestion dossiers              |
| useTaskExecution                | 646    | Execution taches              |
| useImportJobs                   | 644    | Jobs d'import                 |
| useFeuilleRouteImport           | 630    | Import feuilles de route      |
| useAuditTrail                   | 614    | Audit trail global            |
| useExportDossierComplet         | 552    | Export dossier complet        |
| useRoadmapSubmissions           | 542    | Soumissions feuilles route    |
| useNotificationSettings         | 519    | Parametres notifications      |
| useExcelParser                  | 518    | Parseur Excel generique       |
| useSpendingCase                 | 514    | Dossier de depense            |
| useMouvementsTresorerie         | 475    | Mouvements tresorerie         |
| useNotificationsEnhanced        | 443    | Notifications enrichies       |
| useReferentielsValidation       | 442    | Validation referentiels       |
| useRoadmapDiff                  | 436    | Comparaison feuilles route    |
| usePrestataires                 | 430    | CRUD prestataires             |
| useNotificationsAuto            | 427    | Notifications automatiques    |
| useCompteBancaires              | 424    | Comptes bancaires             |
| useCaisses                      | 424    | Gestion caisses               |
| useAttachments                  | 420    | Pieces jointes                |
| useFundingSources               | 419    | Sources de financement        |
| useNotificationsRealtime        | 408    | Notifications temps reel      |
| useContrats                     | 395    | Gestion contrats              |
| useApprovisionnementsTresorerie | 378    | Approvisionnements tresorerie |
| useLambdaLinks                  | 367    | Liens Lambda                  |
| useSupplierDocuments            | 339    | Documents fournisseurs        |
| useImportStaging                | 313    | Staging import                |
| useExport                       | 311    | Export generique              |
| useTaches                       | 306    | Gestion taches                |
| useRecentActivities             | 300    | Activites recentes            |
| useCodificationVariables        | 299    | Variables codification        |
| useDoublonsDetection            | 296    | Detection doublons            |
| useFileUpload                   | 286    | Upload fichiers               |
| useTresorerie                   | 263    | Module tresorerie             |
| useSavedViews                   | 257    | Vues sauvegardees             |
| useInterim                      | 256    | Gestion interims              |
| useImportSecurity               | 254    | Securite imports              |
| useAlerts                       | 239    | Alertes generiques            |
| useReferentiels                 | 237    | Referentiels base             |
| useSecteursActivite             | 233    | Secteurs d'activite           |
| useDelegations                  | 232    | Delegations de pouvoir        |
| useStandardExport               | 228    | Export standard               |
| useSidebarBadges                | 221    | Badges sidebar temps reel     |
| useDocumentUpload               | 221    | Upload documents              |
| useAuditJournal                 | 218    | Journal d'audit               |
| useExportExcel                  | 213    | Export Excel generique        |
| useCodification                 | 212    | Codification                  |
| useNotifications                | 207    | Notifications base            |
| useAuditLog                     | 206    | Log audit                     |
| useR2Storage                    | 204    | Stockage R2                   |
| useRecettes                     | 199    | Module recettes               |
| useDocumentCompleteness         | 195    | Completude documents          |
| useARTIReference                | 191    | References ARTI               |
| use-toast                       | 186    | Notifications toast           |
| useGenerateDossierRef           | 184    | Generation references         |
| useProjetTaches                 | 181    | Taches projets                |
| useReferentielImportExport      | 174    | Import/export referentiels    |
| useParametresExercice           | 168    | Parametres exercice           |
| useBaseReferentiels             | 164    | Referentiels de base          |
| useBreadcrumbs                  | 151    | Fil d'Ariane                  |
| useRaciMatrix                   | 145    | Matrice RACI                  |
| useDossierDetails               | 136    | Details dossier               |
| useProductionChecklist          | 130    | Checklist production          |
| useSequenceGenerator            | 126    | Generateur sequences          |
| usePlansTravail                 | 120    | Plans de travail              |
| useQRCode                       | 117    | QR codes                      |
| useModuleDocumentation          | 108    | Documentation modules         |
| useEtapeDelais                  | 106    | Delais etapes                 |
| useGenerateReport               | 102    | Generation rapports           |
| usePaymentKPIs                  | 96     | KPIs paiements                |
| useUserExercices                | 91     | Exercices utilisateur         |
| useExerciceWriteGuard           | 85     | Guard ecriture exercice       |
| useSeparationOfDuties           | 81     | Separation des taches         |
| usePendingTasks                 | 73     | Taches en attente             |
| useTableauFinancier             | 51     | Tableau financier             |
| useHistoriqueLibelles           | 50     | Historique libelles           |
| useExerciceFilter               | 36     | Filtre exercice               |
| use-mobile                      | 19     | Detection mobile              |

---

### F2. Composants par module (417 fichiers TSX, 50 modules)

| #   | Module                   | Fichiers | Composants cles                                                                                                                                                                                                                                                     |
| --- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **ui**                   | 48       | Button, Dialog, Sheet, Tabs, Badge, Card, DropdownMenu, Select, DataTable, Skeleton, Toast, Popover, Calendar, Command, Tooltip, ScrollArea, Separator...                                                                                                           |
| 2   | **budget**               | 32       | BudgetLines, BudgetTransferForm, BudgetAlertPanel, BudgetImportWizard, BudgetChart, BudgetSummary, BudgetMovementsTable, BudgetLabelsEditor...                                                                                                                      |
| 3   | **dashboard**            | 25       | DashboardStats, DashboardCharts, DashboardKPIs, DashboardByRole, ExecutionChart, BudgetProgress, RecentActivities, AlertsPanel...                                                                                                                                   |
| 4   | **notes-sef**            | 22       | NotesSEFTable, NotesSEFForm, NotesSEFDetail, NotesSEFSheet, NotesSEFFilters, NotesSEFExport, AttachmentsTab, HistoriqueTab, AEFLinkTab...                                                                                                                           |
| 5   | **passation-marche**     | 15       | PassationMarcheForm (1235L), PassationDetails (1149L), EvaluationCOJO (989L), SoumissionnairesSection (578L), WorkflowActionBar (502L), PassationChecklist (412L), EvaluationGrid, ComparatifEvaluation, TableauComparatif, PassationTimeline, PassationChainNav... |
| 6   | **admin**                | 15       | UserManagement, RoleEditor, DelegationForm, InterimConfig, ExerciceManager, ParametersTabs, AuditViewer...                                                                                                                                                          |
| 7   | **shared**               | 15       | DossierStepTimeline (450L), DocumentUpload (248L), NotesFiltersBar (244L), ARTIReferenceBadge (232L), EmptyState (177L), PageHeader (176L), GenericDeferDialog, NotesPagination, FundingSourceSelect, StatutBadge, ErrorBoundary, PageLoader...                     |
| 8   | **workflow**             | 14       | WorkflowTimeline, WorkflowStepCard, TransitionButton, WorkflowAdmin, WorkflowEditor, WorkflowHistory...                                                                                                                                                             |
| 9   | **dossier**              | 14       | DossierDetail, DossierTimeline, DossierForm, DossierFilters, DossierExport...                                                                                                                                                                                       |
| 10  | **expression-besoin**    | 11       | ExpressionBesoinForm, ExpressionBesoinTable, ExpressionBesoinDetail, ArticlesSection, ExportButton...                                                                                                                                                               |
| 11  | **imputation**           | 11       | ImputationForm, ImputationTable, ImputationDetail, BudgetLineSelector, ImputationValidation...                                                                                                                                                                      |
| 12  | **engagement**           | 11       | EngagementForm, EngagementTable, EngagementDetail, EngagementDocuments...                                                                                                                                                                                           |
| 13  | **liquidation**          | 11       | LiquidationForm, LiquidationTable, LiquidationDetail, UrgentLiquidations...                                                                                                                                                                                         |
| 14  | **ordonnancement**       | 11       | OrdonnancementForm, OrdonnancementTable, OrdonnancementDetail, SignaturePanel...                                                                                                                                                                                    |
| 15  | **prestataires**         | 10       | PrestataireForm, PrestataireList, PrestataireDetail, DocumentsSection, QualificationPanel...                                                                                                                                                                        |
| 16  | **marches**              | 10       | MarcheForm, MarcheList, MarcheDetail, MarcheDocuments, MarcheOffres...                                                                                                                                                                                              |
| 17  | **planification**        | 9        | PlanificationBudget, FeuilleRouteForm, RoadmapChart, ProjetDetail...                                                                                                                                                                                                |
| 18  | **notifications**        | 9        | NotificationList, NotificationSettings, NotificationBell, RealtimeNotif...                                                                                                                                                                                          |
| 19  | **canvas**               | 9        | NoteCanvas, CanvasEditor, CanvasToolbar, CanvasExport...                                                                                                                                                                                                            |
| 20  | **notes-aef**            | 8        | NotesAEFTable, NotesAEFForm, NotesAEFDetail, LignesEstimatives...                                                                                                                                                                                                   |
| 21  | **reglement**            | 8        | ReglementForm, ReglementTable, PaiementsPartiels, ReglementDetail...                                                                                                                                                                                                |
| 22  | **import-export**        | 8        | ImportWizard, ExcelParser, ImportValidation, ExportPanel...                                                                                                                                                                                                         |
| 23  | **attachments**          | 8        | FileUpload, FileList, FilePreview, MigratedBadge...                                                                                                                                                                                                                 |
| 24  | **etats**                | 6        | EtatsExecution, EtatsFilters, EtatsExport...                                                                                                                                                                                                                        |
| 25  | **notes-dg-officielles** | 5        | NotesDGTable, NotesDGForm, NotesDGDetail...                                                                                                                                                                                                                         |
| 26  | **exercice**             | 5        | ExerciceSelector, ExerciceForm, ExerciceGuard...                                                                                                                                                                                                                    |
| 27  | **audit**                | 5        | AuditTimeline, AuditTable, AuditFilters...                                                                                                                                                                                                                          |
| 28  | **approvisionnement**    | 5        | ApprovisionnementForm, ApprovisionnementList...                                                                                                                                                                                                                     |
| 29  | **validation**           | 4        | ValidationDialog, ValidationHistory, ValidationBadge...                                                                                                                                                                                                             |
| 30  | **tresorerie**           | 4        | TresorerieTable, MouvementsForm, CaissePanel...                                                                                                                                                                                                                     |
| 31  | **export**               | 4        | ExportDropdown, ExportProgress, ExportPreview...                                                                                                                                                                                                                    |
| 32  | **codification**         | 4        | CodificationEditor, CodificationPreview...                                                                                                                                                                                                                          |
| 33  | **auth**                 | 4        | LoginForm, ForgotPassword, ResetPassword, AuthLayout                                                                                                                                                                                                                |
| 34  | **search**               | 3        | GlobalSearch, SearchResults, SearchFilters                                                                                                                                                                                                                          |
| 35  | **qrcode**               | 3        | QRCodeGenerator, QRCodeVerify, QRCodeBadge                                                                                                                                                                                                                          |
| 36  | **liquidations**         | 3        | ScanningLiquidation, LiquidationScanner...                                                                                                                                                                                                                          |
| 37  | **layout**               | 3        | Sidebar, Header, MainLayout                                                                                                                                                                                                                                         |
| 38  | **interim**              | 3        | InterimForm, InterimList, InterimBadge                                                                                                                                                                                                                              |
| 39  | **ged**                  | 3        | DocumentViewer, DocumentManager...                                                                                                                                                                                                                                  |
| 40  | **dmg**                  | 3        | DMGDashboard, DMGStats, DMGKPIs                                                                                                                                                                                                                                     |
| 41  | **coherence**            | 3        | CoherenceCheck, CoherenceReport...                                                                                                                                                                                                                                  |
| 42  | **recettes**             | 2        | RecetteForm, RecetteList                                                                                                                                                                                                                                            |
| 43  | **notification**         | 2        | NotifPopover, NotifBadge                                                                                                                                                                                                                                            |
| 44  | **execution**            | 2        | ExecutionOverview, ExecutionChart                                                                                                                                                                                                                                   |
| 45  | **contrats**             | 2        | ContratForm, ContratList                                                                                                                                                                                                                                            |
| 46  | **roadmap**              | 1        | RoadmapView                                                                                                                                                                                                                                                         |
| 47  | **help**                 | 1        | HelpPanel                                                                                                                                                                                                                                                           |
| 48  | **direction**            | 1        | DirectionDashboard                                                                                                                                                                                                                                                  |
| 49  | **command-palette**      | 1        | CommandPalette                                                                                                                                                                                                                                                      |
| 50  | **Divers racine**        | --       | App.tsx, main.tsx                                                                                                                                                                                                                                                   |

---

### F3. Routes (111 dans App.tsx)

#### F3.1 Authentification (3 routes)

| Route                   | Page               |
| ----------------------- | ------------------ |
| `/auth`                 | LoginPage          |
| `/auth/forgot-password` | ForgotPasswordPage |
| `/auth/reset-password`  | ResetPasswordPage  |

#### F3.2 Systeme (5 routes)

| Route                          | Page               |
| ------------------------------ | ------------------ |
| `/select-exercice`             | SelectExercice     |
| `/no-open-exercice`            | NoOpenExercise     |
| `/verification/note-dg/:token` | VerificationNoteDG |
| `/dg/valider/:token`           | ValiderNoteDG      |
| `/verify/:hash`                | VerifyDocument     |

#### F3.3 General (7 routes)

| Route                  | Page               |
| ---------------------- | ------------------ |
| `/`                    | Dashboard          |
| `/recherche`           | Recherche          |
| `/notifications`       | Notifications      |
| `/alertes-budgetaires` | AlertesBudgetaires |
| `/alertes`             | Alertes            |
| `/mon-profil`          | MonProfil          |
| `/taches`              | WorkflowTasks      |

#### F3.4 Administration (29 routes sous /admin/\*)

`exercices`, `parametres-programmatiques`, `utilisateurs`, `roles`, `autorisations`, `delegations`, `parametres`, `journal-audit`, `architecture`, `dictionnaire`, `codification`, `secteurs-activite`, `documentation`, `raci`, `checklist-production`, `liens-lambda`, `parametres-exercice`, `doublons`, `compteurs-references`, `import-budget`, `comptes-bancaires`, `origines-fonds`, `anomalies`, `test-non-regression`, `workflows`, `notifications`, `interims`, `libelles-budget`, `historique-libelles`

#### F3.5 Planification (17 routes sous /planification/\*)

`budget`, `physique`, `structure`, `plan-travail`, `virements`, `import-export`, `historique-imports`, `aide-import`, `notifications`, `feuilles-route`, `soumissions-feuilles-route`, `roadmap-dashboard`, `roadmap-direction`, `projets`, `projets/:id`, `execution-physique`, `maj-feuilles-route`

#### F3.6 Gestion taches (3 routes)

| Route                              | Page                    |
| ---------------------------------- | ----------------------- |
| `/gestion-taches/etat-execution`   | EtatExecutionTachesPage |
| `/gestion-taches/taches-realisees` | TachesRealiseesPage     |
| `/gestion-taches/taches-differees` | TachesDiffereesPage     |

#### F3.7 Dashboards (5 routes)

| Route                            | Page                   |
| -------------------------------- | ---------------------- |
| `/execution/dashboard`           | DashboardExecution     |
| `/execution/dashboard-dg`        | DashboardDGPage        |
| `/execution/dashboard-direction` | DashboardDirectionPage |
| `/dashboard-dmg`                 | DashboardDMG           |
| `/dashboard-financier`           | DashboardFinancier     |

#### F3.8 Chaine de depense (20 routes)

| Route                                     | Page                   | Etape              |
| ----------------------------------------- | ---------------------- | ------------------ |
| `/notes-sef`                              | NotesSEF               | 1 - Notes SEF      |
| `/notes-sef/validation`                   | ValidationNotesSEF     | 1                  |
| `/notes-sef/:id`                          | NoteSEFDetail          | 1                  |
| `/notes-aef`                              | NotesAEF               | 2 - Notes AEF      |
| `/notes-aef/validation`                   | ValidationNotesAEF     | 2                  |
| `/notes-aef/:id`                          | NoteAEFDetail          | 2                  |
| `/notes-dg`                               | NotesDirectionGenerale | 3 - Notes DG       |
| `/notes-dg/validation`                    | ValidationNotesDG      | 3                  |
| `/dg/notes-a-valider`                     | NotesAValider          | 3                  |
| `/execution/imputation`                   | ImputationPage         | 4 - Imputation     |
| `/execution/expression-besoin`            | ExpressionBesoin       | 5 - Expr. Besoin   |
| `/execution/passation-marche`             | PassationMarche        | 6 - Passation      |
| `/execution/passation-marche/approbation` | PassationApprobation   | 6                  |
| `/marches`                                | Marches                | 6                  |
| `/engagements`                            | Engagements            | 7 - Engagement     |
| `/execution/scanning-engagement`          | ScanningEngagement     | 7                  |
| `/liquidations`                           | Liquidations           | 8 - Liquidation    |
| `/execution/scanning-liquidation`         | ScanningLiquidation    | 8                  |
| `/ordonnancements`                        | Ordonnancements        | 9 - Ordonnancement |
| `/reglements`                             | Reglements             | 10 - Reglement     |

#### F3.9 Autres (22 routes)

| Groupe             | Routes                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suivi              | `/suivi-dossiers`, `/suivi-dossiers/:id`, `/etats-execution`                                                                                                      |
| Direction          | `/espace-direction`, `/espace-direction/notes/:id/canvas`                                                                                                         |
| Approvisionnement  | `/approvisionnement`                                                                                                                                              |
| Tresorerie         | `/tresorerie`, `/tresorerie/approvisionnements/banque`, `/tresorerie/approvisionnements/caisse`, `/tresorerie/mouvements/banque`, `/tresorerie/mouvements/caisse` |
| Recettes           | `/recettes`                                                                                                                                                       |
| Programmatique     | `/programmatique/charger-budget`, `/programmatique/mise-a-jour`, `/programmatique/liste-budget`, `/programmatique/reamenagement`                                  |
| Budget             | `/budget/reamenagements-imputations`                                                                                                                              |
| Contractualisation | `/contractualisation/prestataires`, `/contractualisation/contrats`, `/contractualisation/comptabilite-matiere`                                                    |
| Catch-all          | `/*` (NotFound)                                                                                                                                                   |

---

### F4. Pages (115 fichiers)

| Section                 | Fichiers | Pages cles                                                                                                                                                                                                                                                           |
| ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **admin/**              | 29       | GestionUtilisateurs, GestionRoles, GestionExercices, JournalAudit, WorkflowAdmin, Interims, ParametresProgrammatiques, ImportBudgetAdmin...                                                                                                                          |
| **execution/**          | 7        | PassationMarche (889L), PassationApprobation (560L), DashboardExecution, DashboardDGPage, DashboardDirectionPage, ImputationPage, ExpressionBesoin                                                                                                                   |
| **planification/**      | 17       | PlanificationBudgetaire, StructureBudgetaire, Virements, ImportExport, ProjetsList, ProjetDetail, RoadmapDashboard, FeuilleRouteImportPage...                                                                                                                        |
| **auth/**               | 3        | LoginPage, ForgotPasswordPage, ResetPasswordPage                                                                                                                                                                                                                     |
| **tresorerie/**         | 5        | GestionTresorerie, ApprovisionnementsBanque, ApprovisionnementsCaisse, MouvementsBanque, MouvementsCaisse                                                                                                                                                            |
| **contractualisation/** | 5        | Prestataires, Contrats, ComptabiliteMatiere, DemandePrestataire, ValidationPrestataires                                                                                                                                                                              |
| **programmatique/**     | 4        | ChargerBudget, ListeBudget, MiseAJourBudget, Reamenagement                                                                                                                                                                                                           |
| **gestion-taches/**     | 4        | EtatExecutionTachesPage, TachesRealiseesPage, TachesDiffereesPage, MajFeuillesRoutePage                                                                                                                                                                              |
| **dg/**                 | 2        | NotesAValider, ValiderNoteDG                                                                                                                                                                                                                                         |
| **recettes/**           | 1        | DeclarationRecette                                                                                                                                                                                                                                                   |
| **approvisionnement/**  | 1        | Approvisionnement                                                                                                                                                                                                                                                    |
| **budget/**             | 1        | ReamenementsImputations                                                                                                                                                                                                                                              |
| **Racine**              | 36       | NotesSEF, NotesAEF, NotesDirectionGenerale, Engagements, Liquidations, Ordonnancements, Reglements, Marches, Dashboard, DashboardDMG, DashboardFinancier, Recherche, Notifications, SuiviDossiers, EtatsExecution, MonProfil, EspaceDirection, AlertesBudgetaires... |

---

### F5. Etat par module de la chaine de depense

#### F5.a Structure budgetaire

| Element         | Detail                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hooks           | 13 hooks (5 185 lignes)                                                                                                                                             |
| Composants      | 32 composants                                                                                                                                                       |
| Pages           | PlanificationBudgetaire, StructureBudgetaire, Virements, ImportExport, HistoriqueImports, AideImportBudget, ImportBudgetAdmin, ListeBudget, ReamenementsImputations |
| Fonctionnalites | Import Excel, virements, alertes seuils, ELOP, audit, historique versions, libelles editables, reamenagements                                                       |
| Export          | Excel/PDF/CSV via useExportBudgetChain                                                                                                                              |
| Status          | **Production** — Complet                                                                                                                                            |

#### F5.b Notes SEF

| Element         | Detail                                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hooks           | 8 hooks (3 738 lignes)                                                                                                                                                                                                                      |
| Composants      | 22 composants                                                                                                                                                                                                                               |
| Pages           | NotesSEF, ValidationNotesSEF, NoteSEFDetail                                                                                                                                                                                                 |
| Lib             | `src/lib/notes-sef/` (6 fichiers : constants, types, helpers, notesSefService, referenceService, index)                                                                                                                                     |
| Services        | noteSEFPdfService.ts (745 lignes)                                                                                                                                                                                                           |
| Fonctionnalites | CRUD complet, workflow (brouillon → soumis → valide/differe/rejete), autosave, Sheet detail 4 onglets (PJ, historique, AEF liee, imputations), export Excel/PDF/CSV, badge migre, audit trail, limite 3 PJ, format reference ARTI00MMYYNNNN |
| Tests           | 275 tests unitaires (useNotesSEF), 2 E2E                                                                                                                                                                                                    |
| Status          | **Production** — Module de reference                                                                                                                                                                                                        |

#### F5.c Notes AEF

| Element         | Detail                                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hooks           | 5 hooks (2 974 lignes)                                                                                                                               |
| Composants      | 8 composants                                                                                                                                         |
| Pages           | NotesAEF, ValidationNotesAEF, NoteAEFDetail                                                                                                          |
| Lib             | `src/lib/notes-aef/` (3 fichiers : constants, types, notesAefService)                                                                                |
| Services        | --                                                                                                                                                   |
| Fonctionnalites | CRUD complet, workflow (brouillon → soumis → valide → a_imputer), lignes estimatives, validation DG, export Excel/PDF/CSV, lien avec Note SEF source |
| Status          | **A finaliser** — Manque PDF service dedie                                                                                                           |

#### F5.d Imputation

| Element         | Detail                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Hooks           | 6 hooks (2 357 lignes)                                                                                        |
| Composants      | 11 composants                                                                                                 |
| Pages           | ImputationPage                                                                                                |
| Lib             | `src/lib/budget/imputation-utils.ts` (324 lignes) + tests (345 lignes)                                        |
| Fonctionnalites | Imputation budgetaire, controle disponibilite, validation multi-niveaux, export, lien note AEF → ligne budget |
| Status          | **A finaliser** — Fonctionnel                                                                                 |

#### F5.e Expression de besoin

| Element         | Detail                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hooks           | 3 hooks (1 398 lignes)                                                                                                                            |
| Composants      | 11 composants                                                                                                                                     |
| Pages           | ExpressionBesoin                                                                                                                                  |
| Services        | expressionBesoinArticlesPdfService.ts (283 lignes)                                                                                                |
| Fonctionnalites | CRUD complet, articles detailles, estimation montant, workflow (brouillon → soumis → verifie → valide), export Excel/PDF/CSV, lien vers passation |
| Status          | **Production** — Complet                                                                                                                          |

#### F5.f Passation de marche

| Element         | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hooks           | 6 hooks (4 548 lignes)                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Composants      | 15 composants (6 635 lignes)                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Pages           | PassationMarche (889L), PassationApprobation (560L)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Services        | passationExportService.ts (441L), pvCojoPdfService.ts (382L)                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Fonctionnalites | CRUD complet, 7 statuts (brouillon → publie → cloture → evalue → attribue → approuve → signe), lots multi-lots, soumissionnaires CRUD, evaluation COJO 3 etapes (conformite → notes tech/fin → classement), tableau comparatif pivote, workflow action bar avec timeline visuelle, approbation DG, export Excel 4 feuilles / PDF rapport / CSV, PV COJO PDF, QR code, chain nav (EB ↔ PM ↔ Engagement), sidebar badge, 8 KPIs cliquables, pagination serveur, skeleton loader |
| Status          | **Production** — Module complet (prompts 4-13)                                                                                                                                                                                                                                                                                                                                                                                                                                |

#### F5.g Engagement

| Element         | Detail                                                     |
| --------------- | ---------------------------------------------------------- |
| Hooks           | 2 hooks (1 022 lignes)                                     |
| Composants      | 11 composants                                              |
| Pages           | Engagements, ScanningEngagement                            |
| Fonctionnalites | CRUD, documents, scanning, workflow, lien passation source |
| Status          | **A finaliser**                                            |

#### F5.h Liquidation

| Element         | Detail                                        |
| --------------- | --------------------------------------------- |
| Hooks           | 3 hooks (1 256 lignes)                        |
| Composants      | 11 + 3 composants                             |
| Pages           | Liquidations, ScanningLiquidation             |
| Fonctionnalites | CRUD, documents, scanning, urgences, workflow |
| Status          | **A finaliser**                               |

#### F5.i Ordonnancement

| Element         | Detail                                   |
| --------------- | ---------------------------------------- |
| Hooks           | 2 hooks (1 029 lignes)                   |
| Composants      | 11 composants                            |
| Pages           | Ordonnancements                          |
| Fonctionnalites | CRUD, signatures electroniques, workflow |
| Status          | **En cours**                             |

#### F5.j Reglement

| Element         | Detail                                   |
| --------------- | ---------------------------------------- |
| Hooks           | 2 hooks (1 218 lignes)                   |
| Composants      | 8 composants                             |
| Pages           | Reglements                               |
| Fonctionnalites | CRUD, paiements partiels, workflow, KPIs |
| Status          | **En cours**                             |

---

### F6. Fichiers partages et utilitaires

#### F6.1 Lib (45 fichiers, 12 951 lignes)

| Sous-module      | Fichiers | Lignes | Contenu                                                                                                      |
| ---------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| `config/`        | 3        | 1 957  | rbac-config (1 214L), sygfp-constants (530L), document-permissions (213L)                                    |
| `workflow/`      | 6        | 1 746  | workflowEngine (726L), transitionService (357L), paniers (270L), statuts (110L), index (82L), tests (621L)   |
| `notes-sef/`     | 6        | 1 626  | notesSefService (581L), constants (313L), types (252L), helpers (248L), referenceService (217L), index (20L) |
| `pdf/`           | 5        | 1 236  | generateNotePDF (522L), pdfFooter (288L), pdfStyles (215L), pdfHeader (199L), index (52L)                    |
| `export/`        | 4        | 1 532  | export-service (638L), export-templates (505L), export-branding (381L), index (8L)                           |
| `excel/`         | 4        | 927    | generateExcel (461L), excelStyles (251L), excelFormats (172L), index (43L)                                   |
| `rbac/`          | 4        | 770    | permissions (438L), config (172L), types (153L), index (7L)                                                  |
| `notes-aef/`     | 3        | 522    | constants (226L), notesAefService (187L), types (109L)                                                       |
| `budget/`        | 2        | 669    | imputation-utils (324L), tests (345L)                                                                        |
| `validations/`   | 1        | 152    | notesSchemas (Zod)                                                                                           |
| `templates/`     | 1        | 278    | feuilleRouteTemplate                                                                                         |
| `feature-flags/` | 1        | 75     | flags                                                                                                        |
| `errors/`        | 1        | 140    | messages                                                                                                     |
| Racine           | 2        | 230    | utils (41L), qrcode-utils (189L)                                                                             |

#### F6.2 Contextes (2 fichiers, 640 lignes)

| Contexte        | Fichier                            | Lignes | Role                                      |
| --------------- | ---------------------------------- | ------ | ----------------------------------------- |
| ExerciceContext | `src/contexts/ExerciceContext.tsx` | 310    | Exercice budgetaire actif, multi-exercice |
| RBACContext     | `src/contexts/RBACContext.tsx`     | 330    | Roles, permissions, profils, delegations  |

#### F6.3 Types (3 fichiers, 572 lignes)

| Fichier                      | Lignes | Contenu                          |
| ---------------------------- | ------ | -------------------------------- |
| `src/types/spending-case.ts` | 353    | Types dossier de depense complet |
| `src/types/roadmap.ts`       | 116    | Types feuilles de route          |
| `src/types/validation.ts`    | 103    | Types workflow validation        |

#### F6.4 Services (17 fichiers, 5 757 lignes)

| Service                            | Lignes | Role                   |
| ---------------------------------- | ------ | ---------------------- |
| noteSEFPdfService                  | 745    | PDF note SEF           |
| noteDGPdfService                   | 651    | PDF note DG            |
| attachmentService                  | 631    | Gestion pieces jointes |
| noteDirectionPdfService            | 585    | PDF note direction     |
| noteDirectionDocxService           | 568    | DOCX note direction    |
| passationExportService             | 441    | Export passations      |
| pvCojoPdfService                   | 382    | PV COJO PDF            |
| migratedFilesService               | 359    | Fichiers migres        |
| expressionBesoinArticlesPdfService | 283    | PDF articles EB        |
| r2Storage                          | 276    | Client R2 Cloudflare   |
| storage/localProvider              | 184    | Stockage local         |
| storage/namingService              | 178    | Nommage fichiers       |
| storage/r2Provider                 | 171    | Provider R2            |
| storage/supabaseProvider           | 148    | Provider Supabase      |
| storage/storageFactory             | 73     | Factory pattern        |
| storage/types                      | 72     | Types stockage         |
| storage/index                      | 10     | Index                  |

---

### F7. Integrations Supabase

#### F7.1 Client et types generes

| Fichier                               | Lignes | Role                                                 |
| ------------------------------------- | ------ | ---------------------------------------------------- |
| `src/integrations/supabase/types.ts`  | 18 220 | Types auto-generes (tables, views, functions, enums) |
| `src/integrations/supabase/client.ts` | 42     | Client Supabase singleton                            |

#### F7.2 Edge Functions (12 fonctions, 5 567 lignes)

| Fonction                 | Lignes | Role                         |
| ------------------------ | ------ | ---------------------------- |
| generate-export          | 1 156  | Export CSV/Excel/PDF avec QR |
| generate-report          | 874    | Generation rapports          |
| budget-alerts            | 508    | Alertes seuils budget        |
| workflow-validation      | 454    | Validation workflow          |
| validate-workflow        | 447    | Validation transitions       |
| generate-bordereau       | 397    | Bordereaux                   |
| bulk-operations          | 391    | Operations en masse          |
| process-reglement        | 355    | Traitement reglements        |
| send-notification-email  | 300    | Emails notification (Resend) |
| generate-dashboard-stats | 280    | Stats dashboard              |
| r2-storage               | 222    | Stockage R2 (presigned URLs) |
| create-user              | 183    | Creation utilisateur admin   |

#### F7.3 Migrations (253 fichiers SQL)

253 migrations depuis la creation du projet (schema, RLS, triggers, fonctions, indexes, donnees de reference).

#### F7.4 Tests

| Type                     | Fichiers    | Couverture                      |
| ------------------------ | ----------- | ------------------------------- |
| Tests unitaires (Vitest) | 7 fichiers  | Notes SEF principalement        |
| Tests E2E (Playwright)   | 69 fichiers | Workflow complet chaine depense |

---

### F8. Metriques de taille (Top 20 fichiers)

| Fichier                                               | Lignes | Module                      |
| ----------------------------------------------------- | ------ | --------------------------- |
| `integrations/supabase/types.ts`                      | 18 220 | Types Supabase auto-generes |
| `hooks/usePassationsMarche.ts`                        | 1 583  | Passation de marche         |
| `hooks/useNotesAEF.ts`                                | 1 421  | Notes AEF                   |
| `config/rbac-config.ts`                               | 1 214  | RBAC                        |
| `components/passation-marche/PassationMarcheForm.tsx` | 1 235  | Passation formulaire        |
| `components/passation-marche/PassationDetails.tsx`    | 1 149  | Passation detail            |
| `edge-functions/generate-export/index.ts`             | 1 156  | Export edge function        |
| `components/passation-marche/EvaluationCOJO.tsx`      | 989    | Evaluation COJO             |
| `hooks/useNotesSEFExport.ts`                          | 936    | Export Notes SEF            |
| `hooks/useNotesDirectionGenerale.ts`                  | 921    | Notes DG                    |
| `hooks/useDashboardByRole.ts`                         | 914    | Dashboard role              |
| `hooks/useNotesSEF.ts`                                | 896    | Notes SEF                   |
| `hooks/usePassationMarcheExport.ts`                   | 893    | Export passation            |
| `hooks/useReferentielSync.ts`                         | 884    | Referentiel sync            |
| `hooks/useNotesAEFExport.ts`                          | 874    | Export Notes AEF            |
| `edge-functions/generate-report/index.ts`             | 874    | Reports                     |
| `hooks/useARTIImport.ts`                              | 862    | Import ARTI                 |
| `hooks/useImputation.ts`                              | 851    | Imputation                  |
| `hooks/useOrdonnancements.ts`                         | 847    | Ordonnancements             |
| `hooks/useReglements.ts`                              | 840    | Reglements                  |

---

## 2. Migration SQL Server vers Supabase

> **Statut : TERMINEE (fevrier 2026)**

La migration complete des donnees depuis SQL Server (eARTI_DB2, eARTIDB_2025, eARTIDB_2026) vers Supabase a ete realisee avec succes.

| Donnee          | SQL Server              | Supabase                 | Statut  |
| --------------- | ----------------------- | ------------------------ | ------- |
| Notes SEF       | 4 823                   | 4 836                    | Complet |
| Engagements     | ~1 700                  | 2 805                    | Complet |
| Liquidations    | 2 954                   | 3 633                    | Complet |
| Ordonnancements | 2 726                   | 3 501                    | Complet |
| Fournisseurs    | 426                     | 431                      | Complet |
| Pieces jointes  | 27 117 fichiers (26 Go) | bucket sygfp-attachments | Complet |

Documentation detaillee : [RAPPORT_MIGRATION_COMPLETE.md](RAPPORT_MIGRATION_COMPLETE.md) | [AUDIT_MIGRATION_COMPLET.md](AUDIT_MIGRATION_COMPLET.md)

---

## 3. Etat par Module

### 3.1 Chaine de la Depense

| #   | Module                | Frontend | Backend | RLS | Tests   | Doc | Status      |
| --- | --------------------- | -------- | ------- | --- | ------- | --- | ----------- |
| 1   | **Notes SEF**         | 100%     | 100%    | Oui | 275     | Oui | Production  |
| 2   | **Notes AEF**         | 95%      | 95%     | Oui | Partiel | Oui | A finaliser |
| 3   | **Imputation**        | 90%      | 90%     | Oui | Partiel | Oui | A finaliser |
| 4   | **Expression Besoin** | 85%      | 85%     | Oui | Partiel | Oui | En cours    |
| 5   | **Passation Marche**  | 100%     | 95%     | Oui | 2 E2E   | Oui | Production  |
| 6   | **Engagements**       | 90%      | 90%     | Oui | Partiel | Oui | A finaliser |
| 7   | **Liquidations**      | 90%      | 90%     | Oui | Partiel | Oui | A finaliser |
| 8   | **Ordonnancements**   | 85%      | 85%     | Oui | Non     | Oui | En cours    |
| 9   | **Reglements**        | 85%      | 85%     | Oui | Non     | Oui | En cours    |

### 3.2 Modules Support

| Module                | Frontend | Backend | RLS     | Status      |
| --------------------- | -------- | ------- | ------- | ----------- |
| **Budget**            | 95%      | 95%     | Oui     | Production  |
| **Virements**         | 90%      | 90%     | Oui     | Production  |
| **Prestataires**      | 90%      | 90%     | Oui     | Production  |
| **Contrats**          | 85%      | 85%     | Oui     | A finaliser |
| **Tresorerie**        | 80%      | 80%     | Oui     | En cours    |
| **Approvisionnement** | 70%      | 70%     | Oui     | Partiel     |
| **Recettes**          | 60%      | 60%     | Partiel | Partiel     |

### 3.3 Administration

| Module                         | Frontend | Backend | Status      |
| ------------------------------ | -------- | ------- | ----------- |
| **Gestion Utilisateurs**       | 95%      | 95%     | Production  |
| **Roles & Permissions**        | 95%      | 95%     | Production  |
| **Delegations**                | 85%      | 85%     | A finaliser |
| **Exercices**                  | 95%      | 95%     | Production  |
| **Parametres Programmatiques** | 90%      | 90%     | Production  |
| **Journal Audit**              | 90%      | 90%     | Production  |
| **Notifications**              | 90%      | 90%     | Production  |
| **Workflows**                  | 85%      | 85%     | A finaliser |
| **Interims**                   | 85%      | 85%     | A finaliser |
| **Architecture SYGFP**         | 80%      | 80%     | En cours    |
| **Codification**               | 85%      | 85%     | A finaliser |

### 3.4 Reporting

| Module                  | Frontend | Backend | Status      |
| ----------------------- | -------- | ------- | ----------- |
| **Etats d'execution**   | 85%      | 85%     | A finaliser |
| **Alertes Budgetaires** | 80%      | 80%     | En cours    |
| **Dashboard**           | 90%      | 90%     | Production  |
| **Dashboard DMG**       | 85%      | 85%     | A finaliser |
| **Export Excel/PDF**    | 90%      | 90%     | Production  |

---

## 4. Legende

| Valeur       | Signification                      |
| ------------ | ---------------------------------- |
| Production   | Fonctionnel et teste               |
| En cours     | Fonctionnel, finitions en cours    |
| A finaliser  | Quasi complet, ajustements mineurs |
| Partiel      | Fonctionnalites de base seulement  |
| Non commence | Pas encore developpe               |

---

## 5. Fonctionnalites Cles

### 5.1 Implementees

- [x] Authentification email/password
- [x] Systeme RBAC complet (roles, permissions)
- [x] Workflow 9 etapes chaine de depense
- [x] Gestion multi-exercice
- [x] Generation automatique references pivot
- [x] Soft delete sur toutes les tables
- [x] Audit trail automatique
- [x] Import budget Excel
- [x] Virements de credits
- [x] Calcul disponibilite budgetaire
- [x] Alertes seuils budgetaires
- [x] Gestion prestataires avec documents
- [x] Qualification fournisseurs
- [x] RLS sur tables critiques
- [x] Dashboard par role
- [x] Migration SQL Server vers Supabase terminee
- [x] Pieces jointes migrees vers Supabase Storage
- [x] Delegations et interims dans le workflow backend (Gaps 2+3)
- [x] Notifications avec delegations/interims (Gap 4)
- [x] Content-Security-Policy (CSP) headers
- [x] Panneau de detail Notes SEF (Sheet 4 onglets)
- [x] Export Excel avec colonne Montant estime
- [x] RLS DAAF peut modifier notes soumises
- [x] Limite 3 PJ par note (trigger DB + frontend)
- [x] Badge "Migre" pour notes importees
- [x] Module Passation de Marche complet (prompts 4-13)
- [x] Evaluation COJO 3 etapes (conformite, notes, classement)
- [x] Approbation/rejet DG passations
- [x] Export Excel 4 feuilles / PDF rapport / CSV passations
- [x] PV COJO PDF professionnel
- [x] QR code sur marches signes
- [x] Navigation chaine depense EB ↔ Passation ↔ Engagement
- [x] Sidebar badges temps reel
- [x] Skeleton loaders + pagination serveur

### 5.2 En cours

- [ ] Export PDF mandats/ordonnancements
- [ ] Gestion avenants contrats
- [ ] Plan de tresorerie previsionnel
- [ ] Reports de credits inter-exercice
- [ ] Module Reglements - ameliorations UI

### 5.3 Planifiees

- [ ] SSO / OAuth (Google, Microsoft)
- [ ] API REST publique
- [ ] Application mobile (PWA)
- [ ] Signature electronique
- [ ] Archivage automatique
- [ ] Tableaux de bord analytiques avances

---

## 6. Edge Functions Supabase

| Fonction                   | Lignes | Description                                      | Services externes   | Statut     |
| -------------------------- | ------ | ------------------------------------------------ | ------------------- | ---------- |
| `generate-export`          | 1 156  | Generation d'exports CSV/Excel/PDF avec QR codes | QR Server API       | Production |
| `generate-report`          | 874    | Generation de rapports                           | --                  | Production |
| `budget-alerts`            | 508    | Alertes seuils budgetaires                       | --                  | Production |
| `workflow-validation`      | 454    | Validation transitions workflow                  | --                  | Production |
| `validate-workflow`        | 447    | Validation etapes workflow                       | --                  | Production |
| `generate-bordereau`       | 397    | Generation bordereaux                            | --                  | Production |
| `bulk-operations`          | 391    | Operations en masse                              | --                  | Production |
| `process-reglement`        | 355    | Traitement reglements                            | --                  | Production |
| `send-notification-email`  | 300    | Envoi d'emails de notification workflow          | Resend API          | Production |
| `generate-dashboard-stats` | 280    | Statistiques dashboard                           | --                  | Production |
| `r2-storage`               | 222    | Stockage fichiers via URLs presignees            | Cloudflare R2       | Production |
| `create-user`              | 183    | Creation d'utilisateur avec role (admin)         | Supabase Auth Admin | Production |

> Documentation API detaillee : [API_EDGE_FUNCTIONS.md](API_EDGE_FUNCTIONS.md)

---

## 7. Bugs Connus

| ID   | Description                        | Severite | Module    | Status   |
| ---- | ---------------------------------- | -------- | --------- | -------- |
| #001 | ~~Direction sans profiles~~        | Minor    | Notes SEF | Corrige  |
| #002 | Timeout import gros fichiers Excel | Medium   | Import    | En cours |
| #003 | Pagination lente sur +1000 lignes  | Low      | Listes    | Planifie |

---

## 8. Dette Technique

### 8.1 Priorite Haute

- [ ] Ajouter tests unitaires hooks principaux
- [ ] Refactorer composants >500 lignes
- [ ] Normaliser les messages d'erreur

### 8.2 Priorite Moyenne

- [ ] Migrer vers React Query v6 patterns
- [ ] Optimiser les requetes N+1
- [ ] Ajouter skeleton loaders coherents

### 8.3 Priorite Basse

- [ ] Internationalisation (i18n)
- [ ] Mode hors ligne (PWA)
- [ ] Theme customisable

---

## 9. Historique des Versions

### v1.1 RC (2026-02-13)

- Gaps 2+3 resolus : delegations et interims dans le workflow backend
- Gap 4 resolu : notifications avec delegations/interims
- Panneau de detail Notes SEF (Sheet 4 onglets avec PJ, historique, AEF liee)
- Export Excel enrichi (colonne Montant estime)
- CSP headers de securite
- RLS DAAF pour notes soumises/a_valider
- Limite 3 PJ par note avec trigger DB
- Badge "Migre" et flag is_migrated
- Format reference ARTI00MMYYNNNN corrige
- Index de performance ajoutes
- 275 tests unitaires, 190+ migrations

### v1.0 RC (2026-02-06)

- Migration SQL Server vers Supabase terminee (100%)
- 27 117 pieces jointes migrees (26 Go)
- 173 migrations de base de donnees
- 4 Edge Functions operationnelles
- Module Reglements ameliore
- Tests E2E ajoutes (22 fichiers)
- Documentation technique mise a jour

### v0.9 Beta (2026-01-15)

- Chaine de depense complete (9 etapes)
- Documentation technique complete
- Users test configures
- RLS sur toutes les tables critiques

### v0.8 Alpha (2026-01-10)

- Module Notes SEF finalise
- Import budget Excel
- Systeme de virements
- Alertes budgetaires

### v0.7 Alpha (2026-01-05)

- Structure DB complete
- Authentification
- RBAC de base
- Premiers modules

---

## 10. Metriques Qualite

| Metrique               | Valeur       | Objectif |
| ---------------------- | ------------ | -------- |
| Tables avec RLS        | 95%          | 100%     |
| Couverture tests       | 20%          | 60%      |
| Documentation modules  | 100% (13/13) | 100%     |
| TypeScript strict      | Oui          | Oui      |
| Pas de `any` explicite | 90%          | 100%     |
| Tests E2E              | 69 fichiers  | 80+      |
| Fichiers source        | 802          | --       |
| Lignes de code         | 279 872      | --       |

---

## 11. Prochaines Etapes

### Sprint actuel (fevrier 2026)

1. [ ] Finaliser module Reglements (UI + Edge Functions)
2. [ ] Ecrire tests E2E pour workflow Reglements
3. [ ] Completer Edge Functions manquantes
4. [ ] Mise a jour documentation technique

### Sprint suivant

1. [ ] Integrer notifications email
2. [ ] Export PDF ordonnancements
3. [ ] Ameliorer UX mobile

### Sprint futur

1. [ ] Module Recettes complet
2. [ ] Reporting analytique
3. [ ] Performance optimization

---

## 12. Contacts

| Role              | Responsabilite                   |
| ----------------- | -------------------------------- |
| **Product Owner** | Definition besoins, priorisation |
| **Tech Lead**     | Architecture, code review        |
| **DBA**           | Schema DB, performances          |
| **QA**            | Tests, validation                |

---

## 13. BACKEND — Inventaire Complet Supabase

> **Date inventaire : 2026-02-19**
> **Source : SQL Editor Supabase (requetes information_schema + pg_catalog)**

### 13.1 Vue d'ensemble schema public

| Metrique                        | Valeur              |
| ------------------------------- | ------------------- |
| Tables                          | **201**             |
| Tables avec donnees (>0 lignes) | **97**              |
| Total lignes (toutes tables)    | **88 899**          |
| FK Constraints                  | **439**             |
| Indexes                         | **803**             |
| RLS Policies                    | **526**             |
| Tables avec RLS                 | **199** / 201 (99%) |
| Triggers                        | **273**             |
| Functions / RPC                 | **359**             |
| Migrations                      | **253**             |
| Edge Functions                  | **12**              |

### 13.2 Row counts — Chaine de depense

| #   | Table                 | Lignes | Description                |
| --- | --------------------- | ------ | -------------------------- |
| 1   | `notes_sef`           | 4 845  | Notes SEF (demandes)       |
| 2   | `notes_dg`            | 9      | Notes AEF (autorisations)  |
| 3   | `imputations`         | 1      | Imputations budgetaires    |
| 4   | `expressions_besoin`  | 3 146  | Expressions de besoin      |
| 5a  | `passation_marche`    | 7      | Passation (chaine depense) |
| 5b  | `marches`             | 16     | Marches (workflow complet) |
| 6   | `budget_engagements`  | 5 663  | Engagements budgetaires    |
| 7   | `budget_liquidations` | 4 355  | Liquidations               |
| 8   | `ordonnancements`     | 3 363  | Ordonnancements            |
| 9   | `reglements`          | 0      | Reglements                 |
| —   | `credit_transfers`    | 7      | Virements de credits       |

### 13.3 Row counts — Tables support

| Table                        | Lignes | Description                    |
| ---------------------------- | ------ | ------------------------------ |
| `profiles`                   | 78     | Utilisateurs                   |
| `directions`                 | 25     | Directions / services          |
| `prestataires`               | 431    | Fournisseurs / prestataires    |
| `budget_lines`               | 765    | Lignes budgetaires             |
| `notifications`              | 9 904  | Notifications utilisateurs     |
| `logs_actions`               | 20 592 | Journal d'actions              |
| `audit_logs`                 | 238    | Piste d'audit                  |
| `engagement_documents`       | 22 664 | Documents engagements (migres) |
| `notes_sef_history`          | 4 901  | Historique notes SEF           |
| `treasury_movements`         | 3 601  | Mouvements tresorerie          |
| `reamenagements_budgetaires` | 2 007  | Reamenagements                 |
| `role_permissions`           | 380    | Permissions par role           |
| `nomenclature_nbe`           | 499    | Nomenclature NBE               |
| `plan_comptable_sysco`       | 400    | Plan comptable SYSCOA          |
| `personnel_arti`             | 104    | Personnel ARTI                 |
| `user_roles`                 | 81     | Roles utilisateurs             |
| `marche_historique`          | 14     | Historique statuts marches     |
| `notification_templates`     | 17     | Templates notifications        |
| `notification_recipients`    | 28     | Destinataires notifications    |
| `notification_role_settings` | 35     | Parametres notif par role      |
| `permission_actions`         | 120    | Actions de permission          |
| `custom_roles`               | 10     | Roles personnalises            |
| `exercices_budgetaires`      | 2      | Exercices (2025, 2026)         |

### 13.4 FK Relations (439 contraintes, 132 tables sources)

Tables les plus connectees (FK sortantes) :

| Table                 | FK sortantes                                                 |
| --------------------- | ------------------------------------------------------------ |
| `notes_dg`            | 17 (action, activite, budget_line, direction, etc.)          |
| `notes_sef`           | 16 (direction, dossier, projet, redacteur, etc.)             |
| `imputations`         | 16 (action, activite, budget_line, note_aef, etc.)           |
| `budget_lines`        | 15 (action, activite, direction, mission, nbe, etc.)         |
| `dossiers`            | 13 (action, beneficiaire, budget_line, direction, etc.)      |
| `passation_marche`    | 10 (direction, dossier, expression_besoin, etc.)             |
| `ordonnancements`     | 9 (dossier, liquidation, signed_daaf_by, etc.)               |
| `expressions_besoin`  | 9 (direction, dossier, imputation, ligne_budgetaire, etc.)   |
| `budget_engagements`  | 7 (budget_line, dossier, expression_besoin, marche, etc.)    |
| `marches`             | 7 (budget_line, direction, dossier, expression_besoin, etc.) |
| `contrats`            | 6 (dossier, engagement, lot, marche, prestataire)            |
| `budget_liquidations` | 6 (dossier, engagement, rejected_by, etc.)                   |
| `reglements`          | 4 (compte, dossier, ordonnancement)                          |

Table la plus referencee (FK entrantes) : `profiles` (~120 FK entrantes)

### 13.5 RLS Policies (526 policies, 199 tables)

Patterns RLS utilises :

| Pattern            | Description                                 | Exemple                                                   |
| ------------------ | ------------------------------------------- | --------------------------------------------------------- |
| Standard           | `SELECT` auth + `ALL` admin                 | `actions`, `directions`, `budget_lines`                   |
| Chaine depense     | SELECT direction + UPDATE role + INSERT own | `notes_sef`, `notes_dg`, `engagements`                    |
| Confidentiel       | Acces restreint par role                    | `soumissions`, `marche_offres`                            |
| V2 Passation       | CRUD nomme (`pm_select_v2`, etc.)           | `passation_marche`, `lots_marche`, `soumissionnaires_lot` |
| Direction-filtered | Filtre par direction utilisateur            | `marches`, `expressions_besoin`                           |

Helpers RLS : `is_admin()`, `is_dg()`, `is_daaf()`, `is_cb()`, `get_user_direction_id()`

### 13.6 Triggers (273)

Par table (top 10) :

| Table                 | Triggers | Fonctions cles                                |
| --------------------- | -------- | --------------------------------------------- |
| `notes_dg`            | 21       | reference, workflow AEF, audit, dossier       |
| `budget_engagements`  | 20       | numero, lock, docs, ELOP, workflow            |
| `notes_sef`           | 18       | reference, workflow, notifications, audit     |
| `budget_liquidations` | 18       | numero, lock, ELOP, differe, workflow         |
| `ordonnancements`     | 16       | numero, lock, ELOP, signatures, workflow      |
| `reglements`          | 16       | numero, tresorerie, budget, dossier, workflow |
| `expressions_besoin`  | 11       | numero, audit, workflow, montant              |
| `imputations`         | 11       | coherence, chain, reference, budget           |
| `marches`             | 10       | numero, direction, log, validation            |
| `passation_marche`    | 9        | reference, budget_line, lock, direction       |

Categories :

| Categorie                        | Nombre |
| -------------------------------- | ------ |
| `updated_at` (timestamp auto)    | ~60    |
| Workflow / notifications         | ~50    |
| Generation numeros / references  | ~30    |
| Audit / logging                  | ~25    |
| Validation / coherence           | ~20    |
| Recalcul ELOP (budget)           | ~15    |
| Dossier propagation              | ~15    |
| Divers (stock, tresorerie, etc.) | ~58    |

### 13.7 Functions / RPC (359)

Par categorie :

| Categorie               | Nombre | Exemples                                                        |
| ----------------------- | ------ | --------------------------------------------------------------- |
| Trigger functions       | ~80    | `fn_log_notes_sef_changes()`, `fn_enforce_eb_workflow()`        |
| Generation references   | ~35    | `generate_note_sef_numero()`, `generate_marche_numero()`        |
| Workflow / transitions  | ~25    | `advance_workflow()`, `fn_transition_marche()`                  |
| Permissions / RBAC      | ~20    | `has_role()`, `has_permission()`, `is_admin()`                  |
| Audit / logging         | ~20    | `log_action()`, `log_audit_action()`                            |
| Budget / disponibilite  | ~15    | `check_budget_availability()`, `execute_credit_transfer()`      |
| Notifications           | ~15    | `send_bulk_notifications()`, `render_notification_template()`   |
| Admin workflow engine   | ~15    | `wf_admin_upsert_step()`, `wf_admin_upsert_workflow()`          |
| Dossier lifecycle       | ~15    | `bloquer_dossier()`, `cloture_dossier_on_reglement_complete()`  |
| Dashboard / stats       | ~10    | `get_dashboard_data()`, `get_dmg_dashboard_data()`              |
| Import / migration      | ~10    | `create_import_run()`, `sync_referentiels_from_import()`        |
| Recherche paginee       | ~8     | `search_notes_sef_v2()`, `search_notes_aef()`                   |
| Libelles / dictionnaire | ~8     | `update_budget_libelle()`, `get_libelle_effectif()`             |
| QR / documents          | ~5     | `verify_document_qr()`, `register_generated_document()`         |
| Prestataires            | ~5     | `validate_prestataire_request()`, `generate_prestataire_code()` |
| Interims / delegations  | ~5     | `create_interim()`, `has_active_delegation()`                   |
| Codification            | ~5     | `generate_budget_code_v2()`, `generate_code_from_pattern()`     |
| Divers                  | ~63    | updated_at helpers, parsers, etc.                               |

> **~310 / 359 fonctions** sont `SECURITY DEFINER` (execution avec privileges du createur)

### 13.8 Edge Functions (12)

| Fonction                   | Description                                   | Statut  |
| -------------------------- | --------------------------------------------- | ------- |
| `budget-alerts`            | Detection et envoi alertes seuils budgetaires | Deploye |
| `bulk-operations`          | Operations en masse (validation, export)      | Deploye |
| `create-user`              | Creation utilisateur avec role (admin)        | Deploye |
| `generate-bordereau`       | Generation bordereaux PDF                     | Deploye |
| `generate-dashboard-stats` | Calcul statistiques dashboard                 | Deploye |
| `generate-export`          | Export CSV/Excel/PDF avec QR codes            | Deploye |
| `generate-report`          | Generation rapports financiers                | Deploye |
| `process-reglement`        | Traitement reglement et mouvement bancaire    | Deploye |
| `r2-storage`               | Stockage fichiers via Cloudflare R2           | Deploye |
| `send-notification-email`  | Envoi emails notification (Resend)            | Deploye |
| `validate-workflow`        | Validation etapes workflow                    | Deploye |
| `workflow-validation`      | Validation avancee workflow multi-niveaux     | Deploye |

### 13.9 Variables d'environnement (.env)

| Variable                        | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `VITE_SUPABASE_PROJECT_ID`      | ID projet Supabase (`tjagvgqthlibdpvztvaf`) |
| `VITE_SUPABASE_URL`             | URL API Supabase                            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Cle anon publique (JWT)                     |

> Aucune cle secrete (service_role_key) dans le `.env` frontend.
> Les cles sensibles sont dans les Edge Functions secrets et `.mcp.json`.

### 13.10 Tables vides notables (0 lignes)

| Table                      | Raison                                         |
| -------------------------- | ---------------------------------------------- |
| `reglements`               | Module en developpement                        |
| `contrats`                 | Module non utilise en production               |
| `articles` / `inventaires` | Approvisionnement non deploye                  |
| `recettes`                 | Module recettes non deploye                    |
| `operations_tresorerie`    | Tresorerie non deployee                        |
| `workflow_instances`       | Workflow engine v2 non active                  |
| `soumissions`              | Table `marches` workflow (pas encore utilisee) |
| `lots_marche`              | Passation non allotie actuellement             |
| `expression_besoin_lignes` | Lignes EB via JSONB (pas table relationnelle)  |
| `delegations`              | Aucune delegation active                       |
| `interims`                 | Aucun interim actif                            |

---

_Derniere mise a jour: 2026-02-19_
