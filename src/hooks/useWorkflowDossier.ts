import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useExercice } from "@/contexts/ExerciceContext";

export interface WorkflowInstance {
  id: string;
  dossier_id: string;
  etape_code: string;
  entity_id: string | null;
  statut: "brouillon" | "soumis" | "a_valider" | "valide" | "rejete" | "annule" | "differe";
  assigned_to: string | null;
  date_debut: string;
  date_fin: string | null;
  commentaire: string | null;
  pieces_jointes: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowProgress {
  etape_code: string;
  etape_libelle: string;
  etape_ordre: number;
  statut: string;
  date_debut: string | null;
  date_fin: string | null;
  assigned_to_name: string | null;
}

/**
 * Hook pour gérer le workflow d'un dossier spécifique
 */
export function useWorkflowDossier(dossierId: string | undefined) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const { _exercice } = useExercice();
  const queryClient = useQueryClient();

  // Récupérer les instances de workflow pour ce dossier
  const instances = useQuery({
    queryKey: ["workflow-instances", dossierId],
    queryFn: async () => {
      if (!dossierId) return [];
      
      const { data, error } = await supabase
        .from("workflow_instances")
        .select(`
          *,
          workflow_etapes (
            code,
            libelle,
            ordre,
            description
          )
        `)
        .eq("dossier_id", dossierId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!dossierId,
  });

  // Récupérer la progression complète du dossier via la fonction RPC
  const progress = useQuery({
    queryKey: ["workflow-progress", dossierId],
    queryFn: async () => {
      if (!dossierId) return [];
      
      const { data, error } = await supabase
        .rpc("get_dossier_workflow_progress", { p_dossier_id: dossierId });

      if (error) throw error;
      return data as WorkflowProgress[];
    },
    enabled: !!dossierId,
  });

  // Récupérer l'étape courante
  const currentStep = useQuery({
    queryKey: ["workflow-current-step", dossierId],
    queryFn: async () => {
      if (!dossierId) return null;
      
      const { data, error } = await supabase
        .rpc("get_dossier_current_step", { p_dossier_id: dossierId });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!dossierId,
  });

  // Créer une nouvelle instance de workflow
  const createInstance = useMutation({
    mutationFn: async ({
      etapeCode,
      entityId,
      assignedTo,
      commentaire,
    }: {
      etapeCode: string;
      entityId?: string;
      assignedTo?: string;
      commentaire?: string;
    }) => {
      if (!dossierId) throw new Error("Dossier ID requis");

      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("workflow_instances")
        .insert({
          dossier_id: dossierId,
          etape_code: etapeCode,
          entity_id: entityId,
          assigned_to: assignedTo,
          commentaire,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "workflow_instance",
        entityId: data.id,
        action: "create",
        newValues: data,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-instances", dossierId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-progress", dossierId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-current-step", dossierId] });
      toast({ title: "Étape créée", description: "L'étape workflow a été initialisée." });
    },
    onError: (error) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Mettre à jour le statut d'une instance
  const updateStatus = useMutation({
    mutationFn: async ({
      instanceId,
      newStatus,
      commentaire,
    }: {
      instanceId: string;
      newStatus: WorkflowInstance["statut"];
      commentaire?: string;
    }) => {
      const { data: oldData } = await supabase
        .from("workflow_instances")
        .select()
        .eq("id", instanceId)
        .single();

      const updates: Partial<WorkflowInstance> = {
        statut: newStatus,
        commentaire: commentaire || oldData?.commentaire,
      };

      // Si validé, ajouter la date de fin
      if (newStatus === "valide") {
        updates.date_fin = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("workflow_instances")
        .update(updates)
        .eq("id", instanceId)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        entityType: "workflow_instance",
        entityId: instanceId,
        action: "update",
        oldValues: oldData,
        newValues: data,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-instances", dossierId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-progress", dossierId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-current-step", dossierId] });
      toast({ title: "Statut mis à jour" });
    },
    onError: (error) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Avancer à l'étape suivante
  const advanceToNextStep = useMutation({
    mutationFn: async (nextEtapeCode: string) => {
      if (!dossierId) throw new Error("Dossier ID requis");

      // D'abord valider l'étape courante si elle existe
      const currentStepData = currentStep.data;
      if (currentStepData) {
        const { data: currentInstance } = await supabase
          .from("workflow_instances")
          .select("id")
          .eq("dossier_id", dossierId)
          .eq("etape_code", currentStepData.etape_code)
          .single();

        if (currentInstance) {
          await supabase
            .from("workflow_instances")
            .update({ 
              statut: "valide", 
              date_fin: new Date().toISOString() 
            })
            .eq("id", currentInstance.id);
        }
      }

      // Créer la nouvelle étape
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("workflow_instances")
        .insert({
          dossier_id: dossierId,
          etape_code: nextEtapeCode,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-instances", dossierId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-progress", dossierId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-current-step", dossierId] });
      toast({ title: "Passage à l'étape suivante" });
    },
    onError: (error) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  return {
    instances: instances.data || [],
    progress: progress.data || [],
    currentStep: currentStep.data,
    isLoading: instances.isLoading || progress.isLoading,
    createInstance,
    updateStatus,
    advanceToNextStep,
  };
}
