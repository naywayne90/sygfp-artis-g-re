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

// 1. Administration & Paramétrage
const adminItems = [
  { title: "Exercices Budgétaires", url: "/admin/exercices", icon: Calendar },
  { title: "Paramètres Programmatiques", url: "/admin/parametres-programmatiques", icon: Target },
  { title: "Gestion Utilisateurs", url: "/admin/utilisateurs", icon: Users },
  { title: "Profils & Rôles", url: "/admin/roles", icon: Shield },
  { title: "Autorisations", url: "/admin/autorisations", icon: Lock },
  { title: "Délégations", url: "/admin/delegations", icon: UserCog },
  { title: "Journal d'Audit", url: "/admin/journal-audit", icon: ClipboardList },
  { title: "Paramètres Système", url: "/admin/parametres", icon: Settings },
];

// Référentiels & Modélisation (sous Administration)
const referentielItems = [
  { title: "Architecture SYGFP", url: "/admin/architecture", icon: Database },
  { title: "Dictionnaire Variables", url: "/admin/dictionnaire", icon: BookOpen },
  { title: "Règles de Codification", url: "/admin/codification", icon: Hash },
  { title: "Secteurs d'Activité", url: "/admin/secteurs-activite", icon: Layers },
];

// 2. Planification Budgétaire
const planificationBudgetItems = [
  { title: "Structure Budgétaire", url: "/planification/budget", icon: Wallet },
  { title: "Virements & Ajustements", url: "/planification/virements", icon: ArrowRightLeft },
  { title: "Import / Export", url: "/planification/import-export", icon: FileUp },
  { title: "Historique Imports", url: "/planification/historique-imports", icon: History },
];

// 3. Planification Exécution Physique
const planificationPhysiqueItems = [
  { title: "Plan de Travail", url: "/planification/physique", icon: ClipboardList },
];

// 4. Exécution Budgétaire - Sous-menus
const executionItems = [
  { title: "Notes AEF", url: "/notes-aef", icon: FileText },
  { title: "Notes SEF", url: "/notes-sef", icon: FileText },
  { title: "Imputation", url: "/execution/imputation", icon: Tag },
  { title: "Expression de Besoin", url: "/execution/expression-besoin", icon: Briefcase },
  { title: "Passation Marché", url: "/marches", icon: ShoppingCart },
  { title: "Engagement", url: "/engagements", icon: CreditCard },
  { title: "Liquidation", url: "/liquidations", icon: Receipt },
  { title: "Ordonnancement", url: "/ordonnancements", icon: FileCheck },
  { title: "Règlement", url: "/reglements", icon: Wallet },
];

// 5. États d'Exécution
const etatsItems = [
  { title: "États d'exécution", url: "/etats-execution", icon: BarChart3 },
];

// 6. Approvisionnement
const approvisionnementItems = [
  { title: "Commandes & Livraisons", url: "/approvisionnement", icon: Truck },
];

// 7. Gestion de la Trésorerie
const tresorerieItems = [
  { title: "Trésorerie", url: "/tresorerie", icon: Landmark },
];

// 8. Déclaration Recette
const recettesItems = [
  { title: "Déclaration Recettes", url: "/recettes", icon: DollarSign },
];

// Compléments
const complementsItems = [
  { title: "Prestataires", url: "/contractualisation/prestataires", icon: Building2 },
  { title: "Contrats", url: "/contractualisation/contrats", icon: FileSignature },
  { title: "Comptabilité Matière", url: "/contractualisation/comptabilite-matiere", icon: Archive },
];

interface MenuSectionProps {
  title: string;
  items: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[];
  collapsed: boolean;
  isActive: (path: string) => boolean;
}

function MenuSection({ title, items, collapsed, isActive }: MenuSectionProps) {
  return (
    <SidebarGroup className="mt-3">
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
  const [executionOpen, setExecutionOpen] = useState(true);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path.includes("?")) {
      return location.pathname + location.search === path;
    }
    return location.pathname.startsWith(path);
  };

  const isExecutionActive = executionItems.some(item => isActive(item.url));

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
        {/* Accueil */}
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
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-sm",
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

        {/* 1. Administration */}
        <MenuSection 
          title="Administration" 
          items={adminItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* Référentiels & Modélisation */}
        <MenuSection 
          title="Référentiels" 
          items={referentielItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* 2. Planification Budgétaire */}
        <MenuSection 
          title="Planification Budget" 
          items={planificationBudgetItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* 3. Planification Physique */}
        <MenuSection 
          title="Planification Physique" 
          items={planificationPhysiqueItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* 4. Exécution Budgétaire (avec sous-menus) */}
        <SidebarGroup className="mt-3">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] font-semibold tracking-wider mb-1 px-3">
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
                      tooltip="Chaîne de la dépense"
                      className={cn(
                        "w-full justify-between",
                        isExecutionActive && "bg-sidebar-accent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="text-sm">Chaîne de la dépense</span>}
                      </div>
                      {!collapsed && (
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
                          executionOpen && "rotate-90"
                        )} />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {executionItems.map((item) => (
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

        {/* 5. États d'Exécution */}
        <MenuSection 
          title="Rapports" 
          items={etatsItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* 6. Approvisionnement */}
        <MenuSection 
          title="Approvisionnement" 
          items={approvisionnementItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* 7. Trésorerie */}
        <MenuSection 
          title="Trésorerie" 
          items={tresorerieItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* 8. Recettes */}
        <MenuSection 
          title="Recettes" 
          items={recettesItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />

        {/* Compléments */}
        <MenuSection 
          title="Contractualisation" 
          items={complementsItems} 
          collapsed={collapsed} 
          isActive={isActive} 
        />
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
