/**
 * SYGFP - Configuration Centrale Unique
 * =======================================
 * Ce fichier définit TOUTES les constantes, statuts, étapes, couleurs et badges
 * utilisés dans l'application SYGFP (ARTI).
 * 
 * RÈGLE D'OR : Toute modification de vocabulaire, statut ou badge doit se faire ICI.
 */

import {
  FileText,
  FileEdit,
  Tag,
  Briefcase,
  ShoppingCart,
  CreditCard,
  Receipt,
  FileCheck,
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  Send,
  AlertTriangle,
  Lock,
  FileOutput,
  type LucideIcon,
} from "lucide-react";

// ============================================
// 1. ÉTAPES DE LA CHAÎNE DE LA DÉPENSE
// ============================================

/**
 * Les 9 étapes de la chaîne de la dépense (ordre strictement séquentiel)
 */
export const ETAPES_CHAINE_DEPENSE = {
  NOTE_SEF: 'note_sef',
  NOTE_AEF: 'note_aef',
  IMPUTATION: 'imputation',
  EXPRESSION_BESOIN: 'expression_besoin',
  PASSATION_MARCHE: 'passation_marche',
  ENGAGEMENT: 'engagement',
  LIQUIDATION: 'liquidation',
  ORDONNANCEMENT: 'ordonnancement',
  REGLEMENT: 'reglement',
} as const;

export type EtapeChaineType = typeof ETAPES_CHAINE_DEPENSE[keyof typeof ETAPES_CHAINE_DEPENSE];

export interface EtapeConfig {
  code: EtapeChaineType;
  numero: number;
  label: string;
  labelCourt: string;
  description: string;
  icon: LucideIcon;
  url: string;
  color: string; // Classe Tailwind pour la couleur thématique
}

export const ETAPES_CONFIG: Record<EtapeChaineType, EtapeConfig> = {
  [ETAPES_CHAINE_DEPENSE.NOTE_SEF]: {
    code: ETAPES_CHAINE_DEPENSE.NOTE_SEF,
    numero: 1,
    label: "Note SEF",
    labelCourt: "SEF",
    description: "Sans Effet Financier",
    icon: FileText,
    url: "/notes-sef",
    color: "text-slate-600",
  },
  [ETAPES_CHAINE_DEPENSE.NOTE_AEF]: {
    code: ETAPES_CHAINE_DEPENSE.NOTE_AEF,
    numero: 2,
    label: "Note AEF",
    labelCourt: "AEF",
    description: "Avec Effet Financier",
    icon: FileEdit,
    url: "/notes-aef",
    color: "text-blue-600",
  },
  [ETAPES_CHAINE_DEPENSE.IMPUTATION]: {
    code: ETAPES_CHAINE_DEPENSE.IMPUTATION,
    numero: 3,
    label: "Imputation",
    labelCourt: "Imput.",
    description: "Imputation budgétaire",
    icon: Tag,
    url: "/execution/imputation",
    color: "text-violet-600",
  },
  [ETAPES_CHAINE_DEPENSE.EXPRESSION_BESOIN]: {
    code: ETAPES_CHAINE_DEPENSE.EXPRESSION_BESOIN,
    numero: 4,
    label: "Expression Besoin",
    labelCourt: "EB",
    description: "Formalisation du besoin",
    icon: Briefcase,
    url: "/execution/expression-besoin",
    color: "text-indigo-600",
  },
  [ETAPES_CHAINE_DEPENSE.PASSATION_MARCHE]: {
    code: ETAPES_CHAINE_DEPENSE.PASSATION_MARCHE,
    numero: 5,
    label: "Passation Marché",
    labelCourt: "PM",
    description: "Procédure si montant > seuil",
    icon: ShoppingCart,
    url: "/marches",
    color: "text-pink-600",
  },
  [ETAPES_CHAINE_DEPENSE.ENGAGEMENT]: {
    code: ETAPES_CHAINE_DEPENSE.ENGAGEMENT,
    numero: 6,
    label: "Engagement",
    labelCourt: "Eng.",
    description: "Réservation des crédits",
    icon: CreditCard,
    url: "/engagements",
    color: "text-emerald-600",
  },
  [ETAPES_CHAINE_DEPENSE.LIQUIDATION]: {
    code: ETAPES_CHAINE_DEPENSE.LIQUIDATION,
    numero: 7,
    label: "Liquidation",
    labelCourt: "Liq.",
    description: "Constatation service fait",
    icon: Receipt,
    url: "/liquidations",
    color: "text-amber-600",
  },
  [ETAPES_CHAINE_DEPENSE.ORDONNANCEMENT]: {
    code: ETAPES_CHAINE_DEPENSE.ORDONNANCEMENT,
    numero: 8,
    label: "Ordonnancement",
    labelCourt: "Ordo.",
    description: "Ordre de paiement",
    icon: FileCheck,
    url: "/ordonnancements",
    color: "text-cyan-600",
  },
  [ETAPES_CHAINE_DEPENSE.REGLEMENT]: {
    code: ETAPES_CHAINE_DEPENSE.REGLEMENT,
    numero: 9,
    label: "Règlement",
    labelCourt: "Règl.",
    description: "Paiement effectif",
    icon: Banknote,
    url: "/reglements",
    color: "text-green-600",
  },
};

// Helper pour obtenir la liste ordonnée des étapes
export const ETAPES_ORDONNEES = Object.values(ETAPES_CONFIG).sort((a, b) => a.numero - b.numero);

// ============================================
// 2. STATUTS UNIFIÉS
// ============================================

/**
 * Statuts universels utilisés dans toute l'application
 * Harmonisés entre tous les modules
 */
export const STATUTS = {
  // États initiaux
  BROUILLON: 'brouillon',
  
  // États de workflow
  SOUMIS: 'soumis',
  EN_ATTENTE: 'en_attente',
  EN_VALIDATION: 'a_valider',
  EN_COURS: 'en_cours',
  EN_SIGNATURE: 'en_signature',
  
  // États spécifiques
  A_IMPUTER: 'a_imputer',
  IMPUTE: 'impute',
  TRANSMIS: 'transmis',
  
  // États de résolution
  VALIDE: 'valide',
  SIGNE: 'signe',
  PAYE: 'paye',
  SOLDE: 'solde',
  CLOTURE: 'cloture',
  
  // États négatifs
  DIFFERE: 'differe',
  REJETE: 'rejete',
  BLOQUE: 'bloque',
  ANNULE: 'annule',
} as const;

export type StatutType = typeof STATUTS[keyof typeof STATUTS];

// ============================================
// 3. CONFIGURATION DES BADGES DE STATUT
// ============================================

export interface BadgeConfig {
  label: string;
  className: string;
  icon: LucideIcon;
  category: 'neutral' | 'info' | 'warning' | 'success' | 'error' | 'primary';
}

/**
 * Configuration visuelle centralisée pour tous les badges de statut
 * Accessible via getStatutBadge(statut)
 */
export const STATUT_BADGES: Record<StatutType, BadgeConfig> = {
  // États initiaux - Neutre
  [STATUTS.BROUILLON]: {
    label: "Brouillon",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
    icon: FileEdit,
    category: 'neutral',
  },
  
  // États de workflow - Info/Warning
  [STATUTS.SOUMIS]: {
    label: "Soumis",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: Send,
    category: 'info',
  },
  [STATUTS.EN_ATTENTE]: {
    label: "En attente",
    className: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
    category: 'warning',
  },
  [STATUTS.EN_VALIDATION]: {
    label: "À valider",
    className: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
    category: 'warning',
  },
  [STATUTS.EN_COURS]: {
    label: "En cours",
    className: "bg-secondary/10 text-secondary border-secondary/20",
    icon: Clock,
    category: 'info',
  },
  [STATUTS.EN_SIGNATURE]: {
    label: "En signature",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: FileOutput,
    category: 'warning',
  },
  
  // États spécifiques - Primary
  [STATUTS.A_IMPUTER]: {
    label: "À imputer",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: Tag,
    category: 'primary',
  },
  [STATUTS.IMPUTE]: {
    label: "Imputé",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: CheckCircle,
    category: 'primary',
  },
  [STATUTS.TRANSMIS]: {
    label: "Transmis",
    className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    icon: Send,
    category: 'info',
  },
  
  // États de résolution - Success
  [STATUTS.VALIDE]: {
    label: "Validé",
    className: "bg-success/10 text-success border-success/20",
    icon: CheckCircle,
    category: 'success',
  },
  [STATUTS.SIGNE]: {
    label: "Signé",
    className: "bg-success/10 text-success border-success/20",
    icon: CheckCircle,
    category: 'success',
  },
  [STATUTS.PAYE]: {
    label: "Payé",
    className: "bg-success/10 text-success border-success/20",
    icon: Banknote,
    category: 'success',
  },
  [STATUTS.SOLDE]: {
    label: "Soldé",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    icon: CheckCircle,
    category: 'success',
  },
  [STATUTS.CLOTURE]: {
    label: "Clôturé",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    icon: Lock,
    category: 'success',
  },
  
  // États négatifs - Error/Warning
  [STATUTS.DIFFERE]: {
    label: "Différé",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    icon: PauseCircle,
    category: 'warning',
  },
  [STATUTS.REJETE]: {
    label: "Rejeté",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
    category: 'error',
  },
  [STATUTS.BLOQUE]: {
    label: "Bloqué",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle,
    category: 'error',
  },
  [STATUTS.ANNULE]: {
    label: "Annulé",
    className: "bg-muted text-muted-foreground border-muted-foreground/20 line-through",
    icon: XCircle,
    category: 'neutral',
  },
};

/**
 * Obtient la configuration du badge pour un statut donné
 * Fallback sur un badge neutre si statut inconnu
 */
export function getStatutBadge(statut: string | null | undefined): BadgeConfig {
  if (!statut) {
    return STATUT_BADGES[STATUTS.BROUILLON];
  }
  
  // Normaliser le statut (lowercase, trim)
  const normalized = statut.toLowerCase().trim();
  
  // Chercher une correspondance exacte
  const exactMatch = STATUT_BADGES[normalized as StatutType];
  if (exactMatch) return exactMatch;
  
  // Fallback par préfixe/pattern
  if (normalized.includes('attente') || normalized.includes('pending')) {
    return STATUT_BADGES[STATUTS.EN_ATTENTE];
  }
  if (normalized.includes('valid') || normalized.includes('approuv')) {
    return STATUT_BADGES[STATUTS.VALIDE];
  }
  if (normalized.includes('rejet') || normalized.includes('refuse')) {
    return STATUT_BADGES[STATUTS.REJETE];
  }
  if (normalized.includes('cours') || normalized.includes('progress')) {
    return STATUT_BADGES[STATUTS.EN_COURS];
  }
  
  // Fallback final
  return {
    label: statut,
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
    icon: Clock,
    category: 'neutral',
  };
}

// ============================================
// 4. CONFIGURATION DES KPI PAR ÉTAPE
// ============================================

export interface KPIConfig {
  etape: EtapeChaineType;
  // Statuts comptés comme "à traiter"
  statutsATraiter: string[];
  // Statuts comptés comme "en cours"
  statutsEnCours: string[];
  // Statuts comptés comme "validés/terminés"
  statutsTermines: string[];
  // Table Supabase source
  table: string;
  // Champ exercice (si applicable)
  champExercice?: string;
}

export const KPI_CONFIG: Record<string, KPIConfig> = {
  notes_sef: {
    etape: ETAPES_CHAINE_DEPENSE.NOTE_SEF,
    statutsATraiter: [STATUTS.SOUMIS, STATUTS.EN_VALIDATION],
    statutsEnCours: [STATUTS.EN_COURS, STATUTS.DIFFERE],
    statutsTermines: [STATUTS.VALIDE, STATUTS.REJETE],
    table: 'notes_sef',
    champExercice: 'exercice',
  },
  notes_aef: {
    etape: ETAPES_CHAINE_DEPENSE.NOTE_AEF,
    statutsATraiter: [STATUTS.SOUMIS, STATUTS.EN_VALIDATION, STATUTS.A_IMPUTER],
    statutsEnCours: [STATUTS.EN_COURS, STATUTS.DIFFERE],
    statutsTermines: [STATUTS.IMPUTE, STATUTS.REJETE],
    table: 'notes_dg',
    champExercice: 'exercice',
  },
  engagements: {
    etape: ETAPES_CHAINE_DEPENSE.ENGAGEMENT,
    statutsATraiter: [STATUTS.SOUMIS, STATUTS.EN_ATTENTE],
    statutsEnCours: [STATUTS.EN_COURS, STATUTS.DIFFERE],
    statutsTermines: [STATUTS.VALIDE, STATUTS.REJETE],
    table: 'budget_engagements',
    champExercice: 'exercice',
  },
  liquidations: {
    etape: ETAPES_CHAINE_DEPENSE.LIQUIDATION,
    statutsATraiter: [STATUTS.SOUMIS, STATUTS.EN_ATTENTE],
    statutsEnCours: [STATUTS.EN_COURS, STATUTS.DIFFERE],
    statutsTermines: [STATUTS.VALIDE, STATUTS.REJETE],
    table: 'budget_liquidations',
    champExercice: 'exercice',
  },
  ordonnancements: {
    etape: ETAPES_CHAINE_DEPENSE.ORDONNANCEMENT,
    statutsATraiter: [STATUTS.SOUMIS, STATUTS.EN_ATTENTE, STATUTS.EN_SIGNATURE],
    statutsEnCours: [STATUTS.EN_COURS, STATUTS.DIFFERE],
    statutsTermines: [STATUTS.VALIDE, STATUTS.SIGNE, STATUTS.REJETE],
    table: 'ordonnancements',
    champExercice: 'exercice',
  },
  reglements: {
    etape: ETAPES_CHAINE_DEPENSE.REGLEMENT,
    statutsATraiter: [STATUTS.EN_ATTENTE],
    statutsEnCours: [STATUTS.EN_COURS],
    statutsTermines: [STATUTS.PAYE, STATUTS.ANNULE],
    table: 'reglements',
    champExercice: 'exercice',
  },
  marches: {
    etape: ETAPES_CHAINE_DEPENSE.PASSATION_MARCHE,
    statutsATraiter: [STATUTS.SOUMIS, STATUTS.EN_VALIDATION],
    statutsEnCours: [STATUTS.EN_COURS, 'publication', 'depouillement', 'attribution'],
    statutsTermines: ['attribue', 'termine', STATUTS.ANNULE],
    table: 'marches',
  },
};

// ============================================
// 5. CATÉGORIES DE STATUTS (pour filtres UI)
// ============================================

export const STATUT_CATEGORIES = {
  TOUS: 'tous',
  A_TRAITER: 'a_traiter',
  EN_COURS: 'en_cours',
  TERMINES: 'termines',
  BLOQUES: 'bloques',
} as const;

export type StatutCategoryType = typeof STATUT_CATEGORIES[keyof typeof STATUT_CATEGORIES];

export const STATUT_CATEGORY_LABELS: Record<StatutCategoryType, string> = {
  [STATUT_CATEGORIES.TOUS]: "Tous",
  [STATUT_CATEGORIES.A_TRAITER]: "À traiter",
  [STATUT_CATEGORIES.EN_COURS]: "En cours",
  [STATUT_CATEGORIES.TERMINES]: "Terminés",
  [STATUT_CATEGORIES.BLOQUES]: "Bloqués",
};

// ============================================
// 6. FORMATAGE DES MONTANTS
// ============================================

export function formatMontant(montant: number | null | undefined, showCurrency = true): string {
  if (montant === null || montant === undefined) return "0";
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
  return showCurrency ? formatted + " FCFA" : formatted;
}

export function formatMontantCompact(montant: number | null | undefined): string {
  if (montant === null || montant === undefined) return "0";
  
  if (montant >= 1_000_000_000) {
    return `${(montant / 1_000_000_000).toFixed(1)} Mds`;
  }
  if (montant >= 1_000_000) {
    return `${(montant / 1_000_000).toFixed(1)} M`;
  }
  if (montant >= 1_000) {
    return `${(montant / 1_000).toFixed(0)} K`;
  }
  return montant.toFixed(0);
}

/** Version numérique simple sans devise */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat('fr-FR').format(value);
}

// ============================================
// 7. DATES
// ============================================

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
