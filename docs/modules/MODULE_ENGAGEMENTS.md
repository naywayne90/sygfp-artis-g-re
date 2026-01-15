# Engagements Budgétaires - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

L'**Engagement** est l'acte juridique par lequel l'ordonnateur crée ou constate une obligation de nature à entraîner une dépense. Il **réserve les crédits budgétaires** nécessaires au paiement de la dépense.

### Position dans la chaîne

```
... → Expression Besoin → [Engagement] → Liquidation → Ordonnancement → Règlement
```

### Rôle principal

- Réserver les crédits sur une ligne budgétaire
- Vérifier la disponibilité avant engagement
- Créer l'obligation juridique de payer
- Tracer le lien avec l'expression de besoin et le marché

---

## 2. Architecture

### 2.1 Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `budget_engagements` | Engagements budgétaires | `id` (UUID) |
| `engagement_validations` | Étapes de validation | `id` (UUID) |

### 2.2 Colonnes clés de `budget_engagements`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `numero` | text | Non | Numéro auto-généré |
| `objet` | text | Non | Objet de l'engagement |
| `montant` | numeric | Non | Montant TTC |
| `montant_ht` | numeric | Oui | Montant HT |
| `tva` | numeric | Oui | Montant TVA |
| `fournisseur` | text | Oui | Nom du fournisseur |
| `budget_line_id` | uuid | Non | **Ligne budgétaire** |
| `expression_besoin_id` | uuid | Oui | Expression de besoin source |
| `marche_id` | uuid | Oui | Marché associé |
| `dossier_id` | uuid | Oui | Dossier parent |
| `statut` | varchar | Oui | État du workflow |
| `current_step` | integer | Oui | Étape de validation |
| `workflow_status` | varchar | Oui | État workflow |
| `exercice` | integer | Oui | Exercice budgétaire |
| `date_engagement` | date | Non | Date de l'engagement |
| `code_locked` | boolean | Oui | Code verrouillé |

### 2.3 Statuts possibles

```
brouillon → soumis → en_validation → valide
                              ↘ rejete
                              ↘ differe
```

---

## 3. Calcul de disponibilité budgétaire

### 3.1 Formule

```
Disponible = Dotation + Virements_reçus - Virements_émis - Engagements_antérieurs
```

### 3.2 Interface TypeScript

```typescript
interface BudgetAvailability {
  dotation_initiale: number;
  engagements_anterieurs: number;
  engagement_actuel: number;
  cumul: number;
  disponible: number;
  is_sufficient: boolean;
}
```

### 3.3 Affichage visuel

```
┌─────────────────────────────────────────────────────────────────────┐
│ (A) Dotation │ (B) Eng. ant. │ (C) Actuel │ (D) Cumul │ (E) Dispo │
│  10 000 000  │   3 000 000   │  1 500 000 │ 4 500 000 │ 5 500 000 │
│              │    -rouge     │   -bleu    │           │   vert ✓  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Règle stricte

⚠️ **L'engagement est BLOQUÉ si le disponible est insuffisant.**

```typescript
if (availability && !availability.is_sufficient) {
  return; // Bloquer la création
}
```

---

## 4. Workflow de validation

### 4.1 Étapes (4 étapes)

| Étape | Rôle | Action |
|-------|------|--------|
| 1 | `SAF` | Vérification administrative |
| 2 | `CB` | Contrôle budgétaire |
| 3 | `DAF` | Validation financière |
| 4 | `DG` | Validation finale |

### 4.2 Diagramme

```
┌─────────────────┐
│   BROUILLON     │ ← Agent crée l'engagement
└────────┬────────┘
         │ Soumettre
         ▼
┌─────────────────┐     ┌─────────────────┐
│ ÉTAPE 1: SAF    │────▶│     REJETE      │
└────────┬────────┘     └─────────────────┘
         │ Valider
         ▼
┌─────────────────┐     ┌─────────────────┐
│ ÉTAPE 2: CB     │────▶│     DIFFERE     │
└────────┬────────┘     └─────────────────┘
         │ Valider
         ▼
┌─────────────────┐
│ ÉTAPE 3: DAF    │
└────────┬────────┘
         │ Valider
         ▼
┌─────────────────┐
│ ÉTAPE 4: DG     │
└────────┬────────┘
         │ Valider finale
         ▼
┌─────────────────┐
│     VALIDE      │ → Vers Liquidation
└─────────────────┘
         │
         ▼ Mise à jour budget_line.total_engage
```

### 4.3 Impact sur le budget

À la validation finale, le montant est ajouté à `total_engage` de la ligne :

```typescript
await supabase
  .from("budget_lines")
  .update({
    total_engage: supabase.raw("total_engage + ?", [montant])
  })
  .eq("id", budgetLineId);
```

---

## 5. Sécurité (RLS)

### 5.1 Policies principales

```sql
-- Lecture : Tous les utilisateurs authentifiés
CREATE POLICY "engagements_select" ON budget_engagements
FOR SELECT USING (true);

-- Création : Utilisateurs authentifiés
CREATE POLICY "engagements_insert" ON budget_engagements
FOR INSERT WITH CHECK (true);

-- Modification : Créateur ou validateurs
CREATE POLICY "engagements_update" ON budget_engagements
FOR UPDATE USING (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'CB')
  OR has_role(auth.uid(), 'DAF')
  OR has_role(auth.uid(), 'DG')
);
```

---

## 6. Hooks React

### 6.1 Hook principal : `useEngagements`

| Export | Type | Description |
|--------|------|-------------|
| `engagements` | `Engagement[]` | Liste des engagements |
| `expressionsValidees` | `Expression[]` | Expressions disponibles |
| `createEngagement` | `function` | Créer un engagement |
| `updateEngagement` | `function` | Modifier |
| `submitEngagement` | `function` | Soumettre |
| `validateEngagement` | `function` | Valider étape |
| `rejectEngagement` | `function` | Rejeter |
| `deferEngagement` | `function` | Différer |
| `calculateAvailability` | `function` | Calculer disponibilité |
| `isCreating` | `boolean` | État |

### 6.2 Fichiers sources

```
src/hooks/useEngagements.ts    # Hook principal (~646 lignes)
```

---

## 7. Pages et Composants

### 7.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/engagements` | `Engagements.tsx` | Liste et gestion |

### 7.2 Composants

| Composant | Description |
|-----------|-------------|
| `EngagementForm.tsx` | Formulaire création (~423 lignes) |
| `EngagementList.tsx` | Liste avec filtres |
| `EngagementDetails.tsx` | Vue détaillée |
| `EngagementValidateDialog.tsx` | Dialog validation |
| `EngagementRejectDialog.tsx` | Dialog rejet (~75 lignes) |
| `EngagementDeferDialog.tsx` | Dialog report (~92 lignes) |
| `EngagementPrintDialog.tsx` | Impression |
| `PieceEngagement.tsx` | Document officiel |

### 7.3 Arborescence

```
src/
├── pages/
│   └── Engagements.tsx
└── components/
    └── engagement/
        ├── EngagementForm.tsx
        ├── EngagementList.tsx
        ├── EngagementDetails.tsx
        ├── EngagementValidateDialog.tsx
        ├── EngagementRejectDialog.tsx
        ├── EngagementDeferDialog.tsx
        ├── EngagementPrintDialog.tsx
        └── PieceEngagement.tsx
```

---

## 8. API Supabase - Exemples

### 8.1 Créer un engagement

```typescript
const { data, error } = await supabase
  .from("budget_engagements")
  .insert({
    expression_besoin_id: "uuid-expression",
    budget_line_id: "uuid-ligne",
    objet: "Achat matériel informatique",
    montant: 5000000,
    montant_ht: 4237288,
    tva: 762712,
    fournisseur: "TECH SOLUTIONS SARL",
    marche_id: "uuid-marche",
    dossier_id: "uuid-dossier",
    date_engagement: "2026-02-15",
    exercice: 2026,
    statut: "brouillon",
    current_step: 0,
  })
  .select()
  .single();
```

### 8.2 Récupérer avec relations

```typescript
const { data, error } = await supabase
  .from("budget_engagements")
  .select(`
    *,
    budget_line:budget_lines(id, code, label, dotation_initiale, total_engage),
    expression:expressions_besoin(id, numero, objet),
    marche:marches(id, numero, objet, prestataire:prestataires(raison_sociale)),
    created_by_profile:profiles(first_name, last_name)
  `)
  .eq("exercice", 2026)
  .order("created_at", { ascending: false });
```

### 8.3 Calculer la disponibilité

```typescript
const calculateAvailability = async (
  budgetLineId: string, 
  montant: number
): Promise<BudgetAvailability> => {
  // 1. Récupérer la ligne budgétaire
  const { data: line } = await supabase
    .from("budget_lines")
    .select("dotation_initiale, total_engage")
    .eq("id", budgetLineId)
    .single();

  // 2. Calculer les virements
  const { data: virementsRecus } = await supabase
    .from("credit_transfers")
    .select("amount")
    .eq("to_budget_line_id", budgetLineId)
    .eq("status", "execute");

  const { data: virementsEmis } = await supabase
    .from("credit_transfers")
    .select("amount")
    .eq("from_budget_line_id", budgetLineId)
    .eq("status", "execute");

  // 3. Calculer
  const dotation = line.dotation_initiale;
  const recus = virementsRecus?.reduce((s, v) => s + v.amount, 0) || 0;
  const emis = virementsEmis?.reduce((s, v) => s + v.amount, 0) || 0;
  const engages = line.total_engage || 0;
  const disponible = dotation + recus - emis - engages;

  return {
    dotation_initiale: dotation,
    engagements_anterieurs: engages,
    engagement_actuel: montant,
    cumul: engages + montant,
    disponible: disponible - montant,
    is_sufficient: disponible >= montant,
  };
};
```

---

## 9. Liens Lambda (Traçabilité)

### 9.1 Concept

Les "Liens Lambda" assurent la traçabilité entre les modules :

```typescript
// Vérifier si le lien expression→engagement est actif
const isLinkActive = linkTypes.find(
  lt => lt.code === 'expression_to_engagement'
)?.actif ?? true;
```

### 9.2 Affichage

```tsx
<Card className="bg-primary/5 border-primary/20">
  <CardContent>
    <div className="flex items-center gap-2">
      <Link2 className="h-4 w-4 text-primary" />
      <h4>Source (Lien Lambda)</h4>
      <Badge>{isLinkActive ? 'Liaison active' : 'Liaison désactivée'}</Badge>
    </div>
    <div>
      <span>Type:</span> <Badge>Expression de besoin</Badge>
    </div>
    <div>
      <span>ID Source:</span> <code>{expression.numero}</code>
    </div>
  </CardContent>
</Card>
```

---

## 10. Intégration avec autres modules

### 10.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Expression Besoin | Expression validée |
| Marchés | Marché attribué |
| Budget Lines | Ligne budgétaire cible |

### 10.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Liquidations | Engagement validé |
| Budget Lines | Mise à jour `total_engage` |

---

## 11. Points ouverts / TODOs

- [ ] Engagement prévisionnel (avant marché)
- [ ] Modification d'engagement validé (avec workflow)
- [ ] Annulation d'engagement (libération crédits)
- [ ] Génération PDF fiche d'engagement
- [ ] Historique des modifications

---

## 12. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
