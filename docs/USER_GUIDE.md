# Guide Utilisateur SYGFP

> **Manuel d'utilisation de l'application**  
> Version: 1.0 | Dernière mise à jour: 2026-01-15

---

## 1. Introduction

### 1.1 Qu'est-ce que SYGFP ?

SYGFP (Système de Gestion Financière Publique) est l'application de gestion budgétaire de l'ARTI. Elle permet de :

- Gérer le budget annuel
- Suivre la chaîne de dépense (de la demande au paiement)
- Contrôler les engagements et disponibilités
- Générer des rapports d'exécution

### 1.2 La Chaîne de la Dépense

Toute dépense suit un processus en **9 étapes** :

```
1. Note SEF → 2. Note AEF → 3. Imputation → 4. Expression Besoin
                                                    ↓
5. Marché (si nécessaire) → 6. Engagement → 7. Liquidation
                                                    ↓
                           8. Ordonnancement → 9. Règlement
```

---

## 2. Connexion

### 2.1 Première connexion

1. Ouvrez l'application dans votre navigateur
2. Saisissez votre **email** et **mot de passe**
3. Cliquez sur **Se connecter**

### 2.2 Sélection de l'exercice

Après connexion, sélectionnez l'exercice budgétaire sur lequel travailler (ex: 2026).

> **Note** : Toutes vos actions seront liées à cet exercice.

---

## 3. Navigation

### 3.1 Menu principal

| Section | Description |
|---------|-------------|
| **Tableau de bord** | Vue d'ensemble, indicateurs clés |
| **Chaîne de dépense** | Les 9 étapes du workflow |
| **Budget** | Structure budgétaire, virements |
| **Partenaires** | Prestataires, contrats |
| **Gestion** | Trésorerie, stocks, recettes |
| **Rapports** | États d'exécution, alertes |
| **Paramétrage** | Configuration (admin) |

### 3.2 Recherche

Utilisez la barre de recherche pour trouver rapidement un dossier par :
- Numéro de référence
- Objet
- Prestataire

---

## 4. Processus Complet : De la Note SEF au Règlement

### Étape 1 : Créer une Note SEF

**Qui** : Tout agent

1. Menu → **Chaîne de dépense** → **Notes SEF**
2. Cliquez sur **Nouvelle Note SEF**
3. Remplissez :
   - **Objet** : Description claire du besoin
   - **Direction** : Votre direction
   - **Demandeur** : Vous-même (ou autre)
   - **Justification** : Pourquoi ce besoin ?
   - **Urgence** : Normale / Urgent / Très urgent
   - **Date souhaitée** : Échéance souhaitée
4. Cliquez sur **Enregistrer** (brouillon) ou **Soumettre** (envoi au DG)

### Étape 2 : Validation par le DG

**Qui** : DG uniquement

Le DG examine la note et peut :
- **Valider** → Création automatique d'un dossier
- **Rejeter** → Avec motif obligatoire
- **Différer** → Reporter à plus tard

### Étape 3 : Création Note AEF

**Qui** : Agent/Gestionnaire

Après validation SEF, créer la Note AEF pour chiffrer le besoin :
1. Menu → **Notes AEF** → **Nouvelle**
2. Lier à la Note SEF validée
3. Indiquer le **montant estimé**
4. Soumettre au Directeur

### Étape 4 : Imputation Budgétaire

**Qui** : CB (Contrôleur Budgétaire)

Le CB affecte la dépense à une ligne budgétaire :
1. Menu → **Imputation**
2. Sélectionner la Note AEF
3. Choisir la **ligne budgétaire**
4. Vérifier la **disponibilité**
5. Valider l'imputation

### Étape 5 : Expression de Besoin

**Qui** : Agent

Détailler le besoin technique :
1. Menu → **Expression Besoin** → **Nouvelle**
2. Remplir les spécifications
3. Soumettre au Directeur

### Étape 6 : Passation de Marché (si applicable)

**Qui** : SDPM / Commission des Marchés

Si le montant dépasse le seuil (selon réglementation) :
1. Créer un marché
2. Publier l'appel d'offres
3. Réceptionner les offres
4. Évaluer et attribuer

### Étape 7 : Engagement

**Qui** : CB

Réserver les crédits budgétaires :
1. Menu → **Engagements** → **Nouveau**
2. Sélectionner la ligne budgétaire
3. Indiquer le **montant exact**
4. Lier au prestataire
5. Valider

> ⚠️ Le disponible est mis à jour automatiquement

### Étape 8 : Liquidation

**Qui** : Agent puis DAAF

Après réception du service/bien :
1. Menu → **Liquidations** → **Nouvelle**
2. Lier à l'engagement
3. Certifier le **service fait**
4. Joindre la facture
5. Calculer le **net à payer** (avec retenues)
6. Valider (DAAF)

### Étape 9 : Ordonnancement

**Qui** : DAAF puis DG

Créer l'ordre de paiement (mandat) :
1. Menu → **Ordonnancements** → **Nouveau**
2. Lier à la liquidation
3. Préparer le mandat
4. Soumettre au DG pour **signature**

### Étape 10 : Règlement

**Qui** : Trésorerie

Payer effectivement le prestataire :
1. Menu → **Règlements** → **Nouveau**
2. Lier à l'ordonnancement signé
3. Choisir le **mode de paiement** (virement, chèque)
4. Exécuter le paiement
5. Joindre le justificatif

---

## 5. Tableau de Bord

### 5.1 Indicateurs clés

- **Budget total** : Dotation de l'exercice
- **Engagé** : Montant réservé
- **Liquidé** : Montant validé à payer
- **Payé** : Montant effectivement décaissé
- **Disponible** : Reste à engager

### 5.2 Alertes

Le tableau de bord affiche les alertes :
- ⚠️ Lignes budgétaires à 80%+ consommation
- ⏰ Dossiers en attente depuis longtemps
- 📋 Tâches à effectuer

---

## 6. Gestion des Prestataires

### 6.1 Ajouter un prestataire

1. Menu → **Partenaires** → **Prestataires**
2. Cliquez sur **Nouveau prestataire**
3. Remplir les informations :
   - Raison sociale
   - NCC (numéro contribuable)
   - Coordonnées
   - Compte bancaire
4. Joindre les documents requis

### 6.2 Qualification

Un prestataire doit être **qualifié** avant de pouvoir recevoir des paiements :
- Documents à jour
- Validation par le service concerné

---

## 7. Virements de Crédits

### 7.1 Demander un virement

Si une ligne budgétaire est insuffisante :

1. Menu → **Budget** → **Virements**
2. Cliquez sur **Nouvelle demande**
3. Sélectionner :
   - Ligne **source** (d'où prendre)
   - Ligne **destination** (où mettre)
   - **Montant** à transférer
4. Justifier la demande
5. Soumettre au CB

### 7.2 Approbation

Le CB examine et peut approuver ou rejeter.

---

## 8. Rôles et Responsabilités

| Rôle | Principales responsabilités |
|------|----------------------------|
| **Agent** | Créer notes, expressions de besoin, saisies |
| **Directeur** | Valider notes AEF, expressions de sa direction |
| **CB** | Imputation, validation engagements, virements |
| **DAAF** | Valider liquidations, préparer ordonnancements |
| **DG** | Valider notes SEF, signer ordonnancements |
| **Trésorerie** | Exécuter les règlements |
| **Admin** | Configuration, utilisateurs, paramètres |

---

## 9. Questions Fréquentes

### Comment voir le disponible d'une ligne ?

Menu → **Budget** → **Structure Budgétaire**, puis cliquez sur une ligne pour voir le détail.

### Comment annuler un engagement ?

Seul un Admin peut annuler un engagement validé. Contactez votre administrateur.

### Comment changer d'exercice ?

Dans la barre de menu, cliquez sur l'année affichée et sélectionnez un autre exercice.

### Pourquoi je ne peux pas modifier un document ?

Si le document est **soumis** ou **validé**, il n'est plus modifiable. Vous pouvez demander un rejet pour le récupérer.

### Comment joindre une pièce ?

Dans le formulaire, utilisez le bouton **Ajouter pièce jointe** et sélectionnez votre fichier (PDF, Word, Excel, image).

---

## 10. Support

En cas de problème :
1. Vérifiez ce guide
2. Consultez votre administrateur local
3. Contactez le support technique

---

*Documentation utilisateur SYGFP - Version 1.0*
