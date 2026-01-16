import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MarcheDocument {
  id: string;
  marche_id: string;
  type_document: string;
  libelle: string;
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MarcheHistorique {
  id: string;
  marche_id: string;
  type_action: string;
  description: string;
  ancien_statut: string | null;
  nouveau_statut: string | null;
  commentaire: string | null;
  user_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  // Joined
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
  } | null;
}

export const TYPES_DOCUMENTS_MARCHE = [
  { value: "pv_lancement", label: "PV de lancement" },
  { value: "pv_ouverture", label: "PV d'ouverture des plis" },
  { value: "pv_attribution", label: "PV d'attribution" },
  { value: "devis", label: "Devis / Proforma" },
  { value: "contrat", label: "Contrat" },
  { value: "bon_commande", label: "Bon de commande" },
  { value: "cahier_charges", label: "Cahier des charges" },
  { value: "lettre_invitation", label: "Lettre d'invitation" },
  { value: "tableau_evaluation", label: "Tableau d'évaluation" },
  { value: "autre", label: "Autre document" },
];

export function useMarcheDocuments(marcheId?: string) {
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ["marche-documents", marcheId],
    queryFn: async () => {
      if (!marcheId) return [];
      
      const { data, error } = await supabase
        .from("marche_documents")
        .select("*")
        .eq("marche_id", marcheId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data as MarcheDocument[];
    },
    enabled: !!marcheId,
  });

  // Fetch historique
  const { data: historique = [], isLoading: loadingHistorique } = useQuery({
    queryKey: ["marche-historique", marcheId],
    queryFn: async () => {
      if (!marcheId) return [];
      
      const { data, error } = await supabase
        .from("marche_historique")
        .select("*")
        .eq("marche_id", marcheId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(h => ({ ...h, user: null })) as MarcheHistorique[];
    },
    enabled: !!marcheId,
  });

  // Add document
  const addDocumentMutation = useMutation({
    mutationFn: async (data: Omit<MarcheDocument, "id" | "created_at" | "uploaded_at" | "uploaded_by">) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: doc, error } = await supabase
        .from("marche_documents")
        .insert({
          ...data,
          uploaded_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marche-documents", marcheId] });
      toast.success("Document ajouté");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Delete document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from("marche_documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marche-documents", marcheId] });
      toast.success("Document supprimé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    documents,
    historique,
    loadingDocuments,
    loadingHistorique,
    addDocument: addDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    isAdding: addDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
  };
}
