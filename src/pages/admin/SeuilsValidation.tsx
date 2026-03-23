import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { Shield, Pencil, Layers, CheckCircle2, ListChecks } from 'lucide-react';
import { useValidationHierarchy, ValidationStep } from '@/hooks/useValidationHierarchy';
import { formatCurrency } from '@/lib/utils';

const ROLES = ['DG', 'DAAF', 'CB', 'SDB', 'AGENT', 'DSI', 'TRESORIER', 'COMPTABLE'];

export default function SeuilsValidation() {
  const { data, isLoading, toggleActive, update } = useValidationHierarchy();
  const [editItem, setEditItem] = useState<ValidationStep | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editOrder, setEditOrder] = useState('');
  const [editMin, setEditMin] = useState('');
  const [editMax, setEditMax] = useState('');
  const [editDocs, setEditDocs] = useState('');
  const [editActive, setEditActive] = useState(true);

  const totalModules = new Set(data.map((s) => s.module_id)).size;
  const totalSteps = data.length;
  const activeSteps = data.filter((s) => s.is_active).length;

  const openEdit = (item: ValidationStep) => {
    setEditItem(item);
    setEditRole(item.role);
    setEditOrder(String(item.step_order));
    setEditMin(item.min_amount != null ? String(item.min_amount) : '');
    setEditMax(item.max_amount != null ? String(item.max_amount) : '');
    setEditDocs(item.required_documents?.join(', ') ?? '');
    setEditActive(item.is_active);
  };

  const handleSave = () => {
    if (!editItem) return;
    update.mutate({
      id: editItem.id,
      role: editRole,
      step_order: parseInt(editOrder) || 0,
      min_amount: editMin ? parseFloat(editMin) : null,
      max_amount: editMax ? parseFloat(editMax) : null,
      required_documents: editDocs
        ? editDocs
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean)
        : null,
      is_active: editActive,
    });
    setEditItem(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
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
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seuils de Validation</h1>
          <p className="text-sm text-muted-foreground">
            Configuration des etapes et seuils de validation par module
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total modules
            </CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModules}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total etapes
            </CardTitle>
            <ListChecks className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSteps}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Etapes actives
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSteps}</div>
            <p className="text-xs text-muted-foreground">sur {totalSteps}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des seuils</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Ordre</TableHead>
                <TableHead className="text-right">Seuil min</TableHead>
                <TableHead className="text-right">Seuil max</TableHead>
                <TableHead>Documents requis</TableHead>
                <TableHead className="text-center">Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Shield className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-muted-foreground">Aucun seuil de validation configure</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {step.workflow_module?.label ?? step.module_id}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{step.role}</TableCell>
                    <TableCell className="text-center">{step.step_order}</TableCell>
                    <TableCell className="text-right">
                      {step.min_amount != null ? formatCurrency(step.min_amount) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {step.max_amount != null ? formatCurrency(step.max_amount) : '-'}
                    </TableCell>
                    <TableCell>
                      {step.required_documents?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {step.required_documents.map((doc) => (
                            <Badge key={doc} variant="secondary" className="text-xs">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={step.is_active}
                        onCheckedChange={(checked) =>
                          toggleActive.mutate({ id: step.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(step)}>
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

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le seuil de validation</DialogTitle>
            <DialogDescription>
              {editItem?.label ?? 'Modifier les parametres de cette etape'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ordre</Label>
              <Input
                type="number"
                min={1}
                value={editOrder}
                onChange={(e) => setEditOrder(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Seuil minimum (FCFA)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editMin}
                  onChange={(e) => setEditMin(e.target.value)}
                  placeholder="Aucun"
                />
              </div>
              <div className="space-y-2">
                <Label>Seuil maximum (FCFA)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editMax}
                  onChange={(e) => setEditMax(e.target.value)}
                  placeholder="Aucun"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Documents requis (separes par des virgules)</Label>
              <Textarea
                value={editDocs}
                onChange={(e) => setEditDocs(e.target.value)}
                placeholder="facture, bon_livraison, pv_reception"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editActive} onCheckedChange={setEditActive} />
              <Label>Etape active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={update.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
