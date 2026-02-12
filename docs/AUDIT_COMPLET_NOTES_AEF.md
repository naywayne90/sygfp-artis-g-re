# AUDIT COMPLET - Module Notes AEF (Notes A Effet Financier)

> **Date:** 12 fevrier 2026 | **Version:** 2.0 | **Methode:** Audit parallele 3 agents (Frontend, Backend, QA)
> **Perimetre:** Route `/notes-aef`, table `notes_dg`, 18+ fichiers frontend, ~7,950 lignes
> **NE MODIFIE AUCUN FICHIER** — Audit lecture seule

---

## SCORE DE SANTE GLOBAL : 69/100

| Domaine   | Score  | Poids | Pondere           |
| --------- | ------ | ----- | ----------------- |
| Frontend  | 72/100 | 40%   | 28.8              |
| Backend   | 68/100 | 35%   | 23.8              |
| QA        | 68/100 | 25%   | 17.0              |
| **TOTAL** |        |       | **69.6 → 69/100** |

### Verdict

Le module Notes AEF est **fonctionnel et utilisable en production** avec une architecture frontend solide (machine a etats formelle, pagination server-side, export Excel, 6 KPIs). Les faiblesses majeures sont : **RLS policies superposees** (3 migrations conflictuelles), **zero couverture de tests**, **deleteNote sans RBAC**, **bug setIsSubmitting**, **table lignes_estimatives_aef absente**, et **absence de delegation/interim** pour la validation.

---

## TOP 10 CORRECTIONS PRIORITAIRES

| #   | Prio | Domaine  | Description                                                                                                                                                                                              | Fichier(s)                                         | Effort |
| --- | ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------ |
| 1   | P0   | Backend  | **Clarifier les RLS policies** : 6-7 policies SELECT/UPDATE superposees sur notes_dg venant de 3 migrations. Creer UNE migration qui DROP ALL + recree 4 policies claires (SELECT/INSERT/UPDATE/DELETE). | `supabase/migrations/`                             | Moyen  |
| 2   | P0   | Frontend | **Ajouter RBAC + audit a `deleteNote`** : tout utilisateur peut supprimer n'importe quelle note, sans trace. Verifier `created_by === uid && statut === 'brouillon'` + logAction.                        | `useNotesAEF.ts:1066`                              | Faible |
| 3   | P0   | Frontend | **Corriger bug `setIsSubmitting(true)` → `false`** dans `handleDelete` finally block. Boutons verrouilles en cas d'erreur suppression.                                                                   | `NoteAEFDetail.tsx:332`                            | Faible |
| 4   | P0   | Backend  | **Appliquer migration `lignes_estimatives_aef`** en base Supabase. ~740 lignes de code frontend mortes. L'editeur de lignes estimatives ne fonctionne pas.                                               | `20260118120000_create_aef_lignes_estimatives.sql` | Faible |
| 5   | P0   | QA       | **Ajouter tests unitaires** pour les 4 hooks AEF (useNotesAEF, useNotesAEFList, useNotesAEFExport, useLignesEstimativesAEF). Couverture actuelle : 0%.                                                   | Nouveaux fichiers test                             | Eleve  |
| 6   | P1   | Frontend | **Integrer delegation/interim** : les interimaires du DG ne peuvent PAS valider les AEF. Integrer `checkValidationPermission` comme le module SEF.                                                       | `useNotesAEF.ts`                                   | Moyen  |
| 7   | P1   | Frontend | **Ajouter notifications** : les validateurs ne sont PAS notifies quand une AEF est soumise. Brancher sur le systeme de notifications existant.                                                           | `useNotesAEF.ts`                                   | Moyen  |
| 8   | P1   | Backend  | **Supprimer doublon FK** `budget_line_id` / `ligne_budgetaire_id` : deux colonnes FK vers la meme table `budget_lines`.                                                                                  | Migration SQL                                      | Faible |
| 9   | P1   | Backend  | **Ajouter contraintes NOT NULL + CHECK** : `exercice` et `statut` sont nullable sans CHECK. Ajouter `statut NOT NULL DEFAULT 'brouillon' CHECK(...)` et `exercice NOT NULL`.                             | Migration SQL                                      | Faible |
| 10  | P2   | Frontend | **Corriger export filter** : `a_imputer: 'valide'` devrait etre `a_imputer: 'a_imputer'`. L'onglet "A imputer" exporte les mauvaises notes.                                                              | `useNotesAEFExport.ts:55`                          | Faible |

---

## A. AUDIT FRONTEND (72/100)

### A.1. Inventaire des fichiers (18 fichiers, ~6,854 lignes)

**Hooks (3 fichiers, 1,784 lignes)**
| Fichier | Lignes | Role |
|---------|--------|------|
| `src/hooks/useNotesAEF.ts` | 1,119 | Hook principal (CRUD, workflow, 5 queries + 8 mutations) |
| `src/hooks/useNotesAEFList.ts` | 240 | Liste paginee server-side avec debounce 300ms |
| `src/hooks/useNotesAEFExport.ts` | 425 | Export Excel avec filtres et permissions |

**Pages (3 fichiers, 2,273 lignes)**
| Fichier | Lignes | Role |
|---------|--------|------|
| `src/pages/NotesAEF.tsx` | 476 | Page principale (6 KPIs, 6 onglets, filtres, pagination) |
| `src/pages/NoteAEFDetail.tsx` | 1,111 | Page detail (workflow, PJ, historique, access control) |
| `src/pages/ValidationNotesAEF.tsx` | 686 | File validation DG/DAAF (3 onglets) |

**Composants (8 fichiers, 3,120 lignes)**
| Fichier | Lignes | Role |
|---------|--------|------|
| `src/components/notes-aef/NoteAEFForm.tsx` | 884 | Formulaire creation/edition + pre-remplissage SEF |
| `src/components/notes-aef/NoteAEFImputeDialog.tsx` | 664 | Dialog imputation budgetaire avance |
| `src/components/notes-aef/NoteAEFList.tsx` | 481 | Tableau avec skeleton/empty/error states |
| `src/components/notes-aef/LignesEstimativesEditor.tsx` | 471 | Editeur lignes estimatives (CRUD) |
| `src/components/notes-aef/NoteAEFDetails.tsx` | 393 | Quick-view dialog |
| `src/components/notes-aef/NoteAEFRejectDialog.tsx` | 99 | Dialog de rejet |
| `src/components/notes-aef/NoteAEFDeferDialog.tsx` | 122 | Dialog de report |
| `src/components/notes-aef/index.ts` | 6 | Barrel exports |

**Lib (3 fichiers, 522 lignes)**
| Fichier | Lignes | Role |
|---------|--------|------|
| `src/lib/notes-aef/constants.ts` | 227 | Machine a etats formelle, roles, audit actions |
| `src/lib/notes-aef/notesAefService.ts` | 193 | Service data layer (RPC paginated search) |
| `src/lib/notes-aef/types.ts` | 102 | Types TypeScript (NoteAEFEntity, Counts, Filters) |

**Bridge (1 fichier)**
| Fichier | Lignes | Role |
|---------|--------|------|
| `src/components/notes-sef/NoteSEFCreateAEFButton.tsx` | 152 | Bridge SEF → AEF (3 variantes UI) |

**TOTAL : 24 fichiers, ~8,983 lignes** (incluant doc et integration SEF)

### A.2. Architecture useNotesAEF.ts (1,119 lignes)

- **5 queries** : notes AEF, directions, notes SEF validees, beneficiaires, budget lines
- **8 mutations** : create, createDirectDG, update, submit, validate, reject, defer, impute + duplicate + delete
- **Machine a etats formelle** (isValidTransitionAEF) verifiee sur chaque mutation
- **Audit trail** via logAction sur la plupart des mutations
- **Verification RBAC** (DG/ADMIN) sur validate, reject, defer
- **Coherence SEF** enforced : AEF DOIT avoir note_sef_id + reference_pivot avant submit/validate
- **Auto-creation SEF shadow** pour AEF directe DG

### A.3. Comparaison SEF vs AEF

| Aspect                  | SEF                             | AEF                         | Gap            |
| ----------------------- | ------------------------------- | --------------------------- | -------------- |
| Machine a etats         | Pas de FSM formel               | FSM formelle (constants.ts) | AEF superieur  |
| Delegation/Interim      | `checkValidationPermission` RPC | Direct role check only      | **AEF manque** |
| Notifications           | Via useNotesSEFAudit            | Aucune notification         | **AEF manque** |
| Creation dossier        | Auto a la validation            | Pas de dossier              | **AEF manque** |
| Pagination server-side  | Client-side                     | RPC search_notes_aef        | AEF superieur  |
| Export Excel            | Pas d'export                    | Hook dedie                  | AEF superieur  |
| Budget availability     | N/A                             | Controle disponibilite      | AEF superieur  |
| Validation Zod          | React Hook Form + Zod           | Validation manuelle         | **Gap AEF**    |
| DetailSheet (4 onglets) | Oui                             | Dialog simple               | **Gap AEF**    |
| QR Code                 | Pour notes validees             | Absent                      | **Gap AEF**    |
| Badge Migre             | Detection MIG-\*                | Absent                      | **Gap AEF**    |
| Tests E2E               | notes-sef.spec.ts               | Aucun                       | **Gap AEF**    |
| `@ts-nocheck`           | Aucun                           | 1 fichier (export)          | **Gap AEF**    |
| Casts `any`             | ~2                              | 9+                          | **Gap AEF**    |

**Score maturite :** SEF 85/100 vs AEF 72/100

### A.4. Bugs identifies

| #   | Severite | Description                                                                 | Fichier:Ligne                    |
| --- | -------- | --------------------------------------------------------------------------- | -------------------------------- |
| 1   | CRITIQUE | `deleteNote` sans RBAC ni audit — tout utilisateur peut supprimer           | `useNotesAEF.ts:1066`            |
| 2   | CRITIQUE | `setIsSubmitting(true)` au lieu de `false` dans finally — boutons bloques   | `NoteAEFDetail.tsx:332`          |
| 3   | HAUTE    | Export filter mismatch `a_imputer: 'valide'` au lieu de `'a_imputer'`       | `useNotesAEFExport.ts:55`        |
| 4   | HAUTE    | Force imputation `justification` + `forceImputation` non envoyes au backend | `NoteAEFImputeDialog.tsx`        |
| 5   | HAUTE    | `(note as any).motif_differe` — type NoteAEF ne contient pas ces champs     | `ValidationNotesAEF.tsx:461-467` |
| 6   | MOYENNE  | Detail SEF query manque reference_pivot                                     | `NoteAEFDetail.tsx:207`          |
| 7   | MOYENNE  | `supabase.auth.getUser()` appele dans la boucle de fichiers                 | `NoteAEFDetail.tsx:406`          |
| 8   | BASSE    | Logique upload dupliquee (Detail vs Form)                                   | `NoteAEFDetail.tsx`              |
| 9   | BASSE    | `note.attachments_count > 0` sans null check                                | `NoteAEFList.tsx:323`            |

### A.5. Qualite TypeScript

- **9 `as any`** casts (ImputeDialog: 4, Service: 1, ValidationPage: 4)
- **3 `as unknown as`** casts (useNotesAEF, notesAefService x2)
- **5 variables inutilisees** (\_getUrgenceBadge, \_submitAfterSave, \_setSubmitAfterSave, \_isAdmin, \_counts)
- **3 eslint-disable** comments
- **1 `@ts-nocheck`** (useLignesEstimativesAEF.ts — bypass complet)

### A.6. UX Patterns

| Pattern                   | Present | Qualite  |
| ------------------------- | ------- | -------- |
| Loading states (Skeleton) | Oui     | Bon      |
| Error states              | Oui     | Bon      |
| Empty states avec CTA     | Oui     | Bon      |
| Toast notifications       | Oui     | Bon      |
| Confirmation dialogs      | Oui     | Bon      |
| Access control granulaire | Oui     | Bon      |
| Dark mode                 | Oui     | Bon      |
| Breadcrumbs               | Oui     | Bon      |
| WorkflowTimeline          | Oui     | Bon      |
| File upload validation    | Oui     | Bon      |
| Responsive mobile         | Partiel | Passable |
| Accessibilite (aria-\*)   | Non     | Absent   |

---

## B. AUDIT BACKEND (68/100)

### B.1. Schema table `notes_dg` (36+ colonnes)

**Colonnes principales :**
| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Cle primaire |
| `numero` | text | YES | — | Auto-genere par trigger |
| `reference_pivot` | text | YES | — | Reference ARTI heritee de la SEF |
| `exercice` | integer | YES | — | **Devrait etre NOT NULL** |
| `objet` | text | NO | — | Objet de la note |
| `statut` | text | YES | `'brouillon'` | **Devrait etre NOT NULL + CHECK** |
| `montant_estime` | numeric | YES | `0` | Calcule par trigger lignes_estimatives |
| `montant_autorise` | numeric | YES | — | Montant autorise |
| `is_direct_aef` | boolean | YES | `false` | AEF directe (sans Note SEF) |
| `note_sef_id` | uuid | YES | — | FK → notes_sef |
| `budget_line_id` | uuid | YES | — | FK → budget_lines |
| `ligne_budgetaire_id` | uuid | YES | — | **Doublon** FK → budget_lines |
| `direction_id` | uuid | YES | — | FK → directions |
| `beneficiaire_id` | uuid | YES | — | FK → prestataires |
| `created_by` | uuid | YES | — | **Devrait etre NOT NULL** |
| `created_at` | timestamptz | NO | `now()` | Date creation |

**13 Foreign Keys** vers : actions, activites, prestataires, budget_lines (x2), profiles (x5), directions, dossiers, notes_sef, objectifs_strategiques, projets, types_depenses

### B.2. Tables liees

| Table                    | FK                 | CASCADE | Description                          |
| ------------------------ | ------------------ | ------- | ------------------------------------ |
| `notes_dg_attachments`   | note_id            | CASCADE | Pieces jointes                       |
| `lignes_estimatives_aef` | note_aef_id        | CASCADE | **TABLE ABSENTE EN BASE**            |
| `notes_aef_history`      | note_id            | CASCADE | Historique des changements de statut |
| `expressions_besoin`     | note_id            | —       | Expressions de besoin liees          |
| `validation_history`     | entity_id (non FK) | —       | Historique validations workflow      |
| `documents_generes`      | entity_id (non FK) | —       | Documents PDF generes                |
| `notifications`          | entity_id (non FK) | —       | Notifications liees                  |

### B.3. RLS Policies — PROBLEME MAJEUR

**3 migrations creent des policies sur notes_dg :**

| Migration        | Policies creees                                            | Approche                          |
| ---------------- | ---------------------------------------------------------- | --------------------------------- |
| `20260115...`    | select_policy, insert_policy, update_policy, delete_policy | `has_role()` avec `app_role` enum |
| `20260118200000` | notes_dg_select, notes_dg_insert, notes_dg_update          | `is_admin()`, `is_dg()`           |
| Possibles autres | Non verifiees                                              | —                                 |

**Problemes detectes :**

1. Jusqu'a **7 policies SELECT** potentiellement actives (PostgreSQL fait OR entre elles)
2. **Pas de policy DELETE** dans la migration RLS socle (20260118200000)
3. **Policy UPDATE trop restrictive** : createur ne peut modifier qu'en `brouillon` (pas `differe`)
4. **DAAF/CB** doivent passer par les anciennes policies pour imputer
5. **Attachments** : SELECT/INSERT/DELETE en `authenticated USING(true)` — trop permissif

### B.4. Triggers (6 sur notes_dg, 3 sur lignes_estimatives_aef)

| Trigger                                   | Event         | Fonction                              | Description                     |
| ----------------------------------------- | ------------- | ------------------------------------- | ------------------------------- |
| `trg_unified_ref_notes_dg`                | BEFORE INSERT | `trg_unified_ref_notes_dg()`          | Reference ARTI5MMYYNNNN         |
| `trg_notes_dg_status_log`                 | AFTER UPDATE  | `trg_log_note_aef_status_change()`    | Log → notes_aef_history         |
| `trg_log_validation_notes_dg`             | AFTER UPDATE  | `log_validation_change()`             | Log → validation_history        |
| `trg_check_validation_motif_dg`           | BEFORE UPDATE | `check_validation_motif()`            | Motif obligatoire rejet/differe |
| `trigger_prevent_final_note_modification` | BEFORE UPDATE | `prevent_final_note_modification()`   | Bloque modif statuts finaux     |
| `trigger_notify_notes_aef_status`         | AFTER UPDATE  | `notify_on_notes_aef_status_change()` | Notifications auto              |

**Triggers lignes_estimatives_aef (si table creee) :**
| Trigger | Fonction | Description |
|---------|----------|-------------|
| `trigger_calculate_ligne_montant` | `calculate_ligne_montant()` | quantite x prix_unitaire |
| `trigger_recalculate_aef_total` | `recalculate_aef_total()` | Recalcule montant_estime |

**Note :** 3 versions de triggers de numerotation dans l'historique des migrations (AEF-2026-000001, ARTI101260001, ARTI5MMYYNNNN). Seul le dernier (`trg_unified_ref_notes_dg`) est actif.

### B.5. Edge Functions

| Fonction              | Role pour AEF                                        |
| --------------------- | ---------------------------------------------------- |
| `generate-report`     | Statistiques par statut dans module `suivi_workflow` |
| `workflow-validation` | Soumettre, valider, rejeter, differer, imputer       |

### B.6. Vue SQL

- `notes_imputees_disponibles` : Notes AEF statut='impute' non encore liees a une expression de besoin (`security_invoker = true`)

### B.7. Fonctions Helper RBAC

| Fonction                            | Description                                           |
| ----------------------------------- | ----------------------------------------------------- |
| `is_admin()`                        | profil_fonctionnel='Admin' OU user_roles role='ADMIN' |
| `is_dg()`                           | role_hierarchique='DG' OU user_roles role='DG'        |
| `is_daaf()`                         | user_roles role IN ('DAAF','DAF')                     |
| `is_cb()`                           | user_roles role='CB'                                  |
| `can_create_in_module('notes_aef')` | profil IN ('Operationnel','Validateur') OU Admin      |
| `has_role(uid, role)`               | Verifie user_roles (app_role enum)                    |
| `get_user_direction_id()`           | Retourne direction_id du profil                       |

---

## C. AUDIT QA (68/100)

### C.1. Build : SUCCES

| Metrique | Valeur                             |
| -------- | ---------------------------------- |
| Statut   | SUCCES (exit code 0)               |
| Duree    | 51.82s                             |
| Modules  | 4,856                              |
| Erreurs  | 0                                  |
| Warnings | 1 (NoteCanvasPage 819KB — pas AEF) |

**Bundles AEF :**
| Bundle | Taille | Gzip |
|--------|--------|------|
| NotesAEF.js | 59.47 KB | 15.11 KB |
| NoteAEFDetail.js | 21.47 KB | 6.11 KB |
| ValidationNotesAEF.js | 15.12 KB | 3.79 KB |
| NoteAEFImputeDialog.js | 16.32 KB | 4.62 KB |
| useNotesAEF.js | 18.25 KB | 4.50 KB |
| useNotesAEFList.js | 4.79 KB | 1.73 KB |
| **Total AEF** | **~135 KB** | **~36 KB** |

### C.2. TypeScript : ZERO ERREUR

`npx tsc --noEmit` : aucune erreur. Le code compile proprement.

### C.3. ESLint : 1 erreur + 4 warnings

| Severite | Fichier                      | Regle                   | Description                    |
| -------- | ---------------------------- | ----------------------- | ------------------------------ |
| ERREUR   | `useLignesEstimativesAEF.ts` | `ban-ts-comment`        | `@ts-nocheck` (bypass complet) |
| Warning  | `useNotesAEF.ts:292`         | `no-non-null-assertion` | Non-null assertion `!`         |
| Warning  | `useNotesAEFList.ts:203-204` | `no-non-null-assertion` | Non-null assertion `!` (x2)    |
| Warning  | `notesAefService.ts:158`     | `no-explicit-any`       | Utilise `any` type             |

### C.4. Couverture de tests : 0%

| Type                     | Fichiers AEF | Couverture   |
| ------------------------ | ------------ | ------------ |
| Tests unitaires (Vitest) | 0            | **0%**       |
| Tests E2E (Playwright)   | 0            | **0%**       |
| Tests existants (projet) | 30+          | Tous passent |

### C.5. Code splitting

Les 3 pages AEF utilisent `React.lazy()` :

- `/notes-aef` → `NotesAEF`
- `/notes-aef/:id` → `NoteAEFDetail`
- `/notes-aef/validation` → `ValidationNotesAEF`

### C.6. Metriques qualite

| Metrique           | Valeur                           | Evaluation            |
| ------------------ | -------------------------------- | --------------------- |
| Plus grand fichier | useNotesAEF.ts (1,118 lignes)    | Complexe              |
| 2e plus grand      | NoteAEFDetail.tsx (1,110 lignes) | Complexe              |
| `@ts-nocheck`      | 1 fichier                        | Mauvaise pratique     |
| `console.error`    | 16 occurrences                   | Gestion erreurs OK    |
| TODO/FIXME         | 0                                | Propre                |
| Attributs aria-\*  | 0 dans notes-aef                 | Accessibilite absente |
| ErrorBoundary      | 0 pour AEF                       | Pas de protection     |

---

## D. DONNEES EN BASE (7 notes)

| Numero         | Statut    | Exercice | Origine  | note_sef_id | budget_line_id | reference_pivot     |
| -------------- | --------- | -------- | -------- | ----------- | -------------- | ------------------- |
| NOTE-2026-0002 | brouillon | 2026     | FROM_SEF | `d0f99c9d`  | null           | `ARTI001260002-NOA` |
| NOTE-2026-0001 | brouillon | 2026     | FROM_SEF | `814db894`  | null           | `ARTI001260001`     |
| NOTE-2025-0005 | impute    | 2026     | DIRECT   | null        | `69cd4516`     | null                |
| NOTE-2025-0004 | impute    | 2026     | FROM_SEF | `97c91305`  | null           | `ARTI001260003`     |
| NOTE-2025-0003 | soumis    | 2026     | DIRECT   | null        | null           | null                |
| NOTE-2025-0002 | soumis    | 2026     | DIRECT   | null        | null           | null                |
| NOTE-2025-0001 | differe   | 2026     | DIRECT   | null        | null           | null                |

**Anomalies detectees :**

- **3 notes DIRECT sans reference_pivot** (soumis/differe) — creees avant le guard auto-link
- **1 note imputee (fec71e0a) sans budget_line_id** — violation regle metier
- **0 pieces jointes** sur aucune note AEF
- **8 entrees** dans notes_aef_history

---

## E. TABLE `lignes_estimatives_aef` — ABSENTE EN BASE

| Critere                                 | Statut                                                             |
| --------------------------------------- | ------------------------------------------------------------------ |
| Table en base Supabase                  | **N'EXISTE PAS**                                                   |
| Migration SQL trouvee                   | `20260118120000_create_aef_lignes_estimatives.sql` existe en local |
| Migration appliquee                     | Jamais executee en base                                            |
| Hook `useLignesEstimativesAEF.ts`       | Existe (~270 lignes) — **CODE MORT**                               |
| Composant `LignesEstimativesEditor.tsx` | Existe (470 lignes) — **CODE MORT**                                |

**Impact :** ~740 lignes de code frontend mortes. L'editeur de lignes estimatives ne fonctionne pas.

---

## F. MACHINE A ETATS AEF

```
                    +-------------+
                    |  brouillon  |
                    +------+------+
                           | soumettre
                    +------v------+
               +----+   soumis    +----+
               |    +------+------+    |
               |           |           |
          rejeter    valider DG    differer
               |           |           |
        +------v--+  +-----v-----+  +-v--------+
        | rejete  |  | a_imputer |  | differe  |
        | (final) |  +-----+-----+  +--+-------+
        +---------+        |           |
                      imputer CB    reprendre
                           |           |
                    +------v------+    |
                    |   impute    |<---+
                    |   (final)   |  (via soumis)
                    +-------------+
```

7 statuts : `brouillon`, `soumis`, `a_valider`, `valide`/`a_imputer`, `impute`, `rejete`, `differe`

---

## G. PLAN D'ACTION RECOMMANDE

### Phase 1 — Securite et bugs critiques (Semaine 1)

- [ ] P0 : Consolider RLS policies (1 migration clean DROP ALL + CREATE 4)
- [ ] P0 : RBAC + audit sur deleteNote
- [ ] P0 : Corriger bug setIsSubmitting(true) → false
- [ ] P0 : Appliquer migration lignes_estimatives_aef
- [ ] P2 : Securiser RLS attachments

### Phase 2 — Fonctionnel (Semaine 2)

- [ ] P1 : Delegation/interim pour validation AEF
- [ ] P1 : Notifications AEF (soumission → validateurs)
- [ ] P1 : Contraintes NOT NULL + CHECK (exercice, statut)
- [ ] P1 : Supprimer doublon budget_line_id / ligne_budgetaire_id
- [ ] P1 : Corriger 3 notes legacy sans reference_pivot
- [ ] P1 : Corriger note imputee sans budget_line_id

### Phase 3 — Qualite code (Semaine 3)

- [ ] P0 : Tests unitaires hooks AEF (objectif 80% coverage)
- [ ] P2 : Supprimer @ts-nocheck (useLignesEstimativesAEF.ts)
- [ ] P2 : Corriger export filter a_imputer
- [ ] P2 : Corriger force imputation non envoyee au backend
- [ ] P2 : Typer motif_differe/date_differe dans NoteAEF
- [ ] P3 : Supprimer 5 variables inutilisees
- [ ] P3 : Remplacer 9 `as any` par types explicites

### Phase 4 — Parite SEF et tests E2E (Semaine 4)

- [ ] Tests Playwright : liste, creation, validation, report, imputation
- [ ] NoteAEFDetailSheet (volet lateral 4 onglets comme SEF)
- [ ] Validation Zod dans NoteAEFForm
- [ ] QR Code + Badge Migre
- [ ] Accessibilite (aria-\*, roles) + ErrorBoundary

### Objectif cible : **85/100** apres Phase 3

---

## H. ANNEXE — CORRECTIONS COMPLETES (25 items)

### Frontend (14 items)

| #   | Prio | Description                             | Fichier                   |
| --- | ---- | --------------------------------------- | ------------------------- |
| F1  | P0   | RBAC + audit deleteNote                 | useNotesAEF.ts:1066       |
| F2  | P0   | Bug setIsSubmitting(true) → false       | NoteAEFDetail.tsx:332     |
| F3  | P1   | Delegation/interim validation           | useNotesAEF.ts            |
| F4  | P1   | Notifications soumission                | useNotesAEF.ts            |
| F5  | P2   | Export filter a_imputer                 | useNotesAEFExport.ts:55   |
| F6  | P2   | Force imputation non envoyee            | NoteAEFImputeDialog.tsx   |
| F7  | P2   | reference_pivot manquant dans SEF query | NoteAEFDetail.tsx:207     |
| F8  | P2   | Typer motif_differe/date_differe        | ValidationNotesAEF.tsx    |
| F9  | P2   | Casts `(supabase as any)`               | NoteAEFDetail.tsx:192,221 |
| F10 | P3   | Variables inutilisees (5)               | Multiples                 |
| F11 | P3   | Remplacer as any (9)                    | Multiples                 |
| F12 | P3   | getUser() hors boucle                   | NoteAEFDetail.tsx:406     |
| F13 | P3   | Dedup logique upload                    | NoteAEFDetail.tsx         |
| F14 | P3   | null check attachments_count            | NoteAEFList.tsx:323       |

### Backend (8 items)

| #   | Prio | Description                                            | Migration           |
| --- | ---- | ------------------------------------------------------ | ------------------- |
| B1  | P0   | Consolider RLS policies (DROP ALL + CREATE 4)          | Nouvelle migration  |
| B2  | P0   | Appliquer migration lignes_estimatives_aef             | Migration existante |
| B3  | P1   | Supprimer doublon budget_line_id / ligne_budgetaire_id | Nouvelle migration  |
| B4  | P1   | exercice NOT NULL                                      | Nouvelle migration  |
| B5  | P1   | statut NOT NULL + CHECK constraint                     | Nouvelle migration  |
| B6  | P2   | Securiser attachments RLS                              | Nouvelle migration  |
| B7  | P2   | created_by NOT NULL DEFAULT auth.uid()                 | Nouvelle migration  |
| B8  | P3   | Evaluer double trigger log statut (redondant)          | Evaluation          |

### QA (3 items)

| #   | Prio | Description                         | Action                     |
| --- | ---- | ----------------------------------- | -------------------------- |
| Q1  | P0   | Tests unitaires hooks AEF (4 hooks) | Nouveaux fichiers          |
| Q2  | P2   | Supprimer @ts-nocheck               | useLignesEstimativesAEF.ts |
| Q3  | P3   | Accessibilite + ErrorBoundary       | Composants AEF             |

---

_Audit genere le 12/02/2026 par equipe 3 agents (Frontend 72/100, Backend 68/100, QA 68/100)_
_ARTI — Autorite de Regulation du Transport Interieur — Cote d'Ivoire_
_Aucun fichier source modifie_
