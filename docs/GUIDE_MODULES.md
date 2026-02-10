# Guide des Modules SYGFP

**Système de Gestion des Finances Publiques - ARTI Côte d'Ivoire**
**Dernière mise à jour :** 9 février 2026

---

## Vue d'ensemble

SYGFP est organisé en **6 sections principales** visibles dans la barre latérale :

| #   | Section              | Nb Modules | Description                                        |
| --- | -------------------- | ---------- | -------------------------------------------------- |
| 0   | Accueil              | 2          | Dashboard + Recherche                              |
| 1   | Chaîne de la Dépense | 9          | Les 9 étapes du flux de dépense publique           |
| 2   | Budget               | 5          | Structure, planification, virements, import/export |
| 3   | Suivi & Pilotage     | 6          | Tableaux de bord, états, alertes, scans            |
| 4   | Gestion              | 7          | Prestataires, contrats, trésorerie, recettes       |
| 5   | Administration       | 14+        | Référentiels, utilisateurs, système                |

**Total : 50+ pages / modules**

---

## Légende des statuts

| Statut              | Signification                                                |
| ------------------- | ------------------------------------------------------------ |
| ✅ Fonctionnel      | Module opérationnel avec données réelles                     |
| ⚠️ Partiel          | Module fonctionnel mais certaines fonctionnalités manquantes |
| 🔧 En développement | Module en cours de développement                             |
| 📋 Placeholder      | Interface créée mais sans logique métier                     |

---

## 0. ACCUEIL

### 0.1 Dashboard (Accueil)

- **Route :** `/`
- **Fichier :** `src/pages/Dashboard.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Aiguilleur intelligent qui affiche un dashboard différent selon le rôle de l'utilisateur connecté.
- **Dashboards disponibles :**
  - **DG** → Vue globale avec KPIs de l'organisation entière
  - **DAF/SDCT** → Vue financière avec suivi budgétaire
  - **Trésorerie/AC** → Vue trésorerie avec soldes et paiements
  - **DSI** → Vue informatique
  - **DMG** → Vue moyens généraux
  - **CB (Contrôleur Budgétaire)** → Vue contrôle
  - **HR** → Vue ressources humaines
  - **AICB** → Vue auditeur
  - **Admin** → Vue complète avec tous les onglets (mode debug)
  - **Autres directions** → Dashboard générique de direction
- **Données :** KPIs temps réel depuis `budget_lines`, `engagements`, `liquidations`, `ordonnancements`, `reglements`

### 0.2 Recherche Dossier

- **Route :** `/recherche`
- **Fichier :** `src/pages/Recherche.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Recherche transversale dans tous les dossiers (Notes SEF, AEF, engagements, etc.) par numéro de référence, objet ou montant.
- **Fonctionnalités :** Recherche full-text, filtres par type de document, résultats paginés, navigation vers le détail

---

## 1. CHAÎNE DE LA DÉPENSE (9 étapes)

La chaîne de la dépense est le flux principal de SYGFP. Chaque dépense passe par ces 9 étapes séquentielles :

```
Note SEF → Note AEF → Imputation → Expression Besoin → Passation Marché
    → Engagement → Liquidation → Ordonnancement → Règlement
```

### 1.1 Notes SEF (Soumission à l'Engagement Financier)

- **Route :** `/notes-sef`
- **Fichier :** `src/pages/NotesSEF.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Première étape de la chaîne. Une direction soumet une demande de dépense (Note SEF) pour approbation.
- **Fonctionnalités :**
  - Liste paginée des notes SEF avec filtres (statut, direction, recherche)
  - Création d'une nouvelle Note SEF (formulaire multi-champs)
  - Détail d'une note (`/notes-sef/:id` → `NoteSEFDetail.tsx`)
  - Workflow de validation (brouillon → soumise → validée/rejetée)
  - Export PDF
  - Pièces jointes
  - Badge compteur dans le menu latéral
- **Données :** Table `notes_sef` (~4,836 enregistrements)
- **Validation :** `/notes-sef/validation` → `ValidationNotesSEF.tsx` (page de validation pour les validateurs)

### 1.2 Notes AEF (Avis d'Engagement Financier)

- **Route :** `/notes-aef`
- **Fichier :** `src/pages/NotesAEF.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Deuxième étape. Le contrôleur budgétaire (CB) émet un avis sur la Note SEF pour créer la Note AEF.
- **Fonctionnalités :**
  - Liste des Notes AEF avec filtres
  - Détail d'une note (`/notes-aef/:id` → `NoteAEFDetail.tsx`)
  - Exposé des motifs, avis du CB, recommandation
  - Workflow de validation
  - Export PDF avec QR code d'authentification
  - Badge compteur dans le menu
- **Données :** Table `notes_aef`
- **Validation :** `/notes-aef/validation` → `ValidationNotesAEF.tsx`

### 1.3 Imputation Budgétaire

- **Route :** `/execution/imputation`
- **Fichier :** `src/pages/execution/ImputationPage.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Étape 3 - Affecter la dépense à une ligne budgétaire spécifique (code à 18 chiffres).
- **Fonctionnalités :**
  - Sélection de la ligne budgétaire (code d'imputation)
  - Vérification de la disponibilité des crédits
  - Affectation du montant à la bonne imputation
  - Format d'imputation : OS(2) + Action(2) + Activité(3) + SousActivité(2) + Direction(2) + NatureDépense(1) + NBE(6)

### 1.4 Expression de Besoin

- **Route :** `/execution/expression-besoin`
- **Fichier :** `src/pages/execution/ExpressionBesoin.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Étape 4 - La direction opérationnelle exprime son besoin détaillé (articles, quantités, prix).
- **Fonctionnalités :**
  - Liste des expressions de besoin
  - Création avec détail des articles/services
  - Workflow de validation
  - Lien avec la Note SEF source

### 1.5 Passation de Marché

- **Route :** `/marches` et `/execution/passation-marche`
- **Fichier :** `src/pages/Marches.tsx`, `src/pages/execution/PassationMarche.tsx`
- **Statut :** ⚠️ Partiel
- **Description :** Étape 5 - Processus de mise en concurrence des fournisseurs (appels d'offres, consultations).
- **Fonctionnalités :**
  - Liste des marchés
  - Suivi de l'état d'avancement
  - Types de passation (gré à gré, consultation, appel d'offres)

### 1.6 Engagement

- **Route :** `/engagements`
- **Fichier :** `src/pages/Engagements.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Étape 6 - L'ordonnateur engage juridiquement l'État à payer le fournisseur sélectionné.
- **Fonctionnalités :**
  - Liste des engagements avec filtres (statut, direction, montant)
  - Création d'engagement lié à une expression de besoin
  - Workflow de validation multi-niveaux
  - Scan/vérification d'engagement (`/execution/scanning-engagement`)
  - Export PDF
  - Badge compteur dans le menu
- **Données :** Table `engagements` (~2,805 enregistrements)

### 1.7 Liquidation

- **Route :** `/liquidations`
- **Fichier :** `src/pages/Liquidations.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Étape 7 - Constatation du service fait. Le fournisseur a livré, la dette de l'État est confirmée.
- **Fonctionnalités :**
  - Liste des liquidations avec filtres
  - Création liée à un engagement
  - Workflow de validation
  - Scan/vérification (`/execution/scanning-liquidation`)
  - Export PDF
  - Badge compteur
- **Données :** Table `liquidations` (~3,633 enregistrements)

### 1.8 Ordonnancement

- **Route :** `/ordonnancements`
- **Fichier :** `src/pages/Ordonnancements.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Étape 8 - L'ordonnateur donne l'ordre au comptable de payer. C'est le "mandat de paiement".
- **Fonctionnalités :**
  - Liste des ordonnancements avec filtres
  - Création liée à une liquidation
  - Workflow de validation
  - Export PDF
  - Badge compteur
- **Données :** Table `ordonnancements` (~3,501 enregistrements)

### 1.9 Règlement

- **Route :** `/reglements`
- **Fichier :** `src/pages/Reglements.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Étape 9 (finale) - Le comptable public effectue le paiement effectif au fournisseur.
- **Fonctionnalités :**
  - Liste des règlements
  - Saisie du moyen de paiement (virement, chèque)
  - Reçu de paiement PDF avec QR code
  - Clôture du dossier de dépense
  - Badge compteur

---

## 2. BUDGET

### 2.1 Structure Budgétaire

- **Route :** `/planification/structure`
- **Fichier :** `src/pages/planification/StructureBudgetaire.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Vue hiérarchique de toutes les lignes budgétaires de l'exercice en cours.
- **Fonctionnalités :**
  - Arborescence : OS → Mission → Action → Activité → Sous-Activité → Ligne
  - 277 lignes budgétaires pour l'exercice 2026
  - Filtres par direction, OS, statut, recherche texte
  - 3 formats d'export : CSV (16 colonnes), Excel (avec en-tête ARTI), PDF (paysage A4)
  - Montants : dotation initiale, modifiée, engagé, liquidé, ordonnancé, payé, disponible
  - Total général : ~11,4 milliards FCFA
- **Données :** Table `budget_lines` avec jointures sur `directions`, `objectifs_strategiques`

### 2.2 Plan de Travail

- **Route :** `/planification/plan-travail`
- **Fichier :** `src/pages/planification/PlanTravail.tsx` (~998 lignes)
- **Statut :** ✅ Fonctionnel (refonte complète le 09/02/2026)
- **Description :** Tableau de bord professionnel de suivi de l'exécution budgétaire par objectif stratégique et par direction.
- **Fonctionnalités :**
  - **6 KPIs en haut de page (avec loading skeleton) :**
    - Dotation totale (budget alloué)
    - Engagé (montant + % du budget)
    - Liquidé (montant + % des engagements)
    - Ordonnancé (montant + % des liquidations)
    - Payé (montant + % du budget)
    - Disponible (restant = dotation - engagé, bordure rouge si négatif)
  - **3 vues en onglets :**
    - **Par Objectif Stratégique** : agrégation par OS avec 10 colonnes (Code, Libellé, Nb Lignes, Dotation, Engagé, Liquidé, Ordonnancé, Payé, Disponible, Taux Exécution)
    - **Par Direction** : même structure, agrégation par direction
    - **Détail lignes** : toutes les lignes budgétaires (sans limite), 11 colonnes avec Dotation Init., Dotation Mod., Ordonnancé
  - **Filtres appliqués à TOUTES les vues :**
    - Recherche texte (code ou libellé)
    - Direction (menu déroulant avec toutes les directions)
    - Objectif Stratégique (menu déroulant avec tous les OS)
    - Bouton Réinitialiser (désactivé si aucun filtre actif)
    - Indicateur "X / Y ligne(s) affichée(s) selon les filtres"
  - **Export multi-format professionnel (CSV / Excel / PDF) :**
    - Menu déroulant par onglet pour choisir le format
    - Export agrégé (10 colonnes) avec totaux
    - Export détaillé (16 colonnes) avec totaux
    - Branding ARTI (en-tête, pied de page)
    - Orientation paysage pour le PDF
  - **Ligne de TOTAL** dans chaque tableau (TableFooter)
  - **Taux d'exécution coloré** : vert (≥75%), orange (≥50%), ambre (≥25%)
  - **Barres de progression** colorées selon le taux
  - **Montants négatifs** en rouge (dépassement de budget)
  - **Tooltips** sur les cellules tronquées
  - **Logique dotation effective** : `dotation_modifiee ?? dotation_initiale` (fallback robuste)
- **Données :** Table `budget_lines` (250 lignes 2026) agrégée via hooks `useBudgetLines` et `useBaseReferentiels`. Jointures sur `directions`, `objectifs_strategiques`, `missions`, `actions`, `activites`, etc.
- **Synchronisation backend :** Toutes les lignes ont `dotation_modifiee` et `disponible_calcule` correctement renseignés.
- **Qualité :** 0 erreurs TypeScript, 0 erreurs ESLint, build de production OK, 37/37 tests unitaires passent.
- **Améliorations possibles :**
  - Ajouter des graphiques (camemberts, barres d'exécution par direction/OS)
  - Ajouter un historique d'exécution mensuel
  - Drill-down : cliquer sur une direction/OS pour voir les lignes détaillées

### 2.3 Virements Budgétaires

- **Route :** `/planification/virements`
- **Fichier :** `src/pages/planification/Virements.tsx`
- **Statut :** ⚠️ Partiel
- **Description :** Transfert de crédits entre lignes budgétaires (d'une imputation à une autre).
- **Fonctionnalités :**
  - Création d'une demande de virement (source → destination)
  - Workflow de validation (demande → validation DAF → approbation DG)
  - Historique des virements
  - Badge compteur pour virements en attente
- **Données :** Table `budget_transfers`

### 2.4 Réaménagements par Imputations

- **Route :** `/budget/reamenagements-imputations`
- **Fichier :** `src/pages/budget/ReamenementsImputations.tsx`
- **Statut :** ⚠️ Partiel
- **Description :** Modification de la répartition des crédits entre imputations budgétaires (plus flexible que les virements).
- **Fonctionnalités :**
  - Vue des imputations modifiables
  - Proposition de réaménagement
  - Impact sur les dotations modifiées

### 2.5 Import / Export Budget

- **Route :** `/planification/import-export`
- **Fichier :** `src/pages/planification/ImportExport.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Interface centralisée pour importer/exporter les données budgétaires.
- **Fonctionnalités :**
  - **Import :** Upload Excel avec wizard 4 étapes (sélection fichier → aperçu → validation → résultat)
  - **Export :** 4 types (template vide, lignes budgétaires, référentiels, erreurs d'import)
  - Sécurité : seuls les rôles DAAF, SDMG, CB peuvent importer
  - Template téléchargeable avec les référentiels pré-remplis
  - Historique des imports (`/planification/historique-imports`)
  - Documentation (`/planification/documentation-import`)
  - Aide interactive (`/planification/aide-import`)

---

## 3. SUIVI & PILOTAGE

### 3.1 Tableau Financier

- **Route :** `/dashboard-financier`
- **Fichier :** `src/pages/DashboardFinancier.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Vue consolidée des finances de l'organisation avec répartition par direction.
- **Fonctionnalités :**
  - KPIs globaux (budget, engagements, liquidations, paiements)
  - Tableau détaillé par direction
  - Filtres par direction
  - Formatage en FCFA
- **Données :** Vue `v_tableau_financier`

### 3.2 Ma Direction (Roadmap Direction)

- **Route :** `/planification/roadmap-direction`
- **Fichier :** `src/pages/planification/RoadmapDirection.tsx`
- **Statut :** ⚠️ Partiel
- **Description :** Vue de suivi des activités et projets de la direction de l'utilisateur connecté.
- **Fonctionnalités :**
  - Feuille de route de la direction
  - Tâches en cours et à venir
  - Taux d'avancement

### 3.3 États d'Exécution

- **Route :** `/etats-execution`
- **Fichier :** `src/pages/EtatsExecution.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Rapports détaillés sur l'exécution budgétaire avec multiples axes d'analyse.
- **Fonctionnalités :**
  - **6 onglets d'analyse :**
    - Suivi budgétaire global
    - Par Direction
    - Par OS (Objectif Stratégique)
    - Par Mission
    - Par NBE (Nomenclature Budgétaire)
    - Par SYSCO (Plan Comptable)
  - Filtres avancés (période, direction, OS, mission)
  - Tableaux détaillés avec totaux
- **Données :** Hook `useEtatsExecution` qui agrège depuis `budget_lines`, `engagements`, `liquidations`, etc.

### 3.4 Alertes Budgétaires

- **Route :** `/alertes-budgetaires`
- **Fichier :** `src/pages/AlertesBudgetaires.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Système d'alertes automatiques sur les dépassements et consommations anormales.
- **Fonctionnalités :**
  - Alertes de dépassement de crédits
  - Alertes de taux d'exécution anormal
  - Règles d'alerte configurables (`budg_alert_rules`)
  - Niveaux de sévérité (info, warning, critical)

### 3.5 Scanning Engagement

- **Route :** `/execution/scanning-engagement`
- **Fichier :** `src/pages/ScanningEngagement.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Vérification rapide d'un engagement par scan de code-barres ou saisie de référence.
- **Fonctionnalités :**
  - Saisie ou scan de la référence engagement
  - Affichage rapide du détail et du statut
  - Vérification de l'authenticité

### 3.6 Scanning Liquidation

- **Route :** `/execution/scanning-liquidation`
- **Fichier :** `src/pages/ScanningLiquidation.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Même principe que le scanning engagement mais pour les liquidations.

---

## 4. GESTION

### 4.1 Prestataires (Fournisseurs)

- **Route :** `/contractualisation/prestataires`
- **Fichier :** `src/pages/contractualisation/Prestataires.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Registre de tous les prestataires/fournisseurs référencés par l'ARTI.
- **Fonctionnalités :**
  - Liste avec recherche et filtres (statut, type, secteur)
  - Fiche détaillée de chaque prestataire
  - Création / modification de prestataire
  - Validation/activation par un administrateur
  - Onglets : Informations, Coordonnées, Documents, Historique
  - Demandes de création par les agents (`DemandePrestataire.tsx`)
  - Validation des demandes (`ValidationPrestataires.tsx`)
- **Données :** Table `fournisseurs` (~431 enregistrements)

### 4.2 Contrats

- **Route :** `/contractualisation/contrats`
- **Fichier :** `src/pages/contractualisation/Contrats.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Gestion des contrats signés avec les prestataires.
- **Fonctionnalités :**
  - Liste des contrats avec KPIs (actifs, en négociation, signés ce mois, expirant bientôt)
  - Création de contrat lié à un prestataire
  - Suivi des dates (signature, début, fin)
  - Statuts : brouillon, en_negociation, signe, en_cours, termine, resilie
- **Données :** Table `contrats`

### 4.3 Approvisionnement

- **Route :** `/approvisionnement`
- **Fichier :** `src/pages/approvisionnement/Approvisionnement.tsx`
- **Statut :** ⚠️ Partiel
- **Description :** Gestion des stocks, demandes d'achat et réceptions de matériel.
- **Fonctionnalités :**
  - **6 KPIs :** Articles, Stock total, Demandes d'achat, Réceptions, Mouvements, Alertes
  - **5 onglets :** Articles, Mouvements, Demandes d'achat, Réceptions, Inventaire
  - Composants : `ArticleList`, `MouvementList`, `DemandeAchatList`, `ReceptionList`, `InventaireList`
- **Données :** Tables `articles`, `mouvements_stock`, `demandes_achat`, etc.

### 4.4 Trésorerie

- **Route :** `/tresorerie`
- **Fichier :** `src/pages/tresorerie/GestionTresorerie.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Tableau de bord de la trésorerie avec gestion des comptes et opérations.
- **Fonctionnalités :**
  - KPIs : Position trésorerie, Entrées, Sorties, Paiements en attente, Délai moyen, Tendance
  - Onglets : Comptes bancaires, Opérations, Plan de trésorerie, Paiements à venir
  - Composants : `CompteBancaireList`, `OperationTresorerieList`, `PlanTresorerie`, `PaiementsAVenir`
- **Sous-pages :**
  - `/tresorerie/approvisionnements/banque` → Approvisionnements bancaires
  - `/tresorerie/approvisionnements/caisse` → Approvisionnements caisse
  - `/tresorerie/mouvements/banque` → Mouvements bancaires
  - `/tresorerie/mouvements/caisse` → Mouvements caisse
- **Données :** Tables `comptes_bancaires`, `operations_tresorerie`, `plan_tresorerie`

### 4.5 Recettes

- **Route :** `/recettes`
- **Fichier :** `src/pages/recettes/DeclarationRecette.tsx`
- **Statut :** ⚠️ Partiel
- **Description :** Déclaration et suivi des recettes budgétaires de l'ARTI.
- **Fonctionnalités :**
  - KPIs : Recettes déclarées, Validées, En attente, Taux de recouvrement
  - Onglets : Liste des recettes, État des recettes
  - Composants : `RecetteList`, `EtatRecettes`
- **Données :** Table `recettes`

### 4.6 Comptabilité Matière

- **Route :** `/contractualisation/comptabilite-matiere`
- **Fichier :** `src/pages/contractualisation/ComptabiliteMatiere.tsx`
- **Statut :** 📋 Placeholder
- **Description :** Gestion des immobilisations et suivi du patrimoine matériel.
- **Fonctionnalités (prévues) :**
  - Immobilisations enregistrées
  - Stocks valorisés
  - Mouvements de matières
  - Inventaires
- **Note :** Interface créée avec des compteurs à zéro. Module à développer.

### 4.7 Espace Direction

- **Route :** `/espace-direction`
- **Fichier :** `src/pages/EspaceDirection.tsx`
- **Statut :** ⚠️ Partiel
- **Description :** Espace dédié à chaque direction pour voir ses propres données (budget, dossiers, activités).
- **Fonctionnalités :**
  - Vue filtée par la direction de l'utilisateur connecté
  - Budget de la direction
  - Dossiers en cours

---

## 5. ADMINISTRATION (Admin uniquement)

### 5.1 Référentiels

#### 5.1.1 Exercices

- **Route :** `/admin/exercices`
- **Fichier :** `src/pages/admin/GestionExercices.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Gestion des exercices budgétaires (années fiscales).
- **Fonctionnalités :** Créer, ouvrir, clôturer un exercice. Un seul exercice peut être "ouvert" à la fois.

#### 5.1.2 Paramètres Programmatiques

- **Route :** `/admin/parametres-programmatiques`
- **Fichier :** `src/pages/admin/ParametresProgrammatiques.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Gestion des référentiels programmatiques (OS, Missions, Actions, Activités, Sous-Activités).
- **Fonctionnalités :** CRUD sur chaque niveau de la hiérarchie programmatique.

#### 5.1.3 Architecture SYGFP

- **Route :** `/admin/architecture`
- **Fichier :** `src/pages/admin/ArchitectureSYGFP.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Visualisation de l'architecture du système (diagrammes, flux).

#### 5.1.4 Codification

- **Route :** `/admin/codification`
- **Fichier :** `src/pages/admin/ReferentielCodification.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Gestion du référentiel de codification (codes d'imputation, nomenclatures).

#### 5.1.5 Secteurs d'Activité

- **Route :** `/admin/secteurs-activite`
- **Fichier :** `src/pages/admin/SecteursActivite.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Gestion des secteurs d'activité des fournisseurs/prestataires.

#### 5.1.6 Dictionnaire Variables

- **Route :** `/admin/dictionnaire`
- **Fichier :** `src/pages/admin/DictionnaireVariables.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Dictionnaire de toutes les variables et champs du système avec leurs descriptions.

### 5.2 Utilisateurs

#### 5.2.1 Gestion Utilisateurs

- **Route :** `/admin/utilisateurs`
- **Fichier :** `src/pages/admin/GestionUtilisateurs.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** CRUD des comptes utilisateurs avec affectation de rôle et direction.
- **Fonctionnalités :** Créer, modifier, désactiver un utilisateur. Affecter rôle + direction + niveau hiérarchique.

#### 5.2.2 Profils & Rôles

- **Route :** `/admin/roles`
- **Fichier :** `src/pages/admin/GestionRoles.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Gestion des 5 profils fonctionnels (Admin, Validateur, Opérationnel, Contrôleur, Auditeur).

#### 5.2.3 Autorisations

- **Route :** `/admin/autorisations`
- **Fichier :** `src/pages/admin/GestionAutorisations.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Matrice de permissions détaillée (qui peut faire quoi sur quel module).

#### 5.2.4 Délégations

- **Route :** `/admin/delegations`
- **Fichier :** `src/pages/admin/GestionDelegations.tsx`
- **Statut :** ⚠️ Partiel
- **Description :** Gestion des délégations de pouvoir (quand un responsable est absent).

### 5.3 Système

#### 5.3.1 Paramètres Système

- **Route :** `/admin/parametres`
- **Fichier :** `src/pages/admin/ParametresSysteme.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Configuration globale du système (devises, formats, seuils).

#### 5.3.2 Journal d'Audit

- **Route :** `/admin/journal-audit`
- **Fichier :** `src/pages/admin/JournalAudit.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Historique de toutes les actions effectuées par les utilisateurs (audit trail).
- **Fonctionnalités :** Filtres par utilisateur, type d'action, période. Traçabilité complète.
- **Données :** Table `audit_logs`

#### 5.3.3 Gestion Doublons

- **Route :** `/admin/doublons`
- **Fichier :** `src/pages/admin/GestionDoublons.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Détection et fusion des enregistrements en doublon (fournisseurs, etc.).

#### 5.3.4 Compteurs Références

- **Route :** `/admin/compteurs-references`
- **Fichier :** `src/pages/admin/CompteursReferences.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Gestion des compteurs de numérotation automatique (SEF-2026-001, ENG-2026-001, etc.).

---

## 6. PAGES ADDITIONNELLES (hors sidebar)

### 6.1 Suivi Dossiers

- **Route :** `/suivi-dossiers`
- **Fichier :** `src/pages/SuiviDossiers.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Vue transversale de tous les dossiers de dépense avec leur avancement dans la chaîne.
- **Détail :** `/suivi-dossiers/:id` → `DossierDetails.tsx`

### 6.2 Tâches Workflow

- **Route :** `/taches`
- **Fichier :** `src/pages/WorkflowTasks.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Liste des tâches en attente pour l'utilisateur connecté (documents à valider, actions à effectuer).

### 6.3 Notes DG (Direction Générale)

- **Route :** `/notes-dg`
- **Statut :** ✅ Fonctionnel
- **Description :** Notes soumises à la validation du Directeur Général.
- **Pages liées :**
  - `/notes-dg/validation` → Validation par le DG
  - `/dg/notes-a-valider` → Liste des notes à valider
  - `/dg/valider/:token` → Validation par lien email
  - `/verification/note-dg/:token` → Vérification de la note

### 6.4 Notifications

- **Route :** `/notifications`
- **Fichier :** `src/pages/Notifications.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Centre de notifications de l'utilisateur (validations, alertes, rappels).

### 6.5 Alertes

- **Route :** `/alertes`
- **Fichier :** `src/pages/Alertes.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Système d'alertes générales du système.

### 6.6 Mon Profil

- **Route :** `/mon-profil`
- **Fichier :** `src/pages/MonProfil.tsx`
- **Statut :** ✅ Fonctionnel
- **Description :** Page de profil de l'utilisateur connecté (nom, email, direction, rôle).

### 6.7 Vérification Document

- **Route :** `/verify/:hash`
- **Statut :** ✅ Fonctionnel
- **Description :** Page publique pour vérifier l'authenticité d'un document via QR code.

### 6.8 Dashboards Spécialisés

| Route                            | Description                    | Statut |
| -------------------------------- | ------------------------------ | ------ |
| `/execution/dashboard`           | Dashboard exécution budgétaire | ✅     |
| `/execution/dashboard-dg`        | Dashboard DG dédié             | ✅     |
| `/execution/dashboard-direction` | Dashboard par direction        | ✅     |
| `/dashboard-dmg`                 | Dashboard Moyens Généraux      | ✅     |
| `/dashboard-financier`           | Tableau financier consolidé    | ✅     |

### 6.9 Planification Avancée

| Route                                       | Description                   | Statut |
| ------------------------------------------- | ----------------------------- | ------ |
| `/planification/budget`                     | Planification budgétaire      | ✅     |
| `/planification/physique`                   | Planification physique        | ⚠️     |
| `/planification/projets`                    | Liste des projets             | ⚠️     |
| `/planification/projets/:id`                | Détail d'un projet            | ⚠️     |
| `/planification/roadmap-dashboard`          | Dashboard feuilles de route   | ⚠️     |
| `/planification/feuilles-route`             | Import feuilles de route      | ⚠️     |
| `/planification/soumissions-feuilles-route` | Soumissions feuilles de route | ⚠️     |
| `/planification/execution-physique`         | Exécution physique des tâches | ⚠️     |
| `/planification/maj-feuilles-route`         | MAJ feuilles de route         | ⚠️     |

### 6.10 Gestion Tâches

| Route                              | Description                 | Statut |
| ---------------------------------- | --------------------------- | ------ |
| `/gestion-taches/etat-execution`   | État d'exécution des tâches | ⚠️     |
| `/gestion-taches/taches-realisees` | Tâches réalisées            | ⚠️     |
| `/gestion-taches/taches-differees` | Tâches différées            | ⚠️     |

### 6.11 Programmatique

| Route                            | Description              | Statut |
| -------------------------------- | ------------------------ | ------ |
| `/programmatique/charger-budget` | Charger un budget        | ⚠️     |
| `/programmatique/mise-a-jour`    | Mise à jour budgétaire   | ⚠️     |
| `/programmatique/liste-budget`   | Liste des budgets        | ⚠️     |
| `/programmatique/reamenagement`  | Réaménagement budgétaire | ⚠️     |

### 6.12 Administration Avancée

| Route                         | Description                  | Statut |
| ----------------------------- | ---------------------------- | ------ |
| `/admin/import-budget`        | Import budget (admin)        | ✅     |
| `/admin/comptes-bancaires`    | Gestion comptes bancaires    | ✅     |
| `/admin/origines-fonds`       | Origines des fonds           | ✅     |
| `/admin/anomalies`            | Gestion des anomalies        | ✅     |
| `/admin/workflows`            | Configuration workflows      | ⚠️     |
| `/admin/notifications`        | Paramètres notifications     | ⚠️     |
| `/admin/interims`             | Gestion des intérims         | ⚠️     |
| `/admin/libelles-budget`      | Gestion libellés budget      | ✅     |
| `/admin/historique-libelles`  | Historique des libellés      | ✅     |
| `/admin/raci`                 | Matrice RACI                 | ✅     |
| `/admin/checklist-production` | Checklist mise en production | ✅     |
| `/admin/liens-lambda`         | Liens Edge Functions         | ✅     |
| `/admin/parametres-exercice`  | Paramètres d'exercice        | ✅     |
| `/admin/test-non-regression`  | Tests non-régression         | ✅     |
| `/admin/documentation`        | Documentation modules        | ✅     |

---

## 7. RÉSUMÉ PAR STATUT

### ✅ Modules 100% Fonctionnels (~35)

- Dashboard (aiguilleur intelligent)
- Chaîne de dépense complète (9 étapes)
- Structure Budgétaire (avec exports CSV/Excel/PDF)
- Plan de Travail (avec exports CSV/Excel/PDF, 6 KPIs, totaux)
- Import/Export Budget
- Tableau Financier
- États d'Exécution
- Alertes Budgétaires
- Scanning Engagement & Liquidation
- Prestataires & Contrats
- Trésorerie (dashboard + 4 sous-pages)
- Administration (utilisateurs, rôles, autorisations, audit, paramètres)
- Suivi Dossiers, Notifications, Profil

### ⚠️ Modules Partiels (~12)

- Virements budgétaires
- Réaménagements
- Passation de marché
- Recettes
- Approvisionnement
- Espace Direction
- Planification avancée (projets, feuilles de route)
- Gestion tâches

### 📋 Placeholder (~3)

- Comptabilité Matière
- Délégations (interface basique)

---

## 8. PROCHAINES PRIORITÉS SUGGÉRÉES

1. ~~**Améliorer Plan de Travail**~~ : ✅ TERMINÉ (exports CSV/Excel/PDF, 6 KPIs, ordonnancé, totaux, filtres globaux)
2. **Compléter Passation de Marché** : Workflow complet de mise en concurrence
3. **Développer Comptabilité Matière** : Gestion des immobilisations
4. **Enrichir Recettes** : Circuit complet de déclaration et recouvrement
5. **Planification physique** : Suivi des feuilles de route et tâches par direction
6. **Tests E2E** : Playwright sur chaque module critique

---

_Document généré le 9 février 2026 - SYGFP v2.0_
