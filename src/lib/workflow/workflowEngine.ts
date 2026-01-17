/**
 * SYGFP - Workflow Engine (Fonctions pures)
 * 
 * Gère la chaîne de la dépense en 9 étapes avec:
 * - Statuts standardisés
 * - Règles de transition
 * - Owners/Validators par étape
 * - Prérequis entre étapes
 * 
 * @version 2.0
 * @date 2026-01-17
 */

// ============================================
// STATUTS STANDARDISÉS
// ============================================

export const STATUTS = {
  BROUILLON: 'brouillon',
  SOUMIS: 'soumis',
  A_VALIDER: 'a_valider',
  EN_VALIDATION_DG: 'en_validation_dg',
  VALIDE: 'valide',
  REJETE: 'rejete',
  DIFFERE: 'differe',
  IMPUTE: 'impute',
  EN_SIGNATURE: 'en_signature',
  SIGNE: 'signe',
  PAYE: 'paye',
  CLOTURE: 'cloture',
  ANNULE: 'annule',
} as const;

export type Statut = typeof STATUTS[keyof typeof STATUTS];

// ============================================
// DÉFINITION DES 9 ÉTAPES
// ============================================

export type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface StepConfig {
  id: WorkflowStep;
  code: string;
  label: string;
  labelShort: string;
  table: string;
  owners: string[];        // Rôles pouvant créer/modifier
  validators: string[];    // Rôles pouvant valider
  prerequisSteps: WorkflowStep[];  // Étapes devant être validées avant
  prerequisOptional?: boolean;     // Si true, prérequis seulement sous conditions
  validStatuts: readonly Statut[]; // Statuts possibles pour cette étape
  nextStep?: WorkflowStep;
  previousStep?: WorkflowStep;
  description: string;
  seuilDG?: number;        // Seuil pour validation DG (en FCFA)
}

export const WORKFLOW_STEPS: Record<WorkflowStep, StepConfig> = {
  1: {
    id: 1,
    code: 'NOTE_SEF',
    label: 'Note Sans Engagement Financier',
    labelShort: 'Note SEF',
    table: 'notes_sef',
    owners: ['AGENT', 'OPERATEUR', 'CHEF_SERVICE', 'DIRECTEUR', 'ADMIN'],
    validators: ['DG', 'ADMIN'],
    prerequisSteps: [],
    validStatuts: [STATUTS.BROUILLON, STATUTS.SOUMIS, STATUTS.VALIDE, STATUTS.REJETE, STATUTS.DIFFERE],
    nextStep: 2,
    description: 'Demande sans impact budgétaire immédiat',
  },
  2: {
    id: 2,
    code: 'NOTE_AEF',
    label: 'Note Avec Engagement Financier',
    labelShort: 'Note AEF',
    table: 'notes_dg',
    owners: ['AGENT', 'OPERATEUR', 'CHEF_SERVICE', 'DIRECTEUR', 'ADMIN'],
    validators: ['DIRECTEUR', 'DG', 'ADMIN'],
    prerequisSteps: [1],
    prerequisOptional: true, // SEF optionnelle selon montant
    validStatuts: [STATUTS.BROUILLON, STATUTS.SOUMIS, STATUTS.A_VALIDER, STATUTS.VALIDE, STATUTS.REJETE, STATUTS.DIFFERE],
    previousStep: 1,
    nextStep: 3,
    description: 'Demande avec engagement financier prévu',
  },
  3: {
    id: 3,
    code: 'IMPUTATION',
    label: 'Imputation Budgétaire',
    labelShort: 'Imputation',
    table: 'imputations',
    owners: ['CB', 'ADMIN'],
    validators: ['CB', 'ADMIN'],
    prerequisSteps: [2],
    validStatuts: [STATUTS.BROUILLON, STATUTS.IMPUTE, STATUTS.REJETE],
    previousStep: 2,
    nextStep: 4,
    description: 'Affectation aux lignes budgétaires',
  },
  4: {
    id: 4,
    code: 'EXPRESSION_BESOIN',
    label: 'Expression de Besoin',
    labelShort: 'Exp. Besoin',
    table: 'expressions_besoin',
    owners: ['AGENT', 'CHEF_SERVICE', 'DAAF', 'ADMIN'],
    validators: ['CHEF_SERVICE', 'DIRECTEUR', 'ADMIN'],
    prerequisSteps: [3],
    validStatuts: [STATUTS.BROUILLON, STATUTS.SOUMIS, STATUTS.VALIDE, STATUTS.REJETE, STATUTS.DIFFERE],
    previousStep: 3,
    nextStep: 5,
    description: 'Formalisation détaillée du besoin',
  },
  5: {
    id: 5,
    code: 'PASSATION_MARCHE',
    label: 'Passation de Marché',
    labelShort: 'Marché',
    table: 'marches',
    owners: ['DAAF', 'COMMISSION_MARCHES', 'ADMIN'],
    validators: ['DG', 'COMMISSION_MARCHES', 'ADMIN'],
    prerequisSteps: [4],
    prerequisOptional: true, // Marché seulement si montant > seuil
    validStatuts: [STATUTS.BROUILLON, STATUTS.SOUMIS, STATUTS.VALIDE, STATUTS.REJETE, STATUTS.DIFFERE, STATUTS.ANNULE],
    previousStep: 4,
    nextStep: 6,
    description: 'Procédure de passation si montant > seuil',
    seuilDG: 5000000, // 5M FCFA pour exiger marché
  },
  6: {
    id: 6,
    code: 'ENGAGEMENT',
    label: 'Engagement Budgétaire',
    labelShort: 'Engagement',
    table: 'budget_engagements',
    owners: ['DAAF', 'CB', 'ADMIN'],
    validators: ['CB', 'ADMIN'],
    prerequisSteps: [4], // Après expression de besoin (marché optionnel)
    validStatuts: [STATUTS.BROUILLON, STATUTS.SOUMIS, STATUTS.VALIDE, STATUTS.REJETE, STATUTS.DIFFERE],
    previousStep: 5,
    nextStep: 7,
    description: 'Réservation des crédits budgétaires',
    seuilDG: 50000000, // 50M FCFA pour validation DG
  },
  7: {
    id: 7,
    code: 'LIQUIDATION',
    label: 'Liquidation',
    labelShort: 'Liquidation',
    table: 'budget_liquidations',
    owners: ['DAAF', 'SDCT', 'ADMIN'],
    validators: ['SDCT', 'DAAF', 'DG', 'ADMIN'],
    prerequisSteps: [6],
    validStatuts: [STATUTS.BROUILLON, STATUTS.SOUMIS, STATUTS.EN_VALIDATION_DG, STATUTS.VALIDE, STATUTS.REJETE, STATUTS.DIFFERE],
    previousStep: 6,
    nextStep: 8,
    description: 'Constatation du service fait',
    seuilDG: 50000000, // 50M FCFA pour validation DG
  },
  8: {
    id: 8,
    code: 'ORDONNANCEMENT',
    label: 'Ordonnancement',
    labelShort: 'Ordo.',
    table: 'ordonnancements',
    owners: ['DAAF', 'ADMIN'],
    validators: ['DG', 'ADMIN'],
    prerequisSteps: [7],
    validStatuts: [STATUTS.BROUILLON, STATUTS.SOUMIS, STATUTS.EN_SIGNATURE, STATUTS.SIGNE, STATUTS.REJETE, STATUTS.DIFFERE],
    previousStep: 7,
    nextStep: 9,
    description: 'Ordre de paiement',
    seuilDG: 50000000, // 50M FCFA pour validation DG
  },
  9: {
    id: 9,
    code: 'REGLEMENT',
    label: 'Règlement',
    labelShort: 'Règlement',
    table: 'reglements',
    owners: ['TRESORERIE', 'AGENT_COMPTABLE', 'ADMIN'],
    validators: ['TRESORERIE', 'AGENT_COMPTABLE', 'ADMIN'],
    prerequisSteps: [8],
    validStatuts: [STATUTS.BROUILLON, STATUTS.SOUMIS, STATUTS.PAYE, STATUTS.REJETE, STATUTS.CLOTURE],
    previousStep: 8,
    description: 'Exécution du paiement effectif',
  },
};

// ============================================
// TRANSITIONS DE STATUTS
// ============================================

export interface TransitionRule {
  from: Statut | Statut[];
  to: Statut;
  action: string;
  actionLabel: string;
  requiredRoles: string[];
  requiresMotif: boolean;
  requiresBudgetCheck?: boolean;
  conditions?: (context: TransitionContext) => ValidationResult;
}

export interface TransitionContext {
  entity: Record<string, unknown>;
  userRoles: string[];
  step: WorkflowStep;
  montant?: number;
  dossierStatut?: string;
  previousStepValidated?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  code?: string;
}

// Transitions communes à toutes les étapes
const COMMON_TRANSITIONS: TransitionRule[] = [
  {
    from: STATUTS.BROUILLON,
    to: STATUTS.SOUMIS,
    action: 'SUBMIT',
    actionLabel: 'Soumettre',
    requiredRoles: [],
    requiresMotif: false,
  },
  {
    from: STATUTS.SOUMIS,
    to: STATUTS.VALIDE,
    action: 'VALIDATE',
    actionLabel: 'Valider',
    requiredRoles: [], // Défini par étape
    requiresMotif: false,
  },
  {
    from: [STATUTS.SOUMIS, STATUTS.A_VALIDER],
    to: STATUTS.REJETE,
    action: 'REJECT',
    actionLabel: 'Rejeter',
    requiredRoles: [],
    requiresMotif: true,
  },
  {
    from: [STATUTS.SOUMIS, STATUTS.A_VALIDER],
    to: STATUTS.DIFFERE,
    action: 'DEFER',
    actionLabel: 'Différer',
    requiredRoles: [],
    requiresMotif: true,
  },
  {
    from: STATUTS.DIFFERE,
    to: STATUTS.SOUMIS,
    action: 'RESUBMIT',
    actionLabel: 'Resoumettre',
    requiredRoles: [],
    requiresMotif: false,
  },
  {
    from: STATUTS.REJETE,
    to: STATUTS.BROUILLON,
    action: 'REVISE',
    actionLabel: 'Corriger',
    requiredRoles: [],
    requiresMotif: false,
  },
];

// Transitions spécifiques par module
const MODULE_TRANSITIONS: Record<string, TransitionRule[]> = {
  notes_dg: [
    {
      from: STATUTS.SOUMIS,
      to: STATUTS.A_VALIDER,
      action: 'FORWARD_DIR',
      actionLabel: 'Transmettre au Directeur',
      requiredRoles: ['CHEF_SERVICE'],
      requiresMotif: false,
    },
    {
      from: STATUTS.A_VALIDER,
      to: STATUTS.VALIDE,
      action: 'VALIDATE',
      actionLabel: 'Valider',
      requiredRoles: ['DIRECTEUR', 'DG', 'ADMIN'],
      requiresMotif: false,
    },
  ],
  imputations: [
    {
      from: STATUTS.BROUILLON,
      to: STATUTS.IMPUTE,
      action: 'IMPUTE',
      actionLabel: 'Imputer',
      requiredRoles: ['CB', 'ADMIN'],
      requiresMotif: false,
      requiresBudgetCheck: true,
    },
  ],
  budget_liquidations: [
    {
      from: STATUTS.SOUMIS,
      to: STATUTS.EN_VALIDATION_DG,
      action: 'FORWARD_DG',
      actionLabel: 'Transmettre au DG',
      requiredRoles: ['SDCT', 'DAAF'],
      requiresMotif: false,
      conditions: (ctx) => ({
        valid: (ctx.montant || 0) >= 50000000,
        message: 'Montant ≥ 50M FCFA requis pour validation DG',
      }),
    },
    {
      from: STATUTS.EN_VALIDATION_DG,
      to: STATUTS.VALIDE,
      action: 'VALIDATE_DG',
      actionLabel: 'Valider (DG)',
      requiredRoles: ['DG', 'ADMIN'],
      requiresMotif: false,
    },
  ],
  ordonnancements: [
    {
      from: STATUTS.SOUMIS,
      to: STATUTS.EN_SIGNATURE,
      action: 'PREPARE_SIGN',
      actionLabel: 'Préparer signature',
      requiredRoles: ['DAAF', 'ADMIN'],
      requiresMotif: false,
    },
    {
      from: STATUTS.EN_SIGNATURE,
      to: STATUTS.SIGNE,
      action: 'SIGN',
      actionLabel: 'Signer',
      requiredRoles: ['DG', 'ADMIN'],
      requiresMotif: false,
    },
  ],
  reglements: [
    {
      from: STATUTS.SOUMIS,
      to: STATUTS.PAYE,
      action: 'PAY',
      actionLabel: 'Confirmer paiement',
      requiredRoles: ['TRESORERIE', 'AGENT_COMPTABLE', 'ADMIN'],
      requiresMotif: false,
    },
    {
      from: STATUTS.PAYE,
      to: STATUTS.CLOTURE,
      action: 'CLOSE',
      actionLabel: 'Clôturer',
      requiredRoles: ['TRESORERIE', 'ADMIN'],
      requiresMotif: false,
    },
  ],
};

// ============================================
// WORKFLOW ENGINE (Fonctions pures)
// ============================================

/**
 * Récupère la configuration d'une étape
 */
export function getStepConfig(step: WorkflowStep): StepConfig {
  return WORKFLOW_STEPS[step];
}

/**
 * Récupère l'étape par code de module
 */
export function getStepByModule(moduleCode: string): StepConfig | undefined {
  return Object.values(WORKFLOW_STEPS).find((s) => s.table === moduleCode || s.code === moduleCode);
}

/**
 * Vérifie si un utilisateur peut créer/modifier une entité à cette étape
 */
export function canOwn(step: WorkflowStep, userRoles: string[]): boolean {
  const config = WORKFLOW_STEPS[step];
  if (userRoles.includes('ADMIN')) return true;
  return config.owners.some((role) => userRoles.includes(role));
}

/**
 * Vérifie si un utilisateur peut valider à cette étape
 */
export function canValidate(step: WorkflowStep, userRoles: string[]): boolean {
  const config = WORKFLOW_STEPS[step];
  if (userRoles.includes('ADMIN')) return true;
  return config.validators.some((role) => userRoles.includes(role));
}

/**
 * Vérifie si les prérequis d'étape sont remplis
 */
export function checkPrerequisites(
  step: WorkflowStep,
  dossierState: Record<WorkflowStep, Statut | null>,
  montant?: number
): ValidationResult {
  const config = WORKFLOW_STEPS[step];
  
  // Pas de prérequis
  if (config.prerequisSteps.length === 0) {
    return { valid: true, message: '' };
  }

  // Prérequis optionnels (selon conditions)
  if (config.prerequisOptional) {
    // Étape 5 (Marché) optionnelle si montant < seuil
    if (step === 5 && montant && montant < (config.seuilDG || 0)) {
      return { valid: true, message: 'Marché non requis (montant < seuil)' };
    }
    // Étape 2 (AEF) peut être créée sans SEF validée
    if (step === 2) {
      return { valid: true, message: 'Note SEF optionnelle' };
    }
  }

  // Vérifier que toutes les étapes prérequises sont validées
  for (const prereqStep of config.prerequisSteps) {
    const prereqStatus = dossierState[prereqStep];
    if (!prereqStatus || !isValidatedStatus(prereqStatus)) {
      const prereqConfig = WORKFLOW_STEPS[prereqStep];
      return {
        valid: false,
        message: `L'étape "${prereqConfig.labelShort}" doit être validée avant de créer ${config.labelShort}`,
        code: 'PREREQUIS_NON_VALIDE',
      };
    }
  }

  return { valid: true, message: '' };
}

/**
 * Vérifie si un statut indique une validation réussie
 */
export function isValidatedStatus(statut: Statut | string): boolean {
  const validatedStatuts: string[] = [STATUTS.VALIDE, STATUTS.IMPUTE, STATUTS.SIGNE, STATUTS.PAYE, STATUTS.CLOTURE];
  return validatedStatuts.includes(statut);
}

/**
 * Vérifie si un statut est terminal (pas de transition possible)
 */
export function isTerminalStatus(statut: Statut | string): boolean {
  const terminalStatuts: string[] = [STATUTS.CLOTURE, STATUTS.ANNULE];
  return terminalStatuts.includes(statut);
}

/**
 * Récupère les transitions disponibles pour un module et statut
 */
export function getAvailableTransitions(
  moduleCode: string,
  currentStatus: Statut,
  userRoles: string[],
  context?: Partial<TransitionContext>
): TransitionRule[] {
  const step = getStepByModule(moduleCode);
  if (!step) return [];

  // Combiner les transitions communes et spécifiques
  const allTransitions = [
    ...COMMON_TRANSITIONS,
    ...(MODULE_TRANSITIONS[moduleCode] || []),
  ];

  // Filtrer par statut actuel et rôles
  return allTransitions.filter((transition) => {
    // Vérifier le statut source
    const fromStatuts = Array.isArray(transition.from) ? transition.from : [transition.from];
    if (!fromStatuts.includes(currentStatus)) return false;

    // Vérifier les rôles
    if (transition.requiredRoles.length > 0) {
      const hasRole = transition.requiredRoles.some((r) => userRoles.includes(r)) || userRoles.includes('ADMIN');
      if (!hasRole) return false;
    }

    // Vérifier les conditions additionnelles
    if (transition.conditions && context) {
      const result = transition.conditions({
        entity: {},
        userRoles,
        step: step.id,
        ...context,
      });
      if (!result.valid) return false;
    }

    return true;
  });
}

/**
 * Vérifie si une transition spécifique est autorisée
 */
export function canTransition(
  moduleCode: string,
  fromStatus: Statut,
  toStatus: Statut,
  userRoles: string[],
  context?: Partial<TransitionContext>
): ValidationResult {
  const transitions = getAvailableTransitions(moduleCode, fromStatus, userRoles, context);
  const transition = transitions.find((t) => t.to === toStatus);

  if (!transition) {
    return {
      valid: false,
      message: `Transition de "${fromStatus}" vers "${toStatus}" non autorisée`,
      code: 'TRANSITION_NON_AUTORISEE',
    };
  }

  return { valid: true, message: transition.actionLabel };
}

/**
 * Détermine la prochaine action recommandée
 */
export interface NextAction {
  action: string;
  label: string;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  icon?: string;
  requiresMotif: boolean;
  toStatus: Statut;
}

export function getNextAction(
  moduleCode: string,
  currentStatus: Statut,
  userRoles: string[],
  context?: Partial<TransitionContext>
): NextAction | null {
  const transitions = getAvailableTransitions(moduleCode, currentStatus, userRoles, context);
  
  if (transitions.length === 0) return null;

  // Prioriser certaines actions
  const priority: Statut[] = [
    STATUTS.SOUMIS,
    STATUTS.VALIDE,
    STATUTS.IMPUTE,
    STATUTS.SIGNE,
    STATUTS.PAYE,
  ];

  for (const targetStatus of priority) {
    const transition = transitions.find((t) => t.to === targetStatus);
    if (transition) {
      return {
        action: transition.action,
        label: transition.actionLabel,
        variant: transition.to === STATUTS.REJETE ? 'destructive' : 'default',
        requiresMotif: transition.requiresMotif,
        toStatus: transition.to,
      };
    }
  }

  // Retourner la première transition disponible
  const first = transitions[0];
  return {
    action: first.action,
    label: first.actionLabel,
    variant: first.to === STATUTS.REJETE ? 'destructive' : 'default',
    requiresMotif: first.requiresMotif,
    toStatus: first.to,
  };
}

/**
 * Récupère le message d'erreur explicatif pour un blocage
 */
export function getBlockingMessage(
  moduleCode: string,
  currentStatus: Statut,
  targetAction: string
): string {
  const step = getStepByModule(moduleCode);
  if (!step) return 'Module inconnu';

  const messages: Record<string, Record<string, string>> = {
    PREREQUIS_NON_VALIDE: {
      default: `Vous devez d'abord valider l'étape précédente`,
    },
    ROLE_INSUFFISANT: {
      VALIDATE: `Seuls les profils ${step.validators.join(', ')} peuvent valider`,
      SUBMIT: `Seuls les profils ${step.owners.join(', ')} peuvent soumettre`,
    },
    STATUT_INVALID: {
      SUBMIT: `Seuls les brouillons peuvent être soumis`,
      VALIDATE: `Seuls les éléments soumis peuvent être validés`,
    },
  };

  return messages[targetAction]?.default || 'Action non autorisée';
}

// ============================================
// LABELS ET CONFIGURATION UI
// ============================================

export interface StatutUIConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const STATUT_UI_CONFIG: Record<Statut, StatutUIConfig> = {
  [STATUTS.BROUILLON]: {
    label: 'Brouillon',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-muted',
    icon: 'FileEdit',
  },
  [STATUTS.SOUMIS]: {
    label: 'Soumis',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: 'Send',
  },
  [STATUTS.A_VALIDER]: {
    label: 'À valider',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: 'Clock',
  },
  [STATUTS.EN_VALIDATION_DG]: {
    label: 'En validation DG',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: 'UserCheck',
  },
  [STATUTS.VALIDE]: {
    label: 'Validé',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: 'CheckCircle',
  },
  [STATUTS.REJETE]: {
    label: 'Rejeté',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
    icon: 'XCircle',
  },
  [STATUTS.DIFFERE]: {
    label: 'Différé',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20',
    icon: 'Clock',
  },
  [STATUTS.IMPUTE]: {
    label: 'Imputé',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: 'Tag',
  },
  [STATUTS.EN_SIGNATURE]: {
    label: 'En signature',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: 'PenTool',
  },
  [STATUTS.SIGNE]: {
    label: 'Signé',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: 'CheckSquare',
  },
  [STATUTS.PAYE]: {
    label: 'Payé',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
    icon: 'Banknote',
  },
  [STATUTS.CLOTURE]: {
    label: 'Clôturé',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: 'Archive',
  },
  [STATUTS.ANNULE]: {
    label: 'Annulé',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    icon: 'Ban',
  },
};

export function getStatutUIConfig(statut: string): StatutUIConfig {
  return STATUT_UI_CONFIG[statut as Statut] || {
    label: statut,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-muted',
    icon: 'Circle',
  };
}
