# 📖 Guide Complet : Page "Recherche Dossier"

**Pour : Utilisateur SYGFP**
**Date : 5 février 2026**
**Niveau : Débutant → Intermédiaire**

---

## 🎯 Qu'est-ce que cette page ?

La page **"Recherche Dossier"** est le **point d'entrée principal** de SYGFP. C'est LA page la plus importante de l'application.

### Pourquoi est-elle si importante ?

✅ **C'est le centre de contrôle** de toutes vos opérations de dépense
✅ **Vous pouvez tout faire** depuis cette page
✅ **C'est la vue d'ensemble** de tous vos dossiers

---

## 📁 C'est quoi un "Dossier" ?

### Définition simple

> **Un dossier = Un projet de dépense complet**

**Exemple concret :**
- Vous voulez acheter 10 ordinateurs pour le service informatique
- Vous créez **1 dossier** qui va suivre toute la procédure :
  - Expression du besoin
  - Demande de budget
  - Recherche de fournisseur
  - Signature du contrat
  - Réception des ordinateurs
  - Paiement du fournisseur

### Le dossier = Le fil conducteur

```
┌─────────────────────────────────────────────────────────┐
│                    DOSSIER #DOS-2026-001                 │
│     "Achat de 10 ordinateurs pour la DSI"               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📝 1. Note SEF        → ✅ Validée                      │
│  📝 2. Note AEF        → ✅ Validée                      │
│  📌 3. Imputation      → ✅ Faite                        │
│  📋 4. Expression Besoin → ✅ Approuvée                  │
│  📑 5. Passation Marché → 🔄 En cours...                │
│  💰 6. Engagement       → ⏳ Pas encore                 │
│  ✔️ 7. Liquidation      → ⏳ Pas encore                 │
│  📋 8. Ordonnancement   → ⏳ Pas encore                 │
│  💳 9. Règlement        → ⏳ Pas encore                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Structure de la Page

### Vue d'ensemble

```
┌──────────────────────────────────────────────────────────┐
│  🔝 HEADER                                                │
│  - Titre + Description                                    │
│  - Bouton "Aide"                                          │
│  - Bouton "+ Nouveau dossier"                             │
├──────────────────────────────────────────────────────────┤
│  🎨 CHAÎNE DE LA DÉPENSE (8 étapes)                      │
│  Schéma visuel des 9 étapes                              │
├──────────────────────────────────────────────────────────┤
│  ❓ SECTION D'AIDE (clic sur "Aide")                     │
│  Explication complète du module                          │
├──────────────────────────────────────────────────────────┤
│  📊 STATISTIQUES (5 cartes KPI)                          │
│  - Total dossiers                                         │
│  - En cours                                               │
│  - Terminés                                               │
│  - Suspendus                                              │
│  - Montant total                                          │
├──────────────────────────────────────────────────────────┤
│  🔍 BARRE DE RECHERCHE + FILTRES                          │
│  Recherche par numéro, objet, bénéficiaire...           │
├──────────────────────────────────────────────────────────┤
│  🏷️ FILTRES RAPIDES (badges cliquables)                 │
│  Tous | En cours | À valider | Terminés | Différés...   │
├──────────────────────────────────────────────────────────┤
│  📋 LISTE DES DOSSIERS (tableau)                          │
│  Affichage de tous les dossiers trouvés                  │
├──────────────────────────────────────────────────────────┤
│  📄 PAGINATION                                            │
│  Navigation entre les pages de résultats                 │
└──────────────────────────────────────────────────────────┘
```

---

## 🔍 Section par Section

### 1️⃣ Header (En-tête)

**Ce que vous voyez :**
```
┌──────────────────────────────────────────────────┐
│  Recherche Dossier                    [Aide] [+ Nouveau dossier] │
│  Point d'entrée principal - Exercice 2026       │
└──────────────────────────────────────────────────┘
```

**À quoi ça sert :**
- **Titre** : Vous rappelle où vous êtes
- **Bouton "Aide"** : Ouvre/ferme l'explication détaillée
- **Bouton "+ Nouveau dossier"** : Crée un nouveau dossier (le plus important !)
- **"Exercice 2026"** : Vous rappelle l'année en cours

---

### 2️⃣ Chaîne de la Dépense (Schéma visuel)

**Ce que vous voyez :**
```
┌─────────────────────────────────────────────────────────┐
│  Chaîne de la Dépense                        8 étapes   │
│                                                          │
│  [1] Note SEF → [2] Note AEF → [3] Imputation           │
│                        ↓                                 │
│  [9] Règlement ← [8] Ordonnancement ← [7] Liquidation   │
│                        ↑                                 │
│  [4] Expression Besoin → [5] Passation Marché            │
│                        ↓                                 │
│  [6] Engagement                                          │
└─────────────────────────────────────────────────────────┘
```

**À quoi ça sert :**
- **Visualiser le parcours** d'une dépense
- **Cliquer sur une étape** pour accéder directement au module correspondant
- **Comprendre l'ordre** : on ne peut pas faire l'étape 6 avant l'étape 5

**Les 9 étapes expliquées simplement :**

| Étape | Nom | Explication simple |
|-------|-----|-------------------|
| 1 | Note SEF | "Je demande à dépenser de l'argent pour un service" |
| 2 | Note AEF | "Je demande à dépenser de l'argent pour acheter quelque chose" |
| 3 | Imputation | "Sur quel budget je prends l'argent ?" |
| 4 | Expression Besoin | "Exactement de quoi j'ai besoin ?" |
| 5 | Passation Marché | "Je cherche un fournisseur et je négocie le prix" |
| 6 | Engagement | "Je réserve l'argent (je m'engage à payer)" |
| 7 | Liquidation | "Le fournisseur a livré, je vérifie et j'approuve le paiement" |
| 8 | Ordonnancement | "Le Trésorier dit OK pour payer" |
| 9 | Règlement | "L'argent est viré au fournisseur !" |

---

### 3️⃣ Section d'Aide

**Comment l'ouvrir :**
1. Cliquez sur le bouton **"Aide"** en haut à droite
2. La section se déplie (ou se replie si déjà ouverte)

**Ce qu'elle contient :**

#### a) Qu'est-ce qu'un dossier ?

**Texte exact de l'aide :**
> Un dossier représente une opération de dépense complète dans SYGFP. Il regroupe toutes les étapes de la chaîne de dépense : de l'expression de besoin jusqu'au règlement final. C'est le fil conducteur qui permet de suivre l'avancement d'une dépense de bout en bout.

#### b) Rechercher un dossier

**Comment faire :**
- Utiliser la **barre de recherche** pour trouver par :
  - Numéro (ex: DOS-2026-001)
  - Objet (ex: "achat ordinateurs")
  - Bénéficiaire (ex: "Service informatique")
- Cliquer sur **"Filtres"** pour affiner par :
  - Statut (En cours, Terminé, Suspendu)
  - Direction (DSI, DAAF, etc.)
  - Période (mois, trimestre, année)
  - Montant (min/max)
- Les **KPIs en haut** affichent les statistiques globales

#### c) Créer un nouveau dossier

**Pourquoi créer un dossier ?**
> Chaque dépense que l'ARTI souhaite effectuer doit être formalisée dans un dossier. C'est le point de départ obligatoire qui permet de tracer, valider et exécuter la dépense de manière structurée.

**Les 3 types de dossiers :**

1. **AEF (Achat/Engagement/Facture)**
   - Pour l'achat de **biens**, fournitures et équipements
   - Exemples : ordinateurs, mobilier, matériel de bureau

2. **SEF (Service/Engagement/Facture)**
   - Pour les **prestations de services**
   - Exemples : consultants, entretien, formation, études

3. **Marché**
   - Pour les **procédures de passation de marchés publics**
   - Exemples : gros contrats, travaux, fournitures importantes

**Une fois créé :**
> Le dossier suivra automatiquement la chaîne de dépense avec toutes ses étapes de validation.

#### d) Consulter un dossier

**Actions possibles :**
- **👁️ Œil** : Voir les détails complets
- **📊 Timeline** : Visualiser les étapes (note, engagement, liquidation...)
- **📎 Documents** : Consulter les pièces jointes
- **📜 Historique** : Voir qui a fait quoi et quand

#### e) Actions possibles

| Action | Icône | Description |
|--------|-------|-------------|
| **Modifier** | ✏️ | Mettre à jour les informations du dossier |
| **Attacher** | 📎 | Joindre des documents justificatifs |
| **Assigner** | 👤 | Affecter le dossier à un agent |
| **Bloquer/Débloquer** | 🚫 | Suspendre ou reprendre le traitement |

#### f) Bon à savoir (alerte orange)

**Message important :**
> Chaque dossier suit automatiquement la chaîne de dépense : **Note → Engagement → Liquidation → Ordonnancement → Règlement**. Les étapes se débloquent au fur et à mesure de la validation des précédentes.

**Traduction :**
- Vous ne pouvez PAS faire l'étape 7 (Liquidation) avant d'avoir terminé l'étape 6 (Engagement)
- C'est comme un jeu vidéo : il faut débloquer les niveaux dans l'ordre !

---

### 4️⃣ Statistiques (KPIs)

**Ce que vous voyez :**

```
┌─────────┬─────────┬─────────┬─────────┬─────────────┐
│  Total  │ En cours│Terminés │Suspendus│Montant total│
│    0    │    0    │    0    │    0    │   0 F CFA   │
│ dossiers│en traite│clôturés │en pause │  estimé     │
└─────────┴─────────┴─────────┴─────────┴─────────────┘
```

**À quoi ça sert :**

#### 📊 Total
- **Nombre total de dossiers** dans le système
- Tous statuts confondus
- Exemple : 150 dossiers

#### ⏱️ En cours
- Dossiers **en traitement actif**
- Quelqu'un travaille dessus actuellement
- Exemple : 45 en cours

#### ✅ Terminés
- Dossiers **complètement clôturés**
- Le règlement a été effectué
- Exemple : 85 terminés

#### ⏸️ Suspendus
- Dossiers **en pause**
- Bloqués temporairement (problème, document manquant, etc.)
- Exemple : 20 suspendus

#### 💰 Montant total
- **Somme totale** de tous les dossiers
- Affiché en format compact (ex: 2.5M = 2,500,000 F)
- Exemple : 150M F CFA

**Comment interpréter :**

```
Total: 150 dossiers
├── En cours: 45 (30%)    → Bon, activité normale
├── Terminés: 85 (57%)    → Excellent, beaucoup de dossiers finalisés
└── Suspendus: 20 (13%)   → ⚠️ À surveiller, peut-être des problèmes
```

---

### 5️⃣ Barre de Recherche + Filtres

**Ce que vous voyez :**

```
┌──────────────────────────────────────────────────────┐
│  🔍 Rechercher par numéro, objet, bénéficiaire,      │
│      code budget, n° engagement...                   │
│                                          [Filtres]    │
└──────────────────────────────────────────────────────┘
```

#### a) Barre de recherche simple

**Comment l'utiliser :**
1. Cliquez dans la barre
2. Tapez n'importe quoi :
   - **Numéro** : DOS-2026-001
   - **Objet** : "achat ordinateurs"
   - **Bénéficiaire** : "Service informatique"
   - **Code budget** : 61110
   - **N° engagement** : ENG-2026-042
3. Appuyez sur Entrée
4. Les résultats s'affichent en bas

**Astuce :**
> La recherche est **intelligente** : vous pouvez taper juste "ordi" et ça trouvera tous les dossiers qui contiennent "ordinateur", "ordinateurs", "ordination", etc.

#### b) Filtres avancés (bouton "Filtres")

**Ce que ça ouvre :**

```
┌─────────────────────────────────────────────────────┐
│  📁 Type de dossier    [Tous ▼]                     │
│  📊 Statut             [Tous ▼]                     │
│  🏢 Direction          [Toutes ▼]                   │
│  👤 Demandeur          [Tous ▼]                     │
│  📅 Période            [2026 ▼]                     │
│  📌 Étape actuelle     [Toutes ▼]                   │
│  💰 Montant min        [________]                   │
│  💰 Montant max        [________]                   │
│                                                      │
│              [Réinitialiser]  [Appliquer]           │
└─────────────────────────────────────────────────────┘
```

**Filtres disponibles :**

| Filtre | Options | Exemple |
|--------|---------|---------|
| **Type de dossier** | AEF, SEF, Marché | "Je veux voir uniquement les dossiers AEF" |
| **Statut** | En cours, Terminé, Suspendu, Brouillon | "Je veux voir uniquement les dossiers terminés" |
| **Direction** | DSI, DAAF, DMG, etc. | "Je veux voir uniquement les dossiers de la DSI" |
| **Demandeur** | Liste des agents | "Je veux voir uniquement mes dossiers" |
| **Période** | 2026, 2025, 2024... | "Je veux voir uniquement les dossiers de 2025" |
| **Étape actuelle** | Note SEF, Engagement, Liquidation, etc. | "Je veux voir uniquement les dossiers en Liquidation" |
| **Montant min** | Chiffre | "Je veux voir uniquement les dossiers > 100,000 F" |
| **Montant max** | Chiffre | "Je veux voir uniquement les dossiers < 1,000,000 F" |

**Comment utiliser les filtres :**

1. **Cliquer sur "Filtres"**
2. **Sélectionner les critères** souhaités
3. **Cliquer sur "Appliquer"**
4. Les résultats se mettent à jour automatiquement
5. **Pour tout effacer** : cliquer sur "Réinitialiser"

---

### 6️⃣ Filtres Rapides (Badges)

**Ce que vous voyez :**

```
┌──────────────────────────────────────────────────────┐
│  [Tous]  [En cours]  [À valider]  [Terminés]         │
│          [Différés]  [Rejetés]                        │
└──────────────────────────────────────────────────────┘
```

**À quoi ça sert :**
- **Filtrer rapidement** par statut
- **Un seul clic** au lieu de passer par les filtres avancés

**Les badges expliqués :**

| Badge | Couleur | Signification | Quand l'utiliser |
|-------|---------|---------------|------------------|
| **Tous** | Bleu foncé | Tous les dossiers | Voir l'ensemble |
| **En cours** | Bleu clair | Dossiers en traitement | Voir ce qui avance |
| **À valider** | Orange | Dossiers en attente de validation | **Important !** Voir ce qui attend votre action |
| **Terminés** | Vert | Dossiers clôturés | Voir l'historique |
| **Différés** | Violet | Dossiers reportés | Voir ce qui attend |
| **Rejetés** | Rouge | Dossiers refusés | Voir les problèmes |

**Comment les utiliser :**

1. **Cliquer sur un badge**
2. Le badge devient **foncé** (actif)
3. Les autres deviennent **pâles** (inactifs)
4. La liste se filtre automatiquement
5. **Pour tout réafficher** : cliquer sur "Tous"

**Astuce :**
> Le badge **"À valider"** est le plus important ! C'est là que vous voyez les dossiers qui attendent **VOTRE** action.

---

### 7️⃣ Liste des Dossiers (Tableau)

**Ce que vous voyez (si aucun dossier) :**

```
┌──────────────────────────────────────────────────────┐
│             📁                                        │
│      Aucun dossier pour cet exercice                 │
│                                                       │
│  Commencez par créer un nouveau dossier pour        │
│  initier une opération de dépense. Chaque dossier   │
│  suivra la chaîne complète : Note → Engagement →    │
│  Liquidation → Règlement.                            │
│                                                       │
│          [+ Créer un dossier]                        │
│                                                       │
│  [Type AEF]     [Type SEF]     [Type Marché]        │
└──────────────────────────────────────────────────────┘
```

**Ce que vous voyez (si des dossiers existent) :**

```
┌────────────┬────────────────────┬─────────┬─────────┬─────────┬─────────┐
│ Numéro     │ Objet              │ Direction│ Montant │ Statut  │ Actions │
├────────────┼────────────────────┼─────────┼─────────┼─────────┼─────────┤
│DOS-2026-001│Achat 10 ordinateurs│   DSI   │ 5M F    │En cours │ 👁️✏️📎 │
│DOS-2026-002│Mission à Dakar     │   DG    │ 500K F  │Terminé  │ 👁️📜  │
│DOS-2026-003│Étude de marché     │   DMG   │ 2M F    │Suspendu │ 👁️🔓  │
└────────────┴────────────────────┴─────────┴─────────┴─────────┴─────────┘
```

#### Les colonnes du tableau :

| Colonne | Contenu | Exemple |
|---------|---------|---------|
| **Numéro** | Code unique du dossier | DOS-2026-001 |
| **Objet** | Description courte | "Achat 10 ordinateurs" |
| **Direction** | Qui a demandé | DSI, DAAF, DMG... |
| **Montant** | Coût estimé | 5,000,000 F CFA |
| **Statut** | État actuel | En cours, Terminé, Suspendu |
| **Actions** | Boutons d'action | 👁️✏️📎🔒 |

#### Les actions disponibles :

**Icônes et signification :**

| Icône | Action | Quand l'utiliser |
|-------|--------|------------------|
| 👁️ **Œil** | Voir les détails | Consulter toutes les infos du dossier |
| ✏️ **Crayon** | Modifier | Changer l'objet, le montant, la direction, etc. |
| 📎 **Trombone** | Attacher | Joindre un document (facture, devis, etc.) |
| 👤 **Personne** | Assigner | Affecter le dossier à quelqu'un d'autre |
| 🔒 **Cadenas** | Bloquer | Suspendre le dossier (problème, manque doc, etc.) |
| 🔓 **Cadenas ouvert** | Débloquer | Reprendre un dossier suspendu |
| 📜 **Parchemin** | Historique | Voir qui a fait quoi et quand |

---

### 8️⃣ Pagination

**Ce que vous voyez :**

```
┌──────────────────────────────────────────────────────┐
│  Affichage de 1 à 20 sur 150 résultats               │
│                                                       │
│  [10 ▼] par page   [◀] [1] [2] [3] [4] [5] [▶]     │
└──────────────────────────────────────────────────────┘
```

**À quoi ça sert :**
- **Naviguer entre les pages** de résultats
- **Changer le nombre d'éléments** par page

**Comment utiliser :**

1. **Changer le nombre par page :**
   - Cliquer sur "10 ▼"
   - Choisir : 10, 20, 50, 100
   - La page se recharge automatiquement

2. **Naviguer entre les pages :**
   - **[◀]** : Page précédente
   - **[1] [2] [3]** : Numéro de page direct
   - **[▶]** : Page suivante

3. **Voir où vous êtes :**
   - "Affichage de 1 à 20 sur 150 résultats"
   - Signifie : Vous voyez les dossiers 1 à 20, sur un total de 150

---

## 🎬 Cas d'Usage Pratiques

### Cas 1 : Je veux créer un nouveau dossier pour acheter des ordinateurs

**Étapes :**

1. **Cliquer sur "+ Nouveau dossier"** (bouton bleu en haut à droite)

2. **Un formulaire s'ouvre** avec les champs :
   ```
   ┌────────────────────────────────────────────┐
   │  Créer un nouveau dossier                  │
   ├────────────────────────────────────────────┤
   │  Type de dossier: [AEF ▼]                  │
   │  Objet:           [Achat de 10 ordinateurs]│
   │  Direction:       [DSI ▼]                  │
   │  Montant estimé:  [5000000]                │
   │  Bénéficiaire:    [Service informatique]   │
   │  Priorité:        [Normale ▼]              │
   │  Date souhaitée:  [01/03/2026]             │
   │                                             │
   │        [Annuler]  [Créer le dossier]       │
   └────────────────────────────────────────────┘
   ```

3. **Remplir les champs :**
   - **Type** : AEF (car c'est un achat)
   - **Objet** : "Achat de 10 ordinateurs portables HP"
   - **Direction** : DSI (Direction des Systèmes d'Information)
   - **Montant** : 5,000,000 F CFA
   - **Bénéficiaire** : "Service informatique"
   - **Priorité** : Normale
   - **Date** : 01/03/2026

4. **Cliquer sur "Créer le dossier"**

5. **Un numéro est attribué automatiquement** : DOS-2026-042

6. **Le dossier apparaît dans la liste** avec le statut "Brouillon"

7. **Vous pouvez maintenant commencer la chaîne de dépense** :
   - Créer une Note SEF
   - Créer une Note AEF
   - Faire l'imputation budgétaire
   - Etc.

---

### Cas 2 : Je cherche un dossier dont je connais le numéro

**Situation :**
> Mon collègue me dit : "Regarde le dossier DOS-2026-025, il y a un problème"

**Étapes :**

1. **Dans la barre de recherche**, taper : `DOS-2026-025`

2. **Appuyer sur Entrée**

3. **Le dossier s'affiche** (si vous avez les droits)

4. **Cliquer sur l'œil 👁️** pour voir les détails

5. **Consulter le problème** :
   - Voir le statut
   - Voir l'historique
   - Voir les documents attachés
   - Voir les commentaires

---

### Cas 3 : Je veux voir tous mes dossiers en attente de validation

**Situation :**
> Je suis validateur. Je veux voir tout ce qui attend mon action.

**Étapes :**

1. **Cliquer sur le badge "À valider"** (orange)

2. **La liste se filtre automatiquement**

3. **Je vois seulement les dossiers qui m'attendent**

4. **Pour chaque dossier** :
   - Cliquer sur 👁️ pour voir
   - Lire les détails
   - Valider ou rejeter

---

### Cas 4 : Je veux voir tous les dossiers de la DSI

**Situation :**
> Je suis chef de la DSI. Je veux voir tout ce qui concerne mon service.

**Étapes :**

1. **Cliquer sur "Filtres"** (bouton en haut à droite)

2. **Dans "Direction"**, sélectionner **"DSI"**

3. **Cliquer sur "Appliquer"**

4. **La liste affiche uniquement les dossiers de la DSI**

5. **Optionnel** : Combiner avec d'autres filtres
   - Direction = DSI
   - + Statut = En cours
   - + Période = 2026
   - = Tous les dossiers DSI en cours en 2026

---

### Cas 5 : Je veux bloquer un dossier problématique

**Situation :**
> Le fournisseur du dossier DOS-2026-030 ne répond plus. Je veux suspendre ce dossier.

**Étapes :**

1. **Trouver le dossier** DOS-2026-030 (recherche ou filtres)

2. **Cliquer sur l'icône 🔒** (cadenas)

3. **Un dialog s'ouvre** :
   ```
   ┌────────────────────────────────────────────┐
   │  Bloquer le dossier                        │
   ├────────────────────────────────────────────┤
   │  Motif de blocage: *                       │
   │  [Le fournisseur ne répond plus depuis    │
   │   2 semaines. En attente de contact.]      │
   │                                             │
   │        [Annuler]  [Confirmer]              │
   └────────────────────────────────────────────┘
   ```

4. **Remplir le motif** (obligatoire)

5. **Cliquer sur "Confirmer"**

6. **Le dossier passe en statut "Suspendu"**

7. **L'icône change** : 🔒 devient 🔓 (pour débloquer plus tard)

---

## 💡 Astuces et Conseils

### Astuce 1 : Utilisez les filtres rapides

> Au lieu de passer par "Filtres" à chaque fois, **cliquez directement sur les badges** : Tous, En cours, À valider, etc.

### Astuce 2 : Sauvegardez vos filtres favoris (feature à venir)

> Si vous utilisez souvent les mêmes filtres (ex: Direction=DSI + Statut=En cours), vous pourrez bientôt sauvegarder cette combinaison.

### Astuce 3 : Utilisez Ctrl+K pour la recherche rapide

> Appuyez sur **Ctrl+K** n'importe où dans l'application pour ouvrir la recherche rapide.

### Astuce 4 : Le badge "À valider" est votre ami

> Consultez-le **tous les jours** ! C'est là que vous voyez ce qui attend **votre** action.

### Astuce 5 : Attachez les documents dès le début

> Dès la création du dossier, **attachez tous les documents** (devis, facture proforma, etc.). Vous gagnerez du temps plus tard.

---

## ❓ Questions Fréquentes

### Q1 : Pourquoi je ne vois aucun dossier ?

**Réponses possibles :**

1. **Aucun dossier n'existe encore**
   - Solution : Créer un nouveau dossier avec "+ Nouveau dossier"

2. **Vous avez des filtres actifs**
   - Solution : Cliquer sur "Réinitialiser" dans les filtres

3. **Vous n'avez pas les droits sur ces dossiers**
   - Solution : Contacter l'administrateur pour vérifier vos permissions

4. **Vous êtes sur le mauvais exercice**
   - Solution : Changer l'exercice (2026, 2025, etc.)

---

### Q2 : Quelle est la différence entre AEF, SEF et Marché ?

| Type | Pour quoi | Exemples |
|------|-----------|----------|
| **AEF** | Achats de biens | Ordinateurs, mobilier, fournitures |
| **SEF** | Prestations de services | Consultants, formations, études |
| **Marché** | Marchés publics | Gros contrats > 10M F, travaux |

**Règle simple :**
- **Objet tangible** (on peut le toucher) → AEF
- **Prestation** (quelqu'un fait quelque chose pour nous) → SEF
- **Gros contrat** (> seuil des marchés publics) → Marché

---

### Q3 : Puis-je supprimer un dossier ?

**Non.** On ne supprime **JAMAIS** un dossier.

**Pourquoi ?**
- Traçabilité légale
- Audit
- Historique

**Si vous avez créé un dossier par erreur :**
1. Le **bloquer** avec le motif "Créé par erreur"
2. Le laisser en statut "Brouillon"
3. Ne plus y toucher

---

### Q4 : Combien de temps garde-t-on les dossiers ?

**Tous les dossiers sont conservés indéfiniment.**

**Pourquoi ?**
- Obligation légale (10 ans minimum)
- Contrôles financiers
- Audits

**Comment ne plus voir les vieux dossiers ?**
- Utiliser le **filtre "Période"** : sélectionner uniquement 2026
- Ou utiliser le filtre "Statut" : exclure les "Terminés"

---

### Q5 : Que signifie "Optionnel" dans la chaîne de dépense ?

**Message :**
> "Les étapes se débloquent progressivement - Optionnel → selon le montant"

**Explication :**

Certaines étapes sont **optionnelles** selon le montant :

| Montant | Étapes obligatoires | Étapes optionnelles |
|---------|---------------------|---------------------|
| < 100K F | Note → Engagement → Liquidation → Règlement | Marché (optionnel) |
| 100K - 1M F | Note → Expression → Engagement → Liquidation → Règlement | Marché (optionnel) |
| > 1M F | **Toutes les étapes obligatoires** | Aucune |

**Règle simple :**
- **Petit montant** : Chaîne simplifiée
- **Gros montant** : Chaîne complète (9 étapes)

---

## 🔧 Dépannage

### Problème 1 : "Erreur de chargement"

**Message d'erreur :**
> "Failed to load resource: the server responded with a status of 500"

**Solutions :**

1. **Rafraîchir la page** (F5 ou Ctrl+R)

2. **Vérifier votre connexion Internet**

3. **Vider le cache** :
   - Ctrl+Shift+Delete
   - Cocher "Images et fichiers en cache"
   - Cliquer "Effacer les données"

4. **Si ça persiste** : Contacter le support technique

---

### Problème 2 : "Aucun dossier trouvé" alors que je sais qu'ils existent

**Causes possibles :**

1. **Filtres actifs**
   - Solution : Cliquer sur "Réinitialiser"

2. **Exercice incorrect**
   - Solution : Vérifier l'exercice (2026, 2025, etc.)

3. **Permissions insuffisantes**
   - Solution : Contacter l'administrateur

---

### Problème 3 : Le bouton "Créer un dossier" ne fait rien

**Solutions :**

1. **Vérifier que vous avez les droits**
   - Rôle requis : Opérationnel ou supérieur

2. **Vérifier qu'un exercice est ouvert**
   - Si "Aucun exercice ouvert", contacter l'administrateur

3. **Vérifier votre navigateur**
   - Chrome, Firefox, Edge (récents)
   - Mettre à jour si nécessaire

---

## 📊 Résumé Visuel

```
┌─────────────────────────────────────────────────────────┐
│                 PAGE RECHERCHE DOSSIER                   │
│                                                          │
│  🎯 Objectif : Point d'entrée principal de SYGFP        │
│                                                          │
│  📁 Concept : 1 dossier = 1 opération de dépense        │
│                                                          │
│  🔑 Actions principales :                                │
│     1. Créer un nouveau dossier                         │
│     2. Rechercher un dossier existant                   │
│     3. Filtrer les dossiers (statut, direction, etc.)   │
│     4. Consulter les détails d'un dossier              │
│     5. Modifier / Attacher / Bloquer                    │
│                                                          │
│  📊 Statistiques :                                       │
│     - Total, En cours, Terminés, Suspendus              │
│     - Montant total estimé                              │
│                                                          │
│  🎨 Workflow :                                           │
│     Note → Engagement → Liquidation →                   │
│     Ordonnancement → Règlement                          │
│                                                          │
│  💡 Conseil : Utilisez le badge "À valider" pour        │
│     voir ce qui attend VOTRE action !                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 Pour aller plus loin

### Documentation complémentaire

- **Guide utilisateur complet** : `docs/USER_GUIDE.md`
- **Workflow SYGFP** : `docs/FLUX_SEF_AEF.md`
- **Architecture** : `docs/ARCHITECTURE_TECHNIQUE.md`

### Formation recommandée

1. **Niveau 1 : Débutant** (ce document)
   - Comprendre la page Recherche Dossier
   - Créer un dossier simple
   - Rechercher et consulter

2. **Niveau 2 : Intermédiaire**
   - Utiliser les filtres avancés
   - Gérer le workflow complet
   - Attacher des documents

3. **Niveau 3 : Avancé**
   - Bloquer/Débloquer des dossiers
   - Assigner à d'autres agents
   - Analyser les statistiques

---

## 📞 Support

**Questions ? Problèmes ?**

- **Email** : dsi@arti.ci
- **Téléphone** : +241 XX XX XX XX
- **Documentation** : http://localhost:8080/admin/documentation

---

**Document créé le :** 5 février 2026
**Version :** 1.0
**Auteur :** Équipe SYGFP - ARTI Gabon
