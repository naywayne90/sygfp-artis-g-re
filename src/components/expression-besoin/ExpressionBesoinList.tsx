import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExpressionBesoin, useExpressionsBesoin } from '@/hooks/useExpressionsBesoin';
import { usePermissions } from '@/hooks/usePermissions';
import { ExpressionBesoinDetails } from './ExpressionBesoinDetails';
import { ExpressionBesoinRejectDialog } from './ExpressionBesoinRejectDialog';
import { ExpressionBesoinDeferDialog } from './ExpressionBesoinDeferDialog';
import { ExpressionBesoinValidateDialog } from './ExpressionBesoinValidateDialog';
import { ExpressionBesoinVerifyDialog } from './ExpressionBesoinVerifyDialog';
import {
  MoreHorizontal,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  FileText,
  Trash2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface ExpressionBesoinListProps {
  expressions: ExpressionBesoin[];
  showActions?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  brouillon: { label: 'Brouillon', variant: 'secondary' },
  soumis: { label: 'Soumis', variant: 'outline' },
  verifie: { label: 'Vérifié CB', variant: 'outline' },
  valide: { label: 'Validé', variant: 'default' },
  rejete: { label: 'Rejeté', variant: 'destructive' },
  differe: { label: 'Différé', variant: 'outline' },
  satisfaite: { label: 'Satisfaite', variant: 'default' },
};

const URGENCE_CONFIG: Record<string, { label: string; className: string }> = {
  basse: { label: 'Basse', className: 'bg-muted text-muted-foreground' },
  normale: { label: 'Normal', className: 'bg-muted text-muted-foreground' },
  haute: { label: 'Urgent', className: 'bg-warning/20 text-warning' },
  urgente: { label: 'Très urgent', className: 'bg-destructive/20 text-destructive' },
};

export function ExpressionBesoinList({
  expressions,
  showActions = true,
}: ExpressionBesoinListProps) {
  const navigate = useNavigate();
  const {
    submitExpression,
    verifyExpression,
    validateExpression,
    rejectExpression,
    deferExpression,
    resumeExpression,
    deleteExpression,
    isSubmitting,
  } = useExpressionsBesoin();

  const { canVerifyEB, canValidateEB } = usePermissions();

  const [selectedExpression, setSelectedExpression] = useState<ExpressionBesoin | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeferDialog, setShowDeferDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);

  const handleSubmit = async (expression: ExpressionBesoin) => {
    await submitExpression(expression.id);
  };

  const handleVerify = async (comments?: string) => {
    if (!selectedExpression) return;
    await verifyExpression({ id: selectedExpression.id, comments });
    setShowVerifyDialog(false);
  };

  const handleValidate = async (comments?: string) => {
    if (!selectedExpression) return;
    await validateExpression({ id: selectedExpression.id, comments });
    setShowValidateDialog(false);
  };

  const handleReject = async (reason: string) => {
    if (!selectedExpression) return;
    await rejectExpression({ id: selectedExpression.id, reason });
    setShowRejectDialog(false);
  };

  const handleDefer = async (motif: string, dateReprise?: string) => {
    if (!selectedExpression) return;
    await deferExpression({ id: selectedExpression.id, motif, dateReprise });
    setShowDeferDialog(false);
  };

  const handleResume = async (expression: ExpressionBesoin) => {
    await resumeExpression(expression.id);
  };

  const handleDelete = async (expression: ExpressionBesoin) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette expression de besoin ?')) {
      await deleteExpression(expression.id);
    }
  };

  const handleCreateEngagement = (expression: ExpressionBesoin) => {
    navigate(`/engagements?expression_id=${expression.id}`);
  };

  if (expressions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucune expression de besoin</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Objet</TableHead>
            <TableHead>Marché</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Urgence</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
            {showActions && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {expressions.map((expression) => {
            const status =
              STATUS_CONFIG[expression.statut || 'brouillon'] || STATUS_CONFIG.brouillon;
            const urgence =
              URGENCE_CONFIG[expression.urgence || 'normale'] || URGENCE_CONFIG.normale;

            return (
              <TableRow key={expression.id}>
                <TableCell className="font-medium">{expression.numero || 'En attente'}</TableCell>
                <TableCell className="max-w-[200px] truncate">{expression.objet}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {expression.marche?.numero || '-'}
                </TableCell>
                <TableCell>
                  {expression.direction?.sigle || expression.direction?.code || '-'}
                </TableCell>
                <TableCell>
                  {expression.montant_estime
                    ? new Intl.NumberFormat('fr-FR').format(expression.montant_estime) + ' FCFA'
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge className={urgence.className} variant="outline">
                    {urgence.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(expression.created_at), 'dd/MM/yyyy', { locale: fr })}
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
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedExpression(expression);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>

                        {/* Brouillon : Soumettre / Supprimer */}
                        {expression.statut === 'brouillon' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleSubmit(expression)}
                              disabled={isSubmitting}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Soumettre
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(expression)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Soumis : CB peut Vérifier / Rejeter / Différer */}
                        {expression.statut === 'soumis' && canVerifyEB() && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedExpression(expression);
                                setShowVerifyDialog(true);
                              }}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Vérifier (CB)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedExpression(expression);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Rejeter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedExpression(expression);
                                setShowDeferDialog(true);
                              }}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Différer
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Vérifié : DG/DAAF peut Valider / Rejeter */}
                        {expression.statut === 'verifie' && canValidateEB() && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedExpression(expression);
                                setShowValidateDialog(true);
                              }}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Valider (DG/DAAF)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedExpression(expression);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Rejeter
                            </DropdownMenuItem>
                          </>
                        )}

                        {expression.statut === 'differe' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleResume(expression)}>
                              <Play className="mr-2 h-4 w-4" />
                              Reprendre
                            </DropdownMenuItem>
                          </>
                        )}

                        {expression.statut === 'valide' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleCreateEngagement(expression)}
                              className="text-primary"
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Créer engagement
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {selectedExpression && (
        <>
          <ExpressionBesoinDetails
            expression={selectedExpression}
            open={showDetails}
            onOpenChange={setShowDetails}
            onSubmit={(id) => submitExpression(id)}
            onVerify={() => {
              setShowDetails(false);
              setShowVerifyDialog(true);
            }}
            onValidate={() => {
              setShowDetails(false);
              setShowValidateDialog(true);
            }}
            onReject={() => {
              setShowDetails(false);
              setShowRejectDialog(true);
            }}
            onDelete={() => handleDelete(selectedExpression)}
          />
          <ExpressionBesoinRejectDialog
            open={showRejectDialog}
            onOpenChange={setShowRejectDialog}
            onConfirm={handleReject}
            expressionNumero={selectedExpression.numero}
          />
          <ExpressionBesoinDeferDialog
            open={showDeferDialog}
            onOpenChange={setShowDeferDialog}
            onConfirm={handleDefer}
            expressionNumero={selectedExpression.numero}
          />
          <ExpressionBesoinValidateDialog
            open={showValidateDialog}
            onOpenChange={setShowValidateDialog}
            onConfirm={handleValidate}
            expressionNumero={selectedExpression.numero}
            verifiedAt={selectedExpression.verified_at}
            verifierName={selectedExpression.verifier?.full_name}
          />
          <ExpressionBesoinVerifyDialog
            open={showVerifyDialog}
            onOpenChange={setShowVerifyDialog}
            onConfirm={handleVerify}
            expressionNumero={selectedExpression.numero}
            montant={selectedExpression.montant_estime}
            exercice={selectedExpression.exercice}
          />
        </>
      )}
    </>
  );
}
