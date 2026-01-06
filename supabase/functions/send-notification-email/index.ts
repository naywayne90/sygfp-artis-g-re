import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// Resend API client - using fetch directly
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationEmailRequest = await req.json();
    console.log("Received notification request:", payload);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", payload.user_id)
      .single();

    if (profileErr || !profile?.email) {
      console.error("User not found:", profileErr);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("email_enabled")
      .eq("user_id", payload.user_id)
      .eq("notification_type", payload.type)
      .single();

    if (prefs && !prefs.email_enabled) {
      console.log("Email notifications disabled for this type");
      return new Response(JSON.stringify({ skipped: true, reason: "disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeLabel = TYPE_LABELS[payload.type] || payload.type;
    const entityInfo = payload.entity_numero ? ` (${payload.entity_numero})` : "";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .badge { display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 12px; }
    .message-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">SYGFP - Notification</h1>
    </div>
    <div class="content">
      <p>Bonjour ${profile.full_name || ""},</p>
      <p><span class="badge">${typeLabel}</span>${entityInfo}</p>
      <div class="message-box">
        <strong>${payload.title}</strong>
        <p>${payload.message}</p>
      </div>
      <p>Connectez-vous à SYGFP pour plus de détails.</p>
    </div>
    <div class="footer">
      <p>SYGFP - Système de Gestion Financière et Programmatique</p>
      <p>Cet email a été envoyé automatiquement. Ne pas répondre.</p>
    </div>
  </div>
</body>
</html>`;

    // Send email using Resend API directly
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

    console.log("Email sent:", emailData);

    // Update notification as email sent
    if (payload.entity_id) {
      await supabase
        .from("notifications")
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq("entity_id", payload.entity_id)
        .eq("user_id", payload.user_id);
    }

    return new Response(JSON.stringify({ success: true, ...emailData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
