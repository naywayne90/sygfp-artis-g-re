import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calculator, CreditCard, FileText, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOrdonnancements, MODES_PAIEMENT, OrdonnancementFormData } from "@/hooks/useOrdonnancements";

const formSchema = z.object({
  liquidation_id: z.string().min(1, "Veuillez sélectionner une liquidation"),
  beneficiaire: z.string().min(1, "Le bénéficiaire est requis"),
  banque: z.string().optional(),
  rib: z.string().optional(),
  mode_paiement: z.string().min(1, "Le mode de paiement est requis"),
  montant: z.number().positive("Le montant doit être positif"),
  date_prevue_paiement: z.string().optional(),
  observation: z.string().optional(),
  objet: z.string().min(1, "L'objet est requis"),
});

interface OrdonnancementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedLiquidationId?: string;
  dossierId?: string;
}

export function OrdonnancementForm({
  open,
  onOpenChange,
  preselectedLiquidationId,
  dossierId,
}: OrdonnancementFormProps) {
  const {
    liquidationsValidees,
    createOrdonnancement,
    calculateOrdonnancementAvailability,
  } = useOrdonnancements();

  const [selectedLiquidation, setSelectedLiquidation] = useState<any>(null);
  const [availability, setAvailability] = useState({
    montantLiquide: 0,
    ordonnancementsAnterieurs: 0,
    restantAOrdonnancer: 0,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      liquidation_id: preselectedLiquidationId || "",
      beneficiaire: "",
      banque: "",
      rib: "",
      mode_paiement: "virement",
      montant: 0,
      date_prevue_paiement: "",
      observation: "",
      objet: "",
    },
  });

  const watchedLiquidationId = form.watch("liquidation_id");
  const watchedMontant = form.watch("montant");

  // Charger les données de la liquidation sélectionnée
  useEffect(() => {
    if (watchedLiquidationId) {
      const liquidation = liquidationsValidees.find(
        (l) => l.id === watchedLiquidationId
      );
      setSelectedLiquidation(liquidation);

      if (liquidation) {
        // Pré-remplir depuis la liquidation/engagement
        const engagement = liquidation.engagement;
        form.setValue("beneficiaire", engagement?.fournisseur || "");
        form.setValue("objet", engagement?.objet || "");

        // Calculer la disponibilité
        calculateOrdonnancementAvailability(watchedLiquidationId).then(
          setAvailability
        );
      }
    } else {
      setSelectedLiquidation(null);
      setAvailability({
        montantLiquide: 0,
        ordonnancementsAnterieurs: 0,
        restantAOrdonnancer: 0,
      });
    }
  }, [watchedLiquidationId, liquidationsValidees]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await createOrdonnancement.mutateAsync(data as OrdonnancementFormData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const formatMontant = (value: number) =>
    new Intl.NumberFormat("fr-FR").format(value);

  const montantActuel = watchedMontant || 0;
  const cumul = availability.ordonnancementsAnterieurs + montantActuel;
  const restant = availability.montantLiquide - cumul;
  const isOverBudget = restant < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Créer un ordonnancement
          </DialogTitle>
          {dossierId && (
            <p className="text-sm text-muted-foreground">
              Lié au dossier <code className="bg-muted px-1 rounded text-xs">{dossierId.slice(0, 8)}...</code>
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sélection de la liquidation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Liquidation source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="liquidation_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Liquidation validée *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une liquidation validée..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {liquidationsValidees.map((liq) => (
                            <SelectItem key={liq.id} value={liq.id}>
                              {liq.numero} - {liq.engagement?.objet?.substring(0, 50)}... ({formatMontant(liq.montant)} FCFA)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedLiquidation && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">N° Engagement:</span>
                        <span className="ml-2 font-medium">
                          {selectedLiquidation.engagement?.numero}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fournisseur:</span>
                        <span className="ml-2 font-medium">
                          {selectedLiquidation.engagement?.fournisseur}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Imputation:</span>
                        <span className="ml-2 font-medium">
                          {selectedLiquidation.engagement?.budget_line?.code} - {selectedLiquidation.engagement?.budget_line?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calcul du restant à ordonnancer */}
            {selectedLiquidation && (
              <Card className={isOverBudget ? "border-destructive" : ""}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Calcul du restant à ordonnancer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">(A) Montant liquidé</p>
                      <p className="font-bold text-primary">
                        {formatMontant(availability.montantLiquide)}
                      </p>
                    </div>
                    <div className="p-3 bg-secondary/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">(B) Ord. antérieurs</p>
                      <p className="font-bold">
                        {formatMontant(availability.ordonnancementsAnterieurs)}
                      </p>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">(C) Actuel</p>
                      <p className="font-bold text-warning">
                        {formatMontant(montantActuel)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">(D) Cumul (B+C)</p>
                      <p className="font-bold">{formatMontant(cumul)}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isOverBudget ? "bg-destructive/10" : "bg-success/10"}`}>
                      <p className="text-xs text-muted-foreground mb-1">(E) Restant</p>
                      <p className={`font-bold ${isOverBudget ? "text-destructive" : "text-success"}`}>
                        {formatMontant(restant)}
                      </p>
                    </div>
                  </div>

                  {isOverBudget && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Le montant dépasse le restant à ordonnancer. Maximum autorisé: {formatMontant(availability.restantAOrdonnancer)} FCFA
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informations bénéficiaire */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Informations du bénéficiaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="beneficiaire"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bénéficiaire *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nom du bénéficiaire" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="banque"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banque</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nom de la banque" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rib"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RIB / Numéro de compte</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CI00 0000 0000 0000 0000 0000 000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mode_paiement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode de paiement *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MODES_PAIEMENT.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Montant et dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Montant et échéance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="objet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objet *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Objet de l'ordonnancement" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="montant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant à ordonnancer (FCFA) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            max={availability.restantAOrdonnancer}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_prevue_paiement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date prévue de paiement</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observation</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Observations éventuelles..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createOrdonnancement.isPending || isOverBudget || !selectedLiquidation}
              >
                {createOrdonnancement.isPending ? "Création..." : "Créer l'ordonnancement"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
