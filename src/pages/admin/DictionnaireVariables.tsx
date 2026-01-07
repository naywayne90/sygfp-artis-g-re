import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useReferentiels, DataDictionaryEntry } from "@/hooks/useReferentiels";
import { Plus, Download, Pencil, Trash2, Search, BookOpen, CheckCircle2, XCircle, Layers } from "lucide-react";

const TYPES_DONNEE = ["text", "integer", "numeric", "boolean", "date", "timestamp", "uuid", "jsonb", "array"];
const MODULES = ["Budget", "Engagement", "Liquidation", "Ordonnancement", "Règlement", "Dossier", "Marché", "Prestataire", "Admin"];

export default function DictionnaireVariables() {
  const {
    dictionary,
    loadingDictionary,
    addDictionaryEntry,
    updateDictionaryEntry,
    deleteDictionaryEntry,
    exportDictionaryCSV,
    socleStatus,
  } = useReferentiels();

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DataDictionaryEntry | null>(null);

  const filteredData = dictionary.filter((d) => {
    const matchesSearch =
      d.field_name.toLowerCase().includes(search.toLowerCase()) ||
      d.label_fr.toLowerCase().includes(search.toLowerCase()) ||
      d.table_name.toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === "all" || d.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const entry = {
      module: formData.get("module") as string,
      table_name: formData.get("table_name") as string,
      field_name: formData.get("field_name") as string,
      label_fr: formData.get("label_fr") as string,
      description: formData.get("description") as string || null,
      type_donnee: formData.get("type_donnee") as string,
      obligatoire: formData.get("obligatoire") === "on",
      regles_validation: formData.get("regles_validation") as string || null,
      exemple: formData.get("exemple") as string || null,
      source: formData.get("source") as string || null,
      version: "1.0",
      actif: true,
    };

    if (editingEntry) {
      updateDictionaryEntry.mutate({ id: editingEntry.id, ...entry });
    } else {
      addDictionaryEntry.mutate(entry);
    }
    setDialogOpen(false);
    setEditingEntry(null);
  };

  const handleEdit = (entry: DataDictionaryEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette variable du dictionnaire ?")) {
      deleteDictionaryEntry.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Dictionnaire des Variables
          </h1>
          <p className="text-muted-foreground">Référentiel officiel des champs de données SYGFP</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportDictionaryCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingEntry(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Variable
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingEntry ? "Modifier la variable" : "Ajouter une variable"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="module">Module</Label>
                    <Select name="module" defaultValue={editingEntry?.module || MODULES[0]}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODULES.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table_name">Nom de la table</Label>
                    <Input name="table_name" defaultValue={editingEntry?.table_name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field_name">Nom du champ</Label>
                    <Input name="field_name" defaultValue={editingEntry?.field_name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label_fr">Libellé (FR)</Label>
                    <Input name="label_fr" defaultValue={editingEntry?.label_fr} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type_donnee">Type de donnée</Label>
                    <Select name="type_donnee" defaultValue={editingEntry?.type_donnee || "text"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES_DONNEE.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input name="source" defaultValue={editingEntry?.source || ""} placeholder="Ex: Saisie utilisateur" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea name="description" defaultValue={editingEntry?.description || ""} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exemple">Exemple</Label>
                    <Input name="exemple" defaultValue={editingEntry?.exemple || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regles_validation">Règles de validation</Label>
                    <Input name="regles_validation" defaultValue={editingEntry?.regles_validation || ""} placeholder="Ex: NOT NULL, UNIQUE" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch name="obligatoire" id="obligatoire" defaultChecked={editingEntry?.obligatoire ?? false} />
                  <Label htmlFor="obligatoire">Champ obligatoire</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingEntry(null); }}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={addDictionaryEntry.isPending || updateDictionaryEntry.isPending}>
                    {editingEntry ? "Mettre à jour" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statut du socle */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span className="font-medium">Statut du Socle:</span>
            </div>
            <StatusItem label="Dictionnaire" ok={socleStatus.dictionnaireOK} />
            <StatusItem label="Codification" ok={socleStatus.codificationOK} />
            <StatusItem label="Connexion" ok={socleStatus.variablesConnexionOK} />
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un champ, une table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {MODULES.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>Variables ({filteredData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDictionary ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Champ</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Obligatoire</TableHead>
                  <TableHead>Exemple</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell><Badge variant="outline">{entry.module}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{entry.table_name}</TableCell>
                    <TableCell className="font-mono text-sm">{entry.field_name}</TableCell>
                    <TableCell>{entry.label_fr}</TableCell>
                    <TableCell><Badge variant="secondary">{entry.type_donnee}</Badge></TableCell>
                    <TableCell>
                      {entry.obligatoire ? (
                        <Badge className="bg-red-100 text-red-800">Oui</Badge>
                      ) : (
                        <Badge variant="outline">Non</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{entry.exemple}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
      <span className={`text-sm ${ok ? "text-green-700" : "text-destructive"}`}>{label}</span>
    </div>
  );
}
