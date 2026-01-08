import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "./usePermissions";
import { useAuditLog } from "./useAuditLog";
import { useExercice } from "@/contexts/ExerciceContext";

// Roles allowed to import when budget is validated
const IMPORT_OVERRIDE_ROLES = ["ADMIN", "admin", "DG", "dg", "DAF", "daf"];

// Roles allowed to import/export budget data
const IMPORT_ALLOWED_ROLES = [
  "ADMIN", "admin", 
  "DG", "dg", 
  "DAF", "daf",
  "SDPM", "sdpm",
  "BUDGET", "budget",
  "CONTROLEUR", "controleur",
];

const EXPORT_ALLOWED_ROLES = [
  ...IMPORT_ALLOWED_ROLES,
  "TRESORERIE", "tresorerie",
  "COMPTABLE", "comptable",
];

interface BudgetValidationStatus {
  isValidated: boolean;
  validatedAt: string | null;
  validatedBy: string | null;
  validatorName: string | null;
}

export function useImportSecurity() {
  const { exercice, exerciceInfo } = useExercice();
  const { hasAnyRole, isAdmin, userId, userRoles } = usePermissions();
  const { logAction } = useAuditLog();

  // Check if budget version is validated for current exercice
  const { data: budgetValidation, isLoading: isCheckingValidation } = useQuery({
    queryKey: ["budget-validation-status", exercice],
    queryFn: async (): Promise<BudgetValidationStatus> => {
      if (!exercice) {
        return { isValidated: false, validatedAt: null, validatedBy: null, validatorName: null };
      }

      // Check budget_versions for validated status
      const { data, error } = await supabase
        .from("budget_versions")
        .select(`
          status,
          validated_at,
          validated_by
        `)
        .eq("exercice", exercice)
        .eq("status", "validated")
        .order("validated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { isValidated: false, validatedAt: null, validatedBy: null, validatorName: null };
      }

      // Get validator name
      let validatorName = null;
      if (data.validated_by) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.validated_by)
          .single();
        validatorName = profile?.full_name || null;
      }

      return {
        isValidated: true,
        validatedAt: data.validated_at,
        validatedBy: data.validated_by,
        validatorName,
      };
    },
    enabled: !!exercice,
  });

  // Check if user can import
  const canImport = useMemo(() => {
    // Admin/DG can always import
    if (isAdmin || hasAnyRole(IMPORT_OVERRIDE_ROLES)) {
      return true;
    }
    
    // Check if user has import role
    if (!hasAnyRole(IMPORT_ALLOWED_ROLES)) {
      return false;
    }

    // If budget is validated, only override roles can import
    if (budgetValidation?.isValidated) {
      return hasAnyRole(IMPORT_OVERRIDE_ROLES);
    }

    return true;
  }, [isAdmin, hasAnyRole, budgetValidation]);

  // Check if user can export
  const canExport = useMemo(() => {
    return isAdmin || hasAnyRole(EXPORT_ALLOWED_ROLES);
  }, [isAdmin, hasAnyRole]);

  // Check if budget is locked for current user
  const isBudgetLockedForUser = useMemo(() => {
    if (!budgetValidation?.isValidated) return false;
    return !hasAnyRole(IMPORT_OVERRIDE_ROLES) && !isAdmin;
  }, [budgetValidation, hasAnyRole, isAdmin]);

  // Get import block reason
  const getImportBlockReason = useCallback((): string | null => {
    if (!hasAnyRole([...IMPORT_ALLOWED_ROLES, ...IMPORT_OVERRIDE_ROLES]) && !isAdmin) {
      return "Vous n'avez pas les droits nécessaires pour importer des données budgétaires. Contactez votre administrateur.";
    }

    if (budgetValidation?.isValidated && !hasAnyRole(IMPORT_OVERRIDE_ROLES) && !isAdmin) {
      const validatedDate = budgetValidation.validatedAt 
        ? new Date(budgetValidation.validatedAt).toLocaleDateString("fr-FR")
        : "";
      return `Le budget de l'exercice ${exercice} a été validé${validatedDate ? ` le ${validatedDate}` : ""}${budgetValidation.validatorName ? ` par ${budgetValidation.validatorName}` : ""}. Seuls les profils Admin/DG peuvent importer après validation.`;
    }

    if (exerciceInfo?.statut === "cloture") {
      return `L'exercice ${exercice} est clôturé. Aucun import n'est possible.`;
    }

    return null;
  }, [hasAnyRole, isAdmin, budgetValidation, exercice, exerciceInfo]);

  // Log import action to audit
  const logImportAction = useCallback(async (
    runId: string,
    filename: string,
    action: "start" | "success" | "error",
    stats?: { 
      totalRows?: number; 
      insertedRows?: number; 
      updatedRows?: number; 
      errorRows?: number;
      justification?: string;
    }
  ) => {
    const actionType = action === "start" ? "create" : action === "success" ? "validate" : "reject";
    
    await logAction({
      entityType: "import_budget",
      entityId: runId,
      action: actionType,
      newValues: {
        filename,
        action,
        exercice,
        ...stats,
        timestamp: new Date().toISOString(),
        user_roles: userRoles,
        budget_was_validated: budgetValidation?.isValidated || false,
      },
    });

    // Also log to import_logs table if it exists
    try {
      await supabase.from("import_logs").insert({
        run_id: runId,
        event_type: action === "start" ? "IMPORT_STARTED" : action === "success" ? "IMPORT_COMPLETED" : "IMPORT_FAILED",
        message: action === "start" 
          ? `Import démarré: ${filename}`
          : action === "success"
          ? `Import réussi: ${stats?.insertedRows || 0} créées, ${stats?.updatedRows || 0} mises à jour`
          : `Import échoué: ${stats?.errorRows || 0} erreurs`,
        details: stats,
      });
    } catch (err) {
      // Table might not exist, ignore
      console.warn("Could not log to import_logs:", err);
    }
  }, [logAction, exercice, userRoles, budgetValidation]);

  // Request import with justification (for validated budgets)
  const requestImportOverride = useCallback(async (justification: string): Promise<boolean> => {
    if (!canImport) return false;
    
    // Log the override request
    await logAction({
      entityType: "import_budget_override",
      entityId: null as any,
      action: "create",
      newValues: {
        exercice,
        justification,
        budget_validated_at: budgetValidation?.validatedAt,
        timestamp: new Date().toISOString(),
      },
    });

    return true;
  }, [canImport, logAction, exercice, budgetValidation]);

  return {
    // Permissions
    canImport,
    canExport,
    isBudgetLockedForUser,
    isCheckingValidation,
    
    // Budget validation status
    budgetValidation,
    
    // Helper functions
    getImportBlockReason,
    logImportAction,
    requestImportOverride,
    
    // Role checks
    hasImportOverrideRole: hasAnyRole(IMPORT_OVERRIDE_ROLES) || isAdmin,
    userRoles,
  };
}
