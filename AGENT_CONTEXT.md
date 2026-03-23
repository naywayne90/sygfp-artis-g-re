# AGENT_CONTEXT.md — Prochaine seance : Ordonnancement

## Etat au 23/03/2026

- Structure Budgetaire CERTIFIE
- Notes SEF CERTIFIE
- Notes AEF CERTIFIE
- Imputation CERTIFIE
- Expression de Besoin CERTIFIE
- Passation / Marche CERTIFIE (94 unit + 66 E2E)
- Documentation & Resilience FAIT
- Engagement CERTIFIE (231 unit + 60 E2E)
- Liquidation CERTIFIE (104 unit + 60 E2E)
- Types Supabase REGENERES (23/03, commit a031905)
- Parametrage COMPLET (22 modules, 8 nouveaux, restructure, commit 409c1a6)
- ORDONNANCEMENT — PROCHAIN MODULE (~10 prompts)
- Reglement (~10 prompts)

## Travail session 22-23/03/2026

1. Regeneration types Supabase + 106 erreurs corrigees
2. Docs obsoletes mis a jour (README v4.1, CLAUDE.md, TESTS_REGISTRY)
3. Sidebar: +3 items, -5 inutiles, +8 nouveaux modules, restructuration
4. Gestion Doublons + Compteurs References completes (zero stubs)
5. Codification: preview live, test BUDGETAIRE, DA, retry
6. 8 modules admin crees (hooks + pages + routes + RBAC)
7. Structure finale: REFERENTIELS(6) + UTILISATEURS(7) + SYSTEME(9) = 22 items

## Prochain demarrage

1. ./RECOVERY.sh ou recreer tmux
2. Lancer Prompt 1 Ordonnancement (audit, ne modifie rien)
3. Voir `docs/TRANSITION_VERS_ORDONNANCEMENT.md`

## Rappels techniques

- Build OK | TSC 0 | Vitest 704 PASS | Playwright 44/44 pages
- Dernier commit: 409c1a6
- Hook: useOrdonnancements (~461 lignes, mature)
- Table: ordonnancements (50+ colonnes, 3 363 records migres)
- Workflow: CB > DAF > DG > AC (4 signatures avec QR)
- FK: liquidation_id > budget_liquidations (validees uniquement)
- Exigence MBAYE EX-01: notif > DMG + DirOp

## Metriques

124 pages | 426 composants | 177 hooks | 19 services | 117 routes | 278 migrations | 12 Edge Functions | 704 tests | 71 E2E specs | 203 tables | 526 RLS
