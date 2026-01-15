# Notes AEF (Avec Effet Financier) - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

Les **Notes AEF** (Notes Avec Effet Financier) constituent la deuxième étape de la chaîne de dépense. Elles formalisent une demande validée (Note SEF) en y ajoutant les informations financières nécessaires pour l'imputation budgétaire.

### Position dans la chaîne

```
Note SEF (validée) → [Note AEF] → Imputation → Expression Besoin → ...
```

### Rôle principal

- Transformer une Note SEF validée en demande financière formelle
- Estimer le montant de la dépense
- Préparer l'imputation budgétaire
- Assurer la traçabilité entre SEF et AEF

---

## 2. Architecture

### 2.1 Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `notes_dg` | Stocke les notes AEF | `id` (UUID) |
| `note_attachments` | Pièces jointes | `id` (UUID) |

### 2.2 Colonnes clés de `notes_dg`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `numero` | text | Oui | Numéro généré automatiquement |
| `objet` | text | Non | Objet de la note |
| `contenu` | text | Oui | Description détaillée |
| `montant_estime` | numeric | Oui | Montant estimé (FCFA) |
| `priorite` | varchar | Oui | `basse`, `normale`, `haute`, `urgente` |
| `statut` | varchar | Oui | État du workflow |
| `direction_id` | uuid | Oui | Direction concernée |
| `note_sef_id` | uuid | Oui | **Liaison obligatoire** vers Note SEF |
| `budget_line_id` | uuid | Oui | Ligne budgétaire (après imputation) |
| `exercice` | integer | Oui | Exercice budgétaire |
| `created_by` | uuid | Oui | Créateur |
| `created_at` | timestamptz | Non | Date de création |

### 2.3 Statuts possibles

```
brouillon → soumis → valide → impute
                  ↘ rejete
                  ↘ differe
```

| Statut | Description |
|--------|-------------|
| `brouillon` | En cours de rédaction |
| `soumis` | Soumis pour validation DG |
| `valide` | Validé par le DG |
| `impute` | Imputé sur une ligne budgétaire |
| `rejete` | Refusé (avec motif) |
| `differe` | Reporté (avec date de reprise) |

---

## 3. Workflow de validation

### 3.1 Diagramme

```
┌─────────────────┐
│   BROUILLON     │ ← Création par Agent
└────────┬────────┘
         │ Soumettre
         ▼
┌─────────────────┐
│     SOUMIS      │ ← En attente validation DG
└────────┬────────┘
         │
    ┌────┴────┬─────────┐
    ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐
│VALIDE │ │REJETE │ │DIFFERE│
└───┬───┘ └───────┘ └───────┘
    │
    ▼ Imputation CB
┌─────────────────┐
│     IMPUTE      │ → Vers Expression Besoin
└─────────────────┘
```

### 3.2 Rôles et actions

| Rôle | Actions possibles |
|------|-------------------|
| `AGENT` | Créer, modifier (brouillon), soumettre |
| `DG` | Valider, rejeter, différer |
| `CB` | Imputer sur ligne budgétaire |

---

## 4. Sécurité (RLS)

### 4.1 Policies principales

```sql
-- Lecture : Utilisateurs authentifiés
CREATE POLICY "notes_dg_select" ON notes_dg
FOR SELECT USING (true);

-- Création : Utilisateurs authentifiés
CREATE POLICY "notes_dg_insert" ON notes_dg
FOR INSERT WITH CHECK (true);

-- Modification : Créateur ou rôles autorisés
CREATE POLICY "notes_dg_update" ON notes_dg
FOR UPDATE USING (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'DG') 
  OR has_role(auth.uid(), 'CB')
);
```

---

## 5. Hooks React

### 5.1 Hook principal : `useNotesAEF`

| Export | Type | Description |
|--------|------|-------------|
| `notes` | `NoteAEF[]` | Liste des notes AEF |
| `notesSEFValidees` | `NoteSEF[]` | Notes SEF validées disponibles |
| `directions` | `Direction[]` | Directions pour sélection |
| `createNote` | `function` | Créer une note |
| `updateNote` | `function` | Modifier une note |
| `submitNote` | `function` | Soumettre pour validation |
| `validateNote` | `function` | Valider (DG) |
| `rejectNote` | `function` | Rejeter avec motif |
| `deferNote` | `function` | Différer avec date |
| `imputeNote` | `function` | Imputer sur budget |
| `isCreating` | `boolean` | État de création |
| `isUpdating` | `boolean` | État de modification |

### 5.2 Fichiers sources

```
src/hooks/useNotesAEF.ts        # Hook principal (~635 lignes)
```

---

## 6. Pages et Composants

### 6.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/notes-aef` | `NotesAEF.tsx` | Liste et gestion des notes AEF |

### 6.2 Composants

| Composant | Description |
|-----------|-------------|
| `NoteAEFForm.tsx` | Formulaire création/édition |
| `NoteAEFList.tsx` | Liste avec filtres et actions |
| `NoteAEFDetails.tsx` | Vue détaillée d'une note |
| `NoteAEFDeferDialog.tsx` | Dialog de report |
| `NoteAEFRejectDialog.tsx` | Dialog de rejet avec motif |
| `NoteAEFImputeDialog.tsx` | Dialog d'imputation budgétaire |

### 6.3 Arborescence

```
src/
├── pages/
│   └── NotesAEF.tsx
└── components/
    └── notes-aef/
        ├── NoteAEFForm.tsx
        ├── NoteAEFList.tsx
        ├── NoteAEFDetails.tsx
        ├── NoteAEFDeferDialog.tsx
        ├── NoteAEFRejectDialog.tsx
        └── NoteAEFImputeDialog.tsx
```

---

## 7. API Supabase - Exemples

### 7.1 Créer une Note AEF

```typescript
const { data, error } = await supabase
  .from("notes_dg")
  .insert({
    objet: "Achat fournitures bureau",
    contenu: "Description détaillée...",
    montant_estime: 500000,
    priorite: "normale",
    direction_id: "uuid-direction",
    note_sef_id: "uuid-note-sef",  // OBLIGATOIRE
    exercice: 2026,
    statut: "brouillon"
  })
  .select()
  .single();
```

### 7.2 Récupérer les Notes AEF

```typescript
const { data, error } = await supabase
  .from("notes_dg")
  .select(`
    *,
    direction:directions(id, label, sigle),
    note_sef:notes_sef!note_sef_id(id, numero, objet),
    created_by_profile:profiles(first_name, last_name)
  `)
  .eq("exercice", 2026)
  .order("created_at", { ascending: false });
```

### 7.3 Valider une Note

```typescript
const { error } = await supabase
  .from("notes_dg")
  .update({ 
    statut: "valide",
    validated_at: new Date().toISOString(),
    validated_by: userId
  })
  .eq("id", noteId);
```

---

## 8. Règles métier

### 8.1 Liaison obligatoire avec Note SEF

- ⚠️ Une Note AEF **doit obligatoirement** être liée à une Note SEF validée
- La Note SEF source pré-remplit certains champs (objet, direction)
- La traçabilité est maintenue via `note_sef_id`

### 8.2 Génération du numéro

Format : `AEF-{EXERCICE}-{SEQUENCE}`

Exemple : `AEF-2026-0042`

### 8.3 Montant estimé

- Le montant est une estimation pour l'imputation
- Le montant définitif sera fixé lors de l'engagement
- Sert à vérifier la disponibilité budgétaire

---

## 9. Intégration avec autres modules

### 9.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Notes SEF | `note_sef_id`, objet, direction |

### 9.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Imputation | Note AEF validée avec montant |
| Dossier | Création automatique après imputation |

---

## 10. Points ouverts / TODOs

- [ ] Ajouter workflow multi-étapes (si nécessaire)
- [ ] Notifications email à la validation/rejet
- [ ] Export PDF de la note
- [ ] Historique des modifications
- [ ] Pièces jointes (attachments)

---

## 11. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
