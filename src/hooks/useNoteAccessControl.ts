import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "./usePermissions";

interface NoteAccessParams {
  created_by?: string | null;
  direction_id?: string | null;
  statut?: string | null;
}

interface AccessControlResult {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  canValidate: boolean;
  canReject: boolean;
  canDefer: boolean;
  canResubmit: boolean;
  canImpute: boolean;
  isCreator: boolean;
  isDG: boolean;
  isCB: boolean;
  isAdmin: boolean;
  isSameDirection: boolean;
  isLoading: boolean;
  denyReason?: string;
}

export function useNoteAccessControl(note: NoteAccessParams | null, noteType: 'SEF' | 'AEF' = 'SEF'): AccessControlResult {
  const { userId, _hasRole, hasAnyRole, isAdmin: isAdminRole, isLoading: permissionsLoading } = usePermissions();

  // Récupérer le profil utilisateur avec sa direction
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile-direction", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, direction_id, first_name, last_name")
        .eq("id", userId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = permissionsLoading || profileLoading;

  // Rôles
  const isAdmin = isAdminRole;
  const isDG = hasAnyRole(["DG"]);
  const isCB = hasAnyRole(["CB", "DAAF"]);
  const _isDirecteur = hasAnyRole(["DIRECTEUR"]);
  
  // Vérifications de base
  const isCreator = !!userId && note?.created_by === userId;
  const isSameDirection = !!userProfile?.direction_id && 
                          !!note?.direction_id && 
                          userProfile.direction_id === note.direction_id;

  // Si pas de note, retourner des valeurs par défaut
  if (!note) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canSubmit: false,
      canValidate: false,
      canReject: false,
      canDefer: false,
      canResubmit: false,
      canImpute: false,
      isCreator: false,
      isDG,
      isCB,
      isAdmin,
      isSameDirection: false,
      isLoading,
      denyReason: "Note non disponible",
    };
  }

  const statut = note.statut || "brouillon";

  // Droits de visualisation
  // - Admin/DG peuvent tout voir
  // - Créateur peut toujours voir sa note
  // - Utilisateurs de la même direction peuvent voir
  const canView = isAdmin || isDG || isCB || isCreator || isSameDirection;

  // Droits d'édition (brouillon uniquement par créateur)
  const canEdit = (isCreator || isAdmin) && statut === "brouillon";

  // Droits de suppression (brouillon uniquement par créateur ou admin)
  const canDelete = (isCreator || isAdmin) && statut === "brouillon";

  // Droits de soumission (brouillon par créateur)
  const canSubmit = (isCreator || isAdmin) && statut === "brouillon";

  // Droits de validation (DG/Admin pour notes soumises)
  const canValidate = (isDG || isAdmin) && ["soumis", "a_valider"].includes(statut);

  // Droits de rejet (DG/Admin pour notes soumises)
  const canReject = (isDG || isAdmin) && ["soumis", "a_valider"].includes(statut);

  // Droits de différé (DG/Admin pour notes soumises)
  const canDefer = (isDG || isAdmin) && ["soumis", "a_valider"].includes(statut);

  // Droits de re-soumission (créateur pour notes différées/rejetées)
  const canResubmit = (isCreator || isAdmin) && ["differe", "rejete"].includes(statut);

  // Droits d'imputation (CB/DAAF pour notes AEF validées/à imputer)
  const canImpute = noteType === 'AEF' && 
                    (isCB || isAdmin) && 
                    ["valide", "a_imputer"].includes(statut);

  // Raison du refus d'accès
  let denyReason: string | undefined;
  if (!canView) {
    if (!userId) {
      denyReason = "Vous devez être connecté pour accéder à cette note";
    } else {
      denyReason = "Vous n'avez pas les droits pour accéder à cette note. Seuls le créateur, les membres de la direction concernée, ou les responsables (DG/CB) peuvent y accéder.";
    }
  }

  return {
    canView,
    canEdit,
    canDelete,
    canSubmit,
    canValidate,
    canReject,
    canDefer,
    canResubmit,
    canImpute,
    isCreator,
    isDG,
    isCB,
    isAdmin,
    isSameDirection,
    isLoading,
    denyReason,
  };
}
