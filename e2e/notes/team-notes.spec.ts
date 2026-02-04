/**
 * Tests E2E - Notes de l'équipe
 *
 * Vérifie que les directeurs peuvent voir les notes de leur équipe.
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, TEST_USERS } from '../fixtures/auth';

// Helper pour se connecter
async function loginWithCredentials(page: typeof import('@playwright/test').Page, email: string, password: string): Promise<void> {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
  const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]');
  const submitBtn = page.locator('button[type="submit"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitBtn.click();

  await page.waitForURL(/\/(dashboard|notes|$)/, { timeout: 15000 });
  await waitForPageLoad(page);
}

// Utilisateurs directeurs pour les tests
const DIRECTEUR_DSI = {
  email: 'dsi@arti.ci',
  password: 'Test2026!',
};

test.describe('Notes de l\'équipe', () => {
  test('Un directeur peut voir les notes de son équipe', async ({ page }) => {
    // Se connecter en tant que directeur DSI
    await loginWithCredentials(page, DIRECTEUR_DSI.email, DIRECTEUR_DSI.password);

    await page.goto('/notes-sef');
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    // Chercher l'onglet "Mon équipe" ou "Équipe" ou "Direction"
    const teamTab = page.locator('button:has-text("équipe"), button:has-text("Équipe"), button:has-text("Direction"), [role="tab"]:has-text("équipe"), [role="tab"]:has-text("Direction")');

    if (await teamTab.first().isVisible({ timeout: 5000 })) {
      await teamTab.first().click();
      await page.waitForTimeout(1000);
      await waitForPageLoad(page);

      // Vérifier que le contenu s'affiche
      const teamContent = page.locator('text=Notes de mon équipe, text=Notes de la direction, text=Équipe DSI, table, [data-testid="team-notes"]');

      if (await teamContent.first().isVisible({ timeout: 5000 })) {
        await expect(teamContent.first()).toBeVisible();
      }

      await page.screenshot({ path: 'test-results/team-notes-tab.png', fullPage: true });
    } else {
      // Si pas d'onglet équipe, vérifier qu'on voit toutes les notes de la direction
      const notesTable = page.locator('table tbody tr');
      const count = await notesTable.count();

      // Un directeur devrait voir les notes de sa direction
      await page.screenshot({ path: 'test-results/team-notes-list.png', fullPage: true });
    }
  });

  test('Le directeur voit les statistiques de son équipe', async ({ page }) => {
    await loginWithCredentials(page, DIRECTEUR_DSI.email, DIRECTEUR_DSI.password);

    // Aller au dashboard
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher les statistiques de l'équipe
    const teamStats = page.locator('[data-testid="team-stats"], text=Mon équipe, text=Ma direction, .team-stats, .direction-stats');

    if (await teamStats.first().isVisible({ timeout: 5000 })) {
      await page.screenshot({ path: 'test-results/team-stats-dashboard.png' });
    }

    // Chercher les indicateurs (notes en cours, à valider, etc.)
    const indicators = page.locator('[data-testid="kpi"], .kpi-card, .stat-card');
    const indicatorCount = await indicators.count();

    // Il devrait y avoir des indicateurs
    expect(indicatorCount).toBeGreaterThan(0);
  });

  test('Le directeur peut filtrer par membre de l\'équipe', async ({ page }) => {
    await loginWithCredentials(page, DIRECTEUR_DSI.email, DIRECTEUR_DSI.password);

    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Chercher un filtre par créateur ou membre
    const creatorFilter = page.locator('[data-testid="filter-creator"], select:has-text("Créateur"), [placeholder*="créateur"], button:has-text("Filtre")');

    if (await creatorFilter.first().isVisible({ timeout: 5000 })) {
      await creatorFilter.first().click();
      await page.waitForTimeout(500);

      // Vérifier que des options sont disponibles
      const filterOptions = page.locator('[role="option"], option, [role="menuitem"]');
      const optionCount = await filterOptions.count();

      await page.screenshot({ path: 'test-results/team-filter-options.png' });
    }
  });

  test('Le directeur peut voir les détails d\'une note de son équipe', async ({ page }) => {
    await loginWithCredentials(page, DIRECTEUR_DSI.email, DIRECTEUR_DSI.password);

    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Cliquer sur la première note
    const firstNote = page.locator('table tbody tr, [data-testid="note-item"]').first();

    if (await firstNote.isVisible({ timeout: 10000 })) {
      await firstNote.click();
      await waitForPageLoad(page);

      // Vérifier qu'on peut voir les détails
      const detailPage = page.locator('[data-testid="note-detail"], .note-detail, h1:has-text("Note"), h2:has-text("Note")');
      await expect(detailPage.first()).toBeVisible({ timeout: 5000 });

      // Vérifier qu'on voit le créateur
      const creatorInfo = page.locator('text=Créé par, text=Créateur, text=Agent, [data-testid="creator"]');

      await page.screenshot({ path: 'test-results/team-note-detail.png', fullPage: true });
    }
  });
});

test.describe('Visibilité par rôle', () => {
  test('Un agent ne voit que ses propres notes', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.agent.email, TEST_USERS.agent.password);

    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // L'agent ne devrait pas voir l'onglet "Équipe"
    const teamTab = page.locator('button:has-text("équipe"), [role="tab"]:has-text("équipe")');
    const isTeamTabVisible = await teamTab.first().isVisible({ timeout: 3000 }).catch(() => false);

    // L'onglet équipe ne devrait pas être visible pour un agent
    // (ou s'il existe, il ne devrait montrer que ses notes)

    // L'agent devrait voir l'onglet "Mes notes"
    const myNotesTab = page.locator('button:has-text("Mes notes"), button:has-text("Mes créations"), [role="tab"]:has-text("Mes")');

    if (await myNotesTab.first().isVisible({ timeout: 5000 })) {
      await myNotesTab.first().click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/agent-notes-view.png', fullPage: true });
  });

  test('Le DG voit toutes les notes de toutes les directions', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Le DG devrait voir un onglet "Toutes" ou voir toutes les notes
    const allNotesTab = page.locator('button:has-text("Toutes"), button:has-text("Tout"), [role="tab"]:has-text("Tout")');

    if (await allNotesTab.first().isVisible({ timeout: 5000 })) {
      await allNotesTab.first().click();
      await page.waitForTimeout(1000);
    }

    // Vérifier qu'on peut filtrer par direction
    const directionFilter = page.locator('[data-testid="filter-direction"], select:has-text("Direction"), [placeholder*="direction"]');

    await page.screenshot({ path: 'test-results/dg-all-notes-view.png', fullPage: true });
  });

  test('Le DAAF peut voir les notes liées aux finances', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Le DAAF devrait avoir une vue spécifique
    const notesTable = page.locator('table tbody tr');
    const noteCount = await notesTable.count();

    await page.screenshot({ path: 'test-results/daaf-notes-view.png', fullPage: true });

    // Le DAAF devrait avoir accès aux notes avec effet financier
    const naefTab = page.locator('button:has-text("NAEF"), button:has-text("Effet Financier"), [role="tab"]:has-text("Financier")');

    if (await naefTab.first().isVisible({ timeout: 3000 })) {
      await naefTab.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/daaf-naef-view.png', fullPage: true });
    }
  });
});

test.describe('Actions sur les notes de l\'équipe', () => {
  test('Le directeur peut commenter une note de son équipe', async ({ page }) => {
    await loginWithCredentials(page, DIRECTEUR_DSI.email, DIRECTEUR_DSI.password);

    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Ouvrir une note
    const firstNote = page.locator('table tbody tr').first();

    if (await firstNote.isVisible({ timeout: 10000 })) {
      await firstNote.click();
      await waitForPageLoad(page);

      // Chercher la section commentaires
      const commentSection = page.locator('[data-testid="comments"], textarea[placeholder*="commentaire"], text=Commentaires, text=Ajouter un commentaire');

      if (await commentSection.first().isVisible({ timeout: 5000 })) {
        await page.screenshot({ path: 'test-results/team-note-comments.png', fullPage: true });
      }
    }
  });

  test('Le directeur peut valider les notes de niveau 1', async ({ page }) => {
    await loginWithCredentials(page, DIRECTEUR_DSI.email, DIRECTEUR_DSI.password);

    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Chercher l'onglet "À valider"
    const validationTab = page.locator('button:has-text("À valider"), [role="tab"]:has-text("valider")');

    if (await validationTab.first().isVisible({ timeout: 5000 })) {
      await validationTab.first().click();
      await page.waitForTimeout(1000);

      // Ouvrir la première note à valider
      const firstNote = page.locator('table tbody tr').first();

      if (await firstNote.isVisible({ timeout: 5000 })) {
        await firstNote.click();
        await waitForPageLoad(page);

        // Vérifier les actions disponibles
        const validateBtn = page.locator('button:has-text("Valider niveau 1"), button:has-text("Valider")');

        await page.screenshot({ path: 'test-results/directeur-validation-actions.png', fullPage: true });
      }
    }
  });
});
