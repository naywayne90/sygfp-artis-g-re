/**
 * ImputationCodeDisplay - Affichage visuel de la chaîne d'imputation budgétaire
 *
 * Format: # [OS]-[Action]-[Activité]-[Sous-Activité]-[NBE] + SYSCO
 * Affichage lisible avec segments colorés et tooltips
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Target,
  GitBranch,
  Activity,
  Layers,
  BookOpen,
  Calculator,
  ChevronRight,
  Copy,
  Check
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ImputationSegment {
  type: "OS" | "Action" | "Activité" | "Sous-Activité" | "NBE" | "SYSCO";
  code: string;
  libelle: string;
}

interface ImputationCodeDisplayProps {
  code: string;
  readable?: string;
  segments: ImputationSegment[];
  compact?: boolean;
  showCopy?: boolean;
  className?: string;
}

const SEGMENT_ICONS: Record<string, React.ElementType> = {
  OS: Target,
  Action: GitBranch,
  Activité: Activity,
  "Sous-Activité": Layers,
  NBE: BookOpen,
  SYSCO: Calculator,
};

const SEGMENT_COLORS: Record<string, string> = {
  OS: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  Action: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  Activité: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  "Sous-Activité": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  NBE: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
  SYSCO: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
};

export function ImputationCodeDisplay({
  code,
  readable,
  segments,
  compact = false,
  showCopy = true,
  className,
}: ImputationCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur copie:", err);
    }
  };

  // Séparer segments programmatiques et nomenclatures
  const programmaticSegments = segments.filter((s) =>
    ["OS", "Action", "Activité", "Sous-Activité"].includes(s.type)
  );
  const nomenclatureSegments = segments.filter((s) =>
    ["NBE", "SYSCO"].includes(s.type)
  );

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-2", className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded cursor-help">
                {code}
              </code>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <div className="space-y-2">
                <p className="font-medium">Chaîne d'imputation</p>
                <div className="flex flex-wrap gap-1">
                  {segments.map((segment, idx) => {
                    const Icon = SEGMENT_ICONS[segment.type];
                    return (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={cn("text-xs", SEGMENT_COLORS[segment.type])}
                      >
                        {Icon && <Icon className="h-3 w-3 mr-1" />}
                        {segment.type}: {segment.code}
                      </Badge>
                    );
                  })}
                </div>
                {readable && (
                  <p className="text-xs text-muted-foreground mt-2">{readable}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
          {showCopy && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Code d'imputation
            </span>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {code}
              </code>
              {showCopy && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Structure programmatique */}
          {programmaticSegments.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                Structure programmatique
              </span>
              <div className="flex items-center flex-wrap gap-1">
                {programmaticSegments.map((segment, idx) => {
                  const Icon = SEGMENT_ICONS[segment.type];
                  return (
                    <div key={idx} className="flex items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className={cn(
                              "cursor-help",
                              SEGMENT_COLORS[segment.type]
                            )}
                          >
                            {Icon && <Icon className="h-3 w-3 mr-1" />}
                            <span className="font-mono">{segment.code}</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">{segment.type}</p>
                            <p className="text-sm">{segment.libelle}</p>
                            <code className="text-xs bg-muted px-1 rounded">
                              {segment.code}
                            </code>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      {idx < programmaticSegments.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground mx-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nomenclatures comptables */}
          {nomenclatureSegments.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                Nomenclatures comptables
              </span>
              <div className="flex items-center flex-wrap gap-2">
                {nomenclatureSegments.map((segment, idx) => {
                  const Icon = SEGMENT_ICONS[segment.type];
                  return (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            "cursor-help",
                            SEGMENT_COLORS[segment.type]
                          )}
                        >
                          {Icon && <Icon className="h-3 w-3 mr-1" />}
                          {segment.type}:{" "}
                          <span className="font-mono ml-1">{segment.code}</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">{segment.type}</p>
                          <p className="text-sm">{segment.libelle}</p>
                          <code className="text-xs bg-muted px-1 rounded">
                            {segment.code}
                          </code>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chaîne lisible */}
          {readable && (
            <div className="pt-2 border-t">
              <span className="text-xs text-muted-foreground">Format lisible:</span>
              <p className="text-sm font-mono mt-1 text-muted-foreground">
                {readable}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

/**
 * Version inline pour affichage dans les listes/tables
 */
export function ImputationCodeInline({
  code,
  segments,
  className,
}: {
  code: string;
  segments: ImputationSegment[];
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <code
            className={cn(
              "text-xs font-mono bg-muted px-1.5 py-0.5 rounded cursor-help hover:bg-muted/80",
              className
            )}
          >
            {code}
          </code>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2 text-xs">
            {segments.map((segment, idx) => {
              const Icon = SEGMENT_ICONS[segment.type];
              return (
                <div key={idx} className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className={cn("text-xs shrink-0", SEGMENT_COLORS[segment.type])}
                  >
                    {Icon && <Icon className="h-3 w-3 mr-1" />}
                    {segment.type}
                  </Badge>
                  <div>
                    <span className="font-mono">{segment.code}</span>
                    <span className="text-muted-foreground ml-1">
                      - {segment.libelle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
