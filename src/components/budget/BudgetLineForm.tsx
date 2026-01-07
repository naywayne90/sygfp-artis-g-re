import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { BudgetLineWithRelations } from "@/hooks/useBudgetLines";
import { SYSCOTypeahead } from "./SYSCOTypeahead";

interface BudgetLineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<BudgetLineWithRelations>) => void;
  initialData?: BudgetLineWithRelations | null;
  isLoading?: boolean;
}

const SOURCE_FINANCEMENT_OPTIONS = [
  { value: "budget_etat", label: "Budget État" },
  { value: "ressources_propres", label: "Ressources Propres" },
  { value: "partenaires", label: "Partenaires Techniques et Financiers" },
  { value: "emprunts", label: "Emprunts" },
  { value: "dons", label: "Dons et Subventions" },
];

const LEVEL_OPTIONS = [
  { value: "chapitre", label: "Chapitre" },
  { value: "article", label: "Article" },
  { value: "paragraphe", label: "Paragraphe" },
  { value: "ligne", label: "Ligne" },
];

export function BudgetLineForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: BudgetLineFormProps) {
  const [formData, setFormData] = useState<Partial<BudgetLineWithRelations>>({
    code: "",
    label: "",
    level: "ligne",
    dotation_initiale: 0,
    source_financement: "budget_etat",
    commentaire: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        code: "",
        label: "",
        level: "ligne",
        dotation_initiale: 0,
        source_financement: "budget_etat",
        commentaire: "",
      });
    }
  }, [initialData, open]);

  // Fetch reference data
  const { data: directions } = useQuery({
    queryKey: ["directions-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("directions")
        .select("id, code, label")
        .eq("est_active", true)
        .order("label");
      return data || [];
    },
  });

  const { data: objectifs } = useQuery({
    queryKey: ["objectifs-strategiques-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("objectifs_strategiques")
        .select("id, code, libelle")
        .eq("est_actif", true)
        .order("code");
      return data || [];
    },
  });

  const { data: missions } = useQuery({
    queryKey: ["missions-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("missions")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      return data || [];
    },
  });

  const { data: actions } = useQuery({
    queryKey: ["actions-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("actions")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      return data || [];
    },
  });

  const { data: activites } = useQuery({
    queryKey: ["activites-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activites")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      return data || [];
    },
  });

  const { data: nomenclatureNBE } = useQuery({
    queryKey: ["nomenclature-nbe-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nomenclature_nbe")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      return data || [];
    },
  });

  const { data: planComptable } = useQuery({
    queryKey: ["plan-comptable-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("plan_comptable_sysco")
        .select("id, code, libelle")
        .eq("est_active", true)
        .order("code");
      return data || [];
    },
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.code?.trim()) {
      errors.push("Le code est obligatoire");
    }
    if (!formData.label?.trim()) {
      errors.push("Le libellé est obligatoire");
    }
    if (!formData.level) {
      errors.push("Le niveau est obligatoire");
    }
    if (formData.dotation_initiale === undefined || formData.dotation_initiale === null) {
      errors.push("La dotation initiale est obligatoire");
    } else if (formData.dotation_initiale < 0) {
      errors.push("La dotation initiale doit être supérieure ou égale à 0");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Modifier la ligne budgétaire" : "Nouvelle ligne budgétaire"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code || ""}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: 6110001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Niveau *</Label>
              <Select
                value={formData.level || "ligne"}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Libellé *</Label>
            <Input
              id="label"
              value={formData.label || ""}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Libellé de la ligne budgétaire"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dotation_initiale">Dotation initiale (FCFA) *</Label>
              <Input
                id="dotation_initiale"
                type="number"
                min="0"
                value={formData.dotation_initiale || 0}
                onChange={(e) =>
                  setFormData({ ...formData, dotation_initiale: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_financement">Source de financement</Label>
              <Select
                value={formData.source_financement || "budget_etat"}
                onValueChange={(value) => setFormData({ ...formData, source_financement: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_FINANCEMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="direction_id">Direction</Label>
              <Select
                value={formData.direction_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, direction_id: value === "none" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Aucune --</SelectItem>
                  {directions?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.code} - {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="os_id">Objectif Stratégique</Label>
              <Select
                value={formData.os_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, os_id: value === "none" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Aucun --</SelectItem>
                  {objectifs?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.code} - {o.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mission_id">Mission</Label>
              <Select
                value={formData.mission_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, mission_id: value === "none" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Aucune --</SelectItem>
                  {missions?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} - {m.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action_id">Action</Label>
              <Select
                value={formData.action_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, action_id: value === "none" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Aucune --</SelectItem>
                  {actions?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} - {a.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activite_id">Activité</Label>
              <Select
                value={formData.activite_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, activite_id: value === "none" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Aucune --</SelectItem>
                  {activites?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} - {a.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nbe_id">Nomenclature NBE</Label>
              <Select
                value={formData.nbe_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, nbe_id: value === "none" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Aucune --</SelectItem>
                  {nomenclatureNBE?.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.code} - {n.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SYSCOTypeahead
            value={formData.sysco_id || null}
            onChange={(value) => setFormData({ ...formData, sysco_id: value })}
          />

          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaires</Label>
            <Textarea
              id="commentaire"
              value={formData.commentaire || ""}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              placeholder="Observations ou notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : initialData ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}