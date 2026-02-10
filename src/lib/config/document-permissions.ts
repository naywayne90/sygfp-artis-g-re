/**
 * Configuration des permissions de documents
 * Définit qui peut upload, voir et supprimer chaque type de document
 */

import { DOCUMENT_TYPES } from "@/services/storage/namingService";

export type DocumentPermission = 'upload' | 'view' | 'delete';

export interface DocumentPermissionRule {
  allowedRoles: string[];
  ownerCanAccess?: boolean;
}

type PermissionMatrix = {
  [K in DocumentPermission]: {
    [key: string]: DocumentPermissionRule;
    default: DocumentPermissionRule;
  };
};

/**
 * Matrice des permissions par type de document
 */
export const DOCUMENT_PERMISSIONS: PermissionMatrix = {
  // Permissions d'upload
  upload: {
    // Documents financiers - restreints aux services financiers
    FACTURE: {
      allowedRoles: ['ADMIN', 'DAAF', 'CB', 'GESTIONNAIRE', 'AGENT'],
      ownerCanAccess: true,
    },
    FICHE_ENGAGEMENT: {
      allowedRoles: ['ADMIN', 'DAAF', 'CB'],
      ownerCanAccess: false,
    },
    FICHE_LIQUIDATION: {
      allowedRoles: ['ADMIN', 'DAAF', 'CB'],
      ownerCanAccess: false,
    },
    ORDRE_PAYER: {
      allowedRoles: ['ADMIN', 'DAAF'],
      ownerCanAccess: false,
    },
    
    // Documents de réception - services concernés
    PV_RECEPTION: {
      allowedRoles: ['ADMIN', 'SDPM', 'DIRECTION', 'CHEF_SERVICE', 'AGENT'],
      ownerCanAccess: true,
    },
    ATTESTATION_SERVICE_FAIT: {
      allowedRoles: ['ADMIN', 'DAAF', 'DIRECTION', 'CHEF_SERVICE'],
      ownerCanAccess: true,
    },
    
    // Documents marchés
    CAHIER_CHARGES: {
      allowedRoles: ['ADMIN', 'SDPM', 'DIRECTION'],
      ownerCanAccess: true,
    },
    CONTRAT: {
      allowedRoles: ['ADMIN', 'DG', 'SDPM', 'DAAF'],
      ownerCanAccess: false,
    },
    PV_ATTRIBUTION: {
      allowedRoles: ['ADMIN', 'SDPM', 'DG'],
      ownerCanAccess: false,
    },
    
    // Documents prestataire
    RIB: {
      allowedRoles: ['ADMIN', 'DAAF', 'TRESORERIE', 'AGENT'],
      ownerCanAccess: true,
    },
    
    // Par défaut - large accès
    default: {
      allowedRoles: ['ADMIN', 'DG', 'DAAF', 'SDPM', 'CB', 'DIRECTION', 'CHEF_SERVICE', 'AGENT'],
      ownerCanAccess: true,
    },
  },
  
  // Permissions de visualisation
  view: {
    // Documents sensibles
    ORDRE_PAYER: {
      allowedRoles: ['ADMIN', 'DG', 'DAAF', 'TRESORERIE', 'CB', 'AUDITEUR'],
      ownerCanAccess: false,
    },
    
    // Par défaut - large accès lecture
    default: {
      allowedRoles: ['ADMIN', 'DG', 'DAAF', 'SDPM', 'CB', 'TRESORERIE', 'DIRECTION', 'CHEF_SERVICE', 'AGENT', 'AUDITEUR'],
      ownerCanAccess: true,
    },
  },
  
  // Permissions de suppression
  delete: {
    // Documents financiers - suppression restreinte
    FICHE_ENGAGEMENT: {
      allowedRoles: ['ADMIN'],
      ownerCanAccess: false,
    },
    FICHE_LIQUIDATION: {
      allowedRoles: ['ADMIN'],
      ownerCanAccess: false,
    },
    ORDRE_PAYER: {
      allowedRoles: ['ADMIN'],
      ownerCanAccess: false,
    },
    CONTRAT: {
      allowedRoles: ['ADMIN'],
      ownerCanAccess: false,
    },
    
    // Par défaut - admin ou propriétaire
    default: {
      allowedRoles: ['ADMIN'],
      ownerCanAccess: true,
    },
  },
};

/**
 * Vérifie si un rôle a la permission pour une action sur un type de document
 */
export function checkDocumentPermission(
  permission: DocumentPermission,
  documentType: string,
  userRoles: string[],
  isOwner = false
): boolean {
  const permissionMatrix = DOCUMENT_PERMISSIONS[permission];
  const rule = permissionMatrix[documentType] || permissionMatrix.default;
  
  // Vérifier si l'utilisateur est propriétaire et si ça suffit
  if (isOwner && rule.ownerCanAccess) {
    return true;
  }
  
  // Vérifier les rôles
  return userRoles.some(role => rule.allowedRoles.includes(role));
}

/**
 * Récupère la liste des types de documents qu'un utilisateur peut uploader
 */
export function getUploadableDocumentTypes(userRoles: string[]): Array<{
  code: string;
  label: string;
  obligatoire: boolean;
}> {
  const allTypes = Object.entries(DOCUMENT_TYPES);
  
  return allTypes
    .filter(([code]) => checkDocumentPermission('upload', code, userRoles))
    .map(([, type]) => ({
      code: type.code,
      label: type.label,
      obligatoire: type.obligatoire,
    }));
}

/**
 * Documents requis par étape de workflow
 */
export const DOCUMENTS_PAR_ETAPE: Record<string, Array<{
  typeDocument: string;
  label: string;
  required: boolean;
  ordre: number;
}>> = {
  liquidation: [
    { typeDocument: 'FACTURE', label: 'Facture définitive', required: true, ordre: 1 },
    { typeDocument: 'BON_LIVRAISON', label: 'Bon de livraison', required: true, ordre: 2 },
    { typeDocument: 'PV_RECEPTION', label: 'PV de réception', required: true, ordre: 3 },
    { typeDocument: 'ATTESTATION_SERVICE_FAIT', label: 'Attestation service fait', required: true, ordre: 4 },
  ],
  ordonnancement: [
    { typeDocument: 'FICHE_ENGAGEMENT', label: "Fiche d'engagement", required: true, ordre: 1 },
    { typeDocument: 'FICHE_LIQUIDATION', label: 'Fiche de liquidation', required: true, ordre: 2 },
    { typeDocument: 'ORDRE_PAYER', label: 'Ordre de payer', required: false, ordre: 3 },
  ],
  engagement: [
    { typeDocument: 'PROFORMA', label: 'Proforma / Devis', required: true, ordre: 1 },
    { typeDocument: 'BON_COMMANDE', label: 'Bon de commande', required: false, ordre: 2 },
  ],
  marche: [
    { typeDocument: 'CAHIER_CHARGES', label: 'Cahier des charges', required: true, ordre: 1 },
    { typeDocument: 'PV_OUVERTURE', label: "PV d'ouverture des plis", required: true, ordre: 2 },
    { typeDocument: 'PV_ATTRIBUTION', label: "PV d'attribution", required: true, ordre: 3 },
    { typeDocument: 'CONTRAT', label: 'Contrat signé', required: true, ordre: 4 },
  ],
  passation: [
    { typeDocument: 'CAHIER_CHARGES', label: 'Cahier des charges', required: true, ordre: 1 },
    { typeDocument: 'OFFRE_TECHNIQUE', label: 'Offre technique', required: false, ordre: 2 },
    { typeDocument: 'OFFRE_FINANCIERE', label: 'Offre financière', required: false, ordre: 3 },
  ],
};

/**
 * Récupère les documents requis pour une étape
 */
export function getRequiredDocumentsForStep(etape: string): Array<{
  typeDocument: string;
  label: string;
  required: boolean;
  ordre: number;
}> {
  return DOCUMENTS_PAR_ETAPE[etape] || [];
}
