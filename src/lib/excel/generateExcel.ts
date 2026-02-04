/**
 * Générateur d'export Excel professionnel pour SYGFP
 * Format professionnel avec styles, formules et feuilles multiples
 */

import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  COLUMN_WIDTHS,
  ROW_HEIGHTS,
} from './excelStyles';
import {
  formatMontant,
  formatDate,
  getStatusLabel,
  generateFilename,
} from './excelFormats';

import type { NoteSEFEntity } from '@/lib/notes-sef/types';

// ============================================================================
// TYPES
// ============================================================================

export interface FilterState {
  exercice?: number;
  statut?: string | string[];
  direction?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ExportExcelOptions {
  /** Données à exporter */
  data: NoteSEFEntity[];
  /** Filtres appliqués (pour affichage dans le fichier) */
  filters?: FilterState;
  /** Inclure la feuille de résumé */
  includeResume?: boolean;
  /** Nom du fichier (sans extension) */
  filename?: string;
  /** Titre du document */
  title?: string;
}

export interface ColumnConfig {
  header: string;
  key: string;
  width: number;
  type: 'text' | 'number' | 'date' | 'currency' | 'status';
}

// ============================================================================
// CONFIGURATION DES COLONNES
// ============================================================================

const COLUMNS: ColumnConfig[] = [
  { header: 'Référence', key: 'reference', width: COLUMN_WIDTHS.reference, type: 'text' },
  { header: 'Objet', key: 'objet', width: COLUMN_WIDTHS.objet, type: 'text' },
  { header: 'Direction', key: 'direction', width: COLUMN_WIDTHS.direction, type: 'text' },
  { header: 'Demandeur', key: 'demandeur', width: COLUMN_WIDTHS.demandeur, type: 'text' },
  { header: 'Montant', key: 'montant', width: COLUMN_WIDTHS.montant, type: 'currency' },
  { header: 'Statut', key: 'statut', width: COLUMN_WIDTHS.statut, type: 'status' },
  { header: 'Date création', key: 'created_at', width: COLUMN_WIDTHS.date, type: 'date' },
  { header: 'Date validation', key: 'validated_at', width: COLUMN_WIDTHS.date, type: 'date' },
  { header: 'Validateur', key: 'validateur', width: COLUMN_WIDTHS.validateur, type: 'text' },
];

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Obtient le nom complet d'un profil
 */
function getFullName(profile: { first_name?: string | null; last_name?: string | null } | null): string {
  if (!profile) return '-';
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '-';
}

/**
 * Extrait la valeur d'une cellule depuis une note
 */
function getCellValue(note: NoteSEFEntity, key: string): string | number | Date | null {
  switch (key) {
    case 'reference':
      return note.numero || note.reference_pivot || '-';
    case 'objet':
      return note.objet || '-';
    case 'direction':
      return note.direction?.sigle || note.direction?.label || '-';
    case 'demandeur':
      return getFullName(note.demandeur);
    case 'montant':
      return null; // Les notes SEF n'ont pas de montant direct
    case 'statut':
      return getStatusLabel(note.statut);
    case 'created_at':
      return note.created_at ? new Date(note.created_at) : null;
    case 'validated_at':
      return note.validated_at ? new Date(note.validated_at) : null;
    case 'validateur':
      return note.validated_by ? 'DG' : '-';
    default:
      return '-';
  }
}

/**
 * Formate une valeur pour affichage dans la cellule
 */
function formatCellValue(value: string | number | Date | null, type: string): string {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'date':
      if (value instanceof Date) {
        return format(value, 'dd/MM/yyyy', { locale: fr });
      }
      return formatDate(String(value));
    case 'currency':
      return typeof value === 'number' ? formatMontant(value) : '-';
    default:
      return String(value);
  }
}

/**
 * Génère la description des filtres appliqués
 */
function getFiltersDescription(filters?: FilterState): string {
  if (!filters) return '';

  const parts: string[] = [];

  if (filters.exercice) {
    parts.push(`Exercice: ${filters.exercice}`);
  }
  if (filters.statut) {
    const statuts = Array.isArray(filters.statut) ? filters.statut : [filters.statut];
    parts.push(`Statut: ${statuts.map(getStatusLabel).join(', ')}`);
  }
  if (filters.direction) {
    parts.push(`Direction: ${filters.direction}`);
  }
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ? formatDate(filters.dateFrom) : '...';
    const to = filters.dateTo ? formatDate(filters.dateTo) : '...';
    parts.push(`Période: ${from} - ${to}`);
  }
  if (filters.search) {
    parts.push(`Recherche: "${filters.search}"`);
  }

  return parts.length > 0 ? `Filtres: ${parts.join(' | ')}` : '';
}

// ============================================================================
// GÉNÉRATION DE LA FEUILLE DE DONNÉES
// ============================================================================

function createDataSheet(
  data: NoteSEFEntity[],
  title: string,
  filters?: FilterState
): XLSX.WorkSheet {
  const rows: (string | number | Date | null)[][] = [];

  // Ligne 1 : Titre
  rows.push([title]);

  // Ligne 2 : Filtres (si applicable)
  const filtersDesc = getFiltersDescription(filters);
  rows.push([filtersDesc || `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`]);

  // Ligne 3 : Vide
  rows.push([]);

  // Ligne 4 : En-têtes
  rows.push(COLUMNS.map((col) => col.header));

  // Lignes 5+ : Données
  data.forEach((note) => {
    const row = COLUMNS.map((col) => {
      const value = getCellValue(note, col.key);
      return formatCellValue(value, col.type);
    });
    rows.push(row);
  });

  // Dernière ligne : Totaux
  if (data.length > 0) {
    rows.push([]); // Ligne vide avant les totaux
    const totalRow = COLUMNS.map((col, index) => {
      if (index === 0) return 'TOTAL';
      if (col.type === 'currency') {
        // Formule SUM pour la colonne montant
        const colLetter = String.fromCharCode(65 + index); // A, B, C, ...
        return `Formule: =SUM(${colLetter}5:${colLetter}${data.length + 4})`;
      }
      if (index === COLUMNS.length - 1) {
        return `${data.length} enregistrement(s)`;
      }
      return '';
    });
    rows.push(totalRow);
  }

  // Créer la feuille
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Configurer les largeurs de colonnes
  ws['!cols'] = COLUMNS.map((col) => ({ wch: col.width }));

  // Configurer les hauteurs de lignes
  ws['!rows'] = [
    { hpt: ROW_HEIGHTS.title }, // Titre
    { hpt: ROW_HEIGHTS.subtitle }, // Filtres
    { hpt: ROW_HEIGHTS.data }, // Vide
    { hpt: ROW_HEIGHTS.header }, // En-têtes
    ...data.map(() => ({ hpt: ROW_HEIGHTS.data })),
  ];

  // Fusion pour le titre (colonnes A à I)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLUMNS.length - 1 } }, // Titre
    { s: { r: 1, c: 0 }, e: { r: 1, c: COLUMNS.length - 1 } }, // Filtres
  ];

  // Appliquer les styles (si xlsx-style est disponible)
  applyDataSheetStyles(ws, data.length);

  return ws;
}

/**
 * Applique les styles à la feuille de données
 * Note: xlsx de base a un support limité des styles
 */
function applyDataSheetStyles(ws: XLSX.WorkSheet, _dataCount: number): void {
  // xlsx Community Edition a un support limité des styles
  // Pour des styles avancés, il faudrait utiliser xlsx-style ou exceljs
  // Ici on configure ce qui est possible

  // Les styles sont appliqués via les propriétés de cellule
  // Mais xlsx CE ne les supporte pas pleinement

  // On peut au moins configurer le format des nombres
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let R = 4; R <= range.e.r; R++) {
    // Colonne E (montant) - index 4
    const montantCell = XLSX.utils.encode_cell({ r: R, c: 4 });
    if (ws[montantCell]) {
      ws[montantCell].z = '#,##0" FCFA"';
    }

    // Colonnes G et H (dates) - index 6 et 7
    [6, 7].forEach((c) => {
      const dateCell = XLSX.utils.encode_cell({ r: R, c });
      if (ws[dateCell]) {
        ws[dateCell].z = 'DD/MM/YYYY';
      }
    });
  }
}

// ============================================================================
// GÉNÉRATION DE LA FEUILLE DE RÉSUMÉ
// ============================================================================

function createResumeSheet(data: NoteSEFEntity[]): XLSX.WorkSheet {
  const rows: (string | number)[][] = [];

  // Titre
  rows.push(['RÉSUMÉ DES DONNÉES']);
  rows.push([]);

  // Statistiques par statut
  rows.push(['RÉPARTITION PAR STATUT']);
  rows.push(['Statut', 'Nombre', 'Pourcentage']);

  const statusCounts: Record<string, number> = {};
  data.forEach((note) => {
    const status = note.statut || 'inconnu';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const percent = data.length > 0 ? ((count / data.length) * 100).toFixed(1) : '0';
      rows.push([getStatusLabel(status), count, `${percent}%`]);
    });

  rows.push(['Total', data.length, '100%']);
  rows.push([]);

  // Statistiques par direction
  rows.push(['RÉPARTITION PAR DIRECTION']);
  rows.push(['Direction', 'Nombre', 'Pourcentage']);

  const directionCounts: Record<string, number> = {};
  data.forEach((note) => {
    const dir = note.direction?.sigle || note.direction?.label || 'Non assigné';
    directionCounts[dir] = (directionCounts[dir] || 0) + 1;
  });

  Object.entries(directionCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([dir, count]) => {
      const percent = data.length > 0 ? ((count / data.length) * 100).toFixed(1) : '0';
      rows.push([dir, count, `${percent}%`]);
    });

  rows.push(['Total', data.length, '100%']);
  rows.push([]);

  // Informations générales
  rows.push(['INFORMATIONS GÉNÉRALES']);
  rows.push(['Métrique', 'Valeur']);
  rows.push(['Nombre total de notes', data.length]);
  rows.push(['Date d\'export', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })]);

  // Dates extrêmes
  const dates = data
    .map((n) => (n.created_at ? new Date(n.created_at).getTime() : null))
    .filter((d): d is number => d !== null);

  if (dates.length > 0) {
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    rows.push(['Note la plus ancienne', format(minDate, 'dd/MM/yyyy', { locale: fr })]);
    rows.push(['Note la plus récente', format(maxDate, 'dd/MM/yyyy', { locale: fr })]);
  }

  // Créer la feuille
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Largeurs de colonnes
  ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];

  return ws;
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Génère et télécharge un fichier Excel
 */
export function generateExcel(options: ExportExcelOptions): void {
  const {
    data,
    filters,
    includeResume = true,
    filename,
    title = 'SYGFP - Export Notes SEF',
  } = options;

  // Créer le workbook
  const wb = XLSX.utils.book_new();

  // Ajouter la feuille de données
  const dataSheet = createDataSheet(data, title, filters);
  XLSX.utils.book_append_sheet(wb, dataSheet, 'Données');

  // Ajouter la feuille de résumé (optionnel)
  if (includeResume && data.length > 0) {
    const resumeSheet = createResumeSheet(data);
    XLSX.utils.book_append_sheet(wb, resumeSheet, 'Résumé');
  }

  // Générer le nom du fichier
  const finalFilename = filename
    ? `${filename}.xlsx`
    : generateFilename('SYGFP_Notes_SEF');

  // Écrire et télécharger le fichier
  XLSX.writeFile(wb, finalFilename, {
    bookType: 'xlsx',
    type: 'binary',
  });
}

/**
 * Génère un fichier Excel en mémoire (Blob)
 */
export function generateExcelBlob(options: ExportExcelOptions): Blob {
  const {
    data,
    filters,
    includeResume = true,
    title = 'SYGFP - Export Notes SEF',
  } = options;

  // Créer le workbook
  const wb = XLSX.utils.book_new();

  // Ajouter la feuille de données
  const dataSheet = createDataSheet(data, title, filters);
  XLSX.utils.book_append_sheet(wb, dataSheet, 'Données');

  // Ajouter la feuille de résumé (optionnel)
  if (includeResume && data.length > 0) {
    const resumeSheet = createResumeSheet(data);
    XLSX.utils.book_append_sheet(wb, resumeSheet, 'Résumé');
  }

  // Générer le Blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ============================================================================
// EXPORT CSV (alternative légère)
// ============================================================================

/**
 * Génère et télécharge un fichier CSV
 */
export function generateCSV(data: NoteSEFEntity[], filename?: string): void {
  // Préparer les données
  const rows: string[][] = [];

  // En-têtes
  rows.push(COLUMNS.map((col) => col.header));

  // Données
  data.forEach((note) => {
    const row = COLUMNS.map((col) => {
      const value = getCellValue(note, col.key);
      return formatCellValue(value, col.type);
    });
    rows.push(row);
  });

  // Créer la feuille et convertir en CSV
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' }); // Séparateur point-virgule pour Excel français

  // Télécharger avec BOM pour UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || generateFilename('SYGFP_Notes_SEF', 'csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
