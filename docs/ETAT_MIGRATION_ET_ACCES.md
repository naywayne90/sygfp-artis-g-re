# ÉTAT DE LA MIGRATION SYGFP ET GUIDE D'ACCÈS COMPLET

**Date de mise à jour:** 5 février 2026
**Version:** 2.0 (Migration complète)

---

## 1. ÉTAT ACTUEL DE LA MIGRATION

### 1.1 Résumé Global

| Donnée                        | Ancien SYGFP    | Nouveau (Supabase) | % Migré | Statut            |
| ----------------------------- | --------------- | ------------------ | ------- | ----------------- |
| **Fournisseurs/Prestataires** | 426             | 422                | 99%     | ✅ Complet        |
| **Notes SEF**                 | 4,823           | 4,836              | 100%    | ✅ Complet        |
| **Engagements**               | ~1,700 (legacy) | 2,805              | 100%+   | ✅ Complet        |
| **Liquidations**              | 2,954           | 3,633              | 100%+   | ✅ Complet        |
| **Ordonnancements**           | 2,726           | 3,501              | 100%+   | ✅ Complet        |
| **Directions**                | 9               | 25                 | Enrichi | ✅                |
| **Utilisateurs**              | 4               | 14                 | Enrichi | ✅                |
| **Pièces jointes**            | 9,375           | 0                  | 0%      | ⚠️ Voir section 7 |

> **Note:** Le nouveau système (Supabase) contient plus de données que l'ancien car il inclut les données migrées PLUS les nouvelles données créées depuis la mise en production.

### 1.2 Notes SEF par Année

| Année     | Ancien    | Supabase  | Statut  |
| --------- | --------- | --------- | ------- |
| 2024      | 1,994     | 1,994     | ✅ 100% |
| 2025      | 2,658     | 2,658     | ✅ 100% |
| 2026      | 171       | 184       | ✅ 100% |
| **TOTAL** | **4,823** | **4,836** | ✅      |

### 1.3 Historique des migrations (5 février 2026)

| Migration                 | Quantité | Détails                        |
| ------------------------- | -------- | ------------------------------ |
| Engagements 2024          | +1,111   | Extraits des liquidations 2024 |
| Liquidations 2024         | +791     | Migration complète             |
| Ordonnancements 2024      | +733     | Migration complète             |
| Liquidations 2025/2026    | +1,195   | Migration antérieure           |
| Ordonnancements 2025/2026 | +1,184   | Migration antérieure           |

### 1.4 Ce qui reste à faire

1. ✅ ~~Migrer les liquidations manquantes~~ - TERMINÉ
2. ✅ ~~Migrer les ordonnancements manquants~~ - TERMINÉ
3. ⚠️ **Localiser et migrer les pièces jointes** (9,375 fichiers - voir section 7)
4. ✅ ~~Vérifier la cohérence des données migrées~~ - OK

---

## 2. ACCÈS À L'ANCIEN SYSTÈME (SQL Server)

### 2.1 Architecture Serveurs ARTI

| Serveur        | IP            | Rôle              | Services               |
| -------------- | ------------- | ----------------- | ---------------------- |
| **DC-2**       | 192.168.0.226 | Domain Controller | Active Directory, DNS  |
| **App Server** | 192.168.0.8   | Application       | SQL Server, IIS, SYGFP |

### 2.2 Accès SQL Server (Base de données)

```
Serveur:  192.168.0.8
Port:     1433
User:     ARTI\admin
Password: tranSPort2021!
```

**Bases de données disponibles:**

| Base                     | Description         | Taille   |
| ------------------------ | ------------------- | -------- |
| `eARTI_DB2`              | Exercice 2024       | 144 MB   |
| `eARTIDB_2025`           | Exercice 2025       | 400 MB   |
| `eARTIDB_2026`           | Exercice 2026       | 400 MB   |
| `EMERAUDE`               | Base principale     | 6,200 MB |
| `EMERAUDE_BLOB`          | Documents numérisés | 518 MB   |
| `EMERAUDE_DECISIONNELLE` | Reporting/BI        | 112 MB   |

**Connexion Python:**

```python
import pymssql
conn = pymssql.connect(
    server='192.168.0.8',
    user='ARTI\\admin',
    password='tranSPort2021!',
    database='eARTIDB_2026'  # ou eARTIDB_2025, eARTI_DB2
)
cursor = conn.cursor(as_dict=True)
cursor.execute("SELECT * FROM NoteDG")
```

### 2.3 Accès SMB (Fichiers Windows)

```bash
# Créer fichier credentials
cat > /tmp/smbcreds.txt << 'EOF'
username=admin
password=tranSPort2021!
domain=arti.local
EOF

# Se connecter au partage C$
smbclient //192.168.0.8/C$ -A /tmp/smbcreds.txt -c 'ls'

# Accéder à l'application web
smbclient //192.168.0.8/C$ -A /tmp/smbcreds.txt -c 'cd "inetpub\wwwroot\TABLETTE_EMERAUDE"; ls'
```

### 2.4 Accès Application Web (Ancien SYGFP)

```
URL:      http://192.168.0.8/
Email:    artiabidjan@yahoo.com
Password: VEGet@9008
```

---

## 3. ACCÈS AU NOUVEAU SYSTÈME (Supabase)

### 3.1 Configuration Supabase

```
Project ID:  tjagvgqthlibdpvztvaf
URL API:     https://tjagvgqthlibdpvztvaf.supabase.co
Dashboard:   https://supabase.com/dashboard/project/tjagvgqthlibdpvztvaf
```

### 3.2 Clés API

**Anon Key (Frontend - .env):**

```
VITE_SUPABASE_URL=https://tjagvgqthlibdpvztvaf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDMzNTcsImV4cCI6MjA4MjA3OTM1N30.rlKxHvntr6FLqzPysBfwqN9J9HWLWLa0xIJgGmpXn-g
```

**Service Role Key (Backend/Migration - .mcp.json):**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc
```

### 3.3 Utilisateurs de Test

| Email              | Password  | Rôle              |
| ------------------ | --------- | ----------------- |
| dg@arti.ci         | Test2026! | DG/Validateur     |
| daaf@arti.ci       | Test2026! | DAAF/Validateur   |
| agent.dsi@arti.ci  | Test2026! | DSI/Opérationnel  |
| agent.daaf@arti.ci | Test2026! | DAAF/Opérationnel |

---

## 4. CONFIGURATION MCP (Model Context Protocol)

### 4.1 Serveurs MCP Configurés

| Serveur               | Statut   | Usage                 |
| --------------------- | -------- | --------------------- |
| `supabase`            | ✅ Actif | Requêtes PostgREST    |
| `github`              | ✅ Actif | Opérations GitHub     |
| `filesystem`          | ✅ Actif | Accès fichiers locaux |
| `playwright`          | ✅ Actif | Tests navigateur      |
| `context7`            | ✅ Actif | Documentation libs    |
| `sequential-thinking` | ✅ Actif | Raisonnement          |

### 4.2 Fichier de Configuration (.mcp.json)

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<VOTRE_TOKEN_GITHUB>"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-postgrest",
        "--apiUrl",
        "https://tjagvgqthlibdpvztvaf.supabase.co/rest/v1",
        "--apiKey",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "--schema",
        "public"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/angeyannick/sygfp-artis-g-re"
      ]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

### 4.3 Comment Activer les MCP

1. **Vérifier que `.mcp.json` est présent** à la racine du projet
2. **Recharger Claude Code** : `Developer: Reload Window` dans VS Code
3. **Vérifier les serveurs actifs** dans `.claude/settings.local.json`:

```json
{
  "enabledMcpjsonServers": [
    "context7",
    "github",
    "supabase",
    "filesystem",
    "playwright",
    "sequential-thinking"
  ]
}
```

### 4.4 Token GitHub

```
Token PAT: <CONFIGURE_DANS_.mcp.json>
Repo:      naywayne90/sygfp-artis-g-re
```

---

## 5. STRUCTURE DU PROJET

### 5.1 Dossiers Principaux

```
/home/angeyannick/sygfp-artis-g-re/
├── src/
│   ├── components/     # 42+ composants React
│   ├── pages/          # 50+ pages
│   ├── hooks/          # 130+ hooks personnalisés
│   ├── lib/            # RBAC, workflow, validations
│   ├── types/          # Types TypeScript
│   └── integrations/   # Client Supabase
├── supabase/
│   ├── migrations/     # 151 fichiers migration SQL
│   └── functions/      # 4 Edge Functions
├── scripts/            # Scripts de migration Python
├── migration_data/     # Données extraites (CSV, JSON)
└── docs/               # Documentation
```

### 5.2 Commandes Utiles

```bash
# Développement
npm run dev           # Serveur dev (port 8080)
npm run build         # Build production
npm run typecheck     # Vérifier TypeScript
npm run lint          # ESLint

# Tests
npm run test          # Tests unitaires (Vitest)
npm run test:e2e      # Tests E2E (Playwright)

# Git
git status            # État du repo
git log --oneline -10 # Derniers commits
```

---

## 6. TABLES PRINCIPALES SYGFP

### 6.1 Ancien Système (SQL Server)

| Table               | Description        | 2024  | 2025  | 2026 |
| ------------------- | ------------------ | ----- | ----- | ---- |
| `NoteDG`            | Notes SEF          | 1,994 | 2,658 | 171  |
| `DemandeExpression` | Expressions besoin | 1,263 | 1,756 | 142  |
| `Liquidation`       | Liquidations       | 1,160 | 1,666 | 128  |
| `Ordonnancement`    | Ordonnancements    | 1,030 | 1,598 | 98   |
| `Direction`         | Directions         | 9     | 9     | 9    |
| `Fournisseur`       | Fournisseurs       | 308   | 450   | 456  |

### 6.2 Nouveau Système (Supabase)

| Table                 | Description     | Enregistrements |
| --------------------- | --------------- | --------------- |
| `notes_sef`           | Notes SEF       | 4,836           |
| `prestataires`        | Fournisseurs    | 422             |
| `budget_engagements`  | Engagements     | 1,694           |
| `budget_liquidations` | Liquidations    | 1,647           |
| `ordonnancements`     | Ordonnancements | 1,584           |
| `directions`          | Directions      | 25              |
| `profiles`            | Utilisateurs    | 14              |

---

## 7. PIÈCES JOINTES SYGFP

### 7.1 Comptage Total

| Année     | Base de données | Nombre fichiers |
| --------- | --------------- | --------------- |
| 2024      | eARTI_DB2       | 3,681           |
| 2025      | eARTIDB_2025    | 5,268           |
| 2026      | eARTIDB_2026    | 426             |
| **TOTAL** |                 | **9,375**       |

### 7.2 Structure de Stockage (IMPORTANT!)

**⚠️ SYGFP ≠ EMERAUDE** - Ce sont deux applications différentes !

Les pièces jointes SYGFP sont stockées comme **chemins de fichiers** (nvarchar), PAS comme BLOB :

| Table             | Colonnes                                       |
| ----------------- | ---------------------------------------------- |
| DemandeExpression | PjFichier1, PjFichier2, PjFichier3             |
| Liquidation       | PiecesJusitificatives1, PiecesJusitificatives2 |
| Ordonnancement    | PiecesJusitificatives1, PiecesJusitificatives2 |
| NoteDG            | DocumentAnnexe                                 |
| Budget            | PiecesJusitificatives1, PiecesJusitificatives2 |
| Soumission        | PjOffreFinancier, PjOffreTechnique             |

**Format des noms de fichiers:**

```
YYYYMMDDHHMMSS_nom_original.extension
Exemple: 20260204220342_BILLET M KOFFI LEON.pdf
```

### 7.3 Emplacement Physique des Fichiers

**Configuration (Web.config):**

```xml
<add key="Fichier" value="~/Fichier/" />
```

**⚠️ PROBLÈME IDENTIFIÉ:**

- Le dossier `Fichier` n'existe PAS dans le déploiement de production (`C:\Web`)
- Le dossier existe dans le code source de développement (`C:\Users\admin\Desktop\eARTI_New_...\Fichier`)
- Les fichiers physiques correspondant aux 9,375 références n'ont pas été localisés

**Emplacements vérifiés (sans succès):**

- `C:\Web\Fichier` → N'existe pas
- `C:\Web2\Fichier` → N'existe pas
- `C:\inetpub\wwwroot\TABLETTE_EMERAUDE\Fichier` → N'existe pas
- `C:\Fichier` → N'existe pas

### 7.4 Actions Requises

1. **Contacter l'administrateur système ARTI** pour localiser les fichiers physiques
2. **Vérifier si les fichiers sont sur un NAS** ou serveur de fichiers séparé
3. **Une fois localisés**, migrer vers Supabase Storage avec correspondance aux métadonnées DB

**Note:** EMERAUDE_BLOB (1,404 documents) est pour l'application EMERAUDE, pas SYGFP !

---

## 8. CONTACTS ET RESSOURCES

### 8.1 Documentation

| Document          | Chemin                             |
| ----------------- | ---------------------------------- |
| Guide Credentials | `docs/CREDENTIALS_GUIDE.md`        |
| Architecture      | `docs/ARCHITECTURE_TECHNIQUE.md`   |
| Guide Migration   | `docs/MIGRATION_COMPLETE_GUIDE.md` |
| Ce document       | `docs/ETAT_MIGRATION_ET_ACCES.md`  |

### 8.2 URLs Importantes

- **Nouveau SYGFP (dev):** http://localhost:8080
- **Ancien SYGFP:** http://192.168.0.8/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/tjagvgqthlibdpvztvaf
- **GitHub Repo:** https://github.com/naywayne90/sygfp-artis-g-re

---

_Document généré automatiquement - 5 février 2026_
