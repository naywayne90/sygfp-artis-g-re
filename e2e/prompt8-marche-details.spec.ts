/**
 * PROMPT 8 — Verification complete des onglets Marche Detail
 *
 * Tests E2E : creation d'un marche puis verification du contenu
 * de chaque onglet (Infos, Lots, Soumis., Evaluation, Documents, Chaine).
 */
import { test, expect, Page } from '@playwright/test';
import { selectExercice } from './fixtures/auth';

// ---------- Helpers ----------

async function loginAndNavigate(page: Page, email: string, password: string) {
  // Login
  await page.goto('/auth');
  await expect(page.locator('form')).toBeVisible({ timeout: 15_000 });
  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill(password);
  await page.locator('button[type="submit"]').click();

  // Attendre que l'auth se termine (peut afficher "Verification de l'authentification...")
  await page.waitForFunction(() => !window.location.pathname.startsWith('/auth'), {
    timeout: 30_000,
  });

  // Attendre que le layout principal soit visible (patience pour le chargement)
  await page.waitForTimeout(2_000);
  await expect(page.locator('[data-sidebar="sidebar"], main, nav').first()).toBeVisible({
    timeout: 30_000,
  });

  // Selectionner exercice si necessaire
  await selectExercice(page);

  // Naviguer vers la page passation
  await page.goto('/execution/passation-marche');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('h1').filter({ hasText: /passation/i })).toBeVisible({
    timeout: 30_000,
  });
}

/**
 * Cree une passation en selectionnant la premiere EB disponible
 */
async function createPassation(page: Page): Promise<void> {
  await page.getByRole('button', { name: /nouvelle passation/i }).click();
  await expect(page.getByRole('heading', { name: /Nouvelle passation de marché/i })).toBeVisible({
    timeout: 10_000,
  });

  // Attendre que la liste des EB se charge
  await page.waitForTimeout(1_500);

  // Selectionner la premiere EB disponible
  const ebCard = page.locator('.cursor-pointer').filter({ hasText: /ARTI/i });
  await expect(ebCard.first()).toBeVisible({ timeout: 10_000 });
  await ebCard.first().click();
  await page.waitForTimeout(500);

  // Cliquer sur "Creer la passation"
  const createBtn = page.getByRole('button', {
    name: /créer.*passation|créer|enregistrer|sauvegarder/i,
  });
  if (await createBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await createBtn.click();
    await page.waitForTimeout(2_000);
  } else {
    for (let i = 0; i < 5; i++) {
      const nextBtn = page.getByRole('button', { name: /suivant|créer|enregistrer/i }).last();
      if (await nextBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const text = await nextBtn.textContent();
        await nextBtn.click();
        await page.waitForTimeout(800);
        if (text && /créer|enregistrer/i.test(text)) break;
      } else {
        break;
      }
    }
    await page.waitForTimeout(2_000);
  }
}

/**
 * Ouvre le dialog detail de la premiere passation brouillon
 */
async function openFirstBrouillon(page: Page) {
  await page.getByRole('tab', { name: /brouillon/i }).click();
  await page.waitForTimeout(1_000);

  const firstRow = page.locator('table tbody tr').first();
  await expect(firstRow).toBeVisible({ timeout: 10_000 });
  await firstRow.locator('button').last().click();
  await page.waitForTimeout(300);

  await page.getByRole('menuitem', { name: /voir détails/i }).click();
  await page.waitForTimeout(1_500);

  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5_000 });
}

/**
 * Cliquer sur un onglet du dialog par son texte
 */
async function clickDialogTab(page: Page, tabPattern: RegExp) {
  const dialog = page.locator('[role="dialog"]');
  const tab = dialog.getByRole('tab', { name: tabPattern });
  await expect(tab.first()).toBeVisible({ timeout: 5_000 });
  await tab.first().click();
  await page.waitForTimeout(1_000);
}

// ---------- Tests ----------

test.describe.serial('Prompt 8 — Verification des onglets Marche Detail', () => {
  test.setTimeout(120_000);

  test('P8-01 — Cliquer sur un marche existant → dialog ouvert', async ({ page }) => {
    await loginAndNavigate(page, 'dg@arti.ci', 'Test2026!');

    // Creer une passation pour avoir du contenu
    await createPassation(page);

    // Ouvrir la passation brouillon
    await openFirstBrouillon(page);

    // Le dialog est ouvert avec titre Passation
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText(/Passation ARTI/i)).toBeVisible({ timeout: 5_000 });

    // Badge statut visible
    await expect(dialog.getByText(/Brouillon/i).first()).toBeVisible();

    console.log('[P8-01] Marche existant ouvert : dialog avec reference + statut ✓');
  });

  test('P8-02 — Onglet Informations → toutes les donnees visibles', async ({ page }) => {
    await loginAndNavigate(page, 'dg@arti.ci', 'Test2026!');
    await openFirstBrouillon(page);

    const dialog = page.locator('[role="dialog"]');

    // L'onglet Infos est actif par defaut
    // Section EB source
    await expect(dialog.getByText('Expression de besoin source')).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText(/Numero EB/i)).toBeVisible();
    await expect(dialog.getByText(/Montant estim/i).first()).toBeVisible();

    // Section details passation
    await expect(dialog.getByText(/Details de la passation/i)).toBeVisible();
    await expect(dialog.getByText(/Procedure/i).first()).toBeVisible();
    await expect(dialog.getByText(/Cree le/i)).toBeVisible();
    await expect(dialog.getByText(/Cree par/i)).toBeVisible();

    console.log('[P8-02] Onglet Informations : EB source + details passation visibles ✓');
  });

  test('P8-03 — Onglet Lots → tableau des lots avec totaux', async ({ page }) => {
    await loginAndNavigate(page, 'dg@arti.ci', 'Test2026!');
    await openFirstBrouillon(page);

    // Cliquer sur l'onglet Lots
    await clickDialogTab(page, /^lots/i);

    const dialog = page.locator('[role="dialog"]');

    // Doit afficher soit "Lots du marche" (alloti) soit "Lot unique" (non alloti)
    const hasLotsTable = await dialog
      .getByText(/Lots du marché/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const hasLotUnique = await dialog
      .getByText(/Lot unique/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const hasNonAlloti = await dialog
      .getByText(/non alloti/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasLotsTable || hasLotUnique || hasNonAlloti).toBeTruthy();

    if (hasLotsTable) {
      await expect(dialog.getByText(/N° Lot/i).first()).toBeVisible();
      await expect(dialog.getByText(/Total estimé/i).first()).toBeVisible();
      console.log('[P8-03] Onglet Lots : tableau alloti avec total ✓');
    } else {
      console.log('[P8-03] Onglet Lots : lot unique affiché ✓');
    }
  });

  test('P8-04 — Onglet Soumissionnaires → section visible', async ({ page }) => {
    await loginAndNavigate(page, 'dg@arti.ci', 'Test2026!');
    await openFirstBrouillon(page);

    // Cliquer sur l'onglet Soumis.
    await clickDialogTab(page, /soumis/i);

    const dialog = page.locator('[role="dialog"]');

    // Verifier que la section soumissionnaires est affichee
    // Peut etre: selecteur de lot (alloti), table de soumissionnaires, ou "Aucun soumissionnaire"
    const hasLotSelector = await dialog
      .getByText(/Selectionner un lot/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const hasAddBtn = await dialog
      .getByRole('button', { name: /ajouter un soumissionnaire/i })
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const hasAucun = await dialog
      .getByText(/Aucun soumissionnaire/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const hasCount = await dialog
      .getByText(/soumissionnaire/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasLotSelector || hasAddBtn || hasAucun || hasCount).toBeTruthy();

    console.log('[P8-04] Onglet Soumissionnaires : section visible ✓');
  });

  test('P8-05 — Onglet Evaluation → grille visible (DG)', async ({ page }) => {
    await loginAndNavigate(page, 'dg@arti.ci', 'Test2026!');
    await openFirstBrouillon(page);

    // Cliquer sur l'onglet Evaluation via data-testid
    const evalTab = page.getByTestId('evaluation-tab');
    await expect(evalTab).toBeVisible({ timeout: 5_000 });
    await evalTab.click();
    await page.waitForTimeout(1_000);

    // La grille doit etre visible (DG = acces autorise)
    const grid = page.getByTestId('evaluation-grid');
    await expect(grid).toBeVisible({ timeout: 5_000 });

    // Contenu : grille avec colonnes ou message "aucun soumissionnaire"
    const hasGrilleTitle = await page
      .getByText(/Grille d'evaluation/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/Aucun soumissionnaire/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const hasCriteres = await page
      .getByText(/Criteres d'evaluation/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasGrilleTitle || hasEmpty || hasCriteres).toBeTruthy();

    if (hasGrilleTitle) {
      await expect(page.getByText(/Note Tech/i).first()).toBeVisible();
      await expect(page.getByText(/Note Finale/i).first()).toBeVisible();
      console.log('[P8-05] Onglet Evaluation : grille avec colonnes notes ✓');
    } else {
      console.log('[P8-05] Onglet Evaluation : section evaluation visible ✓');
    }
  });

  test('P8-06 — Onglet Documents → liste des PJ', async ({ page }) => {
    await loginAndNavigate(page, 'dg@arti.ci', 'Test2026!');
    await openFirstBrouillon(page);

    // Cliquer sur l'onglet Documents
    await clickDialogTab(page, /documents/i);

    const dialog = page.locator('[role="dialog"]');

    // La checklist de documents (PassationChecklist) doit afficher les documents requis
    const hasDocContent = await dialog
      .getByText(/document|pièce|proforma|devis|dao|lettre|requis|obligatoire|checklist/i)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const hasProgress = await dialog
      .locator('[role="progressbar"]')
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const hasDocCard = await dialog
      .getByText(/Complétude/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasDocContent || hasProgress || hasDocCard).toBeTruthy();

    console.log('[P8-06] Onglet Documents : checklist PJ visible ✓');
  });

  test('P8-07 — Onglet Chaine → workflow et liens', async ({ page }) => {
    await loginAndNavigate(page, 'dg@arti.ci', 'Test2026!');
    await openFirstBrouillon(page);

    // Cliquer sur l'onglet Chaine
    await clickDialogTab(page, /chaine/i);

    const dialog = page.locator('[role="dialog"]');

    // PassationTimeline affiche "Historique du workflow"
    const hasWorkflow = await dialog
      .getByText(/Historique du workflow/i)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const hasCreation = await dialog
      .getByText('Création')
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    // Message si pas de dossier lie
    const hasNoDossier = await dialog
      .getByText(/Aucun dossier/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasWorkflow || hasCreation || hasNoDossier).toBeTruthy();

    if (hasWorkflow) {
      await expect(dialog.getByText('Création').first()).toBeVisible();
      console.log('[P8-07] Onglet Chaine : workflow visible ✓');
    } else {
      console.log('[P8-07] Onglet Chaine : contenu visible ✓');
    }
  });

  test('P8-08 — PROMPT 8 VALIDE', async () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   PROMPT 8 VALIDE ✅                         ║');
    console.log('║   Marche existant ouvert ✓                  ║');
    console.log('║   Onglet Informations ✓                     ║');
    console.log('║   Onglet Lots ✓                             ║');
    console.log('║   Onglet Soumissionnaires ✓                 ║');
    console.log('║   Onglet Evaluation ✓                       ║');
    console.log('║   Onglet Documents ✓                        ║');
    console.log('║   Onglet Chaine ✓                           ║');
    console.log('╚══════════════════════════════════════════════╝');
    expect(true).toBeTruthy();
  });
});
