# Notes SEF - Documentation Technique

> **Version**: 1.1 | **Dernière mise à jour**: 2026-01-15

## Vue d'ensemble

Les **Notes Sans Effet Financier (SEF)** représentent le point d'entrée de la chaîne de dépense SYGFP. Elles permettent d'exprimer un besoin métier **sans impact budgétaire immédiat**.

## Architecture

### Tables principales

| Table | Description |
|-------|-------------|
| `notes_sef` | Données principales des notes SEF |
| `notes_sef_history` | Journal d'audit immutable (INSERT only) |
| `notes_sef_audit_log` | Vue alias de `notes_sef_history` (compatibilité) |
| `notes_sef_attachments` | Pièces jointes (bucket privé) |
| `notes_sef_pieces` | Table alternative pour PJ |
| `notes_sef_sequences` | Séquences de numérotation par année |

### Colonnes clés de `notes_sef`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `reference_pivot` | text | Code pivot ARTI/ANNÉE/DIR/SEQ (unique) |
| `numero` | text | Numéro technique interne |
| `exercice` | integer | Année budgétaire (ex: 2026) |
| `statut` | text | État workflow: brouillon, soumis, valide, rejete, differe |
| `objet` | text | Objet de la note (obligatoire) |
| `justification` | text | Justification de la demande |
| `direction_id` | uuid | FK vers `directions` |
| `demandeur_id` | uuid | FK vers `profiles` (demandeur) |
| `demandeur_display` | text | Snapshot du nom demandeur |
| `urgence` | text | normale, urgent, très_urgent |
| `date_souhaitee` | date | Date souhaitée de réalisation |
| `beneficiaire_type` | text | PRESTATAIRE_EXTERNE ou AGENT_INTERNE |
| `beneficiaire_id` | uuid | FK vers `prestataires` (si externe) |
| `beneficiaire_interne_id` | uuid | FK vers `profiles` (si interne) |
| `beneficiaire_nom` | text | Snapshot du nom bénéficiaire |
| `description` | text | Description détaillée |
| `commentaire` | text | Commentaires libres |
| `dossier_id` | uuid | Lien vers dossier créé à validation |
| `is_deleted` | boolean | Soft delete flag (default: false) |
| `created_by`, `created_at` | uuid, timestamptz | Création |
| `updated_at` | timestamptz | Dernière modification |
| `submitted_by`, `submitted_at` | uuid, timestamptz | Soumission |
| `decided_by`, `decided_at` | uuid, timestamptz | Décision DG |
| `decision_reason` | text | Motif de décision |
| `rejection_reason` | text | Motif de rejet |
| `differe_motif`, `differe_condition`, `differe_date_reprise` | text, text, date | Infos report |

### Index performants

| Index | Colonnes | Usage |
|-------|----------|-------|
| `idx_notes_sef_exercice_statut` | (exercice, statut) | Filtre liste par onglet |
| `idx_notes_sef_direction` | (direction_id) | Filtre par direction |
| `idx_notes_sef_demandeur` | (demandeur_id) | Notes par utilisateur |
| `idx_notes_sef_updated_at` | (updated_at DESC) | Tri chronologique |
| `idx_notes_sef_list_query` | (exercice, statut, updated_at DESC) | Requête liste optimisée |
| `idx_notes_sef_active_list` | (exercice, statut, is_deleted, updated_at DESC) WHERE is_deleted=false | Liste sans supprimés |
| `idx_notes_sef_objet_search` | GIN (to_tsvector) | Recherche full-text |

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

| De | Vers | Qui | Action | Validation backend |
|----|------|-----|--------|-------------------|
| brouillon | soumis | Créateur | Soumettre | Champs obligatoires, génère référence pivot |
| soumis | valide | DG/ADMIN/DAAF | Valider | Vérif rôle |
| soumis | rejete | DG/ADMIN/DAAF | Rejeter | Motif obligatoire |
| soumis | differe | DG/ADMIN/DAAF | Différer | Motif obligatoire |
| differe | soumis | Créateur | Re-soumettre | Vérif créateur |
| differe | valide | DG/ADMIN/DAAF | Valider après reprise | Vérif rôle |

### Règles de modification

| Statut | Qui peut modifier | Restrictions |
|--------|------------------|--------------|
| brouillon | Créateur, Admin | Toutes modifications |
| soumis | DG/Admin (actions) | Lecture seule pour créateur, sauf commentaire |
| valide | Admin uniquement | Lecture seule |
| rejete | Admin uniquement | Lecture seule |
| differe | Créateur (re-soumission) | Actions limitées |

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

| Date | Séquence | Référence |
|------|----------|-----------|
| Janvier 2026, 1ère | 1 | `ARTI001260001` |
| Janvier 2026, 2ème | 2 | `ARTI001260002` |
| Février 2026, 1ère | 1 | `ARTI002260001` |

### Implémentation

- **Table** : `reference_counters` avec contrainte unique sur (etape, mm, yy)
- **Fonction** : `generate_sef_reference(date_ref)` - UPSERT atomique
- **Trigger** : `trigger_auto_generate_sef_reference` - génère automatiquement à la soumission
- **Anti-doublon** : `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING` garantit unicité sous concurrence

## Sécurité (RLS)

### Policies `notes_sef`

| Policy | Opération | Règle |
|--------|-----------|-------|
| `notes_sef_select_policy` | SELECT | Admin/DG voient tout; Validateurs voient soumis+; Direction voit validés + ses propres notes |
| `notes_sef_insert_policy` | INSERT | Tout utilisateur authentifié, exercice actif |
| `notes_sef_update_authorized` | UPDATE | Créateur ou ADMIN/DG |
| `notes_sef_delete_policy` | DELETE | Créateur (brouillon) ou ADMIN |

### Policies `notes_sef_attachments`

- INSERT : Créateur de la note ou ADMIN
- SELECT : Direction de la note ou ADMIN/DG/DAAF
- DELETE : Créateur si note brouillon

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

| Hook | Usage |
|------|-------|
| `useNotesSEF` | Mutations (create, submit, validate, reject, defer, delete) |
| `useNotesSEFList` | Liste paginée avec filtres serveur-side |
| `useNotesSEFExport` | Export Excel avec filtres |

## Pages

| Route | Description |
|-------|-------------|
| `/notes-sef` | Liste avec onglets par statut |
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
│   ├── NotesSEF.tsx          # Liste principale
│   └── NoteSEFDetail.tsx     # Détail + actions
├── components/notes-sef/
│   ├── NoteSEFForm.tsx       # Formulaire création/édition
│   ├── NoteSEFList.tsx       # Table liste
│   ├── NoteSEFDetails.tsx    # Dialog détail (liste)
│   ├── NoteSEFChecklist.tsx  # Checklist validation
│   ├── NoteSEFRejectDialog.tsx
│   └── NoteSEFDeferDialog.tsx
├── hooks/
│   ├── useNotesSEF.ts        # Mutations
│   ├── useNotesSEFList.ts    # Liste paginée
│   └── useNotesSEFExport.ts  # Export Excel
└── lib/notes-sef/
    ├── types.ts
    ├── constants.ts
    ├── helpers.ts
    └── notesSefService.ts
```

## Points ouverts / À confirmer

1. **Email notifications** : Infrastructure prête (table `notifications`), edge function `send-notification-email` à connecter
2. **Bucket storage** : Vérifier que `notes-sef-pieces` est configuré en mode privé
3. **Délai validation** : Pas de SLA défini - ajouter deadline optionnelle ?
4. **Archivage** : Notes anciennes à archiver après X années ?
5. **Délégation** : Un DG peut-il déléguer validation à un sous-directeur ?

---

*Documentation générée le 2026-01-15*
