import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ExerciceProvider } from "@/contexts/ExerciceContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoader } from "@/components/shared/PageLoader";

// ============================================
// IMPORTS STATIQUES (Chemin Critique)
// Ces pages sont chargées immédiatement au démarrage
// ============================================
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/auth/LoginPage";
import SelectExercice from "./pages/SelectExercice";
import NoOpenExercise from "./pages/NoOpenExercise";
import NotFound from "./pages/NotFound";

// ============================================
// IMPORTS LAZY (Code-Splitting)
// Ces pages sont chargées à la demande
// ============================================

// Pages principales
const NotesSEF = lazy(() => import("./pages/NotesSEF"));
const NoteSEFDetail = lazy(() => import("./pages/NoteSEFDetail"));
const NotesAEF = lazy(() => import("./pages/NotesAEF"));
const NoteAEFDetail = lazy(() => import("./pages/NoteAEFDetail"));
const Engagements = lazy(() => import("./pages/Engagements"));
const Liquidations = lazy(() => import("./pages/Liquidations"));
const Ordonnancements = lazy(() => import("./pages/Ordonnancements"));
const Reglements = lazy(() => import("./pages/Reglements"));
const Marches = lazy(() => import("./pages/Marches"));
const Recherche = lazy(() => import("./pages/Recherche"));
const EtatsExecution = lazy(() => import("./pages/EtatsExecution"));
const ValidationNotesSEF = lazy(() => import("./pages/ValidationNotesSEF"));
const ValidationNotesAEF = lazy(() => import("./pages/ValidationNotesAEF"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AlertesBudgetaires = lazy(() => import("./pages/AlertesBudgetaires"));
const Alertes = lazy(() => import("./pages/Alertes"));
const MonProfil = lazy(() => import("./pages/MonProfil"));
const WorkflowTasks = lazy(() => import("./pages/WorkflowTasks"));
const NotesDirectionGenerale = lazy(() => import("./pages/NotesDirectionGenerale"));
const ValidationNotesDG = lazy(() => import("./pages/ValidationNotesDG"));
const VerificationNoteDG = lazy(() => import("./pages/VerificationNoteDG"));
const ScanningEngagement = lazy(() => import("./pages/ScanningEngagement"));
const ScanningLiquidation = lazy(() => import("./pages/ScanningLiquidation"));
const TestNonRegression = lazy(() => import("./pages/TestNonRegression"));
const VerifyDocument = lazy(() => import("./pages/VerifyDocument"));

// Pages DG
const NotesAValider = lazy(() => import("./pages/dg/NotesAValider"));
const ValiderNoteDG = lazy(() => import("./pages/dg/ValiderNoteDG"));

// Pages Admin
const ParametresProgrammatiques = lazy(() => import("./pages/admin/ParametresProgrammatiques"));
const GestionUtilisateurs = lazy(() => import("./pages/admin/GestionUtilisateurs"));
const GestionExercices = lazy(() => import("./pages/admin/GestionExercices"));
const GestionRoles = lazy(() => import("./pages/admin/GestionRoles"));
const GestionAutorisations = lazy(() => import("./pages/admin/GestionAutorisations"));
const GestionDelegations = lazy(() => import("./pages/admin/GestionDelegations"));
const ParametresSysteme = lazy(() => import("./pages/admin/ParametresSysteme"));
const JournalAudit = lazy(() => import("./pages/admin/JournalAudit"));
const ArchitectureSYGFP = lazy(() => import("./pages/admin/ArchitectureSYGFP"));
const DictionnaireVariables = lazy(() => import("./pages/admin/DictionnaireVariables"));
const ReferentielCodification = lazy(() => import("./pages/admin/ReferentielCodification"));
const SecteursActivite = lazy(() => import("./pages/admin/SecteursActivite"));
const DocumentationModules = lazy(() => import("./pages/admin/DocumentationModules"));
const MatriceRACI = lazy(() => import("./pages/admin/MatriceRACI"));
const ChecklistProduction = lazy(() => import("./pages/admin/ChecklistProduction"));
const LiensLambda = lazy(() => import("./pages/admin/LiensLambda"));
const ParametresExercice = lazy(() => import("./pages/admin/ParametresExercice"));
const GestionDoublons = lazy(() => import("./pages/admin/GestionDoublons"));
const CompteursReferences = lazy(() => import("./pages/admin/CompteursReferences"));
const ImportBudgetAdmin = lazy(() => import("./pages/admin/ImportBudgetAdmin"));
const CompteBancaires = lazy(() => import("./pages/admin/CompteBancaires"));
const OriginesFonds = lazy(() => import("./pages/admin/OriginesFonds"));
const GestionAnomalies = lazy(() => import("./pages/admin/GestionAnomalies"));
const WorkflowAdmin = lazy(() => import("./pages/admin/WorkflowAdmin"));
const NotificationSettings = lazy(() => import("./pages/admin/NotificationSettings"));
const Interims = lazy(() => import("./pages/admin/Interims"));
const GestionLibellesBudget = lazy(() => import("./pages/admin/GestionLibellesBudget"));

// Pages Planification
const PlanificationBudgetaire = lazy(() => import("./pages/planification/PlanificationBudgetaire"));
const PlanificationPhysique = lazy(() => import("./pages/planification/PlanificationPhysique"));
const StructureBudgetaire = lazy(() => import("./pages/planification/StructureBudgetaire"));
const PlanTravail = lazy(() => import("./pages/planification/PlanTravail"));
const Virements = lazy(() => import("./pages/planification/Virements"));
const ImportExport = lazy(() => import("./pages/planification/ImportExport"));
const DocumentationImport = lazy(() => import("./pages/planification/DocumentationImport"));
const HistoriqueImports = lazy(() => import("./pages/planification/HistoriqueImports"));
const AideImportBudget = lazy(() => import("./pages/planification/AideImportBudget"));
const NotificationsBudgetaires = lazy(() => import("./pages/planification/NotificationsBudgetaires"));
const FeuilleRouteImportPage = lazy(() => import("./pages/planification/FeuilleRouteImportPage"));
const RoadmapSubmissionsPage = lazy(() => import("./pages/planification/RoadmapSubmissionsPage"));

// Pages Execution
const TaskExecutionPage = lazy(() => import("./pages/execution/TaskExecutionPage"));
const ExpressionBesoin = lazy(() => import("./pages/execution/ExpressionBesoin"));
const ImputationPage = lazy(() => import("./pages/execution/ImputationPage"));
const DashboardExecution = lazy(() => import("./pages/execution/DashboardExecution"));
const PassationMarche = lazy(() => import("./pages/execution/PassationMarche"));
const DashboardDGPage = lazy(() => import("./pages/execution/DashboardDGPage"));
const DashboardDirectionPage = lazy(() => import("./pages/execution/DashboardDirectionPage"));
const DashboardDMG = lazy(() => import("./pages/DashboardDMG"));

// Pages Gestion Tâches
const EtatExecutionTachesPage = lazy(() => import("./pages/gestion-taches/EtatExecutionTachesPage"));
const TachesRealiseesPage = lazy(() => import("./pages/gestion-taches/TachesRealiseesPage"));
const TachesDiffereesPage = lazy(() => import("./pages/gestion-taches/TachesDiffereesPage"));
const MajFeuillesRoutePage = lazy(() => import("./pages/gestion-taches/MajFeuillesRoutePage"));

// Pages Approvisionnement
const Approvisionnement = lazy(() => import("./pages/approvisionnement/Approvisionnement"));

// Pages Trésorerie
const GestionTresorerie = lazy(() => import("./pages/tresorerie/GestionTresorerie"));
const ApprovisionnementsBanque = lazy(() => import("./pages/tresorerie/ApprovisionnementsBanque"));
const ApprovisionnementsCaisse = lazy(() => import("./pages/tresorerie/ApprovisionnementsCaisse"));
const MouvementsBanque = lazy(() => import("./pages/tresorerie/MouvementsBanque"));
const MouvementsCaisse = lazy(() => import("./pages/tresorerie/MouvementsCaisse"));

// Pages Recettes
const DeclarationRecette = lazy(() => import("./pages/recettes/DeclarationRecette"));

// Pages Programmatique
const ChargerBudget = lazy(() => import("./pages/programmatique/ChargerBudget"));
const MiseAJourBudget = lazy(() => import("./pages/programmatique/MiseAJourBudget"));
const ListeBudget = lazy(() => import("./pages/programmatique/ListeBudget"));
const Reamenagement = lazy(() => import("./pages/programmatique/Reamenagement"));

// Pages Budget
const ReamenementsImputations = lazy(() => import("./pages/budget/ReamenementsImputations"));

// Pages Contractualisation
const Prestataires = lazy(() => import("./pages/contractualisation/Prestataires"));
const Contrats = lazy(() => import("./pages/contractualisation/Contrats"));
const ComptabiliteMatiere = lazy(() => import("./pages/contractualisation/ComptabiliteMatiere"));

// ============================================
// CONFIGURATION
// ============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Layout wrapper avec Suspense pour le lazy loading
 */
function LayoutWrapper() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
}

/**
 * Wrapper Suspense pour les routes sans layout
 */
function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader variant="spinner" />}>
      {children}
    </Suspense>
  );
}

// ============================================
// APPLICATION
// ============================================

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ExerciceProvider>
        <RBACProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Routes indépendantes (sans layout) */}
              <Route path="/auth" element={<LoginPage />} />
              <Route path="/select-exercice" element={<SelectExercice />} />
              <Route path="/no-open-exercice" element={<NoOpenExercise />} />
              <Route
                path="/verification/note-dg/:token"
                element={
                  <SuspenseWrapper>
                    <VerificationNoteDG />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="/dg/valider/:token"
                element={
                  <SuspenseWrapper>
                    <ValiderNoteDG />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="/verify/:hash"
                element={
                  <SuspenseWrapper>
                    <VerifyDocument />
                  </SuspenseWrapper>
                }
              />

              {/* Routes avec layout */}
              <Route element={<LayoutWrapper />}>
                {/* Accueil */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/recherche" element={<Recherche />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/alertes-budgetaires" element={<AlertesBudgetaires />} />
                <Route path="/alertes" element={<Alertes />} />
                <Route path="/mon-profil" element={<MonProfil />} />
                <Route path="/taches" element={<WorkflowTasks />} />

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
                <Route path="/admin/doublons" element={<GestionDoublons />} />
                <Route path="/admin/compteurs-references" element={<CompteursReferences />} />
                <Route path="/admin/import-budget" element={<ImportBudgetAdmin />} />
                <Route path="/admin/comptes-bancaires" element={<CompteBancaires />} />
                <Route path="/admin/origines-fonds" element={<OriginesFonds />} />
                <Route path="/admin/anomalies" element={<GestionAnomalies />} />
                <Route path="/admin/test-non-regression" element={<TestNonRegression />} />
                <Route path="/admin/workflows" element={<WorkflowAdmin />} />
                <Route path="/admin/notifications" element={<NotificationSettings />} />
                <Route path="/admin/interims" element={<Interims />} />
                <Route path="/admin/libelles-budget" element={<GestionLibellesBudget />} />

                {/* Planification */}
                <Route path="/planification/budget" element={<PlanificationBudgetaire />} />
                <Route path="/planification/physique" element={<PlanificationPhysique />} />
                <Route path="/planification/structure" element={<StructureBudgetaire />} />
                <Route path="/planification/plan-travail" element={<PlanTravail />} />
                <Route path="/planification/virements" element={<Virements />} />
                <Route path="/planification/import-export" element={<ImportExport />} />
                <Route path="/planification/documentation-import" element={<DocumentationImport />} />
                <Route path="/planification/historique-imports" element={<HistoriqueImports />} />
                <Route path="/planification/aide-import" element={<AideImportBudget />} />
                <Route path="/planification/notifications" element={<NotificationsBudgetaires />} />
                <Route path="/planification/feuilles-route" element={<FeuilleRouteImportPage />} />
                <Route path="/planification/soumissions-feuilles-route" element={<RoadmapSubmissionsPage />} />
                <Route path="/planification/execution-physique" element={<TaskExecutionPage />} />
                <Route path="/planification/maj-feuilles-route" element={<MajFeuillesRoutePage />} />
                <Route path="/gestion-taches/etat-execution" element={<EtatExecutionTachesPage />} />
                <Route path="/gestion-taches/taches-realisees" element={<TachesRealiseesPage />} />
                <Route path="/gestion-taches/taches-differees" element={<TachesDiffereesPage />} />

                {/* Exécution Budgétaire */}
                <Route path="/execution/dashboard" element={<DashboardExecution />} />
                <Route path="/execution/dashboard-dg" element={<DashboardDGPage />} />
                <Route path="/execution/dashboard-direction" element={<DashboardDirectionPage />} />
                <Route path="/dashboard-dmg" element={<DashboardDMG />} />

                <Route path="/notes-sef" element={<NotesSEF />} />
                <Route path="/notes-sef/validation" element={<ValidationNotesSEF />} />
                <Route path="/notes-sef/:id" element={<NoteSEFDetail />} />
                <Route path="/notes-aef" element={<NotesAEF />} />
                <Route path="/notes-aef/validation" element={<ValidationNotesAEF />} />
                <Route path="/notes-aef/:id" element={<NoteAEFDetail />} />
                <Route path="/notes-dg" element={<NotesDirectionGenerale />} />
                <Route path="/notes-dg/validation" element={<ValidationNotesDG />} />
                <Route path="/dg/notes-a-valider" element={<NotesAValider />} />
                <Route path="/execution/imputation" element={<ImputationPage />} />
                <Route path="/execution/expression-besoin" element={<ExpressionBesoin />} />
                <Route path="/execution/passation-marche" element={<PassationMarche />} />
                <Route path="/marches" element={<Marches />} />
                <Route path="/engagements" element={<Engagements />} />
                <Route path="/execution/scanning-engagement" element={<ScanningEngagement />} />
                <Route path="/liquidations" element={<Liquidations />} />
                <Route path="/execution/scanning-liquidation" element={<ScanningLiquidation />} />
                <Route path="/ordonnancements" element={<Ordonnancements />} />
                <Route path="/reglements" element={<Reglements />} />

                {/* États d'exécution */}
                <Route path="/etats-execution" element={<EtatsExecution />} />

                {/* Approvisionnement */}
                <Route path="/approvisionnement" element={<Approvisionnement />} />

                {/* Trésorerie */}
                <Route path="/tresorerie" element={<GestionTresorerie />} />
                <Route path="/tresorerie/approvisionnements/banque" element={<ApprovisionnementsBanque />} />
                <Route path="/tresorerie/approvisionnements/caisse" element={<ApprovisionnementsCaisse />} />
                <Route path="/tresorerie/mouvements/banque" element={<MouvementsBanque />} />
                <Route path="/tresorerie/mouvements/caisse" element={<MouvementsCaisse />} />

                {/* Recettes */}
                <Route path="/recettes" element={<DeclarationRecette />} />

                {/* Programmatique */}
                <Route path="/programmatique/charger-budget" element={<ChargerBudget />} />
                <Route path="/programmatique/mise-a-jour" element={<MiseAJourBudget />} />
                <Route path="/programmatique/liste-budget" element={<ListeBudget />} />
                <Route path="/programmatique/reamenagement" element={<Reamenagement />} />

                {/* Budget - Réaménagements par imputations */}
                <Route path="/budget/reamenagements-imputations" element={<ReamenementsImputations />} />

                {/* Contractualisation */}
                <Route path="/contractualisation/prestataires" element={<Prestataires />} />
                <Route path="/contractualisation/contrats" element={<Contrats />} />
                <Route path="/contractualisation/comptabilite-matiere" element={<ComptabiliteMatiere />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RBACProvider>
      </ExerciceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
