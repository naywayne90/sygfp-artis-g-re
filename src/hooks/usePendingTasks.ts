import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { usePermissions } from "./usePermissions";

export interface PendingTask {
  entity_type: string;
  entity_id: string;
  entity_code: string;
  title: string;
  status: string;
  created_at: string;
  created_by: string;
  target_role: string;
  exercice: number;
}

export function usePendingTasks() {
  const { exercice } = useExercice();
  const { userRoles, userId } = usePermissions();

  return useQuery({
    queryKey: ["pending-tasks", exercice, userRoles],
    queryFn: async (): Promise<PendingTask[]> => {
      if (!exercice) return [];

      const { data, error } = await supabase
        .from("pending_tasks_by_role")
        .select("*")
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending tasks:", error);
        return [];
      }

      // Filtrer par rôle de l'utilisateur
      const filteredTasks = (data || []).filter((task) => {
        if (!task.target_role) return false;
        // L'admin voit tout
        if (userRoles.includes("ADMIN")) return true;
        // Sinon, vérifier si le rôle correspond
        return userRoles.includes(task.target_role);
      });

      // Exclure les tâches créées par l'utilisateur (séparation des tâches) pour validation
      return filteredTasks.filter((task) => {
        if (task.status === "soumis" && task.created_by === userId) {
          return false; // Ne peut pas valider ses propres créations
        }
        return true;
      });
    },
    enabled: !!exercice && userRoles.length > 0,
  });
}

// Stats par type d'entité
export function usePendingTasksStats() {
  const { data: tasks = [], isLoading } = usePendingTasks();

  const stats = {
    total: tasks.length,
    notes: tasks.filter((t) => t.entity_type === "note").length,
    engagements: tasks.filter((t) => t.entity_type === "engagement").length,
    liquidations: tasks.filter((t) => t.entity_type === "liquidation").length,
    ordonnancements: tasks.filter((t) => t.entity_type === "ordonnancement").length,
    virements: tasks.filter((t) => t.entity_type === "virement").length,
  };

  return { stats, isLoading };
}
