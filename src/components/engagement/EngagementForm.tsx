import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Loader2, Calculator, Link2, Lock } from "lucide-react";
import { useEngagements, BudgetAvailability } from "@/hooks/useEngagements";
import { useBudgetLines } from "@/hooks/useBudgetLines";
import { useLambdaLinks } from "@/hooks/useLambdaLinks";
import { useExercice } from "@/contexts/ExerciceContext";

interface EngagementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EngagementForm({ open, onOpenChange }: EngagementFormProps) {
  const { expressionsValidees, createEngagement, calculateAvailability, isCreating } = useEngagements();
  const { budgetLines } = useBudgetLines();
  const { createLink, linkTypes } = useLambdaLinks();
  const { exercice } = useExercice();
  
  // Check if expression→engagement link is active
  const isLinkActive = linkTypes.find(lt => lt.code === 'expression_to_engagement')?.actif ?? true;

  const [selectedExpressionId, setSelectedExpressionId] = useState<string>("");
  const [selectedBudgetLineId, setSelectedBudgetLineId] = useState<string>("");
  const [objet, setObjet] = useState("");
  const [montant, setMontant] = useState<number>(0);
  const [montantHT, setMontantHT] = useState<number>(0);
  const [tva, setTva] = useState<number>(0);
  const [fournisseur, setFournisseur] = useState("");
  const [availability, setAvailability] = useState<BudgetAvailability | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const selectedExpression = expressionsValidees.find((e) => e.id === selectedExpressionId);

  // Pre-fill from selected expression
  useEffect(() => {
    if (selectedExpression) {
      setObjet(selectedExpression.objet);
      setMontant(selectedExpression.montant_estime || (selectedExpression.marche as any)?.montant || 0);
      setFournisseur((selectedExpression.marche as any)?.prestataire?.raison_sociale || "");
    }
  }, [selectedExpression]);

  // Calculate availability when budget line or amount changes
  useEffect(() => {
    if (selectedBudgetLineId && montant > 0) {
      setIsCalculating(true);
      calculateAvailability(selectedBudgetLineId, montant)
        .then(setAvailability)
        .finally(() => setIsCalculating(false));
    } else {
      setAvailability(null);
    }
  }, [selectedBudgetLineId, montant]);

  const handleSubmit = async () => {
    if (!selectedExpressionId || !selectedBudgetLineId || !objet || montant <= 0) {
      return;
    }

    try {
      await createEngagement({
        expression_besoin_id: selectedExpressionId,
        budget_line_id: selectedBudgetLineId,
        objet,
        montant,
        montant_ht: montantHT || undefined,
        tva: tva || undefined,
        fournisseur,
        marche_id: selectedExpression?.marche?.id,
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const resetForm = () => {
    setSelectedExpressionId("");
    setSelectedBudgetLineId("");
    setObjet("");
    setMontant(0);
    setMontantHT(0);
    setTva(0);
    setFournisseur("");
    setAvailability(null);
  };

  const formatMontant = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un engagement</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Expression de besoin selection */}
          <div className="space-y-2">
            <Label>Expression de besoin validée *</Label>
            <Select value={selectedExpressionId} onValueChange={setSelectedExpressionId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une expression de besoin" />
              </SelectTrigger>
              <SelectContent>
                {expressionsValidees.map((expr) => (
                  <SelectItem key={expr.id} value={expr.id}>
                    {expr.numero} - {expr.objet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedExpression && (
            <>
              {/* Section Source avec traçabilité */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Source (Lien Lambda)</h4>
                    <Badge variant="outline" className="ml-auto">
                      {isLinkActive ? 'Liaison active' : 'Liaison désactivée'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      <Badge variant="secondary">Expression de besoin</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID Source:</span>{" "}
                      <code className="bg-muted px-1 rounded text-xs">{selectedExpression.numero}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations pré-remplies (read-only) */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Informations héritées (lecture seule)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Direction:</span>{" "}
                      <span className="font-medium">
                        {(selectedExpression.direction as any)?.label || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Marché:</span>{" "}
                      <span className="font-medium">
                        {(selectedExpression.marche as any)?.numero || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fournisseur:</span>{" "}
                      <span className="font-medium">
                        {(selectedExpression.marche as any)?.prestataire?.raison_sociale || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mode passation:</span>{" "}
                      <span className="font-medium">
                        {(selectedExpression.marche as any)?.mode_passation || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Exercice:</span>{" "}
                      <Badge>{exercice}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Montant estimé:</span>{" "}
                      <span className="font-medium">
                        {formatMontant(selectedExpression.montant_estime || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ligne budgétaire */}
              <div className="space-y-2">
                <Label>Ligne budgétaire (imputation) *</Label>
                <Select value={selectedBudgetLineId} onValueChange={setSelectedBudgetLineId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une ligne budgétaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetLines?.map((line) => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.code} - {line.label} ({formatMontant(line.dotation_initiale)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Calcul disponibilité */}
              {selectedBudgetLineId && (
                <Card className={availability?.is_sufficient ? "border-success/50" : "border-destructive/50"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="h-4 w-4" />
                      <h4 className="font-medium">Disponibilité budgétaire</h4>
                      {isCalculating && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    {availability && (
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-muted-foreground text-xs">(A) Dotation</div>
                          <div className="font-medium">{formatMontant(availability.dotation_initiale)}</div>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-muted-foreground text-xs">(B) Eng. antérieurs</div>
                          <div className="font-medium text-warning">
                            - {formatMontant(availability.engagements_anterieurs)}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-muted-foreground text-xs">(C) Eng. actuel</div>
                          <div className="font-medium text-primary">
                            - {formatMontant(availability.engagement_actuel)}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-muted-foreground text-xs">(D) Cumul</div>
                          <div className="font-medium">{formatMontant(availability.cumul)}</div>
                        </div>
                        <div
                          className={`text-center p-2 rounded ${
                            availability.is_sufficient
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          <div className="text-xs">(E) Disponible</div>
                          <div className="font-bold">{formatMontant(availability.disponible)}</div>
                        </div>
                      </div>
                    )}
                    {availability && !availability.is_sufficient && (
                      <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>Disponible insuffisant pour cet engagement</span>
                      </div>
                    )}
                    {availability?.is_sufficient && (
                      <div className="flex items-center gap-2 mt-3 text-success text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Disponible suffisant</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Formulaire engagement */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Objet *</Label>
                  <Textarea
                    value={objet}
                    onChange={(e) => setObjet(e.target.value)}
                    placeholder="Objet de l'engagement"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fournisseur *</Label>
                  <Input
                    value={fournisseur}
                    onChange={(e) => setFournisseur(e.target.value)}
                    placeholder="Nom du fournisseur"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Montant TTC *</Label>
                  <Input
                    type="number"
                    value={montant}
                    onChange={(e) => setMontant(Number(e.target.value))}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Montant HT</Label>
                  <Input
                    type="number"
                    value={montantHT}
                    onChange={(e) => setMontantHT(Number(e.target.value))}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label>TVA (%)</Label>
                  <Input
                    type="number"
                    value={tva}
                    onChange={(e) => setTva(Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isCreating ||
              !selectedExpressionId ||
              !selectedBudgetLineId ||
              !objet ||
              montant <= 0 ||
              (availability && !availability.is_sufficient)
            }
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer l'engagement"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
