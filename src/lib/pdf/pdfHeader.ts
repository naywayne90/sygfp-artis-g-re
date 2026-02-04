/**
 * Génération de l'en-tête PDF pour les documents ARTI/SYGFP
 * Structure : Logo | Titre centré | Direction émettrice
 */

import type jsPDF from 'jspdf';
import {
  PDF_COLORS,
  PDF_FONTS,
  PDF_MARGINS,
  PDF_PAGE,
  PDF_DIMENSIONS,
  ORG_INFO,
} from './pdfStyles';

// ============================================================================
// TYPES
// ============================================================================

export interface PDFHeaderOptions {
  /** Instance jsPDF */
  doc: jsPDF;
  /** URL du logo ARTI (data URL ou path) */
  logoDataUrl?: string;
  /** Direction émettrice */
  direction?: string;
  /** Sigle de la direction */
  directionSigle?: string;
  /** URL du QR code (optionnel, petit format en haut à droite) */
  qrCodeDataUrl?: string;
  /** Position Y de départ */
  startY?: number;
}

export interface PDFHeaderResult {
  /** Position Y après l'en-tête */
  endY: number;
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Génère l'en-tête complet du document PDF
 * Retourne la position Y après l'en-tête
 */
export function generatePDFHeader(options: PDFHeaderOptions): PDFHeaderResult {
  const {
    doc,
    logoDataUrl,
    direction,
    directionSigle,
    qrCodeDataUrl,
    startY = PDF_MARGINS.top,
  } = options;

  let yPos = startY;

  // ────────────────────────────────────────────────────────────────────────────
  // LOGO ARTI (gauche)
  // ────────────────────────────────────────────────────────────────────────────

  if (logoDataUrl) {
    try {
      doc.addImage(
        logoDataUrl,
        'JPEG',
        PDF_MARGINS.left,
        yPos,
        PDF_DIMENSIONS.logo.width,
        PDF_DIMENSIONS.logo.height
      );
    } catch (error) {
      console.warn('[PDFHeader] Impossible de charger le logo:', error);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // QR CODE DISCRET (droite, petit)
  // ────────────────────────────────────────────────────────────────────────────

  if (qrCodeDataUrl) {
    try {
      const qrSize = PDF_DIMENSIONS.qrCode.small;
      const qrX = PDF_PAGE.width - PDF_MARGINS.right - qrSize;
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, yPos, qrSize, qrSize);
    } catch (error) {
      console.warn('[PDFHeader] Impossible de charger le QR code:', error);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TEXTE EN-TÊTE CENTRÉ
  // ────────────────────────────────────────────────────────────────────────────

  const centerX = PDF_PAGE.width / 2;

  // République
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(ORG_INFO.country, centerX, yPos + 4, { align: 'center' });

  // Devise
  doc.setFontSize(PDF_FONTS.size.tiny);
  doc.text(ORG_INFO.motto, centerX, yPos + 8, { align: 'center' });

  // Nom de l'organisation (gras, couleur primaire)
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(ORG_INFO.name, centerX, yPos + 15, { align: 'center' });

  // ────────────────────────────────────────────────────────────────────────────
  // DIRECTION ÉMETTRICE (droite, sous le QR code)
  // ────────────────────────────────────────────────────────────────────────────

  if (direction || directionSigle) {
    const directionText = directionSigle || direction || '';
    doc.setFontSize(PDF_FONTS.size.tiny);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(
      directionText,
      PDF_PAGE.width - PDF_MARGINS.right,
      yPos + PDF_DIMENSIONS.logo.height + 4,
      { align: 'right' }
    );
  }

  yPos += PDF_DIMENSIONS.logo.height + PDF_DIMENSIONS.spacing.md;

  // ────────────────────────────────────────────────────────────────────────────
  // LIGNE DE SÉPARATION
  // ────────────────────────────────────────────────────────────────────────────

  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(PDF_DIMENSIONS.lineWidth.normal);
  doc.line(
    PDF_MARGINS.left,
    yPos,
    PDF_PAGE.width - PDF_MARGINS.right,
    yPos
  );

  yPos += PDF_DIMENSIONS.spacing.lg;

  return { endY: yPos };
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Charge une image et retourne son data URL
 */
export async function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Génère un titre de section dans l'en-tête
 */
export function addHeaderTitle(
  doc: jsPDF,
  title: string,
  yPos: number
): number {
  const centerX = PDF_PAGE.width / 2;

  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(title, centerX, yPos, { align: 'center' });

  return yPos + PDF_DIMENSIONS.spacing.lg;
}
