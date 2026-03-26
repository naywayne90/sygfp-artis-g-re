import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Building2,
  FileText,
  Calculator,
  Lock,
  FolderOpen,
  Link2,
  CalendarDays,
  AlertTriangle,
  Receipt,
  MinusCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Engagement,
  BudgetAvailability,
  VALIDATION_STEPS,
  useEngagements,
} from '@/hooks/useEngagements';
import { QRCodeGenerator } from '@/components/qrcode/QRCodeGenerator';
import { EngagementChainNav } from './EngagementChainNav';
import { EngagementDetailsBudget } from './EngagementDetailsBudget';
import { EngagementDetailsValidation } from './EngagementDetailsValidation';
import { EngagementDetailsDocuments } from './EngagementDetailsDocuments';
import { EngagementDetailsLiquidations } from './EngagementDetailsLiquidations';
import { EngagementDetailsChain } from './EngagementDetailsChain';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

interface EngagementDetailsProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PrestataireFull {
  raison_sociale: string;
  rccm: string | null;
  contact_telephone: string | null;
  contact_email: string | null;
  adresse: string | null;
  nif: string | null;
}

interface OtherEngagement {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  statut: string | null;
  date_engagement: string;
}

interface CreditTransfer {
  id: string;
  amount: number;
  status: string;
  motif: string | null;
  created_at: string;
  from_budget_line_id: string | null;
  to_budget_line_id: string | null;
}

interface EngagementLiquidation {
  id: string;
  numero: string;
  montant: number;
  net_a_payer: number | null;
  reference_facture: string | null;
  date_liquidation: string;
  statut: string | null;
}

interface VisaProfile {
  id: string;
  full_name: string | null;
}

function getStatutBadge(statut: string | null) {
  switch (statut) {
    case 'soumis':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Soumis</Badge>;
    case 'visa_saf':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">Visa Sous-Dir DAAF</Badge>
      );
    case 'visa_cb':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Visa CB</Badge>;
    case 'visa_daaf':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Visa DAAF</Badge>;
    case 'valide':
      return <Badge className="bg-green-100 text-green-700 border-green-200">Validé</Badge>;
    case 'rejete':
      return <Badge variant="destructive">Rejeté</Badge>;
    case 'differe':
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Différé</Badge>;
    case 'annule':
      return <Badge variant="secondary">Annulé</Badge>;
    default:
      return <Badge variant="outline">{statut || '—'}</Badge>;
  }
}

export function EngagementDetails({ engagement, open, onOpenChange }: EngagementDetailsProps) {
  const { calculateAvailability } = useEngagements();
  const [availability, setAvailability] = useState<BudgetAvailability | null>(null);
  const [isCheckingBudget, setIsCheckingBudget] = useState(false);
  const [prestataire, setPrestataire] = useState<PrestataireFull | null>(null);
  const [otherEngagements, setOtherEngagements] = useState<OtherEngagement[]>([]);
  const [creditTransfers, setCreditTransfers] = useState<CreditTransfer[]>([]);
  const [visaProfiles, setVisaProfiles] = useState<Record<string, string>>({});
  const [isLoadingOthers, setIsLoadingOthers] = useState(false);
  const [engLiquidations, setEngLiquidations] = useState<EngagementLiquidation[]>([]);
  const [isLoadingLiquidations, setIsLoadingLiquidations] = useState(false);

  // Fetch budget availability
  useEffect(() => {
    if (!engagement?.budget_line_id || !engagement?.montant) {
      setAvailability(null);
      return;
    }
    setIsCheckingBudget(true);
    calculateAvailability(engagement.budget_line_id, engagement.montant, engagement.id)
      .then(setAvailability)
      .catch(() => setAvailability(null))
      .finally(() => setIsCheckingBudget(false));
  }, [engagement?.budget_line_id, engagement?.montant, engagement?.id, calculateAvailability]);

  // Fetch prestataire details
  useEffect(() => {
    if (!engagement) {
      setPrestataire(null);
      return;
    }
    const prestataireId =
      engagement.marche?.prestataire?.id || engagement.expression_besoin?.marche?.prestataire?.id;
    if (!prestataireId) {
      setPrestataire(null);
      return;
    }
    supabase
      .from('prestataires')
      .select('raison_sociale, rccm, contact_telephone, contact_email, adresse, nif')
      .eq('id', prestataireId)
      .single()
      .then(({ data }) => {
        if (data) setPrestataire(data as PrestataireFull);
      });
  }, [
    engagement,
    engagement?.id,
    engagement?.marche?.prestataire?.id,
    engagement?.expression_besoin?.marche?.prestataire?.id,
  ]);

  // Fetch other engagements on the same budget line
  useEffect(() => {
    if (!engagement?.budget_line_id || !engagement?.id) {
      setOtherEngagements([]);
      return;
    }
    setIsLoadingOthers(true);
    supabase
      .from('budget_engagements')
      .select('id, numero, objet, montant, statut, date_engagement')
      .eq('budget_line_id', engagement.budget_line_id)
      .neq('id', engagement.id)
      .neq('statut', 'annule')
      .order('date_engagement', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setOtherEngagements((data || []) as OtherEngagement[]);
        setIsLoadingOthers(false);
      });
  }, [engagement?.budget_line_id, engagement?.id]);

  // Fetch credit transfers on this budget line
  useEffect(() => {
    if (!engagement?.budget_line_id) {
      setCreditTransfers([]);
      return;
    }
    supabase
      .from('credit_transfers')
      .select('id, amount, status, motif, requested_at, from_budget_line_id, to_budget_line_id')
      .or(
        `from_budget_line_id.eq.${engagement.budget_line_id},to_budget_line_id.eq.${engagement.budget_line_id}`
      )
      .eq('status', 'execute')
      .order('requested_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setCreditTransfers((data || []) as unknown as CreditTransfer[]);
      });
  }, [engagement?.budget_line_id]);

  // Fetch liquidations for this engagement
  useEffect(() => {
    if (!engagement?.id) {
      setEngLiquidations([]);
      return;
    }
    setIsLoadingLiquidations(true);
    supabase
      .from('budget_liquidations')
      .select('id, numero, montant, net_a_payer, reference_facture, date_liquidation, statut')
      .eq('engagement_id', engagement.id)
      .neq('statut', 'annule')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setEngLiquidations((data || []) as EngagementLiquidation[]);
        setIsLoadingLiquidations(false);
      });
  }, [engagement?.id]);

  // Fetch profiles for visa user IDs
  useEffect(() => {
    if (!engagement) return;
    const userIds = [
      engagement.visa_saf_user_id,
      engagement.visa_cb_user_id,
      engagement.visa_daaf_user_id,
      engagement.visa_dg_user_id,
      engagement.created_by,
    ].filter(Boolean) as string[];
    if (userIds.length === 0) return;

    const uniqueIds = [...new Set(userIds)];
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', uniqueIds)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data as VisaProfile[] | null)?.forEach((p) => {
          if (p.full_name) map[p.id] = p.full_name;
        });
        setVisaProfiles(map);
      });
  }, [
    engagement,
    engagement?.visa_saf_user_id,
    engagement?.visa_cb_user_id,
    engagement?.visa_daaf_user_id,
    engagement?.visa_dg_user_id,
    engagement?.created_by,
  ]);

  if (!engagement) return null;

  const isLocked = engagement.statut === 'valide';
  const isSurMarche = engagement.type_engagement === 'sur_marche';

  // Build visa details from engagement columns
  const visaDetails = VALIDATION_STEPS.map((step) => {
    const prefix = step.visaPrefix;
    const userId = engagement[`${prefix}_user_id` as keyof Engagement] as string | null;
    const date = engagement[`${prefix}_date` as keyof Engagement] as string | null;
    const commentaire = engagement[`${prefix}_commentaire` as keyof Engagement] as string | null;
    return {
      ...step,
      userId,
      date,
      commentaire,
      validatorName: userId ? visaProfiles[userId] || null : null,
      isCompleted: !!date,
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <span>Engagement {engagement.numero}</span>
              {getStatutBadge(engagement.statut)}
              {isSurMarche ? (
                <Badge variant="outline" className="gap-1 bg-blue-50">
                  <FileText className="h-3 w-3" />
                  Sur marché
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  Hors marché
                </Badge>
              )}
              {isLocked && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Verrouillé
                </Badge>
              )}
            </DialogTitle>
            {/* QR code pour engagements validés */}
            {engagement.statut === 'valide' && engagement.visa_dg_date && (
              <QRCodeGenerator
                reference={engagement.numero}
                type="ENGAGEMENT"
                dateValidation={engagement.visa_dg_date}
                validateur={
                  (engagement.visa_dg_user_id && visaProfiles[engagement.visa_dg_user_id]) || 'DG'
                }
                size="sm"
                showHash
              />
            )}
          </div>
        </DialogHeader>

        {/* Barre chaîne : Passation <-> Engagement <-> Liquidation */}
        <EngagementChainNav engagement={engagement} onCloseDialog={() => onOpenChange(false)} />

        <ScrollArea className="max-h-[70vh] pr-4">
          <Tabs defaultValue="informations" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-4">
              <TabsTrigger value="informations" className="gap-1 text-xs">
                <FileText className="h-3.5 w-3.5" />
                Informations
              </TabsTrigger>
              <TabsTrigger value="budget" className="gap-1 text-xs">
                <Calculator className="h-3.5 w-3.5" />
                Budget
              </TabsTrigger>
              <TabsTrigger value="validation" className="gap-1 text-xs">
                <User className="h-3.5 w-3.5" />
                Validation
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-1 text-xs">
                <FolderOpen className="h-3.5 w-3.5" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="liquidations" className="gap-1 text-xs">
                <Receipt className="h-3.5 w-3.5" />
                Liquidations
              </TabsTrigger>
              <TabsTrigger value="chaine" className="gap-1 text-xs">
                <Link2 className="h-3.5 w-3.5" />
                Chaîne
              </TabsTrigger>
            </TabsList>

            {/* ===== ONGLET 1 — INFORMATIONS ===== */}
            <TabsContent value="informations" className="space-y-4">
              {/* Informations générales */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Référence :</span>
                      <span className="ml-2 font-medium">{engagement.numero}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Exercice :</span>
                      <span className="ml-2 font-medium">{engagement.exercice || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Objet :</span>
                      <p className="mt-1 font-medium">{engagement.objet}</p>
                    </div>
                    {engagement.budget_line?.direction && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Direction :</span>
                        <span className="ml-2 font-medium">
                          {engagement.budget_line.direction.sigle
                            ? `${engagement.budget_line.direction.sigle} — ${engagement.budget_line.direction.label}`
                            : engagement.budget_line.direction.label}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Montants */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Montants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-muted-foreground text-xs">Montant HT</div>
                      <div className="font-bold text-sm">
                        {engagement.montant_ht ? formatCurrency(engagement.montant_ht) : 'N/A'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-muted-foreground text-xs">
                        TVA ({engagement.tva || 0}%)
                      </div>
                      <div className="font-bold text-sm">
                        {engagement.montant_ht && engagement.tva
                          ? formatCurrency(engagement.montant_ht * (engagement.tva / 100))
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                      <div className="text-primary text-xs font-medium">Montant engagé</div>
                      <div className="font-bold text-primary">
                        {formatCurrency(engagement.montant)}
                      </div>
                    </div>
                  </div>
                  {isSurMarche && engagement.marche && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                      <span className="text-muted-foreground">Montant du marché :</span>
                      <span className="ml-2 font-bold">
                        {formatCurrency(engagement.marche.montant)}
                      </span>
                      {engagement.marche.numero && (
                        <span className="ml-2 text-muted-foreground">
                          (Réf. {engagement.marche.numero})
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dégagement (si montant_degage > 0) */}
              {(engagement.montant_degage || 0) > 0 && (
                <Card className="border-orange-500/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                      <MinusCircle className="h-4 w-4" />
                      Dégagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Montant dégagé :</span>
                        <span className="ml-2 font-bold text-orange-600">
                          {formatCurrency(engagement.montant_degage || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Montant net :</span>
                        <span className="ml-2 font-bold text-primary">
                          {formatCurrency(engagement.montant - (engagement.montant_degage || 0))}
                        </span>
                      </div>
                      {engagement.motif_degage && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Motif :</span>
                          <p className="mt-1">{engagement.motif_degage}</p>
                        </div>
                      )}
                      {engagement.degage_at && (
                        <div>
                          <span className="text-muted-foreground">Date :</span>
                          <span className="ml-2">
                            {format(new Date(engagement.degage_at), 'dd MMMM yyyy', {
                              locale: fr,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fournisseur / Prestataire */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {isSurMarche ? 'Prestataire' : 'Fournisseur'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Raison sociale :</span>
                      <span className="ml-2 font-medium">
                        {prestataire?.raison_sociale || engagement.fournisseur || 'N/A'}
                      </span>
                    </div>
                    {prestataire?.rccm && (
                      <div>
                        <span className="text-muted-foreground">RCCM :</span>
                        <span className="ml-2 font-medium">{prestataire.rccm}</span>
                      </div>
                    )}
                    {prestataire?.nif && (
                      <div>
                        <span className="text-muted-foreground">NIF :</span>
                        <span className="ml-2 font-medium">{prestataire.nif}</span>
                      </div>
                    )}
                    {prestataire?.contact_telephone && (
                      <div>
                        <span className="text-muted-foreground">Téléphone :</span>
                        <span className="ml-2 font-medium">{prestataire.contact_telephone}</span>
                      </div>
                    )}
                    {prestataire?.contact_email && (
                      <div>
                        <span className="text-muted-foreground">Email :</span>
                        <span className="ml-2 font-medium">{prestataire.contact_email}</span>
                      </div>
                    )}
                    {prestataire?.adresse && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Adresse :</span>
                        <span className="ml-2">{prestataire.adresse}</span>
                      </div>
                    )}
                    {!prestataire && !engagement.fournisseur && (
                      <p className="col-span-2 text-muted-foreground italic">
                        Aucun fournisseur renseigné
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dates et métadonnées */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Dates et traçabilité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date de création :</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(engagement.created_at), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date d'engagement :</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(engagement.date_engagement), 'dd MMMM yyyy', {
                          locale: fr,
                        })}
                      </span>
                    </div>
                    {engagement.visa_dg_date && (
                      <div>
                        <span className="text-muted-foreground">Date de validation :</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(engagement.visa_dg_date), 'dd MMMM yyyy', {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    )}
                    {engagement.created_by && (
                      <div>
                        <span className="text-muted-foreground">Créé par :</span>
                        <span className="ml-2 font-medium">
                          {visaProfiles[engagement.created_by] ||
                            engagement.creator?.full_name ||
                            '—'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Motif rejet */}
              {engagement.statut === 'rejete' && engagement.motif_rejet && (
                <Card className="border-destructive/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Motif du rejet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{engagement.motif_rejet}</p>
                  </CardContent>
                </Card>
              )}

              {/* Motif différé */}
              {engagement.statut === 'differe' && engagement.motif_differe && (
                <Card className="border-yellow-500/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-yellow-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Motif du report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{engagement.motif_differe}</p>
                    {engagement.deadline_correction && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Date de reprise prévue :{' '}
                        {format(new Date(engagement.deadline_correction), 'dd/MM/yyyy', {
                          locale: fr,
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ===== ONGLET 2 — BUDGET ===== */}
            <TabsContent value="budget">
              <EngagementDetailsBudget
                engagement={engagement}
                availability={availability}
                isCheckingBudget={isCheckingBudget}
                creditTransfers={creditTransfers}
                otherEngagements={otherEngagements}
                isLoadingOthers={isLoadingOthers}
              />
            </TabsContent>

            {/* ===== ONGLET 3 — VALIDATION ===== */}
            <TabsContent value="validation">
              <EngagementDetailsValidation engagement={engagement} visaDetails={visaDetails} />
            </TabsContent>

            {/* ===== ONGLET 4 — DOCUMENTS ===== */}
            <TabsContent value="documents">
              <EngagementDetailsDocuments
                engagement={engagement}
                onCloseDialog={() => onOpenChange(false)}
              />
            </TabsContent>

            {/* ===== ONGLET 5 — LIQUIDATIONS ===== */}
            <TabsContent value="liquidations">
              <EngagementDetailsLiquidations
                engagement={engagement}
                engLiquidations={engLiquidations}
                isLoadingLiquidations={isLoadingLiquidations}
                onCloseDialog={() => onOpenChange(false)}
              />
            </TabsContent>

            {/* ===== ONGLET 6 — CHAÎNE DE LA DÉPENSE ===== */}
            <TabsContent value="chaine">
              <EngagementDetailsChain
                engagement={engagement}
                onCloseDialog={() => onOpenChange(false)}
              />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
