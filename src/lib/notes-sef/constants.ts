/**
 * Notes SEF - Constantes et énumérations normalisées
 * =====================================================
 * Contrat fonctionnel pour le module Notes SEF (Sans Effet Financier)
 */

// ============================================
// STATUTS DE LA NOTE SEF
// ============================================

/**
 * Statuts possibles d'une Note SEF dans son cycle de vie
 */
export const NoteSEFStatut = {
  /** Brouillon - note en cours de rédaction, modifiable */
  DRAFT: 'brouillon',
  /** Soumis - note envoyée pour examen */
  SUBMITTED: 'soumis',
  /** À valider - en attente de décision du validateur */
  PENDING_VALIDATION: 'a_valider',
  /** Validée - approuvée par le validateur (DG, DAAF) */
  APPROVED: 'valide',
  /** Différée - mise en attente avec conditions de reprise */
  DEFERRED: 'differe',
  /** Rejetée - refusée définitivement */
  REJECTED: 'rejete',
} as const;

export type NoteSEFStatutType = typeof NoteSEFStatut[keyof typeof NoteSEFStatut];

/**
 * Labels français pour les statuts
 */
export const STATUT_LABELS: Record<NoteSEFStatutType, string> = {
  [NoteSEFStatut.DRAFT]: 'Brouillon',
  [NoteSEFStatut.SUBMITTED]: 'Soumis',
  [NoteSEFStatut.PENDING_VALIDATION]: 'À valider',
  [NoteSEFStatut.APPROVED]: 'Validée',
  [NoteSEFStatut.DEFERRED]: 'Différée',
  [NoteSEFStatut.REJECTED]: 'Rejetée',
};

/**
 * Variantes de badge (couleurs) pour chaque statut
 */
export const STATUT_BADGE_VARIANTS: Record<NoteSEFStatutType, { className: string; icon?: string }> = {
  [NoteSEFStatut.DRAFT]: { 
    className: 'bg-muted text-muted-foreground', 
    icon: 'FileEdit' 
  },
  [NoteSEFStatut.SUBMITTED]: { 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 
    icon: 'Send' 
  },
  [NoteSEFStatut.PENDING_VALIDATION]: { 
    className: 'bg-warning/10 text-warning border-warning/20', 
    icon: 'Clock' 
  },
  [NoteSEFStatut.APPROVED]: { 
    className: 'bg-success/10 text-success border-success/20', 
    icon: 'CheckCircle' 
  },
  [NoteSEFStatut.DEFERRED]: { 
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', 
    icon: 'PauseCircle' 
  },
  [NoteSEFStatut.REJECTED]: { 
    className: 'bg-destructive/10 text-destructive border-destructive/20', 
    icon: 'XCircle' 
  },
};

// ============================================
// URGENCE
// ============================================

/**
 * Niveaux d'urgence pour une Note SEF
 * Extensible : ajouter ici les nouveaux niveaux si nécessaire
 */
export const NoteSEFUrgence = {
  /** Basse - pas de contrainte de temps */
  LOW: 'basse',
  /** Normale - délai standard */
  NORMAL: 'normale',
  /** Haute - à traiter en priorité */
  HIGH: 'haute',
  /** Urgente - traitement immédiat requis */
  URGENT: 'urgente',
} as const;

export type NoteSEFUrgenceType = typeof NoteSEFUrgence[keyof typeof NoteSEFUrgence];

/**
 * Labels français pour les niveaux d'urgence
 */
export const URGENCE_LABELS: Record<NoteSEFUrgenceType, string> = {
  [NoteSEFUrgence.LOW]: 'Basse',
  [NoteSEFUrgence.NORMAL]: 'Normale',
  [NoteSEFUrgence.HIGH]: 'Haute',
  [NoteSEFUrgence.URGENT]: 'Urgente',
};

/**
 * Variantes de badge pour l'urgence
 */
export const URGENCE_BADGE_VARIANTS: Record<NoteSEFUrgenceType, { className: string }> = {
  [NoteSEFUrgence.LOW]: { className: 'bg-muted text-muted-foreground' },
  [NoteSEFUrgence.NORMAL]: { className: 'bg-secondary text-secondary-foreground' },
  [NoteSEFUrgence.HIGH]: { className: 'bg-warning text-warning-foreground' },
  [NoteSEFUrgence.URGENT]: { className: 'bg-destructive text-destructive-foreground' },
};

// ============================================
// TYPE DE BÉNÉFICIAIRE
// ============================================

/**
 * Types de bénéficiaire pour une Note SEF
 */
export const BeneficiaireType = {
  /** Aucun bénéficiaire */
  NONE: 'none',
  /** Prestataire externe (table prestataires) */
  EXTERNAL_PROVIDER: 'externe',
  /** Agent interne ARTI (table profiles) */
  INTERNAL_AGENT: 'interne',
} as const;

export type BeneficiaireTypeValue = typeof BeneficiaireType[keyof typeof BeneficiaireType];

/**
 * Labels français pour les types de bénéficiaire
 */
export const BENEFICIAIRE_TYPE_LABELS: Record<BeneficiaireTypeValue, string> = {
  [BeneficiaireType.NONE]: 'Non renseigné',
  [BeneficiaireType.EXTERNAL_PROVIDER]: 'Prestataire externe',
  [BeneficiaireType.INTERNAL_AGENT]: 'Agent ARTI interne',
};

// ============================================
// ACTIONS D'AUDIT
// ============================================

/**
 * Actions traçables dans l'audit des Notes SEF
 */
export const NoteSEFAuditAction = {
  CREATE: 'création',
  UPDATE: 'modification',
  ATTACHMENT_ADD: 'ajout_piece',
  ATTACHMENT_REMOVE: 'suppression_piece',
  SUBMIT: 'soumission',
  VALIDATE: 'validation',
  REJECT: 'rejet',
  DEFER: 'report',
  RESUME: 'reprise', // Pour les notes différées qui reprennent le circuit
  DELETE: 'suppression',
} as const;

export type NoteSEFAuditActionType = typeof NoteSEFAuditAction[keyof typeof NoteSEFAuditAction];

/**
 * Labels pour les actions d'audit
 */
export const AUDIT_ACTION_LABELS: Record<NoteSEFAuditActionType, string> = {
  [NoteSEFAuditAction.CREATE]: 'Création',
  [NoteSEFAuditAction.UPDATE]: 'Modification',
  [NoteSEFAuditAction.ATTACHMENT_ADD]: 'Ajout de pièce jointe',
  [NoteSEFAuditAction.ATTACHMENT_REMOVE]: 'Suppression de pièce jointe',
  [NoteSEFAuditAction.SUBMIT]: 'Soumission pour validation',
  [NoteSEFAuditAction.VALIDATE]: 'Validation',
  [NoteSEFAuditAction.REJECT]: 'Rejet',
  [NoteSEFAuditAction.DEFER]: 'Report',
  [NoteSEFAuditAction.RESUME]: 'Reprise après report',
  [NoteSEFAuditAction.DELETE]: 'Suppression',
};

// ============================================
// RÔLES VALIDATEURS
// ============================================

/**
 * Rôles autorisés à valider/rejeter/différer une Note SEF
 */
export const VALIDATOR_ROLES = ['ADMIN', 'DG', 'DAAF'] as const;

export type ValidatorRole = typeof VALIDATOR_ROLES[number];

// ============================================
// TRANSITIONS DE STATUT AUTORISÉES
// ============================================

/**
 * Matrice des transitions de statut autorisées
 * Clé = statut actuel, Valeur = statuts cibles possibles
 */
export const STATUT_TRANSITIONS: Record<NoteSEFStatutType, NoteSEFStatutType[]> = {
  [NoteSEFStatut.DRAFT]: [NoteSEFStatut.SUBMITTED],
  [NoteSEFStatut.SUBMITTED]: [NoteSEFStatut.PENDING_VALIDATION, NoteSEFStatut.APPROVED, NoteSEFStatut.REJECTED, NoteSEFStatut.DEFERRED],
  [NoteSEFStatut.PENDING_VALIDATION]: [NoteSEFStatut.APPROVED, NoteSEFStatut.REJECTED, NoteSEFStatut.DEFERRED],
  [NoteSEFStatut.DEFERRED]: [NoteSEFStatut.APPROVED, NoteSEFStatut.PENDING_VALIDATION], // Peut être reprise ou validée
  [NoteSEFStatut.APPROVED]: [], // État final
  [NoteSEFStatut.REJECTED]: [], // État final
};

// ============================================
// CONFIGURATION DU MODULE
// ============================================

export const NOTES_SEF_CONFIG = {
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
  /** 
   * Référence pivot - format ARTI01YYNNNN
   * - ARTI : préfixe organisme
   * - 01 : code module Note SEF
   * - YY : 2 derniers chiffres de l'exercice (ex: 2026 → 26)
   * - NNNN : compteur séquentiel par exercice (0001, 0002, ...)
   * Exemple : ARTI01260001 pour la 1ère note de l'exercice 2026
   * 
   * La génération est faite côté DB via trigger BEFORE INSERT
   */
  REFERENCE_PREFIX: 'ARTI',
  /** Code module pour la séquence (table reference_sequences) */
  MODULE_CODE: '01',
  /** Bucket Supabase Storage */
  STORAGE_BUCKET: 'notes-sef',
} as const;

// ============================================
// FORMAT DE RÉFÉRENCE PIVOT
// ============================================

/**
 * Parse une référence pivot ARTI01YYNNNN
 * @param ref - La référence à parser (ex: "ARTI01260001")
 * @returns Les composants de la référence ou null si format invalide
 */
export function parseReferencePivot(ref: string): {
  prefix: string;
  moduleCode: string;
  year: number;
  sequence: number;
} | null {
  // Format attendu : ARTI01YYNNNN (12 caractères)
  const match = ref.match(/^(ARTI)(01)(\d{2})(\d{4})$/);
  if (!match) return null;
  
  return {
    prefix: match[1],
    moduleCode: match[2],
    year: 2000 + parseInt(match[3], 10),
    sequence: parseInt(match[4], 10),
  };
}

/**
 * Formate une référence pivot pour affichage
 * @param ref - La référence brute
 * @returns Référence formatée ou la valeur originale
 */
export function formatReferencePivot(ref: string | null | undefined): string {
  if (!ref) return '—';
  // La référence est déjà au bon format, on peut juste la retourner
  return ref;
}
