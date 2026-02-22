import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// Resend API - using fetch directly
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationEmailRequest {
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  entity_numero?: string;
  // Reglement-specific fields
  montant?: number;
  mode_paiement?: string;
  beneficiaire?: string;
  reference_paiement?: string;
  motif_rejet?: string;
  // Engagement-specific fields (Prompt 11)
  objet?: string;
  fournisseur?: string;
  ligne_budgetaire?: string;
  direction?: string;
  etape_visa?: string;
  montant_degage?: number;
  motif_degagement?: string;
  // Liquidation-specific fields (Prompt 12)
  net_a_payer?: number;
  total_retenues?: number;
  regime_fiscal?: string;
  objet_engagement?: string;
  reference_facture?: string;
  reglement_urgent_motif?: string;
  etape_liquidation?: string;
  motif_differe?: string;
  deadline_correction?: string;
  // Ordonnancement-specific fields (Prompt 12 — exigence TOURÉ)
  montant_regle?: number;
  montant_restant?: number;
}

const TYPE_LABELS: Record<string, string> = {
  validation: 'Demande de validation',
  rejet: 'Document rejeté',
  differe: 'Document différé',
  piece_manquante: 'Pièce manquante',
  alerte: 'Alerte',
  info: 'Information',
  echeance: 'Échéance',
  reglement_validation: 'Règlement à valider',
  reglement_rejet: 'Règlement rejeté',
  reglement_paiement: 'Paiement effectué',
  // Engagement types (Prompt 11)
  engagement_soumis: 'Engagement soumis',
  engagement_visa: 'Visa engagement',
  engagement_valide: 'Engagement validé',
  engagement_rejete: 'Engagement rejeté',
  engagement_degage: 'Dégagement engagement',
  engagement_differe: 'Engagement différé',
  // Liquidation types (Prompt 12)
  liquidation_soumise: 'Liquidation soumise',
  liquidation_visa_daaf: 'Visa DAAF liquidation',
  liquidation_visa_dg: 'Visa DG liquidation',
  liquidation_validee: 'Liquidation validée',
  liquidation_rejetee: 'Liquidation rejetée',
  liquidation_differee: 'Liquidation différée',
  liquidation_urgente: 'Liquidation urgente',
  liquidation_certifiee_sf: 'Service fait certifié',
  // Ordonnancement types (Prompt 12 — exigence TOURÉ)
  ordonnancement_cree: 'Ordonnancement créé',
  ordonnancement_valide: 'Ordonnancement validé',
};

const handler = async (req: Request): Promise<Response> => {
  console.warn('Edge function send-notification-email called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier la clé API Resend
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service not configured. RESEND_API_KEY is missing.',
          code: 'MISSING_API_KEY',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const payload: NotificationEmailRequest = await req.json();
    console.warn('Received notification request:', JSON.stringify(payload, null, 2));

    // Validation du payload
    if (!payload.user_id || !payload.type || !payload.title || !payload.message) {
      console.error('Invalid payload - missing required fields');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: user_id, type, title, message',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', payload.user_id)
      .single();

    if (profileErr || !profile?.email) {
      console.error('User not found:', profileErr);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not found or no email address',
          details: profileErr?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check user preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('email_enabled')
      .eq('user_id', payload.user_id)
      .eq('notification_type', payload.type)
      .maybeSingle();

    // Par défaut, pas d'email sauf si explicitement activé
    if (!prefs?.email_enabled) {
      console.warn('Email notifications disabled for this type:', payload.type);
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: 'Email notifications disabled for this type',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const typeLabel = TYPE_LABELS[payload.type] || payload.type;
    const entityInfo = payload.entity_numero ? ` (${payload.entity_numero})` : '';

    const formatMontant = (m: number | undefined) =>
      m !== undefined ? new Intl.NumberFormat('fr-FR').format(m) + ' FCFA' : '';

    // Build reglement-specific detail block when applicable
    const isReglementType = payload.type.startsWith('reglement_');
    let reglementDetailBlock = '';
    if (isReglementType && (payload.montant || payload.beneficiaire || payload.mode_paiement)) {
      const rows: string[] = [];
      if (payload.entity_numero)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">N&deg; R&egrave;glement</td><td style="padding:6px 10px;">${payload.entity_numero}</td></tr>`
        );
      if (payload.beneficiaire)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">B&eacute;n&eacute;ficiaire</td><td style="padding:6px 10px;">${payload.beneficiaire}</td></tr>`
        );
      if (payload.montant)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Montant</td><td style="padding:6px 10px;font-weight:bold;color:#1e40af;">${formatMontant(payload.montant)}</td></tr>`
        );
      if (payload.mode_paiement)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Mode de paiement</td><td style="padding:6px 10px;">${payload.mode_paiement}</td></tr>`
        );
      if (payload.reference_paiement)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">R&eacute;f&eacute;rence</td><td style="padding:6px 10px;">${payload.reference_paiement}</td></tr>`
        );
      if (payload.motif_rejet)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Motif de rejet</td><td style="padding:6px 10px;color:#dc2626;">${payload.motif_rejet}</td></tr>`
        );

      reglementDetailBlock = `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;">
        ${rows.join('')}
      </table>`;
    }

    // Build engagement-specific detail block (Prompt 11)
    const isEngagementType = payload.type.startsWith('engagement_');
    let engagementDetailBlock = '';
    if (isEngagementType && (payload.montant || payload.objet || payload.fournisseur)) {
      const rows: string[] = [];
      if (payload.entity_numero)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">N&deg; Engagement</td><td style="padding:6px 10px;">${payload.entity_numero}</td></tr>`
        );
      if (payload.objet)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Objet</td><td style="padding:6px 10px;">${payload.objet}</td></tr>`
        );
      if (payload.fournisseur)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Fournisseur</td><td style="padding:6px 10px;">${payload.fournisseur}</td></tr>`
        );
      if (payload.montant)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Montant TTC</td><td style="padding:6px 10px;font-weight:bold;color:#1e40af;">${formatMontant(payload.montant)}</td></tr>`
        );
      if (payload.ligne_budgetaire)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Ligne budg&eacute;taire</td><td style="padding:6px 10px;">${payload.ligne_budgetaire}</td></tr>`
        );
      if (payload.direction)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Direction</td><td style="padding:6px 10px;">${payload.direction}</td></tr>`
        );
      if (payload.etape_visa)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">&Eacute;tape</td><td style="padding:6px 10px;">${payload.etape_visa}</td></tr>`
        );
      if (payload.montant_degage)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Montant d&eacute;gag&eacute;</td><td style="padding:6px 10px;font-weight:bold;color:#dc2626;">${formatMontant(payload.montant_degage)}</td></tr>`
        );
      if (payload.motif_degagement)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Motif d&eacute;gagement</td><td style="padding:6px 10px;">${payload.motif_degagement}</td></tr>`
        );
      if (payload.motif_rejet)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Motif de rejet</td><td style="padding:6px 10px;color:#dc2626;">${payload.motif_rejet}</td></tr>`
        );

      engagementDetailBlock = `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;">
        ${rows.join('')}
      </table>`;
    }

    // Build liquidation-specific detail block (Prompt 12)
    const isLiquidationType = payload.type.startsWith('liquidation_');
    let liquidationDetailBlock = '';
    if (isLiquidationType && (payload.montant || payload.net_a_payer || payload.objet_engagement)) {
      const rows: string[] = [];
      if (payload.entity_numero)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">N&deg; Liquidation</td><td style="padding:6px 10px;">${payload.entity_numero}</td></tr>`
        );
      if (payload.objet_engagement)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Engagement</td><td style="padding:6px 10px;">${payload.objet_engagement}</td></tr>`
        );
      if (payload.fournisseur)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Fournisseur</td><td style="padding:6px 10px;">${payload.fournisseur}</td></tr>`
        );
      if (payload.montant)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Montant TTC</td><td style="padding:6px 10px;font-weight:bold;color:#1e40af;">${formatMontant(payload.montant)}</td></tr>`
        );
      if (payload.net_a_payer)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Net &agrave; payer</td><td style="padding:6px 10px;font-weight:bold;color:#059669;">${formatMontant(payload.net_a_payer)}</td></tr>`
        );
      if (payload.total_retenues)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Total retenues</td><td style="padding:6px 10px;color:#dc2626;">${formatMontant(payload.total_retenues)}</td></tr>`
        );
      if (payload.regime_fiscal)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">R&eacute;gime fiscal</td><td style="padding:6px 10px;">${payload.regime_fiscal}</td></tr>`
        );
      if (payload.ligne_budgetaire)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Ligne budg&eacute;taire</td><td style="padding:6px 10px;">${payload.ligne_budgetaire}</td></tr>`
        );
      if (payload.direction)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Direction</td><td style="padding:6px 10px;">${payload.direction}</td></tr>`
        );
      if (payload.reference_facture)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">R&eacute;f. facture</td><td style="padding:6px 10px;">${payload.reference_facture}</td></tr>`
        );
      if (payload.etape_liquidation)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">&Eacute;tape</td><td style="padding:6px 10px;">${payload.etape_liquidation}</td></tr>`
        );
      if (payload.motif_rejet)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Motif de rejet</td><td style="padding:6px 10px;color:#dc2626;">${payload.motif_rejet}</td></tr>`
        );
      if (payload.motif_differe)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Motif du report</td><td style="padding:6px 10px;color:#d97706;">${payload.motif_differe}</td></tr>`
        );
      if (payload.reglement_urgent_motif)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Motif urgence</td><td style="padding:6px 10px;color:#dc2626;font-weight:bold;">${payload.reglement_urgent_motif}</td></tr>`
        );
      if (payload.deadline_correction)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Date de reprise</td><td style="padding:6px 10px;">${payload.deadline_correction}</td></tr>`
        );

      liquidationDetailBlock = `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;">
        ${rows.join('')}
      </table>`;
    }

    // Build ordonnancement-specific detail block (Prompt 12 — exigence TOURÉ)
    const isOrdonnancementType = payload.type.startsWith('ordonnancement_');
    let ordonnancementDetailBlock = '';
    if (isOrdonnancementType && (payload.montant || payload.fournisseur || payload.entity_numero)) {
      const rows: string[] = [];
      if (payload.entity_numero)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">R&eacute;f&eacute;rence</td><td style="padding:6px 10px;">${payload.entity_numero}</td></tr>`
        );
      if (payload.fournisseur)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Fournisseur</td><td style="padding:6px 10px;">${payload.fournisseur}</td></tr>`
        );
      if (payload.net_a_payer)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Montant net</td><td style="padding:6px 10px;font-weight:bold;color:#1e40af;">${formatMontant(payload.net_a_payer)}</td></tr>`
        );
      if (payload.montant_regle !== undefined)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Montant r&eacute;gl&eacute;</td><td style="padding:6px 10px;font-weight:bold;color:#059669;">${formatMontant(payload.montant_regle)}</td></tr>`
        );
      if (payload.montant_restant !== undefined)
        rows.push(
          `<tr><td style="padding:6px 10px;color:#666;font-weight:500;">Montant restant</td><td style="padding:6px 10px;font-weight:bold;color:#d97706;">${formatMontant(payload.montant_restant)}</td></tr>`
        );

      ordonnancementDetailBlock = `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;">
        ${rows.join('')}
      </table>`;
    }

    // Choose badge color based on type
    let badgeBg = '#dbeafe';
    let badgeColor = '#1e40af';
    let borderColor = '#3b82f6';
    if (payload.type === 'engagement_rejete') {
      badgeBg = '#fee2e2';
      badgeColor = '#dc2626';
      borderColor = '#ef4444';
    } else if (payload.type === 'engagement_valide') {
      badgeBg = '#d1fae5';
      badgeColor = '#059669';
      borderColor = '#10b981';
    } else if (payload.type === 'engagement_degage') {
      badgeBg = '#fef3c7';
      badgeColor = '#d97706';
      borderColor = '#f59e0b';
    } else if (payload.type === 'reglement_rejet') {
      badgeBg = '#fee2e2';
      badgeColor = '#dc2626';
      borderColor = '#ef4444';
    } else if (payload.type === 'reglement_paiement') {
      badgeBg = '#d1fae5';
      badgeColor = '#059669';
      borderColor = '#10b981';
    } else if (payload.type === 'liquidation_rejetee' || payload.type === 'liquidation_urgente') {
      badgeBg = '#fee2e2';
      badgeColor = '#dc2626';
      borderColor = '#ef4444';
    } else if (payload.type === 'liquidation_validee' || payload.type === 'liquidation_visa_dg') {
      badgeBg = '#d1fae5';
      badgeColor = '#059669';
      borderColor = '#10b981';
    } else if (payload.type === 'liquidation_differee') {
      badgeBg = '#fef3c7';
      badgeColor = '#d97706';
      borderColor = '#f59e0b';
    } else if (payload.type === 'liquidation_soumise' || payload.type === 'liquidation_visa_daaf') {
      badgeBg = '#dbeafe';
      badgeColor = '#1e40af';
      borderColor = '#3b82f6';
    } else if (payload.type === 'ordonnancement_valide') {
      badgeBg = '#d1fae5';
      badgeColor = '#059669';
      borderColor = '#10b981';
    } else if (payload.type === 'ordonnancement_cree') {
      badgeBg = '#dbeafe';
      badgeColor = '#1e40af';
      borderColor = '#3b82f6';
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; }
    .footer { background: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
    .badge { display: inline-block; padding: 4px 12px; background: ${badgeBg}; color: ${badgeColor}; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .message-box { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${borderColor}; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 24px;">SYGFP</h1>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Syst&egrave;me de Gestion Financi&egrave;re et Programmatique</p>
    </div>
    <div class="content">
      <p>Bonjour ${profile.full_name || ''},</p>
      <p><span class="badge">${typeLabel}</span>${entityInfo}</p>
      <div class="message-box">
        <strong style="display: block; margin-bottom: 8px; font-size: 16px;">${payload.title}</strong>
        <p style="margin: 0; color: #4b5563;">${payload.message}</p>
      </div>
      ${reglementDetailBlock}
      ${engagementDetailBlock}
      ${liquidationDetailBlock}
      ${ordonnancementDetailBlock}
      <p style="text-align: center; margin-top: 24px;">
        <a href="#" class="btn">Acc&eacute;der &agrave; l'application</a>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">SYGFP - Syst&egrave;me de Gestion Financi&egrave;re et Programmatique</p>
      <p style="margin: 8px 0 0;">Cet email a &eacute;t&eacute; envoy&eacute; automatiquement. Ne pas r&eacute;pondre.</p>
    </div>
  </div>
</body>
</html>`;

    // Send email using Resend API directly
    console.warn('Sending email to:', profile.email);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SYGFP <notifications@resend.dev>',
        to: [profile.email],
        subject: `[SYGFP] ${typeLabel}: ${payload.title}`,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailResponse.status, emailData);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send email',
          details: emailData,
          status: emailResponse.status,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.warn('Email sent successfully:', emailData);

    // Update notification as email sent
    if (payload.entity_id) {
      await supabase
        .from('notifications')
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq('entity_id', payload.entity_id)
        .eq('user_id', payload.user_id);
    }

    return new Response(JSON.stringify({ success: true, email_id: emailData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error sending notification email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        stack: errorStack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
