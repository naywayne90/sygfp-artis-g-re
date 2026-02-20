/**
 * LiquidationValidationDAAF — Espace de validation DAAF
 *
 * KPIs (En attente, Montant total, Urgents), liste triée (urgents first),
 * résumé fiscal par item (HT, TVA, retenues, net), boutons Valider/Rejeter.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  Flame,
  Eye,
  CreditCard,
  AlertTriangle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { Liquidation, requiresDgValidation, SEUIL_VALIDATION_DG } from '@/hooks/useLiquidations';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UrgentLiquidationBadge } from '@/components/liquidations/UrgentLiquidationBadge';

interface LiquidationValidationDAAFProps {
  /** Liquidations à valider (déjà filtrées par statut soumis) */
  liquidations: Liquidation[];
  onView: (liquidation: Liquidation) => void;
  onValidate: (id: string, comments?: string) => void;
  onReject: (id: string, reason: string) => void;
  isValidating?: boolean;
  isRejecting?: boolean;
}

export function LiquidationValidationDAAF({
  liquidations,
  onView,
  onValidate,
  onReject,
  isValidating = false,
  isRejecting = false,
}: LiquidationValidationDAAFProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [rejectMotif, setRejectMotif] = useState('');
  const [validateComment, setValidateComment] = useState('');

  // Tri : urgents en premier, puis par date de liquidation (plus récents d'abord)
  const sorted = [...liquidations].sort((a, b) => {
    const aUrgent = a.reglement_urgent ? 1 : 0;
    const bUrgent = b.reglement_urgent ? 1 : 0;
    if (bUrgent !== aUrgent) return bUrgent - aUrgent;
    return new Date(b.date_liquidation).getTime() - new Date(a.date_liquidation).getTime();
  });

  // KPIs
  const enAttente = sorted.length;
  const montantTotal = sorted.reduce((acc, l) => acc + (l.net_a_payer || l.montant), 0);
  const urgentCount = sorted.filter((l) => l.reglement_urgent).length;
  const avecDG = sorted.filter((l) => requiresDgValidation(l.montant)).length;

  const handleValidateClick = (id: string) => {
    setTargetId(id);
    setValidateComment('');
    setShowValidateDialog(true);
  };

  const handleRejectClick = (id: string) => {
    setTargetId(id);
    setRejectMotif('');
    setShowRejectDialog(true);
  };

  const confirmValidate = () => {
    if (targetId) {
      onValidate(targetId, validateComment || undefined);
      setShowValidateDialog(false);
      setTargetId(null);
    }
  };

  const confirmReject = () => {
    if (targetId && rejectMotif.trim()) {
      onReject(targetId, rejectMotif);
      setShowRejectDialog(false);
      setTargetId(null);
      setRejectMotif('');
    }
  };

  const targetLiq = sorted.find((l) => l.id === targetId);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-warning">{enAttente}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total net</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(montantTotal)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className={urgentCount > 0 ? 'border-red-300 dark:border-red-800' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p
                  className={`text-2xl font-bold ${urgentCount > 0 ? 'text-red-600 animate-pulse' : ''}`}
                >
                  {urgentCount}
                </p>
              </div>
              <Flame
                className={`h-8 w-8 ${urgentCount > 0 ? 'text-red-500/70 animate-pulse' : 'text-muted-foreground/50'}`}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requièrent DG</p>
                <p className="text-2xl font-bold text-secondary">{avecDG}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-secondary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune liquidation en attente de validation DAAF</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Liquidations en attente de validation ({enAttente})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead>Numéro</TableHead>
                  <TableHead>Engagement / Objet</TableHead>
                  <TableHead className="text-right">HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Retenues</TableHead>
                  <TableHead className="text-right">Net à payer</TableHead>
                  <TableHead className="text-center">DG requis</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((liq) => {
                  const totalRetenues =
                    (liq.airsi_montant || 0) +
                    (liq.retenue_source_montant || 0) +
                    (liq.retenue_bic_montant || 0) +
                    (liq.retenue_bnc_montant || 0) +
                    (liq.penalites_montant || liq.penalites_retard || 0);
                  const needsDG = requiresDgValidation(liq.montant);

                  return (
                    <TableRow
                      key={liq.id}
                      className={liq.reglement_urgent ? 'bg-red-50/50 dark:bg-red-950/10' : ''}
                    >
                      {/* Urgence */}
                      <TableCell>
                        {liq.reglement_urgent && (
                          <UrgentLiquidationBadge
                            variant="icon"
                            motif={liq.reglement_urgent_motif}
                            date={liq.reglement_urgent_date}
                          />
                        )}
                      </TableCell>
                      {/* Numéro */}
                      <TableCell>
                        <Button
                          variant="link"
                          className="h-auto p-0 font-mono text-sm"
                          onClick={() => onView(liq)}
                        >
                          {liq.numero}
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(liq.date_liquidation), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </TableCell>
                      {/* Engagement */}
                      <TableCell>
                        <div className="text-sm font-medium">{liq.engagement?.numero || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {liq.engagement?.objet}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {liq.engagement?.marche?.prestataire?.raison_sociale ||
                            liq.engagement?.fournisseur ||
                            ''}
                        </div>
                      </TableCell>
                      {/* HT */}
                      <TableCell className="text-right text-sm">
                        {formatCurrency(liq.montant_ht)}
                      </TableCell>
                      {/* TVA */}
                      <TableCell className="text-right text-sm">
                        {liq.tva_montant ? formatCurrency(liq.tva_montant) : '-'}
                      </TableCell>
                      {/* Retenues */}
                      <TableCell className="text-right text-sm">
                        {totalRetenues > 0 ? (
                          <span className="text-orange-600 dark:text-orange-400">
                            -{formatCurrency(totalRetenues)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      {/* Net à payer */}
                      <TableCell className="text-right font-bold text-success">
                        {formatCurrency(liq.net_a_payer || liq.montant)}
                      </TableCell>
                      {/* DG requis */}
                      <TableCell className="text-center">
                        {needsDG ? (
                          <Badge variant="outline" className="text-secondary border-secondary/30">
                            Oui
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Non</span>
                        )}
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => onView(liq)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleValidateClick(liq.id)}
                            disabled={isValidating}
                            className="gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectClick(liq.id)}
                            disabled={isRejecting}
                            className="gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Résumé en bas */}
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
              <span>{enAttente} liquidation(s) en attente</span>
              <span>
                Montant total net:{' '}
                <strong className="text-foreground">{formatCurrency(montantTotal)}</strong>
              </span>
              {urgentCount > 0 && (
                <span className="text-red-600 font-medium">dont {urgentCount} urgente(s)</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Valider */}
      <AlertDialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Valider la liquidation
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {targetLiq && (
                  <>
                    <p>
                      Vous validez la liquidation <strong>{targetLiq.numero}</strong> pour un
                      montant net de{' '}
                      <strong>{formatCurrency(targetLiq.net_a_payer || targetLiq.montant)}</strong>.
                    </p>
                    {requiresDgValidation(targetLiq.montant) && (
                      <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-secondary mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-secondary">
                            Montant {'\u2265'} {formatCurrency(SEUIL_VALIDATION_DG)}
                          </p>
                          <p className="text-muted-foreground">
                            Cette liquidation sera transmise au DG pour validation finale.
                          </p>
                        </div>
                      </div>
                    )}
                    {!requiresDgValidation(targetLiq.montant) && (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-sm">
                        Cette liquidation sera directement validée (pas de seuil DG).
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="text-sm font-medium">Commentaire (optionnel)</label>
                  <Textarea
                    value={validateComment}
                    onChange={(e) => setValidateComment(e.target.value)}
                    placeholder="Commentaire éventuel..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmValidate} disabled={isValidating}>
              {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Rejeter */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Rejeter la liquidation
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {targetLiq && (
                  <p>
                    Vous allez rejeter la liquidation <strong>{targetLiq.numero}</strong>.
                  </p>
                )}
                <div>
                  <label className="text-sm font-medium text-destructive">
                    Motif de rejet (obligatoire)
                  </label>
                  <Textarea
                    value={rejectMotif}
                    onChange={(e) => setRejectMotif(e.target.value)}
                    placeholder="Indiquer le motif du rejet..."
                    rows={3}
                    className="mt-1"
                  />
                  {rejectMotif.length > 0 && rejectMotif.length < 10 && (
                    <p className="text-xs text-destructive mt-1">
                      Le motif doit contenir au moins 10 caractères
                    </p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={isRejecting || rejectMotif.trim().length < 10}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <XCircle className="h-4 w-4 mr-2" />
              Confirmer le rejet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
