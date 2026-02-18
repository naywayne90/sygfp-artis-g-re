/**
 * Hook d'export pour les Passations de Marché
 * 4 formats : Excel (4 feuilles), PDF (liste), CSV (flat), PV COJO (PDF dédié)
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
import { PDF_COLORS, PDF_FONTS, PDF_MARGINS, TABLE_STYLES } from '@/lib/pdf/pdfStyles';
import logoArtiUrl from '@/assets/logo-arti.jpg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportFilters {
  statut?: string;
  search?: string;
  type_marche?: string;
  mode_passation?: string;
}

interface MarcheRow {
  id: string;
  numero: string;
  objet: string;
  type_marche: string;
  mode_passation: string;
  montant_estime: number;
  montant_attribue: number | null;
  statut: string;
  exercice: number;
  date_lancement: string | null;
  date_publication: string | null;
  date_cloture: string | null;
  date_attribution: string | null;
  date_signature: string | null;
  created_at: string;
  prestataire_nom: string;
  createur_nom: string;
  expression_besoin_numero: string;
  budget_line_code: string;
}

interface LotRow {
  marche_numero: string;
  numero_lot: number;
  intitule: string;
  montant_estime: number;
  montant_attribue: number | null;
  statut: string;
}

interface SoumissionRow {
  marche_numero: string;
  nom_entreprise: string;
  montant_offre: number;
  statut: string;
  date_soumission: string;
  note_technique: number | null;
  note_financiere: number | null;
  note_globale: number | null;
}

interface EvaluationRow {
  marche_numero: string;
  soumissionnaire: string;
  note_technique: number | null;
  note_financiere: number | null;
  note_finale: number | null;
  qualifie: boolean;
  rang: number | null;
}

interface ExportData {
  marches: MarcheRow[];
  lots: LotRow[];
  soumissions: SoumissionRow[];
  evaluations: EvaluationRow[];
}

// ---------------------------------------------------------------------------
// Shared data fetcher
// ---------------------------------------------------------------------------

async function fetchExportData(exercice: number, filters?: ExportFilters): Promise<ExportData> {
  // 1. Marchés
  let query = supabase
    .from('marches')
    .select(
      `
      id, numero, objet, type_marche, mode_passation,
      montant_estime, montant_attribue, statut, exercice,
      date_lancement, date_publication, date_cloture,
      date_attribution, date_signature, created_at,
      prestataire:prestataires(raison_sociale),
      createur:profiles!marches_created_by_fkey(full_name),
      expression_besoin:expressions_besoin(numero),
      budget_line:budget_lines(code)
    `
    )
    .eq('exercice', exercice)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (filters?.statut) query = query.eq('statut', filters.statut);
  if (filters?.type_marche) query = query.eq('type_marche', filters.type_marche);
  if (filters?.mode_passation) query = query.eq('mode_passation', filters.mode_passation);
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`objet.ilike.${term},numero.ilike.${term}`);
  }

  const { data: marchesRaw, error: marchesErr } = await query;
  if (marchesErr) throw marchesErr;

  const marcheIds = (marchesRaw || []).map((m: Record<string, unknown>) => m.id as string);

  const marches: MarcheRow[] = (marchesRaw || []).map((r: Record<string, unknown>) => {
    const prest = r.prestataire as { raison_sociale: string } | null;
    const crea = r.createur as { full_name: string } | null;
    const eb = r.expression_besoin as { numero: string } | null;
    const bl = r.budget_line as { code: string } | null;

    return {
      id: r.id as string,
      numero: (r.numero as string) || '-',
      objet: (r.objet as string) || '',
      type_marche: (r.type_marche as string) || '-',
      mode_passation: (r.mode_passation as string) || '-',
      montant_estime: (r.montant_estime as number) || 0,
      montant_attribue: (r.montant_attribue as number) || null,
      statut: (r.statut as string) || 'en_preparation',
      exercice: (r.exercice as number) || exercice,
      date_lancement: (r.date_lancement as string) || null,
      date_publication: (r.date_publication as string) || null,
      date_cloture: (r.date_cloture as string) || null,
      date_attribution: (r.date_attribution as string) || null,
      date_signature: (r.date_signature as string) || null,
      created_at: (r.created_at as string) || '',
      prestataire_nom: prest?.raison_sociale || '-',
      createur_nom: crea?.full_name || '-',
      expression_besoin_numero: eb?.numero || '-',
      budget_line_code: bl?.code || '-',
    };
  });

  // 2. Lots
  let lots: LotRow[] = [];
  if (marcheIds.length > 0) {
    const { data: lotsRaw } = await supabase
      .from('marche_lots')
      .select('marche_id, numero_lot, intitule, montant_estime, montant_attribue, statut')
      .in('marche_id', marcheIds)
      .order('numero_lot');

    const idToNumero = new Map(marches.map((m) => [m.id, m.numero]));
    lots = (lotsRaw || []).map((l: Record<string, unknown>) => ({
      marche_numero: idToNumero.get(l.marche_id as string) || '-',
      numero_lot: (l.numero_lot as number) || 0,
      intitule: (l.intitule as string) || '',
      montant_estime: (l.montant_estime as number) || 0,
      montant_attribue: (l.montant_attribue as number) || null,
      statut: (l.statut as string) || '-',
    }));
  }

  // 3. Soumissions
  let soumissions: SoumissionRow[] = [];
  if (marcheIds.length > 0) {
    const { data: soumRaw } = await supabase
      .from('soumissions')
      .select(
        `
        marche_id, nom_entreprise, montant_offre, statut,
        date_soumission, note_technique, note_financiere, note_globale,
        prestataire:prestataires(raison_sociale)
      `
      )
      .in('marche_id', marcheIds)
      .order('date_soumission');

    const idToNumero = new Map(marches.map((m) => [m.id, m.numero]));
    soumissions = (soumRaw || []).map((s: Record<string, unknown>) => {
      const prest = s.prestataire as { raison_sociale: string } | null;
      return {
        marche_numero: idToNumero.get(s.marche_id as string) || '-',
        nom_entreprise: (s.nom_entreprise as string) || prest?.raison_sociale || '-',
        montant_offre: (s.montant_offre as number) || 0,
        statut: (s.statut as string) || '-',
        date_soumission: (s.date_soumission as string) || '',
        note_technique: (s.note_technique as number) || null,
        note_financiere: (s.note_financiere as number) || null,
        note_globale: (s.note_globale as number) || null,
      };
    });
  }

  // 4. Evaluations (via RPC since RLS restricts to DAAF/DG/ADMIN)
  let evaluations: EvaluationRow[] = [];
  if (marcheIds.length > 0) {
    const { data: evalRaw } = await supabase
      .from('evaluations_offre')
      .select(
        `
        marche_id, soumission_id, note_technique, note_financiere,
        note_finale, qualifie_techniquement, rang,
        soumission:soumissions(nom_entreprise, prestataire:prestataires(raison_sociale))
      `
      )
      .in('marche_id', marcheIds)
      .order('rang', { ascending: true, nullsFirst: false });

    const idToNumero = new Map(marches.map((m) => [m.id, m.numero]));
    evaluations = (evalRaw || []).map((e: Record<string, unknown>) => {
      const soum = e.soumission as {
        nom_entreprise: string;
        prestataire: { raison_sociale: string } | null;
      } | null;
      return {
        marche_numero: idToNumero.get(e.marche_id as string) || '-',
        soumissionnaire: soum?.nom_entreprise || soum?.prestataire?.raison_sociale || '-',
        note_technique: (e.note_technique as number) || null,
        note_financiere: (e.note_financiere as number) || null,
        note_finale: (e.note_finale as number) || null,
        qualifie: (e.qualifie_techniquement as boolean) || false,
        rang: (e.rang as number) || null,
      };
    });
  }

  return { marches, lots, soumissions, evaluations };
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

const STATUT_LABELS: Record<string, string> = {
  en_preparation: 'En préparation',
  publie: 'Publié',
  cloture: 'Clôturé',
  en_evaluation: 'En évaluation',
  attribue: 'Attribué',
  approuve: 'Approuvé',
  rejete: 'Rejeté',
  signe: 'Signé',
  annule: 'Annulé',
  en_cours: 'En cours',
};

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

function fmtNote(n: number | null): string {
  if (n == null) return '-';
  return Number(n).toFixed(2);
}

// ---------------------------------------------------------------------------
// A) Excel — 4 feuilles
// ---------------------------------------------------------------------------

function doExportExcel(data: ExportData, exercice: number): void {
  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // --- Feuille 1 : Marchés ---
  const headerRows = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Passation de Marchés'],
    [`Exercice: ${exercice}`],
    [`Généré le: ${dateStr} à ${timeStr}`],
    [],
  ];

  const colHeaders1 = [
    'N° Marché',
    'Objet',
    'Type',
    'Mode passation',
    'Montant estimé',
    'Montant attribué',
    'Statut',
    'Prestataire',
    'Ligne budgétaire',
    'Expr. besoin',
    'Date publication',
    'Date clôture',
    'Date attribution',
  ];

  const rows1 = data.marches.map((m) => [
    m.numero,
    m.objet,
    m.type_marche,
    m.mode_passation,
    m.montant_estime,
    m.montant_attribue || '',
    STATUT_LABELS[m.statut] || m.statut,
    m.prestataire_nom,
    m.budget_line_code,
    m.expression_besoin_numero,
    fmtDate(m.date_publication),
    fmtDate(m.date_cloture),
    fmtDate(m.date_attribution),
  ]);

  const totalEstime = data.marches.reduce((s, m) => s + m.montant_estime, 0);
  const totalAttrib = data.marches.reduce((s, m) => s + (m.montant_attribue || 0), 0);
  rows1.push(['TOTAL', '', '', '', totalEstime, totalAttrib, '', '', '', '', '', '', '']);

  const ws1 = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.sheet_add_aoa(ws1, [colHeaders1], { origin: `A${headerRows.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws1, rows1, { origin: `A${headerRows.length + 2}` });
  ws1['!cols'] = [
    { wch: 18 },
    { wch: 40 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 30 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Marchés');

  // --- Feuille 2 : Lots ---
  if (data.lots.length > 0) {
    const colHeaders2 = [
      'N° Marché',
      'N° Lot',
      'Intitulé',
      'Montant estimé',
      'Montant attribué',
      'Statut',
    ];
    const rows2 = data.lots.map((l) => [
      l.marche_numero,
      l.numero_lot,
      l.intitule,
      l.montant_estime,
      l.montant_attribue || '',
      l.statut,
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet([colHeaders2]);
    XLSX.utils.sheet_add_aoa(ws2, rows2, { origin: 'A2' });
    ws2['!cols'] = [{ wch: 18 }, { wch: 8 }, { wch: 40 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Lots');
  }

  // --- Feuille 3 : Soumissions ---
  if (data.soumissions.length > 0) {
    const colHeaders3 = [
      'N° Marché',
      'Entreprise',
      'Montant offre',
      'Statut',
      'Date soumission',
      'Note tech.',
      'Note fin.',
      'Note globale',
    ];
    const rows3 = data.soumissions.map((s) => [
      s.marche_numero,
      s.nom_entreprise,
      s.montant_offre,
      s.statut,
      fmtDate(s.date_soumission),
      fmtNote(s.note_technique),
      fmtNote(s.note_financiere),
      fmtNote(s.note_globale),
    ]);

    const ws3 = XLSX.utils.aoa_to_sheet([colHeaders3]);
    XLSX.utils.sheet_add_aoa(ws3, rows3, { origin: 'A2' });
    ws3['!cols'] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Soumissions');
  }

  // --- Feuille 4 : Évaluations ---
  if (data.evaluations.length > 0) {
    const colHeaders4 = [
      'N° Marché',
      'Soumissionnaire',
      'Note tech.',
      'Note fin.',
      'Note finale',
      'Qualifié',
      'Rang',
    ];
    const rows4 = data.evaluations.map((e) => [
      e.marche_numero,
      e.soumissionnaire,
      fmtNote(e.note_technique),
      fmtNote(e.note_financiere),
      fmtNote(e.note_finale),
      e.qualifie ? 'Oui' : 'Non',
      e.rang || '-',
    ]);

    const ws4 = XLSX.utils.aoa_to_sheet([colHeaders4]);
    XLSX.utils.sheet_add_aoa(ws4, rows4, { origin: 'A2' });
    ws4['!cols'] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(wb, ws4, 'Évaluations');
  }

  // Download
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Marches_${exercice}_${now.toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// B) PDF — liste marchés
// ---------------------------------------------------------------------------

async function doExportPDF(data: ExportData, exercice: number): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  let logoDataUrl: string | undefined;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoArtiUrl);
  } catch {
    // continue without logo
  }

  const { endY } = generatePDFHeader({ doc, logoDataUrl });

  doc.setFontSize(PDF_FONTS.size.title);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
  doc.setTextColor(...PDF_COLORS.primary);
  // A4 landscape width = 297mm
  doc.text(`Passation de Marchés — Exercice ${exercice}`, 297 / 2, endY, {
    align: 'center',
  });

  const yStart = endY + 8;

  // Summary bar
  const totalEstime = data.marches.reduce((s, m) => s + m.montant_estime, 0);
  doc.setFontSize(PDF_FONTS.size.small);
  doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(
    `${data.marches.length} marché(s) — Total estimé: ${fmtCurrency(totalEstime)}`,
    PDF_MARGINS.left,
    yStart
  );

  // Main table
  const tableData = data.marches.map((m) => [
    m.numero,
    m.objet.length > 50 ? m.objet.slice(0, 47) + '...' : m.objet,
    m.type_marche,
    m.mode_passation,
    fmtCurrency(m.montant_estime),
    STATUT_LABELS[m.statut] || m.statut,
    m.prestataire_nom !== '-' ? m.prestataire_nom : '',
    fmtDate(m.date_publication),
  ]);

  autoTable(doc, {
    startY: yStart + 4,
    head: [
      ['N° Marché', 'Objet', 'Type', 'Mode', 'Montant est.', 'Statut', 'Prestataire', 'Date pub.'],
    ],
    body: tableData,
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
      0: { cellWidth: 28 },
      1: { cellWidth: 55 },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
      4: { halign: 'right', cellWidth: 30 },
      5: { cellWidth: 24 },
      6: { cellWidth: 45 },
      7: { cellWidth: 22 },
    },
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
  });

  // Footers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    generatePDFFooter({ doc, pageNumber: p, totalPages });
  }

  doc.save(`SYGFP_Marches_${exercice}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ---------------------------------------------------------------------------
// C) CSV — flat list
// ---------------------------------------------------------------------------

function doExportCSV(data: ExportData, exercice: number): void {
  const columns: ExportColumn[] = [
    { key: 'numero', label: 'N° Marché', type: 'text', width: 18 },
    { key: 'objet', label: 'Objet', type: 'text', width: 40 },
    { key: 'type_marche', label: 'Type', type: 'text', width: 14 },
    { key: 'mode_passation', label: 'Mode passation', type: 'text', width: 18 },
    { key: 'montant_estime', label: 'Montant estimé', type: 'currency', width: 16 },
    { key: 'montant_attribue', label: 'Montant attribué', type: 'currency', width: 16 },
    { key: 'statut', label: 'Statut', format: (v) => STATUT_LABELS[String(v)] || String(v) },
    { key: 'prestataire_nom', label: 'Prestataire', type: 'text', width: 30 },
    { key: 'budget_line_code', label: 'Ligne budgétaire', type: 'text', width: 20 },
    { key: 'date_publication', label: 'Date publication', type: 'date', width: 14 },
    { key: 'date_cloture', label: 'Date clôture', type: 'date', width: 14 },
    { key: 'date_attribution', label: 'Date attribution', type: 'date', width: 14 },
  ];

  exportToCSV(data.marches as unknown as Record<string, unknown>[], columns, {
    title: 'Passation de Marchés',
    filename: 'SYGFP_Marches',
    exercice,
  });
}

// ---------------------------------------------------------------------------
// D) PV COJO — PDF via edge function
// ---------------------------------------------------------------------------

async function doExportPVCOJO(marcheId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('Non authentifié');

  const response = await supabase.functions.invoke('generate-export', {
    body: {
      type: 'pdf',
      entity_type: 'pv_cojo',
      entity_id: marcheId,
      exercice: new Date().getFullYear(),
    },
  });

  if (response.error) throw response.error;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(response.data);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePassationMarcheExport() {
  const { exercice } = useExercice();
  const [isExporting, setIsExporting] = useState(false);

  const exportExcel = useCallback(
    async (filters?: ExportFilters) => {
      if (!exercice) return;
      setIsExporting(true);
      try {
        const data = await fetchExportData(exercice, filters);
        if (data.marches.length === 0) {
          toast.warning('Aucun marché à exporter');
          return;
        }
        doExportExcel(data, exercice);
        toast.success(
          `Export Excel : ${data.marches.length} marché(s), ${data.lots.length} lot(s), ${data.soumissions.length} soumission(s)`
        );
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
        const data = await fetchExportData(exercice, filters);
        if (data.marches.length === 0) {
          toast.warning('Aucun marché à exporter');
          return;
        }
        await doExportPDF(data, exercice);
        toast.success(`Export PDF : ${data.marches.length} marché(s)`);
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
        const data = await fetchExportData(exercice, filters);
        if (data.marches.length === 0) {
          toast.warning('Aucun marché à exporter');
          return;
        }
        doExportCSV(data, exercice);
        toast.success(`Export CSV : ${data.marches.length} marché(s)`);
      } catch (err) {
        toast.error('Erreur export CSV : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    [exercice]
  );

  const exportPVCOJO = useCallback(async (marcheId: string) => {
    setIsExporting(true);
    try {
      await doExportPVCOJO(marcheId);
      toast.success('PV COJO généré');
    } catch (err) {
      toast.error('Erreur PV COJO : ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  }, []);

  const printMarche = useCallback(
    async (marcheId: string) => {
      setIsExporting(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) throw new Error('Non authentifié');

        const response = await supabase.functions.invoke('generate-export', {
          body: {
            type: 'pdf',
            entity_type: 'marche',
            entity_id: marcheId,
            exercice: exercice || new Date().getFullYear(),
          },
        });

        if (response.error) throw response.error;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(response.data);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 500);
        }
        toast.success('Fiche marché générée');
      } catch (err) {
        toast.error('Erreur impression : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    [exercice]
  );

  return { exportExcel, exportPDF, exportCSV, exportPVCOJO, printMarche, isExporting };
}
