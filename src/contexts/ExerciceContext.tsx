import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  setExercice: (year: number | null) => void;
  clearExercice: () => void;
  isLoading: boolean;
}

const ExerciceContext = createContext<ExerciceContextType | undefined>(undefined);

export function ExerciceProvider({ children }: { children: ReactNode }) {
  const [exercice, setExerciceState] = useState<number | null>(() => {
    const stored = localStorage.getItem("sygfp_exercice");
    return stored ? parseInt(stored, 10) : null;
  });
  const [exerciceId, setExerciceId] = useState<string | null>(null);
  const [exerciceInfo, setExerciceInfo] = useState<ExerciceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les infos de l'exercice quand l'année change
  useEffect(() => {
    async function loadExerciceInfo() {
      if (!exercice) {
        setExerciceId(null);
        setExerciceInfo(null);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("exercices_budgetaires")
          .select("*")
          .eq("annee", exercice)
          .single();

        if (error) {
          console.error("Erreur chargement exercice:", error);
          return;
        }

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
      } finally {
        setIsLoading(false);
      }
    }

    loadExerciceInfo();
  }, [exercice]);

  const setExercice = (year: number | null) => {
    setExerciceState(year);
    if (year) {
      localStorage.setItem("sygfp_exercice", year.toString());
    } else {
      localStorage.removeItem("sygfp_exercice");
    }
  };

  const clearExercice = () => {
    setExerciceState(null);
    setExerciceId(null);
    setExerciceInfo(null);
    localStorage.removeItem("sygfp_exercice");
  };

  return (
    <ExerciceContext.Provider value={{ 
      exercice, 
      exerciceId, 
      exerciceInfo, 
      setExercice, 
      clearExercice,
      isLoading 
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
