import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Prestataire {
  id: string;
  code: string;
  raison_sociale: string;
  ninea: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  secteur_activite: string | null;
  secteur_principal_id: string | null;
  secteur_secondaire_id: string | null;
  statut: string | null;
  statut_fiscal: string | null;
  date_expiration_fiscale: string | null;
  documents_fiscaux: Record<string, unknown> | null;
  rib_banque: string | null;
  rib_numero: string | null;
  rib_cle: string | null;
  rccm: string | null;
  cc: string | null;
  code_admission: string | null;
  code_comptable: string | null;
  created_by: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrestaireRequest {
  id: string;
  raison_sociale: string;
  secteur_principal_id: string | null;
  secteur_secondaire_id: string | null;
  adresse: string | null;
  email: string | null;
  telephone: string | null;
  ninea: string | null;
  rccm: string | null;
  cc: string | null;
  rib_banque: string | null;
  rib_numero: string | null;
  rib_cle: string | null;
  code_admission: string | null;
  code_comptable: string | null;
  statut: "ENREGISTRE" | "EN_VERIF" | "VALIDE" | "REFUSE";
  commentaire_controle: string | null;
  submitted_by: string | null;
  submitted_email: string | null;
  submitted_at: string;
  validated_by: string | null;
  validated_at: string | null;
  source: "PUBLIC_LINK" | "INTERNE" | "IMPORT";
  prestataire_id: string | null;
  created_at: string;
  updated_at: string;
}

export function usePrestataires() {
  const queryClient = useQueryClient();

  // Récupérer tous les prestataires
  const { data: prestataires = [], isLoading } = useQuery({
    queryKey: ["prestataires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prestataires")
        .select("*")
        .order("raison_sociale");
      
      if (error) throw error;
      return data as Prestataire[];
    },
  });

  // Prestataires actifs uniquement (pour les selects)
  const prestatairesActifs = prestataires.filter(p => p.statut === "ACTIF");

  // Stats
  const stats = {
    total: prestataires.length,
    actifs: prestataires.filter(p => p.statut === "ACTIF").length,
    inactifs: prestataires.filter(p => p.statut === "INACTIF").length,
  };

  return {
    prestataires,
    prestatairesActifs,
    isLoading,
    stats,
  };
}

export function usePrestaireRequests() {
  const queryClient = useQueryClient();

  // Récupérer les demandes
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["prestataire-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prestataire_requests")
        .select(`
          *,
          submitted_by_profile:submitted_by(full_name, email),
          validated_by_profile:validated_by(full_name)
        `)
        .order("submitted_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Demandes en attente
  const pendingRequests = requests.filter(
    (r) => r.statut === "ENREGISTRE" || r.statut === "EN_VERIF"
  );

  // Stats
  const stats = {
    total: requests.length,
    enregistre: requests.filter((r) => r.statut === "ENREGISTRE").length,
    enVerif: requests.filter((r) => r.statut === "EN_VERIF").length,
    valide: requests.filter((r) => r.statut === "VALIDE").length,
    refuse: requests.filter((r) => r.statut === "REFUSE").length,
  };

  // Créer une demande
  const createRequest = useMutation({
    mutationFn: async (data: {
      raison_sociale: string;
      secteur_principal_id?: string | null;
      secteur_secondaire_id?: string | null;
      adresse?: string | null;
      email?: string | null;
      telephone?: string | null;
      ninea?: string | null;
      rccm?: string | null;
      cc?: string | null;
      rib_banque?: string | null;
      rib_numero?: string | null;
      rib_cle?: string | null;
      code_admission?: string | null;
      code_comptable?: string | null;
      source?: "PUBLIC_LINK" | "INTERNE" | "IMPORT";
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("prestataire_requests")
        .insert({
          ...data,
          submitted_by: userData.user?.id,
          submitted_email: userData.user?.email,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prestataire-requests"] });
      toast.success("Demande enregistrée avec succès");
    },
    onError: (error: Error) => {
      console.error("Erreur création demande:", error);
      toast.error("Erreur lors de l'enregistrement de la demande");
    },
  });

  // Passer en vérification
  const setEnVerification = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("prestataire_requests")
        .update({ statut: "EN_VERIF" })
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prestataire-requests"] });
      toast.success("Demande en cours de vérification");
    },
    onError: () => {
      toast.error("Erreur lors du changement de statut");
    },
  });

  // Valider une demande
  const validateRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc("validate_prestataire_request", {
        p_request_id: requestId,
        p_validator_id: userData.user?.id,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prestataire-requests"] });
      queryClient.invalidateQueries({ queryKey: ["prestataires"] });
      toast.success("Prestataire validé et ajouté au référentiel");
    },
    onError: (error: Error) => {
      console.error("Erreur validation:", error);
      toast.error("Erreur lors de la validation");
    },
  });

  // Refuser une demande
  const refuseRequest = useMutation({
    mutationFn: async ({ requestId, commentaire }: { requestId: string; commentaire: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.rpc("refuse_prestataire_request", {
        p_request_id: requestId,
        p_validator_id: userData.user?.id,
        p_commentaire: commentaire,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prestataire-requests"] });
      toast.success("Demande refusée");
    },
    onError: (error: Error) => {
      console.error("Erreur refus:", error);
      toast.error("Erreur lors du refus");
    },
  });

  // Validation en masse
  const validateBulk = useMutation({
    mutationFn: async (requestIds: string[]) => {
      const { data: userData } = await supabase.auth.getUser();
      
      for (const id of requestIds) {
        const { error } = await supabase.rpc("validate_prestataire_request", {
          p_request_id: id,
          p_validator_id: userData.user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prestataire-requests"] });
      queryClient.invalidateQueries({ queryKey: ["prestataires"] });
      toast.success("Prestataires validés en masse");
    },
    onError: () => {
      toast.error("Erreur lors de la validation en masse");
    },
  });

  // Import CSV
  const importCSV = useMutation({
    mutationFn: async (rows: Array<{
      raison_sociale: string;
      email?: string;
      telephone?: string;
      adresse?: string;
      ninea?: string;
      rccm?: string;
      code_comptable?: string;
    }>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const requests = rows.map(row => ({
        raison_sociale: row.raison_sociale,
        email: row.email || null,
        telephone: row.telephone || null,
        adresse: row.adresse || null,
        ninea: row.ninea || null,
        rccm: row.rccm || null,
        code_comptable: row.code_comptable || null,
        source: "IMPORT" as const,
        submitted_by: userData.user?.id,
        submitted_email: userData.user?.email,
      }));

      const { error } = await supabase
        .from("prestataire_requests")
        .insert(requests);
      
      if (error) throw error;
      return { count: requests.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["prestataire-requests"] });
      toast.success(`${result.count} prestataires importés dans le panier`);
    },
    onError: (error: Error) => {
      console.error("Erreur import:", error);
      toast.error("Erreur lors de l'import");
    },
  });

  return {
    requests,
    pendingRequests,
    isLoading,
    stats,
    createRequest,
    setEnVerification,
    validateRequest,
    refuseRequest,
    validateBulk,
    importCSV,
  };
}
