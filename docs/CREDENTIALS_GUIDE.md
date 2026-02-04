# Guide des Credentials et Accès - SYGFP

> **⚠️ IMPORTANT :** Ce fichier est destiné à Claude Code pour automatiser les tâches. Ne jamais commiter les vraies clés dans un repo public.

---

## 1. Supabase (Base de données)

### Informations Projet
| Propriété | Valeur |
|-----------|--------|
| **Project ID** | `tjagvgqthlibdpvztvaf` |
| **Region** | Central Europe (Paris) |
| **Dashboard** | https://supabase.com/dashboard/project/tjagvgqthlibdpvztvaf |

### URLs
```
SUPABASE_URL=https://tjagvgqthlibdpvztvaf.supabase.co
API REST: https://tjagvgqthlibdpvztvaf.supabase.co/rest/v1/
Auth: https://tjagvgqthlibdpvztvaf.supabase.co/auth/v1/
Storage: https://tjagvgqthlibdpvztvaf.supabase.co/storage/v1/
Functions: https://tjagvgqthlibdpvztvaf.supabase.co/functions/v1/
```

### Clés API (⚠️ Copier depuis .env ou settings.local.json)
```bash
# Clé publique (safe côté client)
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDMzNTcsImV4cCI6MjA4MjA3OTM1N30.k_uRpLFHbn99FI4-rIQOLa4bqbS_uYkA-SO_JJRX9H0

# Clé service (bypass RLS - NE JAMAIS EXPOSER CÔTÉ CLIENT)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc
```

### Où trouver ces clés
1. Dashboard Supabase → Settings → API
2. Fichier `.env` à la racine du projet
3. Fichier `.claude/settings.local.json` (permissions bash)

---

## 2. GitHub

### Repository
| Propriété | Valeur |
|-----------|--------|
| **Repo** | `naywayne90/sygfp-artis-g-re` |
| **URL** | https://github.com/naywayne90/sygfp-artis-g-re |
| **Branch principale** | `main` |

### Token d'accès (⚠️ Voir .claude/settings.local.json)
```bash
# Personal Access Token (ghp_...)
# Stocké dans les permissions bash de settings.local.json
```

### Commandes Git avec authentification
```bash
# Push avec token (si auth échoue)
GIT_ASKPASS=echo git -c credential.helper= push https://naywayne90:<TOKEN>@github.com/naywayne90/sygfp-artis-g-re.git main
```

---

## 3. Utilisateurs de Test

### Comptes disponibles
| Email | Mot de passe | Rôle | Profil | Direction |
|-------|--------------|------|--------|-----------|
| `dg@arti.ci` | `Test2026!` | DG | Validateur | DG |
| `daaf@arti.ci` | `Test2026!` | Directeur | Validateur | DAAF |
| `agent.dsi@arti.ci` | `Test2026!` | Agent | Opérationnel | DSI |

### Connexion via code
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'dg@arti.ci',
  password: 'Test2026!'
});
```

---

## 4. Edge Functions (Supabase)

### Fonctions disponibles
| Fonction | Description | Variables requises |
|----------|-------------|-------------------|
| `r2-storage` | Upload/download fichiers vers Cloudflare R2 | R2_* |
| `send-notification-email` | Envoi emails via Resend | RESEND_API_KEY |
| `create-user` | Création utilisateurs (admin) | SUPABASE_SERVICE_ROLE_KEY |
| `generate-export` | Génération exports PDF/Excel | - |

### Variables d'environnement Edge Functions
```bash
# À configurer dans Supabase Dashboard > Edge Functions > Secrets

# R2 Storage (Cloudflare)
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=lovable-storage

# Email (Resend)
RESEND_API_KEY=re_xxx

# Supabase (automatiquement disponible)
SUPABASE_URL=<auto>
SUPABASE_ANON_KEY=<auto>
SUPABASE_SERVICE_ROLE_KEY=<auto>
```

### Appel d'une Edge Function
```typescript
const { data, error } = await supabase.functions.invoke('r2-storage', {
  body: {
    action: 'getUploadUrl',
    key: 'documents/file.pdf',
    contentType: 'application/pdf'
  }
});
```

---

## 5. MCP Servers (Claude Code)

### Serveurs activés
```json
{
  "enabledMcpjsonServers": [
    "context7",     // Documentation des librairies
    "github",       // Intégration GitHub
    "supabase",     // Requêtes PostgREST
    "filesystem",   // Accès fichiers
    "playwright",   // Tests E2E et browser
    "sequential-thinking"  // Raisonnement séquentiel
  ]
}
```

### Utilisation Supabase MCP
```typescript
// Convertir SQL en REST
mcp__supabase__sqlToRest({ sql: "SELECT * FROM profiles LIMIT 10" })

// Exécuter requête REST
mcp__supabase__postgrestRequest({
  method: "GET",
  path: "/profiles?select=*&limit=10"
})
```

### Utilisation Playwright MCP
```typescript
// Naviguer vers une page
mcp__playwright__browser_navigate({ url: "http://localhost:8080" })

// Prendre un screenshot
mcp__playwright__browser_take_screenshot({ type: "png" })

// Snapshot accessibilité
mcp__playwright__browser_snapshot({})
```

---

## 6. Scripts Utilitaires

### Régénérer les types Supabase
```bash
# Se connecter d'abord
npx supabase login

# Générer les types
npx supabase gen types typescript \
  --project-id tjagvgqthlibdpvztvaf \
  > src/integrations/supabase/types.ts
```

### Configurer les utilisateurs de test
```bash
SUPABASE_SERVICE_ROLE_KEY="<service_role_key>" npx tsx scripts/setup-test-users.ts
```

### Lancer le dev server
```bash
npm run dev  # Port 8080
```

### Build avec mémoire augmentée
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## 7. Fichiers de Configuration

### Emplacement des credentials
| Fichier | Contenu |
|---------|---------|
| `.env` | Variables frontend (VITE_*) |
| `.claude/settings.local.json` | Permissions Claude + clés |
| `supabase/functions/.env` | Variables Edge Functions (local) |

### Variables d'environnement requises (.env)
```bash
# Frontend (obligatoire)
VITE_SUPABASE_PROJECT_ID=tjagvgqthlibdpvztvaf
VITE_SUPABASE_URL=https://tjagvgqthlibdpvztvaf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>

# Edge Functions (optionnel local)
SUPABASE_SERVICE_ROLE_KEY=<service_key>
RESEND_API_KEY=<resend_key>
R2_ENDPOINT=<cloudflare_r2_endpoint>
R2_ACCESS_KEY_ID=<r2_key_id>
R2_SECRET_ACCESS_KEY=<r2_secret>
R2_BUCKET=lovable-storage
```

---

## 8. Accès Rapides

### Dashboard
- **Supabase**: https://supabase.com/dashboard/project/tjagvgqthlibdpvztvaf
- **GitHub**: https://github.com/naywayne90/sygfp-artis-g-re

### Application
- **Dev**: http://localhost:8080
- **Production**: (à configurer)

### Documentation
- [ARCHITECTURE_TECHNIQUE.md](ARCHITECTURE_TECHNIQUE.md)
- [GUIDE_SUPABASE.md](GUIDE_SUPABASE.md)
- [GUIDE_CODE_SPLITTING.md](GUIDE_CODE_SPLITTING.md)

---

## 9. Dépannage

### Erreur "Invalid API key"
1. Vérifier que `.env` contient les bonnes clés
2. Redémarrer le serveur de dev
3. Vider le cache du navigateur

### Erreur RLS "permission denied"
1. Vérifier que l'utilisateur est connecté
2. Vérifier les politiques RLS dans Supabase
3. Utiliser service_role_key pour bypass (tests uniquement)

### Edge Function ne répond pas
1. Vérifier les secrets dans Supabase Dashboard
2. Consulter les logs: Dashboard → Edge Functions → Logs

---

**Dernière mise à jour:** 03/02/2026
