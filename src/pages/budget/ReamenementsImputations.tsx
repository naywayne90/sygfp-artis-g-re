/**
 * ReamenementsImputations - Page de gestion des réaménagements par imputations
 * Basé sur l'analyse de l'ancien SYGFP (arti-ci.com:8001)
 *
 * Utilise les imputations budgétaires (codes type 22.61.01) plutôt que
 * les lignes budgétaires modernes pour compatibilité avec l'ancien système.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

import { useExercice } from "@/contexts/ExerciceContext";
import { useRBAC } from "@/hooks/useRBAC";
import { useReamenagementBudgetaire } from "@/hooks/useReamenagementBudgetaire";
import { ReamenagementForm } from "@/components/budget/ReamenagementForm";
import { ReamenagementsList } from "@/components/budget/ReamenagementsList";

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

export default function ReamenementsImputations() {
  const { exercice, exerciceId, isReadOnly } = useExercice();
  const { canCreate: rbacCanCreate, isAdmin, hasProfil } = useRBAC();
  const canCreate = rbacCanCreate("budget");
  const canValidate = isAdmin || hasProfil("Validateur") || hasProfil("Controleur");

  // State
  const [activeTab, setActiveTab] = useState("en_attente");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Query
  const {
    reamenagements,
    countEnAttente,
    countValides,
    countRejetes,
  } = useReamenagementBudgetaire(exerciceId);

  // Stats
  const totalMontant = reamenagements
    .filter((r) => r.statut === "valide")
    .reduce((sum, r) => sum + r.montant, 0);

  // Export to Excel
  const handleExport = () => {
    if (!reamenagements || reamenagements.length === 0) return;

    const exportData = reamenagements.map((r) => ({
      Date: format(new Date(r.created_at), "dd/MM/yyyy"),
      "Imputation Source": r.imputation_source,
      "Libellé Source": r.libelle_source || "-",
      "Imputation Destination": r.imputation_destination,
      "Libellé Destination": r.libelle_destination || "-",
      Montant: r.montant,
      Motif: r.motif,
      Statut: r.statut,
      "Validé par": r.valide_par_nom || "-",
      "Date validation": r.date_validation
        ? format(new Date(r.date_validation), "dd/MM/yyyy")
        : "-",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Réaménagements");
    XLSX.writeFile(wb, `reamenagements_imputations_${exercice}.xlsx`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" />
            Réaménagements budgétaires (Imputations)
          </h1>
          <p className="text-muted-foreground">
            Exercice {exercice} - Transferts entre imputations budgétaires
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!reamenagements.length}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          {canCreate && !isReadOnly && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau réaménagement
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{countEnAttente}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validés</p>
                <p className="text-2xl font-bold">{countValides}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejetés</p>
                <p className="text-2xl font-bold">{countRejetes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total transféré</p>
                <p className="text-lg font-bold truncate">{formatMontant(totalMontant)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Réaménagements par imputations
              </p>
              <p className="text-blue-600 dark:text-blue-300">
                Cette page gère les transferts budgétaires entre imputations (codes type 22.61.01).
                Pour les virements entre lignes budgétaires modernes, utilisez la page{" "}
                <a href="/planification/virements" className="underline">
                  Virements & Ajustements
                </a>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="en_attente" className="gap-2">
            <Clock className="h-4 w-4" />
            En attente
            {countEnAttente > 0 && (
              <Badge variant="secondary" className="ml-1">
                {countEnAttente}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="valide" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Validés
          </TabsTrigger>
          <TabsTrigger value="rejete" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejetés
          </TabsTrigger>
          <TabsTrigger value="tous" className="gap-2">
            <FileText className="h-4 w-4" />
            Tous
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en_attente" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Réaménagements en attente de validation</CardTitle>
              <CardDescription>
                {canValidate
                  ? "Vous pouvez valider ou rejeter ces demandes"
                  : "Ces demandes sont en attente de validation par un validateur"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReamenagementsList filterStatut="en_attente" showActions={canValidate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="valide" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Réaménagements validés</CardTitle>
              <CardDescription>
                Ces transferts budgétaires ont été approuvés et appliqués
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReamenagementsList filterStatut="valide" showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejete" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Réaménagements rejetés</CardTitle>
              <CardDescription>
                Ces demandes de transfert ont été refusées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReamenagementsList filterStatut="rejete" showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tous" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tous les réaménagements</CardTitle>
              <CardDescription>
                Historique complet des demandes de réaménagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReamenagementsList filterStatut="tous" showActions={canValidate} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <ReamenagementForm
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          // Optionally switch to "en_attente" tab after creation
          setActiveTab("en_attente");
        }}
      />
    </div>
  );
}
