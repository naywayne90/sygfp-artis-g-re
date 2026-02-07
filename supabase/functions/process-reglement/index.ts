import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessReglementRequest {
  ordonnancement_id: string;
  date_paiement: string;
  montant: number;
  mode_paiement: string;
  reference_paiement?: string;
  compte_bancaire_arti?: string;
  banque_arti?: string;
  observation?: string;
  exercice: number;
}

interface ProcessResult {
  success: boolean;
  reglement_id: string;
  reglement_numero: string;
  montant: number;
  is_fully_paid: boolean;
  dossier_solde: boolean;
  availability: {
    montant_ordonnance: number;
    reglements_anterieurs: number;
    restant_apres: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.warn('[process-reglement] Starting reglement processing...');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorise' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorise' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const body: ProcessReglementRequest = await req.json();
    console.warn('[process-reglement] Request:', {
      userId: user.id,
      ordonnancement_id: body.ordonnancement_id,
      montant: body.montant,
      exercice: body.exercice,
    });

    // Validate required fields
    if (
      !body.ordonnancement_id ||
      !body.date_paiement ||
      !body.montant ||
      !body.mode_paiement ||
      !body.exercice
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Champs obligatoires: ordonnancement_id, date_paiement, montant, mode_paiement, exercice',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.montant <= 0) {
      return new Response(JSON.stringify({ error: 'Le montant doit etre superieur a 0' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Fetch the ordonnancement
    const { data: ordonnancement, error: ordError } = await supabaseAdmin
      .from('ordonnancements')
      .select(
        `
        id, numero, montant, montant_paye, statut, exercice, beneficiaire, banque, rib,
        liquidation_id,
        liquidation:budget_liquidations(
          id,
          engagement_id,
          engagement:budget_engagements(
            id,
            budget_line_id,
            expression_besoin_id,
            expression_besoin:expressions_besoin(
              dossier_id
            ),
            budget_line:budget_lines(
              id,
              code,
              disponible_calcule,
              total_paye
            )
          )
        )
      `
      )
      .eq('id', body.ordonnancement_id)
      .single();

    if (ordError || !ordonnancement) {
      console.error('[process-reglement] Ordonnancement not found:', ordError);
      return new Response(JSON.stringify({ error: 'Ordonnancement introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Verify ordonnancement is validated
    if (ordonnancement.statut !== 'valide') {
      return new Response(
        JSON.stringify({
          error: `L'ordonnancement n'est pas valide (statut actuel: ${ordonnancement.statut})`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Calculate availability (restant a payer)
    const { data: existingReglements, error: regError } = await supabaseAdmin
      .from('reglements')
      .select('id, montant')
      .eq('ordonnancement_id', body.ordonnancement_id)
      .neq('statut', 'rejete');

    if (regError) {
      console.error('[process-reglement] Error fetching existing reglements:', regError);
      throw regError;
    }

    const reglementsAnterieurs = (existingReglements || []).reduce(
      (sum, r) => sum + ((r.montant as number) || 0),
      0
    );
    const montantOrdonnance = (ordonnancement.montant as number) || 0;
    const restantAPayer = montantOrdonnance - reglementsAnterieurs;

    console.warn('[process-reglement] Availability:', {
      montantOrdonnance,
      reglementsAnterieurs,
      restantAPayer,
      montantDemande: body.montant,
    });

    // Step 4: Validate amount against remaining
    if (body.montant > restantAPayer) {
      return new Response(
        JSON.stringify({
          error: 'Montant superieur au restant a payer',
          details: {
            montant_demande: body.montant,
            restant_a_payer: restantAPayer,
            montant_ordonnance: montantOrdonnance,
            reglements_anterieurs: reglementsAnterieurs,
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Verify budget availability on the budget line
    const budgetLine =
      (ordonnancement as Record<string, unknown>).liquidation &&
      ((ordonnancement as Record<string, unknown>).liquidation as Record<string, unknown>)
        .engagement &&
      (
        ((ordonnancement as Record<string, unknown>).liquidation as Record<string, unknown>)
          .engagement as Record<string, unknown>
      ).budget_line;

    if (budgetLine) {
      const disponible = (budgetLine as Record<string, unknown>).disponible_calcule as number;
      if (disponible !== null && disponible !== undefined && disponible < 0) {
        console.warn('[process-reglement] Budget line has negative availability:', disponible);
      }
    }

    // Step 6: Create the reglement
    const { data: reglement, error: insertError } = await supabaseAdmin
      .from('reglements')
      .insert({
        numero: '', // Auto-generated by trigger
        ordonnancement_id: body.ordonnancement_id,
        date_paiement: body.date_paiement,
        montant: body.montant,
        mode_paiement: body.mode_paiement,
        reference_paiement: body.reference_paiement || null,
        compte_bancaire_arti: body.compte_bancaire_arti || null,
        banque_arti: body.banque_arti || null,
        observation: body.observation || null,
        statut: 'enregistre',
        exercice: body.exercice,
        created_by: user.id,
      })
      .select('id, numero')
      .single();

    if (insertError) {
      console.error('[process-reglement] Error creating reglement:', insertError);
      throw insertError;
    }

    console.warn('[process-reglement] Reglement created:', reglement.id);

    // Step 7: Update ordonnancement montant_paye
    const newMontantPaye = reglementsAnterieurs + body.montant;
    const isFullyPaid = newMontantPaye >= montantOrdonnance;

    const { error: updateOrdError } = await supabaseAdmin
      .from('ordonnancements')
      .update({
        montant_paye: newMontantPaye,
        is_locked: true,
      })
      .eq('id', body.ordonnancement_id);

    if (updateOrdError) {
      console.error('[process-reglement] Error updating ordonnancement:', updateOrdError);
    }

    // Step 8: Update budget line total_paye
    if (budgetLine) {
      const budgetLineId = (budgetLine as Record<string, unknown>).id as string;
      const currentTotalPaye = ((budgetLine as Record<string, unknown>).total_paye as number) || 0;

      const { error: budgetError } = await supabaseAdmin
        .from('budget_lines')
        .update({
          total_paye: currentTotalPaye + body.montant,
        })
        .eq('id', budgetLineId);

      if (budgetError) {
        console.error('[process-reglement] Error updating budget line:', budgetError);
      }
    }

    // Step 9: If fully paid, close the dossier
    let dossierSolde = false;
    if (isFullyPaid) {
      const engagement =
        (ordonnancement as Record<string, unknown>).liquidation &&
        ((ordonnancement as Record<string, unknown>).liquidation as Record<string, unknown>)
          .engagement;
      const expressionBesoin =
        engagement && (engagement as Record<string, unknown>).expression_besoin;
      const dossierId =
        expressionBesoin &&
        ((expressionBesoin as Record<string, unknown>).dossier_id as string | undefined);

      if (dossierId) {
        const { error: dossierError } = await supabaseAdmin
          .from('dossiers')
          .update({
            statut_global: 'solde',
            statut_paiement: 'solde',
            date_cloture: new Date().toISOString(),
          })
          .eq('id', dossierId);

        if (dossierError) {
          console.error('[process-reglement] Error closing dossier:', dossierError);
        } else {
          dossierSolde = true;
          console.warn('[process-reglement] Dossier marked as solde:', dossierId);
        }
      }
    }

    // Step 10: Create audit log entry
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      entity_type: 'reglement',
      entity_id: reglement.id,
      action: 'CREATE',
      new_values: {
        numero: reglement.numero,
        montant: body.montant,
        mode_paiement: body.mode_paiement,
        ordonnancement_id: body.ordonnancement_id,
        is_fully_paid: isFullyPaid,
        dossier_solde: dossierSolde,
      },
    });

    if (auditError) {
      console.error('[process-reglement] Error creating audit log:', auditError);
    }

    const restantApres = montantOrdonnance - newMontantPaye;

    const result: ProcessResult = {
      success: true,
      reglement_id: reglement.id,
      reglement_numero: reglement.numero,
      montant: body.montant,
      is_fully_paid: isFullyPaid,
      dossier_solde: dossierSolde,
      availability: {
        montant_ordonnance: montantOrdonnance,
        reglements_anterieurs: reglementsAnterieurs,
        restant_apres: restantApres,
      },
    };

    console.warn('[process-reglement] Processing completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('[process-reglement] Unexpected error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
