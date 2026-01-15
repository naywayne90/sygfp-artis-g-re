# Approvisionnement (Stocks) - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

Le module **Approvisionnement** gère les stocks de fournitures et consommables. Il couvre le cycle complet : demandes d'achat, réceptions, mouvements de stock, et inventaires.

### Rôle principal

- Gérer le catalogue des articles
- Suivre les demandes d'achat
- Enregistrer les réceptions
- Tracer les mouvements de stock
- Réaliser les inventaires

---

## 2. Architecture

### 2.1 Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `articles` | Catalogue articles | `id` (UUID) |
| `demandes_achat` | Demandes d'achat | `id` (UUID) |
| `demande_achat_lignes` | Lignes de demande | `id` (UUID) |
| `receptions` | Réceptions | `id` (UUID) |
| `reception_lignes` | Lignes de réception | `id` (UUID) |
| `mouvements_stock` | Mouvements | `id` (UUID) |
| `inventaires` | Inventaires | `id` (UUID) |
| `inventaire_lignes` | Lignes d'inventaire | `id` (UUID) |

### 2.2 Colonnes de `articles`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant |
| `code` | text | Non | Code article |
| `libelle` | text | Non | Désignation |
| `description` | text | Oui | Description |
| `unite` | varchar | Non | Unité de mesure |
| `categorie` | varchar | Oui | Catégorie |
| `seuil_mini` | integer | Oui | Seuil alerte stock |
| `stock_actuel` | integer | Oui | Quantité en stock |
| `prix_unitaire_moyen` | numeric | Oui | PU moyen |
| `emplacement` | varchar | Oui | Localisation |
| `est_actif` | boolean | Oui | Article actif |

### 2.3 Unités de mesure

```typescript
export const UNITES = [
  "unité", "pièce", "kg", "litre", "mètre",
  "m²", "m³", "carton", "paquet", "boîte",
  "ramette", "lot",
];
```

### 2.4 Catégories

```typescript
export const CATEGORIES_ARTICLES = [
  "Fournitures de bureau",
  "Consommables informatiques",
  "Matériel informatique",
  "Mobilier",
  "Produits d'entretien",
  "Matériel électrique",
  "Outillage",
  "Pièces détachées",
  "Autres",
];
```

---

## 3. Types de mouvements

```typescript
export const TYPES_MOUVEMENTS = [
  { value: "entree", label: "Entrée", color: "green" },
  { value: "sortie", label: "Sortie", color: "red" },
  { value: "transfert", label: "Transfert", color: "blue" },
  { value: "ajustement", label: "Ajustement", color: "orange" },
];
```

---

## 4. Cycle d'approvisionnement

### 4.1 Diagramme

```
┌─────────────────┐
│ DEMANDE ACHAT   │ ← Agent crée demande
└────────┬────────┘
         │ Validation
         ▼
┌─────────────────┐
│    COMMANDE     │ ← Vers fournisseur (hors système)
└────────┬────────┘
         │ Livraison
         ▼
┌─────────────────┐
│   RÉCEPTION     │ ← Contrôle livraison
└────────┬────────┘
         │ Validation
         ▼
┌─────────────────┐
│   MOUVEMENT     │ ← Entrée stock automatique
│   (ENTRÉE)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  STOCK ACTUEL   │ ← Mise à jour quantité
└─────────────────┘
```

---

## 5. Demandes d'achat

### 5.1 Table `demandes_achat`

| Colonne | Type | Description |
|---------|------|-------------|
| `numero` | text | Numéro auto-généré |
| `objet` | text | Objet de la demande |
| `justification` | text | Justification |
| `urgence` | varchar | `normale`, `urgent`, `tres_urgent` |
| `statut` | varchar | État de la demande |
| `montant_estime` | numeric | Montant estimé |
| `direction_id` | uuid | Direction demandeuse |

### 5.2 Statuts

```
brouillon → soumis → validee → en_commande → livree
                   ↘ refusee
```

### 5.3 Lignes de demande

| Colonne | Type | Description |
|---------|------|-------------|
| `demande_id` | uuid | Demande parente |
| `article_id` | uuid | Article (optionnel) |
| `designation` | text | Désignation |
| `quantite` | integer | Quantité demandée |
| `unite` | varchar | Unité |
| `prix_unitaire_estime` | numeric | PU estimé |

---

## 6. Réceptions

### 6.1 Table `receptions`

| Colonne | Type | Description |
|---------|------|-------------|
| `numero` | text | Numéro auto-généré |
| `demande_id` | uuid | Demande liée |
| `fournisseur` | text | Nom fournisseur |
| `numero_bl` | text | N° Bon de livraison |
| `numero_facture` | text | N° Facture |
| `statut` | varchar | État |

### 6.2 Lignes de réception

| Colonne | Type | Description |
|---------|------|-------------|
| `reception_id` | uuid | Réception parente |
| `article_id` | uuid | Article |
| `quantite_commandee` | integer | Qté commandée |
| `quantite_recue` | integer | Qté reçue |
| `quantite_acceptee` | integer | Qté acceptée |
| `ecart` | integer | Écart |
| `motif_ecart` | text | Motif écart |
| `prix_unitaire` | numeric | PU réel |

### 6.3 Validation réception

La validation de la réception :
1. Crée automatiquement les mouvements d'entrée
2. Met à jour le stock des articles

```typescript
const validateReception = async (receptionId: string) => {
  // Pour chaque ligne de réception
  for (const ligne of reception.lignes) {
    // Créer mouvement d'entrée
    await supabase.from("mouvements_stock").insert({
      type_mouvement: "entree",
      article_id: ligne.article_id,
      quantite: ligne.quantite_acceptee,
      stock_avant: article.stock_actuel,
      stock_apres: article.stock_actuel + ligne.quantite_acceptee,
      motif: `Réception ${reception.numero}`,
      reception_id: receptionId,
    });
  }
  
  // Mettre à jour statut réception
  await supabase
    .from("receptions")
    .update({ statut: "validee" })
    .eq("id", receptionId);
};
```

---

## 7. Mouvements de stock

### 7.1 Table `mouvements_stock`

| Colonne | Type | Description |
|---------|------|-------------|
| `numero` | text | Numéro auto-généré |
| `type_mouvement` | varchar | Type (entrée/sortie/...) |
| `article_id` | uuid | Article concerné |
| `quantite` | integer | Quantité |
| `stock_avant` | integer | Stock avant mouvement |
| `stock_apres` | integer | Stock après mouvement |
| `motif` | text | Motif/justification |
| `reference_document` | text | Référence (BL, demande...) |
| `destination` | text | Destination (si transfert) |
| `beneficiaire` | text | Bénéficiaire (si sortie) |

### 7.2 Logique de calcul

```typescript
const createMouvement = async (mouvement) => {
  const stockAvant = article.stock_actuel;
  let stockApres = stockAvant;

  switch (mouvement.type_mouvement) {
    case "entree":
      stockApres = stockAvant + mouvement.quantite;
      break;
    case "sortie":
      if (mouvement.quantite > stockAvant) {
        throw new Error("Stock insuffisant");
      }
      stockApres = stockAvant - mouvement.quantite;
      break;
    case "ajustement":
      stockApres = mouvement.quantite; // Nouveau stock
      break;
  }

  // Insérer mouvement
  await supabase.from("mouvements_stock").insert({
    ...mouvement,
    stock_avant: stockAvant,
    stock_apres: stockApres,
  });
};
```

---

## 8. Inventaires

### 8.1 Table `inventaires`

| Colonne | Type | Description |
|---------|------|-------------|
| `numero` | text | Numéro auto-généré |
| `date_inventaire` | date | Date de l'inventaire |
| `libelle` | text | Libellé/description |
| `observations` | text | Observations |
| `statut` | varchar | État (brouillon/valide/cloture) |
| `cloture_at` | timestamptz | Date clôture |

### 8.2 Lignes d'inventaire

| Colonne | Type | Description |
|---------|------|-------------|
| `inventaire_id` | uuid | Inventaire parent |
| `article_id` | uuid | Article |
| `stock_theorique` | integer | Stock système |
| `stock_physique` | integer | Stock compté |
| `ecart` | integer | Différence |
| `justification` | text | Justification écart |
| `ajustement_effectue` | boolean | Régularisation faite |

---

## 9. Hooks React

### 9.1 Hook principal : `useApprovisionnement`

| Export | Type | Description |
|--------|------|-------------|
| `articles` | `Article[]` | Catalogue |
| `demandesAchat` | `DemandeAchat[]` | Demandes |
| `receptions` | `Reception[]` | Réceptions |
| `mouvements` | `MouvementStock[]` | Mouvements |
| `createArticle` | `function` | Créer article |
| `createDemandeAchat` | `function` | Créer demande |
| `createReception` | `function` | Créer réception |
| `validateReception` | `function` | Valider réception |
| `createMouvement` | `function` | Créer mouvement |

### 9.2 Fichiers sources

```
src/hooks/useApprovisionnement.ts   # Hook principal (~699 lignes)
```

---

## 10. Pages et Composants

### 10.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/approvisionnement` | `Approvisionnement.tsx` | Dashboard stocks |

### 10.2 Composants

| Composant | Description |
|-----------|-------------|
| `ArticleList.tsx` | Catalogue articles |
| `DemandeAchatList.tsx` | Liste demandes |
| `ReceptionList.tsx` | Liste réceptions |
| `MouvementList.tsx` | Liste mouvements |
| `InventaireList.tsx` | Liste inventaires |

### 10.3 Arborescence

```
src/
├── pages/
│   └── approvisionnement/
│       └── Approvisionnement.tsx
└── components/
    └── approvisionnement/
        ├── ArticleList.tsx
        ├── DemandeAchatList.tsx
        ├── ReceptionList.tsx
        ├── MouvementList.tsx
        └── InventaireList.tsx
```

---

## 11. Alertes stock

### 11.1 Alerte seuil minimum

```typescript
// Articles sous le seuil
const alertes = articles.filter(
  a => a.stock_actuel <= a.seuil_mini
);
```

### 11.2 Affichage

```tsx
{article.stock_actuel <= article.seuil_mini && (
  <Badge variant="destructive">Stock bas</Badge>
)}
```

---

## 12. API Supabase - Exemples

### 12.1 Récupérer les articles

```typescript
const { data, error } = await supabase
  .from("articles")
  .select("*")
  .eq("est_actif", true)
  .order("code");
```

### 12.2 Créer une demande avec lignes

```typescript
// 1. Créer la demande
const { data: demande } = await supabase
  .from("demandes_achat")
  .insert({ objet, justification, urgence, exercice })
  .select()
  .single();

// 2. Créer les lignes
const lignes = items.map(item => ({
  demande_id: demande.id,
  article_id: item.article_id,
  designation: item.designation,
  quantite: item.quantite,
  unite: item.unite,
}));

await supabase.from("demande_achat_lignes").insert(lignes);
```

---

## 13. Intégration avec autres modules

### 13.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Engagements | Demande d'achat liée |

### 13.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Liquidations | Référence réception |
| Dashboard | Indicateurs stocks |

---

## 14. Points ouverts / TODOs

- [ ] Gestion multi-magasins
- [ ] Valorisation des stocks (FIFO, PMP)
- [ ] Alertes automatiques email
- [ ] Codes-barres / QR codes
- [ ] Inventaire avec douchette

---

## 15. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
