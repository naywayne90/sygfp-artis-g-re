# Diagnostic Formulaire Notes SEF + Pièces jointes + Workflow

**Date** : 11 février 2026
**Module** : Notes SEF (Sans Effet Financier) - SYGFP ARTI Côte d'Ivoire
**Type** : Diagnostic lecture seule (aucune modification effectuée)

---

## Table des matières

1. [Formulaire de création](#1-formulaire-de-création)
2. [Pièces jointes](#2-pièces-jointes)
3. [Workflow de soumission](#3-workflow-de-soumission)
4. [QR Code](#4-qr-code)
5. [Anomalies détectées](#5-anomalies-détectées)
6. [Recommandations](#6-recommandations)

---

## 1. Formulaire de création

### 1.1 Composant principal

| Élément    | Valeur                                            |
| ---------- | ------------------------------------------------- |
| Fichier    | `src/components/notes-sef/NoteSEFForm.tsx`        |
| Lignes     | 1 088                                             |
| Type       | Dialog modal (`<Dialog>` shadcn)                  |
| Directive  | `@ts-nocheck` (ligne 1)                           |
| Validation | Manuelle (pas de Zod, pas de React Hook Form)     |
| État       | `useState` pour `formData` + `errors` + `touched` |

### 1.2 Tableau complet des champs

| #   | Champ                    | Type UI                        | Obligatoire | Validation client | Source données                                                       | Stocké en DB                              |
| --- | ------------------------ | ------------------------------ | ----------- | ----------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| 1   | **Objet**                | `Input` texte                  | Oui \*      | `!value?.trim()`  | Saisie libre                                                         | `objet` TEXT NOT NULL                     |
| 2   | **Direction**            | `Select` dropdown              | Oui \*      | `!value`          | Table `directions` (est_active=true)                                 | `direction_id` UUID FK                    |
| 3   | **Demandeur**            | `Select` dropdown              | Oui \*      | `!value`          | Table `profiles` (is_active=true)                                    | `demandeur_id` UUID FK                    |
| 4   | **Urgence**              | `Select` dropdown              | Oui \*      | `!value`          | Valeurs fixes : basse, normale, haute, urgente                       | `urgence` TEXT                            |
| 5   | **Date souhaitée**       | `Calendar` popover             | Oui \*      | `!value`          | Datepicker, dates passées désactivées                                | `date_souhaitee` DATE                     |
| 6   | **Justification**        | `Textarea` (3 rows)            | Oui \*      | `!value?.trim()`  | Saisie libre                                                         | `justification` TEXT                      |
| 7   | **Montant estimé**       | `Input` number                 | Non         | Aucune (min=0)    | Saisie libre                                                         | `montant_estime` NUMERIC                  |
| 8   | **Type de dépense**      | `Select` dropdown              | Non         | Aucune            | Valeurs fixes : fonctionnement, investissement, personnel, transfert | `type_depense` TEXT                       |
| 9   | **Objectif Stratégique** | `Select` dropdown              | Non         | Aucune            | Table `objectifs_strategiques` (est_active=true)                     | `os_id` UUID FK                           |
| 10  | **Mission**              | `Select` dropdown              | Non         | Aucune            | Table `missions` (est_active=true)                                   | `mission_id` UUID FK                      |
| 11  | **Bénéficiaire type**    | `RadioGroup`                   | Non         | Aucune            | Choix : "Prestataire externe" / "Agent interne"                      | Détermine quel champ FK est utilisé       |
| 12  | **Bénéficiaire externe** | `Select` dropdown              | Non         | Aucune            | Table `prestataires`                                                 | `beneficiaire_id` UUID FK                 |
| 13  | **Bénéficiaire interne** | `Select` dropdown              | Non         | Aucune            | Table `profiles` (tous)                                              | `beneficiaire_interne_id` UUID FK         |
| 14  | **Description**          | `Textarea` (3 rows)            | Non         | Aucune            | Saisie libre                                                         | `description` TEXT                        |
| 15  | **Exposé**               | `Textarea` (4 rows, resizable) | Non         | Aucune            | Saisie libre, compteur caractères                                    | `expose` TEXT                             |
| 16  | **Avis**                 | `Textarea` (3 rows, resizable) | Non         | Aucune            | Saisie libre, compteur caractères                                    | `avis` TEXT                               |
| 17  | **Recommandations**      | `Textarea` (3 rows, resizable) | Non         | Aucune            | Saisie libre, compteur caractères                                    | `recommandations` TEXT                    |
| 18  | **Pièces jointes**       | `<input type="file" multiple>` | Non         | Voir §2           | Fichiers locaux                                                      | Table `notes_sef_pieces` + bucket Storage |
| 19  | **Commentaire**          | `Textarea` (2 rows)            | Non         | Aucune            | Saisie libre                                                         | `commentaire` TEXT                        |

### 1.3 Validation côté client

**Mécanisme** : Validation manuelle avec `validateForm()` (pas de Zod, pas de React Hook Form).

```typescript
// NoteSEFForm.tsx, lignes 261-285
const validateForm = (): boolean => {
  const newErrors = {};
  if (!formData.objet.trim()) newErrors.objet = "L'objet est obligatoire";
  if (!formData.direction_id) newErrors.direction_id = 'La direction est obligatoire';
  if (!formData.demandeur_id) newErrors.demandeur_id = 'Le demandeur est obligatoire';
  if (!formData.urgence) newErrors.urgence = "L'urgence est obligatoire";
  if (!formData.justification.trim()) newErrors.justification = 'La justification est obligatoire';
  if (!formData.date_souhaitee) newErrors.date_souhaitee = 'La date souhaitée est obligatoire';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**Validation temps réel** : Chaque champ obligatoire est validé au `onBlur` via `handleBlur()` → `validateField()`. Les erreurs s'affichent sous chaque champ avec une icône `AlertCircle`.

**Validation absente** :

- Pas de longueur min/max pour les champs texte
- Pas de validation du montant estimé (peut être négatif via saisie directe)
- Pas de validation que la date souhaitée est dans l'exercice courant
- Pas de Zod schema — le fichier a `@ts-nocheck` et utilise `any` implicitement

### 1.4 Auto-remplissage Demandeur / Direction

**Direction** : Auto-remplie à l'ouverture du dialog (création uniquement).

```typescript
// NoteSEFForm.tsx, lignes 104-126
useEffect(() => {
  const loadCurrentUser = async () => {
    if (!note && open) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('direction_id')
          .eq('id', user.id)
          .single();
        setFormData((prev) => ({
          ...prev,
          demandeur_id: user.id,
          direction_id: profile?.direction_id || prev.direction_id,
        }));
      }
    }
  };
  loadCurrentUser();
}, [open, note]);
```

**Demandeur** : Auto-rempli avec `user.id` à la création.

**Changement de direction** : Quand la direction change, le demandeur est recalculé (lignes 480-508) :

- Si l'utilisateur connecté est dans la direction → auto-sélectionné
- Sinon, si l'utilisateur n'est pas admin → premier profil de la direction
- Si admin → champ vidé pour sélection manuelle

**Qui peut changer le demandeur ?** : Uniquement les rôles `ADMIN`, `DG`, `DAAF`, `CB` (variable `canChangeDemandeur`). Les autres utilisateurs voient le champ verrouillé.

### 1.5 Actions "Brouillon" vs "Créer et soumettre"

| Action                 | Bouton                        | Statut résultant       | Référence générée ? | Notifications ?                 |
| ---------------------- | ----------------------------- | ---------------------- | ------------------- | ------------------------------- |
| **Brouillon**          | `<Save />` Brouillon          | `brouillon`            | Oui (côté client)   | Non                             |
| **Créer et soumettre** | `<Send />` Créer et soumettre | `brouillon` → `soumis` | Oui (côté client)   | Oui (validateurs DG/DAAF/ADMIN) |

**Flux "Brouillon"** :

1. `handleSubmit()` appelle `createNote(dataToSend)`
2. `createMutation` insère la note avec `reference_pivot` et `numero` générés côté client
3. Note créée en statut `brouillon` (statut par défaut de la colonne DB)
4. PJ uploadées après la création (si présentes)
5. Toast : "Brouillon créé : ARTI..."

**Flux "Créer et soumettre"** :

1. `handleSaveAndSubmit()` met `submitAfterSave = true`
2. `handleSubmit()` crée la note (même flux que Brouillon)
3. Si `submitAfterSave === true`, appelle immédiatement `submitNote(result.id)`
4. `submitMutation` : UPDATE statut → `soumis`, `submitted_by`, `submitted_at`
5. `logSoumission()` → insère dans `notes_sef_history` + `audit_logs` + envoie notifications
6. Toast : "Note ARTI... créée et soumise"

---

## 2. Pièces jointes

### 2.1 Architecture de stockage

| Élément                 | Valeur                                           |
| ----------------------- | ------------------------------------------------ |
| **Service de stockage** | Supabase Storage                                 |
| **Bucket**              | `notes-sef`                                      |
| **Chemin fichier**      | `{exercice}/{noteId}/{timestamp}_{safeFileName}` |
| **Table métadonnées**   | `notes_sef_pieces`                               |
| **Lien**                | `notes_sef_pieces.note_id` → `notes_sef.id` (FK) |

### 2.2 Structure table `notes_sef_pieces`

| Colonne                      | Type        | Description                   |
| ---------------------------- | ----------- | ----------------------------- |
| `id`                         | UUID PK     | Identifiant                   |
| `note_id`                    | UUID FK     | Référence vers `notes_sef`    |
| `fichier_url`                | TEXT        | Chemin dans le bucket Storage |
| `nom`                        | TEXT        | Nom original du fichier       |
| `type_fichier`               | TEXT        | Type MIME                     |
| `taille`                     | INTEGER     | Taille en octets              |
| `uploaded_by`                | UUID FK     | Utilisateur ayant uploadé     |
| `uploaded_at` / `created_at` | TIMESTAMPTZ | Date d'upload                 |

### 2.3 Validation fichiers (composant `FilePreview.tsx`)

```typescript
// FilePreview.tsx, lignes 27-42
export const FILE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10 MB par fichier
  maxSizeLabel: '10 Mo',
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  allowedExtensions: [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
  ],
};
```

### 2.4 Limites de nombre de PJ

| Source                                      | Limite                         | Appliquée ?                                                            |
| ------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| **UI formulaire** (ligne 1000)              | "Illimité"                     | Aucune limite en code                                                  |
| **`constants.ts`** (ligne 226)              | `MAX_ATTACHMENTS_PER_NOTE: 10` | **NON appliquée** (constante définie mais jamais vérifiée)             |
| **Spec MBAYE** (migration `20260129162945`) | Max 3 PJ numérotées            | Table `pieces_jointes` séparée, **NON utilisée par le formulaire SEF** |
| **Bucket Storage**                          | Pas de limite serveur          | Upload unitaire séquentiel sans plafond                                |

**Conclusion** : Il n'y a **aucune limite de nombre de PJ** dans le code actuel du formulaire.

### 2.5 Deux systèmes de PJ coexistants

| Système                          | Table              | Migration        | Utilisé par SEF ?               |
| -------------------------------- | ------------------ | ---------------- | ------------------------------- |
| **Ancien** (spécifique SEF)      | `notes_sef_pieces` | `20260115133424` | **OUI** (formulaire + détail)   |
| **Nouveau** (spec MBAYE, unifié) | `pieces_jointes`   | `20260129162945` | **NON** (max 3, numérotées, R2) |

Le formulaire SEF n'utilise que `notes_sef_pieces` avec Supabase Storage (bucket `notes-sef`). La table unifiée `pieces_jointes` (max 3, Cloudflare R2) n'est pas branchée.

### 2.6 Flux d'upload

1. L'utilisateur sélectionne des fichiers (input `multiple`)
2. `validateFile()` vérifie taille (10 Mo) et type MIME pour chaque fichier
3. Les fichiers valides sont affichés dans `<FileList>` avec prévisualisation images/PDF
4. À la soumission du formulaire, `uploadFiles(noteId)` :
   - Pour chaque fichier : upload vers `supabase.storage.from('notes-sef')` → insert dans `notes_sef_pieces`
   - Log dans `notes_sef_history` (succès ou échec par fichier)
   - Compteur succès/échecs avec toast approprié

---

## 3. Workflow de soumission

### 3.1 Cycle de vie complet

```
               ┌─────────────────────────────────────────┐
               │           CRÉATION (formulaire)          │
               │  • Référence ARTI générée côté client    │
               │  • Statut = brouillon                    │
               │  • PJ uploadées après création            │
               └───────────┬──────────────┬───────────────┘
                           │              │
                    "Brouillon"    "Créer et soumettre"
                           │              │
                           ▼              ▼
                    ┌──────────┐   ┌──────────┐
                    │ brouillon│──▶│  soumis   │
                    └──────────┘   └─────┬─────┘
                         │               │
                   (Modifier,      ┌─────┴─────────────────┐
                    Soumettre)     │                        │
                                  ▼                        ▼
                           ┌──────────┐            ┌──────────┐
                           │ a_valider│            │  differe  │
                           └─────┬────┘            └─────┬────┘
                                 │                       │
                    ┌────────────┼────────────┐          │
                    ▼            ▼             ▼         │
             ┌──────────┐ ┌──────────┐ ┌──────────┐    │
             │  valide   │ │  rejete  │ │ a_valider│◀───┘
             │  (final)  │ │  (final) │ └──────────┘
             └─────┬─────┘ └──────────┘
                   │
                   ▼
            ┌──────────────┐
            │ Dossier créé │
            │automatiquement│
            └──────────────┘
```

### 3.2 "Créer et soumettre" — détail technique

**Étape 1 : Création** (`createMutation`, lignes 186-252)

- Génère `reference_pivot` côté client via `generateReferencePivot()`
- Format : `ARTI0MMYYNNNN` (identique au format trigger)
- Insère dans `notes_sef` avec `numero = reference_pivot`
- Note créée en statut `brouillon` (défaut DB)
- Log dans `notes_sef_history` + `audit_logs`

**Étape 2 : Upload PJ** (si fichiers sélectionnés)

- Séquentiel, fichier par fichier
- Échec non bloquant (log + toast warning)

**Étape 3 : Soumission** (`submitMutation`, lignes 290-367)

- Récupère la note fraîchement créée
- **Revalide les champs obligatoires** (objet, direction, demandeur, urgence, justification, date_souhaitee)
- Vérifie que l'utilisateur est créateur ou admin
- UPDATE `statut = 'soumis'`, `submitted_by`, `submitted_at`
- `logSoumission()` → audit + notifications

### 3.3 Notifications à la soumission

```typescript
// useNotesSEFAudit.ts, lignes 117-131
if (action === 'soumission') {
  const validatorIds = await getValidators(); // DG + DAAF + ADMIN
  for (const userId of validatorIds) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'validation',
      title: 'Note SEF à valider',
      message: `La note ${reference} nécessite votre validation.`,
      entity_type: 'note_sef',
      entity_id: note.id,
      is_urgent: note.urgence === 'urgente' || note.urgence === 'haute',
    });
  }
}
```

| Action     | Destinataires        | Type notification | Urgent si             |
| ---------- | -------------------- | ----------------- | --------------------- |
| Soumission | DG + DAAF + ADMIN    | `validation`      | Urgence haute/urgente |
| Validation | Créateur + Demandeur | `info`            | Non                   |
| Rejet      | Créateur + Demandeur | `rejet`           | Toujours              |
| Report     | Créateur + Demandeur | `differe`         | Non                   |

**Méthode de notification** : Insertion dans la table `notifications` (in-app). Pas d'email.

### 3.4 "Brouillon" — détail technique

- Note créée en statut `brouillon`
- Modifiable ensuite (page de détail ou réouverture du formulaire)
- Soumissible plus tard via le bouton "Soumettre" (visible si statut = brouillon)
- **Autosave** disponible via `useNoteSEFAutosave` (debounce 3s, uniquement statut brouillon)
- Protection `beforeunload` si modifications non sauvegardées

### 3.5 Génération de référence — double système

**ANOMALIE CRITIQUE** : La référence est générée **deux fois** — côté client ET côté serveur (trigger).

| Système     | Localisation                     | Moment         | Table compteur                              |
| ----------- | -------------------------------- | -------------- | ------------------------------------------- |
| **Client**  | `useNotesSEF.ts`, lignes 158-183 | Avant INSERT   | Compte via `SELECT COUNT` (non atomique)    |
| **Trigger** | Migration SQL, BEFORE INSERT     | Pendant INSERT | `arti_reference_counters` (UPSERT atomique) |

**Le client pré-remplit `numero` et `reference_pivot`** avant l'INSERT. Le trigger SQL vérifie `IF NEW.numero IS NULL OR NEW.numero = ''` et **ne génère rien** car le champ est déjà rempli par le client.

**Risque** : Le compteur client (`SELECT COUNT + 1`) n'est pas atomique — deux créations simultanées peuvent produire la même référence. Le trigger SQL (compteur UPSERT) est safe mais contourné.

---

## 4. QR Code

### 4.1 Infrastructure QR Code

Le système QR Code est **complet et opérationnel**. Voici les composants :

| Fichier                                                           | Rôle                                                                | Lignes |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- | ------ |
| `src/lib/qrcode-utils.ts`                                         | Génération hash SHA256, encode/decode payload, URL vérification     | 191    |
| `src/hooks/useQRCode.ts`                                          | Hook React : `useQRCode()` + `useVerifyQRCode()`                    | 118    |
| `src/components/qrcode/QRCodeGenerator.tsx`                       | Composant SVG avec tailles sm/md/lg/print                           | 94     |
| `src/components/qrcode/QRCodeDisplay.tsx`                         | Affichage QR avec hash tronqué                                      | —      |
| `src/components/qrcode/QRCodePrint.tsx`                           | Version impression                                                  | —      |
| `src/pages/VerifyDocument.tsx`                                    | Page publique `/verify/:hash` (sans auth)                           | —      |
| `src/services/noteSEFPdfService.ts`                               | Intègre QR Code dans le PDF (page 2)                                | 746    |
| `supabase/migrations/20260202100000_documents_generes_qrcode.sql` | Tables `documents_generes` + `verifications_qrcode` + rate limiting | —      |
| `src/components/notes-sef/ValidationDGSection.tsx`                | Section validation DG avec QR code dans le détail                   | —      |
| `e2e/documents/qrcode.spec.ts`                                    | Tests E2E QR Code                                                   | —      |

### 4.2 Utilisation sur les Notes SEF

**Oui, le QR Code est utilisé sur les Notes SEF** dans deux contextes :

#### 4.2.1 PDF généré (`noteSEFPdfService.ts`)

```typescript
// noteSEFPdfService.ts, lignes 674-679
const validationUrl = validation?.token
  ? `${baseUrl}/dg/valider/${validation.token}`
  : `${baseUrl}/notes-sef/${note.id}`;

const qrDataUrl = await generateQRCodeDataUrl(validationUrl, 150);
```

- Le QR Code est intégré sur la **page 2** du PDF (observations DG)
- Il encode une URL de validation : `/dg/valider/{token}` ou `/notes-sef/{noteId}`
- Généré via `QRCodeCanvas` de `qrcode.react` converti en Data URL

#### 4.2.2 Section Validation DG (`ValidationDGSection.tsx`)

- Composant `<ValidationDGSection>` dans la page de détail
- Affiche le QR code SVG avec `QRCodeSVG` de `qrcode.react`
- Utilise `useValidationDG` pour créer et afficher le lien de validation
- Le DG peut scanner le QR pour valider via mobile

### 4.3 Sécurité du QR Code

| Aspect             | Implémentation                                                   |
| ------------------ | ---------------------------------------------------------------- |
| Anti-falsification | Hash SHA256 avec clé secrète                                     |
| Vérification       | Page publique `/verify/:hash` (accessible sans auth)             |
| Rate limiting      | Table `rate_limit_qrcode` (par IP)                               |
| Traçabilité        | Table `documents_generes` (historique des PDF générés)           |
| Expiration         | Champ `date_expiration` dans `documents_generes` (optionnel)     |
| Annulation         | Champs `est_annule`, `motif_annulation` dans `documents_generes` |

**Point d'attention** : La clé secrète est **hardcodée** dans le code source :

```typescript
// qrcode-utils.ts, ligne 48
const SECRET_KEY = 'SYGFP_ARTI_2026_SECRET_KEY';
```

Cela devrait être une variable d'environnement en production.

---

## 5. Anomalies détectées

### Anomalie 1 : `@ts-nocheck` sur le formulaire (CRITIQUE)

**Fichier** : `NoteSEFForm.tsx` (ligne 1)
**Description** : La directive `// @ts-nocheck` désactive TOUTE vérification TypeScript sur le fichier le plus critique du module (1 088 lignes).
**Impact** : Aucune erreur de type détectée. Le compilateur ignore les `any` implicites, les accès à des propriétés inexistantes, les types incorrects dans les callbacks.
**Priorité** : CRITIQUE

### Anomalie 2 : Référence générée côté client, non atomique (CRITIQUE)

**Fichier** : `useNotesSEF.ts`, lignes 158-183
**Description** : La référence ARTI est générée côté client via `SELECT COUNT` + 1. Ce n'est pas atomique — deux créations simultanées dans la même seconde pourraient produire le même numéro.
**Impact** : Doublon de référence possible. Le trigger SQL (UPSERT atomique) est contourné car `numero` est déjà rempli.
**Priorité** : CRITIQUE

```typescript
// useNotesSEF.ts, lignes 168-182 — RISQUE DE COLLISION
const { count } = await supabase
  .from('notes_sef')
  .select('id', { count: 'exact', head: true })
  .eq('exercice', currentExercice)
  .gte('created_at', startOfMonth)
  .lte('created_at', endOfMonth);

const sequence = ((count || 0) + 1).toString().padStart(4, '0');
return `ARTI${stepCode}${month}${year}${sequence}`;
```

### Anomalie 3 : Aucune limite de nombre de PJ (HAUTE)

**Fichier** : `NoteSEFForm.tsx`, lignes 969-1010
**Description** : L'UI affiche "Illimité" et le code ne vérifie jamais le nombre de fichiers. La constante `MAX_ATTACHMENTS_PER_NOTE: 10` dans `constants.ts` n'est jamais lue. La spec MBAYE (migration `20260129162945`) impose max 3 PJ mais utilise une table différente (`pieces_jointes` vs `notes_sef_pieces`).
**Impact** : Un utilisateur peut joindre un nombre illimité de fichiers, saturant le stockage.
**Priorité** : HAUTE

### Anomalie 4 : Pas de Zod ni React Hook Form (MOYENNE)

**Description** : Le formulaire de 1 088 lignes utilise uniquement `useState` + validation manuelle. Pas de schéma Zod, pas de `useForm()`.
**Impact** :

- Validation fragile et difficilement maintenable
- Pas de validation côté type au moment du build (à cause de `@ts-nocheck`)
- Les erreurs de validation ne sont pas centralisées
  **Priorité** : MOYENNE

### Anomalie 5 : Champs "Exposé", "Avis", "Recommandations" non obligatoires (MOYENNE)

**Description** : Ces 3 champs du "Contenu de la note" ne sont pas validés comme obligatoires. Or ils constituent le corps principal de la note SEF et sont attendus dans le PDF généré (page 1).
**Impact** : Une note peut être soumise sans contenu réel (seulement objet + justification). Le PDF généré aura des sections vides.
**Priorité** : MOYENNE

### Anomalie 6 : Clé secrète QR Code hardcodée (MOYENNE)

**Fichier** : `src/lib/qrcode-utils.ts`, ligne 48
**Description** : `SECRET_KEY = 'SYGFP_ARTI_2026_SECRET_KEY'` en dur dans le code source. Devrait être `import.meta.env.VITE_QR_SECRET_KEY` ou similaire.
**Impact** : La clé est visible dans le code source déployé (bundle JS côté client). Tout le système d'anti-falsification est compromis.
**Priorité** : MOYENNE (la vérification est déjà côté client, le hash n'est pas comparé en base)

### Anomalie 7 : Upload PJ séquentiel et non transactionnel (FAIBLE)

**Description** : Les PJ sont uploadées une par une dans une boucle `for`. Si le fichier 3 échoue sur 5, les 2 premiers sont conservés. Il n'y a pas de rollback.
**Impact** : Upload partiel possible (certaines PJ présentes, d'autres non). Le toast warning informe l'utilisateur mais ne propose pas de réessayer.
**Priorité** : FAIBLE

### Anomalie 8 : Autosave ne sauvegarde pas expose/avis/recommandations (FAIBLE)

**Fichier** : `useNoteSEFAutosave.ts`, interface `AutosaveData` (lignes 14-29)
**Description** : L'interface `AutosaveData` ne contient pas les champs `expose`, `avis`, `recommandations`. Ces champs ne sont pas sauvegardés automatiquement en mode brouillon.
**Impact** : Perte de contenu si l'utilisateur ferme le navigateur après avoir rédigé l'exposé/avis/recommandations sans sauvegarder manuellement.
**Priorité** : FAIBLE

---

## 6. Recommandations

### Priorité CRITIQUE

| #   | Recommandation                                                                                                                                                                                                                                                 | Fichiers concernés                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| R1  | **Supprimer `@ts-nocheck`** de `NoteSEFForm.tsx`. Corriger les erreurs TypeScript résultantes. Migrer vers un schéma Zod + React Hook Form.                                                                                                                    | `NoteSEFForm.tsx`                                     |
| R2  | **Supprimer la génération de référence côté client**. Laisser le champ `numero` vide à l'INSERT pour que le trigger SQL génère la référence de manière atomique (UPSERT). Mettre à jour le cache React Query après INSERT pour récupérer la référence générée. | `useNotesSEF.ts` (supprimer `generateReferencePivot`) |

### Priorité HAUTE

| #   | Recommandation                                                                                                                                                                                                                                       | Fichiers concernés                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| R3  | **Appliquer la limite de PJ**. Soit utiliser `MAX_ATTACHMENTS_PER_NOTE: 10` de `constants.ts`, soit migrer vers la table `pieces_jointes` (max 3, spec MBAYE). Dans les deux cas, vérifier avant l'upload et afficher le compteur restant dans l'UI. | `NoteSEFForm.tsx`, `FilePreview.tsx`, `constants.ts` |

### Priorité MOYENNE

| #   | Recommandation                                                                                                                                 | Fichiers concernés                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| R4  | **Rendre obligatoires** les champs Exposé, Avis, Recommandations (au moins pour la soumission, pas pour le brouillon).                         | `NoteSEFForm.tsx` (validateForm), `useNotesSEF.ts` (submitMutation) |
| R5  | **Externaliser la clé secrète QR Code** vers une variable d'environnement. Idéalement, déplacer la vérification côté serveur (Edge Function).  | `qrcode-utils.ts`                                                   |
| R6  | **Unifier les systèmes de PJ** : choisir entre `notes_sef_pieces` (actuel) et `pieces_jointes` (spec MBAYE). Migrer les données si nécessaire. | Migrations, formulaire, page détail                                 |

### Priorité FAIBLE

| #   | Recommandation                                                                                                                                  | Fichiers concernés      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| R7  | **Ajouter expose/avis/recommandations** à l'interface `AutosaveData` dans `useNoteSEFAutosave.ts`.                                              | `useNoteSEFAutosave.ts` |
| R8  | **Ajouter validations supplémentaires** : longueur min objet (10 chars), montant_estime >= 0 côté form, date_souhaitee dans l'exercice courant. | `NoteSEFForm.tsx`       |

---

## Annexe A : Fichiers analysés

| Fichier                                            | Lignes | Rôle                                                                           |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| `src/components/notes-sef/NoteSEFForm.tsx`         | 1 088  | Formulaire création/édition (Dialog)                                           |
| `src/components/notes-sef/FilePreview.tsx`         | 333    | Validation + preview fichiers                                                  |
| `src/hooks/useNotesSEF.ts`                         | 868    | Hook CRUD : create, update, submit, validate, reject, defer, delete, duplicate |
| `src/hooks/useNotesSEFAudit.ts`                    | 329    | Audit trail + notifications                                                    |
| `src/hooks/useNoteSEFAutosave.ts`                  | 173    | Autosave brouillons (debounce 3s)                                              |
| `src/lib/notes-sef/types.ts`                       | 252    | Types TypeScript (NoteSEFEntity, DTOs, Filtres)                                |
| `src/lib/notes-sef/constants.ts`                   | 280    | Constantes (statuts, urgences, config)                                         |
| `src/lib/qrcode-utils.ts`                          | 191    | Utilitaires QR Code (hash, encode, verify)                                     |
| `src/hooks/useQRCode.ts`                           | 118    | Hook QR Code (génération + vérification)                                       |
| `src/components/qrcode/QRCodeGenerator.tsx`        | 94     | Composant QR Code SVG                                                          |
| `src/services/noteSEFPdfService.ts`                | 746    | Génération PDF avec QR Code                                                    |
| `src/components/notes-sef/ValidationDGSection.tsx` | —      | Section validation DG avec QR Code                                             |
| `src/pages/VerifyDocument.tsx`                     | —      | Page publique vérification QR                                                  |
| `supabase/migrations/20260115133424_*.sql`         | —      | Table notes_sef_pieces                                                         |
| `supabase/migrations/20260129162945_*.sql`         | —      | Table pieces_jointes (spec MBAYE, max 3)                                       |
| `supabase/migrations/20260202100000_*.sql`         | —      | Tables documents_generes + verifications_qrcode                                |

## Annexe B : Tables DB impliquées

| Table                     | Rôle                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| `notes_sef`               | Table principale des notes SEF                                       |
| `notes_sef_pieces`        | PJ des notes SEF (Supabase Storage)                                  |
| `notes_sef_history`       | Historique/audit des actions                                         |
| `pieces_jointes`          | PJ unifiées spec MBAYE (max 3, Cloudflare R2) — NON utilisée par SEF |
| `notifications`           | Notifications in-app                                                 |
| `audit_logs`              | Logs d'audit globaux                                                 |
| `documents_generes`       | Traçabilité des PDF générés                                          |
| `verifications_qrcode`    | Log des vérifications QR Code                                        |
| `arti_reference_counters` | Compteurs de référence ARTI (trigger SQL)                            |
| `directions`              | Référentiel directions                                               |
| `profiles`                | Référentiel utilisateurs                                             |
| `prestataires`            | Référentiel prestataires                                             |
| `objectifs_strategiques`  | Référentiel OS                                                       |
| `missions`                | Référentiel missions                                                 |
