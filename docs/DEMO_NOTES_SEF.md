# Démonstration Notes SEF - SYGFP ARTI

## Présentation à M. Mbaye (3 minutes)

---

## 🎯 Objectif

Démontrer le workflow complet des Notes Sans Effet Financier (SEF) : création, validation et traçabilité.

---

## 📋 Scénario de Démo (3 min)

### Étape 1 : Agent crée une Note SEF (1 min)

1. **Connectez-vous** en tant qu'Agent
2. **Naviguez** vers Notes SEF (menu latéral)
3. **Cliquez** "Nouvelle note SEF"
4. **Remplissez** :
   - Objet : "Acquisition de fournitures de bureau"
   - Direction : DG
   - Demandeur : [utilisateur connecté]
   - Urgence : Normale
   - Justification : "Besoin urgent pour les services"
   - Date souhaitée : [date dans 15 jours]
5. **Ajoutez** une pièce jointe (TDR ou demande)
6. **Créez** la note → Affiche toast "Note ARTI/2026/DG/XXXX créée"
7. **Ouvrez** la note et cliquez "Soumettre pour validation"

### Étape 2 : DG valide la note (1 min)

1. **Changez** de session ou de rôle (DG)
2. **Observez** :
   - 🔔 Notification "Note SEF à valider"
   - KPI "À valider" = 1
3. **Cliquez** sur l'onglet "À valider"
4. **Ouvrez** la note soumise
5. **Vérifiez** les informations, pièces jointes
6. **Cliquez** "Valider"
7. **Observez** le message :
   - "Note validée ✓ - Dossier ARTI/2026/DG/XXXX créé automatiquement"

### Étape 3 : Vérification (1 min)

1. **Observez** les changements :
   - Note passe en onglet "Validées"
   - KPI "Validées" incrémenté
   - Badge 📁 indiquant le dossier créé
2. **Ouvrez** la note validée :
   - Voir le lien vers le dossier
   - Voir l'historique (timeline)
3. **Testez** la recherche :
   - Tapez "ARTI/2026" → Note trouvée
   - Tapez l'objet → Note trouvée
4. **Montrez** le dashboard "Activités récentes"

---

## ✅ Points clés à démontrer

| Fonctionnalité            | Démonstration                                        |
| ------------------------- | ---------------------------------------------------- |
| **Référence unique**      | Code pivot ARTI/ANNÉE/DIR/SEQ généré automatiquement |
| **Workflow clair**        | Soumis → Validé                                      |
| **Création dossier auto** | Dossier créé à la validation                         |
| **Notifications**         | Validateurs alertés à la soumission                  |
| **Traçabilité**           | Historique complet dans la fiche                     |
| **Recherche**             | Par référence, objet, direction                      |
| **Droits**                | Agent crée, DG valide                                |

---

## 🛡️ Sécurité démontrée

- ✅ Seul le créateur peut modifier une note soumise
- ✅ Seuls DG/DAAF/ADMIN peuvent valider
- ✅ Motif obligatoire pour rejet/différé
- ✅ Historique horodaté et non modifiable
- ✅ Notifications ciblées

---

## 📊 Données de test recommandées

Avant la démo, créer 5 notes avec différents statuts :

```
1. ARTI/2026/DG/0001 - Soumis
2. ARTI/2026/DG/0002 - Soumis (à valider)
3. ARTI/2026/DG/0003 - Validé + Dossier
4. ARTI/2026/DG/0004 - Rejeté (avec motif)
5. ARTI/2026/DG/0005 - Différé (avec date reprise)
```

---

## ❓ Questions/Réponses anticipées

**Q: Pourquoi SEF avant AEF ?**

> R: Le SEF capture le besoin métier. L'AEF ajoute l'estimation financière ensuite.

**Q: Et si la note est rejetée ?**

> R: L'agent reçoit une notification avec le motif. Il peut créer une nouvelle note corrigée.

**Q: Comment tracer qui a fait quoi ?**

> R: Chaque action est loguée avec l'utilisateur, la date et les détails dans l'historique.

---

## 🚀 Prochaines étapes (après validation M. Mbaye)

1. **Notes AEF** : Avec estimation financière et imputation
2. **Marchés** : Gestion des procédures d'achat
3. **Engagements** : Réservation budgétaire
4. **Liquidations → Ordonnancements → Règlements**

---

_Document préparé pour la présentation du module Notes SEF - SYGFP ARTI_
