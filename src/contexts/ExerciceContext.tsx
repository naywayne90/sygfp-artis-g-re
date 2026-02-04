// @ts-nocheck
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ExerciceInfo {
  id: string;
  annee: number;
  code_exercice: string | null;
  libelle: string | null;
  statut: string;
  est_actif: boolean;
  date_ouverture: string | null;
  date_cloture: string | null;
}

interface ExerciceContextType {
  exercice: number | null;
  exerciceId: string | null;
  exerciceInfo: ExerciceInfo | null;
  selectedExercice: ExerciceInfo | null; // Alias de exerciceInfo pour compatibilité
  setExercice: (year: number | null, showToast?: boolean) => void;
  clearExercice: () => void;
  isLoading: boolean;
  isReadOnly: boolean; // Exercice clôturé = lecture seule (sauf Admin)
  canWrite: boolean; // Peut-on écrire dans cet exercice
  refreshExercice: () => Promise<void>;
  hasNoOpenExercice: boolean; // Aucun exercice ouvert disponible
  isUserAdmin: boolean; // L'utilisateur est-il admin (bypass lecture seule)
}

const ExerciceContext = createContext<ExerciceContextType | undefined>(undefined);

// Statuts qui autorisent l'écriture
const WRITABLE_STATUTS = ["ouvert", "en_cours"];

export function ExerciceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [exercice, setExerciceState] = useState<number | null>(() => {
    const stored = localStorage.getItem("sygfp_exercice");
    return stored ? parseInt(stored, 10) : null;
  });
  const [exerciceId, setExerciceId] = useState<string | null>(null);
  const [exerciceInfo, setExerciceInfo] = useState<ExerciceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoOpenExercice, setHasNoOpenExercice] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsUserAdmin(false);
          return;
        }

        // Vérifier dans user_roles
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (roles?.some(r => r.role === "ADMIN" || r.role === "admin")) {
          setIsUserAdmin(true);
          return;
        }

        // Vérifier dans profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("profil_fonctionnel")
          .eq("id", user.id)
          .single();

        setIsUserAdmin(profile?.profil_fonctionnel === "Admin");
      } catch (err) {
        console.error("Erreur vérification admin:", err);
        setIsUserAdmin(false);
      }
    }

    checkAdminStatus();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Calculer si l'exercice est en lecture seule (les admins peuvent toujours écrire)
  const isReadOnly = exerciceInfo
    ? !WRITABLE_STATUTS.includes(exerciceInfo.statut) && !isUserAdmin
    : false;
  const canWrite = !isReadOnly;

  // Charger les infos de l'exercice
  const loadExerciceInfo = useCallback(async (annee: number | null) => {
    if (!annee) {
      setExerciceId(null);
      setExerciceInfo(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("exercices_budgetaires")
        .select("*")
        .eq("annee", annee)
        .maybeSingle();

      if (error) {
        console.error("Erreur chargement exercice:", error);
        setExerciceId(null);
        setExerciceInfo(null);
        return;
      }

      if (data) {
        setExerciceId(data.id);
        setExerciceInfo({
          id: data.id,
          annee: data.annee,
          code_exercice: data.code_exercice,
          libelle: data.libelle,
          statut: data.statut,
          est_actif: data.est_actif,
          date_ouverture: data.date_ouverture,
          date_cloture: data.date_cloture,
        });
      } else {
        setExerciceId(null);
        setExerciceInfo(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger au démarrage et quand l'exercice change
  useEffect(() => {
    loadExerciceInfo(exercice);
  }, [exercice, loadExerciceInfo]);

  // Auto-sélection de l'exercice ouvert au démarrage
  useEffect(() => {
    async function autoSelectExercice() {
      if (exercice !== null) return; // Déjà sélectionné

      setIsLoading(true);
      try {
        // Chercher le dernier exercice OUVERT ou EN_COURS
        const { data, error } = await supabase
          .from("exercices_budgetaires")
          .select("*")
          .in("statut", ["ouvert", "en_cours"])
          .eq("est_actif", true)
          .order("annee", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Erreur auto-sélection exercice:", error);
          setHasNoOpenExercice(true);
          return;
        }

        if (data) {
          // Auto-sélectionner sans toast
          setExerciceState(data.annee);
          localStorage.setItem("sygfp_exercice", data.annee.toString());
          setExerciceId(data.id);
          setExerciceInfo({
            id: data.id,
            annee: data.annee,
            code_exercice: data.code_exercice,
            libelle: data.libelle,
            statut: data.statut,
            est_actif: data.est_actif,
            date_ouverture: data.date_ouverture,
            date_cloture: data.date_cloture,
          });
          setHasNoOpenExercice(false);
        } else {
          // Aucun exercice ouvert trouvé
          setHasNoOpenExercice(true);
        }
      } finally {
        setIsLoading(false);
      }
    }

    autoSelectExercice();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Changer d'exercice avec invalidation du cache et audit
  const setExercice = useCallback(async (year: number | null, showToast = true) => {
    const previousExercice = exercice;

    setExerciceState(year);
    if (year) {
      localStorage.setItem("sygfp_exercice", year.toString());
      setHasNoOpenExercice(false); // L'utilisateur a sélectionné un exercice
    } else {
      localStorage.removeItem("sygfp_exercice");
    }

    // Invalider toutes les requêtes pour forcer le rechargement
    await queryClient.invalidateQueries();

    // Afficher le toast si demandé
    if (showToast && year && previousExercice !== year) {
      toast.success(`Exercice changé : ${year}`, {
        description: "Toutes les données ont été rechargées.",
        duration: 3000,
      });
    }

    // Auditer le changement d'exercice
    if (previousExercice !== year && year !== null) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("audit_logs").insert({
            user_id: user.id,
            entity_type: "exercice",
            entity_id: null,
            action: "change_exercice",
            old_values: previousExercice ? { exercice: previousExercice } : null,
            new_values: { exercice: year },
            exercice: year,
          });
        }
      } catch (err) {
        console.error("Erreur audit changement exercice:", err);
      }
    }
  }, [exercice, queryClient]);

  const clearExercice = useCallback(() => {
    setExerciceState(null);
    setExerciceId(null);
    setExerciceInfo(null);
    localStorage.removeItem("sygfp_exercice");
  }, []);

  const refreshExercice = useCallback(async () => {
    if (exercice) {
      await loadExerciceInfo(exercice);
    } else {
      // Si pas d'exercice, revérifier s'il y en a un ouvert
      const { data } = await supabase
        .from("exercices_budgetaires")
        .select("*")
        .in("statut", ["ouvert", "en_cours"])
        .eq("est_actif", true)
        .order("annee", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setExerciceState(data.annee);
        localStorage.setItem("sygfp_exercice", data.annee.toString());
        setHasNoOpenExercice(false);
      } else {
        setHasNoOpenExercice(true);
      }
    }
  }, [exercice, loadExerciceInfo]);

  return (
    <ExerciceContext.Provider value={{
      exercice,
      exerciceId,
      exerciceInfo,
      selectedExercice: exerciceInfo, // Alias pour compatibilité
      setExercice,
      clearExercice,
      isLoading,
      isReadOnly,
      canWrite,
      refreshExercice,
      hasNoOpenExercice,
      isUserAdmin,
    }}>
      {children}
    </ExerciceContext.Provider>
  );
}

export function useExercice() {
  const context = useContext(ExerciceContext);
  if (context === undefined) {
    throw new Error("useExercice must be used within an ExerciceProvider");
  }
  return context;
}
