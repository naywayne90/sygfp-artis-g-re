/**
 * ARTIReferenceBadge - Affiche et permet de copier une référence ARTI
 * 
 * Format brut: ARTI0012600001 (13 caractères)
 * Format lisible: ARTI-SEF-01/26-0001
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  parseARTIReferenceLocal, 
  formatARTIReference, 
  formatARTIReferenceShort,
  ETAPE_LABELS 
} from "@/lib/notes-sef/referenceService";

interface ARTIReferenceBadgeProps {
  /** Référence brute (ARTI0012600001) ou numéro fallback */
  reference: string | null | undefined;
  /** Afficher le format court (SEF-01/26-0001) au lieu du format complet */
  short?: boolean;
  /** Taille du badge */
  size?: "sm" | "md" | "lg";
  /** Afficher le bouton copier */
  showCopy?: boolean;
  /** Afficher l'icône Hash */
  showIcon?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
  /** Variante de style */
  variant?: "default" | "outline" | "secondary" | "destructive";
}

export function ARTIReferenceBadge({
  reference,
  short = false,
  size = "md",
  showCopy = true,
  showIcon = true,
  className,
  variant = "outline",
}: ARTIReferenceBadgeProps) {
  const [copied, setCopied] = useState(false);

  // Si pas de référence, ne rien afficher
  if (!reference) return null;

  // Parser la référence
  const parsed = parseARTIReferenceLocal(reference);
  
  // Déterminer le texte à afficher
  const displayText = parsed.isValid
    ? short
      ? formatARTIReferenceShort(reference)
      : formatARTIReference(reference)
    : reference; // Fallback sur la valeur brute si invalide

  // Copier dans le presse-papiers
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Copier la référence brute (plus utile pour recherche/collage)
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur copie référence:", err);
    }
  };

  // Styles selon la taille
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-1",
    md: "text-sm px-2 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  // Couleur selon l'étape
  const getEtapeColor = () => {
    if (!parsed.isValid) return "";
    const colors: Record<number, string> = {
      0: "border-blue-500/50 text-blue-700 dark:text-blue-300", // SEF
      1: "border-indigo-500/50 text-indigo-700 dark:text-indigo-300", // AEF
      2: "border-purple-500/50 text-purple-700 dark:text-purple-300", // Imputation
      3: "border-cyan-500/50 text-cyan-700 dark:text-cyan-300", // EB
      4: "border-teal-500/50 text-teal-700 dark:text-teal-300", // PM
      5: "border-emerald-500/50 text-emerald-700 dark:text-emerald-300", // Engagement
      6: "border-orange-500/50 text-orange-700 dark:text-orange-300", // Liquidation
      7: "border-amber-500/50 text-amber-700 dark:text-amber-300", // Ordonnancement
      8: "border-green-500/50 text-green-700 dark:text-green-300", // Règlement
    };
    return colors[parsed.etape] || "";
  };

  const tooltipContent = parsed.isValid ? (
    <div className="space-y-1">
      <p className="font-mono font-bold">{reference}</p>
      <div className="text-xs space-y-0.5">
        <p>
          <span className="text-muted-foreground">Étape:</span>{" "}
          {ETAPE_LABELS[parsed.etape]}
        </p>
        <p>
          <span className="text-muted-foreground">Période:</span>{" "}
          {String(parsed.mois).padStart(2, "0")}/{parsed.annee}
        </p>
        <p>
          <span className="text-muted-foreground">Numéro:</span>{" "}
          {String(parsed.numero).padStart(4, "0")}
        </p>
      </div>
    </div>
  ) : (
    <p>Référence: {reference}</p>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={cn(
              "font-mono inline-flex items-center cursor-pointer hover:bg-accent transition-colors",
              sizeClasses[size],
              parsed.isValid && getEtapeColor(),
              className
            )}
          >
            {showIcon && <Hash className={cn(iconSizes[size], "opacity-60")} />}
            <span>{displayText}</span>
            {showCopy && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-auto w-auto p-0.5 ml-1 hover:bg-transparent",
                  iconSizes[size]
                )}
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className={cn(iconSizes[size], "text-green-500")} />
                ) : (
                  <Copy className={cn(iconSizes[size], "opacity-50 hover:opacity-100")} />
                )}
              </Button>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipContent}
          <p className="text-xs text-muted-foreground mt-1 italic">
            Cliquez pour copier
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Version inline pour les tableaux/listes
 */
export function ARTIReferenceInline({
  reference,
  className,
}: {
  reference: string | null | undefined;
  className?: string;
}) {
  if (!reference) return <span className="text-muted-foreground">-</span>;

  const parsed = parseARTIReferenceLocal(reference);
  const displayText = parsed.isValid
    ? formatARTIReferenceShort(reference)
    : reference;

  return (
    <span className={cn("font-mono text-sm", className)} title={reference}>
      {displayText}
    </span>
  );
}

/**
 * Header de dossier avec référence ARTI proéminente
 */
interface DossierHeaderWithARTIProps {
  numero: string;
  referencePivot?: string | null;
  className?: string;
}

export function DossierHeaderWithARTI({
  numero,
  referencePivot,
  className,
}: DossierHeaderWithARTIProps) {
  // Si on a une référence ARTI valide, l'afficher en priorité
  const hasValidARTI = referencePivot && parseARTIReferenceLocal(referencePivot).isValid;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {hasValidARTI ? (
        <>
          <ARTIReferenceBadge reference={referencePivot} size="lg" showIcon />
          <span className="text-xs text-muted-foreground">({numero})</span>
        </>
      ) : (
        <span className="font-mono text-xl text-primary font-bold">{numero}</span>
      )}
    </div>
  );
}

export default ARTIReferenceBadge;
