import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { Wallet, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PaiementsAVenir() {
  const { exercice } = useExercice();
  const navigate = useNavigate();

  const { data: paiements = [], isLoading } = useQuery({
    queryKey: ["paiements-a-venir", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordonnancements")
        .select(`
          id,
          numero,
          montant,
          montant_paye,
          beneficiaire,
          mode_paiement,
          created_at,
          liquidation:budget_liquidations(
            numero,
            engagement:budget_engagements(
              numero,
              fournisseur,
              budget_line:budget_lines(code, label)
            )
          )
        `)
        .eq("exercice", exercice)
        .in("statut", ["valide", "signe"])
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).filter(o => (o.montant || 0) > (o.montant_paye || 0));
    },
    enabled: !!exercice,
  });

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
  };

  const getAnciennete = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 30) return { label: `${days}j`, variant: "destructive" as const };
    if (days > 14) return { label: `${days}j`, variant: "outline" as const };
    return { label: `${days}j`, variant: "secondary" as const };
  };

  const totalAPayer = paiements.reduce((sum, p) => sum + ((p.montant || 0) - (p.montant_paye || 0)), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Paiements à venir
            </CardTitle>
            <CardDescription>
              {paiements.length} ordonnancement(s) en attente de règlement
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total à payer</div>
            <div className="text-xl font-bold text-destructive">{formatMontant(totalAPayer)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : paiements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun paiement en attente</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priorité</TableHead>
                <TableHead>Ordonnancement</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead className="text-right">Reste à payer</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paiements.slice(0, 10).map((p, idx) => {
                const reste = (p.montant || 0) - (p.montant_paye || 0);
                const anciennete = getAnciennete(p.created_at);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-muted-foreground">#{idx + 1}</span>
                        <Badge variant={anciennete.variant}>{anciennete.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{p.numero}</TableCell>
                    <TableCell>{p.beneficiaire || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-warning">
                      {formatMontant(reste)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/reglements?sourceOrdonnancement=${p.id}`)}
                      >
                        <Wallet className="mr-1 h-3 w-3" />
                        Payer
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
