/**
 * Section Validation DG avec QR Code pour les Notes SEF (PROMPT 29)
 *
 * Affiche le QR code de validation, le statut et les observations du DG.
 * Le QR code encode une URL unique permettant au DG de valider via scan.
 */

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useValidationDGByNoteId,
  useCreateValidationDG,
  getValidationUrl,
  VALIDATION_STATUS_LABELS,
  VALIDATION_STATUS_COLORS,
} from "@/hooks/useValidationDG";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  User,
  MessageSquare,
  Calendar,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";

interface ValidationDGSectionProps {
  noteSefId: string;
  noteStatut: string | null;
  showActions?: boolean;
}

export function ValidationDGSection({
  noteSefId,
  noteStatut,
  _showActions = false,
}: ValidationDGSectionProps) {
  const { data: validation, isLoading, error, refetch } = useValidationDGByNoteId(noteSefId);
  const createValidation = useCreateValidationDG();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Icône selon le statut
  const StatusIcon = {
    PENDING: Clock,
    APPROVED: CheckCircle2,
    REJECTED: XCircle,
    DEFERRED: AlertCircle,
  }[validation?.status || "PENDING"];

  // Copier l'URL dans le presse-papier
  const handleCopyUrl = () => {
    if (validation?.token) {
      const url = getValidationUrl(validation.token);
      navigator.clipboard.writeText(url);
      toast.success("URL copiée dans le presse-papier");
    }
  };

  // Ouvrir l'URL dans un nouvel onglet
  const handleOpenUrl = () => {
    if (validation?.token) {
      const url = getValidationUrl(validation.token);
      window.open(url, "_blank");
    }
  };

  // Générer une validation si elle n'existe pas
  const handleCreateValidation = async () => {
    await createValidation.mutateAsync({ noteId: noteSefId });
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-32 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Impossible de charger les informations de validation.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Pas encore de validation et note pas soumise
  if (!validation && noteStatut !== "soumis" && noteStatut !== "a_valider") {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <QrCode className="h-5 w-5" />
            Validation DG
          </CardTitle>
          <CardDescription>
            Le QR code de validation sera généré lors de la soumission de la note.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-3">
              <QrCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Note en cours de rédaction
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Note soumise mais pas encore de validation (créer manuellement si besoin)
  if (!validation && (noteStatut === "soumis" || noteStatut === "a_valider")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Validation DG
          </CardTitle>
          <CardDescription>
            Générer le QR code de validation pour cette note.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <Button
              onClick={handleCreateValidation}
              disabled={createValidation.isPending}
            >
              {createValidation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              Générer le QR code
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validation existe - afficher le QR code et les détails
  const validationUrl = validation?.token ? getValidationUrl(validation.token) : "";

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Observations du Directeur Général
              </CardTitle>
              <CardDescription>
                QR code de validation et suivi
              </CardDescription>
            </div>
            {validation && (
              <Badge className={VALIDATION_STATUS_COLORS[validation.status]}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {VALIDATION_STATUS_LABELS[validation.status]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Code et informations */}
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="p-3 bg-white rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setQrDialogOpen(true)}
                title="Cliquez pour agrandir"
              >
                <QRCodeSVG
                  value={validationUrl}
                  size={120}
                  level="M"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setQrDialogOpen(true)}
              >
                <ZoomIn className="h-3 w-3 mr-1" />
                Agrandir
              </Button>
            </div>

            {/* Détails */}
            <div className="flex-1 space-y-3 text-sm">
              {/* Statut avec détails si validé */}
              {validation?.status !== "PENDING" && validation?.validated_at && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {validation.status === "APPROVED" && "Validée"}
                      {validation.status === "REJECTED" && "Rejetée"}
                      {validation.status === "DEFERRED" && "Différée"}
                      {" le "}
                      {format(new Date(validation.validated_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </span>
                  </div>
                  {validation.validated_by && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>
                        Par {validation.validated_by.full_name ||
                          `${validation.validated_by.first_name || ""} ${validation.validated_by.last_name || ""}`.trim() ||
                          "Directeur Général"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Observations/Commentaire */}
              {validation?.commentaire && (
                <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-xs text-muted-foreground mb-1">
                        Observations du DG
                      </p>
                      <p className="whitespace-pre-wrap">{validation.commentaire}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* En attente de validation */}
              {validation?.status === "PENDING" && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">En attente de validation</p>
                      <p className="text-amber-700 text-xs mt-1">
                        Le DG peut scanner ce QR code ou utiliser le lien ci-dessous pour valider.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions sur l'URL */}
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copier le lien
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenUrl}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ouvrir
                </Button>
              </div>

              {/* URL affichée (tronquée) */}
              <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">
                {validationUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour QR code agrandi */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code de Validation DG
            </DialogTitle>
            <DialogDescription>
              Scannez ce code avec votre appareil mobile pour valider la note.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            <div className="p-4 bg-white rounded-xl border-2 shadow-lg">
              <QRCodeSVG
                value={validationUrl}
                size={256}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm font-medium">
                Note SEF - Validation requise
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Authentification DG obligatoire
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={handleCopyUrl}>
              <Copy className="h-4 w-4 mr-2" />
              Copier le lien
            </Button>
            <Button onClick={handleOpenUrl}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ValidationDGSection;
