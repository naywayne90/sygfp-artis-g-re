/**
 * Configuration centralisée des statuts pour SYGFP
 * Source unique de vérité pour tous les statuts de workflow
 */

// ============================================
// STATUTS GÉNÉRIQUES (utilisés partout)
// ============================================

export const STATUSES = {
  // Brouillon
  DRAFT: {
    code: 'DRAFT',
    dbValue: 'brouillon',
    label: 'Brouillon',
    color: 'slate',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    icon: 'FileEdit',
    description: 'En cours de rédaction'
  },

  // Soumis
  SUBMITTED: {
    code: 'SUBMITTED',
    dbValue: 'soumis',
    label: 'Soumis',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    icon: 'Send',
    description: 'En attente de traitement'
  },

  // À valider
  PENDING_VALIDATION: {
    code: 'PENDING_VALIDATION',
    dbValue: 'a_valider',
    label: 'À valider',
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    icon: 'Clock',
    description: 'En attente de validation'
  },

  // Validé / Approuvé
  APPROVED: {
    code: 'APPROVED',
    dbValue: 'valide',
    label: 'Validé',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: 'CheckCircle',
    description: 'Validation accordée'
  },

  // Différé
  DEFERRED: {
    code: 'DEFERRED',
    dbValue: 'differe',
    label: 'Différé',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    icon: 'Pause',
    description: 'Reporté à plus tard'
  },

  // Rejeté
  REJECTED: {
    code: 'REJECTED',
    dbValue: 'rejete',
    label: 'Rejeté',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: 'XCircle',
    description: 'Refusé'
  },

  // Soldé / Clôturé
  CLOSED: {
    code: 'CLOSED',
    dbValue: 'solde',
    label: 'Soldé',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300',
    icon: 'CheckCheck',
    description: 'Complètement traité'
  },

  // Annulé
  CANCELLED: {
    code: 'CANCELLED',
    dbValue: 'annule',
    label: 'Annulé',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
    icon: 'Ban',
    description: 'Annulé définitivement'
  },

  // En cours
  IN_PROGRESS: {
    code: 'IN_PROGRESS',
    dbValue: 'en_cours',
    label: 'En cours',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    icon: 'Loader',
    description: 'Traitement en cours'
  },

  // Imputé
  IMPUTED: {
    code: 'IMPUTED',
    dbValue: 'impute',
    label: 'Imputé',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-300',
    icon: 'Tag',
    description: 'Imputation budgétaire effectuée'
  },

  // Engagé
  ENGAGED: {
    code: 'ENGAGED',
    dbValue: 'engage',
    label: 'Engagé',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    icon: 'Lock',
    description: 'Crédits réservés'
  },

  // Liquidé
  LIQUIDATED: {
    code: 'LIQUIDATED',
    dbValue: 'liquide',
    label: 'Liquidé',
    color: 'cyan',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-300',
    icon: 'Receipt',
    description: 'Service fait constaté'
  },

  // Ordonnancé
  ORDERED: {
    code: 'ORDERED',
    dbValue: 'ordonnance',
    label: 'Ordonnancé',
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-300',
    icon: 'FileCheck',
    description: 'Ordre de paiement émis'
  },

  // Signé
  SIGNED: {
    code: 'SIGNED',
    dbValue: 'signe',
    label: 'Signé',
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    icon: 'PenTool',
    description: 'Signature apposée'
  },

  // Payé / Exécuté
  PAID: {
    code: 'PAID',
    dbValue: 'paye',
    label: 'Payé',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    icon: 'Banknote',
    description: 'Paiement effectué'
  },

  // Exécuté (règlement)
  EXECUTED: {
    code: 'EXECUTED',
    dbValue: 'execute',
    label: 'Exécuté',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: 'CheckCircle2',
    description: 'Règlement exécuté'
  },

  // Bloqué
  BLOCKED: {
    code: 'BLOCKED',
    dbValue: 'bloque',
    label: 'Bloqué',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: 'AlertOctagon',
    description: 'Bloqué - action requise'
  },
} as const;

// ============================================
// TYPES
// ============================================

export type StatusCode = keyof typeof STATUSES;
export type StatusConfig = typeof STATUSES[StatusCode];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Récupère la configuration d'un statut par son code
 */
export const getStatusConfig = (code: StatusCode): StatusConfig => STATUSES[code];

/**
 * Récupère la configuration d'un statut par sa valeur en base
 */
export const getStatusByDbValue = (dbValue: string): StatusConfig | undefined =>
  Object.values(STATUSES).find(s => s.dbValue === dbValue);

/**
 * Récupère le label d'un statut depuis sa valeur DB
 */
export const getStatusLabel = (dbValue: string): string => {
  const status = getStatusByDbValue(dbValue);
  return status?.label || dbValue;
};

/**
 * Récupère les classes CSS pour un statut
 */
export const getStatusClasses = (dbValue: string): string => {
  const status = getStatusByDbValue(dbValue);
  if (!status) return 'bg-gray-100 text-gray-700';
  return `${status.bgColor} ${status.textColor}`;
};

/**
 * Récupère la couleur de bordure pour un statut
 */
export const getStatusBorderClass = (dbValue: string): string => {
  const status = getStatusByDbValue(dbValue);
  return status?.borderColor || 'border-gray-300';
};

// ============================================
// MAPPINGS SPÉCIFIQUES PAR ENTITÉ
// ============================================

/**
 * Statuts pour les Notes SEF
 */
export const NOTE_SEF_STATUSES = [
  STATUSES.DRAFT,
  STATUSES.SUBMITTED,
  STATUSES.APPROVED,
  STATUSES.DEFERRED,
  STATUSES.REJECTED,
  STATUSES.IMPUTED,
] as const;

/**
 * Statuts pour les Notes AEF
 */
export const NOTE_AEF_STATUSES = [
  STATUSES.DRAFT,
  STATUSES.SUBMITTED,
  STATUSES.APPROVED,
  STATUSES.DEFERRED,
  STATUSES.REJECTED,
  STATUSES.IMPUTED,
] as const;

/**
 * Statuts pour les Engagements
 */
export const ENGAGEMENT_STATUSES = [
  STATUSES.DRAFT,
  STATUSES.APPROVED,
  STATUSES.LIQUIDATED,
  STATUSES.ORDERED,
  STATUSES.PAID,
] as const;

/**
 * Statuts pour les Liquidations
 */
export const LIQUIDATION_STATUSES = [
  STATUSES.DRAFT,
  STATUSES.APPROVED,
  STATUSES.ORDERED,
] as const;

/**
 * Statuts pour les Ordonnancements
 */
export const ORDONNANCEMENT_STATUSES = [
  STATUSES.DRAFT,
  STATUSES.SIGNED,
  STATUSES.PAID,
] as const;

/**
 * Statuts pour les Règlements
 */
export const REGLEMENT_STATUSES = [
  STATUSES.DRAFT,
  STATUSES.IN_PROGRESS,
  STATUSES.EXECUTED,
] as const;

/**
 * Statuts pour les Dossiers
 */
export const DOSSIER_STATUSES = [
  STATUSES.DRAFT,
  STATUSES.IN_PROGRESS,
  STATUSES.APPROVED,
  STATUSES.BLOCKED,
  STATUSES.CLOSED,
  STATUSES.CANCELLED,
] as const;

// ============================================
// TRANSITIONS DE WORKFLOW
// ============================================

export const WORKFLOW_TRANSITIONS = {
  NOTE_SEF: {
    brouillon: ['soumis'],
    soumis: ['valide', 'rejete', 'differe'],
    valide: ['impute'],
    differe: ['soumis'],
    rejete: ['brouillon'],
    impute: [],
  },
  NOTE_AEF: {
    brouillon: ['soumis'],
    soumis: ['valide', 'rejete', 'differe'],
    valide: ['impute'],
    differe: ['soumis'],
    rejete: ['brouillon'],
    impute: [],
  },
  ENGAGEMENT: {
    brouillon: ['valide'],
    valide: ['liquide'],
    liquide: ['ordonnance'],
    ordonnance: ['paye'],
    paye: [],
  },
  DOSSIER: {
    brouillon: ['en_cours'],
    en_cours: ['valide', 'bloque'],
    valide: ['solde'],
    bloque: ['en_cours', 'annule'],
    solde: [],
    annule: [],
  },
} as const;

/**
 * Vérifie si une transition est autorisée
 */
export const isTransitionAllowed = (
  entityType: keyof typeof WORKFLOW_TRANSITIONS,
  fromStatus: string,
  toStatus: string
): boolean => {
  const transitions = WORKFLOW_TRANSITIONS[entityType];
  const allowedNextStatuses = transitions[fromStatus as keyof typeof transitions];
  return allowedNextStatuses?.includes(toStatus as any) || false;
};

/**
 * Récupère les prochains statuts possibles
 */
export const getNextStatuses = (
  entityType: keyof typeof WORKFLOW_TRANSITIONS,
  currentStatus: string
): string[] => {
  const transitions = WORKFLOW_TRANSITIONS[entityType];
  return transitions[currentStatus as keyof typeof transitions] || [];
};
