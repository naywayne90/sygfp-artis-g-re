/**
 * Page de gestion des soumissions de feuilles de route
 * Liste avec filtres, actions de validation/rejet
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FileCheck,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RotateCcw,
  Loader2,
  Search,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  useRoadmapSubmissions,
  useSubmissionDirections,
  SubmissionStatus,
} from "@/hooks/useRoadmapSubmissions";
import { RoadmapSubmissionDetailDialog } from "@/components/planification/RoadmapSubmissionDetail";

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

export default function RoadmapSubmissionsPage() {
  const navigate = useNavigate();

  // Filtres
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState("");

  // Dialog détail
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Données
  const { data: directions = [] } = useSubmissionDirections();
  const {
    submissions,
    stats,
    isLoading,
    refetch,
    validate,
    reject,
    requestRevision,
    isValidating,
    isRejecting,
    isRequestingRevision,
  } = useRoadmapSubmissions({
    directionId: directionFilter !== "all" ? directionFilter : undefined,
    status: statusFilter !== "all" ? (statusFilter as SubmissionStatus) : undefined,
    search: searchFilter || undefined,
  });

  // Formatage montant
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(montant);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Soumissions Feuilles de Route"
        description="Validation et suivi des feuilles de route par direction"
        breadcrumbs={[
          { label: "Planification", href: "/planification/budget" },
          { label: "Soumissions" },
        ]}
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.soumis}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.en_revision}</div>
            <div className="text-sm text-muted-foreground">En révision</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.valide}</div>
            <div className="text-sm text-muted-foreground">Validés</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejete}</div>
            <div className="text-sm text-muted-foreground">Rejetés</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger>
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les directions</SelectItem>
                  {directions.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.code} - {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillons</SelectItem>
                  <SelectItem value="soumis">En attente</SelectItem>
                  <SelectItem value="en_revision">En révision</SelectItem>
                  <SelectItem value="valide">Validés</SelectItem>
                  <SelectItem value="rejete">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table des soumissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Soumissions
          </CardTitle>
          <CardDescription>
            Cliquez sur une soumission pour voir les détails et effectuer les actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune soumission trouvée</p>
              <p className="text-sm mt-2">
                Les soumissions seront créées lors de l'import des feuilles de route
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Activités</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Soumis par</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                  const statusConfig = STATUS_CONFIG[submission.status as SubmissionStatus];
                  return (
                    <TableRow
                      key={submission.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedSubmissionId(submission.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {submission.direction?.code || "—"}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {submission.direction?.label}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate font-medium">{submission.libelle}</div>
                        {submission.description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {submission.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {submission.nb_activites}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatMontant(submission.montant_total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} gap-1`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.submitted_by_profile?.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {submission.submitted_at
                          ? format(new Date(submission.submitted_at), "dd/MM/yyyy", {
                              locale: fr,
                            })
                          : format(new Date(submission.created_at), "dd/MM/yyyy", {
                              locale: fr,
                            })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmissionId(submission.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détail */}
      <RoadmapSubmissionDetailDialog
        submissionId={selectedSubmissionId}
        open={!!selectedSubmissionId}
        onOpenChange={(open) => {
          if (!open) setSelectedSubmissionId(null);
        }}
        onValidate={(comment) => {
          if (selectedSubmissionId) {
            validate({ submissionId: selectedSubmissionId, comment });
          }
        }}
        onReject={(reason) => {
          if (selectedSubmissionId) {
            reject({ submissionId: selectedSubmissionId, reason });
          }
        }}
        onRequestRevision={(comment) => {
          if (selectedSubmissionId) {
            requestRevision({ submissionId: selectedSubmissionId, comment });
          }
        }}
        isValidating={isValidating}
        isRejecting={isRejecting}
        isRequestingRevision={isRequestingRevision}
      />
    </div>
  );
}
