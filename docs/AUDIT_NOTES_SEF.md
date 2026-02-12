# Audit Complet - Module Notes SEF

**Date :** 11 février 2026
**Système :** SYGFP - Système de Gestion des Finances Publiques
**Organisation :** ARTI - Autorité de Régulation du Transport Intérieur (Côte d'Ivoire)
**Module audité :** Notes SEF (Sans Effet Financier) - Étape 1 de la chaîne de dépense ELOP
**Type :** Audit READ-ONLY (aucune modification effectuée)

---

## Table des matières

1. [Cartographie des fichiers](#1-cartographie-des-fichiers)
2. [Schéma base de données](#2-schéma-base-de-données)
3. [Analyse du hook useNotesSEF](#3-analyse-du-hook-usenotesef)
4. [Analyse de l'espace validation](#4-analyse-de-lespace-validation)
5. [Format de référence ARTI](#5-format-de-référence-arti)
6. [Problèmes détectés](#6-problèmes-détectés)
7. [Recommandations](#7-recommandations)

---

## 1. Cartographie des fichiers

### Résumé

| Catégorie                         | Fichiers | Lignes totales |
| --------------------------------- | -------- | -------------- |
| Pages                             | 3        | 2 410          |
| Composants                        | 15       | 4 877          |
| Hooks                             | 7        | 2 814          |
| Lib (types, constantes, services) | 6        | 1 564          |
| Services                          | 1        | 745            |
| **TOTAL**                         | **32**   | **12 410**     |

### 1.1 Pages (3 fichiers - 2 410 lignes)

| Fichier                            | Lignes | Route                   | Description                                                                  |
| ---------------------------------- | ------ | ----------------------- | ---------------------------------------------------------------------------- |
| `src/pages/NotesSEF.tsx`           | 476    | `/notes-sef`            | Page principale : liste, onglets par statut, création, export                |
| `src/pages/NoteSEFDetail.tsx`      | 1 298  | `/notes-sef/:id`        | Page détail : édition, soumission, validation, rejet, report, pièces jointes |
| `src/pages/ValidationNotesSEF.tsx` | 636    | `/notes-sef/validation` | File de validation : KPI, recherche, 3 boutons d'action                      |

### 1.2 Composants (15 fichiers - 4 877 lignes)

| Fichier                                               | Lignes | Description                                                           |
| ----------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| `src/components/notes-sef/NoteSEFForm.tsx`            | 1 088  | Dialog création/édition. **@ts-nocheck**                              |
| `src/components/notes-sef/NoteSEFDetails.tsx`         | 1 020  | Dialog détail avec onglets, pièces jointes, imputation, validation DG |
| `src/components/notes-sef/NoteSEFList.tsx`            | 434    | DataTable avec badges statut/urgence, actions dropdown par ligne      |
| `src/components/notes-sef/NotesSEFTable.tsx`          | 327    | Table triable, 8 colonnes                                             |
| `src/components/notes-sef/NoteSEFPreviewDrawer.tsx`   | 276    | Sheet latéral aperçu rapide                                           |
| `src/components/notes-sef/NotesSEFExports.tsx`        | 272    | Dropdown export (Excel/PDF/CSV)                                       |
| `src/components/notes-sef/NoteSEFChecklist.tsx`       | 219    | Checklist QA (73 items, 10 catégories)                                |
| `src/components/notes-sef/NoteSEFValidationCard.tsx`  | 219    | Carte validation avec 3 boutons d'action                              |
| `src/components/notes-sef/NSEFParentSelector.tsx`     | 206    | Sélecteur de note SEF parent pour lien NAEF                           |
| `src/components/notes-sef/NotesSEFFilters.tsx`        | 204    | Filtres : recherche + direction + plage dates                         |
| `src/components/notes-sef/NoteSEFCreateAEFButton.tsx` | 151    | Navigation vers création AEF depuis SEF validée                       |
| `src/components/notes-sef/NotesSEFListV2.tsx`         | 145    | Orchestrateur liste V2. **@ts-nocheck**                               |
| `src/components/notes-sef/NoteSEFDeferDialog.tsx`     | 142    | AlertDialog report (motif + condition + date reprise)                 |
| `src/components/notes-sef/NoteSEFRejectDialog.tsx`    | 96     | AlertDialog rejet (motif obligatoire)                                 |
| `src/components/notes-sef/NotesSEFTabs.tsx`           | 78     | 6 onglets avec compteurs badges                                       |

### 1.3 Hooks (7 fichiers - 2 814 lignes)

| Fichier                            | Lignes | Description                                                                   |
| ---------------------------------- | ------ | ----------------------------------------------------------------------------- |
| `src/hooks/useNotesSEFExport.ts`   | 930    | Export Excel/PDF/CSV, max 10 000 lignes, filtrage RBAC                        |
| `src/hooks/useNotesSEF.ts`         | 868    | Hook CRUD principal : create, update, submit, validate, reject, defer, delete |
| `src/hooks/useNotesSEFAudit.ts`    | 329    | Audit trail + notifications aux validateurs                                   |
| `src/hooks/useNotesSEFList.ts`     | 231    | Liste paginée server-side via RPC, debounce 300ms                             |
| `src/hooks/useExportNoteSEFPdf.ts` | 199    | Export PDF note individuelle                                                  |
| `src/hooks/useNoteSEFAutosave.ts`  | 173    | Sauvegarde auto brouillons (debounce 3s, beforeunload)                        |
| `src/hooks/useNotesSEFCounts.ts`   | 84     | Compteurs par statut pour onglets                                             |

### 1.4 Lib (6 fichiers - 1 564 lignes)

| Fichier                                 | Lignes | Description                                                             |
| --------------------------------------- | ------ | ----------------------------------------------------------------------- |
| `src/lib/notes-sef/notesSefService.ts`  | 564    | Service CRUD, RPCs : `search_notes_sef_v2`, `count_search_notes_sef_v2` |
| `src/lib/notes-sef/constants.ts`        | 280    | Statuts, urgences, transitions, actions audit, config module            |
| `src/lib/notes-sef/types.ts`            | 252    | NoteSEFEntity (43 champs), DTOs, Filtres, PaginatedResult               |
| `src/lib/notes-sef/helpers.ts`          | 248    | 22 fonctions utilitaires (labels, transitions, validation, formatage)   |
| `src/lib/notes-sef/referenceService.ts` | 200    | Génération/parsing/formatage référence ARTI pivot                       |
| `src/lib/notes-sef/index.ts`            | 20     | Barrel export                                                           |

### 1.5 Services (1 fichier - 745 lignes)

| Fichier                             | Lignes | Description                                                                 |
| ----------------------------------- | ------ | --------------------------------------------------------------------------- |
| `src/services/noteSEFPdfService.ts` | 745    | PDF 2 pages jsPDF + QR code + blocs signatures + support intérim/délégation |

### 1.6 Routes (depuis App.tsx)

```
/notes-sef            → NotesSEF (lazy)
/notes-sef/validation → ValidationNotesSEF (lazy)
/notes-sef/:id        → NoteSEFDetail (lazy)
```

---

## 2. Schéma base de données

### 2.1 Table `notes_sef` (43 colonnes)

| Colonne                   | Type        | Nullable | Description                                      |
| ------------------------- | ----------- | -------- | ------------------------------------------------ |
| `id`                      | uuid        | NON      | Clé primaire                                     |
| `numero`                  | text        | OUI      | Numéro séquentiel hérité                         |
| `reference_pivot`         | text        | OUI      | Référence ARTI pivot (13 chars)                  |
| `exercice`                | smallint    | NON      | Année budgétaire                                 |
| `objet`                   | text        | NON      | Objet de la note                                 |
| `description`             | text        | OUI      | Description détaillée                            |
| `justification`           | text        | OUI      | Justification de la dépense                      |
| `statut`                  | text        | OUI      | Statut workflow (voir 2.4)                       |
| `urgence`                 | text        | OUI      | Niveau d'urgence                                 |
| `direction_id`            | uuid        | OUI      | FK → `directions`                                |
| `demandeur_id`            | uuid        | OUI      | FK → `profiles`                                  |
| `demandeur_display`       | text        | OUI      | Nom demandeur dénormalisé                        |
| `beneficiaire_id`         | uuid        | OUI      | FK → `prestataires` (externe)                    |
| `beneficiaire_interne_id` | uuid        | OUI      | FK → `profiles` (interne)                        |
| `beneficiaire_nom`        | text        | OUI      | Nom bénéficiaire dénormalisé                     |
| `beneficiaire_type`       | text        | OUI      | `externe` \| `interne` \| `none`                 |
| `montant_estime`          | numeric     | OUI      | Montant estimé FCFA                              |
| `type_depense`            | text        | OUI      | Type de dépense                                  |
| `os_id`                   | uuid        | OUI      | FK → `objectifs_strategiques`                    |
| `mission_id`              | uuid        | OUI      | FK → `missions`                                  |
| `projet_id`               | uuid        | OUI      | FK → `projets`                                   |
| `dossier_id`              | uuid        | OUI      | FK → `dossiers` (créé à la validation)           |
| `note_aef_id`             | uuid        | OUI      | FK → note AEF liée                               |
| `type_demande_id`         | uuid        | OUI      | FK → `types_demande`                             |
| `redacteur_id`            | uuid        | OUI      | FK → `profiles`                                  |
| `initiales_redacteur`     | text        | OUI      | Initiales rédacteur                              |
| `dg_validation_required`  | boolean     | OUI      | Validation DG requise                            |
| `observations_dg`         | text        | OUI      | Observations du DG                               |
| `commentaire`             | text        | OUI      | Commentaire libre                                |
| `date_souhaitee`          | date        | OUI      | Date souhaitée exécution                         |
| `created_by`              | uuid        | OUI      | FK → `profiles` (créateur)                       |
| `created_at`              | timestamptz | NON      | Date création                                    |
| `updated_at`              | timestamptz | NON      | Date mise à jour                                 |
| `submitted_by`            | uuid        | OUI      | FK → `profiles` (soumetteur)                     |
| `submitted_at`            | timestamptz | OUI      | Date soumission                                  |
| `validated_by`            | uuid        | OUI      | FK → `profiles` (validateur)                     |
| `validated_at`            | timestamptz | OUI      | Date validation                                  |
| `rejected_by`             | uuid        | OUI      | FK → `profiles` (rejeteur)                       |
| `rejected_at`             | timestamptz | OUI      | Date rejet                                       |
| `rejection_reason`        | text        | OUI      | Motif de rejet                                   |
| `decided_by`              | uuid        | OUI      | FK → `profiles` (décideur générique)             |
| `decided_at`              | timestamptz | OUI      | Date décision                                    |
| `decision_reason`         | text        | OUI      | Motif décision                                   |
| `differe_by`              | uuid        | OUI      | FK → `profiles` (ayant différé)                  |
| `differe_at`              | timestamptz | OUI      | Date report                                      |
| `differe_motif`           | text        | OUI      | Motif du report                                  |
| `differe_condition`       | text        | OUI      | Condition de reprise                             |
| `differe_date_reprise`    | date        | OUI      | Date de reprise prévue                           |
| `expose`                  | text        | OUI      | Exposé détaillé de la situation                  |
| `avis`                    | text        | OUI      | Avis technique/fonctionnel                       |
| `recommandations`         | text        | OUI      | Recommandations de traitement                    |
| `dossier_ref`             | text        | OUI      | Référence dossier immuable (ARTI format, UNIQUE) |
| `is_deleted`              | boolean     | OUI      | Soft delete                                      |

### 2.2 Clés étrangères (15 FK)

| Colonne                   | Table cible              | Relation                     |
| ------------------------- | ------------------------ | ---------------------------- |
| `beneficiaire_id`         | `prestataires`           | Bénéficiaire externe         |
| `beneficiaire_interne_id` | `profiles`               | Bénéficiaire interne ARTI    |
| `created_by`              | `profiles`               | Créateur                     |
| `decided_by`              | `profiles`               | Décideur                     |
| `demandeur_id`            | `profiles`               | Demandeur                    |
| `differe_by`              | `profiles`               | Auteur du report             |
| `direction_id`            | `directions`             | Direction émettrice          |
| `dossier_id`              | `dossiers`               | Dossier créé à la validation |
| `mission_id`              | `missions`               | Mission budgétaire           |
| `os_id`                   | `objectifs_strategiques` | Objectif stratégique         |
| `projet_id`               | `projets`                | Projet lié                   |
| `redacteur_id`            | `profiles`               | Rédacteur                    |
| `rejected_by`             | `profiles`               | Auteur du rejet              |
| `submitted_by`            | `profiles`               | Soumetteur                   |
| `type_demande_id`         | `types_demande`          | Type de demande              |
| `validated_by`            | `profiles`               | Validateur                   |

### 2.2b Triggers et fonctions SQL

| Trigger/Fonction                      | Type                 | Description                                           |
| ------------------------------------- | -------------------- | ----------------------------------------------------- |
| `generate_note_sef_numero()`          | BEFORE INSERT        | Auto-génère `numero` (SEF-YYYY-XXXXXX)                |
| `generate_note_sef_reference_pivot()` | BEFORE INSERT        | Auto-génère `reference_pivot` (ARTI format 13 chars)  |
| `trg_set_dossier_ref()`               | BEFORE INSERT/UPDATE | Auto-génère `dossier_ref` immuable (ARTI format)      |
| `sync_notes_sef_snapshots()`          | AFTER INSERT/UPDATE  | Synchronise `demandeur_display` et `beneficiaire_nom` |
| `update_notes_sef_updated_at`         | BEFORE UPDATE        | Met à jour `updated_at` automatiquement               |

### 2.2c Index de performance

| Index                              | Colonnes                      | Description                     |
| ---------------------------------- | ----------------------------- | ------------------------------- |
| `idx_notes_sef_exercice`           | `exercice`                    | Filtre par année budgétaire     |
| `idx_notes_sef_direction`          | `direction_id`                | Filtre par direction            |
| `idx_notes_sef_statut`             | `statut`                      | Filtre par statut workflow      |
| `idx_notes_sef_created_by`         | `created_by`                  | Filtre par créateur             |
| `idx_notes_sef_exercice_ref_pivot` | `(exercice, reference_pivot)` | Recherche composite             |
| `idx_notes_sef_objet_search`       | `(objet, numero)` GIN         | Recherche plein texte           |
| `idx_notes_sef_dossier_ref`        | `dossier_ref`                 | Recherche par référence dossier |

### 2.3 Tables liées

| Table                     | Rôle                                       | Colonnes clés                                                                                              |
| ------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `notes_sef_history`       | Historique des transitions de statut       | `note_id`, `action`, `old_statut`, `new_statut`, `performed_by`, `performed_at`, `commentaire`, `metadata` |
| `notes_sef_pieces`        | Pièces jointes (système unifié)            | `note_id`, `fichier_url`, `nom`, `type_fichier`, `taille`, `uploaded_by`, `uploaded_at`                    |
| `notes_sef_attachments`   | Pièces jointes (système legacy)            | `note_id`, `file_name`, `file_path`, `file_type`, `file_size`, `uploaded_by`                               |
| `notes_sef_sequences`     | Compteur auto-incrément `numero`           | `annee`, `dernier_numero` (UNIQUE annee)                                                                   |
| `affectations_notes`      | Affectations de notes aux services         | `note_sef_id`, `affecte_par`, `service_destinataire_id`, `type_affectation`, `lu`, `lu_par`                |
| `note_imputations`        | Imputations DG sur les notes               | `note_sef_id`, `impute_par_user_id` (UNIQUE note_sef_id)                                                   |
| `note_imputation_lignes`  | Lignes d'imputation individuelles          | `imputation_id`, `destinataire`, `destinataire_id`, `instruction_type`, `priorite`, `delai`, `ordre`       |
| `validation_dg`           | Validations DG avec QR codes               | `note_type`, `note_id`, `token` (UNIQUE), `status`, `validated_by_user_id`, `qr_payload_url`               |
| `arti_reference_counters` | Compteurs séquentiels pour références ARTI | `etape`, `mois`, `annee`, `dernier_numero`                                                                 |

### 2.4 Statuts du workflow

```
brouillon → soumis → a_valider → valide (état final)
                                → rejete (état final)
                                → differe → a_valider (reprise)
                                          → valide (validation directe)
```

**Matrice de transitions** (depuis `constants.ts`) :

| Statut actuel | Transitions autorisées                       |
| ------------- | -------------------------------------------- |
| `brouillon`   | → `soumis`                                   |
| `soumis`      | → `a_valider`, `valide`, `rejete`, `differe` |
| `a_valider`   | → `valide`, `rejete`, `differe`              |
| `differe`     | → `valide`, `a_valider`                      |
| `valide`      | _(état final - aucune transition)_           |
| `rejete`      | _(état final - aucune transition)_           |

### 2.5 Politiques RLS (Row-Level Security)

#### Table `notes_sef`

| Politique                       | Opération | Règle                                                                       |
| ------------------------------- | --------- | --------------------------------------------------------------------------- |
| `notes_sef_select_policy`       | SELECT    | Filtre exercice actif + (créateur OU validateur OU même direction OU admin) |
| `notes_sef_insert_policy`       | INSERT    | Utilisateur authentifié + exercice actif                                    |
| `notes_sef_update_policy`       | UPDATE    | (Créateur + brouillon) OU (validateur + soumis/a_valider/differe) OU admin  |
| `notes_sef_delete_policy`       | DELETE    | Admin OU (créateur + brouillon)                                             |
| `notes_sef_validate_authorized` | UPDATE    | Validation restreinte aux rôles validateurs                                 |

#### Table `notes_sef_pieces`

| Politique           | Opération | Règle                             |
| ------------------- | --------- | --------------------------------- |
| `sef_pieces_select` | SELECT    | Lecture si accès à la note parent |
| `sef_pieces_insert` | INSERT    | Utilisateur authentifié           |
| `sef_pieces_update` | UPDATE    | Uploadeur ou admin                |
| `sef_pieces_delete` | DELETE    | Uploadeur ou admin                |

#### Bucket Storage `notes-sef`

| Politique                 | Opération | Règle                   |
| ------------------------- | --------- | ----------------------- |
| `notes_sef_bucket_select` | SELECT    | Utilisateur authentifié |
| `notes_sef_bucket_insert` | INSERT    | Utilisateur authentifié |
| `notes_sef_bucket_delete` | DELETE    | Utilisateur authentifié |

#### Fonctions SQL de sécurité

| Fonction                       | Description                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| `is_notes_sef_validator(uuid)` | Vérifie si l'utilisateur est DG, DAAF, CB, ou Directeur (peut valider) |
| `is_notes_sef_admin(uuid)`     | Vérifie si l'utilisateur a le rôle ADMIN                               |
| `get_user_exercice_actif()`    | Retourne l'exercice actif de l'utilisateur                             |

---

## 3. Analyse du hook useNotesSEF

**Fichier :** `src/hooks/useNotesSEF.ts` (868 lignes)

### 3.1 Structure du hook

Le hook `useNotesSEF` est le hook CRUD principal. Il retourne :

```typescript
{
  notes: NoteSEFEntity[],        // Liste des notes (via useNotesSEFList)
  isLoading: boolean,
  counts: NoteSEFCounts,         // Compteurs par statut

  // Mutations
  createNote(dto),               // Création
  updateNote(dto),               // Mise à jour
  submitNote(id),                // Soumission brouillon → soumis
  validateNote(id),              // Validation soumis → valide
  rejectNote(id, reason),        // Rejet soumis → rejete
  deferNote(id, dto),            // Report soumis → differe
  deleteNote(id),                // Suppression (soft)
}
```

### 3.2 Flux de création

1. Appel `supabase.from('notes_sef').insert(...)` avec les champs du DTO
2. Si fichiers attachés : upload vers bucket `notes-sef` + insert dans `notes_sef_pieces`
3. Génération de référence ARTI via RPC `generate_arti_reference` (si pas de trigger)
4. Invalidation cache React Query
5. Audit : insert dans `notes_sef_history` + `audit_logs`

### 3.3 Flux de soumission (brouillon → soumis)

1. Vérifie `statut === 'brouillon'`
2. Vérifie RBAC : créateur ou admin
3. Update `statut = 'soumis'`, `submitted_by = user.id`, `submitted_at = now()`
4. Insert historique : `notes_sef_history` (action = 'soumission')
5. Notification aux validateurs (DG, DAAF, ADMIN) via `useNotesSEFAudit`
6. Invalidation cache React Query

### 3.4 Flux de validation (soumis → valide)

1. Vérifie `statut IN ('soumis', 'a_valider')`
2. Vérifie RBAC : rôle dans `VALIDATOR_ROLES` (ADMIN, DG, DAAF)
3. Update `statut = 'valide'`, `validated_by = user.id`, `validated_at = now()`
4. **Auto-création d'un dossier** dans la table `dossiers` (si non existant)
5. Link : update `notes_sef.dossier_id = dossier.id`
6. Insert historique + notification au créateur
7. Invalidation cache

### 3.5 Flux de rejet (soumis → rejete)

1. Vérifie `statut IN ('soumis', 'a_valider')`
2. Vérifie RBAC validateur
3. Update `statut = 'rejete'`, `rejected_by`, `rejected_at`, `rejection_reason = motif`
4. Insert historique + notification au créateur
5. Invalidation cache

### 3.6 Flux de report / différé (soumis → differe)

1. Vérifie `statut IN ('soumis', 'a_valider')`
2. Vérifie RBAC validateur
3. Update :
   - `statut = 'differe'`
   - `differe_by = user.id`
   - `differe_at = now()`
   - `differe_motif = dto.motif`
   - `differe_condition = dto.condition` (optionnel)
   - `differe_date_reprise = dto.dateReprise` (optionnel)
4. Insert historique + notification au créateur
5. Invalidation cache

### 3.7 Hooks dépendants

| Hook                 | Appel                                         | Description                       |
| -------------------- | --------------------------------------------- | --------------------------------- |
| `useNotesSEFList`    | RPC `search_notes_sef_v2`                     | Liste paginée, debounce 300ms     |
| `useNotesSEFCounts`  | `supabase.from('notes_sef').select('statut')` | Comptage par statut               |
| `useNotesSEFAudit`   | Insert `audit_logs` + `notifications`         | Audit trail + notifications       |
| `useNoteSEFAutosave` | `supabase.from('notes_sef').update(...)`      | Auto-save brouillons, debounce 3s |

---

## 4. Analyse de l'espace validation

**Fichier principal :** `src/pages/ValidationNotesSEF.tsx` (636 lignes)

### 4.1 Accès et RBAC

- **Route :** `/notes-sef/validation`
- **Garde RBAC :** Redirect vers `/notes-sef` si `!canValidate`
- **Rôles autorisés :** `ADMIN`, `DG`, `DAAF` (via `VALIDATOR_ROLES`)
- **Support délégation :** Oui, vérifie `activeDelegations` pour le droit de validation
- **Filtre notes affichées :** `statut IN ('soumis', 'a_valider')`

### 4.2 Les 3 boutons d'action

#### Bouton "Valider" (vert)

| Propriété        | Valeur                                              |
| ---------------- | --------------------------------------------------- |
| Icône            | `CheckCircle`                                       |
| Style            | `bg-success text-white`                             |
| Champs sauvés    | `statut = 'valide'`, `validated_by`, `validated_at` |
| Effet secondaire | Auto-création dossier + lien `dossier_id`           |
| Dialog           | Aucun (action directe avec toast de confirmation)   |

#### Bouton "Différer" (orange)

| Propriété     | Valeur                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Icône         | `PauseCircle`                                                                                                  |
| Style         | `bg-orange-500 text-white`                                                                                     |
| Champs sauvés | `statut = 'differe'`, `differe_by`, `differe_at`, `differe_motif`, `differe_condition`, `differe_date_reprise` |
| Dialog        | `NoteSEFDeferDialog` — 3 champs : motif (obligatoire), condition (optionnel), date reprise (optionnel)         |

#### Bouton "Rejeter" (rouge)

| Propriété     | Valeur                                                                |
| ------------- | --------------------------------------------------------------------- |
| Icône         | `XCircle`                                                             |
| Style         | `bg-destructive text-white`                                           |
| Champs sauvés | `statut = 'rejete'`, `rejected_by`, `rejected_at`, `rejection_reason` |
| Dialog        | `NoteSEFRejectDialog` — 1 champ : motif (obligatoire)                 |

### 4.3 KPI Cards (4 indicateurs)

| KPI             | Source                            | Description                 |
| --------------- | --------------------------------- | --------------------------- |
| En attente      | Comptage `soumis` + `a_valider`   | Notes à traiter             |
| Validées (mois) | Comptage `valide` du mois courant | Performance mensuelle       |
| Rejetées (mois) | Comptage `rejete` du mois courant | Taux de rejet mensuel       |
| Différées       | Comptage `differe`                | Notes en attente de reprise |

### 4.4 Composants de validation

| Composant               | Fichier                                  | Rôle                                             |
| ----------------------- | ---------------------------------------- | ------------------------------------------------ |
| `NoteSEFValidationCard` | `NoteSEFValidationCard.tsx` (219 lignes) | Carte avec résumé note + 3 boutons action        |
| `NoteSEFRejectDialog`   | `NoteSEFRejectDialog.tsx` (96 lignes)    | AlertDialog rejet avec textarea motif            |
| `NoteSEFDeferDialog`    | `NoteSEFDeferDialog.tsx` (142 lignes)    | AlertDialog report avec motif + condition + date |

---

## 5. Format de référence ARTI

### 5.1 Format actuel (implémenté dans `referenceService.ts`)

```
ARTI + ÉTAPE(1) + MM(2) + YY(2) + NNNN(4) = 13 caractères
```

| Segment | Longueur | Description               | Exemple   |
| ------- | -------- | ------------------------- | --------- |
| `ARTI`  | 4        | Préfixe organisme         | `ARTI`    |
| Étape   | 1        | Code étape chaîne dépense | `0` (SEF) |
| Mois    | 2        | Mois de création (01-12)  | `01`      |
| Année   | 2        | 2 derniers chiffres année | `26`      |
| Numéro  | 4        | Compteur séquentiel       | `0001`    |

**Exemple complet :** `ARTI0012600001` = Note SEF, janvier 2026, 1er document

### 5.2 Codes étapes de la chaîne de dépense

| Code | Étape                | Abréviation |
| ---- | -------------------- | ----------- |
| 0    | Note SEF             | SEF         |
| 1    | Note AEF             | AEF         |
| 2    | Imputation           | IMP         |
| 3    | Expression de besoin | EB          |
| 4    | Passation de marché  | PM          |
| 5    | Engagement           | ENG         |
| 6    | Liquidation          | LIQ         |
| 7    | Ordonnancement       | ORD         |
| 8    | Règlement            | REG         |

### 5.3 Regex de validation

```
/^ARTI[0-9]{9}$/    (referenceService.ts - 13 chars - CORRECT)
/^(ARTI)(01)(\d{2})(\d{4})$/  (constants.ts - 12 chars - DIVERGENT)
```

### 5.4 Format affiché (formatage lisible)

```
ARTI0012600001 → ARTI-0-01/26-0001    (format long)
ARTI0012600001 → SEF-01/26-0001       (format court)
```

### 5.5 Génération

- **Méthode :** RPC PostgreSQL `generate_arti_reference(p_etape, p_date)`
- **Table compteurs :** `arti_reference_counters` (étape, mois, année, dernier_numero)
- **Atomicité :** UPSERT SQL (safe concurrence)
- **Déclenchement :** Trigger BEFORE INSERT sur `notes_sef` ou appel manuel

---

## 6. Problèmes détectés

### P1. `@ts-nocheck` dans 2 fichiers (Sévérité : HAUTE)

| Fichier                                       | Lignes |
| --------------------------------------------- | ------ |
| `src/components/notes-sef/NoteSEFForm.tsx`    | 1 088  |
| `src/components/notes-sef/NotesSEFListV2.tsx` | 145    |

**Impact :** 1 233 lignes de code sans vérification TypeScript. Les erreurs de type ne sont pas détectées à la compilation.
**Risque :** Bugs runtime silencieux, régressions non détectées lors de refactoring.

### P2. Incohérence format de référence entre `constants.ts` et `referenceService.ts` (Sévérité : MOYENNE)

| Fichier                       | Format documenté                            | Longueur | Regex                          |
| ----------------------------- | ------------------------------------------- | -------- | ------------------------------ |
| `constants.ts` (l.229-233)    | `ARTI01YYNNNN` (module 01)                  | 12 chars | `/^(ARTI)(01)(\d{2})(\d{4})$/` |
| `referenceService.ts` (l.3-5) | `ARTI + ÉTAPE(1) + MM(2) + YY(2) + NNNN(4)` | 13 chars | `/^ARTI[0-9]{9}$/`             |

**Impact :** La fonction `parseReferencePivot()` dans `constants.ts` ne parsera PAS les références réelles de 13 caractères (format ARTI0MMYYNNNN). Elle attend `ARTI01YYNNNN` (12 chars avec code module fixe "01") alors que le format réel est `ARTI0012600001` (13 chars avec étape=0, mois=01, année=26, numéro=0001).
**Le format correct est celui de `referenceService.ts`.**

### P3. Notes différées absentes de la file de validation (Sévérité : MOYENNE)

Dans `ValidationNotesSEF.tsx`, le filtre des notes affichées cible `statut IN ('soumis', 'a_valider')`. Les notes au statut `differe` ne sont pas affichées dans la file de validation, alors que la matrice de transitions autorise `differe → valide` et `differe → a_valider`.

**Impact :** Un validateur ne peut pas directement valider une note différée depuis la file de validation. Il doit passer par la page détail.

### P4. Absence de debounce sur le filtre de recherche `NotesSEFFilters` (Sévérité : BASSE)

Le composant `NotesSEFFilters.tsx` appelle `onSearchChange(value)` directement sur l'événement `onChange` du champ de recherche, sans debounce.

**Note :** Le hook `useNotesSEFList.ts` a un debounce de 300ms côté hook, ce qui atténue partiellement le problème. Mais des re-renders inutiles sont déclenchés à chaque frappe.

### P5. Fallback date PDF vers date du jour (Sévérité : BASSE)

Dans `noteSEFPdfService.ts`, lorsqu'il n'y a pas de validation DG ou que la date est absente, le service utilise `new Date()` comme fallback pour la date du document PDF. Cela peut produire des PDFs avec une date incohérente.

### P6. Champs dénormalisés potentiellement désynchronisés (Sévérité : BASSE)

Les colonnes `demandeur_display`, `beneficiaire_nom` et `beneficiaire_type` sont des copies dénormalisées de données présentes dans les tables `profiles` et `prestataires`. Il n'y a pas de trigger de synchronisation visible — si le nom d'un agent ou prestataire change, ces champs deviennent obsolètes.

### P7. Duplication de constantes (Sévérité : INFO)

Des constantes liées aux statuts et urgences sont définies dans `constants.ts` mais aussi localement dans certains composants (`NoteSEFForm.tsx`, `NoteSEFList.tsx`). Cela crée un risque de divergence.

---

## 7. Recommandations

### Priorité haute

1. **Supprimer les `@ts-nocheck`** de `NoteSEFForm.tsx` et `NotesSEFListV2.tsx` en corrigeant les erreurs TypeScript sous-jacentes. Ce sont les 2 plus gros fichiers du module.

2. **Harmoniser le format de référence** : aligner `constants.ts::parseReferencePivot()` sur le format réel 13 caractères de `referenceService.ts`, ou supprimer la fonction redondante au profit de `parseARTIReferenceLocal()`.

### Priorité moyenne

3. **Ajouter les notes `differe` dans la file de validation** ou créer un onglet dédié "Différées" dans `ValidationNotesSEF.tsx` pour permettre la reprise/validation directe.

4. **Créer des triggers de synchronisation** pour les champs dénormalisés (`demandeur_display`, `beneficiaire_nom`) ou basculer vers des jointures dynamiques.

### Priorité basse

5. **Ajouter un debounce** dans `NotesSEFFilters.tsx` au niveau du composant (300ms minimum) pour réduire les re-renders inutiles.

6. **Centraliser les constantes** : supprimer les duplications locales dans les composants au profit de `constants.ts`.

7. **Corriger le fallback date PDF** : utiliser `validated_at` ou `submitted_at` comme date du document plutôt que `new Date()`.

---

## Annexe A — Diagramme de flux workflow

```
┌────────────┐    Soumission     ┌────────────┐
│            │ ───────────────► │            │
│  Brouillon │                   │   Soumis   │
│            │                   │            │
└────────────┘                   └─────┬──────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │  À valider   │
                                └──────┬───────┘
                           ┌───────────┼───────────┐
                           ▼           ▼           ▼
                    ┌──────────┐ ┌──────────┐ ┌──────────┐
                    │  Validé  │ │  Rejeté  │ │ Différé  │
                    │  (final) │ │  (final) │ │          │
                    └──────────┘ └──────────┘ └─────┬────┘
                                                    │
                                         Reprise    │
                                    ┌───────────────┘
                                    ▼
                             ┌──────────────┐
                             │  À valider   │ (ou validation directe)
                             └──────────────┘
```

## Annexe B — Rôles RBAC

| Rôle                 | Créer     | Soumettre | Valider   | Rejeter   | Différer  | Supprimer      | Export       |
| -------------------- | --------- | --------- | --------- | --------- | --------- | -------------- | ------------ |
| Agent (Opérationnel) | Ses notes | Ses notes | -         | -         | -         | Ses brouillons | Sa direction |
| Directeur            | Direction | Direction | Direction | Direction | Direction | -              | Sa direction |
| DAAF                 | Toutes    | Toutes    | Toutes    | Toutes    | Toutes    | -              | Toutes       |
| DG                   | Toutes    | Toutes    | Toutes    | Toutes    | Toutes    | -              | Toutes       |
| ADMIN                | Toutes    | Toutes    | Toutes    | Toutes    | Toutes    | Toutes         | Toutes       |

## Annexe C — Chaîne de dépense ELOP (9 étapes)

```
Note SEF (0) → Note AEF (1) → Imputation (2) → Expression de besoin (3)
→ Passation de marché (4) → Engagement (5) → Liquidation (6)
→ Ordonnancement (7) → Règlement (8)
```

La note SEF est le **point d'entrée** de la chaîne. Sa validation déclenche la création automatique d'un dossier qui accompagnera le document à travers toutes les étapes suivantes.

---

_Rapport généré le 11 février 2026 — Audit READ-ONLY, aucune modification de fichier effectuée._
