# Module Suivi DG — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Suivi DG** est un tableau de bord strategique reserve au **Directeur General** et aux **Administrateurs**. Il offre une vue consolidee en temps reel de l'ensemble des operations en attente de validation a travers les 9 etapes de la chaine de depense.

Le module permet au DG de :

- Visualiser le **pipeline complet** des 9 etapes avec barres de progression
- Identifier les **operations en retard** (SLA depasse > 5 jours)
- Consulter la **matrice de validation** (qui valide quoi, avec quelles personnes)
- Suivre les **directions** ayant des dossiers en attente
- Consulter l'**historique des validations** recentes

Les donnees sont **rafraichies automatiquement toutes les 30 secondes** pour un suivi en temps reel.

### Acces RBAC

L'acces est strictement controle : seuls les utilisateurs ayant le role `DG` ou `ADMIN` peuvent acceder a cette page. Un ecran d'acces refuse est affiche pour les autres roles.

---

## 2. Routes et acces

| Route       | Page                  | Roles autorises |
| ----------- | --------------------- | --------------- |
| `/suivi-dg` | Suivi des Validations | DG, ADMIN       |

---

## 3. Composants

| Composant     | Fichier                                | Description                                                                                |
| ------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| SuiviDG       | `src/pages/SuiviDG.tsx`                | Page principale avec 5 onglets (Tabs), guard RBAC, filtres operations                      |
| OverviewTab   | `src/pages/SuiviDG.tsx` (interne)      | Vue d'ensemble : 5 KPIs, top 5 urgences, pipeline 9 etapes avec barres de progression      |
| MatriceTab    | `src/pages/SuiviDG.tsx` (interne)      | Matrice de validation : modules x etapes x roles x personnes assignees                     |
| DirectionsTab | `src/pages/SuiviDG.tsx` (interne)      | Suivi par direction : cartes par direction avec code urgence (vert/orange/rouge), montants |
| OperationsTab | `src/pages/SuiviDG.tsx` (interne)      | Operations en attente : tableau detaille avec filtres (module, direction, role, recherche) |
| HistoriqueTab | `src/pages/SuiviDG.tsx` (interne)      | Historique : 50 dernieres actions de validation/rejet/approbation                          |
| PageHeader    | `src/components/shared/PageHeader.tsx` | En-tete avec breadcrumbs et bouton Actualiser                                              |

---

## 4. Boutons et actions

| Bouton                    | Visible si                         | Action    | Effet                                                                              |
| ------------------------- | ---------------------------------- | --------- | ---------------------------------------------------------------------------------- |
| Actualiser                | Toujours                           | Clic      | Refetch de toutes les queries (stats, matrice, directions, operations, historique) |
| Voir (oeil) par operation | Onglet En attente / Vue d'ensemble | Clic      | Navigue vers l'URL de l'entite (`/engagements`, `/liquidations`, etc.)             |
| Clic sur ligne operation  | Onglet En attente / Vue d'ensemble | Clic      | Navigue vers l'URL de l'entite                                                     |
| Clic sur card pipeline    | Vue d'ensemble                     | Clic      | Navigue vers la page du module correspondant                                       |
| Filtre Module             | Onglet En attente                  | Selection | Filtre par module (Notes SEF, Engagement, etc.)                                    |
| Filtre Direction          | Onglet En attente                  | Selection | Filtre par code direction                                                          |
| Filtre Role               | Onglet En attente                  | Selection | Filtre par role validateur (DG, DAAF, CB, etc.)                                    |
| Recherche                 | Onglet En attente                  | Saisie    | Filtre par reference ou titre                                                      |

---

## 5. Statuts et transitions

Le module Suivi DG ne gere pas ses propres statuts. Il **observe** les statuts des 9 modules de la chaine de depense :

### Pipeline des 9 etapes

```
1. Notes SEF --> 2. Notes AEF --> 3. Imputation --> 4. Expr. Besoin --> 5. Passation
   --> 6. Engagement --> 7. Liquidation --> 8. Ordonnancement --> 9. Reglement
```

### Statuts observes par module

| Module            | Statuts "en attente" surveilles                                         | Validateur attendu |
| ----------------- | ----------------------------------------------------------------------- | ------------------ |
| Notes SEF         | `soumis`, `a_valider_dg`                                                | DIRECTEUR, DG      |
| Notes AEF         | `soumis`, `a_valider`                                                   | DIRECTEUR          |
| Expression Besoin | `soumis`, `verifie`                                                     | DIRECTEUR          |
| Passation Marche  | `attribue`                                                              | DG                 |
| Engagement        | `soumis` -> SAF, `visa_saf` -> CB, `visa_cb` -> DAAF, `visa_daaf` -> DG | SAF, CB, DAAF, DG  |
| Liquidation       | `soumis` -> CB, `certifie_sf` -> DAAF                                   | CB, DAAF           |
| Ordonnancement    | `soumis` -> DAF, `en_attente` -> DAF, `en_signature` -> DG              | DAF, DG            |
| Reglement         | `en_attente`                                                            | TRESORERIE         |

### Indicateurs d'urgence

| Code couleur | Condition            | Description                         |
| ------------ | -------------------- | ----------------------------------- |
| Vert         | Delai <= 3 jours     | Normal                              |
| Orange       | 3 < Delai <= 7 jours | Attention                           |
| Rouge        | Delai > 7 jours      | SLA depasse, action urgente requise |

---

## 6. Workflow de validation

Le Suivi DG ne valide pas directement. Il affiche la **matrice de validation** qui definit qui valide quoi :

### Matrice de validation (depuis `validation_hierarchy`)

| Etape            | Role | Action                  | Condition                               |
| ---------------- | ---- | ----------------------- | --------------------------------------- |
| Visa SAF         | SAF  | Valide l'engagement     | Engagement en statut `soumis`           |
| Visa CB          | CB   | Valide apres SAF        | Engagement en statut `visa_saf`         |
| Visa DAAF        | DAAF | Valide apres CB         | Engagement en statut `visa_cb`          |
| Visa DG          | DG   | Valide apres DAAF       | Engagement en statut `visa_daaf`        |
| Certification SF | CB   | Certifie la liquidation | Liquidation en statut `soumis`          |
| Validation DAAF  | DAAF | Valide la liquidation   | Liquidation en statut `certifie_sf`     |
| Validation DAF   | DAF  | Valide l'ordonnancement | Ordonnancement en statut `en_attente`   |
| Signature DG     | DG   | Signe l'ordonnancement  | Ordonnancement en statut `en_signature` |

### KPIs temps reel

| KPI                | Source                             | Calcul                                               |
| ------------------ | ---------------------------------- | ---------------------------------------------------- |
| En attente         | Toutes tables                      | Somme des enregistrements en statuts d'attente       |
| Montant en attente | Toutes tables                      | Somme des montants (montant_estime + montant)        |
| Delai moyen        | Engagements + Liquidations + Ordos | Moyenne des jours depuis created_at                  |
| En retard          | Engagements + Liquidations + Ordos | Nombre avec delai > 5 jours                          |
| Taux validation    | `logs_actions`                     | Validees / (Validees + Rejetees + Differees) ce mois |

---

## 7. Donnees Supabase

| Table                  | Colonnes cles                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `notes_sef`            | `id`, `reference_pivot`, `objet`, `direction_id`, `montant_estime`, `statut`, `exercice`, `created_at`                                      |
| `notes_dg`             | `id`, `montant_estime`, `statut`, `exercice`, `created_at`                                                                                  |
| `expressions_besoin`   | `id`, `direction_id`, `montant_estime`, `statut`, `exercice`, `created_at`                                                                  |
| `budget_engagements`   | `id`, `numero`, `objet`, `montant`, `statut`, `exercice`, `created_at`                                                                      |
| `budget_liquidations`  | `id`, `numero`, `montant`, `statut`, `exercice`, `created_at`                                                                               |
| `ordonnancements`      | `id`, `numero`, `objet`, `montant`, `statut`, `exercice`, `created_at`                                                                      |
| `reglements`           | `id`, `montant`, `statut`, `exercice`                                                                                                       |
| `passation_marche`     | `id`, `statut`, `exercice`                                                                                                                  |
| `workflow_modules`     | `id`, `code`, `label`, `is_active`                                                                                                          |
| `validation_hierarchy` | `module_id`, `step_order`, `label`, `role`, `is_active`                                                                                     |
| `user_roles`           | `user_id`, `role`, `is_active`                                                                                                              |
| `profiles`             | `id`, `full_name`, `is_active`                                                                                                              |
| `directions`           | `id`, `code`, `label`, `sigle`, `est_active`, `responsable_id`                                                                              |
| `logs_actions`         | `id`, `action`, `entity_type`, `created_at`                                                                                                 |
| `v_logs_actions` (vue) | `id`, `action`, `action_label`, `entity_type`, `entity_type_label`, `entity_reference`, `user_name`, `new_status`, `created_at`, `metadata` |

---

## 8. Hooks

| Hook       | Fichier                   | Exports                                                                                                                                                                                                                                      |
| ---------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| useSuiviDG | `src/hooks/useSuiviDG.ts` | `useSuiviDG()` — retourne `stats` (SuiviDGStats), `matrice` (MatriceRow[]), `directions` (DirectionSuivi[]), `operations` (OperationEnAttente[]), `historique` (HistoriqueAction[]), `isLoading`, `refetch`, `ROLE_LABELS`, `ENTITY_URL_MAP` |
| useRBAC    | `src/hooks/useRBAC.ts`    | `useRBAC()` — utilise pour verifier `hasAnyRole(['DG', 'ADMIN'])`                                                                                                                                                                            |

### Types exportes

| Type                 | Description                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SuiviDGStats`       | `totalEnAttente`, `montantEnAttente`, `delaiMoyenJours`, `enRetard`, `tauxValidation`, `totalValideesMois`, `totalTraiteesMois`, `pipeline` (PipelineStep[])                                                                                                       |
| `PipelineStep`       | `etape` (1-9), `label`, `countEnAttente`, `countTotal`, `pourcentage`, `color`, `url`                                                                                                                                                                              |
| `MatriceRow`         | `moduleCode`, `moduleLabel`, `steps` (MatriceStep[]), `totalPending`                                                                                                                                                                                               |
| `MatriceStep`        | `stepOrder`, `label`, `roleRequired`, `personnes` (string[]), `countPending`                                                                                                                                                                                       |
| `DirectionSuivi`     | `directionId`, `directionCode`, `directionSigle`, `directionLabel`, `responsableNom`, `parModule` (Record), `totalEnAttente`, `montantEnAttente`, `urgence` (vert/orange/rouge)                                                                                    |
| `OperationEnAttente` | `id`, `reference`, `entityTitle`, `module`, `moduleLabel`, `directionCode`, `directionLabel`, `etapeActuelle`, `validateurRole`, `validateurNom`, `delaiJours`, `montant`, `slaDepasse`, `priorite`, `createdAt`, `entityUrl`, `stepActuel` (1-9), `stepTotal` (9) |
| `HistoriqueAction`   | `id`, `action`, `actionLabel`, `entityType`, `entityTypeLabel`, `entityReference`, `userName`, `userRole`, `motif`, `newStatus`, `createdAt`                                                                                                                       |

### Configuration constantes

| Constante            | Contenu                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| `MODULE_LABELS`      | Mapping code module -> libelle francais (9 modules)                                |
| `ROLE_LABELS`        | Mapping code role -> libelle complet (13 roles)                                    |
| `ACTION_LABELS`      | Mapping action -> libelle (VALIDATE, APPROVE, REJECT, DEFER, SUBMIT, SIGN, CREATE) |
| `ENTITY_TYPE_LABELS` | Mapping type entite -> libelle (10 types)                                          |
| `MODULE_STEP_MAP`    | Mapping table -> numero d'etape dans le pipeline (1-9)                             |
| `PIPELINE_CONFIG`    | Configuration des 9 etapes avec couleurs et URLs                                   |
