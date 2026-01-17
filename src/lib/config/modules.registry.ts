/**
 * SYGFP - Registre Centralisé des Modules
 * 
 * Source unique de vérité pour :
 * - Routes disponibles
 * - Permissions par module
 * - Icônes et labels
 * - Statut de développement
 * 
 * @version 1.0
 * @date 2026-01-17
 */

import {
  Search,
  FileText,
  ShoppingCart,
  CreditCard,
  Receipt,
  FileCheck,
  Wallet,
  BarChart3,
  Home,
  Settings,
  Users,
  Target,
  Calendar,
  Briefcase,
  ClipboardList,
  Tag,
  Landmark,
  Building2,
  FileSignature,
  Archive,
  DollarSign,
  Truck,
  Shield,
  Lock,
  UserCog,
  BookOpen,
  Hash,
  Database,
  Layers,
  ArrowRightLeft,
  FileUp,
  History,
  Cog,
  FileEdit,
  Banknote,
  TrendingUp,
  Copy,
  Bell,
  AlertTriangle,
  User,
  type LucideIcon,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type ModuleStatus = "ready" | "beta" | "todo" | "deprecated";

export type ModuleCategory =
  | "accueil"
  | "chaine"
  | "budget"
  | "partenaires"
  | "gestion"
  | "execution"
  | "rapports"
  | "admin"
  | "outils";

export interface ModuleConfig {
  id: string;
  label: string;
  labelShort?: string;
  route: string;
  icon: LucideIcon;
  permissions: string[]; // Rôles autorisés (vide = tous)
  status: ModuleStatus;
  category: ModuleCategory;
  order: number;
  step?: number; // Pour les étapes de la chaîne de dépense
  description?: string;
  tables?: string[]; // Tables DB associées
  parentId?: string; // Pour sous-menus
  hidden?: boolean; // Masqué dans la sidebar
  badgeKey?: string; // Clé pour afficher un badge de compteur
}

// ============================================
// REGISTRE DES MODULES
// ============================================

export const MODULES_REGISTRY: Record<string, ModuleConfig> = {
  // ========== ACCUEIL ==========
  dashboard: {
    id: "dashboard",
    label: "Tableau de bord",
    route: "/",
    icon: Home,
    permissions: [],
    status: "ready",
    category: "accueil",
    order: 1,
    tables: ["dossiers", "budget_engagements", "budget_liquidations"],
  },
  recherche: {
    id: "recherche",
    label: "Recherche Dossier",
    route: "/recherche",
    icon: Search,
    permissions: [],
    status: "ready",
    category: "accueil",
    order: 2,
    tables: ["dossiers", "dossier_etapes"],
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    route: "/notifications",
    icon: Bell,
    permissions: [],
    status: "ready",
    category: "accueil",
    order: 3,
    hidden: true,
    tables: ["notifications"],
  },
  alertes: {
    id: "alertes",
    label: "Alertes",
    route: "/alertes",
    icon: AlertTriangle,
    permissions: [],
    status: "ready",
    category: "accueil",
    order: 4,
    hidden: true,
    tables: ["alerts"],
  },
  taches: {
    id: "taches",
    label: "Mes Tâches",
    route: "/taches",
    icon: ClipboardList,
    permissions: [],
    status: "ready",
    category: "accueil",
    order: 5,
    hidden: true,
    tables: ["workflow_tasks"],
  },
  "mon-profil": {
    id: "mon-profil",
    label: "Mon Profil",
    route: "/mon-profil",
    icon: User,
    permissions: [],
    status: "ready",
    category: "accueil",
    order: 6,
    hidden: true,
    tables: ["profiles"],
  },

  // ========== CHAÎNE DE LA DÉPENSE ==========
  "notes-sef": {
    id: "notes-sef",
    label: "Notes SEF",
    labelShort: "SEF",
    route: "/notes-sef",
    icon: FileText,
    permissions: [],
    status: "ready",
    category: "chaine",
    order: 1,
    step: 1,
    description: "Sans Engagement Financier",
    tables: ["notes_sef"],
    badgeKey: "notesSEFAValider",
  },
  "notes-aef": {
    id: "notes-aef",
    label: "Notes AEF",
    labelShort: "AEF",
    route: "/notes-aef",
    icon: FileEdit,
    permissions: [],
    status: "ready",
    category: "chaine",
    order: 2,
    step: 2,
    description: "Avec Engagement Financier",
    tables: ["notes_dg"],
    badgeKey: "notesAEFAValider",
  },
  imputation: {
    id: "imputation",
    label: "Imputation",
    route: "/execution/imputation",
    icon: Tag,
    permissions: [],
    status: "ready",
    category: "chaine",
    order: 3,
    step: 3,
    description: "Imputation budgétaire",
    tables: ["imputations", "notes_dg"],
    badgeKey: "notesAImputer",
  },
  "expression-besoin": {
    id: "expression-besoin",
    label: "Expression Besoin",
    route: "/execution/expression-besoin",
    icon: Briefcase,
    permissions: [],
    status: "ready",
    category: "chaine",
    order: 4,
    step: 4,
    description: "Formalisation du besoin",
    tables: ["expressions_besoin"],
    badgeKey: "expressionsAValider",
  },
  marches: {
    id: "marches",
    label: "Passation Marché",
    route: "/marches",
    icon: ShoppingCart,
    permissions: [],
    status: "ready",
    category: "chaine",
    order: 5,
    step: 5,
    description: "Si montant > seuil",
    tables: ["marches", "passation_marche"],
    badgeKey: "marchesEnCours",
  },
  engagements: {
    id: "engagements",
    label: "Engagement",
    route: "/engagements",
    icon: CreditCard,
    permissions: [],
    status: "ready",
    category: "chaine",
    order: 6,
    step: 6,
    description: "Réservation crédits",
    tables: ["budget_engagements"],
    badgeKey: "engagementsAValider",
  },
  liquidations: {
    id: "liquidations",
    label: "Liquidation",
    route: "/liquidations",
    icon: Receipt,
    permissions: [],
    status: "ready",
    category: "chaine",
    order: 7,
    step: 7,
    description: "Constatation service fait",
    tables: ["budget_liquidations"],
    badgeKey: "liquidationsAValider",
  },
  ordonnancements: {
    id: "ordonnancements",
    label: "Ordonnancement",
    route: "/ordonnancements",
    icon: FileCheck,
    permissions: [],
    status: "ready",
    category: "chaine",
    order: 8,
    step: 8,
    description: "Ordre de paiement",
    tables: ["ordonnancements"],
    badgeKey: "ordonnancementsAValider",
  },
  reglements: {
    id: "reglements",
    label: "Règlement",
    route: "/reglements",
    icon: Banknote,
    permissions: [],
    status: "ready",
    category: "chaine",
    order: 9,
    step: 9,
    description: "Paiement effectif",
    tables: ["reglements"],
    badgeKey: "reglementsEnAttente",
  },

  // ========== BUDGET ==========
  "planification-structure": {
    id: "planification-structure",
    label: "Structure Budgétaire",
    route: "/planification/structure",
    icon: Wallet,
    permissions: ["ADMIN", "DAAF", "CB"],
    status: "ready",
    category: "budget",
    order: 1,
    tables: ["budget_lines"],
  },
  "planification-travail": {
    id: "planification-travail",
    label: "Plan de Travail",
    route: "/planification/plan-travail",
    icon: ClipboardList,
    permissions: ["ADMIN", "DAAF", "CB"],
    status: "ready",
    category: "budget",
    order: 2,
    tables: ["budget_activities"],
  },
  "planification-virements": {
    id: "planification-virements",
    label: "Virements & Ajustements",
    route: "/planification/virements",
    icon: ArrowRightLeft,
    permissions: ["ADMIN", "DAAF", "CB"],
    status: "ready",
    category: "budget",
    order: 3,
    tables: ["credit_transfers"],
    badgeKey: "virementsEnAttente",
  },
  "planification-import-export": {
    id: "planification-import-export",
    label: "Import / Export",
    route: "/planification/import-export",
    icon: FileUp,
    permissions: ["ADMIN", "DAAF", "CB"],
    status: "ready",
    category: "budget",
    order: 4,
    tables: ["budget_imports"],
  },
  "planification-historique": {
    id: "planification-historique",
    label: "Historique Imports",
    route: "/planification/historique-imports",
    icon: History,
    permissions: ["ADMIN", "DAAF", "CB"],
    status: "ready",
    category: "budget",
    order: 5,
    tables: ["budget_imports"],
  },
  "planification-import-admin": {
    id: "planification-import-admin",
    label: "Import Budget (Admin)",
    route: "/admin/import-budget",
    icon: Database,
    permissions: ["ADMIN"],
    status: "ready",
    category: "budget",
    order: 6,
    tables: ["budget_lines"],
  },

  // ========== PARTENAIRES ==========
  prestataires: {
    id: "prestataires",
    label: "Prestataires",
    route: "/contractualisation/prestataires",
    icon: Building2,
    permissions: [],
    status: "ready",
    category: "partenaires",
    order: 1,
    tables: ["prestataires"],
  },
  contrats: {
    id: "contrats",
    label: "Contrats",
    route: "/contractualisation/contrats",
    icon: FileSignature,
    permissions: [],
    status: "ready",
    category: "partenaires",
    order: 2,
    tables: ["contrats"],
  },

  // ========== GESTION ==========
  approvisionnement: {
    id: "approvisionnement",
    label: "Approvisionnement",
    route: "/approvisionnement",
    icon: Truck,
    permissions: [],
    status: "ready",
    category: "gestion",
    order: 1,
    tables: ["articles", "mouvements_stock"],
  },
  tresorerie: {
    id: "tresorerie",
    label: "Trésorerie",
    route: "/tresorerie",
    icon: Landmark,
    permissions: ["ADMIN", "DAAF", "CB", "TRESORIER"],
    status: "ready",
    category: "gestion",
    order: 2,
    tables: ["comptes_bancaires", "tresorerie"],
  },
  recettes: {
    id: "recettes",
    label: "Recettes",
    route: "/recettes",
    icon: DollarSign,
    permissions: ["ADMIN", "DAAF", "CB", "REGISSEUR"],
    status: "ready",
    category: "gestion",
    order: 3,
    tables: ["recettes"],
  },
  "comptabilite-matiere": {
    id: "comptabilite-matiere",
    label: "Comptabilité Matière",
    route: "/contractualisation/comptabilite-matiere",
    icon: Archive,
    permissions: [],
    status: "ready",
    category: "gestion",
    order: 4,
    tables: ["articles"],
  },

  // ========== EXÉCUTION ==========
  "execution-dashboard": {
    id: "execution-dashboard",
    label: "Tableau de bord",
    route: "/execution/dashboard",
    icon: TrendingUp,
    permissions: [],
    status: "ready",
    category: "execution",
    order: 1,
  },
  "execution-engagements": {
    id: "execution-engagements",
    label: "Engagements",
    route: "/engagements",
    icon: CreditCard,
    permissions: [],
    status: "ready",
    category: "execution",
    order: 2,
    badgeKey: "engagementsAValider",
  },
  "execution-liquidations": {
    id: "execution-liquidations",
    label: "Liquidations",
    route: "/liquidations",
    icon: Receipt,
    permissions: [],
    status: "ready",
    category: "execution",
    order: 3,
    badgeKey: "liquidationsAValider",
  },
  "execution-ordonnancements": {
    id: "execution-ordonnancements",
    label: "Ordonnancements",
    route: "/ordonnancements",
    icon: FileCheck,
    permissions: [],
    status: "ready",
    category: "execution",
    order: 4,
    badgeKey: "ordonnancementsAValider",
  },
  "execution-reglements": {
    id: "execution-reglements",
    label: "Règlements",
    route: "/reglements",
    icon: Banknote,
    permissions: [],
    status: "ready",
    category: "execution",
    order: 5,
  },

  // ========== RAPPORTS ==========
  "etats-execution": {
    id: "etats-execution",
    label: "États d'exécution",
    route: "/etats-execution",
    icon: BarChart3,
    permissions: [],
    status: "ready",
    category: "rapports",
    order: 1,
  },
  "alertes-budgetaires": {
    id: "alertes-budgetaires",
    label: "Alertes Budgétaires",
    route: "/alertes-budgetaires",
    icon: Target,
    permissions: [],
    status: "ready",
    category: "rapports",
    order: 2,
    tables: ["budg_alerts", "budg_alert_rules"],
  },

  // ========== ADMIN - RÉFÉRENTIELS ==========
  "admin-exercices": {
    id: "admin-exercices",
    label: "Exercices Budgétaires",
    route: "/admin/exercices",
    icon: Calendar,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 1,
    tables: ["exercices"],
  },
  "admin-parametres-prog": {
    id: "admin-parametres-prog",
    label: "Paramètres Programmatiques",
    route: "/admin/parametres-programmatiques",
    icon: Target,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 2,
  },
  "admin-architecture": {
    id: "admin-architecture",
    label: "Architecture SYGFP",
    route: "/admin/architecture",
    icon: Database,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 3,
  },
  "admin-codification": {
    id: "admin-codification",
    label: "Règles de Codification",
    route: "/admin/codification",
    icon: Hash,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 4,
    tables: ["codif_variables"],
  },
  "admin-secteurs": {
    id: "admin-secteurs",
    label: "Secteurs d'Activité",
    route: "/admin/secteurs-activite",
    icon: Layers,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 5,
    tables: ["secteurs_activite"],
  },
  "admin-dictionnaire": {
    id: "admin-dictionnaire",
    label: "Dictionnaire Variables",
    route: "/admin/dictionnaire",
    icon: BookOpen,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 6,
    tables: ["codif_variables"],
  },

  // ========== ADMIN - UTILISATEURS ==========
  "admin-utilisateurs": {
    id: "admin-utilisateurs",
    label: "Gestion Utilisateurs",
    route: "/admin/utilisateurs",
    icon: Users,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 7,
    tables: ["profiles"],
  },
  "admin-roles": {
    id: "admin-roles",
    label: "Profils & Rôles",
    route: "/admin/roles",
    icon: Shield,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 8,
    tables: ["roles", "user_roles"],
  },
  "admin-autorisations": {
    id: "admin-autorisations",
    label: "Autorisations",
    route: "/admin/autorisations",
    icon: Lock,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 9,
    tables: ["permissions"],
  },
  "admin-delegations": {
    id: "admin-delegations",
    label: "Délégations",
    route: "/admin/delegations",
    icon: UserCog,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 10,
    tables: ["role_delegations"],
  },

  // ========== ADMIN - SYSTÈME ==========
  "admin-parametres": {
    id: "admin-parametres",
    label: "Paramètres Système",
    route: "/admin/parametres",
    icon: Settings,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 11,
    tables: ["system_parameters"],
  },
  "admin-journal-audit": {
    id: "admin-journal-audit",
    label: "Journal d'Audit",
    route: "/admin/journal-audit",
    icon: ClipboardList,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 12,
    tables: ["audit_logs"],
  },
  "admin-documentation": {
    id: "admin-documentation",
    label: "Documentation",
    route: "/admin/documentation",
    icon: BookOpen,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 13,
    hidden: true,
  },
  "admin-raci": {
    id: "admin-raci",
    label: "Matrice RACI",
    route: "/admin/raci",
    icon: ClipboardList,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 14,
    hidden: true,
  },
  "admin-checklist": {
    id: "admin-checklist",
    label: "Checklist Production",
    route: "/admin/checklist-production",
    icon: ClipboardList,
    permissions: ["ADMIN"],
    status: "ready",
    category: "admin",
    order: 15,
    hidden: true,
  },

  // ========== OUTILS ADMIN ==========
  "admin-doublons": {
    id: "admin-doublons",
    label: "Gestion Doublons",
    route: "/admin/doublons",
    icon: Copy,
    permissions: ["ADMIN"],
    status: "ready",
    category: "outils",
    order: 1,
  },
  "admin-compteurs": {
    id: "admin-compteurs",
    label: "Compteurs Références",
    route: "/admin/compteurs-references",
    icon: Hash,
    permissions: ["ADMIN"],
    status: "ready",
    category: "outils",
    order: 2,
    tables: ["reference_counters"],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Récupère un module par son ID
 */
export function getModuleById(id: string): ModuleConfig | undefined {
  return MODULES_REGISTRY[id];
}

/**
 * Récupère un module par sa route
 */
export function getModuleByRoute(route: string): ModuleConfig | undefined {
  return Object.values(MODULES_REGISTRY).find((m) => m.route === route);
}

/**
 * Récupère tous les modules d'une catégorie
 */
export function getModulesByCategory(category: ModuleCategory): ModuleConfig[] {
  return Object.values(MODULES_REGISTRY)
    .filter((m) => m.category === category && !m.hidden)
    .sort((a, b) => a.order - b.order);
}

/**
 * Récupère les modules de la chaîne de dépense (triés par étape)
 */
export function getChaineModules(): ModuleConfig[] {
  return Object.values(MODULES_REGISTRY)
    .filter((m) => m.category === "chaine" && m.step !== undefined)
    .sort((a, b) => (a.step || 0) - (b.step || 0));
}

/**
 * Récupère les modules accessibles pour un ensemble de rôles
 */
export function getModulesForRoles(roles: string[]): ModuleConfig[] {
  return Object.values(MODULES_REGISTRY).filter(
    (m) =>
      m.permissions.length === 0 ||
      m.permissions.some((p) => roles.includes(p)) ||
      roles.includes("ADMIN") ||
      roles.includes("admin")
  );
}

/**
 * Vérifie si un module est accessible pour un ensemble de rôles
 */
export function isModuleAccessible(moduleId: string, userRoles: string[]): boolean {
  const module = getModuleById(moduleId);
  if (!module) return false;
  if (module.permissions.length === 0) return true;
  return (
    module.permissions.some((p) => userRoles.includes(p)) ||
    userRoles.includes("ADMIN") ||
    userRoles.includes("admin")
  );
}

/**
 * Récupère les modules visibles dans la sidebar pour une catégorie
 */
export function getVisibleModulesByCategory(
  category: ModuleCategory,
  userRoles: string[]
): ModuleConfig[] {
  return getModulesByCategory(category).filter(
    (m) => !m.hidden && isModuleAccessible(m.id, userRoles)
  );
}

/**
 * Récupère toutes les catégories avec au moins un module visible
 */
export function getVisibleCategories(userRoles: string[]): ModuleCategory[] {
  const categories: ModuleCategory[] = [
    "accueil",
    "chaine",
    "budget",
    "partenaires",
    "gestion",
    "execution",
    "rapports",
    "admin",
    "outils",
  ];
  return categories.filter(
    (cat) => getVisibleModulesByCategory(cat, userRoles).length > 0
  );
}

// ============================================
// CATEGORY LABELS
// ============================================

export const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  accueil: "Accueil",
  chaine: "Chaîne de la Dépense",
  budget: "Budget",
  partenaires: "Partenaires",
  gestion: "Gestion",
  execution: "Exécution Budgétaire",
  rapports: "Rapports",
  admin: "Paramétrage",
  outils: "Outils Admin",
};

// ============================================
// STATUS LABELS
// ============================================

export const STATUS_LABELS: Record<ModuleStatus, string> = {
  ready: "Opérationnel",
  beta: "En test",
  todo: "À développer",
  deprecated: "Obsolète",
};
