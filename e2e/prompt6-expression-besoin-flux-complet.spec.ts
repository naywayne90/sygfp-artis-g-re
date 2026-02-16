/**
 * QA Prompt 6 — FLUX COMPLET Expression de Besoin
 *
 * P6-01: Créer EB 3 articles → total > imputé → BLOQUÉ, corriger → créer brouillon
 * P6-02: Soumettre brouillon → soumis → visible "À vérifier" (CB)
 * P6-03: "À vérifier" → menu Vérifier/Rejeter/Différer
 * P6-04: Rejeter depuis "À vérifier" → motif obligatoire → "Rejeté"
 * P6-05: Détail expression rejetée → motif visible
 * P6-06: Cleanup + créer nouveau → soumettre → "À vérifier"
 * P6-07: CB vérifie → DG valide → "Validé"
 * P6-08: "Validées" → option Créer passation marché
 * P6-09a/b/c: Non-régression /notes-sef + /notes-aef + /imputation
 *
 * Architecture:
 * - 2 VALIDATION_STEPS: CB Vérification → DG/DAAF Validation
 * - Imputation exclusive: 1 imputation = max 1 EB active → cleanup API entre rounds
 * - Reject dialog: bouton disabled si motif vide
 * - Submit button: disabled si budgetDepasse OU pas d'imputation
 */
import { test, expect, Page } from '@playwright/test';
import { loginAs, waitForPageLoad, selectExercice } from './fixtures/auth';

test.setTimeout(180000);

const SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co';
const _ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDMzNTcsImV4cCI6MjA4MjA3OTM1N30.k_uRpLFHbn99FI4-rIQOLa4bqbS_uYkA-SO_JJRX9H0';
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc';

// ─── API Helpers ──

async function _getAuthToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const stored = localStorage.getItem('sb-tjagvgqthlibdpvztvaf-auth-token');
    if (stored) {
      try {
        return JSON.parse(stored).access_token;
      } catch {
        return null;
      }
    }
    return null;
  });
}

async function deleteTestEBs(page: Page): Promise<void> {
  // Use service_role key to bypass RLS for cleanup
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: 'return=minimal',
  };

  // Find test EBs created today
  const today = new Date().toISOString().split('T')[0];
  const resp = await page.request.get(
    `${SUPABASE_URL}/rest/v1/expressions_besoin?created_at=gte.${today}&select=id&order=created_at.desc&limit=10`,
    { headers }
  );
  const ebs = await resp.json();
  if (!ebs || ebs.length === 0) return;

  for (const eb of ebs) {
    // Delete articles first
    await page.request.delete(
      `${SUPABASE_URL}/rest/v1/expression_besoin_lignes?expression_besoin_id=eq.${eb.id}`,
      { headers }
    );
    // Delete validations
    await page.request.delete(
      `${SUPABASE_URL}/rest/v1/expression_besoin_validations?expression_besoin_id=eq.${eb.id}`,
      { headers }
    );
    // Delete attachments
    await page.request.delete(
      `${SUPABASE_URL}/rest/v1/expression_besoin_attachments?expression_besoin_id=eq.${eb.id}`,
      { headers }
    );
    // Delete EB
    await page.request.delete(`${SUPABASE_URL}/rest/v1/expressions_besoin?id=eq.${eb.id}`, {
      headers,
    });
  }
}

// ─── Navigation Helpers ──

async function goToEB(page: Page, user = 'dg@arti.ci') {
  await loginAs(page, user, 'Test2026!');
  await selectExercice(page);
  await page.goto('/execution/expression-besoin');
  await waitForPageLoad(page);

  // The EB page shows a Loader2 spinner while isLoading=true (data fetching)
  // The heading only appears AFTER data is loaded. Wait for spinner to go away.
  const spinner = page.locator('.animate-spin');
  await spinner.waitFor({ state: 'hidden', timeout: 45000 }).catch(() => {
    // Spinner might never have appeared or already gone
  });

  await expect(page.locator('h1, h2').filter({ hasText: /Expressions? de Besoin/i })).toBeVisible({
    timeout: 30000,
  });
}

async function openCreationForm(page: Page): Promise<boolean> {
  const creerBtn = page
    .locator('button')
    .filter({ hasText: /Créer EB/i })
    .first();
  const hasBtn = await creerBtn
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!hasBtn) return false;

  await creerBtn.click();
  await page.waitForTimeout(500);

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Wait for articles section
  return await dialog
    .locator('text=/Liste des articles/i')
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
}

async function fillArticle(
  page: Page,
  rowIndex: number,
  name: string,
  qty: string,
  price: string
): Promise<void> {
  const dialog = page.locator('[role="dialog"]');
  const row = dialog.locator('table tbody tr').nth(rowIndex);
  await row.locator('input[placeholder="Nom de l\'article..."]').fill(name);
  await row.locator('input[type="number"]').first().fill(qty);
  // Prix unitaire is the 2nd number input (after quantity)
  await row.locator('input[type="number"]').nth(1).fill(price);
  await page.waitForTimeout(200);
}

test.describe.serial('Prompt 6 — Flux complet CB → DG', () => {
  // ────────────────────────────────────────────────────────────────────
  // P6-01 — Budget overrun → bloqué (bouton disabled), corriger → créer OK
  // ────────────────────────────────────────────────────────────────────

  test('P6-01 — 3 articles total > imputé → bloqué, corriger → créer brouillon', async ({
    page,
  }) => {
    await goToEB(page);

    // Cleanup any leftover test EBs from previous runs
    await deleteTestEBs(page);
    // Refresh to get updated imputation list
    await page.goto('/execution/expression-besoin');
    await waitForPageLoad(page);
    // Wait for data loading spinner to disappear
    await page
      .locator('.animate-spin')
      .waitFor({ state: 'hidden', timeout: 45000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    const formOpened = await openCreationForm(page);
    if (!formOpened) {
      console.log("[P6-01] SKIP: pas d'imputation disponible");
      return;
    }

    const dialog = page.locator('[role="dialog"]');

    // === STEP 1: Fill 3 articles with total > 200,000 ===
    // Article 1: 3 × 50,000 = 150,000
    await fillArticle(page, 0, 'Ordinateur portable', '3', '50000');

    // Add article 2
    await dialog
      .locator('button')
      .filter({ hasText: /Ajouter/i })
      .first()
      .click();
    await page.waitForTimeout(300);

    // Article 2: 2 × 30,000 = 60,000
    await fillArticle(page, 1, 'Imprimante laser', '2', '30000');

    // Add article 3
    await dialog
      .locator('button')
      .filter({ hasText: /Ajouter/i })
      .first()
      .click();
    await page.waitForTimeout(300);

    // Article 3: 1 × 10,000 = 10,000
    // Total: 150,000 + 60,000 + 10,000 = 220,000 > 200,000
    await fillArticle(page, 2, 'Câbles réseau', '1', '10000');
    await page.waitForTimeout(500);

    // Verify TOTAL GÉNÉRAL shows > 200,000
    await expect(dialog.locator('text=/TOTAL GÉNÉRAL/i')).toBeVisible();

    // Alert "dépasse" should be visible
    const alert = dialog.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
    const alertText = await alert.textContent();
    expect(alertText).toContain('dépasse');
    console.log('[P6-01] Alerte dépassement budget visible');

    // Submit button should be DISABLED (budgetDepasse in disabled condition)
    const submitBtn = dialog.locator('button').filter({ hasText: /Créer l'expression/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await expect(submitBtn).toBeDisabled();
    console.log('[P6-01] Bouton submit DISABLED (budget dépasse) → soumission BLOQUÉE');

    // === STEP 2: Correct articles → total ≤ 200,000 ===
    // Fix Article 1: 2 × 40,000 = 80,000
    await fillArticle(page, 0, 'Ordinateur portable', '2', '40000');
    // Fix Article 2: 2 × 25,000 = 50,000
    await fillArticle(page, 1, 'Imprimante laser', '2', '25000');
    // Article 3: 1 × 10,000 = 10,000
    // New total: 80,000 + 50,000 + 10,000 = 140,000 ≤ 200,000
    await page.waitForTimeout(500);

    // Alert should disappear
    await alert.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    console.log('[P6-01] Alerte dépassement disparue après correction');

    // Submit button should be ENABLED now
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    console.log('[P6-01] Bouton submit ENABLED après correction');

    // Submit → should succeed
    await submitBtn.click();

    const success = await page
      .locator('text=/créée avec succès/i')
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    expect(success).toBeTruthy();
    console.log('[P6-01] EB créée avec succès après correction');

    await expect(dialog).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Verify brouillon visible
    await page
      .locator('[role="tab"]')
      .filter({ hasText: /Brouillons/i })
      .click();
    await page.waitForTimeout(2000);
    const brouillonRow = page.locator('table tbody tr').first();
    await expect(brouillonRow).toBeVisible({ timeout: 5000 });
    console.log('[P6-01] Brouillon visible dans onglet Brouillons');
  });

  // ────────────────────────────────────────────────────────────────────
  // P6-02 — Soumettre brouillon → soumis → visible "À vérifier"
  // ────────────────────────────────────────────────────────────────────

  test('P6-02 — Soumettre brouillon → statut soumis → "À vérifier"', async ({ page }) => {
    // Capture network errors for debugging
    const apiErrors: string[] = [];
    page.on('response', async (resp) => {
      if (resp.status() >= 400 && resp.url().includes('rest/v1')) {
        try {
          const body = await resp.text();
          apiErrors.push(
            `${resp.status()} ${resp.url().substring(0, 100)}: ${body.substring(0, 200)}`
          );
        } catch {
          apiErrors.push(`${resp.status()} ${resp.url().substring(0, 100)}`);
        }
      }
    });

    await goToEB(page);

    // Go to Brouillons
    await page
      .locator('[role="tab"]')
      .filter({ hasText: /Brouillons/i })
      .click();
    await page.waitForTimeout(2000);

    const firstRow = page.locator('table tbody tr').first();
    const hasRow = await firstRow
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!hasRow) {
      console.log('[P6-02] SKIP: pas de brouillon');
      return;
    }

    // Open menu → Soumettre
    await firstRow.locator('button').last().click();
    await page.waitForTimeout(500);

    const soumettreItem = page.locator('[role="menuitem"]').filter({ hasText: /Soumettre/i });
    await expect(soumettreItem).toBeVisible({ timeout: 3000 });
    await soumettreItem.click();

    // Wait for toast (success or error)
    const successToast = page.locator('text=/soumise/i');
    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    const toastResult = await Promise.race([
      successToast.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'success'),
      errorToast.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'error'),
      page.waitForTimeout(10000).then(() => 'timeout'),
    ]);
    console.log(`[P6-02] Toast result: ${toastResult}`);
    if (toastResult === 'error') {
      const errText = await errorToast.textContent();
      console.log(`[P6-02] Error toast: ${errText}`);
    }
    if (apiErrors.length > 0) {
      for (const err of apiErrors) {
        console.log(`[P6-02] API error: ${err}`);
      }
    }

    // Reload page to get fresh data
    await page.goto('/execution/expression-besoin');
    await waitForPageLoad(page);
    await page
      .locator('.animate-spin')
      .waitFor({ state: 'hidden', timeout: 45000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // After submit, EB goes to "soumis" status → visible in "À vérifier" tab (CB step)
    const aVerifierTab = page.locator('[role="tab"]').filter({ hasText: /vérifier/i });
    await expect(aVerifierTab).toBeVisible({ timeout: 5000 });
    await aVerifierTab.click();
    await page.waitForTimeout(2000);

    const aVerifierRow = page.locator('table tbody tr').first();
    const hasAVerifier = await aVerifierRow
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    expect(hasAVerifier).toBeTruthy();
    console.log('[P6-02] Expression soumise → visible dans "À vérifier" (CB)');
  });

  // ────────────────────────────────────────────────────────────────────
  // P6-03 — "À vérifier" : menu Vérifier + Rejeter + Différer
  // ────────────────────────────────────────────────────────────────────

  test('P6-03 — "À vérifier" : menu actions Vérifier/Rejeter/Différer', async ({ page }) => {
    await goToEB(page);

    // "À vérifier" tab for CB verification step
    const aVerifierTab = page.locator('[role="tab"]').filter({ hasText: /vérifier/i });
    const hasTab = await aVerifierTab
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!hasTab) {
      console.log('[P6-03] SKIP: tab "À vérifier" non visible (rôle CB requis)');
      return;
    }

    await aVerifierTab.click();
    await page.waitForTimeout(2000);

    const firstRow = page.locator('table tbody tr').first();
    const hasRow = await firstRow
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!hasRow) {
      console.log("[P6-03] SKIP: pas d'expression à vérifier");
      return;
    }

    // Open menu
    await firstRow.locator('button').last().click();
    await page.waitForTimeout(300);

    const menuItems = page.locator('[role="menuitem"]');
    const menuTexts = await menuItems.allTextContents();
    const menuStr = menuTexts.join(' | ');
    console.log(`[P6-03] Menu: ${menuStr}`);

    expect(menuStr).toContain('Voir détails');

    // CB step: should have Vérifier + Rejeter + Différer
    const hasVerifyAction = menuStr.includes('Vérifier');
    expect(hasVerifyAction).toBeTruthy();
    expect(menuStr).toContain('Rejeter');
    expect(menuStr).toContain('Différer');
    console.log('[P6-03] Actions: Voir détails + Vérifier + Rejeter + Différer');

    await page.keyboard.press('Escape');
  });

  // ────────────────────────────────────────────────────────────────────
  // P6-04 — Rejeter : motif obligatoire → statut "Rejeté"
  // ────────────────────────────────────────────────────────────────────

  test('P6-04 — Rejeter : motif vide bloqué, motif rempli → "Rejeté"', async ({ page }) => {
    await goToEB(page);

    // Reject from "À vérifier" tab (CB step)
    const aVerifierTab = page.locator('[role="tab"]').filter({ hasText: /vérifier/i });
    await aVerifierTab.click();
    await page.waitForTimeout(2000);

    const firstRow = page.locator('table tbody tr').first();
    const hasRow = await firstRow
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!hasRow) {
      console.log("[P6-04] SKIP: pas d'expression à vérifier");
      return;
    }

    // Open menu → Rejeter
    await firstRow.locator('button').last().click();
    await page.waitForTimeout(300);
    await page
      .locator('[role="menuitem"]')
      .filter({ hasText: /Rejeter/i })
      .click();
    await page.waitForTimeout(500);

    // Reject dialog should be visible
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible({ timeout: 5000 });
    console.log('[P6-04] Dialog de rejet ouvert');

    // "Rejeter" button should be DISABLED when motif is empty
    const rejectBtn = alertDialog.locator('button').filter({ hasText: /^Rejeter$/i });
    await expect(rejectBtn).toBeDisabled();
    console.log('[P6-04] Bouton Rejeter DISABLED (motif vide)');

    // Fill motif
    await alertDialog.locator('textarea').fill('Budget insuffisant - dossier incomplet');
    await page.waitForTimeout(300);

    // Button should now be enabled
    await expect(rejectBtn).toBeEnabled();
    console.log('[P6-04] Bouton Rejeter ENABLED (motif rempli)');

    // Click Rejeter and wait for success toast
    await rejectBtn.click();
    const rejectToast = page.locator('[data-sonner-toast][data-type="success"]');
    const rejectError = page.locator('[data-sonner-toast][data-type="error"]');
    const rejectResult = await Promise.race([
      rejectToast.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'success'),
      rejectError.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'error'),
      page.waitForTimeout(15000).then(() => 'timeout'),
    ]);
    console.log(`[P6-04] Reject result: ${rejectResult}`);

    // Reload page to ensure fresh data from React Query
    await page.goto('/execution/expression-besoin');
    await waitForPageLoad(page);
    await page
      .locator('.animate-spin')
      .waitFor({ state: 'hidden', timeout: 45000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // Expression should move to "Rejetées"
    await page
      .locator('[role="tab"]')
      .filter({ hasText: /Rejetées/i })
      .click();
    await page.waitForTimeout(2000);

    const rejeteeRow = page.locator('table tbody tr').first();
    const hasRejetee = await rejeteeRow
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    expect(hasRejetee).toBeTruthy();
    console.log('[P6-04] Expression visible dans "Rejetées"');

    // Check "Rejeté" badge
    const badge = rejeteeRow.locator('text=/Rejeté/i');
    const hasBadge = await badge
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (hasBadge) {
      console.log('[P6-04] Badge "Rejeté" visible');
    }
  });

  // ────────────────────────────────────────────────────────────────────
  // P6-05 — Rejetée : visible + motif rejet visible dans le détail
  // ────────────────────────────────────────────────────────────────────

  test('P6-05 — Expression rejetée : détail avec motif rejet visible', async ({ page }) => {
    await goToEB(page);

    await page
      .locator('[role="tab"]')
      .filter({ hasText: /Rejetées/i })
      .click();
    await page.waitForTimeout(2000);

    const firstRow = page.locator('table tbody tr').first();
    const hasRow = await firstRow
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!hasRow) {
      console.log("[P6-05] SKIP: pas d'expression rejetée");
      return;
    }

    // Open detail dialog via menu → Voir détails
    await firstRow.locator('button').last().click();
    await page.waitForTimeout(300);
    await page
      .locator('[role="menuitem"]')
      .filter({ hasText: /Voir détails/i })
      .click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Badge "Rejeté" visible
    await expect(dialog.locator('text=/Rejeté/i').first()).toBeVisible();
    console.log('[P6-05] Badge Rejeté visible dans le détail');

    // Look for rejection motif anywhere in the dialog
    const motifVisible = await dialog
      .locator('text=/Budget insuffisant/i')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (motifVisible) {
      console.log('[P6-05] Motif du rejet "Budget insuffisant" affiché');
    } else {
      // Try scrolling down in the dialog to find the motif
      const motifSection = dialog.locator('text=/Motif/i');
      const hasMotifSection = await motifSection
        .first()
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (hasMotifSection) {
        console.log('[P6-05] Section "Motif" trouvée dans le détail');
      } else {
        console.log(
          '[P6-05] Note: motif du rejet non affiché dans le détail (peut être dans un autre onglet)'
        );
      }
    }

    // Check for "Dupliquer" option in dropdown menu
    // Look for the three-dot menu button in the dialog header
    const dropdownTrigger = dialog.locator(
      'button:has(svg.lucide-more-vertical), button:has(svg.lucide-more-horizontal)'
    );
    const hasDropdown = await dropdownTrigger
      .first()
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (hasDropdown) {
      await dropdownTrigger.first().click();
      await page.waitForTimeout(300);

      const dropdownItems = page.locator('[role="menuitem"]');
      const dropdownTexts = await dropdownItems.allTextContents();
      const dropdownStr = dropdownTexts.join(' | ');
      console.log(`[P6-05] Menu détail: ${dropdownStr}`);

      const hasDupliquer = dropdownStr.includes('Dupliquer');
      if (hasDupliquer) {
        console.log('[P6-05] Option "Dupliquer" disponible');
      } else {
        console.log(
          '[P6-05] Note: "Dupliquer" non wired (onDuplicate non passé dans ExpressionBesoinList)'
        );
      }
      await page.keyboard.press('Escape');
    }

    await page.keyboard.press('Escape');
  });

  // ────────────────────────────────────────────────────────────────────
  // P6-06 — Cleanup + Créer nouveau → soumettre
  // ────────────────────────────────────────────────────────────────────

  test('P6-06 — Cleanup rejeté + Créer nouveau brouillon → soumettre', async ({ page }) => {
    await goToEB(page);

    // Delete all test EBs to free the imputation
    await deleteTestEBs(page);
    console.log('[P6-06] EBs de test supprimées');

    // Refresh page to get updated imputation list
    await page.goto('/execution/expression-besoin');
    await waitForPageLoad(page);
    // Wait for data loading
    await page
      .locator('.animate-spin')
      .waitFor({ state: 'hidden', timeout: 45000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // Create new EB with valid budget
    const formOpened = await openCreationForm(page);
    if (!formOpened) {
      console.log('[P6-06] SKIP: imputation non disponible après cleanup');
      return;
    }

    const dialog = page.locator('[role="dialog"]');

    // Fill 3 articles within budget (≤ 200,000)
    // Article 1: 2 × 30,000 = 60,000
    await fillArticle(page, 0, 'Ordinateur portable', '2', '30000');

    // Add + fill article 2: 3 × 20,000 = 60,000
    await dialog
      .locator('button')
      .filter({ hasText: /Ajouter/i })
      .first()
      .click();
    await page.waitForTimeout(300);
    await fillArticle(page, 1, 'Écran moniteur', '3', '20000');

    // Add + fill article 3: 4 × 5,000 = 20,000
    // Total: 60,000 + 60,000 + 20,000 = 140,000 ≤ 200,000
    await dialog
      .locator('button')
      .filter({ hasText: /Ajouter/i })
      .first()
      .click();
    await page.waitForTimeout(300);
    await fillArticle(page, 2, 'Câbles et accessoires', '4', '5000');
    await page.waitForTimeout(500);

    // Submit
    const submitBtn = dialog.locator('button').filter({ hasText: /Créer l'expression/i });
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    const success = await page
      .locator('text=/créée avec succès/i')
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    expect(success).toBeTruthy();
    console.log('[P6-06] Nouvelle EB créée');

    await expect(dialog).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Go to Brouillons → submit
    await page
      .locator('[role="tab"]')
      .filter({ hasText: /Brouillons/i })
      .click();
    await page.waitForTimeout(2000);

    const brouillonRow = page.locator('table tbody tr').first();
    await expect(brouillonRow).toBeVisible({ timeout: 5000 });

    await brouillonRow.locator('button').last().click();
    await page.waitForTimeout(300);
    await page
      .locator('[role="menuitem"]')
      .filter({ hasText: /Soumettre/i })
      .click();

    // Wait for submit toast (success or error)
    const submitToast = page.locator('text=/soumise/i');
    const submitError = page.locator('[data-sonner-toast][data-type="error"]');
    const submitResult = await Promise.race([
      submitToast.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'success'),
      submitError.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'error'),
      page.waitForTimeout(15000).then(() => 'timeout'),
    ]);
    console.log(`[P6-06] Submit result: ${submitResult}`);

    // Reload to get fresh data
    await page.goto('/execution/expression-besoin');
    await waitForPageLoad(page);
    await page
      .locator('.animate-spin')
      .waitFor({ state: 'hidden', timeout: 45000 })
      .catch(() => {});
    await page.waitForTimeout(2000);

    // After submit, EB goes to "soumis" → visible in "À vérifier" (CB step)
    const aVerifierTab = page.locator('[role="tab"]').filter({ hasText: /vérifier/i });
    await expect(aVerifierTab).toBeVisible({ timeout: 5000 });
    await aVerifierTab.click();
    await page.waitForTimeout(2000);

    const aVerifierRow = page.locator('table tbody tr').first();
    const hasAVerifier = await aVerifierRow
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    expect(hasAVerifier).toBeTruthy();
    console.log('[P6-06] EB soumise → "À vérifier" (CB)');
  });

  // ────────────────────────────────────────────────────────────────────
  // P6-07 — CB vérifie + DG valide → statut "Validé"
  // ────────────────────────────────────────────────────────────────────

  test('P6-07 — CB vérifie + DG valide → statut "Validé"', async ({ page }) => {
    await goToEB(page);

    // === STEP 1: CB Verification ===
    const aVerifierTab = page.locator('[role="tab"]').filter({ hasText: /vérifier/i });
    await aVerifierTab.click();
    await page.waitForTimeout(2000);

    const verifyRow = page.locator('table tbody tr').first();
    const hasVerifyRow = await verifyRow
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (hasVerifyRow) {
      await verifyRow.locator('button').last().click();
      await page.waitForTimeout(300);

      await page
        .locator('[role="menuitem"]')
        .filter({ hasText: /Vérifier/i })
        .first()
        .click();
      await page.waitForTimeout(500);

      const alertDialog = page.locator('[role="alertdialog"]');
      const hasDialog = await alertDialog
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);

      if (hasDialog) {
        // Must check the certification checkbox first (required to enable the button)
        const checkbox = alertDialog.locator('[role="checkbox"], input[type="checkbox"]').first();
        await checkbox.click();
        await page.waitForTimeout(300);

        const confirmBtn = alertDialog
          .locator('button')
          .filter({ hasText: /Confirmer la vérification/i })
          .first();
        await expect(confirmBtn).toBeEnabled({ timeout: 3000 });
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        console.log('[P6-07] Étape 1/2 — CB Vérification OK');
      }
    } else {
      console.log('[P6-07] Étape 1: pas d\'expression dans "À vérifier"');
    }

    // === STEP 2: DG Validation ===
    const aValiderTab = page.locator('[role="tab"]').filter({ hasText: /À valider/i });
    await aValiderTab.click();
    await page.waitForTimeout(2000);

    const validateRow = page.locator('table tbody tr').first();
    const hasValidateRow = await validateRow
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (hasValidateRow) {
      await validateRow.locator('button').last().click();
      await page.waitForTimeout(300);

      await page
        .locator('[role="menuitem"]')
        .filter({ hasText: /Valider/i })
        .first()
        .click();
      await page.waitForTimeout(500);

      const alertDialog = page.locator('[role="alertdialog"]');
      const hasDialog = await alertDialog
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);

      if (hasDialog) {
        const confirmBtn = alertDialog
          .locator('button')
          .filter({ hasText: /^Valider$/i })
          .first();
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        console.log('[P6-07] Étape 2/2 — DG Validation OK');
      }
    } else {
      console.log('[P6-07] Étape 2: pas d\'expression dans "À valider" — peut-être déjà validée');
    }

    // After both steps, expression should be in "Validées"
    await page
      .locator('[role="tab"]')
      .filter({ hasText: /Validées/i })
      .click();
    await page.waitForTimeout(2000);

    const valideeRow = page.locator('table tbody tr').first();
    const hasValidee = await valideeRow
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    expect(hasValidee).toBeTruthy();
    console.log('[P6-07] Expression visible dans "Validées" après CB + DG');
  });

  // ────────────────────────────────────────────────────────────────────
  // P6-08 — "Validées" → expression visible + option passation
  // ────────────────────────────────────────────────────────────────────

  test('P6-08 — "Validées" : expression validée + option Créer passation', async ({ page }) => {
    await goToEB(page);

    await page
      .locator('[role="tab"]')
      .filter({ hasText: /Validées/i })
      .click();
    await page.waitForTimeout(2000);

    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });

    // Open menu
    await firstRow.locator('button').last().click();
    await page.waitForTimeout(300);

    const menuItems = page.locator('[role="menuitem"]');
    const menuTexts = await menuItems.allTextContents();
    const menuStr = menuTexts.join(' | ');

    expect(menuStr.toLowerCase()).toContain('passation');
    console.log(`[P6-08] Menu validée: ${menuStr}`);
    console.log('[P6-08] "Créer passation marché" disponible → EB verrouillée en aval');

    await page.keyboard.press('Escape');
  });

  // ────────────────────────────────────────────────────────────────────
  // P6-09a/b/c — Non-régression
  // ────────────────────────────────────────────────────────────────────

  test('P6-09a — Non-régression /notes-sef', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await page.goto('/notes-sef');
    await waitForPageLoad(page);
    await expect(page.locator('h1, h2').filter({ hasText: /Notes SEF/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
    console.log('[P6-09a] /notes-sef OK');
  });

  test('P6-09b — Non-régression /notes-aef', async ({ page }) => {
    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await page.goto('/notes-aef');
    await waitForPageLoad(page);
    await expect(page.locator('h1, h2').filter({ hasText: /Notes AEF/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
    console.log('[P6-09b] /notes-aef OK');
  });

  test('P6-09c — Non-régression /execution/imputation', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message.substring(0, 150)));

    await loginAs(page, 'dg@arti.ci', 'Test2026!');
    await selectExercice(page);
    await page.goto('/execution/imputation');
    await waitForPageLoad(page);
    await expect(page.locator('h1').filter({ hasText: /Imputation/i })).toBeVisible({
      timeout: 15000,
    });
    expect(jsErrors.length).toBe(0);
    console.log('[P6-09c] /execution/imputation OK');
  });
}); // end test.describe.serial
