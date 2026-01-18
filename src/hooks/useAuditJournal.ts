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
  // Chaîne de dépense
  { value: "note_sef", label: "Notes SEF" },
  { value: "note_aef", label: "Notes AEF" },
  { value: "note", label: "Notes (legacy)" },
  { value: "imputation", label: "Imputations" },
  { value: "engagement", label: "Engagements" },
  { value: "liquidation", label: "Liquidations" },
  { value: "ordonnancement", label: "Ordonnancements" },
  { value: "reglement", label: "Règlements" },
  // Budget
  { value: "budget", label: "Budget" },
  { value: "budget_line", label: "Lignes budgétaires" },
  { value: "budget_import", label: "Import budget" },
  { value: "budget_transfer", label: "Virements budgétaires" },
  // Feuille de route
  { value: "roadmap", label: "Feuille de route" },
  { value: "roadmap_submission", label: "Soumission feuille de route" },
  { value: "task_execution", label: "Exécution tâche" },
  // Scanning / Documents
  { value: "document_scan", label: "Document scanné" },
  { value: "attachment", label: "Pièce jointe" },
  // Marchés / Contrats
  { value: "marche", label: "Marchés" },
  { value: "contrat", label: "Contrats" },
  { value: "prestataire", label: "Prestataires" },
  // Dossiers
  { value: "dossier", label: "Dossiers" },
  // Utilisateurs
  { value: "user", label: "Utilisateurs" },
  { value: "user_role", label: "Rôles utilisateurs" },
  // Notifications
  { value: "notification", label: "Notifications" },
  { value: "alert", label: "Alertes" },
  // Système
  { value: "system", label: "Système" },
  { value: "exercice", label: "Exercices" },
];

export const ACTION_TYPES = [
  // CRUD basique
  { value: "create", label: "Création" },
  { value: "update", label: "Modification" },
  { value: "delete", label: "Suppression" },
  // Workflow
  { value: "validate", label: "Validation" },
  { value: "reject", label: "Rejet" },
  { value: "submit", label: "Soumission" },
  { value: "defer", label: "Report" },
  { value: "archive", label: "Archivage" },
  { value: "cancel", label: "Annulation" },
  { value: "sign", label: "Signature" },
  // Budget
  { value: "impute", label: "Imputation" },
  { value: "transfer", label: "Virement" },
  { value: "budget_modified", label: "Modification budget" },
  // Import / Export
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
  { value: "upload", label: "Upload fichier" },
  { value: "download", label: "Téléchargement" },
  // Tâches
  { value: "task_start", label: "Démarrage tâche" },
  { value: "task_complete", label: "Achèvement tâche" },
  { value: "task_block", label: "Blocage tâche" },
  { value: "task_unblock", label: "Déblocage tâche" },
  { value: "progress_update", label: "Mise à jour progression" },
  // Rôles / Utilisateurs
  { value: "update_locked_field", label: "Modification champ verrouillé" },
  { value: "DIFFERE", label: "Différé" },
  { value: "RESOUMIS_APRES_DIFFERE", label: "Resoumis après différé" },
  { value: "ROLE_ADDED", label: "Rôle ajouté" },
  { value: "ROLE_REMOVED", label: "Rôle retiré" },
  { value: "ROLE_CHANGED", label: "Rôle modifié" },
  // Auth
  { value: "login", label: "Connexion" },
  { value: "logout", label: "Déconnexion" },
  // Exécution
  { value: "execute", label: "Exécution" },
  // Roadmap spécifiques
  { value: "roadmap_submitted", label: "Feuille de route soumise" },
  { value: "roadmap_validated", label: "Feuille de route validée" },
  { value: "roadmap_rejected", label: "Feuille de route rejetée" },
  { value: "roadmap_revision_requested", label: "Révision demandée" },
  { value: "roadmap_submission_created", label: "Soumission créée" },
  // Tâches spécifiques
  { value: "task_started", label: "Tâche démarrée" },
  { value: "task_completed", label: "Tâche terminée" },
  { value: "task_blocked", label: "Tâche bloquée" },
  // Import budget
  { value: "IMPORT_COMPLETE", label: "Import terminé" },
  { value: "IMPORT_ROLLBACK", label: "Import annulé" },
  // Documents
  { value: "SUBMIT", label: "Document soumis" },
  { value: "EXPORT", label: "Export document" },
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
