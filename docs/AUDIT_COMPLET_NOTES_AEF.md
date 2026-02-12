# Audit Complet - Module Notes AEF

> **Date:** 12 février 2026 | **Version:** 1.0 | **Auteur:** Claude Code (Audit automatisé)
> **NE MODIFIE AUCUN FICHIER** — Audit lecture seule

---

## 1. Inventaire des fichiers

### 1.1 Composants UI (`src/components/notes-aef/`)

| Fichier                       | Lignes     | Rôle                                                                                 |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `index.ts`                    | 5          | Barrel export (NoteAEFForm, NoteAEFList, NoteAEFDetails, LignesEstimativesEditor)    |
| `NoteAEFForm.tsx`             | 851        | Formulaire création/édition avec modes: edit, depuis SEF, AEF directe DG             |
| `NoteAEFList.tsx`             | 433        | Table avec colonnes Référence/Objet/Direction/Montant/Origine/Statut/PJ/Date/Actions |
| `NoteAEFDetails.tsx`          | 385        | Dialog aperçu rapide (PAS un Sheet 4 onglets comme SEF)                              |
| `NoteAEFImputeDialog.tsx`     | ~663       | Dialog imputation avec sélection ligne budgétaire                                    |
| `NoteAEFDeferDialog.tsx`      | ~121       | Dialog différé avec motif + date reprise                                             |
| `NoteAEFRejectDialog.tsx`     | ~98        | Dialog rejet avec motif obligatoire                                                  |
| `LignesEstimativesEditor.tsx` | 470        | Éditeur lignes estimatives (11 catégories) — **MORT: table absente en DB**           |
| **Sous-total**                | **~3 026** |                                                                                      |

### 1.2 Hooks (`src/hooks/`)

| Fichier                      | Lignes     | Rôle                                                                                |
| ---------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `useNotesAEF.ts`             | 1 119      | Hook principal: 6 queries + 9 mutations + machine à états                           |
| `useNotesAEFList.ts`         | 239        | Pagination server-side via RPCs `search_notes_aef` / `count_search_notes_aef`       |
| `useNotesAEFExport.ts`       | 359        | Export Excel 20 colonnes — **`// @ts-nocheck` ligne 1**                             |
| `useLignesEstimativesAEF.ts` | ~270       | CRUD lignes estimatives — **MORT: table absente en DB**                             |
| `useNoteAccessControl.ts`    | 171        | RBAC granulaire: canView/canEdit/canSubmit/canValidate/canReject/canDefer/canImpute |
| **Sous-total**               | **~2 158** |                                                                                     |

### 1.3 Pages (`src/pages/`)

| Fichier                  | Lignes    | Rôle                                                                |
| ------------------------ | --------- | ------------------------------------------------------------------- |
| `NotesAEF.tsx`           | 475       | Page principale: 6 KPIs + 6 onglets + filtres + pagination + export |
| `NoteAEFDetail.tsx`      | 1 089     | Page détail complète: info/finances/workflow/PJ/historique          |
| `ValidationNotesAEF.tsx` | 685       | Page validation dédiée: 4 KPIs + 3 onglets + actions inline         |
| **Sous-total**           | **2 249** |                                                                     |

### 1.4 Service / Types / Constantes (`src/lib/notes-aef/`)

| Fichier              | Lignes  | Rôle                                                           |
| -------------------- | ------- | -------------------------------------------------------------- |
| `constants.ts`       | 227     | Machine à états formelle + 7 statuts + rôles + config          |
| `types.ts`           | 101     | Types TypeScript: NoteAEFEntity, NoteAEFCounts, NoteAEFFilters |
| `notesAefService.ts` | 192     | Service couche data: listPaginated (RPCs), getCounts, getById  |
| **Sous-total**       | **520** |                                                                |

### 1.5 Intégration SEF↔AEF

| Fichier                                               | Lignes   | Rôle                                           |
| ----------------------------------------------------- | -------- | ---------------------------------------------- |
| `src/components/notes-sef/NoteSEFCreateAEFButton.tsx` | ~151     | Bouton "Créer Note AEF" sur détail SEF validée |
| `src/components/notes-sef/LinkedNAEFList.tsx`         | ~242     | Liste des AEF liées à une SEF                  |
| **Sous-total**                                        | **~393** |                                                |

### 1.6 Migrations SQL (principales)

| Fichier                                                 | Lignes | Rôle                                                        |
| ------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| `20260119120000_create_notes_direction_generale.sql`    | 309    | CREATE TABLE `notes_dg` + indexes + RLS policies            |
| `20260119140000_add_notedg_qr_pdf_fields.sql`           | 131    | Ajout champs qr_code, pdf_path                              |
| `20260118200000_rls_rbac_socle.sql` (extrait)           | —      | Policies SELECT/INSERT/UPDATE sur notes_dg                  |
| `20260129162400_unified_reference_format.sql` (extrait) | —      | Trigger `trg_unified_ref_notes_dg` (BEFORE INSERT)          |
| `20260129162635_workflow_validation.sql` (extrait)      | —      | Trigger `trg_log_validation_notes_dg` (AFTER UPDATE statut) |
| `20260115152814_*.sql`                                  | —      | Trigger `trigger_prevent_final_note_modification`           |

### 1.7 Documentation

| Fichier                            | Lignes | Rôle                           |
| ---------------------------------- | ------ | ------------------------------ |
| `docs/TEST_NOTES_AEF.md`           | 219    | Guide de test manuel           |
| `docs/modules/MODULE_NOTES_AEF.md` | 298    | Documentation technique module |
| `docs/FLUX_SEF_AEF.md`             | 120    | Diagramme flux SEF→AEF         |

### TOTAL MODULE AEF

| Catégorie       | Fichiers | Lignes     |
| --------------- | -------- | ---------- |
| Composants UI   | 8        | ~3 026     |
| Hooks           | 5        | ~2 158     |
| Pages           | 3        | 2 249      |
| Service/Types   | 3        | 520        |
| Intégration SEF | 2        | ~393       |
| Documentation   | 3        | 637        |
| **TOTAL**       | **24**   | **~8 983** |

Fichiers connexes touchant AEF : **114+ fichiers** (dashboard, sidebar, workflow, RBAC, audit, dossiers, recherche, notifications)

---

## 2. Schéma table `notes_dg` (complet)

### 2.1 Colonnes vérifiées en base

| Colonne               | Type        | Nullable | Default             | Description                                 |
| --------------------- | ----------- | -------- | ------------------- | ------------------------------------------- |
| `id`                  | uuid        | NO       | `gen_random_uuid()` | Clé primaire                                |
| `numero`              | text        | YES      | —                   | Numéro auto-généré (trigger BEFORE INSERT)  |
| `reference_pivot`     | text        | YES      | —                   | Référence ARTI héritée de la SEF            |
| `exercice`            | integer     | YES      | —                   | Année budgétaire                            |
| `direction_id`        | uuid        | YES      | —                   | FK → `directions(id)`                       |
| `objet`               | text        | NO       | —                   | Objet de la note                            |
| `contenu`             | text        | YES      | —                   | Description / contenu détaillé              |
| `priorite`            | text        | YES      | `'normale'`         | basse / normale / haute / urgente           |
| `montant_estime`      | numeric     | YES      | `0`                 | Montant en FCFA                             |
| `type_depense`        | text        | YES      | —                   | fonctionnement / investissement / transfert |
| `statut`              | text        | YES      | `'brouillon'`       | Machine à états (7 statuts)                 |
| `note_sef_id`         | uuid        | YES      | —                   | FK → `notes_sef(id)`                        |
| `is_direct_aef`       | boolean     | YES      | `false`             | AEF directe DG (sans SEF préalable)         |
| `origin`              | text        | YES      | —                   | `'FROM_SEF'` ou `'DIRECT'`                  |
| `justification`       | text        | YES      | —                   | Justification (obligatoire si AEF directe)  |
| `beneficiaire_id`     | uuid        | YES      | —                   | FK → `prestataires(id)`                     |
| `budget_line_id`      | uuid        | YES      | —                   | FK → `budget_lines(id)`                     |
| `ligne_budgetaire_id` | uuid        | YES      | —                   | Alias budget_line_id (legacy)               |
| `os_id`               | uuid        | YES      | —                   | Opération stratégique                       |
| `action_id`           | uuid        | YES      | —                   | Action budgétaire                           |
| `activite_id`         | uuid        | YES      | —                   | Activité budgétaire                         |
| `dossier_id`          | uuid        | YES      | —                   | FK → `dossiers(id)`                         |
| `created_by`          | uuid        | YES      | —                   | FK → `auth.users(id)`                       |
| `created_at`          | timestamptz | YES      | `now()`             | Date création                               |
| `updated_at`          | timestamptz | YES      | `now()`             | Date mise à jour                            |
| `submitted_at`        | timestamptz | YES      | —                   | Date soumission                             |
| `submitted_by`        | uuid        | YES      | —                   | FK → `auth.users(id)`                       |
| `validated_by`        | uuid        | YES      | —                   | FK → `profiles(id)`                         |
| `validated_at`        | timestamptz | YES      | —                   | Date validation DG                          |
| `rejected_by`         | uuid        | YES      | —                   | FK → `profiles(id)`                         |
| `rejected_at`         | timestamptz | YES      | —                   | Date rejet                                  |
| `rejection_reason`    | text        | YES      | —                   | Motif de rejet                              |
| `imputed_by`          | uuid        | YES      | —                   | FK → `profiles(id)`                         |
| `imputed_at`          | timestamptz | YES      | —                   | Date imputation                             |
| `differe_by`          | uuid        | YES      | —                   | FK → `profiles(id)`                         |
| `date_differe`        | timestamptz | YES      | —                   | Date du report                              |
| `motif_differe`       | text        | YES      | —                   | Motif du report                             |
| `deadline_correction` | text        | YES      | —                   | Date reprise après report                   |
| `qr_code_data`        | text        | YES      | —                   | Données QR code                             |
| `pdf_path`            | text        | YES      | —                   | Chemin PDF généré                           |

### 2.2 Foreign Keys

| Contrainte                     | Colonne          | Table cible    | Colonne cible |
| ------------------------------ | ---------------- | -------------- | ------------- |
| `notes_dg_direction_id_fkey`   | `direction_id`   | `directions`   | `id`          |
| `notes_dg_note_sef_id_fkey`    | `note_sef_id`    | `notes_sef`    | `id`          |
| `notes_dg_budget_line_id_fkey` | `budget_line_id` | `budget_lines` | `id`          |
| `notes_dg_created_by_fkey`     | `created_by`     | `profiles`     | `id`          |
| `notes_dg_validated_by_fkey`   | `validated_by`   | `profiles`     | `id`          |
| `notes_dg_imputed_by_fkey`     | `imputed_by`     | `profiles`     | `id`          |
| `notes_dg_differe_by_fkey`     | `differe_by`     | `profiles`     | `id`          |
| `notes_dg_rejected_by_fkey`    | `rejected_by`    | `profiles`     | `id`          |

### 2.3 Triggers

| Trigger                                   | Événement             | Description                               |
| ----------------------------------------- | --------------------- | ----------------------------------------- |
| `trg_unified_ref_notes_dg`                | BEFORE INSERT         | Auto-génère `numero`                      |
| `trg_notes_dg_set_arti_reference`         | BEFORE INSERT         | Auto-génère `reference_pivot` si absent   |
| `trigger_prevent_final_note_modification` | BEFORE UPDATE         | Bloque modification notes en statut final |
| `trg_log_validation_notes_dg`             | AFTER UPDATE (statut) | Log dans `validation_logs`                |
| `trg_notes_dg_status_log`                 | AFTER UPDATE (statut) | Log dans `notes_aef_history`              |

### 2.4 RLS Policies

| Policy            | Opération | Condition                                                                        |
| ----------------- | --------- | -------------------------------------------------------------------------------- |
| `notes_dg_select` | SELECT    | `is_admin() OR is_dg() OR created_by = uid() OR direction_id = user_direction()` |
| `notes_dg_insert` | INSERT    | `is_admin() OR can_create_in_module('notes_aef')`                                |
| `notes_dg_update` | UPDATE    | `is_admin() OR is_dg() OR (created_by = uid() AND statut = 'brouillon')`         |

---

## 3. Lien NSEF↔NAEF

### 3.1 FK `note_sef_id` — Existe et fonctionnel

| Critère                  | Statut | Détail                                                                                         |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------------- |
| FK déclarée en migration | ✅     | `notes_dg_note_sef_id_fkey → notes_sef(id)`                                                    |
| Jointure dans queries    | ✅     | `note_sef:notes_sef!notes_dg_note_sef_id_fkey(id, numero, reference_pivot, objet, dossier_id)` |
| Lien affiché en UI       | ✅     | `NoteAEFDetail.tsx:689-723` — Card bleu "Note SEF d'origine" avec bouton "Voir"                |
| Création depuis SEF      | ✅     | `NoteSEFCreateAEFButton` + `NoteAEFForm` avec prefill depuis SEF                               |
| Copie reference_pivot    | ✅     | `useNotesAEF.ts:285` — `referencePivot = noteSef.reference_pivot`                              |
| Vérification statut SEF  | ✅     | `useNotesAEF.ts:280` — SEF doit être `valide`                                                  |

### 3.2 Données en base

| Métrique               | Valeur           |
| ---------------------- | ---------------- |
| Total notes AEF        | **7**            |
| Avec `note_sef_id`     | **3** (FROM_SEF) |
| Sans `note_sef_id`     | **4** (DIRECT)   |
| Avec `reference_pivot` | **4**            |
| Sans `reference_pivot` | **3** ⚠️         |

### 3.3 Anomalies détectées

| ID (court) | Statut  | Problème                                                                                 |
| ---------- | ------- | ---------------------------------------------------------------------------------------- |
| `a5b4b8e5` | soumis  | DIRECT sans `reference_pivot` — le guard `submitMutation` aurait dû créer une SEF shadow |
| `213b5d22` | soumis  | DIRECT sans `reference_pivot` — même problème                                            |
| `3fd0fdbe` | differe | DIRECT sans `reference_pivot` ni `note_sef_id`                                           |

**Diagnostic:** Ces 3 notes ont été créées AVANT l'ajout du guard auto-link dans `submitMutation` (décembre 2025). Le guard actuel protège les nouvelles soumissions mais ne corrige pas les données legacy.

---

## 4. Lien `budget_lines`

### 4.1 FK `budget_line_id` — Existe et partiellement fonctionnel

| Critère               | Statut | Détail                                                               |
| --------------------- | ------ | -------------------------------------------------------------------- |
| FK déclarée           | ✅     | `notes_dg_budget_line_id_fkey → budget_lines(id)`                    |
| Jointure dans queries | ✅     | `budget_line:budget_lines(id, code, label, dotation_initiale)`       |
| ImputeDialog          | ✅     | `NoteAEFImputeDialog.tsx` — sélection ligne budgétaire               |
| `imputeMutation`      | ✅     | `useNotesAEF.ts:974-978` — update `budget_line_id` + `statut=impute` |
| Affichage imputation  | ✅     | `NoteAEFDetail.tsx:821-828` — DecisionBlock imputation               |
| Vérif disponibilité   | ✅     | `checkBudgetAvailability()` — compare dotation vs engagements        |

### 4.2 Données en base

| Métrique                    | Valeur                             |
| --------------------------- | ---------------------------------- |
| Notes avec `budget_line_id` | **1** sur 7                        |
| Notes `impute` avec budget  | **1** (`9d86dd92`)                 |
| Notes `impute` SANS budget  | **1** (`fec71e0a`) ⚠️ **ANOMALIE** |

### 4.3 Anomalie critique

La note `fec71e0a` a le statut `impute` mais `budget_line_id = null`. C'est une violation de la règle métier : une note imputée DOIT avoir une ligne budgétaire assignée. Probablement imputée via un ancien workflow qui ne forçait pas le `budget_line_id`.

---

## 5. État UI

### 5.1 KPIs (page `NotesAEF.tsx`)

| KPI       | Source                             | Fonctionnel |
| --------- | ---------------------------------- | ----------- |
| Total     | `counts.total`                     | ✅          |
| À valider | `counts.soumis + counts.a_valider` | ✅          |
| À imputer | `counts.a_imputer`                 | ✅          |
| Imputées  | `counts.impute`                    | ✅          |
| Différées | `counts.differe`                   | ✅          |
| Rejetées  | `counts.rejete`                    | ✅          |

### 5.2 Onglets (6 onglets)

| Onglet    | Filtre statut         | Fonctionnel |
| --------- | --------------------- | ----------- |
| Toutes    | —                     | ✅          |
| À valider | `soumis`, `a_valider` | ✅          |
| À imputer | `valide` (via RPC)    | ✅          |
| Imputées  | `impute`              | ✅          |
| Différées | `differe`             | ✅          |
| Rejetées  | `rejete`              | ✅          |

### 5.3 Formulaire (`NoteAEFForm.tsx`)

| Champ                | Obligatoire         | Validation                    |
| -------------------- | ------------------- | ----------------------------- |
| Note SEF liée        | Oui (sauf DG)       | Dropdown SEF validées         |
| Checkbox AEF directe | DG/ADMIN uniquement | ✅                            |
| Objet                | Oui                 | Validation manuelle (pas Zod) |
| Direction            | Oui                 | Select depuis `directions`    |
| Priorité             | Non                 | Select 4 valeurs              |
| Type dépense         | Non                 | Select 3 valeurs              |
| Montant estimé       | Oui                 | Formatage FCFA                |
| Bénéficiaire         | Non                 | Select depuis `prestataires`  |
| Contenu              | Non                 | Textarea                      |
| Justification        | Oui si directe      | Textarea                      |
| Pièces jointes       | Non                 | Upload fichier                |

**Problème:** Pas de validation Zod (contrairement aux bonnes pratiques). Validation manuelle avec état `touched`.

### 5.4 Page Validation (`ValidationNotesAEF.tsx`)

| Fonctionnalité                                       | Statut |
| ---------------------------------------------------- | ------ |
| Accès restreint DAAF/DG/ADMIN                        | ✅     |
| 4 KPIs (Urgentes, À valider, Différées, À imputer)   | ✅     |
| 3 onglets (À valider, Différées, À imputer)          | ✅     |
| Actions inline (Valider/Rejeter/Différer)            | ✅     |
| Bouton "Reprendre" notes différées                   | ✅     |
| Lien imputation (`/execution/imputation?sourceAef=`) | ✅     |

### 5.5 Page Détail (`NoteAEFDetail.tsx`)

| Fonctionnalité                                         | Statut        |
| ------------------------------------------------------ | ------------- |
| Breadcrumbs                                            | ✅            |
| Badge statut + origine                                 | ✅            |
| Boutons actions conditionnels (RBAC)                   | ✅            |
| Card "Note SEF d'origine" (si FROM_SEF)                | ✅            |
| Card "Justification AEF Directe" (si DIRECT)           | ✅            |
| Détails financiers (montant, type, urgence, direction) | ✅            |
| DecisionBlocks (validation/rejet/différé/imputation)   | ✅            |
| Pièces jointes avec upload/download/delete             | ✅            |
| Historique timeline                                    | ✅            |
| WorkflowTimeline                                       | ✅            |
| Bouton "Voir le dossier"                               | ✅            |
| QR Code                                                | ❌ **ABSENT** |
| DetailSheet (volet latéral 4 onglets)                  | ❌ **ABSENT** |
| Badge "Migré"                                          | ❌ **ABSENT** |

---

## 6. Erreurs Build / TypeScript / Console

### 6.1 TypeScript (`npx tsc --noEmit`)

**Résultat: 0 erreur** ✅

### 6.2 Problèmes de qualité code

| Fichier                | Ligne | Problème                                                                                 | Sévérité     |
| ---------------------- | ----- | ---------------------------------------------------------------------------------------- | ------------ |
| `useNotesAEFExport.ts` | 1     | `// @ts-nocheck` — Tout le fichier ignore TypeScript                                     | **CRITIQUE** |
| `NoteAEFDetail.tsx`    | 192   | `(supabase.from as any)('notes_dg')` — Cast `any`                                        | HAUTE        |
| `NoteAEFDetail.tsx`    | 221   | `(supabase as any).from('notes_aef_history')` — Cast `any`                               | HAUTE        |
| `NoteAEFDetail.tsx`    | 332   | `setIsSubmitting(true)` dans `finally` de `handleDelete` — **BUG: devrait être `false`** | **CRITIQUE** |
| `NoteAEFForm.tsx`      | ~373  | `let createdNote: any = null` — Type `any`                                               | MOYENNE      |
| `NoteAEFList.tsx`      | ~285  | `(note as any).attachments_count` — Cast `any`                                           | MOYENNE      |
| `useNotesAEFExport.ts` | 235   | `notes.map((note: any)` — Type `any` sous `@ts-nocheck`                                  | HAUTE        |
| `useNotesAEFExport.ts` | 342   | `catch (error: any)` — Type `any` sous `@ts-nocheck`                                     | MOYENNE      |

### 6.3 BUG confirmé : `handleDelete` verrouillé après suppression

```typescript
// NoteAEFDetail.tsx:320-335
const handleDelete = async () => {
  if (!note) return;
  setIsSubmitting(true); // ← OK: verrouille les boutons
  try {
    await deleteNote(note.id);
    toast.success('Note supprimée');
    navigate('/notes-aef');
  } catch (error: unknown) {
    toast.error(/* ... */);
  } finally {
    setIsSubmitting(true); // ← BUG: devrait être setIsSubmitting(false)
    setShowDeleteDialog(false);
  }
};
```

**Impact:** Si la suppression échoue, tous les boutons d'action restent désactivés (spinner infini). L'utilisateur doit recharger la page.

---

## 7. Table `lignes_estimatives_aef` — ABSENTE

### 7.1 Constat

| Critère                                 | Statut                                                                |
| --------------------------------------- | --------------------------------------------------------------------- |
| Table en base Supabase                  | ❌ **N'EXISTE PAS**                                                   |
| Migration SQL trouvée                   | ⚠️ `20260118120000_create_aef_lignes_estimatives.sql` existe en local |
| Migration appliquée                     | ❌ Jamais exécutée en base                                            |
| Hook `useLignesEstimativesAEF.ts`       | Existe (~270 lignes) — **CODE MORT**                                  |
| Composant `LignesEstimativesEditor.tsx` | Existe (470 lignes) — **CODE MORT**                                   |
| Composant `LignesEstimativesReadonly`   | Utilisé dans `NoteAEFDetails.tsx` — **SILENCIEUSEMENT VIDE**          |

### 7.2 Impact

~740 lignes de code frontend sont **mortes** car la table backend n'existe pas. L'éditeur de lignes estimatives dans le formulaire AEF ne peut pas fonctionner. Le composant Readonly dans l'aperçu affiche simplement "Aucune ligne" sans erreur visible.

---

## 8. Comparaison maturité AEF vs SEF

| Critère                       | Notes SEF                                  | Notes AEF                                           | Écart                     |
| ----------------------------- | ------------------------------------------ | --------------------------------------------------- | ------------------------- |
| **Table**                     | `notes_sef`                                | `notes_dg`                                          | Nommage incohérent        |
| **Enregistrements**           | 4 836                                      | 7                                                   | SEF >> AEF                |
| **Machine à états**           | ✅ Formelle                                | ✅ Formelle                                         | Parité                    |
| **Statuts**                   | 7 (brouillon→valide + rejete/differe)      | 7 (brouillon→impute + rejete/differe)               | OK, AEF ajoute imputation |
| **Validation Zod**            | ✅ React Hook Form + Zod                   | ❌ Validation manuelle                              | **Gap AEF**               |
| **Export Excel**              | ✅ 22 colonnes, TypeScript strict          | ✅ 20 colonnes, **`@ts-nocheck`**                   | **Gap AEF**               |
| **DetailSheet**               | ✅ 4 onglets (Infos/Contenu/PJ/Historique) | ❌ Dialog simple                                    | **Gap AEF**               |
| **QR Code**                   | ✅ Pour notes validées                     | ❌ Absent                                           | **Gap AEF**               |
| **Badge Migré**               | ✅ Détection MIG-\*                        | ❌ Absent                                           | **Gap AEF**               |
| **Limite PJ**                 | ✅ 3 max (trigger DB)                      | ❌ 10 max (config seulement, pas de trigger)        | Incohérence               |
| **Compteur total**            | ✅ "190 note(s) trouvée(s)"                | ✅ Pagination standard                              | Parité                    |
| **Référence pivot**           | ✅ Toujours présente                       | ⚠️ 3/7 notes sans référence                         | **Gap AEF**               |
| **Pièces jointes**            | ✅ Bucket `sygfp-attachments`              | ✅ Bucket `note-attachments`                        | Buckets différents        |
| **Délégations**               | ✅ Gap 2+3 résolu                          | ✅ Via `useNoteAccessControl`                       | Parité                    |
| **Notifications**             | ✅ Gap 4 résolu                            | ⚠️ Non vérifié                                      | Possible gap              |
| **Séparation des tâches**     | ✅ Hook dédié                              | ❌ Non implémentée                                  | **Gap AEF**               |
| **Protection statuts finaux** | ✅ Trigger DB                              | ✅ Trigger DB                                       | Parité                    |
| **Historique**                | ✅ `notes_sef_history`                     | ✅ `notes_aef_history`                              | Parité                    |
| **Lignes estimatives**        | N/A                                        | ❌ Table absente en DB                              | **Gap AEF**               |
| **Isolation direction**       | ✅ RLS stricte                             | ✅ RLS via `is_admin/is_dg/created_by/direction_id` | Parité                    |
| **Tests E2E**                 | ✅ `e2e/notes-sef.spec.ts`                 | ❌ Aucun fichier E2E                                | **Gap AEF**               |
| **`@ts-nocheck`**             | ❌ Aucun                                   | ⚠️ 1 fichier (export)                               | **Gap AEF**               |
| **Casts `any`**               | ~2                                         | ~6+                                                 | **Gap AEF**               |

### Score maturité

| Module    | Score      |
| --------- | ---------- |
| Notes SEF | **85/100** |
| Notes AEF | **62/100** |

---

## 9. Score de santé global : 62/100

### Décomposition

| Catégorie                    | Poids    | Score | Pondéré  |
| ---------------------------- | -------- | ----- | -------- |
| Architecture & Structure     | 15%      | 80    | 12.0     |
| Machine à états & Workflow   | 15%      | 90    | 13.5     |
| Sécurité (RLS + RBAC)        | 15%      | 85    | 12.8     |
| Intégrité données            | 15%      | 40    | 6.0      |
| Qualité TypeScript           | 10%      | 50    | 5.0      |
| Fonctionnalités UI complètes | 10%      | 55    | 5.5      |
| Tests                        | 10%      | 10    | 1.0      |
| Documentation                | 5%       | 75    | 3.8      |
| Cohérence avec SEF           | 5%       | 50    | 2.5      |
| **TOTAL**                    | **100%** | —     | **62.1** |

---

## 10. Top 10 des corrections prioritaires

### P0 — CRITIQUE (à faire immédiatement)

| #     | Correction                                                                | Fichier(s)                                         | Impact                                                                                                            |
| ----- | ------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **1** | **Appliquer la migration `lignes_estimatives_aef`** en base Supabase      | `20260118120000_create_aef_lignes_estimatives.sql` | ~740 lignes de code mortes. L'éditeur de lignes estimatives ne fonctionne pas du tout.                            |
| **2** | **Corriger le bug `setIsSubmitting(true)` → `false`** dans `handleDelete` | `NoteAEFDetail.tsx:332`                            | Boutons verrouillés en cas d'erreur suppression. Bug UX bloquant.                                                 |
| **3** | **Corriger les 3 notes legacy sans `reference_pivot`**                    | Script SQL de correction                           | 3 notes en statut `soumis`/`differe` n'ont pas de référence ARTI. Incohérence critique pour la chaîne de dépense. |
| **4** | **Corriger la note `fec71e0a` imputée sans `budget_line_id`**             | Script SQL de correction                           | Violation règle métier: imputation sans ligne budgétaire.                                                         |

### P1 — HAUTE (dans la semaine)

| #     | Correction                                                                                                          | Fichier(s)                                             | Impact                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **5** | **Retirer `// @ts-nocheck`** de `useNotesAEFExport.ts` et typer correctement                                        | `useNotesAEFExport.ts`                                 | 359 lignes sans vérification de type. Risque de bugs silencieux.                                         |
| **6** | **Remplacer les casts `(supabase as any)` et `(supabase.from as any)`** par des types génériques ou table overrides | `NoteAEFDetail.tsx:192,221`                            | Si la table `notes_aef_history` n'est pas dans les types générés, ajouter un override.                   |
| **7** | **Créer un `NoteAEFDetailSheet` (volet latéral 4 onglets)** comme pour SEF                                          | Nouveau composant + `NoteAEFList.tsx` + `NotesAEF.tsx` | Parité UX avec le module SEF. Le clic sur une ligne devrait ouvrir un Sheet, pas naviguer vers une page. |

### P2 — MOYENNE (dans le sprint)

| #      | Correction                                                             | Fichier(s)                             | Impact                                                                                              |
| ------ | ---------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **8**  | **Ajouter validation Zod** au formulaire `NoteAEFForm`                 | `NoteAEFForm.tsx`                      | Remplacer la validation manuelle par React Hook Form + Zod pour cohérence avec SEF.                 |
| **9**  | **Ajouter les tests E2E Playwright** pour le module AEF                | Nouveau `e2e/notes-aef.spec.ts`        | Aucun test E2E. Module non couvert par la CI.                                                       |
| **10** | **Ajouter QR Code + Badge Migré** pour les notes AEF validées/imputées | `NoteAEFDetail.tsx`, `NoteAEFList.tsx` | Parité fonctionnelle avec SEF. Le QR code existe déjà (`QRCodeGenerator`), il suffit de l'intégrer. |

---

## Annexe A : Données brutes en base (7 notes)

| Numero         | Statut    | Exercice | Origine  | note_sef_id   | budget_line_id | reference_pivot        |
| -------------- | --------- | -------- | -------- | ------------- | -------------- | ---------------------- |
| NOTE-2026-0002 | brouillon | 2026     | FROM_SEF | ✅ `d0f99c9d` | ❌ null        | ✅ `ARTI001260002-NOA` |
| NOTE-2026-0001 | brouillon | 2026     | FROM_SEF | ✅ `814db894` | ❌ null        | ✅ `ARTI001260001`     |
| NOTE-2025-0005 | impute    | 2026     | DIRECT   | ❌ null       | ✅ `69cd4516`  | ❌ null                |
| NOTE-2025-0004 | impute    | 2026     | FROM_SEF | ✅ `97c91305` | ❌ null ⚠️     | ✅ `ARTI001260003`     |
| NOTE-2025-0003 | soumis    | 2026     | DIRECT   | ❌ null       | ❌ null        | ❌ null                |
| NOTE-2025-0002 | soumis    | 2026     | DIRECT   | ❌ null       | ❌ null        | ❌ null                |
| NOTE-2025-0001 | differe   | 2026     | DIRECT   | ❌ null       | ❌ null        | ❌ null                |

### Résumé statistique

- **Par statut:** 2 brouillon, 2 soumis, 2 impute, 1 differe
- **Par origine:** 3 FROM_SEF, 4 DIRECT
- **Pièces jointes:** 0 (aucune PJ sur aucune note AEF)
- **Historique:** 8 entrées dans `notes_aef_history` (triggers + mutations)

---

## Annexe B : Routes

| Route                   | Page                     | Accès                           |
| ----------------------- | ------------------------ | ------------------------------- |
| `/notes-aef`            | `NotesAEF.tsx`           | Tous authentifiés               |
| `/notes-aef/:id`        | `NoteAEFDetail.tsx`      | RBAC via `useNoteAccessControl` |
| `/notes-aef/validation` | `ValidationNotesAEF.tsx` | DAAF/DG/ADMIN                   |

---

## Annexe C : Machine à états AEF

```
                    ┌─────────────┐
                    │  brouillon  │
                    └──────┬──────┘
                           │ soumettre
                    ┌──────▼──────┐
               ┌────│   soumis    │────┐
               │    └──────┬──────┘    │
               │           │           │
          rejeter    valider DG    différer
               │           │           │
        ┌──────▼──┐  ┌─────▼─────┐  ┌─▼────────┐
        │ rejete  │  │ a_imputer │  │ differe  │
        │ (final) │  └─────┬─────┘  └──┬───────┘
        └─────────┘        │           │
                      imputer CB    reprendre
                           │           │
                    ┌──────▼──────┐    │
                    │   impute    │◄───┘
                    │   (final)   │  (via soumis)
                    └─────────────┘
```

---

_Audit généré le 12/02/2026 — Aucun fichier source modifié_
