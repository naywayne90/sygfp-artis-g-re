# Module Imputation — SYGFP (Etape 3/9)

> Derniere mise a jour : 14/04/2026

## 1. Vue d'ensemble

Le module **Imputation** assure le rattachement budgetaire des depenses. Il recoit les Notes AEF validees (statut `a_imputer`) et les associe a une **ligne budgetaire** avec un code d'imputation structure (OS/Mission/Action/Activite/Sous-activite/NBE/SYSCO). L'imputation validee debouche sur la creation d'une Expression de Besoin.

**Chaine** : Note SEF > Note AEF > **Imputation** > Expression Besoin > Passation Marche > Engagement > Liquidation > Ordonnancement > Reglement

### Fondement reglementaire

Le circuit de l'imputation suit le schema standard de la depense publique en Cote d'Ivoire pour les Etablissements Publics Nationaux (EPN) :

- **Ordonnateur delegue (Directeur DAAF ou Sous-Directeur DAAF)** : cree l'imputation (rattachement budgetaire)
- **Controleur Budgetaire (CB)** : controle a priori, appose son visa ou refuse (decret n.2019-222, art. 113 decret n.2023-960)
- **Directeur General (DG)** : validation finale, report ou rejet

> **Precision importante** : La DAAF est une **direction** (Direction des Affaires Administratives et Financieres), pas une personne. Seuls le **Directeur de la DAAF** et le **Sous-Directeur de la DAAF** ont le pouvoir de creer les imputations. Les autres agents de la direction DAAF n'ont pas ce pouvoir.

Le CB est le representant du ministere des Finances (DGBF) au sein de l'ARTI. Il est **independant** de la hierarchie interne et dispose d'un delai reglementaire de **8 jours ouvrables** pour accorder ou refuser son visa.

## Codification ARTI

| Propriété            | Valeur                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| **Code étape**       | 2 (02 en format 14 chars)                                                                                 |
| **Sigle**            | IMP                                                                                                       |
| **Format référence** | `ARTI02MMYYNNNN` (14 chars)                                                                               |
| **Exemple**          | `ARTI0202260001` = Imputation n°1, février 2026                                                           |
| **Colonne DB**       | `imputations.reference`                                                                                   |
| **Génération**       | Trigger `trg_imputation_arti_reference` (BEFORE INSERT)                                                   |
| **Compteur**         | `arti_reference_counters` (étape=2, par mois)                                                             |
| **Code budgétaire**  | `imputations.code_imputation` = `{OS}-{Action}-{Activité}-{SousActivité}-{Direction}-{NBE}` (18 chiffres) |

## 2. Routes et acces

| Route                                     | Page                                        | Roles               |
| ----------------------------------------- | ------------------------------------------- | ------------------- |
| `/execution/imputation`                   | Page principale (KPIs, onglets, pagination) | DAAF, CB, DG, ADMIN |
| `/execution/imputation?sourceAef={aefId}` | Pre-selection note AEF a imputer            | DAAF, ADMIN         |

## 3. Composants

| Composant                    | Fichier                                                    | Role                                                                                                                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ImputationPage` (page)      | `src/pages/execution/ImputationPage.tsx`                   | Page principale avec KPIs, onglets, exports, pagination                                                                                                                                                                           |
| `ImputationForm`             | `src/components/imputation/ImputationForm.tsx`             | Formulaire de creation d'imputation (choix ligne budgetaire, code imputation)                                                                                                                                                     |
| `ImputationDetailSheet`      | `src/components/imputation/ImputationDetailSheet.tsx`      | Sheet lateral de detail                                                                                                                                                                                                           |
| `ImputationRejectDialog`     | `src/components/imputation/ImputationRejectDialog.tsx`     | Dialog de saisie motif de rejet                                                                                                                                                                                                   |
| `ImputationDeferDialog`      | `src/components/imputation/ImputationDeferDialog.tsx`      | Dialog de report (motif + date reprise)                                                                                                                                                                                           |
| `ImputationValidationDialog` | `src/components/imputation/ImputationValidationDialog.tsx` | Dialog de confirmation de validation / visa                                                                                                                                                                                       |
| `BudgetFormulas`             | `src/components/budget/BudgetFormulas.tsx`                 | Formules de reference budgetaire (compact). Badges cliquables pour DG/DAAF/CB/sous-dir → ouvre BudgetOverviewSheet. Double verif RBAC : `useRBAC()` + `usePermissions().hasAnyRole()`                                             |
| `BudgetOverviewSheet`        | `src/components/budget/BudgetOverviewSheet.tsx`            | **NOUVEAU (14/04/2026)** Sheet donnees budget reelles Supabase. 4 KPIs globaux, barre de consommation, recherche, 2 onglets (Dotation Actuelle / Disponible). Lazy loading (`enabled: open`). Acces : DG, DAAF, CB, sous-dir DAAF |
| `IndicateurBudget`           | `src/components/engagement/IndicateurBudget.tsx`           | Indicateur disponibilite budgetaire avec barre de progression double (anterieurs + cet engagement)                                                                                                                                |
| `WorkflowStepIndicator`      | `src/components/workflow/WorkflowStepIndicator.tsx`        | Barre horizontale etape 3 active                                                                                                                                                                                                  |
| `NotesPagination`            | `src/components/shared/NotesPagination.tsx`                | Pagination serveur-side                                                                                                                                                                                                           |

## 4. Boutons et actions

| Bouton                     | Visible si                                                                                   | Action                                                            | Effet                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| Imputer                    | Onglet "A imputer", note AEF statut `a_imputer`, `canCreate = hasAnyRole(['DAAF', 'ADMIN'])` | Ouvre dialog `ImputationForm`                                     | Cree une imputation en statut `soumis`                           |
| Voir (oeil)                | Toute note/imputation                                                                        | Navigue vers detail AEF ou ouvre `ImputationDetailSheet`          | Consultation                                                     |
| Viser (check CB)           | Onglet "Soumises", role **CB** ou ADMIN                                                      | Ouvre `ImputationValidationDialog` (mode visa)                    | `viserImputation(id)` — passe en `vise`                          |
| Refuser visa               | Onglet "Soumises", menu contextuel, role **CB** ou ADMIN                                     | Ouvre `ImputationRejectDialog`                                    | `refuserVisaImputation({id, motif})` — passe en `rejete`         |
| Valider (check DG)         | Onglet "Visees", role **DG** ou ADMIN                                                        | Ouvre `ImputationValidationDialog` (mode validation)              | `validateImputation(id)` — passe en `valide`                     |
| Differer                   | Onglet "Visees", menu contextuel, role **DG** ou ADMIN                                       | Ouvre `ImputationDeferDialog`                                     | `deferImputation({id, motif, dateReprise})` — passe en `differe` |
| Rejeter                    | Onglet "Visees", menu contextuel, role **DG** ou ADMIN                                       | Ouvre `ImputationRejectDialog`                                    | `rejectImputation({id, motif})` — passe en `rejete`              |
| Creer expression de besoin | Imputation validee, `canCreate = hasAnyRole(['DAAF', 'ADMIN'])`, menu contextuel             | Navigue vers `/execution/expression-besoin?sourceImputation={id}` | Chaine vers etape suivante                                       |
| Voir le dossier            | Imputation avec `dossier_id`, menu contextuel                                                | Navigue vers `/recherche?dossier={dossierId}`                     | Consultation dossier                                             |
| Exporter > Excel/CSV/PDF   | Toujours                                                                                     | `exportExcel/CSV/PDF(filters, activeTab)`                         | Export filtre                                                    |

> **Note** : Pas de bouton "Soumettre" ni "Supprimer" — l'imputation est directement en statut `soumis` des la creation (regle projet : pas de brouillon).

## 5. Statuts et transitions

```
                     visa CB                   validation DG
   ┌──────────┐ ──────────────> ┌──────────┐ ──────────────> ┌──────────┐
   │  soumis  │                 │   vise   │                 │  valide  │
   └────┬─────┘                 └────┬─────┘                 └──────────┘
        │                            │
        │ refus CB                   ├── rejeter DG ──> ┌──────────┐
        │                            │                   │  rejete  │
        └──> ┌──────────┐            │                   └──────────┘
             │  rejete  │            │
             └──────────┘            └── differer DG ─> ┌──────────┐
                                                        │ differe  │
                                                        └──────────┘
```

**5 statuts** : `soumis`, `vise`, `valide`, `rejete`, `differe`

| Statut    | Description                                                                     | Qui agit ensuite |
| --------- | ------------------------------------------------------------------------------- | ---------------- |
| `soumis`  | Imputation creee par le Directeur/Sous-Directeur DAAF, en attente du visa du CB | CB               |
| `vise`    | Visa CB accorde, en attente de la validation finale du DG                       | DG               |
| `valide`  | DG a valide — imputation prete pour creation Expression Besoin                  | DAAF (etape 4)   |
| `rejete`  | Refuse par le CB (visa) ou rejete par le DG (avec motif)                        | DAAF (corrige)   |
| `differe` | Reporte par le DG avec motif + date de reprise prevue                           | DG (a la date)   |

### Transitions autorisees

| De       | Vers      | Action     | Qui       | Motif obligatoire |
| -------- | --------- | ---------- | --------- | ----------------- |
| `soumis` | `vise`    | Visa CB    | CB, ADMIN | Non               |
| `soumis` | `rejete`  | Refus visa | CB, ADMIN | **Oui**           |
| `vise`   | `valide`  | Validation | DG, ADMIN | Non               |
| `vise`   | `rejete`  | Rejet DG   | DG, ADMIN | **Oui**           |
| `vise`   | `differe` | Report DG  | DG, ADMIN | **Oui** + date    |

> **Supprime** : Les statuts `brouillon` et `a_valider` n'existent plus. Le statut `active` (heritage DB) n'a aucune correspondance metier.

## 6. Workflow de validation (3 etapes)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CIRCUIT DE L'IMPUTATION — ARTI                          │
├──────────┬──────────────────────────────────┬──────────────────────────────────┤
│ Etape 1  │ CREATION                         │ Ordonnateur delegue             │
│          │ - Selectionne note AEF validee   │                                 │
│          │ - Choisit ligne budgetaire        │ Directeur DAAF                 │
│          │ - Saisit montant + code imputation│ ou Sous-Directeur DAAF         │
│          │ → Statut = soumis                │ (pas un simple agent DAAF)      │
├──────────┼──────────────────────────────────┼──────────────────────────────────┤
│ Etape 2  │ CONTROLE (CB)                    │ Controleur Budgetaire           │
│          │ - Verifie regularite imputation  │                                 │
│          │ - Verifie disponibilite credits  │ Representant DGBF a l'ARTI     │
│          │ - Verifie taux de consommation   │ Delai : 8 jours ouvrables       │
│          │ → Visa OK = vise                 │                                 │
│          │ → Refus = rejete (avec motif)    │                                 │
├──────────┼──────────────────────────────────┼──────────────────────────────────┤
│ Etape 3  │ VALIDATION (DG)                  │ Directeur General               │
│          │ - Examine imputation visee       │                                 │
│          │ - Decision finale                │ Autorite de validation           │
│          │ → Valider = valide               │                                 │
│          │ → Rejeter = rejete (avec motif)  │                                 │
│          │ → Differer = differe (motif+date)│                                 │
└──────────┴──────────────────────────────────┴──────────────────────────────────┘
```

### Motifs de refus/rejet

| Etape               | Motifs courants                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **CB (refus visa)** | Imputation irreguliere (mauvaise ligne), credits indisponibles, depassement de credits, incompatibilite budgetaire, pieces manquantes |
| **DG (rejet)**      | Depense non prioritaire, arbitrage budgetaire, complement d'information requis, probleme de soutenabilite                             |
| **DG (report)**     | Report strategique, attente de recettes, reallocation en cours                                                                        |

### Matrice des roles

| Role                       | Peut creer | Visa (controle) | Valider/Rejeter/Differer | Consulter | Voir budget reel |
| -------------------------- | ---------- | --------------- | ------------------------ | --------- | ---------------- |
| Directeur DAAF             | **Oui**    | Non             | Non                      | Oui       | **Oui**          |
| Sous-Directeur DAAF        | **Oui**    | Non             | Non                      | Oui       | **Oui**          |
| CB (Controleur Budgetaire) | Non        | **Oui**         | Non                      | Oui       | **Oui**          |
| DG (Directeur General)     | Non        | Non             | **Oui**                  | Oui       | **Oui**          |
| ADMIN                      | Oui        | Oui             | Oui                      | Oui       | **Oui**          |
| Agent (autres)             | Non        | Non             | Non                      | Non       | Non              |

> **Separation des pouvoirs** : L'ordonnateur (Directeur/Sous-Directeur DAAF) ne peut pas viser sa propre imputation. Le controleur (CB) ne peut pas valider — il ne fait que viser. Seul le DG a le pouvoir de validation finale, rejet ou report. L'ADMIN a tous les droits pour raisons techniques.
>
> **Precision sur la DAAF** : La DAAF est une direction composee de plusieurs agents. Seuls le Directeur et le Sous-Directeur de la DAAF disposent du pouvoir de creer les imputations. Les autres agents de la DAAF n'ont pas ce droit. Dans l'application, le role `DAAF` dans la table `user_roles` est attribue uniquement au Directeur et au Sous-Directeur.

## 7. Onglets de la page

| Onglet    | Contenu                                         | Roles concernes |
| --------- | ----------------------------------------------- | --------------- |
| A imputer | Notes AEF validees, en attente d'imputation     | DAAF            |
| Soumises  | Imputations creees, en attente du visa CB       | CB              |
| Visees    | Imputations visees CB, en attente validation DG | DG              |
| Validees  | Imputations validees, pretes pour Expr. Besoin  | Tous            |
| Rejetees  | Imputations refusees/rejetees (CB ou DG)        | DAAF            |
| Differees | Imputations reportees par le DG                 | DG              |
| Toutes    | Vue complete de toutes les imputations          | ADMIN           |

## 8. Donnees Supabase

| Table          | Colonnes cles                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `imputations`  | `id`, `reference`, `note_aef_id`, `budget_line_id`, `dossier_id`, `objet`, `montant`, `direction_id`, `os_id`, `mission_id`, `action_id`, `activite_id`, `sous_activite_id`, `nbe_id`, `sysco_id`, `source_financement`, `code_imputation`, `commentaire`, `statut`, `exercice`, `submitted_at`, `vise_at`, `vise_by`, `validated_at`, `validated_by`, `rejected_at`, `rejected_by`, `motif_rejet`, `motif_differe`, `date_reprise`, `is_migrated`, `created_by` |
| `notes_dg`     | Notes AEF source (statut `a_imputer`)                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `budget_lines` | `id`, `code`, `label`, `dotation_initiale`, `dotation_modifiee`, `total_engage`, `montant_reserve`                                                                                                                                                                                                                                                                                                                                                               |

### Colonnes a ajouter (migration requise)

- `vise_at` (TIMESTAMPTZ) — date du visa CB
- `vise_by` (UUID FK profiles) — CB qui a vise
- `validated_by` (UUID FK profiles) — DG qui a valide
- `rejected_by` (UUID FK profiles) — CB ou DG qui a rejete
- `date_reprise` (DATE) — date de reprise pour les reports

### Contrainte DB actuelle (a corriger)

La table `imputations` a un CHECK constraint qui n'autorise que `active` et `annulee`. Migration requise pour aligner sur les 5 statuts metier : `soumis`, `vise`, `valide`, `rejete`, `differe`.

## 9. Hooks

| Hook                   | Fichier                             | Role                                                                            |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `useImputations`       | `src/hooks/useImputations.ts`       | Query paginee + mutations : visa, validate, reject, defer. Compteurs par statut |
| `useImputation`        | `src/hooks/useImputation.ts`        | Creation d'imputation depuis une Note AEF validee (`a_imputer`)                 |
| `useImputationsExport` | `src/hooks/useImputationsExport.ts` | Export Excel, CSV, PDF                                                          |

## 10. KPIs (compteurs)

| KPI       | Description                          | Filtre statut   |
| --------- | ------------------------------------ | --------------- |
| A imputer | Notes AEF en attente d'imputation    | AEF `a_imputer` |
| Soumises  | En attente du visa CB                | `soumis`        |
| Visees    | Visa CB OK, en attente validation DG | `vise`          |
| Validees  | Imputations validees                 | `valide`        |
| Rejetees  | Refusees ou rejetees                 | `rejete`        |
| Differees | Reportees                            | `differe`       |
| Total     | Toutes les imputations               | Tous            |

## 11. Bugs connus (a corriger)

| #   | Severite | Description                                                                                                        | Fichier                                                | Statut  |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------- |
| 1   | **P0**   | CHECK constraint DB : autorise seulement `active`/`annulee` au lieu de `soumis`/`vise`/`valide`/`rejete`/`differe` | Migration SQL                                          | A faire |
| 2   | **P0**   | `checkAlreadyImputed` filtre `statut = 'active'` (mort) — garde anti-doublon cassee                                | `useImputation.ts`                                     | A faire |
| 3   | **P0**   | `formatMontant()` non importe — crash a l'affichage des montants                                                   | `ImputationPage.tsx`, `ImputationValidationDialog.tsx` | A faire |
| 4   | **P0**   | Pas d'etape visa CB dans le code — le workflow saute directement a la validation                                   | Tout le module                                         | A faire |
| 5   | **P1**   | RLS INSERT : seuls CB + ADMIN peuvent inserer — DAAF exclue                                                        | Migration RLS                                          | A faire |
| 6   | **P1**   | `VALIDATION_MATRIX` definit CB comme validateur au lieu de : CB=visa, DG=validation                                | `rbac-config.ts`                                       | A faire |
| 7   | **P2**   | Double reservation budget (creation + validation)                                                                  | `useImputation.ts` + RPC                               | A faire |
| 8   | **P2**   | Reference non-atomique (COUNT+1, race condition)                                                                   | `useImputation.ts`                                     | A faire |
| 9   | **P2**   | Colonnes `vise_at`, `vise_by`, `validated_by`, `rejected_by` absentes de la table                                  | Migration SQL                                          | A faire |

### Bugs resolus (14/04/2026 — Session RBAC/DG Experience)

| #   | Severite | Description                                                                         | Fix applique                                                                      |
| --- | -------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| R1  | **P0**   | Bouton "Imputer" visible par Agent DSI (gate `!isDG` au lieu de `canCreate`)        | `ImputationPage.tsx` : `canCreate = hasAnyRole(['DAAF', 'ADMIN'])`                |
| R2  | **P0**   | Bouton "Creer expression de besoin" visible par tous                                | `ImputationPage.tsx` : gate `canCreate && statut === 'valide'`                    |
| R3  | **P0**   | `canValidate` trop large (incluait DAAF, SDPM)                                      | `ImputationDetailSheet.tsx` : `canValidate = hasAnyRole(['DG', 'ADMIN'])`         |
| R4  | **P0**   | Bouton "Creer Exp. Besoin" dans detail visible par tous                             | `ImputationDetailSheet.tsx` : ajout `canCreateEB = hasAnyRole(['DAAF', 'ADMIN'])` |
| R5  | **P1**   | Badges "Dotation Actuelle"/"Disponible" non cliquables                              | `BudgetFormulas.tsx` reecrit + `BudgetOverviewSheet.tsx` cree                     |
| R6  | **P1**   | `isDAF` du RBACContext toujours `false` pour DAAF (profil_fonctionnel='Validateur') | Double verif : `useRBAC()` + `usePermissions().hasAnyRole(['DAAF','DAF'])`        |
| R7  | **P2**   | Unicode escape sequences (`\u00E9` etc.) dans fichiers imputation                   | Fix perl global sur 42+ fichiers                                                  |

## 12. Plan de correction

Les corrections suivantes alignent le code sur le circuit reglementaire documente ci-dessus :

### Phase 1 — Migration DB (P0)

1. ALTER CHECK constraint : `soumis`, `vise`, `valide`, `rejete`, `differe`
2. ADD colonnes : `vise_at`, `vise_by`, `validated_by`, `rejected_by`, `date_reprise`
3. UPDATE donnees existantes : `active` → `soumis`
4. CREATE RPC `viser_imputation(id, user_id)` — transition `soumis` → `vise`
5. UPDATE RPC `validate_imputation` — n'accepte que `vise` (plus `soumis`)
6. FIX RLS INSERT : DAAF + ADMIN (pas CB)
7. FIX RLS UPDATE : CB pour visa, DG pour validation

### Phase 2 — Code frontend (P0 + P1)

8. `useImputations.ts` : type `ImputationStatus` = `soumis | vise | valide | rejete | differe`
9. `useImputations.ts` : ajouter `visaMutation` (soumis → vise, role CB)
10. `useImputations.ts` : `validateMutation` ne marche que depuis `vise` (pas `soumis`)
11. `useImputation.ts` : `checkAlreadyImputed` filtre `statut IN ('soumis','vise','valide')`
12. `ImputationPage.tsx` : `canVisa = hasAnyRole(['CB', 'ADMIN'])`, `canValidate = hasAnyRole(['DG', 'ADMIN'])`
13. `ImputationPage.tsx` : remplacer `formatMontant` → `formatCurrency` de `@/lib/utils`
14. `ImputationValidationDialog.tsx` : idem `formatCurrency`
15. `rbac-config.ts` : VALIDATION_MATRIX imputation = `{ visa: ['CB','ADMIN'], validation: ['DG','ADMIN'] }`
16. Ajouter onglet "Visees" entre "Soumises" et "Validees"

### Phase 3 — Ameliorations (P2)

17. Budget reserve une seule fois (a la creation, pas a la validation)
18. Reference atomique via `get_next_sequence()` RPC
19. Supprimer toute reference a SDPM (role inexistant)

## 13. Pattern RBAC double-verification (CRITIQUE)

Le `profil_fonctionnel` de la table `profiles` ne correspond PAS toujours au role reel dans `user_roles` :

| Utilisateur | `profil_fonctionnel` | `user_roles`   |
| ----------- | -------------------- | -------------- |
| DG          | Validateur           | ['DG']         |
| DAAF        | Validateur           | ['DAAF','DAF'] |
| Agent DSI   | Operationnel         | ['OPERATEUR']  |

**Consequence** : `useRBAC().isDAF` teste `profil_fonctionnel === 'DAAF'` → **toujours false** pour la DAAF.

**Pattern obligatoire** pour toute gate RBAC sur ce module :

```typescript
// TOUJOURS combiner les deux sources :
const { isDG, isDAF, isCB, isSousDirecteur } = useRBAC();
const { hasAnyRole } = usePermissions();

// Exemple gate creation :
const canCreate = hasAnyRole(['DAAF', 'ADMIN']);

// Exemple gate consultation budget :
const canViewBudget =
  isDG || isDAF || isCB || isSousDirecteur || hasAnyRole(['DG', 'DAAF', 'DAF', 'CB', 'ADMIN']);
```

## 14. BudgetOverviewSheet — Consultation budget reel

Le composant `BudgetOverviewSheet` (cree 14/04/2026) permet aux roles autorises de consulter les donnees budget reelles depuis la page Imputation.

**Acces** : DG, DAAF, sous-directeur DAAF, CB (double verif RBAC)
**Declencheur** : Clic sur badges "Dotation Actuelle" ou "Disponible" dans `BudgetFormulas` (mode compact)
**Contenu** :

- 4 KPIs globaux (dotation initiale, actuelle, engage, disponible)
- Barre de consommation globale (vert/orange/rouge selon taux)
- Recherche par code, libelle ou direction
- 2 onglets : Dotation Actuelle (colonnes initiale/recus/emis/actuelle) et Disponible (colonnes actuelle/engage/reserve/disponible/taux)
  **Performance** : Lazy loading — les queries Supabase ne se declenchent que quand le sheet est ouvert (`enabled: open`)

## 15. Tests

- Tests E2E via Playwright
- Verification : `npx vitest run`
- Non-regression : 809/809 tests PASS apres corrections RBAC (14/04/2026)
