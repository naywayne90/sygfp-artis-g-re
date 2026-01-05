import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ExerciceProvider } from "@/contexts/ExerciceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Engagements from "./pages/Engagements";
import Liquidations from "./pages/Liquidations";
import Ordonnancements from "./pages/Ordonnancements";
import Reglements from "./pages/Reglements";
import Marches from "./pages/Marches";
import Recherche from "./pages/Recherche";
import EtatsExecution from "./pages/EtatsExecution";
import SelectExercice from "./pages/SelectExercice";
import NotFound from "./pages/NotFound";
import ParametresProgrammatiques from "./pages/admin/ParametresProgrammatiques";
import GestionUtilisateurs from "./pages/admin/GestionUtilisateurs";

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
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/engagements" element={<Engagements />} />
                    <Route path="/liquidations" element={<Liquidations />} />
                    <Route path="/ordonnancements" element={<Ordonnancements />} />
                    <Route path="/reglements" element={<Reglements />} />
                    <Route path="/marches" element={<Marches />} />
                    <Route path="/recherche" element={<Recherche />} />
                    <Route path="/etats-execution" element={<EtatsExecution />} />
                    {/* Admin routes */}
                    <Route path="/admin/parametres-programmatiques" element={<ParametresProgrammatiques />} />
                    <Route path="/admin/utilisateurs" element={<GestionUtilisateurs />} />
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
