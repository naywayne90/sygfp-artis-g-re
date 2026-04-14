import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface BudgetTransfer {
  id: string;
  code: string | null;
  exercice: number | null;
  type_transfer: string | null;
  status: string | null;
  amount: number;
  motif: string;
  justification_renforcee: string | null;
  from_budget_line_id: string | null;
  to_budget_line_id: string;
  requested_at: string;
  requested_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  executed_at: string | null;
  executed_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  from_dotation_avant: number | null;
  from_dotation_apres: number | null;
  from_disponible_avant: number | null;
  from_disponible_apres: number | null;
  to_dotation_avant: number | null;
  to_dotation_apres: number | null;
  to_disponible_avant: number | null;
  to_disponible_apres: number | null;
  decision_file_url: string | null;
  decision_file_name: string | null;
  from_line?: { code: string; label: string; dotation_initiale: number } | null;
  to_line?: { code: string; label: string; dotation_initiale: number } | null;
  requested_by_profile?: { full_name: string } | null;
  approved_by_profile?: { full_name: string } | null;
  executed_by_profile?: { full_name: string } | null;
}

export interface BudgetTransferFilters {
  status?: string;
  type_transfer?: string;
  direction_id?: string;
}

export interface CreateTransferData {
  type_transfer: 'virement' | 'ajustement';
  from_budget_line_id?: string | null;
  to_budget_line_id: string;
  amount: number;
  motif: string;
  justification_renforcee?: string;
}

export interface TransferStats {
  pending: number;
  validated: number;
  executed: number;
  rejected: number;
  cancelled: number;
  executedThisMonth: number;
  totalExecutedAmount: number;
  totalPendingAmount: number;
  totalAmount: number;
  virementsCount: number;
  ajustementsCount: number;
}

export interface BudgetHistory {
  id: string;
  budget_line_id: string;
  event_type: string;
  delta: number;
  dotation_avant: number | null;
  dotation_apres: number | null;
  disponible_avant: number | null;
  disponible_apres: number | null;
  ref_code: string | null;
  ref_id: string | null;
  commentaire: string | null;
  created_by: string | null;
  created_at: string;
  created_by_profile?: { full_name: string } | null;
}

// ============================================================================
// Pure logic (testable — exportée via __testing__ en bas de fichier)
// ============================================================================

/**
 * Calcule les statistiques agrégées d'une liste de transferts.
 * Pure : ne dépend que des données passées en argument.
 */
/**
 * Workflow 2 niveaux CB → DG :
 *   en_attente (créé) → approuve (CB valide) → execute (DG exécute)
 *                                           ↘ rejete (CB ou DG refuse)
 *
 * `pending` (compteur CB) = en_attente
 * `validated` (compteur DG) = approuve (CB a signé, attend DG)
 */
function computeStats(transfers: BudgetTransfer[] | undefined | null): TransferStats {
  const list = transfers ?? [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return {
    pending: list.filter((t) => t.status === 'en_attente').length,
    validated: list.filter((t) => t.status === 'approuve').length,
    executed: list.filter((t) => t.status === 'execute').length,
    rejected: list.filter((t) => t.status === 'rejete').length,
    cancelled: 0, // workflow simplifié : plus d'état "annule"
    executedThisMonth: list.filter((t) => {
      if (t.status !== 'execute' || !t.executed_at) return false;
      const execDate = new Date(t.executed_at);
      return execDate.getMonth() === currentMonth && execDate.getFullYear() === currentYear;
    }).length,
    totalExecutedAmount: list
      .filter((t) => t.status === 'execute')
      .reduce((sum, t) => sum + t.amount, 0),
    totalPendingAmount: list
      .filter((t) => t.status === 'en_attente' || t.status === 'approuve')
      .reduce((sum, t) => sum + t.amount, 0),
    totalAmount: list.reduce((sum, t) => sum + t.amount, 0),
    virementsCount: list.filter((t) => t.type_transfer === 'virement').length,
    ajustementsCount: list.filter((t) => t.type_transfer === 'ajustement').length,
  };
}

/**
 * Calcule le solde disponible d'une ligne budgétaire compte tenu des virements.
 * Formule : (dotation_modifiee || dotation_initiale) + virements_reçus - virements_émis - total_engagé
 * Pure : uniquement arithmétique, pas d'I/O.
 */
function computeAvailableBalance(params: {
  dotationInitiale: number | null | undefined;
  dotationModifiee?: number | null | undefined;
  totalEngage: number | null | undefined;
  virementsEmis: number;
  virementsRecus: number;
}): number {
  const dotation = params.dotationModifiee || params.dotationInitiale || 0;
  const engaged = params.totalEngage || 0;
  return dotation + params.virementsRecus - params.virementsEmis - engaged;
}

/**
 * Vérifie si un solde couvre un montant demandé et retourne le message
 * d'erreur exact utilisé par la mutation de création.
 */
function checkSufficientBalance(
  disponible: number,
  amount: number
): { ok: boolean; message?: string } {
  if (disponible >= amount) return { ok: true };
  const fmt = new Intl.NumberFormat('fr-FR');
  return {
    ok: false,
    message: `Solde insuffisant : ${fmt.format(disponible)} FCFA disponibles, ${fmt.format(amount)} FCFA demandés`,
  };
}

/**
 * Plafond LOLF : un virement ne peut pas dépasser 10 % de la dotation initiale
 * de la ligne source, cumulé sur l'exercice (règle publique française reprise
 * par l'ARTI). L'ajustement n'est PAS concerné (il modifie la dotation elle-même
 * et passe par un arrêté séparé).
 *
 * Règle : somme(virements déjà émis executed) + nouveau montant ≤ 10 % × dotation_initiale
 *
 * Constante exportée pour qu'elle soit ajustable si l'ARTI change le seuil.
 */
export const VIREMENT_CEILING_RATIO = 0.1; // 10 %

interface CheckCeilingParams {
  /** Dotation initiale de la ligne source (base du plafond) */
  dotationInitiale: number | null | undefined;
  /** Somme des virements déjà exécutés en sortie depuis cette ligne sur l'exercice */
  totalVirementsEmisExecutes: number;
  /** Montant du nouveau virement envisagé */
  nouveauMontant: number;
  /** Ratio de plafond (défaut 0.1 = 10 %) — surchargeable pour tests/dérogations */
  ratio?: number;
}

interface CheckCeilingResult {
  ok: boolean;
  message?: string;
  /** Plafond absolu en FCFA (dotation × ratio) */
  ceiling: number;
  /** Total cumulé si le nouveau virement était accepté */
  cumulativeWouldBe: number;
  /** Pourcentage cumulé si accepté */
  cumulativeRatio: number;
}

/**
 * Vérifie le plafond LOLF 10 % avant création d'un virement.
 *
 * Cas acceptés :
 *   - dotation_initiale <= 0 → on refuse (pas de dotation = pas de virement possible)
 *   - cumul après virement ≤ plafond → ok
 *
 * Cas refusés :
 *   - cumul après virement > plafond → erreur avec message FCFA explicite
 *
 * NB : l'ajustement (type_transfer='ajustement') NE DOIT PAS être passé à cette
 * fonction. La responsabilité de filtrer sur le type appartient à l'appelant.
 */
export function checkVirementCeiling(params: CheckCeilingParams): CheckCeilingResult {
  const ratio = params.ratio ?? VIREMENT_CEILING_RATIO;
  const dotation = params.dotationInitiale ?? 0;
  const emis = params.totalVirementsEmisExecutes;
  const amount = params.nouveauMontant;

  // Cas dégénéré : pas de dotation initiale → impossible de virer quoi que ce soit
  if (dotation <= 0) {
    return {
      ok: false,
      ceiling: 0,
      cumulativeWouldBe: emis + amount,
      cumulativeRatio: Infinity,
      message:
        "Plafond virements : la ligne source n'a pas de dotation initiale — aucun virement possible.",
    };
  }

  const ceiling = dotation * ratio;
  const cumulativeWouldBe = emis + amount;
  // Arrondi à 4 décimales pour éviter les drifts IEEE 754 en tests et affichage
  const cumulativeRatio = Math.round((cumulativeWouldBe / dotation) * 10000) / 10000;

  if (cumulativeWouldBe <= ceiling) {
    return { ok: true, ceiling, cumulativeWouldBe, cumulativeRatio };
  }

  const fmt = new Intl.NumberFormat('fr-FR');
  const pctFmt = new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    ok: false,
    ceiling,
    cumulativeWouldBe,
    cumulativeRatio,
    message:
      `Plafond virements dépassé : le cumul atteindrait ${fmt.format(cumulativeWouldBe)} FCFA ` +
      `(${pctFmt.format(cumulativeRatio)}) pour une limite de ${fmt.format(ceiling)} FCFA ` +
      `(${pctFmt.format(ratio)} de la dotation initiale). Virements déjà exécutés : ${fmt.format(emis)} FCFA.`,
  };
}

/**
 * Matrice des transitions de statut autorisées — workflow 2 niveaux CB → DG.
 *
 *   en_attente ──(CB approuve)──▶ approuve ──(DG exécute)──▶ execute
 *        │                            │
 *        └──(CB rejette)──┐           └──(DG rejette)──┐
 *                         ▼                            ▼
 *                       rejete                       rejete
 *
 * États terminaux : execute, rejete (aucune transition sortante).
 * Pas de "brouillon" : un virement est "soumis" (en_attente) dès la création.
 */
const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  en_attente: ['approuve', 'rejete'],
  approuve: ['execute', 'rejete'],
  execute: [],
  rejete: [],
};

function isTransitionValid(from: string | null | undefined, to: string): boolean {
  if (!from) return false;
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

// ============================================================================
// Main Hook
// ============================================================================

export function useBudgetTransfers(filters?: BudgetTransferFilters) {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  // Fetch all transfers
  const {
    data: transfers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['budget-transfers', exercice, filters],
    queryFn: async () => {
      let query = supabase
        .from('credit_transfers')
        .select(
          `
          *,
          from_line:budget_lines!credit_transfers_from_budget_line_id_fkey(code, label, dotation_initiale),
          to_line:budget_lines!credit_transfers_to_budget_line_id_fkey(code, label, dotation_initiale),
          requested_by_profile:profiles!credit_transfers_requested_by_fkey(full_name),
          approved_by_profile:profiles!credit_transfers_approved_by_fkey(full_name)
        `
        )
        .eq('exercice', exercice || new Date().getFullYear())
        .order('requested_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type_transfer) {
        query = query.eq('type_transfer', filters.type_transfer);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BudgetTransfer[];
    },
    enabled: !!exercice,
  });

  // Computed stats (délégué à la fonction pure `computeStats` — couvert par les tests unitaires)
  const stats: TransferStats = computeStats(transfers);

  // Create transfer
  const createMutation = useMutation({
    mutationFn: async (data: CreateTransferData) => {
      // Virement: verify source availability
      if (data.type_transfer === 'virement' && data.from_budget_line_id) {
        const { data: fromLine } = await supabase
          .from('budget_lines')
          .select('dotation_initiale, dotation_modifiee, total_engage')
          .eq('id', data.from_budget_line_id)
          .single();

        const { data: virementsEmis } = await supabase
          .from('credit_transfers')
          .select('amount')
          .eq('from_budget_line_id', data.from_budget_line_id)
          .eq('status', 'execute');

        const { data: virementsRecus } = await supabase
          .from('credit_transfers')
          .select('amount')
          .eq('to_budget_line_id', data.from_budget_line_id)
          .eq('status', 'execute');

        const emisTotal = virementsEmis?.reduce((s, v) => s + v.amount, 0) || 0;

        const disponible = computeAvailableBalance({
          dotationInitiale: fromLine?.dotation_initiale,
          dotationModifiee: fromLine?.dotation_modifiee,
          totalEngage: fromLine?.total_engage,
          virementsEmis: emisTotal,
          virementsRecus: virementsRecus?.reduce((s, v) => s + v.amount, 0) || 0,
        });

        const balanceCheck = checkSufficientBalance(disponible, data.amount);
        if (!balanceCheck.ok) {
          throw new Error(balanceCheck.message);
        }

        // Plafond LOLF 10 % de la dotation initiale (cumulatif sur l'exercice).
        // Seulement pour les virements — l'ajustement est hors scope.
        const ceilingCheck = checkVirementCeiling({
          dotationInitiale: fromLine?.dotation_initiale,
          totalVirementsEmisExecutes: emisTotal,
          nouveauMontant: data.amount,
        });
        if (!ceilingCheck.ok) {
          throw new Error(ceilingCheck.message);
        }
      }

      // Generate code
      const { data: code, error: codeError } = await supabase.rpc('generate_transfer_code', {
        p_exercice: exercice || new Date().getFullYear(),
        p_type: data.type_transfer,
      });
      if (codeError) throw codeError;

      const { error, data: created } = await supabase
        .from('credit_transfers')
        .insert({
          code,
          type_transfer: data.type_transfer,
          from_budget_line_id: data.from_budget_line_id || null,
          to_budget_line_id: data.to_budget_line_id,
          amount: data.amount,
          motif: data.motif,
          justification_renforcee: data.justification_renforcee,
          exercice: exercice || new Date().getFullYear(),
          status: 'en_attente', // workflow 2 niveaux : directement soumis au CB
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        entity_type: 'credit_transfer',
        entity_id: created.id,
        action: 'transfer_created',
        new_values: { code, type: data.type_transfer, amount: data.amount },
        exercice: exercice || new Date().getFullYear(),
      });

      return created;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] });
      toast.success(
        `${data.type_transfer === 'ajustement' ? 'Ajustement' : 'Virement'} créé : ${data.code}`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Niveau 1 — CB approuve (en_attente → approuve)
  const approveCbMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { error } = await supabase
        .from('credit_transfers')
        .update({
          status: 'approuve',
          approved_at: new Date().toISOString(),
          approved_by: userId ?? null,
        })
        .eq('id', id)
        .eq('status', 'en_attente'); // garde-fou : empêche de ré-approuver un virement déjà traité
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        entity_type: 'credit_transfer',
        entity_id: id,
        action: 'transfer_approved_cb',
        exercice: exercice || new Date().getFullYear(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      toast.success('Virement approuvé par le CB — en attente du DG');
    },
    onError: (error: Error) => {
      toast.error("Erreur d'approbation CB : " + error.message);
    },
  });

  // Reject — accessible depuis les deux niveaux (CB sur en_attente, DG sur approuve)
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('credit_transfers')
        .update({
          status: 'rejete',
          rejection_reason: reason,
        })
        .eq('id', id)
        .in('status', ['en_attente', 'approuve']); // impossible de rejeter un virement déjà exécuté
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        entity_type: 'credit_transfer',
        entity_id: id,
        action: 'transfer_rejected',
        new_values: { reason },
        exercice: exercice || new Date().getFullYear(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      toast.success('Virement rejeté');
    },
    onError: (error: Error) => {
      toast.error('Erreur : ' + error.message);
    },
  });

  // Niveau 2 — DG exécute (approuve → execute)
  // Le RPC `execute_credit_transfer` est SECURITY DEFINER : il vérifie le statut
  // `approuve`, transfère effectivement les montants sur `budget_lines` et log l'audit.
  //
  // Upload facultatif de la décision DG (PJ) avant exécution : le fichier est
  // stocké dans le bucket `sygfp-attachments` sous `credit-transfers/decisions/<id>/`
  // et les colonnes `decision_file_url` / `decision_file_name` sont patchées AVANT
  // l'appel RPC pour garantir la traçabilité même si l'exécution échoue après.
  const executeMutation = useMutation({
    mutationFn: async ({ id, decisionFile }: { id: string; decisionFile?: File | null }) => {
      const { data: userData } = await supabase.auth.getUser();

      // 1. Upload de la décision DG si fournie
      if (decisionFile) {
        const sanitizedName = decisionFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `credit-transfers/decisions/${id}/${Date.now()}_${sanitizedName}`;
        const { error: uploadError } = await supabase.storage
          .from('sygfp-attachments')
          .upload(storagePath, decisionFile, { upsert: false });
        if (uploadError) {
          throw new Error(`Upload de la décision DG impossible : ${uploadError.message}`);
        }
        const { data: urlData } = supabase.storage
          .from('sygfp-attachments')
          .getPublicUrl(storagePath);

        const { error: patchError } = await supabase
          .from('credit_transfers')
          .update({
            decision_file_url: urlData.publicUrl,
            decision_file_name: decisionFile.name,
          })
          .eq('id', id)
          .eq('status', 'approuve'); // garde-fou : on ne patche que si toujours en attente DG
        if (patchError) {
          throw new Error(`Enregistrement de la décision DG impossible : ${patchError.message}`);
        }
      }

      // 2. Exécution effective (transfert des montants + audit RPC)
      const { data: result, error } = await supabase.rpc('execute_credit_transfer', {
        p_transfer_id: id,
        p_user_id: userData?.user?.id ?? undefined,
      });
      if (error) throw error;
      const res = result as { success: boolean; error?: string; code?: string };
      if (!res?.success) throw new Error(res?.error || "Erreur d'exécution inconnue");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
      queryClient.invalidateQueries({ queryKey: ['budget-movements-journal'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-badges'] });
      toast.success('Virement exécuté — les montants ont été transférés');
    },
    onError: (error: Error) => {
      toast.error("Erreur d'exécution : " + error.message);
    },
  });

  return {
    transfers,
    isLoading,
    error,
    stats,
    createTransfer: createMutation.mutate,
    approveTransferCb: approveCbMutation.mutate,
    rejectTransfer: rejectMutation.mutate,
    executeTransfer: executeMutation.mutate,
    isCreating: createMutation.isPending,
    isApprovingCb: approveCbMutation.isPending,
    isExecuting: executeMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

// ============================================================================
// Budget History Hook
// ============================================================================

export function useBudgetHistory(budgetLineId?: string) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['budget-history', budgetLineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_history')
        .select(
          `
          *,
          created_by_profile:profiles!budget_history_created_by_fkey(full_name)
        `
        )
        .eq('budget_line_id', budgetLineId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BudgetHistory[];
    },
    enabled: !!budgetLineId,
  });

  return { history, isLoading };
}

// ============================================================================
// Budget Line Available Hook
// ============================================================================

export function useBudgetLineAvailable(budgetLineId?: string) {
  const { exercice } = useExercice();

  const { data, isLoading } = useQuery({
    queryKey: ['budget-line-available', budgetLineId, exercice],
    queryFn: async () => {
      const { data: line } = await supabase
        .from('budget_lines')
        .select('dotation_initiale, dotation_modifiee, total_engage')
        .eq('id', budgetLineId as string)
        .single();

      const dotation = line?.dotation_modifiee || line?.dotation_initiale || 0;
      const engaged = line?.total_engage || 0;
      const disponible = dotation - engaged;

      return { dotation, engaged, disponible };
    },
    enabled: !!budgetLineId,
  });

  return { ...data, isLoading };
}

// ============================================================================
// Export des fonctions pures pour les tests unitaires.
// Ne pas importer depuis l'UI — utiliser les hooks ci-dessus.
// ============================================================================

export const __testing__ = {
  computeStats,
  computeAvailableBalance,
  checkSufficientBalance,
  checkVirementCeiling,
  isTransitionValid,
  ALLOWED_TRANSITIONS,
  VIREMENT_CEILING_RATIO,
};
