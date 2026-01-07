import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLambdaLinks } from "@/hooks/useLambdaLinks";
import { useExercice } from "@/contexts/ExerciceContext";
import { 
  Link2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Settings2, 
  Wrench,
  Zap,
  Clock,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUT_ICONS = {
  ok: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  a_sync: <Clock className="h-4 w-4 text-yellow-500" />,
  erreur: <XCircle className="h-4 w-4 text-destructive" />,
  desactive: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
};

const STATUT_LABELS = {
  ok: "Synchronisé",
  a_sync: "À synchroniser",
  erreur: "Erreur",
  desactive: "Désactivé",
};

export default function LiensLambda() {
  const { exercice } = useExercice();
  const {
    linkTypes,
    links,
    linkStats,
    loadingLinkTypes,
    loadingLinks,
    toggleLinkType,
    syncLink,
    repairLink,
    suggestMapping,
  } = useLambdaLinks();

  const [selectedLinkType, setSelectedLinkType] = useState<string | null>(null);
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  const [linkToRepair, setLinkToRepair] = useState<string | null>(null);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);

  const handleToggleLinkType = (id: string, currentActif: boolean) => {
    toggleLinkType.mutate({ id, actif: !currentActif });
  };

  const handleSync = (linkId: string) => {
    syncLink.mutate(linkId);
  };

  const handleRepair = (linkId: string) => {
    setLinkToRepair(linkId);
    setRepairDialogOpen(true);
  };

  const filteredLinks = selectedLinkType
    ? links.filter(l => {
        const lt = linkTypes.find(t => t.code === selectedLinkType);
        return lt && l.source_table === lt.source_table && l.cible_table === lt.cible_table;
      })
    : links;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            Liens Lambda
          </h1>
          <p className="text-muted-foreground">
            Gestion des liaisons automatiques entre modules - Exercice {exercice}
          </p>
        </div>
        <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Assistant de liaison
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assistant de liaison automatique</DialogTitle>
            </DialogHeader>
            <MappingAssistant 
              linkTypes={linkTypes.filter(lt => lt.actif)} 
              suggestMapping={suggestMapping}
              onClose={() => setMappingDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total liens</p>
                <p className="text-2xl font-bold">{linkStats.total}</p>
              </div>
              <Link2 className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Synchronisés</p>
                <p className="text-2xl font-bold text-green-600">{linkStats.ok}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À synchroniser</p>
                <p className="text-2xl font-bold text-yellow-600">{linkStats.aSync}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En erreur</p>
                <p className="text-2xl font-bold text-destructive">{linkStats.erreur}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="types">
        <TabsList>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Types de liens
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Liens actifs ({links.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des types de liens</CardTitle>
              <CardDescription>
                Activez ou désactivez les types de liaisons entre modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLinkTypes ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Liaison</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Mapping par défaut</TableHead>
                      <TableHead className="w-[100px]">Actif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkTypes.map((lt) => (
                      <TableRow key={lt.id}>
                        <TableCell>
                          <Badge variant={lt.actif ? "default" : "outline"}>
                            {lt.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{lt.source_table}</Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="secondary">{lt.cible_table}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{lt.libelle}</span>
                          {lt.description && (
                            <p className="text-sm text-muted-foreground">{lt.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(lt.default_mapping || {}).slice(0, 3).map(([k, v]) => (
                              <Badge key={k} variant="outline" className="text-xs">
                                {k}→{v}
                              </Badge>
                            ))}
                            {Object.keys(lt.default_mapping || {}).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{Object.keys(lt.default_mapping).length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={lt.actif}
                            onCheckedChange={() => handleToggleLinkType(lt.id, lt.actif)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liens établis</CardTitle>
                  <CardDescription>
                    Historique et état des liaisons entre entités
                  </CardDescription>
                </div>
                <Select 
                  value={selectedLinkType || "all"} 
                  onValueChange={(v) => setSelectedLinkType(v === "all" ? null : v)}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Filtrer par type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {linkTypes.map((lt) => (
                      <SelectItem key={lt.code} value={lt.code}>
                        {lt.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLinks ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : filteredLinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Aucun lien établi pour cet exercice</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead></TableHead>
                      <TableHead>Cible</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dernière sync</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {STATUT_ICONS[link.statut_sync as keyof typeof STATUT_ICONS]}
                            <span className="text-sm">
                              {STATUT_LABELS[link.statut_sync as keyof typeof STATUT_LABELS]}
                            </span>
                          </div>
                          {link.erreur_detail && (
                            <p className="text-xs text-destructive mt-1">{link.erreur_detail}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{link.source_table}</Badge>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {link.source_id.slice(0, 8)}...
                          </p>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{link.cible_table}</Badge>
                          {link.cible_id ? (
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              {link.cible_id.slice(0, 8)}...
                            </p>
                          ) : (
                            <p className="text-xs text-yellow-600 mt-1">Non créé</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={link.type_lien === 'auto' ? 'default' : 'secondary'}>
                            {link.type_lien}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {link.last_sync_at 
                            ? format(new Date(link.last_sync_at), "dd MMM HH:mm", { locale: fr })
                            : "-"
                          }
                          {link.sync_count > 0 && (
                            <span className="text-xs ml-1">({link.sync_count}x)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleSync(link.id)}
                              disabled={syncLink.isPending}
                            >
                              <RefreshCw className={`h-4 w-4 ${syncLink.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                            {link.statut_sync === 'erreur' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRepair(link.id)}
                              >
                                <Wrench className="h-4 w-4 text-yellow-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Repair Dialog */}
      <Dialog open={repairDialogOpen} onOpenChange={setRepairDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réparer le lien</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ce lien est en erreur. Vous pouvez sélectionner une nouvelle source ou cible pour le réparer.
            </p>
            <div className="space-y-2">
              <Label>Nouvelle source (UUID)</Label>
              <Input placeholder="UUID de la nouvelle source" />
            </div>
            <div className="space-y-2">
              <Label>Nouvelle cible (UUID)</Label>
              <Input placeholder="UUID de la nouvelle cible" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRepairDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => {
                if (linkToRepair) {
                  repairLink.mutate({ linkId: linkToRepair });
                  setRepairDialogOpen(false);
                }
              }}>
                Réparer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mapping Assistant Component
function MappingAssistant({ 
  linkTypes, 
  suggestMapping,
  onClose,
}: { 
  linkTypes: { code: string; source_table: string; cible_table: string; libelle: string; default_mapping: Record<string, string> }[]; 
  suggestMapping: (source: string, cible: string) => { source_field: string; cible_field: string; confidence: string }[];
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [mapping, setMapping] = useState<{ source_field: string; cible_field: string; confidence: string }[]>([]);

  const handleTypeChange = (typeCode: string) => {
    setSelectedType(typeCode);
    const lt = linkTypes.find(t => t.code === typeCode);
    if (lt) {
      const suggestions = suggestMapping(lt.source_table, lt.cible_table);
      setMapping(suggestions);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Type de liaison</Label>
        <Select value={selectedType} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un type de lien" />
          </SelectTrigger>
          <SelectContent>
            {linkTypes.map((lt) => (
              <SelectItem key={lt.code} value={lt.code}>
                {lt.libelle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mapping.length > 0 && (
        <div className="space-y-2">
          <Label>Mapping proposé</Label>
          <div className="border rounded-lg divide-y">
            {mapping.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">{m.source_field}</code>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <code className="bg-muted px-2 py-1 rounded text-sm">{m.cible_field}</code>
                </div>
                <Badge variant={m.confidence === 'exact' ? 'default' : 'secondary'}>
                  {m.confidence === 'exact' ? 'Exact' : 'Similaire'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
        {mapping.length > 0 && (
          <Button>
            Appliquer ce mapping
          </Button>
        )}
      </div>
    </div>
  );
}
