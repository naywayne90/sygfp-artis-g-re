import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Briefcase, Layers, Activity, GitBranch, Building2 } from "lucide-react";
import ObjectifsStrategiquesTab from "@/components/admin/programmatique/ObjectifsStrategiquesTab";
import MissionsTab from "@/components/admin/programmatique/MissionsTab";
import ActionsTab from "@/components/admin/programmatique/ActionsTab";
import ActivitesTab from "@/components/admin/programmatique/ActivitesTab";
import SousActivitesTab from "@/components/admin/programmatique/SousActivitesTab";
import DirectionsTab from "@/components/admin/programmatique/DirectionsTab";

export default function ParametresProgrammatiques() {
  const [activeTab, setActiveTab] = useState("objectifs");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres Programmatiques</h1>
        <p className="text-muted-foreground mt-1">
          Gérez la structure programmatique de l'ARTI : objectifs stratégiques, missions, actions et activités.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="objectifs" className="flex items-center gap-2 py-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Objectifs</span>
          </TabsTrigger>
          <TabsTrigger value="missions" className="flex items-center gap-2 py-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Missions</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2 py-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
          <TabsTrigger value="activites" className="flex items-center gap-2 py-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activités</span>
          </TabsTrigger>
          <TabsTrigger value="sous-activites" className="flex items-center gap-2 py-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Sous-Activités</span>
          </TabsTrigger>
          <TabsTrigger value="directions" className="flex items-center gap-2 py-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Directions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objectifs">
          <ObjectifsStrategiquesTab />
        </TabsContent>

        <TabsContent value="missions">
          <MissionsTab />
        </TabsContent>

        <TabsContent value="actions">
          <ActionsTab />
        </TabsContent>

        <TabsContent value="activites">
          <ActivitesTab />
        </TabsContent>

        <TabsContent value="sous-activites">
          <SousActivitesTab />
        </TabsContent>

        <TabsContent value="directions">
          <DirectionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
