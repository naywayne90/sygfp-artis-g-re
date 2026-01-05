import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Settings, Hash, AlertTriangle, Workflow, Landmark, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type SystemConfig = {
  id: string;
  key: string;
  label: string;
  value: any;
  category: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  numerotation: <Hash className="h-4 w-4" />,
  alertes: <AlertTriangle className="h-4 w-4" />,
  workflow: <Workflow className="h-4 w-4" />,
  banques: <Landmark className="h-4 w-4" />,
  paiements: <CreditCard className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  numerotation: "Formats de Numérotation",
  alertes: "Seuils d'Alerte",
  workflow: "Workflow & Délais",
  banques: "Comptes Bancaires",
  paiements: "Modes de Paiement",
};

export default function ParametresSysteme() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    value: "",
    category: "general",
    description: "",
  });

  const { data: configs, isLoading } = useQuery({
    queryKey: ["system-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_config")
        .select("*")
        .order("category, label");
      if (error) throw error;
      return data as SystemConfig[];
    },
  });

  // Catégories disponibles
  const categories = useMemo(() => {
    if (!configs) return [];
    return [...new Set(configs.map((c) => c.category))].sort();
  }, [configs]);

  // Configs groupées par catégorie
  const configsByCategory = useMemo(() => {
    if (!configs) return {};
    return configs.reduce((acc, config) => {
      if (!acc[config.category]) acc[config.category] = [];
      acc[config.category].push(config);
      return acc;
    }, {} as Record<string, SystemConfig[]>);
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      // Parse la valeur JSON si c'est du JSON, sinon garde comme string
      let parsedValue = data.value;
      try {
        parsedValue = JSON.parse(data.value);
      } catch {
        // Ce n'est pas du JSON, on garde la valeur brute
      }

      const payload = {
        key: data.key,
        label: data.label,
        value: parsedValue,
        category: data.category,
        description: data.description || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("system_config")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("system_config")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingConfig ? "Paramètre mis à jour" : "Paramètre créé");
      queryClient.invalidateQueries({ queryKey: ["system-config"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const openCreateDialog = (category?: string) => {
    setEditingConfig(null);
    setFormData({
      key: "",
      label: "",
      value: "",
      category: category || "general",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (config: SystemConfig) => {
    setEditingConfig(config);
    setFormData({
      key: config.key,
      label: config.label,
      value: typeof config.value === "object" ? JSON.stringify(config.value) : String(config.value),
      category: config.category,
      description: config.description || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingConfig(null);
  };

  const handleSave = () => {
    if (!formData.key || !formData.label) {
      toast.error("Clé et libellé requis");
      return;
    }
    saveMutation.mutate({ ...formData, id: editingConfig?.id });
  };

  const renderValue = (value: any) => {
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paramètres Système</h1>
          <p className="text-muted-foreground mt-1">
            Configuration générale du système SYGFP.
          </p>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Paramètre
        </Button>
      </div>

      <Tabs defaultValue={categories[0] || "numerotation"} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
            >
              <div className="flex items-center gap-2">
                {CATEGORY_ICONS[cat] || <Settings className="h-4 w-4" />}
                {CATEGORY_LABELS[cat] || cat}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {CATEGORY_ICONS[cat] || <Settings className="h-5 w-5" />}
                      {CATEGORY_LABELS[cat] || cat}
                    </CardTitle>
                    <CardDescription>
                      {configsByCategory[cat]?.length || 0} paramètre(s)
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openCreateDialog(cat)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {configsByCategory[cat]?.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{config.label}</p>
                          <Badge variant="outline" className="text-xs">{config.key}</Badge>
                        </div>
                        {config.description && (
                          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <code className="bg-muted px-3 py-1 rounded text-sm max-w-[300px] truncate">
                          {renderValue(config.value)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!configsByCategory[cat] || configsByCategory[cat].length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun paramètre dans cette catégorie
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog création/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConfig ? "Modifier le paramètre" : "Nouveau paramètre"}</DialogTitle>
            <DialogDescription>
              Les paramètres système contrôlent le comportement de l'application.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clé *</Label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                  placeholder="ma_cle"
                  disabled={!!editingConfig}
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numerotation">Numérotation</SelectItem>
                    <SelectItem value="alertes">Alertes</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="banques">Banques</SelectItem>
                    <SelectItem value="paiements">Paiements</SelectItem>
                    <SelectItem value="general">Général</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Mon paramètre"
              />
            </div>
            <div className="space-y-2">
              <Label>Valeur *</Label>
              <Textarea
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder='Valeur simple ou JSON: {"key": "value"}'
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Pour les valeurs complexes, utilisez le format JSON.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du paramètre"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
