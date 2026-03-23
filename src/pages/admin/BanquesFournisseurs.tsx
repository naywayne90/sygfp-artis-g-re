import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Pencil, Plus, Star, Search, CheckCircle2, Hash, Landmark } from 'lucide-react';
import { useSupplierBankAccounts, SupplierBankAccount } from '@/hooks/useSupplierBankAccounts';

export default function BanquesFournisseurs() {
  const { data, stats, isLoading, toggleActive, update, create, setPrimary } =
    useSupplierBankAccounts();
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<SupplierBankAccount | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const [formSupplierId, setFormSupplierId] = useState('');
  const [formBanque, setFormBanque] = useState('');
  const [formCodeBanque, setFormCodeBanque] = useState('');
  const [formCodeGuichet, setFormCodeGuichet] = useState('');
  const [formNumeroCompte, setFormNumeroCompte] = useState('');
  const [formCleRib, setFormCleRib] = useState('');
  const [formIban, setFormIban] = useState('');
  const [formBic, setFormBic] = useState('');
  const [formTitulaire, setFormTitulaire] = useState('');
  const [formPrincipal, setFormPrincipal] = useState(false);

  // We need prestataires for the select - get from hook data
  const prestatairesFromAccounts = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((a) => {
      if (a.supplier_name) map.set(a.supplier_id, a.supplier_name);
    });
    return Array.from(map, ([id, nom]) => ({ id, nom }));
  }, [data]);

  const distinctBanks = Object.keys(stats.byBank).length;
  const principalCount = data.filter((a) => a.est_principal).length;

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (a) =>
        a.banque.toLowerCase().includes(q) ||
        a.numero_compte.toLowerCase().includes(q) ||
        (a.titulaire ?? '').toLowerCase().includes(q) ||
        (a.supplier_name ?? '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const openEdit = (item: SupplierBankAccount) => {
    setIsCreateMode(false);
    setEditItem(item);
    setFormSupplierId(item.supplier_id);
    setFormBanque(item.banque);
    setFormCodeBanque(item.code_banque ?? '');
    setFormCodeGuichet(item.code_guichet ?? '');
    setFormNumeroCompte(item.numero_compte);
    setFormCleRib(item.cle_rib ?? '');
    setFormIban(item.iban ?? '');
    setFormBic(item.bic_swift ?? '');
    setFormTitulaire(item.titulaire ?? '');
    setFormPrincipal(item.est_principal);
  };

  const openCreate = () => {
    setIsCreateMode(true);
    setEditItem({ id: '' } as SupplierBankAccount);
    setFormSupplierId('');
    setFormBanque('');
    setFormCodeBanque('');
    setFormCodeGuichet('');
    setFormNumeroCompte('');
    setFormCleRib('');
    setFormIban('');
    setFormBic('');
    setFormTitulaire('');
    setFormPrincipal(false);
  };

  const handleSave = () => {
    const payload = {
      supplier_id: formSupplierId,
      banque: formBanque,
      code_banque: formCodeBanque || null,
      code_guichet: formCodeGuichet || null,
      numero_compte: formNumeroCompte,
      cle_rib: formCleRib || null,
      iban: formIban || null,
      bic_swift: formBic || null,
      titulaire: formTitulaire || null,
      est_principal: formPrincipal,
      est_actif: true,
    };
    if (isCreateMode) {
      create.mutate(payload);
    } else if (editItem) {
      update.mutate({ id: editItem.id, ...payload });
    }
    setEditItem(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Comptes Bancaires Fournisseurs</h1>
            <p className="text-sm text-muted-foreground">
              Gestion des coordonnees bancaires des prestataires
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau compte
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total comptes
            </CardTitle>
            <Hash className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comptes actifs
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Banques distinctes
            </CardTitle>
            <Landmark className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distinctBanks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comptes principaux
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{principalCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par banque, numero, titulaire..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Banque</TableHead>
                <TableHead>N. Compte</TableHead>
                <TableHead>IBAN</TableHead>
                <TableHead>BIC</TableHead>
                <TableHead>Titulaire</TableHead>
                <TableHead className="text-center">Principal</TableHead>
                <TableHead className="text-center">Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Building2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-muted-foreground">Aucun compte bancaire fournisseur</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {account.supplier_name ?? account.supplier_id}
                    </TableCell>
                    <TableCell>{account.banque}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 rounded">{account.numero_compte}</code>
                    </TableCell>
                    <TableCell className="text-sm">{account.iban ?? '-'}</TableCell>
                    <TableCell className="text-sm">{account.bic_swift ?? '-'}</TableCell>
                    <TableCell className="text-sm">{account.titulaire ?? '-'}</TableCell>
                    <TableCell className="text-center">
                      {account.est_principal ? (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          <Star className="h-3 w-3 mr-1" /> Principal
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground"
                          onClick={() =>
                            setPrimary.mutate({ id: account.id, supplier_id: account.supplier_id })
                          }
                        >
                          Definir
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={account.est_actif}
                        onCheckedChange={(checked) =>
                          toggleActive.mutate({ id: account.id, est_actif: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Nouveau compte bancaire' : 'Modifier le compte'}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? 'Ajouter un compte bancaire fournisseur'
                : 'Modifier les informations bancaires'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Fournisseur</Label>
              <Select value={formSupplierId} onValueChange={setFormSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un fournisseur..." />
                </SelectTrigger>
                <SelectContent>
                  {prestatairesFromAccounts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banque</Label>
                <Input
                  value={formBanque}
                  onChange={(e) => setFormBanque(e.target.value)}
                  placeholder="SGBCI, BICICI..."
                />
              </div>
              <div className="space-y-2">
                <Label>Code banque</Label>
                <Input value={formCodeBanque} onChange={(e) => setFormCodeBanque(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code guichet</Label>
                <Input
                  value={formCodeGuichet}
                  onChange={(e) => setFormCodeGuichet(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Numero de compte</Label>
                <Input
                  value={formNumeroCompte}
                  onChange={(e) => setFormNumeroCompte(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cle RIB</Label>
              <Input value={formCleRib} onChange={(e) => setFormCleRib(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input value={formIban} onChange={(e) => setFormIban(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>BIC / SWIFT</Label>
                <Input value={formBic} onChange={(e) => setFormBic(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Titulaire du compte</Label>
              <Input value={formTitulaire} onChange={(e) => setFormTitulaire(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formPrincipal} onCheckedChange={setFormPrincipal} />
              <Label>Compte principal</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              {isCreateMode ? 'Creer' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
