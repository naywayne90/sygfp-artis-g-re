import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, Pencil, Variable, Lock, Database, Search 
} from "lucide-react";
import { toast } from "sonner";
import { useCodificationVariables, CodifVariable } from "@/hooks/useCodificationVariables";

export function VariablesManager() {
  const { 
    variables, 
    loadingVariables, 
    updateVariable, 
    createVariable, 
    toggleVariable 
  } = useCodificationVariables();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<CodifVariable | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    description: "",
    source_table: "",
    source_field: "",
    format_type: "string",
    pad_length: 0,
    pad_char: "0",
    pad_side: "left",
    default_value: "",
  });

  const filteredVariables = variables.filter(v => 
    v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (variable: CodifVariable) => {
    setEditingVariable(variable);
    setFormData({
      key: variable.key,
      label: variable.label,
      description: variable.description || "",
      source_table: variable.source_table || "",
      source_field: variable.source_field || "",
      format_type: variable.format_type,
      pad_length: variable.pad_length,
      pad_char: variable.pad_char,
      pad_side: variable.pad_side,
      default_value: variable.default_value || "",
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingVariable(null);
    setFormData({
      key: "",
      label: "",
      description: "",
      source_table: "",
      source_field: "",
      format_type: "string",
      pad_length: 0,
      pad_char: "0",
      pad_side: "left",
      default_value: "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.key || !formData.label) {
      toast.error("La clé et le libellé sont obligatoires");
      return;
    }

    if (editingVariable) {
      updateVariable.mutate({
        id: editingVariable.id,
        label: formData.label,
        description: formData.description || null,
        source_table: formData.source_table || null,
        source_field: formData.source_field || null,
        format_type: formData.format_type,
        pad_length: formData.pad_length,
        pad_char: formData.pad_char,
        pad_side: formData.pad_side,
        default_value: formData.default_value || null,
      });
    } else {
      createVariable.mutate({
        key: formData.key.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
        label: formData.label,
        description: formData.description || null,
        source_table: formData.source_table || null,
        source_field: formData.source_field || null,
        format_type: formData.format_type,
        pad_length: formData.pad_length,
        pad_char: formData.pad_char,
        pad_side: formData.pad_side,
        default_value: formData.default_value || null,
        transform: null,
        is_system: false,
        est_active: true,
      });
    }

    setDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Variable className="h-5 w-5" />
                Dictionnaire des Variables ({variables.length})
              </CardTitle>
              <CardDescription>
                Variables utilisables dans les patterns de codification
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle variable
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par clé ou libellé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Clé</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="w-[120px]">Source</TableHead>
                  <TableHead className="w-[80px]">Padding</TableHead>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead className="w-[80px]">Statut</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingVariables ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredVariables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune variable trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVariables.map((variable) => (
                    <TableRow key={variable.id} className={!variable.est_active ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="font-mono font-bold text-primary">{variable.key}</code>
                          {variable.is_system && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{variable.label}</p>
                          {variable.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {variable.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {variable.source_table ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Database className="h-3 w-3" />
                            <span className="font-mono">{variable.source_table}</span>
                          </div>
                        ) : (
                          <Badge variant="outline">Calculé</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {variable.pad_length > 0 && (
                          <Badge variant="secondary" className="font-mono">
                            {variable.pad_side === 'left' ? '←' : '→'}{variable.pad_length}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{variable.format_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={variable.est_active}
                          onCheckedChange={(checked) => toggleVariable.mutate({ id: variable.id, est_active: checked })}
                          disabled={variable.is_system}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(variable)}
                          disabled={variable.is_system}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVariable ? "Modifier la variable" : "Nouvelle variable"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clé *</Label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                  placeholder="MA_VARIABLE"
                  disabled={!!editingVariable}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Libellé *</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ma Variable"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la variable..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Table source</Label>
                <Input
                  value={formData.source_table}
                  onChange={(e) => setFormData({ ...formData, source_table: e.target.value })}
                  placeholder="nom_table"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Champ source</Label>
                <Input
                  value={formData.source_field}
                  onChange={(e) => setFormData({ ...formData, source_field: e.target.value })}
                  placeholder="code"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.format_type} 
                  onValueChange={(v) => setFormData({ ...formData, format_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Texte</SelectItem>
                    <SelectItem value="int">Entier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Longueur pad</Label>
                <Input
                  type="number"
                  value={formData.pad_length}
                  onChange={(e) => setFormData({ ...formData, pad_length: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={20}
                />
              </div>
              <div className="space-y-2">
                <Label>Char pad</Label>
                <Input
                  value={formData.pad_char}
                  onChange={(e) => setFormData({ ...formData, pad_char: e.target.value })}
                  maxLength={1}
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <Label>Côté</Label>
                <Select 
                  value={formData.pad_side} 
                  onValueChange={(v) => setFormData({ ...formData, pad_side: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Gauche</SelectItem>
                    <SelectItem value="right">Droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Valeur par défaut</Label>
              <Input
                value={formData.default_value}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                placeholder="Valeur si non fournie"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={updateVariable.isPending || createVariable.isPending}
            >
              {editingVariable ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
