# DIAGNOSTIC COMPLET — Module Engagement Budgetaire

**Date :** 19 fevrier 2026
**Prerequis :** AUDIT_COMPLET_ENGAGEMENT.md (score 63/100)
**Methode :** Investigation code source + base de donnees + triggers SQL
**Verdict :** 6 constats critiques sur les 6 points investigues

---

## SYNTHESE EXECUTIVE

| Question investigee             | Verdict                                                      | Severite |
| ------------------------------- | ------------------------------------------------------------ | -------- |
| 1. Impact budget (total_engage) | Fonctionne via 2 triggers, mais double ecriture redondante   | **P1**   |
| 2. Controle disponibilite       | Triple hard-block frontend, ZERO enforcement backend         | **P0**   |
| 3. Validation 4 etapes          | Code complet, jamais testee en production (0 donnees)        | **P1**   |
| 4. Lien engagements-marches     | 0/2805 engagements lies — FK jamais ecrite                   | **P0**   |
| 5. Engagements hors marche      | Pas de distinction marche/hors-marche — concept absent       | **P1**   |
| 6. Taux consommation            | Calcule partout (20+ endroits) mais incoherences de formules | **P1**   |

---

## P0 — CRITIQUES (Impact budget casse ou donnees corrompues)

### P0-1. passation_marche_id JAMAIS ecrit en base

**Fichiers concernes :**

- `src/hooks/useEngagements.ts` — `createMutation` (ligne 293-397)
- `src/components/engagement/EngagementFromPMForm.tsx` — ligne 138-148
- `src/components/engagement/EngagementForm.tsx` — ligne 123-133

**Constat :**

La colonne `passation_marche_id` existe dans `budget_engagements` mais n'est **jamais ecrite** :

```
Flux PM (EngagementFromPMForm.tsx) :
  marche_id: undefined          ← EXPLICITEMENT undefined
  passation_marche_id: ABSENT   ← PAS dans l'objet
  expression_besoin_id: OK      ← passe via passation.expression_besoin.id

Flux EB (EngagementForm.tsx) :
  marche_id: selectedMarcheId   ← OK (quand marche existe)
  passation_marche_id: ABSENT   ← PAS dans l'objet
  expression_besoin_id: OK      ← passe

Hook createMutation (useEngagements.ts) :
  - Le TYPE d'entree n'accepte PAS passation_marche_id
  - L'INSERT en base n'inclut PAS passation_marche_id
```

**Donnees en base :** 0/2805 engagements ont `passation_marche_id` non-null. 0/2805 ont `marche_id` non-null. 0/2805 ont `expression_besoin_id` non-null.

**Consequence directe :** La logique de deduplication des PM dans l'onglet "A traiter" est **morte** :

```typescript
// useEngagements.ts — requete passations validees
const { data: usedPMs } = await supabase
  .from('budget_engagements')
  .select('passation_marche_id')
  .not('passation_marche_id', 'is', null);
// → Retourne TOUJOURS [] car passation_marche_id est TOUJOURS null
// → Les PM deja engagees reapparaissent indefiniment dans "A traiter"
```

**Impact :** Chaine de depense rompue a l'etape 6. Pas de tracabilite Passation → Engagement. Possibilite de creer des engagements en double pour la meme PM.

---

### P0-2. ZERO enforcement backend sur le controle budgetaire

**Mecanisme actuel (frontend seulement) :**

| Couche                      | Type                                                       | Effectif ? |
| --------------------------- | ---------------------------------------------------------- | ---------- |
| UI — Bouton disabled        | `availability?.is_sufficient === false` → bouton grise     | OUI        |
| UI — handleSubmit           | `if (!is_sufficient) return;`                              | OUI        |
| Hook — createMutation       | `if (!availability.is_sufficient) throw Error(...)`        | OUI        |
| SQL — BEFORE INSERT trigger | `trg_unified_ref_engagements` → verifie numero seulement   | **NON**    |
| SQL — CHECK constraint      | Inexistant                                                 | **NON**    |
| SQL — RPC bloquante         | `check_budget_availability` → retourne bool, ne bloque pas | **NON**    |

**Preuve :** Un appel direct a l'API Supabase (curl, PostgREST, SDK) peut creer un engagement avec `montant = 999 999 999 999` sans aucune verification.

```
→ INSERT via PostgREST contourne les 3 protections frontend
→ Le trigger BEFORE INSERT ne verifie que le numero de reference
→ Aucune CHECK constraint ne compare montant vs disponible
→ check_budget_availability() est une RPC de LECTURE, pas un garde-fou
```

**La mutation submitMutation ne re-verifie PAS le budget.** Un engagement cree en brouillon (avant controle) puis soumis (sans re-controle) pourrait depasser le disponible si le budget a ete consomme entre-temps.

---

### P0-3. Donnees migrees aberrantes (exercice 2024 a 335.9%)

**Donnees live depuis `v_kpi_paiement` :**

| Exercice | Dotation       | total_engage   | Taux engagement |
| -------- | -------------- | -------------- | --------------- |
| 2024     | 4 033 505 191  | 13 548 615 144 | **335.9%**      |
| 2025     | 8 139 978 967  | 7 292 830 176  | 89.6%           |
| 2026     | 11 394 200 019 | 0              | 0%              |

L'exercice 2024 presente un depassement de 9,5 milliards FCFA — les engagements migres depassent la dotation de plus de 3x. Cela fausse tous les dashboards et alertes budgetaires.

**total_paye est a 0 partout** — la reconciliation des reglements vers `budget_lines.total_paye` ne fonctionne pas pour les donnees migrees. Le taux d'execution global est donc systematiquement 0%.

---

### P0-4. Divergence formule disponible frontend vs backend

**Frontend** (`useEngagements.ts`, `calculateAvailability`) :

```
Disponible = dotation_initiale + virements_recus - virements_emis
           - SUM(engagements WHERE statut != 'annule' AND statut != 'rejete')
```

→ Inclut brouillons, soumis, differes dans le "consomme"
→ N'inclut PAS `montant_reserve`

**Backend RPC** (`check_budget_availability`) :

```
Disponible = dotation_initiale + virements_recus - virements_emis
           - SUM(engagements WHERE statut = 'valide')
           - montant_reserve
```

→ Ne compte que les `valide`
→ Inclut `montant_reserve`

**Consequence :** Un engagement peut etre autorise par le frontend (formule plus conservative, montant OK) mais la RPC backend dirait "budget depasse" (car elle inclut les reserves). Ou inversement : le frontend bloque (car il compte les brouillons) alors que le backend autoriserait.

---

## P1 — MAJEURS (Workflow incomplet ou donnees manquantes)

### P1-1. Validation 4 etapes : code complet, jamais executee

**Etapes implementees dans le code :**

| Ordre | Role | Label                                |
| ----- | ---- | ------------------------------------ |
| 1     | SAF  | Service Administratif et Financier   |
| 2     | CB   | Controleur Budgetaire                |
| 3     | DAF  | Directeur Administratif et Financier |
| 4     | DG   | Directeur General                    |

**Flux de validation (100% frontend, pas de RPC) :**

```
1. createMutation → statut='brouillon', current_step=0
   + INSERT 4 lignes dans engagement_validations (en_attente)

2. submitMutation → statut='soumis', current_step=1

3. validateMutation (pour chaque etape) :
   a. Lit current_step
   b. Verifie permission via RPC check_validation_permission()
   c. UPDATE engagement_validations SET status='valide'
   d. UPDATE budget_engagements SET current_step=step+1
   e. Si step >= 4 : statut='valide', workflow_status='termine'
      → Trigger SQL met a jour budget_lines.total_engage
```

**Delegations et interims :** Code complet (RPC `check_validation_permission` gere 3 modes), mais 0 delegations actives et 0 interims actifs en base.

**ATTENTION :** La table `engagement_validations` est **VIDE** (0 lignes). Aucun engagement n'a jamais traverse le workflow 4 etapes — tous les 2805 engagements sont des donnees migrees directement au statut `valide`.

**Les 2 Edge Functions de workflow (`validate-workflow`, `workflow-validation`) ne sont PAS appelees** par le hook useEngagements. Elles ne gerent pas le concept de 4 etapes.

### P1-2. Double trigger sur budget_lines (redondance)

**2 triggers se declenchent a chaque UPDATE sur `budget_engagements` :**

| Trigger                       | Migration      | Quand                        | Ce qu'il fait                                                                                         |
| ----------------------------- | -------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `trg_update_engagement_rate`  | 20260210100100 | AFTER UPDATE (statut change) | Recalcule `total_engage` + actions metier (budget_history, dossier_etapes, workflow_tasks, alertes)   |
| `trg_recalc_elop_engagements` | 20260211       | AFTER INSERT/UPDATE/DELETE   | Recalcule `total_engage` + `total_liquide` + `total_ordonnance` + `total_paye` + `disponible_calcule` |

Les 2 ecrivent `budget_lines.total_engage` avec la meme valeur (SUM WHERE statut = 'valide'). C'est redondant mais pas destructeur. L'ordre d'execution n'est pas garanti par PostgreSQL.

**10 triggers au total sur `budget_engagements` :**

| #   | Nom                                          | Timing                     | Role                                       |
| --- | -------------------------------------------- | -------------------------- | ------------------------------------------ |
| 1   | `trg_unified_ref_engagements`                | BEFORE INSERT              | Genere numero reference                    |
| 2   | `lock_code_engagements`                      | BEFORE UPDATE              | Verrouille code apres validation           |
| 3   | `trg_check_engagement_checklist`             | BEFORE UPDATE              | Verifie checklist documents avant `valide` |
| 4   | `trg_track_engagement_step_timing`           | BEFORE UPDATE              | Timestamps etapes                          |
| 5   | `trg_update_dossier_on_engagement`           | AFTER INSERT               | MAJ dossier etape courante                 |
| 6   | `trg_create_engagement_docs`                 | AFTER INSERT               | Cree checklist documents                   |
| 7   | `trg_workflow_task_engagement`               | AFTER INSERT/UPDATE statut | Cree tache workflow                        |
| 8   | `trg_update_dossier_on_engagement_validated` | AFTER UPDATE               | MAJ dossier si valide                      |
| 9   | `trg_update_engagement_rate`                 | AFTER UPDATE               | Budget + actions metier                    |
| 10  | `trg_recalc_elop_engagements`                | AFTER INSERT/UPDATE/DELETE | Recalcul ELOP complet                      |
| 11  | `trg_log_validation_engagements`             | AFTER UPDATE               | Audit log                                  |

### P1-3. Pas de concept "type d'engagement"

**Constat :** Le systeme ne distingue pas formellement :

- Engagement sur marche public (appel d'offres, passation formelle)
- Engagement hors marche (bon de commande direct, gre a gre)
- Engagement de fonctionnement vs investissement

**Pas de colonne `type_engagement`** dans `budget_engagements`. Le template d'export reference `type_engagement` comme colonne d'export → cellule vide.

**2 flux de creation existent** (PM et EB) mais la distinction est implicite :

- EB → peut etre avec ou sans marche
- PM → suppose un marche, mais le lien n'est pas ecrit (P0-1)

### P1-4. Notifications workflow non implementees

Les mutations `validate`, `reject`, `defer` dans `useEngagements.ts` ne dispatched AUCUNE notification. Contrairement au module Passation (certifie 100/100 avec pattern `dispatchNotifications`), aucune alerte n'est envoyee aux validateurs suivants ni au createur.

### P1-5. total_paye a 0 pour tous les exercices

La colonne `budget_lines.total_paye` est a 0 pour TOUS les exercices (2024, 2025, 2026), malgre l'existence de reglements dans la table `reglements`. Les triggers de reconciliation existent (`update_budget_and_close_dossier_on_reglement`) mais les donnees migrees ne les ont pas declenches.

**Impact :** Le taux d'execution global (`paye / dotation`) est systematiquement **0%** sur tous les dashboards.

---

## P2 — MINEURS (UI/UX, qualite)

### P2-1. Incoherence terminologique des taux

Le terme "Taux de consommation" designe 2 formules differentes selon le contexte :

| Contexte              | Formule                   | Fichier                   |
| --------------------- | ------------------------- | ------------------------- |
| Dashboard DG          | `engage / dotation * 100` | DashboardDG.tsx           |
| Dashboard KPI DAAF    | `engage / dotation * 100` | DashboardKPI.tsx          |
| Dashboard AICB        | `engage / dotation * 100` | DashboardAICB.tsx         |
| BudgetLineDetailSheet | `paye / dotation * 100`   | BudgetLineDetailSheet.tsx |
| BudgetLineTable       | `paye / dotation * 100`   | BudgetLineTable.tsx       |

**5 formules distinctes dans le systeme :**

| Taux                  | Formule                | Nombre d'endroits |
| --------------------- | ---------------------- | ----------------- |
| Taux d'engagement     | `engage / dotation`    | 8+ fichiers       |
| Taux de liquidation   | `liquide / engage`     | 5+ fichiers       |
| Taux d'ordonnancement | `ordonnance / liquide` | 5+ fichiers       |
| Taux de paiement      | `paye / ordonnance`    | 5+ fichiers       |
| Taux d'execution      | `paye / dotation`      | 6+ fichiers       |

### P2-2. Donnees migrees invisibles dans l'UI

**70%+ des engagements** ont `created_by = NULL` (donnees migrees). La RLS policy `engagements_select` filtre par :

```sql
created_by = auth.uid() OR direction_id = get_user_direction_id()
```

→ Les enregistrements sans `created_by` ne matchent pas `auth.uid()` et, si `direction_id` est aussi NULL, sont invisibles.

La page /engagements affiche **0** engagements pour 2026 alors que la table en contient 182.

### P2-3. RLS policy : pas de DELETE, UPDATE trop restrictive

| Policy | Condition                                                                                      | Probleme                                                                                                                                     |
| ------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| DELETE | **AUCUNE**                                                                                     | Suppression impossible pour tous (y compris admin via UI)                                                                                    |
| UPDATE | `is_admin() OR is_cb() OR (created_by = auth.uid() AND statut IN ('brouillon', 'en_attente'))` | Le DAF et le DG ne peuvent PAS mettre a jour un engagement via UPDATE direct (ils passent par la mutation validate qui fait un UPDATE cible) |

**Note :** Le DAF et DG validant via `useEngagements.validateMutation` doivent avoir le role CB ou ADMIN selon la policy UPDATE. Mais le hook fait un UPDATE sur `budget_engagements` → si le DAF n'est pas aussi CB, la policy RLS pourrait bloquer l'UPDATE.

### P2-4. Template export reference colonne inexistante

Le fichier `src/lib/export/export-templates.ts` (ligne 163) reference `type_engagement` comme colonne d'export, mais cette colonne n'existe pas dans `budget_engagements`. La cellule sera toujours vide dans les exports.

---

## ARCHITECTURE BUDGET — VUE D'ENSEMBLE

```
                         FRONTEND (React)
                              │
                    calculateAvailability()
                   [Formule conservative :
                    inclut brouillons/soumis]
                              │
                     ┌────────┴────────┐
                     │  createMutation  │
                     │  (HARD BLOCK)    │
                     └────────┬────────┘
                              │
                     INSERT budget_engagements
                     statut = 'brouillon'
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     BEFORE INSERT     AFTER INSERT     AFTER INSERT
     trg_unified_ref   trg_update_      trg_create_
     (genere numero)   dossier_on_eng   engagement_docs
                       (MAJ dossier)    (cree checklist)
                              │
                    submitMutation
                    statut = 'soumis'
                    [PAS de re-verification budget]
                              │
                    validateMutation (x4 etapes)
                    [SAF → CB → DAF → DG]
                              │
                     UPDATE budget_engagements
                     statut = 'valide' (etape 4)
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     AFTER UPDATE      AFTER UPDATE     AFTER UPDATE
     trg_update_       trg_recalc_      trg_log_
     engagement_rate   elop_engage      validation
     │                 │                (audit)
     │                 │
     ├─ MAJ total_engage    ├─ MAJ total_engage (redondant)
     ├─ budget_history      ├─ MAJ total_liquide
     ├─ dossier_etapes      ├─ MAJ total_ordonnance
     ├─ workflow_tasks       ├─ MAJ total_paye
     └─ alertes (>=80%)     └─ MAJ disponible_calcule
```

---

## RLS POLICIES — ETAT ACTUEL

| Table                    | SELECT                                     | INSERT                                         | UPDATE                                             | DELETE           |
| ------------------------ | ------------------------------------------ | ---------------------------------------------- | -------------------------------------------------- | ---------------- |
| `budget_engagements`     | admin OR dg OR cb OR createur OR direction | admin OR `can_create_in_module('engagements')` | admin OR cb OR (createur AND brouillon/en_attente) | **AUCUNE**       |
| `engagement_validations` | (non investigue)                           | (non investigue)                               | (non investigue)                                   | (non investigue) |

---

## MATRICE DE RISQUE

```
Impact ──────────────────────────────────►
  │
  │  P0-2 Pas d'enforce-   P0-1 FK passation
  │  ment backend budget    jamais ecrite
  │                         P0-3 Donnees 335.9%
H │                         P0-4 Divergence formule
  │
  │  P1-4 Notifications     P1-1 Workflow jamais
  │  absentes               teste en production
M │  P1-3 Pas de type       P1-5 total_paye = 0
  │  engagement             P1-2 Double trigger
  │
  │  P2-4 Template export   P2-1 Incoherence taux
L │  colonne inexistante    P2-2 Donnees invisibles
  │                         P2-3 RLS DAF/DG
  │
  └──L──────────M──────────H──────────────
                Probabilite
```

---

## RECOMMANDATIONS PAR PRIORITE

### P0 — A corriger AVANT mise en production

| #    | Action                                                                         | Fichiers                                                              | Effort |
| ---- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------ |
| P0-1 | Ajouter `passation_marche_id` dans createMutation + formulaires                | `useEngagements.ts`, `EngagementFromPMForm.tsx`, `EngagementForm.tsx` | 1h     |
| P0-2 | Ajouter trigger BEFORE INSERT/UPDATE qui verifie `check_budget_availability`   | Migration SQL                                                         | 2h     |
| P0-3 | Auditer donnees migrees 2024 — corriger dotations ou marquer comme historiques | Migration SQL                                                         | 3h     |
| P0-4 | Unifier la formule de disponible (frontend = backend)                          | `useEngagements.ts`, migration SQL                                    | 2h     |

### P1 — A corriger dans les 2 sprints suivants

| #    | Action                                                                            | Fichiers                            | Effort |
| ---- | --------------------------------------------------------------------------------- | ----------------------------------- | ------ |
| P1-1 | Tester le workflow complet E2E (creer → soumettre → valider 4x → verifier budget) | E2E test                            | 4h     |
| P1-2 | Rationaliser les 2 triggers (fusionner ou desactiver le plus ancien)              | Migration SQL                       | 2h     |
| P1-3 | Ajouter colonne `type_engagement` (marche/hors_marche/fonctionnement)             | Migration SQL + UI                  | 4h     |
| P1-4 | Implementer notifications workflow (pattern dispatch comme Passation)             | `useEngagements.ts` + notifications | 3h     |
| P1-5 | Reconcilier total_paye pour les donnees migrees                                   | Migration SQL                       | 3h     |

### P2 — Ameliorations qualite

| #    | Action                                                                  | Fichiers            | Effort |
| ---- | ----------------------------------------------------------------------- | ------------------- | ------ |
| P2-1 | Standardiser le vocabulaire (engagement ≠ execution ≠ consommation)     | 20+ fichiers        | 2h     |
| P2-2 | Adapter RLS SELECT pour inclure `legacy_import = true`                  | Migration SQL       | 1h     |
| P2-3 | Ajouter policy UPDATE pour DAF/DG + policy DELETE pour admin            | Migration SQL       | 1h     |
| P2-4 | Retirer `type_engagement` du template export (ou creer la colonne P1-3) | export-templates.ts | 15min  |

---

## METRIQUES DU DIAGNOSTIC

| Metrique                               | Valeur                     |
| -------------------------------------- | -------------------------- |
| Points investigues                     | 6                          |
| Constats P0                            | 4                          |
| Constats P1                            | 5                          |
| Constats P2                            | 4                          |
| Triggers sur budget_engagements        | 11                         |
| RLS policies                           | 3 (SELECT, INSERT, UPDATE) |
| Fonctions SQL budget                   | 6+                         |
| Taux consommation (endroits de calcul) | 20+                        |
| Engagements avec FK chaine peuplee     | 0/2805                     |
| engagement_validations (lignes)        | 0                          |
| Effort total P0                        | ~8h                        |
| Effort total P1                        | ~16h                       |
| Effort total P2                        | ~4h                        |

---

_ARTI = Autorite de Regulation du Transport Interieur (Cote d'Ivoire)_
_Document genere le 19/02/2026 — SYGFP v2.0_
