import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { useExerciceWriteGuard } from "@/hooks/useExerciceWriteGuard";
import { useBudgetTransfers, BudgetTransfer } from "@/hooks/useBudgetTransfers";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  ArrowRightLeft,
  TrendingUp,
  Check,
  X,
  Play,
  MoreVertical,
  Copy,
  AlertCircle,
  ArrowRight,
  Ban,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  brouillon: { label: "Brouillon", variant: "secondary" },
  soumis: { label: "Soumis", variant: "outline" },
  en_attente: { label: "En attente", variant: "outline" },
  valide: { label: "Validé", variant: "default" },
  approuve: { label: "Approuvé", variant: "default" },
  rejete: { label: "Rejeté", variant: "destructive" },
  execute: { label: "Exécuté", variant: "default" },
  annule: { label: "Annulé", variant: "destructive" },
};

export default function Virements() {
  const { exercice, isReadOnly } = useExercice();
  const { canWrite, getDisabledMessage } = useExerciceWriteGuard();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<BudgetTransfer | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    transfers,
    isLoading,
    stats,
    createTransfer,
    submitTransfer,
    validateTransfer,
    rejectTransfer,
    executeTransfer,
    cancelTransfer,
    isCreating,
    isExecuting,
  } = useBudgetTransfers({
    status: statusFilter !== "all" ? statusFilter : undefined,
    type_transfer: typeFilter !== "all" ? typeFilter : undefined,
  });

  // Filter transfers by search
  const filteredTransfers = transfers?.filter((t) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      t.code?.toLowerCase().includes(search) ||
      t.motif.toLowerCase().includes(search) ||
      t.from_line?.code.toLowerCase().includes(search) ||
      t.to_line?.code.toLowerCase().includes(search)
    );
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié");
  };

  const handleViewDetails = (transfer: BudgetTransfer) => {
    setSelectedTransfer(transfer);
    setShowDetailsDialog(true);
  };

  const handleReject = () => {
    if (!selectedTransfer || !rejectReason.trim()) return;
    rejectTransfer({ id: selectedTransfer.id, reason: rejectReason });
    setShowRejectDialog(false);
    setRejectReason("");
    setSelectedTransfer(null);
  };

  const handleCancel = () => {
    if (!selectedTransfer || !cancelReason.trim()) return;
    cancelTransfer({ id: selectedTransfer.id, reason: cancelReason });
    setShowCancelDialog(false);
    setCancelReason("");
    setSelectedTransfer(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Virements & Ajustements budgétaires</h1>
              {isReadOnly && <Lock className="h-5 w-5 text-warning" />}
            </div>
            <p className="text-muted-foreground">
              Exercice {exercice} - Gestion des mouvements de crédits
              {isReadOnly && <span className="ml-2 text-warning">(Lecture seule)</span>}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    disabled={!canWrite}
                  >
                    {!canWrite ? <Lock className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Nouveau
                  </Button>
                </span>
              </TooltipTrigger>
              {!canWrite && (
                <TooltipContent>
                  <p>{getDisabledMessage()}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">demandes à traiter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Validés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.validated}</div>
              <p className="text-xs text-muted-foreground">prêts à exécuter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                Exécutés ce mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.executedThisMonth}</div>
              <p className="text-xs text-muted-foreground">mouvements effectués</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Montant exécuté
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalExecutedAmount)}</div>
              <p className="text-xs text-muted-foreground">total des mouvements</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Code, motif, ligne..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="virement">Virements</SelectItem>
                    <SelectItem value="ajustement">Ajustements</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="soumis">Soumis</SelectItem>
                    <SelectItem value="valide">Validé</SelectItem>
                    <SelectItem value="execute">Exécuté</SelectItem>
                    <SelectItem value="rejete">Rejeté</SelectItem>
                    <SelectItem value="annule">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transfers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredTransfers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun virement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransfers?.map((transfer) => (
                    <TableRow key={transfer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(transfer)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{transfer.code || "-"}</span>
                          {transfer.code && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCode(transfer.code!);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transfer.type_transfer === "ajustement" ? "Ajustement" : "Virement"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transfer.from_line ? (
                          <div>
                            <div className="font-mono text-sm">{transfer.from_line.code}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {transfer.from_line.label}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">N/A (ajustement)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{transfer.to_line?.code}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {transfer.to_line?.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div>{formatCurrency(transfer.amount)}</div>
                        {transfer.status === "execute" && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="text-destructive">-{formatCurrency(transfer.from_dotation_avant || 0)}</span>
                            {" → "}
                            <span className="text-success">+{formatCurrency(transfer.to_dotation_apres || 0)}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_LABELS[transfer.status || "brouillon"]?.variant || "secondary"}>
                          {STATUS_LABELS[transfer.status || "brouillon"]?.label || transfer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(transfer.requested_at), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {transfer.status === "brouillon" && (
                              <>
                                <DropdownMenuItem onClick={() => submitTransfer(transfer.id)}>
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Soumettre
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTransfer(transfer);
                                    setShowCancelDialog(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Annuler
                                </DropdownMenuItem>
                              </>
                            )}
                            {(transfer.status === "soumis" || transfer.status === "en_attente") && (
                              <>
                                <DropdownMenuItem onClick={() => validateTransfer(transfer.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Valider
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTransfer(transfer);
                                    setShowRejectDialog(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Rejeter
                                </DropdownMenuItem>
                              </>
                            )}
                            {(transfer.status === "valide" || transfer.status === "approuve") && (
                              <DropdownMenuItem onClick={() => executeTransfer(transfer.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                Exécuter
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <CreateTransferDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={createTransfer}
          isLoading={isCreating}
          exercice={exercice || new Date().getFullYear()}
        />

        {/* Details Dialog */}
        {selectedTransfer && (
          <TransferDetailsDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            transfer={selectedTransfer}
            onSubmit={() => submitTransfer(selectedTransfer.id)}
            onValidate={() => validateTransfer(selectedTransfer.id)}
            onReject={() => setShowRejectDialog(true)}
            onExecute={() => executeTransfer(selectedTransfer.id)}
            onCancel={() => setShowCancelDialog(true)}
            isExecuting={isExecuting}
          />
        )}

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter le virement</DialogTitle>
              <DialogDescription>Indiquez le motif du rejet (obligatoire)</DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif du rejet..."
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
                Rejeter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Annuler le virement</DialogTitle>
              <DialogDescription>Indiquez le motif d'annulation (obligatoire)</DialogDescription>
            </DialogHeader>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motif d'annulation..."
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Retour
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={!cancelReason.trim()}>
                Confirmer l'annulation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// Create Transfer Dialog Component
function CreateTransferDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  exercice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  exercice: number;
}) {
  const [type, setType] = useState<"virement" | "ajustement">("virement");
  const [fromLineId, setFromLineId] = useState("");
  const [toLineId, setToLineId] = useState("");
  const [amount, setAmount] = useState(0);
  const [motif, setMotif] = useState("");
  const [justificationRenforcee, setJustificationRenforcee] = useState("");

  const { data: budgetLines } = useQuery({
    queryKey: ["budget-lines-transfer", exercice],
    queryFn: async () => {
      const { data } = await supabase
        .from("budget_lines")
        .select("id, code, label, dotation_initiale")
        .eq("exercice", exercice)
        .order("code");
      return data || [];
    },
    enabled: open,
  });

  const fromLine = budgetLines?.find((l) => l.id === fromLineId);
  const toLine = budgetLines?.find((l) => l.id === toLineId);

  // Calculate available for source line
  const { data: fromEngaged } = useQuery({
    queryKey: ["from-engaged", fromLineId],
    queryFn: async () => {
      const { data } = await supabase
        .from("budget_engagements")
        .select("montant")
        .eq("budget_line_id", fromLineId)
        .in("statut", ["valide", "en_cours"]);
      return data?.reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
    },
    enabled: !!fromLineId,
  });

  const fromDisponible = fromLine ? fromLine.dotation_initiale - (fromEngaged || 0) : 0;

  const isValid =
    toLineId &&
    amount > 0 &&
    motif.trim() &&
    (type === "ajustement" || (fromLineId && fromLineId !== toLineId && amount <= fromDisponible)) &&
    (type === "virement" || justificationRenforcee.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSubmit({
      type_transfer: type,
      from_budget_line_id: type === "virement" ? fromLineId : null,
      to_budget_line_id: toLineId,
      amount,
      motif,
      justification_renforcee: type === "ajustement" ? justificationRenforcee : undefined,
    });

    // Reset
    setType("virement");
    setFromLineId("");
    setToLineId("");
    setAmount(0);
    setMotif("");
    setJustificationRenforcee("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau virement / ajustement</DialogTitle>
          <DialogDescription>Créer une demande de mouvement budgétaire</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as "virement" | "ajustement")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="virement">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Virement
              </TabsTrigger>
              <TabsTrigger value="ajustement">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ajustement
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {type === "virement" && (
            <div className="space-y-2">
              <Label>Ligne source (à débiter) *</Label>
              <Select value={fromLineId} onValueChange={setFromLineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la ligne source..." />
                </SelectTrigger>
                <SelectContent>
                  {budgetLines?.map((line) => (
                    <SelectItem key={line.id} value={line.id} disabled={line.id === toLineId}>
                      {line.code} - {line.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fromLine && (
                <div className="text-sm text-muted-foreground">
                  Dotation: {formatCurrency(fromLine.dotation_initiale)} | Disponible:{" "}
                  <span className={fromDisponible < 0 ? "text-destructive" : "text-green-600"}>
                    {formatCurrency(fromDisponible)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label>Ligne destination (à créditer) *</Label>
            <Select value={toLineId} onValueChange={setToLineId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la ligne destination..." />
              </SelectTrigger>
              <SelectContent>
                {budgetLines?.map((line) => (
                  <SelectItem key={line.id} value={line.id} disabled={line.id === fromLineId}>
                    {line.code} - {line.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {toLine && (
              <div className="text-sm text-muted-foreground">
                Dotation actuelle: {formatCurrency(toLine.dotation_initiale)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA) *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={type === "virement" ? fromDisponible : undefined}
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
            {type === "virement" && fromLine && amount > fromDisponible && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Le montant dépasse le disponible de la ligne source</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Justification *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif du mouvement..."
              rows={2}
            />
          </div>

          {type === "ajustement" && (
            <div className="space-y-2">
              <Label htmlFor="justification_renforcee">Justification renforcée (obligatoire pour ajustement) *</Label>
              <Textarea
                id="justification_renforcee"
                value={justificationRenforcee}
                onChange={(e) => setJustificationRenforcee(e.target.value)}
                placeholder="Expliquez en détail la source des fonds et la raison de l'ajustement..."
                rows={3}
              />
            </div>
          )}

          {/* Preview */}
          {toLine && amount > 0 && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Aperçu Avant/Après</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {type === "virement" && fromLine && (
                  <div className="flex justify-between">
                    <span>{fromLine.code} (source):</span>
                    <span>
                      {formatCurrency(fromLine.dotation_initiale)} →{" "}
                      <span className="text-red-600">{formatCurrency(fromLine.dotation_initiale - amount)}</span>
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{toLine.code} (destination):</span>
                  <span>
                    {formatCurrency(toLine.dotation_initiale)} →{" "}
                    <span className="text-green-600">{formatCurrency(toLine.dotation_initiale + amount)}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? "Création..." : "Créer le brouillon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Transfer Details Dialog
function TransferDetailsDialog({
  open,
  onOpenChange,
  transfer,
  onSubmit,
  onValidate,
  onReject,
  onExecute,
  onCancel,
  isExecuting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: BudgetTransfer;
  onSubmit: () => void;
  onValidate: () => void;
  onReject: () => void;
  onExecute: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="font-mono">{transfer.code || "Brouillon"}</DialogTitle>
            {transfer.code && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(transfer.code!);
                  toast.success("Code copié");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            <Badge variant={STATUS_LABELS[transfer.status || "brouillon"]?.variant}>
              {STATUS_LABELS[transfer.status || "brouillon"]?.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <p className="font-medium capitalize">{transfer.type_transfer}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Montant</Label>
              <p className="font-medium font-mono">{formatCurrency(transfer.amount)}</p>
            </div>
          </div>

          {transfer.from_line && (
            <div>
              <Label className="text-muted-foreground">Ligne source</Label>
              <p className="font-medium">
                {transfer.from_line.code} - {transfer.from_line.label}
              </p>
              {transfer.status === "execute" && transfer.from_dotation_avant !== null && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(transfer.from_dotation_avant)} → {formatCurrency(transfer.from_dotation_apres || 0)}
                </p>
              )}
            </div>
          )}

          <div>
            <Label className="text-muted-foreground">Ligne destination</Label>
            <p className="font-medium">
              {transfer.to_line?.code} - {transfer.to_line?.label}
            </p>
            {transfer.status === "execute" && transfer.to_dotation_avant !== null && (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(transfer.to_dotation_avant)} → {formatCurrency(transfer.to_dotation_apres || 0)}
              </p>
            )}
          </div>

          <div>
            <Label className="text-muted-foreground">Justification</Label>
            <p>{transfer.motif}</p>
          </div>

          {transfer.justification_renforcee && (
            <div>
              <Label className="text-muted-foreground">Justification renforcée</Label>
              <p>{transfer.justification_renforcee}</p>
            </div>
          )}

          {transfer.rejection_reason && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Motif du rejet:</strong> {transfer.rejection_reason}
              </AlertDescription>
            </Alert>
          )}

          {transfer.cancel_reason && (
            <Alert>
              <Ban className="h-4 w-4" />
              <AlertDescription>
                <strong>Motif d'annulation:</strong> {transfer.cancel_reason}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p>Créé le: {format(new Date(transfer.requested_at), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
              {transfer.requested_by_profile && <p>Par: {transfer.requested_by_profile.full_name}</p>}
            </div>
            {transfer.executed_at && (
              <div>
                <p>Exécuté le: {format(new Date(transfer.executed_at), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>

          {transfer.status === "brouillon" && (
            <>
              <Button variant="destructive" onClick={onCancel}>
                Annuler
              </Button>
              <Button onClick={onSubmit}>Soumettre</Button>
            </>
          )}

          {(transfer.status === "soumis" || transfer.status === "en_attente") && (
            <>
              <Button variant="destructive" onClick={onReject}>
                Rejeter
              </Button>
              <Button onClick={onValidate}>Valider</Button>
            </>
          )}

          {(transfer.status === "valide" || transfer.status === "approuve") && (
            <Button onClick={onExecute} disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exécution...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Exécuter
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
