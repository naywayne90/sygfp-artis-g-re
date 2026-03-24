# Module Etats d'Execution — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Etats d'Execution** fournit des rapports et analyses de l'execution budgetaire. Il permet de croiser les donnees de la chaine de depense (engagements, liquidations, ordonnancements, reglements) avec les referentiels budgetaires (directions, objectifs strategiques, missions, nomenclatures NBE, plan comptable SYSCO) pour produire des etats de synthese.

Le module est organise en **8 onglets** de consultation, chacun offrant une vue differente de l'execution :

1. **Suivi Budgetaire** : Vue consolidee avec KPIs globaux (dotation, engage, liquide, ordonnance, paye)
2. **Par Projet** : Execution par reference de dossier/projet
3. **Par Direction** : Execution ventilee par direction
4. **Par Objectif Strategique** : Execution par OS
5. **Par Mission** : Execution par mission
6. **Par Nomenclature NBE** : Execution par nomenclature budgetaire economique
7. **Par Plan Comptable SYSCO** : Execution par compte SYSCO
8. **Par Etape** : Statistiques par etape de la chaine (brouillon, soumis, valide, rejete, differe)

Un bandeau de **filtres transversaux** permet de restreindre les donnees par exercice, periode, direction, OS, mission, NBE ou SYSCO.

---

## 2. Routes et acces

| Route              | Page              | Roles autorises               |
| ------------------ | ----------------- | ----------------------------- |
| `/etats-execution` | Etats d'Execution | DG, DAAF, CB, ADMIN, AUDITEUR |

---

## 3. Composants

| Composant               | Fichier                                     | Description                                                                                                                                           |
| ----------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| EtatsExecution          | `src/pages/EtatsExecution.tsx`              | Page principale : PageHeader, filtres, 8 onglets TabsContent                                                                                          |
| EtatFilters (composant) | `src/components/etats/EtatFilters.tsx`      | Bandeau de filtres : exercice, periode debut/fin, direction, OS, mission, NBE, SYSCO                                                                  |
| SuiviBudgetaire         | `src/components/etats/SuiviBudgetaire.tsx`  | Onglet 1 : KPIs globaux (dotation, engage, liquide, ordonnance, paye) avec taux et barres de progression, restes a engager/liquider/ordonnancer/payer |
| EtatParDirection        | `src/components/etats/EtatParDirection.tsx` | Onglet 3 : Tableau par direction avec colonnes dotation, engage, liquide, ordonnance, paye, taux                                                      |
| EtatGenerique           | `src/components/etats/EtatGenerique.tsx`    | Composant generique reutilise pour les onglets Projet, OS, Mission, NBE, SYSCO. Tableau avec export (CSV/Excel)                                       |
| EtatParEtape            | `src/components/etats/EtatParEtape.tsx`     | Onglet 8 : Statistiques par etape (brouillon, soumis, valide, rejete, differe) avec montants                                                          |
| PageHeader              | `src/components/shared/PageHeader.tsx`      | En-tete avec icone BarChart3                                                                                                                          |

---

## 4. Boutons et actions

| Bouton                        | Visible si              | Action    | Effet                                                    |
| ----------------------------- | ----------------------- | --------- | -------------------------------------------------------- |
| Filtres (direction, OS, etc.) | Toujours                | Selection | Filtre les donnees en temps reel via `onFiltersChange`   |
| Export CSV                    | Composant EtatGenerique | Clic      | Genere un fichier CSV avec les donnees de l'onglet actif |
| Export Excel                  | Composant EtatGenerique | Clic      | Genere un fichier CSV avec separateur `;` pour Excel     |
| Retour (backUrl)              | En-tete                 | Clic      | Retour a la page d'accueil (`/`)                         |

---

## 5. Statuts et transitions

Le module Etats d'Execution est en **lecture seule**. Il ne modifie aucune donnee. Il observe les statuts des modules de la chaine de depense pour compiler les statistiques.

### Indicateurs calcules

| Indicateur          | Formule                                                | Description                        |
| ------------------- | ------------------------------------------------------ | ---------------------------------- |
| Dotation totale     | Somme `budget_lines.dotation_initiale`                 | Budget initial alloue              |
| Montant engage      | Somme `budget_engagements.montant` (statut != annule)  | Total des engagements              |
| Montant liquide     | Somme `budget_liquidations.montant` (statut != annule) | Total des liquidations             |
| Montant ordonnance  | Somme `ordonnancements.montant` (statut != annule)     | Total des ordonnancements          |
| Montant paye        | Somme `reglements.montant` (statut != annule)          | Total des reglements               |
| Taux engagement     | Montant engage / Dotation totale x 100                 | Pourcentage d'engagement           |
| Taux liquidation    | Montant liquide / Montant engage x 100                 | Pourcentage de liquidation         |
| Taux ordonnancement | Montant ordonnance / Montant liquide x 100             | Pourcentage d'ordonnancement       |
| Taux paiement       | Montant paye / Montant ordonnance x 100                | Pourcentage de paiement            |
| Reste a engager     | Dotation - Montant engage                              | Montant disponible pour engagement |
| Reste a liquider    | Montant engage - Montant liquide                       | Engagements non encore liquides    |
| Reste a ordonnancer | Montant liquide - Montant ordonnance                   | Liquidations non ordonnancees      |
| Reste a payer       | Montant ordonnance - Montant paye                      | Ordonnancements non payes          |

### Statistiques par etape

| Champ           | Description                                 |
| --------------- | ------------------------------------------- |
| `total`         | Nombre total d'enregistrements pour l'etape |
| `brouillon`     | Nombre en statut brouillon                  |
| `soumis`        | Nombre en statut soumis                     |
| `valide`        | Nombre valides/approuves                    |
| `rejete`        | Nombre rejetes                              |
| `differe`       | Nombre differes                             |
| `montant_total` | Somme des montants                          |

---

## 6. Workflow de validation

Ce module est strictement consultatif. Il n'y a pas de workflow de validation propre. Les donnees affichees sont le reflet en temps reel des operations effectuees dans les autres modules (Engagement, Liquidation, Ordonnancement, Reglement).

### Logique d'agregation

| Etape              | Source                | Jointure                                                              | Description                    |
| ------------------ | --------------------- | --------------------------------------------------------------------- | ------------------------------ |
| Lignes budgetaires | `budget_lines`        | Directe (exercice, direction_id, os_id, mission_id, nbe_id, sysco_id) | Base de reference              |
| Engagements        | `budget_engagements`  | Via `budget_line_id`                                                  | Montants engages par ligne     |
| Liquidations       | `budget_liquidations` | Via `engagement_id` -> `budget_engagements.budget_line_id`            | Montants liquides par ligne    |
| Ordonnancements    | `ordonnancements`     | Via `liquidation_id` -> `budget_liquidations.engagement_id` -> ligne  | Montants ordonnances par ligne |
| Reglements         | `reglements`          | Via `ordonnancement_id` -> chaine de FK                               | Montants payes par ligne       |

---

## 7. Donnees Supabase

| Table                    | Colonnes cles                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `budget_lines`           | `id`, `code`, `label`, `dotation_initiale`, `exercice`, `is_active`, `direction_id`, `os_id`, `mission_id`, `nbe_id`, `sysco_id` |
| `budget_engagements`     | `id`, `budget_line_id`, `montant`, `exercice`, `statut`, `date_engagement`                                                       |
| `budget_liquidations`    | `id`, `engagement_id`, `montant`, `exercice`, `statut`                                                                           |
| `ordonnancements`        | `id`, `liquidation_id`, `montant`, `exercice`, `statut`                                                                          |
| `reglements`             | `id`, `ordonnancement_id`, `montant`, `exercice`, `statut`                                                                       |
| `directions`             | `id`, `code`, `label`, `sigle`, `est_active`                                                                                     |
| `objectifs_strategiques` | `id`, `code`, `libelle`, `est_actif`                                                                                             |
| `missions`               | `id`, `code`, `libelle`, `est_active`                                                                                            |
| `nomenclature_nbe`       | `id`, `code`, `libelle`, `est_active`                                                                                            |
| `plan_comptable_sysco`   | `id`, `code`, `libelle`, `est_active`                                                                                            |

---

## 8. Hooks

| Hook              | Fichier                          | Exports                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| useEtatsExecution | `src/hooks/useEtatsExecution.ts` | `useEtatsExecution(filters?)` — retourne `summary` (ExecutionSummary), `etapesStats` (EtapeStats[]), `getEtatByDirection()`, `getEtatByOS()`, `getEtatByMission()`, `getEtatByNBE()`, `getEtatBySYSCO()`, `getEtatByProjet()`, `directions`, `objectifsStrategiques`, `missions`, `nomenclaturesNBE`, `planComptableSYSCO`, `isLoading`, `exercice` |

### Types exportes

| Type                  | Description                                                                                                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EtatFilters`         | `exercice?`, `periode_debut?`, `periode_fin?`, `direction_id?`, `os_id?`, `mission_id?`, `nbe_id?`, `sysco_id?`, `projet_id?`                                                                                                                              |
| `BudgetLineExecution` | `id`, `code`, `label`, `dotation_initiale`, `direction_id`, `os_id`, `mission_id`, `nbe_id`, `sysco_id`, `engagements`, `liquidations`, `ordonnancements`, `reglements`                                                                                    |
| `ExecutionSummary`    | `dotation_totale`, `montant_engage`, `montant_liquide`, `montant_ordonnance`, `montant_paye`, `reste_a_engager`, `reste_a_liquider`, `reste_a_ordonnancer`, `reste_a_payer`, `taux_engagement`, `taux_liquidation`, `taux_ordonnancement`, `taux_paiement` |
| `EtapeStats`          | `etape`, `label`, `total`, `brouillon`, `soumis`, `valide`, `rejete`, `differe`, `montant_total`                                                                                                                                                           |
| `DirectionRef`        | `id`, `code`, `label`, `sigle`                                                                                                                                                                                                                             |
| `RefItem`             | `id`, `code`, `libelle`                                                                                                                                                                                                                                    |

### Referentiels charges

Le hook charge automatiquement 5 referentiels pour les filtres et les ventilations :

- **Directions** depuis `directions` (actives uniquement)
- **Objectifs strategiques** depuis `objectifs_strategiques` (actifs)
- **Missions** depuis `missions` (actives)
- **Nomenclatures NBE** depuis `nomenclature_nbe` (actives)
- **Plan comptable SYSCO** depuis `plan_comptable_sysco` (actifs)
