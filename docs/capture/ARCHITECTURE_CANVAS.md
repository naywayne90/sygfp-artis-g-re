# Architecture du Canvas de Notes ARTI

## 1. Analyse de l'existant

### 1.1 Page actuelle (EspaceDirection.tsx)

La page `src/pages/EspaceDirection.tsx` (915 lignes) gere les notes de direction avec:

- Listing des notes en tableau (Table)
- Filtres: recherche texte, type de note, statut
- Dialog de creation/modification avec un simple `<Textarea>` (pas de rich text)
- Dialog de visualisation avec `dangerouslySetInnerHTML`
- Import de fichiers Word (.docx) via `mammoth`
- Archivage avec confirmation

**Probleme principal:** L'editeur actuel est un `<Textarea>` basique sans aucune mise en forme. Les notes importees depuis Word contiennent du HTML mais l'editeur ne peut pas le manipuler.

### 1.2 Hook de donnees (useNotesDirection.ts)

Le hook `src/hooks/useNotesDirection.ts` fournit:

- `useNotesDirection(filters)` - Liste avec filtres
- `useCreateNote()` - Creation
- `useUpdateNote()` - Modification
- `useArchiveNote()` - Archivage
- `useImportWordNote()` - Import Word via mammoth
- `useNotesDirectionStats(directionId)` - Statistiques

**Structure de donnees actuelle (table notes_direction):**

```
id              UUID PK
direction_id    UUID FK -> directions
exercice_id     UUID FK -> exercices_budgetaires
titre           TEXT NOT NULL
contenu         TEXT (HTML)
contenu_brut    TEXT (plain text pour recherche)
type_note       TEXT ('interne'|'compte_rendu'|'rapport'|'memo'|'autre')
statut          TEXT ('brouillon'|'publie'|'archive')
tags            TEXT[]
fichier_original_url TEXT
fichier_original_nom TEXT
priorite        TEXT ('normale'|'haute'|'urgente')
created_by      UUID FK -> auth.users
updated_by      UUID FK -> auth.users
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### 1.3 Contextes disponibles

- **RBACContext** (`src/contexts/RBACContext.tsx`): Fournit `user`, `isAdmin`, `isDG`, `canCreate()`, `canExport()`, `directionId`, etc.
- **ExerciceContext** (`src/contexts/ExerciceContext.tsx`): Fournit `exerciceId`, `exercice` (annee), `isReadOnly`, `canWrite`

### 1.4 Services PDF existants

Deux services PDF sont deja implementes avec jsPDF + jspdf-autotable:

- `noteDGPdfService.ts` - PDF pour Notes DG (2 pages: en-tete ARTI + observations)
- `noteSEFPdfService.ts` - PDF pour Notes SEF (2 pages: en-tete ARTI + observations DG)

Ces services partagent un pattern commun:

- En-tete ARTI avec logo, devise, nom officiel
- Tableau d'informations (autoTable)
- Sections exposee/avis/recommandations
- Zone signature avec mention interimaire/delegation
- QR Code de verification

### 1.5 Composants UI disponibles

49 composants shadcn/ui disponibles dans `src/components/ui/`, notamment:

- Dialog, Sheet, Drawer
- Tabs, Accordion, Collapsible
- Table, Card, Badge, Button
- Select, Input, Textarea, Checkbox
- Tooltip, Popover, DropdownMenu
- ScrollArea, Separator, Progress

### 1.6 Dependances actuelles pertinentes

| Package                | Version | Usage                      |
| ---------------------- | ------- | -------------------------- |
| jspdf                  | ^4.0.0  | Generation PDF             |
| jspdf-autotable        | ^5.0.7  | Tableaux dans PDF          |
| mammoth                | ^1.11.0 | Import Word -> HTML        |
| qrcode.react           | ^4.2.0  | QR Codes                   |
| xlsx                   | ^0.18.5 | Import/Export Excel        |
| react-dropzone         | ^14.3.8 | Upload fichiers            |
| react-resizable-panels | ^2.1.9  | Panneaux redimensionnables |
| recharts               | ^2.15.4 | Graphiques                 |

---

## 2. Choix technique: Editeur Rich Text

### 2.1 Options evaluees

| Editeur        | Taille | TypeScript | Tableaux  | Extensibilite | Communaute |
| -------------- | ------ | ---------- | --------- | ------------- | ---------- |
| **Tiptap**     | ~200KB | Natif      | Extension | Tres haute    | Active     |
| Quill          | ~150KB | Types      | Plugin    | Moyenne       | Stable     |
| Slate          | ~100KB | Natif      | Manuel    | Haute         | Active     |
| Lexical (Meta) | ~100KB | Natif      | Plugin    | Haute         | Croissante |
| Draft.js       | ~150KB | Types      | Plugin    | Faible        | Obsolete   |

### 2.2 Recommandation: Tiptap

**Tiptap** est le choix optimal pour les raisons suivantes:

1. **TypeScript natif** - Pas de `@types` externe, integration parfaite avec le projet
2. **Architecture modulaire** - StarterKit + extensions a la carte, pas de bloat
3. **Compatibilite shadcn/ui** - Tiptap utilise Prosemirror (DOM natif), pas de conflit avec Radix
4. **HTML natif** - Le contenu est du HTML standard, compatible avec le stockage existant (`contenu TEXT`)
5. **Import/Export** - Le HTML de mammoth peut etre charge directement dans Tiptap
6. **Extensible** - Possibilite d'ajouter des templates ARTI, des placeholders, des blocs speciaux
7. **BubbleMenu** - Toolbar contextuelle au survol pour une UX professionnelle

### 2.3 Packages Tiptap a installer

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm \
  @tiptap/extension-underline \
  @tiptap/extension-text-align \
  @tiptap/extension-table @tiptap/extension-table-row \
  @tiptap/extension-table-header @tiptap/extension-table-cell \
  @tiptap/extension-placeholder \
  @tiptap/extension-highlight \
  @tiptap/extension-text-style \
  @tiptap/extension-color \
  @tiptap/extension-font-family
```

**Cout: ~200KB gzip** (acceptable pour une app metier)

---

## 3. Choix technique: Export

### 3.1 Export PDF

**Conserver jsPDF + jspdf-autotable** (deja installe).

Raisons:

- Deja maitrise dans le projet (2 services existants)
- Controle pixel-perfect du layout ARTI (en-tete, logo, QR, signature)
- Le pattern des 2 pages (contenu + observations DG) est reutilisable
- Pas besoin d'ajouter une dependance supplementaire

Approche: Creer `src/services/noteDirectionPdfService.ts` en suivant le meme pattern que `noteDGPdfService.ts`.

### 3.2 Export Word (.docx)

**Installer le package `docx`** (npm: docx).

Raisons:

- API declarative, facile a maintenir
- Supporte: paragraphes, tableaux, en-tetes, styles, images
- Fonctionne dans le navigateur (pas de Node.js requis)
- Permet de reproduire fidelement le format ARTI en Word

```bash
npm install docx file-saver
npm install -D @types/file-saver
```

### 3.3 Resume des exports

| Format | Lib               | Statut        | Usage                |
| ------ | ----------------- | ------------- | -------------------- |
| PDF    | jsPDF + autotable | Deja installe | Format officiel ARTI |
| Word   | docx + file-saver | A installer   | Documents editables  |
| HTML   | Natif (Tiptap)    | Gratuit       | Preview + stockage   |

---

## 4. Schema de base de donnees

### 4.1 Champs a ajouter a notes_direction

La table actuelle est suffisante pour le canvas basique. Cependant, pour un canvas de notes professionnel ARTI, il faut ajouter:

```sql
ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS
  reference TEXT;                    -- Reference officielle (ex: ND/ARTI/DG/2026/001)

ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS
  destinataire TEXT;                 -- Destinataire principal

ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS
  expediteur TEXT;                   -- Expediteur / signataire

ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS
  objet TEXT;                        -- Objet distinct du titre

ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS
  date_note DATE DEFAULT CURRENT_DATE;  -- Date officielle de la note

ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS
  nb_pages INTEGER DEFAULT 1;        -- Nombre de pages

ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS
  template_id TEXT DEFAULT 'note_interne';  -- Template utilise

ALTER TABLE notes_direction ADD COLUMN IF NOT EXISTS
  metadata JSONB DEFAULT '{}';       -- Metadonnees flexibles (version, historique, etc.)
```

### 4.2 Table de templates (optionnelle mais recommandee)

```sql
CREATE TABLE IF NOT EXISTS note_templates (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  contenu_html TEXT NOT NULL,        -- HTML du template
  variables JSONB DEFAULT '[]',      -- Variables: [{key, label, default}]
  en_tete_arti BOOLEAN DEFAULT true, -- Inclure en-tete officiel ARTI
  signature_zone BOOLEAN DEFAULT true,
  est_actif BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Templates pre-configures:

1. `note_interne` - Note interne standard
2. `note_service` - Note de service (plus formelle)
3. `compte_rendu` - Compte rendu de reunion
4. `rapport` - Rapport avec sommaire
5. `memo` - Memo rapide
6. `note_vierge` - Canvas vide

### 4.3 Migration SQL complete

Fichier: `supabase/migrations/20260210_canvas_notes_direction.sql`

---

## 5. Architecture des composants

### 5.1 Arborescence

```
src/
  components/
    canvas/
      NoteCanvas.tsx              -- Composant principal (page full-width)
      NoteCanvasHeader.tsx        -- En-tete ARTI avec metadata
      NoteCanvasToolbar.tsx       -- Barre d'outils Tiptap
      NoteCanvasEditor.tsx        -- Editeur Tiptap avec configuration
      NoteCanvasPreview.tsx       -- Preview A4 du document
      NoteCanvasSidebar.tsx       -- Panneau lateral (proprietes, templates)
      NoteCanvasExportMenu.tsx    -- Menu d'export (PDF, Word, HTML)
      TemplateSelector.tsx        -- Selection de template au demarrage
      ARTIHeader.tsx              -- En-tete officiel ARTI (reutilisable)
      ARTIFooter.tsx              -- Pied de page officiel ARTI (signature)
  hooks/
    useNoteCanvas.ts              -- Hook principal du canvas (state + sauvegarde auto)
    useNoteTemplates.ts           -- Hook pour charger/gerer les templates
    useNoteExport.ts              -- Hook pour exports PDF/Word
  services/
    noteDirectionPdfService.ts    -- Generation PDF des notes direction
    noteDirectionDocxService.ts   -- Generation Word des notes direction
  pages/
    NoteCanvasPage.tsx            -- Page route /espace-direction/notes/:id/canvas
```

### 5.2 Flux de donnees

```
[EspaceDirection]
   |
   |-- Click "Nouvelle Note" ou "Modifier"
   |
   v
[NoteCanvasPage]  (route: /espace-direction/notes/:id/canvas)
   |
   |-- useNoteCanvas(noteId)  -->  Charge/sauvegarde via Supabase
   |-- useRBAC()              -->  Permissions
   |-- useExercice()          -->  Exercice actif
   |
   +--[NoteCanvasHeader]        En-tete ARTI avec reference, date, destinataire
   |
   +--[NoteCanvasToolbar]       Boutons: B/I/U, listes, alignement, tableaux, etc.
   |
   +--[NoteCanvasEditor]        Tiptap EditorContent
   |     |
   |     +-- useEditor({extensions, content})
   |     +-- BubbleMenu (toolbar contextuelle)
   |     +-- Autosave (debounce 2s)
   |
   +--[NoteCanvasSidebar]       Proprietes: type, priorite, statut, tags
   |     |
   |     +-- TemplateSelector
   |     +-- Export buttons
   |     +-- Metadata
   |
   +--[NoteCanvasExportMenu]    PDF / Word / Imprimer
         |
         +-- noteDirectionPdfService
         +-- noteDirectionDocxService
```

### 5.3 Description des composants

#### NoteCanvasPage.tsx

- Route: `/espace-direction/notes/new/canvas` (creation) ou `/espace-direction/notes/:id/canvas` (edition)
- Layout full-width avec sidebar repliable
- Utilise `react-resizable-panels` pour separer editeur et sidebar
- Sauvegarde automatique + sauvegarde manuelle

#### NoteCanvas.tsx (composant principal)

- Orchestre tous les sous-composants
- Gere le state global du canvas via `useNoteCanvas`
- Layout: Header ARTI -> Toolbar -> Editor -> Footer (optionnel)

#### NoteCanvasToolbar.tsx

- Barre d'outils fixe en haut de l'editeur
- Groupes de boutons:
  - **Texte**: Gras, Italique, Souligne, Surligner
  - **Paragraphe**: H1/H2/H3, alignement (gauche/centre/droite/justifie)
  - **Listes**: Puces, numerotees
  - **Tableaux**: Inserer/supprimer tableau, lignes, colonnes
  - **Actions**: Annuler/Refaire, Imprimer, Export
- Utilise les icones Lucide (deja installees)
- Chaque bouton utilise shadcn/ui Toggle ou Button

#### NoteCanvasEditor.tsx

- Wrapper autour de `<EditorContent editor={editor} />`
- Style "page A4" avec marges visuelles
- CSS Tailwind + prose (plugin @tailwindcss/typography deja installe)
- Configuration Tiptap:
  ```
  StarterKit (bold, italic, headings, lists, blockquote, code)
  + Underline
  + TextAlign (justify supported)
  + Table + TableRow + TableHeader + TableCell
  + Placeholder ("Commencez a rediger...")
  + Highlight
  + TextStyle + Color
  + FontFamily
  ```

#### NoteCanvasHeader.tsx (ARTIHeader)

- Reproduit l'en-tete officiel ARTI en HTML/CSS:
  - Logo ARTI (gauche)
  - "Republique de Cote d'Ivoire / Union - Discipline - Travail" (centre)
  - "Autorite de Regulation du Transport Interieur" (centre)
  - Ligne separatrice
  - Champs: reference, date, destinataire, expediteur, objet
- Non-editable (metadata geree via sidebar)

#### NoteCanvasSidebar.tsx

- Panneau droit repliable (280px)
- Sections:
  1. **Proprietes**: type, priorite, statut, tags
  2. **Template**: changer de template
  3. **Export**: PDF, Word, Imprimer
  4. **Historique**: date creation, derniere modification, auteur

#### NoteCanvasExportMenu.tsx

- DropdownMenu avec:
  - "Exporter en PDF" (format ARTI officiel)
  - "Exporter en Word"
  - "Imprimer" (window.print avec CSS @media print)
  - "Copier en HTML"

#### TemplateSelector.tsx

- Grille de cartes avec apercu miniature
- Affiche au premier acces (nouvelle note) ou depuis la sidebar
- Charge le HTML du template dans l'editeur

---

## 6. Hook principal: useNoteCanvas

```typescript
interface UseNoteCanvasReturn {
  // State
  note: NoteDirection | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;

  // Editor
  editorContent: string;
  setEditorContent: (html: string) => void;

  // Metadata
  metadata: NoteCanvasMetadata;
  updateMetadata: (partial: Partial<NoteCanvasMetadata>) => void;

  // Actions
  save: () => Promise<void>; // Sauvegarde manuelle
  publish: () => Promise<void>; // Passer en "publie"
  exportPdf: () => Promise<void>; // Generer PDF
  exportDocx: () => Promise<void>; // Generer Word
}
```

**Sauvegarde automatique:**

- Debounce de 2 secondes apres chaque modification
- Indicateur visuel "Enregistre" / "Modifications non sauvegardees"
- Protection contre la perte de donnees (beforeunload)

---

## 7. Plan d'implementation

### Phase 1: Backend (Tache #4)

1. Creer la migration SQL `20260210_canvas_notes_direction.sql`
   - ALTER TABLE notes_direction ADD columns
   - CREATE TABLE note_templates
   - INSERT templates par defaut
2. Mettre a jour les types TypeScript dans `useNotesDirection.ts`
3. Creer `useNoteCanvas.ts` (chargement, sauvegarde auto, dirty state)
4. Creer `useNoteTemplates.ts`
5. Creer `useNoteExport.ts`

### Phase 2: Frontend (Tache #3)

1. Installer les packages Tiptap + docx + file-saver
2. Creer `NoteCanvasEditor.tsx` avec configuration Tiptap
3. Creer `NoteCanvasToolbar.tsx` avec boutons de formatage
4. Creer `ARTIHeader.tsx` (en-tete officiel)
5. Creer `NoteCanvasSidebar.tsx` (proprietes + export)
6. Creer `NoteCanvas.tsx` (assemblage)
7. Creer `NoteCanvasPage.tsx` (page + route)
8. Creer `TemplateSelector.tsx`
9. Creer `NoteCanvasExportMenu.tsx`
10. Creer `noteDirectionPdfService.ts`
11. Creer `noteDirectionDocxService.ts`
12. Modifier `EspaceDirection.tsx` pour router vers le canvas
13. Ajouter la route dans le router

### Phase 3: Tests (Tache #5)

1. Test unitaire: useNoteCanvas (sauvegarde, dirty state)
2. Test unitaire: exports PDF/Word
3. Test E2E: creation note via canvas
4. Test E2E: edition note existante
5. Test E2E: export PDF
6. Test visuel: en-tete ARTI correct

---

## 8. Dependances npm a installer

### Production

```bash
npm install \
  @tiptap/react \
  @tiptap/starter-kit \
  @tiptap/pm \
  @tiptap/extension-underline \
  @tiptap/extension-text-align \
  @tiptap/extension-table \
  @tiptap/extension-table-row \
  @tiptap/extension-table-header \
  @tiptap/extension-table-cell \
  @tiptap/extension-placeholder \
  @tiptap/extension-highlight \
  @tiptap/extension-text-style \
  @tiptap/extension-color \
  @tiptap/extension-font-family \
  docx \
  file-saver
```

### Dev

```bash
npm install -D @types/file-saver
```

---

## 9. Considerations

### 9.1 Performance

- Tiptap est lazy-loaded (import dynamique) pour ne pas impacter le bundle principal
- L'autosave utilise un debounce de 2s pour eviter les requetes excessives
- Le contenu_brut est regenere cote client avant sauvegarde (strip HTML)

### 9.2 Securite

- Le contenu HTML est sanitize avant affichage via DOMPurify (a considerer) ou le rendu Tiptap natif
- Les RLS existantes sur notes_direction sont suffisantes
- L'export PDF/Word se fait cote client (pas de donnees envoyees a un serveur externe)

### 9.3 Accessibilite

- La toolbar utilise des boutons avec `aria-pressed` pour l'etat actif
- Les raccourcis clavier Tiptap sont natifs (Ctrl+B, Ctrl+I, etc.)
- Le focus est gere automatiquement par Prosemirror

### 9.4 Compatibilite avec l'existant

- Le champ `contenu` (TEXT/HTML) reste le meme - Tiptap lit et ecrit du HTML
- Les notes existantes (importees via mammoth) sont editables dans Tiptap
- Le champ `contenu_brut` est regenere a chaque sauvegarde
- Les filtres, recherche, listing restent inchanges
- Le seul changement sur EspaceDirection.tsx est le redirect vers la page canvas

---

## 10. Resume des decisions

| Decision          | Choix                | Alternative ecartee   | Raison                                     |
| ----------------- | -------------------- | --------------------- | ------------------------------------------ |
| Editeur rich text | **Tiptap**           | Quill, Slate, Lexical | TypeScript natif, modulaire, HTML standard |
| Export PDF        | **jsPDF** (existant) | @react-pdf/renderer   | Deja installe, pattern etabli              |
| Export Word       | **docx** (npm)       | html-docx-js          | API declarative, meilleur rendu            |
| Sauvegarde        | **Autosave 2s**      | Save button only      | UX moderne, pas de perte de donnees        |
| Layout            | **Resizable panels** | Fixed layout          | Deja installe, flexible                    |
| Templates         | **Table DB**         | JSON static           | Modifiable sans redeploy                   |
| Stockage contenu  | **HTML dans TEXT**   | JSON (ProseMirror)    | Compatible existant, searchable            |
