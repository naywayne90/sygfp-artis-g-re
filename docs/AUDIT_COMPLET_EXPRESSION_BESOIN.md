# AUDIT COMPLET — Module Expression de Besoin (Etape 4/9)

> **Date :** 16 fevrier 2026
> **Mode :** Lecture seule (READ ONLY) — Aucune modification
> **Agents :** LEAD + FRONTEND + BACKEND + QA (3 agents paralleles)
> **Perimetre :** Route `/execution/expression-besoin`, table `expressions_besoin`, 10 fichiers frontend, ~3,346 lignes
> **Module sortant :** Imputation Budgetaire (Certifie Prompt 10)

---

## SCORE DE SANTE GLOBAL : 60/100

| Domaine   | Score  | Poids | Pondere      |
| --------- | ------ | ----- | ------------ |
| Frontend  | 87/100 | 40%   | 34.8         |
| Backend   | 42/100 | 35%   | 14.7         |
| QA        | 42/100 | 25%   | 10.5         |
| **TOTAL** |        |       | **60.0/100** |

### Verdict

Le module Expression de Besoin a une **architecture frontend solide** (8 composants, workflow multi-etapes, editeur d'articles dynamique) mais souffre de **problemes critiques backend et runtime** : crash sur l'onglet "Toutes" (mismatch accents DB vs code), donnees migrees completement deconnectees de la chaine (0 liens imputation/note/dossier, 0 created_by), 3 triggers de numerotation conflictuels, et RLS quasi-inexistantes.

**Particularite du module** : C'est le premier module de la chaine avec un **parent+enfants** (liste d'articles en JSONB). L'editeur dynamique existe cote frontend mais les donnees en base ont toutes `liste_articles = []`.

---

## TOP 12 CORRECTIONS PRIORITAIRES

| #   | Prio   | Domaine     | Description                                                                                                                                                                                                                                                                     | Fichier(s)                               | Effort |
| --- | ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------ |
| 1   | **P0** | QA/Frontend | **CRASH onglet "Toutes"** : `STATUS_CONFIG["valide"]` = undefined → TypeError. Les valeurs DB (`valide`, `rejete`, `normale`) n'ont pas d'accents, le code attend (`validé`, `rejeté`, `normal`). Ajouter les variantes sans accent dans les dictionnaires ou normaliser la DB. | `ExpressionBesoinList.tsx:45-58,141-142` | Faible |
| 2   | **P0** | QA/Frontend | **KPIs tous faux** : filtres `e.statut === "validé"` ne matchent jamais `"valide"` en DB. Les 7 KPIs affichent 0 sauf "A traiter".                                                                                                                                              | `useExpressionsBesoin.ts:491-496`        | Faible |
| 3   | **P0** | Backend     | **3 triggers numerotation conflictuels** : `set_expression_besoin_numero` (EB-YYYY-0001), `trg_generate_expression_besoin_reference` (EB-YYYY-DIR-0001), `trg_generate_eb_numero` (EB-YYYY-00001). Garder UN seul, supprimer les autres.                                        | 3 migrations SQL                         | Moyen  |
| 4   | **P0** | Backend     | **Bug `check_marche_prerequisites`** : verifie `statut = 'validee'` (avec accent + e final) au lieu de `'valide'`. Ne matchera JAMAIS.                                                                                                                                          | Migration 20260117122414                 | Faible |
| 5   | **P1** | Backend     | **RLS policies inexistantes** : aucune policy SELECT/INSERT/UPDATE/DELETE visible dans les migrations pour `expressions_besoin`. Tables enfants ont `USING (true)` (tout ouvert).                                                                                               | Nouvelle migration                       | Moyen  |
| 6   | **P1** | Backend     | **`created_by` = NULL pour 3,146 EB** : aucun auteur renseigne (donnees migrees). Empeche le workflow (taches referencent `created_by`).                                                                                                                                        | Migration data fix                       | Moyen  |
| 7   | **P1** | Backend     | **Chaine deconnectee** : `imputation_id`, `note_id`, `dossier_id` = NULL pour toutes les EB. Aucune liaison avec les etapes amont.                                                                                                                                              | Migration data fix                       | Eleve  |
| 8   | **P1** | Backend     | **Pas de trigger `updated_at`** sur `expressions_besoin`. Le champ n'est jamais mis a jour automatiquement.                                                                                                                                                                     | Nouvelle migration                       | Faible |
| 9   | **P1** | QA          | **Pas de filtrage RBAC** : DAAF et Agent DSI voient les memes 189 EB. Pas de restriction par direction.                                                                                                                                                                         | RLS + frontend                           | Moyen  |
| 10  | **P2** | Frontend    | **Pas de validation Zod** : formulaires utilisent validation HTML basique. Ajouter schemas Zod comme les modules precedents.                                                                                                                                                    | Nouveau fichier schema                   | Moyen  |
| 11  | **P2** | Frontend    | **Pas de pagination serveur** : toutes les EB chargees en memoire (3,146 rows). Ajouter pagination comme le module Imputation.                                                                                                                                                  | `useExpressionsBesoin.ts`                | Moyen  |
| 12  | **P2** | QA          | **0 tests** : aucun test unitaire ni E2E pour ce module de 3,346 lignes et 9 mutations.                                                                                                                                                                                         | Nouveaux fichiers                        | Eleve  |

---

## A. AUDIT FRONTEND (87/100)

### A.1 Inventaire des fichiers (10 fichiers, 3,346 lignes)

**Hook (1 fichier, 525 lignes)**

| Fichier                             | Lignes | Role                                                        |
| ----------------------------------- | ------ | ----------------------------------------------------------- |
| `src/hooks/useExpressionsBesoin.ts` | 525    | Hook principal (4 queries, 9 mutations, filtres par statut) |

**Page (1 fichier, 468 lignes)**

| Fichier                                    | Lignes | Role                                                   |
| ------------------------------------------ | ------ | ------------------------------------------------------ |
| `src/pages/execution/ExpressionBesoin.tsx` | 468    | Page principale (8 onglets, 7 KPIs, recherche, export) |

**Composants (8 fichiers, 2,353 lignes)**

| Fichier                                  | Lignes | Role                                             |
| ---------------------------------------- | ------ | ------------------------------------------------ |
| `ExpressionBesoinFromImputationForm.tsx` | 604    | Creation EB depuis imputation + editeur articles |
| `ExpressionBesoinDetails.tsx`            | 496    | Dialog details (2 tabs: Infos + Historique)      |
| `ExpressionBesoinForm.tsx`               | 406    | Creation EB depuis marche valide                 |
| `ExpressionBesoinTimeline.tsx`           | 314    | Timeline workflow compact/developpe              |
| `ExpressionBesoinList.tsx`               | 307    | Table avec actions contextuelles                 |
| `ExpressionBesoinDeferDialog.tsx`        | 90     | Dialog report (motif + date reprise)             |
| `ExpressionBesoinRejectDialog.tsx`       | 72     | Dialog rejet (motif obligatoire)                 |
| `ExpressionBesoinValidateDialog.tsx`     | 64     | Dialog validation (commentaires optionnels)      |

### A.2 Fonctionnalites implementees

- [x] Creation EB depuis imputation validee (pre-remplissage)
- [x] Creation EB depuis marche valide
- [x] Editeur articles/lignes dynamique (ajout/suppression)
- [x] Stockage JSONB `liste_articles`
- [x] 8 unites disponibles (piece, kg, m, m2, m3, litre, lot, forfait)
- [x] Workflow validation 3 etapes (Chef Service → Sous-Directeur → Directeur)
- [x] 6 statuts (brouillon, soumis, valide, rejete, differe, satisfaite)
- [x] 8 onglets (A traiter, Brouillons, A valider, Validees, Satisfaites, Rejetees, Differees, Toutes)
- [x] 7 KPIs tableau de bord
- [x] Recherche par numero/objet/direction
- [x] Timeline workflow avec historique
- [x] Lien chaine depense (DossierStepTimeline)
- [x] Export Excel (BudgetChainExportButton)
- [x] Navigation vers Passation Marche depuis EB validee
- [x] Numerotation atomique (RPC get_next_sequence)
- [ ] Validation Zod (formulaires en validation HTML basique)
- [ ] Pagination serveur (charge tout en memoire)
- [ ] Tests unitaires (0 tests)
- [ ] Edition EB existante (creation seulement)
- [ ] Controle RBAC sur boutons validation (menu accessible a tous)

### A.3 Articles/Lignes (Parent+Enfants) — IMPLEMENTE

**Structure JSONB :**

```json
[
  { "article": "Laptop Dell XPS", "quantite": 5, "unite": "piece" },
  { "article": "Chaise ergonomique", "quantite": 10, "unite": "piece" }
]
```

**Editeur dynamique** dans `ExpressionBesoinFromImputationForm.tsx` :

- Interface `ArticleLigne { id, article, quantite, unite }`
- `handleAddArticle()` — Ajoute ligne vide
- `handleRemoveArticle(id)` — Supprime si > 1 ligne
- `handleArticleChange(id, field, value)` — Edite champ
- Table: Designation | Quantite | Unite | Supprimer
- Validation: minimum 1 article avec quantite >= 1

**Affichage** dans `ExpressionBesoinDetails.tsx` :

- Liste lisible "Article - Quantite Unite"
- Conditionnel si `liste_articles` non vide

**Gap** : Pas de prix unitaire, pas de montant par ligne, pas de calcul montant total.

### A.4 Workflow validation multi-etapes

```
VALIDATION_STEPS = [
  { order: 1, role: "CHEF_SERVICE", label: "Chef de Service" },
  { order: 2, role: "SOUS_DIRECTEUR", label: "Sous-Directeur" },
  { order: 3, role: "DIRECTEUR", label: "Directeur" },
]
```

**Note** : Le doc de transition prevoyait 4 etapes (+ DAAF + DG), le code en implemente 3. A confirmer avec les regles metier.

### A.5 Score Frontend

| Critere                     | Score  | Remarques                                         |
| --------------------------- | ------ | ------------------------------------------------- |
| Architecture & organisation | 90/100 | Bonne separation composants/hooks/pages           |
| Fonctionnalites metier      | 95/100 | Toutes les features attendues implementees        |
| Workflow validation         | 90/100 | Multi-etapes OK, trace complete                   |
| Articles/Lignes             | 85/100 | JSONB OK, editeur dynamique, manque prix unitaire |
| UX/Composants               | 85/100 | Bonne UX, responsive                              |
| Tests                       | 60/100 | Aucun test unitaire                               |
| Validation formulaires      | 70/100 | HTML basique, pas Zod                             |
| Performance                 | 75/100 | Pas de pagination serveur                         |

**Score Frontend : 87/100**

---

## B. AUDIT BACKEND (42/100)

### B.1 Donnees en base

| Table                           | Count            | Statut                             |
| ------------------------------- | ---------------- | ---------------------------------- |
| `expressions_besoin`            | **3,146**        | Donnees migrees SQL Server         |
| `expression_besoin_attachments` | **0**            | VIDE — jamais utilisee             |
| `expression_besoin_validations` | **0**            | VIDE — jamais utilisee             |
| `expression_besoin_sequences`   | **0**            | VIDE — jamais initialisee          |
| `expression_besoin_articles`    | **N'EXISTE PAS** | Pas de table enfant dediee         |
| `passation_marche`              | **0**            | VIDE — etape suivante non utilisee |

### B.2 Distribution par statut

| Statut      | Count  | %    |
| ----------- | ------ | ---- |
| `valide`    | ~3,019 | 96%  |
| `brouillon` | ~76    | 2.4% |
| `rejete`    | ~51    | 1.6% |
| `soumis`    | 0      | 0%   |
| `differe`   | 0      | 0%   |

> Toutes les EB viennent de la migration SQL Server. Le workflow de soumission/validation n'a jamais ete utilise via l'application.

### B.3 Schema expressions_besoin (37 colonnes)

| Colonne                   | Type                   | Description                             |
| ------------------------- | ---------------------- | --------------------------------------- |
| `id`                      | uuid PK                | Identifiant                             |
| `numero`                  | text                   | Auto-genere (EB-YYYY-DIR-XXXX)          |
| `objet`                   | text NOT NULL          | Objet du besoin                         |
| `description`             | text                   | Description detaillee                   |
| `justification`           | text                   | Justification                           |
| `specifications`          | text                   | Cahier des charges                      |
| `calendrier_debut`        | date                   | Date debut                              |
| `calendrier_fin`          | date                   | Date fin                                |
| `montant_estime`          | numeric                | Montant estime total                    |
| `quantite`                | integer                | Quantite globale                        |
| `unite`                   | text                   | Unite globale                           |
| `urgence`                 | text                   | "normale" / "urgente" / "tres_urgente"  |
| `liste_articles`          | jsonb                  | Liste articles (DEFAULT '[]')           |
| `numero_lot`              | integer                | Numero de lot                           |
| `intitule_lot`            | text                   | Intitule du lot                         |
| `type_procedure`          | text                   | Type passation (DEFAULT 'consultation') |
| `criteres_evaluation`     | text                   | Criteres evaluation                     |
| `lieu_livraison`          | text                   | Lieu livraison                          |
| `delai_livraison`         | text                   | Delai livraison                         |
| `contact_livraison`       | text                   | Contact livraison                       |
| `statut`                  | text                   | Workflow statut                         |
| `current_validation_step` | integer                | Etape validation courante (DEFAULT 0)   |
| `validation_status`       | text                   | Statut validation (DEFAULT 'pending')   |
| `code_locked`             | boolean                | Code verrouille (DEFAULT false)         |
| `submitted_at`            | timestamptz            | Date soumission                         |
| `validated_at`            | timestamptz            | Date validation                         |
| `validated_by`            | uuid FK → profiles     | Valideur                                |
| `rejection_reason`        | text                   | Motif rejet                             |
| `date_differe`            | timestamptz            | Date report                             |
| `motif_differe`           | text                   | Motif report                            |
| `differe_by`              | uuid FK → profiles     | Rapporteur                              |
| `deadline_correction`     | timestamptz            | Deadline correction                     |
| `exercice`                | integer                | Exercice budgetaire                     |
| `imputation_id`           | uuid FK → imputations  | Lien imputation source                  |
| `dossier_id`              | uuid FK → dossiers     | Lien dossier                            |
| `direction_id`            | uuid FK → directions   | Direction                               |
| `marche_id`               | uuid FK → marches      | Lien marche                             |
| `note_id`                 | uuid FK → notes_dg     | Lien note AEF                           |
| `ligne_budgetaire_id`     | uuid FK → budget_lines | Ligne budgetaire                        |
| `created_by`              | uuid FK → profiles     | Createur                                |
| `created_at`              | timestamptz            | Date creation                           |
| `updated_at`              | timestamptz            | Date MAJ                                |

### B.4 Foreign Keys (6)

| FK                                          | Colonne             | Reference        |
| ------------------------------------------- | ------------------- | ---------------- |
| expressions_besoin_marche_id_fkey           | marche_id           | marches(id)      |
| expressions_besoin_dossier_id_fkey          | dossier_id          | dossiers(id)     |
| expressions_besoin_note_id_fkey             | note_id             | notes_dg(id)     |
| expressions_besoin_ligne_budgetaire_id_fkey | ligne_budgetaire_id | budget_lines(id) |
| expressions_besoin_imputation_id_fkey       | imputation_id       | imputations(id)  |
| (implicit)                                  | direction_id        | directions(id)   |

### B.5 Index (6)

| Index                                  | Colonnes           |
| -------------------------------------- | ------------------ |
| idx_expressions_besoin_marche_id       | marche_id          |
| idx_expressions_besoin_dossier_id      | dossier_id         |
| idx_expressions_besoin_statut          | statut             |
| idx_expressions_besoin_imputation      | imputation_id      |
| idx_expressions_besoin_exercice_statut | (exercice, statut) |
| idx_expressions_besoin_direction_id    | direction_id       |

### B.6 Triggers (8 — CONFLICTUELS)

| Trigger                                    | Event                | Format numero             | Migration      |
| ------------------------------------------ | -------------------- | ------------------------- | -------------- |
| `set_expression_besoin_numero`             | BEFORE INSERT        | EB-YYYY-0001              | 20260105       |
| `trg_generate_expression_besoin_reference` | BEFORE INSERT        | EB-YYYY-DIR-0001          | 20260116184854 |
| `trg_generate_eb_numero`                   | BEFORE INSERT/UPDATE | EB-YYYY-00001             | 20260116210422 |
| `trg_update_dossier_on_expression_besoin`  | AFTER INSERT         | MAJ dossier               | 20260116184854 |
| `trg_update_dossier_on_eb_validation`      | AFTER UPDATE         | MAJ dossier quand validee | 20260116210422 |
| `trg_create_eb_workflow_task`              | AFTER UPDATE         | Cree tache workflow       | 20260116210422 |
| `trg_create_eb_workflow_task_insert`       | AFTER INSERT         | Tache si soumise          | 20260116210422 |

**PROBLEME CRITIQUE** : 3 triggers BEFORE INSERT tentent de generer le numero avec 3 formats differents. L'ordre d'execution est indefini.

### B.7 RLS Policies

**CONSTAT CRITIQUE : Aucune policy SELECT/INSERT/UPDATE/DELETE explicite dans les migrations.**

Seule policy trouvee :

- `Users can read expressions linked to accessible imputations` (SELECT sur imputation_id)

Tables enfants : toutes `USING (true)` (aucune restriction).

### B.8 Integrite des donnees

| Verification                    | Resultat      | Commentaire                     |
| ------------------------------- | ------------- | ------------------------------- |
| EB sans direction_id            | 0 / 3,146     | OK                              |
| EB sans exercice                | 0 / 3,146     | OK                              |
| EB avec imputation_id           | **0 / 3,146** | AUCUNE EB liee a une imputation |
| EB avec note_id                 | **0 / 3,146** | AUCUNE EB liee a une note       |
| EB avec dossier_id              | **0 / 3,146** | AUCUNE EB liee a un dossier     |
| EB avec created_by              | **0 / 3,146** | AUCUN auteur renseigne          |
| EB avec liste_articles non vide | **0 / 3,146** | Toutes vides                    |

### B.9 Fonctions/RPCs

| Fonction                                               | Description               | Bug ?                                               |
| ------------------------------------------------------ | ------------------------- | --------------------------------------------------- |
| `create_engagement_from_eb(uuid, uuid, numeric, uuid)` | Cree engagement depuis EB | OK                                                  |
| `is_expression_besoin_validated(eb_id)`                | Verifie si EB validee     | OK                                                  |
| `check_marche_prerequisites(eb_id)`                    | Verifie prereqs passation | **BUG : verifie `'validee'` au lieu de `'valide'`** |
| `generate_unique_code(...)`                            | Codification standardisee | OK                                                  |

### B.10 Score Backend

| Critere                 | Points | Max |
| ----------------------- | ------ | --- |
| Table principale existe | 10     | 10  |
| Types TS generes        | 8      | 10  |
| FK + Index              | 8      | 10  |
| Triggers workflow       | 5      | 10  |
| RLS Policies            | 2      | 15  |
| Tables enfants          | 2      | 10  |
| Articles/Lignes         | 1      | 10  |
| Integrite donnees       | 3      | 10  |
| Fonctions/RPCs          | 3      | 5   |
| Coherence statuts       | 0      | 10  |

**Score Backend : 42/100**

---

## C. AUDIT QA (42/100)

### C.1 Build & TypeScript

| Verification             | Resultat                                                    |
| ------------------------ | ----------------------------------------------------------- |
| `tsc --noEmit`           | **0 erreurs**                                               |
| `npm run build`          | **OK** (29.54s)                                             |
| ESLint Expression Besoin | 0 errors, 4 warnings (`@typescript-eslint/no-explicit-any`) |
| Bundle EB                | 61.48 kB (gzip: 12.16 kB)                                   |
| Tests unitaires          | 275/275 PASS (aucun ne couvre Expression Besoin)            |

### C.2 Tests existants

| Type                              | Count | Fichiers |
| --------------------------------- | ----- | -------- |
| Tests unitaires Expression Besoin | **0** | Aucun    |
| Tests E2E Expression Besoin       | **0** | Aucun    |

### C.3 Test visuel Playwright

**En tant que DAAF (daaf@arti.ci) :**

| Element          | Resultat  | Detail                                                                               |
| ---------------- | --------- | ------------------------------------------------------------------------------------ |
| Page charge      | OUI       | 0 erreurs sur tab par defaut                                                         |
| Header           | OUI       | "Expressions de Besoin", icone etape 4                                               |
| Breadcrumb       | OUI       | Accueil > Chaine de la Depense > Expression Besoin                                   |
| Boutons creation | OUI       | "Depuis marche" + "Nouvelle EB"                                                      |
| Export           | OUI       | "Exporter Excel"                                                                     |
| Recherche        | OUI       | Barre fonctionnelle                                                                  |
| 7 KPIs           | **FAUX**  | Tous a 0 sauf "A traiter" (1) — mismatch accents                                     |
| 8 onglets        | OUI       | A traiter, Brouillons, A valider, Validees, Satisfaites, Rejetees, Differees, Toutes |
| Tab "A traiter"  | OK        | 1 ligne (IMP-2026-DCSTI-0001)                                                        |
| Tab "Toutes"     | **CRASH** | `TypeError: Cannot read properties of undefined (reading 'className')`               |

**CAUSE RACINE DU CRASH :**

| Champ   | Valeur en DB | Valeur attendue par le code |
| ------- | ------------ | --------------------------- |
| statut  | `valide`     | `validé` (avec accent)      |
| statut  | `rejete`     | `rejeté` (avec accent)      |
| urgence | `normale`    | `normal` (sans 'e')         |

Les dictionnaires `STATUS_CONFIG` et `URGENCE_CONFIG` dans `ExpressionBesoinList.tsx` ne contiennent pas les variantes sans accent. L'acces a `.variant` ou `.className` sur `undefined` crashe l'application.

### C.4 Test RBAC

| Critere               | DAAF           | Agent DSI           |
| --------------------- | -------------- | ------------------- |
| Acces page            | OUI            | OUI                 |
| Imputations a traiter | 1              | 0                   |
| Total "Toutes"        | 189            | **189 (identique)** |
| Boutons creation      | OUI            | OUI                 |
| Boutons validation    | OUI (via menu) | OUI (via menu)      |

**Probleme** : DAAF et Agent DSI voient exactement les memes 189 expressions. Pas de filtrage par direction. L'agent peut voir les boutons de validation sans controle de role.

### C.5 Score QA

| Critere            | Score | Max |
| ------------------ | ----- | --- |
| Build & TypeScript | 10    | 10  |
| Lint               | 8     | 10  |
| Tests unitaires    | 0     | 15  |
| Tests E2E          | 0     | 10  |
| Page charge        | 5     | 5   |
| KPIs               | 0     | 10  |
| Tableau/Donnees    | 0     | 10  |
| Recherche          | 5     | 5   |
| Export             | 5     | 5   |
| Creation           | 5     | 5   |
| RBAC               | 4     | 10  |
| Erreurs console    | 0     | 5   |

**Score QA : 42/100**

---

## D. SYNTHESE DES GAPS

### Gaps CRITIQUES (P0) — Bloquants

| #   | Gap                                                    | Impact                   | Correction                                            |
| --- | ------------------------------------------------------ | ------------------------ | ----------------------------------------------------- |
| G1  | Crash onglet "Toutes" (accent mismatch)                | Application inutilisable | Normaliser dictionnaires STATUS_CONFIG/URGENCE_CONFIG |
| G2  | KPIs tous faux (filtres accentues)                     | Metriques trompeuses     | Normaliser filtres dans useExpressionsBesoin          |
| G3  | 3 triggers numerotation conflictuels                   | Numeros incoherents      | Garder 1 trigger, supprimer 2                         |
| G4  | Bug check_marche_prerequisites ('validee' vs 'valide') | Passation impossible     | Corriger la fonction SQL                              |

### Gaps MAJEURS (P1) — A traiter rapidement

| #   | Gap                                                          | Impact                 | Correction                                 |
| --- | ------------------------------------------------------------ | ---------------------- | ------------------------------------------ |
| G5  | RLS policies inexistantes                                    | Securite compromise    | Creer policies SELECT/INSERT/UPDATE/DELETE |
| G6  | created_by = NULL (3,146 EB)                                 | Workflow casse         | Migration data fix                         |
| G7  | Chaine deconnectee (imputation_id/note_id/dossier_id = NULL) | Tracabilite impossible | Migration data fix                         |
| G8  | Pas de trigger updated_at                                    | Audit trail incomplet  | Nouvelle migration                         |
| G9  | Pas de filtrage RBAC direction                               | Securite faible        | RLS + filtrage frontend                    |

### Gaps MODERES (P2) — A planifier

| #   | Gap                                      | Impact                            |
| --- | ---------------------------------------- | --------------------------------- |
| G10 | Pas de validation Zod                    | Donnees potentiellement invalides |
| G11 | Pas de pagination serveur                | Performance sur gros volumes      |
| G12 | 0 tests (unitaires + E2E)                | Qualite non verifiee              |
| G13 | JSONB liste_articles sans validation DB  | Pas de contraintes                |
| G14 | Pas de prix unitaire/montant par article | Calculs impossibles               |

### Gaps MINEURS (P3)

| #   | Gap                                                                 |
| --- | ------------------------------------------------------------------- |
| G15 | 4 usages de `any` (ESLint warnings)                                 |
| G16 | Pas de controle role sur boutons validation (menu contextuel)       |
| G17 | Pas de trigger lock_code sur expressions_besoin                     |
| G18 | Tables enfants (attachments/validations/sequences) jamais utilisees |

---

## E. COMPARAISON AVEC MODULES CERTIFIES

| Critere       | Notes SEF (72/100) | Notes AEF (69/100)  | Imputation (100/100) | **Expression Besoin (60/100)** |
| ------------- | ------------------ | ------------------- | -------------------- | ------------------------------ |
| Frontend      | Solide             | Solide              | Excellent            | **Solide**                     |
| Backend       | Index OK           | RLS conflictuelles  | RLS refonte OK       | **RLS quasi-inexistantes**     |
| Tests         | 0 (pre-certif)     | 0 (pre-certif)      | 50 E2E + 52 unit     | **0**                          |
| Crash runtime | Non                | Bug setIsSubmitting | Non                  | **OUI (onglet Toutes)**        |
| Donnees       | Migrees OK         | Migrees OK          | Creees via workflow  | **Migrees, deconnectees**      |
| Pagination    | Server-side        | Server-side         | Server-side          | **Client-side**                |
| Workflow      | 9 statuts          | 9 statuts           | 4 statuts            | **6 statuts, 3 etapes**        |
| Exports       | Excel/PDF/CSV      | Excel/PDF/CSV       | Excel/CSV/PDF        | **Excel seulement**            |

---

## F. METRIQUES DU MODULE

| Metrique                  | Valeur             |
| ------------------------- | ------------------ |
| Fichiers frontend         | 10                 |
| Lignes de code frontend   | 3,346              |
| Queries React Query       | 4                  |
| Mutations                 | 9                  |
| Onglets page              | 8                  |
| KPIs                      | 7                  |
| Statuts workflow          | 6                  |
| Etapes validation         | 3                  |
| Unites articles           | 8                  |
| Colonnes table principale | 37                 |
| FK                        | 6                  |
| Index                     | 6                  |
| Triggers                  | 8 (3 conflictuels) |
| Donnees en base           | 3,146              |
| Tables enfants            | 3 (toutes vides)   |
| Tests existants           | **0**              |
| Erreurs tsc               | 0                  |
| Warnings ESLint           | 4                  |

---

## G. RECOMMANDATIONS POUR LES PROCHAINS PROMPTS

### Prompt 12 — Fix P0 : Crash + Accents + Triggers (URGENT)

1. Normaliser STATUS_CONFIG et URGENCE_CONFIG (ajouter variantes sans accent)
2. Normaliser filtres statut dans useExpressionsBesoin
3. Supprimer 2 triggers numerotation, garder le plus recent
4. Corriger check_marche_prerequisites ('validee' → 'valide')
5. Ajouter trigger updated_at

### Prompt 13 — RLS + Securite

1. Creer policies RLS completes (SELECT/INSERT/UPDATE/DELETE)
2. Filtrage par direction pour agents
3. Controle RBAC sur boutons validation frontend
4. Ajouter trigger lock_code

### Prompt 14 — Formulaire + Articles enrichis

1. Ajouter prix unitaire et montant par article
2. Calcul montant total automatique
3. Validation Zod des formulaires
4. Edition EB existante
5. Drag-drop pour reordonner articles

### Prompt 15 — Page UI complete

1. Pagination serveur
2. Exports CSV + PDF en plus d'Excel
3. Filtres avances (direction, urgence, dates)
4. KPIs enrichis avec graphiques
5. WorkflowStepIndicator etape 4

### Prompt 16 — Detail Sheet enrichi

1. Sheet multi-tabs (Infos, Articles, Budget, PJ, Chaine)
2. QR code pour EB validees
3. Tableau articles avec totaux
4. Lien vers imputation source
5. Journal audit

### Prompt 17 — Integration chaine

1. Reconnecter donnees migrees (imputation_id, note_id, dossier_id)
2. Bouton "Creer passation" fonctionnel
3. Coherence montant EB ≤ montant imputation
4. Creer dossier automatiquement si absent

### Prompt 18 — Suite E2E 50 tests

### Prompt 19 — Certification Expression Besoin

---

## H. CONCLUSION

Le module Expression de Besoin a une **base de code frontend solide** (87/100) avec des fonctionnalites avancees (editeur d'articles, workflow multi-etapes, 8 onglets). Cependant, le **backend est gravement lacunaire** (42/100) avec des donnees deconnectees, des triggers conflictuels, et des RLS quasi-inexistantes. Le **runtime crash** sur l'onglet "Toutes" est le probleme le plus urgent a corriger.

**Score global : 60/100** — Module fonctionnel en surface mais necessitant des corrections critiques avant utilisation en production.

**Prochaine action** : Prompt 12 — Fix P0 (crash, accents, triggers).
