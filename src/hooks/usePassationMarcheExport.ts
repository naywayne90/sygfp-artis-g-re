/**
 * Hook d'export pour les Passations de Marche
 * - Excel multi-feuilles (4 sheets)
 * - PDF individuel (fiche marche avec en-tete ARTI)
 * - PDF PV COJO (tableau comparatif paysage)
 */

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { generatePDFHeader, loadImageAsDataUrl } from '@/lib/pdf/pdfHeader';
import { generatePDFFooter, generateSignatureTable } from '@/lib/pdf/pdfFooter';
import { PDF_COLORS, PDF_FONTS, PDF_MARGINS, PDF_PAGE, TABLE_STYLES } from '@/lib/pdf/pdfStyles';
import type { PassationMarche, LotMarche, Soumissionnaire } from '@/hooks/usePassationsMarche';
import { MODES_PASSATION, STATUTS } from '@/hooks/usePassationsMarche';
import logoArtiUrl from '@/assets/logo-arti.jpg';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtCurrency(n: number | null): string {
  if (!n) return '-';
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

function fmtDate(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
}

function modeName(v: string): string {
  return MODES_PASSATION.find((m) => m.value === v)?.label || v;
}

function statutName(v: string): string {
  return STATUTS[v]?.label || v;
}

function fmtNote(n: number | null): string {
  if (n == null) return '-';
  return Number(n).toFixed(2);
}

// ---------------------------------------------------------------------------
// A) Excel — 4 feuilles
// ---------------------------------------------------------------------------

function doExportExcel(
  passations: PassationMarche[],
  exercice?: number,
  filters?: { statut?: string }
): void {
  let data = passations;
  if (filters?.statut) {
    data = data.filter((p) => p.statut === filters.statut);
  }

  if (data.length === 0) {
    toast.warning('Aucune donnee a exporter');
    return;
  }

  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // --- Feuille 1 : Marches ---
  const headerRows = [
    ['ARTI - Autorite de Regulation du Transport Interieur'],
    ['Passation de Marches'],
    [`Exercice: ${exercice || ''}`],
    [`Genere le: ${dateStr} a ${timeStr}`],
    [],
  ];

  const colHeaders1 = [
    'Reference',
    'Objet (EB)',
    'Mode passation',
    'Seuil',
    'Montant estime',
    'Montant retenu',
    'Prestataire retenu',
    'Statut',
    'Date publication',
    'Date cloture',
    'Date attribution',
  ];

  const rows1 = data.map((p) => {
    const retenu = (p.soumissionnaires || []).find((s: Soumissionnaire) => s.statut === 'retenu');
    return [
      p.reference || '-',
      p.expression_besoin?.objet || '-',
      modeName(p.mode_passation),
      p.seuil_montant || '-',
      p.expression_besoin?.montant_estime || '',
      p.montant_retenu || '',
      retenu?.raison_sociale || p.prestataire_retenu?.raison_sociale || '-',
      statutName(p.statut),
      fmtDate(p.date_publication),
      fmtDate(p.date_cloture),
      fmtDate(p.attribue_at),
    ];
  });

  const totalEstime = data.reduce((s, p) => s + (p.expression_besoin?.montant_estime || 0), 0);
  const totalRetenu = data.reduce((s, p) => s + (p.montant_retenu || 0), 0);
  rows1.push(['TOTAL', '', '', '', totalEstime, totalRetenu, '', '', '', '', '']);

  const ws1 = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.sheet_add_aoa(ws1, [colHeaders1], { origin: `A${headerRows.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws1, rows1, { origin: `A${headerRows.length + 2}` });
  ws1['!cols'] = [
    { wch: 18 },
    { wch: 40 },
    { wch: 25 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Marches');

  // --- Feuille 2 : Lots ---
  const colHeaders2 = [
    'Ref. marche',
    'N deg lot',
    'Designation',
    'Montant estime',
    'Montant retenu',
    'Statut',
    'Nb soumissionnaires',
  ];
  const lotRows: (string | number)[][] = [];
  for (const p of data) {
    const lots = (p.lots || []) as LotMarche[];
    for (const lot of lots) {
      const lotSoums = (lot.soumissionnaires || []) as Soumissionnaire[];
      lotRows.push([
        p.reference || '-',
        lot.numero,
        lot.designation || '-',
        lot.montant_estime || '',
        lot.montant_retenu || '',
        lot.statut || 'en_cours',
        lotSoums.length,
      ]);
    }
  }
  if (lotRows.length === 0) {
    lotRows.push(['-', '', 'Aucun lot', '', '', '', '']);
  }
  const ws2 = XLSX.utils.aoa_to_sheet([colHeaders2]);
  XLSX.utils.sheet_add_aoa(ws2, lotRows, { origin: 'A2' });
  ws2['!cols'] = [
    { wch: 18 },
    { wch: 8 },
    { wch: 40 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Lots');

  // --- Feuille 3 : Soumissionnaires ---
  const colHeaders3 = [
    'Ref. marche',
    'Lot',
    'Raison sociale',
    'RCCM',
    'Offre financiere',
    'Date depot',
    'Note technique',
    'Note financiere',
    'Note finale',
    'Rang',
    'Statut',
  ];
  const soumRows: (string | number)[][] = [];
  for (const p of data) {
    const soums = (p.soumissionnaires || []) as Soumissionnaire[];
    const lots = (p.lots || []) as LotMarche[];
    for (const s of soums) {
      const lot = lots.find((l) => l.id === s.lot_marche_id);
      soumRows.push([
        p.reference || '-',
        lot ? `Lot ${lot.numero}` : '-',
        s.raison_sociale,
        s.rccm || '-',
        s.offre_financiere || '',
        fmtDate(s.date_depot),
        fmtNote(s.note_technique),
        fmtNote(s.note_financiere),
        fmtNote(s.note_finale),
        s.rang_classement ?? '-',
        s.statut,
      ]);
    }
  }
  if (soumRows.length === 0) {
    soumRows.push(['-', '', 'Aucun soumissionnaire', '', '', '', '', '', '', '', '']);
  }
  const ws3 = XLSX.utils.aoa_to_sheet([colHeaders3]);
  XLSX.utils.sheet_add_aoa(ws3, soumRows, { origin: 'A2' });
  ws3['!cols'] = [
    { wch: 18 },
    { wch: 10 },
    { wch: 30 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 6 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Soumissionnaires');

  // --- Feuille 4 : Evaluations ---
  const colHeaders4 = [
    'Ref. marche',
    'Lot',
    'Soumissionnaire',
    'Note technique (/100)',
    'Qualifie technique',
    'Note financiere (/100)',
    'Note finale (70/30)',
    'Rang',
    'Statut final',
  ];
  const evalRows: (string | number)[][] = [];
  for (const p of data) {
    const soums = (p.soumissionnaires || []) as Soumissionnaire[];
    const lots = (p.lots || []) as LotMarche[];
    const evaluated = soums
      .filter((s) => s.note_technique !== null || s.note_finale !== null)
      .sort((a, b) => (a.rang_classement ?? 999) - (b.rang_classement ?? 999));
    for (const s of evaluated) {
      const lot = lots.find((l) => l.id === s.lot_marche_id);
      evalRows.push([
        p.reference || '-',
        lot ? `Lot ${lot.numero}` : '-',
        s.raison_sociale,
        fmtNote(s.note_technique),
        s.qualifie_technique ? 'Oui' : 'Non',
        fmtNote(s.note_financiere),
        fmtNote(s.note_finale),
        s.rang_classement ?? '-',
        s.statut,
      ]);
    }
  }
  if (evalRows.length === 0) {
    evalRows.push(['-', '', 'Aucune evaluation', '', '', '', '', '', '']);
  }
  const ws4 = XLSX.utils.aoa_to_sheet([colHeaders4]);
  XLSX.utils.sheet_add_aoa(ws4, evalRows, { origin: 'A2' });
  ws4['!cols'] = [
    { wch: 18 },
    { wch: 10 },
    { wch: 30 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 6 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, 'Evaluations');

  // Download
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Passations_${exercice || ''}_${now.toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// B) PDF — rapport individuel marche
// ---------------------------------------------------------------------------

async function doExportPdfMarche(pm: PassationMarche): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let logoDataUrl: string | undefined;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArtiUrl);
  } catch {
    // continue without logo
  }

  // --- Header ARTI ---
  const { endY } = generatePDFHeader({ doc, logoDataUrl });

  // Title
  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('Fiche Passation de Marche', PDF_PAGE.width / 2, endY, { align: 'center' });

  // Reference
  doc.setFontSize(PDF_FONTS.size.body);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(pm.reference || 'N/A', PDF_PAGE.width / 2, endY + 7, { align: 'center' });

  let yPos = endY + 14;

  // --- Section 1: Informations generales ---
  doc.setFontSize(PDF_FONTS.size.subtitle);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('Informations generales', PDF_MARGINS.left, yPos);
  yPos += 4;

  const infoBody = [
    ['EB source', `${pm.expression_besoin?.numero || '-'} — ${pm.expression_besoin?.objet || '-'}`],
    ['Direction', pm.expression_besoin?.direction?.sigle || '-'],
    ['Mode de passation', modeName(pm.mode_passation)],
    ['Type procedure', pm.type_procedure || '-'],
    ['Seuil', pm.seuil_montant || '-'],
    ['Montant estime', fmtCurrency(pm.expression_besoin?.montant_estime ?? null)],
    ['Montant retenu', fmtCurrency(pm.montant_retenu)],
    ['Statut', statutName(pm.statut)],
    ['Date publication', fmtDate(pm.date_publication)],
    ['Date cloture', fmtDate(pm.date_cloture)],
    ['Date attribution', fmtDate(pm.attribue_at)],
    ['Date approbation', fmtDate(pm.approuve_at)],
    ['Date signature', fmtDate(pm.signe_at)],
    ['Allotissement', pm.allotissement ? 'Oui' : 'Non'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: infoBody,
    theme: 'striped',
    styles: {
      fontSize: TABLE_STYLES.compact.fontSize,
      cellPadding: TABLE_STYLES.compact.cellPadding,
      textColor: TABLE_STYLES.default.textColor,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: PDF_COLORS.primary },
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 60;
  yPos += 8;

  // --- Section 2: Lots ---
  const lots = (pm.lots || []) as LotMarche[];
  if (lots.length > 0) {
    if (yPos > PDF_PAGE.height - 60) {
      doc.addPage();
      const { endY: newY } = generatePDFHeader({ doc, logoDataUrl });
      yPos = newY;
    }

    doc.setFontSize(PDF_FONTS.size.subtitle);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(`Lots (${lots.length})`, PDF_MARGINS.left, yPos);
    yPos += 4;

    const lotData = lots.map((l) => {
      const lotSoums = (l.soumissionnaires || []) as Soumissionnaire[];
      return [
        `Lot ${l.numero}`,
        l.designation || '-',
        fmtCurrency(l.montant_estime),
        fmtCurrency(l.montant_retenu ?? null),
        String(lotSoums.length),
        l.statut || 'en_cours',
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['N deg', 'Designation', 'Montant est.', 'Montant ret.', 'Soum.', 'Statut']],
      body: lotData,
      theme: 'grid',
      styles: {
        fontSize: TABLE_STYLES.compact.fontSize,
        cellPadding: TABLE_STYLES.compact.cellPadding,
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
      margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 30;
    yPos += 8;
  }

  // --- Section 3: Soumissionnaires ---
  const soums = (pm.soumissionnaires || []) as Soumissionnaire[];
  if (soums.length > 0) {
    if (yPos > PDF_PAGE.height - 60) {
      doc.addPage();
      const { endY: newY } = generatePDFHeader({ doc, logoDataUrl });
      yPos = newY;
    }

    doc.setFontSize(PDF_FONTS.size.subtitle);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(`Soumissionnaires (${soums.length})`, PDF_MARGINS.left, yPos);
    yPos += 4;

    const soumData = [...soums]
      .sort((a, b) => (a.rang_classement ?? 999) - (b.rang_classement ?? 999))
      .map((s) => [
        s.rang_classement ?? '-',
        s.raison_sociale,
        fmtCurrency(s.offre_financiere),
        fmtNote(s.note_technique),
        fmtNote(s.note_financiere),
        fmtNote(s.note_finale),
        s.statut,
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rang', 'Entreprise', 'Offre', 'Tech.', 'Fin.', 'Finale', 'Statut']],
      body: soumData,
      theme: 'grid',
      styles: {
        fontSize: TABLE_STYLES.compact.fontSize,
        cellPadding: TABLE_STYLES.compact.cellPadding,
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
        0: { halign: 'center', cellWidth: 12 },
        2: { halign: 'right' },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'center', cellWidth: 14 },
        5: { halign: 'center', cellWidth: 14 },
        6: { cellWidth: 18 },
      },
      margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 30;
    yPos += 8;
  }

  // --- Section 4: Evaluation COJO ---
  const evaluated = soums.filter((s) => s.note_technique !== null || s.note_finale !== null);
  if (evaluated.length > 0) {
    if (yPos > PDF_PAGE.height - 60) {
      doc.addPage();
      const { endY: newY } = generatePDFHeader({ doc, logoDataUrl });
      yPos = newY;
    }

    doc.setFontSize(PDF_FONTS.size.subtitle);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text('Evaluation COJO — Classement', PDF_MARGINS.left, yPos);
    yPos += 4;

    const evalData = [...evaluated]
      .sort((a, b) => (a.rang_classement ?? 999) - (b.rang_classement ?? 999))
      .map((s) => [
        s.rang_classement ?? '-',
        s.raison_sociale,
        fmtNote(s.note_technique),
        s.qualifie_technique ? 'Oui' : 'Non',
        fmtNote(s.note_financiere),
        fmtNote(s.note_finale),
        s.statut,
        s.motif_elimination || '-',
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rang', 'Entreprise', 'Tech.', 'Qualifie', 'Fin.', 'Finale', 'Statut', 'Motif']],
      body: evalData,
      theme: 'grid',
      styles: {
        fontSize: TABLE_STYLES.compact.fontSize,
        cellPadding: TABLE_STYLES.compact.cellPadding,
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
        0: { halign: 'center', cellWidth: 10 },
        2: { halign: 'center', cellWidth: 12 },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'center', cellWidth: 12 },
        5: { halign: 'center', cellWidth: 14 },
        6: { cellWidth: 16 },
      },
      margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 30;
    yPos += 8;
  }

  // --- Section 5: Resultat attribution ---
  const retenu = soums.find((s) => s.statut === 'retenu');
  if (retenu || pm.prestataire_retenu) {
    if (yPos > PDF_PAGE.height - 40) {
      doc.addPage();
      const { endY: newY } = generatePDFHeader({ doc, logoDataUrl });
      yPos = newY;
    }

    doc.setFontSize(PDF_FONTS.size.subtitle);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text('Resultat attribution', PDF_MARGINS.left, yPos);
    yPos += 6;

    doc.setFontSize(PDF_FONTS.size.body);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.success);
    const prestataireNom = retenu?.raison_sociale || pm.prestataire_retenu?.raison_sociale || '-';
    doc.text(`Prestataire retenu : ${prestataireNom}`, PDF_MARGINS.left, yPos);
    yPos += 6;

    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
    doc.setTextColor(...PDF_COLORS.text);
    if (pm.montant_retenu) {
      doc.text(`Montant retenu : ${fmtCurrency(pm.montant_retenu)}`, PDF_MARGINS.left, yPos);
      yPos += 5;
    }
    if (pm.decision) {
      const decLabel =
        pm.decision === 'engagement_possible' ? 'Engagement possible' : 'Contrat a creer';
      doc.text(`Decision : ${decLabel}`, PDF_MARGINS.left, yPos);
      yPos += 5;
    }
    if (pm.motif_selection) {
      doc.text(`Motif : ${pm.motif_selection}`, PDF_MARGINS.left, yPos);
    }
  }

  // --- Footers on all pages ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    generatePDFFooter({ doc, pageNumber: p, totalPages });
  }

  doc.save(
    `fiche_passation_${pm.reference || 'N_A'}_${new Date().toISOString().split('T')[0]}.pdf`
  );
}

// ---------------------------------------------------------------------------
// C) PDF PV COJO — tableau comparatif (paysage)
// ---------------------------------------------------------------------------

async function doExportPdfComparatif(pm: PassationMarche, lotId?: string): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = 297; // A4 landscape width

  let logoDataUrl: string | undefined;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArtiUrl);
  } catch {
    // continue without logo
  }

  // --- Header ARTI ---
  const { endY } = generatePDFHeader({ doc, logoDataUrl });

  // Title
  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('PV COJO — Evaluation des offres', pageWidth / 2, endY, { align: 'center' });

  // Sub-info
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(
    `Reference : ${pm.reference || 'N/A'}  |  Objet : ${pm.expression_besoin?.objet || '-'}  |  Date : ${fmtDate(new Date().toISOString())}`,
    pageWidth / 2,
    endY + 6,
    { align: 'center' }
  );

  let yPos = endY + 14;

  // Determine lots to process
  const allLots = (pm.lots || []) as LotMarche[];
  const allSoums = (pm.soumissionnaires || []) as Soumissionnaire[];

  type LotGroup = { label: string; soumissionnaires: Soumissionnaire[] };
  const groups: LotGroup[] = [];

  if (lotId) {
    const lot = allLots.find((l) => l.id === lotId);
    if (lot) {
      const lotSoums = (lot.soumissionnaires || []) as Soumissionnaire[];
      groups.push({
        label: `Lot ${lot.numero} — ${lot.designation || ''}`,
        soumissionnaires: lotSoums,
      });
    }
  } else if (pm.allotissement && allLots.length > 0) {
    for (const lot of allLots) {
      const lotSoums = (lot.soumissionnaires || []) as Soumissionnaire[];
      if (lotSoums.length > 0) {
        groups.push({
          label: `Lot ${lot.numero} — ${lot.designation || ''}`,
          soumissionnaires: lotSoums,
        });
      }
    }
  } else {
    const noLotSoums = allSoums.filter((s) => !s.lot_marche_id);
    if (noLotSoums.length > 0) {
      groups.push({ label: 'Lot unique', soumissionnaires: noLotSoums });
    }
  }

  // --- Per-lot comparison tables ---
  for (const group of groups) {
    if (yPos > 170) {
      doc.addPage();
      const { endY: newY } = generatePDFHeader({ doc, logoDataUrl });
      yPos = newY;
    }

    doc.setFontSize(PDF_FONTS.size.body);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(group.label, PDF_MARGINS.left, yPos);
    yPos += 4;

    const sorted = [...group.soumissionnaires].sort(
      (a, b) => (a.rang_classement ?? 999) - (b.rang_classement ?? 999)
    );

    if (sorted.length === 0) {
      doc.setFontSize(PDF_FONTS.size.small);
      doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
      doc.setTextColor(...PDF_COLORS.secondary);
      doc.text('Aucun soumissionnaire', PDF_MARGINS.left + 4, yPos);
      yPos += 8;
      continue;
    }

    const headers = ['Critere', ...sorted.map((s) => s.raison_sociale)];

    // Find best values
    const bestTech = Math.max(...sorted.map((s) => s.note_technique ?? 0));
    const bestFin = Math.max(...sorted.map((s) => s.note_financiere ?? 0));
    const bestFinal = Math.max(...sorted.map((s) => s.note_finale ?? 0));
    const bestRank = Math.min(
      ...sorted.filter((s) => s.rang_classement !== null).map((s) => s.rang_classement ?? 999)
    );

    const rows = [
      ['Offre financiere', ...sorted.map((s) => fmtCurrency(s.offre_financiere))],
      [
        'Note technique (/100)',
        ...sorted.map((s) => {
          const v = s.note_technique;
          if (v == null) return '-';
          return v === bestTech && bestTech > 0 ? `${fmtNote(v)} *` : fmtNote(v);
        }),
      ],
      ['Qualifie technique', ...sorted.map((s) => (s.qualifie_technique ? 'Oui' : 'Non'))],
      [
        'Note financiere (/100)',
        ...sorted.map((s) => {
          const v = s.note_financiere;
          if (v == null) return '-';
          return v === bestFin && bestFin > 0 ? `${fmtNote(v)} *` : fmtNote(v);
        }),
      ],
      [
        'Note finale (70/30)',
        ...sorted.map((s) => {
          const v = s.note_finale;
          if (v == null) return '-';
          return v === bestFinal && bestFinal > 0 ? `${fmtNote(v)} *` : fmtNote(v);
        }),
      ],
      [
        'Classement',
        ...sorted.map((s) => {
          const r = s.rang_classement;
          if (r == null) return '-';
          if (r === bestRank) return '1er *';
          return `${r}eme`;
        }),
      ],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineWidth: TABLE_STYLES.default.lineWidth,
        lineColor: TABLE_STYLES.default.lineColor,
        textColor: TABLE_STYLES.default.textColor,
        halign: 'center',
      },
      headStyles: {
        fillColor: TABLE_STYLES.head.fillColor,
        textColor: TABLE_STYLES.head.textColor,
        fontStyle: TABLE_STYLES.head.fontStyle,
        halign: 'center',
        fontSize: 7,
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 },
      },
      margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index > 0) {
          const val = String(data.cell.raw);
          if (val.endsWith(' *')) {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [21, 128, 61];
            data.cell.styles.fontStyle = 'bold';
            data.cell.text = [val.replace(' *', '')];
          }
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 40;
    yPos += 8;
  }

  // --- Resume ---
  if (yPos > 160) {
    doc.addPage();
    const { endY: newY } = generatePDFHeader({ doc, logoDataUrl });
    yPos = newY;
  }

  const retenu = allSoums.find((s) => s.statut === 'retenu');
  if (retenu) {
    doc.setFontSize(PDF_FONTS.size.body);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text('Resume', PDF_MARGINS.left, yPos);
    yPos += 6;

    doc.setFontSize(PDF_FONTS.size.body);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.success);
    doc.text(`Prestataire recommande : ${retenu.raison_sociale}`, PDF_MARGINS.left, yPos);
    yPos += 5;
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text(
      `Offre : ${fmtCurrency(retenu.offre_financiere)}  |  Note finale : ${fmtNote(retenu.note_finale)}`,
      PDF_MARGINS.left,
      yPos
    );
    yPos += 10;
  }

  // --- Zone signature ---
  if (yPos > 160) {
    doc.addPage();
    const { endY: newY } = generatePDFHeader({ doc, logoDataUrl });
    yPos = newY;
  }

  generateSignatureTable({
    doc,
    startY: yPos,
    signataires: [
      { titre: 'President COJO', direction: 'President COJO' },
      { titre: 'Membre 1', direction: 'Membre COJO' },
      { titre: 'Membre 2', direction: 'Membre COJO' },
      { titre: 'Rapporteur', direction: 'Rapporteur' },
    ],
  });

  // --- Footers ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    generatePDFFooter({ doc, pageNumber: p, totalPages });
  }

  doc.save(`pv_cojo_${pm.reference || 'N_A'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePassationMarcheExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportExcel = useCallback(
    (passations: PassationMarche[], filters?: { statut?: string }, exercice?: number) => {
      setIsExporting(true);
      try {
        doExportExcel(passations, exercice, filters);
        toast.success(`Export Excel : ${passations.length} passation(s)`);
      } catch (err) {
        toast.error('Erreur export Excel : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportPdfMarche = useCallback(async (passation: PassationMarche) => {
    setIsExporting(true);
    try {
      await doExportPdfMarche(passation);
      toast.success('PDF marche genere');
    } catch (err) {
      toast.error('Erreur export PDF : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportPdfComparatif = useCallback(async (passation: PassationMarche, lotId?: string) => {
    setIsExporting(true);
    try {
      await doExportPdfComparatif(passation, lotId);
      toast.success('PV COJO genere');
    } catch (err) {
      toast.error('Erreur export PV COJO : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportExcel, exportPdfMarche, exportPdfComparatif, isExporting };
}
