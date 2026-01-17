/**
 * Panneau d'information sur le blocage workflow avec guidance
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  WORKFLOW_STEPS,
  checkPrerequisites,
  type WorkflowStep,
  type Statut,
} from "@/lib/workflow/workflowEngine";
import { AlertTriangle, ArrowRight, CheckCircle, Info, Lock, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface BlockingInfo {
  type: 'prerequis' | 'role' | 'statut' | 'budget' | 'other';
  message: string;
  suggestion: string;
  actionLabel?: string;
  actionLink?: string;
}

interface WorkflowBlockingPanelProps {
  blocking: BlockingInfo | null;
  step: WorkflowStep;
  className?: string;
}

export function WorkflowBlockingPanel({
  blocking,
  step,
  className,
}: WorkflowBlockingPanelProps) {
  if (!blocking) return null;

  const icons = {
    prerequis: Lock,
    role: Lock,
    statut: AlertTriangle,
    budget: AlertTriangle,
    other: Info,
  };

  const Icon = icons[blocking.type];

  const variants = {
    prerequis: 'border-orange-200 bg-orange-50',
    role: 'border-red-200 bg-red-50',
    statut: 'border-yellow-200 bg-yellow-50',
    budget: 'border-red-200 bg-red-50',
    other: 'border-blue-200 bg-blue-50',
  };

  return (
    <Alert className={cn(variants[blocking.type], className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="font-medium">{blocking.message}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">{blocking.suggestion}</p>
        {blocking.actionLink && blocking.actionLabel && (
          <Link to={blocking.actionLink}>
            <Button size="sm" variant="outline" className="mt-3 gap-2">
              {blocking.actionLabel}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface WorkflowGuidancePanelProps {
  step: WorkflowStep;
  currentStatus: Statut;
  dossierState: Record<WorkflowStep, Statut | null>;
  montant?: number;
  className?: string;
}

export function WorkflowGuidancePanel({
  step,
  currentStatus,
  dossierState,
  montant,
  className,
}: WorkflowGuidancePanelProps) {
  const stepConfig = WORKFLOW_STEPS[step];
  const prerequisCheck = checkPrerequisites(step, dossierState, montant);

  // Générer les informations de guidance
  const getGuidance = () => {
    // Prérequis non remplis
    if (!prerequisCheck.valid) {
      const missingStep = stepConfig.prerequisSteps.find(
        (ps) => !dossierState[ps] || !['valide', 'impute', 'signe', 'paye', 'cloture'].includes(dossierState[ps]!)
      );

      if (missingStep) {
        const missingConfig = WORKFLOW_STEPS[missingStep];
        return {
          type: 'warning' as const,
          title: 'Étape précédente requise',
          message: prerequisCheck.message,
          suggestion: `Vous devez d'abord valider l'étape "${missingConfig.label}" avant de pouvoir créer un(e) ${stepConfig.labelShort}.`,
          actionLabel: `Aller à ${missingConfig.labelShort}`,
          actionLink: getStepRoute(missingStep),
        };
      }
    }

    // Élément rejeté
    if (currentStatus === 'rejete') {
      return {
        type: 'error' as const,
        title: 'Élément rejeté',
        message: 'Cet élément a été rejeté et nécessite des corrections.',
        suggestion: 'Consultez le motif de rejet et effectuez les modifications nécessaires avant de resoumettre.',
        actionLabel: 'Corriger et resoumettre',
      };
    }

    // Élément différé
    if (currentStatus === 'differe') {
      return {
        type: 'warning' as const,
        title: 'Élément différé',
        message: 'Le traitement de cet élément a été reporté.',
        suggestion: 'Consultez le motif du report et resoumettez quand les conditions seront réunies.',
        actionLabel: 'Resoumettre',
      };
    }

    // En brouillon
    if (currentStatus === 'brouillon') {
      return {
        type: 'info' as const,
        title: 'Brouillon',
        message: 'Cet élément est en cours de rédaction.',
        suggestion: 'Complétez toutes les informations requises puis soumettez pour validation.',
        actionLabel: 'Soumettre',
      };
    }

    // En attente de validation
    if (['soumis', 'a_valider', 'en_validation_dg'].includes(currentStatus)) {
      return {
        type: 'info' as const,
        title: 'En attente de validation',
        message: `Cet élément est en attente de validation par : ${stepConfig.validators.join(', ')}`,
        suggestion: 'Vous pouvez suivre l\'avancement dans l\'historique du dossier.',
      };
    }

    return null;
  };

  const guidance = getGuidance();

  if (!guidance) return null;

  const variantStyles = {
    info: 'border-blue-200 bg-blue-50/50',
    warning: 'border-warning/30 bg-warning/5',
    error: 'border-destructive/30 bg-destructive/5',
  };

  const IconMap = {
    info: Info,
    warning: AlertTriangle,
    error: XCircle,
  };

  const Icon = IconMap[guidance.type];

  return (
    <Card className={cn(variantStyles[guidance.type], 'border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {guidance.title}
        </CardTitle>
        <CardDescription>{guidance.message}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground mb-3">{guidance.suggestion}</p>
        {guidance.actionLink && guidance.actionLabel && (
          <Link to={guidance.actionLink}>
            <Button size="sm" variant="outline" className="gap-2">
              {guidance.actionLabel}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
        {!guidance.actionLink && guidance.actionLabel && (
          <Button size="sm" variant="outline" className="gap-2">
            {guidance.actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Helper pour obtenir la route d'une étape
function getStepRoute(step: WorkflowStep): string {
  const routes: Record<WorkflowStep, string> = {
    1: '/notes-sef',
    2: '/notes-aef',
    3: '/execution/imputation',
    4: '/execution/expression-besoin',
    5: '/marches',
    6: '/engagements',
    7: '/liquidations',
    8: '/ordonnancements',
    9: '/reglements',
  };
  return routes[step];
}

/**
 * Composant Next Step Card - Affiche la prochaine action recommandée
 */
interface NextStepCardProps {
  currentStep: WorkflowStep;
  currentStatus: Statut;
  nextAction?: {
    label: string;
    description: string;
    link: string;
  };
  className?: string;
}

export function NextStepCard({
  currentStep,
  currentStatus,
  nextAction,
  className,
}: NextStepCardProps) {
  const stepConfig = WORKFLOW_STEPS[currentStep];

  // Si validé, proposer l'étape suivante
  if (['valide', 'impute', 'signe', 'paye'].includes(currentStatus) && stepConfig.nextStep) {
    const nextStepConfig = WORKFLOW_STEPS[stepConfig.nextStep];
    return (
      <Card className={cn("border-primary/20 bg-primary/5", className)}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">
                  {stepConfig.labelShort} validé
                </p>
                <p className="text-xs text-muted-foreground">
                  Prochaine étape : {nextStepConfig.label}
                </p>
              </div>
            </div>
            <Link to={getStepRoute(stepConfig.nextStep)}>
              <Button size="sm" className="gap-2">
                Continuer
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sinon utiliser nextAction si fourni
  if (nextAction) {
    return (
      <Card className={cn("border-secondary/20 bg-secondary/5", className)}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{nextAction.label}</p>
              <p className="text-xs text-muted-foreground">{nextAction.description}</p>
            </div>
            <Link to={nextAction.link}>
              <Button size="sm" variant="secondary" className="gap-2">
                Accéder
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
