# Guide Complet - Workflow Scanning SYGFP

## Vue d'ensemble

Le système de **Scanning** permet de numériser et uploader les pièces justificatives nécessaires pour les **Engagements** et les **Liquidations** avant leur soumission pour validation.

---

## Architecture du Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHAÎNE DE DÉPENSE SYGFP                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Note SEF ──▶ 2. Note AEF ──▶ 3. Imputation ──▶ 4. Expression Besoin    │
│                                                                             │
│  5. Passation Marché ──▶ 6. ENGAGEMENT ──▶ 7. LIQUIDATION ──▶ 8. Ordo     │
│                              │                   │                         │
│                              ▼                   ▼                         │
│                    ┌─────────────────┐  ┌─────────────────┐                │
│                    │   SCANNING      │  │   SCANNING      │                │
│                    │   ENGAGEMENT    │  │   LIQUIDATION   │                │
│                    └─────────────────┘  └─────────────────┘                │
│                                                                             │
│  9. Règlement                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Scanning Engagement

### Route
`/execution/scanning-engagement`

### Objectif
Uploader et valider les pièces justificatives obligatoires pour un engagement avant de le soumettre pour validation.

### Workflow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Engagement  │    │  Documents   │    │  Engagement  │    │  Engagement  │
│  BROUILLON   │───▶│  à Scanner   │───▶│   SOUMIS     │───▶│   VALIDÉ     │
│              │    │  (Checklist) │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### Rôles

| Rôle | Actions |
|------|---------|
| **Agent/Opérateur** | Crée l'engagement, uploade les documents |
| **Chef de Service** | Vérifie la complétude, soumet pour validation |
| **Directeur/DAAF** | Valide ou rejette l'engagement |

### Documents Obligatoires (par défaut)

| Type Document | Libellé | Obligatoire |
|---------------|---------|-------------|
| `marche` | Contrat/Marché signé | ✅ Oui |
| `bon_commande` | Bon de commande | ✅ Oui |
| `devis` | Devis/Proforma | ✅ Oui |
| `justificatif` | Justificatif de la dépense | ✅ Oui |
| `autre` | Document complémentaire | ❌ Non |

### Tables Utilisées

```sql
-- Engagement principal
budget_engagements (
    id, numero, objet, montant, fournisseur,
    statut,           -- 'brouillon', 'soumis', 'valide', 'rejete'
    checklist_complete,
    checklist_verified_by,
    checklist_verified_at
)

-- Checklist des documents
engagement_documents (
    id, engagement_id,
    type_document,    -- 'marche', 'bon_commande', 'devis', etc.
    libelle,
    est_obligatoire,  -- true/false
    est_fourni,       -- true/false (document uploadé?)
    file_path,        -- Chemin du fichier uploadé
    file_name,
    uploaded_by,
    uploaded_at
)
```

### Flux Détaillé

1. **Création de l'Engagement**
   - L'agent crée un engagement avec statut `brouillon`
   - Le système crée automatiquement la checklist de documents

2. **Phase de Scanning**
   - L'agent va sur `/execution/scanning-engagement`
   - Il voit tous les engagements en statut `brouillon` ou `soumis`
   - Il clique sur "Scanner" pour ouvrir le détail
   - Il uploade chaque document obligatoire

3. **Soumission**
   - Quand tous les documents obligatoires sont fournis
   - Le bouton "Soumettre pour validation" devient actif
   - L'engagement passe en statut `soumis`

4. **Validation**
   - Le validateur (Directeur/DAAF) reçoit une notification
   - Il vérifie les documents
   - Il valide ou rejette l'engagement

---

## 2. Scanning Liquidation

### Route
`/execution/scanning-liquidation`

### Objectif
Uploader les pièces justificatives pour une liquidation. **RÈGLE IMPORTANTE**: L'engagement associé doit être validé.

### Workflow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Engagement   │    │ Liquidation  │    │  Documents   │    │ Liquidation  │
│   VALIDÉ     │───▶│  BROUILLON   │───▶│  à Scanner   │───▶│   SOUMIS     │
│   ✅         │    │              │    │  (Checklist) │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### Prérequis
- ✅ Engagement validé
- ✅ Service fait constaté
- ✅ Facture reçue

### Documents Obligatoires

| Type Document | Libellé | Obligatoire |
|---------------|---------|-------------|
| `facture` | Facture définitive | ✅ Oui |
| `pv_reception` | PV de réception | ✅ Oui |
| `attestation_service_fait` | Attestation service fait | ✅ Oui |
| `bordereau` | Bordereau de livraison | ❌ Non |

### Tables Utilisées

```sql
-- Liquidation principale
budget_liquidations (
    id, engagement_id, numero, montant, net_a_payer,
    date_liquidation, reference_facture, service_fait,
    statut            -- 'brouillon', 'soumis', 'valide'
)

-- Checklist des documents (si existe)
liquidation_documents (
    id, liquidation_id,
    type_document,
    libelle,
    is_required,
    is_provided,
    file_path, file_name
)
```

---

## 3. Configuration des Données de Test

### Étape 1: Exécuter la migration de correction

Allez sur **Supabase Dashboard** > **SQL Editor** et exécutez:

```sql
-- Corriger les contraintes de statut
ALTER TABLE budget_engagements
DROP CONSTRAINT IF EXISTS budget_engagements_statut_check;

ALTER TABLE budget_engagements
ADD CONSTRAINT budget_engagements_statut_check
CHECK (statut IN (
    'brouillon', 'soumis', 'en_attente', 'a_valider',
    'valide', 'rejete', 'differe', 'annule', 'en_cours'
));

ALTER TABLE budget_liquidations
DROP CONSTRAINT IF EXISTS budget_liquidations_statut_check;

ALTER TABLE budget_liquidations
ADD CONSTRAINT budget_liquidations_statut_check
CHECK (statut IN (
    'brouillon', 'soumis', 'en_attente', 'a_valider',
    'valide', 'rejete', 'differe', 'annule', 'paye'
));
```

### Étape 2: Créer des données de test

```sql
-- Récupérer les IDs nécessaires
DO $$
DECLARE
    v_budget_line_id UUID := 'e7f1f697-0fcb-4fc6-9089-267daf80439c';
    v_user_id UUID := '04fc3ae7-5c99-4d5f-8bf7-06ae8e0a3503';
    v_eng_id_1 UUID;
    v_eng_id_2 UUID;
BEGIN
    -- Engagement 1: Brouillon - Documents incomplets
    INSERT INTO budget_engagements (
        budget_line_id, numero, objet, montant,
        date_engagement, fournisseur, statut,
        exercice, created_by, workflow_status
    ) VALUES (
        v_budget_line_id,
        'ENG-SCAN-001',
        'Matériel informatique - TEST',
        2500000,
        CURRENT_DATE,
        'TECH GABON',
        'brouillon',
        2026,
        v_user_id,
        'pending'
    ) RETURNING id INTO v_eng_id_1;

    -- Engagement 2: Brouillon - Complet
    INSERT INTO budget_engagements (
        budget_line_id, numero, objet, montant,
        date_engagement, fournisseur, statut,
        exercice, created_by, workflow_status
    ) VALUES (
        v_budget_line_id,
        'ENG-SCAN-002',
        'Fournitures bureau - TEST',
        850000,
        CURRENT_DATE,
        'PAPETERIE PRO',
        'brouillon',
        2026,
        v_user_id,
        'pending'
    ) RETURNING id INTO v_eng_id_2;

    -- Documents pour Engagement 1 (incomplets)
    INSERT INTO engagement_documents (engagement_id, type_document, libelle, est_obligatoire, est_fourni)
    VALUES
        (v_eng_id_1, 'marche', 'Contrat signé', true, false),
        (v_eng_id_1, 'bon_commande', 'Bon de commande', true, false),
        (v_eng_id_1, 'devis', 'Devis', true, false),
        (v_eng_id_1, 'justificatif', 'Justificatif', true, false);

    -- Documents pour Engagement 2 (complets)
    INSERT INTO engagement_documents (engagement_id, type_document, libelle, est_obligatoire, est_fourni, file_name)
    VALUES
        (v_eng_id_2, 'marche', 'Contrat signé', true, true, 'contrat.pdf'),
        (v_eng_id_2, 'bon_commande', 'Bon de commande', true, true, 'bc.pdf'),
        (v_eng_id_2, 'devis', 'Devis', true, true, 'devis.pdf'),
        (v_eng_id_2, 'justificatif', 'Justificatif', true, true, 'justif.pdf');

    RAISE NOTICE 'Données de test créées!';
    RAISE NOTICE 'Engagement incomplet: %', v_eng_id_1;
    RAISE NOTICE 'Engagement complet: %', v_eng_id_2;
END $$;
```

### Étape 3: Créer une liquidation de test

```sql
-- Liquidation de test (liée à un engagement validé)
INSERT INTO budget_liquidations (
    engagement_id, numero, montant, net_a_payer,
    date_liquidation, reference_facture, service_fait,
    statut, exercice
)
SELECT
    id,
    'LIQ-SCAN-001',
    80000000,
    78500000,
    CURRENT_DATE,
    'FACT-2026-001',
    true,
    'brouillon',
    2026
FROM budget_engagements
WHERE statut = 'valide'
LIMIT 1;
```

---

## 4. Comment Utiliser le Scanning

### Pour Scanner un Engagement

1. **Connectez-vous** avec un compte opérationnel (ex: `agent.dsi@arti.ci`)

2. **Naviguez** vers `/execution/scanning-engagement`

3. **Onglet "À scanner"**:
   - Affiche les engagements en statut `brouillon`
   - Badge "Complet" ou "X/Y" indique l'état des documents

4. **Cliquez "Scanner"**:
   - Ouvre le dialogue de détail
   - Affiche la checklist des documents
   - Uploadez chaque document obligatoire

5. **Soumettez**:
   - Quand tous les docs obligatoires sont fournis
   - Le bouton "Soumettre" devient actif

### Pour Scanner une Liquidation

1. **Prérequis**: L'engagement doit être **validé** ✅

2. **Naviguez** vers `/execution/scanning-liquidation`

3. **Vérifiez** le badge "Eng. Validé":
   - ✅ Vert = engagement validé → soumission possible
   - ⚠️ Orange = engagement non validé → soumission bloquée

4. **Mêmes étapes** que pour l'engagement

---

## 5. API et Hooks

### Hooks Utilisés

```typescript
// Pour les engagements
import { useEngagementDocuments } from '@/hooks/useEngagementDocuments';

// Pour les liquidations
import { useLiquidationDocuments } from '@/hooks/useLiquidationDocuments';

// Pour l'audit
import { useAuditLog } from '@/hooks/useAuditLog';
```

### Composants Checklist

```typescript
// Engagement
<EngagementChecklist
  engagementId={selectedEngagement.id}
  canEdit={selectedEngagement.statut === "brouillon"}
  showProgress={true}
  onCompletenessChange={handleChecklistChange}
  blockSubmitIfIncomplete={true}
/>

// Liquidation
<LiquidationChecklist
  liquidationId={selectedLiquidation.id}
  readOnly={selectedLiquidation.statut !== "brouillon"}
  onCompletenessChange={handleChecklistChange}
  blockSubmitIfIncomplete={true}
/>
```

---

## 6. Dépannage

### Problème: "Aucun engagement à numériser"

**Cause**: Les engagements existants n'ont pas le statut `brouillon` ou `soumis`.

**Solution**:
1. Exécutez la migration de correction des contraintes
2. Créez des données de test avec le bon statut
3. Ou mettez à jour les engagements existants:
```sql
UPDATE budget_engagements SET statut = 'brouillon' WHERE statut = 'en_attente';
```

### Problème: "Engagement non validé" (Liquidation)

**Cause**: L'engagement associé à la liquidation n'est pas en statut `valide`.

**Solution**: Validez d'abord l'engagement avant de pouvoir soumettre la liquidation.

### Problème: Upload de fichier échoue

**Vérifiez**:
1. La configuration du storage Supabase/R2
2. Les permissions RLS sur la table `engagement_documents`
3. La taille maximale du fichier

---

## 7. Résumé des Statuts

| Étape | Statuts Workflow |
|-------|------------------|
| **Création** | `brouillon` |
| **Documents uploadés** | `brouillon` (checklist complete) |
| **Soumission** | `soumis` |
| **Validation** | `valide` |
| **Rejet** | `rejete` |

---

**Dernière mise à jour**: 04/02/2026
