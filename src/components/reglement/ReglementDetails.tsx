import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CreditCard,
  Building2,
  Calendar,
  FileText,
  User,
  CheckCircle,
  Clock,
  Lock,
  ExternalLink,
  History,
  Wallet
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MODES_PAIEMENT, COMPTES_BANCAIRES_ARTI, useReglements } from "@/hooks/useReglements";
import { DossierStepTimeline } from "@/components/shared/DossierStepTimeline";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";

interface ReglementDetailsProps {
  reglement: any;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
};

const getModePaiementLabel = (mode: string) => {
  return MODES_PAIEMENT.find(m => m.value === mode)?.label || mode;
};

const getCompteLabel = (compte: string) => {
  return COMPTES_BANCAIRES_ARTI.find(c => c.value === compte)?.label || compte;
};

export function ReglementDetails({ reglement }: ReglementDetailsProps) {
  const { getTreasuryLink } = useReglements();
  const ordonnancement = reglement.ordonnancement;
  const engagement = ordonnancement?.liquidation?.engagement;
  const liquidation = ordonnancement?.liquidation;
  const budgetLine = engagement?.budget_line;

  const montantOrdonnance = ordonnancement?.montant || 0;
  const montantPaye = ordonnancement?.montant_paye || 0;
  const restantAPayer = montantOrdonnance - montantPaye;
  const progressPaiement = montantOrdonnance > 0 ? (montantPaye / montantOrdonnance) * 100 : 0;
  const isFullyPaid = restantAPayer <= 0;

  // Treasury link
  const treasuryLink = getTreasuryLink(reglement.id, reglement.compte_bancaire_arti);

  return (
    <div className="space-y-6">
      {/* Header avec statut */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{reglement.numero}</h2>
          <p className="text-muted-foreground">
            Enregistré le {format(new Date(reglement.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFullyPaid ? (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle className="mr-1 h-3 w-3" />
              Soldé
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              <Clock className="mr-1 h-3 w-3" />
              Partiel
            </Badge>
          )}
          {/* Treasury link button */}
          <Button variant="outline" size="sm" asChild>
            <Link to={treasuryLink}>
              <Wallet className="mr-2 h-4 w-4" />
              Ouvrir dans Trésorerie
              <ExternalLink className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Closure alert if fully paid */}
      {isFullyPaid && (
        <Alert className="bg-success/10 border-success/30">
          <Lock className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Dossier clôturé</AlertTitle>
          <AlertDescription>
            Le dossier est maintenant en lecture seule. Tous les paiements ont été effectués.
            La chaîne de dépense est complète.
          </AlertDescription>
        </Alert>
      )}

      {/* Dossier step timeline */}
      <DossierStepTimeline
        currentStep="reglement"
        engagementId={engagement?.id}
        liquidationId={liquidation?.id}
        ordonnancementId={ordonnancement?.id}
        reglementId={reglement.id}
        engagementStatus="valide"
        liquidationStatus="valide"
        ordonnancementStatus="valide"
        reglementStatus={isFullyPaid ? "solde" : "en_cours"}
        compact
      />

      {/* Tabs for details and journal */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details" className="gap-2">
            <FileText className="h-4 w-4" />
            Détails
          </TabsTrigger>
          <TabsTrigger value="journal" className="gap-2">
            <History className="h-4 w-4" />
            Journal d'audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informations du règlement */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Informations du règlement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date de paiement</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(reglement.date_paiement), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mode de paiement</p>
                <Badge variant="outline">{getModePaiementLabel(reglement.mode_paiement)}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant payé</p>
                <p className="text-xl font-bold text-success">{formatMontant(reglement.montant)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Référence</p>
                <p className="font-medium">{reglement.reference_paiement || "-"}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">Compte bancaire ARTI</p>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{getCompteLabel(reglement.compte_bancaire_arti)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Banque: {reglement.banque_arti}</p>
            </div>

            {reglement.observation && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observation</p>
                  <p className="text-sm">{reglement.observation}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Informations de l'ordonnancement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ordonnancement associé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">N° Ordonnancement</p>
                <p className="font-mono font-medium">{ordonnancement?.numero || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bénéficiaire</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {ordonnancement?.beneficiaire || "-"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Objet</p>
              <p className="text-sm">{ordonnancement?.objet || "-"}</p>
            </div>

            <Separator />

            {/* Progression du paiement */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progression du paiement</span>
                <span className="text-sm font-medium">{progressPaiement.toFixed(0)}%</span>
              </div>
              <Progress value={progressPaiement} className="h-3" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Payé: {formatMontant(montantPaye)}</span>
                <span>Total: {formatMontant(montantOrdonnance)}</span>
              </div>
              {!isFullyPaid && (
                <p className="mt-2 text-sm text-warning">
                  Restant à payer: {formatMontant(restantAPayer)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Chaîne de traçabilité */}
          <Card>
            <CardHeader>
              <CardTitle>Chaîne de traçabilité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                <div className="flex-shrink-0 text-center">
                  <Badge variant="outline" className="mb-1">Ligne budgétaire</Badge>
                  <p className="text-sm font-mono">{budgetLine?.code || "-"}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {budgetLine?.label || "-"}
                  </p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-shrink-0 text-center">
                  <Badge variant="outline" className="mb-1">Engagement</Badge>
                  <p className="text-sm font-mono">{engagement?.numero || "-"}</p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-shrink-0 text-center">
                  <Badge variant="outline" className="mb-1">Liquidation</Badge>
                  <p className="text-sm font-mono">{ordonnancement?.liquidation?.numero || "-"}</p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-shrink-0 text-center">
                  <Badge variant="outline" className="mb-1">Ordonnancement</Badge>
                  <p className="text-sm font-mono">{ordonnancement?.numero || "-"}</p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex-shrink-0 text-center">
                  <Badge className="mb-1 bg-success">Règlement</Badge>
                  <p className="text-sm font-mono">{reglement.numero}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Créé par */}
          {reglement.created_by_profile && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Enregistré par</p>
                    <p className="font-medium">
                      {reglement.created_by_profile.prenom} {reglement.created_by_profile.nom}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="journal" className="pt-4">
          <AuditLogViewer entityType="reglement" entityId={reglement.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
