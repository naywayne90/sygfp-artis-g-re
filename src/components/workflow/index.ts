/**
 * Export centralisé des composants workflow
 */

export { WorkflowStatusBadge } from './WorkflowStatusBadge';
export { WorkflowActionsBar } from './WorkflowActionsBar';
export { WorkflowStepsProgress } from './WorkflowStepsProgress';
export {
  WorkflowBlockingPanel,
  WorkflowGuidancePanel,
  NextStepCard
} from './WorkflowGuidancePanel';

// SpendingCase Timeline (nouveau workflow structuré)
export { SpendingCaseTimeline } from './SpendingCaseTimeline';

// Re-export du workflow engine
export {
  STATUTS,
  WORKFLOW_STEPS,
  getStepConfig,
  getStepByModule,
  canOwn,
  canValidate,
  checkPrerequisites,
  isValidatedStatus,
  isTerminalStatus,
  getAvailableTransitions,
  canTransition,
  getNextAction,
  getBlockingMessage,
  getStatutUIConfig,
  STATUT_UI_CONFIG,
  type Statut,
  type WorkflowStep,
  type StepConfig,
  type TransitionRule,
  type TransitionContext,
  type ValidationResult,
  type NextAction,
  type StatutUIConfig,
} from '@/lib/workflow/workflowEngine';
