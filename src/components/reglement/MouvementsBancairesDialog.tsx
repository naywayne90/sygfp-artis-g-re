/**
 * MouvementsBancairesDialog - Dialog pour gérer les mouvements bancaires d'un règlement
 * Basé sur l'analyse de l'ancien SYGFP (arti-ci.com:8001)
 *
 * Permet:
 * - Visualiser l'historique des mouvements bancaires
 * - Ajouter un nouveau mouvement (paiement partiel)
 * - Voir le reste à payer
 */

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Banknote,
  Building2,
  CheckCircle,
  Clock,
  Plus,
  Receipt,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  useMouvementsBancaires,
  useComptesBancaires,
  useAddMouvementBancaire,
  useDeleteMouvementBancaire,
  type MouvementBancaire,
} from "@/hooks/usePaiementsPartiels";

interface MouvementsBancairesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reglementId: string;
  numeroReglement: string;
  montantTotal: number;
  beneficiaire?: string;
}

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

export function MouvementsBancairesDialog({
  open,
  onOpenChange,
  reglementId,
  numeroReglement,
  montantTotal,
  beneficiaire,
}: MouvementsBancairesDialogProps) {
  // State for new movement form
  const [showAddForm, setShowAddForm] = useState(false);
  const [compteBancaire, setCompteBancaire] = useState("");
  const [montant, setMontant] = useState<number | "">("");
  const [reference, setReference] = useState("");
  const [objet, setObjet] = useState("");
  const [dateReglement, setDateReglement] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Queries and mutations
  const { data: mouvements = [], isLoading: isLoadingMouvements } =
    useMouvementsBancaires(reglementId);
  const { data: comptesBancaires = [] } = useComptesBancaires();
  const addMouvement = useAddMouvementBancaire();
  const deleteMouvement = useDeleteMouvementBancaire();

  // Calculate totals
  const totalPaye = mouvements.reduce((sum, m) => sum + (m.montant || 0), 0);
  const resteAPayer = Math.max(montantTotal - totalPaye, 0);
  const progressPaiement = montantTotal > 0 ? (totalPaye / montantTotal) * 100 : 0;
  const isFullyPaid = resteAPayer <= 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!compteBancaire || !montant || montant <= 0 || !reference.trim()) {
      return;
    }

    await addMouvement.mutateAsync({
      reglementId,
      compteBancaireCode: compteBancaire,
      montant: Number(montant),
      reference: reference.trim(),
      objet: objet.trim() || undefined,
      dateReglement,
    });

    // Reset form
    setCompteBancaire("");
    setMontant("");
    setReference("");
    setObjet("");
    setDateReglement(new Date().toISOString().split("T")[0]);
    setShowAddForm(false);
  };

  // Handle delete
  const handleDelete = async (mouvement: MouvementBancaire) => {
    if (!confirm("Supprimer ce mouvement bancaire ?")) return;

    await deleteMouvement.mutateAsync({
      mouvementId: mouvement.id,
      reglementId,
    });
  };

  const isValidMontant = typeof montant === "number" && montant > 0 && montant <= resteAPayer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Mouvements bancaires
          </DialogTitle>
          <DialogDescription>
            Règlement {numeroReglement}
            {beneficiaire && ` - ${beneficiaire}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">Montant total</p>
                <p className="text-lg font-bold">{formatMontant(montantTotal)}</p>
              </CardContent>
            </Card>
            <Card className="bg-success/10">
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">Payé</p>
                <p className="text-lg font-bold text-success">
                  {formatMontant(totalPaye)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mouvements.length} mouvement(s)
                </p>
              </CardContent>
            </Card>
            <Card className={isFullyPaid ? "bg-success/10" : "bg-warning/10"}>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">Reste à payer</p>
                <p
                  className={`text-lg font-bold ${isFullyPaid ? "text-success" : "text-warning"}`}
                >
                  {formatMontant(resteAPayer)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                {isFullyPaid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-success" />
                    Paiement complet
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-warning" />
                    Paiement en cours
                  </>
                )}
              </span>
              <span className="font-medium">{progressPaiement.toFixed(1)}%</span>
            </div>
            <Progress value={progressPaiement} className="h-3" />
          </div>

          <Separator />

          {/* Mouvements list */}
          {isLoadingMouvements ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : mouvements.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Historique des mouvements
              </h4>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Compte</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mouvements.map((mouvement) => (
                      <TableRow key={mouvement.id}>
                        <TableCell>
                          {format(new Date(mouvement.date_reglement), "dd/MM/yyyy", {
                            locale: fr,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {mouvement.compte_bancaire_libelle ||
                                  mouvement.compte_bancaire_code}
                              </p>
                              {mouvement.banque && (
                                <p className="text-xs text-muted-foreground">
                                  {mouvement.banque}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-sm">{mouvement.reference}</p>
                          {mouvement.objet && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {mouvement.objet}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-success">
                          {formatMontant(mouvement.montant)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(mouvement)}
                            disabled={deleteMouvement.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun mouvement bancaire enregistré</p>
              <p className="text-sm">Ajoutez un mouvement pour enregistrer un paiement</p>
            </div>
          )}

          <Separator />

          {/* Add movement form */}
          {!isFullyPaid && (
            <>
              {!showAddForm ? (
                <Button onClick={() => setShowAddForm(true)} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter un mouvement ({formatMontant(resteAPayer)} restant)
                </Button>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nouveau mouvement bancaire
                    </CardTitle>
                    <CardDescription>
                      Montant maximum: {formatMontant(resteAPayer)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="compte">Compte bancaire *</Label>
                          <Select value={compteBancaire} onValueChange={setCompteBancaire}>
                            <SelectTrigger id="compte">
                              <SelectValue placeholder="Sélectionner un compte..." />
                            </SelectTrigger>
                            <SelectContent>
                              {comptesBancaires.map((compte) => (
                                <SelectItem key={compte.id} value={compte.code}>
                                  <div className="flex flex-col">
                                    <span>{compte.libelle}</span>
                                    {compte.banque && (
                                      <span className="text-xs text-muted-foreground">
                                        {compte.banque}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="montant">Montant (FCFA) *</Label>
                          <Input
                            id="montant"
                            type="number"
                            min="1"
                            max={resteAPayer}
                            value={montant}
                            onChange={(e) =>
                              setMontant(e.target.value ? parseFloat(e.target.value) : "")
                            }
                            placeholder="0"
                          />
                          {typeof montant === "number" && montant > resteAPayer && (
                            <p className="text-xs text-destructive">
                              Le montant dépasse le reste à payer
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reference">Référence bancaire *</Label>
                          <Input
                            id="reference"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="N° de virement, chèque..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date">Date du règlement</Label>
                          <Input
                            id="date"
                            type="date"
                            value={dateReglement}
                            onChange={(e) => setDateReglement(e.target.value)}
                          />
                        </div>

                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="objet">Objet / Observation</Label>
                          <Textarea
                            id="objet"
                            value={objet}
                            onChange={(e) => setObjet(e.target.value)}
                            placeholder="Description du paiement..."
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* Summary */}
                      {compteBancaire && typeof montant === "number" && montant > 0 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Paiement de <strong>{formatMontant(montant)}</strong> depuis{" "}
                            <strong>
                              {comptesBancaires.find((c) => c.code === compteBancaire)
                                ?.libelle || compteBancaire}
                            </strong>
                            . Nouveau reste à payer:{" "}
                            <strong>{formatMontant(resteAPayer - montant)}</strong>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddForm(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            !compteBancaire ||
                            !isValidMontant ||
                            !reference.trim() ||
                            addMouvement.isPending
                          }
                        >
                          {addMouvement.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Enregistrer
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Fully paid message */}
          {isFullyPaid && (
            <Alert className="bg-success/10 border-success/30">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                Ce règlement est entièrement payé. Tous les mouvements bancaires ont été
                enregistrés.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
