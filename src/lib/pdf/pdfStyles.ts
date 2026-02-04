/**
 * Styles et constantes réutilisables pour la génération de PDF
 * Conforme à la charte graphique ARTI
 */

// ============================================================================
// CONFIGURATION PDF
// ============================================================================

export const PDF_PAGE = {
  format: 'a4' as const,
  orientation: 'portrait' as const,
  unit: 'mm' as const,
  width: 210,
  height: 297,
};

export const PDF_MARGINS = {
  top: 20,
  bottom: 20,
  left: 20,
  right: 20,
};

// Largeur utile (sans marges)
export const CONTENT_WIDTH = PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right;

// ============================================================================
// COULEURS
// ============================================================================

export const PDF_COLORS = {
  // Couleur principale ARTI (bleu foncé)
  primary: [0, 51, 102] as [number, number, number],
  // Texte principal
  text: [30, 30, 30] as [number, number, number],
  // Texte secondaire (gris)
  secondary: [100, 100, 100] as [number, number, number],
  // Fond de cellule header
  headerBg: [240, 240, 240] as [number, number, number],
  // Bordures de tableau
  tableBorder: [200, 200, 200] as [number, number, number],
  // Fond gris clair
  lightGray: [248, 248, 248] as [number, number, number],
  // Fond blanc
  white: [255, 255, 255] as [number, number, number],
  // Statuts
  success: [16, 185, 129] as [number, number, number], // Vert
  warning: [245, 158, 11] as [number, number, number], // Orange
  danger: [239, 68, 68] as [number, number, number], // Rouge
  // Sections colorées
  exposeBlue: [230, 240, 250] as [number, number, number],
  avisGreen: [230, 250, 240] as [number, number, number],
  recoAmber: [255, 248, 230] as [number, number, number],
} as const;

// ============================================================================
// POLICES
// ============================================================================

export const PDF_FONTS = {
  // Tailles de police
  size: {
    title: 14,
    subtitle: 12,
    body: 11,
    small: 9,
    tiny: 8,
  },
  // Famille de police
  family: 'helvetica' as const,
  // Styles
  styles: {
    normal: 'normal' as const,
    bold: 'bold' as const,
    italic: 'italic' as const,
  },
} as const;

// ============================================================================
// DIMENSIONS
// ============================================================================

export const PDF_DIMENSIONS = {
  // Logo ARTI
  logo: {
    width: 25,
    height: 25,
  },
  // QR Code
  qrCode: {
    small: 18,
    medium: 30,
    large: 45,
  },
  // Espacement
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  // Lignes
  lineWidth: {
    thin: 0.3,
    normal: 0.5,
    thick: 1,
  },
} as const;

// ============================================================================
// STYLES DE TABLEAU (pour jspdf-autotable)
// ============================================================================

export const TABLE_STYLES = {
  // Style par défaut
  default: {
    fontSize: PDF_FONTS.size.body,
    cellPadding: 3,
    lineWidth: PDF_DIMENSIONS.lineWidth.thin,
    lineColor: PDF_COLORS.tableBorder,
    textColor: PDF_COLORS.text,
  },
  // Style de l'en-tête
  head: {
    fillColor: PDF_COLORS.primary,
    textColor: PDF_COLORS.white,
    fontStyle: PDF_FONTS.styles.bold,
    halign: 'center' as const,
  },
  // Style compact
  compact: {
    fontSize: PDF_FONTS.size.small,
    cellPadding: 2,
  },
} as const;

// ============================================================================
// INFORMATIONS DE L'ORGANISATION
// ============================================================================

export const ORG_INFO = {
  country: 'RÉPUBLIQUE GABONAISE',
  motto: 'Union - Travail - Justice',
  name: "AUTORITÉ DE RÉGULATION DU TRANSPORT INTÉRIEUR",
  shortName: 'ARTI',
  system: 'SYGFP',
  systemFull: 'Système de Gestion des Finances Publiques',
  website: 'sygfp.arti.ga',
  verifyUrl: 'https://sygfp.arti.ga/verify',
} as const;

// ============================================================================
// TEXTES STANDARDS
// ============================================================================

export const PDF_TEXTS = {
  // Destinataire par défaut
  defaultRecipient: 'À Monsieur le Directeur Général',
  // Footer de génération
  generatedBy: 'Document généré par SYGFP',
  // Note de sécurité
  securityNote: 'Ce document est authentifié électroniquement. Toute falsification est passible de poursuites.',
  // Scan QR
  scanQR: "Scannez ce QR Code pour vérifier l'authenticité du document",
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type PDFColor = [number, number, number];

export interface PDFPosition {
  x: number;
  y: number;
}

export interface PDFRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// UTILITAIRES DE STYLE
// ============================================================================

/**
 * Convertit une couleur hex en RGB
 */
export function hexToRgb(hex: string): PDFColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [0, 0, 0];
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * Calcule la position X centrée
 */
export function centerX(elementWidth: number): number {
  return (PDF_PAGE.width - elementWidth) / 2;
}

/**
 * Calcule la position X alignée à droite
 */
export function rightAlignX(elementWidth: number): number {
  return PDF_PAGE.width - PDF_MARGINS.right - elementWidth;
}
