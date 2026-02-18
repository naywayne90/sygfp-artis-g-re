/**
 * Hook d'export pour les Passations de Marché
 * 3 formats : Excel (4 feuilles), PDF (rapport synthèse), CSV (liste plate)
 */

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { toast } from 'sonner';
import { exportToCSV, type ExportColumn } from '@/lib/export/export-service';
import { generatePDFHeader, loadImageAsDataUrl } from '@/lib/pdf/pdfHeader';
import { generatePDFFooter } from '@/lib/pdf/pdfFooter';
import { PDF_COLORS, PDF_FONTS, PDF_MARGINS, PDF_PAGE, TABLE_STYLES } from '@/lib/pdf/pdfStyles';
import { MODES_PASSATION, STATUTS } from '@/hooks/usePassationsMarche';
import type { LotMarche, Soumissionnaire } from '@/hooks/usePassationsMarche';
import logoArtiUrl from '@/assets/logo-arti.jpg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportRow {
  id: string;
  reference: string;
  eb_numero: string;
  eb_objet: string;
  direction_sigle: string;
  mode_passation: string;
  allotissement: boolean;
  nb_lots: number;
  nb_soumissionnaires: number;
  montant_estime: number;
  montant_retenu: number | null;
  attributaire: string;
  statut: string;
  created_at: string;
  lots: LotMarche[];
  soumissionnaires: Soumissionnaire[];
  creator_name: string;
}

// ---------------------------------------------------------------------------
// Shared data fetcher
// ---------------------------------------------------------------------------

async function fetchExportData(exercice: number): Promise<ExportRow[]> {
  const { data, error } = await supabase
    .from('passation_marche')
    .select(
      `
      *, lots:lots_marche(*), soumissionnaires:soumissionnaires_lot(*),
      expression_besoin:expressions_besoin(id, numero, objet, montant_estime, direction:directions(sigle)),
      prestataire_retenu:prestataires!passation_marche_prestataire_retenu_id_fkey(raison_sociale),
      creator:profiles!passation_marche_created_by_fkey(full_name)
    `
    )
    .eq('exercice', exercice)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) throw error;

  return (data || []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const eb = r.expression_besoin as {
      numero: string;
      objet: string;
      montant_estime: number;
      direction: { sigle: string } | null;
    } | null;
    const prest = r.prestataire_retenu as { raison_sociale: string } | null;
    const creator = r.creator as { full_name: string } | null;
    const lots = (r.lots || []) as LotMarche[];
    const soumissionnaires = (r.soumissionnaires || []) as Soumissionnaire[];

    return {
      id: r.id as string,
      reference: (r.reference as string) || '-',
      eb_numero: eb?.numero || '-',
      eb_objet: eb?.objet || '',
      direction_sigle: eb?.direction?.sigle || '-',
      mode_passation: (r.mode_passation as string) || '-',
      allotissement: (r.allotissement as boolean) || false,
      nb_lots: lots.length || (r.allotissement ? 0 : 1),
      nb_soumissionnaires: soumissionnaires.length,
      montant_estime: eb?.montant_estime || 0,
      montant_retenu: (r.montant_retenu as number) || null,
      attributaire: prest?.raison_sociale || '-',
      statut: (r.statut as string) || 'brouillon',
      created_at: (r.created_at as string) || '',
      lots,
      soumissionnaires,
      creator_name: creator?.full_name || '-',
    };
  });
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

const modeName = (v: string): string => MODES_PASSATION.find((m) => m.value === v)?.label || v;

const statutName = (v: string): string => STATUTS[v as keyof typeof STATUTS]?.label || v;

function fmtCurrency(n: number): string {
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

// ---------------------------------------------------------------------------
// A) Excel — 4 feuilles
// ---------------------------------------------------------------------------

function doExportExcel(rows: ExportRow[], exercice: number): void {
  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // --- Feuille 1 : Synthèse ---
  const headerRows = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Passations de Marché'],
    [`Exercice: ${exercice}`],
    [`Généré le: ${dateStr} à ${timeStr}`],
    [],
  ];

  const colHeaders1 = [
    'Réf',
    'EB',
    'Objet',
    'Direction',
    'Mode',
    'Nb lots',
    'Nb soum.',
    'Montant estimé',
    'Montant retenu',
    'Attributaire',
    'Statut',
    'Date',
  ];

  const dataRows1 = rows.map((r) => [
    r.reference,
    r.eb_numero,
    r.eb_objet,
    r.direction_sigle,
    modeName(r.mode_passation),
    r.nb_lots,
    r.nb_soumissionnaires,
    r.montant_estime,
    r.montant_retenu || '',
    r.attributaire,
    statutName(r.statut),
    fmtDate(r.created_at),
  ]);

  const totalEstime = rows.reduce((s, r) => s + r.montant_estime, 0);
  const totalRetenu = rows.reduce((s, r) => s + (r.montant_retenu || 0), 0);
  const totalRow1 = [
    'TOTAL',
    '',
    '',
    '',
    '',
    rows.reduce((s, r) => s + r.nb_lots, 0),
    rows.reduce((s, r) => s + r.nb_soumissionnaires, 0),
    totalEstime,
    totalRetenu || '',
    '',
    '',
    '',
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.sheet_add_aoa(ws1, [colHeaders1], { origin: `A${headerRows.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws1, dataRows1, { origin: `A${headerRows.length + 2}` });
  XLSX.utils.sheet_add_aoa(ws1, [totalRow1], {
    origin: `A${headerRows.length + 2 + dataRows1.length}`,
  });
  ws1['!cols'] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 40 },
    { wch: 12 },
    { wch: 22 },
    { wch: 8 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 14 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Synthèse');

  // --- Feuille 2 : Lots ---
  const colHeaders2 = [
    'Réf passation',
    'N° lot',
    'Désignation',
    'Montant estimé',
    'Montant retenu',
    'Nb soumissionnaires',
    'Statut lot',
  ];

  const dataRows2: (string | number)[][] = [];
  for (const r of rows) {
    for (const lot of r.lots) {
      const lotSoums = r.soumissionnaires.filter((s) => s.lot_marche_id === lot.id);
      dataRows2.push([
        r.reference,
        lot.numero,
        lot.designation || '',
        lot.montant_estime || 0,
        lot.montant_retenu || '',
        lotSoums.length,
        lot.statut || 'en_cours',
      ]);
    }
  }

  const ws2 = XLSX.utils.aoa_to_sheet([colHeaders2]);
  if (dataRows2.length > 0) {
    XLSX.utils.sheet_add_aoa(ws2, dataRows2, { origin: 'A2' });
  }
  ws2['!cols'] = [
    { wch: 18 },
    { wch: 8 },
    { wch: 40 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Lots');

  // --- Feuille 3 : Soumissionnaires ---
  const colHeaders3 = [
    'Réf passation',
    'Lot',
    'Raison sociale',
    'Offre financière',
    'Note tech.',
    'Note fin.',
    'Note finale',
    'Rang',
    'Statut',
  ];

  const dataRows3: (string | number)[][] = [];
  for (const r of rows) {
    for (const s of r.soumissionnaires) {
      const lot = r.lots.find((l) => l.id === s.lot_marche_id);
      dataRows3.push([
        r.reference,
        lot ? `Lot ${lot.numero}` : 'Global',
        s.raison_sociale,
        s.offre_financiere || '',
        s.note_technique ?? '',
        s.note_financiere ?? '',
        s.note_finale != null ? Number(s.note_finale).toFixed(2) : '',
        s.rang_classement ?? '',
        s.statut,
      ]);
    }
  }

  const ws3 = XLSX.utils.aoa_to_sheet([colHeaders3]);
  if (dataRows3.length > 0) {
    XLSX.utils.sheet_add_aoa(ws3, dataRows3, { origin: 'A2' });
  }
  ws3['!cols'] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 30 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 6 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Soumissionnaires');

  // --- Feuille 4 : Évaluations ---
  const colHeaders4 = [
    'Réf passation',
    'Mode',
    'Soum. qualifiés',
    'Soum. total',
    'Attributaire',
    'Note finale attributaire',
  ];

  const dataRows4: (string | number)[][] = [];
  for (const r of rows) {
    const qualified = r.soumissionnaires.filter(
      (s) => s.note_technique !== null && (s.note_technique ?? 0) >= 70
    );
    const retenu = r.soumissionnaires.find((s) => s.statut === 'retenu');
    dataRows4.push([
      r.reference,
      modeName(r.mode_passation),
      qualified.length,
      r.nb_soumissionnaires,
      retenu?.raison_sociale || r.attributaire,
      retenu?.note_finale != null ? Number(retenu.note_finale).toFixed(2) : '-',
    ]);
  }

  const ws4 = XLSX.utils.aoa_to_sheet([colHeaders4]);
  if (dataRows4.length > 0) {
    XLSX.utils.sheet_add_aoa(ws4, dataRows4, { origin: 'A2' });
  }
  ws4['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 30 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'Évaluations');

  // Download
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Passations_Marche_${exercice}_${now.toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// B) PDF — Rapport synthèse
// ---------------------------------------------------------------------------

async function doExportPDF(rows: ExportRow[], exercice: number): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let logoDataUrl: string | undefined;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArtiUrl);
  } catch {
    // continue without logo
  }

  const { endY } = generatePDFHeader({ doc, logoDataUrl });

  // Title
  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(`Rapport des Passations de Marché — Exercice ${exercice}`, PDF_PAGE.width / 2, endY, {
    align: 'center',
  });

  const yStart = endY + 8;

  // Summary
  const totalEstime = rows.reduce((s, r) => s + r.montant_estime, 0);
  const totalRetenu = rows.reduce((s, r) => s + (r.montant_retenu || 0), 0);
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(
    `${rows.length} passation(s) — Total estimé: ${fmtCurrency(totalEstime)} — Total retenu: ${fmtCurrency(totalRetenu)}`,
    PDF_MARGINS.left,
    yStart
  );

  // Main table
  const tableData = rows.map((r) => [
    r.reference,
    r.eb_numero,
    modeName(r.mode_passation),
    fmtCurrency(r.montant_estime),
    r.attributaire !== '-' ? r.attributaire : '',
    statutName(r.statut),
  ]);

  autoTable(doc, {
    startY: yStart + 4,
    head: [['Réf', 'EB', 'Mode', 'Montant', 'Attributaire', 'Statut']],
    body: tableData,
    foot: [['TOTAL', `${rows.length} pass.`, '', fmtCurrency(totalEstime), '', '']],
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
    footStyles: {
      fillColor: PDF_COLORS.headerBg,
      textColor: PDF_COLORS.text,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { halign: 'right', cellWidth: 28 },
      4: { cellWidth: 40 },
      5: { cellWidth: 22 },
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
  });

  // Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    generatePDFFooter({ doc, pageNumber: p, totalPages });
  }

  doc.save(`SYGFP_Passations_Marche_${exercice}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ---------------------------------------------------------------------------
// C) CSV — flat list
// ---------------------------------------------------------------------------

function doExportCSV(rows: ExportRow[], exercice: number): void {
  const columns: ExportColumn[] = [
    { key: 'reference', label: 'Réf', type: 'text' },
    { key: 'eb_numero', label: 'EB source', type: 'text' },
    { key: 'direction_sigle', label: 'Direction', type: 'text' },
    { key: 'mode_passation', label: 'Mode', format: (v) => modeName(String(v)) },
    { key: 'nb_lots', label: 'Nb lots', type: 'number' },
    { key: 'montant_estime', label: 'Montant estimé', type: 'currency' },
    { key: 'montant_retenu', label: 'Montant retenu', type: 'currency' },
    { key: 'statut', label: 'Statut', format: (v) => statutName(String(v)) },
    { key: 'created_at', label: 'Date', type: 'date' },
  ];

  const data = rows.map((r) => ({
    ...r,
  })) as unknown as Record<string, unknown>[];

  exportToCSV(data, columns, {
    title: 'Passations de Marché',
    filename: 'SYGFP_Passations_Marche',
    exercice,
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePassationExport() {
  const { exercice } = useExercice();
  const [isExporting, setIsExporting] = useState(false);

  const exportExcel = useCallback(async () => {
    if (!exercice) return;
    setIsExporting(true);
    try {
      const rows = await fetchExportData(exercice);
      if (rows.length === 0) {
        toast.warning('Aucune passation à exporter');
        return;
      }
      doExportExcel(rows, exercice);
      toast.success(`Export Excel : ${rows.length} passation(s)`);
    } catch (err) {
      toast.error('Erreur export Excel : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  }, [exercice]);

  const exportPDF = useCallback(async () => {
    if (!exercice) return;
    setIsExporting(true);
    try {
      const rows = await fetchExportData(exercice);
      if (rows.length === 0) {
        toast.warning('Aucune passation à exporter');
        return;
      }
      await doExportPDF(rows, exercice);
      toast.success(`Export PDF : ${rows.length} passation(s)`);
    } catch (err) {
      toast.error('Erreur export PDF : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  }, [exercice]);

  const exportCSV = useCallback(async () => {
    if (!exercice) return;
    setIsExporting(true);
    try {
      const rows = await fetchExportData(exercice);
      if (rows.length === 0) {
        toast.warning('Aucune passation à exporter');
        return;
      }
      doExportCSV(rows, exercice);
      toast.success(`Export CSV : ${rows.length} passation(s)`);
    } catch (err) {
      toast.error('Erreur export CSV : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  }, [exercice]);

  return { exportExcel, exportPDF, exportCSV, isExporting };
}
