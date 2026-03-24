# INVENTAIRE COMPLET DU PROJET SYGFP

**Date :** 24 mars 2026
**Version :** v3.0
**Branche :** main

> Ce document est la memoire permanente du projet. Si on perd le contexte, ce fichier suffit a tout reprendre.

---

## RESUME EXECUTIF

| Metrique            | Valeur                     |
| ------------------- | -------------------------- |
| **Pages**           | 125                        |
| **Composants**      | 426 fichiers               |
| **Hooks**           | 179                        |
| **Services**        | 19                         |
| **Routes**          | 103                        |
| **Items sidebar**   | 50                         |
| **Edge Functions**  | 12                         |
| **Migrations SQL**  | 281                        |
| **Tables**          | 201                        |
| **RLS Policies**    | 671                        |
| **Tests unitaires** | 704 (Vitest, tous PASS)    |
| **Tests E2E**       | 71 spec files (Playwright) |
| **Build**           | OK (18s)                   |
| **TypeScript**      | 0 erreurs                  |

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
Charts   : Recharts
```

### Supabase

```
Project ID : tjagvgqthlibdpvztvaf
URL        : https://tjagvgqthlibdpvztvaf.supabase.co
```

### GitHub

```
Repo : naywayne90/sygfp-artis-g-re
```

---

## 2. CHAINE DE DEPENSE (9 ETAPES)

```
PREPARATION                              EXECUTION
-----------                              ---------
1. Note SEF (brouillon→soumis→validé)    6. Engagement (4 visas: SAF→CB→DAAF→DG)
2. Note AEF (validation directeur)       7. Liquidation (CB→DAAF→DG→SDCT)
3. Imputation (DAF→SDPM→SDCT)            8. Ordonnancement (DAF→DG signature)
4. Expression de Besoin (SDPM)            9. Règlement (Trésorier)
5. Passation de Marché (DG approbation)
```

**Workflow global :**

```
Agent crée → Directeur valide → CB/DAAF contrôle → DG signe → Trésorier paye
```

---

## 3. MODULES — INVENTAIRE PAR SECTION

### 3.1 Chaîne de Dépense (9 modules)

| #   | Module            | Route                          | Page                 | Hook principal          | Statut               |
| --- | ----------------- | ------------------------------ | -------------------- | ----------------------- | -------------------- |
| 1   | Notes SEF         | `/notes-sef`                   | NotesSEF.tsx         | useNotesSEF.ts          | Production           |
| 2   | Notes AEF         | `/notes-aef`                   | NotesAEF.tsx         | useNotesAEF.ts          | Production           |
| 3   | Imputation        | `/execution/imputation`        | Imputation.tsx       | useImputations.ts       | Production           |
| 4   | Expression Besoin | `/execution/expression-besoin` | ExpressionBesoin.tsx | useExpressionsBesoin.ts | Production           |
| 5   | Passation Marché  | `/execution/passation-marche`  | PassationMarche.tsx  | usePassationsMarche.ts  | **Certifié 100/100** |
| 6   | Engagement        | `/engagements`                 | Engagements.tsx      | useEngagements.ts       | **Certifié 100/100** |
| 7   | Liquidation       | `/liquidations`                | Liquidations.tsx     | useLiquidations.ts      | **Certifié 100/100** |
| 8   | Ordonnancement    | `/ordonnancements`             | Ordonnancements.tsx  | useOrdonnancements.ts   | Production           |
| 9   | Règlement         | `/reglements`                  | Reglements.tsx       | useReglements.ts        | Production           |

### 3.2 Budget & Planification (5 pages)

| Module               | Route                          | Page                        | Description                       |
| -------------------- | ------------------------------ | --------------------------- | --------------------------------- |
| Structure Budgétaire | `/planification/structure`     | StructureBudgetaire.tsx     | Arborescence lignes budgétaires   |
| Planification Budget | `/planification/budget`        | PlanificationBudgetaire.tsx | Saisie prévisions budgétaires     |
| Plan de Travail      | `/planification/plan-travail`  | PlanDeTravail.tsx           | Plans de travail par direction    |
| Virements            | `/planification/virements`     | Virements.tsx               | Virements de crédits              |
| Import/Export        | `/planification/import-export` | ImportExport.tsx            | Import/Export données budgétaires |

### 3.3 Feuille de Route (5 pages — NOUVEAU module mars 2026)

| Module               | Route                                       | Page                       | Description                                    |
| -------------------- | ------------------------------------------- | -------------------------- | ---------------------------------------------- |
| Tableau de Bord      | `/planification/roadmap-dashboard`          | RoadmapDashboard.tsx       | KPIs, graphiques, activité récente             |
| Mon Espace Direction | `/planification/roadmap-direction`          | RoadmapDirection.tsx       | Vue direction avec PieChart, échéances, équipe |
| Projets & Plans      | `/planification/projets`                    | ProjetsList.tsx            | CRUD plans de travail avec KPIs                |
| Soumissions          | `/planification/soumissions-feuilles-route` | RoadmapSubmissionsPage.tsx | Validation CB/Chargé Mission                   |
| Import Activités     | `/planification/feuilles-route`             | FeuillesRoute.tsx          | Import Excel activités                         |

**Workflow :** Direction soumet plan → CB + Chargé de Mission valident → DG consulte

### 3.4 Suivi DG (1 page — NOUVEAU module mars 2026)

| Module   | Route       | Page        | Description                                                                                                                                                            |
| -------- | ----------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suivi DG | `/suivi-dg` | SuiviDG.tsx | 5 onglets : Vue d'ensemble (KPIs + pipeline 9 étapes), Circuit Validation (matrice qui/quoi), Par Direction, En attente (table filtrable avec progression), Historique |

**Accès :** DG + ADMIN uniquement

### 3.5 Partenaires (3 pages)

| Module               | Route                                      | Page                    |
| -------------------- | ------------------------------------------ | ----------------------- |
| Prestataires         | `/contractualisation/prestataires`         | Prestataires.tsx        |
| Contrats             | `/contractualisation/contrats`             | Contrats.tsx            |
| Comptabilité Matière | `/contractualisation/comptabilite-matiere` | ComptabiliteMatiere.tsx |

### 3.6 Gestion (3 pages)

| Module            | Route                | Page                  |
| ----------------- | -------------------- | --------------------- |
| Approvisionnement | `/approvisionnement` | Approvisionnement.tsx |
| Trésorerie        | `/tresorerie`        | Tresorerie.tsx        |
| Recettes          | `/recettes`          | Recettes.tsx          |

### 3.7 Rapports (3 pages)

| Module              | Route                  | Page                   |
| ------------------- | ---------------------- | ---------------------- |
| Suivi DG            | `/suivi-dg`            | SuiviDG.tsx            |
| États d'Exécution   | `/etats-execution`     | EtatsExecution.tsx     |
| Alertes Budgétaires | `/alertes-budgetaires` | AlertesBudgetaires.tsx |

### 3.8 Paramétrage — 22 modules admin

#### Référentiels (6)

| Module                     | Route                               | Description                                       |
| -------------------------- | ----------------------------------- | ------------------------------------------------- |
| Exercices                  | `/admin/exercices`                  | Gestion exercices budgétaires (ouverture/clôture) |
| Paramètres Exercice        | `/admin/parametres-exercice`        | Configuration par exercice                        |
| Paramètres Programmatiques | `/admin/parametres-programmatiques` | OS, Programmes, Actions                           |
| Codification               | `/admin/codification`               | Règles de numérotation automatique                |
| Documents Requis           | `/admin/documents-requis`           | Types documents obligatoires par module           |
| Secteurs d'Activité        | `/admin/secteurs-activite`          | Nomenclature secteurs                             |

#### Utilisateurs & Sécurité (7)

| Module                 | Route                      | Description                      |
| ---------------------- | -------------------------- | -------------------------------- |
| Utilisateurs           | `/admin/utilisateurs`      | Gestion comptes utilisateurs     |
| Profils & Rôles        | `/admin/roles`             | Attribution rôles (21 app_roles) |
| Autorisations          | `/admin/autorisations`     | Permissions granulaires          |
| Seuils de Validation   | `/admin/seuils-validation` | Montants seuils par rôle         |
| Délégations            | `/admin/delegations`       | Délégation de pouvoir            |
| Intérims               | `/admin/interims`          | Gestion des intérimaires         |
| Notifications par Rôle | `/admin/notification-role` | Configuration notifs par rôle    |

#### Système (9)

| Module               | Route                         | Description                      |
| -------------------- | ----------------------------- | -------------------------------- |
| Paramètres Système   | `/admin/parametres`           | Configuration globale            |
| Comptes Bancaires    | `/admin/comptes-bancaires`    | Comptes bancaires ARTI           |
| Comptes Prestataires | `/admin/banques-fournisseurs` | RIB prestataires                 |
| Templates Email      | `/admin/email-templates`      | Modèles emails notification      |
| Rappels Automatiques | `/admin/rappels-automatiques` | Règles de rappel automatique     |
| Alertes DMG          | `/admin/alertes-dmg`          | Configuration alertes DMG        |
| Compteurs Références | `/admin/compteurs`            | Séquences numérotation + reset   |
| Journal d'Audit      | `/admin/journal-audit`        | Log de toutes les actions        |
| Gestion Doublons     | `/admin/doublons`             | Détection et traitement doublons |

### 3.9 Pages Utilitaires

| Module           | Route               | Description                                                      |
| ---------------- | ------------------- | ---------------------------------------------------------------- |
| Dashboard        | `/`                 | Tableau de bord adapté au rôle (DG/DAAF/CB/Trésorerie/Direction) |
| Recherche        | `/recherche`        | Recherche globale dossiers                                       |
| Suivi Dossiers   | `/suivi-dossiers`   | Suivi pipeline dossiers                                          |
| Notifications    | `/notifications`    | Centre de notifications                                          |
| Mon Profil       | `/mon-profil`       | Profil utilisateur                                               |
| Espace Direction | `/espace-direction` | Vue directeur                                                    |

---

## 4. ROLES ET ACCES (RBAC)

### 21 rôles applicatifs (app_role)

```
ADMIN, DG, DAAF, DGPEC, SDMG, CB, OPERATEUR, TRESORIER, INVITE,
BUDGET_PLANNER, BUDGET_VALIDATOR, EXPENSE_REQUESTER, EXPENSE_VALIDATOR,
AUDITOR, DAF, SDCT, SAF, SDPM, TRESORERIE, COMPTABILITE, CHARGE_MISSION
```

### Qui valide quoi

| Document       | Étape 1             | Étape 2        | Étape 3     | Étape 4   |
| -------------- | ------------------- | -------------- | ----------- | --------- |
| Note SEF       | Directeur           | DG             | —           | —         |
| Imputation     | DAF                 | SDPM           | SDCT        | —         |
| Engagement     | SAF (visa)          | CB (visa)      | DAAF (visa) | DG (visa) |
| Liquidation    | CB                  | DAAF           | DG          | SDCT      |
| Ordonnancement | DAF                 | DG (signature) | —           | —         |
| Règlement      | Trésorier           | —              | —           | —         |
| Passation      | DG (approbation)    | —              | —           | —         |
| Feuille Route  | CB + Chargé Mission | —              | —           | —         |

---

## 5. BOUTONS ET ACTIONS COMMUNS

### Actions disponibles dans chaque module

| Action         | Icône           | Effet                                       | Rôle minimum                |
| -------------- | --------------- | ------------------------------------------- | --------------------------- |
| Créer          | Plus            | Ouvre formulaire, INSERT en brouillon       | OPERATEUR                   |
| Modifier       | Pencil          | Ouvre formulaire pré-rempli, UPDATE         | Créateur (statut=brouillon) |
| Supprimer      | Trash           | Soft delete ou DELETE                       | Créateur (statut=brouillon) |
| Soumettre      | Send            | brouillon → soumis, notification validateur | Créateur                    |
| Valider        | CheckCircle     | soumis → validé, notification créateur      | Validateur du rôle requis   |
| Rejeter        | XCircle         | soumis → rejeté + motif obligatoire         | Validateur                  |
| Différer       | Clock           | soumis → différé + motif + date reprise     | Validateur                  |
| Exporter PDF   | FileDown        | Génère PDF avec QR code                     | Tout rôle ayant accès       |
| Exporter Excel | FileSpreadsheet | Export tableur                              | Tout rôle                   |
| Voir détails   | Eye             | Ouvre panneau détail                        | Tout rôle ayant accès       |

---

## 6. TESTS

### Tests unitaires (704 — Vitest)

| Module            | Tests | Fichier                                                |
| ----------------- | ----- | ------------------------------------------------------ |
| Engagement        | 231   | engagement-utils.test.ts                               |
| Liquidation       | 104   | liquidation-utils.test.ts                              |
| Workflow          | 95    | workflowEngine.test.ts                                 |
| Passation         | 94    | passation-utils.test.ts + passation-evaluation.test.ts |
| RBAC              | 91    | permissions.test.ts                                    |
| Budget/Imputation | 52    | imputation-utils.test.ts                               |
| QR Code           | 33    | qrcode-utils.test.ts                                   |
| Divers            | 4     | example.test.ts                                        |

### Tests E2E (71 specs — Playwright)

Couvrent : Notes SEF, AEF, Imputation, Expression Besoin, Passation, Engagement, Liquidation, Ordonnancement, Règlement

---

## 7. DOCUMENTATION

| Fichier                    | Contenu                                 |
| -------------------------- | --------------------------------------- |
| `CLAUDE.md`                | Instructions IA, conventions, commandes |
| `PROJECT_STATUS.md`        | Ce document — inventaire complet        |
| `ARCHITECTURE.md`          | Architecture technique, schéma DB       |
| `CONVENTIONS.md`           | Règles de code détaillées               |
| `AGENT_CONTEXT.md`         | Contexte session courante               |
| `TESTS_REGISTRY.md`        | Registre complet des tests              |
| `docs/modules/MODULE_*.md` | Documentation par module (21 fichiers)  |
| `docs/CERTIFICATION_*.md`  | Certifications modules (3 fichiers)     |
| `docs/TRANSITION_*.md`     | Guides de transition (6 fichiers)       |

---

## 8. SIDEBAR — STRUCTURE COMPLETE

```
CHAINE DE LA DEPENSE
├── Flux de dépense (collapsible)
│   ├── 1. Notes SEF [badge]
│   ├── 2. Notes AEF
│   ├── 3. Imputation [badge]
│   ├── 4. Expression Besoin
│   ├── 5. Passation Marché [badge]
│   ├── 6. Engagement [badge]
│   ├── 7. Liquidation [badge]
│   ├── 8. Ordonnancement
│   └── 9. Règlement

BUDGET
├── Structure Budgétaire
├── Plan de Travail
├── Virements
├── Import / Export
└── Historique Imports

FEUILLE DE ROUTE
├── Tableau de Bord
├── Mon Espace Direction
├── Projets & Plans
├── Soumissions
└── Import Activités

PARTENAIRES
├── Prestataires
└── Contrats

GESTION
├── Approvisionnement
├── Trésorerie
├── Recettes
└── Comptabilité Matière

RAPPORTS
├── Suivi DG
├── États d'exécution
└── Alertes Budgétaires

PARAMETRAGE
├── Configuration (collapsible)
│   ├── Référentiels (6 items)
│   ├── Utilisateurs & Sécurité (7 items)
│   └── Système (9 items)
```
