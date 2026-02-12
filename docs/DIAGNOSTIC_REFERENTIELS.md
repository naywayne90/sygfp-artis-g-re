# Diagnostic des Référentiels - Module Structure Budgétaire

**Date :** 11 février 2026
**Module :** `/planification/structure` (StructureBudgetaire.tsx)
**Statut :** Diagnostic uniquement - AUCUNE MODIFICATION

---

## 1. Synthèse Globale

| #   | Référentiel                | En base         | Affiché UI | Écart      | Cause                                      |
| --- | -------------------------- | --------------- | ---------- | ---------- | ------------------------------------------ |
| 1   | **Directions**             | 25 (16 actives) | **16**     | 9 masquées | Filtre `est_active = true` exclut 9 legacy |
| 2   | **Objectifs Stratégiques** | 5               | **5**      | 0          | OK - Pas de filtre actif                   |
| 3   | **Missions**               | 5               | **5**      | 0          | OK - Pas de filtre actif                   |
| 4   | **Actions**                | 6               | **0**      | 6          | Pas d'onglet dans l'UI                     |
| 5   | **Activités**              | 46              | **0**      | 46         | Pas d'onglet dans l'UI                     |
| 6   | **Sous-Activités**         | 13              | **0**      | 13         | Pas d'onglet dans l'UI                     |
| 7   | **Natures de dépense**     | 4               | **0**      | 4          | Pas d'onglet dans l'UI                     |
| 8   | **NVE (ref_nve)**          | 10              | **0**      | 10         | Pas d'onglet dans l'UI                     |

---

## 2. Directions — Analyse Détaillée

### 2.1 Les 16 directions ACTIVES (affichées)

| Code    | Sigle   | Label complet                                                                                  |
| ------- | ------- | ---------------------------------------------------------------------------------------------- |
| AICB    | AICB    | Auditeur Interne / Contrôleur Budgétaire                                                       |
| CB      | CB      | Contrôleur Budgétaire                                                                          |
| CM      | CM      | Chargé de Mission du Directeur Général                                                         |
| DAAF    | DAAF    | Direction des Affaires Administratives et Financières                                          |
| DCP     | DCP     | Direction de la Communication et du Partenariat                                                |
| DCSTI   | DCSTI   | Direction du Contrôle et de Surveillance du Transport Intérieur                                |
| DCZ     | DCZ     | Direction Centrale des Zones                                                                   |
| DG      | DG      | Direction Générale                                                                             |
| DGPECRP | DGPECRP | Direction de la Gestion Prévisionnelle de l'Emploi, des Compétences et des Relations Publiques |
| DP      | DP      | Direction du Patrimoine                                                                        |
| DQ      | DQ      | Direction de la Qualité                                                                        |
| DRRN    | DRRN    | Direction des Recours, de la Réglementation et des Normes                                      |
| DSESP   | DSESP   | Direction des Statistiques, des Études, de la Stratégie et de la Prospective                   |
| DSI     | DSI     | Direction des Systèmes d'Information                                                           |
| PCR     | PCR     | Présidence du Conseil de Régulation                                                            |
| SDMG    | SDMG    | Service des Moyens Généraux                                                                    |

### 2.2 Les 9 directions INACTIVES (masquées)

| Code | Sigle   | Label                                                                        | Doublon de      | Explication                                    |
| ---- | ------- | ---------------------------------------------------------------------------- | --------------- | ---------------------------------------------- |
| 01   | DG      | Direction Générale de l'ARTI                                                 | DG (actif)      | Ancien code numérique, remplacé par code alpha |
| 02   | DAAF    | Direction des Affaires Administratives et financières                        | DAAF (actif)    | Ancien code numérique                          |
| 04   | DSESP   | Direction des Statistiques, des Études, de la Stratégie et de la Prospective | DSESP (actif)   | Ancien code numérique                          |
| 05   | DGPECRP | Direction de la Gestion Prévisionnelle de l'Emploi                           | DGPECRP (actif) | Ancien code numérique                          |
| 06   | DCSTI   | Directeur du Contrôle et de la Surveillance du Transport Intérieur           | DCSTI (actif)   | Ancien code numérique                          |
| 07   | DRRN    | Direction des Recours, de la Réglementation et des Normes                    | DRRN (actif)    | Ancien code numérique                          |
| 09   | DSI     | Directeur des Systèmes d'Information par Intérim                             | DSI (actif)     | Ancien code numérique                          |
| 11   | AC      | AGENT                                                                        | **Aucun**       | Legacy - pas d'équivalent actif                |
| 16   | AS      | Autres Services                                                              | **Aucun**       | Legacy - pas d'équivalent actif                |

**Conclusion directions :** 7 des 9 inactives sont des doublons des actives (anciens codes numériques vs nouveaux codes alpha). 2 sont des entrées legacy uniques (AGENT, Autres Services) sans équivalent actif.

### 2.3 Cause de l'écart UI

**Fichier :** `src/hooks/useBaseReferentiels.ts` ligne 60

```typescript
.eq("est_active", true)  // ← Ce filtre exclut les 9 directions inactives
```

Le filtrage est **correct et voulu** — les 9 inactives sont des doublons legacy de la migration depuis SQL Server.

### 2.4 Pourquoi 25 et pas 24 ?

L'utilisateur attendait 24, mais la base contient 25. La 25e est probablement un artefact de migration. Avec les 16 actives + 9 inactives = 25 total.

---

## 3. Objectifs Stratégiques — OK

| Code | Libellé                                                                                            |
| ---- | -------------------------------------------------------------------------------------------------- |
| 11   | Construire la structure fonctionnelle et de pilotage de l'autorité                                 |
| 12   | Construire les outils de collectes, de traitement et de production de données statistiques fiables |
| 13   | Renforcer le contrôle et la Régulation des acteurs du transport intérieur                          |
| 14   | Faire mieux appliquer le cadre régulatoire actuel                                                  |
| 15   | Utiliser plus efficacement l'ensemble des pouvoirs dévolus au régulateur                           |

**Filtre :** Aucun filtre `est_actif` dans la requête (ligne 74 du hook). Tous les 5 sont retournés.
**Onglet :** Présent dans l'UI ✅

---

## 4. Missions — OK

| Code | Libellé                         |
| ---- | ------------------------------- |
| M11  | Mission Structure fonctionnelle |
| M12  | Mission Données statistiques    |
| M13  | Mission Contrôle régulation     |
| M14  | Mission Cadre réglementaire     |
| M15  | Mission Pouvoirs régulateur     |

**Filtre :** Aucun filtre `est_active` dans la requête (ligne 88 du hook). Tous les 5 sont retournés.
**Onglet :** Présent dans l'UI ✅

---

## 5. Actions — ABSENT de l'UI

| Code | Libellé                                                                       | OS    | Mission |
| ---- | ----------------------------------------------------------------------------- | ----- | ------- |
| 01   | Améliorer les performances opérationnelles de l'ARTI                          | OS 11 | M11     |
| 02   | Disposer d'outils fiables de collectes et d'analyse de données                | OS 12 | M12     |
| 03   | Mettre en œuvre la régulation des activités du secteur du transport intérieur | OS 13 | M13     |
| 04   | Approfondir la régulation par la donnée                                       | OS 14 | M14     |
| 05   | Acquérir une vision transversale des différents marchés de transport          | OS 15 | M15     |
| 06   | Lutter contre les problématiques liées au changement climatique               | OS 15 | M15     |

**Hook :** Les actions sont chargées dans `useBaseReferentiels` (ligne 97-109) avec filtre `est_active = true`.
**Page :** `StructureBudgetaire.tsx` ligne 87 ne destructure PAS `actions` :

```typescript
const { directions, objectifsStrategiques, missions } = useBaseReferentiels();
// ↑ actions, activites, sousActivites sont ignorés
```

**Onglet :** ABSENT ❌

---

## 6. Activités — ABSENT de l'UI

**46 activités en base**, toutes actives, réparties par action :

| Action parent                     | Nombre d'activités | Plage codes                 |
| --------------------------------- | ------------------ | --------------------------- |
| Action 01 (Performances)          | 23                 | 101-112, 801-903, 1001-1003 |
| Action 02 (Données)               | 6                  | 201-206                     |
| Action 03 (Régulation)            | 8                  | 301-306, 602                |
| Action 04 (Cadre régulatoire)     | 4                  | 401-404                     |
| Action 05 (Vision transversale)   | 8                  | 501-506, 701-702            |
| Action 06 (Changement climatique) | 1                  | 601                         |

**Hook :** Chargées dans `useBaseReferentiels` (lignes 112-124) avec filtre `est_active = true`.
**Onglet :** ABSENT ❌

---

## 7. Sous-Activités — ABSENT de l'UI

**13 sous-activités en base**, toutes actives.

| Code | Libellé                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------- |
| 01   | Analyse des données du transport intérieur et prise en compte efficiente des intérêts des usagers |
| 02   | Application des principes de bonne gouvernance                                                    |
| 03   | Audits indépendants des conventions de service public                                             |
| 04   | Base de données des entreprises du secteur                                                        |
| 05   | Contrôle du processus de visite technique automobile                                              |
| 06   | Coordination dans les zones non couvertes par les autorités de mobilité                           |
| 07   | Élaboration des règles dans les domaines non réglementés                                          |
| 08   | Encouragement à la collaboration des acteurs                                                      |
| 09   | Indicateurs et normes de qualité de service et de performance                                     |
| 10   | Participation à l'élaboration de la réglementation                                                |
| 11   | Participation aux accords et conventions internationaux                                           |
| 12   | Veille à l'application de la réglementation                                                       |
| 13   | Fonctionnement de l'ARTI                                                                          |

**Hook :** Chargées dans `useBaseReferentiels` (lignes 127-139) avec filtre `est_active = true`.
**Onglet :** ABSENT ❌

---

## 8. Natures de Dépense — ABSENT de l'UI

| Code | Libellé           |
| ---- | ----------------- |
| 1    | Personnels        |
| 2    | Biens et services |
| 3    | Transferts        |
| 4    | Investissements   |

**Table :** `natures_depense`
**Hook :** Non chargées dans `useBaseReferentiels`. Aucun hook dédié trouvé.
**Onglet :** ABSENT ❌

---

## 9. NVE (Nomenclature de la Ventilation Économique) — ABSENT de l'UI

| Code NVE | Libellé                               |
| -------- | ------------------------------------- |
| NVE-611  | Fournitures de bureau et consommables |
| NVE-612  | Petit matériel et outillage           |
| NVE-613  | Prestations de services               |
| NVE-614  | Entretien et réparations              |
| NVE-615  | Primes d'assurances                   |
| NVE-616  | Études et recherches                  |
| NVE-617  | Publicité et relations publiques      |
| NVE-618  | Frais de télécommunications           |
| NVE-621  | Personnel temporaire                  |
| NVE-622  | Rémunérations intermédiaires          |

**Table :** `ref_nve`
**Hook :** Non chargées dans `useBaseReferentiels`. Aucun hook dédié trouvé.
**Onglet :** ABSENT ❌

---

## 10. Anomalie de nommage des colonnes "actif"

4 conventions différentes dans les tables de référentiel :

| Convention             | Tables                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `est_actif` (masculin) | `objectifs_strategiques`, `exercices_budgetaires`                                     |
| `est_active` (féminin) | `missions`, `actions`, `activites`, `sous_activites`, `natures_depense`, `directions` |
| `actif` (sans préfixe) | `ref_nve`                                                                             |
| `is_active` (anglais)  | `budget_lines`, `profiles`                                                            |

Cela rend les requêtes génériques impossibles et crée un risque d'erreur.

---

## 11. Tables vides / inutilisées

| Table                            | Records | Statut                          |
| -------------------------------- | ------- | ------------------------------- |
| `budget_versions`                | 0       | Vide - jamais utilisée          |
| `budget_activities`              | 0       | Vide - doublon de `activites` ? |
| `budget_imports`                 | 0       | Vide                            |
| `taches`                         | 0       | Vide                            |
| `lignes_budgetaires_referentiel` | 0       | Vide - table fantôme            |
| `ref_sequences`                  | 0       | Vide                            |

---

## 12. Onglets actuels vs recommandés

### État actuel de l'UI (4 onglets)

```
[Lignes budgétaires] [Objectifs Stratégiques (5)] [Directions (16)] [Missions (5)]
```

### Onglets manquants recommandés

| Onglet à ajouter       | Table source      | Records | Priorité | Justification                                          |
| ---------------------- | ----------------- | ------- | -------- | ------------------------------------------------------ |
| **Actions**            | `actions`         | 6       | **P1**   | Lien OS → Mission, essentiel pour la hiérarchie budget |
| **Activités**          | `activites`       | 46      | **P1**   | Détail opérationnel des actions, 46 entrées            |
| **Sous-Activités**     | `sous_activites`  | 13      | **P2**   | Niveau de détail fin                                   |
| **Natures de dépense** | `natures_depense` | 4       | **P1**   | Classification macro des dépenses                      |
| **NVE**                | `ref_nve`         | 10      | **P2**   | Ventilation économique détaillée                       |

### Structure recommandée des onglets

```
[Lignes budgétaires]
[Objectifs Stratégiques (5)]
[Missions (5)]
[Actions (6)]               ← NOUVEAU
[Activités (46)]            ← NOUVEAU
[Sous-Activités (13)]       ← NOUVEAU
[Directions (16)]
[Natures de dépense (4)]    ← NOUVEAU
[NVE (10)]                  ← NOUVEAU
```

Cela refléterait la hiérarchie budgétaire complète :

```
OS → Mission → Action → Activité → Sous-Activité → Ligne budgétaire
                                                      ↓
                                              Direction + Nature + NVE
```

---

## 13. Hiérarchie complète des référentiels (arbre)

```
Objectifs Stratégiques (5)
├── OS 11 : Structure fonctionnelle
│   └── Mission M11
│       └── Action 01 : Performances opérationnelles (23 activités)
├── OS 12 : Données statistiques
│   └── Mission M12
│       └── Action 02 : Outils de collecte (6 activités)
├── OS 13 : Contrôle et régulation
│   └── Mission M13
│       └── Action 03 : Régulation transport (8 activités)
├── OS 14 : Cadre régulatoire
│   └── Mission M14
│       └── Action 04 : Régulation par la donnée (4 activités)
└── OS 15 : Pouvoirs du régulateur
    └── Mission M15
        ├── Action 05 : Vision transversale (8 activités)
        └── Action 06 : Changement climatique (1 activité)

Classification transversale :
├── Directions (16 actives) → rattachement organisationnel
├── Natures de dépense (4) → catégorie macro
└── NVE (10) → ventilation économique détaillée
```

---

## 14. Données de contexte

- **Exercice actif :** 2026 (11,39 milliards FCFA, 277 lignes budgétaires)
- **Hook principal :** `src/hooks/useBaseReferentiels.ts` (159 lignes)
- **Page principale :** `src/pages/planification/StructureBudgetaire.tsx` (527 lignes)
- **Le hook charge déjà** actions, activités et sous-activités, mais la page les IGNORE
