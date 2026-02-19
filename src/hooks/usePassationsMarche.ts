import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExercice } from '@/contexts/ExerciceContext';
import type { Json, Database } from '@/integrations/supabase/types';
import type { ExpressionBesoinLigne } from '@/hooks/useExpressionsBesoin';

type PassationInsert = Database['public']['Tables']['passation_marche']['Insert'];
type PassationUpdate = Database['public']['Tables']['passation_marche']['Update'];

export type StatutSoumissionnaire = 'recu' | 'conforme' | 'qualifie' | 'retenu' | 'elimine';

export interface Soumissionnaire {
  id: string;
  passation_marche_id: string;
  lot_marche_id: string | null;
  prestataire_id: string | null;
  is_manual_entry: boolean;
  raison_sociale: string;
  contact_nom: string | null;
  email: string | null;
  telephone: string | null;
  rccm: string | null;
  offre_technique_url: string | null;
  offre_financiere: number | null;
  date_depot: string | null;
  note_technique: number | null;
  note_financiere: number | null;
  qualifie_technique: boolean;
  note_finale: number | null;
  rang_classement: number | null;
  statut: StatutSoumissionnaire;
  motif_elimination: string | null;
  observations: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUTS_SOUMISSIONNAIRE: Record<
  StatutSoumissionnaire,
  { label: string; color: string; next?: StatutSoumissionnaire[] }
> = {
  recu: {
    label: 'Recu',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    next: ['conforme', 'elimine'],
  },
  conforme: {
    label: 'Conforme',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    next: ['qualifie', 'elimine'],
  },
  qualifie: {
    label: 'Qualifie',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    next: ['retenu', 'elimine'],
  },
  retenu: { label: 'Retenu', color: 'bg-green-100 text-green-700 border-green-300' },
  elimine: { label: 'Elimine', color: 'bg-red-100 text-red-700 border-red-300' },
};

export const MIN_SOUMISSIONNAIRES: Record<string, number> = {
  entente_directe: 1,
  demande_cotation: 3,
  competition_limitee: 3,
  AO_ouvert: 3,
  AO_restreint: 3,
  gre_a_gre: 1,
  prestations_intellectuelles: 1,
};

export interface LotMarche {
  id: string;
  passation_marche_id?: string;
  numero: number;
  designation: string;
  description: string;
  montant_estime: number | null;
  statut?: 'en_cours' | 'attribue' | 'annule' | 'infructueux';
  prestataire_retenu_id?: string | null;
  montant_retenu?: number | null;
  soumissionnaires?: Soumissionnaire[];
  created_at?: string;
  updated_at?: string;
}

export interface PrestataireSolliciteData {
  prestataire_id: string;
  raison_sociale: string;
  offre_montant: number | null;
  note_technique: number | null;
  note_financiere: number | null;
  selectionne: boolean;
}

export interface CritereEvaluation {
  nom: string;
  poids: number;
}

export interface PieceJointePassation {
  code: string;
  nom?: string;
  url?: string;
  uploaded_at?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt?: string;
}

export interface PassationMarche {
  id: string;
  reference: string | null;
  dossier_id: string | null;
  expression_besoin_id: string | null;
  mode_passation: string;
  type_procedure: string | null;
  seuil_montant: string | null;
  // Lots optionnels
  lots: LotMarche[];
  allotissement: boolean;
  soumissionnaires?: Soumissionnaire[];
  prestataires_sollicites: PrestataireSolliciteData[];
  analyse_offres: Record<string, unknown> | null;
  criteres_evaluation: CritereEvaluation[];
  pv_ouverture: string | null;
  pv_evaluation: string | null;
  rapport_analyse: string | null;
  // Décision
  decision: 'contrat_a_creer' | 'engagement_possible' | null;
  justification_decision: string | null;
  prestataire_retenu_id: string | null;
  montant_retenu: number | null;
  motif_selection: string | null;
  // Workflow
  statut: string;
  exercice: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  validated_at: string | null;
  rejected_at: string | null;
  differed_at: string | null;
  rejection_reason: string | null;
  motif_differe: string | null;
  date_reprise: string | null;
  // Workflow extended (columns already in DB)
  date_publication: string | null;
  date_cloture: string | null;
  publie_at: string | null;
  publie_by: string | null;
  cloture_at: string | null;
  cloture_by: string | null;
  evaluation_at: string | null;
  evaluation_by: string | null;
  attribue_at: string | null;
  attribue_by: string | null;
  approuve_at: string | null;
  approuve_by: string | null;
  signe_at: string | null;
  signe_by: string | null;
  contrat_url: string | null;
  motif_rejet_attribution: string | null;
  pieces_jointes: PieceJointePassation[];
  // Joined
  expression_besoin?: {
    id: string;
    numero: string | null;
    objet: string;
    montant_estime: number | null;
    direction_id: string | null;
    ligne_budgetaire_id: string | null;
    type_procedure: string | null;
    direction?: { id: string; label: string; sigle: string | null } | null;
  } | null;
  dossier?: {
    id: string;
    numero: string;
    objet: string;
  } | null;
  prestataire_retenu?: {
    id: string;
    raison_sociale: string;
  } | null;
  creator?: { id: string; full_name: string | null } | null;
}

export interface EBValidee {
  id: string;
  numero: string | null;
  objet: string;
  montant_estime: number | null;
  dossier_id: string | null;
  direction_id: string | null;
  ligne_budgetaire_id: string | null;
  liste_articles: ExpressionBesoinLigne[] | null;
  type_procedure: string | null;
  direction?: { id: string; label: string; sigle: string | null } | null;
  budget_line?: { id: string; code: string; label: string } | null;
}

export const PROCEDURES_PASSATION = [
  { value: 'entente_directe', label: 'Entente directe' },
  { value: 'demande_cotation', label: 'Demande de cotation' },
  { value: 'competition_limitee', label: 'Compétition limitée' },
  { value: 'AO_ouvert', label: "Appel d'offres ouvert" },
  { value: 'AO_restreint', label: "Appel d'offres restreint" },
  { value: 'gre_a_gre', label: 'Gré à gré' },
  { value: 'prestations_intellectuelles', label: 'Prestations intellectuelles' },
];

// Rétrocompat : les composants existants importent MODES_PASSATION
export const MODES_PASSATION = PROCEDURES_PASSATION;

// Constantes d'evaluation des soumissionnaires
export const SEUIL_NOTE_TECHNIQUE = 70;
export const POIDS_TECHNIQUE = 0.7;
export const POIDS_FINANCIER = 0.3;

// Seuils de passation selon le Code des Marchés Publics (Côte d'Ivoire)
export const SEUILS_PASSATION = [
  {
    min: 0,
    max: 10_000_000,
    code: 'PSD',
    procedure: 'Entente directe',
    mode_value: 'entente_directe',
    label: 'Procédure Simplifiée Directe (PSD)',
    description: 'Montant < 10 000 000 FCFA',
  },
  {
    min: 10_000_000,
    max: 30_000_000,
    code: 'PSC',
    procedure: 'Demande de cotation',
    mode_value: 'consultation',
    label: 'Procédure Simplifiée par Cotation (PSC)',
    description: '10 000 000 ≤ Montant < 30 000 000 FCFA',
  },
  {
    min: 30_000_000,
    max: 100_000_000,
    code: 'PSL',
    procedure: 'Compétition limitée',
    mode_value: 'appel_offres_restreint',
    label: 'Procédure Simplifiée Limitée (PSL)',
    description: '30 000 000 ≤ Montant < 100 000 000 FCFA',
  },
  {
    min: 100_000_000,
    max: Infinity,
    code: 'PSO',
    procedure: "Appel d'offres ouvert",
    mode_value: 'appel_offres_ouvert',
    label: 'Procédure Standard Ouverte (PSO)',
    description: 'Montant ≥ 100 000 000 FCFA',
  },
] as const;

/**
 * Retourne le seuil recommandé pour un montant donné
 */
export function getSeuilRecommande(montant: number | null) {
  if (!montant || montant <= 0) return null;
  return SEUILS_PASSATION.find((s) => montant >= s.min && montant < s.max) ?? null;
}

// Seuils DGMP avec badge coloré et procédure associée
export const SEUILS_DGMP = [
  {
    max: 10_000_000,
    label: 'Entente directe',
    color: 'bg-green-100 text-green-700 border-green-300',
    procedure: 'entente_directe',
  },
  {
    max: 30_000_000,
    label: 'Demande de cotation',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    procedure: 'demande_cotation',
  },
  {
    max: 100_000_000,
    label: 'Compétition limitée',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    procedure: 'competition_limitee',
  },
  {
    max: Infinity,
    label: "Appel d'offres ouvert",
    color: 'bg-red-100 text-red-700 border-red-300',
    procedure: 'AO_ouvert',
  },
] as const;

export function getSeuilForMontant(montant: number | null): (typeof SEUILS_DGMP)[number] | null {
  if (!montant || montant <= 0) return null;
  return SEUILS_DGMP.find((s) => montant < s.max) || SEUILS_DGMP[SEUILS_DGMP.length - 1];
}

export function isProcedureCoherente(montant: number | null, procedure: string): boolean {
  const seuil = getSeuilForMontant(montant);
  if (!seuil) return true;
  if (procedure === 'gre_a_gre' || procedure === 'prestations_intellectuelles') return true;
  return seuil.procedure === procedure;
}

// Types de décision de sortie de la passation
export const DECISIONS_SORTIE = [
  {
    value: 'engagement_possible',
    label: 'Engagement possible',
    description: "Le montant est sous le seuil - passage direct à l'engagement",
    color: 'bg-green-100 text-green-700',
    nextStep: '/engagements',
  },
  {
    value: 'contrat_a_creer',
    label: 'Contrat à créer',
    description: 'Montant au-dessus du seuil - nécessite un contrat formel',
    color: 'bg-blue-100 text-blue-700',
    nextStep: '/contractualisation',
  },
] as const;

export type DecisionSortie = (typeof DECISIONS_SORTIE)[number]['value'];

export type PassationStatut =
  | 'brouillon'
  | 'publie'
  | 'cloture'
  | 'en_evaluation'
  | 'attribue'
  | 'approuve'
  | 'signe';

export const STATUTS: Record<string, { label: string; color: string; step: number }> = {
  brouillon: { label: 'Brouillon', color: 'bg-muted text-muted-foreground', step: 0 },
  publie: { label: 'Publié', color: 'bg-cyan-100 text-cyan-700', step: 1 },
  cloture: { label: 'Clôturé', color: 'bg-indigo-100 text-indigo-700', step: 2 },
  en_evaluation: { label: 'En évaluation', color: 'bg-amber-100 text-amber-700', step: 3 },
  attribue: { label: 'Attribué', color: 'bg-purple-100 text-purple-700', step: 4 },
  approuve: { label: 'Approuvé', color: 'bg-green-100 text-green-700', step: 5 },
  signe: { label: 'Signé', color: 'bg-emerald-100 text-emerald-800', step: 6 },
  // Legacy
  soumis: { label: 'Soumis', color: 'bg-blue-100 text-blue-700', step: -1 },
  en_analyse: { label: 'En analyse', color: 'bg-yellow-100 text-yellow-700', step: -1 },
  valide: { label: 'Validé', color: 'bg-green-100 text-green-700', step: -1 },
  rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-700', step: -1 },
  differe: { label: 'Différé', color: 'bg-orange-100 text-orange-700', step: -1 },
};

export const WORKFLOW_STEPS = [
  { key: 'brouillon', label: 'Brouillon' },
  { key: 'publie', label: 'Publié' },
  { key: 'cloture', label: 'Clôturé' },
  { key: 'en_evaluation', label: 'Évaluation' },
  { key: 'attribue', label: 'Attribué' },
  { key: 'approuve', label: 'Approuvé' },
  { key: 'signe', label: 'Signé' },
] as const;

export const LIFECYCLE_STEPS: PassationStatut[] = [
  'brouillon',
  'publie',
  'cloture',
  'en_evaluation',
  'attribue',
  'approuve',
  'signe',
];

// ─── Client-side prerequisite checks ──────────────────────────────────────────

export function canPublish(p: PassationMarche): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (p.statut !== 'brouillon') errors.push('Le statut doit être "brouillon"');
  if (!p.expression_besoin_id) errors.push('Expression de besoin liée obligatoire');
  if (!p.mode_passation) errors.push('Mode de passation obligatoire');
  if (!p.date_publication) errors.push('Date de publication obligatoire');
  if (!p.date_cloture) errors.push('Date de clôture obligatoire');
  if (p.date_publication && p.date_cloture && p.date_cloture <= p.date_publication)
    errors.push('La date de clôture doit être postérieure à la date de publication');
  if (p.allotissement && (!p.lots || p.lots.length === 0))
    errors.push('Au moins 1 lot requis pour un marché alloti');
  return { ok: errors.length === 0, errors };
}

export function canClose(p: PassationMarche): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (p.statut !== 'publie') errors.push('Le statut doit être "publié"');
  return { ok: errors.length === 0, errors };
}

export function canStartEvaluation(p: PassationMarche): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (p.statut !== 'cloture') errors.push('Le statut doit être "clôturé"');
  const soumCount = p.soumissionnaires?.length ?? 0;
  if (soumCount === 0) errors.push('Au moins 1 soumissionnaire requis');
  return { ok: errors.length === 0, errors };
}

export function canAward(p: PassationMarche): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (p.statut !== 'en_evaluation') errors.push('Le statut doit être "en évaluation"');
  const soums = p.soumissionnaires ?? [];
  const nonEvalues = soums.filter((s) => s.note_finale === null && s.statut !== 'elimine');
  if (nonEvalues.length > 0) errors.push(`${nonEvalues.length} soumissionnaire(s) non évalué(s)`);
  const qualifies = soums.filter((s) => s.qualifie_technique);
  if (qualifies.length === 0) errors.push('Aucun soumissionnaire qualifié');
  return { ok: errors.length === 0, errors };
}

export function canApprove(p: PassationMarche): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (p.statut !== 'attribue') errors.push('Le statut doit être "attribué"');
  return { ok: errors.length === 0, errors };
}

export function canSign(p: PassationMarche): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (p.statut !== 'approuve') errors.push('Le statut doit être "approuvé"');
  if (!p.contrat_url) errors.push('URL du contrat signé obligatoire');
  return { ok: errors.length === 0, errors };
}

// ─── Notification helper for workflow transitions ──────────────────────────

interface NotifTarget {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityId: string;
  entityNumero?: string;
  isUrgent?: boolean;
}

async function dispatchPassationNotifications(targets: NotifTarget[]) {
  for (const t of targets) {
    try {
      // Insert in-app notification
      await supabase.from('notifications').insert({
        user_id: t.userId,
        type: t.type,
        title: t.title,
        message: t.message,
        entity_type: 'passation_marche',
        entity_id: t.entityId,
        is_urgent: t.isUrgent || false,
      });

      // Fire-and-forget email via Edge Function
      supabase.functions
        .invoke('send-notification-email', {
          body: {
            user_id: t.userId,
            type: t.type,
            title: t.title,
            message: t.message,
            entity_type: 'passation_marche',
            entity_id: t.entityId,
            entity_numero: t.entityNumero,
          },
        })
        .catch(() => {
          // Email is best-effort, don't block workflow
        });
    } catch {
      // Notification errors should never block workflow
    }
  }
}

/** Fetch user IDs by role(s) */
async function getUserIdsByRole(roles: string[]): Promise<string[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('user_id')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .in('role', roles as any)
    .eq('is_active', true);
  return data?.map((r) => r.user_id) || [];
}

/** Fetch user IDs in a given direction */
async function getUserIdsInDirection(directionId: string): Promise<string[]> {
  const { data } = await supabase.from('profiles').select('id').eq('direction_id', directionId);
  return data?.map((p) => p.id) || [];
}

export function usePassationsMarche() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  // Pagination + filtrage serveur
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statutFilter, setStatutFilter] = useState<string | null>(null);

  // Reset page quand exercice ou filtre change
  const handleSetStatutFilter = useCallback((statut: string | null) => {
    setStatutFilter(statut);
    setPage(1);
  }, []);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  // Fetch passations avec pagination serveur
  const {
    data: queryResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['passations-marche', exercice, page, pageSize, statutFilter],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('passation_marche')
        .select(
          `
          *,
          lots:lots_marche(*),
          soumissionnaires:soumissionnaires_lot(*),
          expression_besoin:expressions_besoin(id, numero, objet, montant_estime, direction_id, ligne_budgetaire_id, type_procedure, direction:directions(id, label, sigle)),
          dossier:dossiers(id, numero, objet),
          prestataire_retenu:prestataires!passation_marche_prestataire_retenu_id_fkey(id, raison_sociale),
          creator:profiles!passation_marche_created_by_fkey(id, full_name)
        `,
          { count: 'exact' }
        )
        .eq('exercice', exercice);

      if (statutFilter) {
        query = query.eq('statut', statutFilter);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const passations = (data ?? []).map((row) => {
        const parsed = row as unknown as PassationMarche;
        if (Array.isArray(parsed.lots)) {
          parsed.lots.sort((a, b) => a.numero - b.numero);
          const soums = (parsed.soumissionnaires || []) as Soumissionnaire[];
          for (const lot of parsed.lots) {
            lot.soumissionnaires = soums.filter((s) => s.lot_marche_id === lot.id);
          }
        }
        return parsed;
      });

      return { passations, total: count ?? 0 };
    },
    enabled: !!exercice,
    staleTime: 30_000,
  });

  const passations = queryResult?.passations ?? [];
  const total = queryResult?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  // Fetch EB validées disponibles
  const { data: ebValidees = [] } = useQuery({
    queryKey: ['eb-validees-pour-pm', exercice],
    queryFn: async () => {
      const { data: ebs, error } = await supabase
        .from('expressions_besoin')
        .select(
          `
          id, numero, objet, montant_estime, dossier_id, direction_id, ligne_budgetaire_id, liste_articles, type_procedure,
          direction:directions(id, label, sigle),
          budget_line:budget_lines!expressions_besoin_ligne_budgetaire_id_fkey(id, code, label)
        `
        )
        .eq('statut', 'valide')
        .eq('exercice', exercice || new Date().getFullYear())
        .order('validated_at', { ascending: false });

      if (error) throw error;

      // Exclure les EB déjà utilisées
      const { data: usedEBs } = await supabase
        .from('passation_marche')
        .select('expression_besoin_id')
        .not('expression_besoin_id', 'is', null);

      const usedIds = new Set(usedEBs?.map((p) => p.expression_besoin_id) || []);
      return (ebs?.filter((eb) => !usedIds.has(eb.id)) || []) as unknown as EBValidee[];
    },
    enabled: !!exercice,
    staleTime: 60_000,
  });

  // Counts par statut via RPC (1 seule requête, indépendant de la pagination)
  const { data: rpcCounts } = useQuery({
    queryKey: ['passation-counts', exercice],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_passation_counts', {
        p_exercice: exercice as number,
      });
      if (error) throw error;
      return (data as Record<string, number>) ?? {};
    },
    enabled: !!exercice,
    staleTime: 30_000,
  });

  const counts: Record<string, number> = {
    brouillon: rpcCounts?.brouillon ?? 0,
    publie: rpcCounts?.publie ?? 0,
    cloture: rpcCounts?.cloture ?? 0,
    en_evaluation: rpcCounts?.en_evaluation ?? 0,
    attribue: rpcCounts?.attribue ?? 0,
    approuve: rpcCounts?.approuve ?? 0,
    signe: rpcCounts?.signe ?? 0,
    soumis: rpcCounts?.soumis ?? 0,
    en_analyse: rpcCounts?.en_analyse ?? 0,
    valide: rpcCounts?.valide ?? 0,
    rejete: rpcCounts?.rejete ?? 0,
    differe: rpcCounts?.differe ?? 0,
  };

  // Create
  const createMutation = useMutation({
    mutationFn: async (data: {
      expression_besoin_id: string;
      mode_passation: string;
      type_procedure?: string;
      prestataires_sollicites?: PrestataireSolliciteData[];
      criteres_evaluation?: CritereEvaluation[];
      // Nouveaux champs
      allotissement?: boolean;
      lots?: LotMarche[];
      decision?: DecisionSortie;
      justification_decision?: string;
      prestataire_retenu_id?: string;
      montant_retenu?: number;
      motif_selection?: string;
      // Dates lifecycle
      date_publication?: string;
      date_cloture?: string;
    }) => {
      // Récupérer l'utilisateur courant
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Récupérer le dossier_id et ligne_budgetaire_id depuis l'EB
      const { data: eb } = await supabase
        .from('expressions_besoin')
        .select('dossier_id, ligne_budgetaire_id, montant_estime')
        .eq('id', data.expression_besoin_id)
        .single();

      // Calculer le seuil recommandé
      const seuil = getSeuilRecommande(eb?.montant_estime ?? null);

      const insertPayload: PassationInsert = {
        // reference est générée automatiquement par le trigger SQL (format ARTI4MMYYNNNN)
        expression_besoin_id: data.expression_besoin_id,
        mode_passation: data.mode_passation,
        type_procedure: data.type_procedure || null,
        prestataires_sollicites: (data.prestataires_sollicites || []) as unknown as Json,
        criteres_evaluation: (data.criteres_evaluation || []) as unknown as Json,
        analyse_offres: {} as unknown as Json,
        allotissement: data.allotissement || false,
        decision: data.decision || null,
        prestataire_retenu_id: data.prestataire_retenu_id || null,
        montant_retenu: data.montant_retenu || null,
        motif_selection: data.motif_selection || null,
        seuil_montant: seuil?.code || null,
        dossier_id: eb?.dossier_id || null,
        exercice: exercice || new Date().getFullYear(),
        statut: 'brouillon',
        created_by: user?.id || null,
        date_publication: data.date_publication || null,
        date_cloture: data.date_cloture || null,
      } as PassationInsert;

      const { data: result, error } = await supabase
        .from('passation_marche')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      // Insérer les lots dans la table lots_marche
      const lotsToInsert = data.allotissement ? data.lots || [] : [];
      if (lotsToInsert.length > 0 && result) {
        const { error: lotsError } = await supabase.from('lots_marche').insert(
          lotsToInsert.map((l, idx) => ({
            passation_marche_id: result.id,
            numero: idx + 1,
            designation: l.designation || '',
            description: l.description || '',
            montant_estime: l.montant_estime || 0,
            statut: 'en_cours',
          }))
        );
        if (lotsError) throw lotsError;
      }

      // Insérer les soumissionnaires dans la table soumissionnaires_lot
      const soumissionnairesData = data.prestataires_sollicites || [];
      if (soumissionnairesData.length > 0 && result) {
        const { error: soumError } = await supabase.from('soumissionnaires_lot').insert(
          soumissionnairesData.map((ps) => ({
            passation_marche_id: result.id,
            prestataire_id: ps.prestataire_id || null,
            raison_sociale: ps.raison_sociale,
            offre_financiere: ps.offre_montant ?? null,
            statut: ps.selectionne ? 'retenu' : 'recu',
            created_by: user?.id || null,
          }))
        );
        if (soumError) throw soumError;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      queryClient.invalidateQueries({ queryKey: ['eb-validees-pour-pm'] });
      toast.success('Passation de marché créée');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la création de la passation', {
        description: error.message,
      });
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<PassationMarche>) => {
      const { error } = await supabase
        .from('passation_marche')
        .update(data as unknown as PassationUpdate)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Mise à jour effectuée');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la mise à jour', {
        description: error.message,
      });
    },
  });

  // Submit
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'soumis',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Passation soumise pour validation');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la soumission', {
        description: error.message,
      });
    },
  });

  // Validate
  const validateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'valide',
          validated_at: new Date().toISOString(),
          rejection_reason: null,
          motif_differe: null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Passation validée');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la validation', {
        description: error.message,
      });
    },
  });

  // Reject
  const rejectMutation = useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'rejete',
          rejected_at: new Date().toISOString(),
          rejection_reason: motif,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Passation rejetée');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors du rejet', {
        description: error.message,
      });
    },
  });

  // Defer
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
      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'differe',
          differed_at: new Date().toISOString(),
          motif_differe: motif,
          date_reprise: dateReprise || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Passation différée');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors du report', {
        description: error.message,
      });
    },
  });

  // Publish (brouillon → publie)
  const publishMutation = useMutation({
    mutationFn: async ({ id, dateCloture }: { id: string; dateCloture?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // RPC prerequisite check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: check, error: rpcErr } = await (supabase.rpc as any)(
        'check_passation_transition',
        {
          p_id: id,
          p_new_statut: 'publie',
        }
      );
      if (rpcErr) throw rpcErr;
      const result = check as unknown as { ok: boolean; errors: string[] };
      if (!result.ok) throw new Error(result.errors.join(', '));

      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'publie',
          publie_at: new Date().toISOString(),
          publie_by: user?.id || null,
          date_cloture: dateCloture || null,
        })
        .eq('id', id);
      if (error) throw error;

      // Notify agents of the direction
      const pm = passations.find((p) => p.id === id);
      const dirId = pm?.expression_besoin?.direction_id;
      if (dirId) {
        const dirUsers = await getUserIdsInDirection(dirId);
        const ref = pm?.reference || id.slice(0, 8);
        await dispatchPassationNotifications(
          dirUsers
            .filter((uid) => uid !== user?.id)
            .map((uid) => ({
              userId: uid,
              type: 'info',
              title: 'Marché publié',
              message: `La passation ${ref} (${pm?.expression_besoin?.objet || ''}) a été publiée.`,
              entityId: id,
              entityNumero: ref,
            }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Passation publiée');
    },
    onError: (error: Error) =>
      toast.error('Erreur lors de la publication', {
        description: error.message,
      }),
  });

  // Close (publie → cloture)
  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: check, error: rpcErr } = await (supabase.rpc as any)(
        'check_passation_transition',
        {
          p_id: id,
          p_new_statut: 'cloture',
        }
      );
      if (rpcErr) throw rpcErr;
      const result = check as unknown as { ok: boolean; errors: string[] };
      if (!result.ok) throw new Error(result.errors.join(', '));

      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'cloture',
          cloture_at: new Date().toISOString(),
          cloture_by: user?.id || null,
        })
        .eq('id', id);
      if (error) throw error;

      // Notify DAAF
      const pm = passations.find((p) => p.id === id);
      const ref = pm?.reference || id.slice(0, 8);
      const daafUsers = await getUserIdsByRole(['DAAF', 'DAF']);
      await dispatchPassationNotifications(
        daafUsers
          .filter((uid) => uid !== user?.id)
          .map((uid) => ({
            userId: uid,
            type: 'info',
            title: 'Marché clôturé',
            message: `La passation ${ref} a été clôturée. L'évaluation peut débuter.`,
            entityId: id,
            entityNumero: ref,
          }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Passation clôturée');
    },
    onError: (error: Error) =>
      toast.error('Erreur lors de la clôture', {
        description: error.message,
      }),
  });

  // Start evaluation (cloture → en_evaluation)
  const startEvaluationMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: check, error: rpcErr } = await (supabase.rpc as any)(
        'check_passation_transition',
        {
          p_id: id,
          p_new_statut: 'en_evaluation',
        }
      );
      if (rpcErr) throw rpcErr;
      const result = check as unknown as { ok: boolean; errors: string[] };
      if (!result.ok) throw new Error(result.errors.join(', '));

      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'en_evaluation',
          evaluation_at: new Date().toISOString(),
          evaluation_by: user?.id || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Évaluation lancée');
    },
    onError: (error: Error) =>
      toast.error("Erreur lors du lancement de l'évaluation", {
        description: error.message,
      }),
  });

  // Propose attribution (en_evaluation → attribue)
  const proposeAttributionMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: check, error: rpcErr } = await (supabase.rpc as any)(
        'check_passation_transition',
        {
          p_id: id,
          p_new_statut: 'attribue',
        }
      );
      if (rpcErr) throw rpcErr;
      const result = check as unknown as { ok: boolean; errors: string[] };
      if (!result.ok) throw new Error(result.errors.join(', '));

      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'attribue',
          attribue_at: new Date().toISOString(),
          attribue_by: user?.id || null,
        })
        .eq('id', id);
      if (error) throw error;

      // Notify DG for approval
      const pm = passations.find((p) => p.id === id);
      const ref = pm?.reference || id.slice(0, 8);
      const retenu = pm?.soumissionnaires?.find((s) => s.statut === 'retenu');
      const dgUsers = await getUserIdsByRole(['DG']);
      await dispatchPassationNotifications(
        dgUsers.map((uid) => ({
          userId: uid,
          type: 'validation',
          title: 'Attribution à approuver',
          message: `La passation ${ref} propose l'attribution à ${retenu?.raison_sociale || 'N/A'}. Votre approbation est requise.`,
          entityId: id,
          entityNumero: ref,
          isUrgent: true,
        }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Attribution proposée au DG');
    },
    onError: (error: Error) =>
      toast.error("Erreur lors de l'attribution", {
        description: error.message,
      }),
  });

  // Approve attribution (attribue → approuve)
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: check, error: rpcErr } = await (supabase.rpc as any)(
        'check_passation_transition',
        {
          p_id: id,
          p_new_statut: 'approuve',
        }
      );
      if (rpcErr) throw rpcErr;
      const result = check as unknown as { ok: boolean; errors: string[] };
      if (!result.ok) throw new Error(result.errors.join(', '));

      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'approuve',
          approuve_at: new Date().toISOString(),
          approuve_by: user?.id || null,
        })
        .eq('id', id);
      if (error) throw error;

      // Notify DAAF + direction agents + prestataire (if email)
      const pm = passations.find((p) => p.id === id);
      const ref = pm?.reference || id.slice(0, 8);
      const retenu = pm?.soumissionnaires?.find((s) => s.statut === 'retenu');
      const targets: NotifTarget[] = [];

      // DAAF
      const daafUsers = await getUserIdsByRole(['DAAF', 'DAF']);
      for (const uid of daafUsers) {
        targets.push({
          userId: uid,
          type: 'info',
          title: 'Attribution approuvée par le DG',
          message: `La passation ${ref} a été approuvée. Attributaire : ${retenu?.raison_sociale || 'N/A'}.`,
          entityId: id,
          entityNumero: ref,
        });
      }

      // Direction agents
      const dirId = pm?.expression_besoin?.direction_id;
      if (dirId) {
        const dirUsers = await getUserIdsInDirection(dirId);
        for (const uid of dirUsers.filter((u) => !daafUsers.includes(u) && u !== user?.id)) {
          targets.push({
            userId: uid,
            type: 'info',
            title: 'Marché approuvé',
            message: `La passation ${ref} a été approuvée par le DG.`,
            entityId: id,
            entityNumero: ref,
          });
        }
      }

      await dispatchPassationNotifications(targets);

      // Notify prestataire by email if they have an email (not an in-app user)
      if (retenu?.email) {
        supabase.functions
          .invoke('send-notification-email', {
            body: {
              // Use a special pseudo-user flow: the edge function handles no-user gracefully
              user_id: retenu.prestataire_id || 'external',
              type: 'info',
              title: 'Marché approuvé',
              message: `Votre offre pour la passation ${ref} a été approuvée.`,
              entity_type: 'passation_marche',
              entity_id: id,
            },
          })
          .catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Attribution approuvée');
    },
    onError: (error: Error) =>
      toast.error("Erreur lors de l'approbation", {
        description: error.message,
      }),
  });

  // Reject attribution (attribue → en_evaluation)
  const rejectAttributionMutation = useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'en_evaluation',
          motif_rejet_attribution: motif,
          attribue_at: null,
          attribue_by: null,
        })
        .eq('id', id);
      if (error) throw error;

      // Notify DAAF with rejection motif
      const pm = passations.find((p) => p.id === id);
      const ref = pm?.reference || id.slice(0, 8);
      const daafUsers = await getUserIdsByRole(['DAAF', 'DAF']);
      await dispatchPassationNotifications(
        daafUsers.map((uid) => ({
          userId: uid,
          type: 'rejet',
          title: 'Attribution rejetée par le DG',
          message: `La passation ${ref} a été rejetée. Motif : ${motif}`,
          entityId: id,
          entityNumero: ref,
          isUrgent: true,
        }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Attribution rejetée');
    },
    onError: (error: Error) =>
      toast.error("Erreur lors du rejet de l'attribution", {
        description: error.message,
      }),
  });

  // Sign (approuve → signe)
  const signMutation = useMutation({
    mutationFn: async ({ id, contratUrl }: { id: string; contratUrl: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // Set contrat_url first so the RPC check passes
      const { error: urlErr } = await supabase
        .from('passation_marche')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ contrat_url: contratUrl } as any)
        .eq('id', id);
      if (urlErr) throw urlErr;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: check, error: rpcErr } = await (supabase.rpc as any)(
        'check_passation_transition',
        {
          p_id: id,
          p_new_statut: 'signe',
        }
      );
      if (rpcErr) throw rpcErr;
      const result = check as unknown as { ok: boolean; errors: string[] };
      if (!result.ok) throw new Error(result.errors.join(', '));

      const { error } = await supabase
        .from('passation_marche')
        .update({
          statut: 'signe',
          signe_at: new Date().toISOString(),
          signe_by: user?.id || null,
          contrat_url: contratUrl,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      toast.success('Contrat signé');
    },
    onError: (error: Error) =>
      toast.error('Erreur lors de la signature', {
        description: error.message,
      }),
  });

  // Save lots (upsert: delete all then re-insert)
  const saveLotsMutation = useMutation({
    mutationFn: async ({ passationId, lots }: { passationId: string; lots: LotMarche[] }) => {
      // Supprimer tous les lots existants
      const { error: delError } = await supabase
        .from('lots_marche')
        .delete()
        .eq('passation_marche_id', passationId);
      if (delError) throw delError;

      // Insérer les nouveaux
      if (lots.length > 0) {
        const { error: insError } = await supabase.from('lots_marche').insert(
          lots.map((l, idx) => ({
            passation_marche_id: passationId,
            numero: idx + 1,
            designation: l.designation || '',
            description: l.description || '',
            montant_estime: l.montant_estime || 0,
            statut: l.statut || 'en_cours',
          }))
        );
        if (insError) throw insError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      toast.success('Lots mis à jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la sauvegarde des lots', {
        description: error.message,
      });
    },
  });

  // Save soumissionnaires (bulk: delete-then-reinsert)
  const saveSoumissionnairesMutation = useMutation({
    mutationFn: async ({
      passationId,
      soumissionnaires: soums,
    }: {
      passationId: string;
      soumissionnaires: Array<{
        prestataire_id?: string | null;
        raison_sociale: string;
        offre_montant?: number | null;
        selectionne?: boolean;
        lot_marche_id?: string | null;
      }>;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Supprimer tous les soumissionnaires existants
      const { error: delError } = await supabase
        .from('soumissionnaires_lot')
        .delete()
        .eq('passation_marche_id', passationId);
      if (delError) throw delError;

      // Ré-insérer
      if (soums.length > 0) {
        const { error: insError } = await supabase.from('soumissionnaires_lot').insert(
          soums.map((s) => ({
            passation_marche_id: passationId,
            lot_marche_id: s.lot_marche_id || null,
            prestataire_id: s.prestataire_id || null,
            raison_sociale: s.raison_sociale,
            offre_financiere: s.offre_montant ?? null,
            statut: s.selectionne ? 'retenu' : 'recu',
            created_by: user?.id || null,
          }))
        );
        if (insError) throw insError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      toast.success('Soumissionnaires mis à jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la sauvegarde des soumissionnaires', {
        description: error.message,
      });
    },
  });

  // Add soumissionnaire
  const addSoumissionnaireMutation = useMutation({
    mutationFn: async (data: {
      passation_marche_id: string;
      lot_marche_id?: string | null;
      prestataire_id?: string | null;
      is_manual_entry?: boolean;
      raison_sociale: string;
      contact_nom?: string | null;
      email?: string | null;
      telephone?: string | null;
      rccm?: string | null;
      offre_technique_url?: string | null;
      offre_financiere?: number | null;
      date_depot?: string | null;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('soumissionnaires_lot')
        .insert({
          passation_marche_id: data.passation_marche_id,
          lot_marche_id: data.lot_marche_id || null,
          prestataire_id: data.prestataire_id || null,
          is_manual_entry: data.is_manual_entry || false,
          raison_sociale: data.raison_sociale,
          contact_nom: data.contact_nom || null,
          email: data.email || null,
          telephone: data.telephone || null,
          rccm: data.rccm || null,
          offre_technique_url: data.offre_technique_url || null,
          offre_financiere: data.offre_financiere || null,
          date_depot: data.date_depot || null,
          statut: 'recu',
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      toast.success('Soumissionnaire ajouté');
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'ajout du soumissionnaire", {
        description: error.message,
      });
    },
  });

  // Update soumissionnaire
  const updateSoumissionnaireMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Partial<
      Omit<Soumissionnaire, 'id' | 'created_at' | 'updated_at' | 'created_by'>
    >) => {
      const { error } = await supabase.from('soumissionnaires_lot').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      toast.success('Soumissionnaire mis à jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la mise à jour du soumissionnaire', {
        description: error.message,
      });
    },
  });

  // Delete soumissionnaire
  const deleteSoumissionnaireMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('soumissionnaires_lot').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      toast.success('Soumissionnaire supprimé');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la suppression du soumissionnaire', {
        description: error.message,
      });
    },
  });

  // Evaluate soumissionnaire (note_technique + note_financiere → trigger calcule note_finale)
  const evaluateSoumissionnaireMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      note_technique?: number | null;
      note_financiere?: number | null;
    }) => {
      const updatePayload: Record<string, unknown> = {};
      if (data.note_technique !== undefined) updatePayload.note_technique = data.note_technique;
      if (data.note_financiere !== undefined) updatePayload.note_financiere = data.note_financiere;

      const { error } = await supabase
        .from('soumissionnaires_lot')
        .update(updatePayload)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'évaluation", {
        description: error.message,
      });
    },
  });

  // Recalculer le classement (client-side implementation)
  const recalculerClassementMutation = useMutation({
    mutationFn: async ({ passationId, lotId }: { passationId: string; lotId?: string | null }) => {
      // Fetch tous les soumissionnaires du perimetre
      let query = supabase
        .from('soumissionnaires_lot')
        .select('id, qualifie_technique, note_finale, statut')
        .eq('passation_marche_id', passationId);

      if (lotId) {
        query = query.eq('lot_marche_id', lotId);
      } else {
        query = query.is('lot_marche_id', null);
      }

      const { data: soums, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      if (!soums) return;

      // Filtrer les qualifies et trier par note_finale DESC
      const qualified = soums
        .filter((s) => s.qualifie_technique && s.note_finale !== null && s.statut !== 'elimine')
        .sort((a, b) => (b.note_finale ?? 0) - (a.note_finale ?? 0));

      const unqualified = soums.filter(
        (s) => !s.qualifie_technique || s.note_finale === null || s.statut === 'elimine'
      );

      // Mettre a jour les rangs des qualifies
      for (let i = 0; i < qualified.length; i++) {
        const newStatut = i === 0 ? 'retenu' : 'qualifie';
        const { error: upErr } = await supabase
          .from('soumissionnaires_lot')
          .update({ rang_classement: i + 1, statut: newStatut })
          .eq('id', qualified[i].id);
        if (upErr) throw upErr;
      }

      // Rang NULL pour les non qualifies
      for (const s of unqualified) {
        if (s.statut !== 'elimine') {
          const { error: upErr } = await supabase
            .from('soumissionnaires_lot')
            .update({ rang_classement: null })
            .eq('id', s.id);
          if (upErr) throw upErr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      toast.success('Classement recalculé');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors du recalcul du classement', {
        description: error.message,
      });
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('passation_marche').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passations-marche'] });
      queryClient.invalidateQueries({ queryKey: ['passation-counts'] });
      queryClient.invalidateQueries({ queryKey: ['eb-validees-pour-pm'] });
      toast.success('Passation supprimée');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la suppression', {
        description: error.message,
      });
    },
  });

  return {
    passations,
    ebValidees,
    counts,
    isLoading,
    error,
    refetch,
    // Pagination
    page,
    setPage,
    pageSize,
    setPageSize: handleSetPageSize,
    total,
    totalPages,
    statutFilter,
    setStatutFilter: handleSetStatutFilter,
    createPassation: createMutation.mutateAsync,
    updatePassation: updateMutation.mutateAsync,
    saveLots: saveLotsMutation.mutateAsync,
    saveSoumissionnaires: saveSoumissionnairesMutation.mutateAsync,
    submitPassation: submitMutation.mutateAsync,
    validatePassation: validateMutation.mutateAsync,
    rejectPassation: rejectMutation.mutateAsync,
    deferPassation: deferMutation.mutateAsync,
    deletePassation: deleteMutation.mutateAsync,
    publishPassation: publishMutation.mutateAsync,
    closePassation: closeMutation.mutateAsync,
    startEvaluationPassation: startEvaluationMutation.mutateAsync,
    proposeAttributionPassation: proposeAttributionMutation.mutateAsync,
    approvePassation: approveMutation.mutateAsync,
    rejectAttributionPassation: rejectAttributionMutation.mutateAsync,
    signPassation: signMutation.mutateAsync,
    addSoumissionnaire: addSoumissionnaireMutation.mutateAsync,
    updateSoumissionnaire: updateSoumissionnaireMutation.mutateAsync,
    deleteSoumissionnaire: deleteSoumissionnaireMutation.mutateAsync,
    evaluateSoumissionnaire: evaluateSoumissionnaireMutation.mutateAsync,
    recalculerClassement: recalculerClassementMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isSubmitting: submitMutation.isPending,
  };
}
