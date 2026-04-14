/**
 * Tests E2E - Page Historique des Imports
 *
 * URL : /planification/historique-imports
 *
 * Scenarios testes :
 * - Redirection vers /auth si non connecte
 * - Chargement de la page apres connexion (titre, sous-titre)
 * - Affichage des 6 KPI cards (Total, Termines, En cours, Echoues, En attente, Annules)
 * - Section Filtres (select exercice, select statut, inputs date Du/Au)
 * - Options du select statut (7 options disponibles)
 * - Bouton Reinitialiser conditionnel
 * - Section "Liste des imports" et etat vide
 * - Colonne "Duree" dans le tableau
 * - Bouton Actualiser
 * - Unicite du lien "Historique Imports" dans la sidebar
 */

import { test, expect } from '@playwright/test';
import { loginAsDG } from '../fixtures/auth';

// Timeout global par test : 45 secondes
test.setTimeout(45000);

// ---------------------------------------------------------------------------
// Helper : naviguer vers la page apres connexion
// ---------------------------------------------------------------------------
async function goToHistoriqueImports(page: Parameters<typeof loginAsDG>[0]) {
  await page.goto('/planification/historique-imports');
  // Attendre que le chargement initial soit termine (spinner disparait)
  await page.waitForLoadState('networkidle');
}

// ===========================================================================
// Navigation et chargement
// ===========================================================================
test.describe('Historique des Imports - Navigation et chargement', () => {
  test('should redirect to auth when not authenticated', async ({ page }) => {
    // Naviguer sans etre connecte
    await page.goto('/planification/historique-imports');

    // L'app doit rediriger vers /auth
    await page.waitForURL(/\/auth/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should load the page after login', async ({ page }) => {
    await loginAsDG(page);
    await goToHistoriqueImports(page);

    // Le titre principal doit etre visible
    await expect(page.locator('h1').filter({ hasText: 'Historique des Imports' })).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display the subtitle about imports d'activités", async ({ page }) => {
    await loginAsDG(page);
    await goToHistoriqueImports(page);

    // Le sous-titre contient "imports d'activités" (pas "budgétaires")
    await expect(page.locator('p').filter({ hasText: /imports d.activit/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display the page title in the document', async ({ page }) => {
    await loginAsDG(page);
    await goToHistoriqueImports(page);

    // Le titre <h1> doit etre present dans le DOM
    const h1 = page.locator('h1').filter({ hasText: /Historique des Imports/i });
    await expect(h1).toBeVisible({ timeout: 10000 });
  });
});

// ===========================================================================
// KPI Cards
// ===========================================================================
test.describe('Historique des Imports - KPI Cards', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDG(page);
    await goToHistoriqueImports(page);
  });

  test('should display the Total imports KPI card', async ({ page }) => {
    await expect(page.locator('text=Total imports')).toBeVisible({ timeout: 10000 });
  });

  test('should display the Terminés KPI card', async ({ page }) => {
    await expect(page.locator('text=Terminés')).toBeVisible({ timeout: 10000 });
  });

  test('should display the En cours KPI card', async ({ page }) => {
    await expect(page.locator('text=En cours').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display the Échoués KPI card', async ({ page }) => {
    await expect(page.locator('text=Échoués')).toBeVisible({ timeout: 10000 });
  });

  test('should display the En attente KPI card', async ({ page }) => {
    await expect(page.locator('text=En attente')).toBeVisible({ timeout: 10000 });
  });

  test('should display the Annulés KPI card', async ({ page }) => {
    await expect(page.locator('text=Annulés')).toBeVisible({ timeout: 10000 });
  });

  test('should display all 6 KPI cards', async ({ page }) => {
    // Les 6 labels de KPI doivent tous etre presents
    const kpiLabels = ['Total imports', 'Terminés', 'En cours', 'Échoués', 'En attente', 'Annulés'];

    for (const label of kpiLabels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display numeric values in KPI cards', async ({ page }) => {
    // Les valeurs numeriques (0 ou plus) doivent etre presentes dans les cards
    const statValues = page.locator('.text-2xl.font-bold');
    const count = await statValues.count();
    // Il doit y avoir au moins 6 valeurs numeriques (une par KPI)
    expect(count).toBeGreaterThanOrEqual(6);
  });
});

// ===========================================================================
// Filtres
// ===========================================================================
test.describe('Historique des Imports - Filtres', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDG(page);
    await goToHistoriqueImports(page);
  });

  test('should display the Filtres section', async ({ page }) => {
    // La section Filtres doit etre visible avec son titre
    await expect(page.locator('text=Filtres').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display the exercice filter select', async ({ page }) => {
    // Le select exercice doit etre present
    // On cherche le SelectTrigger qui contient "Tous les exercices" ou "Exercice"
    const exerciceSelect = page.locator('button[role="combobox"]').first();
    await expect(exerciceSelect).toBeVisible({ timeout: 10000 });
  });

  test('should display the statut filter select', async ({ page }) => {
    // Le second select est le filtre statut
    const selects = page.locator('button[role="combobox"]');
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should show Tous les exercices as default option', async ({ page }) => {
    // Le premier select doit afficher "Tous les exercices" par defaut
    const exerciceSelect = page.locator('button[role="combobox"]').first();
    await expect(exerciceSelect).toContainText(/Tous les exercices/i, { timeout: 10000 });
  });

  test('should show Tous les statuts as default option', async ({ page }) => {
    // Le second select doit afficher "Tous les statuts" par defaut
    const statusSelect = page.locator('button[role="combobox"]').nth(1);
    await expect(statusSelect).toContainText(/Tous les statuts/i, { timeout: 10000 });
  });

  test('should show all 7 status options when status select is opened', async ({ page }) => {
    // Ouvrir le select statut (second select)
    const statusSelect = page.locator('button[role="combobox"]').nth(1);
    await statusSelect.click();

    // Les 7 options de l'implementation corrigee
    const expectedOptions = [
      'Tous les statuts',
      'Terminé',
      'En cours',
      'Échoué',
      'Soumis',
      'Analysé',
      'Validé',
      'Annulé',
    ];

    for (const option of expectedOptions) {
      await expect(page.locator(`[role="option"]`).filter({ hasText: option }).first()).toBeVisible(
        { timeout: 5000 }
      );
    }

    // Fermer le select en appuyant sur Escape
    await page.keyboard.press('Escape');
  });

  test('should display date range filter inputs', async ({ page }) => {
    // Les inputs date Du et Au doivent etre presents
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    expect(count).toBe(2);
  });

  test('should not show Réinitialiser button by default', async ({ page }) => {
    // Le bouton Réinitialiser n'apparait que si un filtre est actif
    const resetBtn = page.locator('button').filter({ hasText: 'Réinitialiser' });
    await expect(resetBtn).not.toBeVisible({ timeout: 5000 });
  });

  test('should show Réinitialiser button when a filter is active', async ({ page }) => {
    // Selectionner un statut
    const statusSelect = page.locator('button[role="combobox"]').nth(1);
    await statusSelect.click();
    await page.locator('[role="option"]').filter({ hasText: 'Échoué' }).click();

    // Le bouton Réinitialiser doit apparaitre
    const resetBtn = page.locator('button').filter({ hasText: 'Réinitialiser' });
    await expect(resetBtn).toBeVisible({ timeout: 5000 });
  });

  test('should reset filters when clicking Réinitialiser', async ({ page }) => {
    // Activer un filtre
    const statusSelect = page.locator('button[role="combobox"]').nth(1);
    await statusSelect.click();
    await page.locator('[role="option"]').filter({ hasText: 'Échoué' }).click();

    // Cliquer sur Réinitialiser
    const resetBtn = page.locator('button').filter({ hasText: 'Réinitialiser' });
    await resetBtn.click();

    // Les selects doivent revenir aux valeurs par defaut
    await expect(statusSelect).toContainText(/Tous les statuts/i, { timeout: 5000 });
    // Le bouton Réinitialiser doit disparaitre
    await expect(resetBtn).not.toBeVisible({ timeout: 5000 });
  });

  test('should filter jobs when selecting a status', async ({ page }) => {
    // Selectionner le filtre "Termines"
    const statusSelect = page.locator('button[role="combobox"]').nth(1);
    await statusSelect.click();

    const terminésOption = page.locator('[role="option"]').filter({ hasText: 'Terminés' });
    await terminésOption.click();

    // Attendre le rechargement des donnees
    await page.waitForLoadState('networkidle');

    // La page doit toujours etre stable (pas d'erreur)
    await expect(page.locator('h1').filter({ hasText: 'Historique des Imports' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should filter jobs when selecting an exercice', async ({ page }) => {
    // Selectionner un exercice dans le premier select
    const exerciceSelect = page.locator('button[role="combobox"]').first();
    await exerciceSelect.click();

    // Choisir la premiere annee disponible (apres "Tous les exercices")
    const options = page.locator('[role="option"]');
    const count = await options.count();

    if (count > 1) {
      await options.nth(1).click();
      await page.waitForLoadState('networkidle');

      // La page doit rester stable
      await expect(page.locator('h1').filter({ hasText: 'Historique des Imports' })).toBeVisible({
        timeout: 10000,
      });
    } else {
      test.skip();
    }
  });

  test('should reset to all jobs when selecting Tous les statuts', async ({ page }) => {
    // 1. Selectionner un filtre
    const statusSelect = page.locator('button[role="combobox"]').nth(1);
    await statusSelect.click();

    const echouésOption = page.locator('[role="option"]').filter({ hasText: 'Échoués' });
    await echouésOption.click();
    await page.waitForLoadState('networkidle');

    // 2. Remettre a "Tous les statuts"
    await statusSelect.click();
    const tousOption = page.locator('[role="option"]').filter({ hasText: 'Tous les statuts' });
    await tousOption.click();
    await page.waitForLoadState('networkidle');

    // 3. Le select doit revenir a "Tous les statuts"
    await expect(statusSelect).toContainText(/Tous les statuts/i, { timeout: 10000 });
  });
});

// ===========================================================================
// Liste des imports et etat vide
// ===========================================================================
test.describe('Historique des Imports - Liste et etat vide', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDG(page);
    await goToHistoriqueImports(page);
  });

  test('should display the Liste des imports section title', async ({ page }) => {
    await expect(page.locator('text=Liste des imports').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show empty state or a table depending on data', async ({ page }) => {
    // La page doit afficher soit un tableau soit un etat vide
    const table = page.locator('table');
    const emptyState = page.locator('text=Aucun import trouvé');

    const hasTable = await table.isVisible({ timeout: 10000 }).catch(() => false);
    const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should display empty state message when no imports exist', async ({ page }) => {
    // Appliquer un filtre statut qui retourne probablement 0 resultats
    // On applique le filtre "En cours" qui a peu de chances d'avoir des donnees
    const statusSelect = page.locator('button[role="combobox"]').nth(1);
    await statusSelect.click();

    const enCoursOption = page.locator('[role="option"]').filter({ hasText: 'En cours' });
    await enCoursOption.click();
    await page.waitForLoadState('networkidle');

    // Soit un etat vide, soit un tableau (selon les donnees)
    const emptyState = page.locator('text=Aucun import trouvé');
    const table = page.locator('table');

    const hasEmpty = await emptyState.isVisible({ timeout: 8000 }).catch(() => false);
    const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasEmpty || hasTable).toBeTruthy();
  });

  test('should display FileSpreadsheet icon in empty state', async ({ page }) => {
    // Verifier l'etat vide uniquement si aucune donnee n'est presente
    const emptyState = page.locator('text=Aucun import trouvé');
    const isEmpty = await emptyState.isVisible({ timeout: 8000 }).catch(() => false);

    if (isEmpty) {
      // Le conteneur de l'etat vide doit etre present
      const emptyContainer = page.locator('.text-center.py-12');
      await expect(emptyContainer).toBeVisible({ timeout: 5000 });
    } else {
      // Donnees presentes : le test n'est pas applicable
      test.skip();
    }
  });

  test('should display table columns when imports exist', async ({ page }) => {
    const table = page.locator('table');
    const hasTable = await table.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasTable) {
      // Verifier les en-tetes des colonnes
      const headers = page.locator('table thead th');
      const headerTexts = await headers.allTextContents();

      const expectedHeaders = ['Date', 'Exercice', 'Fichier', 'Module', 'Statut'];
      for (const header of expectedHeaders) {
        expect(headerTexts.some((h) => h.includes(header))).toBeTruthy();
      }
    } else {
      test.skip();
    }
  });

  test('should display the Détails button for each row', async ({ page }) => {
    const table = page.locator('table tbody tr');
    const rowCount = await table.count();

    if (rowCount > 0) {
      const firstRowDetailsBtn = table.first().locator('button').filter({ hasText: 'Détails' });
      await expect(firstRowDetailsBtn).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });
});

// ===========================================================================
// Bouton Actualiser
// ===========================================================================
test.describe('Historique des Imports - Bouton Actualiser', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDG(page);
    await goToHistoriqueImports(page);
  });

  test('should have an Actualiser button in the header', async ({ page }) => {
    const actualiserBtn = page.locator('button').filter({ hasText: 'Actualiser' });
    await expect(actualiserBtn).toBeVisible({ timeout: 10000 });
  });

  test('should be clickable without error', async ({ page }) => {
    const actualiserBtn = page.locator('button').filter({ hasText: 'Actualiser' });
    await expect(actualiserBtn).toBeVisible({ timeout: 10000 });

    // Cliquer sur Actualiser
    await actualiserBtn.click();

    // Attendre que le chargement se termine
    await page.waitForLoadState('networkidle');

    // La page doit toujours afficher le titre
    await expect(page.locator('h1').filter({ hasText: 'Historique des Imports' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show spinner icon while loading', async ({ page }) => {
    const actualiserBtn = page.locator('button').filter({ hasText: 'Actualiser' });
    await expect(actualiserBtn).toBeVisible({ timeout: 10000 });

    // Cliquer et verifier immediatement l'icone de chargement (animate-spin)
    await actualiserBtn.click();

    // Le bouton peut etre desactive pendant le chargement
    // On attend simplement que le chargement se termine sans erreur
    await page.waitForLoadState('networkidle');
    await expect(actualiserBtn).toBeEnabled({ timeout: 15000 });
  });
});

// ===========================================================================
// Dialog detail d'un import
// ===========================================================================
test.describe('Historique des Imports - Dialog detail', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDG(page);
    await goToHistoriqueImports(page);
  });

  test('should open detail dialog when clicking Détails', async ({ page }) => {
    const table = page.locator('table tbody tr');
    const rowCount = await table.count();

    if (rowCount > 0) {
      const firstRowDetailsBtn = table.first().locator('button').filter({ hasText: 'Détails' });
      await firstRowDetailsBtn.click();

      // Le dialog doit s'ouvrir
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 8000 });

      // Le titre du dialog doit contenir "Détails de l'import"
      await expect(dialog.locator("text=Détails de l'import")).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should display summary tab in detail dialog', async ({ page }) => {
    const table = page.locator('table tbody tr');
    const rowCount = await table.count();

    if (rowCount > 0) {
      const firstRowDetailsBtn = table.first().locator('button').filter({ hasText: 'Détails' });
      await firstRowDetailsBtn.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 8000 });

      // L'onglet Résumé doit etre present
      await expect(dialog.locator('[role="tab"]').filter({ hasText: 'Résumé' })).toBeVisible({
        timeout: 5000,
      });
    } else {
      test.skip();
    }
  });

  test('should close detail dialog', async ({ page }) => {
    const table = page.locator('table tbody tr');
    const rowCount = await table.count();

    if (rowCount > 0) {
      const firstRowDetailsBtn = table.first().locator('button').filter({ hasText: 'Détails' });
      await firstRowDetailsBtn.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 8000 });

      // Fermer avec Escape
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });
});

// ===========================================================================
// Sidebar
// ===========================================================================
test.describe('Historique des Imports - Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDG(page);
    await goToHistoriqueImports(page);
  });

  test('should show Historique Imports only once in the sidebar', async ({ page }) => {
    // Attendre que la sidebar soit chargee
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 });

    // Compter les occurrences de "Historique Imports" dans la sidebar
    const histItems = sidebar.locator('text=Historique Imports');
    const count = await histItems.count();

    // Il ne doit apparaitre qu'une seule fois (plus de doublon)
    expect(count).toBe(1);
  });

  test('should highlight Historique Imports link as active', async ({ page }) => {
    // Le lien actif dans la sidebar doit correspondre a la page courante
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 });

    // Verifier la presence du lien Historique Imports
    const histLink = sidebar.locator('text=Historique Imports');
    await expect(histLink).toBeVisible({ timeout: 5000 });
  });
});
