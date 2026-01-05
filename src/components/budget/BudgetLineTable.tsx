import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Send, Check, X, Trash2, History } from "lucide-react";
import { BudgetLineWithRelations } from "@/hooks/useBudgetLines";
import { supabase } from "@/integrations/supabase/client";

interface BudgetLineTableProps {
  lines: BudgetLineWithRelations[];
  onEdit: (line: BudgetLineWithRelations) => void;
  onSubmit: (id: string) => void;
  onValidate: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (line: BudgetLineWithRelations) => void;
  exercice: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA";
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "brouillon":
      return <Badge variant="secondary">Brouillon</Badge>;
    case "soumis":
      return <Badge variant="default" className="bg-blue-500">Soumis</Badge>;
    case "valide":
      return <Badge variant="default" className="bg-green-500">Validé</Badge>;
    case "rejete":
      return <Badge variant="destructive">Rejeté</Badge>;
    default:
      return <Badge variant="secondary">Brouillon</Badge>;
  }
};

export function BudgetLineTable({
  lines,
  onEdit,
  onSubmit,
  onValidate,
  onReject,
  onDelete,
  onViewHistory,
  exercice,
}: BudgetLineTableProps) {
  const [engagements, setEngagements] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchEngagements = async () => {
      const engMap: Record<string, number> = {};
      
      for (const line of lines) {
        const { data } = await supabase
          .from("budget_engagements")
          .select("montant")
          .eq("budget_line_id", line.id)
          .eq("exercice", exercice);
        
        engMap[line.id] = data?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
      }
      
      setEngagements(engMap);
    };

    if (lines.length > 0) {
      fetchEngagements();
    }
  }, [lines, exercice]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Code</TableHead>
            <TableHead>Libellé</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead className="text-right">Dotation</TableHead>
            <TableHead className="text-right">Engagé</TableHead>
            <TableHead className="text-right">Disponible</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Aucune ligne budgétaire trouvée
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line) => {
              const engaged = engagements[line.id] || 0;
              const available = line.dotation_initiale - engaged;

              return (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-sm">{line.code}</TableCell>
                  <TableCell>
                    <div className="font-medium">{line.label}</div>
                    {line.nomenclature_nbe && (
                      <div className="text-xs text-muted-foreground">
                        NBE: {line.nomenclature_nbe.code}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {line.direction?.code || "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(line.dotation_initiale)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-orange-600">
                    {formatCurrency(engaged)}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${available < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(available)}
                  </TableCell>
                  <TableCell>{getStatusBadge(line.statut)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(line)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewHistory(line)}>
                          <History className="mr-2 h-4 w-4" />
                          Historique
                        </DropdownMenuItem>
                        {line.statut === "brouillon" && (
                          <DropdownMenuItem onClick={() => onSubmit(line.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Soumettre
                          </DropdownMenuItem>
                        )}
                        {line.statut === "soumis" && (
                          <>
                            <DropdownMenuItem onClick={() => onValidate(line.id)}>
                              <Check className="mr-2 h-4 w-4 text-green-600" />
                              Valider
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                const reason = prompt("Motif du rejet:");
                                if (reason) onReject(line.id, reason);
                              }}
                            >
                              <X className="mr-2 h-4 w-4 text-red-600" />
                              Rejeter
                            </DropdownMenuItem>
                          </>
                        )}
                        {line.statut === "brouillon" && (
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm("Supprimer cette ligne ?")) onDelete(line.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}