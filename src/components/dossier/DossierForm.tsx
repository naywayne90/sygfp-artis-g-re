import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DossierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<any>;
  initialData?: any;
}

const TYPES_DOSSIER = [
  { value: "AEF", label: "AEF", description: "Achat / Engagement / Facture - Pour les achats de biens et fournitures" },
  { value: "SEF", label: "SEF", description: "Service / Engagement / Facture - Pour les prestations de services" },
  { value: "MARCHE", label: "Marché", description: "Marché public - Pour les procédures de passation de marchés" },
];

const STEPS = [
  { id: 1, title: "Type de dossier", description: "Choisissez le type" },
  { id: 2, title: "Informations", description: "Détails du dossier" },
  { id: 3, title: "Confirmation", description: "Vérifiez et validez" },
];

export function DossierForm({ open, onOpenChange, onSubmit, initialData }: DossierFormProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [directions, setDirections] = useState<{ id: string; label: string; sigle: string | null }[]>([]);
  const [beneficiaires, setBeneficiaires] = useState<{ id: string; raison_sociale: string | null }[]>([]);
  const [formData, setFormData] = useState({
    type_dossier: "AEF",
    objet: "",
    direction_id: "",
    beneficiaire_id: "",
    montant_estime: 0,
  });

  useEffect(() => {
    if (open) {
      fetchData();
      if (initialData) {
        setFormData({
          type_dossier: initialData.type_dossier || "AEF",
          objet: initialData.objet || "",
          direction_id: initialData.direction_id || "",
          beneficiaire_id: initialData.beneficiaire_id || "",
          montant_estime: initialData.montant_estime || 0,
        });
        setCurrentStep(2); // Go directly to edit form
      } else {
        setFormData({ type_dossier: "AEF", objet: "", direction_id: "", beneficiaire_id: "", montant_estime: 0 });
        setCurrentStep(1);
      }
    }
  }, [open, initialData]);

  const fetchData = async () => {
    const [{ data: dirs }, { data: benefs }] = await Promise.all([
      supabase.from("directions").select("id, label, sigle").eq("est_active", true).order("label"),
      supabase.from("prestataires").select("id, raison_sociale").eq("est_actif", true).order("raison_sociale"),
    ]);
    setDirections(dirs || []);
    setBeneficiaires(benefs || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onSubmit(formData);
      if (result) {
        onOpenChange(false);
        setCurrentStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return !!formData.type_dossier;
    if (currentStep === 2) return !!formData.objet && !!formData.direction_id;
    return true;
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(montant);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Modifier le dossier" : "Nouveau dossier"}
          </DialogTitle>
          <DialogDescription>
            {initialData ? "Modifiez les informations du dossier" : "Assistant de création de dossier"}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper (only for new dossier) */}
        {!initialData && (
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      currentStep > step.id
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground hidden sm:block">
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-12 sm:w-24 h-0.5 mx-2",
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Type selection */}
          {currentStep === 1 && !initialData && (
            <div className="space-y-4">
              <Label className="text-base">Quel type de dossier souhaitez-vous créer ?</Label>
              <RadioGroup
                value={formData.type_dossier}
                onValueChange={(value) => setFormData({ ...formData, type_dossier: value })}
                className="space-y-3"
              >
                {TYPES_DOSSIER.map((type) => (
                  <div
                    key={type.value}
                    className={cn(
                      "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                      formData.type_dossier === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setFormData({ ...formData, type_dossier: type.value })}
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={type.value} className="text-base font-medium cursor-pointer">
                        {type.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Details */}
          {(currentStep === 2 || initialData) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="objet">Objet du dossier *</Label>
                <Textarea
                  id="objet"
                  value={formData.objet}
                  onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                  placeholder="Décrivez l'objet de la demande..."
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="direction">Direction *</Label>
                  <Select
                    value={formData.direction_id}
                    onValueChange={(value) => setFormData({ ...formData, direction_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {directions.map((dir) => (
                        <SelectItem key={dir.id} value={dir.id}>
                          {dir.sigle ? `${dir.sigle} - ${dir.label}` : dir.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beneficiaire">Bénéficiaire</Label>
                  <Select
                    value={formData.beneficiaire_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, beneficiaire_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non spécifié</SelectItem>
                      {beneficiaires.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.raison_sociale || "Sans nom"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="montant">Montant estimé (FCFA)</Label>
                <Input
                  id="montant"
                  type="number"
                  value={formData.montant_estime}
                  onChange={(e) => setFormData({ ...formData, montant_estime: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && !initialData && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type de dossier</p>
                    <p className="font-medium">{formData.type_dossier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Direction</p>
                    <p className="font-medium">
                      {directions.find((d) => d.id === formData.direction_id)?.sigle || 
                       directions.find((d) => d.id === formData.direction_id)?.label || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Objet</p>
                  <p className="font-medium">{formData.objet}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bénéficiaire</p>
                    <p className="font-medium">
                    {beneficiaires.find((b) => b.id === formData.beneficiaire_id)?.raison_sociale || "Non spécifié"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant estimé</p>
                    <p className="font-medium">{formatMontant(formData.montant_estime)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-6 mt-6 border-t">
            {!initialData && currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
            )}

            {!initialData && currentStep < 3 ? (
              <Button 
                type="button" 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
              >
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={loading || !canProceed()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Modifier" : "Créer le dossier"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
