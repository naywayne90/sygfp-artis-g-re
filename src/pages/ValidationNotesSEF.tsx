/**
 * Page de validation des Notes SEF - Espace DG
 * 
 * Vue dédiée pour les validateurs (DG/DAAF/ADMIN) avec :
 * - Liste des notes à valider
 * - Actions rapides (Valider/Différer/Rejeter)
 * - Filtres par urgence
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotesSEFList } from "@/hooks/useNotesSEFList";
import { useNotesSEF } from "@/hooks/useNotesSEF";
import { usePermissions } from "@/hooks/usePermissions";
import { useExercice } from "@/contexts/ExerciceContext";
import { ExerciceSubtitle } from "@/components/exercice/ExerciceSubtitle";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  Shield,
  Calendar as CalendarIcon,
  Search,
  Loader2,
  Eye,
  Building2,
  User,
} from "lucide-react";
import type { NoteSEFEntity } from "@/lib/notes-sef/types";

// Badge de statut
function getStatusBadge(status: string | null) {
  const variants: Record<string, { label: string; className: string }> = {
    soumis: { label: "Soumis", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    a_valider: { label: "À valider", className: "bg-warning/10 text-warning border-warning/20" },
    differe: { label: "Différé", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  };
  const variant = variants[status || "soumis"] || variants.soumis;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
}

// Badge d'urgence
function getUrgenceBadge(urgence: string | null) {
  const variants: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    basse: { label: "Basse", className: "bg-muted text-muted-foreground" },
    normale: { label: "Normale", className: "bg-secondary text-secondary-foreground" },
    haute: { label: "Haute", className: "bg-warning text-warning-foreground", icon: <AlertTriangle className="h-3 w-3" /> },
    urgente: { label: "Urgente", className: "bg-destructive text-destructive-foreground", icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const variant = variants[urgence || "normale"] || variants.normale;
  return (
    <Badge className={cn(variant.className, "gap-1")}>
      {variant.icon}
      {variant.label}
    </Badge>
  );
}

// Skeleton pour le chargement
function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
    </TableRow>
  );
}

export default function ValidationNotesSEF() {
  const navigate = useNavigate();
  const { exercice } = useExercice();
  const { hasAnyRole } = usePermissions();
  const canValidate = hasAnyRole(["ADMIN", "DG", "DAAF"]);

  // États des dialogs
  const [selectedNote, setSelectedNote] = useState<NoteSEFEntity | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deferDialogOpen, setDeferDialogOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");
  const [deferMotif, setDeferMotif] = useState("");
  const [deferCondition, setDeferCondition] = useState("");
  const [deferDateReprise, setDeferDateReprise] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Hook pour la liste (filtrée sur les notes à valider)
  const {
    notes,
    isLoading,
    refetch,
  } = useNotesSEFList({
    pageSize: 100,
    initialTab: "a_valider",
  });

  // Hook pour les mutations
  const { validateNote, rejectNote, deferNote } = useNotesSEF();
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtrer les notes en fonction de la recherche
  const filteredNotes = notes.filter((note: NoteSEFEntity) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (note.reference_pivot || "").toLowerCase().includes(search) ||
      (note.objet || "").toLowerCase().includes(search) ||
      ((note.direction as any)?.sigle || "").toLowerCase().includes(search)
    );
  });

  // Trier par urgence puis par date de création
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const urgenceOrder: Record<string, number> = { urgente: 0, haute: 1, normale: 2, basse: 3 };
    const urgA = urgenceOrder[a.urgence || "normale"] ?? 2;
    const urgB = urgenceOrder[b.urgence || "normale"] ?? 2;
    if (urgA !== urgB) return urgA - urgB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Compteurs par urgence
  const urgentCount = filteredNotes.filter((n) => n.urgence === "urgente").length;
  const hauteCount = filteredNotes.filter((n) => n.urgence === "haute").length;

  // Actions
  const handleValidate = async (note: NoteSEFEntity) => {
    setIsProcessing(true);
    try {
      await validateNote(note.id);
      refetch();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedNote || !rejectMotif.trim()) return;
    setIsProcessing(true);
    try {
      await rejectNote({ noteId: selectedNote.id, motif: rejectMotif });
      setRejectDialogOpen(false);
      setRejectMotif("");
      setSelectedNote(null);
      refetch();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeferConfirm = async () => {
    if (!selectedNote || !deferMotif.trim()) return;
    setIsProcessing(true);
    try {
      await deferNote({
        noteId: selectedNote.id,
        motif: deferMotif,
        condition: deferCondition || undefined,
        dateReprise: deferDateReprise ? format(deferDateReprise, "yyyy-MM-dd") : undefined,
      });
      setDeferDialogOpen(false);
      setDeferMotif("");
      setDeferCondition("");
      setDeferDateReprise(null);
      setSelectedNote(null);
      refetch();
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirection si non autorisé
  if (!canValidate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium">Accès restreint</p>
            <p className="text-sm text-muted-foreground">
              Cette page est réservée aux validateurs (DG, DAAF, Admin)
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/notes-sef")}>
            Retour aux Notes SEF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ExerciceSubtitle
          title="Validation Notes SEF"
          description="Espace de validation pour les décideurs"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/notes-sef")}>
            Retour à la liste
          </Button>
        </div>
      </div>

      {/* KPIs d'alerte */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total à valider</p>
                <p className="text-3xl font-bold">{filteredNotes.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className={urgentCount > 0 ? "border-destructive" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-3xl font-bold text-destructive">{urgentCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
        <Card className={hauteCount > 0 ? "border-warning" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Haute priorité</p>
                <p className="text-3xl font-bold text-warning">{hauteCount}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Normales</p>
                <p className="text-3xl font-bold text-muted-foreground">
                  {filteredNotes.length - urgentCount - hauteCount}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, objet, direction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des notes à valider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Notes SEF en attente de validation
          </CardTitle>
          <CardDescription>
            {sortedNotes.length} note(s) nécessitent votre validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Date soumission</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </TableBody>
            </Table>
          ) : sortedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <div className="rounded-full bg-success/10 p-4">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <div>
                <p className="font-medium text-lg">Aucune note à valider</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Toutes les notes ont été traitées. Bravo !
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead className="max-w-[200px]">Objet</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Soumise le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedNotes.map((note) => (
                  <TableRow
                    key={note.id}
                    className={cn(
                      "group",
                      note.urgence === "urgente" && "bg-destructive/5",
                      note.urgence === "haute" && "bg-warning/5"
                    )}
                  >
                    <TableCell className="font-mono font-medium text-primary">
                      {note.reference_pivot || note.numero || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={note.objet}>
                      {note.objet}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {(note.direction as any)?.sigle || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[120px]">
                          {(note.demandeur as any)
                            ? `${(note.demandeur as any).first_name || ""} ${(note.demandeur as any).last_name || ""}`.trim() || "—"
                            : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getUrgenceBadge(note.urgence)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {note.submitted_at
                        ? format(new Date(note.submitted_at), "dd MMM yyyy", { locale: fr })
                        : format(new Date(note.created_at), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/notes-sef/${note.id}`)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleValidate(note)}
                          disabled={isProcessing}
                          className="gap-1 bg-success hover:bg-success/90"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Valider
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedNote(note);
                            setDeferDialogOpen(true);
                          }}
                          className="gap-1 border-warning/50 text-warning hover:bg-warning/10"
                        >
                          <Clock className="h-4 w-4" />
                          Différer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedNote(note);
                            setRejectDialogOpen(true);
                          }}
                          className="gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4" />
                          Rejeter
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de rejet */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Rejeter la note
            </DialogTitle>
            <DialogDescription>
              Vous allez rejeter la note{" "}
              <span className="font-mono font-medium">
                {selectedNote?.reference_pivot || selectedNote?.numero}
              </span>
              . Cette action nécessite une justification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-motif" className="text-destructive">
                Motif du rejet *
              </Label>
              <Textarea
                id="reject-motif"
                value={rejectMotif}
                onChange={(e) => setRejectMotif(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectMotif.trim() || isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de report */}
      <Dialog open={deferDialogOpen} onOpenChange={setDeferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <Clock className="h-5 w-5" />
              Différer la note
            </DialogTitle>
            <DialogDescription>
              Vous allez différer la note{" "}
              <span className="font-mono font-medium">
                {selectedNote?.reference_pivot || selectedNote?.numero}
              </span>
              . Cette action nécessite une justification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="defer-motif" className="text-warning">
                Motif du report *
              </Label>
              <Textarea
                id="defer-motif"
                value={deferMotif}
                onChange={(e) => setDeferMotif(e.target.value)}
                placeholder="Expliquez la raison du report..."
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="defer-condition">
                Condition de reprise (optionnel)
              </Label>
              <Textarea
                id="defer-condition"
                value={deferCondition}
                onChange={(e) => setDeferCondition(e.target.value)}
                placeholder="Quelle condition doit être remplie pour reprendre le traitement ?"
                rows={2}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Date de reprise prévisionnelle (optionnel)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !deferDateReprise && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deferDateReprise
                      ? format(deferDateReprise, "dd MMMM yyyy", { locale: fr })
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deferDateReprise || undefined}
                    onSelect={(date) => setDeferDateReprise(date || null)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeferDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleDeferConfirm}
              disabled={!deferMotif.trim() || isProcessing}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer le report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
