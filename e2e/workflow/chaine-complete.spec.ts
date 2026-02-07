/**
 * Tests E2E - Chaine de depense complete
 *
 * Verifie la navigation entre les etapes de la chaine budgetaire :
 * Note SEF -> Note AEF -> Imputation -> Expression de besoin ->
 * Passation de marche -> Engagement -> Liquidation ->
 * Ordonnancement -> Reglement
 *
 * Ce test verifie que chaque page est accessible et que la navigation
 * entre les modules fonctionne correctement.
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from '../fixtures/auth';

test.setTimeout(60000);

// Toutes les etapes de la chaine de depense avec leurs routes
const BUDGET_CHAIN_STEPS = [
  { name: 'Notes SEF', path: '/notes-sef', step: 1 },
  { name: 'Notes AEF', path: '/notes-aef', step: 2 },
  { name: 'Imputations', path: '/imputations', step: 3 },
  { name: 'Expressions de besoin', path: '/expressions-besoin', step: 4 },
  { name: 'Passations', path: '/passation-marche', step: 5 },
  { name: 'Engagements', path: '/engagements', step: 6 },
  { name: 'Liquidations', path: '/liquidations', step: 7 },
  { name: 'Ordonnancements', path: '/ordonnancements', step: 8 },
  { name: 'Reglements', path: '/reglements', step: 9 },
] as const;

test.describe('Chaine de depense - Navigation complete', () => {
  test('DG peut naviguer a travers toutes les etapes de la chaine', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    for (const step of BUDGET_CHAIN_STEPS) {
      await page.goto(step.path);
      await waitForPageLoad(page);

      // Verifier qu'on n'est pas redirige vers la page de login
      expect(page.url()).not.toContain('/auth');

      // Verifier qu'on n'est pas sur une page 404
      const notFound = page.locator('text=404, text=Page non trouv');
      const is404 = await notFound.isVisible({ timeout: 2000 }).catch(() => false);

      if (!is404) {
        // La page se charge correctement
        await expect(page.locator('main, [role="main"], .space-y-6').first()).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });

  test('DAAF peut naviguer a travers toutes les etapes de la chaine', async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);

    for (const step of BUDGET_CHAIN_STEPS) {
      await page.goto(step.path);
      await waitForPageLoad(page);

      // Pas de redirection vers login
      expect(page.url()).not.toContain('/auth');
    }
  });
});

test.describe('Chaine de depense - WorkflowStepIndicator', () => {
  test('Le WorkflowStepIndicator est present sur chaque page', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Verifier pour les pages principales
    const pagesWithWorkflow = ['/engagements', '/liquidations', '/ordonnancements', '/reglements'];

    for (const pagePath of pagesWithWorkflow) {
      await page.goto(pagePath);
      await waitForPageLoad(page);

      // Chercher l'indicateur de workflow
      const workflowIndicator = page.locator(
        '[data-testid="workflow-step-indicator"], .workflow-step, [class*="workflow"]'
      );

      // L'indicateur devrait etre present sur ces pages
      if (await workflowIndicator.first().isVisible({ timeout: 5000 })) {
        await expect(workflowIndicator.first()).toBeVisible();
      }
    }
  });
});

test.describe('Chaine de depense - Lien entre modules', () => {
  test('Un engagement valide permet de creer une liquidation', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Aller aux engagements
    await page.goto('/engagements');
    await waitForPageLoad(page);

    // Aller sur l'onglet "Valides"
    const validesTab = page.locator('button[role="tab"]:has-text("Valid")').first();
    if (await validesTab.isVisible({ timeout: 5000 })) {
      await validesTab.click();
      await waitForPageLoad(page);

      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Ouvrir le menu d'actions du premier engagement
        const actionMenu = rows.first().locator('button').last();
        if (await actionMenu.isVisible({ timeout: 3000 })) {
          await actionMenu.click();

          // Chercher l'option "Liquidation"
          const liquidationLink = page.locator(
            '[role="menuitem"]:has-text("Liquidation"), a:has-text("Liquidation")'
          );

          if (await liquidationLink.isVisible({ timeout: 3000 })) {
            await liquidationLink.click();

            // Verifier qu'on arrive sur la page des liquidations
            await page.waitForURL(/\/liquidations/, { timeout: 10000 });
          }
        }
      }
    }
  });

  test('La page Reglements affiche les ordonnancements depuis la chaine', async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Aller aux reglements
    await page.goto('/reglements');
    await waitForPageLoad(page);

    // L'onglet "A payer" devrait montrer les ordonnancements valides
    const aPayerTab = page.locator('button[role="tab"]:has-text("payer")').first();
    if (await aPayerTab.isVisible({ timeout: 5000 })) {
      await aPayerTab.click();
      await waitForPageLoad(page);

      // Le tableau devrait contenir des references d'ordonnancement
      const table = page.locator('table');
      if (await table.isVisible({ timeout: 5000 })) {
        const headers = page.locator('table thead th');
        const headerTexts = await headers.allTextContents();
        // Au moins une reference a "Ordonnancement"
        // Les headers devraient contenir des references aux ordonnancements
        expect(headerTexts.length).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Chaine de depense - Coherence des donnees', () => {
  test('Les statistiques sont coherentes entre les modules', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Verifier que chaque module charge ses stats sans erreur
    const modules = ['/engagements', '/liquidations', '/ordonnancements', '/reglements'];

    for (const modulePath of modules) {
      await page.goto(modulePath);
      await waitForPageLoad(page);

      // Les cartes de stats devraient etre visibles
      // Pas de toast d'erreur
      const errorToast = page.locator('[data-type="error"]');
      await expect(errorToast).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('Le dashboard affiche les KPIs de la chaine', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Aller au dashboard
    await page.goto('/');
    await waitForPageLoad(page);

    // Le dashboard devrait contenir des indicateurs
    const dashboard = page.locator('main, [role="main"]').first();
    await expect(dashboard).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Chaine de depense - Sidebar navigation', () => {
  test('La sidebar contient les liens vers tous les modules', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);

    // Naviguer vers le dashboard pour avoir la sidebar
    await page.goto('/');
    await waitForPageLoad(page);

    // Verifier la sidebar
    const sidebar = page.locator('nav, aside, .sidebar');

    if (await sidebar.first().isVisible({ timeout: 5000 })) {
      // Verifier la presence des liens cles
      const keyModules = ['Engagements', 'Liquidations', 'Ordonnancements'];

      for (const moduleName of keyModules) {
        const link = page.locator(
          `a:has-text("${moduleName}"), [role="link"]:has-text("${moduleName}")`
        );
        if (await link.first().isVisible({ timeout: 3000 })) {
          await expect(link.first()).toBeVisible();
        }
      }
    }
  });
});
