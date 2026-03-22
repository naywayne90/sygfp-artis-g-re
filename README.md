# SYGFP - Systeme de Gestion des Finances Publiques

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-704%20PASS-brightgreen)]()

Application web moderne de gestion budgetaire et financiere pour **ARTI** (Autorite de Regulation du Transport Interieur, **Cote d'Ivoire**).

## Chaine de Depense (9 etapes)

```
1. Note SEF > 2. Note AEF > 3. Imputation > 4. Expression Besoin
       |            |            |              |
5. Passation Marche > 6. Engagement > 7. Liquidation
                            |              |
                    8. Ordonnancement > 9. Reglement
```

## Etat des modules

| Module               | Statut               | Tests                 |
| -------------------- | -------------------- | --------------------- |
| Note SEF             | Production           | 91+ RBAC              |
| Note AEF             | Production           | E2E                   |
| Imputation           | Production           | E2E                   |
| Expression Besoin    | Production           | E2E                   |
| **Passation Marche** | **Certifie 100/100** | **94 unit + 66 E2E**  |
| **Engagement**       | **Certifie 100/100** | **231 unit + 60 E2E** |
| **Liquidation**      | **Certifie 100/100** | **104 unit + 60 E2E** |
| Ordonnancement       | Production (legacy)  | E2E                   |
| Reglement            | Production (legacy)  | 138 E2E               |
| Budget/Planification | Production           | 52 unit               |
| Workflow Engine      | Production           | 95 unit               |
| RBAC                 | Production           | 91 unit               |

## Metriques

| Metrique        | Valeur   |
| --------------- | -------- |
| Pages           | 116      |
| Composants      | 426      |
| Hooks           | 169      |
| Services        | 19       |
| Routes          | 114      |
| Migrations SQL  | 277      |
| Edge Functions  | 12       |
| Tests unitaires | 704 PASS |
| Specs E2E       | 71       |
| Tables          | 201      |
| Policies RLS    | 526      |

## Stack technique

| Composant | Technologie                        |
| --------- | ---------------------------------- |
| Frontend  | React 18 + TypeScript 5.8          |
| Build     | Vite 5.4 (port 8080)               |
| UI        | Tailwind CSS + shadcn/ui (Radix)   |
| State     | TanStack Query                     |
| Forms     | React Hook Form + Zod              |
| Backend   | Supabase (PostgreSQL + Auth + RLS) |
| Tests     | Vitest (unit) + Playwright (E2E)   |

## Structure du projet

```
src/
├── components/          # 426 composants React (47 modules)
│   ├── ui/              # shadcn/ui
│   ├── layout/          # AppLayout, Sidebar, Header
│   ├── engagement/      # Module engagement
│   ├── liquidation/     # Module liquidation
│   └── ...
├── pages/               # 116 pages
├── hooks/               # 169 hooks personnalises
├── contexts/            # ExerciceContext, RBACContext
├── services/            # 19 services (PDF, export, storage)
├── lib/                 # Utilitaires, workflow, RBAC, budget
├── integrations/        # Client Supabase + types generes
└── test/                # 9 fichiers de tests unitaires

supabase/
├── migrations/          # 277 fichiers de migration
└── functions/           # 12 Edge Functions
```

## Demarrage rapide

```bash
# Cloner le repository
git clone https://github.com/naywayne90/sygfp-artis-g-re.git
cd sygfp-artis-g-re

# Installer les dependances
npm install

# Copier les variables d'environnement
cp .env.example .env
# Remplir les cles Supabase dans .env

# Demarrer le serveur de developpement
npm run dev
```

L'application sera disponible sur `http://localhost:8080`

## Scripts disponibles

```bash
npm run dev              # Serveur dev (port 8080)
npm run build            # Build production
npm run typecheck        # tsc --noEmit
npx vitest run           # Tests unitaires (704 tests)
npm run test:e2e         # Tests E2E Playwright
npm run lint             # ESLint
npm run lint:fix         # ESLint auto-fix
npm run verify           # typecheck + lint + test
```

## Performance

| Metrique          | Valeur    |
| ----------------- | --------- |
| Bundle initial    | ~425 KB   |
| Pages lazy-loaded | 110+      |
| Vendors separes   | 11 chunks |

## Documentation

| Document                                                                         | Description               |
| -------------------------------------------------------------------------------- | ------------------------- |
| [CLAUDE.md](CLAUDE.md)                                                           | Instructions Claude Code  |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                               | Architecture technique    |
| [CONVENTIONS.md](CONVENTIONS.md)                                                 | Conventions de code       |
| [PROJECT_STATUS.md](PROJECT_STATUS.md)                                           | Inventaire complet        |
| [docs/GUIDE_SUPABASE.md](docs/GUIDE_SUPABASE.md)                                 | Guide Supabase            |
| [docs/NOTIFICATIONS_GUIDE.md](docs/NOTIFICATIONS_GUIDE.md)                       | Notifications             |
| [docs/CERTIFICATION_PASSATION_MARCHE.md](docs/CERTIFICATION_PASSATION_MARCHE.md) | Certification Passation   |
| [docs/CERTIFICATION_ENGAGEMENT.md](docs/CERTIFICATION_ENGAGEMENT.md)             | Certification Engagement  |
| [docs/CERTIFICATION_LIQUIDATION.md](docs/CERTIFICATION_LIQUIDATION.md)           | Certification Liquidation |

## Changelog

### v4.0.0 (22/02/2026)

- Liquidation certifiee 100/100 (104 unit + 60 E2E)
- Calculs fiscaux temps reel (TVA 18%, AIRSI 5%)
- Liquidations partielles multi-tranche
- 704 tests unitaires PASS

### v3.1.0 (20/02/2026)

- Engagement certifie 100/100 (231 unit + 60 E2E)
- Support multi-ligne (ventilation budgetaire)
- Degagement partiel

### v3.0.0 (04/02/2026)

- Notifications temps reel via Supabase Realtime
- Dashboard DMG dedie
- Workflow configurable
- Gestion des interims et delegations
- Code-splitting (bundle -91%)

### v2.0.0 (03/02/2026)

- Migration SQL Server vers Supabase
- 85+ pages lazy-loaded
- Documentation technique complete

### v1.0.0

- Version initiale
- Chaine de depense complete
- RBAC et RLS

## Conventions

### Commits

```
type(scope): description

Types: feat, fix, refactor, test, docs, chore
```

### Nommage

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Services: `camelCaseService.ts`

## Licence

Propriete de ARTI Cote d'Ivoire. Tous droits reserves.

---

**Version:** 4.0.0
**Derniere mise a jour:** 22/03/2026
