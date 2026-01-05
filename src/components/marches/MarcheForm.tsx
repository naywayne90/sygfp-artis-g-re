import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  FileText, 
  Loader2, 
  Save, 
  Target, 
  CreditCard,
  Calendar,
  Banknote,
  AlertTriangle,
  Search
} from "lucide-react";
import { 
  useMarches, 
  TYPES_MARCHE, 
  TYPES_PROCEDURE, 
  MarcheFormData,
  Prestataire 
} from "@/hooks/useMarches";
import { supabase } from "@/integrations/supabase/client";

interface NoteImputation {
  id: string;
  numero: string | null;
  objet: string;
  montant_estime: number | null;
  // Rattachement programmatique
  os?: { code: string; libelle: string } | null;
  mission?: { code: string; libelle: string } | null;
  action?: { code: string; libelle: string } | null;
  activite?: { code: string; libelle: string } | null;
  direction?: { sigle: string; label: string } | null;
  budget_line?: {
    os_id: string | null;
    mission_id: string | null;
    action_id: string | null;
    activite_id: string | null;
    direction_id: string | null;
    sous_activite_id: string | null;
  } | null;
}

interface MarcheFormProps {
  noteId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MarcheForm({ noteId, onSuccess, onCancel }: MarcheFormProps) {
  const { prestataires, notesImputees, createMarche, isCreating } = useMarches();
  
  const [selectedNote, setSelectedNote] = useState<NoteImputation | null>(null);
  const [selectedPrestataire, setSelectedPrestataire] = useState<Prestataire | null>(null);
  const [prestataireSearch, setPrestataireSearch] = useState("");
  
  const [formData, setFormData] = useState<Partial<MarcheFormData>>({
    objet: "",
    montant: 0,
    mode_passation: "consultation",
    type_marche: "fourniture",
    type_procedure: "consultation",
    nombre_lots: 1,
    numero_lot: 1,
    intitule_lot: "",
    duree_execution: 30,
    observations: "",
    note_id: noteId,
  });

  // Charger la note si fournie
  useEffect(() => {
    if (noteId) {
      const note = notesImputees.find(n => n.id === noteId);
      if (note) {
        setSelectedNote(note as any);
        setFormData(prev => ({
          ...prev,
          objet: note.objet,
          montant: note.montant_estime || 0,
          note_id: note.id,
        }));
      }
    }
  }, [noteId, notesImputees]);

  // Filtrer les prestataires
  const filteredPrestataires = prestataires.filter(
    p => p.raison_sociale.toLowerCase().includes(prestataireSearch.toLowerCase()) ||
         p.code?.toLowerCase().includes(prestataireSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.objet || !formData.montant) {
      return;
    }

    try {
      await createMarche({
        ...formData,
        prestataire_id: selectedPrestataire?.id,
      } as MarcheFormData);
      onSuccess?.();
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const needsJustification = formData.type_procedure === "gre_a_gre";

  return (
    <div className="space-y-6">
      {/* Informations programmatiques (lecture seule si note sélectionnée) */}
      {selectedNote && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Rattachement programmatique
            </CardTitle>
            <CardDescription>
              Informations issues de l'imputation de la note {selectedNote.numero}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <span className="text-muted-foreground">Direction:</span>
                <p className="font-medium">{selectedNote.direction?.sigle || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Objectif Stratégique:</span>
                <p className="font-medium">{selectedNote.os?.code || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Mission:</span>
                <p className="font-medium">{selectedNote.mission?.code || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Action:</span>
                <p className="font-medium">{selectedNote.action?.code || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Activité:</span>
                <p className="font-medium">{selectedNote.activite?.code || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Montant estimé:</span>
                <p className="font-medium">{formatMontant(selectedNote.montant_estime || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sélection de la note si pas fournie */}
      {!noteId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Note d'origine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.note_id || ""}
              onValueChange={(v) => {
                const note = notesImputees.find(n => n.id === v);
                if (note) {
                  setSelectedNote(note as any);
                  setFormData(prev => ({
                    ...prev,
                    note_id: v,
                    objet: note.objet,
                    montant: note.montant_estime || 0,
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une note imputée" />
              </SelectTrigger>
              <SelectContent>
                {notesImputees.map((note: any) => (
                  <SelectItem key={note.id} value={note.id}>
                    <span className="font-mono text-xs">{note.numero}</span> - {note.objet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fournisseur / Bénéficiaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Bénéficiaire / Fournisseur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Rechercher un prestataire</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={prestataireSearch}
                  onChange={(e) => setPrestataireSearch(e.target.value)}
                  placeholder="Rechercher par nom ou code..."
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedPrestataire?.id || ""}
                onValueChange={(v) => {
                  const p = prestataires.find(x => x.id === v);
                  setSelectedPrestataire(p || null);
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner un prestataire" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredPrestataires.slice(0, 30).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.raison_sociale}</span>
                        <span className="text-xs text-muted-foreground">{p.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPrestataire && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Raison sociale:</span>
                  <span className="font-medium">{selectedPrestataire.raison_sociale}</span>
                </div>
                {selectedPrestataire.sigle && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sigle:</span>
                    <span>{selectedPrestataire.sigle}</span>
                  </div>
                )}
                {selectedPrestataire.rccm && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RCCM:</span>
                    <span className="font-mono text-xs">{selectedPrestataire.rccm}</span>
                  </div>
                )}
                {selectedPrestataire.ninea && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NINEA:</span>
                    <span className="font-mono text-xs">{selectedPrestataire.ninea}</span>
                  </div>
                )}
                <Separator />
                {selectedPrestataire.banque && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banque:</span>
                    <span>{selectedPrestataire.banque}</span>
                  </div>
                )}
                {selectedPrestataire.numero_compte && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Compte:</span>
                    <span className="font-mono text-xs">{selectedPrestataire.numero_compte}</span>
                  </div>
                )}
                {selectedPrestataire.mode_paiement && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mode paiement:</span>
                    <Badge variant="outline">{selectedPrestataire.mode_paiement}</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Références passation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Références de passation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Type de marché *</Label>
                <Select
                  value={formData.type_marche}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type_marche: v }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_MARCHE.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de procédure *</Label>
                <Select
                  value={formData.type_procedure}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type_procedure: v }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_PROCEDURE.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nombre de lots</Label>
                <Input
                  type="number"
                  value={formData.nombre_lots || 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre_lots: parseInt(e.target.value) || 1 }))}
                  className="mt-1.5"
                  min={1}
                />
              </div>

              <div>
                <Label>Numéro de lot</Label>
                <Input
                  type="number"
                  value={formData.numero_lot || 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_lot: parseInt(e.target.value) || 1 }))}
                  className="mt-1.5"
                  min={1}
                />
              </div>
            </div>

            <div>
              <Label>Intitulé du lot</Label>
              <Input
                value={formData.intitule_lot || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, intitule_lot: e.target.value }))}
                className="mt-1.5"
                placeholder="Ex: Lot 1 - Fournitures informatiques"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Date d'attribution</Label>
                <Input
                  type="date"
                  value={formData.date_attribution || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_attribution: e.target.value }))}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Durée d'exécution (jours)</Label>
                <Input
                  type="number"
                  value={formData.duree_execution || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, duree_execution: parseInt(e.target.value) || undefined }))}
                  className="mt-1.5"
                  min={1}
                  placeholder="30"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objet et Montant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5" />
            Objet et montant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="objet">Objet du marché *</Label>
            <Input
              id="objet"
              value={formData.objet}
              onChange={(e) => setFormData(prev => ({ ...prev, objet: e.target.value }))}
              className="mt-1.5"
              placeholder="Description de l'objet du marché..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="montant">Montant du marché (FCFA) *</Label>
              <Input
                id="montant"
                type="number"
                value={formData.montant || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, montant: parseFloat(e.target.value) || 0 }))}
                className="mt-1.5"
                min={0}
              />
            </div>
            <div className="flex items-end">
              <p className="text-2xl font-bold text-primary">
                {formatMontant(formData.montant || 0)}
              </p>
            </div>
          </div>

          <div>
            <Label>Observations</Label>
            <Textarea
              value={formData.observations || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              className="mt-1.5"
              rows={3}
              placeholder="Remarques ou observations..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Justification gré à gré */}
      {needsJustification && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p>
              <strong>Procédure de gré à gré :</strong> Une justification est obligatoire.
            </p>
            <div>
              <Label>Justification de la dérogation *</Label>
              <Textarea
                value={formData.justification_derogation || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  justification_derogation: e.target.value,
                  mode_force: true 
                }))}
                className="mt-1.5"
                rows={3}
                placeholder="Expliquez les raisons du recours au gré à gré..."
              />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            isCreating ||
            !formData.objet ||
            !formData.montant ||
            (needsJustification && !formData.justification_derogation?.trim())
          }
        >
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Créer le marché
        </Button>
      </div>
    </div>
  );
}
