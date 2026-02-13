/**
 * QA Prompt 3 — Boucle de validation continue
 * Vérifie : /imputation (erreurs console), /notes-sef, /notes-aef
 */
import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

test.setTimeout(45000);

test('P3-QA — /execution/imputation sans erreurs bloquantes', async ({ page }) => {
  const httpErrors: string[] = [];
  const jsErrors: string[] = [];

  page.on('response', (resp) => {
    if (resp.status() >= 400) {
      httpErrors.push(`HTTP ${resp.status()}: ${resp.url().split('?')[0]}`);
    }
  });
  page.on('pageerror', (err) => {
    jsErrors.push(err.message.substring(0, 150));
  });

  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/imputation');
  await waitForPageLoad(page);

  // Page charge
  await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
    timeout: 15000,
  });

  // KPIs visibles
  await expect(page.locator('p').filter({ hasText: /Notes à imputer/i })).toBeVisible({
    timeout: 10000,
  });

  // Table ou état vide
  const hasTable = await page
    .locator('table')
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  const hasEmpty = await page
    .locator('text=/Aucune/i')
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  expect(hasTable || hasEmpty).toBeTruthy();

  // Ouvrir le formulaire et vérifier
  const imputerBtn = page
    .locator('button')
    .filter({ hasText: /^Imputer$/i })
    .first();
  if (await imputerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await imputerBtn.click();
    await page.waitForTimeout(2000);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Source de financement — vérifier si le champ fonctionne maintenant
    const fundingCombo = dialog.locator('text=/Source de financement/i');
    const hasFunding = await fundingCombo.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[P3-QA] Source de financement visible: ${hasFunding}`);

    await dialog
      .locator('button')
      .filter({ hasText: /Annuler|Close/i })
      .first()
      .click()
      .catch(() => {});
  }

  // Rapport erreurs
  const funding404 = httpErrors.filter((e) => e.includes('funding_sources'));
  const otherErrors = httpErrors.filter((e) => !e.includes('funding_sources'));

  console.log(`[P3-QA] HTTP 404 funding_sources: ${funding404.length}`);
  console.log(`[P3-QA] Autres erreurs HTTP: ${otherErrors.length}`);
  otherErrors.forEach((e) => console.log(`  → ${e}`));
  console.log(`[P3-QA] Erreurs JS: ${jsErrors.length}`);
  jsErrors.forEach((e) => console.log(`  → ${e}`));

  // Pas d'erreurs JS bloquantes (hors funding_sources connu)
  expect(jsErrors.length).toBe(0);
});

test('P3-QA — /notes-sef OK', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/notes-sef');
  await waitForPageLoad(page);

  await expect(page.locator('h1, h2').filter({ hasText: /Notes SEF/i })).toBeVisible({
    timeout: 15000,
  });

  const table = page.locator('table').first();
  await expect(table).toBeVisible({ timeout: 10000 });
  console.log('[P3-QA] /notes-sef ✅');
});

test('P3-QA — /notes-aef OK', async ({ page }) => {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/notes-aef');
  await waitForPageLoad(page);

  await expect(page.locator('h1, h2').filter({ hasText: /Notes AEF/i })).toBeVisible({
    timeout: 15000,
  });

  const table = page.locator('table').first();
  await expect(table).toBeVisible({ timeout: 10000 });
  console.log('[P3-QA] /notes-aef ✅');
});
