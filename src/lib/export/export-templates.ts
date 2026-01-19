/**
 * Modèles d'export configurables par module SYGFP
 * Chaque module peut avoir plusieurs templates d'export
 */

import { ExportColumn, ExportTemplate, formatters } from "./export-service";

// ============================================================================
// Templates Notes SEF
// ============================================================================

export const notesSEFTemplates: ExportTemplate[] = [
  {
    id: "notes_sef_complet",
    name: "Export complet",
    module: "notes_sef",
    description: "Toutes les colonnes disponibles",
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "objet", label: "Objet", type: "text", width: 40 },
      { key: "montant_total", label: "Montant Total", type: "currency", width: 15 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 12 },
      { key: "direction.sigle", label: "Direction", type: "text", width: 10 },
      { key: "type_depense", label: "Type Dépense", type: "text", width: 15 },
      { key: "created_at", label: "Date Création", type: "date", width: 12 },
      { key: "validated_at", label: "Date Validation", type: "date", width: 12 },
      { key: "validated_by_name", label: "Validé par", type: "text", width: 20 },
      { key: "motif_rejet", label: "Motif Rejet", type: "text", width: 30 },
      { key: "commentaire", label: "Commentaire", type: "text", width: 30 },
    ],
  },
  {
    id: "notes_sef_resume",
    name: "Résumé",
    module: "notes_sef",
    description: "Vue simplifiée pour suivi",
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "objet", label: "Objet", type: "text", width: 50 },
      { key: "montant_total", label: "Montant", type: "currency", width: 15 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 12 },
      { key: "direction.sigle", label: "Direction", type: "text", width: 10 },
      { key: "created_at", label: "Date", type: "date", width: 12 },
    ],
  },
  {
    id: "notes_sef_validation",
    name: "Pour validation DG",
    module: "notes_sef",
    description: "Notes en attente de validation",
    defaultFilters: { statut: "soumis" },
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "objet", label: "Objet", type: "text", width: 40 },
      { key: "montant_total", label: "Montant", type: "currency", width: 15 },
      { key: "direction.sigle", label: "Direction", type: "text", width: 10 },
      { key: "type_depense", label: "Type", type: "text", width: 15 },
      { key: "created_at", label: "Soumis le", type: "date", width: 12 },
      { key: "pieces_count", label: "PJ", type: "number", width: 5 },
    ],
  },
];

// ============================================================================
// Templates Notes AEF
// ============================================================================

export const notesAEFTemplates: ExportTemplate[] = [
  {
    id: "notes_aef_complet",
    name: "Export complet",
    module: "notes_aef",
    description: "Toutes les colonnes disponibles",
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "objet", label: "Objet", type: "text", width: 40 },
      { key: "montant_demande", label: "Montant Demandé", type: "currency", width: 15 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 12 },
      { key: "direction.sigle", label: "Direction", type: "text", width: 10 },
      { key: "note_sef_reference", label: "Note SEF", type: "text", width: 18 },
      { key: "type_depense", label: "Type Dépense", type: "text", width: 15 },
      { key: "created_at", label: "Date Création", type: "date", width: 12 },
      { key: "validated_at", label: "Date Validation", type: "date", width: 12 },
    ],
  },
  {
    id: "notes_aef_resume",
    name: "Résumé",
    module: "notes_aef",
    description: "Vue simplifiée",
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "objet", label: "Objet", type: "text", width: 50 },
      { key: "montant_demande", label: "Montant", type: "currency", width: 15 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 12 },
      { key: "created_at", label: "Date", type: "date", width: 12 },
    ],
  },
];

// ============================================================================
// Templates Engagements
// ============================================================================

export const engagementsTemplates: ExportTemplate[] = [
  {
    id: "engagements_complet",
    name: "Export complet",
    module: "engagements",
    description: "Toutes les informations d'engagement",
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "objet", label: "Objet", type: "text", width: 40 },
      { key: "montant", label: "Montant", type: "currency", width: 15 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 12 },
      { key: "tiers.raison_sociale", label: "Bénéficiaire", type: "text", width: 25 },
      { key: "ligne_budget.code", label: "Ligne Budget", type: "text", width: 20 },
      { key: "date_engagement", label: "Date Engagement", type: "date", width: 12 },
      { key: "date_validation", label: "Date Validation", type: "date", width: 12 },
      { key: "type_engagement", label: "Type", type: "text", width: 15 },
    ],
  },
  {
    id: "engagements_suivi",
    name: "Suivi budgétaire",
    module: "engagements",
    description: "Pour le suivi de consommation budgétaire",
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "ligne_budget.code", label: "Ligne", type: "text", width: 20 },
      { key: "montant", label: "Engagé", type: "currency", width: 15 },
      { key: "montant_liquide", label: "Liquidé", type: "currency", width: 15 },
      { key: "montant_ordonnance", label: "Ordonnancé", type: "currency", width: 15 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 12 },
    ],
  },
];

// ============================================================================
// Templates Liquidations
// ============================================================================

export const liquidationsTemplates: ExportTemplate[] = [
  {
    id: "liquidations_complet",
    name: "Export complet",
    module: "liquidations",
    description: "Toutes les informations de liquidation",
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "engagement.reference", label: "Engagement", type: "text", width: 18 },
      { key: "montant", label: "Montant", type: "currency", width: 15 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 12 },
      { key: "tiers.raison_sociale", label: "Bénéficiaire", type: "text", width: 25 },
      { key: "date_liquidation", label: "Date Liquidation", type: "date", width: 12 },
      { key: "date_service_fait", label: "Service Fait", type: "date", width: 12 },
      { key: "numero_facture", label: "N° Facture", type: "text", width: 15 },
    ],
  },
];

// ============================================================================
// Templates Ordonnancements
// ============================================================================

export const ordonnancementsTemplates: ExportTemplate[] = [
  {
    id: "ordonnancements_complet",
    name: "Export complet",
    module: "ordonnancements",
    description: "Mandats de paiement",
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "liquidation.reference", label: "Liquidation", type: "text", width: 18 },
      { key: "montant", label: "Montant", type: "currency", width: 15 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 12 },
      { key: "tiers.raison_sociale", label: "Bénéficiaire", type: "text", width: 25 },
      { key: "date_ordonnancement", label: "Date Mandat", type: "date", width: 12 },
      { key: "date_signature", label: "Date Signature", type: "date", width: 12 },
      { key: "signe_par", label: "Signé par", type: "text", width: 20 },
    ],
  },
  {
    id: "ordonnancements_a_signer",
    name: "À signer (DG)",
    module: "ordonnancements",
    description: "Mandats en attente de signature",
    defaultFilters: { statut: "a_signer" },
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "montant", label: "Montant", type: "currency", width: 15 },
      { key: "tiers.raison_sociale", label: "Bénéficiaire", type: "text", width: 30 },
      { key: "date_ordonnancement", label: "Date", type: "date", width: 12 },
      { key: "objet", label: "Objet", type: "text", width: 40 },
    ],
  },
];

// ============================================================================
// Templates Règlements
// ============================================================================

export const reglementsTemplates: ExportTemplate[] = [
  {
    id: "reglements_complet",
    name: "Export complet",
    module: "reglements",
    description: "Tous les paiements effectués",
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "ordonnancement.reference", label: "Mandat", type: "text", width: 18 },
      { key: "montant", label: "Montant", type: "currency", width: 15 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 12 },
      { key: "tiers.raison_sociale", label: "Bénéficiaire", type: "text", width: 25 },
      { key: "mode_paiement", label: "Mode", type: "text", width: 12 },
      { key: "date_reglement", label: "Date Paiement", type: "date", width: 12 },
      { key: "numero_cheque", label: "N° Chèque/Virement", type: "text", width: 20 },
    ],
  },
];

// ============================================================================
// Templates Budget
// ============================================================================

export const budgetTemplates: ExportTemplate[] = [
  {
    id: "budget_lignes_complet",
    name: "Lignes budgétaires complètes",
    module: "budget",
    description: "Toutes les lignes avec détails",
    columns: [
      { key: "code", label: "Code", type: "text", width: 25 },
      { key: "label", label: "Libellé", type: "text", width: 40 },
      { key: "dotation_initiale", label: "Dotation Init.", type: "currency", width: 15 },
      { key: "dotation_modifiee", label: "Dotation Mod.", type: "currency", width: 15 },
      { key: "total_engage", label: "Engagé", type: "currency", width: 15 },
      { key: "disponible_calcule", label: "Disponible", type: "currency", width: 15 },
      { key: "direction.sigle", label: "Direction", type: "text", width: 10 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 10 },
    ],
  },
  {
    id: "budget_execution",
    name: "État d'exécution",
    module: "budget",
    description: "Suivi de l'exécution budgétaire",
    columns: [
      { key: "direction.sigle", label: "Direction", type: "text", width: 10 },
      { key: "code", label: "Ligne", type: "text", width: 25 },
      { key: "dotation_modifiee", label: "Crédits", type: "currency", width: 15 },
      { key: "total_engage", label: "Engagé", type: "currency", width: 15 },
      { key: "total_liquide", label: "Liquidé", type: "currency", width: 15 },
      { key: "total_ordonnance", label: "Ordonnancé", type: "currency", width: 15 },
      { key: "total_paye", label: "Payé", type: "currency", width: 15 },
      { key: "disponible_calcule", label: "Disponible", type: "currency", width: 15 },
      { key: "taux_execution", label: "Taux Exec.", type: "text", format: (v) => v ? `${v}%` : "-", width: 10 },
    ],
  },
];

// ============================================================================
// Templates Tâches
// ============================================================================

export const tachesTemplates: ExportTemplate[] = [
  {
    id: "taches_complet",
    name: "Liste des tâches",
    module: "taches",
    description: "Toutes les tâches avec statut",
    columns: [
      { key: "task_name", label: "Tâche", type: "text", width: 30 },
      { key: "status", label: "Statut", type: "text", format: formatters.status, width: 12 },
      { key: "assigned_to_name", label: "Assigné à", type: "text", width: 20 },
      { key: "direction.sigle", label: "Direction", type: "text", width: 10 },
      { key: "deadline", label: "Échéance", type: "date", width: 12 },
      { key: "progress", label: "Avancement", type: "text", format: (v) => v ? `${v}%` : "-", width: 10 },
      { key: "blocked_reason", label: "Raison blocage", type: "text", width: 30 },
    ],
  },
  {
    id: "taches_retard",
    name: "Tâches en retard",
    module: "taches",
    description: "Tâches dépassant l'échéance",
    defaultFilters: { is_overdue: true },
    columns: [
      { key: "task_name", label: "Tâche", type: "text", width: 30 },
      { key: "assigned_to_name", label: "Assigné à", type: "text", width: 20 },
      { key: "deadline", label: "Échéance", type: "date", width: 12 },
      { key: "days_late", label: "Jours retard", type: "number", width: 12 },
      { key: "direction.sigle", label: "Direction", type: "text", width: 10 },
    ],
  },
];

// ============================================================================
// Templates Notifications
// ============================================================================

export const notificationsTemplates: ExportTemplate[] = [
  {
    id: "notifications_complet",
    name: "Export complet",
    module: "notifications",
    description: "Toutes les notifications",
    columns: [
      { key: "created_at", label: "Date", type: "date", width: 12 },
      { key: "type", label: "Type", type: "text", width: 15 },
      { key: "title", label: "Titre", type: "text", width: 30 },
      { key: "message", label: "Message", type: "text", width: 50 },
      { key: "is_read", label: "Lue", type: "boolean", width: 8 },
      { key: "is_urgent", label: "Urgente", type: "boolean", width: 8 },
      { key: "entity_type", label: "Entité", type: "text", width: 15 },
    ],
  },
];

// ============================================================================
// Templates Feuilles de Route
// ============================================================================

export const feuillesRouteTemplates: ExportTemplate[] = [
  {
    id: "feuilles_route_complet",
    name: "Export complet",
    module: "feuilles_route",
    description: "Toutes les feuilles de route",
    columns: [
      { key: "reference", label: "Référence", type: "text", width: 18 },
      { key: "direction.libelle", label: "Direction", type: "text", width: 25 },
      { key: "statut", label: "Statut", type: "text", format: formatters.status, width: 12 },
      { key: "budget_total", label: "Budget Total", type: "currency", width: 15 },
      { key: "taux_execution", label: "Taux Exec.", type: "text", format: (v) => v ? `${v}%` : "-", width: 10 },
      { key: "created_at", label: "Date Création", type: "date", width: 12 },
      { key: "submitted_at", label: "Date Soumission", type: "date", width: 12 },
      { key: "validated_at", label: "Date Validation", type: "date", width: 12 },
    ],
  },
];

// ============================================================================
// Registry de tous les templates
// ============================================================================

export const exportTemplatesRegistry: Record<string, ExportTemplate[]> = {
  notes_sef: notesSEFTemplates,
  notes_aef: notesAEFTemplates,
  engagements: engagementsTemplates,
  liquidations: liquidationsTemplates,
  ordonnancements: ordonnancementsTemplates,
  reglements: reglementsTemplates,
  budget: budgetTemplates,
  taches: tachesTemplates,
  notifications: notificationsTemplates,
  feuilles_route: feuillesRouteTemplates,
};

// ============================================================================
// Helper pour récupérer un template
// ============================================================================

export function getExportTemplate(module: string, templateId?: string): ExportTemplate | undefined {
  const templates = exportTemplatesRegistry[module];
  if (!templates || templates.length === 0) return undefined;

  if (templateId) {
    return templates.find(t => t.id === templateId);
  }

  // Return first template as default
  return templates[0];
}

export function getModuleTemplates(module: string): ExportTemplate[] {
  return exportTemplatesRegistry[module] || [];
}

export function getAllModules(): string[] {
  return Object.keys(exportTemplatesRegistry);
}
