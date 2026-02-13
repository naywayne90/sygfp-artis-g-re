# Transition vers le Module Imputation -- SYGFP

**Date** : 13 fevrier 2026
**Pre-requis** : Module Notes AEF certifie (Score 100/100)
**Organisation** : ARTI -- Autorite de Regulation du Transport Interieur (Cote d'Ivoire)
**Systeme** : SYGFP -- Systeme de Gestion Financiere et de Planification

---

## 1. Schema Table `imputations`

### Definition de la table

```sql
CREATE TABLE public.imputations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_aef_id UUID NOT NULL REFERENCES notes_dg(id),
  budget_line_id UUID NOT NULL REFERENCES budget_lines(id),
  exercice INTEGER NOT NULL,
  montant NUMERIC(15,2) NOT NULL CHECK (montant > 0),
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'validee', 'rejetee', 'annulee')),
  imputed_by UUID REFERENCES auth.users(id),
  imputed_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  motif_rejet TEXT,
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Commentaires
COMMENT ON TABLE public.imputations IS 'Imputations budgetaires liees aux notes AEF (etape 3 de la chaine de depense)';
COMMENT ON COLUMN public.imputations.note_aef_id IS 'Reference vers la note AEF imputee (table notes_dg)';
COMMENT ON COLUMN public.imputations.budget_line_id IS 'Ligne budgetaire sur laquelle le montant est impute';
COMMENT ON COLUMN public.imputations.statut IS 'Statut du workflow : en_attente, validee, rejetee, annulee';
COMMENT ON COLUMN public.imputations.imputed_by IS 'Utilisateur DAAF ayant realise l imputation';
COMMENT ON COLUMN public.imputations.validated_by IS 'Controleur budgetaire ayant valide l imputation';
```

### Index de performance

```sql
-- Index sur la note AEF pour les jointures
CREATE INDEX idx_imputations_note_aef
  ON public.imputations(note_aef_id);

-- Index sur la ligne budgetaire pour le calcul du montant engage
CREATE INDEX idx_imputations_budget_line
  ON public.imputations(budget_line_id);

-- Index composite pour le filtrage par exercice et statut
CREATE INDEX idx_imputations_exercice_statut
  ON public.imputations(exercice, statut);

-- Index pour la recherche par utilisateur (imputed_by)
CREATE INDEX idx_imputations_imputed_by
  ON public.imputations(imputed_by);

-- Index composite pour le dashboard CB (en_attente par exercice)
CREATE INDEX idx_imputations_pending
  ON public.imputations(exercice, statut)
  WHERE statut = 'en_attente';
```

### RLS Policies

```sql
-- Activer RLS
ALTER TABLE public.imputations ENABLE ROW LEVEL SECURITY;

-- SELECT : tout utilisateur authentifie peut lire les imputations de son exercice
CREATE POLICY imputations_select ON public.imputations
  FOR SELECT TO authenticated
  USING (true);

-- INSERT : seul le DAAF peut creer des imputations
CREATE POLICY imputations_insert ON public.imputations
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'DAAF'::app_role)
  );

-- UPDATE : DAAF (annulation) ou CB (validation/rejet)
CREATE POLICY imputations_update ON public.imputations
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
  );

-- DELETE : aucun utilisateur ne peut supprimer une imputation
-- Les imputations sont annulees, jamais supprimees (audit trail)
```

### Trigger updated_at

```sql
CREATE TRIGGER set_updated_at_imputations
  BEFORE UPDATE ON public.imputations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

---

## 2. Workflow CB (Controleur Budgetaire)

### Schema du workflow

```
                                    +-----------+
                                    |           |
                   +--------------->| annulee   |
                   |   (DAAF)       |           |
                   |                +-----------+
                   |
+------------+     |     +-----------+     +-----------+
|            |     |     |           |     |           |
| en_attente |-----+---->| validee   |---->| (engage)  |
|            |           |           |     |           |
+------------+           +-----------+     +-----------+
      |                        ^
      |   (CB rejette)         |  (CB valide)
      v                        |
+-----------+                  |
|           |------------------+
| rejetee   |  (DAAF corrige et resoumet)
|           |
+-----------+
```

### Etapes detaillees

**Etape 1 -- Creation de l'imputation (DAAF)**

Le DAAF selectionne une note AEF ayant le statut `a_imputer` et cree une imputation :

- Choix de la ligne budgetaire dans la structure budgetaire de l'exercice
- Saisie du montant a imputer (doit etre > 0 et <= montant disponible)
- Ajout d'un commentaire optionnel
- L'imputation est creee avec le statut `en_attente`
- La note AEF passe au statut `impute`

**Etape 2 -- Verification budgetaire (CB)**

Le Controleur Budgetaire accede a son dashboard dedie :

- File d'attente des imputations `en_attente` triees par date et montant
- Pour chaque imputation, le CB verifie :
  - Coherence du montant avec l'objet de la note AEF
  - Disponibilite effective sur la ligne budgetaire
  - Conformite avec le plan budgetaire de l'exercice
  - Respect des plafonds par direction et par nature de depense

**Etape 3 -- Decision du CB**

Le CB peut :

- **Valider** l'imputation :
  - Statut passe a `validee`
  - `validated_by` et `validated_at` sont renseignes
  - Le montant est ajoute a `budget_lines.montant_engage`
  - La note AEF est prete pour l'etape suivante (Expression de besoin)

- **Rejeter** l'imputation :
  - Statut passe a `rejetee`
  - `motif_rejet` obligatoire (texte explicatif)
  - La note AEF retourne au statut `a_imputer`
  - Le DAAF est notifie pour correction et resoumission

**Etape 4 -- Annulation (DAAF)**

A tout moment avant la validation, le DAAF peut annuler une imputation :

- Statut passe a `annulee`
- La note AEF retourne au statut `a_imputer`
- Tracabilite complete dans l'historique

---

## 3. Impact sur les Tables Existantes

### Table `notes_dg`

```sql
-- Ajout du champ imputation_id pour liaison directe
ALTER TABLE public.notes_dg
  ADD COLUMN imputation_id UUID REFERENCES public.imputations(id);

-- Index sur le champ
CREATE INDEX idx_notes_dg_imputation
  ON public.notes_dg(imputation_id);

-- Commentaire
COMMENT ON COLUMN public.notes_dg.imputation_id
  IS 'Reference vers l imputation budgetaire associee';
```

### Table `budget_lines`

```sql
-- Le champ montant_engage doit etre recalcule via SUM des imputations validees
-- Vue materialisee ou calcul en temps reel

-- Vue pour le disponible budgetaire
CREATE OR REPLACE VIEW v_budget_disponible AS
SELECT
  bl.id,
  bl.code,
  bl.label,
  bl.exercice,
  bl.dotation_initiale,
  COALESCE(bl.dotation_initiale, 0)
    + COALESCE(bl.virements_positifs, 0)
    - COALESCE(bl.virements_negatifs, 0) AS dotation_ajustee,
  COALESCE(SUM(i.montant) FILTER (WHERE i.statut = 'validee'), 0) AS montant_engage,
  COALESCE(bl.dotation_initiale, 0)
    + COALESCE(bl.virements_positifs, 0)
    - COALESCE(bl.virements_negatifs, 0)
    - COALESCE(SUM(i.montant) FILTER (WHERE i.statut = 'validee'), 0) AS disponible
FROM budget_lines bl
LEFT JOIN imputations i ON i.budget_line_id = bl.id
GROUP BY bl.id, bl.code, bl.label, bl.exercice,
         bl.dotation_initiale, bl.virements_positifs, bl.virements_negatifs;

-- Revoquer l'acces anon
REVOKE ALL ON v_budget_disponible FROM anon;
```

### RLS impactees

```sql
-- Le CB doit pouvoir lire les notes_dg liees aux imputations qu'il traite
-- Ajout d'une policy SELECT sur notes_dg pour le profil CB

CREATE POLICY notes_dg_select_cb ON public.notes_dg
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'CB'::app_role)
    AND statut IN ('a_imputer', 'impute')
  );
```

### Notifications

```sql
-- Insertion automatique de notification lors du changement de statut d'une imputation
CREATE OR REPLACE FUNCTION notify_imputation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notification au CB quand une imputation est creee
  IF NEW.statut = 'en_attente' AND (OLD IS NULL OR OLD.statut != 'en_attente') THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT u.id, 'imputation_nouvelle',
           'Nouvelle imputation a verifier',
           'Une imputation de ' || NEW.montant || ' FCFA attend votre verification.',
           '/imputations/' || NEW.id
    FROM user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.role = 'CB';
  END IF;

  -- Notification au DAAF quand une imputation est validee ou rejetee
  IF NEW.statut IN ('validee', 'rejetee') AND OLD.statut = 'en_attente' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.imputed_by,
      CASE WHEN NEW.statut = 'validee' THEN 'imputation_validee' ELSE 'imputation_rejetee' END,
      CASE WHEN NEW.statut = 'validee' THEN 'Imputation validee' ELSE 'Imputation rejetee' END,
      CASE WHEN NEW.statut = 'validee'
        THEN 'Votre imputation de ' || NEW.montant || ' FCFA a ete validee par le CB.'
        ELSE 'Votre imputation a ete rejetee. Motif : ' || COALESCE(NEW.motif_rejet, 'Non precise')
      END,
      '/imputations/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_imputation_status_change
  AFTER INSERT OR UPDATE OF statut ON public.imputations
  FOR EACH ROW
  EXECUTE FUNCTION notify_imputation_status_change();
```

---

## 4. Recommandations pour les 8 Prochains Prompts

### Prompt 9 : Structure Table Imputations

**Objectif** : Poser les fondations du module Imputation en base de donnees.

- Creer la table `imputations` avec RLS completes (SELECT/INSERT/UPDATE)
- Appliquer la migration avec indexes de performance
- Generer les types TypeScript correspondants (`ImputationEntity`, `ImputationCounts`, `ImputationFilters`)
- Creer le service `imputationsService.ts` avec les operations CRUD de base
- Ajouter le champ `imputation_id` sur `notes_dg`
- Tester les policies RLS avec les differents profils

**Fichiers a creer** :

- `supabase/migrations/20260215_prompt9_table_imputations.sql`
- `src/lib/imputations/types.ts`
- `src/lib/imputations/constants.ts`
- `src/lib/imputations/imputationsService.ts`

---

### Prompt 10 : Formulaire d'Imputation

**Objectif** : Permettre au DAAF de creer une imputation depuis une note AEF validee.

- Page `ImputationForm.tsx` avec selection de la ligne budgetaire
- Calcul en temps reel du disponible budgetaire (appel RPC)
- Validation Zod : montant > 0, montant <= disponible, ligne budgetaire obligatoire
- Hook `useImputations.ts` avec mutation createImputation
- Composant de selection de ligne budgetaire avec recherche et affichage du disponible
- Integration dans le workflow : bouton "Imputer" sur les notes AEF `a_imputer`

**Fichiers a creer** :

- `src/pages/ImputationForm.tsx`
- `src/hooks/useImputations.ts`
- `src/components/imputations/BudgetLineSelector.tsx`
- `src/components/imputations/MontantDisponibleBadge.tsx`

---

### Prompt 11 : Dashboard Controleur Budgetaire

**Objectif** : Fournir au CB un tableau de bord dedie pour traiter les imputations.

- Page `DashboardCB.tsx` avec acces restreint au profil CB
- KPIs en haut de page : en attente, validees ce mois, rejetees ce mois, montant total engage
- File d'attente des imputations `en_attente` avec tri par montant et date
- RPC `count_imputations_by_statut` avec SECURITY INVOKER
- Vue `v_imputations_detail` avec jointures notes_dg, budget_lines, profiles
- Filtres par exercice, direction, tranche de montant

**Fichiers a creer** :

- `src/pages/DashboardCB.tsx`
- `src/hooks/useImputationsList.ts`
- `src/components/imputations/ImputationKPIs.tsx`
- `src/components/imputations/ImputationQueue.tsx`

---

### Prompt 12 : Workflow Validation CB

**Objectif** : Implementer le processus complet de validation/rejet par le CB.

- Dialog `ImputationValidateDialog.tsx` avec confirmation et commentaire
- Dialog `ImputationRejectDialog.tsx` avec motif de rejet obligatoire
- Mise a jour automatique de `budget_lines.montant_engage` lors de la validation
- Trigger de notification au DAAF lors du changement de statut
- Retour automatique de la note AEF au statut `a_imputer` en cas de rejet
- Tests unitaires couvrant tous les cas de workflow
- Enforcement cote serveur (trigger PostgreSQL verifiant les transitions de statut)

**Fichiers a creer** :

- `src/components/imputations/ImputationValidateDialog.tsx`
- `src/components/imputations/ImputationRejectDialog.tsx`
- `supabase/migrations/20260216_prompt12_workflow_cb.sql`

---

### Prompt 13 : Exports Imputations

**Objectif** : Fournir les exports et rapports de consommation budgetaire.

- Hook `useImputationsExport.ts` pour Excel/PDF/CSV
- Rapport de consommation budgetaire par ligne et par direction
- Graphiques camembert par nature de depense et par direction
- Colonnes d'export : numero note AEF, objet, direction, ligne budgetaire, montant, statut, date
- QR code de verification sur les PDF
- Branding ARTI sur tous les documents exportes

**Fichiers a creer** :

- `src/hooks/useImputationsExport.ts`
- `src/components/imputations/BudgetConsumptionChart.tsx`
- `src/components/imputations/ImputationPDFTemplate.tsx`

---

### Prompt 14 : Expression de Besoin (Etape 4)

**Objectif** : Implementer l'etape 4 de la chaine de depense.

- Table `expressions_besoin` avec liaison `imputation_id`
- Formulaire de creation avec details techniques du besoin
- Workflow : brouillon -> soumis -> valide -> approuve
- Pieces jointes (cahier des charges, specifications techniques)
- Validation par le chef de service puis le directeur
- RLS par direction et niveau hierarchique

**Fichiers a creer** :

- `supabase/migrations/20260217_prompt14_expressions_besoin.sql`
- `src/lib/expressions-besoin/types.ts`
- `src/pages/ExpressionsBesoin.tsx`
- `src/components/expressions-besoin/ExpressionBesoinForm.tsx`

---

### Prompt 15 : Passation de Marche (Etape 5)

**Objectif** : Implementer l'etape 5 de la chaine de depense.

- Table `marches` avec liaison vers `expressions_besoin`
- Workflow d'approbation multi-niveaux (commission des marches, DG)
- Gestion des documents contractuels (contrat, PV, attestations)
- Types de marche : gre a gre, appel d'offres, consultation restreinte
- Seuils de validation selon le montant
- Numerotation automatique des marches

**Fichiers a creer** :

- `supabase/migrations/20260218_prompt15_marches.sql`
- `src/lib/marches/types.ts`
- `src/pages/Marches.tsx`
- `src/components/marches/MarcheForm.tsx`

---

### Prompt 16 : Engagement Comptable (Etape 6)

**Objectif** : Implementer l'etape 6 de la chaine de depense.

- Table `engagements` liee aux marches et aux lignes budgetaires
- Numerotation automatique sequentielle par exercice
- Controle budgetaire multi-niveaux (montant engage vs disponible)
- Visa du controleur financier pour les engagements au-dessus du seuil
- PDF d'engagement avec signature electronique
- Dashboard des engagements avec suivi par ligne budgetaire

**Fichiers a creer** :

- `supabase/migrations/20260219_prompt16_engagements_v2.sql`
- `src/lib/engagements/types.ts`
- `src/pages/EngagementsV2.tsx`
- `src/components/engagements/EngagementForm.tsx`

---

## 5. Diagramme de la Chaine de Depense

### Vue d'ensemble des 9 etapes

```
  CERTIFIE              CERTIFIE              PROCHAIN
 +----------+         +----------+         +-------------+
 |          |         |          |         |             |
 | Note SEF |-------->| Note AEF |-------->| Imputation  |
 | (Etape 1)|         | (Etape 2)|         | (Etape 3)   |
 |          |         |          |         |             |
 +----------+         +----------+         +-------------+
                                                  |
                                                  v
                                           +-------------+
                                           |  Expression  |
                                           |  de Besoin   |
                                           |  (Etape 4)   |
                                           +-------------+
                                                  |
                                                  v
                                           +-------------+
                                           |  Passation   |
                                           |  de Marche   |
                                           |  (Etape 5)   |
                                           +-------------+
                                                  |
                                                  v
                                           +-------------+
                                           |  Engagement  |
                                           |  Comptable   |
                                           |  (Etape 6)   |
                                           +-------------+
                                                  |
                                                  v
                                           +-------------+
                                           | Liquidation  |
                                           | (Etape 7)    |
                                           +-------------+
                                                  |
                                                  v
                                           +-------------+
                                           |Ordonnancement|
                                           | (Etape 8)    |
                                           +-------------+
                                                  |
                                                  v
                                           +-------------+
                                           |  Reglement   |
                                           |  (Etape 9)   |
                                           +-------------+
```

### Legende

| Etape                   | Module             | Statut               | Prompts                       |
| ----------------------- | ------------------ | -------------------- | ----------------------------- |
| 1. Note SEF             | notes_sef          | **CERTIFIE**         | Prompts 1-8 (cycle precedent) |
| 2. Note AEF             | notes_dg           | **CERTIFIE**         | Prompts 1-8 (cycle actuel)    |
| 3. Imputation           | imputations        | **PROCHAIN**         | Prompts 9-13                  |
| 4. Expression de Besoin | expressions_besoin | A faire              | Prompt 14                     |
| 5. Passation de Marche  | marches            | A faire              | Prompt 15                     |
| 6. Engagement           | engagements        | A faire              | Prompt 16                     |
| 7. Liquidation          | liquidations       | Existant (migration) | A moderniser                  |
| 8. Ordonnancement       | ordonnancements    | Existant (migration) | A moderniser                  |
| 9. Reglement            | reglements         | Existant (migration) | A moderniser                  |

### Flux de donnees

```
Note SEF ──[note_sef_id]──> Note AEF ──[note_aef_id]──> Imputation
                                                              |
                                                    [imputation_id]
                                                              |
                                                              v
                                                     Expression Besoin
                                                              |
                                                    [expression_id]
                                                              |
                                                              v
                                                         Marche
                                                              |
                                                       [marche_id]
                                                              |
                                                              v
                                                       Engagement
                                                              |
                                                    [engagement_id]
                                                              |
                                                              v
                                                       Liquidation
                                                              |
                                                   [liquidation_id]
                                                              |
                                                              v
                                                    Ordonnancement
                                                              |
                                                 [ordonnancement_id]
                                                              |
                                                              v
                                                        Reglement
```

---

## 6. Risques et Points d'Attention

### Risques techniques

| Risque                                    | Impact                                         | Mitigation                                           |
| ----------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Concurrence sur les montants budgetaires  | Deux imputations simultanees sur la meme ligne | Utiliser `SELECT ... FOR UPDATE` dans la transaction |
| Performance des calculs de disponible     | Lenteur si beaucoup d'imputations              | Vue materialisee avec refresh periodique             |
| Coherence des donnees en cas d'annulation | Montant engage desynchronise                   | Trigger AFTER UPDATE pour recalculer automatiquement |

### Points d'attention fonctionnels

| Point                | Description                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Double imputation    | Empecher l'imputation d'une note AEF deja imputee (contrainte UNIQUE sur `imputations.note_aef_id` + `statut != 'annulee'`) |
| Plafonds budgetaires | Certaines lignes ont des plafonds par nature de depense a respecter                                                         |
| Exercice clos        | Interdire toute imputation sur un exercice cloture                                                                          |
| Virements de credits | Un virement peut modifier le disponible en cours de traitement                                                              |

### Pre-requis non techniques

| Pre-requis                                 | Responsable    | Statut      |
| ------------------------------------------ | -------------- | ----------- |
| Validation de la structure budgetaire 2026 | DAAF           | A verifier  |
| Liste des lignes budgetaires actives       | DAAF           | Existant    |
| Definition des seuils de validation CB     | Direction      | A definir   |
| Formation des utilisateurs CB              | Chef de projet | A planifier |

---

## 7. Estimation de Charge

| Prompt    | Module                  | Complexite | Estimation         |
| --------- | ----------------------- | ---------- | ------------------ |
| Prompt 9  | Table + Types + Service | Moyenne    | 1 session          |
| Prompt 10 | Formulaire Imputation   | Haute      | 1-2 sessions       |
| Prompt 11 | Dashboard CB            | Moyenne    | 1 session          |
| Prompt 12 | Workflow CB             | Haute      | 1-2 sessions       |
| Prompt 13 | Exports                 | Moyenne    | 1 session          |
| Prompt 14 | Expression de Besoin    | Haute      | 2 sessions         |
| Prompt 15 | Passation de Marche     | Haute      | 2 sessions         |
| Prompt 16 | Engagement              | Tres haute | 2-3 sessions       |
| **Total** |                         |            | **10-14 sessions** |

---

_Document genere automatiquement par Claude Code -- Prompt 8 Certification_
_ARTI -- Autorite de Regulation du Transport Interieur -- Cote d'Ivoire_
