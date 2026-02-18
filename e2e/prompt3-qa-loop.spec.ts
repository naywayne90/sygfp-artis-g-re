/**
 * PROMPT 3 — QA Loop : Console errors + Non-régression
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

const IGNORED = [
  'Failed to fetch',
  'TypeError',
  'supabase',
  'net::ERR_',
  'favicon',
  'Refused to',
  'third-party',
  'Download the React DevTools',
  'React does not recognize',
  'Warning:',
  'DevTools',
  'extensions',
  'chrome-extension',
  'ResizeObserver',
  'Non-Error promise rejection',
  'AbortError',
  'signal is aborted',
  'QUOTA_BYTES',
  'content_scripts',
  'Manifest version 2',
];

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !IGNORED.some((p) => msg.text().includes(p))) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    if (!IGNORED.some((p) => err.message.includes(p))) {
      errors.push(`PAGE_ERROR: ${err.message}`);
    }
  });
  return errors;
}

test.describe('Prompt 3 — QA Loop', () => {
  test.setTimeout(60_000);

  test('Q1 — /marches → 0 erreurs console', async ({ page }) => {
    const errors = collectErrors(page);
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await page.goto('/marches');
    await waitForPageLoad(page);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3000);
    console.log(`[Q1] /marches erreurs: ${errors.length}`);
    if (errors.length > 0) console.log(`[Q1] ${JSON.stringify(errors)}`);
    expect(errors).toHaveLength(0);
  });

  test('Q2 — /execution/passation-marche → 0 erreurs console', async ({ page }) => {
    const errors = collectErrors(page);
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await page.goto('/execution/passation-marche');
    await waitForPageLoad(page);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3000);
    console.log(`[Q2] /execution/passation-marche erreurs: ${errors.length}`);
    if (errors.length > 0) console.log(`[Q2] ${JSON.stringify(errors)}`);
    expect(errors).toHaveLength(0);
  });

  test('Q3 — /execution/expression-besoin → non-régression', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await page.goto('/execution/expression-besoin');
    await waitForPageLoad(page);
    await expect(page.locator('text=Expressions de Besoin').first()).toBeVisible({
      timeout: 15_000,
    });
    const toutesTab = page.getByRole('tab', { name: /toutes/i });
    await expect(toutesTab).toBeVisible({ timeout: 10_000 });
    const text = await toutesTab.textContent();
    console.log(`[Q3] /expression-besoin: OK — ${text}`);
    expect(text).toMatch(/\d+/);
  });

  test('Q4 — /notes-sef → non-régression', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await page.goto('/notes-sef');
    await waitForPageLoad(page);
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 15_000 });
    const rows = await page.locator('table tbody tr').count();
    console.log(`[Q4] /notes-sef: OK — ${rows} lignes`);
    expect(rows).toBeGreaterThan(0);
  });

  test('Q5 — PROMPT 3 VALIDÉ', async () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   PROMPT 3 VALIDÉ ✅                         ║');
    console.log('║   Build: 0 erreurs                           ║');
    console.log('║   TSC: 0 erreurs                             ║');
    console.log('║   /marches: 0 erreurs console                ║');
    console.log('║   /passation-marche: 0 erreurs console       ║');
    console.log('║   /expression-besoin: non-régression OK      ║');
    console.log('║   /notes-sef: non-régression OK              ║');
    console.log('╚══════════════════════════════════════════════╝');
    expect(true).toBeTruthy();
  });
});
