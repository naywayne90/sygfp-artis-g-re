// @ts-nocheck
/**
 * Configuration centrale RBAC pour SYGFP/ARTI
 * Définit les rôles, niveaux de validation et règles d'accès
 */

// ============================================
// DÉFINITION DES RÔLES HIÉRARCHIQUES
// ============================================

export const ROLES_HIERARCHIQUES = {
  AGENT: {
    code: 'Agent',
    niveau: 1,
    label: 'Agent',
    description: 'Création et soumission de dossiers, lecture de ses propres dossiers',
    color: '#6b7280', // gray
    permissions: ['create', 'submit', 'read_own'],
  },
  CHEF_SERVICE: {
    code: 'Chef de Service',
    niveau: 2,
    label: 'Chef de Service',
    description: 'Validation niveau 1, lecture des dossiers de son service',
    color: '#3b82f6', // blue
    permissions: ['create', 'submit', 'read_own', 'read_service', 'validate_level_1'],
  },
  SOUS_DIRECTEUR: {
    code: 'Sous-Directeur',
    niveau: 3,
    label: 'Sous-Directeur',
    description: 'Validation niveau 2, lecture des dossiers de son périmètre',
    color: '#8b5cf6', // violet
    permissions: ['create', 'submit', 'read_own', 'read_service', 'read_direction', 'validate_level_2'],
  },
  DIRECTEUR: {
    code: 'Directeur',
    niveau: 4,
    label: 'Directeur',
    description: 'Validation niveau 3 ou supervision, lecture de toute sa direction',
    color: '#f97316', // orange
    permissions: ['create', 'submit', 'read_own', 'read_service', 'read_direction', 'validate_level_3', 'validate_note_aef'],
  },
  DG: {
    code: 'DG',
    niveau: 5,
    label: 'Directeur Général',
    description: 'Validation finale, vision globale de tout le système',
    color: '#dc2626', // red
    permissions: ['read_all', 'validate_final', 'validate_note_sef', 'sign_ordonnancement'],
  },
} as const;

// ============================================
// DÉFINITION DES PROFILS FONCTIONNELS (RÔLES APPLICATIFS)
// ============================================

export const PROFILS_FONCTIONNELS = {
  ADMIN: {
    code: 'ADMIN',
    label: 'Administrateur',
    description: 'Accès complet au paramétrage, référentiels, budgets et utilisateurs',
    color: '#ef4444', // red
    isSystem: true,
    capabilities: ['manage_users', 'manage_roles', 'manage_referentiels', 'manage_budget', 'view_audit', 'bypass_all'],
  },
  CB: {
    code: 'CB',
    label: 'Contrôleur Budgétaire',
    description: 'Imputation budgétaire, validation des engagements, approbation des virements',
    color: '#22c55e', // green
    isSystem: true,
    capabilities: ['impute', 'validate_engagement', 'approve_virement', 'view_budget'],
  },
  DAAF: {
    code: 'DAAF',
    label: 'Directeur Admin. & Financier',
    description: 'Création des engagements et liquidations, supervision financière',
    color: '#a855f7', // purple
    isSystem: true,
    capabilities: ['create_engagement', 'create_liquidation', 'validate_liquidation', 'view_all_finances'],
  },
  DG: {
    code: 'DG',
    label: 'Directeur Général',
    description: 'Validation des notes SEF, signature des ordonnancements, vision globale',
    color: '#f97316', // orange
    isSystem: true,
    capabilities: ['validate_note_sef', 'sign_ordonnancement', 'validate_marche', 'view_all'],
  },
  TRESORERIE: {
    code: 'TRESORERIE',
    label: 'Trésorerie / Agent Comptable',
    description: 'Exécution des règlements, gestion de la trésorerie',
    color: '#06b6d4', // cyan
    isSystem: true,
    capabilities: ['execute_reglement', 'manage_tresorerie', 'view_comptes'],
  },
  DIRECTEUR: {
    code: 'DIRECTEUR',
    label: 'Directeur de département',
    description: 'Validation des notes AEF de sa direction',
    color: '#ec4899', // pink
    isSystem: true,
    capabilities: ['validate_note_aef', 'view_direction'],
  },
  OPERATEUR: {
    code: 'OPERATEUR',
    label: 'Opérateur',
    description: 'Saisie opérationnelle des données',
    color: '#64748b', // slate
    isSystem: false,
    capabilities: ['create', 'submit', 'view_own'],
  },
  AUDITEUR: {
    code: 'AUDITEUR',
    label: 'Auditeur',
    description: 'Lecture seule, accès transversal pour audit',
    color: '#78716c', // stone
    isSystem: true,
    capabilities: ['view_all', 'view_audit', 'export'],
  },
} as const;

// ============================================
// MATRICE "QUI VALIDE QUOI"
// ============================================

export const VALIDATION_MATRIX = {
  NOTE_SEF: {
    label: 'Note SEF',
    validators: ['DG', 'ADMIN'],
    requiredRole: 'DG',
    description: 'Validation par le Directeur Général uniquement',
  },
  NOTE_AEF: {
    label: 'Note AEF',
    validators: ['DIRECTEUR', 'DG', 'ADMIN'],
    requiredRole: 'DIRECTEUR',
    description: 'Validation par le Directeur de département ou DG',
  },
  IMPUTATION: {
    label: 'Imputation budgétaire',
    validators: ['CB', 'ADMIN'],
    requiredRole: 'CB',
    description: 'Imputation par le Contrôleur Budgétaire',
  },
  ENGAGEMENT: {
    label: 'Engagement',
    validators: ['CB', 'ADMIN'],
    requiredRole: 'CB',
    description: 'Validation des engagements par le CB',
  },
  LIQUIDATION: {
    label: 'Liquidation',
    validators: ['DAAF', 'CB', 'ADMIN'],
    requiredRole: 'DAAF',
    description: 'Validation des liquidations par le DAAF',
  },
  ORDONNANCEMENT: {
    label: 'Ordonnancement',
    validators: ['DG', 'ADMIN'],
    requiredRole: 'DG',
    description: 'Signature des ordonnancements par le DG',
  },
  REGLEMENT: {
    label: 'Règlement',
    validators: ['TRESORERIE', 'AGENT_COMPTABLE', 'AC', 'ADMIN'],
    requiredRole: 'TRESORERIE',
    description: 'Exécution des règlements par la Trésorerie',
  },
  MARCHE: {
    label: 'Marché',
    validators: ['DG', 'COMMISSION_MARCHES', 'ADMIN'],
    requiredRole: 'DG',
    description: 'Validation des marchés par la commission ou DG',
  },
  VIREMENT: {
    label: 'Virement budgétaire',
    validators: ['CB', 'ADMIN'],
    requiredRole: 'CB',
    description: 'Approbation des virements par le CB',
  },
} as const;

// ============================================
// RÈGLES DE VISIBILITÉ PAR RÔLE
// ============================================

export const VISIBILITY_RULES = {
  AGENT: {
    dossiers: 'own', // Uniquement ses propres dossiers
    notes: 'own',
    engagements: 'own',
    directions: 'own',
  },
  CHEF_SERVICE: {
    dossiers: 'service', // Dossiers du service
    notes: 'service',
    engagements: 'service',
    directions: 'own',
  },
  SOUS_DIRECTEUR: {
    dossiers: 'direction', // Périmètre direction
    notes: 'direction',
    engagements: 'direction',
    directions: 'own',
  },
  DIRECTEUR: {
    dossiers: 'direction', // Toute la direction
    notes: 'direction',
    engagements: 'direction',
    directions: 'own',
  },
  DG: {
    dossiers: 'all', // Vision globale
    notes: 'all',
    engagements: 'all',
    directions: 'all',
  },
  ADMIN: {
    dossiers: 'all', // Accès complet
    notes: 'all',
    engagements: 'all',
    directions: 'all',
  },
  AUDITEUR: {
    dossiers: 'all', // Lecture transversale
    notes: 'all',
    engagements: 'all',
    directions: 'all',
  },
} as const;

// ============================================
// ACTIONS SENSIBLES À LOGGER
// ============================================

export const AUDITED_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'UPDATE',
  'DELETE',
  'SUBMIT',
  'VALIDATE',
  'REJECT',
  'DEFER',
  'IMPUTE',
  'SIGN',
  'EXECUTE',
  'TRANSFER',
  'ROLE_ADDED',
  'ROLE_REMOVED',
  'ROLE_CHANGED',
  'PASSWORD_CHANGED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'BUDGET_MODIFIED',
  'OVERRIDE_REQUEST',
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Vérifie si un rôle peut valider un type d'entité
 */
export function canRoleValidate(roleCode: string, entityType: keyof typeof VALIDATION_MATRIX): boolean {
  const rule = VALIDATION_MATRIX[entityType];
  if (!rule) return false;
  return (rule.validators as readonly string[]).includes(roleCode) || roleCode === 'ADMIN';
}

/**
 * Récupère le rôle requis pour valider un type d'entité
 */
export function getRequiredRoleForValidation(entityType: keyof typeof VALIDATION_MATRIX): string {
  return VALIDATION_MATRIX[entityType]?.requiredRole || 'ADMIN';
}

/**
 * Récupère la description du rôle requis
 */
export function getValidationDescription(entityType: keyof typeof VALIDATION_MATRIX): string {
  return VALIDATION_MATRIX[entityType]?.description || '';
}

/**
 * Vérifie le niveau de visibilité d'un rôle
 */
export function getVisibilityLevel(roleCode: string): 'own' | 'service' | 'direction' | 'all' {
  const rules = VISIBILITY_RULES[roleCode as keyof typeof VISIBILITY_RULES];
  if (!rules) return 'own';
  return rules.dossiers;
}

/**
 * Récupère la couleur d'un profil fonctionnel
 */
export function getProfilColor(profilCode: string): string {
  const profil = PROFILS_FONCTIONNELS[profilCode as keyof typeof PROFILS_FONCTIONNELS];
  return profil?.color || '#6b7280';
}

/**
 * Récupère le label d'un profil fonctionnel
 */
export function getProfilLabel(profilCode: string): string {
  const profil = PROFILS_FONCTIONNELS[profilCode as keyof typeof PROFILS_FONCTIONNELS];
  return profil?.label || profilCode;
}

/**
 * Récupère le niveau hiérarchique
 */
export function getHierarchicalLevel(roleCode: string): number {
  const role = Object.values(ROLES_HIERARCHIQUES).find(r => r.code === roleCode);
  return role?.niveau || 1;
}

// ============================================
// RÈGLES RLS (ROW-LEVEL SECURITY)
// Chaque donnée appartient à un exercice + direction
// ============================================

export const RLS_POLICIES = {
  // Règles par entité
  dossiers: {
    scopedByExercice: true,
    scopedByDirection: true,
    accessRules: {
      AGENT: { scope: 'own', field: 'created_by' },
      CHEF_SERVICE: { scope: 'service', field: 'service_id' },
      SOUS_DIRECTEUR: { scope: 'direction', field: 'direction_id' },
      DIRECTEUR: { scope: 'direction', field: 'direction_id' },
      DG: { scope: 'all' },
      ADMIN: { scope: 'all' },
      AUDITEUR: { scope: 'all', readOnly: true },
    },
  },
  notes_sef: {
    scopedByExercice: true,
    scopedByDirection: false, // Notes SEF sont transversales
    accessRules: {
      AGENT: { scope: 'own', field: 'created_by' },
      DG: { scope: 'all' },
      ADMIN: { scope: 'all' },
      AUDITEUR: { scope: 'all', readOnly: true },
    },
  },
  notes_aef: {
    scopedByExercice: true,
    scopedByDirection: true,
    accessRules: {
      AGENT: { scope: 'own', field: 'created_by' },
      DIRECTEUR: { scope: 'direction', field: 'direction_id' },
      DG: { scope: 'all' },
      ADMIN: { scope: 'all' },
      AUDITEUR: { scope: 'all', readOnly: true },
    },
  },
  engagements: {
    scopedByExercice: true,
    scopedByDirection: true,
    accessRules: {
      AGENT: { scope: 'own', field: 'created_by' },
      CB: { scope: 'all' }, // CB voit tous les engagements
      DAAF: { scope: 'all' },
      DG: { scope: 'all' },
      ADMIN: { scope: 'all' },
      AUDITEUR: { scope: 'all', readOnly: true },
    },
  },
  liquidations: {
    scopedByExercice: true,
    scopedByDirection: true,
    accessRules: {
      DAAF: { scope: 'all' },
      CB: { scope: 'all' },
      DG: { scope: 'all' },
      ADMIN: { scope: 'all' },
      AUDITEUR: { scope: 'all', readOnly: true },
    },
  },
  ordonnancements: {
    scopedByExercice: true,
    scopedByDirection: false,
    accessRules: {
      DG: { scope: 'all' },
      TRESORERIE: { scope: 'all', readOnly: true },
      ADMIN: { scope: 'all' },
      AUDITEUR: { scope: 'all', readOnly: true },
    },
  },
  reglements: {
    scopedByExercice: true,
    scopedByDirection: false,
    accessRules: {
      TRESORERIE: { scope: 'all' },
      DG: { scope: 'all', readOnly: true },
      ADMIN: { scope: 'all' },
      AUDITEUR: { scope: 'all', readOnly: true },
    },
  },
} as const;

// ============================================
// ÉTAPES DE WORKFLOW AVEC NOTIFICATIONS
// ============================================

export const WORKFLOW_STEPS = {
  NOTE_SEF: {
    label: 'Note SEF',
    steps: [
      { state: 'brouillon', label: 'Brouillon', nextStates: ['soumis'], notifyOnEnter: [] },
      { state: 'soumis', label: 'Soumis', nextStates: ['valide', 'rejete', 'differe'], notifyOnEnter: ['DG'] },
      { state: 'valide', label: 'Validé', nextStates: ['impute'], notifyOnEnter: ['creator', 'CB'] },
      { state: 'rejete', label: 'Rejeté', nextStates: ['brouillon'], notifyOnEnter: ['creator'], requireMotif: true },
      { state: 'differe', label: 'Différé', nextStates: ['soumis'], notifyOnEnter: ['creator'], requireMotif: true },
      { state: 'impute', label: 'Imputé', nextStates: [], notifyOnEnter: ['creator', 'DAAF'] },
    ],
    initialState: 'brouillon',
    finalStates: ['impute', 'rejete'],
  },
  NOTE_AEF: {
    label: 'Note AEF',
    steps: [
      { state: 'brouillon', label: 'Brouillon', nextStates: ['soumis'], notifyOnEnter: [] },
      { state: 'soumis', label: 'Soumis', nextStates: ['valide', 'rejete', 'differe'], notifyOnEnter: ['DIRECTEUR'] },
      { state: 'valide', label: 'Validé', nextStates: ['impute'], notifyOnEnter: ['creator', 'CB'] },
      { state: 'rejete', label: 'Rejeté', nextStates: ['brouillon'], notifyOnEnter: ['creator'], requireMotif: true },
      { state: 'differe', label: 'Différé', nextStates: ['soumis'], notifyOnEnter: ['creator'], requireMotif: true },
      { state: 'impute', label: 'Imputé', nextStates: [], notifyOnEnter: ['creator', 'DAAF'] },
    ],
    initialState: 'brouillon',
    finalStates: ['impute', 'rejete'],
  },
  ENGAGEMENT: {
    label: 'Engagement',
    steps: [
      { state: 'brouillon', label: 'Brouillon', nextStates: ['valide'], notifyOnEnter: [] },
      { state: 'valide', label: 'Validé', nextStates: ['liquide'], notifyOnEnter: ['creator', 'DAAF'] },
      { state: 'liquide', label: 'Liquidé', nextStates: ['ordonnance'], notifyOnEnter: ['DG'] },
      { state: 'ordonnance', label: 'Ordonnancé', nextStates: ['paye'], notifyOnEnter: ['TRESORERIE'] },
      { state: 'paye', label: 'Payé', nextStates: [], notifyOnEnter: ['creator', 'DAAF'] },
    ],
    initialState: 'brouillon',
    finalStates: ['paye'],
  },
  DOSSIER: {
    label: 'Dossier complet',
    steps: [
      { state: 'note_sef', label: 'Note SEF', nextStates: ['note_aef'], notifyOnEnter: [] },
      { state: 'note_aef', label: 'Note AEF', nextStates: ['engagement'], notifyOnEnter: [] },
      { state: 'engagement', label: 'Engagement', nextStates: ['liquidation'], notifyOnEnter: [] },
      { state: 'liquidation', label: 'Liquidation', nextStates: ['ordonnancement'], notifyOnEnter: [] },
      { state: 'ordonnancement', label: 'Ordonnancement', nextStates: ['reglement'], notifyOnEnter: [] },
      { state: 'reglement', label: 'Règlement', nextStates: [], notifyOnEnter: ['creator'] },
    ],
    initialState: 'note_sef',
    finalStates: ['reglement'],
  },
} as const;

// ============================================
// ACTIONS NÉCESSITANT UN MOTIF OBLIGATOIRE
// ============================================

export const ACTIONS_REQUIRING_MOTIF = [
  'REJECT',           // Rejet d'une note ou validation
  'DEFER',            // Report d'une validation
  'CANCEL',           // Annulation d'un dossier
  'MODIFY_POST_VALIDATION', // Modification après validation
  'OVERRIDE',         // Dérogation ou contournement de règle
  'ROLLBACK',         // Retour arrière sur une étape
  'BUDGET_TRANSFER',  // Virement budgétaire
  'FORCE_CLOSE',      // Clôture forcée
] as const;

// ============================================
// CONFIGURATION DES NOTIFICATIONS PAR ÉVÉNEMENT
// ============================================

export const NOTIFICATION_CONFIG = {
  events: {
    SOUMISSION: {
      type: 'info',
      template: '{entity} {reference} soumis(e) pour validation',
      recipients: ['validators'],
      priority: 'normal',
    },
    VALIDATION: {
      type: 'validation',
      template: '{entity} {reference} validé(e)',
      recipients: ['creator', 'next_step_actors'],
      priority: 'normal',
    },
    REJET: {
      type: 'rejet',
      template: '{entity} {reference} rejeté(e) - Motif : {motif}',
      recipients: ['creator'],
      priority: 'high',
    },
    DIFFERE: {
      type: 'differe',
      template: '{entity} {reference} différé(e) - Motif : {motif}',
      recipients: ['creator'],
      priority: 'normal',
    },
    ECHEANCE: {
      type: 'echeance',
      template: 'Échéance proche pour {entity} {reference} - {jours_restants} jour(s)',
      recipients: ['assignees', 'validators'],
      priority: 'high',
    },
    PIECE_MANQUANTE: {
      type: 'piece_manquante',
      template: 'Pièce manquante sur {entity} {reference} : {piece}',
      recipients: ['creator'],
      priority: 'normal',
    },
    BUDGET_INSUFFISANT: {
      type: 'alerte',
      template: 'Budget insuffisant pour {entity} {reference} - Disponible: {disponible}, Demandé: {demande}',
      recipients: ['creator', 'CB'],
      priority: 'high',
    },
  },
  // Délais d'alerte échéance (en jours)
  echeanceAlerts: [7, 3, 1],
} as const;

// ============================================
// HELPER FUNCTIONS SUPPLÉMENTAIRES
// ============================================

/**
 * Vérifie si une action nécessite un motif
 */
export function actionRequiresMotif(action: string): boolean {
  return (ACTIONS_REQUIRING_MOTIF as readonly string[]).includes(action);
}

/**
 * Récupère les règles RLS pour une entité
 */
export function getRLSRules(entityType: keyof typeof RLS_POLICIES) {
  return RLS_POLICIES[entityType];
}

/**
 * Vérifie si un rôle peut accéder à une entité selon les règles RLS
 */
export function canAccessEntity(
  roleCode: string,
  entityType: keyof typeof RLS_POLICIES,
  _userContext: { userId?: string; directionId?: string; serviceId?: string }
): { canAccess: boolean; scope: string; readOnly?: boolean } {
  const rules = RLS_POLICIES[entityType];
  if (!rules) return { canAccess: false, scope: 'none' };

  const accessRule = rules.accessRules[roleCode as keyof typeof rules.accessRules];
  if (!accessRule) return { canAccess: false, scope: 'none' };

  return {
    canAccess: true,
    scope: accessRule.scope,
    readOnly: 'readOnly' in accessRule ? accessRule.readOnly : false,
  };
}

/**
 * Récupère les étapes de workflow pour un type d'entité
 */
export function getWorkflowSteps(entityType: keyof typeof WORKFLOW_STEPS) {
  return WORKFLOW_STEPS[entityType];
}

/**
 * Récupère la prochaine étape possible d'un workflow
 */
export function getNextWorkflowStates(entityType: keyof typeof WORKFLOW_STEPS, currentState: string): string[] {
  const workflow = WORKFLOW_STEPS[entityType];
  if (!workflow) return [];

  const step = workflow.steps.find(s => s.state === currentState);
  return step?.nextStates || [];
}

/**
 * Récupère les destinataires de notification pour une transition
 */
export function getNotificationRecipients(entityType: keyof typeof WORKFLOW_STEPS, targetState: string): string[] {
  const workflow = WORKFLOW_STEPS[entityType];
  if (!workflow) return [];

  const step = workflow.steps.find(s => s.state === targetState);
  return step?.notifyOnEnter || [];
}

/**
 * Vérifie si une transition nécessite un motif
 */
export function transitionRequiresMotif(entityType: keyof typeof WORKFLOW_STEPS, targetState: string): boolean {
  const workflow = WORKFLOW_STEPS[entityType];
  if (!workflow) return false;

  const step = workflow.steps.find(s => s.state === targetState);
  return step?.requireMotif || false;
}

// ============================================
// MATRICE D'ACCÈS PAR ROUTE
// Définit qui peut accéder à quelle route
// ============================================

export const ROUTE_ACCESS_MATRIX: Record<string, {
  allowedProfiles: string[];
  allowedHierarchies?: string[];
  description: string;
  requiresDirection?: boolean; // Si true, limite aux données de la direction
}> = {
  // Routes publiques (tous les connectés)
  '/': {
    allowedProfiles: ['all'],
    description: 'Tableau de bord'
  },
  '/recherche': {
    allowedProfiles: ['all'],
    description: 'Recherche de dossiers'
  },
  '/notifications': {
    allowedProfiles: ['all'],
    description: 'Notifications'
  },
  '/alertes': {
    allowedProfiles: ['all'],
    description: 'Alertes'
  },
  '/mon-profil': {
    allowedProfiles: ['all'],
    description: 'Mon profil'
  },
  '/taches': {
    allowedProfiles: ['all'],
    description: 'Mes tâches'
  },

  // Chaîne de dépense - Notes SEF
  '/notes-sef': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'DIRECTEUR', 'OPERATEUR', 'AUDITEUR'],
    allowedHierarchies: ['Agent', 'Chef de Service', 'Sous-Directeur', 'Directeur', 'DG'],
    description: 'Liste des Notes SEF'
  },
  '/notes-sef/validation': {
    allowedProfiles: ['ADMIN', 'DG'],
    description: 'Validation des Notes SEF'
  },

  // Chaîne de dépense - Notes AEF
  '/notes-aef': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'DIRECTEUR', 'OPERATEUR', 'AUDITEUR'],
    allowedHierarchies: ['Agent', 'Chef de Service', 'Sous-Directeur', 'Directeur', 'DG'],
    description: 'Liste des Notes AEF',
    requiresDirection: true
  },
  '/notes-aef/validation': {
    allowedProfiles: ['ADMIN', 'DG', 'DIRECTEUR'],
    description: 'Validation des Notes AEF'
  },

  // Chaîne de dépense - Imputation
  '/execution/imputation': {
    allowedProfiles: ['ADMIN', 'CB', 'DAAF', 'DG', 'AUDITEUR'],
    description: 'Imputation budgétaire'
  },

  // Chaîne de dépense - Expression de besoin
  '/execution/expression-besoin': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'DIRECTEUR', 'OPERATEUR'],
    allowedHierarchies: ['Agent', 'Chef de Service', 'Sous-Directeur', 'Directeur', 'DG'],
    description: 'Expression de besoin'
  },

  // Chaîne de dépense - Passation marché
  '/marches': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'AUDITEUR'],
    description: 'Marchés'
  },
  '/execution/passation-marche': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF'],
    description: 'Passation de marché'
  },

  // Chaîne de dépense - Engagement
  '/engagements': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'DIRECTEUR', 'AUDITEUR'],
    description: 'Engagements'
  },
  '/execution/scanning-engagement': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'OPERATEUR', 'AUDITEUR'],
    description: 'Scanning et numérisation des pièces engagement'
  },

  // Chaîne de dépense - Liquidation
  '/liquidations': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'AUDITEUR'],
    description: 'Liquidations'
  },
  '/execution/scanning-liquidation': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'OPERATEUR', 'AUDITEUR'],
    description: 'Scanning et numérisation des pièces liquidation'
  },

  // Chaîne de dépense - Ordonnancement
  '/ordonnancements': {
    allowedProfiles: ['ADMIN', 'DG', 'TRESORERIE', 'AUDITEUR'],
    description: 'Ordonnancements'
  },

  // Chaîne de dépense - Règlement
  '/reglements': {
    allowedProfiles: ['ADMIN', 'DG', 'TRESORERIE', 'AUDITEUR'],
    description: 'Règlements'
  },

  // Budget
  '/planification/budget': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'AUDITEUR'],
    description: 'Planification budgétaire'
  },
  '/planification/structure': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'AUDITEUR'],
    description: 'Structure budgétaire'
  },
  '/planification/virements': {
    allowedProfiles: ['ADMIN', 'DG', 'CB', 'DAAF'],
    description: 'Virements budgétaires'
  },
  '/planification/notifications': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB'],
    description: 'Notifications budgétaires'
  },
  '/planification/import-export': {
    allowedProfiles: ['ADMIN', 'DAAF'],
    description: 'Import/Export budget'
  },
  '/planification/feuilles-route': {
    allowedProfiles: ['ADMIN', 'DAAF', 'DIRECTEUR'],
    description: 'Import des feuilles de route par direction'
  },
  '/planification/soumissions-feuilles-route': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'DIRECTEUR'],
    description: 'Validation des soumissions de feuilles de route'
  },

  // Trésorerie
  '/tresorerie': {
    allowedProfiles: ['ADMIN', 'DG', 'TRESORERIE', 'AUDITEUR'],
    description: 'Gestion trésorerie'
  },

  // Rapports
  '/etats-execution': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'DIRECTEUR', 'TRESORERIE', 'AUDITEUR'],
    description: 'États d\'exécution'
  },
  '/alertes-budgetaires': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB'],
    description: 'Alertes budgétaires'
  },

  // Administration
  '/admin/exercices': {
    allowedProfiles: ['ADMIN'],
    description: 'Gestion des exercices'
  },
  '/admin/utilisateurs': {
    allowedProfiles: ['ADMIN'],
    description: 'Gestion des utilisateurs'
  },
  '/admin/roles': {
    allowedProfiles: ['ADMIN'],
    description: 'Gestion des rôles'
  },
  '/admin/autorisations': {
    allowedProfiles: ['ADMIN'],
    description: 'Autorisations'
  },
  '/admin/delegations': {
    allowedProfiles: ['ADMIN', 'DG'],
    description: 'Délégations'
  },
  '/admin/parametres': {
    allowedProfiles: ['ADMIN'],
    description: 'Paramètres système'
  },
  '/admin/journal-audit': {
    allowedProfiles: ['ADMIN', 'DG', 'AUDITEUR'],
    description: 'Journal d\'audit'
  },
  '/admin/parametres-programmatiques': {
    allowedProfiles: ['ADMIN'],
    description: 'Paramètres programmatiques'
  },
  '/admin/comptes-bancaires': {
    allowedProfiles: ['ADMIN', 'TRESORERIE', 'CB'],
    description: 'Comptes bancaires'
  },
  '/admin/origines-fonds': {
    allowedProfiles: ['ADMIN', 'DAAF'],
    description: 'Origines des fonds'
  },

  // Contractualisation
  '/contractualisation/prestataires': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'DIRECTEUR', 'OPERATEUR'],
    description: 'Prestataires'
  },
  '/contractualisation/contrats': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'AUDITEUR'],
    description: 'Contrats'
  },
  '/contractualisation/comptabilite-matiere': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'DIRECTEUR', 'OPERATEUR'],
    description: 'Comptabilité matière'
  },

  // Chaîne de dépense - Notes DG
  '/notes-dg': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'AUDITEUR'],
    description: 'Notes Direction Générale'
  },
  '/notes-dg/validation': {
    allowedProfiles: ['ADMIN', 'DG'],
    description: 'Validation des Notes DG'
  },
  '/dg/notes-a-valider': {
    allowedProfiles: ['ADMIN', 'DG'],
    description: 'Notes en attente de validation DG'
  },

  // Exécution - Dashboards
  '/execution/dashboard': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'DIRECTEUR', 'TRESORERIE', 'AUDITEUR'],
    description: 'Dashboard exécution budgétaire'
  },
  '/execution/dashboard-dg': {
    allowedProfiles: ['ADMIN', 'DG'],
    description: 'Dashboard Directeur Général'
  },
  '/execution/dashboard-direction': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'DIRECTEUR'],
    description: 'Dashboard par direction',
    requiresDirection: true
  },

  // Planification - Routes manquantes
  '/planification/physique': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'DIRECTEUR', 'AUDITEUR'],
    description: 'Planification physique'
  },
  '/planification/plan-travail': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'DIRECTEUR', 'OPERATEUR'],
    description: 'Plan de travail'
  },
  '/planification/documentation-import': {
    allowedProfiles: ['ADMIN', 'DAAF'],
    description: 'Documentation import budget'
  },
  '/planification/historique-imports': {
    allowedProfiles: ['ADMIN', 'DAAF', 'CB'],
    description: 'Historique des imports'
  },
  '/planification/aide-import': {
    allowedProfiles: ['ADMIN', 'DAAF'],
    description: 'Aide import budget'
  },
  '/planification/execution-physique': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'DIRECTEUR', 'OPERATEUR'],
    description: 'Exécution physique des tâches'
  },
  '/planification/maj-feuilles-route': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'DIRECTEUR'],
    description: 'Mise à jour des feuilles de route'
  },

  // Gestion des tâches
  '/gestion-taches/etat-execution': {
    allowedProfiles: ['all'],
    description: 'État d\'exécution des tâches'
  },
  '/gestion-taches/taches-realisees': {
    allowedProfiles: ['all'],
    description: 'Tâches réalisées'
  },
  '/gestion-taches/taches-differees': {
    allowedProfiles: ['all'],
    description: 'Tâches différées'
  },

  // Approvisionnement
  '/approvisionnement': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'DIRECTEUR', 'OPERATEUR'],
    description: 'Gestion approvisionnement'
  },

  // Trésorerie - Sous-routes
  '/tresorerie/approvisionnements/banque': {
    allowedProfiles: ['ADMIN', 'DG', 'TRESORERIE', 'AUDITEUR'],
    description: 'Approvisionnements bancaires'
  },
  '/tresorerie/approvisionnements/caisse': {
    allowedProfiles: ['ADMIN', 'DG', 'TRESORERIE', 'AUDITEUR'],
    description: 'Approvisionnements caisse'
  },
  '/tresorerie/mouvements/banque': {
    allowedProfiles: ['ADMIN', 'DG', 'TRESORERIE', 'AUDITEUR'],
    description: 'Mouvements bancaires'
  },
  '/tresorerie/mouvements/caisse': {
    allowedProfiles: ['ADMIN', 'DG', 'TRESORERIE', 'AUDITEUR'],
    description: 'Mouvements de caisse'
  },

  // Recettes
  '/recettes': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'TRESORERIE', 'AUDITEUR'],
    description: 'Déclaration et suivi des recettes'
  },

  // Programmatique
  '/programmatique/charger-budget': {
    allowedProfiles: ['ADMIN', 'DAAF', 'CB'],
    description: 'Chargement du budget programmatique'
  },
  '/programmatique/mise-a-jour': {
    allowedProfiles: ['ADMIN', 'DAAF', 'CB'],
    description: 'Mise à jour du budget programmatique'
  },
  '/programmatique/liste-budget': {
    allowedProfiles: ['ADMIN', 'DG', 'DAAF', 'CB', 'AUDITEUR'],
    description: 'Liste des budgets programmatiques'
  },
  '/programmatique/reamenagement': {
    allowedProfiles: ['ADMIN', 'DAAF', 'CB'],
    description: 'Réaménagement budgétaire'
  },

  // Administration - Routes manquantes
  '/admin/architecture': {
    allowedProfiles: ['ADMIN'],
    description: 'Architecture SYGFP'
  },
  '/admin/dictionnaire': {
    allowedProfiles: ['ADMIN'],
    description: 'Dictionnaire des variables'
  },
  '/admin/codification': {
    allowedProfiles: ['ADMIN'],
    description: 'Référentiel de codification'
  },
  '/admin/secteurs-activite': {
    allowedProfiles: ['ADMIN'],
    description: 'Secteurs d\'activité'
  },
  '/admin/documentation': {
    allowedProfiles: ['ADMIN'],
    description: 'Documentation des modules'
  },
  '/admin/raci': {
    allowedProfiles: ['ADMIN'],
    description: 'Matrice RACI'
  },
  '/admin/checklist-production': {
    allowedProfiles: ['ADMIN'],
    description: 'Checklist de production'
  },
  '/admin/liens-lambda': {
    allowedProfiles: ['ADMIN'],
    description: 'Liens et fonctions Lambda'
  },
  '/admin/parametres-exercice': {
    allowedProfiles: ['ADMIN'],
    description: 'Paramètres de l\'exercice'
  },
  '/admin/doublons': {
    allowedProfiles: ['ADMIN'],
    description: 'Gestion des doublons'
  },
  '/admin/compteurs-references': {
    allowedProfiles: ['ADMIN'],
    description: 'Compteurs et références'
  },
  '/admin/import-budget': {
    allowedProfiles: ['ADMIN'],
    description: 'Import budget administrateur'
  },
  '/admin/anomalies': {
    allowedProfiles: ['ADMIN'],
    description: 'Gestion des anomalies'
  },
  '/admin/test-non-regression': {
    allowedProfiles: ['ADMIN'],
    description: 'Tests de non-régression'
  },
};

// ============================================
// HELPER POUR VÉRIFIER L'ACCÈS À UNE ROUTE
// ============================================

/**
 * Vérifie si un profil peut accéder à une route
 */
export function canAccessRoute(
  route: string,
  userProfile: string,
  userHierarchy?: string
): boolean {
  // Trouver la règle la plus spécifique
  const rule = findRouteRule(route);
  if (!rule) return false; // Route non définie = accès refusé par défaut (sécurité)

  // Vérifier le profil fonctionnel
  if (rule.allowedProfiles.includes('all')) return true;
  if (rule.allowedProfiles.includes(userProfile)) return true;
  if (userProfile === 'ADMIN') return true; // Admin bypass

  // Vérifier le niveau hiérarchique si défini
  if (userHierarchy && rule.allowedHierarchies) {
    if (rule.allowedHierarchies.includes(userHierarchy)) return true;
  }

  return false;
}

/**
 * Trouve la règle d'accès pour une route (gère les routes dynamiques)
 */
export function findRouteRule(route: string): typeof ROUTE_ACCESS_MATRIX[string] | undefined {
  // Correspondance exacte
  if (ROUTE_ACCESS_MATRIX[route]) {
    return ROUTE_ACCESS_MATRIX[route];
  }

  // Correspondance avec paramètres (ex: /notes-sef/:id)
  const routeParts = route.split('/');
  for (const [pattern, rule] of Object.entries(ROUTE_ACCESS_MATRIX)) {
    const patternParts = pattern.split('/');
    if (patternParts.length !== routeParts.length) continue;

    let matches = true;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) continue; // Paramètre dynamique
      if (patternParts[i] !== routeParts[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return rule;
  }

  // Correspondance par préfixe (route parent)
  const sortedRoutes = Object.keys(ROUTE_ACCESS_MATRIX)
    .filter(r => route.startsWith(r))
    .sort((a, b) => b.length - a.length);

  if (sortedRoutes.length > 0) {
    return ROUTE_ACCESS_MATRIX[sortedRoutes[0]];
  }

  return undefined;
}

/**
 * Récupère les routes accessibles pour un profil
 */
export function getAccessibleRoutes(userProfile: string, userHierarchy?: string): string[] {
  return Object.entries(ROUTE_ACCESS_MATRIX)
    .filter(([route, rule]) => canAccessRoute(route, userProfile, userHierarchy))
    .map(([route]) => route);
}

/**
 * Vérifie si une route nécessite un filtrage par direction
 */
export function routeRequiresDirectionFilter(route: string): boolean {
  const rule = findRouteRule(route);
  return rule?.requiresDirection || false;
}

// Types exports
export type RoleHierarchique = keyof typeof ROLES_HIERARCHIQUES;
export type ProfilFonctionnel = keyof typeof PROFILS_FONCTIONNELS;
export type ValidationType = keyof typeof VALIDATION_MATRIX;
export type AuditedAction = typeof AUDITED_ACTIONS[number];
export type ActionRequiringMotif = typeof ACTIONS_REQUIRING_MOTIF[number];
export type RLSEntity = keyof typeof RLS_POLICIES;
export type WorkflowEntity = keyof typeof WORKFLOW_STEPS;
