/**
 * Génération du pied de page PDF pour les documents ARTI/SYGFP
 * Structure : QR Code | Numéro de page | Date de génération
 */

import type jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  PDF_COLORS,
  PDF_FONTS,
  PDF_MARGINS,
  PDF_PAGE,
  PDF_DIMENSIONS,
  PDF_TEXTS,
  ORG_INFO,
} from './pdfStyles';

// ============================================================================
// TYPES
// ============================================================================

export interface PDFFooterOptions {
  /** Instance jsPDF */
  doc: jsPDF;
  /** Numéro de page actuel */
  pageNumber: number;
  /** Nombre total de pages */
  totalPages: number;
  /** URL du QR code (data URL) */
  qrCodeDataUrl?: string;
  /** Date de génération (par défaut: maintenant) */
  generatedAt?: Date;
  /** Afficher le texte de sécurité */
  showSecurityNote?: boolean;
}

export interface PDFFooterResult {
  /** Position Y du début du footer */
  startY: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const FOOTER_HEIGHT = 30; // Hauteur réservée pour le footer
const QR_SIZE = 25; // Taille du QR code en footer

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Génère le pied de page complet du document PDF
 */
export function generatePDFFooter(options: PDFFooterOptions): PDFFooterResult {
  const {
    doc,
    pageNumber,
    totalPages,
    qrCodeDataUrl,
    generatedAt = new Date(),
    showSecurityNote = false,
  } = options;

  const startY = PDF_PAGE.height - PDF_MARGINS.bottom - FOOTER_HEIGHT;
  let yPos = startY;

  // ────────────────────────────────────────────────────────────────────────────
  // LIGNE DE SÉPARATION SUPÉRIEURE
  // ────────────────────────────────────────────────────────────────────────────

  doc.setDrawColor(...PDF_COLORS.tableBorder);
  doc.setLineWidth(PDF_DIMENSIONS.lineWidth.thin);
  doc.line(
    PDF_MARGINS.left,
    yPos,
    PDF_PAGE.width - PDF_MARGINS.right,
    yPos
  );

  yPos += PDF_DIMENSIONS.spacing.sm;

  // ────────────────────────────────────────────────────────────────────────────
  // QR CODE (gauche)
  // ────────────────────────────────────────────────────────────────────────────

  if (qrCodeDataUrl) {
    try {
      doc.addImage(
        qrCodeDataUrl,
        'PNG',
        PDF_MARGINS.left,
        yPos,
        QR_SIZE,
        QR_SIZE
      );
    } catch (error) {
      console.warn('[PDFFooter] Impossible de charger le QR code:', error);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // NUMÉRO DE PAGE (centré)
  // ────────────────────────────────────────────────────────────────────────────

  const centerX = PDF_PAGE.width / 2;
  const pageTextY = yPos + QR_SIZE / 2;

  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(`Page ${pageNumber} / ${totalPages}`, centerX, pageTextY, { align: 'center' });

  // ────────────────────────────────────────────────────────────────────────────
  // DATE DE GÉNÉRATION (droite)
  // ────────────────────────────────────────────────────────────────────────────

  const formattedDate = format(generatedAt, "dd/MM/yyyy 'à' HH:mm", { locale: fr });
  const generatedText = `Document généré le ${formattedDate}`;

  doc.setFontSize(PDF_FONTS.size.tiny);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(
    generatedText,
    PDF_PAGE.width - PDF_MARGINS.right,
    pageTextY - 4,
    { align: 'right' }
  );

  // Texte SYGFP
  doc.text(
    `${ORG_INFO.shortName} - ${ORG_INFO.system}`,
    PDF_PAGE.width - PDF_MARGINS.right,
    pageTextY + 4,
    { align: 'right' }
  );

  // ────────────────────────────────────────────────────────────────────────────
  // NOTE DE SÉCURITÉ (optionnelle, sous le QR)
  // ────────────────────────────────────────────────────────────────────────────

  if (showSecurityNote && qrCodeDataUrl) {
    doc.setFontSize(PDF_FONTS.size.tiny - 1);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(
      PDF_TEXTS.scanQR,
      PDF_MARGINS.left + QR_SIZE + PDF_DIMENSIONS.spacing.sm,
      yPos + 6,
      { maxWidth: 60 }
    );
  }

  return { startY };
}

// ============================================================================
// SIGNATURES
// ============================================================================

export interface SignatureBoxOptions {
  /** Instance jsPDF */
  doc: jsPDF;
  /** Position Y de départ */
  startY: number;
  /** Liste des signataires */
  signataires: SignataireInfo[];
}

export interface SignataireInfo {
  /** Titre/Fonction (ex: "Le Directeur") */
  titre: string;
  /** Nom complet (optionnel) */
  nom?: string;
  /** Direction/Service */
  direction?: string;
  /** Date de signature (optionnel) */
  date?: Date;
}

/**
 * Génère un tableau de signatures
 */
export function generateSignatureTable(options: SignatureBoxOptions): number {
  const { doc, startY, signataires } = options;

  if (signataires.length === 0) {
    return startY;
  }

  let yPos = startY;
  const boxWidth = (PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right) / signataires.length;
  const boxHeight = 35;

  // En-tête du tableau de signatures
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('SIGNATURES', PDF_MARGINS.left, yPos);
  yPos += PDF_DIMENSIONS.spacing.md;

  // Dessiner les cases de signature
  signataires.forEach((sig, index) => {
    const x = PDF_MARGINS.left + (index * boxWidth);

    // Bordure de la case
    doc.setDrawColor(...PDF_COLORS.tableBorder);
    doc.setLineWidth(PDF_DIMENSIONS.lineWidth.thin);
    doc.rect(x, yPos, boxWidth - 2, boxHeight);

    // Titre/Direction
    doc.setFontSize(PDF_FONTS.size.tiny);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.text);

    const labelText = sig.direction || sig.titre;
    doc.text(labelText, x + boxWidth / 2 - 1, yPos + 5, { align: 'center' });

    // Espace pour signature manuscrite (ligne pointillée)
    doc.setDrawColor(...PDF_COLORS.tableBorder);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(x + 5, yPos + boxHeight - 12, x + boxWidth - 7, yPos + boxHeight - 12);
    doc.setLineDashPattern([], 0);

    // Nom et date
    doc.setFontSize(PDF_FONTS.size.tiny - 1);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
    doc.setTextColor(...PDF_COLORS.secondary);

    if (sig.nom) {
      doc.text(sig.nom, x + boxWidth / 2 - 1, yPos + boxHeight - 6, { align: 'center' });
    }

    if (sig.date) {
      const dateStr = format(sig.date, 'dd/MM/yyyy', { locale: fr });
      doc.text(dateStr, x + boxWidth / 2 - 1, yPos + boxHeight - 2, { align: 'center' });
    }
  });

  return yPos + boxHeight + PDF_DIMENSIONS.spacing.md;
}

// ============================================================================
// WATERMARK / FILIGRANE
// ============================================================================

export interface WatermarkOptions {
  /** Instance jsPDF */
  doc: jsPDF;
  /** Texte du filigrane */
  text: string;
  /** Angle de rotation (degrés) */
  angle?: number;
  /** Opacité (0-1) */
  opacity?: number;
}

/**
 * Ajoute un filigrane diagonal sur la page
 */
export function addWatermark(options: WatermarkOptions): void {
  const { doc, text, angle = -45, opacity = 0.1 } = options;

  const centerX = PDF_PAGE.width / 2;
  const centerY = PDF_PAGE.height / 2;

  // Sauvegarder l'état graphique
  doc.saveGraphicsState();

  // Appliquer l'opacité
  doc.setGState(doc.GState({ opacity }));

  // Configurer le texte
  doc.setFontSize(60);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.tableBorder);

  // Rotation et placement
  doc.text(text, centerX, centerY, {
    align: 'center',
    angle: angle,
  });

  // Restaurer l'état graphique
  doc.restoreGraphicsState();
}
