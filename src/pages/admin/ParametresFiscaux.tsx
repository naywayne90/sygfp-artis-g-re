import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Calculator, Save, Info, Percent, Receipt, Landmark, Scale, Clock } from 'lucide-react';
import { useFiscalParameters, FISCAL_KEYS, FISCAL_LABELS } from '@/hooks/useFiscalParameters';
import { toast } from 'sonner';

const FISCAL_DEFAULTS: Record<string, number> = {
  TVA_TAUX: 18,
  AIRSI_TAUX: 5,
  RETENUE_BIC_TAUX: 5,
  RETENUE_BNC_TAUX: 7.5,
  RETENUE_SOURCE_TAUX: 10,
  PENALITE_TAUX_JOURNALIER: 0.1,
};

const FISCAL_ICONS: Record<string, React.ReactNode> = {
  TVA_TAUX: <Receipt className="h-5 w-5 text-blue-500" />,
  AIRSI_TAUX: <Landmark className="h-5 w-5 text-green-500" />,
  RETENUE_BIC_TAUX: <Scale className="h-5 w-5 text-orange-500" />,
  RETENUE_BNC_TAUX: <Scale className="h-5 w-5 text-purple-500" />,
  RETENUE_SOURCE_TAUX: <Percent className="h-5 w-5 text-red-500" />,
  PENALITE_TAUX_JOURNALIER: <Clock className="h-5 w-5 text-yellow-600" />,
};

const FISCAL_DESCRIPTIONS: Record<string, string> = {
  TVA_TAUX: 'Taxe sur la Valeur Ajoutee applicable aux factures',
  AIRSI_TAUX: "Acompte d'Impot sur le Revenu du Secteur Informel",
  RETENUE_BIC_TAUX: 'Retenue sur les Benefices Industriels et Commerciaux',
  RETENUE_BNC_TAUX: 'Retenue sur les Benefices Non Commerciaux',
  RETENUE_SOURCE_TAUX: 'Retenue a la source sur les prestataires non-residents',
  PENALITE_TAUX_JOURNALIER: 'Taux de penalite journalier en cas de retard',
};

export default function ParametresFiscaux() {
  const { parameters, isLoading, upsertParameter, isUpserting } = useFiscalParameters();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const paramMap = useMemo(() => {
    const map: Record<string, { value: string; updated_at: string }> = {};
    for (const p of parameters) {
      map[p.key] = { value: p.value, updated_at: p.updated_at };
    }
    return map;
  }, [parameters]);

  const getDisplayValue = (key: string): string => {
    if (localValues[key] !== undefined) return localValues[key];
    return paramMap[key]?.value ?? String(FISCAL_DEFAULTS[key] ?? '');
  };

  const isDirty = (key: string): boolean => {
    if (localValues[key] === undefined) return false;
    const original = paramMap[key]?.value ?? String(FISCAL_DEFAULTS[key] ?? '');
    return localValues[key] !== original;
  };

  const handleSave = async (key: string) => {
    const value = localValues[key];
    if (value === undefined) return;

    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) {
      toast.error('Veuillez saisir une valeur numerique valide');
      return;
    }

    await upsertParameter({
      key,
      label: FISCAL_LABELS[key] || key,
      value: String(numVal),
      description: FISCAL_DESCRIPTIONS[key],
    });

    setLocalValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const lastUpdate = useMemo(() => {
    if (parameters.length === 0) return null;
    const sorted = [...parameters].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return sorted[0].updated_at;
  }, [parameters]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const fiscalKeys = Object.values(FISCAL_KEYS);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Parametres Fiscaux</h1>
          <p className="text-sm text-muted-foreground">
            Taux de TVA, retenues a la source et autres parametres fiscaux
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-5 w-5 text-blue-600" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Information</p>
          <p>
            Ces parametres sont utilises dans le calcul des liquidations. Toute modification sera
            appliquee aux prochaines operations.
          </p>
        </div>
      </div>

      {/* Audit info */}
      {lastUpdate && (
        <div className="text-xs text-muted-foreground">
          Derniere modification :{' '}
          {new Date(lastUpdate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fiscalKeys.map((key) => {
          const label = FISCAL_LABELS[key] || key;
          const description = FISCAL_DESCRIPTIONS[key] || '';
          const icon = FISCAL_ICONS[key] || <Percent className="h-5 w-5" />;
          const currentValue = getDisplayValue(key);
          const defaultVal = FISCAL_DEFAULTS[key];
          const dirty = isDirty(key);

          return (
            <Card key={key}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {icon}
                  <div>
                    <CardTitle className="text-base">{label}</CardTitle>
                    <CardDescription className="text-xs">{description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Taux actuel</Label>
                  <Badge variant="outline" className="font-mono">
                    {paramMap[key]?.value ?? defaultVal}%
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    value={currentValue}
                    onChange={(e) => setLocalValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={String(defaultVal)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Defaut : {defaultVal}%</span>
                  <Button
                    size="sm"
                    disabled={!dirty || isUpserting}
                    onClick={() => handleSave(key)}
                  >
                    <Save className="mr-2 h-3 w-3" />
                    {isUpserting ? '...' : 'Sauvegarder'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
