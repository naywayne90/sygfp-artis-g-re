import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== Types =====

type WorkflowModule =
  | 'notes_sef'
  | 'notes_dg'
  | 'expressions_besoin'
  | 'marches'
  | 'budget_engagements'
  | 'budget_liquidations'
  | 'ordonnancements'
  | 'reglements';

type WorkflowAction =
  | 'soumettre'
  | 'valider'
  | 'rejeter'
  | 'differer'
  | 'resoumettre'
  | 'imputer'
  | 'viser'
  | 'signer'
  | 'confirmer_paiement'
  | 'refuser_paiement';

interface WorkflowValidationRequest {
  action: WorkflowAction;
  module: WorkflowModule;
  entity_id: string;
  motif?: string;
  metadata?: Record<string, unknown>;
}

interface _TransitionRule {
  from_status: string;
  to_status: string;
  action_code: string;
  requires_motif: boolean;
  requires_budget_check: boolean;
  allowed_roles: string[];
}

interface UserProfile {
  id: string;
  full_name: string | null;
  profil_fonctionnel: string | null;
  role_hierarchique: string | null;
  direction_id: string | null;
}

// ===== Action to transition mapping =====

const ACTION_TO_STATUS: Record<WorkflowAction, string> = {
  soumettre: 'soumis',
  valider: 'valide',
  rejeter: 'rejete',
  differer: 'differe',
  resoumettre: 'soumis',
  imputer: 'impute',
  viser: 'vise',
  signer: 'signe',
  confirmer_paiement: 'paye',
  refuser_paiement: 'paiement_refuse',
};

const MODULE_TABLE_MAP: Record<WorkflowModule, string> = {
  notes_sef: 'notes_sef',
  notes_dg: 'notes_dg',
  expressions_besoin: 'expressions_besoin',
  marches: 'marches',
  budget_engagements: 'budget_engagements',
  budget_liquidations: 'budget_liquidations',
  ordonnancements: 'ordonnancements',
  reglements: 'reglements',
};

// ===== Helpers =====

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ===== Main handler =====

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Non autorise' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !caller) {
      return jsonResponse({ error: 'Token invalide' }, 401);
    }

    // 2. Parse and validate request
    const body: WorkflowValidationRequest = await req.json();
    console.warn('[workflow-validation] Request:', {
      action: body.action,
      module: body.module,
      entity_id: body.entity_id,
      user_id: caller.id,
    });

    if (!body.action || !body.module || !body.entity_id) {
      return jsonResponse({ error: 'Champs requis: action, module, entity_id' }, 400);
    }

    if (!MODULE_TABLE_MAP[body.module]) {
      return jsonResponse({ error: `Module inconnu: ${body.module}` }, 400);
    }

    const toStatus = ACTION_TO_STATUS[body.action];
    if (!toStatus) {
      return jsonResponse({ error: `Action inconnue: ${body.action}` }, 400);
    }

    // 3. Get caller profile and roles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, profil_fonctionnel, role_hierarchique, direction_id')
      .eq('id', caller.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse({ error: 'Profil utilisateur introuvable' }, 404);
    }

    const callerProfile = profile as UserProfile;

    // 4. Get entity current status
    const tableName = MODULE_TABLE_MAP[body.module];
    const { data: entity, error: entityError } = await supabaseAdmin
      .from(tableName)
      .select('id, statut, exercice, budget_line_id, montant')
      .eq('id', body.entity_id)
      .single();

    if (entityError || !entity) {
      return jsonResponse({ error: `Entite introuvable dans ${tableName}` }, 404);
    }

    const currentStatus = (entity as Record<string, unknown>).statut as string;

    // 5. Validate transition is allowed via RPC
    const { data: transitionCheck, error: transitionError } = await supabaseAdmin.rpc(
      'can_transition',
      {
        p_module: body.module,
        p_from_status: currentStatus,
        p_to_status: toStatus,
      }
    );

    if (transitionError) {
      console.error('[workflow-validation] Transition check error:', transitionError);
      return jsonResponse(
        {
          error: 'Erreur lors de la verification de la transition',
          details: transitionError.message,
        },
        500
      );
    }

    const checkResult = transitionCheck && transitionCheck.length > 0 ? transitionCheck[0] : null;

    if (!checkResult || !checkResult.allowed) {
      return jsonResponse(
        {
          error: 'Transition non autorisee',
          reason: checkResult?.reason || `Transition ${currentStatus} -> ${toStatus} non permise`,
          from_status: currentStatus,
          to_status: toStatus,
        },
        403
      );
    }

    // 6. Validate motif if required
    if (checkResult.requires_motif && !body.motif) {
      return jsonResponse(
        {
          error: 'Motif requis pour cette action',
          action: body.action,
          requires_motif: true,
        },
        400
      );
    }

    // 7. Budget availability check for engagements
    if (
      body.action === 'valider' &&
      body.module === 'budget_engagements' &&
      (entity as Record<string, unknown>).budget_line_id
    ) {
      const budgetLineId = (entity as Record<string, unknown>).budget_line_id as string;
      const montant = ((entity as Record<string, unknown>).montant as number) || 0;

      const { data: budgetLine, error: blError } = await supabaseAdmin
        .from('budget_lines')
        .select('id, code, label, disponible_calcule')
        .eq('id', budgetLineId)
        .single();

      if (!blError && budgetLine) {
        const disponible =
          ((budgetLine as Record<string, unknown>).disponible_calcule as number) || 0;
        if (montant > disponible) {
          return jsonResponse(
            {
              error: 'Budget insuffisant',
              montant_engagement: montant,
              disponible_ligne: disponible,
              code_ligne: (budgetLine as Record<string, unknown>).code,
              label_ligne: (budgetLine as Record<string, unknown>).label,
            },
            422
          );
        }
      }
    }

    // 8. Execute the transition via RPC
    const { data: execResult, error: execError } = await supabaseAdmin.rpc('execute_transition', {
      p_module: body.module,
      p_entity_id: body.entity_id,
      p_entity_code: null,
      p_from_status: currentStatus,
      p_to_status: toStatus,
      p_motif: body.motif || null,
      p_metadata: JSON.stringify({
        ...(body.metadata || {}),
        triggered_by: 'edge_function',
        user_id: caller.id,
        user_name: callerProfile.full_name,
        user_role: callerProfile.role_hierarchique,
        user_profil: callerProfile.profil_fonctionnel,
      }),
    });

    if (execError) {
      console.error('[workflow-validation] Execute error:', execError);
      return jsonResponse(
        {
          error: "Erreur lors de l'execution de la transition",
          details: execError.message,
        },
        500
      );
    }

    const execData = execResult && execResult.length > 0 ? execResult[0] : null;
    if (!execData || !execData.success) {
      return jsonResponse(
        {
          error: 'Echec de la transition',
          message: execData?.message || 'Erreur inconnue',
        },
        422
      );
    }

    // 9. Update entity fields based on action
    const updates: Record<string, unknown> = {
      statut: toStatus,
    };

    if (toStatus === 'differe' && body.motif) {
      updates.motif_differe = body.motif;
      updates.date_differe = new Date().toISOString();
      updates.differe_by = caller.id;
    }

    if (toStatus === 'rejete' && body.motif) {
      updates.rejection_reason = body.motif;
      updates.rejected_at = new Date().toISOString();
      updates.rejected_by = caller.id;
    }

    if (toStatus === 'valide') {
      updates.validated_at = new Date().toISOString();
      updates.validated_by = caller.id;
    }

    if (toStatus === 'soumis' && currentStatus === 'brouillon') {
      updates.submitted_at = new Date().toISOString();
      updates.submitted_by = caller.id;
    }

    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update(updates)
      .eq('id', body.entity_id);

    if (updateError) {
      console.error('[workflow-validation] Update error:', updateError);
      // Transition was logged but entity update failed - partial success
      return jsonResponse(
        {
          success: true,
          warning: 'Transition enregistree mais mise a jour partielle',
          details: updateError.message,
          from_status: currentStatus,
          to_status: toStatus,
        },
        207
      );
    }

    // 10. Create notification for relevant users
    try {
      const notificationMessage = buildNotificationMessage(
        body.action,
        body.module,
        callerProfile.full_name || 'Utilisateur'
      );

      if (notificationMessage) {
        await supabaseAdmin.from('notifications').insert({
          user_id: caller.id,
          type: getNotificationType(body.action),
          title: notificationMessage.title,
          message: notificationMessage.message,
          entity_type: body.module,
          entity_id: body.entity_id,
          is_read: false,
        });
      }
    } catch (notifError) {
      // Non-blocking - notification failure should not break the workflow
      console.error('[workflow-validation] Notification error:', notifError);
    }

    console.warn('[workflow-validation] Success:', {
      module: body.module,
      entity_id: body.entity_id,
      from: currentStatus,
      to: toStatus,
      by: caller.id,
    });

    return jsonResponse(
      {
        success: true,
        from_status: currentStatus,
        to_status: toStatus,
        action_code: execData.action_code,
        message: execData.message,
        performed_by: {
          id: caller.id,
          name: callerProfile.full_name,
          role: callerProfile.role_hierarchique,
        },
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('[workflow-validation] Unexpected error:', error);
    return jsonResponse({ error: errorMessage }, 500);
  }
});

// ===== Notification helpers =====

function getNotificationType(action: WorkflowAction): string {
  switch (action) {
    case 'valider':
      return 'validation';
    case 'rejeter':
      return 'rejet';
    case 'differer':
      return 'differe';
    default:
      return 'info';
  }
}

function buildNotificationMessage(
  action: WorkflowAction,
  module: WorkflowModule,
  userName: string
): { title: string; message: string } | null {
  const moduleLabels: Record<WorkflowModule, string> = {
    notes_sef: 'Note SEF',
    notes_dg: 'Note AEF',
    expressions_besoin: 'Expression de besoin',
    marches: 'Marche',
    budget_engagements: 'Engagement',
    budget_liquidations: 'Liquidation',
    ordonnancements: 'Ordonnancement',
    reglements: 'Reglement',
  };

  const moduleLabel = moduleLabels[module];

  switch (action) {
    case 'soumettre':
      return {
        title: `${moduleLabel} soumis(e)`,
        message: `${userName} a soumis un(e) ${moduleLabel.toLowerCase()} pour validation`,
      };
    case 'valider':
      return {
        title: `${moduleLabel} valide(e)`,
        message: `${userName} a valide un(e) ${moduleLabel.toLowerCase()}`,
      };
    case 'rejeter':
      return {
        title: `${moduleLabel} rejete(e)`,
        message: `${userName} a rejete un(e) ${moduleLabel.toLowerCase()}`,
      };
    case 'differer':
      return {
        title: `${moduleLabel} differe(e)`,
        message: `${userName} a differe un(e) ${moduleLabel.toLowerCase()}`,
      };
    default:
      return null;
  }
}
