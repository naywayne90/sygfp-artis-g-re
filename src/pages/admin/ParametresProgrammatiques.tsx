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
  Users,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [helpOpen, setHelpOpen] = useState(false);

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

      {/* Section d'aide */}
      <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>Comprendre les référentiels programmatiques</span>
            </div>
            {helpOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Qu'est-ce que la structure programmatique ?</p>
              <p className="text-sm text-muted-foreground">
                La structure programmatique organise le budget selon une hiérarchie logique permettant de lier 
                les dépenses aux objectifs stratégiques de l'organisation. Chaque niveau doit être correctement 
                configuré pour que les lignes budgétaires puissent être créées.
              </p>
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Hiérarchie Programmatique
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li><strong>OS (Objectifs Stratégiques)</strong> : Objectifs à long terme de l'organisation (ex: 2026-2030)</li>
                <li><strong>Missions</strong> : Grandes orientations rattachées aux OS</li>
                <li><strong>Actions</strong> : Déclinaisons opérationnelles des missions</li>
                <li><strong>Activités</strong> : Regroupement de tâches pour réaliser une action</li>
                <li><strong>Sous-Activités</strong> : Niveau de détail supplémentaire</li>
                <li><strong>Tâches</strong> : Opérations concrètes à exécuter</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Nomenclatures & Autres
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li><strong>Directions</strong> : Services/départements responsables des lignes budgétaires</li>
                <li><strong>NBE (Nomenclature Budgétaire)</strong> : Classification des natures de dépenses</li>
                <li><strong>SYSCO (Plan Comptable)</strong> : Comptes comptables pour l'imputation</li>
                <li><strong>Prestataires</strong> : Fournisseurs et partenaires de l'organisation</li>
              </ul>
            </div>
          </div>

          <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <HelpCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <p className="font-medium">Comment utiliser ce module ?</p>
              <ul className="text-sm mt-1 space-y-1">
                <li>• <strong>Import/Export</strong> : Chaque onglet dispose d'un bouton pour importer depuis Excel ou exporter les données</li>
                <li>• <strong>Ordre de création</strong> : Commencez par les OS, puis les Missions, Actions, etc. (ordre hiérarchique)</li>
                <li>• <strong>Liaisons</strong> : Chaque niveau est lié au niveau supérieur (une Action appartient à une Mission)</li>
                <li>• <strong>Impact</strong> : Ces référentiels sont utilisés lors de la création des lignes budgétaires dans <strong>Planification → Planification Budgétaire</strong></li>
              </ul>
            </AlertDescription>
          </Alert>
        </CollapsibleContent>
      </Collapsible>

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
