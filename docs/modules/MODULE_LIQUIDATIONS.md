# Module Liquidations — SYGFP (Etape 7/9)

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Liquidation** constate le service fait et determine le montant exact a payer. Il recoit les Engagements valides et certifie la realisation de la prestation. Le workflow de validation comporte 2 etapes : **DAAF** puis **DG** (conditionnel au-dela de 50 000 000 FCFA). Le module est **certifie 100/100** avec 104 tests unitaires et 60 tests E2E.

**Chaine** : Note SEF > Note AEF > Imputation > Expression Besoin > Passation Marche > Engagement > **Liquidation** > Ordonnancement > Reglement

## 2. Routes et acces

| Route                                 | Page                                         | Roles |
| ------------------------------------- | -------------------------------------------- | ----- |
| `/liquidations`                       | Liste principale (KPIs, onglets, pagination) | Tous  |
| `/liquidations?sourceEngagement={id}` | Pre-selection engagement source              | Tous  |

## 3. Composants

| Composant                   | Fichier                                                    | Role                                                                             |
| --------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `Liquidations` (page)       | `src/pages/Liquidations.tsx`                               | Page principale avec KPIs, onglets, dashboard DAAF, alertes urgentes, pagination |
| `LiquidationForm`           | `src/components/liquidation/LiquidationForm.tsx`           | Dialog creation depuis engagement valide                                         |
| `LiquidationList`           | `src/components/liquidation/LiquidationList.tsx`           | Tableau avec actions contextuelles, role-based                                   |
| `LiquidationDetails`        | `src/components/liquidation/LiquidationDetails.tsx`        | Sheet detail                                                                     |
| `LiquidationValidationDAAF` | `src/components/liquidation/LiquidationValidationDAAF.tsx` | Dashboard validation DAAF                                                        |
| `LiquidationValidateDialog` | `src/components/liquidation/LiquidationValidateDialog.tsx` | Dialog de validation                                                             |
| `LiquidationRejectDialog`   | `src/components/liquidation/LiquidationRejectDialog.tsx`   | Dialog de rejet avec motif                                                       |
| `LiquidationDeferDialog`    | `src/components/liquidation/LiquidationDeferDialog.tsx`    | Dialog de report                                                                 |
| `UrgentLiquidationList`     | `src/components/liquidations/UrgentLiquidationList.tsx`    | Liste liquidations urgentes                                                      |
| `BudgetChainExportButton`   | `src/components/export/BudgetChainExportButton.tsx`        | Export chaine budgetaire                                                         |
| `WorkflowStepIndicator`     | `src/components/workflow/WorkflowStepIndicator.tsx`        | Barre horizontale etape 7 active                                                 |
| `NotesPagination`           | `src/components/shared/NotesPagination.tsx`                | Pagination serveur-side                                                          |

## 4. Boutons et actions

| Bouton                 | Visible si                                         | Action                                                 | Effet                                        |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| Nouvelle liquidation   | Engagement valide disponible                       | Ouvre `LiquidationForm`                                | Cree liquidation en brouillon                |
| Soumettre              | Liquidation brouillon                              | `submitLiquidation(id)`                                | Passe en `soumis`                            |
| Valider DAAF           | Liquidation soumise, role DAAF                     | `validateLiquidation(id)`                              | Passe en `valide_daaf`                       |
| Valider DG             | Liquidation `valide_daaf`, role DG, montant >= 50M | `validateLiquidation(id)`                              | Passe en `valide_dg`                         |
| Rejeter                | En validation, role concerne                       | Ouvre `LiquidationRejectDialog`                        | Passe en `rejete`, motif obligatoire         |
| Differer               | En validation, role concerne                       | Ouvre `LiquidationDeferDialog`                         | Passe en `differe`                           |
| Reprendre              | Liquidation differee                               | `resumeLiquidation(id)`                                | Re-soumet                                    |
| Voir detail            | Toute liquidation                                  | Ouvre `LiquidationDetails`                             | Consultation                                 |
| Filtre urgent          | Toujours                                           | Switch `urgentOnlyFilter`                              | Affiche uniquement les liquidations urgentes |
| Exporter > Excel       | Toujours                                           | `exportExcel()`                                        | Export .xlsx                                 |
| Exporter > CSV         | Toujours                                           | `exportCSV()`                                          | Export CSV                                   |
| Exporter > PDF         | Toujours                                           | `exportPDF()`                                          | Export PDF                                   |
| Exporter > Attestation | Liquidation validee                                | `exportAttestation()`                                  | Attestation de service fait                  |
| Creer ordonnancement   | Liquidation validee DG, menu contextuel            | Navigue vers `/ordonnancements?sourceLiquidation={id}` | Chaine vers etape suivante                   |

## 5. Statuts et transitions

```
   ┌──────────┐  soumettre  ┌──────────┐  valider DAAF  ┌────────────┐  valider DG  ┌───────────┐
   │ brouillon├────────────>│  soumis  ├──────────────>│ valide_daaf├────────────>│ valide_dg │
   └──────────┘             └────┬─────┘               └─────┬──────┘            └───────────┘
                                 │                           │
                          rejeter│  differer          rejeter│  differer
                                 │       │                   │       │
                           ┌─────v───┐   │             ┌────v────┐  │
                           │ rejete  │   │             │ rejete  │  │
                           └─────────┘   │             └─────────┘  │
                                         v                          v
                                   ┌──────────┐              ┌──────────┐
                                   │ differe  │              │ differe  │
                                   └──────────┘              └──────────┘

   Note: Si montant < 50 000 000 FCFA, la validation DG est optionnelle (skip possible)
```

**Statuts** : `brouillon`, `soumis`, `valide_daaf`, `valide_dg`, `rejete`, `differe`
**Seuil validation DG** : `SEUIL_VALIDATION_DG = 50 000 000 FCFA`

## 6. Workflow de validation

| Etape                             | Role       | Statut        | Details                                                                |
| --------------------------------- | ---------- | ------------- | ---------------------------------------------------------------------- |
| 1. Creation                       | Agent/SDCT | `brouillon`   | Certification service fait, montant, pieces justificatives             |
| 2. Soumission                     | Createur   | `soumis`      | Demarre validation                                                     |
| 3. Validation DAAF                | DAAF       | `valide_daaf` | Visa `visa_daaf_user_id`, `visa_daaf_date`                             |
| 4. Validation DG (conditionnelle) | DG         | `valide_dg`   | Requise si montant >= 50M FCFA. Visa `visa_dg_user_id`, `visa_dg_date` |

**Delegation** : La validation peut etre effectuee par delegation via `useCanValidateLiquidation()`.

**Etapes simplifiees du workflow** (`VALIDATION_FLOW_STEPS`) :

1. Certifie SF — role AUTEUR/SDCT
2. Validation DAAF — role DAAF
3. Validation DG — role DG (conditionnel)

## 7. Donnees Supabase

| Table                      | Colonnes cles                                                                                                                                                                                                                                                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `liquidations`             | `id`, `numero`, `engagement_id`, `montant`, `montant_service_fait`, `objet`, `date_service_fait`, `statut`, `exercice`, `dossier_id`, `direction_id`, `is_urgent`, `tranche_numero`, `tranche_libelle`, `visa_daaf_user_id/date`, `visa_dg_user_id/date`, `rejection_reason`, `rejected_by`, `motif_differe`, `differe_by`, `submitted_at`, `created_by` |
| `budget_engagements`       | Engagement source (statut `valide`) — lie via `engagement_id`                                                                                                                                                                                                                                                                                            |
| `liquidation_counts` (vue) | `brouillon`, `soumis`, `valide_daaf`, `valide_dg`, `rejete`, `differe`, `service_fait`, `total_montant`, `a_valider`                                                                                                                                                                                                                                     |

## 8. Hooks

| Hook                            | Fichier                              | Role                                                                                                                                                                       |
| ------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useLiquidations`               | `src/hooks/useLiquidations.ts`       | Query paginee serveur + mutations : submit, validate, reject, defer, resume. Engagements valides. Constants : VALIDATION_STEPS, SEUIL_VALIDATION_DG, VALIDATION_FLOW_STEPS |
| `useLiquidationCounts`          | `src/hooks/useLiquidations.ts`       | Compteurs par statut (vue materialisee)                                                                                                                                    |
| `useLiquidationLight`           | `src/hooks/useLiquidations.ts`       | Donnees legeres pour dashboard                                                                                                                                             |
| `useOverdueUrgentLiquidations`  | `src/hooks/useLiquidations.ts`       | Liquidations urgentes en retard                                                                                                                                            |
| `useEngagementsSansLiquidation` | `src/hooks/useLiquidations.ts`       | Engagements valides sans liquidation                                                                                                                                       |
| `useUrgentLiquidations`         | `src/hooks/useUrgentLiquidations.ts` | Compteur urgences                                                                                                                                                          |
| `useLiquidationExport`          | `src/hooks/useLiquidationExport.ts`  | Export Excel, CSV, PDF, Attestation                                                                                                                                        |
| `useCanValidateLiquidation`     | `src/hooks/useDelegations.ts`        | Verification delegation                                                                                                                                                    |
| `computeEngagementProgress`     | Dans `useLiquidations`               | Calcul progression liquidation/engagement                                                                                                                                  |
| `requiresDgValidation(montant)` | Dans `useLiquidations`               | `true` si montant >= 50M FCFA                                                                                                                                              |

## 9. Tests

- **104 tests unitaires** + **60 tests E2E** Playwright
- **Certifie 100/100** — voir `docs/CERTIFICATION_LIQUIDATION.md`
- Verification : `npx vitest run --grep "liquidation"`
