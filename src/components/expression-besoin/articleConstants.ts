/**
 * Constantes partagées pour les articles d'expression de besoin
 * Re-exports UNITES from the hook to avoid duplication
 */

import { UNITES } from '@/hooks/useExpressionsBesoin';

export { UNITES };

export function getUniteLabel(value: string): string {
  return UNITES.find((u) => u.value === value)?.label || value;
}
