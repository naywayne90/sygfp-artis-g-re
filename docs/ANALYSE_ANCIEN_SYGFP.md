# Analyse Complète de l'Ancien SYGFP (https://arti-ci.com:8001/)

**Date d'analyse**: 04/02/2026
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
Les compteurs entre parenthèses indiquent le nombre de dossiers en attente.

---

## 2. Modules Découverts

### 2.1 Scanning (Numérisation) - 31 dossiers
Gestion de la numérisation des documents physiques:
- **Engagement**: 6 documents à scanner
- **Liquidation**: 25 documents à scanner

**Logique**: Les dossiers physiques doivent être numérisés avant traitement.

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

**Liquidation (125)**:
| État | Compteur | Description |
|------|----------|-------------|
| Liste à valider | 3 | En attente de validation |
| Contrôle SDCT | 1 | Contrôle par Sous-Direction |
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

#### Autres fonctionnalités:
- Recherche Dossier (recherche globale)
- État d'exécution (NBE)
- État d'exécution (Imputation)
- Gestion de doublons

### 2.4 Comptabilité Matière
- **Introduction au Patrimoine**: Gestion des immobilisations et amortissements
- **Affectation**: Affectation des biens aux services/personnes

### 2.5 Mission (Déplacements)
Colonnes: Type Mission, Libellé, Description, Début, Fin

### 2.6 Contratualisation (Marchés Publics)
- **Marchés**: Libellé, Référence, Nombre Lots, Montant, DAO
- **Lots**: Subdivision des marchés
- **Soumissions**: Offres des prestataires
- **Contrats**: Contrats signés

### 2.7 Note DG
Colonnes: N°, Objet, Référence, Exposé, Avis, Recommandation

### 2.8 Prestataires (422 fournisseurs)
| Champ | Description |
|-------|-------------|
| Raison Sociale | Nom complet |
| Code | Code interne |
| Sigle | Abréviation |
| CC | Compte Contribuable |
| RCCM | Registre Commerce |
| Régime Imposition | TEE, etc. |

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
| Nature Économique | 671700: Intérêts et frais financiers |
| **Budget Actuel** | Montant alloué |

#### Autres paramétrages:
- Comptes bancaires
- Origine des Fonds
- Notification Budgetaire
- Approvisionnement
- Mouvements
- **Réaménagement budgétaire**: Transfert entre imputations

---

## 3. Structure des Données Détaillées

### 3.1 Engagement/Liquidation (Expandable Row)
```
Montant Marché         : 225,400 FCFA
Dotation budgétaire    : 13,289,175 FCFA
Cumul                  : 225,400 FCFA
Disponible             : 13,063,775 FCFA

Code Activité          : 402 - Renforcement du sentiment d'appartenance
Nature NBE             : 612900 - Autres locations
Nature SYSCO           : 622800 - LOCATIONS ET CHARGES LOCATIVES DIVERSES
Num OS                 : OS1 - Construire la structure fonctionnelle
Action                 : Disposer d'outils fiables de collectes
Direction              : Direction des Affaires Administratives et financières
Activité               : Disposer d'outils fiables de collectes
Sous-Activité          : 002 - Application des principes de bonne gouvernance
Imputation             : 110240202052612900 (18 chiffres)

--- Prestataire ---
Raison Sociale         : CLASS C PLUS
Sigle                  : CLASS C PLUS
CC                     : 1803713T
RCCM                   : CI-ABJ-2017-A-29125
Adresse                : RIVIERA 2

--- Note ---
Référence Note DG      : 085-01-2026/ARTI/DG/CP/SDMG/GD
Exposé                 : [Texte détaillé de la demande]
Avis                   : [Avis technique]
Recommandations        : [Recommandations au DG]

--- Documents ---
Devis/Proforma         : PDF
Bon Commande           : PDF
Fiche Contrat          : PDF
Facture Normalisée     : PDF (Liquidation)
Fiche Réalité          : PDF (Liquidation)
Rapport d'Étude        : PDF (Liquidation)

--- Workflow ---
Action                 : CB → SDMG → DAAF → DG
```

### 3.2 Règlement avec Paiement Partiel
```
Montant Marché         : 10,473,950 FCFA
Reste                  : 5,000,000 FCFA (montant restant)
Dotation budgétaire    : 30,000,000 FCFA
Engagements Antérieur  : 10,473,950 FCFA
Engagements Actuel     : 10,473,950 FCFA

--- Mouvements Bancaires ---
| Compte         | Montant   | Référence | Pièce justificative |
|----------------|-----------|-----------|---------------------|
| SUBVENTION-BDT | 5,473,950 | 8998851   | PDF                 |
```

---

## 4. Fonctionnalités UI Identifiées

### 4.1 DataTables
- Tri par colonnes
- Recherche globale
- Pagination (10/25/50/100)
- Export: Copy, CSV, Excel, PDF, Print
- Lignes expandables (+/-) pour détails

### 4.2 Workflows de Validation
- Multi-étapes (CB → SDMG → DAAF → DG)
- États multiples (à valider, validé, différé, satisfait, rejeté)
- Contrôle SDCT pour certaines étapes

### 4.3 Gestion Documentaire
- Upload de pièces jointes par type
- Nomenclature: `ARTI[TYPE][ANNEE][NUMERO].pdf`
- Types: Devis, Bon Commande, Fiche Contrat, Facture, etc.

---

## 5. Logiques Métier Clés à Implémenter

### 5.1 Système de Paiement Partiel
```typescript
interface Reglement {
  montantTotal: number;
  montantRegle: number;
  resteAPayer: number;
  statut: 'non_effectue' | 'partiel' | 'total';
  mouvements: MouvementBancaire[];
}

interface MouvementBancaire {
  compte: string;
  montant: number;
  reference: string;
  pieceJustificative: string;
  dateReglement: Date;
}
```

### 5.2 Workflow de Validation Multi-Niveaux
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
```

### 5.3 Code d'Imputation (18 chiffres)
Structure: `[OS][Action][Activite][SousActivite][NatureDepense][NatureEconomique]`
Exemple: `110240202052612900`

### 5.4 Nomenclature des Références
- Note DG: `XXX-MM-YYYY/ARTI/DG/CP/SDMG/XX`
- Dépense: `ARTI[TYPE][MM][ANNEE][NUMERO]`
  - Type 1 = Engagement
  - Type 2 = Liquidation
  - Type 3 = Règlement

---

## 6. Recommandations pour la Nouvelle Version

### 6.1 Fonctionnalités à Conserver
1. Compteurs dynamiques dans le menu
2. DataTables avec export multi-format
3. Lignes expandables pour les détails
4. Workflow de validation multi-étapes
5. Système d'états (à valider, différé, rejeté)
6. Historique des mouvements par prestataire

### 6.2 Améliorations à Apporter
1. **Paiements partiels**: Implémenter dans la nouvelle version
2. **Réaménagement budgétaire**: Interface de transfert entre imputations
3. **Scanning**: Module de numérisation avec OCR
4. **Alertes temps réel**: Dossiers urgents, délais dépassés
5. **Dashboard amélioré**: Plus de KPIs et graphiques interactifs
6. **Notifications**: Alertes email/push pour les validations
7. **Mobile responsive**: L'ancien n'est pas adapté mobile

### 6.3 Nouveaux Modules à Ajouter
1. **Audit Trail avancé**: Historique complet des modifications
2. **Gestion documentaire**: Versioning des pièces jointes
3. **Rapports dynamiques**: Générateur de rapports personnalisés
4. **API REST**: Pour intégrations externes
5. **Tableau de bord par rôle**: Vue personnalisée par fonction

---

## 7. Mapping avec la Nouvelle Structure

| Ancien Module | Nouveau Module | Statut |
|---------------|----------------|--------|
| Note DG | notes_sef | ✅ Implémenté |
| Expression Besoin | expressions_besoin | ✅ Implémenté |
| Engagement | engagements | ✅ Implémenté |
| Liquidation | liquidations | ✅ Implémenté |
| Ordonnancement | ordonnancements | ✅ Implémenté |
| Règlement | reglements | ✅ Partiellement |
| Prestataires | fournisseurs | ✅ Implémenté |
| Paramétrage Budget | objectifs_strategiques, missions, actions, activites | ✅ Implémenté |
| Utilisateurs | profiles + auth.users | ✅ Implémenté |
| Paiement Partiel | mouvements_bancaires | ⚠️ À implémenter |
| Réaménagement | reamenagements_budgetaires | ⚠️ À implémenter |
| Scanning | pieces_jointes + workflow | ⚠️ À améliorer |
| Comptabilité Matière | immobilisations, amortissements | ❌ À créer |
| Missions | missions_deplacement | ❌ À créer |
| Contratualisation | marches, lots, soumissions, contrats | ❌ À créer |

---

## 8. Conclusion

L'ancienne application SYGFP est fonctionnelle mais présente des limitations:
- Interface datée (Bootstrap 3)
- Pas de responsive mobile
- Manque de notifications temps réel
- Audit trail basique

La nouvelle version doit:
1. Conserver toute la logique métier existante
2. Moderniser l'interface (React + Tailwind)
3. Ajouter les fonctionnalités manquantes (paiements partiels, alertes)
4. Améliorer l'expérience utilisateur
5. Renforcer la sécurité (RLS, audit trail complet)

**Prochaines étapes prioritaires**:
1. Implémenter le système de paiements partiels
2. Ajouter le module de réaménagement budgétaire
3. Créer le module Comptabilité Matière
4. Améliorer le système de scanning/pièces jointes
5. Ajouter les alertes et notifications temps réel
