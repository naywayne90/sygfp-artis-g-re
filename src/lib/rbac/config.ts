/**
 * Configuration RBAC - Qui peut faire quoi
 * Source unique de vérité pour les permissions
 */

import type {
  ModuleCode,
  WorkflowStep,
  ProfilFonctionnel,
  RoleHierarchique,
  AppRole,
} from './types';

// ============================================
// QUI PEUT CRÉER DANS CHAQUE MODULE
// ============================================

export const CREATE_PERMISSIONS: Record<ModuleCode, ProfilFonctionnel[]> = {
  notes_sef: ['Admin', 'Operationnel', 'Validateur'],
  notes_aef: ['Admin', 'Validateur'], // Généré automatiquement après validation SEF
  imputation: ['Admin', 'Controleur'], // CB uniquement
  expression_besoin: ['Admin', 'Operationnel'],
  passation_marche: ['Admin', 'Operationnel'],
  engagement: ['Admin', 'Controleur'],
  liquidation: ['Admin', 'Operationnel', 'Controleur'],
  ordonnancement: ['Admin', 'Controleur'],
  reglement: ['Admin'], // Trésorerie via rôle
  budget: ['Admin', 'Controleur'],
  planification: ['Admin', 'Operationnel', 'Controleur'],
  tresorerie: ['Admin'], // Via rôle TRESORERIE
  recettes: ['Admin', 'Operationnel'],
  approvisionnement: ['Admin', 'Operationnel'],
  contractualisation: ['Admin', 'Operationnel'],
  admin: ['Admin'],
  audit: ['Admin', 'Auditeur'],
};

// ============================================
// QUI PEUT VALIDER À CHAQUE ÉTAPE
// ============================================

export const VALIDATION_PERMISSIONS: Record<
  WorkflowStep,
  {
    roles: AppRole[];
    roleHierarchique?: RoleHierarchique[];
    profilFonctionnel?: ProfilFonctionnel[];
    description: string;
  }
> = {
  SEF: {
    roles: ['DG', 'ADMIN'],
    roleHierarchique: ['DG'],
    profilFonctionnel: ['Admin', 'Validateur'],
    description: 'Seul le DG peut valider les Notes SEF',
  },
  AEF: {
    roles: ['DG', 'DAAF', 'ADMIN'],
    roleHierarchique: ['Directeur', 'DG'],
    profilFonctionnel: ['Admin', 'Validateur'],
    description: 'Directeur ou DG valide les Notes AEF',
  },
  IMP: {
    roles: ['CB', 'ADMIN'],
    profilFonctionnel: ['Admin', 'Controleur'],
    description: 'Le CB valide les imputations',
  },
  EXP: {
    roles: ['DAAF', 'DG', 'ADMIN'],
    roleHierarchique: ['Chef de Service', 'Sous-Directeur', 'Directeur', 'DG'],
    description: 'Chef de service ou supérieur valide les expressions de besoin',
  },
  PAS: {
    roles: ['DG', 'ADMIN'],
    roleHierarchique: ['DG'],
    description: 'Le DG valide les passations de marché',
  },
  ENG: {
    roles: ['CB', 'ADMIN'],
    profilFonctionnel: ['Admin', 'Controleur'],
    description: 'Le CB valide les engagements',
  },
  LIQ: {
    roles: ['DAAF', 'CB', 'ADMIN'],
    profilFonctionnel: ['Admin', 'Controleur', 'Validateur'],
    description: 'DAAF ou CB valide les liquidations',
  },
  ORD: {
    roles: ['DG', 'ADMIN'],
    roleHierarchique: ['DG'],
    profilFonctionnel: ['Admin'],
    description: 'Le DG signe les ordonnancements',
  },
  REG: {
    roles: ['TRESORERIE', 'TRESORIER', 'ADMIN'],
    description: 'La Trésorerie exécute les règlements',
  },
};

// ============================================
// QUI PEUT EXPORTER DANS CHAQUE MODULE
// ============================================

export const EXPORT_PERMISSIONS: Record<ModuleCode, ProfilFonctionnel[]> = {
  notes_sef: ['Admin', 'Validateur', 'Controleur', 'Auditeur'],
  notes_aef: ['Admin', 'Validateur', 'Controleur', 'Auditeur'],
  imputation: ['Admin', 'Controleur', 'Auditeur'],
  expression_besoin: ['Admin', 'Operationnel', 'Controleur', 'Auditeur'],
  passation_marche: ['Admin', 'Operationnel', 'Controleur', 'Auditeur'],
  engagement: ['Admin', 'Controleur', 'Auditeur'],
  liquidation: ['Admin', 'Controleur', 'Auditeur'],
  ordonnancement: ['Admin', 'Controleur', 'Auditeur'],
  reglement: ['Admin', 'Controleur', 'Auditeur'],
  budget: ['Admin', 'Controleur', 'Auditeur'],
  planification: ['Admin', 'Operationnel', 'Controleur', 'Auditeur'],
  tresorerie: ['Admin', 'Auditeur'],
  recettes: ['Admin', 'Operationnel', 'Auditeur'],
  approvisionnement: ['Admin', 'Operationnel', 'Auditeur'],
  contractualisation: ['Admin', 'Operationnel', 'Auditeur'],
  admin: ['Admin'],
  audit: ['Admin', 'Auditeur'],
};

// ============================================
// HIÉRARCHIE DES RÔLES (pour comparaison)
// ============================================

export const ROLE_HIERARCHY_LEVELS: Record<RoleHierarchique, number> = {
  Agent: 1,
  'Chef de Service': 2,
  'Sous-Directeur': 3,
  Directeur: 4,
  DG: 5,
};

// ============================================
// MAPPING MODULE -> ÉTAPE WORKFLOW
// ============================================

export const MODULE_TO_STEP: Partial<Record<ModuleCode, WorkflowStep>> = {
  notes_sef: 'SEF',
  notes_aef: 'AEF',
  imputation: 'IMP',
  expression_besoin: 'EXP',
  passation_marche: 'PAS',
  engagement: 'ENG',
  liquidation: 'LIQ',
  ordonnancement: 'ORD',
  reglement: 'REG',
};

// ============================================
// RÔLES AVEC ACCÈS COMPLET (bypass)
// ============================================

export const BYPASS_ROLES: AppRole[] = ['ADMIN'];
export const BYPASS_PROFILS: ProfilFonctionnel[] = ['Admin'];

// ============================================
// MESSAGES D'ERREUR PAR DÉFAUT
// ============================================

export const PERMISSION_MESSAGES = {
  no_create: "Vous n'avez pas les droits pour créer dans ce module",
  no_validate: "Vous n'avez pas les droits pour valider cette étape",
  no_export: "Vous n'avez pas les droits pour exporter ces données",
  no_read: "Vous n'avez pas accès à ce module",
  no_update: "Vous n'avez pas les droits pour modifier cet élément",
  no_delete: "Vous n'avez pas les droits pour supprimer cet élément",
  exercice_closed: "L'exercice est clôturé, aucune modification possible",
  exercice_not_allowed: "Vous n'avez pas accès à cet exercice",
};
