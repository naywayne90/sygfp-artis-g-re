# SYGFP - Spécification d'Implémentation MVP

> **Document de référence pour la stabilisation et l'évolution du projet**  
> Version: 1.0 | Date: 2026-01-17

---

## Table des matières

1. [Inventaire existant vs MVP](#1-inventaire-existant-vs-mvp)
2. [Workflow cible](#2-workflow-cible)
3. [Statuts et paniers standardisés](#3-statuts-et-paniers-standardisés)
4. [Acteurs par étape](#4-acteurs-par-étape)
5. [Écrans MVP](#5-écrans-mvp)
6. [Mode Safe](#6-mode-safe---règles-dimplémentation)
7. [Liste de tâches ordonnée](#7-liste-de-tâches-ordonnée)

---

## 1. Inventaire existant vs MVP

### 1.1 Ce qui existe ✅

#### Routes et Pages (40+ pages)
| Domaine | Routes | Status |
|---------|--------|--------|
| **Dashboard** | `/`, `/recherche`, `/taches` | ✅ Fonctionnel |
| **Notes SEF** | `/notes-sef`, `/notes-sef/:id` | ✅ Production |
| **Notes AEF** | `/notes-aef`, `/notes-aef/:id` | ✅ 95% |
| **Imputation** | `/execution/imputation` | ✅ 90% |
| **Expression Besoin** | `/execution/expression-besoin` | ✅ 85% |
| **Marchés** | `/marches` | ✅ 80% |
| **Engagements** | `/engagements` | ✅ 90% |
| **Liquidations** | `/liquidations` | ✅ 90% |
| **Ordonnancements** | `/ordonnancements` | ✅ 85% |
| **Règlements** | `/reglements` | ✅ 80% |
| **Budget** | `/planification/*` | ✅ 95% |
| **Prestataires** | `/contractualisation/prestataires` | ✅ 90% |
| **Trésorerie** | `/tresorerie` | ✅ 80% |
| **Admin** | `/admin/*` | ✅ 90% |

#### Composants (~200+)
| Dossier | Composants | Status |
|---------|-----------|--------|
| `notes-sef/` | 7 composants (Form, List, Details, Checklist, Dialogs) | ✅ Complets |
| `notes-aef/` | 6 composants | ✅ Complets |
| `engagement/` | 10 composants | ✅ Complets |
| `liquidation/` | 8 composants | ✅ Complets |
| `ordonnancement/` | 8 composants | ✅ Complets |
| `reglement/` | 4 composants | ⚠️ À enrichir |
| `dossier/` | 8 composants | ✅ Complets |
| `workflow/` | 8 composants (stepper, timeline, KPIs) | ✅ Complets |
| `budget/` | 15+ composants | ✅ Complets |
| `dashboard/` | 10+ composants (KPIs, alertes, activités) | ✅ Complets |

#### Hooks (~80)
| Catégorie | Hooks clés | Status |
|-----------|-----------|--------|
| **Notes** | `useNotesSEF`, `useNotesAEF`, `useNotesSEFList`, `useNotesAEFList` | ✅ |
| **Chaîne** | `useEngagements`, `useLiquidations`, `useOrdonnancements`, `useReglements` | ✅ |
| **Budget** | `useBudgetLines`, `useBudgetTransfers`, `useBudgetAvailability` | ✅ |
| **Workflow** | `useDossiers`, `useWorkflowEtapes`, `useWorkflowTasks` | ✅ |
| **Audit** | `useAuditLog`, `useAuditLogEnhanced` | ✅ |
| **Permissions** | `usePermissions`, `useRoleBasedAccess`, `useSeparationOfDuties` | ✅ |

#### Base de données (~150 tables)
| Domaine | Tables principales | RLS |
|---------|-------------------|-----|
| **Chaîne dépense** | `notes_sef`, `notes_dg`, `imputations`, `expressions_besoin`, `marches`, `budget_engagements`, `budget_liquidations`, `ordonnancements`, `reglements` | ✅ |
| **Dossiers** | `dossiers`, `dossier_etapes`, `dossier_attachments` | ✅ |
| **Budget** | `budget_lines`, `credit_transfers`, `budget_history` | ✅ |
| **Référentiels** | `directions`, `objectifs_strategiques`, `missions`, `actions`, `activites`, `nomenclature_nbe`, `plan_comptable_sysco` | ✅ |
| **Users** | `profiles`, `user_roles`, `roles`, `delegations` | ✅ |
| **Audit** | `audit_logs`, `notes_sef_history` | ✅ |

#### Fonctionnalités transversales
- ✅ Authentification email/password
- ✅ RBAC complet avec permissions granulaires
- ✅ Contexte exercice budgétaire
- ✅ Génération automatique codes ARTI pivot
- ✅ Audit trail automatique
- ✅ Soft delete
- ✅ Alertes budgétaires configurables
- ✅ Import Excel budget
- ✅ Export CSV/Excel
- ✅ Gestion virements de crédits

### 1.2 Ce qui manque pour MVP ❌

| Fonctionnalité | Priorité | Complexité | Notes |
|----------------|----------|------------|-------|
| **Recherche dossier avancée** | P1 | Moyenne | Recherche unifiée par N° dossier, code ARTI, bénéficiaire |
| **Timeline dossier interactive** | P1 | Faible | Composant existe, améliorer navigation |
| **Paniers par rôle centralisés** | P1 | Moyenne | Standardiser les "À valider" par rôle |
| **Gestion pièces jointes unifiée** | P2 | Moyenne | Interface cohérente pour tous modules |
| **Notifications email** | P2 | Moyenne | Edge function existe, intégration manquante |
| **Export PDF mandats** | P2 | Haute | Pour ordonnancement/règlement |
| **Tests automatisés** | P3 | Haute | Couverture actuelle 15% |
| **Documentation utilisateur** | P3 | Moyenne | Guide par rôle |

### 1.3 Écarts de cohérence identifiés

| Problème | Localisation | Impact |
|----------|--------------|--------|
| **Statuts non uniformes** | Tables chaîne dépense | Confusion utilisateur |
| **Nommage incohérent** | `notes_dg` vs `notes_aef` | Maintenance difficile |
| **Colonnes dupliquées** | `exercice` vs `exercice_id` | Erreurs potentielles |
| **Paniers éparpillés** | Chaque module gère séparément | UX fragmentée |

---

## 2. Workflow cible

### 2.1 Chaîne de la Dépense - 9 Étapes

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           CHAÎNE DE LA DÉPENSE SYGFP                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ①          ②           ③           ④            ⑤           ⑥          ⑦          ⑧         ⑨
  ┌─────┐    ┌─────┐     ┌─────┐     ┌─────┐      ┌─────┐     ┌─────┐    ┌─────┐    ┌─────┐   ┌─────┐
  │ SEF │ ─► │ AEF │ ─►  │ IMP │ ─►  │ EXB │  ─►  │ PM  │ ─►  │ ENG │ ─► │ LIQ │ ─► │ ORD │ ─► │ REG │
  └─────┘    └─────┘     └─────┘     └─────┘      └─────┘     └─────┘    └─────┘    └─────┘   └─────┘
    │          │           │           │            │           │          │          │         │
    │          │           │           │            │           │          │          │         │
    ▼          ▼           ▼           ▼            ▼           ▼          ▼          ▼         ▼
  Note      Note       Impu-      Expres-     Passation   Engage-    Liqui-    Ordon-    Règle-
  Sans      Avec       tation     sion        Marché      ment       dation    nancement ment
  Effet     Effet      Budget     Besoin      (optionnel)
  Financier Financier

  Agent     Agent      CB/SDPM    Agent       SDPM/       CB         SDPM/     DG        Trésorerie
   └─► DG    └─► DG     └─► CB     └─► Dir.   Commission   └─► DG     DAF       └─► CB
                                              └─► DG       
```

### 2.2 Flux de données et liaisons

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DOSSIER DE DÉPENSE                                          │
│  (Conteneur unique créé à la validation SEF, lie toutes les étapes)                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
        ┌──────────────────────────────────┼──────────────────────────────────┐
        │                                  │                                  │
        ▼                                  ▼                                  ▼
┌───────────────┐                 ┌───────────────┐                  ┌───────────────┐
│   NOTES       │ ──────────────► │  ENGAGEMENT   │ ────────────────► │   PAIEMENT   │
│ SEF → AEF     │   Imputation    │   (Central)   │   Liquidation    │ ORD → REG    │
│               │                 │               │   + Ordonnancement│               │
└───────────────┘                 └───────────────┘                  └───────────────┘
        │                                  │                                  │
        │                                  │                                  │
        ▼                                  ▼                                  ▼
┌───────────────┐                 ┌───────────────┐                  ┌───────────────┐
│ Ligne Budget  │ ◄────────────── │   Montant     │ ─────────────────► │  Trésorerie  │
│ (Réservation) │   Imputation    │   engagé      │   Règlement       │  (Compte)    │
└───────────────┘                 └───────────────┘                  └───────────────┘
```

### 2.3 Transitions d'état par étape

| Étape | Création | Soumission | Validation | Rejet | Report |
|-------|----------|------------|------------|-------|--------|
| **SEF** | Agent → `brouillon` | Agent → `soumis` | DG → `valide` | DG → `rejete` | DG → `differe` |
| **AEF** | Agent → `brouillon` | Agent → `soumis` | Dir/DG → `valide` | Dir → `rejete` | Dir → `differe` |
| **IMP** | Auto → `en_attente` | - | CB → `impute` | CB → `rejete` | CB → `differe` |
| **EXB** | Agent → `brouillon` | Agent → `soumis` | Dir → `valide` | Dir → `rejete` | Dir → `differe` |
| **PM** | SDPM → `brouillon` | SDPM → `en_cours` | Comm./DG → `attribue` | Comm. → `infructueux` | - |
| **ENG** | CB → `brouillon` | CB → `soumis` | DG → `valide` | DG → `rejete` | DG → `differe` |
| **LIQ** | SDPM → `brouillon` | SDPM → `soumis` | DAF → `valide` | DAF → `rejete` | DAF → `differe` |
| **ORD** | Auto → `en_attente` | - | CB+DG → `valide` | CB → `rejete` | CB → `differe` |
| **REG** | Trés. → `en_cours` | - | Trés. → `paye` | Trés. → `refuse` | - |

---

## 3. Statuts et paniers standardisés

### 3.1 Statuts unifiés

```typescript
// src/lib/workflow/statuts.ts

export const STATUTS_WORKFLOW = {
  // Phase création
  BROUILLON: 'brouillon',        // En cours de saisie
  
  // Phase validation
  SOUMIS: 'soumis',              // Soumis pour validation
  EN_ATTENTE: 'en_attente',      // En attente d'action
  EN_COURS: 'en_cours',          // Traitement en cours
  
  // Phase décision
  VALIDE: 'valide',              // Validé/Approuvé
  REJETE: 'rejete',              // Rejeté
  DIFFERE: 'differe',            // Reporté à une date ultérieure
  
  // Phase terminale
  CLOS: 'clos',                  // Terminé normalement
  ANNULE: 'annule',              // Annulé
  
  // Spécifiques marchés
  ATTRIBUE: 'attribue',          // Marché attribué
  INFRUCTUEUX: 'infructueux',    // Marché infructueux
  
  // Spécifiques règlements
  PAYE: 'paye',                  // Paiement effectué
  REFUSE: 'refuse',              // Paiement refusé
} as const;
```

### 3.2 Paniers par rôle

```typescript
// src/lib/workflow/paniers.ts

export const PANIERS = {
  // DG - Direction Générale
  DG: {
    aValider: [
      { module: 'notes_sef', statut: 'soumis', label: 'Notes SEF à valider' },
      { module: 'notes_dg', statut: 'soumis', label: 'Notes AEF à valider' },
      { module: 'engagements', statut: 'soumis', label: 'Engagements à valider' },
      { module: 'ordonnancements', statut: 'a_signer', label: 'Ordonnancements à signer' },
      { module: 'marches', statut: 'a_approuver', label: 'Marchés à approuver' },
    ],
  },
  
  // DAAF - Direction Administrative et Financière
  DAAF: {
    aValider: [
      { module: 'liquidations', statut: 'soumis', label: 'Liquidations à valider' },
    ],
  },
  
  // CB - Contrôleur Budgétaire
  CB: {
    aValider: [
      { module: 'imputations', statut: 'en_attente', label: 'Imputations à contrôler' },
      { module: 'engagements', statut: 'a_viser', label: 'Engagements à viser' },
      { module: 'ordonnancements', statut: 'en_attente', label: 'Ordonnancements à viser' },
    ],
  },
  
  // SDPM - Service Dépenses et Marchés
  SDPM: {
    aTraiter: [
      { module: 'expressions_besoin', statut: 'valide', label: 'Besoins à traiter' },
      { module: 'liquidations', statut: 'brouillon', label: 'Liquidations à saisir' },
    ],
  },
  
  // SDCT - Service Comptabilité Trésorerie
  SDCT: {
    aTraiter: [
      { module: 'reglements', statut: 'en_cours', label: 'Règlements à effectuer' },
    ],
  },
  
  // Directeur de service
  DIRECTEUR: {
    aValider: [
      { module: 'notes_dg', statut: 'soumis', label: 'Notes AEF à valider' },
      { module: 'expressions_besoin', statut: 'soumis', label: 'Besoins à valider' },
    ],
  },
} as const;
```

### 3.3 Mapping statuts par table

| Table | Colonne statut | Valeurs acceptées |
|-------|----------------|-------------------|
| `notes_sef` | `statut` | brouillon, soumis, valide, rejete, differe |
| `notes_dg` | `statut` | brouillon, soumis, valide, rejete, differe, impute |
| `imputations` | `statut` | en_attente, impute, rejete, differe |
| `expressions_besoin` | `statut` | brouillon, soumis, valide, rejete, differe |
| `marches` | `statut` | brouillon, en_cours, attribue, infructueux, annule |
| `budget_engagements` | `statut` | brouillon, soumis, valide, rejete, differe |
| `budget_liquidations` | `statut` | brouillon, soumis, valide, rejete, differe |
| `ordonnancements` | `statut` | en_attente, vise, signe, rejete, differe |
| `reglements` | `statut` | en_cours, paye, refuse, annule |

---

## 4. Acteurs par étape

### 4.1 Matrice RACI

| Étape | R (Responsable) | A (Approbateur) | C (Consulté) | I (Informé) |
|-------|-----------------|-----------------|--------------|-------------|
| **1. Note SEF** | Agent/Gestionnaire | DG | Direction concernée | - |
| **2. Note AEF** | Agent/Gestionnaire | Directeur → DG | CB | DAAF |
| **3. Imputation** | CB | CB | SDPM | Agent |
| **4. Expression Besoin** | Agent/SDPM | Directeur | CB | DG |
| **5. Passation Marché** | SDPM | Commission → DG | CB, Juridique | Prestataires |
| **6. Engagement** | CB | DG | DAAF | SDPM |
| **7. Liquidation** | SDPM | DAAF | CB | Agent |
| **8. Ordonnancement** | CB | DG (signature) | DAAF | Trésorerie |
| **9. Règlement** | Trésorerie/SDCT | - | CB | Bénéficiaire |

### 4.2 Rôles système

```typescript
export const ROLES_SYGFP = {
  // Direction Générale
  DG: {
    code: 'DG',
    label: 'Direction Générale',
    permissions: ['approve_notes', 'approve_engagements', 'sign_ordonnancements', 'approve_marches'],
  },
  
  // Direction Administrative et Financière
  DAAF: {
    code: 'DAAF',
    label: 'Directeur Administratif et Financier',
    permissions: ['approve_liquidations', 'view_all_budget'],
  },
  
  // Contrôleur Budgétaire
  CB: {
    code: 'CB',
    label: 'Contrôleur Budgétaire',
    permissions: ['control_imputations', 'visa_engagements', 'visa_ordonnancements', 'manage_budget'],
  },
  
  // Service Dépenses et Marchés
  SDPM: {
    code: 'SDPM',
    label: 'Service Dépenses et Passation des Marchés',
    permissions: ['create_liquidations', 'manage_marches', 'process_expressions'],
  },
  
  // Service Comptabilité Trésorerie
  SDCT: {
    code: 'SDCT',
    label: 'Service Comptabilité Trésorerie',
    permissions: ['process_payments', 'manage_tresorerie'],
  },
  
  // Directeur de service
  DIRECTEUR: {
    code: 'DIRECTEUR',
    label: 'Directeur de Service',
    permissions: ['approve_notes_direction', 'approve_expressions'],
  },
  
  // Agent/Gestionnaire
  AGENT: {
    code: 'AGENT',
    label: 'Agent/Gestionnaire',
    permissions: ['create_notes', 'create_expressions', 'view_own'],
  },
  
  // Administrateur
  ADMIN: {
    code: 'ADMIN',
    label: 'Administrateur Système',
    permissions: ['manage_users', 'manage_roles', 'manage_settings', 'view_audit'],
  },
} as const;
```

---

## 5. Écrans MVP

### 5.1 Écrans prioritaires (P1)

#### 5.1.1 Recherche Dossier (Améliorée)
- **Route** : `/recherche`
- **Fonctionnalités** :
  - Barre de recherche unifiée (N° dossier, code ARTI, bénéficiaire, objet)
  - Filtres avancés (exercice, statut, direction, plage montant)
  - Résultats groupés par dossier avec timeline condensée
  - Accès direct au détail de chaque étape
  - Export résultats recherche

#### 5.1.2 Détail Dossier (Timeline)
- **Route** : `/dossiers/:id`
- **Fonctionnalités** :
  - Timeline visuelle interactive (étapes parcourues + à venir)
  - Carte d'identité dossier (codes, montants, dates clés)
  - Onglets par étape avec statut et actions
  - Pièces jointes centralisées
  - Historique complet des actions
  - Navigation entre étapes

#### 5.1.3 Création Note SEF
- **Route** : `/notes-sef/new`
- **Fonctionnalités** :
  - Formulaire wizard (3 étapes)
  - Sélection direction/bénéficiaire
  - Upload pièces jointes
  - Prévisualisation avant soumission
  - Validation temps réel

#### 5.1.4 Panier de tâches par rôle
- **Route** : `/taches`
- **Fonctionnalités** :
  - Vue unifiée des actions en attente
  - Groupement par module
  - Badges compteurs temps réel
  - Actions rapides (valider, rejeter, voir)
  - Filtres par priorité/ancienneté

### 5.2 Écrans secondaires (P2)

| Écran | Route | Description |
|-------|-------|-------------|
| Liste Notes SEF | `/notes-sef` | ✅ Existe - Pagination, filtres, export |
| Détail Note SEF | `/notes-sef/:id` | ✅ Existe - Actions workflow |
| Liste Notes AEF | `/notes-aef` | ✅ Existe |
| Détail Note AEF | `/notes-aef/:id` | ✅ Existe |
| Imputation | `/execution/imputation` | ✅ Existe - Affectation lignes budget |
| Expression Besoin | `/execution/expression-besoin` | ✅ Existe |
| Engagements | `/engagements` | ✅ Existe |
| Liquidations | `/liquidations` | ✅ Existe |
| Ordonnancements | `/ordonnancements` | ✅ Existe |
| Règlements | `/reglements` | ✅ Existe |
| Dashboard | `/` | ✅ Existe - KPIs par rôle |

### 5.3 Écrans tertiaires (P3)

| Écran | Route | Status |
|-------|-------|--------|
| Export PDF mandat | - | ❌ À créer |
| Bordereau de paiement | - | ❌ À créer |
| Journal chronologique | `/admin/journal-audit` | ✅ Existe |
| Configuration alertes | `/alertes-budgetaires` | ✅ Existe |

---

## 6. Mode Safe - Règles d'implémentation

### 6.1 Principes fondamentaux

```typescript
// ⚠️ RÈGLES IMPÉRATIVES POUR TOUTE MODIFICATION

/**
 * 1. ISOLATION - Nouvelles fonctionnalités dans des fichiers séparés
 * 2. NON-RÉGRESSION - Ne jamais modifier les comportements existants
 * 3. FEATURE FLAGS - Nouvelles features désactivables
 * 4. BACKWARD COMPATIBLE - API existantes préservées
 * 5. TESTS D'ABORD - Tester avant de modifier
 */
```

### 6.2 Structure fichiers pour nouvelles features

```
src/
├── features/                     # 🆕 Nouvelles features isolées
│   ├── recherche-avancee/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── paniers-unifies/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   └── timeline-interactive/
│       ├── components/
│       └── hooks/
│
├── lib/
│   ├── workflow/                 # 🆕 Logique workflow centralisée
│   │   ├── statuts.ts           # Constantes statuts
│   │   ├── paniers.ts           # Configuration paniers
│   │   ├── transitions.ts       # Règles transitions
│   │   └── index.ts
│   │
│   └── feature-flags/            # 🆕 Gestion features
│       └── flags.ts
```

### 6.3 Pattern Feature Flag

```typescript
// src/lib/feature-flags/flags.ts

export const FEATURE_FLAGS = {
  // Recherche
  RECHERCHE_AVANCEE: process.env.NODE_ENV === 'development' || true,
  
  // Timeline
  TIMELINE_INTERACTIVE: true,
  
  // Paniers
  PANIERS_UNIFIES: true,
  
  // Export PDF
  EXPORT_PDF_MANDATS: false, // En développement
} as const;

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}
```

### 6.4 Pattern Composant Safe

```typescript
// src/features/recherche-avancee/components/RechercheAvancee.tsx

import { isFeatureEnabled } from '@/lib/feature-flags/flags';
import { RechercheExistante } from '@/pages/Recherche'; // Fallback

export function RechercheAvancee() {
  // Feature flag check
  if (!isFeatureEnabled('RECHERCHE_AVANCEE')) {
    return <RechercheExistante />;
  }
  
  // Nouvelle implémentation
  return (
    <div>
      {/* Nouvelle UI */}
    </div>
  );
}
```

### 6.5 Règles de modification

| Action | ✅ Autorisé | ❌ Interdit |
|--------|-------------|-------------|
| Ajouter composant | Nouveau fichier dans `features/` | Modifier composant existant |
| Ajouter hook | Nouveau fichier | Modifier signature hook existant |
| Modifier table DB | Nouvelle migration | ALTER DROP/RENAME colonne utilisée |
| Ajouter route | Nouveau path | Modifier path existant |
| Ajouter champ form | Champ optionnel | Champ required sur existant |
| Modifier statut | Ajouter valeur | Supprimer/renommer valeur |

---

## 7. Liste de tâches ordonnée

### 7.1 Sprint 0 - Stabilisation (1-2 jours)

| # | Tâche | Priorité | Estimation | Dépendances |
|---|-------|----------|------------|-------------|
| 0.1 | Créer structure `src/features/` | P0 | 0.5h | - |
| 0.2 | Créer `src/lib/workflow/` avec constantes | P0 | 1h | - |
| 0.3 | Créer `src/lib/feature-flags/flags.ts` | P0 | 0.5h | - |
| 0.4 | Auditer incohérences statuts existants | P0 | 2h | 0.2 |
| 0.5 | Documenter statuts actuels par table | P0 | 1h | 0.4 |

### 7.2 Sprint 1 - Recherche et Timeline (3-5 jours)

| # | Tâche | Priorité | Estimation | Dépendances |
|---|-------|----------|------------|-------------|
| 1.1 | Créer `features/recherche-avancee/` | P1 | 4h | 0.1 |
| 1.2 | Composant `SearchBar` unifié | P1 | 2h | 1.1 |
| 1.3 | Hook `useSearchDossiers` | P1 | 3h | 1.1 |
| 1.4 | Composant `SearchResults` avec timeline condensée | P1 | 4h | 1.2, 1.3 |
| 1.5 | Page `/dossiers/:id` détail dossier | P1 | 6h | 1.4 |
| 1.6 | Composant `TimelineInteractive` | P1 | 4h | 1.5 |
| 1.7 | Navigation entre étapes | P1 | 2h | 1.6 |

### 7.3 Sprint 2 - Paniers unifiés (2-3 jours)

| # | Tâche | Priorité | Estimation | Dépendances |
|---|-------|----------|------------|-------------|
| 2.1 | Créer `features/paniers-unifies/` | P1 | 1h | 0.2 |
| 2.2 | Hook `usePaniersTaches` par rôle | P1 | 4h | 2.1 |
| 2.3 | Composant `PanierCard` | P1 | 2h | 2.2 |
| 2.4 | Page `/taches` refactorisée | P1 | 4h | 2.3 |
| 2.5 | Badge compteur sidebar | P1 | 1h | 2.2 |
| 2.6 | Actions rapides depuis panier | P1 | 3h | 2.4 |

### 7.4 Sprint 3 - Pièces jointes et Audit (2-3 jours)

| # | Tâche | Priorité | Estimation | Dépendances |
|---|-------|----------|------------|-------------|
| 3.1 | Créer `features/pieces-jointes/` | P2 | 1h | - |
| 3.2 | Composant `PiecesJointesUnifiees` | P2 | 4h | 3.1 |
| 3.3 | Hook `useDossierAttachments` | P2 | 2h | 3.1 |
| 3.4 | Intégrer dans DetailDossier | P2 | 2h | 3.2, 1.5 |
| 3.5 | Historique actions dans dossier | P2 | 3h | 1.5 |

### 7.5 Sprint 4 - Finitions MVP (2-3 jours)

| # | Tâche | Priorité | Estimation | Dépendances |
|---|-------|----------|------------|-------------|
| 4.1 | Tests unitaires hooks principaux | P2 | 4h | 1.3, 2.2 |
| 4.2 | Tests E2E flux complet | P2 | 6h | 4.1 |
| 4.3 | Documentation utilisateur | P3 | 4h | Tout |
| 4.4 | Review sécurité RLS | P2 | 2h | - |
| 4.5 | Optimisation performances | P3 | 3h | 4.2 |

### 7.6 Backlog Post-MVP

| # | Tâche | Priorité | Notes |
|---|-------|----------|-------|
| B.1 | Notifications email | P2 | Edge function existe |
| B.2 | Export PDF mandats/ordonnancements | P2 | Haute complexité |
| B.3 | Signature électronique | P3 | Intégration externe |
| B.4 | API REST publique | P3 | Pour intégrations |
| B.5 | PWA/Mobile | P3 | Responsive d'abord |

---

## Annexes

### A. Glossaire

| Terme | Définition |
|-------|------------|
| **SEF** | Sans Effet Financier - Note sans impact budgétaire direct |
| **AEF** | Avec Effet Financier - Note engageant le budget |
| **CB** | Contrôleur Budgétaire |
| **DAAF** | Direction Administrative et Financière |
| **SDPM** | Service Dépenses et Passation des Marchés |
| **SDCT** | Service Comptabilité Trésorerie |
| **Dossier** | Conteneur unique regroupant toutes les étapes d'une dépense |
| **Pivot** | Code unique format ARTI identifiant un document |

### B. Références

- [docs/ETAT_ACTUEL.md](./ETAT_ACTUEL.md) - État technique complet
- [docs/ARCHITECTURE_SYGFP.md](./ARCHITECTURE_SYGFP.md) - Architecture système
- [docs/FLUX_SEF_AEF.md](./FLUX_SEF_AEF.md) - Flux Notes SEF/AEF
- [docs/PROJECT_STATUS.md](./PROJECT_STATUS.md) - État avancement

---

*Document généré le 2026-01-17*  
*Prochaine révision : après Sprint 1*
