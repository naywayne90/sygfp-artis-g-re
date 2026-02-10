# SYGFP - Système de Gestion des Finances Publiques

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)](https://tailwindcss.com/)

Application web moderne de gestion budgétaire et financière pour **ARTI Côte d'Ivoire**.

## 🎯 Fonctionnalités Principales

### Chaîne de Dépense (9 étapes)

```
1. Note SEF → 2. Note AEF → 3. Imputation → 4. Expression Besoin
       ↓            ↓            ↓              ↓
5. Passation Marché → 6. Engagement → 7. Liquidation
                            ↓              ↓
                    8. Ordonnancement → 9. Règlement
```

### Modules

- **Planification** - Budget prévisionnel, missions, objectifs
- **Exécution** - Notes SEF/AEF, engagements, liquidations
- **Trésorerie** - Caisses, mouvements, approvisionnements
- **Administration** - Utilisateurs, rôles, permissions

### Sécurité (RBAC)

- 5 profils fonctionnels : Admin, Validateur, Opérationnel, Contrôleur, Auditeur
- 5 niveaux hiérarchiques : DG, Directeur, Sous-Directeur, Chef de Service, Agent
- Row-Level Security (RLS) sur toutes les tables sensibles

---

## 🔔 Système de Notifications (v3.0)

### Fonctionnalités

- **Notifications en temps réel** via Supabase Realtime
- **Centre de notifications** avec historique et filtres
- **Templates personnalisables** par type d'événement
- **Préférences utilisateur** (email, in-app)
- **Notifications automatiques** sur changement de statut

### Types supportés

| Type                 | Description           |
| -------------------- | --------------------- |
| `validation`         | Demande de validation |
| `rejet`              | Document rejeté       |
| `echeance`           | Échéance proche       |
| `budget_insuffisant` | Alerte budget         |
| `dossier_a_valider`  | Nouveau dossier       |

### Routes

- `/notifications` - Centre de notifications
- `/admin/notifications` - Administration

Voir [NOTIFICATIONS_GUIDE.md](docs/NOTIFICATIONS_GUIDE.md) pour la documentation complète.

---

## 📊 Dashboard DMG (v3.0)

### Dashboard Direction des Moyens Généraux

Route: `/dashboard-dmg`

#### Fonctionnalités

- **KPIs dédiés** aux achats et approvisionnements
- **Alertes configurables** par seuil
- **Vue temps réel** des dépenses en cours
- **Statistiques** par catégorie de dépense

#### Configuration

Les alertes sont configurables via la table `dmg_alert_config`.

---

## 🛠️ Stack Technique

| Composant | Technologie                        |
| --------- | ---------------------------------- |
| Frontend  | React 18 + TypeScript 5.6          |
| Build     | Vite 5.4                           |
| UI        | Tailwind CSS + shadcn/ui (Radix)   |
| State     | TanStack Query                     |
| Forms     | React Hook Form + Zod              |
| Backend   | Supabase (PostgreSQL + Auth + RLS) |
| Tests     | Vitest (unit) + Playwright (E2E)   |

## 📁 Structure du Projet

```
src/
├── components/          # Composants React (42+ modules)
│   ├── ui/              # Composants shadcn/ui
│   ├── layout/          # AppLayout, Sidebar, Header
│   ├── notifications/   # Système de notifications
│   ├── shared/          # PageLoader, PermissionGuard
│   └── ...
├── pages/               # Pages de l'application (50+)
├── hooks/               # Hooks personnalisés (130+)
├── contexts/            # ExerciceContext, RBACContext
├── lib/                 # Utilitaires, workflow, exports
├── integrations/        # Client Supabase + types
└── types/               # Types TypeScript globaux

supabase/
├── migrations/          # 180+ fichiers de migration
└── functions/           # 4 Edge Functions
```

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ (recommandé: utiliser [nvm](https://github.com/nvm-sh/nvm))
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone https://github.com/naywayne90/sygfp-artis-g-re.git
cd sygfp-artis-g-re

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:8080`

### Variables d'environnement

Créer un fichier `.env` à la racine (voir `.env.example`):

```env
VITE_SUPABASE_URL=https://tjagvgqthlibdpvztvaf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## 📝 Scripts Disponibles

```bash
# Développement
npm run dev              # Serveur dev (port 8080)

# Vérification
npm run typecheck        # Vérifier TypeScript
npm run lint             # Vérifier ESLint
npm run lint:fix         # Corriger ESLint auto

# Tests
npm run test             # Tests unitaires (Vitest)
npm run test:ui          # Tests avec interface
npm run test:coverage    # Tests avec couverture
npm run test:e2e         # Tests E2E (Playwright)
npm run test:e2e:ui      # Playwright avec interface

# Build
npm run build            # Build production
npm run verify           # typecheck + lint + test
```

## 📊 Performance

Le projet utilise le code-splitting pour optimiser les temps de chargement :

| Métrique          | Valeur    |
| ----------------- | --------- |
| Bundle initial    | ~427 KB   |
| Pages lazy-loaded | 85+       |
| Vendors séparés   | 10 chunks |

## 📚 Documentation

| Document                                                    | Description                   |
| ----------------------------------------------------------- | ----------------------------- |
| [ARCHITECTURE_TECHNIQUE.md](docs/ARCHITECTURE_TECHNIQUE.md) | Structure et patterns         |
| [GUIDE_SUPABASE.md](docs/GUIDE_SUPABASE.md)                 | Base de données               |
| [NOTIFICATIONS_GUIDE.md](docs/NOTIFICATIONS_GUIDE.md)       | Système de notifications      |
| [GUIDE_CODE_SPLITTING.md](docs/GUIDE_CODE_SPLITTING.md)     | Optimisation                  |
| [RELEASE_NOTES_v3.md](docs/RELEASE_NOTES_v3.md)             | Notes de version v3           |
| [CREDENTIALS_GUIDE.md](docs/CREDENTIALS_GUIDE.md)           | Guide des accès               |
| [CLAUDE.md](CLAUDE.md)                                      | Instructions pour Claude Code |

## 📋 Changelog

### v3.0.0 (04/02/2026)

- Système de notifications avancé avec temps réel
- Dashboard DMG dédié
- Système de workflow configurable
- Gestion des intérims
- 20+ nouvelles tables
- 30+ nouvelles fonctions RPC

### v2.0.0 (03/02/2026)

- Code-splitting (bundle -91%)
- 85+ pages lazy-loaded
- Documentation technique complète

### v1.0.0

- Version initiale
- Chaîne de dépense complète
- RBAC et RLS

## 🔧 Conventions

### Commits

```
type(scope): description

Types: feat, fix, refactor, test, docs, chore
```

### Nommage

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`

## 📄 Licence

Propriété de ARTI Côte d'Ivoire. Tous droits réservés.

---

**Version:** 3.0.0
**Dernière mise à jour:** 04/02/2026
