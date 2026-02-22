# TRANSITION VERS LIQUIDATION

**Date :** 20 fevrier 2026
**Prerequis :** Module Engagement certifie 100/100 (231 unit + 60 E2E, 600 tests projet)

---

## 1. Qu'est-ce que la Liquidation ?

La **Liquidation** est la constatation du **SERVICE FAIT** : le prestataire a livre ou execute la prestation prevue dans l'engagement. L'ordonnateur verifie la realite de la livraison et calcule le montant exact a payer apres deductions fiscales.

C'est l'etape **7** de la chaine de depense SYGFP :

```
SEF > AEF > Imputation > Expression Besoin > Passation > Engagement > LIQUIDATION > Ordonnancement > Reglement
```

Dans le cycle ELOP (Engagement-Liquidation-Ordonnancement-Paiement), la Liquidation est l'etape **2**.

### Difference avec l'Engagement

| Aspect       | Engagement                         | Liquidation                              |
| ------------ | ---------------------------------- | ---------------------------------------- |
| Quoi         | Reservation de credits budgetaires | Constatation du service fait             |
| Quand        | Avant la livraison/prestation      | Apres la livraison/prestation            |
| Calcul       | Montant brut (HT + TVA)            | Net a payer (apres AIRSI + retenues)     |
| Impact       | `budget_lines.total_engage`        | `budget_lines.total_liquide`             |
| Multiplicite | 1 engagement = 1 operation         | N liquidations partielles par engagement |
| Document     | Bon d'engagement                   | Attestation de service fait              |

---

## 2. Etat actuel du module Liquidation

Le module Liquidation est **deja existant** dans le codebase avec une base solide :

### Backend (Supabase)

| Element         | Detail                                             |
| --------------- | -------------------------------------------------- |
| Table           | `budget_liquidations` (41+ colonnes)               |
| FK engagement   | `engagement_id` → `budget_engagements(id)`         |
| Donnees migrees | 3,633 liquidations (source SQL Server)             |
| Statuts         | brouillon, soumis, valide, rejete, differe, annule |
| Workflow        | 4 etapes : SAF > CB > DAF > DG                     |
| Flag urgent     | `reglement_urgent` (boolean) + motif + date + par  |
| RLS             | 3 policies (SELECT/INSERT/UPDATE) + 7 indexes      |

### Frontend (React)

| Element        | Detail                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Hook principal | `useLiquidations.ts` (1,125 lignes)                                       |
| Page           | `Liquidations.tsx` (460 lignes)                                           |
| Composants     | 14 fichiers (11 liquidation + 3 urgent)                                   |
| Onglets page   | 7 : A traiter, Toutes, A valider, Urgentes, Validees, Rejetees, Differees |

### Composants existants (14)

| Fichier                         | Lignes | Role                        |
| ------------------------------- | ------ | --------------------------- |
| `LiquidationForm.tsx`           | ~450   | Formulaire creation/edition |
| `LiquidationDetails.tsx`        | 533    | Panneau detail avec onglets |
| `LiquidationList.tsx`           | 254    | Liste avec actions          |
| `LiquidationChainNav.tsx`       | ~90    | Chaine PM > ENG > LIQ > ORD |
| `LiquidationTimeline.tsx`       | —      | Timeline workflow           |
| `LiquidationChecklist.tsx`      | —      | Checklist documents         |
| `LiquidationValidateDialog.tsx` | ~55    | Dialog validation           |
| `LiquidationRejectDialog.tsx`   | —      | Dialog rejet                |
| `LiquidationDeferDialog.tsx`    | —      | Dialog report               |
| `ServiceFaitForm.tsx`           | ~300   | Formulaire service fait     |
| `ControleSdctForm.tsx`          | —      | Controle SDCT               |
| `ValidationDgForm.tsx`          | —      | Formulaire validation DG    |
| `UrgentLiquidationBadge.tsx`    | —      | Badge urgence               |
| `UrgentLiquidationToggle.tsx`   | —      | Toggle urgence              |

---

## 3. Schema budget_liquidations

### Colonnes principales

| Colonne         | Type      | Description                   |
| --------------- | --------- | ----------------------------- |
| `id`            | UUID      | Cle primaire                  |
| `engagement_id` | UUID (FK) | Lien vers l'engagement valide |
| `numero`        | text      | Reference (LIQ-2026-XXXX)     |
| `exercice`      | integer   | Annee budgetaire              |
| `montant`       | numeric   | Montant TTC                   |
| `montant_ht`    | numeric   | Montant HT                    |
| `net_a_payer`   | numeric   | Montant net apres deductions  |

### Calcul fiscal — NetAPayer

| Colonne                  | Taux par defaut | Description           |
| ------------------------ | --------------- | --------------------- |
| `tva_taux`               | 18%             | Taux TVA              |
| `tva_montant`            | auto            | Montant TVA           |
| `airsi_taux`             | variable        | Acompte impot (AIRSI) |
| `airsi_montant`          | auto            | Montant AIRSI         |
| `retenue_source_taux`    | variable        | Retenue a la source   |
| `retenue_source_montant` | auto            | Montant retenue       |

**Formule :**

```
NetAPayer = Montant TTC - AIRSI - Retenue_Source
```

- TVA est deja incluse dans le montant TTC
- AIRSI (Acompte d'Impot sur le Revenu des Societes d'Investissement)
- Retenue a la source selon regime fiscal du prestataire
- Arrondis : deductions arrondies en premier (`Math.round`), net calcule par soustraction

### Service fait

| Colonne                     | Type    | Description            |
| --------------------------- | ------- | ---------------------- |
| `service_fait`              | boolean | Service execute ?      |
| `service_fait_date`         | date    | Date de constatation   |
| `service_fait_certifie_par` | UUID    | Certificateur          |
| `reference_facture`         | text    | N° facture fournisseur |
| `regime_fiscal`             | text    | reel, simplifie, etc.  |
| `observation`               | text    | Observations libres    |

### Reglement urgent (exigence TOURE 03/02/2026)

| Colonne                  | Type        | Description              |
| ------------------------ | ----------- | ------------------------ |
| `reglement_urgent`       | boolean     | Flag urgence             |
| `reglement_urgent_motif` | text        | Motif de l'urgence       |
| `reglement_urgent_date`  | timestamptz | Date marquage urgent     |
| `reglement_urgent_par`   | UUID        | Utilisateur ayant marque |

**Fonctions RPC urgence :**

- `mark_liquidation_urgent(p_liquidation_id, p_motif)` — DG/DMG/DAAF uniquement
- `unmark_liquidation_urgent(p_liquidation_id)` — Demarquer
- `get_urgent_liquidations_count()` → INTEGER
- `get_urgent_liquidations_stats()` → JSONB (total, montant_total, jours_depuis_marquage)
- Vue : `v_liquidations_urgentes`
- Index : `idx_budget_liquidations_urgent` (WHERE reglement_urgent = true)

### Workflow

| Colonne                 | Type                  | Description                             |
| ----------------------- | --------------------- | --------------------------------------- |
| `statut`                | text                  | brouillon/soumis/valide/rejete/differe  |
| `workflow_status`       | text                  | en_attente/en_validation/termine/rejete |
| `current_step`          | integer               | 0-4 (etape courante)                    |
| `submitted_at`          | timestamptz           | Date soumission                         |
| `validated_at/by`       | timestamptz/UUID      | Validation finale                       |
| `rejected_at/by/reason` | timestamptz/UUID/text | Rejet                                   |

---

## 4. Interfaces TypeScript existantes

```typescript
interface Liquidation {
  id: string;
  engagement_id: string; // FK → budget_engagements
  numero: string;
  montant: number; // TTC
  montant_ht: number | null;
  net_a_payer: number | null; // NetAPayer calcule
  tva_taux: number | null; // 18%
  tva_montant: number | null;
  airsi_taux: number | null;
  airsi_montant: number | null;
  retenue_source_taux: number | null;
  retenue_source_montant: number | null;
  service_fait: boolean | null;
  service_fait_date: string | null;
  service_fait_certifie_par: string | null;
  reference_facture: string | null;
  regime_fiscal: string | null;
  observation: string | null;
  statut: string | null;
  workflow_status: string | null;
  current_step: number | null;
  exercice: number | null;
  // + champs workflow, audit, relations
  engagement?: {
    id;
    numero;
    objet;
    montant;
    fournisseur;
    budget_line: { code; label; direction };
    marche: { numero; prestataire };
  };
}

interface LiquidationAvailability {
  montant_engage: number;
  liquidations_anterieures: number;
  liquidation_actuelle: number;
  cumul: number;
  restant_a_liquider: number;
  is_valid: boolean; // cumul <= montant_engage
}

interface LiquidationAttachment {
  id: string;
  liquidation_id: string;
  document_type: string; // facture, pv_reception, bon_livraison, attestation, autre
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
}
```

**Constants :**

```typescript
const VALIDATION_STEPS = [
  { order: 1, role: 'SAF', label: 'Service Administratif et Financier' },
  { order: 2, role: 'CB', label: 'Contrôleur Budgétaire' },
  { order: 3, role: 'DAF', label: 'Directeur Administratif et Financier' },
  { order: 4, role: 'DG', label: 'Directeur Général' },
];

const DOCUMENTS_REQUIS = [
  { code: 'facture', label: 'Facture', obligatoire: true },
  { code: 'pv_reception', label: 'PV de réception', obligatoire: true },
  { code: 'bon_livraison', label: 'Bon de livraison', obligatoire: true },
  { code: 'attestation_service_fait', label: 'Attestation service fait', obligatoire: false },
  { code: 'autre', label: 'Autre document', obligatoire: false },
];
```

---

## 5. Mutations existantes dans useLiquidations

| Mutation                | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `createLiquidation`     | Creer une liquidation a partir d'un engagement valide |
| `submitLiquidation`     | Soumettre pour validation (brouillon → soumis)        |
| `validateLiquidation`   | Viser/valider (SAF/CB/DAF/DG) avec commentaire        |
| `rejectLiquidation`     | Rejeter avec motif + notification createur            |
| `deferLiquidation`      | Reporter avec motif et deadline                       |
| `resumeLiquidation`     | Reprendre une liquidation reportee                    |
| `calculateAvailability` | Calculer le restant a liquider sur l'engagement       |

**Queries (2) :**

- `liquidations` — Liste avec joins engagement, creator, attachments
- `engagements-valides-pour-liquidation` — Engagements valides pour selection

---

## 6. Page Liquidations.tsx — Fonctionnalites existantes

### KPIs (5 cartes)

1. Total liquidations
2. Total montant
3. A valider (en attente)
4. Urgentes (avec animation pulsante si > 0)
5. Service fait (certifie)

### Onglets (7)

| Onglet    | Contenu                                       |
| --------- | --------------------------------------------- |
| A traiter | Engagements valides → creer liquidation       |
| Toutes    | Toutes les liquidations (filtre texte)        |
| A valider | Statut soumis (en attente de validation)      |
| Urgentes  | `reglement_urgent = true` (composant dedie)   |
| Validees  | Statut valide (action → creer ordonnancement) |
| Rejetees  | Statut rejete                                 |
| Differees | Statut differe (action → reprendre)           |

### Permissions RBAC

- `liquidation.create` / `liquidation.submit` / `liquidation.validate` / `liquidation.reject`
- `liquidation.defer` / `liquidation.resume`
- Support delegations (badge visible si validation par delegation)

### LiquidationDetails.tsx — Sections

1. En-tete (numero, date, statut, QR code si valide)
2. Chaine navigation (PM → Engagement → **Liquidation** → Ordonnancement)
3. Timeline dossier (si dossier_id)
4. Carte rejet/differe (si applicable)
5. Engagement source (lien, marche, budget line)
6. Fournisseur/prestataire
7. **Detail montants** (HT, TVA, TTC, AIRSI, Retenue Source, **Net a Payer**)
8. Service fait (certifie/non, date, facture, regime fiscal, observation)
9. Formulaires validation (ServiceFaitForm, ControleSdctForm, ValidationDgForm)
10. GED Documents (checklist)
11. Circuit de validation (4 etapes timeline)
12. Onglets : Workflow | Historique | Audit

---

## 7. Points d'attention specifiques

### 7.1 Cumul des liquidations

Un engagement peut avoir **PLUSIEURS liquidations** (partielles). Le cumul ne doit jamais depasser le montant engage :

```
cumul_liquidations = SUM(montant) WHERE engagement_id = X AND statut NOT IN ('rejete', 'annule')
restant_a_liquider = engagement.montant - cumul_liquidations
nouvelle_liquidation.montant <= restant_a_liquider
```

### 7.2 Service fait obligatoire

La liquidation ne peut etre soumise que si :

- `service_fait = true`
- `service_fait_date` renseigne
- `service_fait_certifie_par` renseigne (UUID de l'agent certificateur)

### 7.3 Regime fiscal et calcul AIRSI/retenue

Le calcul AIRSI et retenue a la source depend du **regime fiscal du prestataire** :

- Reel normal : AIRSI + retenue source
- Reel simplifie : retenue source uniquement
- Forfaitaire : pas de retenue
- Les taux sont variables et saisis manuellement dans le formulaire

### 7.4 Reglement urgent (exigence TOURE 03/02/2026)

Les liquidations urgentes doivent etre visibles en priorite dans la file de validation. Le flag `reglement_urgent` est independant du workflow de validation et peut etre pose/retire par DG/DMG/DAAF.

### 7.5 Coherence avec Engagement

- La liquidation doit verifier que l'engagement source est `statut = 'valide'`
- Le cumul (liquidations anterieures + actuelle) <= montant engage
- Les informations fournisseur/prestataire sont heritees de l'engagement

### 7.6 Impact budget

La liquidation validee devrait impacter `budget_lines.total_liquide` (colonne a verifier/creer si necessaire).

---

## 8. Recommandations pour les 15 prochains prompts Liquidation

### Phase 1 : Audit et diagnostic (Prompts 1-3)

| Prompt | Objectif                                                                |
| ------ | ----------------------------------------------------------------------- |
| 1      | Audit complet : code existant, hook, DB, triggers, RLS, console         |
| 2      | Diagnostic calcul fiscal (TVA/AIRSI/retenue), service fait workflow     |
| 3      | Fix build/TS/console, nettoyer code legacy, aligner patterns Engagement |

### Phase 2 : Fonctionnalites coeur (Prompts 4-8)

| Prompt | Objectif                                                                    |
| ------ | --------------------------------------------------------------------------- |
| 4      | Lien FK engagement valide → liquidation, pre-remplissage, cumul controle    |
| 5      | Calcul fiscal temps reel (NetAPayer = Montant - AIRSI - Retenue) + regime   |
| 6      | Validation 4 etapes SAF > CB > DAF > DG (aligner sur pattern Engagement)    |
| 7      | Detail 5+ onglets + attestation service fait PDF + bon liquidation          |
| 8      | Reglement urgent (flag TOURE) + liste urgences prioritaires + notifications |

### Phase 3 : Fonctionnalites avancees (Prompts 9-12)

| Prompt | Objectif                                                                      |
| ------ | ----------------------------------------------------------------------------- |
| 9      | Export Excel + CSV + PDF (suivi liquidation par engagement, par budget_line)  |
| 10     | RLS + performance + pagination + indexes (aligner sur pattern Engagement)     |
| 11     | Alertes (liquidation en retard, deadlines, urgences non traitees, cumul >80%) |
| 12     | Navigation chaine Engagement ↔ Liquidation ↔ Ordonnancement + sidebar badges  |

### Phase 4 : Tests et certification (Prompts 13-15)

| Prompt | Objectif                                                               |
| ------ | ---------------------------------------------------------------------- |
| 13     | Liquidation partielle / multiple (N liquidations par engagement)       |
| 14     | 60 tests Playwright massifs (calcul fiscal, cumul, urgent, validation) |
| 15     | Certification 100/100 + transition vers Ordonnancement                 |

---

## 9. Patterns a reutiliser depuis l'Engagement

Le module Engagement certifie fournit des patterns eprouves a reproduire :

| Pattern                  | Source Engagement                       | Adaptation Liquidation                                     |
| ------------------------ | --------------------------------------- | ---------------------------------------------------------- |
| Validation 4 etapes      | `validateMutation` + `VALIDATION_STEPS` | Identique (SAF > CB > DAF > DG)                            |
| Indicateur budget        | `IndicateurBudget.tsx`                  | Indicateur restant a liquider par engagement               |
| CB bloque si insuffisant | `isCBBlocked` logic                     | CB bloque si cumul > montant engage                        |
| Detail 5 onglets         | `EngagementDetails.tsx`                 | Adapter : Infos, Montants/Fiscal, Validation, Docs, Chaine |
| Export 4 formats         | `useEngagementExport.ts`                | `useLiquidationExport.ts` (meme structure)                 |
| Badge statut             | `getStatusBadge()`                      | Reutiliser (memes statuts)                                 |
| Bon/Piece PDF            | `PieceEngagement.tsx`                   | Attestation service fait PDF                               |
| QR code                  | `QRCodePrint`                           | QR sur liquidations validees                               |
| Timeline workflow        | `EngagementTimeline.tsx`                | `LiquidationTimeline.tsx` (deja existe)                    |
| Chaine navigation        | `EngagementChainNav.tsx`                | `LiquidationChainNav.tsx` (deja existe)                    |
| RLS direction-aware      | Policies `budget_engagements`           | Policies `budget_liquidations` (deja existe)               |
| Multi-lignes             | `engagement_lignes`                     | Pas necessaire (1 liquidation = 1 ligne)                   |
| Degagement               | `degageMutation`                        | Annulation liquidation (restitution cumul)                 |

---

## 10. Chaine de certification SYGFP

```
CERTIFIE  Structure Budgetaire (8 prompts)      ██████████ 100%
CERTIFIE  Notes SEF (8 prompts)                  ██████████ 100%
CERTIFIE  Notes AEF (8 prompts)                  ██████████ 100%
CERTIFIE  Imputation (10 prompts)                ██████████ 100%
CERTIFIE  Expression de Besoin (10 prompts)      ██████████ 100%
CERTIFIE  Passation / Marche (15 prompts)        ██████████ 100%
CERTIFIE  ENGAGEMENT (15 prompts)                ██████████ 100%
EN COURS  Liquidation (15 prompts)               ░░░░░░░░░░   0%
A VENIR   Ordonnancement (10 prompts)            ░░░░░░░░░░   0%
A VENIR   Reglement (10 prompts)                 ░░░░░░░░░░   0%
```

### Metriques cumulees (7 modules certifies)

| Metrique              | Valeur |
| --------------------- | ------ |
| Modules certifies     | 7      |
| Total tests unitaires | 600    |
| Total tests E2E       | 70+    |
| Pages                 | 115    |
| Composants            | 417    |
| Hooks                 | 165    |
| Migrations            | 253    |
| Tables                | 201    |
| RLS Policies          | 526    |

---

**MODULE ENGAGEMENT CERTIFIE 100/100 — PRET POUR LIQUIDATION**

_Document genere le 20/02/2026 — SYGFP v2.0 — Prompt 15 FINAL_
