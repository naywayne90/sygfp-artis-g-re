import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ExportButtons } from "./ExportButtons";

interface GenericData {
  item: { id: string; code: string; libelle: string };
  dotation: number;
  engage: number;
  liquide: number;
  ordonnance: number;
  paye: number;
}

interface EtatGeneriqueProps {
  data: GenericData[];
  title: string;
  itemLabel: string;
  filename: string;
}

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat("fr-FR").format(montant);
};

export function EtatGenerique({ data, title, itemLabel, filename }: EtatGeneriqueProps) {
  const totals = data.reduce(
    (acc, row) => ({
      dotation: acc.dotation + row.dotation,
      engage: acc.engage + row.engage,
      liquide: acc.liquide + row.liquide,
      ordonnance: acc.ordonnance + row.ordonnance,
      paye: acc.paye + row.paye,
    }),
    { dotation: 0, engage: 0, liquide: 0, ordonnance: 0, paye: 0 }
  );

  const exportColumns = [
    { key: "item.code", label: "Code" },
    { key: "item.libelle", label: itemLabel },
    { key: "dotation", label: "Dotation" },
    { key: "engage", label: "Engagé" },
    { key: "liquide", label: "Liquidé" },
    { key: "ordonnance", label: "Ordonnancé" },
    { key: "paye", label: "Payé" },
    { key: "disponible", label: "Disponible" },
    { key: "taux", label: "Taux (%)" },
  ];

  const exportData = data.map((row) => ({
    ...row,
    disponible: row.dotation - row.engage,
    taux: row.dotation > 0 ? ((row.engage / row.dotation) * 100).toFixed(1) : 0,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <ExportButtons
          data={exportData}
          columns={exportColumns}
          filename={filename}
          title={title}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium">Code</th>
                <th className="text-left py-3 px-4 font-medium">{itemLabel}</th>
                <th className="text-right py-3 px-4 font-medium">Dotation</th>
                <th className="text-right py-3 px-4 font-medium">Engagé</th>
                <th className="text-right py-3 px-4 font-medium">Liquidé</th>
                <th className="text-right py-3 px-4 font-medium">Payé</th>
                <th className="text-right py-3 px-4 font-medium">Disponible</th>
                <th className="text-center py-3 px-4 font-medium w-32">Taux</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const disponible = row.dotation - row.engage;
                const taux = row.dotation > 0 ? (row.engage / row.dotation) * 100 : 0;
                return (
                  <tr key={row.item.id || index} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono">{row.item.code}</td>
                    <td className="py-3 px-4">{row.item.libelle}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatMontant(row.dotation)}</td>
                    <td className="py-3 px-4 text-right font-mono text-secondary">
                      {formatMontant(row.engage)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-600">
                      {formatMontant(row.liquide)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-success">
                      {formatMontant(row.paye)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatMontant(disponible)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(taux, 100)} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-12 text-right">{taux.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/70 font-bold">
                <td className="py-3 px-4" colSpan={2}>TOTAL</td>
                <td className="py-3 px-4 text-right font-mono">{formatMontant(totals.dotation)}</td>
                <td className="py-3 px-4 text-right font-mono text-secondary">
                  {formatMontant(totals.engage)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-600">
                  {formatMontant(totals.liquide)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-success">
                  {formatMontant(totals.paye)}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatMontant(totals.dotation - totals.engage)}
                </td>
                <td className="py-3 px-4 text-center">
                  {totals.dotation > 0
                    ? ((totals.engage / totals.dotation) * 100).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
