import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useExercice } from '@/contexts/ExerciceContext';

export interface ExpressionBesoinLigne {
  designation: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  prix_total: number;
  categorie?: string;
  ordre?: number;
  /** @deprecated Ancien champ, utiliser `designation` */
  article?: string;
}

export interface ExpressionBesoin {
  id: string;
  numero: string | null;
  objet: string;
  description: string | null;
  justification: string | null;
  specifications: string | null;
  calendrier_debut: string | null;
  calendrier_fin: string | null;
  montant_estime: number | null;
  quantite: number | null;
  unite: string | null;
  urgence: string | null;
  statut: string | null;
  numero_lot: number | null;
  intitule_lot: string | null;
  exercice: number | null;
  marche_id: string | null;
  imputation_id: string | null;
  dossier_id: string | null;
  direction_id: string | null;
  liste_articles: ExpressionBesoinLigne[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  validated_at: string | null;
  validated_by: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  date_differe: string | null;
  motif_differe: string | null;
  differe_by: string | null;
  deadline_correction: string | null;
  current_validation_step: number | null;
  validation_status: string | null;
  // Nouveaux champs
  lieu_livraison: string | null;
  delai_livraison: string | null;
  contact_livraison: string | null;
  // Joined data
  direction?: { id: string; code: string; label: string; sigle: string | null } | null;
  marche?: {
    id: string;
    numero: string | null;
    objet: string;
    montant: number;
    mode_passation: string;
    prestataire?: {
      id: string;
      raison_sociale: string;
    } | null;
  } | null;
  imputation?: {
    id: string;
    reference: string | null;
    objet: string;
    montant: number | null;
    code_imputation: string | null;
    note_aef_id?: string | null;
    budget_line?: { id: string; code: string; label: string } | null;
  } | null;
  dossier?: {
    id: string;
    numero: string;
    objet: string;
  } | null;
  creator?: { id: string; full_name: string | null } | null;
  validator?: { id: string; full_name: string | null } | null;
  verifier?: { id: string; full_name: string | null } | null;
  validations?: ExpressionBesoinValidation[];
  attachments?: ExpressionBesoinAttachment[];
}

export interface ExpressionBesoinAttachment {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ExpressionBesoinValidation {
  id: string;
  expression_besoin_id: string;
  step_order: number;
  role: string;
  status: string | null;
  validated_by: string | null;
  validated_at: string | null;
  comments: string | null;
  validator?: { id: string; full_name: string | null } | null;
}

export interface MarcheValide {
  id: string;
  numero: string | null;
  objet: string;
  montant: number;
  mode_passation: string;
  prestataire?: {
    id: string;
    raison_sociale: string;
  } | null;
}

// Nouveau workflow : 2 étapes fonctionnelles
export const VALIDATION_STEPS = [
  { order: 1, role: 'CB', label: 'Vérification CB' },
  { order: 2, role: 'DG', label: 'Validation DG/DAAF' },
];

// Legacy : ancien workflow 3 niveaux hiérarchiques (pour les 189 EB existantes)
export const LEGACY_VALIDATION_STEPS = [
  { order: 1, role: 'CHEF_SERVICE', label: 'Chef de Service' },
  { order: 2, role: 'SOUS_DIRECTEUR', label: 'Sous-Directeur' },
  { order: 3, role: 'DIRECTEUR', label: 'Directeur' },
];

export const URGENCE_OPTIONS = [
  { value: 'normale', label: 'Normal' },
  { value: 'haute', label: 'Urgent' },
  { value: 'urgente', label: 'Très urgent' },
];

export const CATEGORIES_ARTICLES = [
  { value: 'fournitures_bureau', label: 'Fournitures de bureau' },
  { value: 'equipement_informatique', label: 'Équipement informatique' },
  { value: 'materiel_technique', label: 'Matériel technique' },
  { value: 'services_prestations', label: 'Services & prestations' },
  { value: 'travaux', label: 'Travaux' },
  { value: 'autre', label: 'Autre' },
] as const;

export const UNITES = [
  { value: 'piece', label: 'Pièce(s)' },
  { value: 'kg', label: 'Kilogramme(s)' },
  { value: 'm', label: 'Mètre(s)' },
  { value: 'm2', label: 'm²' },
  { value: 'm3', label: 'm³' },
  { value: 'litre', label: 'Litre(s)' },
  { value: 'lot', label: 'Lot(s)' },
  { value: 'forfait', label: 'Forfait' },
  { value: 'boite', label: 'Boîte(s)' },
  { value: 'carton', label: 'Carton(s)' },
  { value: 'ramette', label: 'Ramette(s)' },
] as const;

// ---------------------------------------------------------------------------
// Filters interface
// ---------------------------------------------------------------------------

export interface ExpressionBesoinFilters {
  statut?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Counts type
// ---------------------------------------------------------------------------

export interface ExpressionBesoinCounts {
  brouillon: number;
  soumis: number;
  verifie: number;
  valide: number;
  rejete: number;
  differe: number;
  satisfaite: number;
  total: number;
}

const EMPTY_COUNTS: ExpressionBesoinCounts = {
  brouillon: 0,
  soumis: 0,
  verifie: 0,
  valide: 0,
  rejete: 0,
  differe: 0,
  satisfaite: 0,
  total: 0,
};

// ---------------------------------------------------------------------------
// Invalidation helper — called from every mutation onSuccess
// ---------------------------------------------------------------------------

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
  queryClient.invalidateQueries({ queryKey: ['expressions-besoin-counts'] });
  queryClient.invalidateQueries({ queryKey: ['expression-besoin-detail'] });
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

export function useExpressionsBesoin(filters?: ExpressionBesoinFilters) {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 50;

  // =========================================================================
  // Main paginated query — LEAN select (no liste_articles, attachments, validations)
  // =========================================================================

  const {
    data: queryResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['expressions-besoin', exercice, filters],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('expressions_besoin')
        .select(
          `
          id, numero, objet, montant_estime, urgence, statut, exercice,
          created_at, submitted_at, validated_at, verified_at, verified_by,
          direction_id, marche_id, imputation_id, dossier_id,
          rejection_reason, date_differe, motif_differe, deadline_correction,
          direction:directions(id, code, label, sigle),
          marche:marches!expressions_besoin_marche_id_fkey(id, numero),
          creator:profiles!expressions_besoin_created_by_fkey(id, full_name)
        `,
          { count: 'exact' }
        )
        .eq('exercice', exercice || new Date().getFullYear())
        .order('created_at', { ascending: false })
        .range(from, to);

      // Server-side status filter
      if (filters?.statut) {
        query = query.eq('statut', filters.statut);
      }

      // Server-side search filter
      if (filters?.search?.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(`objet.ilike.${term},numero.ilike.${term}`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        items: data as unknown as ExpressionBesoin[],
        totalCount: count ?? 0,
      };
    },
    enabled: !!exercice,
    staleTime: 30_000,
  });

  const expressions = queryResult?.items ?? [];
  const totalCount = queryResult?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // =========================================================================
  // Counts query (pattern from useImputations.ts)
  // =========================================================================

  const { data: counts = EMPTY_COUNTS } = useQuery({
    queryKey: ['expressions-besoin-counts', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expressions_besoin')
        .select('statut')
        .eq('exercice', exercice || new Date().getFullYear());

      if (error) throw error;

      const result: ExpressionBesoinCounts = { ...EMPTY_COUNTS };
      for (const row of data || []) {
        const s = (row.statut || 'brouillon') as keyof Omit<ExpressionBesoinCounts, 'total'>;
        if (s in result) {
          result[s]++;
        }
        result.total++;
      }
      return result;
    },
    enabled: !!exercice,
    staleTime: 30_000,
  });

  // =========================================================================
  // Imputations validées (for creating EBs)
  // =========================================================================

  const { data: imputationsValidees = [] } = useQuery({
    queryKey: ['imputations-validees-pour-eb', exercice],
    queryFn: async () => {
      const { data: imputations, error } = await supabase
        .from('imputations')
        .select(
          `
          id, reference, objet, montant, code_imputation,
          direction_id, dossier_id,
          direction:directions(id, label, sigle),
          budget_line:budget_lines(id, code, label)
        `
        )
        .eq('statut', 'valide')
        .eq('exercice', exercice || new Date().getFullYear())
        .order('validated_at', { ascending: false });

      if (error) throw error;

      const { data: existingEBs } = await supabase
        .from('expressions_besoin')
        .select('imputation_id')
        .not('imputation_id', 'is', null);

      const usedImputationIds = new Set(existingEBs?.map((eb) => eb.imputation_id) || []);

      return imputations?.filter((imp) => !usedImputationIds.has(imp.id)) || [];
    },
    enabled: !!exercice,
    staleTime: 30_000,
  });

  // Fetch notes imputées disponibles pour créer une EB
  const { data: notesImputees = [] } = useQuery({
    queryKey: ['notes-imputees-disponibles', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_dg')
        .select(
          `
          id, numero, objet, montant_estime, budget_line_id, direction_id,
          direction:directions(label, sigle),
          budget_line:budget_lines(id, code, label)
        `
        )
        .eq('statut', 'impute')
        .eq('exercice', exercice || new Date().getFullYear())
        .order('imputed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
    staleTime: 30_000,
  });

  // Fetch marchés attribués
  const { data: marchesValides = [] } = useQuery({
    queryKey: ['marches-valides-pour-expression', exercice],
    queryFn: async () => {
      const { data: marches, error } = await supabase
        .from('marches')
        .select(
          `
          id, numero, objet, montant, mode_passation,
          prestataire:prestataires(id, raison_sociale)
        `
        )
        .in('statut', ['attribue', 'valide', 'validé', 'en_cours', 'en_execution'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return marches as MarcheValide[];
    },
    staleTime: 30_000,
  });

  // =========================================================================
  // Mutations
  // =========================================================================

  // Create expression de besoin (from marché)
  const createMutation = useMutation({
    mutationFn: async (data: {
      marche_id: string;
      objet: string;
      description: string | null;
      justification: string | null;
      specifications: string | null;
      calendrier_debut: string | null;
      calendrier_fin: string | null;
      montant_estime: number | null;
      urgence: string;
      numero_lot?: number | null;
      intitule_lot?: string | null;
    }) => {
      const { data: seqData, error: seqError } = await supabase.rpc('get_next_sequence', {
        p_doc_type: 'EB',
        p_exercice: exercice || new Date().getFullYear(),
        p_direction_code: null,
        p_scope: 'global',
      });

      if (seqError) throw seqError;
      if (!seqData || seqData.length === 0) throw new Error('Échec génération numéro');

      const numero = seqData[0].full_code;

      const { data: result, error } = await supabase
        .from('expressions_besoin')
        .insert({
          ...data,
          numero,
          exercice,
          statut: 'brouillon',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Expression de besoin créée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création: ' + error.message);
    },
  });

  // Create expression de besoin from imputation (with articles)
  const createFromImputationMutation = useMutation({
    mutationFn: async (data: {
      imputation_id: string;
      dossier_id: string | null;
      direction_id: string | null;
      objet: string;
      description: string | null;
      justification: string | null;
      specifications: string | null;
      calendrier_debut: string | null;
      calendrier_fin: string | null;
      montant_estime: number | null;
      urgence: string;
      lieu_livraison: string | null;
      delai_livraison: string | null;
      contact_livraison: string | null;
      liste_articles: ExpressionBesoinLigne[];
    }) => {
      const { liste_articles, ...rest } = data;
      const articlesJson = JSON.parse(JSON.stringify(liste_articles));
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const { data: result, error } = await supabase
        .from('expressions_besoin')
        .insert({
          ...rest,
          liste_articles: articlesJson,
          exercice: exercice || new Date().getFullYear(),
          statut: 'brouillon',
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      queryClient.invalidateQueries({ queryKey: ['imputations-validees-pour-eb'] });
      toast.success('Expression de besoin créée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création: ' + error.message);
    },
  });

  // Update expression de besoin
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<ExpressionBesoin>) => {
      const { error } = await supabase
        .from('expressions_besoin')
        .update(data as Record<string, unknown>)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Expression de besoin mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  // Submit expression (génère un numéro si absent)
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: existing, error: fetchError } = await supabase
        .from('expressions_besoin')
        .select('numero')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const updateData: Record<string, unknown> = {
        statut: 'soumis',
        submitted_at: new Date().toISOString(),
      };

      if (!existing.numero) {
        const { data: seqData, error: seqError } = await supabase.rpc('get_next_sequence', {
          p_doc_type: 'EB',
          p_exercice: exercice || new Date().getFullYear(),
          p_direction_code: null,
          p_scope: 'global',
        });

        if (seqError) throw seqError;
        if (!seqData || seqData.length === 0) throw new Error('Échec génération numéro');

        const seq = seqData[0];
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const nnnn = seq.number_padded || String(seq.number_raw).padStart(4, '0');
        updateData.numero = `ARTI03${mm}${yy}${nnnn}`;
      }

      const { error } = await supabase.from('expressions_besoin').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Expression de besoin soumise');
    },
    onError: (error) => {
      toast.error('Erreur lors de la soumission: ' + error.message);
    },
  });

  // Verify expression (CB vérifie couverture budgétaire : soumis -> verifie)
  const verifyMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      // Enregistrer la validation CB (step 1)
      await supabase.from('expression_besoin_validations').insert({
        expression_besoin_id: id,
        step_order: 1,
        role: 'CB',
        status: 'approved',
        validated_at: new Date().toISOString(),
        comments: comments || null,
      });

      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('expressions_besoin')
        .update({
          statut: 'verifie',
          verified_at: new Date().toISOString(),
          verified_by: userId,
          current_validation_step: 2,
          rejection_reason: null,
          date_differe: null,
          motif_differe: null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Couverture budgétaire vérifiée, transmis au DG/DAAF');
    },
    onError: (error) => {
      toast.error('Erreur lors de la vérification: ' + error.message);
    },
  });

  // Validate expression (DG/DAAF valide : verifie -> valide)
  const validateMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      // Enregistrer la validation DG/DAAF (step 2)
      await supabase.from('expression_besoin_validations').insert({
        expression_besoin_id: id,
        step_order: 2,
        role: 'DG',
        status: 'approved',
        validated_at: new Date().toISOString(),
        comments: comments || null,
      });

      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Fetch EB details for QR code registration
      const { data: ebData } = await supabase
        .from('expressions_besoin')
        .select('numero, objet, direction_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('expressions_besoin')
        .update({
          statut: 'valide',
          validated_at: new Date().toISOString(),
          validated_by: userId,
          current_validation_step: 2,
          rejection_reason: null,
          date_differe: null,
          motif_differe: null,
        })
        .eq('id', id);

      if (error) throw error;

      // Register QR code document for anti-falsification
      try {
        await supabase.rpc('register_generated_document', {
          p_entity_type: 'expressions_besoin',
          p_entity_id: id,
          p_type_document: 'pdf_expression_besoin',
          p_reference: ebData?.numero || id,
          p_nom_fichier: `ARTI_EB_${ebData?.numero || 'UNKNOWN'}.pdf`,
          p_exercice: exercice || new Date().getFullYear(),
          p_direction_id: ebData?.direction_id || undefined,
          p_metadata: { validated_by: userId, objet: ebData?.objet } as unknown as Record<
            string,
            unknown
          >,
        });
      } catch (qrError) {
        // QR registration failure should not block validation
        console.warn('[EB Validate] QR registration failed:', qrError);
      }
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Expression de besoin validée définitivement !');
    },
    onError: (error) => {
      toast.error('Erreur lors de la validation: ' + error.message);
    },
  });

  // Reject expression
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('expressions_besoin')
        .update({
          statut: 'rejete',
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Expression de besoin rejetée');
    },
    onError: (error) => {
      toast.error('Erreur lors du rejet: ' + error.message);
    },
  });

  // Defer expression
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
        .from('expressions_besoin')
        .update({
          statut: 'differe',
          motif_differe: motif,
          date_differe: new Date().toISOString(),
          deadline_correction: dateReprise || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Expression de besoin différée');
    },
    onError: (error) => {
      toast.error('Erreur lors du report: ' + error.message);
    },
  });

  // Resume deferred expression
  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expressions_besoin')
        .update({
          statut: 'soumis',
          date_differe: null,
          motif_differe: null,
          deadline_correction: null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Expression de besoin reprise');
    },
    onError: (error) => {
      toast.error('Erreur lors de la reprise: ' + error.message);
    },
  });

  // Delete expression
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expressions_besoin').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Expression de besoin supprimée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression: ' + error.message);
    },
  });

  // Update articles (JSONB) on an existing EB
  const updateArticlesMutation = useMutation({
    mutationFn: async ({ id, articles }: { id: string; articles: ExpressionBesoinLigne[] }) => {
      const articlesJson = JSON.parse(JSON.stringify(articles));
      const { error } = await supabase
        .from('expressions_besoin')
        .update({ liste_articles: articlesJson })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Articles mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour des articles: ' + error.message);
    },
  });

  // Mark expression as satisfied
  const satisfyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expressions_besoin')
        .update({ statut: 'satisfaite' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Expression de besoin marquée comme satisfaite');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    expressions,
    totalCount,
    totalPages,
    counts,
    imputationsValidees,
    marchesValides,
    notesImputees,
    isLoading,
    error,
    // Mutations
    createExpression: createMutation.mutateAsync,
    createFromImputation: createFromImputationMutation.mutateAsync,
    updateExpression: updateMutation.mutateAsync,
    submitExpression: submitMutation.mutateAsync,
    verifyExpression: verifyMutation.mutateAsync,
    validateExpression: validateMutation.mutateAsync,
    rejectExpression: rejectMutation.mutateAsync,
    deferExpression: deferMutation.mutateAsync,
    resumeExpression: resumeMutation.mutateAsync,
    deleteExpression: deleteMutation.mutateAsync,
    satisfyExpression: satisfyMutation.mutateAsync,
    updateArticles: updateArticlesMutation.mutateAsync,
    isUpdatingArticles: updateArticlesMutation.isPending,
    isCreating: createMutation.isPending || createFromImputationMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isVerifying: verifyMutation.isPending,
    isValidating: validateMutation.isPending,
  };
}
