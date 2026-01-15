/**
 * Notes AEF - Service d'accès aux données
 * =========================================
 * Couche d'abstraction pour les opérations de lecture paginée
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  NoteAEFEntity,
  NoteAEFCounts,
  NoteAEFFilters,
  PaginatedResult,
  ServiceResult,
  ListNotesAEFOptions,
} from './types';

/**
 * Service centralisé pour la gestion des Notes AEF
 */
export const notesAefService = {
  /**
   * Récupérer les notes AEF paginées avec recherche server-side
   */
  async listPaginated(options: ListNotesAEFOptions): Promise<ServiceResult<PaginatedResult<NoteAEFEntity>>> {
    try {
      const {
        exercice,
        page = 1,
        pageSize = 20,
        search,
        statut,
        direction_id,
        urgence,
        dateFrom,
        dateTo,
        sortBy = 'updated_at',
        sortOrder = 'desc'
      } = options;

      const offset = (page - 1) * pageSize;
      const statutArray = statut ? (Array.isArray(statut) ? statut : [statut]) : null;

      // 1. Compter le total avec filtres
      const { data: totalCount, error: countError } = await supabase.rpc(
        'count_search_notes_aef',
        {
          p_exercice: exercice,
          p_search: search?.trim() || null,
          p_statut: statutArray,
          p_direction_id: direction_id || null,
          p_urgence: urgence || null,
          p_date_from: dateFrom || null,
          p_date_to: dateTo || null
        }
      );
      if (countError) throw countError;

      const total = totalCount || 0;
      const totalPages = Math.ceil(total / pageSize);

      // 2. Récupérer les IDs via RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'search_notes_aef',
        {
          p_exercice: exercice,
          p_search: search?.trim() || null,
          p_statut: statutArray,
          p_direction_id: direction_id || null,
          p_urgence: urgence || null,
          p_date_from: dateFrom || null,
          p_date_to: dateTo || null,
          p_limit: pageSize,
          p_offset: offset,
          p_sort_by: sortBy,
          p_sort_order: sortOrder
        }
      );
      if (rpcError) throw rpcError;

      const noteIds = (rpcData || []).map((n: { id: string }) => n.id);

      if (noteIds.length === 0) {
        return {
          success: true,
          data: { data: [], total, page, pageSize, totalPages }
        };
      }

      // 3. Enrichir avec les relations
      const { data: enrichedData, error: enrichError } = await supabase
        .from('notes_dg')
        .select(`
          *,
          direction:directions(id, label, sigle),
          created_by_profile:profiles!notes_dg_created_by_fkey(id, first_name, last_name),
          imputed_by_profile:profiles!notes_dg_imputed_by_fkey(id, first_name, last_name),
          budget_line:budget_lines(id, code, label, dotation_initiale),
          note_sef:notes_sef!notes_dg_note_sef_id_fkey(id, numero, objet, dossier_id)
        `)
        .in('id', noteIds);

      if (enrichError) throw enrichError;

      // Préserver l'ordre du RPC
      const orderedData = noteIds.map((id: string) =>
        enrichedData?.find((n) => n.id === id)
      ).filter(Boolean);

      return {
        success: true,
        data: {
          data: orderedData as unknown as NoteAEFEntity[],
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
  async getCounts(exercice: number): Promise<ServiceResult<NoteAEFCounts>> {
    try {
      const { data, error } = await supabase
        .from('notes_dg')
        .select('statut')
        .eq('exercice', exercice);

      if (error) throw error;

      const counts: NoteAEFCounts = {
        total: 0,
        brouillon: 0,
        soumis: 0,
        a_valider: 0,
        a_imputer: 0,
        impute: 0,
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
  async getById(id: string): Promise<ServiceResult<NoteAEFEntity>> {
    try {
      const { data, error } = await supabase
        .from('notes_dg')
        .select(`
          *,
          direction:directions(id, label, sigle),
          created_by_profile:profiles!notes_dg_created_by_fkey(id, first_name, last_name),
          imputed_by_profile:profiles!notes_dg_imputed_by_fkey(id, first_name, last_name),
          budget_line:budget_lines(id, code, label, dotation_initiale),
          note_sef:notes_sef!notes_dg_note_sef_id_fkey(id, numero, objet, dossier_id)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data: data as unknown as NoteAEFEntity };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
