import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PassationChecklist } from './PassationChecklist';
import { PassationTimeline } from './PassationTimeline';
import { DossierStepTimeline } from '@/components/shared/DossierStepTimeline';
import {
  PassationMarche,
  MODES_PASSATION,
  STATUTS,
  DECISIONS_SORTIE,
  LotMarche,
  Soumissionnaire,
  usePassationsMarche,
} from '@/hooks/usePassationsMarche';
import { SoumissionnairesSection } from './SoumissionnairesSection';
import { EvaluationGrid } from './EvaluationGrid';
import { EvaluationCOJO } from './EvaluationCOJO';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Gavel,
  FileText,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
  ClipboardList,
  Package,
  ArrowRight,
  CreditCard,
  FileCheck,
  ExternalLink,
  History,
  Award,
} from 'lucide-react';

interface PassationDetailsProps {
  passation: PassationMarche;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
  onValidate?: () => void;
  onReject?: () => void;
  onDefer?: () => void;
  canValidate?: boolean;
}

export function PassationDetails({
  passation,
  open,
  onOpenChange,
  onSubmit,
  onValidate,
  onReject,
  onDefer,
  canValidate = false,
}: PassationDetailsProps) {
  const navigate = useNavigate();
  const { addSoumissionnaire, updateSoumissionnaire, deleteSoumissionnaire } =
    usePassationsMarche();
  const [checklistComplete, setChecklistComplete] = useState(false);
  const [_missingDocs, setMissingDocs] = useState<string[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('infos');

  // Trouver la config de décision
  const decisionConfig = DECISIONS_SORTIE.find((d) => d.value === passation.decision);
  const lots = (passation.lots || []) as LotMarche[];

  const formatMontant = (montant: number | null) =>
    montant ? new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA' : '-';

  const getModeName = (value: string) =>
    MODES_PASSATION.find((m) => m.value === value)?.label || value;

  const getStatusBadge = (statut: string) => {
    const config = STATUTS[statut as keyof typeof STATUTS] || STATUTS.brouillon;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const criteres = passation.criteres_evaluation || [];

  // RBAC: evaluation accessible uniquement aux evaluateurs (DG, DAAF, CB, DIRECTEUR)
  const { hasAnyRole: hasPermRole, isAdmin: isPermAdmin } = usePermissions();
  const canEvaluate = isPermAdmin || hasPermRole(['DG', 'DAAF', 'CB', 'DIRECTEUR']);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Passation {passation.reference || ''}
            </DialogTitle>
            {getStatusBadge(passation.statut)}
          </div>
          <DialogDescription>
            {passation.expression_besoin?.objet || 'Détails de la passation de marché'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="infos" className="gap-1">
              <ClipboardList className="h-3 w-3" />
              Infos
            </TabsTrigger>
            <TabsTrigger value="lots" className="gap-1">
              <Package className="h-3 w-3" />
              Lots {passation.allotissement && lots.length > 0 ? `(${lots.length})` : '(1)'}
            </TabsTrigger>
            <TabsTrigger value="prestataires" className="gap-1">
              <Users className="h-3 w-3" />
              Soumissionnaires
              {(passation.soumissionnaires || []).length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1">
                  {(passation.soumissionnaires || []).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="gap-1" data-testid="evaluation-tab">
              <Award className="h-3 w-3" />
              Evaluation
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1">
              <FileText className="h-3 w-3" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="analyse" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1">
              <History className="h-3 w-3" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* Informations générales */}
          <TabsContent value="infos" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Expression de besoin source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Numéro EB:</span>{' '}
                    <span className="font-mono font-medium">
                      {passation.expression_besoin?.numero || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant estimé:</span>{' '}
                    <span className="font-medium">
                      {formatMontant(passation.expression_besoin?.montant_estime || null)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Objet:</span>{' '}
                    <span className="font-medium">{passation.expression_besoin?.objet}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Détails de la passation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mode de passation:</span>{' '}
                    <Badge variant="outline">{getModeName(passation.mode_passation)}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type de procédure:</span>{' '}
                    <span className="font-medium">{passation.type_procedure || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créé le:</span>{' '}
                    <span className="font-medium">
                      {format(new Date(passation.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Par:</span>{' '}
                    <span className="font-medium">{passation.creator?.full_name || '-'}</span>
                  </div>
                  {passation.montant_retenu && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Montant retenu:</span>{' '}
                      <span className="font-bold text-primary">
                        {formatMontant(passation.montant_retenu)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Motif de rejet/différé */}
                {passation.statut === 'rejete' && passation.rejection_reason && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Motif de rejet</span>
                    </div>
                    <p className="text-sm">{passation.rejection_reason}</p>
                  </div>
                )}

                {passation.statut === 'differe' && passation.motif_differe && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Différé</span>
                    </div>
                    <p className="text-sm">{passation.motif_differe}</p>
                    {passation.date_reprise && (
                      <p className="text-xs text-orange-600 mt-1">
                        Reprise prévue: {format(new Date(passation.date_reprise), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Décision de sortie */}
            {decisionConfig && (
              <Card
                className={`border-2 ${passation.decision === 'engagement_possible' ? 'border-green-200' : 'border-blue-200'}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Décision de sortie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${passation.decision === 'engagement_possible' ? 'bg-green-100' : 'bg-blue-100'}`}
                    >
                      {passation.decision === 'engagement_possible' ? (
                        <CreditCard className="h-5 w-5 text-green-600" />
                      ) : (
                        <FileCheck className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <Badge className={decisionConfig.color}>{decisionConfig.label}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {decisionConfig.description}
                      </p>
                    </div>
                  </div>

                  {passation.justification_decision && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Justification:</span>{' '}
                      <span>{passation.justification_decision}</span>
                    </div>
                  )}

                  {passation.motif_selection && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Motif de sélection:</span>{' '}
                      <span>{passation.motif_selection}</span>
                    </div>
                  )}

                  {/* Bouton d'action pour les passations validées */}
                  {passation.statut === 'valide' && (
                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          onOpenChange(false);
                          if (passation.decision === 'engagement_possible') {
                            navigate(`/engagements?sourcePM=${passation.id}`);
                          } else {
                            navigate(`/contractualisation?sourcePM=${passation.id}`);
                          }
                        }}
                        className={
                          passation.decision === 'engagement_possible'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }
                      >
                        {passation.decision === 'engagement_possible' ? (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Créer l'engagement
                          </>
                        ) : (
                          <>
                            <FileCheck className="h-4 w-4 mr-2" />
                            Créer le contrat
                          </>
                        )}
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Lots */}
          <TabsContent value="lots" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {passation.allotissement ? 'Lots du marché' : 'Lot unique (non alloti)'}
                </CardTitle>
                <CardDescription>
                  {passation.allotissement
                    ? `${lots.length} lot${lots.length > 1 ? 's' : ''} défini${lots.length > 1 ? 's' : ''}`
                    : 'Marché non alloti — lot unique implicite'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passation.allotissement && lots.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">N° Lot</TableHead>
                          <TableHead>Libellé</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Montant estimé</TableHead>
                          <TableHead className="w-24 text-center">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lots.map((lot) => (
                          <TableRow
                            key={lot.id}
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => {
                              setSelectedLotId(lot.id);
                              setActiveTab('prestataires');
                            }}
                          >
                            <TableCell className="font-mono font-medium">
                              Lot {lot.numero}
                            </TableCell>
                            <TableCell className="font-medium">{lot.designation || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {lot.description || '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMontant(lot.montant_estime)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  lot.statut === 'attribue'
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : lot.statut === 'annule'
                                      ? 'bg-red-50 text-red-700 border-red-300'
                                      : lot.statut === 'infructueux'
                                        ? 'bg-orange-50 text-orange-700 border-orange-300'
                                        : 'bg-blue-50 text-blue-700 border-blue-300'
                                }
                              >
                                {lot.statut === 'attribue'
                                  ? 'Attribué'
                                  : lot.statut === 'annule'
                                    ? 'Annulé'
                                    : lot.statut === 'infructueux'
                                      ? 'Infructueux'
                                      : 'En cours'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 text-sm text-right">
                      <span className="text-muted-foreground">Total estimé:</span>{' '}
                      <span className="font-bold">
                        {formatMontant(lots.reduce((sum, l) => sum + (l.montant_estime || 0), 0))}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Lot unique</p>
                        <p className="text-xs text-muted-foreground">
                          Montant total :{' '}
                          {formatMontant(
                            passation.expression_besoin?.montant_estime ||
                              passation.montant_retenu ||
                              null
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Soumissionnaires */}
          <TabsContent value="prestataires" className="mt-4 space-y-4">
            {/* Si alloti: sélecteur de lot */}
            {passation.allotissement && lots.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Selectionner un lot</CardTitle>
                  <CardDescription>
                    Choisissez un lot pour gerer ses soumissionnaires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {lots.map((lot) => {
                      const lotSoums = (lot.soumissionnaires || []) as Soumissionnaire[];
                      return (
                        <div
                          key={lot.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedLotId === lot.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => setSelectedLotId(lot.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono font-medium text-sm">Lot {lot.numero}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {lot.designation || '-'}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {lotSoums.length} soum.
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Soumissionnaires du lot sélectionné ou du marché entier */}
            {passation.allotissement && lots.length > 0 ? (
              selectedLotId ? (
                <SoumissionnairesSection
                  passationId={passation.id}
                  lotId={selectedLotId}
                  modePassation={passation.mode_passation}
                  soumissionnaires={
                    (lots.find((l) => l.id === selectedLotId)?.soumissionnaires ||
                      []) as Soumissionnaire[]
                  }
                  readOnly={passation.statut !== 'brouillon' && passation.statut !== 'soumis'}
                  onAdd={addSoumissionnaire}
                  onUpdate={updateSoumissionnaire}
                  onDelete={deleteSoumissionnaire}
                />
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Selectionnez un lot pour voir ses soumissionnaires</p>
                </div>
              )
            ) : (
              <SoumissionnairesSection
                passationId={passation.id}
                lotId={null}
                modePassation={passation.mode_passation}
                soumissionnaires={((passation.soumissionnaires || []) as Soumissionnaire[]).filter(
                  (s) => !s.lot_marche_id
                )}
                readOnly={passation.statut !== 'brouillon' && passation.statut !== 'soumis'}
                onAdd={addSoumissionnaire}
                onUpdate={updateSoumissionnaire}
                onDelete={deleteSoumissionnaire}
              />
            )}

            {/* Prestataire retenu (ancien affichage conserve) */}
            {passation.prestataire_retenu && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Prestataire retenu</span>
                  </div>
                  <p className="font-medium">{passation.prestataire_retenu.raison_sociale}</p>
                  {passation.motif_selection && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {passation.motif_selection}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Evaluation */}
          <TabsContent value="evaluation" className="mt-4">
            {canEvaluate ? (
              <div className="space-y-4">
                {/* Criteres rappel */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Criteres d'evaluation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {criteres.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Aucun critere defini</p>
                    ) : (
                      <div className="space-y-2">
                        {criteres.map((c, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-muted/50 rounded"
                          >
                            <span className="text-sm">{c.nom}</span>
                            <Badge variant="secondary">{c.poids}%</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Grille d'evaluation */}
                <EvaluationGrid
                  soumissionnaires={(passation.soumissionnaires || []) as Soumissionnaire[]}
                  onUpdate={updateSoumissionnaire}
                  readOnly={passation.statut === 'valide' || passation.statut === 'rejete'}
                />
              </div>
            ) : (
              <div data-testid="evaluation-access-denied" className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500 opacity-50" />
                <p className="text-muted-foreground">
                  Acces reserve aux evaluateurs (DG, DAAF, CB)
                </p>
              </div>
            )}
          </TabsContent>

          {/* Documents / Checklist */}
          <TabsContent value="documents" className="mt-4">
            <PassationChecklist
              passationId={passation.id}
              modePassation={passation.mode_passation}
              piecesJointes={passation.pieces_jointes || []}
              readOnly={passation.statut !== 'brouillon'}
              onValidationChange={(complete, missing) => {
                setChecklistComplete(complete);
                setMissingDocs(missing);
              }}
            />
          </TabsContent>

          {/* Analyse COJO */}
          <TabsContent value="analyse" className="mt-4 space-y-4">
            <EvaluationCOJO
              passation={passation}
              onUpdateSoumissionnaire={updateSoumissionnaire}
              readOnly={!['brouillon', 'soumis', 'en_analyse'].includes(passation.statut)}
            />
          </TabsContent>

          {/* Timeline / Historique */}
          <TabsContent value="timeline" className="mt-4 space-y-4">
            {/* Chaîne de la dépense (si lié à un dossier) */}
            {passation.dossier_id && (
              <DossierStepTimeline
                dossierId={passation.dossier_id}
                highlightStep="passation_marche"
                showNavigation
              />
            )}

            {/* Workflow interne de la passation */}
            <PassationTimeline passation={passation} />
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Actions selon le statut */}
          {passation.statut === 'brouillon' && (
            <>
              {!checklistComplete && (
                <div className="flex items-center gap-2 text-sm text-orange-600 mr-auto">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Checklist incomplète - soumission bloquée</span>
                </div>
              )}
              <Button onClick={onSubmit} disabled={!checklistComplete} className="gap-2">
                <Send className="h-4 w-4" />
                Soumettre pour validation
              </Button>
            </>
          )}

          {passation.statut === 'soumis' && canValidate && (
            <>
              <Button variant="outline" onClick={onDefer} className="gap-2">
                <Clock className="h-4 w-4" />
                Différer
              </Button>
              <Button variant="destructive" onClick={onReject} className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejeter
              </Button>
              <Button onClick={onValidate} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Valider
              </Button>
            </>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
