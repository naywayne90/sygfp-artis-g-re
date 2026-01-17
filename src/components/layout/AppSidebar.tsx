import {
  Search,
  FileText,
  ShoppingCart,
  CreditCard,
  Receipt,
  FileCheck,
  Wallet,
  BarChart3,
  Home,
  Settings,
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
  Users,
  Target,
  Calendar,
  Briefcase,
  ClipboardList,
  Tag,
  Package,
  Landmark,
  Building2,
  FileSignature,
  Archive,
  DollarSign,
  Truck,
  Shield,
  Lock,
  UserCog,
  BookOpen,
  Hash,
  Database,
  Layers,
  ArrowRightLeft,
  FileUp,
  History,
  Cog,
  FileEdit,
  CircleDollarSign,
  HandCoins,
  FileOutput,
  Banknote,
  TrendingUp,
  Copy,
  Activity,
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
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/hooks/useDashboardStats";

// ============================================
// NOUVELLE ORGANISATION DU MENU
// ============================================

// PARAMÉTRAGE (fusion Administration + Référentiels)
const parametrageItems = [
  { title: "Exercices Budgétaires", url: "/admin/exercices", icon: Calendar },
  { title: "Paramètres Programmatiques", url: "/admin/parametres-programmatiques", icon: Target },
  { title: "Architecture SYGFP", url: "/admin/architecture", icon: Database },
  { title: "Règles de Codification", url: "/admin/codification", icon: Hash },
  { title: "Secteurs d'Activité", url: "/admin/secteurs-activite", icon: Layers },
  { title: "Dictionnaire Variables", url: "/admin/dictionnaire", icon: BookOpen },
];

const utilisateursItems = [
  { title: "Gestion Utilisateurs", url: "/admin/utilisateurs", icon: Users },
  { title: "Profils & Rôles", url: "/admin/roles", icon: Shield },
  { title: "Autorisations", url: "/admin/autorisations", icon: Lock },
  { title: "Délégations", url: "/admin/delegations", icon: UserCog },
];

const systemeItems = [
  { title: "Paramètres Système", url: "/admin/parametres", icon: Settings },
  { title: "Journal d'Audit", url: "/admin/journal-audit", icon: ClipboardList },
];

// BUDGET (fusion Planification Budget + Physique)
const budgetItems = [
  { title: "Structure Budgétaire", url: "/planification/structure", icon: Wallet },
  { title: "Plan de Travail", url: "/planification/plan-travail", icon: ClipboardList },
  { title: "Virements & Ajustements", url: "/planification/virements", icon: ArrowRightLeft },
  { title: "Import / Export", url: "/planification/import-export", icon: FileUp },
  { title: "Historique Imports", url: "/planification/historique-imports", icon: History },
  { title: "Import Budget (Admin)", url: "/admin/import-budget", icon: Database },
];

// CHAÎNE DE LA DÉPENSE (ordre logique strict avec numéros)
const chaineDepenseItems = [
  { title: "1. Notes SEF", url: "/notes-sef", icon: FileText, step: 1, description: "Sans Engagement Financier" },
  { title: "2. Notes AEF", url: "/notes-aef", icon: FileEdit, step: 2, description: "Avec Engagement Financier" },
  { title: "3. Imputation", url: "/execution/imputation", icon: Tag, step: 3, description: "Imputation budgétaire" },
  { title: "4. Expression Besoin", url: "/execution/expression-besoin", icon: Briefcase, step: 4, description: "Formalisation du besoin" },
  { title: "5. Passation Marché", url: "/marches", icon: ShoppingCart, step: 5, description: "Si montant > seuil" },
  { title: "6. Engagement", url: "/engagements", icon: CreditCard, step: 6, description: "Réservation crédits" },
  { title: "7. Liquidation", url: "/liquidations", icon: Receipt, step: 7, description: "Constatation service fait" },
  { title: "8. Ordonnancement", url: "/ordonnancements", icon: FileCheck, step: 8, description: "Ordre de paiement" },
  { title: "9. Règlement", url: "/reglements", icon: Banknote, step: 9, description: "Paiement effectif" },
];

// PARTENAIRES
const partenairesItems = [
  { title: "Prestataires", url: "/contractualisation/prestataires", icon: Building2 },
  { title: "Contrats", url: "/contractualisation/contrats", icon: FileSignature },
];

// GESTION COMPLÉMENTAIRE
const gestionItems = [
  { title: "Approvisionnement", url: "/approvisionnement", icon: Truck },
  { title: "Trésorerie", url: "/tresorerie", icon: Landmark },
  { title: "Recettes", url: "/recettes", icon: DollarSign },
  { title: "Comptabilité Matière", url: "/contractualisation/comptabilite-matiere", icon: Archive },
];

// EXÉCUTION BUDGÉTAIRE (nouveau groupe avec badges)
const executionItems = [
  { title: "Tableau de bord", url: "/execution/dashboard", icon: TrendingUp, badgeKey: null },
  { title: "Engagements", url: "/engagements", icon: CreditCard, badgeKey: "engagementsAValider" },
  { title: "Liquidations", url: "/liquidations", icon: Receipt, badgeKey: "liquidationsAValider" },
  { title: "Ordonnancements", url: "/ordonnancements", icon: FileCheck, badgeKey: "ordonnancementsAValider" },
  { title: "Règlements", url: "/reglements", icon: Banknote, badgeKey: null },
];

// RAPPORTS
const rapportsItems = [
  { title: "États d'exécution", url: "/etats-execution", icon: BarChart3 },
  { title: "Alertes Budgétaires", url: "/alertes-budgetaires", icon: Target },
];

// OUTILS ADMIN
const outilsAdminItems = [
  { title: "Gestion Doublons", url: "/admin/doublons", icon: Copy },
  { title: "Compteurs Références", url: "/admin/compteurs-references", icon: Hash },
];

interface MenuSectionProps {
  title: string;
  items: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[];
  collapsed: boolean;
  isActive: (path: string) => boolean;
}

function MenuSection({ title, items, collapsed, isActive }: MenuSectionProps) {
  return (
    <SidebarGroup className="mt-2">
      {!collapsed && (
        <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] font-semibold tracking-wider mb-1 px-3">
          {title}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={item.title}
              >
                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-sm",
                    isActive(item.url)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

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

  const isChaineActive = chaineDepenseItems.some(item => isActive(item.url));
  const isExecutionActive = executionItems.some(item => isActive(item.url));
  const isParametrageActive = [...parametrageItems, ...utilisateursItems, ...systemeItems, ...outilsAdminItems].some(item => isActive(item.url));

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
                      tooltip="8 étapes du flux de dépense"
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
                            9 étapes
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
                      {chaineDepenseItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                            <NavLink
                              to={item.url}
                              className={cn(
                                "flex items-center gap-2 text-sm py-1.5",
                                isActive(item.url) && "text-sidebar-primary font-medium"
                              )}
                            >
                              <span className={cn(
                                "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                                isActive(item.url) 
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                                  : "bg-sidebar-accent text-sidebar-foreground"
                              )}>
                                {item.step}
                              </span>
                              <span>{item.title.replace(/^\d+\.\s/, '')}</span>
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
          items={budgetItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* ========== PARTENAIRES ========== */}
        <MenuSection 
          title="Partenaires" 
          items={partenairesItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* ========== GESTION COMPLÉMENTAIRE ========== */}
        <MenuSection 
          title="Gestion" 
          items={gestionItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* ========== EXÉCUTION BUDGÉTAIRE (Nouveau groupe extensible) ========== */}
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
                          {stats && (stats.engagementsAValider + stats.liquidationsAValider + stats.ordonnancementsAValider) > 0 && (
                            <span className="inline-flex items-center text-[10px] px-1.5 py-0 h-5 bg-destructive/80 text-destructive-foreground rounded-md font-medium">
                              {stats.engagementsAValider + stats.liquidationsAValider + stats.ordonnancementsAValider}
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
                      {executionItems.map((item) => {
                        const badgeCount = item.badgeKey && stats ? (stats as any)[item.badgeKey] : 0;
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                              <NavLink
                                to={item.url}
                                className={cn(
                                  "flex items-center justify-between gap-2 text-sm py-1.5",
                                  isActive(item.url) && "text-sidebar-primary font-medium"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <item.icon className="h-3.5 w-3.5" />
                                  <span>{item.title}</span>
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
          items={rapportsItems} 
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
                      {/* Référentiels */}
                      <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
                        Référentiels
                      </div>
                      {parametrageItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                            <NavLink
                              to={item.url}
                              className={cn(
                                "flex items-center gap-2 text-sm py-1.5",
                                isActive(item.url) && "text-sidebar-primary font-medium"
                              )}
                            >
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      
                      {/* Utilisateurs */}
                      <div className="px-2 py-1 mt-2 text-[9px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
                        Utilisateurs
                      </div>
                      {utilisateursItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                            <NavLink
                              to={item.url}
                              className={cn(
                                "flex items-center gap-2 text-sm py-1.5",
                                isActive(item.url) && "text-sidebar-primary font-medium"
                              )}
                            >
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      
                      {/* Système */}
                      <div className="px-2 py-1 mt-2 text-[9px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
                        Système
                      </div>
                      {systemeItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                            <NavLink
                              to={item.url}
                              className={cn(
                                "flex items-center gap-2 text-sm py-1.5",
                                isActive(item.url) && "text-sidebar-primary font-medium"
                              )}
                            >
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      
                      {/* Outils */}
                      <div className="px-2 py-1 mt-2 text-[9px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
                        Outils
                      </div>
                      {outilsAdminItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                            <NavLink
                              to={item.url}
                              className={cn(
                                "flex items-center gap-2 text-sm py-1.5",
                                isActive(item.url) && "text-sidebar-primary font-medium"
                              )}
                            >
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.title}</span>
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
