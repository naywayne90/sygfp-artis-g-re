import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ExerciceProvider } from "@/contexts/ExerciceContext";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages principales
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import NotesSEF from "./pages/NotesSEF";
import Engagements from "./pages/Engagements";
import Liquidations from "./pages/Liquidations";
import Ordonnancements from "./pages/Ordonnancements";
import Reglements from "./pages/Reglements";
import Marches from "./pages/Marches";
import Recherche from "./pages/Recherche";
import EtatsExecution from "./pages/EtatsExecution";
import SelectExercice from "./pages/SelectExercice";
import NotFound from "./pages/NotFound";

// Pages Admin
import ParametresProgrammatiques from "./pages/admin/ParametresProgrammatiques";
import GestionUtilisateurs from "./pages/admin/GestionUtilisateurs";
import GestionExercices from "./pages/admin/GestionExercices";
import GestionRoles from "./pages/admin/GestionRoles";
import GestionAutorisations from "./pages/admin/GestionAutorisations";
import GestionDelegations from "./pages/admin/GestionDelegations";
import ParametresSysteme from "./pages/admin/ParametresSysteme";

// Pages Planification
import PlanificationBudgetaire from "./pages/planification/PlanificationBudgetaire";
import PlanificationPhysique from "./pages/planification/PlanificationPhysique";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ExerciceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/select-exercice" element={<SelectExercice />} />
            <Route
              path="/*"
              element={
                <AppLayout>
                  <Routes>
                    {/* Accueil */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/recherche" element={<Recherche />} />
                    
                    {/* Administration */}
                    <Route path="/admin/exercices" element={<GestionExercices />} />
                    <Route path="/admin/parametres-programmatiques" element={<ParametresProgrammatiques />} />
                    <Route path="/admin/utilisateurs" element={<GestionUtilisateurs />} />
                    <Route path="/admin/roles" element={<GestionRoles />} />
                    <Route path="/admin/autorisations" element={<GestionAutorisations />} />
                    <Route path="/admin/delegations" element={<GestionDelegations />} />
                    <Route path="/admin/parametres" element={<ParametresSysteme />} />
                    
                    {/* Planification */}
                    <Route path="/planification/budget" element={<PlanificationBudgetaire />} />
                    <Route path="/planification/physique" element={<PlanificationPhysique />} />
                    
                    {/* Exécution Budgétaire */}
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/notes-sef" element={<NotesSEF />} />
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
                  </Routes>
                </AppLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </ExerciceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
