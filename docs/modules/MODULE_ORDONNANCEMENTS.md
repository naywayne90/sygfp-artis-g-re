# Module Ordonnancements — SYGFP (Etape 8/9)

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Ordonnancement** emet les ordres de paiement a partir des liquidations validees. Il combine un workflow de **validation** (SAF > CB > DAF > DG) et un processus de **signature** (CB > DAF > DG ordonnateur > AC agent comptable). Un ordonnancement valide permet l'enregistrement d'un reglement.

**Chaine** : Note SEF > Note AEF > Imputation > Expression Besoin > Passation Marche > Engagement > Liquidation > **Ordonnancement** > Reglement

## 2. Routes et acces

| Route                                     | Page                             | Roles |
| ----------------------------------------- | -------------------------------- | ----- |
| `/ordonnancements`                        | Liste principale (KPIs, onglets) | Tous  |
| `/ordonnancements?sourceLiquidation={id}` | Pre-selection liquidation source | Tous  |

## 3. Composants

| Composant                 | Fichier                                                | Role                                                          |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `Ordonnancements` (page)  | `src/pages/Ordonnancements.tsx`                        | Page principale avec KPIs (5 cartes), onglets, recherche      |
| `OrdonnancementForm`      | `src/components/ordonnancement/OrdonnancementForm.tsx` | Dialog creation depuis liquidation validee                    |
| `OrdonnancementList`      | `src/components/ordonnancement/OrdonnancementList.tsx` | Tableau avec actions (filtre tous/a_valider/rejetes/differes) |
| `BudgetChainExportButton` | `src/components/export/BudgetChainExportButton.tsx`    | Export chaine budgetaire (step="ordonnancement")              |
| `WorkflowStepIndicator`   | `src/components/workflow/WorkflowStepIndicator.tsx`    | Barre horizontale etape 8 active                              |
| `ModuleHelp`              | `src/components/help/ModuleHelp.tsx`                   | Aide contextuelle                                             |

## 4. Boutons et actions

| Bouton                    | Visible si                                                                              | Action                                                                | Effet                                             |
| ------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| Nouvel ordonnancement     | `canWrite` (exercice ouvert)                                                            | Ouvre `OrdonnancementForm`                                            | Cree ordonnancement depuis liquidation validee    |
| Ordonnancer               | Onglet "A traiter", liquidation validee                                                 | Ouvre `OrdonnancementForm`                                            | Pre-rempli depuis la liquidation                  |
| Valider                   | Ordonnancement soumis/en_validation, permission `ordonnancement.validate` ou delegation | Via `OrdonnancementList`                                              | Workflow de validation multi-visas                |
| Voir details              | Tout ordonnancement                                                                     | Menu contextuel                                                       | Consultation                                      |
| Enregistrer reglement     | Ordonnancement valide, non solde                                                        | Menu contextuel, navigue vers `/reglements?sourceOrdonnancement={id}` | Chaine vers etape suivante                        |
| Solde                     | Ordonnancement valide, montant_paye >= montant                                          | Affiche (desactive)                                                   | Indicateur visuel                                 |
| Export chaine             | Toujours                                                                                | `BudgetChainExportButton`                                             | Export de la chaine budgetaire                    |
| Validation par delegation | Badge visible si delegation active                                                      | Indique delegation                                                    | Badge ambre "Validation par delegation du {role}" |

## 5. Statuts et transitions

```
   ┌──────────┐  soumettre  ┌──────────┐  valider  ┌──────────┐
   │ brouillon├────────────>│  soumis  ├─────────>│  valide  │
   └──────────┘             └────┬─────┘          └──────────┘
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

   soumis → workflow_status: en_validation (interne)
```

**Statuts** : `brouillon`, `soumis`, `valide`, `rejete`, `differe`
**Statut interne workflow** : `en_validation`

## 6. Workflow de validation

### Validation (4 etapes)

| Etape | Role | Label                                |
| ----- | ---- | ------------------------------------ |
| 1     | SAF  | Service Administratif et Financier   |
| 2     | CB   | Controleur Budgetaire                |
| 3     | DAF  | Directeur Administratif et Financier |
| 4     | DG   | Directeur General                    |

### Signature (4 etapes)

| Etape | Role | Label                                |
| ----- | ---- | ------------------------------------ |
| 1     | CB   | Controleur Budgetaire                |
| 2     | DAF  | Directeur Administratif et Financier |
| 3     | DG   | Directeur General (Ordonnateur)      |
| 4     | AC   | Agent Comptable                      |

**Delegation** : La validation peut etre effectuee par delegation via `useCanValidateOrdonnancement()`.

**Modes de paiement** : Virement bancaire, Cheque, Especes, Mobile Money.

## 7. Donnees Supabase

| Table             | Colonnes cles                                                                                                                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ordonnancements` | `id`, `numero`, `liquidation_id`, `beneficiaire`, `banque`, `rib`, `mode_paiement`, `montant`, `montant_paye`, `objet`, `statut`, `workflow_status`, `date_prevue_paiement`, `observation`, `is_locked`, `exercice`, `dossier_id`, `signatures` (JSONB), `created_by` |
| `liquidations`    | Liquidation source (statut `valide_dg`) — liee via `liquidation_id`                                                                                                                                                                                                   |

## 8. Hooks

| Hook                           | Fichier                                   | Role                                                                                                                                                                                |
| ------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useOrdonnancements`           | `src/hooks/useOrdonnancements.ts`         | Query + mutations + liquidations validees. Constants : VALIDATION_STEPS, SIGNATURE_STEPS, MODES_PAIEMENT. Types : OrdonnancementFormData, OrdonnancementAvailability, SignatureData |
| `useCanValidateOrdonnancement` | `src/hooks/useDelegations.ts`             | Verification delegation                                                                                                                                                             |
| `usePermissionCheck`           | `src/components/auth/PermissionGuard.tsx` | `canPerform('ordonnancement.validate')`                                                                                                                                             |
| `useExerciceWriteGuard`        | `src/hooks/useExerciceWriteGuard.ts`      | Guard ecriture exercice ouvert                                                                                                                                                      |

## 9. Tests

- Tests E2E via Playwright
- Module en production (legacy, en cours de modernisation)
- Verification : `npx vitest run`
