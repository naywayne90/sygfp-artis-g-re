# DIAGNOSTIC COMPLET - Module Notes SEF

**Date** : 11 février 2026
**Mode** : Lecture seule (aucune modification effectuée)
**Méthode** : 4 agents spécialisés en parallèle (Frontend, Backend, QA, Audit)

---

## Table des matières

1. [État des variables d'environnement](#1-état-des-variables-denvironnement)
2. [Statistiques des données](#2-statistiques-des-données)
3. [État du lien NSEF ↔ NAEF](#3-état-du-lien-nsef--naef)
4. [État du stockage PJ](#4-état-du-stockage-pj)
5. [Liste des corrections par priorité](#5-liste-des-corrections-par-priorité)

---

## 1. État des variables d'environnement

### Variables frontend (.env)

| Variable                        | Valeur                                     | Statut                 |
| ------------------------------- | ------------------------------------------ | ---------------------- |
| `VITE_SUPABASE_URL`             | `https://tjagvgqthlibdpvztvaf.supabase.co` | ✅ Définie             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...X9H0` (anon key)               | ✅ Définie             |
| `VITE_SUPABASE_PROJECT_ID`      | `tjagvgqthlibdpvztvaf`                     | ✅ Définie             |
| `VITE_STORAGE_PROVIDER`         | Non définie                                | ⚠️ Fallback `supabase` |
| `VITE_LOCAL_STORAGE_URL`        | Non définie                                | ⚠️ Fallback vide       |
| `VITE_LOCAL_STORAGE_API_KEY`    | Non définie                                | ⚠️ Fallback vide       |

### Client Supabase (`src/integrations/supabase/client.ts`)

- ✅ Utilise `import.meta.env.VITE_SUPABASE_URL` (pas de hardcoding)
- ✅ Utilise `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` (pas de hardcoding)
- ✅ Aucun token ou clé secrète dans le code source `src/`

### Problèmes de sécurité tokens

| Fichier                            | Problème                                                                            | Sévérité    |
| ---------------------------------- | ----------------------------------------------------------------------------------- | ----------- |
| `.mcp.json`                        | Contient le `service_role` Supabase en clair                                        | 🔴 CRITIQUE |
| `.mcp.json`                        | Contient un GitHub PAT (`ghp_XXRf21rm...`) en clair                                 | 🔴 CRITIQUE |
| `src/contexts/RBACContext.tsx` L81 | Project ID hardcodé dans la clé localStorage : `sb-tjagvgqthlibdpvztvaf-auth-token` | 🟡 MOYEN    |

**Note** : `.mcp.json` est dans `.gitignore` mais reste un risque si le répertoire est partagé. Recommandation : déplacer vers `~/.mcp.json`.

---

## 2. Statistiques des données

### Volume total

| Exercice  | Nombre de notes | Statut                   |
| --------- | --------------- | ------------------------ |
| 2024      | 1000+           | Migré depuis SQL Server  |
| 2025      | 2+              | Migré depuis SQL Server  |
| 2026      | 93+             | Dont 2 créées nativement |
| **Total** | **~4 836**      | Paginé (limit API)       |

### Formats de référence (3 formats coexistants)

| Format              | Exemple            | Origine              | Quantité                  |
| ------------------- | ------------------ | -------------------- | ------------------------- |
| **ARTI** (14 chars) | `ARTI002260001`    | Nouveau format natif | 2 notes                   |
| **MIG-YYYY-NNNNNN** | `MIG-2026-000001`  | Migration SQL Server | 91+ notes (exercice 2026) |
| **Legacy**          | `0008-2026-DG-001` | Ancien système       | ~4 740 notes (2024-2025)  |

### Anomalies de données détectées

| Anomalie                                           | Détails                                                                | Impact                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| 91 notes avec `reference_pivot = NULL`             | Toutes au format MIG-YYYY                                              | ⚠️ Fonctionnel (recherche pivot impossible) |
| 8 notes sans `direction_id` ET sans `demandeur_id` | Les mêmes 8 notes, format MIG-                                         | 🔴 Orphelines (pas de propriétaire)         |
| Compteur désynchronisé                             | `notes_sef_sequences` indique 1, mais 2 notes ARTI existent            | 🔴 Prochaine référence sera dupliquée       |
| 3 tables de compteurs coexistent                   | `reference_counters`, `notes_sef_sequences`, `arti_reference_counters` | ⚠️ Confusion, maintenance difficile         |

### Système de génération de références

| Élément                                         | État                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| Triggers INSERT sur `notes_sef`                 | ❌ Tous supprimés (migration `20260211_fix_reference_generator.sql`) |
| Triggers UPDATE sur `notes_sef`                 | ❌ Tous supprimés                                                    |
| Fonction RPC `submit_note_sef_with_reference()` | ✅ Active (génère référence à la soumission)                         |
| Table compteur active                           | `arti_reference_counters`                                            |
| Format actif                                    | `ARTI + XX(direction) + MM + YY + NNNN` = 14 caractères              |

**Important** : Les références ne sont plus générées à l'insertion mais à la soumission via RPC. Les notes restent en brouillon sans référence jusqu'à soumission.

---

## 3. État du lien NSEF ↔ NAEF

### Schéma base de données

| Élément                                  | État                | Détails                                                   |
| ---------------------------------------- | ------------------- | --------------------------------------------------------- |
| Table `notes_aef`                        | ❌ **N'EXISTE PAS** | Aucune table physique de ce nom                           |
| Table `notes_dg`                         | ✅ **Existe**       | C'est la vraie table AEF (Notes de la Direction Générale) |
| FK `notes_dg.note_sef_id → notes_sef.id` | ✅ Valide           | Avec index, cascade DELETE                                |
| Index sur `note_sef_id`                  | ✅ Présent          | Performance OK                                            |

### Composants frontend

| Composant          | Fichier                      | État           | Détail                                                      |
| ------------------ | ---------------------------- | -------------- | ----------------------------------------------------------- |
| Bouton "Créer AEF" | `NoteSEFCreateAEFButton.tsx` | ✅ Fonctionnel | Navigue vers `/notes-aef?prefill=<id>`                      |
| Liste AEF liées    | `LinkedNAEFList.tsx` L94     | 🔴 **BUG**     | Requête `.from('notes_sef')` au lieu de `.from('notes_dg')` |
| Hook Notes AEF     | `useNotesAEF.ts`             | ✅ Fonctionnel | Requête correctement `notes_dg`                             |
| Page Notes AEF     | `/notes-aef`                 | ✅ Fonctionnel | CRUD complet sur `notes_dg`                                 |

### Workflow de validation

```
Note SEF (brouillon) → Soumission → Validation
    ↓ (à la validation)
    ├── Statut → "valide"
    ├── Dossier créé automatiquement ✅
    └── Note AEF → NON créée (processus manuel) ✅ C'est voulu
```

### BUG CRITIQUE : `LinkedNAEFList.tsx` ligne 94

```typescript
// ACTUEL (BUG) :
const { data } = await supabase.from('notes_sef').select('*').eq('note_sef_id', noteId);

// DEVRAIT ÊTRE :
const { data } = await supabase.from('notes_dg').select('*').eq('note_sef_id', noteId);
```

**Impact** : Les notes AEF liées à une note SEF ne s'affichent JAMAIS dans le détail d'une note SEF, même quand elles existent dans `notes_dg`.

---

## 4. État du stockage PJ

### Systèmes de stockage (5 systèmes coexistent)

| #   | Système                                | Utilisé par Notes SEF        | État                           |
| --- | -------------------------------------- | ---------------------------- | ------------------------------ |
| 1   | Bucket Supabase `notes-sef`            | ✅ Upload actif              | Fonctionnel                    |
| 2   | Bucket Supabase `notes_sef_pieces`     | ⚠️ Fallback dans le code     | ❌ **N'existe pas**            |
| 3   | Bucket Supabase `sygfp-files`          | ❌ Non                       | Existe (usage générique)       |
| 4   | Cloudflare R2 `lovable-storage/sygfp/` | ❌ Non                       | Configuré, jamais utilisé      |
| 5   | Bucket Supabase `sygfp-attachments`    | ❌ Non (contient PJ migrées) | Existe, contient 27K+ fichiers |

### Tables de métadonnées PJ

| Table                   | Utilisée           | Rows         | Détail                                        |
| ----------------------- | ------------------ | ------------ | --------------------------------------------- |
| `notes_sef_pieces`      | ✅ Active (INSERT) | **0 lignes** | Aucune PJ n'a été attachée via la nouvelle UI |
| `notes_sef_attachments` | ❌ Legacy          | Inconnue     | Jamais utilisée par le code actif             |
| `pieces_jointes`        | ❌ Universelle     | Inconnue     | Pas utilisée par le module SEF                |

### Circuit actuel d'upload (NoteSEFDetail.tsx)

```
Upload fichier
  → Bucket `notes-sef` (primaire)
  → Si erreur → Fallback bucket `notes_sef_pieces` (N'EXISTE PAS → échec silencieux)
  → INSERT dans table `notes_sef_pieces`
```

### Problèmes identifiés

| Problème                   | Sévérité    | Détail                                                                                |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| Fallback bucket inexistant | 🔴 CRITIQUE | `notes_sef_pieces` bucket n'existe pas, si upload primaire échoue → perte silencieuse |
| PJ migrées inaccessibles   | 🔴 CRITIQUE | 27K+ fichiers dans `sygfp-attachments`, code cherche dans `notes-sef`                 |
| Limite 3 PJ non appliquée  | 🟡 MOYEN    | Constante `MAX_ATTACHMENTS_PER_NOTE=3` définie mais pas vérifiée en UI ni en DB       |
| R2 abandonné               | 🟡 MOYEN    | Edge function `r2-storage` déployée, `VITE_STORAGE_PROVIDER` non configuré            |
| 5 systèmes redondants      | 🟡 MOYEN    | Fragmentation, maintenance impossible                                                 |

### Cartographie des PJ migrées

```
SQL Server (E:\Temp\Projet e-ARTI\Fichier\)
  → /tmp/sygfp_fichiers/ (copie locale)
  → Bucket `sygfp-attachments` (upload en cours)
  → PAS de métadonnées dans `notes_sef_pieces`
  → PAS de lien avec le bucket `notes-sef` (code actif)
```

**Conséquence** : Les pièces jointes historiques (27 117 fichiers, 26 Go) sont uploadées dans Supabase Storage mais **inaccessibles** depuis l'interface Notes SEF car le code cherche dans le mauvais bucket.

---

## 5. Liste des corrections par priorité

### 🔴 PRIORITÉ CRITIQUE (à corriger immédiatement)

| #   | Correction                                                                                                | Fichier(s)                                        | Effort |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------ |
| C1  | **LinkedNAEFList** : changer `.from('notes_sef')` → `.from('notes_dg')`                                   | `src/components/notes-sef/LinkedNAEFList.tsx` L94 | 5 min  |
| C2  | **Compteur désynchronisé** : mettre à jour `arti_reference_counters` pour refléter les 2 notes existantes | Migration SQL                                     | 10 min |
| C3  | **Fallback bucket** : créer le bucket `notes_sef_pieces` OU supprimer le fallback du code                 | `NoteSEFDetail.tsx` + Supabase Storage            | 15 min |
| C4  | **8 notes orphelines** : ajouter `direction_id` et `demandeur_id` aux 8 notes MIG- sans propriétaire      | Migration SQL                                     | 20 min |
| C5  | **Tokens .mcp.json** : déplacer vers `~/.mcp.json` hors du dépôt                                          | `.mcp.json` → `~/.mcp.json`                       | 10 min |

### 🟠 PRIORITÉ HAUTE (à corriger cette semaine)

| #   | Correction                                                                                                                           | Fichier(s)                    | Effort |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------ |
| H1  | **PJ migrées** : créer un script de reconciliation qui lie les fichiers de `sygfp-attachments` aux notes SEF dans `notes_sef_pieces` | Script Python + migration SQL | 2h     |
| H2  | **91 notes sans reference_pivot** : peupler `reference_pivot` pour les notes MIG- (extraire depuis `reference`)                      | Migration SQL                 | 30 min |
| H3  | **Nettoyage compteurs** : supprimer `reference_counters` et `notes_sef_sequences` (obsolètes)                                        | Migration SQL                 | 15 min |
| H4  | **Limite 3 PJ** : appliquer la limite en UI (disabled upload si count >= 3) et en DB (trigger/check constraint)                      | Frontend + migration SQL      | 1h     |

### 🟡 PRIORITÉ MOYENNE (à planifier)

| #   | Correction                                                                                                                              | Fichier(s)                         | Effort |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------ |
| M1  | **RBACContext hardcoded** : remplacer `sb-tjagvgqthlibdpvztvaf-auth-token` par template avec `import.meta.env.VITE_SUPABASE_PROJECT_ID` | `src/contexts/RBACContext.tsx` L81 | 10 min |
| M2  | **Unifier stockage** : choisir UN système (Supabase Storage `notes-sef`) et migrer toutes les PJ                                        | Architecture + script              | 4h     |
| M3  | **Supprimer R2 mort** : désactiver/supprimer Edge Function `r2-storage` et config R2 si non utilisé                                     | `supabase/functions/r2-storage/`   | 30 min |
| M4  | **Table notes_sef_attachments** : supprimer si définitivement remplacée par `notes_sef_pieces`                                          | Migration SQL                      | 10 min |
| M5  | **Variables .env manquantes** : ajouter `VITE_STORAGE_PROVIDER=supabase` explicitement                                                  | `.env` + `.env.example`            | 5 min  |

### 🟢 PRIORITÉ BASSE (améliorations)

| #   | Correction                                                                                                | Fichier(s)                    | Effort |
| --- | --------------------------------------------------------------------------------------------------------- | ----------------------------- | ------ |
| B1  | **Format référence uniforme** : script batch pour normaliser les références legacy en ajoutant un mapping | Migration SQL + documentation | 2h     |
| B2  | **Documentation tables** : documenter que `notes_dg` = table AEF (le nom prête à confusion)               | `docs/`                       | 30 min |
| B3  | **Monitoring** : ajouter alertes sur les uploads PJ échoués (actuellement silencieux)                     | Frontend logging              | 1h     |

---

## Récapitulatif

| Catégorie       | Trouvailles                                         | Critiques              |
| --------------- | --------------------------------------------------- | ---------------------- |
| Variables .env  | 3/6 définies, 3 avec fallback                       | 0                      |
| Tokens/sécurité | 2 tokens hardcodés dans .mcp.json                   | 2                      |
| Données         | 3 formats de ref, 8 orphelines, compteur désync     | 3                      |
| Lien NSEF↔NAEF  | 1 BUG (mauvaise table), workflow OK                 | 1                      |
| Stockage PJ     | 5 systèmes, fallback mort, PJ migrées inaccessibles | 2                      |
| **TOTAL**       | **17 corrections identifiées**                      | **8 critiques/hautes** |

### Score diagnostic : 45/100

| Critère                | Score      | Max | Commentaire                                  |
| ---------------------- | ---------- | --- | -------------------------------------------- |
| Intégrité des données  | 6/15       | 15  | 8 orphelines, 91 sans pivot, compteur désync |
| Sécurité tokens        | 5/15       | 15  | .mcp.json critique, code source OK           |
| Lien NSEF↔NAEF         | 5/20       | 20  | BUG bloquant (mauvaise table), schema OK     |
| Stockage PJ            | 4/20       | 20  | 5 systèmes, fallback mort, PJ inaccessibles  |
| Configuration .env     | 12/15      | 15  | 3/6 définies, fallbacks fonctionnels         |
| Cohérence architecture | 13/15      | 15  | RPC OK, workflow OK, nomenclature confuse    |
| **TOTAL**              | **45/100** | 100 |                                              |

---

_Diagnostic généré par 4 agents spécialisés le 11 février 2026. Aucune modification n'a été effectuée._
