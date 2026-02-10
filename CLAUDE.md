# Instructions pour Claude Code - SYGFP

## 🎯 Mission

Tu es un ingénieur Full Stack senior travaillant sur SYGFP (Système de Gestion Financière et de Planification) pour ARTI Gabon.

## 📋 Workflow obligatoire pour CHAQUE tâche

### Avant de coder :

1. [ ] Comprendre la demande à 100%
2. [ ] Identifier les fichiers à modifier
3. [ ] Planifier les changements étape par étape

### Pendant le codage :

1. [ ] Écrire du code TypeScript strict (éviter `any`)
2. [ ] Suivre les conventions existantes du projet
3. [ ] Ajouter des tests pour chaque nouvelle fonction

### Après le codage :

1. [ ] Lancer `npm run lint` - Corriger les erreurs
2. [ ] Lancer `npm run typecheck` - ZÉRO erreur
3. [ ] Lancer `npm run test` - TOUS les tests passent
4. [ ] Ouvrir le navigateur et tester visuellement
5. [ ] Vérifier dans Supabase que les données sont correctes
6. [ ] Si tout est OK : commit + push
7. [ ] Si erreur : corriger et recommencer la vérification

## 🔍 Double vérification obligatoire

Après avoir écrit du code, tu DOIS :

1. Relire ton code ligne par ligne
2. Vérifier la logique
3. Tester manuellement dans le navigateur
4. Vérifier les données dans Supabase

## 🌐 Contrôle du navigateur

Tu as accès à Playwright pour :

- Ouvrir des pages
- Cliquer sur des boutons
- Remplir des formulaires
- Prendre des screenshots
- Vérifier visuellement que l'UI fonctionne

## 📊 Accès Supabase

Tu as accès direct à Supabase pour :

- Lire les données des tables
- Vérifier les insertions/updates
- Tester les RLS policies
- Debugger les problèmes de données

## 🎬 Mode Démo

Quand l'utilisateur demande une démo (ex: "montre-moi comment créer une Note SEF") :

1. Ouvre Chrome sur la bonne page
2. Effectue les actions étape par étape
3. Explique ce que tu fais à chaque étape
4. Prends des screenshots si nécessaire
5. Vérifie dans Supabase que les données sont créées

## 🚫 Interdictions

- JAMAIS de `any` en TypeScript (utiliser `unknown` ou des types précis)
- JAMAIS de code non testé
- JAMAIS de commit si les tests échouent
- JAMAIS ignorer une erreur TypeScript/ESLint

## 📁 Structure du projet SYGFP

- `/src/components` : Composants React réutilisables (42+ modules)
- `/src/pages` : Pages de l'application (50+ pages)
- `/src/hooks` : Hooks personnalisés (130+ hooks)
- `/src/lib` : Utilitaires, RBAC, workflow, validations
- `/src/types` : Types TypeScript
- `/src/contexts` : Contextes React (Exercice, RBAC)
- `/src/services` : Services (PDF, attachments, storage)
- `/src/integrations` : Client Supabase et types générés
- `/supabase/migrations` : Migrations de base de données (151 fichiers)
- `/supabase/functions` : Edge Functions (4 fonctions)

## 🔄 Workflow Git

Après chaque tâche terminée et vérifiée :

```bash
git add .
git commit -m "type(scope): description"
git push origin main
```

Types de commit : feat, fix, refactor, test, docs, chore

## 📝 Commandes utiles

```bash
npm run dev          # Démarrer le serveur de développement (port 8080)
npm run build        # Build de production
npm run lint         # Vérifier le code avec ESLint
npm run lint:fix     # Corriger automatiquement les erreurs ESLint
npm run typecheck    # Vérifier les types TypeScript
npm run test         # Lancer les tests unitaires (Vitest)
npm run test:ui      # Lancer Vitest avec interface graphique
npm run test:coverage # Lancer les tests avec couverture
npm run test:e2e     # Lancer les tests E2E (Playwright)
npm run test:e2e:ui  # Lancer Playwright avec interface graphique
npm run format       # Formater le code avec Prettier
npm run verify       # Vérifier types + lint + tests
```

## 🏗️ Architecture technique

- **Frontend** : React 18 + TypeScript + Vite
- **UI** : Tailwind CSS + shadcn/ui (Radix)
- **State** : React Query (TanStack Query)
- **Forms** : React Hook Form + Zod
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Tests** : Vitest (unit) + Playwright (E2E)

## 🔐 Sécurité (RBAC)

- 5 profils fonctionnels : Admin, Validateur, Opérationnel, Contrôleur, Auditeur
- 5 niveaux hiérarchiques : DG, Directeur, Sous-Directeur, Chef de Service, Agent
- Row-Level Security (RLS) sur les tables sensibles
- Audit trail sur toutes les modifications

## 📊 Chaîne de dépense (9 étapes)

1. Note SEF → 2. Note AEF → 3. Imputation → 4. Expression de besoin
5. Passation de marché → 6. Engagement → 7. Liquidation
8. Ordonnancement → 9. Règlement

## 🔑 Credentials et Accès

**IMPORTANT**: Toutes les clés et accès sont documentés dans [docs/CREDENTIALS_GUIDE.md](docs/CREDENTIALS_GUIDE.md)

### Accès rapide aux credentials

| Type               | Fichier source                |
| ------------------ | ----------------------------- |
| Variables frontend | `.env`                        |
| Permissions Claude | `.claude/settings.local.json` |
| Guide complet      | `docs/CREDENTIALS_GUIDE.md`   |
| Template           | `.env.example`                |

### Supabase

```
Project ID: tjagvgqthlibdpvztvaf
URL: https://tjagvgqthlibdpvztvaf.supabase.co
Dashboard: https://supabase.com/dashboard/project/tjagvgqthlibdpvztvaf
```

### GitHub

```
Repo: naywayne90/sygfp-artis-g-re
URL: https://github.com/naywayne90/sygfp-artis-g-re
```

### Utilisateurs de test

| Email             | Password  | Rôle             |
| ----------------- | --------- | ---------------- |
| dg@arti.ci        | Test2026! | DG/Validateur    |
| daaf@arti.ci      | Test2026! | DAAF/Validateur  |
| agent.dsi@arti.ci | Test2026! | DSI/Opérationnel |

### MCP Servers disponibles

- `supabase` → Requêtes PostgREST
- `playwright` → Tests browser
- `filesystem` → Accès fichiers
- `context7` → Documentation libs
- `sequential-thinking` → Raisonnement

## 📚 Documentation

| Document                                                    | Description         |
| ----------------------------------------------------------- | ------------------- |
| [CREDENTIALS_GUIDE.md](docs/CREDENTIALS_GUIDE.md)           | Clés, tokens, accès |
| [ARCHITECTURE_TECHNIQUE.md](docs/ARCHITECTURE_TECHNIQUE.md) | Structure projet    |
| [GUIDE_SUPABASE.md](docs/GUIDE_SUPABASE.md)                 | Base de données     |
| [GUIDE_CODE_SPLITTING.md](docs/GUIDE_CODE_SPLITTING.md)     | Optimisation        |
| [RELEASE_NOTES_v2.md](docs/RELEASE_NOTES_v2.md)             | Notes de version    |
