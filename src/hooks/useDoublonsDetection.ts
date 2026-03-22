import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { toast } from 'sonner';

export interface DoublonItem {
  id: string;
  type: 'reference' | 'objet' | 'montant_date' | 'prestataire';
  entite: 'Engagement' | 'Note';
  reference: string;
  objet: string;
  montant: number;
  date: string;
  prestataire?: string;
  score: number;
  groupId: string;
}

export interface DoublonGroup {
  groupId: string;
  type: DoublonItem['type'];
  items: DoublonItem[];
  similarityScore: number;
  reviewStatus?: 'verified' | 'ignored';
  reviewedAt?: string;
}

interface DoublonReview {
  group_id: string;
  type: string;
  action: string;
  exercice: number;
  reviewed_by: string | null;
  notes: string | null;
  item_ids: string[];
  created_at: string;
}

interface EngagementRow {
  id: string;
  numero: string | null;
  objet: string | null;
  montant: number | null;
  date_engagement: string | null;
  fournisseur: string | null;
}

interface NoteRow {
  id: string;
  numero: string | null;
  objet: string | null;
  montant_estime: number | null;
}

// Simple Levenshtein distance for similarity
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function similarityScore(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return Math.round((1 - distance / maxLen) * 100);
}

export function useDoublonsDetection() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  // Fetch reviews for current exercice
  const { data: reviewsData } = useQuery({
    queryKey: ['doublon-reviews', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doublon_reviews')
        .select('*')
        .eq('exercice', exercice as number);

      if (error) throw error;
      return (data || []) as DoublonReview[];
    },
    enabled: !!exercice,
  });

  // Build reviewed groups map
  const reviewedGroups = new Map<string, { action: string; reviewed_at: string }>();
  if (reviewsData) {
    for (const review of reviewsData) {
      reviewedGroups.set(review.group_id, {
        action: review.action,
        reviewed_at: review.created_at,
      });
    }
  }

  // Main detection query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['doublons-detection', exercice, reviewsData],
    queryFn: async (): Promise<DoublonGroup[]> => {
      const groups: DoublonGroup[] = [];

      // 1. Fetch engagements for duplicate detection
      const { data: engagements, error: engError } = await supabase
        .from('budget_engagements')
        .select('id, numero, objet, montant, date_engagement, fournisseur')
        .eq('exercice', exercice as number);

      if (engError) throw engError;

      // 2. Fetch notes for duplicate detection
      const { data: notes, error: notesError } = await supabase
        .from('notes_dg')
        .select('id, numero, objet, montant_estime')
        .eq('exercice', exercice as number);

      if (notesError) throw notesError;

      const engList = (engagements || []) as EngagementRow[];
      const notesList = (notes || []) as NoteRow[];

      // 3. Detect duplicates by reference (numero)
      const referenceMap = new Map<string, DoublonItem[]>();

      const allItems: Array<EngagementRow | NoteRow> = [...engList, ...notesList];
      allItems.forEach((item) => {
        if (!item.numero) return;
        const key = item.numero.toLowerCase().trim();
        const isEngagement = 'fournisseur' in item;
        if (!referenceMap.has(key)) {
          referenceMap.set(key, []);
        }
        referenceMap.get(key)?.push({
          id: item.id,
          type: 'reference',
          entite: isEngagement ? 'Engagement' : 'Note',
          reference: item.numero,
          objet: item.objet || '',
          montant: isEngagement
            ? (item as EngagementRow).montant || 0
            : (item as NoteRow).montant_estime || 0,
          date: isEngagement ? (item as EngagementRow).date_engagement || '' : '',
          prestataire: isEngagement ? (item as EngagementRow).fournisseur || undefined : undefined,
          score: 100,
          groupId: `ref-${key}`,
        });
      });

      referenceMap.forEach((items) => {
        if (items.length > 1) {
          const groupId = items[0].groupId;
          const review = reviewedGroups.get(groupId);
          groups.push({
            groupId,
            type: 'reference',
            items,
            similarityScore: 100,
            reviewStatus: review?.action as DoublonGroup['reviewStatus'],
            reviewedAt: review?.reviewed_at,
          });
        }
      });

      // 4. Detect duplicates by montant + date
      const montantDateMap = new Map<string, DoublonItem[]>();

      engList.forEach((eng) => {
        if (!eng.montant || !eng.date_engagement) return;
        const key = `${eng.montant}-${eng.date_engagement}`;
        if (!montantDateMap.has(key)) {
          montantDateMap.set(key, []);
        }
        montantDateMap.get(key)?.push({
          id: eng.id,
          type: 'montant_date',
          entite: 'Engagement',
          reference: eng.numero || '',
          objet: eng.objet || '',
          montant: eng.montant,
          date: eng.date_engagement,
          prestataire: eng.fournisseur || undefined,
          score: 100,
          groupId: `md-${key}`,
        });
      });

      montantDateMap.forEach((items) => {
        if (items.length > 1) {
          const groupId = items[0].groupId;
          const review = reviewedGroups.get(groupId);
          groups.push({
            groupId,
            type: 'montant_date',
            items,
            similarityScore: 100,
            reviewStatus: review?.action as DoublonGroup['reviewStatus'],
            reviewedAt: review?.reviewed_at,
          });
        }
      });

      // 5. Detect similar objects (using Levenshtein)
      const similarObjectGroups: DoublonItem[][] = [];
      const processed = new Set<string>();

      for (let i = 0; i < engList.length; i++) {
        if (processed.has(engList[i].id)) continue;

        const similar: DoublonItem[] = [
          {
            id: engList[i].id,
            type: 'objet',
            entite: 'Engagement',
            reference: engList[i].numero || '',
            objet: engList[i].objet || '',
            montant: engList[i].montant || 0,
            date: engList[i].date_engagement || '',
            prestataire: engList[i].fournisseur || undefined,
            score: 100,
            groupId: `obj-${engList[i].id}`,
          },
        ];

        for (let j = i + 1; j < engList.length; j++) {
          if (processed.has(engList[j].id)) continue;

          const score = similarityScore(engList[i].objet || '', engList[j].objet || '');
          if (score >= 80) {
            similar.push({
              id: engList[j].id,
              type: 'objet',
              entite: 'Engagement',
              reference: engList[j].numero || '',
              objet: engList[j].objet || '',
              montant: engList[j].montant || 0,
              date: engList[j].date_engagement || '',
              prestataire: engList[j].fournisseur || undefined,
              score,
              groupId: `obj-${engList[i].id}`,
            });
            processed.add(engList[j].id);
          }
        }

        if (similar.length > 1) {
          processed.add(engList[i].id);
          similarObjectGroups.push(similar);
        }
      }

      similarObjectGroups.forEach((items, idx) => {
        const avgScore = Math.round(
          items.reduce((sum, item) => sum + item.score, 0) / items.length
        );
        const groupId = `obj-group-${idx}`;
        const review = reviewedGroups.get(groupId);
        groups.push({
          groupId,
          type: 'objet',
          items: items.map((item) => ({ ...item, groupId })),
          similarityScore: avgScore,
          reviewStatus: review?.action as DoublonGroup['reviewStatus'],
          reviewedAt: review?.reviewed_at,
        });
      });

      // 6. Detect duplicates by prestataire + montant
      const prestataireMap = new Map<string, DoublonItem[]>();

      engList.forEach((eng) => {
        if (!eng.fournisseur || !eng.montant) return;
        const key = `${eng.fournisseur.toLowerCase().trim()}-${eng.montant}`;
        if (!prestataireMap.has(key)) {
          prestataireMap.set(key, []);
        }
        prestataireMap.get(key)?.push({
          id: eng.id,
          type: 'prestataire',
          entite: 'Engagement',
          reference: eng.numero || '',
          objet: eng.objet || '',
          montant: eng.montant,
          date: eng.date_engagement || '',
          prestataire: eng.fournisseur,
          score: 100,
          groupId: `prest-${key}`,
        });
      });

      prestataireMap.forEach((items) => {
        if (items.length > 1) {
          const groupId = items[0].groupId;
          const review = reviewedGroups.get(groupId);
          groups.push({
            groupId,
            type: 'prestataire',
            items,
            similarityScore: 100,
            reviewStatus: review?.action as DoublonGroup['reviewStatus'],
            reviewedAt: review?.reviewed_at,
          });
        }
      });

      return groups.sort((a, b) => b.similarityScore - a.similarityScore);
    },
    enabled: !!exercice,
  });

  // Mark group as verified mutation
  const markAsVerified = useMutation({
    mutationFn: async ({
      groupId,
      notes,
      itemIds,
    }: {
      groupId: string;
      type: DoublonItem['type'];
      notes?: string;
      itemIds?: string[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: upsertError } = await supabase.from('doublon_reviews').upsert(
        {
          group_id: groupId,
          type: data?.find((g) => g.groupId === groupId)?.type || 'reference',
          action: 'verified',
          exercice: exercice as number,
          reviewed_by: user?.id || null,
          notes: notes || null,
          item_ids: itemIds || [],
        },
        { onConflict: 'group_id,exercice' }
      );

      if (upsertError) throw upsertError;
      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doublon-reviews', exercice] });
      queryClient.invalidateQueries({ queryKey: ['doublons-detection', exercice] });
      toast.success('Groupe marque comme verifie');
    },
    onError: (err: Error) => {
      toast.error('Erreur lors de la verification', {
        description: err.message,
      });
    },
  });

  // Ignore group mutation
  const ignoreGroup = useMutation({
    mutationFn: async ({
      groupId,
      notes,
      itemIds,
    }: {
      groupId: string;
      type: DoublonItem['type'];
      notes?: string;
      itemIds?: string[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: upsertError } = await supabase.from('doublon_reviews').upsert(
        {
          group_id: groupId,
          type: data?.find((g) => g.groupId === groupId)?.type || 'reference',
          action: 'ignored',
          exercice: exercice as number,
          reviewed_by: user?.id || null,
          notes: notes || null,
          item_ids: itemIds || [],
        },
        { onConflict: 'group_id,exercice' }
      );

      if (upsertError) throw upsertError;
      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doublon-reviews', exercice] });
      queryClient.invalidateQueries({ queryKey: ['doublons-detection', exercice] });
      toast.success('Groupe ignore');
    },
    onError: (err: Error) => {
      toast.error("Erreur lors de l'operation", {
        description: err.message,
      });
    },
  });

  const doublons = data || [];

  return {
    doublons,
    isLoading,
    error: error as Error | null,
    stats: {
      total: doublons.length,
      byReference: doublons.filter((g) => g.type === 'reference').length,
      byObjet: doublons.filter((g) => g.type === 'objet').length,
      byMontantDate: doublons.filter((g) => g.type === 'montant_date').length,
      byPrestataire: doublons.filter((g) => g.type === 'prestataire').length,
    },
    markAsVerified,
    ignoreGroup,
    refetch,
    reviewedGroups,
  };
}
