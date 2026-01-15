# Règlements - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

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

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `reglements` | Règlements effectués | `id` (UUID) |
| `reglement_attachments` | Preuves de paiement | `id` (UUID) |

### 2.2 Colonnes clés de `reglements`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `numero` | text | Non | Numéro auto-généré |
| `ordonnancement_id` | uuid | Non | **Ordonnancement source** |
| `date_paiement` | date | Non | Date du paiement |
| `montant` | numeric | Non | Montant payé |
| `mode_paiement` | varchar | Non | Mode utilisé |
| `reference_paiement` | text | Oui | N° chèque/virement |
| `compte_bancaire_arti` | uuid | Oui | Compte payeur |
| `banque_arti` | text | Oui | Banque payeuse |
| `observation` | text | Oui | Observations |
| `statut` | varchar | Oui | État |
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

### 2.4 Documents de règlement

```typescript
export const DOCUMENTS_REGLEMENT = [
  { code: "preuve_paiement", label: "Preuve de paiement", obligatoire: true },
  { code: "bordereau_virement", label: "Bordereau de virement", obligatoire: false },
  { code: "copie_cheque", label: "Copie du chèque", obligatoire: false },
  { code: "avis_credit", label: "Avis de crédit", obligatoire: false },
];
```

---

## 3. Calcul du restant à payer

### 3.1 Formule

```
Restant à payer = Montant ordonnancé - Règlements antérieurs
```

### 3.2 Interface TypeScript

```typescript
interface ReglementAvailability {
  montantOrdonnance: number;
  reglementsAnterieurs: number;
  restantAPayer: number;
}
```

### 3.3 Affichage visuel

```
┌────────────────────────────────────────────────────────────────────────┐
│ (A) Ordonnancé │ (B) Rég. ant. │ (C) Ce règlement │ (D) Restant après │
│   4 766 950    │       0       │    4 766 950     │        0  ✓       │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Règles

- ⚠️ **Le montant ne peut pas dépasser le restant à payer**
- ✅ Si `restant après = 0` → "Règlement complet" → Dossier soldé

---

## 4. Comptes bancaires ARTI

### 4.1 Comptes depuis la base

```typescript
const { data: comptesBancaires } = await supabase
  .from("comptes_bancaires")
  .select("*")
  .eq("est_actif", true)
  .order("libelle");
```

### 4.2 Fallback hardcodé (si pas de comptes)

```typescript
export const COMPTES_BANCAIRES_ARTI = [
  { value: "sgbci_principal", label: "SGBCI - Compte Principal", banque: "SGBCI" },
  { value: "bni_fonctionnement", label: "BNI - Fonctionnement", banque: "BNI" },
  { value: "boa_investissements", label: "BOA - Investissements", banque: "BOA" },
  { value: "ecobank_projets", label: "Ecobank - Projets", banque: "Ecobank" },
];
```

---

## 5. Workflow simplifié

Le règlement a un workflow simplifié (pas de multi-validation) :

```
┌─────────────────┐
│   BROUILLON     │ ← Comptable saisit le règlement
└────────┬────────┘
         │ + Preuve de paiement
         ▼
┌─────────────────┐
│    CONFIRMER    │ ← Vérification avant validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     VALIDE      │ ← Paiement effectif enregistré
└────────┬────────┘
         │
         ▼
   Mise à jour :
   - ordonnancement.montant_paye
   - budget_line.total_paye
   - dossier.statut_global = "solde" (si complet)
```

---

## 6. Clôture du dossier

### 6.1 Condition

Un dossier est **soldé** quand :
```
Total réglé = Total engagé
```

### 6.2 Mise à jour automatique

```typescript
// Après règlement complet
if (availability.restantAPayer - montant === 0) {
  await supabase
    .from("dossiers")
    .update({ statut_global: "solde" })
    .eq("id", dossierId);
}
```

### 6.3 Message utilisateur

```tsx
{availability.restantAPayer - watchedMontant === 0 && watchedMontant > 0 && (
  <Alert className="border-success/50 bg-success/10">
    <CheckCircle className="h-4 w-4 text-success" />
    <AlertTitle>Règlement complet</AlertTitle>
    <AlertDescription>
      Ce règlement soldera complètement l'ordonnancement. 
      Le dossier sera marqué comme "Soldé".
    </AlertDescription>
  </Alert>
)}
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

| Export | Type | Description |
|--------|------|-------------|
| `reglements` | `Reglement[]` | Liste |
| `ordonnancementsValides` | `Ordonnancement[]` | Disponibles |
| `comptesBancaires` | `CompteBancaire[]` | Comptes ARTI |
| `createReglement` | `mutation` | Créer |
| `calculateReglementAvailability` | `function` | Calculer restant |

### 8.2 Constantes exportées

```typescript
export const MODES_PAIEMENT = [...];
export const COMPTES_BANCAIRES_ARTI = [...];
export const DOCUMENTS_REGLEMENT = [...];
```

### 8.3 Fichiers sources

```
src/hooks/useReglements.ts   # Hook principal (~434 lignes)
```

---

## 9. Pages et Composants

### 9.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/reglements` | `Reglements.tsx` | Liste et gestion |

### 9.2 Composants

| Composant | Description |
|-----------|-------------|
| `ReglementForm.tsx` | Formulaire (~573 lignes) |
| `ReglementList.tsx` | Liste avec filtres |
| `ReglementDetails.tsx` | Vue détaillée |

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
  .from("reglements")
  .insert({
    ordonnancement_id: "uuid-ordonnancement",
    date_paiement: "2026-03-05",
    montant: 4766950,
    mode_paiement: "virement",
    reference_paiement: "VIR-2026-00456",
    compte_bancaire_arti: "uuid-compte",
    banque_arti: "SGBCI",
    observation: "Paiement facture TECH SOLUTIONS",
    exercice: 2026,
    statut: "valide",
  })
  .select()
  .single();
```

### 10.2 Récupérer avec relations

```typescript
const { data, error } = await supabase
  .from("reglements")
  .select(`
    *,
    ordonnancement:ordonnancements(
      id, numero, montant, beneficiaire, banque, rib,
      liquidation:budget_liquidations(
        engagement:budget_engagements(numero, objet)
      )
    ),
    attachments:reglement_attachments(*)
  `)
  .eq("exercice", 2026)
  .order("date_paiement", { ascending: false });
```

### 10.3 Calculer disponibilité

```typescript
const calculateReglementAvailability = async (ordonnancementId: string) => {
  // Montant de l'ordonnancement
  const { data: ordonnancement } = await supabase
    .from("ordonnancements")
    .select("montant")
    .eq("id", ordonnancementId)
    .single();

  // Règlements antérieurs
  const { data: reglements } = await supabase
    .from("reglements")
    .select("montant")
    .eq("ordonnancement_id", ordonnancementId)
    .eq("statut", "valide");

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
  .from("comptes_bancaires")
  .select("id, libelle, banque, solde_actuel")
  .eq("est_actif", true);
```

### 11.2 Impact sur le solde

Après règlement, le solde du compte peut être mis à jour :

```typescript
// Optionnel : Mise à jour du solde
await supabase
  .from("comptes_bancaires")
  .update({ 
    solde_actuel: supabase.raw("solde_actuel - ?", [montant])
  })
  .eq("id", compteId);
```

---

## 12. Intégration avec autres modules

### 12.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Ordonnancements | Ordonnancement validé |
| Trésorerie | Comptes bancaires |

### 12.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Dossiers | Statut → "soldé" |
| Budget Lines | Mise à jour `total_paye` |
| Trésorerie | Mouvement de sortie |

---

## 13. Points ouverts / TODOs

- [ ] Intégration bancaire automatique (relevés)
- [ ] Réconciliation bancaire
- [ ] Génération bordereaux de règlement
- [ ] Historique des paiements par fournisseur
- [ ] Alertes délais de paiement

---

## 14. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
