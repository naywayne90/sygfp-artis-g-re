# Analyse Complète du Projet SYGFP

**Date**: 29 janvier 2026
**Projet**: SYGFP (Système de Gestion Financière et de Planification)
**Organisation**: ARTI Gabon
**Version analysée**: Commit b6c56b8 (main)

---

## Table des Matières

1. [Structure du Projet](#1-structure-du-projet)
2. [Architecture Technique](#2-architecture-technique)
3. [Base de Données Supabase](#3-base-de-données-supabase)
4. [Pages et Routing](#4-pages-et-routing)
5. [Composants](#5-composants)
6. [Hooks et Logique Métier](#6-hooks-et-logique-métier)
7. [Types TypeScript](#7-types-typescript)
8. [Tests](#8-tests)
9. [Bugs et Problèmes Identifiés](#9-bugs-et-problèmes-identifiés)
10. [Flux de Données](#10-flux-de-données)

---

## 1. Structure du Projet

### 1.1 Arborescence Complète

```
/home/angeyannick/sygfp-artis-g-re/
├── src/
│   ├── assets/
│   │   └── logo-arti.jpg
│   ├── components/           (325 fichiers, 41 catégories)
│   ├── config/              (2 fichiers)
│   ├── contexts/            (2 fichiers)
│   ├── hooks/               (124 fichiers)
│   ├── integrations/        (2 fichiers)
│   ├── lib/                 (29 fichiers, 12 sous-dossiers)
│   ├── pages/               (95 fichiers)
│   ├── services/            (5 fichiers)
│   ├── test/                (3 fichiers)
│   ├── types/               (1 fichier)
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── supabase/
│   ├── functions/           (4 Edge Functions)
│   │   ├── create-user/
│   │   ├── generate-export/
│   │   ├── r2-storage/
│   │   └── send-notification-email/
│   ├── migrations/          (151 fichiers de migration)
│   └── config.toml
│
├── e2e/                     (Tests E2E Playwright)
│   └── example.spec.ts
│
├── public/
├── docs/
├── .claude/                 (Configuration Claude Code)
├── .husky/                  (Git hooks)
│
└── Fichiers de Configuration
    ├── vite.config.ts
    ├── vitest.config.ts
    ├── playwright.config.ts
    ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
    ├── tailwind.config.ts
    ├── eslint.config.js
    ├── .prettierrc
    ├── .mcp.json
    ├── package.json
    └── .env
```

### 1.2 Statistiques du Projet

| Métrique                      | Nombre |
| ----------------------------- | ------ |
| Fichiers TypeScript           | 616    |
| Fichiers de composants        | 325    |
| Hooks personnalisés           | 124    |
| Pages                         | 95     |
| Fichiers de librairie         | 29     |
| Services                      | 5      |
| Migrations de base de données | 151    |
| Edge Functions                | 4      |
| Catégories de composants      | 41     |
| Sous-dossiers de pages        | 11     |

---

## 2. Architecture Technique

### 2.1 Stack Technologique

| Couche               | Technologies                          |
| -------------------- | ------------------------------------- |
| **Frontend**         | React 18.3 + TypeScript + Vite        |
| **UI Framework**     | Radix UI (25+ composants) + shadcn/ui |
| **Formulaires**      | React Hook Form 7.61 + Zod 3.25       |
| **State Management** | TanStack Query 5.83 (React Query)     |
| **Backend**          | Supabase (PostgreSQL + Auth + RLS)    |
| **Styling**          | Tailwind CSS + Tailwind Merge         |
| **Charts**           | Recharts 2.15                         |
| **PDF**              | jsPDF 4.0 + jsPDF AutoTable 5.0       |
| **Excel**            | XLSX 0.18                             |
| **QR Codes**         | qrcode.react 4.2                      |
| **Notifications**    | Sonner 1.7                            |
| **Dates**            | date-fns 3.6                          |
| **Icônes**           | Lucide React 0.462                    |
| **Tests Unitaires**  | Vitest                                |
| **Tests E2E**        | Playwright                            |

### 2.2 Configuration Vite (vite.config.ts)

```typescript
{
  plugins: [react()],  // React SWC pour compilation rapide
  resolve: {
    alias: { '@': '/src' }  // Import alias @/
  },
  server: {
    host: '::',
    port: 8080
  }
}
```

### 2.3 Configuration TypeScript

- **Base path**: `.`
- **Path alias**: `@/*` → `src/*`
- **Mode strict** activé
- **Skip lib check** activé pour performances

### 2.4 Configuration Tailwind

- **Dark mode**: class strategy
- **Système de couleurs** étendu via CSS variables
- **Animations**: accordion-down, accordion-up, fade-in
- **Breakpoints**: jusqu'à 2xl (1400px)

### 2.5 MCP Servers Configurés (.mcp.json)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-filesystem", "/home/..."]
    },
    "playwright": { "command": "npx", "args": ["-y", "@anthropic-ai/mcp-server-playwright"] },
    "context7": { "command": "npx", "args": ["-y", "@anthropic-ai/mcp-server-context7"] },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-supabase", "--url", "...", "--access-token", "..."]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-sequential-thinking"]
    }
  }
}
```

### 2.6 Scripts NPM

```bash
npm run dev          # Serveur de développement (port 8080)
npm run build        # Build de production
npm run test         # Tests unitaires Vitest
npm run test:ui      # Vitest avec interface graphique
npm run test:coverage # Tests avec couverture (seuil: 50%)
npm run test:e2e     # Tests E2E Playwright
npm run test:e2e:ui  # Playwright avec interface graphique
npm run lint         # Vérification ESLint
npm run lint:strict  # ESLint sans warnings
npm run lint:fix     # Correction automatique
npm run typecheck    # Vérification TypeScript
npm run format       # Formatage Prettier
npm run verify       # Vérification complète (types + lint + tests)
```

---

## 3. Base de Données Supabase

### 3.1 Vue d'Ensemble

- **151 migrations** SQL
- **70+ tables** principales
- **RLS (Row-Level Security)** activée sur les tables sensibles
- **4 Edge Functions** pour les opérations complexes

### 3.2 Tables Principales par Domaine

#### 3.2.1 Authentification & Utilisateurs

**profiles**

```sql
- id: UUID (PK, lié à auth.users)
- email, first_name, last_name, full_name: TEXT
- matricule: TEXT (UNIQUE)
- telephone: TEXT
- direction_id: UUID (FK → directions)
- role_hierarchique: ENUM ('Agent', 'Chef de Service', 'Sous-Directeur', 'Directeur', 'DG')
- profil_fonctionnel: ENUM ('Admin', 'Validateur', 'Operationnel', 'Controleur', 'Auditeur')
- exercice_actif: INTEGER
- is_active: BOOLEAN
```

**user_roles** (RBAC)

```sql
- id: UUID
- user_id: UUID (FK → profiles)
- role: TEXT (20+ rôles: ADMIN, DG, DAAF, CB, TRESORERIE, etc.)
- is_primary, is_active: BOOLEAN
- granted_at, granted_by, revoked_at: TIMESTAMPTZ
```

**delegations**

```sql
- delegateur_id, delegataire_id: UUID (FK → profiles)
- date_debut, date_fin: DATE
- perimetre: TEXT[] ('notes', 'engagements', 'liquidations', etc.)
- motif: TEXT
- est_active: BOOLEAN
```

#### 3.2.2 Structure Organisationnelle

**directions**

```sql
- id: UUID
- code, label, sigle: TEXT
- est_active: BOOLEAN
```

#### 3.2.3 Hiérarchie Programmatique

```
objectifs_strategiques (OS)
  ↓ (1-to-Many)
missions + actions (FK → OS)
  ↓
activites (FK → actions)
  ↓
sous_activites (FK → activites)
  ↓
taches (FK → sous_activites)
```

**taches** (niveau le plus bas)

```sql
- sous_activite_id: UUID (FK)
- code, libelle, description: TEXT
- date_debut, date_fin, date_fin_reelle: DATE
- avancement: INTEGER (0-100)
- budget_line_id: UUID (FK)
- budget_prevu: NUMERIC
- statut: TEXT ('planifie', 'en_cours', 'termine', 'en_retard', 'suspendu', 'annule')
- priorite: TEXT ('basse', 'normale', 'haute', 'critique')
- RACI: raci_responsable, raci_accountable, raci_consulted[], raci_informed[]
```

#### 3.2.4 Référentiels & Nomenclature

**nomenclature_nbe** (Nomenclature Budgétaire de l'État)

```sql
- code: TEXT (UNIQUE)
- libelle: TEXT
- niveau: TEXT ('titre', 'chapitre', 'article', 'paragraphe')
- parent_code: TEXT
```

**plan_comptable_sysco** (Plan Comptable SYSCO)

```sql
- code: TEXT (UNIQUE)
- libelle: TEXT
- classe: TEXT (1-9)
- type: TEXT ('actif', 'passif', 'charge', 'produit')
```

#### 3.2.5 Budget & Exercices

**exercices_budgetaires**

```sql
- annee: INTEGER (UNIQUE)
- statut: TEXT ('ouvert', 'en_cours', 'cloture', 'archive')
- date_ouverture, date_cloture: DATE
```

**budget_lines**

```sql
- exercice: INTEGER
- code, label: TEXT
- dotation_initiale, dotation_modifiee, disponible_calcule, total_engage: NUMERIC
- direction_id, os_id, mission_id, action_id, activite_id, sous_activite_id: UUID (FK)
- nbe_id: UUID (FK → nomenclature_nbe)
- sysco_id: UUID (FK → plan_comptable_sysco)
- source_financement: TEXT
- statut: TEXT
```

**credit_transfers** (Virements budgétaires)

#### 3.2.6 Chaîne de Dépenses (9 étapes)

##### Étape 1 & 2: Notes SEF et AEF

**notes_sef** (Note d'Accord de Principe)

```sql
- numero: TEXT (UNIQUE, auto-généré)
- exercice: INTEGER
- direction_id, demandeur_id: UUID (FK)
- beneficiaire_id: UUID (FK → prestataires, optionnel)
- beneficiaire_interne_id: UUID (FK → profiles, optionnel)
- objet, description: TEXT
- montant_estime: NUMERIC
- urgence: TEXT ('basse', 'normale', 'haute', 'urgente')
- statut: TEXT ('brouillon', 'soumis', 'a_valider', 'valide', 'rejete', 'differe')
- rejection_reason, differe_motif, differe_condition: TEXT
- dossier_id: UUID (FK → dossiers)
```

**notes_direction_generale** (Notes AEF avec Imputations)

```sql
- reference: TEXT (format NDG-MM-YY-XXXX)
- destinataire, objet: TEXT
- expose, avis, recommandations: TEXT
- document_annexe_files: JSONB
- signature_qr_data: TEXT
- statut: TEXT ('brouillon', 'soumise_dg', 'dg_valide', 'dg_rejetee', 'diffusee')
```

**lignes_estimatives_aef** (Lignes budgétaires AEF)

```sql
- note_aef_id: UUID (FK)
- categorie: TEXT (fournitures, equipement, services, etc.)
- description: TEXT
- quantite: INTEGER
- prix_unitaire, montant: NUMERIC (montant = quantite × prix_unitaire)
```

##### Étape 3: Imputations

**note_imputations**

```sql
- note_sef_id: UUID (FK, UNIQUE)
- impute_par_user_id: UUID (FK)
```

**note_imputation_lignes**

```sql
- imputation_id: UUID (FK)
- destinataire: TEXT
- destinataire_id: UUID (FK → directions)
- instruction_type: ENUM (ATTRIBUTION, DIFFUSION, SUIVI, A_FAIRE_SUITE, CLASSEMENT)
- priorite: ENUM (basse, normale, haute, urgente)
- delai: TEXT
```

##### Étape 4: Expressions de Besoin

**expressions_besoin**

```sql
- numero: TEXT
- objet, justification: TEXT
- budget_line_id: UUID (FK)
- montant_estime: NUMERIC
- statut: TEXT
```

##### Étape 5: Marchés

**marches**

```sql
- numero: TEXT
- objet: TEXT
- type_marche: TEXT
- prestataire_id: UUID (FK)
- montant: NUMERIC
- statut: TEXT ('brouillon', 'en_cours', 'attribue', 'infructueux', 'annule')
```

##### Étape 6: Engagements

**budget_engagements**

```sql
- numero: TEXT (format ENG-{EXERCICE}-{SEQUENCE:5})
- dossier_id: UUID (FK)
- budget_line_id: UUID (FK)
- fournisseur, objet: TEXT
- montant: NUMERIC
- statut: TEXT
```

##### Étape 7: Liquidations

**budget_liquidations**

```sql
- numero: TEXT (format LIQ-{EXERCICE}-{SEQUENCE:4})
- engagement_id: UUID (FK)
- montant_ht, tva_taux, tva_montant, airsi_montant, montant, net_a_payer: NUMERIC
- reference_facture: TEXT
- service_fait: BOOLEAN
- workflow_status: TEXT
```

##### Étape 8: Ordonnancements

**ordonnancements**

```sql
- numero: TEXT (format ORD-{EXERCICE}-{SEQUENCE:5})
- liquidation_id: UUID (FK)
- montant: NUMERIC
- mode_paiement: TEXT
- beneficiaire, banque, rib: TEXT
- statut: TEXT ('en_attente', 'vise', 'a_signer', 'signe', 'rejete', 'differe')
```

##### Étape 9: Règlements

**reglements**

```sql
- ordonnancement_id: UUID (FK)
- montant: NUMERIC
- mode_reglement: TEXT ('virement', 'cheque', 'espece')
- reference_bancaire: TEXT
- statut: TEXT ('en_cours', 'paye', 'refuse', 'annule')
```

#### 3.2.7 Dossiers (Gestion des Cas)

**dossiers**

```sql
- numero: TEXT (UNIQUE, format ARTI + MM + YY + NNNNNN)
- exercice: INTEGER
- direction_id, demandeur_id: UUID
- objet: TEXT
- montant_estime, montant_engage, montant_liquide, montant_ordonnance: NUMERIC
- statut_global: TEXT ('en_cours', 'termine', 'annule', 'suspendu')
- etape_courante: TEXT (note, expression_besoin, marche, engagement, liquidation, ordonnancement, reglement)
```

**dossier_etapes** (Timeline)

```sql
- dossier_id: UUID (FK)
- type_etape: TEXT
- entity_id: UUID (référence vers l'entité spécifique)
- statut: TEXT
- montant: NUMERIC
```

**dossier_documents** (GED)

```sql
- dossier_id: UUID (FK)
- type_document, categorie: TEXT
- file_name, file_path: TEXT
- file_size: INTEGER
```

#### 3.2.8 Pièces Jointes (Système Unifié)

**attachments**

```sql
- dossier_ref: TEXT (pivot ARTI0126000001)
- step: TEXT (note_sef, note_aef, imputation, engagement, liquidation, etc.)
- filename, original_name, storage_path: TEXT
- content_type: TEXT
- size: INTEGER
- entity_id: UUID (optionnel)
- uploaded_by: UUID
```

Storage: `sygfp/attachments/{exercice}/{dossier_ref}/{step}/...`

#### 3.2.9 Prestataires & Fournisseurs

**prestataires**

```sql
- raison_sociale, sigle: TEXT
- nif, rccm: TEXT
- adresse, telephone, email: TEXT
- type: TEXT ('fournisseur', 'prestataire_service', etc.)
- secteurs_activite: TEXT[]
- est_actif: BOOLEAN
```

**prestataire_bank_accounts**

```sql
- prestataire_id: UUID (FK)
- banque, numero_compte, iban, bic: TEXT
- est_principal: BOOLEAN
```

#### 3.2.10 Trésorerie & Comptabilité

**comptes_bancaires**

```sql
- code: VARCHAR(20, UNIQUE)
- banque, numero_compte, iban, bic: TEXT
- solde_initial, solde_actuel: NUMERIC(18,2)
- devise: VARCHAR(3) (défaut: XOF)
- type_compte: TEXT ('courant', 'tresorerie')
```

**operations_tresorerie**

```sql
- numero: TEXT (format OPT-{EXERCICE}-{SEQUENCE:5})
- compte_id: UUID (FK)
- type_operation: TEXT (entree, sortie, virement)
- montant, solde_avant, solde_apres: NUMERIC
- reference_externe: TEXT
- reglement_id, recette_id: UUID (FK)
- rapproche: BOOLEAN
```

**recettes**

```sql
- numero: TEXT (format RCT-{EXERCICE}-{SEQUENCE:4})
- origine, categorie: TEXT
- montant: NUMERIC(18,2)
- compte_id: UUID (FK)
- statut: TEXT ('brouillon', 'validee', 'encaissee', 'annulee')
```

#### 3.2.11 Approvisionnement & Stock

**articles**

```sql
- code: VARCHAR(50, UNIQUE)
- libelle, description: TEXT
- unite, categorie: TEXT
- seuil_mini, stock_actuel: INTEGER
- prix_unitaire_moyen: NUMERIC
```

**demandes_achat**

```sql
- numero: TEXT (format DA-{EXERCICE}-{SEQUENCE:4})
- objet, justification: TEXT
- urgence: TEXT
- montant_estime: NUMERIC
- statut: TEXT
```

**receptions**

```sql
- numero: TEXT (format REC-{EXERCICE}-{SEQUENCE:4})
- demande_id: UUID (FK)
- fournisseur: TEXT
- numero_bl, numero_facture: TEXT
```

**mouvements_stock**

```sql
- numero: TEXT (format MVT-{EXERCICE}-{SEQUENCE:5})
- type_mouvement: TEXT (entree, sortie, transfert, ajustement)
- article_id: UUID (FK)
- quantite, stock_avant, stock_apres: INTEGER
```

**inventaires**

```sql
- numero: TEXT (format INV-{EXERCICE}-{SEQUENCE:4})
- date_inventaire: DATE
- statut: TEXT
```

#### 3.2.12 Notifications

**notifications**

```sql
- user_id: UUID (FK)
- type, title, message: TEXT
- entity_type, entity_id: TEXT, UUID
- priority: TEXT ('normal', etc.)
- is_read: BOOLEAN
- email_sent: BOOLEAN
- action_url: TEXT
```

**notification_preferences**

```sql
- user_id: UUID (FK)
- notification_type: TEXT
- in_app_enabled, email_enabled: BOOLEAN
```

### 3.3 Fonctions RPC Principales

| Fonction                         | Description                        |
| -------------------------------- | ---------------------------------- |
| `generate_dossier_numero()`      | Génère ARTI + MM + YY + NNNNNN     |
| `generate_liquidation_numero()`  | Format LIQ-{EXERCICE}-{SEQUENCE:4} |
| `generate_note_dg_reference()`   | Format NDG-MM-YY-XXXX              |
| `get_user_permissions()`         | Récupère permissions utilisateur   |
| `check_separation_of_duties()`   | Vérifie séparation des tâches      |
| `has_active_delegation()`        | Vérifie délégations actives        |
| `count_attachments_by_dossier()` | Compte pièces jointes par étape    |
| `check_required_attachments()`   | Vérifie documents requis           |

### 3.4 Triggers Principaux

| Trigger                   | Table                  | Action                             |
| ------------------------- | ---------------------- | ---------------------------------- |
| `update_article_stock`    | mouvements_stock       | Met à jour stock_actuel            |
| `calculate_ligne_montant` | lignes_estimatives_aef | montant = quantite × prix_unitaire |
| `recalculate_aef_total`   | lignes_estimatives_aef | Recalcule total note AEF           |
| `update_compte_solde`     | operations_tresorerie  | Met à jour solde compte bancaire   |
| `generate_*_numero`       | Diverses tables        | Auto-génération des numéros        |

### 3.5 Politiques RLS

**Accès Public (Lecture):**

- objectifs_strategiques, missions, actions, activites, sous_activites
- nomenclature_nbe, plan_comptable_sysco, taches
- dossiers (avec restriction direction)

**Gestion Admin:**

- Toutes les tables de référentiel

**Basé sur le Rôle:**

- budget_lines: DAAF, CB, Admin pour INSERT
- notes_sef: Créateur peut modifier brouillons, validateurs par rôle
- dossiers: Membres direction + Admin/DG/DAAF/CB

**Spécifique Utilisateur:**

- notifications, notification_preferences, delegations

### 3.6 Edge Functions

| Fonction                  | Description                                  | Endpoint                                   |
| ------------------------- | -------------------------------------------- | ------------------------------------------ |
| `create-user`             | Création utilisateur avec vérification admin | POST /functions/v1/create-user             |
| `generate-export`         | Export CSV/Excel/PDF avec QR codes           | POST /functions/v1/generate-export         |
| `r2-storage`              | Intégration Cloudflare R2 (presigned URLs)   | POST /functions/v1/r2-storage              |
| `send-notification-email` | Envoi emails via Resend API                  | POST /functions/v1/send-notification-email |

---

## 4. Pages et Routing

### 4.1 Pages Racine (30 fichiers)

| Page                     | Fichier                    | Description                                     |
| ------------------------ | -------------------------- | ----------------------------------------------- |
| Dashboard                | Dashboard.tsx              | Tableau de bord principal (aiguillage par rôle) |
| Notes SEF                | NotesSEF.tsx               | Liste des notes SEF                             |
| Note SEF Détail          | NoteSEFDetail.tsx          | Détail d'une note SEF (45KB)                    |
| Notes AEF                | NotesAEF.tsx               | Liste des notes AEF                             |
| Note AEF Détail          | NoteAEFDetail.tsx          | Détail d'une note AEF (37KB)                    |
| Engagements              | Engagements.tsx            | Gestion des engagements                         |
| Liquidations             | Liquidations.tsx           | Gestion des liquidations                        |
| Ordonnancements          | Ordonnancements.tsx        | Ordres de paiement                              |
| Règlements               | Reglements.tsx             | Règlements effectués                            |
| Marchés                  | Marches.tsx                | Gestion des marchés                             |
| Validation Notes SEF     | ValidationNotesSEF.tsx     | Workflow validation SEF                         |
| Validation Notes AEF     | ValidationNotesAEF.tsx     | Workflow validation AEF                         |
| Validation Notes DG      | ValidationNotesDG.tsx      | Workflow validation DG                          |
| Vérification Note DG     | VerificationNoteDG.tsx     | Vérification notes DG                           |
| Notes Direction Générale | NotesDirectionGenerale.tsx | Notes officielles DG                            |
| Alertes                  | Alertes.tsx                | Gestion des alertes                             |
| Alertes Budgétaires      | AlertesBudgetaires.tsx     | Alertes budget                                  |
| États d'Exécution        | EtatsExecution.tsx         | Rapports d'exécution                            |
| Workflow Tasks           | WorkflowTasks.tsx          | Gestion des tâches workflow                     |
| Notifications            | Notifications.tsx          | Centre de notifications                         |
| Mon Profil               | MonProfil.tsx              | Profil utilisateur                              |
| Recherche                | Recherche.tsx              | Recherche globale                               |
| Sélection Exercice       | SelectExercice.tsx         | Choix de l'exercice                             |
| Scanning Engagement      | ScanningEngagement.tsx     | Numérisation engagements (32KB)                 |
| Scanning Liquidation     | ScanningLiquidation.tsx    | Numérisation liquidations (38KB)                |
| Coming Soon              | ComingSoon.tsx             | Fonctionnalités à venir                         |
| Not Found                | NotFound.tsx               | Page 404                                        |
| No Open Exercise         | NoOpenExercise.tsx         | Message exercice non ouvert                     |
| Admin Dashboard Fallback | AdminDashboardFallback.tsx | Dashboard admin fallback                        |
| Test Non-Régression      | TestNonRegression.tsx      | Tests NR                                        |

### 4.2 Sous-Dossiers de Pages

| Dossier             | Fichiers | Description                                                                             |
| ------------------- | -------- | --------------------------------------------------------------------------------------- |
| admin/              | 24       | Administration (rôles, utilisateurs, exercices, paramètres, codification, comptabilité) |
| approvisionnement/  | 1        | Gestion approvisionnement                                                               |
| auth/               | 1        | Authentification (LoginPage)                                                            |
| contractualisation/ | 5        | Contrats et fournisseurs                                                                |
| dg/                 | 2        | Pages Direction Générale                                                                |
| execution/          | 7        | Exécution budgétaire (dashboard, imputation, expression besoin, passation marché)       |
| gestion-taches/     | 4        | Gestion des tâches (différées, terminées, fiches, états)                                |
| planification/      | 12       | Planification budgétaire (import/export, feuilles de route, virements, structure)       |
| programmatique/     | 4        | Budget programmatique                                                                   |
| recettes/           | 1        | Déclaration des recettes                                                                |
| tresorerie/         | 6        | Trésorerie (mouvements bancaires/caisse, approvisionnement)                             |

### 4.3 Logique d'Aiguillage par Rôle (Dashboard.tsx)

```typescript
// Redirection basée sur profil_fonctionnel et role_hierarchique
switch (profilFonctionnel) {
  case 'Admin':
    return <AdminDashboard />;
  case 'Validateur':
    if (roleHierarchique === 'DG') return <DGDashboard />;
    if (roleHierarchique === 'Directeur') return <DirectionDashboard />;
    return <ValidateurDashboard />;
  case 'Operationnel':
    return <OperationnelDashboard />;
  case 'Controleur':
    return <ControleurDashboard />;
  case 'Auditeur':
    return <AuditeurDashboard />;
}
```

---

## 5. Composants

### 5.1 Organisation par Catégorie (325 fichiers, 41 catégories)

| Catégorie             | Description                          | Fichiers |
| --------------------- | ------------------------------------ | -------- |
| ui/                   | Composants shadcn/ui de base         | 40+      |
| shared/               | Composants partagés réutilisables    | 35+      |
| layout/               | Layout (sidebar, header, navigation) | 25+      |
| dashboard/            | Composants dashboard                 | 20+      |
| notes-sef/            | Formulaires et tableaux SEF          | 18+      |
| notes-aef/            | Composants AEF                       | 15+      |
| notes-dg-officielles/ | Notes DG                             | 12+      |
| budget/               | Budget                               | 12+      |
| workflow/             | États et actions workflow            | 12+      |
| engagement/           | Engagements                          | 10+      |
| liquidation/          | Liquidations                         | 10+      |
| marches/              | Marchés                              | 10+      |
| ordonnancement/       | Ordonnancements                      | 10+      |
| reglement/            | Règlements                           | 10+      |
| admin/                | Admin panel                          | 9+       |
| execution/            | Exécution                            | 8+       |
| imputation/           | Imputations                          | 8+       |
| planification/        | Planification                        | 8+       |
| etats/                | Rapports                             | 8+       |
| export/               | Export                               | 7+       |
| import-export/        | Import/Export                        | 7+       |
| coherence/            | Contrôle cohérence                   | 6+       |
| passation-marche/     | Passation marché                     | 6+       |
| expression-besoin/    | Expression besoin                    | 6+       |
| dossier/              | Dossiers                             | 6+       |
| search/               | Recherche                            | 6+       |
| prestataires/         | Prestataires                         | 5+       |
| notification/         | Notifications                        | 5+       |
| notifications/        | Centre notifications                 | 5+       |
| codification/         | Codification                         | 5+       |
| audit/                | Audit trail                          | 4+       |
| auth/                 | Authentification                     | 4+       |
| ged/                  | GED                                  | 4+       |
| attachments/          | Pièces jointes                       | 4+       |
| exercice/             | Exercices                            | 4+       |
| help/                 | Aide                                 | 4+       |
| contrats/             | Contrats                             | 3+       |
| approvisionnement/    | Approvisionnement                    | 3+       |
| recettes/             | Recettes                             | 3+       |
| tresorerie/           | Trésorerie                           | 2+       |

### 5.2 Composants UI (shadcn/ui)

```
button, card, dialog, dropdown-menu, form, input, label,
select, table, tabs, toast, tooltip, badge, avatar,
checkbox, radio-group, switch, textarea, calendar,
date-picker, command, popover, accordion, alert,
alert-dialog, skeleton, spinner, separator, sheet,
scroll-area, progress, slider, collapsible, chart
```

### 5.3 Composants Partagés Principaux

| Composant      | Fichier                   | Description                |
| -------------- | ------------------------- | -------------------------- |
| StatusBadge    | shared/StatusBadge.tsx    | Badge de statut unifié     |
| LoadingSpinner | shared/LoadingSpinner.tsx | Indicateur de chargement   |
| DataTable      | shared/DataTable.tsx      | Table de données générique |
| FileUpload     | shared/FileUpload.tsx     | Upload de fichiers         |
| ConfirmDialog  | shared/ConfirmDialog.tsx  | Dialog de confirmation     |
| ErrorBoundary  | shared/ErrorBoundary.tsx  | Gestion des erreurs        |
| EmptyState     | shared/EmptyState.tsx     | État vide                  |
| SearchInput    | shared/SearchInput.tsx    | Input de recherche         |
| PageHeader     | shared/PageHeader.tsx     | Header de page             |
| FormField      | shared/FormField.tsx      | Champ de formulaire        |

---

## 6. Hooks et Logique Métier

### 6.1 Vue d'Ensemble (124 hooks)

| Catégorie                   | Nombre | Tables Supabase Principales                                          |
| --------------------------- | ------ | -------------------------------------------------------------------- |
| Auth & Authorization        | 9      | profiles, user_roles, delegations                                    |
| Dashboard & Analytics       | 8      | Multiples (vues agrégées)                                            |
| Budget Management           | 10     | budget_lines, budget_engagements, credit_transfers                   |
| Notes SEF/AEF               | 9      | notes_sef, notes_aef, lignes_estimatives_aef                         |
| Engagement Chain            | 9      | budget_engagements, budget_liquidations, ordonnancements, reglements |
| Procurement                 | 7      | marches, expressions_besoin, prestataires                            |
| Workflow & Tasks            | 8      | dossiers, workflow_tasks, workflow_definitions                       |
| Import/Export               | 10     | import_staging, import_jobs                                          |
| Audit & Logging             | 6      | audit_log, audit_trail, audit_journal                                |
| Documents & Attachments     | 6      | attachments, [entity]\_documents                                     |
| Referential Data            | 8      | data_dictionary, ref_codification_rules, directions                  |
| Treasury & Finance          | 6      | mouvements_tresorerie, comptes_bancaires                             |
| Reconciliation & Validation | 6      | RPC functions, etats_execution                                       |
| Printing & PDF              | 4      | RPC PDF generation                                                   |
| Notifications & UI          | 4      | notifications                                                        |
| Roadmap & Comparison        | 4      | roadmap_snapshots, roadmap_submissions                               |
| Miscellaneous               | 12     | Diverses tables opérationnelles                                      |

### 6.2 Hooks RBAC et Authentification

**useRBAC.ts**

```typescript
// Système RBAC complet avec profil + rôles + permissions
Returns: {
  (isAdmin,
    isDG,
    isCB,
    isDAF,
    isTresorier,
    canCreate(module),
    canValidate(module),
    canExport(module),
    hasRole(role),
    hasPermission(module, action),
    userProfile,
    userRoles,
    isLoading);
}
```

**usePermissions.ts**

```typescript
// Vérification permissions bas niveau via RLS
Returns: {
  (hasPermission(module, action),
    hasRole(role),
    hasModuleAccess(module),
    isViaDelegation(),
    permissions,
    isLoading);
}
```

**useRBACEnforcer.ts**

```typescript
// Contrôle d'accès niveau route et données
Returns: {
  (canAccessRoute(route),
    canAccessData(entityType, entityId),
    canValidate(entityType),
    hierarchyLevel,
    visibilityScope);
}
```

**useSeparationOfDuties.ts**

```typescript
// Séparation des tâches (créateur ≠ validateur)
Returns: {
  (checkSeparation(entityType, entityId, userId), checkPermission(action));
}
```

### 6.3 Hooks Notes SEF

**useNotesSEF.ts**

```typescript
// CRUD complet pour Notes SEF
Functions:
  - createNoteSEF(data): Promise<NoteSEF>
  - updateNoteSEF(id, data): Promise<NoteSEF>
  - submitNoteSEF(id): Promise<void>
  - validateNoteSEF(id): Promise<void>
  - rejectNoteSEF(id, reason): Promise<void>
  - deferNoteSEF(id, data): Promise<void>
  - deleteNoteSEF(id): Promise<void>
  - addAttachment(noteId, file): Promise<Attachment>
  - removeAttachment(attachmentId): Promise<void>
```

**useNotesSEFList.ts**

```typescript
// Liste avec filtrage et pagination
Returns: {
  notes: NoteSEF[],
  total: number,
  isLoading: boolean,
  filters, setFilters,
  pagination, setPagination,
  sorting, setSorting
}
```

### 6.4 Hooks Chaîne d'Engagement

**useEngagements.ts**

```typescript
// Gestion engagements budgétaires
Tables: (budget_engagements, budget_lines, expressions_besoin, marches);
Functions: (CRUD, workflow, validation);
```

**useLiquidations.ts**

```typescript
// Gestion liquidations avec calculs TVA/AIRSI
Tables: budget_liquidations, budget_engagements
Calculs: TVA, AIRSI, retenues, net à payer
```

**useOrdonnancements.ts**

```typescript
// Ordres de paiement avec signatures
Tables: ordonnancements, budget_liquidations
Features: Création batch, suivi signatures
```

**useReglements.ts**

```typescript
// Règlements finaux
Tables: (reglements, ordonnancements);
Modes: (virement, chèque, espèces);
```

### 6.5 Hooks Workflow

**useWorkflowDossier.ts**

```typescript
// Machine à états du dossier
Returns: {
  currentStep: SpendingStage,
  transitions: Transition[],
  history: HistoryEntry[],
  canTransitionTo(stage): boolean,
  executeTransition(stage): Promise<void>
}
```

**useSpendingCase.ts**

```typescript
// Workflow complet 9 étapes
Returns: {
  spendingCase: SpendingCase,
  timeline: SpendingTimeline,
  permissions: SpendingPermissions,
  progress: number (0-100)
}
```

### 6.6 Hooks Dashboard

**useDashboardStats.ts**

```typescript
// KPIs globaux dashboard
Returns: {
  (budgetStats,
    engagementStats,
    liquidationStats,
    ordonnancementStats,
    reglementStats,
    notesSEFStats,
    notesAEFStats,
    isLoading);
}
```

**useDashboardByRole.ts**

```typescript
// Dashboards spécifiques par rôle
Hooks: (useDGDashboard, useDAFDashboard, useControleurDashboard, useTresorerieDashboard);
```

### 6.7 Hooks Import/Export

**useARTIImport.ts**

```typescript
// Import données ARTI
Tables: missions, actions, activites, sous_activites
Features: Import batch avec validation
```

**useExport.ts**

```typescript
// Export multi-format
Formats: CSV, Excel (multi-feuilles), PDF avec QR codes
```

---

## 7. Types TypeScript

### 7.1 Chaîne de Dépenses (src/types/spending-case.ts)

```typescript
// Étapes de la chaîne (8 visibles, 9 en réalité)
type SpendingStage =
  | 'note_sef'
  | 'note_aef'
  | 'imputation'
  | 'passation_marche'
  | 'engagement'
  | 'liquidation'
  | 'ordonnancement'
  | 'reglement';

type SpendingCaseStatus = 'draft' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
type StepStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'deferred' | 'skipped';

interface SpendingCase {
  id: string;
  dossierRef: string; // Format ARTI01YYNNNN
  numero: string;
  exercice: number;
  directionId: string;
  objet: string;
  demandeurId: string;
  montantEstime: number;
  currentStage: SpendingStage;
  status: SpendingCaseStatus;
  timeline: SpendingTimeline;
  noteSefId?: string;
  noteAefId?: string;
  imputationId?: string;
  engagementId?: string;
  liquidationId?: string;
  ordonnancementId?: string;
  reglementId?: string;
}

interface TransitionRule {
  from: SpendingStage;
  to: SpendingStage;
  condition: (spendingCase: SpendingCase) => boolean;
  requiredRole?: string;
  requiresValidation: boolean;
}

// Configuration étapes
const STAGE_ORDER = {
  note_sef: 1,
  note_aef: 2,
  imputation: 3,
  passation_marche: 4,
  engagement: 5,
  liquidation: 6,
  ordonnancement: 7,
  reglement: 8,
};
```

### 7.2 RBAC (src/lib/rbac/types.ts)

```typescript
// Hiérarchie des rôles (5 niveaux)
type RoleHierarchique =
  | 'Agent' // niveau 1
  | 'Chef de Service' // niveau 2
  | 'Sous-Directeur' // niveau 3
  | 'Directeur' // niveau 4
  | 'DG'; // niveau 5

// Profils fonctionnels (8)
type ProfilFonctionnel = 'Admin' | 'Validateur' | 'Operationnel' | 'Controleur' | 'Auditeur';

// Rôles applicatifs (20+)
type AppRole =
  | 'ADMIN'
  | 'DG'
  | 'DAAF'
  | 'DGPEC'
  | 'CB'
  | 'OPERATEUR'
  | 'TRESORIER'
  | 'AGENT_COMPTABLE'
  | 'AC'
  | 'SDPM'
  | 'SDCT'
  | 'DIRECTEUR'
  | 'SOUS_DIRECTEUR'
  | 'CHEF_SERVICE'
  | 'AGENT'
  | 'CONTROLEUR'
  | 'AUDITEUR'
  | 'COMMISSION_MARCHES';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  matricule: string | null;
  direction_id: string | null;
  role_hierarchique: RoleHierarchique | null;
  profil_fonctionnel: ProfilFonctionnel | null;
  is_active: boolean;
  exercice_actif: number | null;
}

// Modules du système (17)
type ModuleCode =
  | 'notes_sef'
  | 'notes_aef'
  | 'imputation'
  | 'expression_besoin'
  | 'passation_marche'
  | 'engagement'
  | 'liquidation'
  | 'ordonnancement'
  | 'reglement'
  | 'budget'
  | 'planification'
  | 'tresorerie'
  | 'recettes'
  | 'approvisionnement'
  | 'contractualisation'
  | 'admin'
  | 'audit';

// Actions (9)
type ActionCode =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'validate'
  | 'reject'
  | 'sign'
  | 'export'
  | 'import';
```

### 7.3 Configuration RBAC (src/lib/rbac/config.ts)

```typescript
const VALIDATION_MATRIX = {
  NOTE_SEF: { validators: ['DG', 'ADMIN'], requiredRole: 'DG' },
  NOTE_AEF: { validators: ['DIRECTEUR', 'DG', 'ADMIN'], requiredRole: 'DIRECTEUR' },
  IMPUTATION: { validators: ['CB', 'ADMIN'], requiredRole: 'CB' },
  ENGAGEMENT: { validators: ['CB', 'ADMIN'], requiredRole: 'CB' },
  LIQUIDATION: { validators: ['DAAF', 'CB', 'ADMIN'], requiredRole: 'DAAF' },
  ORDONNANCEMENT: { validators: ['DG', 'ADMIN'], requiredRole: 'DG' },
  REGLEMENT: { validators: ['TRESORERIE', 'AGENT_COMPTABLE', 'AC', 'ADMIN'] },
  MARCHE: { validators: ['DG', 'COMMISSION_MARCHES', 'ADMIN'] },
  VIREMENT: { validators: ['CB', 'ADMIN'], requiredRole: 'CB' },
};

const VISIBILITY_RULES = {
  AGENT: { dossiers: 'own', notes: 'own', engagements: 'own' },
  CHEF_SERVICE: { dossiers: 'service', notes: 'service', engagements: 'service' },
  DIRECTEUR: { dossiers: 'direction', notes: 'direction', engagements: 'direction' },
  DG: { dossiers: 'all', notes: 'all', engagements: 'all' },
  ADMIN: { dossiers: 'all', notes: 'all', engagements: 'all' },
  AUDITEUR: { dossiers: 'all', notes: 'all', engagements: 'all' },
};
```

### 7.4 Statuts Workflow (src/lib/workflow/statuts.ts)

```typescript
const STATUTS_WORKFLOW = {
  // Phase création
  BROUILLON: 'brouillon',

  // Phase validation
  SOUMIS: 'soumis',
  EN_ATTENTE: 'en_attente',
  EN_COURS: 'en_cours',

  // Phase décision
  VALIDE: 'valide',
  REJETE: 'rejete',
  DIFFERE: 'differe',

  // Phase terminale
  CLOS: 'clos',
  ANNULE: 'annule',

  // Statuts spécifiques
  IMPUTE: 'impute',
  ATTRIBUE: 'attribue',
  INFRUCTUEUX: 'infructueux',
  VISE: 'vise',
  SIGNE: 'signe',
  A_SIGNER: 'a_signer',
  PAYE: 'paye',
  REFUSE: 'refuse',
};

const STATUTS_PAR_TABLE = {
  notes_sef: ['brouillon', 'soumis', 'valide', 'rejete', 'differe'],
  notes_dg: ['brouillon', 'soumis', 'valide', 'rejete', 'differe', 'impute'],
  imputations: ['en_attente', 'impute', 'rejete', 'differe'],
  expressions_besoin: ['brouillon', 'soumis', 'valide', 'rejete', 'differe'],
  marches: ['brouillon', 'en_cours', 'attribue', 'infructueux', 'annule'],
  ordonnancements: ['en_attente', 'vise', 'a_signer', 'signe', 'rejete', 'differe'],
  reglements: ['en_cours', 'paye', 'refuse', 'annule'],
};
```

### 7.5 Notes SEF (src/lib/notes-sef/types.ts)

```typescript
interface NoteSEFEntity {
  id: string;
  numero: string | null;
  reference_pivot: string | null; // Format ARTI01YYNNNN
  exercice: number;
  direction_id: string | null;
  demandeur_id: string | null;
  beneficiaire_id: string | null;
  beneficiaire_interne_id: string | null;
  objet: string;
  description: string | null;
  justification: string | null;
  urgence: NoteSEFUrgenceType | null;
  statut: NoteSEFStatutType | null;

  // Rejet
  rejection_reason: string | null;
  rejected_by: string | null;
  rejected_at: string | null;

  // Report
  differe_motif: string | null;
  differe_condition: string | null;
  differe_date_reprise: string | null;

  // Validation
  validated_by: string | null;
  validated_at: string | null;
  submitted_by: string | null;
  submitted_at: string | null;

  // Métadonnées
  created_by: string | null;
  created_at: string;
  updated_at: string;
  dossier_id?: string | null;
}

type NoteSEFStatutType = 'brouillon' | 'soumis' | 'a_valider' | 'valide' | 'differe' | 'rejete';
type NoteSEFUrgenceType = 'basse' | 'normale' | 'haute' | 'urgente';

const STATUT_TRANSITIONS = {
  brouillon: ['soumis'],
  soumis: ['a_valider', 'valide', 'rejete', 'differe'],
  a_valider: ['valide', 'rejete', 'differe'],
  differe: ['valide', 'a_valider'],
  valide: [],
  rejete: [],
};
```

### 7.6 Constantes Centrales (src/lib/config/sygfp-constants.ts)

```typescript
// 9 étapes de la chaîne de dépenses
const ETAPES_CHAINE_DEPENSE = {
  NOTE_SEF: 'note_sef', // Étape 1
  NOTE_AEF: 'note_aef', // Étape 2
  IMPUTATION: 'imputation', // Étape 3
  EXPRESSION_BESOIN: 'expression_besoin', // Étape 4
  PASSATION_MARCHE: 'passation_marche', // Étape 5
  ENGAGEMENT: 'engagement', // Étape 6
  LIQUIDATION: 'liquidation', // Étape 7
  ORDONNANCEMENT: 'ordonnancement', // Étape 8
  REGLEMENT: 'reglement', // Étape 9
};

// Configuration étape
interface EtapeConfig {
  code: EtapeChaineType;
  numero: number; // 1-9
  label: string;
  labelCourt: string;
  description: string;
  icon: LucideIcon;
  url: string;
  color: string;
}

// Helpers
function formatMontant(montant: number, showCurrency = true): string;
function formatMontantCompact(montant: number): string; // K, M, Mds
function formatDate(date: string | Date): string; // Format FR
function formatDateTime(date: string | Date): string;
function getStatutBadge(statut: string): BadgeConfig;
```

---

## 8. Tests

### 8.1 Configuration Vitest (vitest.config.ts)

```typescript
{
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50
      }
    },
    testTimeout: 10000
  }
}
```

### 8.2 Configuration Playwright (playwright.config.ts)

```typescript
{
  testDir: './e2e',
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['json', { outputFile: 'test-results/report.json' }], ['list']],
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI
  }
}
```

### 8.3 Structure des Tests

```
e2e/
└── example.spec.ts      # Test E2E exemple

src/test/
├── setup.ts            # Configuration Vitest (jsdom, expect)
├── utils.tsx           # Utilitaires de test (render with providers)
└── example.test.ts     # Test unitaire exemple
```

### 8.4 Commandes de Test

```bash
npm run test           # Tests unitaires
npm run test:ui        # Vitest avec interface
npm run test:coverage  # Couverture de code
npm run test:e2e       # Tests E2E Playwright
npm run test:e2e:ui    # Playwright avec interface
```

---

## 9. Bugs et Problèmes Identifiés

### 9.1 TODO/FIXME dans le Code

| Fichier                                          | Ligne | Commentaire                                             |
| ------------------------------------------------ | ----- | ------------------------------------------------------- |
| `src/pages/execution/DashboardDGPage.tsx`        | 565   | `TODO: Implémenter l'export via Edge Function`          |
| `src/pages/execution/DashboardDirectionPage.tsx` | 389   | `TODO: Implémenter l'export via Edge Function`          |
| `src/pages/auth/LoginPage.tsx`                   | 172   | `TODO: Implémenter la récupération de mot de passe`     |
| `src/hooks/useNoteDGPdf.ts`                      | 149   | `TODO: Stocker le PDF via Edge Function r2-storage`     |
| `src/hooks/useCoherenceCheck.ts`                 | 501   | `TODO: Créer une table coherence_reports dans Supabase` |

### 9.2 Utilisation de `any` (232+ occurrences)

**Fichiers les plus problématiques:**

| Fichier                                       | Lignes  | Pattern                           |
| --------------------------------------------- | ------- | --------------------------------- |
| `supabase/functions/generate-export/index.ts` | 112-672 | Multiple `any` dans fonctions PDF |
| `src/hooks/useReferentielsImportExport.ts`    | 74-118  | Cast `any` pour Supabase          |
| `src/hooks/useTresorerie.ts`                  | 68-158  | Cast `any` pour tables trésorerie |
| `src/hooks/useImputation.ts`                  | 296-752 | Multiple casts `any`              |
| `src/components/reglement/*`                  | Divers  | Props typées `any`                |
| `src/pages/TestNonRegression.tsx`             | 36-707  | Multiple `any`                    |

**Solution recommandée:** Utiliser `as unknown as Type` comme dans:

- `src/components/exercice/ExerciceInitWizard.tsx:166`
- `src/hooks/useNotesAEF.ts:103`

### 9.3 Console.log/error (293 occurrences)

**À retirer/remplacer par un service de logging:**

| Catégorie      | Fichiers concernés                                    |
| -------------- | ----------------------------------------------------- |
| Edge Functions | generate-export, create-user, send-notification-email |
| Pages          | NoteAEFDetail, NoteSEFDetail                          |
| Services       | noteDGPdfService, attachmentService                   |
| Hooks          | useValidationDG, useImputation, usePrestataires       |

### 9.4 Gestion d'Erreurs Manquante

**Patterns problématiques:**

1. **Await sans try-catch:**
   - `src/components/budget/BudgetImport.tsx:103-139`
   - `src/components/budget/ImportExcelWizard.tsx:150-224`

2. **Assertions non-null (!) sans validation:**
   - `src/hooks/useImportStaging.ts:197`
   - `src/hooks/useARTIImport.ts:735-749`
   - `src/hooks/useDoublonsDetection.ts:97,132,227`

3. **Catch blocks vides ou `.catch(console.error)`:**
   - `src/pages/NoteSEFDetail.tsx:270`
   - `src/components/notes-sef/NoteSEFDetails.tsx:167`

### 9.5 Problèmes de Sécurité Potentiels

| Risque                  | Fichier                                               | Description          |
| ----------------------- | ----------------------------------------------------- | -------------------- |
| dangerouslySetInnerHTML | `src/components/ui/chart.tsx`                         | Recharts, acceptable |
| innerHTML               | `src/components/ordonnancement/OrdrePayer.tsx`        | Pour impression      |
| innerHTML               | `src/components/engagement/EngagementPrintDialog.tsx` | Pour impression      |
| Tokens en URL           | `src/hooks/useValidationDG.ts`                        | Vérifier expiration  |

### 9.6 Recommandations par Priorité

**Haute Priorité (Sécurité/Stabilité):**

1. Revoir `dangerouslySetInnerHTML` - sanitizer si nécessaire
2. Remplacer casts `as any` - surtout dans `generate-export/index.ts`
3. Ajouter validation avant assertions `!`
4. Vérifier expiration des tokens de validation

**Moyenne Priorité (Qualité Code):** 5. Supprimer `console.log` - créer service de logging 6. Ajouter gestion d'erreurs - try-catch manquants 7. Typage Edge Functions - remplacer `any`

**Basse Priorité (Maintenance):** 8. Documenter TODO - créer issues GitHub 9. Standardiser gestion erreurs - error boundaries

---

## 10. Flux de Données

### 10.1 Chaîne de Dépenses Complète (9 étapes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CHAÎNE DE DÉPENSES SYGFP                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  1. NOTE    │───▶│  2. NOTE    │───▶│ 3. IMPUTA-  │───▶│ 4. EXPRESS. │  │
│  │     SEF     │    │     AEF     │    │     TION    │    │   BESOIN    │  │
│  │             │    │             │    │             │    │             │  │
│  │ Validateur: │    │ Validateur: │    │ Validateur: │    │ Validateur: │  │
│  │     DG      │    │  DIRECTEUR  │    │     CB      │    │  DIRECTEUR  │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│         │                  │                  │                  │         │
│         ▼                  ▼                  ▼                  ▼         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        DOSSIER (ARTI01YYNNNN)                       │   │
│  │           Référence pivot unique pour tout le workflow              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                  │                  │                  │         │
│         ▼                  ▼                  ▼                  ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ 5. PASSA-   │───▶│ 6. ENGAGE-  │───▶│ 7. LIQUIDA- │───▶│ 8. ORDON-   │  │
│  │ TION MARCHÉ │    │    MENT     │    │    TION     │    │ NANCEMENT   │  │
│  │             │    │             │    │             │    │             │  │
│  │ Validateur: │    │ Validateur: │    │ Validateur: │    │ Validateur: │  │
│  │     DG      │    │     CB      │    │    DAAF     │    │     DG      │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                   │        │
│                                                                   ▼        │
│                                                          ┌─────────────┐   │
│                                                          │ 9. RÈGLE-   │   │
│                                                          │    MENT     │   │
│                                                          │             │   │
│                                                          │ Validateur: │   │
│                                                          │ TRÉSORERIE  │   │
│                                                          └─────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 États des Documents

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ÉTATS DES DOCUMENTS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────┐                                                             │
│   │ BROUILLON │ ◀──────────────────────────────────────────────────────┐   │
│   └─────┬─────┘                                                        │   │
│         │ [Soumettre]                                                  │   │
│         ▼                                                              │   │
│   ┌───────────┐                                                        │   │
│   │  SOUMIS   │                                                        │   │
│   └─────┬─────┘                                                        │   │
│         │                                                              │   │
│         ├───────────[Valider]────────▶┌───────────┐                   │   │
│         │                             │  VALIDÉ   │ ────▶ Étape       │   │
│         │                             └───────────┘       suivante    │   │
│         │                                                              │   │
│         ├───────────[Rejeter]────────▶┌───────────┐                   │   │
│         │                             │  REJETÉ   │ ────▶ [Corriger]──┘   │
│         │                             └───────────┘                       │
│         │                                                                  │
│         └───────────[Différer]───────▶┌───────────┐                       │
│                                       │  DIFFÉRÉ  │ ────▶ [Reprendre]     │
│                                       └───────────┘          │            │
│                                              ▲                │            │
│                                              └────────────────┘            │
│                                                                             │
│   États terminaux: VALIDÉ (passage étape suivante), REJETÉ, ANNULÉ         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Format des Références

| Entité               | Format                          | Exemple        |
| -------------------- | ------------------------------- | -------------- |
| Dossier              | `ARTI` + `MM` + `YY` + `NNNNNN` | ARTI012600001  |
| Note SEF             | `SEF-{EXERCICE}-{SEQUENCE:4}`   | SEF-2026-0001  |
| Note DG              | `NDG-{MM}-{YY}-{XXXX}`          | NDG-01-26-0001 |
| Engagement           | `ENG-{EXERCICE}-{SEQUENCE:5}`   | ENG-2026-00001 |
| Liquidation          | `LIQ-{EXERCICE}-{SEQUENCE:4}`   | LIQ-2026-0001  |
| Ordonnancement       | `ORD-{EXERCICE}-{SEQUENCE:5}`   | ORD-2026-00001 |
| Règlement            | `REG-{EXERCICE}-{SEQUENCE:4}`   | REG-2026-0001  |
| Demande Achat        | `DA-{EXERCICE}-{SEQUENCE:4}`    | DA-2026-0001   |
| Réception            | `REC-{EXERCICE}-{SEQUENCE:4}`   | REC-2026-0001  |
| Mouvement Stock      | `MVT-{EXERCICE}-{SEQUENCE:5}`   | MVT-2026-00001 |
| Inventaire           | `INV-{EXERCICE}-{SEQUENCE:4}`   | INV-2026-0001  |
| Opération Trésorerie | `OPT-{EXERCICE}-{SEQUENCE:5}`   | OPT-2026-00001 |
| Recette              | `RCT-{EXERCICE}-{SEQUENCE:4}`   | RCT-2026-0001  |

### 10.4 Flux Budget

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUX BUDGÉTAIRE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────┐                                                     │
│   │ DOTATION INITIALE │                                                     │
│   │   (Import ARTI)   │                                                     │
│   └─────────┬─────────┘                                                     │
│             │                                                               │
│             ▼                                                               │
│   ┌───────────────────┐    ┌───────────────────┐                           │
│   │ DOTATION MODIFIÉE │◀───│ VIREMENTS BUDGET. │                           │
│   │   (±Virements)    │    │   (credit_trans.) │                           │
│   └─────────┬─────────┘    └───────────────────┘                           │
│             │                                                               │
│             ▼                                                               │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                      DISPONIBLE CALCULÉ                           │    │
│   │  = Dotation Modifiée - Engagements - Liquidations en cours        │    │
│   └───────────────────────────────────────────────────────────────────┘    │
│             │                                                               │
│             ├──────────▶ Alertes si < 20% (seuil critique: 5%)             │
│             │                                                               │
│             ▼                                                               │
│   ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐  │
│   │    ENGAGEMENT     │───▶│   LIQUIDATION     │───▶│     PAIEMENT      │  │
│   │ (Réservation CP)  │    │  (Service fait)   │    │   (Décaissement)  │  │
│   └───────────────────┘    └───────────────────┘    └───────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.5 Calculs Liquidation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CALCULS LIQUIDATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Montant HT                                                                │
│       │                                                                     │
│       ├────▶ + TVA (18% standard Gabon)                                     │
│       │          = Montant TTC                                              │
│       │                                                                     │
│       └────▶ - Retenues:                                                    │
│                  • AIRSI (Acompte IR sur services)                          │
│                  • Autres retenues éventuelles                              │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  NET À PAYER = Montant TTC - Total Retenues                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Formules:                                                                 │
│   • montant = quantite × prix_unitaire (par ligne)                         │
│   • tva_montant = montant_ht × (tva_taux / 100)                            │
│   • montant_ttc = montant_ht + tva_montant                                 │
│   • net_a_payer = montant_ttc - airsi_montant - autres_retenues            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.6 Architecture RBAC

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARCHITECTURE RBAC                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        UTILISATEUR                                  │   │
│   │  • Profil fonctionnel (Admin, Validateur, Opérationnel, etc.)       │   │
│   │  • Rôle hiérarchique (Agent → Chef Service → ... → DG)              │   │
│   │  • Direction d'appartenance                                          │   │
│   └──────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     MATRICE DE VALIDATION                           │   │
│   │                                                                     │   │
│   │  Entité            │ Validateurs autorisés  │ Rôle requis           │   │
│   │  ─────────────────┼───────────────────────┼─────────────────────    │   │
│   │  NOTE_SEF          │ DG, ADMIN              │ DG                     │   │
│   │  NOTE_AEF          │ DIRECTEUR, DG, ADMIN   │ DIRECTEUR              │   │
│   │  IMPUTATION        │ CB, ADMIN              │ CB                     │   │
│   │  ENGAGEMENT        │ CB, ADMIN              │ CB                     │   │
│   │  LIQUIDATION       │ DAAF, CB, ADMIN        │ DAAF                   │   │
│   │  ORDONNANCEMENT    │ DG, ADMIN              │ DG                     │   │
│   │  REGLEMENT         │ TRESORERIE, AC, ADMIN  │ TRESORERIE             │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     RÈGLES DE VISIBILITÉ                            │   │
│   │                                                                     │   │
│   │  • AGENT:      Voit uniquement ses propres dossiers                 │   │
│   │  • CHEF SVC:   Voit les dossiers de son service                     │   │
│   │  • DIRECTEUR:  Voit les dossiers de sa direction                    │   │
│   │  • DG/ADMIN:   Voit tous les dossiers                               │   │
│   │  • AUDITEUR:   Accès lecture seule à tout                           │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                  SÉPARATION DES TÂCHES                              │   │
│   │                                                                     │   │
│   │  Règle: Créateur ≠ Validateur                                       │   │
│   │  Vérification: check_separation_of_duties() RPC                     │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       DÉLÉGATIONS                                   │   │
│   │                                                                     │   │
│   │  • Temporaires (date_debut → date_fin)                              │   │
│   │  • Périmètre défini (notes, engagements, liquidations, etc.)        │   │
│   │  • Vérification: has_active_delegation() RPC                        │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Conclusion

Le projet SYGFP est un système de gestion financière complet et robuste pour ARTI Gabon, comprenant:

- **9 étapes** dans la chaîne de dépenses avec workflow intégré
- **Gestion budgétaire** avec hiérarchie programmatique (OS → Actions → Activités → Tâches)
- **RBAC multi-niveaux** (5 niveaux hiérarchiques × 5 profils fonctionnels)
- **Audit trail complet** avec versioning et historique
- **GED** (Gestion Électronique des Documents) avec pièces jointes unifiées
- **Supply chain** de l'achat à l'inventaire
- **Trésorerie** avec réconciliation bancaire
- **Délégations** pour flexibilité organisationnelle
- **Notifications** avec préférences utilisateur
- **Export multi-format** (CSV, Excel, PDF avec QR codes)

**Technologies clés**: React 18, TypeScript, Supabase (PostgreSQL + RLS), TanStack Query, Tailwind CSS, shadcn/ui

**Points d'amélioration identifiés**:

- Réduction des `any` TypeScript
- Amélioration de la gestion d'erreurs
- Suppression des `console.log` en production
- Implémentation des 5 TODO restants

---

_Document généré automatiquement le 29 janvier 2026_
