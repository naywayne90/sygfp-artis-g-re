import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  RotateCcw,
  FileText,
  Receipt,
  CreditCard,
  Banknote,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

interface TestStep {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: "pending" | "running" | "success" | "error" | "skipped";
  duration?: number;
  error?: string;
  data?: any;
}

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  duration: number;
}

export default function TestNonRegression() {
  const { exerciceId, exercice } = useExercice();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: "note_sef",
      name: "1. Création Note SEF",
      description: "Créer une note SEF de démonstration",
      icon: FileText,
      status: "pending",
    },
    {
      id: "validate_sef",
      name: "2. Validation Note SEF",
      description: "Valider la note SEF (rôle DG)",
      icon: CheckCircle2,
      status: "pending",
    },
    {
      id: "note_aef",
      name: "3. Création Note AEF",
      description: "Créer une note AEF liée à la note SEF",
      icon: FileText,
      status: "pending",
    },
    {
      id: "validate_aef",
      name: "4. Validation Note AEF",
      description: "Valider la note AEF (rôle Directeur)",
      icon: CheckCircle2,
      status: "pending",
    },
    {
      id: "imputation",
      name: "5. Imputation Budgétaire",
      description: "Imputer la note AEF sur une ligne budgétaire",
      icon: Receipt,
      status: "pending",
    },
    {
      id: "engagement",
      name: "6. Création Engagement",
      description: "Créer un engagement à partir de l'imputation",
      icon: CreditCard,
      status: "pending",
    },
    {
      id: "liquidation",
      name: "7. Liquidation",
      description: "Liquider l'engagement",
      icon: Receipt,
      status: "pending",
    },
    {
      id: "ordonnancement",
      name: "8. Ordonnancement",
      description: "Ordonner le paiement (signature DG)",
      icon: FileText,
      status: "pending",
    },
    {
      id: "reglement",
      name: "9. Règlement",
      description: "Exécuter le règlement (Trésorerie)",
      icon: Banknote,
      status: "pending",
    },
    {
      id: "verify",
      name: "10. Vérification",
      description: "Vérifier l'intégrité du parcours complet",
      icon: CheckCircle2,
      status: "pending",
    },
  ]);

  const [testData, setTestData] = useState<{
    noteSefId?: string;
    noteAefId?: string;
    imputationId?: string;
    engagementId?: string;
    liquidationId?: string;
    ordonnancementId?: string;
    reglementId?: string;
    reference?: string;
  }>({});

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const updateStepStatus = (
    stepId: string,
    status: TestStep["status"],
    extra?: Partial<TestStep>
  ) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, status, ...extra } : s
      )
    );
  };

  const generateReference = () => {
    const now = new Date();
    return `TEST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  };

  const runTest = async () => {
    if (!exerciceId) {
      toast.error("Veuillez sélectionner un exercice");
      return;
    }

    setIsRunning(true);
    setResults([]);
    const reference = generateReference();
    setTestData({ reference });

    // Reset all steps
    setSteps((prev) => prev.map((s) => ({ ...s, status: "pending" as const, error: undefined, duration: undefined })));

    const startTime = Date.now();
    let currentData = { ...testData, reference };

    try {
      // Step 1: Create Note SEF
      await runStep("note_sef", async () => {
        const { data, error } = await supabase
          .from("notes_sef")
          .insert({
            reference: `SEF-${reference}`,
            exercice_id: exerciceId,
            objet: `[TEST] Note SEF de test non-régression - ${reference}`,
            montant_total: 5000000,
            statut: "brouillon",
          })
          .select()
          .single();

        if (error) throw error;
        currentData.noteSefId = data.id;
        return { noteSefId: data.id, reference: data.reference };
      });

      await delay(500);

      // Step 2: Validate Note SEF
      await runStep("validate_sef", async () => {
        const { error } = await supabase
          .from("notes_sef")
          .update({
            statut: "valide",
            date_validation: new Date().toISOString(),
            validated_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq("id", currentData.noteSefId);

        if (error) throw error;
        return { validated: true };
      });

      await delay(500);

      // Step 3: Create Note AEF
      await runStep("note_aef", async () => {
        // Get a direction for the test
        const { data: directions } = await supabase
          .from("directions")
          .select("id")
          .limit(1);

        const directionId = directions?.[0]?.id;
        if (!directionId) throw new Error("Aucune direction trouvée");

        const { data, error } = await supabase
          .from("notes_aef")
          .insert({
            reference: `AEF-${reference}`,
            exercice_id: exerciceId,
            note_sef_id: currentData.noteSefId,
            direction_id: directionId,
            objet: `[TEST] Note AEF de test non-régression - ${reference}`,
            montant_demande: 2500000,
            statut: "brouillon",
          })
          .select()
          .single();

        if (error) throw error;
        currentData.noteAefId = data.id;
        return { noteAefId: data.id, reference: data.reference };
      });

      await delay(500);

      // Step 4: Validate Note AEF
      await runStep("validate_aef", async () => {
        const { error } = await supabase
          .from("notes_aef")
          .update({
            statut: "valide",
            date_validation: new Date().toISOString(),
            validated_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq("id", currentData.noteAefId);

        if (error) throw error;
        return { validated: true };
      });

      await delay(500);

      // Step 5: Imputation
      await runStep("imputation", async () => {
        // Get budget line
        const { data: lignesBudget } = await supabase
          .from("lignes_budget")
          .select("id, dotation_initiale")
          .eq("exercice_id", exerciceId)
          .gt("dotation_initiale", 2500000)
          .limit(1);

        const ligneBudgetId = lignesBudget?.[0]?.id;
        if (!ligneBudgetId) throw new Error("Aucune ligne budgétaire disponible avec dotation suffisante");

        const { data, error } = await supabase
          .from("imputations")
          .insert({
            note_aef_id: currentData.noteAefId,
            ligne_budget_id: ligneBudgetId,
            exercice_id: exerciceId,
            montant: 2500000,
            statut: "valide",
          })
          .select()
          .single();

        if (error) throw error;
        currentData.imputationId = data.id;
        return { imputationId: data.id };
      });

      await delay(500);

      // Step 6: Engagement
      await runStep("engagement", async () => {
        // Get beneficiaire
        const { data: tiers } = await supabase
          .from("tiers")
          .select("id")
          .limit(1);

        const tiersId = tiers?.[0]?.id;
        if (!tiersId) throw new Error("Aucun tiers/bénéficiaire trouvé");

        // Get source financement
        const { data: sources } = await supabase
          .from("sources_financement")
          .select("id")
          .limit(1);

        const sourceId = sources?.[0]?.id;

        const { data, error } = await supabase
          .from("engagements")
          .insert({
            reference: `ENG-${reference}`,
            note_aef_id: currentData.noteAefId,
            exercice_id: exerciceId,
            tiers_id: tiersId,
            source_financement_id: sourceId,
            montant: 2500000,
            objet: `[TEST] Engagement de test non-régression - ${reference}`,
            date_engagement: new Date().toISOString().split("T")[0],
            statut: "valide",
          })
          .select()
          .single();

        if (error) throw error;
        currentData.engagementId = data.id;
        return { engagementId: data.id, reference: data.reference };
      });

      await delay(500);

      // Step 7: Liquidation
      await runStep("liquidation", async () => {
        const { data, error } = await supabase
          .from("liquidations")
          .insert({
            reference: `LIQ-${reference}`,
            engagement_id: currentData.engagementId,
            exercice_id: exerciceId,
            montant: 2500000,
            date_liquidation: new Date().toISOString().split("T")[0],
            motif: `[TEST] Liquidation de test non-régression - ${reference}`,
            statut: "valide",
          })
          .select()
          .single();

        if (error) throw error;
        currentData.liquidationId = data.id;
        return { liquidationId: data.id, reference: data.reference };
      });

      await delay(500);

      // Step 8: Ordonnancement
      await runStep("ordonnancement", async () => {
        const { data, error } = await supabase
          .from("ordonnancements")
          .insert({
            reference: `ORD-${reference}`,
            liquidation_id: currentData.liquidationId,
            exercice_id: exerciceId,
            montant: 2500000,
            date_ordonnancement: new Date().toISOString().split("T")[0],
            statut: "signe",
          })
          .select()
          .single();

        if (error) throw error;
        currentData.ordonnancementId = data.id;
        return { ordonnancementId: data.id, reference: data.reference };
      });

      await delay(500);

      // Step 9: Règlement
      await runStep("reglement", async () => {
        const { data, error } = await supabase
          .from("reglements")
          .insert({
            reference: `REG-${reference}`,
            ordonnancement_id: currentData.ordonnancementId,
            exercice_id: exerciceId,
            montant: 2500000,
            date_reglement: new Date().toISOString().split("T")[0],
            mode_paiement: "virement",
            statut: "execute",
          })
          .select()
          .single();

        if (error) throw error;
        currentData.reglementId = data.id;
        return { reglementId: data.id, reference: data.reference };
      });

      await delay(500);

      // Step 10: Verification
      await runStep("verify", async () => {
        // Verify all entities exist and are linked
        const { data: noteSef } = await supabase
          .from("notes_sef")
          .select("*")
          .eq("id", currentData.noteSefId)
          .single();

        const { data: noteAef } = await supabase
          .from("notes_aef")
          .select("*")
          .eq("id", currentData.noteAefId)
          .single();

        const { data: engagement } = await supabase
          .from("engagements")
          .select("*")
          .eq("id", currentData.engagementId)
          .single();

        const { data: liquidation } = await supabase
          .from("liquidations")
          .select("*")
          .eq("id", currentData.liquidationId)
          .single();

        const { data: ordonnancement } = await supabase
          .from("ordonnancements")
          .select("*")
          .eq("id", currentData.ordonnancementId)
          .single();

        const { data: reglement } = await supabase
          .from("reglements")
          .select("*")
          .eq("id", currentData.reglementId)
          .single();

        const checks = [
          { name: "Note SEF valide", ok: noteSef?.statut === "valide" },
          { name: "Note AEF valide", ok: noteAef?.statut === "valide" },
          { name: "Note AEF liée à Note SEF", ok: noteAef?.note_sef_id === currentData.noteSefId },
          { name: "Engagement valide", ok: engagement?.statut === "valide" },
          { name: "Engagement lié à Note AEF", ok: engagement?.note_aef_id === currentData.noteAefId },
          { name: "Liquidation valide", ok: liquidation?.statut === "valide" },
          { name: "Liquidation liée à Engagement", ok: liquidation?.engagement_id === currentData.engagementId },
          { name: "Ordonnancement signé", ok: ordonnancement?.statut === "signe" },
          { name: "Ordonnancement lié à Liquidation", ok: ordonnancement?.liquidation_id === currentData.liquidationId },
          { name: "Règlement exécuté", ok: reglement?.statut === "execute" },
          { name: "Règlement lié à Ordonnancement", ok: reglement?.ordonnancement_id === currentData.ordonnancementId },
        ];

        const failed = checks.filter((c) => !c.ok);
        if (failed.length > 0) {
          throw new Error(`Vérifications échouées: ${failed.map((c) => c.name).join(", ")}`);
        }

        return { checks, allPassed: true };
      });

      setTestData(currentData);
      toast.success("Test de non-régression réussi !");

    } catch (error: any) {
      toast.error(`Test échoué: ${error.message}`);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  const runStep = async (
    stepId: string,
    fn: () => Promise<any>
  ) => {
    setCurrentStep(stepId);
    updateStepStatus(stepId, "running");
    const stepStart = Date.now();

    try {
      const data = await fn();
      const duration = Date.now() - stepStart;
      updateStepStatus(stepId, "success", { duration, data });
      setResults((prev) => [
        ...prev,
        { step: stepId, success: true, message: "OK", data, duration },
      ]);
    } catch (error: any) {
      const duration = Date.now() - stepStart;
      updateStepStatus(stepId, "error", { duration, error: error.message });
      setResults((prev) => [
        ...prev,
        { step: stepId, success: false, message: error.message, duration },
      ]);
      throw error;
    }
  };

  const resetTest = () => {
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        status: "pending" as const,
        error: undefined,
        duration: undefined,
      }))
    );
    setResults([]);
    setTestData({});
    setCurrentStep(null);
  };

  const getStatusIcon = (status: TestStep["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "skipped":
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestStep["status"]) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-500">Succès</Badge>;
      case "error":
        return <Badge variant="destructive">Échec</Badge>;
      case "running":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">En cours</Badge>;
      case "skipped":
        return <Badge variant="outline">Ignoré</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const successCount = steps.filter((s) => s.status === "success").length;
  const errorCount = steps.filter((s) => s.status === "error").length;
  const progress = (successCount / steps.length) * 100;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Test de Non-Régression</h1>
          <p className="text-muted-foreground">
            Parcours complet SEF → Règlement avec données de démonstration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetTest}
            disabled={isRunning}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button
            onClick={runTest}
            disabled={isRunning || !exerciceId}
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            {isRunning ? "Test en cours..." : "Lancer le test"}
          </Button>
        </div>
      </div>

      {!exerciceId && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Exercice requis</AlertTitle>
          <AlertDescription>
            Veuillez sélectionner un exercice avant de lancer le test.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Progression</CardTitle>
          <CardDescription>
            {exercice && `Exercice ${exercice.annee}`}
            {testData.reference && ` - Référence: ${testData.reference}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{successCount} / {steps.length} étapes complétées</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {errorCount > 0 && (
              <p className="text-sm text-red-500">
                {errorCount} erreur(s) rencontrée(s)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Steps list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Étapes du parcours</CardTitle>
          <CardDescription>
            Workflow complet : Note SEF → Note AEF → Imputation → Engagement → Liquidation → Ordonnancement → Règlement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id}>
                <div
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    currentStep === step.id
                      ? "bg-blue-50 border border-blue-200"
                      : step.status === "success"
                      ? "bg-green-50"
                      : step.status === "error"
                      ? "bg-red-50"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-shrink-0">
                    <step.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {step.description}
                    </p>
                    {step.error && (
                      <p className="text-sm text-red-500 mt-1">{step.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {step.duration && (
                      <span className="text-xs text-muted-foreground">
                        {step.duration}ms
                      </span>
                    )}
                    {getStatusBadge(step.status)}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="ml-6 pl-2 border-l-2 border-dashed border-muted h-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Résumé des résultats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    result.success ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">
                      {steps.find((s) => s.id === result.step)?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {result.duration}ms
                    </span>
                    {result.success ? (
                      <Badge variant="default" className="bg-green-500">OK</Badge>
                    ) : (
                      <Badge variant="destructive">{result.message}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {testData.reference && successCount === steps.length && (
              <Separator className="my-4" />
            )}

            {testData.reference && successCount === steps.length && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  Test réussi - Données créées
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Note SEF:</span>{" "}
                    <code className="text-xs">SEF-{testData.reference}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Note AEF:</span>{" "}
                    <code className="text-xs">AEF-{testData.reference}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Engagement:</span>{" "}
                    <code className="text-xs">ENG-{testData.reference}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Liquidation:</span>{" "}
                    <code className="text-xs">LIQ-{testData.reference}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ordonnancement:</span>{" "}
                    <code className="text-xs">ORD-{testData.reference}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Règlement:</span>{" "}
                    <code className="text-xs">REG-{testData.reference}</code>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
