/**
 * Mise à jour du Budget - Ajustements avec justification et historisation
 *
 * Fonctionnalités:
 * - Ajustement de lignes budgétaires (augmenter/diminuer)
 * - Justification obligatoire + PJ optionnelle
 * - Historisation des versions
 * - Vue des modifications récentes
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  Search,
  Plus,
  Minus,
  History,
  Loader2,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle2,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useExercice } from "@/contexts/ExerciceContext";
import { useBudgetLines } from "@/hooks/useBudgetLines";
import { useBudgetLineVersions } from "@/hooks/useBudgetLineVersions";
import { toast } from "sonner";

type AdjustmentType = "increase" | "decrease";

interface AdjustmentFormData {
  budgetLineId: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  pjUrl?: string;
  pjFilename?: string;
}

export default function MiseAJourBudget() {
  const { selectedExercice, isReadOnly } = useExercice();
  const [search, setSearch] = useState("");
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("increase");
  const [activeTab, setActiveTab] = useState("lines");

  // Form state
  const [formData, setFormData] = useState<Partial<AdjustmentFormData>>({
    amount: 0,
    reason: "",
  });

  // Hooks
  const {
    budgetLines,
    isLoading: isLoadingLines,
    refetch: refetchLines,
  } = useBudgetLines({
    exercice: selectedExercice?.annee,
  });

  const {
    versions,
    isLoading: isLoadingVersions,
    modifyBudgetLine,
    isModifying,
    getChangeTypeLabel,
    getChangeTypeColor,
    formatValue,
  } = useBudgetLineVersions(selectedLine?.id);

  // Filter lines
  const filteredLines = useMemo(() => {
    if (!budgetLines) return [];
    if (!search) return budgetLines;

    const searchLower = search.toLowerCase();
    return budgetLines.filter(
      (line: any) =>
        line.code?.toLowerCase().includes(searchLower) ||
        line.label?.toLowerCase().includes(searchLower) ||
        line.code_v2?.toLowerCase().includes(searchLower)
    );
  }, [budgetLines, search]);

  // Format currency
  const formatMontant = (montant: number | null | undefined) => {
    if (montant === null || montant === undefined) return "0 FCFA";
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant) + " FCFA";
  };

  // Open adjustment dialog
  const openAdjustDialog = (line: any, type: AdjustmentType) => {
    setSelectedLine(line);
    setAdjustmentType(type);
    setFormData({
      budgetLineId: line.id,
      type,
      amount: 0,
      reason: "",
    });
    setIsAdjustDialogOpen(true);
  };

  // Execute adjustment
  const handleAdjust = async () => {
    if (!selectedLine || !formData.amount || formData.amount <= 0) {
      toast.error("Veuillez saisir un montant valide");
      return;
    }
    if (!formData.reason?.trim()) {
      toast.error("La justification est obligatoire");
      return;
    }

    const currentDotation = selectedLine.dotation_modifiee || selectedLine.dotation_initiale || 0;
    const newDotation = adjustmentType === "increase"
      ? currentDotation + formData.amount
      : currentDotation - formData.amount;

    if (newDotation < 0) {
      toast.error("La dotation ne peut pas être négative");
      return;
    }

    try {
      await modifyBudgetLine({
        budgetLineId: selectedLine.id,
        changes: {
          dotation_modifiee: newDotation,
        },
        reason: `${adjustmentType === "increase" ? "Augmentation" : "Diminution"} de ${formatMontant(formData.amount)}: ${formData.reason}`,
      });

      toast.success(`Ligne budgétaire ${adjustmentType === "increase" ? "augmentée" : "diminuée"} avec succès`);
      setIsAdjustDialogOpen(false);
      refetchLines();
    } catch (error) {
      console.error("Erreur ajustement:", error);
      toast.error("Erreur lors de l'ajustement");
    }
  };

  // View line history
  const viewHistory = (line: any) => {
    setSelectedLine(line);
    setActiveTab("history");
  };

  // Recent modifications (last 30 days)
  const recentModifications = useMemo(() => {
    if (!budgetLines) return [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return budgetLines
      .filter((line: any) => {
        const lastMod = line.last_modified_at ? new Date(line.last_modified_at) : null;
        return lastMod && lastMod > thirtyDaysAgo;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.last_modified_at || 0);
        const dateB = new Date(b.last_modified_at || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 20);
  }, [budgetLines]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Edit className="h-6 w-6 text-orange-600" />
            Mise à jour du Budget
          </h1>
          <p className="text-muted-foreground">
            Ajustements avec justification et historisation - Exercice {selectedExercice?.annee}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetchLines()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {isReadOnly && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Mode lecture seule</AlertTitle>
          <AlertDescription>
            L'exercice sélectionné est en lecture seule. Les modifications ne sont pas autorisées.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lines">
            <FileText className="h-4 w-4 mr-2" />
            Lignes budgétaires
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            Modifications récentes
          </TabsTrigger>
          <TabsTrigger value="history" disabled={!selectedLine}>
            <History className="h-4 w-4 mr-2" />
            Historique ligne
          </TabsTrigger>
        </TabsList>

        {/* Tab: Lines */}
        <TabsContent value="lines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lignes budgétaires</CardTitle>
              <CardDescription>
                Sélectionnez une ligne pour l'ajuster
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par code ou libellé..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Table */}
              {isLoadingLines ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="text-right">Dotation initiale</TableHead>
                        <TableHead className="text-right">Dotation modifiée</TableHead>
                        <TableHead className="text-right">Variation</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucune ligne trouvée
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLines.map((line: any) => {
                          const variation = (line.dotation_modifiee || 0) - (line.dotation_initiale || 0);
                          return (
                            <TableRow key={line.id}>
                              <TableCell className="font-mono text-sm">
                                {line.code_v2 || line.code}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate" title={line.label}>
                                {line.label}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatMontant(line.dotation_initiale)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatMontant(line.dotation_modifiee || line.dotation_initiale)}
                              </TableCell>
                              <TableCell className="text-right">
                                {variation !== 0 && (
                                  <span className={variation > 0 ? "text-green-600" : "text-red-600"}>
                                    {variation > 0 ? "+" : ""}{formatMontant(variation)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openAdjustDialog(line, "increase")}
                                    disabled={isReadOnly}
                                    title="Augmenter"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openAdjustDialog(line, "decrease")}
                                    disabled={isReadOnly}
                                    title="Diminuer"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => viewHistory(line)}
                                    title="Historique"
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Recent */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Modifications récentes (30 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentModifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  Aucune modification récente
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="text-right">Dotation actuelle</TableHead>
                      <TableHead>Modifié par</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentModifications.map((line: any) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          {line.last_modified_at
                            ? format(new Date(line.last_modified_at), "dd/MM/yyyy HH:mm", { locale: fr })
                            : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {line.code_v2 || line.code}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {line.label}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMontant(line.dotation_modifiee || line.dotation_initiale)}
                        </TableCell>
                        <TableCell>
                          {line.last_modified_by_profile?.full_name || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: History */}
        <TabsContent value="history">
          {selectedLine && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique: {selectedLine.code_v2 || selectedLine.code}
                </CardTitle>
                <CardDescription>
                  {selectedLine.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingVersions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : versions && versions.length > 0 ? (
                  <div className="space-y-4">
                    {versions.map((version: any, index: number) => (
                      <div
                        key={version.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getChangeTypeColor(version.change_type)}>
                              {getChangeTypeLabel(version.change_type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Version {version.version_number}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(version.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </span>
                        </div>

                        {version.change_summary && (
                          <p className="text-sm">{version.change_summary}</p>
                        )}

                        {version.change_reason && (
                          <p className="text-sm text-muted-foreground italic">
                            Raison: {version.change_reason}
                          </p>
                        )}

                        {version.new_values && Object.keys(version.new_values).length > 0 && (
                          <div className="text-sm space-y-1 bg-muted/50 rounded p-2">
                            {Object.entries(version.new_values).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-mono">
                                  {version.old_values?.[key] !== undefined && (
                                    <span className="text-red-500 line-through mr-2">
                                      {formatValue(key, version.old_values[key])}
                                    </span>
                                  )}
                                  <span className="text-green-600">
                                    {formatValue(key, value)}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Par: {version.created_by_profile?.full_name || "Système"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    Aucun historique pour cette ligne
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Adjustment */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustmentType === "increase" ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Augmenter la dotation
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Diminuer la dotation
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedLine && (
                <span className="font-mono">
                  {selectedLine.code_v2 || selectedLine.code} - {selectedLine.label}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current values */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dotation actuelle:</span>
                <span className="font-medium">
                  {formatMontant(selectedLine?.dotation_modifiee || selectedLine?.dotation_initiale)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">
                Montant de l'{adjustmentType === "increase" ? "augmentation" : "diminution"} *
              </Label>
              <Input
                id="amount"
                type="number"
                min={0}
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
              {formData.amount && formData.amount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Nouvelle dotation:{" "}
                  <span className="font-medium">
                    {formatMontant(
                      (selectedLine?.dotation_modifiee || selectedLine?.dotation_initiale || 0) +
                        (adjustmentType === "increase" ? formData.amount : -formData.amount)
                    )}
                  </span>
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="grid gap-2">
              <Label htmlFor="reason">Justification *</Label>
              <Textarea
                id="reason"
                value={formData.reason || ""}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Expliquez la raison de cet ajustement..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={isModifying || !formData.amount || !formData.reason}
              className={adjustmentType === "increase" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isModifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {adjustmentType === "increase" ? (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Augmenter
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 mr-2" />
                  Diminuer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
