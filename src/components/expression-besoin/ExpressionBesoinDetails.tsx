import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ExpressionBesoin,
  ExpressionBesoinLigne,
  ExpressionBesoinAttachment,
} from '@/hooks/useExpressionsBesoin';
import { ExpressionBesoinTimeline } from './ExpressionBesoinTimeline';
import { DossierStepTimeline } from '@/components/shared/DossierStepTimeline';
import { AttachmentService } from '@/services/attachmentService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Package,
  Users,
  Info,
  History,
  CreditCard,
  MoreVertical,
  Send,
  Trash2,
  Copy,
  Download,
  ExternalLink,
  Paperclip,
  FileDown,
  ShieldCheck,
  ArrowRight,
  Wallet,
} from 'lucide-react';

interface ExpressionBesoinDetailsProps {
  expression: ExpressionBesoin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (id: string) => void;
  onVerify?: (id: string) => void;
  onValidate?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (expression: ExpressionBesoin) => void;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ReactNode;
  }
> = {
  brouillon: { label: 'Brouillon', variant: 'secondary', icon: <FileText className="h-4 w-4" /> },
  soumis: { label: 'À valider', variant: 'outline', icon: <Clock className="h-4 w-4" /> },
  verifie: {
    label: 'Vérifié CB',
    variant: 'outline',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  valide: { label: 'Validé', variant: 'default', icon: <CheckCircle2 className="h-4 w-4" /> },
  rejete: { label: 'Rejeté', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  differe: { label: 'Différé', variant: 'outline', icon: <Clock className="h-4 w-4" /> },
  satisfaite: {
    label: 'Satisfaite',
    variant: 'default',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

const URGENCE_CONFIG: Record<string, { label: string; className: string }> = {
  basse: { label: 'Basse', className: 'bg-muted text-muted-foreground' },
  normale: { label: 'Normal', className: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', className: 'bg-muted text-muted-foreground' },
  haute: { label: 'Urgent', className: 'bg-warning/20 text-warning' },
  urgent: { label: 'Urgent', className: 'bg-warning/20 text-warning' },
  urgente: { label: 'Très urgent', className: 'bg-destructive/20 text-destructive' },
  tres_urgent: { label: 'Très urgent', className: 'bg-destructive/20 text-destructive' },
};

export function ExpressionBesoinDetails({
  expression,
  open,
  onOpenChange,
  onSubmit,
  onVerify,
  onValidate,
  onReject,
  onDelete,
  onDuplicate,
}: ExpressionBesoinDetailsProps) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[expression.statut || 'brouillon'] || STATUS_CONFIG.brouillon;
  const urgence = URGENCE_CONFIG[expression.urgence || 'normale'] || URGENCE_CONFIG.normale;

  // Use attachments from the hook query (expression_besoin_attachments)
  const attachments: ExpressionBesoinAttachment[] = expression.attachments || [];

  // Articles calculations
  const articles: ExpressionBesoinLigne[] =
    expression.liste_articles && Array.isArray(expression.liste_articles)
      ? expression.liste_articles
      : [];
  const totalArticles = articles.reduce((sum, a) => sum + (a.prix_total || 0), 0);
  const montantImpute = expression.imputation?.montant || 0;
  const budgetRatio = montantImpute > 0 ? Math.min((totalArticles / montantImpute) * 100, 100) : 0;
  const budgetDepasse = totalArticles > montantImpute && montantImpute > 0;

  const formatMontant = (montant: number | null | undefined) =>
    montant ? new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA' : '-';

  const handleDownloadAttachment = async (attachment: ExpressionBesoinAttachment) => {
    const result = await AttachmentService.getSignedUrl(attachment.file_path);
    if (result.url) {
      const link = document.createElement('a');
      link.href = result.url;
      link.download = attachment.file_name;
      link.target = '_blank';
      link.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Expression de besoin {expression.numero || ''}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant} className="flex items-center gap-1">
                {status.icon}
                {status.label}
              </Badge>

              {/* Menu Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Toujours visible */}
                  <DropdownMenuItem
                    onClick={() => {
                      /* TODO: PDF export */
                    }}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Exporter PDF
                  </DropdownMenuItem>

                  {/* Imputation link */}
                  {expression.imputation_id && (
                    <DropdownMenuItem
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/execution/imputation?view=${expression.imputation_id}`);
                      }}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Voir Imputation
                    </DropdownMenuItem>
                  )}

                  {/* Brouillon actions */}
                  {expression.statut === 'brouillon' && (
                    <>
                      <DropdownMenuSeparator />
                      {onSubmit && (
                        <DropdownMenuItem onClick={() => onSubmit(expression.id)}>
                          <Send className="mr-2 h-4 w-4" />
                          Soumettre
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(expression.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  {/* Soumis — CB vérifie la couverture budget */}
                  {expression.statut === 'soumis' && (
                    <>
                      <DropdownMenuSeparator />
                      {onVerify && (
                        <DropdownMenuItem onClick={() => onVerify(expression.id)}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Vérifier (CB)
                        </DropdownMenuItem>
                      )}
                      {onReject && (
                        <DropdownMenuItem onClick={() => onReject(expression.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeter
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  {/* Vérifié — DG valide ou rejette */}
                  {expression.statut === 'verifie' && (
                    <>
                      <DropdownMenuSeparator />
                      {onValidate && (
                        <DropdownMenuItem onClick={() => onValidate(expression.id)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Valider (DG)
                        </DropdownMenuItem>
                      )}
                      {onReject && (
                        <DropdownMenuItem onClick={() => onReject(expression.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeter
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  {/* Rejeté — dupliquer */}
                  {expression.statut === 'rejete' && onDuplicate && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDuplicate(expression)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Dupliquer
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Validé — créer passation/marché */}
                  {expression.statut === 'valide' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-primary"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/execution/passation-marche?expression_id=${expression.id}`);
                        }}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Créer Passation / Marché
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="infos" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="infos" className="gap-1 text-xs">
              <Info className="h-3 w-3" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-1 text-xs">
              <Package className="h-3 w-3" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-1 text-xs">
              <Wallet className="h-3 w-3" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="pj" className="gap-1 text-xs">
              <Paperclip className="h-3 w-3" />
              PJ ({attachments.length}/3)
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1 text-xs">
              <History className="h-3 w-3" />
              Chaîne
            </TabsTrigger>
          </TabsList>

          {/* ============================== */}
          {/* Onglet 1 : Informations       */}
          {/* ============================== */}
          <TabsContent value="infos" className="mt-4 space-y-4">
            {/* Workflow de validation CB → DG */}
            {(expression.statut === 'soumis' || expression.statut === 'verifie') && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Circuit de validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-2">
                    {/* Étape CB */}
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                          expression.statut === 'verifie'
                            ? 'bg-success text-white'
                            : 'bg-primary text-primary-foreground'
                        )}
                      >
                        {expression.statut === 'verifie' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Vérification CB</p>
                        {expression.verified_at ? (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(expression.verified_at), 'dd/MM HH:mm')}
                            {expression.verifier && ` — ${expression.verifier.full_name}`}
                          </p>
                        ) : (
                          <p className="text-xs text-primary">En attente</p>
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'h-0.5 w-4',
                        expression.statut === 'verifie' ? 'bg-success' : 'bg-muted'
                      )}
                    />
                    {/* Étape DG */}
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                          expression.statut === 'verifie'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        2
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            expression.statut !== 'verifie' && 'text-muted-foreground'
                          )}
                        >
                          Validation DG
                        </p>
                        {expression.statut === 'verifie' ? (
                          <p className="text-xs text-primary">En attente</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">À venir</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations principales */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Référence</span>
                    <p className="font-medium font-mono">
                      {expression.numero || 'En attente de soumission'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Exercice</span>
                    <p className="font-medium">{expression.exercice}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Objet</span>
                  <p className="font-medium">{expression.objet}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Direction</span>
                    <p className="font-medium">
                      {expression.direction?.sigle || expression.direction?.label || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Demandeur</span>
                    <p className="font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {expression.creator?.full_name || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Urgence</span>
                    <div className="mt-1">
                      <Badge className={urgence.className} variant="outline">
                        {urgence.label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <div className="mt-1">
                      <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                        {status.icon}
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Date de création</span>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(expression.created_at), 'dd MMMM yyyy HH:mm', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  {expression.calendrier_debut && (
                    <div>
                      <span className="text-sm text-muted-foreground">Délai souhaité</span>
                      <p className="font-medium">
                        {format(new Date(expression.calendrier_debut), 'dd/MM/yyyy', {
                          locale: fr,
                        })}
                        {expression.calendrier_fin &&
                          ` → ${format(new Date(expression.calendrier_fin), 'dd/MM/yyyy', {
                            locale: fr,
                          })}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Imputation d'origine (lien cliquable) */}
                {expression.imputation && (
                  <div>
                    <span className="text-sm text-muted-foreground">Imputation d'origine</span>
                    <button
                      type="button"
                      className="flex items-center gap-2 mt-1 text-primary hover:underline font-medium"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/execution/imputation?view=${expression.imputation_id}`);
                      }}
                    >
                      <CreditCard className="h-3 w-3" />
                      {expression.imputation.reference || 'Imputation'} —{' '}
                      {formatMontant(expression.imputation.montant)}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description, justification, spécifications */}
            {(expression.description || expression.justification || expression.specifications) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Détails du besoin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expression.description && (
                    <div>
                      <span className="text-sm text-muted-foreground">Description</span>
                      <p className="whitespace-pre-wrap">{expression.description}</p>
                    </div>
                  )}
                  {expression.justification && (
                    <div>
                      <span className="text-sm text-muted-foreground">Justification</span>
                      <p className="whitespace-pre-wrap">{expression.justification}</p>
                    </div>
                  )}
                  {expression.specifications && (
                    <div>
                      <span className="text-sm text-muted-foreground">Spécifications</span>
                      <p className="whitespace-pre-wrap">{expression.specifications}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Livraison */}
            {(expression.lieu_livraison ||
              expression.delai_livraison ||
              expression.contact_livraison) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lieu et délais de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {expression.lieu_livraison && (
                    <div>
                      <span className="text-sm text-muted-foreground">Lieu de livraison</span>
                      <p className="font-medium">{expression.lieu_livraison}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {expression.delai_livraison && (
                      <div>
                        <span className="text-sm text-muted-foreground">Délai souhaité</span>
                        <p className="font-medium">{expression.delai_livraison}</p>
                      </div>
                    )}
                    {expression.contact_livraison && (
                      <div>
                        <span className="text-sm text-muted-foreground">Contact sur site</span>
                        <p className="font-medium">{expression.contact_livraison}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Motif de rejet ou différé */}
            {expression.statut === 'rejete' && expression.rejection_reason && (
              <Card className="border-destructive/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Motif du rejet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{expression.rejection_reason}</p>
                </CardContent>
              </Card>
            )}

            {expression.statut === 'differe' && expression.motif_differe && (
              <Card className="border-warning/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-warning">
                    <Clock className="h-4 w-4" />
                    Motif du report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{expression.motif_differe}</p>
                  {expression.deadline_correction && (
                    <p className="text-sm text-muted-foreground">
                      Date de reprise prévue:{' '}
                      {format(new Date(expression.deadline_correction), 'dd MMMM yyyy', {
                        locale: fr,
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============================== */}
          {/* Onglet 2 : Articles            */}
          {/* ============================== */}
          <TabsContent value="articles" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Articles ({articles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {articles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun article renseigné
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[5%]">N°</TableHead>
                          <TableHead className="w-[35%]">Désignation</TableHead>
                          <TableHead className="w-[10%] text-right">Quantité</TableHead>
                          <TableHead className="w-[12%]">Unité</TableHead>
                          <TableHead className="w-[17%] text-right">PU (FCFA)</TableHead>
                          <TableHead className="w-[21%] text-right">Total (FCFA)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articles.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-center font-mono text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.designation || item.article || '-'}
                            </TableCell>
                            <TableCell className="text-right">{item.quantite}</TableCell>
                            <TableCell>{item.unite}</TableCell>
                            <TableCell className="text-right font-mono">
                              {item.prix_unitaire > 0
                                ? new Intl.NumberFormat('fr-FR').format(item.prix_unitaire)
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {item.prix_total > 0
                                ? new Intl.NumberFormat('fr-FR').format(item.prix_total)
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={5} className="text-right font-bold">
                            TOTAL GÉNÉRAL
                          </TableCell>
                          <TableCell className="text-right font-bold text-base">
                            {new Intl.NumberFormat('fr-FR').format(totalArticles)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>

                    {/* Comparaison avec montant imputé */}
                    {montantImpute > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            Total articles :{' '}
                            <strong>
                              {new Intl.NumberFormat('fr-FR').format(totalArticles)} FCFA
                            </strong>
                          </span>
                          <span>
                            Montant imputé :{' '}
                            <strong>
                              {new Intl.NumberFormat('fr-FR').format(montantImpute)} FCFA
                            </strong>
                          </span>
                        </div>
                        <Progress
                          value={budgetRatio}
                          className={cn(
                            'h-3',
                            budgetDepasse ? '[&>div]:bg-destructive' : '[&>div]:bg-success'
                          )}
                        />
                        <p
                          className={cn(
                            'text-xs text-right font-medium',
                            budgetDepasse ? 'text-destructive' : 'text-success'
                          )}
                        >
                          {budgetDepasse
                            ? `Dépassement de ${new Intl.NumberFormat('fr-FR').format(totalArticles - montantImpute)} FCFA`
                            : `Reste disponible : ${new Intl.NumberFormat('fr-FR').format(montantImpute - totalArticles)} FCFA`}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================== */}
          {/* Onglet 3 : Budget              */}
          {/* ============================== */}
          <TabsContent value="budget" className="mt-4 space-y-4">
            {/* Imputation source */}
            {expression.imputation && (
              <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Imputation source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Référence</span>
                      <p className="font-mono font-medium">
                        {expression.imputation.reference || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Montant imputé</span>
                      <p className="font-bold text-primary text-lg">
                        {formatMontant(expression.imputation.montant)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Objet</span>
                      <p className="font-medium">{expression.imputation.objet}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Montants récapitulatifs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Récapitulatif budgétaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Montant imputé</p>
                    <p className="font-bold text-lg">{formatMontant(montantImpute || null)}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Total articles</p>
                    <p
                      className={cn(
                        'font-bold text-lg',
                        budgetDepasse ? 'text-destructive' : 'text-success'
                      )}
                    >
                      {formatMontant(totalArticles || null)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">
                      {budgetDepasse ? 'Dépassement' : 'Disponible'}
                    </p>
                    <p
                      className={cn(
                        'font-bold text-lg',
                        budgetDepasse ? 'text-destructive' : 'text-success'
                      )}
                    >
                      {montantImpute > 0
                        ? formatMontant(Math.abs(montantImpute - totalArticles))
                        : '-'}
                    </p>
                  </div>
                </div>

                {montantImpute > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Consommation</span>
                      <span>{budgetRatio.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={budgetRatio}
                      className={cn(
                        'h-2',
                        budgetDepasse ? '[&>div]:bg-destructive' : '[&>div]:bg-success'
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Montant estimé (formulaire)
                    </span>
                    <p className="font-medium">{formatMontant(expression.montant_estime)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Direction</span>
                    <p className="font-medium">
                      {expression.direction?.sigle || expression.direction?.label || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dossier lié */}
            {expression.dossier && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Dossier lié
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Numéro</span>
                      <p className="font-medium">{expression.dossier.numero}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Objet</span>
                      <p className="font-medium">{expression.dossier.objet}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Marché lié */}
            {expression.marche && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Marché lié
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Numéro</span>
                      <p className="font-medium">{expression.marche.numero || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Montant</span>
                      <p className="font-medium">
                        {new Intl.NumberFormat('fr-FR').format(expression.marche.montant)} FCFA
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Objet</span>
                      <p className="font-medium">{expression.marche.objet}</p>
                    </div>
                    {expression.marche.prestataire && (
                      <div className="col-span-2">
                        <span className="text-sm text-muted-foreground">Fournisseur</span>
                        <p className="font-medium">
                          {expression.marche.prestataire.raison_sociale}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============================== */}
          {/* Onglet 4 : Pièces jointes      */}
          {/* ============================== */}
          <TabsContent value="pj" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Pièces jointes
                  </CardTitle>
                  <Badge variant="outline">{attachments.length} / 3</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune pièce jointe</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.file_size
                              ? AttachmentService.formatFileSize(attachment.file_size)
                              : ''}
                            {attachment.document_type && ` — ${attachment.document_type}`}
                            {attachment.created_at &&
                              ` — ${format(new Date(attachment.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadAttachment(attachment)}
                          title="Télécharger"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================== */}
          {/* Onglet 5 : Chaîne & Historique */}
          {/* ============================== */}
          <TabsContent value="timeline" className="mt-4 space-y-4">
            {/* Chaîne de la dépense (si lié à un dossier) */}
            {expression.dossier_id && (
              <DossierStepTimeline
                dossierId={expression.dossier_id}
                highlightStep="expression_besoin"
                showNavigation
              />
            )}

            {/* Workflow interne de l'expression de besoin */}
            <ExpressionBesoinTimeline expression={expression} />

            {/* Journal audit */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Journal d'audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créé le</span>
                    <span>
                      {format(new Date(expression.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      {expression.creator && ` par ${expression.creator.full_name}`}
                    </span>
                  </div>
                  {expression.submitted_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Soumis le</span>
                      <span>
                        {format(new Date(expression.submitted_at), 'dd/MM/yyyy HH:mm', {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  )}
                  {expression.verified_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vérifié CB</span>
                      <span>
                        {format(new Date(expression.verified_at), 'dd/MM/yyyy HH:mm', {
                          locale: fr,
                        })}
                        {expression.verifier && ` par ${expression.verifier.full_name}`}
                      </span>
                    </div>
                  )}
                  {expression.validations &&
                    expression.validations
                      .filter((v) => v.status === 'approved')
                      .map((v) => (
                        <div key={v.id} className="flex justify-between">
                          <span className="text-muted-foreground">
                            {v.role === 'CB' ? 'Vérifié CB' : `Validé (${v.role})`}
                          </span>
                          <span>
                            {v.validated_at &&
                              format(new Date(v.validated_at), 'dd/MM/yyyy HH:mm', {
                                locale: fr,
                              })}
                            {v.validator && ` par ${v.validator.full_name}`}
                          </span>
                        </div>
                      ))}
                  {expression.validated_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Validé définitivement</span>
                      <span>
                        {format(new Date(expression.validated_at), 'dd/MM/yyyy HH:mm', {
                          locale: fr,
                        })}
                        {expression.validator && ` par ${expression.validator.full_name}`}
                      </span>
                    </div>
                  )}
                  {expression.statut === 'rejete' && (
                    <div className="flex justify-between text-destructive">
                      <span>Rejeté</span>
                      <span>{expression.rejection_reason}</span>
                    </div>
                  )}
                  {expression.statut === 'differe' && expression.date_differe && (
                    <div className="flex justify-between text-warning">
                      <span>Différé le</span>
                      <span>
                        {format(new Date(expression.date_differe), 'dd/MM/yyyy HH:mm', {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
