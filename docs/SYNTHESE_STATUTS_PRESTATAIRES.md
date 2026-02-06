# 🎯 SYNTHÈSE : Système ACTIF/INACTIF des Prestataires

**Date :** 5 février 2026, 18h15
**Contexte :** Analyse complète du module Prestataires SYGFP
**Statut :** ✅ Documentation complète créée

---

## 📊 État actuel RÉEL de votre base de données

### Vérification Supabase (requête PostgREST)

```sql
SELECT statut, COUNT(*) FROM prestataires GROUP BY statut;
```

**Résultat :**
```
statut  | nombre
--------+--------
actif   | 431
```

### 🎉 BONNE NOUVELLE !

**TOUS vos 431 prestataires sont déjà au statut "actif"** (en minuscules).

---

## ⚠️ Problème identifié : Incohérence majuscules/minuscules

### Le bug

**Dans le code TypeScript :**
```typescript
// src/hooks/usePrestataires.ts ligne 94
const prestatairesActifs = prestataires.filter(p => p.statut === "ACTIF");
```

**Dans la base de données :**
```sql
-- Les statuts sont en MINUSCULES
statut = 'actif' (et non 'ACTIF')
```

**Conséquence :**
- ❌ Le filtre TypeScript cherche `"ACTIF"` (majuscules)
- ✅ La base retourne `"actif"` (minuscules)
- ❌ Résultat : 0 prestataire actif trouvé (alors qu'il y en a 431 !)

---

## 🔧 Solution immédiate

### Option A : Corriger le code (recommandé)

**Modifier le hook `usePrestataires.ts` :**

```typescript
// AVANT (ligne 94)
const prestatairesActifs = prestataires.filter(p => p.statut === "ACTIF");

// APRÈS (insensible à la casse)
const prestatairesActifs = prestataires.filter(p =>
  p.statut?.toUpperCase() === "ACTIF"
);
```

**Ou mieux, normaliser à l'import :**

```typescript
// À la ligne 89, après le fetch
const { data, error } = await supabase
  .from("prestataires")
  .select("*")
  .order("raison_sociale");

if (error) throw error;

// Normaliser les statuts en MAJUSCULES
return (data as Prestataire[]).map(p => ({
  ...p,
  statut: p.statut?.toUpperCase() || null
}));
```

---

### Option B : Corriger la base de données

**Mettre tous les statuts en MAJUSCULES :**

```sql
UPDATE prestataires
SET statut = UPPER(statut)
WHERE statut IS NOT NULL;

-- Vérification
SELECT statut, COUNT(*) FROM prestataires GROUP BY statut;
-- Devrait retourner "ACTIF" au lieu de "actif"
```

---

## 📚 Documentation créée

J'ai créé **3 documents complets** pour vous :

### 1. **Analyse complète** (17,000+ mots)
📄 `docs/ANALYSE_STATUTS_PRESTATAIRES.md`

**Contenu :**
- Explication détaillée des 5 statuts
- Workflow de qualification complet
- Règles métier précises
- Implémentation technique
- Cas d'usage détaillés
- FAQ complète

---

### 2. **Guide rapide** (1 page)
📄 `docs/QUICK_GUIDE_STATUTS_PRESTATAIRES.md`

**Contenu :**
- Tableau des 5 statuts
- Actions rapides
- Différence SUSPENDU vs INACTIF
- Impact sur la chaîne de dépense
- FAQ express

---

### 3. **Explication écran** (guide visuel)
📄 `docs/EXPLICATION_ECRAN_PRESTATAIRES.md`

**Contenu :**
- Explication de votre écran actuel
- Pourquoi "Aucun prestataire" s'affiche
- Comment qualifier un prestataire étape par étape
- Plan d'action recommandé
- Astuce de vérification SQL

---

## 🎯 Actions recommandées

### ✅ Immédiat (Aujourd'hui)

1. **Corriger le bug casse** :
   - Soit modifier le code TypeScript (Option A)
   - Soit normaliser la base (Option B)

2. **Rafraîchir la page** :
   - Après correction → les 431 prestataires apparaîtront dans "Actifs"

3. **Tester la sélection** :
   - Créer un engagement test
   - Vérifier que les prestataires sont sélectionnables

---

### ✅ Court terme (Cette semaine)

1. **Standardiser la casse** partout :
   - Décider : MAJUSCULES ou minuscules ?
   - Appliquer uniformément dans le code ET la base

2. **Ajouter une contrainte** :
   ```sql
   ALTER TABLE prestataires
   ADD CONSTRAINT check_statut_values
   CHECK (statut IN ('ACTIF', 'NOUVEAU', 'EN_QUALIFICATION', 'SUSPENDU', 'INACTIF'));
   ```

3. **Créer un trigger** pour normaliser automatiquement :
   ```sql
   CREATE OR REPLACE FUNCTION normalize_prestataire_statut()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.statut = UPPER(NEW.statut);
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER normalize_statut_before_insert_update
   BEFORE INSERT OR UPDATE ON prestataires
   FOR EACH ROW
   EXECUTE FUNCTION normalize_prestataire_statut();
   ```

---

### ✅ Moyen terme (Ce mois)

1. **Documenter les documents requis** :
   - Vérifier si les 431 prestataires ont bien leurs documents
   - Créer une page "Documents manquants"
   - Rappeler les fournisseurs avec documents expirés

2. **Mettre en place le monitoring** :
   - Dashboard des documents à expiration
   - Alertes automatiques 30j avant
   - Suspension automatique si expiré

3. **Former les utilisateurs** :
   - Session sur la qualification des prestataires
   - Partager les guides créés

---

## 🔍 Analyse technique approfondie

### Architecture du système de statuts

**Tables impliquées :**
```
prestataires
  ├── statut (VARCHAR)                    # État actuel
  ├── motif_suspension (TEXT)             # Si SUSPENDU
  ├── suspended_at (TIMESTAMP)            # Date suspension
  └── suspended_by (UUID → auth.users)    # Qui a suspendu

supplier_documents
  ├── supplier_id (UUID → prestataires)
  ├── document_type (VARCHAR)             # RCCM, NINEA, etc.
  ├── date_expiration (DATE)              # Si expire
  └── statut (VARCHAR)                    # valide, expire, a_renouveler

supplier_bank_accounts
  ├── supplier_id (UUID → prestataires)
  ├── numero_compte (TEXT)
  └── est_principal (BOOLEAN)

audit_logs
  ├── entity_type = 'prestataire'
  ├── entity_id (UUID)
  ├── action (VARCHAR)                    # supplier_suspended, supplier_activated
  └── new_values (JSONB)
```

---

### Hooks React

**Fichier :** `src/hooks/usePrestataires.ts`

**Exports :**
```typescript
interface UsePrestatairesReturn {
  // Données
  prestataires: Prestataire[];
  prestatairesActifs: Prestataire[];      // ← BUG ICI (filtre "ACTIF")
  prestairesSuspendus: Prestataire[];
  nouveaux: Prestataire[];

  // Stats
  stats: {
    total: number;
    actifs: number;
    suspendus: number;
    inactifs: number;
    nouveaux: number;
  };

  // État
  isLoading: boolean;

  // Mutations
  suspendSupplier: (id: string, motif: string) => void;
  activateSupplier: (id: string) => void;
  checkDuplicate: (raisonSociale: string, nif?: string) => Promise<Prestataire[]>;
}
```

---

### Composants UI

**Page principale :**
- `src/pages/contractualisation/Prestataires.tsx` (522 lignes)

**Composants enfants :**
- `src/components/prestataires/SupplierIdentityTab.tsx`
- `src/components/prestataires/SupplierBankTab.tsx`
- `src/components/prestataires/SupplierDocumentsTab.tsx`
- `src/components/prestataires/SupplierHistoryTab.tsx`
- `src/components/prestataires/SupplierQualificationDialog.tsx`
- `src/components/prestataires/PrestataireSelect.tsx` (utilisé partout)
- `src/components/prestataires/PrestatairesImportDialog.tsx`
- `src/components/prestataires/PrestatairesExportButton.tsx`

---

### Filtrage par onglet

**Code actuel (ligne 73-88) :**

```typescript
const filteredPrestataires = prestataires.filter(p => {
  const matchSearch = /* ... */;

  if (selectedTab === "actifs") {
    return matchSearch && p.statut === "ACTIF";  // ← BUG: cherche "ACTIF" mais la base a "actif"
  } else if (selectedTab === "suspendus") {
    return matchSearch && p.statut === "SUSPENDU";
  } else if (selectedTab === "inactifs") {
    return matchSearch && (
      p.statut === "INACTIF" ||
      p.statut === "NOUVEAU" ||
      p.statut === "EN_QUALIFICATION"
    );
  }
  return matchSearch;
});
```

**Correction proposée :**

```typescript
const filteredPrestataires = prestataires.filter(p => {
  const matchSearch = /* ... */;
  const statutUpper = p.statut?.toUpperCase();

  if (selectedTab === "actifs") {
    return matchSearch && statutUpper === "ACTIF";
  } else if (selectedTab === "suspendus") {
    return matchSearch && statutUpper === "SUSPENDU";
  } else if (selectedTab === "inactifs") {
    return matchSearch && (
      statutUpper === "INACTIF" ||
      statutUpper === "NOUVEAU" ||
      statutUpper === "EN_QUALIFICATION"
    );
  }
  return matchSearch;
});
```

---

### Badges visuels

**Code actuel (ligne 97-110) :**

```typescript
const getStatusBadge = (statut: string | null) => {
  switch (statut) {
    case "ACTIF":
      return <Badge className="bg-green-600">Actif</Badge>;
    case "SUSPENDU":
      return <Badge variant="destructive">Suspendu</Badge>;
    case "EN_QUALIFICATION":
      return <Badge variant="outline" className="text-blue-600 border-blue-600">
        En qualification
      </Badge>;
    case "NOUVEAU":
      return <Badge variant="outline">Nouveau</Badge>;
    default:
      return <Badge variant="secondary">Inactif</Badge>;
  }
};
```

**Correction proposée (insensible à la casse) :**

```typescript
const getStatusBadge = (statut: string | null) => {
  const statutUpper = statut?.toUpperCase();

  switch (statutUpper) {
    case "ACTIF":
      return <Badge className="bg-green-600">Actif</Badge>;
    case "SUSPENDU":
      return <Badge variant="destructive">Suspendu</Badge>;
    case "EN_QUALIFICATION":
      return <Badge variant="outline" className="text-blue-600 border-blue-600">
        En qualification
      </Badge>;
    case "NOUVEAU":
      return <Badge variant="outline">Nouveau</Badge>;
    default:
      return <Badge variant="secondary">Inactif</Badge>;
  }
};
```

---

## 🐛 Autres bugs potentiels à vérifier

### 1. Composant `PrestataireSelect.tsx`

**Vérifie que le filtre n'a pas le même problème :**

```typescript
// Fichier à vérifier
src/components/prestataires/PrestataireSelect.tsx

// Rechercher cette ligne
const { prestatairesActifs } = usePrestataires();

// Si le bug est dans usePrestataires(), ce composant sera aussi affecté
```

---

### 2. Mutations (suspension/activation)

**Vérifier que les mutations utilisent la bonne casse :**

```typescript
// src/hooks/usePrestataires.ts ligne 124
const { error } = await supabase
  .from("prestataires")
  .update({
    statut: "SUSPENDU",  // ← À vérifier : MAJUSCULES ou minuscules ?
    /* ... */
  })
  .eq("id", id);
```

**Si la base utilise minuscules, changer en :**

```typescript
statut: "suspendu",  // ou mieux : statut.toLowerCase()
```

---

### 3. Stats du hook

**Ligne 108-114 (calcul des stats) :**

```typescript
const stats = {
  total: prestataires.length,
  actifs: prestatairesActifs.length,        // ← Dépend du filtre bugué
  suspendus: prestairesSuspendus.length,    // ← Idem
  inactifs: prestataires.filter(p =>
    p.statut === "INACTIF" ||               // ← Idem
    p.statut === "NOUVEAU" ||
    p.statut === "EN_QUALIFICATION"
  ).length,
  nouveaux: nouveaux.length,
};
```

**Tous ces calculs seront faux si la casse n'est pas gérée.**

---

## 📝 Script de correction SQL

**Si vous choisissez Option B (normaliser la base) :**

```sql
-- 1. Mettre tous les statuts en MAJUSCULES
UPDATE prestataires
SET statut = CASE
  WHEN LOWER(statut) = 'actif' THEN 'ACTIF'
  WHEN LOWER(statut) = 'nouveau' THEN 'NOUVEAU'
  WHEN LOWER(statut) = 'en_qualification' THEN 'EN_QUALIFICATION'
  WHEN LOWER(statut) = 'suspendu' THEN 'SUSPENDU'
  WHEN LOWER(statut) = 'inactif' THEN 'INACTIF'
  ELSE UPPER(statut)
END
WHERE statut IS NOT NULL;

-- 2. Ajouter une contrainte CHECK
ALTER TABLE prestataires
ADD CONSTRAINT check_statut_values
CHECK (statut IN ('ACTIF', 'NOUVEAU', 'EN_QUALIFICATION', 'SUSPENDU', 'INACTIF', NULL));

-- 3. Créer un trigger pour normaliser automatiquement
CREATE OR REPLACE FUNCTION normalize_prestataire_statut()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut IS NOT NULL THEN
    NEW.statut = UPPER(NEW.statut);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_statut_before_insert_update ON prestataires;
CREATE TRIGGER normalize_statut_before_insert_update
BEFORE INSERT OR UPDATE ON prestataires
FOR EACH ROW
EXECUTE FUNCTION normalize_prestataire_statut();

-- 4. Vérification finale
SELECT
  statut,
  COUNT(*) as nombre
FROM prestataires
GROUP BY statut
ORDER BY statut;

-- Résultat attendu :
-- ACTIF          | 431
```

---

## 🧪 Plan de test

### Après correction du bug

1. **Vérifier l'affichage** :
   - [ ] Onglet "Actifs (431)" affiche 431 prestataires
   - [ ] Badges verts "Actif" s'affichent correctement
   - [ ] Stats header affiche "Actifs: 431"

2. **Tester la sélection** :
   - [ ] Créer un engagement
   - [ ] Vérifier que les 431 prestataires apparaissent dans le sélecteur
   - [ ] Sélectionner un prestataire → OK

3. **Tester les mutations** :
   - [ ] Suspendre un prestataire → statut passe à "SUSPENDU" (ou "suspendu")
   - [ ] Vérifier l'affichage : badge rouge, onglet "Suspendus (1)"
   - [ ] Réactiver → statut repasse à "ACTIF" (ou "actif")
   - [ ] Vérifier l'affichage : badge vert, onglet "Actifs (431)"

4. **Tester les filtres** :
   - [ ] Rechercher par nom → fonctionne
   - [ ] Rechercher par NINEA → fonctionne
   - [ ] Rechercher par email → fonctionne

5. **Tester l'export** :
   - [ ] Export Excel
   - [ ] Vérifier que la colonne "Statut" affiche "ACTIF" (ou "actif" selon votre choix)

---

## 🎓 Leçons apprises

### Problème de casse (case sensitivity)

**PostgreSQL :**
- Par défaut, les comparaisons de chaînes sont sensibles à la casse
- `'actif' = 'ACTIF'` → FALSE
- `LOWER('ACTIF') = 'actif'` → TRUE

**TypeScript/JavaScript :**
- Les comparaisons strictes (`===`) sont sensibles à la casse
- `"actif" === "ACTIF"` → false
- `"actif".toUpperCase() === "ACTIF"` → true

**Recommandation :**
- Choisir UNE convention : soit MAJUSCULES, soit minuscules
- L'appliquer PARTOUT : code TypeScript + base de données
- Ajouter des contraintes CHECK pour garantir la cohérence
- Utiliser des enums TypeScript pour éviter les typos

---

### Enums recommandés

**Créer un type TypeScript strict :**

```typescript
// src/types/prestataire.ts
export const STATUT_PRESTATAIRE = {
  NOUVEAU: 'ACTIF',
  EN_QUALIFICATION: 'EN_QUALIFICATION',
  ACTIF: 'ACTIF',
  SUSPENDU: 'SUSPENDU',
  INACTIF: 'INACTIF',
} as const;

export type StatutPrestataire = typeof STATUT_PRESTATAIRE[keyof typeof STATUT_PRESTATAIRE];

// Utilisation dans le code
const prestatairesActifs = prestataires.filter(p =>
  p.statut === STATUT_PRESTATAIRE.ACTIF
);
```

**Créer un enum PostgreSQL :**

```sql
-- Créer un type ENUM
CREATE TYPE statut_prestataire AS ENUM (
  'ACTIF',
  'NOUVEAU',
  'EN_QUALIFICATION',
  'SUSPENDU',
  'INACTIF'
);

-- Modifier la colonne pour utiliser l'enum
ALTER TABLE prestataires
ALTER COLUMN statut TYPE statut_prestataire
USING statut::statut_prestataire;
```

---

## 📖 Résumé exécutif

### Ce qui a été fait

✅ **Analyse complète** du système de statuts des prestataires
✅ **Identification du bug** : incohérence majuscules/minuscules
✅ **Vérification de la base** : 431 prestataires "actif" (minuscules)
✅ **Création de 3 documents** :
  - Analyse détaillée (17k+ mots)
  - Guide rapide (1 page)
  - Explication écran (guide visuel)
✅ **Proposition de solutions** : 2 options (code OU base)

---

### Ce qui doit être fait

🔧 **Immédiat** :
  - Corriger le bug de casse (Option A ou B)
  - Tester l'affichage après correction

🔧 **Court terme** :
  - Standardiser la casse partout
  - Ajouter contraintes CHECK
  - Créer trigger de normalisation

🔧 **Moyen terme** :
  - Documenter les documents requis
  - Monitoring des expirations
  - Formation utilisateurs

---

## 📞 Contact

**Questions sur cette synthèse ?**
- Email : dsi@arti.ci
- Documentation : `/docs/ANALYSE_STATUTS_PRESTATAIRES.md`

---

**Fin de la synthèse**
**Dernière mise à jour :** 5 février 2026, 18h15
**Prochaine étape :** Corriger le bug et tester
