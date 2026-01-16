import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEngagements } from "@/hooks/useEngagements";
import { DocumentUpload, UploadedDocument, DocumentType } from "@/components/shared/DocumentUpload";
import { Loader2, FileSignature, Building2, CreditCard, AlertCircle } from "lucide-react";
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
  { code: "devis", label: "Devis approuvé", obligatoire: false },
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
  const [budgetLineId, setBudgetLineId] = useState("");
  const [availability, setAvailability] = useState<any>(null);
  const [isCheckingBudget, setIsCheckingBudget] = useState(false);

  useEffect(() => {
    if (passation && open) {
      setObjet(passation.expression_besoin?.objet || "");
      setMontant(passation.montant_retenu || passation.expression_besoin?.montant_estime || 0);
      setMontantHT(passation.montant_retenu || 0);
      setTva(0);
      setDocuments([]);
    }
  }, [passation, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passation || !budgetLineId) {
      toast.error("Veuillez sélectionner une ligne budgétaire");
      return;
    }

    try {
      await createEngagement({
        expression_besoin_id: passation.expression_besoin?.id || "",
        budget_line_id: budgetLineId,
        objet,
        montant,
        montant_ht: montantHT,
        tva,
        fournisseur: passation.prestataire_retenu?.raison_sociale || "",
        marche_id: undefined,
        dossier_id: passation.dossier_id || undefined,
        // passation_marche_id will be linked via backend trigger
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

  if (!passation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Créer un engagement depuis la Passation
          </DialogTitle>
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
                  onChange={(e) => {
                    const ht = parseFloat(e.target.value) || 0;
                    setMontantHT(ht);
                    setMontant(ht + (ht * tva) / 100);
                  }}
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
                  onChange={(e) => {
                    const t = parseFloat(e.target.value) || 0;
                    setTva(t);
                    setMontant(montantHT + (montantHT * t) / 100);
                  }}
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
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Budget Availability Warning */}
            {availability && !availability.is_sufficient && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">Budget insuffisant</p>
                  <p className="text-sm">
                    Disponible: {formatMontant(availability.disponible)} / 
                    Demandé: {formatMontant(montant)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Documents Upload */}
          <div className="space-y-2">
            <Label>Pièces justificatives</Label>
            <DocumentUpload
              documentTypes={DOCUMENTS_ENGAGEMENT}
              documents={documents}
              onDocumentsChange={setDocuments}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'engagement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
