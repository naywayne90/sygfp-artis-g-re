/**
 * Hook pour l'export des Imputations (Excel, PDF, CSV)
 * Fetch depuis imputations avec jointures, puis appelle export-service.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { useToast } from '@/hooks/use-toast';
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  type ExportColumn,
} from '@/lib/export/export-service';

const MAX_EXPORT_ROWS = 10_000;

export interface ImputationExportFilters {
  statut?: string | string[];
  search?: string;
  directionId?: string;
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  a_valider: 'À valider',
  valide: 'Validée',
  rejete: 'Rejetée',
  differe: 'Différée',
};

function statusLabel(value: unknown): string {
  if (!value) return '-';
  return STATUT_LABELS[String(value)] ?? String(value);
}

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'reference', label: 'Référence', type: 'text', width: 18 },
  { key: 'objet', label: 'Description', type: 'text', width: 40 },
  { key: 'direction_sigle', label: 'Direction', type: 'text', width: 10 },
  { key: 'naef_numero', label: 'NAEF', type: 'text', width: 15 },
  { key: 'montant', label: 'Montant (FCFA)', type: 'currency', width: 18 },
  { key: 'budget_line_code', label: 'Ligne budget', type: 'text', width: 14 },
  { key: 'dotation', label: 'Dotation (FCFA)', type: 'currency', width: 18 },
  { key: 'disponible', label: 'Disponible (FCFA)', type: 'currency', width: 18 },
  { key: 'statut', label: 'Statut', format: statusLabel },
  { key: 'createur_nom', label: 'CB', type: 'text', width: 22 },
  { key: 'validateur_nom', label: 'Validé par', type: 'text', width: 22 },
  { key: 'created_at', label: 'Date', type: 'date', width: 12 },
];

const TAB_LABELS: Record<string, string> = {
  a_imputer: 'À imputer',
  a_valider: 'À valider',
  imputees: 'Validées',
  differees: 'Différées',
  rejetees: 'Rejetées',
};

interface ExportRow {
  reference: string | null;
  objet: string;
  direction_sigle: string;
  naef_numero: string;
  montant: number;
  budget_line_code: string;
  dotation: number;
  disponible: number;
  statut: string;
  createur_nom: string;
  validateur_nom: string;
  created_at: string;
}

async function fetchExportData(
  exercice: number,
  filters: ImputationExportFilters
): Promise<Record<string, unknown>[]> {
  let query = supabase
    .from('imputations')
    .select(
      `
      id, reference, objet, montant, statut, code_imputation, created_at,
      direction:directions(sigle),
      note_aef:notes_dg!imputations_note_aef_id_fkey(numero),
      budget_line:budget_lines(code, dotation_initiale, dotation_modifiee, total_engage),
      created_by_profile:profiles!imputations_created_by_fkey(first_name, last_name),
      validated_by_profile:profiles!imputations_validated_by_fkey(first_name, last_name)
    `
    )
    .eq('exercice', exercice)
    .order('created_at', { ascending: false })
    .limit(MAX_EXPORT_ROWS);

  // Filtrer par statut
  if (filters.statut) {
    if (Array.isArray(filters.statut)) {
      query = query.in('statut', filters.statut);
    } else {
      query = query.eq('statut', filters.statut);
    }
  }

  // Filtrer par direction
  if (filters.directionId) {
    query = query.eq('direction_id', filters.directionId);
  }

  // Recherche serveur
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`objet.ilike.${term},reference.ilike.${term},code_imputation.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Transform to flat export rows
  return (data ?? []).map((imp) => {
    const dir = imp.direction as { sigle: string | null } | null;
    const naef = imp.note_aef as { numero: string | null } | null;
    const bl = imp.budget_line as {
      code: string | null;
      dotation_initiale: number | null;
      dotation_modifiee: number | null;
      total_engage: number | null;
    } | null;
    const createur = imp.created_by_profile as {
      first_name: string | null;
      last_name: string | null;
    } | null;
    const validateur = imp.validated_by_profile as {
      first_name: string | null;
      last_name: string | null;
    } | null;

    const dotation = bl ? Math.max(bl.dotation_modifiee ?? 0, bl.dotation_initiale ?? 0) : 0;
    const disponible = bl ? dotation - (bl.total_engage ?? 0) : 0;

    return {
      reference: imp.reference,
      objet: imp.objet,
      direction_sigle: dir?.sigle ?? '',
      naef_numero: naef?.numero ?? '',
      montant: imp.montant,
      budget_line_code: bl?.code ?? '',
      dotation,
      disponible,
      statut: imp.statut,
      createur_nom: createur
        ? `${createur.first_name ?? ''} ${createur.last_name ?? ''}`.trim()
        : '',
      validateur_nom: validateur
        ? `${validateur.first_name ?? ''} ${validateur.last_name ?? ''}`.trim()
        : '',
      created_at: imp.created_at,
    } satisfies ExportRow as Record<string, unknown>;
  });
}

export function useImputationsExport() {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const exportExcel = useCallback(
    async (filters: ImputationExportFilters = {}, tabKey?: string) => {
      if (!exercice) {
        toast({ title: 'Erreur', description: 'Exercice non sélectionné', variant: 'destructive' });
        return;
      }
      setIsExporting(true);
      try {
        const data = await fetchExportData(exercice, filters);
        if (data.length >= MAX_EXPORT_ROWS) {
          toast({
            title: 'Export limité',
            description: `Export limité à ${MAX_EXPORT_ROWS} lignes. Affinez vos filtres.`,
          });
        }
        const tabLabel = tabKey ? (TAB_LABELS[tabKey] ?? tabKey) : 'Toutes';
        const result = exportToExcel(data, EXPORT_COLUMNS, {
          title: 'Liste des Imputations',
          subtitle: `${tabLabel} — ${data.length} enregistrement(s)`,
          filename: `SYGFP_Imputations_${today}`,
          exercice,
          showTotals: true,
          totalColumns: ['montant', 'dotation', 'disponible'],
          orientation: 'landscape',
        });
        if (result.success) {
          toast({ title: 'Export Excel', description: `${data.length} imputation(s) exportée(s)` });
        } else {
          toast({
            title: 'Erreur',
            description: result.error ?? 'Export échoué',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Export Excel imputations error:', err);
        toast({
          title: 'Erreur',
          description: err instanceof Error ? err.message : 'Erreur inconnue',
          variant: 'destructive',
        });
      } finally {
        setIsExporting(false);
      }
    },
    [exercice, toast, today]
  );

  const exportCSV = useCallback(
    async (filters: ImputationExportFilters = {}, tabKey?: string) => {
      if (!exercice) {
        toast({ title: 'Erreur', description: 'Exercice non sélectionné', variant: 'destructive' });
        return;
      }
      setIsExporting(true);
      try {
        const data = await fetchExportData(exercice, filters);
        const tabLabel = tabKey ? (TAB_LABELS[tabKey] ?? tabKey) : 'Toutes';
        const result = exportToCSV(data, EXPORT_COLUMNS, {
          title: 'Liste des Imputations',
          subtitle: `${tabLabel} — ${data.length} enregistrement(s)`,
          filename: `SYGFP_Imputations_${today}`,
          exercice,
        });
        if (result.success) {
          toast({ title: 'Export CSV', description: `${data.length} imputation(s) exportée(s)` });
        } else {
          toast({
            title: 'Erreur',
            description: result.error ?? 'Export échoué',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Export CSV imputations error:', err);
        toast({
          title: 'Erreur',
          description: err instanceof Error ? err.message : 'Erreur inconnue',
          variant: 'destructive',
        });
      } finally {
        setIsExporting(false);
      }
    },
    [exercice, toast, today]
  );

  const exportPDF = useCallback(
    async (filters: ImputationExportFilters = {}, tabKey?: string) => {
      if (!exercice) {
        toast({ title: 'Erreur', description: 'Exercice non sélectionné', variant: 'destructive' });
        return;
      }
      setIsExporting(true);
      try {
        const data = await fetchExportData(exercice, filters);
        const tabLabel = tabKey ? (TAB_LABELS[tabKey] ?? tabKey) : 'Toutes';
        const result = exportToPDF(data, EXPORT_COLUMNS, {
          title: 'Liste des Imputations',
          subtitle: `${tabLabel} — ${data.length} enregistrement(s)`,
          filename: `SYGFP_Imputations_${today}`,
          exercice,
          showTotals: true,
          totalColumns: ['montant', 'dotation', 'disponible'],
          orientation: 'landscape',
        });
        if (result.success) {
          toast({ title: 'Export PDF', description: `${data.length} imputation(s) exportée(s)` });
        } else {
          toast({
            title: 'Erreur',
            description: result.error ?? 'Export échoué',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Export PDF imputations error:', err);
        toast({
          title: 'Erreur',
          description: err instanceof Error ? err.message : 'Erreur inconnue',
          variant: 'destructive',
        });
      } finally {
        setIsExporting(false);
      }
    },
    [exercice, toast, today]
  );

  return { exportExcel, exportCSV, exportPDF, isExporting };
}
