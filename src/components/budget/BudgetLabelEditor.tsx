/**
 * BudgetLabelEditor - Éditeur inline pour les libellés budgétaires
 * Affiche un crayon au survol, ouvre un dialog de modification avec motif obligatoire
 */

import { useState } from "react";
import { Pencil, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  useBudgetLabelEditor,
  type BudgetEntityType,
  type BudgetLabelEntity,
} from "@/hooks/useBudgetLabelEditor";

// ============================================================================
// TYPES
// ============================================================================

export interface BudgetLabelEditorProps {
  /** Type d'entité budgétaire */
  entityType: BudgetEntityType;
  /** L'entité à éditer */
  entity: BudgetLabelEntity;
  /** Mode d'affichage du libellé */
  variant?: "inline" | "text" | "badge";
  /** Taille */
  size?: "sm" | "md" | "lg";
  /** Afficher l'icône d'édition au survol seulement */
  showEditOnHover?: boolean;
  /** Désactiver l'édition */
  disabled?: boolean;
  /** Callback après modification réussie */
  onSuccess?: () => void;
  /** Classe CSS additionnelle */
  className?: string;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function BudgetLabelEditor({
  entityType,
  entity,
  variant = "inline",
  size = "md",
  showEditOnHover = true,
  disabled = false,
  onSuccess,
  className,
}: BudgetLabelEditorProps) {
  const { updateLabel, isUpdating, getEntityTypeName } = useBudgetLabelEditor();

  const [isHovered, setIsHovered] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLibelle, setNewLibelle] = useState(entity.libelle);
  const [motif, setMotif] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Tailles
  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-medium",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleOpenDialog = () => {
    setNewLibelle(entity.libelle);
    setMotif("");
    setError(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setError(null);
  };

  const handleSubmit = () => {
    // Validation
    if (!newLibelle.trim()) {
      setError("Le libellé ne peut pas être vide");
      return;
    }

    if (newLibelle.trim() === entity.libelle) {
      setError("Le libellé n'a pas été modifié");
      return;
    }

    if (!motif.trim()) {
      setError("Le motif de modification est obligatoire");
      return;
    }

    if (motif.trim().length < 10) {
      setError("Le motif doit contenir au moins 10 caractères");
      return;
    }

    updateLabel(
      {
        entityType,
        entityId: entity.id,
        newLibelle: newLibelle.trim(),
        motif: motif.trim(),
      },
      {
        onSuccess: () => {
          handleCloseDialog();
          onSuccess?.();
        },
        onError: (err) => {
          setError((err as Error).message);
        },
      }
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────

  const editButton = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 transition-opacity",
              showEditOnHover && !isHovered && "opacity-0"
            )}
            onClick={handleOpenDialog}
            disabled={disabled}
          >
            <Pencil className={iconSizes[size]} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Modifier le libellé</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      {/* Affichage du libellé avec bouton d'édition */}
      <div
        className={cn(
          "group flex items-center gap-2",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {variant === "badge" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted",
              textSizes[size]
            )}
          >
            <span className="font-mono text-muted-foreground">{entity.code}</span>
            <span className="mx-1">-</span>
            <span>{entity.libelle}</span>
          </span>
        ) : variant === "text" ? (
          <span className={cn(textSizes[size])}>{entity.libelle}</span>
        ) : (
          <div className="flex flex-col">
            <span className={cn("font-medium", textSizes[size])}>{entity.libelle}</span>
            <span className="text-xs text-muted-foreground font-mono">{entity.code}</span>
          </div>
        )}

        {!disabled && editButton}
      </div>

      {/* Dialog de modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Modifier le libellé
            </DialogTitle>
            <DialogDescription>
              {getEntityTypeName(entityType)}: <strong>{entity.code}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Libellé actuel */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Libellé actuel</Label>
              <div className="p-3 bg-muted rounded-md text-sm">
                {entity.libelle}
              </div>
            </div>

            {/* Nouveau libellé */}
            <div className="space-y-2">
              <Label htmlFor="newLibelle">Nouveau libellé *</Label>
              <Input
                id="newLibelle"
                value={newLibelle}
                onChange={(e) => setNewLibelle(e.target.value)}
                placeholder="Saisissez le nouveau libellé"
                autoFocus
              />
            </div>

            {/* Motif de modification */}
            <div className="space-y-2">
              <Label htmlFor="motif">Motif de modification *</Label>
              <Textarea
                id="motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Expliquez la raison de cette modification (min. 10 caractères)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Ce motif sera enregistré dans l'historique des modifications
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// COMPOSANT: Bouton d'édition standalone
// ============================================================================

export interface BudgetLabelEditButtonProps {
  entityType: BudgetEntityType;
  entity: BudgetLabelEntity;
  size?: "sm" | "md" | "lg";
  onSuccess?: () => void;
}

export function BudgetLabelEditButton({
  entityType,
  entity,
  size = "md",
  onSuccess,
}: BudgetLabelEditButtonProps) {
  const { updateLabel, isUpdating, getEntityTypeName } = useBudgetLabelEditor();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLibelle, setNewLibelle] = useState(entity.libelle);
  const [motif, setMotif] = useState("");
  const [error, setError] = useState<string | null>(null);

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleOpenDialog = () => {
    setNewLibelle(entity.libelle);
    setMotif("");
    setError(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setError(null);
  };

  const handleSubmit = () => {
    if (!newLibelle.trim()) {
      setError("Le libellé ne peut pas être vide");
      return;
    }

    if (newLibelle.trim() === entity.libelle) {
      setError("Le libellé n'a pas été modifié");
      return;
    }

    if (!motif.trim()) {
      setError("Le motif de modification est obligatoire");
      return;
    }

    if (motif.trim().length < 10) {
      setError("Le motif doit contenir au moins 10 caractères");
      return;
    }

    updateLabel(
      {
        entityType,
        entityId: entity.id,
        newLibelle: newLibelle.trim(),
        motif: motif.trim(),
      },
      {
        onSuccess: () => {
          handleCloseDialog();
          onSuccess?.();
        },
        onError: (err) => {
          setError((err as Error).message);
        },
      }
    );
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleOpenDialog}
            >
              <Pencil className={cn(iconSizes[size], "text-muted-foreground")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Modifier le libellé</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le libellé</DialogTitle>
            <DialogDescription>
              {getEntityTypeName(entityType)}: <strong>{entity.code}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Libellé actuel</Label>
              <div className="p-3 bg-muted rounded-md text-sm">{entity.libelle}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newLibelle2">Nouveau libellé *</Label>
              <Input
                id="newLibelle2"
                value={newLibelle}
                onChange={(e) => setNewLibelle(e.target.value)}
                placeholder="Saisissez le nouveau libellé"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motif2">Motif de modification *</Label>
              <Textarea
                id="motif2"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Expliquez la raison de cette modification (min. 10 caractères)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Ce motif sera enregistré dans l'historique des modifications
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isUpdating}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BudgetLabelEditor;
