/**
 * Hook RBAC - Helpers prêts à l'emploi pour les permissions
 * Utilise le contexte utilisateur et les helpers de permissions
 */

import { useCallback, useMemo } from "react";
import { usePermissions } from "./usePermissions";
import { useRoleBasedAccess } from "./useRoleBasedAccess";
import { ETAPES_CHAINE_DEPENSE, type EtapeChaineType } from "@/lib/config/sygfp-constants";
import {
  canViewDossier,
  canValidateStep,
  canRejectStep,
  canDeferStep,
  canSubmitStep,
  canCreateStep,
  canUploadPiece,
  canEditDossier,
  canDeleteDossier,
  canValidateNoteSEF,
  canValidateNoteAEF,
  canImputeNoteAEF,
  canSignOrdonnancement,
  canExecuteReglement,
  getAccessDeniedMessage,
  getVisibilityScope,
  type RoleCode,
  type EntityContext,
  type UserContext,
} from "@/lib/rbac/permissions";

export function useRBACHelpers() {
  const {
    userId,
    userRoles,
    isAdmin,
    hasRole,
    hasAnyRole,
    isLoading,
  } = usePermissions();

  const { userContext } = useRoleBasedAccess();

  // Contexte utilisateur normalisé
  const normalizedUserContext: UserContext = useMemo(() => ({
    userId: userId || null,
    roles: (userRoles || []) as RoleCode[],
    directionId: userContext?.directionId || null,
    serviceId: userContext?.serviceId || null,
    isAdmin,
  }), [userId, userRoles, userContext, isAdmin]);

  // ============================================
  // HELPERS DE VISIBILITÉ
  // ============================================

  /**
   * Vérifie si l'utilisateur peut voir un dossier
   */
  const checkCanViewDossier = useCallback((entity: EntityContext): boolean => {
    return canViewDossier(normalizedUserContext, entity);
  }, [normalizedUserContext]);

  /**
   * Obtient le niveau de visibilité de l'utilisateur
   */
  const visibilityScope = useMemo(() => {
    return getVisibilityScope(normalizedUserContext.roles);
  }, [normalizedUserContext.roles]);

  // ============================================
  // HELPERS DE WORKFLOW
  // ============================================

  /**
   * Vérifie si l'utilisateur peut valider une étape
   */
  const checkCanValidateStep = useCallback((
    step: EtapeChaineType,
    statut?: string
  ): boolean => {
    if (isAdmin) return true;
    return canValidateStep(normalizedUserContext.roles, step, statut);
  }, [normalizedUserContext.roles, isAdmin]);

  /**
   * Vérifie si l'utilisateur peut rejeter une étape
   */
  const checkCanRejectStep = useCallback((
    step: EtapeChaineType,
    statut?: string
  ): boolean => {
    if (isAdmin) return true;
    return canRejectStep(normalizedUserContext.roles, step, statut);
  }, [normalizedUserContext.roles, isAdmin]);

  /**
   * Vérifie si l'utilisateur peut différer une étape
   */
  const checkCanDeferStep = useCallback((
    step: EtapeChaineType,
    statut?: string
  ): boolean => {
    if (isAdmin) return true;
    return canDeferStep(normalizedUserContext.roles, step, statut);
  }, [normalizedUserContext.roles, isAdmin]);

  /**
   * Vérifie si l'utilisateur peut soumettre
   */
  const checkCanSubmitStep = useCallback((
    step: EtapeChaineType,
    isOwner: boolean,
    statut?: string
  ): boolean => {
    if (isAdmin) return true;
    return canSubmitStep(normalizedUserContext.roles, step, isOwner, statut);
  }, [normalizedUserContext.roles, isAdmin]);

  /**
   * Vérifie si l'utilisateur peut créer
   */
  const checkCanCreateStep = useCallback((step: EtapeChaineType): boolean => {
    if (isAdmin) return true;
    return canCreateStep(normalizedUserContext.roles, step);
  }, [normalizedUserContext.roles, isAdmin]);

  // ============================================
  // HELPERS DE PIÈCES JOINTES
  // ============================================

  /**
   * Vérifie si l'utilisateur peut uploader une pièce
   */
  const checkCanUploadPiece = useCallback((entity: EntityContext): boolean => {
    return canUploadPiece(normalizedUserContext, entity);
  }, [normalizedUserContext]);

  // ============================================
  // HELPERS D'ÉDITION
  // ============================================

  /**
   * Vérifie si l'utilisateur peut éditer un dossier
   */
  const checkCanEditDossier = useCallback((entity: EntityContext): boolean => {
    return canEditDossier(normalizedUserContext, entity);
  }, [normalizedUserContext]);

  /**
   * Vérifie si l'utilisateur peut supprimer un dossier
   */
  const checkCanDeleteDossier = useCallback((entity: EntityContext): boolean => {
    return canDeleteDossier(normalizedUserContext, entity);
  }, [normalizedUserContext]);

  // ============================================
  // HELPERS SPÉCIFIQUES SEF/AEF
  // ============================================

  const canValidateSEF = useMemo(() => {
    if (isAdmin) return true;
    return canValidateNoteSEF(normalizedUserContext.roles);
  }, [normalizedUserContext.roles, isAdmin]);

  const canValidateAEF = useMemo(() => {
    if (isAdmin) return true;
    return canValidateNoteAEF(normalizedUserContext.roles);
  }, [normalizedUserContext.roles, isAdmin]);

  const canImpute = useMemo(() => {
    if (isAdmin) return true;
    return canImputeNoteAEF(normalizedUserContext.roles);
  }, [normalizedUserContext.roles, isAdmin]);

  const canSign = useMemo(() => {
    if (isAdmin) return true;
    return canSignOrdonnancement(normalizedUserContext.roles);
  }, [normalizedUserContext.roles, isAdmin]);

  const canExecute = useMemo(() => {
    if (isAdmin) return true;
    return canExecuteReglement(normalizedUserContext.roles);
  }, [normalizedUserContext.roles, isAdmin]);

  // ============================================
  // HELPER POUR MESSAGES D'ERREUR
  // ============================================

  const getErrorMessage = useCallback((
    step: EtapeChaineType,
    action: 'validate' | 'reject' | 'defer' | 'submit' | 'create' | 'sign' | 'execute'
  ): string => {
    return getAccessDeniedMessage(step, action);
  }, []);

  // ============================================
  // RACCOURCIS COURANTS
  // ============================================

  const isDG = hasRole('DG');
  const isCB = hasAnyRole(['CB', 'DAAF']);
  const isDirecteur = hasRole('DIRECTEUR');
  const isTresorerie = hasAnyRole(['TRESORERIE', 'AGENT_COMPTABLE', 'AC']);
  const isAuditeur = hasRole('AUDITEUR');

  return {
    // État
    isLoading,
    isAdmin,
    userContext: normalizedUserContext,
    visibilityScope,
    
    // Rôles
    isDG,
    isCB,
    isDirecteur,
    isTresorerie,
    isAuditeur,
    hasRole,
    hasAnyRole,
    
    // Helpers de visibilité
    canViewDossier: checkCanViewDossier,
    
    // Helpers de workflow
    canValidateStep: checkCanValidateStep,
    canRejectStep: checkCanRejectStep,
    canDeferStep: checkCanDeferStep,
    canSubmitStep: checkCanSubmitStep,
    canCreateStep: checkCanCreateStep,
    
    // Helpers de pièces jointes
    canUploadPiece: checkCanUploadPiece,
    
    // Helpers d'édition
    canEditDossier: checkCanEditDossier,
    canDeleteDossier: checkCanDeleteDossier,
    
    // Helpers SEF/AEF
    canValidateSEF,
    canValidateAEF,
    canImpute,
    canSign,
    canExecute,
    
    // Messages d'erreur
    getErrorMessage,
    
    // Étapes disponibles
    ETAPES: ETAPES_CHAINE_DEPENSE,
  };
}
