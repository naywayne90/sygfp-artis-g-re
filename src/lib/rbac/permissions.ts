/**
 * RBAC - Système de permissions centralisé
 * Helpers pour canViewDossier, canValidateStep, canUploadPiece
 */

import { ETAPES_CHAINE_DEPENSE, type EtapeChaineType } from "@/lib/config/sygfp-constants";

// ============================================
// TYPES
// ============================================

export type RoleCode = 
  | 'ADMIN' 
  | 'DG' 
  | 'DAAF' 
  | 'CB' 
  | 'DIRECTEUR'
  | 'SOUS_DIRECTEUR'
  | 'CHEF_SERVICE'
  | 'TRESORERIE'
  | 'AGENT_COMPTABLE'
  | 'AUDITEUR'
  | 'OPERATEUR'
  | 'AGENT';

export type VisibilityScope = 'own' | 'service' | 'direction' | 'all';

export interface UserContext {
  userId: string | null;
  roles: RoleCode[];
  directionId: string | null;
  serviceId: string | null;
  isAdmin: boolean;
}

export interface EntityContext {
  createdBy?: string | null;
  directionId?: string | null;
  serviceId?: string | null;
  statut?: string | null;
  exercice?: number | null;
}

// ============================================
// MATRICE DES DROITS PAR ÉTAPE
// ============================================

export const STEP_PERMISSIONS: Record<EtapeChaineType, {
  createRoles: RoleCode[];
  submitRoles: RoleCode[];
  validateRoles: RoleCode[];
  rejectRoles: RoleCode[];
  deferRoles: RoleCode[];
  imputeRoles?: RoleCode[];
  signRoles?: RoleCode[];
  executeRoles?: RoleCode[];
}> = {
  [ETAPES_CHAINE_DEPENSE.NOTE_SEF]: {
    createRoles: ['ADMIN', 'OPERATEUR', 'AGENT', 'CHEF_SERVICE', 'SOUS_DIRECTEUR', 'DIRECTEUR', 'DAAF', 'DG'],
    submitRoles: ['ADMIN', 'OPERATEUR', 'AGENT', 'CHEF_SERVICE', 'SOUS_DIRECTEUR', 'DIRECTEUR', 'DAAF'],
    validateRoles: ['ADMIN', 'DG'],
    rejectRoles: ['ADMIN', 'DG'],
    deferRoles: ['ADMIN', 'DG'],
  },
  [ETAPES_CHAINE_DEPENSE.NOTE_AEF]: {
    createRoles: ['ADMIN', 'OPERATEUR', 'AGENT', 'CHEF_SERVICE', 'SOUS_DIRECTEUR', 'DIRECTEUR', 'DAAF', 'DG'],
    submitRoles: ['ADMIN', 'OPERATEUR', 'AGENT', 'CHEF_SERVICE', 'SOUS_DIRECTEUR', 'DIRECTEUR', 'DAAF'],
    validateRoles: ['ADMIN', 'DG', 'DIRECTEUR'],
    rejectRoles: ['ADMIN', 'DG', 'DIRECTEUR'],
    deferRoles: ['ADMIN', 'DG', 'DIRECTEUR'],
  },
  [ETAPES_CHAINE_DEPENSE.IMPUTATION]: {
    createRoles: ['ADMIN', 'CB', 'DAAF'],
    submitRoles: ['ADMIN', 'CB', 'DAAF'],
    validateRoles: ['ADMIN', 'CB'],
    rejectRoles: ['ADMIN', 'CB'],
    deferRoles: ['ADMIN', 'CB'],
    imputeRoles: ['ADMIN', 'CB'],
  },
  [ETAPES_CHAINE_DEPENSE.EXPRESSION_BESOIN]: {
    createRoles: ['ADMIN', 'OPERATEUR', 'AGENT', 'CHEF_SERVICE', 'SOUS_DIRECTEUR', 'DIRECTEUR', 'DAAF'],
    submitRoles: ['ADMIN', 'OPERATEUR', 'AGENT', 'CHEF_SERVICE', 'SOUS_DIRECTEUR', 'DIRECTEUR', 'DAAF'],
    validateRoles: ['ADMIN', 'DIRECTEUR', 'DAAF'],
    rejectRoles: ['ADMIN', 'DIRECTEUR', 'DAAF'],
    deferRoles: ['ADMIN', 'DIRECTEUR', 'DAAF'],
  },
  [ETAPES_CHAINE_DEPENSE.PASSATION_MARCHE]: {
    createRoles: ['ADMIN', 'DAAF', 'CB'],
    submitRoles: ['ADMIN', 'DAAF', 'CB'],
    validateRoles: ['ADMIN', 'DG'],
    rejectRoles: ['ADMIN', 'DG'],
    deferRoles: ['ADMIN', 'DG'],
  },
  [ETAPES_CHAINE_DEPENSE.ENGAGEMENT]: {
    createRoles: ['ADMIN', 'DAAF', 'CB'],
    submitRoles: ['ADMIN', 'DAAF', 'CB'],
    validateRoles: ['ADMIN', 'CB'],
    rejectRoles: ['ADMIN', 'CB'],
    deferRoles: ['ADMIN', 'CB'],
  },
  [ETAPES_CHAINE_DEPENSE.LIQUIDATION]: {
    createRoles: ['ADMIN', 'DAAF', 'CB'],
    submitRoles: ['ADMIN', 'DAAF'],
    validateRoles: ['ADMIN', 'DAAF', 'CB'],
    rejectRoles: ['ADMIN', 'DAAF', 'CB'],
    deferRoles: ['ADMIN', 'DAAF', 'CB'],
  },
  [ETAPES_CHAINE_DEPENSE.ORDONNANCEMENT]: {
    createRoles: ['ADMIN', 'DAAF'],
    submitRoles: ['ADMIN', 'DAAF'],
    validateRoles: ['ADMIN', 'DAAF', 'DG'],
    rejectRoles: ['ADMIN', 'DG'],
    deferRoles: ['ADMIN', 'DG'],
    signRoles: ['ADMIN', 'DG'],
  },
  [ETAPES_CHAINE_DEPENSE.REGLEMENT]: {
    createRoles: ['ADMIN', 'TRESORERIE', 'AGENT_COMPTABLE'],
    submitRoles: ['ADMIN', 'TRESORERIE', 'AGENT_COMPTABLE'],
    validateRoles: ['ADMIN', 'TRESORERIE', 'AGENT_COMPTABLE'],
    rejectRoles: ['ADMIN', 'TRESORERIE'],
    deferRoles: ['ADMIN', 'TRESORERIE'],
    executeRoles: ['ADMIN', 'TRESORERIE', 'AGENT_COMPTABLE'],
  },
};

// ============================================
// HELPERS DE VISIBILITÉ
// ============================================

/**
 * Détermine le niveau de visibilité d'un utilisateur
 */
export function getVisibilityScope(roles: RoleCode[]): VisibilityScope {
  if (roles.includes('ADMIN') || roles.includes('DG') || roles.includes('AUDITEUR')) {
    return 'all';
  }
  if (roles.includes('DIRECTEUR') || roles.includes('SOUS_DIRECTEUR') || roles.includes('DAAF')) {
    return 'direction';
  }
  if (roles.includes('CHEF_SERVICE')) {
    return 'service';
  }
  return 'own';
}

/**
 * Vérifie si un utilisateur peut voir un dossier
 */
export function canViewDossier(
  userContext: UserContext,
  entity: EntityContext
): boolean {
  // Admin bypass
  if (userContext.isAdmin) return true;
  
  const scope = getVisibilityScope(userContext.roles);
  
  switch (scope) {
    case 'all':
      return true;
    case 'direction':
      return entity.directionId === userContext.directionId || 
             entity.createdBy === userContext.userId;
    case 'service':
      return entity.serviceId === userContext.serviceId || 
             entity.createdBy === userContext.userId;
    case 'own':
    default:
      return entity.createdBy === userContext.userId;
  }
}

/**
 * Vérifie si un utilisateur peut valider une étape
 */
export function canValidateStep(
  roles: RoleCode[],
  step: EtapeChaineType,
  statut?: string
): boolean {
  const permissions = STEP_PERMISSIONS[step];
  if (!permissions) return false;
  
  // Vérifier si le statut permet la validation
  const validatableStatuts = ['soumis', 'a_valider', 'en_attente', 'en_validation', 'a_valider_dg'];
  if (statut && !validatableStatuts.includes(statut)) {
    return false;
  }
  
  // Vérifier si l'utilisateur a un rôle autorisé
  return permissions.validateRoles.some(role => roles.includes(role));
}

/**
 * Vérifie si un utilisateur peut rejeter une étape
 */
export function canRejectStep(
  roles: RoleCode[],
  step: EtapeChaineType,
  statut?: string
): boolean {
  const permissions = STEP_PERMISSIONS[step];
  if (!permissions) return false;
  
  const rejectableStatuts = ['soumis', 'a_valider', 'en_attente', 'en_validation'];
  if (statut && !rejectableStatuts.includes(statut)) {
    return false;
  }
  
  return permissions.rejectRoles.some(role => roles.includes(role));
}

/**
 * Vérifie si un utilisateur peut différer une étape
 */
export function canDeferStep(
  roles: RoleCode[],
  step: EtapeChaineType,
  statut?: string
): boolean {
  const permissions = STEP_PERMISSIONS[step];
  if (!permissions) return false;
  
  const deferrableStatuts = ['soumis', 'a_valider', 'en_attente', 'en_validation'];
  if (statut && !deferrableStatuts.includes(statut)) {
    return false;
  }
  
  return permissions.deferRoles.some(role => roles.includes(role));
}

/**
 * Vérifie si un utilisateur peut soumettre une étape
 */
export function canSubmitStep(
  roles: RoleCode[],
  step: EtapeChaineType,
  isOwner: boolean,
  statut?: string
): boolean {
  const permissions = STEP_PERMISSIONS[step];
  if (!permissions) return false;
  
  // Seul le créateur peut soumettre
  if (!isOwner && !roles.includes('ADMIN')) {
    return false;
  }
  
  // Vérifier le statut
  if (statut && statut !== 'brouillon') {
    return false;
  }
  
  return permissions.submitRoles.some(role => roles.includes(role));
}

/**
 * Vérifie si un utilisateur peut créer une entrée pour une étape
 */
export function canCreateStep(
  roles: RoleCode[],
  step: EtapeChaineType
): boolean {
  const permissions = STEP_PERMISSIONS[step];
  if (!permissions) return false;
  
  return permissions.createRoles.some(role => roles.includes(role));
}

/**
 * Vérifie si un utilisateur peut uploader une pièce jointe
 */
export function canUploadPiece(
  userContext: UserContext,
  entity: EntityContext
): boolean {
  // Admin bypass
  if (userContext.isAdmin) return true;
  
  // Vérifier si l'entité est modifiable
  const editableStatuts = ['brouillon', 'differe', 'en_correction'];
  if (entity.statut && !editableStatuts.includes(entity.statut)) {
    // Seuls certains rôles peuvent ajouter des pièces après soumission
    const canAddAfterSubmit = ['CB', 'DAAF', 'DG'] as RoleCode[];
    if (!canAddAfterSubmit.some(role => userContext.roles.includes(role))) {
      return false;
    }
  }
  
  // Vérifier la visibilité
  return canViewDossier(userContext, entity);
}

/**
 * Vérifie si un utilisateur peut modifier un dossier
 */
export function canEditDossier(
  userContext: UserContext,
  entity: EntityContext
): boolean {
  // Admin bypass
  if (userContext.isAdmin) return true;
  
  // Seul le créateur peut modifier un brouillon
  if (entity.statut === 'brouillon') {
    return entity.createdBy === userContext.userId;
  }
  
  // Après soumission, seuls les rôles autorisés peuvent modifier
  if (entity.statut === 'differe' || entity.statut === 'en_correction') {
    return entity.createdBy === userContext.userId;
  }
  
  // Les autres statuts ne sont pas modifiables (sauf admin)
  return false;
}

/**
 * Vérifie si un utilisateur peut supprimer un dossier
 */
export function canDeleteDossier(
  userContext: UserContext,
  entity: EntityContext
): boolean {
  // Admin peut tout supprimer
  if (userContext.isAdmin) return true;
  
  // Seuls les brouillons peuvent être supprimés par leur créateur
  if (entity.statut === 'brouillon' && entity.createdBy === userContext.userId) {
    return true;
  }
  
  return false;
}

// ============================================
// HELPERS SPÉCIFIQUES SEF/AEF
// ============================================

/**
 * Vérifie si un utilisateur peut valider une Note SEF
 */
export function canValidateNoteSEF(roles: RoleCode[]): boolean {
  return canValidateStep(roles, ETAPES_CHAINE_DEPENSE.NOTE_SEF);
}

/**
 * Vérifie si un utilisateur peut valider une Note AEF
 */
export function canValidateNoteAEF(roles: RoleCode[]): boolean {
  return canValidateStep(roles, ETAPES_CHAINE_DEPENSE.NOTE_AEF);
}

/**
 * Vérifie si un utilisateur peut imputer une Note AEF
 */
export function canImputeNoteAEF(roles: RoleCode[]): boolean {
  const permissions = STEP_PERMISSIONS[ETAPES_CHAINE_DEPENSE.IMPUTATION];
  return permissions.imputeRoles?.some(role => roles.includes(role)) ?? false;
}

/**
 * Vérifie si un utilisateur peut signer un ordonnancement
 */
export function canSignOrdonnancement(roles: RoleCode[]): boolean {
  const permissions = STEP_PERMISSIONS[ETAPES_CHAINE_DEPENSE.ORDONNANCEMENT];
  return permissions.signRoles?.some(role => roles.includes(role)) ?? false;
}

/**
 * Vérifie si un utilisateur peut exécuter un règlement
 */
export function canExecuteReglement(roles: RoleCode[]): boolean {
  const permissions = STEP_PERMISSIONS[ETAPES_CHAINE_DEPENSE.REGLEMENT];
  return permissions.executeRoles?.some(role => roles.includes(role)) ?? false;
}

// ============================================
// HELPER POUR OBTENIR LE RÔLE REQUIS
// ============================================

export function getRequiredRoleForAction(
  step: EtapeChaineType,
  action: 'validate' | 'reject' | 'defer' | 'submit' | 'create' | 'sign' | 'execute'
): string {
  const permissions = STEP_PERMISSIONS[step];
  if (!permissions) return 'ADMIN';
  
  switch (action) {
    case 'validate':
      return permissions.validateRoles[0] || 'ADMIN';
    case 'reject':
      return permissions.rejectRoles[0] || 'ADMIN';
    case 'defer':
      return permissions.deferRoles[0] || 'ADMIN';
    case 'submit':
      return permissions.submitRoles[0] || 'ADMIN';
    case 'create':
      return permissions.createRoles[0] || 'ADMIN';
    case 'sign':
      return permissions.signRoles?.[0] || 'DG';
    case 'execute':
      return permissions.executeRoles?.[0] || 'TRESORERIE';
    default:
      return 'ADMIN';
  }
}

/**
 * Obtient un message d'erreur explicatif pour un refus d'accès
 */
export function getAccessDeniedMessage(
  step: EtapeChaineType,
  action: 'validate' | 'reject' | 'defer' | 'submit' | 'create' | 'sign' | 'execute'
): string {
  const requiredRole = getRequiredRoleForAction(step, action);
  
  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur',
    DG: 'Directeur Général',
    DAAF: 'Directeur Admin. & Financier',
    CB: 'Contrôleur Budgétaire',
    DIRECTEUR: 'Directeur de département',
    TRESORERIE: 'Trésorerie',
  };
  
  const actionLabels: Record<string, string> = {
    validate: 'valider',
    reject: 'rejeter',
    defer: 'différer',
    submit: 'soumettre',
    create: 'créer',
    sign: 'signer',
    execute: 'exécuter',
  };
  
  return `Le rôle ${roleLabels[requiredRole] || requiredRole} est requis pour ${actionLabels[action]} cette entité.`;
}
