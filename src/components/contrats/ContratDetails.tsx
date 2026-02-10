import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContrats, useContratAvenants, TYPES_AVENANT, STATUTS_CONTRAT, Contrat, Avenant } from "@/hooks/useContrats";
import { Plus, FileText, History } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ContratDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrat: Contrat | null;
  prestataireName: string;
}

export function ContratDetails({ open, onOpenChange, contrat, prestataireName }: ContratDetailsProps) {
  const { createAvenant } = useContrats();
  const avenants = useContratAvenants(contrat?.id ?? null);
  const [avenantOpen, setAvenantOpen] = useState(false);
  const [avenantForm, setAvenantForm] = useState({
    objet: "",
    type_avenant: "",
    montant_modification: 0,
    nouveau_montant: 0,
    nouveau_delai: 0,
    nouvelle_date_fin: "",
    date_signature: "",
    statut: "brouillon",
  });

  const resetAvenantForm = () => {
    setAvenantForm({
      objet: "",
      type_avenant: "",
      montant_modification: 0,
      nouveau_montant: contrat?.montant_actuel || contrat?.montant_initial || 0,
      nouveau_delai: 0,
      nouvelle_date_fin: "",
      date_signature: "",
      statut: "brouillon",
    });
  };

  const handleCreateAvenant = async () => {
    if (!contrat) return;
    await createAvenant.mutateAsync({
      contrat_id: contrat.id,
      ...avenantForm,
      nouveau_montant: avenantForm.nouveau_montant || undefined,
      nouveau_delai: avenantForm.nouveau_delai || undefined,
      nouvelle_date_fin: avenantForm.nouvelle_date_fin || undefined,
      date_signature: avenantForm.date_signature || undefined,
    });
    setAvenantOpen(false);
    resetAvenantForm();
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  const getStatutBadge = (statut: string) => {
    const s = STATUTS_CONTRAT.find(x => x.value === statut);
    return <Badge className={s?.color || ""}>{s?.label || statut}</Badge>;
  };

  if (!contrat) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrat {contrat.numero}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="avenants">
              Avenants ({avenants.data?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Prestataire</Label>
                <p className="font-medium">{prestataireName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium">{contrat.type_contrat}</p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Objet</Label>
              <p>{contrat.objet}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Montant initial</Label>
                <p className="font-medium">{formatMontant(contrat.montant_initial)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Montant actuel</Label>
                <p className="font-medium text-primary">{formatMontant(contrat.montant_actuel || contrat.montant_initial)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Date de signature</Label>
                <p>{contrat.date_signature ? format(new Date(contrat.date_signature), "dd MMMM yyyy", { locale: fr }) : "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date de notification</Label>
                <p>{contrat.date_notification ? format(new Date(contrat.date_notification), "dd MMMM yyyy", { locale: fr }) : "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Date début</Label>
                <p>{contrat.date_debut ? format(new Date(contrat.date_debut), "dd MMMM yyyy", { locale: fr }) : "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date fin</Label>
                <p>{contrat.date_fin ? format(new Date(contrat.date_fin), "dd MMMM yyyy", { locale: fr }) : "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Délai d'exécution</Label>
                <p>{contrat.delai_execution ? `${contrat.delai_execution} jours` : "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <div className="mt-1">{getStatutBadge(contrat.statut)}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="avenants" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historique des avenants
                </CardTitle>
                <Button size="sm" onClick={() => { resetAvenantForm(); setAvenantOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvel avenant
                </Button>
              </CardHeader>
              <CardContent>
                {!avenants.data?.length ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Aucun avenant pour ce contrat
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N°</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Objet</TableHead>
                        <TableHead className="text-right">Nouveau montant</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {avenants.data.map((avenant: Avenant) => (
                        <TableRow key={avenant.id}>
                          <TableCell>Avenant n°{avenant.numero_avenant}</TableCell>
                          <TableCell>{avenant.type_avenant}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{avenant.objet}</TableCell>
                          <TableCell className="text-right">
                            {avenant.nouveau_montant ? formatMontant(avenant.nouveau_montant) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={avenant.statut === "signe" ? "default" : "secondary"}>
                              {avenant.statut}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog nouvel avenant */}
        <Dialog open={avenantOpen} onOpenChange={setAvenantOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel avenant</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Type d'avenant *</Label>
                <Select value={avenantForm.type_avenant} onValueChange={(v) => setAvenantForm({ ...avenantForm, type_avenant: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_AVENANT.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objet *</Label>
                <Textarea
                  value={avenantForm.objet}
                  onChange={(e) => setAvenantForm({ ...avenantForm, objet: e.target.value })}
                  placeholder="Description de l'avenant..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Modification montant</Label>
                  <Input
                    type="number"
                    value={avenantForm.montant_modification}
                    onChange={(e) => {
                      const mod = Number(e.target.value);
                      setAvenantForm({ 
                        ...avenantForm, 
                        montant_modification: mod,
                        nouveau_montant: (contrat?.montant_actuel || contrat?.montant_initial || 0) + mod,
                      });
                    }}
                    placeholder="+/- montant"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nouveau montant</Label>
                  <Input
                    type="number"
                    value={avenantForm.nouveau_montant}
                    onChange={(e) => setAvenantForm({ ...avenantForm, nouveau_montant: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nouveau délai (jours)</Label>
                  <Input
                    type="number"
                    value={avenantForm.nouveau_delai}
                    onChange={(e) => setAvenantForm({ ...avenantForm, nouveau_delai: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nouvelle date fin</Label>
                  <Input
                    type="date"
                    value={avenantForm.nouvelle_date_fin}
                    onChange={(e) => setAvenantForm({ ...avenantForm, nouvelle_date_fin: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de signature</Label>
                  <Input
                    type="date"
                    value={avenantForm.date_signature}
                    onChange={(e) => setAvenantForm({ ...avenantForm, date_signature: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={avenantForm.statut} onValueChange={(v) => setAvenantForm({ ...avenantForm, statut: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brouillon">Brouillon</SelectItem>
                      <SelectItem value="en_negociation">En négociation</SelectItem>
                      <SelectItem value="signe">Signé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAvenantOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateAvenant} disabled={!avenantForm.type_avenant || !avenantForm.objet}>
                Créer l'avenant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
