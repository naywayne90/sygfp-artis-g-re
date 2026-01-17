import {
  ChevronDown,
  ChevronRight,
  Home,
  Search,
  Settings,
  LogOut,
  User,
  Cog,
  CircleDollarSign,
  HandCoins,
  Activity,
  TrendingUp,
} from "lucide-react";
import logoArti from "@/assets/logo-arti.jpg";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/useDashboardStats";

// Import du registre centralisé
import {
  MODULES_REGISTRY,
  getRootModules,
  getChildModules,
  getSubSections,
  getModulesBySubSection,
  type ModuleConfig,
} from "@/config/modules.registry";

// ============================================
// COMPOSANT MENU SECTION SIMPLE
// ============================================

interface MenuSectionProps {
  title: string;
  modules: ModuleConfig[];
  collapsed: boolean;
  isActive: (path: string) => boolean;
}

function MenuSection({ title, modules, collapsed, isActive }: MenuSectionProps) {
  if (modules.length === 0) return null;

  return (
    <SidebarGroup className="mt-2">
      {!collapsed && (
        <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] font-semibold tracking-wider mb-1 px-3">
          {title}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {modules.map((module) => (
            <SidebarMenuItem key={module.id}>
              <SidebarMenuButton
                asChild
                isActive={module.route ? isActive(module.route) : false}
                tooltip={module.name}
              >
                <NavLink
                  to={module.route || "#"}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-sm",
                    module.route && isActive(module.route)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <module.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{module.name}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [chaineOpen, setChaineOpen] = useState(true);
  const [executionOpen, setExecutionOpen] = useState(true);
  const [parametrageOpen, setParametrageOpen] = useState(false);

  // Fetch stats for badges
  const { data: stats } = useDashboardStats();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path.includes("?")) {
      return location.pathname + location.search === path;
    }
    return location.pathname.startsWith(path);
  };

  // Récupérer les modules depuis le registre
  const chaineDepenseModules = getChildModules('chaine-depense');
  const budgetModules = getChildModules('budget');
  const partenairesModules = getChildModules('partenaires');
  const gestionModules = getChildModules('gestion');
  const executionModules = getChildModules('execution-budgetaire');
  const rapportsModules = getChildModules('rapports');
  const parametrageSubSections = getSubSections('parametrage');

  const isChaineActive = chaineDepenseModules.some(m => m.route && isActive(m.route));
  const isExecutionActive = executionModules.some(m => m.route && isActive(m.route));
  const isParametrageActive = getChildModules('parametrage').some(m => m.route && isActive(m.route));

  // Calcul du total des badges
  const totalBadgeCount = stats
    ? (stats.engagementsAValider || 0) + (stats.liquidationsAValider || 0) + (stats.ordonnancementsAValider || 0)
    : 0;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 items-center justify-center rounded-lg bg-white/95 px-2 shadow-sm">
            <img
              src={logoArti}
              alt="ARTI"
              className="h-7 w-auto object-contain"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground text-lg tracking-tight">SYGFP</span>
              <span className="text-[9px] text-sidebar-primary font-medium uppercase tracking-wider">Gestion Financière</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 overflow-y-auto">
        {/* ========== ACCUEIL ========== */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/")}
                  tooltip="Tableau de bord"
                >
                  <NavLink
                    to="/"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-sm",
                      isActive("/")
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Home className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Tableau de bord</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/recherche")}
                  tooltip="Recherche Dossier"
                >
                  <NavLink
                    to="/recherche"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-sm font-medium",
                      isActive("/recherche")
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Search className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Recherche Dossier</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ========== CHAÎNE DE LA DÉPENSE (Section principale) ========== */}
        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-primary uppercase text-[10px] font-bold tracking-wider mb-1 px-3 flex items-center gap-2">
              <CircleDollarSign className="h-3.5 w-3.5" />
              Chaîne de la Dépense
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                open={chaineOpen}
                onOpenChange={setChaineOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="9 étapes du flux de dépense"
                      className={cn(
                        "w-full justify-between",
                        isChaineActive && "bg-sidebar-accent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <HandCoins className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="text-sm font-medium">Flux de dépense</span>
                        )}
                      </div>
                      {!collapsed && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center text-[10px] px-1.5 py-0 h-5 bg-sidebar-primary/20 text-sidebar-primary-foreground border border-sidebar-primary/40 rounded-md font-medium">
                            {chaineDepenseModules.length} étapes
                          </span>
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            chaineOpen && "rotate-90"
                          )} />
                        </div>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {chaineDepenseModules.map((module) => (
                        <SidebarMenuSubItem key={module.id}>
                          <SidebarMenuSubButton asChild isActive={module.route ? isActive(module.route) : false}>
                            <NavLink
                              to={module.route || "#"}
                              className={cn(
                                "flex items-center gap-2 text-sm py-1.5",
                                module.route && isActive(module.route) && "text-sidebar-primary font-medium"
                              )}
                            >
                              <span className={cn(
                                "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                                module.route && isActive(module.route)
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "bg-sidebar-accent text-sidebar-foreground"
                              )}>
                                {module.step}
                              </span>
                              <span>{module.name}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ========== BUDGET ========== */}
        <MenuSection
          title="Budget"
          modules={budgetModules}
          collapsed={collapsed}
          isActive={isActive}
        />

        {/* ========== PARTENAIRES ========== */}
        <MenuSection
          title="Partenaires"
          modules={partenairesModules}
          collapsed={collapsed}
          isActive={isActive}
        />

        {/* ========== GESTION COMPLÉMENTAIRE ========== */}
        <MenuSection
          title="Gestion"
          modules={gestionModules}
          collapsed={collapsed}
          isActive={isActive}
        />

        {/* ========== EXÉCUTION BUDGÉTAIRE (Groupe extensible) ========== */}
        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-primary uppercase text-[10px] font-bold tracking-wider mb-1 px-3 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              Exécution Budgétaire
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                open={executionOpen}
                onOpenChange={setExecutionOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Suivi de l'exécution"
                      className={cn(
                        "w-full justify-between",
                        isExecutionActive && "bg-sidebar-accent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="text-sm font-medium">Suivi Exécution</span>
                        )}
                      </div>
                      {!collapsed && (
                        <div className="flex items-center gap-2">
                          {totalBadgeCount > 0 && (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0 h-5 bg-destructive/80 text-destructive-foreground rounded-md font-medium">
                              {totalBadgeCount}
                            </span>
                          )}
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            executionOpen && "rotate-90"
                          )} />
                        </div>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {executionModules.map((module) => {
                        const badgeCount = module.badgeKey && stats ? (stats as any)[module.badgeKey] : 0;
                        return (
                          <SidebarMenuSubItem key={module.id}>
                            <SidebarMenuSubButton asChild isActive={module.route ? isActive(module.route) : false}>
                              <NavLink
                                to={module.route || "#"}
                                className={cn(
                                  "flex items-center justify-between gap-2 text-sm py-1.5",
                                  module.route && isActive(module.route) && "text-sidebar-primary font-medium"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <module.icon className="h-3.5 w-3.5" />
                                  <span>{module.name}</span>
                                </div>
                                {badgeCount > 0 && (
                                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold bg-warning/20 text-warning-foreground dark:text-warning">
                                    {badgeCount > 99 ? "99+" : badgeCount}
                                  </span>
                                )}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ========== RAPPORTS ========== */}
        <MenuSection
          title="Rapports"
          modules={rapportsModules}
          collapsed={collapsed}
          isActive={isActive}
        />

        {/* ========== PARAMÉTRAGE (Collapsible) ========== */}
        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] font-semibold tracking-wider mb-1 px-3 flex items-center gap-2">
              <Cog className="h-3.5 w-3.5" />
              Paramétrage
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                open={parametrageOpen}
                onOpenChange={setParametrageOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Configuration système"
                      className={cn(
                        "w-full justify-between",
                        isParametrageActive && "bg-sidebar-accent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="text-sm">Configuration</span>}
                      </div>
                      {!collapsed && (
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
                          parametrageOpen && "rotate-90"
                        )} />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {parametrageSubSections.map((section) => {
                        const sectionModules = getModulesBySubSection('parametrage', section);
                        return (
                          <div key={section}>
                            <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
                              {section}
                            </div>
                            {sectionModules.map((module) => (
                              <SidebarMenuSubItem key={module.id}>
                                <SidebarMenuSubButton asChild isActive={module.route ? isActive(module.route) : false}>
                                  <NavLink
                                    to={module.route || "#"}
                                    className={cn(
                                      "flex items-center gap-2 text-sm py-1.5",
                                      module.route && isActive(module.route) && "text-sidebar-primary font-medium"
                                    )}
                                  >
                                    <module.icon className="h-3.5 w-3.5" />
                                    <span>{module.name}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </div>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  U
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex flex-1 flex-col text-left">
                    <span className="text-sm font-medium">Utilisateur</span>
                    <span className="text-xs text-sidebar-foreground/70">Invité</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/70" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/mon-profil")}>
              <User className="mr-2 h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/parametres")}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  toast.error("Erreur lors de la déconnexion");
                } else {
                  toast.success("Déconnexion réussie");
                  navigate("/");
                }
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
