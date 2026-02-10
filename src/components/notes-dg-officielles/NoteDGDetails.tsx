/**
 * Détails d'une Note Direction Générale avec imputations
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNoteDGPdf } from "@/hooks/useNoteDGPdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  NoteDirectionGenerale,
  NoteDGStatut,
  INSTRUCTION_TYPES,
  useNoteDGImputations,
  InstructionType,
  ImputationPriorite,
} from "@/hooks/useNotesDirectionGenerale";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  Calendar,
  User,
  Building2,
  Send,
  CheckCircle,
  XCircle,
  Share2,
  Edit,
  Plus,
  Trash2,
  CheckCheck,
  Clock,
  Download,
  Loader2,
} from "lucide-react";
import { NoteDGImputationForm } from "./NoteDGImputationForm";

interface NoteDGDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteDirectionGenerale | null;
  onEdit?: (note: NoteDirectionGenerale) => void;
  onSubmit?: (noteId: string) => void;
  onValidate?: (noteId: string) => void;
  onReject?: (note: NoteDirectionGenerale) => void;
  onDiffuse?: (noteId: string) => void;
}

const getStatusBadge = (status: NoteDGStatut) => {
  const variants: Record<NoteDGStatut, { label: string; className: string }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    soumise_dg: { label: "Soumise au DG", className: "bg-blue-100 text-blue-700" },
    dg_valide: { label: "Validée DG", className: "bg-success/10 text-success" },
    dg_rejetee: { label: "Rejetée", className: "bg-destructive/10 text-destructive" },
    diffusee: { label: "Diffusée", className: "bg-purple-100 text-purple-700" },
  };
  const variant = variants[status] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const getPrioriteBadge = (priorite: ImputationPriorite | null) => {
  const variants: Record<ImputationPriorite, { label: string; className: string }> = {
    normale: { label: "Normale", className: "bg-muted text-muted-foreground" },
    urgente: { label: "Urgente", className: "bg-warning/10 text-warning" },
    tres_urgente: { label: "Très urgente", className: "bg-destructive/10 text-destructive" },
  };
  if (!priorite) return null;
  const variant = variants[priorite] || variants.normale;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

export function NoteDGDetails({
  open,
  onOpenChange,
  note,
  onEdit,
  onSubmit,
  onValidate,
  onReject,
  onDiffuse,
}: NoteDGDetailsProps) {
  const { hasAnyRole } = usePermissions();
  const canValidate = hasAnyRole(["Admin", "DG"]);

  const {
    imputations,
    isLoading: _imputationsLoading,
    deleteImputation,
    acknowledgeReceipt,
  } = useNoteDGImputations(note?.id || null);

  const { downloadPdf, isDownloading } = useNoteDGPdf({ noteId: note?.id || null });

  const [showImputationForm, setShowImputationForm] = useState(false);

  // Handler pour télécharger le PDF
  const handleDownloadPdf = async () => {
    if (!note) return;
    await downloadPdf({ note, imputations });
  };

  if (!note) return null;

  const canEdit = ["brouillon", "dg_rejetee"].includes(note.statut);
  const canSubmit = note.statut === "brouillon";
  const canValidateNote = canValidate && note.statut === "soumise_dg";
  const canDiffuse = note.statut === "dg_valide";
  const canDownloadPdf = ["dg_valide", "diffusee"].includes(note.statut);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Note DG - {note.reference || "Brouillon"}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {getStatusBadge(note.statut)}
              <span className="text-muted-foreground">•</span>
              <span>{note.objet}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informations principales */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {note.date_note
                        ? format(new Date(note.date_note), "dd MMMM yyyy", { locale: fr })
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Destinataire</p>
                    <p className="text-sm text-muted-foreground">{note.destinataire}</p>
                  </div>
                </div>
                {note.direction && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Direction</p>
                      <p className="text-sm text-muted-foreground">
                        {note.direction.sigle || note.direction.label}
                      </p>
                    </div>
                  </div>
                )}
                {note.nom_prenoms && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Signataire</p>
                      <p className="text-sm text-muted-foreground">{note.nom_prenoms}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Corps de la note */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Corps de la note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {note.expose && (
                  <div>
                    <p className="text-sm font-medium mb-1">Exposé</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.expose}
                    </p>
                  </div>
                )}
                {note.avis && (
                  <div>
                    <p className="text-sm font-medium mb-1">Avis</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.avis}
                    </p>
                  </div>
                )}
                {note.recommandations && (
                  <div>
                    <p className="text-sm font-medium mb-1">Recommandations</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.recommandations}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Imputations */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Imputations</CardTitle>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowImputationForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Destinataires et instructions associées à cette note
                </CardDescription>
              </CardHeader>
              <CardContent>
                {imputations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune imputation définie
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Destinataire</TableHead>
                        <TableHead>Instruction</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Délai</TableHead>
                        <TableHead>Accusé</TableHead>
                        {canEdit && <TableHead className="w-[50px]" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imputations.map((imp) => (
                        <TableRow key={imp.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{imp.destinataire}</p>
                              {imp.direction && (
                                <p className="text-xs text-muted-foreground">
                                  {imp.direction.sigle || imp.direction.label}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {INSTRUCTION_TYPES[imp.instruction_type as InstructionType]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getPrioriteBadge(imp.priorite as ImputationPriorite)}
                          </TableCell>
                          <TableCell>
                            {imp.delai
                              ? format(new Date(imp.delai), "dd/MM/yyyy", { locale: fr })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {imp.accuse_reception ? (
                              <Badge variant="outline" className="bg-success/10 text-success">
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Reçu
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => acknowledgeReceipt(imp.id)}
                                title="Marquer comme reçu"
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer l'imputation ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteImputation(imp.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Motif de rejet si rejetée */}
            {note.statut === "dg_rejetee" && note.motif_rejet && (
              <Card className="border-destructive">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-destructive flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Motif de rejet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{note.motif_rejet}</p>
                  {note.rejected_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Rejetée le {format(new Date(note.rejected_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex justify-end gap-2">
              {/* Bouton PDF - visible uniquement pour les notes validées */}
              {canDownloadPdf && (
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Télécharger PDF
                </Button>
              )}
              {canEdit && onEdit && (
                <Button variant="outline" onClick={() => onEdit(note)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
              {canSubmit && onSubmit && (
                <Button onClick={() => onSubmit(note.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Soumettre au DG
                </Button>
              )}
              {canValidateNote && onValidate && (
                <Button onClick={() => onValidate(note.id)} className="bg-success hover:bg-success/90">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider
                </Button>
              )}
              {canValidateNote && onReject && (
                <Button variant="destructive" onClick={() => onReject(note)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              )}
              {canDiffuse && onDiffuse && (
                <Button onClick={() => onDiffuse(note.id)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Diffuser
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulaire d'ajout d'imputation */}
      {note && (
        <NoteDGImputationForm
          open={showImputationForm}
          onOpenChange={setShowImputationForm}
          noteId={note.id}
        />
      )}
    </>
  );
}

export default NoteDGDetails;
