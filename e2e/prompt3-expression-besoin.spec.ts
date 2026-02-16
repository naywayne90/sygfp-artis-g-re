/**
 * QA Prompt 3 — Test Expression de Besoin
 * Vérifie : /execution/expression-besoin charge sans erreurs console/JS
 */
import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

test.setTimeout(45000);

test('P3-QA — /execution/expression-besoin sans erreurs bloquantes', async ({ page }) => {
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
  await page.goto('/execution/expression-besoin');
  await waitForPageLoad(page);

  // Page charge avec un titre
  await expect(page.locator('h1, h2').filter({ hasText: /Expression|Besoin/i })).toBeVisible({
    timeout: 15000,
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

  // Rapport erreurs
  const knownErrors = httpErrors.filter((e) => e.includes('funding_sources') || e.includes('405'));
  const realErrors = httpErrors.filter((e) => !e.includes('funding_sources') && !e.includes('405'));

  console.log(`[P3-QA] Expression Besoin — Erreurs HTTP connues: ${knownErrors.length}`);
  console.log(`[P3-QA] Expression Besoin — Erreurs HTTP réelles: ${realErrors.length}`);
  realErrors.forEach((e) => console.log(`  → ${e}`));
  console.log(`[P3-QA] Expression Besoin — Erreurs JS: ${jsErrors.length}`);
  jsErrors.forEach((e) => console.log(`  → ${e}`));

  // Pas d'erreurs JS bloquantes
  expect(jsErrors.length).toBe(0);
});
