/**
 * Hook pour l'export Excel/PDF des Notes SEF
 * Gère les filtres, permissions et pagination pour export complet
 * Format fichier: SYGFP_SEF_{exercice}_{statut}_{YYYYMMDD}.xlsx/.pdf
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  rejete: 'Rejeté',
  differe: 'Différé',
};

const STATUT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  brouillon: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
  soumis: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  a_valider: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  valide: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  rejete: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  differe: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
};

const URGENCE_LABELS: Record<string, string> = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

const URGENCE_COLORS: Record<string, { bg: string; text: string }> = {
  basse: { bg: '#f3f4f6', text: '#374151' },
  normale: { bg: '#dbeafe', text: '#1e40af' },
  haute: { bg: '#fef3c7', text: '#92400e' },
  urgente: { bg: '#fee2e2', text: '#991b1b' },
};

// Mapping des onglets vers labels de fichier
const TAB_FILE_LABELS: Record<string, string> = {
  toutes: 'toutes',
  brouillons: 'brouillons',
  a_valider: 'a_valider',
  validees: 'validees',
  differees: 'differees',
  rejetees: 'rejetees',
};

const TAB_DISPLAY_LABELS: Record<string, string> = {
  toutes: 'Toutes les notes',
  brouillons: 'Brouillons',
  a_valider: 'À valider',
  validees: 'Validées',
  differees: 'Différées',
  rejetees: 'Rejetées',
};

// Colonnes pour l'export Excel (complet)
const EXPORT_COLUMNS = [
  { key: 'Référence', width: 22 },
  { key: 'Exercice', width: 10 },
  { key: 'Statut', width: 12 },
  { key: 'Objet', width: 40 },
  { key: 'Direction', width: 20 },
  { key: 'Demandeur', width: 25 },
  { key: 'Urgence', width: 12 },
  { key: 'Date souhaitée', width: 14 },
  { key: 'Montant estimé', width: 18 },
  { key: 'Justification', width: 40 },
  { key: 'Description', width: 40 },
  { key: 'Commentaire', width: 30 },
  { key: 'Type bénéficiaire', width: 18 },
  { key: 'Bénéficiaire', width: 25 },
  { key: 'Motif décision', width: 40 },
  { key: 'Créée le', width: 16 },
  { key: 'Créée par', width: 20 },
  { key: 'Soumise le', width: 16 },
  { key: 'Décidée le', width: 16 },
  { key: 'Décidée par', width: 20 },
  { key: 'Nb PJ', width: 8 },
  { key: 'Pièces jointes', width: 50 },
];

// Colonnes pour le PDF (sous-ensemble lisible)
const PDF_COLUMNS = [
  { key: 'Référence', label: 'Référence', width: '12%' },
  { key: 'Statut', label: 'Statut', width: '8%' },
  { key: 'Objet', label: 'Objet', width: '25%' },
  { key: 'Direction', label: 'Direction', width: '12%' },
  { key: 'Demandeur', label: 'Demandeur', width: '13%' },
  { key: 'Urgence', label: 'Urgence', width: '8%' },
  { key: 'Créée le', label: 'Créée le', width: '10%' },
  { key: 'Décidée le', label: 'Décidée le', width: '10%' },
];

export function useNotesSEFExport() {
  const { exercice } = useExercice();
  const { hasAnyRole } = usePermissions();
  const { logAction } = useAuditLog();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  const isDG = hasAnyRole(['ADMIN', 'DG', 'DAAF']);

  /**
   * Récupère les données des notes SEF selon les filtres
   */
  const fetchNotesData = useCallback(
    async (filters: ExportFilters = {}) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer le profil de l'utilisateur (nom + direction)
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name, first_name, last_name, direction_id')
        .eq('id', user.id)
        .single();

      const userName =
        userProfile?.full_name ||
        [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ') ||
        user.email ||
        'Utilisateur';

      let userDirectionId: string | null = null;
      if (!isDG) {
        userDirectionId = userProfile?.direction_id || null;
      }

      // Construire la requête avec les filtres
      let query = supabase
        .from('notes_sef')
        .select(
          `
          id,
          reference_pivot,
          numero,
          exercice,
          statut,
          objet,
          description,
          justification,
          commentaire,
          urgence,
          date_souhaitee,
          montant_estime,
          beneficiaire_id,
          beneficiaire_interne_id,
          rejection_reason,
          differe_motif,
          differe_condition,
          differe_date_reprise,
          created_at,
          submitted_at,
          validated_at,
          rejected_at,
          differe_at,
          direction:directions(id, label, sigle),
          demandeur:profiles!demandeur_id(id, first_name, last_name),
          beneficiaire:prestataires!beneficiaire_id(id, raison_sociale),
          beneficiaire_interne:profiles!beneficiaire_interne_id(id, first_name, last_name),
          created_by_profile:profiles!created_by(id, first_name, last_name),
          validated_by_profile:profiles!validated_by(id, first_name, last_name),
          rejected_by_profile:profiles!rejected_by(id, first_name, last_name),
          differe_by_profile:profiles!differe_by(id, first_name, last_name)
        `
        )
        .eq('exercice', exercice)
        .order('created_at', { ascending: false })
        .limit(MAX_EXPORT_ROWS);

      // Filtre par statut
      if (filters.statut) {
        if (Array.isArray(filters.statut)) {
          query = query.in('statut', filters.statut);
        } else {
          query = query.eq('statut', filters.statut);
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
        query = query.or(`reference_pivot.ilike.${searchTerm},objet.ilike.${searchTerm}`);
      }

      const { data: notes, error } = await query;
      if (error) {
        console.error('fetchNotesData error:', error);
        throw error;
      }

      return { notes: notes || [], user, userName };
    },
    [exercice, isDG]
  );

  /**
   * Transforme les données des notes pour l'export
   */
  const transformNotesData = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (notes: any[]) => {
      // Récupérer les pièces jointes
      const noteIds = notes.map((n) => n.id);
      const attachmentsByNote: Record<string, string[]> = {};

      if (noteIds.length > 0) {
        const { data: attachmentCounts } = await supabase
          .from('notes_sef_pieces')
          .select('note_id, nom')
          .in('note_id', noteIds);

        // Grouper les pièces jointes par note
        (attachmentCounts || []).forEach((att: { note_id: string; nom: string }) => {
          if (!attachmentsByNote[att.note_id]) {
            attachmentsByNote[att.note_id] = [];
          }
          attachmentsByNote[att.note_id].push(att.nom);
        });
      }

      // Transformer les données
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return notes.map((note: any): Record<string, string | number> => {
        // Déterminer le type de bénéficiaire
        let beneficiaireType = 'Non renseigné';
        let beneficiaireName = '';
        if (note.beneficiaire?.raison_sociale) {
          beneficiaireType = 'Prestataire externe';
          beneficiaireName = note.beneficiaire.raison_sociale;
        } else if (note.beneficiaire_interne) {
          beneficiaireType = 'Agent interne';
          beneficiaireName =
            `${note.beneficiaire_interne.first_name || ''} ${note.beneficiaire_interne.last_name || ''}`.trim();
        }

        // Motif de décision (rejet ou report)
        let motifDecision = '';
        if (note.statut === 'rejete' && note.rejection_reason) {
          motifDecision = note.rejection_reason;
        } else if (note.statut === 'differe') {
          const parts: string[] = [];
          if (note.differe_motif) parts.push(note.differe_motif);
          if (note.differe_condition) parts.push(`Condition: ${note.differe_condition}`);
          if (note.differe_date_reprise) {
            parts.push(`Reprise: ${format(new Date(note.differe_date_reprise), 'dd/MM/yyyy')}`);
          }
          motifDecision = parts.join(' | ');
        }

        // Décidé le / par
        let decidedAt = '';
        let decidedBy = '';
        if (note.statut === 'valide') {
          decidedAt = note.validated_at
            ? format(new Date(note.validated_at), 'dd/MM/yyyy HH:mm')
            : '';
          decidedBy = note.validated_by_profile
            ? `${note.validated_by_profile.first_name || ''} ${note.validated_by_profile.last_name || ''}`.trim()
            : '';
        } else if (note.statut === 'rejete') {
          decidedAt = note.rejected_at
            ? format(new Date(note.rejected_at), 'dd/MM/yyyy HH:mm')
            : '';
          decidedBy = note.rejected_by_profile
            ? `${note.rejected_by_profile.first_name || ''} ${note.rejected_by_profile.last_name || ''}`.trim()
            : '';
        } else if (note.statut === 'differe') {
          decidedAt = note.differe_at ? format(new Date(note.differe_at), 'dd/MM/yyyy HH:mm') : '';
          decidedBy = note.differe_by_profile
            ? `${note.differe_by_profile.first_name || ''} ${note.differe_by_profile.last_name || ''}`.trim()
            : '';
        }

        const pjs = attachmentsByNote[note.id] || [];

        return {
          Référence: note.reference_pivot || note.numero || '',
          Exercice: note.exercice || '',
          Statut: STATUT_LABELS[note.statut] || note.statut || '',
          statut_raw: note.statut || '',
          urgence_raw: note.urgence || '',
          Objet: note.objet || '',
          Direction: note.direction?.label || note.direction?.sigle || '',
          Demandeur: note.demandeur
            ? `${note.demandeur.first_name || ''} ${note.demandeur.last_name || ''}`.trim()
            : '',
          Urgence: URGENCE_LABELS[note.urgence] || note.urgence || '',
          'Date souhaitée': note.date_souhaitee
            ? format(new Date(note.date_souhaitee), 'dd/MM/yyyy')
            : '',
          'Montant estimé': note.montant_estime
            ? new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(note.montant_estime)
            : '',
          Justification: note.justification || '',
          Description: note.description || '',
          Commentaire: note.commentaire || '',
          'Type bénéficiaire': beneficiaireType,
          Bénéficiaire: beneficiaireName,
          'Motif décision': motifDecision,
          'Créée le': note.created_at ? format(new Date(note.created_at), 'dd/MM/yyyy HH:mm') : '',
          'Créée par': note.created_by_profile
            ? `${note.created_by_profile.first_name || ''} ${note.created_by_profile.last_name || ''}`.trim()
            : '',
          'Soumise le': note.submitted_at
            ? format(new Date(note.submitted_at), 'dd/MM/yyyy HH:mm')
            : '',
          'Décidée le': decidedAt,
          'Décidée par': decidedBy,
          'Nb PJ': pjs.length,
          'Pièces jointes': pjs.join('; '),
        };
      });
    },
    []
  );

  /**
   * Stocke le fichier exporté dans Supabase Storage (optionnel)
   */
  const storeExportFile = useCallback(
    async (blob: Blob, fileName: string): Promise<string | null> => {
      try {
        const storagePath = `sygfp/exports/${exercice}/${fileName}`;
        const { error } = await supabase.storage.from('lovable-uploads').upload(storagePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

        if (error) {
          console.warn('Storage upload failed:', error.message);
          return null;
        }

        const { data: signedUrlData } = await supabase.storage
          .from('lovable-uploads')
          .createSignedUrl(storagePath, 3600);

        return signedUrlData?.signedUrl || null;
      } catch (err) {
        console.warn('Storage error:', err);
        return null;
      }
    },
    [exercice]
  );

  // ============================================================================
  // EXPORT EXCEL
  // ============================================================================

  const exportNotesSEF = useCallback(
    async (filters: ExportFilters = {}, tabLabel: string = 'toutes') => {
      if (!exercice) {
        toast.error('Exercice non sélectionné');
        return;
      }

      setIsExporting(true);
      setExportProgress('Récupération des données...');

      try {
        const { notes, user: _user, userName } = await fetchNotesData(filters);

        const fileStatutLabel = TAB_FILE_LABELS[tabLabel] || 'toutes';
        const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
        const fileName = `SYGFP_SEF_${exercice}_${fileStatutLabel}_${dateStr}.xlsx`;

        // Si aucune note, créer un fichier avec en-têtes et info
        if (!notes || notes.length === 0) {
          const wb = XLSX.utils.book_new();
          const headerData = [
            ["REPUBLIQUE DE CÔTE D'IVOIRE"],
            ['ARTI - Autorité de Régulation du Transport Intérieur'],
            [`LISTE DES NOTES SEF - Exercice ${exercice}`],
            [
              `Filtre: ${TAB_DISPLAY_LABELS[tabLabel] || tabLabel} | Exporté par: ${userName} | Le: ${format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`,
            ],
            [],
            EXPORT_COLUMNS.map((c) => c.key),
            ['Aucune note trouvée pour les critères sélectionnés'],
          ];
          const ws = XLSX.utils.aoa_to_sheet(headerData);
          ws['!cols'] = EXPORT_COLUMNS.map((c) => ({ wch: c.width }));
          XLSX.utils.book_append_sheet(wb, ws, 'Notes SEF');
          const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([buf], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          downloadBlob(blob, fileName);
          toast.info('Fichier exporté (aucune note pour ces critères)');
          return;
        }

        if (notes.length >= MAX_EXPORT_ROWS) {
          toast.warning(`Export limité à ${MAX_EXPORT_ROWS} lignes. Affinez vos filtres.`);
        }

        // Transformer les données
        setExportProgress('Récupération des pièces jointes...');
        const exportData = await transformNotesData(notes);

        // Créer le fichier Excel avec en-tête ARTI
        setExportProgress('Préparation du fichier Excel...');
        const wb = XLSX.utils.book_new();

        // En-tête institutionnel
        const headerRows = [
          ["REPUBLIQUE DE CÔTE D'IVOIRE"],
          ['ARTI - Autorité de Régulation du Transport Intérieur'],
          [],
          [`LISTE DES NOTES SEF - Exercice ${exercice}`],
          [
            `Filtre: ${TAB_DISPLAY_LABELS[tabLabel] || tabLabel} | ${notes.length} note(s) | Exporté par: ${userName} | Le: ${format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`,
          ],
          [],
        ];

        // Colonnes de données (sans les colonnes internes statut_raw, urgence_raw)
        const dataColumns = EXPORT_COLUMNS.map((c) => c.key);
        headerRows.push(dataColumns);

        const ws = XLSX.utils.aoa_to_sheet(headerRows);

        // Ajouter les données
        const dataRows = exportData.map((row) => dataColumns.map((col) => row[col] ?? ''));
        XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: `A${headerRows.length + 1}` });

        // Ligne de résumé
        const summaryRowIdx = headerRows.length + 1 + dataRows.length;
        XLSX.utils.sheet_add_aoa(
          ws,
          [
            [
              `TOTAL: ${exportData.length} note(s) exportée(s)`,
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
            ],
          ],
          { origin: `A${summaryRowIdx}` }
        );

        // Largeurs de colonnes
        ws['!cols'] = EXPORT_COLUMNS.map((c) => ({ wch: c.width }));

        XLSX.utils.book_append_sheet(wb, ws, 'Notes SEF');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        // Toujours télécharger en local d'abord
        downloadBlob(blob, fileName);

        // Stockage Supabase en arrière-plan (optionnel)
        storeExportFile(blob, fileName).catch(() => {});

        // Log audit
        await logAction({
          entityType: 'notes_sef',
          action: 'EXPORT_EXCEL',
          newValues: {
            exercice,
            tab: tabLabel,
            filters: filters as unknown as Json,
            count: exportData.length,
            fileName,
          } as unknown as Json,
        });

        toast.success(`${exportData.length} note(s) exportée(s) en Excel`);
      } catch (error: unknown) {
        console.error('Export Excel error:', error);
        toast.error(
          "Erreur lors de l'export Excel: " +
            (error instanceof Error ? error.message : 'Erreur inconnue')
        );
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [exercice, fetchNotesData, transformNotesData, storeExportFile, logAction]
  );

  // ============================================================================
  // EXPORT PDF
  // ============================================================================

  const exportNotesSEFPDF = useCallback(
    async (filters: ExportFilters = {}, tabLabel: string = 'toutes') => {
      if (!exercice) {
        toast.error('Exercice non sélectionné');
        return;
      }

      setIsExporting(true);
      setExportProgress('Récupération des données...');

      try {
        const { notes, userName } = await fetchNotesData(filters);

        // Transformer les données (même si vide, on génère le PDF)
        setExportProgress('Préparation des données...');
        const exportData = notes.length > 0 ? await transformNotesData(notes) : [];

        if (notes.length >= MAX_EXPORT_ROWS) {
          toast.warning(`Export limité à ${MAX_EXPORT_ROWS} lignes.`);
        }

        // Compter par statut pour le résumé
        const statutCounts: Record<string, number> = {};
        exportData.forEach((row) => {
          const s = String(row['statut_raw'] || 'autre');
          statutCounts[s] = (statutCounts[s] || 0) + 1;
        });

        // Générer le HTML PDF
        setExportProgress('Génération du PDF...');
        const _fileStatutLabel = TAB_FILE_LABELS[tabLabel] || 'toutes';
        const displayLabel = TAB_DISPLAY_LABELS[tabLabel] || tabLabel;
        const title = `Liste des Notes SEF - ${displayLabel}`;
        const logoUrl = `${window.location.origin}/logo-arti.jpg`;
        const generatedDate = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
        const shortDate = format(new Date(), 'dd/MM/yyyy HH:mm');

        const html = generatePdfHtml({
          title,
          exercice,
          logoUrl,
          generatedDate,
          shortDate,
          displayLabel,
          exportData,
          statutCounts,
          pdfColumns: PDF_COLUMNS,
          userName,
        });

        // Log audit
        await logAction({
          entityType: 'notes_sef',
          action: 'EXPORT_PDF',
          newValues: {
            exercice,
            tab: tabLabel,
            filters: filters as unknown as Json,
            count: exportData.length,
          } as unknown as Json,
        });

        // Ouvrir la fenêtre d'impression
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 500);
          };
        } else {
          toast.error(
            "Impossible d'ouvrir la fenêtre d'impression. Autorisez les popups pour ce site."
          );
        }

        if (exportData.length > 0) {
          toast.success(`${exportData.length} note(s) - PDF prêt pour impression`);
        } else {
          toast.info('PDF généré (aucune note pour ces critères)');
        }
      } catch (error: unknown) {
        console.error('Export PDF error:', error);
        toast.error(
          "Erreur lors de l'export PDF: " +
            (error instanceof Error ? error.message : 'Erreur inconnue')
        );
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [exercice, fetchNotesData, transformNotesData, logAction]
  );

  return {
    exportNotesSEF,
    exportNotesSEFPDF,
    isExporting,
    exportProgress,
  };
}

// ============================================================================
// Fonctions utilitaires
// ============================================================================

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getStatutBadgeHtml(statut: string): string {
  const colors = STATUT_COLORS[statut] || STATUT_COLORS.brouillon;
  const label = STATUT_LABELS[statut] || statut;
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:7px;font-weight:600;background:${colors.bg};color:${colors.text};border:1px solid ${colors.border}">${label}</span>`;
}

function getUrgenceBadgeHtml(urgence: string): string {
  const colors = URGENCE_COLORS[urgence] || URGENCE_COLORS.normale;
  const label = URGENCE_LABELS[urgence] || urgence;
  return `<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:7px;background:${colors.bg};color:${colors.text}">${label}</span>`;
}

// ============================================================================
// Générateur HTML pour le PDF
// ============================================================================

interface PdfHtmlOptions {
  title: string;
  exercice: number;
  logoUrl: string;
  generatedDate: string;
  shortDate: string;
  displayLabel: string;
  exportData: Record<string, string | number>[];
  statutCounts: Record<string, number>;
  pdfColumns: { key: string; label: string; width: string }[];
  userName: string;
}

function generatePdfHtml(opts: PdfHtmlOptions): string {
  const {
    title,
    exercice,
    logoUrl,
    generatedDate,
    shortDate,
    displayLabel,
    exportData,
    statutCounts,
    pdfColumns,
    userName,
  } = opts;

  // Résumé par statut
  const statutSummaryHtml = Object.entries(STATUT_LABELS)
    .filter(([key]) => statutCounts[key])
    .map(([key, label]) => {
      const colors = STATUT_COLORS[key] || STATUT_COLORS.brouillon;
      return `<span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:9px;font-weight:600;background:${colors.bg};color:${colors.text};border:1px solid ${colors.border};margin-right:6px">${label}: ${statutCounts[key]}</span>`;
    })
    .join('');

  // Lignes du tableau
  const tableRowsHtml =
    exportData.length === 0
      ? `<tr><td colspan="${pdfColumns.length}" style="text-align:center;padding:30px;color:#6b7280;font-style:italic">Aucune note trouvée pour les critères sélectionnés</td></tr>`
      : exportData
          .map((row, idx) => {
            const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            return `<tr style="background:${bgColor}">
          ${pdfColumns
            .map((col) => {
              let cellContent = String(row[col.key] || '-');
              // Badges colorés pour statut et urgence
              if (col.key === 'Statut') {
                cellContent = getStatutBadgeHtml(String(row['statut_raw'] || ''));
              } else if (col.key === 'Urgence') {
                cellContent = getUrgenceBadgeHtml(String(row['urgence_raw'] || ''));
              } else if (cellContent.length > 60) {
                cellContent = cellContent.substring(0, 57) + '...';
              }
              return `<td style="padding:5px 6px;border:1px solid #e2e8f0;font-size:8px;vertical-align:top">${cellContent}</td>`;
            })
            .join('')}
        </tr>`;
          })
          .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title} - Exercice ${exercice}</title>
  <style>
    @page {
      margin: 12mm 10mm;
      size: A4 landscape;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 9px;
      color: #1e293b;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* === EN-TÊTE === */
    .doc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 3px solid #1e3a5f;
      margin-bottom: 12px;
    }
    .doc-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .doc-logo {
      height: 55px;
      width: auto;
      border-radius: 4px;
    }
    .doc-org {
      font-size: 8px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .doc-org-name {
      font-size: 11px;
      font-weight: 700;
      color: #1e3a5f;
    }
    .doc-system {
      font-size: 8px;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-header-right {
      text-align: right;
      font-size: 8px;
      color: #64748b;
    }
    .doc-header-right strong {
      color: #1e293b;
    }

    /* === TITRE DOCUMENT === */
    .doc-title {
      text-align: center;
      margin: 14px 0 6px;
    }
    .doc-title h1 {
      font-size: 15px;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 4px;
    }
    .doc-title .subtitle {
      font-size: 10px;
      color: #64748b;
    }

    /* === BARRE DE RÉSUMÉ === */
    .summary-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 14px;
      margin-bottom: 12px;
    }
    .summary-bar .counts { display: flex; flex-wrap: wrap; gap: 4px; }
    .summary-bar .total {
      font-size: 10px;
      font-weight: 700;
      color: #1e3a5f;
    }

    /* === TABLEAU === */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .data-table thead th {
      background: #1e3a5f;
      color: #ffffff;
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      padding: 6px 6px;
      text-align: left;
      border: 1px solid #1e3a5f;
    }
    .data-table tbody tr:hover { background: #f1f5f9 !important; }

    /* === PIED DE PAGE === */
    .doc-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 2px solid #1e3a5f;
      padding-top: 8px;
      margin-top: 10px;
      font-size: 7px;
      color: #94a3b8;
    }
    .doc-footer-left { display: flex; flex-direction: column; gap: 1px; }
    .doc-footer-right { text-align: right; }
    .doc-footer strong { color: #64748b; }

    /* === IMPRESSION === */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .data-table { page-break-inside: auto; }
      .data-table tr { page-break-inside: avoid; }
      .data-table thead { display: table-header-group; }
      .doc-footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 8px 10mm; }
    }
  </style>
</head>
<body>

  <!-- EN-TÊTE -->
  <div class="doc-header">
    <div class="doc-header-left">
      <img src="${logoUrl}" alt="ARTI" class="doc-logo" onerror="this.style.display='none'" />
      <div>
        <div class="doc-org">République de Côte d'Ivoire</div>
        <div class="doc-org-name">ARTI - Autorité de Régulation du Transport Intérieur</div>
        <div class="doc-system">Système de Gestion des Finances Publiques (SYGFP)</div>
      </div>
    </div>
    <div class="doc-header-right">
      <div><strong>Exercice :</strong> ${exercice}</div>
      <div><strong>Date :</strong> ${shortDate}</div>
      <div><strong>Filtre :</strong> ${displayLabel}</div>
      <div><strong>Exporté par :</strong> ${userName}</div>
    </div>
  </div>

  <!-- TITRE -->
  <div class="doc-title">
    <h1>${title}</h1>
    <div class="subtitle">${exportData.length} note(s) | Généré le ${generatedDate}</div>
  </div>

  <!-- BARRE DE RÉSUMÉ -->
  <div class="summary-bar">
    <div class="counts">${statutSummaryHtml || '<span style="color:#94a3b8;font-size:9px">Aucun résultat</span>'}</div>
    <div class="total">${exportData.length} note(s)</div>
  </div>

  <!-- TABLEAU -->
  <table class="data-table">
    <thead>
      <tr>
        ${pdfColumns.map((c) => `<th style="width:${c.width}">${c.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <!-- PIED DE PAGE -->
  <div class="doc-footer">
    <div class="doc-footer-left">
      <span><strong>SYGFP</strong> - Système de Gestion des Finances Publiques</span>
      <span>Document officiel généré automatiquement - Ne pas modifier</span>
    </div>
    <div class="doc-footer-right">
      <span>Exercice ${exercice} | ${shortDate}</span>
    </div>
  </div>

</body>
</html>`;
}
