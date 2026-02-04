/**
 * Fixtures de données pour les tests Notes SEF
 *
 * Données de test et helpers spécifiques aux Notes SEF
 */

import { Page, expect } from '@playwright/test';
import { waitForPageLoad } from './auth';
import * as path from 'path';
import * as fs from 'fs';

// Données de test pour les Notes SEF
export const TEST_NOTE_SEF = {
  objet: `Note SEF Test E2E - ${Date.now()}`,
  objet_descriptif: 'Description détaillée de la note SEF pour les tests automatisés',
  urgence: 'normale' as const,
  montant: 1500000,
  direction: 'DSI',
};

// Motifs de test
export const TEST_MOTIFS = {
  rejet: 'Note rejetée pour tests automatisés - Documents manquants',
  differe: 'Note différée pour tests automatisés - En attente de validation hiérarchique',
  condition_reprise: 'Fournir les justificatifs complémentaires',
};

// Sélecteurs pour les formulaires et actions
export const SELECTORS = {
  // Formulaire de création
  form: {
    objet: 'input[name="objet"], [data-testid="note-objet"]',
    objetDescriptif: 'textarea[name="objet_descriptif"], [data-testid="note-description"]',
    urgence: '[data-testid="urgence-select"], select[name="urgence"]',
    montant: 'input[name="montant"], [data-testid="note-montant"]',
    submitBtn: 'button[type="submit"], [data-testid="submit-note"]',
    saveAsDraftBtn: '[data-testid="save-draft"]',
  },
  // Liste des notes
  list: {
    table: 'table, [data-testid="notes-table"]',
    row: 'tbody tr, [data-testid="note-row"]',
    emptyState: '[data-testid="empty-state"], .empty-state',
  },
  // Actions
  actions: {
    newNote: 'button:has-text("Nouvelle note SEF"), [data-testid="new-note-btn"]',
    submitNote: 'button:has-text("Soumettre"), [data-testid="submit-btn"]',
    validateBtn: 'button:has-text("Valider"), [data-testid="validate-btn"]',
    rejectBtn: 'button:has-text("Rejeter"), [data-testid="reject-btn"]',
    deferBtn: 'button:has-text("Différer"), [data-testid="defer-btn"]',
    exportBtn: 'button:has-text("Exporter"), [data-testid="export-btn"]',
    exportExcel: 'text=Excel, [data-testid="export-excel"]',
    exportPdf: 'text=PDF, [data-testid="export-pdf"]',
    exportCsv: 'text=CSV, [data-testid="export-csv"]',
  },
  // Dialogs
  dialogs: {
    rejectMotif: 'textarea#reject-motif, [data-testid="reject-motif"]',
    deferMotif: 'textarea#defer-motif, [data-testid="defer-motif"]',
    deferCondition: 'textarea#defer-condition, [data-testid="defer-condition"]',
    confirmReject: 'button:has-text("Confirmer le rejet")',
    confirmDefer: 'button:has-text("Confirmer le report")',
  },
  // Pièces jointes
  attachments: {
    uploadBtn: '[data-testid="upload-attachment"], button:has-text("Ajouter")',
    fileInput: 'input[type="file"]',
    attachmentList: '[data-testid="attachments-list"]',
    attachmentItem: '[data-testid="attachment-item"]',
  },
  // Statuts
  status: {
    brouillon: '[data-testid="status-brouillon"], text=Brouillon',
    soumis: '[data-testid="status-soumis"], text=Soumis',
    valide: '[data-testid="status-valide"], text=Validé',
    differe: '[data-testid="status-differe"], text=Différé',
    rejete: '[data-testid="status-rejete"], text=Rejeté',
  },
  // Référence ARTI
  reference: {
    badge: '[data-testid="reference-arti"], .reference-arti',
    pattern: /ARTI\d{3}26\d{3}/,
  },
};

/**
 * Naviguer vers la page des Notes SEF
 */
export async function navigateToNotesSEF(page: Page): Promise<void> {
  await page.goto('/notes-sef');
  await waitForPageLoad(page);
  await expect(page.locator('h1, h2').filter({ hasText: /Notes SEF/i })).toBeVisible({ timeout: 10000 });
}

/**
 * Naviguer vers la page de validation des Notes SEF
 */
export async function navigateToValidation(page: Page): Promise<void> {
  await page.goto('/notes-sef/validation');
  await waitForPageLoad(page);
  await expect(page.locator('h1, h2').filter({ hasText: /Validation/i })).toBeVisible({ timeout: 10000 });
}

/**
 * Ouvrir le formulaire de création d'une note
 */
export async function openNewNoteForm(page: Page): Promise<void> {
  await page.locator(SELECTORS.actions.newNote).click();
  await expect(page.locator('dialog, [role="dialog"], .modal')).toBeVisible({ timeout: 5000 });
}

/**
 * Remplir le formulaire de création de note SEF
 */
export async function fillNoteForm(
  page: Page,
  data: Partial<typeof TEST_NOTE_SEF> = TEST_NOTE_SEF
): Promise<void> {
  // Objet
  if (data.objet) {
    await page.locator(SELECTORS.form.objet).fill(data.objet);
  }

  // Description
  if (data.objet_descriptif) {
    const descField = page.locator(SELECTORS.form.objetDescriptif);
    if (await descField.isVisible()) {
      await descField.fill(data.objet_descriptif);
    }
  }

  // Urgence
  if (data.urgence) {
    const urgenceSelect = page.locator(SELECTORS.form.urgence);
    if (await urgenceSelect.isVisible()) {
      await urgenceSelect.click();
      await page.locator(`[role="option"]:has-text("${data.urgence}")`).click();
    }
  }

  // Montant
  if (data.montant) {
    const montantField = page.locator(SELECTORS.form.montant);
    if (await montantField.isVisible()) {
      await montantField.fill(data.montant.toString());
    }
  }
}

/**
 * Ajouter une pièce jointe à une note
 */
export async function addAttachment(
  page: Page,
  filePath?: string
): Promise<void> {
  // Créer un fichier de test temporaire si non fourni
  const testFilePath = filePath || createTestFile();

  // Cliquer sur le bouton d'ajout
  const uploadBtn = page.locator(SELECTORS.attachments.uploadBtn);
  if (await uploadBtn.isVisible()) {
    await uploadBtn.click();
  }

  // Uploader le fichier
  const fileInput = page.locator(SELECTORS.attachments.fileInput);
  await fileInput.setInputFiles(testFilePath);

  // Attendre que l'upload soit terminé
  await page.waitForResponse(
    (response) => response.url().includes('storage') && response.status() === 200,
    { timeout: 30000 }
  ).catch(() => {
    // Ignorer si pas de requête de stockage (peut être géré localement)
  });

  // Vérifier que le fichier apparaît dans la liste
  await expect(page.locator(SELECTORS.attachments.attachmentItem).first()).toBeVisible({ timeout: 10000 });
}

/**
 * Créer un fichier de test temporaire
 */
function createTestFile(): string {
  const testDir = path.join(process.cwd(), 'test-results', 'temp');

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const filePath = path.join(testDir, `test-attachment-${Date.now()}.txt`);
  fs.writeFileSync(filePath, 'Fichier de test pour pièce jointe E2E');

  return filePath;
}

/**
 * Soumettre le formulaire de création
 */
export async function submitNoteForm(page: Page): Promise<void> {
  await page.locator(SELECTORS.form.submitBtn).click();

  // Attendre que le dialog se ferme ou que le succès soit affiché
  await page.waitForSelector('dialog, [role="dialog"], .modal', { state: 'hidden', timeout: 10000 }).catch(() => {});

  // Attendre le message de succès
  await expect(page.locator('[data-testid="toast-success"], .toast, [role="alert"]').filter({ hasText: /succès|créée/i }))
    .toBeVisible({ timeout: 10000 })
    .catch(() => {});

  await waitForPageLoad(page);
}

/**
 * Soumettre une note (action de workflow)
 */
export async function submitNote(page: Page, noteRef?: string): Promise<void> {
  if (noteRef) {
    // Trouver la ligne de la note et cliquer sur Soumettre
    const row = page.locator(`tr:has-text("${noteRef}")`);
    await row.locator(SELECTORS.actions.submitNote).click();
  } else {
    await page.locator(SELECTORS.actions.submitNote).first().click();
  }

  // Confirmer si nécessaire
  const confirmBtn = page.locator('button:has-text("Confirmer")');
  if (await confirmBtn.isVisible({ timeout: 2000 })) {
    await confirmBtn.click();
  }

  await waitForPageLoad(page);
}

/**
 * Valider une note (action DG)
 */
export async function validateNote(page: Page, noteRef?: string): Promise<void> {
  if (noteRef) {
    const row = page.locator(`tr:has-text("${noteRef}")`);
    await row.locator(SELECTORS.actions.validateBtn).click();
  } else {
    await page.locator(SELECTORS.actions.validateBtn).first().click();
  }

  await waitForPageLoad(page);
}

/**
 * Rejeter une note avec motif
 */
export async function rejectNote(page: Page, motif: string, noteRef?: string): Promise<void> {
  if (noteRef) {
    const row = page.locator(`tr:has-text("${noteRef}")`);
    await row.locator(SELECTORS.actions.rejectBtn).click();
  } else {
    await page.locator(SELECTORS.actions.rejectBtn).first().click();
  }

  // Attendre le dialog
  await expect(page.locator('dialog, [role="dialog"]')).toBeVisible({ timeout: 5000 });

  // Remplir le motif
  await page.locator(SELECTORS.dialogs.rejectMotif).fill(motif);

  // Confirmer
  await page.locator(SELECTORS.dialogs.confirmReject).click();

  await waitForPageLoad(page);
}

/**
 * Différer une note avec motif
 */
export async function deferNote(
  page: Page,
  motif: string,
  condition?: string,
  noteRef?: string
): Promise<void> {
  if (noteRef) {
    const row = page.locator(`tr:has-text("${noteRef}")`);
    await row.locator(SELECTORS.actions.deferBtn).click();
  } else {
    await page.locator(SELECTORS.actions.deferBtn).first().click();
  }

  // Attendre le dialog
  await expect(page.locator('dialog, [role="dialog"]')).toBeVisible({ timeout: 5000 });

  // Remplir le motif
  await page.locator(SELECTORS.dialogs.deferMotif).fill(motif);

  // Remplir la condition si fournie
  if (condition) {
    const conditionField = page.locator(SELECTORS.dialogs.deferCondition);
    if (await conditionField.isVisible()) {
      await conditionField.fill(condition);
    }
  }

  // Confirmer
  await page.locator(SELECTORS.dialogs.confirmDefer).click();

  await waitForPageLoad(page);
}

/**
 * Vérifier le statut d'une note
 */
export async function verifyNoteStatus(
  page: Page,
  expectedStatus: 'brouillon' | 'soumis' | 'valide' | 'differe' | 'rejete',
  noteRef?: string
): Promise<void> {
  const statusLabels: Record<string, string> = {
    brouillon: 'Brouillon',
    soumis: 'Soumis',
    valide: 'Validé',
    differe: 'Différé',
    rejete: 'Rejeté',
  };

  const statusText = statusLabels[expectedStatus];

  if (noteRef) {
    const row = page.locator(`tr:has-text("${noteRef}")`);
    await expect(row.locator(`text=${statusText}`)).toBeVisible({ timeout: 10000 });
  } else {
    await expect(page.locator(`text=${statusText}`).first()).toBeVisible({ timeout: 10000 });
  }
}

/**
 * Vérifier qu'une référence ARTI a été générée
 */
export async function verifyArtiReference(page: Page, noteRef?: string): Promise<string> {
  const referenceLocator = noteRef
    ? page.locator(`tr:has-text("${noteRef}")`).locator(SELECTORS.reference.badge)
    : page.locator(SELECTORS.reference.badge).first();

  await expect(referenceLocator).toBeVisible({ timeout: 10000 });

  const reference = await referenceLocator.textContent();

  // Vérifier le format ARTI001260XXX
  expect(reference).toMatch(SELECTORS.reference.pattern);

  return reference || '';
}

/**
 * Exporter les notes dans un format spécifique
 */
export async function exportNotes(
  page: Page,
  format: 'excel' | 'pdf' | 'csv'
): Promise<void> {
  // Ouvrir le menu d'export
  await page.locator(SELECTORS.actions.exportBtn).click();

  // Préparer pour intercepter le téléchargement
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

  // Cliquer sur le format désiré
  const formatSelector = {
    excel: SELECTORS.actions.exportExcel,
    pdf: SELECTORS.actions.exportPdf,
    csv: SELECTORS.actions.exportCsv,
  }[format];

  await page.locator(formatSelector).click();

  // Attendre le téléchargement
  const download = await downloadPromise;

  // Vérifier que le fichier a été téléchargé
  const fileName = download.suggestedFilename();
  expect(fileName).toBeTruthy();

  // Sauvegarder le fichier dans test-results
  const savePath = path.join(process.cwd(), 'test-results', 'downloads', fileName);
  await download.saveAs(savePath);
}

/**
 * Nettoyer les données de test créées
 */
export async function cleanupTestData(page: Page): Promise<void> {
  // Cette fonction peut être étendue pour supprimer les notes créées pendant les tests
  // Pour l'instant, on navigue simplement vers la page d'accueil
  await page.goto('/');
}
