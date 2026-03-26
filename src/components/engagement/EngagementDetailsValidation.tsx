import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, User } from 'lucide-react';
import { Engagement, VALIDATION_STEPS } from '@/hooks/useEngagements';
import { EngagementValidationTimeline } from './EngagementValidationTimeline';
import { DossierTimeline } from '@/components/dossier/DossierTimeline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VisaDetail {
  order: number;
  role: string;
  label: string;
  visaStatut: string;
  visaPrefix: string;
  userId: string | null;
  date: string | null;
  commentaire: string | null;
  validatorName: string | null;
  isCompleted: boolean;
}

interface EngagementDetailsValidationProps {
  engagement: Engagement;
  visaDetails: VisaDetail[];
}

export function EngagementDetailsValidation({
  engagement,
  visaDetails,
}: EngagementDetailsValidationProps) {
  return (
    <div className="space-y-4">
      {/* Timeline visuelle compacte */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Progression de la validation</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <EngagementValidationTimeline
            currentStep={engagement.current_step || 0}
            statut={engagement.statut}
            validationSteps={[]}
          />
        </CardContent>
      </Card>

      {/* Détail par étape (depuis les colonnes visa) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Détail des visas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visaDetails.map((step) => {
              // Déterminer si le rejet est survenu à cette étape
              const isRejectedAtThisStep =
                engagement.statut === 'rejete' &&
                !step.isCompleted &&
                visaDetails.filter((s) => s.isCompleted).length === step.order - 1;

              return (
                <div
                  key={step.order}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    step.isCompleted
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : isRejectedAtThisStep
                        ? 'bg-destructive/10'
                        : 'bg-muted/50'
                  }`}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : isRejectedAtThisStep ? (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        Étape {step.order} : {step.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          step.isCompleted
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : isRejectedAtThisStep
                              ? 'bg-destructive/10 text-destructive'
                              : ''
                        }
                      >
                        {step.isCompleted
                          ? 'Validé'
                          : isRejectedAtThisStep
                            ? 'Rejeté'
                            : 'En attente'}
                      </Badge>
                    </div>
                    {step.date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(step.date), 'dd/MM/yyyy à HH:mm', {
                          locale: fr,
                        })}
                        {step.validatorName && ` — par ${step.validatorName}`}
                      </div>
                    )}
                    {step.commentaire && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        « {step.commentaire} »
                      </p>
                    )}
                    {isRejectedAtThisStep && engagement.motif_rejet && (
                      <p className="text-xs text-destructive mt-1 italic">
                        « {engagement.motif_rejet} »
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Journal d'activité */}
      {engagement.dossier_id && (
        <DossierTimeline
          dossierId={engagement.dossier_id}
          entityType="engagement"
          entityId={engagement.id}
          maxItems={20}
          showFilters={true}
        />
      )}
    </div>
  );
}
