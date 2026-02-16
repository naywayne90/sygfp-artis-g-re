# Transition vers le Module Passation de Marche -- SYGFP

**Date** : 16 fevrier 2026
**Module sortant** : Expression de Besoin (Etape 4/9) - Prompts 1-10 termines
**Module entrant** : Passation de Marche (Etape 5/9)
**Organisation** : ARTI -- Autorite de Regulation du Transport Interieur (Cote d'Ivoire)
**Systeme** : SYGFP -- Systeme de Gestion Financiere et de Planification

---

## Position dans la chaine de depense

```
1. Note SEF        ✅ Certifie
2. Note AEF        ✅ Certifie
3. Imputation      ✅ Certifie
4. Expression      ✅ Prompts 1-10 termines
5. Passation       ⬅ PROCHAIN MODULE
6. Engagement      ○ A faire (donnees migrees)
7. Liquidation     ○ A faire (donnees migrees)
8. Ordonnancement  ○ A faire (donnees migrees)
9. Reglement       ○ A faire
```

---

## 1. Schema table `marches`

### Definition de la table

```sql
CREATE TABLE marches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  expression_besoin_id UUID REFERENCES expressions_besoin(id),
  type_marche TEXT NOT NULL CHECK (type_marche IN (
    'appel_offres',
    'gre_a_gre',
    'consultation_restreinte',
    'demande_cotation',
    'marche_simplifie'
  )),
  objet TEXT NOT NULL,
  montant_estime NUMERIC,
  montant_adjuge NUMERIC,
  date_lancement DATE,
  date_cloture DATE,
  date_attribution DATE,
  statut TEXT DEFAULT 'en_preparation' CHECK (statut IN (
    'en_preparation',
    'lance',
    'en_evaluation',
    'attribue',
    'signe',
    'annule'
  )),
  prestataire_id UUID REFERENCES prestataires(id),
  note_technique NUMERIC(5,2),
  note_financiere NUMERIC(5,2),
  note_finale NUMERIC(5,2),
  commission_ouverture JSONB,
  commission_evaluation JSONB,
  pieces_jointes JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  exercice_id UUID REFERENCES exercices(id)
);
```

### Commentaires

```sql
COMMENT ON TABLE marches IS 'Marches publics lies aux expressions de besoin (etape 5 de la chaine de depense)';
COMMENT ON COLUMN marches.reference IS 'Reference unique du marche (ex: PM-2026-DSI-0001)';
COMMENT ON COLUMN marches.expression_besoin_id IS 'Reference vers l expression de besoin source';
COMMENT ON COLUMN marches.type_marche IS 'Mode de passation : appel_offres, gre_a_gre, consultation_restreinte, demande_cotation, marche_simplifie';
COMMENT ON COLUMN marches.statut IS 'Statut du workflow : en_preparation, lance, en_evaluation, attribue, signe, annule';
COMMENT ON COLUMN marches.montant_estime IS 'Montant estime herite de l expression de besoin';
COMMENT ON COLUMN marches.montant_adjuge IS 'Montant final apres attribution au prestataire';
COMMENT ON COLUMN marches.note_finale IS 'Note ponderee : technique * 0.7 + financiere * 0.3';
COMMENT ON COLUMN marches.commission_ouverture IS 'Composition de la commission d ouverture des plis (JSONB)';
COMMENT ON COLUMN marches.commission_evaluation IS 'Composition de la commission d evaluation des offres (JSONB)';
```

### Index de performance

```sql
-- Index sur l'expression de besoin source pour les jointures
CREATE INDEX idx_marches_expression_besoin
  ON marches(expression_besoin_id);

-- Index sur le statut pour le filtrage
CREATE INDEX idx_marches_statut
  ON marches(statut);

-- Index sur le type de marche
CREATE INDEX idx_marches_type
  ON marches(type_marche);

-- Index sur le prestataire attribue
CREATE INDEX idx_marches_prestataire
  ON marches(prestataire_id);

-- Index sur l'exercice pour le filtrage par annee
CREATE INDEX idx_marches_exercice
  ON marches(exercice_id);

-- Index composite pour la recherche par exercice et statut
CREATE INDEX idx_marches_exercice_statut
  ON marches(exercice_id, statut);

-- Index pour le tri par date de lancement
CREATE INDEX idx_marches_date_lancement
  ON marches(date_lancement DESC);
```

### Trigger updated_at

```sql
CREATE TRIGGER set_marches_updated_at
  BEFORE UPDATE ON marches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Audit trail

```sql
CREATE TRIGGER audit_marches_changes
  AFTER INSERT OR UPDATE OR DELETE ON marches
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();
```

---

## 2. Procedures de passation (5 modes)

### 2.1 Appel d'offres ouvert

Procedure complete pour les marches au-dessus des seuils reglementaires.

| Etape | Action                                             | Acteur                   | Delai indicatif |
| ----- | -------------------------------------------------- | ------------------------ | --------------- |
| 1     | Elaboration du dossier d'appel d'offres (DAO)      | Service demandeur + DAAF | 5-10 jours      |
| 2     | Publication de l'avis (journal officiel, site web) | DAAF                     | 1 jour          |
| 3     | Periode de soumission                              | Soumissionnaires         | 30-45 jours     |
| 4     | Ouverture des plis (commission d'ouverture)        | Commission               | 1 jour          |
| 5     | Evaluation technique (commission d'evaluation)     | Commission               | 5-10 jours      |
| 6     | Evaluation financiere                              | Commission               | 3-5 jours       |
| 7     | Rapport d'evaluation et recommandation             | Commission               | 2 jours         |
| 8     | Attribution par la DG                              | DG                       | 1-3 jours       |
| 9     | Notification au prestataire retenu                 | DAAF                     | 1 jour          |
| 10    | Signature du contrat                               | DG + Prestataire         | 5-10 jours      |

### 2.2 Gre a gre

Procedure exceptionnelle necessitant une justification ecrite.

| Etape | Action                                                         | Acteur            |
| ----- | -------------------------------------------------------------- | ----------------- |
| 1     | Redaction de la justification ecrite (urgence, monopole, etc.) | Service demandeur |
| 2     | Validation de la justification                                 | DAAF              |
| 3     | Accord du DG                                                   | DG                |
| 4     | Negociation directe avec le fournisseur                        | DAAF + Service    |
| 5     | Etablissement du contrat                                       | DAAF              |
| 6     | Signature                                                      | DG + Prestataire  |

**Cas autorises** : urgence averee, fournisseur unique (monopole), secret defense, prestations complementaires.

### 2.3 Consultation restreinte

Mise en concurrence limitee a un panel preselectionne.

| Etape | Action                                       | Acteur         |
| ----- | -------------------------------------------- | -------------- |
| 1     | Preselection de 3 a 5 fournisseurs qualifies | DAAF + Service |
| 2     | Envoi des dossiers de consultation           | DAAF           |
| 3     | Reception des offres                         | DAAF           |
| 4     | Evaluation et comparaison                    | Commission     |
| 5     | Attribution                                  | DG             |
| 6     | Notification et signature                    | DAAF           |

### 2.4 Demande de cotation

Pour les marches en dessous du seuil reglementaire.

| Etape | Action                                    | Acteur            |
| ----- | ----------------------------------------- | ----------------- |
| 1     | Demande de devis a minimum 3 fournisseurs | Service demandeur |
| 2     | Reception et comparaison des devis        | Service + DAAF    |
| 3     | Tableau comparatif des offres             | DAAF              |
| 4     | Selection du moins-disant conforme        | DAAF              |
| 5     | Bon de commande ou contrat simplifie      | DAAF              |

**Condition** : montant inferieur au seuil de passation defini par la reglementation en vigueur.

### 2.5 Marche simplifie

Procedure allegee pour les fournitures courantes de faible montant.

| Etape | Action                                              | Acteur            |
| ----- | --------------------------------------------------- | ----------------- |
| 1     | Identification du besoin (montant < 5 000 000 FCFA) | Service demandeur |
| 2     | Collecte de 3 devis minimum                         | Service demandeur |
| 3     | Validation DAAF                                     | DAAF              |
| 4     | Emission du bon de commande                         | DAAF              |

**Seuil** : montant total inferieur a 5 000 000 FCFA (cinq millions de francs CFA).

---

## 3. Lien Expression de Besoin vers Marche

### 3.1 Point de depart

Depuis la liste des expressions de besoin, l'onglet **"Validees"** affiche les EB ayant le statut `validee`. Le bouton **"Creer passation marche"** navigue vers :

```
/execution/passation-marche?sourceEB={eb.id}
```

### 3.2 Donnees transmises

L'expression de besoin validee fournit au marche :

| Champ EB        | Champ Marche           | Description                  |
| --------------- | ---------------------- | ---------------------------- |
| `id`            | `expression_besoin_id` | Lien de reference            |
| `objet`         | `objet`                | Objet de la depense          |
| `montant_total` | `montant_estime`       | Montant total des articles   |
| `direction_id`  | _(contexte)_           | Direction demandeuse         |
| `exercice_id`   | `exercice_id`          | Exercice budgetaire          |
| `articles[]`    | _(lots du marche)_     | Articles importes comme lots |

### 3.3 Regles metier

- **Seules les EB validees** (statut = `validee`) peuvent etre liees a un marche.
- Une EB ne peut etre liee qu'a **un seul marche** (relation 1:1).
- Les **articles de l'EB** sont importes automatiquement comme lots du marche, avec les quantites et prix unitaires.
- Le **montant estime** du marche est pre-rempli avec le montant total de l'EB.
- La **reference du marche** est generee automatiquement au format `PM-{ANNEE}-{DIR}-{SEQUENCE}`.

### 3.4 Composant de liaison

Le formulaire de creation de marche depuis une EB doit :

1. Recuperer les details de l'EB via `expression_besoin_id`
2. Pre-remplir les champs objet, montant estime, exercice
3. Importer les articles comme lots
4. Permettre la selection du type de marche
5. Valider que l'EB n'est pas deja liee a un marche existant

---

## 4. Notation des offres

### 4.1 Formule de notation

```
note_finale = (note_technique * 0.7) + (note_financiere * 0.3)
```

| Composante      | Ponderation | Criteres                                                                                               |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| Note technique  | 70%         | Conformite cahier des charges, qualifications du personnel, methodologie proposee, delais de livraison |
| Note financiere | 30%         | Offre la moins-disante avec ponderation qualite-prix                                                   |

### 4.2 Grille de notation technique

| Critere                          | Ponderation | Bareme      |
| -------------------------------- | ----------- | ----------- |
| Conformite au cahier des charges | 30/100      | 0-30 points |
| Qualifications et references     | 25/100      | 0-25 points |
| Methodologie et plan de travail  | 25/100      | 0-25 points |
| Delais de livraison/execution    | 20/100      | 0-20 points |

### 4.3 Seuil d'admissibilite

- **Note technique minimale** : 70/100
- Les offres dont la note technique est inferieure a 70/100 sont **eliminees** avant l'evaluation financiere.
- Seules les offres techniquement admissibles sont evaluees sur le plan financier.

### 4.4 Calcul de la note financiere

```
note_financiere = (montant_offre_moins_disante / montant_offre_evaluee) * 100
```

L'offre financiere la moins-disante parmi les offres techniquement admissibles obtient 100/100.

### 4.5 Exemple de notation

| Soumissionnaire | Note technique | Admissible | Note financiere | Note finale                     |
| --------------- | -------------- | ---------- | --------------- | ------------------------------- |
| Societe A       | 85/100         | Oui        | 90/100          | (85*0.7) + (90*0.3) = **86.5**  |
| Societe B       | 65/100         | Non        | --              | Eliminee                        |
| Societe C       | 78/100         | Oui        | 100/100         | (78*0.7) + (100*0.3) = **84.6** |
| Societe D       | 92/100         | Oui        | 75/100          | (92*0.7) + (75*0.3) = **86.9**  |

Resultat : Societe D est attributaire avec la note finale la plus elevee (86.9).

---

## 5. Badge sidebar "16"

### 5.1 Affichage

Le sidebar de l'application affiche l'entree :

```
Passation Marche  [16]
```

Le badge **16** correspond au nombre de marches existants dans la base de donnees migree depuis l'ancien systeme.

### 5.2 Route

Les marches sont accessibles via la route :

```
/marches
```

### 5.3 Compteur dynamique

Le badge doit etre dynamique et afficher le nombre reel de marches pour l'exercice en cours :

```sql
SELECT COUNT(*)
FROM marches
WHERE exercice_id = (SELECT id FROM exercices WHERE en_cours = true);
```

---

## 6. Workflow des statuts

### 6.1 Diagramme de transition

```
en_preparation ──→ lance ──→ en_evaluation ──→ attribue ──→ signe
      │                            │                │
      └──→ annule ←────────────────┘                └──→ annule
```

### 6.2 Regles de transition

| De               | Vers            | Condition                           | Acteur           |
| ---------------- | --------------- | ----------------------------------- | ---------------- |
| `en_preparation` | `lance`         | DAO complet, EB validee             | DAAF             |
| `en_preparation` | `annule`        | Annulation avant lancement          | DG               |
| `lance`          | `en_evaluation` | Date cloture atteinte, plis ouverts | Commission       |
| `lance`          | `annule`        | Appel d'offres infructueux          | DG               |
| `en_evaluation`  | `attribue`      | Note finale calculee, PV signe      | Commission + DG  |
| `en_evaluation`  | `annule`        | Aucune offre conforme               | DG               |
| `attribue`       | `signe`         | Contrat signe par les deux parties  | DG + Prestataire |
| `attribue`       | `annule`        | Desistement du prestataire          | DG               |

### 6.3 Couleurs des badges statut

| Statut           | Couleur | Code CSS                        |
| ---------------- | ------- | ------------------------------- |
| `en_preparation` | Gris    | `bg-gray-100 text-gray-800`     |
| `lance`          | Bleu    | `bg-blue-100 text-blue-800`     |
| `en_evaluation`  | Jaune   | `bg-yellow-100 text-yellow-800` |
| `attribue`       | Violet  | `bg-purple-100 text-purple-800` |
| `signe`          | Vert    | `bg-green-100 text-green-800`   |
| `annule`         | Rouge   | `bg-red-100 text-red-800`       |

---

## 7. RLS Policies recommandees

```sql
-- Lecture : tous les utilisateurs authentifies peuvent voir les marches de leur exercice
CREATE POLICY marches_select ON marches
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Creation : DAAF et roles autorises
CREATE POLICY marches_insert ON marches
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND has_role(auth.uid(), 'DAAF'::app_role)
  );

-- Mise a jour : DAAF (preparation), Commission (evaluation), DG (attribution)
CREATE POLICY marches_update ON marches
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'DAAF'::app_role)
    OR has_role(auth.uid(), 'DG'::app_role)
    OR has_role(auth.uid(), 'CB'::app_role)
  );

-- Suppression interdite (on annule, on ne supprime pas)
-- Pas de policy DELETE
```

---

## 8. Recommandations pour les 10 prochains prompts

### Prompt 11 : Page liste marches

- Page `/marches` avec tableau paginee cote serveur
- Filtres : statut, type de marche, direction, periode
- Colonnes : reference, objet, type, montant estime, statut, date lancement
- Export CSV/Excel
- Badge compteur dans le sidebar

### Prompt 12 : Formulaire creation marche depuis EB validee

- Route `/execution/passation-marche?sourceEB={eb.id}`
- Pre-remplissage automatique depuis l'EB (objet, montant, articles)
- Selection du type de marche avec description de la procedure
- Import des articles comme lots du marche
- Validation des champs obligatoires avec Zod

### Prompt 13 : Workflow lancement, evaluation, attribution avec commissions

- Transition de statut avec controle des droits (RBAC)
- Saisie de la composition des commissions (JSONB)
- Enregistrement des dates cles (lancement, cloture, attribution)
- Notifications automatiques aux membres des commissions
- Historique des changements de statut (audit trail)

### Prompt 14 : Module d'evaluation technique et financiere avec grille de notation

- Interface de notation par critere (grille configurable)
- Calcul automatique : `note_finale = note_technique * 0.7 + note_financiere * 0.3`
- Seuil d'admissibilite technique a 70/100
- Tableau comparatif des soumissionnaires
- Validation par la commission d'evaluation

### Prompt 15 : Attribution et signature avec PV de commission

- Generation du PV d'attribution (PDF)
- Workflow de signature : commission puis DG
- Notification au prestataire retenu
- Mise a jour du statut `attribue` puis `signe`
- Archivage des documents de la procedure

### Prompt 16 : Lien marche vers engagement (etape 6) avec controle budgetaire

- Bouton "Creer engagement" depuis un marche signe
- Controle de disponibilite budgetaire avant engagement
- Pre-remplissage du formulaire d'engagement
- Verification que le montant adjuge ne depasse pas le credit disponible
- Transition vers le module Engagement (etape 6/9)

### Prompt 17 : Tableau de bord marches (KPIs, delais, montants)

- Nombre de marches par statut (graphique en barres)
- Montant total des marches par type (graphique en camembert)
- Delai moyen de passation (par type de marche)
- Taux de marches annules
- Top 10 prestataires par montant adjuge

### Prompt 18 : Alertes et relances automatiques

- Alerte delai de cloture proche (J-7, J-3, J-1)
- Alerte documents manquants (DAO incomplet, PV non signe)
- Relance automatique aux membres de commission inactifs
- Notification DG pour les marches en attente d'attribution > 15 jours
- Tableau de bord des alertes actives

### Prompt 19 : Export PDF proces-verbaux et rapports de commission

- PV d'ouverture des plis (liste des soumissionnaires, documents recus)
- PV d'evaluation technique (grille de notation detaillee)
- PV d'evaluation financiere (tableau comparatif des offres)
- Rapport final de la commission avec recommandation
- Lettre de notification au prestataire retenu

### Prompt 20 : Tests E2E complets passation de marche (50 tests)

- Tests de creation de marche depuis une EB validee
- Tests de chaque type de procedure (5 modes)
- Tests du workflow complet (preparation a signature)
- Tests de notation et evaluation
- Tests des exports PDF
- Tests des droits RBAC (qui peut faire quoi)
- Tests des cas limites (annulation, desistement, infructueux)

---

## 9. Fichiers a creer/modifier

### Nouveaux fichiers

| Fichier                                       | Description                           |
| --------------------------------------------- | ------------------------------------- |
| `src/pages/execution/MarchesPage.tsx`         | Page liste des marches                |
| `src/pages/execution/MarcheDetailPage.tsx`    | Detail d'un marche                    |
| `src/pages/execution/PassationMarchePage.tsx` | Formulaire creation depuis EB         |
| `src/components/marche/MarcheList.tsx`        | Composant liste avec filtres          |
| `src/components/marche/MarcheDetails.tsx`     | Composant detail                      |
| `src/components/marche/MarcheForm.tsx`        | Formulaire de creation/edition        |
| `src/components/marche/MarcheStatusBadge.tsx` | Badge statut avec couleurs            |
| `src/components/marche/EvaluationGrid.tsx`    | Grille de notation                    |
| `src/components/marche/CommissionForm.tsx`    | Composition des commissions           |
| `src/hooks/useMarches.ts`                     | Hook liste des marches                |
| `src/hooks/useMarcheDetail.ts`                | Hook detail d'un marche               |
| `src/hooks/useMarcheActions.ts`               | Hook actions (creer, modifier, noter) |
| `src/types/marche.ts`                         | Types TypeScript pour les marches     |

### Fichiers a modifier

| Fichier                                                        | Modification                                             |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| `src/components/layout/Sidebar.tsx`                            | Ajouter entree "Passation Marche" avec badge             |
| `src/App.tsx`                                                  | Ajouter routes `/marches`, `/execution/passation-marche` |
| `src/components/expression-besoin/ExpressionBesoinDetails.tsx` | Bouton "Creer passation marche"                          |
| `src/lib/constants.ts`                                         | Constantes statuts et types de marche                    |

---

## 10. Estimation de charge

| Prompt    | Effort estime | Complexite |
| --------- | ------------- | ---------- |
| Prompt 11 | 1 session     | Moyenne    |
| Prompt 12 | 1 session     | Moyenne    |
| Prompt 13 | 1-2 sessions  | Haute      |
| Prompt 14 | 1-2 sessions  | Haute      |
| Prompt 15 | 1 session     | Moyenne    |
| Prompt 16 | 1 session     | Moyenne    |
| Prompt 17 | 1 session     | Moyenne    |
| Prompt 18 | 1 session     | Moyenne    |
| Prompt 19 | 1 session     | Moyenne    |
| Prompt 20 | 2 sessions    | Haute      |

**Total estime** : 11-14 sessions de travail pour le module Passation de Marche complet.
