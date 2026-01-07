import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SecteurActivite {
  id: string;
  niveau: "PRINCIPAL" | "SECONDAIRE";
  code: string;
  libelle: string;
  parent_id: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
  parent?: SecteurActivite;
}

export function useSecteursActivite() {
  const queryClient = useQueryClient();

  // Récupérer tous les secteurs
  const { data: secteurs = [], isLoading } = useQuery({
    queryKey: ["secteurs-activite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ref_secteurs_activite")
        .select("*")
        .order("niveau", { ascending: true })
        .order("code", { ascending: true });
      
      if (error) throw error;
      return data as SecteurActivite[];
    },
  });

  // Secteurs principaux uniquement
  const secteursPrincipaux = secteurs.filter(s => s.niveau === "PRINCIPAL");
  
  // Secteurs secondaires uniquement
  const secteursSecondaires = secteurs.filter(s => s.niveau === "SECONDAIRE");

  // Secteurs principaux actifs (pour les selects)
  const secteursPrincipauxActifs = secteursPrincipaux.filter(s => s.actif);
  
  // Secteurs secondaires actifs
  const secteursSecondairesActifs = secteursSecondaires.filter(s => s.actif);

  // Obtenir les secondaires d'un principal
  const getSecondairesByPrincipal = (principalId: string | null, includeInactifs = false) => {
    if (!principalId) return [];
    const filtered = secteursSecondaires.filter(s => s.parent_id === principalId);
    return includeInactifs ? filtered : filtered.filter(s => s.actif);
  };

  // Créer un secteur
  const createSecteur = useMutation({
    mutationFn: async (data: {
      niveau: "PRINCIPAL" | "SECONDAIRE";
      code: string;
      libelle: string;
      parent_id?: string | null;
    }) => {
      const { error } = await supabase
        .from("ref_secteurs_activite")
        .insert({
          niveau: data.niveau,
          code: data.code.toUpperCase(),
          libelle: data.libelle,
          parent_id: data.niveau === "PRINCIPAL" ? null : data.parent_id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secteurs-activite"] });
      toast.success("Secteur créé avec succès");
    },
    onError: (error: Error) => {
      console.error("Erreur création secteur:", error);
      toast.error("Erreur lors de la création du secteur");
    },
  });

  // Modifier un secteur
  const updateSecteur = useMutation({
    mutationFn: async (data: {
      id: string;
      code?: string;
      libelle?: string;
      actif?: boolean;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (data.code !== undefined) updateData.code = data.code.toUpperCase();
      if (data.libelle !== undefined) updateData.libelle = data.libelle;
      if (data.actif !== undefined) updateData.actif = data.actif;

      const { error } = await supabase
        .from("ref_secteurs_activite")
        .update(updateData)
        .eq("id", data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secteurs-activite"] });
      toast.success("Secteur mis à jour");
    },
    onError: (error: Error) => {
      console.error("Erreur modification secteur:", error);
      toast.error("Erreur lors de la modification");
    },
  });

  // Toggle actif/inactif
  const toggleActif = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { error } = await supabase
        .from("ref_secteurs_activite")
        .update({ actif })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["secteurs-activite"] });
      toast.success(variables.actif ? "Secteur activé" : "Secteur désactivé");
    },
    onError: () => {
      toast.error("Erreur lors de la modification du statut");
    },
  });

  // Import CSV
  const importCSV = useMutation({
    mutationFn: async (rows: { code: string; libelle: string; parent_code?: string }[]) => {
      const principaux = rows.filter(r => !r.parent_code);
      const secondaires = rows.filter(r => r.parent_code);

      // Insérer les principaux d'abord
      if (principaux.length > 0) {
        const { error } = await supabase
          .from("ref_secteurs_activite")
          .upsert(
            principaux.map(p => ({
              niveau: "PRINCIPAL" as const,
              code: p.code.toUpperCase(),
              libelle: p.libelle,
              parent_id: null,
            })),
            { onConflict: "niveau,code" }
          );
        if (error) throw error;
      }

      // Récupérer les principaux pour les FK
      const { data: allPrincipaux } = await supabase
        .from("ref_secteurs_activite")
        .select("id, code")
        .eq("niveau", "PRINCIPAL");

      const principauxMap = new Map(allPrincipaux?.map(p => [p.code, p.id]) || []);

      // Insérer les secondaires
      if (secondaires.length > 0) {
        const secondairesData = secondaires
          .filter(s => principauxMap.has(s.parent_code!.toUpperCase()))
          .map(s => ({
            niveau: "SECONDAIRE" as const,
            code: s.code.toUpperCase(),
            libelle: s.libelle,
            parent_id: principauxMap.get(s.parent_code!.toUpperCase()),
          }));

        if (secondairesData.length > 0) {
          const { error } = await supabase
            .from("ref_secteurs_activite")
            .upsert(secondairesData, { onConflict: "niveau,code" });
          if (error) throw error;
        }
      }

      return { principaux: principaux.length, secondaires: secondaires.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["secteurs-activite"] });
      toast.success(`Import réussi: ${result.principaux} principaux, ${result.secondaires} secondaires`);
    },
    onError: (error: Error) => {
      console.error("Erreur import:", error);
      toast.error("Erreur lors de l'import CSV");
    },
  });

  // Stats prestataires par secteur
  const { data: statsParSecteur = [] } = useQuery({
    queryKey: ["prestataires-par-secteur"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prestataires")
        .select("secteur_principal_id")
        .not("secteur_principal_id", "is", null);

      if (error) throw error;

      // Compter par secteur
      const counts = new Map<string, number>();
      data?.forEach(p => {
        const id = p.secteur_principal_id as string;
        counts.set(id, (counts.get(id) || 0) + 1);
      });

      return secteursPrincipaux.map(s => ({
        secteur: s,
        count: counts.get(s.id) || 0,
      }));
    },
    enabled: secteursPrincipaux.length > 0,
  });

  return {
    secteurs,
    secteursPrincipaux,
    secteursSecondaires,
    secteursPrincipauxActifs,
    secteursSecondairesActifs,
    getSecondairesByPrincipal,
    isLoading,
    createSecteur,
    updateSecteur,
    toggleActif,
    importCSV,
    statsParSecteur,
  };
}
