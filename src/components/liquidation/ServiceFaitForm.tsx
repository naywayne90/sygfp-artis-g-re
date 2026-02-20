import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileText,
  Loader2,
  Shield,
  ClipboardCheck,
  User,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const serviceFaitSchema = z.object({
  service_fait: z.boolean(),
  service_fait_date: z.string().min(1, 'Date requise'),
  reference_facture: z.string().min(1, 'Référence facture requise'),
  observation: z.string().optional(),
});

type ServiceFaitFormData = z.infer<typeof serviceFaitSchema>;

interface ServiceFaitFormProps {
  liquidationId: string;
  liquidation: {
    id: string;
    numero: string;
    montant: number;
    service_fait?: boolean;
    service_fait_date?: string;
    service_fait_certifie_par?: string;
    reference_facture?: string;
    observation?: string;
    statut?: string;
    created_by?: string;
    engagement?: {
      numero: string;
      objet: string;
      fournisseur?: string;
    };
  };
  onSuccess?: () => void;
  readOnly?: boolean;
}

export function ServiceFaitForm({
  liquidationId,
  liquidation,
  onSuccess,
  readOnly = false,
}: ServiceFaitFormProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pjStatus, setPjStatus] = useState<{
    hasFacture: boolean;
    hasBonLivraison: boolean;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [certifierName, setCertifierName] = useState<string | null>(null);
  const { logAction } = useAuditLog();
  const { hasAnyRole } = usePermissions();

  // Vérifier les PJ obligatoires (facture + bon_livraison)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('liquidation_attachments')
        .select('document_type')
        .eq('liquidation_id', liquidationId);
      const types = (data || []).map((d) => d.document_type);
      setPjStatus({
        hasFacture: types.includes('facture'),
        hasBonLivraison: types.includes('bon_livraison'),
      });
    })();
  }, [liquidationId]);

  // Récupérer l'utilisateur courant
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  // Récupérer le nom du certificateur
  useEffect(() => {
    if (liquidation.service_fait_certifie_par) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', liquidation.service_fait_certifie_par)
        .single()
        .then(({ data }) => {
          setCertifierName(data?.full_name || null);
        });
    }
  }, [liquidation.service_fait_certifie_par]);

  const isAuthor =
    currentUserId && liquidation.created_by && currentUserId === liquidation.created_by;
  const hasRole = hasAnyRole(['ADMIN', 'SDCT', 'DAAF', 'DIRECTION']);
  const pjComplete = pjStatus ? pjStatus.hasFacture && pjStatus.hasBonLivraison : false;
  const canCertify = (isAuthor || hasRole) && !readOnly && pjComplete;
  const isAlreadyCertified =
    liquidation.service_fait === true || liquidation.statut === 'certifié_sf';

  const form = useForm<ServiceFaitFormData>({
    resolver: zodResolver(serviceFaitSchema),
    defaultValues: {
      service_fait: liquidation.service_fait || false,
      service_fait_date: liquidation.service_fait_date || format(new Date(), 'yyyy-MM-dd'),
      reference_facture: liquidation.reference_facture || '',
      observation: liquidation.observation || '',
    },
  });

  const onSubmit = async (_data: ServiceFaitFormData) => {
    if (!canCertify) {
      toast.error("Vous n'avez pas les droits pour certifier le service fait");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const formData = form.getValues();

      // Mettre à jour la liquidation + statut certifié_sf
      const updatePayload: Record<string, unknown> = {
        service_fait: formData.service_fait,
        service_fait_date: formData.service_fait ? formData.service_fait_date : null,
        service_fait_certifie_par: formData.service_fait ? user.id : null,
        reference_facture: formData.reference_facture,
        observation: formData.observation,
      };

      // Si on certifie, on passe le statut à certifié_sf
      if (formData.service_fait && liquidation.statut === 'brouillon') {
        updatePayload.statut = 'certifié_sf';
      }

      const { error } = await supabase
        .from('budget_liquidations')
        .update(updatePayload)
        .eq('id', liquidationId);

      if (error) throw error;

      // Logger l'action
      await logAction({
        entityType: 'liquidation',
        entityId: liquidationId,
        action: 'validate',
        oldValues: {
          service_fait: liquidation.service_fait,
          service_fait_date: liquidation.service_fait_date,
        },
        newValues: {
          service_fait: formData.service_fait,
          service_fait_date: formData.service_fait_date,
          reference_facture: formData.reference_facture,
          action_type: 'SERVICE_FAIT',
        },
      });

      toast.success(
        formData.service_fait
          ? 'Service fait certifié avec succès'
          : 'Certification du service fait annulée'
      );

      onSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur:', error);
      toast.error('Erreur: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5" />
            Certification du service fait
            {isAlreadyCertified && (
              <Badge className="bg-success text-white ml-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Certifié
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Informations de l'engagement */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Engagement:</span>
                <span className="ml-2 font-medium">{liquidation.engagement?.numero}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Montant:</span>
                <span className="ml-2 font-bold">{formatCurrency(liquidation.montant)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Objet:</span>
                <span className="ml-2">{liquidation.engagement?.objet}</span>
              </div>
              {liquidation.engagement?.fournisseur && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Fournisseur:</span>
                  <span className="ml-2">{liquidation.engagement.fournisseur}</span>
                </div>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Toggle service fait */}
              <FormField
                control={form.control}
                name="service_fait"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Service fait
                      </FormLabel>
                      <FormDescription>
                        Je certifie que le service/la livraison a été effectué(e) conformément aux
                        termes du contrat
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canCertify || loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('service_fait') && (
                <>
                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Date du service fait */}
                    <FormField
                      control={form.control}
                      name="service_fait_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date du service fait
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} disabled={!canCertify || loading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Référence facture */}
                    <FormField
                      control={form.control}
                      name="reference_facture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Référence facture
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="N° facture"
                              disabled={!canCertify || loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Observation */}
                  <FormField
                    control={form.control}
                    name="observation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observations</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Observations éventuelles sur le service fait..."
                            rows={3}
                            disabled={!canCertify || loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Alerte PJ manquantes */}
              {pjStatus && !pjComplete && !readOnly && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Pièces justificatives manquantes</p>
                    <p className="text-muted-foreground">
                      {!pjStatus.hasFacture && 'Facture obligatoire. '}
                      {!pjStatus.hasBonLivraison && 'Bon de livraison obligatoire. '}
                      Veuillez téléverser ces documents avant de certifier.
                    </p>
                  </div>
                </div>
              )}

              {/* Alerte si pas de droit */}
              {pjComplete && !isAuthor && !hasRole && !readOnly && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Accès restreint</p>
                    <p className="text-muted-foreground">
                      Seul l'auteur de la liquidation ou les rôles SDCT, DAAF, Direction peuvent
                      certifier le service fait.
                    </p>
                  </div>
                </div>
              )}

              {/* Bouton de soumission */}
              {canCertify && (
                <div className="flex justify-end gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isAlreadyCertified ? 'Modifier la certification' : 'Certifier le service fait'}
                  </Button>
                </div>
              )}

              {/* Info certification existante */}
              {isAlreadyCertified && liquidation.service_fait_date && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-sm">
                  <div className="flex items-center gap-2 text-success font-medium mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Service fait certifié
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {format(new Date(liquidation.service_fait_date), 'dd MMMM yyyy', {
                        locale: fr,
                      })}
                    </p>
                    {certifierName && (
                      <p className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="font-medium">Certifié par:</span> {certifierName}
                      </p>
                    )}
                    {liquidation.reference_facture && (
                      <p>
                        <span className="font-medium">Réf. facture:</span>{' '}
                        {liquidation.reference_facture}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Confirmer la certification
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Vous êtes sur le point de certifier le service fait pour la liquidation{' '}
                  <strong>{liquidation.numero}</strong>.
                </p>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p>
                    <strong>Montant:</strong> {formatCurrency(liquidation.montant)}
                  </p>
                  <p>
                    <strong>Date:</strong>{' '}
                    {format(new Date(form.getValues('service_fait_date')), 'dd/MM/yyyy')}
                  </p>
                  <p>
                    <strong>Réf. facture:</strong> {form.getValues('reference_facture')}
                  </p>
                </div>
                <p className="text-warning flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Cette action sera tracée dans le journal d'audit.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
