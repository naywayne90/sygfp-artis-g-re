# AGENT_CONTEXT.md — Contexte complet SYGFP

## Etat au 01/04/2026

### Modules certifies

- Notes SEF, AEF, Imputation, Expression de Besoin — Production (E2E)
- Passation de Marche — **Certifie 100/100** (94 unit + 66 E2E)
- Engagement — **Certifie 100/100** (231 unit + 60 E2E)
- Liquidation — **Certifie 100/100** (104 unit + 60 E2E)

### Modules recents (session 31/03 - 01/04/2026)

#### Scanning Engagement — Complete + teste

- Bugs corriges: mutation soumis→visa_saf (au lieu de soumis→soumis), cumul/disponible avec total_engage
- Ameliorations: tri colonnes cliquables, pagination NotesPagination, AlertDialog confirmation, auto-refresh cache
- Colonnes Code Act./N° OS retirees (vides), badges sidebar (2)
- Document parasite "hkjn," nettoye en BD

#### Scanning Liquidation — Complete + teste (10 ameliorations)

- Bugs corriges: memes que Scanning Engagement + formatMontant→formatCurrency
- Ameliorations majeures:
  - Onglet "Numerises" (historique des liquidations traitees)
  - Badge anciennete (jours depuis creation, rouge >10j)
  - Selection multiple (checkboxes + barre action)
  - Numero cliquable → ouvre panneau
  - Custom panel (div) au lieu de Dialog (focus trap fix pour react-dropzone)
  - Filtre fournisseur dedie
  - Colonne Ref. Facture
  - Badge Service fait (SF ✓ / SF ✗)
  - Raccourci Ctrl+Enter pour soumettre
  - Total montants en bas du tableau

#### Feuille de Route — Corrections critiques + nouvelles pages

- **BUG 1 corrige**: CHECK constraint plans_travail — ajoute statuts 'soumis' et 'rejete'
- **BUG 2 corrige**: Colonnes os_id (FK objectifs_strategiques) et priorite ajoutees en BD
- **BUG 3 corrige**: Stats brouillon comptait 'soumis' dans useRoadmapSubmissions
- **BUG 4 corrige**: Bouton Soumettre invisible (condition inversee soumis→brouillon)
- **BUG 5 corrige**: Dropdown sous-activites vide (est_actif→est_active typo)
- Workflow: submitPlan/approvePlan/rejectPlan/activatePlan dans usePlansTravail
- Validation budget: alerte depassement dans ProjetDetail (sum taches vs plan)
- **Nouvelle page**: Livrables Centralises (3 onglets, filtres, export, tri, validation/rejet)
- **Nouvelle page**: Mes Taches (KPI, filtres statut/priorite, tri colonnes, barres avancement)
- Sidebar: 8 entrees (ajout Mes Taches, Livrables, Historique Imports + badges)

#### Sidebar badges ajoutes

- Scanning Engagements: nombre d'engagements soumis
- Scanning Liquidations: nombre de liquidations soumises
- Projets & Plans: nombre de plans brouillon
- Soumissions: nombre de soumissions en attente
- Tableau de Bord: nombre de taches en retard

### Prochaines etapes

1. **Ordonnancement** (~10 prompts) — voir `docs/TRANSITION_VERS_ORDONNANCEMENT.md`
2. **Reglement** (~10 prompts)
3. **Feuille de Route P2** — Vue par OS, RACI complet UI, suivi trimestriel

## Rappels techniques

- Build OK | TSC 0 erreurs | Vitest 713/713 PASS
- Hook ordonnancement: useOrdonnancements (~461 lignes, mature)
- Table: ordonnancements (50+ colonnes, 3 363 records migres)
- Workflow ordonnancement: DAF (1) → DG signature (2)
- FK: liquidation_id > budget_liquidations (validees uniquement)

## Metriques

127 pages | 428 composants | 179 hooks | 19 services | 105 routes | 283 migrations | 12 Edge Functions | 713 tests | 71 E2E specs | 201 tables | 671 RLS | 55 items sidebar

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
