# Guide de Test Notes AEF - Checklist Complète

## Prérequis
- Exercice actif sélectionné
- Utilisateur connecté avec rôle approprié
- Au moins une Direction dans le référentiel
- Au moins un utilisateur demandeur

---

## Scénario 1 : Création AEF liée à SEF validée

**Rôle requis** : Agent, DAAF, ou DG

1. [ ] Créer une Note SEF et la faire valider par DG
2. [ ] Depuis la liste SEF, cliquer "Créer Note AEF" sur la SEF validée
3. [ ] Vérifier le pré-remplissage :
   - [ ] Objet = objet de la SEF
   - [ ] Direction = direction de la SEF
   - [ ] Lien SEF = référence vers la SEF
4. [ ] Compléter les champs obligatoires :
   - [ ] Montant estimé > 0
   - [ ] Description (min 10 caractères)
   - [ ] Type de dépense
   - [ ] Priorité
5. [ ] Cliquer "Créer la note"

**Résultat attendu** :
- ✅ Note AEF créée en statut "brouillon"
- ✅ Lien vers la SEF visible dans les détails
- ✅ Toast de confirmation affiché

---

## Scénario 2 : Création AEF directe (DG uniquement)

**Rôle requis** : DG ou ADMIN

1. [ ] Aller sur /notes-aef
2. [ ] Cliquer "Nouvelle Note AEF"
3. [ ] Cocher "AEF directe DG (sans Note SEF)"
4. [ ] Vérifier que le champ "Justification DG" apparaît
5. [ ] Remplir :
   - [ ] Objet
   - [ ] Direction
   - [ ] Montant estimé
   - [ ] Description
   - [ ] Justification DG (min 10 caractères)
6. [ ] Créer la note

**Résultat attendu** :
- ✅ Note AEF directe créée
- ✅ Champ `is_direct_aef = true` en base
- ✅ Justification visible dans les détails

---

## Scénario 3 : Tentative AEF directe par non-DG

**Rôle requis** : Agent ou DAAF (pas DG)

1. [ ] Aller sur /notes-aef
2. [ ] Cliquer "Nouvelle Note AEF"
3. [ ] Vérifier que la checkbox "AEF directe" est absente ou désactivée

**Résultat attendu** :
- ✅ Option AEF directe non accessible
- ✅ Champ "Note SEF" obligatoire

---

## Scénario 4 : Validation complète du workflow AEF

**Rôle requis** : Créateur + DG pour validation

1. [ ] Créer une Note AEF (brouillon)
2. [ ] Soumettre la note
   - [ ] Vérifier statut = "soumis"
3. [ ] En tant que DG, valider la note
   - [ ] Vérifier statut = "a_imputer"
4. [ ] Vérifier que la note apparaît dans l'onglet "À imputer"

**Résultat attendu** :
- ✅ Transition brouillon → soumis → a_imputer
- ✅ Note visible dans onglet "À imputer"

---

## Scénario 5 : Imputation depuis AEF

**Rôle requis** : DAAF ou CB

1. [ ] Aller dans l'onglet "À imputer"
2. [ ] Cliquer "Imputer" sur une AEF
3. [ ] Vérifier ouverture du formulaire imputation
4. [ ] Vérifier pré-remplissage :
   - [ ] Objet de l'AEF
   - [ ] Direction
   - [ ] Montant estimé
5. [ ] Sélectionner une ligne budgétaire
6. [ ] Valider l'imputation

**Résultat attendu** :
- ✅ Imputation créée en base
- ✅ Statut AEF = "impute"
- ✅ AEF disparaît de l'onglet "À imputer"

---

## Scénario 6 : Tentative double imputation

1. [ ] Tenter d'imputer une AEF déjà imputée
2. [ ] Vérifier le message d'erreur

**Résultat attendu** :
- ✅ Message "Cette note a déjà été imputée"
- ✅ Action bloquée

---

## Scénario 7 : Rejet d'une AEF

**Rôle requis** : DG

1. [ ] Soumettre une Note AEF
2. [ ] En tant que DG, cliquer "Rejeter"
3. [ ] Saisir un motif de rejet
4. [ ] Confirmer le rejet

**Résultat attendu** :
- ✅ Statut = "rejete"
- ✅ Motif visible dans l'historique
- ✅ Note visible dans onglet "Rejetées"

---

## Scénario 8 : Report (différé) d'une AEF

**Rôle requis** : DG

1. [ ] Soumettre une Note AEF
2. [ ] En tant que DG, cliquer "Différer"
3. [ ] Saisir un motif et une date de reprise
4. [ ] Confirmer

**Résultat attendu** :
- ✅ Statut = "differe"
- ✅ Date de reprise enregistrée
- ✅ Note visible dans onglet "Différées"

---

## Scénario 9 : Validation champs obligatoires (Zod)

1. [ ] Ouvrir le formulaire de création AEF
2. [ ] Tenter de soumettre sans remplir les champs
3. [ ] Vérifier les messages d'erreur :
   - [ ] "L'objet est obligatoire"
   - [ ] "La direction est obligatoire"
   - [ ] "Le montant estimé doit être supérieur à 0"
   - [ ] "La description doit contenir au moins 10 caractères"

**Résultat attendu** :
- ✅ Messages d'erreur FR sous chaque champ
- ✅ Formulaire non soumis

---

## Scénario 10 : Export Excel des Notes AEF

**Rôle requis** : DAAF ou CB

1. [ ] Aller sur la liste des Notes AEF
2. [ ] Cliquer sur "Exporter Excel"
3. [ ] Vérifier le téléchargement

**Résultat attendu** :
- ✅ Fichier .xlsx téléchargé
- ✅ Contenu correspond aux notes affichées
- ✅ Colonnes : Numéro, Objet, Direction, Montant, Statut, Date

---

## Vérifications techniques

### Console navigateur
- [ ] Aucune erreur (error)
- [ ] Aucun warning critique

### Réseau
- [ ] Pas de requêtes en erreur (4xx, 5xx)
- [ ] Temps de réponse < 2s

### Base de données
- [ ] Données cohérentes (FK valides)
- [ ] Historique d'audit enregistré

---

## Résumé des tests

| Scénario | Statut |
|----------|--------|
| 1. AEF liée à SEF | [ ] |
| 2. AEF directe DG | [ ] |
| 3. AEF directe non-DG | [ ] |
| 4. Workflow complet | [ ] |
| 5. Imputation | [ ] |
| 6. Double imputation | [ ] |
| 7. Rejet | [ ] |
| 8. Report | [ ] |
| 9. Validation Zod | [ ] |
| 10. Export Excel | [ ] |

**Date du test** : ____/____/______

**Testeur** : _________________________

**Version** : _________________________
