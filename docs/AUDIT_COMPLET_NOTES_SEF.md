# AUDIT COMPLET - Module Notes SEF

> **Date :** 11 février 2026
> **Mode :** Lecture seule (READ ONLY)
> **Agents :** LEAD + FRONTEND + BACKEND + QA + AUDIT
> **Branche :** main (commit 4734452)

---

## SCORE DE SANTE : 72/100

| Dimension               | Score      | Poids |
| ----------------------- | ---------- | ----- |
| Build & TypeScript      | 95/100     | 20%   |
| Lint & qualité code     | 65/100     | 15%   |
| Schema DB & intégrité   | 60/100     | 20%   |
| Cohérence documentation | 45/100     | 15%   |
| Architecture & patterns | 85/100     | 15%   |
| Sécurité (RLS/RBAC)     | 80/100     | 15%   |
| **Score pondéré**       | **72/100** |       |

---

## 1. INVENTAIRE FICHIERS

### 1.1 Pages (3 fichiers - 2,640 lignes)

| Chemin                             | Lignes | Rôle                                               |
| ---------------------------------- | ------ | -------------------------------------------------- |
| `src/pages/NotesSEF.tsx`           | 477    | Liste principale avec onglets par statut           |
| `src/pages/NoteSEFDetail.tsx`      | 1,527  | Détail note + historique + PJ + QR code + workflow |
| `src/pages/ValidationNotesSEF.tsx` | 636    | Espace validation DG/DAAF                          |

### 1.2 Composants (21 fichiers - 6,907 lignes)

| Chemin                                                | Lignes | Rôle                          |
| ----------------------------------------------------- | ------ | ----------------------------- |
| `src/components/notes-sef/NoteSEFForm.tsx`            | 1,106  | Formulaire création/édition   |
| `src/components/notes-sef/NoteSEFDetails.tsx`         | 1,020  | Vue détaillée complète        |
| `src/components/notes-sef/ImputationDGSection.tsx`    | 496    | Section imputation DG         |
| `src/components/notes-sef/TeamNotesView.tsx`          | 445    | Vue équipe                    |
| `src/components/notes-sef/NoteSEFList.tsx`            | 440    | Liste notes avec actions      |
| `src/components/notes-sef/ValidationDGSection.tsx`    | 376    | Section validation DG/DAAF    |
| `src/components/notes-sef/FilePreview.tsx`            | 332    | Aperçu fichiers PJ            |
| `src/components/notes-sef/NotesSEFTable.tsx`          | 327    | Tableau affichage             |
| `src/components/notes-sef/NoteSEFPreviewDrawer.tsx`   | 276    | Drawer aperçu rapide          |
| `src/components/notes-sef/NotesSEFExports.tsx`        | 272    | Gestion exports               |
| `src/components/notes-sef/LinkedNAEFList.tsx`         | 242    | Notes AEF liées               |
| `src/components/notes-sef/NoteSEFValidationCard.tsx`  | 219    | Card actions validation       |
| `src/components/notes-sef/NoteSEFChecklist.tsx`       | 219    | Checklist champs obligatoires |
| `src/components/notes-sef/NSEFParentSelector.tsx`     | 206    | Sélecteur parent              |
| `src/components/notes-sef/NotesSEFFilters.tsx`        | 204    | Filtres avancés               |
| `src/components/notes-sef/NoteSEFCreateAEFButton.tsx` | 151    | Bouton création AEF           |
| `src/components/notes-sef/NotesSEFListV2.tsx`         | 145    | Liste V2 optimisée            |
| `src/components/notes-sef/NoteSEFDeferDialog.tsx`     | 142    | Dialog report/différé         |
| `src/components/notes-sef/TypeNoteSelector.tsx`       | 115    | Sélecteur type note           |
| `src/components/notes-sef/NoteSEFRejectDialog.tsx`    | 96     | Dialog rejet                  |
| `src/components/notes-sef/NotesSEFTabs.tsx`           | 78     | Tabs navigation               |

### 1.3 Hooks (7 fichiers - 2,789 lignes)

| Chemin                             | Lignes | Rôle                                  |
| ---------------------------------- | ------ | ------------------------------------- |
| `src/hooks/useNotesSEFExport.ts`   | 930    | Export Excel/PDF avec transformations |
| `src/hooks/useNotesSEF.ts`         | 843    | Mutations CRUD + workflow             |
| `src/hooks/useNotesSEFAudit.ts`    | 329    | Historique et audit trail             |
| `src/hooks/useNotesSEFList.ts`     | 231    | Liste paginée serveur-side            |
| `src/hooks/useExportNoteSEFPdf.ts` | 199    | Export PDF spécifique                 |
| `src/hooks/useNoteSEFAutosave.ts`  | 173    | Auto-sauvegarde brouillon             |
| `src/hooks/useNotesSEFCounts.ts`   | 84     | Compteurs KPI par statut              |

### 1.4 Lib/Services (5 fichiers - 1,387 lignes)

| Chemin                                 | Lignes | Rôle                              |
| -------------------------------------- | ------ | --------------------------------- |
| `src/lib/notes-sef/notesSefService.ts` | 566    | Service CRUD + pagination RPC v2  |
| `src/lib/notes-sef/constants.ts`       | 301    | Énumérations, config, transitions |
| `src/lib/notes-sef/types.ts`           | 252    | Types TypeScript                  |
| `src/lib/notes-sef/helpers.ts`         | 248    | Utilitaires et formatage          |
| `src/lib/notes-sef/index.ts`           | 20     | Point d'entrée module             |

### 1.5 Tests E2E (2 fichiers)

| Chemin                  | Rôle                                |
| ----------------------- | ----------------------------------- |
| `e2e/notes-sef.spec.ts` | 15 tests Playwright (15/15 passing) |
| `e2e/fixtures/auth.ts`  | Helpers authentification            |

### 1.6 Migrations SQL (55 fichiers référençant `notes_sef`)

Principaux fichiers :

| Date       | Fichier                                  | Description                                                                                        |
| ---------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 2026-01-05 | `20260105194240_*.sql`                   | Création tables : `notes_sef`, `notes_sef_attachments`, `notes_sef_history`, `notes_sef_sequences` |
| 2026-01-15 | 8 fichiers                               | Triggers, RLS, reference pivot, protect modification (itérations rapides)                          |
| 2026-01-18 | 6 fichiers                               | RLS policies, RBAC, dossier ref pivot, seed data                                                   |
| 2026-01-19 | 4 fichiers                               | Colonnes `expose`/`avis`/`recommandations`, imputations, validation DG                             |
| 2026-01-29 | `20260129162400_*.sql`                   | Format unifié référence : `trg_unified_ref_notes_sef`                                              |
| 2026-01-29 | `20260129162635_*.sql`                   | Workflow validation : `trg_log_validation_notes_sef`                                               |
| 2026-01-29 | `20260129162945_*.sql`                   | Système pièces jointes                                                                             |
| 2026-02-07 | `20260207130000_*.sql`                   | Vérification direction workflow                                                                    |
| 2026-02-09 | `20260209_*.sql`                         | Visibilité DAAF cross-direction                                                                    |
| 2026-02-11 | `20260211_notes_sef_missing_indexes.sql` | Index manquants (non déployé)                                                                      |
| 2026-02-11 | `20260211_fix_reference_generator.sql`   | Fix générateur référence                                                                           |

**Total module :** 36 fichiers frontend (13,723 lignes) + 55 migrations SQL

---

## 2. SCHEMA DB COMPLET

### 2.1 Table `notes_sef` (table principale)

| Colonne                   | Type        | Nullable | Description                                                    |
| ------------------------- | ----------- | -------- | -------------------------------------------------------------- |
| `id`                      | UUID        | NOT NULL | PK, gen_random_uuid()                                          |
| `numero`                  | TEXT        | NULL     | Numéro unique (UNIQUE)                                         |
| `reference_pivot`         | TEXT        | NULL     | Référence ARTI001260001                                        |
| `exercice`                | INTEGER     | NOT NULL | Année (default: EXTRACT year)                                  |
| `direction_id`            | UUID FK     | NULL     | → `directions(id)`                                             |
| `demandeur_id`            | UUID FK     | NULL     | → `profiles(id)`                                               |
| `demandeur_display`       | TEXT        | NULL     | Snapshot nom demandeur                                         |
| `objet`                   | TEXT        | NOT NULL | Objet de la note                                               |
| `description`             | TEXT        | NULL     | Description détaillée                                          |
| `justification`           | TEXT        | NULL     | Justification                                                  |
| `urgence`                 | TEXT        | NULL     | CHECK: `basse, normale, haute, urgente`                        |
| `commentaire`             | TEXT        | NULL     | Commentaires libres                                            |
| `statut`                  | TEXT        | NULL     | CHECK: `brouillon, soumis, a_valider, valide, rejete, differe` |
| `date_souhaitee`          | DATE        | NULL     | Date souhaitée réalisation                                     |
| `beneficiaire_type`       | TEXT        | NULL     | PRESTATAIRE_EXTERNE / AGENT_INTERNE                            |
| `beneficiaire_id`         | UUID FK     | NULL     | → `prestataires(id)`                                           |
| `beneficiaire_interne_id` | UUID FK     | NULL     | → `profiles(id)`                                               |
| `beneficiaire_nom`        | TEXT        | NULL     | Snapshot nom bénéficiaire                                      |
| `montant_estime`          | NUMERIC     | NULL     | Montant estimé                                                 |
| `type_depense`            | TEXT        | NULL     | Type de dépense                                                |
| `dossier_id`              | UUID FK     | NULL     | Lien vers dossier                                              |
| `note_aef_id`             | UUID FK     | NULL     | Lien vers Note AEF                                             |
| `dg_validation_required`  | BOOLEAN     | NULL     | Validation DG requise                                          |
| `observations_dg`         | TEXT        | NULL     | Observations du DG                                             |
| `os_id`                   | UUID FK     | NULL     | Ordre de service                                               |
| `mission_id`              | UUID FK     | NULL     | Mission                                                        |
| `projet_id`               | UUID FK     | NULL     | Projet                                                         |
| `type_demande_id`         | UUID FK     | NULL     | Type de demande                                                |
| `redacteur_id`            | UUID FK     | NULL     | Rédacteur                                                      |
| `initiales_redacteur`     | TEXT        | NULL     | Initiales rédacteur                                            |
| `is_deleted`              | BOOLEAN     | NULL     | Soft delete                                                    |
| `is_migrated`             | BOOLEAN     | NULL     | Donnée migrée                                                  |
| `submitted_by`            | UUID FK     | NULL     | → `profiles(id)`                                               |
| `submitted_at`            | TIMESTAMPTZ | NULL     | Date soumission                                                |
| `validated_by`            | UUID FK     | NULL     | → `profiles(id)`                                               |
| `validated_at`            | TIMESTAMPTZ | NULL     | Date validation                                                |
| `rejected_by`             | UUID FK     | NULL     | → `profiles(id)`                                               |
| `rejected_at`             | TIMESTAMPTZ | NULL     | Date rejet                                                     |
| `rejection_reason`        | TEXT        | NULL     | Motif rejet                                                    |
| `decided_by`              | UUID FK     | NULL     | → `profiles(id)`                                               |
| `decided_at`              | TIMESTAMPTZ | NULL     | Date décision                                                  |
| `decision_reason`         | TEXT        | NULL     | Motif décision                                                 |
| `differe_by`              | UUID FK     | NULL     | → `profiles(id)`                                               |
| `differe_at`              | TIMESTAMPTZ | NULL     | Date différé                                                   |
| `differe_motif`           | TEXT        | NULL     | Motif différé                                                  |
| `differe_condition`       | TEXT        | NULL     | Condition reprise                                              |
| `differe_date_reprise`    | DATE        | NULL     | Date reprise                                                   |
| `created_by`              | UUID FK     | NULL     | → `profiles(id)`                                               |
| `created_at`              | TIMESTAMPTZ | NOT NULL | default now()                                                  |
| `updated_at`              | TIMESTAMPTZ | NOT NULL | default now()                                                  |

### 2.2 Tables associées

| Table                   | Colonnes clés                                         | Lignes | Usage                    |
| ----------------------- | ----------------------------------------------------- | ------ | ------------------------ |
| `notes_sef_history`     | note_id, action, old_statut, new_statut, performed_by | 1,000+ | Audit trail immutable    |
| `notes_sef_attachments` | note_id, file_name, file_path, file_type, file_size   | **0**  | PJ (vide)                |
| `notes_sef_pieces`      | note_id, fichier_nom, fichier_chemin, fichier_type    | **0**  | PJ alt (vide)            |
| `notes_sef_sequences`   | annee, dernier_numero                                 | 1      | Séquence numérotation    |
| `reference_counters`    | etape, mm, yy, counter                                | 1      | Compteur référence pivot |

### 2.3 Distribution données (exercice 2026)

| Statut      | Nombre  | %     |
| ----------- | ------- | ----- |
| `valide`    | 175     | 95.6% |
| `soumis`    | 7       | 3.8%  |
| `brouillon` | 1       | 0.6%  |
| `rejete`    | 0       | 0%    |
| `differe`   | 0       | 0%    |
| **Total**   | **183** |       |

### 2.4 Index

| Index                               | Colonnes                                                               | Usage                   |
| ----------------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| `idx_notes_sef_exercice_statut`     | (exercice, statut)                                                     | Filtre liste par onglet |
| `idx_notes_sef_direction`           | (direction_id)                                                         | Filtre par direction    |
| `idx_notes_sef_demandeur`           | (demandeur_id)                                                         | Notes par utilisateur   |
| `idx_notes_sef_updated_at`          | (updated_at DESC)                                                      | Tri chronologique       |
| `idx_notes_sef_list_query`          | (exercice, statut, updated_at DESC)                                    | Liste optimisée         |
| `idx_notes_sef_active_list`         | (exercice, statut, is_deleted, updated_at DESC) WHERE is_deleted=false | Liste sans supprimés    |
| `idx_notes_sef_objet_search`        | GIN (to_tsvector)                                                      | Recherche full-text     |
| `idx_notes_sef_urgence`             | (urgence)                                                              | **Non déployé**         |
| `idx_notes_sef_created_at`          | (created_at DESC)                                                      | **Non déployé**         |
| `idx_notes_sef_exercice_created_at` | (exercice, created_at DESC)                                            | **Non déployé**         |
| `idx_notes_sef_exercice_updated_at` | (exercice, updated_at DESC)                                            | **Non déployé**         |

### 2.5 Triggers (12 sur table `notes_sef`)

| Trigger                                | Fichier source   | Description                  |
| -------------------------------------- | ---------------- | ---------------------------- |
| `trigger_generate_note_sef_numero`     | `20260105194240` | Génération auto numéro       |
| `update_notes_sef_updated_at`          | `20260105194240` | MAJ auto `updated_at`        |
| `trigger_note_sef_reference_pivot`     | `20260115113020` | Génération ref pivot         |
| `trigger_note_sef_numero`              | `20260115113020` | Génération numéro (doublon?) |
| `set_note_sef_reference_pivot`         | `20260115115011` | Ref pivot (doublon?)         |
| `tr_generate_note_sef_reference_pivot` | `20260115091710` | Ref pivot (doublon?)         |
| `trigger_prevent_final_modification`   | `20260115125057` | Protection notes finales     |
| `trigger_auto_generate_sef_reference`  | `20260115132635` | Auto ref (doublon?)          |
| `trg_unified_ref_notes_sef`            | `20260129162400` | Format unifié                |
| `trg_log_validation_notes_sef`         | `20260129162635` | Log validation               |
| `trg_check_validation_motif_sef`       | `20260129162635` | Vérif motif                  |
| `trg_notes_sef_set_dossier_ref`        | `20260118210000` | Attribution dossier          |

### 2.6 Vues SQL (13+ référençant `notes_sef`)

| Vue                           | Description                              |
| ----------------------------- | ---------------------------------------- |
| `notes_sef_audit_log`         | Vue alias de `notes_sef_history`         |
| `notes_imputees_disponibles`  | Notes imputées disponibles (3 versions!) |
| `v_dashboard_kpis`            | KPIs dashboard                           |
| `v_dossiers_urgents`          | Dossiers urgents                         |
| `v_stats_par_direction`       | Stats par direction                      |
| `v_activite_recente`          | Activité récente                         |
| `v_dashboard_direction`       | Dashboard direction                      |
| `v_alertes_direction`         | Alertes direction                        |
| `v_validation_timeline`       | Timeline validation                      |
| `v_reference_counters_status` | Statut compteurs                         |
| `v_pieces_jointes`            | Pièces jointes                           |
| `v_documents_generes`         | Documents générés                        |
| `pending_tasks_by_role`       | Tâches en attente par rôle               |

### 2.7 Edge Functions (6 référençant `notes_sef`)

| Fonction                   | Rôle                                    |
| -------------------------- | --------------------------------------- |
| `workflow-validation`      | Validation workflow                     |
| `validate-workflow`        | Validation workflow (doublon potentiel) |
| `generate-report`          | Génération rapports                     |
| `generate-export`          | Export données                          |
| `generate-dashboard-stats` | Statistiques dashboard                  |
| `bulk-operations`          | Opérations en masse                     |

---

## 3. ERREURS BUILD / TYPESCRIPT

### 3.1 Build Vite

**Statut : OK** - Build réussi en 32.85s

Warnings :

- 3 chunks > 500 kB (NoteCanvasPage 820kB, index 494kB, index 491kB) - non lié à Notes SEF

### 3.2 TypeScript (`tsc --noEmit`)

**Statut : OK** - 0 erreur TypeScript

### 3.3 ESLint - Module Notes SEF

**Total global :** 1,299 problèmes (71 erreurs, 1,228 warnings)
**Module Notes SEF :** 5 erreurs, ~60 warnings

#### Erreurs (5)

| Fichier                  | Ligne | Erreur                 |
| ------------------------ | ----- | ---------------------- |
| `NoteSEFForm.tsx`        | 1:1   | `@ts-nocheck` interdit |
| `useExportNoteSEFPdf.ts` | 1:1   | `@ts-nocheck` interdit |
| `useNoteSEFAutosave.ts`  | 1:1   | `@ts-nocheck` interdit |
| `useNotesSEF.ts`         | 1:1   | `@ts-nocheck` interdit |
| `NotesSEFListV2.tsx`     | -     | `@ts-nocheck` interdit |

#### Warnings majeurs par fichier

| Fichier                   | `no-explicit-any` | `no-unused-vars` | Autres               | Total |
| ------------------------- | ----------------- | ---------------- | -------------------- | ----- |
| `useNotesSEF.ts`          | 14                | 3                | 1 (non-null)         | 18    |
| `NoteSEFForm.tsx`         | 4                 | 6                | 1 (deps)             | 11    |
| `notesSefService.ts`      | 1                 | 3                | 7 (console)          | 11    |
| `NoteSEFDetails.tsx`      | 0                 | 5                | 2 (deps, self-close) | 7     |
| `NoteSEFList.tsx`         | 3                 | 0                | 2 (self-close)       | 5     |
| `FilePreview.tsx`         | 0                 | 2                | 2 (fast-refresh)     | 4     |
| `ImputationDGSection.tsx` | 0                 | 2                | 0                    | 2     |
| `useNotesSEFList.ts`      | 0                 | 0                | 2 (non-null)         | 2     |
| `useNoteSEFAutosave.ts`   | 0                 | 2                | 0                    | 2     |
| `types.ts`                | 0                 | 1                | 0                    | 1     |

---

## 4. ERREURS CONSOLE NAVIGATEUR

### 4.1 `console.error` (14 occurrences)

| Fichier                | Ligne | Contexte                           |
| ---------------------- | ----- | ---------------------------------- |
| `NoteSEFDetail.tsx`    | 343   | Chargement historique              |
| `NoteSEFDetail.tsx`    | 376   | Erreur chargement PJ               |
| `NoteSEFDetail.tsx`    | 411   | Erreur téléchargement fichier      |
| `NoteSEFDetail.tsx`    | 524   | Erreur upload fichier              |
| `NoteSEFDetail.tsx`    | 557   | Erreur suppression fichier         |
| `NoteSEFDetail.tsx`    | 617   | Erreur sauvegarde                  |
| `useNotesSEF.ts`       | 460   | Erreur création dossier            |
| `useNotesSEFExport.ts` | 215   | Erreur récupération données export |
| `useNotesSEFExport.ts` | 516   | Erreur export Excel                |
| `useNotesSEFExport.ts` | 615   | Erreur export PDF                  |
| `notesSefService.ts`   | 367   | Erreur upload PJ                   |
| `notesSefService.ts`   | 400   | Erreur traitement fichier          |

### 4.2 `console.warn` (2 occurrences)

| Fichier                | Ligne | Contexte                |
| ---------------------- | ----- | ----------------------- |
| `useNotesSEFExport.ts` | 355   | Fallback Storage local  |
| `useNotesSEFExport.ts` | 365   | Erreur Storage générale |

### 4.3 `console.log` non autorisés (7 dans notesSefService.ts)

| Fichier              | Lignes                            | Contexte                               |
| -------------------- | --------------------------------- | -------------------------------------- |
| `notesSefService.ts` | 431, 444, 453, 462, 471, 505, 560 | Debug statements (ESLint `no-console`) |

**Verdict :** Les `console.error/warn` sont dans des catch blocks (acceptables pour debug). Les 7 `console.log` dans `notesSefService.ts` sont des violations ESLint à corriger.

### 4.4 Erreurs console runtime (test Playwright navigateur)

#### Page `/notes-sef` (connecté en tant que DAAF)

| Type     | Code        | URL/Détail                                                              | Impact                    |
| -------- | ----------- | ----------------------------------------------------------------------- | ------------------------- |
| HTTP 400 | Bad Request | `objectifs_strategiques?select=id,code,libelle&est_active=eq.true` (x2) | Table/colonnes manquantes |
| HTTP 404 | Not Found   | `saved_views?select=*&or=(user_id.eq...,is_shared.eq.true)` (x2)        | Table inexistante         |
| Warning  | -           | React Router future flags (x2)                                          | Non bloquant              |

**UI vérifiée :** 191 notes affichées, pagination 50/page (4 pages), stats cards (Total 190, A valider 7, Validées 183), filtres, exports - tout fonctionnel.

#### Page `/notes-sef/validation`

| Type     | Code      | URL/Détail                     | Impact            |
| -------- | --------- | ------------------------------ | ----------------- |
| HTTP 404 | Not Found | `saved_views` (x2)             | Table inexistante |
| Warning  | -         | React Router future flags (x2) | Non bloquant      |

**UI vérifiée :** 7 notes en attente, boutons Voir/Valider/Différer/Rejeter, workflow fonctionnel.

**Anomalie critique constatée :** Formats de référence hétérogènes sur les notes soumises :

- `ARTI002260002`, `ARTI002260001` (nouveau format unifié)
- `0008-2026-DG-XXX`, `0007-2026-DG-XXX`, `0004-2026-DG-XXX` (ancien format)
- `0002-2026-DG-BDK` (ancien format avec code direction)

### 4.5 Taille des bundles Notes SEF

| Bundle                      | Taille        | Gzip         |
| --------------------------- | ------------- | ------------ |
| `NotesSEF-*.js`             | 62.88 kB      | 16.60 kB     |
| `NoteSEFDetail-*.js`        | 39.73 kB      | 10.85 kB     |
| `notesSefService-*.js`      | 25.71 kB      | 6.10 kB      |
| `useNoteAccessControl-*.js` | 14.76 kB      | 4.07 kB      |
| `ValidationNotesSEF-*.js`   | 12.24 kB      | 3.57 kB      |
| `useNotesSEFList-*.js`      | 2.14 kB       | 1.00 kB      |
| **Total module**            | **157.46 kB** | **42.19 kB** |

---

## 5. INCOHERENCES DOCUMENTATION

### 5.1 CRITIQUE - Nom de table erroné

| Document                          | Dit                    | Réalité                 | Impact            |
| --------------------------------- | ---------------------- | ----------------------- | ----------------- |
| `docs/RLS_NOTES_SEF.md` (ligne 9) | Table `notes_dg`       | Table `notes_sef`       | Confusion SEF/AEF |
| `docs/FLUX_SEF_AEF.md`            | Trigger sur `notes_dg` | Trigger sur `notes_sef` | SQL examples faux |

### 5.2 CRITIQUE - Format référence pivot

| Document                           | Format documenté                | Format réel      |
| ---------------------------------- | ------------------------------- | ---------------- |
| `docs/DEMO_NOTES_SEF.md`           | `ARTI/2026/DG/XXXX`             | `ARTI001260001`  |
| `docs/modules/MODULE_NOTES_SEF.md` | `ARTI + ÉTAPE + MM + YY + NNNN` | Correct          |
| Code (`constants.ts`)              | `ARTI001260001`                 | Source de vérité |

### 5.3 CRITIQUE - Valeurs d'urgence divergentes

| Source                | Valeurs                          |
| --------------------- | -------------------------------- |
| `MODULE_NOTES_SEF.md` | `normale, urgent, très_urgent`   |
| DB CHECK constraint   | `basse, normale, haute, urgente` |
| `constants.ts`        | `basse, normale, haute, urgente` |

**Source de vérité :** DB + code = `basse, normale, haute, urgente`

### 5.4 IMPORTANT - Statut manquant dans docs

| Source                | Statuts listés                                            |
| --------------------- | --------------------------------------------------------- |
| `MODULE_NOTES_SEF.md` | brouillon, soumis, valide, rejete, differe                |
| DB CHECK constraint   | brouillon, soumis, **a_valider**, valide, rejete, differe |
| `constants.ts`        | brouillon, soumis, **a_valider**, valide, rejete, differe |

Statut `a_valider` absent de la documentation.

### 5.5 IMPORTANT - Taille max PJ

| Source                               | Limite    |
| ------------------------------------ | --------- |
| `docs/TEST_NOTES_SEF.md`             | 5 MB      |
| `constants.ts` (MAX_ATTACHMENT_SIZE) | **10 MB** |
| `MODULE_NOTES_SEF.md`                | 10 MB     |

### 5.6 MINEUR - Limite PJ par note non documentée

`constants.ts` : `MAX_ATTACHMENTS_PER_NOTE = 3` - non mentionné dans `MODULE_NOTES_SEF.md`

### 5.7 MINEUR - Route `/notes-sef/validation` non documentée

`MODULE_NOTES_SEF.md` liste `/notes-sef` et `/notes-sef/:id` mais omet `/notes-sef/validation` (page `ValidationNotesSEF.tsx`).

### 5.8 MINEUR - Hooks non documentés

`MODULE_NOTES_SEF.md` documente 3 hooks sur 7 existants. Manquent :

- `useNotesSEFAudit` (audit trail)
- `useNotesSEFCounts` (compteurs KPI)
- `useNoteSEFAutosave` (auto-sauvegarde)
- `useExportNoteSEFPdf` (export PDF)

### 5.9 MINEUR - Composants non documentés

`MODULE_NOTES_SEF.md` documente 6 composants sur 21 existants. 15 composants non listés.

---

## 6. ANOMALIES DB DETECTEES

### 6.1 CRITIQUE - 8 notes sans `direction_id`

```
IDs: d16c1ee5, b0ee12a7, 16c24db0, 8ed7fb8c, 6be90b84, 697d4617, 22a6696c, 499a9673
```

Certaines en statut `valide` - casse le filtrage par direction et les dashboards.

### 6.2 CRITIQUE - 7 triggers conflictuels pour numérotation

Au moins 7 triggers/fonctions différents gèrent la génération de `numero` et `reference_pivot` :

1. `trigger_generate_note_sef_numero`
2. `trigger_note_sef_numero`
3. `trigger_note_sef_reference_pivot`
4. `tr_generate_note_sef_reference_pivot`
5. `set_note_sef_reference_pivot`
6. `trigger_auto_generate_sef_reference`
7. `trg_unified_ref_notes_sef`

Risque de conflits d'exécution, duplication ou écrasement.

### 6.3 CRITIQUE - Table `notes_aef` inexistante

Le champ `note_aef_id` dans `notes_sef` fait référence à une table absente. FK orpheline.

### 6.4 IMPORTANT - Tables PJ vides

| Table                   | Lignes |
| ----------------------- | ------ |
| `notes_sef_attachments` | 0      |
| `notes_sef_pieces`      | 0      |

Aucune pièce jointe dans le nouveau système malgré la migration de 4,836 notes.

### 6.5 IMPORTANT - Edge functions dupliquées

`workflow-validation` et `validate-workflow` : deux fonctions distinctes pour un usage potentiellement identique.

### 6.6 IMPORTANT - Vue définie 3 fois

`notes_imputees_disponibles` créée dans 3 migrations différentes.

### 6.7 MINEUR - Colonne `montant_total` inexistante

Seul `montant_estime` existe. Si le frontend référence `montant_total`, erreur runtime.

### 6.8 IMPORTANT - Formats de référence hétérogènes en production

Constaté sur `/notes-sef/validation` (notes soumises) :

- **Nouveau format :** `ARTI002260002`, `ARTI002260001`
- **Ancien format :** `0008-2026-DG-XXX`, `0007-2026-DG-XXX`, `0004-2026-DG-XXX`
- **Ancien format avec code direction :** `0002-2026-DG-BDK`

Preuve que le trigger `trg_unified_ref_notes_sef` ne s'applique qu'aux nouvelles notes, pas rétroactivement aux données migrées.

### 6.9 IMPORTANT - Tables Supabase manquantes (erreurs 400/404)

| Table                    | Erreur HTTP | Détail                                                                 |
| ------------------------ | ----------- | ---------------------------------------------------------------------- |
| `objectifs_strategiques` | 400         | Colonnes `est_active`, `code`, `libelle` absentes ou table inexistante |
| `saved_views`            | 404         | Table inexistante                                                      |

Ces tables sont requêtées par le frontend mais n'existent pas, générant des erreurs silencieuses.

### 6.10 MINEUR - 4 index non déployés

Migration `20260211_notes_sef_missing_indexes.sql` en `??` (untracked) dans git status.

---

## 7. SYNTHESE PAR CATEGORIE

### Points forts

- Build TypeScript 0 erreur, build Vite OK
- Architecture React propre (hooks séparés, service layer)
- 15/15 tests E2E Playwright passent
- RLS policies bien structurées
- Workflow complet (brouillon -> soumis -> valide/rejete/differe)
- Pagination serveur-side (RPC v2)
- Recherche full-text (GIN index)

### Points faibles

- 5 fichiers avec `@ts-nocheck` (bypasse toute vérification TS)
- 14 `any` explicites dans `useNotesSEF.ts` seul
- 7 `console.log` non autorisés dans `notesSefService.ts`
- Documentation fortement désynchronisée du code
- 7 triggers conflictuels de numérotation
- 8 notes sans direction (intégrité données)
- Tables PJ vides (migration incomplète)
- Formats de référence hétérogènes (ancien + nouveau coexistent)
- 2 tables Supabase manquantes (`objectifs_strategiques`, `saved_views`) causant erreurs 400/404

---

## 8. RECOMMANDATIONS PRIORITAIRES

### Priorité 1 - Critiques

1. **Corriger docs/RLS_NOTES_SEF.md** : remplacer `notes_dg` par `notes_sef`
2. **Corriger docs/DEMO_NOTES_SEF.md** : format `ARTI/2026/DG/XX` -> `ARTI001260001`
3. **Auditer les 7 triggers de numérotation** : identifier lesquels sont actifs, supprimer les doublons
4. **Corriger les 8 notes sans direction_id** : UPDATE ou investigation origine
5. **Créer tables manquantes** : `objectifs_strategiques` et `saved_views` (erreurs 400/404 runtime)

### Priorité 2 - Importantes

6. **Supprimer `@ts-nocheck`** des 5 fichiers et corriger les erreurs TS sous-jacentes
7. **Nettoyer les 7 `console.log`** dans `notesSefService.ts`
8. **Appliquer migration index manquants** (`20260211_notes_sef_missing_indexes.sql`)
9. **Investiguer tables PJ vides** : les pièces jointes migrées vont-elles dans un autre bucket ?
10. **Clarifier edge functions** : fusionner ou documenter `workflow-validation` vs `validate-workflow`
11. **Normaliser les références** : migrer les anciennes `0008-2026-DG-XXX` vers format `ARTI002260001`

### Priorité 3 - Mineures

12. **Mettre à jour MODULE_NOTES_SEF.md** : urgences, statut `a_valider`, limite PJ 3, composants, hooks
13. **Corriger TEST_NOTES_SEF.md** : taille max 5MB -> 10MB
14. **Documenter route `/notes-sef/validation`**
15. **Remplacer `any` par types précis** dans `useNotesSEF.ts` (14 occurrences)

---

## 9. METRIQUES RECAPITULATIVES

| Métrique                      | Valeur                                      |
| ----------------------------- | ------------------------------------------- |
| Fichiers frontend module      | 36                                          |
| Lignes de code total          | 13,723                                      |
| Migrations SQL                | 55                                          |
| Triggers actifs               | 12                                          |
| Vues SQL                      | 13+                                         |
| Edge Functions                | 6                                           |
| Erreurs ESLint                | 5 (`@ts-nocheck`)                           |
| Warnings ESLint               | ~60                                         |
| console.error/warn (code)     | 16                                          |
| console.log (interdit)        | 7                                           |
| Erreurs runtime navigateur    | 6 (400/404 API)                             |
| Formats référence hétérogènes | 3 formats coexistent                        |
| Tables Supabase manquantes    | 2 (`objectifs_strategiques`, `saved_views`) |
| Bundle total module (gzip)    | 42.19 kB                                    |
| Incohérences doc critiques    | 3                                           |
| Incohérences doc mineures     | 6                                           |
| Anomalies DB critiques        | 4                                           |
| Tests E2E                     | 15/15 passing                               |

---

**Audit réalisé par :** Claude Code (5 agents parallèles, mode lecture seule)
**Durée :** ~15 minutes
**Fichiers analysés :** 36 fichiers frontend + 55 migrations + 6 edge functions + 10 docs
