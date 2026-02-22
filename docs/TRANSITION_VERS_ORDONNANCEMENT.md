# TRANSITION VERS ORDONNANCEMENT

**Date :** 22 fevrier 2026
**Prerequis :** Module Liquidation certifie 100/100 (104 unit + 60 E2E, 704 tests projet)

---

## 1. Qu'est-ce que l'Ordonnancement ?

L'**Ordonnancement** est l'**ORDRE DE PAYER** donne au comptable/tresorier. C'est l'acte administratif par lequel l'ordonnateur (DAF/DAAF) ordonne au comptable public de payer la dette constatee lors de la liquidation.

C'est l'etape **8** de la chaine de depense SYGFP :

```
SEF > AEF > Imputation > Expression Besoin > Passation > Engagement > Liquidation > ORDONNANCEMENT > Reglement
```

Dans le cycle ELOP (Engagement-Liquidation-Ordonnancement-Paiement), l'Ordonnancement est l'etape **3**.

### Difference avec la Liquidation

| Aspect     | Liquidation                           | Ordonnancement                          |
| ---------- | ------------------------------------- | --------------------------------------- |
| Quoi       | Constatation du service fait          | Ordre de payer au comptable             |
| Quand      | Apres livraison/prestation            | Apres validation de la liquidation      |
| Calcul     | Net a payer (TTC - retenues fiscales) | Montant = net_a_payer de la liquidation |
| Impact     | `budget_lines.total_liquide`          | `budget_lines.total_ordonnance`         |
| Document   | Attestation de liquidation            | Mandat de paiement / Ordre de payer     |
| Validation | 2 etapes (DAAF, DG si seuil)          | 4 etapes (SAF > CB > DAF > DG)          |
| Signature  | Visa DAAF + DG                        | 4 signatures (CB > DAF > DG > AC)       |

---

## 2. Etat actuel du module Ordonnancement

Le module Ordonnancement est **deja existant et fonctionnel** dans le codebase avec une architecture complete :

### Backend (Supabase)

| Element         | Detail                                                     |
| --------------- | ---------------------------------------------------------- |
| Table           | `ordonnancements` (50+ colonnes)                           |
| FK liquidation  | `liquidation_id` → `budget_liquidations(id)`               |
| Donnees migrees | 3,501 ordonnancements (source SQL Server)                  |
| Statuts         | brouillon → soumis → valide → en_signature → ordonnance    |
| Workflow        | 4 etapes validation : SAF > CB > DAF > DG                  |
| Signature       | 4 signatures : CB > DAF > DG > AC                          |
| Tables support  | `ordonnancement_validations` + `ordonnancement_signatures` |

### Frontend (React)

| Element        | Detail                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Hook principal | `useOrdonnancements.ts` (847 lignes)                                                            |
| Page           | `Ordonnancements.tsx` (412 lignes)                                                              |
| Composants     | 11 fichiers (3,407 lignes total)                                                                |
| Mutations      | 11 exportees (create, submit, validate, reject, defer, resume, sign, delete, submitToSignature) |
| Sidebar        | 2 badges (ordoAValider, ordoEnSignature)                                                        |

### Composants existants (11)

| Fichier                            | Lignes | Role                                 |
| ---------------------------------- | ------ | ------------------------------------ |
| `OrdonnancementForm.tsx`           | ~450   | Formulaire creation/edition          |
| `OrdonnancementDetails.tsx`        | 533    | Panneau detail (6 onglets)           |
| `OrdonnancementList.tsx`           | 254    | Liste avec actions contextuelles     |
| `OrdonnancementSignatures.tsx`     | ~360   | Workflow signatures (hash/QR)        |
| `OrdonnancementTimeline.tsx`       | ~420   | Timeline workflow visuelle           |
| `ValidationDgOrdonnancement.tsx`   | ~460   | Validation DG                        |
| `ParapheurIntern.tsx`              | ~420   | Parapheur interne (circuit visa)     |
| `OrdrePayer.tsx`                   | ~280   | Document Ordre de Payer (impression) |
| `OrdonnancementValidateDialog.tsx` | ~90    | Dialog validation                    |
| `OrdonnancementRejectDialog.tsx`   | ~100   | Dialog rejet avec motif              |
| `OrdonnancementDeferDialog.tsx`    | ~120   | Dialog report avec deadline          |

---

## 3. Schema `ordonnancements`

### 3.1 Colonnes principales

| Colonne                | Type        | Description                                             |
| ---------------------- | ----------- | ------------------------------------------------------- |
| `id`                   | UUID        | Cle primaire                                            |
| `numero`               | text        | Reference atomique (ORD-2026-XXXX)                      |
| `liquidation_id`       | UUID (FK)   | Lien vers budget_liquidations                           |
| `beneficiaire`         | text        | Nom du beneficiaire                                     |
| `banque`               | text        | Etablissement bancaire                                  |
| `rib`                  | text        | Releve d'identite bancaire                              |
| `mode_paiement`        | text        | virement / cheque / especes / mobile_money              |
| `montant`              | numeric     | Montant = net_a_payer de la liquidation                 |
| `date_prevue_paiement` | date        | Date prevue de paiement                                 |
| `objet`                | text        | Objet de l'ordonnancement                               |
| `observation`          | text        | Observations                                            |
| `statut`               | text        | brouillon → soumis → valide → en_signature → ordonnance |
| `workflow_status`      | text        | en_attente / en_validation / termine / rejete / differe |
| `current_step`         | integer     | Etape courante (0-4)                                    |
| `signature_hash`       | text        | Hash de signature numerique                             |
| `qr_code_data`         | text        | Donnees QR code (JSON payload)                          |
| `date_ordonnancement`  | timestamptz | Date effective de l'ordonnancement                      |
| `exercice`             | integer     | Exercice budgetaire                                     |
| `created_by`           | UUID (FK)   | Createur                                                |
| `created_at`           | timestamptz | Date de creation                                        |

### 3.2 FK Chain (chaine de depense complete)

```
ordonnancement
  └─ budget_liquidations (liquidation_id)
       └─ budget_engagements (engagement_id)
            └─ budget_lines (budget_line_id)
                 └─ directions (direction_id)
            └─ marches (marche_id)
                 └─ prestataires (prestataire_id)
       └─ liquidation_attachments
       └─ liquidation_validations
  └─ ordonnancement_validations
  └─ ordonnancement_signatures
  └─ reglements (etape suivante)
```

---

## 4. Constantes et types exportes

### 4.1 Constantes

```typescript
// 4 etapes de validation
VALIDATION_STEPS = [
  { order: 1, role: 'SAF', label: 'Service Administratif et Financier' },
  { order: 2, role: 'CB', label: 'Controleur Budgetaire' },
  { order: 3, role: 'DAF', label: 'Directeur Administratif et Financier' },
  { order: 4, role: 'DG', label: 'Directeur General' },
];

// 4 etapes de signature
SIGNATURE_STEPS = [
  { order: 1, role: 'CB', label: 'Controleur Budgetaire' },
  { order: 2, role: 'DAF', label: 'Directeur Administratif et Financier' },
  { order: 3, role: 'DG', label: 'Directeur General' },
  { order: 4, role: 'AC', label: 'Agent Comptable' },
];

// Modes de paiement
MODES_PAIEMENT = ['virement', 'cheque', 'especes', 'mobile_money'];
```

### 4.2 Interfaces

```typescript
interface OrdonnancementFormData {
  liquidation_id: string;
  beneficiaire: string;
  banque?: string;
  rib?: string;
  mode_paiement: string;
  montant: number;
  date_prevue_paiement?: string;
  observation?: string;
  objet: string;
}

interface OrdonnancementAvailability {
  montant_liquide: number;
  ordonnancements_anterieurs: number;
  ordonnancement_actuel: number;
  cumul: number;
  restant_a_ordonnancer: number;
  is_valid: boolean;
}

interface SignatureData {
  signataire_id: string;
  signataire_role: string;
  signature_hash?: string;
  qr_code_data?: string;
  signed_at: string;
}
```

---

## 5. Workflow Ordonnancement

### 5.1 Cycle de vie

```
1. CREATION (brouillon)
   └─ Select liquidation validee (valide_dg)
   └─ Pre-remplissage montant = net_a_payer
   └─ Verification disponibilite (cumul <= montant_liquide)
   └─ Generation numero atomique (ORD-xxxx)

2. SOUMISSION (soumis)
   └─ Insertion 4 etapes dans ordonnancement_validations
   └─ Notification SAF

3. VALIDATION (4 etapes)
   └─ SAF valide → CB valide → DAF valide → DG valide
   └─ A chaque etape : notification au role suivant
   └─ Statut final : "valide"

4. SIGNATURE (en_signature)
   └─ Insertion 4 signataires dans ordonnancement_signatures
   └─ CB signe → DAF signe → DG signe → AC signe
   └─ Hash de signature genere + QR code

5. ORDONNANCE (final)
   └─ Derniere signature (AC) → statut "ordonnance"
   └─ Lock engagement + liquidation (is_locked = true)
   └─ Pret pour reglement (etape 9)
```

### 5.2 Mutations disponibles (11)

| Mutation                   | Statut avant         | Statut apres       | Notification         |
| -------------------------- | -------------------- | ------------------ | -------------------- |
| `createOrdonnancement`     | —                    | brouillon          | —                    |
| `submitOrdonnancement`     | brouillon            | soumis             | SAF                  |
| `validateStep` (SAF)       | soumis               | en_validation      | CB                   |
| `validateStep` (CB)        | en_validation        | en_validation      | DAF                  |
| `validateStep` (DAF)       | en_validation        | en_validation      | DG                   |
| `validateStep` (DG)        | en_validation        | valide             | Createur + direction |
| `submitToSignature`        | valide               | en_signature       | CB (1er signataire)  |
| `signOrdonnancement` (1-3) | en_signature         | en_signature       | Signataire suivant   |
| `signOrdonnancement` (AC)  | en_signature         | ordonnance (FINAL) | Tresorerie + DAAF    |
| `rejectOrdonnancement`     | soumis/en_validation | rejete             | Createur             |
| `deferOrdonnancement`      | soumis/en_validation | differe            | Createur             |
| `resumeOrdonnancement`     | differe              | soumis             | SAF                  |
| `deleteOrdonnancement`     | brouillon            | (supprime)         | —                    |

---

## 6. Notification au DAAF + DMG + Directeurs operationnels (exigence TOURE)

### Template de notification

```
Titre: Ordonnancement [valide/signe] — {reference}
Message:
  Reference : {numero}
  Fournisseur : {beneficiaire}
  Montant net : {montant} FCFA
  Montant regle : {montant_regle} FCFA
  Montant restant : {montant_restant} FCFA
  Mode de paiement : {mode_paiement}
  Date prevue : {date_prevue_paiement}
```

### Destinataires par evenement

| Evenement              | Destinataires                                    |
| ---------------------- | ------------------------------------------------ |
| Soumission             | SAF (1er validateur)                             |
| Validation SAF         | CB (2eme validateur)                             |
| Validation CB          | DAF (3eme validateur)                            |
| Validation DAF         | DG (4eme validateur)                             |
| Validation DG (finale) | Createur + agents direction + DAAF               |
| Signature finale (AC)  | DAAF + DMG + Directeurs operationnels + createur |
| Rejet                  | Createur + agents direction                      |

---

## 7. Impact budget (ELOP etape 3)

L'ordonnancement est l'etape 3 du cycle ELOP :

| Etape | Module             | Impact sur `budget_lines`         |
| ----- | ------------------ | --------------------------------- |
| E     | Engagement         | `total_engage += montant`         |
| L     | Liquidation        | `total_liquide += net_a_payer`    |
| **O** | **Ordonnancement** | **`total_ordonnance += montant`** |
| P     | Paiement           | `total_paye += montant`           |

Le trigger `trg_recalc_elop_ordonnancements` met a jour `budget_lines.total_ordonnance` via la fonction `_recalculate_single_budget_line()`.

---

## 8. Lien FK : ordonnancement → liquidation_id

- Chaque ordonnancement est cree a partir d'une liquidation **validee DG** (`statut = 'valide_dg'`)
- Le montant de l'ordonnancement = `net_a_payer` de la liquidation
- Controle cumul : `SUM(ordonnancements.montant) <= liquidation.net_a_payer`
- Ordonnancements partiels possibles (N par liquidation)
- Sur signature finale (AC) : lock de la liquidation et de l'engagement (`is_locked = true`)

---

## 9. Tests existants

### E2E Playwright (existants)

| Fichier                                | Tests | Description                                                 |
| -------------------------------------- | ----- | ----------------------------------------------------------- |
| `e2e/liquidation-complet.spec.ts`      | 1     | /ordonnancements charge sans erreur                         |
| `e2e/workflow/chaine-complete.spec.ts` | 1     | Chaine complete affiche ordonnancements                     |
| `e2e/reglements/*.spec.ts`             | 13+   | Selection ordonnancement, precalcul, paiement partiel/total |
| `e2e/notifications/*.spec.ts`          | 4     | Notifications ordonnancement                                |

### Tests unitaires

- **Aucun test unitaire specifique** au module ordonnancement
- Pattern a suivre : `liquidation-utils.test.ts` (104 tests, 13 sections)

---

## 10. Recommandations pour les 10 prochains Prompts

### Phase 1 : Audit et corrections (Prompts 1-3)

| Prompt | Objectif                                                       | Livrable                           |
| ------ | -------------------------------------------------------------- | ---------------------------------- |
| 1      | Audit complet du code existant (847L hook + 3,407L composants) | Rapport diagnostic, liste des gaps |
| 2      | Fix TypeScript (supprimer @ts-nocheck), corriger types generes | 0 erreurs tsc, types propres       |
| 3      | Alignement patterns (conventions CLAUDE.md, imports, toast)    | Code uniforme avec autres modules  |

### Phase 2 : Fonctionnalites core (Prompts 4-7)

| Prompt | Objectif                                                   | Livrable                              |
| ------ | ---------------------------------------------------------- | ------------------------------------- |
| 4      | Validation 4 etapes robuste (SAF > CB > DAF > DG)          | Visa colonnes, audit trail, RBAC      |
| 5      | Signature 4 etapes (CB > DAF > DG > AC) avec hash + QR     | Signature numerique, document genere  |
| 6      | Cumul ordonnancement (controle <= net_a_payer liquidation) | Multi-ordonnancements, barre progress |
| 7      | Ordre de Payer PDF (en-tete ARTI, 4 signatures, QR code)   | PDF A4 telechargeable + impression    |

### Phase 3 : Fonctionnalites avancees (Prompts 8-9)

| Prompt | Objectif                                           | Livrable                           |
| ------ | -------------------------------------------------- | ---------------------------------- |
| 8      | Notifications enrichies (TOURE) + emails par etape | Templates email, CRON, alertes DMG |
| 9      | Exports (Excel multi-feuilles, CSV, PDF synthese)  | 3 formats export + filtrage        |

### Phase 4 : Tests et certification (Prompt 10)

| Prompt | Objectif                                              | Livrable                        |
| ------ | ----------------------------------------------------- | ------------------------------- |
| 10     | 100+ tests unitaires + 60 E2E + certification 100/100 | CERTIFICATION_ORDONNANCEMENT.md |

### Points d'attention

1. **@ts-nocheck** : Le hook `useOrdonnancements.ts` utilise `@ts-nocheck` car les tables/colonnes ne sont pas dans les types generes Supabase. Priorite absolue = generer les types avec `npx supabase gen types`.

2. **Coherence avec Liquidation** : Le module Ordonnancement a 4 etapes de validation (SAF > CB > DAF > DG) contre 2 pour la Liquidation (DAAF > DG). S'assurer que le RBAC est coherent.

3. **Signature vs Validation** : L'ordonnancement a 2 workflows distincts (validation PUIS signature). La signature est un processus separe avec hash cryptographique et QR code.

4. **Lock apres signature finale** : Quand l'Agent Comptable (AC) signe, l'engagement ET la liquidation sont verrouilles (`is_locked = true`). Ce mecanisme empeche les modifications retroactives.

5. **Bordereau de transmission** : Le document "Ordre de Payer" (`OrdrePayer.tsx`, 280 lignes) existe deja mais peut necessiter un enrichissement (bordereau de transmission au tresorier).

6. **Montant = net_a_payer** : Le montant de l'ordonnancement est TOUJOURS egal au `net_a_payer` de la liquidation source (apres deductions fiscales). Pas de recalcul fiscal au niveau ordonnancement.

7. **Exigence TOURE (03/02/2026)** : Notification obligatoire au DMG + Directeurs operationnels sur les evenements cles (validation finale, signature AC). Template avec : reference, fournisseur, montant_net, montant_regle, montant_restant.

---

## 11. Metriques actuelles du module Ordonnancement

| Metrique                   | Valeur            |
| -------------------------- | ----------------- |
| Hook principal             | 847 lignes        |
| Page                       | 412 lignes        |
| Composants                 | 11 (3,407 lignes) |
| Total lignes code frontend | ~4,666            |
| Mutations exportees        | 11                |
| Constantes exportees       | 3                 |
| Interfaces exportees       | 3                 |
| Tables Supabase            | 3                 |
| Badges sidebar             | 2                 |
| Tests unitaires            | 0 (a creer)       |
| Tests E2E                  | 18+ (disperses)   |
| Donnees migrees            | 3,501             |
| Score certification        | **A evaluer**     |

---

**Module Liquidation certifie. Transition vers Ordonnancement prete.**
**Prochaine etape : Prompt 1 — Audit complet du module Ordonnancement.**
