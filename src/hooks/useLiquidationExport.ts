/**
 * Hook d'export pour les Liquidations
 * - Excel multi-feuilles (3 sheets: Liste, Détail fiscal, Suivi par engagement)
 * - PDF attestation de liquidation individuelle
 * - CSV export plat
 * Pattern: identique à useEngagementExport.ts
 */

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { generatePDFHeader, loadImageAsDataUrl, addHeaderTitle } from '@/lib/pdf/pdfHeader';
import { generatePDFFooter, generateSignatureTable } from '@/lib/pdf/pdfFooter';
import { PDF_COLORS, PDF_FONTS, PDF_MARGINS, PDF_PAGE, TABLE_STYLES } from '@/lib/pdf/pdfStyles';
import logoArtiUrl from '@/assets/logo-arti.jpg';
import type { Liquidation } from '@/hooks/useLiquidations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiquidationExportFilters {
  statut?: string;
  direction?: string;
}

interface SuiviEngagementLigne {
  engagementId: string;
  engagementNumero: string;
  objet: string;
  fournisseur: string;
  montantEngage: number;
  totalLiquide: number;
  restant: number;
  taux: number;
  nbLiquidations: number;
  derniereLiquidation: string | null;
  ligneCode: string;
  directionSigle: string;
}

// ---------------------------------------------------------------------------
// Helpers (exported for tests)
// ---------------------------------------------------------------------------

export function fmtCurrency(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '-';
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
}

export function liquidationStatutLabel(statut: string | null | undefined): string {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    certifié_sf: 'SF Certifié',
    soumis: 'Soumis',
    validé_daaf: 'Validé DAAF',
    validé_dg: 'Validé DG',
    rejete: 'Rejeté',
    differe: 'Différé',
    annule: 'Annulé',
  };
  return labels[statut || ''] || statut || '-';
}

export function regimeFiscalLabel(regime: string | null | undefined): string {
  if (!regime) return '-';
  const labels: Record<string, string> = {
    reel_normal: 'Réel normal',
    reel_simplifie: 'Réel simplifié',
    synthetique: 'Synthétique',
    micro: 'Micro-entreprise',
    exonere: 'Exonéré',
  };
  return labels[regime] || regime;
}

/**
 * Compute suivi par engagement grouped from a list of liquidations.
 * Only considers non-rejected, non-cancelled liquidations.
 */
export function computeSuiviParEngagement(liquidations: Liquidation[]): SuiviEngagementLigne[] {
  const map = new Map<
    string,
    {
      engagementNumero: string;
      objet: string;
      fournisseur: string;
      montantEngage: number;
      totalLiquide: number;
      nbLiquidations: number;
      derniereLiquidation: string | null;
      ligneCode: string;
      directionSigle: string;
    }
  >();

  for (const liq of liquidations) {
    if (liq.statut === 'rejete' || liq.statut === 'annule') continue;

    const engId = liq.engagement_id;
    const existing = map.get(engId);

    if (existing) {
      existing.totalLiquide += liq.montant || 0;
      existing.nbLiquidations += 1;
      if (
        liq.created_at &&
        (!existing.derniereLiquidation || liq.created_at > existing.derniereLiquidation)
      ) {
        existing.derniereLiquidation = liq.created_at;
      }
    } else {
      map.set(engId, {
        engagementNumero: liq.engagement?.numero || '-',
        objet: liq.engagement?.objet || '-',
        fournisseur:
          liq.engagement?.marche?.prestataire?.raison_sociale || liq.engagement?.fournisseur || '-',
        montantEngage: liq.engagement?.montant || 0,
        totalLiquide: liq.montant || 0,
        nbLiquidations: 1,
        derniereLiquidation: liq.created_at || null,
        ligneCode: liq.engagement?.budget_line?.code || '-',
        directionSigle: liq.engagement?.budget_line?.direction?.sigle || '-',
      });
    }
  }

  const result: SuiviEngagementLigne[] = [];
  for (const [engagementId, data] of map) {
    const restant = data.montantEngage - data.totalLiquide;
    const taux = data.montantEngage > 0 ? (data.totalLiquide / data.montantEngage) * 100 : 0;
    result.push({
      engagementId,
      engagementNumero: data.engagementNumero,
      objet: data.objet,
      fournisseur: data.fournisseur,
      montantEngage: data.montantEngage,
      totalLiquide: data.totalLiquide,
      restant,
      taux,
      nbLiquidations: data.nbLiquidations,
      derniereLiquidation: data.derniereLiquidation,
      ligneCode: data.ligneCode,
      directionSigle: data.directionSigle,
    });
  }

  // Tri par taux de consommation décroissant
  result.sort((a, b) => b.taux - a.taux);
  return result;
}

// ---------------------------------------------------------------------------
// A) Excel — 3 feuilles
// ---------------------------------------------------------------------------

function doExportExcel(
  liquidations: Liquidation[],
  exercice?: number,
  filters?: LiquidationExportFilters
): void {
  let data = [...liquidations];

  if (filters?.statut) {
    data = data.filter((l) => l.statut === filters.statut);
  }
  if (filters?.direction) {
    data = data.filter((l) => l.engagement?.budget_line?.direction?.sigle === filters.direction);
  }

  if (data.length === 0) {
    toast.warning('Aucune donnée à exporter');
    return;
  }

  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // --- Feuille 1 : Liste des liquidations ---
  const headerRows = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Liquidations Budgétaires'],
    [`Exercice: ${exercice || ''}`],
    [`Généré le: ${dateStr} à ${timeStr}`],
    [],
  ];

  const colHeaders1 = [
    'Référence',
    'Engagement',
    'Objet',
    'Fournisseur',
    'Montant TTC',
    'Montant HT',
    'Net à payer',
    'Ligne budgétaire',
    'Direction',
    'Statut',
    'Date SF',
    'Réf facture',
    'Urgente',
    'Visa DAAF',
    'Visa DG',
    'Motif rejet',
    'Créé par',
  ];

  const rows1 = data.map((l) => [
    l.numero || '-',
    l.engagement?.numero || '-',
    l.engagement?.objet || '-',
    l.engagement?.marche?.prestataire?.raison_sociale || l.engagement?.fournisseur || '-',
    l.montant || 0,
    l.montant_ht || '',
    l.net_a_payer || '',
    l.engagement?.budget_line?.code || '-',
    l.engagement?.budget_line?.direction?.sigle || '-',
    liquidationStatutLabel(l.statut),
    fmtDate(l.service_fait_date),
    l.reference_facture || '',
    l.reglement_urgent ? 'OUI' : '',
    fmtDate(l.visa_daaf_date),
    fmtDate(l.visa_dg_date),
    l.rejection_reason || '',
    l.creator?.full_name || '-',
  ]);

  // Ligne total
  const totalMontant = data.reduce((sum, l) => sum + (l.montant || 0), 0);
  const totalNet = data.reduce((sum, l) => sum + (l.net_a_payer || l.montant || 0), 0);
  rows1.push([
    'TOTAL',
    `${data.length} liquidation(s)`,
    '',
    '',
    totalMontant,
    '',
    totalNet,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.sheet_add_aoa(ws1, [colHeaders1], { origin: `A${headerRows.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws1, rows1, { origin: `A${headerRows.length + 2}` });
  ws1['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 40 },
    { wch: 30 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Liquidations');

  // --- Feuille 2 : Détail fiscal ---
  const headerRows2 = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Détail Fiscal des Liquidations'],
    [`Exercice: ${exercice || ''}`],
    [`Généré le: ${dateStr} à ${timeStr}`],
    [],
  ];

  const colHeaders2 = [
    'Référence',
    'Engagement',
    'Montant HT',
    'TVA applicable',
    'TVA Taux (%)',
    'TVA Montant',
    'Montant TTC',
    'AIRSI Taux (%)',
    'AIRSI Montant',
    'BIC Taux (%)',
    'BIC Montant',
    'BNC Taux (%)',
    'BNC Montant',
    'Pénalités',
    'Total retenues',
    'Net à payer',
    'Régime fiscal',
  ];

  const rows2 = data.map((l) => [
    l.numero || '-',
    l.engagement?.numero || '-',
    l.montant_ht || 0,
    l.tva_applicable ? 'Oui' : 'Non',
    l.tva_taux || 0,
    l.tva_montant || 0,
    l.montant || 0,
    l.airsi_taux || 0,
    l.airsi_montant || 0,
    l.retenue_bic_taux || 0,
    l.retenue_bic_montant || 0,
    l.retenue_bnc_taux || 0,
    l.retenue_bnc_montant || 0,
    l.penalites_montant || 0,
    l.total_retenues || 0,
    l.net_a_payer || 0,
    regimeFiscalLabel(l.regime_fiscal),
  ]);

  // Totaux
  const totalHT = data.reduce((s, l) => s + (l.montant_ht || 0), 0);
  const totalTVA = data.reduce((s, l) => s + (l.tva_montant || 0), 0);
  const totalAIRSI = data.reduce((s, l) => s + (l.airsi_montant || 0), 0);
  const totalBIC = data.reduce((s, l) => s + (l.retenue_bic_montant || 0), 0);
  const totalBNC = data.reduce((s, l) => s + (l.retenue_bnc_montant || 0), 0);
  const totalPenalites = data.reduce((s, l) => s + (l.penalites_montant || 0), 0);
  const totalRetenues = data.reduce((s, l) => s + (l.total_retenues || 0), 0);
  const totalNetPayer = data.reduce((s, l) => s + (l.net_a_payer || 0), 0);

  rows2.push([
    'TOTAL',
    `${data.length}`,
    totalHT,
    '',
    '',
    totalTVA,
    totalMontant,
    '',
    totalAIRSI,
    '',
    totalBIC,
    '',
    totalBNC,
    totalPenalites,
    totalRetenues,
    totalNetPayer,
    '',
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(headerRows2);
  XLSX.utils.sheet_add_aoa(ws2, [colHeaders2], { origin: `A${headerRows2.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws2, rows2, { origin: `A${headerRows2.length + 2}` });
  ws2['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Detail Fiscal');

  // --- Feuille 3 : Suivi par engagement ---
  const headerRows3 = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Suivi des Liquidations par Engagement'],
    [`Exercice: ${exercice || ''}`],
    [`Généré le: ${dateStr} à ${timeStr}`],
    [],
  ];

  const suivi = computeSuiviParEngagement(data);

  const colHeaders3 = [
    'Réf. Engagement',
    'Objet',
    'Fournisseur',
    'Ligne budg.',
    'Direction',
    'Montant engagé',
    'Total liquidé',
    'Restant',
    'Taux (%)',
    'Alerte',
    'Nb liquidations',
    'Dernière liquidation',
  ];

  const rows3 = suivi.map((s) => [
    s.engagementNumero,
    s.objet.substring(0, 50),
    s.fournisseur,
    s.ligneCode,
    s.directionSigle,
    s.montantEngage,
    s.totalLiquide,
    s.restant,
    Number(s.taux.toFixed(1)),
    s.taux >= 100 ? 'COMPLET' : s.taux > 80 ? 'ATTENTION' : 'OK',
    s.nbLiquidations,
    fmtDate(s.derniereLiquidation),
  ]);

  // Totaux
  const suiviTotalEngage = suivi.reduce((s, e) => s + e.montantEngage, 0);
  const suiviTotalLiquide = suivi.reduce((s, e) => s + e.totalLiquide, 0);
  const suiviTotalRestant = suivi.reduce((s, e) => s + e.restant, 0);
  const suiviTauxGlobal = suiviTotalEngage > 0 ? (suiviTotalLiquide / suiviTotalEngage) * 100 : 0;
  const suiviTotalNb = suivi.reduce((s, e) => s + e.nbLiquidations, 0);

  rows3.push([
    'TOTAL',
    `${suivi.length} engagement(s)`,
    '',
    '',
    '',
    suiviTotalEngage,
    suiviTotalLiquide,
    suiviTotalRestant,
    Number(suiviTauxGlobal.toFixed(1)),
    '',
    suiviTotalNb,
    '',
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet(headerRows3);
  XLSX.utils.sheet_add_aoa(ws3, [colHeaders3], { origin: `A${headerRows3.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws3, rows3, { origin: `A${headerRows3.length + 2}` });
  ws3['!cols'] = [
    { wch: 20 },
    { wch: 40 },
    { wch: 30 },
    { wch: 20 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Suivi par Engagement');

  // Download
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Liquidations_${exercice || ''}_${now.toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// B) CSV
// ---------------------------------------------------------------------------

function doExportCSV(
  liquidations: Liquidation[],
  exercice?: number,
  filters?: LiquidationExportFilters
): void {
  let data = [...liquidations];

  if (filters?.statut) {
    data = data.filter((l) => l.statut === filters.statut);
  }
  if (filters?.direction) {
    data = data.filter((l) => l.engagement?.budget_line?.direction?.sigle === filters.direction);
  }

  if (data.length === 0) {
    toast.warning('Aucune donnée à exporter');
    return;
  }

  const headers = [
    'Reference',
    'Engagement',
    'Objet',
    'Fournisseur',
    'Montant TTC',
    'Montant HT',
    'Net a payer',
    'TVA',
    'AIRSI',
    'BIC',
    'BNC',
    'Penalites',
    'Total retenues',
    'Ligne budgetaire',
    'Direction',
    'Statut',
    'Date SF',
    'Urgente',
  ];

  const csvRows = data.map((l) =>
    [
      l.numero || '',
      l.engagement?.numero || '',
      `"${(l.engagement?.objet || '').replace(/"/g, '""')}"`,
      `"${(l.engagement?.marche?.prestataire?.raison_sociale || l.engagement?.fournisseur || '').replace(/"/g, '""')}"`,
      l.montant || 0,
      l.montant_ht || '',
      l.net_a_payer || '',
      l.tva_montant || '',
      l.airsi_montant || '',
      l.retenue_bic_montant || '',
      l.retenue_bnc_montant || '',
      l.penalites_montant || '',
      l.total_retenues || '',
      l.engagement?.budget_line?.code || '',
      l.engagement?.budget_line?.direction?.sigle || '',
      liquidationStatutLabel(l.statut),
      fmtDate(l.service_fait_date),
      l.reglement_urgent ? 'OUI' : '',
    ].join(';')
  );

  const csvContent = [headers.join(';'), ...csvRows].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Liquidations_${exercice || ''}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// C) PDF — attestation de liquidation individuelle
// ---------------------------------------------------------------------------

async function doExportAttestationPDF(liquidation: Liquidation): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let logoDataUrl: string | undefined;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArtiUrl);
  } catch {
    // continue without logo
  }

  // En-tête ARTI
  const { endY } = generatePDFHeader({ doc, logoDataUrl });

  // Titre du document
  let yPos = addHeaderTitle(doc, 'ATTESTATION DE LIQUIDATION', endY);

  // Sous-titre
  doc.setFontSize(PDF_FONTS.size.subtitle);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(`N° ${liquidation.numero}`, PDF_PAGE.width / 2, yPos, { align: 'center' });
  yPos += 10;

  // Date
  doc.setFontSize(PDF_FONTS.size.small);
  doc.text(`Établie le ${new Date().toLocaleDateString('fr-FR')}`, PDF_PAGE.width / 2, yPos, {
    align: 'center',
  });
  yPos += 12;

  // --- Section 1 : Informations générales ---
  autoTable(doc, {
    startY: yPos,
    head: [['INFORMATIONS GÉNÉRALES', '']],
    body: [
      ['Numéro de liquidation', liquidation.numero],
      ['Engagement de référence', liquidation.engagement?.numero || '-'],
      ['Objet', liquidation.engagement?.objet || '-'],
      [
        'Fournisseur / Prestataire',
        liquidation.engagement?.marche?.prestataire?.raison_sociale ||
          liquidation.engagement?.fournisseur ||
          '-',
      ],
      [
        'Ligne budgétaire',
        `${liquidation.engagement?.budget_line?.code || '-'} — ${liquidation.engagement?.budget_line?.label || ''}`,
      ],
      ['Direction', liquidation.engagement?.budget_line?.direction?.sigle || '-'],
      ['Date du service fait', fmtDate(liquidation.service_fait_date)],
      ['Référence facture', liquidation.reference_facture || '-'],
      ['Régime fiscal', regimeFiscalLabel(liquidation.regime_fiscal)],
    ],
    styles: {
      fontSize: TABLE_STYLES.default.fontSize - 1,
      cellPadding: TABLE_STYLES.default.cellPadding,
      lineWidth: TABLE_STYLES.default.lineWidth,
      lineColor: TABLE_STYLES.default.lineColor,
      textColor: TABLE_STYLES.default.textColor,
    },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      halign: 'left',
      colSpan: 2,
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 110 },
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
  });

  // @ts-expect-error jspdf-autotable lastAutoTable
  yPos = doc.lastAutoTable.finalY + 8;

  // --- Section 2 : Détail fiscal ---
  autoTable(doc, {
    startY: yPos,
    head: [['DÉTAIL FISCAL', 'Taux', 'Montant']],
    body: [
      ['Montant HT', '', fmtCurrency(liquidation.montant_ht)],
      ['TVA', `${liquidation.tva_taux || 0}%`, fmtCurrency(liquidation.tva_montant)],
      ['Montant TTC', '', fmtCurrency(liquidation.montant)],
      ['AIRSI', `${liquidation.airsi_taux || 0}%`, fmtCurrency(liquidation.airsi_montant)],
      [
        'Retenue BIC',
        `${liquidation.retenue_bic_taux || 0}%`,
        fmtCurrency(liquidation.retenue_bic_montant),
      ],
      [
        'Retenue BNC',
        `${liquidation.retenue_bnc_taux || 0}%`,
        fmtCurrency(liquidation.retenue_bnc_montant),
      ],
      ['Pénalités de retard', '', fmtCurrency(liquidation.penalites_montant)],
      ['Total retenues', '', fmtCurrency(liquidation.total_retenues)],
      ['NET À PAYER', '', fmtCurrency(liquidation.net_a_payer)],
    ],
    styles: {
      fontSize: TABLE_STYLES.default.fontSize - 1,
      cellPadding: TABLE_STYLES.default.cellPadding,
      lineWidth: TABLE_STYLES.default.lineWidth,
      lineColor: TABLE_STYLES.default.lineColor,
      textColor: TABLE_STYLES.default.textColor,
    },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 60, halign: 'right' },
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    didParseCell: (hookData) => {
      // Ligne NET À PAYER en gras + fond
      if (hookData.section === 'body' && hookData.row.index === 8) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = PDF_COLORS.headerBg;
      }
    },
  });

  // @ts-expect-error jspdf-autotable lastAutoTable
  yPos = doc.lastAutoTable.finalY + 8;

  // --- Section 3 : Circuit de validation ---
  const validationRows: string[][] = [];
  if (liquidation.visa_daaf_date) {
    validationRows.push([
      'Visa DAAF',
      liquidation.visa_daaf_user?.full_name || '-',
      fmtDate(liquidation.visa_daaf_date),
      liquidation.visa_daaf_commentaire || '-',
    ]);
  }
  if (liquidation.visa_dg_date) {
    validationRows.push([
      'Visa DG',
      liquidation.visa_dg_user?.full_name || '-',
      fmtDate(liquidation.visa_dg_date),
      liquidation.visa_dg_commentaire || '-',
    ]);
  }

  if (validationRows.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Étape', 'Validateur', 'Date', 'Commentaire']],
      body: validationRows,
      styles: {
        fontSize: TABLE_STYLES.default.fontSize - 1,
        cellPadding: TABLE_STYLES.default.cellPadding,
        lineWidth: TABLE_STYLES.default.lineWidth,
        lineColor: TABLE_STYLES.default.lineColor,
        textColor: TABLE_STYLES.default.textColor,
      },
      headStyles: {
        fillColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.white,
        fontStyle: 'bold',
      },
      margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    });

    // @ts-expect-error jspdf-autotable lastAutoTable
    yPos = doc.lastAutoTable.finalY + 8;
  }

  // --- Section 4 : Mention légale ---
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.italic);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(
    'La présente attestation certifie que le service a été fait et que la liquidation a été effectuée conformément aux règles de la comptabilité publique.',
    PDF_MARGINS.left,
    yPos,
    { maxWidth: PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right }
  );
  yPos += 16;

  // --- Signatures ---
  yPos = generateSignatureTable({
    doc,
    startY: yPos,
    signataires: [
      {
        titre: 'Le DAAF',
        direction: 'Direction Administrative et Financière',
        nom: liquidation.visa_daaf_user?.full_name || undefined,
        date: liquidation.visa_daaf_date ? new Date(liquidation.visa_daaf_date) : undefined,
      },
      {
        titre: 'Le Directeur Général',
        direction: 'Direction Générale',
        nom: liquidation.visa_dg_user?.full_name || undefined,
        date: liquidation.visa_dg_date ? new Date(liquidation.visa_dg_date) : undefined,
      },
    ],
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    generatePDFFooter({ doc, pageNumber: p, totalPages });
  }

  // Download
  doc.save(
    `SYGFP_Attestation_Liquidation_${liquidation.numero}_${new Date().toISOString().split('T')[0]}.pdf`
  );
}

// ---------------------------------------------------------------------------
// D) PDF — rapport synthèse (liste + suivi)
// ---------------------------------------------------------------------------

async function doExportPDF(
  liquidations: Liquidation[],
  exercice?: number,
  filters?: LiquidationExportFilters
): Promise<void> {
  let data = [...liquidations];

  if (filters?.statut) {
    data = data.filter((l) => l.statut === filters.statut);
  }
  if (filters?.direction) {
    data = data.filter((l) => l.engagement?.budget_line?.direction?.sigle === filters.direction);
  }

  if (data.length === 0) {
    toast.warning('Aucune donnée à exporter');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = 297;
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  let logoDataUrl: string | undefined;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArtiUrl);
  } catch {
    // continue without logo
  }

  // ========================================================================
  // PAGE 1 — Liste des liquidations
  // ========================================================================

  const { endY } = generatePDFHeader({ doc, logoDataUrl });

  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(`Liquidations Budgétaires — Exercice ${exercice || ''}`, pageWidth / 2, endY, {
    align: 'center',
  });

  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(`Généré le ${dateStr} à ${timeStr}`, pageWidth / 2, endY + 6, { align: 'center' });

  const totalMontant = data.reduce((sum, l) => sum + (l.montant || 0), 0);
  const totalNet = data.reduce((sum, l) => sum + (l.net_a_payer || l.montant || 0), 0);

  const tableBody = data.map((l) => [
    l.numero || '-',
    l.engagement?.numero || '-',
    (
      l.engagement?.marche?.prestataire?.raison_sociale ||
      l.engagement?.fournisseur ||
      '-'
    ).substring(0, 30),
    fmtCurrency(l.montant),
    fmtCurrency(l.net_a_payer),
    l.engagement?.budget_line?.direction?.sigle || '-',
    liquidationStatutLabel(l.statut),
  ]);

  tableBody.push([
    'TOTAL',
    `${data.length} liquidation(s)`,
    '',
    fmtCurrency(totalMontant),
    fmtCurrency(totalNet),
    '',
    '',
  ]);

  autoTable(doc, {
    startY: endY + 12,
    head: [
      [
        'Référence',
        'Engagement',
        'Fournisseur',
        'Montant TTC',
        'Net à payer',
        'Direction',
        'Statut',
      ],
    ],
    body: tableBody,
    styles: {
      fontSize: TABLE_STYLES.default.fontSize - 2,
      cellPadding: TABLE_STYLES.default.cellPadding,
      lineWidth: TABLE_STYLES.default.lineWidth,
      lineColor: TABLE_STYLES.default.lineColor,
      textColor: TABLE_STYLES.default.textColor,
    },
    headStyles: {
      fillColor: TABLE_STYLES.head.fillColor,
      textColor: TABLE_STYLES.head.textColor,
      fontStyle: TABLE_STYLES.head.fontStyle,
      halign: TABLE_STYLES.head.halign,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 35 },
      2: { cellWidth: 55 },
      3: { cellWidth: 40, halign: 'right' },
      4: { cellWidth: 40, halign: 'right' },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.row.index === tableBody.length - 1) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = PDF_COLORS.headerBg;
      }
    },
  });

  // ========================================================================
  // PAGE 2 — Suivi par engagement
  // ========================================================================

  doc.addPage('a4', 'landscape');
  const { endY: endY2 } = generatePDFHeader({ doc, logoDataUrl });

  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('Suivi des Liquidations par Engagement', pageWidth / 2, endY2, { align: 'center' });

  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(`Généré le ${dateStr} à ${timeStr}`, pageWidth / 2, endY2 + 6, { align: 'center' });

  const suivi = computeSuiviParEngagement(data);

  const suiviBody = suivi.map((s) => [
    s.engagementNumero,
    s.objet.substring(0, 35),
    s.fournisseur.substring(0, 25),
    fmtCurrency(s.montantEngage),
    fmtCurrency(s.totalLiquide),
    fmtCurrency(s.restant),
    s.taux.toFixed(1) + '%',
    s.taux >= 100 ? 'COMPLET' : s.taux > 80 ? 'ATTENTION' : 'OK',
    String(s.nbLiquidations),
  ]);

  const suiviTotalEngage = suivi.reduce((s, e) => s + e.montantEngage, 0);
  const suiviTotalLiquide = suivi.reduce((s, e) => s + e.totalLiquide, 0);
  const suiviTotalRestant = suivi.reduce((s, e) => s + e.restant, 0);
  const suiviTauxGlobal = suiviTotalEngage > 0 ? (suiviTotalLiquide / suiviTotalEngage) * 100 : 0;
  const suiviTotalNb = suivi.reduce((s, e) => s + e.nbLiquidations, 0);

  suiviBody.push([
    'TOTAL',
    `${suivi.length} engagement(s)`,
    '',
    fmtCurrency(suiviTotalEngage),
    fmtCurrency(suiviTotalLiquide),
    fmtCurrency(suiviTotalRestant),
    suiviTauxGlobal.toFixed(1) + '%',
    '',
    String(suiviTotalNb),
  ]);

  autoTable(doc, {
    startY: endY2 + 12,
    head: [
      [
        'Engagement',
        'Objet',
        'Fournisseur',
        'Engagé',
        'Liquidé',
        'Restant',
        'Taux',
        'Alerte',
        'Nb liq.',
      ],
    ],
    body: suiviBody,
    styles: {
      fontSize: TABLE_STYLES.default.fontSize - 2,
      cellPadding: TABLE_STYLES.default.cellPadding,
      lineWidth: TABLE_STYLES.default.lineWidth,
      lineColor: TABLE_STYLES.default.lineColor,
      textColor: TABLE_STYLES.default.textColor,
    },
    headStyles: {
      fillColor: TABLE_STYLES.head.fillColor,
      textColor: TABLE_STYLES.head.textColor,
      fontStyle: TABLE_STYLES.head.fontStyle,
      halign: TABLE_STYLES.head.halign,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 55 },
      2: { cellWidth: 40 },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.row.index === suiviBody.length - 1) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = PDF_COLORS.headerBg;
      }
      // Coloration conditionnelle
      if (hookData.section === 'body' && hookData.row.index < suiviBody.length - 1) {
        const taux = suivi[hookData.row.index]?.taux ?? 0;
        if (taux >= 100) {
          if (hookData.column.index === 6 || hookData.column.index === 7) {
            hookData.cell.styles.fillColor = [230, 250, 240]; // vert léger
            hookData.cell.styles.textColor = PDF_COLORS.success;
          }
        } else if (taux > 80) {
          if (hookData.column.index === 6 || hookData.column.index === 7) {
            hookData.cell.styles.fillColor = [255, 243, 224]; // orange léger
            hookData.cell.styles.textColor = PDF_COLORS.warning;
          }
        }
      }
    },
  });

  // Footers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    generatePDFFooter({ doc, pageNumber: p, totalPages });
  }

  doc.save(`SYGFP_Liquidations_${exercice || ''}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLiquidationExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportExcel = useCallback(
    (liquidations: Liquidation[], filters?: LiquidationExportFilters, exercice?: number) => {
      setIsExporting(true);
      try {
        doExportExcel(liquidations, exercice, filters);
        toast.success(`Export Excel : ${liquidations.length} liquidation(s)`);
      } catch (err) {
        toast.error('Erreur export Excel : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportCSV = useCallback(
    (liquidations: Liquidation[], filters?: LiquidationExportFilters, exercice?: number) => {
      setIsExporting(true);
      try {
        doExportCSV(liquidations, exercice, filters);
        toast.success(`Export CSV : ${liquidations.length} liquidation(s)`);
      } catch (err) {
        toast.error('Erreur export CSV : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportPDF = useCallback(
    async (liquidations: Liquidation[], filters?: LiquidationExportFilters, exercice?: number) => {
      setIsExporting(true);
      try {
        await doExportPDF(liquidations, exercice, filters);
        toast.success('Export PDF généré');
      } catch (err) {
        toast.error('Erreur export PDF : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportAttestation = useCallback(async (liquidation: Liquidation) => {
    setIsExporting(true);
    try {
      await doExportAttestationPDF(liquidation);
      toast.success(`Attestation ${liquidation.numero} générée`);
    } catch (err) {
      toast.error('Erreur attestation PDF : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportExcel, exportCSV, exportPDF, exportAttestation, isExporting };
}
