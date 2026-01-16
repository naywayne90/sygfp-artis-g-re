import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useExercice } from "@/contexts/ExerciceContext";

export interface PassationMarche {
  id: string;
  reference: string | null;
  dossier_id: string | null;
  expression_besoin_id: string | null;
  mode_passation: string;
  type_procedure: string | null;
  seuil_montant: string | null;
  prestataires_sollicites: any[];
  analyse_offres: any;
  criteres_evaluation: any[];
  pv_ouverture: string | null;
  pv_evaluation: string | null;
  rapport_analyse: string | null;
  decision: string | null;
  prestataire_retenu_id: string | null;
  montant_retenu: number | null;
  motif_selection: string | null;
  statut: string;
  exercice: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  validated_at: string | null;
  rejection_reason: string | null;
  motif_differe: string | null;
  date_reprise: string | null;
  pieces_jointes: any[];
  // Joined
  expression_besoin?: {
    id: string;
    numero: string | null;
    objet: string;
    montant_estime: number | null;
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
  direction?: { id: string; label: string; sigle: string | null } | null;
}

export const MODES_PASSATION = [
  { value: "gre_a_gre", label: "Gré à Gré" },
  { value: "consultation", label: "Consultation restreinte" },
  { value: "appel_offres_ouvert", label: "Appel d'offres ouvert" },
  { value: "appel_offres_restreint", label: "Appel d'offres restreint" },
  { value: "entente_directe", label: "Entente directe" },
];

export const STATUTS = {
  brouillon: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  soumis: { label: "Soumis", color: "bg-blue-100 text-blue-700" },
  en_analyse: { label: "En analyse", color: "bg-yellow-100 text-yellow-700" },
  valide: { label: "Validé", color: "bg-green-100 text-green-700" },
  rejete: { label: "Rejeté", color: "bg-red-100 text-red-700" },
  differe: { label: "Différé", color: "bg-orange-100 text-orange-700" },
};

export function usePassationsMarche() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  // Fetch all passations
  const { data: passations = [], isLoading, error, refetch } = useQuery({
    queryKey: ["passations-marche", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("passation_marche")
        .select(`
          *,
          expression_besoin:expressions_besoin(id, numero, objet, montant_estime),
          dossier:dossiers(id, numero, objet),
          prestataire_retenu:prestataires!passation_marche_prestataire_retenu_id_fkey(id, raison_sociale),
          creator:profiles!passation_marche_created_by_fkey(id, full_name)
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PassationMarche[];
    },
    enabled: !!exercice,
  });

  // Fetch EB validées disponibles
  const { data: ebValidees = [] } = useQuery({
    queryKey: ["eb-validees-pour-pm", exercice],
    queryFn: async () => {
      const { data: ebs, error } = await supabase
        .from("expressions_besoin")
        .select(`
          id, numero, objet, montant_estime, dossier_id, direction_id,
          direction:directions(id, label, sigle)
        `)
        .eq("statut", "validé")
        .eq("exercice", exercice || new Date().getFullYear())
        .order("validated_at", { ascending: false });

      if (error) throw error;

      // Exclure les EB déjà utilisées
      const { data: usedEBs } = await supabase
        .from("passation_marche")
        .select("expression_besoin_id")
        .not("expression_besoin_id", "is", null);

      const usedIds = new Set(usedEBs?.map((p) => p.expression_besoin_id) || []);
      return ebs?.filter((eb) => !usedIds.has(eb.id)) || [];
    },
    enabled: !!exercice,
  });

  // Counts par statut
  const counts = {
    brouillon: passations.filter((p) => p.statut === "brouillon").length,
    soumis: passations.filter((p) => p.statut === "soumis").length,
    en_analyse: passations.filter((p) => p.statut === "en_analyse").length,
    valide: passations.filter((p) => p.statut === "valide").length,
    rejete: passations.filter((p) => p.statut === "rejete").length,
    differe: passations.filter((p) => p.statut === "differe").length,
  };

  // Create
  const createMutation = useMutation({
    mutationFn: async (data: {
      expression_besoin_id: string;
      mode_passation: string;
      type_procedure?: string;
      prestataires_sollicites?: any[];
      criteres_evaluation?: any[];
    }) => {
      // Récupérer le dossier_id depuis l'EB
      const { data: eb } = await supabase
        .from("expressions_besoin")
        .select("dossier_id")
        .eq("id", data.expression_besoin_id)
        .single();

      const { data: result, error } = await supabase
        .from("passation_marche")
        .insert({
          ...data,
          dossier_id: eb?.dossier_id || null,
          exercice: exercice || new Date().getFullYear(),
          statut: "brouillon",
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passations-marche"] });
      queryClient.invalidateQueries({ queryKey: ["eb-validees-pour-pm"] });
      toast.success("Passation de marché créée");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<PassationMarche>) => {
      const { error } = await supabase
        .from("passation_marche")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passations-marche"] });
      toast.success("Mise à jour effectuée");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Submit
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("passation_marche")
        .update({
          statut: "soumis",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passations-marche"] });
      toast.success("Passation soumise pour validation");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Validate
  const validateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("passation_marche")
        .update({
          statut: "valide",
          validated_at: new Date().toISOString(),
          rejection_reason: null,
          motif_differe: null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passations-marche"] });
      toast.success("Passation validée");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Reject
  const rejectMutation = useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
      const { error } = await supabase
        .from("passation_marche")
        .update({
          statut: "rejete",
          rejected_at: new Date().toISOString(),
          rejection_reason: motif,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passations-marche"] });
      toast.success("Passation rejetée");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Defer
  const deferMutation = useMutation({
    mutationFn: async ({ id, motif, dateReprise }: { id: string; motif: string; dateReprise?: string }) => {
      const { error } = await supabase
        .from("passation_marche")
        .update({
          statut: "differe",
          differed_at: new Date().toISOString(),
          motif_differe: motif,
          date_reprise: dateReprise || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passations-marche"] });
      toast.success("Passation différée");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("passation_marche")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passations-marche"] });
      queryClient.invalidateQueries({ queryKey: ["eb-validees-pour-pm"] });
      toast.success("Passation supprimée");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    passations,
    ebValidees,
    counts,
    isLoading,
    error,
    refetch,
    createPassation: createMutation.mutateAsync,
    updatePassation: updateMutation.mutateAsync,
    submitPassation: submitMutation.mutateAsync,
    validatePassation: validateMutation.mutateAsync,
    rejectPassation: rejectMutation.mutateAsync,
    deferPassation: deferMutation.mutateAsync,
    deletePassation: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isSubmitting: submitMutation.isPending,
  };
}
