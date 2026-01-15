# Guide de Test Notes SEF - 10 minutes

## Prérequis

- [ ] Exercice 2026 ouvert et sélectionné
- [ ] Au moins 2 utilisateurs de test :
  - **Agent** : rôle standard (pas DG/ADMIN)
  - **DG** : rôle DG ou ADMIN

---

## Scénario 1 : Création brouillon + PJ (2 min)

### En tant qu'Agent

1. **Naviguer** vers `/notes-sef`
2. **Cliquer** "Nouvelle note SEF"
3. **Remplir** :
   - Objet : "Test acquisition fournitures"
   - Direction : [votre direction]
   - Demandeur : [utilisateur connecté]
   - Urgence : Normale
   - Justification : "Test manuel module SEF"
   - Date souhaitée : [date +15 jours]
4. **Créer** la note

✅ **Vérifications** :
- [ ] Toast "Note créée avec succès"
- [ ] Référence pivot générée (format `ARTI/2026/XXX/0001`)
- [ ] Note visible dans onglet "Toutes"
- [ ] Statut = "Brouillon"
- [ ] Compteur "Total" incrémenté

5. **Ouvrir** la note créée
6. **Ajouter** une pièce jointe (PDF ou image)

✅ **Vérifications** :
- [ ] Upload réussi
- [ ] PJ visible dans la liste
- [ ] Téléchargement fonctionne (signed URL)

---

## Scénario 2 : Modification brouillon (1 min)

### En tant qu'Agent (créateur)

1. **Ouvrir** le brouillon créé
2. **Cliquer** "Modifier"
3. **Changer** l'urgence en "Urgent"
4. **Sauvegarder**

✅ **Vérifications** :
- [ ] Toast "Note mise à jour"
- [ ] Urgence = "Urgent" visible
- [ ] Timeline montre "Modifié"

---

## Scénario 3 : Soumission (1 min)

### En tant qu'Agent (créateur)

1. **Ouvrir** le brouillon
2. **Cliquer** "Soumettre pour validation"

✅ **Vérifications** :
- [ ] Toast "Note soumise pour validation"
- [ ] Statut = "Soumis"
- [ ] Note visible dans onglet "À valider"
- [ ] Compteur "À valider" incrémenté
- [ ] Timeline montre "Soumis pour validation"
- [ ] Bouton "Soumettre" disparu

---

## Scénario 4 : Non-DG ne peut pas valider (1 min)

### En tant qu'Agent (non-DG)

1. **Naviguer** vers `/notes-sef`
2. **Aller** dans onglet "À valider"
3. **Ouvrir** la note soumise

✅ **Vérifications** :
- [ ] Pas de boutons "Valider", "Rejeter", "Différer"
- [ ] Lecture seule uniquement

---

## Scénario 5 : Validation DG (1 min)

### En tant que DG/ADMIN

1. **Naviguer** vers `/notes-sef`
2. **Vérifier** le compteur "À valider" > 0
3. **Aller** dans onglet "À valider"
4. **Ouvrir** la note soumise
5. **Cliquer** "Valider"
6. **Confirmer** la validation

✅ **Vérifications** :
- [ ] Toast "Note validée"
- [ ] Statut = "Validé"
- [ ] Note disparaît de "À valider"
- [ ] Note apparaît dans "Validées"
- [ ] Compteur "Validées" incrémenté
- [ ] Timeline montre "Validé"
- [ ] Dossier créé automatiquement (badge visible)
- [ ] Bouton "Créer Note AEF" visible

---

## Scénario 6 : Rejet avec motif (1 min)

### Prérequis : Créer et soumettre une nouvelle note

### En tant que DG/ADMIN

1. **Ouvrir** la note soumise
2. **Cliquer** "Rejeter"
3. **Saisir** motif : "Justification insuffisante"
4. **Confirmer**

✅ **Vérifications** :
- [ ] Toast "Note rejetée"
- [ ] Statut = "Rejeté"
- [ ] Note dans onglet "Rejetées"
- [ ] Motif visible dans la fiche
- [ ] Timeline montre "Rejeté" avec motif

---

## Scénario 7 : Différé avec motif + date reprise (1 min)

### Prérequis : Créer et soumettre une nouvelle note

### En tant que DG/ADMIN

1. **Ouvrir** la note soumise
2. **Cliquer** "Différer"
3. **Remplir** :
   - Motif : "En attente du budget"
   - Condition : "Vote du budget 2026"
   - Date reprise : [date +30 jours]
4. **Confirmer**

✅ **Vérifications** :
- [ ] Toast "Note différée"
- [ ] Statut = "Différé"
- [ ] Note dans onglet "Différées"
- [ ] Motif, condition et date visibles
- [ ] Bouton "Valider" disponible pour reprise

---

## Scénario 8 : Recherche (0.5 min)

1. **Taper** dans la barre de recherche : "ARTI/2026"
2. **Vérifier** que les notes avec cette référence apparaissent
3. **Effacer** et taper l'objet partiel : "fournitures"
4. **Vérifier** que les notes correspondantes apparaissent

✅ **Vérifications** :
- [ ] Recherche par référence fonctionne
- [ ] Recherche par objet fonctionne
- [ ] Résultats filtrés en temps réel

---

## Scénario 9 : Export Excel (0.5 min)

1. **Sélectionner** l'onglet "Validées"
2. **Cliquer** "Exporter Excel"
3. **Ouvrir** le fichier téléchargé

✅ **Vérifications** :
- [ ] Fichier Excel généré
- [ ] Nom contient "validees"
- [ ] Colonnes présentes : Référence, Statut, Objet, Direction, etc.
- [ ] Seules les notes validées exportées

---

## Scénario 10 : Isolation direction (1 min)

### Prérequis : 2 utilisateurs de directions différentes

### En tant qu'Agent Direction A

1. **Créer** et **valider** (via DG) une note

### En tant qu'Agent Direction B

1. **Naviguer** vers `/notes-sef`
2. **Chercher** la note de Direction A

✅ **Vérifications** :
- [ ] Notes brouillon de Direction A non visibles
- [ ] Notes validées de Direction A visibles (si même exercice)
- [ ] Impossible de modifier notes d'autres directions

---

## Résumé des vérifications

| Test | Statut |
|------|--------|
| Création brouillon | ⬜ |
| Ajout PJ | ⬜ |
| Modification brouillon | ⬜ |
| Soumission | ⬜ |
| Restriction non-DG | ⬜ |
| Validation DG | ⬜ |
| Création dossier auto | ⬜ |
| Rejet avec motif | ⬜ |
| Différé avec motif | ⬜ |
| Recherche référence | ⬜ |
| Recherche objet | ⬜ |
| Export Excel | ⬜ |
| Isolation direction | ⬜ |

---

## Problèmes courants

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| "Note non trouvée" | Exercice différent | Vérifier exercice sélectionné |
| Boutons validation absents | Rôle incorrect | Vérifier rôle DG/ADMIN |
| Export vide | Pas de données | Créer des notes dans l'onglet sélectionné |
| PJ refusée | Taille > 5MB | Réduire taille fichier |
| Erreur RLS | Permissions | Vérifier direction + rôle utilisateur |

---

*Guide créé le 2026-01-15*
