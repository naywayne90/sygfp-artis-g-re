import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  matricule?: string;
  telephone?: string;
  direction_id?: string;
  role_hierarchique?: string;
  profil_fonctionnel?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[create-user] Starting user creation...");

    // Verify the request is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[create-user] No authorization header");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify caller is authenticated and is an admin
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !caller) {
      console.error("[create-user] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("profil_fonctionnel")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.profil_fonctionnel !== "Admin") {
      console.error("[create-user] User is not admin:", caller.id);
      return new Response(
        JSON.stringify({ error: "Seuls les administrateurs peuvent créer des utilisateurs" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    console.log("[create-user] Request body:", { ...body, password: "***" });

    // Validate required fields
    if (!body.email || !body.password || !body.first_name || !body.last_name) {
      return new Response(
        JSON.stringify({ error: "Email, mot de passe, prénom et nom sont obligatoires" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    if (body.password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Le mot de passe doit contenir au moins 6 caractères" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user in Supabase Auth
    console.log("[create-user] Creating auth user for:", body.email);
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: body.first_name,
        last_name: body.last_name,
        full_name: `${body.first_name} ${body.last_name}`,
      },
    });

    if (createError) {
      console.error("[create-user] Error creating auth user:", createError);
      
      // Handle specific errors
      if (createError.message.includes("already")) {
        return new Response(
          JSON.stringify({ error: "Un utilisateur avec cet email existe déjà" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authData.user) {
      console.error("[create-user] No user returned from auth creation");
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de l'utilisateur" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[create-user] Auth user created:", authData.user.id);

    // Update the profile with additional info
    // The profile should be created automatically by a trigger, but we update it here
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        full_name: `${body.first_name} ${body.last_name}`,
        matricule: body.matricule || null,
        telephone: body.telephone || null,
        direction_id: body.direction_id || null,
        role_hierarchique: body.role_hierarchique || "Agent",
        profil_fonctionnel: body.profil_fonctionnel || "Operationnel",
        is_active: true,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("[create-user] Error updating profile:", profileError);
      // Don't fail the request, the user is created
    } else {
      console.log("[create-user] Profile updated successfully");
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          first_name: body.first_name,
          last_name: body.last_name,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[create-user] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
