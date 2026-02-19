# Architecture Technique SYGFP

> Derniere mise a jour : 2026-02-19

## Vue d'ensemble

SYGFP (Systeme de Gestion des Finances Publiques) est l'application de gestion de la chaine de depense de l'**ARTI** (Autorite de Regulation du Transport Interieur, Cote d'Ivoire). Stack React/TypeScript + Supabase. Migration SQL Server terminee (fevrier 2026).

## Stack Technique

| Composant  | Technologie              | Version |
| ---------- | ------------------------ | ------- |
| Frontend   | React                    | 18.3.1  |
| Language   | TypeScript (strict)      | 5.6.2   |
| Build      | Vite                     | 5.4.19  |
| UI         | Tailwind CSS + shadcn/ui |         |
| State      | TanStack Query           | 5.60.5  |
| Forms      | State-based / RHF + Zod  |         |
| Backend    | Supabase (PostgreSQL)    |         |
| Tests Unit | Vitest                   |         |
| Tests E2E  | Playwright               |         |

## Metriques (19/02/2026)

| Metrique        | Valeur                       |
| --------------- | ---------------------------- |
| Fichiers source | 802 (TS + TSX)               |
| Lignes de code  | 279 872                      |
| Pages           | 115 fichiers (12 sections)   |
| Composants      | 417 fichiers (50 modules)    |
| Hooks           | 165 fichiers (58 733 lignes) |
| Lib/Utils       | 45 fichiers (12 951 lignes)  |
| Services        | 17 fichiers (5 757 lignes)   |
| Contextes       | 2 (Exercice, RBAC)           |
| Routes          | 111                          |
| Tables DB       | 201 (199 avec RLS)           |
| Migrations      | 253                          |
| Edge Functions  | 12 (5 567 lignes)            |
| RLS Policies    | 526                          |
| Functions / RPC | 359                          |
| Triggers        | 273                          |
| Tests unitaires | 7 fichiers                   |
| Tests E2E       | 69 fichiers                  |

---

## ARCHITECTURE FRONTEND

### F1. Arbre des composants par module

```
src/
├── components/                           # 417 fichiers TSX, 50 modules
│   │
│   ├── ui/                    (48)       # shadcn/ui : Button, Card, Dialog, Tabs, Table, Badge...
│   ├── layout/                (3)        # Sidebar, Header, MainLayout
│   ├── shared/                (15)       # PageHeader, EmptyState, StatutBadge, Pagination...
│   │
│   │  ── CHAINE DE DEPENSE ──
│   │
│   ├── notes-sef/             (22)       # NoteSEFForm (1177L), NoteSEFDetails (1019L),
│   │                                     # NoteSEFDetailSheet (702L), NoteSEFList (516L),
│   │                                     # ImputationDGSection, ValidationDGSection,
│   │                                     # TeamNotesView, FilePreview, NotesSEFTable,
│   │                                     # NoteSEFPreviewDrawer, NotesSEFExports,
│   │                                     # NoteSEFChecklist, LinkedNAEFList, NoteSEFValidationCard,
│   │                                     # NSEFParentSelector, NotesSEFFilters,
│   │                                     # NoteSEFCreateAEFButton, NoteSEFDeferDialog,
│   │                                     # NotesSEFListV2, TypeNoteSelector,
│   │                                     # NoteSEFRejectDialog, NotesSEFTabs
│   │
│   ├── notes-aef/             (8)        # NoteAEFDetailSheet (1450L), NoteAEFForm (1019L),
│   │                                     # NoteAEFImputeDialog (733L), NoteAEFList (489L),
│   │                                     # LignesEstimativesEditor (470L), NoteAEFDetails (420L),
│   │                                     # NoteAEFDeferDialog, NoteAEFRejectDialog
│   │
│   ├── notes-dg-officielles/  (5)        # NoteDGDetails, NoteDGList, NoteDGForm,
│   │                                     # NoteDGImputationForm, NoteDGRejectDialog
│   │
│   ├── imputation/            (11)       # ImputationDetailSheet (1336L), ImputationForm (1049L),
│   │                                     # BudgetLineSelector (854L), DossierImputationSummary,
│   │                                     # ImputationCodeDisplay, ImputationSummaryCard,
│   │                                     # ImputationDetails, ImputationValidationDialog,
│   │                                     # ImputationList, ImputationDeferDialog,
│   │                                     # ImputationRejectDialog
│   │
│   ├── expression-besoin/     (11)       # ExpressionBesoinDetails (1327L),
│   │                                     # ExpressionBesoinFromImputationForm (708L),
│   │                                     # ArticlesTableEditor (476L), ExpressionBesoinList,
│   │                                     # ExpressionBesoinForm, ExpressionBesoinTimeline,
│   │                                     # VerifyDialog, ValidateDialog, DeferDialog,
│   │                                     # RejectDialog, ExportButton
│   │
│   ├── passation-marche/      (15)       # PassationMarcheForm (1235L), PassationDetails (1149L),
│   │                                     # EvaluationCOJO (989L), SoumissionnairesSection (578L),
│   │                                     # WorkflowActionBar (502L), PassationChecklist (412L),
│   │                                     # EvaluationGrid, ComparatifEvaluation,
│   │                                     # TableauComparatif, PassationTimeline,
│   │                                     # PassationChainNav, DeferDialog, ValidateDialog,
│   │                                     # RejectDialog, ExportButton
│   │
│   ├── engagement/            (11)       # EngagementChecklist (550L), EngagementFromPMForm (433L),
│   │                                     # EngagementForm (421L), EngagementTimeline (340L),
│   │                                     # EngagementDetails, EngagementList, PieceEngagement,
│   │                                     # PrintDialog, DeferDialog, ValidateDialog, RejectDialog
│   │
│   ├── liquidation/           (11)       # LiquidationForm (797L), LiquidationDetails (481L),
│   │                                     # ControleSdctForm (473L), LiquidationChecklist (449L),
│   │                                     # ValidationDgForm (445L), ServiceFaitForm (399L),
│   │                                     # LiquidationTimeline, LiquidationList,
│   │                                     # RejectDialog, DeferDialog, ValidateDialog
│   │
│   ├── ordonnancement/        (11)       # OrdonnancementForm (527L), OrdonnancementDetails (469L),
│   │                                     # ValidationDgOrdonnancement (397L), ParapheurIntern (380L),
│   │                                     # OrdonnancementTimeline, OrdonnancementSignatures,
│   │                                     # OrdonnancementList, OrdrePayer,
│   │                                     # DeferDialog, RejectDialog, ValidateDialog
│   │
│   ├── reglement/             (8)        # ReglementDetails (743L), ReglementForm (657L),
│   │                                     # ReglementReceipt (587L), BordereauReglement (522L),
│   │                                     # MouvementsBancairesDialog (467L), ReglementTimeline,
│   │                                     # ReglementPartielManager, ReglementList
│   │
│   │  ── MODULES SUPPORT ──
│   │
│   ├── budget/                (32)       # ImportExcelWizard (1179L), BudgetImportAdvanced (841L),
│   │                                     # BudgetMovementJournal, BudgetLineEditDialog,
│   │                                     # BudgetLabelHistory, ReamenagementForm,
│   │                                     # BudgetLineDetailSheet, BudgetTreeView,
│   │                                     # BudgetFilters, BudgetVersionHistory, ...
│   │
│   ├── marches/               (10)       # MarcheForm (530L), MarcheOffresList, MarcheOffresTab,
│   │                                     # MarcheDetails, MarcheList, MarcheDocumentsTab,
│   │                                     # MarcheHistoriqueTab, DeferDialog, ValidateDialog,
│   │                                     # RejectDialog
│   │
│   ├── dashboard/             (25)       # DashboardKPI (813L), ExecutionKPIDashboard (719L),
│   │                                     # DashboardDG (710L), DashboardGeneric,
│   │                                     # DashboardAICB, DashboardDSI, DashboardCharts,
│   │                                     # DashboardAnalytics, KPICards, DashboardMissions,
│   │                                     # DashboardHR, BudgetAlertsWidget, ...
│   │
│   ├── workflow/              (14)       # SpendingCaseTimeline (628L), WorkflowTaskCenter (497L),
│   │                                     # WorkflowTimeline (476L), ChaineDepenseVisuel,
│   │                                     # WorkflowGuidancePanel, ChaineDepenseStepper,
│   │                                     # WorkflowActionsBar, ChaineDepenseCompact, ...
│   │
│   ├── prestataires/          (10)       # PrestataireForm, PrestataireList, PrestataireDetail, ...
│   ├── canvas/                (9)        # NoteCanvas, CanvasEditor, CanvasToolbar, ...
│   ├── notifications/         (9)        # NotificationList, NotificationSettings, ...
│   ├── planification/         (9)        # PlanificationBudget, FeuilleRouteForm, ...
│   ├── import-export/         (8)        # ImportWizard, ExcelParser, ImportValidation, ...
│   ├── attachments/           (8)        # FileUpload, FileList, FilePreview, MigratedBadge, ...
│   ├── dossier/               (14)       # DossierDetail, DossierTimeline, DossierFilters, ...
│   ├── etats/                 (6)        # EtatsExecution, EtatsFilters, ...
│   ├── admin/                 (15)       # UserManagement, RoleEditor, DelegationForm, ...
│   ├── audit/                 (5)        # AuditTimeline, AuditTable, ...
│   ├── exercice/              (5)        # ExerciceSelector, ExerciceForm, ...
│   ├── tresorerie/            (4)        # TresorerieTable, MouvementsForm, ...
│   ├── auth/                  (4)        # LoginForm, ForgotPassword, ResetPassword, AuthLayout
│   ├── validation/            (4)        # ValidationDialog, ValidationHistory, ...
│   ├── export/                (4)        # ExportDropdown, ExportProgress, ...
│   ├── codification/          (4)        # CodificationEditor, CodificationPreview, ...
│   ├── search/                (3)        # GlobalSearch, SearchResults, SearchFilters
│   ├── qrcode/                (3)        # QRCodeGenerator, QRCodeVerify, QRCodeBadge
│   ├── interim/               (3)        # InterimForm, InterimList, InterimBadge
│   ├── coherence/             (3)        # CoherenceCheck, CoherenceReport, ...
│   ├── dmg/                   (3)        # DMGDashboard, DMGStats, DMGKPIs
│   ├── ged/                   (3)        # DocumentViewer, DocumentManager, ...
│   ├── recettes/              (2)        # RecetteForm, RecetteList
│   ├── contrats/              (2)        # ContratForm, ContratList
│   ├── command-palette/       (1)        # CommandPalette
│   ├── direction/             (1)        # DirectionDashboard
│   └── roadmap/               (1)        # RoadmapView
│
├── hooks/                     (165)      # Hooks TanStack Query (details section F2)
│
├── pages/                     (115)      # Pages par section (details section F3)
│   ├── admin/                 (29)
│   ├── planification/         (17)
│   ├── execution/             (7)
│   ├── tresorerie/            (5)
│   ├── contractualisation/    (5)
│   ├── programmatique/        (4)
│   ├── gestion-taches/        (4)
│   ├── auth/                  (3)
│   ├── dg/                    (2)
│   ├── recettes/              (1)
│   ├── approvisionnement/     (1)
│   ├── budget/                (1)
│   └── racine/                (36)       # NotesSEF, Engagements, Liquidations, Dashboard, ...
│
├── lib/                       (45)       # Utilitaires par domaine
│   ├── config/                (3)        # rbac-config (1214L), sygfp-constants, document-permissions
│   ├── workflow/              (6)        # workflowEngine (726L), transitionService, paniers, statuts
│   ├── notes-sef/             (6)        # notesSefService, constants, types, helpers, referenceService
│   ├── notes-aef/             (3)        # constants, notesAefService, types
│   ├── pdf/                   (5)        # generateNotePDF, pdfHeader, pdfFooter, pdfStyles
│   ├── export/                (4)        # export-service (638L), export-templates, export-branding
│   ├── excel/                 (4)        # generateExcel, excelStyles, excelFormats
│   ├── rbac/                  (4)        # permissions, config, types
│   ├── budget/                (2)        # imputation-utils
│   └── ...                    (8)        # validations, templates, feature-flags, errors, utils
│
├── services/                  (17)       # Services PDF, storage, attachments
│   ├── noteSEFPdfService.ts   (745L)
│   ├── noteDGPdfService.ts    (651L)
│   ├── attachmentService.ts   (631L)
│   ├── noteDirectionPdfService.ts (585L)
│   ├── noteDirectionDocxService.ts (568L)
│   ├── passationExportService.ts (441L)
│   ├── pvCojoPdfService.ts    (382L)
│   ├── migratedFilesService.ts (359L)
│   ├── expressionBesoinArticlesPdfService.ts (283L)
│   ├── r2Storage.ts           (276L)
│   └── storage/               (6)        # localProvider, namingService, r2Provider,
│                                         # supabaseProvider, storageFactory, types
│
├── contexts/                  (2)
│   ├── ExerciceContext.tsx     (310L)     # Exercice budgetaire actif (multi-exercice)
│   └── RBACContext.tsx         (330L)     # Roles, permissions, profils, delegations
│
├── integrations/supabase/     (2)
│   ├── types.ts               (18220L)   # Types auto-generes (tables, views, functions, enums)
│   └── client.ts              (42L)      # Client Supabase singleton
│
└── types/                     (3)
    ├── spending-case.ts       (353L)     # Types dossier de depense
    ├── roadmap.ts             (116L)     # Types feuilles de route
    └── validation.ts          (103L)     # Types workflow validation
```

---

### F2. Hooks par module de la chaine de depense

```
hooks/
│
│  ── CHAINE DE DEPENSE ──
│
├── Notes SEF (8 hooks, 3 738L)
│   ├── useNotesSEF.ts              (896L)   CRUD principal, mutations, filters
│   ├── useNotesSEFExport.ts        (936L)   Export Excel/PDF/CSV
│   ├── useNotesSEFList.ts          (230L)   Liste paginee, tri, recherche
│   ├── useNotesSEFAudit.ts         (268L)   Historique audit trail
│   ├── useExportNoteSEFPdf.ts      (235L)   Generation PDF individuel
│   ├── useNoteSEFAutosave.ts       (175L)   Sauvegarde auto brouillon
│   ├── useNoteSEFDetail.ts         (112L)   Detail note par ID
│   └── useNotesSEFCounts.ts        (84L)    Compteurs par statut
│
├── Notes AEF (5 hooks, 2 974L)
│   ├── useNotesAEF.ts              (1421L)  CRUD principal, mutations
│   ├── useNotesAEFExport.ts        (874L)   Export Excel/PDF/CSV
│   ├── useLignesEstimativesAEF.ts  (270L)   Gestion lignes estimatives
│   ├── useNotesAEFList.ts          (247L)   Liste paginee
│   └── useNoteAEFDetail.ts         (162L)   Detail note AEF
│
├── Notes DG (4 hooks, 1 884L)
│   ├── useNotesDirectionGenerale.ts (921L)  CRUD principal
│   ├── useNotesDirection.ts        (401L)   Notes par direction
│   ├── useValidationDG.ts          (298L)   Workflow validation DG
│   └── useNoteDGPdf.ts             (264L)   Generation PDF
│
├── Imputation (6 hooks, 2 357L)
│   ├── useImputation.ts            (851L)   CRUD principal
│   ├── useImputations.ts           (388L)   Liste imputations
│   ├── useNoteImputations.ts       (356L)   Imputations par note
│   ├── useImputationValidation.ts  (302L)   Workflow validation
│   ├── useImputationsExport.ts     (299L)   Export
│   └── useImputationDetail.ts      (161L)   Detail
│
├── Expression de besoin (3 hooks, 1 398L)
│   ├── useExpressionsBesoin.ts     (826L)   CRUD principal
│   ├── useExpressionsBesoinExport.ts (512L) Export Excel/PDF/CSV
│   └── useExpressionBesoinDetail.ts (60L)   Detail EB
│
├── Passation de marche (6 hooks, 4 548L)
│   ├── usePassationsMarche.ts      (1583L)  CRUD, workflow, lots, soumissionnaires
│   ├── usePassationMarcheExport.ts (893L)   Export Excel 4 feuilles/PDF/CSV
│   ├── useMarches.ts              (542L)    Liste marches (contractualisation)
│   ├── usePassationExport.ts      (530L)    Export rapide
│   ├── useMarcheDocuments.ts      (--)      Documents marche
│   └── useMarcheOffres.ts         (--)      Offres marche
│
├── Engagement (2 hooks, 1 022L)
│   ├── useEngagements.ts           (768L)   CRUD principal
│   └── useEngagementDocuments.ts   (254L)   Documents
│
├── Liquidation (3 hooks, 1 256L)
│   ├── useLiquidations.ts          (719L)   CRUD principal
│   ├── useUrgentLiquidations.ts    (296L)   Liquidations urgentes
│   └── useLiquidationDocuments.ts  (241L)   Documents
│
├── Ordonnancement (2 hooks, 1 029L)
│   ├── useOrdonnancements.ts       (847L)   CRUD principal
│   └── useOrdonnancementSignatures.ts (182L) Signatures
│
├── Reglement (2 hooks, 1 218L)
│   ├── useReglements.ts            (840L)   CRUD principal
│   └── usePaiementsPartiels.ts     (378L)   Paiements partiels
│
│  ── MODULES SUPPORT ──
│
├── Budget (13 hooks, 5 185L)
│   usebudgetImport, useBudgetLines, useBudgetTransfers, useBudgetAvailability,
│   useBudgetMovements, useBudgetNotifications, useBudgetAlerts,
│   useBudgetLabelEditor, useBudgetLineVersions, useBudgetLineELOP,
│   useBudgetLineAudit, useExportBudgetChain, useReamenagementBudgetaire
│
├── Dashboard (10 hooks, 3 786L)
│   useDashboardByRole (914L), useDashboardStats (744L), useDashboardData,
│   useDirectionDashboard, useExecutionDashboard, useDSIDashboardStats,
│   useDashboardAlerts, useRoadmapDashboard, useDMGDashboard, useHRDashboardData
│
├── Workflow (6 hooks, 1 515L)
│   useWorkflowEngine, useWorkflowAdmin, useWorkflowTasks,
│   useWorkflowDossier, useWorkflowTransitions, useWorkflowEtapes
│
├── RBAC / Permissions (7 hooks, ~1 700L)
│   useRBACEnforcer, useRoleBasedAccess, useRoleValidation, usePermissions,
│   useDocumentPermissions, useInterimPermissions, useCheckValidationPermission
│
│  ── HOOKS TRANSVERSES (80+ hooks, ~24 800L) ──
│
├── Import / Sync : useARTIImport (862L), useReferentielSync (884L), useImportJobs (644L),
│   useFeuilleRouteImport (630L), useExcelParser (518L), useImportStaging, useImportSecurity
│
├── Audit / Logs : useAuditTrail (614L), useAuditJournal, useAuditLog
│
├── Notifications : useNotificationSettings (519L), useNotificationsEnhanced (443L),
│   useNotificationsAuto (427L), useNotificationsRealtime (408L), useNotifications
│
├── Tresorerie : useMouvementsTresorerie (475L), useApprovisionnementsTresorerie (378L),
│   useCompteBancaires (424L), useCaisses (424L), useTresorerie
│
├── Dossiers / Suivi : useDossiers (678L), useSpendingCase (514L),
│   useExportDossierComplet (552L), useDossierDetails
│
├── Planification : useRoadmapSubmissions (542L), useRoadmapDiff (436L),
│   usePlansTravail, useProjetTaches
│
├── Contractualisation : usePrestataires (430L), useContrats (395L),
│   useSupplierDocuments (339L)
│
├── Exports : useExport, useStandardExport, useExportExcel
│
├── Utilitaires : useAttachments, useFileUpload, useDocumentUpload,
│   useDocumentCompleteness, useARTIReference, useGenerateDossierRef,
│   useSequenceGenerator, useQRCode, useSidebarBadges (221L),
│   useBreadcrumbs, useSavedViews, useAlerts, useFundingSources,
│   useExerciceFilter, useExerciceWriteGuard, useSeparationOfDuties,
│   usePaymentKPIs, useTableauFinancier, usePendingTasks
│
└── Referentiels : useReferentiels, useBaseReferentiels, useReferentielsValidation,
    useCodification, useCodificationVariables, useSecteursActivite,
    useLambdaLinks, useHistoriqueLibelles, useParametresExercice,
    useModuleDocumentation, useRaciMatrix, useProductionChecklist
```

---

### F3. Pages (115 fichiers, 12 sections)

```
pages/
├── admin/                 (29)    GestionUtilisateurs, GestionRoles, GestionExercices,
│                                  JournalAudit, WorkflowAdmin, Interims, Delegations,
│                                  ParametresProgrammatiques, ParametresExercice,
│                                  ImportBudgetAdmin, CompteBancaires, OriginesFonds,
│                                  ArchitectureSYGFP, DictionnaireVariables,
│                                  ReferentielCodification, SecteursActivite,
│                                  DocumentationModules, MatriceRACI, ChecklistProduction,
│                                  LiensLambda, GestionDoublons, CompteursReferences,
│                                  GestionAnomalies, GestionAutorisations,
│                                  NotificationSettings, GestionLibellesBudget,
│                                  HistoriqueLibelles, ParametresSysteme, TestNonRegression
│
├── execution/             (7)     PassationMarche (889L), PassationApprobation (560L),
│                                  DashboardExecution, DashboardDGPage,
│                                  DashboardDirectionPage, ImputationPage, ExpressionBesoin
│
├── planification/         (17)    PlanificationBudgetaire, StructureBudgetaire, Virements,
│                                  ImportExport, PlanTravail, ProjetsList, ProjetDetail,
│                                  RoadmapDashboard, RoadmapDirection,
│                                  RoadmapSubmissionsPage, FeuilleRouteImportPage,
│                                  HistoriqueImports, AideImportBudget,
│                                  DocumentationImport, NotificationsBudgetaires,
│                                  PlanificationPhysique, MajFeuillesRoutePage
│
├── auth/                  (3)     LoginPage, ForgotPasswordPage, ResetPasswordPage
│
├── contractualisation/    (5)     Prestataires, Contrats, ComptabiliteMatiere,
│                                  DemandePrestataire, ValidationPrestataires
│
├── tresorerie/            (5)     GestionTresorerie, ApprovisionnementsBanque,
│                                  ApprovisionnementsCaisse, MouvementsBanque, MouvementsCaisse
│
├── programmatique/        (4)     ChargerBudget, ListeBudget, MiseAJourBudget, Reamenagement
│
├── gestion-taches/        (4)     EtatExecutionTachesPage, TachesRealiseesPage,
│                                  TachesDiffereesPage, MajFeuillesRoutePage
│
├── dg/                    (2)     NotesAValider, ValiderNoteDG
├── recettes/              (1)     DeclarationRecette
├── approvisionnement/     (1)     Approvisionnement
├── budget/                (1)     ReamenementsImputations
│
└── racine/                (36)    NotesSEF, NotesAEF, NotesDirectionGenerale,
                                   ValidationNotesSEF, ValidationNotesAEF, ValidationNotesDG,
                                   NoteSEFDetail, NoteAEFDetail, NoteCanvasPage,
                                   Engagements, ScanningEngagement,
                                   Liquidations, ScanningLiquidation,
                                   Ordonnancements, Reglements, Marches,
                                   Dashboard, DashboardDMG, DashboardFinancier,
                                   Recherche, Notifications, AlertesBudgetaires, Alertes,
                                   MonProfil, WorkflowTasks, EspaceDirection,
                                   SuiviDossiers, DossierDetails, EtatsExecution,
                                   ComingSoon, NotFound, SelectExercice, NoOpenExercise,
                                   VerificationNoteDG, VerifyDocument, AdminDashboardFallback
```

---

### F4. Pattern commun de chaque module

#### P1. Page liste (9 modules de la chaine + budget, marches, prestataires...)

```
┌──────────────────────────────────────────────────────┐
│ PageHeader  [titre]                  [Exporter▼] [+] │
├──────────────────────────────────────────────────────┤
│ KPI 1 │ KPI 2 │ KPI 3 │ KPI 4 │ KPI 5 │ KPI 6      │  ← Card grid md:grid-cols-6
├──────────────────────────────────────────────────────┤
│ [Tous] [Soumis] [Valide] [Differe] [Rejete]         │  ← Tabs (par statut)
├──────────────────────────────────────────────────────┤
│ Recherche: [____]  Direction: [▼]  Date: [▼]         │  ← NotesFiltersBar
├──────────────────────────────────────────────────────┤
│ Ref.  │ Objet  │ Montant │ Statut │ Date │ Actions  │  ← Table
│ ...   │ ...    │ ...     │ ...    │ ...  │ [Detail] │
├──────────────────────────────────────────────────────┤
│ ← Prev    Page 1 / 10    Next →                     │  ← NotesPagination
│ EmptyState si 0 resultats                            │  ← EmptyState
└──────────────────────────────────────────────────────┘
```

**Composants partages** : `PageHeader`, `NotesFiltersBar`, `NotesPagination`, `EmptyState`, `StatutBadge`

**Hook** : `useModuleList()` → `{ data, counts, isLoading, page, setPage, totalPages }`

**Modules** : NotesSEF, NotesAEF, NotesDG, ExpressionBesoin, PassationMarche, Engagements, Liquidations, Ordonnancements, Reglements

#### P2. Formulaire de creation (Dialog / Sheet)

```
┌──────────────────────────────────────────────────────┐
│ Dialog "Nouvelle [Entite]"                     [x]   │
├──────────────────────────────────────────────────────┤
│ Objet *           [____________________________]     │
│ Direction *       [▼ Selectionner ▼]                 │
│ Montant estime    [______________] FCFA              │
│ Source financement [▼]                               │
│ Ligne budgetaire  [▼] (filtre disponibilite)         │
│ Pieces jointes    [+ Ajouter] (max 3)               │
│                                                      │
│                          [Annuler]  [Enregistrer]    │
└──────────────────────────────────────────────────────┘
```

**State** : `useState<FormData>` + `errors: Record<string, string>` + `validate()`

#### P3. Panneau detail avec onglets (Sheet / Dialog)

```
┌──────────────────────────────────────────────────────┐
│ Detail "[Entite] REF-001"                      [x]   │
├──────────────────────────────────────────────────────┤
│ [Infos] [Budget] [Documents] [Historique] [Chaine]   │  ← Tabs internes
├──────────────────────────────────────────────────────┤
│                                                      │
│  Reference : ARTI00022602001                         │
│  Objet     : Fournitures de bureau                   │
│  Montant   : 1 500 000 FCFA                          │
│  Statut    : [Badge vert] Valide                     │
│  Direction : DSI                                     │
│  ...                                                 │
│                                                      │
├──────────────────────────────────────────────────────┤
│ [Rejeter]     [Differer]     [Valider]               │  ← Actions workflow
└──────────────────────────────────────────────────────┘
```

**Variante Passation** : 7 onglets (Infos, Lots, Soumissionnaires, Evaluation, Comparatif, Documents, Chaine)

#### P4. Page validation / approbation (DG, DAAF)

```
┌──────────────────────────────────────────────────────┐
│ "Approbation [Module]"                               │
├──────────────────────────────────────────────────────┤
│ En attente: 5 │ Montant total: 45M FCFA │ Urgents: 2│  ← KPIs
├──────────────────────────────────────────────────────┤
│ [En attente]  [Historique]                           │  ← Tabs
├──────────────────────────────────────────────────────┤
│ Table avec [Approuver] [Rejeter] par ligne           │
│ → Dialog motif obligatoire pour rejet/differ         │
└──────────────────────────────────────────────────────┘
```

**RBAC** : Acces restreint par role (DG, DAAF, CB)

#### P5. Barre chaine de depense (Chain Nav)

```
[✓ EB REF-001] ──→ [● Passation PM-001] ──→ [○ Engagement]
   completed            current                  pending
```

Navigation horizontale entre etapes liees. Cliquable si url disponible.

#### P6. Export (Excel / PDF / CSV)

```
[▼ Exporter]
  ├── [📊] Excel complet (multi-feuilles)
  ├── [📄] PDF rapport (en-tete ARTI)
  └── [📋] CSV
```

**Hook** : `useModuleExport()` → `{ exportExcel, exportPDF, exportCSV, isExporting }`

**Libraries** : `xlsx` (Excel), `jspdf` + `jspdf-autotable` (PDF), `@/lib/export/export-service` (CSV)

#### P7. Workflow action bar

```
[Brouillon]→[Publie]→[Cloture]→[Evalue]→[Attribue]→[Approuve]→[Signe]
    ███        ───       ───       ───       ───        ───       ───
```

Timeline visuelle + boutons conditionnels par `role` + `statut` + prerequis.

---

### F5. Flux de donnees React

```
                    ┌─────────────────────┐
                    │   ExerciceContext    │  Fournit exercice actif (2025, 2026)
                    │   useExercice()     │  Filtre toutes les requetes par annee
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │    RBACContext       │  Fournit roles, permissions, delegations
                    │    useRBAC()        │  Controle affichage boutons/pages
                    └────────┬────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
   │  Page Liste  │  │ Page Detail  │  │ Page Valid.  │
   │  (pattern P1)│  │ (pattern P3) │  │ (pattern P4) │
   └──────┬──────┘  └───────┬──────┘  └───────┬──────┘
          │                  │                  │
   ┌──────▼──────────────────▼──────────────────▼──────┐
   │                  Hook useModule()                  │
   │  - useQuery({ queryKey, queryFn })   → lecture     │
   │  - useMutation({ mutationFn })       → ecriture    │
   │  - queryClient.invalidateQueries()   → refresh     │
   │  - staleTime: 30_000                → cache 30s    │
   └──────────────────────┬────────────────────────────┘
                          │
                ┌─────────▼─────────┐
                │   Supabase Client │
                │   supabase.from() │  PostgREST → PostgreSQL
                │   .select()       │  Filtre par exercice + RLS
                │   .insert()       │  Triggers DB (audit, numeros)
                │   .update()       │  RLS policies (526)
                └─────────┬─────────┘
                          │
                ┌─────────▼─────────┐
                │   PostgreSQL DB   │
                │   201 tables      │
                │   273 triggers    │
                │   359 functions   │
                │   526 RLS         │
                └───────────────────┘
```

#### Cycle de vie d'une action utilisateur

```
1. Utilisateur clique [Valider]
   │
2. Composant appelle mutation.mutate({ id, statut: 'valide' })
   │
3. Hook useMutation → supabase.from('notes_sef').update({ statut: 'valide' })
   │
4. PostgreSQL :
   ├── RLS policy verifie le role (has_role + direction)
   ├── Trigger BEFORE UPDATE verifie les prerequis
   ├── UPDATE execute
   ├── Trigger AFTER UPDATE :
   │   ├── log_action() → logs_actions
   │   ├── send_notification() → notifications
   │   └── update_dossier_status() → dossiers
   │
5. onSuccess :
   ├── queryClient.invalidateQueries(['notes-sef']) → refetch liste
   ├── toast.success('Note validee') → feedback utilisateur
   └── useSidebarBadges refetch (30s) → badges sidebar mis a jour
```

---

### F6. Composants partages (`src/components/shared/`)

| Composant               | Lignes | Usage                                       |
| ----------------------- | ------ | ------------------------------------------- |
| `DossierStepTimeline`   | 450    | Timeline 9 etapes chaine de depense         |
| `DocumentUpload`        | 248    | Upload fichiers avec validation             |
| `NotesFiltersBar`       | 244    | Barre recherche + filtres direction/date    |
| `ARTIReferenceBadge`    | 232    | Badge reference ARTI avec copie             |
| `EmptyState`            | 177    | Illustration + message quand liste vide     |
| `PageHeader`            | 176    | Titre page + boutons actions                |
| `GenericDeferDialog`    | 161    | Dialog "Differer" avec motif obligatoire    |
| `NotesPagination`       | 152    | Pagination (page, pageSize, total)          |
| `FundingSourceSelect`   | 149    | Selecteur source de financement             |
| `GenericValidateDialog` | 118    | Dialog "Valider" avec confirmation          |
| `ListFilters`           | 111    | Filtres generiques                          |
| `GenericRejectDialog`   | 108    | Dialog "Rejeter" avec motif obligatoire     |
| `StatutBadge`           | 90     | Badge colore par statut (valide/rejete/...) |
| `ErrorBoundary`         | 79     | Catch erreurs React                         |
| `PageLoader`            | 66     | Spinner plein ecran                         |

---

## Migration SQL Server vers Supabase

> Statut : TERMINEE (fevrier 2026)

| Donnee          | SQL Server | Supabase                | Statut |
| --------------- | ---------- | ----------------------- | ------ |
| Notes SEF       | 4 823      | 4 836                   | Migre  |
| Engagements     | ~1 700     | 2 805                   | Migre  |
| Liquidations    | 2 954      | 3 633                   | Migre  |
| Ordonnancements | 2 726      | 3 501                   | Migre  |
| Fournisseurs    | 426        | 431                     | Migre  |
| Pieces jointes  | 9 375 ref. | 27 117 fichiers (26 Go) | Migre  |

## Chaine de Depense (9 etapes)

```
notes_sef ──(note_sef_id)──> notes_dg (AEF)
  ──(note_aef_id)──> imputations
    ──(imputation_id)──> expressions_besoin
      ──(expression_besoin_id)──> passation_marche
        ──(passation_marche_id)──> budget_engagements
          ──(engagement_id)──> budget_liquidations
            ──(liquidation_id)──> ordonnancements
              ──(ordonnancement_id)──> reglements
```

Chaque etape :

- A ses hooks (`useNotesSEF.ts`, `useEngagements.ts`, etc.)
- A sa page (`/notes-sef`, `/engagements`, etc.)
- Genere un dossier avec reference unique (`DOSS-2026-000XXX`)
- Le Reglement (etape 9) clot le cycle et marque le dossier "solde"

## Securite

### RBAC (5 profils x 5 niveaux)

| Profil       | Description                             |
| ------------ | --------------------------------------- |
| Admin        | Acces complet, gestion systeme          |
| Validateur   | Validation notes et dossiers (DG, DAAF) |
| Operationnel | Creation et soumission                  |
| Controleur   | Verification et audit (CB)              |
| Auditeur     | Lecture seule, rapports                 |

Niveaux : DG > Directeur > Sous-Directeur > Chef de Service > Agent

### RLS (526 policies, 199 tables)

- Filtrage par direction (`get_user_direction_id()`)
- Filtrage par exercice
- Verification role (`has_role(auth.uid(), 'ROLE'::app_role)`, `has_any_role()`)
- Audit trail automatique (triggers)

## Performance

- **Lazy loading** : pages chargees via `React.lazy()` + `<Suspense>`
- **Pagination serveur** : `page`, `pageSize`, `totalPages` dans les hooks
- **Skeleton loaders** : affichage pendant le chargement
- **staleTime: 30s** : cache TanStack Query (evite refetch inutiles)
- **Debounce** : recherche avec delai 300ms
- **Code splitting** : vendors separes en chunks (Vite)

## Edge Functions Supabase (12)

| Fonction                   | Lignes | Description                        | Methode |
| -------------------------- | ------ | ---------------------------------- | ------- |
| `generate-export`          | 1 156  | Export CSV/Excel/PDF avec QR codes | POST    |
| `generate-report`          | 874    | Rapports financiers                | POST    |
| `budget-alerts`            | 508    | Alertes seuils budgetaires         | POST    |
| `workflow-validation`      | 454    | Validation avancee workflow        | POST    |
| `validate-workflow`        | 447    | Validation etapes workflow         | POST    |
| `generate-bordereau`       | 397    | Bordereaux PDF                     | POST    |
| `bulk-operations`          | 391    | Operations en masse                | POST    |
| `process-reglement`        | 355    | Traitement reglements              | POST    |
| `send-notification-email`  | 300    | Emails via Resend API              | POST    |
| `generate-dashboard-stats` | 280    | Stats dashboard                    | GET     |
| `r2-storage`               | 222    | Stockage Cloudflare R2             | POST    |
| `create-user`              | 183    | Creation utilisateur admin         | POST    |

### Services Externes

| Service              | Usage                     | Module                    |
| -------------------- | ------------------------- | ------------------------- |
| **Resend**           | Emails transactionnels    | `send-notification-email` |
| **Cloudflare R2**    | Stockage fichiers (26 Go) | `r2-storage`              |
| **QR Server API**    | QR codes sur PDF          | `generate-export`         |
| **Supabase Storage** | Pieces jointes            | Frontend direct           |
| **Supabase Auth**    | Authentification          | Frontend + `create-user`  |

## Commandes

```bash
npm run dev           # Developpement (port 8080)
npm run build         # Build production
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run lint:fix      # ESLint auto-fix
npm run test          # Vitest (watch mode)
npx vitest run        # Vitest (CI, une passe)
npm run test:e2e      # Playwright
npm run format        # Prettier
npm run verify        # typecheck + lint + test
```

---

## Architecture Backend Detaillee

> Donnees extraites de Supabase le 2026-02-19

### B1. Metriques Backend

| Metrique       | Valeur |
| -------------- | ------ |
| Tables         | 201    |
| RLS Policies   | 526    |
| Triggers       | 273    |
| Functions/RPC  | 359    |
| FK Constraints | 439    |
| Indexes        | 803    |
| Migrations     | 253    |
| Edge Functions | 12     |

### B2. Schema Chaine ELOP (ASCII)

```
  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ notes_sef│───>│ notes_dg │───>│imputat°  │───>│expr_bes° │
  │  (SEF)   │    │  (AEF)   │    │          │    │          │
  │ 4 845 lig│    │    9 lig │    │    1 lig │    │ 3 146 lig│
  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                       │
                                          ┌────────────┴────────────┐
                                          v                         v
                                   ┌──────────┐              ┌──────────┐
                                   │passation │              │ marches  │
                                   │_marche   │              │(legacy)  │
                                   │    7 lig │              │   16 lig │
                                   └────┬─────┘              └────┬─────┘
                                        │                         │
                                        └────────────┬────────────┘
                                                     v
                                              ┌──────────┐
                                              │budget_   │
                                              │engagem°  │
                                              │ 5 663 lig│
                                              └────┬─────┘
                                                   v
                                              ┌──────────┐
                                              │budget_   │
                                              │liquidat° │
                                              │ 4 355 lig│
                                              └────┬─────┘
                                                   v
                                              ┌──────────┐
                                              │ordonnanc°│
                                              │          │
                                              │ 3 363 lig│
                                              └────┬─────┘
                                                   v
                                              ┌──────────┐
                                              │reglements│
                                              │          │
                                              │    0 lig │
                                              └──────────┘
```

**FK inter-etapes :**

```
notes_sef.id  <──  notes_dg.note_sef_id
notes_dg.id   <──  imputations.note_aef_id
imputations.id <── expressions_besoin.imputation_id
expressions_besoin.id <── passation_marche.expression_besoin_id
expressions_besoin.id <── marches.expression_besoin_id
passation_marche.id   <── budget_engagements.passation_marche_id
marches.id            <── budget_engagements.marche_id
notes_dg.id           <── budget_engagements.note_id
budget_engagements.id <── budget_liquidations.engagement_id
budget_liquidations.id <── ordonnancements.liquidation_id
ordonnancements.id     <── reglements.ordonnancement_id
```

> Note : 2 tables marches (passation_marche = nouveau workflow, marches = legacy)

### B3. Detail par Table de la Chaine

#### notes_sef (4 845 lignes, 5 RLS)

| Categorie         | Detail                                                                                                                                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cles              | `id` PK uuid, `numero`, `exercice` NOT NULL, `statut`, `objet`, `montant_estime`, `direction_id`, `dossier_id`                                                                                                                                 |
| FK sortantes (17) | `direction_id`->directions, `demandeur_id`->profiles, `dossier_id`->dossiers, `beneficiaire_id`->prestataires, `type_demande_id`->types_demande, `os_id`->objectifs_strategiques, `mission_id`->missions, `projet_id`->projets + 9 FK profiles |
| FK entrantes (7)  | notes_dg(note_sef_id), dossiers(note_sef_id), notes_sef_attachments(note_id), notes_sef_history(note_id), notes_sef_imputations(note_sef_id), notes_sef_pieces(note_id), affectations_notes(note_sef_id)                                       |
| RLS               | `notes_sef_select_policy` SELECT, `notes_sef_insert_policy` INSERT, `notes_sef_update_authorized` UPDATE, `notes_sef_validate_authorized` UPDATE, `notes_sef_delete_policy` DELETE                                                             |

#### notes_dg / AEF (9 lignes, 4 RLS)

| Categorie         | Detail                                                                                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cles              | `id` PK, `numero`, `objet`, `montant_estime`, `statut`, `exercice`, `note_sef_id`, `budget_line_id`, `ligne_budgetaire_id`                                                                                                                                                          |
| FK sortantes (17) | `note_sef_id`->notes_sef, `direction_id`->directions, `budget_line_id`->budget_lines, `ligne_budgetaire_id`->budget_lines, `type_depense_id`->types_depenses, `os_id`->objectifs_strategiques, `action_id`->actions, `activite_id`->activites, `projet_id`->projets + 8 FK profiles |
| FK entrantes (7)  | imputations(note_aef_id), expressions_besoin(note_id), marches(note_id), budget_engagements(note_id), note_attachments(note_id), notes_aef_history(note_id), notes_dg_attachments(note_id)                                                                                          |
| RLS               | `notes_dg_select_policy` SELECT, `notes_dg_insert_policy` INSERT, `notes_dg_update_policy` UPDATE, `notes_dg_delete_policy` DELETE                                                                                                                                                  |

#### imputations (1 ligne, 4 RLS)

| Categorie         | Detail                                                                                                                                                                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cles              | `id` PK, `note_aef_id` NOT NULL, `budget_line_id`, `objet`, `montant` NOT NULL, `statut` NOT NULL, `exercice` NOT NULL, `code_imputation`                                                                                                                                                                      |
| FK sortantes (16) | `note_aef_id`->notes_dg, `budget_line_id`->budget_lines, `direction_id`->directions, `nbe_id`->nomenclature_nbe, `sysco_id`->plan_comptable_sysco, `os_id`->objectifs_strategiques, `action_id`->actions, `activite_id`->activites, `sous_activite_id`->sous_activites, `mission_id`->missions + 6 FK profiles |
| FK entrantes (2)  | expressions_besoin(imputation_id), imputation_lignes(imputation_id)                                                                                                                                                                                                                                            |
| RLS               | `imputations_select_policy`, `imputations_insert_policy`, `imputations_update_policy`, `imputations_delete_policy`                                                                                                                                                                                             |

#### expressions_besoin (3 146 lignes, 9 RLS)

| Categorie        | Detail                                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cles             | `id` PK, `numero`, `objet`, `montant_estime`, `statut`, `exercice`, `note_id`, `imputation_id`, `direction_id`, `marche_id`                                                                                       |
| FK sortantes (9) | `note_id`->notes_dg, `imputation_id`->imputations, `direction_id`->directions, `dossier_id`->dossiers, `marche_id`->marches, `ligne_budgetaire_id`->budget_lines + 3 FK profiles                                  |
| FK entrantes (6) | budget_engagements(expression_besoin_id), passation_marche(expression_besoin_id), marches(expression_besoin_id), expression_besoin_attachments, expression_besoin_lignes, expression_besoin_validations           |
| RLS              | `eb_select_privileged`, `eb_select_direction`, `eb_select_own`, `eb_insert_own_direction`, `eb_update_creator_draft`, `eb_update_cb_soumis`, `eb_update_dg_verifie`, `eb_update_admin`, `eb_delete_creator_draft` |

#### passation_marche (7 lignes, 4 RLS)

| Categorie         | Detail                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cles              | `id` PK, `reference`, `expression_besoin_id`, `mode_passation` NOT NULL, `statut`, `exercice`, `prestataire_retenu_id`, `montant_retenu`, `allotissement`                                  |
| FK sortantes (10) | `expression_besoin_id`->expressions_besoin, `direction_id`->directions, `prestataire_retenu_id`->prestataires, `ligne_budgetaire_id`->budget_lines, `dossier_id`->dossiers + 5 FK profiles |
| FK entrantes (3)  | budget_engagements(passation_marche_id), lots_marche(passation_marche_id), soumissionnaires_lot(passation_marche_id)                                                                       |
| RLS               | `pm_select_v2`, `pm_insert_v2`, `pm_update_v2`, `pm_delete_v2`                                                                                                                             |

#### marches (16 lignes, 2 RLS)

| Categorie         | Detail                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cles              | `id` PK, `numero`, `note_id`, `objet`, `montant` NOT NULL, `mode_passation` NOT NULL, `statut`, `prestataire_id`, `exercice`, `expression_besoin_id`                                                                                  |
| FK sortantes (7)  | `note_id`->notes_dg, `expression_besoin_id`->expressions_besoin, `prestataire_id`->prestataires, `direction_id`->directions, `budget_line_id`->budget_lines, `dossier_id`->dossiers, `created_by`->profiles                           |
| FK entrantes (11) | budget_engagements(marche_id), contrats(marche_id), evaluations_offre(marche_id), expressions_besoin(marche_id), marche_attachments, marche_documents, marche_historique, marche_lots, marche_offres, marche_validations, soumissions |
| RLS               | `Authorized roles can manage marches` (ALL), `marches_select_direction_filtered` (SELECT)                                                                                                                                             |

#### budget_engagements (5 663 lignes, 3 RLS)

| Categorie        | Detail                                                                                                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cles             | `id` PK, `numero` NOT NULL, `budget_line_id` NOT NULL, `objet`, `montant` NOT NULL, `statut`, `exercice`, `note_id`, `marche_id`, `passation_marche_id`, `expression_besoin_id`                                                        |
| FK sortantes (8) | `budget_line_id`->budget_lines, `note_id`->notes_dg, `marche_id`->marches, `passation_marche_id`->passation_marche, `expression_besoin_id`->expressions_besoin, `dossier_id`->dossiers, `project_id`->projects, `created_by`->profiles |
| FK entrantes (6) | budget_liquidations(engagement_id), contrats(engagement_id), demandes_achat(engagement_id), engagement_attachments, engagement_documents, engagement_validations                                                                       |
| RLS              | `Authorized roles can manage engagements` (ALL), `DG can read all engagements` (SELECT), `Everyone can view engagements` (SELECT)                                                                                                      |

#### budget_liquidations (4 355 lignes, 3 RLS)

| Categorie        | Detail                                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cles             | `id` PK, `numero` NOT NULL, `engagement_id` NOT NULL, `montant` NOT NULL, `statut`, `exercice`, `net_a_payer`, `service_fait`                                                 |
| FK sortantes (6) | `engagement_id`->budget_engagements, `dossier_id`->dossiers, `created_by`->profiles, `rejected_by`->profiles, `service_fait_certifie_par`->profiles, `validated_by`->profiles |
| FK entrantes (3) | ordonnancements(liquidation_id), liquidation_attachments, liquidation_validations                                                                                             |
| RLS              | `Authorized roles can manage liquidations` (ALL), `DG can read all liquidations` (SELECT), `Everyone can view liquidations` (SELECT)                                          |

#### ordonnancements (3 363 lignes, 3 RLS)

| Categorie        | Detail                                                                                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cles             | `id` PK, `numero`, `liquidation_id` NOT NULL, `montant` NOT NULL, `beneficiaire` NOT NULL, `objet`, `statut`, `mode_paiement`                                                                                                                      |
| FK sortantes (9) | `liquidation_id`->budget_liquidations, `dossier_id`->dossiers, `signed_daaf_by`->profiles, `signed_dg_by`->profiles, `transmitted_by`->profiles, `created_by`->profiles, `differe_by`->profiles, `rejected_by`->profiles, `validated_by`->profiles |
| FK entrantes (6) | reglements(ordonnancement_id), treasury_movements(ordonnancement_id), ordonnancement_attachments, ordonnancement_pieces, ordonnancement_signatures, ordonnancement_validations                                                                     |
| RLS              | `Authorized roles can manage ordonnancements` (ALL), `DG can read all ordonnancements` (SELECT), `Everyone can view ordonnancements` (SELECT)                                                                                                      |

#### reglements (0 lignes, 4 RLS)

| Categorie        | Detail                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cles             | `id` PK, `numero` NOT NULL, `ordonnancement_id` NOT NULL, `montant` NOT NULL, `date_paiement` NOT NULL, `mode_paiement` NOT NULL, `statut`, `exercice`, `compte_id` |
| FK sortantes (4) | `ordonnancement_id`->ordonnancements, `compte_id`->comptes_bancaires, `dossier_id`->dossiers, `created_by`->profiles                                                |
| FK entrantes (3) | mouvements_bancaires(reglement_id), operations_tresorerie(reglement_id), reglement_attachments                                                                      |
| RLS              | Allow authenticated to read/insert/update/delete reglements (4 policies)                                                                                            |

### B4. Tables Satellites

| Etape          | Tables satellites                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEF            | notes_sef_attachments, notes_sef_history, notes_sef_imputations, notes_sef_pieces, affectations_notes                                             |
| AEF            | note_attachments, notes_aef_history, notes_dg_attachments                                                                                         |
| Imputation     | imputation_lignes                                                                                                                                 |
| Expr. Besoin   | expression_besoin_attachments, expression_besoin_lignes, expression_besoin_validations                                                            |
| Passation      | lots_marche, soumissionnaires_lot                                                                                                                 |
| Marches        | marche_attachments, marche_documents, marche_historique, marche_lots, marche_offres, marche_validations, soumissions, evaluations_offre, contrats |
| Engagement     | engagement_attachments, engagement_documents, engagement_validations, demandes_achat                                                              |
| Liquidation    | liquidation_attachments, liquidation_validations                                                                                                  |
| Ordonnancement | ordonnancement_attachments, ordonnancement_pieces, ordonnancement_signatures, ordonnancement_validations, treasury_movements                      |
| Reglement      | reglement_attachments, mouvements_bancaires, operations_tresorerie                                                                                |

### B5. Tables Transversales

| Table                   | Role                                     | Lignes |
| ----------------------- | ---------------------------------------- | ------ |
| directions              | Structure organisationnelle              | 25     |
| profiles                | Utilisateurs (FK dans toutes les tables) | 78     |
| budget_lines            | Lignes budgetaires (imputation)          | 765    |
| dossiers                | Conteneur reliant toutes les etapes      | 10     |
| prestataires            | Fournisseurs/beneficiaires               | 431    |
| engagement_documents    | Documents engagements (migres)           | 22 648 |
| audit_logs              | Journal d'audit immutable                | 238    |
| notification_templates  | Templates de notifications               | 17     |
| notification_recipients | Routage notifications par role           | 28     |
| user_roles              | Attribution roles aux utilisateurs       | 80     |
| role_permissions        | Permissions par role (matrice RBAC)      | 380    |

### B6. Matrice RBAC (role_permissions — 380 entrees, 15 roles)

> Roles : ADMIN, AUDITOR, BUDGET_PLANNER, BUDGET_VALIDATOR, CB, DAAF, DG, DGPEC, EXPENSE_REQUESTER, EXPENSE_VALIDATOR, LECTEUR, OPERATEUR, SDMG, TRESORERIE, APPRO

**Matrice par module de la chaine :**

```
Module           | OPERATEUR         | CB           | DAAF              | DG                | ADMIN
─────────────────┼───────────────────┼──────────────┼───────────────────┼───────────────────┼──────
Notes SEF/AEF    | C S M V           | V            | C V               | V Val Rej Dif     | *
Imputations      | -                 | V            | C V               | -                 | *
Expr. Besoin     | -                 | V             | V                 | V                 | *
Marches          | V                 | V            | C M V             | V                 | *
Engagement       | C V               | Val V        | C Val V           | Val Rej Dif V     | *
Liquidation      | C V               | V            | C Val Cert V      | Val V             | *
Ordonnancement   | C V               | V            | C Sign Trans V    | Sign V            | *
Reglement        | V                 | -            | V                 | V                 | *

Legende : C=Creer, S=Soumettre, M=Modifier, V=Voir, Val=Valider, Rej=Rejeter,
          Dif=Differer, Sign=Signer, Trans=Transmettre, Cert=Certifier, *=Tout
```

**Roles complementaires :**

| Role              | Permissions cles                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| TRESORERIE        | Reglement: creer, payer, voir, exporter / Ordonnancement: voir, valider / Engagement+Liquidation: voir |
| AUDITOR           | Voir + exporter sur tous les modules. Pas de creation/modification                                     |
| BUDGET_PLANNER    | Budget: creer, modifier, soumettre, voir, exporter / Virement: creer, soumettre                        |
| BUDGET_VALIDATOR  | Budget: valider, rejeter, voir, exporter / Virement: valider, rejeter                                  |
| EXPENSE_REQUESTER | Notes: creer, modifier, soumettre, voir / Engagement+Liquidation: creer, voir                          |
| EXPENSE_VALIDATOR | Notes: valider, rejeter, differer, voir / Engagement+Liquidation: valider, voir                        |
| LECTEUR           | Voir uniquement (budget, engagements, liquidations, ordonnancements, reglements)                       |
| DGPEC / SDMG      | Voir (engagements, marches, notes) + valider engagements                                               |
| APPRO             | Voir budget + creer engagements                                                                        |

### B7. Helpers RLS

```sql
-- Verification de role (PATTERN CORRECT)
has_role(auth.uid(), 'DG'::app_role)         -- Via table user_roles
has_any_role(auth.uid(), ARRAY['DAAF','CB'])  -- Plusieurs roles

-- Contexte utilisateur
get_user_direction_id(auth.uid())             -- Direction de l'utilisateur

-- ATTENTION : is_admin(), is_dg(), is_daaf() N'EXISTENT PAS en base
-- Toujours utiliser : has_role(auth.uid(), 'ADMIN'::app_role)
```

**Patterns RLS :**

| Pattern                    | Expression SQL                                              |
| -------------------------- | ----------------------------------------------------------- |
| Lecture par direction      | `direction_id = get_user_direction_id(auth.uid())`          |
| Lecture role eleve         | `has_any_role(auth.uid(), ARRAY['DG','DAAF','CB','ADMIN'])` |
| Ecriture par createur      | `created_by = auth.uid()`                                   |
| Modification role autorise | `has_any_role(auth.uid(), ARRAY['DAAF','ADMIN'])`           |
| Acces total admin          | `has_role(auth.uid(), 'ADMIN'::app_role)`                   |

---

> Conventions detaillees : [CONVENTIONS.md](CONVENTIONS.md)
> Inventaire complet : [PROJECT_STATUS.md](PROJECT_STATUS.md)
> Derniere mise a jour : 2026-02-19
