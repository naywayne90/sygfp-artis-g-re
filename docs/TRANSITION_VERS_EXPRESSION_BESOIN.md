# TRANSITION VERS MODULE EXPRESSION DE BESOIN

**Date** : 16 fevrier 2026
**Module sortant** : Imputation Budgetaire (Etape 3/9) - CERTIFIE
**Module entrant** : Expression de Besoin (Etape 4/9)

---

## 1. POSITION DANS LA CHAINE DE DEPENSE

```
1. Note SEF        ✅ Certifie
2. Note AEF        ✅ Certifie
3. Imputation      ✅ CERTIFIE (Prompt 10)
4. Expression      ⬅ PROCHAIN MODULE
5. Passation       ○ A faire
6. Engagement      ○ A faire (donnees migrees)
7. Liquidation     ○ A faire (donnees migrees)
8. Ordonnancement  ○ A faire (donnees migrees)
9. Reglement       ○ A faire
```

---

## 2. LIEN IMPUTATION → EXPRESSION BESOIN

### 2.1 Point de depart

Depuis une imputation validee, le bouton **"Creer expression de besoin"** navigue vers :

```
/execution/expression-besoin?sourceImputation={imputation_id}
```

### 2.2 Donnees transmises

L'imputation validee fournit :

- `imputation_id` : Lien vers l'imputation source
- `objet` : Herite de l'imputation
- `montant_estime` : Montant de l'imputation
- `direction_id` : Direction de l'imputation
- `dossier_id` : Dossier cree lors de l'imputation
- `ligne_budgetaire_id` : Ligne budgetaire imputee

### 2.3 Composant existant

`ExpressionBesoinFromImputationForm.tsx` gere la creation depuis une imputation avec pre-remplissage automatique.

---

## 3. SCHEMA TABLE `expressions_besoin`

### 3.1 Colonnes existantes (verified from Supabase types)

```sql
CREATE TABLE expressions_besoin (
  -- Identite
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                   TEXT,              -- Auto-genere (EB-YYYY-DIR-XXXX)
  objet                    TEXT NOT NULL,
  description              TEXT,
  justification            TEXT,
  specifications           TEXT,

  -- Planning
  calendrier_debut         DATE,
  calendrier_fin           DATE,

  -- Financier
  montant_estime           NUMERIC,
  quantite                 INTEGER,
  unite                    TEXT,
  urgence                  TEXT,              -- 'urgente'|'haute'|'normale'|'basse'

  -- Lot (marche)
  numero_lot               INTEGER,
  intitule_lot             TEXT,

  -- Procedure
  type_procedure           TEXT,              -- Type de passation
  criteres_evaluation      TEXT,              -- Criteres d'evaluation

  -- Livraison
  lieu_livraison           TEXT,
  delai_livraison          TEXT,
  contact_livraison        TEXT,

  -- Articles
  liste_articles           JSONB,             -- Liste detaillee articles/prestations

  -- Liens
  exercice                 INTEGER,
  marche_id                UUID REFERENCES marches(id),
  imputation_id            UUID REFERENCES imputations(id),
  dossier_id               UUID REFERENCES dossiers(id),
  direction_id             UUID REFERENCES directions(id),
  ligne_budgetaire_id      UUID REFERENCES budget_lines(id),
  note_id                  UUID REFERENCES notes_dg(id),

  -- Workflow
  statut                   TEXT DEFAULT 'brouillon',
  submitted_at             TIMESTAMPTZ,
  validated_at             TIMESTAMPTZ,
  validated_by             UUID REFERENCES profiles(id),
  rejection_reason         TEXT,
  date_differe             DATE,
  motif_differe            TEXT,
  differe_by               UUID REFERENCES profiles(id),
  deadline_correction      DATE,
  current_validation_step  INTEGER DEFAULT 1,
  validation_status        TEXT,
  code_locked              BOOLEAN DEFAULT FALSE,

  -- Audit
  created_by               UUID REFERENCES auth.users(id),
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Tables liees

```sql
-- Sequence de numerotation
expression_besoin_sequences (id, annee, dernier_numero, updated_at)

-- Pieces jointes
expression_besoin_attachments (id, expression_besoin_id, ...)

-- Validations multi-etapes
expression_besoin_validations (id, expression_besoin_id, step_order, role, status, ...)
```

---

## 4. WORKFLOW EXPRESSION DE BESOIN

### 4.1 Qui cree ?

- **DAAF/CB** : Cree depuis une imputation validee
- **Agent** : Peut creer pour sa direction (si autorise)
- La creation peut etre directe ou depuis une imputation (`sourceImputation`)

### 4.2 Statuts

```
brouillon → a_valider → valide → (vers Passation Marche)
                       → rejete
                       → differe → a_valider
```

### 4.3 Qui valide ?

Validation multi-etapes (`expression_besoin_validations`) :

| Etape | Role            | Description             |
| ----- | --------------- | ----------------------- |
| 1     | Chef de service | Validation technique    |
| 2     | Directeur       | Validation hierarchique |
| 3     | DAAF            | Validation budgetaire   |
| 4     | DG              | Validation finale       |

### 4.4 Contenu de l'expression

1. **Identification** : Objet, description, justification
2. **Specifications** : Cahier des charges, criteres
3. **Planning** : Calendrier debut/fin, delais
4. **Financier** : Montant estime, quantites, unites
5. **Articles** : Liste detaillee (JSONB)
6. **Livraison** : Lieu, delai, contact

---

## 5. ETAT ACTUEL DU CODE EXPRESSION BESOIN

### 5.1 Fichiers existants

| Type      | Fichier                                    | Etat   |
| --------- | ------------------------------------------ | ------ |
| Page      | `src/pages/execution/ExpressionBesoin.tsx` | Existe |
| Hook      | `src/hooks/useExpressionsBesoin.ts`        | Existe |
| Composant | `ExpressionBesoinForm.tsx`                 | Existe |
| Composant | `ExpressionBesoinFromImputationForm.tsx`   | Existe |
| Composant | `ExpressionBesoinList.tsx`                 | Existe |
| Composant | `ExpressionBesoinDetails.tsx`              | Existe |
| Composant | `ExpressionBesoinValidateDialog.tsx`       | Existe |
| Composant | `ExpressionBesoinRejectDialog.tsx`         | Existe |
| Composant | `ExpressionBesoinDeferDialog.tsx`          | Existe |
| Composant | `ExpressionBesoinTimeline.tsx`             | Existe |
| Table DB  | `expressions_besoin`                       | Existe |

### 5.2 Evaluation

Le module Expression de Besoin a deja une **base de code significative**. Il faut auditer, tester et completer plutot que construire de zero.

---

## 6. RECOMMANDATIONS : 10 PROCHAINS PROMPTS

### Prompt 11 — Audit technique Expression Besoin

- Lire tous les fichiers existants
- Inventorier les fonctionnalites implementees vs manquantes
- Verifier les types TypeScript
- Verifier les RLS policies
- Identifier les gaps

### Prompt 12 — RLS + Migrations Expression Besoin

- Corriger/completer les RLS policies
- Ajouter indexes de performance
- Verifier les triggers (numerotation, audit)
- Tester RLS avec 3 profils

### Prompt 13 — Page Expression Besoin : UI complete

- 5 onglets (Brouillons, A valider, Validees, Differees, Rejetees)
- KPIs par statut
- Recherche + filtres
- Pagination serveur
- WorkflowStepIndicator etape 4

### Prompt 14 — Formulaire creation Expression Besoin

- Pre-remplissage depuis imputation
- Validation Zod des champs obligatoires
- Liste articles (JSONB) avec ajout/suppression dynamique
- Calcul montant total depuis articles
- Selection type de procedure

### Prompt 15 — Validation multi-etapes

- Implementer le workflow 4 etapes
- Chaque etape = role specifique
- Boutons valider/differer/rejeter par etape
- Notifications a chaque etape
- Progress bar de validation

### Prompt 16 — Detail Sheet Expression Besoin

- Sheet avec 5 tabs (Infos, Articles, Budget, PJ, Chaine)
- QR code pour expressions validees
- Lien vers imputation source
- Journal d'audit
- Actions contextuelles par statut

### Prompt 17 — Exports + Pieces jointes

- Export Excel/CSV/PDF
- Upload pieces jointes (cahier des charges, specs)
- Visualisation inline des PJ
- Telechargement

### Prompt 18 — Integration Passation Marche

- Bouton "Creer passation" depuis expression validee
- Pre-remplissage donnees marche
- Lien bidirectionnel Expression ↔ Passation

### Prompt 19 — Suite E2E 50 tests Expression Besoin

- 10 sections (meme structure que Imputation)
- Corriger les bugs trouves
- Verifier RBAC + non-regression

### Prompt 20 — Certification Expression Besoin

- Tous tests passent
- Build + TypeScript = 0 erreurs
- Documents CERTIFICATION + TRANSITION vers Passation

---

## 7. POINTS D'ATTENTION

### 7.1 Donnees migrables

Verifier si des expressions de besoin existent dans SQL Server (`eARTI_DB2`). Si oui, planifier la migration.

### 7.2 Coherence chaine

L'expression de besoin doit maintenir la coherence :

- **Montant** ≤ montant imputation source
- **Direction** = direction imputation source
- **Ligne budgetaire** = ligne imputation source
- **Dossier** = meme dossier que l'imputation

### 7.3 Validation multi-etapes

Le systeme de validation multi-etapes (`expression_besoin_validations`) est plus complexe que l'imputation (validation simple). Prevoir :

- UI pour chaque etape
- Notifications differenciees
- Rollback si rejet a une etape intermediaire

### 7.4 Articles (JSONB)

Le champ `liste_articles` necessite un editeur dynamique :

```json
[
  {
    "designation": "Ordinateur portable",
    "quantite": 10,
    "prix_unitaire": 500000,
    "montant": 5000000,
    "specifications": "RAM 16Go, SSD 512Go"
  }
]
```

---

## 8. RESUME

| Element                | Etat                             |
| ---------------------- | -------------------------------- |
| Table DB               | Existe (35+ colonnes)            |
| Page                   | Existe (a auditer)               |
| Hook                   | Existe (a auditer)               |
| 8 Composants           | Existent (a auditer)             |
| RLS                    | A verifier/completer             |
| Tests E2E              | A creer (50 tests)               |
| Migration donnees      | A evaluer                        |
| Integration Imputation | Fonctionnelle (sourceImputation) |

**Prochaine action** : Prompt 11 — Audit technique complet du module Expression de Besoin.
