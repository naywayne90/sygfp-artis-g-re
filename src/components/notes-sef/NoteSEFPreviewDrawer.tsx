/**
 * Drawer d'aperçu rapide des notes SEF (Prompt 26)
 *
 * Affiche un résumé de la note avec:
 * - Informations générales (référence, objet, statut)
 * - Extrait de l'exposé (200-300 caractères)
 * - Extrait des recommandations (200-300 caractères)
 */

import { NoteSEF } from "@/hooks/useNotesSEF";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  Building2,
  User,
  Calendar,
  ExternalLink,
  Edit,
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NoteSEFPreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteSEF | null;
  onEdit?: (note: NoteSEF) => void;
}

const MAX_EXTRACT_LENGTH = 280;

/**
 * Tronque un texte à une longueur donnée en coupant sur un mot complet
 */
function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  // Trouver le dernier espace avant la limite
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + "...";
  }
  return truncated + "...";
}

const getStatusBadge = (status: string | null) => {
  const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground", icon: <Edit className="h-3 w-3" /> },
    soumis: { label: "Soumis", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Send className="h-3 w-3" /> },
    a_valider: { label: "À valider", className: "bg-warning/10 text-warning border-warning/20", icon: <Clock className="h-3 w-3" /> },
    valide: { label: "Validé", className: "bg-success/10 text-success border-success/20", icon: <CheckCircle className="h-3 w-3" /> },
    valide_auto: { label: "Validé (auto)", className: "bg-success/10 text-success border-success/20", icon: <CheckCircle className="h-3 w-3" /> },
    rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3 w-3" /> },
    differe: { label: "Différé", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: <Clock className="h-3 w-3" /> },
  };
  const variant = variants[status || "brouillon"] || variants.brouillon;
  return (
    <Badge variant="outline" className={`${variant.className} flex items-center gap-1.5`}>
      {variant.icon}
      {variant.label}
    </Badge>
  );
};

const getUrgenceBadge = (urgence: string | null) => {
  const variants: Record<string, { label: string; className: string }> = {
    basse: { label: "Basse", className: "bg-muted text-muted-foreground" },
    normale: { label: "Normale", className: "bg-secondary text-secondary-foreground" },
    haute: { label: "Haute", className: "bg-warning text-warning-foreground" },
    urgente: { label: "Urgente", className: "bg-destructive text-destructive-foreground" },
  };
  const variant = variants[urgence || "normale"] || variants.normale;
  return <Badge className={variant.className}>{variant.label}</Badge>;
};

export function NoteSEFPreviewDrawer({
  open,
  onOpenChange,
  note,
  onEdit,
}: NoteSEFPreviewDrawerProps) {
  const navigate = useNavigate();

  if (!note) return null;

  const handleNavigateToDetail = () => {
    onOpenChange(false);
    navigate(`/notes-sef/${note.id}`);
  };

  const handleEdit = () => {
    if (onEdit) {
      onOpenChange(false);
      onEdit(note);
    }
  };

  const canEdit = note.statut === "brouillon";
  const hasContent = note.expose || note.avis || note.recommandations;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-mono">
              {note.dossier_ref || note.reference_pivot || note.numero || "Note SEF"}
            </span>
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 pt-1">
            {getStatusBadge(note.statut)}
            {getUrgenceBadge(note.urgence)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Objet */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Objet</h4>
            <p className="text-base font-medium">{note.objet}</p>
          </div>

          <Separator />

          {/* Informations clés */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Direction</p>
                <p className="text-sm font-medium">
                  {note.direction?.sigle || note.direction?.label || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Demandeur</p>
                <p className="text-sm font-medium">
                  {note.demandeur
                    ? `${note.demandeur.first_name || ""} ${note.demandeur.last_name || ""}`.trim() || "—"
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Date souhaitée</p>
                <p className="text-sm font-medium">
                  {note.date_souhaitee
                    ? format(new Date(note.date_souhaitee), "dd MMM yyyy", { locale: fr })
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Créée le</p>
                <p className="text-sm font-medium">
                  {format(new Date(note.created_at), "dd MMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </div>

          {/* Contenu de la note (extraits) */}
          {hasContent && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Contenu de la note
                </h4>

                {/* Extrait de l'exposé */}
                {note.expose && (
                  <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-blue-500/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Exposé</p>
                    <p className="text-sm">{truncateText(note.expose, MAX_EXTRACT_LENGTH)}</p>
                  </div>
                )}

                {/* Extrait de l'avis */}
                {note.avis && (
                  <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border-l-4 border-green-500/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Avis</p>
                    <p className="text-sm">{truncateText(note.avis, MAX_EXTRACT_LENGTH)}</p>
                  </div>
                )}

                {/* Extrait des recommandations */}
                {note.recommandations && (
                  <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-amber-500/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Recommandations
                    </p>
                    <p className="text-sm">{truncateText(note.recommandations, MAX_EXTRACT_LENGTH)}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Description / Justification (si pas de contenu structuré) */}
          {!hasContent && (note.description || note.justification) && (
            <>
              <Separator />
              {note.justification && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Justification</p>
                  <p className="text-sm">{truncateText(note.justification, MAX_EXTRACT_LENGTH)}</p>
                </div>
              )}
              {note.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{truncateText(note.description, MAX_EXTRACT_LENGTH)}</p>
                </div>
              )}
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              className="flex-1 gap-2"
              onClick={handleNavigateToDetail}
            >
              <ExternalLink className="h-4 w-4" />
              Voir détails
            </Button>
            {canEdit && onEdit && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default NoteSEFPreviewDrawer;
