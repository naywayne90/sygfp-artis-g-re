# Module Virements & Ajustements — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Virements & Ajustements** gere les transferts de credits entre lignes budgetaires. Il supporte deux types d'operations :

- **Virement** : transfert d'un montant d'une ligne source vers une ligne destination
- **Ajustement** : augmentation d'une ligne sans source (budget rectificatif)

Le module offre un workflow complet (brouillon > soumis > valide > execute), un journal des mouvements, des statistiques graphiques (camembert par statut, barres par mois) et un export multi-format.

## 2. Routes et acces

| Route                      | Page                    | Composant                           |
| -------------------------- | ----------------------- | ----------------------------------- |
| `/planification/virements` | Virements & Ajustements | `pages/planification/Virements.tsx` |

## 3. Composants

| Composant                        | Fichier                                       | Description                                        |
| -------------------------------- | --------------------------------------------- | -------------------------------------------------- |
| Virements                        | `pages/planification/Virements.tsx`           | Page principale avec KPIs, onglets, table, dialogs |
| BudgetMovementJournal            | `components/budget/BudgetMovementJournal.tsx` | Journal des mouvements budgetaires                 |
| StatusBadge                      | (inline dans Virements.tsx)                   | Badge colore avec icone selon le statut            |
| TransferActions                  | (inline dans Virements.tsx)                   | Menu dropdown d'actions par ligne                  |
| EmptyState / EmptyStateNoResults | `components/shared/EmptyState.tsx`            | Etats vides                                        |

## 4. Boutons et actions

### 4.1 En-tete de page

| Bouton              | Visible si                        | Action                      | Effet                                     |
| ------------------- | --------------------------------- | --------------------------- | ----------------------------------------- |
| Exporter (dropdown) | Toujours                          | Menu CSV / Excel / PDF      | Export des virements filtres              |
| Nouveau             | Exercice en ecriture (`canWrite`) | Ouvre le dialog de creation | Formulaire de virement/ajustement         |
| Nouveau (verrou)    | Exercice en lecture seule         | Desactive avec tooltip      | Affiche le message `getDisabledMessage()` |

### 4.2 Onglet Demandes — Filtres

| Bouton            | Visible si         | Action                                    | Effet                         |
| ----------------- | ------------------ | ----------------------------------------- | ----------------------------- |
| Recherche (champ) | Toujours           | Filtre par code, motif, ligne             | Filtre en temps reel          |
| Filtre Type       | Toujours           | Select : Tous / Virements / Ajustements   | Filtre par type               |
| Filtre Statut     | Toujours           | Select : Tous / Brouillon / Soumis / etc. | Filtre par statut             |
| Effacer (X)       | Filtres actifs > 0 | `clearFilters()`                          | Remet tous les filtres a zero |

### 4.3 Onglet Demandes — Actions par ligne (TransferActions dropdown)

| Bouton       | Visible si                   | Action                             | Effet                                       |
| ------------ | ---------------------------- | ---------------------------------- | ------------------------------------------- |
| Voir details | Toujours                     | `handleViewDetails(transfer)`      | Ouvre le dialog de details                  |
| Copier code  | Code present                 | `handleCopyCode(code)`             | Copie dans le presse-papiers                |
| Soumettre    | Statut = brouillon           | `submitTransfer(id)`               | Passe au statut "soumis"                    |
| Valider      | Statut = soumis              | `validateTransfer(id)`             | Passe au statut "valide"                    |
| Rejeter      | Statut = soumis              | Ouvre dialog rejet avec motif      | Passe au statut "rejete"                    |
| Executer     | Statut = valide ou approuve  | Ouvre dialog de confirmation       | Execute le virement (modifie les dotations) |
| Annuler      | Statut = brouillon ou soumis | Ouvre dialog annulation avec motif | Passe au statut "annule"                    |

### 4.4 Dialogs

| Bouton               | Visible si                     | Action                   | Effet                                           |
| -------------------- | ------------------------------ | ------------------------ | ----------------------------------------------- |
| Confirmer rejet      | Dialog rejet, motif saisi      | `handleReject()`         | Rejette le virement                             |
| Confirmer annulation | Dialog annulation, motif saisi | `handleCancel()`         | Annule le virement                              |
| Confirmer execution  | Dialog confirmation execution  | `handleExecuteConfirm()` | Execute le virement et met a jour les dotations |

### 4.5 Onglets secondaires

| Bouton              | Visible si | Action                          | Effet                                           |
| ------------------- | ---------- | ------------------------------- | ----------------------------------------------- |
| Onglet Demandes     | Toujours   | Affiche la table des virements  | Liste filtrable et paginee                      |
| Onglet Journal      | Toujours   | Affiche `BudgetMovementJournal` | Historique des mouvements budgetaires           |
| Onglet Statistiques | Toujours   | Affiche les graphiques          | Camembert par statut, par type, barres par mois |

## 5. Statuts et transitions

```
brouillon --> soumis --> valide --> execute
                    \--> rejete
         \--> annule
soumis --> annule
valide --> execute
       \--> annule (pas dans le code actuel)
```

Les statuts possibles sont : `brouillon`, `soumis`, `en_attente`, `valide`, `approuve`, `execute`, `rejete`, `annule`.

## 6. Donnees Supabase

| Table              | Colonnes cles                                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `budget_transfers` | id, code, from_budget_line_id, to_budget_line_id, amount, type_transfer (virement/ajustement), motif, status, exercice, requested_at, requested_by, approved_by, executed_at, rejection_reason |
| `budget_lines`     | id, code, label, dotation_initiale, dotation_modifiee (mis a jour apres execution)                                                                                                             |

## 7. Hooks

| Hook                    | Fichier                          | Description                                                                                                                                                                                                                                     |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useBudgetTransfers`    | `hooks/useBudgetTransfers.ts`    | CRUD virements, submitTransfer, validateTransfer, rejectTransfer, executeTransfer, cancelTransfer, stats (pending, validated, executed, rejected, totalPendingAmount, totalExecutedAmount, virementsCount, ajustementsCount, executedThisMonth) |
| `useExerciceWriteGuard` | `hooks/useExerciceWriteGuard.ts` | Verifie si l'exercice courant est en ecriture (canWrite, getDisabledMessage)                                                                                                                                                                    |
