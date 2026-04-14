/**
 * Service de génération du PDF officiel "DÉCISION DE VIREMENT BUDGÉTAIRE"
 *
 * Format officiel ARTI utilisé pour matérialiser un virement / ajustement
 * budgétaire validé par le Directeur Général. Le document comporte :
 *
 *   1. En-tête ARTI officiel (logo + République + motto + nom institution)
 *   2. Numéro d'acte + date d'émission
 *   3. Titre "DÉCISION DE VIREMENT BUDGÉTAIRE N° <code>"
 *   4. Visas (LOLF, RGCP, ordonnance de création ARTI)
 *   5. Bloc "Le Directeur Général, DÉCIDE"
 *   6. Tableau 2 colonnes : Ligne source (-) / Ligne destination (+) avec
 *      dotation avant/après si exécuté
 *   7. Justification / motif
 *   8. 3 zones de signature : Demandeur, Contrôleur Budgétaire, Directeur Général
 *   9. Pied de page (numéro de page + mention SYGFP)
 *
 * Créé le 2026-04-08 pour la Phase 4 du refactor Virements (template PDF officiel).
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoArti from '@/assets/logo-arti.jpg';
import type { BudgetTransfer } from '@/hooks/useBudgetTransfers';

// ============================================================================
// TYPES
// ============================================================================

export interface VirementDecisionPdfOptions {
  transfer: BudgetTransfer;
}

export interface VirementDecisionPdfResult {
  blob: Blob;
  filename: string;
}

// ============================================================================
// CONFIGURATION PDF
// ============================================================================

const PDF_CONFIG = {
  margins: { top: 15, left: 18, right: 18, bottom: 15 },
  colors: {
    primary: [0, 51, 102] as [number, number, number],
    secondary: [100, 100, 100] as [number, number, number],
    text: [30, 30, 30] as [number, number, number],
    lightGray: [248, 248, 248] as [number, number, number],
    debit: [220, 38, 38] as [number, number, number], // red-600
    credit: [22, 163, 74] as [number, number, number], // green-600
    highlight: [230, 240, 250] as [number, number, number],
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

function formatDateFr(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return format(d, 'dd MMMM yyyy', { locale: fr });
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

export async function generateVirementDecisionPdf(
  options: VirementDecisionPdfOptions
): Promise<VirementDecisionPdfResult> {
  const { transfer } = options;
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
  if (transfer.exercice) {
    doc.text(`Exercice ${transfer.exercice}`, pageWidth - margins.right, yPos + 8, {
      align: 'right',
    });
  }

  yPos += 28;

  // Ligne séparatrice
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margins.left, yPos, pageWidth - margins.right, yPos);
  yPos += 8;

  // ── TITRE ──
  const titreActe = transfer.type_transfer === 'ajustement' ? "D'AJUSTEMENT" : 'DE VIREMENT';
  doc.setFontSize(fonts.title + 2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text(`DÉCISION ${titreActe} BUDGÉTAIRE`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.setFontSize(fonts.subtitle);
  doc.text(`N° ${transfer.code || '—'}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // ── VISAS ──
  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...colors.text);
  const visas = [
    'Vu la loi organique relative aux lois de finances (LOLF) ;',
    'Vu le Règlement Général de la Comptabilité Publique (RGCP) ;',
    `Vu l'ordonnance portant création de l'Autorité de Régulation du Transport Intérieur (ARTI) ;`,
    `Vu le budget de l'ARTI au titre de l'exercice ${transfer.exercice || new Date().getFullYear()} ;`,
    'Vu la demande de virement enregistrée dans le SYGFP et les pièces justificatives annexées ;',
  ];
  visas.forEach((visa) => {
    const lines = doc.splitTextToSize(visa, pageWidth - margins.left - margins.right);
    doc.text(lines, margins.left, yPos);
    yPos += 4.5 * lines.length;
  });
  yPos += 3;

  // ── DÉCIDE ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fonts.subtitle);
  doc.setTextColor(...colors.primary);
  doc.text('Le Directeur Général,', margins.left, yPos);
  yPos += 6;
  doc.text('DÉCIDE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 2;
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 12, yPos, pageWidth / 2 + 12, yPos);
  yPos += 6;

  // ── ARTICLE 1 : Objet ──
  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text);
  doc.text('Article 1 — Objet', margins.left, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  const actionVerb = transfer.type_transfer === 'ajustement' ? 'ajuster' : 'virer';
  const article1 = transfer.from_budget_line_id
    ? `Il est décidé de ${actionVerb} la somme de ${formatMontant(transfer.amount)} de la ligne budgétaire source vers la ligne budgétaire destination détaillées à l'article 2 ci-après.`
    : `Il est décidé de procéder à un ajustement d'un montant de ${formatMontant(transfer.amount)} sur la ligne budgétaire détaillée à l'article 2 ci-après.`;
  const article1Lines = doc.splitTextToSize(article1, pageWidth - margins.left - margins.right);
  doc.text(article1Lines, margins.left, yPos);
  yPos += 4.5 * article1Lines.length + 3;

  // ── ARTICLE 2 : Lignes budgétaires ──
  doc.setFont('helvetica', 'bold');
  doc.text('Article 2 — Lignes budgétaires concernées', margins.left, yPos);
  yPos += 5;

  // Tableau 2 colonnes (ou 1 si ajustement)
  const tableRows: Array<Array<string>> = [];
  if (transfer.from_line) {
    tableRows.push(['Code', transfer.from_line.code || '—', 'Code', transfer.to_line?.code || '—']);
    tableRows.push([
      'Libellé',
      transfer.from_line.label || '—',
      'Libellé',
      transfer.to_line?.label || '—',
    ]);
    if (transfer.from_dotation_avant != null) {
      tableRows.push([
        'Dot. avant',
        formatMontant(transfer.from_dotation_avant),
        'Dot. avant',
        formatMontant(transfer.to_dotation_avant),
      ]);
      tableRows.push([
        'Dot. après',
        formatMontant(transfer.from_dotation_apres),
        'Dot. après',
        formatMontant(transfer.to_dotation_apres),
      ]);
    }
    tableRows.push([
      'Variation',
      `- ${formatMontant(transfer.amount)}`,
      'Variation',
      `+ ${formatMontant(transfer.amount)}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          { content: 'LIGNE SOURCE (débitée)', colSpan: 2, styles: { halign: 'center' } },
          { content: 'LIGNE DESTINATION (créditée)', colSpan: 2, styles: { halign: 'center' } },
        ],
      ],
      body: tableRows,
      styles: { fontSize: fonts.small, cellPadding: 2 },
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26, fillColor: colors.lightGray },
        1: { cellWidth: 67 },
        2: { fontStyle: 'bold', cellWidth: 26, fillColor: colors.lightGray },
        3: { cellWidth: 67 },
      },
      theme: 'grid',
      margin: { left: margins.left, right: margins.right },
    });
  } else {
    // Ajustement sans ligne source
    tableRows.push(['Code', transfer.to_line?.code || '—']);
    tableRows.push(['Libellé', transfer.to_line?.label || '—']);
    if (transfer.to_dotation_avant != null) {
      tableRows.push(['Dotation avant', formatMontant(transfer.to_dotation_avant)]);
      tableRows.push(['Dotation après', formatMontant(transfer.to_dotation_apres)]);
    }
    tableRows.push(['Variation', `+ ${formatMontant(transfer.amount)}`]);

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          {
            content: 'LIGNE BUDGÉTAIRE AJUSTÉE',
            colSpan: 2,
            styles: { halign: 'center' },
          },
        ],
      ],
      body: tableRows,
      styles: { fontSize: fonts.small, cellPadding: 2 },
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40, fillColor: colors.lightGray },
        1: { cellWidth: 'auto' },
      },
      theme: 'grid',
      margin: { left: margins.left, right: margins.right },
    });
  }

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ── ARTICLE 3 : Motif / Justification ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fonts.body);
  doc.setTextColor(...colors.text);
  doc.text('Article 3 — Justification', margins.left, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  const motifText = transfer.motif || 'Aucun motif renseigné.';
  const motifLines = doc.splitTextToSize(motifText, pageWidth - margins.left - margins.right);
  doc.text(motifLines, margins.left, yPos);
  yPos += 4.5 * motifLines.length;

  if (transfer.justification_renforcee) {
    yPos += 2;
    doc.setFont('helvetica', 'italic');
    const renforcee = `Justification renforcée : ${transfer.justification_renforcee}`;
    const renforceeLines = doc.splitTextToSize(renforcee, pageWidth - margins.left - margins.right);
    doc.text(renforceeLines, margins.left, yPos);
    yPos += 4.5 * renforceeLines.length;
  }
  yPos += 4;

  // ── ARTICLE 4 : Exécution ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fonts.body);
  doc.text('Article 4 — Exécution', margins.left, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  const article4 =
    "Le Directeur de l'Administration Générale et de la Comptabilité (DAAF) et le Contrôleur Budgétaire sont chargés, chacun en ce qui le concerne, de l'exécution de la présente décision qui sera enregistrée et communiquée partout où besoin sera.";
  const article4Lines = doc.splitTextToSize(article4, pageWidth - margins.left - margins.right);
  doc.text(article4Lines, margins.left, yPos);
  yPos += 4.5 * article4Lines.length + 4;

  // ── SIGNATURES (3 colonnes : Demandeur / CB / DG) ──
  const signatureY = Math.max(yPos + 4, pageHeight - 58);
  const sigWidth = (pageWidth - margins.left - margins.right) / 3;

  doc.setFontSize(fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text);
  doc.text('Le Demandeur', margins.left + sigWidth / 2, signatureY, { align: 'center' });
  doc.text('Le Contrôleur Budgétaire', margins.left + sigWidth + sigWidth / 2, signatureY, {
    align: 'center',
  });
  doc.text('Le Directeur Général', margins.left + 2 * sigWidth + sigWidth / 2, signatureY, {
    align: 'center',
  });

  // Nom + date si disponibles
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.secondary);

  const sigLines: Array<{ nom: string | null; date: string | null }> = [
    {
      nom: transfer.requested_by_profile?.full_name || null,
      date: transfer.requested_at || null,
    },
    {
      nom: transfer.approved_by_profile?.full_name || null,
      date: transfer.approved_at,
    },
    {
      nom: transfer.executed_by_profile?.full_name || null,
      date: transfer.executed_at,
    },
  ];

  sigLines.forEach((sig, idx) => {
    const cx = margins.left + sigWidth * idx + sigWidth / 2;
    if (sig.nom) {
      doc.text(sig.nom, cx, signatureY + 5, { align: 'center' });
    }
    if (sig.date) {
      doc.text(`le ${formatDateFr(sig.date)}`, cx, signatureY + 9, { align: 'center' });
    } else {
      doc.text('le ___/___/______', cx, signatureY + 9, { align: 'center' });
    }
  });

  // Lignes de signature
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(0.3);
  for (let i = 0; i < 3; i++) {
    const cx = margins.left + sigWidth * i + sigWidth / 2;
    doc.line(cx - 25, signatureY + 25, cx + 25, signatureY + 25);
  }

  // "Signature et cachet"
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.secondary);
  for (let i = 0; i < 3; i++) {
    const cx = margins.left + sigWidth * i + sigWidth / 2;
    doc.text('Signature et cachet', cx, signatureY + 30, { align: 'center' });
  }

  // ── PIED DE PAGE ──
  doc.setFontSize(fonts.small - 1);
  doc.setTextColor(...colors.secondary);
  doc.text(
    'Document généré par SYGFP — Système de Gestion des Finances Publiques ARTI',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );
  doc.text(
    `Code de référence : ${transfer.code || '—'}`,
    pageWidth - margins.right,
    pageHeight - 8,
    { align: 'right' }
  );

  // Métadonnées
  doc.setProperties({
    title: `Décision de ${transfer.type_transfer === 'ajustement' ? "d'ajustement" : 'virement'} budgétaire - ${transfer.code || ''}`,
    subject: `Exercice ${transfer.exercice || ''} — ${formatMontant(transfer.amount)}`,
    author: 'ARTI - SYGFP',
    creator: 'SYGFP - Système de Gestion des Finances Publiques',
    keywords: 'virement, ajustement, budget, décision, ARTI',
  });

  const blob = doc.output('blob');
  const refClean = (transfer.code || 'sans_code').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ARTI_DECISION_${transfer.type_transfer === 'ajustement' ? 'AJUSTEMENT' : 'VIREMENT'}_${refClean}_${format(
    new Date(),
    'yyyyMMdd_HHmmss'
  )}.pdf`;

  return { blob, filename };
}

// ============================================================================
// TÉLÉCHARGEMENT DIRECT
// ============================================================================

export async function downloadVirementDecisionPdf(
  options: VirementDecisionPdfOptions
): Promise<void> {
  const { blob, filename } = await generateVirementDecisionPdf(options);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
