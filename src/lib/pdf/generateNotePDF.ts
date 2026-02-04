/**
 * Générateur de PDF pour les Notes SEF - Format officiel ARTI
 * Conforme au canevas officiel avec en-tête, corps, signatures et QR code
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  PDF_PAGE,
  PDF_MARGINS,
  PDF_COLORS,
  PDF_FONTS,
  PDF_DIMENSIONS,
  PDF_TEXTS,
  ORG_INFO,
  CONTENT_WIDTH,
} from './pdfStyles';
import { generatePDFHeader, loadImageAsDataUrl, addHeaderTitle } from './pdfHeader';
import { generatePDFFooter, generateSignatureTable, type SignataireInfo } from './pdfFooter';

import type { NoteSEFEntity, NoteSEFHistoryEntry } from '@/lib/notes-sef/types';

// Logo ARTI
import logoArti from '@/assets/logo-arti.jpg';

// ============================================================================
// TYPES
// ============================================================================

export interface GenerateNotePDFOptions {
  /** La note SEF à exporter */
  note: NoteSEFEntity;
  /** Historique des validations */
  validations?: NoteSEFHistoryEntry[];
  /** Inclure le QR code de vérification */
  includeQRCode?: boolean;
  /** URL de base pour le QR code de vérification */
  baseUrl?: string;
}

export interface PDFGenerationResult {
  /** Le blob du PDF généré */
  blob: Blob;
  /** Nom de fichier suggéré */
  filename: string;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Génère un canvas QR Code et retourne son data URL
 */
async function generateQRCodeDataUrl(data: string, size: number = 150): Promise<string> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
      createElement(QRCodeCanvas, {
        value: data,
        size: size,
        level: 'H',
        includeMargin: true,
      })
    );

    setTimeout(() => {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve('');
      }
      root.unmount();
      document.body.removeChild(container);
    }, 100);
  });
}

/**
 * Formate une date en français (long)
 * @internal Utilisé pour les besoins futurs d'affichage de date longue
 */
function _formatDateLong(date: string | Date | null): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
  } catch {
    return '-';
  }
}
void _formatDateLong; // Évite le warning "unused"

/**
 * Formate une date courte
 */
function formatDateShort(date: string | Date | null): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '-';
  }
}

/**
 * Obtient le nom complet d'un profil
 */
function getFullName(profile: { first_name?: string | null; last_name?: string | null } | null): string {
  if (!profile) return '-';
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '-';
}


// ============================================================================
// GÉNÉRATION DE LA PAGE 1 - INFORMATIONS
// ============================================================================

async function generatePage1(
  doc: jsPDF,
  note: NoteSEFEntity,
  logoDataUrl: string,
  qrDataUrl: string
): Promise<number> {
  let yPos = PDF_MARGINS.top;

  // ────────────────────────────────────────────────────────────────────────────
  // EN-TÊTE
  // ────────────────────────────────────────────────────────────────────────────

  const headerResult = generatePDFHeader({
    doc,
    logoDataUrl,
    direction: note.direction?.label,
    directionSigle: note.direction?.sigle || undefined,
    qrCodeDataUrl: qrDataUrl,
    startY: yPos,
  });

  yPos = headerResult.endY;

  // ────────────────────────────────────────────────────────────────────────────
  // TITRE DU DOCUMENT
  // ────────────────────────────────────────────────────────────────────────────

  yPos = addHeaderTitle(doc, 'NOTE SEF', yPos);

  // ────────────────────────────────────────────────────────────────────────────
  // INFORMATIONS DU DOCUMENT
  // ────────────────────────────────────────────────────────────────────────────

  const reference = note.numero || note.reference_pivot || 'BROUILLON';

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      [
        { content: 'Référence', styles: { fontStyle: 'bold', fillColor: PDF_COLORS.lightGray } },
        { content: reference, styles: { fontStyle: 'bold' } },
        { content: 'Date', styles: { fontStyle: 'bold', fillColor: PDF_COLORS.lightGray } },
        formatDateShort(note.created_at),
      ],
      [
        { content: 'Direction', styles: { fontStyle: 'bold', fillColor: PDF_COLORS.lightGray } },
        note.direction?.label || '-',
        { content: 'Exercice', styles: { fontStyle: 'bold', fillColor: PDF_COLORS.lightGray } },
        String(note.exercice),
      ],
      [
        { content: 'Objet', styles: { fontStyle: 'bold', fillColor: PDF_COLORS.lightGray } },
        { content: note.objet, colSpan: 3 },
      ],
    ],
    styles: {
      fontSize: PDF_FONTS.size.body,
      cellPadding: 3,
      lineWidth: PDF_DIMENSIONS.lineWidth.thin,
      lineColor: PDF_COLORS.tableBorder,
    },
    theme: 'grid',
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    tableWidth: 'auto',
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + PDF_DIMENSIONS.spacing.lg;

  // ────────────────────────────────────────────────────────────────────────────
  // DESTINATAIRE
  // ────────────────────────────────────────────────────────────────────────────

  doc.setFontSize(PDF_FONTS.size.body);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(PDF_TEXTS.defaultRecipient, PDF_MARGINS.left, yPos);
  yPos += PDF_DIMENSIONS.spacing.lg;

  // ────────────────────────────────────────────────────────────────────────────
  // CORPS DU DOCUMENT - EXPOSÉ
  // ────────────────────────────────────────────────────────────────────────────

  if (note.description || note.justification) {
    // Titre section
    doc.setFontSize(PDF_FONTS.size.subtitle);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text('EXPOSÉ', PDF_MARGINS.left, yPos);
    yPos += PDF_DIMENSIONS.spacing.md;

    // Contenu avec fond coloré
    doc.setFillColor(...PDF_COLORS.exposeBlue);

    const exposeText = [note.description, note.justification].filter(Boolean).join('\n\n');
    const exposeLines = doc.splitTextToSize(exposeText, CONTENT_WIDTH - 10);
    const exposeHeight = Math.min(exposeLines.length * 5 + 6, 60);

    doc.rect(PDF_MARGINS.left, yPos, CONTENT_WIDTH, exposeHeight, 'F');

    // Bordure gauche colorée
    doc.setFillColor(66, 133, 244);
    doc.rect(PDF_MARGINS.left, yPos, 2, exposeHeight, 'F');

    // Texte justifié
    doc.setFontSize(PDF_FONTS.size.body);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text(exposeLines.slice(0, 12), PDF_MARGINS.left + 6, yPos + 5, {
      maxWidth: CONTENT_WIDTH - 12,
      align: 'justify',
    });

    yPos += exposeHeight + PDF_DIMENSIONS.spacing.lg;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RECOMMANDATIONS (si présentes dans la justification)
  // ────────────────────────────────────────────────────────────────────────────

  if (note.justification && note.justification.length > 200) {
    doc.setFontSize(PDF_FONTS.size.subtitle);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text('RECOMMANDATIONS', PDF_MARGINS.left, yPos);
    yPos += PDF_DIMENSIONS.spacing.md;

    doc.setFillColor(...PDF_COLORS.recoAmber);

    const recoLines = doc.splitTextToSize(
      'En considération des éléments exposés ci-dessus, il est recommandé de donner une suite favorable à cette demande.',
      CONTENT_WIDTH - 10
    );
    const recoHeight = recoLines.length * 5 + 6;

    doc.rect(PDF_MARGINS.left, yPos, CONTENT_WIDTH, recoHeight, 'F');

    // Bordure gauche colorée
    doc.setFillColor(251, 188, 4);
    doc.rect(PDF_MARGINS.left, yPos, 2, recoHeight, 'F');

    doc.setFontSize(PDF_FONTS.size.body);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text(recoLines, PDF_MARGINS.left + 6, yPos + 5, {
      maxWidth: CONTENT_WIDTH - 12,
      align: 'justify',
    });

    yPos += recoHeight + PDF_DIMENSIONS.spacing.lg;
  }

  return yPos;
}

// ============================================================================
// GÉNÉRATION DE LA PAGE 2 - SIGNATURES
// ============================================================================

async function generatePage2(
  doc: jsPDF,
  note: NoteSEFEntity,
  validations: NoteSEFHistoryEntry[],
  qrDataUrl: string
): Promise<void> {
  doc.addPage();
  let yPos = PDF_MARGINS.top;

  // ────────────────────────────────────────────────────────────────────────────
  // TITRE
  // ────────────────────────────────────────────────────────────────────────────

  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('CIRCUIT DE VALIDATION', PDF_PAGE.width / 2, yPos + 10, { align: 'center' });

  yPos += PDF_DIMENSIONS.spacing.xl + 10;

  // Référence
  doc.setFontSize(PDF_FONTS.size.body);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  const reference = note.numero || note.reference_pivot || 'BROUILLON';
  doc.text(`Réf: ${reference}`, PDF_PAGE.width / 2, yPos, { align: 'center' });

  yPos += PDF_DIMENSIONS.spacing.xl;

  // ────────────────────────────────────────────────────────────────────────────
  // TABLEAU DE SIGNATURES
  // ────────────────────────────────────────────────────────────────────────────

  const signataires: SignataireInfo[] = [
    {
      titre: 'Le Demandeur',
      direction: note.direction?.sigle || 'Direction',
      nom: getFullName(note.demandeur),
      date: note.submitted_at ? new Date(note.submitted_at) : undefined,
    },
    {
      titre: 'Le Contrôleur Budgétaire',
      direction: 'CB',
    },
    {
      titre: 'Le Directeur Administratif',
      direction: 'DAF',
    },
    {
      titre: 'Le Directeur Général',
      direction: 'DG',
      nom: note.validated_by ? 'DG' : undefined,
      date: note.validated_at ? new Date(note.validated_at) : undefined,
    },
  ];

  yPos = generateSignatureTable({ doc, startY: yPos, signataires });

  // ────────────────────────────────────────────────────────────────────────────
  // HISTORIQUE DES VALIDATIONS
  // ────────────────────────────────────────────────────────────────────────────

  if (validations && validations.length > 0) {
    yPos += PDF_DIMENSIONS.spacing.lg;

    doc.setFontSize(PDF_FONTS.size.subtitle);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text('HISTORIQUE DES ACTIONS', PDF_MARGINS.left, yPos);
    yPos += PDF_DIMENSIONS.spacing.md;

    const historyData = validations.slice(0, 8).map((v) => [
      formatDateShort(v.performed_at),
      v.action || '-',
      getFullName(v.performer),
      v.commentaire || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Action', 'Par', 'Commentaire']],
      body: historyData,
      styles: {
        fontSize: PDF_FONTS.size.small,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' },
      },
      theme: 'grid',
      margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + PDF_DIMENSIONS.spacing.lg;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // QR CODE DE VÉRIFICATION (centré en bas)
  // ────────────────────────────────────────────────────────────────────────────

  if (qrDataUrl) {
    const qrSize = PDF_DIMENSIONS.qrCode.large;
    const qrX = (PDF_PAGE.width - qrSize) / 2;
    const qrY = Math.max(yPos + 20, PDF_PAGE.height - PDF_MARGINS.bottom - qrSize - 40);

    // Texte au-dessus du QR
    doc.setFontSize(PDF_FONTS.size.small);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(PDF_TEXTS.scanQR, PDF_PAGE.width / 2, qrY - 8, { align: 'center' });

    // Cadre décoratif
    doc.setDrawColor(...PDF_COLORS.primary);
    doc.setLineWidth(PDF_DIMENSIONS.lineWidth.normal);
    doc.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6);

    // QR Code
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch (error) {
      console.warn('[generateNotePDF] Impossible d\'ajouter le QR code:', error);
    }

    // Note de sécurité
    doc.setFontSize(PDF_FONTS.size.tiny);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(PDF_TEXTS.securityNote, PDF_PAGE.width / 2, qrY + qrSize + 10, { align: 'center' });
  }
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Génère un PDF professionnel pour une Note SEF
 */
export async function generateNotePDF(
  options: GenerateNotePDFOptions
): Promise<Blob> {
  const {
    note,
    validations = [],
    includeQRCode = true,
    baseUrl = window.location.origin,
  } = options;

  // URL de vérification
  const verifyUrl = `${baseUrl}/verify/${note.id}`;

  // Charger les ressources en parallèle
  const [logoDataUrl, qrDataUrl] = await Promise.all([
    loadImageAsDataUrl(logoArti).catch(() => ''),
    includeQRCode ? generateQRCodeDataUrl(verifyUrl, 150) : Promise.resolve(''),
  ]);

  // Créer le document PDF
  const doc = new jsPDF({
    orientation: PDF_PAGE.orientation,
    unit: PDF_PAGE.unit,
    format: PDF_PAGE.format,
  });

  // Page 1 : Informations et contenu
  await generatePage1(doc, note, logoDataUrl, qrDataUrl);

  // Footer page 1
  generatePDFFooter({
    doc,
    pageNumber: 1,
    totalPages: 2,
    qrCodeDataUrl: includeQRCode ? qrDataUrl : undefined,
    showSecurityNote: false,
  });

  // Page 2 : Signatures et QR code
  await generatePage2(doc, note, validations, qrDataUrl);

  // Footer page 2
  generatePDFFooter({
    doc,
    pageNumber: 2,
    totalPages: 2,
    showSecurityNote: true,
  });

  // Métadonnées du document
  const reference = note.numero || note.reference_pivot || 'BROUILLON';
  doc.setProperties({
    title: `Note SEF - ${reference}`,
    subject: note.objet || '',
    author: `${ORG_INFO.shortName} - ${ORG_INFO.system}`,
    creator: ORG_INFO.systemFull,
    keywords: 'note, SEF, ARTI, SYGFP, officiel',
  });

  // Retourner le blob
  return doc.output('blob');
}

/**
 * Génère et télécharge directement le PDF
 */
export async function downloadNotePDF(options: GenerateNotePDFOptions): Promise<void> {
  const blob = await generateNotePDF(options);

  const reference = options.note.numero || options.note.reference_pivot || 'BROUILLON';
  const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `ARTI_NOTE_SEF_${reference.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.pdf`;

  // Créer le lien de téléchargement
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export par défaut
export default {
  generateNotePDF,
  downloadNotePDF,
};
