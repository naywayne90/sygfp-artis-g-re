import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRecettes, ORIGINES_RECETTES } from "@/hooks/useRecettes";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c"];

export function EtatRecettes() {
  const { recettes, stats: _stats } = useRecettes();
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setMonth(0, 1);
    return d.toISOString().split("T")[0];
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split("T")[0]);
  const [groupBy, setGroupBy] = useState<"origine" | "mois">("origine");

  const filteredRecettes = recettes.data?.filter(r => {
    return r.date_recette >= dateDebut && r.date_recette <= dateFin;
  }) || [];

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  // Regroupement par origine
  const byOrigine = ORIGINES_RECETTES.map(origine => {
    const items = filteredRecettes.filter(r => r.origine === origine);
    const total = items.reduce((sum, r) => sum + r.montant, 0);
    const encaisse = items.filter(r => r.statut === "encaissee").reduce((sum, r) => sum + r.montant, 0);
    return { origine, count: items.length, total, encaisse };
  }).filter(x => x.count > 0);

  // Regroupement par mois
  const byMois: Record<string, { mois: string; total: number; encaisse: number; count: number }> = {};
  filteredRecettes.forEach(r => {
    const mois = r.date_recette.slice(0, 7);
    if (!byMois[mois]) byMois[mois] = { mois, total: 0, encaisse: 0, count: 0 };
    byMois[mois].total += r.montant;
    byMois[mois].count++;
    if (r.statut === "encaissee") byMois[mois].encaisse += r.montant;
  });
  const moisData = Object.values(byMois).sort((a, b) => a.mois.localeCompare(b.mois));

  const pieData = byOrigine.map((item, index) => ({
    name: item.origine,
    value: item.total,
    fill: COLORS[index % COLORS.length],
  }));

  const totalPeriode = filteredRecettes.reduce((sum, r) => sum + r.montant, 0);
  const encaissePeriode = filteredRecettes.filter(r => r.statut === "encaissee").reduce((sum, r) => sum + r.montant, 0);
  const tauxRecouvrement = totalPeriode > 0 ? (encaissePeriode / totalPeriode) * 100 : 0;

  const exportData = () => {
    const headers = ["Période", "Origine", "Nombre", "Total", "Encaissé"];
    const rows = byOrigine.map(x => [
      `${dateDebut} - ${dateFin}`,
      x.origine,
      x.count,
      x.total,
      x.encaisse,
    ]);
    const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `etat_recettes_${dateDebut}_${dateFin}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>États des recettes</CardTitle>
          <CardDescription>Analyse des recettes par période et origine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Regrouper par</Label>
              <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="origine">Origine</SelectItem>
                  <SelectItem value="mois">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs période */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total période</div>
            <div className="text-2xl font-bold">{formatMontant(totalPeriode)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Encaissé</div>
            <div className="text-2xl font-bold text-success">{formatMontant(encaissePeriode)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Taux de recouvrement</div>
            <div className="text-2xl font-bold">{tauxRecouvrement.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Nombre de recettes</div>
            <div className="text-2xl font-bold">{filteredRecettes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par origine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatMontant(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: number) => formatMontant(value)} />
                  <Bar dataKey="total" fill="#8884d8" name="Total" />
                  <Bar dataKey="encaisse" fill="#82ca9d" name="Encaissé" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par {groupBy === "origine" ? "origine" : "mois"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{groupBy === "origine" ? "Origine" : "Mois"}</TableHead>
                <TableHead className="text-right">Nombre</TableHead>
                <TableHead className="text-right">Total déclaré</TableHead>
                <TableHead className="text-right">Encaissé</TableHead>
                <TableHead className="text-right">Taux</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(groupBy === "origine" ? byOrigine : moisData).map((item: any, index) => {
                const taux = item.total > 0 ? (item.encaisse / item.total) * 100 : 0;
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {groupBy === "origine" ? item.origine : item.mois}
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">{formatMontant(item.total)}</TableCell>
                    <TableCell className="text-right text-success">{formatMontant(item.encaisse)}</TableCell>
                    <TableCell className="text-right">{taux.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{filteredRecettes.length}</TableCell>
                <TableCell className="text-right">{formatMontant(totalPeriode)}</TableCell>
                <TableCell className="text-right text-success">{formatMontant(encaissePeriode)}</TableCell>
                <TableCell className="text-right">{tauxRecouvrement.toFixed(1)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
