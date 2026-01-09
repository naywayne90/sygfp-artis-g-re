import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

type TabHelpConfig = {
  title: string;
  description: string;
  parent?: string;
  children?: string;
  example?: string;
  usage?: string;
};

const tabHelpContent: Record<string, TabHelpConfig> = {
  os: {
    title: "Objectifs Stratégiques (OS)",
    description: "Les OS représentent les grandes orientations stratégiques de l'ARTI sur une période pluriannuelle (ex: 2026-2030). Ils définissent la vision à long terme.",
    children: "Missions et Actions",
    example: "OS11 : Construire la structure fonctionnelle et de pilotage de l'autorité",
    usage: "Chaque ligne budgétaire sera rattachée à un OS pour assurer l'alignement stratégique des dépenses."
  },
  missions: {
    title: "Missions",
    description: "Les Missions regroupent les grandes fonctions de l'ARTI. Elles structurent l'organisation par grands domaines d'intervention.",
    children: "Actions",
    example: "M11 : Mission Structure fonctionnelle",
    usage: "Les missions permettent de catégoriser les actions par thématique et facilitent le reporting."
  },
  actions: {
    title: "Actions",
    description: "Les Actions sont les moyens opérationnels pour atteindre les objectifs stratégiques. Chaque action est rattachée à un OS et une Mission.",
    parent: "Objectif Stratégique + Mission",
    children: "Activités",
    example: "01 : Améliorer les performances opérationnelles de l'ARTI",
    usage: "Une action peut contenir plusieurs activités et représente un projet ou programme identifiable."
  },
  activites: {
    title: "Activités",
    description: "Les Activités sont les composantes d'une action. Elles représentent des ensembles cohérents de tâches à réaliser.",
    parent: "Action",
    children: "Sous-Activités",
    example: "ACT-01 : Mise en place du système d'information",
    usage: "Les activités permettent une décomposition plus fine pour le suivi de l'exécution budgétaire."
  },
  sousactivites: {
    title: "Sous-Activités",
    description: "Les Sous-Activités décomposent une activité en éléments plus détaillés pour un suivi précis.",
    parent: "Activité",
    children: "Tâches",
    example: "SA-01 : Développement du module de gestion",
    usage: "Niveau intermédiaire entre l'activité et les tâches opérationnelles."
  },
  taches: {
    title: "Tâches",
    description: "Les Tâches représentent le niveau le plus fin de la structure programmatique. Ce sont les opérations concrètes à réaliser.",
    parent: "Sous-Activité",
    example: "T1.1.1 : Rédaction du cahier des charges",
    usage: "C'est à ce niveau que les lignes budgétaires sont généralement créées pour un suivi détaillé."
  },
  directions: {
    title: "Directions",
    description: "Les Directions représentent les unités organisationnelles de l'ARTI. Chaque ligne budgétaire peut être rattachée à une direction responsable.",
    example: "DAA : Direction des Affaires Administratives",
    usage: "Permet de filtrer le budget par entité responsable et de générer des états par direction."
  },
  nbe: {
    title: "Nomenclature NBE",
    description: "La Nomenclature Budgétaire de l'État (NBE) est la classification officielle des dépenses publiques.",
    example: "61 : Achats de matières et fournitures",
    usage: "Obligatoire pour la conformité avec les règles de la comptabilité publique."
  },
  sysco: {
    title: "Plan Comptable SYSCO",
    description: "Le SYSCO (Système Comptable Ouest-Africain) est le référentiel comptable utilisé pour la tenue de la comptabilité.",
    example: "6011 : Achats de matières premières",
    usage: "Permet le rapprochement avec la comptabilité générale et les états financiers."
  },
  prestataires: {
    title: "Prestataires",
    description: "Le référentiel des prestataires (fournisseurs, consultants, entreprises) avec lesquels l'ARTI peut contracter.",
    example: "TECH SOLUTIONS SARL - IT & Services",
    usage: "Les prestataires qualifiés peuvent être sélectionnés lors de la création d'engagements."
  }
};

interface TabHelpSectionProps {
  tabKey: string;
}

export function TabHelpSection({ tabKey }: TabHelpSectionProps) {
  const config = tabHelpContent[tabKey];
  
  if (!config) return null;

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-sm">
        <div className="space-y-1">
          <p className="font-medium text-blue-800 dark:text-blue-200">{config.title}</p>
          <p className="text-muted-foreground">{config.description}</p>
          
          <div className="flex flex-wrap gap-4 mt-2 text-xs">
            {config.parent && (
              <span className="text-muted-foreground">
                <strong>Parent :</strong> {config.parent}
              </span>
            )}
            {config.children && (
              <span className="text-muted-foreground">
                <strong>Enfants :</strong> {config.children}
              </span>
            )}
          </div>
          
          {config.example && (
            <p className="text-xs text-muted-foreground mt-1">
              <strong>Exemple :</strong> <span className="font-mono">{config.example}</span>
            </p>
          )}
          
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            💡 {config.usage}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
