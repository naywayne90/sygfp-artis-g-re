# Expression de Besoin - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

L'**Expression de Besoin** est la formalisation détaillée d'un besoin à satisfaire. Elle précise les spécifications, le calendrier, et prépare la phase de contractualisation.

### Position dans la chaîne

```
... → Imputation → [Expression Besoin] → Marché → Engagement → ...
```

### Rôle principal

- Décrire précisément le besoin (spécifications techniques)
- Définir le calendrier de réalisation
- Justifier le besoin
- Rattacher à un marché validé (pour exécution)
- Préparer la passation de marché ou l'achat direct

---

## 2. Architecture

### 2.1 Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `expressions_besoin` | Expressions de besoin | `id` (UUID) |
| `expression_besoin_attachments` | Pièces jointes | `id` (UUID) |

### 2.2 Colonnes clés de `expressions_besoin`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `numero` | text | Oui | Numéro auto-généré |
| `objet` | text | Non | Objet du besoin |
| `description` | text | Oui | Description détaillée |
| `justification` | text | Oui | Pourquoi ce besoin |
| `specifications` | text | Oui | Spécifications techniques |
| `calendrier_debut` | date | Oui | Date début souhaitée |
| `calendrier_fin` | date | Oui | Date fin souhaitée |
| `montant_estime` | numeric | Oui | Montant estimé (FCFA) |
| `urgence` | varchar | Oui | Niveau d'urgence |
| `marche_id` | uuid | Oui | Marché rattaché |
| `dossier_id` | uuid | Oui | Dossier parent |
| `direction_id` | uuid | Oui | Direction demandeuse |
| `statut` | varchar | Oui | État du workflow |
| `current_step` | integer | Oui | Étape de validation actuelle |
| `exercice` | integer | Oui | Exercice budgétaire |

### 2.3 Niveaux d'urgence

```typescript
const URGENCE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
  { value: "tres_urgent", label: "Très urgent" },
];
```

### 2.4 Statuts possibles

```
brouillon → soumis → en_validation → valide
                              ↘ rejete
                              ↘ differe
```

---

## 3. Workflow de validation

### 3.1 Étapes de validation (4 étapes)

| Étape | Rôle | Action |
|-------|------|--------|
| 1 | `DEMANDEUR` | Création et soumission |
| 2 | `CHEF_SERVICE` | Validation technique |
| 3 | `DIRECTEUR` | Validation hiérarchique |
| 4 | `CB` | Validation budgétaire |

### 3.2 Diagramme

```
┌─────────────────┐
│   BROUILLON     │ ← Agent / Demandeur
└────────┬────────┘
         │ Soumettre
         ▼
┌─────────────────┐
│ ÉTAPE 1: CHEF   │
│ SERVICE         │
└────────┬────────┘
         │ Valider
         ▼
┌─────────────────┐
│ ÉTAPE 2:        │
│ DIRECTEUR       │
└────────┬────────┘
         │ Valider
         ▼
┌─────────────────┐
│ ÉTAPE 3: CB     │ ← Contrôle budgétaire
└────────┬────────┘
         │ Valider finale
         ▼
┌─────────────────┐
│     VALIDE      │ → Vers Engagement
└─────────────────┘
```

---

## 4. Sécurité (RLS)

### 4.1 Policies principales

```sql
-- Lecture : Utilisateurs authentifiés
CREATE POLICY "expressions_besoin_select" ON expressions_besoin
FOR SELECT USING (true);

-- Création : Utilisateurs authentifiés
CREATE POLICY "expressions_besoin_insert" ON expressions_besoin
FOR INSERT WITH CHECK (true);

-- Modification : Créateur ou validateurs
CREATE POLICY "expressions_besoin_update" ON expressions_besoin
FOR UPDATE USING (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'DIRECTEUR')
  OR has_role(auth.uid(), 'CB')
);
```

---

## 5. Hooks React

### 5.1 Hook principal : `useExpressionsBesoin`

| Export | Type | Description |
|--------|------|-------------|
| `expressions` | `ExpressionBesoin[]` | Liste des expressions |
| `marchesValides` | `MarcheValide[]` | Marchés validés disponibles |
| `createExpression` | `function` | Créer une expression |
| `updateExpression` | `function` | Modifier |
| `submitExpression` | `function` | Soumettre |
| `validateExpression` | `function` | Valider (étape courante) |
| `rejectExpression` | `function` | Rejeter |
| `deferExpression` | `function` | Différer |
| `isCreating` | `boolean` | État de création |

### 5.2 Constantes exportées

```typescript
export const URGENCE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
  { value: "tres_urgent", label: "Très urgent" },
];
```

### 5.3 Fichiers sources

```
src/hooks/useExpressionsBesoin.ts   # Hook principal (~399 lignes)
```

---

## 6. Pages et Composants

### 6.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/expression-besoin` | `ExpressionBesoin.tsx` | Liste et gestion |

### 6.2 Composants

| Composant | Description |
|-----------|-------------|
| `ExpressionBesoinForm.tsx` | Formulaire création (~406 lignes) |
| `ExpressionBesoinList.tsx` | Liste avec filtres |
| `ExpressionBesoinDetails.tsx` | Vue détaillée |
| `ExpressionBesoinValidateDialog.tsx` | Dialog validation |
| `ExpressionBesoinRejectDialog.tsx` | Dialog rejet |
| `ExpressionBesoinDeferDialog.tsx` | Dialog report |

### 6.3 Arborescence

```
src/
├── pages/
│   └── execution/
│       └── ExpressionBesoin.tsx
└── components/
    └── expression-besoin/
        ├── ExpressionBesoinForm.tsx
        ├── ExpressionBesoinList.tsx
        ├── ExpressionBesoinDetails.tsx
        ├── ExpressionBesoinValidateDialog.tsx
        ├── ExpressionBesoinRejectDialog.tsx
        └── ExpressionBesoinDeferDialog.tsx
```

---

## 7. API Supabase - Exemples

### 7.1 Créer une Expression de Besoin

```typescript
const { data, error } = await supabase
  .from("expressions_besoin")
  .insert({
    marche_id: "uuid-marche",
    objet: "Fourniture de matériel informatique",
    description: "Description détaillée du besoin...",
    justification: "Renouvellement du parc informatique",
    specifications: "PC portables, écrans 24 pouces...",
    calendrier_debut: "2026-03-01",
    calendrier_fin: "2026-04-15",
    montant_estime: 5000000,
    urgence: "normal",
    exercice: 2026,
    statut: "brouillon",
    current_step: 0,
  })
  .select()
  .single();
```

### 7.2 Récupérer les Expressions avec relations

```typescript
const { data, error } = await supabase
  .from("expressions_besoin")
  .select(`
    *,
    marche:marches(id, numero, objet, montant, prestataire:prestataires(raison_sociale)),
    direction:directions(id, label, sigle),
    created_by_profile:profiles(first_name, last_name)
  `)
  .eq("exercice", 2026)
  .order("created_at", { ascending: false });
```

### 7.3 Valider une étape

```typescript
const nextStep = currentStep + 1;
const isLastStep = nextStep >= 4;

await supabase
  .from("expressions_besoin")
  .update({
    current_step: nextStep,
    statut: isLastStep ? "valide" : "en_validation",
    ...(isLastStep && {
      validated_at: new Date().toISOString(),
      validated_by: userId,
    }),
  })
  .eq("id", expressionId);
```

---

## 8. Liaison avec Marché

### 8.1 Principe

Une Expression de Besoin est généralement créée à partir d'un **marché validé**. Cela permet de :

- Pré-remplir les informations (objet, montant, fournisseur)
- Maintenir la traçabilité
- Faciliter l'engagement ultérieur

### 8.2 Sélection du marché

```typescript
// Marchés validés disponibles
const { data: marchesValides } = await supabase
  .from("marches")
  .select(`
    id, numero, objet, montant, mode_passation,
    prestataire:prestataires(id, raison_sociale)
  `)
  .eq("validation_status", "valide")
  .eq("exercice", exercice);
```

---

## 9. Gestion des Lots

### 9.1 Champs optionnels

```typescript
interface ExpressionBesoin {
  // ...
  numero_lot?: number;
  intitule_lot?: string;
}
```

### 9.2 Usage

Si le marché est alloti, l'expression de besoin peut préciser :
- Le numéro du lot concerné
- L'intitulé du lot

---

## 10. Intégration avec autres modules

### 10.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Marchés | Marché validé (objet, montant, prestataire) |
| Dossiers | Dossier ID (après imputation) |

### 10.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Engagements | Expression validée |

---

## 11. Points ouverts / TODOs

- [ ] Workflow de validation configurable
- [ ] Attachments (pièces jointes)
- [ ] Modèles d'expression pré-remplis
- [ ] Liaison directe sans marché (achats < seuil)
- [ ] Notifications aux validateurs

---

## 12. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
