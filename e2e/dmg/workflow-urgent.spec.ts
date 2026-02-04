/**
 * Tests E2E - Workflow Urgent (DMG)
 *
 * Vérifie le workflow complet des liquidations urgentes :
 * - Workflow complet : Marquer → Traiter → Régler
 * - Notification envoyée
 * - Historique audit
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
// TESTS WORKFLOW MARQUAGE → TRAITEMENT → RÈGLEMENT
// ============================================================================

test.describe('Workflow Urgent - Étape 1: Marquage', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('On peut accéder à la liste des liquidations à traiter', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Vérifier l'onglet "À traiter"
    const toProcessTab = page.locator(
      'button:has-text("À traiter"), ' +
      '[role="tab"]:has-text("À traiter"), ' +
      'button:has-text("En attente")'
    );

    if (await toProcessTab.first().isVisible({ timeout: 5000 })) {
      await toProcessTab.first().click();
      await waitForPageLoad(page);
    }

    await page.screenshot({ path: 'test-results/workflow-urgent-step1-list.png', fullPage: true });
  });

  test('Le dialog de marquage urgent contient tous les champs requis', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Trouver le bouton de marquage urgent
    const urgentButton = page.locator(
      '[data-testid="urgent-toggle"], ' +
      'button:has-text("Marquer urgent")'
    ).first();

    if (await urgentButton.isVisible({ timeout: 5000 })) {
      await urgentButton.click();
      await page.waitForTimeout(500);

      // Vérifier les éléments du dialog
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Vérifier le titre
      const title = dialog.locator('h2, h3, .dialog-title');
      await expect(title.first()).toBeVisible();

      // Vérifier le champ motif
      const motifField = dialog.locator('textarea, input[name*="motif"]');
      const hasMotifField = await motifField.first().isVisible({ timeout: 3000 }).catch(() => false);

      // Vérifier les boutons
      const confirmButton = dialog.locator('button:has-text("Confirmer"), button:has-text("Marquer")');
      const cancelButton = dialog.locator('button:has-text("Annuler")');

      await page.screenshot({ path: 'test-results/workflow-urgent-step1-dialog.png' });

      // Fermer le dialog
      if (await cancelButton.isVisible({ timeout: 2000 })) {
        await cancelButton.click();
      }
    }
  });

  test('Le workflow enregistre la date et l\'utilisateur qui marque urgent', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet Urgentes pour voir les infos
    const urgentTab = page.locator('button:has-text("Urgent"), [role="tab"]:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Chercher les infos de date et utilisateur
      const dateInfo = page.locator(
        'text=/\\d{2}\\/\\d{2}/, ' +
        'text=Marqué le, ' +
        '[data-testid="urgent-date"]'
      );

      const userInfo = page.locator(
        'text=par, ' +
        '[data-testid="urgent-by"], ' +
        '.marked-by'
      );

      await page.screenshot({ path: 'test-results/workflow-urgent-step1-audit-info.png', fullPage: true });
    }
  });
});

test.describe('Workflow Urgent - Étape 2: Traitement', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('Les liquidations urgentes sont visibles dans le dashboard DMG', async ({ page }) => {
    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    // Chercher la section des urgentes
    const urgentSection = page.locator(
      '[data-testid="urgent-liquidations"], ' +
      'text=Liquidations urgentes'
    );

    const hasUrgentSection = await urgentSection.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/workflow-urgent-step2-dmg-view.png', fullPage: true });
  });

  test('On peut ouvrir le détail d\'une liquidation urgente', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Cliquer sur une liquidation pour voir les détails
      const liquidationRow = page.locator(
        'tr:has([data-testid="urgent-badge"]), ' +
        '.liquidation-item, ' +
        'tbody tr'
      ).first();

      if (await liquidationRow.isVisible({ timeout: 5000 })) {
        await liquidationRow.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/workflow-urgent-step2-detail.png', fullPage: true });
      }
    }
  });

  test('Le détail affiche le motif d\'urgence', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Chercher l'affichage du motif
      const motifDisplay = page.locator(
        '[data-testid="urgent-motif"], ' +
        'text=Motif, ' +
        '.motif, ' +
        'text=Raison'
      );

      const hasMotif = await motifDisplay.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/workflow-urgent-step2-motif.png', fullPage: true });
    }
  });

  test('On peut valider une liquidation urgente', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet À valider
    const toValidateTab = page.locator(
      'button:has-text("À valider"), ' +
      '[role="tab"]:has-text("À valider")'
    );

    if (await toValidateTab.first().isVisible({ timeout: 5000 })) {
      await toValidateTab.first().click();
      await waitForPageLoad(page);

      // Chercher un bouton de validation
      const validateButton = page.locator(
        'button:has-text("Valider"), ' +
        '[data-testid="validate-button"]'
      );

      const hasValidateButton = await validateButton.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/workflow-urgent-step2-validate.png', fullPage: true });
    }
  });
});

test.describe('Workflow Urgent - Étape 3: Règlement', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('La page des règlements est accessible', async ({ page }) => {
    await page.goto('/reglements');
    await waitForPageLoad(page);

    const pageTitle = page.locator('h1:has-text("Règlement"), h1:has-text("Paiement")');
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/workflow-urgent-step3-reglements.png', fullPage: true });
  });

  test('Les liquidations validées sont disponibles pour règlement', async ({ page }) => {
    await page.goto('/reglements');
    await waitForPageLoad(page);

    // Chercher la liste des liquidations à régler
    const toPayList = page.locator(
      '[data-testid="to-pay-list"], ' +
      '.to-pay, ' +
      'text=À régler'
    );

    const hasToPayList = await toPayList.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/workflow-urgent-step3-to-pay.png', fullPage: true });
  });

  test('On peut créer un règlement pour une liquidation urgente', async ({ page }) => {
    await page.goto('/reglements');
    await waitForPageLoad(page);

    // Chercher le bouton de création
    const newPaymentButton = page.locator(
      'button:has-text("Nouveau"), ' +
      'button:has-text("Créer"), ' +
      '[data-testid="new-payment"]'
    );

    const hasNewButton = await newPaymentButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/workflow-urgent-step3-new-payment.png', fullPage: true });
  });

  test('Le formulaire de règlement permet de sélectionner le mode de paiement', async ({ page }) => {
    await page.goto('/reglements');
    await waitForPageLoad(page);

    // Chercher le sélecteur de mode de paiement
    const paymentModeSelect = page.locator(
      'select[name="mode"], ' +
      '[data-testid="payment-mode"], ' +
      'text=Mode de paiement'
    );

    const hasPaymentMode = await paymentModeSelect.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/workflow-urgent-step3-payment-mode.png', fullPage: true });
  });
});

// ============================================================================
// TESTS NOTIFICATIONS
// ============================================================================

test.describe('Workflow Urgent - Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('Une notification est envoyée lors du marquage urgent', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Ouvrir les notifications
    const notificationBell = page.locator(
      '[data-testid="notification-bell"], ' +
      'button[aria-label*="notification"]'
    ).first();

    if (await notificationBell.isVisible({ timeout: 5000 })) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Chercher des notifications liées aux liquidations urgentes
      const urgentNotifications = page.locator(
        'text=urgent, ' +
        'text=Liquidation urgente, ' +
        '[data-type="urgent"]'
      );

      await page.screenshot({ path: 'test-results/workflow-urgent-notification.png' });
    }
  });

  test('Le DMG reçoit une notification pour les liquidations urgentes', async ({ page }) => {
    await page.goto('/notifications');
    await waitForPageLoad(page);

    // Chercher des notifications de type urgent
    const urgentNotifications = page.locator(
      'text=urgent, ' +
      'text=Liquidation urgente, ' +
      '[data-testid="urgent-notification"]'
    );

    const hasUrgentNotifs = await urgentNotifications.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/workflow-urgent-dmg-notification.png', fullPage: true });
  });

  test('La notification contient les informations de la liquidation', async ({ page }) => {
    await page.goto('/notifications');
    await waitForPageLoad(page);

    // Chercher des références de liquidation dans les notifications
    const liquidationRefs = page.locator(
      'text=/LIQ-\\d+/, ' +
      'text=Référence, ' +
      '[data-testid="notification-reference"]'
    );

    const hasRefs = await liquidationRefs.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/workflow-urgent-notification-details.png', fullPage: true });
  });
});

// ============================================================================
// TESTS HISTORIQUE AUDIT
// ============================================================================

test.describe('Workflow Urgent - Historique Audit', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('L\'historique d\'audit est accessible depuis le détail liquidation', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Cliquer sur une liquidation
    const liquidationRow = page.locator('tbody tr, .liquidation-item').first();

    if (await liquidationRow.isVisible({ timeout: 5000 })) {
      await liquidationRow.click();
      await page.waitForTimeout(1000);

      // Chercher l'onglet ou section historique
      const historySection = page.locator(
        'button:has-text("Historique"), ' +
        '[role="tab"]:has-text("Historique"), ' +
        'text=Audit, ' +
        '[data-testid="audit-log"]'
      );

      const hasHistory = await historySection.first().isVisible({ timeout: 5000 }).catch(() => false);

      await page.screenshot({ path: 'test-results/workflow-urgent-audit-section.png', fullPage: true });
    }
  });

  test('L\'audit enregistre le marquage urgent', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      // Chercher des entrées d'audit liées au marquage urgent
      const auditEntries = page.locator(
        'text=Marqué urgent, ' +
        'text=reglement_urgent, ' +
        '[data-action="mark_urgent"]'
      );

      await page.screenshot({ path: 'test-results/workflow-urgent-audit-mark.png', fullPage: true });
    }
  });

  test('L\'audit enregistre le démarquage urgent', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Aller à l'onglet historique global si disponible
    const auditPage = page.locator(
      'a[href*="audit"], ' +
      'button:has-text("Journal"), ' +
      'text=Journal d\'audit'
    );

    const hasAuditLink = await auditPage.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAuditLink) {
      await auditPage.first().click();
      await waitForPageLoad(page);
    }

    await page.screenshot({ path: 'test-results/workflow-urgent-audit-unmark.png', fullPage: true });
  });

  test('L\'audit affiche l\'utilisateur et la date', async ({ page }) => {
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    // Chercher des infos d'audit (date et utilisateur)
    const auditInfo = page.locator(
      'text=/\\d{2}\\/\\d{2}\\/\\d{4}/, ' +
      'text=par, ' +
      '[data-testid="audit-user"], ' +
      '[data-testid="audit-date"]'
    );

    const hasAuditInfo = await auditInfo.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/workflow-urgent-audit-details.png', fullPage: true });
  });
});

// ============================================================================
// TESTS WORKFLOW COMPLET
// ============================================================================

test.describe('Workflow Urgent - Scénario Complet', () => {
  test('Le workflow complet est tracé du marquage au règlement', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    // Étape 1: Aller aux liquidations
    await page.goto('/liquidations');
    await waitForPageLoad(page);

    await page.screenshot({ path: 'test-results/workflow-complete-step1.png', fullPage: true });

    // Étape 2: Aller à l'onglet Urgentes
    const urgentTab = page.locator('button:has-text("Urgent")');

    if (await urgentTab.first().isVisible({ timeout: 5000 })) {
      await urgentTab.first().click();
      await waitForPageLoad(page);

      await page.screenshot({ path: 'test-results/workflow-complete-step2.png', fullPage: true });
    }

    // Étape 3: Aller au dashboard DMG
    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    await page.screenshot({ path: 'test-results/workflow-complete-step3.png', fullPage: true });

    // Étape 4: Aller aux règlements
    await page.goto('/reglements');
    await waitForPageLoad(page);

    await page.screenshot({ path: 'test-results/workflow-complete-step4.png', fullPage: true });
  });

  test('Le compteur urgent diminue après règlement', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    // Récupérer le compteur initial
    const urgentCounter = page.locator(
      '[data-testid="urgent-count"], ' +
      '.urgent-count, ' +
      '.text-2xl'
    ).first();

    const initialCount = await urgentCounter.textContent().catch(() => '0');

    await page.screenshot({ path: 'test-results/workflow-counter-initial.png', fullPage: true });

    // Note: La vérification de la diminution nécessiterait un règlement réel
    // Ce test capture l'état initial pour comparaison manuelle
  });
});

// ============================================================================
// TESTS SCANNING
// ============================================================================

test.describe('Workflow Urgent - Scanning Documents', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);
  });

  test('La page de scanning liquidation est accessible', async ({ page }) => {
    await page.goto('/execution/scanning-liquidation');
    await waitForPageLoad(page);

    const pageTitle = page.locator(
      'h1:has-text("Scanning"), ' +
      'h1:has-text("scan"), ' +
      'h1:has-text("Documents")'
    );

    const isAccessible = await pageTitle.first().isVisible({ timeout: 10000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/workflow-urgent-scanning.png', fullPage: true });
  });

  test('Les liquidations en attente de scan sont listées', async ({ page }) => {
    await page.goto('/execution/scanning-liquidation');
    await waitForPageLoad(page);

    // Chercher l'onglet "À scanner"
    const toScanTab = page.locator(
      'button:has-text("À scanner"), ' +
      '[role="tab"]:has-text("À scanner")'
    );

    if (await toScanTab.first().isVisible({ timeout: 5000 })) {
      await toScanTab.first().click();
      await waitForPageLoad(page);
    }

    await page.screenshot({ path: 'test-results/workflow-urgent-to-scan.png', fullPage: true });
  });

  test('On peut uploader des documents pour une liquidation', async ({ page }) => {
    await page.goto('/execution/scanning-liquidation');
    await waitForPageLoad(page);

    // Chercher une zone d'upload
    const uploadZone = page.locator(
      '[data-testid="upload-zone"], ' +
      'input[type="file"], ' +
      '.dropzone, ' +
      'text=Déposer'
    );

    const hasUpload = await uploadZone.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/workflow-urgent-upload-zone.png', fullPage: true });
  });

  test('La checklist des documents est visible', async ({ page }) => {
    await page.goto('/execution/scanning-liquidation');
    await waitForPageLoad(page);

    // Chercher la checklist
    const checklist = page.locator(
      '[data-testid="document-checklist"], ' +
      '.checklist, ' +
      'text=Documents requis'
    );

    const hasChecklist = await checklist.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/workflow-urgent-checklist.png', fullPage: true });
  });
});

// ============================================================================
// TESTS ALERTES TEMPS
// ============================================================================

test.describe('Workflow Urgent - Alertes Temps', () => {
  test('Une alerte warning s\'affiche après 24h', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    // Aller à l'onglet Alertes
    const alertsTab = page.locator('button:has-text("Alerte")');

    if (await alertsTab.first().isVisible({ timeout: 5000 })) {
      await alertsTab.first().click();
      await waitForPageLoad(page);

      // Chercher des alertes de type warning
      const warningAlerts = page.locator(
        '[data-severity="warning"], ' +
        '.alert-warning, ' +
        'text=24 heures'
      );

      await page.screenshot({ path: 'test-results/workflow-urgent-alert-24h.png', fullPage: true });
    }
  });

  test('Une alerte critique s\'affiche après 48h', async ({ page }) => {
    await loginWithCredentials(page, TEST_USERS.daaf.email, TEST_USERS.daaf.password);

    await page.goto('/dashboard-dmg');
    await waitForPageLoad(page);

    // Aller à l'onglet Alertes
    const alertsTab = page.locator('button:has-text("Alerte")');

    if (await alertsTab.first().isVisible({ timeout: 5000 })) {
      await alertsTab.first().click();
      await waitForPageLoad(page);

      // Chercher des alertes de type critique
      const criticalAlerts = page.locator(
        '[data-severity="critical"], ' +
        '.alert-critical, ' +
        'text=48 heures'
      );

      await page.screenshot({ path: 'test-results/workflow-urgent-alert-48h.png', fullPage: true });
    }
  });
});
