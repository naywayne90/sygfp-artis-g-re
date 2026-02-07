import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { toast } from 'sonner';

type ReportType =
  | 'execution_budgetaire'
  | 'synthese_depenses'
  | 'etat_engagements'
  | 'etat_liquidations'
  | 'etat_ordonnancements'
  | 'suivi_workflow';

type ReportFormat = 'csv' | 'html';

interface ReportFilters {
  direction_id?: string;
  date_debut?: string;
  date_fin?: string;
  statut?: string;
}

interface GenerateReportParams {
  report_type: ReportType;
  format: ReportFormat;
  filters?: ReportFilters;
}

function downloadBlob(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useGenerateReport() {
  const { exercice } = useExercice();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = useCallback(
    async ({ report_type, format, filters }: GenerateReportParams) => {
      setIsGenerating(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Vous devez etre connecte pour exporter');
          return;
        }

        const { data, error } = await supabase.functions.invoke('generate-report', {
          body: {
            report_type,
            format,
            exercice,
            filters,
          },
        });

        if (error) {
          throw new Error(error.message || 'Erreur lors de la generation du rapport');
        }

        // The edge function returns the file content directly
        const content = typeof data === 'string' ? data : JSON.stringify(data);
        const timestamp = Date.now();

        if (format === 'csv') {
          const fileName = `${report_type}_${exercice}_${timestamp}.csv`;
          downloadBlob(content, fileName, 'text/csv; charset=utf-8');
          toast.success('Export CSV telecharge');
        } else {
          // HTML - open in new window for print/PDF
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(content);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
          }
          toast.success('Rapport genere - impression en cours');
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Erreur lors de la generation du rapport';
        console.error('[useGenerateReport]', err);
        toast.error(message);
      } finally {
        setIsGenerating(false);
      }
    },
    [exercice]
  );

  return { generateReport, isGenerating };
}
