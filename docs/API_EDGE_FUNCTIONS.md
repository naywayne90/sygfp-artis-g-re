# API Edge Functions - Documentation

> **Version**: 1.0 | **Derniere mise a jour**: 2026-02-06 | **Runtime**: Deno (Supabase Edge Functions)

---

## Vue d'ensemble

SYGFP utilise 4 Edge Functions Supabase pour les operations cote serveur necessitant des privileges eleves ou l'acces a des services externes.

**URL de base** : `https://tjagvgqthlibdpvztvaf.supabase.co/functions/v1/`

**Headers communs** :

```
Authorization: Bearer <access_token>
Content-Type: application/json
apikey: <supabase_anon_key>
```

---

## 1. send-notification-email

Envoie un email de notification a un utilisateur via l'API Resend. Respecte les preferences de notification de l'utilisateur.

### Endpoint

```
POST /functions/v1/send-notification-email
```

### Headers requis

| Header          | Valeur                  |
| --------------- | ----------------------- |
| `Authorization` | `Bearer <access_token>` |
| `Content-Type`  | `application/json`      |
| `apikey`        | `<supabase_anon_key>`   |

### Body (JSON)

| Champ           | Type          | Requis | Description                                     |
| --------------- | ------------- | ------ | ----------------------------------------------- |
| `user_id`       | string (UUID) | Oui    | ID de l'utilisateur destinataire                |
| `type`          | string        | Oui    | Type de notification (voir types ci-dessous)    |
| `title`         | string        | Oui    | Titre de la notification                        |
| `message`       | string        | Oui    | Corps du message                                |
| `entity_type`   | string        | Non    | Type d'entite (ex: `engagement`, `liquidation`) |
| `entity_id`     | string (UUID) | Non    | ID de l'entite concernee                        |
| `entity_numero` | string        | Non    | Numero de reference de l'entite                 |

### Types de notification

| Type              | Label affiche         |
| ----------------- | --------------------- |
| `validation`      | Demande de validation |
| `rejet`           | Document rejete       |
| `differe`         | Document differe      |
| `piece_manquante` | Piece manquante       |
| `alerte`          | Alerte                |
| `info`            | Information           |
| `echeance`        | Echeance              |

### Reponses

**Succes (200)** :

```json
{
  "success": true,
  "email_id": "resend-email-id"
}
```

**Email desactive (200)** :

```json
{
  "success": true,
  "skipped": true,
  "reason": "Email notifications disabled for this type"
}
```

**Champs manquants (400)** :

```json
{
  "success": false,
  "error": "Missing required fields: user_id, type, title, message"
}
```

**Utilisateur non trouve (404)** :

```json
{
  "success": false,
  "error": "User not found or no email address"
}
```

**Service non configure (503)** :

```json
{
  "success": false,
  "error": "Email service not configured. RESEND_API_KEY is missing.",
  "code": "MISSING_API_KEY"
}
```

### Exemple curl

```bash
curl -X POST \
  'https://tjagvgqthlibdpvztvaf.supabase.co/functions/v1/send-notification-email' \
  -H 'Authorization: Bearer <access_token>' \
  -H 'Content-Type: application/json' \
  -H 'apikey: <supabase_anon_key>' \
  -d '{
    "user_id": "uuid-utilisateur",
    "type": "validation",
    "title": "Engagement en attente de validation",
    "message": "Engagement ENG-2026-000123 necessite votre validation.",
    "entity_type": "engagement",
    "entity_id": "uuid-engagement",
    "entity_numero": "ENG-2026-000123"
  }'
```

### Variables d'environnement requises

| Variable                    | Description                          |
| --------------------------- | ------------------------------------ |
| `RESEND_API_KEY`            | Cle API Resend pour l'envoi d'emails |
| `SUPABASE_URL`              | URL du projet Supabase               |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service role pour acces admin    |

### Comportement

1. Verifie que `RESEND_API_KEY` est configure
2. Valide les champs requis (`user_id`, `type`, `title`, `message`)
3. Recupere l'email et le nom de l'utilisateur depuis la table `profiles`
4. Verifie les preferences de notification (table `notification_preferences`)
5. Si les emails sont actives pour ce type, envoie via Resend avec un template HTML stylise
6. Met a jour le champ `email_sent` de la notification si `entity_id` est fourni

---

## 2. create-user

Cree un nouvel utilisateur dans Supabase Auth et met a jour son profil. Reserve aux administrateurs.

### Endpoint

```
POST /functions/v1/create-user
```

### Headers requis

| Header          | Valeur                                     |
| --------------- | ------------------------------------------ |
| `Authorization` | `Bearer <access_token>` (token d'un admin) |
| `Content-Type`  | `application/json`                         |

### Body (JSON)

| Champ                | Type          | Requis | Description                           |
| -------------------- | ------------- | ------ | ------------------------------------- |
| `email`              | string        | Oui    | Adresse email                         |
| `password`           | string        | Oui    | Mot de passe (min. 6 caracteres)      |
| `first_name`         | string        | Oui    | Prenom                                |
| `last_name`          | string        | Oui    | Nom                                   |
| `matricule`          | string        | Non    | Matricule agent                       |
| `telephone`          | string        | Non    | Numero de telephone                   |
| `direction_id`       | string (UUID) | Non    | Direction de rattachement             |
| `role_hierarchique`  | string        | Non    | Niveau hierarchique (defaut: `Agent`) |
| `profil_fonctionnel` | string        | Non    | Profil (defaut: `Operationnel`)       |

### Reponses

**Succes (200)** :

```json
{
  "success": true,
  "user": {
    "id": "uuid-nouveau-user",
    "email": "user@example.com",
    "first_name": "Jean",
    "last_name": "Dupont"
  }
}
```

**Non autorise (401)** :

```json
{
  "error": "Non autorise"
}
```

**Non admin (403)** :

```json
{
  "error": "Seuls les administrateurs peuvent creer des utilisateurs"
}
```

**Email existant (400)** :

```json
{
  "error": "Un utilisateur avec cet email existe deja"
}
```

**Champs manquants (400)** :

```json
{
  "error": "Email, mot de passe, prenom et nom sont obligatoires"
}
```

### Exemple curl

```bash
curl -X POST \
  'https://tjagvgqthlibdpvztvaf.supabase.co/functions/v1/create-user' \
  -H 'Authorization: Bearer <admin_access_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "nouveau.agent@arti.ci",
    "password": "MotDePasse2026!",
    "first_name": "Marie",
    "last_name": "Konan",
    "matricule": "AGT-0456",
    "direction_id": "uuid-direction-dsi",
    "role_hierarchique": "Agent",
    "profil_fonctionnel": "Operationnel"
  }'
```

### Variables d'environnement requises

| Variable                    | Description                      |
| --------------------------- | -------------------------------- |
| `SUPABASE_URL`              | URL du projet Supabase           |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service role (creation auth) |
| `SUPABASE_ANON_KEY`         | Cle anon (verification appelant) |

### Comportement

1. Verifie que l'appelant est authentifie (header `Authorization`)
2. Verifie que l'appelant a le profil `Admin` (table `profiles`)
3. Valide les champs requis et la longueur du mot de passe
4. Cree l'utilisateur dans Supabase Auth avec `email_confirm: true`
5. Met a jour le profil avec les informations additionnelles (direction, role, matricule)

---

## 3. generate-export

Genere des exports de donnees budgetaires en CSV, Excel (CSV enrichi) ou PDF (HTML).

### Endpoint

```
POST /functions/v1/generate-export
```

### Headers requis

| Header          | Valeur                  |
| --------------- | ----------------------- |
| `Authorization` | `Bearer <access_token>` |
| `Content-Type`  | `application/json`      |

### Body (JSON)

| Champ                  | Type                            | Requis | Description                                                                         |
| ---------------------- | ------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| `type`                 | `"excel"` \| `"csv"` \| `"pdf"` | Oui    | Format d'export                                                                     |
| `entity_type`          | string                          | Oui    | Type d'entite (`budget`, `engagement`, `liquidation`, `ordonnancement`, `note_sef`) |
| `entity_id`            | string (UUID)                   | Non    | ID de l'entite (requis pour PDF)                                                    |
| `exercice`             | number                          | Oui    | Annee d'exercice                                                                    |
| `filters`              | object                          | Non    | Filtres de recherche                                                                |
| `include_referentiels` | boolean                         | Non    | Inclure les referentiels (Excel uniquement)                                         |

### Filtres disponibles (CSV/Excel)

| Filtre         | Type          | Description                       |
| -------------- | ------------- | --------------------------------- |
| `direction_id` | string (UUID) | Filtrer par direction             |
| `os_id`        | string (UUID) | Filtrer par objectif strategique  |
| `statut`       | string        | Filtrer par statut                |
| `search`       | string        | Recherche texte (code ou libelle) |

### Reponses

**Succes CSV/Excel** : Retourne directement le contenu du fichier avec les headers :

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="budget_2026_1707264000000.csv"
```

**Succes PDF** : Retourne le HTML du document avec les headers :

```
Content-Type: text/html; charset=utf-8
Content-Disposition: attachment; filename="engagement_ENG-2026-000123_1707264000000.html"
```

**Non autorise (401)** :

```json
{
  "error": "Non autorise"
}
```

### Entites PDF supportees

| `entity_type`    | Titre du PDF                    | Donnees affichees                                                          |
| ---------------- | ------------------------------- | -------------------------------------------------------------------------- |
| `engagement`     | Fiche d'Engagement              | Infos generales, imputation budgetaire, montant TTC, QR code, 3 signatures |
| `liquidation`    | Fiche de Liquidation            | Detail montants (HT, TVA, AIRSI, TTC, net a payer), service fait, QR code  |
| `ordonnancement` | Mandat de Paiement              | Beneficiaire, banque, RIB, mode paiement, montant, QR code                 |
| `note_sef`       | Note d'Accord de Principe (SEF) | Direction, demandeur, objet, statut validation/rejet/report, QR code       |

Tous les PDFs incluent :

- Logo ARTI en en-tete
- QR code avec le numero du document
- Zones de signature (3 signataires)
- Pied de page avec date de generation

### Exemple curl - Export CSV budget

```bash
curl -X POST \
  'https://tjagvgqthlibdpvztvaf.supabase.co/functions/v1/generate-export' \
  -H 'Authorization: Bearer <access_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "csv",
    "entity_type": "budget",
    "exercice": 2026,
    "filters": {
      "direction_id": "uuid-direction"
    }
  }' \
  -o budget_export.csv
```

### Exemple curl - Export PDF engagement

```bash
curl -X POST \
  'https://tjagvgqthlibdpvztvaf.supabase.co/functions/v1/generate-export' \
  -H 'Authorization: Bearer <access_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "pdf",
    "entity_type": "engagement",
    "entity_id": "uuid-engagement",
    "exercice": 2026
  }' \
  -o fiche_engagement.html
```

### Variables d'environnement requises

| Variable                    | Description            |
| --------------------------- | ---------------------- |
| `SUPABASE_URL`              | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service role       |

### Comportement

1. Verifie l'authentification de l'utilisateur
2. Selon le type d'export :
   - **CSV/Excel** : Recupere les lignes budgetaires avec filtres, genere le CSV (avec BOM UTF-8 pour Excel). Si `include_referentiels` est vrai, ajoute les referentiels (OS, actions, directions, NBE) en sections separees.
   - **PDF** : Recupere l'entite avec ses relations, genere un HTML stylise avec logo ARTI, QR code et zones de signature
3. Cree un enregistrement dans `export_jobs` pour tracabilite (expire apres 24h)
4. Retourne le fichier en telechargement direct

---

## 4. r2-storage

Gere les fichiers sur Cloudflare R2 (stockage S3-compatible) via des URLs presignees.

### Endpoint

```
POST /functions/v1/r2-storage
```

### Headers requis

| Header         | Valeur             |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

### Actions disponibles

#### 4.1 getUploadUrl - Obtenir une URL d'upload presignee

**Body** :

```json
{
  "action": "getUploadUrl",
  "key": "dossiers/uuid-dossier/facture.pdf",
  "contentType": "application/pdf",
  "expiresIn": 3600
}
```

| Champ         | Type             | Requis | Description                                  |
| ------------- | ---------------- | ------ | -------------------------------------------- |
| `action`      | `"getUploadUrl"` | Oui    | Action demandee                              |
| `key`         | string           | Oui    | Chemin du fichier dans le bucket             |
| `contentType` | string           | Oui    | Type MIME du fichier                         |
| `expiresIn`   | number           | Non    | Duree de validite en secondes (defaut: 3600) |

**Reponse (200)** :

```json
{
  "uploadUrl": "https://r2-endpoint.com/bucket/sygfp/dossiers/...",
  "key": "sygfp/dossiers/uuid-dossier/facture.pdf",
  "bucket": "lovable-storage",
  "expiresAt": "2026-02-06T15:00:00.000Z"
}
```

#### 4.2 getDownloadUrl - Obtenir une URL de telechargement presignee

**Body** :

```json
{
  "action": "getDownloadUrl",
  "key": "sygfp/dossiers/uuid-dossier/facture.pdf",
  "expiresIn": 3600
}
```

**Reponse (200)** :

```json
{
  "downloadUrl": "https://r2-endpoint.com/bucket/sygfp/dossiers/...",
  "expiresAt": "2026-02-06T15:00:00.000Z"
}
```

#### 4.3 deleteObject - Supprimer un fichier

**Body** :

```json
{
  "action": "deleteObject",
  "key": "sygfp/dossiers/uuid-dossier/facture.pdf"
}
```

**Reponse (200)** :

```json
{
  "success": true,
  "deletedKey": "sygfp/dossiers/uuid-dossier/facture.pdf"
}
```

#### 4.4 listObjects - Lister les fichiers d'un repertoire

**Body** :

```json
{
  "action": "listObjects",
  "prefix": "dossiers/uuid-dossier/"
}
```

**Reponse (200)** :

```json
{
  "objects": [
    {
      "key": "sygfp/dossiers/uuid-dossier/facture.pdf",
      "size": 245678,
      "lastModified": "2026-02-06T10:30:00.000Z",
      "etag": "\"abc123...\""
    }
  ],
  "count": 1,
  "prefix": "sygfp/dossiers/uuid-dossier/"
}
```

### Erreurs communes

**Champs manquants (400)** :

```json
{
  "error": "key and contentType required"
}
```

**Action inconnue (400)** :

```json
{
  "error": "Unknown action: invalidAction"
}
```

**Erreur serveur (500)** :

```json
{
  "error": "R2 credentials not configured"
}
```

### Exemple curl - Upload

```bash
# Etape 1 : Obtenir l'URL presignee
curl -X POST \
  'https://tjagvgqthlibdpvztvaf.supabase.co/functions/v1/r2-storage' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "getUploadUrl",
    "key": "dossiers/mon-dossier/facture.pdf",
    "contentType": "application/pdf"
  }'

# Etape 2 : Upload direct vers R2 avec l'URL retournee
curl -X PUT '<uploadUrl retournee>' \
  -H 'Content-Type: application/pdf' \
  --data-binary @facture.pdf
```

### Exemple curl - Download

```bash
curl -X POST \
  'https://tjagvgqthlibdpvztvaf.supabase.co/functions/v1/r2-storage' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "getDownloadUrl",
    "key": "sygfp/dossiers/mon-dossier/facture.pdf"
  }'
```

### Variables d'environnement requises

| Variable               | Description                               |
| ---------------------- | ----------------------------------------- |
| `R2_ENDPOINT`          | Endpoint Cloudflare R2                    |
| `R2_ACCESS_KEY_ID`     | Cle d'acces R2                            |
| `R2_SECRET_ACCESS_KEY` | Cle secrete R2                            |
| `R2_BUCKET`            | Nom du bucket (defaut: `lovable-storage`) |

### Comportement

- Tous les fichiers sont prefixes avec `sygfp/` dans le bucket
- Les URLs presignees expirent apres `expiresIn` secondes (defaut: 1 heure)
- L'action `listObjects` retourne un maximum de 1000 objets
- Le client upload/download directement vers R2 via les URLs presignees (pas de transit par Supabase)

---

## Appel depuis le Frontend

Les Edge Functions sont invoquees via le client Supabase :

```typescript
import { supabase } from '@/integrations/supabase/client';

// Appel d'une Edge Function
const { data, error } = await supabase.functions.invoke('send-notification-email', {
  body: {
    user_id: 'uuid',
    type: 'validation',
    title: 'Titre',
    message: 'Message',
  },
});
```

Le client Supabase ajoute automatiquement les headers `Authorization` et `apikey`.

---

## Deploiement

Les Edge Functions sont dans `/supabase/functions/` :

```
supabase/functions/
├── send-notification-email/
│   └── index.ts
├── create-user/
│   └── index.ts
├── generate-export/
│   └── index.ts
└── r2-storage/
    └── index.ts
```

Deploiement via CLI :

```bash
supabase functions deploy send-notification-email
supabase functions deploy create-user
supabase functions deploy generate-export
supabase functions deploy r2-storage
```

Les variables d'environnement sont configurees dans le Dashboard Supabase > Settings > Edge Functions.

---

_Derniere mise a jour: 2026-02-06_
