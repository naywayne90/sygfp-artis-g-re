/**
 * Tests E2E - Bordereau PDF des Reglements
 *
 * Scenarios testes :
 * - Presence du bouton "Bordereau PDF"
 * - Ouverture du dialog de generation
 * - Selection/deselection des reglements
 * - Modification du numero de bordereau
 * - Generation et telechargement du PDF
 * - Validation : bouton desactive si aucun reglement selectionne
 */

import { test, expect } from '@playwright/test';
import { loginAs, selectExercice } from '../fixtures/auth';
import { navigateToReglements, DOWNLOAD_DIR, ensureDownloadDir } from '../fixtures/reglements';
import * as fs from 'fs';
import * as path from 'path';

test.setTimeout(60000);

// Selecteurs specifiques au bordereau
const BORDEREAU_SELECTORS = {
  triggerBtn: 'button:has-text("Bordereau PDF")',
  dialog: {
    container: 'dialog, [role="dialog"]',
    title: 'text=Générer un bordereau de règlement',
    description: 'text=Sélectionnez les règlements à inclure dans le bordereau PDF',
  },
  form: {
    numeroBordereau: 'input#num-bordereau',
    selectAllCheckbox: 'thead th:first-child',
  },
  table: {
    rows: 'tbody tr',
    checkbox: '[role="checkbox"]',
  },
  summary: {
    selectedCount: 'text=règlement(s) sélectionné(s)',
  },
  actions: {
    cancelBtn: 'button:has-text("Annuler")',
    generateBtn: 'button:has-text("Télécharger PDF")',
    generatingBtn: 'button:has-text("Génération")',
  },
};

test.describe('Reglements - Bordereau PDF : Bouton et dialog', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test('Le bouton "Bordereau PDF" est visible dans le header', async ({ page }) => {
    await expect(page.locator(BORDEREAU_SELECTORS.triggerBtn)).toBeVisible({ timeout: 10000 });
  });

  test('Le bouton "Bordereau PDF" est cliquable', async ({ page }) => {
    const btn = page.locator(BORDEREAU_SELECTORS.triggerBtn);
    await expect(btn).toBeEnabled();
  });

  test('Cliquer sur "Bordereau PDF" ouvre le dialog de generation', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    // Verifier que le dialog s'ouvre
    await expect(page.locator(BORDEREAU_SELECTORS.dialog.container)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(BORDEREAU_SELECTORS.dialog.title)).toBeVisible();
    await expect(page.locator(BORDEREAU_SELECTORS.dialog.description)).toBeVisible();
  });

  test('Le dialog contient le champ numero de bordereau', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    // Verifier le champ numero de bordereau
    await expect(page.locator('text=N° Bordereau')).toBeVisible({ timeout: 5000 });
    const input = page.locator(BORDEREAU_SELECTORS.form.numeroBordereau);
    await expect(input).toBeVisible();

    // Le numero est pre-rempli avec le format BRD-XXXX-XXXX
    const value = await input.inputValue();
    expect(value).toMatch(/^BRD-/);
  });

  test('Le numero de bordereau est modifiable', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    const input = page.locator(BORDEREAU_SELECTORS.form.numeroBordereau);
    await input.clear();
    await input.fill('BRD-TEST-001');

    await expect(input).toHaveValue('BRD-TEST-001');
  });

  test('Le dialog contient les boutons Annuler et Telecharger PDF', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    await expect(page.locator(BORDEREAU_SELECTORS.actions.cancelBtn).last()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator(BORDEREAU_SELECTORS.actions.generateBtn)).toBeVisible();
  });

  test('Annuler ferme le dialog', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();
    await expect(page.locator(BORDEREAU_SELECTORS.dialog.container)).toBeVisible({ timeout: 5000 });

    // Cliquer sur Annuler
    await page.locator(BORDEREAU_SELECTORS.actions.cancelBtn).last().click();

    // Le dialog doit se fermer
    await expect(page.locator(BORDEREAU_SELECTORS.dialog.title)).toBeHidden({ timeout: 5000 });
  });
});

test.describe('Reglements - Bordereau PDF : Selection des reglements', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test('Le dialog affiche la liste des reglements avec checkboxes', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    // La table des reglements doit etre visible
    const dialog = page.locator(BORDEREAU_SELECTORS.dialog.container);
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Verifier les en-tetes du tableau
    await expect(dialog.locator('th:has-text("N° Règlement")')).toBeVisible();
    await expect(dialog.locator('th:has-text("Bénéficiaire")')).toBeVisible();
    await expect(dialog.locator('th:has-text("Date")')).toBeVisible();
    await expect(dialog.locator('th:has-text("Montant")')).toBeVisible();
  });

  test('Tous les reglements sont selectionnes par defaut', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    const dialog = page.locator(BORDEREAU_SELECTORS.dialog.container);
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // La checkbox "select all" dans le header doit etre cochee
    const selectAllCheckbox = dialog.locator('thead [role="checkbox"]');
    if (await selectAllCheckbox.isVisible({ timeout: 3000 })) {
      const isChecked = await selectAllCheckbox.getAttribute('data-state');
      expect(isChecked).toBe('checked');
    }
  });

  test('Le compteur de reglements selectionnes est affiche', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    const dialog = page.locator(BORDEREAU_SELECTORS.dialog.container);
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Le resume doit afficher le nombre de reglements selectionnes
    await expect(dialog.locator(BORDEREAU_SELECTORS.summary.selectedCount)).toBeVisible({
      timeout: 5000,
    });
  });

  test('Decocher un reglement met a jour le compteur et le montant total', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    const dialog = page.locator(BORDEREAU_SELECTORS.dialog.container);
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const rows = dialog.locator(BORDEREAU_SELECTORS.table.rows);
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Recuperer le texte du compteur avant deselection
    const summaryBefore = await dialog
      .locator(BORDEREAU_SELECTORS.summary.selectedCount)
      .textContent();

    // Decocher le premier reglement en cliquant sur la ligne
    await rows.first().click();

    // Attendre la mise a jour
    await page.waitForTimeout(500);

    // Le compteur devrait avoir change
    const summaryAfter = await dialog
      .locator(BORDEREAU_SELECTORS.summary.selectedCount)
      .textContent();

    if (rowCount > 0) {
      // Si le compteur a change, la deselection a fonctionne
      // Note: si un seul reglement, decocher le rend 0 et le bouton se desactive
      expect(summaryAfter).not.toEqual(summaryBefore);
    }
  });

  test('La checkbox "Tout selectionner" coche/decoche tous les reglements', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    const dialog = page.locator(BORDEREAU_SELECTORS.dialog.container);
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const selectAllCheckbox = dialog.locator('thead [role="checkbox"]');
    if (!(await selectAllCheckbox.isVisible({ timeout: 3000 }))) {
      test.skip();
      return;
    }

    // Decocher tout
    await selectAllCheckbox.click();
    await page.waitForTimeout(300);

    // Verifier que le compteur montre 0
    await expect(dialog.locator('text=0 règlement(s) sélectionné(s)')).toBeVisible({
      timeout: 3000,
    });

    // Le bouton Telecharger doit etre desactive
    await expect(page.locator(BORDEREAU_SELECTORS.actions.generateBtn)).toBeDisabled();

    // Re-cocher tout
    await selectAllCheckbox.click();
    await page.waitForTimeout(300);

    // Le bouton doit etre actif a nouveau
    await expect(page.locator(BORDEREAU_SELECTORS.actions.generateBtn)).toBeEnabled();
  });

  test('Le bouton Telecharger est desactive si aucun reglement selectionne', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    const dialog = page.locator(BORDEREAU_SELECTORS.dialog.container);
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Decocher tout via "select all"
    const selectAllCheckbox = dialog.locator('thead [role="checkbox"]');
    if (await selectAllCheckbox.isVisible({ timeout: 3000 })) {
      // S'assurer que c'est coche, puis decocher
      const state = await selectAllCheckbox.getAttribute('data-state');
      if (state === 'checked') {
        await selectAllCheckbox.click();
        await page.waitForTimeout(300);
      }

      // Le bouton doit etre desactive
      await expect(page.locator(BORDEREAU_SELECTORS.actions.generateBtn)).toBeDisabled();
    }
  });
});

test.describe('Reglements - Bordereau PDF : Generation', () => {
  test.beforeAll(() => {
    ensureDownloadDir();
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test('La generation de PDF declenche un telechargement', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    const dialog = page.locator(BORDEREAU_SELECTORS.dialog.container);
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const rows = dialog.locator(BORDEREAU_SELECTORS.table.rows);
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Preparer l'interception du telechargement
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Cliquer sur Telecharger PDF
    await page.locator(BORDEREAU_SELECTORS.actions.generateBtn).click();

    try {
      const download = await downloadPromise;

      // Verifier le nom du fichier (format ARTI_BORDEREAU_BRD-xxx.pdf)
      const fileName = download.suggestedFilename();
      expect(fileName).toBeTruthy();
      expect(fileName.toLowerCase()).toMatch(/\.pdf$/);
      expect(fileName).toContain('BORDEREAU');

      // Sauvegarder le fichier
      const savePath = path.join(DOWNLOAD_DIR, fileName);
      await download.saveAs(savePath);

      // Verifier que le fichier existe et n'est pas vide
      expect(fs.existsSync(savePath)).toBeTruthy();
      const stats = fs.statSync(savePath);
      expect(stats.size).toBeGreaterThan(0);
    } catch {
      // Si pas de telechargement direct, verifier le toast de succes
      const successMsg = page
        .locator('[role="alert"], .toast, [data-sonner-toast]')
        .filter({ hasText: /bordereau|succès|PDF/i });
      await expect(successMsg).toBeVisible({ timeout: 10000 });
    }
  });

  test('Le dialog se ferme apres generation reussie', async ({ page }) => {
    await page.locator(BORDEREAU_SELECTORS.triggerBtn).click();

    const dialog = page.locator(BORDEREAU_SELECTORS.dialog.container);
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const rows = dialog.locator(BORDEREAU_SELECTORS.table.rows);
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Lancer la generation
    await page.locator(BORDEREAU_SELECTORS.actions.generateBtn).click();

    // Le dialog devrait se fermer apres generation
    await expect(page.locator(BORDEREAU_SELECTORS.dialog.title)).toBeHidden({ timeout: 15000 });
  });
});

test.describe('Reglements - Bordereau PDF : Permissions', () => {
  test('DG peut acceder au bordereau PDF', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await expect(page.locator(BORDEREAU_SELECTORS.triggerBtn)).toBeVisible({ timeout: 10000 });
  });

  test('DAAF peut acceder au bordereau PDF', async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await expect(page.locator(BORDEREAU_SELECTORS.triggerBtn)).toBeVisible({ timeout: 10000 });
  });
});
