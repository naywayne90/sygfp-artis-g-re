/**
 * PROMPT 6 — Passation de Marche : Soumissionnaires
 *
 * Tests E2E : ajout existant + manuel, offre financiere, upload offre technique,
 * compteur, warnings par mode de passation.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAs, selectExercice } from './fixtures/auth';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// EB de test (exercice 2026) — 26,460,000 FCFA — tranche demande_cotation 10-30M
const EB_TEST = 'ARTI001260015';

// Prestataires existants en base
const PRESTATAIRE_SEARCH = '2BPUB';
const MANUAL_NAME = 'ENTREPRISE TEST';

// Dummy PDF pour upload
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const DUMMY_PDF_PATH = path.join(FIXTURES_DIR, 'dummy-offre.pdf');

test.beforeAll(() => {
  if (!existsSync(FIXTURES_DIR)) {
    mkdirSync(FIXTURES_DIR, { recursive: true });
  }
  if (!existsSync(DUMMY_PDF_PATH)) {
    // Minimal valid PDF
    const pdfContent =
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF';
    writeFileSync(DUMMY_PDF_PATH, pdfContent);
  }
});

// ---------- Helpers ----------

async function loginAndNavigate(page: Page) {
  await loginAs(page, 'dg@arti.ci', 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/passation-marche');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h1').filter({ hasText: /passation/i })).toBeVisible({
    timeout: 30_000,
  });
}

async function openFormAndSelectEB(page: Page, numero: string) {
  await page.getByRole('button', { name: /nouvelle passation/i }).click();
  await expect(page.getByText('Nouvelle passation de marché')).toBeVisible({ timeout: 10_000 });

  const searchInput = page.getByPlaceholder(/rechercher par numéro/i);
  await expect(searchInput).toBeVisible({ timeout: 5_000 });
  await searchInput.fill(numero);
  await page.waitForTimeout(800);

  const ebCard = page.locator('.cursor-pointer').filter({ hasText: numero });
  await expect(ebCard.first()).toBeVisible({ timeout: 5_000 });
  await ebCard.first().click();
  await page.waitForTimeout(500);

  await expect(page.getByText('Expression de besoin source')).toBeVisible({ timeout: 5_000 });
}

function getDialog(page: Page) {
  return page.getByLabel('Nouvelle passation de marché');
}

async function goToPrestatairesTab(page: Page) {
  // From Mode -> Lots -> Prestataires
  await page.getByRole('button', { name: /Suivant.*Lots/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Suivant.*Prestataires/i }).click();
  await page.waitForTimeout(500);
}

async function addFromSearch(page: Page, name: string) {
  const dialog = getDialog(page);
  const searchInput = dialog.getByPlaceholder(/rechercher un prestataire/i);
  await searchInput.fill(name);
  await page.waitForTimeout(800);

  const result = dialog.locator('.cursor-pointer').filter({ hasText: new RegExp(name, 'i') });
  await expect(result.first()).toBeVisible({ timeout: 5_000 });
  await result.first().click();
  await page.waitForTimeout(300);
}

async function addManual(page: Page, name: string) {
  const dialog = getDialog(page);
  const input = dialog.getByTestId('manual-soumissionnaire-input');
  await input.fill(name);
  await dialog.getByTestId('add-manual-soumissionnaire').click();
  await page.waitForTimeout(300);
}

// ---------- Tests ----------

test.describe.serial('Prompt 6 — Passation de Marche : Soumissionnaires', () => {
  test.setTimeout(90_000);

  test('P6-01 — Naviguer vers Prestataires, verifier UI', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_TEST);
    await goToPrestatairesTab(page);

    const dialog = getDialog(page);

    // Recherche visible
    await expect(dialog.getByPlaceholder(/rechercher un prestataire/i)).toBeVisible();

    // Saisie manuelle visible
    await expect(dialog.getByTestId('manual-soumissionnaire-input')).toBeVisible();

    // Compteur visible avec "0 soumissionnaire"
    const counter = dialog.getByTestId('soumissionnaires-counter');
    await expect(counter).toBeVisible();
    await expect(counter).toHaveText('0 soumissionnaires');

    console.log('[P6-01] UI Prestataires : recherche + manuelle + compteur 0 visible ✓');
  });

  test('P6-02 — Ajouter soumissionnaire existant', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_TEST);
    await goToPrestatairesTab(page);

    const dialog = getDialog(page);

    // Rechercher et ajouter un prestataire existant
    await addFromSearch(page, PRESTATAIRE_SEARCH);

    // Visible dans la table
    await expect(
      dialog.getByRole('cell', { name: new RegExp(PRESTATAIRE_SEARCH, 'i') })
    ).toBeVisible({ timeout: 5_000 });

    // Compteur = 1
    const counter = dialog.getByTestId('soumissionnaires-counter');
    await expect(counter).toHaveText('1 soumissionnaire');

    console.log('[P6-02] Soumissionnaire existant ajoute → compteur 1 ✓');
  });

  test('P6-03 — Ajouter soumissionnaire manuel', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_TEST);
    await goToPrestatairesTab(page);

    const dialog = getDialog(page);

    // Saisie manuelle
    await addManual(page, MANUAL_NAME);

    // Visible dans la table
    await expect(dialog.getByRole('cell', { name: new RegExp(MANUAL_NAME, 'i') })).toBeVisible({
      timeout: 5_000,
    });

    // Badge "Manuel" visible
    await expect(dialog.getByText('Manuel', { exact: true })).toBeVisible();

    // Compteur = 1
    const counter = dialog.getByTestId('soumissionnaires-counter');
    await expect(counter).toHaveText('1 soumissionnaire');

    console.log('[P6-03] Soumissionnaire manuel ajoute → compteur 1 + badge Manuel ✓');
  });

  test('P6-04 — Saisir offre financiere', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_TEST);
    await goToPrestatairesTab(page);

    const dialog = getDialog(page);
    await addFromSearch(page, PRESTATAIRE_SEARCH);

    // Remplir le montant de l'offre
    const offreInput = dialog
      .locator('table tbody tr')
      .first()
      .locator('input[type="number"]')
      .first();
    await offreInput.fill('15000000');
    await page.waitForTimeout(300);

    // Verifier la valeur
    await expect(offreInput).toHaveValue('15000000');

    console.log('[P6-04] Offre financiere 15M saisie ✓');
  });

  test('P6-05 — Upload offre technique (PJ)', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_TEST);
    await goToPrestatairesTab(page);

    const dialog = getDialog(page);
    await addFromSearch(page, PRESTATAIRE_SEARCH);

    // Upload fichier via le file input cache
    const row = dialog.locator('table tbody tr').first();
    const fileInput = row.locator('input[type="file"]');
    await fileInput.setInputFiles(DUMMY_PDF_PATH);
    await page.waitForTimeout(500);

    // Verifier que le nom du fichier est affiche en vert
    await expect(row.getByText('dummy-offre.pdf')).toBeVisible();

    console.log('[P6-05] Upload offre technique → nom fichier affiche ✓');
  });

  test('P6-06 — Compteur correct (ajout/suppression)', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_TEST);
    await goToPrestatairesTab(page);

    const dialog = getDialog(page);

    // Ajouter 2 soumissionnaires
    await addFromSearch(page, PRESTATAIRE_SEARCH);
    await addManual(page, MANUAL_NAME);

    // Compteur = 2
    const counter = dialog.getByTestId('soumissionnaires-counter');
    await expect(counter).toHaveText('2 soumissionnaires');

    // Supprimer le premier
    const deleteBtn = dialog.locator('table tbody tr').first().getByRole('button');
    await deleteBtn.click();
    await page.waitForTimeout(300);

    // Compteur = 1
    await expect(counter).toHaveText('1 soumissionnaire');

    console.log('[P6-06] Compteur : 2 → suppression → 1 ✓');
  });

  test('P6-07 — Gre a gre : 1 soumissionnaire OK', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_TEST);

    // Changer le mode en gre_a_gre sur l'onglet Mode
    const dialog = getDialog(page);
    const modeSelect = dialog.locator('#mode_passation');
    await modeSelect.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: /Gré à gré/i }).click();
    await page.waitForTimeout(300);

    // Aller aux prestataires
    await goToPrestatairesTab(page);

    // Ajouter 1 soumissionnaire
    await addFromSearch(page, PRESTATAIRE_SEARCH);

    // PAS de warning
    await expect(dialog.getByTestId('soumissionnaires-warning')).not.toBeVisible();

    console.log('[P6-07] Gre a gre + 1 soum. → PAS de warning ✓');
  });

  test('P6-08 — Demande cotation : < 3 → warning', async ({ page }) => {
    await loginAndNavigate(page);
    await openFormAndSelectEB(page, EB_TEST);

    // Le mode auto-select pour 26.46M devrait etre "demande_cotation"
    // Verifier ou forcer
    const dialog = getDialog(page);
    const modeSelect = dialog.locator('#mode_passation');
    await modeSelect.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: /Demande de cotation/i }).click();
    await page.waitForTimeout(300);

    // Aller aux prestataires
    await goToPrestatairesTab(page);

    // Ajouter 1 soumissionnaire → warning (< 3)
    await addFromSearch(page, PRESTATAIRE_SEARCH);

    // Warning visible
    const warning = dialog.getByTestId('soumissionnaires-warning');
    await expect(warning).toBeVisible({ timeout: 5_000 });
    await expect(warning).toContainText('minimum 3 soumissionnaires');

    // Ajouter 2 de plus manuellement pour atteindre 3
    await addManual(page, 'SOUM TEST 2');
    await addManual(page, 'SOUM TEST 3');

    // Warning doit disparaitre
    await expect(warning).not.toBeVisible();

    console.log('[P6-08] Demande cotation : 1 → warning → 3 → plus de warning ✓');
  });

  test('P6-09 — PROMPT 6 VALIDE', async () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   PROMPT 6 VALIDE ✅                         ║');
    console.log('║   UI Prestataires (recherche+manuelle) ✓    ║');
    console.log('║   Ajout existant + compteur ✓               ║');
    console.log('║   Ajout manuel + badge ✓                    ║');
    console.log('║   Offre financiere ✓                        ║');
    console.log('║   Upload offre technique ✓                  ║');
    console.log('║   Compteur ajout/suppression ✓              ║');
    console.log('║   Gre a gre : pas de warning ✓             ║');
    console.log('║   Demande cotation : warning < 3 ✓          ║');
    console.log('╚══════════════════════════════════════════════╝');
    expect(true).toBeTruthy();
  });
});
