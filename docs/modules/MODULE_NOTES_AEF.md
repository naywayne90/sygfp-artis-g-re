# Module Notes AEF — SYGFP (Etape 2/9)

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Les **Notes Avec Effet Financier (AEF)** constituent la deuxieme etape de la chaine de depense. Elles transforment un besoin valide (Note SEF) en demande a impact budgetaire. Une Note AEF peut etre creee de deux facons :

- **Depuis une Note SEF validee** (`origin: FROM_SEF`) : la reference pivot est heritee de la SEF
- **AEF directe DG** (`origin: DIRECT`) : le DG/ADMIN cree une AEF autonome qui genere automatiquement une SEF shadow (statut `valide_auto`)

La table Supabase sous-jacente est `notes_dg`.

**Chaine** : Note SEF > **Note AEF** > Imputation > Expression Besoin > Passation Marche > Engagement > Liquidation > Ordonnancement > Reglement

## Codification ARTI

| Propriété            | Valeur                                                |
| -------------------- | ----------------------------------------------------- |
| **Code étape**       | 1 (01 en format 14 chars)                             |
| **Sigle**            | AEF                                                   |
| **Format référence** | `ARTI01MMYYNNNN` (14 chars)                           |
| **Exemple**          | `ARTI0102260001` = AEF n°1, février 2026              |
| **Colonne DB**       | `notes_dg.numero` et `notes_dg.reference_pivot`       |
| **Génération**       | Trigger `trg_notes_dg_arti_reference` (BEFORE INSERT) |
| **Compteur**         | `arti_reference_counters` (étape=1, par mois)         |
| **Héritage**         | Peut hériter `reference_pivot` de la Note SEF parent  |

## 2. Routes et acces

| Route                        | Page                                         | Roles           |
| ---------------------------- | -------------------------------------------- | --------------- |
| `/notes-aef`                 | Liste principale (KPIs, onglets, pagination) | Tous            |
| `/notes-aef/validation`      | Espace validation DAAF/DG                    | ADMIN, DG, DAAF |
| `/notes-aef/:id`             | Detail complet d'une note                    | Tous            |
| `/notes-aef?prefill={sefId}` | Pre-remplissage depuis Note SEF              | Tous            |

## 3. Composants

| Composant               | Fichier                                             | Role                                                     |
| ----------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| `NotesAEF` (page)       | `src/pages/NotesAEF.tsx`                            | Page principale avec KPIs, onglets, exports, pagination  |
| `NoteAEFForm`           | `src/components/notes-aef/NoteAEFForm.tsx`          | Dialog creation/edition, liaison Note SEF ou AEF directe |
| `NoteAEFList`           | `src/components/notes-aef/NoteAEFList.tsx`          | Tableau avec actions contextuelles par statut            |
| `NoteAEFDetailSheet`    | `src/components/notes-aef/NoteAEFDetailSheet.tsx`   | Sheet lateral de detail                                  |
| `NoteAEFRejectDialog`   | `src/components/notes-aef/NoteAEFRejectDialog.tsx`  | Dialog de saisie motif de rejet                          |
| `NoteAEFDeferDialog`    | `src/components/notes-aef/NoteAEFDeferDialog.tsx`   | Dialog de report (motif + deadline correction)           |
| `NoteAEFImputeDialog`   | `src/components/notes-aef/NoteAEFImputeDialog.tsx`  | Dialog d'imputation sur ligne budgetaire                 |
| `WorkflowStepIndicator` | `src/components/workflow/WorkflowStepIndicator.tsx` | Barre horizontale etape 2 active                         |
| `NotesFiltersBar`       | `src/components/shared/NotesFiltersBar.tsx`         | Recherche + filtres avances (urgence, direction, dates)  |
| `NotesPagination`       | `src/components/shared/NotesPagination.tsx`         | Pagination serveur-side                                  |

## 4. Boutons et actions

| Bouton            | Visible si                                  | Action                                           | Effet                                                                                                                                                       |
| ----------------- | ------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nouvelle note AEF | `canWrite` (exercice ouvert)                | Ouvre `NoteAEFForm`                              | Cree brouillon depuis SEF validee ou AEF directe                                                                                                            |
| Validation (N)    | Role ADMIN, DG ou DAAF                      | Navigue vers `/notes-aef/validation`             | Badge indiquant le nombre en attente                                                                                                                        |
| Excel             | Toujours                                    | `exportNotesAEF()`                               | Export .xlsx avec filtres actifs                                                                                                                            |
| PDF               | Toujours                                    | `exportNotesAEFPDF()`                            | Export PDF avec en-tete ARTI                                                                                                                                |
| CSV               | Toujours                                    | `exportNotesAEFCSV()`                            | Export CSV                                                                                                                                                  |
| Soumettre         | Note en brouillon                           | `submitNote(noteId)`                             | Machine a etats : verifie transition valide, champs obligatoires (objet, direction, urgence, montant, contenu), assure liaison SEF (auto-cree shadow si DG) |
| Valider           | Note soumis/a_valider/differe, role DG/DAAF | `validateNote(noteId)`                           | Passe en `a_imputer`                                                                                                                                        |
| Rejeter           | Note soumis/a_valider, role DG/DAAF         | `rejectNote({noteId, motif})`                    | Passe en `rejete`, motif obligatoire                                                                                                                        |
| Differer          | Note soumis/a_valider, role DG/DAAF         | `deferNote({noteId, motif, deadlineCorrection})` | Passe en `differe`                                                                                                                                          |
| Imputer           | Note en `a_imputer`                         | `imputeNote({noteId, budgetLineId})`             | Associe une ligne budgetaire, passe en `impute`                                                                                                             |
| Modifier          | Note en brouillon                           | Ouvre `NoteAEFForm` edition                      | Mise a jour                                                                                                                                                 |
| Supprimer         | Note en brouillon                           | `deleteNote(noteId)`                             | Suppression definitive                                                                                                                                      |

## 5. Statuts et transitions

```
   ┌──────────┐  soumettre  ┌──────────┐  valider  ┌───────────┐  imputer  ┌──────────┐
   │ brouillon├────────────>│  soumis  ├─────────>│ a_imputer ├────────>│  impute  │
   └──────────┘             └────┬─────┘          └───────────┘         └──────────┘
                                 │
                          rejeter│  differer
                                 │       │
                           ┌─────v───┐   │
                           │ rejete  │   │
                           └─────────┘   │
                                         v
                                   ┌──────────┐
                                   │ differe  │
                                   └──────────┘

   Machine a etats : chaque transition validee via isValidTransitionAEF()
   Transitions definies dans src/lib/notes-aef/constants.ts
```

**Statuts** : `brouillon`, `soumis`, `a_valider`, `a_imputer`, `impute`, `rejete`, `differe`

## 6. Workflow de validation

| Etape                 | Role              | Action                                                | Details                                                                                                               |
| --------------------- | ----------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1. Creation           | Agent ou DG       | Cree brouillon lie a une SEF validee (ou AEF directe) | Verifie que la SEF est `valide`                                                                                       |
| 2. Soumission         | Createur          | Soumet pour validation                                | Champs obligatoires : objet, direction, urgence, montant, contenu. Regle : SEF liee obligatoire (auto-creation si DG) |
| 3. Validation DAAF/DG | DAAF, DG, ADMIN   | Valide la note                                        | Passe en `a_imputer`                                                                                                  |
| 3a. Rejet             | DAAF, DG, ADMIN   | Rejette avec motif                                    | Motif obligatoire                                                                                                     |
| 3b. Report            | DAAF, DG, ADMIN   | Differe avec deadline                                 | Motif obligatoire                                                                                                     |
| 4. Imputation         | DAAF, SDPM, ADMIN | Associe ligne budgetaire                              | Verifie disponibilite budget, passe en `impute`                                                                       |

**Regle metier** : Toute AEF soumise DOIT avoir `note_sef_id` + `reference_pivot`. Si le DG soumet sans lien SEF, une SEF shadow est auto-creee avec statut `valide_auto`.

## 7. Donnees Supabase

| Table          | Colonnes cles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `notes_dg`     | `id`, `numero`, `reference_pivot`, `exercice`, `direction_id`, `objet`, `contenu`, `priorite`, `montant_estime`, `type_depense`, `justification`, `statut`, `origin` (FROM_SEF/DIRECT), `is_direct_aef`, `note_sef_id`, `budget_line_id`, `beneficiaire_id`, `ligne_budgetaire_id`, `os_id`, `action_id`, `activite_id`, `budget_bloque`, `budget_bloque_raison`, `rejection_reason`, `motif_differe`, `date_differe`, `deadline_correction`, `differe_by`, `validated_by`, `validated_at`, `submitted_at`, `imputed_at`, `imputed_by`, `dossier_id`, `created_by` |
| `notes_sef`    | Table source liee via `note_sef_id`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `budget_lines` | `id`, `code`, `label`, `dotation_initiale`, `dotation_modifiee`, `statut`, `direction_id`, `exercice`, `is_active`                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `directions`   | `id`, `code`, `label`, `sigle`, `est_active`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `prestataires` | `id`, `raison_sociale`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## 8. Hooks

| Hook                                             | Fichier                          | Role                                                                                                                                                                                                                |
| ------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useNotesAEF`                                    | `src/hooks/useNotesAEF.ts`       | Mutations : create, createDirectDG, update, submit, validate, reject, defer, impute, delete. Queries : notes, directions, notesSEFValidees, notesSEFDisponibles, beneficiaires, budgetLines, budgetValidationStatus |
| `useNotesAEFList`                                | `src/hooks/useNotesAEFList.ts`   | Liste paginee serveur-side avec filtres et compteurs par statut                                                                                                                                                     |
| `useNotesAEFExport`                              | `src/hooks/useNotesAEFExport.ts` | Export Excel, PDF, CSV                                                                                                                                                                                              |
| `checkBudgetAvailability(budgetLineId, montant)` | Dans `useNotesAEF`               | Verifie disponibilite budgetaire : dotation - total engagements                                                                                                                                                     |

## 9. Tests

- Tests E2E via Playwright
- Certification documentee dans `docs/CERTIFICATION_NOTES_AEF.md`
- Verification : `npx vitest run`
