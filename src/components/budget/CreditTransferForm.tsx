import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreditTransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    from_budget_line_id: string;
    to_budget_line_id: string;
    amount: number;
    motif: string;
  }) => void;
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

export function CreditTransferForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreditTransferFormProps) {
  const { exercice } = useExercice();
  const [fromLineId, setFromLineId] = useState("");
  const [toLineId, setToLineId] = useState("");
  const [amount, setAmount] = useState(0);
  const [motif, setMotif] = useState("");

  const { data: budgetLines } = useQuery({
    queryKey: ["budget-lines-transfer", exercice],
    queryFn: async () => {
      const { data } = await supabase
        .from("budget_lines")
        .select("id, code, label, dotation_initiale")
        .eq("exercice", exercice || new Date().getFullYear())
        .eq("statut", "valide")
        .order("code");
      return data || [];
    },
    enabled: open,
  });

  const fromLine = budgetLines?.find((l) => l.id === fromLineId);
  const toLiine = budgetLines?.find((l) => l.id === toLineId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLineId || !toLineId || amount <= 0 || !motif.trim()) return;

    onSubmit({
      from_budget_line_id: fromLineId,
      to_budget_line_id: toLineId,
      amount,
      motif,
    });

    // Reset form
    setFromLineId("");
    setToLineId("");
    setAmount(0);
    setMotif("");
  };

  const isValid = 
    fromLineId && 
    toLineId && 
    fromLineId !== toLineId && 
    amount > 0 && 
    motif.trim() &&
    fromLine && 
    amount <= fromLine.dotation_initiale;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Demande de virement de crédits</DialogTitle>
          <DialogDescription>
            Transférer des crédits d'une ligne budgétaire vers une autre
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ligne source (débiter)</Label>
            <Select value={fromLineId} onValueChange={setFromLineId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la ligne à débiter..." />
              </SelectTrigger>
              <SelectContent>
                {budgetLines?.map((line) => (
                  <SelectItem key={line.id} value={line.id} disabled={line.id === toLineId}>
                    {line.code} - {line.label} ({formatCurrency(line.dotation_initiale)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fromLine && (
              <p className="text-sm text-muted-foreground">
                Disponible: {formatCurrency(fromLine.dotation_initiale)}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label>Ligne destination (créditer)</Label>
            <Select value={toLineId} onValueChange={setToLineId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la ligne à créditer..." />
              </SelectTrigger>
              <SelectContent>
                {budgetLines?.map((line) => (
                  <SelectItem key={line.id} value={line.id} disabled={line.id === fromLineId}>
                    {line.code} - {line.label} ({formatCurrency(line.dotation_initiale)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant à transférer (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={fromLine?.dotation_initiale || 0}
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
            {fromLine && amount > fromLine.dotation_initiale && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Le montant dépasse le solde disponible de la ligne source
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Justification *</Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif détaillé du virement de crédits..."
              rows={3}
              required
            />
          </div>

          {fromLine && toLiine && amount > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium">Résumé du virement</h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-red-600">-{formatCurrency(amount)}</span> de {fromLine.code}
                </p>
                <p>
                  <span className="text-green-600">+{formatCurrency(amount)}</span> vers {toLiine.code}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? "Envoi..." : "Soumettre la demande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}