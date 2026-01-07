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
import { BudgetLineWithRelations, getDisplayBudgetCode } from "@/hooks/useBudgetLines";
import { supabase } from "@/integrations/supabase/client";

const getVersionBadge = (version: string) => {
  switch (version) {
    case "V2":
      return <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1 border-primary text-primary">V2</Badge>;
    case "V1":
      return <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">V1</Badge>;
    default:
      return null;
  }
};

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
  const [executionData, setExecutionData] = useState<Record<string, {
    engage: number;
    liquide: number;
    ordonnance: number;
    paye: number;
  }>>({});

  useEffect(() => {
    const fetchExecutionData = async () => {
      if (lines.length === 0) return;

      const lineIds = lines.map(l => l.id);

      // Fetch engagements validés
      const { data: engagements } = await supabase
        .from("budget_engagements")
        .select("budget_line_id, montant, statut")
        .in("budget_line_id", lineIds)
        .eq("exercice", exercice)
        .eq("statut", "valide");

      // Fetch liquidations validées
      const { data: liquidations } = await supabase
        .from("budget_liquidations")
        .select("engagement:budget_engagements(budget_line_id), montant, statut")
        .eq("exercice", exercice)
        .eq("statut", "valide");

      // Fetch ordonnancements validés
      const { data: ordonnancements } = await supabase
        .from("ordonnancements")
        .select("liquidation:budget_liquidations(engagement:budget_engagements(budget_line_id)), montant, statut")
        .eq("exercice", exercice)
        .in("statut", ["valide", "signe"]);

      // Fetch règlements payés
      const { data: reglements } = await supabase
        .from("reglements")
        .select("ordonnancement:ordonnancements(liquidation:budget_liquidations(engagement:budget_engagements(budget_line_id))), montant, statut")
        .eq("exercice", exercice)
        .eq("statut", "paye");

      const execMap: Record<string, { engage: number; liquide: number; ordonnance: number; paye: number }> = {};

      // Initialize
      lineIds.forEach(id => {
        execMap[id] = { engage: 0, liquide: 0, ordonnance: 0, paye: 0 };
      });

      // Sum engagements
      engagements?.forEach(e => {
        if (e.budget_line_id && execMap[e.budget_line_id]) {
          execMap[e.budget_line_id].engage += e.montant || 0;
        }
      });

      // Sum liquidations
      liquidations?.forEach(l => {
        const lineId = (l.engagement as any)?.budget_line_id;
        if (lineId && execMap[lineId]) {
          execMap[lineId].liquide += l.montant || 0;
        }
      });

      // Sum ordonnancements
      ordonnancements?.forEach(o => {
        const lineId = (o.liquidation as any)?.engagement?.budget_line_id;
        if (lineId && execMap[lineId]) {
          execMap[lineId].ordonnance += o.montant || 0;
        }
      });

      // Sum règlements
      reglements?.forEach(r => {
        const lineId = (r.ordonnancement as any)?.liquidation?.engagement?.budget_line_id;
        if (lineId && execMap[lineId]) {
          execMap[lineId].paye += r.montant || 0;
        }
      });

      setExecutionData(execMap);
    };

    fetchExecutionData();
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
            <TableHead className="text-right">Liquidé</TableHead>
            <TableHead className="text-right">Payé</TableHead>
            <TableHead className="text-right">Disponible</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                Aucune ligne budgétaire trouvée
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line) => {
              const exec = executionData[line.id] || { engage: 0, liquide: 0, ordonnance: 0, paye: 0 };
              const available = line.dotation_initiale - exec.engage;
              const displayCode = getDisplayBudgetCode(line);
              const tauxExec = line.dotation_initiale > 0 
                ? Math.round((exec.paye / line.dotation_initiale) * 100) 
                : 0;

              return (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center">
                      <span>{displayCode.code}</span>
                      {getVersionBadge(displayCode.version)}
                    </div>
                    {displayCode.version === 'V2' && line.code && (
                      <div className="text-xs text-muted-foreground">Réf: {line.code}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{line.label}</div>
                    {line.nomenclature_nbe && (
                      <div className="text-xs text-muted-foreground">
                        NBE: {line.nomenclature_nbe.code}
                      </div>
                    )}
                    {line.ref_nve && (
                      <div className="text-xs text-muted-foreground">
                        NVE: {line.ref_nve.code_nve}
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
                    {formatCurrency(exec.engage)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-600">
                    {formatCurrency(exec.liquide)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatCurrency(exec.paye)}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${available < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(available)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(line.statut)}
                      {tauxExec > 0 && (
                        <div className="text-xs text-muted-foreground">{tauxExec}% exécuté</div>
                      )}
                    </div>
                  </TableCell>
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