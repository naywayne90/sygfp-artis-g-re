# Analyse Approfondie des Documents ARTI - DSI

> **Date d'analyse** : 10 fevrier 2026
> **Analyste** : Agent doc-analyst (SYGFP Notes Canvas Team)
> **Objectif** : Extraire la structure, le format et les champs metier des documents officiels ARTI pour modeliser le canvas de notes SYGFP.

---

## Table des matieres

1. [Vue d'ensemble des 3 documents](#1-vue-densemble-des-3-documents)
2. [Document 1 : Feuilles de routes consolidees 2025](#2-document-1--feuilles-de-routes-consolidees-2025)
3. [Document 2 : NOTE_RELATIVE_006 - Licences DSI 2026](#3-document-2--note_relative_006---licences-dsi-2026)
4. [Document 3 : NOTE_RELATIVE_008 - Materiel Informatique 2026](#4-document-3--note_relative_008---materiel-informatique-2026)
5. [Analyse comparative des 3 documents](#5-analyse-comparative-des-3-documents)
6. [Structure commune identifiee (modele canonique)](#6-structure-commune-identifiee-modele-canonique)
7. [Specifications techniques pour le canvas](#7-specifications-techniques-pour-le-canvas)
8. [Vocabulaire metier et champs](#8-vocabulaire-metier-et-champs)

---

## 1. Vue d'ensemble des 3 documents

| Propriete            | Document 1 (Feuilles de route)                                     | Document 2 (NOTE 006)                                        | Document 3 (NOTE 008)                                                   |
| -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| **Fichier**          | DSI-FEUILLES DE ROUTES ET NOTES DESCRIPTIVES CONSOLIDEES 2025.docx | NOTE_RELATIVE_006_Plan_Renouvellement_Licences_DSI_2026.docx | NOTE_RELATIVE_008_Plan_Renouvellement_Materiel_Informatique_2026 1.docx |
| **Taille**           | 204 031 octets (204 Ko)                                            | 64 709 octets (65 Ko)                                        | 65 485 octets (65 Ko)                                                   |
| **Sections**         | 9 (mixte Portrait/Landscape)                                       | 1 (Portrait)                                                 | 1 (Portrait)                                                            |
| **Paragraphes**      | 80                                                                 | 7                                                            | 7                                                                       |
| **Tableaux**         | 21                                                                 | 6                                                            | 6                                                                       |
| **Images**           | 4                                                                  | 2                                                            | 2                                                                       |
| **Styles utilises**  | Body Text, Heading 1, Normal, Table Paragraph                      | Normal                                                       | Normal                                                                  |
| **Type de document** | Consolidation de 3 feuilles de route + plans detailles             | Note descriptive individuelle                                | Note descriptive individuelle                                           |

**Observations cles** :

- Le Document 1 est une **consolidation** contenant 3 feuilles de route repetant le meme schema (Tables 0-6, 7-13, 14-20).
- Les Documents 2 et 3 sont des **notes descriptives individuelles** avec une structure identique a 6 tableaux.
- Les Documents 2 et 3 sont des **versions evoluees** (plus structurees, avec couleurs, en-tete officiel) par rapport au Document 1.

---

## 2. Document 1 : Feuilles de routes consolidees 2025

### 2.1 Mise en page

| Propriete        | Valeur                                                        |
| ---------------- | ------------------------------------------------------------- |
| Format papier    | A4 (8.27 x 11.69 pouces)                                      |
| Orientations     | Mixte : sections Portrait (0,1,3,4,6,7) et Landscape (2,5,8)  |
| Marges Portrait  | Gauche: 0.92", Droite: 0.90", Haut: 0.99", Bas: 0.19"         |
| Marges Landscape | Variables (ex: section 2: G:0.19", D:0.98", H:0.92", B:0.90") |

### 2.2 Structure repetee (x3 feuilles de route)

Le document contient **3 feuilles de route** avec le schema identique suivant :

#### Bloc A : En-tete / Identification (Table 4x2)

| Ligne | Colonne gauche (label, BOLD)         | Colonne droite (valeur)     |
| ----- | ------------------------------------ | --------------------------- |
| 0     | DIRECTION DES SYSTEMES D'INFORMATION | (cellule fusionnee)         |
| 1     | REFERENCE PLAN                       | (vide - a remplir)          |
| 2     | Nom du plan                          | (nom du plan)               |
| 3     | Destinataire                         | Directeur General de l'ARTI |

#### Bloc B : Description (Table 8x1, colonne unique)

| Ligne | Contenu                                        |
| ----- | ---------------------------------------------- |
| 0     | **Description du plan** (label BOLD)           |
| 1     | Texte descriptif (objectifs du projet)         |
| 2     | **Direction** (label BOLD)                     |
| 3     | Direction des Systemes d'Information (DSI)     |
| 4     | **RATTACHEMENT STRATEGIQUE** (label BOLD)      |
| 5     | **OS** + texte objectif strategique            |
| 6     | **ACTION** + texte action                      |
| 7     | **Budget previsionnel du plan** + montant FCFA |

#### Bloc C : Expose / Avis (Table 4x1)

| Ligne | Contenu                                             |
| ----- | --------------------------------------------------- |
| 0     | **Expose** (label BOLD)                             |
| 1     | Texte de l'expose (description detaillee du projet) |
| 2     | **Avis** (label BOLD)                               |
| 3     | Texte de l'avis                                     |

#### Bloc D : Suite Avis + Recommandations (Table 3x1)

| Ligne | Contenu                                |
| ----- | -------------------------------------- |
| 0     | Suite du texte d'avis                  |
| 1     | **Recommandations** (label BOLD)       |
| 2     | Liste des recommandations (avec puces) |

#### Bloc E : Observations DG (Table 2x1)

| Ligne | Contenu                                            |
| ----- | -------------------------------------------------- |
| 0     | **OBSERVATIONS DU DIRECTEUR GENERAL** (label BOLD) |
| 1     | (vide - zone de saisie libre par le DG)            |

#### Bloc F : Decision / Signature (Table 2x3)

| Colonne | DATE            | DECISION            | SIGNATURE            |
| ------- | --------------- | ------------------- | -------------------- |
| En-tete | **DATE** (BOLD) | **DECISION** (BOLD) | **SIGNATURE** (BOLD) |
| Valeur  | "Abidjan, le"   | (vide)              | (vide)               |

#### Bloc G : Plan detaille (Table NxN, LANDSCAPE)

Tableau de planification avec les colonnes suivantes :

| Colonne       | Description                        | Style en-tete                        |
| ------------- | ---------------------------------- | ------------------------------------ |
| Activite      | Nom de l'activite principale       | BOLD, bg noir (#000000), texte blanc |
| Sous-Activite | Description de la tache            | bg noir (#000000), texte blanc       |
| Duree         | Nombre de jours                    | bg noir (#000000), texte blanc       |
| Date de debut | Format JJ/MM/AAAA ou nombre serial | bg noir (#000000), texte blanc       |
| Date de fin   | Format JJ/MM/AAAA ou nombre serial | bg noir (#000000), texte blanc       |
| Resultats     | Zone libre                         | bg noir (#000000), texte blanc       |

**Alternance de couleurs des lignes** : Bleu clair (#C5D9F1) et blanc (#FFFFFF).

### 2.3 Les 3 feuilles de route contenues

| #   | Nom du plan                                           | Budget           | Taches                          |
| --- | ----------------------------------------------------- | ---------------- | ------------------------------- |
| 1   | Infrastructures & Connectivite (Datacenter -> Reseau) | 148 943 000 FCFA | 15 taches (Table 6: 17 lignes)  |
| 2   | Securite & Resilience (Securisation -> Sauvegarde)    | 130 927 000 FCFA | 14 taches (Table 13: 16 lignes) |
| 3   | Collaboration & Services (Outils collaboratifs)       | 270 130 000 FCFA | 28 taches (Table 20: 31 lignes) |

### 2.4 Images

| Image       | Type | Taille        | Utilisation probable      |
| ----------- | ---- | ------------- | ------------------------- |
| image1.jpeg | JPEG | 5 691 octets  | Logo ARTI (petit)         |
| image2.png  | PNG  | 18 392 octets | Logo/blason Republique CI |
| image3.jpeg | JPEG | 5 691 octets  | Logo ARTI (duplique)      |
| image4.png  | PNG  | 18 392 octets | Logo/blason (duplique)    |

### 2.5 Paragraphes autonomes

- `P[7]` : "PJ : Le plan detaille par activites et taches" (style Body Text, repete avant chaque plan detaille)
- `P[22]` : "PLAN DETAILLE FEUILLE DE ROUTE | Infrastructures & Connectivite (Datacenter -> Reseau)" (style Heading 1)
- `P[45]` : "PLAN DETAILLE FEUILLE DE ROUTE | Securite & Resilience" (style Table Paragraph)
- `P[76]` : "PLAN DETAILLE FEUILLE DE ROUTE | Collaboration & Services" (style Table Paragraph)

---

## 3. Document 2 : NOTE_RELATIVE_006 - Licences DSI 2026

### 3.1 Mise en page

| Propriete     | Valeur                                           |
| ------------- | ------------------------------------------------ |
| Format papier | A4 (8.27 x 11.69 pouces)                         |
| Orientation   | Portrait uniquement                              |
| Marges        | Toutes a 0.50 pouces (1.27 cm) - marges reduites |

### 3.2 En-tete officiel (Table 0 : 1x3)

Structure en 3 colonnes sur une seule ligne :

| Col 0 (gauche)                 | Col 1 (centre) | Col 2 (droite)                                           |
| ------------------------------ | -------------- | -------------------------------------------------------- |
| Logo ARTI (2.30 x 0.71 pouces) | (vide)         | Logo Republique CI (1.04 x 0.94 pouces) + texte officiel |

**Texte officiel col 2** (alignement droit) :

```
REPUBLIQUE DE COTE D'IVOIRE          [BOLD]
Union - Discipline - Travail          [10pt, ITALIC]
---------                              [10pt, ligne decorative]
```

### 3.3 Bloc Identification (Table 1 : 4x2)

| Ligne | Label (col 0)                        | Valeur (col 1)                                          | Style label           | Couleur fond             |
| ----- | ------------------------------------ | ------------------------------------------------------- | --------------------- | ------------------------ |
| 0     | DIRECTION DES SYSTEMES D'INFORMATION | (cellule fusionnee)                                     | BOLD, couleur #FFFFFF | **#1F4E79** (bleu fonce) |
| 1     | Reference plan                       | 009                                                     | BOLD, couleur #000000 | **#D6E3F0** (bleu clair) |
| 2     | Nom du plan                          | Plan de Gestion et Renouvellement des Licences DSI 2026 | BOLD, couleur #000000 | **#D6E3F0**              |
| 3     | Destinataire                         | Monsieur N'ZI Assamoua Desire                           | BOLD, couleur #000000 | **#D6E3F0**              |

### 3.4 Bloc Description (Table 2 : 5x2)

| Label (col 0, BOLD, bg #D6E3F0) | Valeur (col 1)                                |
| ------------------------------- | --------------------------------------------- |
| Description du plan             | Texte descriptif du programme de licences     |
| Direction                       | Direction des Systemes d'Information          |
| OS                              | OS1 + OS2 (deux objectifs strategiques)       |
| ACTION                          | Gestion proactive des licences logicielles... |
| Budget previsionnel du plan     | ~17 000 000 FCFA                              |

**Difference cle avec Doc 1** : Le bloc Description est sur **2 colonnes** (label / valeur) au lieu d'une seule colonne.

### 3.5 Bloc Expose / Avis / Recommandations (Table 3 : 3x2)

Structure en 2 colonnes (label gauche, contenu droit) :

| Label (col 0, BOLD, bg #D6E3F0) | Contenu (col 1, 10pt)                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Expose**                      | Texte structure avec sections numerotees : 1. Contexte, 2. Diagnostic, 3. Inventaire, 4. Calendrier, 5. Budget |
| **Avis**                        | Texte de l'avis avec liste a puces                                                                             |
| **Recommandations**             | Texte des recommandations avec liste a puces                                                                   |

**Contenu de l'Expose (Note 006)** - structure tres riche :

1. **Contexte** : Strategie de maitrise des couts et continuite de service
2. **Diagnostic de l'existant** : 6 problematiques classees par priorite (CRITIQUE / HAUTE / MOYENNE / A CLARIFIER)
3. **Inventaire des licences DSI** :
   - 3.1 Licences a renouvellement annuel (Fortigate, M365, Power BI, Adobe, O2Switch, domaine)
   - 3.2 Abonnements mensuels (Cursor 120K, Claude MAX 120K, NEON 41K = 281K/mois)
   - 3.3 Licences gratuites/essais (Copilot Studio, Power Apps, etc.)
   - 3.4 Nouvelles acquisitions (GitHub Copilot Pro+, Supabase Cloud)
4. **Calendrier des echeances 2026** : Jan -> Mars -> Juin -> Juillet + Mensuel
5. **Estimation budgetaire** : Detail poste par poste, total ~5 522 000 FCFA hors M365/Sage/Fortigate

### 3.6 Bloc Observations DG (Table 4 : 2x1)

| Ligne | Contenu                           | Style                                         |
| ----- | --------------------------------- | --------------------------------------------- |
| 0     | OBSERVATIONS DU DIRECTEUR GENERAL | BOLD, texte blanc (#FFFFFF), fond **#1F4E79** |
| 1     | (vide)                            | Zone de saisie                                |

### 3.7 Bloc Decision / Signature (Table 5 : 2x3)

Identique au Document 1 mais avec fond **#D6E3F0** sur les en-tetes :

| DATE (bg #D6E3F0, BOLD) | DECISION (bg #D6E3F0, BOLD) | SIGNATURE (bg #D6E3F0, BOLD) |
| ----------------------- | --------------------------- | ---------------------------- |
| Abidjan, le             | (vide)                      | (vide)                       |

### 3.8 Paragraphe autonome

`P[6]` : "**PJ :** Tableau recapitulatif des echeances et budget des licences DSI 2026" (10pt, PJ en BOLD)

### 3.9 Polices et couleurs

| Element                           | Police | Taille | Style  | Couleur texte   | Fond                 |
| --------------------------------- | ------ | ------ | ------ | --------------- | -------------------- |
| Titre direction                   | -      | -      | BOLD   | #FFFFFF (blanc) | #1F4E79 (bleu fonce) |
| Labels metadonnees                | -      | -      | BOLD   | #000000         | #D6E3F0 (bleu clair) |
| Valeurs metadonnees               | -      | -      | Normal | #000000         | -                    |
| Expose / Avis / Reco contenu      | -      | 10pt   | Normal | -               | -                    |
| En-tete Republique                | -      | -      | BOLD   | -               | -                    |
| Devise "Union-Discipline-Travail" | -      | 10pt   | ITALIC | -               | -                    |
| Observations DG titre             | -      | -      | BOLD   | #FFFFFF         | #1F4E79              |

---

## 4. Document 3 : NOTE_RELATIVE_008 - Materiel Informatique 2026

### 4.1 Mise en page

Identique au Document 2 : A4 Portrait, marges 0.50 pouces.

### 4.2 En-tete officiel (Table 0 : 2x3)

Similaire au Document 2 mais avec **2 lignes** au lieu d'une :

|         | Col 0 (gauche)                 | Col 1 (centre) | Col 2 (droite)                                                                            |
| ------- | ------------------------------ | -------------- | ----------------------------------------------------------------------------------------- |
| Ligne 0 | Logo ARTI (1.72 x 0.53 pouces) | (vide)         | "REPUBLIQUE DE COTE D'IVOIRE" (10pt, BOLD) + "Union - Discipline - Travail" (9pt, ITALIC) |
| Ligne 1 | (vide)                         | (vide)         | Logo Republique CI (1.04 x 0.94 pouces)                                                   |

**Difference avec Doc 2** : Le logo ARTI est plus petit (1.72x0.53" vs 2.30x0.71") et le logo CI est sur la ligne 1 au lieu de la ligne 0.

### 4.3 Bloc Identification (Table 1 : 4x2)

| Ligne | Label (col 0)                        | Valeur (col 1)                                       | Style                           | Couleur fond                  |
| ----- | ------------------------------------ | ---------------------------------------------------- | ------------------------------- | ----------------------------- |
| 0     | DIRECTION DES SYSTEMES D'INFORMATION | (fusionnee)                                          | 12pt, BOLD, couleur **#0066B3** | **#E6F3FA** (bleu tres clair) |
| 1     | Reference plan                       | 008                                                  | BOLD                            | **#E6F3FA**                   |
| 2     | Nom du plan                          | Plan de Renouvellement du Materiel Informatique 2026 | BOLD                            | **#E6F3FA**                   |
| 3     | Destinataire                         | Monsieur N'ZI Assamoua Desire                        | BOLD                            | **#E6F3FA**                   |

**Difference avec Doc 2** : Palette de couleurs differente (#E6F3FA/#0066B3 vs #D6E3F0/#1F4E79).

### 4.4 Bloc Description (Table 2 : 5x2)

Meme structure que Doc 2, fond **#E6F3FA** :

| Label                       | Valeur                                                                   |
| --------------------------- | ------------------------------------------------------------------------ |
| Description du plan         | Programme de renouvellement infrastructure informatique 2026             |
| Direction                   | Direction des Systemes d'Information                                     |
| OS                          | OS1 : Construire la structure fonctionnelle et de pilotage de l'autorite |
| ACTION                      | Modernisation du parc informatique et des infrastructures                |
| Budget previsionnel du plan | 50 millions                                                              |

### 4.5 Bloc Expose / Avis / Recommandations (Table 3 : 3x2)

**Expose structure en sections numerotees avec sous-sections** :

Les titres de sections utilisent un style specifique :

- Titres principaux : **BOLD, couleur #0066B3** (ex: "1. Contexte", "2. Diagnostic", "3. Plan d'equipement", "4. Resultats attendus")
- Sous-titres : **BOLD, ITALIC** (ex: "3.1 Postes de Travail", "3.2 Mini-Serveur de Bureau")
- Texte normal : sans style particulier
- Noms de produits/marques : parfois dans des runs separes (ex: "WiFi", "Yealink", "Ubiquiti")

**Contenu de l'Expose (Note 008)** :

1. **Contexte** : Strategie de modernisation et transformation digitale
2. **Diagnostic de l'existant** : 4 problematiques (Critique/Eleve/Moyen) avec descriptions
3. **Plan d'equipement propose** :
   - 3.1 Postes de Travail (6 unites) - detail marque/modele/specs
   - 3.2 Mini-Serveur de Bureau (Lenovo ThinkStation P3 Ultra)
   - 3.3 Solution de Sauvegarde (NAS Synology + disques WD)
   - 3.4 Solutions d'Impression (Canon imageRUNNER x3, Xerox VersaLink x3)
   - 3.5 Infrastructure Reseau (Switch Ubiquiti, AP UniFi, TP-Link Mesh)
   - 3.6 Telephonie WiFi (32 telephones Yealink)
   - 3.7 Equipements Salle de Reunion (Samsung Flip, Epson, Barco)
   - 3.8 Outillage et Accessoires (iFixit, Fluke, cables)
4. **Resultats attendus** : 6 points

### 4.6 Blocs Observations DG et Decision/Signature

Meme structure que Doc 2, fond **#E6F3FA** au lieu de #D6E3F0/#1F4E79.

Le titre "OBSERVATIONS DU DIRECTEUR GENERAL" est en **BOLD + UNDERLINE** (difference avec Doc 2 qui est BOLD + blanc sur fond bleu fonce).

### 4.7 Paragraphe autonome

`P[4]` : "**PJ :** Le plan detaille par categorie d'equipements" (BOLD pour "PJ :")

### 4.8 Polices et couleurs

| Element                        | Police | Taille | Style            | Couleur texte            | Fond                          |
| ------------------------------ | ------ | ------ | ---------------- | ------------------------ | ----------------------------- |
| Titre direction                | -      | 12pt   | BOLD             | **#0066B3** (bleu moyen) | **#E6F3FA** (bleu tres clair) |
| Labels metadonnees             | -      | -      | BOLD             | -                        | **#E6F3FA**                   |
| Titres sections expose         | -      | -      | BOLD             | **#0066B3**              | -                             |
| Sous-titres expose             | -      | -      | BOLD + ITALIC    | -                        | -                             |
| Texte expose                   | -      | -      | Normal           | -                        | -                             |
| Noms critiques (en diagnostic) | -      | -      | BOLD             | -                        | -                             |
| Observations DG titre          | -      | -      | BOLD + UNDERLINE | -                        | **#E6F3FA**                   |

---

## 5. Analyse comparative des 3 documents

### 5.1 Structure commune

Les 3 documents partagent une **structure identique en 6 blocs** :

```
[EN-TETE]           Logo ARTI + Logo CI + "Republique de Cote d'Ivoire"
[IDENTIFICATION]    Direction, Reference, Nom, Destinataire
[DESCRIPTION]       Description, Direction, OS, ACTION, Budget
[EXPOSE/AVIS/RECO]  Expose detaille, Avis, Recommandations
[OBSERVATIONS DG]   Zone vide pour saisie DG
[DECISION]          Date, Decision, Signature
[PJ]                Mention de piece jointe
[PLAN DETAILLE]     Tableau d'activites (optionnel, en paysage)
```

### 5.2 Differences entre versions

| Aspect              | Document 1 (ancien)                                    | Documents 2 & 3 (nouveau)                                         |
| ------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| **En-tete**         | Images embeddees dans le body, pas de table structuree | Table 1x3 ou 2x3 avec logos + texte officiel                      |
| **Couleurs**        | Aucune couleur de fond dans les blocs meta             | Palette de couleurs coherente (bleu fonce/clair)                  |
| **Description**     | Table a 1 colonne (label + valeur sur memes cellules)  | Table a 2 colonnes (label / valeur separees)                      |
| **Expose**          | Texte simple sans sections numerotees                  | Texte structure avec numerotation (1. 2. 3. ...) et sous-sections |
| **Reference**       | Champ "REFERENCE PLAN" vide                            | Champ "Reference plan" avec numero (008, 009)                     |
| **Destinataire**    | "Directeur General de l'ARTI" (generique)              | "Monsieur N'ZI Assamoua Desire" (nominatif)                       |
| **Observations DG** | Fond blanc                                             | Fond colore (bleu fonce ou bleu clair)                            |
| **Plan detaille**   | Present (en paysage, tables 17-31 lignes)              | Absent (mentionne en PJ)                                          |

### 5.3 Differences entre Doc 2 et Doc 3

| Aspect                 | Document 2 (NOTE 006)                       | Document 3 (NOTE 008)                            |
| ---------------------- | ------------------------------------------- | ------------------------------------------------ |
| **Palette couleurs**   | #1F4E79 (bleu fonce) + #D6E3F0 (bleu clair) | #0066B3 (bleu moyen) + #E6F3FA (bleu tres clair) |
| **Titre direction**    | Texte blanc sur fond bleu fonce             | Texte #0066B3 sur fond bleu tres clair           |
| **Titres expose**      | Sans style particulier                      | BOLD + couleur #0066B3                           |
| **Sous-titres expose** | Sans style                                  | BOLD + ITALIC                                    |
| **Logo ARTI**          | 2.30 x 0.71 pouces                          | 1.72 x 0.53 pouces                               |
| **En-tete table**      | 1 ligne x 3 colonnes                        | 2 lignes x 3 colonnes                            |
| **Observations DG**    | BOLD, blanc sur fond #1F4E79                | BOLD + UNDERLINE sur fond #E6F3FA                |
| **Police expose**      | 10pt uniforme                               | Default (+ BOLD/ITALIC pour titres)              |

---

## 6. Structure commune identifiee (modele canonique)

Voici le modele canonique de "Note Descriptive / Feuille de Route ARTI" a implementer dans le canvas :

### 6.1 Blocs du canvas

```
BLOC 1 : EN-TETE OFFICIEL
  - Logo ARTI (gauche, ~2x0.7 pouces)
  - Logo Republique CI (droite, ~1x0.9 pouces)
  - Texte : "REPUBLIQUE DE COTE D'IVOIRE" (BOLD, centre/droite)
  - Texte : "Union - Discipline - Travail" (ITALIC, centre/droite)
  - Ligne decorative (tirets)

BLOC 2 : IDENTIFICATION
  - Direction : "DIRECTION DES SYSTEMES D'INFORMATION" (titre, BOLD, fond colore)
  - Reference plan : numero (ex: 006, 008, 009)
  - Nom du plan : texte libre
  - Destinataire : nom de la personne

BLOC 3 : DESCRIPTION
  - Description du plan : paragraphe libre
  - Direction : nom de la direction emettrice
  - OS : Objectif(s) Strategique(s) - peut etre multiple
  - ACTION : description de l'action
  - Budget previsionnel du plan : montant en FCFA

BLOC 4 : EXPOSE
  - Texte structure avec sections numerotees (1. Contexte, 2. Diagnostic, etc.)
  - Peut contenir des listes a puces
  - Sections classiques : Contexte, Diagnostic, Plan/Inventaire, Calendrier, Budget

BLOC 5 : AVIS
  - Texte d'avis, peut contenir des listes a puces

BLOC 6 : RECOMMANDATIONS
  - Liste de recommandations avec puces

BLOC 7 : OBSERVATIONS DU DIRECTEUR GENERAL
  - Zone de texte libre (vide par defaut, remplie par le DG)

BLOC 8 : DECISION / SIGNATURE
  - Date : "Abidjan, le [date]"
  - Decision : texte libre
  - Signature : zone de signature

BLOC 9 : PIECE JOINTE (optionnel)
  - Mention "PJ : [description]"

BLOC 10 : PLAN DETAILLE (optionnel, en paysage)
  - Tableau avec colonnes : Activite, Sous-Activite, Duree, Date debut, Date fin, Resultats
  - Alternance de couleurs par ligne
```

### 6.2 Champs de donnees

| Champ                  | Type            | Obligatoire | Exemple                                                   |
| ---------------------- | --------------- | ----------- | --------------------------------------------------------- |
| direction              | string          | Oui         | "DIRECTION DES SYSTEMES D'INFORMATION"                    |
| reference_plan         | string          | Oui         | "009"                                                     |
| nom_plan               | string          | Oui         | "Plan de Gestion et Renouvellement des Licences DSI 2026" |
| destinataire           | string          | Oui         | "Monsieur N'ZI Assamoua Desire"                           |
| description            | text (richtext) | Oui         | Paragraphe libre                                          |
| direction_emettrice    | string          | Oui         | "Direction des Systemes d'Information"                    |
| objectifs_strategiques | text            | Oui         | "OS1 : Construire la structure fonctionnelle..."          |
| action                 | text            | Oui         | "Gestion proactive des licences logicielles..."           |
| budget_previsionnel    | string          | Oui         | "~17 000 000 FCFA" ou "50 millions"                       |
| expose                 | richtext        | Oui         | Texte structure avec sections                             |
| avis                   | richtext        | Oui         | Texte avec listes a puces                                 |
| recommandations        | richtext        | Oui         | Liste de recommandations                                  |
| observations_dg        | text            | Non         | (rempli par le DG)                                        |
| date_decision          | date            | Non         | "Abidjan, le [date]"                                      |
| decision               | text            | Non         | (texte libre)                                             |
| signature              | string          | Non         | (zone de signature)                                       |
| piece_jointe_mention   | string          | Non         | "Tableau recapitulatif..."                                |
| activites              | array           | Non         | Tableau de planification                                  |

---

## 7. Specifications techniques pour le canvas

### 7.1 Palette de couleurs

Les documents utilisent 2 palettes differentes. Voici les couleurs a supporter :

| Nom                | Hex     | Utilisation                                          |
| ------------------ | ------- | ---------------------------------------------------- |
| Bleu fonce v1      | #1F4E79 | Fond titre direction, fond observations DG (Doc 2)   |
| Bleu clair v1      | #D6E3F0 | Fond labels metadata, fond decision (Doc 2)          |
| Bleu moyen v2      | #0066B3 | Couleur texte titre direction, titres expose (Doc 3) |
| Bleu tres clair v2 | #E6F3FA | Fond labels metadata, fond decision (Doc 3)          |
| Noir               | #000000 | Texte standard, fond en-tete tableau planning        |
| Blanc              | #FFFFFF | Texte sur fond fonce                                 |
| Bleu alternance    | #C5D9F1 | Lignes paires tableau planning (Doc 1)               |
| Rouge              | #FF0000 | Alerte/urgence (quelques en-tetes Table 20 Doc 1)    |

### 7.2 Polices

| Contexte                      | Taille         | Style               |
| ----------------------------- | -------------- | ------------------- |
| Texte standard                | default (11pt) | Normal              |
| Contenu expose/avis/reco      | 10pt           | Normal              |
| Devise Republique             | 9-10pt         | ITALIC              |
| Titre direction               | 12pt           | BOLD                |
| Labels (Reference, Nom, etc.) | default        | BOLD                |
| Titres sections expose        | default        | BOLD, couleur bleue |
| Sous-titres expose            | default        | BOLD + ITALIC       |
| Noms critiques (diagnostic)   | default        | BOLD                |
| En-tete tableau planning      | default        | BOLD, texte blanc   |

### 7.3 Images / Logos

| Image                        | Dimensions approximatives | Position            |
| ---------------------------- | ------------------------- | ------------------- |
| Logo ARTI                    | 1.7-2.3 x 0.5-0.7 pouces  | Gauche de l'en-tete |
| Logo/Armoiries Republique CI | 1.0 x 0.9 pouces          | Droite de l'en-tete |

### 7.4 Format des montants

Les montants sont exprimes en FCFA avec differents formats :

- `148 943 000 FCFA` (espaces comme separateurs de milliers)
- `~17 000 000FCFA` (approximatif, pas d'espace avant FCFA)
- `50 millions` (texte libre)
- `1 390 000 FCFA/an` (avec unite de temps)
- `120 000 FCFA/mois` (mensuel)
- `192 EUR/an` (devise etrangere)
- `390 USD/an (~250 000 FCFA)` (conversion)

**Recommandation canvas** : Stocker le montant en nombre + devise + periodicite, afficher avec separateur d'espaces.

---

## 8. Vocabulaire metier et champs

### 8.1 Termes cles identifies

| Terme                        | Signification                                          | Contexte                   |
| ---------------------------- | ------------------------------------------------------ | -------------------------- |
| **Note descriptive**         | Document de proposition/justification de projet        | Type de document           |
| **Feuille de route**         | Plan d'actions detaille avec echancier                 | Type de document (associe) |
| **Reference plan**           | Numero unique d'identification du plan                 | Champ metadata             |
| **OS**                       | Objectif Strategique                                   | Rattachement strategique   |
| **ACTION**                   | Action operationnelle liee a l'OS                      | Rattachement strategique   |
| **RATTACHEMENT STRATEGIQUE** | Lien avec la strategie globale ARTI                    | Section metadata           |
| **Budget previsionnel**      | Estimation financiere du plan                          | Champ metadata             |
| **Expose**                   | Description detaillee et argumentee du projet          | Section principale         |
| **Avis**                     | Analyse et opinion technique de la direction emettrice | Section principale         |
| **Recommandations**          | Actions demandees au destinataire                      | Section principale         |
| **Observations du DG**       | Commentaires/remarques du Directeur General            | Section de validation      |
| **Decision**                 | Choix du DG (approuver, rejeter, reporter)             | Section de validation      |
| **PJ**                       | Piece(s) Jointe(s)                                     | Annexe                     |
| **FCFA**                     | Franc CFA (monnaie UEMOA)                              | Unite monetaire            |
| **DSI**                      | Direction des Systemes d'Information                   | Direction emettrice        |
| **ARTI**                     | Autorite de Regulation du Transport Interieur          | Organisation               |
| **DG**                       | Directeur General                                      | Signataire/destinataire    |

### 8.2 Niveaux de priorite (identifies dans le diagnostic)

| Niveau          | Couleur suggeree | Exemples                                 |
| --------------- | ---------------- | ---------------------------------------- |
| CRITIQUE        | Rouge            | Licence Fortigate expiree, impression    |
| HAUTE / ELEVE   | Orange           | Microsoft 365, serveur DSI               |
| MOYENNE / MOYEN | Jaune            | Services Cloud, Adobe, postes de travail |
| A CLARIFIER     | Gris             | Sage Comptabilite                        |

### 8.3 Workflow implicite

Le document revele un workflow de validation :

```
1. Direction emettrice redige la note descriptive
   -> Champs : Description, Expose, Avis, Recommandations
2. Note transmise au DG (Destinataire)
   -> Champ : Destinataire
3. DG ajoute ses Observations
   -> Champ : Observations DG
4. DG prend une Decision
   -> Champs : Date, Decision, Signature
```

Ce workflow correspond au cycle : **Redaction -> Soumission -> Observations -> Decision**.

### 8.4 Structure du format de reference

Le format de reference utilise dans ces documents est un simple numero (006, 008, 009). Cependant, les documents mentionnent un format de reference plus complet dans le nom de fichier :

```
NOTE_RELATIVE_006_Plan_Renouvellement_Licences_DSI_2026
NOTE_RELATIVE_008_Plan_Renouvellement_Materiel_Informatique_2026
```

Format implicite : `NOTE_RELATIVE_{NUMERO}_{Description}_{Direction}_{ANNEE}`

Le format de reference complet ARTI mentionne dans d'autres contextes est :

```
NOTE/ARTI/DG/{DIRECTION}/N{NUMERO}/{ANNEE}
```

Exemple : `NOTE/ARTI/DG/DSI/N006/2026`

---

## Annexe A : Resume des donnees financieres

### Feuilles de route 2025 (Document 1)

| Plan                           | Budget FCFA     |
| ------------------------------ | --------------- |
| Infrastructures & Connectivite | 148 943 000     |
| Securite & Resilience          | 130 927 000     |
| Collaboration & Services       | 270 130 000     |
| **TOTAL**                      | **550 000 000** |

### Note 006 - Licences DSI 2026 (Document 2)

| Poste                                              | Montant FCFA/an |
| -------------------------------------------------- | --------------- |
| Abonnements mensuels (Cursor+Claude+NEON)          | 3 372 000       |
| Adobe Creative Cloud                               | ~1 390 000      |
| Hebergement O2Switch                               | ~125 000        |
| Domaine arti.ci                                    | ~25 000         |
| Nouvelles acquisitions (GitHub Copilot + Supabase) | ~610 000        |
| **Sous-total hors M365/Sage/Fortigate**            | **~5 522 000**  |
| **Estimation globale**                             | **~17 000 000** |

### Note 008 - Materiel Informatique 2026 (Document 3)

| Categorie         | Description                                           |
| ----------------- | ----------------------------------------------------- |
| Postes de travail | 6 unites (HP EliteOne, EliteBook, Apple iMac/MacBook) |
| Mini-serveur      | Lenovo ThinkStation P3 Ultra                          |
| Sauvegarde        | NAS Synology + disques externes                       |
| Impression        | 3x Canon imageRUNNER + 3x Xerox VersaLink             |
| Reseau            | Switch Ubiquiti + AP UniFi + TP-Link Mesh             |
| Telephonie        | 32 telephones Yealink WiFi                            |
| Salle de reunion  | Samsung Flip 85" + Epson + Barco                      |
| Outillage         | iFixit + Fluke + accessoires                          |
| **Budget total**  | **50 000 000 FCFA**                                   |

---

## Annexe B : Correspondance Tables -> Blocs pour chaque document

### Document 1 (x3 feuilles de route)

| Feuille 1 | Feuille 2 | Feuille 3 | Bloc                               |
| --------- | --------- | --------- | ---------------------------------- |
| Table 0   | Table 7   | Table 14  | Identification (4x2)               |
| Table 1   | Table 8   | Table 15  | Description (8x1)                  |
| Table 2   | Table 9   | Table 16  | Expose + Avis (4x1)                |
| Table 3   | Table 10  | Table 17  | Suite Avis + Recommandations (3x1) |
| Table 4   | Table 11  | Table 18  | Observations DG (2x1)              |
| Table 5   | Table 12  | Table 19  | Decision/Signature (2x3)           |
| Table 6   | Table 13  | Table 20  | Plan detaille (Nx6, landscape)     |

### Documents 2 et 3

| Table   | Bloc                                     | Dimensions               |
| ------- | ---------------------------------------- | ------------------------ |
| Table 0 | En-tete officiel (logos + Republique CI) | 1x3 (Doc2) ou 2x3 (Doc3) |
| Table 1 | Identification                           | 4x2                      |
| Table 2 | Description                              | 5x2                      |
| Table 3 | Expose + Avis + Recommandations          | 3x2                      |
| Table 4 | Observations DG                          | 2x1                      |
| Table 5 | Decision / Signature                     | 2x3                      |

---

_Fin de l'analyse. Ce document sera utilise comme reference pour la conception du canvas de notes SYGFP._
