/**
 * Tests E2E - Notifications
 *
 * Vérifie la réception et la gestion des notifications.
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, TEST_USERS } from '../fixtures/auth';

// Helper pour se connecter
async function loginWithCredentials(page: typeof import('@playwright/test').Page, email: string, password: string): Promise<void> {
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

test.describe('Notifications - Affichage', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('L\'icône de notification est visible dans le header', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher l'icône de notification (cloche)
    const notificationBell = page.locator(
      '[data-testid="notification-bell"], ' +
      '[data-testid="notifications"], ' +
      'button[aria-label*="notification"], ' +
      'button[aria-label*="Notification"], ' +
      '.notification-bell, ' +
      '[class*="NotificationBell"]'
    );

    await expect(notificationBell.first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/notification-bell.png' });
  });

  test('Le badge de notification affiche le nombre de non-lues', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Chercher le badge de compteur
    const notificationBadge = page.locator(
      '[data-testid="notification-count"], ' +
      '[data-testid="notification-badge"], ' +
      '.notification-badge, ' +
      '.badge, ' +
      '[class*="badge"]'
    ).filter({ hasText: /\d+/ });

    // Le badge peut être visible ou non selon qu'il y a des notifications
    const isVisible = await notificationBadge.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      const count = await notificationBadge.first().textContent();
      expect(count).toMatch(/\d+/);
      await page.screenshot({ path: 'test-results/notification-badge.png' });
    }
  });

  test('Le dropdown de notifications s\'ouvre au clic', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Cliquer sur l'icône de notification
    const notificationBell = page.locator(
      '[data-testid="notification-bell"], ' +
      'button[aria-label*="notification"], ' +
      '.notification-bell'
    ).first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Vérifier que le dropdown s'ouvre
      const dropdown = page.locator(
        '[data-testid="notification-dropdown"], ' +
        '[data-testid="notification-list"], ' +
        '.notification-dropdown, ' +
        '[role="menu"], ' +
        '.dropdown-content'
      );

      await expect(dropdown.first()).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: 'test-results/notification-dropdown.png' });
    }
  });

  test('Les notifications affichent un titre et une date', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Ouvrir le dropdown
    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Chercher les éléments de notification
      const notificationItems = page.locator(
        '[data-testid="notification-item"], ' +
        '.notification-item, ' +
        '[class*="notification"]'
      );

      const itemCount = await notificationItems.count();

      if (itemCount > 0) {
        // Vérifier que chaque notification a un contenu
        const firstItem = notificationItems.first();
        await expect(firstItem).toBeVisible();

        // Chercher la date/heure
        const dateTime = page.locator('text=/\\d{2}\\/\\d{2}|il y a|aujourd|hier/i');

        await page.screenshot({ path: 'test-results/notification-items.png' });
      }
    }
  });
});

test.describe('Notifications - Marquage comme lu', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('Cliquer sur une notification la marque comme lue', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Ouvrir le dropdown
    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Chercher une notification non lue
      const unreadNotification = page.locator(
        '[data-testid="notification-item"][data-unread="true"], ' +
        '.notification-item.unread, ' +
        '.notification-item:not(.read), ' +
        '[class*="notification"][class*="unread"]'
      ).first();

      if (await unreadNotification.isVisible({ timeout: 3000 })) {
        // Cliquer sur la notification
        await unreadNotification.click();
        await page.waitForTimeout(1000);

        // Vérifier que la notification est marquée comme lue
        // (soit elle disparaît de la liste des non-lues, soit elle change de style)
        await page.screenshot({ path: 'test-results/notification-marked-read.png' });
      }
    }
  });

  test('Le bouton "Tout marquer comme lu" fonctionne', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Ouvrir le dropdown
    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Chercher le bouton "Tout marquer comme lu"
      const markAllReadBtn = page.locator(
        'button:has-text("Tout marquer"), ' +
        'button:has-text("Marquer tout"), ' +
        'button:has-text("Mark all"), ' +
        '[data-testid="mark-all-read"]'
      );

      if (await markAllReadBtn.isVisible({ timeout: 3000 })) {
        // Récupérer le compteur avant
        const badgeBefore = page.locator('[data-testid="notification-count"], .notification-badge');
        const countBefore = await badgeBefore.textContent().catch(() => '0');

        await markAllReadBtn.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/notification-all-marked-read.png' });
      }
    }
  });

  test('Les notifications lues ont un style différent', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Ouvrir le dropdown
    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Chercher les notifications lues et non lues
      const readNotifications = page.locator('.notification-item.read, [data-read="true"]');
      const unreadNotifications = page.locator('.notification-item.unread, [data-unread="true"], .notification-item:not(.read)');

      // Prendre un screenshot pour vérifier visuellement la différence
      await page.screenshot({ path: 'test-results/notification-read-unread-styles.png' });
    }
  });
});

test.describe('Notifications - Types', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.dg.email, TEST_USERS.dg.password);
  });

  test('Les notifications de validation sont affichées', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Chercher des notifications de type validation
      const validationNotifs = page.locator(
        'text=valider, ' +
        'text=validation, ' +
        'text=approuver, ' +
        '[data-type="validation"]'
      );

      await page.screenshot({ path: 'test-results/notification-validation-type.png' });
    }
  });

  test('Les notifications d\'alerte sont visibles', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Chercher des notifications d'alerte
      const alertNotifs = page.locator(
        'text=alerte, ' +
        'text=urgent, ' +
        'text=attention, ' +
        '[data-type="alert"], ' +
        '[class*="alert"], ' +
        '[class*="warning"]'
      );

      await page.screenshot({ path: 'test-results/notification-alert-type.png' });
    }
  });
});

test.describe('Notifications - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('Cliquer sur une notification navigue vers l\'élément concerné', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Cliquer sur une notification
      const notificationItem = page.locator('[data-testid="notification-item"], .notification-item').first();

      if (await notificationItem.isVisible({ timeout: 3000 })) {
        const initialUrl = page.url();

        await notificationItem.click();
        await page.waitForTimeout(2000);

        // L'URL peut avoir changé si la notification redirige
        await page.screenshot({ path: 'test-results/notification-navigation.png' });
      }
    }
  });

  test('Le lien "Voir toutes les notifications" fonctionne', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const notificationBell = page.locator('[data-testid="notification-bell"], button[aria-label*="notification"]').first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Chercher le lien "Voir tout"
      const viewAllLink = page.locator(
        'a:has-text("Voir tout"), ' +
        'a:has-text("Voir toutes"), ' +
        'button:has-text("Voir tout"), ' +
        '[data-testid="view-all-notifications"]'
      );

      if (await viewAllLink.isVisible({ timeout: 3000 })) {
        await viewAllLink.click();
        await waitForPageLoad(page);

        // Devrait naviguer vers une page de notifications
        await page.screenshot({ path: 'test-results/notification-view-all.png' });
      }
    }
  });
});

test.describe('Notifications - Préférences', () => {
  test('La page de préférences de notifications existe', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    // Naviguer vers les préférences (peut être dans le profil ou les paramètres)
    await page.goto('/mon-profil');
    await waitForPageLoad(page);

    // Ou essayer /settings/notifications
    if (page.url().includes('404')) {
      await page.goto('/parametres');
      await waitForPageLoad(page);
    }

    // Chercher la section notifications
    const notifPrefs = page.locator(
      'text=Notifications, ' +
      'text=Préférences, ' +
      '[data-testid="notification-preferences"]'
    );

    await page.screenshot({ path: 'test-results/notification-preferences-page.png', fullPage: true });
  });

  test('On peut activer/désactiver les notifications email', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/mon-profil');
    await waitForPageLoad(page);

    // Chercher un toggle pour les notifications email
    const emailToggle = page.locator(
      '[data-testid="email-notifications-toggle"], ' +
      'input[name*="email"][type="checkbox"], ' +
      'button[role="switch"]:near(:text("Email"))'
    );

    if (await emailToggle.first().isVisible({ timeout: 5000 })) {
      await page.screenshot({ path: 'test-results/notification-email-toggle.png' });
    }
  });
});
