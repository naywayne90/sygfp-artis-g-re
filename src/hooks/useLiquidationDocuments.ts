import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface LiquidationDocument {
  id: string;
  liquidation_id: string;
  document_type: string;
  document_label: string;
  is_required: boolean;
  is_provided: boolean;
  is_verified: boolean;
  provided_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  file_path: string | null;
  file_name: string | null;
  observation: string | null;
  created_at: string;
}

export interface LiquidationDocumentsChecklistStatus {
  totalRequired: number;
  providedRequired: number;
  verifiedRequired: number;
  isComplete: boolean;
  isFullyVerified: boolean;
  missingLabels: string[];
}

export function useLiquidationDocuments(liquidationId: string | undefined) {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["liquidation-documents", liquidationId],
    queryFn: async () => {
      if (!liquidationId) return [];
      
      // Using type assertion as the table is newly created and types may not be synced
      const { data, error } = await (supabase
        .from("liquidation_documents" as any)
        .select("*")
        .eq("liquidation_id", liquidationId)
        .order("is_required", { ascending: false })
        .order("document_type") as any);
      if (error) throw error;
      return data as LiquidationDocument[];
    },
    enabled: !!liquidationId,
  });

  // Calculate checklist status
  const checklistStatus: LiquidationDocumentsChecklistStatus = {
    totalRequired: documents.filter(d => d.is_required).length,
    providedRequired: documents.filter(d => d.is_required && d.is_provided).length,
    verifiedRequired: documents.filter(d => d.is_required && d.is_verified).length,
    isComplete: documents.filter(d => d.is_required).every(d => d.is_provided),
    isFullyVerified: documents.filter(d => d.is_required).every(d => d.is_verified),
    missingLabels: documents.filter(d => d.is_required && !d.is_provided).map(d => d.document_label),
  };

  // Mark document as provided
  const markAsProvidedMutation = useMutation({
    mutationFn: async ({
      documentId,
      filePath,
      fileName,
      fileSize,
      fileType,
    }: {
      documentId: string;
      filePath?: string;
      fileName?: string;
      fileSize?: number;
      fileType?: string;
    }) => {
      // Get old values for audit
      const { data: oldDoc } = await (supabase
        .from("liquidation_documents" as any)
        .select("is_provided, file_path, file_name, document_label")
        .eq("id", documentId)
        .single() as any);

      const { error } = await (supabase
        .from("liquidation_documents" as any)
        .update({
          is_provided: true,
          provided_at: new Date().toISOString(),
          file_path: filePath || null,
          file_name: fileName || null,
        })
        .eq("id", documentId) as any);
      if (error) throw error;

      // Audit log
      if (liquidationId) {
        await logAction({
          entityType: "liquidation",
          entityId: liquidationId,
          action: "UPLOAD",
          oldValues: { is_provided: oldDoc?.is_provided, file_name: oldDoc?.file_name },
          newValues: {
            is_provided: true,
            file_name: fileName,
            document_id: documentId,
            document_label: oldDoc?.document_label,
            file_size: fileSize,
            file_type: fileType,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidation-documents", liquidationId] });
      toast.success("Document marqué comme fourni");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Verify document
  const verifyDocumentMutation = useMutation({
    mutationFn: async ({
      documentId,
      observation,
    }: {
      documentId: string;
      observation?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Get document info for audit
      const { data: doc } = await (supabase
        .from("liquidation_documents" as any)
        .select("document_label, file_name")
        .eq("id", documentId)
        .single() as any);

      const { error } = await (supabase
        .from("liquidation_documents" as any)
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          observation: observation || null,
        })
        .eq("id", documentId) as any);

      if (error) throw error;

      // Audit log
      if (liquidationId) {
        await logAction({
          entityType: "liquidation",
          entityId: liquidationId,
          action: "VALIDATE",
          newValues: {
            document_id: documentId,
            document_label: doc?.document_label,
            file_name: doc?.file_name,
            verified: true,
            observation: observation || null,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidation-documents", liquidationId] });
      toast.success("Document vérifié");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Unmark document
  const unmarkDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      // Get old values for audit
      const { data: oldDoc } = await (supabase
        .from("liquidation_documents" as any)
        .select("document_label, file_name, is_provided, is_verified")
        .eq("id", documentId)
        .single() as any);

      const { error } = await (supabase
        .from("liquidation_documents" as any)
        .update({
          is_provided: false,
          is_verified: false,
          provided_at: null,
          verified_at: null,
          verified_by: null,
          file_path: null,
          file_name: null,
        })
        .eq("id", documentId) as any);

      if (error) throw error;

      // Audit log
      if (liquidationId) {
        await logAction({
          entityType: "liquidation",
          entityId: liquidationId,
          action: "DELETE",
          oldValues: {
            document_id: documentId,
            document_label: oldDoc?.document_label,
            file_name: oldDoc?.file_name,
            is_provided: oldDoc?.is_provided,
            is_verified: oldDoc?.is_verified,
          },
          newValues: { is_provided: false, is_verified: false },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidation-documents", liquidationId] });
      toast.success("Marquage annulé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    documents,
    isLoading,
    checklistStatus,
    markAsProvided: markAsProvidedMutation.mutate,
    verifyDocument: verifyDocumentMutation.mutate,
    unmarkDocument: unmarkDocumentMutation.mutate,
    isMarking: markAsProvidedMutation.isPending,
    isVerifying: verifyDocumentMutation.isPending,
  };
}
