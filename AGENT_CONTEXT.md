# AGENT_CONTEXT.md — Contexte complet SYGFP

## Etat au 24/03/2026

### Modules certifies

- Notes SEF, AEF, Imputation, Expression de Besoin — Production (E2E)
- Passation de Marche — **Certifie 100/100** (94 unit + 66 E2E)
- Engagement — **Certifie 100/100** (231 unit + 60 E2E)
- Liquidation — **Certifie 100/100** (104 unit + 60 E2E)

### Modules recents (session 22-24/03/2026)

- Types Supabase regeneres + 106 erreurs corrigees
- Parametrage complet: 22 modules admin (8 nouveaux, restructure sidebar)
- **Feuille de Route** : 5 pages (Dashboard, Direction, Projets, Soumissions, Import)
  - Workflow: Direction soumet → CB + Charge de Mission valident → DG consulte
  - Livrables: planifie → soumis → valide/rejete
  - Notifications automatiques (triggers DB)
- **Suivi DG** : Module complet de suivi des validations
  - 5 onglets: Vue d'ensemble, Circuit Validation, Par Direction, En attente, Historique
  - Pipeline 9 etapes avec barres de progression
  - Matrice de validation (qui valide quoi, noms des personnes)
  - Table operations filtrables avec progression X/9
  - Acces DG + ADMIN uniquement
- Documentation mise a jour: 21 fichiers MODULE\_\*.md + PROJECT_STATUS.md + CLAUDE.md

### Prochaines etapes

1. **Ordonnancement** (~10 prompts) — voir `docs/TRANSITION_VERS_ORDONNANCEMENT.md`
2. **Reglement** (~10 prompts)

## Rappels techniques

- Build OK | TSC 0 erreurs | Vitest 704/704 PASS
- Hook ordonnancement: useOrdonnancements (~461 lignes, mature)
- Table: ordonnancements (50+ colonnes, 3 363 records migres)
- Workflow ordonnancement: DAF (1) → DG signature (2)
- FK: liquidation_id > budget_liquidations (validees uniquement)

## Metriques

125 pages | 426 composants | 179 hooks | 19 services | 103 routes | 281 migrations | 12 Edge Functions | 704 tests | 71 E2E specs | 201 tables | 671 RLS | 50 items sidebar

## Comptes test

| Email             | Password  | Role |
| ----------------- | --------- | ---- |
| dg@arti.ci        | Test2026! | DG   |
| daaf@arti.ci      | Test2026! | DAAF |
| agent.dsi@arti.ci | Test2026! | DSI  |

## Documentation disponible

Chaque module a sa documentation complete dans `docs/modules/MODULE_*.md` :

- Boutons et actions de chaque page
- Statuts et transitions
- Workflow de validation (qui valide a chaque etape)
- Tables Supabase utilisees
- Hooks et composants
- Tests associes
