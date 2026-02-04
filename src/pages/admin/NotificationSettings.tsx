/**
 * Page d'administration des paramètres de notifications
 * Onglets : Templates | Destinataires | Préférences
 */

import { useState } from 'react';
import {
  Bell,
  FileText,
  Users,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Edit,
  Eye,
  History,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  useNotificationTemplates,
  useNotificationLogs,
  type NotificationTemplate,
  type NotificationEventType,
  EVENT_TYPE_LABELS,
  CHANNEL_LABELS,
} from '@/hooks/useNotificationSettings';
import { NotificationTemplateEditor } from '@/components/notifications/NotificationTemplateEditor';
import { NotificationRecipientConfig } from '@/components/notifications/NotificationRecipientConfig';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function NotificationSettings() {
  const [activeTab, setActiveTab] = useState('templates');
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  const {
    templates,
    isLoading: isLoadingTemplates,
    updateTemplate,
    isUpdating,
    refetch: refetchTemplates,
  } = useNotificationTemplates();

  const {
    logs,
    stats,
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useNotificationLogs({ limit: 50 });

  const handleSaveTemplate = async (data: Parameters<typeof updateTemplate>[0]) => {
    await updateTemplate(data);
    setEditingTemplate(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Paramètres des notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les templates, destinataires et préférences de notifications
          </p>
        </div>
        <Button variant="outline" onClick={() => {
          refetchTemplates();
          refetchLogs();
        }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Templates actifs</p>
                <p className="text-2xl font-bold">
                  {templates.filter((t) => t.est_actif).length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Envoyées</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lues</p>
                <p className="text-2xl font-bold text-blue-600">{stats.read}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="recipients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Destinataires
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Préférences
          </TabsTrigger>
        </TabsList>

        {/* Onglet Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates de notifications
              </CardTitle>
              <CardDescription>
                Personnalisez les messages envoyés pour chaque type d'événement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Aucun template configuré</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type d'événement</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Variables</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id} className={cn(!template.est_actif && 'opacity-50')}>
                        <TableCell>
                          <Badge variant="outline">
                            {EVENT_TYPE_LABELS[template.type_evenement as NotificationEventType] ||
                              template.type_evenement}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {template.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="max-w-[200px] truncate block">
                            {template.titre_template}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {template.variables_disponibles?.length || 0} var.
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {template.est_actif ? (
                            <Badge className="bg-green-500">Actif</Badge>
                          ) : (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog édition template */}
          <Dialog
            open={!!editingTemplate}
            onOpenChange={(open) => !open && setEditingTemplate(null)}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Modifier le template
                </DialogTitle>
              </DialogHeader>
              {editingTemplate && (
                <NotificationTemplateEditor
                  template={editingTemplate}
                  onSave={handleSaveTemplate}
                  onCancel={() => setEditingTemplate(null)}
                  isSaving={isUpdating}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Onglet Destinataires */}
        <TabsContent value="recipients" className="space-y-6">
          <NotificationRecipientConfig />
        </TabsContent>

        {/* Onglet Préférences */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Préférences globales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Préférences globales
                </CardTitle>
                <CardDescription>
                  Paramètres système pour toutes les notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Notifications in-app</Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher les notifications dans l'application
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <p className="text-xs text-muted-foreground">
                      Envoyer des emails pour les notifications importantes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Résumé quotidien</Label>
                    <p className="text-xs text-muted-foreground">
                      Envoyer un résumé des notifications chaque matin
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Notifications urgentes</Label>
                    <p className="text-xs text-muted-foreground">
                      Toujours envoyer par email les notifications urgentes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Canaux par défaut par type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Canaux par défaut
                </CardTitle>
                <CardDescription>
                  Canal de notification par défaut pour chaque type d'événement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(EVENT_TYPE_LABELS).map(([eventType, label]) => (
                  <div key={eventType} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{label}</span>
                    <Select defaultValue="in_app">
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CHANNEL_LABELS).map(([channel, channelLabel]) => (
                          <SelectItem key={channel} value={channel}>
                            {channelLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Historique récent */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique récent
                </CardTitle>
                <CardDescription>
                  Les 10 dernières notifications envoyées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Aucune notification envoyée récemment</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.slice(0, 10).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {log.titre_rendu || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {CHANNEL_LABELS[log.canal] || log.canal}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.statut === 'sent' && (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Envoyé
                              </Badge>
                            )}
                            {log.statut === 'read' && (
                              <Badge className="bg-blue-500">
                                <Eye className="h-3 w-3 mr-1" />
                                Lu
                              </Badge>
                            )}
                            {log.statut === 'pending' && (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                En attente
                              </Badge>
                            )}
                            {log.statut === 'failed' && (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Échec
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
