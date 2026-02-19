# TESTS_REGISTRY.md — SYGFP

**Derniere MAJ :** 19 fevrier 2026
**Total : 76 fichiers | 1 468 tests (370 unit + 1 098 E2E)**

---

## Resume par type

| Type             | Fichiers | Tests | Commande              |
| ---------------- | -------- | ----- | --------------------- |
| Unit (Vitest)    | 7        | 370   | `npx vitest run`      |
| E2E (Playwright) | 69       | 1 098 | `npx playwright test` |

---

## 1. TESTS UNITAIRES (Vitest)

| #   | Fichier                                             | Module    | Tests | MAJ        | Commande                                                           |
| --- | --------------------------------------------------- | --------- | ----- | ---------- | ------------------------------------------------------------------ |
| 1   | `src/lib/workflow/__tests__/workflowEngine.test.ts` | Workflow  | 95    | 2026-02-12 | `npx vitest run src/lib/workflow/__tests__/workflowEngine.test.ts` |
| 2   | `src/lib/rbac/__tests__/permissions.test.ts`        | RBAC      | 91    | 2026-02-12 | `npx vitest run src/lib/rbac/__tests__/permissions.test.ts`        |
| 3   | `src/test/passation-utils.test.ts`                  | Passation | 74    | 2026-02-18 | `npx vitest run src/test/passation-utils.test.ts`                  |
| 4   | `src/lib/budget/__tests__/imputation-utils.test.ts` | Budget    | 52    | 2026-02-12 | `npx vitest run src/lib/budget/__tests__/imputation-utils.test.ts` |
| 5   | `src/test/qrcode-utils.test.ts`                     | Documents | 34    | 2026-02-04 | `npx vitest run src/test/qrcode-utils.test.ts`                     |
| 6   | `src/test/passation-evaluation.test.ts`             | Passation | 20    | 2026-02-18 | `npx vitest run src/test/passation-evaluation.test.ts`             |
| 7   | `src/test/example.test.ts`                          | Smoke     | 4     | 2026-01-29 | `npx vitest run src/test/example.test.ts`                          |

---

## 2. TESTS E2E (Playwright) — Par module

### 2.1 Passation de Marche (certifie 100/100)

| #   | Fichier                                          | Tests | MAJ        | Commande                                                             |
| --- | ------------------------------------------------ | ----- | ---------- | -------------------------------------------------------------------- |
| 1   | `e2e/passation-marche-complete.spec.ts`          | 79    | 2026-02-18 | `npx playwright test e2e/passation-marche-complete.spec.ts`          |
| 2   | `e2e/audit-marches-detail.spec.ts`               | 31    | 2026-02-18 | `npx playwright test e2e/audit-marches-detail.spec.ts`               |
| 3   | `e2e/audit-passation-marche.spec.ts`             | 12    | 2026-02-18 | `npx playwright test e2e/audit-passation-marche.spec.ts`             |
| 4   | `e2e/prompt9-lifecycle.spec.ts`                  | 11    | 2026-02-18 | `npx playwright test e2e/prompt9-lifecycle.spec.ts`                  |
| 5   | `e2e/prompt10-rbac-approbation.spec.ts`          | 10    | 2026-02-18 | `npx playwright test e2e/prompt10-rbac-approbation.spec.ts`          |
| 6   | `e2e/prompt10-certification.spec.ts`             | 9     | 2026-02-16 | `npx playwright test e2e/prompt10-certification.spec.ts`             |
| 7   | `e2e/prompt4-passation.spec.ts`                  | 9     | 2026-02-18 | `npx playwright test e2e/prompt4-passation.spec.ts`                  |
| 8   | `e2e/prompt6-passation-soumissionnaires.spec.ts` | 9     | 2026-02-18 | `npx playwright test e2e/prompt6-passation-soumissionnaires.spec.ts` |
| 9   | `e2e/prompt8-marche-details.spec.ts`             | 9     | 2026-02-18 | `npx playwright test e2e/prompt8-marche-details.spec.ts`             |
| 10  | `e2e/prompt12-rbac-perf.spec.ts`                 | 10    | 2026-02-18 | `npx playwright test e2e/prompt12-rbac-perf.spec.ts`                 |
| 11  | `e2e/prompt7-evaluation.spec.ts`                 | 10    | 2026-02-18 | `npx playwright test e2e/prompt7-evaluation.spec.ts`                 |
| 12  | `e2e/prompt5-passation-lots.spec.ts`             | 8     | 2026-02-18 | `npx playwright test e2e/prompt5-passation-lots.spec.ts`             |
| 13  | `e2e/prompt13-qr-chain-badge.spec.ts`            | 7     | 2026-02-18 | `npx playwright test e2e/prompt13-qr-chain-badge.spec.ts`            |
| 14  | `e2e/prompt11-exports.spec.ts`                   | 6     | 2026-02-18 | `npx playwright test e2e/prompt11-exports.spec.ts`                   |

### 2.2 Notes SEF

| #   | Fichier                            | Tests | MAJ        | Commande                                               |
| --- | ---------------------------------- | ----- | ---------- | ------------------------------------------------------ |
| 1   | `e2e/notes-sef.spec.ts`            | 17    | 2026-02-12 | `npx playwright test e2e/notes-sef.spec.ts`            |
| 2   | `e2e/notes-sef/exports.spec.ts`    | 12    | 2026-02-04 | `npx playwright test e2e/notes-sef/exports.spec.ts`    |
| 3   | `e2e/notes-sef/validation.spec.ts` | 10    | 2026-02-04 | `npx playwright test e2e/notes-sef/validation.spec.ts` |
| 4   | `e2e/notes-sef/creation.spec.ts`   | 8     | 2026-02-04 | `npx playwright test e2e/notes-sef/creation.spec.ts`   |

### 2.3 Notes AEF

| #   | Fichier                          | Tests | MAJ        | Commande                                             |
| --- | -------------------------------- | ----- | ---------- | ---------------------------------------------------- |
| 1   | `e2e/notes-aef-complete.spec.ts` | 40    | 2026-02-13 | `npx playwright test e2e/notes-aef-complete.spec.ts` |

### 2.4 Imputation

| #   | Fichier                                 | Tests | MAJ        | Commande                                                    |
| --- | --------------------------------------- | ----- | ---------- | ----------------------------------------------------------- |
| 1   | `e2e/tests/imputation-complete.spec.ts` | 61    | 2026-02-16 | `npx playwright test e2e/tests/imputation-complete.spec.ts` |
| 2   | `e2e/imputation-complete.spec.ts`       | 56    | 2026-02-16 | `npx playwright test e2e/imputation-complete.spec.ts`       |
| 3   | `e2e/prompt8-imputation-qa.spec.ts`     | 8     | 2026-02-16 | `npx playwright test e2e/prompt8-imputation-qa.spec.ts`     |

### 2.5 Expression de Besoin

| #   | Fichier                                              | Tests | MAJ        | Commande                                                                 |
| --- | ---------------------------------------------------- | ----- | ---------- | ------------------------------------------------------------------------ |
| 1   | `e2e/tests/expression-besoin-complete.spec.ts`       | 53    | 2026-02-16 | `npx playwright test e2e/tests/expression-besoin-complete.spec.ts`       |
| 2   | `e2e/expression-besoin-complete.spec.ts`             | 52    | 2026-02-16 | `npx playwright test e2e/expression-besoin-complete.spec.ts`             |
| 3   | `e2e/prompt7-expression-besoin-articles.spec.ts`     | 15    | 2026-02-16 | `npx playwright test e2e/prompt7-expression-besoin-articles.spec.ts`     |
| 4   | `e2e/prompt6-expression-besoin-flux-complet.spec.ts` | 12    | 2026-02-16 | `npx playwright test e2e/prompt6-expression-besoin-flux-complet.spec.ts` |
| 5   | `e2e/prompt4-expression-besoin.spec.ts`              | 11    | 2026-02-16 | `npx playwright test e2e/prompt4-expression-besoin.spec.ts`              |
| 6   | `e2e/prompt5-expression-besoin-details.spec.ts`      | 9     | 2026-02-16 | `npx playwright test e2e/prompt5-expression-besoin-details.spec.ts`      |
| 7   | `e2e/prompt3-expression-besoin.spec.ts`              | 2     | 2026-02-16 | `npx playwright test e2e/prompt3-expression-besoin.spec.ts`              |

### 2.6 Engagement

| #   | Fichier                            | Tests | MAJ        | Commande                                               |
| --- | ---------------------------------- | ----- | ---------- | ------------------------------------------------------ |
| 1   | `e2e/engagements/creation.spec.ts` | 10    | 2026-02-07 | `npx playwright test e2e/engagements/creation.spec.ts` |

### 2.7 Liquidation

| #   | Fichier                             | Tests | MAJ        | Commande                                                |
| --- | ----------------------------------- | ----- | ---------- | ------------------------------------------------------- |
| 1   | `e2e/liquidations/creation.spec.ts` | 10    | 2026-02-07 | `npx playwright test e2e/liquidations/creation.spec.ts` |

### 2.8 Reglement

| #   | Fichier                                       | Tests | MAJ        | Commande                                                          |
| --- | --------------------------------------------- | ----- | ---------- | ----------------------------------------------------------------- |
| 1   | `e2e/reglements/page.spec.ts`                 | 20    | 2026-02-07 | `npx playwright test e2e/reglements/page.spec.ts`                 |
| 2   | `e2e/reglements/reglement-filtres.spec.ts`    | 20    | 2026-02-07 | `npx playwright test e2e/reglements/reglement-filtres.spec.ts`    |
| 3   | `e2e/reglements/reglement-bordereau.spec.ts`  | 17    | 2026-02-07 | `npx playwright test e2e/reglements/reglement-bordereau.spec.ts`  |
| 4   | `e2e/reglements/reglement-creation.spec.ts`   | 15    | 2026-02-07 | `npx playwright test e2e/reglements/reglement-creation.spec.ts`   |
| 5   | `e2e/reglements/reglement-export.spec.ts`     | 15    | 2026-02-07 | `npx playwright test e2e/reglements/reglement-export.spec.ts`     |
| 6   | `e2e/reglements/reglement-validation.spec.ts` | 14    | 2026-02-07 | `npx playwright test e2e/reglements/reglement-validation.spec.ts` |
| 7   | `e2e/reglements/reglement-partiel.spec.ts`    | 12    | 2026-02-07 | `npx playwright test e2e/reglements/reglement-partiel.spec.ts`    |
| 8   | `e2e/reglements/creation.spec.ts`             | 11    | 2026-02-07 | `npx playwright test e2e/reglements/creation.spec.ts`             |
| 9   | `e2e/reglements/workflow.spec.ts`             | 11    | 2026-02-07 | `npx playwright test e2e/reglements/workflow.spec.ts`             |
| 10  | `e2e/reglements/validation.spec.ts`           | 8     | 2026-02-07 | `npx playwright test e2e/reglements/validation.spec.ts`           |
| 11  | `e2e/reglements/paiement-partiel.spec.ts`     | 6     | 2026-02-07 | `npx playwright test e2e/reglements/paiement-partiel.spec.ts`     |

### 2.9 Notifications

| #   | Fichier                                           | Tests | MAJ        | Commande                                                              |
| --- | ------------------------------------------------- | ----- | ---------- | --------------------------------------------------------------------- |
| 1   | `e2e/notifications/notification-center.spec.ts`   | 31    | 2026-02-04 | `npx playwright test e2e/notifications/notification-center.spec.ts`   |
| 2   | `e2e/notifications/notification-triggers.spec.ts` | 22    | 2026-02-04 | `npx playwright test e2e/notifications/notification-triggers.spec.ts` |
| 3   | `e2e/notifications/notification-settings.spec.ts` | 19    | 2026-02-04 | `npx playwright test e2e/notifications/notification-settings.spec.ts` |
| 4   | `e2e/notifications/notifications.spec.ts`         | 13    | 2026-02-04 | `npx playwright test e2e/notifications/notifications.spec.ts`         |

### 2.10 Dashboard / DMG

| #   | Fichier                              | Tests | MAJ        | Commande                                                 |
| --- | ------------------------------------ | ----- | ---------- | -------------------------------------------------------- |
| 1   | `e2e/dmg/dashboard-dmg.spec.ts`      | 32    | 2026-02-04 | `npx playwright test e2e/dmg/dashboard-dmg.spec.ts`      |
| 2   | `e2e/dmg/workflow-urgent.spec.ts`    | 26    | 2026-02-04 | `npx playwright test e2e/dmg/workflow-urgent.spec.ts`    |
| 3   | `e2e/dmg/urgent-liquidation.spec.ts` | 22    | 2026-02-04 | `npx playwright test e2e/dmg/urgent-liquidation.spec.ts` |
| 4   | `e2e/dashboard/charts.spec.ts`       | 12    | 2026-02-04 | `npx playwright test e2e/dashboard/charts.spec.ts`       |
| 5   | `e2e/dashboard/kpis.spec.ts`         | 10    | 2026-02-04 | `npx playwright test e2e/dashboard/kpis.spec.ts`         |

### 2.11 Documents (PDF, Excel, QR)

| #   | Fichier                              | Tests | MAJ        | Commande                                                 |
| --- | ------------------------------------ | ----- | ---------- | -------------------------------------------------------- |
| 1   | `e2e/documents/verify-page.spec.ts`  | 16    | 2026-02-04 | `npx playwright test e2e/documents/verify-page.spec.ts`  |
| 2   | `e2e/documents/excel-export.spec.ts` | 12    | 2026-02-04 | `npx playwright test e2e/documents/excel-export.spec.ts` |
| 3   | `e2e/documents/pdf-export.spec.ts`   | 7     | 2026-02-04 | `npx playwright test e2e/documents/pdf-export.spec.ts`   |
| 4   | `e2e/documents/qrcode.spec.ts`       | 7     | 2026-02-04 | `npx playwright test e2e/documents/qrcode.spec.ts`       |

### 2.12 Notes (equipe, type)

| #   | Fichier                        | Tests | MAJ        | Commande                                           |
| --- | ------------------------------ | ----- | ---------- | -------------------------------------------------- |
| 1   | `e2e/notes/team-notes.spec.ts` | 9     | 2026-02-04 | `npx playwright test e2e/notes/team-notes.spec.ts` |
| 2   | `e2e/notes/type-note.spec.ts`  | 7     | 2026-02-04 | `npx playwright test e2e/notes/type-note.spec.ts`  |

### 2.13 Budget / Virements

| #   | Fichier                            | Tests | MAJ        | Commande                                               |
| --- | ---------------------------------- | ----- | ---------- | ------------------------------------------------------ |
| 1   | `e2e/virements/page.spec.ts`       | 15    | 2026-02-10 | `npx playwright test e2e/virements/page.spec.ts`       |
| 2   | `e2e/structure-budgetaire.spec.ts` | 12    | 2026-02-12 | `npx playwright test e2e/structure-budgetaire.spec.ts` |

### 2.14 Workflow

| #   | Fichier                                 | Tests | MAJ        | Commande                                                    |
| --- | --------------------------------------- | ----- | ---------- | ----------------------------------------------------------- |
| 1   | `e2e/workflow/chaine-complete.spec.ts`  | 8     | 2026-02-07 | `npx playwright test e2e/workflow/chaine-complete.spec.ts`  |
| 2   | `e2e/workflow/validation-cycle.spec.ts` | 6     | 2026-02-04 | `npx playwright test e2e/workflow/validation-cycle.spec.ts` |

### 2.15 QA Prompts (transversal)

| #   | Fichier                       | Tests | MAJ        | Commande                                          |
| --- | ----------------------------- | ----- | ---------- | ------------------------------------------------- |
| 1   | `e2e/prompt8-qa.spec.ts`      | 12    | 2026-02-16 | `npx playwright test e2e/prompt8-qa.spec.ts`      |
| 2   | `e2e/prompt6-qa.spec.ts`      | 12    | 2026-02-13 | `npx playwright test e2e/prompt6-qa.spec.ts`      |
| 3   | `e2e/prompt7-qa.spec.ts`      | 10    | 2026-02-13 | `npx playwright test e2e/prompt7-qa.spec.ts`      |
| 4   | `e2e/prompt4-qa.spec.ts`      | 6     | 2026-02-13 | `npx playwright test e2e/prompt4-qa.spec.ts`      |
| 5   | `e2e/prompt5-qa.spec.ts`      | 6     | 2026-02-13 | `npx playwright test e2e/prompt5-qa.spec.ts`      |
| 6   | `e2e/prompt3-qa-loop.spec.ts` | 5     | 2026-02-18 | `npx playwright test e2e/prompt3-qa-loop.spec.ts` |
| 7   | `e2e/prompt3-qa.spec.ts`      | 4     | 2026-02-13 | `npx playwright test e2e/prompt3-qa.spec.ts`      |

### 2.16 Autres

| #   | Fichier               | Tests | MAJ        | Commande                                  |
| --- | --------------------- | ----- | ---------- | ----------------------------------------- |
| 1   | `e2e/example.spec.ts` | 2     | 2026-01-29 | `npx playwright test e2e/example.spec.ts` |

---

## 3. Commandes utiles

```bash
# Tous les tests unitaires
npx vitest run

# Tous les tests E2E
npx playwright test

# Un fichier specifique (unit)
npx vitest run src/test/passation-utils.test.ts

# Un fichier specifique (E2E)
npx playwright test e2e/passation-marche-complete.spec.ts

# Un module E2E entier
npx playwright test e2e/reglements/

# Tests avec reporter detaille
npx playwright test --reporter=list --workers=1

# Tests avec filtre par nom
npx vitest run -t "calcul montant"
npx playwright test --grep "creation"
```

---

_Document genere le 19/02/2026 — SYGFP v2.0_
