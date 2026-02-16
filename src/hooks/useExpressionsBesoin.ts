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
    budget_line?: { id: string; code: string; label: string } | null;
  } | null;
  dossier?: {
    id: string;
    numero: string;
    objet: string;
  } | null;
  creator?: { id: string; full_name: string | null } | null;
  validator?: { id: string; full_name: string | null } | null;
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

export const VALIDATION_STEPS = [
  { order: 1, role: 'CHEF_SERVICE', label: 'Chef de Service' },
  { order: 2, role: 'SOUS_DIRECTEUR', label: 'Sous-Directeur' },
  { order: 3, role: 'DIRECTEUR', label: 'Directeur' },
];

export const URGENCE_OPTIONS = [
  { value: 'normale', label: 'Normal' },
  { value: 'haute', label: 'Urgent' },
  { value: 'urgente', label: 'Très urgent' },
];

export function useExpressionsBesoin() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  // Fetch all expressions de besoin
  const {
    data: expressions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['expressions-besoin', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expressions_besoin')
        .select(
          `
          *,
          direction:directions(id, code, label, sigle),
          marche:marches!expressions_besoin_marche_id_fkey(
            id, numero, objet, montant, mode_passation,
            prestataire:prestataires(id, raison_sociale)
          ),
          imputation:imputations!expressions_besoin_imputation_id_fkey(
            id, reference, objet, montant, code_imputation,
            budget_line:budget_lines(id, code, label)
          ),
          attachments:expression_besoin_attachments(
            id, document_type, file_name, file_path, file_size, file_type, uploaded_by, created_at
          ),
          dossier:dossiers(id, numero, objet),
          creator:profiles!expressions_besoin_created_by_fkey(id, full_name),
          validator:profiles!expressions_besoin_validated_by_fkey(id, full_name),
          validations:expression_besoin_validations(
            id, expression_besoin_id, step_order, role, status, validated_by, validated_at, comments,
            validator:profiles!expression_besoin_validations_validated_by_fkey(id, full_name)
          )
        `
        )
        .eq('exercice', exercice)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ExpressionBesoin[];
    },
  });

  // Fetch imputations validées disponibles pour créer une EB
  const { data: imputationsValidees = [] } = useQuery({
    queryKey: ['imputations-validees-pour-eb', exercice],
    queryFn: async () => {
      // Récupérer les imputations validées qui n'ont pas encore d'EB
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

      // Filtrer pour exclure celles qui ont déjà une EB
      const { data: existingEBs } = await supabase
        .from('expressions_besoin')
        .select('imputation_id')
        .not('imputation_id', 'is', null);

      const usedImputationIds = new Set(existingEBs?.map((eb) => eb.imputation_id) || []);

      return imputations?.filter((imp) => !usedImputationIds.has(imp.id)) || [];
    },
    enabled: !!exercice,
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
  });

  // Fetch marchés attribués (ready for execution) without expressions
  const { data: marchesValides = [] } = useQuery({
    queryKey: ['marches-valides-pour-expression', exercice],
    queryFn: async () => {
      // Get marchés with statuses that allow expressions de besoin
      // Statuts valides: attribue, valide, validé, en_cours, en_execution
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
  });

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
      // Generate atomic sequence number
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
      queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
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

      // JSON.parse/stringify convertit ExpressionBesoinLigne[] en Json compatible Supabase
      const articlesJson = JSON.parse(JSON.stringify(liste_articles));

      const { data: result, error } = await supabase
        .from('expressions_besoin')
        .insert({
          ...rest,
          liste_articles: articlesJson,
          exercice: exercice || new Date().getFullYear(),
          statut: 'brouillon',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
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
      queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
      toast.success('Expression de besoin mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  // Submit expression (génère un numéro si absent)
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      // Vérifier si un numéro existe déjà
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

      // Générer le numéro si absent
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
        // Format: ARTI03MMYYNNNN (03 = code étape EB)
        updateData.numero = `ARTI03${mm}${yy}${nnnn}`;
      }

      const { error } = await supabase.from('expressions_besoin').update(updateData).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
      toast.success('Expression de besoin soumise');
    },
    onError: (error) => {
      toast.error('Erreur lors de la soumission: ' + error.message);
    },
  });

  // Validate expression (avance dans le workflow ou valide définitivement)
  const validateMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      // Récupérer l'expression actuelle
      const { data: expression, error: fetchError } = await supabase
        .from('expressions_besoin')
        .select('current_validation_step')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const currentStep = expression.current_validation_step || 1;
      const nextStep = currentStep + 1;
      const isLastStep = nextStep > VALIDATION_STEPS.length;

      // Enregistrer la validation de l'étape actuelle
      await supabase.from('expression_besoin_validations').insert({
        expression_besoin_id: id,
        step_order: currentStep,
        role: VALIDATION_STEPS.find((s) => s.order === currentStep)?.role || 'UNKNOWN',
        status: 'approved',
        validated_at: new Date().toISOString(),
        comments: comments || null,
      });

      // Mettre à jour l'expression
      const updateData: Record<string, string | number | null> = {
        current_validation_step: isLastStep ? currentStep : nextStep,
        rejection_reason: null,
        date_differe: null,
        motif_differe: null,
      };

      if (isLastStep) {
        updateData.statut = 'valide';
        updateData.validated_at = new Date().toISOString();
      }

      const { error } = await supabase.from('expressions_besoin').update(updateData).eq('id', id);

      if (error) throw error;

      return { isLastStep };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
      if (result.isLastStep) {
        toast.success('Expression de besoin validée définitivement !');
      } else {
        toast.success("Validation effectuée, transmis à l'étape suivante");
      }
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
      queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
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
      queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
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
      queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
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
      queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
      toast.success('Expression de besoin supprimée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression: ' + error.message);
    },
  });

  // Mark expression as satisfied (passation marché créée)
  const satisfyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expressions_besoin')
        .update({
          statut: 'satisfaite',
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expressions-besoin'] });
      toast.success('Expression de besoin marquée comme satisfaite');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Filter helpers
  const expressionsAValider = expressions.filter((e) => e.statut === 'soumis');
  const expressionsValidees = expressions.filter((e) => e.statut === 'valide');
  const expressionsRejetees = expressions.filter((e) => e.statut === 'rejete');
  const expressionsDifferees = expressions.filter((e) => e.statut === 'differe');
  const expressionsSatisfaites = expressions.filter((e) => e.statut === 'satisfaite');
  const expressionsBrouillon = expressions.filter((e) => e.statut === 'brouillon');

  return {
    expressions,
    expressionsAValider,
    expressionsValidees,
    expressionsRejetees,
    expressionsDifferees,
    expressionsSatisfaites,
    expressionsBrouillon,
    marchesValides,
    notesImputees,
    imputationsValidees,
    isLoading,
    error,
    createExpression: createMutation.mutateAsync,
    createFromImputation: createFromImputationMutation.mutateAsync,
    updateExpression: updateMutation.mutateAsync,
    submitExpression: submitMutation.mutateAsync,
    validateExpression: validateMutation.mutateAsync,
    rejectExpression: rejectMutation.mutateAsync,
    deferExpression: deferMutation.mutateAsync,
    resumeExpression: resumeMutation.mutateAsync,
    deleteExpression: deleteMutation.mutateAsync,
    satisfyExpression: satisfyMutation.mutateAsync,
    isCreating: createMutation.isPending || createFromImputationMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
  };
}
