# Module Notes SEF — SYGFP (Etape 1/9)

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Les **Notes Sans Effet Financier (SEF)** constituent le point d'entree de la chaine de depense SYGFP. Elles permettent d'exprimer un besoin metier **sans impact budgetaire immediat**. Une Note SEF validee entraine la creation automatique d'un **dossier** (table `dossiers`) qui accompagnera la depense tout au long de la chaine.

**Chaine** : Note SEF > Note AEF > Imputation > Expression Besoin > Passation Marche > Engagement > Liquidation > Ordonnancement > Reglement

## Codification ARTI

| Propriété            | Valeur                                                 |
| -------------------- | ------------------------------------------------------ |
| **Code étape**       | 0 (00 en format 14 chars)                              |
| **Sigle**            | SEF                                                    |
| **Format référence** | `ARTI00MMYYNNNN` (14 chars)                            |
| **Exemple**          | `ARTI0002260001` = SEF n°1, février 2026               |
| **Colonne DB**       | `notes_sef.numero` et `notes_sef.reference_pivot`      |
| **Génération**       | RPC `submit_note_sef_with_reference()` à la soumission |
| **Compteur**         | `arti_reference_counters` (étape=0, par mois)          |

## 2. Routes et acces

| Route                   | Page                                         | Roles           |
| ----------------------- | -------------------------------------------- | --------------- |
| `/notes-sef`            | Liste principale (KPIs, onglets, pagination) | Tous            |
| `/notes-sef/validation` | Espace validation DG/DAAF                    | ADMIN, DG, DAAF |
| `/notes-sef/:id`        | Detail complet d'une note                    | Tous            |

## 3. Composants

| Composant               | Fichier                                             | Role                                           |
| ----------------------- | --------------------------------------------------- | ---------------------------------------------- |
| `NotesSEF` (page)       | `src/pages/NotesSEF.tsx`                            | Page principale avec KPIs, onglets, pagination |
| `NoteSEFForm`           | `src/components/notes-sef/NoteSEFForm.tsx`          | Dialog creation/edition d'une note             |
| `NoteSEFList`           | `src/components/notes-sef/NoteSEFList.tsx`          | Tableau avec actions contextuelles             |
| `NoteSEFDetailSheet`    | `src/components/notes-sef/NoteSEFDetailSheet.tsx`   | Sheet lateral de detail                        |
| `NoteSEFRejectDialog`   | `src/components/notes-sef/NoteSEFRejectDialog.tsx`  | Dialog de saisie motif de rejet                |
| `NoteSEFDeferDialog`    | `src/components/notes-sef/NoteSEFDeferDialog.tsx`   | Dialog de report (motif + condition + date)    |
| `PageHeader`            | `src/components/shared/PageHeader.tsx`              | En-tete avec titre, etape, boutons             |
| `WorkflowStepIndicator` | `src/components/workflow/WorkflowStepIndicator.tsx` | Barre horizontale etape 1 active               |
| `ModuleHelp`            | `src/components/help/ModuleHelp.tsx`                | Aide contextuelle module                       |
| `NotesFiltersBar`       | `src/components/shared/NotesFiltersBar.tsx`         | Barre de recherche + filtres avances           |
| `NotesPagination`       | `src/components/shared/NotesPagination.tsx`         | Pagination serveur-side                        |

## 4. Boutons et actions

| Bouton                | Visible si                                                        | Action                                               | Effet                                                                                                  |
| --------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Nouvelle note SEF     | `canWrite && canCreateRBAC('note_sef')`                           | Ouvre `NoteSEFForm`                                  | Cree un brouillon (sans reference)                                                                     |
| Espace validation (N) | Role ADMIN, DG ou DAAF                                            | Navigue vers `/notes-sef/validation`                 | Affiche les notes a valider                                                                            |
| Exporter > Excel      | Toujours                                                          | `exportNotesSEF()`                                   | Export .xlsx filtre par onglet actif                                                                   |
| Exporter > PDF        | Toujours                                                          | `exportNotesSEFPDF()`                                | Export PDF avec en-tete ARTI                                                                           |
| Soumettre             | Note en brouillon, createur ou admin                              | `submitNote(noteId)`                                 | Genere reference ARTI via RPC `submit_note_sef_with_reference`, passe en `soumis`, notifie validateurs |
| Valider               | Note soumis/a_valider/differe, role DG/ADMIN + delegation/interim | `validateNote(noteId)`                               | Passe en `valide`, cree dossier automatiquement, genere numero dossier                                 |
| Rejeter               | Note soumis/a_valider, role DG/ADMIN + delegation/interim         | `rejectNote({noteId, motif})`                        | Passe en `rejete`, motif obligatoire                                                                   |
| Differer              | Note soumis/a_valider, role DG/ADMIN + delegation/interim         | `deferNote({noteId, motif, condition, dateReprise})` | Passe en `differe`, motif obligatoire                                                                  |
| Re-soumettre          | Note differe ou rejete, createur ou admin                         | `resubmitNote(noteId)`                               | Repasse en `soumis`, reinitialise champs rejet/report                                                  |
| Modifier              | Note en brouillon                                                 | Ouvre `NoteSEFForm` avec note pre-remplie            | Mise a jour des champs                                                                                 |
| Supprimer             | Note en brouillon                                                 | `deleteNote(noteId)`                                 | Suppression definitive                                                                                 |
| Dupliquer             | Toute note                                                        | `duplicateNote(noteId)`                              | Cree un brouillon copie avec `[Copie]` prefix                                                          |
| Voir detail           | Toute note                                                        | Ouvre `NoteSEFDetailSheet`                           | Apercu lateral                                                                                         |

## 5. Statuts et transitions

```
                    ┌──────────────────────────────────────┐
                    │                                      │
   ┌──────────┐  soumettre  ┌──────────┐   valider   ┌──────────┐
   │ brouillon├────────────>│  soumis  ├────────────>│  valide  │
   └──────────┘             └────┬─────┘             └──────────┘
                                 │                        ^
                          rejeter│  differer              │ valider
                                 v       │                │
                           ┌─────────┐   │          ┌──────────┐
                           │ rejete  │   └─────────>│ differe  │
                           └────┬────┘              └────┬─────┘
                                │                        │
                                │     re-soumettre       │
                                └──────────>soumis<──────┘

   soumis ──(passage a_valider)──> a_valider ──(valider/rejeter/differer)
```

**Statuts** : `brouillon`, `soumis`, `a_valider`, `valide`, `rejete`, `differe`, `valide_auto` (SEF shadow pour AEF directe)

## 6. Workflow de validation

| Etape         | Role                               | Action                  | Verification                                                                              |
| ------------- | ---------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| 1. Creation   | Agent (tout role)                  | Cree brouillon          | Exercice ouvert + RBAC `note_sef.create`                                                  |
| 2. Soumission | Createur ou ADMIN                  | Soumet pour validation  | Champs obligatoires : objet, direction, demandeur, urgence, justification, date souhaitee |
| 3. Validation | DG ou ADMIN (+ delegation/interim) | Valide la note          | `checkValidationPermission(userId, 'notes_sef', 'DG')`                                    |
| 3a. Rejet     | DG ou ADMIN (+ delegation/interim) | Rejette avec motif      | Motif obligatoire                                                                         |
| 3b. Report    | DG ou ADMIN (+ delegation/interim) | Differe avec conditions | Motif obligatoire, condition et date optionnelles                                         |
| 4. Dossier    | Automatique                        | Creation dossier        | Numero `ARTI/{ANNEE}/{DIR}/{SEQ}` via `get_next_sequence`                                 |

## 7. Donnees Supabase

| Table               | Colonnes cles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notes_sef`         | `id`, `numero`, `reference_pivot`, `dossier_ref`, `exercice`, `direction_id`, `demandeur_id`, `beneficiaire_id`, `beneficiaire_interne_id`, `objet`, `description`, `justification`, `date_souhaitee`, `urgence`, `commentaire`, `montant_estime`, `type_depense`, `os_id`, `mission_id`, `expose`, `avis`, `recommandations`, `statut`, `rejection_reason`, `rejected_by`, `rejected_at`, `differe_motif`, `differe_condition`, `differe_date_reprise`, `differe_by`, `differe_at`, `validated_by`, `validated_at`, `submitted_by`, `submitted_at`, `validation_mode`, `validated_on_behalf_of`, `created_by`, `dossier_id`, `note_aef_id` |
| `notes_sef_history` | `id`, `note_id`, `action`, `old_statut`, `new_statut`, `commentaire`, `performed_by`, `performed_at`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `dossiers`          | `id`, `numero`, `objet`, `type_dossier`, `direction_id`, `demandeur_id`, `beneficiaire_id`, `note_sef_id`, `statut_global`, `etape_courante`, `exercice`, `montant_estime/engage/liquide/ordonnance/paye`                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `dossier_etapes`    | `id`, `dossier_id`, `type_etape`, `reference_id`, `reference_numero`, `statut`, `montant`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `directions`        | `id`, `code`, `label`, `sigle`, `est_active`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `profiles`          | `id`, `first_name`, `last_name`, `full_name`, `email`, `poste`, `direction_id`, `is_active`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `prestataires`      | `id`, `raison_sociale`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## 8. Hooks

| Hook                    | Fichier                              | Role                                                                                                   |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `useNotesSEF`           | `src/hooks/useNotesSEF.ts`           | Mutations : create, update, submit, validate, reject, defer, resubmit, duplicate, delete, fetchHistory |
| `useNotesSEFList`       | `src/hooks/useNotesSEFList.ts`       | Liste paginee serveur-side avec filtres, compteurs par statut                                          |
| `useNotesSEFExport`     | `src/hooks/useNotesSEFExport.ts`     | Export Excel (.xlsx) et PDF                                                                            |
| `useNotesSEFAudit`      | `src/hooks/useNotesSEFAudit.ts`      | Logging audit : soumission, validation, rejet, report, pieces jointes                                  |
| `usePermissions`        | `src/hooks/usePermissions.ts`        | Verification roles utilisateur                                                                         |
| `useExerciceWriteGuard` | `src/hooks/useExerciceWriteGuard.ts` | Guard ecriture exercice ouvert                                                                         |
| `useRBAC`               | `src/contexts/RBACContext.tsx`       | Controle acces RBAC (`canCreate('note_sef')`)                                                          |

## 9. Tests

- **91+ tests unitaires RBAC** couvrant les permissions de creation, soumission, validation
- Tests E2E via Playwright
- Verification : `npx vitest run --grep "notes.*sef"` ou `npx vitest run`
