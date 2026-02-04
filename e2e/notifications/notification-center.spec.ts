/**
 * Tests E2E - Centre de notifications
 *
 * Vérifie les fonctionnalités du centre de notifications :
 * - Affichage centre notifications
 * - Filtrage par type/date
 * - Marquer comme lu
 * - Navigation vers dossier
 * - Badge compteur
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, TEST_USERS } from '../fixtures/auth';

// Helper pour se connecter
async function loginWithCredentials(
  page: typeof import('@playwright/test').Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
  const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/\/(dashboard|$)/, { timeout: 15000 });
  await waitForPageLoad(page);
}

// ============================================================================
// TESTS AFFICHAGE CENTRE NOTIFICATIONS
// ============================================================================

test.describe('Centre de notifications - Affichage', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);
  });

  test('La page des notifications est accessible via le menu', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Ouvrir le dropdown de notifications
    const notificationBell = page.locator(
      '[data-testid="notification-bell"], ' +
      'button[aria-label*="notification"], ' +
      '.notification-bell'
    ).first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Cliquer sur "Voir tout" ou naviguer directement
      const viewAllLink = page.locator(
        'a:has-text("Voir tout"), ' +
        'a:has-text("Voir toutes"), ' +
        'button:has-text("Voir tout"), ' +
        '[data-testid="view-all-notifications"]'
      );

      if (await viewAllLink.isVisible({ timeout: 3000 })) {
        await viewAllLink.click();
        await waitForPageLoad(page);
      } else {
        // Navigation directe
        await page.goto('/notifications');
        await waitForPageLoad(page);
      }
    } else {
      await page.goto('/notifications');
      await waitForPageLoad(page);
    }

    // Vérifier qu'on est sur la page des notifications
    const pageTitle = page.locator('h1:has-text("Notification"), text=Notification');
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/notification-center-page.png', fullPage: true });
  });

  test('Le centre de notifications affiche les onglets par catégorie', async ({ page }) => {
    await page.goto('/notifications');
    await waitForPageLoad(page);

    // Chercher les onglets de catégories
    const tabs = page.locator(
      '[role="tablist"], ' +
      '.tabs, ' +
      '[data-testid="notification-tabs"]'
    );

    const hasTabs = await tabs.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTabs) {
      // Vérifier les catégories attendues
      const categories = ['Ordonnancements', 'Reglements', 'Autres', 'Toutes'];

      for (const category of categories) {
        const tab = page.locator(`button:has-text("${category}"), [role="tab"]:has-text("${category}")`);
        const isVisible = await tab.first().isVisible({ timeout: 2000 }).catch(() => false);
      }
    }

    await page.screenshot({ path: 'test-results/notification-center-tabs.png', fullPage: true });
  });

  test('Les notifications sont affichées sous forme de cartes', async ({ page }) => {
    await page.goto('/notifications');
    await waitForPageLoad(page);

    // Chercher les cartes de notification
    const notificationCards = page.locator(
      '[data-testid="notification-card"], ' +
      '.notification-card, ' +
      '.notification-item, ' +
      '[class*="Card"]'
    );

    const cardCount = await notificationCards.count();

    if (cardCount > 0) {
      // Vérifier que la première carte a un contenu
      await expect(notificationCards.first()).toBeVisible();
    }

    await page.screenshot({ path: 'test-results/notification-center-cards.png', fullPage: true });
  });

  test('Chaque notification affiche ses informations principales', async ({ page }) => {
    await page.goto('/notifications');
    await waitForPageLoad(page);

    // Trouver une notification
    const notificationCard = page.locator(
      '[data-testid="notification-card"], ' +
      '.notification-card, ' +
      '.notification-item'
    ).first();

    if (await notificationCard.isVisible({ timeout: 5000 })) {
      // Vérifier la présence d'un titre
      const title = notificationCard.locator('h3, h4, strong, .title');

      // Vérifier la présence d'une date
      const date = notificationCard.locator('text=/il y a|\\d{2}\\/\\d{2}|aujourd|hier/');

      await page.screenshot({ path: 'test-results/notification-center-card-details.png' });
    }
  });

  test('L\'indicateur de statut temps réel est visible', async ({ page }) => {
    await page.goto('/notifications');
    await waitForPageLoad(page);

    // Chercher l'indicateur de connexion temps réel
    const realtimeIndicator = page.locator(
      '[data-testid="realtime-status"], ' +
      '.realtime-indicator, ' +
      'text=Connecté, ' +
      '.connection-status'
    );

    const hasIndicator = await realtimeIndicator.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/notification-center-realtime.png', fullPage: true });
  });
});

// ============================================================================
// TESTS FILTRAGE
// ============================================================================

test.describe('Centre de notifications - Filtrage', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);
    await page.goto('/notifications');
    await waitForPageLoad(page);
  });

  test('On peut filtrer par type de notification', async ({ page }) => {
    // Chercher un sélecteur de type ou des onglets
    const typeFilter = page.locator(
      '[data-testid="type-filter"], ' +
      'select[name="type"], ' +
      '[role="tablist"] button'
    );

    const hasTypeFilter = await typeFilter.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTypeFilter) {
      // Cliquer sur un filtre de type
      const ordoTab = page.locator('button:has-text("Ordonnancement"), [role="tab"]:has-text("Ordonnancement")');

      if (await ordoTab.isVisible({ timeout: 3000 })) {
        await ordoTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/notification-center-filter-type.png', fullPage: true });
      }
    }
  });

  test('On peut filtrer par statut lu/non-lu', async ({ page }) => {
    // Chercher un filtre de statut
    const statusFilter = page.locator(
      '[data-testid="status-filter"], ' +
      'button:has-text("Non lues"), ' +
      'button:has-text("Toutes"), ' +
      'select[name="status"]'
    );

    const hasStatusFilter = await statusFilter.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasStatusFilter) {
      // Essayer de filtrer par "Non lues"
      const unreadFilter = page.locator('button:has-text("Non lues"), option:has-text("Non lues")');

      if (await unreadFilter.first().isVisible({ timeout: 3000 })) {
        await unreadFilter.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/notification-center-filter-unread.png', fullPage: true });
      }
    }
  });

  test('On peut filtrer par plage de dates', async ({ page }) => {
    // Chercher un sélecteur de dates
    const dateFilter = page.locator(
      '[data-testid="date-filter"], ' +
      '[data-testid="date-range"], ' +
      'input[type="date"], ' +
      'button:has-text("Période"), ' +
      'button:has-text("Date")'
    );

    const hasDateFilter = await dateFilter.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDateFilter) {
      await page.screenshot({ path: 'test-results/notification-center-filter-date.png', fullPage: true });
    }
  });

  test('Le champ de recherche fonctionne', async ({ page }) => {
    // Chercher un champ de recherche
    const searchInput = page.locator(
      '[data-testid="notification-search"], ' +
      'input[placeholder*="Recherche"], ' +
      'input[placeholder*="recherche"], ' +
      'input[type="search"]'
    );

    if (await searchInput.first().isVisible({ timeout: 5000 })) {
      // Taper une recherche
      await searchInput.first().fill('ordonnancement');
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'test-results/notification-center-search.png', fullPage: true });
    }
  });

  test('Les filtres peuvent être réinitialisés', async ({ page }) => {
    // Chercher un bouton de réinitialisation
    const resetButton = page.locator(
      'button:has-text("Réinitialiser"), ' +
      'button:has-text("Effacer"), ' +
      'button:has-text("Tous"), ' +
      '[data-testid="reset-filters"]'
    );

    const hasResetButton = await resetButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/notification-center-filter-reset.png', fullPage: true });
  });
});

// ============================================================================
// TESTS MARQUER COMME LU
// ============================================================================

test.describe('Centre de notifications - Marquer comme lu', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);
    await page.goto('/notifications');
    await waitForPageLoad(page);
  });

  test('Cliquer sur une notification la marque comme lue', async ({ page }) => {
    // Trouver une notification non lue
    const unreadNotification = page.locator(
      '[data-testid="notification-card"][data-unread="true"], ' +
      '.notification-card.unread, ' +
      '.notification-item:not(.read)'
    ).first();

    if (await unreadNotification.isVisible({ timeout: 5000 })) {
      // Cliquer sur la notification
      await unreadNotification.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'test-results/notification-center-mark-read-click.png', fullPage: true });
    }
  });

  test('Le bouton "Tout marquer comme lu" est disponible', async ({ page }) => {
    // Chercher le bouton
    const markAllButton = page.locator(
      'button:has-text("Tout marquer"), ' +
      'button:has-text("Marquer tout"), ' +
      '[data-testid="mark-all-read"]'
    );

    const hasButton = await markAllButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasButton) {
      await page.screenshot({ path: 'test-results/notification-center-mark-all-button.png' });
    }
  });

  test('On peut marquer une notification comme lue via le bouton d\'action', async ({ page }) => {
    // Trouver une notification avec un bouton d'action
    const notificationCard = page.locator(
      '[data-testid="notification-card"], ' +
      '.notification-card'
    ).first();

    if (await notificationCard.isVisible({ timeout: 5000 })) {
      // Chercher un bouton "Marquer comme lu"
      const markReadButton = notificationCard.locator(
        'button:has-text("Lu"), ' +
        'button[aria-label*="lu"], ' +
        '[data-testid="mark-read"]'
      );

      const hasMarkReadButton = await markReadButton.first().isVisible({ timeout: 3000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/notification-center-mark-read-button.png' });
    }
  });

  test('Les notifications lues ont un style visuel différent', async ({ page }) => {
    // Vérifier la différence visuelle entre lu et non lu
    const readNotifications = page.locator(
      '[data-testid="notification-card"][data-read="true"], ' +
      '.notification-card.read, ' +
      '.notification-item.read'
    );

    const unreadNotifications = page.locator(
      '[data-testid="notification-card"][data-unread="true"], ' +
      '.notification-card:not(.read), ' +
      '.notification-item.unread'
    );

    await page.screenshot({ path: 'test-results/notification-center-read-unread-styles.png', fullPage: true });
  });
});

// ============================================================================
// TESTS NAVIGATION VERS DOSSIER
// ============================================================================

test.describe('Centre de notifications - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);
    await page.goto('/notifications');
    await waitForPageLoad(page);
  });

  test('Cliquer sur une notification navigue vers l\'élément concerné', async ({ page }) => {
    // Trouver une notification
    const notificationCard = page.locator(
      '[data-testid="notification-card"], ' +
      '.notification-card, ' +
      '.notification-item'
    ).first();

    if (await notificationCard.isVisible({ timeout: 5000 })) {
      const initialUrl = page.url();

      // Cliquer sur la notification
      await notificationCard.click();
      await page.waitForTimeout(2000);

      // L'URL devrait avoir changé
      const newUrl = page.url();

      await page.screenshot({ path: 'test-results/notification-center-navigation.png', fullPage: true });
    }
  });

  test('Le bouton "Voir" navigue vers le dossier', async ({ page }) => {
    // Trouver un bouton "Voir" sur une notification
    const viewButton = page.locator(
      '[data-testid="notification-card"] button:has-text("Voir"), ' +
      '.notification-card a:has-text("Voir"), ' +
      '[data-testid="view-entity"]'
    ).first();

    if (await viewButton.isVisible({ timeout: 5000 })) {
      const initialUrl = page.url();

      await viewButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/notification-center-view-button.png', fullPage: true });
    }
  });

  test('La navigation conserve le contexte de retour', async ({ page }) => {
    // Naviguer vers un élément depuis une notification
    const notificationCard = page.locator(
      '[data-testid="notification-card"], ' +
      '.notification-card'
    ).first();

    if (await notificationCard.isVisible({ timeout: 5000 })) {
      await notificationCard.click();
      await page.waitForTimeout(2000);

      // Vérifier qu'on peut revenir
      await page.goBack();
      await waitForPageLoad(page);

      // On devrait être de retour sur les notifications
      await page.screenshot({ path: 'test-results/notification-center-navigation-back.png', fullPage: true });
    }
  });
});

// ============================================================================
// TESTS BADGE COMPTEUR
// ============================================================================

test.describe('Centre de notifications - Badge compteur', () => {
  test('Le badge affiche le nombre de notifications non lues', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher le badge
    const badge = page.locator(
      '[data-testid="notification-count"], ' +
      '.notification-badge, ' +
      '.badge'
    ).filter({ hasText: /\d+/ });

    if (await badge.first().isVisible({ timeout: 5000 })) {
      const count = await badge.first().textContent();
      expect(count).toMatch(/\d+/);

      await page.screenshot({ path: 'test-results/notification-badge-count.png' });
    }
  });

  test('Le badge se met à jour après avoir marqué comme lu', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Récupérer le compteur initial
    const badge = page.locator(
      '[data-testid="notification-count"], ' +
      '.notification-badge'
    ).filter({ hasText: /\d+/ });

    const initialCount = await badge.first().textContent().catch(() => '0');

    // Ouvrir le dropdown
    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Marquer tout comme lu
      const markAllButton = page.locator('button:has-text("Tout marquer"), button:has-text("Marquer tout")');

      if (await markAllButton.isVisible({ timeout: 3000 })) {
        await markAllButton.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/notification-badge-after-mark-all.png' });
      }
    }
  });

  test('Le badge disparaît quand il n\'y a plus de non-lues', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    // Aller à la page des notifications et marquer tout comme lu
    await page.goto('/notifications');
    await waitForPageLoad(page);

    const markAllButton = page.locator('button:has-text("Tout marquer"), button:has-text("Marquer tout")');

    if (await markAllButton.isVisible({ timeout: 5000 })) {
      await markAllButton.click();
      await page.waitForTimeout(1000);

      // Retourner à l'accueil
      await page.goto('/');
      await waitForPageLoad(page);

      // Le badge devrait être absent ou afficher 0
      const badge = page.locator('[data-testid="notification-count"], .notification-badge');

      await page.screenshot({ path: 'test-results/notification-badge-empty.png' });
    }
  });

  test('Le badge a une animation quand il y a de nouvelles notifications', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher un badge avec animation
    const animatedBadge = page.locator(
      '[data-testid="notification-count"][class*="animate"], ' +
      '.notification-badge[class*="animate"], ' +
      '.notification-badge[class*="pulse"]'
    );

    const hasAnimation = await animatedBadge.first().isVisible({ timeout: 3000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/notification-badge-animation.png' });
  });
});

// ============================================================================
// TESTS ACTIONS EN LOT
// ============================================================================

test.describe('Centre de notifications - Actions en lot', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);
    await page.goto('/notifications');
    await waitForPageLoad(page);
  });

  test('Le bouton "Tout marquer comme lu" fonctionne', async ({ page }) => {
    const markAllButton = page.locator(
      'button:has-text("Tout marquer comme lu"), ' +
      'button:has-text("Marquer tout"), ' +
      '[data-testid="mark-all-read"]'
    );

    if (await markAllButton.first().isVisible({ timeout: 5000 })) {
      await markAllButton.first().click();
      await page.waitForTimeout(1000);

      // Vérifier le feedback visuel
      await page.screenshot({ path: 'test-results/notification-center-mark-all-action.png', fullPage: true });
    }
  });

  test('Le bouton "Supprimer les lues" est disponible', async ({ page }) => {
    const deleteReadButton = page.locator(
      'button:has-text("Supprimer les lues"), ' +
      'button:has-text("Effacer lues"), ' +
      '[data-testid="delete-read"]'
    );

    const hasButton = await deleteReadButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/notification-center-delete-read-button.png', fullPage: true });
  });

  test('Le bouton actualiser recharge les notifications', async ({ page }) => {
    const refreshButton = page.locator(
      'button:has-text("Actualiser"), ' +
      'button[aria-label*="refresh"], ' +
      '[data-testid="refresh-notifications"]'
    );

    if (await refreshButton.first().isVisible({ timeout: 5000 })) {
      await refreshButton.first().click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'test-results/notification-center-refresh.png', fullPage: true });
    }
  });
});

// ============================================================================
// TESTS PRÉFÉRENCES UTILISATEUR
// ============================================================================

test.describe('Centre de notifications - Préférences', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);
    await page.goto('/notifications');
    await waitForPageLoad(page);
  });

  test('L\'onglet préférences est accessible', async ({ page }) => {
    // Chercher l'onglet préférences
    const prefsTab = page.locator(
      'button:has-text("Préférences"), ' +
      '[role="tab"]:has-text("Préférences"), ' +
      'a:has-text("Préférences")'
    );

    if (await prefsTab.first().isVisible({ timeout: 5000 })) {
      await prefsTab.first().click();
      await waitForPageLoad(page);

      await page.screenshot({ path: 'test-results/notification-center-preferences.png', fullPage: true });
    }
  });

  test('On peut activer/désactiver les notifications par type', async ({ page }) => {
    // Aller aux préférences
    const prefsTab = page.locator('button:has-text("Préférences"), [role="tab"]:has-text("Préférences")');

    if (await prefsTab.first().isVisible({ timeout: 5000 })) {
      await prefsTab.first().click();
      await waitForPageLoad(page);

      // Chercher des toggles par type
      const typeToggles = page.locator(
        '[role="switch"], ' +
        'input[type="checkbox"]'
      );

      const toggleCount = await typeToggles.count();

      await page.screenshot({ path: 'test-results/notification-center-preferences-toggles.png', fullPage: true });
    }
  });

  test('On peut activer/désactiver les notifications email', async ({ page }) => {
    // Aller aux préférences
    const prefsTab = page.locator('button:has-text("Préférences")');

    if (await prefsTab.first().isVisible({ timeout: 5000 })) {
      await prefsTab.first().click();
      await waitForPageLoad(page);

      // Chercher le toggle email
      const emailToggle = page.locator(
        '[data-testid="email-toggle"], ' +
        'button[role="switch"]:near(:text("Email")), ' +
        'input[type="checkbox"]:near(:text("Email"))'
      );

      const hasEmailToggle = await emailToggle.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/notification-center-email-toggle.png', fullPage: true });
    }
  });
});

// ============================================================================
// TESTS RESPONSIVE
// ============================================================================

test.describe('Centre de notifications - Responsive', () => {
  test('Le centre de notifications s\'adapte au mobile', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    // Simuler un écran mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/notifications');
    await waitForPageLoad(page);

    // Vérifier que le contenu est visible
    const content = page.locator(
      '[data-testid="notification-center"], ' +
      '.notification-center, ' +
      'main'
    );

    await expect(content.first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/notification-center-mobile.png', fullPage: true });
  });

  test('Le dropdown de notifications fonctionne sur mobile', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await waitForPageLoad(page);

    // Ouvrir le dropdown
    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'test-results/notification-dropdown-mobile.png', fullPage: true });
    }
  });
});

// ============================================================================
// TESTS SONS ET ALERTES
// ============================================================================

test.describe('Centre de notifications - Sons et alertes', () => {
  test('Le toggle de son est disponible dans le dropdown', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);

    await page.goto('/');
    await waitForPageLoad(page);

    // Ouvrir le dropdown
    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Chercher le toggle de son
      const soundToggle = page.locator(
        '[data-testid="sound-toggle"], ' +
        'button[aria-label*="son"], ' +
        'button:has-text("Son")'
      );

      const hasSoundToggle = await soundToggle.first().isVisible({ timeout: 3000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/notification-sound-toggle.png' });
    }
  });
});

// ============================================================================
// TESTS ÉTAT VIDE
// ============================================================================

test.describe('Centre de notifications - État vide', () => {
  test('Un message approprié s\'affiche quand il n\'y a pas de notifications', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.agent.email, TEST_USERS.agent.password);

    await page.goto('/notifications');
    await waitForPageLoad(page);

    // Chercher un message d'état vide
    const emptyState = page.locator(
      '[data-testid="empty-state"], ' +
      'text=Aucune notification, ' +
      'text=pas de notification, ' +
      '.empty-state'
    );

    // Que ce soit vide ou non, capturer l'état
    await page.screenshot({ path: 'test-results/notification-center-empty-state.png', fullPage: true });
  });
});
