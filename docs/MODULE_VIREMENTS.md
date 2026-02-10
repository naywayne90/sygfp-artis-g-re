# Module Virements & Ajustements Budgétaires

**SYGFP - ARTI Côte d'Ivoire**
**Route :** `/planification/virements`
**Dernière mise à jour :** 9 février 2026

---

## 1. Objectif du module

Permettre le **transfert de crédits entre lignes budgétaires** au sein d'un même exercice. Deux types de mouvements :

| Type           | Description                                               | Ligne source          | Ligne destination      |
| -------------- | --------------------------------------------------------- | --------------------- | ---------------------- |
| **Virement**   | Déplacer un montant d'une ligne vers une autre            | Obligatoire (débitée) | Obligatoire (créditée) |
| **Ajustement** | Ajouter des crédits à une ligne (dotation complémentaire) | Aucune                | Obligatoire (créditée) |

---

## 2. Workflow (cycle de vie d'un virement)

```
┌──────────┐    Soumettre    ┌─────────┐    Valider    ┌─────────┐    Exécuter    ┌──────────┐
│ Brouillon├───────────────►│  Soumis  ├──────────────►│  Validé ├──────────────►│  Exécuté │
└────┬─────┘                └────┬─────┘               └────┬────┘               └──────────┘
     │                           │                          │
     │ Annuler                   │ Rejeter                  │
     ▼                           ▼                          │
┌──────────┐              ┌──────────┐                     │
│  Annulé  │              │  Rejeté  │                     │
└──────────┘              └──────────┘                     │
```

| Statut      | Qui agit           | Action possible                         |
| ----------- | ------------------ | --------------------------------------- |
| `brouillon` | Créateur           | Soumettre ou Annuler                    |
| `soumis`    | Validateur (DAF)   | Valider ou Rejeter (motif obligatoire)  |
| `valide`    | Exécuteur (DG/DAF) | Exécuter (appel fonction SQL)           |
| `execute`   | Système            | Terminal - les montants sont transférés |
| `rejete`    | -                  | Terminal                                |
| `annule`    | -                  | Terminal                                |

---

## 3. Architecture technique

### 3.1 Fichiers source

| Fichier                                           | Lignes | Rôle                                                      |
| ------------------------------------------------- | ------ | --------------------------------------------------------- |
| `src/pages/planification/Virements.tsx`           | ~1450  | Page principale : 3 onglets, dialogs, exports, graphiques |
| `src/hooks/useBudgetTransfers.ts`                 | ~438   | Hook React Query : CRUD + mutations + stats typées        |
| `src/components/budget/BudgetMovementJournal.tsx` | ~480   | Composant journal : historique, KPI, export multi-format  |
| `e2e/virements/page.spec.ts`                      | ~310   | 15 tests E2E Playwright                                   |

### 3.2 Base de données

#### Table `credit_transfers` (30 colonnes)

| Colonne                     | Type        | Description                                                                |
| --------------------------- | ----------- | -------------------------------------------------------------------------- |
| `id`                        | UUID        | Clé primaire                                                               |
| `code`                      | VARCHAR(50) | Code auto-généré (VIR-2026-0001 ou AJU-2026-0001)                          |
| `type_transfer`             | VARCHAR(20) | `virement` ou `ajustement`                                                 |
| `status`                    | VARCHAR     | `brouillon`, `soumis`, `valide`, `approuve`, `execute`, `rejete`, `annule` |
| `amount`                    | NUMERIC     | Montant du transfert en FCFA                                               |
| `motif`                     | TEXT        | Justification (obligatoire)                                                |
| `justification_renforcee`   | TEXT        | Obligatoire pour les ajustements                                           |
| `from_budget_line_id`       | UUID        | Ligne source (NULL pour ajustement)                                        |
| `to_budget_line_id`         | UUID        | Ligne destination                                                          |
| `exercice`                  | INTEGER     | Exercice budgétaire                                                        |
| `from_dotation_avant/apres` | NUMERIC     | Snapshot dotation source avant/après                                       |
| `to_dotation_avant/apres`   | NUMERIC     | Snapshot dotation destination avant/après                                  |

#### Table `budget_history` (journal des mouvements)

Types d'événements : `virement_sortant`, `virement_entrant`, `ajustement_positif`, `engagement`, `liquidation`, `ordonnancement`, `paiement`, `annulation`, `import`

#### Fonctions SQL

| Fonction                                 | Description                                                                                           |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `generate_transfer_code(exercice, type)` | Génère VIR-2026-XXXX ou AJU-2026-XXXX                                                                 |
| `execute_credit_transfer(transfer_id)`   | Exécute le virement : débite `dotation_modifiee` source, crédite destination, enregistre l'historique |

### 3.3 Migration SQL critique

**Fichier :** `supabase/migrations/20260209_fix_credit_transfers_status.sql`

**INSTRUCTIONS :** Exécuter dans Supabase Dashboard > SQL Editor avant utilisation complète du module.

Contenu :

1. **Fix CHECK constraint** : Ajoute les 8 statuts du workflow (`brouillon`, `soumis`, `en_attente`, `valide`, `approuve`, `execute`, `rejete`, `annule`)
2. **Fix `execute_credit_transfer`** : Modifie `dotation_modifiee` au lieu de `dotation_initiale`
3. **Données de test** : 7 virements avec différents statuts

---

## 4. Interface utilisateur

### 4.1 Page principale (3 onglets)

**Onglet "Demandes"** :

- 6 cartes KPI avec skeletons : En attente, Validés, Exécutés ce mois, Montant exécuté, Montant en attente, Ratio VIR/AJU
- Filtres : recherche texte, type (virement/ajustement), statut avec compteur de filtres actifs
- Tableau responsive : Code, Type, Source, Destination, Montant, Statut, Date, Actions
- Badges de statut avec icônes et couleurs contextuelles
- Ligne TOTAL dans le TableFooter
- Empty states illustrés
- Menu contextuel par ligne
- Export multi-format (CSV / Excel / PDF)

**Onglet "Journal des mouvements"** :

- 4 cartes KPI : Total, Virements, Engagements, Ajustements
- Filtres : recherche, type d'événement, bouton Actualiser
- Tableau avec delta coloré (+vert / -rouge), snapshots avant/après
- Totaux positifs/négatifs/nets dans le TableFooter
- Export multi-format (CSV / Excel / PDF)

**Onglet "Statistiques"** :

- PieChart : Répartition par statut (Recharts)
- PieChart : Répartition par type (Virement vs Ajustement)
- BarChart : Volume mensuel des virements exécutés
- Carte résumé financier

### 4.2 Dialog "Nouveau virement/ajustement"

- Onglets Virement / Ajustement
- Sélection ligne source (virement) avec dotation + disponible
- Sélection ligne destination
- Montant (limité au disponible)
- Justification (obligatoire)
- Justification renforcée (ajustement)
- Aperçu avant/après en temps réel
- Alerte si montant > disponible
- Type `CreateTransferData` (pas de `any`)

### 4.3 Dialog "Détails"

- Code, statut avec badge coloré, type
- Timeline du workflow (Création > Soumission > Validation > Exécution)
- Lignes source et destination avec snapshots
- Justification(s)
- Motif de rejet/annulation
- Boutons d'action contextuels
- Bouton copier code

### 4.4 Dialogues de confirmation

- Confirmation avant exécution (irréversible)
- Motif obligatoire pour rejet
- Motif obligatoire pour annulation

---

## 5. Sécurité

- **Virement inter-exercices interdit** (vérifié dans la fonction SQL)
- **Solde insuffisant** : validé côté client ET côté serveur
- **Exercice clos** : bouton "Nouveau" verrouillé via `useExerciceWriteGuard()`
- **Audit trail** : chaque action loggée dans `audit_logs`
- **Snapshots financiers** : dotation avant/après enregistrés pour traçabilité

---

## 6. Tests

### 6.1 Tests E2E (Playwright)

**Fichier :** `e2e/virements/page.spec.ts` - **15 tests, 15 passent**

| Suite              | Tests | Description                                  |
| ------------------ | ----- | -------------------------------------------- |
| Page principale    | 5     | Titre, KPI, onglets, tableau, recherche      |
| Navigation onglets | 3     | Journal, Statistiques, Demandes              |
| Export             | 2     | Menu export, téléchargement CSV              |
| Détails            | 2     | Ouverture dialog, fermeture Escape           |
| Création           | 2     | Dialog création, onglets Virement/Ajustement |
| Responsive         | 1     | Adaptation mobile 375px                      |

### 6.2 Vérifications statiques

| Check                           | Résultat              |
| ------------------------------- | --------------------- |
| TypeScript (`tsc --noEmit`)     | 0 erreurs             |
| ESLint                          | 0 erreurs, 0 warnings |
| Build production (`vite build`) | Succès (~39s)         |

---

## 7. Flux de données

```
Utilisateur
    │
    ▼
Virements.tsx (Page)
    │
    ├─► useBudgetTransfers() ──► Supabase: credit_transfers
    │       ├── createTransfer()  ──► INSERT credit_transfers + audit_logs
    │       ├── submitTransfer()  ──► UPDATE status='soumis' + audit_logs
    │       ├── validateTransfer() ──► UPDATE status='valide' + audit_logs
    │       ├── rejectTransfer()  ──► UPDATE status='rejete' + audit_logs
    │       ├── executeTransfer() ──► RPC execute_credit_transfer()
    │       │                            ├── UPDATE budget_lines.dotation_modifiee (source -montant)
    │       │                            ├── UPDATE budget_lines.dotation_modifiee (dest +montant)
    │       │                            ├── INSERT budget_history (x2)
    │       │                            ├── UPDATE credit_transfers (status='execute')
    │       │                            └── INSERT audit_logs
    │       └── cancelTransfer()  ──► UPDATE status='annule' + audit_logs
    │
    └─► BudgetMovementJournal() ──► Supabase: budget_history
            └── Export CSV / Excel / PDF
```

---

## 8. Améliorations réalisées (9 février 2026)

| #   | Amélioration                                          | Statut |
| --- | ----------------------------------------------------- | ------ |
| 1   | Supprimer `<AppLayout>` - utiliser layout global      | ✅     |
| 2   | Skeletons de chargement                               | ✅     |
| 3   | Badges de statut avec icônes et couleurs              | ✅     |
| 4   | Dashboard statistiques (Recharts)                     | ✅     |
| 5   | Export multi-format CSV/Excel/PDF                     | ✅     |
| 6   | Supprimer `any` TypeScript                            | ✅     |
| 7   | Ligne TOTAL dans TableFooter                          | ✅     |
| 8   | Indicateur de filtres actifs                          | ✅     |
| 9   | Confirmation avant exécution                          | ✅     |
| 10  | Timeline workflow dans les détails                    | ✅     |
| 11  | Empty states illustrés                                | ✅     |
| 12  | Responsive mobile/tablet                              | ✅     |
| 13  | Fix SQL `execute_credit_transfer` (dotation_modifiee) | ✅     |
| 14  | Fix indentation et structure du code                  | ✅     |
| 15  | Améliorer gestion d'erreurs                           | ✅     |
| 16  | Créer données de test (7 virements)                   | ✅     |
| 17  | Améliorer journal des mouvements                      | ✅     |
| 18  | Onglet Statistiques & Tendances                       | ✅     |
| 19  | Tests Playwright E2E (15 tests)                       | ✅     |
| 20  | Mettre à jour documentation                           | ✅     |

**20/20 améliorations terminées.**
