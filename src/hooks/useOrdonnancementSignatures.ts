import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrdonnancementSignature {
  id: string;
  ordonnancement_id: string;
  signataire_role: string;
  signataire_label: string;
  signature_order: number;
  status: "pending" | "signed" | "rejected";
  signed_at: string | null;
  signed_by: string | null;
  comments: string | null;
  rejection_reason: string | null;
  created_at: string;
  signer?: { id: string; full_name: string | null } | null;
}

export interface OrdonnancementPiece {
  id: string;
  ordonnancement_id: string;
  piece_type: string;
  piece_label: string;
  file_path: string | null;
  file_name: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  included_in_parapheur: boolean;
  created_at: string;
}

export function useOrdonnancementSignatures(ordonnancementId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch signatures
  const { data: signatures = [], isLoading: isLoadingSignatures } = useQuery({
    queryKey: ["ordonnancement-signatures", ordonnancementId],
    queryFn: async () => {
      if (!ordonnancementId) return [];
      
      const { data, error } = await (supabase
        .from("ordonnancement_signatures" as any)
        .select(`
          *,
          signer:profiles!ordonnancement_signatures_signed_by_fkey(id, full_name)
        `)
        .eq("ordonnancement_id", ordonnancementId)
        .order("signature_order") as any);

      if (error) throw error;
      return data as OrdonnancementSignature[];
    },
    enabled: !!ordonnancementId,
  });

  // Fetch pieces for parapheur
  const { data: pieces = [], isLoading: isLoadingPieces } = useQuery({
    queryKey: ["ordonnancement-pieces", ordonnancementId],
    queryFn: async () => {
      if (!ordonnancementId) return [];
      
      const { data, error } = await (supabase
        .from("ordonnancement_pieces" as any)
        .select("*")
        .eq("ordonnancement_id", ordonnancementId)
        .order("piece_type") as any);

      if (error) throw error;
      return data as OrdonnancementPiece[];
    },
    enabled: !!ordonnancementId,
  });

  // Sign
  const signMutation = useMutation({
    mutationFn: async ({ 
      signatureId, 
      comments 
    }: { 
      signatureId: string; 
      comments?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await (supabase
        .from("ordonnancement_signatures" as any)
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signed_by: user.id,
          comments: comments || null,
        })
        .eq("id", signatureId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancement-signatures", ordonnancementId] });
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Signature apposée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Reject signature
  const rejectSignatureMutation = useMutation({
    mutationFn: async ({ 
      signatureId, 
      reason 
    }: { 
      signatureId: string; 
      reason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await (supabase
        .from("ordonnancement_signatures" as any)
        .update({
          status: "rejected",
          signed_at: new Date().toISOString(),
          signed_by: user.id,
          rejection_reason: reason,
        })
        .eq("id", signatureId) as any);

      if (error) throw error;

      // Also reject the ordonnancement
      const { data: sig } = await (supabase
        .from("ordonnancement_signatures" as any)
        .select("ordonnancement_id")
        .eq("id", signatureId)
        .single() as any);

      if (sig) {
        await supabase
          .from("ordonnancements")
          .update({
            statut: "rejete",
            signature_status: "rejected",
            rejection_reason: reason,
            rejected_at: new Date().toISOString(),
          })
          .eq("id", sig.ordonnancement_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancement-signatures", ordonnancementId] });
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Signature rejetée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Get current signature to approve (first pending)
  const currentSignature = signatures.find(s => s.status === "pending");
  const allSigned = signatures.length > 0 && signatures.every(s => s.status === "signed");
  const isRejected = signatures.some(s => s.status === "rejected");
  const signedCount = signatures.filter(s => s.status === "signed").length;

  return {
    signatures,
    pieces,
    isLoading: isLoadingSignatures || isLoadingPieces,
    currentSignature,
    allSigned,
    isRejected,
    signedCount,
    totalSignatures: signatures.length,
    sign: signMutation.mutate,
    rejectSignature: rejectSignatureMutation.mutate,
    isSigning: signMutation.isPending,
    isRejecting: rejectSignatureMutation.isPending,
  };
}
