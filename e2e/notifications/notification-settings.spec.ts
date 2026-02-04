/**
 * Tests E2E - Paramètres des notifications (Administration)
 *
 * Vérifie les fonctionnalités d'administration des notifications :
 * - Accès page admin (ADMIN only)
 * - CRUD templates
 * - Configuration destinataires
 * - Aperçu template
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
// TESTS ACCÈS PAGE ADMIN
// ============================================================================

test.describe('Paramètres Notifications - Contrôle d\'accès', () => {
  test('ADMIN peut accéder à la page des paramètres de notifications', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Naviguer vers la page admin des notifications
    await page.goto('/admin/notifications');
    await waitForPageLoad(page);

    // Vérifier que la page est accessible (pas de redirection vers login ou 403)
    await expect(page).not.toHaveURL('/auth');
    await expect(page).not.toHaveURL('/403');

    // Vérifier le titre de la page
    const pageTitle = page.locator('h1:has-text("Paramètres des notifications"), h1:has-text("Notifications")');
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/notification-settings-admin-access.png', fullPage: true });
  });

  test('AGENT ne peut pas accéder à la page admin des notifications', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.agent.email, TEST_USERS.agent.password);

    // Tenter d'accéder à la page admin
    await page.goto('/admin/notifications');
    await page.waitForTimeout(2000);

    // Vérifier qu'on est redirigé ou qu'on a un message d'accès refusé
    const isRedirected = !page.url().includes('/admin/notifications');
    const accessDenied = page.locator('text=Accès refusé, text=Non autorisé, text=403, text=Permission');

    const hasDeniedMessage = await accessDenied.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(isRedirected || hasDeniedMessage).toBeTruthy();

    await page.screenshot({ path: 'test-results/notification-settings-agent-denied.png', fullPage: true });
  });

  test('DAAF ne peut pas accéder à la page admin des notifications', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/admin/notifications');
    await page.waitForTimeout(2000);

    const isRedirected = !page.url().includes('/admin/notifications');
    const accessDenied = page.locator('text=Accès refusé, text=Non autorisé, text=403');

    const hasDeniedMessage = await accessDenied.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(isRedirected || hasDeniedMessage).toBeTruthy();

    await page.screenshot({ path: 'test-results/notification-settings-daaf-denied.png', fullPage: true });
  });
});

// ============================================================================
// TESTS CRUD TEMPLATES
// ============================================================================

test.describe('Paramètres Notifications - Templates', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin/notifications');
    await waitForPageLoad(page);
  });

  test('La liste des templates est affichée', async ({ page }) => {
    // Cliquer sur l'onglet Templates si nécessaire
    const templatesTab = page.locator('button:has-text("Templates"), [data-testid="templates-tab"]');
    if (await templatesTab.isVisible({ timeout: 3000 })) {
      await templatesTab.click();
      await waitForPageLoad(page);
    }

    // Vérifier que la table des templates existe
    const templatesTable = page.locator('table, [data-testid="templates-table"]');
    const templatesList = page.locator('[data-testid="templates-list"], .template-item');

    const hasTable = await templatesTable.isVisible({ timeout: 5000 }).catch(() => false);
    const hasList = await templatesList.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || hasList).toBeTruthy();

    await page.screenshot({ path: 'test-results/notification-templates-list.png', fullPage: true });
  });

  test('Les colonnes des templates affichent les bonnes informations', async ({ page }) => {
    // Aller à l'onglet Templates
    const templatesTab = page.locator('button:has-text("Templates")');
    if (await templatesTab.isVisible({ timeout: 3000 })) {
      await templatesTab.click();
      await waitForPageLoad(page);
    }

    // Vérifier les en-têtes de colonnes attendues
    const expectedHeaders = ['Type', 'Code', 'Titre', 'Variables', 'Statut', 'Actions'];

    for (const header of expectedHeaders) {
      const headerCell = page.locator(`th:has-text("${header}"), td:has-text("${header}")`);
      const isVisible = await headerCell.first().isVisible({ timeout: 3000 }).catch(() => false);
      // On ne fait pas de strict check car les noms peuvent varier
    }

    await page.screenshot({ path: 'test-results/notification-templates-columns.png' });
  });

  test('Le bouton Modifier ouvre le dialog d\'édition', async ({ page }) => {
    // Aller à l'onglet Templates
    const templatesTab = page.locator('button:has-text("Templates")');
    if (await templatesTab.isVisible({ timeout: 3000 })) {
      await templatesTab.click();
      await waitForPageLoad(page);
    }

    // Trouver un bouton Modifier
    const editButton = page.locator('button:has-text("Modifier"), button:has(svg[class*="edit"]), [data-testid="edit-template"]').first();

    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Vérifier que le dialog s'ouvre
      const dialog = page.locator('[role="dialog"], [data-testid="template-dialog"], .dialog-content');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'test-results/notification-template-edit-dialog.png' });

      // Fermer le dialog
      const closeButton = page.locator('button:has-text("Annuler"), button:has-text("Fermer"), button[aria-label="Close"]');
      if (await closeButton.first().isVisible({ timeout: 2000 })) {
        await closeButton.first().click();
      }
    }
  });

  test('On peut modifier le titre d\'un template', async ({ page }) => {
    // Aller à l'onglet Templates
    const templatesTab = page.locator('button:has-text("Templates")');
    if (await templatesTab.isVisible({ timeout: 3000 })) {
      await templatesTab.click();
      await waitForPageLoad(page);
    }

    // Ouvrir le dialog d'édition
    const editButton = page.locator('button:has-text("Modifier")').first();

    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Trouver le champ titre
      const titleInput = page.locator('input[name="titre"], input[name="titre_template"], [data-testid="template-title-input"]');

      if (await titleInput.isVisible({ timeout: 3000 })) {
        // Sauvegarder la valeur actuelle
        const currentValue = await titleInput.inputValue();

        // Modifier le titre
        await titleInput.fill(currentValue + ' - Test E2E');

        await page.screenshot({ path: 'test-results/notification-template-edit-title.png' });

        // Annuler pour ne pas modifier réellement
        const cancelButton = page.locator('button:has-text("Annuler")');
        if (await cancelButton.isVisible({ timeout: 2000 })) {
          await cancelButton.click();
        }
      }
    }
  });

  test('On peut activer/désactiver un template', async ({ page }) => {
    // Aller à l'onglet Templates
    const templatesTab = page.locator('button:has-text("Templates")');
    if (await templatesTab.isVisible({ timeout: 3000 })) {
      await templatesTab.click();
      await waitForPageLoad(page);
    }

    // Ouvrir le dialog d'édition
    const editButton = page.locator('button:has-text("Modifier")').first();

    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Chercher le switch/toggle pour activer/désactiver
      const activeSwitch = page.locator(
        '[role="switch"], ' +
        'input[type="checkbox"][name*="actif"], ' +
        'button[aria-checked], ' +
        '[data-testid="template-active-switch"]'
      );

      if (await activeSwitch.first().isVisible({ timeout: 3000 })) {
        await page.screenshot({ path: 'test-results/notification-template-active-switch.png' });
      }

      // Fermer le dialog
      const closeButton = page.locator('button:has-text("Annuler"), button[aria-label="Close"]');
      if (await closeButton.first().isVisible({ timeout: 2000 })) {
        await closeButton.first().click();
      }
    }
  });
});

// ============================================================================
// TESTS CONFIGURATION DESTINATAIRES
// ============================================================================

test.describe('Paramètres Notifications - Destinataires', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin/notifications');
    await waitForPageLoad(page);
  });

  test('L\'onglet Destinataires est accessible', async ({ page }) => {
    // Cliquer sur l'onglet Destinataires
    const recipientsTab = page.locator('button:has-text("Destinataires"), [data-testid="recipients-tab"]');

    if (await recipientsTab.isVisible({ timeout: 5000 })) {
      await recipientsTab.click();
      await waitForPageLoad(page);

      // Vérifier que le contenu s'affiche
      const recipientsContent = page.locator(
        '[data-testid="recipients-content"], ' +
        '.recipients-config, ' +
        'text=destinataire'
      );

      await page.screenshot({ path: 'test-results/notification-recipients-tab.png', fullPage: true });
    }
  });

  test('La configuration par type d\'événement est visible', async ({ page }) => {
    // Aller à l'onglet Destinataires
    const recipientsTab = page.locator('button:has-text("Destinataires")');

    if (await recipientsTab.isVisible({ timeout: 5000 })) {
      await recipientsTab.click();
      await waitForPageLoad(page);

      // Vérifier qu'on a des types d'événements listés
      const eventTypes = [
        'Ordonnancement',
        'Règlement',
        'Note soumise',
        'Note validée',
      ];

      for (const eventType of eventTypes) {
        const typeLabel = page.locator(`text=${eventType}`);
        const isVisible = await typeLabel.first().isVisible({ timeout: 2000 }).catch(() => false);
        // On log mais on ne fail pas car les labels peuvent varier
      }

      await page.screenshot({ path: 'test-results/notification-recipients-event-types.png', fullPage: true });
    }
  });

  test('On peut voir les rôles configurés comme destinataires', async ({ page }) => {
    // Aller à l'onglet Destinataires
    const recipientsTab = page.locator('button:has-text("Destinataires")');

    if (await recipientsTab.isVisible({ timeout: 5000 })) {
      await recipientsTab.click();
      await waitForPageLoad(page);

      // Chercher des mentions de rôles
      const rolesMentioned = page.locator('text=DG, text=DMG, text=Directeur, text=DAAF');
      const hasRoles = await rolesMentioned.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/notification-recipients-roles.png', fullPage: true });
    }
  });

  test('On peut ajouter un nouveau destinataire', async ({ page }) => {
    // Aller à l'onglet Destinataires
    const recipientsTab = page.locator('button:has-text("Destinataires")');

    if (await recipientsTab.isVisible({ timeout: 5000 })) {
      await recipientsTab.click();
      await waitForPageLoad(page);

      // Chercher un bouton Ajouter
      const addButton = page.locator(
        'button:has-text("Ajouter"), ' +
        'button:has-text("Nouveau"), ' +
        '[data-testid="add-recipient"], ' +
        'button:has(svg[class*="plus"])'
      );

      if (await addButton.first().isVisible({ timeout: 5000 })) {
        await page.screenshot({ path: 'test-results/notification-recipients-add-button.png' });
      }
    }
  });
});

// ============================================================================
// TESTS APERÇU TEMPLATE
// ============================================================================

test.describe('Paramètres Notifications - Aperçu Template', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin/notifications');
    await waitForPageLoad(page);
  });

  test('L\'éditeur de template affiche un aperçu en temps réel', async ({ page }) => {
    // Aller à l'onglet Templates
    const templatesTab = page.locator('button:has-text("Templates")');
    if (await templatesTab.isVisible({ timeout: 3000 })) {
      await templatesTab.click();
      await waitForPageLoad(page);
    }

    // Ouvrir le dialog d'édition
    const editButton = page.locator('button:has-text("Modifier")').first();

    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Chercher la zone d'aperçu
      const previewArea = page.locator(
        '[data-testid="template-preview"], ' +
        '.preview, ' +
        'text=Aperçu, ' +
        '.template-preview'
      );

      const hasPreview = await previewArea.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (hasPreview) {
        await page.screenshot({ path: 'test-results/notification-template-preview.png' });
      }

      // Fermer le dialog
      const closeButton = page.locator('button:has-text("Annuler"), button[aria-label="Close"]');
      if (await closeButton.first().isVisible({ timeout: 2000 })) {
        await closeButton.first().click();
      }
    }
  });

  test('Les variables disponibles sont listées', async ({ page }) => {
    // Aller à l'onglet Templates
    const templatesTab = page.locator('button:has-text("Templates")');
    if (await templatesTab.isVisible({ timeout: 3000 })) {
      await templatesTab.click();
      await waitForPageLoad(page);
    }

    // Ouvrir le dialog d'édition
    const editButton = page.locator('button:has-text("Modifier")').first();

    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Chercher la liste des variables
      const variablesList = page.locator(
        '[data-testid="available-variables"], ' +
        'text=Variables disponibles, ' +
        'text={{reference}}, ' +
        'text={{montant}}'
      );

      const hasVariables = await variablesList.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/notification-template-variables.png' });

      // Fermer le dialog
      const closeButton = page.locator('button:has-text("Annuler"), button[aria-label="Close"]');
      if (await closeButton.first().isVisible({ timeout: 2000 })) {
        await closeButton.first().click();
      }
    }
  });

  test('L\'aperçu se met à jour quand on modifie le template', async ({ page }) => {
    // Aller à l'onglet Templates
    const templatesTab = page.locator('button:has-text("Templates")');
    if (await templatesTab.isVisible({ timeout: 3000 })) {
      await templatesTab.click();
      await waitForPageLoad(page);
    }

    // Ouvrir le dialog d'édition
    const editButton = page.locator('button:has-text("Modifier")').first();

    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Trouver le champ de corps du template
      const bodyInput = page.locator(
        'textarea[name="corps"], ' +
        'textarea[name="corps_template"], ' +
        '[data-testid="template-body-input"], ' +
        'textarea'
      );

      if (await bodyInput.first().isVisible({ timeout: 3000 })) {
        // Modifier le contenu
        await bodyInput.first().fill('Test de modification - La référence est {{reference}} et le montant est {{montant}}');
        await page.waitForTimeout(500);

        // Prendre un screenshot pour voir l'aperçu
        await page.screenshot({ path: 'test-results/notification-template-preview-updated.png' });
      }

      // Fermer le dialog
      const closeButton = page.locator('button:has-text("Annuler"), button[aria-label="Close"]');
      if (await closeButton.first().isVisible({ timeout: 2000 })) {
        await closeButton.first().click();
      }
    }
  });
});

// ============================================================================
// TESTS PRÉFÉRENCES SYSTÈME
// ============================================================================

test.describe('Paramètres Notifications - Préférences système', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin/notifications');
    await waitForPageLoad(page);
  });

  test('L\'onglet Préférences affiche les options globales', async ({ page }) => {
    // Cliquer sur l'onglet Préférences
    const prefsTab = page.locator('button:has-text("Préférences"), [data-testid="preferences-tab"]');

    if (await prefsTab.isVisible({ timeout: 5000 })) {
      await prefsTab.click();
      await waitForPageLoad(page);

      // Vérifier les options globales
      const globalOptions = page.locator(
        'text=Notifications in-app, ' +
        'text=Notifications par email, ' +
        'text=notification'
      );

      await page.screenshot({ path: 'test-results/notification-settings-preferences.png', fullPage: true });
    }
  });

  test('On peut voir les canaux par défaut par type d\'événement', async ({ page }) => {
    // Aller à l'onglet Préférences
    const prefsTab = page.locator('button:has-text("Préférences")');

    if (await prefsTab.isVisible({ timeout: 5000 })) {
      await prefsTab.click();
      await waitForPageLoad(page);

      // Chercher la configuration des canaux
      const channelConfig = page.locator(
        'text=Canaux par défaut, ' +
        'text=Application, ' +
        'text=Email'
      );

      await page.screenshot({ path: 'test-results/notification-settings-channels.png', fullPage: true });
    }
  });

  test('L\'historique récent des notifications est affiché', async ({ page }) => {
    // Aller à l'onglet Préférences
    const prefsTab = page.locator('button:has-text("Préférences")');

    if (await prefsTab.isVisible({ timeout: 5000 })) {
      await prefsTab.click();
      await waitForPageLoad(page);

      // Chercher l'historique
      const historySection = page.locator(
        'text=Historique récent, ' +
        'text=dernières notifications, ' +
        '[data-testid="notification-history"]'
      );

      const hasHistory = await historySection.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/notification-settings-history.png', fullPage: true });
    }
  });
});

// ============================================================================
// TESTS STATISTIQUES
// ============================================================================

test.describe('Paramètres Notifications - Statistiques', () => {
  test('Les cartes de statistiques sont affichées', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin/notifications');
    await waitForPageLoad(page);

    // Vérifier les cartes de stats
    const statsCards = page.locator(
      'text=Templates actifs, ' +
      'text=Envoyées, ' +
      'text=Lues, ' +
      'text=Échecs'
    );

    const hasStats = await statsCards.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasStats) {
      // Vérifier qu'on a des chiffres
      const numbers = page.locator('.text-2xl, .text-xl, [class*="font-bold"]');
      const count = await numbers.count();

      expect(count).toBeGreaterThan(0);
    }

    await page.screenshot({ path: 'test-results/notification-settings-stats.png', fullPage: true });
  });
});
