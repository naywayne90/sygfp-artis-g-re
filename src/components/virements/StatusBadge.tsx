/**
 * Badge de statut d'un virement / ajustement.
 *
 * Extrait le 2026-04-08 de `src/pages/planification/Virements.tsx`.
 * Rend une pastille colorée avec icône + label, selon STATUS_CONFIG.
 */

import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG } from './constants';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.soumis;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className={`gap-1 ${config.color} ${config.bgColor} border-0`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
