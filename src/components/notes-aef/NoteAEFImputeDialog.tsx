import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { NoteAEF, useNotesAEF } from "@/hooks/useNotesAEF";
import { CreditCard, Loader2, Search } from "lucide-react";

interface NoteAEFImputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteAEF | null;
  onConfirm: (noteId: string, budgetLineId: string) => Promise<void>;
}

export function NoteAEFImputeDialog({
  open,
  onOpenChange,
  note,
  onConfirm,
}: NoteAEFImputeDialogProps) {
  const { budgetLines } = useNotesAEF();
  const [selectedBudgetLine, setSelectedBudgetLine] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredBudgetLines = budgetLines.filter(
    (bl) =>
      bl.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bl.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!note || !selectedBudgetLine) return;

    setIsLoading(true);
    try {
      await onConfirm(note.id, selectedBudgetLine);
      setSelectedBudgetLine("");
      setSearchQuery("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setSelectedBudgetLine("");
      setSearchQuery("");
    }
    onOpenChange(value);
  };

  if (!note) return null;

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Imputer la note
          </DialogTitle>
          <DialogDescription>
            Sélectionnez la ligne budgétaire sur laquelle imputer la note "{note.objet}".
            {note.montant_estime && (
              <span className="block mt-1 font-medium">
                Montant estimé: {formatMontant(note.montant_estime)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="search">Rechercher une ligne budgétaire</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Code ou libellé..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="budgetLine">Ligne budgétaire *</Label>
            <Select value={selectedBudgetLine} onValueChange={setSelectedBudgetLine}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Sélectionner une ligne budgétaire" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {filteredBudgetLines.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-muted-foreground">
                    Aucune ligne trouvée
                  </div>
                ) : (
                  filteredBudgetLines.map((bl) => (
                    <SelectItem key={bl.id} value={bl.id}>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{bl.code}</span>
                        <span className="text-sm truncate max-w-[300px]">{bl.label}</span>
                        <span className="text-xs text-muted-foreground">
                          Dotation: {formatMontant(bl.dotation_initiale)}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedBudgetLine || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Imputer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
