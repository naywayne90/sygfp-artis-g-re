/**
 * Hook pour l'export Excel des données SYGFP
 * Gère l'état de l'export et les notifications
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  generateExcel,
  generateExcelBlob,
  generateCSV,
  generateFilename,
  type FilterState,
  type ExportExcelOptions,
} from '@/lib/excel';
import type { NoteSEFEntity } from '@/lib/notes-sef/types';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'xlsx' | 'csv';

export interface UseExportExcelOptions {
  /** Callback après export réussi */
  onSuccess?: (filename: string) => void;
  /** Callback en cas d'erreur */
  onError?: (error: Error) => void;
}

export interface UseExportExcelReturn {
  /** Indique si un export est en cours */
  isExporting: boolean;
  /** Exporte les données en Excel (.xlsx) */
  exportToExcel: (
    data: NoteSEFEntity[],
    options?: Partial<ExportExcelOptions>
  ) => Promise<void>;
  /** Exporte les données en CSV */
  exportToCSV: (data: NoteSEFEntity[], filename?: string) => Promise<void>;
  /** Exporte et retourne un Blob (pour envoi par email, etc.) */
  exportToBlob: (
    data: NoteSEFEntity[],
    options?: Partial<ExportExcelOptions>
  ) => Promise<Blob>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useExportExcel(
  hookOptions?: UseExportExcelOptions
): UseExportExcelReturn {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { onSuccess, onError } = hookOptions || {};

  /**
   * Export vers Excel (.xlsx)
   */
  const exportToExcel = useCallback(
    async (
      data: NoteSEFEntity[],
      options?: Partial<ExportExcelOptions>
    ): Promise<void> => {
      if (isExporting) return;

      setIsExporting(true);

      try {
        if (data.length === 0) {
          toast({
            title: 'Aucune donnée',
            description: 'Il n\'y a aucune donnée à exporter.',
            variant: 'destructive',
          });
          return;
        }

        const filename = options?.filename || generateFilename('SYGFP_Notes_SEF', 'xlsx');

        generateExcel({
          data,
          filters: options?.filters,
          includeResume: options?.includeResume ?? true,
          filename: options?.filename,
          title: options?.title,
        });

        toast({
          title: 'Export réussi',
          description: `${data.length} enregistrement(s) exporté(s) vers ${filename}`,
        });

        onSuccess?.(filename);
      } catch (error) {
        console.error('[useExportExcel] Erreur d\'export Excel:', error);

        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

        toast({
          title: 'Erreur d\'export',
          description: `Impossible d'exporter les données: ${errorMessage}`,
          variant: 'destructive',
        });

        onError?.(error instanceof Error ? error : new Error(errorMessage));
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, toast, onSuccess, onError]
  );

  /**
   * Export vers CSV
   */
  const exportToCSV = useCallback(
    async (data: NoteSEFEntity[], filename?: string): Promise<void> => {
      if (isExporting) return;

      setIsExporting(true);

      try {
        if (data.length === 0) {
          toast({
            title: 'Aucune donnée',
            description: 'Il n\'y a aucune donnée à exporter.',
            variant: 'destructive',
          });
          return;
        }

        const finalFilename = filename || generateFilename('SYGFP_Notes_SEF', 'csv');

        generateCSV(data, finalFilename);

        toast({
          title: 'Export réussi',
          description: `${data.length} enregistrement(s) exporté(s) vers ${finalFilename}`,
        });

        onSuccess?.(finalFilename);
      } catch (error) {
        console.error('[useExportExcel] Erreur d\'export CSV:', error);

        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

        toast({
          title: 'Erreur d\'export',
          description: `Impossible d'exporter les données: ${errorMessage}`,
          variant: 'destructive',
        });

        onError?.(error instanceof Error ? error : new Error(errorMessage));
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, toast, onSuccess, onError]
  );

  /**
   * Export vers Blob (pour utilisation programmatique)
   */
  const exportToBlob = useCallback(
    async (
      data: NoteSEFEntity[],
      options?: Partial<ExportExcelOptions>
    ): Promise<Blob> => {
      if (data.length === 0) {
        throw new Error('Aucune donnée à exporter');
      }

      return generateExcelBlob({
        data,
        filters: options?.filters,
        includeResume: options?.includeResume ?? true,
        title: options?.title,
      });
    },
    []
  );

  return {
    isExporting,
    exportToExcel,
    exportToCSV,
    exportToBlob,
  };
}

// ============================================================================
// COMPOSANT BOUTON D'EXPORT (optionnel, pour réutilisation)
// ============================================================================

export interface ExportExcelButtonProps {
  /** Données à exporter */
  data: NoteSEFEntity[];
  /** Filtres appliqués */
  filters?: FilterState;
  /** Format d'export */
  format?: ExportFormat;
  /** Désactivé */
  disabled?: boolean;
  /** Classe CSS */
  className?: string;
}

// Note: Le composant bouton est dans src/components/export/
// Ce fichier expose uniquement le hook
