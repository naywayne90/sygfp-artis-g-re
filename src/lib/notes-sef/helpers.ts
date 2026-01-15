/**
 * Notes SEF - Helpers et fonctions utilitaires
 * =============================================
 * Fonctions réutilisables pour le module Notes SEF
 */

import {
  NoteSEFStatut,
  NoteSEFStatutType,
  NoteSEFUrgence,
  NoteSEFUrgenceType,
  BeneficiaireType,
  BeneficiaireTypeValue,
  STATUT_LABELS,
  STATUT_BADGE_VARIANTS,
  URGENCE_LABELS,
  URGENCE_BADGE_VARIANTS,
  BENEFICIAIRE_TYPE_LABELS,
  STATUT_TRANSITIONS,
  VALIDATOR_ROLES,
  ValidatorRole,
  NOTES_SEF_CONFIG,
} from './constants';
import type { NoteSEFEntity, ProfileRef, NoteSEFCounts } from './types';

// ============================================
// LABELS & AFFICHAGE
// ============================================

/**
 * Obtenir le label français d'un statut
 */
export function getStatutLabel(statut: string | null): string {
  return STATUT_LABELS[statut as NoteSEFStatutType] || statut || 'Inconnu';
}

/**
 * Obtenir le label français d'une urgence
 */
export function getUrgenceLabel(urgence: string | null): string {
  return URGENCE_LABELS[urgence as NoteSEFUrgenceType] || urgence || 'Non définie';
}

/**
 * Obtenir le label français d'un type de bénéficiaire
 */
export function getBeneficiaireTypeLabel(type: string | null): string {
  return BENEFICIAIRE_TYPE_LABELS[type as BeneficiaireTypeValue] || 'Non renseigné';
}

/**
 * Obtenir les classes CSS du badge pour un statut
 */
export function getStatutBadgeClassName(statut: string | null): string {
  return STATUT_BADGE_VARIANTS[statut as NoteSEFStatutType]?.className || 
         STATUT_BADGE_VARIANTS[NoteSEFStatut.DRAFT].className;
}

/**
 * Obtenir les classes CSS du badge pour une urgence
 */
export function getUrgenceBadgeClassName(urgence: string | null): string {
  return URGENCE_BADGE_VARIANTS[urgence as NoteSEFUrgenceType]?.className || 
         URGENCE_BADGE_VARIANTS[NoteSEFUrgence.NORMAL].className;
}

// ============================================
// VALIDATION & TRANSITIONS
// ============================================

/**
 * Vérifier si une transition de statut est autorisée
 */
export function isTransitionAllowed(
  currentStatut: NoteSEFStatutType | null, 
  targetStatut: NoteSEFStatutType
): boolean {
  const current = currentStatut || NoteSEFStatut.DRAFT;
  const allowedTargets = STATUT_TRANSITIONS[current] || [];
  return allowedTargets.includes(targetStatut);
}

/**
 * Vérifier si une note peut être modifiée
 */
export function canEditNote(note: NoteSEFEntity): boolean {
  return note.statut === NoteSEFStatut.DRAFT;
}

/**
 * Vérifier si une note peut être soumise
 */
export function canSubmitNote(note: NoteSEFEntity): boolean {
  return note.statut === NoteSEFStatut.DRAFT;
}

/**
 * Vérifier si une note peut être validée/rejetée/différée
 */
export function canDecideOnNote(note: NoteSEFEntity): boolean {
  const decidableStatuts = [
    NoteSEFStatut.SUBMITTED, 
    NoteSEFStatut.PENDING_VALIDATION, 
    NoteSEFStatut.DEFERRED
  ];
  return decidableStatuts.includes(note.statut as typeof decidableStatuts[number]);
}

/**
 * Vérifier si une note peut être supprimée
 */
export function canDeleteNote(note: NoteSEFEntity): boolean {
  return note.statut === NoteSEFStatut.DRAFT;
}

/**
 * Vérifier si un utilisateur a un rôle de validateur
 */
export function isValidator(roles: string[]): boolean {
  return roles.some(role => VALIDATOR_ROLES.includes(role as ValidatorRole));
}

// ============================================
// FORMATAGE
// ============================================

/**
 * Formater le nom complet d'un profil
 */
export function formatProfileName(profile: ProfileRef | null | undefined): string {
  if (!profile) return '—';
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  return fullName || '—';
}

/**
 * Formater la référence d'une note (pivot ou numéro)
 */
export function formatNoteReference(note: NoteSEFEntity): string {
  return note.reference_pivot || note.numero || '—';
}

/**
 * Formater la taille d'un fichier en format lisible
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ============================================
// CALCULS & AGRÉGATIONS
// ============================================

/**
 * Calculer les compteurs par statut à partir d'une liste de notes
 */
export function calculateCounts(notes: NoteSEFEntity[]): NoteSEFCounts {
  const counts: NoteSEFCounts = {
    total: 0,
    brouillon: 0,
    soumis: 0,
    a_valider: 0,
    valide: 0,
    differe: 0,
    rejete: 0,
  };

  for (const note of notes) {
    counts.total++;
    const statut = note.statut || NoteSEFStatut.DRAFT;
    if (statut === 'brouillon') counts.brouillon++;
    else if (statut === 'soumis') counts.soumis++;
    else if (statut === 'a_valider') counts.a_valider++;
    else if (statut === 'valide') counts.valide++;
    else if (statut === 'differe') counts.differe++;
    else if (statut === 'rejete') counts.rejete++;
  }

  return counts;
}

/**
 * Grouper les notes par statut
 */
export function groupByStatut(notes: NoteSEFEntity[]): Record<NoteSEFStatutType, NoteSEFEntity[]> {
  return notes.reduce(
    (acc, note) => {
      const statut = (note.statut as NoteSEFStatutType) || NoteSEFStatut.DRAFT;
      if (!acc[statut]) {
        acc[statut] = [];
      }
      acc[statut].push(note);
      return acc;
    },
    {} as Record<NoteSEFStatutType, NoteSEFEntity[]>
  );
}

/**
 * Déterminer le type de bénéficiaire d'une note
 */
export function getBeneficiaireType(note: NoteSEFEntity): BeneficiaireTypeValue {
  if (note.beneficiaire_id) return BeneficiaireType.EXTERNAL_PROVIDER;
  if (note.beneficiaire_interne_id) return BeneficiaireType.INTERNAL_AGENT;
  return BeneficiaireType.NONE;
}

/**
 * Formater le bénéficiaire d'une note
 */
export function formatBeneficiaire(note: NoteSEFEntity): string {
  if (note.beneficiaire) {
    return note.beneficiaire.raison_sociale;
  }
  if (note.beneficiaire_interne) {
    return formatProfileName(note.beneficiaire_interne);
  }
  return '—';
}

// ============================================
// VALIDATION DES FICHIERS
// ============================================

/**
 * Vérifier si un fichier peut être uploadé (taille, type)
 */
export function validateAttachmentFile(file: File): { valid: boolean; error?: string } {
  if (file.size > NOTES_SEF_CONFIG.MAX_ATTACHMENT_SIZE) {
    return { 
      valid: false, 
      error: `Le fichier dépasse la taille maximale de ${NOTES_SEF_CONFIG.MAX_ATTACHMENT_SIZE / (1024 * 1024)} Mo` 
    };
  }
  
  const allowedTypes: readonly string[] = NOTES_SEF_CONFIG.ALLOWED_ATTACHMENT_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Type de fichier non autorisé: ${file.type}` 
    };
  }
  
  return { valid: true };
}
