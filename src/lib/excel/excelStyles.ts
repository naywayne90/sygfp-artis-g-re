// @ts-nocheck
/**
 * Styles réutilisables pour les exports Excel SYGFP
 * Conforme à la charte graphique ARTI
 */

import type { CellStyle } from 'xlsx';

// ============================================================================
// COULEURS
// ============================================================================

export const EXCEL_COLORS = {
  // Couleur principale ARTI (bleu foncé)
  primary: '003366',
  // Bleu clair pour les en-têtes
  headerBg: '4472C4',
  // Gris clair pour les en-têtes de colonnes
  columnHeaderBg: 'D9E1F2',
  // Fond alterné ligne paire
  rowEvenBg: 'F2F2F2',
  // Fond alterné ligne impaire (blanc)
  rowOddBg: 'FFFFFF',
  // Jaune clair pour les totaux
  totalBg: 'FFF2CC',
  // Texte blanc
  textWhite: 'FFFFFF',
  // Texte noir
  textBlack: '000000',
  // Vert pour statut validé
  statusValid: 'C6EFCE',
  // Orange pour statut en attente
  statusPending: 'FFEB9C',
  // Rouge pour statut rejeté
  statusRejected: 'FFC7CE',
  // Bleu pour statut soumis
  statusSubmitted: 'BDD7EE',
} as const;

// ============================================================================
// POLICES
// ============================================================================

export const EXCEL_FONTS = {
  // Police par défaut
  default: {
    name: 'Calibri',
    sz: 11,
  },
  // Titre principal
  title: {
    name: 'Calibri',
    sz: 16,
    bold: true,
    color: { rgb: EXCEL_COLORS.textWhite },
  },
  // Sous-titre
  subtitle: {
    name: 'Calibri',
    sz: 12,
    italic: true,
    color: { rgb: '666666' },
  },
  // En-têtes de colonnes
  header: {
    name: 'Calibri',
    sz: 11,
    bold: true,
    color: { rgb: EXCEL_COLORS.textBlack },
  },
  // Totaux
  total: {
    name: 'Calibri',
    sz: 11,
    bold: true,
    color: { rgb: EXCEL_COLORS.textBlack },
  },
} as const;

// ============================================================================
// BORDURES
// ============================================================================

export const EXCEL_BORDERS = {
  // Bordure fine
  thin: {
    top: { style: 'thin', color: { rgb: 'D0D0D0' } },
    bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
    left: { style: 'thin', color: { rgb: 'D0D0D0' } },
    right: { style: 'thin', color: { rgb: 'D0D0D0' } },
  },
  // Bordure moyenne
  medium: {
    top: { style: 'medium', color: { rgb: 'A0A0A0' } },
    bottom: { style: 'medium', color: { rgb: 'A0A0A0' } },
    left: { style: 'medium', color: { rgb: 'A0A0A0' } },
    right: { style: 'medium', color: { rgb: 'A0A0A0' } },
  },
  // Bordure du titre (bas uniquement)
  titleBottom: {
    bottom: { style: 'medium', color: { rgb: EXCEL_COLORS.primary } },
  },
} as const;

// ============================================================================
// ALIGNEMENTS
// ============================================================================

export const EXCEL_ALIGNMENT = {
  // Centré
  center: {
    horizontal: 'center',
    vertical: 'center',
  },
  // À gauche
  left: {
    horizontal: 'left',
    vertical: 'center',
  },
  // À droite (pour les montants)
  right: {
    horizontal: 'right',
    vertical: 'center',
  },
  // Texte multiligne
  wrap: {
    horizontal: 'left',
    vertical: 'center',
    wrapText: true,
  },
} as const;

// ============================================================================
// STYLES COMBINÉS
// ============================================================================

export const EXCEL_STYLES: Record<string, CellStyle> = {
  // Style du titre principal
  title: {
    font: EXCEL_FONTS.title,
    fill: { fgColor: { rgb: EXCEL_COLORS.headerBg } },
    alignment: EXCEL_ALIGNMENT.center,
  },

  // Style du sous-titre (filtres)
  subtitle: {
    font: EXCEL_FONTS.subtitle,
    alignment: EXCEL_ALIGNMENT.left,
  },

  // Style des en-têtes de colonnes
  columnHeader: {
    font: EXCEL_FONTS.header,
    fill: { fgColor: { rgb: EXCEL_COLORS.columnHeaderBg } },
    border: EXCEL_BORDERS.thin,
    alignment: EXCEL_ALIGNMENT.center,
  },

  // Style des cellules données (ligne paire)
  dataEven: {
    font: EXCEL_FONTS.default,
    fill: { fgColor: { rgb: EXCEL_COLORS.rowEvenBg } },
    border: EXCEL_BORDERS.thin,
    alignment: EXCEL_ALIGNMENT.left,
  },

  // Style des cellules données (ligne impaire)
  dataOdd: {
    font: EXCEL_FONTS.default,
    fill: { fgColor: { rgb: EXCEL_COLORS.rowOddBg } },
    border: EXCEL_BORDERS.thin,
    alignment: EXCEL_ALIGNMENT.left,
  },

  // Style des montants
  currency: {
    font: EXCEL_FONTS.default,
    border: EXCEL_BORDERS.thin,
    alignment: EXCEL_ALIGNMENT.right,
    numFmt: '#,##0" FCFA"',
  },

  // Style des dates
  date: {
    font: EXCEL_FONTS.default,
    border: EXCEL_BORDERS.thin,
    alignment: EXCEL_ALIGNMENT.center,
    numFmt: 'DD/MM/YYYY',
  },

  // Style des totaux
  total: {
    font: EXCEL_FONTS.total,
    fill: { fgColor: { rgb: EXCEL_COLORS.totalBg } },
    border: EXCEL_BORDERS.medium,
    alignment: EXCEL_ALIGNMENT.right,
  },

  // Style du label de total
  totalLabel: {
    font: EXCEL_FONTS.total,
    fill: { fgColor: { rgb: EXCEL_COLORS.totalBg } },
    border: EXCEL_BORDERS.medium,
    alignment: EXCEL_ALIGNMENT.left,
  },
};

// ============================================================================
// STYLES PAR STATUT
// ============================================================================

export const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  brouillon: { bg: EXCEL_COLORS.rowOddBg, text: '666666' },
  soumis: { bg: EXCEL_COLORS.statusSubmitted, text: '1F4E79' },
  a_valider: { bg: EXCEL_COLORS.statusPending, text: '9C5700' },
  valide: { bg: EXCEL_COLORS.statusValid, text: '006100' },
  validé: { bg: EXCEL_COLORS.statusValid, text: '006100' },
  differe: { bg: EXCEL_COLORS.statusPending, text: '9C5700' },
  différé: { bg: EXCEL_COLORS.statusPending, text: '9C5700' },
  rejete: { bg: EXCEL_COLORS.statusRejected, text: '9C0006' },
  rejeté: { bg: EXCEL_COLORS.statusRejected, text: '9C0006' },
};

// ============================================================================
// LARGEURS DE COLONNES PAR DÉFAUT
// ============================================================================

export const COLUMN_WIDTHS = {
  reference: 15,
  objet: 40,
  direction: 20,
  demandeur: 25,
  montant: 15,
  statut: 12,
  date: 12,
  validateur: 20,
  commentaire: 35,
  numero: 12,
} as const;

// ============================================================================
// HAUTEURS DE LIGNES
// ============================================================================

export const ROW_HEIGHTS = {
  title: 30,
  subtitle: 20,
  header: 20,
  data: 18,
  total: 22,
} as const;
