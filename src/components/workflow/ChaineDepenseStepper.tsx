/**
 * Stepper unifié pour la chaîne de dépense
 * Affiche les 9 étapes avec état visuel
 */

import { cn } from "@/lib/utils";
import { Check, Circle, AlertCircle, PauseCircle, XCircle, ChevronRight } from "lucide-react";
import { ETAPES_ORDONNEES, ETAPES_CHAINE_DEPENSE, type EtapeChaineType } from "@/lib/config/sygfp-constants";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EtapeStatut {
  etape: EtapeChaineType;
  statut: 'pending' | 'current' | 'completed' | 'skipped' | 'error' | 'deferred';
  montant?: number;
  date?: string;
  entityId?: string;
}

interface ChaineDepenseStepperProps {
  /** Étape courante du dossier */
  etapeCourante: string;
  /** Statuts détaillés par étape (optionnel) */
  etapesStatuts?: EtapeStatut[];
  /** Dossier clôturé */
  isCloture?: boolean;
  /** Mode d'affichage */
  variant?: 'default' | 'compact' | 'vertical';
  /** Handler de clic sur une étape */
  onEtapeClick?: (etape: EtapeChaineType) => void;
  /** Classes additionnelles */
  className?: string;
}

// Mapper les anciens noms d'étapes vers les nouveaux
const normalizeEtape = (etape: string): EtapeChaineType | null => {
  const mapping: Record<string, EtapeChaineType> = {
    'note': ETAPES_CHAINE_DEPENSE.NOTE_AEF,
    'note_sef': ETAPES_CHAINE_DEPENSE.NOTE_SEF,
    'note_aef': ETAPES_CHAINE_DEPENSE.NOTE_AEF,
    'imputation': ETAPES_CHAINE_DEPENSE.IMPUTATION,
    'expression_besoin': ETAPES_CHAINE_DEPENSE.EXPRESSION_BESOIN,
    'passation_marche': ETAPES_CHAINE_DEPENSE.PASSATION_MARCHE,
    'engagement': ETAPES_CHAINE_DEPENSE.ENGAGEMENT,
    'liquidation': ETAPES_CHAINE_DEPENSE.LIQUIDATION,
    'ordonnancement': ETAPES_CHAINE_DEPENSE.ORDONNANCEMENT,
    'reglement': ETAPES_CHAINE_DEPENSE.REGLEMENT,
  };
  return mapping[etape.toLowerCase()] || null;
};

export function ChaineDepenseStepper({
  etapeCourante,
  etapesStatuts,
  isCloture = false,
  variant = 'default',
  onEtapeClick,
  className,
}: ChaineDepenseStepperProps) {
  const normalizedCourante = normalizeEtape(etapeCourante);
  const currentIndex = ETAPES_ORDONNEES.findIndex(e => e.code === normalizedCourante);
  
  const getEtapeStatus = (etape: typeof ETAPES_ORDONNEES[0], index: number): EtapeStatut['statut'] => {
    // Si on a des statuts détaillés, les utiliser
    if (etapesStatuts) {
      const found = etapesStatuts.find(s => s.etape === etape.code);
      if (found) return found.statut;
    }
    
    // Sinon, déduire du currentIndex
    if (isCloture) return 'completed';
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };
  
  const getStatusIcon = (status: EtapeStatut['statut'], isCompact: boolean) => {
    const size = isCompact ? "h-3 w-3" : "h-4 w-4";
    switch (status) {
      case 'completed':
        return <Check className={cn(size, "text-success-foreground")} />;
      case 'current':
        return <Circle className={cn(size, "text-primary-foreground animate-pulse")} />;
      case 'error':
        return <XCircle className={cn(size, "text-destructive-foreground")} />;
      case 'deferred':
        return <PauseCircle className={cn(size, "text-warning-foreground")} />;
      case 'skipped':
        return <ChevronRight className={cn(size, "text-muted-foreground")} />;
      default:
        return null;
    }
  };
  
  const getStatusClasses = (status: EtapeStatut['statut']) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground border-success';
      case 'current':
        return 'bg-primary text-primary-foreground border-primary ring-4 ring-primary/20';
      case 'error':
        return 'bg-destructive text-destructive-foreground border-destructive';
      case 'deferred':
        return 'bg-warning text-warning-foreground border-warning';
      case 'skipped':
        return 'bg-muted text-muted-foreground border-muted';
      default:
        return 'bg-background text-muted-foreground border-muted-foreground/30';
    }
  };
  
  const getConnectorClasses = (status: EtapeStatut['statut']) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'current':
        return 'bg-primary';
      default:
        return 'bg-muted-foreground/20';
    }
  };

  if (variant === 'vertical') {
    return (
      <div className={cn("space-y-1", className)}>
        {ETAPES_ORDONNEES.map((etape, index) => {
          const status = getEtapeStatus(etape, index);
          const Icon = etape.icon;
          
          return (
            <div key={etape.code} className="relative">
              {index < ETAPES_ORDONNEES.length - 1 && (
                <div className={cn(
                  "absolute left-4 top-10 w-0.5 h-6",
                  getConnectorClasses(status)
                )} />
              )}
              <button
                type="button"
                onClick={() => onEtapeClick?.(etape.code)}
                disabled={!onEtapeClick}
                className={cn(
                  "flex items-center gap-3 w-full p-2 rounded-lg transition-colors",
                  onEtapeClick && "hover:bg-muted/50 cursor-pointer",
                  status === 'current' && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0",
                  getStatusClasses(status)
                )}>
                  {status === 'completed' || status === 'error' || status === 'deferred' ? (
                    getStatusIcon(status, false)
                  ) : (
                    <span className="text-xs font-bold">{etape.numero}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    status === 'current' && "text-primary",
                    status === 'pending' && "text-muted-foreground"
                  )}>
                    {etape.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {etape.description}
                  </p>
                </div>
                <Icon className={cn("h-4 w-4 shrink-0", etape.color)} />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-0.5 overflow-x-auto py-1", className)}>
        {ETAPES_ORDONNEES.map((etape, index) => {
          const status = getEtapeStatus(etape, index);
          
          return (
            <TooltipProvider key={etape.code}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onEtapeClick?.(etape.code)}
                    disabled={!onEtapeClick}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all",
                      getStatusClasses(status),
                      onEtapeClick && "hover:scale-110 cursor-pointer"
                    )}
                  >
                    {status === 'completed' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      etape.numero
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{etape.label}</p>
                  <p className="text-xs text-muted-foreground">{etape.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center justify-between gap-1 overflow-x-auto pb-2", className)}>
      {ETAPES_ORDONNEES.map((etape, index) => {
        const status = getEtapeStatus(etape, index);
        const Icon = etape.icon;
        
        return (
          <div key={etape.code} className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onEtapeClick?.(etape.code)}
                    disabled={!onEtapeClick}
                    className={cn(
                      "flex flex-col items-center min-w-[60px] transition-all",
                      status === 'pending' && "opacity-40",
                      onEtapeClick && "hover:opacity-100 cursor-pointer"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center border-2 mb-1.5",
                      getStatusClasses(status)
                    )}>
                      {status === 'completed' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] text-center font-medium leading-tight",
                      status === 'current' && "text-primary",
                      status === 'pending' && "text-muted-foreground"
                    )}>
                      {etape.labelCourt}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{etape.label}</p>
                  <p className="text-xs text-muted-foreground">{etape.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {index < ETAPES_ORDONNEES.length - 1 && (
              <div className={cn(
                "w-4 h-0.5 mx-0.5 flex-shrink-0",
                getConnectorClasses(status)
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
