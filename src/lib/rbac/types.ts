/**
 * Types pour le système RBAC (Role-Based Access Control)
 * Basé sur role_hierarchique + profil_fonctionnel
 */

// ============================================
// ENUMS (mirroir des enums Supabase)
// ============================================

export type RoleHierarchique =
  | "Agent"
  | "Chef de Service"
  | "Sous-Directeur"
  | "Directeur"
  | "DG";

export type ProfilFonctionnel =
  | "Admin"
  | "Validateur"
  | "Operationnel"
  | "Controleur"
  | "Auditeur";

export type AppRole =
  | "ADMIN"
  | "DG"
  | "DAAF"
  | "DGPEC"
  | "SDMG"
  | "CB"
  | "OPERATEUR"
  | "TRESORIER"
  | "INVITE"
  | "BUDGET_PLANNER"
  | "BUDGET_VALIDATOR"
  | "EXPENSE_REQUESTER"
  | "EXPENSE_VALIDATOR"
  | "AUDITOR"
  | "DAF"
  | "SDCT"
  | "SAF"
  | "SDPM"
  | "TRESORERIE"
  | "COMPTABILITE";

// ============================================
// MODULES ET ACTIONS
// ============================================

export type ModuleCode =
  | "notes_sef"
  | "notes_aef"
  | "imputation"
  | "expression_besoin"
  | "passation_marche"
  | "engagement"
  | "liquidation"
  | "ordonnancement"
  | "reglement"
  | "budget"
  | "planification"
  | "tresorerie"
  | "recettes"
  | "approvisionnement"
  | "contractualisation"
  | "admin"
  | "audit";

export type ActionCode =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "validate"
  | "reject"
  | "sign"
  | "export"
  | "import"
  | "archive";

// ============================================
// ÉTAPES DU WORKFLOW
// ============================================

export type WorkflowStep =
  | "SEF"      // Note SEF
  | "AEF"      // Note AEF/DG
  | "IMP"      // Imputation
  | "EXP"      // Expression de besoin
  | "PAS"      // Passation de marché
  | "ENG"      // Engagement
  | "LIQ"      // Liquidation
  | "ORD"      // Ordonnancement
  | "REG";     // Règlement

// ============================================
// PROFIL UTILISATEUR
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  matricule: string | null;
  direction_id: string | null;
  direction_code: string | null;
  role_hierarchique: RoleHierarchique | null;
  profil_fonctionnel: ProfilFonctionnel | null;
  is_active: boolean;
  exercice_actif: number | null;
}

export interface UserRole {
  id: string;
  role: AppRole;
  is_active: boolean;
  is_primary: boolean;
}

// ============================================
// PERMISSIONS
// ============================================

export interface Permission {
  module: ModuleCode;
  action: ActionCode;
  condition?: string; // ex: "own_direction", "own_records"
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
}

// ============================================
// CONFIGURATION RBAC
// ============================================

export interface RBACConfig {
  // Qui peut créer dans un module
  canCreate: Record<ModuleCode, ProfilFonctionnel[]>;
  // Qui peut valider à chaque étape
  canValidateStep: Record<WorkflowStep, {
    roles: AppRole[];
    roleHierarchique?: RoleHierarchique[];
    profilFonctionnel?: ProfilFonctionnel[];
  }>;
  // Qui peut exporter
  canExport: Record<ModuleCode, ProfilFonctionnel[]>;
}
