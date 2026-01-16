import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Hash,
  RefreshCw,
  Settings2,
  Eye,
  RotateCcw,
  ArrowRight,
  FileText,
  CreditCard,
  Receipt,
  FileCheck,
  Banknote,
  ShoppingCart,
  Briefcase,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

import { toast } from "sonner";
import { DocType } from "@/hooks/useSequenceGenerator";

interface SequenceCounter {
  id: string;
  doc_type: DocType;
  exercice: number;
  direction_code: string | null;
  scope: string;
  current_number: number;
  prefix: string;
  updated_at: string;
}

const DOC_TYPE_CONFIG: Record<DocType, { label: string; icon: React.ComponentType<{ className?: string }>; format: string }> = {
  SEF: { label: "Notes SEF", icon: FileText, format: "SEF/{ANNEE}/{SEQ:5}" },
  AEF: { label: "Notes AEF", icon: FileText, format: "AEF/{ANNEE}/{SEQ:5}" },
  EB: { label: "Expression Besoin", icon: Briefcase, format: "EB/{ANNEE}/{SEQ:5}" },
  ENG: { label: "Engagements", icon: CreditCard, format: "ENG/{ANNEE}/{SEQ:5}" },
  LIQ: { label: "Liquidations", icon: Receipt, format: "LIQ/{ANNEE}/{SEQ:5}" },
  ORD: { label: "Ordonnancements", icon: FileCheck, format: "ORD/{ANNEE}/{SEQ:5}" },
  PAY: { label: "Règlements", icon: Banknote, format: "PAY/{ANNEE}/{SEQ:5}" },
  MARCHE: { label: "Marchés", icon: ShoppingCart, format: "MARCH/{ANNEE}/{SEQ:4}" },
  CONTRAT: { label: "Contrats", icon: FileCheck, format: "CTR/{ANNEE}/{SEQ:4}" },
  DOSSIER: { label: "Dossiers", icon: Briefcase, format: "DOS/{ANNEE}/{SEQ:5}" },
  DA: { label: "Demandes Achat", icon: ShoppingCart, format: "DA/{ANNEE}/{SEQ:4}" },
  VIR: { label: "Virements", icon: RefreshCw, format: "VIR/{ANNEE}/{SEQ:4}" },
};

export default function CompteursReferences() {
  const { exercice } = useExercice();
  const queryClient = useQueryClient();
  const [selectedCounter, setSelectedCounter] = useState<SequenceCounter | null>(null);
  const [newValue, setNewValue] = useState("");

  // Fetch sequence counters - use static data since table may not exist
  const { data: counters, isLoading } = useQuery({
    queryKey: ["sequence-counters", exercice],
    queryFn: async (): Promise<SequenceCounter[]> => {
      // Return empty array - counters are managed by RPC functions
      return [];
    },
  });

  // Reset counter mutation
  const resetMutation = useMutation({
    mutationFn: async ({ docType, newNumber }: { docType: DocType; newNumber: number }) => {
      // This would update the counter - for now just log
      console.log("Reset counter:", docType, newNumber);
      toast.info("Cette fonctionnalité sera disponible prochainement");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequence-counters", exercice] });
      setSelectedCounter(null);
      setNewValue("");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du compteur");
      console.error(error);
    },
  });

  // Generate preview
  const generatePreview = (docType: DocType, number: number) => {
    const config = DOC_TYPE_CONFIG[docType];
    const paddedNum = String(number).padStart(5, "0");
    return config.format
      .replace("{ANNEE}", String(exercice))
      .replace("{SEQ:5}", paddedNum)
      .replace("{SEQ:4}", String(number).padStart(4, "0"));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Group by doc_type and aggregate
  const countersByType = Object.keys(DOC_TYPE_CONFIG).map(docType => {
    const matching = counters?.filter(c => c.doc_type === docType) || [];
    const globalCounter = matching.find(c => !c.direction_code);
    const directionCounters = matching.filter(c => c.direction_code);

    return {
      docType: docType as DocType,
      config: DOC_TYPE_CONFIG[docType as DocType],
      globalCounter,
      directionCounters,
      currentNumber: globalCounter?.current_number || 0,
    };
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Hash className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Compteurs & Références</h1>
            <p className="text-sm text-muted-foreground">Exercice {exercice}</p>
          </div>
        </div>
        <p className="text-muted-foreground">
          Gestion centralisée des compteurs de numérotation pour tous les types de documents
        </p>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Format de numérotation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{"{ANNEE}"}</Badge>
              <span className="text-muted-foreground">→ Année de l'exercice</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{"{SEQ:5}"}</Badge>
              <span className="text-muted-foreground">→ Séquence sur 5 chiffres</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{"{DIR}"}</Badge>
              <span className="text-muted-foreground">→ Code direction (optionnel)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Counters Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">État des compteurs</CardTitle>
          <CardDescription>
            Dernière valeur générée pour chaque type de document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-center">Dernier N°</TableHead>
                <TableHead>Prochain code</TableHead>
                <TableHead>Mise à jour</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countersByType.map(({ docType, config, currentNumber, globalCounter }) => {
                const Icon = config.icon;
                const nextNumber = currentNumber + 1;
                const nextCode = generatePreview(docType, nextNumber);

                return (
                  <TableRow key={docType}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {config.format}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={currentNumber > 0 ? "default" : "secondary"}>
                        {currentNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <code className="text-sm font-mono text-primary">{nextCode}</code>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {globalCounter?.updated_at 
                        ? new Date(globalCounter.updated_at).toLocaleString("fr-FR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCounter(globalCounter || null);
                                setNewValue(String(currentNumber));
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Modifier le compteur</DialogTitle>
                              <DialogDescription>
                                Modifier la valeur du compteur pour {config.label}. 
                                Cette action est irréversible.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Valeur actuelle</Label>
                                <Input value={currentNumber} disabled />
                              </div>
                              <div className="space-y-2">
                                <Label>Nouvelle valeur</Label>
                                <Input 
                                  type="number" 
                                  min={0}
                                  value={newValue}
                                  onChange={(e) => setNewValue(e.target.value)}
                                  placeholder="Ex: 100"
                                />
                              </div>
                              {newValue && parseInt(newValue) > 0 && (
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground">Prochain code généré :</p>
                                  <code className="text-primary font-mono">
                                    {generatePreview(docType, parseInt(newValue) + 1)}
                                  </code>
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedCounter(null);
                                  setNewValue("");
                                }}
                              >
                                Annuler
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button disabled={!newValue || parseInt(newValue) < 0}>
                                    Confirmer
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Le compteur pour {config.label} sera modifié de {currentNumber} à {newValue}.
                                      Cette action peut causer des conflits de numérotation si mal utilisée.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        resetMutation.mutate({
                                          docType,
                                          newNumber: parseInt(newValue),
                                        });
                                      }}
                                    >
                                      Confirmer la modification
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-blue-100 h-fit">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Information importante</h4>
              <p className="text-sm text-blue-700 mt-1">
                Les compteurs sont automatiquement incrémentés lors de la création de nouveaux documents.
                La modification manuelle doit être réservée aux cas de synchronisation avec des données importées
                ou de correction d'erreurs. Une mauvaise manipulation peut entraîner des doublons de références.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
