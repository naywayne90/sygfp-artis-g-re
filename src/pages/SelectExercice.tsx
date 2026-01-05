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
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center space-y-6 pb-2">
          <div className="mx-auto bg-white rounded-xl p-4 shadow-md">
            <img 
              src={logoArti} 
              alt="ARTI - Autorité de Régulation du Transport Intérieur" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary tracking-tight">SYGFP</h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Système de Gestion Financière Publique
            </p>
          </div>
          <CardTitle className="text-xl text-foreground">Sélection de l'exercice</CardTitle>
          <CardDescription className="text-base">
            Choisissez l'exercice budgétaire sur lequel vous souhaitez travailler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <Button
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => handleSelect(2025)}
          >
            Exercice 2025
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => handleSelect(2026)}
          >
            Exercice 2026
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
