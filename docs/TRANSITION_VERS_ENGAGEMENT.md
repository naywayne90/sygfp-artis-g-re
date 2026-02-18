# TRANSITION — De la Passation de Marche vers l'Engagement Budgetaire

**Date :** 18 fevrier 2026
**Auteur :** Equipe SYGFP
**Statut :** Document de specification pour les 10 prochains prompts

---

## 1. DEFINITION

L'**Engagement budgetaire** est l'acte juridique par lequel l'ARTI (Autorite de
Regulation du Transport Interieur) **reserve definitivement les credits** pour le
marche signe. C'est l'etape 1 de l'**execution budgetaire**, apres les 5 etapes
de preparation (Note SEF → Note AEF → Imputation → Expression de Besoin →
Passation de Marche).

### Position dans la chaine de depense

```
PREPARATION                           EXECUTION
---------                             ---------
1. Note SEF                           6. ENGAGEMENT  ← Vous etes ici
2. Note AEF                           7. Liquidation
3. Imputation                         8. Ordonnancement
4. Expression de Besoin               9. Reglement
5. Passation de Marche (CERTIFIE)
```

L'engagement est cree **APRES** la signature du marche (statut `signe` dans
`passation_marche`). Il lie le marche au budget via la ligne budgetaire.

---

## 2. ETAT ACTUEL DU MODULE ENGAGEMENT

### 2.1 Table existante : `budget_engagements`

La table existe deja avec la structure suivante :

| Colonne                 | Type        | Description                                        |
| ----------------------- | ----------- | -------------------------------------------------- |
| id                      | UUID PK     | Identifiant unique                                 |
| numero                  | TEXT        | Reference ENG-YYYY-NNNN                            |
| objet                   | TEXT        | Objet de l'engagement                              |
| montant                 | NUMERIC     | Montant TTC de l'engagement                        |
| montant_ht              | NUMERIC     | Montant HT                                         |
| tva                     | NUMERIC     | TVA                                                |
| fournisseur             | TEXT        | Raison sociale du prestataire                      |
| date_engagement         | DATE        | Date de creation                                   |
| budget_line_id          | UUID FK     | Ligne budgetaire impactee                          |
| expression_besoin_id    | UUID FK     | Expression de besoin source                        |
| marche_id               | UUID FK     | Marche legacy                                      |
| **passation_marche_id** | **UUID FK** | **Passation de marche (ajoute le 16/01/2026)**     |
| dossier_id              | UUID FK     | Dossier de la chaine                               |
| note_id                 | UUID FK     | Note DG liee                                       |
| project_id              | UUID FK     | Projet lie                                         |
| statut                  | TEXT        | brouillon, soumis, valide, rejete, differe, annule |
| workflow_status         | TEXT        | en_attente, en_validation, termine, rejete         |
| current_step            | INTEGER     | Etape courante (0 a 4)                             |
| exercice                | INTEGER     | Exercice budgetaire                                |
| created_by              | UUID FK     | Createur                                           |
| checklist_complete      | BOOLEAN     | Checklist documents                                |
| legacy_import           | BOOLEAN     | Donnee importee                                    |
| code_locked             | BOOLEAN     | Reference verrouillee                              |

### 2.2 Workflow de validation (4 etapes)

| Etape | Ordre | Role | Description                            |
| ----- | ----- | ---- | -------------------------------------- |
| 1     | 1     | SAF  | Service Administratif et Financier     |
| 2     | 2     | CB   | Controleur Budgetaire                  |
| 3     | 3     | DAF  | Directeur Administratif et Financier   |
| 4     | 4     | DG   | Directeur General (approbation finale) |

Table de suivi : `engagement_validations`

```
engagement_validations(
  id, engagement_id, step_order, role,
  status, validated_by, validated_at, comments,
  validation_mode, validated_on_behalf_of
)
```

### 2.3 Format de reference

**Generateur :** `get_next_sequence('ENG', exercice, 'global')`
**Format :** `ENG-YYYY-NNNN` (ex: ENG-2026-0001)
**Table compteur :** `sequence_counters` (atomique, thread-safe)

### 2.4 Impact budgetaire

```
Dotation_actuelle = Dotation_initiale + Virements_recus - Virements_emis
Cumul = Engagements_anterieurs + Engagement_actuel
Disponible = Dotation_actuelle - Cumul
is_sufficient = Disponible >= 0
```

- Champ impacte : `budget_lines.total_engage`
- Trigger : `fn_update_engagement_rate()` sur UPDATE de `budget_engagements.statut`
- Quand `statut='valide'` → incremente `total_engage`
- Quand `statut='rejete'` ou `'annule'` → recalcule (exclut)

### 2.5 Lien FK vers passation_marche

**Colonne :** `passation_marche_id UUID REFERENCES passation_marche(id)`
**Index :** `idx_engagements_pm ON budget_engagements(passation_marche_id)`
**Statut :** Colonne et index existent, mais la **valeur n'est pas populee**
lors de la creation depuis le formulaire `EngagementFromPMForm.tsx`.

### 2.6 Pages et composants existants

| Element       | Fichier                            | Description                 |
| ------------- | ---------------------------------- | --------------------------- |
| Page liste    | `src/pages/Engagements.tsx`        | Liste, creation, filtrage   |
| Page scanning | `src/pages/ScanningEngagement.tsx` | Numerisation documents      |
| Formulaire    | `EngagementForm.tsx`               | Creation manuelle           |
| Formulaire PM | `EngagementFromPMForm.tsx`         | Creation depuis passation   |
| Detail        | `EngagementDetails.tsx`            | Vue complete + timeline     |
| Validation    | `EngagementValidateDialog.tsx`     | Dialog de validation        |
| Rejet         | `EngagementRejectDialog.tsx`       | Dialog de rejet             |
| Report        | `EngagementDeferDialog.tsx`        | Dialog de report            |
| Timeline      | `EngagementTimeline.tsx`           | Historique statuts          |
| Checklist     | `EngagementChecklist.tsx`          | Documents requis            |
| Hook          | `useEngagements.ts`                | CRUD + mutations + workflow |

### 2.7 Documents requis

| Code           | Libelle          | Obligatoire |
| -------------- | ---------------- | ----------- |
| bon_commande   | Bon de commande  | Oui         |
| contrat        | Contrat signe    | Non         |
| devis          | Devis approuve   | Oui         |
| pv_attribution | PV d'attribution | Non         |
| autre          | Autre document   | Non         |

---

## 3. GAPS IDENTIFIES

### Gap 1 : `passation_marche_id` non peuple

**Probleme :** Le formulaire `EngagementFromPMForm.tsx` ne transmet pas
`passation.id` lors de la creation de l'engagement.

**Solution :** Ajouter `passation_marche_id: passation.id` dans l'appel
`createEngagement()`.

### Gap 2 : Navigation retour Engagement → Passation

**Probleme :** Pas de lien clickable dans le detail engagement vers la
passation source.

**Solution :** Ajouter une `EngagementChainNav` similaire a `PassationChainNav`.

### Gap 3 : Notifications engagement

**Probleme :** Les notifications workflow (SAF→CB→DAF→DG) ne sont pas
implementees avec le pattern passation (dispatch + Edge Function email).

**Solution :** Appliquer le meme pattern `dispatchNotifications` aux mutations
de `useEngagements.ts`.

### Gap 4 : Export engagement depuis passation

**Probleme :** Quand un marche est signe avec `decision='engagement_possible'`,
le lien "Creer engagement" dans `PassationChainNav` pointe vers `/engagements`
mais ne pre-remplit pas le formulaire.

**Solution :** Passer `?sourcePM={id}` et pre-remplir automatiquement dans
`EngagementFromPMForm`.

### Gap 5 : Tests unitaires engagement

**Probleme :** 0 tests unitaires pour les fonctions pures d'engagement
(calcul disponibilite, validation workflow, reference).

**Solution :** Creer une suite de tests similaire a passation-utils.test.ts.

---

## 4. RECOMMANDATIONS POUR LES 10 PROCHAINS PROMPTS

### Prompt 1 : Backend — FK et creation depuis passation

- [ ] Corriger `EngagementFromPMForm.tsx` : passer `passation_marche_id`
- [ ] Ajouter `passation_marche_id` dans `useEngagements.ts` createMutation
- [ ] Trigger : quand engagement cree depuis PM, mettre a jour `dossiers.etape_courante`
- [ ] Test : creer un engagement depuis une passation signee, verifier FK

### Prompt 2 : Backend — Calcul disponibilite budgetaire robuste

- [ ] Auditer `calculateAvailability()` vs virements en cours
- [ ] Ajouter verification engagement duplique (meme PM)
- [ ] Bloquer si credit insuffisant (pas seulement warning)
- [ ] RPC serveur `check_budget_availability(budget_line_id, montant)` pour coherence

### Prompt 3 : Frontend — Formulaire engagement enrichi

- [ ] Pre-remplissage automatique depuis passation (objet, montant, fournisseur, dossier)
- [ ] Selection ligne budgetaire avec calcul disponibilite en temps reel
- [ ] Montant HT / TVA calcule automatiquement
- [ ] Validation Zod stricte du formulaire

### Prompt 4 : Backend — Workflow validation 4 etapes

- [ ] Auditer les mutations SAF→CB→DAF→DG
- [ ] Ajouter verrouillage : un engagement en validation ne peut etre modifie
- [ ] Historique des validations avec IP, mode (direct/delegation/interim)
- [ ] Trigger : verifier le role avant d'accepter la validation

### Prompt 5 : Frontend — Detail engagement 6 onglets

- [ ] Onglet Informations : reference, objet, montant, budget, fournisseur
- [ ] Onglet Passation : lien vers la passation source avec resume
- [ ] Onglet Budget : disponibilite, taux engagement, historique mouvements
- [ ] Onglet Documents : checklist, upload, validation
- [ ] Onglet Validation : timeline 4 etapes avec statuts
- [ ] Onglet Historique : journal des modifications

### Prompt 6 : Backend — Securite RLS + RBAC engagement

- [ ] RLS `budget_engagements` : SELECT par direction, INSERT DAAF, UPDATE workflow
- [ ] RLS `engagement_validations` : INSERT selon role/step
- [ ] RLS `engagement_attachments` : creator + ADMIN
- [ ] Verifier `has_role()` pour chaque etape de validation

### Prompt 7 : Frontend — Notifications et badges

- [ ] Notifications a chaque transition (soumission, validation, rejet, report)
- [ ] Badges sidebar : engagements en attente de validation par role
- [ ] Email via Edge Function `send-notification-email`
- [ ] Toast informatifs avec lien direct vers l'engagement

### Prompt 8 : Frontend — Exports engagement

- [ ] Excel : liste engagements avec budget impact
- [ ] PDF : fiche engagement individuelle (en-tete ARTI, signatures)
- [ ] CSV : export plat
- [ ] QR code sur engagements valides

### Prompt 9 : Backend — Performance et pagination

- [ ] Pagination serveur `.range(from, to)` avec `{ count: 'exact' }`
- [ ] RPC `get_engagement_counts()` pour KPI cards
- [ ] Index composites : `(exercice, statut)`, `(budget_line_id)`, `(passation_marche_id)`
- [ ] Filtrage serveur par statut, direction, exercice

### Prompt 10 : QA — Tests et certification engagement

- [ ] 65+ tests unitaires (calcul disponibilite, workflow, validation, reference)
- [ ] Tests E2E : creation depuis PM, workflow 4 etapes, export
- [ ] 0 erreurs TypeScript, build, ESLint
- [ ] CERTIFICATION_ENGAGEMENT.md
- [ ] TRANSITION_VERS_LIQUIDATION.md

---

## 5. SCHEMA DE DONNEES CIBLE

```
passation_marche (statut='signe')
        │
        │ passation_marche_id (FK)
        ▼
budget_engagements
        │
        ├── budget_line_id ──→ budget_lines (impact: total_engage += montant)
        ├── expression_besoin_id ──→ expressions_besoin
        ├── dossier_id ──→ dossiers (etape_courante='engagement')
        │
        ├── engagement_validations (4 steps: SAF→CB→DAF→DG)
        └── engagement_attachments (documents requis)
```

### Flux de creation

```
1. Passation signe + decision='engagement_possible'
2. Utilisateur clique "Creer engagement" dans PassationChainNav
3. EngagementFromPMForm pre-remplit :
   - objet = passation.expression_besoin.objet
   - montant = passation.montant_retenu
   - fournisseur = passation.prestataire_retenu.raison_sociale
   - budget_line_id = passation.expression_besoin.ligne_budgetaire_id
   - passation_marche_id = passation.id
4. Verification disponibilite budgetaire
5. Creation engagement (statut='brouillon')
6. Soumission → validation SAF → CB → DAF → DG
7. Si valide : budget_lines.total_engage += montant
8. Transition vers Liquidation
```

---

## 6. DONNEES EXISTANTES

| Table                  | Nombre | Source                           |
| ---------------------- | ------ | -------------------------------- |
| budget_engagements     | 2 805  | Migration SQL Server (2024-2026) |
| engagement_validations | —      | A verifier                       |
| budget_lines           | 500+   | Structure budgetaire importee    |

Les 2 805 engagements existants sont des donnees migrees de SQL Server.
Les nouveaux engagements crees depuis les passations utiliseront le nouveau
workflow avec `passation_marche_id`.

---

## 7. PRIORITES

| Priorite | Description                                     | Impact       |
| -------- | ----------------------------------------------- | ------------ |
| P0       | Corriger FK `passation_marche_id` dans creation | Bloquant     |
| P1       | Workflow validation 4 etapes                    | Core         |
| P1       | Calcul disponibilite budgetaire                 | Core         |
| P2       | Detail 6 onglets                                | UX           |
| P2       | Notifications et badges                         | UX           |
| P3       | Exports                                         | Nice-to-have |
| P3       | Tests et certification                          | Qualite      |

---

_Document genere le 18/02/2026 — SYGFP v2.0_
_Module Passation de Marche certifie — Transition vers Engagement_
