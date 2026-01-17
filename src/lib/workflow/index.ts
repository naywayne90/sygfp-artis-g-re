/**
 * Module workflow centralisé
 * 
 * Exporte toutes les constantes et helpers pour la chaîne de la dépense.
 */

// Statuts
export {
  STATUTS_WORKFLOW,
  STATUTS_PAR_TABLE,
  STATUT_CONFIG,
  getStatutConfig,
  getStatutLabel,
  isStatutTerminal,
  isStatutEnAttente,
  type StatutWorkflow,
  type StatutConfig,
} from './statuts';

// Paniers
export {
  PANIERS_CONFIG,
  getPaniersForRole,
  getAllPaniers,
  getPanierById,
  type PanierConfig,
  type RolePaniers,
} from './paniers';

// ===== Étapes de la chaîne =====

export const ETAPES_CHAINE = [
  { step: 1, code: 'SEF', label: 'Note SEF', table: 'notes_sef', route: '/notes-sef' },
  { step: 2, code: 'AEF', label: 'Note AEF', table: 'notes_dg', route: '/notes-aef' },
  { step: 3, code: 'IMP', label: 'Imputation', table: 'imputations', route: '/execution/imputation' },
  { step: 4, code: 'EXB', label: 'Expression Besoin', table: 'expressions_besoin', route: '/execution/expression-besoin' },
  { step: 5, code: 'PM', label: 'Passation Marché', table: 'marches', route: '/marches', optional: true },
  { step: 6, code: 'ENG', label: 'Engagement', table: 'budget_engagements', route: '/engagements' },
  { step: 7, code: 'LIQ', label: 'Liquidation', table: 'budget_liquidations', route: '/liquidations' },
  { step: 8, code: 'ORD', label: 'Ordonnancement', table: 'ordonnancements', route: '/ordonnancements' },
  { step: 9, code: 'REG', label: 'Règlement', table: 'reglements', route: '/reglements' },
] as const;

export type EtapeCode = typeof ETAPES_CHAINE[number]['code'];

export function getEtapeByCode(code: EtapeCode) {
  return ETAPES_CHAINE.find(e => e.code === code);
}

export function getEtapeByStep(step: number) {
  return ETAPES_CHAINE.find(e => e.step === step);
}

export function getNextEtape(currentCode: EtapeCode) {
  const current = getEtapeByCode(currentCode);
  if (!current) return undefined;
  return ETAPES_CHAINE.find(e => e.step === current.step + 1);
}

export function getPreviousEtape(currentCode: EtapeCode) {
  const current = getEtapeByCode(currentCode);
  if (!current) return undefined;
  return ETAPES_CHAINE.find(e => e.step === current.step - 1);
}
