import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Printer,
  PlayCircle,
} from 'lucide-react';
import { Engagement, VALIDATION_STEPS, VALIDATION_STATUTS } from '@/hooks/useEngagements';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EngagementListProps {
  engagements: Engagement[];
  onView: (engagement: Engagement) => void;
  onValidate?: (engagement: Engagement) => void;
  onReject?: (engagement: Engagement) => void;
  onDefer?: (engagement: Engagement) => void;
  onSubmit?: (id: string) => void;
  onResume?: (id: string) => void;
  onPrint?: (engagement: Engagement) => void;
  showActions?: boolean;
}

const getStatusBadge = (statut: string | null, _workflowStatus: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: 'Brouillon', className: 'bg-muted text-muted-foreground border-muted' },
    soumis: { label: 'A valider (SAF)', className: 'bg-warning/10 text-warning border-warning/20' },
    visa_saf: { label: 'Visa SAF', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    visa_cb: { label: 'Visa CB', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    visa_daaf: { label: 'Visa DAAF', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    valide: { label: 'Validé', className: 'bg-success/10 text-success border-success/20' },
    rejete: {
      label: 'Rejeté',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    differe: { label: 'Différé', className: 'bg-secondary/10 text-secondary border-secondary/20' },
  };
  const variant = variants[statut || 'brouillon'] || variants.brouillon;
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

const getValidationProgress = (currentStep: number | null) => {
  const step = currentStep || 0;
  if (step === 0) return null;
  const currentStepInfo = VALIDATION_STEPS.find((s) => s.order === step);
  return currentStepInfo ? (
    <span className="text-xs text-muted-foreground">
      Étape {step}/{VALIDATION_STEPS.length}: {currentStepInfo.label}
    </span>
  ) : null;
};

export function EngagementList({
  engagements,
  onView,
  onValidate,
  onReject,
  onDefer,
  onSubmit,
  onResume,
  onPrint,
  showActions = true,
}: EngagementListProps) {
  if (engagements.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">Aucun engagement trouvé</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numéro</TableHead>
          <TableHead className="hidden lg:table-cell">Objet</TableHead>
          <TableHead>Fournisseur</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead className="hidden md:table-cell">Ligne budg.</TableHead>
          <TableHead>Statut</TableHead>
          {showActions && <TableHead className="w-[50px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {engagements.map((engagement) => (
          <TableRow key={engagement.id}>
            <TableCell>
              <div>
                <div className="font-medium">{engagement.numero}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(engagement.date_engagement), 'dd/MM/yyyy', { locale: fr })}
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
              {engagement.objet}
            </TableCell>
            <TableCell>{engagement.fournisseur || 'N/A'}</TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(engagement.montant)}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {engagement.budget_line?.code || 'N/A'}
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                {getStatusBadge(engagement.statut, engagement.workflow_status)}
                {(VALIDATION_STATUTS as readonly string[]).includes(engagement.statut || '') &&
                  getValidationProgress(engagement.current_step)}
                {engagement.statut === 'differe' && engagement.motif_differe && (
                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {engagement.motif_differe}
                  </div>
                )}
                {engagement.statut === 'rejete' && (
                  <div className="text-xs text-destructive">Rejeté</div>
                )}
              </div>
            </TableCell>
            {showActions && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(engagement)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </DropdownMenuItem>
                    {onPrint && (
                      <DropdownMenuItem onClick={() => onPrint(engagement)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Pièce engagement
                      </DropdownMenuItem>
                    )}

                    {engagement.statut === 'brouillon' && onSubmit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onSubmit(engagement.id)}>
                          <Send className="mr-2 h-4 w-4" />
                          Soumettre
                        </DropdownMenuItem>
                      </>
                    )}

                    {(VALIDATION_STATUTS as readonly string[]).includes(
                      engagement.statut || ''
                    ) && (
                      <>
                        <DropdownMenuSeparator />
                        {onValidate && (
                          <DropdownMenuItem onClick={() => onValidate(engagement)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Viser
                          </DropdownMenuItem>
                        )}
                        {onDefer && (
                          <DropdownMenuItem onClick={() => onDefer(engagement)}>
                            <Clock className="mr-2 h-4 w-4" />
                            Différer
                          </DropdownMenuItem>
                        )}
                        {onReject && (
                          <DropdownMenuItem
                            onClick={() => onReject(engagement)}
                            className="text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Rejeter
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {engagement.statut === 'differe' && onResume && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onResume(engagement.id)}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Reprendre
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
