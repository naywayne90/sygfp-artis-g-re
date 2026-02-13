# Audit Complet - Module Imputation (SYGFP)

**Date** : 13 fevrier 2026
**Version** : 1.0
**Auditeur** : Claude Code (Prompt 1 - Audit)
**Organisation** : ARTI -- Autorite de Regulation du Transport Interieur (Cote d'Ivoire)
**Systeme** : SYGFP -- Systeme de Gestion Financiere et de Planification
**Module** : Imputation Budgetaire (Etape 3 de la chaine de depense)

---

## 1. Score Global

| Critere          | Score      | Details                                                                                                                       |
| ---------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Frontend Complet | **18/25**  | 17 fichiers, ~6,500 LOC, architecture modulaire, mais absence de tests unitaires/E2E, quelques `any`                          |
| Backend Securise | **12/25**  | Table riche (35+ colonnes), RLS existante MAIS conflits policies, functions RBAC inexistantes, CHECK constraint desynchronise |
| Performance      | **14/20**  | 6 index existants, React Query, mais pas de RPC count, pas de pagination server-side sur listing imputations                  |
| Workflow         | **10/15**  | 5 statuts implementes, dialogs rejet/report, MAIS pas de trigger server-side d'enforcement des transitions                    |
| Tests & QA       | **4/15**   | Build `tsc` passe (0 erreurs), imputation-utils teste (~80%), mais 0 test E2E, 0 test composant                               |
| **TOTAL**        | **58/100** | **Module partiellement fonctionnel -- 7 gaps critiques a corriger avant production**                                          |

---

## 2. Cartographie Complete des Fichiers

### 2.1 Pages (2 fichiers)

| Fichier                       | Chemin                                         | Lignes | Description                                                                                   |
| ----------------------------- | ---------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `ImputationPage.tsx`          | `src/pages/execution/ImputationPage.tsx`       | 623    | Page principale avec onglets par statut (A imputer, A valider, Validees, Differees, Rejetees) |
| `ReamenementsImputations.tsx` | `src/pages/budget/ReamenementsImputations.tsx` | 289    | Reamenagements budgetaires par code imputation                                                |

### 2.2 Composants (10 fichiers)

| Fichier                        | Chemin                                                   | Lignes | Description                                                             |
| ------------------------------ | -------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| `ImputationForm.tsx`           | `src/components/imputation/ImputationForm.tsx`           | 664    | Formulaire creation avec selection OS/Mission/Action/Activite/NBE/SYSCO |
| `BudgetLineSelector.tsx`       | `src/components/imputation/BudgetLineSelector.tsx`       | 854    | Selecteur ligne budgetaire avec recherche                               |
| `DossierImputationSummary.tsx` | `src/components/imputation/DossierImputationSummary.tsx` | 351    | Resume imputation dans contexte dossier                                 |
| `ImputationCodeDisplay.tsx`    | `src/components/imputation/ImputationCodeDisplay.tsx`    | 327    | Affichage code imputation avec segments colores                         |
| `ImputationSummaryCard.tsx`    | `src/components/imputation/ImputationSummaryCard.tsx`    | 304    | Carte resume synthetique                                                |
| `ImputationDetails.tsx`        | `src/components/imputation/ImputationDetails.tsx`        | 269    | Vue detaillee avec actions contextuelles                                |
| `ImputationList.tsx`           | `src/components/imputation/ImputationList.tsx`           | 187    | Tableau liste des imputations                                           |
| `ImputationDeferDialog.tsx`    | `src/components/imputation/ImputationDeferDialog.tsx`    | 112    | Dialog de report avec motif et date                                     |
| `ImputationRejectDialog.tsx`   | `src/components/imputation/ImputationRejectDialog.tsx`   | 97     | Dialog de rejet avec motif obligatoire                                  |
| `index.ts`                     | `src/components/imputation/index.ts`                     | 24     | Barrel export du module                                                 |

### 2.3 Hooks (3 fichiers)

| Fichier                      | Chemin                                 | Lignes | Description                                                                |
| ---------------------------- | -------------------------------------- | ------ | -------------------------------------------------------------------------- |
| `useImputation.ts`           | `src/hooks/useImputation.ts`           | 808    | Hook principal : fetch notes a imputer, calcul budget, creation imputation |
| `useImputations.ts`          | `src/hooks/useImputations.ts`          | 345    | Hook liste : CRUD imputations (submit, validate, reject, defer, delete)    |
| `useImputationValidation.ts` | `src/hooks/useImputationValidation.ts` | 302    | Hook validation : verification budget, warnings, calcul disponible         |

### 2.4 Composants Connexes (2 fichiers)

| Fichier                   | Chemin                                             | Lignes | Description                             |
| ------------------------- | -------------------------------------------------- | ------ | --------------------------------------- |
| `ImputationDGSection.tsx` | `src/components/notes-sef/ImputationDGSection.tsx` | ~300   | Section imputation DG dans Notes SEF    |
| `ImputationWarning.tsx`   | `src/components/budget/ImputationWarning.tsx`      | ~80    | Composant alerte imputation non trouvee |

### 2.5 Utilitaires et Tests (2 fichiers)

| Fichier                    | Chemin                                              | Lignes | Description                                 |
| -------------------------- | --------------------------------------------------- | ------ | ------------------------------------------- |
| `imputation-utils.ts`      | `src/lib/budget/imputation-utils.ts`                | 324    | Split, format, parse, build code imputation |
| `imputation-utils.test.ts` | `src/lib/budget/__tests__/imputation-utils.test.ts` | ~200   | Tests unitaires utilitaires (~80% coverage) |

### 2.6 Resume Metriques

| Metrique                 | Valeur                                                                    |
| ------------------------ | ------------------------------------------------------------------------- |
| **Total fichiers**       | 19                                                                        |
| **Total lignes de code** | ~6,850                                                                    |
| **Pages**                | 2                                                                         |
| **Composants**           | 12 (10 module + 2 connexes)                                               |
| **Hooks**                | 3                                                                         |
| **Utilitaires**          | 1 (+1 test)                                                               |
| **Routes**               | 2                                                                         |
| **Tables Supabase**      | 4 (imputations, imputation_lignes, note_imputations, note_dg_imputations) |

---

## 3. Architecture du Module

```
ImputationPage (Page principale)
+-- Tabs: [A imputer | A valider | Validees | Differees | Rejetees]
|   +-- A imputer
|   |   +-- Notes AEF (source) -> ImputationForm
|   |       +-- useImputation.imputeNote()
|   |           +-- Calcul budgetaire
|   |           +-- Creation dossier
|   |           +-- Creation budget_movement (reservation)
|   |           +-- Creation imputation + update notes_dg
|   |
|   +-- A valider / Validees / Differees / Rejetees
|       +-- ImputationList (tableau)
|           +-- useImputations({ search, statut })
|           +-- Actions: view, submit, validate, reject, defer, delete
|
+-- ImputationDetails (Vue detaillee)
|   +-- Header : numero, objet, statut
|   +-- Budget info (code_imputation, montant, direction)
|   +-- Actions contextuelles (statut-dependant)
|
+-- Dialogs
    +-- ImputationForm (creation depuis AEF)
    +-- ImputationRejectDialog (rejet + motif)
    +-- ImputationDeferDialog (report + motif + date)

Composants supports:
+-- ImputationCodeDisplay (affichage structure code)
+-- ImputationSummaryCard (resume synthetique)
+-- BudgetLineSelector (selection ligne budgetaire)
+-- DossierImputationSummary (contexte dossier)

Validation & Utilitaires:
+-- useImputationValidation (verifier vs budget)
+-- imputation-utils (split, format, parse, build)
+-- ImputationWarning (composant alerte)
```

---

## 4. Schema Base de Donnees

### 4.1 Table `imputations` (35+ colonnes)

| Colonne                   | Type          | Nullable | Default           | FK                         | Description                        |
| ------------------------- | ------------- | -------- | ----------------- | -------------------------- | ---------------------------------- |
| id                        | UUID          | NOT NULL | gen_random_uuid() | PK                         | Identifiant unique                 |
| note_aef_id               | UUID          | NOT NULL | -                 | notes_dg(id) CASCADE       | Note AEF source (UNIQUE)           |
| budget_line_id            | UUID          | NULL     | -                 | budget_lines(id)           | Ligne budgetaire cible             |
| dossier_id                | UUID          | NULL     | -                 | dossiers(id)               | Dossier de la chaine               |
| objet                     | TEXT          | NOT NULL | -                 | -                          | Objet de l'imputation              |
| montant                   | NUMERIC       | NOT NULL | -                 | -                          | Montant impute                     |
| direction_id              | UUID          | NULL     | -                 | directions(id)             | Direction beneficiaire             |
| os_id                     | UUID          | NULL     | -                 | objectifs_strategiques(id) | Objectif strategique               |
| mission_id                | UUID          | NULL     | -                 | missions(id)               | Mission                            |
| action_id                 | UUID          | NULL     | -                 | actions(id)                | Action                             |
| activite_id               | UUID          | NULL     | -                 | activites(id)              | Activite                           |
| sous_activite_id          | UUID          | NULL     | -                 | sous_activites(id)         | Sous-activite                      |
| nbe_id                    | UUID          | NULL     | -                 | nomenclature_nbe(id)       | Nature budgetaire                  |
| sysco_id                  | UUID          | NULL     | -                 | plan_comptable_sysco(id)   | Plan comptable SYSCO               |
| source_financement        | TEXT          | NULL     | 'budget_etat'     | -                          | Source de financement              |
| code_imputation           | TEXT          | NULL     | -                 | -                          | Code imputation genere             |
| statut                    | TEXT          | NOT NULL | 'active'          | -                          | Statut workflow                    |
| exercice                  | INTEGER       | NOT NULL | -                 | -                          | Annee fiscale (2020-2100)          |
| reference                 | TEXT          | NULL     | -                 | -                          | Reference auto (IMP-2026-DIR-0001) |
| forcer_imputation         | BOOLEAN       | NULL     | false             | -                          | Force si depassement               |
| justification_depassement | TEXT          | NULL     | -                 | -                          | Justification si force             |
| disponible_au_moment      | NUMERIC(18,2) | NULL     | -                 | -                          | Budget dispo au moment             |
| is_multi_ligne            | BOOLEAN       | NULL     | false             | -                          | Ventilation multi-lignes           |
| commentaire               | TEXT          | NULL     | -                 | -                          | Commentaires libres                |
| pieces_jointes            | TEXT[]        | NULL     | -                 | -                          | URLs fichiers                      |
| created_by                | UUID          | NULL     | -                 | profiles(id)               | Createur                           |
| created_at                | TIMESTAMPTZ   | NOT NULL | now()             | -                          | Date creation                      |
| updated_at                | TIMESTAMPTZ   | NOT NULL | now()             | -                          | Date maj                           |
| submitted_at              | TIMESTAMPTZ   | NULL     | -                 | -                          | Date soumission                    |
| submitted_by              | UUID          | NULL     | -                 | profiles(id)               | Soumetteur                         |
| validated_at              | TIMESTAMPTZ   | NULL     | -                 | -                          | Date validation                    |
| validated_by              | UUID          | NULL     | -                 | profiles(id)               | Validateur                         |
| rejected_at               | TIMESTAMPTZ   | NULL     | -                 | -                          | Date rejet                         |
| rejected_by               | UUID          | NULL     | -                 | profiles(id)               | Rejecteur                          |
| motif_rejet               | TEXT          | NULL     | -                 | -                          | Motif du rejet                     |
| differed_at               | TIMESTAMPTZ   | NULL     | -                 | -                          | Date report                        |
| differed_by               | UUID          | NULL     | -                 | profiles(id)               | Auteur report                      |
| motif_differe             | TEXT          | NULL     | -                 | -                          | Motif report                       |
| date_differe              | TIMESTAMPTZ   | NULL     | -                 | -                          | Date reprise                       |

### 4.2 Index Existants (6)

| Index                          | Colonnes                             | Type          |
| ------------------------------ | ------------------------------------ | ------------- |
| idx_imputations_note_aef_id    | note_aef_id                          | BTREE         |
| idx_imputations_budget_line_id | budget_line_id                       | BTREE         |
| idx_imputations_exercice       | exercice                             | BTREE         |
| idx_imputations_statut         | statut                               | BTREE         |
| idx_imputations_direction_id   | direction_id (WHERE statut='active') | BTREE partiel |
| idx_imputations_created_at     | created_at                           | BTREE         |

### 4.3 Tables Associees

| Table                 | Description                              | Lignes    |
| --------------------- | ---------------------------------------- | --------- |
| `imputation_lignes`   | Ventilation multi-lignes (NON utilisee)  | 0         |
| `note_imputations`    | Instructions DG sur Notes SEF (DISTINCT) | ~quelques |
| `note_dg_imputations` | Imputations sur Notes Direction Generale | ~quelques |

### 4.4 Vues Analytiques (3)

| Vue                            | Description                                                                |
| ------------------------------ | -------------------------------------------------------------------------- |
| `v_top_os_imputations`         | Top objectifs strategiques par nb imputations et montant                   |
| `v_top_directions_imputations` | Top directions par nb imputations et montant                               |
| `v_etat_execution_imputation`  | Etat d'execution (budget initial, reamenagements, engagements, disponible) |

### 4.5 Triggers (3)

| Trigger                             | Table       | Description                            |
| ----------------------------------- | ----------- | -------------------------------------- |
| `update_imputations_updated_at`     | imputations | MAJ auto updated_at                    |
| `trg_generate_imputation_reference` | imputations | Generation reference IMP-2026-DIR-0001 |
| `trg_log_validation_imputations`    | imputations | Log validation dans audit_logs         |

### 4.6 Donnees Existantes

```
Total imputations : 1
  - statut 'valide' : 1
  - reference : IMP-2026-DCSTI-0001
  - montant : 200,000 FCFA
  - exercice : 2026
```

---

## 5. RLS Policies -- Etat Actuel

### 5.1 Policies sur `imputations`

**3 migrations creent des policies conflictuelles :**

| Migration        | Policies                    | Pattern                                   | Probleme                         |
| ---------------- | --------------------------- | ----------------------------------------- | -------------------------------- |
| `20260116103921` | SELECT/INSERT/UPDATE/DELETE | `has_role(auth.uid(), 'ROLE'::app_role)`  | Pattern CORRECT                  |
| `20260116184125` | SELECT/INSERT/UPDATE/DELETE | `auth.uid() IS NOT NULL` (trop permissif) | ECRASE les policies precedentes  |
| `20260118200000` | SELECT/INSERT/UPDATE        | `is_admin()`, `is_dg()`, `is_cb()`        | Functions N'EXISTENT PAS en base |

### 5.2 Detail des Policies Active (20260116184125 -- derniere appliquee)

```sql
-- SELECT: Tout authentifie peut lire (TROP permissif)
CREATE POLICY "Lecture imputations authentifies" ON imputations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Tout authentifie peut creer (TROP permissif)
CREATE POLICY "Creation imputations authentifies" ON imputations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Tout authentifie peut modifier (TROP permissif)
CREATE POLICY "Mise a jour imputations" ON imputations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- DELETE: Seul le createur en brouillon (OK mais statut 'brouillon' pas dans CHECK)
CREATE POLICY "Suppression imputations createur" ON imputations
  FOR DELETE USING (auth.uid() = created_by AND statut = 'brouillon');
```

---

## 6. Workflow Imputation

### 6.1 Flux de Donnees

```
1. NOTE AEF (statut: a_imputer)
        |
2. useImputation.imputeNote(ImputationData)
        |
3. +------------------------------------+
   | Validations                         |
   |-------------------------------------|
   | - Exercice ouvert ?                 |
   | - AEF pas deja imputee ?            |
   | - Budget disponible ?               |
   | - Justification si depassement ?    |
   +------------------------------------+
        | OK
4. +------------------------------------+
   | Creations                           |
   |-------------------------------------|
   | - budget_lines (si n'existe pas)    |
   | - dossiers (statut IMPUTE)          |
   | - dossier_etapes                    |
   | - imputations (statut initial)      |
   | - budget_movements (reservation)    |
   | - Update notes_dg (statut impute)   |
   +------------------------------------+
        |
5. IMPUTATION creee
   +-- Editable
   +-- Soumise -> A VALIDER
   +-- Validateur peut valider -> VALIDEE
        |
6. DOSSIER (IMPUTE)
   +-- Peut creer EXPRESSION_BESOIN
   +-- Continue chaine de depense
```

### 6.2 Statuts Frontend vs Backend

| Frontend (hooks) | Backend (CHECK migration) | Ecart                                                        |
| ---------------- | ------------------------- | ------------------------------------------------------------ |
| brouillon        | -                         | **ABSENT du CHECK**                                          |
| a_valider        | -                         | **ABSENT du CHECK**                                          |
| valide           | -                         | **ABSENT du CHECK** (mais 1 record existe avec cette valeur) |
| rejete           | -                         | **ABSENT du CHECK**                                          |
| differe          | -                         | **ABSENT du CHECK**                                          |
| -                | active                    | **ABSENT du frontend**                                       |
| -                | annulee                   | **ABSENT du frontend**                                       |

**Conclusion** : Le CHECK constraint `('active', 'annulee')` de la migration initiale a ete modifie directement via SQL Editor (non trace dans les migrations). Le record existant a `statut='valide'` le confirme.

---

## 7. Dependances avec Autres Modules

```
IMPUTATION (Etape 3)
+----> NOTES AEF (Etape 2 - source)
|     table: notes_dg
|     statut: a_imputer -> impute
|
+----> BUDGET
|     table: budget_lines
|     table: budget_movements (reservation creee)
|     Calcul: dotation - engagements = disponible
|
+----> DOSSIERS (creation)
|     table: dossiers
|     table: dossier_etapes (step imputation)
|
+----> EXPRESSION BESOIN (Etape 4 - suivant)
|     Peut etre creee depuis imputation validee
|
+----> NOTES SEF (Etape 1)
|     ImputationDGSection: instructions d'imputation
|
+----> AUDIT LOG
      Logging de chaque action imputation
```

---

## 8. GAPS Identifies -- 7 Critiques + 5 Moyens

### GAP 1 : CHECK Constraint Desynchronise

|                |                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Severite**   | CRITIQUE                                                                                                                             |
| **Probleme**   | Migration CHECK dit `('active', 'annulee')` mais BD reelle accepte `valide`, `brouillon`, etc. Modification non tracee en migration. |
| **Impact**     | Impossible de rejouer les migrations proprement. Desynchronisation entre code et schema documente.                                   |
| **Fix requis** | Ecrire migration consolidee avec le bon CHECK : `('brouillon', 'a_valider', 'valide', 'rejete', 'differe', 'annulee')`               |

### GAP 2 : Collision RLS Policies

|                |                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Severite**   | CRITIQUE                                                                                                                      |
| **Probleme**   | 3 migrations creent des policies conflictuelles. La derniere (20260116184125) est trop permissive (tout authentifie).         |
| **Impact**     | Tout utilisateur connecte peut creer/modifier des imputations, ignorant le RBAC.                                              |
| **Fix requis** | Consolider en 1 migration avec DROP POLICY + CREATE POLICY utilisant `has_role()`. Restreindre INSERT/UPDATE a ADMIN/DAAF/CB. |

### GAP 3 : Functions RBAC Inexistantes

|                |                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severite**   | CRITIQUE                                                                                                                                     |
| **Probleme**   | Migration 20260118200000 utilise `is_admin()`, `is_dg()`, `is_cb()`, `get_user_direction_id()`, `can_create_in_module()` qui n'existent pas. |
| **Impact**     | Ces policies ne fonctionnent PAS. Erreur runtime si elles sont les seules actives.                                                           |
| **Fix requis** | Reecrire avec `has_role(auth.uid(), 'ROLE'::app_role)` via table `user_roles`.                                                               |

### GAP 4 : Race Condition Reference

|                |                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Severite**   | CRITIQUE                                                                                                                           |
| **Probleme**   | `generate_imputation_reference()` utilise `MAX(SUBSTRING(reference))` sans lock. Deux inserts simultanees generent le meme numero. |
| **Impact**     | Doublons de reference possibles en charge.                                                                                         |
| **Fix requis** | Utiliser sequence PostgreSQL OU `LOCK TABLE ... IN SHARE ROW EXCLUSIVE MODE` OU index UNIQUE sur `(exercice, reference)`.          |

### GAP 5 : Pas de Trigger Workflow Server-Side

|                |                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severite**   | CRITIQUE                                                                                                                                                |
| **Probleme**   | Les transitions de statut sont uniquement controlees cote frontend (hooks). Pas de trigger server-side pour empecher `brouillon -> valide` directement. |
| **Impact**     | Un appel API direct peut court-circuiter le workflow.                                                                                                   |
| **Fix requis** | Creer trigger `enforce_imputation_workflow()` comme fait pour les Notes AEF (migration prompt 6).                                                       |

### GAP 6 : Table `imputation_lignes` Morte-Nee

|                |                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------- |
| **Severite**   | MOYEN                                                                                    |
| **Probleme**   | Table existe en BD, flag `is_multi_ligne` existe, mais aucun code frontend ne l'utilise. |
| **Impact**     | Feature inoperante. La ventilation multi-lignes est impossible.                          |
| **Fix requis** | Implementer dans ImputationForm OU documenter comme v2.                                  |

### GAP 7 : Pas de Tests E2E ni Tests Composants

|                |                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| **Severite**   | CRITIQUE                                                                                                    |
| **Probleme**   | 0 test Playwright, 0 test Vitest sur composants/hooks. Seuls imputation-utils sont testes.                  |
| **Impact**     | Aucune regression detectee automatiquement. Module non certifiable.                                         |
| **Fix requis** | Ecrire 40+ tests E2E (creation, soumission, validation, rejet, report, export). Tests unitaires pour hooks. |

### GAP 8 : Pas de RPC Count (Pattern N+1)

|                |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| **Severite**   | MOYEN                                                                               |
| **Probleme**   | Les compteurs par statut sont calcules en JS apres fetch de toutes les imputations. |
| **Impact**     | Performance degradee avec beaucoup de donnees.                                      |
| **Fix requis** | Creer RPC `count_imputations_by_statut(p_exercice)` comme pour Notes AEF.           |

### GAP 9 : Pas de Pagination Server-Side

|                |                                                                   |
| -------------- | ----------------------------------------------------------------- |
| **Severite**   | MOYEN                                                             |
| **Probleme**   | Le listing des imputations charge tout en memoire cote client.    |
| **Impact**     | Avec des centaines d'imputations, la page sera lente.             |
| **Fix requis** | Implementer RPC `search_imputations` avec pagination server-side. |

### GAP 10 : useImputation.ts Trop Long (808 lignes)

|                |                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------- |
| **Severite**   | MOYEN                                                                                           |
| **Probleme**   | Un seul hook melange : fetch referentiels, calcul budget, creation imputation, gestion code.    |
| **Impact**     | Maintenance difficile, risque de regressions.                                                   |
| **Fix requis** | Scinder en 3 hooks : `useImputationReferentiels`, `useImputationBudget`, `useImputationCreate`. |

### GAP 11 : Quelques `any` TypeScript

|                |                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **Severite**   | MOYEN                                                                                                    |
| **Probleme**   | `// eslint-disable-next-line @typescript-eslint/no-explicit-any` dans ImputationPage (lignes ~91, ~387). |
| **Impact**     | Perte de type safety, bugs potentiels.                                                                   |
| **Fix requis** | Typer strictement `sourceAefNote` et `note`.                                                             |

### GAP 12 : Index Composites Manquants

|                |                                                                                   |
| -------------- | --------------------------------------------------------------------------------- |
| **Severite**   | FAIBLE                                                                            |
| **Probleme**   | Pas d'index composite `(exercice, statut)` ni `(exercice, direction_id, statut)`. |
| **Impact**     | Requetes de dashboard lentes avec volume.                                         |
| **Fix requis** | Ajouter index composites comme fait pour notes_dg (prompt 7).                     |

---

## 9. Migrations Appliquees (9)

| Date       | Fichier                                              | Description                                              | Statut             |
| ---------- | ---------------------------------------------------- | -------------------------------------------------------- | ------------------ |
| 2026-01-16 | `20260116103921_76b20efb...`                         | CREATE TABLE imputations + RLS RBAC correcte             | Appliquee          |
| 2026-01-16 | `20260116184125_3507d353...`                         | ALTER colonnes + reference trigger + RLS trop permissive | Appliquee (ECRASE) |
| 2026-01-16 | `20260116205442_26f2dda4...`                         | Vues analytiques + index                                 | Appliquee          |
| 2026-01-17 | `20260117130551_ad27479f...`                         | ALTER (validated_at, is_multi_ligne) + imputation_lignes | Appliquee          |
| 2026-01-18 | `20260118200000_rls_rbac_socle.sql`                  | RLS RBAC avec functions inexistantes                     | Appliquee (CASSEE) |
| 2026-01-19 | `20260119110000_create_note_imputations.sql`         | Table note_imputations (distincte)                       | Appliquee          |
| 2026-01-19 | `20260119120000_create_notes_direction_generale.sql` | Table note_dg_imputations                                | Appliquee          |
| 2026-01-29 | `20260129162635_workflow_validation.sql`             | ALTER (differe_by, rejected_at, etc.)                    | Appliquee          |
| 2026-02-04 | `20260204_reamenagement_budgetaire.sql`              | Vue v_etat_execution_imputation + RPCs budget            | Appliquee          |

---

## 10. Routes Enregistrees

| Route                                | Composant                 | Roles Autorises |
| ------------------------------------ | ------------------------- | --------------- |
| `/execution/imputation`              | `ImputationPage`          | sdct, daaf, cb  |
| `/budget/reamenagements-imputations` | `ReamenementsImputations` | daaf, cb        |

---

## 11. Verifications Statiques

| Outil                              | Resultat                              |
| ---------------------------------- | ------------------------------------- |
| TypeScript (`tsc --noEmit`)        | 0 erreurs                             |
| ESLint                             | Quelques `any` ignores (non bloquant) |
| Build production (`npm run build`) | Succes                                |
| Tests unitaires (imputation-utils) | Passent (~80% coverage)               |
| Tests composants                   | 0 test                                |
| Tests E2E                          | 0 test                                |

---

## 12. Comparaison avec Module Notes AEF (Certifie 100/100)

| Critere          | Notes AEF                   | Imputation                  | Delta         |
| ---------------- | --------------------------- | --------------------------- | ------------- |
| Score            | 100/100                     | 58/100                      | -42           |
| RLS Policies     | Consolidees, RBAC correct   | 3 migrations conflictuelles | A refaire     |
| Workflow Trigger | Server-side enforcement     | Frontend only               | A ajouter     |
| RPC Count        | `count_notes_aef_by_statut` | Absent (N+1 JS)             | A creer       |
| Pagination       | Server-side 50/page         | Client-side                 | A implementer |
| Index Composites | 4 index optimises           | Index simples               | A ajouter     |
| Tests E2E        | 40 tests Playwright         | 0 test                      | A ecrire      |
| Tests Unitaires  | 275 tests                   | ~20 (utils only)            | A completer   |
| Exports          | Excel + PDF + CSV           | Aucun                       | A implementer |

---

## 13. Plan de Correction Recommande (8 Prompts)

### Prompt 2 : Consolidation Backend (CRITIQUE)

- Ecrire migration consolidee RLS (DROP + CREATE avec `has_role()`)
- Fixer CHECK constraint statut
- Corriger race condition reference (sequence PG)
- Ajouter trigger `enforce_imputation_workflow()`
- Ajouter index composites

### Prompt 3 : RPC et Pagination Server-Side

- Creer RPC `count_imputations_by_statut(p_exercice)`
- Creer RPC `search_imputations(p_exercice, p_search, p_statut, ...)`
- Implementer pagination server-side 50/page
- staleTime 30s sur React Query

### Prompt 4 : Refactoring Hooks

- Scinder `useImputation.ts` (808 lignes) en 3 hooks
- Eliminer les `any` TypeScript
- Creer `imputationService.ts` (pattern Notes AEF)

### Prompt 5 : Exports (Excel/PDF/CSV)

- Ajouter `useImputationExport.ts`
- Export Excel avec colonnes budget
- Export PDF avec branding ARTI et QR code
- Export CSV
- Dropdown 3 formats dans header pages

### Prompt 6 : Tests Unitaires

- Tests hooks (useImputations, useImputation, useImputationValidation)
- Tests composants (ImputationForm, ImputationDetails, ImputationList)
- Cible : 250+ tests, 80% coverage

### Prompt 7 : Tests E2E

- 40+ tests Playwright
- Flux complet : creation -> soumission -> validation -> rejet -> report
- Permissions RBAC
- Exports
- Responsive

### Prompt 8 : Multi-Ligne et Polish

- Implementer ventilation multi-lignes (`imputation_lignes`)
- Activer flag `is_multi_ligne`
- Vue detail avec lignes ventilees
- Documentation complete

### Prompt 9 : Certification Finale

- Verification complete (100/100 vise)
- CERTIFICATION_IMPUTATION.md
- TRANSITION_VERS_EXPRESSION_BESOIN.md

---

## 14. Conclusion

Le module **Imputation** dispose d'une base frontend fonctionnelle (~6,850 LOC, 19 fichiers) et d'un schema backend riche (35+ colonnes, 3 triggers, 3 vues). Cependant, **7 gaps critiques** empechent la certification :

1. CHECK constraint desynchronise entre migrations et BD reelle
2. RLS policies conflictuelles (3 migrations contradictoires)
3. Functions RBAC inexistantes referencees dans les policies
4. Race condition dans la generation de references
5. Pas de trigger server-side pour le workflow
6. 0 test E2E, 0 test composant
7. Pas de pagination server-side ni RPC count

**Score : 58/100 -- Module NON certifiable en l'etat.**

8 prompts de correction sont necessaires pour atteindre le niveau de certification du module Notes AEF (100/100).

---

### Signatures

| Role                     | Statut                   |
| ------------------------ | ------------------------ |
| Auditeur (Claude Code)   | Audit termine            |
| Frontend (Agent a12c014) | Cartographie complete    |
| Backend (Agent a608b2f)  | Schema documente         |
| QA (Agent addc8f2)       | Build OK, browser bloque |

---

_Document genere automatiquement par Claude Code -- Prompt 1 Audit_
_ARTI -- Autorite de Regulation du Transport Interieur -- Cote d'Ivoire_
