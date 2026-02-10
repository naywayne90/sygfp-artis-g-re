// @ts-nocheck
/**
 * BudgetLineEditDialog - Dialogue de modification d'une ligne budgétaire avec diff view
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Save,
  ArrowRight,
  Loader2,
  AlertTriangle,
  FileEdit,
  Eye,
} from "lucide-react";
import { useBudgetLineVersions, ModificationData } from "@/hooks/useBudgetLineVersions";
import { BudgetLineWithRelations } from "@/hooks/useBudgetLines";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FundingSourceSelect } from "@/components/shared/FundingSourceSelect";

interface BudgetLineEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetLine: BudgetLineWithRelations | null;
  onSuccess?: () => void;
}

interface ChangePreview {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

export function BudgetLineEditDialog({
  open,
  onOpenChange,
  budgetLine,
  onSuccess,
}: BudgetLineEditDialogProps) {
  const { modifyBudgetLineAsync, isModifying } = useBudgetLineVersions(budgetLine?.id);

  // Form state
  const [formData, setFormData] = useState<ModificationData>({});
  const [reason, setReason] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changes, setChanges] = useState<ChangePreview[]>([]);

  // Fetch reference data
  const { data: directions } = useQuery({
    queryKey: ["directions-select"],
    queryFn: async () => {
      const { data } = await supabase.from("directions").select("id, code, label").order("code");
      return data || [];
    },
  });

  const { data: objectifs } = useQuery({
    queryKey: ["objectifs-select"],
    queryFn: async () => {
      const { data } = await supabase.from("objectifs_strategiques").select("id, code, libelle").order("code");
      return data || [];
    },
  });

  const { data: missions } = useQuery({
    queryKey: ["missions-select"],
    queryFn: async () => {
      const { data } = await supabase.from("missions").select("id, code, libelle").order("code");
      return data || [];
    },
  });

  // Initialize form when budget line changes
  useEffect(() => {
    if (budgetLine && open) {
      setFormData({
        label: budgetLine.label,
        dotation_initiale: budgetLine.dotation_initiale,
        source_financement: budgetLine.source_financement || undefined,
        direction_id: budgetLine.direction_id || undefined,
        os_id: budgetLine.os_id || undefined,
        mission_id: budgetLine.mission_id || undefined,
        commentaire: budgetLine.commentaire || undefined,
      });
      setReason("");
      setShowPreview(false);
    }
  }, [budgetLine, open]);

  // Calculate changes for preview
  const calculateChanges = (): ChangePreview[] => {
    if (!budgetLine) return [];

    const changeList: ChangePreview[] = [];

    // Label
    if (formData.label !== budgetLine.label) {
      changeList.push({
        field: "label",
        label: "Libellé",
        oldValue: budgetLine.label,
        newValue: formData.label,
      });
    }

    // Dotation
    if (formData.dotation_initiale !== budgetLine.dotation_initiale) {
      changeList.push({
        field: "dotation_initiale",
        label: "Dotation initiale",
        oldValue: formatCurrency(budgetLine.dotation_initiale),
        newValue: formatCurrency(formData.dotation_initiale || 0),
      });
    }

    // Source financement
    if (formData.source_financement !== (budgetLine.source_financement || undefined)) {
      changeList.push({
        field: "source_financement",
        label: "Source de financement",
        oldValue: budgetLine.source_financement || "-",
        newValue: formData.source_financement || "-",
      });
    }

    // Direction
    if (formData.direction_id !== (budgetLine.direction_id || undefined)) {
      const oldDir = directions?.find((d) => d.id === budgetLine.direction_id);
      const newDir = directions?.find((d) => d.id === formData.direction_id);
      changeList.push({
        field: "direction_id",
        label: "Direction",
        oldValue: oldDir ? `${oldDir.code} - ${oldDir.label}` : "-",
        newValue: newDir ? `${newDir.code} - ${newDir.label}` : "-",
      });
    }

    // OS
    if (formData.os_id !== (budgetLine.os_id || undefined)) {
      const oldOs = objectifs?.find((o) => o.id === budgetLine.os_id);
      const newOs = objectifs?.find((o) => o.id === formData.os_id);
      changeList.push({
        field: "os_id",
        label: "Objectif Stratégique",
        oldValue: oldOs ? `${oldOs.code} - ${oldOs.libelle}` : "-",
        newValue: newOs ? `${newOs.code} - ${newOs.libelle}` : "-",
      });
    }

    // Mission
    if (formData.mission_id !== (budgetLine.mission_id || undefined)) {
      const oldMission = missions?.find((m) => m.id === budgetLine.mission_id);
      const newMission = missions?.find((m) => m.id === formData.mission_id);
      changeList.push({
        field: "mission_id",
        label: "Mission",
        oldValue: oldMission ? `${oldMission.code} - ${oldMission.libelle}` : "-",
        newValue: newMission ? `${newMission.code} - ${newMission.libelle}` : "-",
      });
    }

    // Commentaire
    if (formData.commentaire !== (budgetLine.commentaire || undefined)) {
      changeList.push({
        field: "commentaire",
        label: "Commentaire",
        oldValue: budgetLine.commentaire || "-",
        newValue: formData.commentaire || "-",
      });
    }

    return changeList;
  };

  const handlePreview = () => {
    const calculatedChanges = calculateChanges();
    if (calculatedChanges.length === 0) {
      toast.error("Aucune modification détectée");
      return;
    }
    setChanges(calculatedChanges);
    setShowPreview(true);
  };

  const handleConfirmSave = async () => {
    if (!budgetLine) return;

    try {
      // Build only changed fields
      const changedData: ModificationData = {};
      changes.forEach((change) => {
        const key = change.field as keyof ModificationData;
        changedData[key] = formData[key] as any;
      });

      await modifyBudgetLineAsync({
        budgetLineId: budgetLine.id,
        changes: changedData,
        reason: reason || undefined,
      });

      setShowConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!budgetLine) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              Modifier la ligne budgétaire
            </DialogTitle>
            <DialogDescription>
              Code: <span className="font-mono font-bold">{budgetLine.code}</span>
              {budgetLine.current_version && (
                <Badge variant="outline" className="ml-2">
                  Version {budgetLine.current_version}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {!showPreview ? (
            // Edit Form
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Libellé *</Label>
                <Input
                  id="label"
                  value={formData.label || ""}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Libellé de la ligne"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dotation">Dotation initiale (FCFA) *</Label>
                <Input
                  id="dotation"
                  type="number"
                  value={formData.dotation_initiale || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, dotation_initiale: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Montant"
                />
                <p className="text-xs text-muted-foreground">
                  Valeur actuelle: {formatCurrency(budgetLine.dotation_initiale)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source de financement</Label>
                  <FundingSourceSelect
                    value={formData.source_financement}
                    onValueChange={(v) => setFormData({ ...formData, source_financement: v })}
                    useLegacyValue={true}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select
                    value={formData.direction_id || ""}
                    onValueChange={(v) => setFormData({ ...formData, direction_id: v || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune</SelectItem>
                      {directions?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.code} - {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Objectif Stratégique</Label>
                  <Select
                    value={formData.os_id || ""}
                    onValueChange={(v) => setFormData({ ...formData, os_id: v || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {objectifs?.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.code} - {o.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mission</Label>
                  <Select
                    value={formData.mission_id || ""}
                    onValueChange={(v) => setFormData({ ...formData, mission_id: v || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune</SelectItem>
                      {missions?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.code} - {m.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commentaire">Commentaire</Label>
                <Textarea
                  id="commentaire"
                  value={formData.commentaire || ""}
                  onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                  placeholder="Notes ou commentaires..."
                  rows={2}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="reason">Motif de la modification</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Expliquez la raison de cette modification (optionnel mais recommandé)"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Ce motif sera conservé dans l'historique des versions
                </p>
              </div>
            </div>
          ) : (
            // Preview / Diff View
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <Eye className="h-5 w-5" />
                Aperçu des modifications
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Champ</TableHead>
                    <TableHead>Avant</TableHead>
                    <TableHead className="w-10" />
                    <TableHead>Après</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changes.map((change) => (
                    <TableRow key={change.field}>
                      <TableCell className="font-medium">{change.label}</TableCell>
                      <TableCell className="text-red-600 bg-red-50 max-w-[200px] truncate">
                        {change.oldValue}
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="text-green-600 bg-green-50 max-w-[200px] truncate">
                        {change.newValue}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {reason && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm font-medium">Motif:</p>
                  <p className="text-sm text-muted-foreground">{reason}</p>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Une nouvelle version sera créée. Les anciennes valeurs seront conservées dans
                  l'historique.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {showPreview ? (
              <>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Retour
                </Button>
                <Button onClick={() => setShowConfirm(true)} disabled={isModifying}>
                  {isModifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Confirmer les modifications
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button onClick={handlePreview}>
                  <Eye className="mr-2 h-4 w-4" />
                  Prévisualiser
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer les modifications</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez modifier <strong>{changes.length}</strong> champ(s) sur la ligne{" "}
              <strong>{budgetLine.code}</strong>.
              <br />
              <br />
              Cette action créera une nouvelle version et conservera l'historique des modifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isModifying}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} disabled={isModifying}>
              {isModifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Confirmer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BudgetLineEditDialog;
