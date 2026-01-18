import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useEngagements, BudgetAvailability } from "@/hooks/useEngagements";
import { BudgetLineSelector, SelectedBudgetLine } from "@/components/imputation/BudgetLineSelector";
import { DocumentUpload, UploadedDocument, DocumentType } from "@/components/shared/DocumentUpload";
import { Loader2, FileSignature, Building2, CreditCard, AlertCircle, CheckCircle2, Calculator } from "lucide-react";
import { toast } from "sonner";

interface PassationMarche {
  id: string;
  reference: string | null;
  mode_passation: string;
  montant_retenu: number | null;
  dossier_id: string | null;
  prestataire_retenu_id: string | null;
  expression_besoin?: {
    id: string;
    numero: string | null;
    objet: string;
    montant_estime: number | null;
    direction_id: string | null;
    direction?: { id: string; label: string; sigle: string | null } | null;
  } | null;
  prestataire_retenu?: {
    id: string;
    raison_sociale: string;
    adresse: string | null;
  } | null;
}

interface EngagementFromPMFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passation: PassationMarche | null;
  onSuccess?: () => void;
}

const DOCUMENTS_ENGAGEMENT: DocumentType[] = [
  { code: "bon_commande", label: "Bon de commande", obligatoire: true },
  { code: "contrat", label: "Contrat signé", obligatoire: false },
  { code: "devis", label: "Devis approuvé", obligatoire: true },
  { code: "pv_attribution", label: "PV d'attribution", obligatoire: false },
  { code: "autre", label: "Autre document", obligatoire: false },
];

export function EngagementFromPMForm({
  open,
  onOpenChange,
  passation,
  onSuccess,
}: EngagementFromPMFormProps) {
  const { createEngagement, calculateAvailability, isCreating } = useEngagements();

  const [objet, setObjet] = useState("");
  const [montant, setMontant] = useState<number>(0);
  const [montantHT, setMontantHT] = useState<number>(0);
  const [tva, setTva] = useState<number>(0);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedLines, setSelectedLines] = useState<SelectedBudgetLine[]>([]);
  const [availability, setAvailability] = useState<BudgetAvailability | null>(null);
  const [isCheckingBudget, setIsCheckingBudget] = useState(false);

  useEffect(() => {
    if (passation && open) {
      setObjet(passation.expression_besoin?.objet || "");
      const montantRetenu = passation.montant_retenu || passation.expression_besoin?.montant_estime || 0;
      setMontant(montantRetenu);
      setMontantHT(montantRetenu);
      setTva(0);
      setDocuments([]);
      setSelectedLines([]);
      setAvailability(null);
    }
  }, [passation, open]);

  // Check budget availability when line selected or amount changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (selectedLines.length === 0 || montant <= 0) {
        setAvailability(null);
        return;
      }

      setIsCheckingBudget(true);
      try {
        const result = await calculateAvailability(selectedLines[0].id, montant);
        setAvailability(result);
      } catch (error) {
        console.error("Error checking budget availability:", error);
      } finally {
        setIsCheckingBudget(false);
      }
    };

    checkAvailability();
  }, [selectedLines, montant, calculateAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passation) {
      toast.error("Aucune passation sélectionnée");
      return;
    }

    if (selectedLines.length === 0) {
      toast.error("Veuillez sélectionner une ligne budgétaire");
      return;
    }

    // Check if budget is sufficient
    if (availability && !availability.is_sufficient) {
      toast.error("Budget insuffisant pour cet engagement");
      return;
    }

    // Check required documents
    const requiredDocs = DOCUMENTS_ENGAGEMENT.filter(d => d.obligatoire);
    const providedDocs = documents.filter(d =>
      requiredDocs.some(rd => rd.code === d.type)
    );

    if (providedDocs.length < requiredDocs.length) {
      toast.warning("Certaines pièces obligatoires sont manquantes. L'engagement sera créé mais vous devrez les fournir avant validation.");
    }

    try {
      await createEngagement({
        expression_besoin_id: passation.expression_besoin?.id || "",
        budget_line_id: selectedLines[0].id,
        objet,
        montant,
        montant_ht: montantHT,
        tva,
        fournisseur: passation.prestataire_retenu?.raison_sociale || "",
        marche_id: undefined,
        dossier_id: passation.dossier_id || undefined,
      });

      toast.success("Engagement créé avec succès");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatMontant = (val: number) =>
    new Intl.NumberFormat("fr-FR").format(val) + " FCFA";

  const handleMontantHTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ht = parseFloat(e.target.value) || 0;
    setMontantHT(ht);
    setMontant(ht + (ht * tva) / 100);
  };

  const handleTvaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value) || 0;
    setTva(t);
    setMontant(montantHT + (montantHT * t) / 100);
  };

  if (!passation) return null;

  const canSubmit =
    objet.trim() !== "" &&
    montant > 0 &&
    selectedLines.length > 0 &&
    (availability?.is_sufficient ?? true) &&
    !isCreating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Créer un engagement depuis la Passation
          </DialogTitle>
          <DialogDescription>
            Transformez la passation de marché validée en engagement budgétaire
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Infos Passation */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Passation de Marché Source
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Référence PM</Label>
                <p className="font-mono font-medium">{passation.reference || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mode de passation</Label>
                <Badge variant="outline">{passation.mode_passation}</Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Montant retenu</Label>
                <p className="font-bold text-primary">
                  {formatMontant(passation.montant_retenu || 0)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Prestataire</Label>
                <p className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {passation.prestataire_retenu?.raison_sociale || "Non défini"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* EB Source */}
          {passation.expression_besoin && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Expression de Besoin
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Référence EB</Label>
                  <p className="font-mono">{passation.expression_besoin.numero || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Direction</Label>
                  <p>{passation.expression_besoin.direction?.sigle || "N/A"}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Objet</Label>
                  <p className="text-sm">{passation.expression_besoin.objet}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Formulaire Engagement */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="objet">Objet de l'engagement *</Label>
              <Textarea
                id="objet"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                placeholder="Description de l'engagement..."
                required
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="montant_ht">Montant HT *</Label>
                <Input
                  id="montant_ht"
                  type="number"
                  value={montantHT}
                  onChange={handleMontantHTChange}
                  required
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tva">TVA (%)</Label>
                <Input
                  id="tva"
                  type="number"
                  value={tva}
                  onChange={handleTvaChange}
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="montant_ttc">Montant TTC</Label>
                <Input
                  id="montant_ttc"
                  type="number"
                  value={montant}
                  disabled
                  className="bg-muted font-bold"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Budget Line Selector */}
          <BudgetLineSelector
            montantTotal={montant}
            selectedLines={selectedLines}
            onSelectionChange={setSelectedLines}
            directionId={passation.expression_besoin?.direction_id}
            showFilters={true}
          />

          {/* Budget Availability Status */}
          {selectedLines.length > 0 && (
            <Card className={availability?.is_sufficient ? "border-green-500/50" : "border-destructive/50"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Contrôle de disponibilité budgétaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCheckingBudget ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Vérification en cours...
                  </div>
                ) : availability ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Dotation initiale</span>
                        <p className="font-medium">{formatMontant(availability.dotation_initiale)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Engagements antérieurs</span>
                        <p className="font-medium text-orange-600">{formatMontant(availability.engagements_anterieurs)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cet engagement</span>
                        <p className="font-medium text-primary">{formatMontant(availability.engagement_actuel)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Disponible après</span>
                        <p className={`font-bold ${availability.is_sufficient ? "text-green-600" : "text-destructive"}`}>
                          {formatMontant(availability.disponible)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Taux d'engagement après opération</span>
                        <span>{((availability.cumul / availability.dotation_initiale) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={(availability.cumul / availability.dotation_initiale) * 100}
                        className="h-2"
                      />
                    </div>

                    {availability.is_sufficient ? (
                      <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-700">Budget suffisant</AlertTitle>
                        <AlertDescription>
                          La ligne budgétaire dispose des crédits nécessaires pour cet engagement.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Budget insuffisant</AlertTitle>
                        <AlertDescription>
                          <p>Il manque <strong>{formatMontant(Math.abs(availability.disponible))}</strong> pour réaliser cet engagement.</p>
                          <p className="mt-1 text-sm">Veuillez réduire le montant ou sélectionner une autre ligne budgétaire.</p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Sélectionnez une ligne budgétaire pour vérifier la disponibilité
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Documents Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Pièces justificatives
              <Badge variant="outline" className="text-xs">
                {DOCUMENTS_ENGAGEMENT.filter(d => d.obligatoire).length} obligatoires
              </Badge>
            </Label>
            <DocumentUpload
              documentTypes={DOCUMENTS_ENGAGEMENT}
              documents={documents}
              onDocumentsChange={setDocuments}
            />
            {documents.length < DOCUMENTS_ENGAGEMENT.filter(d => d.obligatoire).length && (
              <Alert className="border-warning/50 bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-sm text-muted-foreground">
                  Les pièces obligatoires pourront être ajoutées après création de l'engagement, mais seront requises pour la validation.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CreditCard className="mr-2 h-4 w-4" />
              Créer l'engagement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
