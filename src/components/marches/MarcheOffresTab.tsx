import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Users, 
  Plus, 
  Award, 
  Star, 
  Loader2, 
  Trophy,
  Building2
} from "lucide-react";
import { useMarcheOffres, CreateOffreData } from "@/hooks/useMarcheOffres";
import { useMarches } from "@/hooks/useMarches";

interface MarcheOffresTabProps {
  marcheId: string;
  canEdit?: boolean;
}

export function MarcheOffresTab({ marcheId, canEdit = true }: MarcheOffresTabProps) {
  const { 
    offres, 
    offreRetenue,
    isLoading, 
    createOffre, 
    selectWinner,
    isCreating,
    isSelecting 
  } = useMarcheOffres(marcheId);
  const { prestataires } = useMarches();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSelectDialog, setShowSelectDialog] = useState(false);
  const [selectedOffreId, setSelectedOffreId] = useState<string | null>(null);
  const [selectionMotif, setSelectionMotif] = useState("");
  
  const [formData, setFormData] = useState<Partial<CreateOffreData>>({
    marche_id: marcheId,
    prestataire_id: null,
    nom_fournisseur: "",
    montant_offre: 0,
    delai_execution: 0,
    note_technique: 0,
    note_financiere: 0,
    observations: "",
  });

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const handleAdd = async () => {
    if (!formData.montant_offre) return;

    await createOffre({
      ...formData,
      marche_id: marcheId,
    } as CreateOffreData);

    setFormData({
      marche_id: marcheId,
      prestataire_id: null,
      nom_fournisseur: "",
      montant_offre: 0,
      delai_execution: 0,
      note_technique: 0,
      note_financiere: 0,
      observations: "",
    });
    setShowAddDialog(false);
  };

  const handleSelectWinner = async () => {
    if (!selectedOffreId || !selectionMotif.trim()) return;

    await selectWinner({ offreId: selectedOffreId, motif: selectionMotif });
    setShowSelectDialog(false);
    setSelectedOffreId(null);
    setSelectionMotif("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Offres reçues
            </CardTitle>
            <CardDescription>
              Prestataires consultés et évaluation des offres
            </CardDescription>
          </div>
          {canEdit && !offreRetenue && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Ajouter une offre
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Ajouter une offre</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Prestataire du référentiel</Label>
                    <Select
                      value={formData.prestataire_id || ""}
                      onValueChange={(v) => setFormData(prev => ({ 
                        ...prev, 
                        prestataire_id: v || null,
                        nom_fournisseur: prestataires.find(p => p.id === v)?.raison_sociale || ""
                      }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Sélectionner ou saisir manuellement" />
                      </SelectTrigger>
                      <SelectContent>
                        {prestataires.slice(0, 50).map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.raison_sociale}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Ou nom du fournisseur (si non référencé)</Label>
                    <Input
                      value={formData.nom_fournisseur || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, nom_fournisseur: e.target.value }))}
                      className="mt-1.5"
                      placeholder="Raison sociale..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Montant offre (FCFA) *</Label>
                      <Input
                        type="number"
                        value={formData.montant_offre || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, montant_offre: parseFloat(e.target.value) || 0 }))}
                        className="mt-1.5"
                        min={0}
                      />
                    </div>
                    <div>
                      <Label>Délai (jours)</Label>
                      <Input
                        type="number"
                        value={formData.delai_execution || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, delai_execution: parseInt(e.target.value) || 0 }))}
                        className="mt-1.5"
                        min={0}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Note technique (/100)</Label>
                      <Input
                        type="number"
                        value={formData.note_technique || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, note_technique: parseFloat(e.target.value) || 0 }))}
                        className="mt-1.5"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <Label>Note financière (/100)</Label>
                      <Input
                        type="number"
                        value={formData.note_financiere || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, note_financiere: parseFloat(e.target.value) || 0 }))}
                        className="mt-1.5"
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Observations</Label>
                    <Textarea
                      value={formData.observations || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAdd} disabled={isCreating || !formData.montant_offre}>
                      {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Ajouter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {offreRetenue && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Trophy className="h-5 w-5" />
              <span className="font-medium">Fournisseur retenu :</span>
              <span>{offreRetenue.prestataire?.raison_sociale || offreRetenue.nom_fournisseur}</span>
              <Badge className="bg-green-100 text-green-700">{formatMontant(offreRetenue.montant_offre)}</Badge>
            </div>
            {offreRetenue.motif_selection && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-300">
                Motif : {offreRetenue.motif_selection}
              </p>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : offres.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune offre enregistrée</p>
            {canEdit && (
              <p className="text-sm mt-2">Cliquez sur "Ajouter une offre" pour saisir les offres reçues</p>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">Délai</TableHead>
                  <TableHead className="text-center">Note Tech.</TableHead>
                  <TableHead className="text-center">Note Fin.</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  {canEdit && !offreRetenue && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {offres.map((offre) => (
                  <TableRow key={offre.id} className={offre.est_retenu ? "bg-green-50 dark:bg-green-950/20" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {offre.est_retenu && <Trophy className="h-4 w-4 text-green-600" />}
                        <div>
                          <p className="font-medium">{offre.prestataire?.raison_sociale || offre.nom_fournisseur}</p>
                          {offre.prestataire?.code && (
                            <p className="text-xs text-muted-foreground font-mono">{offre.prestataire.code}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(offre.montant_offre)}
                    </TableCell>
                    <TableCell className="text-center">
                      {offre.delai_execution ? `${offre.delai_execution}j` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {offre.note_technique ?? "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {offre.note_financiere ?? "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {offre.note_globale ? (
                        <Badge variant={offre.est_retenu ? "default" : "secondary"}>
                          <Star className="h-3 w-3 mr-1" />
                          {offre.note_globale.toFixed(1)}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    {canEdit && !offreRetenue && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setSelectedOffreId(offre.id);
                            setShowSelectDialog(true);
                          }}
                        >
                          <Award className="h-4 w-4" />
                          Retenir
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog sélection gagnant */}
        <Dialog open={showSelectDialog} onOpenChange={setShowSelectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retenir ce fournisseur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cette action attribuera le marché au fournisseur sélectionné.
              </p>
              <div>
                <Label>Motif de sélection *</Label>
                <Textarea
                  value={selectionMotif}
                  onChange={(e) => setSelectionMotif(e.target.value)}
                  className="mt-1.5"
                  rows={3}
                  placeholder="Justification du choix de ce fournisseur..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSelectDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleSelectWinner} 
                  disabled={isSelecting || !selectionMotif.trim()}
                  className="gap-1"
                >
                  {isSelecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Award className="h-4 w-4" />
                  Attribuer le marché
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
