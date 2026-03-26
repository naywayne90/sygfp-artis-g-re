import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link2, ExternalLink, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Engagement } from '@/hooks/useEngagements';
import { DossierStepTimeline } from '@/components/shared/DossierStepTimeline';

interface EngagementDetailsChainProps {
  engagement: Engagement;
  onCloseDialog: () => void;
}

export function EngagementDetailsChain({ engagement, onCloseDialog }: EngagementDetailsChainProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {engagement.dossier_id ? (
        <DossierStepTimeline
          dossierId={engagement.dossier_id}
          highlightStep="engagement"
          compact={false}
          showNavigation
          showAmounts
          onStepClick={(step, entityId) => {
            if (!entityId) return;
            onCloseDialog();
            switch (step) {
              case 'sef':
                navigate(`/notes-sef?detail=${entityId}`);
                break;
              case 'aef':
                navigate(`/notes-aef?detail=${entityId}`);
                break;
              case 'imputation':
                navigate(`/execution/imputation?detail=${entityId}`);
                break;
              case 'expression_besoin':
                navigate(`/execution/expression-besoin?detail=${entityId}`);
                break;
              case 'passation_marche':
                navigate(`/execution/passation-marche?detail=${entityId}`);
                break;
              case 'liquidation':
                navigate(`/liquidations?detail=${entityId}`);
                break;
              case 'ordonnancement':
                navigate(`/ordonnancements?detail=${entityId}`);
                break;
              case 'reglement':
                navigate(`/reglements?detail=${entityId}`);
                break;
            }
          }}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Chaîne de la dépense non disponible</p>
            <p className="text-sm">Cet engagement n'est pas lié à un dossier.</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation rapide */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Navigation rapide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {engagement.passation_marche_id && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                onCloseDialog();
                navigate(`/execution/passation-marche?detail=${engagement.passation_marche_id}`);
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Voir la passation de marché
              {engagement.marche?.numero && (
                <span className="text-muted-foreground ml-auto">({engagement.marche.numero})</span>
              )}
            </Button>
          )}
          {engagement.expression_besoin_id && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                onCloseDialog();
                navigate(`/execution/expression-besoin?detail=${engagement.expression_besoin_id}`);
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Voir l'expression de besoin
              {engagement.expression_besoin?.numero && (
                <span className="text-muted-foreground ml-auto">
                  ({engagement.expression_besoin.numero})
                </span>
              )}
            </Button>
          )}

          {/* Bouton "Créer la liquidation" si engagement validé */}
          {engagement.statut === 'valide' && (
            <>
              <Separator />
              <Button
                className="w-full gap-2"
                onClick={() => {
                  onCloseDialog();
                  navigate(`/liquidations?sourceEngagement=${engagement.id}`);
                }}
              >
                <ArrowRight className="h-4 w-4" />
                Créer la liquidation
              </Button>
            </>
          )}

          {!engagement.passation_marche_id && !engagement.expression_besoin_id && (
            <p className="text-sm text-muted-foreground">
              Aucun lien avec une passation ou expression de besoin.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
