# AUDIT COMPLET - Module Structure Budgetaire

**Date :** 10 fevrier 2026
**Module :** Structure Budgetaire (`/planification/structure`)
**Projet :** SYGFP - ARTI Cote d'Ivoire
**Statut :** Audit en lecture seule (aucune modification)

---

## 1. CARTOGRAPHIE DES FICHIERS

### 1.1 Page principale

| Fichier                                           | Lignes | Description                                                              |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| `src/pages/planification/StructureBudgetaire.tsx` | 527    | Page principale avec onglets, KPIs, tableau/arbre, filtres, CRUD, export |

**Route :** `src/App.tsx` ligne 285 → `<StructureBudgetaire />` (lazy-loaded ligne 97)

### 1.2 Composants (28 fichiers)

| Fichier                                                    | Lignes | Description                              |
| ---------------------------------------------------------- | ------ | ---------------------------------------- |
| `src/components/budget/BudgetLineTable.tsx`                | 380    | Tableau principal des lignes budgetaires |
| `src/components/budget/BudgetTreeView.tsx`                 | 409    | Vue hierarchique (arbre)                 |
| `src/components/budget/BudgetLineForm.tsx`                 | 448    | Formulaire creation/edition              |
| `src/components/budget/BudgetFilters.tsx`                  | 438    | Filtres multi-criteres                   |
| `src/components/budget/BudgetLineHistory.tsx`              | 129    | Historique version (modal)               |
| `src/components/budget/BudgetLineVersionHistoryDialog.tsx` | 414    | Historique detaille avec diff            |
| `src/components/budget/BudgetVersionHistory.tsx`           | 194    | Timeline des versions                    |
| `src/components/budget/BudgetFormulas.tsx`                 | 175    | Affichage formules de calcul             |
| `src/components/budget/BudgetImport.tsx`                   | 283    | Import simple                            |
| `src/components/budget/BudgetImportAdvanced.tsx`           | 841    | Import avance avec validation            |
| `src/components/budget/ImportExcelWizard.tsx`              | 1179   | Wizard import Excel multi-etapes         |
| `src/components/budget/BudgetImportHistory.tsx`            | 316    | Historique des imports                   |
| `src/components/budget/BudgetMovementHistory.tsx`          | 115    | Mouvements recents                       |
| `src/components/budget/BudgetMovementHistoryDialog.tsx`    | 270    | Detail mouvements (modal)                |
| `src/components/budget/BudgetMovementJournal.tsx`          | 535    | Journal complet des mouvements           |
| `src/components/budget/BudgetValidation.tsx`               | 276    | Workflow validation                      |
| `src/components/budget/BudgetLineEditDialog.tsx`           | 521    | Edition avec diff                        |
| `src/components/budget/CreditTransferForm.tsx`             | 209    | Formulaire virements                     |
| `src/components/budget/CreditTransferList.tsx`             | 151    | Liste des virements                      |
| `src/components/budget/ReamenagementForm.tsx`              | 499    | Formulaire reamenagement                 |
| `src/components/budget/ReamenagementsList.tsx`             | 490    | Liste reamenagements                     |
| `src/components/budget/BudgetLabelEditor.tsx`              | 471    | Edition libelles nomenclature            |
| `src/components/budget/EditLibelleDialog.tsx`              | 151    | Edition libelle simple                   |
| `src/components/budget/BudgetLabelHistory.tsx`             | 516    | Historique libelles                      |
| `src/components/budget/BudgetTemplateDownload.tsx`         | 237    | Template import                          |
| `src/components/budget/ImputationWarning.tsx`              | 304    | Alerte depassement budget                |
| `src/components/budget/SYSCOTypeahead.tsx`                 | 129    | Autocomplete SYSCO                       |
| `src/components/budget/TopOSWidget.tsx`                    | 136    | Widget top OS par budget                 |

### 1.3 Hooks (11 fichiers)

| Fichier                                   | Lignes | Description                            |
| ----------------------------------------- | ------ | -------------------------------------- |
| `src/hooks/useBudgetLines.ts`             | 545    | CRUD lignes + filtres + workflow       |
| `src/hooks/useBudgetImport.ts`            | 687    | Import fichier avec validation         |
| `src/hooks/useBudgetMovements.ts`         | 367    | Mouvements et disponibilite temps reel |
| `src/hooks/useBudgetAvailability.ts`      | 386    | Calcul disponibilite                   |
| `src/hooks/useBudgetLineVersions.ts`      | 467    | Versioning et restauration             |
| `src/hooks/useBudgetNotifications.ts`     | 626    | Notifications budgetaires              |
| `src/hooks/useBudgetAlerts.ts`            | 222    | Alertes seuils                         |
| `src/hooks/useBudgetTransfers.ts`         | 454    | Virements de credits                   |
| `src/hooks/useBudgetLabelEditor.ts`       | 399    | Edition libelles                       |
| `src/hooks/useReamenagementBudgetaire.ts` | 430    | Reamenagements                         |
| `src/hooks/useExportBudgetChain.ts`       | 537    | Export CSV/Excel/PDF                   |

### 1.4 Utilitaires

| Fichier                              | Lignes | Description                     |
| ------------------------------------ | ------ | ------------------------------- |
| `src/lib/budget/imputation-utils.ts` | 324    | Calcul disponibilite imputation |
| `src/lib/export/export-service.ts`   | 602    | Service export multi-format     |
| `src/lib/export/export-templates.ts` | 382    | Templates export                |
| `src/lib/export/export-branding.ts`  | 381    | Branding ARTI sur exports       |

### 1.5 Pages liees (11 fichiers)

| Fichier                                                | Lignes | Description                 |
| ------------------------------------------------------ | ------ | --------------------------- |
| `src/pages/planification/PlanificationBudgetaire.tsx`  | 595    | Plan de travail budgetaire  |
| `src/pages/planification/Virements.tsx`                | 1776   | Virements de credits        |
| `src/pages/execution/ImputationPage.tsx`               | 623    | Imputation budgetaire       |
| `src/pages/budget/ReamenementsImputations.tsx`         | 289    | Reamenagements              |
| `src/pages/planification/NotificationsBudgetaires.tsx` | 560    | Dashboard alertes           |
| `src/pages/AlertesBudgetaires.tsx`                     | 421    | Page alertes                |
| `src/pages/programmatique/ListeBudget.tsx`             | 708    | Liste budget programmatique |
| `src/pages/programmatique/ChargerBudget.tsx`           | 846    | Chargement budget           |
| `src/pages/programmatique/MiseAJourBudget.tsx`         | 617    | Mise a jour                 |
| `src/pages/admin/GestionLibellesBudget.tsx`            | 666    | Admin libelles              |
| `src/pages/admin/ImportBudgetAdmin.tsx`                | 120    | Admin import                |

### 1.6 Resume quantitatif

| Categorie       | Fichiers | Lignes de code |
| --------------- | -------- | -------------- |
| Page principale | 1        | 527            |
| Composants      | 28       | 8,448          |
| Hooks           | 11       | 5,120          |
| Utilitaires     | 4        | 1,689          |
| Pages liees     | 11       | 7,221          |
| **TOTAL**       | **55**   | **~23,005**    |

---

## 2. SCHEMA DE LA BASE DE DONNEES

### 2.1 Table principale : `budget_lines`

| Colonne                 | Type           | Description                    | FK                             |
| ----------------------- | -------------- | ------------------------------ | ------------------------------ |
| `id`                    | UUID           | Cle primaire                   | -                              |
| `code`                  | TEXT           | Code unique                    | -                              |
| `label`                 | TEXT           | Libelle                        | -                              |
| `level`                 | TEXT           | Niveau hierarchique            | -                              |
| `exercice`              | INTEGER        | Annee                          | -                              |
| `dotation_initiale`     | NUMERIC        | Dotation initiale              | -                              |
| `dotation_modifiee`     | NUMERIC        | Dotation apres virements       | -                              |
| `total_engage`          | NUMERIC        | Total engage                   | -                              |
| `total_liquide`         | NUMERIC        | Total liquide                  | -                              |
| `total_ordonnance`      | NUMERIC        | Total ordonnance               | -                              |
| `total_paye`            | NUMERIC        | Total paye                     | -                              |
| `disponible_calcule`    | NUMERIC        | Disponible stocke              | -                              |
| `montant_reserve`       | NUMERIC        | Reserve par imputations        | -                              |
| `direction_id`          | UUID           | Direction                      | → `directions(id)`             |
| `os_id`                 | UUID           | Objectif strategique           | → `objectifs_strategiques(id)` |
| `mission_id`            | UUID           | Mission                        | → `missions(id)`               |
| `action_id`             | UUID           | Action                         | → `actions(id)`                |
| `activite_id`           | UUID           | Activite                       | → `activites(id)`              |
| `sous_activite_id`      | UUID           | Sous-activite                  | → `sous_activites(id)`         |
| `nbe_id`                | UUID           | Nomenclature NBE               | → `nomenclature_nbe(id)`       |
| `nve_id`                | UUID           | Reference NVE                  | → `ref_nve(id)`                |
| `sysco_id`              | UUID           | Plan comptable SYSCO           | → `plan_comptable_sysco(id)`   |
| `source_financement`    | TEXT           | Source financement             | -                              |
| `statut`                | TEXT           | brouillon/soumis/valide/rejete | -                              |
| `statut_execution`      | TEXT           | Statut execution               | -                              |
| `type_ligne`            | TEXT           | recette/depense                | -                              |
| `is_active`             | BOOLEAN        | Actif (soft delete)            | -                              |
| `version`               | INTEGER        | Numero version                 | -                              |
| `budget_version_id`     | UUID           | Version budget                 | → `budget_versions(id)`        |
| `budget_import_id`      | UUID           | Import source                  | → `budget_imports(id)`         |
| `parent_id`             | UUID           | Parent hierarchique            | → `budget_lines(id)`           |
| `code_budgetaire`       | TEXT           | Code budgetaire V1             | -                              |
| `code_budgetaire_v2`    | TEXT           | Code budgetaire V2             | -                              |
| `submitted_by/at`       | UUID/TIMESTAMP | Soumission                     | → `profiles(id)`               |
| `validated_by/at`       | UUID/TIMESTAMP | Validation                     | → `profiles(id)`               |
| `locked_by/at`          | UUID/TIMESTAMP | Verrouillage                   | → `auth.users(id)`             |
| `rejection_reason`      | TEXT           | Motif rejet                    | -                              |
| `created_at/updated_at` | TIMESTAMP      | Horodatage                     | -                              |

**Index :** exercice, direction, statut, is_active, direction+os

### 2.2 Tables de reference programmatique

| Table                    | Colonnes cles                        | Relations                 |
| ------------------------ | ------------------------------------ | ------------------------- |
| `objectifs_strategiques` | id, code, libelle, est_actif         | ← `actions.os_id`         |
| `missions`               | id, code, libelle, est_active        | ← `actions.mission_id`    |
| `actions`                | id, code, libelle, os_id, mission_id | UNIQUE(code, os_id)       |
| `activites`              | id, code, libelle, action_id         | UNIQUE(code, action_id)   |
| `sous_activites`         | id, code, libelle, activite_id       | UNIQUE(code, activite_id) |
| `nomenclature_nbe`       | id, code, libelle                    | Classification depense    |
| `ref_nve`                | id, code_nve, libelle                | Nomenclature variante     |
| `plan_comptable_sysco`   | id, code, label                      | Plan comptable            |

**Hierarchie :** OS → Mission → Action → Activite → Sous-activite → Ligne budgetaire

### 2.3 Tables de gestion

| Table                   | Colonnes cles                                               | Description           |
| ----------------------- | ----------------------------------------------------------- | --------------------- |
| `exercices_budgetaires` | annee (UNIQUE), statut, est_actif, budget_total             | Gestion des exercices |
| `budget_versions`       | exercice+version (UNIQUE), total_dotation, status           | Versions du budget    |
| `budget_imports`        | exercice, file_name, total/success/error_rows, status       | Suivi imports         |
| `budget_line_versions`  | budget_line_id+version_number, snapshot, old/new_values     | Historique complet    |
| `budget_movements`      | budget_line_id, type_mouvement, montant, sens, before/after | Journal mouvements    |
| `credit_transfers`      | from_budget_line_id, to_budget_line_id, montant, status     | Virements             |

### 2.4 Vues SQL

| Vue                              | Description                   | Calcul                                 |
| -------------------------------- | ----------------------------- | -------------------------------------- |
| `v_budget_disponibilite`         | Disponibilite temps reel      | `dotation_actuelle - engage - reserve` |
| `v_budget_disponibilite_complet` | Disponibilite detaillee       | + virements entrants/sortants          |
| `v_top_os_imputations`           | Top OS par imputation         | Aggregation imputations actives        |
| `v_top_directions_imputations`   | Top directions par imputation | Aggregation par direction              |

### 2.5 Fonctions SQL

| Fonction                                   | Type    | Description                     |
| ------------------------------------------ | ------- | ------------------------------- |
| `fn_reserve_budget_on_imputation()`        | TRIGGER | Reserve budget a l'imputation   |
| `fn_release_budget_on_imputation_cancel()` | TRIGGER | Libere budget a l'annulation    |
| `create_budget_line_version()`             | RPC     | Cree un snapshot version        |
| `restore_budget_line_version()`            | RPC     | Restaure une version            |
| `deactivate_budget_line()`                 | RPC     | Desactivation (soft delete)     |
| `reactivate_budget_line()`                 | RPC     | Reactivation                    |
| `check_exercice_writable()`                | RPC     | Verifie si exercice ouvert      |
| `get_exercice_budget_summary()`            | RPC     | Resume budget exercice          |
| `copy_budget_structure()`                  | RPC     | Copie structure entre exercices |
| `validate_budget()`                        | RPC     | Validation budget exercice      |

### 2.6 Triggers

| Trigger                          | Table       | Evenement     | Fonction                    |
| -------------------------------- | ----------- | ------------- | --------------------------- |
| `trg_reserve_budget_imputation`  | imputations | BEFORE INSERT | Reserve budget              |
| `trg_release_budget_imputation`  | imputations | AFTER UPDATE  | Libere reservation          |
| `trg_check_aef_budget_on_submit` | notes_dg    | BEFORE INSERT | Verifie budget AEF          |
| `trg_update_budget_on_reglement` | reglements  | AFTER INSERT  | Met a jour totaux + cloture |

---

## 3. ANALYSE DES CALCULS

### 3.1 Formule de calcul du disponible

```
dotation_actuelle = dotation_initiale + virements_recus - virements_emis
disponible_brut   = dotation_actuelle - total_engage
disponible_net    = disponible_brut - montant_reserve
```

### 3.2 Origine des colonnes financieres

| Colonne              | Stockee en DB | Calculee frontend | Calculee SQL | Mise a jour par                |
| -------------------- | :-----------: | :---------------: | :----------: | ------------------------------ |
| `dotation_initiale`  |      OUI      |         -         |      -       | Import / Saisie manuelle       |
| `dotation_modifiee`  |      OUI      |         -         |      -       | Execution virement (RPC)       |
| `total_engage`       |      OUI      |         -         |      -       | Trigger engagement             |
| `total_liquide`      |      OUI      |         -         |      -       | Trigger liquidation            |
| `total_ordonnance`   |      OUI      |         -         |      -       | Trigger ordonnancement         |
| `total_paye`         |      OUI      |         -         |      -       | Trigger reglement              |
| `disponible_calcule` |      OUI      |         -         |      -       | Initialise = dotation_initiale |
| `montant_reserve`    |      OUI      |         -         |      -       | Trigger imputation             |
| `dotation_actuelle`  |      NON      |        OUI        |  OUI (vue)   | Calcul temps reel              |
| `disponible_net`     |      NON      |        OUI        |  OUI (vue)   | Calcul temps reel              |

### 3.3 Constat critique

**Les colonnes `total_engage`, `total_liquide`, `total_ordonnance`, `total_paye` sont toutes a ZERO pour les 277 lignes budgetaires.**

```
Echantillon des 5 plus grosses dotations :
| dotation_initiale | total_engage | total_liquide | total_paye | disponible_calcule |
|------------------:|:------------:|:-------------:|:----------:|-------------------:|
|       908,209,443 |       0      |       0       |      0     |        908,209,443 |
|       850,000,000 |       0      |       0       |      0     |        850,000,000 |
|       500,000,000 |       0      |       0       |      0     |        500,000,000 |
|       500,000,000 |       0      |       0       |      0     |        500,000,000 |
|       250,000,000 |       0      |       0       |      0     |        250,000,000 |
```

**Interpretation :** Les lignes budgetaires ont ete importees avec les dotations initiales, mais le systeme d'execution (engagement → liquidation → ordonnancement → reglement) n'est pas encore connecte pour mettre a jour ces colonnes automatiquement. Les engagements existent dans la table `engagements` mais ne remontent PAS dans `budget_lines.total_engage`.

---

## 4. PROBLEME DIRECTIONS (16 actives vs 25 totales)

### 4.1 Etat de la table `directions`

| Categorie                                   | Nombre |
| ------------------------------------------- | ------ |
| Total directions                            | 25     |
| Directions actives (`est_active = true`)    | 16     |
| Directions inactives (`est_active = false`) | 9      |

### 4.2 Directions actives (affichees dans l'UI)

| Code    | Libelle                                                                                        |
| ------- | ---------------------------------------------------------------------------------------------- |
| AICB    | Auditeur Interne / Controleur Budgetaire                                                       |
| CB      | Controleur Budgetaire                                                                          |
| CM      | Charge de Mission du Directeur General                                                         |
| DAAF    | Direction des Affaires Administratives et Financieres                                          |
| DCP     | Direction de la Communication et du Partenariat                                                |
| DCSTI   | Direction du Controle et de Surveillance du Transport Interieur                                |
| DCZ     | Direction Centrale des Zones                                                                   |
| DG      | Direction Generale                                                                             |
| DGPECRP | Direction de la Gestion Previsionnelle de l'Emploi, des Competences et des Relations Publiques |
| DP      | Direction du Patrimoine                                                                        |
| DQ      | Direction de la Qualite                                                                        |
| DRRN    | Direction des Recours, de la Reglementation et des Normes                                      |
| DSESP   | Direction des Statistiques, des Etudes, de la Strategie et de la Prospective                   |
| DSI     | Direction des Systemes d'Information                                                           |
| PCR     | Presidence du Conseil de Regulation                                                            |
| SDMG    | Service des Moyens Generaux                                                                    |

### 4.3 Directions inactives (legacy)

| Code | Libelle                                                                      | Doublon de              |
| ---- | ---------------------------------------------------------------------------- | ----------------------- |
| 01   | Direction Generale de l'ARTI                                                 | DG                      |
| 02   | Direction des Affaires Administratives et financieres                        | DAAF                    |
| 04   | Direction des Statistiques, des Etudes, de la Strategie et de la Prospective | DSESP                   |
| 05   | Direction de la Gestion Previsionnelle de l'Emploi                           | DGPECRP                 |
| 06   | Directeur du Controle et de la Surveillance du Transport Interieur           | DCSTI                   |
| 07   | Direction des Recours, de la Reglementation et des Normes                    | DRRN                    |
| 09   | Directeur des Systemes d'Information par Interim                             | DSI                     |
| 11   | AGENT                                                                        | (pas de correspondance) |
| 16   | Autres Services                                                              | (pas de correspondance) |

### 4.4 PROBLEME CRITIQUE : Lignes budgetaires liees aux mauvaises directions

Sur 277 lignes budgetaires actives (exercice 2026) :

| Direction budget_lines            | Code | Statut direction | Nb lignes |
| --------------------------------- | ---- | :--------------: | :-------: |
| Direction Affaires Admin.         | 02   |   **INACTIVE**   |    ~29    |
| Direction Statistiques            | 04   |   **INACTIVE**   |    ~6     |
| Direction Controle Surveillance   | 06   |   **INACTIVE**   |    ~6     |
| Direction Recours/Normes          | 07   |   **INACTIVE**   |    ~4     |
| Direction Systemes Info (Interim) | 09   |   **INACTIVE**   |    ~6     |
| Direction Generale                | 01   |   **INACTIVE**   |    ~5     |
| Direction Gestion Previsionnelle  | 05   |   **INACTIVE**   |    ~4     |
| Direction Communication           | DCP  |      Active      |    ~5     |
| Direction Centrale Zones          | DCZ  |      Active      |    ~4     |
| Direction Qualite                 | DQ   |      Active      |    ~4     |
| **AUCUNE DIRECTION**              | NULL |        -         | **~204**  |
| **Total**                         |      |                  |  **277**  |

**Constats :**

1. **204 lignes (74%) n'ont AUCUNE direction** (`direction_id = NULL`)
2. **60 lignes (22%) sont liees a des directions INACTIVES** (codes numeriques legacy)
3. **Seulement 13 lignes (4%) sont liees a des directions actives** (DCP, DCZ, DQ)
4. **13 des 16 directions actives n'ont AUCUNE ligne budgetaire** (DAAF, DG, DSI, etc.)

---

## 5. DONNEES LIVE DE L'EXERCICE 2026

| Metrique                     | Valeur                  |
| ---------------------------- | ----------------------- |
| Exercice actif               | 2026 (statut: `ouvert`) |
| Budget total                 | **11,394,200,019 FCFA** |
| Nombre de lignes budgetaires | 277                     |
| Objectifs strategiques       | 5                       |
| Missions                     | 5                       |
| Budget versions              | 0 (table vide)          |
| Lignes avec engage > 0       | 0                       |
| Lignes avec liquide > 0      | 0                       |
| Lignes avec paye > 0         | 0                       |

---

## 6. PROBLEMES DETECTES

### CRITIQUE

| #   | Probleme                                       | Impact                                                                                                                                    |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **204 lignes sans direction (74%)**            | Impossible de filtrer par direction, reporting fausse                                                                                     |
| P2  | **60 lignes liees a des directions inactives** | Le filtre direction dans l'UI ne les montre pas                                                                                           |
| P3  | **Colonnes execution toutes a zero**           | `total_engage`, `total_liquide`, `total_paye` = 0 partout. Les engagements de la table `engagements` ne remontent pas dans `budget_lines` |
| P4  | **Table budget_versions vide**                 | Aucun versioning du budget utilise                                                                                                        |

### IMPORTANT

| #   | Probleme                                                                                      | Impact                                                                       |
| --- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| P5  | **Directions doublons** (legacy code numerique vs nouveau code acronyme)                      | 7 paires de doublons, risque d'incoherence                                   |
| P6  | **`disponible_calcule` = `dotation_initiale`** partout                                        | Le disponible n'est jamais recalcule puisque engage = 0                      |
| P7  | **Pas de trigger automatique** pour mettre a jour `total_engage` quand un engagement est cree | Le lien engagement → budget_line existe mais les totaux ne sont pas propages |

### MINEUR

| #   | Probleme                                              | Impact                                   |
| --- | ----------------------------------------------------- | ---------------------------------------- |
| P8  | Exercice 2025 avec 0 lignes et budget_total = 0       | Donnee orpheline                         |
| P9  | 2 systemes de code budgetaire (V1 et V2) en parallele | Complexite inutile si migration terminee |

---

## 7. SCHEMA RELATIONNEL

```
exercices_budgetaires
         │
         ▼ (exercice)
    budget_lines ◄── budget_versions
         │              budget_imports
         │              budget_line_versions (historique)
         │              budget_movements (journal)
         │
         ├── direction_id ──► directions (25 dont 16 actives)
         ├── os_id ──────────► objectifs_strategiques (5)
         ├── mission_id ─────► missions (5)
         ├── action_id ──────► actions (OS + Mission)
         ├── activite_id ────► activites (Action)
         ├── sous_activite_id► sous_activites (Activite)
         ├── nbe_id ─────────► nomenclature_nbe
         ├── sysco_id ───────► plan_comptable_sysco
         ├── nve_id ─────────► ref_nve
         └── parent_id ──────► budget_lines (auto-reference)
```

---

## 8. RECOMMANDATIONS

| Priorite | Action                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------ |
| **P0**   | Migrer les 60 lignes des directions inactives (01→DG, 02→DAAF, etc.) vers les directions actives       |
| **P0**   | Affecter une direction aux 204 lignes avec `direction_id = NULL`                                       |
| **P1**   | Creer un trigger ou RPC pour propager `engagements.montant` → `budget_lines.total_engage`              |
| **P1**   | Idem pour liquidation → `total_liquide`, ordonnancement → `total_ordonnance`, reglement → `total_paye` |
| **P2**   | Supprimer ou fusionner les 9 directions inactives avec les actives                                     |
| **P2**   | Initialiser `budget_versions` pour tracer l'evolution du budget                                        |
| **P3**   | Recalculer `disponible_calcule` pour toutes les lignes via un batch SQL                                |

---

_Rapport genere automatiquement par Claude Code - Audit en lecture seule_
