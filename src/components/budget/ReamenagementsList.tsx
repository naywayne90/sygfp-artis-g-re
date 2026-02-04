/**
 * ReamenagementsList - Liste des réaménagements budgétaires avec validation
 * Basé sur l'analyse de l'ancien SYGFP (arti-ci.com:8001)
 *
 * Affiche les réaménagements avec:
 * - Filtrage par statut
 * - Détails des imputations source/destination
 * - Actions de validation/rejet
 */

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRight,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  useReamenagementBudgetaire,
  type ReamenagementBudgetaire,
} from "@/hooks/useReamenagementBudgetaire";
import { useExercice } from "@/contexts/ExerciceContext";
import { useRBAC } from "@/hooks/useRBAC";

interface ReamenementsListProps {
  filterStatut?: "en_attente" | "valide" | "rejete" | "tous";
  showActions?: boolean;
}

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case "en_attente":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          En attente
        </Badge>
      );
    case "valide":
      return (
        <Badge className="bg-success gap-1">
          <CheckCircle className="h-3 w-3" />
          Validé
        </Badge>
      );
    case "rejete":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Rejeté
        </Badge>
      );
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
};

export function ReamenagementsList({
  filterStatut = "tous",
  showActions = true,
}: ReamenementsListProps) {
  const { exerciceId } = useExercice();
  const { isAdmin, hasProfil } = useRBAC();
  const canValidate = isAdmin || hasProfil("Validateur") || hasProfil("Controleur");

  // State
  const [selectedReamenagement, setSelectedReamenagement] =
    useState<ReamenagementBudgetaire | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");

  // Query
  const {
    reamenagements,
    isLoading,
    validate,
    reject,
    isValidating,
  } = useReamenagementBudgetaire(exerciceId);

  // Filter reamenagements
  const filteredReamenagements =
    filterStatut === "tous"
      ? reamenagements
      : reamenagements.filter((r) => r.statut === filterStatut);

  // Handle validation
  const handleValidate = async (id: string) => {
    if (!confirm("Confirmer la validation de ce réaménagement ?")) return;
    validate(id);
  };

  // Handle rejection
  const handleOpenRejectDialog = (reamenagement: ReamenagementBudgetaire) => {
    setSelectedReamenagement(reamenagement);
    setRejectMotif("");
    setShowRejectDialog(true);
  };

  const handleReject = () => {
    if (!selectedReamenagement || !rejectMotif.trim()) return;
    reject(selectedReamenagement.id, rejectMotif.trim());
    setShowRejectDialog(false);
    setSelectedReamenagement(null);
    setRejectMotif("");
  };

  // Handle view details
  const handleViewDetails = (reamenagement: ReamenagementBudgetaire) => {
    setSelectedReamenagement(reamenagement);
    setShowDetailsDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredReamenagements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucun réaménagement budgétaire trouvé</p>
        {filterStatut !== "tous" && (
          <p className="text-sm">pour le filtre "{filterStatut}"</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead></TableHead>
              <TableHead>Destination</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Statut</TableHead>
              {showActions && <TableHead className="w-[120px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReamenagements.map((reamenagement) => (
              <TableRow key={reamenagement.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(reamenagement.created_at), "dd/MM/yyyy", {
                    locale: fr,
                  })}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <p className="font-mono text-sm truncate max-w-[150px]">
                            {reamenagement.imputation_source}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {reamenagement.libelle_source || "-"}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono">{reamenagement.imputation_source}</p>
                        <p className="text-sm">{reamenagement.libelle_source}</p>
                        <p className="text-xs text-muted-foreground">
                          NBE: {reamenagement.nature_nbe_source}
                        </p>
                        <p className="text-xs">
                          Budget: {formatMontant(reamenagement.budget_source_avant)} →{" "}
                          {formatMontant(reamenagement.budget_source_apres)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <p className="font-mono text-sm truncate max-w-[150px]">
                            {reamenagement.imputation_destination}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {reamenagement.libelle_destination || "-"}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono">
                          {reamenagement.imputation_destination}
                        </p>
                        <p className="text-sm">{reamenagement.libelle_destination}</p>
                        <p className="text-xs text-muted-foreground">
                          NBE: {reamenagement.nature_nbe_destination}
                        </p>
                        <p className="text-xs">
                          Budget: {formatMontant(reamenagement.budget_destination_avant)}{" "}
                          → {formatMontant(reamenagement.budget_destination_apres)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatMontant(reamenagement.montant)}
                </TableCell>
                <TableCell>{getStatutBadge(reamenagement.statut)}</TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewDetails(reamenagement)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canValidate && reamenagement.statut === "en_attente" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-success hover:text-success"
                            onClick={() => handleValidate(reamenagement.id)}
                            disabled={isValidating}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleOpenRejectDialog(reamenagement)}
                            disabled={isValidating}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Détails du réaménagement</DialogTitle>
            <DialogDescription>
              Demande du{" "}
              {selectedReamenagement &&
                format(new Date(selectedReamenagement.created_at), "dd MMMM yyyy", {
                  locale: fr,
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedReamenagement && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex justify-between items-center">
                {getStatutBadge(selectedReamenagement.statut)}
                {selectedReamenagement.created_by_nom && (
                  <span className="text-sm text-muted-foreground">
                    par {selectedReamenagement.created_by_nom}
                  </span>
                )}
              </div>

              {/* Imputations */}
              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Source (débit)</p>
                  <p className="font-mono text-sm">
                    {selectedReamenagement.imputation_source}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedReamenagement.libelle_source}
                  </p>
                  <div className="mt-2 text-xs">
                    <p>
                      Avant: {formatMontant(selectedReamenagement.budget_source_avant)}
                    </p>
                    <p className="font-medium text-red-600">
                      Après: {formatMontant(selectedReamenagement.budget_source_apres)}
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-6 w-6 text-muted-foreground" />

                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Destination (crédit)
                  </p>
                  <p className="font-mono text-sm">
                    {selectedReamenagement.imputation_destination}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedReamenagement.libelle_destination}
                  </p>
                  <div className="mt-2 text-xs">
                    <p>
                      Avant:{" "}
                      {formatMontant(selectedReamenagement.budget_destination_avant)}
                    </p>
                    <p className="font-medium text-green-600">
                      Après:{" "}
                      {formatMontant(selectedReamenagement.budget_destination_apres)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Montant */}
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Montant transféré</p>
                <p className="text-2xl font-bold">
                  {formatMontant(selectedReamenagement.montant)}
                </p>
              </div>

              {/* Motif */}
              <div>
                <Label className="text-muted-foreground">Justification</Label>
                <p className="mt-1">{selectedReamenagement.motif}</p>
              </div>

              {/* Reference note */}
              {selectedReamenagement.reference_note && (
                <div>
                  <Label className="text-muted-foreground">Référence de la note</Label>
                  <p className="mt-1 font-mono">
                    {selectedReamenagement.reference_note}
                  </p>
                </div>
              )}

              {/* Validation info */}
              {selectedReamenagement.statut !== "en_attente" && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {selectedReamenagement.statut === "valide"
                          ? "Validé par"
                          : "Rejeté par"}
                      </p>
                      <p className="font-medium">
                        {selectedReamenagement.valide_par_nom || "-"}
                      </p>
                    </div>
                    {selectedReamenagement.date_validation && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p>
                          {format(
                            new Date(selectedReamenagement.date_validation),
                            "dd/MM/yyyy HH:mm",
                            { locale: fr }
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedReamenagement.motif_rejet && (
                    <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm font-medium text-destructive">
                        Motif de rejet:
                      </p>
                      <p className="text-sm">{selectedReamenagement.motif_rejet}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Rejeter le réaménagement
            </DialogTitle>
            <DialogDescription>
              Cette action annulera la demande de transfert budgétaire.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectMotif">Motif de rejet *</Label>
              <Textarea
                id="rejectMotif"
                value={rejectMotif}
                onChange={(e) => setRejectMotif(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectMotif.trim() || isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  En cours...
                </>
              ) : (
                "Confirmer le rejet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
