/**
 * Générateur de PDF pour le Bon d'Engagement Budgétaire
 * Utilise l'infrastructure PDF ARTI (pdfHeader, pdfFooter, pdfStyles)
 */

import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  PDF_PAGE,
  PDF_MARGINS,
  PDF_COLORS,
  PDF_FONTS,
  PDF_DIMENSIONS,
  CONTENT_WIDTH,
} from './pdfStyles';
import { generatePDFHeader, loadImageAsDataUrl, addHeaderTitle } from './pdfHeader';
import {
  generatePDFFooter,
  generateSignatureTable,
  addWatermark,
  type SignataireInfo,
} from './pdfFooter';

import type { Engagement } from '@/hooks/useEngagements';
import { numberToWordsCFA } from '@/lib/utils/numberToWords';
import { formatCurrency } from '@/lib/utils';

import logoArti from '@/assets/logo-arti.jpg';

// ============================================================================
// TYPES
// ============================================================================

interface PrestatairePDF {
  raison_sociale: string;
  rccm?: string | null;
  adresse?: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(title, PDF_MARGINS.left, y);
  y += PDF_DIMENSIONS.spacing.sm;
  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(PDF_DIMENSIONS.lineWidth.thin);
  doc.line(PDF_MARGINS.left, y, PDF_MARGINS.left + CONTENT_WIDTH, y);
  return y + PDF_DIMENSIONS.spacing.md;
}

function drawLabelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth?: number
): void {
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(label, x, y);

  const labelWidth = doc.getTextWidth(label) + 2;
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.text);
  if (maxWidth) {
    doc.text(value, x + labelWidth, y, { maxWidth: maxWidth - labelWidth });
  } else {
    doc.text(value, x + labelWidth, y);
  }
}

function getPrestataire(engagement: Engagement): PrestatairePDF | null {
  const fromMarche = engagement.marche?.prestataire;
  const fromEB = engagement.expression_besoin?.marche?.prestataire;
  const source = fromMarche || fromEB;
  if (source) {
    return {
      raison_sociale: source.raison_sociale,
      rccm: source.rccm ?? null,
      adresse: source.adresse ?? null,
    };
  }
  if (engagement.fournisseur) {
    return { raison_sociale: engagement.fournisseur };
  }
  return null;
}

// ============================================================================
// MAIN
// ============================================================================

export async function generateBonEngagementPDF(engagement: Engagement): Promise<void> {
  const doc = new jsPDF({
    orientation: PDF_PAGE.orientation,
    unit: PDF_PAGE.unit,
    format: PDF_PAGE.format,
  });

  // Load logo
  let logoDataUrl: string | undefined;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArti);
  } catch {
    // Continue without logo
  }

  // ── EN-TÊTE ──
  const direction = engagement.budget_line?.direction;
  const { endY: headerEndY } = generatePDFHeader({
    doc,
    logoDataUrl,
    direction: direction?.label ?? undefined,
    directionSigle: direction?.sigle ?? undefined,
  });

  let yPos = addHeaderTitle(doc, "BON D'ENGAGEMENT BUDGÉTAIRE", headerEndY);

  // ── FILIGRANE si pas validé ──
  if (engagement.statut !== 'valide') {
    addWatermark({ doc, text: 'PROJET' });
  }

  // ── CARTOUCHE RÉFÉRENCE ──
  yPos = drawSectionTitle(doc, 'RÉFÉRENCE', yPos);
  const colLeft = PDF_MARGINS.left;
  const colRight = PDF_MARGINS.left + CONTENT_WIDTH / 2;
  const halfWidth = CONTENT_WIDTH / 2;

  drawLabelValue(doc, 'N° :', engagement.numero, colLeft, yPos, halfWidth);
  drawLabelValue(
    doc,
    'Exercice :',
    String(engagement.exercice || new Date().getFullYear()),
    colRight,
    yPos,
    halfWidth
  );
  yPos += PDF_DIMENSIONS.spacing.md;

  drawLabelValue(
    doc,
    'Date :',
    format(new Date(engagement.date_engagement), 'dd MMMM yyyy', { locale: fr }),
    colLeft,
    yPos,
    halfWidth
  );
  drawLabelValue(
    doc,
    'Type :',
    engagement.type_engagement === 'sur_marche' ? 'Sur marché' : 'Hors marché',
    colRight,
    yPos,
    halfWidth
  );
  yPos += PDF_DIMENSIONS.spacing.lg;

  // ── OBJET ──
  yPos = drawSectionTitle(doc, 'OBJET', yPos);
  doc.setFontSize(PDF_FONTS.size.body);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.text);
  const objetLines = doc.splitTextToSize(engagement.objet, CONTENT_WIDTH);
  doc.text(objetLines, colLeft, yPos);
  yPos += objetLines.length * 5 + PDF_DIMENSIONS.spacing.md;

  // ── PRESTATAIRE ──
  const prestataire = getPrestataire(engagement);
  if (prestataire) {
    yPos = drawSectionTitle(
      doc,
      engagement.type_engagement === 'sur_marche' ? 'PRESTATAIRE' : 'FOURNISSEUR',
      yPos
    );
    drawLabelValue(
      doc,
      'Raison sociale :',
      prestataire.raison_sociale,
      colLeft,
      yPos,
      CONTENT_WIDTH
    );
    yPos += PDF_DIMENSIONS.spacing.md;

    if (prestataire.rccm) {
      drawLabelValue(doc, 'RCCM :', prestataire.rccm, colLeft, yPos, halfWidth);
      yPos += PDF_DIMENSIONS.spacing.md;
    }
    if (prestataire.adresse) {
      drawLabelValue(doc, 'Adresse :', prestataire.adresse, colLeft, yPos, CONTENT_WIDTH);
      yPos += PDF_DIMENSIONS.spacing.md;
    }
    yPos += PDF_DIMENSIONS.spacing.sm;
  }

  // ── MONTANTS ──
  yPos = drawSectionTitle(doc, 'MONTANTS', yPos);

  // Tableau HT / TVA / TTC
  const tableX = colLeft;
  const tableW = CONTENT_WIDTH;
  const colLabelW = tableW * 0.6;
  const colValueW = tableW * 0.4;
  const rowH = 8;

  // Bordure du tableau
  doc.setDrawColor(...PDF_COLORS.tableBorder);
  doc.setLineWidth(PDF_DIMENSIONS.lineWidth.thin);

  // Ligne HT
  doc.rect(tableX, yPos, tableW, rowH);
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text('Montant Hors Taxes (HT)', tableX + 3, yPos + 5.5);
  doc.text(
    engagement.montant_ht ? formatCurrency(engagement.montant_ht) : 'N/A',
    tableX + colLabelW + colValueW - 3,
    yPos + 5.5,
    { align: 'right' }
  );
  yPos += rowH;

  // Ligne TVA
  doc.rect(tableX, yPos, tableW, rowH);
  doc.text(`TVA (${engagement.tva || 0}%)`, tableX + 3, yPos + 5.5);
  const tvaAmount =
    engagement.montant_ht && engagement.tva ? engagement.montant_ht * (engagement.tva / 100) : null;
  doc.text(
    tvaAmount != null ? formatCurrency(tvaAmount) : 'N/A',
    tableX + colLabelW + colValueW - 3,
    yPos + 5.5,
    { align: 'right' }
  );
  yPos += rowH;

  // Ligne TTC (fond gris)
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(tableX, yPos, tableW, rowH + 2, 'FD');
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setFontSize(PDF_FONTS.size.body);
  doc.text('MONTANT TOTAL TTC', tableX + 3, yPos + 6.5);
  doc.text(formatCurrency(engagement.montant), tableX + colLabelW + colValueW - 3, yPos + 6.5, {
    align: 'right',
  });
  yPos += rowH + 2 + PDF_DIMENSIONS.spacing.sm;

  // Montant en lettres
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.italic);
  doc.setTextColor(...PDF_COLORS.secondary);
  const lettresText = `Arrêté à la somme de : ${numberToWordsCFA(engagement.montant)}`;
  const lettresLines = doc.splitTextToSize(lettresText, CONTENT_WIDTH);
  doc.text(lettresLines, colLeft, yPos);
  yPos += lettresLines.length * 4 + PDF_DIMENSIONS.spacing.lg;

  // ── IMPUTATION BUDGÉTAIRE ──
  yPos = drawSectionTitle(doc, 'IMPUTATION BUDGÉTAIRE', yPos);
  if (engagement.budget_line) {
    drawLabelValue(
      doc,
      'Ligne :',
      `${engagement.budget_line.code} — ${engagement.budget_line.label}`,
      colLeft,
      yPos,
      CONTENT_WIDTH
    );
    yPos += PDF_DIMENSIONS.spacing.md;

    if (engagement.budget_line.direction) {
      drawLabelValue(
        doc,
        'Direction :',
        engagement.budget_line.direction.sigle
          ? `${engagement.budget_line.direction.sigle} — ${engagement.budget_line.direction.label}`
          : engagement.budget_line.direction.label,
        colLeft,
        yPos,
        CONTENT_WIDTH
      );
      yPos += PDF_DIMENSIONS.spacing.md;
    }
  }
  yPos += PDF_DIMENSIONS.spacing.sm;

  // ── RÉFÉRENCES ──
  if (engagement.marche?.numero || engagement.expression_besoin?.numero) {
    yPos = drawSectionTitle(doc, 'RÉFÉRENCES', yPos);
    if (engagement.marche?.numero) {
      drawLabelValue(doc, 'N° Marché :', engagement.marche.numero, colLeft, yPos, halfWidth);
      yPos += PDF_DIMENSIONS.spacing.md;
    }
    if (engagement.expression_besoin?.numero) {
      drawLabelValue(
        doc,
        'N° Expression de besoin :',
        engagement.expression_besoin.numero,
        colLeft,
        yPos,
        CONTENT_WIDTH
      );
      yPos += PDF_DIMENSIONS.spacing.md;
    }
    yPos += PDF_DIMENSIONS.spacing.sm;
  }

  // ── Check if we need a new page before signatures ──
  if (yPos > PDF_PAGE.height - 90) {
    doc.addPage();
    yPos = PDF_MARGINS.top;
    if (engagement.statut !== 'valide') {
      addWatermark({ doc, text: 'PROJET' });
    }
  }

  // ── 4 VISAS / SIGNATURES ──
  const signataires: SignataireInfo[] = [
    {
      titre: 'Le SAF',
      direction: 'Service Administratif\net Financier',
      date: engagement.visa_saf_date ? new Date(engagement.visa_saf_date) : undefined,
    },
    {
      titre: 'Le Contrôleur Budgétaire',
      direction: 'Contrôleur\nBudgétaire',
      date: engagement.visa_cb_date ? new Date(engagement.visa_cb_date) : undefined,
    },
    {
      titre: 'Le DAAF',
      direction: 'Directeur Administratif\net Financier',
      date: engagement.visa_daaf_date ? new Date(engagement.visa_daaf_date) : undefined,
    },
    {
      titre: 'Le Directeur Général',
      direction: 'Directeur\nGénéral',
      date: engagement.visa_dg_date ? new Date(engagement.visa_dg_date) : undefined,
    },
  ];

  yPos = generateSignatureTable({ doc, startY: yPos, signataires });

  // ── PIED DE PAGE ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    generatePDFFooter({
      doc,
      pageNumber: i,
      totalPages,
    });
  }

  // ── TÉLÉCHARGEMENT ──
  const filename = `Bon_Engagement_${engagement.numero.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}
