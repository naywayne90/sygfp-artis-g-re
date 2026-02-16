/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  Calculator,
  Briefcase,
  Receipt,
  ClipboardCheck,
  Pen,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShoppingCart,
} from 'lucide-react';

interface EtapeChaine {
  id: string;
  code: string;
  numero: number;
  titre: string;
  titreCourt: string;
  url: string;
  icon: React.ElementType;
  description: string;
}

const ETAPES_CHAINE: EtapeChaine[] = [
  {
    id: 'note_sef',
    code: 'SEF',
    numero: 1,
    titre: 'Note SEF',
    titreCourt: 'SEF',
    url: '/notes-sef',
    icon: FileText,
    description: "Note Sans Effet Financier - Point d'entrée",
  },
  {
    id: 'note_aef',
    code: 'AEF',
    numero: 2,
    titre: 'Note AEF',
    titreCourt: 'AEF',
    url: '/notes-aef',
    icon: Calculator,
    description: 'Note Avec Effet Financier - Estimation budgétaire',
  },
  {
    id: 'imputation',
    code: 'IMP',
    numero: 3,
    titre: 'Imputation',
    titreCourt: 'Imp',
    url: '/execution/imputation',
    icon: Receipt,
    description: 'Imputation budgétaire - Réservation des crédits',
  },
  {
    id: 'expression_besoin',
    code: 'EB',
    numero: 4,
    titre: 'Expression Besoin',
    titreCourt: 'EB',
    url: '/execution/expression-besoin',
    icon: ShoppingCart,
    description: 'Expression de besoin — Définition des articles et besoins',
  },
  {
    id: 'marche',
    code: 'MCH',
    numero: 5,
    titre: 'Marché',
    titreCourt: 'Mché',
    url: '/marches',
    icon: Briefcase,
    description: 'Passation de marché - Sélection du fournisseur',
  },
  {
    id: 'engagement',
    code: 'ENG',
    numero: 6,
    titre: 'Engagement',
    titreCourt: 'Eng',
    url: '/engagements',
    icon: ClipboardCheck,
    description: 'Engagement budgétaire - Réservation définitive',
  },
  {
    id: 'liquidation',
    code: 'LIQ',
    numero: 7,
    titre: 'Liquidation',
    titreCourt: 'Liq',
    url: '/liquidations',
    icon: Receipt,
    description: 'Liquidation - Vérification service fait',
  },
  {
    id: 'ordonnancement',
    code: 'ORD',
    numero: 8,
    titre: 'Ordonnancement',
    titreCourt: 'Ord',
    url: '/ordonnancements',
    icon: Pen,
    description: 'Ordonnancement - Ordre de payer',
  },
  {
    id: 'reglement',
    code: 'REG',
    numero: 9,
    titre: 'Règlement',
    titreCourt: 'Règl',
    url: '/reglements',
    icon: CreditCard,
    description: 'Règlement - Paiement effectif',
  },
];

interface ChaineDepenseCompactProps {
  currentStep?: number;
  completedSteps?: number[];
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (etape: EtapeChaine) => void;
}

export function ChaineDepenseCompact({
  currentStep,
  completedSteps = [],
  className = '',
  showLabels = true,
  size = 'md',
  onClick,
}: ChaineDepenseCompactProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeStep = useMemo(() => {
    if (currentStep !== undefined) return currentStep;
    const current = ETAPES_CHAINE.find((e) => location.pathname.startsWith(e.url));
    return current?.numero || 0;
  }, [currentStep, location.pathname]);

  const sizeClasses = {
    sm: { icon: 'h-3 w-3', container: 'gap-0.5', step: 'w-6 h-6', text: 'text-[10px]' },
    md: { icon: 'h-4 w-4', container: 'gap-1', step: 'w-8 h-8', text: 'text-xs' },
    lg: { icon: 'h-5 w-5', container: 'gap-2', step: 'w-10 h-10', text: 'text-sm' },
  };

  const sizes = sizeClasses[size];

  const handleClick = (etape: EtapeChaine) => {
    if (onClick) {
      onClick(etape);
    } else {
      navigate(etape.url);
    }
  };

  return (
    <TooltipProvider>
      <div className={`flex items-center ${sizes.container} ${className}`}>
        {ETAPES_CHAINE.map((etape, index) => {
          const Icon = etape.icon;
          const isActive = activeStep === etape.numero;
          const isPassed = completedSteps.includes(etape.numero) || etape.numero < activeStep;
          const isCompleted = completedSteps.includes(etape.numero);

          return (
            <div key={etape.id} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleClick(etape)}
                    className={`
                      flex flex-col items-center transition-all duration-200
                      ${isActive ? 'scale-110' : 'hover:scale-105'}
                    `}
                  >
                    <div
                      className={`
                        ${sizes.step} rounded-full flex items-center justify-center
                        transition-all duration-200 cursor-pointer
                        ${
                          isActive
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                            : isPassed
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className={sizes.icon} />
                      ) : (
                        <Icon className={sizes.icon} />
                      )}
                    </div>
                    {showLabels && size !== 'sm' && (
                      <span
                        className={`
                          ${sizes.text} mt-1 font-medium
                          ${isActive ? 'text-primary' : isPassed ? 'text-green-600' : 'text-muted-foreground'}
                        `}
                      >
                        {etape.titreCourt}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={isActive ? 'default' : isPassed ? 'secondary' : 'outline'}>
                        Étape {etape.numero}
                      </Badge>
                      <span className="font-medium">{etape.titre}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{etape.description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              {index < ETAPES_CHAINE.length - 1 && (
                <ArrowRight
                  className={`
                    ${size === 'sm' ? 'h-2 w-2 mx-0.5' : size === 'md' ? 'h-3 w-3 mx-1' : 'h-4 w-4 mx-2'}
                    ${isPassed ? 'text-green-500' : 'text-muted-foreground/50'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// Export des étapes pour utilisation ailleurs
export { ETAPES_CHAINE };
export type { EtapeChaine };
