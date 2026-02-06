# Guide Rapide : Statuts Prestataires SYGFP

## 🎯 Règle essentielle

> **Seuls les prestataires ACTIFS peuvent être utilisés dans la chaîne de dépense**

---

## 📊 Les 5 statuts

| Statut | Badge | Utilisable ? | Description |
|--------|-------|--------------|-------------|
| 🆕 **NOUVEAU** | Gris | ❌ NON | Vient d'être créé, documents non vérifiés |
| 🔵 **EN_QUALIFICATION** | Bleu | ❌ NON | Documents en cours de validation |
| ✅ **ACTIF** | Vert | ✅ **OUI** | Qualifié, documents OK, opérationnel |
| ⚠️ **SUSPENDU** | Rouge | ❌ NON | Bloqué (litige ou document expiré) |
| ⚫ **INACTIF** | Gris | ❌ NON | Désactivé définitivement |

---

## 🔄 Workflow simplifié

```
NOUVEAU → EN_QUALIFICATION → ACTIF → SUSPENDU → ACTIF
                              ↓
                           INACTIF
```

---

## 📋 Conditions pour être ACTIF

- ✅ Tous les documents obligatoires uploadés
- ✅ Aucun document expiré
- ✅ Coordonnées bancaires complètes
- ✅ Validation par un agent habilité

### Documents obligatoires

1. RCCM (expire)
2. NINEA (expire)
3. NIF
4. Patente (expire)
5. CNI Dirigeant (expire)
6. RIB
7. Quitus fiscal (expire)

---

## ⚡ Actions rapides

### Créer un nouveau prestataire
**Navigation :** Contractualisation > Prestataires > + Nouveau prestataire
**Résultat :** Statut = NOUVEAU

### Qualifier un prestataire
1. Ouvrir la fiche prestataire (👁️)
2. Onglet "Documents"
3. Uploader tous les documents obligatoires
4. Onglet "Banque" → renseigner RIB
5. Clic "Qualifier"
6. Validation → statut passe à ACTIF ✅

### Suspendre un prestataire
1. Ouvrir la fiche prestataire
2. Bouton "Suspendre"
3. Saisir le motif (obligatoire)
4. Confirmer → statut passe à SUSPENDU

### Réactiver un prestataire
1. Ouvrir la fiche prestataire suspendu
2. Vérifier que documents sont OK
3. Bouton "Réactiver"
4. Confirmer → statut repasse à ACTIF

---

## 🔍 Où trouver les prestataires ?

**Onglets de la page Prestataires :**

- **Actifs (X)** → Prestataires utilisables
- **Suspendus (X)** → Prestataires bloqués
- **Autres (X)** → NOUVEAU + EN_QUALIFICATION + INACTIF
- **Tous (X)** → Tous statuts confondus

---

## ⚠️ Suspension automatique

**Déclencheur :** Un document obligatoire expire

**Process :**
1. Email d'alerte 15-30j avant expiration
2. À J+0 (minuit) → suspension automatique
3. Statut passe à SUSPENDU
4. Motif : "Document expiré : [nom document]"
5. Prestataire disparaît des sélecteurs

**Résolution :**
1. Renouveler le document
2. Réactiver le prestataire

---

## 🚫 Différence SUSPENDU vs INACTIF

| | SUSPENDU | INACTIF |
|---|----------|---------|
| **Durée** | Temporaire | Définitif |
| **Motif requis** | Oui | Non |
| **Réactivation** | Fréquente | Rare |
| **Cause** | Litige, doc expiré | Fin relation, faillite |

---

## 🎯 Impact sur la chaîne de dépense

**Modules qui utilisent les prestataires ACTIFS :**

- 🏭 Passation de marché (attribution)
- 📝 Engagement (fournisseur)
- 💰 Liquidation (bénéficiaire)
- 📋 Ordonnancement (bénéficiaire)
- 💳 Règlement (bénéficiaire)

**Si prestataire suspendu :**
- ✅ Opérations existantes → restent valides
- ❌ Nouvelles opérations → impossibles

---

## 📈 Stats en un coup d'œil

**Header de la page Prestataires :**

- **Total** : Tous statuts
- **Actifs** : Utilisables (badge vert)
- **Docs expirés** : À renouveler (badge rouge)
- **Nouveaux (30j)** : Créés récemment
- **Suspendus** : Bloqués (badge orange)

---

## ❓ FAQ Express

**Q : Pourquoi mon prestataire n'apparaît pas dans le sélecteur ?**
**R :** Son statut n'est pas ACTIF. Vérifiez et qualifiez-le.

**Q : Si je suspends, les engagements existants sont annulés ?**
**R :** Non. Seules les nouvelles opérations sont bloquées.

**Q : Comment importer 100 prestataires ?**
**R :** Import Excel > remplir CSV > upload → statut NOUVEAU → qualifier en masse.

**Q : Un document expire dans 5 jours, que faire ?**
**R :** Renouveler immédiatement pour éviter la suspension automatique.

---

## 📞 Support

**Questions ?** → dsi@arti.ci
**Documentation complète :** `docs/ANALYSE_STATUTS_PRESTATAIRES.md`

---

**Version :** 1.0 | **Date :** 5 février 2026
