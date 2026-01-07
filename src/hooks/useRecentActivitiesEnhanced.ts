import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { fr } from "date-fns/locale";

export interface Activity {
  id: string;
  type: "note" | "engagement" | "liquidation" | "ordonnancement" | "marche" | "virement" | "prestataire" | "contrat" | "other";
  action: string;
  actionLabel: string;
  title: string;
  code: string | null;
  time: string;
  timeGroup: "today" | "yesterday" | "thisWeek" | "older";
  date: Date;
  entityTable: string;
  entityId: string | null;
  user: {
    name: string | null;
    role: string | null;
  };
  link: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Créé",
  update: "Modifié",
  delete: "Supprimé",
  validate: "Validé",
  reject: "Rejeté",
  submit: "Soumis",
  defer: "Différé",
  execute: "Exécuté",
  pay: "Payé",
  import: "Importé",
  cancel: "Annulé",
  transfer_submitted: "Virement soumis",
  transfer_validated: "Virement validé",
  transfer_executed: "Virement exécuté",
  transfer_cancelled: "Virement annulé",
  supplier_suspended: "Prestataire suspendu",
  supplier_activated: "Prestataire activé",
  alert_resolved: "Alerte résolue",
  ROLE_ADDED: "Rôle ajouté",
  ROLE_REMOVED: "Rôle retiré",
};

const ENTITY_ROUTES: Record<string, string> = {
  notes_dg: "/notes-aef",
  note: "/notes-aef",
  budget_engagements: "/engagements",
  engagement: "/engagements",
  budget_liquidations: "/liquidations",
  liquidation: "/liquidations",
  ordonnancements: "/ordonnancements",
  ordonnancement: "/ordonnancements",
  marches: "/marches",
  marche: "/marches",
  credit_transfers: "/planification/virements",
  virement: "/planification/virements",
  prestataires: "/contractualisation/prestataires",
  prestataire: "/contractualisation/prestataires",
  contrats: "/contractualisation/contrats",
  contrat: "/contractualisation/contrats",
};

function getTimeGroup(date: Date): Activity["timeGroup"] {
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  if (isThisWeek(date)) return "thisWeek";
  return "older";
}

function mapEntityType(entityType: string): Activity["type"] {
  const mapping: Record<string, Activity["type"]> = {
    notes_dg: "note",
    note: "note",
    budget_engagements: "engagement",
    engagement: "engagement",
    budget_liquidations: "liquidation",
    liquidation: "liquidation",
    ordonnancements: "ordonnancement",
    ordonnancement: "ordonnancement",
    marches: "marche",
    marche: "marche",
    credit_transfers: "virement",
    virement: "virement",
    prestataires: "prestataire",
    prestataire: "prestataire",
    contrats: "contrat",
    contrat: "contrat",
  };
  return mapping[entityType] || "other";
}

export function useRecentActivitiesEnhanced(limit: number = 10) {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["recent-activities-enhanced", exercice, limit],
    queryFn: async (): Promise<Activity[]> => {
      // Use raw query to access new columns that might not be in types yet
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select(`
          id, 
          entity_type, 
          entity_id, 
          action, 
          created_at, 
          user_id,
          exercice,
          user:profiles!audit_logs_user_id_fkey(full_name, email)
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false })
        .limit(limit * 2);

      if (error) {
        console.error("Error fetching audit logs:", error);
        return [];
      }

      if (!logs || logs.length === 0) return [];

      const activities = (logs as any[]).map((log) => {
        if (!log || Array.isArray(log)) return null;

      if (error) {
        console.error("Error fetching audit logs:", error);
        return [];
      }

      if (!logs || logs.length === 0) {
        return [];
      }

        const date = new Date(log.created_at);
        const entityType = mapEntityType(log.entity_type);
        const baseRoute = ENTITY_ROUTES[log.entity_type] || "/";
        
        // Build display title
        const entityCode = log.entity_code || null;
        const resume = log.resume || null;
        let title = resume || "";
        if (!title) {
          const typeLabels: Record<string, string> = {
            note: "Note",
            engagement: "Engagement",
            liquidation: "Liquidation",
            ordonnancement: "Ordonnancement",
            marche: "Marché",
            virement: "Virement",
            prestataire: "Prestataire",
            contrat: "Contrat",
          };
          title = `${typeLabels[entityType] || "Élément"} ${entityCode || log.entity_id?.slice(0, 8) || ""}`;
        }

        return {
          id: log.id,
          type: entityType,
          action: log.action,
          actionLabel: ACTION_LABELS[log.action] || log.action.replace(/_/g, " "),
          title,
          code: entityCode,
          time: formatDistanceToNow(date, { addSuffix: true, locale: fr }),
          timeGroup: getTimeGroup(date),
          date,
          entityTable: log.entity_type,
          entityId: log.entity_id,
          user: {
            name: log.user?.full_name || log.user?.email || null,
            role: log.user_role || null,
          },
          link: log.entity_id ? `${baseRoute}?id=${log.entity_id}` : baseRoute,
        };
      }).filter(Boolean) as Activity[];

      return activities.slice(0, limit);
    },
    enabled: !!exercice,
  });
}

// Group activities by time period
export function groupActivitiesByTime(activities: Activity[]): {
  today: Activity[];
  yesterday: Activity[];
  thisWeek: Activity[];
  older: Activity[];
} {
  return {
    today: activities.filter(a => a.timeGroup === "today"),
    yesterday: activities.filter(a => a.timeGroup === "yesterday"),
    thisWeek: activities.filter(a => a.timeGroup === "thisWeek"),
    older: activities.filter(a => a.timeGroup === "older"),
  };
}
