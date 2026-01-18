/**
 * Page Scanning - Liquidation
 * Interface dédiée au scanning et upload de documents pour les liquidations
 * RÈGLE: Pas de liquidation sans engagement validé
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Search,
  ScanLine,
  Loader2,
  FileCheck,
  FileX,
  Upload,
  Eye,
  Filter,
  FolderOpen,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  CreditCard,
  Receipt,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  Link2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { LiquidationChecklist } from "@/components/liquidation/LiquidationChecklist";
import { useLiquidationDocuments } from "@/hooks/useLiquidationDocuments";
import { useAuditLog } from "@/hooks/useAuditLog";

// Types
interface ScanningLiquidation {
  id: string;
  numero: string;
  montant: number;
  net_a_payer: number | null;
  date_liquidation: string;
  reference_facture: string | null;
  service_fait: boolean | null;
  statut: string | null;
  // Engagement lié
  engagement_id: string;
  engagement_numero: string | null;
  engagement_objet: string | null;
  engagement_fournisseur: string | null;
  engagement_statut: string | null;
  engagement_montant: number | null;
  // Direction (via budget line de l'engagement)
  direction_id: string | null;
  direction_code: string | null;
  direction_libelle: string | null;
  // Document stats
  documents_count: number;
  documents_provided: number;
  documents_required: number;
  documents_required_provided: number;
}

interface DirectionOption {
  id: string;
  code: string;
  libelle: string;
}

const formatMontant = (montant: number | null | undefined) => {
  if (montant === null || montant === undefined) return "-";
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

const getDocumentStatusBadge = (providedRequired: number, totalRequired: number) => {
  if (totalRequired === 0 || providedRequired === totalRequired) {
    return (
      <Badge className="bg-success/10 text-success border-success/20 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Complet
      </Badge>
    );
  }
  if (providedRequired === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <FileX className="h-3 w-3" />
        0/{totalRequired}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1">
      <AlertTriangle className="h-3 w-3" />
      {providedRequired}/{totalRequired}
    </Badge>
  );
};

const getEngagementStatusBadge = (statut: string | null) => {
  if (statut === "valide") {
    return (
      <Badge className="bg-success/10 text-success border-success/20 text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Validé
      </Badge>
    );
  }
  if (statut === "soumis") {
    return (
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
        En cours
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      {statut || "N/A"}
    </Badge>
  );
};

export default function ScanningLiquidation() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDirection, setSelectedDirection] = useState<string>("all");
  const [selectedDocStatus, setSelectedDocStatus] = useState<string>("all");
  const [selectedLiquidation, setSelectedLiquidation] = useState<ScanningLiquidation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isChecklistComplete, setIsChecklistComplete] = useState(false);
  const [isChecklistVerified, setIsChecklistVerified] = useState(false);

  // Fetch directions for filter
  const { data: directions = [] } = useQuery({
    queryKey: ["directions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, code, libelle")
        .order("code");
      if (error) throw error;
      return data as DirectionOption[];
    },
  });

  // Fetch liquidations with engagement and document stats
  const { data: liquidations = [], isLoading, refetch } = useQuery({
    queryKey: ["scanning-liquidations", exercice],
    queryFn: async () => {
      // Fetch liquidations with engagement details
      const { data: liqData, error: liqError } = await supabase
        .from("budget_liquidations")
        .select(`
          id,
          numero,
          montant,
          net_a_payer,
          date_liquidation,
          reference_facture,
          service_fait,
          statut,
          engagement:budget_engagements(
            id,
            numero,
            objet,
            montant,
            fournisseur,
            statut,
            budget_line:budget_lines(
              id,
              direction:directions(id, code, libelle)
            )
          )
        `)
        .eq("exercice", exercice)
        .in("statut", ["brouillon", "soumis"])
        .order("created_at", { ascending: false });

      if (liqError) throw liqError;
      if (!liqData) return [];

      // Fetch document counts for each liquidation
      const liqIds = liqData.map(l => l.id);

      // Try to get from liquidation_documents table
      let docsData: any[] = [];
      try {
        const { data } = await (supabase
          .from("liquidation_documents" as any)
          .select("liquidation_id, is_provided, is_required")
          .in("liquidation_id", liqIds) as any);
        docsData = data || [];
      } catch {
        // Table may not exist yet
        docsData = [];
      }

      // Calculate document stats per liquidation
      const docStats: Record<string, { total: number; provided: number; required: number; requiredProvided: number }> = {};
      liqIds.forEach(id => {
        docStats[id] = { total: 0, provided: 0, required: 0, requiredProvided: 0 };
      });

      docsData?.forEach((doc: any) => {
        const stats = docStats[doc.liquidation_id];
        if (stats) {
          stats.total++;
          if (doc.is_provided) stats.provided++;
          if (doc.is_required) {
            stats.required++;
            if (doc.is_provided) stats.requiredProvided++;
          }
        }
      });

      // Map to result type
      return liqData.map(liq => {
        const engagement = liq.engagement as any;
        const budgetLine = engagement?.budget_line;
        const direction = budgetLine?.direction;
        const stats = docStats[liq.id] || { total: 0, provided: 0, required: 0, requiredProvided: 0 };

        return {
          id: liq.id,
          numero: liq.numero,
          montant: liq.montant,
          net_a_payer: liq.net_a_payer,
          date_liquidation: liq.date_liquidation,
          reference_facture: liq.reference_facture,
          service_fait: liq.service_fait,
          statut: liq.statut,
          engagement_id: engagement?.id || null,
          engagement_numero: engagement?.numero || null,
          engagement_objet: engagement?.objet || null,
          engagement_fournisseur: engagement?.fournisseur || null,
          engagement_statut: engagement?.statut || null,
          engagement_montant: engagement?.montant || null,
          direction_id: direction?.id || null,
          direction_code: direction?.code || null,
          direction_libelle: direction?.libelle || null,
          documents_count: stats.total,
          documents_provided: stats.provided,
          documents_required: stats.required,
          documents_required_provided: stats.requiredProvided,
        } as ScanningLiquidation;
      });
    },
    enabled: !!exercice,
  });

  // Submit for validation mutation
  const submitMutation = useMutation({
    mutationFn: async (liquidationId: string) => {
      // Vérifier que l'engagement est validé
      const liq = liquidations.find(l => l.id === liquidationId);
      if (!liq) throw new Error("Liquidation non trouvée");

      if (liq.engagement_statut !== "valide") {
        throw new Error("L'engagement associé doit être validé avant de soumettre la liquidation");
      }

      const { error } = await supabase
        .from("budget_liquidations")
        .update({
          statut: "soumis",
          workflow_status: "pending",
          current_step: 1,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", liquidationId);

      if (error) throw error;

      await logAction({
        entityType: "liquidation",
        entityId: liquidationId,
        action: "SUBMIT",
        newValues: { statut: "soumis", engagement_id: liq.engagement_id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanning-liquidations"] });
      queryClient.invalidateQueries({ queryKey: ["liquidations"] });
      toast.success("Liquidation soumise pour validation");
      setShowDetailDialog(false);
      setSelectedLiquidation(null);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Filter liquidations
  const filteredLiquidations = useMemo(() => {
    return liquidations.filter(liq => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !liq.numero.toLowerCase().includes(query) &&
          !(liq.engagement_objet?.toLowerCase().includes(query)) &&
          !(liq.engagement_fournisseur?.toLowerCase().includes(query)) &&
          !(liq.reference_facture?.toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      // Direction filter
      if (selectedDirection !== "all" && liq.direction_id !== selectedDirection) {
        return false;
      }

      // Document status filter
      if (selectedDocStatus !== "all") {
        if (selectedDocStatus === "complete") {
          if (liq.documents_required > 0 && liq.documents_required_provided < liq.documents_required) {
            return false;
          }
        } else if (selectedDocStatus === "incomplete") {
          if (liq.documents_required === 0 || liq.documents_required_provided === liq.documents_required) {
            return false;
          }
        }
      }

      return true;
    });
  }, [liquidations, searchQuery, selectedDirection, selectedDocStatus]);

  // Separate brouillon and soumis
  const brouillonLiquidations = filteredLiquidations.filter(l => l.statut === "brouillon");
  const soumisLiquidations = filteredLiquidations.filter(l => l.statut === "soumis");

  // Stats
  const totalLiquidations = filteredLiquidations.length;
  const completeLiquidations = filteredLiquidations.filter(
    l => l.documents_required === 0 || l.documents_required_provided === l.documents_required
  ).length;
  const incompleteLiquidations = totalLiquidations - completeLiquidations;
  const completionPercentage = totalLiquidations > 0 ? Math.round((completeLiquidations / totalLiquidations) * 100) : 0;

  // Liquidations with unvalidated engagements
  const withUnvalidatedEngagement = filteredLiquidations.filter(
    l => l.engagement_statut !== "valide"
  ).length;

  const handleOpenDetail = (liq: ScanningLiquidation) => {
    setSelectedLiquidation(liq);
    setShowDetailDialog(true);
  };

  const handleChecklistChange = (isComplete: boolean, isVerified: boolean) => {
    setIsChecklistComplete(isComplete);
    setIsChecklistVerified(isVerified);
  };

  const handleSubmit = () => {
    if (selectedLiquidation && isChecklistComplete) {
      submitMutation.mutate(selectedLiquidation.id);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDirection("all");
    setSelectedDocStatus("all");
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Numéro", "Date", "Engagement", "Fournisseur", "Montant", "Net à payer", "Direction", "Statut", "Documents"];
    const rows = filteredLiquidations.map(liq => [
      liq.numero,
      format(new Date(liq.date_liquidation), "dd/MM/yyyy"),
      liq.engagement_numero || "",
      liq.engagement_fournisseur || "",
      liq.montant.toString(),
      liq.net_a_payer?.toString() || "",
      liq.direction_code || "",
      liq.statut || "",
      `${liq.documents_required_provided}/${liq.documents_required}`,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scanning_liquidations_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    logAction({
      entityType: "liquidation",
      entityId: "export",
      action: "EXPORT",
      newValues: { count: filteredLiquidations.length, format: "csv" },
    });

    toast.success(`${filteredLiquidations.length} liquidation(s) exportée(s)`);
  };

  // Check if submit is allowed
  const canSubmit = useMemo(() => {
    if (!selectedLiquidation) return false;
    if (!isChecklistComplete) return false;
    if (selectedLiquidation.engagement_statut !== "valide") return false;
    return true;
  }, [selectedLiquidation, isChecklistComplete]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ScanLine className="h-6 w-6" />
            Scanning - Liquidation
          </h1>
          <p className="page-description">
            Numérisation et upload des pièces justificatives pour les liquidations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exporter CSV
          </Button>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Warning: unvalidated engagements */}
      {withUnvalidatedEngagement > 0 && (
        <Alert variant="destructive" className="border-warning bg-warning/10">
          <ShieldAlert className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Engagements non validés</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {withUnvalidatedEngagement} liquidation(s) ont un engagement non encore validé.
            Ces liquidations ne peuvent pas être soumises tant que l'engagement n'est pas validé.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total dossiers</p>
                <p className="text-2xl font-bold">{totalLiquidations}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dossiers complets</p>
                <p className="text-2xl font-bold text-success">{completeLiquidations}</p>
              </div>
              <FileCheck className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dossiers incomplets</p>
                <p className="text-2xl font-bold text-warning">{incompleteLiquidations}</p>
              </div>
              <FileX className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Complétion</span>
                <span className="font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, objet, fournisseur, facture..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Direction filter */}
            <Select value={selectedDirection} onValueChange={setSelectedDirection}>
              <SelectTrigger>
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les directions</SelectItem>
                {directions.map(dir => (
                  <SelectItem key={dir.id} value={dir.id}>
                    {dir.code} - {dir.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Document status filter */}
            <Select value={selectedDocStatus} onValueChange={setSelectedDocStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Statut documents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="complete">Complets</SelectItem>
                <SelectItem value="incomplete">Incomplets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filters indicator */}
          {(searchQuery || selectedDirection !== "all" || selectedDocStatus !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtres actifs:</span>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Réinitialiser
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="brouillon" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brouillon" className="gap-1">
            À scanner ({brouillonLiquidations.length})
          </TabsTrigger>
          <TabsTrigger value="soumis" className="gap-1">
            Soumis ({soumisLiquidations.length})
          </TabsTrigger>
        </TabsList>

        {/* Brouillon tab */}
        <TabsContent value="brouillon">
          <Card>
            <CardHeader>
              <CardTitle>Liquidations à numériser</CardTitle>
              <CardDescription>
                {brouillonLiquidations.length} liquidation(s) en attente de documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : brouillonLiquidations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ScanLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune liquidation à numériser</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Liquidation</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-center">Eng. Validé</TableHead>
                      <TableHead className="text-center">Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brouillonLiquidations.map((liq) => (
                      <TableRow key={liq.id}>
                        <TableCell>
                          <div>
                            <div className="font-mono text-sm">{liq.numero}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(liq.date_liquidation), "dd/MM/yyyy", { locale: fr })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-mono text-sm">{liq.engagement_numero || "-"}</div>
                            <div className="text-xs text-muted-foreground max-w-[150px] truncate">
                              {liq.engagement_objet || "-"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{liq.engagement_fournisseur || "-"}</TableCell>
                        <TableCell>
                          {liq.direction_code ? (
                            <Badge variant="outline">{liq.direction_code}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMontant(liq.montant)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getEngagementStatusBadge(liq.engagement_statut)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getDocumentStatusBadge(
                            liq.documents_required_provided,
                            liq.documents_required
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleOpenDetail(liq)}
                              >
                                <Upload className="h-4 w-4" />
                                Scanner
                              </Button>
                            </TooltipTrigger>
                            {liq.engagement_statut !== "valide" && (
                              <TooltipContent>
                                <p>Engagement non validé - soumission impossible</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Soumis tab */}
        <TabsContent value="soumis">
          <Card>
            <CardHeader>
              <CardTitle>Liquidations soumises</CardTitle>
              <CardDescription>
                {soumisLiquidations.length} liquidation(s) soumise(s) pour validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : soumisLiquidations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune liquidation soumise</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Liquidation</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-center">Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soumisLiquidations.map((liq) => (
                      <TableRow key={liq.id}>
                        <TableCell>
                          <div>
                            <div className="font-mono text-sm">{liq.numero}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(liq.date_liquidation), "dd/MM/yyyy", { locale: fr })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{liq.engagement_numero || "-"}</div>
                        </TableCell>
                        <TableCell>{liq.engagement_fournisseur || "-"}</TableCell>
                        <TableCell>
                          {liq.direction_code ? (
                            <Badge variant="outline">{liq.direction_code}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMontant(liq.montant)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getDocumentStatusBadge(
                            liq.documents_required_provided,
                            liq.documents_required
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDetail(liq)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              {selectedLiquidation?.numero} - Documents
            </DialogTitle>
            <DialogDescription>
              Liquidation liée à l'engagement {selectedLiquidation?.engagement_numero}
            </DialogDescription>
          </DialogHeader>

          {selectedLiquidation && (
            <div className="space-y-6">
              {/* Warning if engagement not validated */}
              {selectedLiquidation.engagement_statut !== "valide" && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Engagement non validé</AlertTitle>
                  <AlertDescription>
                    L'engagement associé ({selectedLiquidation.engagement_numero}) n'est pas encore validé.
                    Cette liquidation ne peut pas être soumise tant que l'engagement n'est pas validé.
                  </AlertDescription>
                </Alert>
              )}

              {/* Liquidation info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseur</p>
                  <p className="font-medium">{selectedLiquidation.engagement_fournisseur || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className="font-medium">{formatMontant(selectedLiquidation.montant)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net à payer</p>
                  <p className="font-medium text-primary">
                    {formatMontant(selectedLiquidation.net_a_payer)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Réf. Facture</p>
                  <p className="font-medium">{selectedLiquidation.reference_facture || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Direction</p>
                  <p className="font-medium">{selectedLiquidation.direction_libelle || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date liquidation</p>
                  <p className="font-medium">
                    {format(new Date(selectedLiquidation.date_liquidation), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>

              {/* Engagement link */}
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  Engagement lié: <strong>{selectedLiquidation.engagement_numero}</strong>
                </span>
                {getEngagementStatusBadge(selectedLiquidation.engagement_statut)}
                <span className="text-sm text-muted-foreground ml-auto">
                  Montant: {formatMontant(selectedLiquidation.engagement_montant)}
                </span>
              </div>

              {/* Checklist */}
              <LiquidationChecklist
                liquidationId={selectedLiquidation.id}
                readOnly={selectedLiquidation.statut !== "brouillon"}
                onCompletenessChange={handleChecklistChange}
                blockSubmitIfIncomplete={true}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Fermer
            </Button>
            {selectedLiquidation?.statut === "brouillon" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit || submitMutation.isPending}
                      className="gap-2"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Soumission...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Soumettre pour validation
                        </>
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canSubmit && (
                  <TooltipContent>
                    {selectedLiquidation?.engagement_statut !== "valide"
                      ? "L'engagement doit être validé"
                      : "Tous les documents obligatoires doivent être fournis"}
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
