/**
 * Hook pour l'export Excel des Notes AEF
 * Gère les filtres, permissions et pagination pour export complet
 * Format fichier: SYGFP_AEF_{exercice}_{statut}_{YYYYMMDD}.xlsx
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const MAX_EXPORT_ROWS = 10000;

interface ExportFilters {
  statut?: string | string[];
  search?: string;
  directionId?: string;
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  a_valider: 'À valider',
  valide: 'Validé',
  a_imputer: 'À imputer',
  impute: 'Imputé',
  rejete: 'Rejeté',
  differe: 'Différé',
};

const PRIORITE_LABELS: Record<string, string> = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

// Mapping des onglets vers labels de fichier
const TAB_FILE_LABELS: Record<string, string> = {
  toutes: 'toutes',
  a_valider: 'a_valider',
  a_imputer: 'a_imputer',
  imputees: 'imputees',
  differees: 'differees',
  rejetees: 'rejetees',
};

// Mapping des onglets vers filtres de statut
const TAB_STATUT_FILTERS: Record<string, string | string[] | undefined> = {
  toutes: undefined,
  a_valider: ['soumis', 'a_valider'],
  a_imputer: 'valide',
  imputees: 'impute',
  differees: 'differe',
  rejetees: 'rejete',
};

/**
 * Formate un montant en FCFA avec séparateurs de milliers
 */
function formatMontantFCFA(montant: number | null | undefined): string {
  if (montant == null) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
}

export function useNotesAEFExport() {
  const { exercice } = useExercice();
  const { hasAnyRole } = usePermissions();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  const isDG = hasAnyRole(['ADMIN', 'DG']);

  /**
   * Exporte les notes AEF en Excel selon les filtres actuels
   */
  const exportNotesAEF = useCallback(
    async (filters: ExportFilters = {}, tabLabel: string = 'toutes') => {
      if (!exercice) {
        toast.error('Exercice non sélectionné');
        return;
      }

      setIsExporting(true);
      setExportProgress('Récupération des données...');

      try {
        // 1. Récupérer l'utilisateur et ses permissions
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        // Récupérer la direction de l'utilisateur si pas DG
        let userDirectionId: string | null = null;
        if (!isDG) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('direction_id')
            .eq('id', user.id)
            .single();
          userDirectionId = profile?.direction_id || null;
        }

        // 2. Construire la requête avec les filtres
        let query = supabase
          .from('notes_dg')
          .select(
            `
            id,
            numero,
            reference_pivot,
            exercice,
            statut,
            objet,
            justification,
            priorite,
            montant_estime,
            type_depense,
            is_direct_aef,
            rejection_reason,
            motif_differe,
            deadline_correction,
            date_differe,
            created_at,
            submitted_at,
            validated_at,
            imputed_at,
            rejected_at,
            direction:directions(id, label, sigle),
            note_sef:notes_sef(id, numero, reference_pivot),
            budget_line:budget_lines(id, code, label),
            created_by_profile:profiles!created_by(id, first_name, last_name),
            validated_by_profile:profiles!validated_by(id, first_name, last_name),
            imputed_by_profile:profiles!imputed_by(id, first_name, last_name),
            rejected_by_profile:profiles!rejected_by(id, first_name, last_name),
            differe_by_profile:profiles!differe_by(id, first_name, last_name)
          `
          )
          .eq('exercice', exercice)
          .order('created_at', { ascending: false })
          .limit(MAX_EXPORT_ROWS);

        // Déterminer le filtre de statut selon l'onglet
        const statutFilter = filters.statut ?? TAB_STATUT_FILTERS[tabLabel];
        if (statutFilter) {
          if (Array.isArray(statutFilter)) {
            query = query.in('statut', statutFilter);
          } else {
            query = query.eq('statut', statutFilter);
          }
        }

        // Filtre par direction (permissions)
        if (!isDG && userDirectionId) {
          query = query.eq('direction_id', userDirectionId);
        } else if (filters.directionId) {
          query = query.eq('direction_id', filters.directionId);
        }

        // Filtre par recherche
        if (filters.search?.trim()) {
          const searchTerm = `%${filters.search.trim()}%`;
          query = query.or(
            `reference_pivot.ilike.${searchTerm},numero.ilike.${searchTerm},objet.ilike.${searchTerm}`
          );
        }

        setExportProgress('Chargement des notes...');
        const { data: notes, error } = await query;

        if (error) throw error;

        // Générer le nom de fichier avec format standardisé
        const fileStatutLabel = TAB_FILE_LABELS[tabLabel] || 'toutes';
        const dateStr = format(new Date(), 'yyyyMMdd');
        const fileName = `SYGFP_AEF_${exercice}_${fileStatutLabel}_${dateStr}.xlsx`;

        // Colonnes de l'export
        const headers = [
          'Référence',
          'Exercice',
          'Statut',
          'Objet',
          'Direction',
          'Urgence',
          'Montant (FCFA)',
          'Type dépense',
          'Origine',
          'Réf. SEF liée',
          'Justification',
          'Motif décision',
          'Créée le',
          'Créée par',
          'Soumise le',
          'Validée le',
          'Imputée le',
          'Imputée par',
          'Ligne budgétaire',
          'Nb PJ',
        ];

        // 3. Si aucune note, créer fichier avec en-têtes uniquement
        if (!notes || notes.length === 0) {
          const worksheet = XLSX.utils.aoa_to_sheet([headers]);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes AEF');

          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.info('Fichier exporté avec en-têtes uniquement (aucune note)');
          return;
        }

        if (notes.length >= MAX_EXPORT_ROWS) {
          toast.warning(`Export limité à ${MAX_EXPORT_ROWS} lignes. Affinez vos filtres.`);
        }

        // 4. Récupérer le nombre de pièces jointes par note
        setExportProgress('Récupération des pièces jointes...');
        const noteIds = notes.map((n) => n.id);

        const { data: attachmentCounts } = await supabase
          .from('note_attachments')
          .select('note_id')
          .in('note_id', noteIds);

        // Compter les pièces jointes par note
        const attachmentCountByNote: Record<string, number> = {};
        (attachmentCounts || []).forEach((att: { note_id: string }) => {
          attachmentCountByNote[att.note_id] = (attachmentCountByNote[att.note_id] || 0) + 1;
        });

        // 5. Transformer les données pour l'export
        setExportProgress('Préparation du fichier Excel...');
        const exportData = notes.map((note): Record<string, string | number> => {
          // Origine: Via SEF ou AEF Directe
          const origine = note.is_direct_aef ? 'AEF Directe' : 'Via SEF';

          // Référence SEF liée
          const refSEFLiee = note.note_sef?.reference_pivot || note.note_sef?.numero || '';

          // Motif de décision (rejet ou report)
          let motifDecision = '';
          if (note.statut === 'rejete' && note.rejection_reason) {
            motifDecision = note.rejection_reason;
          } else if (note.statut === 'differe') {
            const parts: string[] = [];
            if (note.motif_differe) parts.push(note.motif_differe);
            if (note.deadline_correction) {
              parts.push(`Reprise: ${format(new Date(note.deadline_correction), 'dd/MM/yyyy')}`);
            }
            motifDecision = parts.join(' | ');
          }

          // Ligne budgétaire
          const ligneBudgetaire = note.budget_line
            ? `${note.budget_line.code} - ${note.budget_line.label}`
            : '';

          return {
            Référence: note.reference_pivot || note.numero || '',
            Exercice: note.exercice || '',
            Statut: STATUT_LABELS[note.statut] || note.statut || '',
            Objet: note.objet || '',
            Direction: note.direction?.label || note.direction?.sigle || '',
            Urgence: PRIORITE_LABELS[note.priorite] || note.priorite || '',
            'Montant (FCFA)': formatMontantFCFA(note.montant_estime),
            'Type dépense': note.type_depense || '',
            Origine: origine,
            'Réf. SEF liée': refSEFLiee,
            Justification: note.justification || '',
            'Motif décision': motifDecision,
            'Créée le': note.created_at
              ? format(new Date(note.created_at), 'dd/MM/yyyy HH:mm')
              : '',
            'Créée par': note.created_by_profile
              ? `${note.created_by_profile.first_name || ''} ${note.created_by_profile.last_name || ''}`.trim()
              : '',
            'Soumise le': note.submitted_at
              ? format(new Date(note.submitted_at), 'dd/MM/yyyy HH:mm')
              : '',
            'Validée le': note.validated_at
              ? format(new Date(note.validated_at), 'dd/MM/yyyy HH:mm')
              : '',
            'Imputée le': note.imputed_at
              ? format(new Date(note.imputed_at), 'dd/MM/yyyy HH:mm')
              : '',
            'Imputée par': note.imputed_by_profile
              ? `${note.imputed_by_profile.first_name || ''} ${note.imputed_by_profile.last_name || ''}`.trim()
              : '',
            'Ligne budgétaire': ligneBudgetaire,
            'Nb PJ': attachmentCountByNote[note.id] || 0,
          };
        });

        // 6. Créer le fichier Excel
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Largeurs de colonnes
        worksheet['!cols'] = [
          { wch: 18 }, // Référence
          { wch: 10 }, // Exercice
          { wch: 12 }, // Statut
          { wch: 40 }, // Objet
          { wch: 20 }, // Direction
          { wch: 10 }, // Urgence
          { wch: 15 }, // Montant (FCFA)
          { wch: 15 }, // Type dépense
          { wch: 12 }, // Origine
          { wch: 18 }, // Réf. SEF liée
          { wch: 40 }, // Justification
          { wch: 40 }, // Motif décision
          { wch: 16 }, // Créée le
          { wch: 20 }, // Créée par
          { wch: 16 }, // Soumise le
          { wch: 16 }, // Validée le
          { wch: 16 }, // Imputée le
          { wch: 20 }, // Imputée par
          { wch: 40 }, // Ligne budgétaire
          { wch: 6 }, // Nb PJ
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes AEF');

        // 7. Télécharger le fichier
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`${exportData.length} note(s) exportée(s)`);
      } catch (error: unknown) {
        console.error('Export AEF error:', error);
        toast.error(
          "Erreur lors de l'export: " + (error instanceof Error ? error.message : 'Erreur inconnue')
        );
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [exercice, isDG]
  );

  return {
    exportNotesAEF,
    isExporting,
    exportProgress,
  };
}
