import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface EditLibelleDialogProps {
  budgetLineId: string;
  currentLibelle: string;
  fieldName: 'libelle' | 'description';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditLibelleDialog({
  budgetLineId,
  currentLibelle,
  fieldName,
  open,
  onOpenChange,
  onSuccess,
}: EditLibelleDialogProps) {
  const queryClient = useQueryClient();
  const [newLibelle, setNewLibelle] = useState(currentLibelle);
  const [motif, setMotif] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('update_budget_libelle', {
        p_budget_line_id: budgetLineId,
        p_field_name: fieldName,
        p_new_value: newLibelle,
        p_motif: motif,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Libelle mis a jour avec succes');
      queryClient.invalidateQueries({ queryKey: ['historique-libelles'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      setMotif('');
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibelle.trim()) {
      toast.error('Le libelle ne peut pas etre vide');
      return;
    }
    if (!motif.trim()) {
      toast.error('Le motif est obligatoire');
      return;
    }
    if (newLibelle === currentLibelle) {
      toast.error("Le libelle n'a pas ete modifie");
      return;
    }
    mutation.mutate();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNewLibelle(currentLibelle);
      setMotif('');
    }
    onOpenChange(isOpen);
  };

  const fieldLabel = fieldName === 'libelle' ? 'Libelle' : 'Description';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier le {fieldLabel.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Modifiez le {fieldLabel.toLowerCase()} de la ligne budgetaire. Un motif est requis
              pour la tracabilite.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-value">Valeur actuelle</Label>
              <Input id="current-value" value={currentLibelle} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-value">Nouveau {fieldLabel.toLowerCase()}</Label>
              <Input
                id="new-value"
                value={newLibelle}
                onChange={(e) => setNewLibelle(e.target.value)}
                placeholder={`Saisissez le nouveau ${fieldLabel.toLowerCase()}`}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motif">
                Motif de la modification <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Indiquez le motif de cette modification..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
