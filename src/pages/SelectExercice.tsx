import { useNavigate } from "react-router-dom";
import { useExercice } from "@/contexts/ExerciceContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import logoArti from "@/assets/logo-arti.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SelectExercice() {
  const navigate = useNavigate();
  const { setExercice } = useExercice();

  // Charger les exercices depuis la base de données
  const { data: exercices, isLoading } = useQuery({
    queryKey: ["exercices-budgetaires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercices_budgetaires")
        .select("*")
        .eq("est_actif", true)
        .order("annee", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSelect = (year: number) => {
    setExercice(year);
    navigate("/");
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "bg-green-100 text-green-700 border-green-200";
      case "ouvert":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "cloture":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "archive":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "En cours";
      case "ouvert":
        return "Ouvert";
      case "cloture":
        return "Clôturé";
      case "archive":
        return "Archivé";
      default:
        return statut;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo centré */}
        <div className="flex justify-center mb-6">
          <img 
            src={logoArti} 
            alt="ARTI" 
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
          {/* En-tête */}
          <div className="bg-primary px-6 py-4 text-center">
            <h1 className="text-lg font-bold text-white tracking-wide">SYGFP</h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/70 mt-0.5">
              Système de Gestion Financière Publique
            </p>
          </div>

          {/* Contenu */}
          <div className="p-5">
            <h2 className="text-center text-sm font-medium text-slate-600 mb-4">
              Sélectionnez l'exercice budgétaire
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : exercices && exercices.length > 0 ? (
              <div className="space-y-2.5">
                {exercices.map((ex) => (
                  <Button
                    key={ex.id}
                    variant="outline"
                    className="w-full h-auto py-3 px-4 text-sm font-medium border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 flex justify-between items-center"
                    onClick={() => handleSelect(ex.annee)}
                  >
                    <span>Exercice {ex.annee}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatutBadge(ex.statut)}`}>
                      {getStatutLabel(ex.statut)}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">
                Aucun exercice disponible
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-5">
          © 2025 ARTI - Tous droits réservés
        </p>
      </div>
    </div>
  );
}
