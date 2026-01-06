import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

export const TYPES_COMPTE = [
  { value: "courant", label: "Compte courant" },
  { value: "epargne", label: "Compte épargne" },
  { value: "caisse", label: "Caisse" },
  { value: "special", label: "Compte spécial" },
];

export const TYPES_OPERATION = [
  { value: "entree", label: "Entrée" },
  { value: "sortie", label: "Sortie" },
  { value: "virement_interne", label: "Virement interne" },
];

export interface CompteBancaire {
  id: string;
  code: string;
  libelle: string;
  banque: string | null;
  numero_compte: string | null;
  iban: string | null;
  bic: string | null;
  solde_initial: number;
  solde_actuel: number;
  devise: string;
  est_actif: boolean;
  type_compte: string;
  created_at: string;
}

export interface OperationTresorerie {
  id: string;
  numero: string;
  compte_id: string;
  type_operation: "entree" | "sortie" | "virement_interne";
  date_operation: string;
  date_valeur: string | null;
  montant: number;
  libelle: string;
  reference_externe: string | null;
  reglement_id: string | null;
  compte_destination_id: string | null;
  rapproche: boolean;
  date_rapprochement: string | null;
  exercice: number;
  created_by: string | null;
  created_at: string;
  compte?: CompteBancaire;
  compte_destination?: CompteBancaire;
}

// Utilisation de requêtes SQL brutes pour les nouvelles tables non encore dans les types
export function useTresorerie() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();

  // Comptes bancaires
  const comptes = useQuery({
    queryKey: ["comptes-bancaires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comptes_bancaires" as any)
        .select("*")
        .order("code");
      if (error) throw error;
      return (data || []) as unknown as CompteBancaire[];
    },
  });

  // Opérations de trésorerie
  const operations = useQuery({
    queryKey: ["operations-tresorerie", exercice],
    queryFn: async () => {
      if (!exercice) return [];
      const { data, error } = await supabase
        .from("operations_tresorerie" as any)
        .select("*")
        .eq("exercice", exercice)
        .order("date_operation", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as OperationTresorerie[];
    },
    enabled: !!exercice,
  });

  // Créer compte bancaire
  const createCompte = useMutation({
    mutationFn: async (compte: Partial<CompteBancaire>) => {
      const { data, error } = await supabase
        .from("comptes_bancaires" as any)
        .insert([{ ...compte, solde_actuel: compte.solde_initial || 0 }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comptes-bancaires"] });
      toast.success("Compte créé avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Modifier compte
  const updateCompte = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CompteBancaire> & { id: string }) => {
      const { data, error } = await supabase
        .from("comptes_bancaires" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comptes-bancaires"] });
      toast.success("Compte modifié");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Créer opération
  const createOperation = useMutation({
    mutationFn: async (operation: Partial<OperationTresorerie>) => {
      const { data, error } = await supabase
        .from("operations_tresorerie" as any)
        .insert([{ ...operation, exercice }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations-tresorerie"] });
      queryClient.invalidateQueries({ queryKey: ["comptes-bancaires"] });
      toast.success("Opération enregistrée");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Rapprocher opération
  const rapprocher = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("operations_tresorerie" as any)
        .update({ rapproche: true, date_rapprochement: new Date().toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations-tresorerie"] });
      toast.success("Opération rapprochée");
    },
  });

  // Stats trésorerie
  const stats = useQuery({
    queryKey: ["tresorerie-stats", exercice],
    queryFn: async () => {
      const comptesData = comptes.data || [];
      const opsData = operations.data || [];
      
      const soldeTotal = comptesData.filter(c => c.est_actif).reduce((sum, c) => sum + (c.solde_actuel || 0), 0);
      const comptesActifs = comptesData.filter(c => c.est_actif).length;
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      
      const entreeMois = opsData
        .filter(o => o.type_operation === "entree" && o.date_operation >= startOfMonth)
        .reduce((sum, o) => sum + (o.montant || 0), 0);
      
      const sortieMois = opsData
        .filter(o => o.type_operation === "sortie" && o.date_operation >= startOfMonth)
        .reduce((sum, o) => sum + (o.montant || 0), 0);

      return { soldeTotal, comptesActifs, entreeMois, sortieMois };
    },
    enabled: !!comptes.data && !!operations.data,
  });

  return {
    comptes,
    operations,
    stats,
    createCompte,
    updateCompte,
    createOperation,
    rapprocher,
  };
}

export function useTresorerieDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["tresorerie-dashboard", exercice],
    queryFn: async () => {
      if (!exercice) return null;

      // Ordres à payer validés
      const { data: ordresAPayer, error: ordErr } = await supabase
        .from("ordonnancements")
        .select("id, montant, created_at")
        .eq("exercice", exercice)
        .eq("statut", "valide");

      if (ordErr) throw ordErr;

      // Règlements
      const { data: reglements, error: regErr } = await supabase
        .from("reglements")
        .select("id, montant, date_paiement, statut")
        .eq("exercice", exercice);

      if (regErr) throw regErr;

      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const reglementsJour = reglements.filter(r => r.date_paiement === today);
      const reglementsSemaine = reglements.filter(r => r.date_paiement >= weekAgo && r.date_paiement <= today);
      const reglementsPartiels = reglements.filter(r => r.statut === "partiel");

      // Prévisions basées sur created_at
      const prevision7j = ordresAPayer
        .filter(o => o.created_at && o.created_at.split("T")[0] <= in7Days)
        .reduce((sum, o) => sum + (o.montant || 0), 0);
      
      const prevision30j = ordresAPayer
        .filter(o => o.created_at && o.created_at.split("T")[0] <= in30Days)
        .reduce((sum, o) => sum + (o.montant || 0), 0);

      return {
        ordresAPayer: ordresAPayer.length,
        montantOrdres: ordresAPayer.reduce((sum, o) => sum + (o.montant || 0), 0),
        reglementsJour: reglementsJour.length,
        montantJour: reglementsJour.reduce((sum, r) => sum + (r.montant || 0), 0),
        reglementsSemaine: reglementsSemaine.length,
        montantSemaine: reglementsSemaine.reduce((sum, r) => sum + (r.montant || 0), 0),
        reglementsPartiels: reglementsPartiels.length,
        prevision7j,
        prevision30j,
      };
    },
    enabled: !!exercice,
  });
}
