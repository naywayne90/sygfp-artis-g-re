import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Edit, Trash2, TrendingUp, Eye, AlertTriangle } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { type Tache, type TacheProgressUpdate } from "@/hooks/useTaches";

interface TacheListProps {
  taches: Tache[] | undefined;
  isLoading: boolean;
  onEdit: (tache: Tache) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (update: TacheProgressUpdate) => void;
  onViewDetails: (tache: Tache) => void;
}

const statutColors: Record<string, string> = {
  planifie: "bg-slate-500",
  en_cours: "bg-blue-500",
  termine: "bg-green-500",
  en_retard: "bg-red-500",
  suspendu: "bg-orange-500",
  annule: "bg-gray-500",
};

const statutLabels: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  en_retard: "En retard",
  suspendu: "Suspendu",
  annule: "Annulé",
};

const prioriteColors: Record<string, string> = {
  basse: "text-slate-500",
  normale: "text-blue-500",
  haute: "text-orange-500",
  critique: "text-red-500",
};

export function TacheList({ taches, isLoading, onEdit, onDelete, onUpdateProgress, onViewDetails }: TacheListProps) {
  const [progressDialog, setProgressDialog] = useState<{ isOpen: boolean; tache: Tache | null }>({
    isOpen: false,
    tache: null,
  });
  const [newProgress, setNewProgress] = useState(0);
  const [progressComment, setProgressComment] = useState("");

  const openProgressDialog = (tache: Tache) => {
    setProgressDialog({ isOpen: true, tache });
    setNewProgress(tache.avancement);
    setProgressComment("");
  };

  const handleProgressSubmit = () => {
    if (progressDialog.tache) {
      onUpdateProgress({
        tache_id: progressDialog.tache.id,
        previous_avancement: progressDialog.tache.avancement,
        new_avancement: newProgress,
        comment: progressComment,
      });
      setProgressDialog({ isOpen: false, tache: null });
    }
  };

  const isOverdue = (tache: Tache) => {
    if (!tache.date_fin || tache.statut === 'termine') return false;
    return isPast(new Date(tache.date_fin)) && tache.avancement < 100;
  };

  const getDaysRemaining = (tache: Tache) => {
    if (!tache.date_fin) return null;
    const days = differenceInDays(new Date(tache.date_fin), new Date());
    return days;
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 7 }).map((_, i) => (
                <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Code</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead>Rattachement</TableHead>
              <TableHead className="w-32">Dates</TableHead>
              <TableHead className="w-28">Avancement</TableHead>
              <TableHead className="w-24">Statut</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!taches || taches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Aucune tâche trouvée
                </TableCell>
              </TableRow>
            ) : (
              taches.map((tache) => {
                const overdue = isOverdue(tache);
                const daysRemaining = getDaysRemaining(tache);

                return (
                  <TableRow key={tache.id} className={overdue ? "bg-red-50 dark:bg-red-950/20" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${prioriteColors[tache.priorite]}`}>
                          {tache.code}
                        </span>
                        {overdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium line-clamp-1">{tache.libelle}</p>
                        {tache.responsable && (
                          <p className="text-xs text-muted-foreground">
                            {tache.responsable.full_name || tache.responsable.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tache.sous_activite?.activite?.action?.os && (
                          <Badge variant="outline" className="text-xs">
                            {tache.sous_activite.activite.action.os.code}
                          </Badge>
                        )}
                        {tache.sous_activite && (
                          <Badge variant="secondary" className="text-xs">
                            {tache.sous_activite.code}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        {tache.date_debut && (
                          <p>Début: {format(new Date(tache.date_debut), "dd/MM/yy", { locale: fr })}</p>
                        )}
                        {tache.date_fin && (
                          <p className={overdue ? "text-red-500 font-medium" : ""}>
                            Fin: {format(new Date(tache.date_fin), "dd/MM/yy", { locale: fr })}
                            {daysRemaining !== null && !overdue && daysRemaining <= 7 && daysRemaining > 0 && (
                              <span className="text-orange-500 ml-1">({daysRemaining}j)</span>
                            )}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={tache.avancement} className="h-2" />
                        <p className="text-xs text-center font-medium">{tache.avancement}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statutColors[tache.statut]}>
                        {statutLabels[tache.statut]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(tache)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openProgressDialog(tache)}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Mettre à jour avancement
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(tache)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(tache.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Progress Update Dialog */}
      <Dialog open={progressDialog.isOpen} onOpenChange={(open) => !open && setProgressDialog({ isOpen: false, tache: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour l'avancement</DialogTitle>
            <DialogDescription>
              {progressDialog.tache?.code} - {progressDialog.tache?.libelle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nouvel avancement (%)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={newProgress}
                  onChange={(e) => setNewProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={100}
                  className="w-24"
                />
                <Progress value={newProgress} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Commentaire</Label>
              <Textarea
                value={progressComment}
                onChange={(e) => setProgressComment(e.target.value)}
                placeholder="Décrivez l'avancement réalisé..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressDialog({ isOpen: false, tache: null })}>
              Annuler
            </Button>
            <Button onClick={handleProgressSubmit}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
