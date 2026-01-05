import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type RolePermission = {
  role_code: string;
  action_code: string;
  is_granted: boolean | null;
};

type UserRole = {
  role: string;
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

  // Récupérer toutes les permissions
  const { data: permissions } = useQuery({
    queryKey: ["all-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role_code, action_code, is_granted")
        .eq("is_granted", true);
      if (error) throw error;
      return data as RolePermission[];
    },
  });

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (actionCode: string): boolean => {
    if (!userRoles || !permissions) return false;
    
    const roleCodes = userRoles.map((r) => r.role);
    return permissions.some(
      (p) => roleCodes.includes(p.role_code) && p.action_code === actionCode && p.is_granted
    );
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

  return {
    userRoles: userRoles?.map((r) => r.role) || [],
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isLoading: !userRoles || !permissions,
  };
}
