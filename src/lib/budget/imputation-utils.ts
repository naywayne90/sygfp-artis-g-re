/**
 * Utilitaires pour la gestion des imputations budgétaires
 *
 * Source unique pour le split et la validation des imputations
 * Utilisé partout : exports, affichages, validations
 */

// ============================================================================
// Types
// ============================================================================

export interface SplitImputationResult {
  /** 10 premiers caractères de l'imputation */
  imputation_10: string;
  /** Reste de l'imputation après les 10 premiers caractères */
  imputation_suite: string;
  /** Imputation complète originale */
  imputation_complete: string;
  /** Si l'imputation est valide (non vide) */
  isValid: boolean;
}

export interface ImputationSegments {
  /** Objectif Stratégique */
  os?: string;
  /** Code Mission */
  mission?: string;
  /** Code Action */
  action?: string;
  /** Code Activité */
  activite?: string;
  /** Code Sous-Activité */
  sousActivite?: string;
  /** Nature Budgétaire Économique */
  nbe?: string;
  /** Code SYSCO (comptable) */
  sysco?: string;
}

export interface ParsedImputation {
  segments: ImputationSegments;
  code: string;
  readable: string;
  isComplete: boolean;
}

export interface ImputationValidationResult {
  isValid: boolean;
  isFoundInBudget: boolean;
  warnings: string[];
  errors: string[];
  budgetLineId?: string;
  budgetLineCode?: string;
  budgetLineLabel?: string;
  disponible?: number;
}

// ============================================================================
// Fonctions de split
// ============================================================================

/**
 * Divise une imputation en deux parties : 10 premiers caractères et le reste
 *
 * @param imputation_complete - L'imputation complète à diviser
 * @returns Objet contenant imputation_10, imputation_suite, et métadonnées
 *
 * @example
 * splitImputation("OS01-ACT02-ACT03-SOU04-NBE05")
 * // => { imputation_10: "OS01-ACT02", imputation_suite: "-ACT03-SOU04-NBE05", ... }
 */
export function splitImputation(imputation_complete: string | null | undefined): SplitImputationResult {
  const clean = (imputation_complete || "").trim();

  if (!clean) {
    return {
      imputation_10: "-",
      imputation_suite: "-",
      imputation_complete: "",
      isValid: false,
    };
  }

  return {
    imputation_10: clean.substring(0, 10) || "-",
    imputation_suite: clean.substring(10) || "-",
    imputation_complete: clean,
    isValid: true,
  };
}

/**
 * Formate une imputation pour l'affichage (avec troncature optionnelle)
 *
 * @param imputation - L'imputation à formater
 * @param maxLength - Longueur maximale (défaut: pas de limite)
 * @returns Imputation formatée avec ellipsis si tronquée
 */
export function formatImputation(
  imputation: string | null | undefined,
  maxLength?: number
): string {
  const clean = (imputation || "").trim();

  if (!clean) return "-";

  if (maxLength && clean.length > maxLength) {
    return clean.substring(0, maxLength - 3) + "...";
  }

  return clean;
}

/**
 * Formate une imputation en deux lignes pour l'affichage tableau
 *
 * @param imputation - L'imputation à formater
 * @returns Objet avec ligne1 (10 car) et ligne2 (reste)
 */
export function formatImputationTwoLines(imputation: string | null | undefined): {
  ligne1: string;
  ligne2: string;
} {
  const { imputation_10, imputation_suite } = splitImputation(imputation);
  return {
    ligne1: imputation_10,
    ligne2: imputation_suite,
  };
}

// ============================================================================
// Fonctions de parsing
// ============================================================================

/**
 * Parse une imputation au format standard ARTI
 * Format attendu: [OS]-[Mission]-[Action]-[Activité]-[Sous-Activité]-[NBE]-[SYSCO]
 *
 * @param imputation - L'imputation à parser
 * @returns Objet avec segments identifiés
 */
export function parseImputation(imputation: string | null | undefined): ParsedImputation {
  const clean = (imputation || "").trim();

  if (!clean) {
    return {
      segments: {},
      code: "",
      readable: "-",
      isComplete: false,
    };
  }

  // Essayer de parser le format standard avec tirets
  const parts = clean.split("-").filter(Boolean);

  const segments: ImputationSegments = {};

  // Attribution basée sur la position et les préfixes connus
  parts.forEach((part, index) => {
    const upperPart = part.toUpperCase();

    if (upperPart.startsWith("OS") || index === 0) {
      segments.os = part;
    } else if (upperPart.startsWith("MIS") || index === 1) {
      segments.mission = part;
    } else if (upperPart.startsWith("ACT") && !segments.action) {
      segments.action = part;
    } else if (upperPart.startsWith("ACT") && segments.action && !segments.activite) {
      segments.activite = part;
    } else if (upperPart.startsWith("SOU") || upperPart.startsWith("SA")) {
      segments.sousActivite = part;
    } else if (upperPart.startsWith("NBE") || upperPart.match(/^\d{3,}/)) {
      segments.nbe = part;
    } else if (upperPart.startsWith("SYS") || upperPart.startsWith("CPT")) {
      segments.sysco = part;
    }
  });

  // Construire la version lisible
  const readableParts: string[] = [];
  if (segments.os) readableParts.push(`OS: ${segments.os}`);
  if (segments.action) readableParts.push(`Action: ${segments.action}`);
  if (segments.activite) readableParts.push(`Activité: ${segments.activite}`);
  if (segments.sousActivite) readableParts.push(`SA: ${segments.sousActivite}`);
  if (segments.nbe) readableParts.push(`NBE: ${segments.nbe}`);
  if (segments.sysco) readableParts.push(`SYSCO: ${segments.sysco}`);

  const isComplete = !!(
    segments.os &&
    segments.action &&
    (segments.nbe || segments.sysco)
  );

  return {
    segments,
    code: clean,
    readable: readableParts.length > 0 ? readableParts.join(" > ") : clean,
    isComplete,
  };
}

// ============================================================================
// Fonctions de construction
// ============================================================================

/**
 * Construit une imputation complète à partir des segments
 *
 * @param segments - Les segments de l'imputation
 * @param separator - Séparateur entre segments (défaut: "-")
 * @returns L'imputation construite
 */
export function buildImputation(
  segments: ImputationSegments,
  separator: string = "-"
): string {
  const parts: string[] = [];

  if (segments.os) parts.push(segments.os);
  if (segments.mission) parts.push(segments.mission);
  if (segments.action) parts.push(segments.action);
  if (segments.activite) parts.push(segments.activite);
  if (segments.sousActivite) parts.push(segments.sousActivite);
  if (segments.nbe) parts.push(segments.nbe);
  if (segments.sysco) parts.push(segments.sysco);

  return parts.join(separator) || "-";
}

/**
 * Construit une imputation à partir d'une ligne budgétaire
 *
 * @param budgetLine - Objet ligne budgétaire avec les relations
 * @returns L'imputation construite
 */
export function buildImputationFromBudgetLine(budgetLine: {
  code?: string;
  objectif_strategique?: { code?: string } | null;
  action?: { code?: string } | null;
  activite?: { code?: string } | null;
  sous_activite?: { code?: string } | null;
  nbe?: { code?: string } | null;
  sysco?: { code?: string } | null;
}): string {
  // Si un code direct existe, l'utiliser
  if (budgetLine.code) {
    return budgetLine.code;
  }

  // Sinon, construire à partir des relations
  return buildImputation({
    os: budgetLine.objectif_strategique?.code,
    action: budgetLine.action?.code,
    activite: budgetLine.activite?.code,
    sousActivite: budgetLine.sous_activite?.code,
    nbe: budgetLine.nbe?.code,
    sysco: budgetLine.sysco?.code,
  });
}

// ============================================================================
// Fonctions de comparaison
// ============================================================================

/**
 * Compare deux imputations pour vérifier si elles correspondent
 *
 * @param imputation1 - Première imputation
 * @param imputation2 - Deuxième imputation
 * @param strict - Si true, comparaison exacte. Si false, comparaison partielle
 * @returns true si les imputations correspondent
 */
export function compareImputations(
  imputation1: string | null | undefined,
  imputation2: string | null | undefined,
  strict: boolean = false
): boolean {
  const clean1 = (imputation1 || "").trim().toUpperCase().replace(/\s+/g, "");
  const clean2 = (imputation2 || "").trim().toUpperCase().replace(/\s+/g, "");

  if (!clean1 || !clean2) return false;

  if (strict) {
    return clean1 === clean2;
  }

  // Comparaison partielle: l'un contient l'autre ou préfixe commun
  return (
    clean1.startsWith(clean2) ||
    clean2.startsWith(clean1) ||
    clean1.includes(clean2) ||
    clean2.includes(clean1)
  );
}

/**
 * Vérifie si une imputation correspond à une ligne budgétaire
 *
 * @param imputation - L'imputation à vérifier
 * @param budgetLineCode - Le code de la ligne budgétaire
 * @returns true si correspondance trouvée
 */
export function matchesbudgetLine(
  imputation: string | null | undefined,
  budgetLineCode: string | null | undefined
): boolean {
  return compareImputations(imputation, budgetLineCode, false);
}

// ============================================================================
// Export par défaut pour utilisation simplifiée
// ============================================================================

export default {
  splitImputation,
  formatImputation,
  formatImputationTwoLines,
  parseImputation,
  buildImputation,
  buildImputationFromBudgetLine,
  compareImputations,
  matchesbudgetLine,
};
