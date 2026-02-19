import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  Loader2,
  FileSignature,
  Building2,
  ShoppingCart,
  CreditCard,
  Lock,
} from 'lucide-react';
import { useEngagements, BudgetAvailability, TypeEngagement } from '@/hooks/useEngagements';
import { IndicateurBudget } from './IndicateurBudget';
import { BudgetLineSelector, SelectedBudgetLine } from '@/components/imputation/BudgetLineSelector';
import { DocumentUpload, UploadedDocument, DocumentType } from '@/components/shared/DocumentUpload';
import { usePrestataires } from '@/hooks/usePrestataires';
import { useExercice } from '@/contexts/ExerciceContext';
import { formatCurrency } from '@/lib/utils';

const SEUIL_HORS_MARCHE = 10_000_000;

const DOCUMENTS_ENGAGEMENT: DocumentType[] = [
  { code: 'bon_engagement', label: "Bon d'engagement", obligatoire: true },
  { code: 'devis_proforma', label: 'Devis / Facture proforma', obligatoire: true },
  { code: 'autre', label: 'Autre document', obligatoire: false },
];

interface EngagementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId?: string;
  /** ID de passation pré-sélectionnée (depuis onglet "À traiter") */
  preSelectedPassationId?: string | null;
}

export function EngagementForm({
  open,
  onOpenChange,
  dossierId,
  preSelectedPassationId,
}: EngagementFormProps) {
  const {
    expressionsValidees,
    passationsSignees,
    createEngagement,
    calculateAvailability,
    isCreating,
  } = useEngagements();
  const { exercice: _exercice } = useExercice();
  const { prestatairesActifs } = usePrestataires();

  // --- State ---
  const [typeEngagement, setTypeEngagement] = useState<TypeEngagement | ''>('');
  const [selectedPassationId, setSelectedPassationId] = useState<string>('');
  const [selectedExpressionId, setSelectedExpressionId] = useState<string>('');
  const [objet, setObjet] = useState('');
  const [montant, setMontant] = useState<number>(0);
  const [montantHT, setMontantHT] = useState<number>(0);
  const [tva, setTva] = useState<number>(0);
  const [fournisseur, setFournisseur] = useState('');
  const [useManualFournisseur, setUseManualFournisseur] = useState(false);
  const [selectedLines, setSelectedLines] = useState<SelectedBudgetLine[]>([]);
  const [availability, setAvailability] = useState<BudgetAvailability | null>(null);
  const [isCheckingBudget, setIsCheckingBudget] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  // Derived state
  const selectedPassation = passationsSignees.find((p) => p.id === selectedPassationId);
  const selectedExpression = expressionsValidees.find((e) => e.id === selectedExpressionId);
  const directionId =
    typeEngagement === 'sur_marche'
      ? selectedPassation?.expression_besoin?.direction_id
      : selectedExpression?.direction_id;

  // --- Pre-select passation from prop ---
  useEffect(() => {
    if (open && preSelectedPassationId && passationsSignees.length > 0) {
      const pm = passationsSignees.find((p) => p.id === preSelectedPassationId);
      if (pm) {
        setTypeEngagement('sur_marche');
        setSelectedPassationId(pm.id);
      }
    }
  }, [open, preSelectedPassationId, passationsSignees]);

  // --- Pre-fill from passation (sur_marche) ---
  useEffect(() => {
    if (typeEngagement !== 'sur_marche' || !selectedPassation) return;
    const pm = selectedPassation;
    const eb = pm.expression_besoin;
    setObjet(eb?.objet || '');
    const montantRetenu = pm.montant_retenu || eb?.montant_estime || 0;
    setMontant(montantRetenu);
    setMontantHT(montantRetenu);
    setTva(0);
    setFournisseur(pm.prestataire_retenu?.raison_sociale || '');
    setSelectedLines([]);
    setAvailability(null);
  }, [typeEngagement, selectedPassation]);

  // --- Pre-fill from expression (hors_marche) ---
  useEffect(() => {
    if (typeEngagement !== 'hors_marche' || !selectedExpression) return;
    setObjet(selectedExpression.objet);
    setMontant(selectedExpression.montant_estime || 0);
    setMontantHT(selectedExpression.montant_estime || 0);
    setTva(0);
    setFournisseur('');
    setSelectedLines([]);
    setAvailability(null);
  }, [typeEngagement, selectedExpression]);

  // --- Budget availability check ---
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
        console.error('Error checking budget availability:', error);
      } finally {
        setIsCheckingBudget(false);
      }
    };
    checkAvailability();
  }, [selectedLines, montant, calculateAvailability]);

  // --- Reset on close / type change ---
  useEffect(() => {
    if (!open) {
      setTypeEngagement('');
      setSelectedPassationId('');
      setSelectedExpressionId('');
      setObjet('');
      setMontant(0);
      setMontantHT(0);
      setTva(0);
      setFournisseur('');
      setUseManualFournisseur(false);
      setSelectedLines([]);
      setAvailability(null);
      setDocuments([]);
    }
  }, [open]);

  const handleTypeChange = (value: string) => {
    setTypeEngagement(value as TypeEngagement);
    setSelectedPassationId('');
    setSelectedExpressionId('');
    setObjet('');
    setMontant(0);
    setMontantHT(0);
    setTva(0);
    setFournisseur('');
    setUseManualFournisseur(false);
    setSelectedLines([]);
    setAvailability(null);
    setDocuments([]);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeEngagement) return;

    if (selectedLines.length === 0) {
      return;
    }

    if (availability && !availability.is_sufficient) {
      return;
    }

    // Determine expression_besoin_id
    const expressionId =
      typeEngagement === 'sur_marche'
        ? selectedPassation?.expression_besoin?.id || ''
        : selectedExpressionId;

    try {
      await createEngagement({
        type_engagement: typeEngagement,
        expression_besoin_id: expressionId,
        budget_line_id: selectedLines[0].id,
        objet,
        montant,
        montant_ht: montantHT || undefined,
        tva: tva || undefined,
        fournisseur,
        passation_marche_id: typeEngagement === 'sur_marche' ? selectedPassationId : undefined,
        dossier_id:
          typeEngagement === 'sur_marche'
            ? selectedPassation?.dossier_id || dossierId
            : selectedExpression?.dossier_id || dossierId,
      });
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur creation engagement:', message);
    }
  };

  // --- Validation ---
  const seuilDepasse = typeEngagement === 'hors_marche' && montant >= SEUIL_HORS_MARCHE;

  const canSubmit =
    typeEngagement !== '' &&
    objet.trim() !== '' &&
    montant > 0 &&
    selectedLines.length > 0 &&
    (availability?.is_sufficient ?? true) &&
    !isCreating &&
    !seuilDepasse &&
    (typeEngagement === 'sur_marche' ? !!selectedPassationId : !!selectedExpressionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Créer un engagement
          </DialogTitle>
          <DialogDescription>
            Choisissez le type d'engagement puis renseignez les informations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ========== ÉTAPE 1 : Type d'engagement ========== */}
          <div className="space-y-2">
            <Label>Type d'engagement *</Label>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all ${
                  typeEngagement === 'sur_marche'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleTypeChange('sur_marche')}
              >
                <CardContent className="pt-4 pb-3 text-center">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Sur marché</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lié à un marché signé/approuvé
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {passationsSignees.length} disponible(s)
                  </Badge>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all ${
                  typeEngagement === 'hors_marche'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleTypeChange('hors_marche')}
              >
                <CardContent className="pt-4 pb-3 text-center">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <h4 className="font-medium">Hors marché</h4>
                  <p className="text-xs text-muted-foreground mt-1">Bon de commande direct</p>
                  <Badge variant="outline" className="mt-2">
                    Saisie manuelle
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ========== SUR MARCHÉ : Sélecteur de marchés signés ========== */}
          {typeEngagement === 'sur_marche' && (
            <>
              <div className="space-y-2">
                <Label>Marché signé/approuvé *</Label>
                <Select value={selectedPassationId} onValueChange={setSelectedPassationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un marché signé" />
                  </SelectTrigger>
                  <SelectContent>
                    {passationsSignees.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.reference || 'PM'} — {pm.expression_besoin?.objet || 'N/A'} (
                        {formatCurrency(pm.montant_retenu || 0)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {passationsSignees.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aucun marché signé/approuvé disponible pour cet exercice.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Infos pré-remplies (lecture seule) */}
              {selectedPassation && (
                <Card className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Données héritées du marché (lecture seule)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Référence PM</Label>
                      <p className="font-mono font-medium">
                        {selectedPassation.reference || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Mode de passation</Label>
                      <Badge variant="outline">{selectedPassation.mode_passation}</Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Statut</Label>
                      <Badge
                        variant={selectedPassation.statut === 'signe' ? 'default' : 'secondary'}
                      >
                        {selectedPassation.statut === 'signe' ? 'Signé' : 'Approuvé'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Prestataire</Label>
                      <p className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {selectedPassation.prestataire_retenu?.raison_sociale || 'Non défini'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Direction</Label>
                      <p>
                        {selectedPassation.expression_besoin?.direction?.sigle ||
                          selectedPassation.expression_besoin?.direction?.label ||
                          'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Montant retenu</Label>
                      <p className="font-bold text-primary">
                        {formatCurrency(selectedPassation.montant_retenu || 0)}
                      </p>
                    </div>
                    {selectedPassation.expression_besoin && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-muted-foreground">
                          Expression de besoin
                        </Label>
                        <p className="text-sm">
                          {selectedPassation.expression_besoin.numero} —{' '}
                          {selectedPassation.expression_besoin.objet}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ========== HORS MARCHÉ : Sélecteur d'expressions de besoin ========== */}
          {typeEngagement === 'hors_marche' && (
            <>
              <div className="space-y-2">
                <Label>Expression de besoin validée *</Label>
                <Select value={selectedExpressionId} onValueChange={setSelectedExpressionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une expression de besoin" />
                  </SelectTrigger>
                  <SelectContent>
                    {expressionsValidees.map((expr) => (
                      <SelectItem key={expr.id} value={expr.id}>
                        {expr.numero} — {expr.objet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExpression && (
                <Card className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Expression de besoin source
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Référence</Label>
                      <p className="font-mono">{selectedExpression.numero || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Direction</Label>
                      <p>{selectedExpression.direction?.label || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Montant estimé</Label>
                      <p className="font-medium">
                        {formatCurrency(selectedExpression.montant_estime || 0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ========== CHAMPS COMMUNS (après sélection source) ========== */}
          {((typeEngagement === 'sur_marche' && selectedPassation) ||
            (typeEngagement === 'hors_marche' && selectedExpression)) && (
            <>
              <Separator />

              {/* Objet */}
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

              {/* Montants */}
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
                  {typeEngagement === 'sur_marche' && (
                    <p className="text-xs text-muted-foreground">
                      Pré-rempli depuis le marché. Modifiable pour engagement partiel.
                    </p>
                  )}
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

              {/* Seuil hors marché */}
              {seuilDepasse && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Seuil dépassé</AlertTitle>
                  <AlertDescription>
                    Un marché est nécessaire au-delà de {formatCurrency(SEUIL_HORS_MARCHE)}.
                    Veuillez créer une passation de marché.
                  </AlertDescription>
                </Alert>
              )}

              {/* Fournisseur */}
              <div className="space-y-2">
                <Label htmlFor="fournisseur">Prestataire / Fournisseur *</Label>
                {typeEngagement === 'sur_marche' ? (
                  <Input id="fournisseur" value={fournisseur} readOnly className="bg-muted" />
                ) : useManualFournisseur ? (
                  <div className="space-y-1">
                    <Input
                      id="fournisseur"
                      value={fournisseur}
                      onChange={(e) => setFournisseur(e.target.value)}
                      placeholder="Saisir le nom du fournisseur"
                      required
                    />
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        setUseManualFournisseur(false);
                        setFournisseur('');
                      }}
                    >
                      Choisir dans la liste
                    </button>
                  </div>
                ) : (
                  <Select
                    value={fournisseur}
                    onValueChange={(val) => {
                      if (val === '__autre__') {
                        setUseManualFournisseur(true);
                        setFournisseur('');
                      } else {
                        setFournisseur(val);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un prestataire" />
                    </SelectTrigger>
                    <SelectContent>
                      {prestatairesActifs.map((p) => (
                        <SelectItem key={p.id} value={p.raison_sociale}>
                          {p.raison_sociale}
                        </SelectItem>
                      ))}
                      <SelectItem value="__autre__">Autre (saisie libre)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Separator />

              {/* Ligne budgétaire */}
              <BudgetLineSelector
                montantTotal={montant}
                selectedLines={selectedLines}
                onSelectionChange={setSelectedLines}
                directionId={directionId}
                showFilters={true}
              />

              {/* Budget availability */}
              {selectedLines.length > 0 && (
                <IndicateurBudget
                  availability={availability}
                  isLoading={isCheckingBudget}
                  budgetLine={
                    selectedLines[0]
                      ? { code: selectedLines[0].code, label: selectedLines[0].label }
                      : null
                  }
                />
              )}

              <Separator />

              {/* Documents */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Pièces justificatives
                  <Badge variant="outline" className="text-xs">
                    {DOCUMENTS_ENGAGEMENT.filter((d) => d.obligatoire).length} obligatoires
                  </Badge>
                </Label>
                <DocumentUpload
                  documentTypes={DOCUMENTS_ENGAGEMENT}
                  documents={documents}
                  onDocumentsChange={setDocuments}
                />
                {documents.length < DOCUMENTS_ENGAGEMENT.filter((d) => d.obligatoire).length && (
                  <Alert className="border-warning/50 bg-warning/10">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm text-muted-foreground">
                      Les pièces obligatoires pourront être ajoutées après création de l'engagement,
                      mais seront requises pour la validation.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!canSubmit}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CreditCard className="mr-2 h-4 w-4" />
                  Créer l'engagement
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
