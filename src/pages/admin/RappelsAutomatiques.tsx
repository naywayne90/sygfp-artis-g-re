import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogDescription,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { Clock, Plus, Edit, ListChecks, History, Send } from 'lucide-react';
import { useReminderRules } from '@/hooks/useReminderRules';
import type { ReminderRule } from '@/hooks/useReminderRules';
import { toast } from 'sonner';

const ENTITY_TYPES = [
  { value: 'budget_engagements', label: 'Engagements' },
  { value: 'budget_liquidations', label: 'Liquidations' },
  { value: 'ordonnancements', label: 'Ordonnancements' },
  { value: 'reglements', label: 'Reglements' },
];
const ACTION_TYPES = [
  { value: 'notification', label: 'Notification in-app' },
  { value: 'email', label: 'Email' },
  { value: 'both', label: 'Les deux' },
];
const ROLES = ['DG', 'DAAF', 'CB', 'OPERATEUR', 'TRESORIER', 'DIRECTEUR'];
const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};
const initialForm = {
  name: '',
  entity_type: '',
  trigger_status: '',
  delay_hours: 24,
  action_type: 'notification',
  recipients: [] as string[],
  description: '',
};

function parseRecipients(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string');
  if (val && typeof val === 'object' && 'roles' in val)
    return parseRecipients((val as Record<string, unknown>).roles);
  return [];
}

export default function RappelsAutomatiques() {
  const {
    rules,
    history,
    stats,
    isLoading,
    isLoadingHistory,
    createRule,
    updateRule,
    toggleActive,
    isCreating,
    isUpdating,
  } = useReminderRules();

  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [form, setForm] = useState(initialForm);

  const openCreate = () => {
    setEditingRule(null);
    setForm(initialForm);
    setShowDialog(true);
  };

  const openEdit = (rule: ReminderRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      entity_type: rule.entity_type,
      trigger_status: rule.trigger_status,
      delay_hours: rule.delay_hours,
      action_type: rule.action_type,
      recipients: parseRecipients(rule.recipients),
      description: rule.description || '',
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.entity_type || !form.trigger_status) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (form.recipients.length === 0) {
      toast.error('Selectionnez au moins un destinataire');
      return;
    }

    if (editingRule) {
      await updateRule({
        id: editingRule.id,
        name: form.name,
        trigger_status: form.trigger_status,
        delay_hours: form.delay_hours,
        action_type: form.action_type,
        recipients: form.recipients,
        description: form.description || undefined,
      });
    } else {
      await createRule({
        name: form.name,
        entity_type: form.entity_type,
        trigger_status: form.trigger_status,
        delay_hours: form.delay_hours,
        action_type: form.action_type,
        recipients: form.recipients,
        description: form.description || undefined,
      });
    }
    setShowDialog(false);
  };

  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      recipients: prev.recipients.includes(role)
        ? prev.recipients.filter((r) => r !== role)
        : [...prev.recipients, role],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Rappels Automatiques</h1>
            <p className="text-sm text-muted-foreground">
              Regles de relance automatique et historique d'envoi
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle regle
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total regles', value: stats.totalRules, color: '' },
          { label: 'Regles actives', value: stats.activeRules, color: 'text-green-600' },
          {
            label: "Rappels envoyes aujourd'hui",
            value: stats.remindersSentToday,
            color: 'text-blue-600',
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className={`text-2xl ${kpi.color}`}>{kpi.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="regles">
        <TabsList>
          <TabsTrigger value="regles" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Regles
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regles">
          <Card>
            <CardContent className="p-0">
              {rules.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <ListChecks className="mb-3 h-10 w-10 opacity-50" />
                  <p>Aucune regle configuree</p>
                  <Button variant="outline" className="mt-3" onClick={openCreate}>
                    Creer une regle
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Entite</TableHead>
                      <TableHead>Statut declencheur</TableHead>
                      <TableHead>Delai (h)</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Destinataires</TableHead>
                      <TableHead>Actif</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.entity_type}</Badge>
                        </TableCell>
                        <TableCell>{rule.trigger_status}</TableCell>
                        <TableCell>{rule.delay_hours}h</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{rule.action_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {parseRecipients(rule.recipients).map((r) => (
                              <Badge key={r} variant="outline" className="text-xs">
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(v) => toggleActive({ id: rule.id, is_active: v })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique">
          <Card>
            <CardContent className="p-0">
              {isLoadingHistory ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <Send className="mb-3 h-10 w-10 opacity-50" />
                  <p>Aucun rappel envoye</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Regle</TableHead>
                      <TableHead>Entite</TableHead>
                      <TableHead>Envoye a</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {new Date(entry.sent_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {rules.find((r) => r.id === entry.rule_id)?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.entity_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {typeof entry.sent_to === 'string'
                            ? entry.sent_to
                            : JSON.stringify(entry.sent_to)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-800'}
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Modifier la regle' : 'Nouvelle regle de relance'}
            </DialogTitle>
            <DialogDescription>
              {editingRule
                ? 'Modifiez les parametres de la regle'
                : 'Conditions et actions de la relance'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Relance engagement en attente"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type d'entite *</Label>
                <Select
                  value={form.entity_type}
                  onValueChange={(v) => setForm((p) => ({ ...p, entity_type: v }))}
                  disabled={!!editingRule}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut declencheur *</Label>
                <Input
                  value={form.trigger_status}
                  onChange={(e) => setForm((p) => ({ ...p, trigger_status: e.target.value }))}
                  placeholder="en_attente_validation"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Delai (heures)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.delay_hours}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, delay_hours: parseInt(e.target.value) || 1 }))
                  }
                />
              </div>
              <div>
                <Label>Type d'action</Label>
                <Select
                  value={form.action_type}
                  onValueChange={(v) => setForm((p) => ({ ...p, action_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Destinataires *</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <Badge
                    key={role}
                    variant={form.recipients.includes(role) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleRole(role)}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optionnelle"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'En cours...' : editingRule ? 'Modifier' : 'Creer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
