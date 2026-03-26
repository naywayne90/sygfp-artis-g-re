import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, ExternalLink, Loader2, Receipt, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Engagement } from '@/hooks/useEngagements';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface EngagementLiquidation {
  id: string;
  numero: string;
  montant: number;
  net_a_payer: number | null;
  reference_facture: string | null;
  date_liquidation: string;
  statut: string | null;
}

function getStatutBadge(statut: string | null) {
  switch (statut) {
    case 'soumis':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Soumis</Badge>;
    case 'visa_saf':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">Visa Sous-Dir DAAF</Badge>
      );
    case 'visa_cb':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Visa CB</Badge>;
    case 'visa_daaf':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Visa DAAF</Badge>;
    case 'valide':
      return <Badge className="bg-green-100 text-green-700 border-green-200">Validé</Badge>;
    case 'rejete':
      return <Badge variant="destructive">Rejeté</Badge>;
    case 'differe':
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Différé</Badge>;
    case 'annule':
      return <Badge variant="secondary">Annulé</Badge>;
    default:
      return <Badge variant="outline">{statut || '—'}</Badge>;
  }
}

interface EngagementDetailsLiquidationsProps {
  engagement: Engagement;
  engLiquidations: EngagementLiquidation[];
  isLoadingLiquidations: boolean;
  onCloseDialog: () => void;
}

export function EngagementDetailsLiquidations({
  engagement,
  engLiquidations,
  isLoadingLiquidations,
  onCloseDialog,
}: EngagementDetailsLiquidationsProps) {
  const navigate = useNavigate();

  const activeLiquidations = engLiquidations.filter((l) => l.statut !== 'rejete');
  const totalLiquide = activeLiquidations.reduce((sum, l) => sum + l.montant, 0);
  const tauxConsommation =
    engagement.montant > 0
      ? Math.min(Math.round((totalLiquide / engagement.montant) * 100), 100)
      : 0;
  const restant = engagement.montant - totalLiquide;
  const progressColorClass =
    tauxConsommation > 95
      ? '[&>div]:bg-destructive'
      : tauxConsommation >= 80
        ? '[&>div]:bg-warning'
        : '';

  return (
    <div className="space-y-4">
      {/* Résumé avec barre de progression */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Consommation de l'engagement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-muted-foreground text-xs">Montant engagé</div>
              <div className="font-bold">{formatCurrency(engagement.montant)}</div>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <div className="text-muted-foreground text-xs">Total liquidé</div>
              <div className="font-bold text-primary">
                {formatCurrency(totalLiquide)}
                <span className="text-xs text-muted-foreground ml-1">
                  ({tauxConsommation}%) — {activeLiquidations.length} liquidation
                  {activeLiquidations.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div
              className={`text-center p-3 rounded-lg ${restant <= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted'}`}
            >
              <div className="text-muted-foreground text-xs">Restant</div>
              <div className={`font-bold ${restant <= 0 ? 'text-green-600' : ''}`}>
                {formatCurrency(Math.max(restant, 0))}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Progress value={tauxConsommation} className={`h-3 ${progressColorClass}`} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des liquidations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Liste des liquidations
            <Badge variant="outline" className="ml-auto">
              {engLiquidations.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLiquidations ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : engLiquidations.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <Receipt className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Aucune liquidation sur cet engagement</p>
              {engagement.statut === 'valide' && (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    onCloseDialog();
                    navigate(`/liquidations?sourceEngagement=${engagement.id}`);
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                  Créer une liquidation
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {engLiquidations.map((liq) => {
                const liqPct =
                  engagement.montant > 0 ? Math.round((liq.montant / engagement.montant) * 100) : 0;
                return (
                  <div
                    key={liq.id}
                    className="flex items-center justify-between p-2 rounded border text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      onCloseDialog();
                      navigate(`/liquidations?detail=${liq.id}`);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-medium shrink-0">{liq.numero}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {liq.reference_facture || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs">{formatCurrency(liq.montant)}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {liqPct}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(liq.date_liquidation), 'dd/MM/yyyy', {
                          locale: fr,
                        })}
                      </span>
                      {getStatutBadge(liq.statut)}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bouton créer si engagement validé et restant > 0 */}
          {engLiquidations.length > 0 && engagement.statut === 'valide' && restant > 0 && (
            <>
              <Separator className="my-3" />
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  onCloseDialog();
                  navigate(`/liquidations?sourceEngagement=${engagement.id}`);
                }}
              >
                <ArrowRight className="h-4 w-4" />
                Créer une liquidation ({formatCurrency(restant)} disponible)
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
