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
// TYPES POUR LA PAGINATION
// ============================================

export interface ListNotesOptions {
  exercice: number;
  page?: number;
  pageSize?: number;
  search?: string;
  statut?: string | string[];
  sortBy?: 'updated_at' | 'created_at' | 'date_souhaitee';
  sortOrder?: 'asc' | 'desc';
}

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
   * Récupérer les notes SEF paginées avec recherche serveur-side
   * @param options Options de recherche et pagination
   */
  async listPaginated(options: ListNotesOptions): Promise<ServiceResult<PaginatedResult<NoteSEFEntity>>> {
    try {
      const {
        exercice,
        page = 1,
        pageSize = 20,
        search,
        statut,
        sortBy = 'updated_at',
        sortOrder = 'desc'
      } = options;

      // 1. D'abord compter le total (avec les mêmes filtres)
      let countQuery = supabase
        .from('notes_sef')
        .select('id', { count: 'exact', head: true })
        .eq('exercice', exercice);

      // Filtre par statut
      if (statut) {
        if (Array.isArray(statut)) {
          countQuery = countQuery.in('statut', statut);
        } else {
          countQuery = countQuery.eq('statut', statut);
        }
      }

      // Filtre par recherche (full-text sur plusieurs champs via ilike)
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        countQuery = countQuery.or(
          `reference_pivot.ilike.${searchTerm},numero.ilike.${searchTerm},objet.ilike.${searchTerm}`
        );
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;

      // 2. Récupérer les données paginées
      let dataQuery = supabase
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
        .eq('exercice', exercice)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + pageSize - 1);

      // Filtre par statut
      if (statut) {
        if (Array.isArray(statut)) {
          dataQuery = dataQuery.in('statut', statut);
        } else {
          dataQuery = dataQuery.eq('statut', statut);
        }
      }

      // Filtre par recherche
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        dataQuery = dataQuery.or(
          `reference_pivot.ilike.${searchTerm},numero.ilike.${searchTerm},objet.ilike.${searchTerm}`
        );
      }

      const { data, error } = await dataQuery;
      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as unknown as NoteSEFEntity[],
          total,
          page,
          pageSize,
          totalPages
        }
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Récupérer les compteurs par statut pour un exercice
   */
  async getCounts(exercice: number): Promise<ServiceResult<NoteSEFCounts>> {
    try {
      const { data, error } = await supabase
        .from('notes_sef')
        .select('statut')
        .eq('exercice', exercice);

      if (error) throw error;

      const counts: NoteSEFCounts = {
        total: 0,
        brouillon: 0,
        soumis: 0,
        a_valider: 0,
        valide: 0,
        differe: 0,
        rejete: 0,
      };

      for (const note of data || []) {
        counts.total++;
        const statut = note.statut || 'brouillon';
        if (statut in counts) {
          (counts as any)[statut]++;
        }
      }

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
   * Créer une nouvelle note SEF (brouillon) avec pièces jointes
   * @param dto Données de la note
   * @param exercice Année d'exercice
   * @param attachments Fichiers à uploader (optionnel)
   * @returns La note créée avec sa référence pivot générée
   */
  async createDraftWithAttachments(
    dto: CreateNoteSEFDTO, 
    exercice: number,
    attachments?: File[]
  ): Promise<ServiceResult<NoteSEFEntity & { attachmentResults?: { success: number; failed: number } }>> {
    try {
      // 1. Récupérer l'utilisateur
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Non authentifié' };
      }

      // 2. Créer la note (le trigger génère reference_pivot automatiquement)
      const { data: note, error: insertError } = await supabase
        .from('notes_sef')
        .insert({
          objet: dto.objet,
          description: dto.description || null,
          justification: dto.justification,
          direction_id: dto.direction_id,
          demandeur_id: dto.demandeur_id || user.id,
          beneficiaire_id: dto.beneficiaire_id || null,
          beneficiaire_interne_id: dto.beneficiaire_interne_id || null,
          urgence: dto.urgence || 'normale',
          date_souhaitee: dto.date_souhaitee || null,
          commentaire: dto.commentaire || null,
          exercice: exercice,
          created_by: user.id,
          statut: 'brouillon',
        })
        .select()
        .single();

      if (insertError) {
        return { success: false, error: `Erreur création note: ${insertError.message}` };
      }

      // 3. Log history
      await supabase.from('notes_sef_history').insert({
        note_id: note.id,
        action: 'création',
        new_statut: 'brouillon',
        performed_by: user.id,
      });

      // 4. Upload des pièces jointes si présentes
      let attachmentResults = { success: 0, failed: 0 };
      
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          try {
            // Chemin: {exercice}/{noteId}/{timestamp}_{filename}
            const timestamp = Date.now();
            const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = `${exercice}/${note.id}/${timestamp}_${safeFileName}`;

            // Upload vers Storage
            const { error: uploadError } = await supabase.storage
              .from('notes-sef')
              .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              attachmentResults.failed++;
              
              // Log échec
              await supabase.from('notes_sef_history').insert({
                note_id: note.id,
                action: 'upload_echec',
                commentaire: `Échec upload: ${file.name} - ${uploadError.message}`,
                performed_by: user.id,
              });
              continue;
            }

            // Enregistrer dans notes_sef_pieces
            await supabase.from('notes_sef_pieces').insert({
              note_id: note.id,
              fichier_url: filePath,
              nom: file.name,
              type_fichier: file.type || 'application/octet-stream',
              taille: file.size,
              uploaded_by: user.id,
            });

            // Log succès
            await supabase.from('notes_sef_history').insert({
              note_id: note.id,
              action: 'ajout_piece',
              commentaire: `Pièce jointe: ${file.name}`,
              performed_by: user.id,
            });

            attachmentResults.success++;
          } catch (fileError) {
            console.error(`Error processing ${file.name}:`, fileError);
            attachmentResults.failed++;
          }
        }
      }

      return { 
        success: true, 
        data: { 
          ...note as unknown as NoteSEFEntity, 
          attachmentResults 
        } 
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Créer une nouvelle note SEF (brouillon) - ALIAS pour compatibilité
   * @deprecated Utiliser createDraftWithAttachments pour le support des PJ
   */
  async createDraft(dto: CreateNoteSEFDTO, exercice: number): Promise<ServiceResult<NoteSEFEntity>> {
    return this.createDraftWithAttachments(dto, exercice);
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
