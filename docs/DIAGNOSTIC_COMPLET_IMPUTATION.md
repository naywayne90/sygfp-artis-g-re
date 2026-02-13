# Diagnostic Approfondi - Module Imputation (SYGFP)

**Date** : 13 fevrier 2026
**Version** : 1.0
**Auditeur** : Claude Code (Prompt 2 - Diagnostic)
**Organisation** : ARTI -- Autorite de Regulation du Transport Interieur (Cote d'Ivoire)
**Systeme** : SYGFP -- Systeme de Gestion Financiere et de Planification
**Module** : Imputation Budgetaire (Etape 3 de la chaine de depense)

---

## 0. Resume Executif

**3 agents + LEAD ont analyse le module en profondeur. Aucune modification effectuee.**

| Agent    | Perimetre                                     | Resultats cles                                               |
| -------- | --------------------------------------------- | ------------------------------------------------------------ |
| FRONTEND | Formulaire, hooks, workflow, composants       | 13 bugs/problemes (1 bloquant, 2 hauts, 3 moyens)            |
| BACKEND  | Donnees Supabase, FK, orphelins, budget       | 1 note AEF orpheline, budget_movements vide, created_by NULL |
| QA       | Playwright browser, navigation, RBAC          | Sidebar cassee, WorkflowStepIndicator incomplet              |
| LEAD     | RBAC dual system, statut lifecycle, atomicite | Double systeme RBAC confirme, 10 appels sans transaction     |

---

## 1. CORRECTIONS CLASSEES P0 / P1 / P2

### P0 - BLOQUANTS (corriger AVANT toute utilisation)

#### P0-1 : Incoherence des statuts DB vs Frontend

|                |                                                                                                                                                                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**     | FRONTEND agent + BACKEND agent + LEAD                                                                                                                                                                                                                                                                                   |
| **Probleme**   | La migration definit `CHECK (statut IN ('active', 'annulee'))` avec `DEFAULT 'active'`. Le frontend utilise `brouillon`, `a_valider`, `valide`, `rejete`, `differe`. Le CHECK a ete modifie via SQL Editor (non trace).                                                                                                 |
| **Preuve**     | 1 imputation en base avec `statut = 'valide'` alors que le CHECK migration dit `('active', 'annulee')`                                                                                                                                                                                                                  |
| **Impact**     | Les migrations ne sont pas rejouables. `imputeNote()` cree avec statut `DEFAULT 'active'` qui ne correspond a AUCUN onglet frontend. Les imputations creees sont **invisibles**.                                                                                                                                        |
| **Correction** | Migration consolidee : `ALTER TABLE imputations DROP CONSTRAINT imputations_statut_check; ALTER TABLE imputations ADD CONSTRAINT imputations_statut_check CHECK (statut IN ('brouillon', 'a_valider', 'valide', 'rejete', 'differe', 'annulee')); ALTER TABLE imputations ALTER COLUMN statut SET DEFAULT 'brouillon';` |
| **Fichiers**   | Migration SQL nouvelle                                                                                                                                                                                                                                                                                                  |

#### P0-2 : Pas d'atomicite dans imputeNote() - 10 appels sequentiels

|                    |                                                                                                                                                                                                                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**         | FRONTEND agent + LEAD                                                                                                                                                                                                                                                                                                                                      |
| **Probleme**       | `imputeNote()` (useImputation.ts, lignes 394-627) effectue 10 operations sequentielles sans transaction : (1) calculateAvailability, (2) findOrCreateBudgetLine, (3) notes_dg.select, (4) dossiers.insert, (5) budget_movements.insert, (6) budget_lines.update, (7) dossier_etapes.insert, (8) imputations.insert, (9) notes_dg.update, (10) logAction x2 |
| **Preuve**         | Code lu directement. Aucun `BEGIN`/`COMMIT`/`ROLLBACK`, pas de RPC transactionnelle.                                                                                                                                                                                                                                                                       |
| **Impact**         | Si l'etape 8 reussit mais 9 echoue : imputation creee mais note AEF toujours en `a_imputer`. Budget reserve sans imputation. Etat incoherent irreversible.                                                                                                                                                                                                 |
| **Preuve en base** | La note `9d86dd92` est en statut `impute` mais **aucune imputation n'existe pour elle** (note orpheline confirmee par BACKEND agent). C'est probablement un echec partiel.                                                                                                                                                                                 |
| **Correction**     | Creer une RPC PostgreSQL `create_imputation_transactional(...)` qui execute toutes les etapes dans une seule transaction.                                                                                                                                                                                                                                  |
| **Fichiers**       | `src/hooks/useImputation.ts` (lignes 394-627), Migration SQL nouvelle                                                                                                                                                                                                                                                                                      |

#### P0-3 : Budget non libere lors de rejet/report/suppression

|                |                                                                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**     | FRONTEND agent                                                                                                                                                                                                                    |
| **Probleme**   | Quand une imputation est rejetee, differee ou supprimee, le `montant_reserve` sur la `budget_line` n'est PAS decremente. Le `budget_movement` de reservation n'est PAS annule. La note DG n'est PAS remise en statut `a_imputer`. |
| **Preuve**     | Code `useImputations.ts` : mutations reject (l.237), defer (l.276), delete (l.300) ne font qu'un UPDATE du statut. Aucune logique de liberation budget.                                                                           |
| **Impact**     | Le budget reste reserve indefiniment apres un rejet. Fuite budgetaire progressive.                                                                                                                                                |
| **Correction** | Ajouter dans chaque mutation de rejet/report/suppression : (1) budget_lines.update montant_reserve -= montant, (2) budget_movements.insert type='annulation', (3) notes_dg.update statut='a_imputer' (pour rejet/suppression)     |
| **Fichiers**   | `src/hooks/useImputations.ts` (mutations reject, defer, delete)                                                                                                                                                                   |

#### P0-4 : Double systeme RBAC incoherent

|                |                                                                                                                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**     | LEAD + QA agent                                                                                                                                                                                                                                                               |
| **Probleme**   | Deux systemes RBAC coexistent avec des sources de donnees differentes :                                                                                                                                                                                                       |
|                | **`usePermissions().hasAnyRole()`** (useRBAC.ts) → lit `user_roles` table → DAAF a role `'DAAF'`                                                                                                                                                                              |
|                | **`useRBAC().canAccess()`** (RBACContext.tsx) → lit `profiles.profil_fonctionnel` → DAAF a `'Validateur'`                                                                                                                                                                     |
|                | La sidebar utilise `canAccess()` (Context), les boutons d'action utilisent `hasAnyRole()` (Hook)                                                                                                                                                                              |
| **Preuve DB**  | `profiles` : daaf@arti.ci → `profil_fonctionnel = 'Validateur'`. `user_roles` : daaf@arti.ci → `role = 'DAAF'`. `ROUTE_ACCESS_MATRIX['/execution/imputation'].allowedProfiles = ['ADMIN', 'CB', 'DAAF', 'DG', 'AUDITEUR']`. `'Validateur'` ne matche pas → sidebar invisible. |
| **Impact**     | DAAF ne peut pas naviguer vers Imputation via le menu. DG a `profil_fonctionnel = 'Admin'` (pas `'DG'`) donc depend du bypass Admin. agent.dsi n'a PAS d'entree dans `user_roles` du tout.                                                                                    |
| **Correction** | Unifier le RBAC : `canAccessRoute()` doit aussi consulter `user_roles` via `hasAnyRole()`, OU synchroniser `profiles.profil_fonctionnel` avec `user_roles.role`.                                                                                                              |
| **Fichiers**   | `src/contexts/RBACContext.tsx` (l.146, l.179-183), `src/lib/config/rbac-config.ts` (l.1018-1038), `src/hooks/useRBAC.ts` (l.116-170)                                                                                                                                          |

---

### P1 - IMPORTANTS (corriger pour la mise en production)

#### P1-1 : Aucune verification de statut source dans les mutations

|                |                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Source**     | FRONTEND agent                                                                                                                                                                                         |
| **Probleme**   | Les mutations submit, validate, reject, defer font un `UPDATE ... WHERE id = ?` sans verifier le statut actuel. On peut valider une imputation deja rejetee, rejeter une imputation deja validee, etc. |
| **Preuve**     | `useImputations.ts` : `submitMutation` (l.152), `validateMutation` (l.190), `rejectMutation` (l.237), `deferMutation` (l.276) - aucun `.eq('statut', expected_source)`                                 |
| **Impact**     | Transitions de workflow invalides possibles. Bypass du workflow.                                                                                                                                       |
| **Correction** | Ajouter `.eq('statut', source_statut)` dans chaque mutation + creer trigger `enforce_imputation_workflow()` server-side.                                                                               |
| **Fichiers**   | `src/hooks/useImputations.ts`, Migration SQL nouvelle                                                                                                                                                  |

#### P1-2 : Pas de validation de formulaire (champs obligatoires)

|                |                                                                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**     | FRONTEND agent                                                                                                                                                                                                  |
| **Probleme**   | Aucun champ de rattachement programmatique n'est obligatoire. L'utilisateur peut creer une imputation avec os_id = null, mission_id = null, nbe_id = null, etc. Seul le montant est requis (et 0 est autorise). |
| **Preuve**     | `ImputationForm.tsx` : pas de schema Zod, pas de React Hook Form. Simple `useState<Partial<ImputationData>>`. Le bouton submit verifie seulement `!formData.montant`.                                           |
| **Impact**     | Code imputation genere incomplet. Rattachement programmatique absent. Reporting budgetaire fausse.                                                                                                              |
| **Correction** | Ajouter validation Zod : os_id, nbe_id obligatoires minimum. Montant > 0.                                                                                                                                       |
| **Fichiers**   | `src/components/imputation/ImputationForm.tsx`                                                                                                                                                                  |

#### P1-3 : Ligne budgetaire auto-creee sans controle

|                |                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**     | FRONTEND agent                                                                                                                                                             |
| **Probleme**   | `findOrCreateBudgetLine()` cree automatiquement une ligne avec code `'AUTO-{timestamp}'`, label `'Ligne creee automatiquement'`, dotation_initiale `0`, statut `'valide'`. |
| **Preuve**     | `useImputation.ts` lignes 325-374                                                                                                                                          |
| **Impact**     | Lignes budgetaires fantomes avec code non-standard. Budget cree avec dotation 0 mais imputation forcee possible. Corruption des donnees budgetaires.                       |
| **Correction** | Interdire la creation automatique. Obliger la selection d'une ligne existante via `BudgetLineSelector`.                                                                    |
| **Fichiers**   | `src/hooks/useImputation.ts` (findOrCreateBudgetLine), `src/components/imputation/ImputationForm.tsx`                                                                      |

#### P1-4 : WorkflowStepIndicator omet l'etape Imputation

|                |                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**     | QA agent + LEAD                                                                                                                                                                  |
| **Probleme**   | Le composant `WorkflowStepIndicator` definit 8 etapes au lieu de 9. Apres "Notes AEF" (etape 2), il passe directement a "Expression Besoin" (etape 3). L'imputation est absente. |
| **Preuve**     | `WorkflowStepIndicator.tsx` lignes 27-36 : pas d'entree "imputation"                                                                                                             |
| **Impact**     | La chaine de depense affichee est incorrecte sur toutes les pages qui l'utilisent. `ImputationPage.tsx` passe `currentStep={2}` (AEF au lieu d'Imputation).                      |
| **Correction** | Ajouter `{ id: "imputation", numero: 3, titre: "Imputation", titreCourt: "Imput.", url: "/execution/imputation", icon: Tag }` a la position 3 et renumeroter.                    |
| **Fichiers**   | `src/components/workflow/WorkflowStepIndicator.tsx`, `src/pages/execution/ImputationPage.tsx`                                                                                    |

#### P1-5 : Note AEF orpheline en base

|                |                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**     | BACKEND agent                                                                                                                                                              |
| **Probleme**   | La note `9d86dd92-3fe5-46af-a075-f7b3ece2af62` (numero ARTI0112250005, objet "tablette 252") est en statut `impute` mais **aucune imputation n'existe en base pour elle**. |
| **Preuve**     | Requete BACKEND : 2 notes en statut `impute` mais seulement 1 imputation en base (pour note `fec71e0a`).                                                                   |
| **Impact**     | Donnees incoherentes. Note bloquee en statut `impute` sans possibilite de re-imputation ni de continuer la chaine.                                                         |
| **Correction** | Soit creer l'imputation manquante, soit remettre la note en statut `a_imputer`. Ajouter contrainte d'integrite (trigger ou FK).                                            |
| **Fichiers**   | Correction de donnees en base                                                                                                                                              |

#### P1-6 : budget_movements vide - pas de tracabilite budgetaire

|                |                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**     | BACKEND agent                                                                                                                                                                                                             |
| **Probleme**   | La table `budget_movements` est vide (0 enregistrement) malgre 1 imputation validee de 200,000 FCFA.                                                                                                                      |
| **Preuve**     | Requete PostgREST : 0 mouvements dans budget_movements                                                                                                                                                                    |
| **Impact**     | Pas de tracabilite des reservations budgetaires. Impossible de reconstituer l'historique des mouvements. Le code `imputeNote()` insere un mouvement mais la table est vide → l'insert a peut-etre echoue silencieusement. |
| **Correction** | Verifier que l'insert budget_movements fonctionne. Ajouter mouvement manquant pour l'imputation existante. Tester la pipeline complete.                                                                                   |
| **Fichiers**   | `src/hooks/useImputation.ts` (lignes 470-487), donnees en base                                                                                                                                                            |

#### P1-7 : Formules de calcul budget incoherentes

|                |                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Source**     | FRONTEND agent                                                                                                                                                                       |
| **Probleme**   | Deux formules de calcul du disponible coexistent :                                                                                                                                   |
|                | **useImputation.calculateAvailability()** : `disponible_net = (dotation_initiale + virements_recus - virements_emis) - engagements_anterieurs - montant_reserve - engagement_actuel` |
|                | **useImputationValidation** : `disponible = MAX(0, dotation_initiale - MAX(total_engage, total_liquide, total_ordonnance, total_paye))`                                              |
| **Impact**     | Un calcul peut autoriser une imputation que l'autre bloquerait. Incoherence des controles budgetaires.                                                                               |
| **Correction** | Unifier la formule dans un service partage `budgetCalculationService.ts`.                                                                                                            |
| **Fichiers**   | `src/hooks/useImputation.ts` (calculateAvailability), `src/hooks/useImputationValidation.ts`                                                                                         |

---

### P2 - AMELIORATIONS (corriger pour la certification 100/100)

#### P2-1 : WorkflowEngine non utilise par le module Imputation

|                |                                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**     | FRONTEND agent                                                                                                                                                                                            |
| **Probleme**   | Le WorkflowEngine definit les regles pour `imputations` (owners: CB/ADMIN, validators: CB/ADMIN, transitions: brouillon→impute) mais le frontend les ignore completement et implemente sa propre logique. |
| **Preuve**     | `workflowConfig.ts` : `WORKFLOW_STEPS[3]` definit les regles. `ImputationPage.tsx` : `canValidate = hasAnyRole(['ADMIN', 'DG', 'DAAF', 'SDPM'])` — roles differents.                                      |
| **Impact**     | Les regles definies dans le workflow engine ne sont pas appliquees.                                                                                                                                       |
| **Correction** | Aligner les roles ImputationPage avec ceux du WorkflowEngine, ou mettre a jour le WorkflowEngine.                                                                                                         |

#### P2-2 : Code imputation incomplet

|              |                                                                                                                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**   | FRONTEND agent                                                                                                                                                                                                  |
| **Probleme** | `buildImputationCode()` est appele sans `contextData`, donc les segments Action/Activite/SousActivite ne sont jamais inclus. Le code genere est `OS01-NBE05` au lieu de `OS01-ACT02-ACTV03-SA04-NBE05-SYSCO03`. |
| **Impact**   | Codes imputation tronques en base et a l'affichage.                                                                                                                                                             |

#### P2-3 : Navigation post-creation vers /marches

|                |                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**     | FRONTEND agent                                                                                                                                                                              |
| **Probleme**   | Apres `imputeNote()`, le formulaire navigue vers `/marches?dossier=${result.dossier.id}`. Le dossier est a l'etape "imputation", pas "marche". L'etape 4 "Expression de besoin" est sautee. |
| **Correction** | Naviguer vers `/execution/expression-besoin?dossier=${result.dossier.id}` ou rester sur la page Imputation.                                                                                 |

#### P2-4 : checkAlreadyImputed ne filtre pas par exercice

|              |                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Source**   | FRONTEND agent                                                                                                                                                     |
| **Probleme** | `checkAlreadyImputed()` verifie `statut = 'active'` sans filtrer par exercice. Si la meme note est re-imputee sur un exercice different, la verification bloquera. |

#### P2-5 : BudgetLineSelector (854 lignes) non integre

|              |                                                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**   | FRONTEND agent                                                                                                                                                                     |
| **Probleme** | Composant complet avec mode single/multi-lignes, filtres avances, calcul disponibilite en batch. Mais non utilise dans le flux d'imputation. Le formulaire fait sa propre logique. |

#### P2-6 : `any` TypeScript (8+ occurrences)

|              |                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Source**   | FRONTEND agent                                                                                                   |
| **Probleme** | `ImputationForm.tsx` : 2 `any`, `useImputation.ts` : 4 `any`, `ImputationPage.tsx` : 2 `any` avec eslint-disable |

#### P2-7 : ImputationDetails incomplet

|              |                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**   | FRONTEND agent                                                                                                                                                |
| **Probleme** | Pas d'affichage du motif de report/differe. Pas d'informations de forcage (justification, depassement). Pas de details programmatiques (OS, Mission, Action). |

#### P2-8 : created_by NULL sur l'imputation existante

|              |                                                                               |
| ------------ | ----------------------------------------------------------------------------- |
| **Source**   | BACKEND agent                                                                 |
| **Probleme** | L'imputation `IMP-2026-DCSTI-0001` a `created_by = NULL`. Pas de tracabilite. |

#### P2-9 : Colonnes workflow toutes NULL

|              |                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source**   | BACKEND agent                                                                                                                                |
| **Probleme** | `submitted_at`, `submitted_by`, `validated_at`, `validated_by` toutes NULL sur l'imputation validee. Pas d'historique de qui a valide quand. |

#### P2-10 : Pas de RPC count / Pas de pagination server-side

|              |                                                                              |
| ------------ | ---------------------------------------------------------------------------- |
| **Source**   | Audit Prompt 1                                                               |
| **Probleme** | Compteurs calcules en JS (N+1). Toutes les imputations chargees cote client. |

#### P2-11 : Pas d'exports (Excel/PDF/CSV)

|              |                                                   |
| ------------ | ------------------------------------------------- |
| **Source**   | Audit Prompt 1                                    |
| **Probleme** | Aucun export disponible sur le module Imputation. |

#### P2-12 : 0 test E2E / 0 test composant

|              |                                                                                    |
| ------------ | ---------------------------------------------------------------------------------- |
| **Source**   | Audit Prompt 1                                                                     |
| **Probleme** | Seuls les utils sont testes (52 tests). 0 test Playwright, 0 test composant React. |

---

## 2. ANALYSE FRONTEND DETAILLEE

### 2.1 Formulaire ImputationForm.tsx

| Aspect              | Constat                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| Validation          | **PAS de Zod, PAS de React Hook Form**. Simple `useState<Partial<ImputationData>>`    |
| Champs obligatoires | Seul `montant` (et 0 autorise). Aucun rattachement programmatique requis              |
| Wizard/Stepper      | NON. Formulaire en 1 page avec 3 cartes                                               |
| Ligne budgetaire    | NON selectionnee par l'utilisateur. Auto-trouvee/creee par `findOrCreateBudgetLine()` |
| Code imputation     | Calcule automatiquement mais INCOMPLET (manque Action/Activite/SousActivite)          |

### 2.2 Flux imputeNote() - 10 etapes

```
1. Verif exercice ouvert
2. Verif auth (getUser)
3. checkAlreadyImputed (statut='active', sans filtre exercice)
4. calculateAvailability (budget dispo)
5. Validation budget (bloquant si insuffisant, sauf forcage)
6. findOrCreateBudgetLine (cherche ou CREE avec 'AUTO-{ts}')
7. notes_dg.select (recup note)
8. dossiers.insert (statut_global='impute')
9. budget_movements.insert (reservation debit)
10. budget_lines.update (montant_reserve += montant)
11. dossier_etapes.insert (type='imputation', statut='valide')
12. imputations.insert (PAS de statut → DEFAULT DB)
13. notes_dg.update (statut='impute')
14. logAction x2 (audit)

⚠️ AUCUNE TRANSACTION. Echec partiel = donnees corrompues.
```

### 2.3 Lifecycle des statuts (tel que code)

```
imputeNote() ──────────────── DEFAULT DB ('active' ou 'brouillon')
                                        |
                               submit ──┤──► a_valider
                                        |
                            validate ───┤──► valide
                                        |
                              reject ───┤──► rejete
                                        |
                               defer ───┤──► differe
                                        |
                              delete ───┘──► DELETE
```

**PROBLEME** : L'onglet "A imputer" montre les notes_dg. Apres creation, l'imputation a statut `DEFAULT`. Aucun onglet ne montre `'active'` ni `'brouillon'` (pas d'onglet brouillons malgre le filtre calcule ligne 195).

### 2.4 Mutations workflow (useImputations.ts)

| Mutation | Source verifiee | Cible     | Budget libere | Note DG restauree |
| -------- | --------------- | --------- | ------------- | ----------------- |
| submit   | NON             | a_valider | -             | -                 |
| validate | NON             | valide    | -             | -                 |
| reject   | NON             | rejete    | **NON**       | **NON**           |
| defer    | NON             | differe   | **NON**       | **NON**           |
| delete   | NON             | DELETE    | **NON**       | **NON**           |

---

## 3. ANALYSE BACKEND DETAILLEE

### 3.1 Donnees en base

| Metrique            | Valeur                                  |
| ------------------- | --------------------------------------- |
| Imputations totales | 1                                       |
| Statut              | valide                                  |
| Reference           | IMP-2026-DCSTI-0001                     |
| Montant             | 200,000 FCFA                            |
| Notes AEF a_imputer | 1 (ARTI0112250003)                      |
| Notes AEF impute    | 2 (ARTI0112250004 + ARTI0112250005)     |
| Note orpheline      | ARTI0112250005 (impute sans imputation) |
| budget_movements    | 0 (table vide)                          |
| imputation_lignes   | 0 (table morte)                         |
| created_by          | NULL (pas de tracabilite)               |
| validated_at        | NULL (workflow non trace)               |

### 3.2 Integrite referentielle

| FK                             | Valide |
| ------------------------------ | ------ |
| note_aef_id → notes_dg         | OUI    |
| dossier_id → dossiers          | OUI    |
| budget_line_id → budget_lines  | OUI    |
| direction_id → directions      | OUI    |
| os_id → objectifs_strategiques | OUI    |
| mission_id → missions          | OUI    |
| nbe_id → nomenclature_nbe      | OUI    |

**0 orphelin FK**. Mais 1 orphelin metier (note 'impute' sans imputation).

### 3.3 RLS Policies actives

La migration `20260116184125` (derniere appliquee) est trop permissive :

- SELECT : `auth.uid() IS NOT NULL` (tout authentifie)
- INSERT : `auth.uid() IS NOT NULL` (tout authentifie)
- UPDATE : `auth.uid() IS NOT NULL` (tout authentifie)
- DELETE : `auth.uid() = created_by AND statut = 'brouillon'`

La migration `20260116103921` (initiale, correcte) a ete ecrasee.

---

## 4. ANALYSE RBAC DETAILLEE

### 4.1 Double systeme RBAC

```
┌──────────────────────────────────────────────┐
│          SYSTEME 1 : RBACContext              │
│  Source : profiles.profil_fonctionnel         │
│  Utilisé par : canAccess(), SidebarV2        │
│                                              │
│  daaf@arti.ci → 'Validateur'                 │
│  dg@arti.ci → 'Admin'                        │
│  agent.dsi@arti.ci → 'Operationnel'          │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│          SYSTEME 2 : useRBAC hook            │
│  Source : user_roles.role                    │
│  Utilisé par : hasAnyRole(), boutons action  │
│                                              │
│  daaf@arti.ci → 'DAAF'                       │
│  dg@arti.ci → 'DG'                           │
│  agent.dsi@arti.ci → ABSENT (pas d'entree)  │
└──────────────────────────────────────────────┘

MATRICE D'ACCES /execution/imputation :
  allowedProfiles: ['ADMIN', 'CB', 'DAAF', 'DG', 'AUDITEUR']

  canAccess() compare 'Validateur' vs allowedProfiles → FALSE
  hasAnyRole(['DAAF']) compare role 'DAAF' → TRUE

  RESULTAT : Sidebar invisible, mais boutons fonctionnels !
```

### 4.2 Impact sur chaque utilisateur

| Utilisateur       | Sidebar visible    | Boutons action                | Acces URL directe   |
| ----------------- | ------------------ | ----------------------------- | ------------------- |
| dg@arti.ci        | OUI (Admin bypass) | OUI                           | OUI                 |
| daaf@arti.ci      | **NON**            | OUI                           | OUI                 |
| agent.dsi@arti.ci | **NON**            | **NON** (pas dans user_roles) | OUI (RLS permissif) |

---

## 5. ANALYSE QA / BROWSER

### 5.1 Page Imputation

| Element               | Etat                                                    |
| --------------------- | ------------------------------------------------------- |
| Chargement page       | OK                                                      |
| KPIs                  | Affiches (1 a imputer, 0 a valider, 1 validee)          |
| Onglets               | 5 (A imputer, A valider, Validees, Differees, Rejetees) |
| Onglet Brouillons     | **ABSENT** malgre filtre calcule                        |
| Tableau A imputer     | 1 note AEF visible (ARTI0112250003)                     |
| Tableau Validees      | 1 imputation (IMP-2026-DCSTI-0001)                      |
| WorkflowStepIndicator | 8 etapes, Imputation **ABSENTE**                        |
| Sidebar DAAF          | Imputation **ABSENTE**                                  |
| Console errors        | 1 warning React ref (non bloquant)                      |

### 5.2 WorkflowStepIndicator

```
AFFICHE (8 etapes) :
1. Notes SEF → 2. Notes AEF → 3. Expression Besoin → 4. Marches →
5. Engagement → 6. Liquidation → 7. Ordonnancement → 8. Reglement

ATTENDU (9 etapes) :
1. Notes SEF → 2. Notes AEF → 3. IMPUTATION → 4. Expression Besoin →
5. Marches → 6. Engagement → 7. Liquidation → 8. Ordonnancement → 9. Reglement
```

---

## 6. PLAN DE CORRECTION REVISE

### Sprint 1 (P0 - Bloquants) - 1 prompt

| Correction                                                      | Effort                        |
| --------------------------------------------------------------- | ----------------------------- |
| P0-1 : Migration CHECK constraint + DEFAULT 'brouillon'         | Migration SQL                 |
| P0-2 : RPC transactionnelle `create_imputation_transactional()` | Migration SQL + refactor hook |
| P0-3 : Liberation budget sur rejet/report/suppression           | Refactor useImputations.ts    |
| P0-4 : Unifier RBAC (canAccess consulte user_roles)             | Refactor RBACContext.tsx      |

### Sprint 2 (P1 - Importants) - 2 prompts

| Correction                                                               | Effort                                  |
| ------------------------------------------------------------------------ | --------------------------------------- |
| P1-1 : Trigger `enforce_imputation_workflow()` + WHERE statut source     | Migration SQL + refactor hooks          |
| P1-2 : Validation Zod formulaire                                         | Refactor ImputationForm.tsx             |
| P1-3 : Supprimer auto-creation budget_lines, integrer BudgetLineSelector | Refactor ImputationForm + useImputation |
| P1-4 : WorkflowStepIndicator 9 etapes                                    | 1 fichier                               |
| P1-5 : Corriger note orpheline + trigger integrite                       | Migration SQL                           |
| P1-6 : Verifier/corriger budget_movements                                | Investigation + fix                     |
| P1-7 : Unifier formule calcul budget                                     | Creer service partage                   |

### Sprint 3 (P2 - Ameliorations) - 4 prompts

| Correction                                         | Effort                      |
| -------------------------------------------------- | --------------------------- |
| P2-1 a P2-9 : Polish, TypeScript, Details, Exports | Multi-fichiers              |
| P2-10 : RPC count + pagination server-side         | Migration + service + hooks |
| P2-11 : Exports Excel/PDF/CSV                      | Nouveau hook + UI           |
| P2-12 : Tests E2E + tests composants               | 40+ tests                   |

### Sprint 4 (Certification) - 1 prompt

| Correction                           | Effort      |
| ------------------------------------ | ----------- |
| Verification complete (100/100 vise) | Audit final |
| CERTIFICATION_IMPUTATION.md          | Document    |
| TRANSITION_VERS_EXPRESSION_BESOIN.md | Document    |

---

## 7. RESUME PAR SEVERITE

| Severite              | Nb     | Corrections                                                    |
| --------------------- | ------ | -------------------------------------------------------------- |
| **P0 - Bloquant**     | 4      | Statut lifecycle, atomicite, budget leak, RBAC dual            |
| **P1 - Important**    | 7      | Workflow enforcement, validation form, orphelins, budget moves |
| **P2 - Amelioration** | 12     | TypeScript, exports, tests, pagination, polish                 |
| **TOTAL**             | **23** |                                                                |

---

### Signatures

| Role                     | Statut                                    |
| ------------------------ | ----------------------------------------- |
| LEAD (Claude Code)       | Diagnostic termine                        |
| FRONTEND (Agent a4939f2) | 13 bugs documentes                        |
| BACKEND (Agent a0dd75b)  | Donnees analysees, 1 orphelin trouve      |
| QA (Agent a2fc727)       | Browser teste, RBAC et Workflow confirmes |

---

_Document genere automatiquement par Claude Code -- Prompt 2 Diagnostic_
_ARTI -- Autorite de Regulation du Transport Interieur -- Cote d'Ivoire_
