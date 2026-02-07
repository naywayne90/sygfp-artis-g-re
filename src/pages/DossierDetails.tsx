import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  FileText,
  FileEdit,
  Tag,
  Briefcase,
  ShoppingCart,
  CreditCard,
  Receipt,
  FileCheck,
  Banknote,
  CheckCircle2,
  Clock,
  XCircle,
  Circle,
  AlertTriangle,
  Calendar,
  User,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import {
  useDossierDetails,
  ETAPE_LABELS,
  getEtapeOrder,
  type DossierEtapeDetail,
} from '@/hooks/useDossierDetails';

const formatMontant = (montant: number | null | undefined) => {
  if (montant == null) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

const formatDate = (date: string | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (date: string | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface EtapeConfig {
  key: string;
  label: string;
  stepNumber: number;
  icon: LucideIcon;
}

const ETAPES_CHAINE: EtapeConfig[] = [
  { key: 'note_sef', label: 'Note SEF', stepNumber: 1, icon: FileText },
  { key: 'note_aef', label: 'Note AEF', stepNumber: 2, icon: FileEdit },
  { key: 'imputation', label: 'Imputation', stepNumber: 3, icon: Tag },
  { key: 'expression_besoin', label: 'Expression de Besoin', stepNumber: 4, icon: Briefcase },
  { key: 'passation_marche', label: 'Passation Marche', stepNumber: 5, icon: ShoppingCart },
  { key: 'engagement', label: 'Engagement', stepNumber: 6, icon: CreditCard },
  { key: 'liquidation', label: 'Liquidation', stepNumber: 7, icon: Receipt },
  { key: 'ordonnancement', label: 'Ordonnancement', stepNumber: 8, icon: FileCheck },
  { key: 'reglement', label: 'Reglement', stepNumber: 9, icon: Banknote },
];

function getStatutIcon(statut: string | null) {
  switch (statut) {
    case 'valide':
    case 'termine':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'en_cours':
    case 'en_attente':
    case 'soumis':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'rejete':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'bloque':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    default:
      return <Circle className="h-5 w-5 text-gray-300" />;
  }
}

function getStatutBadge(statut: string | null) {
  switch (statut) {
    case 'en_cours':
      return (
        <Badge variant="default" className="bg-blue-500">
          En cours
        </Badge>
      );
    case 'termine':
      return (
        <Badge variant="default" className="bg-green-600">
          Termine
        </Badge>
      );
    case 'annule':
      return <Badge variant="destructive">Annule</Badge>;
    case 'suspendu':
      return <Badge variant="secondary">Suspendu</Badge>;
    case 'bloque':
      return (
        <Badge variant="destructive" className="bg-orange-500">
          Bloque
        </Badge>
      );
    default:
      return <Badge variant="outline">{statut || 'N/A'}</Badge>;
  }
}

function getStatutEtapeBadge(statut: string | null) {
  switch (statut) {
    case 'valide':
    case 'termine':
      return <Badge className="bg-green-600 text-white">Valide</Badge>;
    case 'en_cours':
    case 'en_attente':
      return <Badge className="bg-blue-500 text-white">En attente</Badge>;
    case 'soumis':
      return <Badge className="bg-yellow-500 text-white">Soumis</Badge>;
    case 'rejete':
      return <Badge variant="destructive">Rejete</Badge>;
    default:
      return null;
  }
}

function getEtapeStatut(
  etapeKey: string,
  etapes: DossierEtapeDetail[],
  etapeCourante: string | null
): 'completed' | 'active' | 'pending' | 'rejected' {
  const etapesForType = etapes.filter(
    (e) => e.type_etape === etapeKey || (etapeKey === 'note_sef' && e.type_etape === 'note')
  );

  if (etapesForType.length === 0) {
    const currentOrder = etapeCourante ? getEtapeOrder(etapeCourante) : 0;
    const thisOrder = getEtapeOrder(etapeKey);
    if (thisOrder <= currentOrder) return 'completed';
    return 'pending';
  }

  const lastEtape = etapesForType[etapesForType.length - 1];
  if (lastEtape.statut === 'valide' || lastEtape.statut === 'termine') return 'completed';
  if (lastEtape.statut === 'rejete') return 'rejected';
  return 'active';
}

export default function DossierDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dossier, etapes, isLoading, error } = useDossierDetails(id);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-[300px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/suivi-dossiers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-medium">Dossier introuvable</p>
            <p className="text-sm">Le dossier demande n'existe pas ou vous n'y avez pas acces.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/suivi-dossiers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Dossier {dossier.numero}
            {getStatutBadge(dossier.statut_global)}
          </h1>
          <p className="text-muted-foreground">{dossier.objet}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Informations generales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informations generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Reference" value={dossier.numero} mono />
            {dossier.reference_pivot && (
              <InfoRow label="Ref. pivot" value={dossier.reference_pivot} mono />
            )}
            <InfoRow label="Exercice" value={String(dossier.exercice)} />
            <InfoRow label="Type" value={dossier.type_dossier || '-'} />
            <InfoRow label="Urgence" value={dossier.urgence || 'Normale'} />
            {dossier.priorite != null && (
              <InfoRow label="Priorite" value={`${dossier.priorite}/5`} />
            )}
          </CardContent>
        </Card>

        {/* Montants */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Montants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MontantRow label="Estime" value={dossier.montant_estime} />
            <MontantRow label="Engage" value={dossier.montant_engage} highlight="blue" />
            <MontantRow label="Liquide" value={dossier.montant_liquide} highlight="purple" />
            <MontantRow label="Ordonnance" value={dossier.montant_ordonnance} highlight="orange" />
            <MontantRow label="Paye" value={dossier.montant_paye} highlight="green" />
            <Separator className="my-2" />
            <ProgressBar engaged={dossier.montant_engage} estimated={dossier.montant_estime} />
          </CardContent>
        </Card>

        {/* Parties prenantes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Parties prenantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Direction:</span>
              <span className="text-sm font-medium">
                {dossier.direction?.sigle || dossier.direction?.label || '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Demandeur:</span>
              <span className="text-sm font-medium">{dossier.demandeur?.full_name || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Beneficiaire:</span>
              <span className="text-sm font-medium">
                {dossier.beneficiaire?.raison_sociale || '-'}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cree le:</span>
              <span className="text-sm">{formatDate(dossier.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cree par:</span>
              <span className="text-sm">{dossier.creator?.full_name || '-'}</span>
            </div>
            {dossier.date_cloture && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Cloture le:</span>
                <span className="text-sm">{formatDate(dossier.date_cloture)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Blocage alert */}
      {dossier.statut_global === 'bloque' && dossier.motif_blocage && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-300">Dossier bloque</p>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                {dossier.motif_blocage}
              </p>
              {dossier.date_blocage && (
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                  Depuis le {formatDate(dossier.date_blocage)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline de la chaine de depense */}
      <Card>
        <CardHeader>
          <CardTitle>Chaine de la Depense</CardTitle>
          <CardDescription>Progression du dossier a travers les 9 etapes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {ETAPES_CHAINE.map((etapeConfig, index) => {
              const status = getEtapeStatut(etapeConfig.key, etapes, dossier.etape_courante);
              const etapesForType = etapes.filter(
                (e) =>
                  e.type_etape === etapeConfig.key ||
                  (etapeConfig.key === 'note_sef' && e.type_etape === 'note')
              );
              const lastEtape =
                etapesForType.length > 0 ? etapesForType[etapesForType.length - 1] : null;
              const isLast = index === ETAPES_CHAINE.length - 1;
              const IconComponent = etapeConfig.icon;

              return (
                <div key={etapeConfig.key} className="flex gap-4 pb-6 last:pb-0">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0
                        ${
                          status === 'completed'
                            ? 'bg-green-100 border-green-500 dark:bg-green-950'
                            : status === 'active'
                              ? 'bg-blue-100 border-blue-500 dark:bg-blue-950 ring-2 ring-blue-300'
                              : status === 'rejected'
                                ? 'bg-red-100 border-red-500 dark:bg-red-950'
                                : 'bg-gray-50 border-gray-300 dark:bg-gray-900 dark:border-gray-600'
                        }
                      `}
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : status === 'active' ? (
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      ) : status === 'rejected' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <span className="text-sm font-bold text-gray-400">
                          {etapeConfig.stepNumber}
                        </span>
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[24px] ${
                          status === 'completed' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className={`font-medium ${
                          status === 'pending' ? 'text-muted-foreground' : ''
                        }`}
                      >
                        {etapeConfig.stepNumber}. {etapeConfig.label}
                      </span>
                      {lastEtape && getStatutEtapeBadge(lastEtape.statut)}
                    </div>
                    {lastEtape ? (
                      <div className="text-sm text-muted-foreground space-y-1">
                        {lastEtape.montant != null && lastEtape.montant > 0 && (
                          <p>Montant: {formatMontant(lastEtape.montant)}</p>
                        )}
                        <p>Date: {formatDateTime(lastEtape.created_at)}</p>
                        {lastEtape.creator?.full_name && <p>Par: {lastEtape.creator.full_name}</p>}
                        {lastEtape.commentaire && (
                          <p className="italic text-xs mt-1">"{lastEtape.commentaire}"</p>
                        )}
                      </div>
                    ) : status === 'pending' ? (
                      <p className="text-sm text-muted-foreground">En attente</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Historique detaille */}
      {etapes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des etapes</CardTitle>
            <CardDescription>{etapes.length} etape(s) enregistree(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {etapes.map((etape) => (
                <div key={etape.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  {getStatutIcon(etape.statut)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {ETAPE_LABELS[etape.type_etape] || etape.type_etape}
                      </span>
                      {getStatutEtapeBadge(etape.statut)}
                      {etape.montant != null && etape.montant > 0 && (
                        <span className="text-sm text-muted-foreground">
                          - {formatMontant(etape.montant)}
                        </span>
                      )}
                    </div>
                    {etape.commentaire && (
                      <p className="text-sm text-muted-foreground mt-1">{etape.commentaire}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(etape.created_at)}
                      {etape.creator?.full_name && ` - ${etape.creator.full_name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper components

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function MontantRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | null | undefined;
  highlight?: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colorClass = highlight
    ? {
        blue: 'text-blue-600',
        green: 'text-green-600',
        orange: 'text-orange-600',
        purple: 'text-purple-600',
      }[highlight]
    : '';

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${colorClass}`}>{formatMontant(value)}</span>
    </div>
  );
}

function ProgressBar({
  engaged,
  estimated,
}: {
  engaged: number | null | undefined;
  estimated: number | null | undefined;
}) {
  const engagedVal = engaged ?? 0;
  const estimatedVal = estimated ?? 0;
  const percentage = estimatedVal > 0 ? Math.min((engagedVal / estimatedVal) * 100, 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Taux d'engagement</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
