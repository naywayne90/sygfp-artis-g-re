/**
 * Hook d'export pour les Expressions de Besoin
 * 3 formats : Excel (2 feuilles), PDF (articles par EB), CSV (liste plate)
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
import { getUniteLabel } from '@/components/expression-besoin/articleConstants';
import type { ExpressionBesoinLigne } from './useExpressionsBesoin';
import logoArtiUrl from '@/assets/logo-arti.jpg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportFilters {
  statut?: string;
  search?: string;
}

interface ExportRow {
  numero: string;
  objet: string;
  direction_sigle: string;
  nb_articles: number;
  montant_estime: number;
  urgence: string;
  statut: string;
  created_at: string;
  liste_articles: ExpressionBesoinLigne[];
  prestataire: string;
}

// ---------------------------------------------------------------------------
// Shared data fetcher
// ---------------------------------------------------------------------------

async function fetchExportData(exercice: number, filters?: ExportFilters): Promise<ExportRow[]> {
  let query = supabase
    .from('expressions_besoin')
    .select(
      `
      id, numero, objet, montant_estime, urgence, statut, created_at, liste_articles,
      direction:directions(sigle),
      marche:marches!expressions_besoin_marche_id_fkey(
        prestataire:prestataires(raison_sociale)
      )
    `
    )
    .eq('exercice', exercice)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (filters?.statut) {
    query = query.eq('statut', filters.statut);
  }
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`objet.ilike.${term},numero.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row) => {
    const r = row as Record<string, unknown>;
    const dir = r.direction as { sigle: string | null } | null;
    const marche = r.marche as { prestataire: { raison_sociale: string } | null } | null;
    const articles = (r.liste_articles || []) as ExpressionBesoinLigne[];

    return {
      numero: (r.numero as string) || '-',
      objet: (r.objet as string) || '',
      direction_sigle: dir?.sigle || '-',
      nb_articles: articles.length,
      montant_estime: (r.montant_estime as number) || 0,
      urgence: (r.urgence as string) || 'normale',
      statut: (r.statut as string) || 'brouillon',
      created_at: (r.created_at as string) || '',
      liste_articles: articles,
      prestataire: marche?.prestataire?.raison_sociale || '-',
    };
  });
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  verifie: 'Vérifié CB',
  valide: 'Validé',
  rejete: 'Rejeté',
  differe: 'Différé',
  satisfaite: 'Satisfaite',
};

const URGENCE_LABELS: Record<string, string> = {
  normale: 'Normal',
  haute: 'Urgent',
  urgente: 'Très urgent',
};

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

function fmtDate(iso: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
}

// ---------------------------------------------------------------------------
// A) Excel — 2 feuilles
// ---------------------------------------------------------------------------

function doExportExcel(rows: ExportRow[], exercice: number): void {
  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // --- Feuille 1 : Liste ---
  const headerRows = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Expressions de Besoin'],
    [`Exercice: ${exercice}`],
    [`Généré le: ${dateStr} à ${timeStr}`],
    [],
  ];

  const colHeaders = [
    'Réf',
    'Objet',
    'Direction',
    'Nb articles',
    'Total FCFA',
    'Urgence',
    'Statut',
    'Date',
  ];

  const dataRows = rows.map((r) => [
    r.numero,
    r.objet,
    r.direction_sigle,
    r.nb_articles,
    r.montant_estime,
    URGENCE_LABELS[r.urgence] || r.urgence,
    STATUS_LABELS[r.statut] || r.statut,
    fmtDate(r.created_at),
  ]);

  // Total row
  const totalMontant = rows.reduce((s, r) => s + r.montant_estime, 0);
  const totalRow = [
    'TOTAL',
    '',
    '',
    rows.reduce((s, r) => s + r.nb_articles, 0),
    totalMontant,
    '',
    '',
    '',
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.sheet_add_aoa(ws1, [colHeaders], { origin: `A${headerRows.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws1, dataRows, { origin: `A${headerRows.length + 2}` });
  XLSX.utils.sheet_add_aoa(ws1, [totalRow], {
    origin: `A${headerRows.length + 2 + dataRows.length}`,
  });
  ws1['!cols'] = [
    { wch: 18 },
    { wch: 40 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Liste');

  // --- Feuille 2 : Détail articles ---
  const artHeaderRows = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Détail des articles — Expressions de Besoin'],
    [`Exercice: ${exercice}`],
    [],
  ];

  const artColHeaders = ['Réf expression', 'N°', 'Désignation', 'Qté', 'Unité', 'PU', 'Total'];

  const artRows: (string | number)[][] = [];
  for (const eb of rows) {
    if (!eb.liste_articles || eb.liste_articles.length === 0) continue;
    for (let i = 0; i < eb.liste_articles.length; i++) {
      const a = eb.liste_articles[i];
      artRows.push([
        eb.numero,
        i + 1,
        a.designation || '',
        a.quantite,
        getUniteLabel(a.unite),
        a.prix_unitaire,
        a.prix_total,
      ]);
    }
  }

  const ws2 = XLSX.utils.aoa_to_sheet(artHeaderRows);
  XLSX.utils.sheet_add_aoa(ws2, [artColHeaders], { origin: `A${artHeaderRows.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws2, artRows, { origin: `A${artHeaderRows.length + 2}` });
  ws2['!cols'] = [
    { wch: 18 },
    { wch: 5 },
    { wch: 40 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Détail articles');

  // Download
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Expressions_Besoin_${now.toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// B) PDF — articles par expression
// ---------------------------------------------------------------------------

async function doExportPDF(rows: ExportRow[], exercice: number): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let logoDataUrl: string | undefined;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArtiUrl);
  } catch {
    // Logo loading failed, continue without
  }

  let currentPage = 1;

  // --- Header ---
  const { endY } = generatePDFHeader({ doc, logoDataUrl });

  // Title
  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(`Expressions de Besoin — Exercice ${exercice}`, PDF_PAGE.width / 2, endY, {
    align: 'center',
  });

  let yPos = endY + 10;

  const totalGeneral = rows.reduce((s, r) => s + r.montant_estime, 0);

  // --- For each expression ---
  for (let i = 0; i < rows.length; i++) {
    const eb = rows[i];

    // Check if we need a new page (need ~40mm for title + small table)
    if (yPos > PDF_PAGE.height - 60) {
      // Footer on current page
      generatePDFFooter({ doc, pageNumber: currentPage, totalPages: 0 });
      doc.addPage();
      currentPage++;

      // Re-add header on new page
      const { endY: newEndY } = generatePDFHeader({ doc, logoDataUrl });
      yPos = newEndY;
    }

    // Expression title
    doc.setFontSize(PDF_FONTS.size.small);
    doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(`${eb.numero} — ${eb.objet} (${eb.direction_sigle})`, PDF_MARGINS.left, yPos);
    yPos += 5;

    // Articles table
    const articles = eb.liste_articles || [];
    if (articles.length > 0) {
      const tableData = articles.map((a, idx) => [
        String(idx + 1),
        a.designation || '',
        String(a.quantite),
        getUniteLabel(a.unite),
        fmtCurrency(a.prix_unitaire),
        fmtCurrency(a.prix_total),
      ]);

      const subtotal = articles.reduce((s, a) => s + (a.prix_total || 0), 0);

      autoTable(doc, {
        startY: yPos,
        head: [['N°', 'Désignation', 'Qté', 'Unité', 'PU', 'Total']],
        body: tableData,
        foot: [['', 'Sous-total', '', '', '', fmtCurrency(subtotal)]],
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
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 60 },
          2: { halign: 'center', cellWidth: 15 },
          3: { cellWidth: 25 },
          4: { halign: 'right', cellWidth: 30 },
          5: { halign: 'right', cellWidth: 30 },
        },
        margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
        didDrawPage: () => {
          // handled manually
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 20;
      yPos += 6;
    } else {
      doc.setFontSize(PDF_FONTS.size.tiny);
      doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
      doc.setTextColor(...PDF_COLORS.secondary);
      doc.text('Aucun article', PDF_MARGINS.left + 4, yPos);
      yPos += 8;
    }
  }

  // --- Récapitulatif ---
  if (yPos > PDF_PAGE.height - 50) {
    generatePDFFooter({ doc, pageNumber: currentPage, totalPages: 0 });
    doc.addPage();
    currentPage++;
    const { endY: newY } = generatePDFHeader({ doc, logoDataUrl });
    yPos = newY;
  }

  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(PDF_MARGINS.left, yPos, PDF_PAGE.width - PDF_MARGINS.right, yPos);
  yPos += 6;

  doc.setFontSize(PDF_FONTS.size.body);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(`Total général : ${fmtCurrency(totalGeneral)}`, PDF_MARGINS.left, yPos);
  yPos += 6;

  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(
    `${rows.length} expression(s) de besoin — ${new Date().toLocaleDateString('fr-FR')}`,
    PDF_MARGINS.left,
    yPos
  );
  yPos += 4;
  doc.text('Généré par SYGFP', PDF_MARGINS.left, yPos);

  // --- Footers on all pages ---
  const totalPagesActual = doc.getNumberOfPages();
  for (let p = 1; p <= totalPagesActual; p++) {
    doc.setPage(p);
    generatePDFFooter({ doc, pageNumber: p, totalPages: totalPagesActual });
  }

  doc.save(`SYGFP_Expressions_Besoin_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ---------------------------------------------------------------------------
// C) CSV — flat list
// ---------------------------------------------------------------------------

function doExportCSV(rows: ExportRow[], exercice: number): void {
  const columns: ExportColumn[] = [
    { key: 'numero', label: 'Réf', type: 'text' },
    { key: 'objet', label: 'Objet', type: 'text' },
    { key: 'direction_sigle', label: 'Direction', type: 'text' },
    { key: 'nb_articles', label: 'Nb articles', type: 'number' },
    { key: 'montant_estime', label: 'Total FCFA', type: 'currency' },
    { key: 'urgence', label: 'Urgence', format: (v) => URGENCE_LABELS[String(v)] || String(v) },
    { key: 'statut', label: 'Statut', format: (v) => STATUS_LABELS[String(v)] || String(v) },
    { key: 'created_at', label: 'Date', type: 'date' },
  ];

  const data = rows.map((r) => ({
    ...r,
  })) as unknown as Record<string, unknown>[];

  exportToCSV(data, columns, {
    title: 'Expressions de Besoin',
    filename: 'SYGFP_Expressions_Besoin',
    exercice,
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useExpressionsBesoinExport() {
  const { exercice } = useExercice();
  const [isExporting, setIsExporting] = useState(false);

  const exportExcel = useCallback(
    async (filters?: ExportFilters) => {
      if (!exercice) return;
      setIsExporting(true);
      try {
        const rows = await fetchExportData(exercice, filters);
        if (rows.length === 0) {
          toast.warning('Aucune donnée à exporter');
          return;
        }
        doExportExcel(rows, exercice);
        toast.success(`Export Excel : ${rows.length} expression(s)`);
      } catch (err) {
        toast.error('Erreur export Excel : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    [exercice]
  );

  const exportPDF = useCallback(
    async (filters?: ExportFilters) => {
      if (!exercice) return;
      setIsExporting(true);
      try {
        const rows = await fetchExportData(exercice, filters);
        if (rows.length === 0) {
          toast.warning('Aucune donnée à exporter');
          return;
        }
        await doExportPDF(rows, exercice);
        toast.success(`Export PDF : ${rows.length} expression(s)`);
      } catch (err) {
        toast.error('Erreur export PDF : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    [exercice]
  );

  const exportCSV = useCallback(
    async (filters?: ExportFilters) => {
      if (!exercice) return;
      setIsExporting(true);
      try {
        const rows = await fetchExportData(exercice, filters);
        if (rows.length === 0) {
          toast.warning('Aucune donnée à exporter');
          return;
        }
        doExportCSV(rows, exercice);
        toast.success(`Export CSV : ${rows.length} expression(s)`);
      } catch (err) {
        toast.error('Erreur export CSV : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    [exercice]
  );

  return { exportExcel, exportPDF, exportCSV, isExporting };
}
