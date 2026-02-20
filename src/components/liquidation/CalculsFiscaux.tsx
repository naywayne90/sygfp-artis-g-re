import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Calculator, AlertTriangle } from 'lucide-react';

export interface CalculsFiscauxValues {
  tva_applicable: boolean;
  tva_taux: number;
  tva_montant: number;
  montant_ttc: number;
  airsi_taux: number;
  airsi_montant: number;
  retenue_bic_taux: number;
  retenue_bic_montant: number;
  retenue_bnc_taux: number;
  retenue_bnc_montant: number;
  penalites_montant: number;
  penalites_nb_jours: number;
  penalites_taux_journalier: number;
  total_retenues: number;
  net_a_payer: number;
  retenue_source_taux: number;
  retenue_source_montant: number;
}

export interface CalculsFiscauxProps {
  montantHT: number;
  regimeFiscal?: string;
  initialValues?: Partial<CalculsFiscauxValues>;
  onChange: (values: CalculsFiscauxValues) => void;
  readOnly?: boolean;
}

export function CalculsFiscaux({
  montantHT,
  regimeFiscal: _regimeFiscal,
  initialValues,
  onChange,
  readOnly = false,
}: CalculsFiscauxProps) {
  // Toggles
  const [tvaApplicable, setTvaApplicable] = useState(initialValues?.tva_applicable ?? true);
  const [airsiEnabled, setAirsiEnabled] = useState((initialValues?.airsi_taux ?? 0) > 0);
  const [bicEnabled, setBicEnabled] = useState(
    (initialValues?.retenue_bic_taux ?? 0) > 0 || (initialValues?.retenue_bic_montant ?? 0) > 0
  );
  const [bncEnabled, setBncEnabled] = useState((initialValues?.retenue_bnc_taux ?? 0) > 0);
  const [penalitesAutoCalc, setPenalitesAutoCalc] = useState(
    (initialValues?.penalites_nb_jours ?? 0) > 0
  );

  // Taux
  const [airsiTaux, setAirsiTaux] = useState(initialValues?.airsi_taux ?? 5);
  const [bicTaux, setBicTaux] = useState(initialValues?.retenue_bic_taux ?? 0);
  const [bicMontantManuel, setBicMontantManuel] = useState(initialValues?.retenue_bic_montant ?? 0);
  const [bncTaux, setBncTaux] = useState(initialValues?.retenue_bnc_taux ?? 20);
  const [penalitesMontantManuel, setPenalitesMontantManuel] = useState(
    initialValues?.penalites_montant ?? 0
  );
  const [penalitesNbJours, setPenalitesNbJours] = useState(initialValues?.penalites_nb_jours ?? 0);
  const [penalitesTauxJournalier, setPenalitesTauxJournalier] = useState(
    initialValues?.penalites_taux_journalier ?? 0.1
  );

  // Retenue source legacy
  const [retenueSourceTaux, setRetenueSourceTaux] = useState(
    initialValues?.retenue_source_taux ?? 0
  );

  // Calculs dérivés
  const tvaMontant = tvaApplicable ? Math.round((montantHT * 18) / 100) : 0;
  const montantTTC = montantHT + tvaMontant;
  const airsiMontant = airsiEnabled ? Math.round((montantHT * airsiTaux) / 100) : 0;
  const bicMontant = bicEnabled
    ? bicTaux > 0
      ? Math.round((montantHT * bicTaux) / 100)
      : bicMontantManuel
    : 0;
  const bncMontant = bncEnabled ? Math.round((montantHT * bncTaux) / 100) : 0;
  const retenueSourceMontant = Math.round((montantHT * retenueSourceTaux) / 100);

  const penalitesMontant = penalitesAutoCalc
    ? Math.round(montantTTC * (penalitesTauxJournalier / 100) * penalitesNbJours)
    : penalitesMontantManuel;

  const totalRetenues =
    airsiMontant + bicMontant + bncMontant + retenueSourceMontant + penalitesMontant;
  const netAPayer = montantTTC - totalRetenues;

  // Propagation vers le parent
  const propagate = useCallback(() => {
    onChange({
      tva_applicable: tvaApplicable,
      tva_taux: tvaApplicable ? 18 : 0,
      tva_montant: tvaMontant,
      montant_ttc: montantTTC,
      airsi_taux: airsiEnabled ? airsiTaux : 0,
      airsi_montant: airsiMontant,
      retenue_bic_taux: bicEnabled ? bicTaux : 0,
      retenue_bic_montant: bicMontant,
      retenue_bnc_taux: bncEnabled ? bncTaux : 0,
      retenue_bnc_montant: bncMontant,
      penalites_montant: penalitesMontant,
      penalites_nb_jours: penalitesAutoCalc ? penalitesNbJours : 0,
      penalites_taux_journalier: penalitesAutoCalc ? penalitesTauxJournalier : 0,
      total_retenues: totalRetenues,
      net_a_payer: netAPayer,
      retenue_source_taux: retenueSourceTaux,
      retenue_source_montant: retenueSourceMontant,
    });
  }, [
    onChange,
    tvaApplicable,
    tvaMontant,
    montantTTC,
    airsiEnabled,
    airsiTaux,
    airsiMontant,
    bicEnabled,
    bicTaux,
    bicMontant,
    bncEnabled,
    bncTaux,
    bncMontant,
    penalitesMontant,
    penalitesAutoCalc,
    penalitesNbJours,
    penalitesTauxJournalier,
    totalRetenues,
    netAPayer,
    retenueSourceTaux,
    retenueSourceMontant,
  ]);

  useEffect(() => {
    propagate();
  }, [propagate]);

  return (
    <div className="space-y-4">
      {/* Section A — TVA et Montant TTC */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            TVA et Montant TTC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="tva-toggle" className="font-medium">
              TVA applicable
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{tvaApplicable ? 'ON' : 'OFF'}</span>
              <Switch
                id="tva-toggle"
                checked={tvaApplicable}
                onCheckedChange={setTvaApplicable}
                disabled={readOnly}
              />
            </div>
          </div>

          {tvaApplicable ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Montant HT</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                  {formatCurrency(montantHT)}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">TVA 18%</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                  {formatCurrency(tvaMontant)}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Montant TTC</Label>
                <div className="mt-1 text-xl font-bold text-primary bg-primary/10 p-4 rounded-lg text-center">
                  {formatCurrency(montantTTC)}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                TVA exonérée — TTC = HT
              </div>
              <div className="text-xl font-bold text-primary bg-primary/10 p-4 rounded-lg text-center">
                {formatCurrency(montantTTC)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section B — Retenues fiscales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Retenues fiscales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AIRSI */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="airsi-toggle" className="font-medium">
                AIRSI
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{airsiEnabled ? 'ON' : 'OFF'}</span>
                <Switch
                  id="airsi-toggle"
                  checked={airsiEnabled}
                  onCheckedChange={setAirsiEnabled}
                  disabled={readOnly}
                />
              </div>
            </div>
            {airsiEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Taux (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={airsiTaux}
                    onChange={(e) => setAirsiTaux(parseFloat(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Montant</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                    {formatCurrency(airsiMontant)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Retenue source legacy */}
          <div className="space-y-3">
            <Label className="font-medium">Retenue à la source</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Taux (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={retenueSourceTaux}
                  onChange={(e) => setRetenueSourceTaux(parseFloat(e.target.value) || 0)}
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Montant</Label>
                <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                  {formatCurrency(retenueSourceMontant)}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Retenue BIC */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="bic-toggle" className="font-medium">
                Retenue BIC
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{bicEnabled ? 'ON' : 'OFF'}</span>
                <Switch
                  id="bic-toggle"
                  checked={bicEnabled}
                  onCheckedChange={setBicEnabled}
                  disabled={readOnly}
                />
              </div>
            </div>
            {bicEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Taux (%) — 0 = montant libre
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={bicTaux}
                    onChange={(e) => setBicTaux(parseFloat(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Montant</Label>
                  {bicTaux > 0 ? (
                    <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                      {formatCurrency(bicMontant)}
                    </div>
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      value={bicMontantManuel}
                      onChange={(e) => setBicMontantManuel(parseFloat(e.target.value) || 0)}
                      disabled={readOnly}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Retenue BNC */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="bnc-toggle" className="font-medium">
                  Retenue BNC
                </Label>
                {bncEnabled && bncTaux === 10 && (
                  <Badge variant="outline" className="text-xs">
                    Convention
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{bncEnabled ? 'ON' : 'OFF'}</span>
                <Switch
                  id="bnc-toggle"
                  checked={bncEnabled}
                  onCheckedChange={setBncEnabled}
                  disabled={readOnly}
                />
              </div>
            </div>
            {bncEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Taux (%) — 20% défaut, 10% convention
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={bncTaux}
                    onChange={(e) => setBncTaux(parseFloat(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Montant</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                    {formatCurrency(bncMontant)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Pénalités de retard */}
          <div className="space-y-3">
            <Label className="font-medium flex items-center gap-2">
              Pénalités de retard
              {penalitesMontant > 0 && (
                <Badge variant="outline" className="text-xs bg-warning/10 text-warning">
                  {formatCurrency(penalitesMontant)}
                </Badge>
              )}
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Montant libre</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={penalitesMontantManuel || ''}
                  onChange={(e) => setPenalitesMontantManuel(parseFloat(e.target.value) || 0)}
                  disabled={readOnly || penalitesAutoCalc}
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    id="penalites-auto"
                    checked={penalitesAutoCalc}
                    onCheckedChange={setPenalitesAutoCalc}
                    disabled={readOnly}
                  />
                  <Label htmlFor="penalites-auto" className="text-xs text-muted-foreground">
                    Calcul automatique
                  </Label>
                </div>
              </div>
            </div>
            {penalitesAutoCalc && (
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Nb jours retard</Label>
                  <Input
                    type="number"
                    min={0}
                    value={penalitesNbJours || ''}
                    onChange={(e) => setPenalitesNbJours(parseInt(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Taux journalier (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={penalitesTauxJournalier}
                    onChange={(e) => setPenalitesTauxJournalier(parseFloat(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Pénalités calculées</Label>
                  <div className="mt-1 p-2 bg-warning/10 rounded text-sm font-medium text-warning">
                    {formatCurrency(penalitesMontant)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section C — Récapitulatif */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Résumé 1 ligne */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>
              HT: <strong>{formatCurrency(montantHT)}</strong>
            </span>
            <span>|</span>
            <span>
              TVA: <strong>{formatCurrency(tvaMontant)}</strong>
            </span>
            <span>|</span>
            <span>
              Retenues: <strong>{formatCurrency(totalRetenues)}</strong>
            </span>
            <span>|</span>
            <span>
              NET:{' '}
              <strong className={netAPayer >= 0 ? 'text-success' : 'text-destructive'}>
                {formatCurrency(netAPayer)}
              </strong>
            </span>
          </div>

          {/* Net à payer gros et coloré */}
          <div
            className={`p-4 rounded-lg text-center ${
              netAPayer >= 0
                ? 'bg-success/10 border border-success/20'
                : 'bg-destructive/10 border border-destructive/20'
            }`}
          >
            <div className="text-xs text-muted-foreground mb-1">Net à payer</div>
            <div
              className={`text-2xl font-bold ${
                netAPayer >= 0 ? 'text-success' : 'text-destructive'
              }`}
            >
              {formatCurrency(netAPayer)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              TTC ({formatCurrency(montantTTC)})
              {airsiMontant > 0 && ` - AIRSI (${formatCurrency(airsiMontant)})`}
              {retenueSourceMontant > 0 &&
                ` - Ret. source (${formatCurrency(retenueSourceMontant)})`}
              {bicMontant > 0 && ` - BIC (${formatCurrency(bicMontant)})`}
              {bncMontant > 0 && ` - BNC (${formatCurrency(bncMontant)})`}
              {penalitesMontant > 0 && ` - Pénalités (${formatCurrency(penalitesMontant)})`}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
