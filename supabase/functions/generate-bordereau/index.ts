import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateBordereauRequest {
  reglement_ids: string[];
  exercice: number;
}

interface ReglementRow {
  id: string;
  numero: string;
  date_paiement: string;
  montant: number;
  mode_paiement: string;
  reference_paiement: string | null;
  banque_arti: string | null;
  observation: string | null;
  ordonnancement: {
    id: string;
    numero: string;
    montant: number;
    beneficiaire: string | null;
    banque: string | null;
    rib: string | null;
    liquidation: {
      numero: string;
      engagement: {
        numero: string;
        objet: string;
        fournisseur: string | null;
      } | null;
    } | null;
  } | null;
}

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount);
};

const formatDate = (date: string | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR');
};

const getModeLabel = (mode: string): string => {
  const labels: Record<string, string> = {
    virement: 'Virement bancaire',
    cheque: 'Cheque',
    especes: 'Especes',
    mobile_money: 'Mobile Money',
  };
  return labels[mode] || mode;
};

function generateBordereauHTML(
  reglements: ReglementRow[],
  bordereauNumero: string,
  exercice: number,
  signataire: { full_name: string; profil_fonctionnel: string | null }
): string {
  const logoUrl =
    'https://tjagvgqthlibdpvztvaf.supabase.co/storage/v1/object/public/assets/logo-arti.jpg';
  const totalMontant = reglements.reduce((sum, r) => sum + (r.montant || 0), 0);
  const dateGeneration = new Date().toLocaleDateString('fr-FR');
  const heureGeneration = new Date().toLocaleTimeString('fr-FR');

  const lignes = reglements
    .map(
      (r, index) => `
    <tr>
      <td style="text-align: center;">${index + 1}</td>
      <td>${r.numero}</td>
      <td>${formatDate(r.date_paiement)}</td>
      <td>${r.ordonnancement?.beneficiaire || 'N/A'}</td>
      <td>${r.ordonnancement?.liquidation?.engagement?.objet || 'N/A'}</td>
      <td>${r.ordonnancement?.numero || 'N/A'}</td>
      <td>${getModeLabel(r.mode_paiement)}</td>
      <td>${r.reference_paiement || '-'}</td>
      <td style="text-align: right; font-weight: 500;">${formatAmount(r.montant)}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
    .logo { height: 60px; }
    .title-section { text-align: right; }
    .title { font-size: 18pt; font-weight: bold; color: #1e40af; margin: 0; }
    .subtitle { font-size: 10pt; color: #666; margin: 5px 0 0 0; }
    .info-bar { background: #f3f4f6; padding: 12px 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .info-item { display: flex; gap: 8px; }
    .info-label { font-weight: bold; color: #666; }
    .info-value { color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #1e40af; color: white; padding: 8px 6px; text-align: left; font-size: 9pt; }
    td { border: 1px solid #e5e7eb; padding: 6px; font-size: 9pt; }
    tr:nth-child(even) { background: #f9fafb; }
    .total-row { background: #1e40af !important; color: white; font-weight: bold; font-size: 11pt; }
    .total-row td { border-color: #1e40af; }
    .amount-box { background: #1e40af; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .amount-label { font-size: 10pt; opacity: 0.9; }
    .amount-value { font-size: 22pt; font-weight: bold; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 30px; }
    .signature-box { border: 1px solid #e5e7eb; padding: 15px; text-align: center; min-height: 80px; }
    .signature-title { font-weight: bold; margin-bottom: 50px; }
    .footer { position: fixed; bottom: 10mm; left: 0; right: 0; text-align: center; font-size: 8pt; color: #999; }
    .summary { display: flex; gap: 20px; margin: 15px 0; }
    .summary-card { flex: 1; background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center; }
    .summary-card .label { font-size: 9pt; color: #666; }
    .summary-card .value { font-size: 14pt; font-weight: bold; color: #1e40af; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" alt="ARTI" class="logo" onerror="this.style.display='none'"/>
    <div class="title-section">
      <h1 class="title">BORDEREAU DE REGLEMENT</h1>
      <p class="subtitle">Exercice ${exercice}</p>
    </div>
  </div>

  <div class="info-bar">
    <div class="info-item">
      <span class="info-label">N* Bordereau :</span>
      <span class="info-value">${bordereauNumero}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Date :</span>
      <span class="info-value">${dateGeneration}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Nombre de reglements :</span>
      <span class="info-value">${reglements.length}</span>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Nombre de reglements</div>
      <div class="value">${reglements.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Montant total</div>
      <div class="value">${formatAmount(totalMontant)} FCFA</div>
    </div>
    <div class="summary-card">
      <div class="label">Modes de paiement</div>
      <div class="value">${[...new Set(reglements.map((r) => getModeLabel(r.mode_paiement)))].join(', ')}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>N* Reglement</th>
        <th>Date Paiement</th>
        <th>Beneficiaire</th>
        <th>Objet</th>
        <th>N* Ordonnancement</th>
        <th>Mode</th>
        <th>Reference</th>
        <th style="text-align: right;">Montant (FCFA)</th>
      </tr>
    </thead>
    <tbody>
      ${lignes}
      <tr class="total-row">
        <td colspan="8" style="text-align: right; padding-right: 10px;">TOTAL</td>
        <td style="text-align: right;">${formatAmount(totalMontant)}</td>
      </tr>
    </tbody>
  </table>

  <div class="amount-box">
    <div class="amount-label">Montant Total du Bordereau</div>
    <div class="amount-value">${formatAmount(totalMontant)} FCFA</div>
  </div>

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-title">Le Comptable</div>
      <div style="font-size: 9pt; color: #666; margin-bottom: 5px;">${signataire.full_name}</div>
      <div>Date: _______________</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Le Controleur Financier</div>
      <div>Date: _______________</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Le Directeur General</div>
      <div>Date: _______________</div>
    </div>
  </div>

  <div class="footer">
    Bordereau ${bordereauNumero} - Genere le ${dateGeneration} a ${heureGeneration} par ${signataire.full_name} - ARTI SYGFP
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.warn('[generate-bordereau] Starting bordereau generation...');

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

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, profil_fonctionnel')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profil utilisateur introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const body: GenerateBordereauRequest = await req.json();
    console.warn('[generate-bordereau] Request:', {
      userId: user.id,
      ids: body.reglement_ids?.length,
      exercice: body.exercice,
    });

    if (!body.reglement_ids || body.reglement_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'Au moins un reglement est requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.exercice) {
      return new Response(JSON.stringify({ error: "L'exercice est requis" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch reglements with full chain
    const { data: reglements, error: regError } = await supabaseAdmin
      .from('reglements')
      .select(
        `
        id, numero, date_paiement, montant, mode_paiement, reference_paiement,
        banque_arti, observation,
        ordonnancement:ordonnancements(
          id, numero, montant, beneficiaire, banque, rib,
          liquidation:budget_liquidations(
            numero,
            engagement:budget_engagements(
              numero, objet, fournisseur
            )
          )
        )
      `
      )
      .in('id', body.reglement_ids)
      .eq('exercice', body.exercice)
      .order('date_paiement', { ascending: true });

    if (regError) {
      console.error('[generate-bordereau] Error fetching reglements:', regError);
      throw regError;
    }

    if (!reglements || reglements.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucun reglement trouve pour les IDs fournis' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate bordereau number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Count existing bordereaux for this month to generate sequential number
    const { count } = await supabaseAdmin
      .from('export_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', 'bordereau')
      .gte('created_at', `${year}-${month}-01`);

    const sequenceNum = String((count || 0) + 1).padStart(4, '0');
    const bordereauNumero = `BR-${year}${month}-${sequenceNum}`;

    console.warn('[generate-bordereau] Generating bordereau:', bordereauNumero);

    // Generate HTML
    const htmlContent = generateBordereauHTML(
      reglements as unknown as ReglementRow[],
      bordereauNumero,
      body.exercice,
      { full_name: profile.full_name || 'N/A', profil_fonctionnel: profile.profil_fonctionnel }
    );

    // Record the export job
    const totalMontant = reglements.reduce(
      (sum, r) => sum + (((r as Record<string, unknown>).montant as number) || 0),
      0
    );
    const fileName = `bordereau_${bordereauNumero}_${Date.now()}.html`;

    const { error: jobError } = await supabaseAdmin.from('export_jobs').insert({
      user_id: user.id,
      type: 'pdf',
      entity_type: 'bordereau',
      filters: {
        reglement_ids: body.reglement_ids,
        exercice: body.exercice,
        total_montant: totalMontant,
      },
      status: 'completed',
      file_name: fileName,
      file_size: new TextEncoder().encode(htmlContent).length,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date().toISOString(),
    });

    if (jobError) {
      console.error('[generate-bordereau] Error creating export job:', jobError);
    }

    console.warn('[generate-bordereau] Bordereau generated successfully:', {
      numero: bordereauNumero,
      reglements: reglements.length,
      totalMontant,
    });

    return new Response(htmlContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Bordereau-Numero': bordereauNumero,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('[generate-bordereau] Unexpected error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
