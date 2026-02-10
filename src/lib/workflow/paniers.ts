/**
 * Configuration des paniers de tâches par rôle
 * 
 * Chaque rôle a un ensemble de "paniers" représentant les actions en attente.
 */


// ===== Types =====

export interface PanierConfig {
  id: string;
  module: string;
  table: string;
  statutFiltre: string | string[];
  label: string;
  description?: string;
  route: string;
  icon?: string;
  priorite: 'haute' | 'normale' | 'basse';
}

export interface RolePaniers {
  code: string;
  label: string;
  paniers: PanierConfig[];
}

// ===== Configuration paniers par rôle =====

export const PANIERS_CONFIG: Record<string, RolePaniers> = {
  // Direction Générale
  DG: {
    code: 'DG',
    label: 'Direction Générale',
    paniers: [
      {
        id: 'dg_notes_sef',
        module: 'notes_sef',
        table: 'notes_sef',
        statutFiltre: 'soumis',
        label: 'Notes SEF à valider',
        description: 'Notes sans effet financier en attente de validation',
        route: '/notes-sef?statut=soumis',
        priorite: 'haute',
      },
      {
        id: 'dg_notes_aef',
        module: 'notes_aef',
        table: 'notes_dg',
        statutFiltre: 'soumis',
        label: 'Notes AEF à valider',
        description: 'Notes avec effet financier en attente de validation',
        route: '/notes-aef?statut=soumis',
        priorite: 'haute',
      },
      {
        id: 'dg_engagements',
        module: 'engagements',
        table: 'budget_engagements',
        statutFiltre: 'soumis',
        label: 'Engagements à valider',
        description: 'Engagements budgétaires à approuver',
        route: '/engagements?statut=soumis',
        priorite: 'haute',
      },
      {
        id: 'dg_ordonnancements',
        module: 'ordonnancements',
        table: 'ordonnancements',
        statutFiltre: 'a_signer',
        label: 'Ordonnancements à signer',
        description: 'Ordres de paiement en attente de signature',
        route: '/ordonnancements?statut=a_signer',
        priorite: 'haute',
      },
      {
        id: 'dg_marches',
        module: 'marches',
        table: 'marches',
        statutFiltre: ['a_approuver', 'en_cours'],
        label: 'Marchés à approuver',
        description: 'Marchés publics en attente d\'approbation',
        route: '/marches?statut=a_approuver',
        priorite: 'normale',
      },
    ],
  },

  // Direction Administrative et Financière
  DAAF: {
    code: 'DAAF',
    label: 'Direction Administrative et Financière',
    paniers: [
      {
        id: 'daaf_liquidations',
        module: 'liquidations',
        table: 'budget_liquidations',
        statutFiltre: 'soumis',
        label: 'Liquidations à valider',
        description: 'Liquidations en attente de validation',
        route: '/liquidations?statut=soumis',
        priorite: 'haute',
      },
    ],
  },

  // Contrôleur Budgétaire
  CB: {
    code: 'CB',
    label: 'Contrôleur Budgétaire',
    paniers: [
      {
        id: 'cb_imputations',
        module: 'imputations',
        table: 'imputations',
        statutFiltre: 'en_attente',
        label: 'Imputations à contrôler',
        description: 'Imputations budgétaires en attente de contrôle',
        route: '/execution/imputation?statut=en_attente',
        priorite: 'haute',
      },
      {
        id: 'cb_engagements_visa',
        module: 'engagements',
        table: 'budget_engagements',
        statutFiltre: 'a_viser',
        label: 'Engagements à viser',
        description: 'Engagements en attente de visa budgétaire',
        route: '/engagements?statut=a_viser',
        priorite: 'haute',
      },
      {
        id: 'cb_ordonnancements_visa',
        module: 'ordonnancements',
        table: 'ordonnancements',
        statutFiltre: 'en_attente',
        label: 'Ordonnancements à viser',
        description: 'Ordonnancements en attente de visa',
        route: '/ordonnancements?statut=en_attente',
        priorite: 'haute',
      },
    ],
  },

  // Service Dépenses et Passation des Marchés
  SDPM: {
    code: 'SDPM',
    label: 'Service Dépenses et Marchés',
    paniers: [
      {
        id: 'sdpm_expressions',
        module: 'expressions_besoin',
        table: 'expressions_besoin',
        statutFiltre: 'valide',
        label: 'Besoins à traiter',
        description: 'Expressions de besoin validées à traiter',
        route: '/execution/expression-besoin?statut=valide',
        priorite: 'normale',
      },
      {
        id: 'sdpm_liquidations',
        module: 'liquidations',
        table: 'budget_liquidations',
        statutFiltre: 'brouillon',
        label: 'Liquidations à saisir',
        description: 'Liquidations en cours de préparation',
        route: '/liquidations?statut=brouillon',
        priorite: 'normale',
      },
      {
        id: 'sdpm_marches',
        module: 'marches',
        table: 'marches',
        statutFiltre: 'en_cours',
        label: 'Marchés en cours',
        description: 'Procédures de marché en cours',
        route: '/marches?statut=en_cours',
        priorite: 'normale',
      },
    ],
  },

  // Service Comptabilité Trésorerie
  SDCT: {
    code: 'SDCT',
    label: 'Service Comptabilité Trésorerie',
    paniers: [
      {
        id: 'sdct_reglements',
        module: 'reglements',
        table: 'reglements',
        statutFiltre: 'en_cours',
        label: 'Règlements à effectuer',
        description: 'Paiements en attente d\'exécution',
        route: '/reglements?statut=en_cours',
        priorite: 'haute',
      },
    ],
  },

  // Directeur de service
  DIRECTEUR: {
    code: 'DIRECTEUR',
    label: 'Directeur de Service',
    paniers: [
      {
        id: 'dir_notes_aef',
        module: 'notes_aef',
        table: 'notes_dg',
        statutFiltre: 'soumis',
        label: 'Notes AEF à valider',
        description: 'Notes de ma direction à valider',
        route: '/notes-aef?statut=soumis',
        priorite: 'haute',
      },
      {
        id: 'dir_expressions',
        module: 'expressions_besoin',
        table: 'expressions_besoin',
        statutFiltre: 'soumis',
        label: 'Besoins à valider',
        description: 'Expressions de besoin à valider',
        route: '/execution/expression-besoin?statut=soumis',
        priorite: 'haute',
      },
    ],
  },

  // Agent / Gestionnaire
  AGENT: {
    code: 'AGENT',
    label: 'Agent / Gestionnaire',
    paniers: [
      {
        id: 'agent_notes_brouillon',
        module: 'notes_sef',
        table: 'notes_sef',
        statutFiltre: 'brouillon',
        label: 'Mes brouillons SEF',
        description: 'Notes SEF en cours de rédaction',
        route: '/notes-sef?statut=brouillon',
        priorite: 'normale',
      },
      {
        id: 'agent_notes_rejetees',
        module: 'notes_sef',
        table: 'notes_sef',
        statutFiltre: 'rejete',
        label: 'Notes rejetées',
        description: 'Notes nécessitant une correction',
        route: '/notes-sef?statut=rejete',
        priorite: 'haute',
      },
    ],
  },
};

// ===== Helpers =====

export function getPaniersForRole(roleCode: string): PanierConfig[] {
  return PANIERS_CONFIG[roleCode]?.paniers || [];
}

export function getAllPaniers(): PanierConfig[] {
  return Object.values(PANIERS_CONFIG).flatMap(role => role.paniers);
}

export function getPanierById(id: string): PanierConfig | undefined {
  return getAllPaniers().find(p => p.id === id);
}
