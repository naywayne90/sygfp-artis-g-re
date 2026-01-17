import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";

export interface EngagementDocument {
  id: string;
  engagement_id: string;
  type_document: string;
  libelle: string;
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  est_obligatoire: boolean;
  est_fourni: boolean;
  uploaded_by: string | null;
  uploaded_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export const TYPES_DOCUMENTS_ENGAGEMENT = [
  { value: "marche", label: "Contrat/Marché signé", obligatoire: false },
  { value: "bon_commande", label: "Bon de commande", obligatoire: true },
  { value: "devis", label: "Devis/Proforma", obligatoire: true },
  { value: "justificatif", label: "Justificatif de la dépense", obligatoire: false },
  { value: "pv_attribution", label: "PV d'attribution", obligatoire: false },
  { value: "pv_reception", label: "PV de réception", obligatoire: false },
  { value: "facture_proforma", label: "Facture proforma", obligatoire: false },
  { value: "autre", label: "Autre document", obligatoire: false },
];

// File type validation
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export function useEngagementDocuments(engagementId?: string) {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["engagement-documents", engagementId],
    queryFn: async () => {
      if (!engagementId) return [];
      
      const { data, error } = await supabase
        .from("engagement_documents")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("est_obligatoire", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as EngagementDocument[];
    },
    enabled: !!engagementId,
  });

  // Calculate checklist status
  const obligatoires = documents.filter(d => d.est_obligatoire);
  const fournis = documents.filter(d => d.est_fourni);
  const fourniObligatoires = documents.filter(d => d.est_obligatoire && d.est_fourni);
  const verifies = documents.filter(d => d.verified_at);
  const manquants = documents.filter(d => d.est_obligatoire && !d.est_fourni);

  const checklistStatus = {
    total: obligatoires.length,
    totalAll: documents.length,
    provided: fourniObligatoires.length,
    providedAll: fournis.length,
    verified: verifies.length,
    isComplete: obligatoires.every(d => d.est_fourni),
    isFullyVerified: fournis.every(d => d.verified_at),
    percentage: obligatoires.length > 0
      ? Math.round((fourniObligatoires.length / obligatoires.length) * 100)
      : 100,
    missingLabels: manquants.map(d => d.libelle),
  };

  // Mark document as provided (with optional file info)
  const markProvidedMutation = useMutation({
    mutationFn: async ({
      documentId,
      provided,
      filePath,
      fileName,
      fileSize,
      fileType,
    }: {
      documentId: string;
      provided: boolean;
      filePath?: string;
      fileName?: string;
      fileSize?: number;
      fileType?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      // Get old values for audit
      const { data: oldDoc } = await supabase
        .from("engagement_documents")
        .select("est_fourni, file_path, file_name")
        .eq("id", documentId)
        .single();

      const { error } = await supabase
        .from("engagement_documents")
        .update({
          est_fourni: provided,
          file_path: provided ? (filePath || null) : null,
          file_name: provided ? (fileName || null) : null,
          file_size: provided ? (fileSize || null) : null,
          file_type: provided ? (fileType || null) : null,
          uploaded_by: provided ? user.user?.id : null,
          uploaded_at: provided ? new Date().toISOString() : null,
          // Clear verification if re-uploading
          verified_by: null,
          verified_at: null,
        })
        .eq("id", documentId);

      if (error) throw error;

      // Audit log
      if (engagementId) {
        await logAction({
          entityType: "engagement",
          entityId: engagementId,
          action: provided ? "UPLOAD" : "DELETE",
          oldValues: { est_fourni: oldDoc?.est_fourni, file_name: oldDoc?.file_name },
          newValues: { est_fourni: provided, file_name: fileName, document_id: documentId },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-documents", engagementId] });
      toast.success("Document mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Add custom document
  const addDocumentMutation = useMutation({
    mutationFn: async (data: {
      type_document: string;
      libelle: string;
      description?: string;
      est_obligatoire?: boolean;
    }) => {
      const { error, data: newDoc } = await supabase
        .from("engagement_documents")
        .insert({
          engagement_id: engagementId,
          ...data,
          est_obligatoire: data.est_obligatoire ?? false,
          est_fourni: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Audit log
      if (engagementId) {
        await logAction({
          entityType: "engagement",
          entityId: engagementId,
          action: "CREATE",
          newValues: { document_id: newDoc.id, type: data.type_document, libelle: data.libelle },
        });
      }

      return newDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-documents", engagementId] });
      toast.success("Document ajouté à la checklist");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Verify document
  const verifyDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { data: user } = await supabase.auth.getUser();

      // Get document info for audit
      const { data: doc } = await supabase
        .from("engagement_documents")
        .select("libelle, file_name")
        .eq("id", documentId)
        .single();

      const { error } = await supabase
        .from("engagement_documents")
        .update({
          verified_by: user.user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (error) throw error;

      // Audit log
      if (engagementId) {
        await logAction({
          entityType: "engagement",
          entityId: engagementId,
          action: "VALIDATE",
          newValues: {
            document_id: documentId,
            document_libelle: doc?.libelle,
            file_name: doc?.file_name,
            verified: true
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-documents", engagementId] });
      toast.success("Document vérifié");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    documents,
    isLoading,
    checklistStatus,
    markProvided: markProvidedMutation.mutateAsync,
    addDocument: addDocumentMutation.mutateAsync,
    verifyDocument: verifyDocumentMutation.mutateAsync,
    isMarking: markProvidedMutation.isPending,
    isAdding: addDocumentMutation.isPending,
    isVerifying: verifyDocumentMutation.isPending,
  };
}
