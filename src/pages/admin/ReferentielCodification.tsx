import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useReferentiels, CodificationRule } from "@/hooks/useReferentiels";
import { Plus, Pencil, Trash2, Hash, CheckCircle2, XCircle, Layers, Code } from "lucide-react";

const CODE_TYPES = ["DOSSIER", "ENGAGEMENT", "LIQUIDATION", "ORDONNANCEMENT", "REGLEMENT", "MARCHE", "CONTRAT", "NOTE", "BUDGETAIRE", "COMPTABLE", "DIRECTION"];

export default function ReferentielCodification() {
  const {
    codificationRules,
    loadingRules,
    addCodificationRule,
    updateCodificationRule,
    deleteCodificationRule,
    socleStatus,
  } = useReferentiels();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CodificationRule | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ordreStr = formData.get("ordre_composants") as string;
    
    const rule = {
      code_type: formData.get("code_type") as string,
      format: formData.get("format") as string,
      separateur: formData.get("separateur") as string || "-",
      ordre_composants: ordreStr ? ordreStr.split(",").map((s) => s.trim()) : [],
      longueur_seq: parseInt(formData.get("longueur_seq") as string) || 4,
      prefixe: formData.get("prefixe") as string || null,
      exemple: formData.get("exemple") as string || null,
      description: formData.get("description") as string || null,
      actif: formData.get("actif") === "on",
    };

    if (editingRule) {
      updateCodificationRule.mutate({ id: editingRule.id, ...rule });
    } else {
      addCodificationRule.mutate(rule);
    }
    setDialogOpen(false);
    setEditingRule(null);
  };

  const handleEdit = (rule: CodificationRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette règle de codification ?")) {
      deleteCodificationRule.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Hash className="h-6 w-6" />
            Référentiel de Codification
          </h1>
          <p className="text-muted-foreground">Règles de construction des codes (dossiers, engagements, marchés...)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingRule(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Règle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Modifier la règle" : "Ajouter une règle de codification"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code_type">Type de code</Label>
                  <Input
                    name="code_type"
                    list="code-types"
                    defaultValue={editingRule?.code_type}
                    placeholder="Ex: DOSSIER, ENGAGEMENT..."
                    required
                  />
                  <datalist id="code-types">
                    {CODE_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prefixe">Préfixe</Label>
                  <Input name="prefixe" defaultValue={editingRule?.prefixe || ""} placeholder="Ex: DOS, ENG, MRC" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Input
                  name="format"
                  defaultValue={editingRule?.format}
                  placeholder="Ex: {prefixe}{sep}{annee}{sep}{mois}{sep}{seq}"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {"{prefixe}"}, {"{annee}"}, {"{mois}"}, {"{seq}"}, {"{sep}"}, {"{direction}"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="separateur">Séparateur</Label>
                  <Input name="separateur" defaultValue={editingRule?.separateur || "-"} maxLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longueur_seq">Longueur séquence</Label>
                  <Input name="longueur_seq" type="number" defaultValue={editingRule?.longueur_seq || 4} min={1} max={10} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exemple">Exemple</Label>
                  <Input name="exemple" defaultValue={editingRule?.exemple || ""} placeholder="DOS-2025-01-0001" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordre_composants">Ordre des composants (séparés par virgule)</Label>
                <Input
                  name="ordre_composants"
                  defaultValue={editingRule?.ordre_composants?.join(", ") || ""}
                  placeholder="prefixe, annee, mois, sequence"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" defaultValue={editingRule?.description || ""} rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <Switch name="actif" id="actif" defaultChecked={editingRule?.actif ?? true} />
                <Label htmlFor="actif">Règle active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingRule(null); }}>
                  Annuler
                </Button>
                <Button type="submit" disabled={addCodificationRule.isPending || updateCodificationRule.isPending}>
                  {editingRule ? "Mettre à jour" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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

      {/* Tableau des règles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Règles de Codification ({codificationRules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRules ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : codificationRules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucune règle définie. Ajoutez votre première règle.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Préfixe</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Séparateur</TableHead>
                  <TableHead>Long. Séq</TableHead>
                  <TableHead>Exemple</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codificationRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Badge>{rule.code_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{rule.prefixe || "-"}</TableCell>
                    <TableCell className="font-mono text-sm max-w-[250px] truncate" title={rule.format}>
                      {rule.format}
                    </TableCell>
                    <TableCell className="font-mono">{rule.separateur}</TableCell>
                    <TableCell>{rule.longueur_seq}</TableCell>
                    <TableCell className="font-mono text-primary">{rule.exemple}</TableCell>
                    <TableCell>
                      {rule.actif ? (
                        <Badge className="bg-green-100 text-green-800">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
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

      {/* Légende */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variables disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{"{prefixe}"}</Badge>
              <span className="text-muted-foreground">Préfixe du code</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{"{annee}"}</Badge>
              <span className="text-muted-foreground">Année (4 chiffres)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{"{mois}"}</Badge>
              <span className="text-muted-foreground">Mois (01-12)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{"{seq}"}</Badge>
              <span className="text-muted-foreground">Numéro séquentiel</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{"{sep}"}</Badge>
              <span className="text-muted-foreground">Séparateur</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{"{direction}"}</Badge>
              <span className="text-muted-foreground">Code direction</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{"{exercice}"}</Badge>
              <span className="text-muted-foreground">Exercice budgétaire</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{"{type}"}</Badge>
              <span className="text-muted-foreground">Type d'entité</span>
            </div>
          </div>
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
