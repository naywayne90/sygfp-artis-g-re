import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// Resend API - using fetch directly
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  entity_numero?: string;
}

const TYPE_LABELS: Record<string, string> = {
  validation: "Demande de validation",
  rejet: "Document rejeté",
  differe: "Document différé",
  piece_manquante: "Pièce manquante",
  alerte: "Alerte",
  info: "Information",
  echeance: "Échéance",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Edge function send-notification-email called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier la clé API Resend
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email service not configured. RESEND_API_KEY is missing.",
          code: "MISSING_API_KEY"
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: NotificationEmailRequest = await req.json();
    console.log("Received notification request:", JSON.stringify(payload, null, 2));

    // Validation du payload
    if (!payload.user_id || !payload.type || !payload.title || !payload.message) {
      console.error("Invalid payload - missing required fields");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: user_id, type, title, message" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", payload.user_id)
      .single();

    if (profileErr || !profile?.email) {
      console.error("User not found:", profileErr);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "User not found or no email address",
          details: profileErr?.message
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check user preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("email_enabled")
      .eq("user_id", payload.user_id)
      .eq("notification_type", payload.type)
      .maybeSingle();

    // Par défaut, pas d'email sauf si explicitement activé
    if (!prefs?.email_enabled) {
      console.log("Email notifications disabled for this type:", payload.type);
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true, 
          reason: "Email notifications disabled for this type" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const typeLabel = TYPE_LABELS[payload.type] || payload.type;
    const entityInfo = payload.entity_numero ? ` (${payload.entity_numero})` : "";

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
    .badge { display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .message-box { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 24px;">SYGFP</h1>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Système de Gestion Financière et Programmatique</p>
    </div>
    <div class="content">
      <p>Bonjour ${profile.full_name || ""},</p>
      <p><span class="badge">${typeLabel}</span>${entityInfo}</p>
      <div class="message-box">
        <strong style="display: block; margin-bottom: 8px; font-size: 16px;">${payload.title}</strong>
        <p style="margin: 0; color: #4b5563;">${payload.message}</p>
      </div>
      <p style="text-align: center; margin-top: 24px;">
        <a href="#" class="btn">Accéder à l'application</a>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">SYGFP - Système de Gestion Financière et Programmatique</p>
      <p style="margin: 8px 0 0;">Cet email a été envoyé automatiquement. Ne pas répondre.</p>
    </div>
  </div>
</body>
</html>`;

    // Send email using Resend API directly
    console.log("Sending email to:", profile.email);
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SYGFP <notifications@resend.dev>",
        to: [profile.email],
        subject: `[SYGFP] ${typeLabel}: ${payload.title}`,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResponse.status, emailData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to send email", 
          details: emailData,
          status: emailResponse.status
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Email sent successfully:", emailData);

    // Update notification as email sent
    if (payload.entity_id) {
      await supabase
        .from("notifications")
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq("entity_id", payload.entity_id)
        .eq("user_id", payload.user_id);
    }

    return new Response(
      JSON.stringify({ success: true, email_id: emailData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error",
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
