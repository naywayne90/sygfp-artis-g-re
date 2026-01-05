import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ShoppingCart, 
  Building2, 
  Target, 
  CreditCard, 
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  User
} from "lucide-react";
import { Marche, VALIDATION_STEPS, useMarches } from "@/hooks/useMarches";

interface MarcheDetailsProps {
  marche: Marche;
}

export function MarcheDetails({ marche }: MarcheDetailsProps) {
  const { getMarcheValidations } = useMarches();
  const [validations, setValidations] = useState<any[]>([]);

  useEffect(() => {
    getMarcheValidations(marche.id).then(setValidations);
  }, [marche.id]);

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valide":
        return <Badge className="bg-green-100 text-green-700">Validé</Badge>;
      case "rejete":
        return <Badge variant="destructive">Rejeté</Badge>;
      case "differe":
        return <Badge className="bg-orange-100 text-orange-700">Différé</Badge>;
      case "en_cours":
        return <Badge className="bg-blue-100 text-blue-700">En cours</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "valide":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "en_cours":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "rejete":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                {marche.numero || "Sans numéro"}
              </CardTitle>
              <CardDescription className="mt-1">{marche.objet}</CardDescription>
            </div>
            {getStatusBadge(marche.validation_status || "en_attente")}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div>
              <span className="text-muted-foreground">Montant:</span>
              <p className="font-bold text-lg text-primary">{formatMontant(marche.montant)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mode de passation:</span>
              <p className="font-medium">{marche.mode_passation}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Type de marché:</span>
              <p className="font-medium">{marche.type_marche || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date d'attribution:</span>
              <p className="font-medium">
                {marche.date_attribution
                  ? format(new Date(marche.date_attribution), "dd MMM yyyy", { locale: fr })
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Prestataire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Prestataire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {marche.prestataire ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Raison sociale:</span>
                  <span className="font-medium">{marche.prestataire.raison_sociale}</span>
                </div>
                {marche.prestataire.sigle && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sigle:</span>
                    <span>{marche.prestataire.sigle}</span>
                  </div>
                )}
                <Separator />
                {marche.prestataire.banque && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banque:</span>
                    <span>{marche.prestataire.banque}</span>
                  </div>
                )}
                {marche.prestataire.mode_paiement && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mode paiement:</span>
                    <Badge variant="outline">{marche.prestataire.mode_paiement}</Badge>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">Aucun prestataire assigné</p>
            )}
          </CardContent>
        </Card>

        {/* Références passation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Références passation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type procédure:</span>
              <span>{marche.type_procedure || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre de lots:</span>
              <span>{marche.nombre_lots || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Numéro/Intitulé lot:</span>
              <span>Lot {marche.numero_lot || 1} {marche.intitule_lot ? `- ${marche.intitule_lot}` : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durée exécution:</span>
              <span>{marche.duree_execution ? `${marche.duree_execution} jours` : "-"}</span>
            </div>
            {marche.observations && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Observations:</span>
                  <p className="mt-1">{marche.observations}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow de validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5" />
            Workflow de validation
          </CardTitle>
          <CardDescription>
            Suivi des étapes de validation du marché
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {validations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Chargement...</p>
            ) : (
              <div className="space-y-4">
                {validations.map((validation, index) => {
                  const step = VALIDATION_STEPS.find(s => s.order === validation.step_order);
                  return (
                    <div key={validation.id} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {getStepIcon(validation.status)}
                      </div>
                      <div className="flex-1 pb-4 border-b last:border-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{step?.label || validation.role}</p>
                            <p className="text-sm text-muted-foreground">{step?.description}</p>
                          </div>
                          {getStatusBadge(validation.status)}
                        </div>
                        {validation.validated_at && (
                          <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>
                              {validation.validator?.first_name} {validation.validator?.last_name} -
                              {format(new Date(validation.validated_at), " dd MMM yyyy à HH:mm", { locale: fr })}
                            </span>
                          </div>
                        )}
                        {validation.comments && (
                          <p className="mt-2 text-sm bg-muted p-2 rounded">{validation.comments}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Motifs rejet/différé */}
      {(marche.rejection_reason || marche.differe_motif) && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertCircle className="h-5 w-5" />
              {marche.rejection_reason ? "Motif de rejet" : "Motif de mise en différé"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{marche.rejection_reason || marche.differe_motif}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
