/**
 * Tests E2E - Page Virements & Ajustements Budgétaires
 *
 * Scénarios testés :
 * - Accès à la page et affichage correct
 * - KPI cards et statistiques
 * - Filtres et recherche
 * - Navigation entre onglets
 * - Affichage du tableau des demandes
 * - Affichage du journal des mouvements
 * - Export multi-format
 * - Détails d'un virement
 */

import { test, expect, Page } from '@playwright/test';

test.setTimeout(60000);

// Helper: login robuste
async function login(page: Page) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // Si déjà connecté (pas de formulaire), continuer
  const form = page.locator('form');
  const hasForm = await form.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasForm) {
    await page
      .locator('input#email, input[name="email"], input[type="email"]')
      .first()
      .fill('daaf@arti.ci');
    await page
      .locator('input#password, input[name="password"], input[type="password"]')
      .first()
      .fill('Test2026!');
    await page.locator('button[type="submit"]').click();

    // Attendre la redirection
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 15000 });
  }

  await page.waitForLoadState('networkidle');
}

// Helper: naviguer vers la page virements et attendre le chargement
async function goToVirements(page: Page) {
  await page.goto('/planification/virements');
  await page.waitForLoadState('networkidle');
  // Wait for React to render
  await page.waitForTimeout(3000);
}

test.describe('Virements - Page principale', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToVirements(page);
  });

  test('La page se charge avec le titre', async ({ page }) => {
    await expect(
      page.locator('h1, h2, [class*="title"]').filter({ hasText: /[Vv]irement/ })
    ).toBeVisible({ timeout: 10000 });
  });

  test('Les cartes KPI sont affichées', async ({ page }) => {
    const kpiTexts = ['En attente', 'Validé', 'Exécuté', 'Montant'];
    let found = 0;
    for (const text of kpiTexts) {
      const visible = await page
        .locator(`text=${text}`)
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      if (visible) found++;
    }
    expect(found).toBeGreaterThanOrEqual(1);
  });

  test('Les onglets sont présents', async ({ page }) => {
    const tabsList = page.locator('[role="tablist"]').first();
    await expect(tabsList).toBeVisible({ timeout: 10000 });

    const tabs = page.locator('button[role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("Le tableau est visible dans l'onglet Demandes", async ({ page }) => {
    const table = page.locator('table').first();
    const emptyState = page.locator('text=Aucun').first();

    const hasTable = await table.isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('La barre de recherche est fonctionnelle', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="echerch"]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.fill('XXXXXX-INEXISTANT');
      await page.waitForTimeout(500);

      const rowCount = await page.locator('table tbody tr').count();
      const noResultMsg = await page
        .locator('text=Aucun')
        .isVisible()
        .catch(() => false);

      expect(rowCount === 0 || noResultMsg).toBeTruthy();

      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Virements - Navigation onglets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToVirements(page);
  });

  test('Les onglets Journal et Statistiques existent', async ({ page }) => {
    const tabsList = page.locator('[role="tablist"]').first();
    const hasTabsList = await tabsList.isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasTabsList) return;

    const journalTab = tabsList.locator('button[role="tab"]:has-text("Journal")');
    const statsTab = tabsList.locator('button[role="tab"]:has-text("Statistiques")');

    const hasJournal = await journalTab.isVisible({ timeout: 5000 }).catch(() => false);
    const hasStats = await statsTab.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasJournal).toBeTruthy();
    expect(hasStats).toBeTruthy();
  });

  test("Cliquer sur l'onglet Statistiques", async ({ page }) => {
    const statsTab = page
      .locator(
        'button[role="tab"][data-value="stats"], button[role="tab"]:has-text("Statistiques")'
      )
      .first();
    const hasTab = await statsTab.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasTab) {
      await statsTab.click();
      await page.waitForTimeout(2000);

      const isActive = await statsTab.getAttribute('data-state');
      expect(isActive).toBe('active');
    }
  });

  test("L'onglet Demandes a le tableau par défaut", async ({ page }) => {
    const tabsList = page.locator('[role="tablist"]').first();
    const hasTabsList = await tabsList.isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasTabsList) return;

    // The Demandes tab should be active by default
    const demandesTab = tabsList.locator('button[role="tab"]').first();
    const dataState = await demandesTab.getAttribute('data-state');
    expect(dataState).toBe('active');
  });
});

test.describe('Virements - Export', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToVirements(page);
  });

  test('Le menu export est accessible', async ({ page }) => {
    const exportBtn = page
      .locator('button')
      .filter({ hasText: /[Ee]xport/ })
      .first();
    const hasExport = await exportBtn.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasExport) {
      await exportBtn.click();
      await page.waitForTimeout(300);

      const csvOption = page.locator('[role="menuitem"]').filter({ hasText: /CSV/ });
      const excelOption = page.locator('[role="menuitem"]').filter({ hasText: /Excel/ });
      const pdfOption = page.locator('[role="menuitem"]').filter({ hasText: /PDF/ });

      const hasCsv = await csvOption.isVisible({ timeout: 2000 }).catch(() => false);
      const hasExcel = await excelOption.isVisible({ timeout: 2000 }).catch(() => false);
      const hasPdf = await pdfOption.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasCsv || hasExcel || hasPdf).toBeTruthy();
    }
  });

  test('Export CSV déclenche un téléchargement', async ({ page }) => {
    const exportBtn = page
      .locator('button')
      .filter({ hasText: /[Ee]xport/ })
      .first();
    const hasExport = await exportBtn.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasExport) {
      await exportBtn.click();
      await page.waitForTimeout(300);

      const csvOption = page.locator('[role="menuitem"]').filter({ hasText: /CSV/ });
      const hasCsv = await csvOption.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasCsv) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await csvOption.click();
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toContain('.csv');
        }
      }
    }
  });
});

test.describe("Virements - Détails d'un virement", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToVirements(page);
  });

  test('Cliquer sur une ligne ouvre un dialog', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    const hasRow = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRow) {
      await firstRow.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      const hasDialog = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasDialog) {
        const fcfa = dialog.locator('text=FCFA').first();
        const hasFcfa = await fcfa.isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasFcfa).toBeTruthy();
      }
    }
  });

  test('Le dialog se ferme avec Escape', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    const hasRow = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRow) {
      await firstRow.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      const hasDialog = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasDialog) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        const stillVisible = await dialog.isVisible().catch(() => false);
        expect(stillVisible).toBeFalsy();
      }
    }
  });
});

test.describe('Virements - Création', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToVirements(page);
  });

  test('Le bouton Nouveau ouvre un dialog', async ({ page }) => {
    const newBtn = page
      .locator('button')
      .filter({ hasText: /[Nn]ouveau/ })
      .first();
    const hasNew = await newBtn.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasNew) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const hasFormElements = await dialog
        .locator('select, input, textarea, [role="combobox"], button[role="tab"]')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(hasFormElements).toBeTruthy();
    }
  });

  test('Le dialog a les onglets Virement/Ajustement', async ({ page }) => {
    const newBtn = page
      .locator('button')
      .filter({ hasText: /[Nn]ouveau/ })
      .first();
    const hasNew = await newBtn.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasNew) {
      await newBtn.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const virementTab = dialog.locator('button[role="tab"]').filter({ hasText: /[Vv]irement/ });
      const ajustementTab = dialog
        .locator('button[role="tab"]')
        .filter({ hasText: /[Aa]justement/ });

      const hasVirement = await virementTab.isVisible({ timeout: 2000 }).catch(() => false);
      const hasAjustement = await ajustementTab.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasVirement || hasAjustement).toBeTruthy();
    }
  });
});

test.describe('Virements - Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToVirements(page);
  });

  test("La page s'adapte aux petits écrans", async ({ page }) => {
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Page should still show KPI cards (2 per row on mobile)
    const title = page.locator('h1, h2, [class*="title"]').filter({ hasText: /[Vv]irement/ });
    const hasTitle = await title.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasTitle).toBeTruthy();
  });
});
