import { useState, useMemo } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Check, 
  Loader2, 
  Lock, 
  Search, 
  Settings2,
  Wallet,
  TrendingUp,
  Receipt,
  Banknote
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ExerciceInitWizard } from "./ExerciceInitWizard";
import { formatMontantCompact } from "@/lib/config/sygfp-constants";

interface ExerciceChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExerciceWithStats {
  id: string;
  annee: number;
  code_exercice: string | null;
  libelle: string | null;
  statut: string;
  est_actif: boolean | null;
  date_ouverture: string | null;
  date_cloture: string | null;
  budget_total: number | null;
  // Stats calculées
  budgetTotal: number;
  budgetEngage: number;
  budgetLiquide: number;
  budgetPaye: number;
  budgetDisponible: number;
  tauxEngagement: number;
}

export function ExerciceChangeModal({ open, onOpenChange }: ExerciceChangeModalProps) {
  const { exercice, setExercice } = useExercice();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("tous");
  const [showInitWizard, setShowInitWizard] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<number | null>(null);

  // Fetch exercices avec leurs stats financières
  const { data: exercices, isLoading } = useQuery({
    queryKey: ["exercices-modal-with-stats", statutFilter],
    queryFn: async () => {
      let query = supabase
        .from("exercices_budgetaires")
        .select("*")
        .order("annee", { ascending: false });

      if (statutFilter !== "tous") {
        query = query.eq("statut", statutFilter);
      }

      const { data: exercicesData, error } = await query;
      if (error) throw error;

      // Pour chaque exercice, récupérer les stats
      const exercicesWithStats: ExerciceWithStats[] = await Promise.all(
        (exercicesData || []).map(async (ex) => {
          // Budget total
          const { data: budgetLines } = await supabase
            .from("budget_lines")
            .select("dotation_initiale")
            .eq("exercice", ex.annee);
          
          const budgetTotal = budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;

          // Engagements validés
          const { data: engagements } = await supabase
            .from("budget_engagements")
            .select("montant, statut")
            .eq("exercice", ex.annee);
          
          const budgetEngage = engagements
            ?.filter(e => e.statut === "valide")
            .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

          // Liquidations validées
          const { data: liquidations } = await supabase
            .from("budget_liquidations")
            .select("montant, statut")
            .eq("exercice", ex.annee);
          
          const budgetLiquide = liquidations
            ?.filter(l => l.statut === "valide")
            .reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

          // Règlements payés
          const { data: reglements } = await supabase
            .from("reglements")
            .select("montant, statut")
            .eq("exercice", ex.annee);
          
          const budgetPaye = reglements
            ?.filter(r => r.statut === "paye")
            .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

          // Calculs dérivés
          const budgetDisponible = Math.max(0, budgetTotal - budgetEngage);
          const tauxEngagement = budgetTotal > 0 ? Math.round((budgetEngage / budgetTotal) * 100) : 0;

          return {
            ...ex,
            budgetTotal,
            budgetEngage,
            budgetLiquide,
            budgetPaye,
            budgetDisponible,
            tauxEngagement,
          };
        })
      );

      return exercicesWithStats;
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
      case "brouillon":
        return <Badge variant="outline">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  // Récupérer l'exercice sélectionné pour preview
  const previewExercice = useMemo(() => {
    const target = selectedPreview ?? exercice;
    return exercices?.find(ex => ex.annee === target);
  }, [exercices, selectedPreview, exercice]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Liste des exercices */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Recherche */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par année, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtres par statut */}
            <Tabs value={statutFilter} onValueChange={setStatutFilter} className="mb-3">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="tous" className="text-xs">Tous</TabsTrigger>
                <TabsTrigger value="ouvert" className="text-xs">Ouverts</TabsTrigger>
                <TabsTrigger value="cloture" className="text-xs">Clôturés</TabsTrigger>
                <TabsTrigger value="archive" className="text-xs">Archivés</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Liste scrollable */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[300px]">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredExercices && filteredExercices.length > 0 ? (
                filteredExercices.map((ex) => {
                  const isSelected = ex.annee === exercice;
                  const isReadOnly = ex.statut === "cloture" || ex.statut === "archive";
                  const isPreviewing = ex.annee === selectedPreview;

                  return (
                    <button
                      key={ex.id}
                      onClick={() => handleSelect(ex.annee)}
                      onMouseEnter={() => setSelectedPreview(ex.annee)}
                      onMouseLeave={() => setSelectedPreview(null)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : isPreviewing
                          ? "border-primary/50 bg-muted/50"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                            <Calendar className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm">Exercice {ex.annee}</span>
                              {isReadOnly && (
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {ex.budgetTotal > 0 ? (
                                <span className="text-success">{formatMontantCompact(ex.budgetTotal)}</span>
                              ) : (
                                <span className="text-warning">Non chargé</span>
                              )}
                              {ex.tauxEngagement > 0 && (
                                <span className="ml-2">• {ex.tauxEngagement}% engagé</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatutBadge(ex.statut)}
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
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
          </div>

          {/* Panel de résumé financier */}
          <div className="w-64 border-l pl-4 flex flex-col">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Résumé financier
            </h4>
            
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : previewExercice ? (
              <div className="space-y-3 flex-1">
                {/* Budget total */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Budget</span>
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="font-semibold">
                    {previewExercice.budgetTotal > 0 
                      ? formatMontantCompact(previewExercice.budgetTotal)
                      : <span className="text-warning text-sm">Non chargé</span>
                    }
                  </div>
                </div>

                {/* Engagé */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Engagé</span>
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="font-semibold text-primary">
                    {formatMontantCompact(previewExercice.budgetEngage)}
                  </div>
                  {previewExercice.budgetTotal > 0 && (
                    <>
                      <Progress value={previewExercice.tauxEngagement} className="h-1.5 mt-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {previewExercice.tauxEngagement}%
                      </div>
                    </>
                  )}
                </div>

                {/* Liquidé */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Liquidé</span>
                    <Receipt className="h-3.5 w-3.5 text-secondary" />
                  </div>
                  <div className="font-semibold text-secondary">
                    {formatMontantCompact(previewExercice.budgetLiquide)}
                  </div>
                </div>

                {/* Payé */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Payé</span>
                    <Banknote className="h-3.5 w-3.5 text-success" />
                  </div>
                  <div className="font-semibold text-success">
                    {formatMontantCompact(previewExercice.budgetPaye)}
                  </div>
                </div>

                {/* Disponible */}
                <div className="p-3 rounded-lg border border-dashed">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Disponible</span>
                  </div>
                  <div className={`font-semibold ${previewExercice.budgetDisponible > 0 ? "text-success" : "text-destructive"}`}>
                    {formatMontantCompact(previewExercice.budgetDisponible)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Sélectionnez un exercice
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t mt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>Exercices clôturés = lecture seule</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              onOpenChange(false);
              setShowInitWizard(true);
            }}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Initialiser exercice
          </Button>
        </div>
      </DialogContent>

      {/* Wizard d'initialisation */}
      <ExerciceInitWizard 
        open={showInitWizard} 
        onOpenChange={setShowInitWizard} 
      />
    </Dialog>
  );
}
