import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, FileCheck, FileSignature, Clock, XCircle } from "lucide-react";
import { OrdonnancementForm } from "@/components/ordonnancement/OrdonnancementForm";
import { OrdonnancementList } from "@/components/ordonnancement/OrdonnancementList";
import { useOrdonnancements } from "@/hooks/useOrdonnancements";

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

export default function Ordonnancements() {
  const { ordonnancements, isLoading } = useOrdonnancements();
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Filtrer par recherche
  const filteredOrdonnancements = ordonnancements.filter((ord) =>
    (ord.numero?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (ord.beneficiaire?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (ord.objet?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: ordonnancements.length,
    montantTotal: ordonnancements.reduce((sum, ord) => sum + (ord.montant || 0), 0),
    aValider: ordonnancements.filter(
      (o) => o.statut === "soumis" || o.workflow_status === "en_validation"
    ).length,
    valides: ordonnancements.filter((o) => o.statut === "valide").length,
    rejetes: ordonnancements.filter((o) => o.statut === "rejete").length,
    differes: ordonnancements.filter((o) => o.statut === "differe").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Ordonnancements</h1>
          <p className="page-description">
            Ordres de paiement et mandats à transmettre au Trésor
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Nouvel ordonnancement
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="text-xl font-bold text-primary">
                {formatMontant(stats.montantTotal)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <p className="text-2xl font-bold text-warning">{stats.aValider}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validés</p>
                <p className="text-2xl font-bold text-success">{stats.valides}</p>
              </div>
              <FileSignature className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejetés</p>
                <p className="text-2xl font-bold text-destructive">{stats.rejetes}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, bénéficiaire ou objet..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs with lists */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des ordonnancements</CardTitle>
          <CardDescription>
            {filteredOrdonnancements.length} ordonnancement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tous">
            <TabsList className="mb-4">
              <TabsTrigger value="tous">Tous ({stats.total})</TabsTrigger>
              <TabsTrigger value="a_valider">À valider ({stats.aValider})</TabsTrigger>
              <TabsTrigger value="valides">Validés ({stats.valides})</TabsTrigger>
              <TabsTrigger value="rejetes">Rejetés ({stats.rejetes})</TabsTrigger>
              <TabsTrigger value="differes">Différés ({stats.differes})</TabsTrigger>
            </TabsList>

            <TabsContent value="tous">
              <OrdonnancementList ordonnancements={filteredOrdonnancements} filter="tous" />
            </TabsContent>
            <TabsContent value="a_valider">
              <OrdonnancementList ordonnancements={filteredOrdonnancements} filter="a_valider" />
            </TabsContent>
            <TabsContent value="valides">
              <OrdonnancementList ordonnancements={filteredOrdonnancements} filter="valides" />
            </TabsContent>
            <TabsContent value="rejetes">
              <OrdonnancementList ordonnancements={filteredOrdonnancements} filter="rejetes" />
            </TabsContent>
            <TabsContent value="differes">
              <OrdonnancementList ordonnancements={filteredOrdonnancements} filter="differes" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <OrdonnancementForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
}
