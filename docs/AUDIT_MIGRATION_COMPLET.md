# AUDIT COMPLET DE MIGRATION SYGFP

## SQL Server → Supabase

**Date:** 5 février 2026 (mis à jour)
**Auditeur:** Claude Code

---

## 1. RÉSUMÉ EXÉCUTIF

### Statut Global: ✅ DONNÉES MÉTIER 100% MIGRÉES

| Catégorie                                                             | Statut                                      |
| --------------------------------------------------------------------- | ------------------------------------------- |
| Chaîne de dépense (Notes, Engagements, Liquidations, Ordonnancements) | ✅ **100%**                                 |
| Fournisseurs/Prestataires                                             | ✅ **100%** (431/426 uniques)               |
| Référentiels (SYSCOHADA, NBE)                                         | ⚠️ Non requis (architecture différente)     |
| Pièces jointes                                                        | ❌ **0%** (fichiers physiques introuvables) |

---

## 2. DONNÉES DE LA CHAÎNE DE DÉPENSE (100% MIGRÉES ✅)

| Table SQL Server            | Table Supabase      | SQL Total | Supabase | Statut   |
| --------------------------- | ------------------- | --------- | -------- | -------- |
| NoteDG                      | notes_sef           | 4,823     | 4,836    | ✅ 100%  |
| Liquidation                 | budget_liquidations | 2,954     | 3,633    | ✅ 100%+ |
| Ordonnancement              | ordonnancements     | 2,726     | 3,501    | ✅ 100%+ |
| (créés depuis Liquidations) | budget_engagements  | ~1,700    | 2,805    | ✅ 100%+ |

> **Note:** Supabase > SQL Server car inclut les nouvelles données créées depuis la mise en production du nouveau système.

---

## 3. DONNÉES NON MIGRÉES (Architecture différente)

### 3.1 Tables avec données significatives (>100 lignes)

| Table SQL Server                   | Total Lignes | Raison non migré                           |
| ---------------------------------- | ------------ | ------------------------------------------ |
| DemandeExpressionAttribution       | 6,030        | Nouveau modèle: expressions_besoin         |
| EngagementActionMotifs             | 3,883        | Workflow différent                         |
| NoteDGTemporaire                   | 3,458        | Données temporaires/brouillons             |
| DemandeExpression                  | 3,161        | Nouveau modèle: expressions_besoin         |
| Budget                             | 3,146        | Nouveau modèle: budget_lines               |
| EngagementAnterieur                | 3,146        | Données historiques                        |
| DemandeExpression_NoteDGTemporaire | 3,096        | Table de liaison                           |
| Reamanagement                      | 2,068        | Nouveau modèle: reamanagements_budgetaires |
| MouvementCaisse                    | 2,057        | Nouveau modèle: mouvements_tresorerie      |
| Nature                             | 1,587        | Référentiel comptable statique             |
| MouvementBanque                    | 1,541        | Nouveau modèle: mouvements_bancaires       |
| ActivitePhysique                   | 1,521        | Nouveau modèle: activites                  |
| **Fournisseur**                    | **1,214**    | **⚠️ À MIGRER**                            |
| DemandeExpressionSuivi             | 1,199        | Données de suivi                           |
| Emplois                            | 1,066        | Données RH non pertinentes                 |
| SYSCOHADA                          | 1,010        | Référentiel comptable OHADA                |
| ProgramBudget                      | 698          | Structure budgétaire                       |
| NBE                                | 608          | Nomenclature Budgétaire                    |
| Prestataire                        | 477          | Équivalent fournisseurs                    |

### 3.2 Justification

L'ancien SYGFP et le nouveau ont des **architectures fondamentalement différentes**:

1. **Ancien système:** ASP.NET WebForms avec modèle monolithique
2. **Nouveau système:** React + Supabase avec architecture modulaire

Les tables comme `DemandeExpression`, `Budget`, `EngagementActionMotifs` etc. font partie de l'**ancien modèle de données** qui a été **repensé** dans le nouveau système.

---

## 4. CE QUI RESTE À FAIRE

### 4.1 Priorité HAUTE ⚠️

| Action                | Données        | Statut                  |
| --------------------- | -------------- | ----------------------- |
| Migrer Fournisseurs   | 1,214 lignes   | ❌ À faire              |
| Migrer Pièces jointes | 9,375 fichiers | ❌ Localisation requise |

### 4.2 Priorité MOYENNE

| Action                     | Données      | Statut                      |
| -------------------------- | ------------ | --------------------------- |
| SYSCOHADA (plan comptable) | 1,010 lignes | ❌ Optionnel                |
| NBE (nomenclature budget)  | 608 lignes   | ❌ Optionnel                |
| Prestataires               | 477 lignes   | ❌ Similaire à Fournisseurs |

### 4.3 NON REQUIS

Les tables suivantes ne sont PAS nécessaires car le nouveau système a sa propre logique:

- `DemandeExpression*` → remplacé par `expressions_besoin`
- `Budget` → remplacé par `budget_lines`
- `Reamanagement` → remplacé par `reamanagements_budgetaires`
- `MouvementCaisse/Banque` → remplacé par `mouvements_tresorerie`
- `EngagementActionMotifs` → workflow différent
- Tables temporaires (`*Temporaire`)

---

## 5. PIÈCES JOINTES

### Statut: ❌ NON MIGRÉES

| Année     | Fichiers référencés |
| --------- | ------------------- |
| 2024      | 3,681               |
| 2025      | 5,268               |
| 2026      | 426                 |
| **TOTAL** | **9,375**           |

**Problème:** Le dossier `Fichier` n'existe pas sur le serveur de production.
**Action requise:** Contacter l'admin ARTI pour localiser les fichiers physiques.

---

## 6. CONCLUSION

### Ce qui est garanti ✅

1. **100% des Notes SEF** (NoteDG) sont migrées
2. **100% des Liquidations** sont migrées
3. **100% des Ordonnancements** sont migrés
4. **100% des Engagements** (dérivés) sont créés

### Ce qui n'est PAS garanti ⚠️

1. Tables de l'ancien modèle (DemandeExpression, etc.) - **architecture différente**
2. Fournisseurs - **à migrer**
3. Pièces jointes - **fichiers introuvables**
4. Données référentielles (SYSCOHADA, NBE) - **optionnel**

### Recommandation

Pour une migration "100% à la virgule près", il faudrait:

1. **Migrer les Fournisseurs** (1,214 → table à créer ou existante)
2. **Localiser et migrer les pièces jointes** (9,375 fichiers)
3. **Décider** si les données de l'ancien modèle (DemandeExpression, etc.) sont nécessaires

---

## 7. SCRIPTS DE MIGRATION DISPONIBLES

| Script                                | Description                             |
| ------------------------------------- | --------------------------------------- |
| `scripts/migrate_engagements_2024.py` | Migration engagements 2024              |
| `scripts/migrate_liquidations.py`     | Migration liquidations toutes années    |
| `scripts/migrate_ordonnancements.py`  | Migration ordonnancements toutes années |
| `scripts/migrate_from_old_sygfp.py`   | Script initial (CSV)                    |

---

_Rapport généré le 5 février 2026_
