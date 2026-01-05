import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Calendar, User, Target, Wallet, FileText, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { type Tache } from "@/hooks/useTaches";

interface TacheDetailsProps {
  tache: Tache | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ProgressHistory {
  id: string;
  previous_avancement: number;
  new_avancement: number;
  comment: string | null;
  created_at: string;
  updated_by: string | null;
}

const statutLabels: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  en_retard: "En retard",
  suspendu: "Suspendu",
  annule: "Annulé",
};

export function TacheDetails({ tache, isOpen, onClose }: TacheDetailsProps) {
  const { data: progressHistory } = useQuery({
    queryKey: ["tache-progress-history", tache?.id],
    queryFn: async () => {
      if (!tache) return [];
      const { data, error } = await supabase
        .from("tache_progress_history")
        .select("*")
        .eq("tache_id", tache.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProgressHistory[];
    },
    enabled: !!tache,
  });

  const { data: budgetConsumption } = useQuery({
    queryKey: ["tache-budget-consumption", tache?.budget_line_id],
    queryFn: async () => {
      if (!tache?.budget_line_id) return null;
      
      // Get engagements for this budget line
      const { data: engagements } = await supabase
        .from("budget_engagements")
        .select("montant")
        .eq("budget_line_id", tache.budget_line_id);
      
      const totalEngaged = engagements?.reduce((acc, e) => acc + Number(e.montant), 0) || 0;
      
      // Get budget line info
      const { data: budgetLine } = await supabase
        .from("budget_lines")
        .select("dotation_initiale")
        .eq("id", tache.budget_line_id)
        .single();
      
      const dotation = Number(budgetLine?.dotation_initiale) || 0;
      const consumptionRate = dotation > 0 ? Math.round((totalEngaged / dotation) * 100) : 0;
      
      return {
        dotation,
        engaged: totalEngaged,
        consumptionRate,
      };
    },
    enabled: !!tache?.budget_line_id,
  });

  if (!tache) return null;

  // Calculate budget vs physical execution gap
  const executionGap = budgetConsumption 
    ? Math.abs(budgetConsumption.consumptionRate - tache.avancement)
    : 0;
  const hasSignificantGap = executionGap > 20; // 20% threshold

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono">{tache.code}</span>
            <Badge>{statutLabels[tache.statut]}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div>
            <h3 className="text-lg font-semibold">{tache.libelle}</h3>
            {tache.description && (
              <p className="text-muted-foreground mt-1">{tache.description}</p>
            )}
          </div>

          {/* Alert for significant gap */}
          {hasSignificantGap && (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Écart significatif détecté
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Consommation budgétaire: {budgetConsumption?.consumptionRate}% vs Avancement physique: {tache.avancement}%
                  (écart: {executionGap}%)
                </p>
              </div>
            </div>
          )}

          {/* Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avancement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span className="font-bold">{tache.avancement}%</span>
                </div>
                <Progress value={tache.avancement} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {/* Dates */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Planning
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {tache.date_debut && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Début:</span>
                    <span>{format(new Date(tache.date_debut), "dd MMMM yyyy", { locale: fr })}</span>
                  </div>
                )}
                {tache.date_fin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fin prévue:</span>
                    <span>{format(new Date(tache.date_fin), "dd MMMM yyyy", { locale: fr })}</span>
                  </div>
                )}
                {tache.date_fin_reelle && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fin réelle:</span>
                    <span>{format(new Date(tache.date_fin_reelle), "dd MMMM yyyy", { locale: fr })}</span>
                  </div>
                )}
                {tache.duree_prevue && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée:</span>
                    <span>{tache.duree_prevue} jours</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Responsable */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Responsable
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {tache.responsable ? (
                  <div>
                    <p className="font-medium">{tache.responsable.full_name}</p>
                    <p className="text-muted-foreground">{tache.responsable.email}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Non assigné</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Programmatic linkage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Rattachement programmatique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tache.sous_activite?.activite?.action?.os && (
                  <Badge variant="outline">
                    OS: {tache.sous_activite.activite.action.os.code}
                  </Badge>
                )}
                {tache.sous_activite?.activite?.action?.mission && (
                  <Badge variant="outline">
                    Mission: {tache.sous_activite.activite.action.mission.code}
                  </Badge>
                )}
                {tache.sous_activite?.activite?.action && (
                  <Badge variant="outline">
                    Action: {tache.sous_activite.activite.action.code}
                  </Badge>
                )}
                {tache.sous_activite?.activite && (
                  <Badge variant="outline">
                    Activité: {tache.sous_activite.activite.code}
                  </Badge>
                )}
                {tache.sous_activite && (
                  <Badge variant="secondary">
                    Sous-activité: {tache.sous_activite.code}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          {(tache.budget_line || tache.budget_prevu > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tache.budget_line && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Ligne budgétaire: </span>
                    <span className="font-mono">{tache.budget_line.code}</span> - {tache.budget_line.label}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Budget prévu: </span>
                    <span className="font-bold">{tache.budget_prevu.toLocaleString()} FCFA</span>
                  </div>
                  {budgetConsumption && (
                    <div>
                      <span className="text-muted-foreground">Consommation: </span>
                      <span className="font-bold">{budgetConsumption.consumptionRate}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Livrables */}
          {tache.livrables && tache.livrables.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Livrables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {tache.livrables.map((livrable, index) => (
                    <li key={index}>{livrable}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Progress History */}
          {progressHistory && progressHistory.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Historique des mises à jour</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Ancien</TableHead>
                        <TableHead>Nouveau</TableHead>
                        <TableHead>Commentaire</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progressHistory.map((ph) => (
                        <TableRow key={ph.id}>
                          <TableCell className="text-xs">
                            {format(new Date(ph.created_at), "dd/MM/yy HH:mm", { locale: fr })}
                          </TableCell>
                          <TableCell>{ph.previous_avancement}%</TableCell>
                          <TableCell className="font-medium">{ph.new_avancement}%</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {ph.comment || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
