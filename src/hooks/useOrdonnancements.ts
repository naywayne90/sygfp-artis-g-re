import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";

// Étapes de validation workflow
export const VALIDATION_STEPS = [
  { order: 1, role: "SAF", label: "Service Administratif et Financier" },
  { order: 2, role: "CB", label: "Contrôleur Budgétaire" },
  { order: 3, role: "DAF", label: "Directeur Administratif et Financier" },
  { order: 4, role: "DG", label: "Directeur Général" },
];

export const MODES_PAIEMENT = [
  { value: "virement", label: "Virement bancaire" },
  { value: "cheque", label: "Chèque" },
  { value: "especes", label: "Espèces" },
  { value: "mobile_money", label: "Mobile Money" },
];

export interface OrdonnancementFormData {
  liquidation_id: string;
  beneficiaire: string;
  banque?: string;
  rib?: string;
  mode_paiement: string;
  montant: number;
  date_prevue_paiement?: string;
  observation?: string;
  objet: string;
}

export function useOrdonnancements() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  // Récupérer les ordonnancements
  const {
    data: ordonnancements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ordonnancements", exercice],
    queryFn: async () => {
      let query = supabase
        .from("ordonnancements")
        .select(`
          *,
          liquidation:budget_liquidations(
            id,
            numero,
            montant,
            engagement:budget_engagements(
              id,
              numero,
              objet,
              montant,
              fournisseur,
              budget_line:budget_lines(
                id,
                code,
                label,
                dotation_initiale
              )
            )
          ),
          created_by_profile:profiles!ordonnancements_created_by_fkey(
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (exercice) {
        query = query.eq("exercice", exercice);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!exercice,
  });

  // Récupérer les liquidations validées disponibles pour ordonnancement
  const { data: liquidationsValidees = [] } = useQuery({
    queryKey: ["liquidations-validees-pour-ordonnancement", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_liquidations")
        .select(`
          id,
          numero,
          montant,
          date_liquidation,
          engagement:budget_engagements(
            id,
            numero,
            objet,
            montant,
            fournisseur,
            budget_line:budget_lines(
              id,
              code,
              label
            )
          )
        `)
        .eq("statut", "valide")
        .eq("exercice", exercice)
        .order("date_liquidation", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!exercice,
  });

  // Calculer le restant à ordonnancer pour une liquidation
  const calculateOrdonnancementAvailability = async (liquidationId: string, currentOrdonnancementId?: string) => {
    // Récupérer la liquidation
    const { data: liquidation, error: liqError } = await supabase
      .from("budget_liquidations")
      .select("montant")
      .eq("id", liquidationId)
      .single();

    if (liqError) throw liqError;

    // Récupérer les ordonnancements existants pour cette liquidation
    let query = supabase
      .from("ordonnancements")
      .select("id, montant, statut")
      .eq("liquidation_id", liquidationId)
      .not("statut", "eq", "rejete");

    if (currentOrdonnancementId) {
      query = query.not("id", "eq", currentOrdonnancementId);
    }

    const { data: existingOrdonnancements, error: ordError } = await query;
    if (ordError) throw ordError;

    const totalOrdonnance = (existingOrdonnancements || []).reduce(
      (sum, ord) => sum + (ord.montant || 0),
      0
    );

    return {
      montantLiquide: liquidation?.montant || 0,
      ordonnancementsAnterieurs: totalOrdonnance,
      restantAOrdonnancer: (liquidation?.montant || 0) - totalOrdonnance,
    };
  };

  // Créer un ordonnancement
  const createOrdonnancement = useMutation({
    mutationFn: async (data: OrdonnancementFormData) => {
      // Vérifier la disponibilité
      const availability = await calculateOrdonnancementAvailability(data.liquidation_id);
      if (data.montant > availability.restantAOrdonnancer) {
        throw new Error(
          `Montant trop élevé. Restant à ordonnancer: ${availability.restantAOrdonnancer.toLocaleString("fr-FR")} FCFA`
        );
      }

      // Generate atomic sequence number
      const { data: seqData, error: seqError } = await supabase.rpc("get_next_sequence", {
        p_doc_type: "ORD",
        p_exercice: exercice || new Date().getFullYear(),
        p_direction_code: null,
        p_scope: "global",
      });

      if (seqError) throw seqError;
      if (!seqData || seqData.length === 0) throw new Error("Échec génération numéro");

      const numero = seqData[0].full_code;

      const { data: ordonnancement, error } = await supabase
        .from("ordonnancements")
        .insert({
          numero,
          liquidation_id: data.liquidation_id,
          beneficiaire: data.beneficiaire,
          banque: data.banque || null,
          rib: data.rib || null,
          mode_paiement: data.mode_paiement,
          montant: data.montant,
          objet: data.objet,
          date_prevue_paiement: data.date_prevue_paiement || null,
          observation: data.observation || null,
          statut: "brouillon",
          workflow_status: "brouillon",
          exercice: exercice,
        })
        .select()
        .single();

      if (error) throw error;
      return ordonnancement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  // Soumettre un ordonnancement
  const submitOrdonnancement = useMutation({
    mutationFn: async (id: string) => {
      // Créer les étapes de validation
      const validationSteps = VALIDATION_STEPS.map((step) => ({
        ordonnancement_id: id,
        step_order: step.order,
        role: step.role,
        status: step.order === 1 ? "pending" : "waiting",
      }));

      const { error: validationError } = await supabase
        .from("ordonnancement_validations")
        .insert(validationSteps);

      if (validationError) throw validationError;

      const { error } = await supabase
        .from("ordonnancements")
        .update({
          statut: "soumis",
          workflow_status: "en_validation",
          current_step: 1,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement soumis pour validation");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la soumission");
    },
  });

  // Valider une étape
  const validateStep = useMutation({
    mutationFn: async ({
      ordonnancementId,
      stepOrder,
      comments,
    }: {
      ordonnancementId: string;
      stepOrder: number;
      comments?: string;
    }) => {
      // Mettre à jour l'étape de validation
      const { error: validationError } = await supabase
        .from("ordonnancement_validations")
        .update({
          status: "validated",
          validated_at: new Date().toISOString(),
          comments,
        })
        .eq("ordonnancement_id", ordonnancementId)
        .eq("step_order", stepOrder);

      if (validationError) throw validationError;

      const nextStep = stepOrder + 1;
      const isLastStep = nextStep > VALIDATION_STEPS.length;

      if (isLastStep) {
        // Toutes les étapes validées
        const { error } = await supabase
          .from("ordonnancements")
          .update({
            statut: "valide",
            workflow_status: "valide",
            validated_at: new Date().toISOString(),
          })
          .eq("id", ordonnancementId);

        if (error) throw error;
      } else {
        // Passer à l'étape suivante
        const { error: nextError } = await supabase
          .from("ordonnancement_validations")
          .update({ status: "pending" })
          .eq("ordonnancement_id", ordonnancementId)
          .eq("step_order", nextStep);

        if (nextError) throw nextError;

        const { error } = await supabase
          .from("ordonnancements")
          .update({ current_step: nextStep })
          .eq("id", ordonnancementId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Étape validée avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la validation");
    },
  });

  // Rejeter un ordonnancement
  const rejectOrdonnancement = useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }) => {
      const { error } = await supabase
        .from("ordonnancements")
        .update({
          statut: "rejete",
          workflow_status: "rejete",
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement rejeté");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors du rejet");
    },
  });

  // Différer un ordonnancement
  const deferOrdonnancement = useMutation({
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
        .from("ordonnancements")
        .update({
          statut: "differe",
          workflow_status: "differe",
          motif_differe: motif,
          date_differe: new Date().toISOString(),
          deadline_correction: dateReprise || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement différé");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors du report");
    },
  });

  // Reprendre un ordonnancement différé
  const resumeOrdonnancement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ordonnancements")
        .update({
          statut: "soumis",
          workflow_status: "en_validation",
          motif_differe: null,
          date_differe: null,
          deadline_correction: null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement repris");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la reprise");
    },
  });

  // Supprimer un ordonnancement (brouillon uniquement)
  const deleteOrdonnancement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ordonnancements")
        .delete()
        .eq("id", id)
        .eq("statut", "brouillon");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success("Ordonnancement supprimé");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  // Récupérer les validations d'un ordonnancement
  const getValidations = async (ordonnancementId: string) => {
    const { data, error } = await supabase
      .from("ordonnancement_validations")
      .select(`
        *,
        validated_by_profile:profiles!ordonnancement_validations_validated_by_fkey(
          id,
          first_name,
          last_name,
          full_name
        )
      `)
      .eq("ordonnancement_id", ordonnancementId)
      .order("step_order", { ascending: true });

    if (error) throw error;
    return data;
  };

  return {
    ordonnancements,
    isLoading,
    error,
    liquidationsValidees,
    createOrdonnancement,
    submitOrdonnancement,
    validateStep,
    rejectOrdonnancement,
    deferOrdonnancement,
    resumeOrdonnancement,
    deleteOrdonnancement,
    calculateOrdonnancementAvailability,
    getValidations,
  };
}
