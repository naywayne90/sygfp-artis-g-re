# AGENT_CONTEXT.md — Prochaine séance : Ordonnancement

## État au 22/02/2026

- ✅ Structure Budgétaire CERTIFIÉ (8p)
- ✅ Notes SEF CERTIFIÉ (8p, 191 notes)
- ✅ Notes AEF CERTIFIÉ (8p)
- ✅ Imputation CERTIFIÉ (10p)
- ✅ Expression de Besoin CERTIFIÉ (15p)
- ✅ Passation / Marché CERTIFIÉ (15p, 65 tests PW)
- ✅ Documentation & Résilience FAIT (5p)
- ✅ Engagement CERTIFIÉ (15p, 444 vitest, commit 0cf1d5a)
- ✅ Liquidation CERTIFIÉ (15p, 704 vitest, 104 PW, commit d1451b1, certif 100/100)
- 🔄 ORDONNANCEMENT — PROCHAIN MODULE (~10 prompts)
- ⏳ Règlement (~10 prompts)

## Prochain démarrage

1. ./RECOVERY.sh ou recréer tmux manuellement
2. Coller AGENT_CONTEXT.md du module Ordonnancement (à générer sur Claude.ai)
3. Lancer Prompt 1 (audit, ne modifie rien)

## Rappels techniques

- Build OK | TSC 0 | Vitest 704 PASS | Playwright 104
- Commits : 0cf1d5a (Engagement) → d1451b1 (Liquidation)
- Hook : useOrdonnancements (~461 lignes, mature)
- Table : ordonnancements
- L'ordonnancement = ordre de payer donné au comptable/trésorier
- Exigence MBAYE EX-01 : notif → DMG + DirOp (réf, fournisseur, montant_net, montant_réglé, montant_restant)
- FK : liquidation_id → budget_liquidations (validées uniquement)
- Étape ELOP 3
