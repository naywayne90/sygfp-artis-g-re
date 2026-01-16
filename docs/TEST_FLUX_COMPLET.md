# Guide de Test - Flux Complet de la Chaîne de Dépense

Ce guide couvre le parcours complet d'une dépense :
**SEF → AEF → Imputation → Expression Besoin → Marché → Engagement → Liquidation → Ordonnancement → Règlement**

---

## Prérequis

- [ ] Exercice budgétaire actif
- [ ] Lignes budgétaires avec crédits disponibles
- [ ] Utilisateurs avec rôles : Agent, DAAF, CB, DG, ADMIN
- [ ] Au moins un prestataire qualifié
- [ ] Directions configurées

---

## Phase 1 : Initialisation (Note SEF)

### Test 1.1 : Création Note SEF

**Utilisateur** : Agent

1. [ ] Naviguer vers /notes-sef
2. [ ] Cliquer "Nouvelle Note SEF"
3. [ ] Remplir :
   - Objet : "Achat fournitures de bureau T1 2026"
   - Direction : [Sélectionner]
   - Demandeur : [Sélectionner]
   - Urgence : Normale
   - Justification : "Besoin trimestriel de fournitures..."
   - Date souhaitée : [+15 jours]
4. [ ] Enregistrer (brouillon)

**Vérification** :
- ✅ Note créée avec numéro SEF-XXXX-XXXX
- ✅ Statut = brouillon
- ✅ Visible dans liste personnelle

### Test 1.2 : Soumission Note SEF

1. [ ] Ouvrir la note créée
2. [ ] Cliquer "Soumettre"
3. [ ] Confirmer

**Vérification** :
- ✅ Statut = soumis
- ✅ Note visible pour DG

### Test 1.3 : Validation Note SEF

**Utilisateur** : DG

1. [ ] Naviguer vers /notes-sef, onglet "À valider"
2. [ ] Ouvrir la note soumise
3. [ ] Vérifier les informations
4. [ ] Cliquer "Valider"

**Vérification** :
- ✅ Statut = valide
- ✅ Bouton "Créer Note AEF" apparaît

---

## Phase 2 : Engagement Financier (Note AEF)

### Test 2.1 : Création Note AEF depuis SEF

1. [ ] Depuis la SEF validée, cliquer "Créer Note AEF"
2. [ ] Vérifier pré-remplissage (objet, direction)
3. [ ] Compléter :
   - Montant estimé : 2 500 000 FCFA
   - Description : "Détail des fournitures..."
   - Type dépense : Fonctionnement
   - Priorité : Normale
4. [ ] Créer la note

**Vérification** :
- ✅ Note AEF créée avec lien vers SEF
- ✅ Numéro AEF-XXXX-XXXX

### Test 2.2 : Validation Note AEF

**Utilisateur** : DG

1. [ ] Soumettre l'AEF (Agent)
2. [ ] Valider l'AEF (DG)

**Vérification** :
- ✅ Statut = a_imputer
- ✅ Visible dans onglet "À imputer"

---

## Phase 3 : Imputation Budgétaire

### Test 3.1 : Imputation depuis AEF

**Utilisateur** : DAAF ou CB

1. [ ] Aller dans /notes-aef, onglet "À imputer"
2. [ ] Cliquer "Imputer" sur l'AEF
3. [ ] Formulaire s'ouvre avec pré-remplissage
4. [ ] Sélectionner la ligne budgétaire appropriée
5. [ ] Vérifier le disponible
6. [ ] Valider l'imputation

**Vérification** :
- ✅ Imputation créée
- ✅ Statut AEF = impute
- ✅ Crédit réservé sur la ligne

---

## Phase 4 : Expression de Besoin

### Test 4.1 : Création Expression de Besoin

**Utilisateur** : Agent demandeur

1. [ ] Naviguer vers /execution/expression-besoin
2. [ ] Créer une expression liée à l'AEF imputée
3. [ ] Détailler les articles :
   - Ramettes A4 x 50
   - Stylos x 200
   - Classeurs x 100
4. [ ] Soumettre

**Vérification** :
- ✅ EB créée avec référence AEF
- ✅ Détail des quantités/prix

---

## Phase 5 : Passation de Marché (si montant > seuil)

### Test 5.1 : Création Marché

**Utilisateur** : SDPM

1. [ ] Naviguer vers /marches
2. [ ] Créer un marché lié à l'expression de besoin
3. [ ] Définir le type (PRMP, consultation, etc.)
4. [ ] Publier / Attribuer

**Vérification** :
- ✅ Marché créé avec numéro
- ✅ Prestataire attributaire sélectionné

---

## Phase 6 : Engagement

### Test 6.1 : Création Engagement

**Utilisateur** : DAAF

1. [ ] Naviguer vers /engagements
2. [ ] Créer un engagement :
   - Lié au marché (ou AEF directe si montant < seuil)
   - Ligne budgétaire pré-sélectionnée
   - Montant TTC
3. [ ] Soumettre

**Vérification** :
- ✅ Engagement créé avec numéro ENG-XXXX
- ✅ Crédit engagé sur la ligne

### Test 6.2 : Validation Engagement

**Utilisateur** : DG

1. [ ] Valider l'engagement

**Vérification** :
- ✅ Statut = valide
- ✅ Engagement prêt pour liquidation

---

## Phase 7 : Liquidation

### Test 7.1 : Création Liquidation

**Utilisateur** : DAAF

1. [ ] Naviguer vers /liquidations
2. [ ] Créer une liquidation sur l'engagement validé
3. [ ] Saisir :
   - Référence facture
   - Montant HT / TVA / TTC
   - Attestation service fait
4. [ ] Soumettre

**Vérification** :
- ✅ Liquidation créée avec numéro LIQ-XXXX
- ✅ Calcul fiscal correct (AIRSI, retenues)

### Test 7.2 : Validation Liquidation

**Utilisateur** : DAF ou DG

1. [ ] Certifier le service fait
2. [ ] Valider la liquidation

**Vérification** :
- ✅ Statut = valide
- ✅ Prêt pour ordonnancement

---

## Phase 8 : Ordonnancement

### Test 8.1 : Création Ordonnancement

**Utilisateur** : CB

1. [ ] Naviguer vers /ordonnancements
2. [ ] Créer un ordre de paiement sur la liquidation
3. [ ] Vérifier le montant net à payer
4. [ ] Générer le bon de paiement

**Vérification** :
- ✅ Ordonnancement créé avec numéro ORD-XXXX
- ✅ Document imprimable généré

### Test 8.2 : Signatures Ordonnancement

1. [ ] Signature CB
2. [ ] Signature DAF
3. [ ] Signature Ordonnateur (DG)

**Vérification** :
- ✅ 3 signatures collectées
- ✅ Statut = pret_paiement

---

## Phase 9 : Règlement

### Test 9.1 : Création Règlement

**Utilisateur** : Trésorerie

1. [ ] Naviguer vers /reglements
2. [ ] Créer le règlement sur l'ordonnancement
3. [ ] Saisir :
   - Mode de paiement (virement, chèque)
   - Compte bancaire source
   - Référence bancaire
4. [ ] Exécuter le paiement

**Vérification** :
- ✅ Règlement créé avec numéro REG-XXXX
- ✅ Statut = paye
- ✅ Solde compte mis à jour

---

## Vérifications Finales

### Cohérence de la chaîne

1. [ ] Vérifier dans /recherche avec le numéro SEF initial
2. [ ] Toute la chaîne est visible et liée

### Tableau de bord

1. [ ] Les KPIs reflètent la nouvelle dépense
2. [ ] Taux d'engagement et de paiement mis à jour

### Audit

1. [ ] Consulter le journal d'audit
2. [ ] Toutes les actions sont tracées

---

## Résumé

| Phase | Étape | Statut |
|-------|-------|--------|
| 1 | Note SEF - Création | [ ] |
| 1 | Note SEF - Soumission | [ ] |
| 1 | Note SEF - Validation | [ ] |
| 2 | Note AEF - Création | [ ] |
| 2 | Note AEF - Validation | [ ] |
| 3 | Imputation | [ ] |
| 4 | Expression Besoin | [ ] |
| 5 | Marché (si applicable) | [ ] |
| 6 | Engagement - Création | [ ] |
| 6 | Engagement - Validation | [ ] |
| 7 | Liquidation - Création | [ ] |
| 7 | Liquidation - Validation | [ ] |
| 8 | Ordonnancement | [ ] |
| 8 | Signatures | [ ] |
| 9 | Règlement | [ ] |

**Temps estimé** : 30-45 minutes

**Date du test** : ____/____/______

**Testeur** : _________________________
