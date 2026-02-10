/**
 * SYGFP - Export Branding Utilities
 * ==================================
 * Provides consistent ARTI branding for all document exports (PDF and Excel).
 * Centralizes colors, status badges, headers, footers, and print styles.
 */

import logoArtiSrc from '@/assets/logo-arti.jpg';

// ============================================================================
// Color Constants
// ============================================================================

export const ARTI_COLORS = {
  primary: '#1e3a5f',
  primaryLight: '#2563eb',
  accent: '#0d9488',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  neutral: '#6b7280',
  headerBg: '#f8fafc',
  tableBorder: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
} as const;

// ============================================================================
// Status Configuration
// ============================================================================

export const STATUT_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  brouillon: {
    label: 'Brouillon',
    color: ARTI_COLORS.neutral,
    bgColor: '#f3f4f6',
  },
  soumis: { label: 'Soumis', color: ARTI_COLORS.info, bgColor: '#eff6ff' },
  en_attente: {
    label: 'En attente',
    color: ARTI_COLORS.warning,
    bgColor: '#fffbeb',
  },
  a_valider: {
    label: 'A valider',
    color: ARTI_COLORS.warning,
    bgColor: '#fffbeb',
  },
  en_cours: {
    label: 'En cours',
    color: ARTI_COLORS.primaryLight,
    bgColor: '#eff6ff',
  },
  en_signature: {
    label: 'En signature',
    color: ARTI_COLORS.accent,
    bgColor: '#f0fdfa',
  },
  a_imputer: {
    label: 'A imputer',
    color: ARTI_COLORS.warning,
    bgColor: '#fffbeb',
  },
  impute: {
    label: 'Imputé',
    color: ARTI_COLORS.accent,
    bgColor: '#f0fdfa',
  },
  transmis: {
    label: 'Transmis',
    color: ARTI_COLORS.info,
    bgColor: '#eff6ff',
  },
  valide: {
    label: 'Validé',
    color: ARTI_COLORS.success,
    bgColor: '#ecfdf5',
  },
  signe: { label: 'Signé', color: ARTI_COLORS.success, bgColor: '#ecfdf5' },
  paye: { label: 'Payé', color: ARTI_COLORS.success, bgColor: '#ecfdf5' },
  solde: { label: 'Soldé', color: ARTI_COLORS.success, bgColor: '#ecfdf5' },
  cloture: {
    label: 'Clôturé',
    color: ARTI_COLORS.neutral,
    bgColor: '#f3f4f6',
  },
  differe: {
    label: 'Différé',
    color: ARTI_COLORS.warning,
    bgColor: '#fffbeb',
  },
  rejete: { label: 'Rejeté', color: ARTI_COLORS.danger, bgColor: '#fef2f2' },
  bloque: { label: 'Bloqué', color: ARTI_COLORS.danger, bgColor: '#fef2f2' },
  annule: { label: 'Annulé', color: ARTI_COLORS.danger, bgColor: '#fef2f2' },
};

// ============================================================================
// Logo Utilities
// ============================================================================

let cachedLogoDataUrl: string | null = null;

/**
 * Convert ARTI logo to base64 data URL for embedding in exports.
 * Caches the result after first load.
 */
export async function getArtiLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      cachedLogoDataUrl = dataUrl;
      resolve(dataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load ARTI logo'));
    };

    img.src = logoArtiSrc;
  });
}

// ============================================================================
// HTML Header for Export Documents
// ============================================================================

export function getExportHtmlHeader(options: {
  title: string;
  subtitle?: string;
  filters?: string;
  exercice?: string;
  logoDataUrl?: string;
}): string {
  const { title, subtitle, filters, exercice, logoDataUrl } = options;
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="ARTI" style="height:60px;width:auto;" />`
    : '';

  return `
    <div style="margin-bottom:20px;">
      <table style="width:100%;border:none;border-collapse:collapse;">
        <tr>
          <td style="width:80px;border:none;vertical-align:middle;padding:0;">
            ${logoHtml}
          </td>
          <td style="border:none;text-align:center;vertical-align:middle;padding:0;">
            <div style="font-size:11px;color:${ARTI_COLORS.textSecondary};margin-bottom:2px;">
              REPUBLIQUE DE COTE D'IVOIRE
            </div>
            <div style="font-size:10px;color:${ARTI_COLORS.textSecondary};margin-bottom:6px;">
              Union - Discipline - Travail
            </div>
            <div style="font-size:12px;font-weight:bold;color:${ARTI_COLORS.primary};">
              ARTI - Autorit\u00e9 de R\u00e9gulation du Transport Int\u00e9rieur
            </div>
          </td>
          <td style="width:120px;border:none;text-align:right;vertical-align:middle;padding:0;font-size:9px;color:${ARTI_COLORS.textSecondary};">
            ${exercice ? `<div>Exercice: <strong>${exercice}</strong></div>` : ''}
            <div>${dateStr} ${timeStr}</div>
          </td>
        </tr>
      </table>
      <hr style="border:none;border-top:3px solid ${ARTI_COLORS.primary};margin:12px 0 16px 0;" />
      <div style="text-align:center;margin-bottom:8px;">
        <div style="font-size:16px;font-weight:bold;color:${ARTI_COLORS.primary};margin-bottom:4px;">
          ${title}
        </div>
        ${subtitle ? `<div style="font-size:11px;color:${ARTI_COLORS.textSecondary};">${subtitle}</div>` : ''}
        ${filters ? `<div style="font-size:10px;color:${ARTI_COLORS.textSecondary};margin-top:4px;">${filters}</div>` : ''}
      </div>
    </div>
  `;
}

// ============================================================================
// HTML Footer for Export Documents
// ============================================================================

export function getExportHtmlFooter(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <div style="margin-top:24px;border-top:1px solid ${ARTI_COLORS.tableBorder};padding-top:8px;font-size:8px;color:${ARTI_COLORS.textSecondary};">
      <table style="width:100%;border:none;border-collapse:collapse;">
        <tr>
          <td style="border:none;padding:0;text-align:left;">
            SYGFP - Syst\u00e8me de Gestion des Finances Publiques<br/>
            Document g\u00e9n\u00e9r\u00e9 automatiquement le ${dateStr} \u00e0 ${timeStr} - Ne pas modifier
          </td>
          <td style="border:none;padding:0;text-align:right;">
            ARTI - C\u00f4te d'Ivoire
          </td>
        </tr>
      </table>
    </div>
  `;
}

// ============================================================================
// Print-Optimized CSS Styles
// ============================================================================

export function getExportPrintStyles(orientation: 'portrait' | 'landscape' = 'portrait'): string {
  return `
    @page {
      size: A4 ${orientation};
      margin: 1cm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 9px;
      line-height: 1.4;
      color: ${ARTI_COLORS.textPrimary};
      margin: 0;
      padding: 15px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      page-break-inside: auto;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background-color: ${ARTI_COLORS.primary} !important;
      color: white !important;
      font-weight: 600;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      padding: 6px 8px;
      border: 1px solid ${ARTI_COLORS.primary};
      text-align: left;
    }
    td {
      border: 1px solid ${ARTI_COLORS.tableBorder};
      padding: 4px 8px;
      text-align: left;
      vertical-align: top;
      font-size: 9px;
    }
    tr:nth-child(even) td {
      background-color: ${ARTI_COLORS.headerBg};
    }
    td.number, td.currency {
      text-align: right;
      font-family: 'Consolas', 'Courier New', monospace;
    }
    tfoot td {
      font-weight: bold;
      background-color: #e5e7eb !important;
      border-top: 2px solid ${ARTI_COLORS.primary};
    }
    .statut-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 8px;
      font-weight: 600;
      white-space: nowrap;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
      }
    }
  `;
}

// ============================================================================
// Status Badge HTML Formatter
// ============================================================================

export function formatStatutBadgeHtml(statut: string): string {
  const normalized = statut.toLowerCase().trim();
  const config = STATUT_CONFIG[normalized];

  if (!config) {
    return `<span class="statut-badge" style="background-color:#f3f4f6;color:#6b7280;">${statut}</span>`;
  }

  return `<span class="statut-badge" style="background-color:${config.bgColor};color:${config.color};">${config.label}</span>`;
}

// ============================================================================
// Date Formatting for Exports
// ============================================================================

export function formatDateExport(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
}

// ============================================================================
// Excel Header Rows Generator
// ============================================================================

/**
 * Generate header rows for Excel exports (array of arrays for XLSX library).
 * Returns rows to be placed before the data table.
 */
export function getExcelHeaderRows(title: string, subtitle: string, filters?: string): string[][] {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const rows: string[][] = [
    ["REPUBLIQUE DE COTE D'IVOIRE"],
    ['ARTI - Autorite de Regulation du Transport Interieur'],
    [],
    [title],
    [subtitle],
  ];

  if (filters) {
    rows.push([`Filtres: ${filters}`]);
  }

  rows.push([`Genere le: ${dateStr} a ${timeStr}`]);
  rows.push([]);

  return rows;
}
