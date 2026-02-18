import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ShoppingCart,
  Building2,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Users,
  History,
} from 'lucide-react';
import { Marche, VALIDATION_STEPS, useMarches } from '@/hooks/useMarches';
import { MarcheDocumentsTab } from './MarcheDocumentsTab';
import { MarcheHistoriqueTab } from './MarcheHistoriqueTab';
import { MarcheOffresTab } from './MarcheOffresTab';

interface MarcheValidation {
  id: string;
  marche_id: string;
  step_order: number;
  role: string;
  status: string | null;
  comments: string | null;
  validated_at: string | null;
  validated_by: string | null;
  created_at: string;
  validator?: { id: string; first_name: string | null; last_name: string | null } | null;
}

interface MarcheDetailsProps {
  marche: Marche;
}

export function MarcheDetails({ marche }: MarcheDetailsProps) {
  const { getMarcheValidations } = useMarches();
  const [validations, setValidations] = useState<MarcheValidation[]>([]);

  useEffect(() => {
    getMarcheValidations(marche.id).then(setValidations);
  }, [marche.id, getMarcheValidations]);

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valide':
        return <Badge className="bg-green-100 text-green-700">Validé</Badge>;
      case 'rejete':
        return <Badge variant="destructive">Rejeté</Badge>;
      case 'differe':
        return <Badge className="bg-orange-100 text-orange-700">Différé</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-700">En cours</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'valide':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'en_cours':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'rejete':
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
                {marche.numero || 'Sans numéro'}
              </CardTitle>
              <CardDescription className="mt-1">{marche.objet}</CardDescription>
            </div>
            {getStatusBadge(marche.validation_status || 'en_attente')}
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
              <p className="font-medium">{marche.type_marche || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date d'attribution:</span>
              <p className="font-medium">
                {marche.date_attribution
                  ? format(new Date(marche.date_attribution), 'dd MMM yyyy', { locale: fr })
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs pour les sections */}
      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflow" className="gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="offres" className="gap-1">
            <Users className="h-4 w-4" />
            Offres
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-1">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="mt-4 space-y-4">
          {/* Prestataire & Références */}
          <div className="grid gap-6 lg:grid-cols-2">
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
                    {marche.prestataire.banque && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Banque:</span>
                        <span>{marche.prestataire.banque}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun prestataire assigné
                  </p>
                )}
              </CardContent>
            </Card>

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
                  <span>{marche.type_procedure || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée exécution:</span>
                  <span>{marche.duree_execution ? `${marche.duree_execution} jours` : '-'}</span>
                </div>
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
            </CardHeader>
            <CardContent>
              {validations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Chargement...</p>
              ) : (
                <div className="space-y-4">
                  {validations.map((validation) => {
                    const step = VALIDATION_STEPS.find((s) => s.order === validation.step_order);
                    return (
                      <div key={validation.id} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {getStepIcon(validation.status)}
                        </div>
                        <div className="flex-1 pb-4 border-b last:border-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{step?.label || validation.role}</p>
                            {getStatusBadge(validation.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offres" className="mt-4">
          <MarcheOffresTab marcheId={marche.id} canEdit={marche.validation_status !== 'valide'} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <MarcheDocumentsTab
            marcheId={marche.id}
            canEdit={marche.validation_status !== 'valide'}
          />
        </TabsContent>

        <TabsContent value="historique" className="mt-4">
          <MarcheHistoriqueTab marcheId={marche.id} />
        </TabsContent>
      </Tabs>

      {/* Motifs rejet/différé */}
      {(marche.rejection_reason || marche.differe_motif) && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertCircle className="h-5 w-5" />
              {marche.rejection_reason ? 'Motif de rejet' : 'Motif de mise en différé'}
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
