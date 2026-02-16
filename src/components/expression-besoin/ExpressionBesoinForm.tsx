import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useExpressionsBesoin, MarcheValide, URGENCE_OPTIONS } from '@/hooks/useExpressionsBesoin';
import { useExercice } from '@/contexts/ExerciceContext';
import { Briefcase, Calendar, Loader2, Search } from 'lucide-react';
import { formatMontant } from '@/lib/config/sygfp-constants';

interface ExpressionBesoinFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marchePreselectionne?: MarcheValide | null;
}

export function ExpressionBesoinForm({
  open,
  onOpenChange,
  marchePreselectionne,
}: ExpressionBesoinFormProps) {
  const { exercice } = useExercice();
  const { marchesValides, createExpression, isCreating } = useExpressionsBesoin();

  const [selectedMarche, setSelectedMarche] = useState<MarcheValide | null>(null);
  const [searchMarche, setSearchMarche] = useState('');
  const [formData, setFormData] = useState({
    objet: '',
    description: '',
    justification: '',
    specifications: '',
    calendrier_debut: '',
    calendrier_fin: '',
    montant_estime: '',
    urgence: 'normale',
    numero_lot: '',
    intitule_lot: '',
  });

  // Auto-select marché if pre-selected
  useEffect(() => {
    if (marchePreselectionne) {
      setSelectedMarche(marchePreselectionne);
      setFormData((prev) => ({
        ...prev,
        objet: marchePreselectionne.objet,
        montant_estime: marchePreselectionne.montant.toString(),
      }));
    }
  }, [marchePreselectionne]);

  const filteredMarches = marchesValides.filter(
    (m) =>
      m.numero?.toLowerCase().includes(searchMarche.toLowerCase()) ||
      m.objet.toLowerCase().includes(searchMarche.toLowerCase()) ||
      m.prestataire?.raison_sociale.toLowerCase().includes(searchMarche.toLowerCase())
  );

  const handleSelectMarche = (marche: MarcheValide) => {
    setSelectedMarche(marche);
    setFormData((prev) => ({
      ...prev,
      objet: marche.objet,
      montant_estime: marche.montant.toString(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarche) return;

    await createExpression({
      marche_id: selectedMarche.id,
      objet: formData.objet,
      description: formData.description || null,
      justification: formData.justification || null,
      specifications: formData.specifications || null,
      calendrier_debut: formData.calendrier_debut || null,
      calendrier_fin: formData.calendrier_fin || null,
      montant_estime: formData.montant_estime ? parseFloat(formData.montant_estime) : null,
      urgence: formData.urgence,
      numero_lot: formData.numero_lot ? parseInt(formData.numero_lot) : null,
      intitule_lot: formData.intitule_lot || null,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMarche(null);
    setSearchMarche('');
    setFormData({
      objet: '',
      description: '',
      justification: '',
      specifications: '',
      calendrier_debut: '',
      calendrier_fin: '',
      montant_estime: '',
      urgence: 'normale',
      numero_lot: '',
      intitule_lot: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une expression de besoin</DialogTitle>
          <DialogDescription>
            Créer une expression de besoin à partir d'un marché validé - Exercice {exercice}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection du marché */}
          {!selectedMarche ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Sélectionner un marché validé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par numéro, objet ou fournisseur..."
                    value={searchMarche}
                    onChange={(e) => setSearchMarche(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredMarches.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun marché validé disponible
                    </p>
                  ) : (
                    filteredMarches.map((marche) => (
                      <div
                        key={marche.id}
                        onClick={() => handleSelectMarche(marche)}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{marche.numero || 'N° en attente'}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {marche.objet}
                            </p>
                            {marche.prestataire && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {marche.prestataire.raison_sociale}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">{formatMontant(marche.montant)}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Informations du marché sélectionné */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Marché sélectionné
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMarche(null)}
                    >
                      Changer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Numéro:</span>{' '}
                      <span className="font-medium">{selectedMarche.numero || 'En attente'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Montant:</span>{' '}
                      <span className="font-medium">{formatMontant(selectedMarche.montant)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Objet:</span>{' '}
                      <span className="font-medium">{selectedMarche.objet}</span>
                    </div>
                    {selectedMarche.prestataire && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Fournisseur:</span>{' '}
                        <span className="font-medium">
                          {selectedMarche.prestataire.raison_sociale}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Détails du besoin */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="objet">Objet *</Label>
                  <Input
                    id="objet"
                    value={formData.objet}
                    onChange={(e) => setFormData((prev) => ({ ...prev, objet: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description détaillée du besoin</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    placeholder="Décrivez le besoin en détail..."
                  />
                </div>

                <div>
                  <Label htmlFor="justification">Justification</Label>
                  <Textarea
                    id="justification"
                    value={formData.justification}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, justification: e.target.value }))
                    }
                    rows={2}
                    placeholder="Pourquoi ce besoin est-il nécessaire ?"
                  />
                </div>

                <div>
                  <Label htmlFor="specifications">Spécifications techniques</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, specifications: e.target.value }))
                    }
                    rows={3}
                    placeholder="Spécifications techniques, caractéristiques requises..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="montant_estime">Montant estimé (FCFA)</Label>
                    <Input
                      id="montant_estime"
                      type="number"
                      value={formData.montant_estime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, montant_estime: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="urgence">Niveau d'urgence</Label>
                    <Select
                      value={formData.urgence}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, urgence: value }))
                      }
                    >
                      <SelectTrigger id="urgence">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {URGENCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="calendrier_debut">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Date début souhaitée
                    </Label>
                    <Input
                      id="calendrier_debut"
                      type="date"
                      value={formData.calendrier_debut}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, calendrier_debut: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="calendrier_fin">Date fin souhaitée</Label>
                    <Input
                      id="calendrier_fin"
                      type="date"
                      value={formData.calendrier_fin}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, calendrier_fin: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Lots optionnels */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Lot (optionnel)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="numero_lot">Numéro du lot</Label>
                        <Input
                          id="numero_lot"
                          type="number"
                          min="1"
                          value={formData.numero_lot}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, numero_lot: e.target.value }))
                          }
                          placeholder="Ex: 1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="intitule_lot">Intitulé du lot</Label>
                        <Input
                          id="intitule_lot"
                          value={formData.intitule_lot}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, intitule_lot: e.target.value }))
                          }
                          placeholder="Intitulé du lot"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!selectedMarche || isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'expression de besoin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
