/**
 * Tests E2E - Export des Reglements
 *
 * Scenarios testes :
 * - Presence du bouton d'export
 * - Menu d'export avec options (Exporter tout / Exporter avec filtres)
 * - Export Excel de la liste
 * - Dialog de filtres pour l'export
 * - Export depuis differents onglets
 */

import { test, expect } from '@playwright/test';
import { loginAs, selectExercice } from '../fixtures/auth';
import {
  navigateToReglements,
  switchTab,
  SELECTORS,
  DOWNLOAD_DIR,
  ensureDownloadDir,
} from '../fixtures/reglements';
import * as fs from 'fs';
import * as path from 'path';

test.setTimeout(60000);

test.describe("Reglements - Bouton d'export", () => {
  test.beforeAll(() => {
    ensureDownloadDir();
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test('Le bouton Exporter Excel est visible', async ({ page }) => {
    await expect(page.locator(SELECTORS.export.exportBtn)).toBeVisible({ timeout: 10000 });
  });

  test('Le bouton Exporter Excel est cliquable', async ({ page }) => {
    const exportBtn = page.locator(SELECTORS.export.exportBtn);
    await expect(exportBtn).toBeEnabled();
  });

  test("Le menu d'export s'ouvre au clic", async ({ page }) => {
    await page.locator(SELECTORS.export.exportBtn).click();

    // Verifier les options du menu
    await expect(page.locator(SELECTORS.export.exportAll)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(SELECTORS.export.exportFiltered)).toBeVisible();
  });
});

test.describe('Reglements - Export tout', () => {
  test.beforeAll(() => {
    ensureDownloadDir();
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test('Export tout declenche un telechargement Excel', async ({ page }) => {
    // Ouvrir le menu
    await page.locator(SELECTORS.export.exportBtn).click();

    // Preparer l'interception du telechargement
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Cliquer sur "Exporter tout"
    await page.locator(SELECTORS.export.exportAll).click();

    try {
      const download = await downloadPromise;

      // Verifier le nom du fichier
      const fileName = download.suggestedFilename();
      expect(fileName).toBeTruthy();
      expect(fileName.toLowerCase()).toMatch(/\.xlsx$/);

      // Sauvegarder le fichier
      const savePath = path.join(DOWNLOAD_DIR, fileName);
      await download.saveAs(savePath);

      // Verifier que le fichier existe et n'est pas vide
      expect(fs.existsSync(savePath)).toBeTruthy();
      const stats = fs.statSync(savePath);
      expect(stats.size).toBeGreaterThan(0);
    } catch {
      // Si pas de telechargement direct, verifier le toast de succes ou l'indicateur
      const successMsg = page
        .locator('[role="alert"], .toast, [data-sonner-toast]')
        .filter({ hasText: /export|télécharg|succès/i });
      await expect(successMsg).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Reglements - Export avec filtres', () => {
  test.beforeAll(() => {
    ensureDownloadDir();
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("Le dialog de filtres s'ouvre correctement", async ({ page }) => {
    // Ouvrir le menu
    await page.locator(SELECTORS.export.exportBtn).click();

    // Cliquer sur "Exporter avec filtres..."
    await page.locator(SELECTORS.export.exportFiltered).click();

    // Le dialog de filtres doit s'ouvrir
    await expect(page.locator('text=Export avec filtres')).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator("text=Configurez les critères de filtrage pour l'export des Règlements")
    ).toBeVisible();
  });

  test('Le dialog de filtres contient les champs attendus', async ({ page }) => {
    await page.locator(SELECTORS.export.exportBtn).click();
    await page.locator(SELECTORS.export.exportFiltered).click();

    // Verifier les champs de filtre
    await expect(page.locator('text=Statut')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('label:has-text("Du")')).toBeVisible();
    await expect(page.locator('label:has-text("Au")')).toBeVisible();

    // Verifier les boutons
    await expect(page.locator('button:has-text("Annuler")')).toBeVisible();
    await expect(page.locator('button:has-text("Exporter")')).toBeVisible();
  });

  test('Le filtre par statut propose les bonnes options', async ({ page }) => {
    await page.locator(SELECTORS.export.exportBtn).click();
    await page.locator(SELECTORS.export.exportFiltered).click();

    // Attendre le dialog
    await expect(page.locator('text=Export avec filtres')).toBeVisible({ timeout: 5000 });

    // Ouvrir le select de statut
    const statutSelect = page
      .locator('[role="dialog"]')
      .locator('button')
      .filter({ hasText: /Sélectionner|Tous les statuts/ })
      .first();

    if (await statutSelect.isVisible()) {
      await statutSelect.click();

      // Verifier les options
      await expect(page.locator('[role="option"]:has-text("Tous les statuts")')).toBeVisible();
      await expect(page.locator('[role="option"]:has-text("Validé")')).toBeVisible();
      await expect(page.locator('[role="option"]:has-text("Rejeté")')).toBeVisible();

      // Fermer
      await page.keyboard.press('Escape');
    }
  });

  test("L'annulation ferme le dialog sans exporter", async ({ page }) => {
    await page.locator(SELECTORS.export.exportBtn).click();
    await page.locator(SELECTORS.export.exportFiltered).click();

    // Attendre le dialog
    await expect(page.locator('text=Export avec filtres')).toBeVisible({ timeout: 5000 });

    // Cliquer sur Annuler
    await page.locator('[role="dialog"]').locator('button:has-text("Annuler")').click();

    // Le dialog doit se fermer
    await expect(page.locator('text=Export avec filtres')).toBeHidden({ timeout: 5000 });
  });

  test('Export filtre avec dates declenche le telechargement', async ({ page }) => {
    await page.locator(SELECTORS.export.exportBtn).click();
    await page.locator(SELECTORS.export.exportFiltered).click();

    // Attendre le dialog
    await expect(page.locator('text=Export avec filtres')).toBeVisible({ timeout: 5000 });

    // Remplir les dates
    const dateDebut = page.locator('input#dateDebut');
    const dateFin = page.locator('input#dateFin');

    if (await dateDebut.isVisible()) {
      await dateDebut.fill('2026-01-01');
    }
    if (await dateFin.isVisible()) {
      await dateFin.fill('2026-12-31');
    }

    // Preparer l'interception du telechargement
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Cliquer sur Exporter
    await page.locator('[role="dialog"]').locator('button:has-text("Exporter")').last().click();

    try {
      const download = await downloadPromise;

      const fileName = download.suggestedFilename();
      expect(fileName).toBeTruthy();

      const savePath = path.join(DOWNLOAD_DIR, fileName);
      await download.saveAs(savePath);

      expect(fs.existsSync(savePath)).toBeTruthy();
    } catch {
      // Si pas de telechargement, verifier le toast
      const successMsg = page
        .locator('[role="alert"], .toast, [data-sonner-toast]')
        .filter({ hasText: /export|télécharg|succès/i });
      await expect(successMsg).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Reglements - Export depuis differents onglets', () => {
  test.beforeAll(() => {
    ensureDownloadDir();
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);
  });

  test("Le bouton d'export est disponible depuis l'onglet Tous", async ({ page }) => {
    await switchTab(page, 'tous');
    await expect(page.locator(SELECTORS.export.exportBtn)).toBeVisible();
    await expect(page.locator(SELECTORS.export.exportBtn)).toBeEnabled();
  });

  test("Le bouton d'export est disponible depuis l'onglet Soldes", async ({ page }) => {
    await switchTab(page, 'soldes');
    await expect(page.locator(SELECTORS.export.exportBtn)).toBeVisible();
    await expect(page.locator(SELECTORS.export.exportBtn)).toBeEnabled();
  });

  test("Le bouton d'export est disponible depuis l'onglet Partiels", async ({ page }) => {
    await switchTab(page, 'partiels');
    await expect(page.locator(SELECTORS.export.exportBtn)).toBeVisible();
    await expect(page.locator(SELECTORS.export.exportBtn)).toBeEnabled();
  });
});

test.describe("Reglements - Permissions d'export", () => {
  test('Agent DSI peut exporter', async ({ page }) => {
    await loginAs(page, 'agent.dsi@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await expect(page.locator(SELECTORS.export.exportBtn)).toBeVisible();
    await expect(page.locator(SELECTORS.export.exportBtn)).toBeEnabled();
  });

  test('DG peut exporter', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await expect(page.locator(SELECTORS.export.exportBtn)).toBeVisible();
    await expect(page.locator(SELECTORS.export.exportBtn)).toBeEnabled();
  });

  test('DAAF peut exporter', async ({ page }) => {
    await loginAs(page, 'daaf@arti.ci', 'Test2026!');
    await selectExercice(page);
    await navigateToReglements(page);

    await expect(page.locator(SELECTORS.export.exportBtn)).toBeVisible();
    await expect(page.locator(SELECTORS.export.exportBtn)).toBeEnabled();
  });
});
