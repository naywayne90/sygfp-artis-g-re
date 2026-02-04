// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportButtons } from "./ExportButtons";
import { EtapeStats } from "@/hooks/useEtatsExecution";
import { FileText, FileCheck, ClipboardCheck, CreditCard, Banknote } from "lucide-react";

interface EtatParEtapeProps {
  data: EtapeStats[];
}

const formatMontant = (montant: number) => {
  if (montant >= 1000000000) {
    return (montant / 1000000000).toFixed(2) + " Mds";
  }
  if (montant >= 1000000) {
    return (montant / 1000000).toFixed(1) + " M";
  }
  return new Intl.NumberFormat("fr-FR").format(montant);
};

const ETAPE_ICONS: Record<string, React.ReactNode> = {
  notes_aef: <FileText className="h-5 w-5" />,
  engagements: <FileCheck className="h-5 w-5" />,
  liquidations: <ClipboardCheck className="h-5 w-5" />,
  ordonnancements: <CreditCard className="h-5 w-5" />,
  reglements: <Banknote className="h-5 w-5" />,
};

const ETAPE_COLORS: Record<string, string> = {
  notes_aef: "bg-purple-500/10 text-purple-600 border-purple-200",
  engagements: "bg-secondary/10 text-secondary border-secondary/20",
  liquidations: "bg-amber-500/10 text-amber-600 border-amber-200",
  ordonnancements: "bg-blue-500/10 text-blue-600 border-blue-200",
  reglements: "bg-success/10 text-success border-success/20",
};

export function EtatParEtape({ data }: EtatParEtapeProps) {
  const exportColumns = [
    { key: "label", label: "Étape" },
    { key: "total", label: "Total" },
    { key: "brouillon", label: "Brouillons" },
    { key: "soumis", label: "Soumis" },
    { key: "valide", label: "Validés" },
    { key: "rejete", label: "Rejetés" },
    { key: "differe", label: "Différés" },
    { key: "montant_total", label: "Montant Total" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">État par Étape du Workflow</CardTitle>
        <ExportButtons
          data={data}
          columns={exportColumns}
          filename="etat_par_etape"
          title="État par Étape du Workflow"
        />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((etape) => (
            <div
              key={etape.etape}
              className={`p-4 rounded-lg border ${ETAPE_COLORS[etape.etape] || "bg-muted"}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-background/50">
                  {ETAPE_ICONS[etape.etape]}
                </div>
                <div>
                  <h3 className="font-semibold">{etape.label}</h3>
                  <p className="text-2xl font-bold">{etape.total}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Brouillons</span>
                  <Badge variant="outline" className="bg-background">
                    {etape.brouillon}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Soumis</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                    {etape.soumis}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Validés</span>
                  <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                    {etape.valide}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rejetés</span>
                  <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                    {etape.rejete}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Différés</span>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                    {etape.differe}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-current/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Montant total</span>
                  <span className="font-bold">{formatMontant(etape.montant_total)} FCFA</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium">Étape</th>
                <th className="text-center py-3 px-4 font-medium">Total</th>
                <th className="text-center py-3 px-4 font-medium">Brouillons</th>
                <th className="text-center py-3 px-4 font-medium">Soumis</th>
                <th className="text-center py-3 px-4 font-medium">Validés</th>
                <th className="text-center py-3 px-4 font-medium">Rejetés</th>
                <th className="text-center py-3 px-4 font-medium">Différés</th>
                <th className="text-right py-3 px-4 font-medium">Montant Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((etape) => (
                <tr key={etape.etape} className="border-b hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{etape.label}</td>
                  <td className="py-3 px-4 text-center font-bold">{etape.total}</td>
                  <td className="py-3 px-4 text-center">{etape.brouillon}</td>
                  <td className="py-3 px-4 text-center text-blue-600">{etape.soumis}</td>
                  <td className="py-3 px-4 text-center text-success">{etape.valide}</td>
                  <td className="py-3 px-4 text-center text-destructive">{etape.rejete}</td>
                  <td className="py-3 px-4 text-center text-amber-600">{etape.differe}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {formatMontant(etape.montant_total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/70 font-bold">
                <td className="py-3 px-4">TOTAL</td>
                <td className="py-3 px-4 text-center">
                  {data.reduce((sum, e) => sum + e.total, 0)}
                </td>
                <td className="py-3 px-4 text-center">
                  {data.reduce((sum, e) => sum + e.brouillon, 0)}
                </td>
                <td className="py-3 px-4 text-center">
                  {data.reduce((sum, e) => sum + e.soumis, 0)}
                </td>
                <td className="py-3 px-4 text-center">
                  {data.reduce((sum, e) => sum + e.valide, 0)}
                </td>
                <td className="py-3 px-4 text-center">
                  {data.reduce((sum, e) => sum + e.rejete, 0)}
                </td>
                <td className="py-3 px-4 text-center">
                  {data.reduce((sum, e) => sum + e.differe, 0)}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatMontant(data.reduce((sum, e) => sum + e.montant_total, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
