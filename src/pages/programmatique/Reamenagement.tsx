import { useState, useMemo } from "react";
import { useExercice } from "@/contexts/ExerciceContext";
import { useBudgetLines, BudgetLineWithRelations, getDisplayBudgetCode } from "@/hooks/useBudgetLines";
import { useBudgetTransfers, useBudgetLineAvailable } from "@/hooks/useBudgetTransfers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftRight,
  Search,
  Plus,
  Check,
  X,
  Play,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ChevronDown,
  FileText,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

export default function Reamenagement() {
  const { exercice, isReadOnly } = useExercice();
  const [activeTab, setActiveTab] = useState("nouveau");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);

  const { budgetLines } = useBudgetLines();
  const { transfers, isLoading, stats, createTransfer, submitTransfer, validateTransfer, rejectTransfer, executeTransfer, cancelTransfer, isCreating, isExecuting } = useBudgetTransfers({
    status: statusFilter !== "all" ? statusFilter : undefined,
    type_transfer: "virement",
  });

  // Filter only virements (réaménagements)
  const virements = useMemo(() => {
    return transfers?.filter((t) => t.type_transfer === "virement") || [];
  }, [transfers]);

  // Format currency
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "brouillon":
        return <Badge variant="outline">Brouillon</Badge>;
      case "soumis":
        return <Badge variant="secondary">Soumis</Badge>;
      case "en_attente":
        return <Badge variant="secondary">En attente</Badge>;
      case "valide":
        return <Badge className="bg-blue-500">Validé</Badge>;
      case "approuve":
        return <Badge className="bg-blue-500">Approuvé</Badge>;
      case "execute":
        return <Badge className="bg-green-500">Exécuté</Badge>;
      case "rejete":
        return <Badge variant="destructive">Rejeté</Badge>;
      case "annule":
        return <Badge variant="secondary">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Export Excel
  const handleExport = () => {
    if (!virements || virements.length === 0) return;

    const exportData = virements.map((v) => ({
      Code: v.code || "-",
      Date: v.requested_at ? format(new Date(v.requested_at), "dd/MM/yyyy") : "-",
      "Ligne source": v.from_line?.code || "-",
      "Libellé source": v.from_line?.label || "-",
      "Ligne destination": v.to_line?.code || "-",
      "Libellé destination": v.to_line?.label || "-",
      Montant: v.amount,
      Motif: v.motif,
      Statut: v.status,
      "Demandeur": v.requested_by_profile?.full_name || "-",
      "Validateur": v.approved_by_profile?.full_name || "-",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Réaménagements");
    XLSX.writeFile(wb, `reamenagements_${exercice}.xlsx`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" />
            Réaménagement budgétaire - Exercice {exercice}
          </h1>
          <p className="text-muted-foreground">
            Virements internes entre lignes budgétaires
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          {!isReadOnly && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau réaménagement
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Validés</p>
                <p className="text-xl font-bold">{stats.validated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Exécutés</p>
                <p className="text-xl font-bold">{stats.executed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ce mois</p>
                <p className="text-xl font-bold">{stats.executedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-lg font-bold">{formatMontant(stats.totalExecutedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="nouveau">
              <Clock className="h-4 w-4 mr-2" />
              En cours ({stats.pending + stats.validated})
            </TabsTrigger>
            <TabsTrigger value="historique">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Historique ({stats.executed})
            </TabsTrigger>
          </TabsList>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
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

        <TabsContent value="nouveau">
          <Card>
            <CardContent className="pt-4">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : virements.filter((v) => !["execute", "annule"].includes(v.status || "")).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Aucun réaménagement en cours
                        </TableCell>
                      </TableRow>
                    ) : (
                      virements
                        .filter((v) => !["execute", "annule"].includes(v.status || ""))
                        .map((v) => (
                          <TableRow key={v.id}>
                            <TableCell className="font-mono">{v.code}</TableCell>
                            <TableCell>
                              {v.requested_at
                                ? format(new Date(v.requested_at), "dd/MM/yyyy", { locale: fr })
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-mono text-sm">{v.from_line?.code}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {v.from_line?.label}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-mono text-sm">{v.to_line?.code}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {v.to_line?.label}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatMontant(v.amount)}
                            </TableCell>
                            <TableCell>{getStatusBadge(v.status || "brouillon")}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedTransfer(v)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {v.status === "brouillon" && !isReadOnly && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => submitTransfer(v.id)}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                )}
                                {v.status === "soumis" && !isReadOnly && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600"
                                      onClick={() => validateTransfer(v.id)}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600"
                                      onClick={() => {
                                        const reason = prompt("Motif du rejet:");
                                        if (reason) rejectTransfer({ id: v.id, reason });
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {v.status === "valide" && !isReadOnly && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600"
                                    onClick={() => executeTransfer(v.id)}
                                    disabled={isExecuting}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique">
          <Card>
            <CardContent className="pt-4">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Date exécution</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {virements
                      .filter((v) => ["execute", "annule", "rejete"].includes(v.status || ""))
                      .map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-mono">{v.code}</TableCell>
                          <TableCell>
                            {v.executed_at
                              ? format(new Date(v.executed_at), "dd/MM/yyyy", { locale: fr })
                              : v.cancelled_at
                              ? format(new Date(v.cancelled_at), "dd/MM/yyyy", { locale: fr })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-sm">{v.from_line?.code}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {v.from_line?.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-sm">{v.to_line?.code}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {v.to_line?.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(v.amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(v.status || "execute")}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTransfer(v)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateReamenagementDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        budgetLines={budgetLines || []}
        onSubmit={createTransfer}
        isCreating={isCreating}
      />

      {/* Detail Dialog */}
      <TransferDetailDialog
        transfer={selectedTransfer}
        open={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
      />
    </div>
  );
}

// Create Dialog Component
function CreateReamenagementDialog({
  open,
  onClose,
  budgetLines,
  onSubmit,
  isCreating,
}: {
  open: boolean;
  onClose: () => void;
  budgetLines: BudgetLineWithRelations[];
  onSubmit: (data: any) => void;
  isCreating: boolean;
}) {
  const [sourceLineId, setSourceLineId] = useState<string>("");
  const [destLineId, setDestLineId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [motif, setMotif] = useState("");
  const [justification, setJustification] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);

  // Get available balance for source line
  const { dotation, engaged, disponible, isLoading: loadingAvailable } = useBudgetLineAvailable(sourceLineId || undefined);

  const sourceLine = budgetLines.find((l) => l.id === sourceLineId);
  const destLine = budgetLines.find((l) => l.id === destLineId);

  const handleSubmit = () => {
    if (!sourceLineId || !destLineId || !amount || !motif) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Le montant doit être un nombre positif");
      return;
    }

    if (disponible !== undefined && amountNum > disponible) {
      toast.error(`Montant supérieur au disponible (${new Intl.NumberFormat("fr-FR").format(disponible)} FCFA)`);
      return;
    }

    if (sourceLineId === destLineId) {
      toast.error("Les lignes source et destination doivent être différentes");
      return;
    }

    onSubmit({
      type_transfer: "virement",
      from_budget_line_id: sourceLineId,
      to_budget_line_id: destLineId,
      amount: amountNum,
      motif,
      justification_renforcee: justification,
    });

    // Reset form
    setSourceLineId("");
    setDestLineId("");
    setAmount("");
    setMotif("");
    setJustification("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Nouveau réaménagement budgétaire
          </DialogTitle>
          <DialogDescription>
            Transférer des crédits d'une ligne budgétaire vers une autre
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Source Line */}
          <div className="space-y-2">
            <Label>Ligne source (débiter) *</Label>
            <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={sourceOpen}
                  className="w-full justify-between"
                >
                  {sourceLine ? (
                    <span className="truncate">
                      {getDisplayBudgetCode(sourceLine).code} - {sourceLine.label}
                    </span>
                  ) : (
                    "Sélectionner la ligne source..."
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0">
                <Command>
                  <CommandInput placeholder="Rechercher une ligne..." />
                  <CommandList>
                    <CommandEmpty>Aucune ligne trouvée</CommandEmpty>
                    <CommandGroup>
                      {budgetLines
                        .filter((l) => l.id !== destLineId)
                        .map((line) => (
                          <CommandItem
                            key={line.id}
                            value={`${line.code} ${line.label}`}
                            onSelect={() => {
                              setSourceLineId(line.id);
                              setSourceOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                sourceLineId === line.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-mono text-sm">{getDisplayBudgetCode(line).code}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[400px]">
                                {line.label}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {sourceLine && (
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dotation:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("fr-FR").format(dotation || 0)} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engagé:</span>
                  <span className="font-medium text-orange-600">
                    {new Intl.NumberFormat("fr-FR").format(engaged || 0)} FCFA
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-muted-foreground">Disponible:</span>
                  <span className={`font-bold ${(disponible || 0) < 0 ? "text-red-600" : "text-green-600"}`}>
                    {new Intl.NumberFormat("fr-FR").format(disponible || 0)} FCFA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Destination Line */}
          <div className="space-y-2">
            <Label>Ligne destination (créditer) *</Label>
            <Popover open={destOpen} onOpenChange={setDestOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={destOpen}
                  className="w-full justify-between"
                >
                  {destLine ? (
                    <span className="truncate">
                      {getDisplayBudgetCode(destLine).code} - {destLine.label}
                    </span>
                  ) : (
                    "Sélectionner la ligne destination..."
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0">
                <Command>
                  <CommandInput placeholder="Rechercher une ligne..." />
                  <CommandList>
                    <CommandEmpty>Aucune ligne trouvée</CommandEmpty>
                    <CommandGroup>
                      {budgetLines
                        .filter((l) => l.id !== sourceLineId)
                        .map((line) => (
                          <CommandItem
                            key={line.id}
                            value={`${line.code} ${line.label}`}
                            onSelect={() => {
                              setDestLineId(line.id);
                              setDestOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                destLineId === line.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-mono text-sm">{getDisplayBudgetCode(line).code}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[400px]">
                                {line.label}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {destLine && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dotation actuelle:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("fr-FR").format(destLine.dotation_initiale || 0)} FCFA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Montant à transférer (FCFA) *</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {amount && disponible !== undefined && parseFloat(amount) > disponible && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Le montant dépasse le disponible
              </p>
            )}
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label>Motif du réaménagement *</Label>
            <Textarea
              placeholder="Justification du transfert de crédits..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={2}
            />
          </div>

          {/* Justification renforcée */}
          <div className="space-y-2">
            <Label>Justification renforcée (optionnel)</Label>
            <Textarea
              placeholder="Détails complémentaires, références, etc."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || !sourceLineId || !destLineId || !amount || !motif}
          >
            {isCreating ? "Création..." : "Créer le réaménagement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Detail Dialog Component
function TransferDetailDialog({
  transfer,
  open,
  onClose,
}: {
  transfer: any;
  open: boolean;
  onClose: () => void;
}) {
  if (!transfer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Détail du réaménagement {transfer.code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Statut</span>
            <Badge
              variant={
                transfer.status === "execute"
                  ? "default"
                  : transfer.status === "rejete"
                  ? "destructive"
                  : "secondary"
              }
              className={transfer.status === "execute" ? "bg-green-500" : ""}
            >
              {transfer.status}
            </Badge>
          </div>

          {/* Source */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Ligne source (débit)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono">{transfer.from_line?.code}</p>
              <p className="text-sm text-muted-foreground">{transfer.from_line?.label}</p>
              {transfer.from_dotation_avant !== null && (
                <div className="mt-2 text-sm">
                  <p>
                    Avant: {new Intl.NumberFormat("fr-FR").format(transfer.from_dotation_avant)} FCFA
                  </p>
                  <p className="text-red-600">
                    Après: {new Intl.NumberFormat("fr-FR").format(transfer.from_dotation_apres)} FCFA
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Destination */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Ligne destination (crédit)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono">{transfer.to_line?.code}</p>
              <p className="text-sm text-muted-foreground">{transfer.to_line?.label}</p>
              {transfer.to_dotation_avant !== null && (
                <div className="mt-2 text-sm">
                  <p>
                    Avant: {new Intl.NumberFormat("fr-FR").format(transfer.to_dotation_avant)} FCFA
                  </p>
                  <p className="text-green-600">
                    Après: {new Intl.NumberFormat("fr-FR").format(transfer.to_dotation_apres)} FCFA
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amount */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-muted-foreground">Montant transféré</span>
            <span className="text-2xl font-bold">
              {new Intl.NumberFormat("fr-FR").format(transfer.amount)} FCFA
            </span>
          </div>

          {/* Motif */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Motif</p>
            <p className="p-3 bg-muted rounded-lg">{transfer.motif}</p>
          </div>

          {transfer.justification_renforcee && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Justification renforcée</p>
              <p className="p-3 bg-muted rounded-lg">{transfer.justification_renforcee}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Historique</p>
            <div className="border-l-2 pl-4 space-y-3">
              <div>
                <p className="text-sm">
                  Créé le{" "}
                  {transfer.requested_at
                    ? format(new Date(transfer.requested_at), "dd/MM/yyyy à HH:mm", { locale: fr })
                    : "-"}
                </p>
                {transfer.requested_by_profile && (
                  <p className="text-xs text-muted-foreground">
                    Par: {transfer.requested_by_profile.full_name}
                  </p>
                )}
              </div>
              {transfer.approved_at && (
                <div>
                  <p className="text-sm">
                    Validé le {format(new Date(transfer.approved_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </p>
                  {transfer.approved_by_profile && (
                    <p className="text-xs text-muted-foreground">
                      Par: {transfer.approved_by_profile.full_name}
                    </p>
                  )}
                </div>
              )}
              {transfer.executed_at && (
                <div>
                  <p className="text-sm text-green-600">
                    Exécuté le {format(new Date(transfer.executed_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
              )}
              {transfer.rejection_reason && (
                <div>
                  <p className="text-sm text-red-600">Rejeté: {transfer.rejection_reason}</p>
                </div>
              )}
              {transfer.cancel_reason && (
                <div>
                  <p className="text-sm text-orange-600">Annulé: {transfer.cancel_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
