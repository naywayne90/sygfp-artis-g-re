import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  CheckCircle, 
  Clock, 
  FileText,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BudgetVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetVersionHistory({ open, onOpenChange }: BudgetVersionHistoryProps) {
  const { exercice } = useExercice();

  const { data: versions, isLoading } = useQuery({
    queryKey: ["budget-versions", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_versions")
        .select(`
          *,
          validated_by_profile:profiles!budget_versions_validated_by_fkey(full_name),
          created_by_profile:profiles!budget_versions_created_by_fkey(full_name)
        `)
        .eq("exercice", exercice || new Date().getFullYear())
        .order("version", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open && !!exercice,
  });

  const { data: imports } = useQuery({
    queryKey: ["budget-imports", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_imports")
        .select("*")
        .eq("exercice", exercice || new Date().getFullYear())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open && !!exercice,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valide":
        return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
      case "soumis":
        return <Badge className="bg-blue-100 text-blue-800">Soumis</Badge>;
      default:
        return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique du Budget {exercice}
          </DialogTitle>
          <DialogDescription>
            Versions et imports de la structure budgétaire
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Versions */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Versions validées
              </h3>
              
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Chargement...</p>
              ) : versions?.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune version validée</p>
              ) : (
                <div className="space-y-3">
                  {versions?.map((version: any) => (
                    <div key={version.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{version.label}</span>
                            {getStatusBadge(version.status)}
                            {version.version === 1 && (
                              <Badge variant="secondary">Initial</Badge>
                            )}
                          </div>
                          {version.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {version.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>Version {version.version}</div>
                          <div>{format(new Date(version.created_at), "dd MMM yyyy", { locale: fr })}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Dotation totale:</span>
                          <span className="ml-2 font-medium">{formatCurrency(version.total_dotation || 0)}</span>
                        </div>
                        {version.validated_at && (
                          <div>
                            <span className="text-muted-foreground">Validé le:</span>
                            <span className="ml-2">{format(new Date(version.validated_at), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Imports */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Historique des imports
              </h3>
              
              {imports?.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun import effectué</p>
              ) : (
                <div className="space-y-2">
                  {imports?.map((imp: any) => (
                    <div key={imp.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{imp.file_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(imp.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">{imp.success_rows} OK</span>
                        {imp.error_rows > 0 && (
                          <span className="text-red-600">{imp.error_rows} erreurs</span>
                        )}
                        <Badge variant={imp.status === "termine" ? "default" : "secondary"}>
                          {imp.status === "termine" ? "Terminé" : imp.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}