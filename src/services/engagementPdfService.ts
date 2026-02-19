/**
 * Service de génération PDF pour les Bons d'Engagement (PROMPT 7)
 *
 * Format ARTI officiel "ARTI_BON_ENGAGEMENT_SYGFP" avec:
 * - Page 1: En-tête ARTI, informations engagement, montants, imputation budgétaire, situation
 * - Page 2: Tableau des visas, signatures, QR Code de vérification
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { EngagementDetail, BudgetAvailability, VALIDATION_STEPS } from '@/hooks/useEngagements';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoArti from '@/assets/logo-arti.jpg';

// ============================================================================
// TYPES
// ============================================================================

export interface EngagementPdfOptions {
  engagement: EngagementDetail;
  availability?: BudgetAvailability | null;
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
  engagement: EngagementDetail,
  availability: BudgetAvailability | null,
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
  doc.text("BON D'ENGAGEMENT BUDGÉTAIRE", pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // ── INFORMATIONS PRINCIPALES ──
  const directionLabel =
    engagement.budget_line?.direction?.sigle || engagement.budget_line?.direction?.label || '-';
  const fournisseurNom =
    engagement.fournisseur ||
    engagement.prestataire_detail?.raison_sociale ||
    engagement.marche?.prestataire?.raison_sociale ||
    '-';

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      [
        'N° Référence',
        engagement.numero || '-',
        'Date',
        formatDateShort(engagement.date_engagement),
      ],
      ['Exercice', String(engagement.exercice || '-'), 'Direction', directionLabel],
      [
        'Type',
        engagement.type_engagement === 'sur_marche' ? 'Sur marché' : 'Hors marché',
        'Statut',
        (engagement.statut || '-').toUpperCase(),
      ],
      ['Fournisseur', { content: fournisseurNom, colSpan: 3 }],
      ['Objet', { content: engagement.objet || '-', colSpan: 3 }],
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

  const montantHT = engagement.montant_ht || null;
  const tvaRate = engagement.tva || 0;
  const tvaAmount = montantHT != null && tvaRate ? montantHT * (tvaRate / 100) : null;

  autoTable(doc, {
    startY: yPos,
    head: [['Désignation', 'Montant']],
    body: [
      ['Montant Hors Taxes (HT)', formatMontant(montantHT)],
      [`TVA (${tvaRate}%)`, formatMontant(tvaAmount)],
      ['MONTANT TOTAL TTC', formatMontant(engagement.montant)],
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

  // ── IMPUTATION BUDGÉTAIRE ──
  doc.setFontSize(fonts.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('IMPUTATION BUDGÉTAIRE', margins.left, yPos);
  yPos += 5;

  const budgetData: string[][] = [
    [
      'Ligne budgétaire',
      `${engagement.budget_line?.code || '-'} - ${engagement.budget_line?.label || '-'}`,
    ],
  ];

  if (engagement.budget_line?.objectif_strategique) {
    budgetData.push([
      'Objectif stratégique',
      `${engagement.budget_line.objectif_strategique.code} - ${engagement.budget_line.objectif_strategique.libelle}`,
    ]);
  }
  if (engagement.budget_line?.mission) {
    budgetData.push([
      'Mission',
      `${engagement.budget_line.mission.code} - ${engagement.budget_line.mission.libelle}`,
    ]);
  }
  if (engagement.budget_line?.action) {
    budgetData.push([
      'Action',
      `${engagement.budget_line.action.code} - ${engagement.budget_line.action.libelle}`,
    ]);
  }
  if (engagement.budget_line?.nomenclature_nbe) {
    budgetData.push([
      'NBE',
      `${engagement.budget_line.nomenclature_nbe.code} - ${engagement.budget_line.nomenclature_nbe.libelle}`,
    ]);
  }
  if (engagement.budget_line?.plan_comptable_sysco) {
    budgetData.push([
      'Compte SYSCOA',
      `${engagement.budget_line.plan_comptable_sysco.code} - ${engagement.budget_line.plan_comptable_sysco.libelle}`,
    ]);
  }

  if (engagement.marche) {
    budgetData.push([
      'Réf. marché',
      `${engagement.marche.numero || '-'} - ${engagement.marche.objet || ''}`,
    ]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: budgetData,
    styles: { fontSize: fonts.body, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, fillColor: colors.lightGray },
      1: { cellWidth: 120 },
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── SITUATION BUDGÉTAIRE (si disponible et espace suffisant) ──
  if (availability && yPos < pageHeight - 80) {
    doc.setFontSize(fonts.subtitle);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('SITUATION BUDGÉTAIRE', margins.left, yPos);
    yPos += 5;

    const tauxConsommation =
      availability.dotation_actuelle > 0
        ? (
            ((availability.engagements_anterieurs + availability.engagement_actuel) /
              availability.dotation_actuelle) *
            100
          ).toFixed(2)
        : '0.00';

    autoTable(doc, {
      startY: yPos,
      head: [['Élément', 'Montant']],
      body: [
        ['Dotation initiale', formatMontant(availability.dotation_initiale)],
        ['Virements reçus (+)', formatMontant(availability.virements_recus)],
        ['Virements émis (-)', formatMontant(availability.virements_emis)],
        ['Dotation actuelle', formatMontant(availability.dotation_actuelle)],
        ['Engagements antérieurs', formatMontant(availability.engagements_anterieurs)],
        ['Engagement actuel', formatMontant(availability.engagement_actuel)],
        ['Disponible après engagement', formatMontant(availability.disponible)],
        ['Taux de consommation', `${tauxConsommation}%`],
      ],
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
        if (data.section === 'body') {
          // Bold dotation actuelle
          if (data.row.index === 3) {
            data.cell.styles.fontStyle = 'bold';
          }
          // Color disponible row
          if (data.row.index === 6) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = availability.is_sufficient
              ? colors.successBg
              : colors.dangerBg;
          }
        }
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
  engagement: EngagementDetail,
  qrDataUrl: string,
  engagementUrl: string
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
  doc.text(`Réf: ${engagement.numero || 'N/A'}`, pageWidth / 2, yPos, {
    align: 'center',
  });
  yPos += 5;

  const objetTrunc =
    engagement.objet && engagement.objet.length > 80
      ? engagement.objet.substring(0, 77) + '...'
      : engagement.objet || '';
  doc.text(`Objet: ${objetTrunc}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // ── TABLEAU DES VISAS ──
  const visaData: (string | { content: string; colSpan: number })[][] = VALIDATION_STEPS.map(
    (step) => {
      const userId = engagement[`${step.visaPrefix}_user_id` as keyof EngagementDetail] as
        | string
        | null;
      const date = engagement[`${step.visaPrefix}_date` as keyof EngagementDetail] as string | null;
      const commentaire = engagement[`${step.visaPrefix}_commentaire` as keyof EngagementDetail] as
        | string
        | null;

      let valideurNom = '-';
      if (step.visaPrefix === 'visa_saf') valideurNom = engagement.visa_saf_user?.full_name || '-';
      else if (step.visaPrefix === 'visa_cb')
        valideurNom = engagement.visa_cb_user?.full_name || '-';
      else if (step.visaPrefix === 'visa_daaf')
        valideurNom = engagement.visa_daaf_user?.full_name || '-';
      else if (step.visaPrefix === 'visa_dg')
        valideurNom = engagement.visa_dg_user?.full_name || '-';

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
    }
  );

  // Ajouter la ligne de rejet si applicable
  if (engagement.statut === 'rejete' && engagement.motif_rejet) {
    visaData.push(['', 'MOTIF DU REJET', { content: engagement.motif_rejet, colSpan: 4 }]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['N°', 'Étape', 'Statut', 'Valideur', 'Date', 'Commentaire']],
    body: visaData as string[][],
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
    engagementUrl.length > 60 ? engagementUrl.substring(0, 57) + '...' : engagementUrl;
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

export async function generateEngagementPdf(
  options: EngagementPdfOptions
): Promise<PdfGenerationResult> {
  const { engagement, availability = null, baseUrl = window.location.origin } = options;

  const engagementUrl = `${baseUrl}/execution/engagements?detail=${engagement.id}`;

  // Générer le QR Code
  const qrDataUrl = await generateQRCodeDataUrl(engagementUrl, 150);

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

  // Page 1: Informations engagement + montants + budget
  await generatePage1(doc, engagement, availability, qrDataUrl, logoDataUrl);

  // Page 2: Visas + signatures + QR Code
  await generatePage2(doc, engagement, qrDataUrl, engagementUrl);

  // Métadonnées
  const noteRef = engagement.numero || 'BROUILLON';
  doc.setProperties({
    title: `ARTI_BON_ENGAGEMENT_SYGFP - ${noteRef}`,
    subject: engagement.objet || '',
    author: 'ARTI - SYGFP',
    creator: 'SYGFP - Système de Gestion des Finances Publiques',
    keywords: 'engagement, budget, ARTI, officiel, bon',
  });

  // Générer le blob
  const blob = doc.output('blob');
  const refClean = (noteRef || 'DRAFT').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ARTI_BON_ENGAGEMENT_${refClean}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;

  return { blob, filename };
}

// ============================================================================
// FONCTION DE TÉLÉCHARGEMENT DIRECT
// ============================================================================

export async function downloadEngagementPdf(options: EngagementPdfOptions): Promise<void> {
  const { blob, filename } = await generateEngagementPdf(options);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  generateEngagementPdf,
  downloadEngagementPdf,
};
