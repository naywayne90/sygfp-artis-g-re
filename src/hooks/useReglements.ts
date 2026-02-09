import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExercice } from '@/contexts/ExerciceContext';
import { useAuditLog } from '@/hooks/useAuditLog';

export const MODES_PAIEMENT = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'especes', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

// Documents requis pour le règlement
export const DOCUMENTS_REGLEMENT = [
  { type: 'preuve_paiement', label: 'Preuve de paiement', obligatoire: true },
  { type: 'bordereau_virement', label: 'Bordereau de virement', obligatoire: false },
  { type: 'copie_cheque', label: 'Copie du chèque', obligatoire: false },
  { type: 'avis_credit', label: 'Avis de crédit bancaire', obligatoire: false },
];

export interface CompteBancaire {
  id: string;
  code: string;
  libelle: string;
  banque: string | null;
  numero_compte: string | null;
  iban: string | null;
  solde_actuel: number | null;
  est_actif: boolean | null;
}

// Interface pour la disponibilité de règlement (payé <= ordonnancé)
export interface ReglementAvailability {
  montantOrdonnance: number;
  reglementsAnterieurs: number;
  restantAPayer: number;
  is_valid: boolean; // true si montant proposé <= restant à payer
}

// Types de renvoi pour le rejet
export const RENVOI_TARGETS = [
  {
    value: 'engagement',
    label: "Renvoi à l'Engagement",
    description: "Renvoyer pour correction de l'engagement",
  },
  {
    value: 'creation',
    label: 'Renvoi à la Création',
    description: 'Renvoyer au début du processus',
  },
] as const;

export type RenvoiTarget = (typeof RENVOI_TARGETS)[number]['value'];

export interface ReglementFormData {
  ordonnancement_id: string;
  date_paiement: string;
  mode_paiement: string;
  reference_paiement?: string;
  compte_id?: string;
  compte_bancaire_arti?: string;
  banque_arti?: string;
  montant: number;
  observation?: string;
}

// --- Types for joined query results ---

/** Budget line nested in engagement */
export interface BudgetLineRef {
  id: string;
  code: string;
  label: string;
}

/** Engagement nested in liquidation */
export interface EngagementRef {
  id: string;
  numero: string;
  objet: string;
  fournisseur: string;
  montant?: number;
  budget_line: BudgetLineRef | null;
  expression_besoin?: {
    dossier_id: string | null;
  } | null;
}

/** Liquidation nested in ordonnancement */
export interface LiquidationRef {
  id: string;
  numero: string;
  montant?: number;
  engagement_id?: string;
  engagement: EngagementRef | null;
}

/** Ordonnancement as returned by the validated list query */
export interface OrdonnancementValide {
  id: string;
  numero: string | null;
  montant: number;
  montant_paye: number | null;
  is_locked: boolean | null;
  beneficiaire: string;
  banque: string | null;
  rib: string | null;
  mode_paiement: string | null;
  objet: string;
  liquidation: LiquidationRef | null;
}

/** Profile info attached to a reglement */
export interface ProfileRef {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
}

/** Ordonnancement nested in a reglement (includes full chain) */
export interface OrdonnancementInReglement {
  id: string;
  numero: string | null;
  montant: number;
  beneficiaire: string;
  banque: string | null;
  rib: string | null;
  mode_paiement: string | null;
  objet: string;
  montant_paye: number | null;
  is_locked: boolean | null;
  liquidation: LiquidationRef | null;
}

/** Full reglement record with relations */
export interface ReglementWithRelations {
  id: string;
  numero: string;
  ordonnancement_id: string;
  date_paiement: string;
  mode_paiement: string;
  reference_paiement: string | null;
  compte_bancaire_arti: string | null;
  compte_id: string | null;
  banque_arti: string | null;
  montant: number;
  observation: string | null;
  statut: string | null;
  exercice: number | null;
  created_at: string | null;
  created_by: string | null;
  dossier_id: string | null;
  // Rejection fields - not in DB schema, parsed from observation for display
  motif_rejet?: string | null;
  renvoi_target?: string | null;
  date_rejet?: string | null;
  ordonnancement: OrdonnancementInReglement | null;
  created_by_profile: ProfileRef | null;
}

// Fallback comptes bancaires (utilisés si la table est vide)
export const COMPTES_BANCAIRES_ARTI = [
  { value: 'SGBCI-001', label: 'SGBCI - Compte Principal', banque: 'SGBCI' },
  { value: 'BICICI-001', label: 'BICICI - Compte Courant', banque: 'BICICI' },
  { value: 'ECOBANK-001', label: 'ECOBANK - Compte Opérations', banque: 'ECOBANK' },
  { value: 'BOA-001', label: 'BOA - Compte Trésorerie', banque: 'BOA' },
];

export function useReglements() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();
  const { logAction } = useAuditLog();

  // Récupérer les comptes bancaires actifs
  const { data: comptesBancaires = [] } = useQuery({
    queryKey: ['comptes-bancaires'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comptes_bancaires')
        .select('*')
        .eq('est_actif', true)
        .order('libelle', { ascending: true });

      if (error) throw error;
      return data as CompteBancaire[];
    },
  });

  // Récupérer les règlements
  const {
    data: reglements = [],
    isLoading,
    error,
  } = useQuery<ReglementWithRelations[]>({
    queryKey: ['reglements', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reglements')
        .select(
          `
          *,
          ordonnancement:ordonnancements(
            id,
            numero,
            montant,
            beneficiaire,
            banque,
            rib,
            mode_paiement,
            objet,
            montant_paye,
            is_locked,
            liquidation:budget_liquidations(
              id,
              numero,
              montant,
              engagement:budget_engagements(
                id,
                numero,
                objet,
                fournisseur,
                montant,
                budget_line:budget_lines(
                  id,
                  code,
                  label
                )
              )
            )
          ),
          created_by_profile:profiles!reglements_created_by_fkey(
            id,
            first_name,
            last_name,
            full_name
          )
        `
        )
        .eq('exercice', exercice)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Parse rejection details from observation field for rejected reglements
      return ((data ?? []) as unknown as ReglementWithRelations[]).map((reg) => {
        if (reg.statut === 'rejete' && reg.observation?.startsWith('[REJET ')) {
          const match = reg.observation.match(/^\[REJET (.+?)\] Motif: (.+?) \| Renvoi: (.+)$/);
          if (match) {
            return {
              ...reg,
              date_rejet: match[1],
              motif_rejet: match[2],
              renvoi_target: match[3],
            };
          }
        }
        return reg;
      });
    },
    enabled: !!exercice,
  });

  // Récupérer les ordonnancements validés disponibles pour règlement
  const { data: ordonnancementsValides = [] } = useQuery<OrdonnancementValide[]>({
    queryKey: ['ordonnancements-valides-pour-reglement', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordonnancements')
        .select(
          `
          id,
          numero,
          montant,
          montant_paye,
          is_locked,
          beneficiaire,
          banque,
          rib,
          mode_paiement,
          objet,
          liquidation:budget_liquidations(
            id,
            numero,
            engagement:budget_engagements(
              id,
              numero,
              objet,
              fournisseur,
              budget_line:budget_lines(
                id,
                code,
                label
              )
            )
          )
        `
        )
        .eq('statut', 'valide')
        .eq('exercice', exercice)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Filtrer pour ne garder que ceux qui ont un restant à payer > 0
      return ((data ?? []) as unknown as OrdonnancementValide[]).filter((ord) => {
        const restant = (ord.montant || 0) - (ord.montant_paye || 0);
        return restant > 0;
      });
    },
    enabled: !!exercice,
  });

  // Calculer le restant à payer pour un ordonnancement avec validation
  const calculateReglementAvailability = async (
    ordonnancementId: string,
    currentReglementId?: string,
    proposedAmount?: number
  ): Promise<ReglementAvailability> => {
    // Récupérer l'ordonnancement
    const { data: ordonnancement, error: ordError } = await supabase
      .from('ordonnancements')
      .select('montant, montant_paye')
      .eq('id', ordonnancementId)
      .single();

    if (ordError) throw ordError;

    // Récupérer les règlements existants pour cet ordonnancement (sauf le courant si édition)
    let query = supabase
      .from('reglements')
      .select('id, montant')
      .eq('ordonnancement_id', ordonnancementId);

    if (currentReglementId) {
      query = query.not('id', 'eq', currentReglementId);
    }

    const { data: existingReglements, error: regError } = await query;
    if (regError) throw regError;

    const totalPaye = (existingReglements || []).reduce((sum, reg) => sum + (reg.montant || 0), 0);

    const restantAPayer = (ordonnancement?.montant || 0) - totalPaye;

    return {
      montantOrdonnance: ordonnancement?.montant || 0,
      reglementsAnterieurs: totalPaye,
      restantAPayer,
      is_valid: proposedAmount !== undefined ? proposedAmount <= restantAPayer : true,
    };
  };

  // Créer un règlement
  const createReglement = useMutation<{ id: string; numero: string }, Error, ReglementFormData>({
    mutationFn: async (data: ReglementFormData) => {
      // Vérifier la disponibilité
      const availability = await calculateReglementAvailability(data.ordonnancement_id);
      if (data.montant > availability.restantAPayer) {
        throw new Error(
          `Montant trop élevé. Restant à payer: ${availability.restantAPayer.toLocaleString('fr-FR')} FCFA`
        );
      }

      // Créer le règlement
      const { data: reglement, error } = await supabase
        .from('reglements')
        .insert({
          numero: '', // Auto-généré par trigger
          ordonnancement_id: data.ordonnancement_id,
          date_paiement: data.date_paiement,
          mode_paiement: data.mode_paiement,
          reference_paiement: data.reference_paiement || null,
          compte_bancaire_arti: data.compte_bancaire_arti,
          banque_arti: data.banque_arti,
          montant: data.montant,
          observation: data.observation || null,
          statut: 'enregistre',
          exercice: exercice,
        })
        .select()
        .single();

      if (error || !reglement) throw error ?? new Error('Erreur lors de la création du règlement');

      // Mettre à jour le montant_paye de l'ordonnancement
      const newMontantPaye = availability.reglementsAnterieurs + data.montant;
      const { data: ordData } = await supabase
        .from('ordonnancements')
        .select('montant')
        .eq('id', data.ordonnancement_id)
        .single();

      const isFullyPaid = newMontantPaye >= (ordData?.montant || 0);

      await supabase
        .from('ordonnancements')
        .update({
          montant_paye: newMontantPaye,
          is_locked: true, // Verrouiller dès le premier paiement partiel
        })
        .eq('id', data.ordonnancement_id);

      // Si complètement payé, marquer le dossier comme soldé (CLOTURE)
      let dossierId: string | undefined;
      if (isFullyPaid) {
        // Récupérer l'ordonnancement avec sa chaîne
        const { data: ordChainData } = await supabase
          .from('ordonnancements')
          .select(
            `
            liquidation:budget_liquidations(
              engagement:budget_engagements(
                expression_besoin:expressions_besoin(
                  dossier_id
                )
              )
            )
          `
          )
          .eq('id', data.ordonnancement_id)
          .single();

        interface OrdChainResult {
          liquidation: {
            engagement: {
              expression_besoin: { dossier_id: string | null } | null;
            } | null;
          } | null;
        }
        const chainResult = ordChainData as unknown as OrdChainResult | null;
        dossierId =
          chainResult?.liquidation?.engagement?.expression_besoin?.dossier_id ?? undefined;

        if (dossierId) {
          await supabase
            .from('dossiers')
            .update({
              statut_global: 'solde',
              statut_paiement: 'solde',
              date_cloture: new Date().toISOString(),
            })
            .eq('id', dossierId);
        }
      }

      // Audit log for reglement creation
      await logAction({
        entityType: 'reglement',
        entityId: reglement.id,
        action: 'CREATE',
        newValues: {
          numero: reglement.numero,
          montant: data.montant,
          mode_paiement: data.mode_paiement,
          reference_paiement: data.reference_paiement,
          ordonnancement_id: data.ordonnancement_id,
          is_fully_paid: isFullyPaid,
        },
      });

      // If dossier was closed, log it
      if (isFullyPaid && dossierId) {
        await logAction({
          entityType: 'dossier',
          entityId: dossierId,
          action: 'CLOSE',
          newValues: {
            statut_global: 'solde',
            reason: 'Règlement complet effectué',
            reglement_id: reglement.id,
          },
        });
      }

      return reglement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reglements'] });
      queryClient.invalidateQueries({ queryKey: ['ordonnancements'] });
      queryClient.invalidateQueries({ queryKey: ['ordonnancements-valides-pour-reglement'] });
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      toast.success('Règlement enregistré avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    },
  });

  // Supprimer un règlement (annuler)
  const deleteReglement = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      // Récupérer le règlement pour mettre à jour l'ordonnancement
      const { data: reglement, error: fetchError } = await supabase
        .from('reglements')
        .select('ordonnancement_id, montant, numero')
        .eq('id', id)
        .single();

      if (fetchError || !reglement) throw fetchError ?? new Error('Règlement introuvable');

      // Supprimer le règlement
      const { error } = await supabase.from('reglements').delete().eq('id', id);

      if (error) throw error;

      // Recalculer le montant_paye de l'ordonnancement
      const { data: remainingReglements } = await supabase
        .from('reglements')
        .select('montant')
        .eq('ordonnancement_id', reglement.ordonnancement_id);

      const newMontantPaye = (remainingReglements || []).reduce(
        (sum, reg) => sum + (reg.montant || 0),
        0
      );

      await supabase
        .from('ordonnancements')
        .update({
          montant_paye: newMontantPaye,
          is_locked: newMontantPaye > 0,
        })
        .eq('id', reglement.ordonnancement_id);

      // Audit log
      await logAction({
        entityType: 'reglement',
        entityId: id,
        action: 'DELETE',
        oldValues: {
          numero: reglement.numero,
          montant: reglement.montant,
          ordonnancement_id: reglement.ordonnancement_id,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reglements'] });
      queryClient.invalidateQueries({ queryKey: ['ordonnancements'] });
      queryClient.invalidateQueries({ queryKey: ['ordonnancements-valides-pour-reglement'] });
      toast.success('Règlement annulé');
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'annulation");
    },
  });

  // Récupérer les pièces jointes d'un règlement
  const getAttachments = async (reglementId: string) => {
    const { data, error } = await supabase
      .from('reglement_attachments')
      .select('*')
      .eq('reglement_id', reglementId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  // Ajouter une pièce jointe
  const addAttachment = useMutation({
    mutationFn: async ({
      reglementId,
      file,
      documentType,
    }: {
      reglementId: string;
      file: File;
      documentType: string;
    }) => {
      // Upload du fichier
      const filePath = `reglements/${reglementId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Enregistrer dans la base
      const { error } = await supabase.from('reglement_attachments').insert({
        reglement_id: reglementId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reglements'] });
      toast.success('Pièce jointe ajoutée');
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'upload");
    },
  });

  // Rejeter un règlement avec renvoi vers une étape antérieure
  interface RejectReglementParams {
    reglementId: string;
    motif: string;
    renvoiTarget: RenvoiTarget;
  }
  const rejectReglement = useMutation<
    { reglement: Record<string, unknown>; renvoiTarget: RenvoiTarget },
    Error,
    RejectReglementParams
  >({
    mutationFn: async ({ reglementId, motif, renvoiTarget }: RejectReglementParams) => {
      if (!motif.trim()) {
        throw new Error('Le motif de rejet est obligatoire');
      }

      // Récupérer le règlement avec sa chaîne
      interface RejectChainResult {
        id: string;
        numero: string;
        montant: number;
        ordonnancement_id: string;
        ordonnancement: {
          id: string;
          numero: string;
          liquidation_id: string;
          liquidation: {
            id: string;
            engagement_id: string;
            engagement: {
              id: string;
              numero: string;
              expression_besoin_id: string | null;
              expression_besoin: {
                dossier_id: string | null;
              } | null;
            } | null;
          } | null;
        } | null;
      }
      const { data: reglementRaw, error: fetchError } = await supabase
        .from('reglements')
        .select(
          `
          id,
          numero,
          montant,
          ordonnancement_id,
          ordonnancement:ordonnancements(
            id,
            numero,
            liquidation_id,
            liquidation:budget_liquidations(
              id,
              engagement_id,
              engagement:budget_engagements(
                id,
                numero,
                expression_besoin_id,
                expression_besoin:expressions_besoin(
                  dossier_id
                )
              )
            )
          )
        `
        )
        .eq('id', reglementId)
        .single();

      if (fetchError) throw fetchError;
      const reglement = reglementRaw as unknown as RejectChainResult;

      const dossierId =
        reglement?.ordonnancement?.liquidation?.engagement?.expression_besoin?.dossier_id;
      const engagementId = reglement?.ordonnancement?.liquidation?.engagement?.id;

      // Mettre à jour le statut du règlement
      // Store rejection details in observation since motif_rejet/renvoi_target/date_rejet columns don't exist
      const rejectObservation = `[REJET ${new Date().toISOString()}] Motif: ${motif} | Renvoi: ${renvoiTarget}`;
      const { error: updateError } = await supabase
        .from('reglements')
        .update({
          statut: 'rejete',
          observation: rejectObservation,
        })
        .eq('id', reglementId);

      if (updateError) throw updateError;

      // Recalculer le montant_paye de l'ordonnancement (retirer ce règlement)
      const { data: remainingReglements } = await supabase
        .from('reglements')
        .select('montant')
        .eq('ordonnancement_id', reglement.ordonnancement_id)
        .neq('statut', 'rejete');

      const newMontantPaye = (remainingReglements || []).reduce(
        (sum, reg) => sum + (reg.montant || 0),
        0
      );

      await supabase
        .from('ordonnancements')
        .update({
          montant_paye: newMontantPaye,
        })
        .eq('id', reglement.ordonnancement_id);

      // Selon le renvoi_target, déverrouiller les étapes concernées
      if (renvoiTarget === 'engagement' && engagementId) {
        // Déverrouiller engagement et les étapes suivantes
        await supabase
          .from('budget_engagements')
          .update({ is_locked: false })
          .eq('id', engagementId);

        // Mettre à jour le dossier
        if (dossierId) {
          await supabase
            .from('dossiers')
            .update({
              statut_global: 'en_correction',
              etape_courante: 'engagement',
            })
            .eq('id', dossierId);
        }
      } else if (renvoiTarget === 'creation' && dossierId) {
        // Renvoi à la création - déverrouiller toute la chaîne
        await supabase
          .from('dossiers')
          .update({
            statut_global: 'en_correction',
            etape_courante: 'creation',
          })
          .eq('id', dossierId);
      }

      // Audit log
      await logAction({
        entityType: 'reglement',
        entityId: reglementId,
        action: 'REJECT',
        oldValues: {
          statut: 'enregistre',
        },
        newValues: {
          statut: 'rejete',
          motif_rejet: motif,
          renvoi_target: renvoiTarget,
          engagement_id: engagementId,
          dossier_id: dossierId,
        },
      });

      // Log aussi l'action de renvoi sur le dossier
      if (dossierId) {
        await logAction({
          entityType: 'dossier',
          entityId: dossierId,
          action: 'RENVOI',
          newValues: {
            from_step: 'reglement',
            to_step: renvoiTarget,
            motif,
            reglement_id: reglementId,
          },
        });
      }

      return { reglement, renvoiTarget };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reglements'] });
      queryClient.invalidateQueries({ queryKey: ['ordonnancements'] });
      queryClient.invalidateQueries({ queryKey: ['ordonnancements-valides-pour-reglement'] });
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });

      const targetLabel =
        RENVOI_TARGETS.find((t) => t.value === variables.renvoiTarget)?.label ||
        variables.renvoiTarget;
      toast.success(`Règlement rejeté - ${targetLabel}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors du rejet');
    },
  });

  // Statistiques
  const stats = {
    total: reglements.length,
    totalMontant: reglements.reduce((sum, r) => sum + (r.montant || 0), 0),
    partiels: reglements.filter((r) => {
      const ord = r.ordonnancement;
      return ord && (ord.montant_paye || 0) < (ord.montant || 0);
    }).length,
  };

  // Helper to generate treasury link for a reglement
  const getTreasuryLink = (reglementId: string, compteId?: string) => {
    // Link format: /tresorerie/operations?reglement={id}&compte={compteId}
    const baseUrl = '/tresorerie/operations';
    const params = new URLSearchParams();
    params.set('reglement', reglementId);
    if (compteId) {
      params.set('compte', compteId);
    }
    return `${baseUrl}?${params.toString()}`;
  };

  // Check if dossier is in CLOTURE state (read-only)
  const isDossierClosed = async (dossierId: string) => {
    const { data, error } = await supabase
      .from('dossiers')
      .select('statut_global, date_cloture')
      .eq('id', dossierId)
      .single();

    if (error) return false;
    return data?.statut_global === 'solde';
  };

  return {
    reglements,
    isLoading,
    error,
    ordonnancementsValides,
    comptesBancaires,
    createReglement,
    deleteReglement,
    rejectReglement,
    calculateReglementAvailability,
    getAttachments,
    addAttachment,
    stats,
    getTreasuryLink,
    isDossierClosed,
  };
}
