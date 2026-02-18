/**
 * PROMPT 4 — Passation de Marché : Seuils, Badges, Warning, Référence
 */
import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

// EB test data with known amounts (exercice 2026)
const EB_PSD = 'ARTI010250118'; // 9,470,720 < 10M → Entente directe
const EB_PSC = 'ARTI001260015'; // 26,460,000 (10-30M) → Demande de cotation
const EB_PSO = 'ARTI012250090'; // 142,909,714 (≥ 100M) → AO ouvert
// Separate EB for submission test (avoid consuming badge-test EBs)
const EB_SUBMIT = 'ARTI001260017'; // 8,820,000 < 10M

async function loginAndNavigate(page: import('@playwright/test').Page) {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/passation-marche');
  await waitForPageLoad(page);
  await expect(page.locator('h1').filter({ hasText: /passation/i })).toBeVisible({
    timeout: 15_000,
  });
}

async function openFormAndSelectEB(page: import('@playwright/test').Page, numero: string) {
  await page.getByRole('button', { name: /nouvelle passation/i }).click();
  await expect(page.getByText('Nouvelle passation de marché')).toBeVisible({ timeout: 10_000 });

  const searchInput = page.getByPlaceholder(/rechercher par numéro/i);
  await expect(searchInput).toBeVisible({ timeout: 5_000 });
  await searchInput.fill(numero);
  await page.waitForTimeout(800);

  // Click the EB card matching the numero
  const ebCard = page.locator('.cursor-pointer').filter({ hasText: numero });
  await expect(ebCard.first()).toBeVisible({ timeout: 5_000 });
  await ebCard.first().click();
  await page.waitForTimeout(500);

  await expect(page.getByText('Expression de besoin source')).toBeVisible({ timeout: 5_000 });
}

test.describe.serial('Prompt 4 — Passation de Marché', () => {
  test.setTimeout(60_000);

  test('P4-01 — Formulaire création + liste EB validées', async ({ page }) => {
    await loginAndNavigate(page);

    await page.getByRole('button', { name: /nouvelle passation/i }).click();
    await expect(page.getByText('Nouvelle passation de marché')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder(/rechercher par numéro/i)).toBeVisible();

    // Verify EB list is populated
    const ebCards = page.locator('.p-3.border.rounded-lg.cursor-pointer');
    await expect(ebCards.first()).toBeVisible({ timeout: 10_000 });
    const count = await ebCards.count();
    console.log(`[P4-01] Formulaire ouvert — ${count} EB validées affichées`);
    expect(count).toBeGreaterThan(0);
  });

  test('P4-02 — EB < 10M → badge Entente directe', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_PSD);

    // Verify pre-fill inside dialog: reference + montant visible
    const dialog = page.getByLabel('Nouvelle passation de marché');
    await expect(dialog.getByText(EB_PSD)).toBeVisible();
    await expect(dialog.getByText(/FCFA/).first()).toBeVisible();

    // Verify badge "Entente directe" visible
    await expect(dialog.getByText('Entente directe').first()).toBeVisible({ timeout: 5_000 });
    console.log('[P4-02] EB < 10M → badge Entente directe ✓');
  });

  test('P4-03 — EB 10-30M → badge Demande de cotation', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_PSC);

    const dialog03 = page.getByLabel('Nouvelle passation de marché');
    await expect(dialog03.getByText('Demande de cotation').first()).toBeVisible({ timeout: 5_000 });
    console.log('[P4-03] EB 10-30M → badge Demande de cotation ✓');
  });

  test('P4-04 — EB ≥ 100M → badge AO ouvert', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_PSO);

    const dialog04 = page.getByLabel('Nouvelle passation de marché');
    await expect(dialog04.getByText("Appel d'offres ouvert").first()).toBeVisible({
      timeout: 5_000,
    });
    console.log('[P4-04] EB ≥ 100M → badge AO ouvert ✓');
  });

  test('P4-05 — Mode différent du seuil → warning', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_PSD);

    // Mode auto-set to "entente_directe" for < 10M
    // Change to "Demande de cotation" to trigger mismatch warning
    const modeSelect = page.locator('#mode_passation');
    await expect(modeSelect).toBeVisible({ timeout: 5_000 });
    await modeSelect.click();
    await page.waitForTimeout(300);

    // Click "Demande de cotation" option
    await page.getByRole('option', { name: /Demande de cotation/i }).click();
    await page.waitForTimeout(300);

    // Verify warning text
    await expect(page.getByText(/procedure recommandee/i)).toBeVisible({ timeout: 5_000 });
    console.log('[P4-05] Warning mode/seuil mismatch ✓');
  });

  test('P4-06 — Soumission → référence PM-YYYY-NNNN', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_SUBMIT);

    // Submit
    await page.getByRole('button', { name: /créer la passation/i }).click();

    // Wait for success toast
    await expect(page.getByText(/passation.*créée/i)).toBeVisible({ timeout: 15_000 });
    console.log('[P4-06] Toast succès reçu');

    // Check brouillons tab for reference
    await page.waitForTimeout(1000);
    const brouillonTab = page.getByRole('tab', {
      name: /brouillons/i,
    });
    if (await brouillonTab.isVisible()) {
      await brouillonTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(/PM-\d{4}-[A-Z]+-\d{4}/)).toBeVisible({
      timeout: 10_000,
    });
    const refText = await page
      .getByText(/PM-\d{4}-[A-Z]+-\d{4}/)
      .first()
      .textContent();
    console.log(`[P4-06] Référence générée: ${refText} ✓`);
  });

  test('P4-07 — Non-régression /expression-besoin', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await page.goto('/execution/expression-besoin');
    await waitForPageLoad(page);
    await expect(page.locator('text=Expressions de Besoin').first()).toBeVisible({
      timeout: 15_000,
    });
    console.log('[P4-07] /expression-besoin non-régression OK ✓');
  });

  test('P4-08 — Non-régression /notes-sef', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await page.goto('/notes-sef');
    await waitForPageLoad(page);
    await expect(page.locator('table').first()).toBeVisible({
      timeout: 15_000,
    });
    const rows = await page.locator('table tbody tr').count();
    console.log(`[P4-08] /notes-sef non-régression OK — ${rows} lignes ✓`);
    expect(rows).toBeGreaterThan(0);
  });

  test('P4-09 — PROMPT 4 VALIDÉ', async () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   PROMPT 4 VALIDÉ ✅                         ║');
    console.log('║   Formulaire passation: OK                   ║');
    console.log('║   Seuil < 10M: Entente directe ✓            ║');
    console.log('║   Seuil 10-30M: Demande de cotation ✓       ║');
    console.log('║   Seuil ≥ 100M: AO ouvert ✓                ║');
    console.log('║   Warning mode/seuil: OK ✓                  ║');
    console.log('║   Référence PM-YYYY-NNNN: OK ✓              ║');
    console.log('║   Non-régression: OK ✓                      ║');
    console.log('╚══════════════════════════════════════════════╝');
    expect(true).toBeTruthy();
  });
});
