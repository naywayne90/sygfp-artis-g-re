# Ordonnancements - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

L'**Ordonnancement** (ou mandat de paiement) est l'ordre donné par l'ordonnateur au comptable de payer une dépense préalablement liquidée. C'est l'avant-dernière étape de la chaîne de dépense.

### Position dans la chaîne

```
... → Liquidation → [Ordonnancement] → Règlement
```

### Rôle principal

- Émettre l'ordre de paiement au bénéficiaire
- Préciser les coordonnées bancaires du bénéficiaire
- Définir le mode et la date prévue de paiement
- Préparer le règlement par le comptable

---

## 2. Architecture

### 2.1 Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `ordonnancements` | Ordonnancements / Mandats | `id` (UUID) |
| `ordonnancement_validations` | Étapes validation | `id` (UUID) |
| `ordonnancement_signatures` | Signatures électroniques | `id` (UUID) |

### 2.2 Colonnes clés de `ordonnancements`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `numero` | text | Non | Numéro auto-généré |
| `liquidation_id` | uuid | Non | **Liquidation source** |
| `objet` | text | Non | Objet du paiement |
| `montant` | numeric | Non | Montant à payer |
| `beneficiaire` | text | Non | Nom du bénéficiaire |
| `banque` | text | Oui | Banque du bénéficiaire |
| `rib` | text | Oui | RIB/IBAN bénéficiaire |
| `mode_paiement` | varchar | Non | Mode de paiement |
| `date_prevue_paiement` | date | Oui | Date prévue |
| `observation` | text | Oui | Observations |
| `statut` | varchar | Oui | État workflow |
| `current_step` | integer | Oui | Étape actuelle |
| `exercice` | integer | Oui | Exercice |

### 2.3 Modes de paiement

```typescript
export const MODES_PAIEMENT = [
  { value: "virement", label: "Virement bancaire" },
  { value: "cheque", label: "Chèque" },
  { value: "especes", label: "Espèces" },
  { value: "mobile_money", label: "Mobile Money" },
];
```

---

## 3. Calcul du restant à ordonnancer

### 3.1 Formule

```
Restant à ordonnancer = Montant liquidé - Ordonnancements antérieurs
```

### 3.2 Interface TypeScript

```typescript
interface OrdonnancementAvailability {
  montantLiquide: number;
  ordonnancementsAnterieurs: number;
  restantAOrdonnancer: number;
}
```

### 3.3 Affichage visuel

```
┌────────────────────────────────────────────────────────────────────────┐
│ (A) Liquidé │ (B) Ord. ant. │ (C) Actuel │ (D) Cumul │ (E) Restant    │
│  5 000 000  │   2 000 000   │  1 500 000 │ 3 500 000 │  1 500 000 ✓   │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Règle

⚠️ **Le montant ne peut pas dépasser le restant à ordonnancer.**

---

## 4. Workflow de validation

### 4.1 Étapes (4 étapes)

| Étape | Rôle | Action |
|-------|------|--------|
| 1 | `SAF` | Vérification administrative |
| 2 | `CB` | Contrôle budgétaire |
| 3 | `DAF` | Validation financière |
| 4 | `DG` | **Signature finale** |

### 4.2 Diagramme

```
┌─────────────────┐
│   BROUILLON     │ ← Agent crée l'ordonnancement
└────────┬────────┘
         │ Soumettre
         ▼
┌─────────────────┐
│ ÉTAPE 1: SAF    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ ÉTAPE 2: CB     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ ÉTAPE 3: DAF    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ ÉTAPE 4: DG     │ ← Signature du mandat
└────────┬────────┘
         │ Signer + Valider
         ▼
┌─────────────────┐
│     VALIDE      │ → Vers Règlement
└─────────────────┘
```

---

## 5. Signatures

### 5.1 Table `ordonnancement_signatures`

| Colonne | Type | Description |
|---------|------|-------------|
| `ordonnancement_id` | uuid | Ordonnancement |
| `signataire_id` | uuid | Utilisateur signataire |
| `role_signataire` | varchar | Rôle (DAF, DG) |
| `date_signature` | timestamptz | Date/heure |
| `signature_data` | text | Signature (base64 si image) |
| `ip_address` | text | IP du signataire |

### 5.2 Composant de signatures

```tsx
<OrdonnancementSignatures ordonnancementId={id} />
```

---

## 6. Sécurité (RLS)

```sql
-- Lecture : Tous authentifiés
CREATE POLICY "ordonnancements_select" ON ordonnancements
FOR SELECT USING (true);

-- Modification : Validateurs
CREATE POLICY "ordonnancements_update" ON ordonnancements
FOR UPDATE USING (
  has_role(auth.uid(), 'DAF')
  OR has_role(auth.uid(), 'DG')
  OR has_role(auth.uid(), 'CB')
);
```

---

## 7. Hooks React

### 7.1 Hook principal : `useOrdonnancements`

| Export | Type | Description |
|--------|------|-------------|
| `ordonnancements` | `Ordonnancement[]` | Liste |
| `liquidationsValidees` | `Liquidation[]` | Liquidations disponibles |
| `createOrdonnancement` | `mutation` | Créer |
| `validateOrdonnancement` | `function` | Valider étape |
| `calculateOrdonnancementAvailability` | `function` | Calculer restant |

### 7.2 Constantes exportées

```typescript
export const MODES_PAIEMENT = [...];
```

### 7.3 Fichiers sources

```
src/hooks/useOrdonnancements.ts   # Hook principal (~461 lignes)
```

---

## 8. Pages et Composants

### 8.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/ordonnancements` | `Ordonnancements.tsx` | Liste et gestion |

### 8.2 Composants

| Composant | Description |
|-----------|-------------|
| `OrdonnancementForm.tsx` | Formulaire (~458 lignes) |
| `OrdonnancementList.tsx` | Liste avec filtres |
| `OrdonnancementDetails.tsx` | Vue détaillée |
| `OrdonnancementSignatures.tsx` | Gestion signatures |
| `OrdonnancementValidateDialog.tsx` | Dialog validation |
| `OrdonnancementRejectDialog.tsx` | Dialog rejet |
| `OrdonnancementDeferDialog.tsx` | Dialog report |
| `OrdrePayer.tsx` | Document PDF à imprimer |

### 8.3 Arborescence

```
src/
├── pages/
│   └── Ordonnancements.tsx
└── components/
    └── ordonnancement/
        ├── OrdonnancementForm.tsx
        ├── OrdonnancementList.tsx
        ├── OrdonnancementDetails.tsx
        ├── OrdonnancementSignatures.tsx
        ├── OrdonnancementValidateDialog.tsx
        ├── OrdonnancementRejectDialog.tsx
        ├── OrdonnancementDeferDialog.tsx
        └── OrdrePayer.tsx
```

---

## 9. API Supabase - Exemples

### 9.1 Créer un ordonnancement

```typescript
const { data, error } = await supabase
  .from("ordonnancements")
  .insert({
    liquidation_id: "uuid-liquidation",
    objet: "Paiement facture TECH SOLUTIONS",
    montant: 4766950,
    beneficiaire: "TECH SOLUTIONS SARL",
    banque: "SGBCI",
    rib: "CI00 1234 5678 9012 3456 7890 123",
    mode_paiement: "virement",
    date_prevue_paiement: "2026-03-01",
    exercice: 2026,
    statut: "brouillon",
    current_step: 0,
  })
  .select()
  .single();
```

### 9.2 Récupérer avec relations

```typescript
const { data, error } = await supabase
  .from("ordonnancements")
  .select(`
    *,
    liquidation:budget_liquidations(
      id, numero, montant,
      engagement:budget_engagements(
        id, numero, objet, fournisseur,
        budget_line:budget_lines(code, label)
      )
    ),
    signatures:ordonnancement_signatures(*)
  `)
  .eq("exercice", 2026)
  .order("created_at", { ascending: false });
```

### 9.3 Calculer disponibilité

```typescript
const calculateOrdonnancementAvailability = async (liquidationId: string) => {
  // Montant de la liquidation
  const { data: liquidation } = await supabase
    .from("budget_liquidations")
    .select("montant")
    .eq("id", liquidationId)
    .single();

  // Ordonnancements antérieurs
  const { data: ordonnancements } = await supabase
    .from("ordonnancements")
    .select("montant")
    .eq("liquidation_id", liquidationId)
    .in("statut", ["valide", "en_validation"]);

  const montantLiquide = liquidation.montant;
  const ordonnancementsAnterieurs = ordonnancements?.reduce((s, o) => s + o.montant, 0) || 0;

  return {
    montantLiquide,
    ordonnancementsAnterieurs,
    restantAOrdonnancer: montantLiquide - ordonnancementsAnterieurs,
  };
};
```

---

## 10. Document "Ordre de Payer"

### 10.1 Composant `OrdrePayer`

Génère un document imprimable avec :

- En-tête officiel ARTI
- Numéro de l'ordonnancement
- Bénéficiaire et coordonnées bancaires
- Montant en chiffres et en lettres
- Imputations budgétaires
- Zone de signatures (DAF, DG)

### 10.2 Impression

```tsx
const handlePrint = () => {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(/* HTML du document */);
  printWindow.document.close();
  printWindow.print();
};
```

---

## 11. Intégration avec autres modules

### 11.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Liquidations | Liquidation validée |

### 11.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Règlements | Ordonnancement validé |
| Budget Lines | Mise à jour `total_ordonnance` |

---

## 12. Points ouverts / TODOs

- [ ] Signature électronique qualifiée
- [ ] Génération PDF avec signature intégrée
- [ ] Bordereaux de transmission groupés
- [ ] Suivi des délais de paiement
- [ ] Notifications au comptable

---

## 13. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
