import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Building2,
  Calendar,
  FileText,
  User,
  CheckCircle,
  Clock,
  Lock,
  ExternalLink,
  History,
  Wallet,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Banknote,
  Paperclip,
  Download,
  Printer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MODES_PAIEMENT,
  COMPTES_BANCAIRES_ARTI,
  DOCUMENTS_REGLEMENT,
  RENVOI_TARGETS,
  useReglements,
  type RenvoiTarget,
  type ReglementWithRelations,
} from '@/hooks/useReglements';
import { DossierStepTimeline } from '@/components/shared/DossierStepTimeline';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { ReglementTimeline } from './ReglementTimeline';
import { MouvementsBancairesDialog } from './MouvementsBancairesDialog';
import { ReglementReceiptDialog } from './ReglementReceipt';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';

interface ReglementAttachment {
  id: string;
  reglement_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string | null;
}

interface PaymentHistoryItem {
  id: string;
  numero: string;
  date_paiement: string;
  montant: number;
  mode_paiement: string;
  reference_paiement: string | null;
  statut: string | null;
  created_at: string | null;
}

interface ReglementDetailsProps {
  reglement: ReglementWithRelations;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const getModePaiementLabel = (mode: string) => {
  return MODES_PAIEMENT.find((m) => m.value === mode)?.label || mode;
};

const getCompteLabel = (compte: string) => {
  return COMPTES_BANCAIRES_ARTI.find((c) => c.value === compte)?.label || compte;
};

const getDocumentTypeLabel = (type: string) => {
  return DOCUMENTS_REGLEMENT.find((d) => d.type === type)?.label || type;
};

export function ReglementDetails({ reglement }: ReglementDetailsProps) {
  const { getTreasuryLink, rejectReglement } = useReglements();
  const { isAdmin } = useRBAC();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState('');
  const [renvoiTarget, setRenvoiTarget] = useState<RenvoiTarget>('engagement');
  const [showMouvementsDialog, setShowMouvementsDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  const ordonnancement = reglement.ordonnancement;
  const engagement = ordonnancement?.liquidation?.engagement;
  const liquidation = ordonnancement?.liquidation;
  const budgetLine = engagement?.budget_line;

  const montantOrdonnance = ordonnancement?.montant || 0;
  const montantPaye = ordonnancement?.montant_paye || 0;
  const restantAPayer = montantOrdonnance - montantPaye;
  const progressPaiement = montantOrdonnance > 0 ? (montantPaye / montantOrdonnance) * 100 : 0;
  const isFullyPaid = restantAPayer <= 0;
  const isRejected = reglement.statut === 'rejete';

  const isReadOnly = isFullyPaid && !isAdmin;

  const treasuryLink = getTreasuryLink(reglement.id, reglement.compte_bancaire_arti ?? undefined);

  // Fetch payment history for same ordonnancement
  const { data: paymentHistory = [] } = useQuery({
    queryKey: ['payment-history', reglement.ordonnancement_id] as const,
    queryFn: async () => {
      const ordId = reglement.ordonnancement_id;
      if (!ordId) return [];
      const { data, error } = await supabase
        .from('reglements')
        .select(
          'id, numero, date_paiement, montant, mode_paiement, reference_paiement, statut, created_at'
        )
        .eq('ordonnancement_id', ordId)
        .order('date_paiement', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PaymentHistoryItem[];
    },
    enabled: !!reglement.ordonnancement_id,
  });

  // Fetch attachments
  const { data: attachments = [] } = useQuery({
    queryKey: ['reglement-attachments', reglement.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reglement_attachments')
        .select('*')
        .eq('reglement_id', reglement.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReglementAttachment[];
    },
  });

  const handleDownloadAttachment = async (attachment: ReglementAttachment) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(attachment.file_path, 300);
    if (error || !data?.signedUrl) return;
    window.open(data.signedUrl, '_blank');
  };

  const handleReject = async () => {
    if (!rejectMotif.trim()) return;
    await rejectReglement.mutateAsync({
      reglementId: reglement.id,
      motif: rejectMotif,
      renvoiTarget,
    });
    setRejectDialogOpen(false);
    setRejectMotif('');
    setRenvoiTarget('engagement');
  };

  return (
    <div className="space-y-6">
      {/* Header avec statut */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{reglement.numero}</h2>
          <p className="text-muted-foreground">
            Enregistre le{' '}
            {reglement.created_at
              ? format(new Date(reglement.created_at), "dd MMMM yyyy 'a' HH:mm", { locale: fr })
              : '-'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isRejected ? (
            <Badge variant="destructive">
              <XCircle className="mr-1 h-3 w-3" />
              Rejete
            </Badge>
          ) : isFullyPaid ? (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle className="mr-1 h-3 w-3" />
              Solde
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              <Clock className="mr-1 h-3 w-3" />
              Partiel
            </Badge>
          )}
          {/* Print receipt button */}
          <Button variant="outline" size="sm" onClick={() => setShowReceiptDialog(true)}>
            <Printer className="mr-2 h-4 w-4" />
            Recu
          </Button>
          {/* Treasury link button */}
          <Button variant="outline" size="sm" asChild>
            <Link to={treasuryLink}>
              <Wallet className="mr-2 h-4 w-4" />
              Tresorerie
              <ExternalLink className="ml-2 h-3 w-3" />
            </Link>
          </Button>
          {/* Mouvements bancaires button */}
          <Button variant="outline" size="sm" onClick={() => setShowMouvementsDialog(true)}>
            <Banknote className="mr-2 h-4 w-4" />
            Mouvements
          </Button>
          {/* Reject button */}
          {!isRejected && !isFullyPaid && !isReadOnly && (
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Rejeter le reglement
                  </DialogTitle>
                  <DialogDescription>
                    Le reglement sera annule et le dossier sera renvoye vers l'etape choisie pour
                    correction.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="renvoiTarget">Renvoyer vers</Label>
                    <RadioGroup
                      value={renvoiTarget}
                      onValueChange={(v) => setRenvoiTarget(v as RenvoiTarget)}
                    >
                      {RENVOI_TARGETS.map((target) => (
                        <div key={target.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={target.value} id={target.value} />
                          <Label htmlFor={target.value} className="flex flex-col">
                            <span className="font-medium">{target.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {target.description}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motif">Motif de rejet (obligatoire)</Label>
                    <Textarea
                      id="motif"
                      placeholder="Decrivez la raison du rejet..."
                      value={rejectMotif}
                      onChange={(e) => setRejectMotif(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectMotif.trim() || rejectReglement.isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {rejectReglement.isPending ? 'En cours...' : 'Rejeter et renvoyer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Closure alert if fully paid */}
      {isFullyPaid && (
        <Alert className="bg-success/10 border-success/30">
          <Lock className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Dossier cloture</AlertTitle>
          <AlertDescription>
            Le dossier est maintenant en lecture seule
            {isAdmin ? ' (vous avez acces Admin)' : ''}. Tous les paiements ont ete effectues. La
            chaine de depense est complete.
          </AlertDescription>
        </Alert>
      )}

      {/* Rejection alert */}
      {isRejected && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Reglement rejete</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              <strong>Motif:</strong> {reglement.motif_rejet}
            </p>
            {reglement.renvoi_target && (
              <p>
                <strong>Renvoye vers:</strong>{' '}
                {RENVOI_TARGETS.find((t) => t.value === reglement.renvoi_target)?.label ||
                  reglement.renvoi_target}
              </p>
            )}
            {reglement.date_rejet && (
              <p className="text-xs">
                Rejete le{' '}
                {format(new Date(reglement.date_rejet), "dd MMMM yyyy 'a' HH:mm", { locale: fr })}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Dossier step timeline */}
      <DossierStepTimeline
        currentStep="reglement"
        compact
      />

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" className="gap-2">
            <FileText className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="paiements" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Historique ({paymentHistory.length})
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-2">
            <Wallet className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="journal" className="gap-2">
            <History className="h-4 w-4" />
            Journal
          </TabsTrigger>
        </TabsList>

        {/* --- Details tab --- */}
        <TabsContent value="details" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informations du reglement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informations du reglement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date de paiement</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(reglement.date_paiement), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mode de paiement</p>
                    <Badge variant="outline">{getModePaiementLabel(reglement.mode_paiement)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant paye</p>
                    <p className="text-xl font-bold text-success">
                      {formatMontant(reglement.montant)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-medium">{reglement.reference_paiement || '-'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Compte bancaire ARTI</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {reglement.compte_bancaire_arti
                        ? getCompteLabel(reglement.compte_bancaire_arti)
                        : '-'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Banque: {reglement.banque_arti || '-'}
                  </p>
                </div>

                {reglement.observation && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Observation</p>
                      <p className="text-sm">{reglement.observation}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Ordonnancement associe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ordonnancement associe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">N. Ordonnancement</p>
                    <p className="font-mono font-medium">{ordonnancement?.numero || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Beneficiaire</p>
                    <p className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {ordonnancement?.beneficiaire || '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Objet</p>
                  <p className="text-sm">{ordonnancement?.objet || '-'}</p>
                </div>

                <Separator />

                {/* Progression du paiement */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progression du paiement</span>
                    <span className="text-sm font-medium">{progressPaiement.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPaiement} className="h-3" />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Paye: {formatMontant(montantPaye)}</span>
                    <span>Total: {formatMontant(montantOrdonnance)}</span>
                  </div>
                  {!isFullyPaid && (
                    <p className="mt-2 text-sm font-medium text-warning">
                      Restant a payer: {formatMontant(restantAPayer)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pieces justificatives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Pieces justificatives ({attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune piece justificative associee
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Fichier</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attachments.map((att) => (
                      <TableRow key={att.id}>
                        <TableCell>
                          <Badge variant="outline">{getDocumentTypeLabel(att.document_type)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{att.file_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(att.file_size)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {att.created_at
                            ? format(new Date(att.created_at), 'dd/MM/yyyy', { locale: fr })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadAttachment(att)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Chaine de tracabilite */}
          <Card>
            <CardHeader>
              <CardTitle>Chaine de tracabilite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                <div className="flex-shrink-0 text-center">
                  <Badge variant="outline" className="mb-1">
                    Ligne budgetaire
                  </Badge>
                  <p className="text-sm font-mono">{budgetLine?.code || '-'}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {budgetLine?.label || '-'}
                  </p>
                </div>
                <div className="text-muted-foreground">&rarr;</div>
                <div className="flex-shrink-0 text-center">
                  <Badge variant="outline" className="mb-1">
                    Engagement
                  </Badge>
                  <p className="text-sm font-mono">{engagement?.numero || '-'}</p>
                </div>
                <div className="text-muted-foreground">&rarr;</div>
                <div className="flex-shrink-0 text-center">
                  <Badge variant="outline" className="mb-1">
                    Liquidation
                  </Badge>
                  <p className="text-sm font-mono">{ordonnancement?.liquidation?.numero || '-'}</p>
                </div>
                <div className="text-muted-foreground">&rarr;</div>
                <div className="flex-shrink-0 text-center">
                  <Badge variant="outline" className="mb-1">
                    Ordonnancement
                  </Badge>
                  <p className="text-sm font-mono">{ordonnancement?.numero || '-'}</p>
                </div>
                <div className="text-muted-foreground">&rarr;</div>
                <div className="flex-shrink-0 text-center">
                  <Badge className="mb-1 bg-success">Reglement</Badge>
                  <p className="text-sm font-mono">{reglement.numero}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cree par */}
          {reglement.created_by_profile && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Enregistre par</p>
                    <p className="font-medium">
                      {reglement.created_by_profile.full_name ||
                        `${reglement.created_by_profile.first_name || ''} ${reglement.created_by_profile.last_name || ''}`.trim() ||
                        '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* --- Payment history tab --- */}
        <TabsContent value="paiements" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des paiements pour cet ordonnancement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun paiement enregistre
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N. Reglement</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment) => {
                        const isCurrent = payment.id === reglement.id;
                        return (
                          <TableRow
                            key={payment.id}
                            className={isCurrent ? 'bg-primary/5' : undefined}
                          >
                            <TableCell className="font-mono text-sm font-medium">
                              {payment.numero}
                              {isCurrent && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  actuel
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(payment.date_paiement), 'dd/MM/yyyy', {
                                locale: fr,
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getModePaiementLabel(payment.mode_paiement)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatMontant(payment.montant)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {payment.reference_paiement || '-'}
                            </TableCell>
                            <TableCell>
                              {payment.statut === 'rejete' ? (
                                <Badge variant="destructive">Rejete</Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-success/10 text-success border-success/20"
                                >
                                  Enregistre
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {/* Summary */}
                  <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {paymentHistory.filter((p) => p.statut !== 'rejete').length} paiement(s)
                      valide(s)
                    </span>
                    <span className="font-medium">
                      Total:{' '}
                      {formatMontant(
                        paymentHistory
                          .filter((p) => p.statut !== 'rejete')
                          .reduce((sum, p) => sum + p.montant, 0)
                      )}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="pt-4">
          <ReglementTimeline reglement={reglement} />
        </TabsContent>

        <TabsContent value="journal" className="pt-4">
          <AuditLogViewer entityType="reglement" entityId={reglement.id} />
        </TabsContent>
      </Tabs>

      {/* Mouvements bancaires dialog */}
      <MouvementsBancairesDialog
        open={showMouvementsDialog}
        onOpenChange={setShowMouvementsDialog}
        reglementId={reglement.id}
        numeroReglement={reglement.numero}
        montantTotal={reglement.montant || 0}
        beneficiaire={ordonnancement?.beneficiaire}
      />

      {/* Receipt dialog */}
      <ReglementReceiptDialog
        reglement={reglement}
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
      />
    </div>
  );
}
