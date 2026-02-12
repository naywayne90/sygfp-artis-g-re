# Audit du Formulaire et Menu Actions — Structure Budgétaire

**Date :** 11 février 2026
**Module :** Structure Budgétaire (`/planification/structure`)
**Statut :** Diagnostic uniquement — AUCUNE MODIFICATION

---

## 1. Formulaire "Nouvelle ligne budgétaire"

**Composant :** `src/components/budget/BudgetLineForm.tsx` (449 lignes)
**Type :** Dialog modal (`<Dialog>`)
**Double usage :** Création et modification (déterminé par `initialData`)

### 1.1 Tableau des champs

| #   | Champ                    | Type UI                 | Obligatoire | Source données (table Supabase)              | Default         | Validation                             |
| --- | ------------------------ | ----------------------- | ----------- | -------------------------------------------- | --------------- | -------------------------------------- |
| 1   | **Code**                 | `<Input>` texte         | **Oui**     | Saisie libre                                 | `""`            | Non-vide uniquement, **pas d'unicité** |
| 2   | **Niveau**               | `<Select>`              | **Oui**     | Statique : chapitre/article/paragraphe/ligne | `"ligne"`       | Présence                               |
| 3   | **Libellé**              | `<Input>` texte         | **Oui**     | Saisie libre                                 | `""`            | Non-vide                               |
| 4   | **Dotation initiale**    | `<Input type="number">` | **Oui**     | Saisie libre                                 | `0`             | `>= 0` (HTML min + JS)                 |
| 5   | **Source financement**   | `<FundingSourceSelect>` | Non         | `funding_sources`                            | `"budget_etat"` | Aucune                                 |
| 6   | **Direction**            | `<Select>`              | Non         | `directions` (est_active=true)               | `null`          | Aucune                                 |
| 7   | **Objectif Stratégique** | `<Select>`              | Non         | `objectifs_strategiques` (est_actif=true)    | `null`          | Aucune                                 |
| 8   | **Mission**              | `<Select>`              | Non         | `missions` (est_active=true)                 | `null`          | Aucune                                 |
| 9   | **Action**               | `<Select>`              | Non         | `actions` (est_active=true)                  | `null`          | Aucune                                 |
| 10  | **Activité**             | `<Select>`              | Non         | `activites` (est_active=true)                | `null`          | Aucune                                 |
| 11  | **Nomenclature NBE**     | `<Select>`              | Non         | `nomenclature_nbe` (est_active=true)         | `null`          | Aucune                                 |
| 12  | **Plan Comptable SYSCO** | `<SYSCOTypeahead>`      | Non         | `plan_comptable_sysco` (est_active=true)     | `null`          | Aucune                                 |
| 13  | **Commentaires**         | `<Textarea>`            | Non         | Saisie libre                                 | `""`            | Aucune                                 |

### 1.2 Champs ABSENTS du formulaire (mais existants en base)

| Champ DB            | Table                         | Présent dans le formulaire | Impact                                           |
| ------------------- | ----------------------------- | -------------------------- | ------------------------------------------------ |
| `sous_activite_id`  | `sous_activites` (13 entrées) | **NON**                    | Impossible d'affecter une sous-activité          |
| `nve_id`            | `ref_nve` (10 entrées)        | **NON**                    | Impossible d'affecter un code NVE                |
| `parent_id`         | `budget_lines` (self-ref)     | **NON**                    | Impossible de créer une hiérarchie parent/enfant |
| `nature_depense_id` | `natures_depense` (4 entrées) | **NON**                    | Impossible d'affecter une nature de dépense      |
| `tache_id`          | `taches` (vide)               | **NON**                    | Table vide, pas critique                         |
| `statut_execution`  | budget_lines                  | **NON**                    | Pas pertinent à la création                      |

### 1.3 Données de référence disponibles

| Table                    | Enregistrements actifs | Utilisée dans le formulaire |
| ------------------------ | ---------------------- | --------------------------- |
| `directions`             | 16                     | Oui                         |
| `objectifs_strategiques` | 5                      | Oui                         |
| `missions`               | 5                      | Oui                         |
| `actions`                | 6                      | Oui                         |
| `activites`              | 46                     | Oui                         |
| `nomenclature_nbe`       | 499                    | Oui                         |
| `plan_comptable_sysco`   | 400                    | Oui (typeahead)             |
| `sous_activites`         | 13                     | **NON**                     |
| `ref_nve`                | 10                     | **NON**                     |
| `natures_depense`        | 4                      | **NON**                     |
| `funding_sources`        | **TABLE INEXISTANTE**  | Oui (mais cassé)            |

### 1.4 Ce qui se passe à la création

**Fichier :** `src/hooks/useBudgetLines.ts` lignes 174-219

```
Création → INSERT dans budget_lines avec :
├── code, label, level ← du formulaire
├── dotation_initiale ← du formulaire
├── dotation_modifiee = dotation_initiale ← ✅ Correct
├── disponible_calcule = dotation_initiale ← ✅ Correct
├── total_engage = 0 ← ✅
├── total_liquide = 0 ← ✅
├── total_ordonnance = 0 ← ✅
├── total_paye = 0 ← ✅
├── is_active = true ← ✅
├── exercice = exercice courant ← ✅
├── statut = ? ← ⚠️ NON DÉFINI dans l'insert
│   (repose sur le DEFAULT de la colonne DB, probablement 'brouillon')
├── direction_id, os_id, mission_id, action_id, activite_id ← du formulaire
├── nbe_id, sysco_id, source_financement, commentaire ← du formulaire
└── parent_id ← du formulaire (mais pas exposé dans l'UI)
```

**Problèmes détectés :**

1. **`statut` non défini explicitement** → repose sur le DEFAULT DB (aucune garantie côté frontend)
2. **Pas de `submitted_by`** ni `created_by` → impossible de tracer qui a créé la ligne
3. **Pas de `validated_by`** → seul `validated_at` est renseigné à la validation
4. **Pas de vérification d'unicité du code** → deux lignes avec le même code sont possibles

---

## 2. Menu Actions "..." (DropdownMenu)

### 2.1 BudgetLineTable (vue tableau)

**Fichier :** `src/components/budget/BudgetLineTable.tsx` lignes 309-371

| #   | Action                         | Icône     | Condition d'affichage                | Ce qu'elle fait                                                | RBAC ?  |
| --- | ------------------------------ | --------- | ------------------------------------ | -------------------------------------------------------------- | ------- |
| 1   | **Modifier (formulaire)**      | Edit      | Toujours visible                     | Ouvre le formulaire en mode édition                            | **NON** |
| 2   | **Modifier (avec versioning)** | FileEdit  | `onEditWithVersioning` passé en prop | Ouvre éditeur avec versioning                                  | **NON** |
| 3   | **Historique champs**          | History   | Toujours visible                     | Ouvre dialog `BudgetLineHistory`                               | **NON** |
| 4   | **Historique versions**        | RotateCcw | `onViewVersionHistory` passé en prop | Ouvre historique versions                                      | **NON** |
| 5   | **Soumettre**                  | Send      | `statut === "brouillon"`             | Update `statut → "soumis"` + `submitted_at`                    | **NON** |
| 6   | **Valider**                    | Check     | `statut === "soumis"`                | Update `statut → "valide"` + `validated_at`                    | **NON** |
| 7   | **Rejeter**                    | X         | `statut === "soumis"`                | Update `statut → "rejete"` + `rejection_reason` via `prompt()` | **NON** |
| 8   | **Supprimer**                  | Trash2    | `statut === "brouillon"`             | RPC `deactivate_budget_line` (soft delete) via `confirm()`     | **NON** |

### 2.2 BudgetTreeView (vue arbre)

**Fichier :** `src/components/budget/BudgetTreeView.tsx` lignes 332-397

Mêmes actions que le tableau + 1 action supplémentaire :

| #   | Action        | Condition        | Disponible dans TreeView      |
| --- | ------------- | ---------------- | ----------------------------- |
| 9   | **Dupliquer** | Toujours visible | **OUI** (uniquement TreeView) |

### 2.3 Props optionnelles NON passées

La page `StructureBudgetaire.tsx` (ligne 400-409) ne passe PAS ces props :

- `onEditWithVersioning` → **jamais passé** → action "Modifier (avec versioning)" invisible
- `onViewVersionHistory` → **jamais passé** → action "Historique versions" invisible

**Actions réellement visibles dans l'UI actuelle :**

| Statut ligne | Actions visibles (Tableau)                 | Actions visibles (Arbre) |
| ------------ | ------------------------------------------ | ------------------------ |
| `brouillon`  | Modifier, Historique, Soumettre, Supprimer | + Dupliquer              |
| `soumis`     | Modifier, Historique, Valider, Rejeter     | + Dupliquer              |
| `valide`     | Modifier, Historique                       | + Dupliquer              |
| `rejete`     | Modifier, Historique                       | + Dupliquer              |

---

## 3. Problèmes Critiques Détectés

### P0 — Bloquant

| #        | Problème                                         | Fichier                   | Ligne   | Impact                                                                                                                                                                                                           |
| -------- | ------------------------------------------------ | ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0-1** | **Table `funding_sources` n'existe pas en base** | `FundingSourceSelect.tsx` | —       | Le sélecteur "Source de financement" échoue silencieusement. Le hook `useFundingSources` (420 lignes) requête une table inexistante. La migration `20260118800000_funding_sources.sql` n'a jamais été appliquée. |
| **P0-2** | **AUCUN contrôle RBAC sur les actions**          | `BudgetLineTable.tsx`     | 309-371 | N'importe quel utilisateur peut Valider/Rejeter/Supprimer. Valider devrait être réservé au DG/CB. Rejeter idem. Modifier sur une ligne validée devrait être interdit.                                            |
| **P0-3** | **"Modifier" accessible sur TOUS les statuts**   | `BudgetLineTable.tsx`     | 316     | Une ligne `valide` ou `soumis` peut être modifiée par n'importe qui. Seules les lignes `brouillon` ou `rejete` devraient être modifiables.                                                                       |

### P1 — Important

| #        | Problème                                | Fichier               | Ligne            | Impact                                                                                          |
| -------- | --------------------------------------- | --------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| **P1-1** | **`statut` non défini à la création**   | `useBudgetLines.ts`   | 177-201          | L'insert ne contient pas `statut: 'brouillon'`. Repose sur le DEFAULT DB, ce qui est fragile.   |
| **P1-2** | **Pas d'unicité sur le code**           | `BudgetLineForm.tsx`  | 163-183          | Deux lignes avec le même code peuvent être créées. Pas de contrainte UNIQUE en base non plus.   |
| **P1-3** | **Pas de traçabilité créateur**         | `useBudgetLines.ts`   | 174-219          | Aucun `created_by` enregistré. Impossible de savoir qui a créé la ligne.                        |
| **P1-4** | **`prompt()` et `confirm()` natifs**    | `BudgetLineTable.tsx` | 349-351, 361-363 | UX déplorable : boîtes de dialogue natives du navigateur au lieu de composants UI propres.      |
| **P1-5** | **Champs Sous-Activité et NVE absents** | `BudgetLineForm.tsx`  | —                | `sous_activite_id` et `nve_id` existent en base (13 et 10 entrées) mais pas dans le formulaire. |

### P2 — Améliorations

| #        | Problème                                                   | Impact                                                                |
| -------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| **P2-1** | Pas de "Voir détail" (fiche complète de la ligne)          | L'utilisateur doit ouvrir "Modifier" pour voir les métadonnées        |
| **P2-2** | Pas de "Voir consommation" (engagements/liquidations liés) | Impossible de voir les dossiers rattachés à une ligne                 |
| **P2-3** | Pas de "Exporter ligne" (PDF/Excel individuel)             | Export uniquement global, pas par ligne                               |
| **P2-4** | Versioning non câblé (`onEditWithVersioning` jamais passé) | Le composant existe mais n'est pas activé                             |
| **P2-5** | Pas de filtrage cascadé dans le formulaire                 | Sélectionner un OS ne filtre pas les Missions/Actions correspondantes |
| **P2-6** | Nature de dépense absente du formulaire                    | Table `natures_depense` (4 entrées) non exploitée                     |

---

## 4. Mutations du workflow (Détail technique)

### 4.1 Soumettre (brouillon → soumis)

```
useBudgetLines.ts:278-294
UPDATE budget_lines SET statut = 'soumis', submitted_at = now() WHERE id = ?
```

- **Pas de `submitted_by`** → qui a soumis est inconnu
- **Pas de vérification** que la ligne est bien en brouillon
- **Pas de RBAC** → n'importe qui peut soumettre

### 4.2 Valider (soumis → valide)

```
useBudgetLines.ts:297-313
UPDATE budget_lines SET statut = 'valide', validated_at = now() WHERE id = ?
```

- **Pas de `validated_by`** → qui a validé est inconnu
- **Devrait être réservé au DG ou CB** (cf. RBAC budget dans `rbac-config.ts`)
- **Pas de vérification** que la ligne est bien en soumis

### 4.3 Rejeter (soumis → rejeté)

```
useBudgetLines.ts:316-332
UPDATE budget_lines SET statut = 'rejete', rejection_reason = ? WHERE id = ?
```

- Utilise `prompt()` natif pour le motif → pas d'annulation propre
- **Pas de RBAC**

### 4.4 Supprimer (soft delete)

```
useBudgetLines.ts:335-350
RPC deactivate_budget_line(p_budget_line_id, p_reason)
```

- Utilise `confirm()` natif → pas de motif demandé dans le confirm
- Le RPC prend un `p_reason` mais le composant passe `'Désactivation manuelle'` si aucun motif fourni
- Soft delete (is_active = false), pas de hard delete ✅

### 4.5 Modifier (avec historique)

```
useBudgetLines.ts:222-275
1. GET current values
2. UPDATE budget_lines SET ... WHERE id = ?
3. INSERT INTO budget_line_history pour chaque champ modifié
```

- **Historique fonctionnel** ✅ : chaque champ modifié est tracé avec ancien/nouveau valeur
- Mais **pas de vérification de statut** → on peut modifier une ligne validée

---

## 5. Composant BudgetLineHistory

**Fichier :** `src/components/budget/BudgetLineHistory.tsx` (130 lignes)

| Fonctionnalité                      | État                             |
| ----------------------------------- | -------------------------------- |
| Affiche les modifications de champs | ✅ Fonctionnel                   |
| Date de modification                | ✅ Format dd/MM/yyyy HH:mm       |
| Nom du modificateur                 | ✅ Via join `profiles.full_name` |
| Ancien/Nouveau valeur               | ✅ Coloré rouge/vert             |
| Motif de modification               | ✅ Affiché si renseigné          |
| Labels traduits                     | ✅ FIELD_LABELS couvre 14 champs |

---

## 6. Checklist attendue vs réalité

| #   | Action attendue                          | Présente ?     | Commentaire                                        |
| --- | ---------------------------------------- | -------------- | -------------------------------------------------- |
| 1   | Voir détail (métadonnées complètes)      | **NON**        | Pas de vue lecture seule                           |
| 2   | Voir consommation (dossiers/engagements) | **NON**        | Aucun lien vers la chaîne ELOP                     |
| 3   | Historique/Audit (qui a modifié quoi)    | **OUI** ✅     | `BudgetLineHistory` fonctionnel                    |
| 4   | Valider (DG uniquement)                  | **PARTIEL** ⚠️ | Action existe mais pas de filtre RBAC              |
| 5   | Rejeter (DG uniquement)                  | **PARTIEL** ⚠️ | Action existe mais pas de filtre RBAC + `prompt()` |
| 6   | Exporter ligne (PDF/Excel)               | **NON**        | Export global uniquement                           |
| 7   | Modifier (si Brouillon seulement)        | **PARTIEL** ⚠️ | Accessible sur TOUS les statuts                    |
| 8   | Supprimer (si Brouillon + rôle)          | **PARTIEL** ⚠️ | Condition brouillon OK, mais pas de RBAC           |
| 9   | Soumettre                                | **OUI** ✅     | Condition brouillon OK                             |
| 10  | Dupliquer                                | **PARTIEL** ⚠️ | Uniquement en vue Arbre, pas en vue Tableau        |
| 11  | Modifier (avec versioning)               | **NON** ❌     | Code existe mais prop jamais passée                |
| 12  | Historique versions                      | **NON** ❌     | Code existe mais prop jamais passée                |

---

## 7. Recommandations par Priorité

### P0 — Bloquant (sécurité/fonctionnement)

1. **Appliquer la migration `funding_sources`** — La table n'existe pas, le sélecteur est cassé
2. **Ajouter contrôles RBAC sur Valider/Rejeter** — Seuls DG/CB devraient pouvoir valider (`VALIDATION_PERMISSIONS.budget` dans rbac-config)
3. **Restreindre "Modifier" au statut brouillon/rejeté** — Interdire la modification d'une ligne soumise ou validée
4. **Définir `statut: 'brouillon'` explicitement** dans l'insert de création

### P1 — Important (traçabilité/intégrité)

5. **Ajouter `created_by`, `submitted_by`, `validated_by`** dans les mutations
6. **Ajouter validation d'unicité du code** (contrainte UNIQUE en base + vérification frontend)
7. **Ajouter les champs Sous-Activité et NVE** dans le formulaire
8. **Remplacer `prompt()` et `confirm()`** par des `<Dialog>` shadcn/ui
9. **Câbler le versioning** (passer `onEditWithVersioning` et `onViewVersionHistory` dans la page)

### P2 — Améliorations UX

10. **Ajouter "Voir détail"** (fiche lecture seule avec toutes les métadonnées)
11. **Ajouter "Voir consommation"** (liste des engagements/liquidations rattachés)
12. **Ajouter "Exporter ligne"** (PDF individuel)
13. **Filtrage cascadé** dans le formulaire (OS → filtre Missions → filtre Actions → filtre Activités)
14. **Ajouter "Dupliquer"** dans la vue Tableau (actuellement uniquement en Arbre)
15. **Ajouter le champ Nature de dépense** dans le formulaire

---

## 8. Schéma du workflow actuel vs attendu

### Actuel (sans RBAC)

```
                    N'importe qui
                         │
    Brouillon ──Soumettre──► Soumis ──Valider──► Validé
         │                     │
         │                 Rejeter
         │                     │
         │                     ▼
         │                  Rejeté
         │
       Modifier (TOUS statuts ⚠️)
       Supprimer (brouillon uniquement)
```

### Attendu (avec RBAC)

```
    Opérateur/CB               DG/CB uniquement
         │                          │
    Brouillon ──Soumettre──► Soumis ──Valider──► Validé (verrouillé)
         │                     │         │
         │                 Rejeter   Signer
         │                     │
         │                     ▼
         │               Rejeté ──Modifier──► Brouillon
         │
       Modifier (brouillon/rejeté uniquement)
       Supprimer (brouillon uniquement + rôle Admin/CB)
```
