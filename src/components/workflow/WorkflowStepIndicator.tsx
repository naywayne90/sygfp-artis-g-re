import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  CreditCard,
  ShoppingCart,
  Handshake,
  Receipt,
  FileSignature,
  Wallet,
  ClipboardList,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';

interface EtapeWorkflow {
  id: string;
  numero: number;
  titre: string;
  titreCourt: string;
  url: string;
  icon: React.ElementType;
}

const etapes: EtapeWorkflow[] = [
  {
    id: 'notes-sef',
    numero: 1,
    titre: 'Notes SEF',
    titreCourt: 'SEF',
    url: '/notes-sef',
    icon: FileText,
  },
  {
    id: 'notes-aef',
    numero: 2,
    titre: 'Notes AEF',
    titreCourt: 'AEF',
    url: '/notes-aef',
    icon: CreditCard,
  },
  {
    id: 'expression-besoin',
    numero: 3,
    titre: 'Expression Besoin',
    titreCourt: 'Besoin',
    url: '/execution/expression-besoin',
    icon: ClipboardList,
  },
  {
    id: 'marches',
    numero: 4,
    titre: 'Marchés',
    titreCourt: 'Marché',
    url: '/execution/passation-marche',
    icon: Handshake,
  },
  {
    id: 'engagements',
    numero: 5,
    titre: 'Engagement',
    titreCourt: 'Engage',
    url: '/engagements',
    icon: ShoppingCart,
  },
  {
    id: 'liquidations',
    numero: 6,
    titre: 'Liquidation',
    titreCourt: 'Liquid.',
    url: '/liquidations',
    icon: Receipt,
  },
  {
    id: 'ordonnancements',
    numero: 7,
    titre: 'Ordonnancement',
    titreCourt: 'Ordo.',
    url: '/ordonnancements',
    icon: FileSignature,
  },
  {
    id: 'reglements',
    numero: 8,
    titre: 'Règlement',
    titreCourt: 'Règl.',
    url: '/reglements',
    icon: Wallet,
  },
];

interface WorkflowStepIndicatorProps {
  currentStep?: number;
  className?: string;
  showCard?: boolean;
}

export function WorkflowStepIndicator({
  currentStep,
  className,
  showCard = true,
}: WorkflowStepIndicatorProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Déterminer l'étape actuelle basée sur l'URL si non fournie
  const activeStep =
    currentStep || etapes.find((e) => location.pathname.startsWith(e.url))?.numero || 0;

  const content = (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1 overflow-x-auto py-2', className)}>
        {etapes.map((etape, index) => {
          const Icon = etape.icon;
          const isActive = etape.numero === activeStep;
          const isPassed = etape.numero < activeStep;
          const isLast = index === etapes.length - 1;

          return (
            <div key={etape.id} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(etape.url)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md transition-all text-xs',
                      'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50',
                      isActive && 'bg-primary text-primary-foreground font-medium',
                      isPassed && 'text-success',
                      !isActive && !isPassed && 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {isPassed ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    <span className="hidden sm:inline">{etape.titreCourt}</span>
                    <span className="sm:hidden">{etape.numero}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">
                    Étape {etape.numero}: {etape.titre}
                  </p>
                </TooltipContent>
              </Tooltip>

              {!isLast && (
                <ChevronRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card className="bg-muted/30">
      <CardContent className="py-2 px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap hidden md:inline">
            Chaîne de dépense:
          </span>
          {content}
        </div>
      </CardContent>
    </Card>
  );
}
