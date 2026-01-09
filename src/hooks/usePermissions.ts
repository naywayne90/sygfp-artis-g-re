import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type UserRole = {
  role: string;
};

type UserPermission = {
  action_code: string;
  via_delegation: boolean;
};

export function usePermissions() {
  // Récupérer l'utilisateur courant
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Récupérer les rôles de l'utilisateur
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .eq("is_active", true);
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!currentUser?.id,
  });

  // Récupérer les permissions via la fonction SECURITY DEFINER (inclut délégations)
  const { data: userPermissions } = useQuery({
    queryKey: ["user-permissions", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .rpc("get_user_permissions", { p_user_id: currentUser.id });
      if (error) {
        console.error("Error fetching permissions:", error);
        return [];
      }
      return (data || []) as UserPermission[];
    },
    enabled: !!currentUser?.id,
  });

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (actionCode: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.some((p) => p.action_code === actionCode);
  };

  // Vérifier si la permission est via délégation
  const isViaDelegation = (actionCode: string): boolean => {
    if (!userPermissions) return false;
    const perm = userPermissions.find((p) => p.action_code === actionCode);
    return perm?.via_delegation ?? false;
  };

  // Vérifier si l'utilisateur a au moins une des permissions
  const hasAnyPermission = (actionCodes: string[]): boolean => {
    return actionCodes.some((code) => hasPermission(code));
  };

  // Vérifier si l'utilisateur a toutes les permissions
  const hasAllPermissions = (actionCodes: string[]): boolean => {
    return actionCodes.every((code) => hasPermission(code));
  };

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (roleCode: string): boolean => {
    if (!userRoles) return false;
    return userRoles.some((r) => r.role === roleCode);
  };

  // Vérifier si l'utilisateur a au moins un des rôles
  const hasAnyRole = (roleCodes: string[]): boolean => {
    return roleCodes.some((code) => hasRole(code));
  };

  // Vérifier si l'utilisateur est admin
  const isAdmin = hasRole("ADMIN") || hasRole("admin");

  // Vérifier l'accès à un module entier (ex: "budget", "engagement")
  const hasModuleAccess = (module: string): boolean => {
    if (isAdmin) return true;
    if (!userPermissions) return false;
    const modulePrefix = `${module}_`;
    return userPermissions.some((p) => p.action_code.startsWith(modulePrefix));
  };

  // Récupérer toutes les permissions avec info délégation
  const getAllPermissions = (): UserPermission[] => {
    return userPermissions || [];
  };

  // ============================================
  // DÉFINITIONS STRICTES "QUI VALIDE QUOI"
  // ============================================
  
  // Vérifier si l'utilisateur peut valider une Note SEF (DG uniquement)
  const canValidateNoteSEF = (): boolean => {
    return isAdmin || hasRole("DG") || hasPermission("notes_sef_validate");
  };

  // Vérifier si l'utilisateur peut valider une Note AEF (Directeur ou DG)
  const canValidateNoteAEF = (): boolean => {
    return isAdmin || hasAnyRole(["DG", "DIRECTEUR"]) || hasPermission("notes_aef_validate");
  };

  // Vérifier si l'utilisateur peut imputer (CB uniquement)
  const canImpute = (): boolean => {
    return isAdmin || hasRole("CB") || hasPermission("imputation_create");
  };

  // Vérifier si l'utilisateur peut valider un engagement (CB uniquement)
  const canValidateEngagement = (): boolean => {
    return isAdmin || hasRole("CB") || hasPermission("engagement_validate");
  };

  // Vérifier si l'utilisateur peut valider une liquidation (DAAF)
  const canValidateLiquidation = (): boolean => {
    return isAdmin || hasAnyRole(["DAAF", "CB"]) || hasPermission("liquidation_validate");
  };

  // Vérifier si l'utilisateur peut signer un ordonnancement (DG uniquement)
  const canSignOrdonnancement = (): boolean => {
    return isAdmin || hasRole("DG") || hasPermission("ordonnancement_sign");
  };

  // Vérifier si l'utilisateur peut exécuter un règlement (Trésorerie/Agent Comptable)
  const canExecuteReglement = (): boolean => {
    return isAdmin || hasAnyRole(["TRESORERIE", "AGENT_COMPTABLE", "AC"]) || hasPermission("reglement_execute");
  };

  // Vérifier si l'utilisateur peut valider un marché (Commission/DG)
  const canValidateMarche = (): boolean => {
    return isAdmin || hasAnyRole(["DG", "COMMISSION_MARCHES"]) || hasPermission("marche_validate");
  };

  // Vérifier si l'utilisateur peut approuver un virement (CB)
  const canApproveVirement = (): boolean => {
    return isAdmin || hasRole("CB") || hasPermission("virement_approve");
  };

  // Message d'erreur pour rôle insuffisant
  const getRequiredRoleMessage = (action: string): string => {
    const roleMap: Record<string, string> = {
      "validate_note_sef": "DG",
      "validate_note_aef": "Directeur ou DG",
      "impute": "CB (Contrôleur Budgétaire)",
      "validate_engagement": "CB (Contrôleur Budgétaire)",
      "validate_liquidation": "DAAF",
      "sign_ordonnancement": "DG (Directeur Général)",
      "execute_reglement": "Trésorerie / Agent Comptable",
      "validate_marche": "Commission des Marchés ou DG",
      "approve_virement": "CB (Contrôleur Budgétaire)",
    };
    return roleMap[action] || "Administrateur";
  };

  return {
    userId: currentUser?.id,
    userRoles: userRoles?.map((r) => r.role) || [],
    permissions: userPermissions || [],
    hasPermission,
    isViaDelegation,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    hasModuleAccess,
    getAllPermissions,
    isLoading: !userRoles || !userPermissions,
    // Nouvelles fonctions de validation par rôle
    canValidateNoteSEF,
    canValidateNoteAEF,
    canImpute,
    canValidateEngagement,
    canValidateLiquidation,
    canSignOrdonnancement,
    canExecuteReglement,
    canValidateMarche,
    canApproveVirement,
    getRequiredRoleMessage,
  };
}
