import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export interface Activity {
  id: string;
  type: "note" | "engagement" | "liquidation" | "ordonnancement" | "marche";
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
    },
    enabled: !!exercice,
  });
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
