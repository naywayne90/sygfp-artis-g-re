import { useState } from "react";
import { useExercice } from "@/contexts/ExerciceContext";
import {
  useTaskExecutions,
  useTaskFiltersData,
  TASK_STATUS_CONFIG,
  type TaskStatus,
  type TaskFilters
} from "@/hooks/useTaskExecution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  MoreHorizontal,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  User,
  Building2,
  Target,
  TrendingUp,
  Clock,
  XCircle,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { TaskExecutionDetailModal } from "@/components/execution/TaskExecutionDetailModal";

export default function TaskExecutionPage() {
  const { exerciceId, exercice, isReadOnly } = useExercice();

  // Filtres
  const [filters, setFilters] = useState<TaskFilters>({
    exercice_id: exerciceId || undefined,
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Dialog blocage
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    activiteId: string | null;
    activiteLibelle: string;
  }>({ open: false, activiteId: null, activiteLibelle: "" });
  const [motifBlocage, setMotifBlocage] = useState("");

  // Modal détail
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    taskId: string | null;
  }>({ open: false, taskId: null });

  // Données
  const {
    executions,
    stats,
    isLoading,
    startTask,
    completeTask,
    blockTask
  } = useTaskExecutions({
    ...filters,
    exercice_id: exerciceId || undefined
  });

  const { directions, objectifsStrategiques } = useTaskFiltersData();

  // Actions rapides
  const handleStartTask = async (activiteId: string) => {
    if (!exerciceId) {
      toast.error("Veuillez sélectionner un exercice");
      return;
    }
    try {
      await startTask.mutateAsync({ activiteId, exerciceId });
      toast.success("Tâche démarrée");
    } catch (error) {
      toast.error("Erreur lors du démarrage");
    }
  };

  const handleCompleteTask = async (activiteId: string) => {
    if (!exerciceId) {
      toast.error("Veuillez sélectionner un exercice");
      return;
    }
    try {
      await completeTask.mutateAsync({
        activiteId,
        exerciceId,
        commentaire: "Marqué comme réalisé"
      });
      toast.success("Tâche marquée comme réalisée");
    } catch (error) {
      toast.error("Erreur lors de la validation");
    }
  };

  const handleBlockTask = async () => {
    if (!exerciceId || !blockDialog.activiteId || !motifBlocage) {
      toast.error("Veuillez renseigner le motif de blocage");
      return;
    }
    try {
      await blockTask.mutateAsync({
        activiteId: blockDialog.activiteId,
        exerciceId,
        motif: motifBlocage
      });
      toast.success("Tâche marquée comme bloquée");
      setBlockDialog({ open: false, activiteId: null, activiteLibelle: "" });
      setMotifBlocage("");
    } catch (error) {
      toast.error("Erreur lors du blocage");
    }
  };

  const openBlockDialog = (activiteId: string, libelle: string) => {
    setBlockDialog({ open: true, activiteId, activiteLibelle: libelle });
  };

  // Filtrage local pour la recherche
  const filteredExecutions = executions?.filter(exec => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      exec.activite_libelle?.toLowerCase().includes(search) ||
      exec.activite_code?.toLowerCase().includes(search) ||
      exec.action_libelle?.toLowerCase().includes(search) ||
      exec.mission_libelle?.toLowerCase().includes(search) ||
      exec.direction_label?.toLowerCase().includes(search)
    );
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredExecutions.length / pageSize);
  const paginatedExecutions = filteredExecutions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const getStatusBadge = (status: TaskStatus) => {
    const config = TASK_STATUS_CONFIG[status];
    return (
      <Badge className={`${config.bgColor} ${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exécution Physique des Activités</h1>
          <p className="text-muted-foreground">
            Suivi de l'avancement des activités - Exercice {exercice?.annee || "Non sélectionné"}
          </p>
        </div>
        {isReadOnly && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Mode lecture seule
          </Badge>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.en_cours || 0}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.realise || 0}</p>
                <p className="text-xs text-muted-foreground">Réalisés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.bloque || 0}</p>
                <p className="text-xs text-muted-foreground">Bloqués</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.total ? Math.round((stats.realise / stats.total) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Taux réalisation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Liste des activités</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par activité, action, mission..."
                value={filters.search || ""}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Direction
                </Label>
                <Select
                  value={filters.direction_id || "all"}
                  onValueChange={(v) => setFilters(f => ({
                    ...f,
                    direction_id: v === "all" ? undefined : v
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les directions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les directions</SelectItem>
                    {directions?.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.code} - {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Objectif Stratégique
                </Label>
                <Select
                  value={filters.objectif_strategique_id || "all"}
                  onValueChange={(v) => setFilters(f => ({
                    ...f,
                    objectif_strategique_id: v === "all" ? undefined : v
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les OS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les OS</SelectItem>
                    {objectifsStrategiques?.map(os => (
                      <SelectItem key={os.id} value={os.id}>
                        {os.code} - {os.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Statut
                </Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(v) => setFilters(f => ({
                    ...f,
                    status: v === "all" ? undefined : v as TaskStatus
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(TASK_STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => setFilters({ exercice_id: exerciceId || undefined, search: "" })}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          )}

          {/* Tableau */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Activité</TableHead>
                  <TableHead>Action / Mission</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Avancement</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : paginatedExecutions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune activité trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedExecutions.map((exec) => (
                    <TableRow key={exec.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{exec.activite_code}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {exec.activite_libelle}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-medium">{exec.action_code} - {exec.action_libelle}</p>
                          <p className="text-muted-foreground">{exec.mission_code} - {exec.mission_libelle}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs">{exec.direction_code}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(exec.status as TaskStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={exec.taux_avancement} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground">
                            {exec.taux_avancement}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <User className="h-3 w-3" />
                          {exec.responsable_display || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {exec.date_debut_reelle && (
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(exec.date_debut_reelle), "dd/MM/yy", { locale: fr })}
                              {exec.date_fin_reelle && (
                                <> → {format(new Date(exec.date_fin_reelle), "dd/MM/yy", { locale: fr })}</>
                              )}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Voir détail - toujours disponible */}
                            <DropdownMenuItem
                              onClick={() => setDetailModal({ open: true, taskId: exec.id })}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détail
                            </DropdownMenuItem>
                            {/* Actions - uniquement si pas en lecture seule */}
                            {!isReadOnly && (
                              <>
                                {exec.status === "non_demarre" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStartTask(exec.activite_id)}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Démarrer
                                  </DropdownMenuItem>
                                )}
                                {(exec.status === "non_demarre" || exec.status === "en_cours") && (
                                  <DropdownMenuItem
                                    onClick={() => handleCompleteTask(exec.activite_id)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Marquer réalisé
                                  </DropdownMenuItem>
                                )}
                                {exec.status !== "bloque" && exec.status !== "realise" && (
                                  <DropdownMenuItem
                                    onClick={() => openBlockDialog(exec.activite_id, exec.activite_libelle || "")}
                                    className="text-red-600"
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Signaler blocage
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Affichage {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredExecutions.length)} sur {filteredExecutions.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog blocage */}
      <Dialog open={blockDialog.open} onOpenChange={(open) => {
        if (!open) {
          setBlockDialog({ open: false, activiteId: null, activiteLibelle: "" });
          setMotifBlocage("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Signaler un blocage
            </DialogTitle>
            <DialogDescription>
              Activité : {blockDialog.activiteLibelle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motif">Motif du blocage *</Label>
              <Textarea
                id="motif"
                placeholder="Décrivez la raison du blocage..."
                value={motifBlocage}
                onChange={(e) => setMotifBlocage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBlockDialog({ open: false, activiteId: null, activiteLibelle: "" });
                setMotifBlocage("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockTask}
              disabled={!motifBlocage.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Confirmer le blocage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal détail */}
      <TaskExecutionDetailModal
        taskId={detailModal.taskId}
        open={detailModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setDetailModal({ open: false, taskId: null });
          }
        }}
        mode="sheet"
      />
    </div>
  );
}
