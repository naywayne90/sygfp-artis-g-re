# STATUTS VALIDES SUPABASE - SYGFP

**Date:** 2026-02-05 20:00
**Source:** CHECK constraints des migrations Supabase

---

## ✅ STATUTS PAR TABLE

### 1. notes_sef
```sql
CHECK (statut IN ('brouillon', 'soumis', 'a_valider', 'valide', 'rejete', 'differe'))
```

**Statuts valides:**
- `brouillon` - En cours de création
- `soumis` - Soumis pour validation
- `a_valider` - À valider par le responsable
- `valide` - ✅ Validé et approuvé (utiliser pour migration)
- `rejete` - Rejeté
- `differe` - Différé

**Pour migration SQL Server:**
- SQL Server `validee` → Supabase `valide`

---

### 2. budget_engagements
```sql
CHECK (statut IN (
    'brouillon', 'soumis', 'en_attente', 'a_valider',
    'valide', 'rejete', 'differe', 'annule', 'en_cours'
))
```

**Statuts valides:**
- `brouillon` - En cours de création
- `soumis` - Soumis pour validation
- `en_attente` - En attente de traitement (legacy)
- `a_valider` - À valider
- `valide` - ✅ Validé et approuvé (utiliser pour migration)
- `rejete` - Rejeté
- `differe` - Différé
- `annule` - Annulé
- `en_cours` - En cours de traitement

**Pour migration SQL Server:**
- SQL Server `null` ou `validee` → Supabase `valide`
- SQL Server `en_attente` → Supabase `en_attente`

---

### 3. budget_liquidations
```sql
CHECK (statut IN (
    'brouillon', 'soumis', 'en_attente', 'a_valider',
    'valide', 'rejete', 'differe', 'annule', 'paye'
))
```

**Statuts valides:**
- `brouillon` - En cours de création
- `soumis` - Soumis pour validation
- `en_attente` - En attente (legacy)
- `a_valider` - À valider
- `valide` - ✅ Validé
- `rejete` - Rejeté
- `differe` - Différé
- `annule` - Annulé
- `paye` - Payé (pour le règlement)

**Pour migration SQL Server:**
- SQL Server `validee` → Supabase `valide`
- SQL Server `payee` → Supabase `paye`
- SQL Server `en_attente` → Supabase `en_attente`

---

### 4. ordonnancements
**Statuts observés dans Supabase:**
- `brouillon` - En cours de création
- `en_attente` - En attente de traitement
- `valide` - ✅ Validé
- `paye` - Payé

**Pour migration SQL Server:**
- SQL Server `validee` → Supabase `valide`
- SQL Server `payee` ou `paye` → Supabase `paye`
- SQL Server `en_attente` → Supabase `en_attente`

---

## 🔄 MAPPING MIGRATION

| SQL Server | Supabase | Description |
|------------|----------|-------------|
| `validee` | `valide` | Document validé |
| `payee` / `paye` | `paye` | Ordonnancement/Liquidation payé |
| `en_attente` | `en_attente` | En attente de traitement |
| `null` | `valide` | Par défaut pour migration |

---

## ⚠️ ERREURS PRÉCÉDENTES

**Erreur identifiée:**
```python
data = {
    'statut': 'validee',  # ❌ INVALIDE - viole CHECK constraint
}
```

**Correction:**
```python
data = {
    'statut': 'valide',  # ✅ VALIDE
}
```

---

## 📋 CHECKLIST MIGRATION

- [x] Identifier les CHECK constraints
- [x] Mapper les statuts SQL Server → Supabase
- [ ] Mettre à jour le script de migration
- [ ] Tester avec 10 enregistrements
- [ ] Migrer 100% des données
