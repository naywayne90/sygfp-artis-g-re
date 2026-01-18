/**
 * Hook pour gérer les délégations de signature
 *
 * Vérifie si l'utilisateur courant a une délégation active pour un périmètre donné
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Delegation = {
  id: string;
  delegateur_id: string;
  delegataire_id: string;
  date_debut: string;
  date_fin: string;
  perimetre: string[];
  motif: string | null;
  est_active: boolean;
  delegateur?: {
    id: string;
    full_name: string | null;
    role_hierarchique: string | null;
  };
};

export function useDelegations() {
  // Récupérer l'utilisateur courant
  const { data: currentUser } = useQuery({
    queryKey: ["current-user-delegation"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Récupérer les délégations actives pour l'utilisateur courant (comme délégataire)
  const { data: activeDelegations, isLoading } = useQuery({
    queryKey: ["active-delegations", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("delegations")
        .select(`
          *,
          delegateur:profiles!delegations_delegateur_id_fkey(
            id,
            full_name,
            role_hierarchique
          )
        `)
        .eq("delegataire_id", currentUser.id)
        .eq("est_active", true)
        .lte("date_debut", today)
        .gte("date_fin", today);

      if (error) {
        console.error("Error fetching delegations:", error);
        return [];
      }

      return data as Delegation[];
    },
    enabled: !!currentUser?.id,
  });

  /**
   * Vérifie si l'utilisateur a une délégation active pour un périmètre donné
   */
  const hasDelegationFor = (scope: string): boolean => {
    if (!activeDelegations || activeDelegations.length === 0) return false;
    return activeDelegations.some((d) => d.perimetre.includes(scope));
  };

  /**
   * Vérifie si l'utilisateur a une délégation DG active pour les Notes SEF
   */
  const hasDGDelegationForNotes = (): boolean => {
    if (!activeDelegations || activeDelegations.length === 0) return false;
    return activeDelegations.some(
      (d) =>
        d.perimetre.includes("notes") &&
        d.delegateur?.role_hierarchique === "DG"
    );
  };

  /**
   * Récupère les délégations actives pour un périmètre donné
   */
  const getDelegationsFor = (scope: string): Delegation[] => {
    if (!activeDelegations) return [];
    return activeDelegations.filter((d) => d.perimetre.includes(scope));
  };

  /**
   * Vérifie si l'utilisateur peut valider les Notes SEF via délégation
   */
  const canValidateNotesSEFViaDelegation = (): boolean => {
    return hasDGDelegationForNotes();
  };

  /**
   * Retourne l'info du délégateur si l'utilisateur agit par délégation
   */
  const getDelegatorInfo = (scope: string): { name: string; role: string } | null => {
    const delegation = getDelegationsFor(scope)[0];
    if (!delegation?.delegateur) return null;
    return {
      name: delegation.delegateur.full_name || "Inconnu",
      role: delegation.delegateur.role_hierarchique || "Inconnu",
    };
  };

  return {
    activeDelegations,
    isLoading,
    hasDelegationFor,
    hasDGDelegationForNotes,
    getDelegationsFor,
    canValidateNotesSEFViaDelegation,
    getDelegatorInfo,
  };
}

/**
 * Hook pour vérifier spécifiquement la capacité de valider les Notes SEF
 * Combine le rôle direct et les délégations
 */
export function useCanValidateSEF() {
  const { hasDGDelegationForNotes, isLoading: delegationsLoading } = useDelegations();

  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["user-roles-sef"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) return [];
      return data.map((r) => r.role);
    },
  });

  const isDG = userRoles?.includes("DG") ?? false;
  const isAdmin = userRoles?.includes("ADMIN") || userRoles?.includes("admin");
  const hasDelegation = hasDGDelegationForNotes();

  return {
    canValidate: isAdmin || isDG || hasDelegation,
    isDG,
    isAdmin,
    viaDelegation: hasDelegation && !isDG && !isAdmin,
    isLoading: delegationsLoading || rolesLoading,
  };
}
