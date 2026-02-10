import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "https://esm.sh/@aws-sdk/client-s3@3.670.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.670.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Roles allowed to upload/delete files
const WRITE_ROLES = ["ADMIN", "DAAF", "CB", "SAF", "OPERATIONNEL"];

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Get user profile for role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("profil_fonctionnel, direction_id")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

// Initialize S3 client for R2
const getR2Client = () => {
  const endpoint = Deno.env.get("R2_ENDPOINT");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

const BUCKET = Deno.env.get("R2_BUCKET") || "lovable-storage";
const PREFIX = "sygfp"; // All files stored under this prefix

interface RequestBody {
  action: "getUploadUrl" | "getDownloadUrl" | "deleteObject" | "listObjects";
  key?: string;
  contentType?: string;
  prefix?: string;
  expiresIn?: number; // seconds, default 3600
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(req);
    if (!authResult) {
      return new Response(
        JSON.stringify({ error: "Non autorisé - authentification requise" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { profile } = authResult;
    const userRole = (profile?.profil_fonctionnel || "").toUpperCase();

    const body: RequestBody = await req.json();
    const { action, key, contentType, prefix, expiresIn = 3600 } = body;

    // Write operations require specific roles
    if (["getUploadUrl", "deleteObject"].includes(action)) {
      if (!WRITE_ROLES.includes(userRole)) {
        return new Response(
          JSON.stringify({ error: "Permissions insuffisantes pour cette opération" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const client = getR2Client();

    switch (action) {
      case "getUploadUrl": {
        if (!key || !contentType) {
          return new Response(
            JSON.stringify({ error: "key and contentType required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prefix all keys with sygfp/
        const fullKey = key.startsWith(PREFIX) ? key : `${PREFIX}/${key}`;

        const command = new PutObjectCommand({
          Bucket: BUCKET,
          Key: fullKey,
          ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(client, command, { expiresIn });

        return new Response(
          JSON.stringify({ 
            uploadUrl, 
            key: fullKey,
            bucket: BUCKET,
            expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "getDownloadUrl": {
        if (!key) {
          return new Response(
            JSON.stringify({ error: "key required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const command = new GetObjectCommand({
          Bucket: BUCKET,
          Key: key,
        });

        const downloadUrl = await getSignedUrl(client, command, { expiresIn });

        return new Response(
          JSON.stringify({ 
            downloadUrl,
            expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "deleteObject": {
        if (!key) {
          return new Response(
            JSON.stringify({ error: "key required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const command = new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: key,
        });

        await client.send(command);

        return new Response(
          JSON.stringify({ success: true, deletedKey: key }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "listObjects": {
        const listPrefix = prefix 
          ? (prefix.startsWith(PREFIX) ? prefix : `${PREFIX}/${prefix}`)
          : PREFIX;

        const command = new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: listPrefix,
          MaxKeys: 1000,
        });

        const result = await client.send(command);

        const objects = (result.Contents || []).map((obj) => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified?.toISOString(),
          etag: obj.ETag,
        }));

        return new Response(
          JSON.stringify({ 
            objects,
            count: objects.length,
            prefix: listPrefix
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("R2 Storage Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
