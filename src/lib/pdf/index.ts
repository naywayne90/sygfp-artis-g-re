/**
 * Module PDF - Export centralisé
 * Utilitaires et générateurs pour la création de documents PDF
 */

// Styles et constantes
export {
  PDF_PAGE,
  PDF_MARGINS,
  PDF_COLORS,
  PDF_FONTS,
  PDF_DIMENSIONS,
  PDF_TEXTS,
  ORG_INFO,
  CONTENT_WIDTH,
  TABLE_STYLES,
  hexToRgb,
  centerX,
  rightAlignX,
  type PDFColor,
  type PDFPosition,
  type PDFRect,
} from './pdfStyles';

// Génération d'en-tête
export {
  generatePDFHeader,
  loadImageAsDataUrl,
  addHeaderTitle,
  type PDFHeaderOptions,
  type PDFHeaderResult,
} from './pdfHeader';

// Génération de pied de page
export {
  generatePDFFooter,
  generateSignatureTable,
  addWatermark,
  type PDFFooterOptions,
  type PDFFooterResult,
  type SignatureBoxOptions,
  type SignataireInfo,
  type WatermarkOptions,
} from './pdfFooter';

// Générateur de Notes SEF
export {
  generateNotePDF,
  downloadNotePDF,
  type GenerateNotePDFOptions,
  type PDFGenerationResult,
} from './generateNotePDF';

// Générateur de Bon d'Engagement
export { generateBonEngagementPDF } from './generateBonEngagementPDF';
