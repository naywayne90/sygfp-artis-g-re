import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExercice } from '@/contexts/ExerciceContext';
import { useAuditLog } from '@/hooks/useAuditLog';

export interface Liquidation {
  id: string;
  numero: string;
  montant: number;
  montant_ht: number | null;
  tva_taux: number | null;
  tva_montant: number | null;
  airsi_taux: number | null;
  airsi_montant: number | null;
  retenue_source_taux: number | null;
  retenue_source_montant: number | null;
  tva_applicable: boolean | null;
  retenue_bic_taux: number | null;
  retenue_bic_montant: number | null;
  retenue_bnc_taux: number | null;
  retenue_bnc_montant: number | null;
  penalites_retard: number | null;
  penalites_montant: number | null;
  penalites_nb_jours: number | null;
  penalites_taux_journalier: number | null;
  total_retenues: number | null;
  net_a_payer: number | null;
  date_liquidation: string;
  reference_facture: string | null;
  observation: string | null;
  service_fait: boolean | null;
  service_fait_date: string | null;
  service_fait_certifie_par: string | null;
  regime_fiscal: string | null;
  statut: string | null;
  workflow_status: string | null;
  current_step: number | null;
  engagement_id: string;
  exercice: number | null;
  created_by: string | null;
  created_at: string;
  submitted_at: string | null;
  validated_at: string | null;
  validated_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  date_differe: string | null;
  motif_differe: string | null;
  differe_by: string | null;
  deadline_correction: string | null;
  dossier_id: string | null;
  // Urgent fields
  reglement_urgent: boolean | null;
  reglement_urgent_motif: string | null;
  reglement_urgent_date: string | null;
  reglement_urgent_par: string | null;
  // Visa DAAF/DG (Prompt 7)
  visa_daaf_user_id: string | null;
  visa_daaf_date: string | null;
  visa_daaf_commentaire: string | null;
  visa_dg_user_id: string | null;
  visa_dg_date: string | null;
  visa_dg_commentaire: string | null;
  motif_rejet: string | null;
  service_fait_commentaire: string | null;
  // Joined data
  engagement?: {
    id: string;
    numero: string;
    objet: string;
    montant: number;
    fournisseur: string | null;
    budget_line?: {
      id: string;
      code: string;
      label: string;
      direction?: { label: string; sigle: string | null } | null;
    } | null;
    marche?: {
      id: string;
      numero: string | null;
      prestataire?: { id: string; raison_sociale: string } | null;
    } | null;
  } | null;
  creator?: { id: string; full_name: string | null } | null;
  visa_daaf_user?: { id: string; full_name: string | null } | null;
  visa_dg_user?: { id: string; full_name: string | null } | null;
  validated_by_profile?: { id: string; full_name: string | null } | null;
  rejected_by_profile?: { id: string; full_name: string | null } | null;
  sf_certifier?: { id: string; full_name: string | null } | null;
  attachments?: LiquidationAttachment[];
}

export interface LiquidationAttachment {
  id: string;
  liquidation_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

export interface LiquidationAvailability {
  montant_engage: number;
  liquidations_anterieures: number;
  nb_liquidations_anterieures: number;
  liquidation_actuelle: number;
  cumul: number;
  restant_a_liquider: number;
  is_valid: boolean;
}

export interface EngagementPourLiquidation {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  fournisseur: string | null;
  budget_line: {
    id: string;
    code: string;
    label: string;
    direction: { id: string; label: string; sigle: string | null } | null;
  } | null;
  marche: {
    id: string;
    numero: string | null;
    prestataire: { id: string; raison_sociale: string } | null;
  } | null;
}

/** Options de pagination et filtrage pour la requête serveur */
export interface LiquidationQueryOptions {
  page?: number;
  pageSize?: number;
  statut?: string | string[];
  search?: string;
  urgentOnly?: boolean;
}

/** Compteurs par statut pour KPIs et onglets */
export interface LiquidationCounts {
  total: number;
  brouillon: number;
  certifie_sf: number;
  soumis: number;
  valide_daaf: number;
  valide_dg: number;
  rejete: number;
  differe: number;
  annule: number;
  urgent: number;
  service_fait: number;
  total_montant: number;
  a_valider: number;
}

export const VALIDATION_STEPS = [
  { order: 1, role: 'DAAF', label: 'Directeur Administratif et Financier', statut: 'validé_daaf' },
  { order: 2, role: 'DG', label: 'Directeur Général', statut: 'validé_dg' },
];

/** Seuil de validation DG en FCFA — au-delà, la liquidation requiert la signature DG */
export const SEUIL_VALIDATION_DG = 50_000_000;

/** Détermine si une liquidation nécessite la validation DG */
export function requiresDgValidation(montant: number): boolean {
  return montant >= SEUIL_VALIDATION_DG;
}

/** Étapes simplifiées du workflow de validation */
export const VALIDATION_FLOW_STEPS = [
  { key: 'certifie_sf', label: 'Certifié SF', role: 'AUTEUR/SDCT' },
  { key: 'daaf', label: 'Validation DAAF', role: 'DAAF' },
  { key: 'dg', label: 'Validation DG', role: 'DG', conditional: true },
] as const;

export const DOCUMENTS_REQUIS = [
  { code: 'facture', label: 'Facture', obligatoire: true },
  { code: 'pv_reception', label: 'PV de réception', obligatoire: true },
  { code: 'bon_livraison', label: 'Bon de livraison', obligatoire: true },
  { code: 'attestation_service_fait', label: 'Attestation service fait', obligatoire: false },
  { code: 'autre', label: 'Autre document', obligatoire: false },
];

/** Info légère sur une liquidation "sœur" du même engagement */
export interface SiblingLiquidation {
  id: string;
  numero: string;
  montant: number;
  net_a_payer: number | null;
  statut: string | null;
  created_at: string;
}

/** Synthèse des liquidations partielles d'un engagement */
export interface EngagementLiquidationProgress {
  engagement_id: string;
  montant_engage: number;
  total_liquide: number;
  restant: number;
  count: number;
  pourcent: number;
  is_complet: boolean;
  siblings: SiblingLiquidation[];
}

/** Récupère les liquidations "sœurs" d'un engagement (hors annulées/rejetées) */
export async function fetchSiblingLiquidations(
  engagementId: string,
  excludeLiquidationId?: string
): Promise<SiblingLiquidation[]> {
  let query = supabase
    .from('budget_liquidations')
    .select('id, numero, montant, net_a_payer, statut, created_at')
    .eq('engagement_id', engagementId)
    .not('statut', 'in', '("annule","rejete")')
    .order('created_at', { ascending: true });

  if (excludeLiquidationId) {
    query = query.neq('id', excludeLiquidationId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as SiblingLiquidation[];
}

/** Calcule la progression de liquidation d'un engagement à partir des liquidations cachées */
export function computeEngagementProgress(
  engagementId: string,
  montantEngage: number,
  liquidations: Array<{ id: string; engagement_id: string; montant: number; statut: string | null }>
): Omit<EngagementLiquidationProgress, 'siblings'> {
  const siblings = liquidations.filter(
    (l) => l.engagement_id === engagementId && l.statut !== 'annule' && l.statut !== 'rejete'
  );
  const totalLiquide = siblings.reduce((s, l) => s + (l.montant || 0), 0);
  const restant = montantEngage - totalLiquide;
  const pourcent = montantEngage > 0 ? Math.min((totalLiquide / montantEngage) * 100, 100) : 0;

  return {
    engagement_id: engagementId,
    montant_engage: montantEngage,
    total_liquide: totalLiquide,
    restant,
    count: siblings.length,
    pourcent,
    is_complet: restant <= 0,
  };
}

export function useLiquidations(options?: LiquidationQueryOptions) {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const statut = options?.statut;
  const search = options?.search;
  const urgentOnly = options?.urgentOnly ?? false;

  // ── SELECT string réutilisé par la requête paginée et fetchAllForExport ──
  const SELECT_FULL = `
    *,
    engagement:budget_engagements(
      id, numero, objet, montant, fournisseur,
      budget_line:budget_lines(
        id, code, label,
        direction:directions(label, sigle)
      ),
      marche:marches(
        id, numero,
        prestataire:prestataires(id, raison_sociale)
      )
    ),
    creator:profiles!budget_liquidations_created_by_fkey(id, full_name),
    visa_daaf_user:profiles!budget_liquidations_visa_daaf_user_id_fkey(id, full_name),
    visa_dg_user:profiles!budget_liquidations_visa_dg_user_id_fkey(id, full_name),
    validated_by_profile:profiles!budget_liquidations_validated_by_fkey(id, full_name),
    rejected_by_profile:profiles!budget_liquidations_rejected_by_fkey(id, full_name),
    sf_certifier:profiles!budget_liquidations_service_fait_certifie_par_fkey(id, full_name)
  `;

  // Fetch paginated liquidations (serveur-side, 20/page)
  const {
    data: queryResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['liquidations', exercice, page, pageSize, statut, search, urgentOnly],
    queryFn: async () => {
      let query = supabase
        .from('budget_liquidations')
        .select(SELECT_FULL, { count: 'exact' })
        .eq('exercice', exercice);

      // Filtre par statut (onglet)
      if (statut) {
        if (Array.isArray(statut)) {
          query = query.in('statut', statut);
        } else {
          query = query.eq('statut', statut);
        }
      }

      // Recherche serveur sur numéro
      if (search && search.trim()) {
        query = query.ilike('numero', `%${search.trim()}%`);
      }

      // Filtre urgents uniquement
      if (urgentOnly) {
        query = query.eq('reglement_urgent', true);
      }

      // Tri urgents en premier + date décroissante
      query = query
        .order('reglement_urgent', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Pagination serveur
      const start = (page - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, error: queryError, count } = await query;
      if (queryError) throw queryError;

      // Fetch attachments batch pour cette page (fix N+1)
      const liquidationIds = (data || []).map((l) => l.id);
      const { data: allAttachments } =
        liquidationIds.length > 0
          ? await supabase
              .from('liquidation_attachments')
              .select('*')
              .in('liquidation_id', liquidationIds)
          : { data: [] };

      const attachmentMap = new Map<string, LiquidationAttachment[]>();
      (allAttachments || []).forEach((att) => {
        const list = attachmentMap.get(att.liquidation_id) || [];
        list.push(att);
        attachmentMap.set(att.liquidation_id, list);
      });

      return {
        data: (data || []).map((liq) => ({
          ...liq,
          attachments: attachmentMap.get(liq.id) || [],
        })) as Liquidation[],
        total: count ?? 0,
      };
    },
    enabled: !!exercice,
    staleTime: 30_000,
  });

  const liquidations = queryResult?.data ?? [];
  const total = queryResult?.total ?? 0;

  // Fetch validated engagements for creating liquidations
  const { data: engagementsValides = [] } = useQuery({
    queryKey: ['engagements-valides-pour-liquidation', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_engagements')
        .select(
          `
          id, numero, objet, montant, fournisseur,
          budget_line:budget_lines(
            id, code, label,
            direction:directions(id, label, sigle)
          ),
          marche:marches(
            id, numero,
            prestataire:prestataires(id, raison_sociale)
          )
        `
        )
        .eq('statut', 'valide')
        .eq('exercice', exercice)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EngagementPourLiquidation[];
    },
    enabled: !!exercice,
    staleTime: 60_000,
  });

  // Calculate liquidation availability
  const calculateAvailability = async (
    engagementId: string,
    currentAmount: number,
    excludeLiquidationId?: string
  ): Promise<LiquidationAvailability> => {
    // Get engagement amount
    const { data: engagement, error: engError } = await supabase
      .from('budget_engagements')
      .select('montant')
      .eq('id', engagementId)
      .single();

    if (engError) throw engError;

    const montant_engage = engagement?.montant || 0;

    // Get previous liquidations for this engagement
    let query = supabase
      .from('budget_liquidations')
      .select('id, montant')
      .eq('engagement_id', engagementId)
      .neq('statut', 'annule')
      .neq('statut', 'rejete');

    if (excludeLiquidationId) {
      query = query.neq('id', excludeLiquidationId);
    }

    const { data: prevLiquidations, error: liqError } = await query;
    if (liqError) throw liqError;

    const liquidations_anterieures =
      prevLiquidations?.reduce((sum, l) => sum + (l.montant || 0), 0) || 0;
    const cumul = liquidations_anterieures + currentAmount;
    const restant_a_liquider = montant_engage - cumul;

    return {
      montant_engage,
      liquidations_anterieures,
      nb_liquidations_anterieures: prevLiquidations?.length || 0,
      liquidation_actuelle: currentAmount,
      cumul,
      restant_a_liquider,
      is_valid: restant_a_liquider >= 0,
    };
  };

  // Create liquidation
  const createMutation = useMutation({
    mutationFn: async (data: {
      engagement_id: string;
      montant: number;
      montant_ht?: number;
      tva_taux?: number;
      tva_montant?: number;
      airsi_taux?: number;
      airsi_montant?: number;
      retenue_source_taux?: number;
      retenue_source_montant?: number;
      tva_applicable?: boolean;
      retenue_bic_taux?: number;
      retenue_bic_montant?: number;
      retenue_bnc_taux?: number;
      retenue_bnc_montant?: number;
      penalites_retard?: number;
      penalites_montant?: number;
      penalites_nb_jours?: number;
      penalites_taux_journalier?: number;
      total_retenues?: number;
      net_a_payer?: number;
      reference_facture?: string;
      observation?: string;
      service_fait_date: string;
      regime_fiscal?: string;
      reglement_urgent?: boolean;
      urgence_motif?: string;
      attachments: {
        document_type: string;
        file_name: string;
        file_path: string;
        file_size?: number;
        file_type?: string;
      }[];
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Generate atomic sequence number
      const { data: seqData, error: seqError } = await supabase.rpc('get_next_sequence', {
        p_doc_type: 'LIQ',
        p_exercice: exercice || new Date().getFullYear(),
        p_direction_code: null,
        p_scope: 'global',
      });

      if (seqError) throw seqError;
      if (!seqData || seqData.length === 0) throw new Error('Échec génération numéro');

      const numero = seqData[0].full_code;

      // Check for required documents
      const requiredDocs = DOCUMENTS_REQUIS.filter((d) => d.obligatoire).map((d) => d.code);
      const providedDocs = data.attachments.map((a) => a.document_type);
      const missingDocs = requiredDocs.filter((d) => !providedDocs.includes(d));

      if (missingDocs.length > 0) {
        const missingLabels = DOCUMENTS_REQUIS.filter((d) => missingDocs.includes(d.code))
          .map((d) => d.label)
          .join(', ');
        throw new Error(`Documents obligatoires manquants: ${missingLabels}`);
      }

      // Vérification serveur: SUM(liquidations) + montant <= engagement.montant
      const serverAvail = await calculateAvailability(data.engagement_id, data.montant);
      if (!serverAvail.is_valid) {
        throw new Error(
          `Le montant de liquidation dépasse le restant à liquider de l'engagement. ` +
            `Engagé: ${serverAvail.montant_engage}, Déjà liquidé: ${serverAvail.liquidations_anterieures}, ` +
            `Cette liquidation: ${data.montant}`
        );
      }

      const { data: liquidation, error } = await supabase
        .from('budget_liquidations')
        .insert({
          numero,
          engagement_id: data.engagement_id,
          montant: data.montant,
          montant_ht: data.montant_ht || null,
          tva_taux: data.tva_taux || null,
          tva_montant: data.tva_montant || null,
          airsi_taux: data.airsi_taux || null,
          airsi_montant: data.airsi_montant || null,
          retenue_source_taux: data.retenue_source_taux || null,
          retenue_source_montant: data.retenue_source_montant || null,
          tva_applicable: data.tva_applicable ?? true,
          retenue_bic_taux: data.retenue_bic_taux || null,
          retenue_bic_montant: data.retenue_bic_montant || null,
          retenue_bnc_taux: data.retenue_bnc_taux || null,
          retenue_bnc_montant: data.retenue_bnc_montant || null,
          penalites_retard: data.penalites_retard || data.penalites_montant || 0,
          penalites_montant: data.penalites_montant || null,
          penalites_nb_jours: data.penalites_nb_jours || null,
          penalites_taux_journalier: data.penalites_taux_journalier || null,
          total_retenues: data.total_retenues || 0,
          net_a_payer: data.net_a_payer || data.montant,
          reference_facture: data.reference_facture || null,
          observation: data.observation || null,
          date_liquidation: data.service_fait_date,
          service_fait: true,
          service_fait_date: data.service_fait_date,
          service_fait_certifie_par: user.id,
          regime_fiscal: data.regime_fiscal || null,
          reglement_urgent: data.reglement_urgent || false,
          reglement_urgent_motif: data.reglement_urgent ? data.urgence_motif : null,
          reglement_urgent_date: data.reglement_urgent ? new Date().toISOString() : null,
          reglement_urgent_par: data.reglement_urgent ? user.id : null,
          exercice,
          statut: 'brouillon',
          workflow_status: 'en_attente',
          current_step: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert attachments
      if (data.attachments.length > 0) {
        for (const att of data.attachments) {
          const { error: attError } = await supabase.from('liquidation_attachments').insert({
            liquidation_id: liquidation.id,
            document_type: att.document_type,
            file_name: att.file_name,
            file_path: att.file_path,
            file_size: att.file_size || null,
            file_type: att.file_type || null,
            uploaded_by: user.id,
          });

          if (attError) throw attError;
        }
      }

      // Create initial validation steps
      for (const step of VALIDATION_STEPS) {
        await supabase.from('liquidation_validations').insert({
          liquidation_id: liquidation.id,
          step_order: step.order,
          role: step.role,
          status: 'en_attente',
        });
      }

      await logAction({
        entityType: 'liquidation',
        entityId: liquidation.id,
        action: 'create',
        newValues: {
          numero: liquidation.numero,
          montant: data.montant,
          reglement_urgent: data.reglement_urgent,
        },
      });

      // Notification DAAF + DMG si règlement urgent
      if (data.reglement_urgent) {
        const { data: urgentTargets } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['DAAF', 'DAF', 'DMG']);

        if (urgentTargets?.length) {
          await supabase.from('notifications').insert(
            urgentTargets.map((u) => ({
              user_id: u.user_id,
              type: 'urgence',
              title: 'Liquidation urgente créée',
              message: `La liquidation ${liquidation.numero} a été créée avec un marquage règlement urgent : ${data.urgence_motif}`,
              entity_type: 'liquidation',
              entity_id: liquidation.id,
            }))
          );
        }
      }

      return liquidation;
    },
    onSuccess: (liquidation) => {
      queryClient.invalidateQueries({ queryKey: ['liquidations'] });
      queryClient.invalidateQueries({ queryKey: ['engagements-valides-pour-liquidation'] });
      queryClient.invalidateQueries({ queryKey: ['urgent-liquidations'] });
      queryClient.invalidateQueries({ queryKey: ['urgent-liquidations-count'] });
      toast.success(`Liquidation ${liquidation.numero} créée`);
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Submit liquidation for validation with before/after audit trail
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      // Capturer l'état AVANT pour l'audit trail
      const { data: liquidationBefore, error: fetchError } = await supabase
        .from('budget_liquidations')
        .select('id, numero, montant, statut, workflow_status, current_step, submitted_at')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Service fait doit être certifié avant soumission
      if (
        liquidationBefore?.statut !== 'certifié_sf' &&
        liquidationBefore?.statut !== 'brouillon'
      ) {
        throw new Error('Le service fait doit être certifié avant la soumission');
      }

      // Check attachments
      const { data: attachments } = await supabase
        .from('liquidation_attachments')
        .select('document_type')
        .eq('liquidation_id', id);

      const requiredDocs = DOCUMENTS_REQUIS.filter((d) => d.obligatoire).map((d) => d.code);
      const providedDocs = (attachments || []).map((a) => a.document_type);
      const missingDocs = requiredDocs.filter((d) => !providedDocs.includes(d));

      if (missingDocs.length > 0) {
        const missingLabels = DOCUMENTS_REQUIS.filter((d) => missingDocs.includes(d.code))
          .map((d) => d.label)
          .join(', ');
        throw new Error(`Documents obligatoires manquants: ${missingLabels}`);
      }

      const newValues = {
        statut: 'soumis',
        workflow_status: 'en_validation',
        current_step: 1,
        submitted_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('budget_liquidations').update(newValues).eq('id', id);

      if (error) throw error;

      // Audit trail avec before/after
      await logAction({
        entityType: 'liquidation',
        entityId: id,
        action: 'submit',
        entityCode: liquidationBefore?.numero,
        oldValues: {
          statut: liquidationBefore?.statut,
          workflow_status: liquidationBefore?.workflow_status,
          current_step: liquidationBefore?.current_step,
          submitted_at: liquidationBefore?.submitted_at,
        },
        newValues: {
          ...newValues,
          documents_count: attachments?.length || 0,
        },
        resume: `Soumission pour validation - ${liquidationBefore?.numero}`,
      });

      // Notification: DAAF reçoit la soumission (1ère étape de validation)
      const { data: daafValidators } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'DAAF');

      if (daafValidators?.length) {
        await supabase.from('notifications').insert(
          daafValidators.map((u) => ({
            user_id: u.user_id,
            type: 'soumission',
            title: 'Liquidation à valider',
            message: `La liquidation ${liquidationBefore?.numero} a été soumise pour validation DAAF`,
            entity_type: 'liquidation',
            entity_id: id,
          }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liquidations'] });
      toast.success('Liquidation soumise pour validation');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Validate liquidation step with before/after audit trail
  const validateMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Capturer l'état AVANT pour l'audit trail
      const { data: liquidationBefore, error: fetchError } = await supabase
        .from('budget_liquidations')
        .select(
          'id, numero, montant, net_a_payer, statut, workflow_status, current_step, validated_at, validated_by, engagement_id'
        )
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const currentStep = liquidationBefore?.current_step || 1;
      const montant = liquidationBefore?.net_a_payer || liquidationBefore?.montant || 0;
      // Skip DG step if DAAF validates and amount is below threshold
      const skipDgStep = currentStep === 1 && !requiresDgValidation(montant);
      const isLastStep = skipDgStep || currentStep >= VALIDATION_STEPS.length;
      const stepInfo = VALIDATION_STEPS.find((s) => s.order === currentStep);

      await supabase
        .from('liquidation_validations')
        .update({
          status: 'valide',
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          comments,
        })
        .eq('liquidation_id', id)
        .eq('step_order', currentStep);

      const newValues = {
        current_step: isLastStep ? currentStep : currentStep + 1,
        statut: isLastStep ? 'validé_dg' : stepInfo?.statut || 'soumis',
        workflow_status: isLastStep ? 'termine' : 'en_validation',
        validated_at: isLastStep ? new Date().toISOString() : null,
        validated_by: isLastStep ? user.id : null,
      };

      const { error } = await supabase.from('budget_liquidations').update(newValues).eq('id', id);

      if (error) throw error;

      // Impact budget : géré UNIQUEMENT par le trigger backend
      // trg_recalc_elop_liquidations → _recalculate_single_budget_line()

      // Audit trail avec before/after
      await logAction({
        entityType: 'liquidation',
        entityId: id,
        action: 'validate',
        entityCode: liquidationBefore?.numero,
        oldValues: {
          statut: liquidationBefore?.statut,
          workflow_status: liquidationBefore?.workflow_status,
          current_step: liquidationBefore?.current_step,
          validated_at: liquidationBefore?.validated_at,
          validated_by: liquidationBefore?.validated_by,
        },
        newValues: {
          ...newValues,
          step_validated: currentStep,
          step_label: stepInfo?.label,
          step_role: stepInfo?.role,
          is_final_validation: isLastStep,
        },
        resume: isLastStep
          ? `Validation finale de la liquidation ${liquidationBefore?.numero}`
          : `Validation étape ${currentStep} (${stepInfo?.label}) - ${liquidationBefore?.numero}`,
      });

      // --- Notifications ---
      const valNotifs: Array<{
        user_id: string;
        type: string;
        title: string;
        message: string;
        entity_type: string;
        entity_id: string;
      }> = [];

      // Fetch liquidation with engagement details for notifications
      const { data: liqFull } = await supabase
        .from('budget_liquidations')
        .select('numero, created_by, engagement_id, montant')
        .eq('id', id)
        .single();

      // Notify creator
      if (liqFull?.created_by) {
        valNotifs.push({
          user_id: liqFull.created_by,
          type: 'validation',
          title: isLastStep ? 'Liquidation validée' : `Visa ${stepInfo?.role} accordé`,
          message: isLastStep
            ? `La liquidation ${liqFull.numero} a été entièrement validée`
            : `Le visa ${stepInfo?.role} de la liquidation ${liqFull.numero} a été accordé`,
          entity_type: 'liquidation',
          entity_id: id,
        });
      }

      // Notify next validator role
      if (!isLastStep) {
        const nextStepInfo = VALIDATION_STEPS.find((s) => s.order === currentStep + 1);
        if (nextStepInfo) {
          const { data: nextUsers } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', nextStepInfo.role);
          if (nextUsers?.length) {
            valNotifs.push(
              ...nextUsers.map((u) => ({
                user_id: u.user_id,
                type: 'validation',
                title: 'Liquidation à valider',
                message: `La liquidation ${liqFull?.numero} est en attente de visa ${nextStepInfo.role}`,
                entity_type: 'liquidation',
                entity_id: id,
              }))
            );
          }
        }
      }

      // DG approval: notify direction agents
      if (isLastStep && liqFull?.engagement_id) {
        const { data: eng } = await supabase
          .from('budget_engagements')
          .select('budget_line_id')
          .eq('id', liqFull.engagement_id)
          .single();

        if (eng?.budget_line_id) {
          const { data: blDir } = await supabase
            .from('budget_lines')
            .select('direction_id')
            .eq('id', eng.budget_line_id)
            .single();

          if (blDir?.direction_id) {
            const { data: dirUsers } = await supabase
              .from('profiles')
              .select('id')
              .eq('direction_id', blDir.direction_id)
              .neq('id', liqFull.created_by || '');

            if (dirUsers?.length) {
              valNotifs.push(
                ...dirUsers.map((u) => ({
                  user_id: u.id,
                  type: 'validation',
                  title: 'Liquidation validée',
                  message: `La liquidation ${liqFull?.numero} de votre direction a été validée`,
                  entity_type: 'liquidation',
                  entity_id: id,
                }))
              );
            }
          }

          // --- Alertes budgétaires ---
          const { data: bl } = await supabase
            .from('budget_lines')
            .select('id, dotation_initiale, dotation_modifiee')
            .eq('id', eng.budget_line_id)
            .single();

          if (bl) {
            const dotation = bl.dotation_modifiee || bl.dotation_initiale || 0;
            if (dotation > 0) {
              // Total engaged on this line
              const { data: engSum } = await supabase
                .from('budget_engagements')
                .select('montant')
                .eq('budget_line_id', eng.budget_line_id)
                .in('statut', ['soumis', 'visa_saf', 'visa_cb', 'visa_daaf', 'valide']);

              const totalEngage = (engSum || []).reduce((s, e) => s + (e.montant || 0), 0);
              const taux = (totalEngage / dotation) * 100;

              const alertNotifs: typeof valNotifs = [];

              if (taux > 80 && taux <= 95) {
                // >80%: alerte orange au CB
                const { data: cbUsers } = await supabase
                  .from('user_roles')
                  .select('user_id')
                  .eq('role', 'CB');
                if (cbUsers?.length) {
                  alertNotifs.push(
                    ...cbUsers.map((u) => ({
                      user_id: u.user_id,
                      type: 'alerte',
                      title: 'Alerte budgétaire - Seuil 80%',
                      message: `La ligne budgétaire ${bl.id} a atteint ${taux.toFixed(1)}% de consommation après validation de la liquidation ${liqFull?.numero}`,
                      entity_type: 'budget_alert',
                      entity_id: bl.id,
                    }))
                  );
                }
              } else if (taux > 95 && taux < 100) {
                // >95%: alerte rouge CB + DAAF
                const { data: critUsers } = await supabase
                  .from('user_roles')
                  .select('user_id')
                  .in('role', ['CB', 'DAAF', 'DAF']);
                if (critUsers?.length) {
                  alertNotifs.push(
                    ...critUsers.map((u) => ({
                      user_id: u.user_id,
                      type: 'alerte',
                      title: 'Alerte budgétaire CRITIQUE - Seuil 95%',
                      message: `La ligne budgétaire ${bl.id} a atteint ${taux.toFixed(1)}% de consommation - CRITIQUE`,
                      entity_type: 'budget_alert',
                      entity_id: bl.id,
                    }))
                  );
                }
              } else if (taux >= 100) {
                // Dépassement: alerte critique DG + DAAF + CB
                const { data: dgUsers } = await supabase
                  .from('user_roles')
                  .select('user_id')
                  .in('role', ['DG', 'DAAF', 'DAF', 'CB', 'ADMIN']);
                if (dgUsers?.length) {
                  alertNotifs.push(
                    ...dgUsers.map((u) => ({
                      user_id: u.user_id,
                      type: 'alerte',
                      title: 'DEPASSEMENT BUDGETAIRE',
                      message: `DEPASSEMENT : La ligne budgétaire ${bl.id} a atteint ${taux.toFixed(1)}% — action immédiate requise`,
                      entity_type: 'budget_alert',
                      entity_id: bl.id,
                    }))
                  );
                }
              }

              if (alertNotifs.length > 0) {
                await supabase.from('notifications').insert(alertNotifs);
              }
            }
          }
        }
      }

      if (valNotifs.length > 0) {
        await supabase.from('notifications').insert(valNotifs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liquidations'] });
      toast.success('Étape validée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Reject liquidation with before/after audit trail
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Capturer l'état AVANT pour l'audit trail
      const { data: liquidationBefore, error: fetchError } = await supabase
        .from('budget_liquidations')
        .select(
          'id, numero, montant, statut, workflow_status, current_step, rejection_reason, rejected_by, rejected_at, created_by'
        )
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const currentStep = liquidationBefore?.current_step || 1;

      await supabase
        .from('liquidation_validations')
        .update({
          status: 'rejete',
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          comments: reason,
        })
        .eq('liquidation_id', id)
        .eq('step_order', currentStep);

      const newValues = {
        statut: 'rejete',
        workflow_status: 'rejete',
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        rejection_reason: reason,
      };

      const { error } = await supabase.from('budget_liquidations').update(newValues).eq('id', id);

      if (error) throw error;

      // Audit trail avec before/after
      await logAction({
        entityType: 'liquidation',
        entityId: id,
        action: 'reject',
        entityCode: liquidationBefore?.numero,
        oldValues: {
          statut: liquidationBefore?.statut,
          workflow_status: liquidationBefore?.workflow_status,
          current_step: liquidationBefore?.current_step,
          rejection_reason: liquidationBefore?.rejection_reason,
          rejected_by: liquidationBefore?.rejected_by,
          rejected_at: liquidationBefore?.rejected_at,
        },
        newValues: {
          ...newValues,
          step_rejected: currentStep,
        },
        justification: reason,
      });

      // --- Notifications rejet ---
      const stepInfo = VALIDATION_STEPS.find((s) => s.order === currentStep);
      const rejectNotifs: Array<{
        user_id: string;
        type: string;
        title: string;
        message: string;
        entity_type: string;
        entity_id: string;
      }> = [];

      // Notify creator
      if (liquidationBefore?.created_by) {
        rejectNotifs.push({
          user_id: liquidationBefore.created_by,
          type: 'rejet',
          title: 'Liquidation rejetée',
          message: `La liquidation ${liquidationBefore.numero} a été rejetée à l'étape ${stepInfo?.role || ''} : ${reason}`,
          entity_type: 'liquidation',
          entity_id: id,
        });
      }

      // Notify direction agents
      const { data: liqEng } = await supabase
        .from('budget_liquidations')
        .select('engagement_id, created_by')
        .eq('id', id)
        .single();

      if (liqEng?.engagement_id) {
        const { data: eng } = await supabase
          .from('budget_engagements')
          .select('budget_line_id')
          .eq('id', liqEng.engagement_id)
          .single();

        if (eng?.budget_line_id) {
          const { data: blDir } = await supabase
            .from('budget_lines')
            .select('direction_id')
            .eq('id', eng.budget_line_id)
            .single();

          if (blDir?.direction_id) {
            const { data: dirUsers } = await supabase
              .from('profiles')
              .select('id')
              .eq('direction_id', blDir.direction_id)
              .neq('id', liqEng.created_by || '');

            if (dirUsers?.length) {
              rejectNotifs.push(
                ...dirUsers.map((u) => ({
                  user_id: u.id,
                  type: 'rejet',
                  title: 'Liquidation rejetée',
                  message: `La liquidation ${liquidationBefore?.numero} de votre direction a été rejetée : ${reason}`,
                  entity_type: 'liquidation',
                  entity_id: id,
                }))
              );
            }
          }
        }
      }

      if (rejectNotifs.length > 0) {
        await supabase.from('notifications').insert(rejectNotifs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liquidations'] });
      toast.success('Liquidation rejetée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Defer liquidation with before/after audit trail
  const deferMutation = useMutation({
    mutationFn: async ({
      id,
      motif,
      dateReprise,
    }: {
      id: string;
      motif: string;
      dateReprise?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Capturer l'état AVANT pour l'audit trail
      const { data: liquidationBefore, error: fetchError } = await supabase
        .from('budget_liquidations')
        .select(
          'id, numero, montant, statut, workflow_status, current_step, motif_differe, date_differe, deadline_correction, differe_by'
        )
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newValues = {
        statut: 'differe',
        workflow_status: 'differe',
        motif_differe: motif,
        date_differe: new Date().toISOString(),
        deadline_correction: dateReprise || null,
        differe_by: user.id,
      };

      const { error } = await supabase.from('budget_liquidations').update(newValues).eq('id', id);

      if (error) throw error;

      // Audit trail avec before/after
      await logAction({
        entityType: 'liquidation',
        entityId: id,
        action: 'defer',
        entityCode: liquidationBefore?.numero,
        oldValues: {
          statut: liquidationBefore?.statut,
          workflow_status: liquidationBefore?.workflow_status,
          current_step: liquidationBefore?.current_step,
          motif_differe: liquidationBefore?.motif_differe,
          date_differe: liquidationBefore?.date_differe,
          deadline_correction: liquidationBefore?.deadline_correction,
        },
        newValues: {
          ...newValues,
          step_deferred: liquidationBefore?.current_step,
        },
        justification: motif,
        resume: `Report de la liquidation ${liquidationBefore?.numero}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liquidations'] });
      toast.success('Liquidation différée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Resume deferred liquidation with before/after audit trail
  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Capturer l'état AVANT pour l'audit trail
      const { data: liquidationBefore, error: fetchError } = await supabase
        .from('budget_liquidations')
        .select(
          'id, numero, montant, statut, workflow_status, current_step, motif_differe, date_differe, deadline_correction, differe_by'
        )
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newValues = {
        statut: 'soumis',
        workflow_status: 'en_validation',
        date_differe: null,
        motif_differe: null,
        deadline_correction: null,
        differe_by: null,
      };

      const { error } = await supabase.from('budget_liquidations').update(newValues).eq('id', id);

      if (error) throw error;

      // Audit trail avec before/after
      await logAction({
        entityType: 'liquidation',
        entityId: id,
        action: 'resume',
        entityCode: liquidationBefore?.numero,
        oldValues: {
          statut: liquidationBefore?.statut,
          workflow_status: liquidationBefore?.workflow_status,
          motif_differe: liquidationBefore?.motif_differe,
          date_differe: liquidationBefore?.date_differe,
          deadline_correction: liquidationBefore?.deadline_correction,
          differe_by: liquidationBefore?.differe_by,
        },
        newValues: {
          ...newValues,
          resumed_from_step: liquidationBefore?.current_step,
        },
        resume: `Reprise de la liquidation ${liquidationBefore?.numero} après report`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liquidations'] });
      toast.success('Liquidation reprise');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Get validation steps for a liquidation
  const getValidationSteps = useCallback(async (liquidationId: string) => {
    const { data, error: fetchError } = await supabase
      .from('liquidation_validations')
      .select(
        `
        *,
        validator:profiles!liquidation_validations_validated_by_fkey(full_name)
      `
      )
      .eq('liquidation_id', liquidationId)
      .order('step_order');

    if (fetchError) throw fetchError;
    return data || [];
  }, []);

  /** Charge TOUTES les liquidations (sans pagination) pour les exports */
  const fetchAllForExport = useCallback(async (): Promise<Liquidation[]> => {
    const { data, error: fetchErr } = await supabase
      .from('budget_liquidations')
      .select(SELECT_FULL)
      .eq('exercice', exercice)
      .order('created_at', { ascending: false });

    if (fetchErr) throw fetchErr;

    const ids = (data || []).map((l) => l.id);
    const { data: atts } =
      ids.length > 0
        ? await supabase.from('liquidation_attachments').select('*').in('liquidation_id', ids)
        : { data: [] };

    const attMap = new Map<string, LiquidationAttachment[]>();
    (atts || []).forEach((a) => {
      const list = attMap.get(a.liquidation_id) || [];
      list.push(a);
      attMap.set(a.liquidation_id, list);
    });

    return (data || []).map((liq) => ({
      ...liq,
      attachments: attMap.get(liq.id) || [],
    })) as Liquidation[];
  }, [exercice, SELECT_FULL]);

  return {
    liquidations,
    total,
    isLoading,
    error,
    engagementsValides,
    calculateAvailability,
    getValidationSteps,
    fetchAllForExport,
    createLiquidation: createMutation.mutate,
    submitLiquidation: submitMutation.mutate,
    validateLiquidation: validateMutation.mutate,
    rejectLiquidation: rejectMutation.mutate,
    deferLiquidation: deferMutation.mutate,
    resumeLiquidation: resumeMutation.mutate,
    isCreating: createMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isDeferring: deferMutation.isPending,
  };
}

// ══════════════════════════════════════════════════════════════
// Hooks légers pour compteurs et tranches (séparés du query principal)
// ══════════════════════════════════════════════════════════════

/** Compteurs par statut — requête légère pour KPIs et badges onglets */
export function useLiquidationCounts() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['liquidation-counts', exercice],
    queryFn: async (): Promise<LiquidationCounts> => {
      const { data, error } = await supabase
        .from('budget_liquidations')
        .select('statut, reglement_urgent, service_fait, montant')
        .eq('exercice', exercice);

      if (error) throw error;

      const items = data || [];
      return {
        total: items.length,
        brouillon: items.filter((i) => i.statut === 'brouillon').length,
        certifie_sf: items.filter((i) => i.statut === 'certifié_sf').length,
        soumis: items.filter((i) => i.statut === 'soumis').length,
        valide_daaf: items.filter((i) => i.statut === 'validé_daaf').length,
        valide_dg: items.filter((i) => i.statut === 'validé_dg').length,
        rejete: items.filter((i) => i.statut === 'rejete').length,
        differe: items.filter((i) => i.statut === 'differe').length,
        annule: items.filter((i) => i.statut === 'annule').length,
        urgent: items.filter(
          (i) =>
            i.reglement_urgent && ['soumis', 'validé_daaf', 'validé_dg'].includes(i.statut || '')
        ).length,
        service_fait: items.filter((i) => i.service_fait).length,
        total_montant: items.reduce((s, i) => s + (i.montant || 0), 0),
        a_valider: items.filter((i) => i.statut === 'soumis' || i.statut === 'validé_daaf').length,
      };
    },
    enabled: !!exercice,
    staleTime: 30_000,
  });
}

/** Données légères (id, engagement_id, statut, montant, created_at) pour tranches et progressions */
export function useLiquidationLight() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['liquidation-light', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_liquidations')
        .select('id, engagement_id, statut, created_at, montant')
        .eq('exercice', exercice)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        engagement_id: string;
        statut: string | null;
        created_at: string;
        montant: number;
      }>;
    },
    enabled: !!exercice,
    staleTime: 60_000,
  });
}
