# Notes SEF - Documentation Technique

## Vue d'ensemble

Les **Notes Sans Effet Financier (SEF)** représentent le point d'entrée de la chaîne de dépense SYGFP. Elles permettent d'exprimer un besoin métier **sans impact budgétaire immédiat**.

## Architecture

### Tables principales

| Table | Description |
|-------|-------------|
| `notes_sef` | Données principales des notes SEF |
| `notes_sef_history` | Journal d'audit immutable (INSERT only) |
| `notes_sef_attachments` | Pièces jointes (bucket privé) |
| `notes_sef_pieces` | Table alternative pour PJ |
| `notes_sef_sequences` | Séquences de numérotation par année |

### Colonnes clés de `notes_sef`

| Colonne | Type | Description |
|---------|------|-------------|
| `reference_pivot` | text | Code pivot ARTI/ANNÉE/DIR/SEQ (unique) |
| `numero` | text | Numéro technique interne |
| `objet` | text | Objet de la note (obligatoire) |
| `statut` | text | État workflow |
| `exercice` | integer | Année budgétaire |
| `direction_id` | uuid | Direction émettrice |
| `demandeur_id` | uuid | Utilisateur demandeur |
| `urgence` | text | normale/urgent/très_urgent |
| `dossier_id` | uuid | Lien vers dossier créé à validation |

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

| De | Vers | Qui | Action |
|----|------|-----|--------|
| brouillon | soumis | Créateur | Soumettre |
| soumis | valide | DG/ADMIN | Valider |
| soumis | rejete | DG/ADMIN | Rejeter (motif requis) |
| soumis | differe | DG/ADMIN | Différer (motif + date reprise) |
| differe | valide | DG/ADMIN | Valider après reprise |

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
