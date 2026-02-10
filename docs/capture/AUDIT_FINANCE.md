# Audit Finance et Comptabilite Publique -- Module Notes de l'Espace Direction

**SYGFP -- Systeme de Gestion des Finances Publiques**
**ARTI -- Autorite de Regulation du Transport Interieur**

**Date :** 10 fevrier 2026
**Auditeur :** Agent finance-expert
**Version :** 1.0

---

## Table des matieres

1. [Resume executif](#1-resume-executif)
2. [Perimetre de l'audit](#2-perimetre-de-laudit)
3. [Analyse du module existant](#3-analyse-du-module-existant)
4. [Audit du workflow](#4-audit-du-workflow)
5. [Audit des metadonnees](#5-audit-des-metadonnees)
6. [Conformite aux standards administratifs ivoiriens](#6-conformite-aux-standards-administratifs-ivoiriens)
7. [Integration dans la chaine de depense](#7-integration-dans-la-chaine-de-depense)
8. [Recommandations metier](#8-recommandations-metier)
9. [Schema de numerotation recommande](#9-schema-de-numerotation-recommande)
10. [Circuit de validation recommande](#10-circuit-de-validation-recommande)
11. [Archivage et tracabilite](#11-archivage-et-tracabilite)
12. [Matrice de risques](#12-matrice-de-risques)
13. [Plan d'action prioritaire](#13-plan-daction-prioritaire)

---

## 1. Resume executif

Le module "Notes" de l'Espace Direction dans SYGFP presente un ecart significatif entre sa conception actuelle (outil de prise de notes informel) et les exigences d'un systeme de gestion documentaire officiel dans le cadre de la finance publique.

**Constats principaux :**

- Le workflow `brouillon -> publie -> archive` est **insuffisant** pour un document officiel. Il manque les etapes de soumission, validation hierarchique et diffusion controlees.
- Les metadonnees sont **incompletes** : absence de reference normalisee, de destinataire formel, de signataire, de visa, d'ampliation et de timbre administratif.
- La typologie des notes (`interne`, `compte_rendu`, `rapport`, `memo`, `autre`) est **partiellement pertinente** mais incomplete au regard des usages administratifs ivoiriens.
- Il n'existe aucune integration entre les notes de direction et la chaine de depense (Note SEF -> Reglement).
- Le module Notes DG (notes_direction_generale) dispose deja d'un excellent workflow qui sert de modele de reference.

**Niveau de severite global : MODERE** -- Le module fonctionne mais ne respecte pas les standards de la comptabilite publique et de la gestion documentaire officielle.

---

## 2. Perimetre de l'audit

### 2.1 Fichiers analyses

| Composant       | Fichier                                            | Fonction                             |
| --------------- | -------------------------------------------------- | ------------------------------------ |
| Page principale | `src/pages/EspaceDirection.tsx`                    | Interface de gestion des notes       |
| Hook donnees    | `src/hooks/useNotesDirection.ts`                   | CRUD + import Word                   |
| Schema BDD      | `supabase/migrations/20260209_notes_direction.sql` | Table et policies RLS                |
| Reference       | `src/hooks/useNotesDirectionGenerale.ts`           | Modele de workflow avance (Notes DG) |
| Reference       | `src/pages/NotesDirectionGenerale.tsx`             | Interface Notes DG                   |
| Workflow        | `src/lib/workflow/statuts.ts`                      | Statuts unifie chaine de depense     |
| References      | `src/lib/notes-sef/referenceService.ts`            | Service de reference ARTI            |
| Types           | `src/lib/notes-sef/types.ts`                       | Types Notes SEF                      |

### 2.2 Documents Word ARTI examines

- `DSI-FEUILLES DE ROUTES ET NOTES DESCRIPTIVES CONSOLIDEES 2025.docx`
- `NOTE_RELATIVE_006_Plan_Renouvellement_Licences_DSI_2026.docx`
- `NOTE_RELATIVE_008_Plan_Renouvellement_Materiel_Informatique_2026.docx`

### 2.3 Standards de reference

- Directive UEMOA n 07/2009/CM/UEMOA sur la comptabilite publique
- Manuel de procedures de la Direction Generale du Tresor et de la Comptabilite Publique de Cote d'Ivoire
- Reglement financier UEMOA n 01/2018/CM/UEMOA
- Standards de redaction administrative en Afrique francophone (ENA Cote d'Ivoire, cours CPFAE 2025)

---

## 3. Analyse du module existant

### 3.1 Table `notes_direction` -- Structure actuelle

```sql
notes_direction (
  id UUID PK,
  direction_id UUID FK -> directions,
  exercice_id UUID FK -> exercices_budgetaires,
  titre TEXT NOT NULL,
  contenu TEXT (HTML),
  contenu_brut TEXT (texte pour recherche),
  type_note TEXT CHECK ('interne','compte_rendu','rapport','memo','autre'),
  statut TEXT CHECK ('brouillon','publie','archive'),
  tags TEXT[],
  fichier_original_url TEXT,
  fichier_original_nom TEXT,
  priorite TEXT CHECK ('normale','haute','urgente'),
  created_by UUID FK -> auth.users,
  updated_by UUID FK -> auth.users,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### 3.2 Forces du module actuel

1. **RLS bien configuree** : Acces restreint par direction avec escalade pour Admin/DG
2. **Import Word fonctionnel** : Conversion .docx -> HTML via mammoth.js
3. **Recherche full-text** : Index GIN configure sur titre + contenu_brut
4. **Tags** : Systeme de classification par etiquettes
5. **Audit trail basique** : created_by/updated_by avec timestamps

### 3.3 Faiblesses identifiees

| #   | Faiblesse                              | Severite | Impact                               |
| --- | -------------------------------------- | -------- | ------------------------------------ |
| F1  | Pas de numero de reference automatique | CRITIQUE | Non-conformite reglementaire         |
| F2  | Pas de destinataire formel             | HAUTE    | Document invalide administrativement |
| F3  | Pas de signataire/visa                 | HAUTE    | Pas de valeur juridique              |
| F4  | Workflow trop simple (3 etats)         | HAUTE    | Pas de circuit de validation         |
| F5  | Pas d'ampliation (copies)              | MOYENNE  | Non-conformite aux usages            |
| F6  | Pas de timbre/en-tete officiel         | MOYENNE  | Non-conformite au format ARTI        |
| F7  | Pas d'historique des modifications     | MOYENNE  | Pas de tracabilite                   |
| F8  | Pas de lien vers la chaine de depense  | BASSE    | Fonctionnalite manquante             |
| F9  | Pas de confidentialite/classification  | BASSE    | Risque de fuite d'information        |

### 3.4 Comparaison avec le module Notes DG (reference interne)

Le module `notes_direction_generale` dispose deja d'un modele bien plus avance :

| Fonctionnalite        | notes_direction | notes_direction_generale         |
| --------------------- | --------------- | -------------------------------- |
| Reference automatique | Non             | Oui (NDG-MM-YY-XXXX)             |
| Destinataire formel   | Non             | Oui                              |
| Signataire            | Non             | Oui (signed_by + signed_at)      |
| Workflow valide       | 3 etats         | 5 etats + transitions controlees |
| Rejet avec motif      | Non             | Oui                              |
| Imputations           | Non             | Oui (table dediee)               |
| Accuse de reception   | Non             | Oui                              |
| Audit trail           | Basique         | Complet (useAuditLog)            |
| Generation PDF        | Non             | Oui (QR code + signature)        |

---

## 4. Audit du workflow

### 4.1 Workflow actuel (INSUFFISANT)

```
brouillon --> publie --> archive
```

**Problemes :**

- N'importe qui dans la direction peut publier (pas de validation hierarchique)
- Pas de soumission prealable au responsable de direction
- Pas de rejet possible (retour pour correction)
- Pas de diffusion controlee aux destinataires
- Le passage en "publie" n'est pas trace (pas de submitted_by/submitted_at)

### 4.2 Workflow recommande

En s'inspirant du modele Notes DG et des bonnes pratiques de la fonction publique ivoirienne :

```
                          +-- rejete (avec motif) --+
                          |                         |
                          v                         |
brouillon --> soumis --> en_validation --> valide --> diffuse --> archive
                          ^                         |
                          |                         |
                          +--- retour brouillon ----+
```

**Etats recommandes :**

| Statut          | Description                         | Qui peut transitionner             |
| --------------- | ----------------------------------- | ---------------------------------- |
| `brouillon`     | En cours de redaction               | Redacteur (agent direction)        |
| `soumis`        | Soumis au responsable de direction  | Redacteur                          |
| `en_validation` | En cours d'examen par le validateur | Automatique ou Directeur           |
| `valide`        | Approuve/signe par le Directeur     | Directeur ou superieur             |
| `rejete`        | Renvoye pour correction avec motif  | Directeur                          |
| `diffuse`       | Envoye aux destinataires            | Directeur ou secretariat           |
| `archive`       | Classe dans les archives            | Automatique (apres delai) ou Admin |

**Transitions valides :**

```
brouillon    -> [soumis]
soumis       -> [en_validation, rejete]
en_validation -> [valide, rejete]
valide       -> [diffuse]
rejete       -> [brouillon]       -- retour pour correction
diffuse      -> [archive]          -- etat terminal
archive      -> []                 -- etat terminal
```

### 4.3 Justification metier

Selon les standards de la comptabilite publique (Directive UEMOA n 07/2009), tout acte administratif engageant la responsabilite de l'institution doit suivre un circuit de validation hierarchique. La note de service, meme interne, est un **acte d'autorite** du superieur hierarchique et doit porter sa signature pour avoir valeur d'instruction.

Le Cours de Redaction Administrative du CPFAE (Session 2025, Fonction Publique de Cote d'Ivoire) precise que la note de service doit comporter les "mentions usuelles (timbre, localisation, date)" et qu'elle est archivee dans un recueil specialise lorsqu'elle contient des instructions durables.

---

## 5. Audit des metadonnees

### 5.1 Champs actuels vs champs requis

| Champ                       | Existant                       | Requis                       | Priorite |
| --------------------------- | ------------------------------ | ---------------------------- | -------- |
| `id` (UUID)                 | Oui                            | Oui                          | -        |
| `direction_id`              | Oui                            | Oui                          | -        |
| `exercice_id`               | Oui                            | Oui                          | -        |
| `titre`                     | Oui                            | Remplacer par `objet`        | HAUTE    |
| `reference`                 | **NON**                        | Oui (auto-generee)           | CRITIQUE |
| `numero_note`               | **NON**                        | Oui                          | HAUTE    |
| `date_note`                 | **NON** (created_at seulement) | Oui                          | HAUTE    |
| `destinataire`              | **NON**                        | Oui                          | HAUTE    |
| `direction_destinataire_id` | **NON**                        | Oui (FK vers directions)     | HAUTE    |
| `signataire_id`             | **NON**                        | Oui (FK vers profiles)       | HAUTE    |
| `signe_le`                  | **NON**                        | Oui (TIMESTAMPTZ)            | HAUTE    |
| `visa_par_id`               | **NON**                        | Optionnel (FK vers profiles) | MOYENNE  |
| `visa_le`                   | **NON**                        | Optionnel (TIMESTAMPTZ)      | MOYENNE  |
| `ampliations`               | **NON**                        | Oui (TEXT[] ou JSONB)        | MOYENNE  |
| `classification`            | **NON**                        | Recommande                   | BASSE    |
| `contenu` (HTML)            | Oui                            | Oui                          | -        |
| `contenu_brut`              | Oui                            | Oui                          | -        |
| `type_note`                 | Oui (partiel)                  | A enrichir                   | MOYENNE  |
| `statut`                    | Oui (insuffisant)              | A enrichir                   | HAUTE    |
| `tags`                      | Oui                            | Oui                          | -        |
| `priorite`                  | Oui                            | Oui                          | -        |
| `pieces_jointes`            | Via fichier_original           | A generaliser (JSONB)        | MOYENNE  |
| `motif_rejet`               | **NON**                        | Oui                          | HAUTE    |
| `rejete_par`                | **NON**                        | Oui                          | HAUTE    |
| `rejete_le`                 | **NON**                        | Oui                          | HAUTE    |
| `soumis_par`                | **NON**                        | Oui                          | HAUTE    |
| `soumis_le`                 | **NON**                        | Oui                          | HAUTE    |

### 5.2 Champ `titre` vs `objet`

Dans la terminologie administrative ivoirienne, une note n'a pas de "titre" mais un **"objet"**. Le champ `titre` doit etre renomme en `objet` pour respecter le vocabulaire officiel. Le systeme actuel Notes DG utilise deja correctement `objet`.

### 5.3 Enrichissement du type de note

**Types actuels :**

- `interne` : Note interne -- OK
- `compte_rendu` : Compte rendu -- OK
- `rapport` : Rapport -- OK
- `memo` : Memo -- OK mais peu utilise dans l'administration francophone
- `autre` : Fourre-tout -- A supprimer

**Types recommandes :**

| Type               | Label                   | Description                                | Usage a l'ARTI               |
| ------------------ | ----------------------- | ------------------------------------------ | ---------------------------- |
| `note_service`     | Note de service         | Instruction du superieur aux subordonnes   | Instructions de la direction |
| `note_information` | Note d'information      | Communication descendante sans instruction | Information aux agents       |
| `note_technique`   | Note technique/relative | Document technique detaille                | Plans DSI, budgets, etc.     |
| `compte_rendu`     | Compte rendu            | Synthese de reunion/activite               | Reunions de direction        |
| `rapport`          | Rapport                 | Document analytique detaille               | Rapports d'activites         |
| `bordereau_envoi`  | Bordereau d'envoi       | Document d'accompagnement de pieces        | Transmission de documents    |
| `proces_verbal`    | Proces-verbal           | Compte rendu officiel de reunion           | Reunions de commission       |
| `circulaire`       | Circulaire              | Instruction a caractere general            | Instructions generales DG    |

**Justification :** Les documents Word ARTI examines sont des "NOTES RELATIVES" (notes techniques) accompagnees de "FEUILLES DE ROUTE" (plans detailles). Le type `memo` est un anglicisme peu utilise dans l'administration francophone ; `note_technique` ou `note_relative` serait plus adapte.

---

## 6. Conformite aux standards administratifs ivoiriens

### 6.1 Structure standard d'une note administrative

D'apres les standards de redaction administrative enseigne a la Fonction Publique de Cote d'Ivoire (CPFAE 2025) et dans le Manuel de Redaction Administrative pour l'Afrique Francophone, une note officielle comporte obligatoirement :

```
+------------------------------------------------------------------+
| REPUBLIQUE DE COTE D'IVOIRE                                       |
| Union - Discipline - Travail                                       |
|                                                                    |
| AUTORITE DE REGULATION DU                   Abidjan, le [DATE]    |
| TRANSPORT INTERIEUR (ARTI)                                         |
| -----                                                              |
| Direction [EMETTRICE]                                              |
| -----                                                              |
| N [REFERENCE]                                                      |
|                                                                    |
|             NOTE DE SERVICE N [NUMERO]                             |
|                                                                    |
| LE DIRECTEUR [DE LA DIRECTION EMETTRICE]                           |
|                                                                    |
| A                                                                  |
|                                                                    |
| Messieurs les [DESTINATAIRES]                                      |
|                                                                    |
| OBJET: [OBJET DE LA NOTE]                                         |
| REF: [REFERENCES ANTERIEURES SI NECESSAIRE]                       |
| PJ: [PIECES JOINTES SI APPLICABLE]                                |
|                                                                    |
| [CORPS DE LA NOTE]                                                 |
|                                                                    |
|                               [TITRE ET NOM DU SIGNATAIRE]        |
|                               [SIGNATURE]                          |
|                                                                    |
| AMPLIATION:                                                        |
| - Direction Generale .......... 1                                  |
| - Direction [X] ............... 1                                  |
| - Archives .................... 1                                  |
+------------------------------------------------------------------+
```

### 6.2 Ecarts constates dans le module actuel

| Element requis               | Statut actuel           | Recommandation                       |
| ---------------------------- | ----------------------- | ------------------------------------ |
| En-tete Republique/ARTI      | Absent                  | Ajouter au template PDF/canvas       |
| Timbre (direction emettrice) | Partiel (direction_id)  | OK, a exploiter                      |
| Lieu et date                 | Absent                  | Ajouter `date_note` + localisation   |
| Reference/Numero             | Absent                  | Generer automatiquement              |
| Destinataire formel          | Absent                  | Ajouter champ + FK direction         |
| Objet                        | `titre` (mauvais terme) | Renommer en `objet`                  |
| Mention "REF"                | Absent                  | Ajouter `references_anterieures`     |
| Mention "PJ"                 | Partiel                 | Generaliser le systeme PJ            |
| Signature                    | Absent                  | Ajouter `signataire_id` + `signe_le` |
| Ampliation                   | Absent                  | Ajouter champ `ampliations`          |

### 6.3 Elements specifiques aux documents ARTI

L'analyse des documents Word de l'ARTI (DSI) revele le format utilise en pratique :

- **En-tete** : "DIRECTION DES SYSTEMES D'INFORMATION" (direction emettrice)
- **Champs structurels** :
  - "REFERENCE PLAN" (reference du document)
  - "Nom du plan" (objet du document)
  - "Destinataire" (ex: "Directeur General de l'ARTI")
- **Pieces jointes** : Mentionnees en debut de note ("PJ : Le plan detaille par activites et taches")
- **Structure du corps** : Sections numerotees avec contexte, objectifs, budget

Ce format confirme que les notes ARTI suivent bien les conventions administratives francophone avec quelques adaptations propres a l'institution.

---

## 7. Integration dans la chaine de depense

### 7.1 Chaine de depense SYGFP actuelle

```
Note SEF (etape 0) --> Note AEF (etape 1) --> Imputation (2) --> Expression de Besoin (3)
--> Passation de Marche (4) --> Engagement (5) --> Liquidation (6)
--> Ordonnancement (7) --> Reglement (8)
```

Chaque etape dispose de son propre systeme de reference ARTI normalise :

- Format: `ARTI` + code etape (1 chiffre) + mois (2) + annee (2) + numero (4)
- Exemple: `ARTI0012600001` = Note SEF, janvier 2026, 1er document

### 7.2 Position des notes de direction dans la chaine

Les notes de direction sont des **documents preparatoires et justificatifs** qui se situent EN AMONT de la chaine de depense formelle :

```
[Notes de Direction] --> Note SEF (entree dans la chaine)
     ^                       |
     |                       v
     |                  Note AEF --> ... --> Reglement
     |
     +-- "Note technique relative au plan de renouvellement des licences DSI 2026"
     +-- "Note relative au plan de renouvellement du materiel informatique 2026"
```

### 7.3 Liens recommandes

| Type de lien                          | Implementation                       | Priorite |
| ------------------------------------- | ------------------------------------ | -------- |
| Note direction -> Note SEF            | Champ `note_sef_id` (FK optionnelle) | MOYENNE  |
| Note direction -> Dossier depense     | Champ `dossier_id` (FK optionnelle)  | BASSE    |
| Note direction -> Activite budgetaire | Champ `activite_id` (FK optionnelle) | MOYENNE  |
| Note direction -> Ligne budgetaire    | Via activite_id                      | BASSE    |

### 7.4 Pieces justificatives

Selon la Directive UEMOA n 07/2009 et le Reglement financier UEMOA n 01/2018, la phase de liquidation necessite de "rassembler toutes les pieces justificatives de la prestation". Les notes de direction (surtout les notes techniques et notes relatives) constituent des **pieces justificatives de premier ordre** pour :

- Justifier l'opportunite de la depense (Note SEF)
- Documenter le besoin technique (Expression de besoin)
- Appuyer la decision d'engagement

La conservation des pieces justificatives est fixee a **10 ans** par la reglementation UEMOA.

---

## 8. Recommandations metier

### 8.1 Gestion documentaire (bonnes pratiques secteur public)

| #   | Recommandation                                      | Priorite | Justification                          |
| --- | --------------------------------------------------- | -------- | -------------------------------------- |
| R1  | Numerotation automatique unique par direction/annee | CRITIQUE | Conformite reglementaire, tracabilite  |
| R2  | Circuit de validation hierarchique obligatoire      | HAUTE    | Autorite du document, valeur juridique |
| R3  | Destinataires et ampliations formels                | HAUTE    | Conformite format administratif        |
| R4  | Signature electronique (ou a minima QR code)        | HAUTE    | Authenticite du document               |
| R5  | Historique complet des modifications (audit log)    | HAUTE    | Tracabilite reglementaire              |
| R6  | Generation PDF au format officiel ARTI              | HAUTE    | Impression, diffusion, archivage       |
| R7  | Classification de confidentialite                   | MOYENNE  | Protection des informations sensibles  |
| R8  | Lien optionnel vers la chaine de depense            | MOYENNE  | Justification des depenses             |
| R9  | Systeme de rappels/echeances                        | BASSE    | Suivi des instructions                 |
| R10 | Versioning des documents                            | BASSE    | Tracabilite des modifications          |

### 8.2 Recommandation detaillee : Circuit de validation

**Pour les notes de service et circulaires (documents d'instruction) :**

- Obligatoire : validation par le Directeur de la direction emettrice
- Recommande : visa prealable du Chef de Service redacteur

**Pour les notes d'information :**

- Validation simplifiee : le Directeur peut publier directement

**Pour les notes techniques/relatives :**

- Validation par le Directeur
- Si impact budgetaire > seuil configurable : validation DAAF requise

**Pour les comptes rendus et PV :**

- Validation par le president de la reunion
- Diffusion apres approbation

### 8.3 Recommandation detaillee : Classification de confidentialite

| Niveau         | Label                    | Acces                             |
| -------------- | ------------------------ | --------------------------------- |
| `public`       | Diffusion libre          | Tous les agents ARTI              |
| `interne`      | Usage interne direction  | Agents de la direction uniquement |
| `confidentiel` | Diffusion restreinte     | Destinataires nommes + DG         |
| `secret`       | Strictement confidentiel | Destinataires nommes uniquement   |

---

## 9. Schema de numerotation recommande

### 9.1 Format propose

```
ND-{SIGLE_DIRECTION}/{NUMERO_SEQUENTIEL}/{ANNEE}
```

**Exemples :**

- `ND-DSI/001/2026` -- 1ere note de la DSI en 2026
- `ND-DAAF/015/2026` -- 15eme note de la DAAF en 2026
- `ND-DT/003/2026` -- 3eme note de la Direction Technique en 2026

### 9.2 Variante avec type de note

```
{TYPE}-{SIGLE_DIRECTION}/{NUMERO_SEQUENTIEL}/{ANNEE}
```

**Exemples :**

- `NS-DSI/001/2026` -- Note de Service DSI n 001/2026
- `NI-DAAF/005/2026` -- Note d'Information DAAF n 005/2026
- `NT-DSI/003/2026` -- Note Technique DSI n 003/2026
- `CR-DT/002/2026` -- Compte Rendu DT n 002/2026
- `PV-DG/001/2026` -- Proces-Verbal DG n 001/2026

### 9.3 Implementation SQL recommandee

```sql
-- Table compteur de references
CREATE TABLE arti_note_direction_counters (
  direction_id UUID NOT NULL REFERENCES directions(id),
  annee INTEGER NOT NULL,
  dernier_numero INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (direction_id, annee)
);

-- Fonction de generation automatique
CREATE OR REPLACE FUNCTION generate_note_direction_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_sigle TEXT;
  v_annee INTEGER;
  v_sequence INTEGER;
BEGIN
  -- Recuperer le sigle de la direction
  SELECT sigle INTO v_sigle FROM directions WHERE id = NEW.direction_id;
  v_annee := EXTRACT(YEAR FROM COALESCE(NEW.date_note, CURRENT_DATE));

  -- Incrementer le compteur atomiquement
  INSERT INTO arti_note_direction_counters (direction_id, annee, dernier_numero)
  VALUES (NEW.direction_id, v_annee, 1)
  ON CONFLICT (direction_id, annee) DO UPDATE
  SET dernier_numero = arti_note_direction_counters.dernier_numero + 1
  RETURNING dernier_numero INTO v_sequence;

  -- Generer la reference
  NEW.reference := 'ND-' || v_sigle || '/' || LPAD(v_sequence::TEXT, 3, '0') || '/' || v_annee;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 9.4 Coherence avec le systeme existant

Le format propose est **complementaire** au systeme ARTI pivot (ARTI + 9 chiffres) utilise pour la chaine de depense. Les deux systemes coexistent :

- **References ARTI** (ARTI0012600001) : pour les documents de la chaine de depense formelle
- **References ND** (ND-DSI/001/2026) : pour les notes internes de direction

Si une note de direction donne naissance a une Note SEF, la reference ND est conservee en tant que `reference_originale` dans la Note SEF pour tracabilite.

---

## 10. Circuit de validation recommande

### 10.1 Matrice des roles

| Role            | Peut rediger | Peut soumettre  | Peut valider        | Peut rejeter | Peut diffuser |
| --------------- | ------------ | --------------- | ------------------- | ------------ | ------------- |
| Agent           | Oui          | Oui (ses notes) | Non                 | Non          | Non           |
| Chef de Service | Oui          | Oui             | Non                 | Non          | Non           |
| Sous-Directeur  | Oui          | Oui             | Ses sous-directions | Oui          | Non           |
| Directeur       | Oui          | Oui             | Toute la direction  | Oui          | Oui           |
| DG              | Oui          | Oui             | Toutes directions   | Oui          | Oui           |
| Admin           | Oui          | Oui             | Configuration       | Oui          | Oui           |

### 10.2 Regles de transition

```typescript
const VALID_TRANSITIONS: Record<StatutNoteDirection, StatutNoteDirection[]> = {
  brouillon: ['soumis'],
  soumis: ['en_validation', 'rejete'],
  en_validation: ['valide', 'rejete'],
  valide: ['diffuse'],
  rejete: ['brouillon'], // Retour pour correction
  diffuse: ['archive'],
  archive: [], // Etat terminal
};
```

### 10.3 Controles a chaque transition

| Transition              | Controles obligatoires                                 |
| ----------------------- | ------------------------------------------------------ |
| brouillon -> soumis     | Objet non vide, contenu non vide, direction renseignee |
| soumis -> en_validation | Redacteur differend du validateur                      |
| en_validation -> valide | Validateur = Directeur ou superieur                    |
| valide -> diffuse       | Au moins un destinataire, reference generee            |
| rejete -> brouillon     | Motif de rejet non vide                                |

---

## 11. Archivage et tracabilite

### 11.1 Duree de conservation

Selon la Directive UEMOA, les pieces justificatives de la depense doivent etre conservees **10 ans minimum**. Les notes de direction, en tant que documents preparatoires et justificatifs, doivent suivre la meme regle.

**Recommandation :** Ne jamais supprimer physiquement une note archivee. Utiliser un soft-delete ou un statut `archive` permanent.

### 11.2 Table d'audit recommandee

```sql
CREATE TABLE notes_direction_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes_direction(id),
  action TEXT NOT NULL,  -- 'create','update','submit','validate','reject','diffuse','archive'
  old_statut TEXT,
  new_statut TEXT,
  old_values JSONB,
  new_values JSONB,
  commentaire TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);
```

### 11.3 Evenements a tracer

| Evenement    | Donnees a capturer               |
| ------------ | -------------------------------- |
| Creation     | Tous les champs initiaux         |
| Modification | Ancien et nouveau contenu        |
| Soumission   | Soumis par, date                 |
| Validation   | Valide par, date, commentaire    |
| Rejet        | Rejete par, date, motif          |
| Diffusion    | Diffuse par, date, destinataires |
| Archivage    | Archive par, date, motif         |

---

## 12. Matrice de risques

| Risque                               | Probabilite | Impact   | Mitigation                                |
| ------------------------------------ | ----------- | -------- | ----------------------------------------- |
| Notes sans reference (non-tracables) | HAUTE       | CRITIQUE | Numerotation automatique obligatoire      |
| Notes publiees sans validation       | HAUTE       | HAUTE    | Workflow de validation obligatoire        |
| Perte de notes (pas de sauvegarde)   | FAIBLE      | CRITIQUE | Backup Supabase + historique versions     |
| Modification post-validation         | MOYENNE     | HAUTE    | Verrouillage apres validation + audit log |
| Usurpation de signature              | FAIBLE      | CRITIQUE | Signature electronique/QR code            |
| Acces non autorise                   | FAIBLE      | HAUTE    | RLS existantes (bien configurees)         |
| Non-conformite reglementaire         | HAUTE       | HAUTE    | Implementation des recommandations        |

---

## 13. Plan d'action prioritaire

### Phase 1 : Fondamentaux (Sprint 1-2)

| #   | Action                                         | Fichiers impactes       | Effort |
| --- | ---------------------------------------------- | ----------------------- | ------ |
| A1  | Ajouter les champs manquants a la table        | Migration SQL           | 2h     |
| A2  | Implementer la numerotation automatique        | Migration SQL + trigger | 3h     |
| A3  | Enrichir le workflow (7 statuts + transitions) | Hook + types            | 4h     |
| A4  | Ajouter destinataire et signataire             | Hook + UI               | 3h     |
| A5  | Renommer `titre` en `objet`                    | Migration + UI + hook   | 1h     |

### Phase 2 : Conformite (Sprint 3-4)

| #   | Action                                       | Fichiers impactes      | Effort |
| --- | -------------------------------------------- | ---------------------- | ------ |
| A6  | Enrichir les types de notes                  | Migration + constants  | 2h     |
| A7  | Ajouter les ampliations                      | Migration + UI         | 3h     |
| A8  | Creer la table d'audit                       | Migration + hook       | 4h     |
| A9  | Ajouter la classification de confidentialite | Migration + RLS + UI   | 3h     |
| A10 | Generation PDF au format officiel            | Service PDF + template | 8h     |

### Phase 3 : Integration (Sprint 5+)

| #   | Action                         | Fichiers impactes | Effort |
| --- | ------------------------------ | ----------------- | ------ |
| A11 | Lien optionnel vers Note SEF   | Migration + UI    | 3h     |
| A12 | Lien vers activite budgetaire  | Migration + UI    | 2h     |
| A13 | Systeme de rappels/echeances   | Table + cron      | 4h     |
| A14 | Signature electronique avancee | Service + UI      | 8h     |

---

## Annexes

### A. Sources et references

- [Directive UEMOA n 07/2009/CM/UEMOA - Comptabilite publique](http://www.droit-afrique.com/upload/doc/uemoa/UEMOA-Directive-2009-07-reglement-comptabilite-publique.pdf)
- [Reglement financier UEMOA n 01/2018](https://e-docucenter.uemoa.int/sites/default/files/2021-11/Reglement%20financier.pdf)
- [Article 53 UEMOA - Operations d'execution des depenses](https://e-docucenter.uemoa.int/fr/article-53-operations-dexecution-des-depenses)
- [Cours Redaction Administrative CPFAE 2025 - Fonction Publique CI](https://www.fonctionpublique.gouv.ci/assets/docs/CoursAdministrationdeBase/SUPPORT_DE_COURS_REDACTION_ADMINISTRATIVE_C_D_2025.pdf)
- [Manuel de Redaction Administrative Afrique Francophone - CERACLE](https://ceracle.com/manuel-de-redaction-administrative-afrique-francophone/)
- [Manuel de Procedures DGTCP Cote d'Ivoire](https://www.tresor.gouv.ci/tres/wp-content/uploads/2022/08/Manuel-de-procedures-DGTCP-2.pdf)
- [Note de service - GPE Afrique](https://www.gpe-afrique.com/moodledata/filedir/0a/48/0a48b5f6f1d3f9adfdd9fc8693ce7caba90b82d9)

### B. Glossaire

| Terme                  | Definition                                                         |
| ---------------------- | ------------------------------------------------------------------ |
| **ARTI**               | Autorite de Regulation du Transport Interieur                      |
| **DAAF**               | Direction des Affaires Administratives et Financieres              |
| **DG**                 | Directeur General / Direction Generale                             |
| **DSI**                | Direction des Systemes d'Information                               |
| **Note de service**    | Document interne par lequel un superieur donne des instructions    |
| **Note d'information** | Document de communication descendante sans instruction             |
| **Note technique**     | Document detaille sur un sujet technique specifique                |
| **Ampliation**         | Copie officielle d'un document transmise pour information          |
| **Timbre**             | En-tete identifiant l'autorite administrative emettrice            |
| **Imputation**         | Attribution d'un document a un destinataire avec instruction       |
| **Ordonnateur**        | Autorite habilitee a engager, liquider et ordonnancer les depenses |
| **UEMOA**              | Union Economique et Monetaire Ouest Africaine                      |
| **RLS**                | Row-Level Security (securite au niveau des lignes)                 |
| **ELOP**               | Engagement, Liquidation, Ordonnancement, Paiement                  |

---

_Document redige le 10 fevrier 2026 dans le cadre de l'audit du module Notes de l'Espace Direction SYGFP._
