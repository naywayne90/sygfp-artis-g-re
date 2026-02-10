import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calculator,
  TrendingDown,
  Lock,
  Info,
  Wallet,
  Banknote,
} from "lucide-react";

export interface BudgetCalculation {
  dotation_initiale: number;
  virements_recus: number;
  virements_emis: number;
  dotation_actuelle: number;
  cumul_engage: number;
  montant_reserve: number;
  disponible_brut: number;
  disponible_net: number;
}

interface ImputationSummaryCardProps {
  montantTotal: number;
  montantImpute: number;
  disponibleAvant: number;
  disponibleApres: number;
  dotationActuelle: number;
  dotationInitiale?: number;
  virementsRecus?: number;
  virementsEmis?: number;
  cumulEngage?: number;
  montantReserve: number;
  isValid: boolean;
  isForced?: boolean;
  validationErrors: string[];
  budgetLineCode?: string;
  budgetLineLabel?: string;
  showDetailedCalculation?: boolean;
}

export function ImputationSummaryCard({
  _montantTotal,
  montantImpute,
  disponibleAvant,
  disponibleApres,
  dotationActuelle,
  dotationInitiale = 0,
  virementsRecus = 0,
  virementsEmis = 0,
  cumulEngage = 0,
  montantReserve,
  isValid,
  isForced = false,
  validationErrors,
  budgetLineCode,
  budgetLineLabel,
  showDetailedCalculation = true,
}: ImputationSummaryCardProps) {
  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const tauxEngagement = dotationActuelle > 0
    ? ((dotationActuelle - disponibleApres) / dotationActuelle) * 100
    : 0;

  const tauxEngagementActuel = dotationActuelle > 0
    ? (cumulEngage / dotationActuelle) * 100
    : 0;

  const isInsufficient = montantImpute > disponibleAvant;
  const impactPct = disponibleAvant > 0 ? (montantImpute / disponibleAvant) * 100 : 0;

  // Calculs détaillés
  const calculatedDotationActuelle = dotationInitiale + virementsRecus - virementsEmis;
  const disponibleBrut = calculatedDotationActuelle - cumulEngage;
  const _calculatedDisponibleNet = disponibleBrut - montantReserve;

  return (
    <TooltipProvider>
      <Card className={`${isInsufficient && !isForced ? "border-destructive" : isValid ? "border-green-500" : ""}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Récapitulatif budgétaire
            {isValid && (
              <Badge variant="outline" className="text-green-600 border-green-600 ml-auto">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Validé
              </Badge>
            )}
            {isInsufficient && !isForced && (
              <Badge variant="destructive" className="ml-auto">
                <XCircle className="h-3 w-3 mr-1" />
                Bloqué
              </Badge>
            )}
            {isForced && (
              <Badge variant="outline" className="text-orange-600 border-orange-600 ml-auto">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Forcé
              </Badge>
            )}
          </CardTitle>
          {budgetLineCode && (
            <div className="text-sm text-muted-foreground">
              Ligne: <span className="font-mono">{budgetLineCode}</span>
              {budgetLineLabel && <span className="ml-1">- {budgetLineLabel}</span>}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calcul détaillé de la dotation actuelle */}
          {showDetailedCalculation && dotationInitiale > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-sm space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium">
                <Wallet className="h-4 w-4" />
                Calcul de la dotation actuelle
              </div>
              <div className="space-y-1 pl-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">(A) Dotation initiale:</span>
                  <span className="font-mono">{formatMontant(dotationInitiale)}</span>
                </div>
                {virementsRecus > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>+ Virements reçus:</span>
                    <span className="font-mono">+{formatMontant(virementsRecus)}</span>
                  </div>
                )}
                {virementsEmis > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>− Virements émis:</span>
                    <span className="font-mono">−{formatMontant(virementsEmis)}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between font-medium">
                  <span>= Dotation actuelle:</span>
                  <span className="font-mono text-blue-600">{formatMontant(dotationActuelle || calculatedDotationActuelle)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Formules de calcul du disponible */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground font-medium">
              <Banknote className="h-4 w-4" />
              Calcul du disponible
            </div>
            <div className="space-y-1 pl-6">
              <div className="flex justify-between">
                <Tooltip>
                  <TooltipTrigger className="text-muted-foreground flex items-center gap-1 cursor-help">
                    Dotation actuelle
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dotation initiale + Virements reçus − Virements émis</p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-mono">{formatMontant(dotationActuelle)}</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 cursor-help">
                    − (B) Cumul engagé
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total des engagements validés sur cette ligne</p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-mono">−{formatMontant(cumulEngage || (dotationActuelle - disponibleAvant - montantReserve))}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">= Disponible brut:</span>
                <span className={`font-mono ${disponibleBrut < 0 ? "text-destructive" : ""}`}>
                  {formatMontant(disponibleBrut || (disponibleAvant + montantReserve))}
                </span>
              </div>
              <div className="flex justify-between text-amber-600">
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 cursor-help">
                    − (C) Réservations
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Montants réservés pour des imputations en cours</p>
                  </TooltipContent>
                </Tooltip>
                <span className="font-mono">−{formatMontant(montantReserve)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-bold">
                <span>= Disponible net:</span>
                <span className={`font-mono ${disponibleAvant < 0 ? "text-destructive" : "text-green-600"}`}>
                  {formatMontant(disponibleAvant)}
                </span>
              </div>
            </div>
          </div>

          {/* Taux d'engagement actuel */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Taux d'engagement actuel:</span>
            <Progress value={Math.min(tauxEngagementActuel, 100)} className="flex-1 h-2" />
            <span className={`font-mono text-xs w-12 text-right ${tauxEngagementActuel > 100 ? "text-destructive" : tauxEngagementActuel > 80 ? "text-orange-600" : ""}`}>
              {tauxEngagementActuel.toFixed(1)}%
            </span>
          </div>

        {/* Impact de l'imputation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Montant à réserver:
            </span>
            <span className="font-bold text-primary">{formatMontant(montantImpute)}</span>
          </div>

          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            <Progress value={impactPct} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground w-12 text-right">
              {impactPct.toFixed(0)}%
            </span>
          </div>

          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Disponible après imputation:</span>
            <span className={`font-mono font-medium ${disponibleApres < 0 ? "text-destructive" : "text-green-600"}`}>
              {formatMontant(disponibleApres)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taux d'engagement projeté:</span>
            <span className={`font-mono ${tauxEngagement > 100 ? "text-destructive" : tauxEngagement > 80 ? "text-orange-600" : ""}`}>
              {tauxEngagement.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Erreurs de validation */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Validation impossible</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside text-sm mt-1">
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Avertissement si dépassement avec force */}
        {isInsufficient && (
          <Alert variant={isForced ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Disponible insuffisant</AlertTitle>
            <AlertDescription>
              Le montant demandé ({formatMontant(montantImpute)}) dépasse le disponible net ({formatMontant(disponibleAvant)}).
              {isForced ? (
                <span className="block mt-1 font-medium">
                  L'imputation sera forcée avec justification.
                </span>
              ) : (
                <span className="block mt-1">
                  Cochez "Forcer l'imputation" et fournissez une justification pour continuer.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Succès */}
        {isValid && !isInsufficient && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Imputation validée</AlertTitle>
            <AlertDescription className="text-green-600/80">
              Le budget est suffisant. La réservation sera effectuée et le dossier créé.
            </AlertDescription>
          </Alert>
        )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
