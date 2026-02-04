/**
 * Module Excel - Export centralisé
 * Utilitaires et générateurs pour la création de fichiers Excel
 */

// Styles
export {
  EXCEL_COLORS,
  EXCEL_FONTS,
  EXCEL_BORDERS,
  EXCEL_ALIGNMENT,
  EXCEL_STYLES,
  STATUS_STYLES,
  COLUMN_WIDTHS,
  ROW_HEIGHTS,
} from './excelStyles';

// Formats
export {
  NUMBER_FORMATS,
  DATE_FORMATS,
  formatMontant,
  formatDate,
  formatDateLong,
  dateToExcelSerial,
  parseDate,
  STATUS_LABELS,
  getStatusLabel,
  URGENCE_LABELS,
  getUrgenceLabel,
  generateFilename,
  sanitizeFilename,
} from './excelFormats';

// Générateur principal
export {
  generateExcel,
  generateExcelBlob,
  generateCSV,
  type FilterState,
  type ExportExcelOptions,
  type ColumnConfig,
} from './generateExcel';
