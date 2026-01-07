import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useParametresExercice, ParametreExercice } from "@/hooks/useParametresExercice";
import { useExercice } from "@/contexts/ExerciceContext";
import { ExerciceSubtitle } from "@/components/exercice/ExerciceSubtitle";
import { Settings, Copy, Pencil, Lock, Info, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParametresExercice() {
  const { exercice, isReadOnly } = useExercice();
  const { 
    parametres, 
    isLoading, 
    updateParametre, 
    copyFromPreviousExercice 
  } = useParametresExercice();

  const [editingParam, setEditingParam] = useState<ParametreExercice | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEdit = (param: ParametreExercice) => {
    if (isReadOnly) return;
    setEditingParam(param);
    setEditValue(
      param.type_parametre === "numeric" 
        ? String(param.valeur_numerique ?? "") 
        : param.valeur_texte ?? ""
    );
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingParam) return;

    const updateData: { id: string; valeur_numerique?: number | null; valeur_texte?: string | null } = {
      id: editingParam.id,
    };

    if (editingParam.type_parametre === "numeric") {
      updateData.valeur_numerique = parseFloat(editValue) || null;
    } else {
      updateData.valeur_texte = editValue || null;
    }

    updateParametre.mutate(updateData, {
      onSuccess: () => {
        setDialogOpen(false);
        setEditingParam(null);
      },
    });
  };

  const formatValue = (param: ParametreExercice): string => {
    if (param.type_parametre === "numeric" && param.valeur_numerique !== null) {
      // Format large numbers with separators
      if (param.valeur_numerique >= 1000) {
        return param.valeur_numerique.toLocaleString("fr-FR");
      }
      return String(param.valeur_numerique);
    }
    return param.valeur_texte ?? "-";
  };

  const getUnit = (code: string): string => {
    if (code.includes("seuil") && code.includes("budget")) return "%";
    if (code.includes("taux")) return "%";
    if (code.includes("delai")) return "jours";
    if (code.includes("tolerance")) return "%";
    if (code.includes("plafond") || code.includes("montant")) return "FCFA";
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <ExerciceSubtitle title="Paramètres par Exercice" />
          <p className="text-muted-foreground">
            Configuration des seuils, plafonds et délais pour l'exercice en cours
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => copyFromPreviousExercice.mutate()}
                  disabled={isReadOnly || copyFromPreviousExercice.isPending}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier depuis {(exercice || 2026) - 1}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Importer les paramètres de l'exercice précédent
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {isReadOnly && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-warning">
              <Lock className="h-5 w-5" />
              <span className="font-medium">
                Exercice clôturé – Modification impossible
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres système ({parametres.length})
          </CardTitle>
          <CardDescription>
            Ces paramètres contrôlent les seuils de validation, alertes et délais du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : parametres.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun paramètre défini pour cet exercice</p>
              <Button 
                className="mt-4" 
                onClick={() => copyFromPreviousExercice.mutate()}
                disabled={copyFromPreviousExercice.isPending}
              >
                Initialiser depuis l'exercice précédent
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paramètre</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parametres.map((param) => (
                  <TableRow key={param.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {param.code_parametre}
                        </Badge>
                        <span className="font-medium">{param.libelle}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[300px]">
                      {param.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-lg">
                        {formatValue(param)}
                      </span>
                      {getUnit(param.code_parametre) && (
                        <span className="text-muted-foreground text-sm ml-1">
                          {getUnit(param.code_parametre)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(param)}
                              disabled={isReadOnly}
                            >
                              {isReadOnly ? (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isReadOnly ? "Exercice en lecture seule" : "Modifier"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le paramètre</DialogTitle>
          </DialogHeader>
          {editingParam && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{editingParam.libelle}</Label>
                <p className="text-sm text-muted-foreground">
                  {editingParam.description}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">
                  Nouvelle valeur 
                  {getUnit(editingParam.code_parametre) && (
                    <span className="text-muted-foreground ml-1">
                      ({getUnit(editingParam.code_parametre)})
                    </span>
                  )}
                </Label>
                <Input
                  id="value"
                  type={editingParam.type_parametre === "numeric" ? "number" : "text"}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Entrez la nouvelle valeur"
                />
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Les modifications prennent effet immédiatement pour l'exercice {exercice}.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateParametre.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
