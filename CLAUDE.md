# SYGFP — Instructions Claude Code

## 1. Projet

**SYGFP** (Systeme de Gestion des Finances Publiques) est l'application de gestion de la chaine de depense de l'**ARTI** (Autorite de Regulation du Transport Interieur, **Cote d'Ivoire**). Elle couvre 9 etapes : Note SEF > Note AEF > Imputation > Expression de Besoin > Passation de Marche > Engagement > Liquidation > Ordonnancement > Reglement.

## 2. Stack technique

React 18 + TypeScript + Vite (port 8080) | Tailwind + shadcn/ui | TanStack Query | React Hook Form + Zod | Supabase (PostgreSQL + Auth + RLS + Edge Functions) | Vitest + Playwright

## 3. Etat des modules

| Module               | Statut               | Tests                 | Doc                                      |
| -------------------- | -------------------- | --------------------- | ---------------------------------------- |
| Note SEF             | Production           | 91+ RBAC              | -                                        |
| Note AEF             | Production           | E2E                   | -                                        |
| Imputation           | Production           | E2E                   | -                                        |
| Expression Besoin    | Production           | E2E                   | -                                        |
| **Passation Marche** | **Certifie 100/100** | **94 unit + 66 E2E**  | `docs/CERTIFICATION_PASSATION_MARCHE.md` |
| **Engagement**       | **Certifie 100/100** | **171 unit + 60 E2E** | `docs/CERTIFICATION_ENGAGEMENT.md`       |
| Liquidation          | Production (legacy)  | E2E                   | -                                        |
| Ordonnancement       | Production (legacy)  | E2E                   | -                                        |
| Reglement            | Production (legacy)  | 138 E2E               | -                                        |
| Budget/Planification | Production           | 52 unit               | -                                        |
| Workflow Engine      | Production           | 95 unit               | -                                        |
| RBAC                 | Production           | 91 unit               | -                                        |

## 4. Conventions de code (resume)

- **TypeScript strict** : zero `any`, zero erreur `tsc --noEmit`
- **Imports** : React > Routing > shadcn/ui > TanStack > Supabase > Contextes > Hooks > Composants > toast/date-fns > Utils > Icones > Types
- **Types domaine** : definis dans le hook (`usePassationsMarche.ts` exporte `PassationMarche`)
- **Montants** : `formatCurrency()` de `@/lib/utils` (jamais de formatteur local)
- **Textes UI** : tout en francais (labels, erreurs, toasts)
- **Mutations** : toujours `onSuccess` (invalidate + toast) + `onError` (toast avec description)
- **RLS** : `has_role(auth.uid(), 'ROLE'::app_role)` via table `user_roles`
- **References** : `get_next_sequence(p_doc_type, p_exercice, p_scope)` atomique
- **Backend** : tables `snake_case` pluriel, PK `id UUID`, FK `{table_singulier}_id`, timestamps auto
- **UI** : shadcn/ui uniquement (`@/components/ui/`), pas de CSS custom
- **State** : TanStack Query (donnees serveur, staleTime 30s) + useState (UI local)
- **Formulaires** : state-based (principal) ou react-hook-form + Zod (secondaire)
- **Nommage** : Composants PascalCase, Hooks use+camelCase, Services camelCase+Service.ts
- **Exports** : Named exports (pas de default sauf pages)
- **Responsive** : Tailwind mobile-first (sm:/md:/lg:/xl:)

### Patterns frontend reutilisables (pour tout nouveau module)

| Pattern            | Composants                                                                               | Exemple de reference                         |
| ------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| **P1. Page liste** | PageHeader + KPIs (grid) + Tabs + NotesFiltersBar + Table + NotesPagination + EmptyState | `PassationMarche.tsx`, `NotesSEF.tsx`        |
| **P2. Formulaire** | Dialog/Sheet + useState + validate() + mutation                                          | `PassationMarcheForm.tsx`, `NoteSEFForm.tsx` |
| **P3. Detail**     | Sheet/Dialog + Tabs internes (Infos/Docs/Historique) + boutons actions                   | `PassationDetails.tsx`                       |
| **P4. Validation** | Page dediee (KPIs + en attente/historique) + Dialog motif                                | `PassationApprobation.tsx`                   |
| **P5. Chain nav**  | Navigation horizontale etapes liees (EB ↔ PM ↔ Engagement)                               | `PassationChainNav.tsx`                      |
| **P6. Export**     | DropdownMenu (Excel/PDF/CSV) + hook useModuleExport                                      | `usePassationExport.ts`                      |
| **P7. Workflow**   | Timeline visuelle + boutons conditionnels role/statut                                    | `WorkflowActionBar.tsx`                      |
| **P8. Sidebar**    | useSidebarBadges (10 compteurs, refetch 30s)                                             | `useSidebarBadges.ts`                        |

Voir `docs/CONVENTIONS.md` sections 10-19 pour toutes les regles frontend detaillees.

## 5. Regles de non-regression (CRITIQUES)

**AVANT tout commit, ces 3 commandes DOIVENT passer :**

```bash
npx tsc --noEmit         # 0 erreurs TypeScript
npx vite build           # Build OK
npx vitest run           # 369/369 tests PASS (au 19/02/2026)
```

**INTERDIT :**

- Commit si un test echoue
- Supprimer un test existant sans justification
- Introduire un `any` TypeScript
- Ignorer une erreur ESLint
- Modifier un module certifie (Passation) sans re-executer ses 94 tests
- Casser une signature de fonction publique exportee

**OBLIGATOIRE apres modification :**

- Ajouter des tests pour toute nouvelle logique pure
- Verifier visuellement dans le navigateur (Playwright MCP)
- Verifier les donnees dans Supabase (PostgREST MCP)

## 6. Commandes essentielles

```bash
npm run dev              # Serveur dev (port 8080)
npm run build            # Build production
npm run typecheck        # tsc --noEmit
npx vitest run           # Vitest (CI, une passe)
npm run test             # Vitest (watch mode)
npm run test:e2e         # Playwright
npm run lint             # ESLint
npm run lint:fix         # ESLint auto-fix
npm run lint:strict      # ESLint 0 warnings
npm run format           # Prettier
npm run format:check     # Prettier check (sans ecrire)
npm run verify           # typecheck + lint + test
npm run preview          # Preview build production
```

**Git :** `git commit -m "type(scope): description"` — types: feat, fix, refactor, test, docs, chore

## 6b. Commandes rapides

```bash
npm run dev                    # Lance le serveur (port 8080)
npm run build                  # Verifie le build (0 erreurs = OK)
npx tsc --noEmit               # Verifie TypeScript (0 erreurs = OK)
npx vitest run                 # Lance tous les tests unitaires
npx playwright test            # Lance tous les tests E2E
```

## 6c. Verification rapide

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080   # 200 = serveur OK
```

**URLs a tester (navigateur ou Playwright) :**

| URL                                                            | Page attendue            |
| -------------------------------------------------------------- | ------------------------ |
| `http://localhost:8080/auth`                                   | Connexion                |
| `http://localhost:8080/`                                       | Tableau de Bord DG       |
| `http://localhost:8080/notes-sef`                              | Notes SEF                |
| `http://localhost:8080/notes-aef`                              | Notes AEF                |
| `http://localhost:8080/execution/imputation`                   | Imputation               |
| `http://localhost:8080/execution/expression-besoin`            | Expressions de Besoin    |
| `http://localhost:8080/execution/passation-marche`             | Passation de Marche      |
| `http://localhost:8080/execution/passation-marche/approbation` | Approbation DG           |
| `http://localhost:8080/engagements`                            | Engagements              |
| `http://localhost:8080/liquidations`                           | Liquidations             |
| `http://localhost:8080/ordonnancements`                        | Ordonnancements          |
| `http://localhost:8080/reglements`                             | Reglements               |
| `http://localhost:8080/planification/structure`                | Structure Budgetaire     |
| `http://localhost:8080/planification/budget`                   | Planification Budgetaire |
| `http://localhost:8080/planification/plan-travail`             | Plan de Travail          |
| `http://localhost:8080/planification/virements`                | Virements                |
| `http://localhost:8080/planification/import-export`            | Import / Export          |
| `http://localhost:8080/recherche`                              | Recherche Dossier        |
| `http://localhost:8080/notifications`                          | Notifications            |
| `http://localhost:8080/alertes-budgetaires`                    | Alertes Budgetaires      |
| `http://localhost:8080/mon-profil`                             | Mon Profil               |
| `http://localhost:8080/admin/exercices`                        | Exercices Budgetaires    |
| `http://localhost:8080/admin/utilisateurs`                     | Gestion Utilisateurs     |
| `http://localhost:8080/contractualisation/prestataires`        | Prestataires             |
| `http://localhost:8080/contractualisation/contrats`            | Gestion Contrats         |
| `http://localhost:8080/approvisionnement`                      | Approvisionnement        |
| `http://localhost:8080/tresorerie`                             | Tresorerie               |
| `http://localhost:8080/recettes`                               | Declaration Recettes     |
| `http://localhost:8080/etats-execution`                        | Etats d'Execution        |
| `http://localhost:8080/suivi-dossiers`                         | Suivi des Dossiers       |

Toutes ces routes ont ete testees le 19/02/2026 : **29/29 OK, 0 erreurs critiques**.

## 7. MCP disponibles

| MCP                   | Usage                                                 |
| --------------------- | ----------------------------------------------------- |
| `supabase`            | Requetes PostgREST (DML: SELECT/INSERT/UPDATE/DELETE) |
| `playwright`          | Tests navigateur, screenshots, DDL via SQL Editor     |
| `filesystem`          | Acces fichiers hors projet                            |
| `context7`            | Documentation librairies a jour                       |
| `sequential-thinking` | Raisonnement structure                                |
| `github`              | Issues, PRs, code search                              |

**DDL Supabase** (CREATE TABLE, ALTER, migrations) : Playwright MCP > SQL Editor. PostgREST = DML only.

## 8. Comptes test

| Email             | Password  | Role               |
| ----------------- | --------- | ------------------ |
| dg@arti.ci        | Test2026! | DG / Validateur    |
| daaf@arti.ci      | Test2026! | DAAF / Validateur  |
| agent.dsi@arti.ci | Test2026! | DSI / Operationnel |

**Supabase :** `tjagvgqthlibdpvztvaf.supabase.co` — Dashboard: `artiabidjan@yahoo.com` / `VEGet@9008`
**GitHub :** `naywayne90/sygfp-artis-g-re`

## 9. Ou trouver les details

| Besoin                          | Fichier                                  |
| ------------------------------- | ---------------------------------------- |
| Inventaire complet du projet    | `PROJECT_STATUS.md`                      |
| Conventions de code detaillees  | `CONVENTIONS.md`                         |
| Certification passation         | `docs/CERTIFICATION_PASSATION_MARCHE.md` |
| Certification engagement        | `docs/CERTIFICATION_ENGAGEMENT.md`       |
| Transition liquidation          | `docs/TRANSITION_VERS_LIQUIDATION.md`    |
| Architecture technique complete | `ARCHITECTURE.md`                        |
| Contexte agent universel        | `AGENT_CONTEXT.md`                       |
| Credentials complet             | `docs/CREDENTIALS_GUIDE.md`              |
| Guide Supabase                  | `docs/GUIDE_SUPABASE.md`                 |
| Audit technique                 | `docs/AUDIT_TECHNIQUE_COMPLET.md`        |
| Migration SQL Server            | `docs/RAPPORT_MIGRATION_COMPLETE.md`     |

### Metriques cles (19/02/2026)

115 pages | 417 composants/50 modules | 165 hooks | 201 tables | 526 RLS policies | 253 migrations | 12 Edge Functions | 369 tests unitaires | 69 specs E2E
