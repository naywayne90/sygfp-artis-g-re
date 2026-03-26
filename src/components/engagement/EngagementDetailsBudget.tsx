import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash, Receipt, FileText, Loader2 } from 'lucide-react';
import { Engagement, useEngagementLignes } from '@/hooks/useEngagements';
import { IndicateurBudget } from './IndicateurBudget';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

interface CreditTransfer {
  id: string;
  amount: number;
  status: string;
  motif: string | null;
  created_at: string;
  from_budget_line_id: string | null;
  to_budget_line_id: string | null;
}

interface OtherEngagement {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  statut: string | null;
  date_engagement: string;
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

interface EngagementDetailsBudgetProps {
  engagement: Engagement;
  availability: import('@/hooks/useEngagements').BudgetAvailability | null;
  isCheckingBudget: boolean;
  creditTransfers: CreditTransfer[];
  otherEngagements: OtherEngagement[];
  isLoadingOthers: boolean;
}

export function EngagementDetailsBudget({
  engagement,
  availability,
  isCheckingBudget,
  creditTransfers,
  otherEngagements,
  isLoadingOthers,
}: EngagementDetailsBudgetProps) {
  // Fetch multi-lignes
  const { data: engagementLignes = [] } = useEngagementLignes(
    engagement.is_multi_ligne ? engagement.id : null
  );

  return (
    <div className="space-y-4">
      {/* Imputation budgétaire */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Imputation budgétaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Ligne budgétaire :</span>
              <span className="ml-2 font-medium">{engagement.budget_line?.code || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Libellé :</span>
              <span className="ml-2 font-medium">{engagement.budget_line?.label || 'N/A'}</span>
            </div>
            {engagement.budget_line?.dotation_initiale != null && (
              <div>
                <span className="text-muted-foreground">Dotation initiale :</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(engagement.budget_line.dotation_initiale)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Multi-lignes */}
      {engagement.is_multi_ligne && engagementLignes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Ventilation multi-lignes
              <Badge variant="outline" className="ml-auto">
                {engagementLignes.length} ligne{engagementLignes.length > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {engagementLignes.map((ligne) => {
                const pct =
                  engagement.montant > 0
                    ? ((ligne.montant / engagement.montant) * 100).toFixed(1)
                    : '0';
                return (
                  <div
                    key={ligne.id}
                    className="flex items-center justify-between p-2 rounded border text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{ligne.budget_line?.code || 'N/A'}</span>
                      <span className="text-muted-foreground ml-2 truncate">
                        {ligne.budget_line?.label || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className="font-mono">
                        {pct}%
                      </Badge>
                      <span className="font-medium">{formatCurrency(ligne.montant)}</span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between p-2 bg-muted rounded text-sm font-bold">
                <span>TOTAL</span>
                <span>{formatCurrency(engagement.montant)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicateur de disponibilité budgétaire */}
      <IndicateurBudget
        availability={availability}
        isLoading={isCheckingBudget}
        budgetLine={
          engagement.budget_line
            ? { code: engagement.budget_line.code, label: engagement.budget_line.label }
            : null
        }
        mode="consultation"
      />

      {/* Historique des mouvements (virements) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Mouvements sur cette ligne
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creditTransfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun virement exécuté sur cette ligne.</p>
          ) : (
            <div className="space-y-2">
              {creditTransfers.map((ct) => {
                const isReceived = ct.to_budget_line_id === engagement.budget_line_id;
                return (
                  <div
                    key={ct.id}
                    className="flex items-center justify-between text-sm p-2 rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          isReceived
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {isReceived ? 'Reçu' : 'Émis'}
                      </Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(ct.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                    <span
                      className={`font-medium ${isReceived ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {isReceived ? '+' : '−'}
                      {formatCurrency(ct.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Autres engagements sur la même ligne */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Autres engagements sur cette ligne
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOthers ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : otherEngagements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun autre engagement sur cette ligne.</p>
          ) : (
            <div className="space-y-2">
              {otherEngagements.map((eng) => (
                <div
                  key={eng.id}
                  className="flex items-center justify-between text-sm p-2 rounded border"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{eng.numero}</span>
                    <span className="text-muted-foreground ml-2 truncate">
                      {eng.objet.substring(0, 40)}
                      {eng.objet.length > 40 ? '…' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatutBadge(eng.statut)}
                    <span className="font-medium">{formatCurrency(eng.montant)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
