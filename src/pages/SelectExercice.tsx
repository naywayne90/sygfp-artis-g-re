import { useNavigate } from "react-router-dom";
import { useExercice } from "@/contexts/ExerciceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoArti from "@/assets/logo-arti.jpg";

export default function SelectExercice() {
  const navigate = useNavigate();
  const { setExercice } = useExercice();

  const handleSelect = (year: number) => {
    setExercice(year);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
        {/* Header avec fond bleu foncé pour le logo */}
        <div className="bg-primary px-8 py-8 text-center">
          <div className="inline-block bg-white rounded-lg px-6 py-4 shadow-lg">
            <img 
              src={logoArti} 
              alt="ARTI" 
              className="h-14 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground mt-5 tracking-tight">SYGFP</h1>
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70 font-medium mt-1">
            Système de Gestion Financière Publique
          </p>
        </div>
        
        {/* Contenu blanc */}
        <CardHeader className="text-center pt-6 pb-2">
          <CardTitle className="text-lg text-foreground">Sélection de l'exercice</CardTitle>
          <CardDescription>
            Choisissez l'exercice budgétaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-8">
          <Button
            variant="outline"
            className="w-full h-12 text-base font-semibold border-2 border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => handleSelect(2025)}
          >
            Exercice 2025
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 text-base font-semibold border-2 border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => handleSelect(2026)}
          >
            Exercice 2026
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
