import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Star, Trash2, CreditCard } from "lucide-react";
import { useSupplierBankAccounts } from "@/hooks/useSupplierDocuments";

interface SupplierBankTabProps {
  supplierId: string;
}

export function SupplierBankTab({ supplierId }: SupplierBankTabProps) {
  const { accounts: bankAccounts = [], isLoading, primaryAccount, addAccount, setAsPrimary, deleteAccount } = useSupplierBankAccounts(supplierId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    banque: "",
    numero_compte: "",
    code_banque: "",
    code_guichet: "",
    cle_rib: "",
    iban: "",
    bic_swift: "",
    titulaire: "",
  });

  const handleSubmit = () => {
    if (!formData.banque || !formData.numero_compte) return;
    
    setIsAdding(true);
    addAccount({
      banque: formData.banque,
      numero_compte: formData.numero_compte,
      cle_rib: formData.cle_rib || undefined,
      titulaire: formData.titulaire || undefined,
    });
    
    setFormData({
      banque: "",
      numero_compte: "",
      code_banque: "",
      code_guichet: "",
      cle_rib: "",
      iban: "",
      bic_swift: "",
      titulaire: "",
    });
    setIsAddDialogOpen(false);
    setIsAdding(false);
  };

  if (isLoading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Comptes bancaires</h4>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un compte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau compte bancaire</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Banque *</Label>
                  <Input
                    value={formData.banque}
                    onChange={(e) => setFormData({ ...formData, banque: e.target.value })}
                    placeholder="Nom de la banque"
                  />
                </div>
                <div>
                  <Label>Code banque</Label>
                  <Input
                    value={formData.code_banque}
                    onChange={(e) => setFormData({ ...formData, code_banque: e.target.value })}
                    placeholder="5 chiffres"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label>Code guichet</Label>
                  <Input
                    value={formData.code_guichet}
                    onChange={(e) => setFormData({ ...formData, code_guichet: e.target.value })}
                    placeholder="5 chiffres"
                    maxLength={5}
                  />
                </div>
                <div className="col-span-2">
                  <Label>N° de compte *</Label>
                  <Input
                    value={formData.numero_compte}
                    onChange={(e) => setFormData({ ...formData, numero_compte: e.target.value })}
                    placeholder="Numéro de compte"
                  />
                </div>
                <div>
                  <Label>Clé RIB</Label>
                  <Input
                    value={formData.cle_rib}
                    onChange={(e) => setFormData({ ...formData, cle_rib: e.target.value })}
                    placeholder="2 chiffres"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label>BIC/SWIFT</Label>
                  <Input
                    value={formData.bic_swift}
                    onChange={(e) => setFormData({ ...formData, bic_swift: e.target.value })}
                    placeholder="Code BIC"
                  />
                </div>
                <div className="col-span-2">
                  <Label>IBAN</Label>
                  <Input
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder="IBAN complet"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Titulaire du compte</Label>
                  <Input
                    value={formData.titulaire}
                    onChange={(e) => setFormData({ ...formData, titulaire: e.target.value })}
                    placeholder="Nom du titulaire"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.banque || !formData.numero_compte || isAdding}
              >
                {isAdding ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {bankAccounts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun compte bancaire enregistré</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Banque</TableHead>
              <TableHead>Numéro de compte</TableHead>
              <TableHead>Clé</TableHead>
              <TableHead>Titulaire</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bankAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {account.banque}
                    {account.est_principal && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Star className="h-3 w-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono">
                  {account.code_banque && account.code_guichet 
                    ? `${account.code_banque} ${account.code_guichet} ${account.numero_compte}`
                    : account.numero_compte
                  }
                </TableCell>
                <TableCell className="font-mono">{account.cle_rib || "-"}</TableCell>
                <TableCell>{account.titulaire || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {!account.est_principal && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAsPrimary(account.id)}
                        title="Définir comme principal"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAccount(account.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
