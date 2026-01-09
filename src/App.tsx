import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ExerciceProvider } from "@/contexts/ExerciceContext";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages principales
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import NotesSEF from "./pages/NotesSEF";
import NotesAEF from "./pages/NotesAEF";
import Engagements from "./pages/Engagements";
import Liquidations from "./pages/Liquidations";
import Ordonnancements from "./pages/Ordonnancements";
import Reglements from "./pages/Reglements";
import Marches from "./pages/Marches";
import Recherche from "./pages/Recherche";
import EtatsExecution from "./pages/EtatsExecution";
import SelectExercice from "./pages/SelectExercice";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import AlertesBudgetaires from "./pages/AlertesBudgetaires";
import Alertes from "./pages/Alertes";
import MonProfil from "./pages/MonProfil";

// Pages Admin
import ParametresProgrammatiques from "./pages/admin/ParametresProgrammatiques";
import GestionUtilisateurs from "./pages/admin/GestionUtilisateurs";
import GestionExercices from "./pages/admin/GestionExercices";
import GestionRoles from "./pages/admin/GestionRoles";
import GestionAutorisations from "./pages/admin/GestionAutorisations";
import GestionDelegations from "./pages/admin/GestionDelegations";
import ParametresSysteme from "./pages/admin/ParametresSysteme";
import JournalAudit from "./pages/admin/JournalAudit";
import ArchitectureSYGFP from "./pages/admin/ArchitectureSYGFP";
import DictionnaireVariables from "./pages/admin/DictionnaireVariables";
import ReferentielCodification from "./pages/admin/ReferentielCodification";
import SecteursActivite from "./pages/admin/SecteursActivite";
import DocumentationModules from "./pages/admin/DocumentationModules";
import MatriceRACI from "./pages/admin/MatriceRACI";
import ChecklistProduction from "./pages/admin/ChecklistProduction";
import LiensLambda from "./pages/admin/LiensLambda";
import ParametresExercice from "./pages/admin/ParametresExercice";

// Pages Planification
import PlanificationBudgetaire from "./pages/planification/PlanificationBudgetaire";
import PlanificationPhysique from "./pages/planification/PlanificationPhysique";
import Virements from "./pages/planification/Virements";
import ImportExport from "./pages/planification/ImportExport";
import DocumentationImport from "./pages/planification/DocumentationImport";
import HistoriqueImports from "./pages/planification/HistoriqueImports";
import AideImportBudget from "./pages/planification/AideImportBudget";

// Pages Exécution
import ExpressionBesoin from "./pages/execution/ExpressionBesoin";
import Imputation from "./pages/execution/Imputation";

// Pages Approvisionnement
import Approvisionnement from "./pages/approvisionnement/Approvisionnement";

// Pages Trésorerie
import GestionTresorerie from "./pages/tresorerie/GestionTresorerie";

// Pages Recettes
import DeclarationRecette from "./pages/recettes/DeclarationRecette";

// Pages Contractualisation
import Prestataires from "./pages/contractualisation/Prestataires";
import Contrats from "./pages/contractualisation/Contrats";
import ComptabiliteMatiere from "./pages/contractualisation/ComptabiliteMatiere";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Layout wrapper component that renders Outlet for child routes
function LayoutWrapper() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ExerciceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Route indépendante pour sélection exercice */}
            <Route path="/select-exercice" element={<SelectExercice />} />
            
            {/* Routes avec layout */}
            <Route element={<LayoutWrapper />}>
              {/* Accueil */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/recherche" element={<Recherche />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/alertes-budgetaires" element={<AlertesBudgetaires />} />
              <Route path="/alertes" element={<Alertes />} />
              <Route path="/mon-profil" element={<MonProfil />} />
              
              {/* Administration */}
              <Route path="/admin/exercices" element={<GestionExercices />} />
              <Route path="/admin/parametres-programmatiques" element={<ParametresProgrammatiques />} />
              <Route path="/admin/utilisateurs" element={<GestionUtilisateurs />} />
              <Route path="/admin/roles" element={<GestionRoles />} />
              <Route path="/admin/autorisations" element={<GestionAutorisations />} />
              <Route path="/admin/delegations" element={<GestionDelegations />} />
              <Route path="/admin/parametres" element={<ParametresSysteme />} />
              <Route path="/admin/journal-audit" element={<JournalAudit />} />
              <Route path="/admin/architecture" element={<ArchitectureSYGFP />} />
              <Route path="/admin/dictionnaire" element={<DictionnaireVariables />} />
              <Route path="/admin/codification" element={<ReferentielCodification />} />
              <Route path="/admin/secteurs-activite" element={<SecteursActivite />} />
              <Route path="/admin/documentation" element={<DocumentationModules />} />
              <Route path="/admin/raci" element={<MatriceRACI />} />
              <Route path="/admin/checklist-production" element={<ChecklistProduction />} />
              <Route path="/admin/liens-lambda" element={<LiensLambda />} />
              <Route path="/admin/parametres-exercice" element={<ParametresExercice />} />
              
              {/* Planification */}
              <Route path="/planification/budget" element={<PlanificationBudgetaire />} />
              <Route path="/planification/physique" element={<PlanificationPhysique />} />
              <Route path="/planification/virements" element={<Virements />} />
              <Route path="/planification/import-export" element={<ImportExport />} />
              <Route path="/planification/documentation-import" element={<DocumentationImport />} />
              <Route path="/planification/historique-imports" element={<HistoriqueImports />} />
              <Route path="/planification/aide-import" element={<AideImportBudget />} />
              
              {/* Exécution Budgétaire */}
              <Route path="/notes" element={<Notes />} />
              <Route path="/notes-sef" element={<NotesSEF />} />
              <Route path="/notes-aef" element={<NotesAEF />} />
              <Route path="/execution/imputation" element={<Imputation />} />
              <Route path="/execution/expression-besoin" element={<ExpressionBesoin />} />
              <Route path="/marches" element={<Marches />} />
              <Route path="/engagements" element={<Engagements />} />
              <Route path="/liquidations" element={<Liquidations />} />
              <Route path="/ordonnancements" element={<Ordonnancements />} />
              <Route path="/reglements" element={<Reglements />} />
              
              {/* États d'exécution */}
              <Route path="/etats-execution" element={<EtatsExecution />} />
              
              {/* Approvisionnement */}
              <Route path="/approvisionnement" element={<Approvisionnement />} />
              
              {/* Trésorerie */}
              <Route path="/tresorerie" element={<GestionTresorerie />} />
              
              {/* Recettes */}
              <Route path="/recettes" element={<DeclarationRecette />} />
              
              {/* Contractualisation */}
              <Route path="/contractualisation/prestataires" element={<Prestataires />} />
              <Route path="/contractualisation/contrats" element={<Contrats />} />
              <Route path="/contractualisation/comptabilite-matiere" element={<ComptabiliteMatiere />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ExerciceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
