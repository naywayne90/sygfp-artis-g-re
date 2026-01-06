import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  PenLine, 
  CheckCircle, 
  Clock, 
  User, 
  AlertCircle,
  FileSignature
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Signature {
  id: string;
  ordonnancement_id: string;
  role: string;
  required: boolean;
  signed_by: string | null;
  signed_at: string | null;
  signature_ip: string | null;
  comments: string | null;
  signer_profile?: { full_name: string } | null;
}

interface OrdonnancementSignaturesProps {
  ordonnancementId: string;
  ordonnancementStatut: string;
  onSignatureComplete?: () => void;
}

const SIGNATURE_ROLES = [
  { role: "DAAF", label: "Directeur Administratif et Financier", order: 1 },
  { role: "DG", label: "Directeur Général", order: 2 },
];

export function OrdonnancementSignatures({
  ordonnancementId,
  ordonnancementStatut,
  onSignatureComplete,
}: OrdonnancementSignaturesProps) {
  const queryClient = useQueryClient();
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);

  useEffect(() => {
    loadSignatures();
    loadCurrentUserRoles();
  }, [ordonnancementId]);

  const loadSignatures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ordonnancement_signatures")
        .select(`
          *,
          signer_profile:profiles!ordonnancement_signatures_signed_by_fkey(full_name)
        `)
        .eq("ordonnancement_id", ordonnancementId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // If no signatures exist yet, create them
      if (!data || data.length === 0) {
        await initializeSignatures();
        return;
      }

      setSignatures(data as unknown as Signature[]);
    } catch (error) {
      console.error("Error loading signatures:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSignatures = async () => {
    try {
      const signaturesToCreate = SIGNATURE_ROLES.map(({ role }) => ({
        ordonnancement_id: ordonnancementId,
        role,
        required: true,
      }));

      const { data, error } = await supabase
        .from("ordonnancement_signatures")
        .insert(signaturesToCreate)
        .select(`
          *,
          signer_profile:profiles!ordonnancement_signatures_signed_by_fkey(full_name)
        `);

      if (error) throw error;
      setSignatures(data as unknown as Signature[]);
    } catch (error) {
      console.error("Error initializing signatures:", error);
    }
  };

  const loadCurrentUserRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      setCurrentUserRoles(data?.map(r => r.role) || []);
    } catch (error) {
      console.error("Error loading user roles:", error);
    }
  };

  const canSign = (signature: Signature) => {
    // Already signed
    if (signature.signed_by) return false;
    
    // User must have the required role
    const hasRole = currentUserRoles.includes(signature.role) || 
                    currentUserRoles.includes("ADMIN") ||
                    currentUserRoles.includes("DG");
    
    if (!hasRole) return false;

    // DAAF must sign first
    if (signature.role === "DG") {
      const daafSignature = signatures.find(s => s.role === "DAAF");
      if (daafSignature && !daafSignature.signed_by) return false;
    }

    return ordonnancementStatut === "valide";
  };

  const handleSign = async (signatureId: string, role: string) => {
    setSigning(signatureId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("ordonnancement_signatures")
        .update({
          signed_by: user.id,
          signed_at: new Date().toISOString(),
          comments: comments || null,
        })
        .eq("id", signatureId);

      if (error) throw error;

      // Check if all signatures are complete
      const updatedSignatures = signatures.map(s => 
        s.id === signatureId 
          ? { ...s, signed_by: user.id, signed_at: new Date().toISOString() }
          : s
      );

      const allSigned = updatedSignatures.every(s => s.signed_by);
      
      if (allSigned) {
        // Update ordonnancement status to "signé"
        await supabase
          .from("ordonnancements")
          .update({
            signed_daaf_at: updatedSignatures.find(s => s.role === "DAAF")?.signed_at,
            signed_dg_at: updatedSignatures.find(s => s.role === "DG")?.signed_at,
          })
          .eq("id", ordonnancementId);

        toast.success("Toutes les signatures sont complètes. Le mandat est prêt pour paiement.");
        onSignatureComplete?.();
      } else {
        toast.success(`Signature ${role} enregistrée`);
      }

      await loadSignatures();
      setComments("");
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
    } catch (error: any) {
      toast.error("Erreur lors de la signature: " + error.message);
    } finally {
      setSigning(null);
    }
  };

  const getSignatureStatus = (signature: Signature) => {
    if (signature.signed_by) {
      return { status: "signed", label: "Signé", variant: "success" as const };
    }
    if (canSign(signature)) {
      return { status: "pending", label: "À signer", variant: "warning" as const };
    }
    return { status: "waiting", label: "En attente", variant: "secondary" as const };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement des signatures...
        </CardContent>
      </Card>
    );
  }

  const allSigned = signatures.every(s => s.signed_by);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Signatures du mandat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ordonnancementStatut !== "valide" && !allSigned && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              L'ordonnancement doit être validé avant de pouvoir être signé.
            </AlertDescription>
          </Alert>
        )}

        {allSigned && (
          <Alert className="border-success/50 bg-success/10">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              Toutes les signatures sont complètes. Le mandat peut être transmis pour paiement.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {SIGNATURE_ROLES.map(({ role, label }) => {
            const signature = signatures.find(s => s.role === role);
            if (!signature) return null;

            const status = getSignatureStatus(signature);
            const canUserSign = canSign(signature);

            return (
              <div
                key={role}
                className={`p-4 rounded-lg border ${
                  status.status === "signed" 
                    ? "bg-success/5 border-success/30" 
                    : status.status === "pending"
                    ? "bg-warning/5 border-warning/30"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      status.status === "signed" ? "bg-success/20" : "bg-muted"
                    }`}>
                      {status.status === "signed" ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : status.status === "pending" ? (
                        <PenLine className="h-5 w-5 text-warning" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground">{role}</div>
                      {signature.signed_by && signature.signed_at && (
                        <div className="mt-2 text-sm">
                          <div className="flex items-center gap-1 text-success">
                            <User className="h-3 w-3" />
                            <span>
                              {signature.signer_profile?.full_name || "Utilisateur"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(signature.signed_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                          </div>
                          {signature.comments && (
                            <div className="mt-1 text-xs italic">
                              "{signature.comments}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        status.status === "signed" 
                          ? "bg-success/10 text-success border-success/20" 
                          : status.status === "pending"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : ""
                      }
                    >
                      {status.label}
                    </Badge>

                    {canUserSign && (
                      <Button
                        size="sm"
                        onClick={() => handleSign(signature.id, role)}
                        disabled={signing === signature.id}
                        className="gap-2"
                      >
                        <PenLine className="h-4 w-4" />
                        {signing === signature.id ? "Signature..." : "Signer"}
                      </Button>
                    )}
                  </div>
                </div>

                {canUserSign && (
                  <div className="mt-4 pt-4 border-t">
                    <Textarea
                      placeholder="Commentaire optionnel..."
                      value={signing === signature.id ? "" : comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
