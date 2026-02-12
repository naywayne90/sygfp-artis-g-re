# Diagnostic des Références Notes SEF

**Date** : 11 février 2026
**Module** : Notes SEF (Sans Effet Financier) - SYGFP ARTI Côte d'Ivoire
**Type** : Diagnostic lecture seule (aucune modification effectuée)

---

## Table des matières

1. [Synthèse exécutive](#1-synthèse-exécutive)
2. [Analyse du générateur de références](#2-analyse-du-générateur-de-références)
3. [Statistiques des formats en base](#3-statistiques-des-formats-en-base)
4. [État du lien NSEF - NAEF](#4-état-du-lien-nsef--naef)
5. [Anomalies détectées](#5-anomalies-détectées)
6. [Recommandations](#6-recommandations)
7. [Plan de correction](#7-plan-de-correction)

---

## 1. Synthèse exécutive

### Format officiel

```
ARTI + ÉTAPE(1 chiffre) + MM(2) + YY(2) + NNNN(4) = 13 caractères
```

| Segment | Longueur | Description                                  | Exemple |
| ------- | -------- | -------------------------------------------- | ------- |
| `ARTI`  | 4        | Préfixe organisme                            | `ARTI`  |
| Étape   | 1        | Code étape chaîne de dépense (0=SEF)         | `0`     |
| MM      | 2        | Mois de création (01-12)                     | `01`    |
| YY      | 2        | Année de création (mod 100)                  | `26`    |
| NNNN    | 4        | Compteur séquentiel par (étape, mois, année) | `0001`  |

**Exemple** : `ARTI001260001` = SEF (0) + janvier (01) + 2026 (26) + 1er document (0001)

### Constat

| Format              | Nombre     | %        | Provenance                |
| ------------------- | ---------- | -------- | ------------------------- |
| `MIG-YYYY-NNNNNN`   | ~4 831     | 99.7%    | Migration SQL Server      |
| `NNNN-YYYY-DIR-XXX` | 9          | 0.2%     | Tests dev (ancien format) |
| `ARTI*` (conforme)  | 5          | 0.1%     | Générateur actif          |
| **Total**           | **~4 845** | **100%** |                           |

**Verdict** : Le générateur actif fonctionne correctement. Les 5 notes au format ARTI sont conformes. Les ~4 831 notes MIG-\* sont des données migrées qui conservent leur référence d'import. Les 9 notes au format ancien sont des données de test/dev.

---

## 2. Analyse du générateur de références

### 2.1 Deux systèmes coexistants

Deux fonctions SQL génèrent des références. Elles produisent un format **identique** mais utilisent des tables de compteurs différentes.

#### Système original (migration `20260115171635`)

| Élément         | Valeur                                     |
| --------------- | ------------------------------------------ |
| Fonction        | `generate_arti_reference(p_etape, p_date)` |
| Table compteurs | `arti_reference_counters`                  |
| Trigger         | `trg_notes_sef_set_arti_reference`         |
| Fichier         | `supabase/migrations/20260115171635_*.sql` |

```sql
-- Fonction originale (ligne 41-78)
CREATE OR REPLACE FUNCTION public.generate_arti_reference(
  p_etape INTEGER, p_date TIMESTAMPTZ DEFAULT now()
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_mois INTEGER; v_annee INTEGER;
  v_annee_court TEXT; v_mois_text TEXT;
  v_counter INTEGER; v_reference TEXT;
BEGIN
  v_mois := EXTRACT(MONTH FROM p_date)::INTEGER;
  v_annee := EXTRACT(YEAR FROM p_date)::INTEGER;
  v_annee_court := LPAD((v_annee % 100)::TEXT, 2, '0');
  v_mois_text := LPAD(v_mois::TEXT, 2, '0');

  INSERT INTO arti_reference_counters (etape, mois, annee, dernier_numero, updated_at)
  VALUES (p_etape, v_mois, v_annee, 1, now())
  ON CONFLICT (etape, mois, annee) DO UPDATE SET
    dernier_numero = arti_reference_counters.dernier_numero + 1,
    updated_at = now()
  RETURNING dernier_numero INTO v_counter;

  v_reference := 'ARTI' || p_etape::TEXT || v_mois_text
                 || v_annee_court || LPAD(v_counter::TEXT, 4, '0');
  RETURN v_reference;
END; $$;
```

#### Système unifié (migration `20260129162400`)

| Élément         | Valeur                                                            |
| --------------- | ----------------------------------------------------------------- |
| Fonction        | `generate_unified_reference(p_etape, p_date)`                     |
| Table compteurs | `unified_reference_counters`                                      |
| Trigger         | `trg_unified_ref_notes_sef`                                       |
| Fichier         | `supabase/migrations/20260129162400_unified_reference_format.sql` |

```sql
-- Fonction unifiée (identique sauf table compteurs)
INSERT INTO unified_reference_counters (etape, mois, annee, dernier_numero, updated_at)
VALUES (p_etape, v_mois, v_annee, 1, now())
ON CONFLICT (etape, mois, annee) DO UPDATE SET
  dernier_numero = unified_reference_counters.dernier_numero + 1, ...
```

### 2.2 Trigger actif sur `notes_sef`

La migration `20260129` crée le trigger `trg_unified_ref_notes_sef` qui **remplace** (via `DROP TRIGGER IF EXISTS`) le trigger original. Le trigger actif est donc le **unifié**.

```sql
-- Migration 20260129, ligne 221-246
CREATE OR REPLACE FUNCTION public.trg_unified_ref_notes_sef()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := generate_reference_sef(COALESCE(NEW.created_at, now()));
    NEW.reference_pivot := NEW.numero;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_unified_ref_notes_sef ON public.notes_sef;
CREATE TRIGGER trg_unified_ref_notes_sef
  BEFORE INSERT ON notes_sef FOR EACH ROW
  EXECUTE FUNCTION trg_unified_ref_notes_sef();
```

**Point critique** : `generate_reference_sef()` appelle `generate_unified_reference(0, p_date)` qui utilise `unified_reference_counters`. Or cette table **n'existe pas** dans le cache schéma Supabase (erreur PGRST205 : "Could not find the table 'unified_reference_counters'").

### 2.3 Problème de déploiement

| Table                        | Existe en DB ?          | Données                                                    |
| ---------------------------- | ----------------------- | ---------------------------------------------------------- |
| `arti_reference_counters`    | Oui                     | 1 entrée : `etape=0, mois=1, annee=2026, dernier_numero=3` |
| `unified_reference_counters` | **Non trouvée via API** | N/A                                                        |

**Scénario probable** : La migration `20260129` n'a pas été entièrement déployée, ou le trigger a été remplacé par un autre mécanisme. Le trigger actif en production utilise probablement encore `generate_arti_reference()` puisque :

- Les 5 notes ARTI existent et sont correctes
- Le compteur `arti_reference_counters` est à 3 (cohérent avec les 3 notes ARTI001260001/002/003)
- 2 notes ARTI avec étape=0 mois=02 (février) n'ont pas d'entrée compteur correspondante (possible compteur non incrémenté ou généré manuellement)

### 2.4 Frontend : `referenceService.ts`

Le frontend appelle `supabase.rpc("generate_arti_reference", { p_etape, p_date })` (fonction **originale**).

```typescript
// src/lib/notes-sef/referenceService.ts, ligne 64-79
export async function generateARTIReference(etapeCode: number, date?: Date): Promise<string> {
  const { data, error } = await supabase.rpc('generate_arti_reference', {
    p_etape: etapeCode,
    p_date: date?.toISOString() || new Date().toISOString(),
  });
  if (error) throw new Error(`Impossible de générer la référence: ${error.message}`);
  return data as string;
}
```

Le parser (`parseARTIReferenceLocal`) valide le format `/^ARTI[0-9]{9}$/` (13 caractères) et découpe :

- `substring(4,5)` = étape (1 chiffre)
- `substring(5,7)` = mois (2 chiffres)
- `substring(7,9)` = année (2 chiffres)
- `substring(9,13)` = numéro (4 chiffres)

### 2.5 Divergence mapping des étapes

| Étape | Frontend (`referenceService.ts`) | Migration unifiée (`20260129`) |
| ----- | -------------------------------- | ------------------------------ |
| 0     | SEF                              | SEF                            |
| 1     | **AEF**                          | **Engagement**                 |
| 2     | **Imputation**                   | **Liquidation**                |
| 3     | Expression de besoin             | Ordonnancement                 |
| 4     | Passation de marché              | Règlement                      |
| 5     | Engagement                       | **AEF**                        |
| 6     | Liquidation                      | **Imputation**                 |
| 7     | Ordonnancement                   | _(non défini)_                 |
| 8     | Règlement                        | _(non défini)_                 |

**Impact** : L'étape 0 (SEF) est identique partout, donc les notes SEF ne sont **pas affectées**. Mais les autres entités (engagements, liquidations, etc.) auront des codes étape incohérents entre frontend et backend si les deux systèmes sont utilisés simultanément.

### 2.6 Bug dans `constants.ts`

Le fichier `src/lib/notes-sef/constants.ts` (ligne 228-260) documente un format **différent** et **incorrect** :

```typescript
// constants.ts - Format documenté (FAUX)
// Format: ARTI01YYNNNN (12 caractères)
// Regex: /^(ARTI)(01)(\d{2})(\d{4})$/
REFERENCE_PREFIX: 'ARTI',
MODULE_CODE: '01',
```

```typescript
// constants.ts - Fonction parseReferencePivot (FAUX)
export function parseReferencePivot(ref: string) {
  const match = ref.match(/^(ARTI)(01)(\d{2})(\d{4})$/); // 12 chars, ne matche PAS "ARTI001260001"
  ...
}
```

Cette fonction :

- Attend 12 caractères (`ARTI` + `01` + `YY` + `NNNN`) au lieu de 13
- Utilise `01` fixe comme code module au lieu du code étape variable
- **Ne matchera jamais** une référence réelle comme `ARTI001260001` (13 chars)

**Impact** : `parseReferencePivot()` est morte (jamais appelée avec succès). Heureusement `referenceService.ts` a son propre parser (`parseARTIReferenceLocal`) qui est correct.

---

## 3. Statistiques des formats en base

### 3.1 Notes au format ARTI (conforme)

| Numéro          | Étape   | Mois | Année | Seq  | Exercice | Statut | Créée le   |
| --------------- | ------- | ---- | ----- | ---- | -------- | ------ | ---------- |
| `ARTI001260001` | 0 (SEF) | 01   | 26    | 0001 | 2026     | valide | 2026-01-17 |
| `ARTI001260002` | 0 (SEF) | 01   | 26    | 0002 | 2026     | valide | 2026-01-22 |
| `ARTI001260003` | 0 (SEF) | 01   | 26    | 0003 | 2026     | valide | 2026-01-22 |
| `ARTI002260001` | 0 (SEF) | 02   | 26    | 0001 | 2026     | soumis | 2026-02-02 |
| `ARTI002260002` | 0 (SEF) | 02   | 26    | 0002 | 2026     | soumis | 2026-02-10 |

- `numero` = `reference_pivot` (identiques pour les 5)
- Compteur `arti_reference_counters` : `etape=0, mois=1, annee=2026, dernier_numero=3` (cohérent avec les 3 notes de janvier)
- Pas d'entrée compteur pour février (les 2 notes de février n'ont pas encore incrémenté ou le compteur est en mémoire)

### 3.2 Notes au format ancien (test/dev)

| Numéro              | reference_pivot         | Statut    |
| ------------------- | ----------------------- | --------- |
| `0002-2026-DG-BDK`  | `0002-2026-DG-BDK`      | soumis    |
| `0003-2026-DSI-KAM` | `0003-2026-DSI-KAM`     | valide    |
| `0004-2026-DG-XXX`  | `0004-2026-DG-XXX`      | soumis    |
| `0005-2026-DG-XXX`  | `0005-2026-DG-XXX`      | brouillon |
| `0006-2026-DG-XXX`  | `0006-2026-DG-XXX`      | soumis    |
| `0007-2026-DG-XXX`  | `0007-2026-DG-XXX`      | soumis    |
| `0008-2026-DG-XXX`  | `0008-2026-DG-XXX`      | soumis    |
| `0009-2026-DG-XXX`  | **`ARTI001260001-DGX`** | valide    |
| `0010-2026-DSI-XXX` | **`ARTI001260002-NOA`** | valide    |

**Anomalies** :

- 9 notes avec l'ancien format `NNNN-YYYY-DIR-XXX` (données de test, avant le trigger ARTI)
- 2 notes (`0009` et `0010`) ont un `reference_pivot` hybride : format ARTI avec suffixe (`-DGX`, `-NOA`). Ces suffixes ne sont pas standard et cassent le parser.
- Le `numero` est resté à l'ancien format tandis que `reference_pivot` a été partiellement mis à jour

### 3.3 Notes migrées (MIG-\*)

| Métrique           | Valeur                                    |
| ------------------ | ----------------------------------------- |
| Total notes MIG-\* | ~4 831                                    |
| Format             | `MIG-YYYY-NNNNNN` (ex: `MIG-2026-692584`) |
| Statut             | Toutes `valide`                           |
| Direction null     | 8 notes                                   |
| Demandeur null     | 8 notes (les mêmes 8)                     |

Les 8 notes MIG avec `direction_id=null` ET `demandeur_id=null` :

| Numéro            |
| ----------------- |
| `MIG-2025-692491` |
| `MIG-2025-692492` |
| `MIG-2026-692580` |
| `MIG-2026-692581` |
| `MIG-2026-692582` |
| `MIG-2026-692583` |
| `MIG-2026-692584` |
| `MIG-2026-692585` |

### 3.4 Clarification format "SEF-02/26-0002"

Le format `SEF-02/26-0002` mentionné dans le constat initial **n'existe pas en base**. C'est le format d'affichage produit par `formatARTIReferenceShort()` dans le frontend :

```typescript
// referenceService.ts, ligne 130-140
export function formatARTIReferenceShort(reference: string): string {
  // ARTI002260002 → SEF-02/26-0002
  const etapeAbbrev = ['SEF', 'AEF', 'IMP', 'EB', 'PM', 'ENG', 'LIQ', 'ORD', 'REG'][parsed.etape];
  return `${etapeAbbrev}-${moisStr}/${anneeStr}-${numeroStr}`;
}
```

La valeur **stockée** en base est bien `ARTI002260002`. L'affichage `SEF-02/26-0002` est un format lisible calculé à la volée.

---

## 4. État du lien NSEF - NAEF

### 4.1 Structure du lien

```
notes_dg (Notes AEF)
  ├── note_sef_id  → FK → notes_sef.id
  ├── numero       → Référence propre de la NAEF
  └── reference_pivot → Référence ARTI de la NAEF
```

La relation est **NAEF → NSEF** (une NAEF pointe vers une NSEF). Il n'y a pas de colonne `note_aef_id` dans `notes_sef`.

### 4.2 Données liées

| NAEF             | NAEF reference_pivot | NSEF liée      | NSEF numero         |
| ---------------- | -------------------- | -------------- | ------------------- |
| `NOTE-2026-0001` | `ARTI001260001`      | `814db894-...` | `ARTI001260001`     |
| `NOTE-2026-0002` | `ARTI001260002-NOA`  | `d0f99c9d-...` | `0010-2026-DSI-XXX` |
| `NOTE-2025-0004` | `ARTI001260003`      | `97c91305-...` | `ARTI001260003`     |

**Observations** :

- 3 notes AEF sont liées à des notes SEF
- `NOTE-2026-0002` pointe vers une NSEF avec ancien format (`0010-2026-DSI-XXX`) et a un `reference_pivot` hybride (`ARTI001260002-NOA`)
- Les 2 autres liens sont propres (NAEF et NSEF ont des références ARTI conformes)

### 4.3 Interface utilisateur

- `NSEFParentSelector.tsx` : Composant permettant de sélectionner une NSEF parent lors de la création d'une NAEF
- `NoteAEFDetail.tsx` : Affiche la NSEF liée dans le détail d'une NAEF
- `notesAefService.ts` : Joint la relation `notes_sef` lors des requêtes NAEF

---

## 5. Anomalies détectées

### Anomalie 1 : Table `unified_reference_counters` manquante (CRITIQUE)

**Description** : Le trigger actif `trg_unified_ref_notes_sef` appelle `generate_reference_sef()` → `generate_unified_reference()` qui fait INSERT dans `unified_reference_counters`. Mais cette table n'est pas accessible via l'API PostgREST.

**Impact** : Si le trigger unifié est réellement actif, toute création de note SEF sans `numero` pré-rempli échouera avec une erreur SQL. En pratique, les 5 notes ARTI existent, donc soit :

- Le trigger original est encore actif (la migration unifiée n'a pas été exécutée en production)
- La table existe mais n'est pas exposée via PostgREST (possible si manque de GRANT)

**Priorité** : CRITIQUE - à vérifier en accès direct PostgreSQL (`\dt unified_reference_counters`)

### Anomalie 2 : Compteur février absent (MOYENNE)

**Description** : 2 notes ARTI de février 2026 existent (`ARTI002260001`, `ARTI002260002`) mais aucune entrée compteur dans `arti_reference_counters` pour `(etape=0, mois=2, annee=2026)`.

**Impact** : Si le compteur n'est pas en mémoire, la prochaine création en février pourrait générer `ARTI002260001` (doublon). Cela renforcerait l'hypothèse que les notes de février ont été générées par le système unifié (utilisant `unified_reference_counters`).

**Priorité** : MOYENNE - collision possible lors de la prochaine création en février

### Anomalie 3 : Divergence mapping étapes frontend/backend (MOYENNE)

**Description** : Le frontend (`referenceService.ts`) et la migration unifiée (`20260129`) utilisent des mappings différents pour les étapes 1-8. L'étape 0 (SEF) est identique.

**Impact** : Pas d'impact pour les Notes SEF. Impact potentiel pour les engagements, liquidations, etc. si les deux systèmes sont utilisés simultanément.

**Priorité** : MOYENNE - aucun impact SEF, impact potentiel sur les autres entités

### Anomalie 4 : `parseReferencePivot()` dans `constants.ts` inutilisable (FAIBLE)

**Description** : La regex `/^(ARTI)(01)(\d{2})(\d{4})$/` attend 12 caractères avec code module fixe "01", alors que les vraies références font 13 caractères avec code étape variable.

**Impact** : Faible. La fonction n'est probablement pas appelée (code mort). Le parser actif est `parseARTIReferenceLocal()` dans `referenceService.ts` qui est correct.

**Priorité** : FAIBLE - code mort, pas d'impact fonctionnel

### Anomalie 5 : 2 `reference_pivot` hybrides (FAIBLE)

**Description** : Les notes `0009-2026-DG-XXX` et `0010-2026-DSI-XXX` ont des `reference_pivot` au format `ARTI001260001-DGX` et `ARTI001260002-NOA`. Le suffixe `-DGX`/`-NOA` casse le parser standard.

**Impact** : Le parser retourne `isValid: false` pour ces références, donc elles s'affichent telles quelles sans formatage. Données de test, pas de données de production affectées.

**Priorité** : FAIBLE - données de test uniquement

### Anomalie 6 : 8 notes MIG sans direction ni demandeur (FAIBLE)

**Description** : 8 notes migrées (`MIG-2025-692491`, `MIG-2025-692492`, `MIG-2026-692580` à `692585`) ont `direction_id=null` ET `demandeur_id=null`.

**Impact** : Ces notes ne sont rattachées à aucune direction. Elles pourraient être des données orphelines de la migration SQL Server (notes sans direction dans le système source).

**Priorité** : FAIBLE - données historiques, n'affecte pas le flux actif

---

## 6. Recommandations

### Faut-il migrer les anciennes références ?

**NON.** Les références MIG-\* doivent rester en l'état pour les raisons suivantes :

1. **Préservation historique** : Les ~4 831 notes MIG-\* sont des données migrées de l'ancien système SQL Server. Leur numéro fait partie de l'historique documentaire.
2. **Traçabilité** : Le préfixe `MIG-` permet d'identifier immédiatement les données migrées vs. les données natives SYGFP.
3. **Risque de doublon** : Une migration de masse nécessiterait de réattribuer des numéros ARTI et de mettre à jour tous les liens NAEF, engagements, etc. Le risque de collision ou de lien cassé est élevé.
4. **Le trigger les préserve** : Le trigger actif vérifie `IF NEW.numero IS NULL OR NEW.numero = ''` avant de générer une référence. Les notes MIG-\* insérées avec un `numero` non-null conservent leur référence d'origine.

### Que faire des 9 notes au format ancien ?

**Cas par cas** :

- Les 7 notes avec `XXX` dans le nom sont des données de test. Si l'environnement le permet, elles peuvent être supprimées ou marquées comme telles.
- Les 2 notes avec `reference_pivot` hybride (`ARTI...-DGX`, `ARTI...-NOA`) devraient avoir leur `reference_pivot` corrigé au format standard (retirer le suffixe).

---

## 7. Plan de correction

### Phase 1 : Diagnostic DB direct (priorité CRITIQUE)

Vérifier en accès direct PostgreSQL (pas via PostgREST) :

```sql
-- 1. La table unified_reference_counters existe-t-elle ?
SELECT * FROM information_schema.tables
WHERE table_name = 'unified_reference_counters';

-- 2. Quel trigger est actif sur notes_sef ?
SELECT tgname, tgtype, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'notes_sef'::regclass
AND NOT t.tgisinternal;

-- 3. État des compteurs unifiés (si la table existe)
SELECT * FROM unified_reference_counters ORDER BY annee DESC, mois DESC;
```

### Phase 2 : Stabiliser le système de compteurs

**Si `unified_reference_counters` n'existe pas** :

1. Créer la table ou s'assurer que le trigger utilise `arti_reference_counters`
2. Ajouter l'entrée compteur manquante pour février 2026 :
   ```sql
   INSERT INTO arti_reference_counters (etape, mois, annee, dernier_numero)
   VALUES (0, 2, 2026, 2)
   ON CONFLICT (etape, mois, annee) DO UPDATE
   SET dernier_numero = GREATEST(arti_reference_counters.dernier_numero, 2);
   ```

**Si `unified_reference_counters` existe** :

1. Vérifier que son compteur février est à 2
2. Choisir un seul système (original ou unifié) et retirer l'autre
3. Mettre à jour le frontend pour appeler la bonne RPC

### Phase 3 : Unifier le mapping des étapes

Aligner le mapping frontend et backend sur une seule convention :

| Étape | Code | Description          |
| ----- | ---- | -------------------- |
| 0     | SEF  | Note SEF             |
| 1     | AEF  | Note AEF             |
| 2     | IMP  | Imputation           |
| 3     | EB   | Expression de besoin |
| 4     | PM   | Passation de marché  |
| 5     | ENG  | Engagement           |
| 6     | LIQ  | Liquidation          |
| 7     | ORD  | Ordonnancement       |
| 8     | REG  | Règlement            |

Fichiers à modifier :

- `supabase/migrations/` : Nouveau fichier pour mettre à jour les wrappers de la migration unifiée
- `src/lib/notes-sef/referenceService.ts` : Déjà conforme au mapping ci-dessus

### Phase 4 : Nettoyer les données de test

```sql
-- Corriger les 2 reference_pivot hybrides
UPDATE notes_sef SET reference_pivot = 'ARTI001260001'
WHERE numero = '0009-2026-DG-XXX' AND reference_pivot = 'ARTI001260001-DGX';

UPDATE notes_sef SET reference_pivot = 'ARTI001260002'
WHERE numero = '0010-2026-DSI-XXX' AND reference_pivot = 'ARTI001260002-NOA';

-- Optionnel : supprimer les notes de test (après validation fonctionnelle)
-- DELETE FROM notes_sef WHERE numero LIKE '00__-2026-%-XXX';
```

### Phase 5 : Supprimer le code mort

- Retirer `parseReferencePivot()` de `constants.ts` (lignes 248-269)
- Retirer la documentation erronée du format `ARTI01YYNNNN` (lignes 228-242)
- Ou les mettre à jour pour refléter le format réel `ARTI + ÉTAPE(1) + MM(2) + YY(2) + NNNN(4)`

---

## Annexe A : Fichiers source analysés

| Fichier                                    | Rôle                                                    |
| ------------------------------------------ | ------------------------------------------------------- |
| `src/lib/notes-sef/referenceService.ts`    | Frontend : génération, parsing, formatage               |
| `src/lib/notes-sef/constants.ts`           | Frontend : constantes, parser obsolète                  |
| `supabase/migrations/20260115171635_*.sql` | Backend : système original (`generate_arti_reference`)  |
| `supabase/migrations/20260129162400_*.sql` | Backend : système unifié (`generate_unified_reference`) |

## Annexe B : Requêtes PostgREST utilisées

```
GET /notes_sef?select=numero&numero=like.ARTI*
GET /notes_sef?select=numero&numero=not.like.MIG*&numero=not.like.ARTI*
GET /notes_sef?select=numero,direction_id,demandeur_id&numero=like.MIG*&direction_id=is.null
GET /arti_reference_counters?select=*
GET /notes_dg?select=id,numero,reference_pivot,note_sef_id,notes_sef(numero)&note_sef_id=not.is.null
GET /unified_reference_counters?select=* → PGRST205 (table non trouvée)
```
