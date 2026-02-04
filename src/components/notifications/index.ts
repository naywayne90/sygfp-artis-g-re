/**
 * Exports des composants de notifications
 */

// Composants principaux
export { NotificationCenter, type NotificationCenterProps } from './NotificationCenter';
export {
  NotificationCard,
  type NotificationCardProps,
  type NotificationData,
  type NotificationMetadata,
} from './NotificationCard';
export {
  NotificationDropdown,
  NotificationBell,
  type NotificationDropdownProps,
} from './NotificationDropdown';

// Badges et indicateurs
export {
  NotificationBadgeEnhanced,
  NotificationPreviewTooltip,
  NotificationTypeBadge,
  useNotificationTypeConfig,
  type NotificationBadgeEnhancedProps,
  type NotificationBadgeType,
  type NotificationPreviewProps,
} from './NotificationBadgeEnhanced';

// Préférences
export { NotificationPreferences } from './NotificationPreferences';
