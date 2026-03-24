# Module Engagements — SYGFP (Etape 6/9)

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Engagement** enregistre l'engagement juridique de la depense. Il recoit les Passations de Marche signees et cree un engagement budgetaire avec un workflow de validation a **4 visas successifs** : SAF > CB > DAAF > DG. L'engagement valide permet la creation de Liquidations. Le module est **certifie 100/100** avec 231 tests unitaires et 60 tests E2E.

**Chaine** : Note SEF > Note AEF > Imputation > Expression Besoin > Passation Marche > **Engagement** > Liquidation > Ordonnancement > Reglement

## 2. Routes et acces

| Route                        | Page                                                           | Roles |
| ---------------------------- | -------------------------------------------------------------- | ----- |
| `/engagements`               | Liste principale (KPIs, onglets, suivi budgetaire, pagination) | Tous  |
| `/engagements?sourcePM={id}` | Pre-selection passation source                                 | Tous  |
| `/engagements?detail={id}`   | Ouverture detail auto (chain nav depuis Liquidation)           | Tous  |

## 3. Composants

| Composant                    | Fichier                                                    | Role                                                             |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `Engagements` (page)         | `src/pages/Engagements.tsx`                                | Page principale avec KPIs, onglets, suivi budgetaire, pagination |
| `EngagementForm`             | `src/components/engagement/EngagementForm.tsx`             | Dialog creation depuis PM signee                                 |
| `EngagementList`             | `src/components/engagement/EngagementList.tsx`             | Tableau avec actions contextuelles                               |
| `EngagementDetails`          | `src/components/engagement/EngagementDetails.tsx`          | Sheet detail avec visas, historique                              |
| `EngagementValidateDialog`   | `src/components/engagement/EngagementValidateDialog.tsx`   | Dialog de validation (visa avec commentaire)                     |
| `EngagementRejectDialog`     | `src/components/engagement/EngagementRejectDialog.tsx`     | Dialog de rejet avec motif                                       |
| `EngagementDeferDialog`      | `src/components/engagement/EngagementDeferDialog.tsx`      | Dialog de report                                                 |
| `EngagementDegageDialog`     | `src/components/engagement/EngagementDegageDialog.tsx`     | Dialog de degagement (liberation credit)                         |
| `EngagementPrintDialog`      | `src/components/engagement/EngagementPrintDialog.tsx`      | Dialog impression                                                |
| `SuiviBudgetaireEngagements` | `src/components/engagement/SuiviBudgetaireEngagements.tsx` | Tableau suivi budgetaire                                         |
| `IndicateurBudget`           | `src/components/engagement/IndicateurBudget.tsx`           | Taux execution colore                                            |
| `PermissionGuard`            | `src/components/auth/PermissionGuard.tsx`                  | Guard composant permissions                                      |
| `WorkflowStepIndicator`      | `src/components/workflow/WorkflowStepIndicator.tsx`        | Barre horizontale etape 6 active                                 |

## 4. Boutons et actions

| Bouton            | Visible si                                                                   | Action                                             | Effet                                                         |
| ----------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| Nouvel engagement | PM signee disponible + exercice ouvert                                       | Ouvre `EngagementForm`                             | Cree engagement brouillon                                     |
| Soumettre         | Engagement brouillon                                                         | `submitEngagement(id)`                             | Passe en `soumis`, demarre workflow 4 visas                   |
| Valider (visa)    | Statut = etape du role (soumis→SAF, visa_saf→CB, visa_cb→DAAF, visa_daaf→DG) | Ouvre `EngagementValidateDialog`                   | Appose visa, passe au statut suivant                          |
| Rejeter           | En validation, role concerne                                                 | Ouvre `EngagementRejectDialog`                     | Passe en `rejete`, motif obligatoire                          |
| Differer          | En validation, role concerne                                                 | Ouvre `EngagementDeferDialog`                      | Passe en `differe`                                            |
| Reprendre         | Engagement differe                                                           | `resumeEngagement(id)`                             | Re-soumet                                                     |
| Degager           | Engagement valide, role DAAF/DAF/DG/ADMIN                                    | Ouvre `EngagementDegageDialog`                     | `degageEngagement(id, montant)` — liberation partielle credit |
| Imprimer          | Engagement valide                                                            | Ouvre `EngagementPrintDialog`                      | Impression officielle                                         |
| Creer liquidation | Engagement valide, menu contextuel                                           | Navigue vers `/liquidations?sourceEngagement={id}` | Chaine vers etape suivante                                    |
| Voir detail       | Tout engagement                                                              | Ouvre `EngagementDetails`                          | Consultation                                                  |
| Exporter > Excel  | Toujours                                                                     | `exportExcel()`                                    | Export .xlsx                                                  |
| Exporter > CSV    | Toujours                                                                     | `exportCSV()`                                      | Export CSV                                                    |
| Exporter > PDF    | Toujours                                                                     | `exportPDF()`                                      | Export PDF                                                    |

## 5. Statuts et transitions

```
   ┌──────────┐  soumettre  ┌──────────┐  visa SAF  ┌──────────┐  visa CB  ┌──────────┐
   │ brouillon├────────────>│  soumis  ├──────────>│ visa_saf ├────────>│ visa_cb  │
   └──────────┘             └────┬─────┘           └────┬─────┘         └────┬─────┘
                                 │                      │                    │
                          rejeter│               rejeter│             rejeter│
                          differer                differer              differer
                                 │                      │                    │
                                 v                      v                    v
                            rejete/differe         rejete/differe       rejete/differe

   ┌──────────┐  visa DAAF  ┌───────────┐  visa DG  ┌──────────┐
   │ visa_cb  ├───────────>│ visa_daaf ├─────────>│  valide  │
   └──────────┘            └─────┬─────┘          └────┬─────┘
                                 │                     │
                          rejeter│               degager│
                          differer                      │
                                 v                      v
                            rejete/differe          degage (partiel)
```

**Statuts** : `brouillon`, `soumis`, `visa_saf`, `visa_cb`, `visa_daaf`, `valide`, `rejete`, `differe`, `degage`
**Statuts de validation** : `soumis`, `visa_saf`, `visa_cb`, `visa_daaf`

## 6. Workflow de validation (4 visas)

| Etape | Role                                       | Statut avant | Statut apres | Champ visa                                                     |
| ----- | ------------------------------------------ | ------------ | ------------ | -------------------------------------------------------------- |
| 1     | SAF (Service Administratif et Financier)   | `soumis`     | `visa_saf`   | `visa_saf_user_id`, `visa_saf_date`, `visa_saf_commentaire`    |
| 2     | CB (Controleur Budgetaire)                 | `visa_saf`   | `visa_cb`    | `visa_cb_user_id`, `visa_cb_date`, `visa_cb_commentaire`       |
| 3     | DAF (Directeur Administratif et Financier) | `visa_cb`    | `visa_daaf`  | `visa_daaf_user_id`, `visa_daaf_date`, `visa_daaf_commentaire` |
| 4     | DG (Directeur General)                     | `visa_daaf`  | `valide`     | `visa_dg_user_id`, `visa_dg_date`, `visa_dg_commentaire`       |

**Delegation** : La validation peut etre effectuee par delegation via `useCanValidateEngagement()` (hook `useDelegations`).

**Filtrage par direction** : Les roles centraux (ADMIN, DG, DAAF, DAF, CB, TRESORERIE, AUDITEUR) voient tous les engagements. Les agents voient uniquement ceux de leur direction.

## 7. Donnees Supabase

| Table                | Colonnes cles                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `budget_engagements` | `id`, `numero`, `objet`, `montant`, `fournisseur`, `budget_line_id`, `passation_marche_id`, `dossier_id`, `direction_id`, `statut`, `exercice`, `visa_saf_user_id/date/commentaire`, `visa_cb_user_id/date/commentaire`, `visa_daaf_user_id/date/commentaire`, `visa_dg_user_id/date/commentaire`, `rejection_reason`, `rejected_by`, `rejected_at`, `differe_motif`, `differe_by`, `differe_at`, `degage_montant`, `degage_by`, `degage_at`, `submitted_at`, `created_by` |
| `passations_marche`  | PM source (statut `signe`) — liee via `passation_marche_id`                                                                                                                                                                                                                                                                                                                                                                                                                |
| `budget_lines`       | Ligne budgetaire + suivi dotation/engage                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## 8. Hooks

| Hook                          | Fichier                                   | Role                                                                                                                                                                   |
| ----------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useEngagements`              | `src/hooks/useEngagements.ts`             | Query + mutations : submit, validate, reject, defer, resume, degage. Listes filtrees par statut. Passations validees. Constants : VALIDATION_STEPS, VALIDATION_STATUTS |
| `useEngagementExport`         | `src/hooks/useEngagementExport.ts`        | Export Excel, CSV, PDF                                                                                                                                                 |
| `useCanValidateEngagement`    | `src/hooks/useDelegations.ts`             | Verification delegation pour validation                                                                                                                                |
| `usePermissionCheck`          | `src/components/auth/PermissionGuard.tsx` | `canPerform('engagement.validate')`, `canPerform('engagement.reject')`, etc.                                                                                           |
| `checkEngagementCompleteness` | Dans `useEngagements`                     | Verifie completude : objet, montant, fournisseur, ligne budgetaire                                                                                                     |
| `getStepFromStatut`           | Dans `useEngagements`                     | Retourne le numero d'etape (1-4) depuis le statut                                                                                                                      |

## 9. Tests

- **231 tests unitaires** + **60 tests E2E** Playwright
- **Certifie 100/100** — voir `docs/CERTIFICATION_ENGAGEMENT.md`
- Verification : `npx vitest run --grep "engagement"`
