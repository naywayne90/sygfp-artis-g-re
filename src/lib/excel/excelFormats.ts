/**
 * Formats de nombres et dates pour les exports Excel SYGFP
 */

// ============================================================================
// FORMATS DE NOMBRES
// ============================================================================

export const NUMBER_FORMATS = {
  // Format monétaire FCFA
  currency: '#,##0" FCFA"',
  // Format monétaire avec décimales
  currencyDecimal: '#,##0.00" FCFA"',
  // Format pourcentage
  percent: '0.00%',
  // Format nombre entier
  integer: '#,##0',
  // Format nombre avec 2 décimales
  decimal: '#,##0.00',
} as const;

// ============================================================================
// FORMATS DE DATES
// ============================================================================

export const DATE_FORMATS = {
  // Format date courte : 29/01/2026
  short: 'DD/MM/YYYY',
  // Format date longue : 29 janvier 2026
  long: 'DD MMMM YYYY',
  // Format date avec heure : 29/01/2026 14:30
  dateTime: 'DD/MM/YYYY HH:mm',
  // Format heure uniquement
  time: 'HH:mm',
  // Format ISO
  iso: 'YYYY-MM-DD',
} as const;

// ============================================================================
// UTILITAIRES DE FORMATAGE
// ============================================================================

/**
 * Formate un montant en FCFA pour affichage
 */
export function formatMontant(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
}

/**
 * Formate une date pour affichage
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

/**
 * Formate une date longue
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

/**
 * Convertit une date en nombre Excel (nombre de jours depuis 1900)
 */
export function dateToExcelSerial(date: Date): number {
  // Excel compte depuis le 1er janvier 1900
  // Note: Excel a un bug avec 1900 considéré comme année bissextile
  const excelEpoch = new Date(1899, 11, 30);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((date.getTime() - excelEpoch.getTime()) / msPerDay);
}

/**
 * Parse une date depuis une chaîne
 */
export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  try {
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ============================================================================
// LABELS DE STATUT
// ============================================================================

export const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  a_valider: 'À valider',
  valide: 'Validé',
  validé: 'Validé',
  differe: 'Différé',
  différé: 'Différé',
  rejete: 'Rejeté',
  rejeté: 'Rejeté',
};

/**
 * Obtient le label d'un statut
 */
export function getStatusLabel(status: string | null | undefined): string {
  if (!status) return '-';
  return STATUS_LABELS[status.toLowerCase()] || status;
}

// ============================================================================
// LABELS D'URGENCE
// ============================================================================

export const URGENCE_LABELS: Record<string, string> = {
  normale: 'Normale',
  urgent: 'Urgent',
  tres_urgent: 'Très urgent',
};

/**
 * Obtient le label d'urgence
 */
export function getUrgenceLabel(urgence: string | null | undefined): string {
  if (!urgence) return '-';
  return URGENCE_LABELS[urgence.toLowerCase()] || urgence;
}

// ============================================================================
// NOMS DE FICHIERS
// ============================================================================

/**
 * Génère un nom de fichier avec date
 */
export function generateFilename(prefix: string, extension: string = 'xlsx'): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  return `${prefix}_${dateStr}.${extension}`;
}

/**
 * Nettoie un nom de fichier (retire les caractères spéciaux)
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
