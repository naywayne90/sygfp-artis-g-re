# Module Feuille de Route — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Feuille de Route** permet la planification, le suivi et la validation des plans de travail annuels par direction. Il couvre le cycle complet : creation de plans, assignation de taches avec matrice RACI, suivi d'avancement, gestion des livrables, soumission pour validation, et validation par le Controleur Budgetaire et le Charge de Mission.

Le module comprend **5 pages** principales organisees autour de 3 axes :

- **Pilotage** : Tableau de bord consolide (toutes directions) et espace direction
- **Gestion** : Plans de travail, taches, livrables, budget
- **Validation** : Soumissions de feuilles de route, import d'activites

### Entites principales

| Entite          | Description                                                                    |
| --------------- | ------------------------------------------------------------------------------ |
| Plan de travail | Unite de planification par direction/exercice, avec budget alloue et consomme  |
| Tache           | Action a realiser, avec responsable, priorite, avancement, dates, budget prevu |
| Livrable        | Resultat attendu d'une tache, soumis pour validation                           |
| Soumission      | Paquet d'activites soumis par une direction pour validation centrale           |

---

## 2. Routes et acces

| Route                                       | Page                             | Roles autorises                  |
| ------------------------------------------- | -------------------------------- | -------------------------------- |
| `/planification/roadmap-dashboard`          | Tableau de Bord Feuille de Route | DG, ADMIN, CB, DAAF              |
| `/planification/roadmap-direction`          | Mon Espace Direction             | Tous (filtre par direction RBAC) |
| `/planification/projets`                    | Projets & Plans de Travail       | Tous                             |
| `/planification/projets/:id`                | Detail d'un Plan de Travail      | Tous                             |
| `/planification/soumissions-feuilles-route` | Soumissions Feuilles de Route    | CB, CHARGE_MISSION, ADMIN, DG    |
| `/planification/feuilles-route`             | Import Activites                 | Tous                             |

---

## 3. Composants

| Composant                     | Fichier                                                    | Description                                                                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RoadmapDashboard              | `src/pages/planification/RoadmapDashboard.tsx`             | Tableau de bord consolide : 6 KPIs, graphiques Recharts (pie statuts, bar budgets), table soumissions par direction, cards progression direction, top taches en retard, activite recente      |
| RoadmapDirection              | `src/pages/planification/RoadmapDirection.tsx`             | Espace direction : KPIs (plans, taches, avancement pie, en retard), budget global, liste plans, prochaines echeances (14 jours), barre statuts empilee, equipe avec avatars, resume livrables |
| ProjetsList                   | `src/pages/planification/ProjetsList.tsx`                  | Liste des plans de travail : 4 KPIs, filtres (recherche, statut), tableau CRUD complet, formulaire creation/edition en Dialog                                                                 |
| ProjetDetail                  | `src/pages/planification/ProjetDetail.tsx`                 | Detail plan : header avec statut, budget barre, 4 onglets (Taches, Budget, Equipe RACI, Livrables), slider avancement, formulaire tache et livrable                                           |
| RoadmapSubmissionsPage        | `src/pages/planification/RoadmapSubmissionsPage.tsx`       | Gestion soumissions : 5 KPIs par statut, alerte directions manquantes, filtres (direction, statut, recherche), tableau avec delai d'aging colore, dialog detail avec actions                  |
| RoadmapSubmissionDetailDialog | `src/components/planification/RoadmapSubmissionDetail.tsx` | Dialog de detail : infos soumission, activites avec diff snapshot, historique, boutons validation/rejet/revision                                                                              |
| TacheForm                     | `src/components/roadmap/TacheForm.tsx`                     | Formulaire de creation/edition de tache                                                                                                                                                       |
| EmptyStateNoData              | `src/components/shared/EmptyState.tsx`                     | Etat vide reutilisable                                                                                                                                                                        |
| PageHeader                    | `src/components/shared/PageHeader.tsx`                     | En-tete de page avec breadcrumbs                                                                                                                                                              |

---

## 4. Boutons et actions

### Page Tableau de Bord (`RoadmapDashboard`)

| Bouton                 | Visible si | Action | Effet                                                |
| ---------------------- | ---------- | ------ | ---------------------------------------------------- |
| Nouveau Plan           | Toujours   | Clic   | Navigue vers `/planification/projets`                |
| Exporter > CSV         | Toujours   | Clic   | Genere fichier CSV des stats par direction           |
| Exporter > Excel (CSV) | Toujours   | Clic   | Genere fichier CSV avec separateur `;`               |
| Card direction         | Toujours   | Clic   | Navigue vers `/planification/projets?direction={id}` |

### Page Mon Espace Direction (`RoadmapDirection`)

| Bouton                 | Visible si          | Action | Effet                                                    |
| ---------------------- | ------------------- | ------ | -------------------------------------------------------- |
| Nouveau Plan           | Toujours            | Clic   | Navigue vers `/planification/projets`                    |
| Mes Soumissions        | Toujours            | Clic   | Navigue vers `/planification/soumissions-feuilles-route` |
| Importer Activites     | Toujours            | Clic   | Navigue vers `/planification/feuilles-route`             |
| Exporter CSV           | Toujours            | Clic   | Genere CSV des plans + taches de la direction            |
| Finaliser et soumettre | Plans brouillon > 0 | Clic   | Navigue vers `/planification/projets`                    |
| Detail (plan)          | Toujours            | Clic   | Navigue vers `/planification/projets/{plan.id}`          |

### Page Projets & Plans (`ProjetsList`)

| Bouton                | Visible si    | Action           | Effet                                                           |
| --------------------- | ------------- | ---------------- | --------------------------------------------------------------- |
| Nouveau Plan          | Toujours      | Clic             | Ouvre formulaire Dialog, code auto-genere `PT-{exercice}-{num}` |
| Exporter              | Toujours      | Clic             | Export CSV des plans filtres                                    |
| Voir (oeil)           | Par ligne     | Clic             | Navigue vers `/planification/projets/{id}`                      |
| Modifier (crayon)     | Par ligne     | Clic             | Ouvre Dialog pre-rempli                                         |
| Supprimer (corbeille) | Par ligne     | Clic + confirm() | Supprime le plan (soft delete)                                  |
| Creer / Modifier      | Dialog ouvert | Clic             | Valide et enregistre (code + libelle + direction requis)        |
| Annuler               | Dialog ouvert | Clic             | Ferme le Dialog                                                 |

### Page Detail Plan (`ProjetDetail`)

| Bouton                      | Visible si                    | Action             | Effet                                              |
| --------------------------- | ----------------------------- | ------------------ | -------------------------------------------------- |
| Retour (fleche)             | Toujours                      | Clic               | `navigate(-1)`                                     |
| Modifier                    | Toujours                      | Clic               | Navigue vers page modification                     |
| Soumettre                   | `plan.statut === 'brouillon'` | Clic               | Change statut en `soumis`, toast succes            |
| Supprimer                   | Toujours                      | Clic + AlertDialog | Supprime le plan, toast, retour liste              |
| Nouvelle Tache              | Onglet Taches                 | Clic               | Ouvre TacheForm                                    |
| Modifier tache (crayon)     | Par tache                     | Clic               | Ouvre TacheForm pre-rempli                         |
| Supprimer tache (corbeille) | Par tache                     | Clic + confirm()   | Supprime la tache                                  |
| Slider avancement           | Par tache                     | Drag/commit        | Met a jour avancement (0-100%, pas de 5)           |
| Ajouter Livrable            | Onglet Livrables              | Clic               | Ouvre Dialog livrable (nom requis + tache requise) |
| Soumettre livrable          | `statut planifie ou en_cours` | Clic               | Passe en `soumis`, enregistre soumis_par/soumis_at |
| Valider livrable            | `statut soumis`               | Clic               | Passe en `valide`, enregistre valide_par/valide_at |
| Rejeter livrable            | `statut soumis`               | Clic + motif       | Passe en `rejete` avec motif_rejet                 |

### Page Soumissions (`RoadmapSubmissionsPage`)

| Bouton            | Visible si                     | Action                       | Effet                                              |
| ----------------- | ------------------------------ | ---------------------------- | -------------------------------------------------- |
| Actualiser        | Toujours                       | Clic                         | Refetch les donnees                                |
| Details (oeil)    | Par soumission                 | Clic                         | Ouvre RoadmapSubmissionDetailDialog                |
| Valider           | Dialog detail, statut `soumis` | Clic + commentaire optionnel | Appel RPC `validate_roadmap`, toast succes         |
| Rejeter           | Dialog detail, statut `soumis` | Clic + motif obligatoire     | Appel RPC `reject_roadmap`, toast succes           |
| Demander revision | Dialog detail, statut `soumis` | Clic + commentaire           | Appel RPC `request_revision_roadmap`, toast succes |

---

## 5. Statuts et transitions

### Plan de travail

```
brouillon --> soumis --> valide --> en_cours --> cloture
                 |
                 v
              (rejete --> brouillon)
```

| Statut      | Description                     |
| ----------- | ------------------------------- |
| `brouillon` | Plan en cours d'elaboration     |
| `soumis`    | Plan soumis pour validation     |
| `valide`    | Plan approuve par le validateur |
| `en_cours`  | Plan en execution               |
| `cloture`   | Plan termine/ferme              |

### Tache

```
planifie --> en_cours --> termine
    |            |
    v            v
 suspendu    en_retard (auto si date_fin < today)
    |
    v
  annule
```

| Statut      | Couleur         | Description                              |
| ----------- | --------------- | ---------------------------------------- |
| `planifie`  | Gris (#94a3b8)  | Tache planifiee, pas encore demarree     |
| `en_cours`  | Bleu (#3b82f6)  | Tache en cours d'execution               |
| `termine`   | Vert (#22c55e)  | Tache achevee                            |
| `en_retard` | Rouge (#ef4444) | Date de fin depassee, tache non terminee |
| `suspendu`  | Jaune (#f59e0b) | Tache mise en pause                      |
| `annule`    | Gris (#6b7280)  | Tache annulee                            |

### Livrable

```
planifie --> en_cours --> soumis --> valide
                            |
                            v
                          rejete --> (re-soumission possible)
```

| Statut     | Description                             |
| ---------- | --------------------------------------- |
| `planifie` | Livrable prevu                          |
| `en_cours` | En cours de realisation                 |
| `soumis`   | Soumis pour validation par la direction |
| `valide`   | Approuve par CB/Charge de Mission       |
| `rejete`   | Refuse avec motif                       |

### Soumission de feuille de route

```
brouillon --> soumis --> valide
                |
                +---> en_revision --> soumis
                |
                +---> rejete
```

| Statut        | Couleur badge | Description                         |
| ------------- | ------------- | ----------------------------------- |
| `brouillon`   | Gris          | Soumission en preparation           |
| `soumis`      | Jaune/ambre   | En attente de validation            |
| `en_revision` | Orange        | Revision demandee par le validateur |
| `valide`      | Vert          | Soumission approuvee                |
| `rejete`      | Rouge         | Soumission refusee                  |

---

## 6. Workflow de validation

### Validation des plans de travail

| Etape         | Role                   | Action                                   | Condition                                |
| ------------- | ---------------------- | ---------------------------------------- | ---------------------------------------- |
| 1. Creation   | Operateur/Direction    | Cree un plan en statut `brouillon`       | Exercice selectionne, direction assignee |
| 2. Soumission | Direction              | Soumet le plan (`brouillon` -> `soumis`) | Plan en statut `brouillon`               |
| 3. Validation | CB / Charge de Mission | Valide ou rejette                        | Plan en statut `soumis`                  |
| 4. Activation | Automatique            | `valide` -> `en_cours`                   | Apres validation                         |

### Validation des livrables

| Etape         | Role                   | Action                             | Condition                       |
| ------------- | ---------------------- | ---------------------------------- | ------------------------------- |
| 1. Creation   | Direction              | Ajoute un livrable lie a une tache | Nom et tache obligatoires       |
| 2. Soumission | Direction              | Soumet le livrable pour validation | Statut `planifie` ou `en_cours` |
| 3. Validation | CB / Charge de Mission | Valide ou rejette (avec motif)     | Statut `soumis`                 |

### Validation des soumissions de feuille de route

| Etape                  | Role                   | Action                                                | Condition                        |
| ---------------------- | ---------------------- | ----------------------------------------------------- | -------------------------------- |
| 1. Import              | Direction              | Importe activites via `/planification/feuilles-route` | Fichier conforme                 |
| 2. Creation soumission | Automatique            | RPC `create_submission_from_import`                   | Import batch valide              |
| 3. Soumission          | Direction              | RPC `submit_roadmap`                                  | Soumission en statut `brouillon` |
| 4. Validation          | CB / Charge de Mission | RPC `validate_roadmap` (commentaire optionnel)        | Statut `soumis`                  |
| 4b. Demande revision   | CB / Charge de Mission | RPC `request_revision_roadmap` (commentaire)          | Statut `soumis`                  |
| 4c. Rejet              | CB / Charge de Mission | RPC `reject_roadmap` (motif obligatoire)              | Statut `soumis`                  |

---

## 7. Donnees Supabase

| Table                           | Colonnes cles                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plans_travail`                 | `id`, `code`, `libelle`, `description`, `exercice_id`, `direction_id`, `os_id`, `responsable_id`, `priorite`, `statut`, `date_debut`, `date_fin`, `budget_alloue`, `budget_consomme`, `est_actif`, `created_by`, `created_at`, `updated_at`                                                                              |
| `taches`                        | `id`, `code`, `libelle`, `plan_travail_id`, `sous_activite_id`, `responsable_id` (FK profiles), `statut`, `priorite`, `avancement` (0-100), `date_debut`, `date_fin`, `budget_prevu`, `raci_responsable`, `raci_accountable`, `exercice`, `est_active`, `created_at`, `updated_at`                                       |
| `tache_livrables`               | `id`, `tache_id`, `nom`, `description`, `date_prevue`, `statut`, `soumis_par`, `soumis_at`, `valide_par`, `valide_at`, `motif_rejet`, `piece_jointe_path`, `created_at`, `updated_at`                                                                                                                                    |
| `roadmap_submissions`           | `id`, `direction_id`, `exercice_id`, `import_batch_id`, `libelle`, `description`, `nb_activites`, `montant_total`, `status`, `submitted_by`, `submitted_at`, `validated_by`, `validated_at`, `validation_comment`, `rejected_by`, `rejected_at`, `rejection_reason`, `version`, `created_at`, `updated_at`, `created_by` |
| `roadmap_submission_activities` | `id`, `submission_id`, `activite_id`, `snapshot_data` (JSONB), `status` (inclus/modifie/nouveau/supprime), `created_at`                                                                                                                                                                                                  |
| `roadmap_submission_history`    | `id`, `submission_id`, `action`, `old_status`, `new_status`, `comment`, `performed_by`, `performed_at`                                                                                                                                                                                                                   |
| `directions`                    | `id`, `code`, `label`, `sigle`, `est_active`, `responsable_id`                                                                                                                                                                                                                                                           |
| `objectifs_strategiques`        | `id`, `code`, `libelle`, `est_actif`                                                                                                                                                                                                                                                                                     |
| `sous_activites`                | `id`, `code`, `libelle`                                                                                                                                                                                                                                                                                                  |

### Fonctions RPC

| Fonction                        | Parametres                                                          | Description                                |
| ------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| `submit_roadmap`                | `p_submission_id`                                                   | Soumet une feuille de route                |
| `validate_roadmap`              | `p_submission_id`, `p_comment`                                      | Valide une soumission                      |
| `reject_roadmap`                | `p_submission_id`, `p_reason`                                       | Rejette une soumission (motif obligatoire) |
| `request_revision_roadmap`      | `p_submission_id`, `p_comment`                                      | Demande une revision                       |
| `create_submission_from_import` | `p_import_batch_id`, `p_direction_id`, `p_exercice_id`, `p_libelle` | Cree une soumission a partir d'un import   |

---

## 8. Hooks

| Hook                          | Fichier                              | Exports                                                                                                                                                                                                |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| useRoadmapDashboard           | `src/hooks/useRoadmapDashboard.ts`   | `useRoadmapDashboard()` — retourne `globalStats` (RoadmapStats), `directionStats` (DirectionRoadmapStats[]), `topTachesEnRetard`, `plans`, `taches`, `isLoading`, `error`                              |
| usePlansTravail               | `src/hooks/usePlansTravail.ts`       | `usePlansTravail(directionId?)` — retourne `plans`, `isLoading`, `createPlan`, `updatePlan`, `deletePlan`, `isCreating`                                                                                |
| useProjetTaches               | `src/hooks/useProjetTaches.ts`       | `useProjetTaches(sousActiviteId?, planTravailId?)` — retourne `taches`, `stats` (TacheStats), `isLoading`, `createTache`, `updateTache`, `updateAvancement`, `deleteTache`, `isCreating`, `isUpdating` |
| useLivrableValidation         | `src/hooks/useLivrableValidation.ts` | `useLivrableValidation(filters?)` — retourne `livrables`, `isLoading`, `stats`, `createLivrable`, `submitLivrable`, `validateLivrable`, `rejectLivrable`, `deleteLivrable`                             |
| useRoadmapSubmissions         | `src/hooks/useRoadmapSubmissions.ts` | `useRoadmapSubmissions(filters?)` — retourne `submissions`, `stats` (SubmissionStats), `isLoading`, `submit`, `validate`, `reject`, `requestRevision`, `refetch`                                       |
| useRoadmapSubmissionDetail    | `src/hooks/useRoadmapSubmissions.ts` | `useRoadmapSubmissionDetail(submissionId)` — retourne `submission`, `activities`, `history`, `isLoading`, `refetch`                                                                                    |
| useCreateSubmissionFromImport | `src/hooks/useRoadmapSubmissions.ts` | `useCreateSubmissionFromImport()` — mutation pour creer une soumission depuis un batch d'import                                                                                                        |
| useSubmissionDirections       | `src/hooks/useRoadmapSubmissions.ts` | `useSubmissionDirections()` — liste des directions pour filtres                                                                                                                                        |

### Types exportes

| Type                    | Source                               | Description                                                                                                                            |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `RoadmapStats`          | `src/types/roadmap.ts`               | Stats globales : totalPlans, plansEnCours, totalTaches, tachesTerminees, tachesEnRetard, avancementGlobal, budgetTotal, budgetConsomme |
| `DirectionRoadmapStats` | `src/types/roadmap.ts`               | Stats par direction : direction_id, direction_code, direction_nom, stats (RoadmapStats)                                                |
| `PlanTravail`           | `src/types/roadmap.ts`               | Entite plan avec relations direction, responsable, objectif_strategique                                                                |
| `Tache`                 | `src/types/roadmap.ts`               | Entite tache avec responsable (profile), sous_activite                                                                                 |
| `TacheStatut`           | `src/types/roadmap.ts`               | Union type des statuts de tache                                                                                                        |
| `PlanTravailStatut`     | `src/types/roadmap.ts`               | Union type : brouillon, valide, en_cours, cloture                                                                                      |
| `TacheLivrable`         | `src/hooks/useLivrableValidation.ts` | Entite livrable avec tache jointe                                                                                                      |
| `RoadmapSubmission`     | `src/hooks/useRoadmapSubmissions.ts` | Soumission avec relations (direction, exercice, profiles)                                                                              |
| `SubmissionActivity`    | `src/hooks/useRoadmapSubmissions.ts` | Activite d'une soumission avec snapshot et diff                                                                                        |
| `SubmissionStatus`      | `src/hooks/useRoadmapSubmissions.ts` | Union : brouillon, soumis, en_revision, valide, rejete                                                                                 |
