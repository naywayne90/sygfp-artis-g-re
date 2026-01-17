import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Clock,
  Plus,
  FileText,
  CreditCard,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { ReglementForm } from "./ReglementForm";

interface ReglementPartielManagerProps {
  ordonnancementId: string;
  ordonnancement: {
    id: string;
    numero: string;
    montant: number;
    montant_paye: number;
    beneficiaire: string;
    objet: string;
    is_locked?: boolean;
  };
  onReglementCreated?: () => void;
}

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

export function ReglementPartielManager({
  ordonnancementId,
  ordonnancement,
  onReglementCreated,
}: ReglementPartielManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Récupérer les règlements existants
  const { data: reglements = [], refetch } = useQuery({
    queryKey: ["reglements-by-ordonnancement", ordonnancementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reglements")
        .select(`
          id,
          numero,
          date_paiement,
          mode_paiement,
          reference_paiement,
          montant,
          statut,
          compte_bancaire_arti,
          banque_arti,
          observation,
          created_at,
          created_by_profile:profiles!reglements_created_by_fkey(
            full_name
          )
        `)
        .eq("ordonnancement_id", ordonnancementId)
        .order("date_paiement", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const montantOrdonnance = ordonnancement.montant || 0;
  const totalPaye = reglements.reduce((sum, r) => sum + (r.montant || 0), 0);
  const restantAPayer = montantOrdonnance - totalPaye;
  const progressPaiement = montantOrdonnance > 0 ? (totalPaye / montantOrdonnance) * 100 : 0;
  const isFullyPaid = restantAPayer <= 0;

  const handleReglementSuccess = () => {
    setShowAddForm(false);
    refetch();
    onReglementCreated?.();
  };

  const getModePaiementLabel = (mode: string) => {
    const labels: Record<string, string> = {
      virement: "Virement",
      cheque: "Chèque",
      especes: "Espèces",
      mobile_money: "Mobile Money",
    };
    return labels[mode] || mode;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Gestion des règlements
            </CardTitle>
            <CardDescription>
              Ordonnancement {ordonnancement.numero} - {ordonnancement.beneficiaire}
            </CardDescription>
          </div>
          {isFullyPaid ? (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle className="h-3 w-3 mr-1" />
              Soldé
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              <Clock className="h-3 w-3 mr-1" />
              En cours
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Résumé du paiement */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Montant ordonnancé</p>
              <p className="text-xl font-bold">{formatMontant(montantOrdonnance)}</p>
            </div>
            <div className="p-4 bg-success/10 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Total payé</p>
              <p className="text-xl font-bold text-success">{formatMontant(totalPaye)}</p>
              <p className="text-xs text-muted-foreground">
                {reglements.length} règlement(s)
              </p>
            </div>
            <div className={`p-4 rounded-lg text-center ${isFullyPaid ? "bg-success/10" : "bg-warning/10"}`}>
              <p className="text-xs text-muted-foreground mb-1">Restant à payer</p>
              <p className={`text-xl font-bold ${isFullyPaid ? "text-success" : "text-warning"}`}>
                {formatMontant(restantAPayer)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{progressPaiement.toFixed(1)}%</span>
            </div>
            <Progress value={progressPaiement} className="h-3" />
          </div>
        </div>

        <Separator />

        {/* Liste des règlements */}
        {reglements.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Historique des règlements
            </h4>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Règlement</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reglements.map((reglement) => (
                    <TableRow key={reglement.id}>
                      <TableCell className="font-mono">
                        {reglement.numero}
                      </TableCell>
                      <TableCell>
                        {format(new Date(reglement.date_paiement), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getModePaiementLabel(reglement.mode_paiement)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {reglement.reference_paiement || "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-success">
                        {formatMontant(reglement.montant)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Bouton ajouter règlement */}
        {!isFullyPaid && (
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un règlement ({formatMontant(restantAPayer)} restant)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Nouveau règlement
                </DialogTitle>
              </DialogHeader>
              <ReglementForm
                preselectedOrdonnancementId={ordonnancementId}
                onSuccess={handleReglementSuccess}
                onCancel={() => setShowAddForm(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Message dossier soldé */}
        {isFullyPaid && (
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-success">Ordonnancement soldé</p>
                <p className="text-sm text-muted-foreground">
                  Tous les paiements ont été effectués. Le dossier peut être clôturé.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
