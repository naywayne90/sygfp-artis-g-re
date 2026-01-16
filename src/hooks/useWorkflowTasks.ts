import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { usePermissions } from "./usePermissions";
import { toast } from "sonner";

export interface WorkflowTask {
  id: string;
  task_type: 'validation' | 'correction' | 'signature' | 'paiement' | 'imputation' | 'approbation' | 'verification' | 'autre';
  entity_type: 'note_sef' | 'note_aef' | 'imputation' | 'engagement' | 'liquidation' | 'ordonnancement' | 'reglement' | 'virement' | 'marche';
  entity_id: string;
  entity_code: string;
  entity_title: string | null;
  dossier_id: string | null;
  assignee_user_id: string | null;
  assignee_role: string;
  direction_id: string | null;
  due_date: string | null;
  priority: 'basse' | 'normale' | 'haute' | 'urgente';
  sla_hours: number;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  montant: number | null;
  metadata: Record<string, unknown>;
  action_taken: string | null;
  completed_at: string | null;
  completed_by: string | null;
  completion_comment: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  exercice: number;
  // Relations
  direction?: { id: string; code: string; label: string } | null;
  dossier?: { id: string; numero: string; objet: string } | null;
  assignee?: { id: string; nom: string; prenom: string } | null;
}

export interface TaskFilters {
  scope: 'mine' | 'my_role' | 'my_direction' | 'all';
  status: 'open' | 'done' | 'all';
  priority?: string;
  entity_type?: string;
  task_type?: string;
  sla?: 'overdue' | 'today' | 'upcoming' | 'all';
}

export function useWorkflowTasks(filters: TaskFilters = { scope: 'my_role', status: 'open' }) {
  const { exercice } = useExercice();
  const { userRoles, userId } = usePermissions();
  const queryClient = useQueryClient();
  
  // Récupérer la direction de l'utilisateur
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-direction", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("direction_id")
        .eq("id", userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });
  
  const userDirectionId = userProfile?.direction_id || null;

  const query = useQuery({
    queryKey: ["workflow-tasks", exercice, filters, userRoles, userId],
    queryFn: async (): Promise<WorkflowTask[]> => {
      if (!exercice) return [];

      let query = supabase
        .from("workflow_tasks")
        .select(`
          *,
          direction:directions(id, code, label),
          dossier:dossiers(id, numero, objet),
          assignee:profiles!workflow_tasks_assignee_user_id_fkey(id, nom, prenom)
        `)
        .eq("exercice", exercice)
        .order("due_date", { ascending: true, nullsFirst: false });

      // Filtre par statut
      if (filters.status === 'open') {
        query = query.in("status", ["open", "in_progress"]);
      } else if (filters.status === 'done') {
        query = query.eq("status", "done");
      }

      // Filtre par priorité
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq("priority", filters.priority);
      }

      // Filtre par type d'entité
      if (filters.entity_type && filters.entity_type !== 'all') {
        query = query.eq("entity_type", filters.entity_type);
      }

      // Filtre par type de tâche
      if (filters.task_type && filters.task_type !== 'all') {
        query = query.eq("task_type", filters.task_type);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching workflow tasks:", error);
        return [];
      }

      let tasks = (data || []) as unknown as WorkflowTask[];

      // Filtrage côté client selon le scope
      if (filters.scope === 'mine') {
        tasks = tasks.filter(t => t.assignee_user_id === userId);
      } else if (filters.scope === 'my_role') {
        tasks = tasks.filter(t => {
          if (userRoles.includes("ADMIN") || userRoles.includes("DG")) return true;
          return userRoles.includes(t.assignee_role);
        });
      } else if (filters.scope === 'my_direction') {
        tasks = tasks.filter(t => {
          if (userRoles.includes("ADMIN") || userRoles.includes("DG")) return true;
          return t.direction_id === userDirectionId;
        });
      }

      // Filtre SLA
      if (filters.sla && filters.sla !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        tasks = tasks.filter(t => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);

          switch (filters.sla) {
            case 'overdue':
              return dueDate < now;
            case 'today':
              return dueDate >= today && dueDate < tomorrow;
            case 'upcoming':
              return dueDate >= tomorrow;
            default:
              return true;
          }
        });
      }

      // Exclure les tâches créées par l'utilisateur (séparation des tâches) pour validation
      tasks = tasks.filter(task => {
        if (task.task_type === 'validation' && task.created_by === userId) {
          return false;
        }
        return true;
      });

      return tasks;
    },
    enabled: !!exercice && userRoles.length > 0,
  });

  // Mutation pour prendre une tâche
  const takeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("workflow_tasks")
        .update({ 
          status: "in_progress", 
          assignee_user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq("id", taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tâche prise en charge");
      queryClient.invalidateQueries({ queryKey: ["workflow-tasks"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la prise en charge");
      console.error(error);
    }
  });

  // Mutation pour compléter une tâche
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, action, comment }: { taskId: string; action: string; comment?: string }) => {
      const { error } = await supabase
        .from("workflow_tasks")
        .update({ 
          status: "done", 
          action_taken: action,
          completed_at: new Date().toISOString(),
          completed_by: userId,
          completion_comment: comment
        })
        .eq("id", taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tâche terminée");
      queryClient.invalidateQueries({ queryKey: ["workflow-tasks"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la complétion");
      console.error(error);
    }
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    takeTask: takeTaskMutation.mutate,
    completeTask: completeTaskMutation.mutate,
    isTaking: takeTaskMutation.isPending,
    isCompleting: completeTaskMutation.isPending,
  };
}

export function useWorkflowTasksStats() {
  const { exercice } = useExercice();
  const { userRoles, userId } = usePermissions();

  return useQuery({
    queryKey: ["workflow-tasks-stats", exercice, userRoles],
    queryFn: async () => {
      if (!exercice) return null;

      const { data, error } = await supabase
        .from("workflow_tasks")
        .select("id, task_type, entity_type, status, priority, due_date, assignee_role")
        .eq("exercice", exercice)
        .in("status", ["open", "in_progress"]);

      if (error) {
        console.error("Error fetching task stats:", error);
        return null;
      }

      const now = new Date();
      const tasks = (data || []).filter(t => {
        if (userRoles.includes("ADMIN") || userRoles.includes("DG")) return true;
        return userRoles.includes(t.assignee_role);
      });

      return {
        total: tasks.length,
        overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < now).length,
        today: tasks.filter(t => {
          if (!t.due_date) return false;
          const due = new Date(t.due_date);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return due >= today && due < tomorrow;
        }).length,
        byType: {
          validation: tasks.filter(t => t.task_type === 'validation').length,
          signature: tasks.filter(t => t.task_type === 'signature').length,
          paiement: tasks.filter(t => t.task_type === 'paiement').length,
          approbation: tasks.filter(t => t.task_type === 'approbation').length,
        },
        byEntity: {
          notes: tasks.filter(t => t.entity_type.includes('note')).length,
          engagements: tasks.filter(t => t.entity_type === 'engagement').length,
          liquidations: tasks.filter(t => t.entity_type === 'liquidation').length,
          ordonnancements: tasks.filter(t => t.entity_type === 'ordonnancement').length,
          reglements: tasks.filter(t => t.entity_type === 'reglement').length,
          virements: tasks.filter(t => t.entity_type === 'virement').length,
        },
        byPriority: {
          urgente: tasks.filter(t => t.priority === 'urgente').length,
          haute: tasks.filter(t => t.priority === 'haute').length,
          normale: tasks.filter(t => t.priority === 'normale').length,
          basse: tasks.filter(t => t.priority === 'basse').length,
        },
      };
    },
    enabled: !!exercice && userRoles.length > 0,
  });
}
