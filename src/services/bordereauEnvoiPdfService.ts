/**
 * Service de génération PDF pour les Bordereaux d'Envoi au Comptable
 *
 * Format officiel ARTI "BORDEREAU D'ENVOI AU COMPTABLE" avec:
 * - En-tête ARTI officiel
 * - Informations du bordereau (numéro, date, exercice)
 * - Tableau des liquidations transmises (références, montants, bénéficiaires)
 * - Récapitulatif financier
 * - 3 zones de signatures : L'Ordonnateur, Le Contrôleur Budgétaire, Le Comptable
 */

import jsPDF from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoArti from '@/assets/logo-arti.jpg';

// ============================================================================
// TYPES
// ============================================================================

export interface BordereauLiquidationItem {
  id: string;
  numero: string;
  engagement_numero: string;
  objet: string;
  beneficiaire: string;
  montant_ttc: number;
  net_a_payer: number;
  total_retenues: number;
  date_validation: string | null;
  direction_sigle: string;
}

export interface BordereauEnvoiOptions {
  liquidations: BordereauLiquidationItem[];
  numeroBordereau: string;
  exercice: string;
  destinataire?: string;
  objet?: string;
}

export interface BordereauPdfResult {
  blob: Blob;
  filename: string;
}

// ============================================================================
// CONFIGURATION PDF
// ============================================================================

const PDF_CONFIG = {
  margins: { top: 15, left: 15, right: 15, bottom: 15 },
  colors: {
    primary: [0, 51, 102] as [number, number, number],
    secondary: [100, 100, 100] as [number, number, number],
    text: [30, 30, 30] as [number, number, number],
    lightGray: [248, 248, 248] as [number, number, number],
    totalBg: [230, 240, 250] as [number, number, number],
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

function formatMontant(montant: number | null | undefined): string {
  if (montant == null) return '-';
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

function formatDateFr(date: Date): string {
  return format(date, 'dd MMMM yyyy', { locale: fr });
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

// ============================================================================
// GÉNÉRATION PDF
// ============================================================================

export async function generateBordereauEnvoiPdf(
  options: BordereauEnvoiOptions
): Promise<BordereauPdfResult> {
  const {
    liquidations,
    numeroBordereau,
    exercice,
    destinataire = "Monsieur le Trésorier de l'ARTI",
    objet = 'Transmission de pièces de liquidation pour paiement',
  } = options;

  const { margins, colors, fonts } = PDF_CONFIG;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = margins.top;

  // Charger le logo
  let logoDataUrl = '';
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArti);
  } catch {
    // Continue sans logo
  }

  // ── EN-TÊTE ARTI ──
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', margins.left, yPos, 25, 25);
    } catch {
      // Skip logo on error
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

  // Date en haut à droite
  doc.setFontSize(fonts.small);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.secondary);
  doc.text(`Abidjan, le ${formatDateFr(new Date())}`, pageWidth - margins.right, yPos + 4, {
    align: 'right',
  });

  yPos += 28;

  // Ligne séparatrice
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margins.left, yPos, pageWidth - margins.right, yPos);
  yPos += 8;

  // ── TITRE ──
  doc.setFontSize(fonts.title + 2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text("BORDEREAU D'ENVOI AU COMPTABLE", pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // ── INFORMATIONS DU BORDEREAU ──
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['N° Bordereau', numeroBordereau, "Date d'émission", formatDateFr(new Date())],
      ['Exercice', exercice, 'Nombre de pièces', String(liquidations.length)],
      ['Destinataire', { content: destinataire, colSpan: 3 }],
      ['Objet', { content: objet, colSpan: 3 }],
    ],
    styles: { fontSize: fonts.body, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32, fillColor: colors.lightGray },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', cellWidth: 32, fillColor: colors.lightGray },
      3: { cellWidth: 50 },
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── INTRODUCTION ──
  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text);
  doc.text(
    `J'ai l'honneur de vous transmettre ci-joint les pièces de liquidation ci-après désignées, en vue du paiement :`,
    margins.left,
    yPos,
    { maxWidth: pageWidth - margins.left - margins.right }
  );
  yPos += 10;

  // ── TABLEAU DES LIQUIDATIONS ──
  const totaux = {
    montant_ttc: 0,
    retenues: 0,
    net_a_payer: 0,
  };

  const tableBody = liquidations.map((liq, idx) => {
    totaux.montant_ttc += liq.montant_ttc || 0;
    totaux.retenues += liq.total_retenues || 0;
    totaux.net_a_payer += liq.net_a_payer || 0;

    return [
      String(idx + 1),
      liq.numero || '-',
      liq.engagement_numero || '-',
      liq.beneficiaire || '-',
      liq.direction_sigle || '-',
      formatMontant(liq.montant_ttc),
      formatMontant(liq.total_retenues),
      formatMontant(liq.net_a_payer),
    ];
  });

  // Ligne de total
  tableBody.push([
    '',
    '',
    '',
    '',
    { content: 'TOTAUX', styles: { fontStyle: 'bold' } } as unknown as string,
    {
      content: formatMontant(totaux.montant_ttc),
      styles: { fontStyle: 'bold' },
    } as unknown as string,
    { content: formatMontant(totaux.retenues), styles: { fontStyle: 'bold' } } as unknown as string,
    {
      content: formatMontant(totaux.net_a_payer),
      styles: { fontStyle: 'bold' },
    } as unknown as string,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        'N°',
        'Réf. Liquidation',
        'Réf. Engagement',
        'Bénéficiaire',
        'Direction',
        'Montant TTC',
        'Retenues',
        'Net à payer',
      ],
    ],
    body: tableBody,
    styles: { fontSize: fonts.small, cellPadding: 2 },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 36 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 26, halign: 'right' },
    },
    didParseCell: (data: CellHookData) => {
      // Style la ligne de totaux
      if (data.section === 'body' && data.row.index === liquidations.length) {
        data.cell.styles.fillColor = colors.totalBg;
        data.cell.styles.fontStyle = 'bold';
      }
    },
    theme: 'grid',
    margin: { left: margins.left, right: margins.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── RÉCAPITULATIF ──
  doc.setFontSize(fonts.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text(`Montant total net à payer : ${formatMontant(totaux.net_a_payer)}`, margins.left, yPos);
  yPos += 5;

  doc.setFontSize(fonts.small);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...colors.secondary);
  doc.text(
    `Arrêté le présent bordereau à la somme de ${formatMontant(totaux.net_a_payer)} pour ${liquidations.length} pièce(s) de liquidation.`,
    margins.left,
    yPos,
    { maxWidth: pageWidth - margins.left - margins.right }
  );
  yPos += 12;

  // ── PIÈCES JOINTES ──
  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text);
  doc.text('Pièces jointes par dossier :', margins.left, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fonts.small);
  const pieces = [
    'Attestation de liquidation (certifiée service fait)',
    'Facture(s) du prestataire',
    'Bon de commande / Marché ou contrat',
    'Procès-verbal de réception (le cas échéant)',
    'Pièces justificatives RGCP',
  ];
  pieces.forEach((piece) => {
    doc.text(`  • ${piece}`, margins.left + 2, yPos);
    yPos += 4;
  });
  yPos += 4;

  // ── SIGNATURES ──
  const signatureY = Math.max(yPos + 5, pageHeight - 55);
  const sigWidth = (pageWidth - margins.left - margins.right) / 3;

  // Lignes de signatures
  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text);

  // Ordonnateur
  doc.text("L'Ordonnateur", margins.left + sigWidth / 2, signatureY, { align: 'center' });
  // Contrôleur Budgétaire
  doc.text('Le Contrôleur Budgétaire', margins.left + sigWidth + sigWidth / 2, signatureY, {
    align: 'center',
  });
  // Comptable
  doc.text('Le Comptable', margins.left + 2 * sigWidth + sigWidth / 2, signatureY, {
    align: 'center',
  });

  // Sous-titres
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.secondary);
  doc.text('(Le Directeur Général)', margins.left + sigWidth / 2, signatureY + 4, {
    align: 'center',
  });
  doc.text('(CB)', margins.left + sigWidth + sigWidth / 2, signatureY + 4, {
    align: 'center',
  });
  doc.text('(Le Trésorier)', margins.left + 2 * sigWidth + sigWidth / 2, signatureY + 4, {
    align: 'center',
  });

  // Lignes de signature
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(0.3);
  for (let i = 0; i < 3; i++) {
    const centerX = margins.left + sigWidth * i + sigWidth / 2;
    doc.line(centerX - 25, signatureY + 22, centerX + 25, signatureY + 22);
  }

  // "Signature et cachet"
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.secondary);
  for (let i = 0; i < 3; i++) {
    const centerX = margins.left + sigWidth * i + sigWidth / 2;
    doc.text('Signature et cachet', centerX, signatureY + 27, { align: 'center' });
  }

  // Date sous les signatures
  doc.setFont('helvetica', 'normal');
  for (let i = 0; i < 3; i++) {
    const centerX = margins.left + sigWidth * i + sigWidth / 2;
    doc.text('Date : ___/___/______', centerX, signatureY + 33, { align: 'center' });
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

  // Métadonnées
  doc.setProperties({
    title: `Bordereau d'envoi au comptable - ${numeroBordereau}`,
    subject: `Exercice ${exercice} - ${liquidations.length} liquidation(s)`,
    author: 'ARTI - SYGFP',
    creator: 'SYGFP - Système de Gestion des Finances Publiques',
    keywords: 'bordereau, envoi, comptable, liquidation, ARTI',
  });

  const blob = doc.output('blob');
  const refClean = numeroBordereau.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ARTI_BORDEREAU_ENVOI_${refClean}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;

  return { blob, filename };
}

// ============================================================================
// TÉLÉCHARGEMENT DIRECT
// ============================================================================

export async function downloadBordereauEnvoiPdf(options: BordereauEnvoiOptions): Promise<void> {
  const { blob, filename } = await generateBordereauEnvoiPdf(options);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
