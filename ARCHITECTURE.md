# ARCHITECTURE TECHNIQUE — SYGFP v2.0

**Date :** 19 fevrier 2026
**ARTI** = Autorite de Regulation du Transport Interieur (Cote d'Ivoire)
**Validation :** FK verifie PostgREST + RBAC verifie Playwright le 19/02/2026

---

## 1. Chaine de depense ELOP (9 etapes)

```
 PREPARATION (etapes 1-5)                    EXECUTION (etapes 6-9)
 ─────────────────────────                   ─────────────────────────

 ┌─────────────┐    note_sef_id    ┌─────────────┐    note_aef_id    ┌─────────────┐
 │  1. NOTE SEF│──────────────────>│ 2. NOTE AEF │──────────────────>│3. IMPUTATION│
 │  notes_sef  │                   │  notes_dg   │                   │ imputations  │
 │  DG valide  │                   │ DIR valide  │                   │  CB impute  │
 └─────────────┘                   └─────────────┘                   └──────┬──────┘
                                                                   imputation_id│
                                                                            ▼
 ┌─────────────┐  expression_besoin_id  ┌─────────────────┐
 │5. PASSATION │<───────────────────────│4. EXPR. BESOIN  │
 │  MARCHE     │                        │expressions_besoin│
 │passation_   │                        │ DIR/DAAF valide  │
 │  marche     │                        └─────────────────┘
 └──────┬──────┘
 passation_marche_id│
        ▼
 ┌─────────────┐  engagement_id  ┌─────────────┐  liquidation_id  ┌─────────────┐
 │6. ENGAGEMENT│────────────────>│7. LIQUIDATION│────────────────>│8. ORDONNANC. │
 │budget_      │                 │budget_       │                 │ordonnance-   │
 │engagements  │                 │liquidations  │                 │ments         │
 │SAF→CB→DAF→DG│                 │DAAF→DG       │                 │DAAF→DG signe │
 └─────────────┘                 └─────────────┘                 └──────┬──────┘
                                                                ordonnancement_id│
                                                                            ▼
                                                                 ┌─────────────┐
                                                                 │9. REGLEMENT │
                                                                 │ reglements  │
                                                                 │TRESORERIE   │
                                                                 │paye→cloture │
                                                                 └─────────────┘

  DOSSIERS (table transversale)
  ─────────────────────────────
  Chaque depense a un dossier unique (dossier_id) qui traverse les 9 etapes.
  dossiers.etape_actuelle = numero de l'etape courante (1-9)
  dossiers.note_sef_id = point d'entree
```

---

## 2. Schema des tables DB (relations FK)

### 2.1 Chaine principale

```
notes_sef
  │ id (PK)
  │ numero, reference_pivot, objet, montant_estime
  │ statut: brouillon | soumis | valide | rejete | differe
  │ exercice, created_by, dossier_id
  │
  └──> notes_dg (via note_sef_id)
       │ id (PK)
       │ numero, reference_pivot, objet, montant_estime
       │ statut: brouillon | soumis | a_valider | valide | rejete | differe
       │ is_direct_aef (boolean, AEF sans SEF)
       │
       └──> imputations (via note_aef_id, 1:1)
            │ id (PK)
            │ reference, objet, montant, code_imputation
            │ statut: a_valider | a_imputer | valide
            │ budget_line_id → budget_lines
            │ direction_id → directions
            │
            └──> expressions_besoin (via imputation_id)
                 │ id (PK)
                 │ numero, objet, montant_estime
                 │ statut: brouillon | soumis | valide | rejete | differe
                 │ direction_id → directions
                 │
                 └──> passation_marche (via expression_besoin_id)
                      │ id (PK)
                      │ reference, objet, montant_estime, montant_retenu
                      │ mode_passation, prestataire_retenu_id → prestataires
                      │ statut: brouillon | publie | evalue | attribue | approuve | certifie | signe
                      │
                      ├──> lots_marche (via passation_marche_id)
                      │    └──> soumissionnaires_lot (via lot_marche_id + passation_marche_id)
                      │
                      └──> budget_engagements (via passation_marche_id OU expression_besoin_id)
                           │ id (PK)
                           │ numero (ENG-YYYY-NNNN), objet, montant, montant_ht
                           │ statut: brouillon | soumis | valide | rejete | differe | annule
                           │ budget_line_id → budget_lines
                           │ current_step (0-4), workflow_status
                           │
                           └──> budget_liquidations (via engagement_id)
                                │ id (PK)
                                │ numero, montant, montant_ht
                                │ statut: brouillon | soumis | en_validation_dg | valide | rejete
                                │
                                └──> ordonnancements (via liquidation_id)
                                     │ id (PK)
                                     │ numero, objet, montant, beneficiaire
                                     │ statut: brouillon | soumis | en_signature | signe | rejete
                                     │
                                     └──> reglements (via ordonnancement_id)
                                          │ id (PK)
                                          │ numero, montant, mode_paiement, date_paiement
                                          │ statut: brouillon | soumis | paye | rejete | cloture
                                          │ compte_id → comptes_bancaires
```

### 2.2 Tables de validation (pattern commun)

```
{module}_validations
  │ id (PK)
  │ {module}_id → {module_table}.id
  │ step_order (INTEGER) — position dans la chaine
  │ role (TEXT) — SAF, CB, DAF, DG, etc.
  │ status (TEXT) — en_attente, valide, rejete
  │ validated_by (UUID) → profiles.id
  │ validated_at (TIMESTAMPTZ)
  │ comments (TEXT)
  │ validation_mode — direct | delegation | interim
  │ validated_on_behalf_of (UUID) — si delegation/interim

Tables existantes :
  - expression_besoin_validations
  - marche_validations
  - engagement_validations (4 steps : SAF→CB→DAF→DG)
  - liquidation_validations
  - ordonnancement_validations
```

### 2.3 Tables support

```
budget_lines                    directions                profiles
  │ dotation_initiale             │ id, nom, code           │ id, email
  │ total_engage                  │ sigle                   │ nom, prenom
  │ exercice                                               │ direction_id
  │ chapitre, article, paragraphe  dossiers                │ user_roles[]
                                   │ reference_dossier
prestataires                       │ etape_actuelle (1-9)   user_roles
  │ raison_sociale                 │ statut_global           │ user_id
  │ rccm, nif                     │ note_sef_id             │ role (app_role)
  │ contact, email                 │ direction_id            │ is_active
                                   │ budget_line_id
exercices_budgetaires
  │ annee, statut (ouvert/clos)
  │ date_debut, date_fin
```

---

## 3. Architecture frontend

### 3.1 Arbre des composants par module

```
src/
├── components/
│   ├── ui/                    (49) shadcn/ui — Button, Card, Dialog, Table, Tabs, Sheet...
│   ├── shared/                (16) NotesPagination, NotesFiltersBar, EmptyState, formatCurrency...
│   ├── layout/                 (3) Sidebar, Header, AppLayout
│   │
│   ├── notes-sef/             (22) NoteSEFForm, NoteSEFList, NoteSEFExport, NoteSEFValidation...
│   ├── notes-aef/              (9) NoteAEFForm, NoteAEFList...
│   ├── imputation/            (12) ImputationForm, ImputationDetail, ImputationValidation...
│   ├── expression-besoin/     (12) EBForm, EBList, EBArticles, EBValidation...
│   ├── passation-marche/      (16) PassationForm, PassationDetails, LotsMarche,
│   │                               SoumissionnairesSection, EvaluationCOJO,
│   │                               TableauComparatif, PassationChainNav, PassationExportButton...
│   ├── engagement/            (11) EngagementForm, EngagementFromPMForm, EngagementDetails,
│   │                               EngagementValidateDialog, EngagementTimeline, EngagementChecklist...
│   ├── liquidation/           (11) LiquidationForm, LiquidationDetail...
│   ├── ordonnancement/        (11) OrdonnancementForm, OrdonnancementSignatures...
│   ├── reglement/              (8) ReglementForm, PaiementPartiel...
│   │
│   ├── budget/                (32) BudgetImport, BudgetTransfer, BudgetValidation...
│   ├── workflow/              (15) WorkflowEngine, WorkflowActionBar, TransitionPanel...
│   ├── dashboard/             (26) DashboardCards, DashboardCharts, KPIWidgets...
│   ├── notifications/         (10) NotificationCenter, NotificationBadge, RealtimeNotif...
│   ├── dossier/               (14) DossierTimeline, DossierChaine, DossierDocuments...
│   ├── prestataires/          (10) PrestataireCRUD, PrestataireValidation...
│   ├── attachments/            (9) FileUpload, DocumentViewer, AttachmentList...
│   └── admin/                 (15) UserManagement, RoleEditor, AuditLog...
│
├── hooks/                    (165)
│   ├── useNotesSEF.ts              — CRUD notes SEF
│   ├── useNotesAEF.ts              — CRUD notes AEF (DG)
│   ├── useImputations.ts           — CRUD imputations
│   ├── useExpressionsBesoin.ts     — CRUD expressions besoin
│   ├── usePassationsMarche.ts      — CRUD passation + types + constantes
│   ├── useEngagements.ts           — CRUD engagements + workflow 4 etapes
│   ├── useLiquidations.ts          — CRUD liquidations
│   ├── useOrdonnancements.ts       — CRUD ordonnancements
│   ├── useReglements.ts            — CRUD reglements
│   ├── useBudgetLines.ts           — Lignes budgetaires
│   ├── useBudgetAvailability.ts    — Calcul disponibilite
│   ├── useRBAC.ts / useRBACHelpers.ts — Permissions, delegations, interims
│   ├── useWorkflowEngine.ts        — Machine a etats generique
│   ├── useSidebarBadges.ts         — Compteurs sidebar (refetch 30s)
│   └── use*.ts                     — ~150 autres hooks
│
├── pages/                    (115)
│   ├── NotesSEF.tsx, NotesAEF.tsx, ValidationNotesSEF.tsx...
│   ├── execution/
│   │   ├── PassationMarche.tsx, PassationApprobation.tsx
│   │   ├── ExpressionBesoin.tsx, ImputationPage.tsx
│   │   └── DashboardExecution.tsx
│   ├── Engagements.tsx, Liquidations.tsx, Ordonnancements.tsx, Reglements.tsx
│   ├── planification/ (16 pages)
│   ├── admin/ (29 pages)
│   └── auth/ (3 pages)
│
├── lib/
│   ├── workflow/workflowEngine.ts  — Machine a etats 9 etapes
│   ├── rbac/ (4 fichiers)          — Config RBAC, permissions, types
│   ├── budget/imputation-utils.ts  — Calculs budget
│   ├── pdf/ (5 fichiers)           — Generation PDF (en-tete ARTI, footer, styles)
│   ├── excel/ (4 fichiers)         — Generation Excel
│   ├── utils.ts                    — formatCurrency, cn, parseCurrency
│   └── config/rbac-config.ts       — Matrice RBAC complete
│
├── services/                 (17)
│   ├── pvCojoPdfService.ts         — PV COJO (evaluation marches)
│   ├── passationExportService.ts   — Export passation (Excel/PDF/CSV)
│   ├── noteSEFPdfService.ts        — PDF notes SEF
│   ├── attachmentService.ts        — Pieces jointes
│   └── storage/ (6 fichiers)       — Supabase Storage + R2
│
└── contexts/
    ├── ExerciceContext.tsx          — Exercice budgetaire courant
    └── RBACContext.tsx              — Roles, permissions, delegations, interims
```

### 3.2 Pattern type d'un module (page liste)

```
┌─────────────────────────────────────────────────┐
│  PageHeader (titre + bouton "Nouveau")          │
├─────────────────────────────────────────────────┤
│  KPI Cards (grid 4 colonnes)                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │Total │ │Brouil│ │En att│ │Valide│          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
├─────────────────────────────────────────────────┤
│  Tabs (par statut) + NotesFiltersBar            │
├─────────────────────────────────────────────────┤
│  Table (donnees paginées)                       │
│  ┌────┬─────────┬──────┬────────┬──────┐       │
│  │Ref │ Objet   │Montant│ Statut │Action│       │
│  ├────┼─────────┼──────┼────────┼──────┤       │
│  │... │ ...     │ ...  │ Badge  │ Eye  │       │
│  └────┴─────────┴──────┴────────┴──────┘       │
├─────────────────────────────────────────────────┤
│  NotesPagination (page X/Y)                     │
└─────────────────────────────────────────────────┘
```

---

## 4. Architecture backend

### 4.1 Metriques

| Metrique       | Valeur |
| -------------- | ------ |
| Tables         | 201    |
| Vues           | 43     |
| Fonctions SQL  | 359    |
| RLS Policies   | 526    |
| Triggers       | 273    |
| FK Constraints | 439    |
| Indexes        | 803    |
| Edge Functions | 12     |
| Migrations     | 253    |

### 4.2 Edge Functions

| Fonction                 | Methode  | Description                                |
| ------------------------ | -------- | ------------------------------------------ |
| send-notification-email  | POST     | Envoi email via Resend API                 |
| create-user              | POST     | Creation utilisateur (Supabase Auth admin) |
| generate-export          | POST     | Export CSV/Excel/PDF avec QR code          |
| generate-report          | POST     | Rapports financiers agreges                |
| generate-bordereau       | POST     | Bordereaux PDF                             |
| generate-dashboard-stats | POST     | Stats dashboard (aggregats lourds)         |
| r2-storage               | POST/GET | Stockage fichiers Cloudflare R2            |
| process-reglement        | POST     | Traitement reglement + mouvement bancaire  |
| budget-alerts            | POST     | Alertes seuils budgetaires                 |
| bulk-operations          | POST     | Operations en masse                        |
| validate-workflow        | POST     | Validation etapes workflow                 |
| workflow-validation      | POST     | Validation avancee multi-niveaux           |

### 4.3 Triggers principaux

| Trigger                     | Table                  | Action                                                |
| --------------------------- | ---------------------- | ----------------------------------------------------- |
| fn_update_engagement_rate   | budget_engagements     | MAJ total_engage sur budget_lines quand statut change |
| update\_\*\_updated_at      | toutes                 | MAJ automatique updated_at                            |
| trg_passation_lifecycle     | passation_marche       | Audit trail + notifications sur transitions           |
| trg*notify*\*               | notes_sef, engagements | Notifications automatiques                            |
| deactivate_expired_interims | interims               | Desactivation auto a date_fin                         |

### 4.4 RLS — Pattern global

```sql
-- SELECT : direction-scoped ou admin
CREATE POLICY "table_select_by_direction" ON ma_table
  FOR SELECT USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR direction_id = get_user_direction_id(auth.uid())
    OR created_by = auth.uid()
  );

-- INSERT : roles specifiques
CREATE POLICY "table_insert_authorized" ON ma_table
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR has_role(auth.uid(), 'DAAF'::app_role)
  );

-- UPDATE : createur (brouillon) ou validateurs
CREATE POLICY "table_update_authorized" ON ma_table
  FOR UPDATE USING (
    has_role(auth.uid(), 'ADMIN'::app_role)
    OR (created_by = auth.uid() AND statut = 'brouillon')
  );
```

---

## 5. Flux de donnees — Traversee d'une depense

```
UTILISATEUR                    FRONTEND                      SUPABASE
───────────                    ────────                      ────────

1. Agent cree Note SEF         useNotesSEF.create()          INSERT notes_sef (brouillon)
   → soumet                    useNotesSEF.submit()          UPDATE statut='soumis'
   → DG valide                 useValidationDG.validate()    UPDATE statut='valide'
                                                             → trigger: create dossier

2. Agent cree Note AEF         useNotesAEF.create()          INSERT notes_dg (note_sef_id)
   → Directeur valide                                        UPDATE statut='valide'

3. CB impute                   useImputations.create()       INSERT imputations (note_aef_id)
                                                             → check_budget_availability()
                                                             UPDATE statut='impute'

4. Agent cree Expr. Besoin     useExpressionsBesoin.create() INSERT expressions_besoin (imputation_id)
   → Directeur valide                                        UPDATE statut='valide'

5. DAAF cree Passation         usePassationsMarche.create()  INSERT passation_marche (expression_besoin_id)
   → COJO evalue                                             UPDATE soumissionnaires_lot (notes)
   → DG approuve                                             UPDATE statut='signe'

6. DAAF cree Engagement        useEngagements.create()       INSERT budget_engagements (passation_marche_id)
   → SAF→CB→DAF→DG valide                                   engagement_validations (4 steps)
                                                             → trigger: budget_lines.total_engage += montant

7. DAAF cree Liquidation       useLiquidations.create()      INSERT budget_liquidations (engagement_id)
   → DG valide (si >=50M)                                   UPDATE statut='valide'

8. DAAF cree Ordonnancement    useOrdonnancements.create()   INSERT ordonnancements (liquidation_id)
   → DG signe                                                UPDATE statut='signe'

9. Tresorerie paie             useReglements.create()        INSERT reglements (ordonnancement_id)
   → process-reglement                                       Edge Function: mouvement bancaire
                                                             UPDATE statut='paye'
                                                             → dossiers.statut_global='cloture'
```

---

## 6. RBAC — Matrice role x action x module

### 6.1 Profils fonctionnels

| Code       | Label                   | Pouvoirs cles                                |
| ---------- | ----------------------- | -------------------------------------------- |
| ADMIN      | Administrateur          | Tout (bypass)                                |
| DG         | Directeur General       | Validation finale, signature ordonnancement  |
| DAAF       | Dir. Admin. & Financier | Creation engagement/liquidation, validation  |
| CB         | Controleur Budgetaire   | Imputation, validation engagement, virements |
| DIRECTEUR  | Directeur departement   | Validation Note AEF (sa direction)           |
| TRESORERIE | Tresorerie              | Reglement, mouvements bancaires              |
| OPERATEUR  | Operateur               | Creation, soumission (propres dossiers)      |
| AUDITEUR   | Auditeur                | Lecture seule transversale + export          |

### 6.2 Matrice simplifiee

```
Module            │ CREATE       │ VALIDATE        │ READ            │ Seuil DG
──────────────────┼──────────────┼─────────────────┼─────────────────┼──────────
Note SEF          │ Tous*        │ DG              │ DG=all, own     │ -
Note AEF          │ Tous*        │ DIRECTEUR, DG   │ Direction       │ -
Imputation        │ CB, DAAF     │ CB              │ CB/DAAF/DG      │ -
Expr. Besoin      │ Tous*        │ DIRECTEUR, DAAF │ Direction       │ -
Passation Marche  │ DAAF, CB     │ DG              │ DAAF/CB/DG      │ >= 5M
Engagement        │ DAAF, CB     │ SAF→CB→DAF→DG   │ CB/DAAF/DG      │ >= 50M
Liquidation       │ DAAF         │ DAAF→DG         │ DAAF/CB/DG      │ >= 50M
Ordonnancement    │ DAAF         │ DAAF→DG(signe)  │ DG/TRESORERIE   │ >= 50M
Reglement         │ TRESORERIE   │ TRESORERIE      │ TRESORERIE/DG   │ -

* Tous = OPERATEUR, AGENT, CHEF_SERVICE, DIRECTEUR, DAAF, DG, ADMIN
```

### 6.3 Delegations et interims

```
DELEGATIONS (table: delegations)
  delegateur → delegataire + perimetre[] + date_debut/fin
  Perimetre : ['notes', 'engagements', 'liquidations', 'ordonnancements']
  Audit : validation_mode='delegation', validated_on_behalf_of=delegateur_id

INTERIMS (table: interims)
  titulaire → interimaire + date_debut/fin + motif
  Un seul interim actif par titulaire
  Pas d'interim en cascade
  Auto-desactivation a date_fin (cron)
  Audit : validation_mode='interim'
```

---

## 7. Calculs budgetaires

### 7.1 Disponibilite budgetaire

```
dotation_actuelle = dotation_initiale
                  + SUM(virements_recus WHERE statut='execute')
                  - SUM(virements_emis WHERE statut='execute')

total_engage = SUM(budget_engagements.montant WHERE statut='valide')

disponible = dotation_actuelle - total_engage

is_sufficient = (disponible >= montant_demande)
```

### 7.2 Taux d'engagement

```
taux_engagement = (total_engage / dotation_actuelle) * 100

Seuils d'alerte :
  >= 80% → WARNING (notification CB)
  >= 100% → CRITICAL (depassement)
```

### 7.3 Impact des transitions sur le budget

| Transition            | Action sur budget_lines                |
| --------------------- | -------------------------------------- |
| Engagement → `valide` | total_engage += montant                |
| Engagement → `rejete` | total_engage recalcule (exclut rejete) |
| Engagement → `annule` | total_engage recalcule (exclut annule) |

Credits liberes immediatement en cas de rejet/annulation (delta negatif dans budget_history).

### 7.4 Seuils DGMP (Passation de Marche)

| Mode                  | Seuil HT   | Code |
| --------------------- | ---------- | ---- |
| Pro-forma simple      | < 5M FCFA  | PSD  |
| Pro-forma concurrence | 5M - 30M   | PSC  |
| Appel d'offres local  | 30M - 100M | PSL  |
| Appel d'offres ouvert | >= 100M    | PSO  |

### 7.5 Formule d'evaluation COJO

```
note_finale = note_technique * 0.70 + note_financiere * 0.30
seuil_qualification = 70/100 (note_technique)
classement = ORDER BY note_finale DESC (parmi les qualifies)
```

---

## 8. VALIDATION — Resultats (19/02/2026)

### 8.1 FK verifie via PostgREST

| Lien                                     | Colonne FK           | Existe | Peuple              |
| ---------------------------------------- | -------------------- | ------ | ------------------- |
| notes_sef → notes_dg                     | note_sef_id          | YES    | YES                 |
| notes_dg → imputations                   | note_aef_id          | YES    | YES                 |
| imputations → expressions_besoin         | imputation_id        | YES    | NO (null)           |
| expressions_besoin → passation_marche    | expression_besoin_id | YES    | YES                 |
| passation_marche → budget_engagements    | passation_marche_id  | YES    | NO (gap engagement) |
| budget_engagements → budget_liquidations | engagement_id        | YES    | YES                 |
| budget_liquidations → ordonnancements    | liquidation_id       | YES    | YES                 |
| ordonnancements → reglements             | ordonnancement_id    | YES    | (table vide)        |

**8/8 colonnes FK existent. 2 non peuplees = gaps engagement.**

### 8.2 RBAC verifie via Playwright

| Test                  | Agent DSI     | DAAF          | DG            |
| --------------------- | ------------- | ------------- | ------------- |
| Connexion             | OK (badge AD) | OK (badge CD) | OK (badge DG) |
| Creer Note SEF        | OK            | OK            | OK            |
| Valider Note SEF      | BLOQUE        | OK            | OK            |
| Approbation Passation | BLOQUE        | BLOQUE        | OK            |
| Sidebar etapes        | 3 (filtre)    | 6 (filtre)    | 9/9           |
| Pages admin           | -             | -             | OK            |

---

_Document genere le 19/02/2026, valide le 19/02/2026 — SYGFP v2.0_
_ARTI = Autorite de Regulation du Transport Interieur (Cote d'Ivoire)_
