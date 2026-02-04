# ANALYSE COMPLETE DU PROJET SYGFP

**Date:** 3 Février 2026
**Version:** 1.0
**Projet:** SYGFP - Système de Gestion des Finances Publiques
**Client:** ARTI Gabon (Autorité de Régulation des Télécommunications et des TIC)

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Structure Frontend](#3-structure-frontend)
4. [Backend Supabase](#4-backend-supabase)
5. [Système RBAC](#5-système-rbac)
6. [Chaîne de dépense (9 étapes)](#6-chaîne-de-dépense-9-étapes)
7. [Workflows de validation](#7-workflows-de-validation)
8. [Modules fonctionnels](#8-modules-fonctionnels)
9. [Hooks personnalisés](#9-hooks-personnalisés)
10. [Services et utilitaires](#10-services-et-utilitaires)
11. [Tests](#11-tests)
12. [Annexes](#12-annexes)

---

## 1. VUE D'ENSEMBLE

### 1.1 Description du projet

SYGFP est un système complet de gestion des finances publiques développé pour l'ARTI Gabon. Il couvre l'ensemble du cycle budgétaire, de la planification à l'exécution, en passant par la validation multi-niveaux et le contrôle.

### 1.2 Statistiques du projet

| Métrique | Valeur |
|----------|--------|
| **Fichiers TypeScript/TSX** | 658 |
| **Composants React** | 365 |
| **Pages** | 98 |
| **Hooks personnalisés** | 130+ |
| **Migrations SQL** | 151 |
| **Tables de base de données** | 65+ |
| **Edge Functions** | 4 |
| **Tests E2E** | 73 |
| **Tests unitaires** | 33+ |

### 1.3 Fonctionnalités principales

- Gestion complète de la chaîne de dépense (9 étapes)
- Système RBAC dual (hiérarchique + fonctionnel)
- Workflow de validation multi-niveaux
- Génération de documents PDF avec QR codes
- Import/Export Excel/CSV
- Audit trail complet
- Gestion des pièces jointes (max 3 par entité)
- Notifications automatiques
- Dashboards par rôle

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Stack technologique

#### Frontend
| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Typage statique |
| Vite | 5.x | Bundler/Dev server |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | Latest | Composants UI (Radix) |
| React Query | 5.x | State management serveur |
| React Hook Form | 7.x | Gestion formulaires |
| Zod | 3.x | Validation schémas |
| Vitest | 4.x | Tests unitaires |
| Playwright | 1.58 | Tests E2E |

#### Backend
| Technologie | Rôle |
|-------------|------|
| Supabase | BaaS (PostgreSQL + Auth + Storage) |
| PostgreSQL | Base de données |
| Row-Level Security | Sécurité données |
| Edge Functions | Logique serveur (Deno) |
| Cloudflare R2 | Stockage fichiers |

### 2.2 Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  Pages (98)  │  Components (365)  │  Hooks (130+)  │  Lib (40)  │
└──────────────┴────────────────────┴────────────────┴────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (Backend)                           │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  Auth  │  RLS  │  Edge Functions  │  Storage     │
│  (65+ tables)│        │       │  (4 fonctions)   │  (R2)        │
└──────────────┴────────┴───────┴──────────────────┴──────────────┘
```

### 2.3 Structure des répertoires

```
sygfp-artis-g-re/
├── src/
│   ├── components/     # 365 composants (44 sous-dossiers)
│   ├── pages/          # 98 pages (13 sous-dossiers)
│   ├── hooks/          # 130+ hooks personnalisés
│   ├── lib/            # Utilitaires, RBAC, workflows
│   ├── services/       # Services (PDF, storage)
│   ├── contexts/       # Contextes React
│   ├── types/          # Types TypeScript
│   ├── integrations/   # Client Supabase
│   └── test/           # Tests unitaires
├── supabase/
│   ├── migrations/     # 151 migrations SQL
│   └── functions/      # 4 Edge Functions
├── e2e/                # Tests E2E Playwright
│   ├── fixtures/       # Données de test
│   ├── notes-sef/      # Tests Notes SEF
│   └── documents/      # Tests exports/QR
└── docs/               # Documentation
```

---

## 3. STRUCTURE FRONTEND

### 3.1 Répartition des fichiers

```
Total: 658 fichiers TypeScript/TSX

Components:    365 (55.5%)  ████████████████████
Pages:         98  (14.9%)  █████
Hooks:         129 (19.6%)  ███████
Lib:           40  (6.1%)   ██
Services:      11  (1.7%)   █
Contexts:      2   (0.3%)
Types:         2   (0.3%)
```

### 3.2 Modules de composants (Top 15)

| Rang | Module | Fichiers | Description |
|------|--------|----------|-------------|
| 1 | **UI** | 49 | Composants shadcn/ui (button, dialog, form) |
| 2 | **Budget** | 23 | Gestion budgétaire, imputations, virements |
| 3 | **Notes SEF** | 20 | Notes SEF (Sans Effet Financier) |
| 4 | **Dashboard** | 17 | Tableaux de bord multi-rôles |
| 5 | **Admin** | 15 | Panels administrateur |
| 6 | **Workflow** | 14 | Chaîne de dépense, tâches |
| 7 | **Dossier** | 14 | Gestion dossiers, GED |
| 8 | **Shared** | 12 | Composants partagés |
| 9 | **Ordonnancement** | 11 | Ordonnancement, paiements |
| 10 | **Liquidation** | 11 | Liquidation de dépenses |
| 11 | **Engagement** | 11 | Engagements budgétaires |
| 12 | **Prestataires** | 10 | Gestion fournisseurs |
| 13 | **Marches** | 10 | Marchés publics |
| 14 | **Imputation** | 10 | Imputation budgétaire |
| 15 | **Planification** | 9 | Planification budgétaire |

### 3.3 Structure des pages

#### Pages racine (49 pages)
```
/src/pages/
├── Dashboard.tsx
├── NotesSEF.tsx, NoteSEFDetail.tsx
├── NotesAEF.tsx, NoteAEFDetail.tsx
├── Engagements.tsx
├── Liquidations.tsx
├── Marches.tsx
├── Ordonnancements.tsx
├── Reglements.tsx
├── WorkflowTasks.tsx
├── EtatsExecution.tsx
├── MonProfil.tsx
├── Recherche.tsx
├── SelectExercice.tsx
├── ValidationNotesSEF.tsx
├── ValidationNotesAEF.tsx
└── ...
```

#### Sous-dossiers des pages

| Sous-dossier | Pages | Description |
|--------------|-------|-------------|
| **admin/** | 23 | Gestion rôles, utilisateurs, exercices |
| **execution/** | 7 | Dashboard exécution (DG, Direction) |
| **planification/** | 12 | Budget, structure, imports |
| **tresorerie/** | 5 | Mouvements, approvisionnements |
| **programmatique/** | 4 | Chargement budget |
| **gestion-taches/** | 4 | États exécution, tâches |
| **contractualisation/** | 5 | Contrats, prestataires |
| **dg/** | 2 | Notes à valider (DG) |
| **recettes/** | 1 | Déclaration recettes |
| **auth/** | 1 | LoginPage |

---

## 4. BACKEND SUPABASE

### 4.1 Tables principales (65+ tables)

#### Bloc Utilisateurs & Sécurité
```sql
profiles                    -- Utilisateurs avec profils & hiérarchie
user_roles                  -- Rôles par utilisateur
delegations                 -- Délégations de pouvoir
user_exercices              -- Exercices autorisés par utilisateur
notification_preferences    -- Préférences notifications
```

#### Bloc Chaîne de Dépense
```sql
notes_sef                   -- Étape 1: Accord de Principe
notes_dg                    -- Étape 2: Accord d'Engagement (AEF)
note_imputations            -- Étape 3: Imputations
expression_besoin           -- Étape 4: Expression de Besoin
marches / contrats          -- Étape 5: Passation de Marché
budget_engagements          -- Étape 6: Engagements
budget_liquidations         -- Étape 7: Liquidations
ordonnancements             -- Étape 8: Ordonnancements
reglements                  -- Étape 9: Règlements
```

#### Bloc Référentiels & Budget
```sql
exercices_budgetaires       -- Exercices budgétaires
budget_lines                -- Lignes budgétaires
budget_line_history         -- Historique modifications
budget_movements            -- Mouvements budgétaires
directions                  -- Directions
objectifs_strategiques      -- Objectifs stratégiques
missions                    -- Missions
actions                     -- Actions
activites                   -- Activités
nomenclature_nbe            -- Nomenclature NBE
plan_comptable_sysco        -- Plan comptable SYSCO
prestataires                -- Prestataires
funding_sources             -- Sources de financement
```

#### Bloc Workflows
```sql
wf_definitions              -- Définitions workflows
wf_steps                    -- Étapes workflows
wf_instances                -- Instances workflow (1 par entité)
wf_step_history             -- Historique étapes
```

#### Bloc Pièces Jointes
```sql
pieces_jointes              -- Pièces jointes numérotées (max 3)
config_pieces_obligatoires  -- Configuration PJ obligatoires
documents_generes           -- Documents générés avec QR code
```

### 4.2 Edge Functions

| Fonction | Rôle | Dépendances |
|----------|------|-------------|
| **send-notification-email** | Envoi emails HTML | Resend API |
| **create-user** | Création utilisateurs | Supabase Auth Admin |
| **r2-storage** | Gestion fichiers R2 | AWS S3 SDK |
| **generate-export** | Export CSV/Excel/PDF | - |

### 4.3 Fonctions SQL principales

#### Fonctions RBAC
```sql
is_admin()                  -- Vérif admin
is_dg()                     -- Vérif DG
is_cb()                     -- Vérif Contrôleur Budgétaire
is_daaf()                   -- Vérif DAF/DAAF
can_validate_step(step)     -- Autorisation validation
get_user_direction_id()     -- Direction utilisateur
```

#### Fonctions Workflow
```sql
start_workflow(entity_type, entity_id)
get_workflow_status(entity_type, entity_id)
advance_workflow(entity_type, entity_id, action, motif)
get_pending_workflows(user_id)
```

#### Fonctions Pièces Jointes
```sql
validate_pieces_jointes(type, id, require_pj1)
get_pieces_jointes(type, id)
add_piece_jointe(...)
delete_piece_jointe(type, id, numero)
```

### 4.4 Politiques RLS

**Architecture:**
- RBAC basé sur `profil_fonctionnel` + `role_hierarchique`
- Scopage par `direction_id` et `exercice_id`

**Exemple Notes SEF:**
```sql
-- SELECT: DG voit tout, autres voient leur direction
SELECT: is_dg() OR direction_id = get_user_direction_id() OR created_by = auth.uid()

-- INSERT: Admin ou module autorisé
INSERT: is_admin() OR can_create_in_module('notes_sef')

-- UPDATE: Créateur (brouillon) ou DG
UPDATE: (created_by = auth.uid() AND statut = 'brouillon') OR is_dg()
```

---

## 5. SYSTÈME RBAC

### 5.1 Deux hiérarchies parallèles

#### Hiérarchie des rôles (5 niveaux)
```
Niveau 1: Agent
Niveau 2: Chef de Service
Niveau 3: Sous-Directeur
Niveau 4: Directeur
Niveau 5: DG (Direction Générale)
```

#### Profils fonctionnels (5 profils)
```
Admin        → Accès complet, gestion système
Validateur   → Validation des entités
Opérationnel → Création et soumission
Contrôleur   → Contrôle budgétaire (CB)
Auditeur     → Lecture seule, audit
```

### 5.2 Rôles applicatifs (20+)

| Rôle | Description | Permissions clés |
|------|-------------|------------------|
| **DG** | Direction Générale | validate_note_sef, sign_ordonnancement, read_all |
| **DAAF** | Dir. Admin & Finances | create_engagement, validate_liquidation |
| **CB** | Contrôleur Budgétaire | impute, validate_engagement, approve_virement |
| **TRESORERIE** | Trésorier | execute_reglement, manage_tresorerie |
| **DIRECTEUR** | Directeur | validate_note_aef, view_direction |
| **OPERATEUR** | Opérateur | create, submit, view_own |
| **AUDITEUR** | Auditeur | view_all, export (read-only) |
| **ADMIN** | Administrateur | bypass_all, manage_users |

### 5.3 Matrice de validation

| Étape | Validateurs | Rôle requis |
|-------|-------------|-------------|
| NOTE_SEF | DG, ADMIN | DG |
| NOTE_AEF | DIRECTEUR, DG, ADMIN | DIRECTEUR |
| IMPUTATION | CB, ADMIN | CB |
| ENGAGEMENT | CB, ADMIN | CB |
| LIQUIDATION | DAAF, CB, ADMIN | DAAF |
| ORDONNANCEMENT | DG, ADMIN | DG |
| REGLEMENT | TRESORERIE, ADMIN | TRESORERIE |

### 5.4 Scopes de visibilité

| Scope | Description | Rôles |
|-------|-------------|-------|
| **own** | Ses propres créations | Agent |
| **service** | Son service | Chef de Service |
| **direction** | Sa direction | Directeur, Sous-Directeur |
| **all** | Tout | DG, Admin, Auditeur |

### 5.5 Matrice d'accès aux routes

```typescript
/notes-sef              → [ADMIN, DG, DAAF, CB, DIRECTEUR, OPERATEUR, AUDITEUR]
/notes-sef/validation   → [ADMIN, DG] // SEULEMENT
/execution/imputation   → [ADMIN, CB, DAAF, DG, AUDITEUR]
/ordonnancements        → [ADMIN, DG, TRESORERIE, AUDITEUR]
/reglements             → [ADMIN, DG, TRESORERIE, AUDITEUR]
/admin/*                → [ADMIN] // SEULEMENT
```

---

## 6. CHAÎNE DE DÉPENSE (9 ÉTAPES)

### 6.1 Vue d'ensemble

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  1. NOTE    │   │  2. NOTE    │   │ 3. IMPUTA-  │
│    SEF      │──▶│    AEF      │──▶│    TION     │
│ (Principe)  │   │ (Engagement)│   │ (Budget)    │
└─────────────┘   └─────────────┘   └─────────────┘
                                           │
                                           ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ 6. ENGAGE-  │   │ 5. PASSA-   │   │ 4. EXPRES-  │
│    MENT     │◀──│    TION     │◀──│    SION     │
│ (Crédits)   │   │  (Marché)   │   │  (Besoin)   │
└─────────────┘   └─────────────┘   └─────────────┘
       │
       ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ 7. LIQUIDA- │   │ 8. ORDON-   │   │ 9. RÈGLE-   │
│    TION     │──▶│  NANCEMENT  │──▶│    MENT     │
│ (Service)   │   │ (Ordre)     │   │ (Paiement)  │
└─────────────┘   └─────────────┘   └─────────────┘
```

### 6.2 Détail des étapes

| # | Étape | Table | Description | Validateur |
|---|-------|-------|-------------|------------|
| 1 | **Note SEF** | notes_sef | Accord de Principe (Sans Effet Financier) | DG |
| 2 | **Note AEF** | notes_dg | Autorisation d'Engagement Financier | Directeur/DG |
| 3 | **Imputation** | note_imputations | Imputation budgétaire sur lignes | CB |
| 4 | **Expression Besoin** | expression_besoin | Formalisation du besoin | Directeur |
| 5 | **Passation Marché** | marches | Procédure si montant > seuil | DG/Commission |
| 6 | **Engagement** | budget_engagements | Réservation des crédits | CB |
| 7 | **Liquidation** | budget_liquidations | Constatation service fait | DAAF |
| 8 | **Ordonnancement** | ordonnancements | Ordre de paiement | DG |
| 9 | **Règlement** | reglements | Paiement effectif | Trésorier |

### 6.3 Seuils et règles

- **Passation de marché obligatoire:** Montant ≥ 5 000 000 FCFA
- **Pièce jointe obligatoire par étape:**
  - Engagement: PROFORMA
  - Liquidation: FACTURE
  - Ordonnancement: FICHE_LIQUIDATION
  - Règlement: ORDRE_PAYER

### 6.4 Statuts par étape

| Étape | Statuts possibles |
|-------|-------------------|
| Notes SEF/AEF | brouillon, soumis, validé, rejeté, différé |
| Imputation | en_attente, imputé, rejeté, différé |
| Engagement | brouillon, soumis, engagé, rejeté |
| Liquidation | en_attente, liquidé, rejeté |
| Ordonnancement | en_attente, visé, à_signer, signé, rejeté |
| Règlement | en_cours, payé, refusé, annulé |

---

## 7. WORKFLOWS DE VALIDATION

### 7.1 Système multi-niveaux

Le système utilise les tables `wf_definitions`, `wf_steps`, `wf_instances`, `wf_step_history` pour gérer les workflows.

### 7.2 Workflow Note SEF

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   CRÉATION   │    │  VALIDATION  │    │  VALIDATION  │
│    AGENT     │───▶│  DIRECTEUR   │───▶│     DG       │
│              │    │   (48h)      │    │   (72h)      │
└──────────────┘    └──────────────┘    └──────────────┘
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐    ┌──────────────┐
                    │   REJETÉ     │    │   VALIDÉ     │
                    │  (+ motif)   │    │              │
                    └──────────────┘    └──────────────┘
```

### 7.3 Workflow Engagement

```
Étape 1: CB          → Contrôle Budgétaire (24h)
Étape 2: DAF/DGPEC   → Validation Direction (48h)
Étape 3: DG          → Validation DG (72h)
```

### 7.4 Workflow Liquidation

```
Étape 1: CB          → Contrôle Budgétaire (24h)
Étape 2: DIRECTEUR   → Validation Direction (48h)
Étape 3: DG          → Validation DG (72h)
Étape 4: SDCT        → Validation Comptable (48h)
```

### 7.5 Actions possibles

| Action | Description | Motif requis |
|--------|-------------|--------------|
| **valide** | Accepte l'étape, passage à la suivante | Non |
| **rejete** | Rejette le workflow | Oui |
| **differe** | Met en attente avec condition | Oui |
| **annule** | Annule le workflow | Oui |

### 7.6 Statuts d'instance

- `en_cours` - Workflow actif
- `complete` - Terminé avec succès
- `rejete` - Rejeté
- `annule` - Annulé
- `differe` - En attente

---

## 8. MODULES FONCTIONNELS

### 8.1 Module Notes SEF (20 composants)

**Composants principaux:**
- `NotesSEFList.tsx` - Liste avec filtres et pagination
- `NotesSEFForm.tsx` - Formulaire création/édition
- `NotesSEFDetail.tsx` - Vue détaillée
- `NotesSEFValidation.tsx` - Interface validation DG
- `NotesSEFExports.tsx` - Export PDF/Excel/CSV
- `NotesSEFFilters.tsx` - Filtres avancés
- `NotesSEFTable.tsx` - Tableau de données
- `NotesSEFTabs.tsx` - Navigation par statut

**Hooks associés:**
- `useNotesSEF()` - CRUD + validation
- `useNotesSEFList()` - Liste avec filtres
- `useNotesSEFCounts()` - Compteurs par statut

### 8.2 Module Budget (23 composants)

**Fonctionnalités:**
- Gestion des lignes budgétaires
- Versioning des modifications
- Virements de crédits
- Alertes de consommation
- Import/Export Excel

**Hooks associés:**
- `useBudgetLines()` - Lignes budgétaires
- `useBudgetAvailability()` - Disponibilité
- `useBudgetAlerts()` - Alertes
- `useBudgetMovements()` - Mouvements

### 8.3 Module Dashboard (17 composants)

**Dashboards par rôle:**
- Dashboard DG
- Dashboard Directeur
- Dashboard CB
- Dashboard Agent
- Dashboard Trésorerie

**Widgets:**
- Statistiques générales
- KPIs de paiement
- Tâches en attente
- Alertes budgétaires
- Graphiques d'exécution

### 8.4 Module Workflow (14 composants)

**Composants:**
- `WorkflowTimeline.tsx` - Timeline des étapes
- `WorkflowActions.tsx` - Actions (valider/rejeter/différer)
- `WorkflowStatus.tsx` - Statut actuel
- `WorkflowHistory.tsx` - Historique
- `PendingTasks.tsx` - Tâches en attente

### 8.5 Module Pièces Jointes (9 composants)

**Fonctionnalités:**
- Upload avec progression
- Preview des fichiers
- Validation type MIME
- Limite 3 pièces par entité
- Max 10 MB par fichier

**Composants:**
- `FileUploadZone.tsx` - Zone de drop
- `FileProgress.tsx` - Barre de progression
- `FilePreview.tsx` - Aperçu fichier
- `FileUploadGroup.tsx` - Groupe de fichiers

### 8.6 Module QR Code (4 composants)

**Fonctionnalités:**
- Génération QR avec hash SHA256
- Encodage base64 URL-safe
- Page de vérification publique
- Intégration dans PDF

---

## 9. HOOKS PERSONNALISÉS

### 9.1 Catégories principales

| Catégorie | Nombre | Description |
|-----------|--------|-------------|
| Authentification & Permissions | 8 | RBAC, délégations |
| Workflows & Validation | 9 | Étapes, transitions |
| Chaîne de Dépense | 20 | 9 étapes + helpers |
| Budget & Finances | 18 | Lignes, virements, trésorerie |
| Données & Référentiels | 16 | Directions, paramètres |
| Dashboard & Alertes | 13 | Stats, KPIs, notifications |
| Import/Export & Utilitaires | 46 | Excel, PDF, fichiers, audit |
| **TOTAL** | **130+** | |

### 9.2 Hooks critiques

#### Authentification
```typescript
useRBAC()              // Hook maître RBAC
usePermissions()       // Permissions détaillées
useRoleValidation()    // Validation avec séparation des fonctions
useDelegations()       // Délégations de signature
```

#### Workflows
```typescript
useValidation()        // Validation générique (valider/rejeter/différer)
useWorkflowDossier()   // Gestion workflow complet
useWorkflowTasks()     // Tâches assignées
usePendingTasks()      // Tâches en attente
```

#### Chaîne de dépense
```typescript
useNotesSEF()          // Étape 1
useNotesAEF()          // Étape 2
useImputations()       // Étape 3
useEngagements()       // Étape 6
useLiquidations()      // Étape 7
useOrdonnancements()   // Étape 8
useReglements()        // Étape 9
```

#### Export/Import
```typescript
useExportExcel()       // Export Excel
useExportNoteSEFPdf()  // Export PDF avec QR
useFileUpload()        // Upload fichiers
useARTIImport()        // Import données ARTI
```

---

## 10. SERVICES ET UTILITAIRES

### 10.1 Services (11 fichiers)

| Service | Rôle |
|---------|------|
| `pdf-service.ts` | Génération PDF |
| `export-service.ts` | Export Excel/CSV/PDF |
| `storage-service.ts` | Gestion stockage R2 |
| `notification-service.ts` | Notifications |
| `audit-service.ts` | Audit trail |

### 10.2 Utilitaires lib/ (40 fichiers)

#### RBAC (4 fichiers)
- `types.ts` - Types RBAC
- `permissions.ts` - Matrice permissions
- `config.ts` - Configuration
- `helpers.ts` - Fonctions utilitaires

#### Workflow (5 fichiers)
- `engine.ts` - Moteur workflow
- `transitions.ts` - Règles transitions
- `statuts.ts` - Gestion statuts
- `validators.ts` - Validateurs

#### Export (3 fichiers)
- `export-service.ts` - Service export
- `export-templates.ts` - Templates
- `formatters.ts` - Formatage données

#### Validations (4 fichiers)
- `schemas.ts` - Schémas Zod
- `rules.ts` - Règles validation
- `messages.ts` - Messages erreur

### 10.3 QR Code Utils

```typescript
// Fonctions principales
generateHash(data)           // Hash SHA256
encodePayload(data, checksum) // Encodage base64 URL-safe
decodePayload(encoded)       // Décodage
generateVerifyUrl(data)      // URL vérification
verifyDocument(encoded)      // Vérification
formatValidationDate(date)   // Format français
truncateHash(hash)           // Troncature affichage
```

---

## 11. TESTS

### 11.1 Tests E2E (Playwright)

| Catégorie | Fichiers | Tests |
|-----------|----------|-------|
| Notes SEF | 3 | 25+ |
| Documents/QR | 4 | 37 |
| Example | 1 | 2 |
| **TOTAL** | **8** | **73** |

#### Tests Notes SEF
- `creation.spec.ts` - Création de notes
- `validation.spec.ts` - Workflow validation
- `exports.spec.ts` - Exports PDF/Excel/CSV

#### Tests Documents
- `qrcode.spec.ts` - Génération QR codes
- `pdf-export.spec.ts` - Export PDF
- `excel-export.spec.ts` - Export Excel/CSV
- `verify-page.spec.ts` - Page vérification publique

### 11.2 Tests unitaires (Vitest)

| Fichier | Tests |
|---------|-------|
| `qrcode-utils.test.ts` | 33 |

### 11.3 Commandes de test

```bash
npm run test           # Tests unitaires
npm run test:e2e       # Tests E2E
npm run test:e2e:ui    # Tests E2E avec UI
npm run test:coverage  # Couverture
```

---

## 12. ANNEXES

### 12.1 Format de référence ARTI

```
Format: ARTI{MM}{YY}{NNNNNN}
Exemple: ARTI012600001

MM = Mois (01-12)
YY = Année (26 = 2026)
NNNNNN = Numéro séquentiel
```

### 12.2 Types MIME autorisés

```
PDF:   application/pdf
Images: image/png, image/jpeg, image/gif, image/webp
Word:   application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
Excel:  application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
PPT:    application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation
Autres: text/plain, text/csv, application/zip
```

### 12.3 Limites système

| Limite | Valeur |
|--------|--------|
| Pièces jointes par entité | 3 max |
| Taille fichier | 10 MB max |
| Taille totale par entité | 25 MB max |
| Longueur hash QR | 64 caractères (SHA256) |
| Délai validation Note SEF | 72h |
| Seuil marché obligatoire | 5 000 000 FCFA |

### 12.4 Commandes utiles

```bash
# Développement
npm run dev              # Serveur dev (port 8080)
npm run build            # Build production

# Qualité
npm run lint             # ESLint
npm run lint:fix         # Fix auto ESLint
npm run typecheck        # Vérification TypeScript
npm run format           # Prettier

# Tests
npm run test             # Tests unitaires
npm run test:e2e         # Tests E2E
npm run verify           # types + lint + tests

# Supabase
npx supabase start       # Démarrer local
npx supabase db push     # Appliquer migrations
npx supabase gen types   # Générer types
```

### 12.5 Variables d'environnement

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_APP_ENV=development|production
```

---

## CONCLUSION

SYGFP est un système complet et robuste de gestion des finances publiques, couvrant:

- **658 fichiers TypeScript** avec typage strict
- **9 étapes** de la chaîne de dépense
- **RBAC dual** (hiérarchique + fonctionnel)
- **Workflow multi-niveaux** avec audit trail
- **151 migrations SQL** structurées
- **65+ tables** avec RLS
- **73 tests E2E** + tests unitaires

Le système est conçu pour être:
- **Sécurisé** via RLS et RBAC
- **Auditable** via historique complet
- **Scalable** via architecture modulaire
- **Maintenable** via code TypeScript typé

---

**Document généré le:** 3 Février 2026
**Auteur:** Claude Code (Anthropic)
**Projet:** SYGFP - ARTI Gabon
