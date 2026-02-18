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
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  getSeuilForMontant,
  getSeuilRecommande,
  isProcedureCoherente,
  canPublish,
  canClose,
  canStartEvaluation,
  canAward,
  canApprove,
  canSign,
} from '@/hooks/usePassationsMarche';
import { SoumissionnairesSection } from './SoumissionnairesSection';
import { EvaluationCOJO } from './EvaluationCOJO';
import { ComparatifEvaluation } from './ComparatifEvaluation';
import { TableauComparatif } from './TableauComparatif';
import { WorkflowActionBar } from './WorkflowActionBar';
import { PassationChainNav } from './PassationChainNav';
import { generatePVCOJO } from '@/services/pvCojoPdfService';
import { usePassationMarcheExport } from '@/hooks/usePassationMarcheExport';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import {
  Gavel,
  FileText,
  Users,
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
  Award,
  Link2,
  Building2,
  CalendarDays,
  BarChart3,
  FileDown,
  Loader2,
} from 'lucide-react';

interface PassationDetailsProps {
  passation: PassationMarche;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransition?: (action: string) => void;
}

export function PassationDetails({
  passation,
  open,
  onOpenChange,
  onTransition,
}: PassationDetailsProps) {
  const navigate = useNavigate();
  const { addSoumissionnaire, updateSoumissionnaire, deleteSoumissionnaire } =
    usePassationsMarche();
  const [_checklistComplete, setChecklistComplete] = useState(false);
  const [_missingDocs, setMissingDocs] = useState<string[]>([]);
  const { exportPdfMarche, exportPdfComparatif, isExporting } = usePassationMarcheExport();
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('infos');

  // Derived
  const decisionConfig = DECISIONS_SORTIE.find((d) => d.value === passation.decision);
  const lots = (passation.lots || []) as LotMarche[];
  const allSoumissionnaires = (passation.soumissionnaires || []) as Soumissionnaire[];
  // RBAC
  const { hasAnyRole: hasPermRole, isAdmin: isPermAdmin } = usePermissions();
  const canEvaluate = isPermAdmin || hasPermRole(['DG', 'DAAF', 'CB', 'DIRECTEUR']);
  // Agents can view evaluation results after attribution (read-only)
  const isPostAttribution = ['attribue', 'approuve', 'signe'].includes(passation.statut);
  const canViewEvaluation = canEvaluate || isPostAttribution;

  // Seuil DGMP
  const montantEB = passation.expression_besoin?.montant_estime ?? null;
  const seuilDGMP = getSeuilForMontant(montantEB);
  const seuilRecommande = getSeuilRecommande(montantEB);
  const procedureCoherente = isProcedureCoherente(montantEB, passation.mode_passation);

  // Helpers
  const formatMontant = (montant: number | null) => (montant ? formatCurrency(montant) : '-');

  const getModeName = (value: string) =>
    MODES_PASSATION.find((m) => m.value === value)?.label || value;

  const getStatusBadge = (statut: string) => {
    const config = STATUTS[statut as keyof typeof STATUTS] || STATUTS.brouillon;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return format(new Date(dateStr), 'dd/MM/yyyy');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Passation {passation.reference || ''}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportPdfMarche(passation)}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileDown className="mr-1.5 h-3.5 w-3.5" />
                )}
                PDF
              </Button>
              {getStatusBadge(passation.statut)}
            </div>
          </div>
          <DialogDescription>
            {passation.expression_besoin?.objet || 'Details de la passation de marche'}
          </DialogDescription>
        </DialogHeader>

        {/* Workflow action bar */}
        <WorkflowActionBar passation={passation} />

        {/* Chain navigation: ExprBesoin ↔ Passation ↔ Engagement */}
        <PassationChainNav passation={passation} onCloseDialog={() => onOpenChange(false)} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="infos" className="gap-1">
              <ClipboardList className="h-3 w-3" />
              <span className="hidden sm:inline">Infos</span>
            </TabsTrigger>
            <TabsTrigger value="lots" className="gap-1">
              <Package className="h-3 w-3" />
              <span className="hidden sm:inline">Lots</span>
              {passation.allotissement && lots.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1">
                  {lots.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="prestataires" className="gap-1">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Soumis.</span>
              {allSoumissionnaires.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1">
                  {allSoumissionnaires.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="gap-1" data-testid="evaluation-tab">
              <Award className="h-3 w-3" />
              <span className="hidden sm:inline">Evaluation</span>
            </TabsTrigger>
            <TabsTrigger value="comparatif" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">Comparatif</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="chaine" className="gap-1">
              <Link2 className="h-3 w-3" />
              <span className="hidden sm:inline">Chaine</span>
            </TabsTrigger>
          </TabsList>

          {/* ============ TAB 1 : INFORMATIONS ============ */}
          <TabsContent value="infos" className="mt-4 space-y-4">
            {/* EB source */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Expression de besoin source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Numero EB:</span>{' '}
                    <span className="font-mono font-medium">
                      {passation.expression_besoin?.numero || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Direction:</span>{' '}
                    <span className="font-medium">
                      {passation.expression_besoin?.direction ? (
                        <span className="flex items-center gap-1 inline-flex">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {passation.expression_besoin.direction.sigle ||
                            passation.expression_besoin.direction.label}
                        </span>
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Objet:</span>{' '}
                    <span className="font-medium">{passation.expression_besoin?.objet}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant estime:</span>{' '}
                    <span className="font-medium">{formatMontant(montantEB)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Seuil DGMP:</span>{' '}
                    {seuilDGMP ? (
                      <Badge className={cn('text-xs', seuilDGMP.color)}>{seuilDGMP.label}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passation details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Details de la passation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Reference:</span>{' '}
                    <span className="font-mono font-medium">{passation.reference || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exercice:</span>{' '}
                    <span className="font-medium">{passation.exercice || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Procedure:</span>{' '}
                    <Badge variant="outline">{getModeName(passation.mode_passation)}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type procedure:</span>{' '}
                    <span className="font-medium">{passation.type_procedure || '-'}</span>
                  </div>
                  {seuilRecommande && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Code seuil:</span>{' '}
                      <Badge variant="outline" className="text-xs">
                        {seuilRecommande.code} — {seuilRecommande.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({seuilRecommande.description})
                      </span>
                    </div>
                  )}
                </div>

                {/* Seuil / procedure coherence warning */}
                {montantEB && passation.mode_passation && !procedureCoherente && (
                  <Alert className="bg-yellow-50 border-yellow-300">
                    <AlertTriangle className="h-4 w-4 text-yellow-700" />
                    <AlertDescription className="text-yellow-800 text-sm">
                      Pour un montant de {formatMontant(montantEB)}, la procedure recommandee est «{' '}
                      {seuilDGMP?.label} ». La procedure choisie (
                      {getModeName(passation.mode_passation)}) ne correspond pas au seuil.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Lifecycle dates */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cree le</p>
                      <p className="font-medium">
                        {format(new Date(passation.created_at), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  {passation.date_publication && (
                    <div className="flex items-center gap-2">
                      <Send className="h-3.5 w-3.5 text-cyan-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Publication prevue</p>
                        <p className="font-medium">{formatDate(passation.date_publication)}</p>
                      </div>
                    </div>
                  )}
                  {passation.date_cloture && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Cloture prevue</p>
                        <p className="font-medium">{formatDate(passation.date_cloture)}</p>
                      </div>
                    </div>
                  )}
                  {passation.publie_at && (
                    <div className="flex items-center gap-2">
                      <Send className="h-3.5 w-3.5 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Publie le</p>
                        <p className="font-medium">{formatDate(passation.publie_at)}</p>
                      </div>
                    </div>
                  )}
                  {passation.cloture_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Cloture le</p>
                        <p className="font-medium">{formatDate(passation.cloture_at)}</p>
                      </div>
                    </div>
                  )}
                  {passation.attribue_at && (
                    <div className="flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 text-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Attribue le</p>
                        <p className="font-medium">{formatDate(passation.attribue_at)}</p>
                      </div>
                    </div>
                  )}
                  {passation.approuve_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Approuve le</p>
                        <p className="font-medium">{formatDate(passation.approuve_at)}</p>
                      </div>
                    </div>
                  )}
                  {passation.signe_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Signe le</p>
                        <p className="font-medium">{formatDate(passation.signe_at)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cree par:</span>{' '}
                    <span className="font-medium">{passation.creator?.full_name || '-'}</span>
                  </div>
                  {passation.montant_retenu && (
                    <div>
                      <span className="text-muted-foreground">Montant retenu:</span>{' '}
                      <span className="font-bold text-primary">
                        {formatMontant(passation.montant_retenu)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Motif de rejet */}
                {passation.statut === 'rejete' && passation.rejection_reason && (
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Motif de rejet</span>
                    </div>
                    <p className="text-sm">{passation.rejection_reason}</p>
                  </div>
                )}

                {/* Differe */}
                {passation.statut === 'differe' && passation.motif_differe && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Differe</span>
                    </div>
                    <p className="text-sm">{passation.motif_differe}</p>
                    {passation.date_reprise && (
                      <p className="text-xs text-orange-600 mt-1">
                        Reprise prevue: {format(new Date(passation.date_reprise), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Decision de sortie */}
            {decisionConfig && (
              <Card
                className={`border-2 ${passation.decision === 'engagement_possible' ? 'border-green-200' : 'border-blue-200'}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Decision de sortie
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
                      <span className="text-muted-foreground">Motif de selection:</span>{' '}
                      <span>{passation.motif_selection}</span>
                    </div>
                  )}

                  {passation.statut === 'signe' && (
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
                            Creer l'engagement
                          </>
                        ) : (
                          <>
                            <FileCheck className="h-4 w-4 mr-2" />
                            Creer le contrat
                          </>
                        )}
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* QR Code — visible uniquement pour les marchés signés */}
            {passation.statut === 'signe' && passation.reference && (
              <Card className="border-emerald-200 bg-emerald-50/30" data-testid="qrcode-section">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    QR Code de vérification
                  </CardTitle>
                  <CardDescription>
                    Scannez ce code pour vérifier l'authenticité du marché signé
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                      <QRCodeSVG
                        value={JSON.stringify({
                          ref: passation.reference,
                          objet: passation.expression_besoin?.objet || '',
                          prestataire: passation.prestataire_retenu?.raison_sociale || '',
                          montant: passation.montant_retenu || 0,
                          date_signature: passation.signe_at || '',
                        })}
                        size={120}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                    </div>
                    <div className="flex-1 space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Référence :</span>{' '}
                        <Badge variant="outline" className="font-mono">
                          {passation.reference}
                        </Badge>
                      </div>
                      {passation.prestataire_retenu && (
                        <div>
                          <span className="text-muted-foreground">Attributaire :</span>{' '}
                          <span className="font-medium">
                            {passation.prestataire_retenu.raison_sociale}
                          </span>
                        </div>
                      )}
                      {passation.montant_retenu && (
                        <div>
                          <span className="text-muted-foreground">Montant :</span>{' '}
                          <span className="font-bold text-primary">
                            {formatMontant(passation.montant_retenu)}
                          </span>
                        </div>
                      )}
                      {passation.signe_at && (
                        <div>
                          <span className="text-muted-foreground">Signé le :</span>{' '}
                          <span className="font-medium">
                            {format(new Date(passation.signe_at), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ TAB 2 : LOTS ============ */}
          <TabsContent value="lots" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {passation.allotissement ? 'Lots du marche' : 'Lot unique (non alloti)'}
                </CardTitle>
                <CardDescription>
                  {passation.allotissement
                    ? `${lots.length} lot${lots.length > 1 ? 's' : ''} defini${lots.length > 1 ? 's' : ''}`
                    : 'Marche non alloti — lot unique implicite'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passation.allotissement && lots.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">N° Lot</TableHead>
                          <TableHead>Libelle</TableHead>
                          <TableHead className="text-right">Montant estime</TableHead>
                          <TableHead className="w-20 text-center">Soum.</TableHead>
                          <TableHead className="text-right">Montant retenu</TableHead>
                          <TableHead>Attributaire</TableHead>
                          <TableHead className="w-24 text-center">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lots.map((lot) => {
                          const lotSoums = (lot.soumissionnaires || []) as Soumissionnaire[];
                          const attributaire = lotSoums.find((s) => s.statut === 'retenu');
                          return (
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
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{lot.designation || '-'}</p>
                                  {lot.description && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {lot.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatMontant(lot.montant_estime)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">
                                  {lotSoums.length}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {lot.montant_retenu ? (
                                  formatMontant(lot.montant_retenu)
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {attributaire ? (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-green-700 truncate max-w-[150px]">
                                      {attributaire.raison_sociale}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
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
                                    ? 'Attribue'
                                    : lot.statut === 'annule'
                                      ? 'Annule'
                                      : lot.statut === 'infructueux'
                                        ? 'Infructueux'
                                        : 'En cours'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {/* Total row */}
                    <div className="mt-4 flex justify-between items-center text-sm border-t pt-3">
                      <span className="text-muted-foreground">
                        Total: {lots.length} lot{lots.length > 1 ? 's' : ''} —{' '}
                        {allSoumissionnaires.length} soumissionnaire
                        {allSoumissionnaires.length !== 1 ? 's' : ''}
                      </span>
                      <span className="font-bold">
                        {formatMontant(lots.reduce((sum, l) => sum + (l.montant_estime || 0), 0))}
                      </span>
                    </div>
                    {/* Comparison with EB amount */}
                    {montantEB && (
                      <div className="mt-1 text-xs text-right text-muted-foreground">
                        Montant EB: {formatMontant(montantEB)}
                        {(() => {
                          const totalLots = lots.reduce((s, l) => s + (l.montant_estime || 0), 0);
                          const diff = totalLots - montantEB;
                          if (Math.abs(diff) < 1) return null;
                          return (
                            <span
                              className={diff > 0 ? 'text-orange-600 ml-2' : 'text-green-600 ml-2'}
                            >
                              ({diff > 0 ? '+' : ''}
                              {formatMontant(diff)})
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Lot unique</p>
                        <p className="text-xs text-muted-foreground">
                          Montant total :{' '}
                          {formatMontant(montantEB || passation.montant_retenu || null)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {allSoumissionnaires.filter((s) => !s.lot_marche_id).length}{' '}
                          soumissionnaire(s)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ TAB 3 : SOUMISSIONNAIRES ============ */}
          <TabsContent value="prestataires" className="mt-4 space-y-4">
            {/* Filter bar for alloti */}
            {passation.allotissement && lots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedLotId === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLotId(null)}
                >
                  Tous
                  <Badge variant="secondary" className="ml-1 text-xs h-5 px-1">
                    {allSoumissionnaires.length}
                  </Badge>
                </Button>
                {lots.map((lot) => {
                  const lotSoums = (lot.soumissionnaires || []) as Soumissionnaire[];
                  return (
                    <Button
                      key={lot.id}
                      variant={selectedLotId === lot.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedLotId(lot.id)}
                    >
                      Lot {lot.numero}
                      <Badge variant="secondary" className="ml-1 text-xs h-5 px-1">
                        {lotSoums.length}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Soumissionnaires content */}
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
                  readOnly={!['brouillon', 'publie', 'cloture'].includes(passation.statut)}
                  onAdd={addSoumissionnaire}
                  onUpdate={updateSoumissionnaire}
                  onDelete={deleteSoumissionnaire}
                />
              ) : (
                /* Vue "Tous" : un Card par lot */
                <div className="space-y-4">
                  {lots.map((lot) => {
                    const lotSoums = (lot.soumissionnaires || []) as Soumissionnaire[];
                    return (
                      <Card key={lot.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Package className="h-3.5 w-3.5" />
                            Lot {lot.numero} — {lot.designation || '-'}
                            <Badge variant="outline" className="ml-auto text-xs">
                              {lotSoums.length} soumissionnaire{lotSoums.length !== 1 ? 's' : ''}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <SoumissionnairesSection
                            passationId={passation.id}
                            lotId={lot.id}
                            modePassation={passation.mode_passation}
                            soumissionnaires={lotSoums}
                            readOnly={
                              !['brouillon', 'publie', 'cloture'].includes(passation.statut)
                            }
                            onAdd={addSoumissionnaire}
                            onUpdate={updateSoumissionnaire}
                            onDelete={deleteSoumissionnaire}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : (
              <SoumissionnairesSection
                passationId={passation.id}
                lotId={null}
                modePassation={passation.mode_passation}
                soumissionnaires={allSoumissionnaires.filter((s) => !s.lot_marche_id)}
                readOnly={!['brouillon', 'publie', 'cloture'].includes(passation.statut)}
                onAdd={addSoumissionnaire}
                onUpdate={updateSoumissionnaire}
                onDelete={deleteSoumissionnaire}
              />
            )}

            {/* Prestataire retenu global */}
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

          {/* ============ TAB 4 : EVALUATION (fusion eval+analyse) ============ */}
          <TabsContent value="evaluation" className="mt-4">
            {canViewEvaluation ? (
              <div data-testid="evaluation-grid">
                <Tabs defaultValue="cojo" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="cojo">Évaluation COJO</TabsTrigger>
                    <TabsTrigger value="comparatif">Tableau comparatif</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cojo">
                    <EvaluationCOJO
                      passation={passation}
                      onUpdateSoumissionnaire={updateSoumissionnaire}
                      readOnly={!canEvaluate || passation.statut !== 'en_evaluation'}
                    />
                  </TabsContent>
                  <TabsContent value="comparatif">
                    <ComparatifEvaluation
                      passation={passation}
                      onExportPV={() => generatePVCOJO(passation)}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div data-testid="evaluation-access-denied" className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500 opacity-50" />
                <p className="text-muted-foreground">Acces reserve aux evaluateurs</p>
              </div>
            )}
          </TabsContent>

          {/* ============ TAB 5 : COMPARATIF ============ */}
          <TabsContent value="comparatif" className="mt-4">
            <TableauComparatif
              passation={passation}
              onExportPdf={() => exportPdfComparatif(passation)}
              isExporting={isExporting}
            />
          </TabsContent>

          {/* ============ TAB 6 : DOCUMENTS ============ */}
          <TabsContent value="documents" className="mt-4 space-y-4">
            {/* Documents officiels */}
            {(passation.pv_ouverture || passation.pv_evaluation || passation.rapport_analyse) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Documents officiels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {passation.pv_ouverture && (
                      <a
                        href={passation.pv_ouverture}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">PV ouverture des plis</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    )}
                    {passation.pv_evaluation && (
                      <a
                        href={passation.pv_evaluation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <FileText className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">PV evaluation</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    )}
                    {passation.rapport_analyse && (
                      <a
                        href={passation.rapport_analyse}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <BarChart3 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">Rapport d'analyse</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <PassationChecklist
              passationId={passation.id}
              modePassation={passation.mode_passation}
              piecesJointes={passation.pieces_jointes || []}
              readOnly={!['brouillon', 'publie'].includes(passation.statut)}
              onValidationChange={(complete, missing) => {
                setChecklistComplete(complete);
                setMissingDocs(missing);
              }}
            />
          </TabsContent>

          {/* ============ TAB 6 : CHAINE DE DEPENSE ============ */}
          <TabsContent value="chaine" className="mt-4 space-y-4">
            {/* Chaine de la depense */}
            {passation.dossier_id ? (
              <DossierStepTimeline
                dossierId={passation.dossier_id}
                highlightStep="passation_marche"
                showNavigation
              />
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun dossier de depense lie a cette passation.</p>
                  <p className="text-xs mt-1">
                    La chaine de depense sera visible une fois le dossier cree.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Navigation rapide */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Navigation rapide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {passation.expression_besoin_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(
                          `/execution/expression-besoin?id=${passation.expression_besoin_id}`
                        );
                      }}
                    >
                      <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                      Voir l'expression de besoin
                      <ExternalLink className="h-3 w-3 ml-1.5" />
                    </Button>
                  )}
                  {passation.statut === 'signe' && passation.decision === 'engagement_possible' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/engagements?sourcePM=${passation.id}`);
                      }}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Voir/Creer l'engagement
                      <ExternalLink className="h-3 w-3 ml-1.5" />
                    </Button>
                  )}
                  {passation.statut === 'signe' && passation.decision === 'contrat_a_creer' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/contractualisation?sourcePM=${passation.id}`);
                      }}
                    >
                      <FileCheck className="h-3.5 w-3.5 mr-1.5" />
                      Voir/Creer le contrat
                      <ExternalLink className="h-3 w-3 ml-1.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Workflow interne */}
            <PassationTimeline passation={passation} />
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Next-step button based on lifecycle */}
          {(() => {
            const statut = passation.statut;
            const actions: Record<
              string,
              {
                label: string;
                action: string;
                icon: React.ElementType;
                check: () => { ok: boolean; errors: string[] };
              }
            > = {
              brouillon: {
                label: 'Publier',
                action: 'publish',
                icon: Send,
                check: () => canPublish(passation),
              },
              publie: {
                label: 'Cloturer',
                action: 'close',
                icon: Clock,
                check: () => canClose(passation),
              },
              cloture: {
                label: "Lancer l'evaluation",
                action: 'startEvaluation',
                icon: ClipboardList,
                check: () => canStartEvaluation(passation),
              },
              en_evaluation: {
                label: 'Attribuer le marche',
                action: 'award',
                icon: Award,
                check: () => canAward(passation),
              },
              attribue: {
                label: 'Approuver (DG)',
                action: 'approve',
                icon: CheckCircle2,
                check: () => canApprove(passation),
              },
              approuve: {
                label: 'Signer le contrat',
                action: 'sign',
                icon: FileCheck,
                check: () => canSign(passation),
              },
            };

            const config = actions[statut];
            if (!config) return null;

            const checkResult = config.check();
            const Icon = config.icon;

            return (
              <div className="flex items-center gap-2 flex-1">
                {!checkResult.ok && (
                  <Alert className="bg-orange-50 border-orange-200 py-2 px-3 mr-auto">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-xs text-orange-700">
                      {checkResult.errors.join(' | ')}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={() => onTransition?.(config.action)}
                  disabled={!checkResult.ok}
                  className="gap-2 ml-auto"
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                </Button>
              </div>
            );
          })()}

          {passation.statut === 'signe' && (
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate(`/engagements?sourcePM=${passation.id}`);
              }}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Creer l'engagement
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
