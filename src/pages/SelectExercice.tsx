import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExercice } from "@/contexts/ExerciceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Loader2, Plus, Lock, AlertTriangle } from "lucide-react";
import logoArti from "@/assets/logo-arti.jpg";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SelectExercice() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setExercice } = useExercice();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  // Charger les exercices depuis la base de données
  const { data: exercices, isLoading } = useQuery({
    queryKey: ["exercices-budgetaires-select"],
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

  // Mutation pour créer un nouvel exercice
  const createMutation = useMutation({
    mutationFn: async (annee: number) => {
      const { data, error } = await supabase
        .from("exercices_budgetaires")
        .insert({
          annee,
          code_exercice: `EX${annee}`,
          libelle: `Exercice budgétaire ${annee}`,
          statut: "ouvert",
          est_actif: true,
          date_ouverture: `${annee}-01-01`,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["exercices-budgetaires-select"] });
      setShowCreateDialog(false);
      toast.success(`Exercice ${data.annee} créé avec succès`);
      handleSelect(data.annee);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSelect = (year: number) => {
    setExercice(year, false);
    navigate("/");
  };

  const handleCreateExercice = () => {
    createMutation.mutate(newYear);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "bg-success/10 text-success border-success/20";
      case "ouvert":
        return "bg-primary/10 text-primary border-primary/20";
      case "cloture":
        return "bg-warning/10 text-warning border-warning/20";
      case "archive":
        return "bg-muted text-muted-foreground border-muted";
      default:
        return "bg-muted text-muted-foreground border-muted";
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

  const hasOpenExercices = exercices?.some(ex => 
    ex.statut === "ouvert" || ex.statut === "en_cours"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo centré */}
        <div className="flex justify-center mb-6">
          <img 
            src={logoArti} 
            alt="ARTI" 
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Carte principale */}
        <Card className="shadow-xl border-slate-200/50">
          {/* En-tête */}
          <CardHeader className="bg-primary text-center rounded-t-lg">
            <CardTitle className="text-lg font-bold text-white tracking-wide">SYGFP</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-[0.15em] text-white/70">
              Système de Gestion Financière Publique
            </CardDescription>
          </CardHeader>

          {/* Contenu */}
          <CardContent className="p-5 space-y-4">
            <h2 className="text-center text-sm font-medium text-slate-600">
              Sélectionnez l'exercice budgétaire
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : exercices && exercices.length > 0 ? (
              <>
                {/* Alerte si aucun exercice ouvert */}
                {!hasOpenExercices && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Aucun exercice ouvert</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Tous les exercices sont clôturés ou archivés. Créez un nouvel exercice pour commencer.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                  {exercices.map((ex) => {
                    const isReadOnly = ex.statut === "cloture" || ex.statut === "archive";
                    return (
                      <Button
                        key={ex.id}
                        variant="outline"
                        className={`w-full h-auto py-3 px-4 text-sm font-medium transition-all duration-200 flex justify-between items-center ${
                          isReadOnly 
                            ? "border-slate-200 hover:bg-slate-50 hover:border-slate-300" 
                            : "border-primary/30 hover:bg-primary hover:text-white hover:border-primary"
                        }`}
                        onClick={() => handleSelect(ex.annee)}
                      >
                        <span className="flex items-center gap-2">
                          {isReadOnly && <Lock className="h-3 w-3 text-muted-foreground" />}
                          Exercice {ex.annee}
                        </span>
                        <Badge variant="outline" className={getStatutBadge(ex.statut)}>
                          {getStatutLabel(ex.statut)}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-muted">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Aucun exercice disponible</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Créez votre premier exercice budgétaire pour commencer
                  </p>
                </div>
              </div>
            )}

            {/* Bouton créer un exercice */}
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un nouvel exercice
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-5">
          © 2025 ARTI - Tous droits réservés
        </p>
      </div>

      {/* Dialog création exercice */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Créer un nouvel exercice
            </DialogTitle>
            <DialogDescription>
              Créez un exercice budgétaire pour commencer à saisir vos données financières.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="annee">Année de l'exercice</Label>
              <Input
                id="annee"
                type="number"
                min={2020}
                max={2100}
                value={newYear}
                onChange={(e) => setNewYear(parseInt(e.target.value))}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p>L'exercice sera créé avec les paramètres suivants :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                <li>Code : EX{newYear}</li>
                <li>Statut : Ouvert</li>
                <li>Date d'ouverture : 1er janvier {newYear}</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateExercice} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer l'exercice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
