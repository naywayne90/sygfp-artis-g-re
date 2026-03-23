import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Save, Gauge, ShieldAlert, TrendingUp } from 'lucide-react';
import { useDMGAlertConfig } from '@/hooks/useDMGAlertConfig';
import { toast } from 'sonner';

const ALERT_META: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  budget_depasse: {
    label: 'Budget depasse',
    description: 'Alerte lorsque le budget consomme depasse le seuil autorise',
    icon: <TrendingUp className="h-5 w-5 text-red-500" />,
  },
  engagement_en_attente: {
    label: 'Engagement en attente',
    description: 'Alerte sur les engagements en attente de validation depuis trop longtemps',
    icon: <ShieldAlert className="h-5 w-5 text-orange-500" />,
  },
  encours_critique: {
    label: 'Encours critique',
    description: 'Alerte lorsque les encours atteignent un niveau critique',
    icon: <Gauge className="h-5 w-5 text-yellow-600" />,
  },
  paiement_retard: {
    label: 'Paiement en retard',
    description: 'Alerte sur les paiements non effectues dans les delais impartis',
    icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
  },
  liquidation_urgente: {
    label: 'Liquidation urgente',
    description: 'Alerte sur les liquidations necessitant un traitement prioritaire',
    icon: <ShieldAlert className="h-5 w-5 text-purple-500" />,
  },
};

interface LocalEdit {
  seuil_warning: number;
  seuil_critical: number;
}

export default function AlertesDMG() {
  const { configs, isLoading, updateConfig, toggleActive, isUpdating, isToggling } =
    useDMGAlertConfig();
  const [localEdits, setLocalEdits] = useState<Record<string, LocalEdit>>({});

  const getLocalEdit = (
    configId: string,
    original: { seuil_warning: number; seuil_critical: number }
  ) => localEdits[configId] ?? original;

  const handleLocalChange = (
    configId: string,
    field: 'seuil_warning' | 'seuil_critical',
    value: number,
    original: { seuil_warning: number; seuil_critical: number }
  ) => {
    setLocalEdits((prev) => ({
      ...prev,
      [configId]: {
        ...(prev[configId] ?? original),
        [field]: value,
      },
    }));
  };

  const handleSave = async (configId: string) => {
    const edit = localEdits[configId];
    if (!edit) return;

    if (edit.seuil_warning >= edit.seuil_critical) {
      toast.error("Le seuil d'avertissement doit etre inferieur au seuil critique");
      return;
    }

    await updateConfig({
      id: configId,
      seuil_warning: edit.seuil_warning,
      seuil_critical: edit.seuil_critical,
    });

    setLocalEdits((prev) => {
      const next = { ...prev };
      delete next[configId];
      return next;
    });
  };

  const isDirty = (
    configId: string,
    original: { seuil_warning: number; seuil_critical: number }
  ) => {
    const edit = localEdits[configId];
    if (!edit) return false;
    return (
      edit.seuil_warning !== original.seuil_warning ||
      edit.seuil_critical !== original.seuil_critical
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Configuration Alertes DMG</h1>
          <p className="text-sm text-muted-foreground">
            Definir les seuils d'alerte pour le tableau de bord DMG
          </p>
        </div>
      </div>

      {/* Empty state */}
      {configs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertTriangle className="mb-4 h-12 w-12 opacity-50" />
            <p>Aucune alerte DMG configuree</p>
          </CardContent>
        </Card>
      )}

      {/* Cards layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {configs.map((config) => {
          const meta = ALERT_META[config.alert_type] ?? {
            label: config.alert_type,
            description: config.description || '',
            icon: <AlertTriangle className="h-5 w-5" />,
          };
          const values = getLocalEdit(config.id, {
            seuil_warning: config.seuil_warning,
            seuil_critical: config.seuil_critical,
          });
          const changed = isDirty(config.id, {
            seuil_warning: config.seuil_warning,
            seuil_critical: config.seuil_critical,
          });

          const warningPct = Math.min(values.seuil_warning, 100);
          const criticalPct = Math.min(values.seuil_critical, 100);

          return (
            <Card key={config.id} className={!config.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {meta.icon}
                    <div>
                      <CardTitle className="text-base">{meta.label}</CardTitle>
                      <CardDescription className="text-xs">{meta.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.is_active ? 'default' : 'secondary'}>
                      {config.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    <Switch
                      checked={config.is_active}
                      onCheckedChange={(v) => toggleActive({ id: config.id, is_active: v })}
                      disabled={isToggling}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Visual gauge */}
                <div className="relative h-6 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="absolute left-0 top-0 h-full bg-green-400 transition-all"
                    style={{ width: `${warningPct}%` }}
                  />
                  <div
                    className="absolute left-0 top-0 h-full bg-orange-400 transition-all"
                    style={{
                      width: `${criticalPct}%`,
                      left: `${warningPct}%`,
                      maxWidth: `${criticalPct - warningPct}%`,
                    }}
                  />
                  <div
                    className="absolute top-0 h-full bg-red-400 transition-all"
                    style={{ left: `${criticalPct}%`, width: `${100 - criticalPct}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    <span className="rounded bg-white/80 px-2">
                      {values.seuil_warning}% / {values.seuil_critical}%
                    </span>
                  </div>
                </div>

                {/* Threshold inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-orange-600">Seuil avertissement (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={values.seuil_warning}
                      onChange={(e) =>
                        handleLocalChange(
                          config.id,
                          'seuil_warning',
                          parseFloat(e.target.value) || 0,
                          {
                            seuil_warning: config.seuil_warning,
                            seuil_critical: config.seuil_critical,
                          }
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-red-600">Seuil critique (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={values.seuil_critical}
                      onChange={(e) =>
                        handleLocalChange(
                          config.id,
                          'seuil_critical',
                          parseFloat(e.target.value) || 0,
                          {
                            seuil_warning: config.seuil_warning,
                            seuil_critical: config.seuil_critical,
                          }
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Save button */}
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!changed || isUpdating}
                  onClick={() => handleSave(config.id)}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
