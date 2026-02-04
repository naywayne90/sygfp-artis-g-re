/**
 * NotificationRecipientConfig - Configuration des destinataires par type d'événement
 * Sélecteur multi-utilisateurs avec filtrage par rôle
 */

import { useState } from 'react';
import {
  Users,
  Building2,
  User,
  Plus,
  Trash2,
  Mail,
  Filter,
  Search,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  type NotificationRecipient,
  type NotificationEventType,
  type CreateRecipientParams,
  EVENT_TYPE_LABELS,
  ROLE_LABELS,
  useNotificationRecipients,
  useNotificationReferenceData,
} from '@/hooks/useNotificationSettings';

// ============================================================================
// TYPES
// ============================================================================

type RecipientType = 'role' | 'direction' | 'user';

export interface NotificationRecipientConfigProps {
  /** Type d'événement à configurer (optionnel, pour filtrer) */
  eventType?: NotificationEventType;
  /** Afficher en mode compact */
  compact?: boolean;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function NotificationRecipientConfig({
  eventType,
  compact = false,
}: NotificationRecipientConfigProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [recipientToDelete, setRecipientToDelete] = useState<NotificationRecipient | null>(null);
  const [filterEventType, setFilterEventType] = useState<string>(eventType || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    recipients,
    isLoading,
    createRecipient,
    updateRecipient,
    deleteRecipient,
    isCreating,
    isDeleting,
  } = useNotificationRecipients();

  const { users, directions } = useNotificationReferenceData();

  // Filtrer les destinataires
  const filteredRecipients = recipients.filter((r) => {
    if (filterEventType !== 'all' && r.type_evenement !== filterEventType) return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const recipientName = r.user?.full_name || r.direction?.label || r.role_hierarchique || '';
      const recipientEmail = r.user?.email || '';
      return (
        recipientName.toLowerCase().includes(search) ||
        recipientEmail.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Grouper par type d'événement pour l'affichage
  const groupedRecipients = filteredRecipients.reduce((acc, r) => {
    if (!acc[r.type_evenement]) acc[r.type_evenement] = [];
    acc[r.type_evenement].push(r);
    return acc;
  }, {} as Record<string, NotificationRecipient[]>);

  const handleToggleActive = async (recipient: NotificationRecipient) => {
    await updateRecipient({ id: recipient.id, est_actif: !recipient.est_actif });
  };

  const handleDeleteConfirm = async () => {
    if (!recipientToDelete) return;
    await deleteRecipient(recipientToDelete.id);
    setRecipientToDelete(null);
  };

  const getRecipientLabel = (recipient: NotificationRecipient) => {
    if (recipient.role_hierarchique) {
      return ROLE_LABELS[recipient.role_hierarchique] || recipient.role_hierarchique;
    }
    if (recipient.direction) {
      return recipient.direction.label;
    }
    if (recipient.user) {
      return recipient.user.full_name || recipient.user.email;
    }
    return 'Inconnu';
  };

  const getRecipientIcon = (recipient: NotificationRecipient) => {
    if (recipient.role_hierarchique) return <Users className="h-4 w-4 text-blue-600" />;
    if (recipient.direction) return <Building2 className="h-4 w-4 text-purple-600" />;
    if (recipient.user) return <User className="h-4 w-4 text-green-600" />;
    return <User className="h-4 w-4" />;
  };

  const getRecipientType = (recipient: NotificationRecipient): RecipientType => {
    if (recipient.role_hierarchique) return 'role';
    if (recipient.direction_id) return 'direction';
    return 'user';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      {!compact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un destinataire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterEventType} onValueChange={setFilterEventType}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Type d'événement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste par type d'événement */}
      {Object.keys(groupedRecipients).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Aucun destinataire configuré</p>
            <p className="text-sm mt-1">
              Ajoutez des destinataires pour recevoir les notifications
            </p>
            <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un destinataire
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedRecipients).map(([eventTypeKey, eventRecipients]) => (
          <Card key={eventTypeKey}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {EVENT_TYPE_LABELS[eventTypeKey as NotificationEventType] || eventTypeKey}
                </span>
                <Badge variant="secondary">{eventRecipients.length} destinataire(s)</Badge>
              </CardTitle>
              <CardDescription>
                Ces utilisateurs recevront une notification lors de cet événement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventRecipients.map((recipient) => (
                    <TableRow key={recipient.id} className={cn(!recipient.est_actif && 'opacity-50')}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRecipientIcon(recipient)}
                          <span className="text-xs capitalize">
                            {getRecipientType(recipient) === 'role' && 'Rôle'}
                            {getRecipientType(recipient) === 'direction' && 'Direction'}
                            {getRecipientType(recipient) === 'user' && 'Utilisateur'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{getRecipientLabel(recipient)}</span>
                      </TableCell>
                      <TableCell>
                        {recipient.user?.email ? (
                          <span className="text-sm text-muted-foreground">
                            {recipient.user.email}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Tous les utilisateurs avec ce rôle
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={recipient.est_actif}
                          onCheckedChange={() => handleToggleActive(recipient)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRecipientToDelete(recipient)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog d'ajout */}
      <AddRecipientDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={createRecipient}
        isAdding={isCreating}
        users={users}
        directions={directions}
        defaultEventType={eventType}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!recipientToDelete} onOpenChange={() => setRecipientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce destinataire ?</AlertDialogTitle>
            <AlertDialogDescription>
              {recipientToDelete && (
                <>
                  <strong>{getRecipientLabel(recipientToDelete)}</strong> ne recevra plus
                  de notifications pour l'événement{' '}
                  <strong>
                    {EVENT_TYPE_LABELS[recipientToDelete.type_evenement as NotificationEventType] ||
                      recipientToDelete.type_evenement}
                  </strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// DIALOG D'AJOUT DE DESTINATAIRE
// ============================================================================

interface AddRecipientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (params: CreateRecipientParams) => Promise<unknown>;
  isAdding: boolean;
  users: Array<{ id: string; full_name: string | null; email: string; role_hierarchique: string | null }>;
  directions: Array<{ id: string; label: string; sigle: string }>;
  defaultEventType?: NotificationEventType;
}

function AddRecipientDialog({
  open,
  onOpenChange,
  onAdd,
  isAdding,
  users,
  directions,
  defaultEventType,
}: AddRecipientDialogProps) {
  const [recipientType, setRecipientType] = useState<RecipientType>('role');
  const [eventType, setEventType] = useState<string>(defaultEventType || '');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedDirection, setSelectedDirection] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  const handleSubmit = async () => {
    if (!eventType) return;

    const params: CreateRecipientParams = {
      type_evenement: eventType,
    };

    if (recipientType === 'role' && selectedRole) {
      params.role_hierarchique = selectedRole;
    } else if (recipientType === 'direction' && selectedDirection) {
      params.direction_id = selectedDirection;
    } else if (recipientType === 'user' && selectedUser) {
      params.user_id = selectedUser;
    } else {
      return;
    }

    await onAdd(params);
    onOpenChange(false);
    // Reset
    setRecipientType('role');
    setSelectedRole('');
    setSelectedDirection('');
    setSelectedUser('');
    if (!defaultEventType) setEventType('');
  };

  const isFormValid =
    eventType &&
    ((recipientType === 'role' && selectedRole) ||
      (recipientType === 'direction' && selectedDirection) ||
      (recipientType === 'user' && selectedUser));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un destinataire
          </DialogTitle>
          <DialogDescription>
            Configurez qui recevra les notifications pour un type d'événement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type d'événement */}
          <div className="space-y-2">
            <Label>Type d'événement</Label>
            <Select value={eventType} onValueChange={setEventType} disabled={!!defaultEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un événement..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type de destinataire */}
          <div className="space-y-2">
            <Label>Type de destinataire</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['role', 'direction', 'user'] as RecipientType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={recipientType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecipientType(type)}
                  className="flex items-center gap-1"
                >
                  {type === 'role' && <Users className="h-3 w-3" />}
                  {type === 'direction' && <Building2 className="h-3 w-3" />}
                  {type === 'user' && <User className="h-3 w-3" />}
                  {type === 'role' && 'Rôle'}
                  {type === 'direction' && 'Direction'}
                  {type === 'user' && 'Utilisateur'}
                </Button>
              ))}
            </div>
          </div>

          {/* Sélection selon le type */}
          {recipientType === 'role' && (
            <div className="space-y-2">
              <Label>Rôle hiérarchique</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Tous les utilisateurs avec ce rôle recevront la notification
              </p>
            </div>
          )}

          {recipientType === 'direction' && (
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={selectedDirection} onValueChange={setSelectedDirection}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une direction..." />
                </SelectTrigger>
                <SelectContent>
                  {directions.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.sigle} - {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Tous les membres de cette direction recevront la notification
              </p>
            </div>
          )}

          {recipientType === 'user' && (
            <div className="space-y-2">
              <Label>Utilisateur</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>{user.full_name || user.email}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Cet utilisateur spécifique recevra la notification
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isAdding}>
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NotificationRecipientConfig;
