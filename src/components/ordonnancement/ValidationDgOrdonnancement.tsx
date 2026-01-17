import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  FileText,
  Building2,
  CreditCard,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuditLog } from "@/hooks/useAuditLog";

interface ValidationDgOrdonnancementProps {
  ordonnancement: {
    id: string;
    numero: string;
    montant: number;
    beneficiaire: string;
    objet: string;
    statut: string;
    current_step?: number;
    liquidation?: {
      numero: string;
      engagement?: {
        numero: string;
        budget_line?: {
          code: string;
          label: string;
        };
      };
    };
  };
  onSuccess?: () => void;
}

const validationSchema = z.object({
  commentaire: z.string().optional(),
  motif_rejet: z.string().min(10, "Le motif du rejet doit contenir au moins 10 caractères").optional(),
});

// Seuil pour validation DG obligatoire
const SEUIL_VALIDATION_DG = 50_000_000; // 50 millions FCFA

// Checklist DG
const CHECKLIST_DG = [
  { id: "conformite_budget", label: "Conformité avec le budget approuvé" },
  { id: "pieces_completes", label: "Dossier de pièces justificatives complet" },
  { id: "beneficiaire_verifie", label: "Bénéficiaire vérifié et conforme" },
  { id: "montant_conforme", label: "Montant conforme aux documents" },
  { id: "opportunite_validee", label: "Opportunité de la dépense validée" },
];

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

export function ValidationDgOrdonnancement({
  ordonnancement,
  onSuccess,
}: ValidationDgOrdonnancementProps) {
  const queryClient = useQueryClient();
  const { hasAnyRole } = usePermissions();
  const { logAction } = useAuditLog();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const canValidate = hasAnyRole(["DG", "ADMIN"]);
  const isCurrentStepDG = ordonnancement.current_step === 4; // DG est l'étape 4
  const requiresDGValidation = ordonnancement.montant >= SEUIL_VALIDATION_DG;
  const allChecked = CHECKLIST_DG.every((item) => checkedItems[item.id]);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      commentaire: "",
      motif_rejet: "",
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (data: { approved: boolean; commentaire?: string; motif?: string }) => {
      if (data.approved) {
        // Valider l'étape DG
        const { error: validationError } = await supabase
          .from("ordonnancement_validations")
          .update({
            status: "validated",
            validated_at: new Date().toISOString(),
            comments: data.commentaire,
          })
          .eq("ordonnancement_id", ordonnancement.id)
          .eq("step_order", 4);

        if (validationError) throw validationError;

        // Marquer l'ordonnancement comme validé
        const { error } = await supabase
          .from("ordonnancements")
          .update({
            statut: "valide",
            workflow_status: "valide",
            validated_at: new Date().toISOString(),
          })
          .eq("id", ordonnancement.id);

        if (error) throw error;

        await logAction({
          entityType: "ordonnancement",
          entityId: ordonnancement.id,
          action: "validate",
          newValues: {
            numero: ordonnancement.numero,
            montant: ordonnancement.montant,
            decision: "approved",
            validation_type: "DG",
          },
        });
      } else {
        // Rejeter l'ordonnancement
        const { error } = await supabase
          .from("ordonnancements")
          .update({
            statut: "rejete",
            workflow_status: "rejete",
            rejection_reason: data.motif,
            rejected_at: new Date().toISOString(),
          })
          .eq("id", ordonnancement.id);

        if (error) throw error;

        await logAction({
          entityType: "ordonnancement",
          entityId: ordonnancement.id,
          action: "reject",
          newValues: {
            numero: ordonnancement.numero,
            montant: ordonnancement.montant,
            motif: data.motif,
            validation_type: "DG",
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordonnancements"] });
      toast.success(action === "approve" ? "Ordonnancement validé par le DG" : "Ordonnancement rejeté");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la validation");
    },
  });

  const onSubmit = (values: z.infer<typeof validationSchema>) => {
    if (action === "approve") {
      validateMutation.mutate({
        approved: true,
        commentaire: values.commentaire,
      });
    } else if (action === "reject") {
      if (!values.motif_rejet || values.motif_rejet.length < 10) {
        form.setError("motif_rejet", { message: "Motif de rejet obligatoire" });
        return;
      }
      validateMutation.mutate({
        approved: false,
        motif: values.motif_rejet,
      });
    }
  };

  if (!canValidate || !isCurrentStepDG) {
    return null;
  }

  return (
    <Card className="border-amber-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <Crown className="h-5 w-5" />
          Validation Directeur Général
        </CardTitle>
        <CardDescription>
          {requiresDGValidation ? (
            <span className="text-amber-600 font-medium">
              Validation DG obligatoire (montant ≥ {formatMontant(SEUIL_VALIDATION_DG)})
            </span>
          ) : (
            <span>Validation finale de l'ordonnancement</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Récapitulatif */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">N° Ordonnancement</p>
              <p className="font-mono font-medium">{ordonnancement.numero}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CreditCard className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Montant</p>
              <p className="font-bold text-lg text-primary">
                {formatMontant(ordonnancement.montant)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Bénéficiaire</p>
              <p className="font-medium">{ordonnancement.beneficiaire}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Objet</p>
            <p className="text-sm">{ordonnancement.objet}</p>
          </div>
        </div>

        {/* Références */}
        {ordonnancement.liquidation && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              Liquidation: {ordonnancement.liquidation.numero}
            </Badge>
            {ordonnancement.liquidation.engagement && (
              <Badge variant="outline">
                Engagement: {ordonnancement.liquidation.engagement.numero}
              </Badge>
            )}
            {ordonnancement.liquidation.engagement?.budget_line && (
              <Badge variant="outline">
                Ligne: {ordonnancement.liquidation.engagement.budget_line.code}
              </Badge>
            )}
          </div>
        )}

        {/* Alerte montant élevé */}
        {requiresDGValidation && (
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <strong>Attention :</strong> Ce montant dépasse le seuil de{" "}
              {formatMontant(SEUIL_VALIDATION_DG)}. Une attention particulière est requise
              avant validation.
            </AlertDescription>
          </Alert>
        )}

        {/* Checklist */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Checklist de validation</h4>
          <div className="space-y-2">
            {CHECKLIST_DG.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
              >
                <Checkbox
                  id={item.id}
                  checked={checkedItems[item.id] || false}
                  onCheckedChange={(checked) =>
                    setCheckedItems((prev) => ({ ...prev, [item.id]: !!checked }))
                  }
                />
                <label
                  htmlFor={item.id}
                  className="text-sm cursor-pointer flex-1"
                >
                  {item.label}
                </label>
                {checkedItems[item.id] && (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {action === "reject" && (
              <FormField
                control={form.control}
                name="motif_rejet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif du rejet *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Expliquez les raisons du rejet..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {action === "approve" && (
              <FormField
                control={form.control}
                name="commentaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commentaire (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observations ou commentaires..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-success text-success hover:bg-success/10"
                onClick={() => setAction("approve")}
                disabled={!allChecked || validateMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {action === "approve" ? "Confirmer la validation" : "Valider"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => setAction("reject")}
                disabled={validateMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>

            {action && (
              <Button
                type="submit"
                className="w-full"
                disabled={validateMutation.isPending || (action === "approve" && !allChecked)}
              >
                {validateMutation.isPending
                  ? "Traitement..."
                  : action === "approve"
                  ? "Confirmer la validation DG"
                  : "Confirmer le rejet"}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
