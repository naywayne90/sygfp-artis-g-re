import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calculator, ChevronDown, HelpCircle, Info } from "lucide-react";

interface FormulaItem {
  id: string;
  title: string;
  formula: string;
  description: string;
  example: string;
}

const BUDGET_FORMULAS: FormulaItem[] = [
  {
    id: "dotation_actuelle",
    title: "Dotation Actuelle",
    formula: "Dotation Initiale + Virements Reçus − Virements Émis",
    description:
      "La dotation actuelle reflète le montant total des crédits disponibles après les mouvements de virements. Elle évolue au fur et à mesure des ajustements budgétaires.",
    example:
      "Ex: 100 000 000 FCFA (initiale) + 10 000 000 FCFA (reçus) - 5 000 000 FCFA (émis) = 105 000 000 FCFA",
  },
  {
    id: "disponible",
    title: "Disponible",
    formula: "Dotation Actuelle − (Engagements + Réservations)",
    description:
      "Le disponible représente le montant de crédits encore utilisable pour de nouveaux engagements. C'est la valeur clé pour valider les demandes d'engagement.",
    example:
      "Ex: 105 000 000 FCFA (actuelle) - 30 000 000 FCFA (engagé) = 75 000 000 FCFA disponibles",
  },
  {
    id: "taux_execution",
    title: "Taux d'Exécution",
    formula: "(Montant Payé / Dotation Initiale) × 100",
    description:
      "Le taux d'exécution mesure le pourcentage des crédits effectivement consommés (payés) par rapport à la dotation de départ.",
    example:
      "Ex: (20 000 000 FCFA payés / 100 000 000 FCFA) × 100 = 20%",
  },
  {
    id: "taux_engagement",
    title: "Taux d'Engagement",
    formula: "(Montant Engagé / Dotation Actuelle) × 100",
    description:
      "Le taux d'engagement indique la proportion des crédits réservés pour des dépenses validées.",
    example:
      "Ex: (30 000 000 FCFA engagés / 105 000 000 FCFA) × 100 = 28,6%",
  },
];

interface BudgetFormulasProps {
  className?: string;
  compact?: boolean;
}

export function BudgetFormulas({ className, compact = false }: BudgetFormulasProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<string | null>(null);

  if (compact) {
    return (
      <TooltipProvider>
        <div className={`flex flex-wrap gap-2 ${className}`}>
          {BUDGET_FORMULAS.slice(0, 2).map((formula) => (
            <Tooltip key={formula.id}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted transition-colors"
                >
                  <Calculator className="h-3 w-3 mr-1" />
                  {formula.title}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm">
                <div className="space-y-1">
                  <p className="font-medium font-mono text-xs bg-muted px-2 py-1 rounded">
                    {formula.formula}
                  </p>
                  <p className="text-xs">{formula.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Formules de Référence Budgétaire</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{BUDGET_FORMULAS.length} formules</Badge>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid gap-3 md:grid-cols-2">
              {BUDGET_FORMULAS.map((formula) => (
                <div
                  key={formula.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer hover:border-primary/50 ${
                    selectedFormula === formula.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() =>
                    setSelectedFormula(selectedFormula === formula.id ? null : formula.id)
                  }
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      {formula.title}
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </h4>
                  </div>
                  <div className="bg-muted/50 rounded px-3 py-2 font-mono text-xs mb-2">
                    {formula.formula}
                  </div>
                  {selectedFormula === formula.id && (
                    <div className="space-y-2 animate-fade-in">
                      <p className="text-sm text-muted-foreground">{formula.description}</p>
                      <p className="text-xs text-primary/80 italic">{formula.example}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-300">
                    Comment utiliser ces formules ?
                  </p>
                  <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">
                    Ces formules sont appliquées automatiquement par le système. Le contrôle
                    de disponibilité est effectué lors de chaque engagement ou virement.
                    Un engagement ne peut être validé que si le disponible est suffisant.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
