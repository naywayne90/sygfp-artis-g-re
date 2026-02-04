/**
 * NotificationTemplateEditor - Éditeur de template de notification
 * Avec variables disponibles, aperçu en temps réel et validation
 */

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText,
  Variable,
  Eye,
  AlertCircle,
  CheckCircle,
  Copy,
  Loader2,
  Save,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  type NotificationTemplate,
  type NotificationEventType,
  EVENT_TYPE_LABELS,
  DEFAULT_VARIABLES,
} from '@/hooks/useNotificationSettings';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const templateFormSchema = z.object({
  titre_template: z.string().min(5, 'Le titre doit contenir au moins 5 caractères').max(200, 'Le titre ne doit pas dépasser 200 caractères'),
  corps_template: z.string().min(10, 'Le corps doit contenir au moins 10 caractères').max(2000, 'Le corps ne doit pas dépasser 2000 caractères'),
  est_actif: z.boolean(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

export interface NotificationTemplateEditorProps {
  /** Template à éditer */
  template: NotificationTemplate;
  /** Callback lors de la sauvegarde */
  onSave: (data: { id: string; titre_template: string; corps_template: string; est_actif: boolean }) => Promise<void>;
  /** Callback lors de l'annulation */
  onCancel: () => void;
  /** En cours de sauvegarde */
  isSaving?: boolean;
}

// ============================================================================
// DONNÉES DE TEST POUR L'APERÇU
// ============================================================================

const TEST_DATA: Record<string, string> = {
  reference: 'NSEF-2026-001234',
  montant: '15 500 000',
  montant_regle: '10 000 000',
  montant_total: '15 500 000',
  reste_a_payer: '5 500 000',
  fournisseur: 'SOGATRA SA',
  date: '03/02/2026',
  direction: 'Direction des Systèmes d\'Information',
  objet: 'Acquisition de matériel informatique',
  createur: 'Jean MOUSSAVOU',
  validateur: 'Marie NDONG',
  mode_paiement: 'Virement bancaire',
  banque: 'BGFI Bank',
  motif: 'Pièces justificatives manquantes',
  commentaire: 'Dossier conforme aux exigences',
  ligne_budgetaire: '6234-01 - Matériel informatique',
};

// ============================================================================
// COMPOSANT
// ============================================================================

export function NotificationTemplateEditor({
  template,
  onSave,
  onCancel,
  isSaving = false,
}: NotificationTemplateEditorProps) {
  const [showPreview, setShowPreview] = useState(true);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      titre_template: template.titre_template,
      corps_template: template.corps_template,
      est_actif: template.est_actif,
    },
  });

  const watchTitre = form.watch('titre_template');
  const watchCorps = form.watch('corps_template');

  // Variables disponibles pour ce type d'événement
  const availableVariables = useMemo(() => {
    return template.variables_disponibles.length > 0
      ? template.variables_disponibles
      : DEFAULT_VARIABLES[template.type_evenement as NotificationEventType] || [];
  }, [template]);

  // Variables utilisées dans le template actuel
  const usedVariables = useMemo(() => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = new Set<string>();
    let match;

    while ((match = regex.exec(watchTitre)) !== null) {
      matches.add(match[1]);
    }
    regex.lastIndex = 0;
    while ((match = regex.exec(watchCorps)) !== null) {
      matches.add(match[1]);
    }

    return Array.from(matches);
  }, [watchTitre, watchCorps]);

  // Variables invalides (utilisées mais pas disponibles)
  const invalidVariables = useMemo(() => {
    return usedVariables.filter((v) => !availableVariables.includes(v));
  }, [usedVariables, availableVariables]);

  // Variables non utilisées
  const unusedVariables = useMemo(() => {
    return availableVariables.filter((v) => !usedVariables.includes(v));
  }, [availableVariables, usedVariables]);

  // Aperçu avec remplacement des variables
  const renderedPreview = useMemo(() => {
    let titre = watchTitre;
    let corps = watchCorps;

    availableVariables.forEach((variable) => {
      const value = TEST_DATA[variable] || `[${variable}]`;
      titre = titre.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
      corps = corps.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });

    return { titre, corps };
  }, [watchTitre, watchCorps, availableVariables]);

  const handleInsertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="corps_template"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newValue = `${before}{{${variable}}}${after}`;
      form.setValue('corps_template', newValue);
      // Repositionner le curseur après la variable insérée
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast.success(`Variable {{${variable}}} copiée`);
  };

  const handleFormSubmit = async (values: TemplateFormValues) => {
    await onSave({
      id: template.id,
      titre_template: values.titre_template,
      corps_template: values.corps_template,
      est_actif: values.est_actif,
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {EVENT_TYPE_LABELS[template.type_evenement as NotificationEventType] || template.type_evenement}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Code: <code className="bg-muted px-1 rounded">{template.code}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? 'Masquer aperçu' : 'Aperçu'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colonne gauche : Formulaire */}
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* Titre */}
              <FormField
                control={form.control}
                name="titre_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre de la notification</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Nouvelle note à valider - {{reference}}"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Le titre apparaîtra dans la liste des notifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Corps */}
              <FormField
                control={form.control}
                name="corps_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corps du message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Écrivez le contenu de la notification..."
                        className="min-h-[150px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Utilisez les variables entre doubles accolades: {'{{variable}}'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actif */}
              <FormField
                control={form.control}
                name="est_actif"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Template actif</FormLabel>
                      <FormDescription>
                        Les templates inactifs ne sont pas utilisés pour les notifications
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Alerte variables invalides */}
              {invalidVariables.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Variables non reconnues :{' '}
                    {invalidVariables.map((v) => (
                      <code key={v} className="mx-1 bg-destructive/20 px-1 rounded">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
                <Button type="submit" disabled={isSaving || invalidVariables.length > 0}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4 mr-1" />
                  Sauvegarder
                </Button>
              </div>
            </form>
          </Form>

          {/* Variables disponibles */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Variable className="h-4 w-4" />
                Variables disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  {availableVariables.map((variable) => {
                    const isUsed = usedVariables.includes(variable);
                    return (
                      <Tooltip key={variable}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={isUsed ? 'default' : 'outline'}
                            className={cn(
                              'cursor-pointer transition-colors',
                              isUsed
                                ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                                : 'hover:bg-muted'
                            )}
                            onClick={() => handleInsertVariable(variable)}
                          >
                            {isUsed && <CheckCircle className="h-3 w-3 mr-1" />}
                            {`{{${variable}}}`}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <div className="text-xs">
                            <p className="font-medium">
                              {isUsed ? 'Utilisée' : 'Cliquer pour insérer'}
                            </p>
                            <p className="text-muted-foreground mt-1">
                              Exemple: {TEST_DATA[variable] || 'N/A'}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyVariable(variable);
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copier
                            </Button>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
              {unusedVariables.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  {unusedVariables.length} variable(s) non utilisée(s)
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Aperçu */}
        {showPreview && (
          <Card className="h-fit sticky top-4">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Aperçu en temps réel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Aperçu notification */}
                <div className="border rounded-lg p-4 bg-background">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{renderedPreview.titre}</p>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {renderedPreview.corps}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        il y a quelques secondes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Infos */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Les données affichées sont des exemples pour visualisation.</p>
                  <p>
                    Variables utilisées:{' '}
                    <span className="font-medium">{usedVariables.length}</span> /{' '}
                    {availableVariables.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default NotificationTemplateEditor;
