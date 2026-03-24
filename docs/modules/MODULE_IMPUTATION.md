# Module Imputation — SYGFP (Etape 3/9)

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Imputation** assure le rattachement budgetaire des depenses. Il recoit les Notes AEF validees (statut `a_imputer`) et les associe a une **ligne budgetaire** avec un code d'imputation structure (OS/Mission/Action/Activite/Sous-activite/NBE/SYSCO). L'imputation validee debouche sur la creation d'une Expression de Besoin.

**Chaine** : Note SEF > Note AEF > **Imputation** > Expression Besoin > Passation Marche > Engagement > Liquidation > Ordonnancement > Reglement

## 2. Routes et acces

| Route                                     | Page                                        | Roles |
| ----------------------------------------- | ------------------------------------------- | ----- |
| `/execution/imputation`                   | Page principale (KPIs, onglets, pagination) | Tous  |
| `/execution/imputation?sourceAef={aefId}` | Pre-selection note AEF a imputer            | Tous  |

## 3. Composants

| Composant                    | Fichier                                                    | Role                                                                          |
| ---------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `ImputationPage` (page)      | `src/pages/execution/ImputationPage.tsx`                   | Page principale avec KPIs, onglets, exports, pagination                       |
| `ImputationForm`             | `src/components/imputation/ImputationForm.tsx`             | Formulaire de creation d'imputation (choix ligne budgetaire, code imputation) |
| `ImputationDetailSheet`      | `src/components/imputation/ImputationDetailSheet.tsx`      | Sheet lateral de detail                                                       |
| `ImputationRejectDialog`     | `src/components/imputation/ImputationRejectDialog.tsx`     | Dialog de saisie motif de rejet                                               |
| `ImputationDeferDialog`      | `src/components/imputation/ImputationDeferDialog.tsx`      | Dialog de report (motif + date reprise)                                       |
| `ImputationValidationDialog` | `src/components/imputation/ImputationValidationDialog.tsx` | Dialog de confirmation de validation                                          |
| `BudgetFormulas`             | `src/components/budget/BudgetFormulas.tsx`                 | Formules de reference budgetaire (compact)                                    |
| `WorkflowStepIndicator`      | `src/components/workflow/WorkflowStepIndicator.tsx`        | Barre horizontale etape 3 active                                              |
| `NotesPagination`            | `src/components/shared/NotesPagination.tsx`                | Pagination serveur-side                                                       |

## 4. Boutons et actions

| Bouton                     | Visible si                                                   | Action                                                            | Effet                                                            |
| -------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| Imputer                    | Onglet "A imputer", note AEF statut `a_imputer`              | Ouvre dialog `ImputationForm`                                     | Cree une imputation brouillon puis a_valider                     |
| Voir (oeil)                | Toute note/imputation                                        | Navigue vers detail AEF ou ouvre `ImputationDetailSheet`          | Consultation                                                     |
| Valider (check)            | Onglet "A valider", role ADMIN/DG/DAAF/SDPM                  | Ouvre `ImputationValidationDialog`                                | `validateImputation(id)` — passe en `valide`                     |
| Differer                   | Onglet "A valider", menu contextuel, role ADMIN/DG/DAAF/SDPM | Ouvre `ImputationDeferDialog`                                     | `deferImputation({id, motif, dateReprise})` — passe en `differe` |
| Rejeter                    | Onglet "A valider", menu contextuel, role ADMIN/DG/DAAF/SDPM | Ouvre `ImputationRejectDialog`                                    | `rejectImputation({id, motif})` — passe en `rejete`              |
| Soumettre                  | Imputation en brouillon, menu contextuel                     | `submitImputation(id)`                                            | Passe en `a_valider`                                             |
| Supprimer                  | Imputation en brouillon, menu contextuel                     | `deleteImputation(id)`                                            | Suppression definitive                                           |
| Creer expression de besoin | Imputation validee, menu contextuel                          | Navigue vers `/execution/expression-besoin?sourceImputation={id}` | Chaine vers etape suivante                                       |
| Voir le dossier            | Imputation avec `dossier_id`, menu contextuel                | Navigue vers `/recherche?dossier={dossierId}`                     | Consultation dossier                                             |
| Exporter > Excel/CSV/PDF   | Toujours                                                     | `exportExcel/CSV/PDF(filters, activeTab)`                         | Export filtre                                                    |

## 5. Statuts et transitions

```
   ┌──────────┐  soumettre  ┌───────────┐  valider  ┌──────────┐
   │ brouillon├────────────>│ a_valider ├─────────>│  valide  │
   └──────────┘             └─────┬─────┘          └──────────┘
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
```

**Statuts** : `brouillon`, `a_valider`, `valide`, `rejete`, `differe`

## 6. Workflow de validation

| Etape         | Role                  | Action                                               | Details                                             |
| ------------- | --------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| 1. Creation   | Agent DAAF/SDPM       | Impute une note AEF validee sur une ligne budgetaire | Selection ligne + montant + code imputation         |
| 2. Soumission | Createur              | Soumet pour validation                               | Passe en `a_valider`                                |
| 3. Validation | ADMIN, DG, DAAF, SDPM | Valide l'imputation                                  | Verifie disponibilite budgetaire, passe en `valide` |
| 3a. Rejet     | ADMIN, DG, DAAF, SDPM | Rejette avec motif                                   | Motif obligatoire                                   |
| 3b. Report    | ADMIN, DG, DAAF, SDPM | Differe avec date reprise                            | Motif obligatoire                                   |

## 7. Donnees Supabase

| Table          | Colonnes cles                                                                                                                                                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `imputations`  | `id`, `reference`, `note_aef_id`, `budget_line_id`, `dossier_id`, `objet`, `montant`, `direction_id`, `os_id`, `mission_id`, `action_id`, `activite_id`, `sous_activite_id`, `nbe_id`, `sysco_id`, `source_financement`, `code_imputation`, `commentaire`, `statut`, `exercice`, `submitted_at`, `validated_at`, `rejected_at`, `motif_rejet`, `motif_differe`, `is_migrated`, `created_by` |
| `notes_dg`     | Notes AEF source (statut `a_imputer`)                                                                                                                                                                                                                                                                                                                                                       |
| `budget_lines` | `id`, `code`, `label`, `dotation_initiale`, `dotation_modifiee`, `total_engage`, `montant_reserve`                                                                                                                                                                                                                                                                                          |

## 8. Hooks

| Hook                   | Fichier                             | Role                                                                                                   |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `useImputations`       | `src/hooks/useImputations.ts`       | Query paginee serveur-side + mutations : submit, validate, reject, defer, delete. Compteurs par statut |
| `useImputation`        | `src/hooks/useImputation.ts`        | Notes AEF a imputer (`notesAImputer`)                                                                  |
| `useImputationsExport` | `src/hooks/useImputationsExport.ts` | Export Excel, CSV, PDF                                                                                 |

## 9. Tests

- Tests E2E via Playwright
- Certification documentee dans `docs/CERTIFICATION_IMPUTATION.md`
- Verification : `npx vitest run`
