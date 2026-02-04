/**
 * Tests E2E - Page de vérification publique
 *
 * Vérifie l'accès sans authentification, l'affichage des informations
 * pour les hash valides et les messages d'erreur pour les invalides.
 */

import { test, expect, Page } from '@playwright/test';
import { waitForPageLoad } from '../fixtures/auth';

// Payload de test valide (encodé en base64 URL-safe)
function createValidPayload(): string {
  const payload = {
    reference: 'ARTI00126TEST',
    type: 'NOTE_SEF',
    dateValidation: new Date().toISOString(),
    validateur: 'Jean DUPONT (DG)',
    checksum: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd', // 64 chars
    timestamp: Date.now(),
  };

  const jsonString = JSON.stringify(payload);
  const base64 = Buffer.from(jsonString).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64;
}

// Payload invalide
function createInvalidPayload(): string {
  return 'invalid-hash-data-that-will-fail-verification';
}

// Payload avec checksum corrompu
function createCorruptedPayload(): string {
  const payload = {
    reference: 'ARTI00126CORRUPT',
    type: 'NOTE_SEF',
    dateValidation: new Date().toISOString(),
    validateur: 'Test User',
    checksum: 'short', // Checksum trop court (invalide)
    timestamp: Date.now(),
  };

  const jsonString = JSON.stringify(payload);
  const base64 = Buffer.from(jsonString).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64;
}

test.describe('Page de vérification - Accès public', () => {
  test('La page /verify est accessible sans authentification', async ({ page }) => {
    // Vérifier qu'on n'est pas redirigé vers login
    await page.goto('/verify/test');

    // Attendre le chargement
    await waitForPageLoad(page);

    // Vérifier qu'on est toujours sur /verify (pas redirigé vers /login)
    expect(page.url()).toContain('/verify');
    expect(page.url()).not.toContain('/login');
  });

  test('La page affiche le branding ARTI', async ({ page }) => {
    await page.goto('/verify/test');
    await waitForPageLoad(page);

    // Vérifier le logo ou le nom ARTI
    const artiElement = page.locator('text=ARTI, img[alt*="ARTI"]');
    await expect(artiElement.first()).toBeVisible({ timeout: 10000 });

    // Vérifier le titre SYGFP
    const sygfpElement = page.locator('text=SYGFP, text=Vérification');
    await expect(sygfpElement.first()).toBeVisible({ timeout: 5000 });
  });

  test('La page a un titre descriptif', async ({ page }) => {
    await page.goto('/verify/test');
    await waitForPageLoad(page);

    // Vérifier le titre de la page
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/(sygfp|vérification|arti)/);
  });
});

test.describe('Page de vérification - Hash valide', () => {
  test('Un hash valide affiche "Document authentique"', async ({ page }) => {
    const validHash = createValidPayload();
    await page.goto(`/verify/${validHash}`);
    await waitForPageLoad(page);

    // Attendre que la vérification soit terminée
    await page.waitForSelector('text=Vérification en cours', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Vérifier le message de succès
    const successMessage = page.locator('text=Document authentique, text=authentique, text=vérifié');
    await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('Les informations du document sont affichées correctement', async ({ page }) => {
    const validHash = createValidPayload();
    await page.goto(`/verify/${validHash}`);
    await waitForPageLoad(page);

    // Attendre la fin de la vérification
    await page.waitForSelector('text=Vérification en cours', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Vérifier la référence
    await expect(page.locator('text=ARTI00126TEST')).toBeVisible({ timeout: 5000 });

    // Vérifier le type de document
    await expect(page.locator('text=Note SEF, text=NOTE_SEF')).toBeVisible({ timeout: 5000 });

    // Vérifier le validateur
    await expect(page.locator('text=Jean DUPONT, text=DG')).toBeVisible({ timeout: 5000 });
  });

  test('La date de validation est formatée en français', async ({ page }) => {
    const validHash = createValidPayload();
    await page.goto(`/verify/${validHash}`);
    await waitForPageLoad(page);

    // Attendre la fin de la vérification
    await page.waitForSelector('text=Vérification en cours', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Vérifier le format de date français (ex: "29 janvier 2026" ou "29/01/2026")
    const datePattern = page.locator('text=/\\d{1,2}\\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\\s+\\d{4}|\\d{2}\\/\\d{2}\\/\\d{4}/');
    await expect(datePattern.first()).toBeVisible({ timeout: 5000 });
  });

  test('La signature (checksum partiel) est affichée', async ({ page }) => {
    const validHash = createValidPayload();
    await page.goto(`/verify/${validHash}`);
    await waitForPageLoad(page);

    // Attendre la fin de la vérification
    await page.waitForSelector('text=Vérification en cours', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Vérifier qu'une signature/checksum est affichée
    const signatureElement = page.locator('text=Signature, text=a1b2c3d4, .checksum, [data-testid="checksum"]');
    await expect(signatureElement.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Page de vérification - Hash invalide', () => {
  test('Un hash invalide affiche "Document non trouvé"', async ({ page }) => {
    const invalidHash = createInvalidPayload();
    await page.goto(`/verify/${invalidHash}`);
    await waitForPageLoad(page);

    // Attendre que la vérification soit terminée
    await page.waitForSelector('text=Vérification en cours', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Vérifier le message d'erreur
    const errorMessage = page.locator('text=Document non trouvé, text=non trouvé, text=invalide');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('Un hash corrompu affiche un message d\'erreur', async ({ page }) => {
    const corruptedHash = createCorruptedPayload();
    await page.goto(`/verify/${corruptedHash}`);
    await waitForPageLoad(page);

    // Attendre la fin de la vérification
    await page.waitForSelector('text=Vérification en cours', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Vérifier qu'une erreur est affichée
    const errorIndicator = page.locator('[class*="red"], [class*="error"], text=invalide, text=erreur');
    await expect(errorIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('L\'avertissement de falsification possible est affiché', async ({ page }) => {
    const invalidHash = createInvalidPayload();
    await page.goto(`/verify/${invalidHash}`);
    await waitForPageLoad(page);

    // Attendre la fin de la vérification
    await page.waitForSelector('text=Vérification en cours', { state: 'hidden', timeout: 10000 }).catch(() => {});

    // Vérifier le message d'avertissement
    const warningMessage = page.locator('text=Attention, text=erreur, text=altéré, text=contacter');
    await expect(warningMessage.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Page de vérification - Sans hash', () => {
  test('Sans hash, un message approprié est affiché', async ({ page }) => {
    await page.goto('/verify');
    await waitForPageLoad(page);

    // Ou avec un hash vide
    await page.goto('/verify/');
    await waitForPageLoad(page);

    // Vérifier le message
    const message = page.locator('text=Aucun code, text=Scannez, text=QR code, text=vérification');
    await expect(message.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Page de vérification - Navigation', () => {
  test('Le bouton "Retour à l\'accueil" est présent', async ({ page }) => {
    await page.goto(`/verify/${createValidPayload()}`);
    await waitForPageLoad(page);

    // Chercher le bouton de retour
    const backButton = page.locator('a:has-text("Retour"), button:has-text("Retour"), a:has-text("Accueil")');
    await expect(backButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('Le bouton de retour redirige vers l\'accueil', async ({ page }) => {
    await page.goto(`/verify/${createValidPayload()}`);
    await waitForPageLoad(page);

    // Cliquer sur le bouton de retour
    const backButton = page.locator('a:has-text("Retour"), a:has-text("Accueil")').first();
    await backButton.click();

    // Vérifier la redirection
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });
});

test.describe('Page de vérification - Responsive', () => {
  test('La page s\'affiche correctement sur mobile', async ({ page }) => {
    // Définir la taille d'écran mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/verify/${createValidPayload()}`);
    await waitForPageLoad(page);

    // Vérifier que les éléments principaux sont visibles
    const card = page.locator('[class*="card"], .card, main');
    await expect(card.first()).toBeVisible({ timeout: 10000 });

    // Vérifier qu'il n'y a pas de défilement horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // +5 pour la tolérance
  });
});

test.describe('Page de vérification - Sécurité', () => {
  test('La page n\'expose pas d\'informations sensibles', async ({ page }) => {
    await page.goto(`/verify/${createValidPayload()}`);
    await waitForPageLoad(page);

    const content = await page.content();

    // Vérifier qu'aucun token ou clé n'est exposé
    expect(content).not.toContain('SECRET_KEY');
    expect(content).not.toContain('SUPABASE_KEY');
    expect(content).not.toContain('API_KEY');
  });

  test('Les scripts malveillants dans le hash sont neutralisés', async ({ page }) => {
    // Tenter une injection XSS via le hash
    const xssPayload = '<script>alert("XSS")</script>';
    const encodedXss = Buffer.from(xssPayload).toString('base64');

    await page.goto(`/verify/${encodedXss}`);
    await waitForPageLoad(page);

    // Vérifier qu'aucune alerte n'a été déclenchée
    page.on('dialog', async dialog => {
      await dialog.dismiss();
      throw new Error('XSS vulnerability detected!');
    });

    // Attendre un peu pour s'assurer qu'aucune alerte ne se déclenche
    await page.waitForTimeout(1000);
  });
});
