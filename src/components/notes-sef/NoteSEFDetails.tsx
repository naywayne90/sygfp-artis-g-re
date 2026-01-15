import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NoteSEF, NoteSEFHistory, useNotesSEF } from "@/hooks/useNotesSEF";
import { PrintButton } from "@/components/export/PrintButton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  User,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
  FolderOpen,
  ExternalLink,
} from "lucide-react";

interface NoteSEFDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteSEF | null;
}

const getStatusBadge = (status: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
    soumis: { label: "Soumis", className: "bg-blue-100 text-blue-700" },
    a_valider: { label: "À valider", className: "bg-warning/10 text-warning" },
    valide: { label: "Validé", className: "bg-success/10 text-success" },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive" },
    differe: { label: "Différé", className: "bg-orange-100 text-orange-700" },
  };
  const variant = variants[status || "brouillon"] || variants.brouillon;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const getUrgenceBadge = (urgence: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    basse: { label: "Basse", className: "bg-muted text-muted-foreground" },
    normale: { label: "Normale", className: "bg-secondary text-secondary-foreground" },
    haute: { label: "Haute", className: "bg-warning text-warning-foreground" },
    urgente: { label: "Urgente", className: "bg-destructive text-destructive-foreground" },
  };
  const variant = variants[urgence || "normale"] || variants.normale;
  return <Badge className={variant.className}>{variant.label}</Badge>;
};

export function NoteSEFDetails({ open, onOpenChange, note }: NoteSEFDetailsProps) {
  const navigate = useNavigate();
  const { fetchHistory } = useNotesSEF();
  const [history, setHistory] = useState<NoteSEFHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (note && open) {
      setLoadingHistory(true);
      fetchHistory(note.id)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setLoadingHistory(false));
    }
  }, [note, open]);

  const handleGoToDossier = () => {
    if (note?.dossier_id) {
      onOpenChange(false);
      navigate(`/recherche?dossier=${note.dossier_id}`);
    }
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Note SEF - {note.numero || "Nouveau"}
            </DialogTitle>
            {note.id && (
              <PrintButton
                entityType="note_sef"
                entityId={note.id}
                label="Imprimer"
                size="sm"
                variant="outline"
              />
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Informations principales */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(note.statut)}
                  {getUrgenceBadge(note.urgence)}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Objet</p>
                  <p className="font-medium">{note.objet}</p>
                </div>

                {note.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="whitespace-pre-wrap">{note.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Direction</p>
                      <p>{note.direction?.label || "Non spécifiée"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Demandeur</p>
                      <p>
                        {note.demandeur
                          ? `${note.demandeur.first_name || ""} ${note.demandeur.last_name || ""}`
                          : "Non spécifié"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Exercice</p>
                      <p>{note.exercice}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Créée le</p>
                      <p>{format(new Date(note.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}</p>
                    </div>
                  </div>
                </div>

                {note.commentaire && (
                  <div>
                    <p className="text-sm text-muted-foreground">Commentaire</p>
                    <p className="whitespace-pre-wrap">{note.commentaire}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rejet */}
            {note.statut === "rejete" && note.rejection_reason && (
              <Card className="border-destructive/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    Motif de rejet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{note.rejection_reason}</p>
                  {note.rejected_at && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Rejetée le {format(new Date(note.rejected_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Différé */}
            {note.statut === "differe" && (
              <Card className="border-warning/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    Informations de report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {note.differe_motif && (
                    <div>
                      <p className="text-sm text-muted-foreground">Motif</p>
                      <p>{note.differe_motif}</p>
                    </div>
                  )}
                  {note.differe_condition && (
                    <div>
                      <p className="text-sm text-muted-foreground">Condition de reprise</p>
                      <p>{note.differe_condition}</p>
                    </div>
                  )}
                  {note.differe_date_reprise && (
                    <div>
                      <p className="text-sm text-muted-foreground">Date de reprise prévue</p>
                      <p>{format(new Date(note.differe_date_reprise), "dd MMM yyyy", { locale: fr })}</p>
                    </div>
                  )}
                  {note.differe_at && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Différée le {format(new Date(note.differe_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Validation + Lien Dossier */}
            {note.statut === "valide" && note.validated_at && (
              <Card className="border-success/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    Validation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Validée le {format(new Date(note.validated_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                  </p>
                  
                  {/* Lien vers le dossier créé */}
                  {note.dossier_id && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                      <FolderOpen className="h-5 w-5 text-success" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Dossier créé automatiquement</p>
                        <p className="text-xs text-muted-foreground">
                          {note.dossier?.numero || "Dossier lié"}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 border-success/30 text-success hover:bg-success/10"
                        onClick={handleGoToDossier}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Voir le dossier
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Historique */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historique
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <p className="text-muted-foreground text-sm">Chargement...</p>
                ) : history.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun historique</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{entry.action}</span>
                            {entry.old_statut && entry.new_statut && (
                              <span className="text-muted-foreground">
                                ({entry.old_statut} → {entry.new_statut})
                              </span>
                            )}
                          </div>
                          {entry.commentaire && (
                            <p className="text-muted-foreground">{entry.commentaire}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.performed_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                            {entry.performer && ` par ${entry.performer.first_name || ""} ${entry.performer.last_name || ""}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
