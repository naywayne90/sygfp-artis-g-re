# Module Reglements — SYGFP (Etape 9/9)

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Reglement** enregistre les paiements effectifs qui soldent les ordonnancements. C'est la derniere etape de la chaine de depense. Un ordonnancement peut etre regle en une ou plusieurs fois (paiements partiels). Le module inclut des filtres avances (periode, montant, mode de paiement, beneficiaire) et la generation de bordereaux de reglement.

**Chaine** : Note SEF > Note AEF > Imputation > Expression Besoin > Passation Marche > Engagement > Liquidation > Ordonnancement > **Reglement**

## 2. Routes et acces

| Route                                   | Page                                              | Roles |
| --------------------------------------- | ------------------------------------------------- | ----- |
| `/reglements`                           | Liste principale (KPIs, onglets, filtres avances) | Tous  |
| `/reglements?sourceOrdonnancement={id}` | Pre-selection ordonnancement source               | Tous  |

## 3. Composants

| Composant                 | Fichier                                             | Role                                                                   |
| ------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `Reglements` (page)       | `src/pages/Reglements.tsx`                          | Page principale avec KPIs, onglets, filtres avances, repartition modes |
| `ReglementForm`           | `src/components/reglement/ReglementForm.tsx`        | Dialog creation depuis ordonnancement valide                           |
| `ReglementList`           | `src/components/reglement/ReglementList.tsx`        | Tableau avec details                                                   |
| `ReglementDetails`        | `src/components/reglement/ReglementDetails.tsx`     | Sheet detail paiement                                                  |
| `BordereauReglement`      | `src/components/reglement/BordereauReglement.tsx`   | Generation bordereau de reglement (impression)                         |
| `BudgetChainExportButton` | `src/components/export/BudgetChainExportButton.tsx` | Export chaine budgetaire (step="reglement")                            |
| `WorkflowStepIndicator`   | `src/components/workflow/WorkflowStepIndicator.tsx` | Barre horizontale etape 9 active                                       |
| `ModuleHelp`              | `src/components/help/ModuleHelp.tsx`                | Aide contextuelle                                                      |

## 4. Boutons et actions

| Bouton                   | Visible si                                       | Action                         | Effet                                                            |
| ------------------------ | ------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------- |
| Enregistrer un reglement | `canWrite` + ordonnancements valides disponibles | Ouvre `ReglementForm`          | Cree un reglement                                                |
| Bordereau                | Toujours                                         | `BordereauReglement`           | Genere bordereau imprimable pour l'exercice                      |
| Export chaine            | Toujours                                         | `BudgetChainExportButton`      | Export chaine budgetaire                                         |
| Voir details             | Tout reglement                                   | `handleViewDetails(reglement)` | Ouvre `ReglementDetails`                                         |
| Filtres                  | Toujours                                         | Toggle panneau filtres avances | Filtre par periode, montant, statut, mode paiement, beneficiaire |
| Reinitialiser            | Filtres actifs                                   | `resetFilters()`               | Remet tous les filtres a zero                                    |

### Filtres avances

| Filtre        | Type            | Description                                  |
| ------------- | --------------- | -------------------------------------------- |
| Date debut    | Calendar picker | Filtre les reglements a partir de cette date |
| Date fin      | Calendar picker | Filtre les reglements jusqu'a cette date     |
| Montant min   | Input numerique | Montant minimum en FCFA                      |
| Montant max   | Input numerique | Montant maximum en FCFA                      |
| Statut        | Select          | Tous / Solde / Partiel / Rejete              |
| Mode paiement | Select          | Virement / Cheque / Especes / Mobile Money   |
| Beneficiaire  | Select          | Liste des beneficiaires uniques              |

## 5. Statuts et transitions

```
   ┌───────────────────┐  enregistrer  ┌──────────┐
   │ Ordonnancement    ├─────────────>│ Reglement│
   │ (valide, non solde)│              │ enregistre│
   └───────────────────┘              └──────────┘

   Un ordonnancement peut recevoir plusieurs reglements (partiels)
   jusqu'a ce que montant_paye >= montant → ordonnancement SOLDE

   Statuts reglement : enregistre, rejete
   Statuts ordonnancement apres reglement : partiel, solde
```

**Statuts reglement** : `enregistre`, `rejete`
**Types de renvoi (rejet)** : `engagement` (renvoi a l'engagement), `creation` (renvoi au debut)

## 6. Workflow de validation

| Etape             | Role            | Action                                                                        | Details                                 |
| ----------------- | --------------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| 1. Selection      | Tresorier/Agent | Selectionne ordonnancement valide non solde                                   | Verification : `montant_paye < montant` |
| 2. Saisie         | Tresorier/Agent | Remplit formulaire : date, mode, reference, compte ARTI, montant, observation | Montant <= restant a payer              |
| 3. Enregistrement | Systeme         | Cree reglement, met a jour `montant_paye` sur l'ordonnancement                | Si solde : `is_locked = true`           |

**Modes de paiement** :

- Virement bancaire (`virement`)
- Cheque (`cheque`)
- Especes (`especes`)
- Mobile Money (`mobile_money`)

**Comptes bancaires ARTI** : SGBCI (principal), BICICI (courant), ECOBANK (operations), BOA (tresorerie) — ou depuis table `comptes_bancaires`

**Documents requis** :

- Preuve de paiement (obligatoire)
- Bordereau de virement (optionnel)
- Copie du cheque (optionnel)
- Avis de credit bancaire (optionnel)

## 7. Donnees Supabase

| Table               | Colonnes cles                                                                                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reglements`        | `id`, `numero`, `ordonnancement_id`, `date_paiement`, `mode_paiement`, `reference_paiement`, `compte_bancaire_arti`, `compte_id`, `banque_arti`, `montant`, `observation`, `statut`, `exercice`, `dossier_id`, `created_by`, `created_at` |
| `ordonnancements`   | Ordonnancement source (statut `valide`) — champs `montant`, `montant_paye`, `is_locked`, `beneficiaire`, `banque`, `rib`, `mode_paiement`, `objet`                                                                                        |
| `comptes_bancaires` | `id`, `code`, `libelle`, `banque`, `numero_compte`, `iban`, `solde_actuel`, `est_actif`                                                                                                                                                   |

## 8. Hooks

| Hook                    | Fichier                              | Role                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useReglements`         | `src/hooks/useReglements.ts`         | Query + mutations + ordonnancementsValides + comptesBancaires + stats. Types : ReglementWithRelations, OrdonnancementValide, ReglementFormData, ReglementAvailability. Constants : MODES_PAIEMENT, DOCUMENTS_REGLEMENT, COMPTES_BANCAIRES_ARTI, RENVOI_TARGETS |
| `useExerciceWriteGuard` | `src/hooks/useExerciceWriteGuard.ts` | Guard ecriture exercice ouvert                                                                                                                                                                                                                                 |

## 9. Tests

- **138 tests E2E** via Playwright
- Module en production
- Verification : `npx vitest run` et `npx playwright test --grep "reglement"`
