import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, Plus, Upload, Copy, FileSpreadsheet, CheckCircle2, 
  AlertTriangle, Loader2, ArrowRight, Lock, Unlock
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ExerciceInitWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type InitMethod = "import" | "copy" | "empty";
type Step = "select" | "method" | "config" | "summary";

interface BudgetSummary {
  lignes_count: number;
  dotation_totale: number;
  lignes_par_niveau: Record<string, number>;
}

export function ExerciceInitWizard({ open, onOpenChange }: ExerciceInitWizardProps) {
  const queryClient = useQueryClient();
  const { exercice: currentExercice, setExercice } = useExercice();
  
  const [step, setStep] = useState<Step>("select");
  const [selectedExercice, setSelectedExercice] = useState<number | null>(null);
  const [createNewYear, setCreateNewYear] = useState(new Date().getFullYear() + 1);
  const [initMethod, setInitMethod] = useState<InitMethod>("import");
  const [copyDotations, setCopyDotations] = useState(false);
  const [parsedBudgetData, setParsedBudgetData] = useState<unknown[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Fetch available exercices
  const { data: exercices = [] } = useQuery({
    queryKey: ["exercices-wizard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercices_budgetaires")
        .select("*")
        .order("annee", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Get source exercice for copy
  const sourceExercice = exercices.find(e => e.annee === (selectedExercice ? selectedExercice - 1 : currentExercice));

  const resetWizard = () => {
    setStep("select");
    setSelectedExercice(null);
    setInitMethod("import");
    setCopyDotations(false);
    setParsedBudgetData([]);
    setBudgetSummary(null);
    setIsCreatingNew(false);
  };

  // Create new exercice
  const createExerciceMutation = useMutation({
    mutationFn: async (annee: number) => {
      const { data, error } = await supabase
        .from("exercices_budgetaires")
        .insert({
          annee,
          code_exercice: `EX${annee}`,
          libelle: `Exercice budgétaire ${annee}`,
          statut: "ouvert",
          est_actif: true,
          date_ouverture: `${annee}-01-01`,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["exercices-wizard"] });
      queryClient.invalidateQueries({ queryKey: ["exercices-budgetaires"] });
      setSelectedExercice(data.annee);
      setIsCreatingNew(false);
      setStep("method");
      toast.success(`Exercice ${data.annee} créé`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Copy budget structure
  const copyBudgetMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExercice || !sourceExercice) throw new Error("Exercice non sélectionné");
      
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc("copy_budget_structure", {
        p_source_exercice: sourceExercice.annee,
        p_target_exercice: selectedExercice,
        p_user_id: userData.user?.id,
        p_copy_dotations: copyDotations,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await loadBudgetSummary();
      toast.success("Structure budgétaire copiée");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Validate budget
  const validateBudgetMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExercice) throw new Error("Exercice non sélectionné");
      
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc("validate_budget", {
        p_exercice: selectedExercice,
        p_user_id: userData.user?.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercices"] });
      queryClient.invalidateQueries({ queryKey: ["budget-lines"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Budget validé et verrouillé");
      setExercice(selectedExercice!, true);
      onOpenChange(false);
      resetWizard();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Load budget summary
  const loadBudgetSummary = async () => {
    if (!selectedExercice) return;
    const { data } = await supabase.rpc("get_exercice_budget_summary", {
      p_exercice: selectedExercice,
    });
    if (data) {
      setBudgetSummary(data as unknown as BudgetSummary);
    }
  };

  // Parse Excel file
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        
        setParsedBudgetData(jsonData);
        
        // Calculate summary
        let totalDotation = 0;
        const niveaux: Record<string, number> = {};
        
        jsonData.forEach((row: any) => {
          const dotation = parseFloat(String(row.dotation_initiale || row.dotation || row.montant || 0).replace(/\s/g, '').replace(',', '.')) || 0;
          totalDotation += dotation;
          
          const niveau = row.level || row.niveau || "ligne";
          niveaux[niveau] = (niveaux[niveau] || 0) + 1;
        });
        
        setBudgetSummary({
          lignes_count: jsonData.length,
          dotation_totale: totalDotation,
          lignes_par_niveau: niveaux,
        });
        
        setStep("summary");
      } catch (err) {
        toast.error("Erreur lors de la lecture du fichier");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Import budget from parsed data
  const importBudgetMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExercice || parsedBudgetData.length === 0) {
        throw new Error("Données manquantes");
      }
      
      // Transform and insert budget lines
      const budgetLines = parsedBudgetData.map((row: any, index) => ({
        code: row.code || `BL-${selectedExercice}-${String(index + 1).padStart(4, '0')}`,
        label: row.label || row.libelle || row.designation || "Ligne budgétaire",
        level: row.level || row.niveau || "ligne",
        exercice: selectedExercice,
        dotation_initiale: parseFloat(String(row.dotation_initiale || row.dotation || row.montant || 0).replace(/\s/g, '').replace(',', '.')) || 0,
        source_financement: row.source_financement || row.source || null,
        commentaire: row.commentaire || row.observation || null,
        statut: "brouillon",
        is_active: true,
      }));
      
      const { error } = await supabase
        .from("budget_lines")
        .insert(budgetLines);
      
      if (error) throw error;
      
      // Update exercice stats
      const totalDotation = budgetLines.reduce((sum, bl) => sum + bl.dotation_initiale, 0);
      await supabase
        .from("exercices_budgetaires")
        .update({
          budget_lignes_count: budgetLines.length,
          budget_total: totalDotation,
        })
        .eq("annee", selectedExercice);
      
      return { count: budgetLines.length, total: totalDotation };
    },
    onSuccess: async (result) => {
      await loadBudgetSummary();
      toast.success(`${result.count} lignes importées`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleNext = async () => {
    switch (step) {
      case "select":
        if (isCreatingNew) {
          createExerciceMutation.mutate(createNewYear);
        } else if (selectedExercice) {
          setStep("method");
        }
        break;
      case "method":
        if (initMethod === "empty") {
          setStep("summary");
          await loadBudgetSummary();
        } else if (initMethod === "copy") {
          setStep("config");
        } else {
          setStep("config");
        }
        break;
      case "config":
        if (initMethod === "copy") {
          await copyBudgetMutation.mutateAsync();
          setStep("summary");
        }
        break;
      case "summary":
        if (parsedBudgetData.length > 0 && initMethod === "import") {
          await importBudgetMutation.mutateAsync();
        }
        break;
    }
  };

  const handleSelectExercice = (annee: number) => {
    setSelectedExercice(annee);
    setIsCreatingNew(false);
  };

  const handleSwitchExercice = () => {
    if (selectedExercice) {
      setExercice(selectedExercice, true);
      onOpenChange(false);
      resetWizard();
    }
  };

  const formatMontant = (montant: number) => 
    new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetWizard(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {step === "select" && "Changer d'exercice"}
            {step === "method" && "Méthode d'initialisation"}
            {step === "config" && "Configuration"}
            {step === "summary" && "Récapitulatif"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Sélectionnez ou créez un exercice budgétaire"}
            {step === "method" && `Exercice ${selectedExercice} - Comment charger la structure ?`}
            {step === "config" && "Configurez les options d'initialisation"}
            {step === "summary" && "Vérifiez avant de valider le budget"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-2 px-1">
          {["select", "method", "config", "summary"].map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${
              ["select", "method", "config", "summary"].indexOf(step) >= i 
                ? "bg-primary" 
                : "bg-muted"
            }`} />
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4">
          {/* Step: Select Exercice */}
          {step === "select" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                {exercices.map((ex) => (
                  <Card 
                    key={ex.id}
                    className={`cursor-pointer transition-all ${
                      selectedExercice === ex.annee && !isCreatingNew
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleSelectExercice(ex.annee)}
                  >
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          ex.statut === "en_cours" ? "bg-green-100 text-green-700" :
                          ex.statut === "ouvert" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {ex.budget_valide ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-semibold">Exercice {ex.annee}</p>
                          <p className="text-sm text-muted-foreground">
                            {ex.budget_lignes_count || 0} lignes • {formatMontant(ex.budget_total || 0)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={ex.statut === "en_cours" ? "default" : "outline"}>
                        {ex.statut === "en_cours" ? "En cours" :
                         ex.statut === "ouvert" ? "Ouvert" :
                         ex.statut === "cloture" ? "Clôturé" : ex.statut}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="border-t pt-4">
                <Card 
                  className={`cursor-pointer transition-all ${
                    isCreatingNew ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                  }`}
                  onClick={() => setIsCreatingNew(true)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Créer un nouvel exercice</p>
                        {isCreatingNew && (
                          <div className="mt-2 flex items-center gap-2">
                            <Label>Année:</Label>
                            <Input
                              type="number"
                              value={createNewYear}
                              onChange={(e) => setCreateNewYear(parseInt(e.target.value))}
                              className="w-24"
                              min={2020}
                              max={2100}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step: Method */}
          {step === "method" && (
            <div className="space-y-4 py-4">
              <RadioGroup value={initMethod} onValueChange={(v) => setInitMethod(v as InitMethod)}>
                <Card className={`cursor-pointer ${initMethod === "import" ? "border-primary ring-2 ring-primary/20" : ""}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <RadioGroupItem value="import" id="import" className="mt-1" />
                    <Label htmlFor="import" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">Importer un fichier Excel</span>
                        <Badge variant="outline" className="ml-2">Recommandé</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Chargez votre structure budgétaire depuis un fichier Excel préparé.
                      </p>
                    </Label>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer ${initMethod === "copy" ? "border-primary ring-2 ring-primary/20" : ""}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <RadioGroupItem value="copy" id="copy" className="mt-1" />
                    <Label htmlFor="copy" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Copy className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">Copier la structure de N-1</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {sourceExercice 
                          ? `Copier depuis l'exercice ${sourceExercice.annee} (${sourceExercice.budget_lignes_count || 0} lignes)`
                          : "Aucun exercice précédent disponible"}
                      </p>
                    </Label>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer ${initMethod === "empty" ? "border-primary ring-2 ring-primary/20" : ""}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <RadioGroupItem value="empty" id="empty" className="mt-1" />
                    <Label htmlFor="empty" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold">Commencer vide</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Créer les lignes budgétaires manuellement ou importer plus tard.
                      </p>
                    </Label>
                  </CardContent>
                </Card>
              </RadioGroup>
            </div>
          )}

          {/* Step: Config */}
          {step === "config" && (
            <div className="space-y-4 py-4">
              {initMethod === "import" && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <Label htmlFor="budget-file" className="cursor-pointer">
                    <span className="text-primary font-medium">Cliquez pour sélectionner</span>
                    <span className="text-muted-foreground"> un fichier Excel</span>
                  </Label>
                  <Input
                    id="budget-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Colonnes attendues: code, label/libelle, dotation_initiale, level/niveau
                  </p>
                </div>
              )}

              {initMethod === "copy" && (
                <div className="space-y-4">
                  <Alert>
                    <Copy className="h-4 w-4" />
                    <AlertDescription>
                      La structure de l'exercice {sourceExercice?.annee} sera copiée vers {selectedExercice}.
                      Les données d'exécution (engagements, liquidations) ne seront pas copiées.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="copy-dotations" 
                      checked={copyDotations}
                      onCheckedChange={(c) => setCopyDotations(c === true)}
                    />
                    <Label htmlFor="copy-dotations">
                      Copier également les montants de dotation initiale
                    </Label>
                  </div>

                  {sourceExercice && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Exercice source: {sourceExercice.annee}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p>{sourceExercice.budget_lignes_count || 0} lignes budgétaires</p>
                        <p>{formatMontant(sourceExercice.budget_total || 0)}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step: Summary */}
          {step === "summary" && (
            <div className="space-y-4 py-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <p className="text-4xl font-bold text-primary">
                      {budgetSummary?.lignes_count || 0}
                    </p>
                    <p className="text-muted-foreground">Lignes budgétaires</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-primary/20 text-center">
                    <p className="text-2xl font-semibold">
                      {formatMontant(budgetSummary?.dotation_totale || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Dotation totale</p>
                  </div>
                </CardContent>
              </Card>

              {budgetSummary && budgetSummary.lignes_count > 0 && (
                <>
                  {budgetSummary.lignes_par_niveau && Object.keys(budgetSummary.lignes_par_niveau).length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Répartition par niveau</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(budgetSummary.lignes_par_niveau).map(([niveau, count]) => (
                            <div key={niveau} className="flex justify-between text-sm">
                              <span className="capitalize">{niveau}</span>
                              <Badge variant="secondary">{count as number}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Validation du budget</strong> : Une fois validé, la structure sera verrouillée.
                      Les modifications passeront par les virements/mouvements budgétaires.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {(!budgetSummary || budgetSummary.lignes_count === 0) && initMethod !== "empty" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Aucune ligne budgétaire chargée. Revenez à l'étape précédente pour importer ou copier des données.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 gap-2">
          {step !== "select" && (
            <Button variant="outline" onClick={() => {
              const steps: Step[] = ["select", "method", "config", "summary"];
              const currentIndex = steps.indexOf(step);
              if (currentIndex > 0) setStep(steps[currentIndex - 1]);
            }}>
              Retour
            </Button>
          )}
          
          <div className="flex-1" />
          
          {step === "select" && selectedExercice && !isCreatingNew && (
            <Button variant="outline" onClick={handleSwitchExercice}>
              Basculer sans initialiser
            </Button>
          )}
          
          {step === "summary" && budgetSummary && budgetSummary.lignes_count > 0 ? (
            <Button 
              onClick={() => validateBudgetMutation.mutate()}
              disabled={validateBudgetMutation.isPending}
            >
              {validateBudgetMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Valider le budget
            </Button>
          ) : step === "summary" ? (
            <Button onClick={handleSwitchExercice}>
              Terminer sans validation
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={
                (step === "select" && !selectedExercice && !isCreatingNew) ||
                (step === "method" && initMethod === "copy" && !sourceExercice) ||
                createExerciceMutation.isPending ||
                copyBudgetMutation.isPending
              }
            >
              {(createExerciceMutation.isPending || copyBudgetMutation.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Suivant
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
