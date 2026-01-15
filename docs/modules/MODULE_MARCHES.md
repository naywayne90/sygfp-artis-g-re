# Marchés Publics - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

Le module **Marchés** gère la passation des marchés publics selon les procédures réglementaires. Il permet de créer, suivre et valider les marchés avant leur exécution.

### Position dans la chaîne

```
... → Imputation → Expression Besoin → [Marché] → Engagement → ...
```

### Rôle principal

- Créer les marchés avec les informations de passation
- Gérer les différents types de procédures
- Suivre les offres et attribuer les marchés
- Valider les marchés avant engagement
- Générer les documents contractuels

---

## 2. Architecture

### 2.1 Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `marches` | Marchés publics | `id` (UUID) |
| `marche_validations` | Étapes de validation | `id` (UUID) |
| `marche_lots` | Allotissement | `id` (UUID) |
| `marche_offres` | Offres reçues | `id` (UUID) |
| `soumissions` | Soumissions (ancien) | `id` (UUID) |

### 2.2 Colonnes clés de `marches`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `numero` | text | Oui | Numéro auto-généré |
| `objet` | text | Non | Objet du marché |
| `montant` | numeric | Non | Montant total |
| `type_marche` | varchar | Oui | Type de marché |
| `type_procedure` | varchar | Oui | Procédure de passation |
| `mode_passation` | varchar | Oui | Mode de passation |
| `prestataire_id` | uuid | Oui | Attributaire |
| `note_id` | uuid | Oui | Note d'origine |
| `dossier_id` | uuid | Oui | Dossier lié |
| `validation_status` | varchar | Oui | État de validation |
| `current_step` | integer | Oui | Étape actuelle |
| `date_attribution` | date | Oui | Date d'attribution |
| `duree_execution` | integer | Oui | Durée en jours |
| `exercice` | integer | Oui | Exercice budgétaire |

### 2.3 Types de marchés

```typescript
export const TYPES_MARCHE = [
  { value: "fourniture", label: "Fournitures" },
  { value: "services", label: "Services" },
  { value: "travaux", label: "Travaux" },
  { value: "prestations_intellectuelles", label: "Prestations intellectuelles" },
];
```

### 2.4 Types de procédures

```typescript
export const TYPES_PROCEDURE = [
  { value: "appel_offres_ouvert", label: "Appel d'offres ouvert" },
  { value: "appel_offres_restreint", label: "Appel d'offres restreint" },
  { value: "consultation", label: "Consultation restreinte" },
  { value: "gre_a_gre", label: "Gré à gré" },
  { value: "demande_cotation", label: "Demande de cotation" },
];
```

---

## 3. Workflow de validation

### 3.1 Étapes (4 étapes)

| Étape | Rôle | Action |
|-------|------|--------|
| 1 | `ASSISTANT_SDPM` | Préparation technique |
| 2 | `SDPM` | Validation procédure |
| 3 | `SDCT` | Contrôle technique |
| 4 | `CB` | Validation budgétaire finale |

### 3.2 Diagramme

```
┌─────────────────┐
│   BROUILLON     │ ← Création
└────────┬────────┘
         │ Soumettre
         ▼
┌─────────────────┐
│ ÉTAPE 1:        │
│ ASSISTANT_SDPM  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ÉTAPE 2: SDPM   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ÉTAPE 3: SDCT   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ÉTAPE 4: CB     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     VALIDE      │ → Vers Expression Besoin / Engagement
└─────────────────┘
```

---

## 4. Documents requis

```typescript
export const DOCUMENTS_REQUIS_MARCHE = [
  { code: "proforma", label: "Proforma / Devis", obligatoire: true },
  { code: "fiche_contrat", label: "Fiche de contrat", obligatoire: true },
  { code: "bon_commande", label: "Bon de commande", obligatoire: true },
  { code: "pv_reception", label: "PV de réception", obligatoire: false },
  { code: "attestation_service_fait", label: "Attestation service fait", obligatoire: false },
];
```

---

## 5. Gestion des offres

### 5.1 Table `marche_offres`

| Colonne | Type | Description |
|---------|------|-------------|
| `marche_id` | uuid | Marché concerné |
| `prestataire_id` | uuid | Soumissionnaire |
| `montant_offre` | numeric | Montant proposé |
| `note_technique` | numeric | Note technique |
| `note_financiere` | numeric | Note financière |
| `note_globale` | numeric | Note pondérée |
| `is_selected` | boolean | Offre retenue |

### 5.2 Calcul de la note globale

```typescript
note_globale = (note_technique * 0.7) + (note_financiere * 0.3)
```

### 5.3 Sélection du lauréat

```typescript
const selectWinner = async (offreId: string) => {
  // 1. Marquer l'offre comme sélectionnée
  await supabase
    .from("marche_offres")
    .update({ is_selected: true })
    .eq("id", offreId);

  // 2. Mettre à jour le marché avec le prestataire
  await supabase
    .from("marches")
    .update({ 
      prestataire_id: offre.prestataire_id,
      validation_status: "attribue"
    })
    .eq("id", marcheId);
};
```

---

## 6. Procédure de gré à gré

### 6.1 Justification obligatoire

Quand `type_procedure === "gre_a_gre"`, une justification est **obligatoire** :

```typescript
if (needsJustification && !formData.justification_derogation) {
  return; // Bloquer la soumission
}
```

### 6.2 Cas autorisés

- Urgence impérieuse
- Fournisseur unique
- Montant < seuil réglementaire
- Extension de marché existant

---

## 7. Hooks React

### 7.1 Hook principal : `useMarches`

| Export | Type | Description |
|--------|------|-------------|
| `marches` | `Marche[]` | Liste des marchés |
| `prestataires` | `Prestataire[]` | Fournisseurs actifs |
| `notesImputees` | `Note[]` | Notes imputées disponibles |
| `createMarche` | `function` | Créer un marché |
| `updateMarche` | `function` | Modifier |
| `submitMarche` | `function` | Soumettre |
| `validateMarche` | `function` | Valider étape |
| `rejectMarche` | `function` | Rejeter |
| `isCreating` | `boolean` | État |

### 7.2 Hook des offres : `useMarcheOffres`

| Export | Type | Description |
|--------|------|-------------|
| `offres` | `MarcheOffre[]` | Offres du marché |
| `winnerOffre` | `MarcheOffre?` | Offre sélectionnée |
| `createOffre` | `function` | Ajouter une offre |
| `updateOffre` | `function` | Modifier offre |
| `selectWinner` | `function` | Sélectionner lauréat |
| `deleteOffre` | `function` | Supprimer offre |

### 7.3 Fichiers sources

```
src/hooks/useMarches.ts        # Hook principal (~513 lignes)
src/hooks/useMarcheOffres.ts   # Gestion offres (~193 lignes)
```

---

## 8. Pages et Composants

### 8.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/marches` | `Marches.tsx` | Liste et gestion |

### 8.2 Composants

| Composant | Description |
|-----------|-------------|
| `MarcheForm.tsx` | Formulaire création (~506 lignes) |
| `MarcheList.tsx` | Liste avec filtres |
| `MarcheDetails.tsx` | Vue détaillée |
| `MarcheOffresList.tsx` | Gestion des offres |
| `MarcheValidateDialog.tsx` | Dialog validation |
| `MarcheRejectDialog.tsx` | Dialog rejet |
| `MarcheDeferDialog.tsx` | Dialog report |

### 8.3 Arborescence

```
src/
├── pages/
│   └── Marches.tsx
└── components/
    └── marches/
        ├── MarcheForm.tsx
        ├── MarcheList.tsx
        ├── MarcheDetails.tsx
        ├── MarcheOffresList.tsx
        ├── MarcheValidateDialog.tsx
        ├── MarcheRejectDialog.tsx
        └── MarcheDeferDialog.tsx
```

---

## 9. API Supabase - Exemples

### 9.1 Créer un marché

```typescript
const { data, error } = await supabase
  .from("marches")
  .insert({
    objet: "Fourniture de matériel informatique",
    montant: 10000000,
    type_marche: "fourniture",
    type_procedure: "consultation",
    mode_passation: "consultation",
    note_id: "uuid-note",
    prestataire_id: "uuid-prestataire",
    nombre_lots: 1,
    duree_execution: 45,
    exercice: 2026,
    validation_status: "brouillon",
    current_step: 0,
  })
  .select()
  .single();
```

### 9.2 Récupérer avec relations

```typescript
const { data, error } = await supabase
  .from("marches")
  .select(`
    *,
    prestataire:prestataires(id, raison_sociale, code),
    note:notes_dg(id, numero, objet),
    offres:marche_offres(*, prestataire:prestataires(raison_sociale))
  `)
  .eq("exercice", 2026)
  .order("created_at", { ascending: false });
```

---

## 10. Allotissement

### 10.1 Table `marche_lots`

| Colonne | Type | Description |
|---------|------|-------------|
| `marche_id` | uuid | Marché parent |
| `numero_lot` | integer | N° du lot |
| `intitule` | text | Description |
| `montant` | numeric | Montant du lot |
| `prestataire_id` | uuid | Attributaire du lot |

### 10.2 Usage

```typescript
// Marché avec plusieurs lots
const marche = {
  objet: "Réhabilitation bâtiment",
  nombre_lots: 3,
  // Lots créés séparément
};

// Créer les lots
const lots = [
  { numero_lot: 1, intitule: "Gros œuvre", montant: 5000000 },
  { numero_lot: 2, intitule: "Électricité", montant: 2000000 },
  { numero_lot: 3, intitule: "Plomberie", montant: 1500000 },
];
```

---

## 11. Intégration avec autres modules

### 11.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Notes DG | Note imputée (objet, montant) |
| Prestataires | Fournisseur sélectionné |

### 11.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Expression Besoin | Marché validé |
| Contrats | Marché attribué |
| Engagements | Référence marché |

---

## 12. Points ouverts / TODOs

- [ ] Génération PDF des documents de marché
- [ ] Gestion des avenants de marché
- [ ] Publication appel d'offres
- [ ] Portail fournisseurs pour soumissions
- [ ] Signature électronique

---

## 13. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
