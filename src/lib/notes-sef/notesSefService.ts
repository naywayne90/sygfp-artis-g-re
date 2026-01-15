/**
 * Notes SEF - Service d'accès aux données
 * =========================================
 * Couche d'abstraction pour les opérations CRUD et métier
 * 
 * NOTE: Ce service contient des placeholders pour une évolution future.
 * L'UI existante utilise actuellement useNotesSEF() qui fonctionne correctement.
 * Ce service sera progressivement intégré sans casser l'existant.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  NoteSEFEntity,
  NoteSEFPiece,
  NoteSEFHistoryEntry,
  NoteSEFFilters,
  NoteSEFCounts,
  CreateNoteSEFDTO,
  UpdateNoteSEFDTO,
  RejectNoteSEFDTO,
  DeferNoteSEFDTO,
  AddAttachmentDTO,
  ServiceResult,
  PaginatedResult,
} from './types';
import { NoteSEFStatut, NOTES_SEF_CONFIG } from './constants';
import { calculateCounts } from './helpers';

// ============================================
// SERVICE SINGLETON
// ============================================

/**
 * Service centralisé pour la gestion des Notes SEF
 * Fournit une interface propre entre l'UI et Supabase
 */
export const notesSefService = {
  // ============================================
  // LECTURE
  // ============================================

  /**
   * Récupérer toutes les notes SEF pour un exercice
   * @placeholder Implémentation complète dans useNotesSEF
   */
  async list(filters: NoteSEFFilters = {}): Promise<ServiceResult<NoteSEFEntity[]>> {
    try {
      let query = supabase
        .from('notes_sef')
        .select(`
          *,
          direction:directions(id, label, sigle),
          demandeur:profiles!demandeur_id(id, first_name, last_name),
          beneficiaire:prestataires!beneficiaire_id(id, raison_sociale),
          beneficiaire_interne:profiles!beneficiaire_interne_id(id, first_name, last_name),
          created_by_profile:profiles!created_by(id, first_name, last_name),
          dossier:dossiers!dossier_id(id, numero, statut_global)
        `)
        .order('created_at', { ascending: false });

      if (filters.exercice) {
        query = query.eq('exercice', filters.exercice);
      }
      if (filters.statut) {
        if (Array.isArray(filters.statut)) {
          query = query.in('statut', filters.statut);
        } else {
          query = query.eq('statut', filters.statut);
        }
      }
      if (filters.direction_id) {
        query = query.eq('direction_id', filters.direction_id);
      }
      if (filters.demandeur_id) {
        query = query.eq('demandeur_id', filters.demandeur_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data: data as unknown as NoteSEFEntity[] };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Récupérer les compteurs par statut
   */
  async getCounts(exercice: number): Promise<ServiceResult<NoteSEFCounts>> {
    try {
      const { data, error } = await supabase
        .from('notes_sef')
        .select('statut')
        .eq('exercice', exercice);

      if (error) throw error;

      const counts = calculateCounts(data as unknown as NoteSEFEntity[]);
      return { success: true, data: counts };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Récupérer une note par ID
   */
  async getById(id: string): Promise<ServiceResult<NoteSEFEntity>> {
    try {
      const { data, error } = await supabase
        .from('notes_sef')
        .select(`
          *,
          direction:directions(id, label, sigle, code),
          demandeur:profiles!demandeur_id(id, first_name, last_name, email),
          beneficiaire:prestataires!beneficiaire_id(id, raison_sociale),
          beneficiaire_interne:profiles!beneficiaire_interne_id(id, first_name, last_name),
          created_by_profile:profiles!created_by(id, first_name, last_name),
          dossier:dossiers!dossier_id(id, numero, statut_global)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data: data as unknown as NoteSEFEntity };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // ============================================
  // ÉCRITURE
  // ============================================

  /**
   * Créer une nouvelle note SEF (brouillon)
   * @placeholder Géré par useNotesSEF.createNote
   */
  async createDraft(dto: CreateNoteSEFDTO, exercice: number): Promise<ServiceResult<NoteSEFEntity>> {
    // Placeholder - la logique réelle est dans useNotesSEF
    console.log('[notesSefService] createDraft called', { dto, exercice });
    return { success: false, error: 'Utiliser useNotesSEF().createNote à la place' };
  },

  /**
   * Mettre à jour une note SEF
   * @placeholder Géré par useNotesSEF.updateNote
   */
  async update(dto: UpdateNoteSEFDTO): Promise<ServiceResult<NoteSEFEntity>> {
    console.log('[notesSefService] update called', dto);
    return { success: false, error: 'Utiliser useNotesSEF().updateNote à la place' };
  },

  // ============================================
  // WORKFLOW
  // ============================================

  /**
   * Soumettre une note pour validation
   * @placeholder Géré par useNotesSEF.submitNote
   */
  async submit(noteId: string): Promise<ServiceResult<NoteSEFEntity>> {
    console.log('[notesSefService] submit called', noteId);
    return { success: false, error: 'Utiliser useNotesSEF().submitNote à la place' };
  },

  /**
   * Valider une note
   * @placeholder Géré par useNotesSEF.validateNote
   */
  async approve(noteId: string): Promise<ServiceResult<NoteSEFEntity>> {
    console.log('[notesSefService] approve called', noteId);
    return { success: false, error: 'Utiliser useNotesSEF().validateNote à la place' };
  },

  /**
   * Rejeter une note
   * @placeholder Géré par useNotesSEF.rejectNote
   */
  async reject(dto: RejectNoteSEFDTO): Promise<ServiceResult<NoteSEFEntity>> {
    console.log('[notesSefService] reject called', dto);
    return { success: false, error: 'Utiliser useNotesSEF().rejectNote à la place' };
  },

  /**
   * Différer une note
   * @placeholder Géré par useNotesSEF.deferNote
   */
  async defer(dto: DeferNoteSEFDTO): Promise<ServiceResult<NoteSEFEntity>> {
    console.log('[notesSefService] defer called', dto);
    return { success: false, error: 'Utiliser useNotesSEF().deferNote à la place' };
  },

  // ============================================
  // PIÈCES JOINTES
  // ============================================

  /**
   * Récupérer les pièces jointes d'une note
   */
  async getAttachments(noteId: string): Promise<ServiceResult<NoteSEFPiece[]>> {
    try {
      const { data, error } = await supabase
        .from('notes_sef_pieces')
        .select(`
          *,
          uploader:profiles!uploaded_by(id, first_name, last_name)
        `)
        .eq('note_id', noteId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data as unknown as NoteSEFPiece[] };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Uploader une pièce jointe
   * @placeholder Géré par NoteSEFForm et NoteSEFDetails
   */
  async uploadAttachment(dto: AddAttachmentDTO): Promise<ServiceResult<NoteSEFPiece>> {
    console.log('[notesSefService] uploadAttachment called', dto);
    return { success: false, error: 'Upload géré par les composants UI' };
  },

  /**
   * Supprimer une pièce jointe
   */
  async deleteAttachment(pieceId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('notes_sef_pieces')
        .delete()
        .eq('id', pieceId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // ============================================
  // HISTORIQUE
  // ============================================

  /**
   * Récupérer l'historique d'une note
   */
  async getHistory(noteId: string): Promise<ServiceResult<NoteSEFHistoryEntry[]>> {
    try {
      const { data, error } = await supabase
        .from('notes_sef_history')
        .select(`
          *,
          performer:profiles!performed_by(id, first_name, last_name)
        `)
        .eq('note_id', noteId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data as unknown as NoteSEFHistoryEntry[] };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // ============================================
  // EXPORT
  // ============================================

  /**
   * Exporter les notes au format Excel
   * @placeholder Géré par useExport
   */
  async exportToExcel(filters: NoteSEFFilters): Promise<ServiceResult<Blob>> {
    console.log('[notesSefService] exportToExcel called', filters);
    return { success: false, error: 'Utiliser useExport() à la place' };
  },
};

// Export par défaut pour compatibilité
export default notesSefService;
