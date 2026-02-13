/**
 * Hook pour l'export des Notes AEF (Excel, PDF, CSV)
 * Gère les filtres, permissions, budget et pagination pour export complet
 * - Excel : SYGFP_Notes_AEF_YYYY-MM-DD.xlsx
 * - PDF   : SYGFP_Notes_AEF_YYYY-MM-DD.pdf (en-tête ARTI, QR, section budget)
 * - CSV   : SYGFP_Notes_AEF_YYYY-MM-DD.csv
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { generatePDFHeader } from '@/lib/pdf/pdfHeader';
import { generatePDFFooter } from '@/lib/pdf/pdfFooter';
import {
  PDF_COLORS,
  PDF_FONTS,
  PDF_MARGINS,
  PDF_DIMENSIONS,
  TABLE_STYLES,
} from '@/lib/pdf/pdfStyles';
import { getArtiLogoDataUrl } from '@/lib/export/export-branding';
import { generateVerifyUrl } from '@/lib/qrcode-utils';
import type { QRCodeData } from '@/lib/qrcode-utils';

const MAX_EXPORT_ROWS = 10000;

export interface ExportFilters {
  statut?: string | string[];
  search?: string;
  directionId?: string;
  urgence?: string;
  dateFrom?: string;
  dateTo?: string;
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  a_valider: 'À valider',
  valide: 'Validé',
  a_imputer: 'À imputer',
  impute: 'Imputé',
  rejete: 'Rejeté',
  differe: 'Différé',
};

const PRIORITE_LABELS: Record<string, string> = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

// Mapping des onglets vers filtres de statut
const TAB_STATUT_FILTERS: Record<string, string | string[] | undefined> = {
  toutes: undefined,
  a_valider: ['soumis', 'a_valider'],
  a_imputer: 'a_imputer',
  imputees: 'impute',
  differees: 'differe',
  rejetees: 'rejete',
};

// Type explicite pour éviter "Type instantiation is excessively deep"
interface ExportNoteAEF {
  id: string;
  numero: string | null;
  reference_pivot: string | null;
  exercice: number | null;
  statut: string;
  objet: string | null;
  priorite: string | null;
  montant_estime: number | null;
  is_direct_aef: boolean | null;
  created_at: string | null;
  submitted_at: string | null;
  validated_at: string | null;
  budget_line_id: string | null;
  note_sef_id: string | null;
  direction: { id: string; label: string; sigle: string } | null;
  note_sef: { id: string; numero: string; reference_pivot: string | null } | null;
  budget_line: {
    id: string;
    code: string;
    label: string;
    dotation_initiale?: number;
    dotation_modifiee?: number;
  } | null;
  created_by_profile: { id: string; first_name: string | null; last_name: string | null } | null;
  validated_by_profile: { id: string; first_name: string | null; last_name: string | null } | null;
}

interface BudgetAvailability {
  budgetLineId: string;
  dotation: number;
  engaged: number;
  disponible: number;
}

/**
 * Formate un montant en FCFA avec séparateurs de milliers
 */
function formatMontantFCFA(montant: number | null | undefined): string {
  if (montant == null) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
}

/**
 * Récupère les disponibilités budgétaires pour un ensemble de lignes
 */
async function fetchBudgetAvailabilityBatch(
  budgetLineIds: string[],
  exercice: number
): Promise<Map<string, BudgetAvailability>> {
  const result = new Map<string, BudgetAvailability>();
  if (budgetLineIds.length === 0) return result;

  // 1. Fetch budget lines (dotation)
  const { data: budgetLines } = await supabase
    .from('budget_lines')
    .select('id, dotation_initiale, dotation_modifiee')
    .in('id', budgetLineIds);

  // 2. Fetch engaged amounts: SUM(montant_estime) grouped by budget_line_id
  //    for notes with statut IN ('impute', 'a_imputer', 'valide', 'a_valider')
  const { data: engagedData } = await supabase
    .from('notes_dg')
    .select('budget_line_id, montant_estime')
    .eq('exercice', exercice)
    .in('budget_line_id', budgetLineIds)
    .in('statut', ['impute', 'a_imputer', 'valide', 'a_valider']);

  // Group engaged amounts
  const engagedMap = new Map<string, number>();
  (engagedData || []).forEach(
    (n: { budget_line_id: string | null; montant_estime: number | null }) => {
      if (!n.budget_line_id) return;
      engagedMap.set(
        n.budget_line_id,
        (engagedMap.get(n.budget_line_id) || 0) + (n.montant_estime || 0)
      );
    }
  );

  // 3. Calculate availability
  (budgetLines || []).forEach(
    (bl: { id: string; dotation_initiale: number | null; dotation_modifiee: number | null }) => {
      const dotation = Math.max(bl.dotation_modifiee || 0, bl.dotation_initiale || 0);
      const engaged = engagedMap.get(bl.id) || 0;
      const disponible = dotation - engaged;
      result.set(bl.id, { budgetLineId: bl.id, dotation, engaged, disponible });
    }
  );

  return result;
}

/**
 * Récupère les notes pour export avec relations bulk
 */
async function fetchExportNotes(
  exercice: number,
  isDG: boolean,
  filters: ExportFilters,
  tabLabel: string,
  setProgress: (msg: string) => void
): Promise<{ notes: ExportNoteAEF[]; budgetMap: Map<string, BudgetAvailability> }> {
  // 1. Get user and permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  let userDirectionId: string | null = null;
  if (!isDG) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('direction_id')
      .eq('id', user.id)
      .single();
    userDirectionId = profile?.direction_id || null;
  }

  // 2. Build query
  let query = supabase
    .from('notes_dg')
    .select('*')
    .eq('exercice', exercice)
    .order('created_at', { ascending: false })
    .limit(MAX_EXPORT_ROWS);

  const statutFilter = filters.statut ?? TAB_STATUT_FILTERS[tabLabel];
  if (statutFilter) {
    if (Array.isArray(statutFilter)) {
      query = query.in('statut', statutFilter);
    } else {
      query = query.eq('statut', statutFilter);
    }
  }

  if (!isDG && userDirectionId) {
    query = query.eq('direction_id', userDirectionId);
  } else if (filters.directionId) {
    query = query.eq('direction_id', filters.directionId);
  }

  if (filters.search?.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    query = query.or(
      `reference_pivot.ilike.${searchTerm},numero.ilike.${searchTerm},objet.ilike.${searchTerm}`
    );
  }

  if (filters.urgence) {
    query = query.eq('priorite', filters.urgence);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
  }

  setProgress('Chargement des notes...');
  const { data: rawNotes, error } = await query;
  if (error) throw error;

  if (!rawNotes || rawNotes.length === 0) {
    return { notes: [], budgetMap: new Map() };
  }

  if (rawNotes.length >= MAX_EXPORT_ROWS) {
    toast.warning(`Export limité à ${MAX_EXPORT_ROWS} lignes. Affinez vos filtres.`);
  }

  // 3. Fetch related data in bulk
  setProgress('Chargement des données liées...');
  const directionIds = [
    ...new Set(rawNotes.map((n) => n.direction_id).filter(Boolean)),
  ] as string[];
  const sefIds = [...new Set(rawNotes.map((n) => n.note_sef_id).filter(Boolean))] as string[];
  const blIds = [...new Set(rawNotes.map((n) => n.budget_line_id).filter(Boolean))] as string[];
  const profileIds = [
    ...new Set(rawNotes.flatMap((n) => [n.created_by, n.validated_by].filter(Boolean))),
  ] as string[];

  const [dirRes, sefRes, blRes, profRes, budgetMap] = await Promise.all([
    directionIds.length > 0
      ? supabase.from('directions').select('id, label, sigle').in('id', directionIds)
      : { data: [] as { id: string; label: string; sigle: string }[] },
    sefIds.length > 0
      ? supabase.from('notes_sef').select('id, numero, reference_pivot').in('id', sefIds)
      : { data: [] as { id: string; numero: string; reference_pivot: string | null }[] },
    blIds.length > 0
      ? supabase
          .from('budget_lines')
          .select('id, code, label, dotation_initiale, dotation_modifiee')
          .in('id', blIds)
      : {
          data: [] as {
            id: string;
            code: string;
            label: string;
            dotation_initiale?: number;
            dotation_modifiee?: number;
          }[],
        },
    profileIds.length > 0
      ? supabase.from('profiles').select('id, first_name, last_name').in('id', profileIds)
      : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] },
    fetchBudgetAvailabilityBatch(blIds, exercice),
  ]);

  const dirMap = new Map((dirRes.data || []).map((d) => [d.id, d]));
  const sefMap = new Map((sefRes.data || []).map((s) => [s.id, s]));
  const blMap = new Map((blRes.data || []).map((b) => [b.id, b]));
  const profMap = new Map((profRes.data || []).map((p) => [p.id, p]));

  const notes: ExportNoteAEF[] = rawNotes.map((n) => ({
    ...n,
    direction: n.direction_id ? (dirMap.get(n.direction_id) ?? null) : null,
    note_sef: n.note_sef_id ? (sefMap.get(n.note_sef_id) ?? null) : null,
    budget_line: n.budget_line_id ? (blMap.get(n.budget_line_id) ?? null) : null,
    created_by_profile: n.created_by ? (profMap.get(n.created_by) ?? null) : null,
    validated_by_profile: n.validated_by ? (profMap.get(n.validated_by) ?? null) : null,
  }));

  return { notes, budgetMap };
}

/**
 * Transform une note en ligne de données pour export
 */
function noteToExportRow(
  note: ExportNoteAEF,
  budgetMap: Map<string, BudgetAvailability>
): Record<string, string> {
  const ref = note.reference_pivot || note.numero || '';
  const objet = note.objet || '';
  const direction = note.direction?.sigle || note.direction?.label || '';
  const demandeur = note.created_by_profile
    ? `${note.created_by_profile.first_name || ''} ${note.created_by_profile.last_name || ''}`.trim()
    : '';
  const urgence = PRIORITE_LABELS[note.priorite || ''] || note.priorite || '';
  const montant = formatMontantFCFA(note.montant_estime);
  const ligneBudget = note.budget_line?.code || '';
  const budget = note.budget_line_id ? budgetMap.get(note.budget_line_id) : undefined;
  const disponible = budget ? formatMontantFCFA(budget.disponible) : '';
  const nsefOrigine =
    note.note_sef?.reference_pivot ||
    note.note_sef?.numero ||
    (note.is_direct_aef ? 'AEF Directe' : '');
  const statut = STATUT_LABELS[note.statut] || note.statut || '';
  const validePar = note.validated_by_profile
    ? `${note.validated_by_profile.first_name || ''} ${note.validated_by_profile.last_name || ''}`.trim()
    : '';
  const dateValidation = note.validated_at ? format(new Date(note.validated_at), 'dd/MM/yyyy') : '';
  const creeLe = note.created_at ? format(new Date(note.created_at), 'dd/MM/yyyy') : '';

  return {
    Réf: ref,
    Objet: objet,
    Direction: direction,
    Demandeur: demandeur,
    Urgence: urgence,
    'Montant (FCFA)': montant,
    'Ligne budget': ligneBudget,
    'Disponible (FCFA)': disponible,
    'NSEF origine': nsefOrigine,
    Statut: statut,
    'Validé par': validePar,
    'Date validation': dateValidation,
    'Créée le': creeLe,
  };
}

/**
 * Download helper
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Génère un canvas QR Code et retourne son data URL
 */
async function generateQRCodeDataUrl(data: string, size: number = 100): Promise<string> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
      createElement(QRCodeCanvas, {
        value: data,
        size: size,
        level: 'H',
        includeMargin: true,
      })
    );

    // Wait for render
    setTimeout(() => {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve('');
      }
      root.unmount();
      document.body.removeChild(container);
    }, 100);
  });
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useNotesAEFExport() {
  const { exercice } = useExercice();
  const { hasAnyRole } = usePermissions();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  const isDG = hasAnyRole(['ADMIN', 'DG']);

  // ──────────────────────────────────────────────────────────────────────────
  // EXPORT EXCEL
  // ──────────────────────────────────────────────────────────────────────────

  const exportNotesAEF = useCallback(
    async (filters: ExportFilters = {}, tabLabel: string = 'toutes') => {
      if (!exercice) {
        toast.error('Exercice non sélectionné');
        return;
      }

      setIsExporting(true);
      setExportProgress('Récupération des données...');

      try {
        const { notes, budgetMap } = await fetchExportNotes(
          exercice,
          isDG,
          filters,
          tabLabel,
          setExportProgress
        );

        const dateStr = format(new Date(), 'yyyy-MM-dd');
        const fileName = `SYGFP_Notes_AEF_${dateStr}.xlsx`;

        const HEADERS = [
          'Réf',
          'Objet',
          'Direction',
          'Demandeur',
          'Urgence',
          'Montant (FCFA)',
          'Ligne budget',
          'Disponible (FCFA)',
          'NSEF origine',
          'Statut',
          'Validé par',
          'Date validation',
          'Créée le',
        ];

        if (notes.length === 0) {
          const worksheet = XLSX.utils.aoa_to_sheet([HEADERS]);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes AEF');
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          downloadBlob(
            new Blob([excelBuffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }),
            fileName
          );
          toast.info('Fichier exporté avec en-têtes uniquement (aucune note)');
          return;
        }

        setExportProgress('Préparation du fichier Excel...');
        const exportData = notes.map((note) => noteToExportRow(note, budgetMap));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet['!cols'] = [
          { wch: 20 }, // Réf
          { wch: 35 }, // Objet
          { wch: 12 }, // Direction
          { wch: 22 }, // Demandeur
          { wch: 10 }, // Urgence
          { wch: 16 }, // Montant
          { wch: 15 }, // Ligne budget
          { wch: 16 }, // Disponible
          { wch: 20 }, // NSEF origine
          { wch: 12 }, // Statut
          { wch: 22 }, // Validé par
          { wch: 14 }, // Date validation
          { wch: 14 }, // Créée le
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes AEF');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        downloadBlob(
          new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
          fileName
        );

        toast.success(`${notes.length} note(s) exportée(s) en Excel`);
      } catch (error: unknown) {
        console.error('Export Excel AEF error:', error);
        toast.error(
          "Erreur lors de l'export Excel: " +
            (error instanceof Error ? error.message : 'Erreur inconnue')
        );
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [exercice, isDG]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // EXPORT CSV
  // ──────────────────────────────────────────────────────────────────────────

  const exportNotesAEFCSV = useCallback(
    async (filters: ExportFilters = {}, tabLabel: string = 'toutes') => {
      if (!exercice) {
        toast.error('Exercice non sélectionné');
        return;
      }

      setIsExporting(true);
      setExportProgress('Récupération des données...');

      try {
        const { notes, budgetMap } = await fetchExportNotes(
          exercice,
          isDG,
          filters,
          tabLabel,
          setExportProgress
        );

        const dateStr = format(new Date(), 'yyyy-MM-dd');
        const fileName = `SYGFP_Notes_AEF_${dateStr}.csv`;

        const HEADERS = [
          'Réf',
          'Objet',
          'Direction',
          'Demandeur',
          'Urgence',
          'Montant (FCFA)',
          'Ligne budget',
          'Disponible (FCFA)',
          'NSEF origine',
          'Statut',
          'Validé par',
          'Date validation',
          'Créée le',
        ];

        setExportProgress('Préparation du fichier CSV...');

        // Escape CSV fields
        const escapeCSV = (val: string): string => {
          if (val.includes('"') || val.includes(';') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        };

        const lines: string[] = [HEADERS.map(escapeCSV).join(';')];
        for (const note of notes) {
          const row = noteToExportRow(note, budgetMap);
          lines.push(Object.values(row).map(escapeCSV).join(';'));
        }

        const csvContent = '\uFEFF' + lines.join('\n'); // BOM for Excel compatibility
        downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }), fileName);

        toast.success(`${notes.length} note(s) exportée(s) en CSV`);
      } catch (error: unknown) {
        console.error('Export CSV AEF error:', error);
        toast.error(
          "Erreur lors de l'export CSV: " +
            (error instanceof Error ? error.message : 'Erreur inconnue')
        );
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [exercice, isDG]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // EXPORT PDF
  // ──────────────────────────────────────────────────────────────────────────

  const exportNotesAEFPDF = useCallback(
    async (filters: ExportFilters = {}, tabLabel: string = 'toutes') => {
      if (!exercice) {
        toast.error('Exercice non sélectionné');
        return;
      }

      setIsExporting(true);
      setExportProgress('Récupération des données...');

      try {
        const { notes, budgetMap } = await fetchExportNotes(
          exercice,
          isDG,
          filters,
          tabLabel,
          setExportProgress
        );

        if (notes.length === 0) {
          toast.info('Aucune note à exporter en PDF');
          return;
        }

        setExportProgress('Génération du PDF...');

        // Load logo
        let logoDataUrl: string | undefined;
        try {
          logoDataUrl = await getArtiLogoDataUrl();
        } catch {
          console.warn('Logo ARTI non disponible pour le PDF');
        }

        // Generate QR code data URL for the document
        let qrCodeDataUrl: string | undefined;
        try {
          const qrData: QRCodeData = {
            reference: `EXPORT-AEF-${exercice}-${format(new Date(), 'yyyyMMdd-HHmmss')}`,
            type: 'NOTE_AEF',
            dateValidation: new Date().toISOString(),
            validateur: 'SYGFP',
          };
          const { url: verifyUrl } = await generateVerifyUrl(qrData);
          qrCodeDataUrl = await generateQRCodeDataUrl(verifyUrl, 150);
        } catch {
          console.warn('QR code non disponible pour le PDF');
        }

        // Create PDF (landscape for table with many columns)
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = 297; // A4 landscape

        // ── HEADER ──
        const { endY: headerEndY } = generatePDFHeader({
          doc,
          logoDataUrl,
          qrCodeDataUrl,
          startY: PDF_MARGINS.top,
        });

        // ── TITLE ──
        let yPos = headerEndY;
        const centerX = pageWidth / 2;

        doc.setFontSize(PDF_FONTS.size.title);
        doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
        doc.setTextColor(...PDF_COLORS.primary);
        doc.text('Liste des Notes AEF', centerX, yPos, { align: 'center' });
        yPos += 6;

        // Subtitle with exercice + filters
        doc.setFontSize(PDF_FONTS.size.small);
        doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
        doc.setTextColor(...PDF_COLORS.secondary);
        const tabLabelsMap: Record<string, string> = {
          toutes: 'Toutes',
          a_valider: 'À valider',
          a_imputer: 'À imputer',
          imputees: 'Imputées',
          differees: 'Différées',
          rejetees: 'Rejetées',
        };
        doc.text(
          `Exercice ${exercice} | Onglet: ${tabLabelsMap[tabLabel] || tabLabel} | ${notes.length} note(s)`,
          centerX,
          yPos,
          { align: 'center' }
        );
        yPos += 8;

        // ── BUDGET SUMMARY SECTION ──
        const uniqueBudgetLines = [...budgetMap.values()];
        if (uniqueBudgetLines.length > 0) {
          const totalDotation = uniqueBudgetLines.reduce((s, b) => s + b.dotation, 0);
          const totalEngaged = uniqueBudgetLines.reduce((s, b) => s + b.engaged, 0);
          const totalDisponible = uniqueBudgetLines.reduce((s, b) => s + b.disponible, 0);
          const totalMontantNotes = notes.reduce((s, n) => s + (n.montant_estime || 0), 0);

          // Budget summary box
          doc.setDrawColor(...PDF_COLORS.primary);
          doc.setLineWidth(PDF_DIMENSIONS.lineWidth.thin);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(
            PDF_MARGINS.left,
            yPos,
            pageWidth - PDF_MARGINS.left - PDF_MARGINS.right,
            16,
            2,
            2,
            'FD'
          );

          doc.setFontSize(PDF_FONTS.size.small);
          doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.bold);
          doc.setTextColor(...PDF_COLORS.primary);
          doc.text('Résumé budgétaire', PDF_MARGINS.left + 4, yPos + 5);

          doc.setFontSize(PDF_FONTS.size.tiny);
          doc.setFont(PDF_FONTS.family, PDF_FONTS.styles.normal);
          doc.setTextColor(...PDF_COLORS.text);

          const budgetItems = [
            `Dotation totale: ${formatMontantFCFA(totalDotation)} FCFA`,
            `Engagé: ${formatMontantFCFA(totalEngaged)} FCFA`,
            `Disponible: ${formatMontantFCFA(totalDisponible)} FCFA`,
            `Montant notes exportées: ${formatMontantFCFA(totalMontantNotes)} FCFA`,
          ];

          const colWidth =
            (pageWidth - PDF_MARGINS.left - PDF_MARGINS.right - 8) / budgetItems.length;
          budgetItems.forEach((item, idx) => {
            doc.text(item, PDF_MARGINS.left + 4 + idx * colWidth, yPos + 12);
          });

          yPos += 22;
        }

        // ── DATA TABLE ──
        const tableHeaders = [
          'Réf',
          'Objet',
          'Direction',
          'Demandeur',
          'Urgence',
          'Montant',
          'Ligne budget',
          'Disponible',
          'NSEF',
          'Statut',
          'Validé par',
          'Date val.',
          'Créée le',
        ];

        const tableData = notes.map((note) => {
          const budget = note.budget_line_id ? budgetMap.get(note.budget_line_id) : undefined;
          return [
            note.reference_pivot || note.numero || '',
            (note.objet || '').substring(0, 40),
            note.direction?.sigle || '',
            note.created_by_profile
              ? `${note.created_by_profile.first_name || ''} ${note.created_by_profile.last_name || ''}`
                  .trim()
                  .substring(0, 20)
              : '',
            PRIORITE_LABELS[note.priorite || ''] || '',
            formatMontantFCFA(note.montant_estime),
            note.budget_line?.code || '',
            budget ? formatMontantFCFA(budget.disponible) : '',
            note.note_sef?.reference_pivot ||
              note.note_sef?.numero ||
              (note.is_direct_aef ? 'Directe' : ''),
            STATUT_LABELS[note.statut] || note.statut || '',
            note.validated_by_profile
              ? `${note.validated_by_profile.first_name || ''} ${note.validated_by_profile.last_name || ''}`
                  .trim()
                  .substring(0, 20)
              : '',
            note.validated_at ? format(new Date(note.validated_at), 'dd/MM/yy') : '',
            note.created_at ? format(new Date(note.created_at), 'dd/MM/yy') : '',
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [tableHeaders],
          body: tableData,
          styles: {
            fontSize: 7,
            cellPadding: 2,
            lineWidth: TABLE_STYLES.default.lineWidth,
            lineColor: PDF_COLORS.tableBorder,
            textColor: PDF_COLORS.text,
            overflow: 'ellipsize',
          },
          headStyles: {
            fillColor: PDF_COLORS.primary,
            textColor: PDF_COLORS.white,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 6.5,
          },
          columnStyles: {
            0: { cellWidth: 22 }, // Réf
            1: { cellWidth: 40 }, // Objet
            2: { cellWidth: 14 }, // Direction
            3: { cellWidth: 22 }, // Demandeur
            4: { cellWidth: 14 }, // Urgence
            5: { cellWidth: 20, halign: 'right' }, // Montant
            6: { cellWidth: 16 }, // Ligne budget
            7: { cellWidth: 20, halign: 'right' }, // Disponible
            8: { cellWidth: 22 }, // NSEF
            9: { cellWidth: 14 }, // Statut
            10: { cellWidth: 22 }, // Validé par
            11: { cellWidth: 14 }, // Date val.
            12: { cellWidth: 14 }, // Créée le
          },
          alternateRowStyles: {
            fillColor: [248, 248, 248],
          },
          margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
          didDrawPage: (data) => {
            // Footer on each page
            const pageCount = doc.getNumberOfPages();
            generatePDFFooter({
              doc,
              pageNumber: data.pageNumber,
              totalPages: pageCount,
              qrCodeDataUrl,
              showSecurityNote: data.pageNumber === 1,
            });
          },
        });

        // Update total pages in footer (re-draw footers with correct total)
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          generatePDFFooter({
            doc,
            pageNumber: i,
            totalPages,
            qrCodeDataUrl,
            showSecurityNote: i === 1,
          });
        }

        // ── SAVE ──
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        const fileName = `SYGFP_Notes_AEF_${dateStr}.pdf`;
        doc.save(fileName);

        toast.success(`${notes.length} note(s) exportée(s) en PDF`);
      } catch (error: unknown) {
        console.error('Export PDF AEF error:', error);
        toast.error(
          "Erreur lors de l'export PDF: " +
            (error instanceof Error ? error.message : 'Erreur inconnue')
        );
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [exercice, isDG]
  );

  return {
    exportNotesAEF,
    exportNotesAEFPDF,
    exportNotesAEFCSV,
    isExporting,
    exportProgress,
  };
}
