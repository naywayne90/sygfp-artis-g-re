import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Dossier } from "@/hooks/useDossiers";
import { supabase } from "@/integrations/supabase/client";

interface DossierAssignDialogProps {
  dossier: Dossier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dossierId: string, userId: string) => Promise<void>;
}

export function DossierAssignDialog({ dossier, open, onOpenChange, onConfirm }: DossierAssignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ id: string; full_name: string | null; email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUser(dossier?.demandeur_id || "");
    }
  }, [open, dossier]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");
    setUsers(data || []);
  };

  const handleConfirm = async () => {
    if (!dossier || !selectedUser) return;
    setLoading(true);
    try {
      await onConfirm(dossier.id, selectedUser);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!dossier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assigner le dossier</DialogTitle>
          <DialogDescription>
            Dossier {dossier.numero}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Assigner à</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !selectedUser}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assigner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
