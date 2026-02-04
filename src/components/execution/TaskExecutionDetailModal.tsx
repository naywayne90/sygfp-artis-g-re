// @ts-nocheck
import { useState, useRef } from "react";
import {
  useTaskExecutionDetail,
  TASK_STATUS_CONFIG,
  TASK_SOURCE_CONFIG,
  PROOF_TYPE_CONFIG,
  type TaskStatus,
  type TaskSource,
  type ProofType,
  type TaskProof
} from "@/hooks/useTaskExecution";
import { useExercice } from "@/contexts/ExerciceContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  Calendar,
  User,
  Building2,
  Target,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  XCircle,
  History,
  Paperclip,
  Upload,
  Trash2,
  Download,
  Eye,
  Edit2,
  Settings,
  RefreshCw,
  Users,
  Image,
  FileBarChart,
  ScrollText,
  Award,
  File as FileIcon
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskExecutionDetailModalProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "dialog" | "sheet";
}

// Icônes pour les types de preuves
const PROOF_ICONS: Record<ProofType, React.ReactNode> = {
  document: <FileText className="h-4 w-4" />,
  photo: <Image className="h-4 w-4" />,
  rapport: <FileBarChart className="h-4 w-4" />,
  pv: <ScrollText className="h-4 w-4" />,
  attestation: <Award className="h-4 w-4" />,
  autre: <FileIcon className="h-4 w-4" />,
};

// Icônes pour les actions de l'historique
const HISTORY_ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  created: { label: "Créé", icon: <FileText className="h-4 w-4" />, color: "text-blue-600" },
  started: { label: "Démarré", icon: <Play className="h-4 w-4" />, color: "text-blue-600" },
  progress_updated: { label: "Avancement mis à jour", icon: <RefreshCw className="h-4 w-4" />, color: "text-purple-600" },
  completed: { label: "Réalisé", icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600" },
  blocked: { label: "Bloqué", icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600" },
  unblocked: { label: "Débloqué", icon: <Play className="h-4 w-4" />, color: "text-green-600" },
  cancelled: { label: "Annulé", icon: <XCircle className="h-4 w-4" />, color: "text-orange-600" },
  updated: { label: "Modifié", icon: <Edit2 className="h-4 w-4" />, color: "text-gray-600" },
};

export function TaskExecutionDetailModal({
  taskId,
  open,
  onOpenChange,
  mode = "sheet"
}: TaskExecutionDetailModalProps) {
  const { isReadOnly } = useExercice();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { task, contributors, proofs, history, isLoading, refetch } = useTaskExecutionDetail(taskId);

  // État pour l'upload de preuve
  const [uploadingProof, setUploadingProof] = useState(false);
  const [newProof, setNewProof] = useState({
    type: "document" as ProofType,
    libelle: "",
    description: "",
    date_piece: ""
  });

  // Mutation pour ajouter une preuve
  const addProofMutation = useMutation({
    mutationFn: async (data: {
      file: File;
      type: ProofType;
      libelle: string;
      description?: string;
      date_piece?: string;
    }) => {
      if (!taskId) throw new Error("ID de tâche manquant");

      // Upload du fichier via Edge Function R2
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("entityType", "task-execution-proofs");
      formData.append("entityId", taskId);

      const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
        "r2-storage",
        {
          body: formData,
        }
      );

      if (uploadError) throw uploadError;

      // Créer l'entrée dans la table
      const { error } = await supabase
        .from("task_execution_proofs")
        .insert({
          task_execution_id: taskId,
          type: data.type,
          libelle: data.libelle,
          description: data.description || null,
          filename: data.file.name,
          file_path: uploadResult.path,
          file_size: data.file.size,
          mime_type: data.file.type,
          date_piece: data.date_piece || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preuve ajoutée");
      refetch();
      setNewProof({ type: "document", libelle: "", description: "", date_piece: "" });
      setUploadingProof(false);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation pour supprimer une preuve
  const deleteProofMutation = useMutation({
    mutationFn: async (proofId: string) => {
      const { error } = await supabase
        .from("task_execution_proofs")
        .delete()
        .eq("id", proofId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preuve supprimée");
      refetch();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newProof.libelle) {
      toast.error("Veuillez renseigner le libellé");
      return;
    }

    addProofMutation.mutate({
      file,
      type: newProof.type,
      libelle: newProof.libelle,
      description: newProof.description,
      date_piece: newProof.date_piece,
    });
  };

  const handleDownloadProof = async (proof: TaskProof) => {
    if (!proof.file_path) {
      toast.error("Fichier non disponible");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("r2-storage", {
        body: {
          action: "download",
          path: proof.file_path,
        },
      });

      if (error) throw error;

      // Ouvrir le lien de téléchargement
      window.open(data.url, "_blank");
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
    }
  };

  if (!task && !isLoading) return null;

  const content = (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : task && (
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="proofs">
              Preuves ({proofs.length})
            </TabsTrigger>
            <TabsTrigger value="contributors">
              Équipe ({contributors.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              Historique ({history.length})
            </TabsTrigger>
          </TabsList>

          {/* Onglet Détails */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {/* En-tête avec statut */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold">{task.activite_code}</h3>
                <p className="text-sm text-muted-foreground">{task.activite_libelle}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={cn(
                  TASK_STATUS_CONFIG[task.status as TaskStatus].bgColor,
                  TASK_STATUS_CONFIG[task.status as TaskStatus].color,
                  "border-0"
                )}>
                  {TASK_STATUS_CONFIG[task.status as TaskStatus].label}
                </Badge>
                <Badge variant="outline" className={cn(
                  TASK_SOURCE_CONFIG[task.source as TaskSource]?.bgColor,
                  TASK_SOURCE_CONFIG[task.source as TaskSource]?.color
                )}>
                  {task.source === "manuel" && <Edit2 className="h-3 w-3 mr-1" />}
                  {task.source === "import" && <Upload className="h-3 w-3 mr-1" />}
                  {task.source === "auto" && <Settings className="h-3 w-3 mr-1" />}
                  {TASK_SOURCE_CONFIG[task.source as TaskSource]?.label || "Manuel"}
                </Badge>
              </div>
            </div>

            {/* Avancement */}
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avancement</span>
                    <span className="text-lg font-bold">{task.taux_avancement}%</span>
                  </div>
                  <Progress value={task.taux_avancement} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Hiérarchie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Hiérarchie programmatique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Direction:</span>
                  <span>{task.direction_code} - {task.direction_label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Mission:</span>
                  <span>{task.mission_code} - {task.mission_libelle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Action:</span>
                  <span>{task.action_code} - {task.action_libelle}</span>
                </div>
                {task.os_code && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">OS:</span>
                    <span>{task.os_code} - {task.os_libelle}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date début prévue</p>
                    <p className="font-medium">
                      {task.date_debut_prevue
                        ? format(new Date(task.date_debut_prevue), "dd/MM/yyyy", { locale: fr })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date fin prévue</p>
                    <p className="font-medium">
                      {task.date_fin_prevue
                        ? format(new Date(task.date_fin_prevue), "dd/MM/yyyy", { locale: fr })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date début réelle</p>
                    <p className="font-medium">
                      {task.date_debut_reelle
                        ? format(new Date(task.date_debut_reelle), "dd/MM/yyyy", { locale: fr })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date fin réelle</p>
                    <p className="font-medium">
                      {task.date_fin_reelle
                        ? format(new Date(task.date_fin_reelle), "dd/MM/yyyy", { locale: fr })
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Responsable */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Responsable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{task.responsable_display || "Non assigné"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Commentaire */}
            {task.commentaire && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Commentaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{task.commentaire}</p>
                </CardContent>
              </Card>
            )}

            {/* Motif de blocage */}
            {task.status === "bloque" && task.motif_blocage && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Motif de blocage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700">{task.motif_blocage}</p>
                  {task.date_blocage && (
                    <p className="text-xs text-red-500 mt-2">
                      Bloqué le {format(new Date(task.date_blocage), "dd/MM/yyyy à HH:mm", { locale: fr })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Audit */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Audit</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créé par</span>
                  <span>{task.created_by_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créé le</span>
                  <span>{format(new Date(task.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modifié par</span>
                  <span>{task.updated_by_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modifié le</span>
                  <span>{format(new Date(task.updated_at), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Preuves */}
          <TabsContent value="proofs" className="space-y-4 mt-4">
            {/* Formulaire d'ajout */}
            {!isReadOnly && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ajouter une preuve</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type de preuve</Label>
                      <Select
                        value={newProof.type}
                        onValueChange={(v) => setNewProof(p => ({ ...p, type: v as ProofType }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PROOF_TYPE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date de la pièce</Label>
                      <Input
                        type="date"
                        value={newProof.date_piece}
                        onChange={(e) => setNewProof(p => ({ ...p, date_piece: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Libellé *</Label>
                    <Input
                      placeholder="Ex: Rapport de mission terrain"
                      value={newProof.libelle}
                      onChange={(e) => setNewProof(p => ({ ...p, libelle: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Description optionnelle..."
                      value={newProof.description}
                      onChange={(e) => setNewProof(p => ({ ...p, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!newProof.libelle || addProofMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {addProofMutation.isPending ? "Upload en cours..." : "Sélectionner un fichier"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Liste des preuves */}
            {proofs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aucune preuve jointe
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {proofs.map((proof) => (
                  <Card key={proof.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded">
                            {PROOF_ICONS[proof.type as ProofType] || <FileIcon className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{proof.libelle}</p>
                            <p className="text-xs text-muted-foreground">
                              {PROOF_TYPE_CONFIG[proof.type as ProofType]?.label}
                              {proof.date_piece && ` • ${format(new Date(proof.date_piece), "dd/MM/yyyy", { locale: fr })}`}
                              {proof.filename && ` • ${proof.filename}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {proof.file_path && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadProof(proof)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {!isReadOnly && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => deleteProofMutation.mutate(proof.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {proof.description && (
                        <p className="text-xs text-muted-foreground mt-2 pl-11">
                          {proof.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Équipe */}
          <TabsContent value="contributors" className="space-y-4 mt-4">
            {contributors.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aucun contributeur
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {contributors.map((contributor) => (
                  <Card key={contributor.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{contributor.nom}</p>
                          {contributor.role && (
                            <p className="text-xs text-muted-foreground">{contributor.role}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Historique */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {history.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aucun historique
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                {/* Timeline */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

                <div className="space-y-4">
                  {history.map((entry, index) => {
                    const config = HISTORY_ACTION_CONFIG[entry.action] || HISTORY_ACTION_CONFIG.updated;
                    return (
                      <div key={entry.id} className="relative pl-10">
                        {/* Point de la timeline */}
                        <div className={cn(
                          "absolute left-2.5 w-3 h-3 rounded-full border-2 border-background",
                          entry.action === "completed" ? "bg-green-500" :
                          entry.action === "blocked" ? "bg-red-500" :
                          entry.action === "started" ? "bg-blue-500" :
                          "bg-gray-400"
                        )} />

                        <Card>
                          <CardContent className="py-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={config.color}>{config.icon}</span>
                                <span className="font-medium text-sm">{config.label}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(entry.performed_at), {
                                  addSuffix: true,
                                  locale: fr
                                })}
                              </span>
                            </div>

                            <div className="mt-2 text-sm space-y-1">
                              {entry.performer_name && (
                                <p className="text-muted-foreground">
                                  Par: <span className="text-foreground">{entry.performer_name}</span>
                                </p>
                              )}

                              {entry.old_status !== entry.new_status && entry.new_status && (
                                <p className="text-muted-foreground">
                                  Statut: {entry.old_status && (
                                    <>
                                      <span className="text-foreground">
                                        {TASK_STATUS_CONFIG[entry.old_status as TaskStatus]?.label || entry.old_status}
                                      </span>
                                      {" → "}
                                    </>
                                  )}
                                  <span className="text-foreground">
                                    {TASK_STATUS_CONFIG[entry.new_status as TaskStatus]?.label || entry.new_status}
                                  </span>
                                </p>
                              )}

                              {entry.old_taux !== entry.new_taux && entry.new_taux !== null && (
                                <p className="text-muted-foreground">
                                  Avancement: {entry.old_taux !== null && (
                                    <><span className="text-foreground">{entry.old_taux}%</span> → </>
                                  )}
                                  <span className="text-foreground">{entry.new_taux}%</span>
                                </p>
                              )}

                              {entry.source && (
                                <p className="text-muted-foreground">
                                  Source: <span className="text-foreground">
                                    {TASK_SOURCE_CONFIG[entry.source as TaskSource]?.label || entry.source}
                                  </span>
                                </p>
                              )}

                              {entry.comment && (
                                <p className="text-muted-foreground mt-1">
                                  "{entry.comment}"
                                </p>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(entry.performed_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  if (mode === "dialog") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détail de l'exécution</DialogTitle>
            <DialogDescription>
              Consultez les informations détaillées, les preuves et l'historique.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Détail de l'exécution</SheetTitle>
          <SheetDescription>
            Consultez les informations détaillées, les preuves et l'historique.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default TaskExecutionDetailModal;
