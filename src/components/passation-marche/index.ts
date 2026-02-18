// Composants Passation de Marché
export { PassationMarcheForm } from './PassationMarcheForm';
export { PassationChecklist, DOCUMENTS_PAR_MODE, DOCUMENTS_COMMUNS } from './PassationChecklist';
export { PassationDetails } from './PassationDetails';
export { PassationTimeline } from './PassationTimeline';
export { PassationValidateDialog } from './PassationValidateDialog';
export { PassationRejectDialog } from './PassationRejectDialog';
export { PassationDeferDialog } from './PassationDeferDialog';
export { EvaluationGrid } from './EvaluationGrid';

// Re-export types from hook for convenience
export type {
  LotMarche,
  PassationMarche,
  EBValidee,
  DecisionSortie,
} from '@/hooks/usePassationsMarche';
export { MODES_PASSATION, DECISIONS_SORTIE, STATUTS } from '@/hooks/usePassationsMarche';
