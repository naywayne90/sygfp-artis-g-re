import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export const TYPES_CONTRAT = [
  "Marché public",
  "Contrat de prestation",
  "Contrat de fourniture",
  "Contrat de travaux",
  "Convention",
  "Accord-cadre",
  "Bon de commande",
];

export const STATUTS_CONTRAT = [
  { value: "brouillon", label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  { value: "en_negociation", label: "En négociation", color: "bg-blue-100 text-blue-800" },
  { value: "signe", label: "Signé", color: "bg-green-100 text-green-800" },
  { value: "en_cours", label: "En cours", color: "bg-primary/20 text-primary" },
  { value: "termine", label: "Terminé", color: "bg-muted text-muted-foreground" },
  { value: "resilie", label: "Résilié", color: "bg-red-100 text-red-800" },
  { value: "suspendu", label: "Suspendu", color: "bg-yellow-100 text-yellow-800" },
];

export const TYPES_AVENANT = [
  "Prolongation de délai",
  "Augmentation de montant",
  "Diminution de montant",
  "Modification de prestations",
  "Résiliation",
];

export interface MarcheLot {
  id: string;
  marche_id: string;
  numero_lot: number;
  intitule: string;
  description: string | null;
  montant_estime: number | null;
  montant_attribue: number | null;
  attributaire_id: string | null;
  statut: string;
  date_attribution: string | null;
  created_at: string;
  attributaire?: { raison_sociale: string } | null;
}

export interface Soumission {
  id: string;
  lot_id: string;
  prestataire_id: string;
  date_soumission: string;
  montant_offre: number;
  delai_execution: number | null;
  note_technique: number | null;
  note_financiere: number | null;
  note_globale: number | null;
  classement: number | null;
  statut: string;
  motif_rejet: string | null;
  observations: string | null;
  created_at: string;
  prestataire?: { raison_sociale: string };
}

export interface Contrat {
  id: string;
  numero: string;
  marche_id: string | null;
  lot_id: string | null;
  prestataire_id: string;
  type_contrat: string;
  objet: string;
  montant_initial: number;
  montant_actuel: number | null;
  date_signature: string | null;
  date_notification: string | null;
  date_debut: string | null;
  date_fin: string | null;
  delai_execution: number | null;
  statut: string;
  dossier_id: string | null;
  engagement_id: string | null;
  exercice: number;
  created_by: string | null;
  created_at: string;
  prestataire?: { raison_sociale: string };
  marche?: { numero: string; objet: string } | null;
}

export interface Avenant {
  id: string;
  contrat_id: string;
  numero_avenant: number;
  objet: string;
  type_avenant: string;
  montant_modification: number | null;
  nouveau_montant: number | null;
  nouveau_delai: number | null;
  nouvelle_date_fin: string | null;
  date_signature: string | null;
  statut: string;
  created_at: string;
}

// Standalone hooks for parameterized queries (must be called at top level)
export function useContratLots(marcheId: string | null) {
  return useQuery({
    queryKey: ["marche-lots", marcheId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marche_lots" as any)
        .select("*")
        .eq("marche_id", marcheId!)
        .order("numero_lot");
      if (error) throw error;
      return (data || []) as unknown as MarcheLot[];
    },
    enabled: !!marcheId,
  });
}

export function useContratSoumissions(lotId: string | null) {
  return useQuery({
    queryKey: ["soumissions", lotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("soumissions" as any)
        .select("*")
        .eq("lot_id", lotId!)
        .order("classement", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Soumission[];
    },
    enabled: !!lotId,
  });
}

export function useContratAvenants(contratId: string | null) {
  return useQuery({
    queryKey: ["avenants", contratId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avenants" as any)
        .select("*")
        .eq("contrat_id", contratId!)
        .order("numero_avenant");
      if (error) throw error;
      return (data || []) as unknown as Avenant[];
    },
    enabled: !!contratId,
  });
}

export function useContrats() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  // Contrats
  const contrats = useQuery({
    queryKey: ["contrats", exercice],
    queryFn: async () => {
      if (!exercice) return [];
      const { data, error } = await supabase
        .from("contrats" as any)
        .select("*")
        .eq("exercice", exercice)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Contrat[];
    },
    enabled: !!exercice,
  });

  // Créer contrat
  const createContrat = useMutation({
    mutationFn: async (contrat: Omit<Contrat, "id" | "numero" | "created_at" | "prestataire" | "marche">) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Generate atomic sequence number
      const { data: seqData, error: seqError } = await supabase.rpc("get_next_sequence", {
        p_doc_type: "CONTRAT",
        p_exercice: exercice || new Date().getFullYear(),
        p_direction_code: null,
        p_scope: "global",
      });

      if (seqError) throw seqError;
      if (!seqData || seqData.length === 0) throw new Error("Échec génération numéro");

      const numero = seqData[0].full_code;

      const { data, error } = await supabase
        .from("contrats" as any)
        .insert([{
          numero,
          prestataire_id: contrat.prestataire_id,
          type_contrat: contrat.type_contrat,
          objet: contrat.objet,
          montant_initial: contrat.montant_initial,
          montant_actuel: contrat.montant_initial,
          marche_id: contrat.marche_id,
          lot_id: contrat.lot_id,
          date_signature: contrat.date_signature,
          date_notification: contrat.date_notification,
          date_debut: contrat.date_debut,
          date_fin: contrat.date_fin,
          delai_execution: contrat.delai_execution,
          statut: contrat.statut || "brouillon",
          dossier_id: contrat.dossier_id,
          engagement_id: contrat.engagement_id,
          exercice,
          created_by: user?.id,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
      toast.success("Contrat créé");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Modifier contrat
  const updateContrat = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contrat> & { id: string }) => {
      const { data, error } = await supabase
        .from("contrats" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
      toast.success("Contrat modifié");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Créer lot
  const createLot = useMutation({
    mutationFn: async (lot: { marche_id: string; numero_lot: number; intitule: string; description?: string; montant_estime?: number }) => {
      const { data, error } = await supabase
        .from("marche_lots" as any)
        .insert([lot])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["marche-lots", variables.marche_id] });
      toast.success("Lot créé");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Créer soumission
  const createSoumission = useMutation({
    mutationFn: async (soumission: { lot_id: string; prestataire_id: string; montant_offre: number; delai_execution?: number; observations?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("soumissions" as any)
        .insert([{ ...soumission, created_by: user?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["soumissions", variables.lot_id] });
      toast.success("Soumission enregistrée");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Attribuer lot
  const attribuerLot = useMutation({
    mutationFn: async ({ lotId, soumissionId }: { lotId: string; soumissionId: string }) => {
      // Récupérer la soumission
      const { data: soumission, error: sErr } = await supabase
        .from("soumissions" as any)
        .select("*")
        .eq("id", soumissionId)
        .single();
      if (sErr) throw sErr;

      const soumissionData = soumission as unknown as Soumission;

      // Mettre à jour le lot
      const { error: lErr } = await supabase
        .from("marche_lots" as any)
        .update({
          attributaire_id: soumissionData.prestataire_id,
          montant_attribue: soumissionData.montant_offre,
          statut: "attribue",
          date_attribution: new Date().toISOString().split("T")[0],
        })
        .eq("id", lotId);
      if (lErr) throw lErr;

      // Mettre à jour la soumission
      const { error: uErr } = await supabase
        .from("soumissions" as any)
        .update({ statut: "retenue" })
        .eq("id", soumissionId);
      if (uErr) throw uErr;

      // Rejeter les autres
      const { error: rErr } = await supabase
        .from("soumissions" as any)
        .update({ statut: "rejetee", motif_rejet: "Non retenue" })
        .eq("lot_id", lotId)
        .neq("id", soumissionId);
      if (rErr) throw rErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marche-lots"] });
      queryClient.invalidateQueries({ queryKey: ["soumissions"] });
      toast.success("Lot attribué");
    },
  });

  // Créer avenant
  const createAvenant = useMutation({
    mutationFn: async (avenant: { contrat_id: string; objet: string; type_avenant: string; montant_modification?: number; nouveau_montant?: number; nouveau_delai?: number; nouvelle_date_fin?: string; date_signature?: string; statut?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Obtenir le prochain numéro d'avenant
      const { data: existingAvenants } = await supabase
        .from("avenants" as any)
        .select("numero_avenant")
        .eq("contrat_id", avenant.contrat_id)
        .order("numero_avenant", { ascending: false })
        .limit(1);
      
      const nextNumero = existingAvenants && existingAvenants.length > 0 
        ? (existingAvenants[0] as any).numero_avenant + 1 
        : 1;

      const { data, error } = await supabase
        .from("avenants" as any)
        .insert([{ ...avenant, numero_avenant: nextNumero, created_by: user?.id }])
        .select()
        .single();
      if (error) throw error;

      // Mettre à jour le contrat si avenant signé
      if (avenant.statut === "signe" && avenant.nouveau_montant) {
        await supabase
          .from("contrats" as any)
          .update({ 
            montant_actuel: avenant.nouveau_montant,
            date_fin: avenant.nouvelle_date_fin || undefined,
          })
          .eq("id", avenant.contrat_id);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["avenants", variables.contrat_id] });
      queryClient.invalidateQueries({ queryKey: ["contrats"] });
      toast.success("Avenant créé");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  return {
    contrats,
    createContrat,
    updateContrat,
    createLot,
    createSoumission,
    attribuerLot,
    createAvenant,
  };
}
