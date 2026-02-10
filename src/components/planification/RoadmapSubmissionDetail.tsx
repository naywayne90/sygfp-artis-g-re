/**
 * Composant de détail d'une soumission de feuille de route
 * Affiche les activités avec diff et permet validation/rejet
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RotateCcw,
  Loader2,
  Building2,
  FileSpreadsheet,
  History,
  ArrowRight,
  AlertTriangle,
  MessageSquare,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useRoadmapSubmissionDetail,
  computeActivityDiff,
  SubmissionStatus,
} from "@/hooks/useRoadmapSubmissions";

// Configuration des statuts
const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  brouillon: {
    label: "Brouillon",
    color: "bg-gray-100 text-gray-800",
    icon: <Clock className="h-3 w-3" />,
  },
  soumis: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Send className="h-3 w-3" />,
  },
  en_revision: {
    label: "En révision",
    color: "bg-orange-100 text-orange-800",
    icon: <RotateCcw className="h-3 w-3" />,
  },
  valide: {
    label: "Validé",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejete: {
    label: "Rejeté",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
};

// Configuration des statuts d'activité
const ACTIVITY_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  inclus: { label: "Inclus", color: "bg-gray-100 text-gray-800" },
  modifie: { label: "Modifié", color: "bg-blue-100 text-blue-800" },
  nouveau: { label: "Nouveau", color: "bg-green-100 text-green-800" },
  supprime: { label: "Supprimé", color: "bg-red-100 text-red-800" },
};

interface RoadmapSubmissionDetailDialogProps {
  submissionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidate: (comment?: string) => void;
  onReject: (reason: string) => void;
  onRequestRevision: (comment: string) => void;
  isValidating: boolean;
  isRejecting: boolean;
  isRequestingRevision: boolean;
}

export function RoadmapSubmissionDetailDialog({
  submissionId,
  open,
  onOpenChange,
  onValidate,
  onReject,
  onRequestRevision,
  isValidating,
  isRejecting,
  isRequestingRevision,
}: RoadmapSubmissionDetailDialogProps) {
  const { submission, activities, history, isLoading } =
    useRoadmapSubmissionDetail(submissionId);

  const [activeTab, setActiveTab] = useState<"summary" | "activities" | "history">("summary");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [revisionComment, setRevisionComment] = useState("");
  const [validationComment, setValidationComment] = useState("");

  // Formatage montant
  const formatMontant = (montant: number | undefined) => {
    if (montant === undefined) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(montant);
  };

  // Calcul des activités avec diff
  const activitiesWithDiff = activities.map((activity) => ({
    ...activity,
    diff: computeActivityDiff(activity),
  }));

  const activitiesWithChanges = activitiesWithDiff.filter((a) => a.diff.hasChanges);

  const handleValidate = () => {
    onValidate(validationComment || undefined);
    setValidationComment("");
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject(rejectReason);
    setRejectReason("");
    setShowRejectDialog(false);
  };

  const handleRequestRevision = () => {
    if (!revisionComment.trim()) return;
    onRequestRevision(revisionComment);
    setRevisionComment("");
    setShowRevisionDialog(false);
  };

  const statusConfig = submission
    ? STATUS_CONFIG[submission.status as SubmissionStatus]
    : null;
  const canTakeAction = submission?.status === "soumis";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Détail de la soumission
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : submission ? (
          <>
            {/* En-tête avec info soumission */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {submission.direction?.code} - {submission.direction?.label}
                  </span>
                </div>
                <p className="text-lg font-medium">{submission.libelle}</p>
                {submission.description && (
                  <p className="text-sm text-muted-foreground">{submission.description}</p>
                )}
              </div>
              <div className="text-right space-y-2">
                {statusConfig && (
                  <Badge className={`${statusConfig.color} gap-1`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                )}
                <div className="text-sm text-muted-foreground">
                  {submission.nb_activites} activités
                </div>
                <div className="font-mono font-medium">
                  {formatMontant(submission.montant_total)}
                </div>
              </div>
            </div>

            {/* Alertes si modifications détectées */}
            {activitiesWithChanges.length > 0 && (
              <Alert variant="default" className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Modifications détectées</AlertTitle>
                <AlertDescription className="text-blue-700">
                  {activitiesWithChanges.length} activité(s) ont été modifiées depuis la
                  soumission. Consultez l'onglet Activités pour voir les différences.
                </AlertDescription>
              </Alert>
            )}

            {/* Commentaires de validation/rejet */}
            {submission.status === "valide" && submission.validation_comment && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Commentaire de validation</AlertTitle>
                <AlertDescription className="text-green-700">
                  {submission.validation_comment}
                </AlertDescription>
              </Alert>
            )}

            {submission.status === "rejete" && submission.rejection_reason && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Motif de rejet</AlertTitle>
                <AlertDescription>{submission.rejection_reason}</AlertDescription>
              </Alert>
            )}

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Résumé</TabsTrigger>
                <TabsTrigger value="activities">
                  Activités ({activities.length})
                  {activitiesWithChanges.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5">
                      {activitiesWithChanges.length} diff
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">Historique ({history.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="flex-1 overflow-auto mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Exercice</span>
                        <span>{submission.exercice?.libelle}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Version</span>
                        <Badge variant="outline">v{submission.version}</Badge>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Créé le</span>
                        <span>
                          {format(new Date(submission.created_at), "dd MMMM yyyy à HH:mm", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      {submission.submitted_at && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Soumis le</span>
                          <span>
                            {format(new Date(submission.submitted_at), "dd MMMM yyyy à HH:mm", {
                              locale: fr,
                            })}
                          </span>
                        </div>
                      )}
                      {submission.validated_at && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Validé le</span>
                          <span>
                            {format(new Date(submission.validated_at), "dd MMMM yyyy à HH:mm", {
                              locale: fr,
                            })}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Intervenants</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {submission.submitted_by_profile && (
                        <div className="flex items-center gap-3 py-2 border-b">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {submission.submitted_by_profile.full_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Soumis par
                            </div>
                          </div>
                        </div>
                      )}
                      {submission.validated_by_profile && (
                        <div className="flex items-center gap-3 py-2 border-b">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium">
                              {submission.validated_by_profile.full_name}
                            </div>
                            <div className="text-sm text-muted-foreground">Validé par</div>
                          </div>
                        </div>
                      )}
                      {submission.rejected_by_profile && (
                        <div className="flex items-center gap-3 py-2 border-b">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <div>
                            <div className="font-medium">
                              {submission.rejected_by_profile.full_name}
                            </div>
                            <div className="text-sm text-muted-foreground">Rejeté par</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Actions de validation */}
                {canTakeAction && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="validation-comment">
                          Commentaire de validation (optionnel)
                        </Label>
                        <Textarea
                          id="validation-comment"
                          placeholder="Ajoutez un commentaire..."
                          value={validationComment}
                          onChange={(e) => setValidationComment(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleValidate}
                          disabled={isValidating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isValidating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          )}
                          Valider
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowRevisionDialog(true)}
                          disabled={isRequestingRevision}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Demander révision
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setShowRejectDialog(true)}
                          disabled={isRejecting}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activities" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Diff</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activitiesWithDiff.map((activity) => {
                        const activityStatusConfig =
                          ACTIVITY_STATUS_CONFIG[activity.status] ||
                          ACTIVITY_STATUS_CONFIG.inclus;
                        return (
                          <TableRow
                            key={activity.id}
                            className={activity.diff.hasChanges ? "bg-blue-50/50" : ""}
                          >
                            <TableCell className="font-mono">
                              {activity.activite?.code || activity.snapshot_data?.code || "—"}
                            </TableCell>
                            <TableCell>
                              {activity.activite?.libelle ||
                                activity.snapshot_data?.libelle ||
                                "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMontant(
                                activity.activite?.montant_prevu ??
                                  activity.snapshot_data?.montant_prevu
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={activityStatusConfig.color}>
                                {activityStatusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {activity.diff.hasChanges ? (
                                <DiffBadges changes={activity.diff.changes} />
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <div className="mt-1">
                          <HistoryActionIcon action={entry.action} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {getActionLabel(entry.action)}
                            </span>
                            {entry.old_status && entry.new_status && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {entry.old_status}
                                </Badge>
                                <ArrowRight className="h-3 w-3" />
                                <Badge variant="outline" className="text-xs">
                                  {entry.new_status}
                                </Badge>
                              </span>
                            )}
                          </div>
                          {entry.comment && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                              <MessageSquare className="h-3 w-3 mt-0.5" />
                              {entry.comment}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            {entry.performed_by_profile?.full_name || "Système"} -{" "}
                            {format(new Date(entry.performed_at), "dd/MM/yyyy HH:mm", {
                              locale: fr,
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Soumission non trouvée</p>
          </div>
        )}

        {/* Dialog de rejet */}
        {showRejectDialog && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Rejeter la soumission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Le rejet est définitif. L'auteur sera notifié du motif.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="reject-reason">Motif de rejet *</Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="Expliquez pourquoi cette soumission est rejetée..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectDialog(false);
                      setRejectReason("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || isRejecting}
                  >
                    {isRejecting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Confirmer le rejet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialog de demande de révision */}
        {showRevisionDialog && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <RotateCcw className="h-5 w-5" />
                  Demander une révision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  La soumission sera renvoyée à l'auteur pour modifications.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="revision-comment">Commentaire *</Label>
                  <Textarea
                    id="revision-comment"
                    placeholder="Indiquez les modifications demandées..."
                    value={revisionComment}
                    onChange={(e) => setRevisionComment(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRevisionDialog(false);
                      setRevisionComment("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleRequestRevision}
                    disabled={!revisionComment.trim() || isRequestingRevision}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isRequestingRevision ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Demander révision
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Composant pour afficher les badges de diff
function DiffBadges({
  changes,
}: {
  changes: { field: string; old: unknown; new: unknown }[];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {changes.map((change, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
          title={`${change.old} → ${change.new}`}
        >
          {change.field}
        </Badge>
      ))}
    </div>
  );
}

// Icône selon l'action
function HistoryActionIcon({ action }: { action: string }) {
  switch (action) {
    case "created":
      return <FileSpreadsheet className="h-4 w-4 text-gray-500" />;
    case "submitted":
      return <Send className="h-4 w-4 text-yellow-600" />;
    case "validated":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "revision_requested":
      return <RotateCcw className="h-4 w-4 text-orange-600" />;
    case "resubmitted":
      return <Send className="h-4 w-4 text-blue-600" />;
    default:
      return <History className="h-4 w-4 text-gray-500" />;
  }
}

// Label de l'action
function getActionLabel(action: string): string {
  switch (action) {
    case "created":
      return "Soumission créée";
    case "submitted":
      return "Soumis pour validation";
    case "validated":
      return "Validé";
    case "rejected":
      return "Rejeté";
    case "revision_requested":
      return "Révision demandée";
    case "resubmitted":
      return "Resoumis";
    case "updated":
      return "Mis à jour";
    default:
      return action;
  }
}
