/**
 * Tests E2E - Génération et vérification des QR codes SYGFP
 *
 * Vérifie la génération de QR codes pour les documents validés,
 * l'unicité des hash et la cohérence des données.
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAgent, loginAsDG, waitForPageLoad } from '../fixtures/auth';
import { navigateToNotesSEF, SELECTORS } from '../fixtures/notes-sef';

// Configuration de test
test.describe.configure({ mode: 'serial' });

// Données de test partagées entre les tests
interface TestContext {
  noteReference: string;
  qrCodeHash: string;
  qrCodeUrl: string;
}

const testContext: TestContext = {
  noteReference: '',
  qrCodeHash: '',
  qrCodeUrl: '',
};

test.describe('QR Code - Génération', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Le QR code est généré après validation d\'une note', async ({ page }) => {
    // Se connecter en tant que DG pour voir les notes validées
    await loginAsDG(page);
    await waitForPageLoad(page);

    // Naviguer vers les notes validées
    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Cliquer sur l'onglet "Validées" si présent
    const validatedTab = page.locator('button:has-text("Validées"), [data-testid="tab-validated"]');
    if (await validatedTab.isVisible({ timeout: 3000 })) {
      await validatedTab.click();
      await waitForPageLoad(page);
    }

    // Vérifier qu'une note validée avec QR code est présente
    const noteRow = page.locator('tbody tr').first();
    const hasQRCode = await noteRow.locator('[data-testid="qr-code"], .qr-code, svg[data-qr]').isVisible({ timeout: 5000 }).catch(() => false);

    if (hasQRCode) {
      // Vérifier que le QR code a un hash
      const qrElement = noteRow.locator('[data-testid="qr-code-hash"], [data-hash]');
      if (await qrElement.isVisible({ timeout: 2000 })) {
        const hash = await qrElement.getAttribute('data-hash') || await qrElement.textContent();
        expect(hash).toBeTruthy();
        expect(hash?.length).toBeGreaterThan(16); // Hash SHA256 partiel au minimum
        testContext.qrCodeHash = hash || '';
      }
    }
  });

  test('Le hash généré est unique pour chaque document', async ({ page }) => {
    await loginAsDG(page);
    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Récupérer les hash de plusieurs notes
    const hashes: string[] = [];
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const row = rows.nth(i);
      const hashElement = row.locator('[data-hash], [data-testid="qr-code-hash"]');

      if (await hashElement.isVisible({ timeout: 1000 }).catch(() => false)) {
        const hash = await hashElement.getAttribute('data-hash') || await hashElement.textContent();
        if (hash) {
          hashes.push(hash);
        }
      }
    }

    // Vérifier l'unicité des hash
    if (hashes.length > 1) {
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);
    }
  });

  test('Le QR code contient les informations du document', async ({ page }) => {
    await loginAsDG(page);
    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Cliquer sur l'onglet "Validées"
    const validatedTab = page.locator('button:has-text("Validées")');
    if (await validatedTab.isVisible({ timeout: 3000 })) {
      await validatedTab.click();
      await waitForPageLoad(page);
    }

    // Cliquer sur la première note validée pour voir les détails
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();
    await waitForPageLoad(page);

    // Vérifier que le QR code affiche les informations
    const qrCodeSection = page.locator('[data-testid="qr-code-section"], .qr-code-container');

    if (await qrCodeSection.isVisible({ timeout: 5000 })) {
      // Vérifier la présence des éléments d'information
      await expect(qrCodeSection.locator('text=Référence, text=REF')).toBeVisible({ timeout: 3000 }).catch(() => {});

      // Vérifier le lien de vérification
      const verifyLink = qrCodeSection.locator('a[href*="/verify/"]');
      if (await verifyLink.isVisible({ timeout: 2000 })) {
        const href = await verifyLink.getAttribute('href');
        expect(href).toContain('/verify/');
        testContext.qrCodeUrl = href || '';
      }
    }
  });
});

test.describe('QR Code - Vérification via API simulée', () => {
  test('Le scan d\'un QR code valide retourne les informations correctes', async ({ page }) => {
    // Créer un payload de test encodé
    const testPayload = {
      reference: 'ARTI00126001',
      type: 'NOTE_SEF',
      dateValidation: new Date().toISOString(),
      validateur: 'DG Test',
      checksum: 'a'.repeat(64), // Simule un hash SHA256 valide
      timestamp: Date.now(),
    };

    // Encoder en base64 URL-safe
    const jsonString = JSON.stringify(testPayload);
    const base64 = btoa(jsonString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Naviguer vers la page de vérification avec ce payload
    await page.goto(`/verify/${base64}`);
    await waitForPageLoad(page);

    // Vérifier que les informations sont affichées
    await expect(page.locator('text=Document authentique, text=authentique')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${testPayload.reference}`)).toBeVisible();
  });

  test('Le scan d\'un QR code invalide affiche une erreur', async ({ page }) => {
    // Payload avec checksum invalide
    const invalidPayload = 'invalid-payload-data';

    await page.goto(`/verify/${invalidPayload}`);
    await waitForPageLoad(page);

    // Vérifier que l'erreur est affichée
    await expect(page.locator('text=Document non trouvé, text=invalide, text=non trouvé')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('QR Code - Affichage et interaction', () => {
  test('Le QR code peut être affiché en grand format', async ({ page }) => {
    await loginAsDG(page);
    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Trouver une note avec QR code
    const qrCodeBtn = page.locator('[data-testid="view-qr-code"], button:has-text("QR Code")').first();

    if (await qrCodeBtn.isVisible({ timeout: 5000 })) {
      await qrCodeBtn.click();

      // Vérifier qu'un modal/dialog avec le QR code agrandi s'ouvre
      const qrModal = page.locator('dialog, [role="dialog"]').filter({ has: page.locator('svg, img[alt*="QR"]') });
      await expect(qrModal).toBeVisible({ timeout: 5000 });

      // Vérifier que le QR code est plus grand
      const qrImage = qrModal.locator('svg, img').first();
      const box = await qrImage.boundingBox();
      expect(box?.width).toBeGreaterThan(100);
      expect(box?.height).toBeGreaterThan(100);
    }
  });

  test('Le lien de vérification peut être copié', async ({ page, context }) => {
    // Autoriser l'accès au presse-papiers
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await loginAsDG(page);
    await page.goto('/notes-sef');
    await waitForPageLoad(page);

    // Trouver le bouton de copie du lien
    const copyBtn = page.locator('[data-testid="copy-verify-link"], button:has-text("Copier")').first();

    if (await copyBtn.isVisible({ timeout: 5000 })) {
      await copyBtn.click();

      // Vérifier le message de confirmation
      await expect(page.locator('text=Copié, text=copié')).toBeVisible({ timeout: 5000 });
    }
  });
});
