# Notes SEF - Documentation Technique

> **Version**: 2.0 | **Dernière mise à jour**: 2026-02-13

## Vue d'ensemble

Les **Notes Sans Effet Financier (SEF)** représentent le point d'entrée de la chaîne de dépense SYGFP. Elles permettent d'exprimer un besoin métier **sans impact budgétaire immédiat**.

## Architecture

### Tables principales

| Table                   | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `notes_sef`             | Données principales des notes SEF                |
| `notes_sef_history`     | Journal d'audit immutable (INSERT only)          |
| `notes_sef_audit_log`   | Vue alias de `notes_sef_history` (compatibilité) |
| `notes_sef_attachments` | Pièces jointes (bucket privé)                    |
| `notes_sef_pieces`      | Table alternative pour PJ                        |
| `notes_sef_sequences`   | Séquences de numérotation par année              |

### Colonnes clés de `notes_sef`

| Colonne                                                      | Type              | Description                                               |
| ------------------------------------------------------------ | ----------------- | --------------------------------------------------------- |
| `id`                                                         | uuid              | Clé primaire                                              |
| `reference_pivot`                                            | text              | Code pivot ARTI/ANNÉE/DIR/SEQ (unique)                    |
| `numero`                                                     | text              | Numéro technique interne                                  |
| `exercice`                                                   | integer           | Année budgétaire (ex: 2026)                               |
| `statut`                                                     | text              | État workflow: brouillon, soumis, valide, rejete, differe |
| `objet`                                                      | text              | Objet de la note (obligatoire)                            |
| `justification`                                              | text              | Justification de la demande                               |
| `direction_id`                                               | uuid              | FK vers `directions`                                      |
| `demandeur_id`                                               | uuid              | FK vers `profiles` (demandeur)                            |
| `demandeur_display`                                          | text              | Snapshot du nom demandeur                                 |
| `urgence`                                                    | text              | normale, urgent, très_urgent                              |
| `date_souhaitee`                                             | date              | Date souhaitée de réalisation                             |
| `beneficiaire_type`                                          | text              | PRESTATAIRE_EXTERNE ou AGENT_INTERNE                      |
| `beneficiaire_id`                                            | uuid              | FK vers `prestataires` (si externe)                       |
| `beneficiaire_interne_id`                                    | uuid              | FK vers `profiles` (si interne)                           |
| `beneficiaire_nom`                                           | text              | Snapshot du nom bénéficiaire                              |
| `description`                                                | text              | Description détaillée                                     |
| `commentaire`                                                | text              | Commentaires libres                                       |
| `dossier_id`                                                 | uuid              | Lien vers dossier créé à validation                       |
| `is_deleted`                                                 | boolean           | Soft delete flag (default: false)                         |
| `created_by`, `created_at`                                   | uuid, timestamptz | Création                                                  |
| `updated_at`                                                 | timestamptz       | Dernière modification                                     |
| `submitted_by`, `submitted_at`                               | uuid, timestamptz | Soumission                                                |
| `decided_by`, `decided_at`                                   | uuid, timestamptz | Décision DG                                               |
| `decision_reason`                                            | text              | Motif de décision                                         |
| `rejection_reason`                                           | text              | Motif de rejet                                            |
| `differe_motif`, `differe_condition`, `differe_date_reprise` | text, text, date  | Infos report                                              |
| `montant_estime`                                             | numeric           | Montant estimé de la dépense                              |
| `validation_mode`                                            | text              | Mode de validation (direct/delegation/interim)            |
| `validated_on_behalf_of`                                     | uuid              | Titulaire si validation par délégation/intérim            |
| `is_migrated`                                                | boolean           | Flag notes importées SQL Server                           |

### Index performants

| Index                           | Colonnes                                                               | Usage                   |
| ------------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| `idx_notes_sef_exercice_statut` | (exercice, statut)                                                     | Filtre liste par onglet |
| `idx_notes_sef_direction`       | (direction_id)                                                         | Filtre par direction    |
| `idx_notes_sef_demandeur`       | (demandeur_id)                                                         | Notes par utilisateur   |
| `idx_notes_sef_updated_at`      | (updated_at DESC)                                                      | Tri chronologique       |
| `idx_notes_sef_list_query`      | (exercice, statut, updated_at DESC)                                    | Requête liste optimisée |
| `idx_notes_sef_active_list`     | (exercice, statut, is_deleted, updated_at DESC) WHERE is_deleted=false | Liste sans supprimés    |
| `idx_notes_sef_objet_search`    | GIN (to_tsvector)                                                      | Recherche full-text     |

## Workflow / États

```
┌─────────────┐
│  brouillon  │◄─── Création initiale
└──────┬──────┘
       │ Soumettre
       ▼
┌─────────────┐
│   soumis    │◄─── En attente de décision DG
└──────┬──────┘
       │
  ┌────┴────┬────────────┐
  ▼         ▼            ▼
┌─────┐  ┌──────┐  ┌──────────┐
│valide│  │rejete│  │ differe  │
└──┬───┘  └──────┘  └────┬─────┘
   │                     │
   │                     │ Reprise
   │                     ▼
   │              ┌─────────────┐
   │              │   soumis    │
   │              └─────────────┘
   ▼
┌──────────────────────┐
│ Dossier auto-créé    │
│ → Note AEF           │
│ → Engagement         │
│ → ...                │
└──────────────────────┘
```

### Transitions autorisées

| De        | Vers    | Qui           | Action                | Validation backend                          |
| --------- | ------- | ------------- | --------------------- | ------------------------------------------- |
| brouillon | soumis  | Créateur      | Soumettre             | Champs obligatoires, génère référence pivot |
| soumis    | valide  | DG/ADMIN/DAAF | Valider               | Vérif rôle                                  |
| soumis    | rejete  | DG/ADMIN/DAAF | Rejeter               | Motif obligatoire                           |
| soumis    | differe | DG/ADMIN/DAAF | Différer              | Motif obligatoire                           |
| differe   | soumis  | Créateur      | Re-soumettre          | Vérif créateur                              |
| differe   | valide  | DG/ADMIN/DAAF | Valider après reprise | Vérif rôle                                  |

### Règles de modification

| Statut    | Qui peut modifier        | Restrictions                                |
| --------- | ------------------------ | ------------------------------------------- |
| brouillon | Créateur, Admin          | Toutes modifications                        |
| soumis    | DG/Admin/DAAF (actions)  | DAAF peut modifier pour workflow validation |
| valide    | Admin uniquement         | Lecture seule                               |
| rejete    | Admin uniquement         | Lecture seule                               |
| differe   | Créateur (re-soumission) | Actions limitées                            |

### Trigger de validation

`trigger_validate_notes_sef_transition` valide toutes les transitions et bloque :

- Modifications de fond sur notes soumises (sauf par validateurs)
- Toute modification sur notes validées/rejetées (sauf admin)
- Transitions non autorisées

## Génération de Référence Pivot

### Format

```
ARTI + ÉTAPE(1) + MM(2) + YY(2) + NNNN(4)
```

- **ARTI** : Préfixe fixe
- **ÉTAPE** : 1 chiffre (0 pour SEF, 1 pour AEF, etc.)
- **MM** : Mois sur 2 chiffres (01-12)
- **YY** : Année sur 2 chiffres (ex: 26 pour 2026)
- **NNNN** : Compteur séquentiel sur 4 chiffres (0001-9999)

### Exemples

| Date               | Séquence | Référence       |
| ------------------ | -------- | --------------- |
| Janvier 2026, 1ère | 1        | `ARTI001260001` |
| Janvier 2026, 2ème | 2        | `ARTI001260002` |
| Février 2026, 1ère | 1        | `ARTI002260001` |

### Implémentation

- **Table** : `reference_counters` avec contrainte unique sur (etape, mm, yy)
- **Fonction** : `generate_sef_reference(date_ref)` - UPSERT atomique
- **Trigger** : `trigger_auto_generate_sef_reference` - génère automatiquement à la soumission
- **Anti-doublon** : `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING` garantit unicité sous concurrence

## Sécurité (RLS)

### Policies `notes_sef`

| Policy                        | Opération | Règle                                                                                        |
| ----------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| `notes_sef_select_policy`     | SELECT    | Admin/DG voient tout; Validateurs voient soumis+; Direction voit validés + ses propres notes |
| `notes_sef_insert_policy`     | INSERT    | Tout utilisateur authentifié, exercice actif                                                 |
| `notes_sef_update_authorized` | UPDATE    | Créateur, ADMIN/DG (tout), DAAF (soumis/a_valider)                                           |
| `notes_sef_delete_policy`     | DELETE    | Créateur (brouillon) ou ADMIN                                                                |

### Policies `notes_sef_pieces` (Pièces jointes)

| Policy              | Opération | Règle                                                                 |
| ------------------- | --------- | --------------------------------------------------------------------- |
| `sef_pieces_select` | SELECT    | Admin/DG/DAAF voient tout; Créateur voit ses PJ                       |
| `sef_pieces_insert` | INSERT    | Admin (toujours) ou Créateur (brouillon uniquement) + validation MIME |
| `sef_pieces_update` | UPDATE    | ADMIN uniquement                                                      |
| `sef_pieces_delete` | DELETE    | Admin ou Uploader (brouillon uniquement)                              |

### Policies Storage `notes-sef` (bucket privé)

| Policy                      | Opération | Règle                                                           |
| --------------------------- | --------- | --------------------------------------------------------------- |
| `sef_storage_select_policy` | SELECT    | Admin/DG/DAAF ou Créateur/Demandeur de la note                  |
| `sef_storage_insert_policy` | INSERT    | Admin ou Créateur (brouillon) + extensions dangereuses bloquées |
| `sef_storage_update_policy` | UPDATE    | ADMIN uniquement                                                |
| `sef_storage_delete_policy` | DELETE    | Admin ou Créateur (brouillon uniquement)                        |

### Règles fichiers pièces jointes

| Règle                     | Valeur                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Bucket**                | `notes-sef` (privé)                                                                                                  |
| **Chemin**                | `{exercice}/{noteId}/{timestamp}_{filename}`                                                                         |
| **Taille max**            | 10 MB par fichier                                                                                                    |
| **Extensions autorisées** | `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`                           |
| **Extensions bloquées**   | `.exe`, `.bat`, `.cmd`, `.sh`, `.ps1`, `.vbs`, `.js`, `.msi`, `.dll`, `.scr`, `.pif`, `.com`, `.jar`, `.hta`, `.reg` |

### Trigger de protection

`trigger_prevent_final_modification` empêche la modification des notes `valide` ou `rejete` sauf par ADMIN.

## Indexes performants

```sql
idx_notes_sef_exercice_statut      -- Filtre liste
idx_notes_sef_updated_at           -- Tri par date
idx_notes_sef_reference_pivot      -- Recherche par code
idx_notes_sef_objet_search         -- Recherche full-text
idx_notes_sef_list_query           -- Liste paginée optimisée
idx_notes_sef_history_note         -- Historique par note
```

## Hooks React

| Hook                | Usage                                                               |
| ------------------- | ------------------------------------------------------------------- |
| `useNotesSEF`       | Mutations (create, submit, validate, reject, defer, delete)         |
| `useNotesSEFList`   | Liste paginée avec filtres serveur-side                             |
| `useNotesSEFExport` | Export Excel avec filtres (22 colonnes dont Montant estimé)         |
| `useNoteSEFDetail`  | Données complémentaires : pièces jointes, historique, note AEF liée |
| `useNotesSEFAudit`  | Audit et validateurs (no-ops, les triggers DB gèrent)               |

## Pages

| Route            | Description                     |
| ---------------- | ------------------------------- |
| `/notes-sef`     | Liste avec onglets par statut   |
| `/notes-sef/:id` | Détail avec timeline et actions |

## API Supabase - Exemples

### Créer une note

```typescript
const { data, error } = await supabase
  .from('notes_sef')
  .insert({
    objet: 'Acquisition fournitures',
    direction_id: 'uuid-direction',
    demandeur_id: 'uuid-user',
    urgence: 'normale',
    justification: 'Besoin urgent',
    date_souhaitee: '2026-02-01',
  })
  .select()
  .single();
```

### Soumettre une note

```typescript
const { error } = await supabase
  .from('notes_sef')
  .update({
    statut: 'soumis',
    submitted_at: new Date().toISOString(),
    submitted_by: userId,
  })
  .eq('id', noteId);
```

### Valider (DG)

```typescript
const { error } = await supabase
  .from('notes_sef')
  .update({
    statut: 'valide',
    validated_at: new Date().toISOString(),
    validated_by: userId,
  })
  .eq('id', noteId);
```

## Fichiers principaux

```
src/
├── pages/
│   ├── NotesSEF.tsx              # Liste principale + Sheet détail
│   └── NoteSEFDetail.tsx         # Page détail complète + actions
├── components/notes-sef/
│   ├── NoteSEFForm.tsx           # Formulaire création/édition
│   ├── NoteSEFList.tsx           # Table liste (clic → Sheet)
│   ├── NoteSEFDetailSheet.tsx    # Sheet latéral 4 onglets (Infos/Contenu/PJ/Historique)
│   ├── NoteSEFDetails.tsx        # Dialog détail (legacy)
│   ├── NoteSEFChecklist.tsx      # Checklist validation
│   ├── NoteSEFRejectDialog.tsx
│   └── NoteSEFDeferDialog.tsx
├── hooks/
│   ├── useNotesSEF.ts            # Mutations
│   ├── useNotesSEFList.ts        # Liste paginée server-side
│   ├── useNotesSEFExport.ts      # Export Excel (22 colonnes)
│   ├── useNoteSEFDetail.ts       # PJ + historique + AEF liée (3 queries)
│   └── useNotesSEFAudit.ts       # Audit et validateurs
└── lib/notes-sef/
    ├── types.ts
    ├── constants.ts
    ├── helpers.ts
    ├── notesSefService.ts
    └── referenceService.ts
```

## NoteSEFDetailSheet (nouveau - 2026-02-13)

Sheet latéral avec 4 onglets, remplace le PreviewDrawer :

| Onglet             | Contenu                                                        |
| ------------------ | -------------------------------------------------------------- |
| **Informations**   | QR code (si validée), identification, acteurs, budget, détails |
| **Contenu**        | Exposé, avis, recommandations, commentaire                     |
| **Pièces jointes** | Compteur X/3, téléchargement, aperçu images                    |
| **Historique**     | Timeline, chaîne de dépense, note AEF liée                     |

- **Clic sur ligne** dans NoteSEFList ouvre le Sheet (pas navigation)
- **Menu "Ouvrir la page"** navigue vers `/notes-sef/{id}`
- **Données** : hook `useNoteSEFDetail` lance 3 requêtes React Query en parallèle

## Contraintes pièces jointes

| Règle                  | Valeur                                       |
| ---------------------- | -------------------------------------------- |
| Maximum par note       | **3 pièces jointes**                         |
| Taille max par fichier | 10 MB                                        |
| Trigger DB             | `trg_check_max_pieces` bloque INSERT si >= 3 |
| Frontend               | Bouton désactivé à 3/3, compteur "(X/3)"     |

## Validation avec délégation/intérim (Gap 2+3 résolus)

- `check_validation_permission()` vérifie rôle direct + délégation + intérim
- Colonnes `validation_mode` et `validated_on_behalf_of` tracent le mode
- Les notifications incluent les délégués et intérimaires (Gap 4 résolu)

## Notes migrées

- 4 836 notes importées depuis SQL Server
- Références anciennes : `MIG-*`, `SEF-*`, `NNNN-YYYY-*`
- Badge "Migré" dans la liste
- Flag `is_migrated` en base

## Points ouverts / À confirmer

1. ~~**Email notifications**~~ : Triggers DB gèrent tout (Gap 4 résolu)
2. ~~**Délégation**~~ : Oui, via `check_validation_permission()` (Gaps 2+3 résolus)
3. **Archivage** : Notes anciennes à archiver après X années ?
4. **Export PDF** : QR code par note validée dans le PDF

---

_Documentation mise à jour le 2026-02-13_
