# Flux SEF → AEF : Continuité de la chaîne de dépense

## Vue d'ensemble

Ce document décrit le mécanisme de liaison automatique entre les **Notes SEF** (Sans Effet Financier) et les **Notes AEF** (Avec Effet Financier) via un **Dossier de dépense**.

```
┌─────────────┐    Validation DG    ┌─────────────┐    Création    ┌─────────────┐
│  Note SEF   │ ─────────────────▶  │   Dossier   │ ◀────────────  │  Note AEF   │
│  (brouillon)│                     │  (en_cours) │                │  (brouillon)│
└─────────────┘                     └─────────────┘                └─────────────┘
       ▲                                   │
       │                                   ▼
   created_by                        etape_courante = "note_aef"
```

## Mécanisme automatique

### 1. Validation d'une Note SEF

Lorsque le DG valide une note SEF (statut passe à `valide`), le système :

1. **Crée automatiquement un dossier** avec :
   - `objet` : copié de la note SEF
   - `exercice` : de la note SEF
   - `direction_id` : de la note SEF
   - `demandeur_id` : créateur de la note SEF
   - `beneficiaire_id` : si renseigné sur la note SEF
   - `type_dossier` : "AEF"
   - `statut_global` : "en_cours"
   - `etape_courante` : "note_aef" (prochaine étape)
   - `note_sef_id` : référence vers la note SEF source

2. **Met à jour la note SEF** avec le `dossier_id`

3. **Crée une étape initiale** dans `dossier_etapes` :
   - `type_etape` : "note_sef"
   - `entity_id` : ID de la note SEF
   - `statut` : "valide"
   - `commentaire` : "Note SEF validée par DG - dossier créé automatiquement"

### 2. Création de la Note AEF

Depuis l'écran détail de la Note SEF validée :

- Le bouton **"Créer Note AEF"** navigue vers `/notes-aef?prefill=<note_sef_id>`
- La page Notes AEF détecte le paramètre et pré-ouvre le formulaire
- Le formulaire pré-sélectionne la note SEF source
- Les champs sont pré-remplis (objet, direction, etc.)

## Schéma de données

### Table `dossiers`

```sql
-- Colonnes ajoutées pour la liaison
note_sef_id    uuid REFERENCES notes_dg(id)  -- Note SEF source
etape_courante text DEFAULT 'note_aef'        -- Étape workflow
```

### Table `notes_dg` (Notes SEF/AEF)

```sql
dossier_id     uuid REFERENCES dossiers(id)  -- Dossier lié
```

### Trigger

```sql
CREATE TRIGGER trg_create_dossier_on_sef_validation
  BEFORE UPDATE ON public.notes_dg
  FOR EACH ROW
  EXECUTE FUNCTION create_dossier_on_sef_validation();
```

## Parcours utilisateur

### 1. Agent/Gestionnaire
- Crée une Note SEF (brouillon)
- Remplit les informations
- Soumet pour validation DG

### 2. Direction Générale (DG)
- Visualise les notes à valider
- **Valide** la note → dossier créé automatiquement
- Ou **Rejette** / **Diffère** selon le cas

### 3. Agent/Gestionnaire (après validation)
- Voit le message "Note validée - Dossier créé"
- Clique sur "Créer Note AEF"
- Le formulaire s'ouvre pré-rempli
- Continue le flux vers l'engagement

## Routes concernées

| Route | Description |
|-------|-------------|
| `/notes-sef` | Liste des Notes SEF |
| `/notes-sef/:id` | Détail d'une Note SEF |
| `/notes-aef` | Liste des Notes AEF |
| `/notes-aef?prefill=<id>` | Création AEF pré-remplie |
| `/recherche?dossier=<id>` | Vue dossier complet |

## Sécurité

- La création de dossier est automatique (trigger SECURITY DEFINER)
- Seul le DG peut valider une note SEF
- Les étapes de dossier respectent les RLS définies
- L'audit log trace chaque action

## Évolutions futures

1. **Liaison AEF → Engagement** : Continuer la chaîne
2. **Copie des pièces jointes** : Transférer les documents SEF vers le dossier
3. **Workflow complet** : SEF → AEF → Engagement → Liquidation → Ordonnancement → Règlement
