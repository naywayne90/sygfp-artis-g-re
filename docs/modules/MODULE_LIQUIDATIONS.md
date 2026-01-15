# Liquidations - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

La **Liquidation** est l'opération qui consiste à vérifier la réalité de la dette (service fait) et à arrêter le montant exact de la dépense. Elle fait suite à l'engagement et précède l'ordonnancement.

### Position dans la chaîne

```
... → Engagement → [Liquidation] → Ordonnancement → Règlement
```

### Rôle principal

- Constater le service fait (livraison, prestation)
- Vérifier les documents justificatifs (facture, PV, BL)
- Calculer les retenues fiscales (TVA, AIRSI, retenue source)
- Déterminer le net à payer

---

## 2. Architecture

### 2.1 Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `budget_liquidations` | Liquidations | `id` (UUID) |
| `liquidation_validations` | Étapes validation | `id` (UUID) |
| `liquidation_attachments` | Pièces jointes | `id` (UUID) |

### 2.2 Colonnes clés de `budget_liquidations`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `numero` | text | Non | Numéro auto-généré |
| `engagement_id` | uuid | Non | **Engagement source** |
| `montant` | numeric | Non | Montant TTC liquidé |
| `montant_ht` | numeric | Oui | Montant HT |
| `tva_taux` | numeric | Oui | Taux TVA (%) |
| `tva_montant` | numeric | Oui | Montant TVA |
| `airsi_taux` | numeric | Oui | Taux AIRSI (%) |
| `airsi_montant` | numeric | Oui | Montant AIRSI |
| `retenue_source_taux` | numeric | Oui | Taux retenue source |
| `retenue_source_montant` | numeric | Oui | Montant retenue |
| `net_a_payer` | numeric | Oui | Net à payer |
| `regime_fiscal` | varchar | Oui | Régime fiscal |
| `reference_facture` | text | Oui | N° facture |
| `service_fait` | boolean | Oui | Service fait certifié |
| `service_fait_date` | date | Oui | Date service fait |
| `statut` | varchar | Oui | État workflow |
| `current_step` | integer | Oui | Étape actuelle |
| `exercice` | integer | Oui | Exercice |

### 2.3 Calculs fiscaux

```typescript
// TVA (standard 18%)
tva_montant = montant_ht * (tva_taux / 100);

// AIRSI (Acompte d'Impôt sur le Revenu des Services Immatériels)
airsi_montant = montant_ht * (airsi_taux / 100);

// Retenue à la source
retenue_source_montant = montant_ht * (retenue_source_taux / 100);

// Net à payer
net_a_payer = montant - airsi_montant - retenue_source_montant;
```

---

## 3. Documents obligatoires

```typescript
export const DOCUMENTS_REQUIS = [
  { code: "facture", label: "Facture", obligatoire: true },
  { code: "pv_reception", label: "PV de réception", obligatoire: true },
  { code: "bon_livraison", label: "Bon de livraison", obligatoire: true },
  { code: "attestation_service_fait", label: "Attestation service fait", obligatoire: false },
  { code: "rapport_execution", label: "Rapport d'exécution", obligatoire: false },
  { code: "autres", label: "Autres documents", obligatoire: false },
];
```

⚠️ **Les 3 premiers documents sont OBLIGATOIRES pour soumettre la liquidation.**

---

## 4. Calcul du restant à liquider

### 4.1 Formule

```
Restant à liquider = Montant engagé - Liquidations antérieures
```

### 4.2 Interface TypeScript

```typescript
interface LiquidationAvailability {
  montant_engage: number;
  liquidations_anterieures: number;
  liquidation_actuelle: number;
  cumul: number;
  restant_a_liquider: number;
  is_valid: boolean;
}
```

### 4.3 Affichage visuel

```
┌────────────────────────────────────────────────────────────────────────┐
│ Eng. │ Liq. ant. │ Liq. actuelle │    Cumul    │ Restant à liquider   │
│ 5M   │    2M     │     1.5M      │    3.5M     │      1.5M ✓          │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Règle

⚠️ **Le montant de la liquidation ne peut pas dépasser le restant à liquider.**

---

## 5. Workflow de validation

### 5.1 Étapes (4 étapes)

| Étape | Rôle | Action |
|-------|------|--------|
| 1 | `SAF` | Vérification documents |
| 2 | `CB` | Contrôle budgétaire |
| 3 | `DAF` | Validation financière |
| 4 | `DG` | Validation finale |

### 5.2 Diagramme

```
┌─────────────────┐
│   BROUILLON     │ ← Agent crée + upload documents
└────────┬────────┘
         │ (Documents obligatoires OK ?)
         │ Soumettre
         ▼
┌─────────────────┐
│ ÉTAPE 1: SAF    │ ← Vérifie facture, PV, BL
└────────┬────────┘
         ▼
┌─────────────────┐
│ ÉTAPE 2: CB     │ ← Contrôle imputation
└────────┬────────┘
         ▼
┌─────────────────┐
│ ÉTAPE 3: DAF    │ ← Calculs fiscaux OK
└────────┬────────┘
         ▼
┌─────────────────┐
│ ÉTAPE 4: DG     │
└────────┬────────┘
         │ Valider finale
         ▼
┌─────────────────┐
│     VALIDE      │ → Vers Ordonnancement
└─────────────────┘
         │
         ▼ Mise à jour budget_line.total_liquide
```

---

## 6. Sécurité (RLS)

```sql
-- Lecture : Tous authentifiés
CREATE POLICY "liquidations_select" ON budget_liquidations
FOR SELECT USING (true);

-- Modification : Créateur ou validateurs
CREATE POLICY "liquidations_update" ON budget_liquidations
FOR UPDATE USING (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'CB')
  OR has_role(auth.uid(), 'DAF')
);
```

---

## 7. Hooks React

### 7.1 Hook principal : `useLiquidations`

| Export | Type | Description |
|--------|------|-------------|
| `liquidations` | `Liquidation[]` | Liste |
| `engagementsValides` | `Engagement[]` | Engagements disponibles |
| `createLiquidation` | `function` | Créer |
| `validateLiquidation` | `function` | Valider étape |
| `rejectLiquidation` | `function` | Rejeter |
| `calculateAvailability` | `function` | Calculer restant |
| `isCreating` | `boolean` | État |

### 7.2 Constantes exportées

```typescript
export const DOCUMENTS_REQUIS = [...];
```

### 7.3 Fichiers sources

```
src/hooks/useLiquidations.ts   # Hook principal (~602 lignes)
```

---

## 8. Pages et Composants

### 8.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/liquidations` | `Liquidations.tsx` | Liste et gestion |

### 8.2 Composants

| Composant | Description |
|-----------|-------------|
| `LiquidationForm.tsx` | Formulaire avec upload (~477 lignes) |
| `LiquidationList.tsx` | Liste avec filtres |
| `LiquidationDetails.tsx` | Vue détaillée |
| `LiquidationValidateDialog.tsx` | Dialog validation |
| `LiquidationRejectDialog.tsx` | Dialog rejet |
| `LiquidationDeferDialog.tsx` | Dialog report |

### 8.3 Arborescence

```
src/
├── pages/
│   └── Liquidations.tsx
└── components/
    └── liquidation/
        ├── LiquidationForm.tsx
        ├── LiquidationList.tsx
        ├── LiquidationDetails.tsx
        ├── LiquidationValidateDialog.tsx
        ├── LiquidationRejectDialog.tsx
        └── LiquidationDeferDialog.tsx
```

---

## 9. API Supabase - Exemples

### 9.1 Créer une liquidation

```typescript
const { data, error } = await supabase
  .from("budget_liquidations")
  .insert({
    engagement_id: "uuid-engagement",
    montant: 5000000,
    montant_ht: 4237288,
    tva_taux: 18,
    tva_montant: 762712,
    airsi_taux: 5.5,
    airsi_montant: 233050,
    retenue_source_taux: 0,
    retenue_source_montant: 0,
    net_a_payer: 4766950,
    regime_fiscal: "reel_normal",
    reference_facture: "FAC-2026-001234",
    service_fait: true,
    service_fait_date: "2026-02-20",
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
  .from("budget_liquidations")
  .select(`
    *,
    engagement:budget_engagements(
      id, numero, objet, montant, fournisseur,
      budget_line:budget_lines(code, label),
      marche:marches(numero, prestataire:prestataires(raison_sociale))
    ),
    attachments:liquidation_attachments(*)
  `)
  .eq("exercice", 2026)
  .order("created_at", { ascending: false });
```

### 9.3 Calculer disponibilité

```typescript
const calculateAvailability = async (engagementId: string, montant: number) => {
  // Montant de l'engagement
  const { data: engagement } = await supabase
    .from("budget_engagements")
    .select("montant")
    .eq("id", engagementId)
    .single();

  // Liquidations antérieures sur cet engagement
  const { data: liquidations } = await supabase
    .from("budget_liquidations")
    .select("montant")
    .eq("engagement_id", engagementId)
    .in("statut", ["valide", "en_validation"]);

  const montantEngage = engagement.montant;
  const liquidationsAnterieures = liquidations?.reduce((s, l) => s + l.montant, 0) || 0;
  const restant = montantEngage - liquidationsAnterieures;

  return {
    montant_engage: montantEngage,
    liquidations_anterieures: liquidationsAnterieures,
    liquidation_actuelle: montant,
    cumul: liquidationsAnterieures + montant,
    restant_a_liquider: restant - montant,
    is_valid: montant <= restant,
  };
};
```

---

## 10. Régimes fiscaux

| Régime | Description |
|--------|-------------|
| `reel_normal` | Régime réel normal |
| `reel_simplifie` | Régime réel simplifié |
| `synthetique` | Impôt synthétique |
| `exonere` | Exonéré |

---

## 11. Intégration avec autres modules

### 11.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Engagements | Engagement validé |

### 11.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Ordonnancements | Liquidation validée |
| Budget Lines | Mise à jour `total_liquide` |

---

## 12. Points ouverts / TODOs

- [ ] Stockage réel des fichiers (Supabase Storage)
- [ ] Scan OCR des factures
- [ ] Calcul automatique des retenues selon fournisseur
- [ ] Génération PDF bordereau de liquidation
- [ ] Workflow de service fait séparé

---

## 13. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
