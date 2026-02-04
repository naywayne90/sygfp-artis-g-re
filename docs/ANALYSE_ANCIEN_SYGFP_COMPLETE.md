# Analyse Complète de l'Ancien SYGFP (https://arti-ci.com:8001/)

**Date d'analyse**: 04/02/2026
**Analysé par**: Claude Code avec Playwright MCP
**Objectif**: Comprendre la logique métier pour améliorer la nouvelle version

---

## 1. Architecture Générale

### 1.1 Dashboard Principal
- **4 KPIs principaux** avec montants et compteurs:
  - Engagement: 139 dossiers / 389M CFA
  - Liquidation: 125 dossiers / 383M CFA
  - Ordonnancement: 91 dossiers / 326M CFA
  - Règlement: 90 dossiers / 308M CFA
- Graphiques: Pie chart + Bar chart pour visualisation

### 1.2 Menu avec Compteurs Dynamiques
Les compteurs entre parenthèses indiquent le nombre de dossiers en attente par état.

### 1.3 Système Multi-Exercice
- URLs séparées par année:
  - 2024: arti-ci.com:8002
  - 2025: arti-ci.com:8003
  - 2026: arti-ci.com:8001

---

## 2. Modules Découverts

### 2.1 Scanning (Numérisation) - 31 dossiers
Gestion de la numérisation des documents physiques:
- **Engagement**: 6 documents à scanner
- **Liquidation**: 25 documents à scanner

**Logique**: Les dossiers physiques doivent être numérisés avant traitement digital.

### 2.2 Gestion des Tâches
- Planification des tâches
- Exécution des tâches
- État d'exécution (reporting)

### 2.3 Exécution Budgétaire (Chaîne de Dépense)

#### Workflow complet:
```
Note DG (145) → Expression Besoin (139) → Engagement (139) → Liquidation (125) → Ordonnancement (91) → Règlement (90)
```

#### États de validation par étape:

**Engagement (139)**:
| État | Compteur | Description |
|------|----------|-------------|
| Liste à valider | 2 | En attente de validation |
| Liste validée | 123 | Validées |
| Liste différée | 5 | Mises en attente |
| Liste diff. Satisfait | 1 | Différées puis traitées |
| Liste Eng. Rejeté | 2 | Rejetées |

**Liquidation (125)**:
| État | Compteur | Description |
|------|----------|-------------|
| Liste à valider | 3 | En attente de validation |
| **Contrôle SDCT** | 1 | **Contrôle par Sous-Direction** |
| Liste validée | 91 | Validées |
| Liste différée | 3 | Mises en attente |
| Liste satisfaite | 0 | Différées puis traitées |
| Liste rejetée | 1 | Rejetées |

**Ordonnancement (91)**:
- Liste à valider: 1
- Liste validée: 90
- Liste différée/satisfaite/rejetée: 0

**Règlement (90)** - SYSTÈME DE PAIEMENT PARTIEL:
| État | Compteur | Description |
|------|----------|-------------|
| Tous les règl. | 90 | Total |
| Règl. Tot. eff. | 78 | Paiement total effectué |
| **Règl. Part. eff.** | 4 | **Paiement partiel** |
| Règl. non eff. | 12 | Non encore payés |
| Règl. Différés | 0 | Différés |
| Règl. Diff. Satis. | 0 | Différés satisfaits |
| Règl. Rejetés | 0 | Rejetés |

### 2.4 Comptabilité Matière
- **Introduction au Patrimoine**: Gestion des immobilisations
  - Lié au règlement (Code Règlement dropdown)
  - Durée d'amortissement en années
  - Valeur Entrée (depuis règlement)
  - Valeur Vénale (marché)
  - Valeur NC (Nette Comptable)
  - Quantité et Prix Unitaire
- **Affectation**: Affectation des biens aux services/personnes

### 2.5 Mission (Déplacements)
Formulaire:
- Type Mission: Représentation / Formation
- Libellé, Description
- Date Début, Date Fin
- Ordre de Mission (upload PDF)

### 2.6 Contratualisation (Marchés Publics)
Structure hiérarchique:
- **Marchés**: Libellé, Référence, Nombre Lots, Montant, DAO
  - Lié à Action/Activité (structure programmatique)
  - Documents: DAO, TDR, Cahier des Charges
- **Lots**: Subdivision des marchés
- **Soumissions**: Offres des prestataires
- **Contrats**: Contrats signés

### 2.7 Note DG (145 dossiers)
Colonnes: N°, Objet, Référence, Exposé, Avis, Recommandation

### 2.8 Prestataires (422 fournisseurs)
| Champ | Description |
|-------|-------------|
| Raison Sociale | Nom complet |
| Code | Code interne (ex: 401xxx, 481xxx) |
| Sigle | Abréviation |
| CC | Compte Contribuable |
| RCCM | Registre Commerce |
| Régime Imposition | TEE, etc. |
| Banque | Nom de la banque |
| Compte | Numéro de compte |
| Adresse | Adresse postale |

**Fonctionnalité**: Historique des mouvements par prestataire

### 2.9 Utilisateurs (73 actifs)
| Champ | Options |
|-------|---------|
| Matricule | Identifiant unique |
| Nom, Prénom, Email | Infos personnelles |
| Direction | 16 directions (DG, DAAF, DSI, DMGP, etc.) |
| Fonction | 31 fonctions (DG, DAAF, SDMG, AGENT, etc.) |
| EstResponsable | Oui/Non |

### 2.10 Paramétrage

#### Structure programmatique (204 imputations):
| Niveau | Exemple |
|--------|---------|
| OS (Objectif Stratégique) | OS1: Construire la structure fonctionnelle |
| Action | Améliorer les performances opérationnelles |
| Activité | 101: Remboursement du prêt BHCI |
| Sous-Activité | 002, 013, etc. |
| Direction | Direction des Affaires Administratives |
| Nature Dépense | 2 Biens et services |
| Nature Économique (NBE) | 671700: Intérêts et frais financiers |
| **Budget Actuel** | Montant alloué |

#### Comptes Bancaires:
- FISCALITE-CST-BDT
- SUBVENTION-BDT
- BANQUE DE L'HABITAT DE COTE D'IVOIRE (BHCI)

#### Autres paramétrages:
- Origine des Fonds
- Notification Budgétaire
- Approvisionnement
- Mouvements
- **Réaménagement budgétaire**: Transfert entre imputations

---

## 3. Structure des Données Détaillées

### 3.1 Formulaire d'Imputation Budgétaire (Expression de Besoin)
```
=== Note du DG ===
Objet              : [Texte]
Référence Note DG  : XXX-MM-YYYY/ARTI/DG/CP/SDMG/XX
Document Annexé    : [Nombre]
Nombre de page     : [Nombre]
Exposé             : [Texte détaillé]
Avis               : [Avis technique]
Recommandations    : [Recommandations au DG]

=== Info. Programmatique ===
Imputation         : [Dropdown avec 204 options]
Numéro Dépense     : ARTI[Type]0[2][2026][Numero]
N°OS               : [Auto-rempli depuis imputation]
Action             : [Auto-rempli depuis imputation]
Activité           : [Auto-rempli depuis imputation]
Direction          : [Auto-rempli depuis imputation]
Direction (Imput.) : [Auto-rempli depuis imputation]
Sous-Activité      : [Auto-rempli depuis imputation]
Nature économique  : [Auto-rempli - NBE 6 chiffres]
Nature SYSCO       : [Dropdown 200+ options SYSCOHADA]
Type de Charge     : [Dropdown: Exploitation/Variables/Projets/Passifs]

=== Imputation Budgetaire (Calcul en temps réel) ===
Numero Marché      : [Saisie optionnelle]
Montant            : [Saisie]
(A) Dotation       : [Auto-calculé depuis imputation]
(B) Eng. antérieurs: [Auto-calculé]
(C) Eng. actuel    : [= Montant saisi]
(D) Cumul (B+C)    : [Auto-calculé]
(E) Disponible (A-D): [Auto-calculé - CONTROLE BUDGET]

=== Références du Bénéficiaire ===
Code Fournisseur   : [Dropdown 400+ prestataires]
Raison Sociale     : [Auto-rempli]
Sigle, CC, RCCM    : [Auto-remplis]
Banque, Compte     : [Auto-remplis]
Adresse            : [Auto-rempli]

=== Pièces Justificatives ===
Piece 1, 2, 3      : [Upload PDF]
```

### 3.2 Engagement/Liquidation (Expandable Row)
```
=== Informations Budgétaires ===
Montant Marché         : 225,400 FCFA
Dotation budgétaire    : 13,289,175 FCFA
Cumul                  : 225,400 FCFA
Disponible             : 13,063,775 FCFA

=== Structure Programmatique ===
Code Activité          : 402 - Renforcement du sentiment d'appartenance
Nature NBE             : 612900 - Autres locations
Nature SYSCO           : 622800 - LOCATIONS ET CHARGES LOCATIVES DIVERSES
Num OS                 : OS1 - Construire la structure fonctionnelle
Action                 : Disposer d'outils fiables de collectes
Direction              : Direction des Affaires Administratives et financières
Activité               : Disposer d'outils fiables de collectes
Sous-Activité          : 002 - Application des principes de bonne gouvernance
Imputation             : 110240202052612900 (18 chiffres)

=== Prestataire ===
Raison Sociale         : CLASS C PLUS
Sigle                  : CLASS C PLUS
CC                     : 1803713T
RCCM                   : CI-ABJ-2017-A-29125
Adresse                : RIVIERA 2

=== Note DG ===
Référence Note DG      : 085-01-2026/ARTI/DG/CP/SDMG/GD
Exposé                 : [Texte détaillé de la demande]
Avis                   : [Avis technique]
Recommandations        : [Recommandations au DG]

=== Documents Engagement ===
Devis/Proforma         : PDF
Bon Commande           : PDF
Fiche Contrat          : PDF

=== Documents Liquidation (additionnels) ===
Facture Normalisée     : PDF
Fiche Réalité          : PDF
Rapport d'Étude        : PDF

=== Workflow ===
Action                 : CB → SDMG → DAAF → DG
```

### 3.3 Paiement Partiel avec Mouvements Bancaires
```
=== Dossier Règlement ===
Fournisseur            : ASSURE PLUS
Montant Marché         : 10,473,950 FCFA
Reste à payer          : 5,000,000 FCFA
Dotation budgétaire    : 30,000,000 FCFA
Engagements Antérieur  : 10,473,950 FCFA
Engagements Actuel     : 10,473,950 FCFA

=== Mouvements Bancaires ===
| Compte         | Montant   | Référence | Pièce justificative |
|----------------|-----------|-----------|---------------------|
| SUBVENTION-BDT | 5,473,950 | 8998851   | PDF                 |

=== Formulaire Ajout Mouvement ===
Compte Bancaire        : [Dropdown: FISCALITE-CST-BDT, SUBVENTION-BDT, BHCI]
Solde                  : [Affiché automatiquement]
Montant                : [Saisie]
Référence              : [Numéro de référence]
Objet                  : [Description]
Date                   : [Date du paiement]
```

### 3.4 État d'Exécution Budgétaire (Rapport NBE)
```
=== Par Nature Économique ===
Nature économique      : 601200 - Achats de carburants et lubrifiants
Budget initial (A)     : 123,410,720 FCFA
Budget reporté (B)     : 0 FCFA
Total réaménagement (C): 4,371,750 FCFA
Budget actuel (D=A+B+C): 127,782,470 FCFA
Cumul Engagement (E)   : 21,535,240 FCFA
Disponible (F=D-E)     : 106,247,230 FCFA
Taux d'exécution (G=E/D): 16,85%
```

### 3.5 Réaménagement Budgétaire
```
=== Source ===
Imputation             : 110110102022671700
NBE                    : 671700 - Intérêts et frais financiers
Budget Actuel          : 640,000,000 FCFA
Cumul                  : 0 FCFA

=== Transfert ===
Montant à réaménager   : [Saisie]
Budget réaménagé       : [Budget Source - Montant]

=== Destination ===
Imputation             : [Dropdown 204 imputations]
Budget destination     : [Affiché]
Budget après réaménagement: [Budget Dest + Montant]
```

---

## 4. Fonctionnalités UI Identifiées

### 4.1 DataTables
- Tri par colonnes (ascending/descending)
- Recherche globale (Search)
- Pagination (10/25/50/100)
- Export: Copy, CSV, Excel, PDF, Print
- Lignes expandables (+/-) pour détails
- Compteur d'entrées (Showing X to Y of Z entries)

### 4.2 Workflows de Validation
- Multi-étapes (CB → SDMG → DAAF → DG)
- États multiples (à valider, validé, différé, satisfait, rejeté)
- Contrôle SDCT pour Liquidation uniquement
- Boutons d'action contextuels

### 4.3 Gestion Documentaire
- Upload de pièces jointes par type
- Nomenclature: `ARTI[TYPE][ANNEE][NUMERO].pdf`
  - Engagement: Devis, Bon Commande, Fiche Contrat
  - Liquidation: Facture Normalisée, Fiche Réalité, Rapport d'Étude
  - Règlement: Bon de caisse/Chèque
- Prévisualisation via icône download

### 4.4 Formulaires Dynamiques
- Auto-remplissage depuis sélections (Imputation → OS/Action/Activité)
- Calculs en temps réel (Budget disponible)
- Dropdowns avec recherche (Imputation avec filtre)
- Validation côté client

---

## 5. Logiques Métier Clés à Implémenter

### 5.1 Nomenclature des Références
```typescript
// Format Numéro de Dépense
type TypeDossier = 0 | 1 | 2 | 3; // 0=Expression, 1=Engagement, 2=Liquidation, 3=Règlement
// ARTI[Type]0[Mois][Année][Numero]
// Exemple: ARTI102260019 = Engagement, Février 2026, N°19

// Format Note DG
// XXX-MM-YYYY/ARTI/DG/CP/SDMG/XX
// Exemple: 085-01-2026/ARTI/DG/CP/SDMG/GD
```

### 5.2 Code d'Imputation (18 chiffres)
```typescript
interface CodeImputation {
  os: string;           // 2 chiffres - Objectif Stratégique
  action: string;       // 2 chiffres
  activite: string;     // 3 chiffres
  sousActivite: string; // 3 chiffres
  direction: string;    // 2 chiffres
  natureNBE: string;    // 6 chiffres - Nature Économique
}
// Exemple: 110240202052612900
// 11-02-402-020-52-612900
```

### 5.3 Système de Paiement Partiel
```typescript
interface Reglement {
  id: string;
  numeroDepense: string;  // ARTI3xxxxx
  montantTotal: number;
  montantRegle: number;
  resteAPayer: number;    // Calculé: montantTotal - sum(mouvements)
  statut: 'non_effectue' | 'partiel' | 'total';
  mouvements: MouvementBancaire[];
}

interface MouvementBancaire {
  id: string;
  reglementId: string;
  compteBancaire: 'FISCALITE-CST-BDT' | 'SUBVENTION-BDT' | 'BHCI';
  montant: number;
  reference: string;      // Numéro de référence bancaire
  objet: string;
  pieceJustificative: string; // URL du PDF
  dateReglement: Date;
}
```

### 5.4 Workflow de Validation Multi-Niveaux
```typescript
type ValidationStep = 'CB' | 'SDMG' | 'DAAF' | 'DG' | 'SDCT';
type ValidationStatus = 'en_attente' | 'valide' | 'differe' | 'satisfait' | 'rejete';

interface WorkflowValidation {
  etapeActuelle: ValidationStep;
  historiqueValidations: {
    etape: ValidationStep;
    validePar: string;
    dateValidation: Date;
    statut: ValidationStatus;
    motif?: string;
  }[];
}

// Workflow standard: CB → SDMG → DAAF → DG
// Workflow Liquidation: CB → SDMG → SDCT → DAAF → DG (contrôle SDCT ajouté)
```

### 5.5 Contrôle Budgétaire
```typescript
interface ControleBudgetaire {
  imputation: string;
  dotationBudgetaire: number;        // (A)
  engagementsAnterieurs: number;     // (B)
  engagementActuel: number;          // (C) - Montant saisi
  cumulEngagements: number;          // (D) = B + C
  disponibleBudgetaire: number;      // (E) = A - D

  // Validation: Montant saisi <= Disponible
  estValide: boolean;
}
```

### 5.6 Réaménagement Budgétaire
```typescript
interface ReamenagementBudgetaire {
  id: string;
  dateReamenagement: Date;

  // Source
  imputationSource: string;
  budgetSourceAvant: number;
  montantTransfere: number;
  budgetSourceApres: number;  // = budgetSourceAvant - montantTransfere

  // Destination
  imputationDestination: string;
  budgetDestAvant: number;
  budgetDestApres: number;    // = budgetDestAvant + montantTransfere

  motif: string;
  validePar: string;
}
```

### 5.7 Nature SYSCO (200+ codes SYSCOHADA)
```typescript
// Exemples de codes SYSCOHADA
const NATURE_SYSCO = {
  '212000': 'BREVETS, LICENCES, CONCESSIONS ET DROITS SIMILAIRES',
  '213100': 'LOGICIELS',
  '244200': 'MATERIEL INFORMATIQUE',
  '244400': 'MOBILIER DE BUREAU',
  '245100': 'MATERIEL AUTOMOBILE',
  '605100': 'FOURNITURES NON STOCKABLES - EAU',
  '605200': 'FOURNITURES NON STOCKABLES - ELECTRICITE',
  '605300': 'FOURNITURES NON STOCKABLES - AUTRES ENERGIES-CARBURANT',
  '622200': 'LOCATIONS DE BATIMENTS',
  '622800': 'LOCATIONS ET CHARGES LOCATIVES DIVERSES',
  '625200': 'ASSURANCES AUTOMOBILES',
  '638400': 'FRAIS DE MISSIONS',
  '661100': 'APPOINTEMENTS SALAIRES ET COMMISIONS',
  '671700': 'INTERETS ET FRAIS FINANCIERS - DETTE INTERIEURE',
  // ... 200+ autres codes
};
```

---

## 6. État d'Exécution (Rapports)

### 6.1 Rapport par NBE (Nature Économique)
| Indicateur | Formule | Description |
|------------|---------|-------------|
| Budget initial (A) | - | Allocation initiale |
| Budget reporté (B) | - | Report exercice précédent |
| Total réaménagement (C) | - | Transferts (+/-) |
| Budget actuel (D) | A + B + C | Budget disponible total |
| Cumul Engagement (E) | Sum(engagements) | Total engagé |
| Disponible (F) | D - E | Reste à engager |
| Taux d'exécution (G) | E / D * 100 | Pourcentage consommé |

### 6.2 Rapports disponibles
- État d'exécution (NBE) - Expression de besoin
- État d'exécution (NBE) - Engagement
- État d'exécution (NBE) - Liquidation
- État d'exécution (NBE) - Ordonnancement
- État d'exécution (Imputation) - Vue par ligne budgétaire

---

## 7. Mapping avec la Nouvelle Structure

| Ancien Module | Nouveau Module | Statut |
|---------------|----------------|--------|
| Note DG | notes_sef | Implémenté |
| Expression Besoin | expressions_besoin | Implémenté |
| Engagement | engagements | Implémenté |
| Liquidation | liquidations | Implémenté |
| Ordonnancement | ordonnancements | Implémenté |
| Règlement | reglements | Partiellement |
| Prestataires | fournisseurs | Implémenté |
| Paramétrage Budget | objectifs_strategiques, missions, actions, activites | Implémenté |
| Utilisateurs | profiles + auth.users | Implémenté |
| **Paiement Partiel** | mouvements_bancaires | **À implémenter** |
| **Réaménagement** | reamenagements_budgetaires | **À implémenter** |
| **Scanning** | pieces_jointes + workflow | **À améliorer** |
| **Comptabilité Matière** | immobilisations, amortissements | **À créer** |
| **Missions** | missions_deplacement | **À créer** |
| **Contratualisation** | marches, lots, soumissions, contrats | **À créer** |
| **Contrôle SDCT** | workflow_liquidation | **À implémenter** |
| **États d'exécution** | rapports_execution | **À créer** |

---

## 8. Recommandations pour la Nouvelle Version

### 8.1 Fonctionnalités Prioritaires (P1)
1. **Paiements partiels**: Table mouvements_bancaires + UI
2. **Réaménagement budgétaire**: Interface de transfert entre imputations
3. **Contrôle SDCT**: Étape validation supplémentaire pour Liquidation
4. **États d'exécution**: Rapports par NBE et par Imputation
5. **Compteurs dynamiques**: Dans le menu latéral

### 8.2 Fonctionnalités Importantes (P2)
1. **Comptabilité Matière**: Immobilisations et amortissements
2. **Module Mission**: Gestion des déplacements
3. **Contratualisation**: Marchés publics complets
4. **Scanning workflow**: Gestion numérisation
5. **Export multi-format**: Copy, CSV, Excel, PDF, Print

### 8.3 Améliorations UX (P3)
1. **DataTables avancées**: Tri, recherche, pagination, export
2. **Lignes expandables**: Détails sans navigation
3. **Auto-calcul budget**: Disponible en temps réel
4. **Notifications temps réel**: Alertes dossiers urgents
5. **Mobile responsive**: L'ancien n'est pas adapté mobile

### 8.4 Sécurité et Audit
1. **Audit trail complet**: Historique des modifications
2. **RLS renforcé**: Par direction/fonction
3. **Validation workflow**: Traçabilité des approbations
4. **Versioning documents**: Historique pièces jointes

---

## 9. Prochaines Étapes Prioritaires

### Phase 1 - Paiements Partiels
```sql
-- Table mouvements_bancaires
CREATE TABLE mouvements_bancaires (
  id UUID PRIMARY KEY,
  reglement_id UUID REFERENCES reglements(id),
  compte_bancaire TEXT NOT NULL, -- FISCALITE-CST-BDT, SUBVENTION-BDT, BHCI
  montant NUMERIC(15,2) NOT NULL,
  reference TEXT NOT NULL,
  objet TEXT,
  piece_justificative TEXT,
  date_reglement DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Vue règlements avec calcul reste à payer
CREATE VIEW v_reglements_avec_reste AS
SELECT
  r.*,
  r.montant_ttc - COALESCE(SUM(m.montant), 0) as reste_a_payer,
  CASE
    WHEN COALESCE(SUM(m.montant), 0) = 0 THEN 'non_effectue'
    WHEN COALESCE(SUM(m.montant), 0) < r.montant_ttc THEN 'partiel'
    ELSE 'total'
  END as statut_paiement
FROM reglements r
LEFT JOIN mouvements_bancaires m ON r.id = m.reglement_id
GROUP BY r.id;
```

### Phase 2 - Réaménagement Budgétaire
```sql
CREATE TABLE reamenagements_budgetaires (
  id UUID PRIMARY KEY,
  date_reamenagement TIMESTAMP DEFAULT NOW(),
  imputation_source TEXT NOT NULL,
  imputation_destination TEXT NOT NULL,
  montant NUMERIC(15,2) NOT NULL,
  budget_source_avant NUMERIC(15,2),
  budget_source_apres NUMERIC(15,2),
  budget_dest_avant NUMERIC(15,2),
  budget_dest_apres NUMERIC(15,2),
  motif TEXT NOT NULL,
  valide_par UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 3 - Comptabilité Matière
```sql
CREATE TABLE immobilisations (
  id UUID PRIMARY KEY,
  reglement_id UUID REFERENCES reglements(id),
  code_imputation TEXT NOT NULL,
  nature_nbe TEXT NOT NULL,
  nature_sysco TEXT NOT NULL,
  duree_amortissement INTEGER NOT NULL, -- en années
  valeur_entree NUMERIC(15,2) NOT NULL,
  valeur_venale NUMERIC(15,2),
  valeur_nette_comptable NUMERIC(15,2),
  libelle TEXT NOT NULL,
  quantite INTEGER DEFAULT 1,
  prix_unitaire NUMERIC(15,2),
  date_acquisition DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE amortissements (
  id UUID PRIMARY KEY,
  immobilisation_id UUID REFERENCES immobilisations(id),
  annee INTEGER NOT NULL,
  montant_amortissement NUMERIC(15,2) NOT NULL,
  valeur_residuelle NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 10. Conclusion

L'ancienne application SYGFP est fonctionnelle mais présente des limitations:
- Interface datée (Bootstrap 3)
- Pas de responsive mobile
- Manque de notifications temps réel
- Audit trail basique

La nouvelle version doit:
1. **Conserver** toute la logique métier existante (workflow, calculs, nomenclatures)
2. **Moderniser** l'interface (React + Tailwind + shadcn/ui)
3. **Ajouter** les fonctionnalités manquantes (paiements partiels, réaménagement)
4. **Améliorer** l'expérience utilisateur (temps réel, mobile, exports)
5. **Renforcer** la sécurité (RLS, audit trail complet)

**Estimation**:
- P1 (Paiements + Réaménagement): À implémenter en priorité
- P2 (Comptabilité Matière + Missions + Marchés): Phase suivante
- P3 (UX + Rapports avancés): Améliorations continues
