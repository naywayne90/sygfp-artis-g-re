import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  ExternalLink,
  Download,
  FileSpreadsheet,
  FileText,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dossier } from "@/hooks/useDossiers";
import { toast } from "sonner";

interface DossierSearchResultsProps {
  dossiers: Dossier[];
  loading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  onPageChange: (page: number) => void;
  onClose: () => void;
}

type SortField = "numero" | "created_at" | "montant_estime" | "etape_courante" | "statut_global";
type SortDirection = "asc" | "desc";

const STATUT_BADGE_VARIANTS: Record<string, { label: string; className: string }> = {
  en_cours: { label: "En cours", className: "bg-primary/10 text-primary border-primary/30" },
  termine: { label: "Terminé", className: "bg-success/10 text-success border-success/30" },
  solde: { label: "Soldé", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  annule: { label: "Annulé", className: "bg-destructive/10 text-destructive border-destructive/30" },
  suspendu: { label: "Suspendu", className: "bg-warning/10 text-warning border-warning/30" },
  bloque: { label: "Bloqué", className: "bg-orange-100 text-orange-700 border-orange-200" },
};

const ETAPE_LABELS: Record<string, string> = {
  note: "Note SEF",
  expression_besoin: "Expression besoin",
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
  reglement: "Règlement",
};

const formatMontant = (montant: number | null | undefined) => {
  if (montant === null || montant === undefined) return "—";
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

export function DossierSearchResults({
  dossiers,
  loading,
  pagination,
  onPageChange,
  onClose,
}: DossierSearchResultsProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Sort dossiers locally
  const sortedDossiers = [...dossiers].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "numero":
        comparison = (a.numero || "").localeCompare(b.numero || "");
        break;
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "montant_estime":
        comparison = (a.montant_estime || 0) - (b.montant_estime || 0);
        break;
      case "etape_courante":
        comparison = (a.etape_courante || "").localeCompare(b.etape_courante || "");
        break;
      case "statut_global":
        comparison = (a.statut_global || "").localeCompare(b.statut_global || "");
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleOpenDossier = (dossier: Dossier) => {
    onClose();
    navigate(`/dossiers/${dossier.id}`);
  };

  const exportToCSV = () => {
    const headers = [
      "Numéro",
      "Objet",
      "Direction",
      "Bénéficiaire",
      "Montant estimé",
      "Étape",
      "Statut",
      "Date création",
    ];

    const rows = sortedDossiers.map((d) => [
      d.numero,
      `"${(d.objet || "").replace(/"/g, '""')}"`,
      d.direction?.sigle || d.direction?.code || "",
      d.beneficiaire?.raison_sociale || "",
      d.montant_estime || 0,
      ETAPE_LABELS[d.etape_courante] || d.etape_courante,
      STATUT_BADGE_VARIANTS[d.statut_global]?.label || d.statut_global,
      format(new Date(d.created_at), "dd/MM/yyyy"),
    ]);

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dossiers_export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();

    toast.success(`${sortedDossiers.length} dossiers exportés`);
  };

  const exportToExcel = () => {
    // For now, export as CSV with Excel-friendly format
    // In production, you'd use a library like xlsx
    exportToCSV();
    toast.info("Format Excel (CSV compatible)");
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />
    );
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (dossiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun résultat</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Aucun dossier ne correspond à vos critères de recherche. Modifiez vos filtres et
          réessayez.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with export options */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{pagination.total}</span> dossier
          {pagination.total > 1 ? "s" : ""} trouvé{pagination.total > 1 ? "s" : ""}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToCSV}>
              <FileText className="h-4 w-4 mr-2" />
              Exporter en CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exporter en Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results table */}
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("numero")}
              >
                <div className="flex items-center">
                  Numéro
                  <SortIcon field="numero" />
                </div>
              </TableHead>
              <TableHead className="min-w-[200px]">Objet</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Bénéficiaire</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort("montant_estime")}
              >
                <div className="flex items-center justify-end">
                  Montant
                  <SortIcon field="montant_estime" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("etape_courante")}
              >
                <div className="flex items-center">
                  Étape
                  <SortIcon field="etape_courante" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("statut_global")}
              >
                <div className="flex items-center">
                  Statut
                  <SortIcon field="statut_global" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center">
                  Date
                  <SortIcon field="created_at" />
                </div>
              </TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDossiers.map((dossier) => {
              const statutVariant = STATUT_BADGE_VARIANTS[dossier.statut_global] || {
                label: dossier.statut_global,
                className: "bg-muted text-muted-foreground",
              };

              return (
                <TableRow
                  key={dossier.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleOpenDossier(dossier)}
                >
                  <TableCell className="font-mono text-sm">{dossier.numero}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={dossier.objet}>
                      {dossier.objet}
                    </div>
                  </TableCell>
                  <TableCell>
                    {dossier.direction ? (
                      <Badge variant="outline" className="text-xs">
                        {dossier.direction.sigle || dossier.direction.code}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[120px] truncate text-sm">
                      {dossier.beneficiaire?.raison_sociale || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMontant(dossier.montant_estime)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {ETAPE_LABELS[dossier.etape_courante] || dossier.etape_courante}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statutVariant.className}>
                      {statutVariant.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(dossier.created_at), "dd/MM/yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDossier(dossier)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir le dossier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            onClose();
                            window.open(`/dossiers/${dossier.id}`, "_blank");
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ouvrir dans un nouvel onglet
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} sur {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
