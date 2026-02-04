/**
 * ReamenagementForm - Formulaire de réaménagement budgétaire
 * Basé sur l'analyse de l'ancien SYGFP (arti-ci.com:8001)
 *
 * Permet de transférer du budget d'une imputation vers une autre
 * avec validation du disponible et workflow d'approbation.
 */

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowRight,
  AlertCircle,
  Check,
  ChevronsUpDown,
  Loader2,
  ArrowRightLeft,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useImputationsDisponibles,
  useBudgetImputation,
  useCreateReamenagement,
} from "@/hooks/useReamenagementBudgetaire";
import { useExercice } from "@/contexts/ExerciceContext";

interface ReamenagementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

export function ReamenagementForm({
  open,
  onOpenChange,
  onSuccess,
}: ReamenagementFormProps) {
  const { exerciceId } = useExercice();

  // Form state
  const [sourceImputation, setSourceImputation] = useState("");
  const [destinationImputation, setDestinationImputation] = useState("");
  const [montant, setMontant] = useState<number | "">("");
  const [motif, setMotif] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [openSourceCombo, setOpenSourceCombo] = useState(false);
  const [openDestCombo, setOpenDestCombo] = useState(false);

  // Queries
  const { data: imputations = [] } = useImputationsDisponibles(exerciceId);
  const { data: sourceBudget, isLoading: isLoadingSource } = useBudgetImputation(
    sourceImputation || null,
    exerciceId
  );
  const { data: destBudget, isLoading: isLoadingDest } = useBudgetImputation(
    destinationImputation || null,
    exerciceId
  );

  // Mutation
  const createMutation = useCreateReamenagement();

  // Get selected imputations
  const sourceImputationData = useMemo(
    () => imputations.find((i) => i.code === sourceImputation),
    [imputations, sourceImputation]
  );
  const destImputationData = useMemo(
    () => imputations.find((i) => i.code === destinationImputation),
    [imputations, destinationImputation]
  );

  // Validation
  const disponibleSource = sourceBudget?.disponible || 0;
  const isValidMontant =
    typeof montant === "number" && montant > 0 && montant <= disponibleSource;
  const isValid =
    sourceImputation &&
    destinationImputation &&
    sourceImputation !== destinationImputation &&
    isValidMontant &&
    motif.trim().length >= 10;

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || typeof montant !== "number") return;

    await createMutation.mutateAsync({
      imputationSource: sourceImputation,
      imputationDestination: destinationImputation,
      montant,
      motif: motif.trim(),
      referenceNote: referenceNote.trim() || undefined,
      exerciceId,
    });

    // Reset form
    setSourceImputation("");
    setDestinationImputation("");
    setMontant("");
    setMotif("");
    setReferenceNote("");

    onSuccess?.();
    onOpenChange(false);
  };

  // Reset form on close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSourceImputation("");
      setDestinationImputation("");
      setMontant("");
      setMotif("");
      setReferenceNote("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Demande de réaménagement budgétaire
          </DialogTitle>
          <DialogDescription>
            Transférer des crédits d'une imputation budgétaire vers une autre
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Source Imputation */}
          <div className="space-y-3">
            <Label>Imputation source (à débiter)</Label>
            <Popover open={openSourceCombo} onOpenChange={setOpenSourceCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSourceCombo}
                  className="w-full justify-between h-auto min-h-[40px] py-2"
                >
                  {sourceImputation ? (
                    <div className="flex flex-col items-start">
                      <span className="font-mono text-sm">{sourceImputation}</span>
                      <span className="text-xs text-muted-foreground">
                        {sourceImputationData?.libelle}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Sélectionner l'imputation à débiter...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher par code ou libellé..." />
                  <CommandList>
                    <CommandEmpty>Aucune imputation trouvée.</CommandEmpty>
                    <CommandGroup>
                      {imputations
                        .filter((i) => i.code !== destinationImputation)
                        .map((imp) => (
                          <CommandItem
                            key={imp.code}
                            value={`${imp.code} ${imp.libelle}`}
                            onSelect={() => {
                              setSourceImputation(imp.code);
                              setOpenSourceCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                sourceImputation === imp.code
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-mono text-sm">{imp.code}</span>
                              <span className="text-xs text-muted-foreground">
                                {imp.libelle} - NBE: {imp.nbe}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Source budget info */}
            {sourceImputation && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {isLoadingSource ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </div>
                ) : sourceBudget ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget actuel</p>
                        <p className="font-medium">
                          {formatMontant(sourceBudget.budget_actuel)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Engagements</p>
                        <p className="font-medium text-warning">
                          {formatMontant(sourceBudget.cumul_engagements)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Disponible</p>
                        <p className="font-bold text-success">
                          {formatMontant(sourceBudget.disponible)}
                        </p>
                      </div>
                    </div>
                    {typeof montant === "number" && montant > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-red-600">
                          <Minus className="h-4 w-4" />
                          <span>Après transfert: </span>
                          <span className="font-bold">
                            {formatMontant(sourceBudget.disponible - montant)}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Destination Imputation */}
          <div className="space-y-3">
            <Label>Imputation destination (à créditer)</Label>
            <Popover open={openDestCombo} onOpenChange={setOpenDestCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openDestCombo}
                  className="w-full justify-between h-auto min-h-[40px] py-2"
                >
                  {destinationImputation ? (
                    <div className="flex flex-col items-start">
                      <span className="font-mono text-sm">{destinationImputation}</span>
                      <span className="text-xs text-muted-foreground">
                        {destImputationData?.libelle}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Sélectionner l'imputation à créditer...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher par code ou libellé..." />
                  <CommandList>
                    <CommandEmpty>Aucune imputation trouvée.</CommandEmpty>
                    <CommandGroup>
                      {imputations
                        .filter((i) => i.code !== sourceImputation)
                        .map((imp) => (
                          <CommandItem
                            key={imp.code}
                            value={`${imp.code} ${imp.libelle}`}
                            onSelect={() => {
                              setDestinationImputation(imp.code);
                              setOpenDestCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                destinationImputation === imp.code
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-mono text-sm">{imp.code}</span>
                              <span className="text-xs text-muted-foreground">
                                {imp.libelle} - NBE: {imp.nbe}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Destination budget info */}
            {destinationImputation && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {isLoadingDest ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </div>
                ) : destBudget ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget actuel</p>
                        <p className="font-medium">
                          {formatMontant(destBudget.budget_actuel)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Engagements</p>
                        <p className="font-medium text-warning">
                          {formatMontant(destBudget.cumul_engagements)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Disponible</p>
                        <p className="font-bold text-success">
                          {formatMontant(destBudget.disponible)}
                        </p>
                      </div>
                    </div>
                    {typeof montant === "number" && montant > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-green-600">
                          <Plus className="h-4 w-4" />
                          <span>Après transfert: </span>
                          <span className="font-bold">
                            {formatMontant(destBudget.disponible + montant)}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>

          <Separator />

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant à transférer (FCFA) *</Label>
            <Input
              id="montant"
              type="number"
              min="1"
              max={disponibleSource}
              value={montant}
              onChange={(e) =>
                setMontant(e.target.value ? parseFloat(e.target.value) : "")
              }
              placeholder="0"
            />
            {sourceImputation && typeof montant === "number" && montant > disponibleSource && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Le montant dépasse le disponible ({formatMontant(disponibleSource)})
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="motif">Justification du réaménagement *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Décrivez la raison de ce transfert budgétaire (minimum 10 caractères)..."
              rows={3}
            />
            {motif.length > 0 && motif.length < 10 && (
              <p className="text-xs text-muted-foreground">
                {10 - motif.length} caractères restants (minimum requis)
              </p>
            )}
          </div>

          {/* Reference note */}
          <div className="space-y-2">
            <Label htmlFor="reference">Référence de la note (optionnel)</Label>
            <Input
              id="reference"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="N° de la note autorisant le réaménagement..."
            />
          </div>

          {/* Summary */}
          {isValid && typeof montant === "number" && (
            <Alert>
              <ArrowRightLeft className="h-4 w-4" />
              <AlertTitle>Résumé du réaménagement</AlertTitle>
              <AlertDescription className="space-y-1">
                <p>
                  Transfert de <strong>{formatMontant(montant)}</strong>
                </p>
                <p>
                  <Badge variant="outline" className="mr-1 font-mono">
                    {sourceImputation}
                  </Badge>
                  →
                  <Badge variant="outline" className="ml-1 font-mono">
                    {destinationImputation}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  Cette demande sera soumise à validation avant application.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid || createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Soumettre la demande"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
