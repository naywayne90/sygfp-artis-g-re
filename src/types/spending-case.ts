/**
 * SpendingCase - Type unifié pour la chaîne de dépense
 *
 * Représente un dossier de dépense complet avec toutes ses étapes:
 * SEF → AEF → Imputation → Passation → Engagement → Liquidation → Ordonnancement → Règlement
 */

// Définition des étapes de la chaîne
export const SPENDING_STAGES = [
  "note_sef",
  "note_aef",
  "imputation",
  "passation_marche",
  "engagement",
  "liquidation",
  "ordonnancement",
  "reglement",
] as const;

export type SpendingStage = typeof SPENDING_STAGES[number];

// Mapping des étapes vers leur ordre
export const STAGE_ORDER: Record<SpendingStage, number> = {
  note_sef: 1,
  note_aef: 2,
  imputation: 3,
  passation_marche: 4,
  engagement: 5,
  liquidation: 6,
  ordonnancement: 7,
  reglement: 8,
};

// Configuration des étapes
export const STAGE_CONFIG: Record<SpendingStage, {
  label: string;
  shortLabel: string;
  description: string;
  requiredPrevious: SpendingStage | null;
  canSkip: boolean;
  validationRole: string;
}> = {
  note_sef: {
    label: "Note SEF",
    shortLabel: "SEF",
    description: "Note de Service d'Engagement Financier",
    requiredPrevious: null,
    canSkip: false,
    validationRole: "DG",
  },
  note_aef: {
    label: "Note AEF",
    shortLabel: "AEF",
    description: "Note d'Autorisation d'Engagement Financier",
    requiredPrevious: "note_sef",
    canSkip: false,
    validationRole: "DIRECTEUR",
  },
  imputation: {
    label: "Imputation",
    shortLabel: "IMP",
    description: "Imputation budgétaire",
    requiredPrevious: "note_aef",
    canSkip: false,
    validationRole: "CB",
  },
  passation_marche: {
    label: "Passation",
    shortLabel: "PM",
    description: "Passation de marché",
    requiredPrevious: "imputation",
    canSkip: true, // Peut être sautée pour petites dépenses
    validationRole: "DAAF",
  },
  engagement: {
    label: "Engagement",
    shortLabel: "ENG",
    description: "Engagement de la dépense",
    requiredPrevious: "imputation", // ou passation si applicable
    canSkip: false,
    validationRole: "CB",
  },
  liquidation: {
    label: "Liquidation",
    shortLabel: "LIQ",
    description: "Liquidation de la dépense",
    requiredPrevious: "engagement",
    canSkip: false,
    validationRole: "DAAF",
  },
  ordonnancement: {
    label: "Ordonnancement",
    shortLabel: "ORD",
    description: "Ordonnancement du paiement",
    requiredPrevious: "liquidation",
    canSkip: false,
    validationRole: "DG",
  },
  reglement: {
    label: "Règlement",
    shortLabel: "REG",
    description: "Règlement effectif",
    requiredPrevious: "ordonnancement",
    canSkip: false,
    validationRole: "TRESORERIE",
  },
};

// Statut global du dossier
export type SpendingCaseStatus =
  | "draft"      // Brouillon
  | "in_progress" // En cours
  | "blocked"    // Bloqué (rejet ou problème)
  | "completed"  // Terminé
  | "cancelled"; // Annulé

// Statut d'une étape
export type StepStatus =
  | "pending"    // En attente
  | "in_progress" // En cours
  | "completed"  // Terminée
  | "rejected"   // Rejetée
  | "deferred"   // Différée
  | "skipped";   // Sautée (si autorisé)

// Données d'une étape
export interface SpendingStepData {
  stage: SpendingStage;
  status: StepStatus;
  entityId?: string;
  reference?: string;
  montant?: number;
  date?: string;
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
  deferralReason?: string;
}

// Timeline JSON stockée dans le dossier
export interface SpendingTimeline {
  steps: SpendingStepData[];
  lastUpdate: string;
  history: {
    action: string;
    stage: SpendingStage;
    date: string;
    userId: string;
    details?: Record<string, unknown>;
  }[];
}

// Type principal SpendingCase
export interface SpendingCase {
  // Identifiants
  id: string;
  dossierRef: string; // Format ARTI{MM}{YY}{NNNNNN}
  numero: string;

  // Méta-données
  exercice: number;
  directionId: string;
  objet: string;
  demandeurId: string;

  // Montants
  montantEstime: number;
  montantEngage?: number;
  montantLiquide?: number;
  montantOrdonnance?: number;
  montantPaye?: number;

  // État workflow
  currentStage: SpendingStage;
  status: SpendingCaseStatus;
  timeline: SpendingTimeline;

  // Dates
  createdAt: string;
  updatedAt: string;

  // Entités liées (IDs)
  noteSefId?: string;
  noteAefId?: string;
  imputationId?: string;
  passationMarcheId?: string;
  engagementId?: string;
  liquidationId?: string;
  ordonnancementId?: string;
  reglementId?: string;

  // Bénéficiaire
  beneficiaireId?: string;
  beneficiaireNom?: string;
}

// Règles de transition
export interface TransitionRule {
  from: SpendingStage;
  to: SpendingStage;
  condition: (spendingCase: SpendingCase) => boolean;
  requiredRole?: string;
  requiresValidation: boolean;
}

// Définition des transitions valides
export const VALID_TRANSITIONS: TransitionRule[] = [
  {
    from: "note_sef",
    to: "note_aef",
    condition: (sc) => sc.timeline.steps.find(s => s.stage === "note_sef")?.status === "completed",
    requiresValidation: true,
  },
  {
    from: "note_aef",
    to: "imputation",
    condition: (sc) => sc.timeline.steps.find(s => s.stage === "note_aef")?.status === "completed",
    requiredRole: "CB",
    requiresValidation: true,
  },
  {
    from: "imputation",
    to: "passation_marche",
    condition: (sc) => {
      const imputStep = sc.timeline.steps.find(s => s.stage === "imputation");
      // Passation requise si montant > seuil (à configurer)
      return imputStep?.status === "completed" && (sc.montantEstime || 0) >= 5000000;
    },
    requiresValidation: true,
  },
  {
    from: "imputation",
    to: "engagement",
    condition: (sc) => {
      const imputStep = sc.timeline.steps.find(s => s.stage === "imputation");
      // Direct à engagement si montant < seuil ou passation complétée
      const passationStep = sc.timeline.steps.find(s => s.stage === "passation_marche");
      return imputStep?.status === "completed" &&
        ((sc.montantEstime || 0) < 5000000 || passationStep?.status === "completed");
    },
    requiresValidation: true,
  },
  {
    from: "passation_marche",
    to: "engagement",
    condition: (sc) => sc.timeline.steps.find(s => s.stage === "passation_marche")?.status === "completed",
    requiresValidation: true,
  },
  {
    from: "engagement",
    to: "liquidation",
    condition: (sc) => sc.timeline.steps.find(s => s.stage === "engagement")?.status === "completed",
    requiresValidation: true,
  },
  {
    from: "liquidation",
    to: "ordonnancement",
    condition: (sc) => sc.timeline.steps.find(s => s.stage === "liquidation")?.status === "completed",
    requiredRole: "DG",
    requiresValidation: true,
  },
  {
    from: "ordonnancement",
    to: "reglement",
    condition: (sc) => sc.timeline.steps.find(s => s.stage === "ordonnancement")?.status === "completed",
    requiredRole: "TRESORERIE",
    requiresValidation: true,
  },
];

// Helper functions
export function getStageOrder(stage: SpendingStage): number {
  return STAGE_ORDER[stage];
}

export function getNextStage(currentStage: SpendingStage): SpendingStage | null {
  const currentOrder = STAGE_ORDER[currentStage];
  const nextStage = SPENDING_STAGES.find(s => STAGE_ORDER[s] === currentOrder + 1);
  return nextStage || null;
}

export function getPreviousStage(currentStage: SpendingStage): SpendingStage | null {
  const currentOrder = STAGE_ORDER[currentStage];
  const prevStage = SPENDING_STAGES.find(s => STAGE_ORDER[s] === currentOrder - 1);
  return prevStage || null;
}

export function canTransitionTo(
  spendingCase: SpendingCase,
  targetStage: SpendingStage,
  userRole?: string,
  isAdmin = false
): { allowed: boolean; reason?: string } {
  // Admin peut tout faire
  if (isAdmin) {
    return { allowed: true };
  }

  // Trouver la règle de transition
  const rule = VALID_TRANSITIONS.find(
    t => t.from === spendingCase.currentStage && t.to === targetStage
  );

  if (!rule) {
    return {
      allowed: false,
      reason: `Transition de ${spendingCase.currentStage} vers ${targetStage} non autorisée`
    };
  }

  // Vérifier la condition
  if (!rule.condition(spendingCase)) {
    return {
      allowed: false,
      reason: `Conditions non remplies pour passer à ${STAGE_CONFIG[targetStage].label}`
    };
  }

  // Vérifier le rôle si requis
  if (rule.requiredRole && userRole !== rule.requiredRole && userRole !== "ADMIN") {
    return {
      allowed: false,
      reason: `Rôle ${rule.requiredRole} requis pour cette action`
    };
  }

  return { allowed: true };
}

export function getStageStatus(
  spendingCase: SpendingCase,
  stage: SpendingStage
): StepStatus {
  const stepData = spendingCase.timeline.steps.find(s => s.stage === stage);
  return stepData?.status || "pending";
}

export function isStageComplete(
  spendingCase: SpendingCase,
  stage: SpendingStage
): boolean {
  const status = getStageStatus(spendingCase, stage);
  return status === "completed" || status === "skipped";
}

export function getCompletedStages(spendingCase: SpendingCase): SpendingStage[] {
  return SPENDING_STAGES.filter(stage => isStageComplete(spendingCase, stage));
}

export function getSpendingProgress(spendingCase: SpendingCase): number {
  const completed = getCompletedStages(spendingCase).length;
  return Math.round((completed / SPENDING_STAGES.length) * 100);
}
