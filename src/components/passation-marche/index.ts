// Composants Passation de Marché
export { PassationMarcheForm } from './PassationMarcheForm';
export { PassationChecklist, DOCUMENTS_PAR_MODE, DOCUMENTS_COMMUNS } from './PassationChecklist';
export { PassationDetails } from './PassationDetails';
export { PassationTimeline } from './PassationTimeline';
export { EvaluationGrid } from './EvaluationGrid';
export { WorkflowActionBar } from './WorkflowActionBar';

// Re-export types from hook for convenience
export type {
  LotMarche,
  PassationMarche,
  PassationStatut,
  EBValidee,
  DecisionSortie,
} from '@/hooks/usePassationsMarche';
export {
  MODES_PASSATION,
  DECISIONS_SORTIE,
  STATUTS,
  WORKFLOW_STEPS,
  LIFECYCLE_STEPS,
} from '@/hooks/usePassationsMarche';
