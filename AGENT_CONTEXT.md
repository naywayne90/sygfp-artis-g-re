# AGENT_CONTEXT.md — SYGFP (Universel)

**Derniere MAJ :** 19 fevrier 2026
**Ce fichier est lu par chaque agent au demarrage tmux.**

---

## 1. PROJET

**SYGFP** = Systeme de Gestion des Finances Publiques
**ARTI** = Autorite de Regulation du Transport Interieur (**Cote d'Ivoire**)
**Chaine de depense (9 etapes) :** Note SEF > Note AEF > Imputation > Expression de Besoin > Passation de Marche > Engagement > Liquidation > Ordonnancement > Reglement

## 2. ETAT ACTUEL DU PROJET

### Modules certifies / en production

| Module               | Statut               | Tests            |
| -------------------- | -------------------- | ---------------- |
| Note SEF             | Production           | 91+ RBAC         |
| Note AEF             | Production           | E2E              |
| Imputation           | Production           | E2E              |
| Expression Besoin    | Production           | E2E              |
| **Passation Marche** | **Certifie 100/100** | 94 unit + 66 E2E |
| Liquidation          | Production (legacy)  | E2E              |
| Ordonnancement       | Production (legacy)  | E2E              |
| Reglement            | Production (legacy)  | 138 E2E          |
| Budget/Planification | Production           | 52 unit          |
| Workflow Engine      | Production           | 95 unit          |
| RBAC                 | Production           | 91 unit          |

### Module en cours : ENGAGEMENT (5 gaps ouverts)

1. FK passation_marche_id non peuple dans EngagementFromPMForm
2. Pas de navigation retour Engagement → Passation
3. Notifications workflow non implementees
4. Pre-remplissage depuis passation incomplet
5. 0 tests unitaires engagement

**Spec complete :** `docs/TRANSITION_VERS_ENGAGEMENT.md`

### QA baseline (verifie 19/02/2026)

```
npx tsc --noEmit  → 0 erreurs
npx vite build    → OK (21.99s)
npx vitest run    → 369/369 PASS
29 routes testees → 29/29 OK, 0 erreurs critiques
3 comptes test    → 3/3 connexion OK
FK chaine         → 8/8 colonnes existent (2 non peuplees = gaps engagement)
RBAC              → Agent bloque validation ✅ | DG acces complet ✅
```

## 3. STACK TECHNIQUE

```
Frontend : React 18 + TypeScript + Vite (port 8080)
UI       : Tailwind CSS + shadcn/ui (Radix)
State    : TanStack Query (staleTime 30s) + useState (UI)
Forms    : state-based (principal) ou react-hook-form + Zod
Backend  : Supabase (PostgreSQL + Auth + RLS + Edge Functions)
Tests    : Vitest (unit) + Playwright (E2E)
PDF      : jsPDF + jspdf-autotable
Excel    : ExcelJS
```

## 4. CONVENTIONS CLES

- **TypeScript strict** : zero `any`, zero erreur tsc
- **Imports** : React > Routing > shadcn > TanStack > Supabase > Contextes > Hooks > Composants > Utils > Types
- **Montants** : `formatCurrency()` de `@/lib/utils` (JAMAIS de formatteur local)
- **Types domaine** : definis dans le hook (usePassationsMarche.ts exporte PassationMarche)
- **Mutations** : onSuccess (invalidate + toast.success) + onError (toast.error + description)
- **RLS** : `has_role(auth.uid(), 'ROLE'::app_role)` via table `user_roles`
- **References** : `get_next_sequence(p_doc_type, p_exercice, p_scope)` atomique
- **Textes UI** : tout en francais

**Details complets :** `CONVENTIONS.md`

## 5. NON-REGRESSION (OBLIGATOIRE)

**AVANT tout commit :**

```bash
npx tsc --noEmit         # 0 erreurs
npx vite build           # Build OK
npx vitest run           # 369+ tests PASS
```

**INTERDIT :**

- Commit si un test echoue
- Supprimer un test existant
- Introduire un `any`
- Modifier un module certifie sans re-executer ses tests

## 6. COMMANDES

```bash
npm run dev              # Serveur dev (port 8080)
npm run build            # Build production
npm run typecheck        # tsc --noEmit
npx vitest run           # Tests unitaires (une passe)
npm run test:e2e         # Tests E2E Playwright
npm run lint             # ESLint
npm run verify           # typecheck + lint + test
```

## 7. MCP DISPONIBLES

| MCP                 | Usage                                        |
| ------------------- | -------------------------------------------- |
| supabase            | PostgREST (DML: SELECT/INSERT/UPDATE/DELETE) |
| playwright          | Browser, screenshots, DDL via SQL Editor     |
| filesystem          | Acces fichiers hors projet                   |
| context7            | Documentation librairies                     |
| sequential-thinking | Raisonnement structure                       |
| github              | Issues, PRs, code search                     |

**DDL Supabase** (CREATE TABLE, ALTER) → Playwright MCP > SQL Editor (PostgREST = DML only)

## 8. COMPTES TEST

| Email             | Password  | Role               |
| ----------------- | --------- | ------------------ |
| dg@arti.ci        | Test2026! | DG / Validateur    |
| daaf@arti.ci      | Test2026! | DAAF / Validateur  |
| agent.dsi@arti.ci | Test2026! | DSI / Operationnel |

**Supabase :** tjagvgqthlibdpvztvaf.supabase.co
**Dashboard :** artiabidjan@yahoo.com / VEGet@9008
**GitHub :** naywayne90/sygfp-artis-g-re

## 9. FICHIERS ET DOCS

```
src/components/ → 439 fichiers   src/hooks/ → 165 hooks   src/pages/ → 115 pages
src/lib/ → Workflow, RBAC, PDF   src/services/ → 17 services   src/contexts/ → 2
supabase/migrations/ → 253 SQL   supabase/functions/ → 12 Edge Functions
```

**Docs :** `CLAUDE.md` (instructions) | `ARCHITECTURE.md` | `CONVENTIONS.md` | `PROJECT_STATUS.md` | `docs/TRANSITION_VERS_ENGAGEMENT.md` (spec engagement)

---

_ARTI = Autorite de Regulation du Transport Interieur (Cote d'Ivoire)_
