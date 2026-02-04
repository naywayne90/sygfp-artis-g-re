// @ts-nocheck
import { useState } from "react";
import { useExercice } from "@/contexts/ExerciceContext";
import {
  useTaskExecutions,
  TASK_STATUS_CONFIG,
  type TaskStatus
} from "@/hooks/useTaskExecution";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Calendar as CalendarIcon,
  Percent,
  User,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskExecutionQuickUpdateProps {
  activiteId: string;
  activiteCode: string;
  activiteLibelle: string;
  currentStatus?: TaskStatus;
  currentTaux?: number;
  currentDateDebut?: string | null;
  currentDateFin?: string | null;
  currentResponsable?: string | null;
  onUpdate?: () => void;
}

export function TaskExecutionQuickUpdate({
  activiteId,
  activiteCode,
  activiteLibelle,
  currentStatus = "non_demarre",
  currentTaux = 0,
  currentDateDebut,
  currentDateFin,
  currentResponsable,
  onUpdate
}: TaskExecutionQuickUpdateProps) {
  const { exerciceId, isReadOnly } = useExercice();
  const { startTask, completeTask, blockTask, updateTask } = useTaskExecutions({});

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    status: currentStatus,
    taux_avancement: currentTaux,
    date_debut_reelle: currentDateDebut ? new Date(currentDateDebut) : undefined,
    date_fin_reelle: currentDateFin ? new Date(currentDateFin) : undefined,
    responsable_nom: currentResponsable || "",
    commentaire: "",
    motif_blocage: ""
  });

  const handleQuickStart = async () => {
    if (!exerciceId) {
      toast.error("Veuillez sélectionner un exercice");
      return;
    }
    try {
      await startTask.mutateAsync({ activiteId, exerciceId });
      toast.success("Tâche démarrée");
      onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors du démarrage");
    }
  };

  const handleQuickComplete = async () => {
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
      toast.success("Tâche réalisée");
      onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors de la validation");
    }
  };

  const handleSubmit = async () => {
    if (!exerciceId) {
      toast.error("Veuillez sélectionner un exercice");
      return;
    }

    // Validation
    if (formData.status === "bloque" && !formData.motif_blocage) {
      toast.error("Le motif de blocage est requis");
      return;
    }

    try {
      if (formData.status === "bloque") {
        await blockTask.mutateAsync({
          activiteId,
          exerciceId,
          motif: formData.motif_blocage
        });
      } else if (formData.status === "realise") {
        await completeTask.mutateAsync({
          activiteId,
          exerciceId,
          commentaire: formData.commentaire
        });
      } else {
        await updateTask.mutateAsync({
          activiteId,
          exerciceId,
          status: formData.status,
          taux_avancement: formData.taux_avancement,
          date_debut_reelle: formData.date_debut_reelle
            ? format(formData.date_debut_reelle, "yyyy-MM-dd")
            : undefined,
          date_fin_reelle: formData.date_fin_reelle
            ? format(formData.date_fin_reelle, "yyyy-MM-dd")
            : undefined,
          responsable_nom: formData.responsable_nom || undefined,
          commentaire: formData.commentaire || undefined
        });
      }

      toast.success("Exécution mise à jour");
      setIsOpen(false);
      onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const statusConfig = TASK_STATUS_CONFIG[currentStatus];

  if (isReadOnly) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
          {statusConfig.label}
        </Badge>
        <Progress value={currentTaux} className="w-16 h-2" />
        <span className="text-xs text-muted-foreground">{currentTaux}%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Statut actuel */}
      <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
        {statusConfig.label}
      </Badge>

      {/* Avancement */}
      <Progress value={currentTaux} className="w-16 h-2" />
      <span className="text-xs text-muted-foreground">{currentTaux}%</span>

      {/* Actions rapides */}
      {currentStatus === "non_demarre" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={handleQuickStart}
        >
          <Play className="h-3 w-3 mr-1" />
          Démarrer
        </Button>
      )}

      {(currentStatus === "en_cours" || currentStatus === "non_demarre") && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-green-600 hover:text-green-700"
          onClick={handleQuickComplete}
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Réalisé
        </Button>
      )}

      {/* Dialog de modification détaillée */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
            <Edit2 className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'exécution</DialogTitle>
            <DialogDescription>
              {activiteCode} - {activiteLibelle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Statut */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData(f => ({ ...f, status: v as TaskStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.color}>{config.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Taux d'avancement */}
            {formData.status !== "realise" && formData.status !== "annule" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Taux d'avancement: {formData.taux_avancement}%
                </Label>
                <Slider
                  value={[formData.taux_avancement]}
                  onValueChange={([v]) => setFormData(f => ({ ...f, taux_avancement: v }))}
                  max={100}
                  step={5}
                />
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date début
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date_debut_reelle && "text-muted-foreground"
                      )}
                    >
                      {formData.date_debut_reelle
                        ? format(formData.date_debut_reelle, "dd/MM/yyyy", { locale: fr })
                        : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date_debut_reelle}
                      onSelect={(d) => setFormData(f => ({ ...f, date_debut_reelle: d }))}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date fin
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date_fin_reelle && "text-muted-foreground"
                      )}
                    >
                      {formData.date_fin_reelle
                        ? format(formData.date_fin_reelle, "dd/MM/yyyy", { locale: fr })
                        : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date_fin_reelle}
                      onSelect={(d) => setFormData(f => ({ ...f, date_fin_reelle: d }))}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Responsable */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Responsable
              </Label>
              <Input
                placeholder="Nom du responsable"
                value={formData.responsable_nom}
                onChange={(e) => setFormData(f => ({ ...f, responsable_nom: e.target.value }))}
              />
            </div>

            {/* Motif de blocage */}
            {formData.status === "bloque" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Motif de blocage *
                </Label>
                <Textarea
                  placeholder="Décrivez la raison du blocage..."
                  value={formData.motif_blocage}
                  onChange={(e) => setFormData(f => ({ ...f, motif_blocage: e.target.value }))}
                  rows={3}
                />
              </div>
            )}

            {/* Commentaire */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Commentaire
              </Label>
              <Textarea
                placeholder="Ajouter un commentaire..."
                value={formData.commentaire}
                onChange={(e) => setFormData(f => ({ ...f, commentaire: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant compact pour intégration dans les tableaux de feuille de route
export function TaskExecutionBadge({
  activiteId,
  activiteCode,
  activiteLibelle,
  compact = false
}: {
  activiteId: string;
  activiteCode: string;
  activiteLibelle: string;
  compact?: boolean;
}) {
  const { exerciceId } = useExercice();
  const { executions } = useTaskExecutions({
    exercice_id: exerciceId || undefined
  });

  const execution = executions?.find(e => e.activite_id === activiteId);

  if (!execution) {
    return (
      <TaskExecutionQuickUpdate
        activiteId={activiteId}
        activiteCode={activiteCode}
        activiteLibelle={activiteLibelle}
      />
    );
  }

  if (compact) {
    const config = TASK_STATUS_CONFIG[execution.status as TaskStatus];
    return (
      <div className="flex items-center gap-1">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            execution.status === "non_demarre" && "bg-gray-400",
            execution.status === "en_cours" && "bg-blue-500",
            execution.status === "realise" && "bg-green-500",
            execution.status === "bloque" && "bg-red-500",
            execution.status === "annule" && "bg-orange-500"
          )}
        />
        <span className="text-xs">{execution.taux_avancement}%</span>
      </div>
    );
  }

  return (
    <TaskExecutionQuickUpdate
      activiteId={activiteId}
      activiteCode={activiteCode}
      activiteLibelle={activiteLibelle}
      currentStatus={execution.status as TaskStatus}
      currentTaux={execution.taux_avancement}
      currentDateDebut={execution.date_debut_reelle}
      currentDateFin={execution.date_fin_reelle}
      currentResponsable={execution.responsable_display}
    />
  );
}

export default TaskExecutionQuickUpdate;
