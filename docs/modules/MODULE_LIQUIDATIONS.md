# Module Liquidations — SYGFP (Etape 7/9)

> Derniere mise a jour : 05/04/2026

## 1. Vue d'ensemble

Le module **Liquidation** constate le service fait et determine le montant exact a payer. Il recoit les Engagements valides et certifie la realisation de la prestation. Le workflow de validation comporte 3 etapes : **DAAF** puis **CB** (Controleur Budgetaire) puis **DG** (conditionnel au-dela de 50 000 000 FCFA). Le module est **certifie 100/100** avec 104+ tests unitaires et 60 tests E2E.

**Chaine** : Note SEF > Note AEF > Imputation > Expression Besoin > Passation Marche > Engagement > **Liquidation** > Ordonnancement > Reglement

## Codification ARTI

| Propriété                  | Valeur                                              |
| -------------------------- | --------------------------------------------------- |
| **Code étape**             | 6 (06 en format 14 chars)                           |
| **Sigle**                  | LIQ                                                 |
| **Format référence cible** | `ARTI06MMYYNNNN` (14 chars)                         |
| **Exemple**                | `ARTI0602260001` = Liquidation n°1, février 2026    |
| **Format actuel**          | `LIQ-2026-NNNN` (via `get_next_sequence('LIQ')`)    |
| **Colonne DB**             | `budget_liquidations.numero`                        |
| **Migration**              | Alignement vers format ARTI planifié                |
| **Données migrées**        | 3,443 liquidations avec flag `legacy_import = true` |

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
| `LiquidationDetails`        | `src/components/liquidation/LiquidationDetails.tsx`        | Sheet detail (6 onglets)                                                         |
| `LiquidationValidationDAAF` | `src/components/liquidation/LiquidationValidationDAAF.tsx` | Dashboard validation DAAF                                                        |
| `LiquidationValidateDialog` | `src/components/liquidation/LiquidationValidateDialog.tsx` | Dialog de validation                                                             |
| `LiquidationRejectDialog`   | `src/components/liquidation/LiquidationRejectDialog.tsx`   | Dialog de rejet avec motif                                                       |
| `LiquidationDeferDialog`    | `src/components/liquidation/LiquidationDeferDialog.tsx`    | Dialog de report                                                                 |
| `PiecesJustificativesRGCP`  | `src/components/liquidation/PiecesJustificativesRGCP.tsx`  | Checklist dynamique RGCP par type de depense                                     |
| `PenalitesRetardCard`       | `src/components/liquidation/PenalitesRetardCard.tsx`       | Calcul penalites de retard (DGP, interets moratoires)                            |
| `UrgentLiquidationList`     | `src/components/liquidations/UrgentLiquidationList.tsx`    | Liste liquidations urgentes                                                      |
| `BudgetChainExportButton`   | `src/components/export/BudgetChainExportButton.tsx`        | Export chaine budgetaire                                                         |
| `WorkflowStepIndicator`     | `src/components/workflow/WorkflowStepIndicator.tsx`        | Barre horizontale etape 7 active                                                 |
| `NotesPagination`           | `src/components/shared/NotesPagination.tsx`                | Pagination serveur-side                                                          |

## 4. Boutons et actions

| Bouton                 | Visible si                                       | Action                                                 | Effet                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------- |
| Nouvelle liquidation   | Engagement valide disponible                     | Ouvre `LiquidationForm`                                | Cree liquidation en brouillon                |
| Soumettre              | Liquidation brouillon                            | `submitLiquidation(id)`                                | Passe en `soumis`                            |
| Valider DAAF           | Liquidation soumise, role DAAF                   | `validateLiquidation(id)`                              | Passe en `validé_daaf`                       |
| Visa CB                | Liquidation `validé_daaf`, role CB               | `validateLiquidation(id)`                              | Passe en `validé_cf`                         |
| Valider DG             | Liquidation `validé_cf`, role DG, montant >= 50M | `validateLiquidation(id)`                              | Passe en `validé_dg`                         |
| Rejeter                | En validation, role concerne                     | Ouvre `LiquidationRejectDialog`                        | Passe en `rejete`, motif obligatoire         |
| Differer               | En validation, role concerne                     | Ouvre `LiquidationDeferDialog`                         | Passe en `differe`                           |
| Reprendre              | Liquidation differee                             | `resumeLiquidation(id)`                                | Re-soumet                                    |
| Voir detail            | Toute liquidation                                | Ouvre `LiquidationDetails`                             | Consultation                                 |
| Filtre urgent          | Toujours                                         | Switch `urgentOnlyFilter`                              | Affiche uniquement les liquidations urgentes |
| Exporter > Excel       | Toujours                                         | `exportExcel()`                                        | Export .xlsx                                 |
| Exporter > CSV         | Toujours                                         | `exportCSV()`                                          | Export CSV                                   |
| Exporter > PDF         | Toujours                                         | `exportPDF()`                                          | Export PDF                                   |
| Exporter > Attestation | Liquidation validee                              | `exportAttestation()`                                  | Attestation de service fait                  |
| Creer ordonnancement   | Liquidation validee DG, menu contextuel          | Navigue vers `/ordonnancements?sourceLiquidation={id}` | Chaine vers etape suivante                   |

## 5. Statuts et transitions

```
   ┌──────────┐  soumettre  ┌──────────┐  valider DAAF  ┌────────────┐  visa CB  ┌───────────┐  valider DG  ┌───────────┐
   │ brouillon├────────────>│  soumis  ├──────────────>│ validé_daaf├────────>│ validé_cf ├────────────>│ validé_dg │
   └──────────┘             └────┬─────┘               └─────┬──────┘        └─────┬─────┘            └───────────┘
                                 │                           │                     │
                          rejeter│  differer          rejeter│  differer    rejeter│  differer
                                 │       │                   │       │             │       │
                           ┌─────v───┐   │             ┌────v────┐  │       ┌────v────┐  │
                           │ rejete  │   │             │ rejete  │  │       │ rejete  │  │
                           └─────────┘   │             └─────────┘  │       └─────────┘  │
                                         v                          v                     v
                                   ┌──────────┐              ┌──────────┐          ┌──────────┐
                                   │ differe  │              │ differe  │          │ differe  │
                                   └──────────┘              └──────────┘          └──────────┘

   Note: Si montant < 50 000 000 FCFA, la validation DG est optionnelle (skip apres visa CB)
```

**Statuts** : `brouillon`, `soumis`, `validé_daaf`, `validé_cf`, `validé_dg`, `rejete`, `differe`, `annule`
**Seuil validation DG** : `SEUIL_VALIDATION_DG = 50 000 000 FCFA`

## 6. Workflow de validation

| Etape                             | Role       | Statut        | Details                                                                |
| --------------------------------- | ---------- | ------------- | ---------------------------------------------------------------------- |
| 1. Creation                       | Agent/SDCT | `brouillon`   | Certification service fait, montant, pieces justificatives             |
| 2. Soumission                     | Createur   | `soumis`      | Demarre validation                                                     |
| 3. Validation DAAF                | DAAF       | `validé_daaf` | Visa `visa_daaf_user_id`, `visa_daaf_date`, `visa_daaf_commentaire`    |
| 4. Visa Controleur Budgetaire     | CB         | `validé_cf`   | Visa `visa_cf_user_id`, `visa_cf_date`, `visa_cf_commentaire`          |
| 5. Validation DG (conditionnelle) | DG         | `validé_dg`   | Requise si montant >= 50M FCFA. Visa `visa_dg_user_id`, `visa_dg_date` |

**Constante `VALIDATION_STEPS`** (3 etapes) :

| Ordre | Role | Label                                | Statut sortie | Visa prefix |
| ----- | ---- | ------------------------------------ | ------------- | ----------- |
| 1     | DAAF | Directeur Administratif et Financier | `validé_daaf` | `visa_daaf` |
| 2     | CB   | Controleur Budgetaire                | `validé_cf`   | `visa_cf`   |
| 3     | DG   | Directeur General                    | `validé_dg`   | `visa_dg`   |

**Delegation** : La validation peut etre effectuee par delegation via `useCanValidateLiquidation()`.

**Etapes simplifiees du workflow** (`VALIDATION_FLOW_STEPS`) :

1. Certifie SF — role AUTEUR/SDCT
2. Validation DAAF — role DAAF
3. Visa CB — role CB (Controleur Budgetaire)
4. Validation DG — role DG (conditionnel si montant >= 50M)

## 6b. Checklist pieces justificatives RGCP

Le composant `PiecesJustificativesRGCP` affiche une checklist dynamique des pieces requises selon le type de depense (croisement `type_engagement` × `type_marche`), base sur le RGCP (UEMOA) et le Code des Marches Publics de Cote d'Ivoire (Decret 2009-259).

**5 types de depense configures** (`src/lib/config/rgcp-pieces-config.ts`) :

| Type                        | Cle                                  | Pieces obligatoires |
| --------------------------- | ------------------------------------ | ------------------- |
| Marche — Fournitures        | `marche_fourniture`                  | 5                   |
| Marche — Services           | `marche_services`                    | 4                   |
| Marche — Travaux            | `marche_travaux`                     | 5                   |
| Marche — Prestations intel. | `marche_prestations_intellectuelles` | 5                   |
| Hors marche                 | `hors_marche`                        | 3                   |

## 6c. Penalites de retard et Delai Global de Paiement

Le composant `PenalitesRetardCard` calcule automatiquement :

- **Delai Global de Paiement (DGP)** : 30 jours (< 30M FCFA) ou 45 jours (>= 30M FCFA) — ref. Code des Marches Publics art. 132, 138, 142
- **Jours ecoulees** depuis creation de la liquidation
- **Interets moratoires** : taux directeur BCEAO (3,5%) + 1% = 4,5% annuel, appliques sur le montant TTC par jour de retard
- **Statut visuel** : vert (dans les delais), orange (approche), rouge (depasse)

## 7. Donnees Supabase

| Table                      | Colonnes cles                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `budget_liquidations`      | `id`, `numero`, `engagement_id`, `montant`, `montant_service_fait`, `objet`, `date_service_fait`, `statut`, `exercice`, `dossier_id`, `direction_id`, `is_urgent`, `tranche_numero`, `tranche_libelle`, `visa_daaf_user_id/date/commentaire`, `visa_cf_user_id/date/commentaire`, `visa_dg_user_id/date/commentaire`, `rejection_reason`, `rejected_by`, `motif_differe`, `differe_by`, `submitted_at`, `created_by` |
| `budget_engagements`       | Engagement source (statut `valide`) — lie via `engagement_id`                                                                                                                                                                                                                                                                                                                                                        |
| `liquidation_counts` (vue) | `brouillon`, `soumis`, `valide_daaf`, `valide_cf`, `valide_dg`, `rejete`, `differe`, `service_fait`, `total_montant`, `a_valider`                                                                                                                                                                                                                                                                                    |

## 8. Hooks

| Hook                            | Fichier                                | Role                                                                                                                                                          |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useLiquidations`               | `src/hooks/useLiquidations.ts`         | Query paginee serveur + mutations : submit, validate, reject, defer, resume. Constants : VALIDATION_STEPS (3), SEUIL_VALIDATION_DG, VALIDATION_FLOW_STEPS (4) |
| `useLiquidationCounts`          | `src/hooks/useLiquidations.ts`         | Compteurs par statut (incluant `valide_cf`)                                                                                                                   |
| `useLiquidationLight`           | `src/hooks/useLiquidations.ts`         | Donnees legeres pour dashboard                                                                                                                                |
| `useOverdueUrgentLiquidations`  | `src/hooks/useLiquidations.ts`         | Liquidations urgentes en retard                                                                                                                               |
| `useEngagementsSansLiquidation` | `src/hooks/useLiquidations.ts`         | Engagements valides sans liquidation                                                                                                                          |
| `useLiquidationDocuments`       | `src/hooks/useLiquidationDocuments.ts` | Documents de la liquidation (pour checklist RGCP)                                                                                                             |
| `useUrgentLiquidations`         | `src/hooks/useUrgentLiquidations.ts`   | Compteur urgences                                                                                                                                             |
| `useLiquidationExport`          | `src/hooks/useLiquidationExport.ts`    | Export Excel, CSV, PDF, Attestation                                                                                                                           |
| `useCanValidateLiquidation`     | `src/hooks/useDelegations.ts`          | Verification delegation                                                                                                                                       |
| `computeEngagementProgress`     | Dans `useLiquidations`                 | Calcul progression liquidation/engagement                                                                                                                     |
| `requiresDgValidation(montant)` | Dans `useLiquidations`                 | `true` si montant >= 50M FCFA                                                                                                                                 |

## 9. Onglets de la page Liquidations

| Onglet          | Filtre statut                            | Description                    |
| --------------- | ---------------------------------------- | ------------------------------ |
| A traiter       | Engagements sans liquidation             | Engagements valides en attente |
| Toutes          | Tous statuts                             | Toutes les liquidations        |
| A valider       | `soumis`, `validé_daaf`, `validé_cf`     | En cours de validation         |
| Validation DAAF | `soumis`, `validé_daaf`, `validé_cf`     | Etape DAAF                     |
| Visa CB         | `validé_daaf`                            | Etape Controleur Budgetaire    |
| Urgentes        | `reglement_urgent = true` + statut actif | Liquidations urgentes          |
| Validees        | `validé_dg`                              | Validation terminee            |
| Rejetees        | `rejete`                                 | Liquidations rejetees          |
| Differees       | `differe`                                | Liquidations differees         |

## 10. Tests

- **795+ tests unitaires** (dont 104+ liquidation) + **60 tests E2E** Playwright
- **Certifie 100/100** — voir `docs/CERTIFICATION_LIQUIDATION.md`
- Verification : `npx vitest run --grep "liquidation"`
