import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BellRing, Mail, MessageSquare, Smartphone, Save } from 'lucide-react';
import { useNotificationRoleSettings } from '@/hooks/useNotificationRoleSettings';
import { toast } from 'sonner';

const ROLES = ['DG', 'DAAF', 'CB', 'OPERATEUR', 'TRESORIER', 'DIRECTEUR'] as const;
const NOTIFICATION_TYPES = [
  'engagement',
  'liquidation',
  'ordonnancement',
  'reglement',
  'deadline',
  'budget',
] as const;

const TYPE_LABELS: Record<string, string> = {
  engagement: 'Engagement',
  liquidation: 'Liquidation',
  ordonnancement: 'Ordonnancement',
  reglement: 'Reglement',
  deadline: 'Echeances',
  budget: 'Budget',
};

interface LocalSetting {
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
}

type LocalState = Record<string, Record<string, LocalSetting>>;

export default function NotificationParRole() {
  const { settings, isLoading, upsertSetting, isUpserting } = useNotificationRoleSettings();
  const [localState, setLocalState] = useState<LocalState>({});
  const [isDirty, setIsDirty] = useState(false);

  const settingsMap = useMemo(() => {
    const map: Record<string, Record<string, LocalSetting>> = {};
    for (const role of ROLES) {
      map[role] = {};
      for (const type of NOTIFICATION_TYPES) {
        const existing = settings.find((s) => s.role_code === role && s.notification_type === type);
        map[role][type] = {
          email_enabled: existing?.email_enabled ?? true,
          sms_enabled: existing?.sms_enabled ?? false,
          in_app_enabled: existing?.in_app_enabled ?? true,
        };
      }
    }
    return map;
  }, [settings]);

  const currentState = useMemo(() => {
    const merged: LocalState = {};
    for (const role of ROLES) {
      merged[role] = {};
      for (const type of NOTIFICATION_TYPES) {
        merged[role][type] = localState[role]?.[type] ??
          settingsMap[role]?.[type] ?? {
            email_enabled: true,
            sms_enabled: false,
            in_app_enabled: true,
          };
      }
    }
    return merged;
  }, [settingsMap, localState]);

  const stats = useMemo(() => {
    let total = 0;
    let emailActive = 0;
    let inAppActive = 0;
    for (const role of ROLES) {
      for (const type of NOTIFICATION_TYPES) {
        total++;
        const s = currentState[role]?.[type];
        if (s?.email_enabled) emailActive++;
        if (s?.in_app_enabled) inAppActive++;
      }
    }
    return { total, emailActive, inAppActive };
  }, [currentState]);

  const handleToggle = (
    role: string,
    type: string,
    channel: 'email_enabled' | 'sms_enabled' | 'in_app_enabled',
    value: boolean
  ) => {
    setLocalState((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [type]: {
          ...(prev[role]?.[type] ?? currentState[role]?.[type]),
          [channel]: value,
        },
      },
    }));
    setIsDirty(true);
  };

  const handleSaveAll = async () => {
    const promises: Promise<unknown>[] = [];
    for (const role of ROLES) {
      for (const type of NOTIFICATION_TYPES) {
        const s = currentState[role][type];
        promises.push(
          upsertSetting({
            role_code: role,
            notification_type: type,
            email_enabled: s.email_enabled,
            sms_enabled: s.sms_enabled,
            in_app_enabled: s.in_app_enabled,
          })
        );
      }
    }
    try {
      await Promise.all(promises);
      toast.success('Toutes les configurations ont ete sauvegardees');
      setLocalState({});
      setIsDirty(false);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-80" />
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
          <BellRing className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Notifications par Role</h1>
            <p className="text-sm text-muted-foreground">
              Configurer les canaux de notification pour chaque role
            </p>
          </div>
        </div>
        <Button onClick={handleSaveAll} disabled={!isDirty || isUpserting}>
          <Save className="mr-2 h-4 w-4" />
          {isUpserting ? 'Sauvegarde...' : 'Sauvegarder tout'}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total configurations</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Email active</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.emailActive}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In-app active</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.inAppActive}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice de configuration</CardTitle>
          <CardDescription>
            Activez ou desactivez les canaux par role et type de notification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-semibold">Role</th>
                  {NOTIFICATION_TYPES.map((type) => (
                    <th key={type} className="p-3 text-center font-semibold">
                      {TYPE_LABELS[type]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role} className="border-b last:border-0">
                    <td className="p-3">
                      <Badge variant="outline" className="font-mono">
                        {role}
                      </Badge>
                    </td>
                    {NOTIFICATION_TYPES.map((type) => {
                      const s = currentState[role][type];
                      return (
                        <td key={type} className="p-3">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <Switch
                                checked={s.email_enabled}
                                onCheckedChange={(v) =>
                                  handleToggle(role, type, 'email_enabled', v)
                                }
                                className="scale-75"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Smartphone className="h-3 w-3 text-muted-foreground" />
                              <Switch
                                checked={s.sms_enabled}
                                onCheckedChange={(v) => handleToggle(role, type, 'sms_enabled', v)}
                                className="scale-75"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <Switch
                                checked={s.in_app_enabled}
                                onCheckedChange={(v) =>
                                  handleToggle(role, type, 'in_app_enabled', v)
                                }
                                className="scale-75"
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email
            </span>
            <span className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" /> SMS
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> In-app
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
