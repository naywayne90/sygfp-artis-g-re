# Diagnostic Approfondi Module Passation/Marche -- SYGFP

**Date** : 18 fevrier 2026
**Auditeur** : Claude Code
**Organisation** : ARTI -- Autorite de Regulation du Transport Interieur (Cote d'Ivoire)
**Systeme** : SYGFP -- Systeme de Gestion Financiere et de Planification
**Module** : Passation de Marche (Etape 5/9 -- Chaine de depense)
**Type** : DIAGNOSTIC APPROFONDI -- LECTURE SEULE

---

## Resume executif

Le module Passation/Marche souffre de **7 problemes structurels majeurs** qui le rendent non conforme au Code des Marches Publics de Cote d'Ivoire et non fonctionnel en production. Ce diagnostic detaille chaque point avec les references exactes dans le code source.

| Point d'investigation                     | Verdict                                        |
| ----------------------------------------- | ---------------------------------------------- |
| 1. Conformite Code des Marches Publics CI | **NON CONFORME**                               |
| 2. Seuils de procedure                    | **PARTIELLEMENT CODES** -- valeurs incorrectes |
| 3. Workflow de statuts                    | **INCOMPLET** -- 3 workflows contradictoires   |
| 4. Systeme de lots                        | **EXISTE MAIS NON FONCTIONNEL**                |
| 5. Soumissionnaires et evaluation COJO    | **NON IMPLEMENTE**                             |
| 6. Lien FK avec expression_besoin         | **EXISTE MAIS 0 DONNEES**                      |
| 7. Coherence des 16 marches existants     | **INCOHERENTS**                                |

---

## 1. Conformite Code des Marches Publics CI

### 1.1 Verdict : NON CONFORME

**Aucune reference au Code des Marches Publics** de Cote d'Ivoire n'existe dans le code source ni dans la documentation. Recherche exhaustive sur les termes "decret", "loi", "ordonnance", "code des marches" : **0 resultat pertinent** dans les 23 fichiers du module.

### 1.2 Procedures existantes vs Code CI

Le Code des Marches Publics CI (Ordonnance n2019-679 du 24 juillet 2019) definit les procedures suivantes :

| Procedure CI officielle        | Code CI              | Implementation SYGFP            | Conformite                                       |
| ------------------------------ | -------------------- | ------------------------------- | ------------------------------------------------ |
| Appel d'offres ouvert (AOO)    | Art. 25-27           | `appel_offres_ouvert`           | Partielle -- pas de workflow publication/cloture |
| Appel d'offres restreint (AOR) | Art. 28-30           | `appel_offres_restreint`        | Partielle -- pas de pre-qualification            |
| Consultation restreinte        | Art. 31-33           | `consultation`                  | Partielle -- min 3 offres documente              |
| Gre a gre                      | Art. 34-36           | `gre_a_gre`                     | OK -- justification obligatoire codee            |
| Entente directe                | Art. 37-39           | `entente_directe`               | Partielle -- autorisation DCMP dans checklist    |
| Demande de cotation            | Reglementation infra | `demande_cotation` (useMarches) | Existe mais pas dans PassationMarcheForm         |
| Marche simplifie               | Specifique ARTI      | absent du code                  | Documente dans TRANSITION mais pas code          |

### 1.3 Ce qui manque pour la conformite

**P0 -- CRITIQUE**

1. **Aucun seuil reglementaire CI** n'est code (voir section 2)
2. **Pas de COJO** (Commission d'Ouverture et de Jugement des Offres) -- voir section 5
3. **Pas d'Autorite de Regulation des Marches Publics (ANRMP)** dans le workflow
4. **Pas de controle a priori de la DCMP** sauf pour entente directe (document checklist seulement)
5. **Pas de seuil d'admissibilite technique** (70/100 minimum selon spec TRANSITION)

**P1 -- IMPORTANT**

6. Pas de workflow de publication de l'avis d'appel d'offres
7. Pas de delai de soumission reglementaire (30-45 jours pour AOO)
8. Pas de notification formelle au prestataire retenu
9. Pas de procedure d'infructuosite / sans suite
10. Pas de recours (contestation de l'attribution)

### 1.4 References fichiers

| Fichier                                                        | Contenu                       | Probleme                                             |
| -------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------- |
| `src/hooks/usePassationsMarche.ts:80-86`                       | `MODES_PASSATION` (5 valeurs) | Pas de `demande_cotation` ni `marche_simplifie`      |
| `src/hooks/useMarches.ts:103-109`                              | `TYPES_PROCEDURE` (5 valeurs) | Inclut `demande_cotation` mais pas `entente_directe` |
| `src/components/passation-marche/PassationChecklist.tsx:22-52` | `DOCUMENTS_PAR_MODE`          | Bien structure par mode mais upload simule           |
| `docs/TRANSITION_VERS_PASSATION.md:138-211`                    | 5 procedures detaillees       | Spec OK mais non implementee                         |

---

## 2. Seuils de procedure

### 2.1 Verdict : PARTIELLEMENT CODES -- VALEURS INCORRECTES

**TROIS seuils differents** sont codes dans le systeme, mais **AUCUN ne correspond aux seuils officiels CI** :

### 2.2 Seuils codes dans SYGFP

| Seuil                       | Valeur          | Fichier:Ligne                                                     | Utilisation                        |
| --------------------------- | --------------- | ----------------------------------------------------------------- | ---------------------------------- |
| **Seuil passation**         | 5 000 000 FCFA  | `src/types/spending-case.ts:227`                                  | Passation requise si montant >= 5M |
| **Seuil passation**         | 5 000 000 FCFA  | `src/lib/workflow/workflowEngine.ts:130`                          | `seuilDG: 5000000` sur step 5      |
| **Seuil skip passation**    | 5 000 000 FCFA  | `src/hooks/useSpendingCase.ts:303`                                | Skip to engagement si < 5M         |
| **Seuil DG engagement**     | 50 000 000 FCFA | `src/lib/workflow/workflowEngine.ts:145`                          | Validation DG si >= 50M            |
| **Seuil DG liquidation**    | 50 000 000 FCFA | `src/lib/workflow/workflowEngine.ts:160`                          | Validation DG si >= 50M            |
| **Seuil DG ordonnancement** | 50 000 000 FCFA | `src/lib/workflow/workflowEngine.ts:175`                          | Validation DG si >= 50M            |
| **Seuil DG ordo composant** | 50 000 000 FCFA | `src/components/ordonnancement/ValidationDgOrdonnancement.tsx:69` | `SEUIL_VALIDATION_DG`              |

### 2.3 Seuils manquants (Code CI)

Le Code des Marches Publics CI definit des seuils par TYPE de procedure qui **ne sont pas du tout codes** :

| Seuil CI officiel             | Procedure requise                   | Implementation SYGFP              |
| ----------------------------- | ----------------------------------- | --------------------------------- |
| < 5 000 000 FCFA              | Bon de commande / Marche simplifie  | `canSkip: true` -- skip passation |
| 5M - 30M FCFA (fournitures)   | Demande de cotation ou consultation | **NON CODE**                      |
| 5M - 65M FCFA (travaux)       | Demande de cotation ou consultation | **NON CODE**                      |
| 30M - 100M FCFA (fournitures) | Appel d'offres restreint            | **NON CODE**                      |
| 65M - 300M FCFA (travaux)     | Appel d'offres restreint            | **NON CODE**                      |
| > 100M FCFA (fournitures)     | Appel d'offres ouvert obligatoire   | **NON CODE**                      |
| > 300M FCFA (travaux)         | Appel d'offres ouvert obligatoire   | **NON CODE**                      |

### 2.4 Problemes critiques

**P0-SEUIL-1** : Le systeme ne propose PAS automatiquement le mode de passation en fonction du montant. L'utilisateur choisit librement le mode, sans controle. Un marche de 78M FCFA peut etre en gre a gre sans blocage.

**P0-SEUIL-2** : Les seuils sont hardcodes dans 4 fichiers differents au lieu d'une source unique configurable.

**P0-SEUIL-3** : Le seuil par type de marche (fournitures vs travaux vs services) n'existe pas. Un seul seuil de 5M est applique quel que soit le type.

**P1-SEUIL-4** : Le champ `passation_marche.seuil_montant` existe dans la table (`src/hooks/usePassationsMarche.ts:23`) mais n'est jamais renseigne ni utilise.

---

## 3. Workflow de statuts

### 3.1 Verdict : INCOMPLET -- 3 WORKFLOWS CONTRADICTOIRES

**TROIS systemes de workflow coexistent** sans coherence :

### 3.2 Workflow A : Module `marches/` (useMarches.ts)

```
CREATION (en_preparation + en_attente)
  |
  +-- validation_status flow:
  |     en_attente → [valide | rejete | differe]
  |
  +-- statut flow (2 valeurs seulement):
  |     en_preparation → attribue (via selectWinner dans useMarcheOffres)
  |
  +-- validation interne (4 etapes):
        step 1: ASSISTANT_SDPM (saisie)
        step 2: SDPM (validation procedure)
        step 3: SDCT (controle conformite)
        step 4: CB (validation budgetaire)
```

**Fichier** : `src/hooks/useMarches.ts:89-94` (VALIDATION_STEPS)
**Fichier** : `src/hooks/useMarches.ts:254` (statut: "en_preparation")
**Fichier** : `src/hooks/useMarcheOffres.ts:141` (statut: "attribue" via selectWinner)

### 3.3 Workflow B : Module `passation-marche/` (usePassationsMarche.ts)

```
brouillon → soumis → en_analyse → valide
                                 → rejete
                                 → differe
```

**Fichier** : `src/hooks/usePassationsMarche.ts:108-115` (STATUTS)

### 3.4 Workflow C : Specification TRANSITION_VERS_PASSATION.md

```
en_preparation → lance → en_evaluation → attribue → signe
      |                        |                |
      +→ annule ←--------------+                +→ annule
```

**Fichier** : `docs/TRANSITION_VERS_PASSATION.md:342-360`

### 3.5 Analyse des ecarts

| Statut (spec)    | Workflow A                | Workflow B         | Implementee? |
| ---------------- | ------------------------- | ------------------ | ------------ |
| `en_preparation` | OUI (seul statut initial) | NON (`brouillon`)  | Partiel      |
| `lance` (publie) | **NON**                   | **NON**            | **NON**      |
| `en_evaluation`  | **NON**                   | OUI (`en_analyse`) | Partiel      |
| `attribue`       | OUI (via selectWinner)    | **NON**            | Partiel      |
| `signe`          | **NON**                   | **NON**            | **NON**      |
| `annule`         | **NON**                   | **NON**            | **NON**      |
| `brouillon`      | **NON**                   | OUI                | Partiel      |
| `soumis`         | **NON**                   | OUI                | Partiel      |
| `differe`        | OUI (validation_status)   | OUI                | OK           |
| `rejete`         | OUI (validation_status)   | OUI                | OK           |

**P0-WORKFLOW-1** : Les statuts `lance`, `signe` et `annule` ne sont implementes dans AUCUN des deux modules. Le cycle de vie complet d'un marche public (publication → reception offres → cloture → evaluation → attribution → signature) est impossible.

**P0-WORKFLOW-2** : `selectWinner` dans `useMarcheOffres.ts:138-146` change directement le statut a "attribue" en contournant completement le workflow de validation 4 etapes.

**P1-WORKFLOW-3** : Le double champ `statut` + `validation_status` dans `marches` cree une ambiguite. Un marche peut etre `statut=en_preparation` ET `validation_status=valide` simultanement -- ce qui est incoherent.

---

## 4. Systeme de lots

### 4.1 Verdict : EXISTE MAIS NON FONCTIONNEL

**Deux implementations concurrentes** du systeme de lots existent mais aucune n'est fonctionnelle :

### 4.2 Implementation A : Table relationnelle `marche_lots`

```
marche_lots (12 colonnes, 0 lignes)
├── id, marche_id (FK → marches)
├── numero_lot, intitule, description
├── montant_estime, montant_attribue
├── attributaire_id (FK → prestataires)
├── statut, date_attribution
└── created_at, updated_at

soumissions (17 colonnes, 0 lignes)
├── id, lot_id (FK → marche_lots)
├── prestataire_id (FK → prestataires)
├── montant_offre, delai_execution
├── note_technique, note_financiere, note_globale
├── classement, statut, motif_rejet
└── date_soumission, observations
```

**Source migration** : `supabase/migrations/20260106070032_62a699e0...sql`
**Etat** : Tables creees, RLS activee (`USING(true) WITH CHECK(true)`), JAMAIS utilisees par le frontend.

### 4.3 Implementation B : JSONB dans `passation_marche`

```typescript
// src/hooks/usePassationsMarche.ts:7-14
export interface LotMarche {
  id: string;
  numero: number;
  designation: string;
  montant_estime: number | null;
  prestataire_retenu_id?: string | null;
  montant_retenu?: number | null;
}
```

**Stockage** : Colonne `passation_marche.lots` (JSONB) + `passation_marche.allotissement` (boolean)
**UI** : `PassationMarcheForm.tsx:398-510` -- onglet "Lots" avec ajout/suppression de lots
**Etat** : UI implementee mais `passation_marche` a 0 lignes, donc jamais teste avec des donnees reelles.

### 4.4 Implementation C : Champs plats dans `marches`

```typescript
// src/hooks/useMarches.ts:39-41
nombre_lots?: number | null;  // Toujours 1 sur les 16 marches
numero_lot?: number | null;   // Numero du lot courant
intitule_lot?: string | null; // Intitule du lot
```

**Etat** : Tous les 16 marches ont `nombre_lots=1`. Pas de relation avec `marche_lots`.

### 4.5 Problemes

**P0-LOT-1** : Le frontend (`PassationMarcheForm`) stocke les lots en JSONB dans `passation_marche`, mais la table relationnelle `marche_lots` + `soumissions` n'est JAMAIS utilisee. Deux architectures incompatibles.

**P1-LOT-2** : Les "Acquisition de vehicules (lot 1)" (54M) et "Acquisition de vehicules (lot 2)" (13M) sont stockes comme 2 marches separes au lieu de 2 lots d'un meme marche.

**P1-LOT-3** : Aucune UI dans le module `marches/` pour gerer les lots. Seul `PassationMarcheForm` a un onglet Lots.

---

## 5. Soumissionnaires et evaluation COJO

### 5.1 Verdict : NON IMPLEMENTE

**"COJO"** (Commission d'Ouverture et de Jugement des Offres) : **0 occurrence** dans tout le code source.

### 5.2 Ce qui existe

**A. Offres directes (module `marches/`)**

```
marche_offres (15 colonnes, 0 lignes)
├── marche_id, prestataire_id
├── montant_offre, delai_execution
├── note_technique, note_financiere, note_globale
├── est_retenu, motif_selection
└── document_path, observations
```

- Hook: `useMarcheOffres.ts` -- CRUD + calcul note globale
- UI: `MarcheOffresTab.tsx` (371 lignes) + `MarcheOffresList.tsx` (402 lignes -- doublon)
- **Formule** : `note_globale = note_technique * 0.6 + note_financiere * 0.4` (ligne 68-69)

**B. Prestataires sollicites (module `passation-marche/`)**

- Stockes en JSONB dans `passation_marche.prestataires_sollicites`
- UI: `PassationMarcheForm.tsx:512-622` -- onglet Prestataires
- **Formule** : simple moyenne `(note_technique + note_financiere) / 2` (ligne 744)
- Criteres configurables dans l'UI (Prix 40%, Qualite 30%, Delai 20%, References 10%)

### 5.3 Ce qui manque (COJO)

| Fonctionnalite COJO                     | Statut                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| **Composition de la commission**        | `marches.commission_membres` (TEXT[]) existe mais JAMAIS renseigne, AUCUNE UI |
| **PV d'ouverture des plis**             | Document requis dans checklist, mais pas de workflow dedie                    |
| **Seance d'ouverture**                  | **NON IMPLEMENTE**                                                            |
| **Evaluation technique par commission** | **NON IMPLEMENTE** -- pas de grille de notation multi-evaluateur              |
| **Seuil d'admissibilite 70/100**        | **NON IMPLEMENTE** -- aucun filtre elimine les offres < 70                    |
| **Evaluation financiere**               | Calcul automatique (pas de validation commission)                             |
| **PV d'evaluation**                     | Document requis dans checklist mais genere nulle part                         |
| **Rapport final de commission**         | **NON IMPLEMENTE**                                                            |
| **Decision d'attribution**              | `selectWinner` contourne le workflow                                          |
| **Notification prestataire retenu**     | **NON IMPLEMENTE**                                                            |
| **Recours / contestation**              | **NON IMPLEMENTE**                                                            |

### 5.4 Incoherences de notation

| Source                                          | Ponderation technique                                               | Ponderation financiere |
| ----------------------------------------------- | ------------------------------------------------------------------- | ---------------------- |
| `useMarcheOffres.ts:68`                         | **60%**                                                             | **40%**                |
| `docs/TRANSITION_VERS_PASSATION.md:262`         | **70%**                                                             | **30%**                |
| `PassationMarcheForm.tsx:88-93` criteres defaut | Prix **40%** + Qualite **30%** + Delai **20%** + References **10%** |
| `PassationMarcheForm.tsx:744` score affiche     | Simple moyenne : `(tech + fin) / 2` = **50%** / **50%**             |

**P0-EVAL-1** : QUATRE formules de notation differentes coexistent. Aucune n'est conforme a la spec (70/30).

**P0-EVAL-2** : Aucun seuil d'admissibilite technique (70/100 min). Les offres non conformes ne sont pas eliminees avant l'evaluation financiere.

**P0-EVAL-3** : `selectWinner` (`useMarcheOffres.ts:119-157`) attribue directement le marche sans passer par le workflow de validation 4 etapes ni par une decision de commission.

---

## 6. Lien FK avec expression_besoin

### 6.1 Verdict : EXISTE MAIS ZERO DONNEES CONNECTEES

### 6.2 FK existantes

```sql
-- Table marches
marches.expression_besoin_id → expressions_besoin(id)  -- NULLABLE
marches.note_id → notes_dg(id)                         -- NULLABLE
marches.dossier_id → dossiers(id)                      -- NULLABLE

-- Table passation_marche
passation_marche.expression_besoin_id → expressions_besoin(id)  -- NULLABLE
passation_marche.dossier_id → dossiers(id)                      -- NULLABLE

-- Table budget_engagements (etape suivante)
budget_engagements.passation_marche_id → passation_marche(id)   -- NULLABLE
budget_engagements.marche_id → marches(id)                       -- NULLABLE
budget_engagements.expression_besoin_id → expressions_besoin(id) -- NULLABLE
```

### 6.3 Etat des donnees

| FK                                       | Valeur                          | Analyse                          |
| ---------------------------------------- | ------------------------------- | -------------------------------- |
| `marches.expression_besoin_id`           | **NULL sur 16/16**              | Aucun marche lie a une EB        |
| `marches.note_id`                        | 2/16 (les 2 tests manuels)      | Les 14 imports n'ont pas de note |
| `marches.dossier_id`                     | **NULL sur 16/16**              | Aucun marche lie a un dossier    |
| `marches.prestataire_id`                 | 1/16 (MKT-2025-0002 "attribue") | Un seul test d'attribution       |
| `budget_engagements.passation_marche_id` | **NULL sur tous**               | Chaine cassee                    |
| `budget_engagements.marche_id`           | **NULL sur tous**               | Chaine cassee                    |

### 6.4 Flux prevu vs realite

**Flux prevu** (TRANSITION_VERS_PASSATION.md:216-254) :

```
EB validee → /execution/passation-marche?sourceEB={eb.id}
           → creation marche avec expression_besoin_id = eb.id
           → articles EB importes comme lots
           → montant pre-rempli depuis EB
```

**Flux reel** :

```
Module marches/:    notes_dg (imputees) → marche (note_id = notes_dg.id)
Module passation/:  expressions_besoin (validees) → passation_marche (expression_besoin_id = eb.id)
```

**P0-FK-1** : Les deux modules utilisent des sources differentes. `marches/` part des `notes_dg`, `passation-marche/` part des `expressions_besoin`. La chaine EB→Marche n'est fonctionnelle que dans le module passation (qui a 0 donnees).

**P0-FK-2** : `budget_engagements` a deux FK (passation_marche_id ET marche_id) -- impossible de savoir laquelle utiliser. Les deux sont NULL sur tous les enregistrements.

**P1-FK-3** : `usePassationsMarche.ts:153-154` filtre les EB avec `statut = 'valide'` (accent aigu dans le code) alors que les EB stockent `statut = 'valide'` (sans accent). Cela peut bloquer la creation de passation.

---

## 7. Coherence des 16 marches existants

### 7.1 Verdict : INCOHERENTS

### 7.2 Inventaire complet

| #   | Numero        | Objet                | Montant (FCFA) | Exercice | type_marche | mode_passation | created_by |
| --- | ------------- | -------------------- | -------------- | -------- | ----------- | -------------- | ---------- |
| 1   | MKT-2025-0001 | tablette 252         | 5 000          | 2026     | fourniture  | gre_a_gre      | User test  |
| 2   | MKT-2025-0002 | tablette 252         | 5 000          | 2026     | fourniture  | gre_a_gre      | User test  |
| 3   | MKT-2026-0001 | Cartes carburant     | 37 800 000     | 2024     | fourniture  | gre_a_gre      | NULL       |
| 4   | MKT-2026-0002 | Bons-valeurs         | 21 580 000     | 2024     | fourniture  | gre_a_gre      | NULL       |
| 5   | MKT-2026-0003 | Securite privee      | 20 012 800     | 2024     | fourniture  | gre_a_gre      | NULL       |
| 6   | MKT-2026-0004 | Restauration         | 78 295 360     | 2024     | fourniture  | gre_a_gre      | NULL       |
| 7   | MKT-2026-0005 | Entretien locaux     | 12 925 000     | 2024     | fourniture  | gre_a_gre      | NULL       |
| 8   | MKT-2026-0006 | Piscine/espace vert  | 2 585 000      | 2024     | fourniture  | gre_a_gre      | NULL       |
| 9   | MKT-2026-0007 | Climatiseurs         | 1 200 000      | 2024     | fourniture  | gre_a_gre      | NULL       |
| 10  | MKT-2026-0008 | Groupes electrogenes | 4 482 500      | 2024     | fourniture  | gre_a_gre      | NULL       |
| 11  | MKT-2026-0009 | Extincteurs          | 1 047 557      | 2024     | fourniture  | gre_a_gre      | NULL       |
| 12  | MKT-2026-0010 | Vehicules lot 1      | 54 000 000     | 2024     | fourniture  | gre_a_gre      | NULL       |
| 13  | MKT-2026-0011 | Vehicules lot 2      | 13 000 000     | 2024     | fourniture  | gre_a_gre      | NULL       |
| 14  | MKT-2026-0012 | Construction bureaux | 22 658 012     | 2024     | fourniture  | gre_a_gre      | NULL       |
| 15  | MKT-2026-0013 | Construction galerie | 8 333 633      | 2024     | fourniture  | gre_a_gre      | NULL       |
| 16  | MKT-2026-0014 | Rehab Yamoussoukro   | 41 738 724     | 2024     | fourniture  | gre_a_gre      | NULL       |

**Montant total : 319 668 586 FCFA**

### 7.3 Problemes detectes

**P0-DATA-1 : Classification type_marche incorrecte**

| Marche                             | type_marche actuel | type_marche correct |
| ---------------------------------- | ------------------ | ------------------- |
| MKT-2026-0003 Securite privee      | `fourniture`       | `services`          |
| MKT-2026-0004 Restauration         | `fourniture`       | `services`          |
| MKT-2026-0005 Entretien locaux     | `fourniture`       | `services`          |
| MKT-2026-0006 Piscine/espace vert  | `fourniture`       | `services`          |
| MKT-2026-0007 Climatiseurs         | `fourniture`       | `services`          |
| MKT-2026-0008 Groupes electrogenes | `fourniture`       | `services`          |
| MKT-2026-0009 Extincteurs          | `fourniture`       | `services`          |
| MKT-2026-0012 Construction bureaux | `fourniture`       | `travaux`           |
| MKT-2026-0013 Construction galerie | `fourniture`       | `travaux`           |
| MKT-2026-0014 Rehab Yamoussoukro   | `fourniture`       | `travaux`           |

**10/16 marches ont un type_marche incorrect** -- consequence de l'import en masse avec valeur par defaut.

**P0-DATA-2 : mode_passation illegal pour les montants eleves**

| Marche                           | Montant    | mode_passation | Procedure requise (CI)                  |
| -------------------------------- | ---------- | -------------- | --------------------------------------- |
| MKT-2026-0004 Restauration       | 78 295 360 | gre_a_gre      | **AOO obligatoire** (> 30M services)    |
| MKT-2026-0010 Vehicules lot 1    | 54 000 000 | gre_a_gre      | **AOO obligatoire** (> 30M fournitures) |
| MKT-2026-0014 Rehab Yamoussoukro | 41 738 724 | gre_a_gre      | **AOR minimum** (> 30M travaux)         |
| MKT-2026-0001 Cartes carburant   | 37 800 000 | gre_a_gre      | **AOR minimum** (> 30M)                 |

**4 marches sont en gre a gre alors qu'un appel d'offres est obligatoire** selon le Code CI.

**P0-DATA-3 : Allotissement manquant**

- MKT-2026-0010 "Vehicules lot 1" (54M) et MKT-2026-0011 "Vehicules lot 2" (13M) sont 2 marches separes alors qu'ils devraient etre 2 lots d'un MEME marche (montant total : 67M → AOO obligatoire)

**P1-DATA-4 : Incoherence numerotation**

- MKT-2025-0001 et MKT-2025-0002 : annee 2025 dans le numero mais `exercice=2026`
- MKT-2026-0001 a MKT-2026-0014 : annee 2026 dans le numero mais `exercice=2024`
- `marche_sequences.dernier_numero=14` pour 2026 alors qu'il y a 16 marches (2 en 2025)

**P1-DATA-5 : 14/16 marches sans createur**

- `created_by = NULL` sur les 14 imports legacy
- Consequence : la policy UPDATE (`created_by = auth.uid() AND statut IN ('brouillon', 'en_cours')`) ne permet JAMAIS de les modifier sauf en tant qu'admin

**P1-DATA-6 : Aucune donnee enfant**

| Table enfant         | Lignes | Implication                   |
| -------------------- | ------ | ----------------------------- |
| `marche_lots`        | 0      | Pas d'allotissement           |
| `marche_offres`      | 0      | Pas d'offres/soumissionnaires |
| `soumissions`        | 0      | Pas de soumissions formelles  |
| `marche_validations` | 0      | Aucune validation effectuee   |
| `marche_documents`   | 0      | Aucun document joint          |
| `contrats`           | 0      | Aucun contrat signe           |

---

## Classification P0 / P1 / P2

### P0 -- BLOQUANTS (15)

| #   | Code          | Probleme                                                 | Impact                                  | Fichier(s)                                                |
| --- | ------------- | -------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| 1   | P0-ARCH       | Deux modules concurrents (marches/ vs passation-marche/) | Confusion, donnees eclatees             | 23 fichiers                                               |
| 2   | P0-SEUIL-1    | Pas de controle automatique mode/montant                 | Gre a gre possible a 78M                | `PassationMarcheForm.tsx`, `MarcheForm.tsx`               |
| 3   | P0-SEUIL-2    | Seuils hardcodes dans 4 fichiers                         | Non maintenable, non configurable       | `spending-case.ts:227`, `workflowEngine.ts:130`           |
| 4   | P0-SEUIL-3    | Pas de seuil par type de marche                          | Fournitures/travaux/services meme seuil | Absent                                                    |
| 5   | P0-WORKFLOW-1 | Statuts `lance`, `signe`, `annule` absents               | Cycle de vie incomplet                  | `useMarches.ts`, `usePassationsMarche.ts`                 |
| 6   | P0-WORKFLOW-2 | `selectWinner` contourne la validation 4 etapes          | Attribution sans controle               | `useMarcheOffres.ts:119-157`                              |
| 7   | P0-EVAL-1     | 4 formules de notation differentes                       | Resultat imprevisible                   | 4 fichiers                                                |
| 8   | P0-EVAL-2     | Pas de seuil d'admissibilite technique 70/100            | Offres non conformes non eliminees      | Absent                                                    |
| 9   | P0-EVAL-3     | Pas de COJO / commission                                 | Attribution sans commission             | Absent                                                    |
| 10  | P0-FK-1       | Deux sources differentes (notes_dg vs EB)                | Chaine cassee                           | `useMarches.ts:199-211`, `usePassationsMarche.ts:144-167` |
| 11  | P0-FK-2       | Double FK engagement (passation_marche_id + marche_id)   | Ambiguite liaison                       | `budget_engagements`                                      |
| 12  | P0-DATA-1     | 10/16 marches avec type_marche incorrect                 | Classification illegale                 | Table `marches`                                           |
| 13  | P0-DATA-2     | 4 marches en gre a gre au-dessus du seuil AOO            | Non-conformite Code CI                  | Table `marches`                                           |
| 14  | P0-RBAC       | canValidate={true} hardcode                              | Tout utilisateur peut valider           | `PassationMarche.tsx:550`                                 |
| 15  | P0-TSCHECK    | @ts-nocheck sur hook principal                           | 380 lignes sans verification types      | `usePassationsMarche.ts:1`                                |

### P1 -- IMPORTANTS (12)

| #   | Code          | Probleme                                                                          |
| --- | ------------- | --------------------------------------------------------------------------------- |
| 1   | P1-LOT-1      | Lots en JSONB (passation) vs table relationnelle (marche_lots) -- 2 architectures |
| 2   | P1-LOT-2      | Vehicules lot 1/2 stockes comme 2 marches au lieu de 2 lots                       |
| 3   | P1-DATA-4     | Incoherence numerotation MKT-2025 vs MKT-2026 et exercice                         |
| 4   | P1-DATA-5     | 14/16 marches sans created_by (non modifiables via RLS)                           |
| 5   | P1-DATA-6     | Toutes les tables enfants vides (lots, offres, validations, documents)            |
| 6   | P1-FK-3       | Filtre EB `statut = 'valide'` potentiellement case-sensitive                      |
| 7   | P1-WORKFLOW-3 | Double champ statut + validation_status cree ambiguite                            |
| 8   | P1-RLS        | Policy `marches_select` reference `direction_id` inexistant                       |
| 9   | P1-VIEW       | Vue `prestataires_actifs` vide (ACTIF vs actif)                                   |
| 10  | P1-UPLOAD     | Upload de fichiers simule avec setTimeout(1000)                                   |
| 11  | P1-N+1        | 5 useQuery identiques dans useMarches (filtrage client)                           |
| 12  | P1-DUP        | MarcheOffresList (402L) et MarcheOffresTab (371L) sont des doublons               |

### P2 -- MINEURS (8)

| #   | Code      | Probleme                                                          |
| --- | --------- | ----------------------------------------------------------------- |
| 1   | P2-TOAST  | Double systeme toast (useToast vs sonner)                         |
| 2   | P2-FORMAT | formatMontant duplique dans 10+ fichiers                          |
| 3   | P2-MODES  | Listes de modes incoherentes entre les 2 modules                  |
| 4   | P2-DOCS   | Double systeme documents (DOCUMENTS_REQUIS vs DOCUMENTS_PAR_MODE) |
| 5   | P2-PAGN   | Pas de pagination sur les queries marches                         |
| 6   | P2-PJ-FK  | FK uploaded_by inconsistante (auth.users vs profiles)             |
| 7   | P2-SEQ    | Sequence desynchronisee (14 vs 16 marches)                        |
| 8   | P2-UNUSED | 5 variables error non utilisees (ESLint warnings)                 |

---

## Synthese des decisions architecturales a prendre

### Decision 1 : Quel module conserver ?

| Critere            | Module `marches/`                                | Module `passation-marche/`       | Recommandation     |
| ------------------ | ------------------------------------------------ | -------------------------------- | ------------------ |
| Donnees existantes | 16 marches                                       | 0                                | marches/           |
| Lien EB            | via notes_dg (indirect)                          | via expressions_besoin (direct)  | passation/         |
| Lots               | Champ plat nombre_lots                           | JSONB + UI allotissement         | passation/         |
| Evaluation         | Table marche_offres                              | JSONB prestataires_sollicites    | marches/           |
| Workflow           | 4 etapes + validation_status                     | brouillon→soumis→valide          | Ni l'un ni l'autre |
| Documents          | 2 tables (marche_documents + marche_attachments) | JSONB pieces_jointes + checklist | passation/         |
| TypeScript         | Types corrects                                   | @ts-nocheck                      | marches/           |
| Sidebar            | Present (/marches)                               | Absent                           | marches/           |

**Recommandation** : Fusionner -- garder la table `marches` (donnees existantes) avec le frontend `passation-marche/` (meilleure UX) et implementer le workflow complet de la spec.

### Decision 2 : Seuils configurables

Migrer les seuils vers `parametres_exercice` avec les valeurs CI officielles par type de marche.

### Decision 3 : Workflow cible

```
brouillon → soumis → lance → en_evaluation → attribue → signe
     |                  |          |              |         |
     +→ annule ←--------+→ annule ←+→ annule ←----+→ annule |
                                                            ↓
                                                      engagement
```

---

_Document genere le 18 fevrier 2026 par Claude Code_
_ARTI -- Autorite de Regulation du Transport Interieur -- Cote d'Ivoire_
_SYGFP -- Systeme de Gestion Financiere et de Planification_
