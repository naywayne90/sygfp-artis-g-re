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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  usePassationsMarche,
  PROCEDURES_PASSATION,
  DECISIONS_SORTIE,
  MIN_SOUMISSIONNAIRES,
  getSeuilForMontant,
  isProcedureCoherente,
  EBValidee,
  LotMarche,
  DecisionSortie,
} from '@/hooks/usePassationsMarche';
import { useBudgetAvailability } from '@/hooks/useBudgetAvailability';
import type { ExpressionBesoinLigne } from '@/hooks/useExpressionsBesoin';
import { usePrestataires } from '@/hooks/usePrestataires';
import { useExercice } from '@/contexts/ExerciceContext';
import { cn } from '@/lib/utils';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Loader2,
  Users,
  ClipboardList,
  Gavel,
  Building2,
  Package,
  ArrowRight,
  FileCheck,
  CreditCard,
  AlertTriangle,
  Upload,
  UserPlus,
} from 'lucide-react';

interface PassationMarcheFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceEB?: EBValidee | null;
  onSuccess?: () => void;
}

interface PrestataireSollicite {
  id: string;
  prestataire_id: string;
  raison_sociale: string;
  offre_montant: number | null;
  offre_documents: string[];
  note_technique: number | null;
  note_financiere: number | null;
  selectionne: boolean;
  is_manual_entry: boolean;
}

export function PassationMarcheForm({
  open,
  onOpenChange,
  sourceEB,
  onSuccess,
}: PassationMarcheFormProps) {
  const { exercice } = useExercice();
  const { ebValidees, createPassation, isCreating } = usePassationsMarche();
  const { prestataires } = usePrestataires();

  const [activeStep, setActiveStep] = useState('mode');
  const [selectedEB, setSelectedEB] = useState<EBValidee | null>(null);
  const [searchEB, setSearchEB] = useState('');
  const [searchPrestataire, setSearchPrestataire] = useState('');
  const [manualName, setManualName] = useState('');

  const [formData, setFormData] = useState({
    mode_passation: 'entente_directe',
    // Décision
    decision: '' as DecisionSortie | '',
    justification_decision: '',
    motif_selection: '',
    // Dates lifecycle
    date_publication: '',
    date_cloture: '',
  });

  // Lots (allotissement)
  const [allotissement, setAllotissement] = useState(false);
  const [lots, setLots] = useState<LotMarche[]>([]);

  const [prestatairesSollicites, setPrestatairesSollicites] = useState<PrestataireSollicite[]>([]);
  const [criteres, setCriteres] = useState([
    { nom: 'Prix', poids: 40 },
    { nom: 'Qualité technique', poids: 30 },
    { nom: 'Délai', poids: 20 },
    { nom: 'Références', poids: 10 },
  ]);

  // Budget disponible sur la ligne EB
  const { lineAvailability } = useBudgetAvailability(selectedEB?.ligne_budgetaire_id || undefined);

  // Articles de l'EB sélectionnée
  const articles: ExpressionBesoinLigne[] = (selectedEB?.liste_articles ||
    []) as ExpressionBesoinLigne[];

  // Seuil DGMP coloré
  const seuilDGMP = getSeuilForMontant(selectedEB?.montant_estime ?? null);

  // Calculs lots
  const totalLots = lots.reduce((sum, l) => sum + (l.montant_estime || 0), 0);
  const montantMarche = selectedEB?.montant_estime || 0;
  const lotsExceedMontant =
    allotissement && lots.length > 0 && totalLots > montantMarche && montantMarche > 0;
  const lotsMismatchMontant =
    allotissement &&
    lots.length > 0 &&
    totalLots !== montantMarche &&
    montantMarche > 0 &&
    !lotsExceedMontant;

  // Soumissionnaires
  const soumissionnairesCount = prestatairesSollicites.length;
  const minRequired = MIN_SOUMISSIONNAIRES[formData.mode_passation] || 1;
  const insufficientSoumissionnaires =
    soumissionnairesCount > 0 && soumissionnairesCount < minRequired;

  // Gestion des lots
  const handleAddLot = () => {
    const newLot: LotMarche = {
      id: crypto.randomUUID(),
      numero: lots.length + 1,
      designation: '',
      description: '',
      montant_estime: null,
    };
    setLots([...lots, newLot]);
  };

  const handleRemoveLot = (id: string) => {
    setLots((prev) => prev.filter((l) => l.id !== id).map((l, idx) => ({ ...l, numero: idx + 1 })));
  };

  const handleLotChange = (id: string, field: keyof LotMarche, value: string | number | null) => {
    setLots((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  // Sélection d'une EB avec auto-select procédure
  const handleSelectEB = (eb: EBValidee) => {
    setSelectedEB(eb);
    const seuil = getSeuilForMontant(eb.montant_estime);
    if (seuil) {
      setFormData((prev) => ({ ...prev, mode_passation: seuil.procedure }));
    }
  };

  // Auto-select EB si fournie
  useEffect(() => {
    if (sourceEB) {
      handleSelectEB(sourceEB);
    }
  }, [sourceEB]);

  const filteredEBs = ebValidees.filter(
    (eb) =>
      eb.numero?.toLowerCase().includes(searchEB.toLowerCase()) ||
      eb.objet.toLowerCase().includes(searchEB.toLowerCase())
  );

  const filteredPrestataires = prestataires?.filter(
    (p) =>
      !prestatairesSollicites.find((ps) => ps.prestataire_id === p.id) &&
      (p.raison_sociale?.toLowerCase().includes(searchPrestataire.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchPrestataire.toLowerCase()))
  );

  const handleAddPrestataire = (prestataire: { id: string; raison_sociale: string }) => {
    setPrestatairesSollicites((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        prestataire_id: prestataire.id,
        raison_sociale: prestataire.raison_sociale,
        offre_montant: null,
        offre_documents: [],
        note_technique: null,
        note_financiere: null,
        selectionne: false,
        is_manual_entry: false,
      },
    ]);
    setSearchPrestataire('');
  };

  const handleAddManualPrestataire = () => {
    const name = manualName.trim();
    if (!name) return;
    setPrestatairesSollicites((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        prestataire_id: '',
        raison_sociale: name,
        offre_montant: null,
        offre_documents: [],
        note_technique: null,
        note_financiere: null,
        selectionne: false,
        is_manual_entry: true,
      },
    ]);
    setManualName('');
  };

  const handleRemovePrestataire = (id: string) => {
    setPrestatairesSollicites((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePrestataireChange = (
    id: string,
    field: keyof PrestataireSollicite,
    value: string | number | boolean | string[] | null
  ) => {
    setPrestatairesSollicites((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = async () => {
    if (!selectedEB) return;

    // Trouver le prestataire sélectionné
    const prestataireRetenu = prestatairesSollicites.find((p) => p.selectionne);

    await createPassation({
      expression_besoin_id: selectedEB.id,
      mode_passation: formData.mode_passation,
      prestataires_sollicites: prestatairesSollicites.map((p) => ({
        prestataire_id: p.prestataire_id,
        raison_sociale: p.raison_sociale,
        offre_montant: p.offre_montant,
        note_technique: p.note_technique,
        note_financiere: p.note_financiere,
        selectionne: p.selectionne,
      })),
      criteres_evaluation: criteres,
      // Nouveaux champs
      allotissement,
      lots: allotissement ? lots : [],
      decision: formData.decision || undefined,
      justification_decision: formData.justification_decision || undefined,
      prestataire_retenu_id: prestataireRetenu?.prestataire_id,
      montant_retenu: prestataireRetenu?.offre_montant || undefined,
      motif_selection: formData.motif_selection || undefined,
      date_publication: formData.date_publication || undefined,
      date_cloture: formData.date_cloture || undefined,
    });

    onOpenChange(false);
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setSelectedEB(null);
    setSearchEB('');
    setActiveStep('mode');
    setFormData({
      mode_passation: 'entente_directe',
      decision: '',
      justification_decision: '',
      motif_selection: '',
      date_publication: '',
      date_cloture: '',
    });
    setAllotissement(false);
    setLots([]);
    setPrestatairesSollicites([]);
    setManualName('');
  };

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA' : '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle passation de marché</DialogTitle>
          <DialogDescription>
            Créer une passation à partir d'une expression de besoin validée - Exercice {exercice}
          </DialogDescription>
        </DialogHeader>

        {/* Sélection EB */}
        {!selectedEB ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Sélectionner une expression de besoin validée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro ou objet..."
                  value={searchEB}
                  onChange={(e) => setSearchEB(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredEBs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune expression de besoin validée disponible
                  </p>
                ) : (
                  filteredEBs.map((eb) => (
                    <div
                      key={eb.id}
                      onClick={() => handleSelectEB(eb)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium font-mono text-sm">
                            {eb.numero || 'Réf. en attente'}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{eb.objet}</p>
                          {eb.direction && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {eb.direction.sigle || eb.direction.label}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">{formatMontant(eb.montant_estime)}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* EB sélectionnée */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Expression de besoin source
                  </CardTitle>
                  {!sourceEB && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedEB(null)}>
                      Changer
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Référence:</span>{' '}
                    <span className="font-mono font-medium">{selectedEB.numero || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant:</span>{' '}
                    <span className="font-medium">{formatMontant(selectedEB.montant_estime)}</span>
                    {selectedEB.montant_estime &&
                      (() => {
                        const seuil = getSeuilForMontant(selectedEB.montant_estime);
                        return seuil ? (
                          <Badge className={cn('mt-1 text-xs ml-2', seuil.color)}>
                            {seuil.label}
                          </Badge>
                        ) : null;
                      })()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Direction:</span>{' '}
                    <span className="font-medium">
                      {selectedEB.direction?.sigle || selectedEB.direction?.label || '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Objet:</span>{' '}
                    <span className="font-medium">{selectedEB.objet}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ligne budgétaire:</span>{' '}
                    <span className="font-mono font-medium text-xs">
                      {selectedEB.budget_line?.code || '-'}
                    </span>
                  </div>
                  {articles.length > 0 && (
                    <div className="col-span-3 mt-2">
                      <span className="text-muted-foreground text-xs font-medium">
                        Articles ({articles.length})
                      </span>
                      <div className="mt-1 max-h-32 overflow-y-auto space-y-1">
                        {articles.map((a, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-xs bg-muted/30 px-2 py-1 rounded"
                          >
                            <span className="truncate mr-4">{a.designation}</span>
                            <span className="font-mono whitespace-nowrap">
                              {a.quantite} {a.unite} x {formatMontant(a.prix_unitaire)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-bold pt-1 border-t">
                          <span>Total articles</span>
                          <span className="font-mono">
                            {formatMontant(articles.reduce((s, a) => s + (a.prix_total || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {lineAvailability && (
                    <div className="col-span-3 p-2 rounded-lg bg-muted/50 border mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Disponible sur la ligne</span>
                        <span
                          className={cn(
                            'font-bold font-mono',
                            lineAvailability.disponible < (selectedEB.montant_estime || 0)
                              ? 'text-destructive'
                              : 'text-green-700'
                          )}
                        >
                          {formatMontant(lineAvailability.disponible)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Formulaire en onglets */}
            <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="mode" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Mode
                </TabsTrigger>
                <TabsTrigger value="lots" className="gap-2">
                  <Package className="h-4 w-4" />
                  Lots
                </TabsTrigger>
                <TabsTrigger value="prestataires" className="gap-2">
                  <Users className="h-4 w-4" />
                  Prestataires
                </TabsTrigger>
                <TabsTrigger value="criteres" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Critères
                </TabsTrigger>
                <TabsTrigger value="decision" className="gap-2">
                  <Gavel className="h-4 w-4" />
                  Décision
                </TabsTrigger>
              </TabsList>

              {/* Procédure de passation */}
              <TabsContent value="mode" className="mt-4 space-y-4">
                {seuilDGMP && (
                  <Alert className={cn('border', seuilDGMP.color)}>
                    <CreditCard className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Seuil automatique :</strong> {seuilDGMP.label} (montant{' '}
                      {formatMontant(selectedEB?.montant_estime ?? null)})
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="mode_passation">Procédure de passation *</Label>
                  <Select
                    value={formData.mode_passation}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, mode_passation: value }))
                    }
                  >
                    <SelectTrigger id="mode_passation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROCEDURES_PASSATION.map((proc) => {
                        const isRecommended = seuilDGMP?.procedure === proc.value;
                        return (
                          <SelectItem key={proc.value} value={proc.value}>
                            {proc.label}
                            {isRecommended ? ' (Recommande)' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedEB?.montant_estime &&
                  formData.mode_passation &&
                  !isProcedureCoherente(selectedEB.montant_estime, formData.mode_passation) && (
                    <Alert className="bg-yellow-50 border-yellow-300">
                      <AlertTriangle className="h-4 w-4 text-yellow-700" />
                      <AlertDescription className="text-yellow-800">
                        Pour un montant de {formatMontant(selectedEB.montant_estime)}, la procedure
                        recommandee est « {getSeuilForMontant(selectedEB.montant_estime)?.label} ».
                      </AlertDescription>
                    </Alert>
                  )}

                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_publication">Date de publication</Label>
                    <Input
                      id="date_publication"
                      type="date"
                      value={formData.date_publication}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, date_publication: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_cloture">Date de clôture des offres</Label>
                    <Input
                      id="date_cloture"
                      type="date"
                      value={formData.date_cloture}
                      min={formData.date_publication || undefined}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, date_cloture: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setActiveStep('lots')}>Suivant: Lots</Button>
                </div>
              </TabsContent>

              {/* Lots */}
              <TabsContent value="lots" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Marché alloti
                        </CardTitle>
                        <CardDescription>
                          Activez l'allotissement pour diviser le marché en lots distincts
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="allotissement" className="text-sm">
                          Marché alloti
                        </Label>
                        <Switch
                          id="allotissement"
                          checked={allotissement}
                          onCheckedChange={setAllotissement}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {allotissement ? (
                      <div className="space-y-4">
                        {lots.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-20">N°</TableHead>
                                <TableHead>Libellé</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right w-40">Montant estimé</TableHead>
                                <TableHead className="w-12" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {lots.map((lot) => (
                                <TableRow key={lot.id}>
                                  <TableCell className="font-mono font-medium align-top pt-3">
                                    Lot {lot.numero}
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <Input
                                      placeholder="Libellé du lot"
                                      value={lot.designation}
                                      onChange={(e) =>
                                        handleLotChange(lot.id, 'designation', e.target.value)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <Textarea
                                      placeholder="Description du lot..."
                                      value={lot.description || ''}
                                      onChange={(e) =>
                                        handleLotChange(lot.id, 'description', e.target.value)
                                      }
                                      rows={2}
                                      className="resize-none text-sm"
                                    />
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <Input
                                      type="number"
                                      placeholder="Montant"
                                      value={lot.montant_estime || ''}
                                      onChange={(e) =>
                                        handleLotChange(
                                          lot.id,
                                          'montant_estime',
                                          e.target.value ? parseFloat(e.target.value) : null
                                        )
                                      }
                                      className="text-right"
                                    />
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveLot(lot.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}

                        <Button variant="outline" onClick={handleAddLot} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter un lot
                        </Button>

                        {lots.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm border-t pt-2">
                              <span className="text-muted-foreground">Total lots</span>
                              <span
                                className={cn(
                                  'font-bold font-mono',
                                  lotsExceedMontant
                                    ? 'text-destructive'
                                    : lotsMismatchMontant
                                      ? 'text-yellow-700'
                                      : 'text-foreground'
                                )}
                              >
                                {formatMontant(totalLots)}
                              </span>
                            </div>
                            {montantMarche > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                  Montant du marché (EB)
                                </span>
                                <span className="font-mono">{formatMontant(montantMarche)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {lotsExceedMontant && (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Le total des lots ({formatMontant(totalLots)}) dépasse le montant du
                              marché ({formatMontant(montantMarche)}). Veuillez corriger les
                              montants.
                            </AlertDescription>
                          </Alert>
                        )}

                        {lotsMismatchMontant && (
                          <Alert className="bg-yellow-50 border-yellow-300">
                            <AlertTriangle className="h-4 w-4 text-yellow-700" />
                            <AlertDescription className="text-yellow-800">
                              Le total des lots ({formatMontant(totalLots)}) ne correspond pas au
                              montant du marché ({formatMontant(montantMarche)}).
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3">
                          <Package className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">Lot unique (implicite)</p>
                            <p className="text-xs text-muted-foreground">
                              Le marché n'est pas alloti. Un lot unique sera créé avec le montant
                              total de {formatMontant(montantMarche)}.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveStep('mode')}>
                    Précédent
                  </Button>
                  <Button onClick={() => setActiveStep('prestataires')}>
                    Suivant: Prestataires
                  </Button>
                </div>
              </TabsContent>

              {/* Prestataires */}
              <TabsContent value="prestataires" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Soumissionnaires</CardTitle>
                      <Badge data-testid="soumissionnaires-counter">
                        {soumissionnairesCount} soumissionnaire
                        {soumissionnairesCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un prestataire..."
                        value={searchPrestataire}
                        onChange={(e) => setSearchPrestataire(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {searchPrestataire &&
                      filteredPrestataires &&
                      filteredPrestataires.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border rounded-md">
                          {filteredPrestataires.slice(0, 5).map((p) => (
                            <div
                              key={p.id}
                              onClick={() => handleAddPrestataire(p)}
                              className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                            >
                              <p className="font-medium text-sm">{p.raison_sociale}</p>
                              <p className="text-xs text-muted-foreground">{p.code}</p>
                            </div>
                          ))}
                        </div>
                      )}

                    <Separator />

                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        <UserPlus className="h-3.5 w-3.5 inline mr-1" />
                        Saisie manuelle
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          data-testid="manual-soumissionnaire-input"
                          placeholder="Nom du prestataire..."
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddManualPrestataire();
                            }
                          }}
                        />
                        <Button
                          data-testid="add-manual-soumissionnaire"
                          variant="outline"
                          onClick={handleAddManualPrestataire}
                          disabled={!manualName.trim()}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {insufficientSoumissionnaires && (
                  <Alert
                    data-testid="soumissionnaires-warning"
                    className="bg-yellow-50 border-yellow-300"
                  >
                    <AlertTriangle className="h-4 w-4 text-yellow-700" />
                    <AlertDescription className="text-yellow-800">
                      La procedure &laquo;
                      {PROCEDURES_PASSATION.find((p) => p.value === formData.mode_passation)
                        ?.label || formData.mode_passation}
                      &raquo; requiert au minimum {minRequired} soumissionnaires. Actuellement :{' '}
                      {soumissionnairesCount}.
                    </AlertDescription>
                  </Alert>
                )}

                {prestatairesSollicites.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prestataire</TableHead>
                        <TableHead className="text-right">Offre (FCFA)</TableHead>
                        <TableHead className="text-center">Offre tech.</TableHead>
                        <TableHead className="text-center">Note Tech.</TableHead>
                        <TableHead className="text-center">Note Fin.</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prestatairesSollicites.map((ps) => (
                        <TableRow key={ps.id}>
                          <TableCell className="font-medium">
                            {ps.raison_sociale}
                            {ps.is_manual_entry && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Manuel
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="Montant"
                              value={ps.offre_montant || ''}
                              onChange={(e) =>
                                handlePrestataireChange(
                                  ps.id,
                                  'offre_montant',
                                  e.target.value ? parseFloat(e.target.value) : null
                                )
                              }
                              className="w-32 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="file"
                              id={`offre-tech-${ps.id}`}
                              className="hidden"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handlePrestataireChange(ps.id, 'offre_documents', [file.name]);
                                }
                              }}
                            />
                            {ps.offre_documents.length > 0 ? (
                              <span
                                className="text-xs text-green-700 font-medium truncate max-w-[100px] inline-block"
                                title={ps.offre_documents[0]}
                              >
                                {ps.offre_documents[0]}
                              </span>
                            ) : (
                              <label
                                htmlFor={`offre-tech-${ps.id}`}
                                className="cursor-pointer inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                PJ
                              </label>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0-100"
                              value={ps.note_technique || ''}
                              onChange={(e) =>
                                handlePrestataireChange(
                                  ps.id,
                                  'note_technique',
                                  e.target.value ? parseFloat(e.target.value) : null
                                )
                              }
                              className="w-20 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0-100"
                              value={ps.note_financiere || ''}
                              onChange={(e) =>
                                handlePrestataireChange(
                                  ps.id,
                                  'note_financiere',
                                  e.target.value ? parseFloat(e.target.value) : null
                                )
                              }
                              className="w-20 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePrestataire(ps.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveStep('lots')}>
                    Précédent
                  </Button>
                  <Button onClick={() => setActiveStep('criteres')}>Suivant: Critères</Button>
                </div>
              </TabsContent>

              {/* Critères */}
              <TabsContent value="criteres" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Critères d'évaluation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Critère</TableHead>
                          <TableHead className="text-right">Poids (%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {criteres.map((critere, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Input
                                value={critere.nom}
                                onChange={(e) => {
                                  const newCriteres = [...criteres];
                                  newCriteres[idx].nom = e.target.value;
                                  setCriteres(newCriteres);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={critere.poids}
                                onChange={(e) => {
                                  const newCriteres = [...criteres];
                                  newCriteres[idx].poids = parseInt(e.target.value) || 0;
                                  setCriteres(newCriteres);
                                }}
                                className="w-24 text-right"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-sm text-muted-foreground mt-2">
                      Total: {criteres.reduce((sum, c) => sum + c.poids, 0)}% (doit être 100%)
                    </p>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveStep('prestataires')}>
                    Précédent
                  </Button>
                  <Button onClick={() => setActiveStep('decision')}>Suivant: Décision</Button>
                </div>
              </TabsContent>

              {/* Décision */}
              <TabsContent value="decision" className="mt-4 space-y-4">
                {/* Sélection du prestataire retenu */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Prestataire retenu</CardTitle>
                    <CardDescription>
                      Sélectionnez le prestataire qui a été retenu suite à l'analyse des offres
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {prestatairesSollicites.length === 0 ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Aucun prestataire sollicité. Retournez à l'onglet Prestataires pour en
                          ajouter.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        {prestatairesSollicites.map((ps) => (
                          <div
                            key={ps.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              ps.selectionne ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                            }`}
                            onClick={() => {
                              setPrestatairesSollicites((prev) =>
                                prev.map((p) => ({
                                  ...p,
                                  selectionne: p.id === ps.id,
                                }))
                              );
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox checked={ps.selectionne} />
                                <div>
                                  <p className="font-medium">{ps.raison_sociale}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Offre: {formatMontant(ps.offre_montant)}
                                  </p>
                                </div>
                              </div>
                              {ps.note_technique !== null && ps.note_financiere !== null && (
                                <Badge variant="outline">
                                  Score: {((ps.note_technique + ps.note_financiere) / 2).toFixed(1)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Justification de la sélection */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Justification de la sélection</CardTitle>
                    <CardDescription>
                      Expliquez les raisons du choix du prestataire retenu
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Motifs de sélection : meilleur rapport qualité/prix, conformité technique, délais, références..."
                      value={formData.motif_selection}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, motif_selection: e.target.value }))
                      }
                      rows={3}
                    />
                  </CardContent>
                </Card>

                {/* Décision de sortie */}
                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Décision de sortie
                    </CardTitle>
                    <CardDescription>
                      Indiquez la suite à donner : engagement direct ou contrat formel
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {DECISIONS_SORTIE.map((decision) => (
                        <div
                          key={decision.value}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.decision === decision.value
                              ? 'border-primary bg-primary/5'
                              : 'border-muted hover:border-primary/50'
                          }`}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, decision: decision.value }))
                          }
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                formData.decision === decision.value ? 'bg-primary/10' : 'bg-muted'
                              }`}
                            >
                              {decision.value === 'engagement_possible' ? (
                                <CreditCard className="h-5 w-5 text-green-600" />
                              ) : (
                                <FileCheck className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{decision.label}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {decision.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Justification de la décision */}
                    <div>
                      <Label htmlFor="justification_decision">Justification de la décision</Label>
                      <Textarea
                        id="justification_decision"
                        placeholder="Expliquez pourquoi cette voie de sortie a été choisie..."
                        value={formData.justification_decision}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            justification_decision: e.target.value,
                          }))
                        }
                        rows={2}
                        className="mt-1.5"
                      />
                    </div>

                    {/* Info sur la suite */}
                    {formData.decision && (
                      <Alert
                        className={
                          formData.decision === 'engagement_possible'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-blue-50 border-blue-200'
                        }
                      >
                        <ArrowRight
                          className={`h-4 w-4 ${formData.decision === 'engagement_possible' ? 'text-green-600' : 'text-blue-600'}`}
                        />
                        <AlertDescription
                          className={
                            formData.decision === 'engagement_possible'
                              ? 'text-green-700'
                              : 'text-blue-700'
                          }
                        >
                          {formData.decision === 'engagement_possible' ? (
                            <>
                              <strong>Prochaine étape :</strong> Après validation, vous pourrez
                              créer directement un engagement à partir de cette passation.
                            </>
                          ) : (
                            <>
                              <strong>Prochaine étape :</strong> Après validation, cette passation
                              nécessitera la création d'un contrat formel avant l'engagement.
                            </>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveStep('criteres')}>
                    Précédent
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedEB || isCreating || lotsExceedMontant}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer la passation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
