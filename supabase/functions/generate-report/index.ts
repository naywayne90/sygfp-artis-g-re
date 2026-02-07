import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== Types =====

type ReportType =
  | 'execution_budgetaire'
  | 'synthese_depenses'
  | 'etat_engagements'
  | 'etat_liquidations'
  | 'etat_ordonnancements'
  | 'suivi_workflow';

type ReportFormat = 'json' | 'csv' | 'html';

interface ReportRequest {
  report_type: ReportType;
  format: ReportFormat;
  exercice: number;
  filters?: {
    direction_id?: string;
    date_debut?: string;
    date_fin?: string;
    statut?: string;
  };
}

interface BudgetLineRow {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_modifiee: number | null;
  disponible_calcule: number | null;
  total_engage: number | null;
  direction: { code: string; sigle: string } | null;
}

interface EngagementRow {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  statut: string;
  fournisseur: string | null;
  date_engagement: string | null;
  created_at: string;
  budget_line: { code: string; label: string } | null;
}

interface LiquidationRow {
  id: string;
  numero: string;
  montant: number;
  montant_ht: number | null;
  statut: string;
  reference_facture: string | null;
  date_liquidation: string | null;
  created_at: string;
  engagement: { numero: string; fournisseur: string | null } | null;
}

interface OrdonnancementRow {
  id: string;
  numero: string;
  montant: number;
  statut: string;
  mode_paiement: string | null;
  beneficiaire: string | null;
  created_at: string;
  liquidation: { numero: string } | null;
}

interface WorkflowStatsRow {
  module: string;
  total: number;
  brouillon: number;
  soumis: number;
  valide: number;
  rejete: number;
  differe: number;
  montant_total: number;
}

interface ExecutionSummary {
  dotation_totale: number;
  montant_engage: number;
  montant_liquide: number;
  montant_ordonnance: number;
  taux_engagement: number;
  taux_liquidation: number;
  taux_ordonnancement: number;
  lines: Array<{
    code: string;
    label: string;
    direction: string;
    dotation: number;
    engage: number;
    liquide: number;
    ordonnance: number;
    disponible: number;
  }>;
}

// ===== Helpers =====

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const formatAmount = (amount: number | null): string => {
  if (amount === null || amount === undefined) return '0';
  return new Intl.NumberFormat('fr-FR').format(amount);
};

const formatDate = (date: string | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR');
};

function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(';') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ===== Report generators =====

async function generateExecutionReport(
  supabase: ReturnType<typeof createClient>,
  exercice: number,
  filters?: ReportRequest['filters']
): Promise<ExecutionSummary> {
  let query = supabase
    .from('budget_lines')
    .select(
      `
      id, code, label, dotation_initiale, dotation_modifiee, disponible_calcule, total_engage,
      direction:directions(code, sigle)
    `
    )
    .eq('exercice', exercice)
    .order('code');

  if (filters?.direction_id) {
    query = query.eq('direction_id', filters.direction_id);
  }

  const { data: lines, error } = await query;
  if (error) throw error;

  const typedLines = (lines || []) as unknown as BudgetLineRow[];

  // Get liquidations total
  const { data: liqData } = await supabase
    .from('budget_liquidations')
    .select('montant')
    .eq('exercice', exercice)
    .neq('statut', 'annule');

  const totalLiquide = (liqData || []).reduce(
    (sum: number, l: { montant: number }) => sum + (l.montant || 0),
    0
  );

  // Get ordonnancements total
  const { data: ordData } = await supabase
    .from('ordonnancements')
    .select('montant')
    .eq('exercice', exercice)
    .neq('statut', 'annule');

  const totalOrdonnance = (ordData || []).reduce(
    (sum: number, o: { montant: number }) => sum + (o.montant || 0),
    0
  );

  const dotationTotale = typedLines.reduce((sum, l) => sum + (l.dotation_initiale || 0), 0);
  const totalEngage = typedLines.reduce((sum, l) => sum + (l.total_engage || 0), 0);

  return {
    dotation_totale: dotationTotale,
    montant_engage: totalEngage,
    montant_liquide: totalLiquide,
    montant_ordonnance: totalOrdonnance,
    taux_engagement: dotationTotale > 0 ? (totalEngage / dotationTotale) * 100 : 0,
    taux_liquidation: totalEngage > 0 ? (totalLiquide / totalEngage) * 100 : 0,
    taux_ordonnancement: totalLiquide > 0 ? (totalOrdonnance / totalLiquide) * 100 : 0,
    lines: typedLines.map((l) => ({
      code: l.code,
      label: l.label,
      direction: l.direction?.sigle || '-',
      dotation: l.dotation_initiale,
      engage: l.total_engage || 0,
      liquide: 0,
      ordonnance: 0,
      disponible: l.disponible_calcule || 0,
    })),
  };
}

async function generateEngagementsReport(
  supabase: ReturnType<typeof createClient>,
  exercice: number,
  filters?: ReportRequest['filters']
): Promise<EngagementRow[]> {
  let query = supabase
    .from('budget_engagements')
    .select(
      `
      id, numero, objet, montant, statut, fournisseur, date_engagement, created_at,
      budget_line:budget_lines(code, label)
    `
    )
    .eq('exercice', exercice)
    .order('created_at', { ascending: false });

  if (filters?.statut) {
    query = query.eq('statut', filters.statut);
  }
  if (filters?.date_debut) {
    query = query.gte('date_engagement', filters.date_debut);
  }
  if (filters?.date_fin) {
    query = query.lte('date_engagement', filters.date_fin);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as EngagementRow[];
}

async function generateLiquidationsReport(
  supabase: ReturnType<typeof createClient>,
  exercice: number,
  filters?: ReportRequest['filters']
): Promise<LiquidationRow[]> {
  let query = supabase
    .from('budget_liquidations')
    .select(
      `
      id, numero, montant, montant_ht, statut, reference_facture, date_liquidation, created_at,
      engagement:budget_engagements(numero, fournisseur)
    `
    )
    .eq('exercice', exercice)
    .order('created_at', { ascending: false });

  if (filters?.statut) {
    query = query.eq('statut', filters.statut);
  }
  if (filters?.date_debut) {
    query = query.gte('date_liquidation', filters.date_debut);
  }
  if (filters?.date_fin) {
    query = query.lte('date_liquidation', filters.date_fin);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as LiquidationRow[];
}

async function generateOrdonnancements(
  supabase: ReturnType<typeof createClient>,
  exercice: number,
  filters?: ReportRequest['filters']
): Promise<OrdonnancementRow[]> {
  let query = supabase
    .from('ordonnancements')
    .select(
      `
      id, numero, montant, statut, mode_paiement, beneficiaire, created_at,
      liquidation:budget_liquidations(numero)
    `
    )
    .eq('exercice', exercice)
    .order('created_at', { ascending: false });

  if (filters?.statut) {
    query = query.eq('statut', filters.statut);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as OrdonnancementRow[];
}

async function generateWorkflowStats(
  supabase: ReturnType<typeof createClient>,
  exercice: number
): Promise<WorkflowStatsRow[]> {
  const stats: WorkflowStatsRow[] = [];

  const tables = [
    { table: 'notes_sef', module: 'Notes SEF' },
    { table: 'notes_dg', module: 'Notes AEF' },
    { table: 'budget_engagements', module: 'Engagements' },
    { table: 'budget_liquidations', module: 'Liquidations' },
    { table: 'ordonnancements', module: 'Ordonnancements' },
    { table: 'reglements', module: 'Reglements' },
  ];

  for (const { table, module } of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id, statut, montant')
      .eq('exercice', exercice);

    if (error) {
      console.error(`Error fetching ${table}:`, error);
      continue;
    }

    const rows = (data || []) as Array<{
      id: string;
      statut: string | null;
      montant?: number;
    }>;

    stats.push({
      module,
      total: rows.length,
      brouillon: rows.filter((r) => r.statut === 'brouillon').length,
      soumis: rows.filter((r) => r.statut === 'soumis').length,
      valide: rows.filter((r) => r.statut === 'valide' || r.statut === 'impute').length,
      rejete: rows.filter((r) => r.statut === 'rejete').length,
      differe: rows.filter((r) => r.statut === 'differe').length,
      montant_total: rows.reduce((sum, r) => sum + (r.montant || 0), 0),
    });
  }

  return stats;
}

// ===== Format converters =====

function toCSV(headers: string[], rows: string[][]): string {
  const BOM = '\uFEFF';
  const headerLine = headers.map((h) => escapeCsvField(h)).join(';');
  const dataLines = rows.map((row) => row.map((cell) => escapeCsvField(cell)).join(';'));
  return BOM + [headerLine, ...dataLines].join('\n');
}

function executionToCSV(data: ExecutionSummary): string {
  const headers = ['Code', 'Libelle', 'Direction', 'Dotation', 'Engage', 'Disponible'];
  const rows = data.lines.map((l) => [
    l.code,
    l.label,
    l.direction,
    formatAmount(l.dotation),
    formatAmount(l.engage),
    formatAmount(l.disponible),
  ]);
  return toCSV(headers, rows);
}

function engagementsToCSV(data: EngagementRow[]): string {
  const headers = [
    'Numero',
    'Objet',
    'Fournisseur',
    'Montant',
    'Statut',
    'Ligne budgetaire',
    'Date',
  ];
  const rows = data.map((e) => [
    e.numero,
    e.objet || '',
    e.fournisseur || '',
    formatAmount(e.montant),
    e.statut,
    e.budget_line?.code || '',
    formatDate(e.date_engagement),
  ]);
  return toCSV(headers, rows);
}

function liquidationsToCSV(data: LiquidationRow[]): string {
  const headers = [
    'Numero',
    'Engagement',
    'Fournisseur',
    'Montant HT',
    'Montant TTC',
    'Ref Facture',
    'Statut',
    'Date',
  ];
  const rows = data.map((l) => [
    l.numero,
    l.engagement?.numero || '',
    l.engagement?.fournisseur || '',
    formatAmount(l.montant_ht),
    formatAmount(l.montant),
    l.reference_facture || '',
    l.statut,
    formatDate(l.date_liquidation),
  ]);
  return toCSV(headers, rows);
}

function ordonnancements_to_csv(data: OrdonnancementRow[]): string {
  const headers = [
    'Numero',
    'Liquidation',
    'Beneficiaire',
    'Montant',
    'Mode paiement',
    'Statut',
    'Date',
  ];
  const rows = data.map((o) => [
    o.numero,
    o.liquidation?.numero || '',
    o.beneficiaire || '',
    formatAmount(o.montant),
    o.mode_paiement || '',
    o.statut,
    formatDate(o.created_at),
  ]);
  return toCSV(headers, rows);
}

function workflowStatsToCSV(data: WorkflowStatsRow[]): string {
  const headers = [
    'Module',
    'Total',
    'Brouillon',
    'Soumis',
    'Valide',
    'Rejete',
    'Differe',
    'Montant total',
  ];
  const rows = data.map((s) => [
    s.module,
    s.total.toString(),
    s.brouillon.toString(),
    s.soumis.toString(),
    s.valide.toString(),
    s.rejete.toString(),
    s.differe.toString(),
    formatAmount(s.montant_total),
  ]);
  return toCSV(headers, rows);
}

function generateHTMLReport(
  title: string,
  exercice: number,
  headers: string[],
  rows: string[][],
  summary?: Record<string, string>
): string {
  const summaryHTML = summary
    ? `<div class="summary">${Object.entries(summary)
        .map(
          ([k, v]) =>
            `<div class="summary-item"><span class="label">${k}</span><span class="value">${v}</span></div>`
        )
        .join('')}</div>`
    : '';

  const tableHTML = `
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title} - Exercice ${exercice}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .summary-item { background: #f3f4f6; padding: 15px; border-radius: 8px; }
    .summary-item .label { display: block; font-size: 12px; color: #666; margin-bottom: 5px; }
    .summary-item .value { display: block; font-size: 18px; font-weight: bold; color: #1e40af; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
    th { background: #1e40af; color: white; padding: 8px 12px; text-align: left; }
    td { border: 1px solid #e5e7eb; padding: 6px 12px; }
    tr:nth-child(even) { background: #f9fafb; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">Exercice ${exercice} - Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}</div>
  ${summaryHTML}
  ${tableHTML}
  <div class="footer">SYGFP - Systeme de Gestion Financiere et Programmatique - ARTI Gabon</div>
</body>
</html>`;
}

// ===== Main handler =====

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Non autorise' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify token
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Token invalide' }, 401);
    }

    // 2. Parse request
    const body: ReportRequest = await req.json();
    console.warn('[generate-report] Request:', {
      report_type: body.report_type,
      format: body.format,
      exercice: body.exercice,
      user_id: user.id,
    });

    if (!body.report_type || !body.format || !body.exercice) {
      return jsonResponse({ error: 'Champs requis: report_type, format, exercice' }, 400);
    }

    const validTypes: ReportType[] = [
      'execution_budgetaire',
      'synthese_depenses',
      'etat_engagements',
      'etat_liquidations',
      'etat_ordonnancements',
      'suivi_workflow',
    ];
    if (!validTypes.includes(body.report_type)) {
      return jsonResponse({ error: `Type de rapport invalide: ${body.report_type}` }, 400);
    }

    const validFormats: ReportFormat[] = ['json', 'csv', 'html'];
    if (!validFormats.includes(body.format)) {
      return jsonResponse({ error: `Format invalide: ${body.format}` }, 400);
    }

    // 3. Generate report data
    let content: string;
    let contentType: string;
    let fileName: string;
    const timestamp = Date.now();

    switch (body.report_type) {
      case 'execution_budgetaire':
      case 'synthese_depenses': {
        const data = await generateExecutionReport(supabase, body.exercice, body.filters);

        if (body.format === 'json') {
          content = JSON.stringify(
            {
              report_type: body.report_type,
              exercice: body.exercice,
              generated_at: new Date().toISOString(),
              data,
            },
            null,
            2
          );
          contentType = 'application/json; charset=utf-8';
          fileName = `execution_${body.exercice}_${timestamp}.json`;
        } else if (body.format === 'csv') {
          content = executionToCSV(data);
          contentType = 'text/csv; charset=utf-8';
          fileName = `execution_${body.exercice}_${timestamp}.csv`;
        } else {
          const summary = {
            'Dotation totale': `${formatAmount(data.dotation_totale)} FCFA`,
            'Total engage': `${formatAmount(data.montant_engage)} FCFA`,
            'Total liquide': `${formatAmount(data.montant_liquide)} FCFA`,
            'Total ordonnance': `${formatAmount(data.montant_ordonnance)} FCFA`,
            'Taux engagement': `${data.taux_engagement.toFixed(1)}%`,
            'Taux liquidation': `${data.taux_liquidation.toFixed(1)}%`,
          };
          content = generateHTMLReport(
            "Etat d'Execution Budgetaire",
            body.exercice,
            ['Code', 'Libelle', 'Direction', 'Dotation', 'Engage', 'Disponible'],
            data.lines.map((l) => [
              l.code,
              l.label,
              l.direction,
              formatAmount(l.dotation),
              formatAmount(l.engage),
              formatAmount(l.disponible),
            ]),
            summary
          );
          contentType = 'text/html; charset=utf-8';
          fileName = `execution_${body.exercice}_${timestamp}.html`;
        }
        break;
      }

      case 'etat_engagements': {
        const data = await generateEngagementsReport(supabase, body.exercice, body.filters);

        if (body.format === 'json') {
          content = JSON.stringify(
            {
              report_type: body.report_type,
              exercice: body.exercice,
              generated_at: new Date().toISOString(),
              count: data.length,
              total: data.reduce((s, e) => s + (e.montant || 0), 0),
              data,
            },
            null,
            2
          );
          contentType = 'application/json; charset=utf-8';
          fileName = `engagements_${body.exercice}_${timestamp}.json`;
        } else if (body.format === 'csv') {
          content = engagementsToCSV(data);
          contentType = 'text/csv; charset=utf-8';
          fileName = `engagements_${body.exercice}_${timestamp}.csv`;
        } else {
          const total = data.reduce((s, e) => s + (e.montant || 0), 0);
          content = generateHTMLReport(
            'Etat des Engagements',
            body.exercice,
            ['Numero', 'Objet', 'Fournisseur', 'Montant', 'Statut', 'Ligne', 'Date'],
            data.map((e) => [
              e.numero,
              e.objet || '',
              e.fournisseur || '',
              formatAmount(e.montant),
              e.statut,
              e.budget_line?.code || '',
              formatDate(e.date_engagement),
            ]),
            {
              'Nombre total': data.length.toString(),
              'Montant total': `${formatAmount(total)} FCFA`,
            }
          );
          contentType = 'text/html; charset=utf-8';
          fileName = `engagements_${body.exercice}_${timestamp}.html`;
        }
        break;
      }

      case 'etat_liquidations': {
        const data = await generateLiquidationsReport(supabase, body.exercice, body.filters);

        if (body.format === 'json') {
          content = JSON.stringify(
            {
              report_type: body.report_type,
              exercice: body.exercice,
              generated_at: new Date().toISOString(),
              count: data.length,
              total: data.reduce((s, l) => s + (l.montant || 0), 0),
              data,
            },
            null,
            2
          );
          contentType = 'application/json; charset=utf-8';
          fileName = `liquidations_${body.exercice}_${timestamp}.json`;
        } else if (body.format === 'csv') {
          content = liquidationsToCSV(data);
          contentType = 'text/csv; charset=utf-8';
          fileName = `liquidations_${body.exercice}_${timestamp}.csv`;
        } else {
          const total = data.reduce((s, l) => s + (l.montant || 0), 0);
          content = generateHTMLReport(
            'Etat des Liquidations',
            body.exercice,
            [
              'Numero',
              'Engagement',
              'Fournisseur',
              'Montant HT',
              'Montant TTC',
              'Ref Facture',
              'Statut',
              'Date',
            ],
            data.map((l) => [
              l.numero,
              l.engagement?.numero || '',
              l.engagement?.fournisseur || '',
              formatAmount(l.montant_ht),
              formatAmount(l.montant),
              l.reference_facture || '',
              l.statut,
              formatDate(l.date_liquidation),
            ]),
            {
              'Nombre total': data.length.toString(),
              'Montant total': `${formatAmount(total)} FCFA`,
            }
          );
          contentType = 'text/html; charset=utf-8';
          fileName = `liquidations_${body.exercice}_${timestamp}.html`;
        }
        break;
      }

      case 'etat_ordonnancements': {
        const data = await generateOrdonnancements(supabase, body.exercice, body.filters);

        if (body.format === 'json') {
          content = JSON.stringify(
            {
              report_type: body.report_type,
              exercice: body.exercice,
              generated_at: new Date().toISOString(),
              count: data.length,
              total: data.reduce((s, o) => s + (o.montant || 0), 0),
              data,
            },
            null,
            2
          );
          contentType = 'application/json; charset=utf-8';
          fileName = `ordonnancements_${body.exercice}_${timestamp}.json`;
        } else if (body.format === 'csv') {
          content = ordonnancements_to_csv(data);
          contentType = 'text/csv; charset=utf-8';
          fileName = `ordonnancements_${body.exercice}_${timestamp}.csv`;
        } else {
          const total = data.reduce((s, o) => s + (o.montant || 0), 0);
          content = generateHTMLReport(
            'Etat des Ordonnancements',
            body.exercice,
            ['Numero', 'Liquidation', 'Beneficiaire', 'Montant', 'Mode paiement', 'Statut', 'Date'],
            data.map((o) => [
              o.numero,
              o.liquidation?.numero || '',
              o.beneficiaire || '',
              formatAmount(o.montant),
              o.mode_paiement || '',
              o.statut,
              formatDate(o.created_at),
            ]),
            {
              'Nombre total': data.length.toString(),
              'Montant total': `${formatAmount(total)} FCFA`,
            }
          );
          contentType = 'text/html; charset=utf-8';
          fileName = `ordonnancements_${body.exercice}_${timestamp}.html`;
        }
        break;
      }

      case 'suivi_workflow': {
        const data = await generateWorkflowStats(supabase, body.exercice);

        if (body.format === 'json') {
          content = JSON.stringify(
            {
              report_type: body.report_type,
              exercice: body.exercice,
              generated_at: new Date().toISOString(),
              data,
            },
            null,
            2
          );
          contentType = 'application/json; charset=utf-8';
          fileName = `workflow_${body.exercice}_${timestamp}.json`;
        } else if (body.format === 'csv') {
          content = workflowStatsToCSV(data);
          contentType = 'text/csv; charset=utf-8';
          fileName = `workflow_${body.exercice}_${timestamp}.csv`;
        } else {
          content = generateHTMLReport(
            'Suivi du Workflow - Chaine de Depense',
            body.exercice,
            [
              'Module',
              'Total',
              'Brouillon',
              'Soumis',
              'Valide',
              'Rejete',
              'Differe',
              'Montant total',
            ],
            data.map((s) => [
              s.module,
              s.total.toString(),
              s.brouillon.toString(),
              s.soumis.toString(),
              s.valide.toString(),
              s.rejete.toString(),
              s.differe.toString(),
              formatAmount(s.montant_total),
            ])
          );
          contentType = 'text/html; charset=utf-8';
          fileName = `workflow_${body.exercice}_${timestamp}.html`;
        }
        break;
      }

      default:
        return jsonResponse({ error: 'Type de rapport non supporte' }, 400);
    }

    // 4. Log report generation
    try {
      await supabase.from('export_jobs').insert({
        user_id: user.id,
        type: body.format,
        entity_type: body.report_type,
        filters: body.filters || null,
        status: 'completed',
        file_name: fileName,
        file_size: new TextEncoder().encode(content).length,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('[generate-report] Log error:', logError);
    }

    console.warn('[generate-report] Success:', {
      report_type: body.report_type,
      format: body.format,
      fileName,
      size: content.length,
    });

    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('[generate-report] Error:', error);
    return jsonResponse({ error: errorMessage }, 500);
  }
});
