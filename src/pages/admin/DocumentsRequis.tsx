import { useState } from 'react';
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
import { FileCheck, Pencil, Plus, CheckCircle2, Hash, Layers } from 'lucide-react';
import { useRequiredDocumentTypes, RequiredDocType } from '@/hooks/useRequiredDocumentTypes';

const MODULE_CODES = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'liquidation', label: 'Liquidation' },
  { value: 'ordonnancement', label: 'Ordonnancement' },
  { value: 'passation_marche', label: 'Passation de Marche' },
  { value: 'reglement', label: 'Reglement' },
  { value: 'expression_besoin', label: 'Expression de Besoin' },
];

const CATEGORIES = [
  'piece_justificative',
  'contrat',
  'facture',
  'rapport',
  'administratif',
  'autre',
];

export default function DocumentsRequis() {
  const [filterModule, setFilterModule] = useState<string | undefined>(undefined);
  const { data, stats, isLoading, toggleActive, update, create } = useRequiredDocumentTypes(
    filterModule ? { module_code: filterModule } : undefined
  );

  const [editItem, setEditItem] = useState<RequiredDocType | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formModule, setFormModule] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formMandatory, setFormMandatory] = useState(false);
  const [formFileTypes, setFormFileTypes] = useState('');
  const [formMaxSize, setFormMaxSize] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  const openEdit = (item: RequiredDocType) => {
    setIsCreateMode(false);
    setEditItem(item);
    setFormCode(item.code);
    setFormLabel(item.label);
    setFormModule(item.module_code);
    setFormCategory(item.category ?? '');
    setFormMandatory(item.is_mandatory);
    setFormFileTypes((item.allowed_file_types ?? []).join(', '));
    setFormMaxSize(item.max_file_size_mb != null ? String(item.max_file_size_mb) : '');
    setFormDescription(item.description ?? '');
    setFormActive(item.is_active);
  };

  const openCreate = () => {
    setIsCreateMode(true);
    setEditItem({ id: '' } as RequiredDocType);
    setFormCode('');
    setFormLabel('');
    setFormModule('');
    setFormCategory('');
    setFormMandatory(false);
    setFormFileTypes('');
    setFormMaxSize('');
    setFormDescription('');
    setFormActive(true);
  };

  const handleSave = () => {
    const payload = {
      code: formCode,
      label: formLabel,
      module_code: formModule,
      category: formCategory || null,
      is_mandatory: formMandatory,
      allowed_file_types: formFileTypes
        ? formFileTypes
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : null,
      max_file_size_mb: formMaxSize ? parseFloat(formMaxSize) : null,
      description: formDescription || null,
      is_active: formActive,
      icon: null,
    };
    if (isCreateMode) {
      create.mutate(payload);
    } else if (editItem) {
      update.mutate({ id: editItem.id, ...payload });
    }
    setEditItem(null);
  };

  const distinctModules = Object.keys(stats.byModule).length;

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documents Requis par Etape</h1>
            <p className="text-sm text-muted-foreground">
              Configuration des types de documents exiges par module
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau type
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total types</CardTitle>
            <Hash className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Obligatoires
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mandatory}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Par module</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distinctModules}</div>
            <p className="text-xs text-muted-foreground">modules distincts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium">Filtrer par module :</Label>
        <Select
          value={filterModule ?? 'all'}
          onValueChange={(v) => setFilterModule(v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Tous les modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les modules</SelectItem>
            {MODULE_CODES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead className="text-center">Obligatoire</TableHead>
                <TableHead>Types fichiers</TableHead>
                <TableHead>Taille max</TableHead>
                <TableHead className="text-center">Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <FileCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-muted-foreground">Aucun type de document configure</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{doc.code}</code>
                    </TableCell>
                    <TableCell className="font-medium">{doc.label}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.module_code}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{doc.category ?? '-'}</TableCell>
                    <TableCell className="text-center">
                      {doc.is_mandatory ? (
                        <Badge variant="destructive">Obligatoire</Badge>
                      ) : (
                        <Badge variant="secondary">Optionnel</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(doc.allowed_file_types ?? []).map((ft) => (
                          <Badge key={ft} variant="secondary" className="text-xs">
                            {ft}
                          </Badge>
                        ))}
                        {!(doc.allowed_file_types ?? []).length && (
                          <span className="text-muted-foreground text-xs">Tous</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {doc.max_file_size_mb != null ? `${doc.max_file_size_mb} Mo` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={doc.is_active}
                        onCheckedChange={(checked) =>
                          toggleActive.mutate({ id: doc.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(doc)}>
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
              {isCreateMode ? 'Nouveau type de document' : 'Modifier le type'}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? 'Definir un nouveau type de document requis'
                : `Modifier ${editItem?.code}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  disabled={!isCreateMode}
                />
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={formModule} onValueChange={setFormModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_CODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formMandatory} onCheckedChange={setFormMandatory} />
              <Label>Document obligatoire</Label>
            </div>
            <div className="space-y-2">
              <Label>Types de fichiers autorises (separes par des virgules)</Label>
              <Input
                value={formFileTypes}
                onChange={(e) => setFormFileTypes(e.target.value)}
                placeholder="pdf, jpg, png, docx"
              />
            </div>
            <div className="space-y-2">
              <Label>Taille maximale (Mo)</Label>
              <Input
                type="number"
                min={0}
                value={formMaxSize}
                onChange={(e) => setFormMaxSize(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>Actif</Label>
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
