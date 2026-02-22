/**
 * Service de génération PDF pour les Attestations de Liquidation (PROMPT 10)
 *
 * Format ARTI officiel "ARTI_ATTESTATION_LIQUIDATION_SYGFP" avec:
 * - Page 1: En-tête ARTI, informations liquidation, montants, retenues, imputation
 * - Page 2: Visas DAAF/DG, signatures, QR Code de vérification
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { Liquidation, VALIDATION_STEPS } from '@/hooks/useLiquidations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoArti from '@/assets/logo-arti.jpg';

// ============================================================================
// TYPES
// ============================================================================

export interface LiquidationPdfOptions {
  liquidation: Liquidation;
  baseUrl?: string;
}

export interface PdfGenerationResult {
  blob: Blob;
  filename: string;
}

// ============================================================================
// CONFIGURATION PDF
// ============================================================================

const PDF_CONFIG = {
  margins: {
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
  },
  colors: {
    primary: [0, 51, 102] as [number, number, number],
    secondary: [100, 100, 100] as [number, number, number],
    text: [30, 30, 30] as [number, number, number],
    lightGray: [248, 248, 248] as [number, number, number],
    successBg: [230, 250, 230] as [number, number, number],
    dangerBg: [255, 230, 230] as [number, number, number],
    ttcBg: [230, 240, 250] as [number, number, number],
  },
  fonts: {
    title: 14,
    subtitle: 11,
    body: 9,
    small: 8,
  },
};

// ============================================================================
// UTILITAIRES
// ============================================================================

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

function formatDateShort(date: string | Date | null): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '-';
  }
}

function formatMontant(montant: number | null | undefined): string {
  if (montant == null) return '-';
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

// ============================================================================
// GÉNÉRATION PDF - PAGE 1
// ============================================================================

async function generatePage1(
  doc: jsPDF,
  liquidation: Liquidation,
  qrDataUrl: string,
  logoDataUrl: string
): Promise<number> {
  const { margins, colors, fonts } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = margins.top;

  // ── EN-TÊTE ARTI ──
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', margins.left, yPos, 25, 25);
    } catch (e) {
      console.warn('Could not add logo:', e);
    }
  }

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', pageWidth - margins.right - 18, yPos, 18, 18);
    } catch (e) {
      console.warn('Could not add QR code:', e);
    }
  }

  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.secondary);
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE", pageWidth / 2, yPos + 4, { align: 'center' });
  doc.setFontSize(fonts.small - 1);
  doc.text('Union - Discipline - Travail', pageWidth / 2, yPos + 8, { align: 'center' });

  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORITÉ DE RÉGULATION DU', pageWidth / 2, yPos + 15, { align: 'center' });
  doc.text('TRANSPORT INTÉRIEUR', pageWidth / 2, yPos + 19, { align: 'center' });

  yPos += 28;

  // Ligne séparatrice
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margins.left, yPos, pageWidth - margins.right, yPos);
  yPos += 8;

  // ── TITRE ──
  doc.setFontSize(fonts.title);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('ATTESTATION DE LIQUIDATION', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // ── INFORMATIONS PRINCIPALES ──
  const directionLabel =
    liquidation.engagement?.budget_line?.direction?.sigle ||
    liquidation.engagement?.budget_line?.direction?.label ||
    '-';
  const fournisseurNom =
    liquidation.engagement?.marche?.prestataire?.raison_sociale ||
    liquidation.engagement?.fournisseur ||
    '-';

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      [
        'N° Liquidation',
        liquidation.numero || '-',
        'Date',
        formatDateShort(liquidation.date_liquidation),
      ],
      [
        'N° Engagement',
        liquidation.engagement?.numero || '-',
        'Exercice',
        String(liquidation.exercice || '-'),
      ],
      ['Direction', directionLabel, 'Statut', (liquidation.statut || '-').toUpperCase()],
      ['Fournisseur', { content: fournisseurNom, colSpan: 3 }],
      ['Objet', { content: liquidation.engagement?.objet || '-', colSpan: 3 }],
      [
        'Réf. Facture',
        liquidation.reference_facture || '-',
        'Régime fiscal',
        liquidation.regime_fiscal || '-',
      ],
    ],
    styles: { fontSize: fonts.body, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32, fillColor: colors.lightGray },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', cellWidth: 28, fillColor: colors.lightGray },
      3: { cellWidth: 50 },
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── MONTANTS ──
  doc.setFontSize(fonts.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('DÉTAIL FINANCIER', margins.left, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Désignation', 'Montant']],
    body: [
      ['Montant Hors Taxes (HT)', formatMontant(liquidation.montant_ht)],
      [`TVA (${liquidation.tva_taux || 0}%)`, formatMontant(liquidation.tva_montant)],
      ['Montant TTC', formatMontant(liquidation.montant)],
    ],
    styles: { fontSize: fonts.body, cellPadding: 3 },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: 'right' as const },
    },
    didParseCell: (data: {
      row: { index: number };
      cell: { styles: Record<string, unknown> };
      section: string;
    }) => {
      if (data.section === 'body' && data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = colors.ttcBg;
      }
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── RETENUES ──
  doc.setFontSize(fonts.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('RETENUES FISCALES', margins.left, yPos);
  yPos += 5;

  const retenueRows: string[][] = [];
  if (liquidation.airsi_montant) {
    retenueRows.push([
      `AIRSI (${liquidation.airsi_taux || 0}%)`,
      formatMontant(liquidation.airsi_montant),
    ]);
  }
  if (liquidation.retenue_bic_montant) {
    retenueRows.push([
      `BIC (${liquidation.retenue_bic_taux || 0}%)`,
      formatMontant(liquidation.retenue_bic_montant),
    ]);
  }
  if (liquidation.retenue_bnc_montant) {
    retenueRows.push([
      `BNC (${liquidation.retenue_bnc_taux || 0}%)`,
      formatMontant(liquidation.retenue_bnc_montant),
    ]);
  }
  if (liquidation.retenue_source_montant) {
    retenueRows.push([
      `Retenue à la source (${liquidation.retenue_source_taux || 0}%)`,
      formatMontant(liquidation.retenue_source_montant),
    ]);
  }
  if (liquidation.penalites_montant) {
    retenueRows.push(['Pénalités de retard', formatMontant(liquidation.penalites_montant)]);
  }
  retenueRows.push(['TOTAL RETENUES', formatMontant(liquidation.total_retenues)]);
  retenueRows.push(['NET À PAYER', formatMontant(liquidation.net_a_payer)]);

  autoTable(doc, {
    startY: yPos,
    head: [['Désignation', 'Montant']],
    body: retenueRows,
    styles: { fontSize: fonts.body, cellPadding: 2.5 },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: 'right' as const },
    },
    didParseCell: (data: {
      row: { index: number };
      cell: { styles: Record<string, unknown> };
      section: string;
    }) => {
      if (data.section === 'body' && data.row.index === retenueRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = colors.successBg;
      }
      if (data.section === 'body' && data.row.index === retenueRows.length - 2) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── SERVICE FAIT ──
  if (yPos < pageHeight - 60) {
    doc.setFontSize(fonts.subtitle);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('SERVICE FAIT', margins.left, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: [
        ['Certifié', liquidation.service_fait ? 'OUI' : 'NON'],
        ['Date certification', formatDateShort(liquidation.service_fait_date)],
        ['Certifié par', liquidation.sf_certifier?.full_name || '-'],
        [
          'Imputation budgétaire',
          `${liquidation.engagement?.budget_line?.code || '-'} - ${liquidation.engagement?.budget_line?.label || '-'}`,
        ],
      ],
      styles: { fontSize: fonts.body, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40, fillColor: colors.lightGray },
        1: { cellWidth: 120 },
      },
      theme: 'grid',
      margin: { left: margins.left, right: margins.right },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // ── PIED DE PAGE ──
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.secondary);
  doc.text(
    'Document généré par SYGFP - Système de Gestion des Finances Publiques ARTI',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  return yPos;
}

// ============================================================================
// GÉNÉRATION PDF - PAGE 2 (VISAS + SIGNATURES)
// ============================================================================

async function generatePage2(
  doc: jsPDF,
  liquidation: Liquidation,
  qrDataUrl: string,
  liquidationUrl: string
): Promise<void> {
  const { margins, colors, fonts } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = margins.top;

  doc.addPage();

  // ── TITRE ──
  doc.setFontSize(fonts.title + 2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('VISAS ET VALIDATION', pageWidth / 2, yPos + 10, { align: 'center' });
  yPos += 20;

  // Ligne décorative
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(1);
  doc.line(margins.left + 30, yPos, pageWidth - margins.right - 30, yPos);
  yPos += 8;

  // Référence et objet
  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.secondary);
  doc.text(
    `Réf: ${liquidation.numero || 'N/A'} — Net à payer: ${formatMontant(liquidation.net_a_payer)}`,
    pageWidth / 2,
    yPos,
    {
      align: 'center',
    }
  );
  yPos += 5;

  const objetTrunc =
    liquidation.engagement?.objet && liquidation.engagement.objet.length > 80
      ? liquidation.engagement.objet.substring(0, 77) + '...'
      : liquidation.engagement?.objet || '';
  doc.text(`Objet: ${objetTrunc}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // ── TABLEAU DES VISAS ──
  const visaData: string[][] = VALIDATION_STEPS.map((step) => {
    const userId = liquidation[`${step.visaPrefix}_user_id` as keyof Liquidation] as string | null;
    const date = liquidation[`${step.visaPrefix}_date` as keyof Liquidation] as string | null;
    const commentaire = liquidation[`${step.visaPrefix}_commentaire` as keyof Liquidation] as
      | string
      | null;

    let valideurNom = '-';
    if (step.visaPrefix === 'visa_daaf') valideurNom = liquidation.visa_daaf_user?.full_name || '-';
    else if (step.visaPrefix === 'visa_dg')
      valideurNom = liquidation.visa_dg_user?.full_name || '-';

    let statutLabel = 'EN ATTENTE';
    if (userId) {
      statutLabel = 'ACCORDÉ';
    }

    return [
      `${step.order}`,
      step.label,
      statutLabel,
      valideurNom,
      formatDateShort(date),
      commentaire || '-',
    ];
  });

  // Ajouter la ligne de rejet si applicable
  if (liquidation.statut === 'rejete' && liquidation.motif_rejet) {
    visaData.push(['', 'MOTIF DU REJET', liquidation.motif_rejet, '', '', '']);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['N°', 'Étape', 'Statut', 'Valideur', 'Date', 'Commentaire']],
    body: visaData,
    styles: { fontSize: fonts.small, cellPadding: 3 },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' as const },
      1: { cellWidth: 40 },
      2: { cellWidth: 22, halign: 'center' as const },
      3: { cellWidth: 35 },
      4: { cellWidth: 22, halign: 'center' as const },
      5: { cellWidth: 33 },
    },
    didParseCell: (data: {
      section: string;
      column: { index: number };
      cell: { raw: unknown; styles: Record<string, unknown> };
    }) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = data.cell.raw as string;
        if (val === 'ACCORDÉ') {
          data.cell.styles.textColor = [0, 128, 0];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'REJETÉ') {
          data.cell.styles.textColor = [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // ── SIGNATURES ──
  const signatureY = Math.max(yPos + 10, pageHeight - 80);

  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text);
  doc.text(`Abidjan, le ${formatDateFr(new Date())}`, margins.left, signatureY);

  // 3 colonnes de signatures
  const contentWidth = pageWidth - margins.left - margins.right;
  const sigWidth = contentWidth / 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fonts.body);
  doc.text("L'Ordonnateur", margins.left + sigWidth * 0 + sigWidth / 2, signatureY + 10, {
    align: 'center',
  });
  doc.text(
    'Le Contrôleur Budgétaire',
    margins.left + sigWidth * 1 + sigWidth / 2,
    signatureY + 10,
    { align: 'center' }
  );
  doc.text('Le DAAF', margins.left + sigWidth * 2 + sigWidth / 2, signatureY + 10, {
    align: 'center',
  });

  // Lignes de signature
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(0.3);
  for (let i = 0; i < 3; i++) {
    const centerX = margins.left + sigWidth * i + sigWidth / 2;
    doc.line(centerX - 25, signatureY + 30, centerX + 25, signatureY + 30);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.secondary);
  for (let i = 0; i < 3; i++) {
    const centerX = margins.left + sigWidth * i + sigWidth / 2;
    doc.text('Signature et cachet', centerX, signatureY + 35, { align: 'center' });
  }

  // ── QR CODE ──
  const qrSize = 35;
  const qrX = pageWidth / 2 - qrSize / 2;
  const qrY = pageHeight - margins.bottom - qrSize - 25;

  doc.setFontSize(fonts.small);
  doc.setTextColor(...colors.secondary);
  doc.text("Scannez ce QR Code pour vérifier l'authenticité", pageWidth / 2, qrY - 5, {
    align: 'center',
  });

  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4);

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch (e) {
      console.warn('Could not add QR code on page 2:', e);
    }
  }

  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.primary);
  const urlTrunc =
    liquidationUrl.length > 60 ? liquidationUrl.substring(0, 57) + '...' : liquidationUrl;
  doc.text(urlTrunc, pageWidth / 2, qrY + qrSize + 6, { align: 'center' });

  // Note de sécurité
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.secondary);
  doc.text(
    'Ce document est authentifié électroniquement. Toute falsification est passible de poursuites.',
    pageWidth / 2,
    qrY + qrSize + 14,
    { align: 'center' }
  );

  // Pied de page
  doc.text(
    'ARTI - SYGFP | Document officiel généré automatiquement',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );
}

// ============================================================================
// FONCTION PRINCIPALE DE GÉNÉRATION
// ============================================================================

export async function generateLiquidationPdf(
  options: LiquidationPdfOptions
): Promise<PdfGenerationResult> {
  const { liquidation, baseUrl = window.location.origin } = options;

  const liquidationUrl = `${baseUrl}/liquidations?detail=${liquidation.id}`;

  // Générer le QR Code
  const qrDataUrl = await generateQRCodeDataUrl(liquidationUrl, 150);

  // Charger le logo
  let logoDataUrl = '';
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArti);
  } catch (e) {
    console.warn('Could not load logo:', e);
  }

  // Créer le document PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Page 1: Informations liquidation + montants + retenues
  await generatePage1(doc, liquidation, qrDataUrl, logoDataUrl);

  // Page 2: Visas + signatures + QR Code
  await generatePage2(doc, liquidation, qrDataUrl, liquidationUrl);

  // Métadonnées
  const noteRef = liquidation.numero || 'BROUILLON';
  doc.setProperties({
    title: `ARTI_ATTESTATION_LIQUIDATION_SYGFP - ${noteRef}`,
    subject: liquidation.engagement?.objet || '',
    author: 'ARTI - SYGFP',
    creator: 'SYGFP - Système de Gestion des Finances Publiques',
    keywords: 'liquidation, attestation, ARTI, officiel',
  });

  // Générer le blob
  const blob = doc.output('blob');
  const refClean = (noteRef || 'DRAFT').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ARTI_ATTESTATION_LIQUIDATION_${refClean}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;

  return { blob, filename };
}

// ============================================================================
// FONCTION DE TÉLÉCHARGEMENT DIRECT
// ============================================================================

export async function downloadLiquidationPdf(options: LiquidationPdfOptions): Promise<void> {
  const { blob, filename } = await generateLiquidationPdf(options);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
