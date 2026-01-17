/**
 * Statuts unifiés pour la chaîne de la dépense SYGFP
 * 
 * RÈGLE: Ne jamais supprimer ou renommer un statut existant.
 * Pour déprécier, ajouter un commentaire @deprecated.
 */

// ===== Statuts génériques (toutes étapes) =====

export const STATUTS_WORKFLOW = {
  // Phase création
  BROUILLON: 'brouillon',        // En cours de saisie
  
  // Phase validation
  SOUMIS: 'soumis',              // Soumis pour validation
  EN_ATTENTE: 'en_attente',      // En attente d'action
  EN_COURS: 'en_cours',          // Traitement en cours
  
  // Phase décision
  VALIDE: 'valide',              // Validé/Approuvé
  REJETE: 'rejete',              // Rejeté
  DIFFERE: 'differe',            // Reporté à une date ultérieure
  
  // Phase terminale
  CLOS: 'clos',                  // Terminé normalement
  ANNULE: 'annule',              // Annulé
  
  // Spécifiques imputation
  IMPUTE: 'impute',              // Imputation réalisée
  
  // Spécifiques marchés
  ATTRIBUE: 'attribue',          // Marché attribué
  INFRUCTUEUX: 'infructueux',    // Marché infructueux
  
  // Spécifiques ordonnancement
  VISE: 'vise',                  // Visé par CB
  SIGNE: 'signe',                // Signé par DG
  A_SIGNER: 'a_signer',          // En attente signature DG
  
  // Spécifiques règlements
  PAYE: 'paye',                  // Paiement effectué
  REFUSE: 'refuse',              // Paiement refusé
} as const;

export type StatutWorkflow = typeof STATUTS_WORKFLOW[keyof typeof STATUTS_WORKFLOW];

// ===== Mapping statuts par table =====

export const STATUTS_PAR_TABLE = {
  notes_sef: ['brouillon', 'soumis', 'valide', 'rejete', 'differe'] as const,
  notes_dg: ['brouillon', 'soumis', 'valide', 'rejete', 'differe', 'impute'] as const,
  imputations: ['en_attente', 'impute', 'rejete', 'differe'] as const,
  expressions_besoin: ['brouillon', 'soumis', 'valide', 'rejete', 'differe'] as const,
  marches: ['brouillon', 'en_cours', 'attribue', 'infructueux', 'annule'] as const,
  budget_engagements: ['brouillon', 'soumis', 'valide', 'rejete', 'differe'] as const,
  budget_liquidations: ['brouillon', 'soumis', 'valide', 'rejete', 'differe'] as const,
  ordonnancements: ['en_attente', 'vise', 'a_signer', 'signe', 'rejete', 'differe'] as const,
  reglements: ['en_cours', 'paye', 'refuse', 'annule'] as const,
} as const;

// ===== Labels et couleurs =====

export interface StatutConfig {
  label: string;
  color: string;
  bgColor: string;
  icon?: string;
}

export const STATUT_CONFIG: Record<string, StatutConfig> = {
  brouillon: { label: 'Brouillon', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  soumis: { label: 'Soumis', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  en_attente: { label: 'En attente', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  en_cours: { label: 'En cours', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  valide: { label: 'Validé', color: 'text-green-600', bgColor: 'bg-green-100' },
  rejete: { label: 'Rejeté', color: 'text-red-600', bgColor: 'bg-red-100' },
  differe: { label: 'Différé', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  clos: { label: 'Clôturé', color: 'text-gray-800', bgColor: 'bg-gray-200' },
  annule: { label: 'Annulé', color: 'text-red-800', bgColor: 'bg-red-200' },
  impute: { label: 'Imputé', color: 'text-green-600', bgColor: 'bg-green-100' },
  attribue: { label: 'Attribué', color: 'text-green-600', bgColor: 'bg-green-100' },
  infructueux: { label: 'Infructueux', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  vise: { label: 'Visé', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  a_signer: { label: 'À signer', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  signe: { label: 'Signé', color: 'text-green-600', bgColor: 'bg-green-100' },
  paye: { label: 'Payé', color: 'text-green-700', bgColor: 'bg-green-200' },
  refuse: { label: 'Refusé', color: 'text-red-600', bgColor: 'bg-red-100' },
};

// ===== Helpers =====

export function getStatutConfig(statut: string): StatutConfig {
  return STATUT_CONFIG[statut] || { 
    label: statut, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100' 
  };
}

export function getStatutLabel(statut: string): string {
  return STATUT_CONFIG[statut]?.label || statut;
}

export function isStatutTerminal(statut: string): boolean {
  return ['clos', 'annule', 'paye', 'refuse', 'signe'].includes(statut);
}

export function isStatutEnAttente(statut: string): boolean {
  return ['soumis', 'en_attente', 'a_signer'].includes(statut);
}
