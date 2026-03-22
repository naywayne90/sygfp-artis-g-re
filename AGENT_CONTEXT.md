# AGENT_CONTEXT.md — Prochaine seance : Ordonnancement

## Etat au 22/03/2026

- Structure Budgetaire CERTIFIE (8p)
- Notes SEF CERTIFIE (8p, 191 notes)
- Notes AEF CERTIFIE (8p)
- Imputation CERTIFIE (10p)
- Expression de Besoin CERTIFIE (15p)
- Passation / Marche CERTIFIE (15p, 65 tests PW)
- Documentation & Resilience FAIT (5p)
- Engagement CERTIFIE (15p, 231 unit + 60 E2E, commit 0cf1d5a)
- Liquidation CERTIFIE (15p, 104 unit + 60 E2E, commit d1451b1, certif 100/100)
- Types Supabase REGENERES (22/03, commit a031905, 106 erreurs corrigees)
- ORDONNANCEMENT — PROCHAIN MODULE (~10 prompts)
- Reglement (~10 prompts)

## Prochain demarrage

1. ./RECOVERY.sh ou recreer tmux manuellement
2. Lancer Prompt 1 Ordonnancement (audit, ne modifie rien)
3. Voir `docs/TRANSITION_VERS_ORDONNANCEMENT.md` pour la spec complete

## Rappels techniques

- Build OK | TSC 0 | Vitest 704 PASS | Playwright 71 specs
- Commits : 0cf1d5a (Engagement) > d1451b1 (Liquidation) > a031905 (Types Supabase)
- Hook : useOrdonnancements (~461 lignes, mature)
- Table : ordonnancements (50+ colonnes, 3 363 records migres)
- L'ordonnancement = ordre de payer donne au comptable/tresorier
- Exigence MBAYE EX-01 : notif > DMG + DirOp (ref, fournisseur, montant_net, montant_regle, montant_restant)
- FK : liquidation_id > budget_liquidations (validees uniquement)
- Etape ELOP 3
- Workflow : CB > DAF > DG > AC (4 signatures avec hash cryptographique + QR)
