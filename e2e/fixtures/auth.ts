/**
 * Fixtures d'authentification pour les tests E2E
 *
 * Fournit des helpers pour la connexion avec différents profils
 */

import { Page, expect } from '@playwright/test';

// Utilisateurs de test
export const TEST_USERS = {
  agent: {
    email: 'agent.dsi@arti.ci',
    password: 'Test2026!',
    role: 'AGENT',
    direction: 'DSI',
  },
  dg: {
    email: 'dg@arti.ci',
    password: 'Test2026!',
    role: 'DG',
    direction: 'DG',
  },
  daaf: {
    email: 'daaf@arti.ci',
    password: 'Test2026!',
    role: 'DAAF',
    direction: 'DAAF',
  },
  admin: {
    email: 'admin@arti.ci',
    password: 'Test2026!',
    role: 'ADMIN',
    direction: 'ADMIN',
  },
} as const;

export type TestUserKey = keyof typeof TEST_USERS;

/**
 * Se connecter avec un utilisateur spécifique
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Naviguer vers la page de login
  await page.goto('/auth');

  // Attendre que le formulaire soit visible
  await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

  // Remplir le formulaire
  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill(password);

  // Soumettre
  await page.locator('button[type="submit"]').click();

  // Attendre la redirection vers le dashboard (ou la page d'accueil)
  await page.waitForURL('/', { timeout: 15000 });

  // Vérifier que la connexion a réussi (présence d'un élément du dashboard)
  await expect(page.locator('[data-testid="user-menu"], .sidebar, nav')).toBeVisible({ timeout: 10000 });
}

/**
 * Se connecter avec un utilisateur de test prédéfini
 */
export async function loginAsUser(
  page: Page,
  userKey: TestUserKey
): Promise<void> {
  const user = TEST_USERS[userKey];
  await loginAs(page, user.email, user.password);
}

/**
 * Se déconnecter
 */
export async function logout(page: Page): Promise<void> {
  // Cliquer sur le menu utilisateur et se déconnecter
  const userMenu = page.locator('[data-testid="user-menu"], [aria-label="Menu utilisateur"]');

  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.locator('text=Déconnexion').click();
    await page.waitForURL('/auth', { timeout: 10000 });
  } else {
    // Alternative : naviguer directement vers la page de déconnexion
    await page.goto('/auth');
  }
}

/**
 * Vérifier si l'utilisateur est connecté
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"], .sidebar, nav', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifier que l'utilisateur a accès à une page
 */
export async function verifyPageAccess(
  page: Page,
  url: string,
  expectedTitle?: RegExp | string
): Promise<void> {
  await page.goto(url);

  // Vérifier qu'on n'est pas redirigé vers la page de login
  await expect(page).not.toHaveURL('/auth');

  if (expectedTitle) {
    await expect(page).toHaveTitle(expectedTitle);
  }
}

/**
 * Attendre que le chargement soit terminé
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  // Attendre que les spinners de chargement disparaissent
  await page.waitForLoadState('networkidle');

  // Attendre que les Skeleton ne soient plus visibles
  const skeletons = page.locator('[class*="skeleton"], [class*="Skeleton"]');
  const skeletonCount = await skeletons.count();

  if (skeletonCount > 0) {
    await expect(skeletons.first()).toBeHidden({ timeout: 15000 });
  }
}

/**
 * Sélectionner un exercice si nécessaire
 */
export async function selectExercice(
  page: Page,
  annee?: number
): Promise<void> {
  const exerciceSelector = page.locator('[data-testid="exercice-selector"], [aria-label="Sélectionner un exercice"]');

  if (await exerciceSelector.isVisible()) {
    await exerciceSelector.click();

    if (annee) {
      await page.locator(`text=${annee}`).click();
    } else {
      // Sélectionner le premier exercice disponible
      await page.locator('[role="option"]').first().click();
    }

    await waitForPageLoad(page);
  }
}

/**
 * Raccourci pour se connecter en tant qu'agent
 */
export async function loginAsAgent(page: Page): Promise<void> {
  await loginAsUser(page, 'agent');
}

/**
 * Raccourci pour se connecter en tant que DG
 */
export async function loginAsDG(page: Page): Promise<void> {
  await loginAsUser(page, 'dg');
}

/**
 * Raccourci pour se connecter en tant que DAAF
 */
export async function loginAsDAAF(page: Page): Promise<void> {
  await loginAsUser(page, 'daaf');
}

/**
 * Raccourci pour se connecter en tant qu'admin
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAsUser(page, 'admin');
}
