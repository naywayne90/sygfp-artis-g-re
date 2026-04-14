/**
 * Systeme unifie des statuts SYGFP — 7 statuts universels
 *
 * PLUS de brouillon : a la creation, le document est directement soumis.
 * La validation multi-etapes est trackee par `etape_validation` (pas par le statut).
 * Le sens metier de "termine" est porte par `sous_statut`.
 *
 * 7 STATUTS UNIFIES :
 *   soumis | en_validation | valide | rejete | differe | termine | annule
 */

// ============================================
// LES 7 STATUTS UNIFIES
// ============================================

export const STATUTS_UNIFIES = {
  SOUMIS: 'soumis',
  EN_VALIDATION: 'en_validation',
  VALIDE: 'valide',
  REJETE: 'rejete',
  DIFFERE: 'differe',
  TERMINE: 'termine',
  ANNULE: 'annule',
} as const;

export type StatutUnifie = (typeof STATUTS_UNIFIES)[keyof typeof STATUTS_UNIFIES];

// ============================================
// SOUS-STATUTS (sens metier de "termine")
// ============================================

export const SOUS_STATUTS = {
  VALIDE_FINAL: 'valide_final',
  A_IMPUTER: 'a_imputer',
  IMPUTE: 'impute',
  APPROUVE: 'approuve',
  ATTRIBUE: 'attribue',
  ENGAGE: 'engage',
  LIQUIDE: 'liquide',
  SIGNE: 'signe',
  PAYE: 'paye',
  EXECUTE: 'execute',
  CLOTURE: 'cloture',
  SOLDE: 'solde',
} as const;

export type SousStatut = (typeof SOUS_STATUTS)[keyof typeof SOUS_STATUTS];

// ============================================
// MAPPING ANCIEN → NOUVEAU
// ============================================

interface MappingResult {
  statut: StatutUnifie;
  sousStatut?: SousStatut;
  etapeValidation?: number;
}

/**
 * Mappe une ancienne valeur de statut vers le nouveau systeme unifie.
 * Gere TOUTES les valeurs existantes dans la base (y compris accents).
 * "brouillon" est mappe vers "soumis" (plus de brouillon dans le nouveau systeme).
 */
export function mapAncienVersNouveau(ancienStatut: string): MappingResult {
  const normalized = ancienStatut.toLowerCase().trim();

  switch (normalized) {
    // --- Soumis (brouillon supprime — compat: anciens brouillons mappes vers soumis) ---
    case 'brouillon':
    case 'draft':
    case 'soumis':
    case 'submitted':
    case 'transmis':
    case 'certifié_sf':
    case 'certifie_sf':
      return { statut: STATUTS_UNIFIES.SOUMIS };

    // --- En validation ---
    case 'en_attente':
    case 'a_valider':
    case 'en_validation':
    case 'en_validation_dg':
    case 'en_cours':
    case 'en_signature':
    case 'pending':
    case 'visa_saf':
      return { statut: STATUTS_UNIFIES.EN_VALIDATION, etapeValidation: 1 };
    case 'visa_cb':
      return { statut: STATUTS_UNIFIES.EN_VALIDATION, etapeValidation: 2 };
    case 'visa_daaf':
    case 'validé_daaf':
    case 'valide_daaf':
      return { statut: STATUTS_UNIFIES.EN_VALIDATION, etapeValidation: 3 };
    case 'validé_dg':
    case 'valide_dg':
    case 'a_signer':
    case 'vise':
      return { statut: STATUTS_UNIFIES.EN_VALIDATION, etapeValidation: 4 };

    // --- Valide ---
    case 'valide':
    case 'validee':
    case 'approved':
    case 'verifie':
    case 'satisfaite':
      return { statut: STATUTS_UNIFIES.VALIDE };

    // --- Rejete ---
    case 'rejete':
    case 'rejetee':
    case 'rejected':
    case 'refuse':
    case 'refused':
    case 'refusee':
      return { statut: STATUTS_UNIFIES.REJETE };

    // --- Differe ---
    case 'differe':
    case 'differee':
    case 'deferred':
      return { statut: STATUTS_UNIFIES.DIFFERE };

    // --- Termine (avec sous-statut metier) ---
    case 'impute':
    case 'imputee':
      return { statut: STATUTS_UNIFIES.TERMINE, sousStatut: SOUS_STATUTS.IMPUTE };
    case 'a_imputer':
      return { statut: STATUTS_UNIFIES.TERMINE, sousStatut: SOUS_STATUTS.A_IMPUTER };
    case 'attribue':
      return { statut: STATUTS_UNIFIES.TERMINE, sousStatut: SOUS_STATUTS.ATTRIBUE };
    case 'engage':
      return { statut: STATUTS_UNIFIES.TERMINE, sousStatut: SOUS_STATUTS.ENGAGE };
    case 'liquide':
      return { statut: STATUTS_UNIFIES.TERMINE, sousStatut: SOUS_STATUTS.LIQUIDE };
    case 'signe':
    case 'approuve':
      return { statut: STATUTS_UNIFIES.TERMINE, sousStatut: SOUS_STATUTS.SIGNE };
    case 'paye':
      return { statut: STATUTS_UNIFIES.TERMINE, sousStatut: SOUS_STATUTS.PAYE };
    case 'execute':
      return { statut: STATUTS_UNIFIES.TERMINE, sousStatut: SOUS_STATUTS.EXECUTE };
    case 'clos':
    case 'cloture':
    case 'clôturé':
      return { statut: STATUTS_UNIFIES.TERMINE, sousStatut: SOUS_STATUTS.CLOTURE };
    case 'solde':
      return { statut: STATUTS_UNIFIES.TERMINE, sousStatut: SOUS_STATUTS.SOLDE };

    // --- Annule ---
    case 'annule':
    case 'annulee':
    case 'cancelled':
    case 'infructueux':
      return { statut: STATUTS_UNIFIES.ANNULE };

    // --- Fallback ---
    default:
      if (normalized.includes('valid') || normalized.includes('approuv')) {
        return { statut: STATUTS_UNIFIES.VALIDE };
      }
      if (normalized.includes('rejet') || normalized.includes('refus')) {
        return { statut: STATUTS_UNIFIES.REJETE };
      }
      if (
        normalized.includes('attente') ||
        normalized.includes('visa') ||
        normalized.includes('signature')
      ) {
        return { statut: STATUTS_UNIFIES.EN_VALIDATION };
      }
      // Par defaut, soumis (brouillon supprime — creation = soumis)
      return { statut: STATUTS_UNIFIES.SOUMIS };
  }
}

/**
 * Retourne le label utilisateur pour un statut unifie + sous-statut optionnel.
 */
export function getLabelUnifie(statut: StatutUnifie, sousStatut?: string): string {
  if (statut === STATUTS_UNIFIES.TERMINE && sousStatut) {
    return SOUS_STATUT_LABELS[sousStatut as SousStatut] || 'Terminé';
  }
  return STATUT_LABELS_UNIFIES[statut] || statut;
}

// ============================================
// LABELS FRANCAIS
// ============================================

export const STATUT_LABELS_UNIFIES: Record<StatutUnifie, string> = {
  [STATUTS_UNIFIES.SOUMIS]: 'Soumis',
  [STATUTS_UNIFIES.EN_VALIDATION]: 'En validation',
  [STATUTS_UNIFIES.VALIDE]: 'Validé',
  [STATUTS_UNIFIES.REJETE]: 'Rejeté',
  [STATUTS_UNIFIES.DIFFERE]: 'Différé',
  [STATUTS_UNIFIES.TERMINE]: 'Terminé',
  [STATUTS_UNIFIES.ANNULE]: 'Annulé',
};

export const SOUS_STATUT_LABELS: Record<SousStatut, string> = {
  [SOUS_STATUTS.VALIDE_FINAL]: 'Validé',
  [SOUS_STATUTS.A_IMPUTER]: 'À imputer',
  [SOUS_STATUTS.IMPUTE]: 'Imputé',
  [SOUS_STATUTS.APPROUVE]: 'Approuvé',
  [SOUS_STATUTS.ATTRIBUE]: 'Attribué',
  [SOUS_STATUTS.ENGAGE]: 'Engagé',
  [SOUS_STATUTS.LIQUIDE]: 'Liquidé',
  [SOUS_STATUTS.SIGNE]: 'Signé',
  [SOUS_STATUTS.PAYE]: 'Payé',
  [SOUS_STATUTS.EXECUTE]: 'Exécuté',
  [SOUS_STATUTS.CLOTURE]: 'Clôturé',
  [SOUS_STATUTS.SOLDE]: 'Soldé',
};

// ============================================
// ETAPES DE VALIDATION (mapping numero → role)
// ============================================

export const ETAPES_VALIDATION = {
  1: { role: 'DAAF', label: 'Sous-Dir DAAF' },
  2: { role: 'CB', label: 'Contrôleur Budgétaire' },
  3: { role: 'DAAF', label: 'DAAF' },
  4: { role: 'DG', label: 'Directeur Général' },
} as const;

export function getLabelValidation(etapeValidation: number | undefined): string {
  if (!etapeValidation) return '';
  const etape = ETAPES_VALIDATION[etapeValidation as keyof typeof ETAPES_VALIDATION];
  return etape ? etape.label : '';
}

// ============================================
// TRANSITIONS UNIFIEES (sans brouillon)
// ============================================

export const TRANSITIONS_UNIFIEES: Record<StatutUnifie, StatutUnifie[]> = {
  [STATUTS_UNIFIES.SOUMIS]: [
    STATUTS_UNIFIES.EN_VALIDATION,
    STATUTS_UNIFIES.VALIDE,
    STATUTS_UNIFIES.REJETE,
    STATUTS_UNIFIES.DIFFERE,
    STATUTS_UNIFIES.ANNULE,
  ],
  [STATUTS_UNIFIES.EN_VALIDATION]: [
    STATUTS_UNIFIES.VALIDE,
    STATUTS_UNIFIES.REJETE,
    STATUTS_UNIFIES.DIFFERE,
  ],
  [STATUTS_UNIFIES.VALIDE]: [STATUTS_UNIFIES.TERMINE, STATUTS_UNIFIES.ANNULE],
  [STATUTS_UNIFIES.REJETE]: [STATUTS_UNIFIES.SOUMIS], // Correction → resoumission directe
  [STATUTS_UNIFIES.DIFFERE]: [STATUTS_UNIFIES.SOUMIS],
  [STATUTS_UNIFIES.TERMINE]: [], // Terminal
  [STATUTS_UNIFIES.ANNULE]: [], // Terminal
};

/**
 * Verifie si une transition est autorisee dans le systeme unifie.
 */
export function isTransitionAutorisee(from: StatutUnifie, to: StatutUnifie): boolean {
  return TRANSITIONS_UNIFIEES[from]?.includes(to) ?? false;
}

/**
 * Retourne les prochains statuts possibles.
 */
export function getTransitionsPossibles(statut: StatutUnifie): StatutUnifie[] {
  return TRANSITIONS_UNIFIEES[statut] || [];
}

/**
 * Verifie si un statut est terminal (plus de transitions possibles).
 */
export function isTerminal(statut: StatutUnifie): boolean {
  return TRANSITIONS_UNIFIEES[statut]?.length === 0;
}

/**
 * Verifie si un statut necessite une action (badge "a traiter").
 */
export function isATraiter(statut: StatutUnifie): boolean {
  return statut === STATUTS_UNIFIES.SOUMIS || statut === STATUTS_UNIFIES.EN_VALIDATION;
}
