/**
 * Service de génération PDF pour la liste des articles d'une Expression de Besoin
 *
 * Structure :
 * - En-tête ARTI (logo + texte officiel)
 * - Titre : "LISTE DES ARTICLES — Expression de besoin N° XXXX"
 * - Informations : Objet, Direction, Demandeur, Date, Exercice
 * - Tableau articles (autoTable)
 * - Récap : Total HT, TVA 18% indicatif, Total TTC indicatif
 * - Pied de page ARTI
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ExpressionBesoin, ExpressionBesoinLigne } from '@/hooks/useExpressionsBesoin';
import { generatePDFHeader, loadImageAsDataUrl } from '@/lib/pdf/pdfHeader';
import { generatePDFFooter } from '@/lib/pdf/pdfFooter';
import { PDF_COLORS, PDF_FONTS, PDF_MARGINS, PDF_PAGE, CONTENT_WIDTH } from '@/lib/pdf/pdfStyles';
import { getUniteLabel } from '@/components/expression-besoin/articleConstants';
import logoArti from '@/assets/logo-arti.jpg';

// ============================================================================
// UTILITAIRES
// ============================================================================

function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant);
}

function formatDateFr(date: string | Date | null): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
  } catch {
    return '-';
  }
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

export async function generateArticlesPdf(expression: ExpressionBesoin): Promise<void> {
  const articles: ExpressionBesoinLigne[] =
    expression.liste_articles && Array.isArray(expression.liste_articles)
      ? expression.liste_articles
      : [];

  if (articles.length === 0) {
    throw new Error('Aucun article à exporter');
  }

  // Charger le logo
  let logoDataUrl = '';
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArti);
  } catch (e) {
    console.warn('[ArticlesPDF] Logo introuvable:', e);
  }

  // Créer le document PDF
  const doc = new jsPDF({
    orientation: PDF_PAGE.orientation,
    unit: PDF_PAGE.unit,
    format: PDF_PAGE.format,
  });

  // ─── EN-TÊTE ARTI ────────────────────────────────────────────────────────
  const { endY: headerEndY } = generatePDFHeader({
    doc,
    logoDataUrl,
    direction: expression.direction?.label,
    directionSigle: expression.direction?.sigle,
  });

  let yPos = headerEndY;

  // ─── TITRE ────────────────────────────────────────────────────────────────
  const centerX = PDF_PAGE.width / 2;
  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('LISTE DES ARTICLES', centerX, yPos, { align: 'center' });
  yPos += 6;

  doc.setFontSize(PDF_FONTS.size.body);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(`Expression de besoin N° ${expression.numero || 'Brouillon'}`, centerX, yPos, {
    align: 'center',
  });
  yPos += 10;

  // ─── INFORMATIONS ────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Objet', expression.objet || '-'],
      ['Direction', expression.direction?.sigle || expression.direction?.label || '-'],
      ['Demandeur', expression.creator?.full_name || '-'],
      ['Date de création', formatDateFr(expression.created_at)],
      ['Exercice', String(expression.exercice || '-')],
    ],
    styles: {
      fontSize: PDF_FONTS.size.body,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        cellWidth: 35,
        fillColor: PDF_COLORS.lightGray,
      },
      1: { cellWidth: CONTENT_WIDTH - 35 },
    },
    theme: 'grid',
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ─── TABLEAU DES ARTICLES ────────────────────────────────────────────────
  const totalHT = articles.reduce((sum, a) => sum + (a.prix_total || 0), 0);
  const tva = Math.round(totalHT * 0.18);
  const totalTTC = totalHT + tva;

  const tableBody = articles.map((item, idx) => [
    String(idx + 1),
    item.designation || ((item as unknown as Record<string, unknown>).article as string) || '-',
    String(item.quantite),
    getUniteLabel(item.unite),
    item.prix_unitaire > 0 ? formatMontant(item.prix_unitaire) : '-',
    item.prix_total > 0 ? formatMontant(item.prix_total) : '-',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['N°', 'Désignation', 'Qté', 'Unité', 'PU (FCFA)', 'Total (FCFA)']],
    body: tableBody,
    foot: [
      [
        {
          content: 'Total HT',
          colSpan: 5,
          styles: { halign: 'right' as const, fontStyle: 'bold' as const },
        },
        {
          content: formatMontant(totalHT) + ' FCFA',
          styles: { fontStyle: 'bold' as const, halign: 'right' as const },
        },
      ],
      [
        {
          content: 'TVA 18% (indicatif)',
          colSpan: 5,
          styles: { halign: 'right' as const, textColor: PDF_COLORS.secondary },
        },
        {
          content: formatMontant(tva) + ' FCFA',
          styles: { halign: 'right' as const, textColor: PDF_COLORS.secondary },
        },
      ],
      [
        {
          content: 'Total TTC (indicatif)',
          colSpan: 5,
          styles: { halign: 'right' as const, fontStyle: 'bold' as const },
        },
        {
          content: formatMontant(totalTTC) + ' FCFA',
          styles: { fontStyle: 'bold' as const, halign: 'right' as const },
        },
      ],
    ],
    styles: {
      fontSize: PDF_FONTS.size.body,
      cellPadding: 3,
      lineWidth: 0.3,
      lineColor: PDF_COLORS.tableBorder,
      textColor: PDF_COLORS.text,
    },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: PDF_COLORS.lightGray,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25 },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    theme: 'grid',
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
  });

  // ─── PIED DE PAGE ────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    generatePDFFooter({
      doc,
      pageNumber: i,
      totalPages,
    });
  }

  // ─── MÉTADONNÉES ─────────────────────────────────────────────────────────
  const ref = expression.numero || 'BROUILLON';
  doc.setProperties({
    title: `ARTI_ARTICLES_EB_${ref}`,
    subject: expression.objet || '',
    author: 'ARTI - SYGFP',
    creator: 'SYGFP - Système de Gestion des Finances Publiques',
  });

  // ─── OUVRIR LE PDF ───────────────────────────────────────────────────────
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Libérer après un court délai
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
