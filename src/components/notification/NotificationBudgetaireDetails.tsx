/**
 * NotificationBudgetaireDetails - Affichage détaillé d'une notification
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Calendar,
  Wallet,
  User,
  Paperclip,
  Download,
  Trash2,
  Upload,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  useBudgetNotifications,
  BudgetNotification,
  EntityAttachment,
} from "@/hooks/useBudgetNotifications";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface NotificationBudgetaireDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: BudgetNotification | null;
}

export function NotificationBudgetaireDetails({
  open,
  onOpenChange,
  notification,
}: NotificationBudgetaireDetailsProps) {
  const {
    getAttachments,
    addAttachmentAsync,
    deleteAttachment,
    getStatutLabel,
    getStatutColor,
    formatMontant,
    isUploadingAttachment,
  } = useBudgetNotifications();

  const [attachments, setAttachments] = useState<EntityAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Load attachments when dialog opens
  useEffect(() => {
    if (open && notification) {
      loadAttachments();
    }
  }, [open, notification]);

  const loadAttachments = async () => {
    if (!notification) return;
    setLoadingAttachments(true);
    try {
      const data = await getAttachments(notification.id);
      setAttachments(data);
    } catch (error) {
      console.error("Error loading attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!notification || !e.target.files?.length) return;

    const file = e.target.files[0];
    try {
      await addAttachmentAsync({
        notificationId: notification.id,
        file,
        category: "document",
      });
      loadAttachments();
    } catch (error) {
      // Error handled by mutation
    }
    e.target.value = "";
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    deleteAttachment(attachmentId, {
      onSuccess: () => loadAttachments(),
    });
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!notification) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {notification.reference}
              </DialogTitle>
              <DialogDescription>
                Détails de la notification budgétaire
              </DialogDescription>
            </div>
            <Badge className={getStatutColor(notification.statut)}>
              {getStatutLabel(notification.statut)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Objet */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Objet</p>
                <p className="font-medium">{notification.objet}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Montant */}
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="font-bold text-lg">{formatMontant(notification.montant)}</p>
                  </div>
                </div>

                {/* Origine des fonds */}
                <div>
                  <p className="text-sm text-muted-foreground">Origine des fonds</p>
                  <p className="font-medium">
                    {notification.origine_fonds_libelle ||
                      notification.origine_fonds_code ||
                      "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date notification */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date de notification</p>
                    <p className="font-medium">
                      {format(new Date(notification.date_notification), "dd MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>

                {/* Date réception */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date de réception</p>
                    <p className="font-medium">
                      {notification.date_reception
                        ? format(new Date(notification.date_reception), "dd MMMM yyyy", {
                            locale: fr,
                          })
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nature dépense */}
              {notification.nature_depense && (
                <div>
                  <p className="text-sm text-muted-foreground">Nature de la dépense</p>
                  <p className="font-medium">{notification.nature_depense}</p>
                </div>
              )}

              {/* Commentaire */}
              {notification.commentaire && (
                <div>
                  <p className="text-sm text-muted-foreground">Commentaire</p>
                  <p className="text-sm">{notification.commentaire}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation / Rejet */}
          {(notification.statut === "valide" || notification.statut === "rejete") && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {notification.statut === "valide" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  {notification.statut === "valide" ? "Validation" : "Rejet"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {notification.statut === "valide" ? "Validé par" : "Rejeté par"}
                      </p>
                      <p className="font-medium">
                        {notification.validated_by_name || "-"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {notification.validated_at || notification.rejected_at
                        ? format(
                            new Date(notification.validated_at || notification.rejected_at || ""),
                            "dd/MM/yyyy à HH:mm",
                            { locale: fr }
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
                {notification.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Motif du rejet:</p>
                    <p className="text-sm text-red-700">{notification.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pièces jointes */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Pièces jointes ({attachments.length})
                </CardTitle>
                {notification.statut === "brouillon" && (
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      disabled={isUploadingAttachment}
                    >
                      {isUploadingAttachment ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Ajouter
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingAttachments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune pièce jointe
                </p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{attachment.original_filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.file_size)} •{" "}
                            {format(new Date(attachment.uploaded_at), "dd/MM/yyyy", {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.file_url, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {notification.statut === "brouillon" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                Créé par {notification.created_by_name || "Inconnu"} le{" "}
                {format(new Date(notification.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NotificationBudgetaireDetails;
