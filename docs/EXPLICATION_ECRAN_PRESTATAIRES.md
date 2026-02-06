# Explication : Votre écran Prestataires

## 🖥️ Ce que vous voyez actuellement

### Header - Statistiques

```
┌─────────────────────────────────────────────────────────────────────┐
│  Total Prestataires    Actifs      Docs. Expirés   Nouveaux (30j)  │
│       431              0           0               426              │
│  Référentiel officiel  Qualifiés   À renouveler    Ajoutés récemment│
│                                                                      │
│                    Suspendus                                         │
│                       0                                              │
│                    Bloqués                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Tableau vide

```
┌─────────────────────────────────────────────────────────────────────┐
│  Actifs (0) │ Suspendus (0) │ Autres (0) │ Tous (431)               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                    🏢 Aucun prestataire                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🤔 Pourquoi "Aucun prestataire" alors que Total = 431 ?

### Explication

Vous êtes sur l'onglet **"Actifs (0)"** par défaut.

**Ce que cela signifie :**
- ✅ Vous avez bien **431 prestataires** dans la base de données
- ❌ Mais **AUCUN n'a le statut ACTIF**
- 📊 **426 ont le statut NOUVEAU** (créés récemment, non qualifiés)
- 📊 **5 autres** ont probablement le statut INACTIF ou EN_QUALIFICATION

### Pourquoi c'est un problème ?

> **Seuls les prestataires ACTIFS peuvent être utilisés dans les engagements, liquidations, ordonnancements.**

**Impact actuel :** Vous ne pouvez créer AUCUN engagement car il n'y a aucun fournisseur actif sélectionnable ! 🚫

---

## 🔍 Voir tous vos prestataires

### Solution rapide : Cliquer sur l'onglet "Tous (431)"

```
┌─────────────────────────────────────────────────────────────────────┐
│  Actifs (0) │ Suspendus (0) │ Autres (431) │ [ Tous (431) ] ← CLIC│
├─────────────────────────────────────────────────────────────────────┤
│ Code        Raison sociale         Contact      Secteur   Statut    │
├─────────────────────────────────────────────────────────────────────┤
│ PRES-0001   ABC COMPANY            abc@...      BTP       NOUVEAU   │
│ PRES-0002   TECH SOLUTIONS         tech@...     IT        NOUVEAU   │
│ PRES-0003   BUILD & CO             build@...    BTP       NOUVEAU   │
│ ...         ...                    ...          ...       ...       │
│ PRES-0431   LAST SUPPLIER          last@...     Services  NOUVEAU   │
└─────────────────────────────────────────────────────────────────────┘
```

**Vous verrez :**
- Tous les 431 prestataires
- Avec badge gris "Nouveau" pour la plupart
- Colonnes : Code, Raison sociale, Contact, Secteur, NINEA, Statut, Actions

---

## 🎯 Résoudre le problème : Qualifier les prestataires

### Étape 1 : Identifier les prestataires prioritaires

**Quels prestataires devez-vous qualifier en priorité ?**

➡️ **Les plus utilisés dans l'ancien système ARTI**

**Comment les identifier ?**
1. Consultez l'ancien système ARTI
2. Exportez la liste des fournisseurs actifs 2025/2026
3. Notez les 10-20 fournisseurs les plus fréquents

**OU**

Triez par "Nouveaux (30j)" = 426 → ce sont probablement les prestataires migrés depuis l'ancien système.

---

### Étape 2 : Qualifier UN prestataire (exemple)

#### 📝 Scénario : Qualifier "ABC COMPANY"

**2.1 Ouvrir la fiche**
1. Onglet "Tous (431)"
2. Rechercher "ABC COMPANY" dans la barre de recherche
3. Cliquer sur l'icône 👁️ (œil) dans la colonne "Actions"
4. Dialog s'ouvre avec 5 onglets :
   - Identité
   - Contacts
   - Banque
   - **Documents** ← Important !
   - Historique

**2.2 Onglet Documents**
```
┌─────────────────────────────────────────────────────────────────────┐
│  📄 Documents requis                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ❌ RCCM                     Obligatoire    [Upload Document]        │
│  ❌ NINEA                    Obligatoire    [Upload Document]        │
│  ❌ NIF                      Obligatoire    [Upload Document]        │
│  ❌ Patente                  Obligatoire    [Upload Document]        │
│  ❌ CNI Dirigeant            Obligatoire    [Upload Document]        │
│  ❌ RIB                      Obligatoire    [Upload Document]        │
│  ❌ Quitus fiscal            Obligatoire    [Upload Document]        │
└─────────────────────────────────────────────────────────────────────┘
```

**2.3 Uploader les documents**

Pour **chaque** document :
1. Clic sur "Upload Document"
2. Sélectionner le type (ex: RCCM)
3. Choisir le fichier PDF/JPG sur votre ordinateur
4. **Si le document expire** → Renseigner la date d'expiration
   - Ex: RCCM expire le 31/12/2026
5. Valider
6. Document apparaît avec ✅ (vert)

Répéter pour les 7 documents obligatoires.

**2.4 Renseigner les coordonnées bancaires**
1. Onglet "Banque"
2. Cliquer sur "Ajouter un compte"
3. Remplir :
   - Banque : BGFI Bank
   - N° compte : GA12345678901234567890
   - Titulaire : ABC COMPANY SARL
   - Cocher "Compte principal"
4. Enregistrer

**2.5 Qualifier**
1. Retour sur onglet "Documents"
2. Tous les documents sont ✅ (verts)
3. Bouton **"Qualifier"** devient actif (non grisé)
4. Clic sur "Qualifier"
5. Toast de succès : "Prestataire qualifié"
6. Statut passe à `EN_QUALIFICATION` → Badge bleu

**2.6 Valider (si vous avez les droits)**
1. Vérifier visuellement les documents uploadés
2. Bouton **"Valider"** apparaît
3. Clic sur "Valider"
4. Toast : "Prestataire activé et ajouté au référentiel"
5. **Statut passe à ACTIF** ✅ → Badge vert
6. ABC COMPANY apparaît maintenant dans l'onglet **"Actifs (1)"** 🎉

---

### Étape 3 : Qualifier EN MASSE (si vous avez 426 à faire)

#### Option A : Validation manuelle un par un (long)
- Temps estimé : 10-15 min par prestataire
- Total : 426 × 10 min = **71 heures** 😱

#### Option B : Import des documents + Validation en masse (recommandé)

**Si vous avez les documents dans l'ancien système :**

1. **Exporter depuis ARTI ancien :**
   - Liste complète des prestataires avec documents
   - Copier les fichiers PDF dans un dossier

2. **Utiliser l'outil d'import :**
   ```
   Page Prestataires > Import Excel
   ```
   - Télécharger le template CSV
   - Remplir avec les données (raison sociale, NINEA, etc.)
   - Uploader
   - Les prestataires sont créés avec statut NOUVEAU

3. **Uploader les documents en masse** (via script ou manuellement)
   - Si vous avez un dossier avec tous les RCCM, NINEA, etc.
   - Utiliser un script Python pour uploader automatiquement
   - OU uploader manuellement les plus importants

4. **Validation en masse :**
   ```
   Page Validation Prestataires
   ```
   - Sélectionner plusieurs prestataires
   - Bouton "Valider en masse"
   - Tous passent à ACTIF en une fois

---

## 📊 Résultat attendu

Après qualification de 20 prestataires prioritaires :

```
┌─────────────────────────────────────────────────────────────────────┐
│  Total Prestataires    Actifs      Docs. Expirés   Nouveaux (30j)  │
│       431              20 ✅       0               426              │
│  Référentiel officiel  Qualifiés   À renouveler    Ajoutés récemment│
└─────────────────────────────────────────────────────────────────────┘
```

Onglet "Actifs (20)" :
```
┌─────────────────────────────────────────────────────────────────────┐
│ [ Actifs (20) ] │ Suspendus (0) │ Autres (411) │ Tous (431)        │
├─────────────────────────────────────────────────────────────────────┤
│ PRES-0001   ABC COMPANY            ...    BTP       ✅ ACTIF       │
│ PRES-0002   TECH SOLUTIONS         ...    IT        ✅ ACTIF       │
│ PRES-0015   BUILD & CO             ...    BTP       ✅ ACTIF       │
│ ...         (17 autres actifs)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Maintenant vous pouvez :**
- ✅ Créer des engagements
- ✅ Créer des liquidations
- ✅ Créer des ordonnancements
- ✅ Sélectionner ces 20 fournisseurs dans tous les modules

---

## 🚀 Plan d'action recommandé

### Phase 1 : Urgence (Aujourd'hui)
**Objectif :** Qualifier 5-10 prestataires les plus critiques

1. Identifier les 5 fournisseurs utilisés le plus souvent
2. Rassembler leurs documents (RCCM, NINEA, NIF, etc.)
3. Les qualifier un par un (méthode détaillée ci-dessus)
4. **Résultat :** 5-10 fournisseurs actifs pour les opérations urgentes

**Temps estimé :** 1-2 heures

---

### Phase 2 : Court terme (Cette semaine)
**Objectif :** Qualifier 50 prestataires principaux

1. Exporter la liste des fournisseurs ARTI 2025/2026
2. Trier par fréquence d'utilisation (nombre d'engagements)
3. Qualifier les 50 premiers
4. **Résultat :** Couverture de 80% des besoins

**Temps estimé :** 1-2 jours

---

### Phase 3 : Moyen terme (Ce mois)
**Objectif :** Qualifier tous les prestataires actifs

1. Qualifier les 200 prestataires restants
2. Marquer les inactifs comme INACTIF
3. **Résultat :** Référentiel complet et à jour

**Temps estimé :** 1 semaine

---

### Phase 4 : Long terme (Suivi continu)
**Objectif :** Maintenir le référentiel à jour

1. Monitoring des documents à expiration (dashboard)
2. Renouvellement proactif (15-30j avant)
3. Qualification des nouveaux fournisseurs sous 48h
4. **Résultat :** Aucune suspension automatique

---

## 🛠️ Besoin d'un script d'automatisation ?

Si vous avez :
- ✅ Un dossier avec tous les documents PDF (organisés par fournisseur)
- ✅ Un fichier Excel avec les métadonnées (dates d'expiration, etc.)
- ✅ Accès à l'API Supabase

**Je peux vous créer un script Python pour :**
1. Uploader automatiquement tous les documents
2. Créer les entrées dans la table `supplier_documents`
3. Qualifier automatiquement les prestataires
4. **Résultat :** 431 prestataires qualifiés en 30 minutes ⚡

---

## 💡 Astuce : Vérification rapide

**Voir l'état réel de vos prestataires :**

```sql
SELECT
  statut,
  COUNT(*) as nombre
FROM prestataires
GROUP BY statut
ORDER BY nombre DESC;
```

**Résultat attendu actuellement :**
```
statut              | nombre
--------------------+--------
NOUVEAU             | 426
INACTIF             | 5
EN_QUALIFICATION    | 0
ACTIF               | 0
SUSPENDU            | 0
```

**Résultat souhaité après qualification :**
```
statut              | nombre
--------------------+--------
ACTIF               | 250
NOUVEAU             | 150
INACTIF             | 31
EN_QUALIFICATION    | 0
SUSPENDU            | 0
```

---

## ❓ Questions ?

**Q : Dois-je vraiment qualifier tous les 431 prestataires ?**
**R :** Non ! Qualifiez d'abord les 20-50 les plus utilisés. Les autres peuvent rester NOUVEAU.

**Q : Puis-je qualifier un prestataire sans tous les documents ?**
**R :** Non. Les 7 documents obligatoires sont requis pour passer à ACTIF.

**Q : Et si je n'ai pas les documents d'un fournisseur ?**
**R :** Contactez le fournisseur pour qu'il vous les fournisse. En attendant, il reste NOUVEAU.

**Q : Puis-je importer les documents depuis l'ancien système ARTI ?**
**R :** Oui ! Si les documents sont dans la base ARTI, je peux créer un script de migration.

---

## 📞 Support

**Besoin d'aide pour :**
- Qualifier en masse
- Créer un script d'import
- Migrer les documents de l'ancien système

**Contact :** dsi@arti.ci

---

**Document créé le :** 5 février 2026
**Auteur :** Équipe SYGFP
**Contexte :** Migration ARTI → SYGFP
