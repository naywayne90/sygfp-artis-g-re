# SYGFP - Inventaire des Modules

**Date de génération :** 2026-01-17
**Version :** 1.0

---

## 1. Modules Présents

### 1.1 Accueil & Navigation

| ID | Module | Route | Tables | Statut |
|----|--------|-------|--------|--------|
| dashboard | Tableau de bord | `/` | dossiers, budget_engagements, budget_liquidations | ✅ ready |
| recherche | Recherche Dossier | `/recherche` | dossiers, dossier_etapes | ✅ ready |
| notifications | Notifications | `/notifications` | notifications | ✅ ready |
| alertes | Alertes Génériques | `/alertes` | alerts | ✅ ready |
| taches | Tâches Workflow | `/taches` | workflow_tasks | ✅ ready |
| mon-profil | Mon Profil | `/mon-profil` | profiles | ✅ ready |

### 1.2 Chaîne de la Dépense (9 étapes)

| Étape | Module | Route | Tables | Statut |
|-------|--------|-------|--------|--------|
| 1 | Notes SEF | `/notes-sef` | notes_sef | ✅ ready |
| 2 | Notes AEF | `/notes-aef` | notes_dg | ✅ ready |
| 3 | Imputation | `/execution/imputation` | imputations, notes_dg | ✅ ready |
| 4 | Expression Besoin | `/execution/expression-besoin` | expressions_besoin | ✅ ready |
| 5 | Passation Marché | `/marches` | marches, passation_marche | ✅ ready |
| 6 | Engagement | `/engagements` | budget_engagements | ✅ ready |
| 7 | Liquidation | `/liquidations` | budget_liquidations | ✅ ready |
| 8 | Ordonnancement | `/ordonnancements` | ordonnancements | ✅ ready |
| 9 | Règlement | `/reglements` | reglements | ✅ ready |

### 1.3 Budget & Planification

| ID | Module | Route | Tables | Statut |
|----|--------|-------|--------|--------|
| planification-structure | Structure Budgétaire | `/planification/structure` | budget_lines | ✅ ready |
| planification-travail | Plan de Travail | `/planification/plan-travail` | budget_activities | ✅ ready |
| planification-virements | Virements & Ajustements | `/planification/virements` | credit_transfers | ✅ ready |
| planification-import-export | Import / Export | `/planification/import-export` | budget_imports | ✅ ready |
| planification-historique | Historique Imports | `/planification/historique-imports` | budget_imports | ✅ ready |
| planification-import-admin | Import Budget (Admin) | `/admin/import-budget` | budget_lines | ✅ ready |

### 1.4 Partenaires

| ID | Module | Route | Tables | Statut |
|----|--------|-------|--------|--------|
| prestataires | Prestataires | `/contractualisation/prestataires` | prestataires | ✅ ready |
| contrats | Contrats | `/contractualisation/contrats` | contrats | ✅ ready |

### 1.5 Gestion Complémentaire

| ID | Module | Route | Tables | Statut |
|----|--------|-------|--------|--------|
| approvisionnement | Approvisionnement | `/approvisionnement` | articles, mouvements_stock | ✅ ready |
| tresorerie | Trésorerie | `/tresorerie` | comptes_bancaires, tresorerie | ✅ ready |
| recettes | Recettes | `/recettes` | recettes | ✅ ready |
| comptabilite-matiere | Comptabilité Matière | `/contractualisation/comptabilite-matiere` | articles | ✅ ready |

### 1.6 Exécution Budgétaire

| ID | Module | Route | Tables | Statut |
|----|--------|-------|--------|--------|
| execution-dashboard | Dashboard Exécution | `/execution/dashboard` | vue consolidée | ✅ ready |
| execution-engagements | Engagements | `/engagements` | budget_engagements | ✅ ready |
| execution-liquidations | Liquidations | `/liquidations` | budget_liquidations | ✅ ready |
| execution-ordonnancements | Ordonnancements | `/ordonnancements` | ordonnancements | ✅ ready |
| execution-reglements | Règlements | `/reglements` | reglements | ✅ ready |

### 1.7 Rapports

| ID | Module | Route | Tables | Statut |
|----|--------|-------|--------|--------|
| etats-execution | États d'Exécution | `/etats-execution` | vue consolidée | ✅ ready |
| alertes-budgetaires | Alertes Budgétaires | `/alertes-budgetaires` | budg_alerts, budg_alert_rules | ✅ ready |

### 1.8 Administration

| ID | Module | Route | Tables | Statut |
|----|--------|-------|--------|--------|
| admin-exercices | Exercices Budgétaires | `/admin/exercices` | exercices | ✅ ready |
| admin-parametres-prog | Paramètres Programmatiques | `/admin/parametres-programmatiques` | - | ✅ ready |
| admin-architecture | Architecture SYGFP | `/admin/architecture` | - | ✅ ready |
| admin-codification | Règles de Codification | `/admin/codification` | codif_variables | ✅ ready |
| admin-secteurs | Secteurs d'Activité | `/admin/secteurs-activite` | secteurs_activite | ✅ ready |
| admin-dictionnaire | Dictionnaire Variables | `/admin/dictionnaire` | codif_variables | ✅ ready |
| admin-utilisateurs | Gestion Utilisateurs | `/admin/utilisateurs` | profiles | ✅ ready |
| admin-roles | Profils & Rôles | `/admin/roles` | roles, user_roles | ✅ ready |
| admin-autorisations | Autorisations | `/admin/autorisations` | permissions | ✅ ready |
| admin-delegations | Délégations | `/admin/delegations` | role_delegations | ✅ ready |
| admin-parametres | Paramètres Système | `/admin/parametres` | system_parameters | ✅ ready |
| admin-journal-audit | Journal d'Audit | `/admin/journal-audit` | audit_logs | ✅ ready |
| admin-documentation | Documentation | `/admin/documentation` | - | ✅ ready |
| admin-raci | Matrice RACI | `/admin/raci` | - | ✅ ready |
| admin-checklist | Checklist Production | `/admin/checklist-production` | - | ✅ ready |

### 1.9 Outils Admin

| ID | Module | Route | Tables | Statut |
|----|--------|-------|--------|--------|
| admin-doublons | Gestion Doublons | `/admin/doublons` | - | ✅ ready |
| admin-compteurs | Compteurs Références | `/admin/compteurs-references` | reference_counters | ✅ ready |

---

## 2. Doublons Détectés

### 2.1 Pages en Doublon (Résolus)

| Fichier 1 | Fichier 2 | Résolution |
|-----------|-----------|------------|
| `src/pages/execution/Imputation.tsx` | `src/pages/execution/ImputationPage.tsx` | ❌ **Supprimé** `Imputation.tsx` (non utilisé) |
| `src/pages/Notes.tsx` | `src/pages/NotesSEF.tsx` + `NotesAEF.tsx` | ❌ **Supprimé** `Notes.tsx` (mockData) |

### 2.2 Hooks en Doublon (Unifiés)

| Fichier 1 | Fichier 2 | Résolution |
|-----------|-----------|------------|
| `useAuditLog.ts` | `useAuditLogEnhanced.ts` | ✅ **Fusionné** vers `useAuditLog.ts` |
| `useRecentActivities.ts` | `useRecentActivitiesEnhanced.ts` | ✅ **Fusionné** vers `useRecentActivities.ts` |

---

## 3. Éléments Incomplets / TODO

| Fichier | Élément | Description | Priorité |
|---------|---------|-------------|----------|
| ~~`Notes.tsx`~~ | ~~Page complète~~ | ~~Utilise données mockées, non connecté DB~~ | ~~Supprimé~~ |
| ~~`Imputation.tsx`~~ | ~~Page doublon~~ | ~~Non utilisée, ImputationPage.tsx la remplace~~ | ~~Supprimé~~ |

---

## 4. Routes Sans Accès Sidebar (Techniques)

Ces routes existent mais sont volontairement cachées de la navigation principale :

| Route | Page | Raison |
|-------|------|--------|
| `/select-exercice` | SelectExercice | Page modale de sélection |
| `/notes-sef/validation` | ValidationNotesSEF | Accédée via bouton contextuel |
| `/notes-aef/validation` | ValidationNotesAEF | Accédée via bouton contextuel |
| `/notes-sef/:id` | NoteSEFDetail | Détail accessible via liste |
| `/notes-aef/:id` | NoteAEFDetail | Détail accessible via liste |
| `/execution/passation-marche` | PassationMarche | Accessible via flux marché |
| `/admin/liens-lambda` | LiensLambda | Route technique |

---

## 5. Architecture du Registre

```
src/lib/config/modules.registry.ts
├── MODULES_REGISTRY (Record<string, ModuleConfig>)
│   ├── Accueil (4 modules)
│   ├── Chaîne de la Dépense (9 modules)
│   ├── Budget (6 modules)
│   ├── Partenaires (2 modules)
│   ├── Gestion (4 modules)
│   ├── Exécution (5 modules)
│   ├── Rapports (2 modules)
│   ├── Admin (12 modules)
│   └── Outils (4 modules)
├── Helper Functions
│   ├── getModuleById(id)
│   ├── getModuleByRoute(route)
│   ├── getModulesByCategory(category)
│   ├── getChaineModules()
│   ├── getModulesForRole(roles[])
│   └── isModuleAccessible(moduleId, roles[])
└── Export Types
    ├── ModuleStatus
    ├── ModuleCategory
    └── ModuleConfig
```

---

## 6. Statistiques

| Catégorie | Nombre de Modules |
|-----------|-------------------|
| Accueil | 6 |
| Chaîne de la Dépense | 9 |
| Budget | 6 |
| Partenaires | 2 |
| Gestion | 4 |
| Exécution | 5 |
| Rapports | 2 |
| Admin | 15 |
| Outils | 2 |
| **Total** | **51** |

---

## 7. Historique des Modifications

| Date | Action | Fichiers |
|------|--------|----------|
| 2026-01-17 | Création inventaire | `SYGFP_INVENTAIRE.md` |
| 2026-01-17 | Création registre modules | `modules.registry.ts` |
| 2026-01-17 | Suppression doublon | `Notes.tsx`, `Imputation.tsx` |
| 2026-01-17 | Unification hooks | `useAuditLog.ts`, `useRecentActivities.ts` |
| 2026-01-17 | Refactoring sidebar | `AppSidebar.tsx` |
