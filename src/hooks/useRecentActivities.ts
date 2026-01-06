import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export interface Activity {
  id: string;
  type: "note" | "engagement" | "liquidation" | "ordonnancement" | "marche" | "user_role" | "other";
  title: string;
  action: string;
  time: string;
  status: string;
  date: Date;
}

export function useRecentActivities() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["recent-activities", exercice],
    queryFn: async (): Promise<Activity[]> => {
      // CORRECTION: Basculer vers audit_logs pour les activités récentes
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("id, entity_type, entity_id, action, created_at, user_id, exercice")
        .eq("exercice", exercice)
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) {
        console.error("Error fetching audit logs:", error);
        // Fallback vers l'ancienne méthode si audit_logs échoue
        return fetchActivitiesLegacy(exercice);
      }

      if (!logs || logs.length === 0) {
        // Si pas de logs, fallback vers l'ancienne méthode
        return fetchActivitiesLegacy(exercice);
      }

      const activities: Activity[] = logs.map(log => ({
        id: log.id,
        type: mapEntityType(log.entity_type),
        title: formatTitle(log.entity_type, log.entity_id),
        action: formatAction(log.action),
        time: formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr }),
        status: log.action.toLowerCase(),
        date: new Date(log.created_at),
      }));

      return activities.slice(0, 8);
    },
    enabled: !!exercice,
  });
}

// Fallback function en cas d'échec de l'audit_logs
async function fetchActivitiesLegacy(exercice: number): Promise<Activity[]> {
  const activities: Activity[] = [];

  // Fetch recent notes
  const { data: notes } = await supabase
    .from("notes_dg")
    .select("id, numero, statut, created_at, updated_at")
    .eq("exercice", exercice)
    .order("updated_at", { ascending: false })
    .limit(5);

  notes?.forEach(note => {
    activities.push({
      id: note.id,
      type: "note",
      title: `Note ${note.numero || "N/A"}`,
      action: getStatusAction(note.statut),
      time: formatDistanceToNow(new Date(note.updated_at), { addSuffix: true, locale: fr }),
      status: note.statut || "en_attente",
      date: new Date(note.updated_at),
    });
  });

  // Fetch recent engagements
  const { data: engagements } = await supabase
    .from("budget_engagements")
    .select("id, numero, statut, created_at, updated_at")
    .eq("exercice", exercice)
    .order("updated_at", { ascending: false })
    .limit(5);

  engagements?.forEach(eng => {
    activities.push({
      id: eng.id,
      type: "engagement",
      title: `Engagement ${eng.numero}`,
      action: getStatusAction(eng.statut),
      time: formatDistanceToNow(new Date(eng.updated_at), { addSuffix: true, locale: fr }),
      status: eng.statut || "en_attente",
      date: new Date(eng.updated_at),
    });
  });

  // Fetch recent liquidations
  const { data: liquidations } = await supabase
    .from("budget_liquidations")
    .select("id, numero, statut, created_at")
    .eq("exercice", exercice)
    .order("created_at", { ascending: false })
    .limit(5);

  liquidations?.forEach(liq => {
    activities.push({
      id: liq.id,
      type: "liquidation",
      title: `Liquidation ${liq.numero}`,
      action: getStatusAction(liq.statut),
      time: formatDistanceToNow(new Date(liq.created_at), { addSuffix: true, locale: fr }),
      status: liq.statut || "en_attente",
      date: new Date(liq.created_at),
    });
  });

  // Fetch recent ordonnancements
  const { data: ordonnancements } = await supabase
    .from("ordonnancements")
    .select("id, numero, statut, created_at, updated_at")
    .eq("exercice", exercice)
    .order("updated_at", { ascending: false })
    .limit(5);

  ordonnancements?.forEach(ord => {
    activities.push({
      id: ord.id,
      type: "ordonnancement",
      title: `Ordonnancement ${ord.numero || "N/A"}`,
      action: getStatusAction(ord.statut),
      time: formatDistanceToNow(new Date(ord.updated_at), { addSuffix: true, locale: fr }),
      status: ord.statut || "en_attente",
      date: new Date(ord.updated_at),
    });
  });

  // Sort by date and return top 8
  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);
}

function mapEntityType(entityType: string): Activity["type"] {
  switch (entityType) {
    case "note":
    case "notes_dg":
      return "note";
    case "engagement":
    case "budget_engagements":
      return "engagement";
    case "liquidation":
    case "budget_liquidations":
      return "liquidation";
    case "ordonnancement":
    case "ordonnancements":
      return "ordonnancement";
    case "marche":
    case "marches":
      return "marche";
    case "user_role":
      return "user_role";
    default:
      return "other";
  }
}

function formatTitle(entityType: string, entityId: string | null): string {
  const type = mapEntityType(entityType);
  const shortId = entityId?.slice(0, 8) || "N/A";
  
  switch (type) {
    case "note": return `Note ${shortId}`;
    case "engagement": return `Engagement ${shortId}`;
    case "liquidation": return `Liquidation ${shortId}`;
    case "ordonnancement": return `Ordonnancement ${shortId}`;
    case "marche": return `Marché ${shortId}`;
    case "user_role": return `Modification rôle`;
    default: return `Activité ${shortId}`;
  }
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    "CREATE": "créé",
    "UPDATE": "modifié",
    "DELETE": "supprimé",
    "VALIDATE": "validé",
    "REJECT": "rejeté",
    "DIFFERE": "différé",
    "SUBMIT": "soumis",
    "ROLE_ADDED": "rôle ajouté",
    "ROLE_REMOVED": "rôle retiré",
    "ROLE_CHANGED": "rôle modifié",
    "NOTIFICATION_TRIGGERED": "notification envoyée",
    "RESOUMIS_APRES_DIFFERE": "resoumis après report",
  };
  
  return actionMap[action] || action.toLowerCase().replace(/_/g, " ");
}

function getStatusAction(status: string | null): string {
  switch (status) {
    case "brouillon":
      return "créé en brouillon";
    case "soumis":
      return "soumis pour validation";
    case "en_attente":
      return "en attente de traitement";
    case "en_cours":
      return "en cours de traitement";
    case "valide":
      return "validé";
    case "rejete":
      return "rejeté";
    case "differe":
      return "différé";
    case "impute":
      return "imputé";
    case "en_signature":
      return "en attente de signature";
    case "signe":
      return "signé";
    case "transmis":
      return "transmis au Trésor";
    case "paye":
      return "payé";
    default:
      return "mis à jour";
  }
}
