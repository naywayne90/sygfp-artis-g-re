import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BudgetLineWithRelations } from "@/hooks/useBudgetLines";
import { History } from "lucide-react";

interface BudgetLineHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetLine: BudgetLineWithRelations | null;
}

const FIELD_LABELS: Record<string, string> = {
  code: "Code",
  label: "Libellé",
  dotation_initiale: "Dotation initiale",
  level: "Niveau",
  direction_id: "Direction",
  os_id: "Objectif Stratégique",
  mission_id: "Mission",
  action_id: "Action",
  activite_id: "Activité",
  nbe_id: "NBE",
  sysco_id: "SYSCO",
  source_financement: "Source financement",
  commentaire: "Commentaire",
  statut: "Statut",
};

export function BudgetLineHistory({ open, onOpenChange, budgetLine }: BudgetLineHistoryProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["budget-line-history", budgetLine?.id],
    queryFn: async () => {
      if (!budgetLine?.id) return [];

      const { data, error } = await supabase
        .from("budget_line_history")
        .select(`
          *,
          changed_by_profile:profiles!budget_line_history_changed_by_fkey(full_name)
        `)
        .eq("budget_line_id", budgetLine.id)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!budgetLine?.id,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des modifications
          </DialogTitle>
          {budgetLine && (
            <p className="text-sm text-muted-foreground">
              {budgetLine.code} - {budgetLine.label}
            </p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : history && history.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Champ</TableHead>
                <TableHead>Ancienne valeur</TableHead>
                <TableHead>Nouvelle valeur</TableHead>
                <TableHead>Modifié par</TableHead>
                <TableHead>Motif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(entry.changed_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {FIELD_LABELS[entry.field_name] || entry.field_name}
                  </TableCell>
                  <TableCell className="text-red-600 max-w-[150px] truncate">
                    {entry.old_value || "-"}
                  </TableCell>
                  <TableCell className="text-green-600 max-w-[150px] truncate">
                    {entry.new_value || "-"}
                  </TableCell>
                  <TableCell>
                    {entry.changed_by_profile?.full_name || "-"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {entry.change_reason || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune modification enregistrée
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}