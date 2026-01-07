import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Check, Loader2, Lock, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ExerciceChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExerciceChangeModal({ open, onOpenChange }: ExerciceChangeModalProps) {
  const { exercice, setExercice } = useExercice();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("tous");

  const { data: exercices, isLoading } = useQuery({
    queryKey: ["exercices-modal", statutFilter],
    queryFn: async () => {
      let query = supabase
        .from("exercices_budgetaires")
        .select("*")
        .order("annee", { ascending: false });

      if (statutFilter !== "tous") {
        query = query.eq("statut", statutFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const filteredExercices = exercices?.filter(ex => {
    if (!search) return true;
    return (
      ex.annee.toString().includes(search) ||
      ex.code_exercice?.toLowerCase().includes(search.toLowerCase()) ||
      ex.libelle?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSelect = (annee: number) => {
    setExercice(annee, true);
    onOpenChange(false);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">En cours</Badge>;
      case "ouvert":
        return <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Ouvert</Badge>;
      case "cloture":
        return <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/10">Clôturé</Badge>;
      case "archive":
        return <Badge variant="secondary">Archivé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Changer d'exercice budgétaire
          </DialogTitle>
          <DialogDescription>
            Sélectionnez l'exercice sur lequel vous souhaitez travailler.
            Les exercices clôturés sont en lecture seule.
          </DialogDescription>
        </DialogHeader>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par année, code ou libellé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtres par statut */}
        <Tabs value={statutFilter} onValueChange={setStatutFilter}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tous">Tous</TabsTrigger>
            <TabsTrigger value="ouvert">Ouverts</TabsTrigger>
            <TabsTrigger value="cloture">Clôturés</TabsTrigger>
            <TabsTrigger value="archive">Archivés</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Liste des exercices */}
        <div className="max-h-[300px] overflow-y-auto space-y-2 mt-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredExercices && filteredExercices.length > 0 ? (
            filteredExercices.map((ex) => {
              const isSelected = ex.annee === exercice;
              const isReadOnly = ex.statut === "cloture" || ex.statut === "archive";

              return (
                <button
                  key={ex.id}
                  onClick={() => handleSelect(ex.annee)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                        <Calendar className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Exercice {ex.annee}</span>
                          {ex.code_exercice && (
                            <span className="text-xs text-muted-foreground">({ex.code_exercice})</span>
                          )}
                          {isReadOnly && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {ex.date_ouverture && (
                            <span>
                              Du {format(new Date(ex.date_ouverture), "dd MMM yyyy", { locale: fr })}
                            </span>
                          )}
                          {ex.date_cloture && (
                            <span>
                              au {format(new Date(ex.date_cloture), "dd MMM yyyy", { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatutBadge(ex.statut)}
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun exercice trouvé
            </div>
          )}
        </div>

        {/* Info lecture seule */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            Les exercices clôturés ou archivés sont consultables mais ne permettent pas de créer ou modifier des données.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
