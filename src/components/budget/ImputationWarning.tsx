/**
 * Composant d'affichage des warnings d'imputation
 *
 * Affiche les alertes quand une imputation n'est pas trouvée
 * dans le budget ou présente des anomalies
 */

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Info,
  FileWarning,
} from "lucide-react";
import { type ImputationValidationResult } from "@/lib/budget/imputation-utils";
import { splitImputation } from "@/lib/budget/imputation-utils";

// ============================================================================
// Types
// ============================================================================

export interface ImputationWarningProps {
  /** Résultat de la validation */
  validation: ImputationValidationResult | null;
  /** Imputation concernée */
  imputation?: string;
  /** Callback quand une justification est fournie */
  onJustificationChange?: (justification: string) => void;
  /** Justification actuelle */
  justification?: string;
  /** Afficher le champ de justification */
  showJustificationField?: boolean;
  /** Longueur minimale de la justification */
  minJustificationLength?: number;
  /** Variante compacte */
  compact?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

// ============================================================================
// Composant principal
// ============================================================================

export function ImputationWarning({
  validation,
  imputation,
  onJustificationChange,
  justification = "",
  showJustificationField = true,
  minJustificationLength = 10,
  compact = false,
  className = "",
}: ImputationWarningProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Si pas de validation ou validation OK sans warnings, ne rien afficher
  if (
    !validation ||
    (validation.isValid &&
      validation.isFoundInBudget &&
      validation.warnings.length === 0 &&
      validation.errors.length === 0)
  ) {
    return null;
  }

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;
  const needsJustification =
    !validation.isFoundInBudget && showJustificationField;

  // Déterminer le variant de l'alerte
  const alertVariant = hasErrors ? "destructive" : "default";

  // Icône appropriée
  const AlertIcon = hasErrors
    ? AlertCircle
    : hasWarnings
    ? AlertTriangle
    : Info;

  // Couleur de l'icône
  const iconClass = hasErrors
    ? "text-destructive"
    : hasWarnings
    ? "text-warning"
    : "text-muted-foreground";

  // Split imputation pour affichage
  const { imputation_10, imputation_suite } = splitImputation(imputation);

  // Version compacte
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <AlertIcon className={`h-4 w-4 ${iconClass}`} />
        <span className={hasErrors ? "text-destructive" : "text-warning"}>
          {hasErrors
            ? validation.errors[0]
            : hasWarnings
            ? validation.warnings[0]
            : ""}
        </span>
      </div>
    );
  }

  return (
    <Alert variant={alertVariant} className={className}>
      <AlertIcon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {hasErrors ? "Erreur d'imputation" : "Attention - Imputation"}
        {!validation.isFoundInBudget && (
          <Badge variant="outline" className="text-xs">
            Non trouvée
          </Badge>
        )}
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-3 mt-2">
          {/* Affichage de l'imputation */}
          {imputation && (
            <div className="font-mono text-xs bg-muted p-2 rounded">
              <span className="font-semibold">{imputation_10}</span>
              {imputation_suite !== "-" && (
                <span className="text-muted-foreground">{imputation_suite}</span>
              )}
            </div>
          )}

          {/* Erreurs */}
          {hasErrors && (
            <ul className="list-disc list-inside space-y-1 text-destructive">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <ul className="list-disc list-inside space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}

          {/* Informations budget si trouvé */}
          {validation.isFoundInBudget && validation.budgetLineCode && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 h-auto p-1">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                  Détails budget
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-1 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-mono">{validation.budgetLineCode}</span>

                  {validation.budgetLineLabel && (
                    <>
                      <span className="text-muted-foreground">Libellé:</span>
                      <span>{validation.budgetLineLabel}</span>
                    </>
                  )}

                  {validation.disponible !== undefined && (
                    <>
                      <span className="text-muted-foreground">Disponible:</span>
                      <span
                        className={
                          validation.disponible <= 0
                            ? "text-destructive font-medium"
                            : "text-success font-medium"
                        }
                      >
                        {new Intl.NumberFormat("fr-FR").format(
                          validation.disponible
                        )}{" "}
                        FCFA
                      </span>
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Champ de justification si requis */}
          {needsJustification && onJustificationChange && (
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="justification" className="text-sm font-medium">
                Justification requise
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="justification"
                placeholder="Expliquez pourquoi cette imputation est utilisée malgré l'absence dans le budget..."
                value={justification}
                onChange={(e) => onJustificationChange(e.target.value)}
                rows={3}
                className="text-sm"
              />
              {justification.length < minJustificationLength && (
                <p className="text-xs text-muted-foreground">
                  Minimum {minJustificationLength} caractères requis (
                  {justification.length}/{minJustificationLength})
                </p>
              )}
              {justification.length >= minJustificationLength && (
                <p className="text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Justification valide
                </p>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ============================================================================
// Composant inline pour les tableaux
// ============================================================================

export interface ImputationStatusBadgeProps {
  /** L'imputation est-elle trouvée dans le budget ? */
  isFoundInBudget: boolean;
  /** Disponible restant (optionnel) */
  disponible?: number;
  /** Taille du badge */
  size?: "sm" | "default";
}

export function ImputationStatusBadge({
  isFoundInBudget,
  disponible,
  size = "default",
}: ImputationStatusBadgeProps) {
  if (isFoundInBudget) {
    if (disponible !== undefined && disponible <= 0) {
      return (
        <Badge
          variant="destructive"
          className={size === "sm" ? "text-xs px-1.5 py-0" : ""}
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Épuisé
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className={`bg-success/10 text-success border-success/30 ${
          size === "sm" ? "text-xs px-1.5 py-0" : ""
        }`}
      >
        <CheckCircle2 className="h-3 w-3 mr-1" />
        OK
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`bg-warning/10 text-warning border-warning/30 ${
        size === "sm" ? "text-xs px-1.5 py-0" : ""
      }`}
    >
      <FileWarning className="h-3 w-3 mr-1" />
      Non trouvée
    </Badge>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default ImputationWarning;
