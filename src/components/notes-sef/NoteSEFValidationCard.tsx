/**
 * Carte de validation rapide pour Note SEF
 * 
 * Affiche les informations clés et les actions de validation
 * pour un traitement rapide par les validateurs.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NoteSEF } from "@/hooks/useNotesSEF";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  DollarSign,
  Target,
  Paperclip,
  ArrowRight,
  Eye,
} from "lucide-react";

interface NoteSEFValidationCardProps {
  note: NoteSEF;
  onValidate?: () => void;
  onReject?: () => void;
  onDefer?: () => void;
  onView?: () => void;
  isProcessing?: boolean;
  showDetails?: boolean;
}

// Badge d'urgence
function getUrgenceBadge(urgence: string | null) {
  const variants: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    basse: { label: "Basse", className: "bg-muted text-muted-foreground" },
    normale: { label: "Normale", className: "bg-secondary text-secondary-foreground" },
    haute: { label: "Haute", className: "bg-warning text-warning-foreground", icon: <AlertTriangle className="h-3 w-3" /> },
    urgente: { label: "URGENTE", className: "bg-destructive text-destructive-foreground animate-pulse", icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const variant = variants[urgence || "normale"] || variants.normale;
  return (
    <Badge className={cn(variant.className, "gap-1")}>
      {variant.icon}
      {variant.label}
    </Badge>
  );
}

// Formateur de montant
function formatMontant(montant: number | null | undefined) {
  if (!montant) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(montant);
}

export function NoteSEFValidationCard({
  note,
  onValidate,
  onReject,
  onDefer,
  onView,
  isProcessing = false,
  showDetails = true,
}: NoteSEFValidationCardProps) {
  const isUrgent = note.urgence === "urgente" || note.urgence === "haute";

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isUrgent && "border-warning/50",
      note.urgence === "urgente" && "border-destructive/50"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-lg font-semibold text-primary">
                {note.reference_pivot || note.numero || "Nouvelle note"}
              </span>
              {getUrgenceBadge(note.urgence)}
            </div>
            <CardTitle className="text-base font-medium truncate" title={note.objet}>
              {note.objet}
            </CardTitle>
          </div>
          {onView && (
            <Button variant="ghost" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations clés */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Direction :</span>
            <span className="font-medium">{note.direction?.sigle || note.direction?.label || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Demandeur :</span>
            <span className="font-medium truncate max-w-[120px]">
              {note.demandeur
                ? `${note.demandeur.first_name || ""} ${note.demandeur.last_name || ""}`.trim()
                : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Souhaitée :</span>
            <span className="font-medium">
              {note.date_souhaitee
                ? format(new Date(note.date_souhaitee), "dd MMM yyyy", { locale: fr })
                : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Estimé :</span>
            <span className="font-medium">{formatMontant(note.montant_estime)}</span>
          </div>
        </div>

        {/* Justification (si showDetails) */}
        {showDetails && note.justification && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Justification</p>
            <p className="text-sm line-clamp-3">{note.justification}</p>
          </div>
        )}

        {/* OS/Mission (si disponible) */}
        {showDetails && (note.objectif_strategique || note.mission) && (
          <div className="flex flex-wrap gap-2">
            {note.objectif_strategique && (
              <Badge variant="outline" className="gap-1">
                <Target className="h-3 w-3" />
                OS: {note.objectif_strategique.code}
              </Badge>
            )}
            {note.mission && (
              <Badge variant="outline" className="gap-1">
                Mission: {note.mission.code}
              </Badge>
            )}
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            Soumise le{" "}
            {note.submitted_at
              ? format(new Date(note.submitted_at), "dd/MM/yyyy à HH:mm", { locale: fr })
              : format(new Date(note.created_at), "dd/MM/yyyy", { locale: fr })}
          </div>
          <div className="flex items-center gap-2">
            {onDefer && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDefer}
                disabled={isProcessing}
                className="gap-1 border-warning/50 text-warning hover:bg-warning/10"
              >
                <Clock className="h-4 w-4" />
                Différer
              </Button>
            )}
            {onReject && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
                disabled={isProcessing}
                className="gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" />
                Rejeter
              </Button>
            )}
            {onValidate && (
              <Button
                size="sm"
                onClick={onValidate}
                disabled={isProcessing}
                className="gap-1 bg-success hover:bg-success/90"
              >
                <CheckCircle className="h-4 w-4" />
                Valider
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NoteSEFValidationCard;
