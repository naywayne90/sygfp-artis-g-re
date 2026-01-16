/**
 * Types pour le module Notes AEF
 */

export interface NoteAEFEntity {
  id: string;
  numero: string | null;
  reference_pivot: string | null;
  exercice: number | null;
  direction_id: string | null;
  objet: string;
  contenu: string | null;
  priorite: string | null;
  montant_estime: number | null;
  type_depense: string | null;
  justification: string | null;
  statut: string | null;
  rejection_reason: string | null;
  motif_differe: string | null;
  date_differe: string | null;
  deadline_correction: string | null;
  differe_by: string | null;
  validated_by: string | null;
  validated_at: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  imputed_at: string | null;
  imputed_by: string | null;
  budget_line_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Liaison Note SEF
  note_sef_id: string | null;
  dossier_id: string | null;
  // Champs AEF directe
  origin: 'FROM_SEF' | 'DIRECT' | string | null;
  is_direct_aef: boolean;
  beneficiaire_id: string | null;
  ligne_budgetaire_id: string | null;
  os_id: string | null;
  action_id: string | null;
  activite_id: string | null;
  // Relations
  direction?: { id: string; label: string; sigle: string | null };
  created_by_profile?: { id: string; first_name: string | null; last_name: string | null };
  imputed_by_profile?: { id: string; first_name: string | null; last_name: string | null };
  budget_line?: { id: string; code: string; label: string; dotation_initiale: number };
  note_sef?: { id: string; numero: string | null; reference_pivot: string | null; objet: string; dossier_id?: string | null };
}

export interface NoteAEFCounts {
  total: number;
  brouillon: number;
  soumis: number;
  a_valider: number;
  a_imputer: number;
  impute: number;
  differe: number;
  rejete: number;
}

export interface NoteAEFFilters {
  exercice?: number;
  statut?: string | string[];
  direction_id?: string;
  urgence?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ListNotesAEFOptions {
  exercice: number;
  page?: number;
  pageSize?: number;
  search?: string;
  statut?: string | string[];
  direction_id?: string;
  urgence?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'updated_at' | 'created_at' | 'montant_estime';
  sortOrder?: 'asc' | 'desc';
}
