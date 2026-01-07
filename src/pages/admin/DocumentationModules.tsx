import { useState } from "react";
import { useModuleDocumentation, ModuleDocumentation } from "@/hooks/useModuleDocumentation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, FileText, Database, Settings, Download, 
  RefreshCw, Save, ChevronRight, Code, ListChecks 
} from "lucide-react";

export default function DocumentationModules() {
  const { modules, isLoading, updateModule, generateDraft, isUpdating, isGenerating } = useModuleDocumentation();
  const [selectedModule, setSelectedModule] = useState<ModuleDocumentation | null>(null);
  const [editedModule, setEditedModule] = useState<Partial<ModuleDocumentation>>({});

  const handleSave = () => {
    if (selectedModule) {
      updateModule({ id: selectedModule.id, ...editedModule });
    }
  };

  const handleExport = (module: ModuleDocumentation) => {
    const content = `
# Documentation: ${module.module_label || module.module_key}

## Objectif
${module.objectif || "Non défini"}

## Périmètre
${module.perimetre || "Non défini"}

## Tables utilisées
${Array.isArray(module.tables_utilisees) ? module.tables_utilisees.join(", ") : "Aucune"}

## Statuts workflow
${Array.isArray(module.statuts_workflow) ? module.statuts_workflow.join(" → ") : "Aucun"}

## Règles métier
${module.regles_metier || "Non définies"}

## Cas limites
${module.cas_limites || "Non définis"}

## Dépendances
${Array.isArray(module.dependances) ? module.dependances.join(", ") : "Aucune"}

---
Version: ${module.version || "1.0"}
Dernière mise à jour: ${module.updated_at ? new Date(module.updated_at).toLocaleDateString("fr-FR") : "N/A"}
    `.trim();

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doc_${module.module_key}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Documentation des Modules
        </h1>
        <p className="page-description">
          Documentation technique et fonctionnelle de chaque module SYGFP
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des modules */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Modules</CardTitle>
            <CardDescription>{modules?.length || 0} modules documentés</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-4">
                {modules?.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => {
                      setSelectedModule(mod);
                      setEditedModule({});
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedModule?.id === mod.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{mod.module_label || mod.module_key}</p>
                        <p className="text-xs text-muted-foreground">{mod.module_key}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Détails du module */}
        <Card className="lg:col-span-2">
          {selectedModule ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedModule.module_label || selectedModule.module_key}</CardTitle>
                  <CardDescription>Version {selectedModule.version || "1.0"}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateDraft(selectedModule.module_key)}
                    disabled={isGenerating}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                    Générer brouillon
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(selectedModule)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="general">
                  <TabsList className="mb-4">
                    <TabsTrigger value="general">
                      <FileText className="h-4 w-4 mr-2" />
                      Général
                    </TabsTrigger>
                    <TabsTrigger value="technique">
                      <Code className="h-4 w-4 mr-2" />
                      Technique
                    </TabsTrigger>
                    <TabsTrigger value="regles">
                      <ListChecks className="h-4 w-4 mr-2" />
                      Règles
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Objectif</Label>
                      <Textarea
                        value={editedModule.objectif ?? selectedModule.objectif ?? ""}
                        onChange={(e) => setEditedModule({ ...editedModule, objectif: e.target.value })}
                        placeholder="Objectif principal du module..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Périmètre</Label>
                      <Textarea
                        value={editedModule.perimetre ?? selectedModule.perimetre ?? ""}
                        onChange={(e) => setEditedModule({ ...editedModule, perimetre: e.target.value })}
                        placeholder="Périmètre fonctionnel..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Statuts workflow</Label>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedModule.statuts_workflow) && 
                          selectedModule.statuts_workflow.map((status, i) => (
                            <Badge key={i} variant="secondary">{status}</Badge>
                          ))
                        }
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="technique" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tables utilisées</Label>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedModule.tables_utilisees) && 
                          selectedModule.tables_utilisees.map((table, i) => (
                            <Badge key={i} variant="outline">
                              <Database className="h-3 w-3 mr-1" />
                              {table}
                            </Badge>
                          ))
                        }
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Champs clés</Label>
                      <div className="bg-muted rounded-lg p-4 text-sm">
                        {Array.isArray(selectedModule.champs_cles) && selectedModule.champs_cles.length > 0 ? (
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(selectedModule.champs_cles, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-muted-foreground">
                            Aucun champ clé défini. Cliquez sur "Générer brouillon" pour importer depuis le dictionnaire.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Dépendances</Label>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedModule.dependances) && selectedModule.dependances.length > 0 ? (
                          selectedModule.dependances.map((dep, i) => (
                            <Badge key={i} variant="secondary">{dep}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucune dépendance</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="regles" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Règles métier</Label>
                      <Textarea
                        value={editedModule.regles_metier ?? selectedModule.regles_metier ?? ""}
                        onChange={(e) => setEditedModule({ ...editedModule, regles_metier: e.target.value })}
                        placeholder="Règles métier applicables..."
                        rows={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cas limites</Label>
                      <Textarea
                        value={editedModule.cas_limites ?? selectedModule.cas_limites ?? ""}
                        onChange={(e) => setEditedModule({ ...editedModule, cas_limites: e.target.value })}
                        placeholder="Cas limites et exceptions..."
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez un module pour voir sa documentation</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
