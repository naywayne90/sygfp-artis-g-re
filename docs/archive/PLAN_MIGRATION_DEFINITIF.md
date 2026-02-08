# PLAN DE MIGRATION DÉFINITIF - SYGFP
**Date:** 5 février 2026
**Objectif:** Migrer 100% des données SQL Server → Supabase
**Tentative:** #4 (FINALE)

---

## 📊 ÉTAT ACTUEL (Vérifié le 5 février 2026 à 19h00)

### Données dans SQL Server (SOURCE)
| Donnée | 2024 | 2025 | 2026 | **TOTAL** |
|--------|------|------|------|-----------|
| Notes DG | 1,940 | 2,589 | 298 | **4,827** |
| Engagements | 1,258 | 1,710 | 183 | **3,151** |
| Liquidations | 1,124 | 1,651 | 185 | **2,960** |
| Ordonnancements | 999 | 1,533 | 195 | **2,727** |
| **TOTAL** | **5,321** | **7,483** | **861** | **13,665** |

### Données dans Supabase (DESTINATION - ACTUEL)
| Donnée | 2024 | 2025 | 2026 | **TOTAL** |
|--------|------|------|------|-----------|
| Notes SEF | 1,000 | 0 | 0 | **1,000** |
| Engagements | 1,000 | 0 | 0 | **1,000** |
| Liquidations | 791 | 209 | 0 | **1,000** |
| Ordonnancements | 733 | 267 | 0 | **1,000** |
| **TOTAL** | **3,524** | **476** | **0** | **4,000** |

### ❌ DONNÉES MANQUANTES
| Donnée | Manquant 2024 | Manquant 2025 | Manquant 2026 | **TOTAL MANQUANT** |
|--------|---------------|---------------|---------------|---------------------|
| Notes | 940 | 2,589 | 298 | **3,827** |
| Engagements | 258 | 1,710 | 183 | **2,151** |
| Liquidations | 333 | 1,442 | 185 | **1,960** |
| Ordonnancements | 266 | 1,266 | 195 | **1,727** |
| **TOTAL** | **1,797** | **7,007** | **861** | **9,665** |

**Taux de migration actuel : 29.3%**
**Taux manquant : 70.7%**

---

## 🎯 OBJECTIF FINAL

### Après migration complète, Supabase doit avoir :
| Donnée | 2024 | 2025 | 2026 | **TOTAL** |
|--------|------|------|------|-----------|
| Notes SEF | 1,940 | 2,589 | 298 | **4,827** |
| Engagements | 1,258 | 1,710 | 183 | **3,151** |
| Liquidations | 1,124 | 1,651 | 185 | **2,960** |
| Ordonnancements | 999 | 1,533 | 195 | **2,727** |
| **TOTAL** | **5,321** | **7,483** | **861** | **13,665** ✅

**Taux de migration final : 100%** ✅

---

## 📝 PLAN D'EXÉCUTION (Étape par Étape)

### PHASE 1 : Préparation (30 min)
- [ ] **1.1** Sauvegarder Supabase actuel (export SQL complet)
- [ ] **1.2** Identifier les enregistrements déjà migrés (par leur ID/numéro)
- [ ] **1.3** Créer des tables temporaires pour éviter les doublons
- [ ] **1.4** Vérifier les connexions SQL Server + Supabase

### PHASE 2 : Migration Notes SEF (1h)
- [ ] **2.1** Récupérer TOUTES les Notes DG de SQL Server (3 bases)
- [ ] **2.2** Identifier celles DÉJÀ dans Supabase
- [ ] **2.3** Migrer UNIQUEMENT les manquantes (3,827)
  - [ ] 2024 : 940 notes
  - [ ] 2025 : 2,589 notes
  - [ ] 2026 : 298 notes
- [ ] **2.4** VÉRIFIER : SELECT COUNT(*) FROM notes_sef GROUP BY exercice
- [ ] **2.5** VALIDER : 4,827 au total ✅

### PHASE 3 : Migration Engagements (1h)
- [ ] **3.1** Récupérer TOUS les Engagements de SQL Server
- [ ] **3.2** Identifier ceux DÉJÀ dans Supabase
- [ ] **3.3** Migrer UNIQUEMENT les manquants (2,151)
  - [ ] 2024 : 258 engagements
  - [ ] 2025 : 1,710 engagements
  - [ ] 2026 : 183 engagements
- [ ] **3.4** VÉRIFIER : SELECT COUNT(*) FROM budget_engagements GROUP BY exercice
- [ ] **3.5** VALIDER : 3,151 au total ✅

### PHASE 4 : Migration Liquidations (1h)
- [ ] **4.1** Récupérer TOUTES les Liquidations de SQL Server
- [ ] **4.2** Identifier celles DÉJÀ dans Supabase
- [ ] **4.3** Migrer UNIQUEMENT les manquantes (1,960)
  - [ ] 2024 : 333 liquidations
  - [ ] 2025 : 1,442 liquidations
  - [ ] 2026 : 185 liquidations
- [ ] **4.4** VÉRIFIER : SELECT COUNT(*) FROM budget_liquidations GROUP BY exercice
- [ ] **4.5** VALIDER : 2,960 au total ✅

### PHASE 5 : Migration Ordonnancements (1h)
- [ ] **5.1** Récupérer TOUS les Ordonnancements de SQL Server
- [ ] **5.2** Identifier ceux DÉJÀ dans Supabase
- [ ] **5.3** Migrer UNIQUEMENT les manquants (1,727)
  - [ ] 2024 : 266 ordonnancements
  - [ ] 2025 : 1,266 ordonnancements
  - [ ] 2026 : 195 ordonnancements
- [ ] **5.4** VÉRIFIER : SELECT COUNT(*) FROM ordonnancements GROUP BY exercice
- [ ] **5.5** VALIDER : 2,727 au total ✅

### PHASE 6 : Vérification Finale (30 min)
- [ ] **6.1** Relancer l'audit complet SQL Server vs Supabase
- [ ] **6.2** Vérifier que TOUTES les lignes = 0 différence
- [ ] **6.3** Tester l'application avec les données migrées
- [ ] **6.4** Générer un rapport de migration final

---

## 🛡️ SÉCURITÉS

### Pour éviter les doublons
1. Chaque enregistrement SQL Server a un ID unique
2. On génère un UUID déterministe : `MD5(table_année_ancienID)`
3. Avant insertion, on vérifie que cet UUID n'existe PAS déjà

### Pour éviter de casser le code
1. On NE TOUCHE PAS aux tables existantes
2. On NE SUPPRIME RIEN
3. On AJOUTE uniquement les données manquantes
4. On garde une sauvegarde SQL avant de commencer

### Pour éviter de mélanger les données
1. Chaque enregistrement garde son année (exercice)
2. On migre année par année (2024, puis 2025, puis 2026)
3. On vérifie après chaque année

---

## ⏱️ DURÉE ESTIMÉE

- Préparation : **30 min**
- Migration : **4h** (1h par type de donnée)
- Vérification : **30 min**
- **TOTAL : ~5h**

---

## ✅ CRITÈRES DE SUCCÈS

La migration est réussie SI ET SEULEMENT SI :

1. ✅ SQL Server Notes DG = Supabase notes_sef (4,827 = 4,827)
2. ✅ SQL Server Engagements = Supabase budget_engagements (3,151 = 3,151)
3. ✅ SQL Server Liquidations = Supabase budget_liquidations (2,960 = 2,960)
4. ✅ SQL Server Ordonnancements = Supabase ordonnancements (2,727 = 2,727)
5. ✅ Audit final montre 0 différence pour TOUTES les années
6. ✅ L'application fonctionne correctement avec les données

---

## ⚠️ SI QUELQUE CHOSE SE PASSE MAL

1. **STOP immédiatement**
2. Restaurer la sauvegarde SQL
3. Analyser le problème
4. NE PAS dire "c'est bon" si ce n'est pas bon
5. Recommencer proprement

---

## 📞 VALIDATION UTILISATEUR REQUISE

**AVANT DE COMMENCER, l'utilisateur doit valider :**

- [ ] J'ai lu et compris ce plan
- [ ] Je suis d'accord avec l'approche
- [ ] Je suis prêt à suivre la migration en temps réel
- [ ] Je veux qu'on commence

**SIGNATURE :** _____________________
**DATE :** _____________________

---

## 🚀 PRÊT À DÉMARRER ?

**CE PLAN EST-IL APPROUVÉ ?**

□ OUI - On peut commencer
□ NON - Je veux modifier quelque chose
□ QUESTIONS - J'ai besoin de clarifications
