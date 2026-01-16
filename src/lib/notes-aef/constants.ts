/**
 * Notes AEF - Constantes et Machine à États formelle
 * =====================================================
 * Contrat fonctionnel pour le module Notes AEF (Avec Effet Financier)
 */

// ============================================
// STATUTS DE LA NOTE AEF
// ============================================

/**
 * Statuts possibles d'une Note AEF dans son cycle de vie
 */
export const NoteAEFStatut = {
  /** Brouillon - note en cours de rédaction, modifiable */
  DRAFT: 'brouillon',
  /** Soumis - note envoyée pour validation DG */
  SUBMITTED: 'soumis',
  /** À valider - en attente de décision du DG */
  PENDING_VALIDATION: 'a_valider',
  /** À imputer - validée par DG, en attente d'imputation budgétaire */
  TO_IMPUTE: 'a_imputer',
  /** Imputé - imputation budgétaire effectuée */
  IMPUTED: 'impute',
  /** Différée - mise en attente avec conditions de reprise */
  DEFERRED: 'differe',
  /** Rejetée - refusée définitivement */
  REJECTED: 'rejete',
} as const;

export type NoteAEFStatutType = typeof NoteAEFStatut[keyof typeof NoteAEFStatut];

/**
 * Labels français pour les statuts AEF
 */
export const STATUT_LABELS_AEF: Record<NoteAEFStatutType, string> = {
  [NoteAEFStatut.DRAFT]: 'Brouillon',
  [NoteAEFStatut.SUBMITTED]: 'Soumis',
  [NoteAEFStatut.PENDING_VALIDATION]: 'À valider',
  [NoteAEFStatut.TO_IMPUTE]: 'À imputer',
  [NoteAEFStatut.IMPUTED]: 'Imputé',
  [NoteAEFStatut.DEFERRED]: 'Différé',
  [NoteAEFStatut.REJECTED]: 'Rejeté',
};

/**
 * Variantes de badge (couleurs) pour chaque statut AEF
 */
export const STATUT_BADGE_VARIANTS_AEF: Record<NoteAEFStatutType, { className: string; icon?: string }> = {
  [NoteAEFStatut.DRAFT]: { 
    className: 'bg-muted text-muted-foreground', 
    icon: 'FileEdit' 
  },
  [NoteAEFStatut.SUBMITTED]: { 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 
    icon: 'Send' 
  },
  [NoteAEFStatut.PENDING_VALIDATION]: { 
    className: 'bg-warning/10 text-warning border-warning/20', 
    icon: 'Clock' 
  },
  [NoteAEFStatut.TO_IMPUTE]: { 
    className: 'bg-success/10 text-success border-success/20', 
    icon: 'CheckCircle' 
  },
  [NoteAEFStatut.IMPUTED]: { 
    className: 'bg-primary/10 text-primary border-primary/20', 
    icon: 'CreditCard' 
  },
  [NoteAEFStatut.DEFERRED]: { 
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', 
    icon: 'PauseCircle' 
  },
  [NoteAEFStatut.REJECTED]: { 
    className: 'bg-destructive/10 text-destructive border-destructive/20', 
    icon: 'XCircle' 
  },
};

// ============================================
// MACHINE À ÉTATS - TRANSITIONS AUTORISÉES
// ============================================

/**
 * Matrice des transitions de statut autorisées pour Notes AEF
 * Clé = statut actuel, Valeur = statuts cibles possibles
 */
export const STATUT_TRANSITIONS_AEF: Record<NoteAEFStatutType, NoteAEFStatutType[]> = {
  [NoteAEFStatut.DRAFT]: [NoteAEFStatut.SUBMITTED],
  [NoteAEFStatut.SUBMITTED]: [
    NoteAEFStatut.PENDING_VALIDATION,
    NoteAEFStatut.TO_IMPUTE,  // Validation directe
    NoteAEFStatut.REJECTED,
    NoteAEFStatut.DEFERRED,
  ],
  [NoteAEFStatut.PENDING_VALIDATION]: [
    NoteAEFStatut.TO_IMPUTE,
    NoteAEFStatut.REJECTED,
    NoteAEFStatut.DEFERRED,
  ],
  [NoteAEFStatut.TO_IMPUTE]: [
    NoteAEFStatut.IMPUTED,
    NoteAEFStatut.REJECTED,  // Possibilité de rejeter avant imputation
  ],
  [NoteAEFStatut.DEFERRED]: [
    NoteAEFStatut.SUBMITTED,           // Reprise vers soumis
    NoteAEFStatut.PENDING_VALIDATION,  // Reprise directe vers validation
  ],
  [NoteAEFStatut.IMPUTED]: [],   // État final
  [NoteAEFStatut.REJECTED]: [],  // État final
};

/**
 * Vérifie si une transition de statut est valide
 * @param currentStatut - Statut actuel de la note (peut être null pour brouillon)
 * @param targetStatut - Statut cible souhaité
 * @returns true si la transition est autorisée
 */
export function isValidTransitionAEF(
  currentStatut: string | null | undefined,
  targetStatut: string
): boolean {
  // Si statut actuel est null/undefined, considérer comme brouillon
  const current = (currentStatut || NoteAEFStatut.DRAFT) as NoteAEFStatutType;
  const allowedTargets = STATUT_TRANSITIONS_AEF[current];
  
  if (!allowedTargets) {
    console.warn(`[STATE_MACHINE] Statut inconnu: ${current}`);
    return false;
  }
  
  return allowedTargets.includes(targetStatut as NoteAEFStatutType);
}

/**
 * Obtient les transitions possibles depuis un statut donné
 * @param currentStatut - Statut actuel
 * @returns Liste des statuts cibles possibles
 */
export function getAvailableTransitionsAEF(currentStatut: string | null | undefined): NoteAEFStatutType[] {
  const current = (currentStatut || NoteAEFStatut.DRAFT) as NoteAEFStatutType;
  return STATUT_TRANSITIONS_AEF[current] || [];
}

// ============================================
// ACTIONS D'AUDIT
// ============================================

/**
 * Actions traçables dans l'audit des Notes AEF
 */
export const NoteAEFAuditAction = {
  CREATE: 'création',
  UPDATE: 'modification',
  ATTACHMENT_ADD: 'ajout_piece',
  ATTACHMENT_REMOVE: 'suppression_piece',
  SUBMIT: 'soumission',
  VALIDATE: 'validation',
  IMPUTE: 'imputation',
  REJECT: 'rejet',
  DEFER: 'report',
  RESUME: 'reprise', // Pour les notes différées qui reprennent le circuit
  DELETE: 'suppression',
  AUTO_LINK_SEF: 'liaison_sef_auto', // Création automatique de SEF shadow
} as const;

export type NoteAEFAuditActionType = typeof NoteAEFAuditAction[keyof typeof NoteAEFAuditAction];

/**
 * Labels pour les actions d'audit AEF
 */
export const AUDIT_ACTION_LABELS_AEF: Record<NoteAEFAuditActionType, string> = {
  [NoteAEFAuditAction.CREATE]: 'Création',
  [NoteAEFAuditAction.UPDATE]: 'Modification',
  [NoteAEFAuditAction.ATTACHMENT_ADD]: 'Ajout de pièce jointe',
  [NoteAEFAuditAction.ATTACHMENT_REMOVE]: 'Suppression de pièce jointe',
  [NoteAEFAuditAction.SUBMIT]: 'Soumission pour validation',
  [NoteAEFAuditAction.VALIDATE]: 'Validation DG',
  [NoteAEFAuditAction.IMPUTE]: 'Imputation budgétaire',
  [NoteAEFAuditAction.REJECT]: 'Rejet',
  [NoteAEFAuditAction.DEFER]: 'Report',
  [NoteAEFAuditAction.RESUME]: 'Reprise après report',
  [NoteAEFAuditAction.DELETE]: 'Suppression',
  [NoteAEFAuditAction.AUTO_LINK_SEF]: 'Liaison SEF automatique',
};

// ============================================
// RÔLES ET PERMISSIONS
// ============================================

/**
 * Rôles autorisés à valider/rejeter/différer une Note AEF
 */
export const AEF_VALIDATOR_ROLES = ['ADMIN', 'DG'] as const;

/**
 * Rôles autorisés à imputer une Note AEF
 */
export const AEF_IMPUTER_ROLES = ['ADMIN', 'DAAF', 'CB'] as const;

export type AEFValidatorRole = typeof AEF_VALIDATOR_ROLES[number];
export type AEFImputerRole = typeof AEF_IMPUTER_ROLES[number];

// ============================================
// CONFIGURATION DU MODULE
// ============================================

export const NOTES_AEF_CONFIG = {
  /** Taille max des pièces jointes en bytes (10 Mo) */
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024,
  /** Types MIME acceptés pour les pièces jointes */
  ALLOWED_ATTACHMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
  ],
  /** Nombre max de pièces jointes par note */
  MAX_ATTACHMENTS_PER_NOTE: 10,
  /** Bucket Supabase Storage */
  STORAGE_BUCKET: 'notes-aef',
} as const;
