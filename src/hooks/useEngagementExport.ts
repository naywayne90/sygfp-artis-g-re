/**
 * Hook d'export pour les Engagements Budgetaires
 * - Excel multi-feuilles (2 sheets: Liste + Suivi budgetaire)
 * - CSV export plat
 * Pattern: identique a usePassationMarcheExport.ts
 */

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import type { Engagement } from '@/hooks/useEngagements';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SuiviBudgetaireLigne {
  budgetLineId: string;
  code: string;
  libelle: string;
  directionSigle: string;
  dotation: number;
  totalEngage: number;
  disponible: number;
  taux: number;
  nbEngagements: number;
  dernierEngagement: string | null;
}

export interface EngagementExportFilters {
  statut?: string;
  direction?: string;
  seuilMin?: number;
}

// ---------------------------------------------------------------------------
// Helpers (exported for tests)
// ---------------------------------------------------------------------------

export function fmtCurrencyExport(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '-';
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

export function fmtDateExport(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
}

export function statutLabel(statut: string | null | undefined): string {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    soumis: 'Soumis',
    visa_saf: 'Visa SAF',
    visa_cb: 'Visa CB',
    visa_daaf: 'Visa DAAF',
    valide: 'Validé',
    rejete: 'Rejeté',
    differe: 'Différé',
    annule: 'Annulé',
  };
  return labels[statut || ''] || statut || '-';
}

export function typeEngagementLabel(type: string | null | undefined): string {
  if (type === 'sur_marche') return 'Sur marché';
  if (type === 'hors_marche') return 'Hors marché';
  return type || '-';
}

/**
 * Compute suivi budgetaire grouped by budget_line from a list of engagements.
 * Only considers non-rejected, non-cancelled engagements for the aggregation.
 */
export function computeSuiviBudgetaire(engagements: Engagement[]): SuiviBudgetaireLigne[] {
  const map = new Map<
    string,
    {
      code: string;
      libelle: string;
      directionSigle: string;
      dotation: number;
      totalEngage: number;
      nbEngagements: number;
      dernierEngagement: string | null;
    }
  >();

  for (const eng of engagements) {
    // Exclure les rejetes et annules du suivi
    if (eng.statut === 'rejete' || eng.statut === 'annule') continue;

    const blId = eng.budget_line_id;
    if (!blId) continue;

    const existing = map.get(blId);
    if (existing) {
      existing.totalEngage += eng.montant || 0;
      existing.nbEngagements += 1;
      if (
        eng.date_engagement &&
        (!existing.dernierEngagement || eng.date_engagement > existing.dernierEngagement)
      ) {
        existing.dernierEngagement = eng.date_engagement;
      }
    } else {
      map.set(blId, {
        code: eng.budget_line?.code || '-',
        libelle: eng.budget_line?.label || '-',
        directionSigle: eng.budget_line?.direction?.sigle || '-',
        dotation: eng.budget_line?.dotation_initiale || 0,
        totalEngage: eng.montant || 0,
        nbEngagements: 1,
        dernierEngagement: eng.date_engagement || null,
      });
    }
  }

  const result: SuiviBudgetaireLigne[] = [];
  for (const [budgetLineId, data] of map) {
    const disponible = data.dotation - data.totalEngage;
    const taux = data.dotation > 0 ? (data.totalEngage / data.dotation) * 100 : 0;
    result.push({
      budgetLineId,
      code: data.code,
      libelle: data.libelle,
      directionSigle: data.directionSigle,
      dotation: data.dotation,
      totalEngage: data.totalEngage,
      disponible,
      taux,
      nbEngagements: data.nbEngagements,
      dernierEngagement: data.dernierEngagement,
    });
  }

  // Tri par taux de consommation decroissant
  result.sort((a, b) => b.taux - a.taux);
  return result;
}

// ---------------------------------------------------------------------------
// A) Excel — 2 feuilles
// ---------------------------------------------------------------------------

function doExportExcel(
  engagements: Engagement[],
  exercice?: number,
  filters?: EngagementExportFilters
): void {
  let data = [...engagements];

  // Appliquer filtres
  if (filters?.statut) {
    data = data.filter((e) => e.statut === filters.statut);
  }
  if (filters?.direction) {
    data = data.filter((e) => e.budget_line?.direction?.sigle === filters.direction);
  }

  if (data.length === 0) {
    toast.warning('Aucune donnée à exporter');
    return;
  }

  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // --- Feuille 1 : Liste des engagements ---
  const headerRows = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Engagements Budgétaires'],
    [`Exercice: ${exercice || ''}`],
    [`Généré le: ${dateStr} à ${timeStr}`],
    [],
  ];

  const colHeaders1 = [
    'Référence',
    'Objet',
    'Type',
    'Fournisseur',
    'Montant TTC',
    'Montant HT',
    'TVA',
    'Montant dégagé',
    'Ligne budgétaire',
    'Direction',
    'Statut',
    'Date engagement',
    'Visa SAF',
    'Visa CB',
    'Visa DAAF',
    'Validation DG',
    'Motif rejet',
    'Créé par',
  ];

  const rows1 = data.map((e) => [
    e.numero || '-',
    e.objet || '-',
    typeEngagementLabel(e.type_engagement),
    e.fournisseur || '-',
    e.montant || 0,
    e.montant_ht || '',
    e.tva || '',
    e.montant_degage || '',
    e.budget_line?.code || '-',
    e.budget_line?.direction?.sigle || '-',
    statutLabel(e.statut),
    fmtDateExport(e.date_engagement),
    fmtDateExport(e.visa_saf_date),
    fmtDateExport(e.visa_cb_date),
    fmtDateExport(e.visa_daaf_date),
    fmtDateExport(e.visa_dg_date),
    e.motif_rejet || '',
    e.creator?.full_name || '-',
  ]);

  // Ligne total
  const totalMontant = data.reduce((sum, e) => sum + (e.montant || 0), 0);
  const totalDegage = data.reduce((sum, e) => sum + (e.montant_degage || 0), 0);
  rows1.push([
    'TOTAL',
    `${data.length} engagement(s)`,
    '',
    '',
    totalMontant,
    '',
    '',
    totalDegage,
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
    { wch: 20 }, // Reference
    { wch: 40 }, // Objet
    { wch: 14 }, // Type
    { wch: 30 }, // Fournisseur
    { wch: 18 }, // Montant TTC
    { wch: 16 }, // Montant HT
    { wch: 14 }, // TVA
    { wch: 16 }, // Degage
    { wch: 22 }, // Ligne budgetaire
    { wch: 12 }, // Direction
    { wch: 14 }, // Statut
    { wch: 14 }, // Date
    { wch: 12 }, // SAF
    { wch: 12 }, // CB
    { wch: 12 }, // DAAF
    { wch: 12 }, // DG
    { wch: 30 }, // Motif rejet
    { wch: 20 }, // Createur
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Engagements');

  // --- Feuille 2 : Suivi budgetaire par ligne ---
  const suivi = computeSuiviBudgetaire(data);

  const colHeaders2 = [
    'Code ligne',
    'Libellé',
    'Direction',
    'Dotation',
    'Total engagé',
    'Disponible',
    'Taux consommation (%)',
    'Nb engagements',
    'Dernier engagement',
  ];

  const rows2 = suivi.map((s) => [
    s.code,
    s.libelle,
    s.directionSigle,
    s.dotation,
    s.totalEngage,
    s.disponible,
    Number(s.taux.toFixed(1)),
    s.nbEngagements,
    fmtDateExport(s.dernierEngagement),
  ]);

  // Totaux
  const totalDot = suivi.reduce((sum, s) => sum + s.dotation, 0);
  const totalEng = suivi.reduce((sum, s) => sum + s.totalEngage, 0);
  const totalDisp = suivi.reduce((sum, s) => sum + s.disponible, 0);
  const tauxGlobal = totalDot > 0 ? (totalEng / totalDot) * 100 : 0;
  const totalNb = suivi.reduce((sum, s) => sum + s.nbEngagements, 0);
  rows2.push([
    'TOTAL',
    `${suivi.length} ligne(s)`,
    '',
    totalDot,
    totalEng,
    totalDisp,
    Number(tauxGlobal.toFixed(1)),
    totalNb,
    '',
  ]);

  const headerRows2 = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Suivi Budgétaire des Engagements'],
    [`Exercice: ${exercice || ''}`],
    [`Généré le: ${dateStr} à ${timeStr}`],
    [],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(headerRows2);
  XLSX.utils.sheet_add_aoa(ws2, [colHeaders2], { origin: `A${headerRows2.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws2, rows2, { origin: `A${headerRows2.length + 2}` });
  ws2['!cols'] = [
    { wch: 24 }, // Code
    { wch: 40 }, // Libelle
    { wch: 12 }, // Direction
    { wch: 18 }, // Dotation
    { wch: 18 }, // Engage
    { wch: 18 }, // Disponible
    { wch: 18 }, // Taux
    { wch: 14 }, // Nb
    { wch: 14 }, // Dernier
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Suivi Budgetaire');

  // Download
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Engagements_${exercice || ''}_${now.toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// B) CSV — export plat
// ---------------------------------------------------------------------------

function doExportCSV(
  engagements: Engagement[],
  exercice?: number,
  filters?: EngagementExportFilters
): void {
  let data = [...engagements];

  if (filters?.statut) {
    data = data.filter((e) => e.statut === filters.statut);
  }
  if (filters?.direction) {
    data = data.filter((e) => e.budget_line?.direction?.sigle === filters.direction);
  }

  if (data.length === 0) {
    toast.warning('Aucune donnée à exporter');
    return;
  }

  const headers = [
    'Reference',
    'Objet',
    'Type',
    'Fournisseur',
    'Montant TTC',
    'Montant HT',
    'TVA',
    'Montant degage',
    'Ligne budgetaire',
    'Direction',
    'Statut',
    'Date engagement',
    'Visa SAF',
    'Visa CB',
    'Visa DAAF',
    'Validation DG',
  ];

  const csvRows = data.map((e) =>
    [
      e.numero || '',
      `"${(e.objet || '').replace(/"/g, '""')}"`,
      typeEngagementLabel(e.type_engagement),
      `"${(e.fournisseur || '').replace(/"/g, '""')}"`,
      e.montant || 0,
      e.montant_ht || '',
      e.tva || '',
      e.montant_degage || '',
      e.budget_line?.code || '',
      e.budget_line?.direction?.sigle || '',
      statutLabel(e.statut),
      fmtDateExport(e.date_engagement),
      fmtDateExport(e.visa_saf_date),
      fmtDateExport(e.visa_cb_date),
      fmtDateExport(e.visa_daaf_date),
      fmtDateExport(e.visa_dg_date),
    ].join(';')
  );

  const csvContent = [headers.join(';'), ...csvRows].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Engagements_${exercice || ''}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// C) Excel suivi budgetaire seul
// ---------------------------------------------------------------------------

function doExportSuiviBudgetaire(
  engagements: Engagement[],
  exercice?: number,
  filters?: EngagementExportFilters
): void {
  let data = [...engagements];

  if (filters?.direction) {
    data = data.filter((e) => e.budget_line?.direction?.sigle === filters.direction);
  }

  let suivi = computeSuiviBudgetaire(data);

  if (filters?.seuilMin) {
    const seuilMin = filters.seuilMin;
    suivi = suivi.filter((s) => s.taux >= (seuilMin ?? 0));
  }

  if (suivi.length === 0) {
    toast.warning('Aucune donnée à exporter');
    return;
  }

  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const headerRows = [
    ['ARTI - Autorité de Régulation du Transport Intérieur'],
    ['Suivi Budgétaire des Engagements'],
    [`Exercice: ${exercice || ''}`],
    [
      `Filtre: ${filters?.seuilMin ? `Taux >= ${filters.seuilMin}%` : 'Tous'} | Direction: ${filters?.direction || 'Toutes'}`,
    ],
    [`Généré le: ${dateStr} à ${timeStr}`],
    [],
  ];

  const colHeaders = [
    'Code ligne',
    'Libellé',
    'Direction',
    'Dotation (FCFA)',
    'Total engagé (FCFA)',
    'Disponible (FCFA)',
    'Taux (%)',
    'Alerte',
    'Nb engagements',
    'Dernier engagement',
  ];

  const rows = suivi.map((s) => [
    s.code,
    s.libelle,
    s.directionSigle,
    s.dotation,
    s.totalEngage,
    s.disponible,
    Number(s.taux.toFixed(1)),
    s.taux > 100 ? 'DEPASSEMENT' : s.taux > 95 ? 'CRITIQUE' : s.taux > 80 ? 'ATTENTION' : 'OK',
    s.nbEngagements,
    fmtDateExport(s.dernierEngagement),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.sheet_add_aoa(ws, [colHeaders], { origin: `A${headerRows.length + 1}` });
  XLSX.utils.sheet_add_aoa(ws, rows, { origin: `A${headerRows.length + 2}` });
  ws['!cols'] = [
    { wch: 24 },
    { wch: 40 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Suivi Budgetaire');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SYGFP_Suivi_Budgetaire_${exercice || ''}_${now.toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEngagementExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportExcel = useCallback(
    (engagements: Engagement[], filters?: EngagementExportFilters, exercice?: number) => {
      setIsExporting(true);
      try {
        doExportExcel(engagements, exercice, filters);
        toast.success(`Export Excel : ${engagements.length} engagement(s)`);
      } catch (err) {
        toast.error('Erreur export Excel : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportCSV = useCallback(
    (engagements: Engagement[], filters?: EngagementExportFilters, exercice?: number) => {
      setIsExporting(true);
      try {
        doExportCSV(engagements, exercice, filters);
        toast.success(`Export CSV : ${engagements.length} engagement(s)`);
      } catch (err) {
        toast.error('Erreur export CSV : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportSuiviBudgetaire = useCallback(
    (engagements: Engagement[], filters?: EngagementExportFilters, exercice?: number) => {
      setIsExporting(true);
      try {
        doExportSuiviBudgetaire(engagements, exercice, filters);
        toast.success('Export suivi budgétaire généré');
      } catch (err) {
        toast.error('Erreur export suivi : ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return { exportExcel, exportCSV, exportSuiviBudgetaire, isExporting };
}
