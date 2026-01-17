import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  X,
  Plus,
  Minus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface SelectedBudgetLine {
  id: string;
  code: string;
  label: string;
  montant: number;
  disponible_net: number;
  dotation_actuelle: number;
  pourcentage?: number;
}

interface BudgetLineSelectorProps {
  montantTotal: number;
  selectedLines: SelectedBudgetLine[];
  onSelectionChange: (lines: SelectedBudgetLine[]) => void;
  directionId?: string | null;
  osId?: string | null;
  disabled?: boolean;
}

interface BudgetLineWithAvailability {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_actuelle: number;
  total_engage: number;
  montant_reserve: number;
  disponible_net: number;
  taux_engagement: number;
  direction?: { sigle: string | null };
  os?: { code: string };
}

export function BudgetLineSelector({
  montantTotal,
  selectedLines,
  onSelectionChange,
  directionId,
  osId,
  disabled = false,
}: BudgetLineSelectorProps) {
  const { exercice } = useExercice();
  const [search, setSearch] = useState("");
  const [ventilationMode, setVentilationMode] = useState<"single" | "multi">("single");

  // Récupérer les lignes budgétaires disponibles
  const { data: budgetLines = [], isLoading } = useQuery({
    queryKey: ["budget-lines-available", exercice, directionId, osId],
    queryFn: async () => {
      let query = supabase
        .from("budget_lines")
        .select(`
          id,
          code,
          label,
          dotation_initiale,
          dotation_modifiee,
          total_engage,
          montant_reserve,
          direction:directions(sigle),
          os:objectifs_strategiques(code)
        `)
        .eq("exercice", exercice || new Date().getFullYear())
        .eq("is_active", true)
        .order("code");

      if (directionId) query = query.eq("direction_id", directionId);
      if (osId) query = query.eq("os_id", osId);

      const { data: lines, error } = await query;
      if (error) throw error;

      // Calculer les disponibilités
      const linesWithAvailability: BudgetLineWithAvailability[] = await Promise.all(
        (lines || []).map(async (line) => {
          // Récupérer virements
          const { data: virementsRecus } = await supabase
            .from("credit_transfers")
            .select("amount")
            .eq("to_budget_line_id", line.id)
            .eq("status", "execute");

          const { data: virementsEmis } = await supabase
            .from("credit_transfers")
            .select("amount")
            .eq("from_budget_line_id", line.id)
            .eq("status", "execute");

          const totalRecus = virementsRecus?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
          const totalEmis = virementsEmis?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

          const dotation_actuelle = (line.dotation_initiale || 0) + totalRecus - totalEmis;
          const total_engage = line.total_engage || 0;
          const montant_reserve = line.montant_reserve || 0;
          const disponible_net = dotation_actuelle - total_engage - montant_reserve;
          const taux_engagement = dotation_actuelle > 0 ? (total_engage / dotation_actuelle) * 100 : 0;

          return {
            id: line.id,
            code: line.code,
            label: line.label,
            dotation_initiale: line.dotation_initiale || 0,
            dotation_actuelle,
            total_engage,
            montant_reserve,
            disponible_net,
            taux_engagement,
            direction: line.direction as { sigle: string | null } | undefined,
            os: line.os as { code: string } | undefined,
          };
        })
      );

      return linesWithAvailability;
    },
    enabled: !!exercice,
  });

  // Filtrer les lignes
  const filteredLines = budgetLines.filter(
    (line) =>
      line.code.toLowerCase().includes(search.toLowerCase()) ||
      line.label.toLowerCase().includes(search.toLowerCase())
  );

  // Montant total sélectionné
  const totalSelected = selectedLines.reduce((sum, l) => sum + l.montant, 0);
  const remainingAmount = montantTotal - totalSelected;

  // Gérer la sélection d'une ligne
  const handleToggleLine = (line: BudgetLineWithAvailability, checked: boolean) => {
    if (disabled) return;

    if (checked) {
      // En mode single, remplacer la sélection
      if (ventilationMode === "single") {
        onSelectionChange([{
          id: line.id,
          code: line.code,
          label: line.label,
          montant: montantTotal,
          disponible_net: line.disponible_net,
          dotation_actuelle: line.dotation_actuelle,
          pourcentage: 100,
        }]);
      } else {
        // En mode multi, ajouter
        onSelectionChange([
          ...selectedLines,
          {
            id: line.id,
            code: line.code,
            label: line.label,
            montant: remainingAmount > 0 ? remainingAmount : 0,
            disponible_net: line.disponible_net,
            dotation_actuelle: line.dotation_actuelle,
          },
        ]);
      }
    } else {
      onSelectionChange(selectedLines.filter((l) => l.id !== line.id));
    }
  };

  // Modifier le montant d'une ligne sélectionnée
  const handleMontantChange = (lineId: string, newMontant: number) => {
    if (disabled) return;

    onSelectionChange(
      selectedLines.map((l) =>
        l.id === lineId
          ? {
              ...l,
              montant: newMontant,
              pourcentage: montantTotal > 0 ? (newMontant / montantTotal) * 100 : 0,
            }
          : l
      )
    );
  };

  // Vérifier si une ligne peut recevoir le montant
  const canReceiveAmount = (line: BudgetLineWithAvailability, amount: number): boolean => {
    return line.disponible_net >= amount;
  };

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const isLineSelected = (lineId: string) =>
    selectedLines.some((l) => l.id === lineId);

  const getSelectedLine = (lineId: string) =>
    selectedLines.find((l) => l.id === lineId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Sélection des lignes budgétaires
            </CardTitle>
            <CardDescription>
              Montant à imputer: <strong>{formatMontant(montantTotal)}</strong>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={ventilationMode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setVentilationMode("single");
                if (selectedLines.length > 1) {
                  onSelectionChange([selectedLines[0]]);
                }
              }}
              disabled={disabled}
            >
              Ligne unique
            </Button>
            <Button
              variant={ventilationMode === "multi" ? "default" : "outline"}
              size="sm"
              onClick={() => setVentilationMode("multi")}
              disabled={disabled}
            >
              Multi-lignes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé de la sélection */}
        {selectedLines.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Montant réparti:</span>
              <span className={totalSelected === montantTotal ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                {formatMontant(totalSelected)} / {formatMontant(montantTotal)}
              </span>
            </div>
            <Progress value={(totalSelected / montantTotal) * 100} className="h-2" />
            
            {remainingAmount > 0 && (
              <Alert variant="default" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Répartition incomplète</AlertTitle>
                <AlertDescription>
                  Il reste {formatMontant(remainingAmount)} à répartir
                </AlertDescription>
              </Alert>
            )}

            {/* Lignes sélectionnées */}
            <div className="space-y-2 mt-4">
              <h4 className="font-medium text-sm">Lignes sélectionnées:</h4>
              {selectedLines.map((line) => {
                const isInsufficient = line.montant > line.disponible_net;
                return (
                  <div
                    key={line.id}
                    className={`flex items-center gap-3 p-2 rounded-md border ${
                      isInsufficient ? "border-destructive bg-destructive/5" : "border-border"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm">{line.code}</div>
                      <div className="text-xs text-muted-foreground truncate">{line.label}</div>
                      <div className="text-xs">
                        Disponible: <span className={isInsufficient ? "text-destructive" : "text-green-600"}>
                          {formatMontant(line.disponible_net)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ventilationMode === "multi" && (
                        <Input
                          type="number"
                          value={line.montant}
                          onChange={(e) => handleMontantChange(line.id, Number(e.target.value))}
                          className="w-32 text-right"
                          disabled={disabled}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectionChange(selectedLines.filter((l) => l.id !== line.id))}
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {isInsufficient && (
                      <Badge variant="destructive" className="shrink-0">
                        Insuffisant
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code ou libellé..."
            className="pl-9"
            disabled={disabled}
          />
        </div>

        {/* Liste des lignes */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement des lignes budgétaires...
          </div>
        ) : filteredLines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune ligne budgétaire trouvée</p>
          </div>
        ) : (
          <div className="rounded-md border max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Dotation actuelle</TableHead>
                  <TableHead className="text-right">Disponible net</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLines.map((line) => {
                  const isSelected = isLineSelected(line.id);
                  const selectedLine = getSelectedLine(line.id);
                  const canReceive = canReceiveAmount(line, montantTotal);
                  const isInsufficient = selectedLine && selectedLine.montant > line.disponible_net;

                  return (
                    <TableRow
                      key={line.id}
                      className={`cursor-pointer ${isSelected ? "bg-primary/5" : ""} ${
                        !canReceive && !isSelected ? "opacity-50" : ""
                      }`}
                      onClick={() => {
                        if (!disabled && (canReceive || isSelected)) {
                          handleToggleLine(line, !isSelected);
                        }
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggleLine(line, !!checked)}
                          disabled={disabled || (!canReceive && !isSelected)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {line.code}
                        {line.direction?.sigle && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {line.direction.sigle}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {line.label}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMontant(line.dotation_actuelle)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        line.disponible_net < 0 ? "text-destructive" :
                        line.disponible_net < montantTotal ? "text-orange-600" :
                        "text-green-600"
                      }`}>
                        {formatMontant(line.disponible_net)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(line.taux_engagement, 100)}
                            className="w-16 h-2"
                          />
                          <span className="text-xs text-muted-foreground">
                            {line.taux_engagement.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {canReceive ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Limité
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Message d'aide */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Disponible net</strong> = Dotation actuelle − Engagements − Réservations.
            La réservation bloque le montant jusqu'à la création de l'engagement.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
