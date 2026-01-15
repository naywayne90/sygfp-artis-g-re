# Prestataires (Fournisseurs) - Documentation Technique

> **Version**: 1.0 | **Dernière mise à jour**: 2026-01-15 | **Statut**: ✅ Opérationnel

## 1. Vue d'ensemble

Le module **Prestataires** gère le référentiel des fournisseurs et prestataires. Il assure la qualification, le suivi documentaire, et la gestion des informations bancaires.

### Rôle principal

- Gérer le référentiel fournisseurs
- Qualifier les prestataires (vérification documents)
- Suivre les documents fiscaux avec alertes d'expiration
- Gérer les comptes bancaires des fournisseurs

---

## 2. Architecture

### 2.1 Tables principales

| Table | Description | Clé primaire |
|-------|-------------|--------------|
| `prestataires` | Fournisseurs | `id` (UUID) |
| `prestataire_requests` | Demandes d'ajout | `id` (UUID) |
| `supplier_documents` | Documents fiscaux | `id` (UUID) |
| `supplier_bank_accounts` | Comptes bancaires | `id` (UUID) |
| `supplier_required_documents` | Types documents requis | `id` (UUID) |

### 2.2 Colonnes clés de `prestataires`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `code` | text | Oui | Code fournisseur |
| `raison_sociale` | text | Non | Nom / Raison sociale |
| `sigle` | text | Oui | Sigle |
| `forme_juridique` | varchar | Oui | SARL, SA, EI... |
| `rccm` | text | Oui | N° RCCM |
| `ninea` | text | Oui | N° NINEA |
| `nif` | text | Oui | N° fiscal |
| `adresse` | text | Oui | Adresse |
| `telephone` | text | Oui | Téléphone |
| `email` | text | Oui | Email |
| `contact_nom` | text | Oui | Nom contact |
| `statut` | varchar | Oui | État du fournisseur |
| `qualification_status` | varchar | Oui | État qualification |
| `banque` | text | Oui | Banque principale |
| `numero_compte` | text | Oui | N° compte |
| `mode_paiement` | varchar | Oui | Mode préféré |
| `secteurs_activite` | text[] | Oui | Secteurs |

### 2.3 Statuts fournisseur

```typescript
const STATUTS_PRESTATAIRE = [
  { value: "NOUVEAU", label: "Nouveau", color: "blue" },
  { value: "EN_QUALIFICATION", label: "En qualification", color: "yellow" },
  { value: "ACTIF", label: "Actif", color: "green" },
  { value: "SUSPENDU", label: "Suspendu", color: "orange" },
  { value: "INACTIF", label: "Inactif", color: "gray" },
];
```

---

## 3. Workflow de qualification

### 3.1 Processus

```
┌─────────────────┐
│    NOUVEAU      │ ← Demande publique ou interne
└────────┬────────┘
         │ Vérification documents
         ▼
┌─────────────────┐
│ EN_QUALIFICATION│ ← Documents en cours de validation
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ ACTIF │ │REFUSE │
└───────┘ └───────┘
    │
    ▼ (Documents expirés)
┌───────────┐
│ SUSPENDU  │
└───────────┘
```

### 3.2 Demandes publiques

Via `prestataire_requests` :

```
ENREGISTRE → EN_VERIF → VALIDE/REFUSE
```

Sources possibles :
- `PUBLIC_LINK` : Lien public de demande
- `INTERNE` : Création par agent
- `IMPORT` : Import fichier

---

## 4. Documents requis

### 4.1 Table `supplier_required_documents`

| Colonne | Description |
|---------|-------------|
| `code` | Code document |
| `libelle` | Nom affiché |
| `est_obligatoire` | Obligatoire pour qualification |
| `a_date_expiration` | Document avec expiration |
| `rappel_jours_defaut` | Jours avant expiration pour alerte |

### 4.2 Documents standards

```typescript
const DOCUMENTS_REQUIS = [
  { code: "RCCM", label: "RCCM", obligatoire: true, expiration: true },
  { code: "NINEA", label: "NINEA", obligatoire: true, expiration: true },
  { code: "NIF", label: "N° Fiscal", obligatoire: true, expiration: false },
  { code: "PATENTE", label: "Patente", obligatoire: true, expiration: true },
  { code: "CNI_DG", label: "CNI Dirigeant", obligatoire: true, expiration: true },
  { code: "RIB", label: "RIB", obligatoire: true, expiration: false },
  { code: "QUITUS", label: "Quitus fiscal", obligatoire: true, expiration: true },
];
```

### 4.3 Statuts documents

```typescript
type DocumentStatus = "valide" | "a_renouveler" | "expire" | "manquant";
```

---

## 5. Alertes documents

### 5.1 Calcul automatique

```typescript
// Vérification expiration
const checkExpiration = (dateExpiration: Date, rappelJours: number) => {
  const today = new Date();
  const daysUntilExpiry = differenceInDays(dateExpiration, today);
  
  if (daysUntilExpiry < 0) return "expire";
  if (daysUntilExpiry <= rappelJours) return "a_renouveler";
  return "valide";
};
```

### 5.2 Hook `useSupplierExpiredDocuments`

```typescript
const { documents, stats, isLoading } = useSupplierExpiredDocuments();

// stats = { expired: 5, toRenew: 12 }
```

---

## 6. Comptes bancaires

### 6.1 Table `supplier_bank_accounts`

| Colonne | Type | Description |
|---------|------|-------------|
| `supplier_id` | uuid | Fournisseur |
| `banque` | text | Nom banque |
| `code_banque` | text | Code banque |
| `code_guichet` | text | Code guichet |
| `numero_compte` | text | N° compte |
| `cle_rib` | text | Clé RIB |
| `iban` | text | IBAN |
| `bic_swift` | text | BIC/SWIFT |
| `titulaire` | text | Titulaire |
| `est_principal` | boolean | Compte principal |

### 6.2 Hook `useSupplierBankAccounts`

```typescript
const {
  accounts,
  primaryAccount,
  addAccount,
  setAsPrimary,
  deleteAccount,
} = useSupplierBankAccounts(supplierId);
```

---

## 7. Hooks React

### 7.1 Hook principal : `usePrestataires`

| Export | Type | Description |
|--------|------|-------------|
| `prestataires` | `Prestataire[]` | Liste fournisseurs |
| `prestatairesActifs` | `Prestataire[]` | Fournisseurs actifs |
| `createPrestataire` | `function` | Créer |
| `updatePrestataire` | `function` | Modifier |
| `qualifyPrestataire` | `function` | Qualifier |
| `suspendPrestataire` | `function` | Suspendre |

### 7.2 Hook documents : `useSupplierDocuments`

```typescript
const {
  documents,
  stats,
  addDocument,
  updateDocument,
  deleteDocument,
} = useSupplierDocuments(supplierId);
```

### 7.3 Hook qualification : `useSupplierQualification`

```typescript
const {
  canQualify,
  missingDocuments,
  expiredDocuments,
} = useSupplierQualification(supplierId);
```

### 7.4 Fichiers sources

```
src/hooks/usePrestataires.ts           # Principal
src/hooks/useSupplierDocuments.ts      # Documents (~339 lignes)
```

---

## 8. Pages et Composants

### 8.1 Pages

| Route | Composant | Description |
|-------|-----------|-------------|
| `/prestataires` | `Prestataires.tsx` | Liste fournisseurs |
| `/validation-prestataires` | `ValidationPrestataires.tsx` | Validation demandes |
| `/demande-prestataire` | `DemandePrestataire.tsx` | Formulaire public |

### 8.2 Composants

| Composant | Description |
|-----------|-------------|
| `SupplierIdentityTab.tsx` | Onglet identité |
| `SupplierBankTab.tsx` | Onglet bancaire |
| `SupplierDocumentsTab.tsx` | Onglet documents |
| `SupplierHistoryTab.tsx` | Historique |
| `SupplierQualificationDialog.tsx` | Dialog qualification |
| `PrestataireSelect.tsx` | Sélecteur fournisseur |
| `PrestatairesAlertBadge.tsx` | Badge alertes |
| `PrestatairesImportDialog.tsx` | Import CSV |
| `PrestatairesExportButton.tsx` | Export |
| `DocumentUploadDialog.tsx` | Upload document |

### 8.3 Arborescence

```
src/
├── pages/
│   └── contractualisation/
│       ├── Prestataires.tsx
│       ├── ValidationPrestataires.tsx
│       └── DemandePrestataire.tsx
└── components/
    └── prestataires/
        ├── SupplierIdentityTab.tsx
        ├── SupplierBankTab.tsx
        ├── SupplierDocumentsTab.tsx
        ├── SupplierHistoryTab.tsx
        ├── SupplierQualificationDialog.tsx
        ├── PrestataireSelect.tsx
        ├── PrestatairesAlertBadge.tsx
        ├── PrestatairesImportDialog.tsx
        ├── PrestatairesExportButton.tsx
        └── DocumentUploadDialog.tsx
```

---

## 9. API Supabase - Exemples

### 9.1 Récupérer les prestataires

```typescript
const { data, error } = await supabase
  .from("prestataires")
  .select(`
    *,
    documents:supplier_documents(*),
    comptes:supplier_bank_accounts(*)
  `)
  .order("raison_sociale");
```

### 9.2 Créer un prestataire

```typescript
const { data, error } = await supabase
  .from("prestataires")
  .insert({
    raison_sociale: "TECH SOLUTIONS SARL",
    sigle: "TCS",
    forme_juridique: "SARL",
    rccm: "CI-ABJ-2020-B-12345",
    ninea: "123456789",
    telephone: "+225 27 20 30 40 50",
    email: "contact@techsolutions.ci",
    statut: "NOUVEAU",
  })
  .select()
  .single();
```

### 9.3 Vérifier qualification

```typescript
const { data } = await supabase.rpc("can_qualify_supplier", {
  p_supplier_id: supplierId,
});

// Retourne : { can_qualify: true/false, missing_documents: [], expired_documents: [] }
```

---

## 10. Vue `prestataires_actifs`

Vue SQL pour récupérer uniquement les prestataires actifs avec documents à jour :

```sql
CREATE VIEW prestataires_actifs AS
SELECT p.*
FROM prestataires p
WHERE p.statut = 'ACTIF'
  AND NOT EXISTS (
    SELECT 1 FROM supplier_documents d
    WHERE d.supplier_id = p.id
      AND d.statut IN ('expire', 'manquant')
  );
```

---

## 11. Intégration avec autres modules

### 11.1 Entrées

| Module source | Données reçues |
|---------------|----------------|
| Demande publique | Formulaire fournisseur |
| Import CSV | Données en masse |

### 11.2 Sorties

| Module cible | Données envoyées |
|--------------|------------------|
| Marchés | Prestataire sélectionné |
| Contrats | Prestataire attributaire |
| Engagements | Fournisseur |
| Ordonnancements | Bénéficiaire + coordonnées bancaires |

---

## 12. Points ouverts / TODOs

- [ ] Portail fournisseurs (espace personnel)
- [ ] Signature électronique des documents
- [ ] Vérification automatique RCCM/NINEA
- [ ] Évaluation fournisseurs (notation)
- [ ] Blacklist fournisseurs

---

## 13. Changelog

| Date | Version | Modifications |
|------|---------|---------------|
| 2026-01-15 | 1.0 | Documentation initiale |
