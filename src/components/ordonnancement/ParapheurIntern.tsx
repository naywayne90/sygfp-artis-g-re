import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useOrdonnancementSignatures,
  OrdonnancementSignature,
} from '@/hooks/useOrdonnancementSignatures';
import {
  FileSignature,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ParapheurInternProps {
  ordonnancementId: string;
  ordonnancementNumero: string;
  canSign?: boolean;
}

const PIECE_ICONS: Record<string, string> = {
  mandat: '📜',
  liquidation: '📋',
  engagement: '📄',
  facture: '🧾',
  pv_reception: '✅',
  autre: '📎',
};

function getSignatureStatus(
  sig: OrdonnancementSignature
): 'signed' | 'rejected' | 'pending' | 'waiting' {
  if (sig.signed_by && sig.comments?.startsWith('REJETÉ:')) return 'rejected';
  if (sig.signed_by) return 'signed';
  return 'pending';
}

export function ParapheurIntern({
  ordonnancementId,
  ordonnancementNumero,
  canSign = false,
}: ParapheurInternProps) {
  const {
    signatures,
    pieces,
    isLoading,
    currentSignature,
    allSigned,
    isRejected,
    signedCount,
    totalSignatures,
    sign,
    rejectSignature,
    isSigning,
    isRejecting,
    getRoleLabel,
  } = useOrdonnancementSignatures(ordonnancementId);

  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const handleSign = () => {
    if (currentSignature) {
      sign({ signatureId: currentSignature.id, comments: comments || undefined });
      setShowSignDialog(false);
      setComments('');
    }
  };

  const handleReject = () => {
    if (currentSignature && rejectReason) {
      rejectSignature({ signatureId: currentSignature.id, reason: rejectReason });
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec statut */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Parapheur - {ordonnancementNumero}
              </CardTitle>
              <CardDescription>Circuit de signature du mandat de paiement</CardDescription>
            </div>
            {allSigned ? (
              <Badge className="bg-success/10 text-success border-success/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Signé
              </Badge>
            ) : isRejected ? (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                <XCircle className="h-3 w-3 mr-1" />
                Rejeté
              </Badge>
            ) : (
              <Badge className="bg-warning/10 text-warning border-warning/20">
                <Clock className="h-3 w-3 mr-1" />
                {signedCount}/{totalSignatures} signatures
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Pièces du parapheur */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pièces jointes au parapheur
          </CardTitle>
          <CardDescription>Documents à vérifier avant signature</CardDescription>
        </CardHeader>
        <CardContent>
          {pieces.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune pièce attachée</p>
          ) : (
            <div className="space-y-2">
              {pieces
                .filter((p) => p.included_in_parapheur)
                .map((piece) => (
                  <div
                    key={piece.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{PIECE_ICONS[piece.piece_type] || '📎'}</span>
                      <div>
                        <p className="font-medium text-sm">{piece.piece_label}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {piece.piece_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    {piece.file_path && (
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Circuit de signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Circuit de validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {signatures.map((sig) => {
              const status = getSignatureStatus(sig);
              const roleLabel = getRoleLabel(sig.role);

              return (
                <div
                  key={sig.id}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg border
                    ${
                      status === 'signed'
                        ? 'bg-success/5 border-success/20'
                        : status === 'rejected'
                          ? 'bg-destructive/5 border-destructive/20'
                          : status === 'pending' && currentSignature?.id === sig.id
                            ? 'bg-warning/5 border-warning/20'
                            : 'bg-muted/30'
                    }
                  `}
                >
                  {/* Step indicator */}
                  <div
                    className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${
                      status === 'signed'
                        ? 'bg-success/10 border-success text-success'
                        : status === 'rejected'
                          ? 'bg-destructive/10 border-destructive text-destructive'
                          : status === 'pending'
                            ? 'bg-warning/10 border-warning text-warning'
                            : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                    }
                  `}
                  >
                    {status === 'signed' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : status === 'rejected' ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>

                  {/* Signature info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{roleLabel}</p>
                      <Badge variant="outline" className="text-xs">
                        {sig.role}
                      </Badge>
                    </div>
                    {status === 'signed' && sig.signed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Signé le{' '}
                        {format(new Date(sig.signed_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        {sig.signer?.full_name && ` par ${sig.signer.full_name}`}
                      </p>
                    )}
                    {status === 'rejected' && sig.comments && (
                      <p className="text-xs text-destructive mt-1">
                        Motif: {sig.comments.replace('REJETÉ: ', '')}
                      </p>
                    )}
                    {status === 'signed' && sig.comments && !sig.comments.startsWith('REJETÉ:') && (
                      <p className="text-xs text-muted-foreground italic mt-1">"{sig.comments}"</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <Badge
                    variant="outline"
                    className={
                      status === 'signed'
                        ? 'bg-success/10 text-success'
                        : status === 'rejected'
                          ? 'bg-destructive/10 text-destructive'
                          : status === 'pending'
                            ? 'bg-warning/10 text-warning'
                            : ''
                    }
                  >
                    {status === 'signed'
                      ? 'Signé'
                      : status === 'rejected'
                        ? 'Rejeté'
                        : 'En attente'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions de signature */}
      {canSign && currentSignature && !allSigned && !isRejected && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Votre signature est requise</p>
                  <p className="text-sm text-muted-foreground">
                    En tant que {getRoleLabel(currentSignature.role)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button onClick={() => setShowSignDialog(true)}>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Signer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la signature</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de signer ce mandat en tant que{' '}
              {currentSignature ? getRoleLabel(currentSignature.role) : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Commentaire (optionnel)</label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSign} disabled={isSigning}>
              {isSigning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileSignature className="h-4 w-4 mr-2" />
              )}
              Confirmer la signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le mandat</DialogTitle>
            <DialogDescription>
              Indiquez le motif du rejet. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Motif du rejet *</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Expliquez la raison du rejet..."
              className="mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
