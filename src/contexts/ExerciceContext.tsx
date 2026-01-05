import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ExerciceContextType {
  exercice: number | null;
  setExercice: (year: number | null) => void;
  clearExercice: () => void;
}

const ExerciceContext = createContext<ExerciceContextType | undefined>(undefined);

export function ExerciceProvider({ children }: { children: ReactNode }) {
  const [exercice, setExerciceState] = useState<number | null>(() => {
    const stored = localStorage.getItem("sygfp_exercice");
    return stored ? parseInt(stored, 10) : null;
  });

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
    localStorage.removeItem("sygfp_exercice");
  };

  return (
    <ExerciceContext.Provider value={{ exercice, setExercice, clearExercice }}>
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
