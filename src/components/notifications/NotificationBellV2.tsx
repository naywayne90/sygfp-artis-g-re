/**
 * NotificationBellV2 - Icône cloche avec badge et dropdown
 * Version améliorée utilisant NotificationDropdown avec Realtime
 */

import { cn } from '@/lib/utils';
import { NotificationDropdown } from './NotificationDropdown';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationBellV2Props {
  /** Classe CSS additionnelle */
  className?: string;
  /** Nombre max de notifications à afficher dans le dropdown */
  maxItems?: number;
  /** Afficher le bouton pour activer/désactiver le son */
  showSoundToggle?: boolean;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function NotificationBellV2({
  className,
  maxItems = 5,
  showSoundToggle = true,
}: NotificationBellV2Props) {
  return (
    <NotificationDropdown
      className={cn(className)}
      maxItems={maxItems}
      showSoundToggle={showSoundToggle}
    />
  );
}

export default NotificationBellV2;
