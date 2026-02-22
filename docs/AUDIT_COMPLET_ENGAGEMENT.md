# AUDIT COMPLET — Module Engagement Budgetaire

**Date :** 19 fevrier 2026
**Module :** Engagement Budgetaire (Etape 6/9 — Chaine de depense)
**Statut :** AUDIT (pas encore certifie)
**Score :** **63/100**

---

## 1. SCORE DETAILLE

| Critere                      | Poids   | Score      | Details                                                            |
| ---------------------------- | ------- | ---------- | ------------------------------------------------------------------ |
| Frontend — Composants & Hook | 20      | **18/20**  | Hook 769L mature, 11 composants, 2 pages, scanning, forms          |
| Backend — Table & Schema     | 15      | **10/15**  | 34 colonnes, FK budget_line 100%, FK chaine 0%                     |
| Workflow 4 etapes            | 15      | **12/15**  | Mutations implementees, delegation/interim, table validations vide |
| RBAC & Securite              | 10      | **8/10**   | PermissionGuard OK, route non protegee par guard                   |
| Tests dedies                 | 15      | **2/15**   | 0 test unitaire, 0 test E2E dedie engagement                       |
| Donnees & Migration          | 10      | **5/10**   | 5663 lignes, 100% valide (migration), FK optionnelles vides        |
| Documents & Checklist        | 10      | **8/10**   | 8 types, upload, verification, manque service export dedie         |
| Notifications                | 5       | **0/5**    | Non implementees dans les mutations                                |
| **TOTAL**                    | **100** | **63/100** | **Module mature mais 7 gaps ouverts**                              |

---

## 2. INVENTAIRE FRONTEND

### 2.1 Fichiers (16 fichiers, ~5 268 lignes)

| Categorie     | Fichier                               | Lignes | Description                                |
| ------------- | ------------------------------------- | ------ | ------------------------------------------ |
| **Hook**      | `src/hooks/useEngagements.ts`         | 769    | CRUD + mutations + workflow + budget calc  |
| **Hook**      | `src/hooks/useEngagementDocuments.ts` | 255    | Documents, checklist, upload, verification |
| **Page**      | `src/pages/Engagements.tsx`           | 579    | Liste, KPIs, onglets, formulaires, dialogs |
| **Page**      | `src/pages/ScanningEngagement.tsx`    | 845    | Numerisation documents, filtres, stats     |
| **Composant** | `EngagementForm.tsx`                  | 421    | Creation depuis expression besoin          |
| **Composant** | `EngagementFromPMForm.tsx`            | 433    | Creation depuis passation signee           |
| **Composant** | `EngagementChecklist.tsx`             | 550    | Checklist 8 types documents                |
| **Composant** | `EngagementTimeline.tsx`              | 340    | Timeline 4 etapes validation               |
| **Composant** | `EngagementDetails.tsx`               | 334    | Vue complete avec tabs                     |
| **Composant** | `EngagementList.tsx`                  | 213    | Tableau avec actions contextuelles         |
| **Composant** | `PieceEngagement.tsx`                 | 167    | Detail piece jointe                        |
| **Composant** | `EngagementPrintDialog.tsx`           | 119    | Impression PDF                             |
| **Composant** | `EngagementDeferDialog.tsx`           | 92     | Dialog report avec deadline                |
| **Composant** | `EngagementValidateDialog.tsx`        | 80     | Dialog validation                          |
| **Composant** | `EngagementRejectDialog.tsx`          | 75     | Dialog rejet avec motif                    |

### 2.2 Hook principal `useEngagements.ts` — Cartographie complete

#### Types exportes

```
Engagement { id, numero, objet, montant, montant_ht, tva, fournisseur,
             date_engagement, statut, workflow_status, current_step,
             budget_line_id, expression_besoin_id, marche_id, note_id,
             exercice, created_by, created_at, updated_at,
             date_differe, motif_differe, differe_by, deadline_correction,
             required_documents, + relations imbriquees }

BudgetAvailability { dotation_initiale, virements_recus, virements_emis,
                     dotation_actuelle, engagements_anterieurs,
                     engagement_actuel, cumul, disponible, is_sufficient }
```

#### Queries (3)

| QueryKey                                   | Table                | Filtres       | Joins                                                      |
| ------------------------------------------ | -------------------- | ------------- | ---------------------------------------------------------- |
| `['engagements', exerciceId]`              | `budget_engagements` | exercice      | budget_line, direction, expression_besoin, marche, creator |
| `['passations-validees-pour-engagement']`  | `passation_marche`   | statut=valide | expression_besoin, direction, prestataire_retenu           |
| `['expressions-validees-pour-engagement']` | `expressions_besoin` | statut=valide | direction, marche, prestataire                             |

#### Mutations (7)

| Mutation   | Action                                     | Workflow                        |
| ---------- | ------------------------------------------ | ------------------------------- |
| `create`   | Insert + validation_steps + dossier_etapes | → brouillon                     |
| `submit`   | statut=soumis, step=1                      | brouillon → soumis              |
| `validate` | Avance etape (SAF→CB→DAF→DG)               | soumis → en_validation → valide |
| `reject`   | statut=rejete + raison                     | soumis → rejete                 |
| `defer`    | statut=differe + motif + deadline          | soumis → differe                |
| `resume`   | statut=soumis                              | differe → soumis                |
| `update`   | Modification + audit trail                 | Champs verrouilles traces       |

#### Fonctions utilitaires

- `calculateAvailability(budgetLineId, amount, excludeId?)` — Formule budget
- `generateNumero()` — RPC `get_next_sequence('ENG', exercice, 'global')`
- `getValidationSteps(engagementId)` — Retourne 4 etapes avec noms validateurs
- `checkValidationPermission()` — Delegations + Interims

#### Constantes

- `VALIDATION_STEPS` : 4 etapes (SAF ord=1, CB ord=2, DAF ord=3, DG ord=4)
- Filtres : `engagementsAValider`, `engagementsValides`, `engagementsRejetes`, `engagementsDifferes`

### 2.3 Page `Engagements.tsx` — 579 lignes

**KPIs :** Total | Montant total | A valider | Valides | Rejetes

**6 Onglets :**

| Onglet    | Contenu                        | Actions                   |
| --------- | ------------------------------ | ------------------------- |
| A traiter | Passations validees en attente | Bouton "Creer engagement" |
| Tous      | EngagementList complet         | CRUD standard             |
| A valider | Engagements en_validation      | Valider/Rejeter/Differer  |
| Valides   | Tableau custom                 | "Creer liquidation"       |
| Rejetes   | EngagementList filtre          | Consultation              |
| Differes  | EngagementList filtre          | "Reprendre"               |

**Dialogs integres :** Form, FromPMForm, Details, Validate, Reject, Defer, Print

### 2.4 Page `ScanningEngagement.tsx` — 845 lignes

- Numerisation documents pour engagements brouillon/soumis
- Stats : Total dossiers, Complets, Incomplets, % completion
- Filtres : Recherche, Direction, Activite, Statut documents
- 2 onglets : A scanner | Soumis
- Export : Excel, PDF, CSV, Print
- Integration EngagementChecklist

### 2.5 Routes

```
/engagements                      → Engagements.tsx (lazy loaded)
/execution/scanning-engagement    → ScanningEngagement.tsx (lazy loaded)
```

Parametre URL : `?sourcePM={id}` → ouvre EngagementFromPMForm

### 2.6 RBAC

```
/engagements: allowedProfiles: [ADMIN, DG, DAAF, CB, DIRECTEUR, AUDITEUR]

engagement.create:   SAF=own, CB=service, DAF=direction
engagement.submit:   SAF=own
engagement.validate: CB=all
engagement.reject:   CB=all, DAF=all, DG=all
engagement.defer:    CB=all, DAF=all, DG=all
engagement.resume:   SAF=own, DAF=direction
```

---

## 3. INVENTAIRE BACKEND

### 3.1 Table `budget_engagements` — 34 colonnes

| Colonne                | Type        | Peuplee  | Description                 |
| ---------------------- | ----------- | -------- | --------------------------- |
| id                     | uuid PK     | 100%     | Identifiant                 |
| numero                 | text        | 100%     | ENG-YYYY-NNNN ou MIG-ENG-\* |
| objet                  | text        | 100%     | Objet                       |
| montant                | numeric     | 100%     | Montant TTC                 |
| montant_ht             | numeric     | partiel  | Montant HT                  |
| tva                    | numeric     | partiel  | TVA                         |
| fournisseur            | text        | 100%     | Raison sociale              |
| date_engagement        | date        | 100%     | Date                        |
| statut                 | text        | 100%     | **100% = valide**           |
| workflow_status        | text        | 100%     | en_cours                    |
| current_step           | integer     | 100%     | Etape courante              |
| budget_line_id         | uuid FK     | **100%** | Ligne budgetaire            |
| expression_besoin_id   | uuid FK     | **0%**   | JAMAIS peuple               |
| marche_id              | uuid FK     | **0%**   | JAMAIS peuple               |
| passation_marche_id    | uuid FK     | **0%**   | JAMAIS peuple               |
| dossier_id             | uuid FK     | **0%**   | JAMAIS peuple               |
| note_id                | uuid FK     | 0%       | Note DG                     |
| project_id             | uuid FK     | 0%       | Projet                      |
| exercice               | integer     | 100%     | Exercice                    |
| created_by             | uuid FK     | ~30%     | NULL pour migrations        |
| legacy_import          | boolean     | 100%     | 70.6% = true                |
| checklist_complete     | boolean     | 100%     | false                       |
| code_locked            | boolean     | 100%     | false                       |
| required_documents     | jsonb       | partiel  | Documents requis            |
| motif_differe          | text        | 0%       | Aucun differe               |
| date_differe           | date        | 0%       | Aucun differe               |
| differe_by             | uuid        | 0%       | Aucun differe               |
| deadline_correction    | timestamptz | 0%       | Aucune correction           |
| checklist_verified_by  | uuid        | 0%       | Non verifie                 |
| checklist_verified_at  | timestamptz | 0%       | Non verifie                 |
| date_entree_etape      | timestamptz | partiel  | Date entree                 |
| delai_validation_jours | integer     | partiel  | Delai                       |
| created_at             | timestamptz | 100%     | Date creation               |
| updated_at             | timestamptz | 100%     | Date modification           |

### 3.2 Donnees — 5 663 lignes

#### Par statut

| Statut    | Nombre | %    |
| --------- | ------ | ---- |
| valide    | 5 663  | 100% |
| brouillon | 0      | 0%   |
| soumis    | 0      | 0%   |
| rejete    | 0      | 0%   |
| differe   | 0      | 0%   |
| annule    | 0      | 0%   |

**CONSTAT :** 100% des engagements sont au statut "valide" — donnees 100% issues de la migration SQL Server.

#### Par exercice

| Exercice | Nombre | %     |
| -------- | ------ | ----- |
| 2024     | 2 156  | 38.1% |
| 2025     | 3 325  | 58.7% |
| 2026     | 182    | 3.2%  |

#### FK chaine peuplees

| FK                   | Peuplees | %        |
| -------------------- | -------- | -------- |
| budget_line_id       | 5 663    | **100%** |
| passation_marche_id  | 0        | **0%**   |
| expression_besoin_id | 0        | **0%**   |
| dossier_id           | 0        | **0%**   |
| marche_id            | 0        | **0%**   |

### 3.3 Table `engagement_validations`

**Resultat : TABLE VIDE (0 lignes)**

Colonnes : id, engagement_id, step_order, role, status, validated_by, validated_at, comments, validation_mode, validated_on_behalf_of

### 3.4 Tables en aval

| Table aval          | FK vers engagement      | Lignes liees |
| ------------------- | ----------------------- | ------------ |
| budget_liquidations | engagement_id           | 3 633+       |
| ordonnancements     | (via liquidation_id)    | 3 363+       |
| reglements          | (via ordonnancement_id) | 0            |

### 3.5 Migrations engagement

**74 fichiers SQL** referancant "engagement" dans `supabase/migrations/`.

Principales :

- `20260105*` : Creation initiale
- `20260106-07*` : Structure, contraintes, workflow
- `20260116-17*` : Refonte
- `20260118*` : RLS/RBAC socle, dossier pivot
- `20260204*` : Fix contrainte statut
- `20260210*` : Fix liberation credits, triggers totaux
- `20260211*` : Automatisation ELOP

### 3.6 Edge Functions referancant engagement (8)

| Fonction                 | Usage               |
| ------------------------ | ------------------- |
| bulk-operations          | Operations groupees |
| generate-bordereau       | Bordereau           |
| generate-dashboard-stats | Stats dashboard     |
| generate-export          | Exports             |
| generate-report          | Rapports            |
| process-reglement        | Reglements          |
| validate-workflow        | Validation workflow |
| workflow-validation      | Validation workflow |

---

## 4. RESULTATS QA

### 4.1 Non-regression

| Check              | Resultat                                 |
| ------------------ | ---------------------------------------- |
| `npx tsc --noEmit` | **0 erreurs** (0 specifiques engagement) |
| `npx vite build`   | **OK** (build reussi)                    |
| `npx vitest run`   | **369/369 PASS**                         |

### 4.2 Page /engagements — Playwright

**Login DAAF (daaf@arti.ci) :**

- Page charge : **OUI** (0 erreurs console)
- KPIs visibles : Total(0), Montant total(0 FCFA), A valider(0), Valides(0), Rejetes(0)
- 6 onglets : A traiter, Tous, A valider, Valides, Rejetes, Differes
- Barre chaine : SEF > AEF > Besoin > Marche > **Engage** > Liquid. > Ordo. > Regl.
- Bouton "Nouvel engagement" : **Visible** (DAAF autorise)
- Dialog creation : **S'ouvre** avec combobox "Expression de besoin validee"
- Recherche : **Presente** ("Rechercher par numero, objet ou fournisseur...")
- Export Excel : **Bouton present**

**Login Agent DSI (agent.dsi@arti.ci) :**

- Page charge : **OUI** (URL directe fonctionne)
- Bouton "Nouvel engagement" : **MASQUE** (PermissionGuard bloque)
- Sidebar : Engagement **ABSENT** du menu pour cet utilisateur
- RBAC verification : **OK** (lecture seule de fait)

### 4.3 Tests existants engagement

| Type             | Fichiers                 | Tests dedies     |
| ---------------- | ------------------------ | ---------------- |
| Unit (Vitest)    | 3 mentions peripheriques | **0 test dedie** |
| E2E (Playwright) | 6 mentions peripheriques | **0 spec dedie** |

**Mentions peripheriques :**

- `example.test.ts` : reference dans items navigation
- `passation-utils.test.ts` : test `engagement_possible`
- `qrcode-utils.test.ts` : test type ENGAGEMENT dans QR codes
- `prompt13-qr-chain-badge.spec.ts` : test navigation vers /engagements
- `prompt9-lifecycle.spec.ts` : test lien "Creer engagement" depuis marche signe

### 4.4 Donnees non visibles en UI

**CONSTAT CRITIQUE :** La page affiche 0 engagements pour 2026, alors que la table en contient 182. Cause : les enregistrements migres ont `created_by = NULL`, ce qui les rend probablement invisibles via les policies RLS qui filtrent par `auth.uid()`.

---

## 5. GAPS IDENTIFIES (7)

### Gap 1 : FK `passation_marche_id` non peuple (CRITIQUE)

- **Fichier :** `EngagementFromPMForm.tsx`
- **Probleme :** `marche_id: undefined` (ligne ~146) au lieu de passer `passation.id`
- **Impact :** Engagement cree mais lien vers la passation perdu
- **Solution :** Ajouter `passation_marche_id: passation.id` dans createMutation

### Gap 2 : 0 tests dedies engagement (CRITIQUE)

- **Probleme :** Pas de fichier `engagement.test.ts` ni `engagement.spec.ts`
- **Impact :** Aucune couverture de test pour le module
- **Solution :** Creer `src/test/engagement-utils.test.ts` (65+ tests) et `e2e/engagement-complete.spec.ts`

### Gap 3 : Notifications workflow non implementees (MAJEUR)

- **Probleme :** Les mutations validate/reject/defer n'envoient pas de notifications
- **Impact :** Les validateurs ne sont pas alertes des engagements en attente
- **Solution :** Ajouter `dispatchNotifications()` pattern (comme passation) dans chaque mutation

### Gap 4 : Donnees migrees invisibles en UI (MAJEUR)

- **Probleme :** `created_by = NULL` sur 70%+ des enregistrements → RLS les filtre
- **Impact :** 5 663 engagements existent en base mais ne s'affichent pas
- **Solution :** Adapter la policy RLS SELECT pour inclure les donnees `legacy_import=true`

### Gap 5 : Pas de pagination serveur (MOYEN)

- **Probleme :** Queries sans `.range()` ni `{ count: 'exact' }`
- **Impact :** Performance degradee si > 1000 engagements par exercice
- **Solution :** Ajouter pagination comme `useImputations.ts` pattern

### Gap 6 : Navigation retour Engagement → Passation (MOYEN)

- **Probleme :** Pas de `EngagementChainNav` ni de lien cliquable vers la passation source
- **Impact :** Navigation chaine incomplete
- **Solution :** Creer composant similaire a `PassationChainNav`

### Gap 7 : Route non protegee par RBACRouteGuard (MINEUR)

- **Probleme :** `RBACRouteGuard` existe mais n'est pas applique a `/engagements`
- **Impact :** Acces URL directe possible pour profils non autorises (lecture seule de fait)
- **Solution :** Wrapper la route avec `<RBACRouteGuard allowedProfiles={[...]}>`

---

## 6. FONCTIONNALITES IMPLEMENTEES

| Fonctionnalite                       | Statut | Details                                                      |
| ------------------------------------ | ------ | ------------------------------------------------------------ |
| Creation depuis Expression Besoin    | ✅     | EngagementForm.tsx                                           |
| Creation depuis Passation Marche     | ⚠️     | EngagementFromPMForm.tsx (marche_id bug)                     |
| Workflow 4 etapes SAF→CB→DAF→DG      | ✅     | Mutations implementees                                       |
| Delegation support                   | ✅     | checkValidationPermission + validation_mode                  |
| Interim support                      | ✅     | validated_on_behalf_of                                       |
| Calcul disponibilite budget          | ✅     | calculateAvailability()                                      |
| Generation reference ENG-YYYY-NNNN   | ✅     | RPC get_next_sequence                                        |
| Document checklist (8 types)         | ✅     | useEngagementDocuments + EngagementChecklist                 |
| Upload fichiers                      | ✅     | PDF, JPEG, PNG, GIF, WEBP (max 10Mo)                         |
| Verification documents               | ✅     | verified_by, verified_at                                     |
| Block submit si checklist incomplete | ✅     | isComplete check                                             |
| Timeline validation                  | ✅     | EngagementTimeline.tsx                                       |
| Detail avec tabs                     | ✅     | Details, Documents, Checklist, Validation, Timeline, Dossier |
| Impression                           | ✅     | EngagementPrintDialog.tsx                                    |
| Export Excel/PDF/CSV                 | ✅     | Boutons presents via ExportButtons                           |
| Recherche multi-champs               | ✅     | numero, objet, fournisseur                                   |
| 6 onglets par statut                 | ✅     | A traiter, Tous, A valider, Valides, Rejetes, Differes       |
| KPIs                                 | ✅     | 5 KPIs avec badges                                           |
| Scanning documents                   | ✅     | ScanningEngagement.tsx (845 lignes)                          |
| RBAC PermissionGuard                 | ✅     | Boutons conditionels par role                                |
| Audit trail                          | ✅     | useAuditLog() sur toutes les mutations                       |
| Lien vers liquidation                | ✅     | Bouton "Creer liquidation" dans onglet Valides               |
| Notifications                        | ❌     | Non implementees                                             |
| Pagination serveur                   | ❌     | Non implementee                                              |
| Tests dedies                         | ❌     | 0 tests                                                      |
| Navigation chaine retour             | ❌     | Pas de composant ChainNav                                    |

---

## 7. COMPARAISON AVEC LES MODULES CERTIFIES

| Critere              | Passation (100/100)  | Engagement (63/100)   | Ecart    |
| -------------------- | -------------------- | --------------------- | -------- |
| Tests unitaires      | 94                   | 0                     | -94      |
| Tests E2E            | 66+                  | 0                     | -66      |
| FK chaine peuplees   | 100%                 | 0% (sauf budget_line) | Critique |
| Notifications        | ✅ Pattern dispatch  | ❌ Non implementees   | Majeur   |
| Pagination serveur   | ✅ .range() + count  | ❌ Tout en memoire    | Moyen    |
| Navigation chaine    | ✅ PassationChainNav | ❌ Pas de composant   | Moyen    |
| RLS donnees visibles | ✅ Fonctionnel       | ❌ Migrees invisibles | Majeur   |

---

## 8. RECOMMANDATIONS (10 prompts)

| Prompt | Priorite | Description                                               |
| ------ | -------- | --------------------------------------------------------- |
| 1      | **P0**   | FK passation_marche_id + pre-remplissage depuis PM        |
| 2      | **P0**   | RLS fix donnees migrees + visibilite en UI                |
| 3      | **P1**   | Notifications workflow (dispatch + email Edge Function)   |
| 4      | **P1**   | Pagination serveur + filtrage cote serveur                |
| 5      | **P1**   | Navigation chaine (EngagementChainNav) + retour PM        |
| 6      | **P2**   | Detail enrichi (onglet budget, onglet passation source)   |
| 7      | **P2**   | Exports dedies (Excel multi-feuilles, PDF engagement, PV) |
| 8      | **P2**   | RBACRouteGuard + securite RLS refinee                     |
| 9      | **P3**   | Tests unitaires (65+ tests)                               |
| 10     | **P3**   | Tests E2E + certification CERTIFICATION_ENGAGEMENT.md     |

---

## 9. METRIQUES RESUME

| Metrique                | Valeur            |
| ----------------------- | ----------------- |
| Fichiers frontend       | 16                |
| Lignes de code frontend | ~5 268            |
| Colonnes table          | 34                |
| Enregistrements         | 5 663             |
| Mutations hook          | 7 + 3 (documents) |
| Composants              | 11                |
| Pages                   | 2                 |
| Hooks                   | 2                 |
| Migrations SQL          | 74                |
| Edge Functions          | 8                 |
| Tests dedies            | **0**             |
| Gaps ouverts            | **7**             |
| Score                   | **63/100**        |

---

_ARTI = Autorite de Regulation du Transport Interieur (Cote d'Ivoire)_
_Document genere le 19/02/2026 — SYGFP v2.0_
