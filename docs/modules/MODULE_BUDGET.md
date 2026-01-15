# Gestion Budgétaire - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

Le module **Budget** est le cœur du système SYGFP. Il gère la structure budgétaire, les dotations, les virements de crédits, et le suivi de l'exécution budgétaire.

### Rôle principal

- Définir la structure hiérarchique du budget
- Gérer les dotations initiales et modifiées
- Suivre l'exécution (engagé, liquidé, ordonnancé, payé)
- Gérer les virements de crédits
- Importer les budgets depuis Excel

---

## 2. Architecture

### 2.1 Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `budget_lines` | Lignes budgétaires | `id` (UUID) |
| `budget_line_history` | Historique modifications | `id` (UUID) |
| `budget_versions` | Versions du budget | `id` (UUID) |
| `credit_transfers` | Virements de crédits | `id` (UUID) |
| `budget_history` | Historique mouvements | `id` (UUID) |
| `budget_imports` | Jobs d'import | `id` (UUID) |
| `import_runs` | Exécutions d'import | `id` (UUID) |

### 2.2 Colonnes clés de `budget_lines`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `code` | text | Non | Code budgétaire |
| `label` | text | Non | Libellé |
| `level` | varchar | Non | Niveau hiérarchique |
| `parent_id` | uuid | Oui | Ligne parente |
| `dotation_initiale` | numeric | Non | Dotation initiale |
| `dotation_modifiee` | numeric | Oui | Après virements |
| `total_engage` | numeric | Oui | Montant engagé |
| `total_liquide` | numeric | Oui | Montant liquidé |
| `total_ordonnance` | numeric | Oui | Montant ordonnancé |
| `total_paye` | numeric | Oui | Montant payé |
| `disponible_calcule` | numeric | Oui | Disponible temps réel |
| `direction_id` | uuid | Oui | Direction |
| `os_id` | uuid | Oui | Objectif Stratégique |
| `mission_id` | uuid | Oui | Mission |
| `action_id` | uuid | Oui | Action |
| `activite_id` | uuid | Oui | Activité |
| `nbe_id` | uuid | Oui | Code NBE |
| `sysco_id` | uuid | Oui | Compte SYSCO |
| `exercice` | integer | Non | Exercice budgétaire |
| `statut` | varchar | Oui | État de validation |

### 2.3 Niveaux hiérarchiques

```
level = "os"        → Objectif Stratégique
level = "mission"   → Mission
level = "action"    → Action
level = "activite"  → Activité
level = "ligne"     → Ligne budgétaire
```

---

## 3. Calcul du disponible

### 3.1 Formule standard

```
Disponible = Dotation Initiale 
           + Virements Reçus 
           - Virements Émis 
           - Total Engagé
```

### 3.2 Formule complète

```
Dotation Modifiée = Dotation Initiale + Virements Reçus - Virements Émis
Disponible = Dotation Modifiée - Total Engagé
```

### 3.3 Colonnes calculées

```typescript
interface BudgetLine {
  dotation_initiale: number;
  dotation_modifiee: number;  // Après virements
  total_engage: number;
  total_liquide: number;
  total_ordonnance: number;
  total_paye: number;
  disponible_calcule: number;
}
```

---

## 4. Virements de crédits

### 4.1 Table `credit_transfers`

| Colonne | Type | Description |
|---------|------|-------------|
| `from_budget_line_id` | uuid | Ligne source (débit) |
| `to_budget_line_id` | uuid | Ligne destination (crédit) |
| `amount` | numeric | Montant transféré |
| `type_transfer` | varchar | `virement` ou `ajustement` |
| `motif` | text | Justification |
| `status` | varchar | État du virement |

### 4.2 Types de transfert

| Type | Description |
|------|-------------|
| `virement` | Transfert entre 2 lignes (source → destination) |
| `ajustement` | Augmentation sans source (budget rectificatif) |

### 4.3 Statuts de virement

```
brouillon → soumis → valide → execute
                  ↘ rejete
                  ↘ annule
```

### 4.4 Hook `useBudgetTransfers`

```typescript
const {
  transfers,
  stats,
  createTransfer,
  submitTransfer,
  validateTransfer,
  executeTransfer,
  rejectTransfer,
  cancelTransfer,
} = useBudgetTransfers();
```

---

## 5. Import Excel

### 5.1 Wizard en 4 étapes

| Étape | Composant | Description |
|-------|-----------|-------------|
| 1 | `StepExerciceUpload` | Sélection exercice + upload fichier |
| 2 | `StepSheetSelection` | Choix de la feuille Excel |
| 3 | `StepPreviewMapping` | Mapping des colonnes |
| 4 | `StepValidationImport` | Validation et import |

### 5.2 Colonnes attendues

```typescript
const COLONNES_BUDGET = [
  "code",                // Code budgétaire
  "libelle",             // Libellé
  "dotation_initiale",   // Montant
  "direction",           // Code direction
  "os",                  // Code OS
  "mission",             // Code mission
  "action",              // Code action
  "activite",            // Code activité
  "nbe",                 // Code NBE
  "sysco",               // Code SYSCO
];
```

### 5.3 Staging et validation

```typescript
// 1. Charger dans staging
await supabase.from("budget_import_staging").insert(rows);

// 2. Valider les données
const { data: validated } = await supabase.rpc("validate_budget_import", {
  p_job_id: jobId,
});

// 3. Importer les données validées
await supabase.rpc("execute_budget_import", {
  p_job_id: jobId,
});
```

---

## 6. Hooks React

### 6.1 Hook principal : `useBudgetLines`

| Export | Type | Description |
|--------|------|-------------|
| `budgetLines` | `BudgetLine[]` | Lignes budgétaires |
| `createBudgetLine` | `function` | Créer une ligne |
| `updateBudgetLine` | `function` | Modifier |
| `deleteBudgetLine` | `function` | Supprimer |
| `calculateAvailability` | `function` | Calculer disponible |

### 6.2 Hook virements : `useBudgetTransfers`

| Export | Type | Description |
|--------|------|-------------|
| `transfers` | `BudgetTransfer[]` | Liste virements |
| `stats` | `object` | Statistiques |
| `createTransfer` | `function` | Créer |
| `executeTransfer` | `function` | Exécuter |

### 6.3 Hook historique : `useBudgetHistory`

```typescript
const { history, isLoading } = useBudgetHistory(budgetLineId);
```

### 6.4 Fichiers sources

```
src/hooks/useBudgetLines.ts      # Lignes budgétaires
src/hooks/useBudgetTransfers.ts  # Virements (~424 lignes)
src/hooks/useBudgetAvailability.ts
src/hooks/useBudgetAlerts.ts
```

---

## 7. Pages et Composants

### 7.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/planification-budgetaire` | `PlanificationBudgetaire.tsx` | Budget |
| `/virements` | `Virements.tsx` | Virements |
| `/import-export` | `ImportExport.tsx` | Import/Export |

### 7.2 Composants principaux

| Composant | Description |
|-----------|-------------|
| `BudgetLineTable.tsx` | Tableau des lignes |
| `BudgetLineForm.tsx` | Formulaire ligne |
| `BudgetTreeView.tsx` | Vue arborescente |
| `BudgetFilters.tsx` | Filtres |
| `BudgetValidation.tsx` | Validation budget |
| `CreditTransferForm.tsx` | Formulaire virement |
| `CreditTransferList.tsx` | Liste virements |
| `ImportExcelWizard.tsx` | Wizard import |
| `BudgetMovementHistory.tsx` | Historique |
| `TopOSWidget.tsx` | Top OS par exécution |

### 7.3 Arborescence

```
src/
├── pages/
│   └── planification/
│       ├── PlanificationBudgetaire.tsx
│       ├── Virements.tsx
│       └── ImportExport.tsx
└── components/
    └── budget/
        ├── BudgetLineTable.tsx
        ├── BudgetLineForm.tsx
        ├── BudgetTreeView.tsx
        ├── BudgetFilters.tsx
        ├── BudgetValidation.tsx
        ├── CreditTransferForm.tsx
        ├── CreditTransferList.tsx
        ├── ImportExcelWizard.tsx
        ├── BudgetMovementHistory.tsx
        └── TopOSWidget.tsx
```

---

## 8. API Supabase - Exemples

### 8.1 Récupérer les lignes budgétaires

```typescript
const { data, error } = await supabase
  .from("budget_lines")
  .select(`
    *,
    direction:directions(id, label, sigle),
    os:objectifs_strategiques(id, code, libelle),
    mission:missions(id, code, libelle),
    nbe:nomenclature_nbe(id, code, libelle),
    sysco:plan_comptable_sysco(id, code, libelle)
  `)
  .eq("exercice", 2026)
  .eq("is_active", true)
  .order("code");
```

### 8.2 Créer un virement

```typescript
const { data, error } = await supabase
  .from("credit_transfers")
  .insert({
    from_budget_line_id: "uuid-source",
    to_budget_line_id: "uuid-destination",
    amount: 1000000,
    type_transfer: "virement",
    motif: "Réallocation pour projet urgent",
    exercice: 2026,
    status: "brouillon",
  })
  .select()
  .single();
```

### 8.3 Exécuter un virement

```typescript
const { data, error } = await supabase.rpc("execute_credit_transfer", {
  p_transfer_id: transferId,
});
```

---

## 9. Alertes budgétaires

### 9.1 Table `budg_alert_rules`

| Colonne | Description |
|---------|-------------|
| `seuil_pct` | Seuil d'alerte (%) |
| `scope` | `GLOBAL` ou `DIRECTION` |
| `actif` | Règle active |

### 9.2 Seuils standards

| Seuil | Niveau | Couleur |
|-------|--------|---------|
| 50% | Info | Bleu |
| 75% | Warning | Orange |
| 90% | Danger | Rouge |

---

## 10. Historique des mouvements

### 10.1 Table `budget_history`

| Colonne | Description |
|---------|-------------|
| `budget_line_id` | Ligne concernée |
| `event_type` | Type d'événement |
| `delta` | Variation (+/-) |
| `dotation_avant` | Dotation avant |
| `dotation_apres` | Dotation après |
| `ref_code` | Code référence (engagement, virement) |
| `commentaire` | Commentaire |

### 10.2 Types d'événements

| Type | Description |
|------|-------------|
| `creation` | Création ligne |
| `virement_in` | Virement reçu |
| `virement_out` | Virement émis |
| `engagement` | Engagement créé |
| `liquidation` | Liquidation créée |
| `modification` | Modification manuelle |

---

## 11. Intégration avec autres modules

### 11.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Import Excel | Lignes budgétaires |
| Référentiels | OS, Missions, NBE, SYSCO |

### 11.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Imputation | Lignes disponibles |
| Engagements | Disponibilité |
| Dashboard | Indicateurs |

---

## 12. Points ouverts / TODOs

- [ ] Budget pluriannuel
- [ ] Versions comparatives
- [ ] Export vers SIGFIP
- [ ] Consolidation multi-directions
- [ ] Prévisions automatiques

---

## 13. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
