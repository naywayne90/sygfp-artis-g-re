/**
 * Service de generation PDF pour les Notes Direction (canvas)
 *
 * Format ARTI officiel avec:
 * - Page 1: En-tete ARTI, identification, description, expose, avis, recommandations
 * - Page 2: Observations du DG + Decision + Signature + QR Code
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { NoteDirection } from '@/hooks/useNotesDirection';
import { NoteCanvasMetadata } from '@/hooks/useNoteCanvas';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoArti from '@/assets/logo-arti.jpg';

// ============================================================================
// TYPES
// ============================================================================

interface GenerateDirectionPdfOptions {
  note: NoteDirection;
  metadata: NoteCanvasMetadata;
  editorContent: string;
  directionLabel: string;
  directionSigle: string;
}

interface PdfGenerationResult {
  blob: Blob;
  filename: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PDF_CONFIG = {
  margins: {
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
  },
  colors: {
    primary: [31, 78, 121] as [number, number, number], // #1F4E79
    primaryLight: [214, 227, 240] as [number, number, number], // #D6E3F0
    text: [0, 0, 0] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    gray: [128, 128, 128] as [number, number, number],
  },
  fonts: {
    title: 14,
    subtitle: 11,
    body: 10,
    small: 8,
  },
};

// ============================================================================
// UTILITIES
// ============================================================================

async function generateQRCodeDataUrl(data: string, size: number = 100): Promise<string> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
      createElement(QRCodeCanvas, {
        value: data,
        size,
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

async function loadImageAsDataUrl(src: string): Promise<string> {
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
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function formatDateFr(date: string | Date | null): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
  } catch {
    return '-';
  }
}

/**
 * Extracts plain text sections from HTML content
 * Looks for <h2> headers and returns their text content as sections
 */
function extractSections(html: string): {
  expose: string;
  avis: string;
  recommandations: string;
  fullText: string;
} {
  const div = document.createElement('div');
  div.innerHTML = html;

  const sections: Record<string, string> = {};
  let currentSection = '';
  let fullText = '';

  for (const child of Array.from(div.childNodes)) {
    const el = child as HTMLElement;
    const text = el.textContent?.trim() || '';
    fullText += text + '\n';

    if (el.tagName === 'H2' || el.tagName === 'H1') {
      const sectionName = text.toLowerCase();
      if (sectionName.includes('expos')) currentSection = 'expose';
      else if (sectionName.includes('avis')) currentSection = 'avis';
      else if (sectionName.includes('recommandation')) currentSection = 'recommandations';
      else currentSection = sectionName;
    } else if (currentSection && text) {
      sections[currentSection] = (sections[currentSection] || '') + text + '\n';
    }
  }

  return {
    expose: sections['expose']?.trim() || '',
    avis: sections['avis']?.trim() || '',
    recommandations: sections['recommandations']?.trim() || '',
    fullText: fullText.trim(),
  };
}

// ============================================================================
// PAGE 1 - EN-TETE + IDENTIFICATION + CONTENU
// ============================================================================

async function generatePage1(
  doc: jsPDF,
  metadata: NoteCanvasMetadata,
  editorContent: string,
  directionLabel: string,
  directionSigle: string,
  logoDataUrl: string,
  qrDataUrl: string
): Promise<void> {
  const { margins, colors, fonts } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = margins.top;

  // --- EN-TETE ARTI ---
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', margins.left, yPos, 30, 15);
    } catch (e) {
      console.warn('Could not add logo:', e);
    }
  }

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', pageWidth - margins.right - 15, yPos, 15, 15);
    } catch (e) {
      console.warn('Could not add QR code:', e);
    }
  }

  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.gray);
  doc.text("REPUBLIQUE DE COTE D'IVOIRE", pageWidth / 2, yPos + 4, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.text('Union - Discipline - Travail', pageWidth / 2, yPos + 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  yPos += 18;

  // Ligne de separation
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.8);
  doc.line(margins.left, yPos, pageWidth - margins.right, yPos);
  yPos += 5;

  // --- BLOC IDENTIFICATION ---
  // Titre direction (fond bleu fonce, texte blanc)
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      [
        {
          content: directionLabel.toUpperCase(),
          colSpan: 2,
          styles: {
            fillColor: colors.primary,
            textColor: colors.white,
            fontStyle: 'bold',
            fontSize: fonts.subtitle,
          },
        },
      ],
      [
        {
          content: 'Reference plan',
          styles: { fillColor: colors.primaryLight, fontStyle: 'bold' },
        },
        metadata.reference || '-',
      ],
      [
        { content: 'Nom du plan', styles: { fillColor: colors.primaryLight, fontStyle: 'bold' } },
        metadata.objet || '-',
      ],
      [
        { content: 'Destinataire', styles: { fillColor: colors.primaryLight, fontStyle: 'bold' } },
        metadata.destinataire || '-',
      ],
    ],
    styles: {
      fontSize: fonts.body,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: pageWidth - margins.left - margins.right - 40 },
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // --- BLOC DESCRIPTION ---
  const descRows: unknown[][] = [];
  if (metadata.objectifsStrategiques) {
    descRows.push([
      { content: 'Direction', styles: { fillColor: colors.primaryLight, fontStyle: 'bold' } },
      directionLabel,
    ]);
    descRows.push([
      { content: 'OS', styles: { fillColor: colors.primaryLight, fontStyle: 'bold' } },
      metadata.objectifsStrategiques,
    ]);
  }
  if (metadata.actionRattachement) {
    descRows.push([
      { content: 'ACTION', styles: { fillColor: colors.primaryLight, fontStyle: 'bold' } },
      metadata.actionRattachement,
    ]);
  }
  if (metadata.budgetPrevisionnel) {
    descRows.push([
      {
        content: 'Budget previsionnel',
        styles: { fillColor: colors.primaryLight, fontStyle: 'bold' },
      },
      metadata.budgetPrevisionnel,
    ]);
  }

  if (descRows.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: descRows,
      styles: {
        fontSize: fonts.body,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: pageWidth - margins.left - margins.right - 40 },
      },
      theme: 'grid',
      margin: { left: margins.left, right: margins.right },
    });
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // --- BLOC EXPOSE / AVIS / RECOMMANDATIONS ---
  const sections = extractSections(editorContent);

  const contentRows: unknown[][] = [];
  if (sections.expose) {
    contentRows.push([
      {
        content: 'Expose',
        styles: { fillColor: colors.primaryLight, fontStyle: 'bold', valign: 'top' },
      },
      sections.expose,
    ]);
  }
  if (sections.avis) {
    contentRows.push([
      {
        content: 'Avis',
        styles: { fillColor: colors.primaryLight, fontStyle: 'bold', valign: 'top' },
      },
      sections.avis,
    ]);
  }
  if (sections.recommandations) {
    contentRows.push([
      {
        content: 'Recommandations',
        styles: { fillColor: colors.primaryLight, fontStyle: 'bold', valign: 'top' },
      },
      sections.recommandations,
    ]);
  }

  // If no structured sections found, use the full text
  if (contentRows.length === 0 && sections.fullText) {
    contentRows.push([
      {
        content: 'Contenu',
        styles: { fillColor: colors.primaryLight, fontStyle: 'bold', valign: 'top' },
      },
      sections.fullText,
    ]);
  }

  if (contentRows.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: contentRows,
      styles: {
        fontSize: fonts.body,
        cellPadding: 4,
        valign: 'top',
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: pageWidth - margins.left - margins.right - 40 },
      },
      theme: 'grid',
      margin: { left: margins.left, right: margins.right },
    });
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // --- PJ mention ---
  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text);
  if (yPos < doc.internal.pageSize.getHeight() - 30) {
    doc.text('PJ :', margins.left, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Le plan detaille par activites et taches', margins.left + 12, yPos + 5);
  }
}

// ============================================================================
// PAGE 2 - OBSERVATIONS DG + DECISION + SIGNATURE
// ============================================================================

async function generatePage2(
  doc: jsPDF,
  metadata: NoteCanvasMetadata,
  qrDataUrl: string,
  verificationUrl: string
): Promise<void> {
  const { margins, colors, fonts } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = margins.top;

  doc.addPage();

  // --- OBSERVATIONS DU DIRECTEUR GENERAL ---
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      [
        {
          content: 'OBSERVATIONS DU DIRECTEUR GENERAL',
          styles: {
            fillColor: colors.primary,
            textColor: colors.white,
            fontStyle: 'bold',
            fontSize: fonts.subtitle,
            halign: 'center',
          },
        },
      ],
      [
        {
          content: metadata.observationsDg || '\n\n\n\n\n',
          styles: {
            minCellHeight: 60,
            valign: 'top',
          },
        },
      ],
    ],
    styles: {
      fontSize: fonts.body,
      cellPadding: 6,
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // --- DECISION / SIGNATURE ---
  autoTable(doc, {
    startY: yPos,
    head: [
      [
        {
          content: 'DATE',
          styles: { fillColor: colors.primaryLight, fontStyle: 'bold', halign: 'center' },
        },
        {
          content: 'DECISION',
          styles: { fillColor: colors.primaryLight, fontStyle: 'bold', halign: 'center' },
        },
        {
          content: 'SIGNATURE',
          styles: { fillColor: colors.primaryLight, fontStyle: 'bold', halign: 'center' },
        },
      ],
    ],
    body: [
      [
        metadata.dateDecision
          ? `Abidjan, le ${formatDateFr(metadata.dateDecision)}`
          : 'Abidjan, le',
        metadata.decisionDg || '',
        metadata.signataireNom
          ? `${metadata.signataireTitre || ''}\n\n${metadata.signataireNom}`
          : '',
      ],
    ],
    styles: {
      fontSize: fonts.body,
      cellPadding: 6,
      minCellHeight: 30,
      valign: 'top',
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  // --- QR CODE DE VERIFICATION ---
  const qrSize = 40;
  const qrX = pageWidth / 2 - qrSize / 2;
  const qrY = pageHeight - margins.bottom - qrSize - 25;

  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.gray);
  doc.text("Scannez ce QR Code pour verifier l'authenticite", pageWidth / 2, qrY - 5, {
    align: 'center',
  });

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch (e) {
      console.warn('Could not add QR code on page 2:', e);
    }
  }

  doc.setFontSize(fonts.small - 1);
  doc.text(verificationUrl, pageWidth / 2, qrY + qrSize + 5, { align: 'center' });

  doc.text(
    'Ce document est authentifie electroniquement. Toute falsification est passible de poursuites.',
    pageWidth / 2,
    qrY + qrSize + 12,
    { align: 'center' }
  );
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

export async function generateNoteDirectionPdf(
  options: GenerateDirectionPdfOptions
): Promise<PdfGenerationResult> {
  const { note, metadata, editorContent, directionLabel, directionSigle } = options;
  const baseUrl = window.location.origin;
  const verificationUrl = `${baseUrl}/verification/note-direction/${note.id}`;

  const qrDataUrl = await generateQRCodeDataUrl(verificationUrl, 150);

  let logoDataUrl = '';
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArti);
  } catch (e) {
    console.warn('Could not load logo:', e);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Page 1
  await generatePage1(
    doc,
    metadata,
    editorContent,
    directionLabel,
    directionSigle,
    logoDataUrl,
    qrDataUrl
  );

  // Page 2
  await generatePage2(doc, metadata, qrDataUrl, verificationUrl);

  // Metadata
  doc.setProperties({
    title: `Note Direction - ${metadata.reference || 'Brouillon'}`,
    subject: metadata.objet || '',
    author: 'ARTI - SYGFP',
    creator: 'SYGFP - Systeme de Gestion des Finances Publiques',
    keywords: 'note, direction, ARTI, officiel',
  });

  const blob = doc.output('blob');
  const filename = `ARTI_NOTE_${directionSigle}_${metadata.reference || 'DRAFT'}_${format(
    new Date(),
    'yyyyMMdd_HHmmss'
  )}.pdf`;

  return { blob, filename };
}

// ============================================================================
// TELECHARGEMENT DIRECT
// ============================================================================

export async function downloadNoteDirectionPdf(
  options: GenerateDirectionPdfOptions
): Promise<void> {
  const { blob, filename } = await generateNoteDirectionPdf(options);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
