# Module Budget / Planification — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Budget / Planification** est le coeur du systeme SYGFP. Il couvre trois sous-modules :

- **Structure Budgetaire** : organisation hierarchique du budget (lignes, directions, objectifs strategiques, missions)
- **Planification Budgetaire** : elaboration du budget previsionnel, imports, virements de credits, validation globale
- **Plan de Travail** : suivi de l'execution budgetaire agregee par objectif strategique et par direction

Le module alimente directement les etapes d'imputation, d'engagement et le tableau de bord.

## 2. Routes et acces

| Route                         | Page                     | Composant                     |
| ----------------------------- | ------------------------ | ----------------------------- |
| `/planification/structure`    | Structure Budgetaire     | `StructureBudgetaire.tsx`     |
| `/planification/budget`       | Planification Budgetaire | `PlanificationBudgetaire.tsx` |
| `/planification/plan-travail` | Plan de Travail          | `PlanTravail.tsx`             |

## 3. Composants

| Composant                      | Fichier                                                | Description                                 |
| ------------------------------ | ------------------------------------------------------ | ------------------------------------------- |
| BudgetLineTable                | `components/budget/BudgetLineTable.tsx`                | Tableau des lignes budgetaires avec actions |
| BudgetTreeView                 | `components/budget/BudgetTreeView.tsx`                 | Vue arborescente des lignes                 |
| BudgetLineForm                 | `components/budget/BudgetLineForm.tsx`                 | Formulaire creation/edition ligne           |
| BudgetFilters                  | `components/budget/BudgetFilters.tsx`                  | Filtres (direction, OS, statut, etc.)       |
| BudgetFormulas                 | `components/budget/BudgetFormulas.tsx`                 | Formules de reference affichees             |
| BudgetValidation               | `components/budget/BudgetValidation.tsx`               | Dialog de validation globale du budget      |
| BudgetVersionHistory           | `components/budget/BudgetVersionHistory.tsx`           | Historique des versions du budget           |
| BudgetLineHistory              | `components/budget/BudgetLineHistory.tsx`              | Historique d'une ligne                      |
| BudgetLineEditDialog           | `components/budget/BudgetLineEditDialog.tsx`           | Edition avec versioning                     |
| BudgetLineVersionHistoryDialog | `components/budget/BudgetLineVersionHistoryDialog.tsx` | Versions d'une ligne                        |
| BudgetLineDetailSheet          | `components/budget/BudgetLineDetailSheet.tsx`          | Detail d'une ligne (Sheet)                  |
| BudgetImportAdvanced           | `components/budget/BudgetImportAdvanced.tsx`           | Import CSV avance                           |
| BudgetImportHistory            | `components/budget/BudgetImportHistory.tsx`            | Historique des imports                      |
| ImportExcelWizard              | `components/budget/ImportExcelWizard.tsx`              | Wizard import Excel en 4 etapes             |
| CreditTransferForm             | `components/budget/CreditTransferForm.tsx`             | Formulaire virement de credits              |
| CreditTransferList             | `components/budget/CreditTransferList.tsx`             | Liste des virements                         |
| BudgetMovementJournal          | `components/budget/BudgetMovementJournal.tsx`          | Journal des mouvements budgetaires          |
| NotesPagination                | `components/shared/NotesPagination.tsx`                | Pagination partagee                         |
| EmptyStateNoData               | `components/shared/EmptyState.tsx`                     | Etat vide                                   |

## 4. Boutons et actions

### 4.1 Page Planification Budgetaire (`/planification/budget`)

| Bouton              | Visible si                    | Action                       | Effet                                       |
| ------------------- | ----------------------------- | ---------------------------- | ------------------------------------------- |
| Historique          | Toujours                      | Ouvre `BudgetVersionHistory` | Affiche l'historique des versions du budget |
| Valider le budget   | Toujours                      | Ouvre `BudgetValidation`     | Validation globale du budget                |
| Nouvelle ligne      | Onglet "Lignes budgetaires"   | Ouvre `BudgetLineForm`       | Creation d'une nouvelle ligne               |
| Importer Excel      | Onglet "Lignes budgetaires"   | Ouvre `ImportExcelWizard`    | Import depuis fichier Excel                 |
| Importer CSV        | Onglet "Lignes budgetaires"   | Ouvre `BudgetImportAdvanced` | Import depuis fichier CSV                   |
| Historique imports  | Onglet "Lignes budgetaires"   | Ouvre `BudgetImportHistory`  | Consulte l'historique des imports           |
| Exporter CSV        | Onglet "Lignes budgetaires"   | `handleExport()`             | Telecharge un CSV des lignes                |
| Virement de credits | Onglet "Lignes budgetaires"   | Ouvre `CreditTransferForm`   | Creation d'un virement                      |
| Vue Liste (icone)   | Onglet "Lignes budgetaires"   | `setViewMode('table')`       | Basculer en vue tableau                     |
| Vue Arbre (icone)   | Onglet "Lignes budgetaires"   | `setViewMode('tree')`        | Basculer en vue arborescente                |
| Nouvelle demande    | Onglet "Virements de credits" | Ouvre `CreditTransferForm`   | Creation d'un virement                      |

### 4.2 Page Structure Budgetaire (`/planification/structure`)

| Bouton              | Visible si                  | Action                 | Effet                        |
| ------------------- | --------------------------- | ---------------------- | ---------------------------- |
| Nouvelle ligne      | Onglet "Lignes budgetaires" | Ouvre `BudgetLineForm` | Creation d'une ligne         |
| Exporter (dropdown) | Onglet "Lignes budgetaires" | Menu CSV / Excel / PDF | Export dans le format choisi |
| Rechercher          | Onglet "Lignes budgetaires" | Champ texte            | Filtre par code ou libelle   |
| Vue Liste (icone)   | Onglet "Lignes budgetaires" | `setViewMode('table')` | Basculer en vue tableau      |
| Vue Arbre (icone)   | Onglet "Lignes budgetaires" | `setViewMode('tree')`  | Basculer en vue arborescente |

### 4.3 Page Plan de Travail (`/planification/plan-travail`)

| Bouton              | Visible si                                 | Action                        | Effet                     |
| ------------------- | ------------------------------------------ | ----------------------------- | ------------------------- |
| Reinitialiser       | Filtres actifs                             | Remet tous les filtres a zero | Affiche toutes les lignes |
| Exporter (dropdown) | Chaque vue (par OS, par Direction, Detail) | Menu CSV / Excel / PDF        | Export agregat ou detail  |

## 5. Statuts et transitions

### 5.1 Lignes budgetaires

```
brouillon --> soumis --> valide
                    \--> rejete
```

### 5.2 Virements de credits (dans PlanificationBudgetaire)

```
en_attente --> approuve
          \--> rejete
```

## 6. Donnees Supabase

| Table                    | Colonnes cles                                                                                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `budget_lines`           | id, code, label, level, parent_id, dotation_initiale, dotation_modifiee, total_engage, total_liquide, total_ordonnance, total_paye, disponible_calcule, direction_id, os_id, mission_id, exercice, statut, source_financement |
| `budget_line_history`    | id, budget_line_id, event_type, delta, dotation_avant, dotation_apres                                                                                                                                                         |
| `budget_versions`        | id, exercice, version, statut                                                                                                                                                                                                 |
| `credit_transfers`       | id, from_budget_line_id, to_budget_line_id, amount, type_transfer, motif, status, exercice                                                                                                                                    |
| `budget_history`         | id, budget_line_id, event_type, delta, ref_code, commentaire                                                                                                                                                                  |
| `budget_imports`         | id, exercice, statut                                                                                                                                                                                                          |
| `import_runs`            | id, job_id, statut                                                                                                                                                                                                            |
| `directions`             | id, code, label, sigle, est_active                                                                                                                                                                                            |
| `objectifs_strategiques` | id, code, libelle                                                                                                                                                                                                             |
| `missions`               | id, code, libelle                                                                                                                                                                                                             |

## 7. Hooks

| Hook                  | Fichier                        | Description                              |
| --------------------- | ------------------------------ | ---------------------------------------- |
| `useBudgetLines`      | `hooks/useBudgetLines.ts`      | CRUD lignes budgetaires, totaux, filtres |
| `useCreditTransfers`  | `hooks/useBudgetLines.ts`      | Virements dans PlanificationBudgetaire   |
| `useBaseReferentiels` | `hooks/useBaseReferentiels.ts` | Directions, OS, missions                 |
| `useBudgetTransfers`  | `hooks/useBudgetTransfers.ts`  | Virements (page Virements dediee)        |
| `useBudgetHistory`    | `hooks/useBudgetHistory.ts`    | Historique mouvements                    |
| `useBudgetAlerts`     | `hooks/useBudgetAlerts.ts`     | Alertes budgetaires                      |
