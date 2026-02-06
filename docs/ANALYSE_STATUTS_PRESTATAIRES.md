# Analyse Complète : Système ACTIF/INACTIF des Prestataires

**Date**: 5 février 2026
**Module**: Gestion des Prestataires
**Version**: 1.0

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Les 5 statuts possibles](#les-5-statuts-possibles)
3. [Workflow de qualification](#workflow-de-qualification)
4. [Règles métier détaillées](#règles-métier-détaillées)
5. [Implémentation technique](#implémentation-technique)
6. [Impact sur les autres modules](#impact-sur-les-autres-modules)
7. [Actions utilisateur](#actions-utilisateur)
8. [Cas d'usage](#cas-dusage)

---

## 1. Vue d'ensemble

### Objectif du système de statuts

Le système de statuts des prestataires permet de :
- ✅ **Contrôler la qualification** des fournisseurs avant utilisation
- ✅ **Bloquer les prestataires problématiques** (suspension)
- ✅ **Suivre le cycle de vie** d'un prestataire (du nouveau à l'actif)
- ✅ **Garantir la conformité** (documents fiscaux à jour)
- ✅ **Protéger les opérations** (seuls les ACTIFS peuvent être utilisés)

### Principe clé

> **Seuls les prestataires avec le statut `ACTIF` peuvent être sélectionnés dans les opérations de la chaîne de dépense (Marchés, Engagements, Liquidations, Ordonnancements).**

---

## 2. Les 5 statuts possibles

### Tableau récapitulatif

| Statut | Code DB | Badge UI | Couleur | Description | Peut être utilisé ? |
|--------|---------|----------|---------|-------------|---------------------|
| **Nouveau** | `NOUVEAU` | "Nouveau" | Gris (outline) | Prestataire créé, documents non vérifiés | ❌ Non |
| **En qualification** | `EN_QUALIFICATION` | "En qualification" | Bleu | Documents en cours de validation | ❌ Non |
| **Actif** | `ACTIF` | "Actif" | Vert | Qualifié et documents à jour | ✅ **OUI** |
| **Suspendu** | `SUSPENDU` | "Suspendu" | Rouge | Bloqué temporairement (problème, litige) | ❌ Non |
| **Inactif** | `INACTIF` | "Inactif" | Gris | Désactivé (plus utilisé) | ❌ Non |

### 2.1 NOUVEAU

**Quand ?**
- Lors de la création initiale d'un prestataire
- Via formulaire public de demande
- Via import CSV/Excel
- Ajout manuel par un agent

**Caractéristiques :**
- Aucun document vérifié
- Code fournisseur généré automatiquement (PRES-XXXX)
- Visible dans l'onglet "Autres" de la liste
- Ne peut PAS être sélectionné dans les opérations

**Action requise :**
- Vérifier et uploader les documents requis
- Passer à "EN_QUALIFICATION"

---

### 2.2 EN_QUALIFICATION

**Quand ?**
- Après upload des documents obligatoires
- En attente de validation par un agent habilité
- Documents en cours de vérification

**Caractéristiques :**
- Documents uploadés mais non validés
- Visible dans l'onglet "Autres"
- Ne peut PAS être sélectionné dans les opérations

**Documents requis (obligatoires) :**
| Document | Code | Expire ? | Rappel |
|----------|------|----------|--------|
| RCCM | `RCCM` | Oui | 30j avant |
| NINEA | `NINEA` | Oui | 30j avant |
| N° Fiscal (NIF) | `NIF` | Non | - |
| Patente | `PATENTE` | Oui | 30j avant |
| CNI Dirigeant | `CNI_DG` | Oui | 60j avant |
| RIB | `RIB` | Non | - |
| Quitus fiscal | `QUITUS` | Oui | 15j avant |

**Action requise :**
- Valider tous les documents
- OU refuser avec motif
- Une fois validé → passe automatiquement à **ACTIF**

---

### 2.3 ACTIF ✅

**Quand ?**
- Après validation réussie de tous les documents obligatoires
- Après réactivation d'un prestataire suspendu (si documents OK)
- Tous les documents sont à jour (non expirés)

**Caractéristiques :**
- **C'est le SEUL statut utilisable** dans les opérations
- Visible dans l'onglet "Actifs (X)" en première position
- Badge vert
- Peut être sélectionné dans :
  - Passation de marché
  - Engagement
  - Liquidation (bénéficiaire)
  - Ordonnancement (bénéficiaire)

**Conditions pour rester ACTIF :**
1. ✅ Tous les documents obligatoires présents
2. ✅ Aucun document expiré
3. ✅ Pas de suspension manuelle
4. ✅ Compte bancaire renseigné (RIB)

**Perte automatique du statut ACTIF :**
- ⚠️ Si un document obligatoire expire → passe à **SUSPENDU** (automatique)
- ⚠️ Si suspension manuelle → passe à **SUSPENDU**
- ⚠️ Si désactivation manuelle → passe à **INACTIF**

---

### 2.4 SUSPENDU ⚠️

**Quand ?**
- **Suspension manuelle** : par un agent habilité avec motif
- **Suspension automatique** : document obligatoire expiré
- Litige en cours avec le fournisseur
- Non-conformité détectée

**Caractéristiques :**
- Badge rouge "Suspendu"
- Visible dans l'onglet "Suspendus (X)"
- **Bloqué pour toute nouvelle opération**
- Les opérations en cours restent valides
- Enregistrement de :
  - `motif_suspension` (texte)
  - `suspended_at` (date)
  - `suspended_by` (user_id)

**Motifs fréquents de suspension :**
- Document RCCM expiré
- Document NINEA expiré
- Document Quitus fiscal expiré
- Litige commercial
- Non-respect contractuel
- Problème de facturation
- Problème de qualité de service

**Actions possibles :**
- **Réactiver** : repasse à ACTIF (si documents OK)
- **Renouveler documents** : uploader les nouveaux documents avant réactivation

---

### 2.5 INACTIF

**Quand ?**
- Désactivation volontaire
- Fournisseur qui ne travaille plus avec ARTI
- Fin de relation commerciale
- Faillite / radiation du fournisseur

**Caractéristiques :**
- Badge gris "Inactif"
- Visible dans l'onglet "Autres (X)"
- Conservé dans le référentiel (historique)
- Ne peut PAS être sélectionné
- Peut être réactivé si besoin (rare)

**Différence avec SUSPENDU :**
| Critère | SUSPENDU | INACTIF |
|---------|----------|---------|
| Temporaire ? | Oui (en attente de résolution) | Non (définitif ou long terme) |
| Motif requis ? | Oui obligatoire | Non |
| Réactivation fréquente ? | Oui | Rare |
| Visible dans stats ? | Oui (badge orange en header) | Non |

---

## 3. Workflow de qualification

### 3.1 Diagramme complet

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRÉATION PRESTATAIRE                         │
│  (Formulaire public / Interne / Import CSV)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │    NOUVEAU     │
                    │  (Badge gris)  │
                    └────────┬───────┘
                             │
                             │ Upload documents obligatoires
                             │ (RCCM, NINEA, NIF, Patente, CNI, RIB, Quitus)
                             │
                             ▼
                    ┌────────────────────┐
                    │  EN_QUALIFICATION  │
                    │   (Badge bleu)     │
                    └─────────┬──────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
          VALIDATION                   REFUS
                 │                         │
                 ▼                         ▼
        ┌─────────────┐            ┌──────────────┐
        │    ACTIF    │            │   NOUVEAU    │
        │ (Badge vert)│            │ avec motif   │
        └──────┬──────┘            └──────────────┘
               │
               │ Utilisation normale
               │ (Marchés, Engagements, Liquidations, Ordonnancements)
               │
               ├─────────────────────────────────────────┐
               │                                         │
        Document expire                         Suspension manuelle
        (automatique)                           (avec motif)
               │                                         │
               ▼                                         ▼
        ┌──────────────┐                        ┌──────────────┐
        │  SUSPENDU    │◄───────────────────────│  SUSPENDU    │
        │ (Badge rouge)│                        │ (Badge rouge)│
        └──────┬───────┘                        └──────┬───────┘
               │                                       │
               │ Renouveler documents                  │ Réactiver
               │ + Réactivation                        │ (si OK)
               │                                       │
               └───────────────┬───────────────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │    ACTIF    │
                        │ (Badge vert)│
                        └──────┬──────┘
                               │
                               │ Désactivation définitive
                               │ (rare)
                               ▼
                        ┌─────────────┐
                        │   INACTIF   │
                        │ (Badge gris)│
                        └─────────────┘
```

### 3.2 Parcours normal (happy path)

1. **Agent crée un nouveau prestataire** → `NOUVEAU`
2. **Agent uploade documents** → reste `NOUVEAU` (en attente)
3. **Vérificateur vérifie documents** → passe à `EN_QUALIFICATION`
4. **Validateur valide** → passe à `ACTIF` ✅
5. **Utilisation dans opérations** → reste `ACTIF`
6. **Monitoring automatique** des dates d'expiration

### 3.3 Gestion des expirations (automatique)

```typescript
// Vérification quotidienne (cron job ou trigger)
FOR EACH prestataire WHERE statut = 'ACTIF' DO
  FOR EACH document obligatoire DO
    IF document.date_expiration < TODAY THEN
      prestataire.statut = 'SUSPENDU'
      prestataire.motif_suspension = 'Document expiré : ' + document.libelle
      prestataire.suspended_at = NOW()

      // Notification automatique
      SEND_EMAIL(prestataire.email, 'Document expiré - Suspension')
      SEND_ALERT(agent_admin, 'Prestataire suspendu : ' + prestataire.raison_sociale)
    END IF
  END FOR
END FOR
```

---

## 4. Règles métier détaillées

### 4.1 Création d'un prestataire

**Règles :**
1. Raison sociale obligatoire (unique)
2. Code auto-généré : `PRES-0001`, `PRES-0002`, etc.
3. Statut initial : `NOUVEAU`
4. Email et téléphone recommandés
5. NINEA/NIF/RCCM recommandés (requis pour qualification)

**Vérification de doublons :**
```sql
-- Recherche par raison sociale ou NINEA/NIF
SELECT * FROM prestataires
WHERE raison_sociale ILIKE '%TECH SOLUTIONS%'
   OR ninea = '123456789'
   OR nif = 'F123456789';
```

---

### 4.2 Qualification

**Conditions pour QUALIFIER un prestataire :**

✅ **Tous les documents obligatoires uploadés :**
- RCCM (avec date d'expiration)
- NINEA (avec date d'expiration)
- NIF
- Patente (avec date d'expiration)
- CNI Dirigeant (avec date d'expiration)
- RIB
- Quitus fiscal (avec date d'expiration)

✅ **Aucun document expiré**

✅ **Informations bancaires complètes** :
- Nom de la banque
- Numéro de compte
- Clé RIB (optionnelle)
- OU IBAN/BIC pour international

**Hook de vérification :**
```typescript
const { canQualify, missingDocuments, expiredDocuments } =
  useSupplierQualification(supplierId);

// canQualify = true si toutes les conditions remplies
// missingDocuments = ['RCCM', 'NINEA'] si manquants
// expiredDocuments = ['Quitus'] si expirés
```

---

### 4.3 Suspension

**Deux types de suspension :**

#### A. Suspension MANUELLE

**Déclencheur :** Agent habilité clique sur "Suspendre"

**Process :**
1. Dialog s'ouvre → motif obligatoire
2. Validation → UPDATE table prestataires :
   ```sql
   UPDATE prestataires SET
     statut = 'SUSPENDU',
     motif_suspension = 'Litige commercial en cours',
     suspended_at = NOW(),
     suspended_by = current_user_id
   WHERE id = prestataire_id;
   ```
3. Audit log créé :
   ```typescript
   await supabase.from("audit_logs").insert({
     entity_type: "prestataire",
     entity_id: id,
     action: "supplier_suspended",
     new_values: { motif: "Litige commercial en cours" },
   });
   ```
4. Notification envoyée au prestataire (optionnel)

#### B. Suspension AUTOMATIQUE

**Déclencheur :** Document obligatoire expire

**Process (trigger SQL ou cron) :**
```sql
-- Trigger sur supplier_documents.date_expiration
CREATE OR REPLACE FUNCTION auto_suspend_on_document_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'expire' AND NEW.est_obligatoire = true THEN
    UPDATE prestataires SET
      statut = 'SUSPENDU',
      motif_suspension = 'Document expiré : ' || NEW.libelle,
      suspended_at = NOW()
    WHERE id = NEW.supplier_id AND statut = 'ACTIF';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 4.4 Réactivation

**Conditions pour RÉACTIVER :**
1. Prestataire actuellement en statut `SUSPENDU`
2. Tous les documents obligatoires à jour (renouvelés si nécessaire)
3. Motif de suspension résolu (si manuel)

**Process :**
```typescript
// Hook
const { activateSupplier } = usePrestataires();
activateSupplier(prestataire.id);

// Backend
UPDATE prestataires SET
  statut = 'ACTIF',
  date_qualification = NOW(),
  motif_suspension = NULL,
  suspended_at = NULL,
  suspended_by = NULL
WHERE id = prestataire_id;

// Audit log
INSERT INTO audit_logs (entity_type, entity_id, action)
VALUES ('prestataire', prestataire_id, 'supplier_activated');
```

---

## 5. Implémentation technique

### 5.1 Schéma de la table `prestataires`

```sql
CREATE TABLE prestataires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  raison_sociale TEXT NOT NULL,
  sigle TEXT,
  type_prestataire VARCHAR,
  forme_juridique VARCHAR, -- SARL, SA, EI, EURL...

  -- Identifiants fiscaux
  rccm TEXT,
  ninea TEXT,
  nif TEXT,
  ifu TEXT,

  -- Contact
  adresse TEXT,
  ville TEXT,
  telephone TEXT,
  email TEXT,
  contact_nom TEXT,
  contact_fonction TEXT,
  contact_telephone TEXT,
  contact_email TEXT,

  -- Secteur d'activité
  secteur_activite TEXT,
  secteur_principal_id UUID REFERENCES secteurs_activite(id),
  secteur_secondaire_id UUID REFERENCES secteurs_activite(id),

  -- STATUT (CLEF) 🔑
  statut VARCHAR DEFAULT 'NOUVEAU',
    -- 'NOUVEAU' | 'EN_QUALIFICATION' | 'ACTIF' | 'SUSPENDU' | 'INACTIF'

  -- Qualification
  date_qualification TIMESTAMP,
  statut_fiscal VARCHAR,
  date_expiration_fiscale DATE,

  -- Suspension
  motif_suspension TEXT,
  suspended_at TIMESTAMP,
  suspended_by UUID REFERENCES auth.users(id),

  -- Bancaire (principal)
  rib_banque TEXT,
  rib_numero TEXT,
  rib_cle TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_prestataires_statut ON prestataires(statut);
CREATE INDEX idx_prestataires_raison_sociale ON prestataires(raison_sociale);
CREATE INDEX idx_prestataires_ninea ON prestataires(ninea);
```

---

### 5.2 Hook React principal : `usePrestataires`

**Fichier :** `src/hooks/usePrestataires.ts` (426 lignes)

**Exports clés :**

```typescript
export function usePrestataires() {
  return {
    // Données
    prestataires: Prestataire[],          // Tous les prestataires
    prestatairesActifs: Prestataire[],    // Filtré statut='ACTIF'
    prestairesSuspendus: Prestataire[],   // Filtré statut='SUSPENDU'
    nouveaux: Prestataire[],              // Créés < 30 jours

    // Stats
    stats: {
      total: number,      // Total tous statuts
      actifs: number,     // statut='ACTIF'
      suspendus: number,  // statut='SUSPENDU'
      inactifs: number,   // statut IN ('INACTIF','NOUVEAU','EN_QUALIFICATION')
      nouveaux: number,   // created_at < 30j
    },

    // Chargement
    isLoading: boolean,

    // Mutations
    suspendSupplier: (id, motif) => Promise<void>,
    activateSupplier: (id) => Promise<void>,
    checkDuplicate: (raisonSociale, nif?) => Promise<Prestataire[]>,
  };
}
```

**Exemple d'utilisation :**

```tsx
function MonComposant() {
  const {
    prestataires,
    prestatairesActifs,
    stats,
    suspendSupplier,
    activateSupplier
  } = usePrestataires();

  // Afficher les stats
  console.log(`Total: ${stats.total}, Actifs: ${stats.actifs}`);

  // Suspendre un prestataire
  const handleSuspend = (id: string) => {
    suspendSupplier({
      id,
      motif: "Litige en cours avec le fournisseur"
    });
  };

  // Réactiver
  const handleActivate = (id: string) => {
    activateSupplier(id);
  };

  // Utiliser seulement les actifs dans un select
  return (
    <select>
      {prestatairesActifs.map(p => (
        <option key={p.id} value={p.id}>
          {p.raison_sociale}
        </option>
      ))}
    </select>
  );
}
```

---

### 5.3 Filtrage par onglet (UI)

**Fichier :** `src/pages/contractualisation/Prestataires.tsx` (ligne 73-88)

```typescript
const filteredPrestataires = prestataires.filter(p => {
  const matchSearch =
    p.raison_sociale.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.ninea?.toLowerCase().includes(search.toLowerCase());

  if (selectedTab === "actifs") {
    return matchSearch && p.statut === "ACTIF";
  } else if (selectedTab === "suspendus") {
    return matchSearch && p.statut === "SUSPENDU";
  } else if (selectedTab === "inactifs") {
    // Groupe "Autres" = INACTIF + NOUVEAU + EN_QUALIFICATION
    return matchSearch && (
      p.statut === "INACTIF" ||
      p.statut === "NOUVEAU" ||
      p.statut === "EN_QUALIFICATION"
    );
  }
  // Onglet "Tous"
  return matchSearch;
});
```

**Onglets affichés :**
- **Actifs (X)** → statut = `ACTIF`
- **Suspendus (X)** → statut = `SUSPENDU`
- **Autres (X)** → statut IN (`INACTIF`, `NOUVEAU`, `EN_QUALIFICATION`)
- **Tous (X)** → tous statuts confondus

---

### 5.4 Badges visuels

**Fichier :** `src/pages/contractualisation/Prestataires.tsx` (ligne 97-110)

```typescript
const getStatusBadge = (statut: string | null) => {
  switch (statut) {
    case "ACTIF":
      return <Badge className="bg-green-600">Actif</Badge>;
    case "SUSPENDU":
      return <Badge variant="destructive">Suspendu</Badge>;
    case "EN_QUALIFICATION":
      return <Badge variant="outline" className="text-blue-600 border-blue-600">
        En qualification
      </Badge>;
    case "NOUVEAU":
      return <Badge variant="outline">Nouveau</Badge>;
    default: // INACTIF ou NULL
      return <Badge variant="secondary">Inactif</Badge>;
  }
};
```

**Rendu visuel :**
| Statut | Badge |
|--------|-------|
| ACTIF | 🟢 Badge vert plein "Actif" |
| SUSPENDU | 🔴 Badge rouge "Suspendu" |
| EN_QUALIFICATION | 🔵 Badge bleu outline "En qualification" |
| NOUVEAU | ⚪ Badge gris outline "Nouveau" |
| INACTIF | ⚫ Badge gris secondaire "Inactif" |

---

## 6. Impact sur les autres modules

### 6.1 Composant `PrestataireSelect`

**Rôle :** Sélecteur de prestataire utilisé dans toute l'application

**Règle critique :** **N'affiche QUE les prestataires ACTIFS**

```typescript
// src/components/prestataires/PrestataireSelect.tsx
const { prestatairesActifs } = usePrestataires();

// Dans le render
<select>
  {prestatairesActifs.map(p => (
    <option value={p.id}>{p.raison_sociale}</option>
  ))}
</select>
```

**Utilisé dans :**
- 🏭 **Marchés** (attribution fournisseur)
- 📝 **Engagements** (sélection fournisseur)
- 💰 **Liquidations** (bénéficiaire)
- 📋 **Ordonnancements** (bénéficiaire)
- 💳 **Règlements** (bénéficiaire)

---

### 6.2 Conséquences d'une suspension

**Scénario :** Un prestataire `ACTIF` est suspendu

| Module | Impact | Comportement |
|--------|--------|--------------|
| **Marchés en cours** | ✅ Aucun | Les marchés existants restent valides |
| **Nouveaux marchés** | ❌ Bloqué | Ne peut plus être sélectionné |
| **Engagements en cours** | ✅ Aucun | Les engagements existants restent valides |
| **Nouveaux engagements** | ❌ Bloqué | Ne peut plus être sélectionné |
| **Liquidations** | ⚠️ Partiel | Peut liquider les engagements existants, mais ne peut pas créer de nouveaux |
| **Ordonnancements** | ⚠️ Partiel | Peut ordonnancer les liquidations existantes |
| **Règlements** | ⚠️ Partiel | Peut régler les ordonnancements existants |

**Conclusion :** La suspension n'annule pas les opérations existantes, mais empêche toute nouvelle opération.

---

### 6.3 Alerte documents expirés

**Composant :** `PrestatairesAlertBadge.tsx`

```typescript
const { stats } = useSupplierExpiredDocuments();

// stats = { expired: 5, toRenew: 12 }

// Badge affiché dans le header
{stats.expired > 0 && (
  <Badge variant="destructive">
    {stats.expired} documents expirés
  </Badge>
)}
```

**Impact sur l'UI :**
- Header page Prestataires affiche le nombre de documents expirés
- Card "Docs. Expirés" affiche le chiffre rouge
- Action requise : renouveler les documents

---

## 7. Actions utilisateur

### 7.1 Créer un nouveau prestataire

**Navigation :** Contractualisation > Prestataires > **+ Nouveau prestataire**

**Formulaire :** `src/pages/contractualisation/DemandePrestataire.tsx`

**Champs requis :**
- Raison sociale (obligatoire)
- Email
- Téléphone
- Adresse
- NINEA (recommandé)
- RCCM (recommandé)

**Résultat :** Prestataire créé avec statut `NOUVEAU`

---

### 7.2 Qualifier un prestataire

**Process complet :**

1. **Accéder au prestataire** : Cliquer sur 👁️ dans la liste
2. **Onglet "Documents"** : Cliquer
3. **Uploader documents** :
   - Cliquer sur "Upload document"
   - Sélectionner le type (RCCM, NINEA, etc.)
   - Uploader le fichier PDF/JPG
   - Renseigner la date d'expiration si applicable
   - Répéter pour tous les documents obligatoires
4. **Vérifier** : Le système indique si tous les documents sont présents
5. **Qualifier** :
   - Bouton "Qualifier" s'active si tout est OK
   - Cliquer → statut passe à `EN_QUALIFICATION`
6. **Valider** : Agent validateur vérifie et approuve
7. **Résultat** : Statut passe à `ACTIF` ✅

---

### 7.3 Suspendre un prestataire

**Qui peut ?** Agent avec permission `prestataires.suspend`

**Cas d'usage :**
- Litige commercial
- Non-respect d'un contrat
- Malfaçon / mauvaise qualité
- Problème de facturation
- Document expiré (automatique)

**Process :**

1. Ouvrir la fiche du prestataire (👁️)
2. Bouton "Suspendre" (visible si statut = ACTIF)
3. Dialog s'ouvre → **Motif obligatoire**
4. Saisir le motif détaillé (ex: "Litige en cours - facture contestée")
5. Confirmer
6. Toast de succès : "Prestataire suspendu"
7. Badge devient rouge
8. Prestataire disparaît des listes de sélection

**Données enregistrées :**
```sql
UPDATE prestataires SET
  statut = 'SUSPENDU',
  motif_suspension = 'Litige en cours - facture contestée',
  suspended_at = '2026-02-05 18:30:00',
  suspended_by = 'user-uuid-xxx'
WHERE id = 'prestataire-uuid';
```

---

### 7.4 Réactiver un prestataire

**Qui peut ?** Agent avec permission `prestataires.activate`

**Conditions préalables :**
- Prestataire actuellement `SUSPENDU`
- Documents obligatoires à jour (renouvelés si nécessaire)
- Motif de suspension résolu

**Process :**

1. Ouvrir la fiche du prestataire suspendu
2. Vérifier que tous les documents sont valides (onglet "Documents")
3. Si documents expirés → les renouveler d'abord
4. Bouton "Réactiver" (visible si statut = SUSPENDU)
5. Confirmer
6. Toast : "Prestataire activé"
7. Badge devient vert
8. Prestataire réapparaît dans les listes de sélection

---

### 7.5 Renouveler un document expiré

**Scenario :** Document RCCM expiré → suspension automatique

**Process de renouvellement :**

1. Accéder au prestataire suspendu
2. Onglet "Documents"
3. Repérer le document expiré (badge rouge "Expiré")
4. Cliquer sur "Renouveler"
5. Uploader le nouveau document
6. Renseigner la nouvelle date d'expiration
7. Valider
8. Le document passe de "Expiré" à "Valide"
9. Si tous les documents OK → réactiver le prestataire

---

## 8. Cas d'usage

### Cas 1 : Nouveau fournisseur

**Contexte :** ARTI veut ajouter "TECH SOLUTIONS SARL" comme fournisseur

**Étapes :**

1. **Agent DAAF** se connecte
2. Navigation : Contractualisation > Prestataires
3. Clic sur **+ Nouveau prestataire**
4. Remplit le formulaire :
   - Raison sociale : TECH SOLUTIONS SARL
   - Sigle : TCS
   - Forme juridique : SARL
   - NINEA : 123456789
   - Email : contact@techsolutions.ci
   - Téléphone : +241 01 23 45 67
5. Enregistre → Prestataire créé avec statut `NOUVEAU`
6. Retour sur la liste → visible dans onglet "Autres (X)"
7. Badge gris "Nouveau"
8. **Impossible de sélectionner** dans un engagement

---

### Cas 2 : Qualification d'un nouveau prestataire

**Contexte :** TECH SOLUTIONS SARL doit être qualifié pour être utilisable

**Étapes :**

1. **Agent DAAF** accède à la fiche TECH SOLUTIONS
2. Onglet "Documents"
3. Upload des documents :
   - RCCM : `rccm_tech_solutions.pdf` (expire 31/12/2026)
   - NINEA : `ninea_tech_solutions.pdf` (expire 31/12/2026)
   - NIF : `nif_tech_solutions.pdf` (pas d'expiration)
   - Patente : `patente_2026.pdf` (expire 31/12/2026)
   - CNI Dirigeant : `cni_gerant.pdf` (expire 15/06/2028)
   - RIB : `rib_bgfi.pdf` (pas d'expiration)
   - Quitus fiscal : `quitus_2025.pdf` (expire 31/03/2026)
4. Tous les documents uploadés → indicateur vert
5. Onglet "Banque" : Renseigner coordonnées bancaires
   - Banque : BGFI Bank
   - N° compte : GA12345678901234567890
6. Clic sur "Qualifier"
7. Statut passe à `EN_QUALIFICATION` → Badge bleu
8. **Validateur** vérifie les documents
9. Clic sur "Valider"
10. Statut passe à `ACTIF` → Badge vert ✅
11. TECH SOLUTIONS apparaît maintenant dans tous les sélecteurs

---

### Cas 3 : Suspension pour document expiré (automatique)

**Contexte :** Quitus fiscal de TECH SOLUTIONS expire le 31/03/2026

**Chronologie :**

1. **15 mars 2026** : Alerte envoyée (15 jours avant expiration)
   - Email au prestataire : "Votre Quitus fiscal expire dans 15 jours"
   - Badge orange dans l'interface : "1 document à renouveler"
2. **31 mars 2026** : Document expire
3. **1er avril 2026** (minuit) : Trigger automatique s'exécute
   ```sql
   UPDATE prestataires SET
     statut = 'SUSPENDU',
     motif_suspension = 'Document expiré : Quitus fiscal',
     suspended_at = NOW()
   WHERE id = 'tech-solutions-uuid';
   ```
4. Badge devient rouge "Suspendu"
5. TECH SOLUTIONS disparaît des sélecteurs
6. Notification envoyée à l'agent DAAF
7. Les engagements existants restent valides, mais impossibles d'en créer de nouveaux

**Résolution :**

1. Agent DAAF contacte TECH SOLUTIONS
2. TECH SOLUTIONS fournit le nouveau Quitus fiscal 2026
3. Agent DAAF uploade le document (expire 31/03/2027)
4. Agent DAAF clique sur "Réactiver"
5. Statut repasse à `ACTIF`
6. TECH SOLUTIONS réapparaît dans les sélecteurs

---

### Cas 4 : Suspension manuelle pour litige

**Contexte :** TECH SOLUTIONS a livré du matériel défectueux

**Étapes :**

1. **DAAF** reçoit une plainte du service technique
2. Décision : Suspendre le fournisseur le temps de résoudre le litige
3. Accède à la fiche TECH SOLUTIONS
4. Clic sur "Suspendre"
5. Dialog : Saisit le motif détaillé :
   ```
   Matériel informatique livré défectueux (commande ENG-2026-0042).
   20 ordinateurs sur 50 ne fonctionnent pas.
   En attente de remplacement ou remboursement.
   ```
6. Confirme
7. Statut passe à `SUSPENDU`
8. Toast : "Prestataire suspendu"
9. Badge rouge
10. TECH SOLUTIONS n'est plus sélectionnable
11. **3 semaines plus tard** : Litige résolu, matériel remplacé
12. DAAF clique sur "Réactiver"
13. Statut repasse à `ACTIF`

---

### Cas 5 : Désactivation définitive

**Contexte :** Fournisseur "OLD COMPANY" ne travaille plus avec ARTI depuis 2 ans

**Étapes :**

1. **Agent DAAF** veut nettoyer le référentiel
2. Accède à OLD COMPANY (statut actuel : `ACTIF` mais inutilisé)
3. Vérifie qu'aucune opération en cours
4. Clic sur "Désactiver" (ou modification manuelle)
5. Statut passe à `INACTIF`
6. OLD COMPANY reste dans la base (historique) mais n'est plus visible dans les listes actives
7. Visible uniquement dans onglet "Autres" avec badge gris

---

## 9. Résumé des règles métier

| Règle | Description |
|-------|-------------|
| **R1** | Seuls les prestataires `ACTIF` peuvent être utilisés dans les opérations |
| **R2** | Un prestataire devient `ACTIF` uniquement après validation de tous les documents obligatoires |
| **R3** | Un document expiré entraîne une suspension automatique (`SUSPENDU`) |
| **R4** | Une suspension manuelle nécessite un motif obligatoire |
| **R5** | La réactivation nécessite que tous les documents soient à jour |
| **R6** | Les opérations existantes avec un prestataire suspendu restent valides |
| **R7** | Un prestataire `INACTIF` est conservé dans la base pour l'historique |
| **R8** | Le code fournisseur est généré automatiquement et unique (PRES-XXXX) |
| **R9** | Les alertes documents sont envoyées X jours avant expiration (configurable) |
| **R10** | Un audit trail est créé pour chaque changement de statut |

---

## 10. Checklist de contrôle

### ✅ Pour un agent DAAF

**Avant de créer un engagement :**
- [ ] Le prestataire est-il dans la liste de sélection ? (= ACTIF)
- [ ] Les documents fiscaux sont-ils à jour ?
- [ ] Les coordonnées bancaires sont-elles renseignées ?

**Si le prestataire n'apparaît pas :**
- [ ] Vérifier le statut (onglet Prestataires > Tous)
- [ ] Si SUSPENDU → vérifier le motif
- [ ] Si documents expirés → les renouveler
- [ ] Si NOUVEAU → le qualifier d'abord

### ✅ Pour un validateur

**Avant de qualifier un prestataire :**
- [ ] Tous les documents obligatoires sont uploadés
- [ ] Toutes les dates d'expiration sont renseignées
- [ ] Les documents sont lisibles et valides
- [ ] Les informations bancaires sont complètes
- [ ] La raison sociale correspond aux documents officiels

### ✅ Pour un administrateur

**Monitoring régulier :**
- [ ] Vérifier le nombre de documents expirés (header)
- [ ] Traiter les suspensions automatiques
- [ ] Relancer les fournisseurs avec documents à renouveler
- [ ] Nettoyer les prestataires inactifs (passage en INACTIF)

---

## 11. FAQ

### Q1 : Puis-je créer un engagement avec un prestataire NOUVEAU ?

**R : Non.** Seuls les prestataires `ACTIF` peuvent être sélectionnés. Vous devez d'abord qualifier le prestataire.

---

### Q2 : Si je suspends un prestataire, les engagements existants sont-ils annulés ?

**R : Non.** Les opérations existantes (marchés, engagements, liquidations) restent valides. La suspension empêche uniquement de **nouvelles** opérations.

---

### Q3 : Combien de temps avant expiration dois-je renouveler un document ?

**R : Cela dépend du type de document :**
- RCCM / NINEA / Patente : 30 jours avant
- CNI Dirigeant : 60 jours avant
- Quitus fiscal : 15 jours avant

L'alerte est envoyée automatiquement.

---

### Q4 : Quelle est la différence entre SUSPENDU et INACTIF ?

| Critère | SUSPENDU | INACTIF |
|---------|----------|---------|
| **Temporaire ?** | Oui (résolution attendue) | Non (définitif) |
| **Motif ?** | Obligatoire | Non |
| **Réactivation ?** | Fréquente | Rare |
| **Visible stats ?** | Oui (badge header) | Non |

**SUSPENDU** = blocage temporaire (litige, document expiré)
**INACTIF** = désactivation définitive (fin de relation, faillite)

---

### Q5 : Puis-je qualifier plusieurs prestataires en même temps ?

**R : Oui.** Utilisez le **Panier de validation** :
1. Créez plusieurs demandes de prestataires (ou importez CSV)
2. Allez dans "Validation Prestataires"
3. Sélectionnez plusieurs demandes
4. Clic sur "Valider en masse"

Tous les prestataires passent à `ACTIF` en une seule fois.

---

### Q6 : Comment importer 100 prestataires d'un coup ?

**R : Via Import Excel/CSV :**
1. Contractualisation > Prestataires
2. Clic sur "Import Excel"
3. Téléchargez le template CSV
4. Remplissez avec vos données (colonnes : raison_sociale, email, ninea, etc.)
5. Uploadez le fichier
6. Les prestataires sont créés avec statut `NOUVEAU`
7. Qualifiez-les ensuite individuellement ou en masse

---

### Q7 : Un prestataire peut-il avoir plusieurs comptes bancaires ?

**R : Oui.** Table `supplier_bank_accounts` permet plusieurs comptes, avec un compte "principal" marqué par `est_principal = true`.

---

### Q8 : Que se passe-t-il si je supprime un document obligatoire ?

**R : Le prestataire `ACTIF` repasse automatiquement à `SUSPENDU`** car la condition "tous les documents obligatoires présents" n'est plus respectée.

---

### Q9 : Puis-je modifier un prestataire ACTIF ?

**R : Oui.** Vous pouvez modifier ses informations (adresse, téléphone, email) sans changer son statut. Par contre, si vous supprimez un document, il sera suspendu.

---

### Q10 : Les prestataires SUSPENDUS sont-ils visibles dans les rapports ?

**R : Oui.** Ils apparaissent dans :
- Onglet "Suspendus" de la page Prestataires
- Exports Excel (avec colonne "Statut")
- Historique des opérations passées

---

## 12. Conclusion

Le système de statuts des prestataires dans SYGFP est conçu pour :

✅ **Sécuriser** les opérations en garantissant que seuls les fournisseurs qualifiés et à jour peuvent être utilisés

✅ **Automatiser** le suivi des documents fiscaux avec alertes et suspensions automatiques

✅ **Tracer** toutes les actions (qualification, suspension, réactivation) via audit logs

✅ **Protéger** ARTI contre les fournisseurs non conformes ou problématiques

**Règle d'or :** 🟢 **ACTIF = Opérationnel**. Tous les autres statuts bloquent l'utilisation.

---

**Document maintenu par :** Équipe SYGFP
**Contact :** dsi@arti.ci
**Dernière révision :** 5 février 2026
