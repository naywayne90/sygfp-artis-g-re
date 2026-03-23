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
import { Mail, Pencil, Eye, CheckCircle2, Hash, Code2 } from 'lucide-react';
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates';

export default function EmailTemplates() {
  const { data, isLoading, toggleActive, update } = useEmailTemplates();
  const [editItem, setEditItem] = useState<EmailTemplate | null>(null);
  const [previewItem, setPreviewItem] = useState<EmailTemplate | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);

  const totalTemplates = data.length;
  const activeTemplates = data.filter((t) => t.is_active).length;
  const allVariables = new Set(data.flatMap((t) => t.variables ?? []));

  const openEdit = (item: EmailTemplate) => {
    setEditItem(item);
    setEditLabel(item.label);
    setEditSubject(item.subject);
    setEditBody(item.body_html);
    setEditDescription(item.description ?? '');
    setEditActive(item.is_active);
  };

  const handleSave = () => {
    if (!editItem) return;
    update.mutate({
      id: editItem.id,
      label: editLabel,
      subject: editSubject,
      body_html: editBody,
      description: editDescription || null,
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
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates Email</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des modeles d'emails de notification
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total templates
            </CardTitle>
            <Hash className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTemplates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actifs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTemplates}</div>
            <p className="text-xs text-muted-foreground">sur {totalTemplates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Variables utilisees
            </CardTitle>
            <Code2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allVariables.size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des templates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead className="text-center">Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Mail className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-muted-foreground">Aucun template email configure</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{tpl.code}</code>
                    </TableCell>
                    <TableCell className="font-medium">{tpl.label}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{tpl.subject}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(tpl.variables ?? []).slice(0, 3).map((v) => (
                          <Badge key={v} variant="secondary" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                        {(tpl.variables ?? []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(tpl.variables ?? []).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={tpl.is_active}
                        onCheckedChange={(checked) =>
                          toggleActive.mutate({ id: tpl.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(tpl)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPreviewItem(tpl)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le template</DialogTitle>
            <DialogDescription>
              Code : <code className="bg-muted px-1 rounded">{editItem?.code}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sujet</Label>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Corps HTML</Label>
              <Textarea
                className="min-h-[200px] font-mono text-sm"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
              />
            </div>
            {editItem?.variables && editItem.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Variables disponibles</Label>
                <div className="flex flex-wrap gap-1">
                  {editItem.variables.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="text-xs font-mono"
                    >{`{{${v}}}`}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editActive} onCheckedChange={setEditActive} />
              <Label>Template actif</Label>
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

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apercu : {previewItem?.label}</DialogTitle>
            <DialogDescription>Sujet : {previewItem?.subject}</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white max-h-[400px] overflow-auto">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewItem?.body_html ?? '' }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewItem(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
