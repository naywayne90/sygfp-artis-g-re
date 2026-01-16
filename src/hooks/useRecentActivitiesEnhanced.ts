import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { fr } from "date-fns/locale";

export interface EnhancedActivity {
  id: string;
  type: "note" | "note_sef" | "note_aef" | "engagement" | "liquidation" | "ordonnancement" | "marche" | "virement" | "prestataire" | "contrat" | "user" | "dossier" | "expression_besoin" | "imputation" | "reglement" | "other";
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
  userEmail: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
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
  differe: "Différé",
  report: "Différé",
  execute: "Exécuté",
  pay: "Payé",
  import: "Importé",
  cancel: "Annulé",
  archive: "Archivé",
  impute: "Imputé",
  sign: "Signé",
  transfer: "Transféré",
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
  role_added: "Rôle ajouté",
  role_removed: "Rôle retiré",
  role_changed: "Rôle modifié",
  budget_modified: "Budget modifié",
  login: "Connexion",
  logout: "Déconnexion",
};

const ENTITY_ROUTES: Record<string, string> = {
  notes_dg: "/notes-aef",
  note: "/notes-aef",
  note_aef: "/notes-aef",
  notes_sef: "/notes-sef",
  note_sef: "/notes-sef",
  budget_engagements: "/engagements",
  engagement: "/engagements",
  budget_liquidations: "/liquidations",
  liquidation: "/liquidations",
  ordonnancements: "/ordonnancements",
  ordonnancement: "/ordonnancements",
  reglements: "/reglements",
  reglement: "/reglements",
  marches: "/marches",
  marche: "/marches",
  credit_transfers: "/planification/virements",
  virement: "/planification/virements",
  prestataires: "/contractualisation/prestataires",
  prestataire: "/contractualisation/prestataires",
  contrats: "/contractualisation/contrats",
  contrat: "/contractualisation/contrats",
  dossiers: "/recherche",
  dossier: "/recherche",
  expressions_besoin: "/execution/expression-besoin",
  expression_besoin: "/execution/expression-besoin",
  imputations: "/execution/imputation",
  imputation: "/execution/imputation",
  budget_lines: "/planification/budget",
  budget_line: "/planification/budget",
  budget: "/planification/budget",
};

const TYPE_LABELS: Record<string, string> = {
  note: "Note",
  note_aef: "Note AEF",
  notes_dg: "Note AEF",
  note_sef: "Note SEF",
  notes_sef: "Note SEF",
  engagement: "Engagement",
  budget_engagements: "Engagement",
  liquidation: "Liquidation",
  budget_liquidations: "Liquidation",
  ordonnancement: "Ordonnancement",
  ordonnancements: "Ordonnancement",
  reglement: "Règlement",
  reglements: "Règlement",
  marche: "Marché",
  marches: "Marché",
  virement: "Virement",
  credit_transfers: "Virement",
  prestataire: "Prestataire",
  prestataires: "Prestataire",
  contrat: "Contrat",
  contrats: "Contrat",
  dossier: "Dossier",
  dossiers: "Dossier",
  user: "Utilisateur",
  user_role: "Rôle utilisateur",
  profiles: "Profil",
  expression_besoin: "Expression de besoin",
  expressions_besoin: "Expression de besoin",
  imputation: "Imputation",
  imputations: "Imputation",
  budget_line: "Ligne budgétaire",
  budget_lines: "Ligne budgétaire",
  budget: "Budget",
};

function getTimeGroup(date: Date): EnhancedActivity["timeGroup"] {
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return "Hier";
  if (isThisWeek(date)) return "Cette semaine";
  return "Plus ancien";
}

function mapEntityType(entityType: string): EnhancedActivity["type"] {
  const mapping: Record<string, EnhancedActivity["type"]> = {
    notes_dg: "note_aef",
    note: "note_aef",
    note_aef: "note_aef",
    notes_sef: "note_sef",
    note_sef: "note_sef",
    budget_engagements: "engagement",
    engagement: "engagement",
    budget_liquidations: "liquidation",
    liquidation: "liquidation",
    ordonnancements: "ordonnancement",
    ordonnancement: "ordonnancement",
    reglements: "reglement",
    reglement: "reglement",
    marches: "marche",
    marche: "marche",
    credit_transfers: "virement",
    virement: "virement",
    prestataires: "prestataire",
    prestataire: "prestataire",
    contrats: "contrat",
    contrat: "contrat",
    dossiers: "dossier",
    dossier: "dossier",
    user_role: "user",
    profiles: "user",
    expressions_besoin: "expression_besoin",
    expression_besoin: "expression_besoin",
    imputations: "imputation",
    imputation: "imputation",
  };
  return mapping[entityType] || "other";
}

export interface GroupedActivities {
  "Aujourd'hui": EnhancedActivity[];
  "Hier": EnhancedActivity[];
  "Cette semaine": EnhancedActivity[];
  "Plus ancien": EnhancedActivity[];
}

export function useRecentActivitiesEnhanced(limit: number = 30) {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["recent-activities-enhanced", exercice, limit],
    queryFn: async (): Promise<GroupedActivities> => {
      // Récupérer les logs avec les infos utilisateur
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
          new_values,
          old_values,
          user:profiles!audit_logs_user_id_fkey(full_name, email)
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
        const typeLabel = TYPE_LABELS[log.entity_type] || "Élément";
        
        // Extraire le code/numéro de l'entité depuis new_values si disponible
        const newValues = log.new_values as Record<string, unknown> | null;
        const code = newValues?.numero || newValues?.reference || newValues?.code || log.entity_id?.slice(0, 8);
        
        // Construire un résumé pertinent
        let resume: string | null = null;
        if (newValues?.objet) {
          resume = String(newValues.objet).substring(0, 100);
        } else if (newValues?.motif) {
          resume = `Motif: ${String(newValues.motif).substring(0, 80)}`;
        } else if (newValues?.commentaire) {
          resume = String(newValues.commentaire).substring(0, 100);
        }

        const title = `${typeLabel} ${code || ""}`.trim();

        // Infos utilisateur
        const user = log.user as { full_name?: string; email?: string } | null;
        const userName = user?.full_name || null;
        const userEmail = user?.email || null;

        return {
          id: log.id,
          type: entityType,
          action: log.action.toLowerCase(),
          actionLabel: ACTION_LABELS[log.action.toLowerCase()] || log.action.replace(/_/g, " "),
          title,
          resume,
          code: code ? String(code) : null,
          timeAgo: formatDistanceToNow(date, { addSuffix: true, locale: fr }),
          timeGroup: getTimeGroup(date),
          date,
          entityTable: log.entity_type,
          entityId: log.entity_id,
          userName,
          userEmail,
          link: log.entity_id ? `${baseRoute}?id=${log.entity_id}` : baseRoute,
          metadata: newValues,
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
    staleTime: 30000, // 30 secondes
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });
}
