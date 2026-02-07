import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DashboardStatsRequest {
  exercice?: number;
  direction_id?: string;
}

interface StageStats {
  total: number;
  brouillon: number;
  soumis: number;
  valide: number;
  rejete: number;
  differe: number;
  montant_total: number;
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function countByStatus(
  supabase: ReturnType<typeof createClient>,
  table: string,
  exercice: number,
  directionId?: string
): Promise<StageStats> {
  let query = supabase
    .from(table)
    .select('statut, montant, montant_ttc', { count: 'exact' })
    .eq('exercice', exercice);

  if (directionId) {
    query = query.eq('direction_id', directionId);
  }

  const { data, count } = await query;

  const rows = data || [];
  let brouillon = 0;
  let soumis = 0;
  let valide = 0;
  let rejete = 0;
  let differe = 0;
  let montantTotal = 0;

  for (const row of rows) {
    const statut = (row as Record<string, unknown>).statut as string;
    const montant =
      ((row as Record<string, unknown>).montant_ttc as number) ||
      ((row as Record<string, unknown>).montant as number) ||
      0;
    montantTotal += montant;

    switch (statut) {
      case 'brouillon':
      case 'draft':
        brouillon++;
        break;
      case 'soumis':
      case 'a_valider':
      case 'en_attente':
        soumis++;
        break;
      case 'valide':
      case 'approuve':
      case 'completed':
        valide++;
        break;
      case 'rejete':
      case 'rejected':
        rejete++;
        break;
      case 'differe':
      case 'deferred':
        differe++;
        break;
    }
  }

  return {
    total: count || rows.length,
    brouillon,
    soumis,
    valide,
    rejete,
    differe,
    montant_total: montantTotal,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.warn('[generate-dashboard-stats] Request received');

    // 1. Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Non autorise' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify user token
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Token invalide' }, 401);
    }

    // 2. Parse request
    let body: DashboardStatsRequest = {};
    try {
      body = await req.json();
    } catch {
      // GET requests or empty body - use defaults
    }

    const exercice = body.exercice || new Date().getFullYear();
    const directionId = body.direction_id;

    console.warn('[generate-dashboard-stats] Params:', {
      exercice,
      directionId,
      userId: user.id,
    });

    // 3. Aggregate stats for each stage in parallel
    const [notesSefStats, engagementsStats, liquidationsStats, ordonnancementsStats] =
      await Promise.all([
        countByStatus(supabaseAdmin, 'notes_sef', exercice, directionId),
        countByStatus(supabaseAdmin, 'budget_engagements', exercice, directionId),
        countByStatus(supabaseAdmin, 'budget_liquidations', exercice, directionId),
        countByStatus(supabaseAdmin, 'ordonnancements', exercice, directionId),
      ]);

    // 4. Budget execution rate
    let budgetQuery = supabaseAdmin
      .from('budget_lines')
      .select('dotation_initiale, dotation_modifiee, total_engage, disponible_calcule')
      .eq('exercice', exercice);

    if (directionId) {
      budgetQuery = budgetQuery.eq('direction_id', directionId);
    }

    const { data: budgetLines } = await budgetQuery;

    let totalDotation = 0;
    let totalDotationModifiee = 0;
    let totalEngage = 0;
    let totalDisponible = 0;

    for (const line of budgetLines || []) {
      const bl = line as Record<string, unknown>;
      totalDotation += (bl.dotation_initiale as number) || 0;
      totalDotationModifiee +=
        (bl.dotation_modifiee as number) || (bl.dotation_initiale as number) || 0;
      totalEngage += (bl.total_engage as number) || 0;
      totalDisponible += (bl.disponible_calcule as number) || 0;
    }

    const tauxExecution =
      totalDotationModifiee > 0
        ? Math.round((totalEngage / totalDotationModifiee) * 10000) / 100
        : 0;

    // 5. Average processing times (validated docs in last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentValidated } = await supabaseAdmin
      .from('audit_logs')
      .select('entity_type, created_at, old_values, new_values')
      .eq('action', 'workflow_validate')
      .eq('exercice', exercice)
      .gte('created_at', ninetyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(200);

    const delaysByType: Record<string, number[]> = {};

    for (const log of recentValidated || []) {
      const entry = log as Record<string, unknown>;
      const entityType = entry.entity_type as string;
      if (!delaysByType[entityType]) {
        delaysByType[entityType] = [];
      }
      // Each audit log marks a validation event; we track the count
      delaysByType[entityType].push(1);
    }

    const validationCounts: Record<string, number> = {};
    for (const [type, entries] of Object.entries(delaysByType)) {
      validationCounts[type] = entries.length;
    }

    // 6. Pending validations count
    const { count: pendingCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'validation')
      .eq('is_read', false);

    // 7. Recent activity (last 10 audit entries)
    const { data: recentActivity } = await supabaseAdmin
      .from('audit_logs')
      .select('id, entity_type, action, created_at, user_id, entity_id')
      .eq('exercice', exercice)
      .order('created_at', { ascending: false })
      .limit(10);

    console.warn('[generate-dashboard-stats] Stats computed successfully');

    return jsonResponse(
      {
        exercice,
        direction_id: directionId || null,
        generated_at: new Date().toISOString(),

        stages: {
          notes_sef: notesSefStats,
          engagements: engagementsStats,
          liquidations: liquidationsStats,
          ordonnancements: ordonnancementsStats,
        },

        budget: {
          dotation_initiale: totalDotation,
          dotation_modifiee: totalDotationModifiee,
          total_engage: totalEngage,
          total_disponible: totalDisponible,
          taux_execution: tauxExecution,
          nb_lignes: (budgetLines || []).length,
        },

        workflow: {
          pending_validations: pendingCount || 0,
          recent_validations: validationCounts,
        },

        recent_activity: (recentActivity || []).map((a: Record<string, unknown>) => ({
          id: a.id,
          entity_type: a.entity_type,
          action: a.action,
          date: a.created_at,
          user_id: a.user_id,
          entity_id: a.entity_id,
        })),
      },
      200
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('[generate-dashboard-stats] Unexpected error:', error);
    return jsonResponse({ error: message }, 500);
  }
});
