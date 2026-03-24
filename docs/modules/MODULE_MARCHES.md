# Module Passation de Marche — SYGFP (Etape 5/9)

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Passation de Marche** gere le cycle complet d'un marche public : de la publication a la signature. Il suit un workflow en 7 etapes (brouillon > publie > cloture > en_evaluation > attribue > approuve > signe). Le module est **certifie 100/100** avec 94 tests unitaires et 66 tests E2E.

**Chaine** : Note SEF > Note AEF > Imputation > Expression Besoin > **Passation Marche** > Engagement > Liquidation > Ordonnancement > Reglement

## 2. Routes et acces

| Route                                       | Page                                         | Roles     |
| ------------------------------------------- | -------------------------------------------- | --------- |
| `/execution/passation-marche`               | Liste principale (KPIs, onglets, pagination) | Tous      |
| `/execution/passation-marche?sourceEB={id}` | Pre-selection EB source                      | Tous      |
| `/execution/passation-marche/approbation`   | Espace approbation DG                        | DG, ADMIN |

## 3. Composants

| Composant                    | Fichier                                                   | Role                                                 |
| ---------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `PassationMarchePage` (page) | `src/pages/execution/PassationMarche.tsx`                 | Page principale avec KPIs, onglets, pagination       |
| `PassationMarcheForm`        | `src/components/passation-marche/PassationMarcheForm.tsx` | Dialog creation (selection EB, mode passation, lots) |
| `PassationDetails`           | `src/components/passation-marche/PassationDetails.tsx`    | Sheet/Dialog detail avec workflow visuel             |
| `PassationApprobation`       | `src/pages/execution/PassationApprobation.tsx`            | Page dediee approbation DG                           |
| `NotesPagination`            | `src/components/shared/NotesPagination.tsx`               | Pagination serveur-side                              |
| `WorkflowStepIndicator`      | `src/components/workflow/WorkflowStepIndicator.tsx`       | Barre horizontale etape 5 active                     |

## 4. Boutons et actions

| Bouton              | Visible si                     | Action                                    | Effet                                                                              |
| ------------------- | ------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| Creer PM            | Onglet "A traiter", EB validee | Ouvre `PassationMarcheForm` pre-rempli    | Cree passation brouillon liee a l'EB                                               |
| Voir (oeil)         | Toute passation                | Ouvre `PassationDetails`                  | Consultation                                                                       |
| Publier             | PM brouillon, role DAAF        | `publishPassation(id)`                    | Passe en `publie`. Pre-requis : EB liee, mode passation, dates publication/cloture |
| Cloturer            | PM publiee, role DAAF          | `closePassation(id)`                      | Passe en `cloture`                                                                 |
| Evaluer             | PM cloturee, role DAAF         | `startEvaluationPassation(id)`            | Passe en `en_evaluation`                                                           |
| Attribuer           | PM en evaluation, role DAAF    | `proposeAttributionPassation(id, data)`   | Passe en `attribue`, propose attribution au prestataire                            |
| Approuver           | PM attribuee, role DG          | `approvePassation(id)`                    | Passe en `approuve`                                                                |
| Rejeter attribution | PM attribuee, role DG          | `rejectAttributionPassation(id, motif)`   | Retour en `en_evaluation` avec motif                                               |
| Signer              | PM approuvee, role DG          | `signPassation(id)`                       | Passe en `signe`, marche finalise                                                  |
| Modifier            | PM brouillon                   | Ouvre `PassationMarcheForm` edition       | Mise a jour                                                                        |
| Supprimer           | PM brouillon                   | `deletePassation(id)`                     | Suppression definitive                                                             |
| Creer engagement    | PM signee, menu contextuel     | Navigue vers `/engagements?sourcePM={id}` | Chaine vers etape suivante                                                         |
| Exporter > Excel    | Toujours                       | `exportExcel()`                           | Export .xlsx                                                                       |
| Exporter > PDF      | Toujours                       | `exportPDF()`                             | Export PDF                                                                         |
| Exporter > CSV      | Toujours                       | `exportCSV()`                             | Export CSV                                                                         |

## 5. Statuts et transitions

```
   ┌──────────┐  publier  ┌──────────┐  cloturer  ┌──────────┐  evaluer  ┌──────────────┐
   │ brouillon├─────────>│  publie  ├──────────>│ cloture  ├────────>│en_evaluation │
   └──────────┘          └──────────┘           └──────────┘         └──────┬───────┘
                                                                           │
                                                                  attribuer│
                                                                           v
                         ┌──────────┐  signer  ┌──────────┐  approuver  ┌──────────┐
                         │  signe  │<─────────│ approuve │<───────────│ attribue │
                         └──────────┘          └──────────┘            └────┬─────┘
                                                                           │
                                                              rejeter attr.│
                                                                           v
                                                                    en_evaluation
                                                                    (retour)
```

**Statuts lifecycle** : `brouillon` > `publie` > `cloture` > `en_evaluation` > `attribue` > `approuve` > `signe`
**Statuts legacy** : `soumis`, `en_analyse`, `valide`, `rejete`, `differe`

## 6. Workflow de validation

| Etape          | Role       | Action                          | Pre-requis                                                 |
| -------------- | ---------- | ------------------------------- | ---------------------------------------------------------- |
| 1. Creation    | Agent DAAF | Cree PM depuis EB validee       | EB `valide`                                                |
| 2. Publication | DAAF       | Publie le marche                | EB liee, mode passation, dates pub/cloture, lots si alloti |
| 3. Cloture     | DAAF       | Cloture reception offres        | Statut `publie`                                            |
| 4. Evaluation  | DAAF       | Demarre evaluation              | Statut `cloture`                                           |
| 5. Attribution | DAAF       | Propose attribution prestataire | Statut `en_evaluation`                                     |
| 6. Approbation | DG         | Approuve ou rejette attribution | Statut `attribue`                                          |
| 7. Signature   | DG         | Signe le marche                 | Statut `approuve`                                          |

**Modes de passation** : Appel d'offres ouvert, Appel d'offres restreint, Gre a gre, Consultation restreinte, etc. (definis dans `PROCEDURES_PASSATION` / `MODES_PASSATION`)

## 7. Donnees Supabase

| Table                | Colonnes cles                                                                                                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `passations_marche`  | `id`, `numero`, `objet`, `expression_besoin_id`, `mode_passation`, `montant_estime`, `montant_marche`, `date_publication`, `date_cloture`, `statut`, `allotissement`, `lots` (JSONB), `prestataire_id`, `motif_attribution`, `dossier_id`, `direction_id`, `exercice`, `created_by` |
| `expressions_besoin` | EB source liee via `expression_besoin_id`                                                                                                                                                                                                                                           |
| `prestataires`       | Prestataire attributaire                                                                                                                                                                                                                                                            |
| `directions`         | Direction demandeuse                                                                                                                                                                                                                                                                |

## 8. Hooks

| Hook                  | Fichier                                  | Role                                                                                                                                                                                                                    |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usePassationsMarche` | `src/hooks/usePassationsMarche.ts`       | Query paginee serveur + mutations : delete, publish, close, startEvaluation, proposeAttribution, approve, rejectAttribution, sign. Compteurs par statut. EB validees. Types `PassationMarche`, `EBValidee`, `LotMarche` |
| `usePassationExport`  | `src/hooks/usePassationExport.ts`        | Export Excel, PDF, CSV                                                                                                                                                                                                  |
| `exportPassationPDF`  | `src/services/passationExportService.ts` | Service export PDF unitaire                                                                                                                                                                                             |
| `canPublish(p)`       | Dans `usePassationsMarche`               | Verifie pre-requis publication                                                                                                                                                                                          |
| `canClose(p)`         | Dans `usePassationsMarche`               | Verifie pre-requis cloture                                                                                                                                                                                              |

## 9. Tests

- **94 tests unitaires** + **66 tests E2E** Playwright
- **Certifie 100/100** — voir `docs/CERTIFICATION_PASSATION_MARCHE.md`
- Verification : `npx vitest run --grep "passation"`
