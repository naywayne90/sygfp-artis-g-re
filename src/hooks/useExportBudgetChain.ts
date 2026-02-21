/**
 * Hook d'export Excel pour la chaîne d'exécution budgétaire
 * Expression de Besoin → Engagement → Liquidation → Ordonnancement → Règlement
 *
 * Exports conformes aux formats Excel partagés
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, ExportColumn, ExportOptions } from '@/lib/export/export-service';
import { splitImputation } from '@/lib/budget/imputation-utils';

// ============================================================================
// Types
// ============================================================================

export type ExportStep =
  | 'expression'
  | 'engagement'
  | 'liquidation'
  | 'ordonnancement'
  | 'reglement';

export interface ExportFilters {
  dateDebut?: string;
  dateFin?: string;
  statut?: string;
  directionId?: string;
}

export interface ExportResult {
  success: boolean;
  rowCount?: number;
  filename?: string;
  error?: string;
}

// ============================================================================
// Colonnes par étape (format officiel ARTI)
// ============================================================================

const EXPRESSION_COLUMNS: ExportColumn[] = [
  { key: 'rowNum', label: 'N°', type: 'number', width: 5 },
  { key: 'numero', label: 'N° Dépense', type: 'text', width: 18 },
  { key: 'created_at', label: 'Date', type: 'date', width: 12 },
  { key: 'fournisseur', label: 'Fournisseur', type: 'text', width: 30 },
  { key: 'objet', label: 'Objet', type: 'text', width: 40 },
  { key: 'montant_estime', label: 'Montant Estimé', type: 'currency', width: 15 },
  { key: 'direction_sigle', label: 'Direction', type: 'text', width: 10 },
  { key: 'urgence', label: 'Urgence', type: 'text', width: 10 },
  { key: 'statut', label: 'Statut', type: 'text', width: 12 },
  { key: 'nb_articles', label: 'Nb Articles', type: 'number', width: 10 },
  { key: 'articles_detail', label: 'Détail Articles', type: 'text', width: 50 },
];

const EXPRESSION_ARTICLES_COLUMNS: ExportColumn[] = [
  { key: 'eb_numero', label: 'N° EB', type: 'text', width: 18 },
  { key: 'designation', label: 'Désignation', type: 'text', width: 40 },
  { key: 'quantite', label: 'Quantité', type: 'number', width: 10 },
  { key: 'unite', label: 'Unité', type: 'text', width: 12 },
  { key: 'prix_unitaire', label: 'PU (FCFA)', type: 'currency', width: 15 },
  { key: 'prix_total', label: 'Total (FCFA)', type: 'currency', width: 15 },
];

const ENGAGEMENT_COLUMNS: ExportColumn[] = [
  { key: 'rowNum', label: 'N°', type: 'number', width: 5 },
  { key: 'numero', label: 'N° Dépense', type: 'text', width: 18 },
  { key: 'date_engagement', label: 'Date', type: 'date', width: 12 },
  { key: 'fournisseur', label: 'Fournisseur', type: 'text', width: 30 },
  { key: 'objet', label: 'Objet', type: 'text', width: 40 },
  { key: 'montant', label: 'Montant', type: 'currency', width: 15 },
  { key: 'budget_line_code', label: 'Imputation', type: 'text', width: 20 },
  { key: 'direction_sigle', label: 'Direction', type: 'text', width: 10 },
  { key: 'statut', label: 'Statut', type: 'text', width: 12 },
  { key: 'workflow_status', label: 'Étape Workflow', type: 'text', width: 15 },
];

const LIQUIDATION_COLUMNS: ExportColumn[] = [
  { key: 'rowNum', label: 'N°', type: 'number', width: 5 },
  { key: 'numero', label: 'N° Liquidation', type: 'text', width: 18 },
  { key: 'date_liquidation', label: 'Date', type: 'date', width: 12 },
  { key: 'engagement_numero', label: 'N° Engagement', type: 'text', width: 18 },
  { key: 'engagement_objet', label: 'Objet', type: 'text', width: 35 },
  { key: 'fournisseur', label: 'Fournisseur', type: 'text', width: 25 },
  { key: 'montant', label: 'Montant TTC', type: 'currency', width: 15 },
  { key: 'montant_ht', label: 'Montant HT', type: 'currency', width: 15 },
  { key: 'total_retenues', label: 'Retenues', type: 'currency', width: 13 },
  { key: 'net_a_payer', label: 'Net à Payer', type: 'currency', width: 15 },
  { key: 'regime_fiscal', label: 'Régime', type: 'text', width: 10 },
  { key: 'reference_facture', label: 'Réf. Facture', type: 'text', width: 15 },
  { key: 'budget_line_code', label: 'Imputation', type: 'text', width: 20 },
  { key: 'direction_sigle', label: 'Direction', type: 'text', width: 10 },
  { key: 'service_fait_label', label: 'Service Fait', type: 'text', width: 10 },
  { key: 'sf_certifie_par', label: 'Certifié par', type: 'text', width: 20 },
  { key: 'visa_daaf_par', label: 'Visa DAAF', type: 'text', width: 20 },
  { key: 'visa_dg_par', label: 'Visa DG', type: 'text', width: 20 },
  { key: 'statut', label: 'Statut', type: 'text', width: 12 },
  { key: 'reglement_urgent_label', label: 'Urgent', type: 'text', width: 8 },
  { key: 'createur', label: 'Créateur', type: 'text', width: 20 },
];

const LIQUIDATION_RETENUES_COLUMNS: ExportColumn[] = [
  { key: 'rowNum', label: 'N°', type: 'number', width: 5 },
  { key: 'numero', label: 'N° Liquidation', type: 'text', width: 18 },
  { key: 'fournisseur', label: 'Fournisseur', type: 'text', width: 25 },
  { key: 'montant', label: 'Montant TTC', type: 'currency', width: 15 },
  { key: 'montant_ht', label: 'Montant HT', type: 'currency', width: 15 },
  { key: 'tva_taux', label: 'TVA %', type: 'number', width: 8 },
  { key: 'tva_montant', label: 'TVA', type: 'currency', width: 13 },
  { key: 'airsi_taux', label: 'AIRSI %', type: 'number', width: 8 },
  { key: 'airsi_montant', label: 'AIRSI', type: 'currency', width: 13 },
  { key: 'retenue_bic_taux', label: 'BIC %', type: 'number', width: 8 },
  { key: 'retenue_bic_montant', label: 'BIC', type: 'currency', width: 13 },
  { key: 'retenue_bnc_taux', label: 'BNC %', type: 'number', width: 8 },
  { key: 'retenue_bnc_montant', label: 'BNC', type: 'currency', width: 13 },
  { key: 'retenue_source_taux', label: 'Ret. Source %', type: 'number', width: 10 },
  { key: 'retenue_source_montant', label: 'Ret. Source', type: 'currency', width: 13 },
  { key: 'penalites_montant', label: 'Pénalités', type: 'currency', width: 13 },
  { key: 'total_retenues', label: 'Total Retenues', type: 'currency', width: 15 },
  { key: 'net_a_payer', label: 'Net à Payer', type: 'currency', width: 15 },
];

const LIQUIDATION_RECAP_COLUMNS: ExportColumn[] = [
  { key: 'direction', label: 'Direction', type: 'text', width: 15 },
  { key: 'nb_liquidations', label: 'Nb Liquidations', type: 'number', width: 14 },
  { key: 'montant_total_ttc', label: 'Montant TTC', type: 'currency', width: 18 },
  { key: 'montant_total_ht', label: 'Montant HT', type: 'currency', width: 18 },
  { key: 'total_retenues', label: 'Total Retenues', type: 'currency', width: 18 },
  { key: 'net_a_payer', label: 'Net à Payer', type: 'currency', width: 18 },
  { key: 'nb_valide', label: 'Validées', type: 'number', width: 10 },
  { key: 'nb_soumis', label: 'Soumises', type: 'number', width: 10 },
  { key: 'nb_brouillon', label: 'Brouillons', type: 'number', width: 10 },
  { key: 'nb_rejete', label: 'Rejetées', type: 'number', width: 10 },
  { key: 'nb_urgent', label: 'Urgentes', type: 'number', width: 10 },
];

const ORDONNANCEMENT_COLUMNS: ExportColumn[] = [
  { key: 'rowNum', label: 'N°', type: 'number', width: 5 },
  { key: 'numero', label: 'N° Dépense', type: 'text', width: 18 },
  { key: 'imputation_court', label: 'Imputation (10 car.)', type: 'text', width: 12 },
  { key: 'imputation_suite', label: 'Imputation (Suite)', type: 'text', width: 25 },
  { key: 'beneficiaire', label: 'Bénéficiaire', type: 'text', width: 30 },
  { key: 'objet', label: 'Objet', type: 'text', width: 40 },
  { key: 'montant', label: 'Montant', type: 'currency', width: 15 },
  { key: 'mode_paiement', label: 'Mode Paiement', type: 'text', width: 12 },
  { key: 'liquidation_numero', label: 'N° Liquidation', type: 'text', width: 18 },
  { key: 'statut', label: 'Statut', type: 'text', width: 12 },
];

const REGLEMENT_COLUMNS: ExportColumn[] = [
  { key: 'rowNum', label: 'N°', type: 'number', width: 5 },
  { key: 'numero', label: 'N° Dépense', type: 'text', width: 18 },
  { key: 'imputation', label: 'Imputation', type: 'text', width: 25 },
  { key: 'sous_activite', label: 'Sous-activité', type: 'text', width: 30 },
  { key: 'beneficiaire', label: 'Bénéficiaire', type: 'text', width: 30 },
  { key: 'montant', label: 'Montant', type: 'currency', width: 15 },
  { key: 'date_paiement', label: 'Date Paiement', type: 'date', width: 12 },
  { key: 'mode_paiement', label: 'Mode', type: 'text', width: 12 },
  { key: 'reference_paiement', label: 'Référence', type: 'text', width: 20 },
  { key: 'ordonnancement_numero', label: 'N° Ordonnancement', type: 'text', width: 18 },
  { key: 'statut', label: 'Statut', type: 'text', width: 12 },
];

// ============================================================================
// Hook principal
// ============================================================================

export function useExportBudgetChain() {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // ============================================================================
  // Fonctions de fetch avec filtres
  // ============================================================================

  const fetchExpressions = useCallback(
    async (filters: ExportFilters) => {
      let query = supabase
        .from('expressions_besoin')
        .select(
          `
        id, numero, objet, description, montant_estime, urgence, statut,
        created_at, submitted_at, validated_at, liste_articles,
        direction:directions(sigle, label),
        marche:marches!expressions_besoin_marche_id_fkey(
          prestataire:prestataires(raison_sociale)
        )
      `
        )
        .eq('exercice', exercice)
        .order('created_at', { ascending: false });

      if (filters.statut) {
        query = query.eq('statut', filters.statut);
      }
      if (filters.directionId) {
        query = query.eq('direction_id', filters.directionId);
      }
      if (filters.dateDebut) {
        query = query.gte('created_at', filters.dateDebut);
      }
      if (filters.dateFin) {
        query = query.lte('created_at', filters.dateFin + 'T23:59:59');
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item, index) => {
        const articles = Array.isArray(item.liste_articles) ? item.liste_articles : [];
        const articlesDetail = articles
          .map((a: unknown) => {
            const rec = a as Record<string, unknown>;
            const designation = (rec.designation as string) || (rec.article as string) || '?';
            const qte = Number(rec.quantite) || 0;
            const pu = Number(rec.prix_unitaire) || 0;
            const total = Number(rec.prix_total) || qte * pu;
            return `${designation} (${qte} × ${new Intl.NumberFormat('fr-FR').format(pu)} = ${new Intl.NumberFormat('fr-FR').format(total)})`;
          })
          .join(' | ');

        return {
          rowNum: index + 1,
          numero: item.numero || '-',
          created_at: item.created_at,
          fournisseur: item.marche?.prestataire?.raison_sociale || '-',
          objet: item.objet || '-',
          montant_estime: item.montant_estime || 0,
          direction_sigle: item.direction?.sigle || '-',
          urgence: item.urgence || 'normale',
          statut: item.statut || '-',
          nb_articles: articles.length,
          articles_detail: articlesDetail || '-',
        };
      });
    },
    [exercice]
  );

  const fetchEngagements = useCallback(
    async (filters: ExportFilters) => {
      let query = supabase
        .from('budget_engagements')
        .select(
          `
        id, numero, objet, montant, fournisseur, date_engagement, statut, workflow_status,
        budget_line:budget_lines(
          code, label,
          direction:directions(sigle)
        )
      `
        )
        .eq('exercice', exercice)
        .order('created_at', { ascending: false });

      if (filters.statut) {
        query = query.eq('statut', filters.statut);
      }
      if (filters.dateDebut) {
        query = query.gte('date_engagement', filters.dateDebut);
      }
      if (filters.dateFin) {
        query = query.lte('date_engagement', filters.dateFin);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item, index) => ({
        rowNum: index + 1,
        numero: item.numero || '-',
        date_engagement: item.date_engagement,
        fournisseur: item.fournisseur || '-',
        objet: item.objet || '-',
        montant: item.montant || 0,
        budget_line_code: item.budget_line?.code || '-',
        direction_sigle: item.budget_line?.direction?.sigle || '-',
        statut: item.statut || '-',
        workflow_status: item.workflow_status || '-',
      }));
    },
    [exercice]
  );

  const fetchLiquidations = useCallback(
    async (filters: ExportFilters) => {
      const { data, error } = await supabase.rpc('rpc_export_liquidations', {
        p_exercice: exercice,
        p_statut: filters.statut || null,
        p_direction_id: filters.directionId || null,
        p_date_debut: filters.dateDebut || null,
        p_date_fin: filters.dateFin || null,
      });

      if (error) throw error;

      type RpcRow = Record<string, unknown>;
      return ((data as RpcRow[] | null) || []).map((item: RpcRow, index: number) => ({
        rowNum: index + 1,
        numero: (item.numero as string) || '-',
        date_liquidation: item.date_liquidation as string,
        engagement_numero: (item.engagement_numero as string) || '-',
        engagement_objet: (item.engagement_objet as string) || '-',
        fournisseur: (item.fournisseur as string) || '-',
        montant: (item.montant as number) || 0,
        montant_ht: (item.montant_ht as number) || 0,
        tva_taux: (item.tva_taux as number) || 0,
        tva_montant: (item.tva_montant as number) || 0,
        airsi_taux: (item.airsi_taux as number) || 0,
        airsi_montant: (item.airsi_montant as number) || 0,
        retenue_bic_taux: (item.retenue_bic_taux as number) || 0,
        retenue_bic_montant: (item.retenue_bic_montant as number) || 0,
        retenue_bnc_taux: (item.retenue_bnc_taux as number) || 0,
        retenue_bnc_montant: (item.retenue_bnc_montant as number) || 0,
        retenue_source_taux: (item.retenue_source_taux as number) || 0,
        retenue_source_montant: (item.retenue_source_montant as number) || 0,
        penalites_montant: (item.penalites_montant as number) || 0,
        total_retenues: (item.total_retenues as number) || 0,
        net_a_payer: (item.net_a_payer as number) || (item.montant as number) || 0,
        regime_fiscal: (item.regime_fiscal as string) || '-',
        reference_facture: (item.reference_facture as string) || '-',
        budget_line_code: (item.budget_line_code as string) || '-',
        direction_sigle: (item.direction_sigle as string) || '-',
        service_fait_label: item.service_fait ? 'Oui' : 'Non',
        sf_certifie_par: (item.sf_certifie_par as string) || '-',
        visa_daaf_par: (item.visa_daaf_par as string) || '-',
        visa_dg_par: (item.visa_dg_par as string) || '-',
        statut: (item.statut as string) || '-',
        reglement_urgent_label: item.reglement_urgent ? 'Oui' : 'Non',
        reglement_urgent_motif: (item.reglement_urgent_motif as string) || '-',
        createur: (item.createur as string) || '-',
      }));
    },
    [exercice]
  );

  const fetchOrdonnancements = useCallback(
    async (filters: ExportFilters) => {
      let query = supabase
        .from('ordonnancements')
        .select(
          `
        id, numero, montant, beneficiaire, mode_paiement, objet, statut,
        created_at, date_prevue_paiement,
        liquidation:budget_liquidations(
          numero,
          engagement:budget_engagements(
            budget_line:budget_lines(
              code, label,
              sous_activite:sous_activites(code, libelle)
            )
          )
        )
      `
        )
        .eq('exercice', exercice)
        .order('created_at', { ascending: false });

      if (filters.statut) {
        query = query.eq('statut', filters.statut);
      }
      if (filters.dateDebut) {
        query = query.gte('created_at', filters.dateDebut);
      }
      if (filters.dateFin) {
        query = query.lte('created_at', filters.dateFin + 'T23:59:59');
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item, index) => {
        const budgetLineCode = item.liquidation?.engagement?.budget_line?.code || '';
        const { imputation_10, imputation_suite } = splitImputation(budgetLineCode);
        return {
          rowNum: index + 1,
          numero: item.numero || '-',
          imputation_court: imputation_10,
          imputation_suite: imputation_suite,
          beneficiaire: item.beneficiaire || '-',
          objet: item.objet || '-',
          montant: item.montant || 0,
          mode_paiement: item.mode_paiement || '-',
          liquidation_numero: item.liquidation?.numero || '-',
          statut: item.statut || '-',
        };
      });
    },
    [exercice]
  );

  const fetchReglements = useCallback(
    async (filters: ExportFilters) => {
      let query = supabase
        .from('reglements')
        .select(
          `
        id, numero, montant, date_paiement, mode_paiement, reference_paiement, statut,
        ordonnancement:ordonnancements(
          numero, beneficiaire,
          liquidation:budget_liquidations(
            engagement:budget_engagements(
              budget_line:budget_lines(
                code,
                sous_activite:sous_activites(code, libelle)
              )
            )
          )
        )
      `
        )
        .eq('exercice', exercice)
        .order('created_at', { ascending: false });

      if (filters.statut) {
        query = query.eq('statut', filters.statut);
      }
      if (filters.dateDebut) {
        query = query.gte('date_paiement', filters.dateDebut);
      }
      if (filters.dateFin) {
        query = query.lte('date_paiement', filters.dateFin);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item, index) => {
        const budgetLine = item.ordonnancement?.liquidation?.engagement?.budget_line;
        const { imputation_complete } = splitImputation(budgetLine?.code);
        return {
          rowNum: index + 1,
          numero: item.numero || '-',
          imputation: imputation_complete || '-',
          sous_activite: budgetLine?.sous_activite?.libelle || '-',
          beneficiaire: item.ordonnancement?.beneficiaire || '-',
          montant: item.montant || 0,
          date_paiement: item.date_paiement,
          mode_paiement: item.mode_paiement || '-',
          reference_paiement: item.reference_paiement || '-',
          ordonnancement_numero: item.ordonnancement?.numero || '-',
          statut: item.statut || '-',
        };
      });
    },
    [exercice]
  );

  // ============================================================================
  // Export générique par étape
  // ============================================================================

  const exportStep = useCallback(
    async (
      step: ExportStep,
      filters: ExportFilters = {},
      exportAll: boolean = false
    ): Promise<ExportResult> => {
      setIsExporting(true);

      try {
        let data: Record<string, unknown>[];
        let columns: ExportColumn[];
        let title: string;
        let filename: string;

        // Si exportAll, on ignore les filtres de statut
        const effectiveFilters = exportAll ? { ...filters, statut: undefined } : filters;

        // Articles data for expression sheet
        const expressionArticles: Record<string, unknown>[] = [];

        switch (step) {
          case 'expression': {
            data = await fetchExpressions(effectiveFilters);
            columns = EXPRESSION_COLUMNS;
            title = 'Expressions de Besoin';
            filename = `expressions_besoin_${exercice}`;

            // Build flattened articles list for secondary sheet
            let articlesQuery = supabase
              .from('expressions_besoin')
              .select('numero, liste_articles')
              .eq('exercice', exercice);

            if (effectiveFilters.statut) {
              articlesQuery = articlesQuery.eq('statut', effectiveFilters.statut);
            }
            if (effectiveFilters.directionId) {
              articlesQuery = articlesQuery.eq('direction_id', effectiveFilters.directionId);
            }
            if (effectiveFilters.dateDebut) {
              articlesQuery = articlesQuery.gte('created_at', effectiveFilters.dateDebut);
            }
            if (effectiveFilters.dateFin) {
              articlesQuery = articlesQuery.lte(
                'created_at',
                effectiveFilters.dateFin + 'T23:59:59'
              );
            }

            const { data: articlesData } = await articlesQuery;
            if (articlesData) {
              for (const eb of articlesData) {
                const articles = Array.isArray(eb.liste_articles) ? eb.liste_articles : [];
                for (const a of articles as Record<string, unknown>[]) {
                  const qte = Number(a.quantite) || 0;
                  const pu = Number(a.prix_unitaire) || 0;
                  expressionArticles.push({
                    eb_numero: eb.numero || '-',
                    designation: (a.designation as string) || (a.article as string) || '-',
                    quantite: qte,
                    unite: (a.unite as string) || '-',
                    prix_unitaire: pu,
                    prix_total: Number(a.prix_total) || qte * pu,
                  });
                }
              }
            }
            break;
          }

          case 'engagement':
            data = await fetchEngagements(effectiveFilters);
            columns = ENGAGEMENT_COLUMNS;
            title = 'Engagements Budgétaires';
            filename = `engagements_${exercice}`;
            break;

          case 'liquidation':
            data = await fetchLiquidations(effectiveFilters);
            columns = LIQUIDATION_COLUMNS;
            title = 'Liquidations';
            filename = `liquidations_${exercice}`;
            break;

          case 'ordonnancement':
            data = await fetchOrdonnancements(effectiveFilters);
            columns = ORDONNANCEMENT_COLUMNS;
            title = 'Ordonnancements';
            filename = `ordonnancements_${exercice}`;
            break;

          case 'reglement':
            data = await fetchReglements(effectiveFilters);
            columns = REGLEMENT_COLUMNS;
            title = 'Règlements';
            filename = `reglements_${exercice}`;
            break;

          default:
            throw new Error(`Étape d'export inconnue: ${step}`);
        }

        if (data.length === 0) {
          toast({
            title: 'Export vide',
            description: 'Aucune donnée ne correspond aux critères de filtrage.',
            variant: 'default',
          });
          return { success: true, rowCount: 0 };
        }

        // Construire le sous-titre avec les filtres
        const filterParts: string[] = [];
        if (filters.statut) filterParts.push(`Statut: ${filters.statut}`);
        if (filters.dateDebut) filterParts.push(`Du: ${filters.dateDebut}`);
        if (filters.dateFin) filterParts.push(`Au: ${filters.dateFin}`);
        const subtitle = filterParts.length > 0 ? filterParts.join(' | ') : 'Toutes les données';

        const additionalSheets: ExportOptions['additionalSheets'] = [];
        if (step === 'expression' && expressionArticles.length > 0) {
          additionalSheets.push({
            name: 'Articles',
            data: expressionArticles,
            columns: EXPRESSION_ARTICLES_COLUMNS,
          });
        }
        if (step === 'liquidation' && data.length > 0) {
          additionalSheets.push({
            name: 'Détail Retenues',
            data,
            columns: LIQUIDATION_RETENUES_COLUMNS,
          });

          // Récapitulatif par direction
          const dirMap = new Map<
            string,
            {
              direction: string;
              nb_liquidations: number;
              montant_total_ttc: number;
              montant_total_ht: number;
              total_retenues: number;
              net_a_payer: number;
              nb_valide: number;
              nb_soumis: number;
              nb_brouillon: number;
              nb_rejete: number;
              nb_urgent: number;
            }
          >();
          for (const row of data) {
            const dir = (row.direction_sigle as string) || 'Non affecté';
            if (!dirMap.has(dir)) {
              dirMap.set(dir, {
                direction: dir,
                nb_liquidations: 0,
                montant_total_ttc: 0,
                montant_total_ht: 0,
                total_retenues: 0,
                net_a_payer: 0,
                nb_valide: 0,
                nb_soumis: 0,
                nb_brouillon: 0,
                nb_rejete: 0,
                nb_urgent: 0,
              });
            }
            const entry = dirMap.get(dir);
            if (!entry) continue;
            entry.nb_liquidations += 1;
            entry.montant_total_ttc += (row.montant as number) || 0;
            entry.montant_total_ht += (row.montant_ht as number) || 0;
            entry.total_retenues += (row.total_retenues as number) || 0;
            entry.net_a_payer += (row.net_a_payer as number) || 0;
            const statut = ((row.statut as string) || '').toLowerCase();
            if (statut.includes('valid')) entry.nb_valide += 1;
            else if (statut === 'soumis') entry.nb_soumis += 1;
            else if (statut === 'brouillon') entry.nb_brouillon += 1;
            else if (statut === 'rejete') entry.nb_rejete += 1;
            if ((row.reglement_urgent_label as string) === 'Oui') entry.nb_urgent += 1;
          }
          additionalSheets.push({
            name: 'Récapitulatif',
            data: Array.from(dirMap.values()) as unknown as Record<string, unknown>[],
            columns: LIQUIDATION_RECAP_COLUMNS,
          });
        }

        const options: ExportOptions = {
          title,
          subtitle,
          filename,
          exercice,
          showTotals: true,
          totalColumns: [
            'montant',
            'montant_estime',
            'montant_ht',
            'total_retenues',
            'net_a_payer',
          ],
          ...(additionalSheets.length > 0 && { additionalSheets }),
        };

        const result = exportToExcel(data, columns, options);

        if (result.success) {
          toast({
            title: 'Export réussi',
            description: `${result.rowCount ?? 0} enregistrement(s) exporté(s).`,
          });
        } else {
          toast({
            title: "Erreur d'export",
            description: result.error || "Une erreur est survenue lors de l'export.",
            variant: 'destructive',
          });
        }

        return result;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : "Erreur lors de l'export";
        toast({
          title: 'Erreur',
          description: errorMsg,
          variant: 'destructive',
        });
        return { success: false, rowCount: 0, error: errorMsg };
      } finally {
        setIsExporting(false);
      }
    },
    [
      exercice,
      fetchExpressions,
      fetchEngagements,
      fetchLiquidations,
      fetchOrdonnancements,
      fetchReglements,
      toast,
    ]
  );

  // ============================================================================
  // Fonctions d'export spécifiques
  // ============================================================================

  const exportExpressions = useCallback(
    (filters: ExportFilters = {}, exportAll = false) =>
      exportStep('expression', filters, exportAll),
    [exportStep]
  );

  const exportEngagements = useCallback(
    (filters: ExportFilters = {}, exportAll = false) =>
      exportStep('engagement', filters, exportAll),
    [exportStep]
  );

  const exportLiquidations = useCallback(
    (filters: ExportFilters = {}, exportAll = false) =>
      exportStep('liquidation', filters, exportAll),
    [exportStep]
  );

  const exportOrdonnancements = useCallback(
    (filters: ExportFilters = {}, exportAll = false) =>
      exportStep('ordonnancement', filters, exportAll),
    [exportStep]
  );

  const exportReglements = useCallback(
    (filters: ExportFilters = {}, exportAll = false) => exportStep('reglement', filters, exportAll),
    [exportStep]
  );

  // ============================================================================
  // Export chaîne complète
  // ============================================================================

  const exportFullChain = useCallback(
    async (filters: ExportFilters = {}): Promise<void> => {
      setIsExporting(true);

      try {
        // Export séquentiel de toutes les étapes
        const steps: { name: string; fn: () => Promise<ExportResult> }[] = [
          { name: 'Expressions', fn: () => exportExpressions(filters, true) },
          { name: 'Engagements', fn: () => exportEngagements(filters, true) },
          { name: 'Liquidations', fn: () => exportLiquidations(filters, true) },
          { name: 'Ordonnancements', fn: () => exportOrdonnancements(filters, true) },
          { name: 'Règlements', fn: () => exportReglements(filters, true) },
        ];

        let successCount = 0;
        for (const step of steps) {
          const result = await step.fn();
          if (result.success && result.rowCount > 0) {
            successCount++;
          }
          // Petit délai entre les exports
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        toast({
          title: 'Export complet terminé',
          description: `${successCount} fichier(s) exporté(s) avec succès.`,
        });
      } finally {
        setIsExporting(false);
      }
    },
    [
      exportExpressions,
      exportEngagements,
      exportLiquidations,
      exportOrdonnancements,
      exportReglements,
      toast,
    ]
  );

  return {
    isExporting,
    exportExpressions,
    exportEngagements,
    exportLiquidations,
    exportOrdonnancements,
    exportReglements,
    exportFullChain,
    exportStep,
  };
}

export default useExportBudgetChain;
