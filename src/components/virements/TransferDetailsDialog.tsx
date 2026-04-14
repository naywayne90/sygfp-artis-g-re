/**
 * Dialog de détail d'un virement / ajustement.
 *
 * Extrait le 2026-04-08 de `src/pages/planification/Virements.tsx`.
 * Refactoré le 2026-04-08 — workflow 2 niveaux CB → DG :
 *   - VirementChainNav  : navigation vers les entités liées (lignes + journal)
 *   - VirementTimeline  : historique workflow (compact dans le header, full dans l'onglet)
 *   - Upload PJ décision DG
 *   - Bouton "Télécharger PDF" (décision officielle)
 *   - Footer : boutons d'action conditionnels au statut ET au rôle (CB/DG/ADMIN).
 */

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowRight,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  FileText,
  History,
  Info,
  Loader2,
  Paperclip,
  Play,
  XCircle,
} from 'lucide-react';
import type { BudgetTransfer } from '@/hooks/useBudgetTransfers';
import { useRBAC } from '@/contexts/RBACContext';
import { formatCurrency } from './constants';
import { StatusBadge } from './StatusBadge';
import { VirementChainNav } from './VirementChainNav';
import { VirementTimeline } from './VirementTimeline';
import { downloadVirementDecisionPdf } from '@/services/virementDecisionPdfService';

interface TransferDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: BudgetTransfer;
  onApproveCb: () => void;
  onReject: () => void;
  onExecute: () => void;
  isExecuting: boolean;
}

export function TransferDetailsDialog({
  open,
  onOpenChange,
  transfer,
  onApproveCb,
  onReject,
  onExecute,
  isExecuting,
}: TransferDetailsDialogProps) {
  const { isCB, isDG, isAdmin } = useRBAC();
  const status = transfer.status || 'en_attente';
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const canApproveCb = (isCB || isAdmin) && status === 'en_attente';
  const canExecute = (isDG || isAdmin) && status === 'approuve';
  const canReject =
    (canApproveCb || canExecute) && (status === 'en_attente' || status === 'approuve');

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadVirementDecisionPdf({ transfer });
      toast.success('Décision PDF téléchargée');
    } catch (err) {
      console.error('[TransferDetailsDialog] PDF generation failed:', err);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle className="font-mono text-base sm:text-lg">
              {transfer.code || 'En attente'}
            </DialogTitle>
            {transfer.code && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(transfer.code as string);
                  toast.success('Code copié');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            <StatusBadge status={status} />
            <Badge
              variant="outline"
              className={
                transfer.type_transfer === 'ajustement' ? 'text-green-600' : 'text-blue-600'
              }
            >
              {transfer.type_transfer === 'ajustement' ? 'Ajustement' : 'Virement'}
            </Badge>
          </div>
        </DialogHeader>

        {/* Chain nav — navigation vers les entités liées */}
        <VirementChainNav transfer={transfer} onCloseDialog={() => onOpenChange(false)} />

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details" className="gap-1.5">
              <Info className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* ── Onglet Détails ── */}
          <TabsContent value="details" className="space-y-6">
            {/* Montant */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Montant du transfert</p>
              <p className="text-xl sm:text-3xl font-bold font-mono">
                {formatCurrency(transfer.amount)}
              </p>
            </div>

            {/* Workflow timeline compact */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Workflow
              </Label>
              <VirementTimeline transfer={transfer} mode="compact" />
            </div>

            {/* Source & Destination */}
            <div className="grid grid-cols-1 gap-3">
              {transfer.from_line && (
                <div className="p-3 rounded-lg border bg-red-50/50">
                  <Label className="text-xs text-muted-foreground">Ligne source (débitée)</Label>
                  <p className="font-mono text-sm font-medium">{transfer.from_line.code}</p>
                  <p className="text-sm">{transfer.from_line.label}</p>
                  {status === 'execute' && transfer.from_dotation_avant !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(transfer.from_dotation_avant)}{' '}
                      <ArrowRight className="inline h-3 w-3" />{' '}
                      {formatCurrency(transfer.from_dotation_apres || 0)}
                    </p>
                  )}
                </div>
              )}
              <div className="p-3 rounded-lg border bg-green-50/50">
                <Label className="text-xs text-muted-foreground">
                  Ligne destination (créditée)
                </Label>
                <p className="font-mono text-sm font-medium">{transfer.to_line?.code}</p>
                <p className="text-sm">{transfer.to_line?.label}</p>
                {status === 'execute' && transfer.to_dotation_avant !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(transfer.to_dotation_avant)}{' '}
                    <ArrowRight className="inline h-3 w-3" />{' '}
                    {formatCurrency(transfer.to_dotation_apres || 0)}
                  </p>
                )}
              </div>
            </div>

            {/* Justification */}
            <div>
              <Label className="text-xs text-muted-foreground">Justification</Label>
              <p className="text-sm mt-1">{transfer.motif}</p>
            </div>

            {transfer.justification_renforcee && (
              <div>
                <Label className="text-xs text-muted-foreground">Justification renforcée</Label>
                <p className="text-sm mt-1">{transfer.justification_renforcee}</p>
              </div>
            )}

            {/* Rejection alert */}
            {transfer.rejection_reason && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Motif du rejet :</strong> {transfer.rejection_reason}
                </AlertDescription>
              </Alert>
            )}

            {/* PJ décision DG (si jointe lors de l'exécution) */}
            {transfer.decision_file_url && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Décision du DG
                </Label>
                <a
                  href={transfer.decision_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-2 text-sm text-primary hover:underline max-w-full"
                  data-testid="decision-dg-link"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {transfer.decision_file_name || 'Télécharger la décision'}
                  </span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Dates récap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-muted-foreground border-t pt-3">
              <div>
                <p>
                  Créé le :{' '}
                  {format(new Date(transfer.requested_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
                {transfer.requested_by_profile && (
                  <p>Par : {transfer.requested_by_profile.full_name}</p>
                )}
              </div>
              {transfer.approved_at && (
                <div>
                  <p>
                    Validé le :{' '}
                    {format(new Date(transfer.approved_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                  {transfer.approved_by_profile && (
                    <p>Par : {transfer.approved_by_profile.full_name}</p>
                  )}
                </div>
              )}
              {transfer.executed_at && (
                <div>
                  <p>
                    Exécuté le :{' '}
                    {format(new Date(transfer.executed_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                  {transfer.executed_by_profile && (
                    <p>Par : {transfer.executed_by_profile.full_name}</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Onglet Historique ── */}
          <TabsContent value="timeline">
            <VirementTimeline transfer={transfer} mode="full" />
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            data-testid="download-pdf-btn"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Télécharger PDF
              </>
            )}
          </Button>

          {canReject && (
            <Button variant="destructive" size="sm" onClick={onReject}>
              <XCircle className="h-4 w-4 mr-1" />
              Rejeter
            </Button>
          )}

          {canApproveCb && (
            <Button onClick={onApproveCb}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Approuver (CB)
            </Button>
          )}

          {canExecute && (
            <Button onClick={onExecute} disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exécution...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Valider & Exécuter (DG)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
