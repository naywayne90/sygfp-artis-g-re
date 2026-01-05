import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
