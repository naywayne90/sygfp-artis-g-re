# Règlements - Documentation Technique

> **Version**: 1.1 | **Derniere mise a jour**: 2026-02-06 | **Statut**: Operationnel

## 1. Vue d'ensemble

Le **Règlement** est la dernière étape de la chaîne de dépense. Il correspond au paiement effectif du bénéficiaire par le comptable. C'est l'extinction de la dette.

### Position dans la chaîne

```
... → Ordonnancement → [Règlement] ✓ FIN
```

### Rôle principal

- Enregistrer le paiement effectif
- Documenter la preuve de paiement
- Mettre à jour le solde du dossier
- Clôturer le cycle de dépense

---

## 2. Architecture

### 2.1 Tables principales

| Table                   | Description          | Clé primaire |
| ----------------------- | -------------------- | ------------ |
| `reglements`            | Règlements effectués | `id` (UUID)  |
| `reglement_attachments` | Preuves de paiement  | `id` (UUID)  |

### 2.2 Colonnes clés de `reglements`

| Colonne                | Type    | Nullable | Description               |
| ---------------------- | ------- | -------- | ------------------------- |
| `id`                   | uuid    | Non      | Identifiant unique        |
| `numero`               | text    | Non      | Numéro auto-généré        |
| `ordonnancement_id`    | uuid    | Non      | **Ordonnancement source** |
| `date_paiement`        | date    | Non      | Date du paiement          |
| `montant`              | numeric | Non      | Montant payé              |
| `mode_paiement`        | varchar | Non      | Mode utilisé              |
| `reference_paiement`   | text    | Oui      | N° chèque/virement        |
| `compte_bancaire_arti` | uuid    | Oui      | Compte payeur             |
| `banque_arti`          | text    | Oui      | Banque payeuse            |
| `observation`          | text    | Oui      | Observations              |
| `statut`               | varchar | Oui      | État                      |
| `exercice`             | integer | Oui      | Exercice                  |

### 2.3 Modes de paiement

4 modes de paiement sont supportes :

| Valeur         | Label             | Description                                                                |
| -------------- | ----------------- | -------------------------------------------------------------------------- |
| `virement`     | Virement bancaire | Transfert de compte a compte. Necessite reference et compte bancaire ARTI. |
| `cheque`       | Cheque            | Emission de cheque. Necessite reference du cheque.                         |
| `especes`      | Especes           | Paiement en numeraire. Limite aux petits montants.                         |
| `mobile_money` | Mobile Money      | Paiement mobile (Orange Money, MTN Money, etc.).                           |

```typescript
export const MODES_PAIEMENT = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'especes', label: 'Especes' },
  { value: 'mobile_money', label: 'Mobile Money' },
];
```

### 2.4 Documents de reglement

| Type                 | Label                   | Obligatoire | Description                                         |
| -------------------- | ----------------------- | ----------- | --------------------------------------------------- |
| `preuve_paiement`    | Preuve de paiement      | Oui         | Justificatif du paiement (bordereau, recu, capture) |
| `bordereau_virement` | Bordereau de virement   | Non         | Document bancaire de virement                       |
| `copie_cheque`       | Copie du cheque         | Non         | Scan ou photo du cheque emis                        |
| `avis_credit`        | Avis de credit bancaire | Non         | Confirmation de reception par le beneficiaire       |

```typescript
export const DOCUMENTS_REGLEMENT = [
  { type: 'preuve_paiement', label: 'Preuve de paiement', obligatoire: true },
  { type: 'bordereau_virement', label: 'Bordereau de virement', obligatoire: false },
  { type: 'copie_cheque', label: 'Copie du cheque', obligatoire: false },
  { type: 'avis_credit', label: 'Avis de credit bancaire', obligatoire: false },
];
```

### 2.5 Statuts du reglement

| Statut       | Description                                 |
| ------------ | ------------------------------------------- |
| `enregistre` | Reglement saisi, en attente de confirmation |
| `valide`     | Reglement confirme et paiement effectif     |
| `rejete`     | Reglement rejete avec motif et renvoi       |

### 2.6 Colonnes supplementaires pour le rejet

| Colonne         | Type      | Description                                  |
| --------------- | --------- | -------------------------------------------- |
| `motif_rejet`   | text      | Motif du rejet                               |
| `renvoi_target` | varchar   | Etape de renvoi (`engagement` ou `creation`) |
| `date_rejet`    | timestamp | Date du rejet                                |

---

## 3. Calcul du restant à payer

### 3.1 Formule

```
Restant à payer = Montant ordonnancé - Règlements antérieurs
```

### 3.2 Interface TypeScript

```typescript
export interface ReglementAvailability {
  montantOrdonnance: number;
  reglementsAnterieurs: number;
  restantAPayer: number;
  is_valid: boolean; // true si montant propose <= restant a payer
}
```

### 3.3 Algorithme de calcul (depuis `useReglements.ts`)

```typescript
const calculateReglementAvailability = async (
  ordonnancementId: string,
  currentReglementId?: string, // Exclure en cas d'edition
  proposedAmount?: number // Montant propose pour validation
): Promise<ReglementAvailability> => {
  // 1. Recuperer le montant de l'ordonnancement
  const { data: ordonnancement } = await supabase
    .from('ordonnancements')
    .select('montant, montant_paye')
    .eq('id', ordonnancementId)
    .single();

  // 2. Recuperer les reglements existants (sauf le courant si edition)
  let query = supabase
    .from('reglements')
    .select('id, montant')
    .eq('ordonnancement_id', ordonnancementId);

  if (currentReglementId) {
    query = query.not('id', 'eq', currentReglementId);
  }

  const { data: existingReglements } = await query;

  // 3. Calculer le total deja paye
  const totalPaye = (existingReglements || []).reduce((sum, reg) => sum + (reg.montant || 0), 0);

  // 4. Calculer le restant a payer
  const restantAPayer = (ordonnancement?.montant || 0) - totalPaye;

  return {
    montantOrdonnance: ordonnancement?.montant || 0,
    reglementsAnterieurs: totalPaye,
    restantAPayer,
    is_valid: proposedAmount !== undefined ? proposedAmount <= restantAPayer : true,
  };
};
```

**Points importants** :

- Le parametre `currentReglementId` permet d'exclure le reglement en cours d'edition du calcul
- Le parametre `proposedAmount` valide que le montant propose ne depasse pas le restant
- Les reglements rejetes sont exclus du calcul (filtre `neq("statut", "rejete")` dans `deleteReglement`)

### 3.4 Affichage visuel

```
+------------------+-----------+--------------+---------------+
| (A) Ordonnance   | (B) Deja  | (C) Ce       | (D) Restant   |
|                  |  paye     |  reglement   |  apres        |
+------------------+-----------+--------------+---------------+
|   4 766 950      |     0     |  4 766 950   |     0  (OK)   |
+------------------+-----------+--------------+---------------+
```

### 3.5 Regles de validation

- **Le montant ne peut pas depasser le restant a payer** (verification dans `createReglement`)
- Si `restant apres = 0` : "Reglement complet" et dossier marque comme "solde"
- Si `restant apres > 0` : Paiement partiel, ordonnancement verrouille (`is_locked = true`)
- L'ordonnancement est verrouille des le premier paiement partiel

---

## 4. Comptes bancaires ARTI

### 4.1 Comptes depuis la base

```typescript
const { data: comptesBancaires } = await supabase
  .from('comptes_bancaires')
  .select('*')
  .eq('est_actif', true)
  .order('libelle');
```

### 4.2 Interface CompteBancaire

```typescript
export interface CompteBancaire {
  id: string;
  code: string;
  libelle: string;
  banque: string | null;
  numero_compte: string | null;
  iban: string | null;
  solde_actuel: number | null;
  est_actif: boolean | null;
}
```

### 4.3 Fallback hardcode (si pas de comptes en base)

```typescript
export const COMPTES_BANCAIRES_ARTI = [
  { value: 'SGBCI-001', label: 'SGBCI - Compte Principal', banque: 'SGBCI' },
  { value: 'BICICI-001', label: 'BICICI - Compte Courant', banque: 'BICICI' },
  { value: 'ECOBANK-001', label: 'ECOBANK - Compte Operations', banque: 'ECOBANK' },
  { value: 'BOA-001', label: 'BOA - Compte Tresorerie', banque: 'BOA' },
];
```

---

## 5. Workflow

Le reglement a un workflow simplifie avec possibilite de rejet :

```
                     +-------------------+
                     |   ENREGISTRE      |  <-- Comptable saisit le reglement
                     +--------+----------+
                              |
                    +---------+---------+
                    |                   |
                    v                   v
           +-------+-------+   +-------+-------+
           |    VALIDE     |   |    REJETE     |
           +-------+-------+   +-------+-------+
                   |                   |
                   v                   v
        Mise a jour :            Renvoi vers :
        - ordo.montant_paye     - "engagement" (correction)
        - ordo.is_locked=true   - "creation" (reprise totale)
        - dossier = "solde"     - dossier = "en_correction"
          (si complet)
```

### 5.1 Processus de creation

1. L'operateur selectionne un ordonnancement valide (avec restant > 0)
2. Le systeme pre-remplit les infos du beneficiaire depuis l'ordonnancement
3. L'operateur saisit : montant, mode paiement, reference, compte ARTI, date
4. Le systeme valide que `montant <= restant a payer`
5. Le reglement est cree avec statut `enregistre`
6. L'ordonnancement est verrouille (`is_locked = true`)

### 5.2 Processus de rejet

Le rejet permet de renvoyer le dossier a une etape anterieure :

| Cible de renvoi       | Valeur       | Description                                                                    |
| --------------------- | ------------ | ------------------------------------------------------------------------------ |
| Renvoi a l'Engagement | `engagement` | Deverrouille l'engagement, dossier en `en_correction` a l'etape `engagement`   |
| Renvoi a la Creation  | `creation`   | Renvoie au debut du processus, dossier en `en_correction` a l'etape `creation` |

Le motif de rejet est obligatoire. Lors du rejet :

- Le reglement est marque `rejete` avec `motif_rejet`, `renvoi_target`, `date_rejet`
- Le `montant_paye` de l'ordonnancement est recalcule (sans les rejetes)
- Le dossier est mis a jour vers l'etape de renvoi
- Un audit trail est enregistre (action `REJECT` + action `RENVOI` sur le dossier)

---

## 6. Cloture automatique du dossier

### 6.1 Condition

Un dossier est **solde** quand :

```
Total regle (montant_paye) >= Total ordonnance (montant)
```

### 6.2 Processus de cloture automatique (depuis `createReglement`)

Lors de la creation d'un reglement, le hook effectue les etapes suivantes :

```
1. Verification de disponibilite (montant <= restant a payer)
2. Insertion du reglement (statut: "enregistre")
3. Mise a jour ordonnancement.montant_paye += montant
4. Verrouillage ordonnancement (is_locked = true)
5. SI montant_paye >= montant ordonnance :
   a. Remonter la chaine : ordonnancement -> liquidation -> engagement -> expression_besoin -> dossier
   b. Mettre a jour dossier :
      - statut_global = "solde"
      - statut_paiement = "solde"
      - date_cloture = now()
   c. Audit trail : action "CLOSE" sur le dossier
```

### 6.3 Chaine de remontee pour trouver le dossier

```typescript
// Navigation : ordonnancement -> liquidation -> engagement -> expression_besoin -> dossier
const { data: ordData } = await supabase
  .from('ordonnancements')
  .select(
    `
    liquidation:budget_liquidations(
      engagement:budget_engagements(
        expression_besoin:expressions_besoin(
          dossier_id
        )
      )
    )
  `
  )
  .eq('id', ordonnancement_id)
  .single();

const dossierId = ordData?.liquidation?.engagement?.expression_besoin?.dossier_id;
```

### 6.4 Annulation d'un reglement

L'annulation (`deleteReglement`) recalcule le montant_paye et deverrouille l'ordonnancement si plus aucun paiement n'existe :

```
1. Recuperer le reglement (ordonnancement_id, montant)
2. Supprimer le reglement
3. Recalculer montant_paye = somme des reglements restants
4. Mettre a jour ordonnancement.is_locked = (montant_paye > 0)
5. Audit trail : action "DELETE"
```

---

## 7. Sécurité (RLS)

```sql
-- Lecture : Tous authentifiés
CREATE POLICY "reglements_select" ON reglements
FOR SELECT USING (true);

-- Création : Comptable, Trésorier
CREATE POLICY "reglements_insert" ON reglements
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'COMPTABLE')
  OR has_role(auth.uid(), 'TRESORIER')
  OR has_role(auth.uid(), 'DAF')
);
```

---

## 8. Hooks React

### 8.1 Hook principal : `useReglements`

**Fichier** : `src/hooks/useReglements.ts` (~688 lignes)

#### Retours du hook

| Export                           | Type                | Description                                  |
| -------------------------------- | ------------------- | -------------------------------------------- |
| `reglements`                     | `Reglement[]`       | Liste des reglements de l'exercice courant   |
| `isLoading`                      | `boolean`           | Etat de chargement                           |
| `error`                          | `Error \| null`     | Erreur eventuelle                            |
| `ordonnancementsValides`         | `Ordonnancement[]`  | Ordonnancements valides avec restant > 0     |
| `comptesBancaires`               | `CompteBancaire[]`  | Comptes bancaires actifs                     |
| `createReglement`                | `UseMutationResult` | Mutation de creation                         |
| `deleteReglement`                | `UseMutationResult` | Mutation de suppression (annulation)         |
| `rejectReglement`                | `UseMutationResult` | Mutation de rejet avec renvoi                |
| `calculateReglementAvailability` | `function`          | Calcul restant a payer                       |
| `getAttachments`                 | `function`          | Recuperer les pieces jointes d'un reglement  |
| `addAttachment`                  | `UseMutationResult` | Ajouter une piece jointe                     |
| `stats`                          | `object`            | Statistiques (total, totalMontant, partiels) |
| `getTreasuryLink`                | `function`          | Generer un lien vers la tresorerie           |
| `isDossierClosed`                | `function`          | Verifier si un dossier est cloture           |

#### Queries TanStack utilisees

| Query Key                                              | Description                 |
| ------------------------------------------------------ | --------------------------- |
| `["reglements", exercice]`                             | Liste des reglements        |
| `["ordonnancements-valides-pour-reglement", exercice]` | Ordonnancements disponibles |
| `["comptes-bancaires"]`                                | Comptes bancaires actifs    |

#### Invalidations apres mutation

Apres creation, suppression ou rejet, les queries suivantes sont invalidees :

- `reglements`, `ordonnancements`, `ordonnancements-valides-pour-reglement`, `dossiers`, `engagements`

### 8.2 Constantes et types exportes

```typescript
export const MODES_PAIEMENT = [...];          // 4 modes de paiement
export const COMPTES_BANCAIRES_ARTI = [...];  // Fallback comptes bancaires
export const DOCUMENTS_REGLEMENT = [...];     // 4 types de documents
export const RENVOI_TARGETS = [...];          // 2 cibles de renvoi (engagement, creation)

export interface CompteBancaire { ... }
export interface ReglementAvailability { ... }
export interface ReglementFormData { ... }
export type RenvoiTarget = "engagement" | "creation";
```

### 8.3 Interface du formulaire

```typescript
export interface ReglementFormData {
  ordonnancement_id: string; // Ordonnancement a regler
  date_paiement: string; // Date du paiement
  mode_paiement: string; // virement | cheque | especes | mobile_money
  reference_paiement?: string; // N. cheque, virement, etc.
  compte_id?: string; // Compte bancaire (ID)
  compte_bancaire_arti?: string; // Code compte ARTI
  banque_arti?: string; // Nom de la banque
  montant: number; // Montant (<= restant a payer)
  observation?: string; // Commentaire optionnel
}
```

---

## 9. Pages et Composants

### 9.1 Pages

| Route         | Composant        | Description      |
| ------------- | ---------------- | ---------------- |
| `/reglements` | `Reglements.tsx` | Liste et gestion |

### 9.2 Composants

| Composant              | Description              |
| ---------------------- | ------------------------ |
| `ReglementForm.tsx`    | Formulaire (~573 lignes) |
| `ReglementList.tsx`    | Liste avec filtres       |
| `ReglementDetails.tsx` | Vue détaillée            |

### 9.3 Arborescence

```
src/
├── pages/
│   └── Reglements.tsx
└── components/
    └── reglement/
        ├── ReglementForm.tsx
        ├── ReglementList.tsx
        └── ReglementDetails.tsx
```

---

## 10. API Supabase - Exemples

### 10.1 Créer un règlement

```typescript
const { data, error } = await supabase
  .from('reglements')
  .insert({
    ordonnancement_id: 'uuid-ordonnancement',
    date_paiement: '2026-03-05',
    montant: 4766950,
    mode_paiement: 'virement',
    reference_paiement: 'VIR-2026-00456',
    compte_bancaire_arti: 'uuid-compte',
    banque_arti: 'SGBCI',
    observation: 'Paiement facture TECH SOLUTIONS',
    exercice: 2026,
    statut: 'valide',
  })
  .select()
  .single();
```

### 10.2 Récupérer avec relations

```typescript
const { data, error } = await supabase
  .from('reglements')
  .select(
    `
    *,
    ordonnancement:ordonnancements(
      id, numero, montant, beneficiaire, banque, rib,
      liquidation:budget_liquidations(
        engagement:budget_engagements(numero, objet)
      )
    ),
    attachments:reglement_attachments(*)
  `
  )
  .eq('exercice', 2026)
  .order('date_paiement', { ascending: false });
```

### 10.3 Calculer disponibilité

```typescript
const calculateReglementAvailability = async (ordonnancementId: string) => {
  // Montant de l'ordonnancement
  const { data: ordonnancement } = await supabase
    .from('ordonnancements')
    .select('montant')
    .eq('id', ordonnancementId)
    .single();

  // Règlements antérieurs
  const { data: reglements } = await supabase
    .from('reglements')
    .select('montant')
    .eq('ordonnancement_id', ordonnancementId)
    .eq('statut', 'valide');

  const montantOrdonnance = ordonnancement.montant;
  const reglementsAnterieurs = reglements?.reduce((s, r) => s + r.montant, 0) || 0;

  return {
    montantOrdonnance,
    reglementsAnterieurs,
    restantAPayer: montantOrdonnance - reglementsAnterieurs,
  };
};
```

---

## 11. Intégration avec Trésorerie

### 11.1 Lien avec comptes bancaires

```typescript
// Récupérer les comptes avec solde
const { data: comptes } = await supabase
  .from('comptes_bancaires')
  .select('id, libelle, banque, solde_actuel')
  .eq('est_actif', true);
```

### 11.2 Impact sur le solde

Après règlement, le solde du compte peut être mis à jour :

```typescript
// Optionnel : Mise à jour du solde
await supabase
  .from('comptes_bancaires')
  .update({
    solde_actuel: supabase.raw('solde_actuel - ?', [montant]),
  })
  .eq('id', compteId);
```

---

## 12. Intégration avec autres modules

### 12.1 Entrées

| Module source   | Données reçues        |
| --------------- | --------------------- |
| Ordonnancements | Ordonnancement validé |
| Trésorerie      | Comptes bancaires     |

### 12.2 Sorties

| Module cible | Données envoyées         |
| ------------ | ------------------------ |
| Dossiers     | Statut → "soldé"         |
| Budget Lines | Mise à jour `total_paye` |
| Trésorerie   | Mouvement de sortie      |

---

## 13. Points ouverts / TODOs

- [ ] Intégration bancaire automatique (relevés)
- [ ] Réconciliation bancaire
- [ ] Génération bordereaux de règlement
- [ ] Historique des paiements par fournisseur
- [ ] Alertes délais de paiement

---

## 14. Changelog

| Date       | Version | Modifications                                                                                                                                                                                                              |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-06 | 1.1     | Ajout : modes paiement detailles, calcul restant a payer (algorithme complet), processus cloture automatique, workflow rejet avec renvoi, interface ReglementFormData, types exportes, statistiques, invalidations queries |
| 2026-01-15 | 1.0     | Documentation initiale                                                                                                                                                                                                     |
