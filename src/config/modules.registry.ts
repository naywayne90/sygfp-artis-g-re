/**
 * Registre centralisé des modules SYGFP
 * Source unique de vérité pour la navigation et les routes
 *
 * RÈGLES:
 * - Tout nouveau module DOIT être ajouté ici avant de créer sa route
 * - Les routes dans App.tsx doivent correspondre à ce registre
 * - La sidebar génère son menu depuis ce registre
 */

import {
  Home,
  Search,
  FileText,
  FileEdit,
  Tag,
  Briefcase,
  ShoppingCart,
  CreditCard,
  Receipt,
  FileCheck,
  Banknote,
  Wallet,
  ClipboardList,
  ArrowRightLeft,
  FileUp,
  History,
  Database,
  Building2,
  FileSignature,
  Truck,
  Landmark,
  DollarSign,
  Archive,
  BarChart3,
  Target,
  Calendar,
  Hash,
  Layers,
  BookOpen,
  Users,
  Shield,
  Lock,
  UserCog,
  Settings,
  Cog,
  Copy,
  TrendingUp,
  Activity,
  Bell,
  AlertTriangle,
  CheckSquare,
  User,
  TestTube,
  type LucideIcon,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type ModuleStatus = 'ready' | 'beta' | 'todo' | 'deprecated';

export interface ModuleConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  route: string | null;
  parent: string | null;
  order: number;
  status: ModuleStatus;
  roles: string[];
  badge?: boolean;
  badgeKey?: string;
  description?: string;
  step?: number;
  subSection?: string;
}

// ============================================
// REGISTRE PRINCIPAL DES MODULES
// ============================================

export const MODULES_REGISTRY: ModuleConfig[] = [
  // ========== ACCUEIL ==========
  {
    id: 'dashboard',
    name: 'Tableau de bord',
    icon: Home,
    route: '/',
    parent: null,
    order: 0,
    status: 'ready',
    roles: ['all'],
    description: 'Vue d\'ensemble et indicateurs clés'
  },
  {
    id: 'recherche',
    name: 'Recherche Dossier',
    icon: Search,
    route: '/recherche',
    parent: null,
    order: 1,
    status: 'ready',
    roles: ['all'],
    description: 'Recherche transversale de dossiers'
  },

  // ========== CHAÎNE DE LA DÉPENSE (groupe parent) ==========
  {
    id: 'chaine-depense',
    name: 'Chaîne de la Dépense',
    icon: CreditCard,
    route: null,
    parent: null,
    order: 2,
    status: 'ready',
    roles: ['all'],
    description: '9 étapes du flux de dépense'
  },
  {
    id: 'notes-sef',
    name: 'Notes SEF',
    icon: FileText,
    route: '/notes-sef',
    parent: 'chaine-depense',
    order: 1,
    status: 'ready',
    roles: ['all'],
    badge: true,
    step: 1,
    description: 'Sans Engagement Financier'
  },
  {
    id: 'notes-aef',
    name: 'Notes AEF',
    icon: FileEdit,
    route: '/notes-aef',
    parent: 'chaine-depense',
    order: 2,
    status: 'ready',
    roles: ['all'],
    badge: true,
    step: 2,
    description: 'Avec Engagement Financier'
  },
  {
    id: 'imputation',
    name: 'Imputation',
    icon: Tag,
    route: '/execution/imputation',
    parent: 'chaine-depense',
    order: 3,
    status: 'ready',
    roles: ['sdct', 'daaf', 'cb'],
    step: 3,
    description: 'Imputation budgétaire'
  },
  {
    id: 'expression-besoin',
    name: 'Expression Besoin',
    icon: Briefcase,
    route: '/execution/expression-besoin',
    parent: 'chaine-depense',
    order: 4,
    status: 'ready',
    roles: ['all'],
    step: 4,
    description: 'Formalisation du besoin'
  },
  {
    id: 'passation-marche',
    name: 'Passation Marché',
    icon: ShoppingCart,
    route: '/marches',
    parent: 'chaine-depense',
    order: 5,
    status: 'ready',
    roles: ['sdpm', 'daaf'],
    step: 5,
    description: 'Si montant > seuil'
  },
  {
    id: 'engagement',
    name: 'Engagement',
    icon: CreditCard,
    route: '/engagements',
    parent: 'chaine-depense',
    order: 6,
    status: 'ready',
    roles: ['cb'],
    badge: true,
    badgeKey: 'engagementsAValider',
    step: 6,
    description: 'Réservation crédits'
  },
  {
    id: 'liquidation',
    name: 'Liquidation',
    icon: Receipt,
    route: '/liquidations',
    parent: 'chaine-depense',
    order: 7,
    status: 'ready',
    roles: ['sdct', 'daaf'],
    badge: true,
    badgeKey: 'liquidationsAValider',
    step: 7,
    description: 'Constatation service fait'
  },
  {
    id: 'ordonnancement',
    name: 'Ordonnancement',
    icon: FileCheck,
    route: '/ordonnancements',
    parent: 'chaine-depense',
    order: 8,
    status: 'ready',
    roles: ['dg'],
    badge: true,
    badgeKey: 'ordonnancementsAValider',
    step: 8,
    description: 'Ordre de paiement'
  },
  {
    id: 'reglement',
    name: 'Règlement',
    icon: Banknote,
    route: '/reglements',
    parent: 'chaine-depense',
    order: 9,
    status: 'ready',
    roles: ['tresorerie'],
    step: 9,
    description: 'Paiement effectif'
  },

  // ========== BUDGET (groupe parent) ==========
  {
    id: 'budget',
    name: 'Budget',
    icon: Wallet,
    route: null,
    parent: null,
    order: 3,
    status: 'ready',
    roles: ['daaf', 'cb', 'admin'],
    description: 'Planification et structure budgétaire'
  },
  {
    id: 'structure-budgetaire',
    name: 'Structure Budgétaire',
    icon: Wallet,
    route: '/planification/structure',
    parent: 'budget',
    order: 1,
    status: 'ready',
    roles: ['daaf', 'cb', 'admin']
  },
  {
    id: 'plan-travail',
    name: 'Plan de Travail',
    icon: ClipboardList,
    route: '/planification/plan-travail',
    parent: 'budget',
    order: 2,
    status: 'ready',
    roles: ['all']
  },
  {
    id: 'virements',
    name: 'Virements & Ajustements',
    icon: ArrowRightLeft,
    route: '/planification/virements',
    parent: 'budget',
    order: 3,
    status: 'ready',
    roles: ['cb', 'daaf']
  },
  {
    id: 'import-export-budget',
    name: 'Import / Export',
    icon: FileUp,
    route: '/planification/import-export',
    parent: 'budget',
    order: 4,
    status: 'ready',
    roles: ['admin', 'daaf']
  },
  {
    id: 'historique-imports',
    name: 'Historique Imports',
    icon: History,
    route: '/planification/historique-imports',
    parent: 'budget',
    order: 5,
    status: 'ready',
    roles: ['admin', 'daaf']
  },
  {
    id: 'import-budget-admin',
    name: 'Import Budget (Admin)',
    icon: Database,
    route: '/admin/import-budget',
    parent: 'budget',
    order: 6,
    status: 'ready',
    roles: ['admin']
  },

  // ========== PARTENAIRES (groupe parent) ==========
  {
    id: 'partenaires',
    name: 'Partenaires',
    icon: Building2,
    route: null,
    parent: null,
    order: 4,
    status: 'ready',
    roles: ['all'],
    description: 'Gestion des prestataires et contrats'
  },
  {
    id: 'prestataires',
    name: 'Prestataires',
    icon: Building2,
    route: '/contractualisation/prestataires',
    parent: 'partenaires',
    order: 1,
    status: 'ready',
    roles: ['all']
  },
  {
    id: 'contrats',
    name: 'Contrats',
    icon: FileSignature,
    route: '/contractualisation/contrats',
    parent: 'partenaires',
    order: 2,
    status: 'ready',
    roles: ['all']
  },

  // ========== GESTION COMPLÉMENTAIRE (groupe parent) ==========
  {
    id: 'gestion',
    name: 'Gestion',
    icon: Briefcase,
    route: null,
    parent: null,
    order: 5,
    status: 'ready',
    roles: ['all'],
    description: 'Modules complémentaires'
  },
  {
    id: 'approvisionnement',
    name: 'Approvisionnement',
    icon: Truck,
    route: '/approvisionnement',
    parent: 'gestion',
    order: 1,
    status: 'ready',
    roles: ['all']
  },
  {
    id: 'tresorerie',
    name: 'Trésorerie',
    icon: Landmark,
    route: '/tresorerie',
    parent: 'gestion',
    order: 2,
    status: 'ready',
    roles: ['tresorerie', 'dg']
  },
  {
    id: 'recettes',
    name: 'Recettes',
    icon: DollarSign,
    route: '/recettes',
    parent: 'gestion',
    order: 3,
    status: 'ready',
    roles: ['daaf', 'tresorerie']
  },
  {
    id: 'comptabilite-matiere',
    name: 'Comptabilité Matière',
    icon: Archive,
    route: '/contractualisation/comptabilite-matiere',
    parent: 'gestion',
    order: 4,
    status: 'ready',
    roles: ['all']
  },

  // ========== EXÉCUTION BUDGÉTAIRE (groupe parent) ==========
  {
    id: 'execution-budgetaire',
    name: 'Exécution Budgétaire',
    icon: Activity,
    route: null,
    parent: null,
    order: 6,
    status: 'ready',
    roles: ['daaf', 'cb', 'dg'],
    description: 'Suivi de l\'exécution'
  },
  {
    id: 'dashboard-execution',
    name: 'Tableau de bord',
    icon: TrendingUp,
    route: '/execution/dashboard',
    parent: 'execution-budgetaire',
    order: 1,
    status: 'ready',
    roles: ['all']
  },

  // ========== RAPPORTS (groupe parent) ==========
  {
    id: 'rapports',
    name: 'Rapports',
    icon: BarChart3,
    route: null,
    parent: null,
    order: 7,
    status: 'ready',
    roles: ['daaf', 'cb', 'dg'],
    description: 'États et analyses'
  },
  {
    id: 'etats-execution',
    name: 'États d\'exécution',
    icon: BarChart3,
    route: '/etats-execution',
    parent: 'rapports',
    order: 1,
    status: 'ready',
    roles: ['all']
  },
  {
    id: 'alertes-budgetaires',
    name: 'Alertes Budgétaires',
    icon: Target,
    route: '/alertes-budgetaires',
    parent: 'rapports',
    order: 2,
    status: 'ready',
    roles: ['cb', 'daaf']
  },

  // ========== PARAMÉTRAGE (groupe parent) ==========
  {
    id: 'parametrage',
    name: 'Paramétrage',
    icon: Cog,
    route: null,
    parent: null,
    order: 8,
    status: 'ready',
    roles: ['admin', 'dg'],
    description: 'Configuration système'
  },

  // Sous-section: Référentiels
  {
    id: 'exercices',
    name: 'Exercices Budgétaires',
    icon: Calendar,
    route: '/admin/exercices',
    parent: 'parametrage',
    order: 1,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Référentiels'
  },
  {
    id: 'parametres-programmatiques',
    name: 'Paramètres Programmatiques',
    icon: Target,
    route: '/admin/parametres-programmatiques',
    parent: 'parametrage',
    order: 2,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Référentiels'
  },
  {
    id: 'architecture',
    name: 'Architecture SYGFP',
    icon: Database,
    route: '/admin/architecture',
    parent: 'parametrage',
    order: 3,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Référentiels'
  },
  {
    id: 'codification',
    name: 'Règles de Codification',
    icon: Hash,
    route: '/admin/codification',
    parent: 'parametrage',
    order: 4,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Référentiels'
  },
  {
    id: 'secteurs-activite',
    name: 'Secteurs d\'Activité',
    icon: Layers,
    route: '/admin/secteurs-activite',
    parent: 'parametrage',
    order: 5,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Référentiels'
  },
  {
    id: 'dictionnaire',
    name: 'Dictionnaire Variables',
    icon: BookOpen,
    route: '/admin/dictionnaire',
    parent: 'parametrage',
    order: 6,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Référentiels'
  },

  // Sous-section: Utilisateurs
  {
    id: 'utilisateurs',
    name: 'Gestion Utilisateurs',
    icon: Users,
    route: '/admin/utilisateurs',
    parent: 'parametrage',
    order: 10,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Utilisateurs'
  },
  {
    id: 'roles',
    name: 'Profils & Rôles',
    icon: Shield,
    route: '/admin/roles',
    parent: 'parametrage',
    order: 11,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Utilisateurs'
  },
  {
    id: 'autorisations',
    name: 'Autorisations',
    icon: Lock,
    route: '/admin/autorisations',
    parent: 'parametrage',
    order: 12,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Utilisateurs'
  },
  {
    id: 'delegations',
    name: 'Délégations',
    icon: UserCog,
    route: '/admin/delegations',
    parent: 'parametrage',
    order: 13,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Utilisateurs'
  },

  // Sous-section: Système
  {
    id: 'parametres-systeme',
    name: 'Paramètres Système',
    icon: Settings,
    route: '/admin/parametres',
    parent: 'parametrage',
    order: 20,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Système'
  },
  {
    id: 'journal-audit',
    name: 'Journal d\'Audit',
    icon: ClipboardList,
    route: '/admin/journal-audit',
    parent: 'parametrage',
    order: 21,
    status: 'ready',
    roles: ['admin', 'dg'],
    subSection: 'Système'
  },

  // Sous-section: Outils
  {
    id: 'doublons',
    name: 'Gestion Doublons',
    icon: Copy,
    route: '/admin/doublons',
    parent: 'parametrage',
    order: 30,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Outils'
  },
  {
    id: 'compteurs-references',
    name: 'Compteurs Références',
    icon: Hash,
    route: '/admin/compteurs-references',
    parent: 'parametrage',
    order: 31,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Outils'
  },
  {
    id: 'test-non-regression',
    name: 'Test Non-Régression',
    icon: TestTube,
    route: '/admin/test-non-regression',
    parent: 'parametrage',
    order: 32,
    status: 'ready',
    roles: ['admin'],
    subSection: 'Outils'
  },

  // ========== MODULES UTILISATEUR (non affichés dans menu principal) ==========
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    route: '/notifications',
    parent: null,
    order: 100,
    status: 'ready',
    roles: ['all'],
    description: 'Centre de notifications'
  },
  {
    id: 'alertes',
    name: 'Alertes',
    icon: AlertTriangle,
    route: '/alertes',
    parent: null,
    order: 101,
    status: 'ready',
    roles: ['all']
  },
  {
    id: 'taches',
    name: 'Mes Tâches',
    icon: CheckSquare,
    route: '/taches',
    parent: null,
    order: 102,
    status: 'ready',
    roles: ['all']
  },
  {
    id: 'profil',
    name: 'Mon Profil',
    icon: User,
    route: '/mon-profil',
    parent: null,
    order: 103,
    status: 'ready',
    roles: ['all']
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Récupère un module par son ID
 */
export const getModuleById = (id: string): ModuleConfig | undefined =>
  MODULES_REGISTRY.find(m => m.id === id);

/**
 * Récupère un module par sa route
 */
export const getModuleByRoute = (route: string): ModuleConfig | undefined =>
  MODULES_REGISTRY.find(m => m.route === route);

/**
 * Récupère les enfants d'un module parent
 */
export const getChildModules = (parentId: string): ModuleConfig[] =>
  MODULES_REGISTRY
    .filter(m => m.parent === parentId)
    .sort((a, b) => a.order - b.order);

/**
 * Récupère les modules racine (sans parent) pour le menu principal
 */
export const getRootModules = (): ModuleConfig[] =>
  MODULES_REGISTRY
    .filter(m => m.parent === null && m.order < 100)
    .sort((a, b) => a.order - b.order);

/**
 * Récupère tous les modules avec une route (pour vérification)
 */
export const getRoutedModules = (): ModuleConfig[] =>
  MODULES_REGISTRY.filter(m => m.route !== null);

/**
 * Récupère les modules par rôle
 */
export const getModulesByRole = (role: string): ModuleConfig[] =>
  MODULES_REGISTRY.filter(m =>
    m.roles.includes('all') || m.roles.includes(role)
  );

/**
 * Récupère les modules par statut
 */
export const getModulesByStatus = (status: ModuleStatus): ModuleConfig[] =>
  MODULES_REGISTRY.filter(m => m.status === status);

/**
 * Récupère les modules avec badge
 */
export const getModulesWithBadge = (): ModuleConfig[] =>
  MODULES_REGISTRY.filter(m => m.badge === true);

/**
 * Récupère les sous-sections d'un groupe
 */
export const getSubSections = (parentId: string): string[] => {
  const children = getChildModules(parentId);
  const sections = new Set<string>();
  children.forEach(m => {
    if (m.subSection) sections.add(m.subSection);
  });
  return Array.from(sections);
};

/**
 * Récupère les modules d'une sous-section
 */
export const getModulesBySubSection = (parentId: string, subSection: string): ModuleConfig[] =>
  MODULES_REGISTRY
    .filter(m => m.parent === parentId && m.subSection === subSection)
    .sort((a, b) => a.order - b.order);

/**
 * Vérifie si un module existe
 */
export const moduleExists = (id: string): boolean =>
  MODULES_REGISTRY.some(m => m.id === id);

/**
 * Vérifie si une route est enregistrée
 */
export const routeExists = (route: string): boolean =>
  MODULES_REGISTRY.some(m => m.route === route);
