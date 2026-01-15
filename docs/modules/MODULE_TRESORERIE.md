# Trésorerie - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

Le module **Trésorerie** gère les comptes bancaires, les opérations de trésorerie, et le plan de trésorerie prévisionnel. Il assure le suivi des liquidités et la planification des paiements.

### Rôle principal

- Gérer les comptes bancaires de l'organisation
- Enregistrer les opérations (entrées/sorties)
- Suivre les soldes en temps réel
- Planifier la trésorerie

---

## 2. Architecture

### 2.1 Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `comptes_bancaires` | Comptes bancaires | `id` (UUID) |
| `operations_tresorerie` | Mouvements | `id` (UUID) |

### 2.2 Colonnes de `comptes_bancaires`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `code` | text | Non | Code compte |
| `libelle` | text | Non | Nom du compte |
| `banque` | text | Oui | Nom de la banque |
| `numero_compte` | text | Oui | N° compte |
| `iban` | text | Oui | IBAN |
| `bic` | text | Oui | BIC/SWIFT |
| `type_compte` | varchar | Oui | Type |
| `devise` | varchar | Oui | Devise (XOF) |
| `solde_initial` | numeric | Oui | Solde initial |
| `solde_actuel` | numeric | Oui | Solde actuel |
| `est_actif` | boolean | Oui | Compte actif |

### 2.3 Types de comptes

```typescript
const TYPES_COMPTE = [
  { value: "courant", label: "Compte courant" },
  { value: "epargne", label: "Compte épargne" },
  { value: "caisse", label: "Caisse" },
  { value: "special", label: "Compte spécial" },
];
```

### 2.4 Colonnes de `operations_tresorerie`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant |
| `compte_id` | uuid | Non | Compte concerné |
| `type_operation` | varchar | Non | Type (entrée/sortie) |
| `montant` | numeric | Non | Montant |
| `date_operation` | date | Non | Date |
| `date_valeur` | date | Oui | Date valeur bancaire |
| `libelle` | text | Non | Libellé |
| `reference` | text | Oui | Référence |
| `reglement_id` | uuid | Oui | Règlement lié |
| `rapproche` | boolean | Oui | Rapprochement bancaire |

### 2.5 Types d'opérations

```typescript
const TYPES_OPERATION = [
  { value: "entree", label: "Entrée", color: "green" },
  { value: "sortie", label: "Sortie", color: "red" },
  { value: "virement", label: "Virement interne", color: "blue" },
];
```

---

## 3. Calcul des soldes

### 3.1 Formule

```
Solde Actuel = Solde Initial + Entrées - Sorties
```

### 3.2 Mise à jour automatique

Après chaque opération :

```typescript
// Trigger ou après insert
if (type_operation === "entree") {
  solde_actuel += montant;
} else if (type_operation === "sortie") {
  solde_actuel -= montant;
}
```

---

## 4. Plan de trésorerie

### 4.1 Prévisions

Le plan de trésorerie prévoit :

- **Encaissements prévus** : Recettes attendues
- **Décaissements prévus** : Règlements à effectuer (ordonnancements validés)
- **Solde prévisionnel** : Solde actuel + encaissements - décaissements

### 4.2 Périodes

| Période | Description |
|---------|-------------|
| 7 jours | Court terme |
| 30 jours | Mensuel |
| 90 jours | Trimestriel |

---

## 5. Dashboard Trésorerie

### 5.1 KPIs

```typescript
interface TresorerieStats {
  soldeTotal: number;           // Somme tous comptes
  entreesMonth: number;         // Entrées du mois
  sortiesMonth: number;         // Sorties du mois
  comptesActifs: number;        // Nombre comptes actifs
  ordresAPayer: number;         // Ordonnancements en attente
  montantOrdresAPayer: number;  // Montant total à payer
}
```

### 5.2 Composant page

```tsx
<GestionTresorerie />
// - Cards KPIs
// - Tabs : Comptes | Opérations | Plan
```

---

## 6. Hooks React

### 6.1 Hook principal : `useTresorerie`

| Export | Type | Description |
|--------|------|-------------|
| `comptes` | `CompteBancaire[]` | Liste comptes |
| `operations` | `Operation[]` | Opérations |
| `stats` | `TresorerieStats` | Statistiques |
| `createCompte` | `function` | Créer compte |
| `updateCompte` | `function` | Modifier |
| `createOperation` | `function` | Créer opération |

### 6.2 Fichiers sources

```
src/hooks/useTresorerie.ts   # Hook principal
```

---

## 7. Pages et Composants

### 7.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/tresorerie` | `GestionTresorerie.tsx` | Dashboard trésorerie |

### 7.2 Composants

| Composant | Description |
|-----------|-------------|
| `CompteBancaireList.tsx` | Liste des comptes |
| `OperationTresorerieList.tsx` | Liste opérations |
| `PlanTresorerie.tsx` | Plan prévisionnel |

### 7.3 Arborescence

```
src/
├── pages/
│   └── tresorerie/
│       └── GestionTresorerie.tsx
└── components/
    └── tresorerie/
        ├── CompteBancaireList.tsx
        ├── OperationTresorerieList.tsx
        └── PlanTresorerie.tsx
```

---

## 8. API Supabase - Exemples

### 8.1 Récupérer les comptes

```typescript
const { data, error } = await supabase
  .from("comptes_bancaires")
  .select("*")
  .eq("est_actif", true)
  .order("libelle");
```

### 8.2 Créer une opération

```typescript
const { data, error } = await supabase
  .from("operations_tresorerie")
  .insert({
    compte_id: "uuid-compte",
    type_operation: "sortie",
    montant: 4766950,
    date_operation: "2026-03-05",
    libelle: "Paiement facture TECH SOLUTIONS",
    reference: "REG-2026-0001",
    reglement_id: "uuid-reglement",
  })
  .select()
  .single();
```

### 8.3 Calculer solde total

```typescript
const { data } = await supabase
  .from("comptes_bancaires")
  .select("solde_actuel")
  .eq("est_actif", true);

const soldeTotal = data?.reduce((sum, c) => sum + (c.solde_actuel || 0), 0) || 0;
```

---

## 9. Rapprochement bancaire

### 9.1 Principe

Marquer les opérations comme "rapprochées" quand elles correspondent au relevé bancaire.

### 9.2 Champ `rapproche`

```typescript
// Marquer comme rapproché
await supabase
  .from("operations_tresorerie")
  .update({ rapproche: true })
  .eq("id", operationId);
```

---

## 10. Intégration avec autres modules

### 10.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Règlements | Opération de sortie |
| Recettes | Opération d'entrée |

### 10.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Règlements | Comptes disponibles |
| Dashboard | Indicateurs trésorerie |

---

## 11. Points ouverts / TODOs

- [ ] Import relevés bancaires (MT940)
- [ ] Rapprochement automatique
- [ ] Alertes seuils de trésorerie
- [ ] Prévisions IA
- [ ] Multi-devises

---

## 12. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
