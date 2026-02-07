import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ENTITY_TYPES = [
  'note_sef',
  'note_aef',
  'engagement',
  'liquidation',
  'ordonnancement',
] as const;

type EntityType = (typeof VALID_ENTITY_TYPES)[number];

const ENTITY_TABLE: Record<EntityType, string> = {
  note_sef: 'notes_sef',
  note_aef: 'notes_aef',
  engagement: 'budget_engagements',
  liquidation: 'budget_liquidations',
  ordonnancement: 'ordonnancements',
};

const ENTITY_LABELS: Record<EntityType, string> = {
  note_sef: 'Note SEF',
  note_aef: 'Note AEF',
  engagement: 'Engagement',
  liquidation: 'Liquidation',
  ordonnancement: 'Ordonnancement',
};

// Roles allowed to perform bulk validation per entity type
const BULK_VALIDATION_ROLES: Record<EntityType, string[]> = {
  note_sef: ['Admin', 'Validateur'],
  note_aef: ['Admin', 'Validateur'],
  engagement: ['Admin', 'Controleur'],
  liquidation: ['Admin', 'Validateur'],
  ordonnancement: ['Admin', 'Validateur'],
};

interface BulkOperationRequest {
  operation: 'validate' | 'reject' | 'export';
  entity_type: EntityType;
  entity_ids: string[];
  comment?: string;
  rejection_reason?: string;
  export_format?: 'csv' | 'json';
}

interface OperationResult {
  entity_id: string;
  success: boolean;
  error?: string;
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
    console.warn('[bulk-operations] Request received');

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

    // 2. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, profil_fonctionnel, role_hierarchique')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse({ error: 'Profil utilisateur introuvable' }, 404);
    }

    // 3. Parse request
    const body: BulkOperationRequest = await req.json();

    if (!body.operation || !body.entity_type || !body.entity_ids) {
      return jsonResponse({ error: 'operation, entity_type et entity_ids sont requis' }, 400);
    }

    if (!['validate', 'reject', 'export'].includes(body.operation)) {
      return jsonResponse(
        { error: 'Operation invalide. Valeurs acceptees: validate, reject, export' },
        400
      );
    }

    if (!VALID_ENTITY_TYPES.includes(body.entity_type as EntityType)) {
      return jsonResponse(
        {
          error: `Type d'entite invalide: ${body.entity_type}`,
          validTypes: [...VALID_ENTITY_TYPES],
        },
        400
      );
    }

    if (!Array.isArray(body.entity_ids) || body.entity_ids.length === 0) {
      return jsonResponse({ error: 'entity_ids doit etre un tableau non vide' }, 400);
    }

    // Limit batch size
    const MAX_BATCH_SIZE = 100;
    if (body.entity_ids.length > MAX_BATCH_SIZE) {
      return jsonResponse(
        {
          error: `Le nombre maximum d'elements par lot est ${MAX_BATCH_SIZE}`,
          received: body.entity_ids.length,
        },
        400
      );
    }

    if (body.operation === 'reject' && !body.rejection_reason) {
      return jsonResponse({ error: 'Le motif de rejet est obligatoire pour un rejet en lot' }, 400);
    }

    console.warn('[bulk-operations] Processing:', {
      operation: body.operation,
      entity_type: body.entity_type,
      count: body.entity_ids.length,
      userId: user.id,
    });

    // 4. Check RBAC permissions for validate/reject
    if (body.operation === 'validate' || body.operation === 'reject') {
      const allowedProfils = BULK_VALIDATION_ROLES[body.entity_type];
      if (!allowedProfils.includes(profile.profil_fonctionnel || '')) {
        return jsonResponse(
          {
            error: `Vous n'avez pas les droits pour effectuer cette operation en lot sur les ${ENTITY_LABELS[body.entity_type]}`,
          },
          403
        );
      }
    }

    // 5. Execute the operation
    const tableName = ENTITY_TABLE[body.entity_type];

    if (body.operation === 'export') {
      return await handleBulkExport(
        supabaseAdmin,
        tableName,
        body.entity_type,
        body.entity_ids,
        body.export_format || 'json'
      );
    }

    // Bulk validate or reject
    const results: OperationResult[] = [];
    const now = new Date().toISOString();
    const exercice = new Date().getFullYear();

    for (const entityId of body.entity_ids) {
      try {
        // Fetch entity to verify its current status
        const { data: entity, error: fetchError } = await supabaseAdmin
          .from(tableName)
          .select('id, statut, numero, exercice')
          .eq('id', entityId)
          .single();

        if (fetchError || !entity) {
          results.push({
            entity_id: entityId,
            success: false,
            error: 'Document introuvable',
          });
          continue;
        }

        const currentStatut = (entity as Record<string, unknown>).statut as string;

        // Skip already processed documents
        if (body.operation === 'validate' && currentStatut === 'valide') {
          results.push({
            entity_id: entityId,
            success: false,
            error: 'Deja valide',
          });
          continue;
        }
        if (body.operation === 'reject' && currentStatut === 'rejete') {
          results.push({
            entity_id: entityId,
            success: false,
            error: 'Deja rejete',
          });
          continue;
        }

        // Only allow bulk operations on submitted/pending documents
        const validStatuts = ['soumis', 'a_valider', 'en_attente'];
        if (!validStatuts.includes(currentStatut)) {
          results.push({
            entity_id: entityId,
            success: false,
            error: `Statut "${currentStatut}" ne permet pas cette operation`,
          });
          continue;
        }

        // Perform update
        let updateData: Record<string, unknown>;

        if (body.operation === 'validate') {
          updateData = {
            statut: 'valide',
            validated_by: user.id,
            validated_at: now,
            validation_comment: body.comment || 'Validation en lot',
          };
        } else {
          updateData = {
            statut: 'rejete',
            rejected_by: user.id,
            rejected_at: now,
            rejection_reason: body.rejection_reason,
            rejection_comment: body.comment || null,
          };
        }

        const { error: updateError } = await supabaseAdmin
          .from(tableName)
          .update(updateData)
          .eq('id', entityId);

        if (updateError) {
          results.push({
            entity_id: entityId,
            success: false,
            error: updateError.message,
          });
          continue;
        }

        // Create audit log
        await supabaseAdmin.from('audit_logs').insert({
          entity_type: body.entity_type,
          entity_id: entityId,
          action: `bulk_${body.operation}`,
          user_id: user.id,
          old_values: { statut: currentStatut },
          new_values: updateData,
          exercice: (entity as Record<string, unknown>).exercice || exercice,
        });

        results.push({ entity_id: entityId, success: true });
      } catch (itemError: unknown) {
        const msg = itemError instanceof Error ? itemError.message : 'Erreur inattendue';
        results.push({ entity_id: entityId, success: false, error: msg });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.warn('[bulk-operations] Complete:', {
      operation: body.operation,
      total: body.entity_ids.length,
      succeeded,
      failed,
    });

    return jsonResponse(
      {
        success: true,
        operation: body.operation,
        entity_type: body.entity_type,
        total: body.entity_ids.length,
        succeeded,
        failed,
        results,
        timestamp: now,
        performed_by: profile.full_name,
      },
      200
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('[bulk-operations] Unexpected error:', error);
    return jsonResponse({ error: message }, 500);
  }
});

async function handleBulkExport(
  supabase: ReturnType<typeof createClient>,
  tableName: string,
  entityType: EntityType,
  entityIds: string[],
  format: 'csv' | 'json'
): Promise<Response> {
  const { data: entities, error } = await supabase.from(tableName).select('*').in('id', entityIds);

  if (error) {
    return jsonResponse(
      { error: `Erreur lors de la recuperation des donnees: ${error.message}` },
      500
    );
  }

  if (!entities || entities.length === 0) {
    return jsonResponse({ error: 'Aucun document trouve' }, 404);
  }

  if (format === 'json') {
    return new Response(
      JSON.stringify({
        entity_type: entityType,
        count: entities.length,
        exported_at: new Date().toISOString(),
        data: entities,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${entityType}_export_${Date.now()}.json"`,
        },
      }
    );
  }

  // CSV format
  if (entities.length === 0) {
    return jsonResponse({ error: 'Aucune donnee a exporter' }, 404);
  }

  const headers = Object.keys(entities[0] as Record<string, unknown>);
  const BOM = '\uFEFF';
  const csvRows = [headers.join(';')];

  for (const entity of entities) {
    const row = headers.map((h) => {
      const val = (entity as Record<string, unknown>)[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(';'));
  }

  const csvContent = BOM + csvRows.join('\n');

  return new Response(csvContent, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${entityType}_export_${Date.now()}.csv"`,
    },
  });
}
