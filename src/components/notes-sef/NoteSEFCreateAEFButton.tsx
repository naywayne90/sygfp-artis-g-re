import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";

interface NoteSEFCreateAEFButtonProps {
  noteSEF: {
    id: string;
    numero: string | null;
    reference_pivot: string | null;
    statut: string | null;
    objet: string;
  };
  variant?: "default" | "compact" | "card";
  hasExistingAEF?: boolean;
}

export function NoteSEFCreateAEFButton({
  noteSEF,
  variant = "default",
  hasExistingAEF = false,
}: NoteSEFCreateAEFButtonProps) {
  const navigate = useNavigate();
  const isValidated = noteSEF.statut === "valide" || noteSEF.statut === "valide_auto";

  const handleCreateAEF = () => {
    navigate(`/notes-aef?prefill=${noteSEF.id}`);
  };

  // Note SEF non validée
  if (!isValidated) {
    if (variant === "card") {
      return (
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
          <div className="rounded-full bg-muted p-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Création AEF non disponible</p>
            <p className="text-xs text-muted-foreground">
              La Note SEF doit d'abord être validée par le DG
            </p>
          </div>
          <Badge variant="outline" className="bg-warning/10 text-warning">
            En attente
          </Badge>
        </div>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" disabled className="gap-2">
              <FileText className="h-4 w-4" />
              Créer AEF
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>La Note SEF doit être validée avant de créer une AEF</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // AEF déjà créée
  if (hasExistingAEF) {
    if (variant === "card") {
      return (
        <div className="flex items-center gap-3 p-4 bg-success/5 rounded-lg border border-success/20">
          <div className="rounded-full bg-success/10 p-2">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Note AEF créée</p>
            <p className="text-xs text-muted-foreground">
              Une AEF existe déjà pour cette Note SEF
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/notes-aef")}
            className="gap-1"
          >
            Voir les AEF
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/notes-aef")}
        className="gap-2"
      >
        <CheckCircle className="h-4 w-4 text-success" />
        AEF existante
      </Button>
    );
  }

  // Prêt pour création AEF
  if (variant === "card") {
    return (
      <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="rounded-full bg-primary/10 p-2">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Créer une Note AEF</p>
          <p className="text-xs text-muted-foreground">
            Cette SEF validée peut donner lieu à une Note Avec Effet Financier
          </p>
        </div>
        <Button onClick={handleCreateAEF} className="gap-1">
          Créer AEF
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Button size="sm" onClick={handleCreateAEF} className="gap-1">
        <FileText className="h-3 w-3" />
        AEF
      </Button>
    );
  }

  return (
    <Button onClick={handleCreateAEF} className="gap-2">
      <FileText className="h-4 w-4" />
      Créer une Note AEF
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
