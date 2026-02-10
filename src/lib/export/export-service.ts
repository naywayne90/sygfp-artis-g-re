/**
 * Service d'export standardisé SYGFP
 * Gère les exports Excel, CSV et PDF avec en-tête ARTI
 */

import * as XLSX from 'xlsx';

// ============================================================================
// Types et Interfaces
// ============================================================================

export interface ExportColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  format?: (value: unknown) => string;
  width?: number;
}

export interface ExportTemplate {
  id: string;
  name: string;
  module: string;
  columns: ExportColumn[];
  defaultFilters?: Record<string, unknown>;
  description?: string;
}

export interface ExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  exercice?: number;
  direction?: string;
  user?: string;
  filters?: Record<string, unknown>;
  showTotals?: boolean;
  totalColumns?: string[];
  orientation?: 'portrait' | 'landscape';
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  rowCount?: number;
}

// ============================================================================
// Utilitaires de formatage
// ============================================================================

export const formatters = {
  currency: (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
  },

  number: (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('fr-FR').format(num);
  },

  date: (value: unknown): string => {
    if (!value) return '-';
    try {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  },

  datetime: (value: unknown): string => {
    if (!value) return '-';
    try {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) return '-';
      return `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return '-';
    }
  },

  boolean: (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    return value ? 'Oui' : 'Non';
  },

  text: (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    return String(value);
  },

  status: (value: unknown): string => {
    if (!value) return '-';
    const statusMap: Record<string, string> = {
      draft: 'Brouillon',
      brouillon: 'Brouillon',
      pending: 'En attente',
      en_attente: 'En attente',
      en_attente_validation: 'En attente de validation',
      soumis: 'Soumis',
      submitted: 'Soumis',
      valide: 'Validé',
      validé: 'Validé',
      validated: 'Validé',
      approved: 'Approuvé',
      rejete: 'Rejeté',
      rejeté: 'Rejeté',
      rejected: 'Rejeté',
      annule: 'Annulé',
      annulé: 'Annulé',
      cancelled: 'Annulé',
      completed: 'Terminé',
      termine: 'Terminé',
      terminé: 'Terminé',
      en_cours: 'En cours',
      in_progress: 'En cours',
      blocked: 'Bloqué',
      bloque: 'Bloqué',
      bloqué: 'Bloqué',
    };
    return statusMap[String(value).toLowerCase()] || String(value);
  },
};

// ============================================================================
// Extraction de valeur nested (ex: "direction.sigle")
// ============================================================================

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current === null || current === undefined) return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj);
}

// ============================================================================
// Formatage d'une cellule selon le type de colonne
// ============================================================================

function formatCellValue(value: unknown, column: ExportColumn): string {
  // Custom formatter first
  if (column.format) {
    return column.format(value);
  }

  // Type-based formatting
  switch (column.type) {
    case 'currency':
      return formatters.currency(value);
    case 'number':
      return formatters.number(value);
    case 'date':
      return formatters.date(value);
    case 'boolean':
      return formatters.boolean(value);
    default:
      return formatters.text(value);
  }
}

// ============================================================================
// Export Excel
// ============================================================================

export function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  options: ExportOptions
): ExportResult {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: 'Aucune donnée à exporter', rowCount: 0 };
    }

    const workbook = XLSX.utils.book_new();

    // Prepare header info
    const headerRows = [
      [`ARTI - Autorité de Régulation du Transport Intérieur`],
      [options.title],
      options.subtitle ? [options.subtitle] : [],
      [`Exercice: ${options.exercice || 'N/A'}`],
      options.direction ? [`Direction: ${options.direction}`] : [],
      [
        `Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      ],
      options.user ? [`Par: ${options.user}`] : [],
      [], // Empty row before data
    ].filter((row) => row.length > 0);

    // Create worksheet with headers
    const worksheet = XLSX.utils.aoa_to_sheet(headerRows);

    // Add column headers
    const colHeaders = columns.map((c) => c.label);
    XLSX.utils.sheet_add_aoa(worksheet, [colHeaders], { origin: `A${headerRows.length + 1}` });

    // Prepare data rows with proper null handling
    const dataRows = data.map((row) =>
      columns.map((col) => {
        const rawValue = getNestedValue(row, col.key);
        // For Excel, keep numbers as numbers for calculations
        if (col.type === 'currency' || col.type === 'number') {
          if (rawValue === null || rawValue === undefined || rawValue === '') return '';
          const num = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue));
          return isNaN(num) ? '' : num;
        }
        return formatCellValue(rawValue, col);
      })
    );

    // Add data rows
    XLSX.utils.sheet_add_aoa(worksheet, dataRows, { origin: `A${headerRows.length + 2}` });

    // Add totals row if requested
    if (options.showTotals && options.totalColumns && options.totalColumns.length > 0) {
      const totalsRow = columns.map((col) => {
        if (options.totalColumns?.includes(col.key)) {
          const sum = data.reduce((acc, row) => {
            const val = getNestedValue(row, col.key);
            const num = typeof val === 'number' ? val : parseFloat(String(val));
            return acc + (isNaN(num) ? 0 : num);
          }, 0);
          return sum;
        }
        return col === columns[0] ? 'TOTAL' : '';
      });
      XLSX.utils.sheet_add_aoa(worksheet, [totalsRow], {
        origin: `A${headerRows.length + 2 + dataRows.length}`,
      });
    }

    // Set column widths
    const colWidths = columns.map((col, i) => {
      if (col.width) return { wch: col.width };
      // Calculate based on content
      const maxContentWidth = Math.max(
        col.label.length,
        ...dataRows.map((row) => String(row[i] ?? '').length)
      );
      return { wch: Math.min(Math.max(maxContentWidth + 2, 10), 50) };
    });
    worksheet['!cols'] = colWidths;

    // Freeze header rows
    worksheet['!freeze'] = { xSplit: 0, ySplit: headerRows.length + 1 };

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Données');

    // Generate and download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${options.filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    return { success: true, filename, rowCount: data.length };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// Export CSV
// ============================================================================

export function exportToCSV(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  options: ExportOptions
): ExportResult {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: 'Aucune donnée à exporter', rowCount: 0 };
    }

    // Header row
    const headers = columns.map((c) => `"${c.label}"`).join(';');

    // Data rows with proper null handling and escaping
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const rawValue = getNestedValue(row, col.key);
          const formatted = formatCellValue(rawValue, col);
          // Escape quotes and wrap in quotes
          return `"${String(formatted).replace(/"/g, '""')}"`;
        })
        .join(';')
    );

    // UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${options.filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    return { success: true, filename, rowCount: data.length };
  } catch (error) {
    console.error('CSV export error:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// Export PDF (via impression HTML)
// ============================================================================

export function exportToPDF(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  options: ExportOptions
): ExportResult {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: 'Aucune donnée à exporter', rowCount: 0 };
    }

    const logoUrl = `${window.location.origin}/logo-arti.jpg`; // Logo copied to public/
    const orientation = options.orientation || (columns.length > 6 ? 'landscape' : 'portrait');

    // Calculate totals if needed
    let totalsRow: string[] = [];
    if (options.showTotals && options.totalColumns && options.totalColumns.length > 0) {
      totalsRow = columns.map((col) => {
        if (options.totalColumns?.includes(col.key)) {
          const sum = data.reduce((acc, row) => {
            const val = getNestedValue(row, col.key);
            const num = typeof val === 'number' ? val : parseFloat(String(val));
            return acc + (isNaN(num) ? 0 : num);
          }, 0);
          return formatters.currency(sum);
        }
        return col === columns[0] ? '<strong>TOTAL</strong>' : '';
      });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${options.title}</title>
        <meta charset="UTF-8">
        <style>
          @page {
            margin: 1cm;
            size: A4 ${orientation};
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 9px;
            line-height: 1.3;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 10px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo {
            height: 60px;
            width: auto;
          }
          .header-title {
            font-size: 12px;
            font-weight: bold;
            color: #1e40af;
          }
          .header-subtitle {
            font-size: 10px;
            color: #666;
          }
          .header-info {
            text-align: right;
            font-size: 9px;
            color: #666;
          }
          .header-info strong {
            color: #333;
          }
          h1 {
            text-align: center;
            font-size: 14px;
            margin: 15px 0 5px;
            color: #1e40af;
          }
          .subtitle {
            text-align: center;
            font-size: 11px;
            color: #666;
            margin-bottom: 10px;
          }
          .meta-info {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #666;
            margin-bottom: 10px;
            padding: 5px 10px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #1e40af;
            color: white;
            font-weight: 600;
            font-size: 8px;
            text-transform: uppercase;
          }
          td.number, td.currency {
            text-align: right;
            font-family: 'Consolas', monospace;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f0f0f0;
          }
          tfoot td {
            font-weight: bold;
            background-color: #e5e7eb;
            border-top: 2px solid #1e40af;
          }
          .footer {
            margin-top: 20px;
            font-size: 8px;
            color: #666;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .footer-left {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .row-count {
            text-align: center;
            font-size: 9px;
            color: #666;
            margin-top: 10px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <img src="${logoUrl}" alt="ARTI" class="logo" onerror="this.style.display='none'" />
            <div>
              <div class="header-title">ARTI - Autorité de Régulation du Transport Intérieur</div>
              <div class="header-subtitle">Système de Gestion des Finances Publiques (SYGFP)</div>
            </div>
          </div>
          <div class="header-info">
            <div><strong>Exercice:</strong> ${options.exercice || 'N/A'}</div>
            ${options.direction ? `<div><strong>Direction:</strong> ${options.direction}</div>` : ''}
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</div>
            <div><strong>Heure:</strong> ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
            ${options.user ? `<div><strong>Par:</strong> ${options.user}</div>` : ''}
          </div>
        </div>

        <h1>${options.title}</h1>
        ${options.subtitle ? `<div class="subtitle">${options.subtitle}</div>` : ''}

        ${
          options.filters && Object.keys(options.filters).length > 0
            ? `
          <div class="meta-info">
            <span><strong>Filtres appliqués:</strong> ${
              Object.entries(options.filters)
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ') || 'Aucun'
            }</span>
            <span><strong>Nombre d'enregistrements:</strong> ${data.length}</span>
          </div>
        `
            : ''
        }

        <table>
          <thead>
            <tr>
              ${columns.map((col) => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                ${columns
                  .map((col) => {
                    const rawValue = getNestedValue(row, col.key);
                    const formatted = formatCellValue(rawValue, col);
                    const cellClass =
                      col.type === 'currency' || col.type === 'number' ? col.type : '';
                    return `<td class="${cellClass}">${formatted}</td>`;
                  })
                  .join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
          ${
            totalsRow.length > 0
              ? `
            <tfoot>
              <tr>
                ${totalsRow.map((val) => `<td>${val}</td>`).join('')}
              </tr>
            </tfoot>
          `
              : ''
          }
        </table>

        <div class="row-count">${data.length} enregistrement(s)</div>

        <div class="footer">
          <div class="footer-left">
            <span>SYGFP - Système de Gestion des Finances Publiques</span>
            <span>Document généré automatiquement - Ne pas modifier</span>
          </div>
          <span>Page 1/1</span>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // Small delay to ensure content is loaded
      setTimeout(() => printWindow.print(), 300);
    }

    return { success: true, rowCount: data.length };
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, error: String(error) };
  }
}
