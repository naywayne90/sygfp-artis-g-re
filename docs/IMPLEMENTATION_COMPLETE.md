# SYGFP - Documentation Complète d'Implémentation

> Document de sauvegarde généré le 18 janvier 2026
> Version: 1.0.0 | Commit: 97d1b0d

---

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Chaîne de Dépense](#chaîne-de-dépense)
4. [Modules Implémentés](#modules-implémentés)
5. [Base de Données](#base-de-données)
6. [Système d'Audit](#système-daudit)
7. [RBAC et Permissions](#rbac-et-permissions)
8. [Routes et Navigation](#routes-et-navigation)
9. [Hooks Personnalisés](#hooks-personnalisés)
10. [Composants Clés](#composants-clés)
11. [Migrations SQL](#migrations-sql)

---

## Vue d'ensemble

SYGFP (Système de Gestion des Finances Publiques) est une application de gestion budgétaire complète pour l'ARTI (Autorité de Régulation du Transport Intérieur).

### Stack Technique

| Technologie    | Version | Usage                       |
| -------------- | ------- | --------------------------- |
| React          | 18.x    | Framework UI                |
| TypeScript     | 5.x     | Typage statique             |
| Vite           | 5.4.19  | Build tool                  |
| TanStack Query | 5.x     | Gestion état serveur        |
| Supabase       | -       | Backend (Auth, DB, Storage) |
| Tailwind CSS   | 3.x     | Styling                     |
| shadcn/ui      | -       | Composants UI               |
| React Router   | 6.x     | Routing                     |

### Build Info

```
3830 modules transformés
Build time: ~15s
Output: dist/ (~4.2MB JS, ~118KB CSS)
```

---

## Architecture Technique

### Structure des Dossiers

```
src/
├── components/           # Composants React
│   ├── attachments/      # Gestion pièces jointes
│   ├── audit/            # Audit et traçabilité
│   ├── auth/             # Authentification et RBAC
│   ├── budget/           # Gestion budgétaire
│   ├── dashboard/        # Tableaux de bord
│   ├── engagement/       # Engagements
│   ├── execution/        # Exécution physique
│   ├── expression-besoin/# Expression des besoins
│   ├── imputation/       # Imputations budgétaires
│   ├── layout/           # Layout global
│   ├── liquidation/      # Liquidations
│   ├── notes-aef/        # Notes AEF
│   ├── notes-sef/        # Notes SEF
│   ├── notification/     # Notifications budgétaires
│   ├── ordonnancement/   # Ordonnancements
│   ├── passation-marche/ # Passation de marchés
│   ├── planification/    # Feuilles de route
│   ├── reglement/        # Règlements
│   ├── shared/           # Composants partagés
│   ├── ui/               # shadcn/ui
│   └── workflow/         # Workflow et timelines
├── config/               # Configuration
│   └── modules.registry.ts # Registre des 69 modules
├── contexts/             # Contextes React
│   ├── ExerciceContext.tsx
│   └── RBACContext.tsx
├── hooks/                # Hooks personnalisés (50+)
├── integrations/         # Intégrations externes
│   └── supabase/
├── lib/                  # Utilitaires
│   ├── config/
│   ├── feature-flags/
│   └── rbac/
├── pages/                # Pages (50 routes)
│   ├── admin/            # Administration
│   ├── auth/             # Authentification
│   ├── contractualisation/
│   ├── execution/        # Exécution budgétaire
│   ├── planification/    # Planification
│   ├── recettes/
│   └── tresorerie/
├── services/             # Services métier
└── types/                # Types TypeScript
```

---

## Chaîne de Dépense

### Workflow Complet (10 étapes)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Note SEF   │───▶│  Note AEF   │───▶│ Imputation  │───▶│ Engagement  │
│  (brouillon)│    │ (validation)│    │ (budget)    │    │ (contrat)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                               │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  Règlement  │◀───│Ordonnancement│◀───│ Liquidation │◀─────────┘
│  (paiement) │    │  (mandat)   │    │ (facture)   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Référence Pivot ARTI

Format: `ARTI{MM}{YY}{XXXXXX}`

| Composant | Description           | Exemple |
| --------- | --------------------- | ------- |
| ARTI      | Préfixe fixe          | ARTI    |
| MM        | Mois (01-12)          | 01      |
| YY        | Année                 | 26      |
| XXXXXX    | Séquentiel 6 chiffres | 000001  |

**Exemple complet**: `ARTI012600001`

Cette référence est **immuable** et suit le dossier à travers toutes les étapes.

### Statuts par Étape

| Étape          | Statuts possibles                          |
| -------------- | ------------------------------------------ |
| Note SEF       | brouillon, soumis, valide, rejete, differe |
| Note AEF       | brouillon, soumis, valide, rejete          |
| Imputation     | brouillon, valide                          |
| Engagement     | brouillon, soumis, valide, rejete          |
| Liquidation    | brouillon, soumis, valide, rejete          |
| Ordonnancement | brouillon, signe, rejete                   |
| Règlement      | en_attente, effectue, annule               |

---

## Modules Implémentés

### Registre des Modules (69 modules)

```typescript
// src/config/modules.registry.ts
export const MODULES_REGISTRY: ModuleRegistration[] = [...]
```

#### Catégories

| Catégorie            | Modules                                                                       | Status   |
| -------------------- | ----------------------------------------------------------------------------- | -------- |
| Accueil              | Dashboard, Recherche, Notifications                                           | ✅ Ready |
| Exécution Budgétaire | Notes SEF/AEF, Imputation, Engagement, Liquidation, Ordonnancement, Règlement | ✅ Ready |
| Planification        | Budget, Structure, Virements, Feuilles de route                               | ✅ Ready |
| Administration       | Utilisateurs, Rôles, Exercices, Journal Audit                                 | ✅ Ready |
| Contractualisation   | Prestataires, Contrats, Comptabilité matière                                  | ✅ Ready |

### Dashboards

| Dashboard | Route                            | Rôles     | Description                     |
| --------- | -------------------------------- | --------- | ------------------------------- |
| Principal | `/`                              | Tous      | Vue générale                    |
| DG        | `/execution/dashboard-dg`        | DG, Admin | Vue consolidée multi-directions |
| Direction | `/execution/dashboard-direction` | Directeur | Vue par direction               |
| Exécution | `/execution/dashboard`           | Tous      | Suivi exécution budgétaire      |

---

## Base de Données

### Tables Principales (100+ tables)

#### Structure Programmatique

- `objectifs_strategiques`
- `missions`
- `actions`
- `activites`
- `sous_activites`
- `directions` (24 entrées)

#### Budget

- `budget_lines`
- `budget_versions`
- `budget_activities`
- `budget_movements`
- `budget_history`
- `budg_alert_rules`
- `budg_alerts`
- `budget_kpis`

#### Chaîne de Dépense

- `notes_sef` + `notes_sef_attachments`, `notes_sef_pieces`
- `notes_dg` (= AEF) + `notes_dg_attachments`
- `imputations` + `imputation_lignes`
- `expressions_besoin`
- `marches` + `marche_documents`, `marche_lots`
- `budget_engagements` + `engagement_documents`
- `budget_liquidations` + `liquidation_attachments`
- `ordonnancements` + `ordonnancement_attachments`
- `reglements`

#### Dossiers

- `dossiers`
- `dossier_etapes`
- `dossier_documents`
- `dossier_sequences`
- `arti_reference_counters`

#### Workflow

- `workflow_statuses`
- `workflow_transitions`
- `workflow_transition_history`
- `workflow_tasks`

#### Utilisateurs

- `profiles` (id, email, full_name, direction_id, matricule, role_hierarchique, profil_fonctionnel)
- `user_roles`
- `custom_roles`
- `profils_fonctionnels`

#### Audit

- `audit_logs`

---

## Système d'Audit

### Architecture Double

1. **useAuditLog** - Audit basique
2. **useAuditTrail** - Audit avec signatures QR

### Types d'Entités (26 types)

```typescript
// src/hooks/useAuditJournal.ts
export const ENTITY_TYPES = [
  // Chaîne de dépense
  { value: 'note_sef', label: 'Notes SEF' },
  { value: 'note_aef', label: 'Notes AEF' },
  { value: 'imputation', label: 'Imputations' },
  { value: 'engagement', label: 'Engagements' },
  { value: 'liquidation', label: 'Liquidations' },
  { value: 'ordonnancement', label: 'Ordonnancements' },
  { value: 'reglement', label: 'Règlements' },
  // Budget
  { value: 'budget', label: 'Budget' },
  { value: 'budget_line', label: 'Lignes budgétaires' },
  { value: 'budget_import', label: 'Import budget' },
  { value: 'budget_transfer', label: 'Virements budgétaires' },
  // Feuille de route
  { value: 'roadmap', label: 'Feuille de route' },
  { value: 'roadmap_submission', label: 'Soumission feuille de route' },
  { value: 'task_execution', label: 'Exécution tâche' },
  // Documents
  { value: 'document_scan', label: 'Document scanné' },
  { value: 'attachment', label: 'Pièce jointe' },
  // Marchés
  { value: 'marche', label: 'Marchés' },
  { value: 'contrat', label: 'Contrats' },
  { value: 'prestataire', label: 'Prestataires' },
  // Autres
  { value: 'dossier', label: 'Dossiers' },
  { value: 'user', label: 'Utilisateurs' },
  { value: 'user_role', label: 'Rôles utilisateurs' },
  { value: 'notification', label: 'Notifications' },
  { value: 'alert', label: 'Alertes' },
  { value: 'system', label: 'Système' },
  { value: 'exercice', label: 'Exercices' },
];
```

### Types d'Actions (40+ actions)

```typescript
export const ACTION_TYPES = [
  // CRUD
  { value: 'create', label: 'Création' },
  { value: 'update', label: 'Modification' },
  { value: 'delete', label: 'Suppression' },
  // Workflow
  { value: 'validate', label: 'Validation' },
  { value: 'reject', label: 'Rejet' },
  { value: 'submit', label: 'Soumission' },
  { value: 'defer', label: 'Report' },
  { value: 'sign', label: 'Signature' },
  // Budget
  { value: 'impute', label: 'Imputation' },
  { value: 'transfer', label: 'Virement' },
  // Import/Export
  { value: 'import', label: 'Import' },
  { value: 'export', label: 'Export' },
  { value: 'upload', label: 'Upload fichier' },
  // Tâches
  { value: 'task_started', label: 'Tâche démarrée' },
  { value: 'task_completed', label: 'Tâche terminée' },
  { value: 'task_blocked', label: 'Tâche bloquée' },
  // Roadmap
  { value: 'roadmap_submitted', label: 'Feuille de route soumise' },
  { value: 'roadmap_validated', label: 'Feuille de route validée' },
  { value: 'roadmap_rejected', label: 'Feuille de route rejetée' },
  // Import budget
  { value: 'IMPORT_COMPLETE', label: 'Import terminé' },
  { value: 'IMPORT_ROLLBACK', label: 'Import annulé' },
  // ... et plus
];
```

### UI Admin Journal Audit

**Route**: `/admin/journal-audit`

**Fonctionnalités**:

- Filtres par entité, action, utilisateur, période
- Export CSV
- Statistiques par type et par jour
- Dialogue détaillé (old_values / new_values)
- Couleurs distinctives par type d'action

---

## RBAC et Permissions

### Rôles Hiérarchiques

| Rôle            | Niveau | Description           |
| --------------- | ------ | --------------------- |
| Agent           | 1      | Opérateur de base     |
| Chef de Service | 2      | Responsable service   |
| Sous-Directeur  | 3      | Adjoint direction     |
| Directeur       | 4      | Responsable direction |
| DG              | 5      | Direction Générale    |

### Profils Fonctionnels

| Profil     | Permissions                            |
| ---------- | -------------------------------------- |
| Admin      | Toutes permissions                     |
| CB         | Contrôleur budgétaire                  |
| DAAF       | Direction Administrative et Financière |
| DG         | Direction Générale                     |
| Tresorerie | Gestion trésorerie                     |
| Directeur  | Gestion direction                      |
| Operateur  | Saisie basique                         |
| Auditeur   | Lecture seule audit                    |

### Helpers RLS (Supabase)

```sql
-- Fonctions de vérification
is_admin()      -- Vérifie si admin
is_dg()         -- Vérifie si DG
is_cb()         -- Vérifie si CB
is_daaf()       -- Vérifie si DAAF
is_tresorerie() -- Vérifie si Trésorerie
```

### Configuration RBAC

```typescript
// src/lib/config/rbac-config.ts
export const RBAC_CONFIG = {
  roles: [...],
  permissions: [...],
  rolePermissions: {...}
};
```

---

## Routes et Navigation

### Routes Principales (50 routes)

#### Authentification

| Route               | Composant      | Description           |
| ------------------- | -------------- | --------------------- |
| `/auth`             | LoginPage      | Connexion             |
| `/select-exercice`  | SelectExercice | Sélection exercice    |
| `/no-open-exercice` | NoOpenExercise | Aucun exercice ouvert |

#### Accueil

| Route            | Composant     | Description               |
| ---------------- | ------------- | ------------------------- |
| `/`              | Dashboard     | Tableau de bord principal |
| `/recherche`     | Recherche     | Recherche globale         |
| `/notifications` | Notifications | Centre de notifications   |
| `/alertes`       | Alertes       | Alertes système           |
| `/mon-profil`    | MonProfil     | Profil utilisateur        |
| `/taches`        | WorkflowTasks | Tâches workflow           |

#### Exécution Budgétaire

| Route                             | Composant              | Description           |
| --------------------------------- | ---------------------- | --------------------- |
| `/execution/dashboard`            | DashboardExecution     | Dashboard exécution   |
| `/execution/dashboard-dg`         | DashboardDGPage        | Dashboard DG          |
| `/execution/dashboard-direction`  | DashboardDirectionPage | Dashboard Direction   |
| `/notes-sef`                      | NotesSEF               | Liste notes SEF       |
| `/notes-sef/:id`                  | NoteSEFDetail          | Détail note SEF       |
| `/notes-sef/validation`           | ValidationNotesSEF     | Validation notes SEF  |
| `/notes-aef`                      | NotesAEF               | Liste notes AEF       |
| `/notes-aef/:id`                  | NoteAEFDetail          | Détail note AEF       |
| `/execution/imputation`           | ImputationPage         | Imputations           |
| `/execution/passation-marche`     | PassationMarche        | Passation marchés     |
| `/engagements`                    | Engagements            | Liste engagements     |
| `/execution/scanning-engagement`  | ScanningEngagement     | Scan engagements      |
| `/liquidations`                   | Liquidations           | Liste liquidations    |
| `/execution/scanning-liquidation` | ScanningLiquidation    | Scan liquidations     |
| `/ordonnancements`                | Ordonnancements        | Liste ordonnancements |
| `/reglements`                     | Reglements             | Liste règlements      |

#### Planification

| Route                                       | Composant               | Description           |
| ------------------------------------------- | ----------------------- | --------------------- |
| `/planification/budget`                     | PlanificationBudgetaire | Budget                |
| `/planification/structure`                  | StructureBudgetaire     | Structure             |
| `/planification/virements`                  | Virements               | Virements             |
| `/planification/feuilles-route`             | FeuilleRouteImportPage  | Import feuilles route |
| `/planification/soumissions-feuilles-route` | RoadmapSubmissionsPage  | Soumissions           |
| `/planification/execution-physique`         | TaskExecutionPage       | Exécution physique    |

#### Administration (20+ routes)

| Route                        | Composant           | Description          |
| ---------------------------- | ------------------- | -------------------- |
| `/admin/exercices`           | GestionExercices    | Gestion exercices    |
| `/admin/utilisateurs`        | GestionUtilisateurs | Gestion utilisateurs |
| `/admin/roles`               | GestionRoles        | Gestion rôles        |
| `/admin/journal-audit`       | JournalAudit        | Journal audit        |
| `/admin/parametres`          | ParametresSysteme   | Paramètres           |
| `/admin/comptes-bancaires`   | CompteBancaires     | Comptes bancaires    |
| `/admin/origines-fonds`      | OriginesFonds       | Origines fonds       |
| `/admin/test-non-regression` | TestNonRegression   | Tests                |

---

## Hooks Personnalisés

### Hooks Principaux (50+)

#### Chaîne de Dépense

| Hook               | Fichier                 | Description             |
| ------------------ | ----------------------- | ----------------------- |
| useNotesSEF        | `useNotesSEF.ts`        | CRUD Notes SEF          |
| useNotesAEF        | `useNotesAEF.ts`        | CRUD Notes AEF          |
| useImputation      | `useImputation.ts`      | Imputations budgétaires |
| useEngagements     | `useEngagements.ts`     | Engagements             |
| useLiquidations    | `useLiquidations.ts`    | Liquidations            |
| useOrdonnancements | `useOrdonnancements.ts` | Ordonnancements         |
| useReglements      | `useReglements.ts`      | Règlements              |

#### Budget

| Hook                   | Fichier                     | Description          |
| ---------------------- | --------------------------- | -------------------- |
| useBudgetImport        | `useBudgetImport.ts`        | Import budget Excel  |
| useBudgetLineVersions  | `useBudgetLineVersions.ts`  | Versioning lignes    |
| useBudgetNotifications | `useBudgetNotifications.ts` | Notifications budget |

#### Feuilles de Route

| Hook                  | Fichier                    | Description           |
| --------------------- | -------------------------- | --------------------- |
| useFeuilleRouteImport | `useFeuilleRouteImport.ts` | Import feuilles route |
| useRoadmapSubmissions | `useRoadmapSubmissions.ts` | Soumissions workflow  |
| useRoadmapDiff        | `useRoadmapDiff.ts`        | Comparaison versions  |
| useTaskExecution      | `useTaskExecution.ts`      | Exécution physique    |

#### Audit et Traçabilité

| Hook            | Fichier              | Description          |
| --------------- | -------------------- | -------------------- |
| useAuditLog     | `useAuditLog.ts`     | Logging audit        |
| useAuditJournal | `useAuditJournal.ts` | Consultation journal |
| useAuditTrail   | `useAuditTrail.ts`   | Trail avec QR        |

#### Permissions

| Hook            | Fichier              | Description      |
| --------------- | -------------------- | ---------------- |
| useRBAC         | `useRBAC.ts`         | Permissions RBAC |
| useRBACEnforcer | `useRBACEnforcer.ts` | Enforcement      |
| useDelegations  | `useDelegations.ts`  | Délégations      |

#### Utilitaires

| Hook                  | Fichier                    | Description            |
| --------------------- | -------------------------- | ---------------------- |
| useAttachments        | `useAttachments.ts`        | Pièces jointes         |
| useGenerateDossierRef | `useGenerateDossierRef.ts` | Génération ref ARTI    |
| useExerciceWriteGuard | `useExerciceWriteGuard.ts` | Protection écriture    |
| useDashboardStats     | `useDashboardStats.ts`     | Statistiques dashboard |
| useSpendingCase       | `useSpendingCase.ts`       | Dossier de dépense     |

---

## Composants Clés

### Composants Audit

```typescript
// src/components/audit/
├── AuditLogList.tsx          // Liste avec filtres
├── AuditLogViewer.tsx        // Visualiseur
├── DossierAuditTrail.tsx     // Trail par dossier
├── ValidationProof.tsx       // Preuve validation QR
└── index.ts
```

### Composants Workflow

```typescript
// src/components/workflow/
├── SpendingCaseTimeline.tsx  // Timeline dossier complet
└── index.ts

// Timelines par étape
src/components/engagement/EngagementTimeline.tsx
src/components/liquidation/LiquidationTimeline.tsx
src/components/ordonnancement/OrdonnancementTimeline.tsx
src/components/reglement/ReglementTimeline.tsx
src/components/passation-marche/PassationTimeline.tsx
src/components/expression-besoin/ExpressionBesoinTimeline.tsx
```

### Composants Dashboard

```typescript
// src/components/dashboard/
├── BudgetAlertsWidget.tsx    // Widget alertes
├── DashboardKPI.tsx          // KPIs principaux
└── ...
```

### Composants Planification

```typescript
// src/components/planification/
├── FeuilleRouteImport.tsx      // Import Excel
├── RoadmapDiffViewer.tsx       // Comparaison versions
├── RoadmapSubmissionDetail.tsx // Détail soumission
└── ...
```

### Composants Exécution

```typescript
// src/components/execution/
├── TaskExecutionDetailModal.tsx  // Détail tâche
├── TaskExecutionQuickUpdate.tsx  // Mise à jour rapide
└── ...
```

---

## Migrations SQL

### Liste des Migrations (20+ migrations)

| Fichier                                                         | Description                |
| --------------------------------------------------------------- | -------------------------- |
| `20260118100000_add_exercises_allowed_and_delegation_scope.sql` | Délégations exercices      |
| `20260118110000_create_import_logs.sql`                         | Logs d'import              |
| `20260118120000_create_aef_lignes_estimatives.sql`              | Lignes estimatives AEF     |
| `20260118200000_rls_rbac_socle.sql`                             | Socle RLS/RBAC             |
| `20260118210000_dossier_ref_pivot.sql`                          | Référence pivot ARTI       |
| `20260118220000_attachments_unified.sql`                        | Système PJ unifié          |
| `20260118300000_seed_demo_data.sql`                             | Données démo               |
| `20260118400000_stabilize_referentiels.sql`                     | Stabilisation référentiels |
| `20260118500000_budget_import_rollback.sql`                     | Rollback import budget     |
| `20260118500000_roadmap_submissions.sql`                        | Soumissions feuilles route |
| `20260118600000_budget_line_versioning.sql`                     | Versioning lignes budget   |
| `20260118600000_roadmap_versioning.sql`                         | Versioning roadmap         |
| `20260118700000_comptes_bancaires_enhancements.sql`             | Comptes bancaires          |
| `20260118700000_task_execution.sql`                             | Exécution tâches           |
| `20260118700001_task_execution_source.sql`                      | Source tâches              |
| `20260118800000_funding_sources.sql`                            | Sources financement        |
| `20260118900000_budget_notifications.sql`                       | Notifications budget       |
| `20260118_003_rls_and_base_data.sql`                            | RLS et données base        |
| `20260119000000_rbac_enforcement.sql`                           | Enforcement RBAC           |

---

## Edge Functions

| Fonction                  | Description                |
| ------------------------- | -------------------------- |
| `create-user`             | Création utilisateur admin |
| `r2-storage`              | Stockage Cloudflare R2     |
| `send-notification-email` | Emails via Resend          |
| `generate-export`         | Export Excel/CSV/PDF       |

---

## Stockage

### Configuration R2

- **Service**: Cloudflare R2 via Edge Function
- **Bucket**: `lovable-storage`
- **Prefix**: `sygfp/`
- **Structure**: `sygfp/{entityType}/{exercice}/{entityId}/{timestamp}_{filename}`

---

## Tests

### Page de Test Non-Régression

**Route**: `/admin/test-non-regression`

**15 étapes de test**:

1. Création Note SEF
2. Validation Note SEF
3. Création Note AEF
4. Validation Note AEF
5. Imputation budgétaire
6. Création Engagement
7. Validation Engagement
8. Création Liquidation
9. Validation Liquidation
10. Création Ordonnancement
11. Upload PJ Note SEF
12. Upload PJ Engagement
13. Export Excel Notes SEF
14. Export État OS
15. Vérification RLS

---

## Commandes Utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Vérification types
npm run typecheck

# Linting
npm run lint
```

---

## Historique des Commits Récents

```
97d1b0d Ajout traçabilité audit complète + dashboards DG/Direction
fdb8c40 Implémentation complète chaîne de dépense étapes 1-11
f0db863 Implement imputation step
4f377f9 Changes
fff531c Add AEF from SEF flow
44c9371 Changes
2dd0cce Enhance NoteSEF form
```

---

## Fichiers de Documentation

| Fichier                                    | Description           |
| ------------------------------------------ | --------------------- |
| `docs/IMPLEMENTATION_COMPLETE.md`          | Ce document           |
| `docs/DEV_NOTES_SYGFP.md`                  | Notes développement   |
| `RELEASE_NOTES.md`                         | Notes de version      |
| `.claude/plans/whimsical-petting-ocean.md` | Plan d'implémentation |

---

## Contacts et Support

- **Repository**: https://github.com/naywayne90/sygfp-artis-g-re
- **Branche principale**: main

---

_Document généré automatiquement - SYGFP v1.0.0_
