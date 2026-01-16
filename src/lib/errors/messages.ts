// ============================================
// MESSAGES D'ERREUR CENTRALISÉS (FRANÇAIS)
// ============================================

export const ERROR_MESSAGES = {
  // Authentification
  NOT_AUTHENTICATED: "Vous devez être connecté pour effectuer cette action",
  SESSION_EXPIRED: "Votre session a expiré, veuillez vous reconnecter",
  
  // Autorisation
  NOT_AUTHORIZED: "Vous n'êtes pas autorisé à effectuer cette action",
  ROLE_REQUIRED: (role: string) => `Cette action nécessite le rôle "${role}"`,
  PERMISSION_DENIED: "Permission refusée",
  
  // Notes
  NOTE_NOT_FOUND: "Note introuvable",
  NOTE_ALREADY_SUBMITTED: "Cette note a déjà été soumise",
  NOTE_ALREADY_VALIDATED: "Cette note a déjà été validée",
  NOTE_CANNOT_BE_MODIFIED: "Cette note ne peut plus être modifiée dans son état actuel",
  
  // Statuts
  INVALID_STATUS: "Cette action n'est pas possible dans le statut actuel",
  STATUS_TRANSITION_FORBIDDEN: (from: string, to: string) => 
    `Transition de "${from}" vers "${to}" non autorisée`,
  
  // Champs
  REQUIRED_FIELD: (field: string) => `Le champ "${field}" est obligatoire`,
  INVALID_FIELD: (field: string) => `Le champ "${field}" est invalide`,
  FIELD_TOO_LONG: (field: string, max: number) => 
    `Le champ "${field}" ne peut dépasser ${max} caractères`,
  FIELD_TOO_SHORT: (field: string, min: number) => 
    `Le champ "${field}" doit contenir au moins ${min} caractères`,
  
  // Montants / Budget
  INSUFFICIENT_BUDGET: "Crédit insuffisant sur cette ligne budgétaire",
  AMOUNT_EXCEEDS_AVAILABLE: (available: number) => 
    `Le montant dépasse le disponible (${available.toLocaleString('fr-FR')} FCFA)`,
  INVALID_AMOUNT: "Le montant doit être un nombre positif",
  
  // Entités liées
  SEF_NOT_VALIDATED: "La Note SEF doit être validée avant de créer une Note AEF",
  AEF_REQUIRED: "Une Note AEF est requise pour cette action",
  ENGAGEMENT_NOT_FOUND: "Engagement introuvable",
  LIQUIDATION_NOT_FOUND: "Liquidation introuvable",
  
  // Imputation
  ALREADY_IMPUTED: "Cette note a déjà été imputée",
  IMPUTATION_FAILED: "Échec de l'imputation budgétaire",
  
  // Exercice
  EXERCICE_CLOSED: "L'exercice sélectionné est clôturé",
  EXERCICE_NOT_ACTIVE: "Aucun exercice actif. Veuillez en sélectionner un.",
  
  // Réseau
  NETWORK_ERROR: "Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.",
  TIMEOUT_ERROR: "La requête a pris trop de temps. Veuillez réessayer.",
  SERVER_ERROR: "Erreur serveur. Veuillez réessayer ultérieurement.",
  
  // Générique
  UNKNOWN_ERROR: "Une erreur inattendue s'est produite",
  OPERATION_FAILED: "L'opération a échoué",
  SAVE_FAILED: "Échec de l'enregistrement",
  DELETE_FAILED: "Échec de la suppression",
  LOAD_FAILED: "Échec du chargement des données",
  
  // Validation
  VALIDATION_FAILED: "Veuillez corriger les erreurs avant de continuer",
  DUPLICATE_ENTRY: "Cette entrée existe déjà",
  
  // Séparation des tâches
  SEPARATION_OF_DUTIES: "Vous ne pouvez pas valider une action que vous avez initiée",
  SAME_USER_FORBIDDEN: "L'initiateur et le valideur doivent être différents",
} as const;

/**
 * Messages de succès centralisés
 */
export const SUCCESS_MESSAGES = {
  // Notes
  NOTE_CREATED: "Note créée avec succès",
  NOTE_UPDATED: "Note mise à jour avec succès",
  NOTE_SUBMITTED: "Note soumise avec succès",
  NOTE_VALIDATED: "Note validée avec succès",
  NOTE_REJECTED: "Note rejetée",
  NOTE_DEFERRED: "Note différée",
  NOTE_DELETED: "Note supprimée avec succès",
  
  // Imputation
  IMPUTATION_SUCCESS: "Imputation réalisée avec succès",
  
  // Général
  SAVE_SUCCESS: "Enregistrement réussi",
  DELETE_SUCCESS: "Suppression réussie",
  OPERATION_SUCCESS: "Opération réussie",
  
  // Export
  EXPORT_SUCCESS: "Export généré avec succès",
  
  // Workflow
  ENGAGEMENT_CREATED: "Engagement créé avec succès",
  LIQUIDATION_CREATED: "Liquidation créée avec succès",
  ORDONNANCEMENT_CREATED: "Ordonnancement créé avec succès",
  REGLEMENT_CREATED: "Règlement créé avec succès",
} as const;

/**
 * Utilitaire pour formater une erreur Supabase
 */
export function formatSupabaseError(error: unknown): string {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;
  
  const err = error as { message?: string; code?: string; details?: string };
  
  // Erreurs RLS courantes
  if (err.code === '42501' || err.message?.includes('row-level security')) {
    return ERROR_MESSAGES.NOT_AUTHORIZED;
  }
  
  // Violation de contrainte unique
  if (err.code === '23505') {
    return ERROR_MESSAGES.DUPLICATE_ENTRY;
  }
  
  // Violation de clé étrangère
  if (err.code === '23503') {
    return "Référence invalide vers une entité inexistante";
  }
  
  // Erreur de réseau
  if (err.message?.includes('network') || err.message?.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  // Message personnalisé si disponible
  if (err.message) {
    return err.message;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
