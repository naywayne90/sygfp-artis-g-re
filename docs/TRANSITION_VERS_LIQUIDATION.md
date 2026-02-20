# TRANSITION VERS LIQUIDATION

**Date : 19 fevrier 2026**
**Prerequis : Module Engagement certifie 100/100**

---

## 1. Qu'est-ce que la Liquidation ?

La **Liquidation** est la constatation du **SERVICE FAIT** : le prestataire a livre ou execute la prestation prevue dans l'engagement. L'ordonnateur verifie la realite de la livraison et calcule le montant exact a payer apres deductions fiscales.

C'est l'etape **7** de la chaine de depense SYGFP :

```
SEF > AEF > Imputation > Expression Besoin > Passation > Engagement > LIQUIDATION > Ordonnancement > Reglement
```

Dans le cycle ELOP (Engagement-Liquidation-Ordonnancement-Paiement), la Liquidation est l'etape **2**.

## 2. Etat actuel du module Liquidation

Le module Liquidation est **deja existant** dans le codebase avec une base solide :

### Backend (Supabase)

| Element         | Detail                                             |
| --------------- | -------------------------------------------------- |
| Table           | `budget_liquidations` (41 colonnes)                |
| FK engagement   | `engagement_id` -> `budget_engagements(id)`        |
| Donnees migrees | 3,633 liquidations (source SQL Server)             |
| Statuts         | brouillon, soumis, valide, rejete, differe, annule |
| Workflow        | 4 etapes : SAF > CB > DAF > DG                     |
| Flag urgent     | `reglement_urgent` (boolean) + motif + date + par  |

### Frontend (React)

| Element        | Detail                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Hook principal | `useLiquidations.ts` (719 lignes)                                         |
| Hook urgent    | `useUrgentLiquidations.ts` (326 lignes)                                   |
| Page           | `Liquidations.tsx` (542 lignes)                                           |
| Composants     | 14 fichiers (11 liquidation + 3 urgent)                                   |
| Onglets        | 7 : A traiter, Toutes, A valider, Urgentes, Validees, Rejetees, Differees |

### Composants existants

| Fichier                         | Role                        |
| ------------------------------- | --------------------------- |
| `LiquidationForm.tsx`           | Formulaire creation/edition |
| `LiquidationDetails.tsx`        | Panneau detail avec onglets |
| `LiquidationList.tsx`           | Liste avec actions          |
| `LiquidationTimeline.tsx`       | Timeline workflow           |
| `LiquidationChecklist.tsx`      | Checklist documents         |
| `LiquidationValidateDialog.tsx` | Dialog validation           |
| `LiquidationRejectDialog.tsx`   | Dialog rejet                |
| `LiquidationDeferDialog.tsx`    | Dialog report               |
| `ServiceFaitForm.tsx`           | Formulaire service fait     |
| `ControleSdctForm.tsx`          | Controle SDCT               |
| `ValidationDgForm.tsx`          | Formulaire validation DG    |
| `UrgentLiquidationBadge.tsx`    | Badge urgence               |
| `UrgentLiquidationToggle.tsx`   | Toggle urgence              |
| `UrgentLiquidationList.tsx`     | Liste urgences              |

## 3. Schema budget_liquidations

### Colonnes principales

| Colonne         | Type      | Description                   |
| --------------- | --------- | ----------------------------- |
| `id`            | UUID      | Cle primaire                  |
| `engagement_id` | UUID (FK) | Lien vers l'engagement valide |
| `numero`        | text      | Reference (LIQ-2026-XXXX)     |
| `exercice`      | integer   | Annee budgetaire              |
| `montant`       | numeric   | Montant brut                  |
| `montant_ht`    | numeric   | Montant HT                    |
| `net_a_payer`   | numeric   | Montant net apres deductions  |

### Calcul fiscal

| Colonne                  | Taux par defaut | Description           |
| ------------------------ | --------------- | --------------------- |
| `tva_taux`               | 18%             | Taux TVA              |
| `tva_montant`            | auto            | Montant TVA           |
| `airsi_taux`             | variable        | Acompte impot (AIRSI) |
| `airsi_montant`          | auto            | Montant AIRSI         |
| `retenue_source_taux`    | variable        | Retenue a la source   |
| `retenue_source_montant` | auto            | Montant retenue       |

**Formule : NetAPayer = Montant - AIRSI - Retenue_Source** (TVA incluse dans le montant)

### Service fait

| Colonne                     | Type    | Description            |
| --------------------------- | ------- | ---------------------- |
| `service_fait`              | boolean | Service execute ?      |
| `service_fait_date`         | date    | Date de constatation   |
| `service_fait_certifie_par` | UUID    | Certificateur          |
| `reference_facture`         | text    | N° facture fournisseur |
| `regime_fiscal`             | text    | reel, simplifie, etc.  |

### Reglement urgent (exigence TOURE 03/02/2026)

| Colonne                  | Type        | Description              |
| ------------------------ | ----------- | ------------------------ |
| `reglement_urgent`       | boolean     | Flag urgence             |
| `reglement_urgent_motif` | text        | Motif de l'urgence       |
| `reglement_urgent_date`  | timestamptz | Date marquage urgent     |
| `reglement_urgent_par`   | UUID        | Utilisateur ayant marque |

### Workflow

| Colonne                 | Type                  | Description                             |
| ----------------------- | --------------------- | --------------------------------------- |
| `statut`                | text                  | brouillon/soumis/valide/rejete/differe  |
| `workflow_status`       | text                  | en_attente/en_validation/termine/rejete |
| `current_step`          | integer               | 0-4 (etape courante)                    |
| `submitted_at`          | timestamptz           | Date soumission                         |
| `validated_at/by`       | timestamptz/UUID      | Validation finale                       |
| `rejected_at/by/reason` | timestamptz/UUID/text | Rejet                                   |

## 4. Interfaces TypeScript existantes

```typescript
interface Liquidation {
  id: string;
  engagement_id: string;
  numero: string;
  montant: number;
  montant_ht: number | null;
  net_a_payer: number | null;
  tva_taux: number | null;
  tva_montant: number | null;
  airsi_taux: number | null;
  airsi_montant: number | null;
  retenue_source_taux: number | null;
  retenue_source_montant: number | null;
  service_fait: boolean | null;
  service_fait_date: string | null;
  reference_facture: string | null;
  regime_fiscal: string | null;
  statut: string | null;
  workflow_status: string | null;
  current_step: number | null;
  exercice: number | null;
  // ... + champs workflow, audit, relations
  engagement?: { id; numero; objet; montant; fournisseur; budget_line; marche };
}

interface LiquidationAvailability {
  montant_engage: number;
  liquidations_anterieures: number;
  liquidation_actuelle: number;
  cumul: number;
  restant_a_liquider: number;
  is_valid: boolean;
}
```

## 5. Mutations existantes dans useLiquidations

| Mutation                | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `createLiquidation`     | Creer une liquidation a partir d'un engagement valide |
| `submitLiquidation`     | Soumettre pour validation                             |
| `validateLiquidation`   | Viser/valider (SAF/CB/DAF/DG)                         |
| `rejectLiquidation`     | Rejeter avec motif                                    |
| `deferLiquidation`      | Reporter avec motif et deadline                       |
| `resumeLiquidation`     | Reprendre une liquidation reportee                    |
| `calculateAvailability` | Calculer le restant a liquider                        |

## 6. Recommandations pour les 15 prochains prompts Liquidation

### Phase 1 : Audit et diagnostic (Prompts 1-3)

| Prompt | Objectif                                                              |
| ------ | --------------------------------------------------------------------- |
| 1      | Audit complet : code existant, hook, DB, triggers, RLS                |
| 2      | Diagnostic : calcul fiscal (TVA/AIRSI/retenue), service fait workflow |
| 3      | Fix build/TS/console si necessaire                                    |

### Phase 2 : Fonctionnalites coeur (Prompts 4-8)

| Prompt | Objectif                                                         |
| ------ | ---------------------------------------------------------------- |
| 4      | Lien FK engagement valide → liquidation, pre-remplissage         |
| 5      | Calcul fiscal temps reel (NetAPayer = Montant - AIRSI - Retenue) |
| 6      | Validation 4 etapes SAF > CB > DAF > DG                          |
| 7      | Detail 5 onglets + attestation service fait PDF                  |
| 8      | Reglement urgent (flag TOURE) + liste urgences prioritaires      |

### Phase 3 : Fonctionnalites avancees (Prompts 9-12)

| Prompt | Objectif                                                          |
| ------ | ----------------------------------------------------------------- |
| 9      | Export Excel + suivi liquidation par engagement                   |
| 10     | RLS + performance + pagination                                    |
| 11     | Alertes (liquidation en retard, deadlines, urgences non traitees) |
| 12     | Navigation chaine Engagement ↔ Liquidation ↔ Ordonnancement       |

### Phase 4 : Tests et certification (Prompts 13-15)

| Prompt | Objectif                                                                 |
| ------ | ------------------------------------------------------------------------ |
| 13     | Liquidation partielle / multiple (plusieurs liquidations par engagement) |
| 14     | 60 tests Playwright massifs                                              |
| 15     | Certification + transition Ordonnancement                                |

### Points d'attention specifiques

1. **Cumul des liquidations** : Un engagement peut avoir PLUSIEURS liquidations (partielles). Le cumul ne doit jamais depasser le montant engage.

2. **Service fait obligatoire** : La liquidation ne peut etre soumise que si `service_fait = true` avec date et certificateur.

3. **Regime fiscal** : Le calcul AIRSI/retenue depend du regime fiscal du prestataire (reel, simplifie, etc.).

4. **Reglement urgent** : Exigence TOURE du 03/02/2026. Les liquidations urgentes doivent etre visibles en priorite dans la file de validation.

5. **Coherence avec Engagement** : La liquidation doit verifier que l'engagement source est `valide` et que le cumul (liquidations anterieures + actuelle) <= montant engage.

6. **Impact budget** : La liquidation validee impacte `budget_lines.total_liquide` (a verifier/creer si necessaire).

## 7. Chaine apres certification Liquidation

```
CERTIFIE Structure Budgetaire (8 prompts)
CERTIFIE Notes SEF (8 prompts)
CERTIFIE Notes AEF (8 prompts)
CERTIFIE Imputation (10 prompts)
CERTIFIE Expression de Besoin (10 prompts)
CERTIFIE Passation / Marche (15 prompts)
CERTIFIE ENGAGEMENT (15 prompts — impact budget, 4 visas, degagement)
EN COURS  Liquidation (15 prompts — service fait, NetAPayer, AIRSI, TVA)
A VENIR   Ordonnancement (10 prompts — ordre de payer)
A VENIR   Reglement (10 prompts — paiement effectif, flag urgent TOURE)
```

---

**MODULE ENGAGEMENT CERTIFIE — PRET POUR LIQUIDATION**
