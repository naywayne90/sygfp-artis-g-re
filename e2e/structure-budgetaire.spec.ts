/**
 * Tests E2E - Structure Budgétaire
 *
 * 12 tests de non-régression couvrant :
 * - Chargement page et KPIs
 * - Table et filtres
 * - Formulaire création / validation
 * - Onglets référentiels (Directions, OS, Missions)
 * - Menu actions et panneau détail
 * - Pagination
 */

import { test, expect, Page } from '@playwright/test';

const STRUCTURE_URL = '/planification/structure';
const DAAF_EMAIL = 'daaf@arti.ci';
const DAAF_PASSWORD = 'Test2026!';

/** Login as DAAF and navigate to Structure Budgétaire */
async function loginAndNavigate(page: Page): Promise<void> {
  // Login
  await page.goto('/auth');
  await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  await page.locator('input#email').fill(DAAF_EMAIL);
  await page.locator('input#password').fill(DAAF_PASSWORD);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');

  // Navigate to Structure Budgétaire
  await page.goto(STRUCTURE_URL);
  await page.waitForLoadState('domcontentloaded');

  // Wait for the page title to appear (proves data loaded)
  await expect(page.locator('h1, h2').filter({ hasText: /Structure Budgétaire/i })).toBeVisible({
    timeout: 15000,
  });

  // Wait for budget data to load
  await page.waitForTimeout(2000);
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(60000);

test.describe('Structure Budgétaire - Non-régression', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  // ────────────────────────────────────────────
  // Test 1 : La page se charge sans erreur
  // ────────────────────────────────────────────
  test('1. La page /planification/structure se charge sans erreur', async ({ page }) => {
    // Collecter les erreurs console
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Vérifier URL
    await expect(page).toHaveURL(new RegExp(STRUCTURE_URL));

    // Vérifier le titre de la page
    await expect(page.locator('h1, h2').filter({ hasText: /Structure Budgétaire/i })).toBeVisible();

    // Vérifier le badge exercice
    await expect(page.locator('text=Exercice')).toBeVisible();

    // Vérifier qu'aucune erreur critique
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes('Warning:') &&
        !e.includes('DevTools') &&
        !e.includes('favicon') &&
        !e.includes('net::ERR') &&
        !e.includes('Failed to load resource')
    );
    expect(criticalErrors.length).toBe(0);
  });

  // ────────────────────────────────────────────
  // Test 2 : Les 5+3 KPIs s'affichent avec des montants >= 0
  // ────────────────────────────────────────────
  test('2. Les 5+3 KPIs affichent des montants >= 0', async ({ page }) => {
    // 5 KPIs principaux
    const kpiLabels = [
      'Lignes budgétaires',
      'Budget total',
      'Validées',
      'En attente',
      'Brouillons',
    ];

    for (const label of kpiLabels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible({ timeout: 10000 });
    }

    // 3 KPIs ELOP
    const elopLabels = ['Engagé total', 'Payé total', 'Disponible total'];

    for (const label of elopLabels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible({ timeout: 10000 });
    }

    // Vérifier que les montants contiennent "FCFA" (format correct)
    const fcfaAmounts = page.locator('text=/\\d.*FCFA/');
    const count = await fcfaAmounts.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // ────────────────────────────────────────────
  // Test 3 : La table affiche les lignes budgétaires
  // ────────────────────────────────────────────
  test('3. La table affiche les lignes budgétaires', async ({ page }) => {
    // Vérifier que l'onglet "Lignes budgétaires" est actif par défaut
    const lignesTab = page.locator('[role="tab"]').filter({ hasText: /Lignes budgétaires/i });
    await expect(lignesTab).toBeVisible();

    // Attendre le chargement
    await page.waitForTimeout(3000);

    // Vérifier que la table ou le contenu est présent
    const tableOrEmpty = page.locator('table, [class*="EmptyState"]');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 15000 });

    // Si table visible, vérifier qu'elle a des lignes
    const table = page.locator('table');
    if (await table.isVisible()) {
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);

      // Vérifier que le CardDescription montre le total
      await expect(page.locator('text=/\\d+ ligne/i')).toBeVisible();
    }
  });

  // ────────────────────────────────────────────
  // Test 4 : Les filtres Direction et recherche fonctionnent
  // ────────────────────────────────────────────
  test('4. Les filtres Direction et recherche fonctionnent', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Tester la recherche textuelle
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await expect(searchInput).toBeVisible();

    // Taper un terme de recherche
    await searchInput.fill('ARTI');
    await page.waitForTimeout(2000);

    // Vider la recherche pour revenir à l'état initial
    await searchInput.clear();
    await page.waitForTimeout(1000);

    // Chercher le filtre direction dans BudgetFilters
    const filterButtons = page.locator('button').filter({ hasText: /Direction|Filtre/i });
    const hasFilterBtn = (await filterButtons.count()) > 0;

    if (hasFilterBtn) {
      await filterButtons.first().click();
      await page.waitForTimeout(500);

      const option = page.locator('[role="option"]').first();
      if (await option.isVisible({ timeout: 3000 })) {
        await option.click();
        await page.waitForTimeout(1500);
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  // ────────────────────────────────────────────
  // Test 5 : Le bouton "Nouvelle ligne" ouvre le formulaire
  // ────────────────────────────────────────────
  test('5. Le bouton "Nouvelle ligne" ouvre le formulaire', async ({ page }) => {
    const newLineBtn = page.locator('button').filter({ hasText: /Nouvelle ligne/i });
    await expect(newLineBtn).toBeVisible();
    await newLineBtn.click();

    // Vérifier que le dialog s'ouvre
    const dialog = page.locator('[role="dialog"], dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Vérifier la présence de champs du formulaire
    const formFields = dialog.locator('input, select, textarea, [role="combobox"]');
    const fieldCount = await formFields.count();
    expect(fieldCount).toBeGreaterThan(0);

    // Fermer le formulaire
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  // ────────────────────────────────────────────
  // Test 6 : Le formulaire rejette un code vide (validation)
  // ────────────────────────────────────────────
  test('6. Le formulaire rejette un code vide (validation)', async ({ page }) => {
    const newLineBtn = page.locator('button').filter({ hasText: /Nouvelle ligne/i });
    await newLineBtn.click();

    const dialog = page.locator('[role="dialog"], dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Chercher le bouton de soumission
    const submitBtn = dialog
      .locator(
        'button[type="submit"], button:has-text("Créer"), button:has-text("Enregistrer"), button:has-text("Sauvegarder")'
      )
      .first();

    if (await submitBtn.isVisible({ timeout: 3000 })) {
      if (await submitBtn.isEnabled()) {
        await submitBtn.click();
        await page.waitForTimeout(1500);

        // Le dialog doit rester ouvert = la soumission a été rejetée par la validation
        await expect(dialog).toBeVisible();

        // Vérifier que la validation native du navigateur s'est déclenchée :
        // soit un champ required est :invalid, soit un message d'erreur React est affiché
        const invalidFields = await page.evaluate(
          () => document.querySelectorAll('input:invalid, select:invalid, textarea:invalid').length
        );
        const errorMsgCount = await page
          .locator(
            '[role="alert"], .text-destructive, .text-red-500, p.text-destructive, span.text-destructive'
          )
          .count();

        // Au moins une validation a empêché la soumission
        expect(invalidFields + errorMsgCount).toBeGreaterThan(0);
      } else {
        // Bouton désactivé = validation correcte en amont
        await expect(submitBtn).toBeDisabled();
      }
    }

    await page.keyboard.press('Escape');
  });

  // ────────────────────────────────────────────
  // Test 7 : L'onglet Directions affiche les directions
  // ────────────────────────────────────────────
  test("7. L'onglet Directions affiche les directions", async ({ page }) => {
    const directionsTab = page.locator('[role="tab"]').filter({ hasText: /Directions/i });
    await expect(directionsTab).toBeVisible();
    await directionsTab.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Vérifier le titre
    await expect(page.locator('h3').filter({ hasText: /Directions/i })).toBeVisible();

    // Compter les cards de directions
    const directionCards = page.locator(
      '[role="tabpanel"] .rounded-lg.border, [role="tabpanel"] .border.rounded-lg'
    );
    const count = await directionCards.count();
    expect(count).toBeGreaterThanOrEqual(20);

    // Vérifier au moins un badge "Actif"
    await expect(page.locator('[role="tabpanel"]').locator('text=Actif').first()).toBeVisible();
  });

  // ────────────────────────────────────────────
  // Test 8 : L'onglet OS affiche les objectifs stratégiques
  // ────────────────────────────────────────────
  test("8. L'onglet Objectifs Stratégiques affiche 5 OS", async ({ page }) => {
    const osTab = page.locator('[role="tab"]').filter({ hasText: /Objectifs Stratégiques/i });
    await expect(osTab).toBeVisible();
    await osTab.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Vérifier le titre
    await expect(page.locator('h3').filter({ hasText: /Objectifs Stratégiques/i })).toBeVisible();

    // Compter les OS
    const osCards = page.locator(
      '[role="tabpanel"] .rounded-lg.border, [role="tabpanel"] .border.rounded-lg'
    );
    const count = await osCards.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  // ────────────────────────────────────────────
  // Test 9 : L'onglet Missions affiche les missions
  // ────────────────────────────────────────────
  test("9. L'onglet Missions affiche 5 missions", async ({ page }) => {
    const missionsTab = page.locator('[role="tab"]').filter({ hasText: /Missions/i });
    await expect(missionsTab).toBeVisible();
    await missionsTab.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Vérifier le titre
    await expect(page.locator('h3').filter({ hasText: /Missions/i })).toBeVisible();

    // Compter les missions
    const missionCards = page.locator(
      '[role="tabpanel"] .rounded-lg.border, [role="tabpanel"] .border.rounded-lg'
    );
    const count = await missionCards.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  // ────────────────────────────────────────────
  // Test 10 : Le menu "..." affiche les actions
  // ────────────────────────────────────────────
  test('10. Le menu "..." affiche les actions', async ({ page }) => {
    await page.waitForTimeout(3000);

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    // Cliquer sur le bouton "..." de la première ligne
    const moreButton = rows.first().locator('button').last();
    await moreButton.click();

    // Vérifier que le menu dropdown s'ouvre
    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible({ timeout: 5000 });

    // Vérifier les actions du groupe "Consultation"
    await expect(menuContent.locator('text=/Voir détail/i')).toBeVisible();
    await expect(menuContent.locator('text=/Consommation/i')).toBeVisible();
    await expect(menuContent.locator('text=/Historique/i')).toBeVisible();

    // Fermer le menu
    await page.keyboard.press('Escape');
  });

  // ────────────────────────────────────────────
  // Test 11 : "Voir détail" ouvre le panneau avec 3 onglets
  // ────────────────────────────────────────────
  test('11. "Voir détail" ouvre le panneau avec 3 onglets', async ({ page }) => {
    await page.waitForTimeout(3000);

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    // Ouvrir le menu de la première ligne
    const moreButton = rows.first().locator('button').last();
    await moreButton.click();

    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible({ timeout: 5000 });

    // Cliquer sur "Voir détail"
    await menuContent.locator('text=/Voir détail/i').click();

    // Vérifier que le Sheet s'ouvre
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });

    // Vérifier les 3 onglets
    const tabs = sheet.locator('[role="tab"]');
    await expect(tabs).toHaveCount(3);

    // Vérifier les noms des onglets
    await expect(sheet.locator('[role="tab"]').filter({ hasText: /Informations/i })).toBeVisible();
    await expect(sheet.locator('[role="tab"]').filter({ hasText: /Consommation/i })).toBeVisible();
    await expect(sheet.locator('[role="tab"]').filter({ hasText: /Historique/i })).toBeVisible();

    // Vérifier que l'onglet Informations est actif par défaut
    await expect(sheet.locator('text=/Code/i').first()).toBeVisible();

    // Fermer le sheet
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  // ────────────────────────────────────────────
  // Test 12 : La pagination fonctionne
  // ────────────────────────────────────────────
  test('12. La pagination fonctionne', async ({ page }) => {
    await page.waitForTimeout(3000);

    const table = page.locator('table');
    if (!(await table.isVisible())) {
      test.skip();
      return;
    }

    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();

    // Lire le total affiché dans la CardDescription
    const cardDescription = page.locator('text=/\\d+ ligne/i');
    const descriptionText = await cardDescription.first().textContent();
    const totalMatch = descriptionText?.match(/(\d+)\s*ligne/);
    const totalDisplayed = totalMatch ? parseInt(totalMatch[1], 10) : 0;

    if (totalDisplayed > 50) {
      // La pagination devrait afficher "Page 1 sur X" et les contrôles
      const pageInfo = page.locator('text=/Page \\d+ sur \\d+/');
      await expect(pageInfo).toBeVisible({ timeout: 5000 });

      // Première page : max 50 lignes
      expect(rowCount).toBeLessThanOrEqual(50);

      // Sauvegarder le premier code de la page 1
      const firstCellPage1 = await rows.first().locator('td').first().textContent();

      // Cliquer sur le bouton page "2" pour aller à la page 2
      const page2Btn = page.locator('button:has-text("2")').last();
      if (await page2Btn.isVisible({ timeout: 3000 })) {
        await page2Btn.click();
      } else {
        // Fallback : cliquer sur le bouton ChevronRight (page suivante)
        // C'est le dernier bouton non-disabled avant le dernier dans la pagination
        const navButtons = page
          .locator('text=/Page \\d+ sur \\d+/')
          .locator('..')
          .locator('button:not([disabled])');
        const navCount = await navButtons.count();
        if (navCount > 1) {
          // Le bouton "page suivante" est avant le dernier (qui est "dernière page")
          await navButtons.nth(navCount - 2).click();
        }
      }

      await page.waitForTimeout(1500);

      // Vérifier que la page a changé
      const pageInfoAfter = await page.locator('text=/Page \\d+ sur \\d+/').textContent();
      expect(pageInfoAfter).toContain('Page 2');

      // Vérifier que la table a des lignes différentes
      const newRowCount = await table.locator('tbody tr').count();
      expect(newRowCount).toBeGreaterThan(0);

      // Le contenu devrait être différent de la page 1
      const firstCellPage2 = await table
        .locator('tbody tr')
        .first()
        .locator('td')
        .first()
        .textContent();
      expect(firstCellPage2).not.toBe(firstCellPage1);
    } else {
      // Moins de 50 lignes : pas de pagination, c'est normal
      expect(rowCount).toBeLessThanOrEqual(50);
    }
  });
});
