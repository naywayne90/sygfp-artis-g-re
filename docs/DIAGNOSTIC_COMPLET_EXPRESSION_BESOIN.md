# DIAGNOSTIC COMPLET — Module Expression de Besoin (Etape 4/9)

> **Date :** 16 fevrier 2026
> **Mode :** Lecture seule (READ ONLY) — Aucune modification
> **Agents :** LEAD + FRONTEND + BACKEND + QA (3 agents paralleles)
> **Prerequis :** AUDIT_COMPLET_EXPRESSION_BESOIN.md (Score initial: 60/100)
> **Focus :** Articles parent+enfants, crash accents, integrite donnees

---

## SCORE REVISE : 48/100

| Domaine           | Audit P1   | Diagnostic P2 | Changement                             |
| ----------------- | ---------- | ------------- | -------------------------------------- |
| Frontend          | 87/100     | 78/100        | -9 (export crashe, @ts-nocheck)        |
| Backend           | 42/100     | 24/100        | -18 (RLS desactivee, pas juste faible) |
| QA                | 42/100     | 35/100        | -7 (export KO, RBAC confirme ouvert)   |
| **Score pondere** | **60/100** | **48/100**    | **-12**                                |

### Verdict revise

Le diagnostic approfondi revele des problemes plus graves que l'audit initial :

1. **La RLS n'est meme pas ACTIVEE** sur `expressions_besoin` (pas juste "policies faibles")
2. **L'export Excel crashe** avec une erreur PostgREST (relation ambigue)
3. **Le frontend ecrit des accents** dans les statuts lors de la creation, mais **la DB migree n'a pas d'accents** → fragmentation future certaine
4. **Les 3 triggers de numerotation sont morts** (le frontend genere via RPC, pas via trigger)
5. Le hook d'export a **`@ts-nocheck`** (violation CLAUDE.md)

---

## SYNTHESE DES 15 BUGS TROUVES

| #       | Bug                                                                       | Severite     | Fichier(s)                    | Ligne(s)      |
| ------- | ------------------------------------------------------------------------- | ------------ | ----------------------------- | ------------- |
| **B1**  | CRASH onglet "Toutes" — `URGENCE_CONFIG["normale"]` = undefined           | **P0 CRASH** | `ExpressionBesoinList.tsx`    | 54-58, 164    |
| **B2**  | CRASH onglet "Toutes" — `STATUS_CONFIG["valide"]` = undefined             | **P0 CRASH** | `ExpressionBesoinList.tsx`    | 45-52, 169    |
| **B3**  | KPI "Validees" = 0 (devrait etre 189)                                     | **P0**       | `useExpressionsBesoin.ts`     | 492           |
| **B4**  | KPI "Rejetees" = 0 (devrait etre ~50)                                     | **P0**       | `useExpressionsBesoin.ts`     | 493           |
| **B5**  | KPI "Differees" = 0                                                       | **P0**       | `useExpressionsBesoin.ts`     | 494           |
| **B6**  | Export Excel crashe "more than one relationship"                          | **P0**       | `useExportBudgetChain.ts`     | 125           |
| **B7**  | Bug SQL `check_marche_prerequisites` : `'validee'` vs `'valide'`          | **P0**       | Migration 20260117            | fn body       |
| **B8**  | Vue `v_expressions_besoin_stats` retourne 0 partout                       | **P0**       | Migration 20260116            | vue SQL       |
| **B9**  | RLS DESACTIVEE sur `expressions_besoin`                                   | **P1**       | Aucune migration              | —             |
| **B10** | RBAC : Agent DSI voit 189 EB (= DAAF)                                     | **P1**       | `useExpressionsBesoin.ts`     | 117-143       |
| **B11** | `STATUS_CONFIG` dans Details.tsx a des accents                            | **P1**       | `ExpressionBesoinDetails.tsx` | 38-45         |
| **B12** | Fragmentation statuts : frontend ecrit `"validé"`, DB migree a `"valide"` | **P1**       | `useExpressionsBesoin.ts`     | 346, 379, 409 |
| **B13** | Export filtre statut utilise des accents                                  | **P1**       | `BudgetChainExportButton.tsx` | 65            |
| **B14** | `@ts-nocheck` dans le hook d'export                                       | **P2**       | `useExportBudgetChain.ts`     | 1             |
| **B15** | 5 usages de `any` dans 4 fichiers EB                                      | **P2**       | Multiples                     | Multiples     |

---

## A. DIAGNOSTIC FRONTEND

### A.1 CRASH ACCENTS — Cause racine exacte

**3 fichiers impactes, meme probleme :**

#### ExpressionBesoinList.tsx (lignes 45-58)

```typescript
// ACTUEL — LES CLES SONT ACCENTUEES
const STATUS_CONFIG = {
  brouillon: { label: 'Brouillon', variant: 'secondary' },
  soumis: { label: 'A valider', variant: 'outline' },
  validé: { label: 'Valide', variant: 'default' }, // 🔴 DB a "valide"
  rejeté: { label: 'Rejete', variant: 'destructive' }, // 🔴 DB a "rejete"
  différé: { label: 'Differe', variant: 'outline' }, // 🔴 DB a "differe"
  satisfaite: { label: 'Satisfaite', variant: 'default' },
};

const URGENCE_CONFIG = {
  normal: { label: 'Normal', className: 'bg-muted...' }, // 🔴 DB a "normale"
  urgent: { label: 'Urgent', className: 'bg-warning...' },
  tres_urgent: { label: 'Tres urgent', className: 'bg-destructive...' },
};
```

**Ligne 141 :** `const status = STATUS_CONFIG[expression.statut || "brouillon"];`
→ `STATUS_CONFIG["valide"]` = **undefined** → `status.variant` = **CRASH**

**Ligne 164 :** `<Badge className={urgence.className}>`
→ `URGENCE_CONFIG["normale"]` = **undefined** → `urgence.className` = **CRASH**

#### Fix exact propose

```typescript
// FIX — CLES SANS ACCENT (matchent la DB)
const STATUS_CONFIG = {
  brouillon: { label: 'Brouillon', variant: 'secondary' },
  soumis: { label: 'A valider', variant: 'outline' },
  valide: { label: 'Valide', variant: 'default' }, // ✅ Sans accent
  rejete: { label: 'Rejete', variant: 'destructive' }, // ✅ Sans accent
  differe: { label: 'Differe', variant: 'outline' }, // ✅ Sans accent
  satisfaite: { label: 'Satisfaite', variant: 'default' },
};

const URGENCE_CONFIG = {
  normal: { label: 'Normal', className: 'bg-muted...' },
  normale: { label: 'Normal', className: 'bg-muted...' }, // ✅ Ajout variante DB
  urgent: { label: 'Urgent', className: 'bg-warning...' },
  tres_urgent: { label: 'Tres urgent', className: 'bg-destructive...' },
};

// PROTECTION — fallback safe (a ajouter partout)
const status = STATUS_CONFIG[expression.statut || 'brouillon'] || STATUS_CONFIG.brouillon;
const urgence = URGENCE_CONFIG[expression.urgence || 'normal'] || URGENCE_CONFIG.normal;
```

#### ExpressionBesoinDetails.tsx (lignes 38-45) — Meme fix

```typescript
// FIX
const STATUS_CONFIG = {
  brouillon: { ... },
  soumis: { ... },
  valide: { ... },    // ✅ Sans accent (etait "validé")
  rejete: { ... },    // ✅ Sans accent (etait "rejeté")
  differe: { ... },   // ✅ Sans accent (etait "différé")
  satisfaite: { ... },
};
const status = STATUS_CONFIG[expression.statut || "brouillon"] || STATUS_CONFIG.brouillon;
```

#### useExpressionsBesoin.ts (lignes 491-496) — Fix filtres

```typescript
// AVANT (AUCUN MATCH avec la DB)
const expressionsValidees = expressions.filter((e) => e.statut === 'validé');
const expressionsRejetees = expressions.filter((e) => e.statut === 'rejeté');
const expressionsDifferees = expressions.filter((e) => e.statut === 'différé');

// APRES (matche la DB)
const expressionsValidees = expressions.filter((e) => e.statut === 'valide');
const expressionsRejetees = expressions.filter((e) => e.statut === 'rejete');
const expressionsDifferees = expressions.filter((e) => e.statut === 'differe');
```

#### DECISION CRITIQUE : Convention accents

Le frontend ecrit des accents lors de la creation (mutations lignes 346, 379, 409) :

```typescript
// Ligne 346 (validateExpression)
updateData.statut = "validé";   // 🔴 ECRIT AVEC ACCENT

// Ligne 379 (rejectExpression)
statut: "rejeté",              // 🔴 ECRIT AVEC ACCENT

// Ligne 409 (deferExpression)
statut: "différé",             // 🔴 ECRIT AVEC ACCENT
```

**Probleme :** Les 3,146 EB migrees ont `"valide"` (sans accent). Les nouvelles EB auront `"validé"` (avec accent). **Fragmentation certaine.**

**Fix propose :** Aligner TOUT sur les valeurs DB sans accent :

```typescript
// Ligne 346
updateData.statut = "valide";   // ✅ Sans accent

// Ligne 379
statut: "rejete",              // ✅ Sans accent

// Ligne 409
statut: "differe",             // ✅ Sans accent
```

---

### A.2 EDITEUR D'ARTICLES — Analyse detaillee

#### Structure actuelle (ExpressionBesoinFromImputationForm.tsx)

```typescript
interface ArticleLigne {
  id: string; // UUID genere cote client
  article: string; // Designation
  quantite: number; // Quantite
  unite: string; // Unite (piece, kg, m, m2, m3, litre, lot, forfait)
}
```

#### Ce qui MANQUE

| Champ                                         | Statut     | Impact                                                           |
| --------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `prix_unitaire`                               | **ABSENT** | Impossible de calculer le cout par article                       |
| `montant` (par ligne)                         | **ABSENT** | Pas de sous-total par article                                    |
| Calcul montant total                          | **ABSENT** | `montant_estime` est saisi manuellement, deconnecte des articles |
| Validation montant total ≤ montant imputation | **ABSENT** | Pas de coherence financiere                                      |
| Drag-and-drop pour reordonner                 | **ABSENT** | Ordre fixe par ajout                                             |

#### Stockage JSONB actuel

```json
[
  { "article": "Ordinateur portable", "quantite": 5, "unite": "piece" },
  { "article": "Souris sans fil", "quantite": 10, "unite": "piece" }
]
```

#### Stockage JSONB souhaite (avec prix)

```json
[
  {
    "article": "Ordinateur portable",
    "quantite": 5,
    "unite": "piece",
    "prix_unitaire": 500000,
    "montant": 2500000
  },
  {
    "article": "Souris sans fil",
    "quantite": 10,
    "unite": "piece",
    "prix_unitaire": 15000,
    "montant": 150000
  }
]
// Total calcule: 2,650,000 FCFA
```

#### Validation articles actuelle

- Minimum 1 article requis (ligne 145)
- Articles vides filtres (ligne 163-165)
- **ABSENT** : validation quantite > 0, validation prix_unitaire > 0
- **ABSENT** : coherence montant_estime vs somme articles

#### Composant dedie : ABSENT

L'editeur d'articles est inline dans `ExpressionBesoinFromImputationForm.tsx`.
`ExpressionBesoinForm.tsx` (creation depuis marche) n'a **PAS** d'editeur d'articles.

→ **Recommandation** : creer un composant `<ArticleEditor />` reutilisable.

#### Affichage articles (ExpressionBesoinDetails.tsx, lignes 263-283)

```typescript
{expression.liste_articles?.map((item: any, index: number) => (
  <div key={index} className="flex justify-between items-center">
    <span className="font-medium">{item.article}</span>
    <span className="text-sm text-muted-foreground">
      {item.quantite} {item.unite}
    </span>
  </div>
))}
```

**Manque** : affichage prix_unitaire, montant par ligne, total.

---

### A.3 LIEN IMPUTATION → EXPRESSION BESOIN

#### Flux sourceImputation (ExpressionBesoin.tsx, lignes 75-103)

```
URL: /execution/expression-besoin?sourceImputation={imputation_id}
  → Charge l'imputation via Supabase
  → Pre-remplit objet + montant_estime
  → Ouvre automatiquement le formulaire
```

**Statut : FONCTIONNEL** ✅

#### Donnees transmises a la creation

| Champ                 | Source                          | Statut      |
| --------------------- | ------------------------------- | ----------- |
| `imputation_id`       | selectedImputation.id           | ✅ Transmis |
| `dossier_id`          | selectedImputation.dossier_id   | ✅ Transmis |
| `direction_id`        | selectedImputation.direction_id | ✅ Transmis |
| `objet`               | Pre-rempli depuis imputation    | ✅ Transmis |
| `montant_estime`      | Pre-rempli depuis imputation    | ✅ Transmis |
| `note_id`             | **Non transmis**                | ⚠️ Manquant |
| `ligne_budgetaire_id` | **Non transmis**                | ⚠️ Manquant |

#### Query imputations disponibles

```typescript
// useExpressionsBesoin.ts lignes 146-176
supabase
  .from('imputations')
  .select(`...`)
  .eq('statut', 'valide') // Filtre imputations validees
  .eq('exercice', exercice)
  .order('validated_at', { ascending: false });

// Exclut les imputations ayant deja une EB
const usedImputationIds = new Set(existingEBs?.map((eb) => eb.imputation_id));
return imputations.filter((imp) => !usedImputationIds.has(imp.id));
```

**Statut : FONCTIONNEL** ✅ — filtre correct avec exclusion des doublons.

---

### A.4 EXPORT EXCEL — NOUVEAU BUG

#### useExportBudgetChain.ts (ligne 125)

```typescript
// ACTUEL — CRASHE
const { data, error } = await supabase.from('expressions_besoin').select(`*, marche:marches(...)`); // 🔴 Relation ambigue
```

**Erreur PostgREST** : `"Could not embed because more than one relationship was found for 'expressions_besoin' and 'marches'"`

**Fix** : ajouter le hint FK :

```typescript
.select(`*, marche:marches!expressions_besoin_marche_id_fkey(...)`)
```

**Probleme additionnel** : Le fichier a `@ts-nocheck` en ligne 1 (violation CLAUDE.md).

---

## B. DIAGNOSTIC BACKEND

### B.1 TRIGGERS NUMEROTATION — Etat reel

| #   | Trigger                                    | Format           | Event                                                | Table sequence                         | Migration      |
| --- | ------------------------------------------ | ---------------- | ---------------------------------------------------- | -------------------------------------- | -------------- |
| T1  | `set_expression_besoin_numero`             | EB-YYYY-0001     | BEFORE INSERT (WHEN numero IS NULL)                  | `expression_besoin_sequences` (UPSERT) | 20260105       |
| T2  | `trg_generate_expression_besoin_reference` | EB-YYYY-DIR-0001 | BEFORE INSERT (toujours)                             | Aucune (MAX regex, NON ATOMIQUE)       | 20260116184854 |
| T3  | `trg_generate_eb_numero` / `_insert`       | EB-YYYY-00001    | BEFORE INSERT (WHEN statut='soumis') + BEFORE UPDATE | `expression_besoin_sequences` (UPSERT) | 20260116210422 |

#### Etat reel en production

**AUCUN trigger n'est utilise.** Les numeros existants sont au format `ARTI001240001` (migration SQL Server). Le frontend genere les numeros via `supabase.rpc("get_next_sequence", {...})` AVANT l'INSERT, donc `numero` n'est jamais NULL lors de l'INSERT.

#### Recommandation

- **Supprimer T1 et T2** (morts, conflictuels)
- **Garder T3** comme filet de securite (conditionnel, atomique)
- **Documenter** que le format officiel est celui du frontend via RPC

---

### B.2 BUG check_marche_prerequisites

#### Code SQL actuel (migration 20260117)

```sql
CREATE OR REPLACE FUNCTION check_marche_prerequisites(p_eb_id UUID)
RETURNS JSONB AS $$
DECLARE v_eb RECORD;
BEGIN
  SELECT * INTO v_eb FROM expressions_besoin WHERE id = p_eb_id;
  IF v_eb.statut != 'validee' THEN     -- 🔴 BUG : 'validee' avec accent + e final
    RETURN jsonb_build_object('valid', false, 'error', 'Expression non validee');
  END IF;
  ...
END;
```

#### Valeur reelle en DB : `'valide'` (sans accent, sans 'e' final)

→ La condition `'valide' != 'validee'` est **TOUJOURS VRAIE** → la fonction retourne toujours une erreur.

#### Fix SQL

```sql
IF v_eb.statut != 'valide' THEN     -- ✅ CORRIGE
```

---

### B.3 RLS — Etat reel

#### Table `expressions_besoin` : **RLS DESACTIVEE**

- Aucune migration ne contient `ALTER TABLE expressions_besoin ENABLE ROW LEVEL SECURITY`
- La policy creee en migration 20260116184854 est **INOPERANTE** car RLS n'est pas activee
- **Consequence** : tout utilisateur authentifie peut SELECT/INSERT/UPDATE/DELETE sans restriction

#### Tables secondaires : policies vides

| Table                           | RLS activee | Policies               | Effet reel     |
| ------------------------------- | ----------- | ---------------------- | -------------- |
| `expression_besoin_attachments` | OUI         | `USING (true)` partout | Aucun controle |
| `expression_besoin_sequences`   | OUI         | `USING (true)` partout | Aucun controle |
| `expression_besoin_validations` | OUI         | `USING (true)` partout | Aucun controle |

#### Fix propose (nouvelle migration)

```sql
-- 1. Activer RLS
ALTER TABLE expressions_besoin ENABLE ROW LEVEL SECURITY;

-- 2. SELECT : DG/DAAF/ADMIN voient tout, agents voient leur direction
CREATE POLICY "eb_select" ON expressions_besoin FOR SELECT USING (
  has_role(auth.uid(), 'ADMIN'::app_role) OR
  has_role(auth.uid(), 'DG'::app_role) OR
  has_role(auth.uid(), 'DAAF'::app_role) OR
  has_role(auth.uid(), 'CB'::app_role) OR
  direction_id IN (
    SELECT direction_id FROM profiles WHERE id = auth.uid()
  )
);

-- 3. INSERT : utilisateur authentifie
CREATE POLICY "eb_insert" ON expressions_besoin FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. UPDATE : createur + validateurs
CREATE POLICY "eb_update" ON expressions_besoin FOR UPDATE USING (
  created_by = auth.uid() OR
  has_role(auth.uid(), 'ADMIN'::app_role) OR
  has_role(auth.uid(), 'DG'::app_role) OR
  has_role(auth.uid(), 'DAAF'::app_role)
);

-- 5. DELETE : createur (brouillon seulement)
CREATE POLICY "eb_delete" ON expressions_besoin FOR DELETE USING (
  created_by = auth.uid() AND statut = 'brouillon'
);
```

---

### B.4 DONNEES — Valeurs distinctes confirmees

#### Statuts en DB (sans accent)

| Statut DB    | Count  | Frontend attend   |
| ------------ | ------ | ----------------- |
| `valide`     | ~3,019 | `"validé"` 🔴     |
| `brouillon`  | ~76    | `"brouillon"` ✅  |
| `rejete`     | ~51    | `"rejeté"` 🔴     |
| `soumis`     | 0      | `"soumis"` ✅     |
| `differe`    | 0      | `"différé"` 🔴    |
| `satisfaite` | 0      | `"satisfaite"` ✅ |

#### Urgences en DB

| Urgence DB | Count        | Frontend attend |
| ---------- | ------------ | --------------- |
| `normale`  | 3,146 (100%) | `"normal"` 🔴   |

#### Numeros en DB

Format reel : `ARTI001240001`, `ARTI002260016`, etc. (format SQL Server)
Aucun numero au format `EB-YYYY-XXXX` (triggers jamais utilises).

#### References orphelines (100% des 3,146 EB)

| Colonne               | Rempli              | Vide         |
| --------------------- | ------------------- | ------------ |
| `direction_id`        | 3,146 (100%)        | 0            |
| `montant_estime`      | 3,143 (99.9%)       | 3            |
| `created_by`          | **0 (0%)**          | 3,146        |
| `imputation_id`       | **0 (0%)**          | 3,146        |
| `note_id`             | **0 (0%)**          | 3,146        |
| `dossier_id`          | **0 (0%)**          | 3,146        |
| `marche_id`           | **0 (0%)**          | 3,146        |
| `ligne_budgetaire_id` | **0 (0%)**          | 3,146        |
| `liste_articles`      | **0 non-vide (0%)** | 3,146 (`[]`) |

---

### B.5 TRIGGER updated_at

**ABSENT.** Aucun trigger `set_updated_at` ou `moddatetime` sur `expressions_besoin`.

Fix :

```sql
CREATE TRIGGER trg_set_expressions_besoin_updated_at
  BEFORE UPDATE ON expressions_besoin
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### B.6 VUE v_expressions_besoin_stats — BUG

La vue filtre sur des valeurs accentuees qui ne matchent pas la DB :

```sql
-- Dans la vue (BUG)
SUM(CASE WHEN statut = 'validé' THEN 1 ELSE 0 END) as valide_count
-- Valeur reelle en DB : 'valide' (sans accent)
-- Resultat : toujours 0
```

---

### B.7 WORKFLOW TRANSITIONS

#### Matrice en base (table `workflow_transitions`)

| De        | Vers    | Action   | Roles                  |
| --------- | ------- | -------- | ---------------------- |
| brouillon | soumis  | SUBMIT   | AGENT, DIRECTOR, ADMIN |
| soumis    | valide  | VALIDATE | SDPM, DAAF, ADMIN      |
| soumis    | rejete  | REJECT   | SDPM, DAAF, ADMIN      |
| soumis    | differe | DEFER    | SDPM, DAAF, ADMIN      |
| differe   | soumis  | RESUBMIT | AGENT, DIRECTOR, ADMIN |

#### Incoherences avec le frontend

| Element             | Backend (DB)              | Frontend (code)                         |
| ------------------- | ------------------------- | --------------------------------------- |
| Validateurs         | SDPM, DAAF, ADMIN         | CHEF_SERVICE, SOUS_DIRECTEUR, DIRECTEUR |
| Etapes validation   | 1 etape (soumis → valide) | 3 etapes multi-niveaux                  |
| Statut `satisfaite` | **Absent** de la matrice  | Present dans le code                    |
| Accents statuts     | Sans accent               | Avec accent                             |

---

## C. DIAGNOSTIC QA

### C.1 Test visuel Playwright

| Element     | Resultat                                                    |
| ----------- | ----------------------------------------------------------- |
| Page charge | OUI (0 erreur console sur tab par defaut)                   |
| Header      | "Expressions de Besoin" + etape 4 + breadcrumb              |
| 3 boutons   | "Exporter Excel" + "Depuis marche" + "Nouvelle EB"          |
| 7 KPIs      | Affiches mais 3 sont FAUX (Validees/Rejetees/Differees = 0) |
| 8 onglets   | Presents avec badges                                        |

### C.2 Test onglets

| Onglet      | Badge   | Donnees                              | Crash                         |
| ----------- | ------- | ------------------------------------ | ----------------------------- |
| A traiter   | 1       | 1 imputation (IMP-2026-DCSTI-0001)   | NON                           |
| Brouillons  | 0       | Vide (correct pour 2026)             | NON                           |
| A valider   | 0       | Vide (correct)                       | NON                           |
| Validees    | **0**   | **Vide (devrait etre 189)**          | NON                           |
| Satisfaites | 0       | Vide (correct)                       | NON                           |
| Rejetees    | **0**   | **Vide (devrait avoir des donnees)** | NON                           |
| Differees   | 0       | Vide (correct)                       | NON                           |
| **Toutes**  | **189** | **N/A**                              | **OUI — CRASH ErrorBoundary** |

### C.3 Formulaire creation (depuis imputation)

| Element                   | Statut                                   |
| ------------------------- | ---------------------------------------- |
| Selection imputation      | ✅ 1 imputation disponible, recherche OK |
| Pre-remplissage objet     | ✅ Depuis imputation                     |
| Pre-remplissage montant   | ✅ Depuis imputation                     |
| Editeur articles          | ✅ Table (Designation, Quantite, Unite)  |
| Prix unitaire             | **ABSENT**                               |
| Montant par ligne         | **ABSENT**                               |
| Montant total auto        | **ABSENT**                               |
| Description/Justification | ✅ Textareas                             |
| Specs techniques          | ✅ Textarea                              |
| Urgence                   | ✅ Select (Normal/Urgent/Tres urgent)    |
| Calendrier debut/fin      | ✅ Date pickers                          |
| Lieu/Delai livraison      | ✅ Champs texte                          |

### C.4 Formulaire creation (depuis marche)

| Element             | Statut                              |
| ------------------- | ----------------------------------- |
| Selection marche    | ✅ 1 marche disponible              |
| Editeur articles    | **ABSENT** (pas dans ce formulaire) |
| Lot numero/intitule | ✅ Champs specifiques               |

### C.5 Export Excel

**CRASHE** — Toast erreur : `"Could not embed because more than one relationship was found for 'expressions_besoin' and 'marches'"`

**Cause** : `useExportBudgetChain.ts` ligne 125, query PostgREST sans hint FK.

### C.6 RBAC

| Test                  | DAAF | Agent DSI                |
| --------------------- | ---- | ------------------------ |
| Acces page            | OUI  | OUI                      |
| Total "Toutes"        | 189  | **189 (identique)**      |
| Imputations a traiter | 1    | 0                        |
| Boutons creation      | OUI  | OUI                      |
| Boutons validation    | OUI  | **OUI (ne devrait pas)** |
| Filtrage direction    | NON  | **NON**                  |

### C.7 Detail EB

**Non testable** — L'onglet "Toutes" crashe, et les onglets filtres (Validees, Rejetees) sont vides a cause du mismatch accents.

---

## D. PLAN DE CORRECTIONS

### P0 — CRITIQUES (Bloquants, a corriger en premier)

#### P0-1 : Fix crash accents + KPIs (5 fichiers)

| Fichier                        | Correction                                                                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ExpressionBesoinList.tsx`     | STATUS_CONFIG : `validé` → `valide`, `rejeté` → `rejete`, `différé` → `differe`. URGENCE_CONFIG : ajouter `normale`. Ajouter fallback safe.                 |
| `ExpressionBesoinDetails.tsx`  | STATUS_CONFIG : meme fix. Ajouter fallback safe.                                                                                                            |
| `useExpressionsBesoin.ts`      | Filtres lignes 491-496 : `"validé"` → `"valide"`, `"rejeté"` → `"rejete"`, `"différé"` → `"differe"`. Mutations lignes 346, 379, 409 : enlever les accents. |
| `BudgetChainExportButton.tsx`  | Filtres statut export : enlever accents.                                                                                                                    |
| `ExpressionBesoinTimeline.tsx` | Verifier et aligner les mappings couleur/statut.                                                                                                            |

#### P0-2 : Fix export Excel (1 fichier)

| Fichier                   | Correction                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `useExportBudgetChain.ts` | Ajouter hint FK : `marche:marches!expressions_besoin_marche_id_fkey(...)`. Retirer `@ts-nocheck`. |

#### P0-3 : Fix SQL backend (2 fonctions)

| Element                      | Correction                                  |
| ---------------------------- | ------------------------------------------- |
| `check_marche_prerequisites` | `'validee'` → `'valide'`                    |
| `v_expressions_besoin_stats` | Aligner les filtres sur valeurs sans accent |

#### P0-4 : Supprimer triggers conflictuels (2 triggers)

| Element                                         | Correction                   |
| ----------------------------------------------- | ---------------------------- |
| `set_expression_besoin_numero` (T1)             | DROP TRIGGER                 |
| `trg_generate_expression_besoin_reference` (T2) | DROP TRIGGER + DROP FUNCTION |
| `trg_generate_eb_numero` (T3)                   | Garder (filet de securite)   |

### P1 — IMPORTANTS (Securite et fonctionnalite)

#### P1-1 : Activer RLS

```sql
ALTER TABLE expressions_besoin ENABLE ROW LEVEL SECURITY;
-- + 4 policies (SELECT/INSERT/UPDATE/DELETE)
```

#### P1-2 : Ajouter trigger updated_at

```sql
CREATE TRIGGER trg_set_expressions_besoin_updated_at
  BEFORE UPDATE ON expressions_besoin
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

#### P1-3 : Enrichir editeur d'articles

- Ajouter `prix_unitaire` et `montant` (calcule) dans `ArticleLigne`
- Ajouter colonnes Prix unitaire et Montant dans le tableau
- Calcul automatique montant total = somme des montants par ligne
- Creer composant `<ArticleEditor />` reutilisable
- Ajouter editeur dans `ExpressionBesoinForm.tsx` (creation depuis marche)

#### P1-4 : Transmettre note_id et ligne_budgetaire_id

Depuis l'imputation source, recuperer et transmettre :

- `note_id` (via la jointure imputation → note_aef)
- `ligne_budgetaire_id` (via la jointure imputation → budget_line)

### P2 — AMELIORATIONS

#### P2-1 : Pagination serveur

```typescript
// useExpressionsBesoin.ts
.range(page * pageSize, (page + 1) * pageSize - 1)
```

#### P2-2 : Validation Zod

```typescript
const expressionBesoinSchema = z.object({
  objet: z.string().min(3, "L'objet doit faire au moins 3 caracteres"),
  montant_estime: z.number().positive('Le montant doit etre positif'),
  urgence: z.enum(['normal', 'normale', 'urgent', 'tres_urgent']),
  articles: z
    .array(
      z.object({
        article: z.string().min(1),
        quantite: z.number().int().positive(),
        unite: z.string(),
        prix_unitaire: z.number().nonnegative().optional(),
      })
    )
    .min(1, 'Au moins un article requis'),
});
```

#### P2-3 : Retirer @ts-nocheck et any

- `useExportBudgetChain.ts` : retirer `@ts-nocheck`, typer correctement
- 5 usages de `any` dans 4 fichiers : remplacer par types precis

---

## E. RESUME EXECUTIF

| Categorie                    | Bugs             | Effort total          |
| ---------------------------- | ---------------- | --------------------- |
| **P0 — Crash + accents**     | B1-B8 (8 bugs)   | **Faible** (2-3h)     |
| **P1 — Securite + articles** | B9-B13 (5 bugs)  | **Moyen** (1-2 jours) |
| **P2 — Qualite**             | B14-B15 (2 bugs) | **Faible** (1h)       |
| **Total**                    | **15 bugs**      | **~2-3 jours**        |

### Ordre d'execution recommande

1. **Prompt 3** : Fix P0 (crash, accents, export, triggers, fonctions SQL)
2. **Prompt 4** : Fix P1-1 et P1-2 (RLS + updated_at)
3. **Prompt 5** : Fix P1-3 (editeur articles enrichi avec prix)
4. **Prompt 6** : Fix P1-4 + P2 (liens, pagination, Zod)
5. **Prompt 7** : UI complete (page, onglets, detail sheet)
6. **Prompt 8** : Suite E2E 50 tests
7. **Prompt 9** : Certification

---

## F. FICHIERS CLES A MODIFIER

| #   | Fichier                                                                   | Modifications                            |
| --- | ------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | `src/components/expression-besoin/ExpressionBesoinList.tsx`               | STATUS_CONFIG, URGENCE_CONFIG, fallbacks |
| 2   | `src/components/expression-besoin/ExpressionBesoinDetails.tsx`            | STATUS_CONFIG, fallback                  |
| 3   | `src/hooks/useExpressionsBesoin.ts`                                       | Filtres statut, mutations statut         |
| 4   | `src/hooks/useExportBudgetChain.ts`                                       | FK hint, retirer @ts-nocheck             |
| 5   | `src/components/export/BudgetChainExportButton.tsx`                       | Filtres statut export                    |
| 6   | `src/components/expression-besoin/ExpressionBesoinTimeline.tsx`           | Verifier mappings                        |
| 7   | `src/components/expression-besoin/ExpressionBesoinFromImputationForm.tsx` | ArticleLigne + prix_unitaire             |
| 8   | `src/components/expression-besoin/ExpressionBesoinForm.tsx`               | Ajouter editeur articles                 |
| 9   | Nouvelle migration SQL                                                    | RLS, triggers, updated_at, fix fonctions |
