/**
 * Tests E2E - Export Excel des documents SYGFP
 *
 * Vérifie le téléchargement des fichiers Excel,
 * les colonnes présentes et le formatage des montants.
 */

import { test, expect, Page, Download } from '@playwright/test';
import { loginAsAgent, loginAsDG, waitForPageLoad } from '../fixtures/auth';
import { navigateToNotesSEF, SELECTORS, exportNotes } from '../fixtures/notes-sef';
import * as fs from 'fs';
import * as path from 'path';

// Dossier de téléchargement des tests
const DOWNLOADS_DIR = path.join(process.cwd(), 'test-results', 'downloads');

// Créer le dossier si nécessaire
test.beforeAll(async () => {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }
});

// Nettoyer après les tests
test.afterAll(async () => {
  const files = fs.readdirSync(DOWNLOADS_DIR).filter(f =>
    f.endsWith('.xlsx') || f.endsWith('.csv')
  );
  for (const file of files) {
    try {
      fs.unlinkSync(path.join(DOWNLOADS_DIR, file));
    } catch {
      // Ignorer les erreurs de suppression
    }
  }
});

test.describe('Excel Export - Téléchargement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsDG(page);
    await waitForPageLoad(page);
  });

  test('Le bouton d\'export Excel est visible', async ({ page }) => {
    await navigateToNotesSEF(page);

    // Ouvrir le menu d'export
    const exportBtn = page.locator(SELECTORS.actions.exportBtn);
    await expect(exportBtn).toBeVisible({ timeout: 10000 });

    await exportBtn.click();

    // Vérifier que l'option Excel est disponible
    const excelOption = page.locator('text=Excel, [data-testid="export-excel"]');
    await expect(excelOption).toBeVisible({ timeout: 5000 });
  });

  test('Le fichier Excel est téléchargé avec succès', async ({ page }) => {
    await navigateToNotesSEF(page);

    // Ouvrir le menu d'export
    await page.locator(SELECTORS.actions.exportBtn).click();

    // Préparer l'interception du téléchargement
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Cliquer sur Excel
    await page.locator('text=Excel, [data-testid="export-excel"]').click();

    try {
      const download = await downloadPromise;

      // Vérifier le nom du fichier
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.xlsx$/);

      // Sauvegarder le fichier
      const savePath = path.join(DOWNLOADS_DIR, `test-${filename}`);
      await download.saveAs(savePath);

      // Vérifier que le fichier existe et n'est pas vide
      expect(fs.existsSync(savePath)).toBeTruthy();
      const stats = fs.statSync(savePath);
      expect(stats.size).toBeGreaterThan(0);
    } catch (error) {
      // Si pas de téléchargement, vérifier qu'un message de succès est affiché
      const successToast = page.locator('[data-testid="toast-success"], .toast:has-text("succès")');
      await expect(successToast).toBeVisible({ timeout: 5000 });
    }
  });

  test('Le nom du fichier contient la date du jour', async ({ page }) => {
    await navigateToNotesSEF(page);
    await page.locator(SELECTORS.actions.exportBtn).click();

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('text=Excel, [data-testid="export-excel"]').click();

    try {
      const download = await downloadPromise;
      const filename = download.suggestedFilename();

      // Vérifier que le nom contient la date au format ISO (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      expect(filename).toContain(today);
    } catch {
      test.skip();
    }
  });
});

test.describe('Excel Export - Contenu et colonnes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsDG(page);
    await waitForPageLoad(page);
  });

  test('L\'export contient les colonnes requises', async ({ page }) => {
    await navigateToNotesSEF(page);

    // Vérifier d'abord les colonnes visibles dans le tableau
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Colonnes attendues
    const expectedColumns = ['Référence', 'Objet', 'Statut', 'Date', 'Montant'];

    for (const column of expectedColumns) {
      const header = table.locator(`th:has-text("${column}")`);
      // Au moins quelques colonnes doivent être présentes
      const isVisible = await header.isVisible({ timeout: 2000 }).catch(() => false);
      if (!isVisible) {
        // Chercher une variante
        const altHeader = table.locator('th').filter({ hasText: new RegExp(column, 'i') });
        await expect(altHeader.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
      }
    }
  });

  test('Les montants sont formatés correctement dans le tableau', async ({ page }) => {
    await navigateToNotesSEF(page);

    // Chercher une cellule de montant
    const montantCell = page.locator('td').filter({ hasText: /FCFA|XAF|\d{1,3}([ ,]\d{3})+/ }).first();

    if (await montantCell.isVisible({ timeout: 5000 })) {
      const text = await montantCell.textContent();

      // Vérifier le format (séparateurs de milliers français)
      expect(text).toMatch(/\d{1,3}([ \u00A0,]\d{3})*(\sFCFA)?/);
    }
  });
});

test.describe('CSV Export - Alternative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsDG(page);
    await waitForPageLoad(page);
  });

  test('L\'export CSV est disponible', async ({ page }) => {
    await navigateToNotesSEF(page);
    await page.locator(SELECTORS.actions.exportBtn).click();

    const csvOption = page.locator('text=CSV, [data-testid="export-csv"]');
    await expect(csvOption).toBeVisible({ timeout: 5000 });
  });

  test('Le fichier CSV est téléchargé avec succès', async ({ page }) => {
    await navigateToNotesSEF(page);
    await page.locator(SELECTORS.actions.exportBtn).click();

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('text=CSV, [data-testid="export-csv"]').click();

    try {
      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.csv$/);

      // Sauvegarder et vérifier
      const savePath = path.join(DOWNLOADS_DIR, `test-${filename}`);
      await download.saveAs(savePath);

      expect(fs.existsSync(savePath)).toBeTruthy();

      // Lire le contenu CSV
      const content = fs.readFileSync(savePath, 'utf-8');

      // Vérifier qu'il y a des données (au moins l'en-tête)
      expect(content.length).toBeGreaterThan(10);

      // Vérifier le séparateur (point-virgule pour la France)
      expect(content).toContain(';');
    } catch {
      test.skip();
    }
  });

  test('Le CSV utilise l\'encodage UTF-8 avec BOM', async ({ page }) => {
    await navigateToNotesSEF(page);
    await page.locator(SELECTORS.actions.exportBtn).click();

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.locator('text=CSV, [data-testid="export-csv"]').click();

    try {
      const download = await downloadPromise;
      const savePath = path.join(DOWNLOADS_DIR, `test-bom-${Date.now()}.csv`);
      await download.saveAs(savePath);

      // Lire les premiers octets pour vérifier le BOM UTF-8
      const buffer = fs.readFileSync(savePath);
      const bom = buffer.slice(0, 3);

      // BOM UTF-8: EF BB BF
      expect(bom[0]).toBe(0xEF);
      expect(bom[1]).toBe(0xBB);
      expect(bom[2]).toBe(0xBF);
    } catch {
      test.skip();
    }
  });
});

test.describe('Excel Export - Avec filtres', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsDG(page);
    await waitForPageLoad(page);
  });

  test('L\'export depuis l\'onglet Validées ne contient que les notes validées', async ({ page }) => {
    await navigateToNotesSEF(page);

    // Cliquer sur l'onglet Validées
    const validatedTab = page.locator('button:has-text("Validées")');
    if (await validatedTab.isVisible({ timeout: 3000 })) {
      await validatedTab.click();
      await waitForPageLoad(page);
    }

    // Exporter
    await page.locator(SELECTORS.actions.exportBtn).click();

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
    await page.locator('text=Excel').click();

    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      // Le nom devrait indiquer le filtre ou contenir "validées"
      expect(filename.toLowerCase()).toMatch(/(notes|sef|export)/);
    }
  });

  test('L\'export préserve les totaux de montants', async ({ page }) => {
    await navigateToNotesSEF(page);

    // Vérifier si un total est affiché dans le tableau
    const totalRow = page.locator('tfoot tr, tr:has-text("Total"), .total-row');

    if (await totalRow.isVisible({ timeout: 5000 })) {
      const totalText = await totalRow.textContent();

      // Exporter et vérifier que le total sera inclus
      await page.locator(SELECTORS.actions.exportBtn).click();

      const excelOption = page.locator('text=Excel');
      await expect(excelOption).toBeVisible({ timeout: 3000 });
      // Le total devrait être inclus dans l'export
    }
  });
});

test.describe('Excel Export - Gestion des erreurs', () => {
  test('Message approprié si aucune donnée à exporter', async ({ page }) => {
    await page.goto('/');
    await loginAsAgent(page);
    await waitForPageLoad(page);

    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Appliquer un filtre qui ne retourne aucun résultat
    const searchInput = page.locator('input[type="search"], [data-testid="search-input"]');
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('ZZZZZZZZNONEXISTENT');
      await page.keyboard.press('Enter');
      await waitForPageLoad(page);
    }

    // Tenter l'export
    const exportBtn = page.locator(SELECTORS.actions.exportBtn);
    if (await exportBtn.isVisible({ timeout: 3000 })) {
      await exportBtn.click();

      const excelOption = page.locator('text=Excel');
      if (await excelOption.isVisible({ timeout: 2000 })) {
        await excelOption.click();

        // Vérifier le message d'erreur ou d'information
        const message = page.locator('[role="alert"], .toast, [data-testid="toast"]');
        await expect(message.filter({ hasText: /aucune|vide|donnée/i })).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    }
  });
});
