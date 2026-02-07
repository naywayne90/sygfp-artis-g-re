import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== Types =====

type AlertAction = 'check' | 'acknowledge' | 'resolve' | 'list' | 'summary';

type AlertNiveau = 'info' | 'warning' | 'critical' | 'blocking';

interface AlertRequest {
  action: AlertAction;
  exercice?: number;
  alert_id?: string;
  comment?: string;
}

interface BudgetLineData {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_modifiee: number | null;
  disponible_calcule: number | null;
  total_engage: number | null;
  direction_id: string | null;
}

interface AlertRuleData {
  id: string;
  seuil_pct: number;
  scope: 'GLOBAL' | 'PAR_LIGNE';
  actif: boolean;
  destinataires_roles: string[];
  description: string | null;
}

interface GeneratedAlert {
  rule_id: string;
  ligne_budgetaire_id: string;
  niveau: AlertNiveau;
  seuil_atteint: number;
  taux_actuel: number;
  montant_dotation: number;
  montant_engage: number;
  montant_disponible: number;
  message: string;
  context: Record<string, unknown>;
}

interface AlertSummary {
  total_alerts: number;
  by_niveau: Record<AlertNiveau, number>;
  unacknowledged: number;
  unresolved: number;
  top_overbudget: Array<{
    code: string;
    label: string;
    depassement: number;
    taux: number;
  }>;
  total_depassement: number;
}

// ===== Helpers =====

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function determineNiveau(tauxConsommation: number, seuil: number): AlertNiveau {
  if (tauxConsommation >= 100) return 'blocking';
  if (tauxConsommation >= 95) return 'critical';
  if (tauxConsommation >= seuil) return 'warning';
  return 'info';
}

function buildAlertMessage(
  lineCode: string,
  lineLabel: string,
  tauxConsommation: number,
  disponible: number,
  niveau: AlertNiveau
): string {
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.abs(disponible));

  if (niveau === 'blocking') {
    return `DEPASSEMENT: La ligne ${lineCode} (${lineLabel}) a depasse sa dotation. Deficit: ${formatted} FCFA`;
  }
  if (niveau === 'critical') {
    return `CRITIQUE: La ligne ${lineCode} (${lineLabel}) est a ${tauxConsommation.toFixed(1)}% de consommation. Reste: ${formatted} FCFA`;
  }
  if (niveau === 'warning') {
    return `ATTENTION: La ligne ${lineCode} (${lineLabel}) atteint ${tauxConsommation.toFixed(1)}% de consommation. Reste: ${formatted} FCFA`;
  }
  return `INFO: La ligne ${lineCode} (${lineLabel}) est a ${tauxConsommation.toFixed(1)}% de consommation`;
}

// ===== Action handlers =====

async function checkBudgetAlerts(
  supabase: ReturnType<typeof createClient>,
  exercice: number
): Promise<{ new_alerts: number; alerts: GeneratedAlert[] }> {
  // 1. Get active alert rules
  const { data: rules, error: rulesError } = await supabase
    .from('budg_alert_rules')
    .select('*')
    .eq('actif', true);

  if (rulesError) throw rulesError;

  const activeRules = (rules || []) as AlertRuleData[];

  if (activeRules.length === 0) {
    return { new_alerts: 0, alerts: [] };
  }

  // 2. Get budget lines with execution data
  const { data: lines, error: linesError } = await supabase
    .from('budget_lines')
    .select(
      'id, code, label, dotation_initiale, dotation_modifiee, disponible_calcule, total_engage, direction_id'
    )
    .eq('exercice', exercice)
    .eq('is_active', true);

  if (linesError) throw linesError;

  const budgetLines = (lines || []) as BudgetLineData[];

  // 3. Get existing unresolved alerts to avoid duplicates
  const { data: existingAlerts } = await supabase
    .from('budg_alerts')
    .select('ligne_budgetaire_id, rule_id')
    .eq('exercice', exercice)
    .is('resolved_at', null);

  const existingSet = new Set(
    (existingAlerts || []).map(
      (a: { ligne_budgetaire_id: string | null; rule_id: string | null }) =>
        `${a.ligne_budgetaire_id}_${a.rule_id}`
    )
  );

  // 4. Evaluate each line against each rule
  const newAlerts: GeneratedAlert[] = [];

  for (const line of budgetLines) {
    const dotation = (line.dotation_modifiee ?? line.dotation_initiale) || 0;
    if (dotation <= 0) continue;

    const engage = line.total_engage || 0;
    const disponible = line.disponible_calcule ?? dotation - engage;
    const tauxConsommation = (engage / dotation) * 100;

    for (const rule of activeRules) {
      // Skip if alert already exists for this line/rule combo
      const key = `${line.id}_${rule.id}`;
      if (existingSet.has(key)) continue;

      // Check if threshold is exceeded
      if (tauxConsommation >= rule.seuil_pct) {
        const niveau = determineNiveau(tauxConsommation, rule.seuil_pct);
        const message = buildAlertMessage(
          line.code,
          line.label,
          tauxConsommation,
          disponible,
          niveau
        );

        newAlerts.push({
          rule_id: rule.id,
          ligne_budgetaire_id: line.id,
          niveau,
          seuil_atteint: rule.seuil_pct,
          taux_actuel: Math.round(tauxConsommation * 100) / 100,
          montant_dotation: dotation,
          montant_engage: engage,
          montant_disponible: disponible,
          message,
          context: {
            code: line.code,
            label: line.label,
            direction_id: line.direction_id,
            rule_description: rule.description,
          },
        });
      }
    }
  }

  // 5. Insert new alerts
  if (newAlerts.length > 0) {
    const insertData = newAlerts.map((a) => ({
      rule_id: a.rule_id,
      exercice,
      ligne_budgetaire_id: a.ligne_budgetaire_id,
      niveau: a.niveau,
      seuil_atteint: a.seuil_atteint,
      taux_actuel: a.taux_actuel,
      montant_dotation: a.montant_dotation,
      montant_engage: a.montant_engage,
      montant_disponible: a.montant_disponible,
      message: a.message,
      context: a.context,
    }));

    const { error: insertError } = await supabase.from('budg_alerts').insert(insertData);

    if (insertError) {
      console.error('[budget-alerts] Insert error:', insertError);
      throw insertError;
    }
  }

  return { new_alerts: newAlerts.length, alerts: newAlerts };
}

async function getAlertsSummary(
  supabase: ReturnType<typeof createClient>,
  exercice: number
): Promise<AlertSummary> {
  // Get all alerts for exercice
  const { data: alerts, error } = await supabase
    .from('budg_alerts')
    .select('id, niveau, acknowledged_at, resolved_at, montant_disponible, taux_actuel, context')
    .eq('exercice', exercice);

  if (error) throw error;

  const allAlerts = (alerts || []) as Array<{
    id: string;
    niveau: AlertNiveau;
    acknowledged_at: string | null;
    resolved_at: string | null;
    montant_disponible: number | null;
    taux_actuel: number | null;
    context: Record<string, unknown>;
  }>;

  const byNiveau: Record<AlertNiveau, number> = {
    info: 0,
    warning: 0,
    critical: 0,
    blocking: 0,
  };

  let unacknowledged = 0;
  let unresolved = 0;
  let totalDepassement = 0;
  const overbudgetLines: Array<{
    code: string;
    label: string;
    depassement: number;
    taux: number;
  }> = [];

  for (const alert of allAlerts) {
    byNiveau[alert.niveau]++;
    if (!alert.acknowledged_at) unacknowledged++;
    if (!alert.resolved_at) unresolved++;

    if (
      alert.niveau === 'blocking' &&
      alert.montant_disponible !== null &&
      alert.montant_disponible < 0
    ) {
      const depassement = Math.abs(alert.montant_disponible);
      totalDepassement += depassement;
      overbudgetLines.push({
        code: (alert.context?.code as string) || 'N/A',
        label: (alert.context?.label as string) || 'N/A',
        depassement,
        taux: alert.taux_actuel || 0,
      });
    }
  }

  // Sort by depassement descending
  overbudgetLines.sort((a, b) => b.depassement - a.depassement);

  return {
    total_alerts: allAlerts.length,
    by_niveau: byNiveau,
    unacknowledged,
    unresolved,
    top_overbudget: overbudgetLines.slice(0, 10),
    total_depassement: totalDepassement,
  };
}

async function acknowledgeAlert(
  supabase: ReturnType<typeof createClient>,
  alertId: string,
  userId: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('budg_alerts')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
    })
    .eq('id', alertId)
    .is('acknowledged_at', null);

  if (error) throw error;
  return { success: true };
}

async function resolveAlert(
  supabase: ReturnType<typeof createClient>,
  alertId: string,
  userId: string,
  comment?: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from('budg_alerts')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
      resolution_comment: comment || null,
    })
    .eq('id', alertId)
    .is('resolved_at', null);

  if (error) throw error;
  return { success: true };
}

async function listAlerts(
  supabase: ReturnType<typeof createClient>,
  exercice: number
): Promise<unknown[]> {
  const { data, error } = await supabase
    .from('budg_alerts')
    .select(
      `
      *,
      budget_line:ligne_budgetaire_id(id, code, label)
    `
    )
    .eq('exercice', exercice)
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
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
    const body: AlertRequest = await req.json();
    console.warn('[budget-alerts] Request:', {
      action: body.action,
      exercice: body.exercice,
      alert_id: body.alert_id,
      user_id: user.id,
    });

    if (!body.action) {
      return jsonResponse({ error: 'Champ requis: action' }, 400);
    }

    const validActions: AlertAction[] = ['check', 'acknowledge', 'resolve', 'list', 'summary'];
    if (!validActions.includes(body.action)) {
      return jsonResponse({ error: `Action invalide: ${body.action}` }, 400);
    }

    // 3. Execute action
    switch (body.action) {
      case 'check': {
        if (!body.exercice) {
          return jsonResponse({ error: "Champ requis: exercice pour l'action check" }, 400);
        }

        const result = await checkBudgetAlerts(supabase, body.exercice);

        // Send notification if there are new critical/blocking alerts
        const criticalAlerts = result.alerts.filter(
          (a) => a.niveau === 'critical' || a.niveau === 'blocking'
        );
        if (criticalAlerts.length > 0) {
          try {
            // Notify admins and financial controllers
            const { data: adminProfiles } = await supabase
              .from('profiles')
              .select('id')
              .in('profil_fonctionnel', ['Admin', 'Controleur', 'Validateur'])
              .eq('is_active', true);

            if (adminProfiles && adminProfiles.length > 0) {
              const notifications = adminProfiles.map((p: { id: string }) => ({
                user_id: p.id,
                type: 'alerte',
                title: `${criticalAlerts.length} alerte(s) budgetaire(s) critique(s)`,
                message: `${criticalAlerts.length} ligne(s) budgetaire(s) ont atteint un seuil critique de consommation pour l'exercice ${body.exercice}`,
                entity_type: 'budget_alert',
                is_read: false,
              }));

              await supabase.from('notifications').insert(notifications);
            }
          } catch (notifError) {
            console.error('[budget-alerts] Notification error:', notifError);
          }
        }

        console.warn('[budget-alerts] Check complete:', {
          new_alerts: result.new_alerts,
          critical: criticalAlerts.length,
        });

        return jsonResponse(
          {
            success: true,
            new_alerts: result.new_alerts,
            critical_count: criticalAlerts.length,
            alerts: result.alerts.map((a) => ({
              niveau: a.niveau,
              message: a.message,
              taux: a.taux_actuel,
              ligne: a.context.code,
            })),
          },
          200
        );
      }

      case 'acknowledge': {
        if (!body.alert_id) {
          return jsonResponse({ error: "Champ requis: alert_id pour l'action acknowledge" }, 400);
        }
        const result = await acknowledgeAlert(supabase, body.alert_id, user.id);
        return jsonResponse({ success: result.success }, 200);
      }

      case 'resolve': {
        if (!body.alert_id) {
          return jsonResponse({ error: "Champ requis: alert_id pour l'action resolve" }, 400);
        }
        const result = await resolveAlert(supabase, body.alert_id, user.id, body.comment);
        return jsonResponse({ success: result.success }, 200);
      }

      case 'list': {
        if (!body.exercice) {
          return jsonResponse({ error: "Champ requis: exercice pour l'action list" }, 400);
        }
        const alerts = await listAlerts(supabase, body.exercice);
        return jsonResponse({ success: true, count: alerts.length, alerts }, 200);
      }

      case 'summary': {
        if (!body.exercice) {
          return jsonResponse({ error: "Champ requis: exercice pour l'action summary" }, 400);
        }
        const summary = await getAlertsSummary(supabase, body.exercice);
        return jsonResponse({ success: true, ...summary }, 200);
      }

      default:
        return jsonResponse({ error: 'Action non supportee' }, 400);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('[budget-alerts] Error:', error);
    return jsonResponse({ error: errorMessage }, 500);
  }
});
