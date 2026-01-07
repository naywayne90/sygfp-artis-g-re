import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCodification } from "@/hooks/useCodification";
import { useExercice } from "@/contexts/ExerciceContext";
import { 
  Plus, Pencil, Trash2, Hash, CheckCircle2, XCircle, 
  Layers, Code, Play, Copy, RefreshCw, Settings2, BarChart3 
} from "lucide-react";
import { toast } from "sonner";

const CODE_TYPES = [
  "LIGNE_BUDGETAIRE", "PRESTATAIRE", "CONTRAT", "MARCHE", "NOTE_AEF", "NOTE_SEF",
  "ENGAGEMENT", "LIQUIDATION", "ORDONNANCEMENT", "REGLEMENT", "VIREMENT", 
  "DOSSIER", "EXPRESSION_BESOIN"
];

const RESET_OPTIONS = [
  { value: "par_exercice", label: "Par exercice" },
  { value: "par_annee", label: "Par année" },
  { value: "jamais", label: "Jamais (global)" },
];

export default function ReferentielCodification() {
  const { exercice } = useExercice();
  const {
    rules,
    sequences,
    loadingRules,
    loadingSequences,
    testRule,
    toggleRule,
    updateRule,
  } = useCodification();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testRuleId, setTestRuleId] = useState<string | null>(null);
  const [testExercice, setTestExercice] = useState<number>(exercice || 2026);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestPending, setIsTestPending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const champsStr = formData.get("champs_contexte") as string;
    
    const rule = {
      code_type: formData.get("code_type") as string,
      objet: formData.get("objet") as string,
      prefixe: formData.get("prefixe") as string,
      format: formData.get("format") as string,
      format_numero: formData.get("format_numero") as string,
      separateur: formData.get("separateur") as string || "-",
      longueur_seq: parseInt(formData.get("longueur_seq") as string) || 4,
      reset_seq: formData.get("reset_seq") as 'par_exercice' | 'par_annee' | 'jamais',
      champs_contexte: champsStr ? champsStr.split(",").map((s) => s.trim()) : [],
      exemple: formData.get("exemple") as string || null,
      description: formData.get("description") as string || null,
      actif: formData.get("actif") === "on",
    };

    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...rule });
    }
    setDialogOpen(false);
    setEditingRule(null);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleTest = async () => {
    if (!testRuleId) return;
    
    setIsTestPending(true);
    try {
      const result = await testRule(testRuleId, testExercice);
      setTestResult(result);
    } catch (error) {
      toast.error("Erreur lors du test");
    } finally {
      setIsTestPending(false);
    }
  };

  const openTestDialog = (ruleId: string) => {
    setTestRuleId(ruleId);
    setTestResult(null);
    setTestDialogOpen(true);
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Code copié");
  };

  // Statistics
  const activeRules = rules.filter(r => r.actif).length;
  const totalSequences = sequences.reduce((sum, s) => sum + s.last_value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Hash className="h-6 w-6" />
            Règles de Codification
          </h1>
          <p className="text-muted-foreground">
            Codification unifiée des objets SYGFP - Exercice {exercice}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Règles totales</p>
                <p className="text-2xl font-bold">{rules.length}</p>
              </div>
              <Code className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Règles actives</p>
                <p className="text-2xl font-bold text-green-600">{activeRules}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Séquences {exercice}</p>
                <p className="text-2xl font-bold">{sequences.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Codes générés</p>
                <p className="text-2xl font-bold">{totalSequences}</p>
              </div>
              <Hash className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Règles
          </TabsTrigger>
          <TabsTrigger value="sequences" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Séquences ({sequences.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Règles de Codification ({rules.length})
              </CardTitle>
              <CardDescription>
                Format des codes pour chaque type d'objet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRules ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : rules.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune règle définie.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Préfixe</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Reset</TableHead>
                      <TableHead>Exemple</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Badge>{rule.code_type}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{rule.objet}</p>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-primary">
                          {rule.prefixe}
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {rule.format_numero || rule.format}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {RESET_OPTIONS.find(r => r.value === rule.reset_seq)?.label || rule.reset_seq}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="font-mono text-primary">{rule.exemple}</code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleCopyCode(rule.exemple || "")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.actif}
                            onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, actif: checked })}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openTestDialog(rule.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Tester
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                              <Pencil className="h-4 w-4" />
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
              <CardTitle className="text-base">Variables de format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{"{YYYY}"}</Badge>
                  <span className="text-muted-foreground">Année/Exercice</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{"{MM}"}</Badge>
                  <span className="text-muted-foreground">Mois (01-12)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{"{SEQ4}"}</Badge>
                  <span className="text-muted-foreground">Séquence 4 digits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{"{SEQ6}"}</Badge>
                  <span className="text-muted-foreground">Séquence 6 digits</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sequences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Séquences pour l'exercice {exercice}
              </CardTitle>
              <CardDescription>
                État des compteurs de numérotation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSequences ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : sequences.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune séquence pour cet exercice
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Objet</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Dernière valeur</TableHead>
                      <TableHead>Prochain code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequences.map((seq) => {
                      const rule = rules.find(r => r.objet === seq.objet);
                      const nextSeq = seq.last_value + 1;
                      const nextCode = rule 
                        ? `${rule.prefixe}-${exercice}-${String(nextSeq).padStart(rule.longueur_seq, '0')}`
                        : '-';
                      
                      return (
                        <TableRow key={seq.id}>
                          <TableCell>
                            <Badge>{seq.objet}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {seq.scope_key}
                          </TableCell>
                          <TableCell>
                            <span className="text-2xl font-bold text-primary">
                              {seq.last_value}
                            </span>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded font-mono">
                              {nextCode}
                            </code>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingRule(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la règle de codification</DialogTitle>
          </DialogHeader>
          {editingRule && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de code</Label>
                  <Input name="code_type" defaultValue={editingRule.code_type} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Table (objet)</Label>
                  <Input name="objet" defaultValue={editingRule.objet} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Préfixe</Label>
                  <Input name="prefixe" defaultValue={editingRule.prefixe} required />
                </div>
                <div className="space-y-2">
                  <Label>Séparateur</Label>
                  <Input name="separateur" defaultValue={editingRule.separateur || "-"} maxLength={2} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Input name="format" defaultValue={editingRule.format} />
                </div>
                <div className="space-y-2">
                  <Label>Format numéro</Label>
                  <Input name="format_numero" defaultValue={editingRule.format_numero} placeholder="{YYYY}-{SEQ4}" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Longueur séquence</Label>
                  <Input name="longueur_seq" type="number" defaultValue={editingRule.longueur_seq || 4} min={1} max={10} />
                </div>
                <div className="space-y-2">
                  <Label>Reset séquence</Label>
                  <Select name="reset_seq" defaultValue={editingRule.reset_seq || "par_exercice"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESET_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Exemple</Label>
                  <Input name="exemple" defaultValue={editingRule.exemple || ""} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Champs contexte (séparés par virgule)</Label>
                <Input
                  name="champs_contexte"
                  defaultValue={editingRule.champs_contexte?.join(", ") || "exercice"}
                  placeholder="exercice, annee, mois"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editingRule.description || ""} rows={2} />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch name="actif" id="actif" defaultChecked={editingRule.actif ?? true} />
                <Label htmlFor="actif">Règle active</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingRule(null); }}>
                  Annuler
                </Button>
                <Button type="submit" disabled={updateRule.isPending}>
                  {updateRule.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Mettre à jour
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tester la règle de codification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Exercice / Année</Label>
              <Input
                type="number"
                value={testExercice}
                onChange={(e) => setTestExercice(Number(e.target.value))}
                min={2020}
                max={2050}
              />
            </div>
            
            <Button onClick={handleTest} disabled={isTestPending} className="w-full">
              {isTestPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Générer un aperçu
            </Button>
            
            {testResult && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Aperçu du prochain code :</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-2xl font-mono font-bold text-primary">{testResult}</code>
                  <Button variant="ghost" size="icon" onClick={() => handleCopyCode(testResult)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ce code ne sera pas réservé (aperçu uniquement)
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
