/**
 * Types pour le système de validation SYGFP
 * Actions de validation : Validé, Différé, Rejeté
 */

// Types d'entités supportés pour la validation
export const VALIDATION_ENTITY_TYPES = [
  'notes_sef',
  'engagement',
  'liquidation',
  'ordonnancement',
] as const;

export type ValidationEntityType = typeof VALIDATION_ENTITY_TYPES[number];

// Actions de validation possibles
export const VALIDATION_ACTIONS = ['valider', 'differer', 'rejeter'] as const;

export type ValidationAction = typeof VALIDATION_ACTIONS[number];

// Statuts résultants de la validation
export const VALIDATION_STATUSES = {
  valider: 'validé',
  differer: 'différé',
  rejeter: 'rejeté',
} as const;

export type ValidationStatus = typeof VALIDATION_STATUSES[keyof typeof VALIDATION_STATUSES];

// Données du formulaire de différé
export interface DiffereFormData {
  motif: string;
  conditionReprise?: string;
  dateReprisePrevue?: Date | null;
}

// Données du formulaire de rejet
export interface RejetFormData {
  motif: string;
}

// Payload de validation envoyé au backend
export interface ValidationPayload {
  entityType: ValidationEntityType;
  entityId: string;
  action: ValidationAction;
  motif?: string;
  conditionReprise?: string;
  dateReprisePrevue?: string | null;
  validatedBy?: string;
  validatedAt?: string;
}

// Résultat de la validation
export interface ValidationResult {
  success: boolean;
  entityId: string;
  newStatus: ValidationStatus;
  message: string;
}

// Props du composant ValidationButtons
export interface ValidationButtonsProps {
  entityType: ValidationEntityType;
  entityId: string;
  currentStatus: string;
  onSuccess?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Configuration des couleurs et icônes par action
export const VALIDATION_CONFIG = {
  valider: {
    label: 'Valider',
    color: '#10B981',
    bgClass: 'bg-emerald-500 hover:bg-emerald-600',
    textClass: 'text-white',
    icon: 'CheckCircle',
  },
  differer: {
    label: 'Différer',
    color: '#F59E0B',
    bgClass: 'bg-amber-500 hover:bg-amber-600',
    textClass: 'text-white',
    icon: 'Clock',
  },
  rejeter: {
    label: 'Rejeter',
    color: '#EF4444',
    bgClass: 'bg-red-500 hover:bg-red-600',
    textClass: 'text-white',
    icon: 'XCircle',
  },
} as const;

// Labels des types d'entités en français
export const ENTITY_TYPE_LABELS: Record<ValidationEntityType, string> = {
  notes_sef: 'Note SEF',
  engagement: 'Engagement',
  liquidation: 'Liquidation',
  ordonnancement: 'Ordonnancement',
};
