/**
 * Feature Flags - Mode Safe
 * 
 * Permet d'activer/désactiver des fonctionnalités sans casser l'existant.
 * Les nouvelles features sont désactivées par défaut en production.
 */

export const FEATURE_FLAGS = {
  // ===== Recherche =====
  /** Recherche avancée unifiée par dossier */
  RECHERCHE_AVANCEE: true,

  // ===== Timeline =====
  /** Timeline interactive dans détail dossier */
  TIMELINE_INTERACTIVE: true,

  // ===== Paniers =====
  /** Paniers de tâches unifiés par rôle */
  PANIERS_UNIFIES: true,

  // ===== Pièces jointes =====
  /** Interface pièces jointes unifiée */
  PIECES_JOINTES_UNIFIEES: true,

  // ===== Export =====
  /** Export PDF mandats/ordonnancements */
  EXPORT_PDF_MANDATS: false, // En développement

  // ===== Notifications =====
  /** Notifications email automatiques */
  NOTIFICATIONS_EMAIL: false, // Edge function prête, intégration en cours

  // ===== Workflow V2 =====
  /**
   * Active le nouveau workflow structuré avec règles de transition strictes
   * SEF → AEF → Imputation → Passation → Engagement → Liquidation → Ordonnancement → Règlement
   * Si désactivé, les modules existants (Scanning) continuent sans dépendre de toutes les étapes
   */
  WORKFLOW_V2: false, // Désactivé par défaut pour ne pas casser l'existant

  /** Timeline avancée avec navigation entre étapes */
  TIMELINE_ADVANCED: true,

  /** Saut d'étape automatique si conditions remplies (ex: pas de passation < 5M) */
  SMART_STAGE_SKIP: false,

} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Vérifie si une feature est activée
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}

/**
 * Hook pour utiliser les feature flags dans les composants
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return isFeatureEnabled(flag);
}

/**
 * Wrapper conditionnel pour composants
 * Usage: <FeatureGate flag="RECHERCHE_AVANCEE" fallback={<OldComponent />}>
 *          <NewComponent />
 *        </FeatureGate>
 */
export interface FeatureGateProps {
  flag: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
