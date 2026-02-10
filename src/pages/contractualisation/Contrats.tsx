import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExercice } from "@/contexts/ExerciceContext";
import { useContrats } from "@/hooks/useContrats";
import { FileSignature, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { ContratList } from "@/components/contrats/ContratList";

export default function Contrats() {
  const { exercice } = useExercice();
  const { contrats } = useContrats();

  const data = contrats.data || [];
  const actifs = data.filter(c => c.statut === "en_cours" || c.statut === "signe").length;
  const enNegociation = data.filter(c => c.statut === "en_negociation").length;
  const signesCeMois = data.filter(c => {
    if (!c.date_signature) return false;
    const d = new Date(c.date_signature);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const expirentBientot = data.filter(c => {
    if (!c.date_fin) return false;
    const dateFin = new Date(c.date_fin);
    const dans30j = new Date();
    dans30j.setDate(dans30j.getDate() + 30);
    return dateFin <= dans30j && dateFin >= new Date();
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des Contrats</h1>
        <p className="page-description">
          Suivi des contrats et avenants - Exercice {exercice}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contrats actifs
            </CardTitle>
            <FileSignature className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actifs}</div>
            <p className="text-xs text-muted-foreground">En vigueur</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En négociation
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enNegociation}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Signés
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signesCeMois}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expirent bientôt
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expirentBientot}</div>
            <p className="text-xs text-muted-foreground">Dans 30 jours</p>
          </CardContent>
        </Card>
      </div>

      <ContratList />
    </div>
  );
}
