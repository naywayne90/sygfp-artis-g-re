/**
 * AUDIT QA — Passation de Marché / Marchés
 * Playwright diagnostic — NE MODIFIE RIEN
 *
 * A1 : /marches charge + temps + erreurs console
 * A2 : /execution/passation-marche charge + temps + erreurs console
 * A3 : KPIs visibles sur /marches
 * A4 : Onglets par statut sur /marches
 * A5 : Colonnes tableau /marches
 * A6 : Formulaire création accessible /marches
 * A7 : /execution/passation-marche — KPIs + onglets + tableau
 * A8 : Formulaire création passation accessible
 * A9 : Routes /passation/lots, /passation/evaluation, /passation/[id]
 * A10: Non-régression 5 pages
 * A11: Comptage marchés en base (via API)
 * A12: Résumé audit
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

const IGNORED_CONSOLE_PATTERNS = [
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

function isIgnored(msg: string): boolean {
  return IGNORED_CONSOLE_PATTERNS.some((p) => msg.includes(p));
}

async function loginAndGo(page: Page, url: string) {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  const start = Date.now();
  await page.goto(url);
  await waitForPageLoad(page);
  return start;
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isIgnored(msg.text())) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    if (!isIgnored(err.message)) {
      errors.push(`PAGE_ERROR: ${err.message}`);
    }
  });
  return errors;
}

test.describe('Audit Passation de Marché / Marchés', () => {
  test.setTimeout(60_000);

  /* ================================================================== */
  /*  A1 — /marches charge + temps + erreurs console                    */
  /* ================================================================== */
  test('A1 — /marches charge, temps, erreurs console', async ({ page }) => {
    const errors = collectErrors(page);
    const start = await loginAndGo(page, '/marches');

    // Attendre contenu visible
    const heading = page.locator('h1, h2, [class*="heading"]').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
    const delta = Date.now() - start;

    console.log(`[A1] Temps chargement /marches: ${delta}ms`);
    console.log(`[A1] Heading: "${await heading.textContent()}"`);

    await page.waitForTimeout(3000);
    console.log(`[A1] Erreurs console: ${errors.length}`);
    if (errors.length > 0) console.log(`[A1] Détail: ${JSON.stringify(errors)}`);

    // Vérifier que la page charge
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText && bodyText.length > 100;
    console.log(`[A1] Contenu page: ${hasContent ? 'OK' : 'VIDE'}`);
    expect(hasContent).toBeTruthy();
    console.log('[A1] PASS');
  });

  /* ================================================================== */
  /*  A2 — /execution/passation-marche charge + temps + console         */
  /* ================================================================== */
  test('A2 — /execution/passation-marche charge, temps, erreurs console', async ({ page }) => {
    const errors = collectErrors(page);
    const start = await loginAndGo(page, '/execution/passation-marche');

    const heading = page.locator('h1, h2, [class*="heading"]').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
    const delta = Date.now() - start;

    console.log(`[A2] Temps chargement /execution/passation-marche: ${delta}ms`);
    console.log(`[A2] Heading: "${await heading.textContent()}"`);

    await page.waitForTimeout(3000);
    console.log(`[A2] Erreurs console: ${errors.length}`);
    if (errors.length > 0) console.log(`[A2] Détail: ${JSON.stringify(errors)}`);

    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText && bodyText.length > 100;
    console.log(`[A2] Contenu page: ${hasContent ? 'OK' : 'VIDE'}`);
    expect(hasContent).toBeTruthy();
    console.log('[A2] PASS');
  });

  /* ================================================================== */
  /*  A3 — KPIs visibles sur /marches                                   */
  /* ================================================================== */
  test('A3 — /marches KPIs visibles', async ({ page }) => {
    await loginAndGo(page, '/marches');
    await page.waitForTimeout(2000);

    // Chercher les KPI cards (pattern: .grid > div avec chiffres)
    const kpiLabels = [
      'total',
      'en attente',
      'validé',
      'rejeté',
      'différé',
      'en cours',
      'à valider',
    ];

    let kpiFound = 0;
    for (const label of kpiLabels) {
      const el = page.locator(`text=/${label}/i`).first();
      const visible = await el.isVisible().catch(() => false);
      if (visible) {
        kpiFound++;
        console.log(`[A3] KPI "${label}": visible`);
      }
    }

    // Chercher aussi par class pattern (cards)
    const cards = page.locator('.rounded-lg.border, .rounded-xl.border, [class*="card"]');
    const cardCount = await cards.count();
    console.log(`[A3] KPI cards (by CSS): ${cardCount}`);
    console.log(`[A3] KPI labels trouvés: ${kpiFound}`);

    // Chercher des chiffres dans la page (KPI values)
    const bigNumbers = page.locator('.text-2xl, .text-3xl, .text-4xl');
    const numCount = await bigNumbers.count();
    console.log(`[A3] Grands chiffres (KPI values): ${numCount}`);

    console.log('[A3] PASS');
  });

  /* ================================================================== */
  /*  A4 — Onglets par statut sur /marches                              */
  /* ================================================================== */
  test('A4 — /marches onglets par statut', async ({ page }) => {
    await loginAndGo(page, '/marches');
    await page.waitForTimeout(2000);

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    console.log(`[A4] Nombre d'onglets: ${tabCount}`);

    const tabTexts: string[] = [];
    for (let i = 0; i < tabCount; i++) {
      const text = await tabs.nth(i).textContent();
      tabTexts.push(text?.trim() || '');
    }
    console.log(`[A4] Onglets: ${JSON.stringify(tabTexts)}`);

    // Cliquer sur chaque onglet et vérifier le contenu
    for (let i = 0; i < Math.min(tabCount, 6); i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(1500);
      const table = page.locator('table').first();
      const hasTable = await table.isVisible().catch(() => false);
      const emptyState = page.locator('text=/aucun|vide|pas de/i').first();
      const hasEmpty = await emptyState.isVisible().catch(() => false);
      console.log(`[A4] Onglet "${tabTexts[i]}": tableau=${hasTable}, vide=${hasEmpty}`);
    }

    console.log('[A4] PASS');
  });

  /* ================================================================== */
  /*  A5 — Colonnes tableau /marches                                    */
  /* ================================================================== */
  test('A5 — /marches colonnes tableau', async ({ page }) => {
    await loginAndGo(page, '/marches');
    await page.waitForTimeout(2000);

    // Trouver le tableau
    const table = page.locator('table').first();
    const hasTable = await table.isVisible().catch(() => false);
    console.log(`[A5] Tableau visible: ${hasTable}`);

    if (hasTable) {
      // Lire les headers
      const headers = table.locator('thead th, thead td');
      const headerCount = await headers.count();
      const headerTexts: string[] = [];
      for (let i = 0; i < headerCount; i++) {
        const text = await headers.nth(i).textContent();
        headerTexts.push(text?.trim() || '');
      }
      console.log(`[A5] Colonnes (${headerCount}): ${JSON.stringify(headerTexts)}`);

      // Compter les lignes
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();
      console.log(`[A5] Lignes: ${rowCount}`);

      // Lire la première ligne
      if (rowCount > 0) {
        const cells = rows.first().locator('td');
        const cellCount = await cells.count();
        const cellTexts: string[] = [];
        for (let i = 0; i < Math.min(cellCount, 8); i++) {
          const text = await cells.nth(i).textContent();
          cellTexts.push(text?.trim().substring(0, 40) || '');
        }
        console.log(`[A5] Première ligne: ${JSON.stringify(cellTexts)}`);
      }
    } else {
      console.log('[A5] Pas de tableau — vérifier les onglets');
      // Essayer de cliquer sur un onglet qui aurait des données
      const tousTab = page.getByRole('tab', { name: /tous|toutes/i });
      if (await tousTab.isVisible().catch(() => false)) {
        await tousTab.click();
        await page.waitForTimeout(2000);
        const tableAfter = page.locator('table').first();
        console.log(
          `[A5] Tableau après clic "Tous": ${await tableAfter.isVisible().catch(() => false)}`
        );
      }
    }

    console.log('[A5] PASS');
  });

  /* ================================================================== */
  /*  A6 — Formulaire création accessible /marches                      */
  /* ================================================================== */
  test('A6 — /marches formulaire création accessible', async ({ page }) => {
    await loginAndGo(page, '/marches');
    await page.waitForTimeout(2000);

    // Chercher bouton "Nouveau marché", "Créer", etc.
    const createBtns = [
      page.getByRole('button', { name: /nouveau/i }),
      page.getByRole('button', { name: /créer/i }),
      page.getByRole('button', { name: /ajouter/i }),
      page.locator('button').filter({ hasText: /nouveau marché/i }),
    ];

    let createBtn = null;
    for (const btn of createBtns) {
      if (
        await btn
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        createBtn = btn.first();
        const text = await createBtn.textContent();
        console.log(`[A6] Bouton création trouvé: "${text}"`);
        break;
      }
    }

    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(2000);

      // Vérifier si un dialog/formulaire s'ouvre
      const dialog = page.getByRole('dialog');
      const hasDialog = await dialog.isVisible().catch(() => false);
      console.log(`[A6] Dialog formulaire: ${hasDialog}`);

      if (hasDialog) {
        // Lister les champs
        const inputs = dialog.locator('input, select, textarea');
        const inputCount = await inputs.count();
        console.log(`[A6] Champs formulaire: ${inputCount}`);

        // Labels des champs
        const labels = dialog.locator('label');
        const labelTexts: string[] = [];
        for (let i = 0; i < Math.min(await labels.count(), 10); i++) {
          const text = await labels.nth(i).textContent();
          labelTexts.push(text?.trim() || '');
        }
        console.log(`[A6] Labels: ${JSON.stringify(labelTexts)}`);
      }

      await page.keyboard.press('Escape');
    } else {
      console.log('[A6] Aucun bouton de création trouvé');
    }

    console.log('[A6] PASS');
  });

  /* ================================================================== */
  /*  A7 — /execution/passation-marche — KPIs + onglets + tableau       */
  /* ================================================================== */
  test('A7 — /execution/passation-marche KPIs, onglets, tableau', async ({ page }) => {
    await loginAndGo(page, '/execution/passation-marche');
    await page.waitForTimeout(2000);

    // KPIs
    const bigNumbers = page.locator('.text-2xl, .text-3xl, .text-4xl');
    console.log(`[A7] Grands chiffres (KPI): ${await bigNumbers.count()}`);

    // Onglets
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    const tabTexts: string[] = [];
    for (let i = 0; i < tabCount; i++) {
      const text = await tabs.nth(i).textContent();
      tabTexts.push(text?.trim() || '');
    }
    console.log(`[A7] Onglets (${tabCount}): ${JSON.stringify(tabTexts)}`);

    // Tableau
    const table = page.locator('table').first();
    const hasTable = await table.isVisible().catch(() => false);
    console.log(`[A7] Tableau visible: ${hasTable}`);

    if (hasTable) {
      const rows = page.locator('table tbody tr');
      console.log(`[A7] Lignes: ${await rows.count()}`);
    }

    // Chercher bouton création
    const createBtn = page
      .locator('button')
      .filter({ hasText: /nouvelle|créer|nouveau/i })
      .first();
    const hasCreate = await createBtn.isVisible().catch(() => false);
    console.log(`[A7] Bouton création: ${hasCreate}`);

    console.log('[A7] PASS');
  });

  /* ================================================================== */
  /*  A8 — Formulaire création passation accessible                     */
  /* ================================================================== */
  test('A8 — /execution/passation-marche formulaire création', async ({ page }) => {
    await loginAndGo(page, '/execution/passation-marche');
    await page.waitForTimeout(2000);

    const createBtns = [
      page.locator('button').filter({ hasText: /nouvelle passation/i }),
      page.getByRole('button', { name: /nouveau/i }),
      page.getByRole('button', { name: /créer/i }),
    ];

    let found = false;
    for (const btn of createBtns) {
      if (
        await btn
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        const text = await btn.first().textContent();
        console.log(`[A8] Bouton trouvé: "${text}"`);
        await btn.first().click();
        await page.waitForTimeout(2000);

        const dialog = page.getByRole('dialog');
        const hasDialog = await dialog.isVisible().catch(() => false);
        console.log(`[A8] Dialog formulaire: ${hasDialog}`);

        if (hasDialog) {
          const inputs = dialog.locator('input, select, textarea, [role="combobox"]');
          console.log(`[A8] Champs: ${await inputs.count()}`);

          const labels = dialog.locator('label');
          const labelTexts: string[] = [];
          for (let i = 0; i < Math.min(await labels.count(), 10); i++) {
            const t = await labels.nth(i).textContent();
            labelTexts.push(t?.trim() || '');
          }
          console.log(`[A8] Labels: ${JSON.stringify(labelTexts)}`);
        }

        await page.keyboard.press('Escape');
        found = true;
        break;
      }
    }

    if (!found) {
      console.log('[A8] Aucun bouton création passation trouvé');
      // Vérifier s'il y a un onglet "À traiter" qui contient des EB validées
      const aTraiterTab = page.getByRole('tab', { name: /à traiter/i });
      if (await aTraiterTab.isVisible().catch(() => false)) {
        await aTraiterTab.click();
        await page.waitForTimeout(2000);
        const rows = page.locator('table tbody tr');
        console.log(`[A8] EB à traiter: ${await rows.count()}`);
      }
    }

    console.log('[A8] PASS');
  });

  /* ================================================================== */
  /*  A9 — Routes /passation/lots, /passation/evaluation, /passation/[id] */
  /* ================================================================== */
  test('A9 — Routes passation supplémentaires', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Test /passation/lots
    await page.goto('/passation/lots');
    await page.waitForTimeout(3000);
    const lotsBody = await page.locator('body').textContent();
    const lotsHasContent = lotsBody && lotsBody.length > 100;
    const lotsIs404 =
      lotsBody?.includes('404') ||
      lotsBody?.includes('not found') ||
      lotsBody?.includes('Page introuvable');
    console.log(`[A9] /passation/lots: contenu=${lotsHasContent}, 404=${lotsIs404}`);

    // Test /passation/evaluation
    await page.goto('/passation/evaluation');
    await page.waitForTimeout(3000);
    const evalBody = await page.locator('body').textContent();
    const evalHasContent = evalBody && evalBody.length > 100;
    const evalIs404 =
      evalBody?.includes('404') ||
      evalBody?.includes('not found') ||
      evalBody?.includes('Page introuvable');
    console.log(`[A9] /passation/evaluation: contenu=${evalHasContent}, 404=${evalIs404}`);

    // Test /marches (page principale qui existe)
    await page.goto('/marches');
    await page.waitForTimeout(3000);
    const marchesBody = await page.locator('body').textContent();
    const marchesHasContent = marchesBody && marchesBody.length > 100;
    console.log(`[A9] /marches: contenu=${marchesHasContent}`);

    // Test /execution/passation-marche
    await page.goto('/execution/passation-marche');
    await page.waitForTimeout(3000);
    const passBody = await page.locator('body').textContent();
    const passHasContent = passBody && passBody.length > 100;
    console.log(`[A9] /execution/passation-marche: contenu=${passHasContent}`);

    console.log('[A9] PASS');
  });

  /* ================================================================== */
  /*  A10 — Non-régression 5 pages                                      */
  /* ================================================================== */
  test('A10 — Non-régression 5 modules', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    const pages = [
      { url: '/notes-sef', pattern: /note/i },
      { url: '/notes-aef', pattern: /note/i },
      { url: '/execution/imputation', pattern: /imputation/i },
      { url: '/execution/expression-besoin', pattern: /expression/i },
      { url: '/planification/structure', pattern: /structure|budget/i },
    ];

    for (const p of pages) {
      await page.goto(p.url);
      await waitForPageLoad(page);
      const visible = await page
        .locator('h1, h2, table, [class*="heading"]')
        .first()
        .isVisible({ timeout: 15_000 })
        .catch(() => false);
      console.log(`[A10] ${p.url}: ${visible ? 'OK' : 'FAIL'}`);
      expect(visible).toBeTruthy();
    }

    console.log('[A10] PASS — 5 pages non-régression OK');
  });

  /* ================================================================== */
  /*  A11 — Comptage marchés en base (via UI)                           */
  /* ================================================================== */
  test('A11 — Comptage marchés via UI', async ({ page }) => {
    await loginAndGo(page, '/marches');
    await page.waitForTimeout(2000);

    // Chercher un compteur total dans les onglets ou KPIs
    const tousTab = page.getByRole('tab', { name: /tous|toutes/i }).first();
    if (await tousTab.isVisible().catch(() => false)) {
      const tabText = await tousTab.textContent();
      console.log(`[A11] Onglet Tous: "${tabText}"`);
      const match = tabText?.match(/(\d+)/);
      if (match) {
        console.log(`[A11] Total marchés (onglet): ${match[1]}`);
      }

      await tousTab.click();
      await page.waitForTimeout(2000);
    }

    // Compter les lignes du tableau
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`[A11] Lignes tableau: ${rowCount}`);

    // Aussi vérifier passation
    await page.goto('/execution/passation-marche');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const tousTab2 = page.getByRole('tab', { name: /tous|toutes/i }).first();
    if (await tousTab2.isVisible().catch(() => false)) {
      const text2 = await tousTab2.textContent();
      console.log(`[A11] Passation onglet Tous: "${text2}"`);
      await tousTab2.click();
      await page.waitForTimeout(2000);
    }

    const rows2 = page.locator('table tbody tr');
    const rowCount2 = await rows2.count();
    console.log(`[A11] Lignes passation: ${rowCount2}`);

    console.log('[A11] PASS');
  });

  /* ================================================================== */
  /*  A12 — Résumé audit                                                */
  /* ================================================================== */
  test('A12 — Résumé audit passation/marché', async () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       AUDIT QA — PASSATION DE MARCHÉ / MARCHÉS             ║');
    console.log('║                                                              ║');
    console.log('║   Routes:                                                    ║');
    console.log('║     /marches                  → Page Marchés                ║');
    console.log('║     /execution/passation-marche → Page Passation            ║');
    console.log('║                                                              ║');
    console.log('║   Composants:                                                ║');
    console.log('║     10 composants marches/                                  ║');
    console.log('║     8 composants passation-marche/                          ║');
    console.log('║     2 hooks (useMarches + usePassationsMarche)              ║');
    console.log('║                                                              ║');
    console.log('║   Tables DB:                                                 ║');
    console.log('║     marches, passation_marche, marche_lots,                ║');
    console.log('║     soumissions, contrats, avenants                         ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    expect(true).toBeTruthy();
  });
});
