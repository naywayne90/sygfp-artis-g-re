/**
 * NotesSEFExports - Boutons d'export Excel, PDF, CSV
 */

import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotesSEFExport } from '@/hooks/useNotesSEFExport';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { format } from 'date-fns';
import type { FiltersState } from './NotesSEFFilters';

interface ExportFilters {
  statut?: string | string[];
  search?: string;
  directionId?: string;
}

interface NotesSEFExportsProps {
  activeTab: string;
  filters: FiltersState;
  searchQuery: string;
  className?: string;
}

// Mapping des onglets vers labels de fichier
const TAB_FILE_LABELS: Record<string, string> = {
  toutes: 'toutes',
  brouillons: 'brouillons',
  a_valider: 'a_valider',
  validees: 'validees',
  differees: 'differees',
  rejetees: 'rejetees',
  a_imputer: 'a_imputer',
};

// Mapping des onglets vers filtres de statut
const TAB_TO_STATUT: Record<string, string | string[] | undefined> = {
  toutes: undefined,
  brouillons: 'brouillon',
  a_valider: ['soumis', 'a_valider'],
  validees: ['valide', 'valide_auto'],
  differees: 'differe',
  rejetees: 'rejete',
  a_imputer: 'valide',
};

export function NotesSEFExports({
  activeTab,
  filters,
  searchQuery,
  className,
}: NotesSEFExportsProps) {
  const { exportNotesSEF, exportNotesSEFPDF, isExporting, exportProgress } = useNotesSEFExport();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  // Construire les filtres d'export
  const getExportFilters = (): ExportFilters => ({
    statut: TAB_TO_STATUT[activeTab],
    search: searchQuery || undefined,
    directionId: filters.directionId || undefined,
  });

  // Export Excel
  const handleExportExcel = async () => {
    await exportNotesSEF(getExportFilters(), activeTab);
  };

  // Export PDF
  const handleExportPDF = async () => {
    await exportNotesSEFPDF(getExportFilters(), activeTab);
  };

  // Export CSV
  const handleExportCSV = async () => {
    if (!exercice) {
      toast.error('Exercice non sélectionné');
      return;
    }

    setIsExportingCSV(true);

    try {
      // Construire la requête
      let query = supabase
        .from('notes_sef')
        .select(`
          reference_pivot,
          exercice,
          statut,
          objet,
          urgence,
          date_souhaitee,
          created_at,
          direction:directions(label, sigle),
          demandeur:profiles!demandeur_id(first_name, last_name)
        `)
        .eq('exercice', exercice)
        .order('created_at', { ascending: false })
        .limit(10000);

      // Appliquer les filtres
      const exportFilters = getExportFilters();
      if (exportFilters.statut) {
        if (Array.isArray(exportFilters.statut)) {
          query = query.in('statut', exportFilters.statut);
        } else {
          query = query.eq('statut', exportFilters.statut);
        }
      }
      if (exportFilters.directionId) {
        query = query.eq('direction_id', exportFilters.directionId);
      }
      if (exportFilters.search) {
        const searchTerm = `%${exportFilters.search}%`;
        query = query.or(`reference_pivot.ilike.${searchTerm},objet.ilike.${searchTerm}`);
      }

      const { data: notes, error } = await query;
      if (error) throw error;

      if (!notes || notes.length === 0) {
        toast.info('Aucune note à exporter');
        return;
      }

      // Générer le CSV avec BOM UTF-8 et séparateur point-virgule
      const headers = [
        'Référence',
        'Exercice',
        'Statut',
        'Objet',
        'Direction',
        'Demandeur',
        'Urgence',
        'Date souhaitée',
        'Créée le',
      ];

      const STATUT_LABELS: Record<string, string> = {
        brouillon: 'Brouillon',
        soumis: 'Soumis',
        a_valider: 'À valider',
        valide: 'Validé',
        rejete: 'Rejeté',
        differe: 'Différé',
      };

      const URGENCE_LABELS: Record<string, string> = {
        basse: 'Basse',
        normale: 'Normale',
        haute: 'Haute',
        urgente: 'Urgente',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = notes.map((note: any) => {
        const direction = note.direction as { sigle?: string; label?: string } | null;
        const demandeur = note.demandeur as { first_name?: string; last_name?: string } | null;

        const directionLabel = direction?.sigle
          ? `${direction.sigle} - ${direction.label || ''}`
          : direction?.label || '';
        const demandeurName = demandeur
          ? `${demandeur.first_name || ''} ${demandeur.last_name || ''}`.trim()
          : '';

        return [
          String(note.reference_pivot || ''),
          String(note.exercice || ''),
          STATUT_LABELS[note.statut as string] || String(note.statut || ''),
          `"${String(note.objet || '').replace(/"/g, '""')}"`, // Escape quotes
          `"${directionLabel.replace(/"/g, '""')}"`,
          `"${demandeurName.replace(/"/g, '""')}"`,
          URGENCE_LABELS[note.urgence as string] || String(note.urgence || ''),
          note.date_souhaitee ? format(new Date(note.date_souhaitee as string), 'dd/MM/yyyy') : '',
          note.created_at ? format(new Date(note.created_at as string), 'dd/MM/yyyy HH:mm') : '',
        ];
      });

      // Construire le contenu CSV
      const BOM = '\uFEFF'; // UTF-8 BOM
      const csvContent = BOM + [
        headers.join(';'),
        ...rows.map(row => row.join(';')),
      ].join('\r\n');

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const fileLabel = TAB_FILE_LABELS[activeTab] || 'toutes';
      const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
      const fileName = `SYGFP_SEF_${exercice}_${fileLabel}_${dateStr}.csv`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Audit log
      await logAction({
        entityType: 'notes_sef',
        action: 'EXPORT_CSV',
        newValues: {
          exercice,
          tab: activeTab,
          count: notes.length,
          fileName,
        },
      });

      toast.success(`${notes.length} note(s) exportée(s) en CSV`);
    } catch (error: unknown) {
      console.error('Export CSV error:', error);
      toast.error('Erreur lors de l\'export CSV: ' + (error as Error).message);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const isLoading = isExporting || isExportingCSV;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading} className={className}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {exportProgress || 'Export...'}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleExportExcel} disabled={isLoading}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} disabled={isLoading}>
          <FileText className="mr-2 h-4 w-4 text-red-600" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV} disabled={isLoading}>
          <FileText className="mr-2 h-4 w-4 text-blue-600" />
          CSV (;)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
