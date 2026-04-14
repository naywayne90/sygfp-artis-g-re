/**
 * Hook d'export pour les Contrats
 * - Excel (1 feuille : Liste des contrats)
 * - PDF (tableau paysage)
 * - CSV
 * Pattern : identique à useEngagementExport.ts
 */

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { generatePDFHeader, loadImageAsDataUrl } from '@/lib/pdf/pdfHeader';
import { generatePDFFooter } from '@/lib/pdf/pdfFooter';
import { PDF_COLORS, PDF_FONTS, PDF_MARGINS } from '@/lib/pdf/pdfStyles';
import logoArtiUrl from '@/assets/logo-arti.jpg';
import type { Contrat } from '@/hooks/useContrats';
import { STATUTS_CONTRAT } from '@/hooks/useContrats';
import { formatCurrency } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
}

function statutLabel(statut: string): string {
  return STATUTS_CONTRAT.find((s) => s.value === statut)?.label || statut;
}

// ---------------------------------------------------------------------------
// A) Excel
// ---------------------------------------------------------------------------

function doExportExcel(
  contrats: Contrat[],
  exercice?: number,
  getPrestataireName?: (id: string) => string
): void {
  if (contrats.length === 0) {
    toast.warning('Aucune donnée à exporter');
    return;
  }

  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const headerRows = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Liste des Contrats'],
    [`Exercice: ${exercice || ''}`],
    [`Généré le: ${dateStr} à ${timeStr}`],
    [],
  ];

  const colHeaders = [
    'Numéro',
    'Objet',
    'Type',
    'Prestataire',
    'Montant initial (FCFA)',
    'Montant actuel (FCFA)',
    'Date signature',
    'Date début',
    'Date fin',
    'Délai (jours)',
    'Statut',
  ];

  const getName = getPrestataireName || ((id: string) => id);

  const rows = contrats.map((c) => [
    c.numero,
    c.objet,
    c.type_contrat,
    c.prestataire?.raison_sociale || getName(c.prestataire_id),
    c.montant_initial,
    c.montant_actuel || c.montant_initial,
    fmtDate(c.date_signature),
    fmtDate(c.date_debut),
    fmtDate(c.date_fin),
    c.delai_execution || '',
    statutLabel(c.statut),
  ]);

  // Ligne total
  const totalInitial = contrats.reduce((sum, c) => sum + c.montant_initial, 0);
  const totalActuel = contrats.reduce((sum, c) => sum + (c.montant_actuel || c.montant_initial), 0);
  rows.push([
    'TOTAL',
    `${contrats.length} contrat(s)`,
    '',
    '',
    totalInitial,
    totalActuel,
    '',
    '',
    '',
    '',
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.sheet_add_aoa(ws, [colHeaders], { origin: `A${headerRows.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws, rows, { origin: `A${headerRows.length + 2}` });
  ws['!cols'] = [
    { wch: 20 },
    { wch: 40 },
    { wch: 22 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Contrats');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Contrats_${exercice || ''}_${now.toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// B) CSV
// ---------------------------------------------------------------------------

function doExportCSV(
  contrats: Contrat[],
  exercice?: number,
  getPrestataireName?: (id: string) => string
): void {
  if (contrats.length === 0) {
    toast.warning('Aucune donnée à exporter');
    return;
  }

  const getName = getPrestataireName || ((id: string) => id);

  const headers = [
    'Numéro',
    'Objet',
    'Type',
    'Prestataire',
    'Montant initial',
    'Montant actuel',
    'Date signature',
    'Date début',
    'Date fin',
    'Délai (jours)',
    'Statut',
  ];

  const csvRows = contrats.map((c) =>
    [
      c.numero,
      `"${c.objet.replace(/"/g, '""')}"`,
      c.type_contrat,
      `"${(c.prestataire?.raison_sociale || getName(c.prestataire_id)).replace(/"/g, '""')}"`,
      c.montant_initial,
      c.montant_actuel || c.montant_initial,
      fmtDate(c.date_signature),
      fmtDate(c.date_debut),
      fmtDate(c.date_fin),
      c.delai_execution || '',
      statutLabel(c.statut),
    ].join(';')
  );

  const csvContent = [headers.join(';'), ...csvRows].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Contrats_${exercice || ''}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// C) PDF
// ---------------------------------------------------------------------------

async function doExportPDF(
  contrats: Contrat[],
  exercice?: number,
  getPrestataireName?: (id: string) => string
): Promise<void> {
  if (contrats.length === 0) {
    toast.warning('Aucune donnée à exporter');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = 297;
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const getName = getPrestataireName || ((id: string) => id);

  let logoDataUrl: string | undefined;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArtiUrl);
  } catch {
    // continue without logo
  }

  // Header
  const startY = generatePDFHeader(doc, {
    title: 'Liste des Contrats',
    subtitle: `Exercice ${exercice || ''}`,
    dateStr: `${dateStr} à ${timeStr}`,
    logoDataUrl,
    pageWidth,
  });

  // Résumé
  const totalMontant = contrats.reduce((s, c) => s + (c.montant_actuel || c.montant_initial), 0);
  doc.setFont(PDF_FONTS.body, 'normal');
  doc.setFontSize(9);
  doc.text(
    `${contrats.length} contrat(s) — Montant total : ${formatCurrency(totalMontant)}`,
    PDF_MARGINS.left,
    startY + 2
  );

  // Table
  const tableData = contrats.map((c) => [
    c.numero,
    c.objet.length > 45 ? c.objet.slice(0, 42) + '...' : c.objet,
    c.type_contrat,
    (c.prestataire?.raison_sociale || getName(c.prestataire_id)).slice(0, 25),
    formatCurrency(c.montant_actuel || c.montant_initial),
    fmtDate(c.date_signature),
    fmtDate(c.date_fin),
    statutLabel(c.statut),
  ]);

  autoTable(doc, {
    startY: startY + 6,
    head: [
      ['Numéro', 'Objet', 'Type', 'Prestataire', 'Montant', 'Signature', 'Échéance', 'Statut'],
    ],
    body: tableData,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      font: PDF_FONTS.body,
    },
    headStyles: {
      fillColor: PDF_COLORS.headerBg as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    didDrawPage: (data: { pageNumber: number }) => {
      generatePDFFooter(doc, data.pageNumber, pageWidth);
    },
  });

  doc.save(`SYGFP_Contrats_${exercice || ''}_${now.toISOString().split('T')[0]}.pdf`);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useContratExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportExcel = useCallback(
    (contrats: Contrat[], exercice?: number, getPrestataireName?: (id: string) => string) => {
      setIsExporting(true);
      try {
        doExportExcel(contrats, exercice, getPrestataireName);
        toast.success('Export Excel généré');
      } catch (err) {
        toast.error('Erreur export Excel');
        console.error(err);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportCSV = useCallback(
    (contrats: Contrat[], exercice?: number, getPrestataireName?: (id: string) => string) => {
      setIsExporting(true);
      try {
        doExportCSV(contrats, exercice, getPrestataireName);
        toast.success('Export CSV généré');
      } catch (err) {
        toast.error('Erreur export CSV');
        console.error(err);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportPDF = useCallback(
    async (contrats: Contrat[], exercice?: number, getPrestataireName?: (id: string) => string) => {
      setIsExporting(true);
      try {
        await doExportPDF(contrats, exercice, getPrestataireName);
        toast.success('Export PDF généré');
      } catch (err) {
        toast.error('Erreur export PDF');
        console.error(err);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return { exportExcel, exportCSV, exportPDF, isExporting };
}
