import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useEtatsExecution, EtatFilters } from "@/hooks/useEtatsExecution";
import { EtatFilters as EtatFiltersComponent } from "@/components/etats/EtatFilters";
import { SuiviBudgetaire } from "@/components/etats/SuiviBudgetaire";
import { EtatParDirection } from "@/components/etats/EtatParDirection";
import { EtatGenerique } from "@/components/etats/EtatGenerique";
import { EtatParEtape } from "@/components/etats/EtatParEtape";
import { BarChart3 } from "lucide-react";

export default function EtatsExecution() {
  const [filters, setFilters] = useState<EtatFilters>({});
  
  const {
    summary,
    etapesStats,
    getEtatByDirection,
    getEtatByOS,
    getEtatByMission,
    getEtatByNBE,
    getEtatBySYSCO,
    getEtatByProjet,
    directions,
    objectifsStrategiques,
    missions,
    nomenclaturesNBE,
    planComptableSYSCO,
    isLoading,
    exercice,
  } = useEtatsExecution(filters);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="page-title">États d'Exécution Budgétaire</h1>
          </div>
          <p className="page-description">
            Suivi et analyse de l'exécution du budget - Exercice {exercice}
          </p>
        </div>
      </div>

      {/* Filters */}
      <EtatFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        directions={directions}
        objectifsStrategiques={objectifsStrategiques}
        missions={missions}
        nomenclaturesNBE={nomenclaturesNBE}
        planComptableSYSCO={planComptableSYSCO}
        exercice={exercice}
      />

      {/* Tabs */}
      <Tabs defaultValue="suivi" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="suivi">Suivi Budgétaire</TabsTrigger>
          <TabsTrigger value="projet">Par Projet</TabsTrigger>
          <TabsTrigger value="direction">Par Direction</TabsTrigger>
          <TabsTrigger value="os">Par OS</TabsTrigger>
          <TabsTrigger value="mission">Par Mission</TabsTrigger>
          <TabsTrigger value="nbe">Par NBE</TabsTrigger>
          <TabsTrigger value="sysco">Par SYSCO</TabsTrigger>
          <TabsTrigger value="etape">Par Étape</TabsTrigger>
        </TabsList>

        <TabsContent value="suivi">
          <SuiviBudgetaire summary={summary} />
        </TabsContent>

        <TabsContent value="projet">
          <EtatGenerique
            data={getEtatByProjet().map((d) => ({ ...d, item: d.item }))}
            title="État par Projet / Dossier"
            itemLabel="Projet (Réf. Dossier)"
            filename="etat_par_projet"
          />
        </TabsContent>

        <TabsContent value="direction">
          <EtatParDirection data={getEtatByDirection()} />
        </TabsContent>

        <TabsContent value="os">
          <EtatGenerique
            data={getEtatByOS().map((d) => ({ ...d, item: d.os }))}
            title="État par Objectif Stratégique"
            itemLabel="Objectif Stratégique"
            filename="etat_par_os"
          />
        </TabsContent>

        <TabsContent value="mission">
          <EtatGenerique
            data={getEtatByMission().map((d) => ({ ...d, item: d.mission }))}
            title="État par Mission"
            itemLabel="Mission"
            filename="etat_par_mission"
          />
        </TabsContent>

        <TabsContent value="nbe">
          <EtatGenerique
            data={getEtatByNBE().map((d) => ({ ...d, item: d.nbe }))}
            title="État par Nomenclature NBE"
            itemLabel="Nomenclature NBE"
            filename="etat_par_nbe"
          />
        </TabsContent>

        <TabsContent value="sysco">
          <EtatGenerique
            data={getEtatBySYSCO().map((d) => ({ ...d, item: d.sysco }))}
            title="État par Plan Comptable SYSCO"
            itemLabel="Compte SYSCO"
            filename="etat_par_sysco"
          />
        </TabsContent>

        <TabsContent value="etape">
          <EtatParEtape data={etapesStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
