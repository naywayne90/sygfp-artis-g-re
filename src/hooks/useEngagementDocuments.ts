import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  { value: "marche", label: "Contrat/Marché signé" },
  { value: "bon_commande", label: "Bon de commande" },
  { value: "devis", label: "Devis/Proforma" },
  { value: "justificatif", label: "Justificatif de la dépense" },
  { value: "pv_attribution", label: "PV d'attribution" },
  { value: "autre", label: "Autre document" },
];

export function useEngagementDocuments(engagementId?: string) {
  const queryClient = useQueryClient();

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
  const checklistStatus = {
    total: documents.filter(d => d.est_obligatoire).length,
    provided: documents.filter(d => d.est_obligatoire && d.est_fourni).length,
    isComplete: documents.filter(d => d.est_obligatoire).every(d => d.est_fourni),
    percentage: documents.filter(d => d.est_obligatoire).length > 0
      ? Math.round((documents.filter(d => d.est_obligatoire && d.est_fourni).length / 
          documents.filter(d => d.est_obligatoire).length) * 100)
      : 100,
  };

  // Mark document as provided
  const markProvidedMutation = useMutation({
    mutationFn: async ({ documentId, provided }: { documentId: string; provided: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("engagement_documents")
        .update({
          est_fourni: provided,
          uploaded_by: provided ? user.user?.id : null,
          uploaded_at: provided ? new Date().toISOString() : null,
        })
        .eq("id", documentId);

      if (error) throw error;
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
    mutationFn: async (data: { type_document: string; libelle: string; description?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("engagement_documents")
        .insert({
          engagement_id: engagementId,
          ...data,
          est_obligatoire: false,
          est_fourni: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-documents", engagementId] });
      toast.success("Document ajouté");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Verify document
  const verifyDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("engagement_documents")
        .update({
          verified_by: user.user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (error) throw error;
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
  };
}
