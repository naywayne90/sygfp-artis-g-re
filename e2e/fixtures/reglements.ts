/**
 * Fixtures de donnees pour les tests Reglements E2E
 *
 * Donnees de test et helpers specifiques aux Reglements
 */

import { Page, expect } from '@playwright/test';
import { waitForPageLoad } from './auth';
import * as path from 'path';
import * as fs from 'fs';

// Selecteurs pour la page Reglements
export const SELECTORS = {
  // Page principale
  page: {
    title: 'h1, h2',
    searchInput: 'input[placeholder*="Rechercher"]',
    createBtn: 'button:has-text("Enregistrer un r")',
  },
  // Onglets
  tabs: {
    aTraiter: 'button[role="tab"]:has-text("payer")',
    tous: 'button[role="tab"]:has-text("Tous")',
    soldes: 'button[role="tab"]:has-text("Sold")',
    partiels: 'button[role="tab"]:has-text("Partiel")',
  },
  // Stats cards
  stats: {
    totalReglements: 'text=Total',
    montantTotal: 'text=Montant total',
    soldes: 'text=Ordonnancements sold',
    enAttente: 'text=En attente',
  },
  // Formulaire de creation
  form: {
    ordonnancementSelect: 'button:has-text("Sélectionner un ordonnancement")',
    modePaiement: 'button:has-text("Sélectionner le mode")',
    referencePaiement: 'input[placeholder*="VIR-"]',
    compteBancaire: 'button:has-text("Sélectionner le compte")',
    montant: 'input[type="number"]',
    observation: 'textarea[placeholder*="Observations"]',
    fileUpload: 'input[type="file"]',
    submitBtn: 'button[type="submit"]:has-text("Enregistrer")',
    cancelBtn: 'button:has-text("Annuler")',
    enregistrementEnCours: 'button:has-text("Enregistrement")',
  },
  // Dialog de creation
  dialog: {
    container: 'div[role="dialog"]',
    title: 'text=Enregistrer un',
  },
  // Liste des reglements (onglets Tous/Soldes/Partiels)
  list: {
    table: 'table',
    emptyState: 'text=Aucun',
    row: 'tbody tr',
  },
  // Onglet A traiter (ordonnancements a payer)
  aTraiterList: {
    emptyState: 'text=Aucun ordonnancement en attente',
    payerBtn: 'button:has-text("Payer")',
  },
  // Details (Sheet)
  details: {
    container: '[data-state="open"]',
    title: 'text=Détails du',
    statutSolde: 'text=Soldé',
    statutPartiel: 'text=Partiel',
  },
  // Actions dans le dropdown
  actions: {
    menuBtn: 'button[aria-haspopup="menu"]',
    viewDetails: '[role="menuitem"]:has-text("Voir")',
    printReceipt: '[role="menuitem"]:has-text("Imprimer")',
    cancelReglement: '[role="menuitem"]:has-text("Annuler")',
  },
  // Alert dialogs
  alerts: {
    confirmCancel: 'button:has-text("Confirmer l\'annulation")',
    cancelDialog: 'text=Annuler ce',
    montantInvalide: 'text=Montant invalide',
    reglementComplet: 'text=Règlement complet',
  },
  // Availability section (restant a payer)
  availability: {
    montantOrdonnance: 'text=Montant ordonnancé',
    reglementsAnterieurs: 'text=Règlements antérieurs',
    ceReglement: 'text=Ce règlement',
    restantApres: 'text=Restant après',
    disponible: 'text=Disponible',
    solde: 'text=Soldé',
  },
};

// Modes de paiement disponibles dans l'app
export const MODES_PAIEMENT_LABELS = ['Virement bancaire', 'Chèque', 'Espèces', 'Mobile Money'];

// Alias for backward compatibility with existing tests
export const MODES_PAIEMENT = MODES_PAIEMENT_LABELS;

// Donnees de test pour un reglement
export const TEST_REGLEMENT_DATA = {
  mode_paiement: 'Virement bancaire',
  reference: `VIR-TEST-${Date.now()}`,
  montant: 500000,
  observation: 'Reglement de test E2E automatise',
};

/**
 * Naviguer vers la page des Reglements
 */
export async function navigateToReglements(page: Page): Promise<void> {
  await page.goto('/reglements');
  await waitForPageLoad(page);
  await expect(page.locator(SELECTORS.page.title).filter({ hasText: /glements/i })).toBeVisible({
    timeout: 15000,
  });
}

/**
 * Ouvrir le formulaire de creation de reglement
 */
export async function openCreateDialog(page: Page): Promise<void> {
  const btn = page.locator(SELECTORS.page.createBtn).first();
  await expect(btn).toBeVisible({ timeout: 10000 });
  if (await btn.isEnabled()) {
    await btn.click();
    await expect(page.locator(SELECTORS.dialog.container)).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Selectionner le premier ordonnancement disponible dans le formulaire
 */
export async function selectFirstOrdonnancement(page: Page): Promise<void> {
  const selectTrigger = page
    .locator('button')
    .filter({ hasText: 'Sélectionner un ordonnancement' });
  await selectTrigger.click();
  await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 10000 });
  await page.locator('[role="option"]').first().click();
  // Wait for availability calculation
  await page.waitForTimeout(1500);
}

/**
 * Remplir le formulaire de reglement avec des donnees specifiques
 */
export async function fillReglementForm(
  page: Page,
  data: {
    modePaiement?: string;
    reference?: string;
    montant?: number;
    observation?: string;
  }
): Promise<void> {
  const dialog = page.locator(SELECTORS.dialog.container);

  // Mode de paiement
  if (data.modePaiement) {
    const modeSelect = dialog.locator('button').filter({ hasText: 'Sélectionner le mode' });
    if (await modeSelect.isVisible({ timeout: 3000 })) {
      await modeSelect.click();
      await page.locator(`[role="option"]:has-text("${data.modePaiement}")`).click();
    }
  }

  // Reference de paiement
  if (data.reference) {
    const refInput = dialog.locator(SELECTORS.form.referencePaiement);
    if (await refInput.isVisible({ timeout: 2000 })) {
      await refInput.fill(data.reference);
    }
  }

  // Compte bancaire - select the first available
  const compteSelect = dialog.locator('button').filter({ hasText: 'Sélectionner le compte' });
  if (await compteSelect.isVisible({ timeout: 3000 })) {
    await compteSelect.click();
    await page.locator('[role="option"]').first().click();
  }

  // Montant
  if (data.montant !== undefined) {
    const montantInput = dialog.locator(SELECTORS.form.montant);
    await montantInput.fill(data.montant.toString());
  }

  // Observation
  if (data.observation) {
    const textarea = dialog.locator('textarea');
    if (await textarea.isVisible({ timeout: 2000 })) {
      await textarea.fill(data.observation);
    }
  }
}

/**
 * Soumettre le formulaire de reglement
 * Gere automatiquement le window.confirm pour la preuve de paiement manquante
 */
export async function submitReglementForm(page: Page): Promise<void> {
  // Handle window.confirm for missing proof of payment
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  const dialog = page.locator(SELECTORS.dialog.container);
  const submitBtn = dialog.locator('button[type="submit"]');
  await submitBtn.click();

  // Wait for dialog to close or success toast
  await page
    .waitForSelector(SELECTORS.dialog.container, { state: 'hidden', timeout: 15000 })
    .catch(() => {});

  await waitForPageLoad(page);
}

/**
 * Rechercher dans la liste des reglements
 */
export async function searchReglement(page: Page, query: string): Promise<void> {
  const searchInput = page.locator(SELECTORS.page.searchInput);
  if (await searchInput.isVisible()) {
    await searchInput.fill(query);
    await waitForPageLoad(page);
  }
}

/**
 * Cliquer sur un onglet de la page Reglements
 */
export async function switchTab(
  page: Page,
  tab: 'a_traiter' | 'tous' | 'soldes' | 'partiels'
): Promise<void> {
  const tabSelector = {
    a_traiter: SELECTORS.tabs.aTraiter,
    tous: SELECTORS.tabs.tous,
    soldes: SELECTORS.tabs.soldes,
    partiels: SELECTORS.tabs.partiels,
  }[tab];

  await page.locator(tabSelector).first().click();
  await waitForPageLoad(page);
}

/**
 * Obtenir le nombre de lignes dans le tableau courant
 */
export async function getTableRowCount(page: Page): Promise<number> {
  await waitForPageLoad(page);
  return page.locator('table tbody tr').count();
}

/**
 * Ouvrir le menu d'actions d'un reglement a un index donne
 */
export async function openReglementActions(page: Page, rowIndex: number = 0): Promise<void> {
  const row = page.locator('tbody tr').nth(rowIndex);
  const menuBtn = row.locator(SELECTORS.actions.menuBtn);
  await menuBtn.click();
  await expect(page.locator('[role="menu"]')).toBeVisible({ timeout: 3000 });
}

/**
 * Nettoyer les donnees de test creees
 */
export async function cleanupTestData(page: Page): Promise<void> {
  await page.goto('/');
}

// Dossier de telechargement pour les exports
export const DOWNLOAD_DIR = path.join(process.cwd(), 'test-results', 'downloads');

/**
 * Creer le dossier de telechargement si necessaire
 */
export function ensureDownloadDir(): void {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
}
