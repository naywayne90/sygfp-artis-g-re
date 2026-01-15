import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { fr } from "date-fns/locale";

export interface EnhancedActivity {
  id: string;
  type: "note" | "engagement" | "liquidation" | "ordonnancement" | "marche" | "virement" | "prestataire" | "contrat" | "user" | "other";
  action: string;
  actionLabel: string;
  title: string;
  resume: string | null;
  code: string | null;
  timeAgo: string;
  timeGroup: "Aujourd'hui" | "Hier" | "Cette semaine" | "Plus ancien";
  date: Date;
  entityTable: string;
  entityId: string | null;
  userName: string | null;
  link: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Créé",
  creation: "Créé",
  update: "Modifié",
  modification: "Modifié",
  delete: "Supprimé",
  validate: "Validé",
  validation: "Validé",
  reject: "Rejeté",
  rejet: "Rejeté",
  submit: "Soumis",
  soumission: "Soumis",
  defer: "Différé",
  report: "Différé",
  execute: "Exécuté",
  pay: "Payé",
  import: "Importé",
  cancel: "Annulé",
  ajout_piece: "Pièce ajoutée",
  suppression_piece: "Pièce supprimée",
  passage_a_valider: "Passage à valider",
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
  notes_sef: "/notes-sef",
  note_sef: "/notes-sef",
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

function getTimeGroup(date: Date): EnhancedActivity["timeGroup"] {
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return "Hier";
  if (isThisWeek(date)) return "Cette semaine";
  return "Plus ancien";
}

function mapEntityType(entityType: string): EnhancedActivity["type"] {
  const mapping: Record<string, EnhancedActivity["type"]> = {
    notes_dg: "note",
    note: "note",
    notes_sef: "note",
    note_sef: "note",
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
    user_role: "user",
    profiles: "user",
  };
  return mapping[entityType] || "other";
}

export interface GroupedActivities {
  "Aujourd'hui": EnhancedActivity[];
  "Hier": EnhancedActivity[];
  "Cette semaine": EnhancedActivity[];
  "Plus ancien": EnhancedActivity[];
}

export function useRecentActivitiesEnhanced(limit: number = 15) {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["recent-activities-enhanced", exercice, limit],
    queryFn: async (): Promise<GroupedActivities> => {
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select(`
          id, 
          entity_type, 
          entity_id, 
          action, 
          created_at, 
          user_id,
          exercice
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false })
        .limit(limit * 2);

      if (error) {
        console.error("Error fetching audit logs:", error);
        return { "Aujourd'hui": [], "Hier": [], "Cette semaine": [], "Plus ancien": [] };
      }

      if (!logs || logs.length === 0) {
        return { "Aujourd'hui": [], "Hier": [], "Cette semaine": [], "Plus ancien": [] };
      }

      const activities: EnhancedActivity[] = logs.map((log) => {
        const date = new Date(log.created_at);
        const entityType = mapEntityType(log.entity_type);
        const baseRoute = ENTITY_ROUTES[log.entity_type] || "/";
        
        // Build display title
        const typeLabels: Record<string, string> = {
          note: "Note",
          engagement: "Engagement",
          liquidation: "Liquidation",
          ordonnancement: "Ordonnancement",
          marche: "Marché",
          virement: "Virement",
          prestataire: "Prestataire",
          contrat: "Contrat",
          user: "Utilisateur",
        };
        
        // Amélioration: afficher "Note SEF" au lieu de "Note" pour les notes_sef
        const typeLabel = log.entity_type === "note_sef" || log.entity_type === "notes_sef" 
          ? "Note SEF" 
          : typeLabels[entityType] || "Élément";
        const title = `${typeLabel} ${log.entity_id?.slice(0, 8) || ""}`;

        return {
          id: log.id,
          type: entityType,
          action: log.action.toLowerCase(),
          actionLabel: ACTION_LABELS[log.action.toLowerCase()] || log.action.replace(/_/g, " "),
          title,
          resume: null,
          code: null,
          timeAgo: formatDistanceToNow(date, { addSuffix: true, locale: fr }),
          timeGroup: getTimeGroup(date),
          date,
          entityTable: log.entity_type,
          entityId: log.entity_id,
          userName: null,
          link: log.entity_id ? `${baseRoute}?id=${log.entity_id}` : baseRoute,
        };
      }).slice(0, limit);

      // Group by time
      const grouped: GroupedActivities = {
        "Aujourd'hui": [],
        "Hier": [],
        "Cette semaine": [],
        "Plus ancien": [],
      };

      for (const activity of activities) {
        grouped[activity.timeGroup].push(activity);
      }

      return grouped;
    },
    enabled: !!exercice,
  });
}
