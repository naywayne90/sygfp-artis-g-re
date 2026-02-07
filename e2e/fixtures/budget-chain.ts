/**
 * Fixtures partagees pour les tests E2E de la chaine budgetaire
 *
 * Helpers et selecteurs communs pour Engagements, Liquidations,
 * Ordonnancements et Reglements.
 */

import { Page, expect } from '@playwright/test';
import { waitForPageLoad } from './auth';

// Donnees de test pour les engagements
export const TEST_ENGAGEMENT = {
  objet: `Engagement Test E2E - ${Date.now()}`,
  montant: 2500000,
  fournisseur: 'Fournisseur Test',
};

// Donnees de test pour les liquidations
export const TEST_LIQUIDATION = {
  montant: 2500000,
  observation: 'Liquidation test E2E automatise',
};

// Donnees de test pour les reglements
export const TEST_REGLEMENT = {
  montant: 1000000,
  mode_paiement: 'virement',
  reference_paiement: `REF-TEST-${Date.now()}`,
  observation: 'Reglement test E2E automatise',
};

// Selecteurs communs a la chaine budgetaire
export const CHAIN_SELECTORS = {
  // Elements communs
  common: {
    searchInput: 'input[placeholder*="Rechercher"]',
    loadingSpinner: '[class*="animate-spin"], .loading',
    toastSuccess: '[data-sonner-toast][data-type="success"], [role="alert"]',
    toastError: '[data-sonner-toast][data-type="error"]',
    confirmBtn: 'button:has-text("Confirmer")',
    cancelBtn: 'button:has-text("Annuler")',
    dialog: 'dialog, [role="dialog"]',
    emptyState: '.text-center.py-12',
  },
  // Page Engagements
  engagements: {
    pageTitle: 'h1:has-text("Engagements")',
    newBtn: 'button:has-text("Nouvel engagement")',
    tabs: {
      aTraiter: 'button[role="tab"]:has-text("traiter")',
      tous: 'button[role="tab"]:has-text("Tous")',
      aValider: 'button[role="tab"]:has-text("valider")',
      valides: 'button[role="tab"]:has-text("Valid")',
      rejetes: 'button[role="tab"]:has-text("Rejet")',
      differes: 'button[role="tab"]:has-text("Diff")',
    },
    actions: {
      view: 'button:has-text("Voir"), [aria-label="Voir"]',
      validate: 'button:has-text("Valider")',
      reject: 'button:has-text("Rejeter")',
      defer: 'button:has-text("Diff")',
      submit: 'button:has-text("Soumettre")',
      createLiquidation: 'button:has-text("Liquidation")',
    },
  },
  // Page Liquidations
  liquidations: {
    pageTitle: 'h1:has-text("Liquidations")',
    newBtn: 'button:has-text("Nouvelle liquidation")',
    tabs: {
      aTraiter: 'button[role="tab"]:has-text("traiter")',
      tous: 'button[role="tab"]:has-text("Tous")',
      aValider: 'button[role="tab"]:has-text("valider")',
      valides: 'button[role="tab"]:has-text("Valid")',
      rejetes: 'button[role="tab"]:has-text("Rejet")',
    },
    actions: {
      view: 'button:has-text("Voir"), [aria-label="Voir"]',
      validate: 'button:has-text("Valider")',
      reject: 'button:has-text("Rejeter")',
      defer: 'button:has-text("Diff")',
      submit: 'button:has-text("Soumettre")',
    },
  },
  // Page Reglements
  reglements: {
    pageTitle: 'h1:has-text("glements"), h2:has-text("glements")',
    newBtn: 'button:has-text("Enregistrer un r"), button:has-text("glement")',
    tabs: {
      aPayer: 'button[role="tab"]:has-text("payer")',
      tous: 'button[role="tab"]:has-text("Tous")',
      soldes: 'button[role="tab"]:has-text("Sold")',
      partiels: 'button[role="tab"]:has-text("Partiel")',
    },
    actions: {
      payer: 'button:has-text("Payer")',
      view: 'button:has-text("Voir"), [aria-label="Voir"]',
    },
  },
};

/**
 * Naviguer vers la page des engagements
 */
export async function navigateToEngagements(page: Page): Promise<void> {
  await page.goto('/engagements');
  await waitForPageLoad(page);
  await expect(page.locator(CHAIN_SELECTORS.engagements.pageTitle)).toBeVisible({ timeout: 15000 });
}

/**
 * Naviguer vers la page des liquidations
 */
export async function navigateToLiquidations(page: Page): Promise<void> {
  await page.goto('/liquidations');
  await waitForPageLoad(page);
  await expect(page.locator(CHAIN_SELECTORS.liquidations.pageTitle)).toBeVisible({
    timeout: 15000,
  });
}

/**
 * Naviguer vers la page des reglements
 */
export async function navigateToReglements(page: Page): Promise<void> {
  await page.goto('/reglements');
  await waitForPageLoad(page);
  await expect(page.locator('h1, h2').filter({ hasText: /glements/i })).toBeVisible({
    timeout: 15000,
  });
}

/**
 * Rechercher un element dans la liste
 */
export async function searchInList(page: Page, query: string): Promise<void> {
  const searchInput = page.locator(CHAIN_SELECTORS.common.searchInput);
  if (await searchInput.isVisible({ timeout: 3000 })) {
    await searchInput.fill(query);
    await waitForPageLoad(page);
  }
}

/**
 * Cliquer sur un onglet de la page
 */
export async function clickTab(page: Page, tabSelector: string): Promise<void> {
  const tab = page.locator(tabSelector).first();
  if (await tab.isVisible({ timeout: 5000 })) {
    await tab.click();
    await waitForPageLoad(page);
  }
}

/**
 * Verifier qu'un toast de succes s'affiche
 */
export async function expectSuccessToast(page: Page): Promise<void> {
  await expect(page.locator('[data-sonner-toast], [role="alert"], .toast').first()).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Confirmer un dialog (cliquer sur Confirmer)
 */
export async function confirmDialog(page: Page): Promise<void> {
  const confirmBtn = page.locator(CHAIN_SELECTORS.common.confirmBtn);
  if (await confirmBtn.isVisible({ timeout: 3000 })) {
    await confirmBtn.click();
  }
}

/**
 * Attendre que le dialog se ferme
 */
export async function waitForDialogClose(page: Page): Promise<void> {
  await page
    .waitForSelector(CHAIN_SELECTORS.common.dialog, {
      state: 'hidden',
      timeout: 10000,
    })
    .catch(() => {
      // Dialog may already be closed
    });
}

/**
 * Verifier le nombre de lignes dans un tableau
 */
export async function getTableRowCount(page: Page): Promise<number> {
  await waitForPageLoad(page);
  return page.locator('table tbody tr').count();
}
