/**
 * Page "Notes à valider" - Vue DG (PROMPT 28)
 *
 * Écran dédié pour le DG avec :
 * - Table colonnes style ancienne version
 * - Recherche multi-critères
 * - Filtres : exercice, urgence, période, statut
 * - Row expand/drawer avec détails complets
 * - Actions rapides Valider/Rejeter/Différer
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useNotesSEFList } from "@/hooks/useNotesSEFList";
import { useNotesSEF, NoteSEF } from "@/hooks/useNotesSEF";
import { useNoteImputation } from "@/hooks/useNoteImputations";
import { usePermissions } from "@/hooks/usePermissions";
import { useExportNoteSEFPdf } from "@/hooks/useExportNoteSEFPdf";
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
  ChevronDown,
  ChevronRight,
  Paperclip,
  Filter,
  RefreshCw,
  ExternalLink,
  Lightbulb,
  FileEdit,
  ThumbsUp,
  Users,
  ArrowRight,
  FileDown,
} from "lucide-react";

// Constantes
const URGENCE_OPTIONS = [
  { value: "all", label: "Toutes les urgences" },
  { value: "urgente", label: "Urgente" },
  { value: "haute", label: "Haute" },
  { value: "normale", label: "Normale" },
  { value: "basse", label: "Basse" },
];

const STATUT_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "soumis", label: "Soumis" },
  { value: "a_valider", label: "À valider" },
  { value: "differe", label: "Différé" },
];

// Utilitaires
function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + "...";
  }
  return truncated + "...";
}

function getStatusBadge(status: string | null) {
  const variants: Record<string, { label: string; className: string }> = {
    soumis: { label: "Soumis", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    a_valider: { label: "À valider", className: "bg-warning/10 text-warning border-warning/20" },
    differe: { label: "Différé", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  };
  const variant = variants[status || "soumis"] || variants.soumis;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
}

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

// Skeleton
function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
    </TableRow>
  );
}

// Composant Drawer de détail
function NoteDetailDrawer({
  note,
  open,
  onOpenChange,
}: {
  note: NoteSEF | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { data: imputation } = useNoteImputation(note?.id);

  if (!note) return null;

  const hasContent = note.expose || note.avis || note.recommandations;
  const hasImputation = imputation && imputation.lignes.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {note.reference_pivot || note.numero || "Note SEF"}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {getStatusBadge(note.statut)}
            {getUrgenceBadge(note.urgence)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Informations générales */}
          <div>
            <h4 className="font-medium mb-2">Objet</h4>
            <p className="text-sm">{note.objet}</p>
          </div>

          <Separator />

          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Direction</p>
                <p className="font-medium">{note.direction?.sigle || note.direction?.label || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Demandeur</p>
                <p className="font-medium">
                  {note.demandeur
                    ? `${note.demandeur.first_name || ""} ${note.demandeur.last_name || ""}`.trim() || "—"
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Soumise le</p>
                <p className="font-medium">
                  {note.submitted_at
                    ? format(new Date(note.submitted_at), "dd MMM yyyy HH:mm", { locale: fr })
                    : format(new Date(note.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Date souhaitée</p>
                <p className="font-medium">
                  {note.date_souhaitee
                    ? format(new Date(note.date_souhaitee), "dd MMM yyyy", { locale: fr })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Contenu de la note */}
          {hasContent && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <FileEdit className="h-4 w-4 text-blue-600" />
                  Contenu de la note
                </h4>

                {note.expose && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 group">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Exposé
                      </span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <p className="text-sm whitespace-pre-wrap p-3 bg-muted/30 rounded border-l-4 border-blue-500/50">
                        {note.expose}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {note.avis && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded bg-green-50/50 dark:bg-green-950/20 hover:bg-green-100/50 group">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Avis
                      </span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <p className="text-sm whitespace-pre-wrap p-3 bg-muted/30 rounded border-l-4 border-green-500/50">
                        {note.avis}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {note.recommandations && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 group">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Recommandations
                      </span>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <p className="text-sm whitespace-pre-wrap p-3 bg-muted/30 rounded border-l-4 border-amber-500/50">
                        {note.recommandations}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </>
          )}

          {/* Imputation DG */}
          {hasImputation && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Imputation DG
                </h4>
                <div className="space-y-2">
                  {imputation.lignes.map((ligne) => (
                    <div
                      key={ligne.id}
                      className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm"
                    >
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span className="font-medium">{ligne.destinataire}</span>
                      <Badge variant="outline" className="text-xs">
                        {ligne.instruction_type}
                      </Badge>
                      {ligne.delai && (
                        <span className="text-muted-foreground">• {ligne.delai}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Pièces jointes - indicateur simple */}
          {(note as any).pieces_count > 0 && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Paperclip className="h-4 w-4" />
                <span>{(note as any).pieces_count} pièce(s) jointe(s)</span>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate(`/notes-sef/${note.id}`);
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir la page complète
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function NotesAValider() {
  const navigate = useNavigate();
  const { exercice } = useExercice();
  const { hasAnyRole } = usePermissions();
  const canValidate = hasAnyRole(["ADMIN", "DG", "DAAF"]);
  const { exportPdf, isExporting: isExportingPdf } = useExportNoteSEFPdf();

  // États
  const [searchTerm, setSearchTerm] = useState("");
  const [urgenceFilter, setUrgenceFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Drawer de détail
  const [selectedNote, setSelectedNote] = useState<NoteSEF | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Dialogs de validation
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deferDialogOpen, setDeferDialogOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");
  const [deferMotif, setDeferMotif] = useState("");
  const [deferCondition, setDeferCondition] = useState("");
  const [deferDateReprise, setDeferDateReprise] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hook pour la liste (notes à valider)
  const { notes, isLoading, refetch } = useNotesSEFList({
    pageSize: 100,
    initialTab: "a_valider",
  });

  // Hook pour les mutations
  const { validateNote, rejectNote, deferNote } = useNotesSEF();

  // Filtrage des notes
  const filteredNotes = useMemo(() => {
    return (notes as NoteSEF[]).filter((note) => {
      // Recherche textuelle
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          (note.reference_pivot || "").toLowerCase().includes(search) ||
          (note.objet || "").toLowerCase().includes(search) ||
          (note.direction?.sigle || "").toLowerCase().includes(search) ||
          (note.direction?.label || "").toLowerCase().includes(search) ||
          (`${note.demandeur?.first_name || ""} ${note.demandeur?.last_name || ""}`)
            .toLowerCase()
            .includes(search);
        if (!matchesSearch) return false;
      }

      // Filtre urgence
      if (urgenceFilter !== "all" && note.urgence !== urgenceFilter) {
        return false;
      }

      // Filtre statut
      if (statutFilter !== "all" && note.statut !== statutFilter) {
        return false;
      }

      // Filtre période
      if (dateFrom || dateTo) {
        const noteDate = new Date(note.submitted_at || note.created_at);
        if (dateFrom && noteDate < dateFrom) return false;
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (noteDate > endOfDay) return false;
        }
      }

      return true;
    });
  }, [notes, searchTerm, urgenceFilter, statutFilter, dateFrom, dateTo]);

  // Tri par urgence puis date
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      const urgenceOrder: Record<string, number> = { urgente: 0, haute: 1, normale: 2, basse: 3 };
      const urgA = urgenceOrder[a.urgence || "normale"] ?? 2;
      const urgB = urgenceOrder[b.urgence || "normale"] ?? 2;
      if (urgA !== urgB) return urgA - urgB;
      return new Date(b.submitted_at || b.created_at).getTime() -
        new Date(a.submitted_at || a.created_at).getTime();
    });
  }, [filteredNotes]);

  // Compteurs
  const urgentCount = filteredNotes.filter((n) => n.urgence === "urgente").length;
  const hauteCount = filteredNotes.filter((n) => n.urgence === "haute").length;
  const soumisCount = filteredNotes.filter((n) => n.statut === "soumis").length;
  const aValiderCount = filteredNotes.filter((n) => n.statut === "a_valider").length;

  // Actions
  const handleValidate = async (note: NoteSEF) => {
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

  const openRejectDialog = (note: NoteSEF) => {
    setSelectedNote(note);
    setRejectDialogOpen(true);
  };

  const openDeferDialog = (note: NoteSEF) => {
    setSelectedNote(note);
    setDeferDialogOpen(true);
  };

  const openDetailDrawer = (note: NoteSEF) => {
    setSelectedNote(note);
    setDetailDrawerOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setUrgenceFilter("all");
    setStatutFilter("all");
    setDateFrom(null);
    setDateTo(null);
  };

  // Accès restreint
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
          title="Notes à valider"
          description="Queue de validation DG - Notes SEF en attente de décision"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => navigate("/notes-sef")}>
            Retour
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
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
                <p className="text-sm text-muted-foreground">Soumises</p>
                <p className="text-3xl font-bold text-blue-600">{soumisCount}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-3xl font-bold text-amber-600">{aValiderCount}</p>
              </div>
              <Shield className="h-8 w-8 text-amber-600/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Barre de recherche */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence, objet, direction, demandeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtres
              {(urgenceFilter !== "all" || statutFilter !== "all" || dateFrom || dateTo) && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  !
                </Badge>
              )}
            </Button>
            {(searchTerm || urgenceFilter !== "all" || statutFilter !== "all" || dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Urgence</Label>
                <Select value={urgenceFilter} onValueChange={setUrgenceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={statutFilter} onValueChange={setStatutFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom || undefined}
                      onSelect={(date) => setDateFrom(date || null)}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo || undefined}
                      onSelect={(date) => setDateTo(date || null)}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table des notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Liste des notes à valider
          </CardTitle>
          <CardDescription>
            {sortedNotes.length} note(s) • Triées par urgence puis date de soumission
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">N°</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="hidden lg:table-cell">Recommandation</TableHead>
                  <TableHead className="hidden xl:table-cell">Exposé</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
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
                  {searchTerm || urgenceFilter !== "all" || statutFilter !== "all"
                    ? "Aucun résultat avec les filtres actuels"
                    : "Toutes les notes ont été traitées"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">N°</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="max-w-[180px]">Objet</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="hidden lg:table-cell max-w-[150px]">Recommandation</TableHead>
                  <TableHead className="hidden xl:table-cell max-w-[150px]">Exposé</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedNotes.map((note, index) => (
                  <TableRow
                    key={note.id}
                    className={cn(
                      "group cursor-pointer",
                      note.urgence === "urgente" && "bg-destructive/5",
                      note.urgence === "haute" && "bg-warning/5"
                    )}
                    onClick={() => openDetailDrawer(note)}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{note.direction?.sigle || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate" title={note.objet}>
                      {note.objet}
                    </TableCell>
                    <TableCell className="font-mono text-primary text-sm">
                      {note.reference_pivot || note.numero || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[150px] text-sm text-muted-foreground">
                      {truncateText(note.recommandations, 50)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell max-w-[150px] text-sm text-muted-foreground">
                      {truncateText(note.expose, 50)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(
                        new Date(note.submitted_at || note.created_at),
                        "dd/MM/yy",
                        { locale: fr }
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getUrgenceBadge(note.urgence)}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => exportPdf(note.id)}
                          disabled={isExportingPdf}
                          title="Exporter PDF (NOTE DG)"
                        >
                          {isExportingPdf ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetailDrawer(note)}
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleValidate(note)}
                          disabled={isProcessing}
                          className="bg-success hover:bg-success/90 gap-1"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDeferDialog(note)}
                          className="border-warning/50 text-warning hover:bg-warning/10"
                          title="Différer"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openRejectDialog(note)}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          title="Rejeter"
                        >
                          <XCircle className="h-4 w-4" />
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

      {/* Drawer de détail */}
      <NoteDetailDrawer
        note={selectedNote}
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
      />

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
              <Label htmlFor="defer-condition">Condition de reprise (optionnel)</Label>
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
