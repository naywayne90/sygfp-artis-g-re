import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  user_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  exercice: number | null;
  created_at: string;
  user?: { full_name: string; email: string } | null;
}

export interface AuditFilters {
  entityType?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const ENTITY_TYPES = [
  { value: "note", label: "Notes" },
  { value: "engagement", label: "Engagements" },
  { value: "liquidation", label: "Liquidations" },
  { value: "ordonnancement", label: "Ordonnancements" },
  { value: "reglement", label: "Règlements" },
  { value: "budget_line", label: "Lignes budgétaires" },
  { value: "user_role", label: "Rôles utilisateurs" },
  { value: "dossier", label: "Dossiers" },
  { value: "marche", label: "Marchés" },
  { value: "contrat", label: "Contrats" },
];

export const ACTION_TYPES = [
  { value: "create", label: "Création" },
  { value: "update", label: "Modification" },
  { value: "delete", label: "Suppression" },
  { value: "validate", label: "Validation" },
  { value: "reject", label: "Rejet" },
  { value: "submit", label: "Soumission" },
  { value: "defer", label: "Report" },
  { value: "archive", label: "Archivage" },
  { value: "update_locked_field", label: "Modification champ verrouillé" },
  { value: "DIFFERE", label: "Différé" },
  { value: "RESOUMIS_APRES_DIFFERE", label: "Resoumis après différé" },
  { value: "ROLE_ADDED", label: "Rôle ajouté" },
  { value: "ROLE_REMOVED", label: "Rôle retiré" },
  { value: "ROLE_CHANGED", label: "Rôle modifié" },
];

export function useAuditJournal(filters: AuditFilters = {}) {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["audit-journal", exercice, filters],
    queryFn: async () => {
      if (!exercice) return [];
      
      let query = supabase
        .from("audit_logs")
        .select(`
          *,
          user:profiles!audit_logs_user_id_fkey(full_name, email)
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters.entityType) {
        query = query.eq("entity_type", filters.entityType);
      }

      if (filters.action) {
        query = query.eq("action", filters.action);
      }

      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate + "T23:59:59");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!exercice,
  });
}

export function useAuditStats() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["audit-stats", exercice],
    queryFn: async () => {
      if (!exercice) return { total: 0, byEntityType: {}, byAction: {}, byDay: {} };
      
      const { data, error } = await supabase
        .from("audit_logs")
        .select("entity_type, action, created_at")
        .eq("exercice", exercice);

      if (error) throw error;

      // Stats par type d'entité
      const byEntityType: Record<string, number> = {};
      // Stats par action
      const byAction: Record<string, number> = {};
      // Stats par jour (7 derniers jours)
      const byDay: Record<string, number> = {};

      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        byDay[d.toISOString().split("T")[0]] = 0;
      }

      data?.forEach((log) => {
        byEntityType[log.entity_type] = (byEntityType[log.entity_type] || 0) + 1;
        byAction[log.action] = (byAction[log.action] || 0) + 1;
        
        const day = log.created_at.split("T")[0];
        if (byDay[day] !== undefined) {
          byDay[day]++;
        }
      });

      return {
        total: data?.length || 0,
        byEntityType,
        byAction,
        byDay,
      };
    },
    enabled: !!exercice,
  });
}
