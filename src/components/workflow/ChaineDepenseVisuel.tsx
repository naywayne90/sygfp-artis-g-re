import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  FileText,
  FileEdit,
  Briefcase,
  ShoppingCart,
  CreditCard,
  Receipt,
  FileCheck,
  Banknote,
  ArrowRight,
  ChevronRight,
  Info,
  CircleDollarSign,
} from "lucide-react";

interface StepInfo {
  id: string;
  numero: number;
  titre: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  couleur: string;
  optionnel?: boolean;
}

const etapes: StepInfo[] = [
  {
    id: "note-sef",
    numero: 1,
    titre: "Note SEF",
    description: "Sans Engagement Financier - Approbation DG sans impact budget",
    url: "/notes-sef",
    icon: FileText,
    couleur: "bg-blue-500",
  },
  {
    id: "note-aef",
    numero: 2,
    titre: "Note AEF",
    description: "Avec Engagement Financier - Requiert imputation budgétaire",
    url: "/notes-aef",
    icon: FileEdit,
    couleur: "bg-indigo-500",
  },
  {
    id: "expression-besoin",
    numero: 3,
    titre: "Expression Besoin",
    description: "Formalisation détaillée du besoin et des spécifications",
    url: "/execution/expression-besoin",
    icon: Briefcase,
    couleur: "bg-violet-500",
  },
  {
    id: "marche",
    numero: 4,
    titre: "Marché",
    description: "Passation de marché si montant supérieur au seuil",
    url: "/marches",
    icon: ShoppingCart,
    couleur: "bg-purple-500",
    optionnel: true,
  },
  {
    id: "engagement",
    numero: 5,
    titre: "Engagement",
    description: "Réservation des crédits budgétaires",
    url: "/engagements",
    icon: CreditCard,
    couleur: "bg-amber-500",
  },
  {
    id: "liquidation",
    numero: 6,
    titre: "Liquidation",
    description: "Constatation du service fait et calcul du montant dû",
    url: "/liquidations",
    icon: Receipt,
    couleur: "bg-orange-500",
  },
  {
    id: "ordonnancement",
    numero: 7,
    titre: "Ordonnancement",
    description: "Émission de l'ordre de paiement par l'ordonnateur",
    url: "/ordonnancements",
    icon: FileCheck,
    couleur: "bg-rose-500",
  },
  {
    id: "reglement",
    numero: 8,
    titre: "Règlement",
    description: "Paiement effectif au bénéficiaire",
    url: "/reglements",
    icon: Banknote,
    couleur: "bg-green-500",
  },
];

interface ChaineDepenseVisuelProps {
  compact?: boolean;
  className?: string;
}

export function ChaineDepenseVisuel({ compact = false, className }: ChaineDepenseVisuelProps) {
  const navigate = useNavigate();
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  if (compact) {
    return (
      <Card className={cn("border-primary/20 bg-gradient-to-r from-primary/5 to-transparent", className)}>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <TooltipProvider delayDuration={100}>
              {etapes.map((etape, index) => (
                <div key={etape.id} className="flex items-center shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-10 w-10 rounded-full p-0",
                          etape.couleur,
                          "text-white hover:opacity-80"
                        )}
                        onClick={() => navigate(etape.url)}
                      >
                        <etape.icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="font-semibold">{etape.numero}. {etape.titre}</p>
                      <p className="text-xs text-muted-foreground">{etape.description}</p>
                      {etape.optionnel && (
                        <Badge variant="outline" className="mt-1 text-[10px]">Optionnel</Badge>
                      )}
                    </TooltipContent>
                  </Tooltip>
                  {index < etapes.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />
                  )}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-primary/20 overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CircleDollarSign className="h-5 w-5 text-primary" />
          Chaîne de la Dépense
          <Badge variant="secondary" className="ml-2 text-xs">8 étapes</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cliquez sur une étape pour accéder au module correspondant
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Desktop: 2 rows of 4 */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 gap-3 mb-3">
            {etapes.slice(0, 4).map((etape, index) => (
              <EtapeCard 
                key={etape.id} 
                etape={etape} 
                isHovered={hoveredStep === etape.id}
                onHover={setHoveredStep}
                onClick={() => navigate(etape.url)}
                showArrow={index < 3}
              />
            ))}
          </div>
          
          {/* Arrow connector between rows */}
          <div className="flex justify-end pr-6 my-2">
            <ArrowRight className="h-5 w-5 text-primary rotate-90" />
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {/* Reverse order for visual flow */}
            {etapes.slice(4).reverse().map((etape, index) => (
              <EtapeCard 
                key={etape.id} 
                etape={etape}
                isHovered={hoveredStep === etape.id}
                onHover={setHoveredStep}
                onClick={() => navigate(etape.url)}
                showArrow={index < 3}
                arrowLeft
              />
            ))}
          </div>
        </div>

        {/* Mobile: vertical list */}
        <div className="md:hidden space-y-2">
          {etapes.map((etape, index) => (
            <div key={etape.id} className="flex items-center gap-2">
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start gap-3 h-auto py-3",
                  hoveredStep === etape.id && "border-primary"
                )}
                onClick={() => navigate(etape.url)}
                onMouseEnter={() => setHoveredStep(etape.id)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <span className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold",
                  etape.couleur
                )}>
                  {etape.numero}
                </span>
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    {etape.titre}
                    {etape.optionnel && (
                      <Badge variant="outline" className="text-[10px]">Optionnel</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{etape.description}</div>
                </div>
              </Button>
              {index < etapes.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Les étapes se débloquent progressivement</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px]">Optionnel</Badge>
            <span>= selon le montant</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EtapeCardProps {
  etape: StepInfo;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
  showArrow?: boolean;
  arrowLeft?: boolean;
}

function EtapeCard({ etape, isHovered, onHover, onClick, showArrow, arrowLeft }: EtapeCardProps) {
  return (
    <div className="flex items-center gap-1">
      {arrowLeft && showArrow && (
        <ArrowRight className="h-4 w-4 text-primary shrink-0 rotate-180" />
      )}
      <button
        className={cn(
          "flex-1 p-3 rounded-lg border-2 transition-all text-left hover:shadow-md",
          isHovered 
            ? "border-primary bg-primary/5 shadow-sm" 
            : "border-border hover:border-primary/50"
        )}
        onClick={onClick}
        onMouseEnter={() => onHover(etape.id)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold",
            etape.couleur
          )}>
            {etape.numero}
          </span>
          <etape.icon className={cn("h-4 w-4", isHovered ? "text-primary" : "text-muted-foreground")} />
          {etape.optionnel && (
            <Badge variant="outline" className="text-[9px] px-1 py-0">Opt.</Badge>
          )}
        </div>
        <div className="font-medium text-sm mb-1">{etape.titre}</div>
        <div className="text-[11px] text-muted-foreground line-clamp-2">{etape.description}</div>
      </button>
      {!arrowLeft && showArrow && (
        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
      )}
    </div>
  );
}
