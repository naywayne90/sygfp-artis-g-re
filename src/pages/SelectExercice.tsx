import { useNavigate } from "react-router-dom";
import { useExercice } from "@/contexts/ExerciceContext";
import { Button } from "@/components/ui/button";
import logoArti from "@/assets/logo-arti.jpg";

export default function SelectExercice() {
  const navigate = useNavigate();
  const { setExercice } = useExercice();

  const handleSelect = (year: number) => {
    setExercice(year);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo centré */}
        <div className="flex justify-center mb-8">
          <img 
            src={logoArti} 
            alt="ARTI" 
            className="h-20 w-auto object-contain"
          />
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
          {/* En-tête coloré */}
          <div className="bg-primary px-6 py-5 text-center">
            <h1 className="text-xl font-bold text-white tracking-wide">SYGFP</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mt-1">
              Gestion Financière Publique
            </p>
          </div>

          {/* Contenu */}
          <div className="p-6">
            <h2 className="text-center text-sm font-medium text-slate-600 mb-5">
              Sélectionnez l'exercice budgétaire
            </h2>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 text-sm font-medium border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                onClick={() => handleSelect(2025)}
              >
                Exercice 2025
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-sm font-medium border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                onClick={() => handleSelect(2026)}
              >
                Exercice 2026
              </Button>
            </div>
          </div>
        </div>

        {/* Footer discret */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2025 ARTI - Tous droits réservés
        </p>
      </div>
    </div>
  );
}
