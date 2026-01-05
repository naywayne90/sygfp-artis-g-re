import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  Briefcase, 
  Layers, 
  Activity, 
  GitBranch, 
  Building2, 
  CheckSquare,
  BookOpen,
  Calculator,
  Users
} from "lucide-react";
import ObjectifsStrategiquesTab from "@/components/admin/programmatique/ObjectifsStrategiquesTab";
import MissionsTab from "@/components/admin/programmatique/MissionsTab";
import ActionsTab from "@/components/admin/programmatique/ActionsTab";
import ActivitesTab from "@/components/admin/programmatique/ActivitesTab";
import SousActivitesTab from "@/components/admin/programmatique/SousActivitesTab";
import DirectionsTab from "@/components/admin/programmatique/DirectionsTab";
import TachesTab from "@/components/admin/programmatique/TachesTab";
import NomenclatureNBETab from "@/components/admin/programmatique/NomenclatureNBETab";
import PlanComptableSYSCOTab from "@/components/admin/programmatique/PlanComptableSYSCOTab";
import PrestatairesTab from "@/components/admin/programmatique/PrestatairesTab";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const TABS = [
  { value: "objectifs", label: "Objectifs Stratégiques", icon: Target, shortLabel: "OS" },
  { value: "missions", label: "Missions", icon: Briefcase, shortLabel: "Missions" },
  { value: "actions", label: "Actions", icon: Layers, shortLabel: "Actions" },
  { value: "activites", label: "Activités", icon: Activity, shortLabel: "Activités" },
  { value: "sous-activites", label: "Sous-Activités", icon: GitBranch, shortLabel: "Sous-Act." },
  { value: "taches", label: "Tâches", icon: CheckSquare, shortLabel: "Tâches" },
  { value: "directions", label: "Directions", icon: Building2, shortLabel: "Directions" },
  { value: "nomenclature", label: "Nomenclature NBE", icon: BookOpen, shortLabel: "NBE" },
  { value: "plan-comptable", label: "Plan Comptable SYSCO", icon: Calculator, shortLabel: "SYSCO" },
  { value: "prestataires", label: "Prestataires", icon: Users, shortLabel: "Prestataires" },
];

export default function ParametresProgrammatiques() {
  const [activeTab, setActiveTab] = useState("objectifs");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Référentiels</h1>
          <Badge variant="secondary">{TABS.length} référentiels</Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          Gérez la structure programmatique, les nomenclatures et les fournisseurs. Import/Export disponible pour chaque référentiel.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex h-auto p-1 bg-muted/50">
            {TABS.map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="flex items-center gap-2 py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden md:inline">{tab.shortLabel}</span>
                <span className="md:hidden">{tab.shortLabel.slice(0, 3)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

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

        <TabsContent value="taches">
          <TachesTab />
        </TabsContent>

        <TabsContent value="directions">
          <DirectionsTab />
        </TabsContent>

        <TabsContent value="nomenclature">
          <NomenclatureNBETab />
        </TabsContent>

        <TabsContent value="plan-comptable">
          <PlanComptableSYSCOTab />
        </TabsContent>

        <TabsContent value="prestataires">
          <PrestatairesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
