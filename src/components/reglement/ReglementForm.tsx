import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Upload, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  useReglements,
  MODES_PAIEMENT,
  COMPTES_BANCAIRES_ARTI,
  DOCUMENTS_REGLEMENT,
  ReglementFormData,
  CompteBancaire
} from "@/hooks/useReglements";
import { useImputationValidation } from "@/hooks/useImputationValidation";
import { ImputationWarning } from "@/components/budget/ImputationWarning";
import { splitImputation } from "@/lib/budget/imputation-utils";

const formSchema = z.object({
  ordonnancement_id: z.string().min(1, "Sélectionnez un ordonnancement"),
  date_paiement: z.date({ required_error: "Date de paiement requise" }),
  mode_paiement: z.string().min(1, "Mode de paiement requis"),
  reference_paiement: z.string().optional(),
  compte_bancaire_arti: z.string().min(1, "Compte bancaire requis"),
  montant: z.number().min(1, "Montant doit être supérieur à 0"),
  observation: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ReglementFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  dossierId?: string;
  preselectedOrdonnancementId?: string | null;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

export function ReglementForm({ onSuccess, onCancel, dossierId, preselectedOrdonnancementId }: ReglementFormProps) {
  const {
    ordonnancementsValides,
    comptesBancaires,
    createReglement,
    calculateReglementAvailability
  } = useReglements();
  const { validateImputation, logImputationWarning } = useImputationValidation();

  const [selectedOrdonnancement, setSelectedOrdonnancement] = useState<any>(null);
  const [availability, setAvailability] = useState<{
    montantOrdonnance: number;
    reglementsAnterieurs: number;
    restantAPayer: number;
  } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [preuvePaiementUploaded, setPreuvePaiementUploaded] = useState(false);
  const [imputationJustification, setImputationJustification] = useState("");

  // Utiliser les vrais comptes bancaires ou le fallback
  const comptesDisponibles: Array<{ value: string; label: string; banque: string; solde?: number | null }> = 
    comptesBancaires.length > 0 
      ? comptesBancaires.map(c => ({
          value: c.id,
          label: `${c.libelle}`,
          banque: c.banque || "",
          solde: c.solde_actuel,
        }))
      : COMPTES_BANCAIRES_ARTI.map(c => ({ ...c, solde: undefined }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ordonnancement_id: "",
      date_paiement: new Date(),
      mode_paiement: "",
      reference_paiement: "",
      compte_bancaire_arti: "",
      montant: 0,
      observation: "",
    },
  });

  const watchedOrdonnancementId = form.watch("ordonnancement_id");
  const watchedMontant = form.watch("montant");
  const watchedCompte = form.watch("compte_bancaire_arti");

  // Valider l'imputation de l'ordonnancement sélectionné (via liquidation → engagement)
  const imputationValidation = useMemo(() => {
    if (!selectedOrdonnancement) return null;
    const budgetLineCode =
      selectedOrdonnancement.liquidation?.engagement?.budget_line?.code;
    return validateImputation(budgetLineCode, { allowUnknownWithJustification: true });
  }, [selectedOrdonnancement, validateImputation]);

  // Vérifier si la justification est requise et suffisante
  const needsJustification = imputationValidation && !imputationValidation.isFoundInBudget;
  const justificationValid = !needsJustification || imputationJustification.length >= 10;

  // Pré-sélectionner l'ordonnancement si fourni
  useEffect(() => {
    if (preselectedOrdonnancementId && ordonnancementsValides.length > 0) {
      const ord = ordonnancementsValides.find(o => o.id === preselectedOrdonnancementId);
      if (ord) {
        form.setValue("ordonnancement_id", preselectedOrdonnancementId);
      }
    }
  }, [preselectedOrdonnancementId, ordonnancementsValides, form]);

  // Charger l'ordonnancement sélectionné et calculer la disponibilité
  useEffect(() => {
    if (watchedOrdonnancementId) {
      const ord = ordonnancementsValides.find(o => o.id === watchedOrdonnancementId);
      setSelectedOrdonnancement(ord);

      calculateReglementAvailability(watchedOrdonnancementId).then(setAvailability);
    } else {
      setSelectedOrdonnancement(null);
      setAvailability(null);
    }
    // Reset justification quand l'ordonnancement change
    setImputationJustification("");
  }, [watchedOrdonnancementId, ordonnancementsValides]);

  // Trouver le compte sélectionné
  const selectedCompte = comptesDisponibles.find(c => c.value === watchedCompte);

  // Gérer l'upload de fichier
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      // Vérifier si une preuve de paiement est uploadée
      setPreuvePaiementUploaded(true);
    }
  };

  const onSubmit = async (values: FormValues) => {
    // Vérifier la justification si imputation non trouvée
    if (needsJustification && !justificationValid) {
      return; // Ne pas soumettre sans justification
    }

    // Vérifier que la preuve de paiement est fournie (recommandée)
    if (!preuvePaiementUploaded) {
      const confirm = window.confirm(
        "Aucune preuve de paiement n'a été jointe. Voulez-vous continuer ?"
      );
      if (!confirm) return;
    }

    const compte = comptesDisponibles.find(c => c.value === values.compte_bancaire_arti);

    const data: ReglementFormData = {
      ordonnancement_id: values.ordonnancement_id,
      date_paiement: format(values.date_paiement, "yyyy-MM-dd"),
      mode_paiement: values.mode_paiement,
      reference_paiement: values.reference_paiement,
      compte_id: comptesBancaires.length > 0 ? values.compte_bancaire_arti : undefined,
      compte_bancaire_arti: values.compte_bancaire_arti,
      banque_arti: compte?.banque || "",
      montant: values.montant,
      observation: values.observation,
    };

    const result = await createReglement.mutateAsync(data);

    // Logger le warning si imputation non trouvée (avec justification)
    if (needsJustification && result?.id) {
      const budgetLineCode =
        selectedOrdonnancement?.liquidation?.engagement?.budget_line?.code || "";
      await logImputationWarning(
        "reglement",
        result.id,
        budgetLineCode,
        imputationJustification
      );
    }

    setImputationJustification("");
    onSuccess?.();
  };

  const isFormValid = form.formState.isValid &&
    availability &&
    watchedMontant <= availability.restantAPayer &&
    justificationValid;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {dossierId && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
            Lié au dossier <code className="bg-muted px-1 rounded text-xs">{dossierId.slice(0, 8)}...</code>
          </div>
        )}
        
        {/* Sélection de l'ordonnancement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ordonnancement à régler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="ordonnancement_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordonnancement validé *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un ordonnancement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ordonnancementsValides.map((ord) => (
                        <SelectItem key={ord.id} value={ord.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{ord.numero}</span>
                            <span className="text-xs text-muted-foreground">
                              {ord.beneficiaire} - {formatMontant(ord.montant)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedOrdonnancement && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bénéficiaire:</span>
                    <p className="font-medium">{selectedOrdonnancement.beneficiaire}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Objet:</span>
                    <p className="font-medium">{selectedOrdonnancement.objet}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Banque bénéficiaire:</span>
                    <p className="font-medium">{selectedOrdonnancement.banque || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RIB:</span>
                    <p className="font-medium">{selectedOrdonnancement.rib || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Imputation:</span>
                    <p className="font-mono">
                      {(() => {
                        const { imputation_10, imputation_suite } = splitImputation(
                          selectedOrdonnancement.liquidation?.engagement?.budget_line?.code
                        );
                        return (
                          <>
                            <span className="font-semibold">{imputation_10}</span>
                            {imputation_suite !== "-" && (
                              <span className="text-muted-foreground">{imputation_suite}</span>
                            )}
                          </>
                        );
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning si imputation non trouvée dans le budget */}
            {selectedOrdonnancement && imputationValidation && (
              <ImputationWarning
                validation={imputationValidation}
                imputation={selectedOrdonnancement.liquidation?.engagement?.budget_line?.code}
                onJustificationChange={setImputationJustification}
                justification={imputationJustification}
                showJustificationField={true}
                minJustificationLength={10}
                className="mt-4"
              />
            )}
          </CardContent>
        </Card>

        {/* Calcul du restant à payer */}
        {availability && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Calcul du restant à payer
                {availability.restantAPayer > 0 ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Disponible
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    Soldé
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">(A) Montant ordonnancé</p>
                  <p className="text-lg font-bold">{formatMontant(availability.montantOrdonnance)}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">(B) Règlements antérieurs</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatMontant(availability.reglementsAnterieurs)}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">(C) Ce règlement</p>
                  <p className="text-lg font-bold text-primary">
                    {formatMontant(watchedMontant)}
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  availability.restantAPayer - watchedMontant >= 0 
                    ? "bg-success/10" 
                    : "bg-destructive/10"
                )}>
                  <p className="text-xs text-muted-foreground">(D) Restant après</p>
                  <p className={cn(
                    "text-lg font-bold",
                    availability.restantAPayer - watchedMontant >= 0 
                      ? "text-success" 
                      : "text-destructive"
                  )}>
                    {formatMontant(availability.restantAPayer - watchedMontant)}
                  </p>
                </div>
              </div>

              {watchedMontant > availability.restantAPayer && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Montant invalide</AlertTitle>
                  <AlertDescription>
                    Le montant du règlement ne peut pas dépasser le restant à payer 
                    ({formatMontant(availability.restantAPayer)})
                  </AlertDescription>
                </Alert>
              )}

              {availability.restantAPayer - watchedMontant === 0 && watchedMontant > 0 && (
                <Alert className="mt-4 border-success/50 bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertTitle className="text-success">Règlement complet</AlertTitle>
                  <AlertDescription>
                    Ce règlement soldera complètement l'ordonnancement. Le dossier sera marqué comme "Soldé".
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Détails du règlement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails du règlement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_paiement"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de paiement *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd MMMM yyyy", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le mode" />
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

              <FormField
                control={form.control}
                name="reference_paiement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence (n° chèque/virement)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: VIR-2024-00456" {...field} />
                    </FormControl>
                    <FormDescription>
                      Numéro de chèque ou référence de virement
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="compte_bancaire_arti"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compte bancaire ARTI *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le compte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {comptesDisponibles.map((compte) => (
                          <SelectItem key={compte.value} value={compte.value}>
                            <div className="flex flex-col">
                              <span>{compte.label}</span>
                              {compte.solde !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  Solde: {formatMontant(compte.solde || 0)}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCompte && selectedCompte.banque && (
                      <FormDescription>
                        Banque: {selectedCompte.banque}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="montant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant payé (FCFA) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  {availability && (
                    <FormDescription>
                      Maximum: {formatMontant(availability.restantAPayer)}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observations ou remarques..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Upload des pièces jointes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Pièce jointe (preuve de paiement)
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                Recommandée
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Il est fortement recommandé de joindre une preuve de paiement 
                (bordereau de virement, copie de chèque, avis de crédit).
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Cliquez pour téléverser des fichiers
                </span>
                <span className="text-xs text-muted-foreground">
                  PDF, JPG, PNG acceptés
                </span>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Fichiers sélectionnés:</p>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                        if (uploadedFiles.length === 1) {
                          setPreuvePaiementUploaded(false);
                        }
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={!isFormValid || createReglement.isPending}
          >
            {createReglement.isPending ? "Enregistrement..." : "Enregistrer le règlement"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
