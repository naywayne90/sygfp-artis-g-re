import { useNavigate } from "react-router-dom";
import { useExercice } from "@/contexts/ExerciceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function SelectExercice() {
  const navigate = useNavigate();
  const { setExercice } = useExercice();

  const handleSelect = (year: number) => {
    setExercice(year);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-primary">Sélection de l'exercice</CardTitle>
          <CardDescription className="text-base">
            Veuillez choisir l'exercice budgétaire sur lequel vous souhaitez travailler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-16 text-lg font-semibold border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => handleSelect(2025)}
          >
            Exercice 2025
          </Button>
          <Button
            variant="outline"
            className="w-full h-16 text-lg font-semibold border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => handleSelect(2026)}
          >
            Exercice 2026
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
