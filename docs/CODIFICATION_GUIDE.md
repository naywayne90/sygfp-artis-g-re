# Guide Codification SYGFP

> **Règles de codification et nomenclatures**  
> Version: 1.0 | Dernière mise à jour: 2026-01-15

---

## 1. Vue d'ensemble

SYGFP utilise un système de codification structuré pour identifier de manière unique chaque document et entité. Ce guide détaille les formats, les règles et les mécanismes de génération.

---

## 2. Référence Pivot

### 2.1 Format standard

La **référence pivot** est le code d'identification unique principal :

```
ARTI + ÉTAPE + MM + YY + NNNN
```

| Segment | Longueur | Description | Exemple |
|---------|----------|-------------|---------|
| `ARTI` | 4 | Préfixe fixe (organisation) | `ARTI` |
| `ÉTAPE` | 1 | Numéro d'étape chaîne dépense | `0` (SEF), `1` (AEF), `6` (ENG) |
| `MM` | 2 | Mois (01-12) | `01` |
| `YY` | 2 | Année sur 2 chiffres | `26` |
| `NNNN` | 4 | Séquence (0001-9999) | `0001` |

**Longueur totale : 13 caractères**

### 2.2 Codes d'étape

| Étape | Code | Document |
|-------|------|----------|
| Note SEF | `0` | Sans Effet Financier |
| Note AEF | `1` | Avec Effet Financier |
| Imputation | `2` | Imputation budgétaire |
| Expression Besoin | `3` | Expression de besoin |
| Marché | `4` | Passation de marché |
| Engagement | `5` | Engagement budgétaire |
| Liquidation | `6` | Liquidation |
| Ordonnancement | `7` | Ordonnancement |
| Règlement | `8` | Règlement |
| Virement | `9` | Virement de crédit |

### 2.3 Exemples

| Date | Étape | Séquence | Référence |
|------|-------|----------|-----------|
| Janvier 2026, 1ère Note SEF | 0 | 1 | `ARTI001260001` |
| Janvier 2026, 2ème Note SEF | 0 | 2 | `ARTI001260002` |
| Février 2026, 1er Engagement | 5 | 1 | `ARTI502260001` |
| Mars 2026, 15ème Règlement | 8 | 15 | `ARTI803260015` |

### 2.4 Génération automatique

```sql
-- Fonction de génération atomique
CREATE FUNCTION generate_reference(p_etape text, p_date date DEFAULT now()::date)
RETURNS text AS $$
DECLARE
  v_mm text;
  v_yy text;
  v_seq integer;
BEGIN
  v_mm := LPAD(EXTRACT(MONTH FROM p_date)::text, 2, '0');
  v_yy := LPAD((EXTRACT(YEAR FROM p_date) % 100)::text, 2, '0');
  
  -- UPSERT atomique pour éviter les doublons
  INSERT INTO reference_counters (etape, mm, yy, sequence)
  VALUES (p_etape, v_mm, v_yy, 1)
  ON CONFLICT (etape, mm, yy)
  DO UPDATE SET sequence = reference_counters.sequence + 1
  RETURNING sequence INTO v_seq;
  
  RETURN 'ARTI' || p_etape || v_mm || v_yy || LPAD(v_seq::text, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

### 2.5 Table des compteurs

```sql
CREATE TABLE reference_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etape TEXT NOT NULL,           -- Code étape (0-9)
  mm TEXT NOT NULL,              -- Mois (01-12)
  yy TEXT NOT NULL,              -- Année (00-99)
  sequence INTEGER DEFAULT 1,     -- Compteur séquentiel
  UNIQUE (etape, mm, yy)
);
```

---

## 3. Hiérarchie Programmatique

### 3.1 Structure complète

```
Objectif Stratégique (OS)
    └── Mission
        └── Action
            └── Activité
                └── Sous-Activité
                    └── Tâche
```

### 3.2 Formats de code

| Niveau | Format | Exemple | Longueur |
|--------|--------|---------|----------|
| OS | `OS-XX` | `OS-01` | 5 |
| Mission | `MIS-XXX` | `MIS-001` | 7 |
| Action | `ACT-XXXX` | `ACT-0101` | 8 |
| Activité | `ATV-XXXXX` | `ATV-01011` | 9 |
| Sous-Activité | `SAT-XXXXXX` | `SAT-010111` | 10 |
| Tâche | `TCH-XXXXXXX` | `TCH-0101111` | 11 |

### 3.3 Exemple concret

```
OS-01 : Améliorer la qualité des services numériques
├── MIS-001 : Modernisation des infrastructures
│   ├── ACT-0101 : Déploiement fibre optique
│   │   ├── ATV-01011 : Études techniques
│   │   │   ├── SAT-010111 : Cartographie réseau
│   │   │   │   ├── TCH-0101111 : Relevés terrain
│   │   │   │   └── TCH-0101112 : Digitalisation plans
│   │   │   └── SAT-010112 : Analyse besoins
│   │   └── ATV-01012 : Travaux de génie civil
│   └── ACT-0102 : Acquisition équipements
└── MIS-002 : Formation des agents
```

### 3.4 Code budgétaire composé

Les lignes budgétaires utilisent un code composé :

```
DIR-OS-ACT-NBE-SEQ
```

| Segment | Description | Exemple |
|---------|-------------|---------|
| `DIR` | Code direction (2 car.) | `01` |
| `OS` | Code OS (2 car.) | `01` |
| `ACT` | Code action (4 car.) | `0101` |
| `NBE` | Code NBE (3 car.) | `621` |
| `SEQ` | Séquence (3 car.) | `001` |

**Exemple complet** : `01-01-0101-621-001`

---

## 4. Nomenclature NBE

### 4.1 Nature Budgétaire Économique

La NBE classe les dépenses par nature économique :

| Code | Libellé | Type |
|------|---------|------|
| `61` | Services extérieurs | Fonctionnement |
| `62` | Autres services extérieurs | Fonctionnement |
| `63` | Impôts et taxes | Fonctionnement |
| `64` | Charges de personnel | Personnel |
| `65` | Autres charges de gestion | Fonctionnement |
| `66` | Charges financières | Fonctionnement |
| `21` | Immobilisations incorporelles | Investissement |
| `22` | Terrains | Investissement |
| `23` | Bâtiments | Investissement |
| `24` | Matériel | Investissement |

### 4.2 Sous-comptes NBE

```
62 - Autres services extérieurs
├── 621 - Sous-traitance générale
├── 622 - Locations et charges locatives
├── 623 - Entretien, réparations
├── 624 - Primes d'assurance
├── 625 - Déplacements, missions
├── 626 - Frais postaux
├── 627 - Services bancaires
└── 628 - Divers services
```

---

## 5. Plan Comptable SYSCO

### 5.1 Structure SYSCOHADA

| Classe | Libellé |
|--------|---------|
| 1 | Comptes de ressources durables |
| 2 | Comptes d'actif immobilisé |
| 3 | Comptes de stocks |
| 4 | Comptes de tiers |
| 5 | Comptes de trésorerie |
| 6 | Comptes de charges |
| 7 | Comptes de produits |
| 8 | Comptes de résultats |

### 5.2 Correspondance NBE ↔ SYSCO

| NBE | SYSCO | Description |
|-----|-------|-------------|
| 621 | 621xxx | Sous-traitance générale |
| 622 | 622xxx | Locations |
| 641 | 661xxx | Rémunérations personnel |
| 241 | 241xxx | Matériel de transport |
| 244 | 244xxx | Matériel informatique |

---

## 6. Secteurs d'Activité

### 6.1 Liste des secteurs

| Code | Libellé |
|------|---------|
| `TEL` | Télécommunications |
| `NUM` | Numérique |
| `POT` | Postal |
| `RAD` | Radiodiffusion |
| `ADM` | Administration générale |
| `FIN` | Finance et comptabilité |
| `RH` | Ressources humaines |
| `LOG` | Logistique |
| `JUR` | Juridique |

### 6.2 Usage

Les secteurs permettent de :
- Catégoriser les prestataires
- Filtrer les marchés par domaine
- Générer des statistiques sectorielles

---

## 7. Codes Prestataires

### 7.1 Format NCC

Le **Numéro de Compte Contribuable** (NCC) est l'identifiant fiscal :

```
CI-XXXXXXXXX-Y
```

| Segment | Description |
|---------|-------------|
| `CI` | Préfixe pays (Côte d'Ivoire) |
| `XXXXXXXXX` | Numéro à 9 chiffres |
| `Y` | Clé de contrôle |

### 7.2 Code interne prestataire

```
PREST-YYYY-NNNN
```

| Segment | Description | Exemple |
|---------|-------------|---------|
| `PREST` | Préfixe fixe | `PREST` |
| `YYYY` | Année d'enregistrement | `2026` |
| `NNNN` | Séquence annuelle | `0001` |

---

## 8. Codes Documents

### 8.1 Contrats

```
CTR-YYYY-NNNN
```

**Exemple** : `CTR-2026-0015` (15ème contrat de 2026)

### 8.2 Marchés

```
MAR-YYYY-NNNN/TYPE
```

| Type | Description |
|------|-------------|
| `AOO` | Appel d'Offres Ouvert |
| `AOR` | Appel d'Offres Restreint |
| `GRE` | Gré à Gré |
| `DC` | Demande de Cotation |

**Exemple** : `MAR-2026-0003/AOO`

### 8.3 Dossiers

```
DOS-YYYY-MM-NNNN
```

**Exemple** : `DOS-2026-01-0042` (42ème dossier de janvier 2026)

---

## 9. Variables de Codification

### 9.1 Table `codif_variables`

```sql
CREATE TABLE codif_variables (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,        -- Clé variable
  label TEXT NOT NULL,             -- Libellé
  format_type TEXT DEFAULT 'text', -- Type (text, number, date)
  source_table TEXT,               -- Table source si lookup
  source_field TEXT,               -- Champ source
  pad_length INTEGER,              -- Longueur avec padding
  pad_char TEXT DEFAULT '0',       -- Caractère de padding
  pad_side TEXT DEFAULT 'left',    -- Côté padding (left/right)
  transform TEXT,                  -- Transformation (upper, lower)
  default_value TEXT,              -- Valeur par défaut
  est_active BOOLEAN DEFAULT true
);
```

### 9.2 Variables prédéfinies

| Clé | Description | Exemple |
|-----|-------------|---------|
| `{YEAR}` | Année complète | `2026` |
| `{YY}` | Année courte | `26` |
| `{MONTH}` | Mois | `01` |
| `{DAY}` | Jour | `15` |
| `{SEQ}` | Séquence | `0001` |
| `{DIR}` | Code direction | `01` |
| `{OS}` | Code OS | `01` |

### 9.3 Patterns de code

```typescript
// Exemple de pattern
const pattern = "ARTI-{YY}-{DIR}-{SEQ:4}";

// Résultat : "ARTI-26-01-0001"
```

---

## 10. Séquences et Compteurs

### 10.1 Tables de séquences

| Table | Usage |
|-------|-------|
| `reference_counters` | Références pivot par étape/mois/année |
| `budget_code_sequences` | Codes lignes budgétaires par exercice |
| `contrat_sequences` | Numéros de contrats par année |
| `notes_sef_sequences` | Séquences notes SEF (legacy) |

### 10.2 Gestion atomique

```sql
-- Pattern UPSERT pour éviter les doublons
INSERT INTO reference_counters (etape, mm, yy, sequence)
VALUES ($1, $2, $3, 1)
ON CONFLICT (etape, mm, yy)
DO UPDATE SET sequence = reference_counters.sequence + 1
RETURNING sequence;
```

### 10.3 Verrouillage des codes

Après validation, les codes sont **verrouillés** :

```sql
-- Colonne code_locked
ALTER TABLE budget_engagements ADD COLUMN code_locked BOOLEAN DEFAULT false;

-- Trigger de verrouillage
IF NEW.statut = 'valide' THEN
  NEW.code_locked := true;
END IF;
```

---

## 11. Bonnes Pratiques

### 11.1 DO ✅

- Utiliser les fonctions de génération SQL (atomicité garantie)
- Toujours vérifier l'unicité avant insertion
- Verrouiller les codes après validation
- Documenter tout nouveau format de code

### 11.2 DON'T ❌

- Générer des codes côté frontend (risque de doublons)
- Modifier un code après verrouillage
- Utiliser des séquences sans contrainte unique
- Ignorer les formats établis

---

## 12. Ajouter un Nouveau Type de Code

### 12.1 Checklist

1. Définir le format dans ce guide
2. Créer la table de séquences si nécessaire
3. Créer la fonction SQL de génération
4. Ajouter le trigger de génération automatique
5. Ajouter la colonne `code_locked`
6. Documenter les exemples

### 12.2 Template SQL

```sql
-- 1. Table de séquences
CREATE TABLE mon_entite_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercice INTEGER NOT NULL,
  dernier_numero INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (exercice)
);

-- 2. Fonction de génération
CREATE FUNCTION generate_mon_entite_numero(p_exercice INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  INSERT INTO mon_entite_sequences (exercice, dernier_numero)
  VALUES (p_exercice, 1)
  ON CONFLICT (exercice)
  DO UPDATE SET 
    dernier_numero = mon_entite_sequences.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_seq;
  
  RETURN 'MON-' || p_exercice || '-' || LPAD(v_seq::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger
CREATE TRIGGER trigger_generate_mon_entite_numero
  BEFORE INSERT ON mon_entite
  FOR EACH ROW
  WHEN (NEW.numero IS NULL)
  EXECUTE FUNCTION auto_generate_mon_entite_numero();
```

---

*Documentation générée le 2026-01-15*
