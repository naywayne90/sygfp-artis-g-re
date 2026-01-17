/**
 * DossierImputationSummary - Résumé d'imputation dans l'entête dossier
 * Affiche les informations budgétaires clés : dotation, engagé, disponible
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Banknote,
  Lock,
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetLineInfo {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_actuelle?: number;
  total_engage?: number;
  montant_reserve?: number;
}

interface DossierImputationSummaryProps {
  /** Ligne budgétaire principale */
  budgetLine?: BudgetLineInfo | null;
  /** Montant imputé pour ce dossier */
  montantImpute: number;
  /** Montant total engagé */
  montantEngage?: number;
  /** Montant liquidé */
  montantLiquide?: number;
  /** Montant payé */
  montantPaye?: number;
  /** Date d'imputation */
  imputedAt?: string | null;
  /** Par qui */
  imputedBy?: { first_name: string | null; last_name: string | null } | null;
  /** Mode compact */
  compact?: boolean;
  /** Afficher dans une carte ou inline */
  variant?: "card" | "inline" | "minimal";
}

export function DossierImputationSummary({
  budgetLine,
  montantImpute,
  montantEngage = 0,
  montantLiquide = 0,
  montantPaye = 0,
  imputedAt,
  imputedBy,
  compact = false,
  variant = "card",
}: DossierImputationSummaryProps) {
  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const formatMontantShort = (montant: number) => {
    if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1)} Mrd`;
    if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1)} M`;
    if (montant >= 1_000) return `${(montant / 1_000).toFixed(0)} K`;
    return montant.toString();
  };

  if (!budgetLine) {
    // Pas encore imputé
    if (variant === "minimal") {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Lock className="h-3 w-3 mr-1" />
          Non imputé
        </Badge>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>En attente d'imputation budgétaire</span>
      </div>
    );
  }

  const dotation = budgetLine.dotation_actuelle ?? budgetLine.dotation_initiale;
  const engage = budgetLine.total_engage ?? 0;
  const reserve = budgetLine.montant_reserve ?? 0;
  const disponible = dotation - engage - reserve;
  const tauxEngagement = dotation > 0 ? (engage / dotation) * 100 : 0;

  // Progression du dossier
  const tauxLiquidation = montantEngage > 0 ? (montantLiquide / montantEngage) * 100 : 0;
  const tauxPaiement = montantLiquide > 0 ? (montantPaye / montantLiquide) * 100 : 0;

  // Variant minimal : juste un badge
  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "cursor-help",
                tauxEngagement > 80 ? "border-orange-500 text-orange-600" : "border-green-500 text-green-600"
              )}
            >
              <CreditCard className="h-3 w-3 mr-1" />
              {budgetLine.code}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{budgetLine.label}</p>
              <p>Dotation: {formatMontant(dotation)}</p>
              <p>Engagé: {formatMontant(engage)} ({tauxEngagement.toFixed(0)}%)</p>
              <p>Disponible: {formatMontant(disponible)}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Variant inline : ligne compacte
  if (variant === "inline" || compact) {
    return (
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm font-medium">{budgetLine.code}</span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Banknote className="h-3 w-3 text-muted-foreground" />
                <span>{formatMontantShort(dotation)}</span>
              </TooltipTrigger>
              <TooltipContent>Dotation: {formatMontant(dotation)}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <span className="text-muted-foreground">|</span>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <span className="text-orange-600">{formatMontantShort(engage)}</span>
              </TooltipTrigger>
              <TooltipContent>Engagé: {formatMontant(engage)}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <span className="text-muted-foreground">|</span>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className={cn(
                "flex items-center gap-1 font-medium",
                disponible < 0 ? "text-destructive" : "text-green-600"
              )}>
                {formatMontantShort(disponible)}
              </TooltipTrigger>
              <TooltipContent>Disponible: {formatMontant(disponible)}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Progress value={tauxEngagement} className="w-16 h-2" />
          <span className={cn(
            "text-xs font-medium",
            tauxEngagement > 80 ? "text-orange-600" : ""
          )}>
            {tauxEngagement.toFixed(0)}%
          </span>
          {tauxEngagement > 80 && <TrendingUp className="h-3 w-3 text-orange-600" />}
        </div>
      </div>
    );
  }

  // Variant card : carte complète
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Imputation budgétaire
          {tauxEngagement > 80 ? (
            <Badge variant="outline" className="text-orange-600 border-orange-600 ml-auto">
              <TrendingUp className="h-3 w-3 mr-1" />
              {tauxEngagement.toFixed(0)}% engagé
            </Badge>
          ) : (
            <Badge variant="outline" className="text-green-600 border-green-600 ml-auto">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Disponible
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ligne budgétaire */}
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-sm">{budgetLine.code}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{budgetLine.label}</p>
        </div>

        {/* Grille de montants */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-background rounded border">
            <p className="text-xs text-muted-foreground">Dotation</p>
            <p className="font-bold text-sm">{formatMontantShort(dotation)}</p>
          </div>
          <div className="p-2 bg-background rounded border">
            <p className="text-xs text-muted-foreground">Engagé</p>
            <p className="font-bold text-sm text-orange-600">{formatMontantShort(engage)}</p>
          </div>
          <div className="p-2 bg-background rounded border">
            <p className="text-xs text-muted-foreground">Réservé</p>
            <p className="font-bold text-sm text-amber-600">{formatMontantShort(reserve)}</p>
          </div>
          <div className={cn(
            "p-2 rounded border",
            disponible < 0 ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20"
          )}>
            <p className="text-xs text-muted-foreground">Disponible</p>
            <p className={cn(
              "font-bold text-sm",
              disponible < 0 ? "text-destructive" : "text-green-600"
            )}>
              {formatMontantShort(disponible)}
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Taux d'engagement</span>
            <span className={tauxEngagement > 80 ? "text-orange-600 font-medium" : ""}>
              {tauxEngagement.toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.min(tauxEngagement, 100)} className="h-2" />
        </div>

        {/* Montant du dossier */}
        {montantImpute > 0 && (
          <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-sm">Montant de ce dossier:</span>
            </div>
            <span className="font-bold text-primary">{formatMontant(montantImpute)}</span>
          </div>
        )}

        {/* Progression du dossier */}
        {montantEngage > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Progression du dossier:</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Engagé</p>
                <p className="font-bold">{formatMontantShort(montantEngage)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Liquidé</p>
                <p className="font-bold text-blue-600">
                  {formatMontantShort(montantLiquide)} ({tauxLiquidation.toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Payé</p>
                <p className="font-bold text-green-600">
                  {formatMontantShort(montantPaye)} ({tauxPaiement.toFixed(0)}%)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info imputation */}
        {imputedAt && (
          <p className="text-xs text-muted-foreground text-right">
            Imputé le {new Date(imputedAt).toLocaleDateString("fr-FR")}
            {imputedBy && ` par ${imputedBy.first_name} ${imputedBy.last_name}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Version en-tête compacte pour afficher dans le titre du dossier
 */
export function DossierImputationBadge({
  budgetLine,
  montantImpute,
}: {
  budgetLine?: BudgetLineInfo | null;
  montantImpute: number;
}) {
  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant);

  if (!budgetLine) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Lock className="h-3 w-3" />
        Non imputé
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 font-mono">
              <CreditCard className="h-3 w-3" />
              {budgetLine.code}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Banknote className="h-3 w-3" />
              {formatMontant(montantImpute)} FCFA
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{budgetLine.label}</p>
          <p className="text-xs text-muted-foreground">Montant imputé: {formatMontant(montantImpute)} FCFA</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
