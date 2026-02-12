# SYGFP - État Actuel du Projet

> Document de référence décrivant l'architecture, les modèles de données, les services et les règles métier existantes.
>
> **Date de génération** : Fevrier 2026
> **Version** : 2.0

---

## Table des matières

1. [Routes et Pages](#1-routes-et-pages)
2. [Modèle de Données](#2-modèle-de-données)
3. [Services et API (Hooks)](#3-services-et-api-hooks)
4. [Règles Métier Codées](#4-règles-métier-codées)
5. [Edge Functions](#5-edge-functions)
6. [Garde-fous - Règles Impératives](#6-garde-fous---règles-impératives)

---

## 1. Routes et Pages

### 1.1 Pages Principales

| Domaine     | Route                  | Fichier                  | Description                         |
| ----------- | ---------------------- | ------------------------ | ----------------------------------- |
| **Accueil** | `/`                    | `Dashboard.tsx`          | Tableau de bord principal avec KPIs |
|             | `/recherche`           | `Recherche.tsx`          | Recherche globale multi-entités     |
|             | `/notifications`       | `Notifications.tsx`      | Centre de notifications             |
|             | `/alertes`             | `Alertes.tsx`            | Liste des alertes système           |
|             | `/alertes-budgetaires` | `AlertesBudgetaires.tsx` | Alertes budgétaires spécifiques     |
|             | `/mon-profil`          | `MonProfil.tsx`          | Profil utilisateur connecté         |
|             | `/select-exercice`     | `SelectExercice.tsx`     | Sélection de l'exercice actif       |

### 1.2 Notes SEF (Sans Effet Financier)

| Route            | Fichier             | Description                        |
| ---------------- | ------------------- | ---------------------------------- |
| `/notes-sef`     | `NotesSEF.tsx`      | Liste paginée des Notes SEF        |
| `/notes-sef/:id` | `NoteSEFDetail.tsx` | Détail et actions sur une Note SEF |

**Composants associés :**

- `NoteSEFForm.tsx` - Formulaire création/édition
- `NoteSEFList.tsx` - Tableau avec filtres (clic ligne ouvre Sheet)
- `NoteSEFDetailSheet.tsx` - Sheet latéral 4 onglets (Infos/Contenu/PJ/Historique)
- `NoteSEFDetails.tsx` - Affichage détaillé (legacy)
- `NoteSEFChecklist.tsx` - Checklist de validation
- `NoteSEFDeferDialog.tsx` - Dialog de report
- `NoteSEFRejectDialog.tsx` - Dialog de rejet

### 1.3 Notes AEF (Avec Effet Financier)

| Route            | Fichier             | Description                        |
| ---------------- | ------------------- | ---------------------------------- |
| `/notes-aef`     | `NotesAEF.tsx`      | Liste paginée des Notes AEF        |
| `/notes-aef/:id` | `NoteAEFDetail.tsx` | Détail et actions sur une Note AEF |

**Composants associés :**

- `NoteAEFForm.tsx` - Formulaire création/édition
- `NoteAEFList.tsx` - Tableau avec filtres
- `NoteAEFDetails.tsx` - Affichage détaillé
- `NoteAEFDeferDialog.tsx` - Dialog de report
- `NoteAEFRejectDialog.tsx` - Dialog de rejet
- `NoteAEFImputeDialog.tsx` - Dialog d'imputation

### 1.4 Chaîne de Dépense

| Route                          | Fichier                  | Description                 |
| ------------------------------ | ------------------------ | --------------------------- |
| `/execution/imputation`        | `Imputation.tsx`         | Imputation budgétaire       |
| `/execution/expression-besoin` | `ExpressionBesoin.tsx`   | Expressions de besoin       |
| `/execution/dashboard`         | `DashboardExecution.tsx` | Dashboard exécution         |
| `/marches`                     | `Marches.tsx`            | Gestion des marchés publics |
| `/engagements`                 | `Engagements.tsx`        | Engagements budgétaires     |
| `/liquidations`                | `Liquidations.tsx`       | Liquidations                |
| `/ordonnancements`             | `Ordonnancements.tsx`    | Ordonnancements             |
| `/reglements`                  | `Reglements.tsx`         | Règlements/Paiements        |

### 1.5 Planification

| Route                                 | Fichier                       | Description                 |
| ------------------------------------- | ----------------------------- | --------------------------- |
| `/planification/budget`               | `PlanificationBudgetaire.tsx` | Gestion du budget           |
| `/planification/physique`             | `PlanificationPhysique.tsx`   | Planification des activités |
| `/planification/virements`            | `Virements.tsx`               | Virements de crédit         |
| `/planification/import-export`        | `ImportExport.tsx`            | Import/Export données       |
| `/planification/historique-imports`   | `HistoriqueImports.tsx`       | Historique des imports      |
| `/planification/aide-import`          | `AideImportBudget.tsx`        | Aide à l'import             |
| `/planification/documentation-import` | `DocumentationImport.tsx`     | Documentation import        |

### 1.6 Contractualisation

| Route                                         | Fichier                      | Description                 |
| --------------------------------------------- | ---------------------------- | --------------------------- |
| `/contractualisation/prestataires`            | `Prestataires.tsx`           | Gestion fournisseurs        |
| `/contractualisation/contrats`                | `Contrats.tsx`               | Gestion des contrats        |
| `/contractualisation/validation-prestataires` | `ValidationPrestataires.tsx` | Validation fournisseurs     |
| `/contractualisation/demande-prestataire`     | `DemandePrestataire.tsx`     | Demande nouveau prestataire |
| `/contractualisation/comptabilite-matiere`    | `ComptabiliteMatiere.tsx`    | Comptabilité matières       |

### 1.7 Autres Modules

| Route                | Fichier                  | Description              |
| -------------------- | ------------------------ | ------------------------ |
| `/tresorerie`        | `GestionTresorerie.tsx`  | Gestion trésorerie       |
| `/recettes`          | `DeclarationRecette.tsx` | Déclaration des recettes |
| `/approvisionnement` | `Approvisionnement.tsx`  | Gestion des stocks       |
| `/etats-execution`   | `EtatsExecution.tsx`     | États d'exécution        |

### 1.8 Administration

| Route                               | Fichier                         | Description                  |
| ----------------------------------- | ------------------------------- | ---------------------------- |
| `/admin/exercices`                  | `GestionExercices.tsx`          | Gestion des exercices        |
| `/admin/utilisateurs`               | `GestionUtilisateurs.tsx`       | Gestion utilisateurs         |
| `/admin/roles`                      | `GestionRoles.tsx`              | Gestion des rôles            |
| `/admin/autorisations`              | `GestionAutorisations.tsx`      | Autorisations                |
| `/admin/delegations`                | `GestionDelegations.tsx`        | Délégations                  |
| `/admin/parametres-programmatiques` | `ParametresProgrammatiques.tsx` | Référentiels programmatiques |
| `/admin/parametres-systeme`         | `ParametresSysteme.tsx`         | Paramètres système           |
| `/admin/parametres-exercice`        | `ParametresExercice.tsx`        | Paramètres exercice          |
| `/admin/journal-audit`              | `JournalAudit.tsx`              | Journal d'audit              |
| `/admin/secteurs-activite`          | `SecteursActivite.tsx`          | Secteurs d'activité          |
| `/admin/referentiel-codification`   | `ReferentielCodification.tsx`   | Codification                 |
| `/admin/dictionnaire-variables`     | `DictionnaireVariables.tsx`     | Variables système            |
| `/admin/compteurs-references`       | `CompteursReferences.tsx`       | Compteurs de références      |
| `/admin/matrice-raci`               | `MatriceRACI.tsx`               | Matrice RACI                 |
| `/admin/liens-lambda`               | `LiensLambda.tsx`               | Liens Lambda                 |
| `/admin/documentation-modules`      | `DocumentationModules.tsx`      | Documentation                |
| `/admin/architecture-sygfp`         | `ArchitectureSYGFP.tsx`         | Architecture système         |
| `/admin/checklist-production`       | `ChecklistProduction.tsx`       | Checklist production         |
| `/admin/gestion-doublons`           | `GestionDoublons.tsx`           | Gestion des doublons         |

---

## 2. Modèle de Données

### 2.1 Tables Chaîne de Dépense

#### `notes_sef` - Notes Sans Effet Financier

| Colonne                   | Type      | Description                                     |
| ------------------------- | --------- | ----------------------------------------------- |
| `id`                      | UUID      | Identifiant unique                              |
| `numero`                  | TEXT      | Numéro de référence (format ARTI)               |
| `objet`                   | TEXT      | Objet de la note                                |
| `direction_id`            | UUID      | Direction émettrice                             |
| `demandeur_id`            | UUID      | Utilisateur demandeur                           |
| `beneficiaire_id`         | UUID      | Prestataire bénéficiaire (optionnel)            |
| `beneficiaire_interne_id` | UUID      | Bénéficiaire interne (optionnel)                |
| `urgence`                 | TEXT      | Niveau d'urgence (basse/normale/haute/urgente)  |
| `justification`           | TEXT      | Justification de la demande                     |
| `date_souhaitee`          | DATE      | Date souhaitée de réalisation                   |
| `description`             | TEXT      | Description détaillée                           |
| `commentaire`             | TEXT      | Commentaires                                    |
| `statut`                  | TEXT      | Statut (brouillon/soumis/valide/rejete/differe) |
| `exercice`                | INTEGER   | Exercice budgétaire                             |
| `dossier_id`              | UUID      | Dossier associé (créé à validation)             |
| `created_by`              | UUID      | Créateur                                        |
| `created_at`              | TIMESTAMP | Date de création                                |
| `validated_by`            | UUID      | Validateur                                      |
| `validated_at`            | TIMESTAMP | Date de validation                              |
| `code_locked`             | BOOLEAN   | Code verrouillé après validation                |

#### `notes_dg` - Notes Avec Effet Financier (AEF)

| Colonne            | Type    | Description                                    |
| ------------------ | ------- | ---------------------------------------------- |
| `id`               | UUID    | Identifiant unique                             |
| `numero`           | TEXT    | Numéro de référence (format ARTI)              |
| `objet`            | TEXT    | Objet de la note                               |
| `direction_id`     | UUID    | Direction émettrice                            |
| `priorite`         | TEXT    | Priorité (basse/normale/haute/urgente)         |
| `montant_estime`   | NUMERIC | Montant estimé                                 |
| `contenu`          | TEXT    | Contenu/description                            |
| `type_depense`     | TEXT    | Type (fonctionnement/investissement/transfert) |
| `note_sef_id`      | UUID    | Note SEF source (optionnel)                    |
| `is_direct_aef`    | BOOLEAN | AEF directe sans SEF                           |
| `justification_dg` | TEXT    | Justification si AEF directe                   |
| `statut`           | TEXT    | Statut workflow                                |
| `exercice`         | INTEGER | Exercice budgétaire                            |
| `dossier_id`       | UUID    | Dossier associé                                |
| `imputation_id`    | UUID    | Imputation liée                                |
| `created_by`       | UUID    | Créateur                                       |
| `validated_by`     | UUID    | Validateur                                     |
| `code_locked`      | BOOLEAN | Code verrouillé                                |

#### `imputations` - Imputations Budgétaires

| Colonne                 | Type    | Description              |
| ----------------------- | ------- | ------------------------ |
| `id`                    | UUID    | Identifiant unique       |
| `note_id`               | UUID    | Note AEF source          |
| `budget_line_id`        | UUID    | Ligne budgétaire         |
| `montant`               | NUMERIC | Montant imputé           |
| `exercice`              | INTEGER | Exercice                 |
| `statut`                | TEXT    | Statut                   |
| `commentaire`           | TEXT    | Commentaire              |
| `force_imputation`      | BOOLEAN | Forçage si dépassement   |
| `justification_forcage` | TEXT    | Justification du forçage |
| `created_by`            | UUID    | Créateur                 |

#### `expressions_besoin` - Expressions de Besoin

| Colonne          | Type    | Description         |
| ---------------- | ------- | ------------------- |
| `id`             | UUID    | Identifiant unique  |
| `numero`         | TEXT    | Numéro de référence |
| `objet`          | TEXT    | Objet               |
| `note_id`        | UUID    | Note AEF source     |
| `direction_id`   | UUID    | Direction           |
| `montant_estime` | NUMERIC | Montant estimé      |
| `type_besoin`    | TEXT    | Type de besoin      |
| `statut`         | TEXT    | Statut workflow     |
| `exercice`       | INTEGER | Exercice            |
| `dossier_id`     | UUID    | Dossier associé     |

#### `marches` - Marchés Publics

| Colonne                | Type    | Description                   |
| ---------------------- | ------- | ----------------------------- |
| `id`                   | UUID    | Identifiant unique            |
| `numero`               | TEXT    | Numéro du marché              |
| `objet`                | TEXT    | Objet                         |
| `type_marche`          | TEXT    | Type (AOO/AOR/gre_a_gre/etc.) |
| `montant_estimatif`    | NUMERIC | Montant estimatif             |
| `expression_besoin_id` | UUID    | Expression de besoin source   |
| `statut`               | TEXT    | Statut                        |
| `exercice`             | INTEGER | Exercice                      |

#### `budget_engagements` - Engagements

| Colonne                | Type    | Description          |
| ---------------------- | ------- | -------------------- |
| `id`                   | UUID    | Identifiant unique   |
| `numero`               | TEXT    | Numéro d'engagement  |
| `objet`                | TEXT    | Objet                |
| `budget_line_id`       | UUID    | Ligne budgétaire     |
| `montant`              | NUMERIC | Montant engagé       |
| `montant_ht`           | NUMERIC | Montant HT           |
| `tva`                  | NUMERIC | TVA                  |
| `fournisseur`          | TEXT    | Fournisseur          |
| `marche_id`            | UUID    | Marché lié           |
| `note_id`              | UUID    | Note AEF liée        |
| `expression_besoin_id` | UUID    | Expression de besoin |
| `dossier_id`           | UUID    | Dossier              |
| `statut`               | TEXT    | Statut               |
| `workflow_status`      | TEXT    | Étape workflow       |
| `current_step`         | INTEGER | Étape courante       |
| `exercice`             | INTEGER | Exercice             |

#### `budget_liquidations` - Liquidations

| Colonne             | Type    | Description           |
| ------------------- | ------- | --------------------- |
| `id`                | UUID    | Identifiant unique    |
| `numero`            | TEXT    | Numéro                |
| `engagement_id`     | UUID    | Engagement source     |
| `montant`           | NUMERIC | Montant liquidé       |
| `montant_ht`        | NUMERIC | Montant HT            |
| `tva_taux`          | NUMERIC | Taux TVA              |
| `tva_montant`       | NUMERIC | Montant TVA           |
| `net_a_payer`       | NUMERIC | Net à payer           |
| `reference_facture` | TEXT    | Référence facture     |
| `service_fait`      | BOOLEAN | Service fait certifié |
| `service_fait_date` | DATE    | Date service fait     |
| `statut`            | TEXT    | Statut                |
| `exercice`          | INTEGER | Exercice              |

#### `ordonnancements` - Ordonnancements

| Colonne          | Type    | Description              |
| ---------------- | ------- | ------------------------ |
| `id`             | UUID    | Identifiant unique       |
| `numero`         | TEXT    | Numéro                   |
| `liquidation_id` | UUID    | Liquidation source       |
| `montant`        | NUMERIC | Montant                  |
| `beneficiaire`   | TEXT    | Bénéficiaire             |
| `mode_paiement`  | TEXT    | Mode de paiement         |
| `statut`         | TEXT    | Statut                   |
| `signatures`     | JSONB   | Signatures électroniques |
| `exercice`       | INTEGER | Exercice                 |

#### `reglements` - Règlements

| Colonne              | Type    | Description           |
| -------------------- | ------- | --------------------- |
| `id`                 | UUID    | Identifiant unique    |
| `numero`             | TEXT    | Numéro                |
| `ordonnancement_id`  | UUID    | Ordonnancement source |
| `montant`            | NUMERIC | Montant réglé         |
| `date_reglement`     | DATE    | Date de règlement     |
| `mode_paiement`      | TEXT    | Mode de paiement      |
| `reference_paiement` | TEXT    | Référence             |
| `compte_bancaire_id` | UUID    | Compte bancaire       |
| `statut`             | TEXT    | Statut                |
| `exercice`           | INTEGER | Exercice              |

### 2.2 Tables Budget

#### `budget_lines` - Lignes Budgétaires

| Colonne              | Type    | Description              |
| -------------------- | ------- | ------------------------ |
| `id`                 | UUID    | Identifiant unique       |
| `code`               | TEXT    | Code budgétaire          |
| `code_budgetaire`    | TEXT    | Code budgétaire v1       |
| `code_budgetaire_v2` | TEXT    | Code budgétaire v2       |
| `label`              | TEXT    | Libellé                  |
| `level`              | TEXT    | Niveau hiérarchique      |
| `parent_id`          | UUID    | Ligne parente            |
| `exercice`           | INTEGER | Exercice                 |
| `dotation_initiale`  | NUMERIC | Dotation initiale        |
| `dotation_modifiee`  | NUMERIC | Dotation après virements |
| `total_engage`       | NUMERIC | Total engagé             |
| `total_liquide`      | NUMERIC | Total liquidé            |
| `total_ordonnance`   | NUMERIC | Total ordonnancé         |
| `total_paye`         | NUMERIC | Total payé               |
| `disponible_calcule` | NUMERIC | Disponible calculé       |
| `direction_id`       | UUID    | Direction                |
| `os_id`              | UUID    | Objectif stratégique     |
| `mission_id`         | UUID    | Mission                  |
| `action_id`          | UUID    | Action                   |
| `activite_id`        | UUID    | Activité                 |
| `sysco_id`           | UUID    | Compte SYSCO             |
| `nbe_id`             | UUID    | Nomenclature NBE         |
| `statut`             | TEXT    | Statut                   |
| `is_active`          | BOOLEAN | Ligne active             |

#### `credit_transfers` - Virements de Crédit

| Colonne               | Type    | Description                                 |
| --------------------- | ------- | ------------------------------------------- |
| `id`                  | UUID    | Identifiant unique                          |
| `code`                | TEXT    | Code du virement                            |
| `from_budget_line_id` | UUID    | Ligne source                                |
| `to_budget_line_id`   | UUID    | Ligne destination                           |
| `amount`              | NUMERIC | Montant                                     |
| `motif`               | TEXT    | Motif                                       |
| `type_transfer`       | TEXT    | Type de virement                            |
| `status`              | TEXT    | Statut (pending/approved/rejected/executed) |
| `exercice`            | INTEGER | Exercice                                    |

### 2.3 Tables Référentiels

| Table                    | Description            | Colonnes clés                         |
| ------------------------ | ---------------------- | ------------------------------------- |
| `directions`             | Directions/Services    | id, code, libelle, sigle, est_active  |
| `objectifs_strategiques` | Objectifs stratégiques | id, code, libelle                     |
| `missions`               | Missions               | id, code, libelle, os_id              |
| `actions`                | Actions                | id, code, libelle, mission_id, os_id  |
| `activites`              | Activités              | id, code, libelle, action_id          |
| `sous_activites`         | Sous-activités         | id, code, libelle, activite_id        |
| `taches`                 | Tâches                 | id, code, libelle, sous_activite_id   |
| `nomenclature_nbe`       | Nomenclature NBE       | id, code, libelle, niveau             |
| `plan_comptable_sysco`   | Plan comptable SYSCO   | id, numero, libelle, classe           |
| `prestataires`           | Fournisseurs           | id, code, raison_sociale, nif, statut |
| `secteurs_activite`      | Secteurs d'activité    | id, code, libelle                     |

### 2.4 Tables Utilisateurs et Sécurité

| Table                   | Description               | Colonnes clés                                         |
| ----------------------- | ------------------------- | ----------------------------------------------------- |
| `profiles`              | Profils utilisateurs      | id, email, nom, prenom, direction_id, fonction        |
| `user_roles`            | Rôles utilisateurs        | id, user_id, role_id                                  |
| `roles`                 | Définition des rôles      | id, code, libelle, permissions                        |
| `delegations`           | Délégations de pouvoir    | id, delegant_id, delegataire_id, date_debut, date_fin |
| `exercices_budgetaires` | Exercices                 | id, annee, libelle, statut, date_debut, date_fin      |
| `user_exercices`        | Exercices par utilisateur | id, user_id, exercice_id                              |

### 2.5 Tables Audit et Historique

| Table                 | Description                   |
| --------------------- | ----------------------------- |
| `audit_logs`          | Journal d'audit général       |
| `notes_sef_history`   | Historique modifications SEF  |
| `notes_aef_history`   | Historique modifications AEF  |
| `budget_history`      | Historique mouvements budget  |
| `budget_line_history` | Historique lignes budgétaires |

---

## 3. Services et API (Hooks)

### 3.1 Notes SEF

#### `useNotesSEF.ts`

| Fonction           | Description                | Table(s)              |
| ------------------ | -------------------------- | --------------------- |
| `createMutation`   | Création note SEF          | notes_sef             |
| `updateMutation`   | Mise à jour                | notes_sef             |
| `submitMutation`   | Soumission pour validation | notes_sef             |
| `validateMutation` | Validation DG              | notes_sef, dossiers   |
| `rejectMutation`   | Rejet avec motif           | notes_sef             |
| `deferMutation`    | Report avec date           | notes_sef             |
| `deleteAttachment` | Suppression PJ             | notes_sef_attachments |
| `useNoteById`      | Récupération par ID        | notes_sef             |

#### `useNotesSEFList.ts`

| Fonction         | Description                   |
| ---------------- | ----------------------------- |
| `searchQuery`    | Recherche paginée server-side |
| `countsQuery`    | Compteurs par statut          |
| `setSearchQuery` | Filtre recherche              |
| `setActiveTab`   | Filtre par statut             |
| `setPage`        | Pagination                    |

#### `useNoteSEFDetail.ts` (nouveau - 2026-02-13)

| Fonction        | Description                       |
| --------------- | --------------------------------- |
| `pieces`        | Pièces jointes de la note (max 3) |
| `history`       | Historique des modifications      |
| `linkedNoteAEF` | Note AEF liée (via FK)            |
| `isLoading`     | État de chargement des 3 requêtes |

#### `useNotesSEFExport.ts`

| Fonction      | Description                                    |
| ------------- | ---------------------------------------------- |
| `exportExcel` | Export Excel 22 colonnes (dont Montant estimé) |
| `exportPdf`   | Export PDF avec en-tête ARTI                   |

### 3.2 Notes AEF

#### `useNotesAEF.ts`

| Fonction           | Description           | Table(s)              |
| ------------------ | --------------------- | --------------------- |
| `createMutation`   | Création note AEF     | notes_dg              |
| `updateMutation`   | Mise à jour           | notes_dg              |
| `submitMutation`   | Soumission            | notes_dg              |
| `validateMutation` | Validation DG         | notes_dg              |
| `rejectMutation`   | Rejet                 | notes_dg              |
| `deferMutation`    | Report                | notes_dg              |
| `imputeMutation`   | Imputation budgétaire | notes_dg, imputations |
| `useNoteById`      | Récupération par ID   | notes_dg              |

#### `useNotesAEFList.ts`

| Fonction                                 | Description |
| ---------------------------------------- | ----------- |
| Pagination server-side avec debounce     |             |
| Filtres par statut, direction, recherche |             |

### 3.3 Chaîne de Dépense

#### `useImputation.ts`

| Fonction                 | Description              |
| ------------------------ | ------------------------ |
| `imputeMutation`         | Création imputation      |
| `calculateAvailability`  | Calcul disponibilité     |
| `findOrCreateBudgetLine` | Recherche/création ligne |
| `checkAlreadyImputed`    | Vérification unicité     |

#### `useEngagements.ts`

| Fonction   | Description               |
| ---------- | ------------------------- |
| `create`   | Création engagement       |
| `update`   | Mise à jour               |
| `validate` | Validation (multi-étapes) |
| `reject`   | Rejet                     |
| `defer`    | Report                    |

#### `useLiquidations.ts`

| Fonction             | Description                |
| -------------------- | -------------------------- |
| `create`             | Création liquidation       |
| `update`             | Mise à jour                |
| `validate`           | Validation                 |
| `certifyServiceFait` | Certification service fait |

#### `useOrdonnancements.ts`

| Fonction   | Description                |
| ---------- | -------------------------- |
| `create`   | Création ordonnancement    |
| `validate` | Validation avec signatures |

#### `useReglements.ts`

| Fonction   | Description         |
| ---------- | ------------------- |
| `create`   | Création règlement  |
| `validate` | Validation paiement |

### 3.4 Budget

#### `useBudgetLines.ts`

| Fonction        | Description        |
| --------------- | ------------------ |
| `create`        | Création ligne     |
| `update`        | Mise à jour        |
| `import`        | Import massif      |
| `lock`          | Verrouillage       |
| `useByExercice` | Liste par exercice |

#### `useBudgetTransfers.ts`

| Fonction  | Description         |
| --------- | ------------------- |
| `request` | Demande de virement |
| `approve` | Approbation         |
| `reject`  | Rejet               |
| `execute` | Exécution           |

### 3.5 Transversal

#### `usePermissions.ts`

| Fonction         | Description               |
| ---------------- | ------------------------- |
| `hasRole`        | Vérification rôle         |
| `canValidateSEF` | Permission validation SEF |
| `canValidateAEF` | Permission validation AEF |
| `canCreate*`     | Permissions création      |
| `isAdmin`        | Vérification admin        |
| `isDG`           | Vérification DG           |

#### `useExercice.ts` (via ExerciceContext)

| Fonction      | Description               |
| ------------- | ------------------------- |
| `exercice`    | Exercice actif            |
| `setExercice` | Changement exercice       |
| `isReadOnly`  | Exercice en lecture seule |
| `canWrite`    | Permission écriture       |

#### `useAuditLog.ts`

| Fonction    | Description                 |
| ----------- | --------------------------- |
| `logAction` | Enregistrement action audit |

#### `useSeparationOfDuties.ts`

| Fonction          | Description                        |
| ----------------- | ---------------------------------- |
| `checkSeparation` | Vérification séparation des tâches |

---

## 4. Règles Métier Codées

### 4.1 Notes SEF

#### Champs obligatoires

- `objet` : min 1 caractère
- `direction_id` : UUID valide
- `demandeur_id` : UUID valide
- `urgence` : enum (basse/normale/haute/urgente)
- `justification` : min 10 caractères
- `date_souhaitee` : date valide

#### Transitions de statut

```
brouillon → soumis → valide
                  → rejete
                  → differe → soumis
```

#### Règles de validation

- **Création** : tout utilisateur authentifié
- **Modification** : créateur uniquement si statut = brouillon
- **Soumission** : créateur ou utilisateur de la même direction
- **Validation** : rôle DG ou ADMIN uniquement
- **Rejet/Report** : rôle DG ou ADMIN uniquement

#### Actions automatiques

- À la validation : création automatique d'un dossier
- À la validation : verrouillage du code (code_locked = true)
- À chaque action : enregistrement dans notes_sef_history

### 4.2 Notes AEF

#### Champs obligatoires

- `objet` : min 1 caractère
- `direction_id` : UUID valide
- `priorite` : enum (basse/normale/haute/urgente)
- `montant_estime` : > 0
- `contenu` : min 10 caractères
- `type_depense` : enum (fonctionnement/investissement/transfert)

#### Règles conditionnelles

- Si `is_direct_aef = false` → `note_sef_id` obligatoire (doit référencer une SEF validée)
- Si `is_direct_aef = true` → `justification_dg` obligatoire (min 10 caractères)
- AEF directe réservée aux rôles DG/ADMIN

#### Transitions de statut

```
brouillon → soumis → valide → a_imputer → impute
                  → rejete
                  → differe → soumis
```

### 4.3 Imputation

#### Règles

- **Unicité** : 1 Note AEF = max 1 imputation active
- **Disponibilité** : vérification budget avant imputation
- **Forçage** : possible avec justification si dépassement
- **Liaison** : création automatique ligne budgétaire si inexistante

### 4.4 Exercice

#### Statuts exercice

- `preparation` : en préparation, écriture possible
- `ouvert` : exercice courant, écriture possible
- `en_cours` : exécution en cours, écriture possible
- `cloture` : clôturé, lecture seule

#### Règles

- Filtre global via ExerciceContext
- Toutes les entités filtrées par exercice actif
- Bannière "Lecture seule" si exercice clôturé

### 4.5 Génération de Codes

#### Format ARTI

```
ARTI{ETAPE}{MM}{YY}{NNNN}
```

- `ETAPE` : 1=SEF, 2=AEF, 3=Imputation, 4=Engagement...
- `MM` : Mois (01-12)
- `YY` : Année (2 chiffres)
- `NNNN` : Séquence (0001-9999)

#### Règles

- Séquences atomiques gérées par triggers DB
- Codes verrouillés après validation (code_locked = true)
- Unicité garantie par contraintes DB

---

## 5. Edge Functions

| Fonction                  | Chemin                                       | Description                      |
| ------------------------- | -------------------------------------------- | -------------------------------- |
| `create-user`             | `supabase/functions/create-user`             | Création utilisateur avec profil |
| `generate-export`         | `supabase/functions/generate-export`         | Export PDF/Excel des données     |
| `send-notification-email` | `supabase/functions/send-notification-email` | Envoi emails de notification     |
| `r2-storage`              | `supabase/functions/r2-storage`              | Proxy vers Cloudflare R2 Storage |

---

## 6. GARDE-FOUS - RÈGLES IMPÉRATIVES

### 6.1 Routes

| ❌ INTERDIT                  | ✅ AUTORISÉ                       |
| ---------------------------- | --------------------------------- |
| Renommer une route existante | Ajouter une nouvelle route        |
| Supprimer une route          | Désactiver via feature flag       |
| Changer la structure d'URL   | Ajouter des paramètres optionnels |

### 6.2 Tables de Données

| ❌ INTERDIT                   | ✅ AUTORISÉ                      |
| ----------------------------- | -------------------------------- |
| Supprimer une colonne         | Ajouter une colonne (ADD COLUMN) |
| Renommer une colonne          | Ajouter une table (CREATE TABLE) |
| Changer le type d'une colonne | Ajouter un index                 |
| DROP TABLE sans backup        | Ajouter une contrainte CHECK     |

### 6.3 Migrations SQL

```sql
-- ✅ BONNES PRATIQUES
CREATE TABLE IF NOT EXISTS ...
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
CREATE INDEX IF NOT EXISTS ...

-- ❌ À ÉVITER
DROP TABLE ...
DROP COLUMN ...
ALTER COLUMN ... TYPE ...
```

### 6.4 Hooks et API

| ❌ INTERDIT                         | ✅ AUTORISÉ                             |
| ----------------------------------- | --------------------------------------- |
| Supprimer une fonction exposée      | Ajouter une nouvelle fonction           |
| Changer la signature d'une mutation | Ajouter des paramètres optionnels       |
| Modifier le type de retour          | Enrichir le retour (ajouter des champs) |

### 6.5 Composants React

| ❌ INTERDIT                        | ✅ AUTORISÉ                    |
| ---------------------------------- | ------------------------------ |
| Supprimer des props obligatoires   | Ajouter des props optionnelles |
| Changer le comportement par défaut | Ajouter des variantes          |
| Renommer les exports               | Créer de nouveaux composants   |

### 6.6 Processus de Modification

1. **Documenter** : Mettre à jour ce fichier avant toute modification structurelle
2. **Tester** : Exécuter les checklists de test (TEST_NOTES_SEF.md, TEST_NOTES_AEF.md)
3. **Valider** : Vérifier que l'application compile sans erreur
4. **Déployer** : Tester en preview avant production

---

## Annexes

### A. Fichiers de Validation

- `src/lib/validations/notesSchemas.ts` - Schémas Zod SEF/AEF
- `src/lib/errors/messages.ts` - Messages d'erreur centralisés (FR)

### B. Documentation de Test

- `docs/TEST_NOTES_SEF.md` - Checklist tests Notes SEF
- `docs/TEST_NOTES_AEF.md` - Checklist tests Notes AEF
- `docs/TEST_FLUX_COMPLET.md` - Checklist flux complet

### C. Documentation Technique

- `docs/ARCHITECTURE_SYGFP.md` - Architecture générale
- `docs/DATABASE_GUIDE.md` - Guide base de données
- `docs/SECURITY_GUIDE.md` - Guide sécurité
- `docs/DEVELOPER_GUIDE.md` - Guide développeur
