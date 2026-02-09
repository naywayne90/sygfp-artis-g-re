/**
 * Sidebar V2 - Navigation principale sombre et structurée
 * 6 sections: Top Items, Chaine Depense, Budget, Suivi & Pilotage, Gestion, Administration
 * Badges compteurs temps réel, menus regroupés sans doublons
 */
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Home,
  Search,
  FileText,
  FileEdit,
  Tag,
  Briefcase,
  ShoppingCart,
  CreditCard,
  Receipt,
  FileCheck,
  Banknote,
  Wallet,
  ClipboardList,
  ArrowRightLeft,
  FileUp,
  Building2,
  FileSignature,
  Truck,
  Landmark,
  DollarSign,
  Archive,
  BarChart3,
  Target,
  Calendar,
  Database,
  Hash,
  Layers,
  BookOpen,
  Users,
  Shield,
  Lock,
  UserCog,
  Settings,
  Cog,
  Copy,
  ChevronRight,
  CircleDollarSign,
  AlertTriangle,
  ScanLine,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { useRBAC } from '@/contexts/RBACContext';
import logoArti from '@/assets/logo-arti.jpg';

// ============================================
// CONFIGURATION DES MENUS (sans doublons)
// ============================================

const CHAINE_DEPENSE = [
  {
    step: 1,
    title: 'Notes SEF',
    url: '/notes-sef',
    icon: FileText,
    badgeKey: 'sefAValider' as const,
  },
  {
    step: 2,
    title: 'Notes AEF',
    url: '/notes-aef',
    icon: FileEdit,
    badgeKey: 'aefAValider' as const,
  },
  {
    step: 3,
    title: 'Imputation',
    url: '/execution/imputation',
    icon: Tag,
    badgeKey: 'imputationsATraiter' as const,
  },
  {
    step: 4,
    title: 'Expression Besoin',
    url: '/execution/expression-besoin',
    icon: Briefcase,
    badgeKey: 'ebAValider' as const,
  },
  {
    step: 5,
    title: 'Passation Marché',
    url: '/marches',
    icon: ShoppingCart,
    badgeKey: 'marchesEnCours' as const,
  },
  {
    step: 6,
    title: 'Engagement',
    url: '/engagements',
    icon: CreditCard,
    badgeKey: 'engagementsAValider' as const,
  },
  {
    step: 7,
    title: 'Liquidation',
    url: '/liquidations',
    icon: Receipt,
    badgeKey: 'liquidationsAValider' as const,
  },
  {
    step: 8,
    title: 'Ordonnancement',
    url: '/ordonnancements',
    icon: FileCheck,
    badgeKey: 'ordoAValider' as const,
  },
  {
    step: 9,
    title: 'Règlement',
    url: '/reglements',
    icon: Banknote,
    badgeKey: 'reglementsATraiter' as const,
  },
];

const BUDGET_ITEMS = [
  { title: 'Structure Budgétaire', url: '/planification/structure', icon: Wallet },
  { title: 'Plan de Travail', url: '/planification/plan-travail', icon: ClipboardList },
  {
    title: 'Virements',
    url: '/planification/virements',
    icon: ArrowRightLeft,
    badgeKey: 'virementsEnAttente' as const,
  },
  { title: 'Réaménagements', url: '/budget/reamenagements-imputations', icon: ArrowRightLeft },
  { title: 'Import / Export', url: '/planification/import-export', icon: FileUp },
];

const SUIVI_PILOTAGE_ITEMS = [
  { title: 'Tableau Financier', url: '/dashboard-financier', icon: BarChart3 },
  { title: 'Ma Direction', url: '/planification/roadmap-direction', icon: Building2 },
  { title: "États d'Exécution", url: '/etats-execution', icon: BarChart3 },
  { title: 'Alertes Budgétaires', url: '/alertes-budgetaires', icon: AlertTriangle },
  { title: 'Scan. Engagement', url: '/execution/scanning-engagement', icon: ScanLine },
  { title: 'Scan. Liquidation', url: '/execution/scanning-liquidation', icon: ScanLine },
];

const GESTION_ITEMS = [
  { title: 'Prestataires', url: '/contractualisation/prestataires', icon: Building2 },
  { title: 'Contrats', url: '/contractualisation/contrats', icon: FileSignature },
  { title: 'Approvisionnement', url: '/approvisionnement', icon: Truck },
  { title: 'Trésorerie', url: '/tresorerie', icon: Landmark },
  { title: 'Recettes', url: '/recettes', icon: DollarSign },
  { title: 'Comptabilité Matière', url: '/contractualisation/comptabilite-matiere', icon: Archive },
  { title: 'Espace Direction', url: '/espace-direction', icon: BookOpen },
];

const PARAMETRAGE_REFERENTIELS = [
  { title: 'Exercices', url: '/admin/exercices', icon: Calendar },
  { title: 'Paramètres Programmatiques', url: '/admin/parametres-programmatiques', icon: Target },
  { title: 'Architecture SYGFP', url: '/admin/architecture', icon: Database },
  { title: 'Codification', url: '/admin/codification', icon: Hash },
  { title: "Secteurs d'Activité", url: '/admin/secteurs-activite', icon: Layers },
  { title: 'Dictionnaire Variables', url: '/admin/dictionnaire', icon: BookOpen },
];

const PARAMETRAGE_UTILISATEURS = [
  { title: 'Utilisateurs', url: '/admin/utilisateurs', icon: Users },
  { title: 'Profils & Rôles', url: '/admin/roles', icon: Shield },
  { title: 'Autorisations', url: '/admin/autorisations', icon: Lock },
  { title: 'Délégations', url: '/admin/delegations', icon: UserCog },
];

const PARAMETRAGE_SYSTEME = [
  { title: 'Paramètres Système', url: '/admin/parametres', icon: Settings },
  { title: "Journal d'Audit", url: '/admin/journal-audit', icon: ClipboardList },
  { title: 'Gestion Doublons', url: '/admin/doublons', icon: Copy },
  { title: 'Compteurs Références', url: '/admin/compteurs-references', icon: Hash },
];

// ============================================
// COMPOSANTS
// ============================================

interface BadgeCounterProps {
  count: number;
  variant?: 'default' | 'warning' | 'success';
}

function BadgeCounter({ count, variant = 'warning' }: BadgeCounterProps) {
  if (count <= 0) return null;

  const variantClasses = {
    default: 'bg-sidebar-primary/20 text-sidebar-primary-foreground',
    warning: 'bg-warning/80 text-warning-foreground',
    success: 'bg-success/80 text-success-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold',
        variantClasses[variant]
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function SidebarV2() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { data: badges } = useSidebarBadges();
  const { isAdmin } = useRBAC();

  const [chaineOpen, setChaineOpen] = useState(true);
  const [parametrageOpen, setParametrageOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isChaineActive = CHAINE_DEPENSE.some((item) => isActive(item.url));
  const isParametrageActive = [
    ...PARAMETRAGE_REFERENTIELS,
    ...PARAMETRAGE_UTILISATEURS,
    ...PARAMETRAGE_SYSTEME,
  ].some((item) => isActive(item.url));

  // Total badges chaîne de dépense
  const chaineTotalBadge = badges
    ? CHAINE_DEPENSE.reduce(
        (sum, item) => sum + (item.badgeKey ? badges[item.badgeKey] || 0 : 0),
        0
      )
    : 0;

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar">
      {/* Header avec logo */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 items-center justify-center rounded-lg bg-white/95 px-2 shadow-sm">
            <img src={logoArti} alt="ARTI" className="h-7 w-auto object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground text-lg tracking-tight">
                SYGFP
              </span>
              <span className="text-[9px] text-sidebar-primary font-medium uppercase tracking-wider">
                Gestion Financière
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 overflow-y-auto">
        {/* ========== ACCUEIL + RECHERCHE (Top Items) ========== */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/')} tooltip="Accueil">
                  <NavLink
                    to="/"
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-sm',
                      isActive('/')
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <Home className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Accueil</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/recherche')}
                  tooltip="Recherche Dossier"
                >
                  <NavLink
                    to="/recherche"
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-sm font-medium',
                      isActive('/recherche')
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
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

        {/* ========== SECTION 1: CHAÎNE DE LA DÉPENSE ========== */}
        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-primary uppercase text-[10px] font-bold tracking-wider mb-1 px-3 flex items-center gap-2">
              <CircleDollarSign className="h-3.5 w-3.5" />
              Chaîne de la Dépense
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible open={chaineOpen} onOpenChange={setChaineOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="9 étapes du flux"
                      className={cn(
                        'w-full justify-between',
                        isChaineActive && 'bg-sidebar-accent'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <CircleDollarSign className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">Flux de dépense</span>}
                      </div>
                      {!collapsed && (
                        <div className="flex items-center gap-2">
                          {chaineTotalBadge > 0 ? (
                            <BadgeCounter count={chaineTotalBadge} />
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 bg-sidebar-primary/20 text-sidebar-primary-foreground rounded-md font-medium">
                              9 étapes
                            </span>
                          )}
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 transition-transform',
                              chaineOpen && 'rotate-90'
                            )}
                          />
                        </div>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="gap-2 py-1">
                      {CHAINE_DEPENSE.map((item) => {
                        const badgeCount = item.badgeKey && badges ? badges[item.badgeKey] : 0;
                        return (
                          <SidebarMenuSubItem key={item.url} className="mb-0.5">
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(item.url)}
                              className="min-h-8 h-auto"
                            >
                              <NavLink
                                to={item.url}
                                className={cn(
                                  'flex items-center justify-between gap-2 text-sm py-2',
                                  isActive(item.url) && 'text-sidebar-primary font-medium'
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={cn(
                                      'flex items-center justify-center w-5 h-5 shrink-0 rounded-full text-[10px] font-bold',
                                      isActive(item.url)
                                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                        : 'bg-sidebar-accent text-sidebar-foreground'
                                    )}
                                  >
                                    {item.step}
                                  </span>
                                  <span className="truncate">{item.title}</span>
                                </div>
                                <BadgeCounter count={badgeCount} />
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

        {/* ========== SECTION 2: BUDGET ========== */}
        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] font-semibold tracking-wider mb-1 px-3">
              Budget
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {BUDGET_ITEMS.map((item) => {
                const itemWithBadge = item as typeof item & {
                  badgeKey?: keyof NonNullable<typeof badges>;
                };
                const badgeCount =
                  itemWithBadge.badgeKey && badges ? badges[itemWithBadge.badgeKey] : 0;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors text-sm',
                          isActive(item.url)
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </div>
                        {!collapsed && <BadgeCounter count={badgeCount} />}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ========== SECTION 3: SUIVI & PILOTAGE ========== */}
        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] font-semibold tracking-wider mb-1 px-3">
              Suivi & Pilotage
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {SUIVI_PILOTAGE_ITEMS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-sm',
                        isActive(item.url)
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
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

        {/* ========== SECTION 4: GESTION ========== */}
        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] font-semibold tracking-wider mb-1 px-3">
              Gestion
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {GESTION_ITEMS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-sm',
                        isActive(item.url)
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
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

        {/* ========== SECTION 5: ADMINISTRATION (Collapsible, Admin only) ========== */}
        {isAdmin && (
          <SidebarGroup className="mt-4">
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] font-semibold tracking-wider mb-1 px-3 flex items-center gap-2">
                <Cog className="h-3.5 w-3.5" />
                Administration
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible open={parametrageOpen} onOpenChange={setParametrageOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="Configuration système"
                        className={cn(
                          'w-full justify-between',
                          isParametrageActive && 'bg-sidebar-accent'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Settings className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="text-sm">Configuration</span>}
                        </div>
                        {!collapsed && (
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 transition-transform',
                              parametrageOpen && 'rotate-90'
                            )}
                          />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {/* Référentiels */}
                        <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
                          Référentiels
                        </div>
                        {PARAMETRAGE_REFERENTIELS.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                              <NavLink
                                to={item.url}
                                className={cn(
                                  'flex items-center gap-2 text-sm py-1.5',
                                  isActive(item.url) && 'text-sidebar-primary font-medium'
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
                        {PARAMETRAGE_UTILISATEURS.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                              <NavLink
                                to={item.url}
                                className={cn(
                                  'flex items-center gap-2 text-sm py-1.5',
                                  isActive(item.url) && 'text-sidebar-primary font-medium'
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
                        {PARAMETRAGE_SYSTEME.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                              <NavLink
                                to={item.url}
                                className={cn(
                                  'flex items-center gap-2 text-sm py-1.5',
                                  isActive(item.url) && 'text-sidebar-primary font-medium'
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}
