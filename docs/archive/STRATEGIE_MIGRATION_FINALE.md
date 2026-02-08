# STRATÉGIE DE MIGRATION INTELLIGENTE - FINALE

## 🎯 OBJECTIF
Migrer 100% des données SQL Server → Supabase
ZÉRO doublons, 100% de correspondance

## 🧠 STRATÉGIE INTELLIGENTE

### Problème identifié
- Il y a 17,726 enregistrements dans Supabase vs 13,665 dans SQL Server
- Impossible de supprimer à cause des Foreign Keys
- Impossible de savoir ce qui est un doublon vs donnée réelle

### Solution : Mapping déterministe + Upsert

**Étape 1 : Générer des IDs déterministes**
Pour chaque enregistrement SQL Server, générer un UUID unique basé sur :
- Type de table
- Année (exercice)
- ID original SQL Server

```python
UUID = MD5(f"{table}_{exercice}_{old_id}")
```

**Étape 2 : Upsert au lieu d'Insert**
- Si UUID existe → UPDATE (mettre à jour)
- Si UUID n'existe pas → INSERT (créer)

**Étape 3 : Vérification finale**
- Compter les enregistrements avec les UUIDs déterministes
- Doit correspondre EXACTEMENT aux comptages SQL Server

## 📋 PLAN D'EXÉCUTION

### PHASE 1 : Analyse (30 min)
1. Lire le schéma exact de chaque table Supabase
2. Identifier les colonnes obligatoires
3. Identifier les relations FK
4. Créer le mapping SQL Server → Supabase

### PHASE 2 : Script Migration Intelligent (1h)
1. Générer UUIDs déterministes pour TOUTES les données SQL Server
2. Pour chaque table :
   - Récupérer les données SQL Server
   - Générer UUID pour chaque enregistrement
   - Vérifier si UUID existe dans Supabase
   - Si existe → SKIP (déjà migré correctement)
   - Si n'existe pas → INSERT

3. Gérer les relations :
   - Engagement → créer d'abord
   - Liquidation → lier à l'engagement via UUID déterministe
   - Ordonnancement → lier à la liquidation via UUID déterministe

### PHASE 3 : Migration (1-2h)
1. Notes SEF (indépendant)
2. Engagements (indépendant)
3. Liquidations (dépend des engagements)
4. Ordonnancements (dépend des liquidations)

### PHASE 4 : Nettoyage des doublons (30 min)
1. Identifier les enregistrements sans UUID déterministe (= doublons des tentatives précédentes)
2. Les supprimer UNIQUEMENT s'ils ne sont pas liés à d'autres données

### PHASE 5 : Vérification (15 min)
1. Compter par UUID déterministe
2. Vérifier que 13,665 = 13,665

## ✅ GARANTIES

1. ✅ Pas de doublons (UUID déterministe unique)
2. ✅ Pas de perte de données (on ne supprime que les vrais doublons)
3. ✅ Relations FK respectées (on crée dans le bon ordre)
4. ✅ 100% de correspondance (vérification finale stricte)

## 🔧 COLONNES OBLIGATOIRES À RENSEIGNER

### notes_sef
- id (UUID déterministe)
- numero
- exercice
- objet
- montant_estime
- statut
- type_depense

### budget_engagements
- id (UUID déterministe)
- numero
- exercice
- montant
- objet
- statut
- budget_line_id (FK vers budget_lines - utiliser une ligne existante)

### budget_liquidations
- id (UUID déterministe)
- numero
- exercice
- montant
- statut
- **engagement_id** (FK - OBLIGATOIRE - utiliser UUID déterministe de l'engagement)

### ordonnancements
- id (UUID déterministe)
- numero
- exercice
- montant
- beneficiaire
- objet
- statut
- **liquidation_id** (FK - OBLIGATOIRE - utiliser UUID déterministe de la liquidation)

## 🎯 RÉSULTAT ATTENDU

**Après migration :**
```
SQL Server = Supabase (par UUID déterministe)
Notes :          4,827 = 4,827
Engagements :    3,151 = 3,151
Liquidations :   2,960 = 2,960
Ordonnancements: 2,727 = 2,727
TOTAL :         13,665 = 13,665 ✅
```

**Doublons supprimés :**
```
Notes :          ~9 doublons
Engagements :    ~2,605 doublons
Liquidations :   ~673 doublons
Ordonnancements: ~774 doublons
TOTAL :         ~4,061 doublons supprimés ✅
```
