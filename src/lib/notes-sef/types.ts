/**
 * Notes SEF - Types TypeScript
 * ============================
 * Types partagés pour le module Notes SEF
 */

import { NoteSEFStatutType, NoteSEFUrgenceType, BeneficiaireTypeValue, NoteSEFAuditActionType } from './constants';

// ============================================
// ENTITÉS PRINCIPALES
// ============================================

/**
 * Entité Note SEF complète (avec relations)
 */
export interface NoteSEFEntity {
  id: string;
  numero: string | null;
  reference_pivot: string | null;
  exercice: number;
  direction_id: string | null;
  demandeur_id: string | null;
  beneficiaire_id: string | null;
  beneficiaire_interne_id: string | null;
  objet: string;
  description: string | null;
  justification: string | null;
  date_souhaitee: string | null;
  urgence: NoteSEFUrgenceType | null;
  commentaire: string | null;
  statut: NoteSEFStatutType | null;
  
  // Champs de rejet
  rejection_reason: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  
  // Champs de report (différé)
  differe_motif: string | null;
  differe_condition: string | null;
  differe_date_reprise: string | null;
  differe_by: string | null;
  differe_at: string | null;
  
  // Champs de validation
  validated_by: string | null;
  validated_at: string | null;
  
  // Champs de soumission
  submitted_by: string | null;
  submitted_at: string | null;
  
  // Métadonnées
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Lien vers le dossier créé après validation
  dossier_id?: string | null;
  
  // Relations (peuplées par les requêtes)
  direction?: DirectionRef | null;
  demandeur?: ProfileRef | null;
  beneficiaire?: PrestataireRef | null;
  beneficiaire_interne?: ProfileRef | null;
  created_by_profile?: ProfileRef | null;
  dossier?: DossierRef | null;
}

/**
 * Référence vers une Direction
 */
export interface DirectionRef {
  id: string;
  label: string;
  sigle: string | null;
  code?: string;
}

/**
 * Référence vers un Profil utilisateur
 */
export interface ProfileRef {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string;
}

/**
 * Référence vers un Prestataire
 */
export interface PrestataireRef {
  id: string;
  raison_sociale: string;
}

/**
 * Référence vers un Dossier
 */
export interface DossierRef {
  id: string;
  numero: string;
  statut_global: string | null;
}

// ============================================
// PIÈCES JOINTES
// ============================================

/**
 * Pièce jointe d'une Note SEF
 */
export interface NoteSEFPiece {
  id: string;
  note_id: string;
  fichier_url: string;
  nom: string;
  type_fichier: string | null;
  taille: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  uploader?: ProfileRef | null;
}

// ============================================
// HISTORIQUE / AUDIT
// ============================================

/**
 * Entrée d'historique pour une Note SEF
 */
export interface NoteSEFHistoryEntry {
  id: string;
  note_id: string;
  action: NoteSEFAuditActionType;
  old_statut: NoteSEFStatutType | null;
  new_statut: NoteSEFStatutType | null;
  commentaire: string | null;
  performed_by: string | null;
  performed_at: string;
  performer?: ProfileRef | null;
  metadata?: Record<string, unknown> | null;
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

/**
 * Données pour créer une Note SEF
 */
export interface CreateNoteSEFDTO {
  objet: string;
  description?: string | null;
  justification: string;
  direction_id: string;
  demandeur_id: string;
  beneficiaire_id?: string | null;
  beneficiaire_interne_id?: string | null;
  urgence: NoteSEFUrgenceType;
  date_souhaitee: string;
  commentaire?: string | null;
}

/**
 * Données pour mettre à jour une Note SEF
 */
export interface UpdateNoteSEFDTO extends Partial<CreateNoteSEFDTO> {
  id: string;
}

/**
 * Données pour rejeter une Note SEF
 */
export interface RejectNoteSEFDTO {
  noteId: string;
  motif: string;
}

/**
 * Données pour différer une Note SEF
 */
export interface DeferNoteSEFDTO {
  noteId: string;
  motif: string;
  condition?: string;
  dateReprise?: string;
}

/**
 * Données pour ajouter une pièce jointe
 */
export interface AddAttachmentDTO {
  noteId: string;
  file: File;
}

// ============================================
// FILTRES & COMPTEURS
// ============================================

/**
 * Filtres de recherche pour les Notes SEF
 */
export interface NoteSEFFilters {
  exercice?: number;
  statut?: NoteSEFStatutType | NoteSEFStatutType[];
  urgence?: NoteSEFUrgenceType;
  direction_id?: string;
  demandeur_id?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Compteurs par statut
 */
export interface NoteSEFCounts {
  total: number;
  brouillon: number;
  soumis: number;
  a_valider: number;
  valide: number;
  differe: number;
  rejete: number;
}

// ============================================
// RÉSULTATS DE SERVICE
// ============================================

/**
 * Résultat d'une opération de service
 */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
