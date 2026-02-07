import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Spending chain stages in order
const SPENDING_STAGES = [
  'note_sef',
  'note_aef',
  'imputation',
  'passation_marche',
  'engagement',
  'liquidation',
  'ordonnancement',
  'reglement',
] as const;

type SpendingStage = (typeof SPENDING_STAGES)[number];

const STAGE_ORDER: Record<SpendingStage, number> = {
  note_sef: 1,
  note_aef: 2,
  imputation: 3,
  passation_marche: 4,
  engagement: 5,
  liquidation: 6,
  ordonnancement: 7,
  reglement: 8,
};

const STAGE_TABLE: Record<SpendingStage, string> = {
  note_sef: 'notes_sef',
  note_aef: 'notes_aef',
  imputation: 'imputations',
  passation_marche: 'passation_marches',
  engagement: 'budget_engagements',
  liquidation: 'budget_liquidations',
  ordonnancement: 'ordonnancements',
  reglement: 'reglements',
};

const STAGE_LABELS: Record<SpendingStage, string> = {
  note_sef: 'Note SEF',
  note_aef: 'Note AEF',
  imputation: 'Imputation',
  passation_marche: 'Passation de marche',
  engagement: 'Engagement',
  liquidation: 'Liquidation',
  ordonnancement: 'Ordonnancement',
  reglement: 'Reglement',
};

// Roles allowed to validate each stage
const STAGE_VALIDATION_ROLES: Record<SpendingStage, { profils: string[]; roles: string[] }> = {
  note_sef: {
    profils: ['Validateur', 'Admin'],
    roles: ['DG', 'ADMIN'],
  },
  note_aef: {
    profils: ['Validateur', 'Admin'],
    roles: ['DIRECTEUR', 'DG', 'ADMIN'],
  },
  imputation: {
    profils: ['Controleur', 'Admin'],
    roles: ['CB', 'ADMIN'],
  },
  passation_marche: {
    profils: ['Validateur', 'Admin'],
    roles: ['DAAF', 'ADMIN'],
  },
  engagement: {
    profils: ['Controleur', 'Admin'],
    roles: ['CB', 'ADMIN'],
  },
  liquidation: {
    profils: ['Validateur', 'Admin'],
    roles: ['DAAF', 'ADMIN'],
  },
  ordonnancement: {
    profils: ['Validateur', 'Admin'],
    roles: ['DG', 'ADMIN'],
  },
  reglement: {
    profils: ['Validateur', 'Admin'],
    roles: ['TRESORERIE', 'ADMIN'],
  },
};

interface ValidateWorkflowRequest {
  entity_type: SpendingStage;
  entity_id: string;
  action: 'validate' | 'reject' | 'defer';
  comment?: string;
  rejection_reason?: string;
  defer_date?: string;
  defer_condition?: string;
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.warn('[validate-workflow] Request received');

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

    // Verify the caller's token
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('[validate-workflow] Auth error:', authError);
      return jsonResponse({ error: 'Token invalide' }, 401);
    }

    // 2. Get user profile and roles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, profil_fonctionnel, role_hierarchique, direction_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[validate-workflow] Profile not found:', profileError);
      return jsonResponse({ error: 'Profil utilisateur introuvable' }, 404);
    }

    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const roleNames = (userRoles || []).map((r: { role: string }) => r.role);

    // 3. Parse request body
    const body: ValidateWorkflowRequest = await req.json();
    console.warn('[validate-workflow] Request:', {
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      action: body.action,
      userId: user.id,
    });

    if (!body.entity_type || !body.entity_id || !body.action) {
      return jsonResponse({ error: 'entity_type, entity_id et action sont requis' }, 400);
    }

    if (!SPENDING_STAGES.includes(body.entity_type)) {
      return jsonResponse(
        {
          error: `Type d'entite invalide: ${body.entity_type}`,
          validTypes: [...SPENDING_STAGES],
        },
        400
      );
    }

    if (!['validate', 'reject', 'defer'].includes(body.action)) {
      return jsonResponse(
        { error: 'Action invalide. Valeurs acceptees: validate, reject, defer' },
        400
      );
    }

    if (body.action === 'reject' && !body.rejection_reason) {
      return jsonResponse({ error: 'Le motif de rejet est obligatoire' }, 400);
    }

    // 4. Verify RBAC permissions
    const stageRoles = STAGE_VALIDATION_ROLES[body.entity_type];
    const hasProfilPermission = stageRoles.profils.includes(profile.profil_fonctionnel || '');
    const hasRolePermission = roleNames.some((r: string) => stageRoles.roles.includes(r));

    if (!hasProfilPermission && !hasRolePermission) {
      console.error('[validate-workflow] Permission denied for user:', {
        userId: user.id,
        profil: profile.profil_fonctionnel,
        roles: roleNames,
        requiredProfils: stageRoles.profils,
        requiredRoles: stageRoles.roles,
      });
      return jsonResponse(
        {
          error: `Vous n'avez pas les droits pour valider une ${STAGE_LABELS[body.entity_type]}`,
          requiredRoles: stageRoles.roles,
        },
        403
      );
    }

    // 5. Fetch the entity
    const tableName = STAGE_TABLE[body.entity_type];
    const { data: entity, error: entityError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('id', body.entity_id)
      .single();

    if (entityError || !entity) {
      console.error('[validate-workflow] Entity not found:', entityError);
      return jsonResponse({ error: `Document introuvable dans ${tableName}` }, 404);
    }

    // 6. Verify business conditions
    const currentStatut = entity.statut || entity.status;

    // Cannot validate already validated/rejected documents
    if (body.action === 'validate' && currentStatut === 'valide') {
      return jsonResponse({ error: 'Ce document est deja valide' }, 409);
    }
    if (body.action === 'reject' && currentStatut === 'rejete') {
      return jsonResponse({ error: 'Ce document est deja rejete' }, 409);
    }

    // For engagement: check budget availability
    if (body.entity_type === 'engagement' && body.action === 'validate') {
      const montant = entity.montant || entity.montant_ttc || 0;
      if (entity.budget_line_id) {
        const { data: budgetLine } = await supabaseAdmin
          .from('budget_lines')
          .select('disponible_calcule, code, label')
          .eq('id', entity.budget_line_id)
          .single();

        if (budgetLine) {
          const disponible = budgetLine.disponible_calcule || 0;
          if (montant > disponible) {
            return jsonResponse(
              {
                error: 'Budget insuffisant',
                details: {
                  montant_engagement: montant,
                  budget_disponible: disponible,
                  ligne_budgetaire: budgetLine.code,
                },
              },
              422
            );
          }
        }
      }
    }

    // For liquidation: check engagement amount
    if (body.entity_type === 'liquidation' && body.action === 'validate') {
      const montantLiquid = entity.montant || 0;
      if (entity.engagement_id) {
        const { data: engagement } = await supabaseAdmin
          .from('budget_engagements')
          .select('montant, montant_ttc')
          .eq('id', entity.engagement_id)
          .single();

        if (engagement) {
          const montantEngage = engagement.montant_ttc || engagement.montant || 0;
          if (montantLiquid > montantEngage) {
            return jsonResponse(
              {
                error: "Le montant de la liquidation depasse le montant de l'engagement",
                details: {
                  montant_liquidation: montantLiquid,
                  montant_engagement: montantEngage,
                },
              },
              422
            );
          }
        }
      }
    }

    // 7. Perform the status transition
    const now = new Date().toISOString();
    let updateData: Record<string, unknown> = {};

    switch (body.action) {
      case 'validate':
        updateData = {
          statut: 'valide',
          validated_by: user.id,
          validated_at: now,
          validation_comment: body.comment || null,
        };
        break;
      case 'reject':
        updateData = {
          statut: 'rejete',
          rejected_by: user.id,
          rejected_at: now,
          rejection_reason: body.rejection_reason,
          rejection_comment: body.comment || null,
        };
        break;
      case 'defer':
        updateData = {
          statut: 'differe',
          differe_par: user.id,
          differe_at: now,
          differe_motif: body.comment || body.rejection_reason || null,
          differe_condition: body.defer_condition || null,
          differe_date_reprise: body.defer_date || null,
        };
        break;
    }

    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq('id', body.entity_id);

    if (updateError) {
      console.error('[validate-workflow] Update error:', updateError);
      return jsonResponse(
        {
          error: 'Erreur lors de la mise a jour du statut',
          details: updateError.message,
        },
        500
      );
    }

    // 8. Create audit log entry
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      action: `workflow_${body.action}`,
      user_id: user.id,
      old_values: { statut: currentStatut },
      new_values: updateData,
      exercice: entity.exercice || new Date().getFullYear(),
    });

    if (auditError) {
      console.error('[validate-workflow] Audit log error:', auditError);
      // Non-blocking, continue
    }

    // 9. Send notification to next validator (on validation only)
    if (body.action === 'validate') {
      const currentOrder = STAGE_ORDER[body.entity_type];
      const nextStage = SPENDING_STAGES.find((s) => STAGE_ORDER[s] === currentOrder + 1);

      if (nextStage) {
        const nextRoles = STAGE_VALIDATION_ROLES[nextStage];
        // Find users with the required roles
        const { data: nextValidators } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .in('profil_fonctionnel', nextRoles.profils)
          .eq('is_active', true)
          .limit(10);

        if (nextValidators && nextValidators.length > 0) {
          const entityNumero = entity.numero || entity.reference || body.entity_id;
          const notifications = nextValidators.map(
            (validator: { id: string; full_name: string | null }) => ({
              user_id: validator.id,
              type: 'validation',
              title: `${STAGE_LABELS[body.entity_type]} validee - Action requise`,
              message: `La ${STAGE_LABELS[body.entity_type]} ${entityNumero} a ete validee. Veuillez traiter l'etape suivante: ${STAGE_LABELS[nextStage]}.`,
              entity_type: body.entity_type,
              entity_id: body.entity_id,
              is_read: false,
            })
          );

          const { error: notifError } = await supabaseAdmin
            .from('notifications')
            .insert(notifications);

          if (notifError) {
            console.error('[validate-workflow] Notification error:', notifError);
          }
        }
      }
    }

    // On rejection, notify the creator
    if (body.action === 'reject') {
      const creatorId = entity.created_by || entity.demandeur_id;
      if (creatorId) {
        const entityNumero = entity.numero || entity.reference || body.entity_id;
        await supabaseAdmin.from('notifications').insert({
          user_id: creatorId,
          type: 'rejet',
          title: `${STAGE_LABELS[body.entity_type]} rejetee`,
          message: `Votre ${STAGE_LABELS[body.entity_type]} ${entityNumero} a ete rejetee. Motif: ${body.rejection_reason}`,
          entity_type: body.entity_type,
          entity_id: body.entity_id,
          is_read: false,
        });
      }
    }

    console.warn('[validate-workflow] Success:', {
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      action: body.action,
      new_statut: updateData.statut,
    });

    return jsonResponse(
      {
        success: true,
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        action: body.action,
        new_statut: updateData.statut,
        validated_by: profile.full_name,
        timestamp: now,
      },
      200
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('[validate-workflow] Unexpected error:', error);
    return jsonResponse({ error: message }, 500);
  }
});
