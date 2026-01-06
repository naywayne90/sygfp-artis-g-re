import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Loader2,
  FileCheck,
  ShieldCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";

interface BudgetValidationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalLines: number;
  validatedLines: number;
  pendingLines: number;
  totalDotation: number;
  onSuccess: () => void;
}

export function BudgetValidation({ 
  open, 
  onOpenChange, 
  totalLines,
  validatedLines,
  pendingLines,
  totalDotation,
  onSuccess 
}: BudgetValidationProps) {
  const { exercice } = useExercice();
  const [isValidating, setIsValidating] = useState(false);
  const [description, setDescription] = useState("");

  const allValidated = validatedLines === totalLines && totalLines > 0;
  const hasPending = pendingLines > 0;
  const canValidateGlobal = totalLines > 0 && !hasPending;

  const handleValidateAll = async () => {
    setIsValidating(true);

    try {
      // First, validate all individual lines that are in "brouillon" or "soumis" status
      const { error: updateError } = await supabase
        .from("budget_lines")
        .update({
          statut: "valide",
          validated_at: new Date().toISOString(),
        })
        .eq("exercice", exercice || new Date().getFullYear())
        .in("statut", ["brouillon", "soumis"]);

      if (updateError) throw updateError;

      // Get current version number for this exercise
      const { data: existingVersions } = await supabase
        .from("budget_versions")
        .select("version")
        .eq("exercice", exercice || new Date().getFullYear())
        .order("version", { ascending: false })
        .limit(1);

      const nextVersion = (existingVersions?.[0]?.version || 0) + 1;

      // Create a new validated budget version
      const { data: version, error: versionError } = await supabase
        .from("budget_versions")
        .insert({
          exercice: exercice || new Date().getFullYear(),
          version: nextVersion,
          label: `Budget ${exercice} - Version ${nextVersion}`,
          description: description || `Validation globale du budget exercice ${exercice}`,
          total_dotation: totalDotation,
          status: "valide",
          validated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Link all budget lines to this version
      const { error: linkError } = await supabase
        .from("budget_lines")
        .update({ budget_version_id: version.id })
        .eq("exercice", exercice || new Date().getFullYear());

      if (linkError) throw linkError;

      // Log audit
      await supabase.rpc("log_audit_with_exercice", {
        p_entity_type: "budget_version",
        p_entity_id: version.id,
        p_action: "BUDGET_VALIDE",
        p_new_values: {
          version: nextVersion,
          total_lines: totalLines,
          total_dotation: totalDotation,
        },
        p_exercice: exercice,
      });

      toast.success(`Budget validé avec succès (Version ${nextVersion})`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erreur de validation: " + error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleLockBudget = async () => {
    setIsValidating(true);

    try {
      // Lock all validated budget lines
      const { error } = await supabase
        .from("budget_lines")
        .update({
          locked_at: new Date().toISOString(),
        })
        .eq("exercice", exercice || new Date().getFullYear())
        .eq("statut", "valide");

      if (error) throw error;

      toast.success("Budget verrouillé - Les modifications nécessiteront un avenant");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Validation du Budget {exercice}
          </DialogTitle>
          <DialogDescription>
            Validez globalement la structure budgétaire de l'exercice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border rounded-lg p-3">
              <div className="text-2xl font-bold">{totalLines}</div>
              <div className="text-sm text-muted-foreground">Lignes totales</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{validatedLines}</div>
              <div className="text-sm text-muted-foreground">Validées</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-500">{pendingLines}</div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="text-sm text-muted-foreground">Dotation totale</div>
            <div className="text-xl font-bold">{formatCurrency(totalDotation)}</div>
          </div>

          {/* Status alerts */}
          {allValidated ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Budget entièrement validé</AlertTitle>
              <AlertDescription className="text-green-700">
                Toutes les lignes budgétaires sont validées. Vous pouvez verrouiller le budget.
              </AlertDescription>
            </Alert>
          ) : hasPending ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Lignes en attente</AlertTitle>
              <AlertDescription>
                {pendingLines} ligne(s) sont en attente de validation. Vous devez d'abord les valider individuellement.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <FileCheck className="h-4 w-4" />
              <AlertTitle>Prêt pour validation globale</AlertTitle>
              <AlertDescription>
                Vous pouvez valider globalement toutes les lignes budgétaires en brouillon.
              </AlertDescription>
            </Alert>
          )}

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description de la version (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Budget initial voté par le CA..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Warning */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Une fois validé, le budget alimentera le tableau de bord et les calculs de disponibilité.
              Après verrouillage, toute modification nécessitera un avenant.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          
          {allValidated ? (
            <Button onClick={handleLockBudget} disabled={isValidating}>
              {isValidating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Verrouiller le budget
            </Button>
          ) : (
            <Button 
              onClick={handleValidateAll} 
              disabled={isValidating || hasPending || totalLines === 0}
            >
              {isValidating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Valider toutes les lignes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}