import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Trophy, 
  FileText, 
  Loader2, 
  Star, 
  Trash2,
  Building2
} from "lucide-react";
import { useMarcheOffres, CreateOffreData } from "@/hooks/useMarcheOffres";
import { useMarches, Prestataire } from "@/hooks/useMarches";

interface MarcheOffresListProps {
  marcheId: string;
  isReadOnly?: boolean;
}

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

export function MarcheOffresList({ marcheId, isReadOnly = false }: MarcheOffresListProps) {
  const { offres, offreRetenue, createOffre, selectWinner, deleteOffre, isCreating, isSelecting } = useMarcheOffres(marcheId);
  const { prestataires } = useMarches();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAttributionDialog, setShowAttributionDialog] = useState(false);
  const [selectedOffreId, setSelectedOffreId] = useState<string | null>(null);
  const [motifAttribution, setMotifAttribution] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newOffre, setNewOffre] = useState<CreateOffreData>({
    marche_id: marcheId,
    prestataire_id: null,
    nom_fournisseur: "",
    montant_offre: 0,
    delai_execution: 30,
    note_technique: 70,
    note_financiere: 70,
    observations: "",
  });

  const handleAddOffre = async () => {
    await createOffre(newOffre);
    setShowAddDialog(false);
    setNewOffre({
      marche_id: marcheId,
      prestataire_id: null,
      nom_fournisseur: "",
      montant_offre: 0,
      delai_execution: 30,
      note_technique: 70,
      note_financiere: 70,
      observations: "",
    });
  };

  const handleAttribuer = async () => {
    if (!selectedOffreId || !motifAttribution) return;
    await selectWinner({ offreId: selectedOffreId, motif: motifAttribution });
    setShowAttributionDialog(false);
    setSelectedOffreId(null);
    setMotifAttribution("");
  };

  const handleDeleteOffre = async () => {
    if (!deleteConfirm) return;
    await deleteOffre(deleteConfirm);
    setDeleteConfirm(null);
  };

  const openAttributionDialog = (offreId: string) => {
    setSelectedOffreId(offreId);
    setShowAttributionDialog(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Tableau des offres ({offres.length})
        </CardTitle>
        {!isReadOnly && !offreRetenue && (
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une offre
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {offres.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune offre enregistrée
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-center">Délai (jours)</TableHead>
                <TableHead className="text-center">Note Tech.</TableHead>
                <TableHead className="text-center">Note Fin.</TableHead>
                <TableHead className="text-center">Note Globale</TableHead>
                <TableHead>Statut</TableHead>
                {!isReadOnly && !offreRetenue && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {offres.map((offre) => (
                <TableRow 
                  key={offre.id}
                  className={offre.est_retenu ? "bg-success/10" : ""}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {offre.prestataire?.raison_sociale || offre.nom_fournisseur}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMontant(offre.montant_offre)}
                  </TableCell>
                  <TableCell className="text-center">
                    {offre.delai_execution || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {offre.note_technique != null ? `${offre.note_technique}/100` : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {offre.note_financiere != null ? `${offre.note_financiere}/100` : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {offre.note_globale != null ? (
                      <Badge variant={offre.note_globale >= 70 ? "default" : "secondary"}>
                        {offre.note_globale.toFixed(1)}/100
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {offre.est_retenu ? (
                      <Badge className="bg-success text-success-foreground gap-1">
                        <Trophy className="h-3 w-3" />
                        Retenu
                      </Badge>
                    ) : (
                      <Badge variant="outline">En évaluation</Badge>
                    )}
                  </TableCell>
                  {!isReadOnly && !offreRetenue && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openAttributionDialog(offre.id)}
                          title="Retenir cette offre"
                        >
                          <Star className="h-4 w-4 text-warning" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirm(offre.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {offreRetenue && (
          <div className="mt-4 p-4 bg-success/10 rounded-lg">
            <h4 className="font-medium flex items-center gap-2 text-success">
              <Trophy className="h-4 w-4" />
              Fournisseur retenu
            </h4>
            <p className="text-sm mt-1">
              <strong>{offreRetenue.prestataire?.raison_sociale || offreRetenue.nom_fournisseur}</strong> - {formatMontant(offreRetenue.montant_offre)}
            </p>
            {offreRetenue.motif_selection && (
              <p className="text-sm text-muted-foreground mt-1">
                Motif: {offreRetenue.motif_selection}
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Dialog: Ajouter offre */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une offre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fournisseur (existant)</Label>
              <Select
                value={newOffre.prestataire_id || ""}
                onValueChange={(v) => setNewOffre({ 
                  ...newOffre, 
                  prestataire_id: v || null,
                  nom_fournisseur: ""
                })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionner un prestataire" />
                </SelectTrigger>
                <SelectContent>
                  {prestataires.map((p: Prestataire) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.raison_sociale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!newOffre.prestataire_id && (
              <div>
                <Label>Ou nom du fournisseur (nouveau)</Label>
                <Input
                  value={newOffre.nom_fournisseur || ""}
                  onChange={(e) => setNewOffre({ ...newOffre, nom_fournisseur: e.target.value })}
                  placeholder="Raison sociale"
                  className="mt-1.5"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Montant (FCFA) *</Label>
                <Input
                  type="number"
                  value={newOffre.montant_offre || ""}
                  onChange={(e) => setNewOffre({ ...newOffre, montant_offre: parseFloat(e.target.value) || 0 })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Délai (jours)</Label>
                <Input
                  type="number"
                  value={newOffre.delai_execution || ""}
                  onChange={(e) => setNewOffre({ ...newOffre, delai_execution: parseInt(e.target.value) || undefined })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Note technique (/100)</Label>
                <Input
                  type="number"
                  value={newOffre.note_technique || ""}
                  onChange={(e) => setNewOffre({ ...newOffre, note_technique: parseFloat(e.target.value) || undefined })}
                  className="mt-1.5"
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <Label>Note financière (/100)</Label>
                <Input
                  type="number"
                  value={newOffre.note_financiere || ""}
                  onChange={(e) => setNewOffre({ ...newOffre, note_financiere: parseFloat(e.target.value) || undefined })}
                  className="mt-1.5"
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div>
              <Label>Observations</Label>
              <Textarea
                value={newOffre.observations || ""}
                onChange={(e) => setNewOffre({ ...newOffre, observations: e.target.value })}
                className="mt-1.5"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddOffre} 
              disabled={isCreating || (!newOffre.prestataire_id && !newOffre.nom_fournisseur) || !newOffre.montant_offre}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Attribution */}
      <Dialog open={showAttributionDialog} onOpenChange={setShowAttributionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer le marché</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vous êtes sur le point de retenir cette offre et d'attribuer le marché au fournisseur sélectionné.
            </p>
            <div>
              <Label>Motif d'attribution *</Label>
              <Textarea
                value={motifAttribution}
                onChange={(e) => setMotifAttribution(e.target.value)}
                placeholder="Expliquez les raisons du choix de ce fournisseur..."
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAttributionDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAttribuer} 
              disabled={isSelecting || !motifAttribution.trim()}
            >
              {isSelecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer l'attribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert: Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOffre} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
