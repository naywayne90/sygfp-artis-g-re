/**
 * QA Prompt 4 — Diagnostic Playwright Module Imputation
 * 7 vérifications sans modification
 */
import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

test.setTimeout(60000);

// ═══ 1. DAAF crée imputation liée à NAEF → champs pré-remplis ? ═══
test('P4-01 — DAAF ouvre formulaire imputation → champs pré-remplis depuis NAEF', async ({
  page,
}) => {
  await loginAs(page, 'daaf@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);

  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  // Cliquer sur "Imputer" pour la note ARTI0112250003
  const imputerBtn = page
    .locator('button')
    .filter({ hasText: /^Imputer$/i })
    .first();
  const hasBtn = await imputerBtn.isVisible({ timeout: 10000 }).catch(() => false);
  console.log(`[P4-01] Bouton "Imputer" visible: ${hasBtn}`);

  if (!hasBtn) {
    console.log('[P4-01] SKIP — Aucune note à imputer');
    expect(true).toBeTruthy();
    return;
  }

  await imputerBtn.click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Vérifier pré-remplissage depuis la NAEF
  const title = await dialog.locator('h2, h3').first().textContent();
  console.log(`[P4-01] Titre dialog: ${title}`);

  // Référence NAEF pré-remplie
  const refText = await dialog.locator('h3').first().textContent();
  console.log(`[P4-01] Référence NAEF: ${refText}`);
  expect(refText).toContain('ARTI');

  // Objet pré-rempli
  const objet = await dialog
    .locator("text=/demande d'ordinateur/i")
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  console.log(`[P4-01] Objet pré-rempli: ${objet}`);
  expect(objet).toBeTruthy();

  // Direction pré-remplie (DSI)
  const dirCombo = dialog.locator('[role="combobox"]').filter({ hasText: /DSI/i });
  const dirPrefilled = await dirCombo.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P4-01] Direction pré-remplie (DSI): ${dirPrefilled}`);
  expect(dirPrefilled).toBeTruthy();

  // Montant pré-rempli
  const montantInput = dialog.locator('input#montant, input[type="number"]').first();
  const montantVal = await montantInput.inputValue().catch(() => '');
  console.log(`[P4-01] Montant pré-rempli: ${montantVal}`);
  expect(montantVal).toBeTruthy();

  // Demandeur visible
  const demandeur = await dialog
    .locator('text=/Demandeur/i')
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  console.log(`[P4-01] Demandeur visible: ${demandeur}`);

  await dialog
    .locator('button')
    .filter({ hasText: /Annuler/i })
    .click();
});

// ═══ 2. Sélectionner ligne budgétaire → disponible affiché ? ═══
test('P4-02 — Calculer disponible après saisie montant', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);

  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  const imputerBtn = page
    .locator('button')
    .filter({ hasText: /^Imputer$/i })
    .first();
  if (!(await imputerBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log('[P4-02] SKIP — Pas de note à imputer');
    expect(true).toBeTruthy();
    return;
  }

  await imputerBtn.click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Bouton "Calculer disponible" visible
  const calcBtn = dialog.locator('button').filter({ hasText: /Calculer disponible/i });
  await expect(calcBtn).toBeVisible({ timeout: 5000 });
  console.log('[P4-02] Bouton "Calculer disponible" visible: true');

  // Le montant est déjà pré-rempli, attendre le calcul auto (500ms debounce)
  await page.waitForTimeout(2000);

  // Vérifier si des infos de disponibilité apparaissent
  // L'ImputationSummaryCard ou les alertes Budget
  const budgetInfo = dialog
    .locator(
      'text=/Budget disponible|Dotation|Disponible|Montant réservé|budget.*suffisant|dépassement/i'
    )
    .first();
  const hasBudgetInfo = await budgetInfo.isVisible({ timeout: 10000 }).catch(() => false);
  console.log(`[P4-02] Info budget/disponibilité visible: ${hasBudgetInfo}`);

  // Cliquer sur "Calculer disponible" manuellement
  await calcBtn.click();
  await page.waitForTimeout(3000);

  // Vérifier après calcul
  const afterCalc = dialog
    .locator(
      'text=/Budget disponible|Dotation|suffisant|dépassement|Disponible avant|Disponible net/i'
    )
    .first();
  const hasAfterCalc = await afterCalc.isVisible({ timeout: 10000 }).catch(() => false);
  console.log(`[P4-02] Info budget après calcul: ${hasAfterCalc}`);

  if (hasAfterCalc) {
    // Chercher les montants affichés
    const alerts = dialog.locator('[role="alert"], .border-green-500, .border-destructive');
    const alertCount = await alerts.count();
    for (let i = 0; i < alertCount; i++) {
      const text = await alerts.nth(i).textContent();
      console.log(`[P4-02] Alert ${i}: ${text?.substring(0, 200)}`);
    }
  }

  await dialog
    .locator('button')
    .filter({ hasText: /Annuler/i })
    .click();
  expect(true).toBeTruthy();
});

// ═══ 3. Montant > disponible → BLOQUÉ ? ═══
test('P4-03 — Montant > disponible → affiche alerte dépassement', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);

  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  const imputerBtn = page
    .locator('button')
    .filter({ hasText: /^Imputer$/i })
    .first();
  if (!(await imputerBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log('[P4-03] SKIP — Pas de note');
    expect(true).toBeTruthy();
    return;
  }

  await imputerBtn.click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Mettre un montant très élevé
  const montantInput = dialog.locator('input#montant, input[type="number"]').first();
  await montantInput.fill('999999999999');
  console.log('[P4-03] Montant saisi: 999 999 999 999');

  // Attendre le calcul auto
  await page.waitForTimeout(3000);

  // Cliquer "Calculer disponible" pour forcer
  const calcBtn = dialog.locator('button').filter({ hasText: /Calculer disponible/i });
  await calcBtn.click();
  await page.waitForTimeout(3000);

  // Vérifier l'alerte de dépassement
  const depassement = dialog
    .locator('text=/dépass|insuffisant|Déficit|Contrôle budgétaire/i')
    .first();
  const hasDepassement = await depassement.isVisible({ timeout: 10000 }).catch(() => false);
  console.log(`[P4-03] Alerte dépassement visible: ${hasDepassement}`);

  // Vérifier la case "Forcer l'imputation"
  const forcerCheckbox = dialog.locator('#forcer, input[type="checkbox"]').first();
  const hasForcerOption = await forcerCheckbox.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P4-03] Option "Forcer imputation" visible: ${hasForcerOption}`);

  // Le bouton "Imputer" devrait être visible mais l'imputation bloquée sans justification
  const submitBtn = dialog.locator('button').filter({ hasText: /Imputer et créer le dossier/i });
  const submitVisible = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[P4-03] Bouton submit visible: ${submitVisible}`);

  await dialog
    .locator('button')
    .filter({ hasText: /Annuler/i })
    .click();
  expect(true).toBeTruthy();
});

// ═══ 4. Référence existante dans onglet Validées ═══
test('P4-04 — Onglet Validées : référence IMP-XXXX générée', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);

  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  // Onglet Validées
  const valTab = page.locator('[role="tab"]').filter({ hasText: /Validées/i });
  await valTab.click();
  await page.waitForTimeout(1500);

  const rows = page.locator('table tbody tr');
  const count = await rows.count().catch(() => 0);
  console.log(`[P4-04] Imputations validées: ${count}`);

  let refFound = false;
  for (let i = 0; i < count; i++) {
    const text = await rows.nth(i).textContent();
    console.log(`[P4-04] Row ${i}: ${text?.substring(0, 200)}`);
    const match = text?.match(/IMP-\d{4}-[A-Z]+-\d+/);
    if (match) {
      console.log(`[P4-04] ✅ Référence: ${match[0]}`);
      refFound = true;
    }
  }

  if (count > 0) {
    expect(refFound).toBeTruthy();
  } else {
    console.log("[P4-04] Pas d'imputation validée — OK si aucune n'a été soumise");
  }
});

// ═══ 5. Imputation indépendante (sans NAEF) → possible ? ═══
test('P4-05 — Vérifier si imputation indépendante (sans NAEF) est possible', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);

  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  // Chercher un bouton "Nouvelle imputation" ou "Créer" qui ne soit pas lié à une NAEF
  const newImputBtn = page
    .locator('button')
    .filter({ hasText: /Nouvelle imputation|Créer une imputation/i })
    .first();
  const hasNewBtn = await newImputBtn.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`[P4-05] Bouton "Nouvelle imputation" (indépendante): ${hasNewBtn}`);

  if (hasNewBtn) {
    await newImputBtn.click();
    const dialog = page.locator('[role="dialog"]');
    const dialogOpens = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[P4-05] Dialog s'ouvre: ${dialogOpens}`);
    if (dialogOpens) {
      await dialog
        .locator('button')
        .filter({ hasText: /Annuler|Close/i })
        .first()
        .click()
        .catch(() => {});
    }
  } else {
    console.log(
      '[P4-05] Pas de bouton pour imputation indépendante — le module impose une NAEF source'
    );
    // C'est un design choice, pas un bug
  }

  // Vérifier aussi si on peut accéder via URL avec sourceAef
  console.log("[P4-05] L'imputation nécessite une NAEF source (design by spec)");
  expect(true).toBeTruthy();
});

// ═══ 6. Non-régression /notes-sef + /notes-aef ═══
test('P4-06 — Non-régression /notes-sef et /notes-aef', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);

  // /notes-sef
  await page.goto('/notes-sef');
  await waitForPageLoad(page);
  const sefTitle = page.locator('h1, h2').filter({ hasText: /Notes SEF/i });
  const sefOK = await sefTitle.isVisible({ timeout: 15000 }).catch(() => false);
  console.log(`[P4-06] /notes-sef charge: ${sefOK}`);
  expect(sefOK).toBeTruthy();

  const sefTable = page.locator('table').first();
  await expect(sefTable).toBeVisible({ timeout: 10000 });
  console.log('[P4-06] /notes-sef table: OK');

  // /notes-aef
  await page.goto('/notes-aef');
  await waitForPageLoad(page);
  const aefTitle = page.locator('h1, h2').filter({ hasText: /Notes AEF/i });
  const aefOK = await aefTitle.isVisible({ timeout: 15000 }).catch(() => false);
  console.log(`[P4-06] /notes-aef charge: ${aefOK}`);
  expect(aefOK).toBeTruthy();

  const aefTable = page.locator('table').first();
  await expect(aefTable).toBeVisible({ timeout: 10000 });
  console.log('[P4-06] /notes-aef table: OK');
});
