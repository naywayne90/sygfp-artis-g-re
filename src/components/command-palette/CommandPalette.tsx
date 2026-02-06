/**
 * Command Palette - Navigation rapide avec Ctrl+K
 * Inspiré de VS Code / Raycast
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
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
  History,
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
  Copy,
  AlertTriangle,
  ScanLine,
  Plus,
  Moon,
  Sun,
  LogOut,
  User,
  Bell,
  HelpCircle,
} from "lucide-react";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";

// Types
interface CommandItem {
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  icon: React.ElementType;
  action: string | (() => void);
  keywords?: string[];
  badge?: number;
  group: "navigation" | "actions" | "budget" | "admin" | "system";
}

// Navigation items
const NAVIGATION_ITEMS: CommandItem[] = [
  { id: "home", label: "Tableau de bord", icon: Home, action: "/", keywords: ["dashboard", "accueil"], group: "navigation" },
  { id: "search", label: "Recherche Dossier", icon: Search, action: "/recherche", keywords: ["find", "chercher"], group: "navigation" },
  { id: "dashboard-direction", label: "Dashboard Direction", icon: Building2, action: "/execution/dashboard-direction", keywords: ["direction", "ma direction"], group: "navigation" },
  { id: "dmg", label: "Dashboard DMG", icon: AlertTriangle, action: "/dashboard-dmg", keywords: ["moyens généraux"], group: "navigation" },
  { id: "workflow", label: "Tâches à traiter", icon: ClipboardList, action: "/workflow-tasks", keywords: ["workflow", "validation", "tâches"], group: "navigation" },
];

const CHAINE_DEPENSE_ITEMS: CommandItem[] = [
  { id: "sef", label: "Notes SEF", shortLabel: "1. SEF", icon: FileText, action: "/notes-sef", keywords: ["demande", "service"], group: "navigation" },
  { id: "aef", label: "Notes AEF", shortLabel: "2. AEF", icon: FileEdit, action: "/notes-aef", keywords: ["autorisation"], group: "navigation" },
  { id: "imputation", label: "Imputation", shortLabel: "3. Imputation", icon: Tag, action: "/execution/imputation", keywords: ["budget", "ligne"], group: "navigation" },
  { id: "eb", label: "Expression de Besoin", shortLabel: "4. EB", icon: Briefcase, action: "/execution/expression-besoin", keywords: ["besoin", "demande"], group: "navigation" },
  { id: "marches", label: "Passation de Marché", shortLabel: "5. Marché", icon: ShoppingCart, action: "/marches", keywords: ["contrat", "appel offre"], group: "navigation" },
  { id: "engagement", label: "Engagement", shortLabel: "6. Engagement", icon: CreditCard, action: "/engagements", keywords: ["engagement", "bon commande"], group: "navigation" },
  { id: "liquidation", label: "Liquidation", shortLabel: "7. Liquidation", icon: Receipt, action: "/liquidations", keywords: ["facture", "réception"], group: "navigation" },
  { id: "ordonnancement", label: "Ordonnancement", shortLabel: "8. Ordo", icon: FileCheck, action: "/ordonnancements", keywords: ["mandat", "ordonnateur"], group: "navigation" },
  { id: "reglement", label: "Règlement", shortLabel: "9. Règlement", icon: Banknote, action: "/reglements", keywords: ["paiement", "virement"], group: "navigation" },
];

const BUDGET_ITEMS: CommandItem[] = [
  { id: "structure", label: "Structure Budgétaire", icon: Wallet, action: "/planification/structure", keywords: ["budget", "dotation"], group: "budget" },
  { id: "plan-travail", label: "Plan de Travail", icon: ClipboardList, action: "/planification/plan-travail", keywords: ["planning", "activités"], group: "budget" },
  { id: "virements", label: "Virements", icon: ArrowRightLeft, action: "/planification/virements", keywords: ["transfert", "crédit"], group: "budget" },
  { id: "reamenagements", label: "Réaménagements", icon: ArrowRightLeft, action: "/budget/reamenagements-imputations", keywords: ["modification", "budget"], group: "budget" },
  { id: "import-export", label: "Import / Export", icon: FileUp, action: "/planification/import-export", keywords: ["excel", "csv"], group: "budget" },
  { id: "prestataires", label: "Prestataires", icon: Building2, action: "/contractualisation/prestataires", keywords: ["fournisseur", "entreprise"], group: "budget" },
  { id: "contrats", label: "Contrats", icon: FileSignature, action: "/contractualisation/contrats", keywords: ["marché", "convention"], group: "budget" },
  { id: "tresorerie", label: "Trésorerie", icon: Landmark, action: "/tresorerie", keywords: ["caisse", "banque"], group: "budget" },
  { id: "etats", label: "États d'Exécution", icon: BarChart3, action: "/etats-execution", keywords: ["rapport", "bilan"], group: "budget" },
];

const ADMIN_ITEMS: CommandItem[] = [
  { id: "exercices", label: "Exercices", icon: Calendar, action: "/admin/exercices", keywords: ["année", "gestion"], group: "admin" },
  { id: "utilisateurs", label: "Utilisateurs", icon: Users, action: "/admin/utilisateurs", keywords: ["compte", "personnel"], group: "admin" },
  { id: "roles", label: "Profils & Rôles", icon: Shield, action: "/admin/roles", keywords: ["permission", "accès"], group: "admin" },
  { id: "delegations", label: "Délégations", icon: UserCog, action: "/admin/delegations", keywords: ["interim", "signature"], group: "admin" },
  { id: "parametres", label: "Paramètres Système", icon: Settings, action: "/admin/parametres", keywords: ["config", "réglages"], group: "admin" },
  { id: "audit", label: "Journal d'Audit", icon: ClipboardList, action: "/admin/journal-audit", keywords: ["log", "trace"], group: "admin" },
];

// Actions rapides
const ACTION_ITEMS: CommandItem[] = [
  { id: "new-sef", label: "Nouvelle Note SEF", icon: Plus, action: "/notes-sef?action=new", keywords: ["créer", "ajouter"], group: "actions" },
  { id: "new-engagement", label: "Nouvel Engagement", icon: Plus, action: "/engagements?action=new", keywords: ["créer", "ajouter"], group: "actions" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: badges } = useSidebarBadges();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Escape to close
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((action: string | (() => void)) => {
    setOpen(false);
    setSearch("");

    if (typeof action === "function") {
      action();
    } else {
      navigate(action);
    }
  }, [navigate]);

  // Map badges to items
  const getBadgeForItem = (id: string): number => {
    if (!badges) return 0;
    const badgeMap: Record<string, keyof typeof badges> = {
      sef: "sefAValider",
      aef: "aefAValider",
      imputation: "imputationsATraiter",
      eb: "ebAValider",
      marches: "marchesEnCours",
      engagement: "engagementsAValider",
      liquidation: "liquidationsAValider",
      ordonnancement: "ordoAValider",
      reglement: "reglementsATraiter",
      virements: "virementsEnAttente",
    };
    const key = badgeMap[id];
    const value = key ? badges[key] : 0;
    return typeof value === 'number' ? value : 0;
  };

  const renderCommandItem = (item: CommandItem) => {
    const badge = getBadgeForItem(item.id);
    return (
      <CommandItem
        key={item.id}
        value={`${item.label} ${item.shortLabel || ""} ${item.keywords?.join(" ") || ""}`}
        onSelect={() => handleSelect(item.action)}
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
          <item.icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.label}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
        </div>
        {badge > 0 && (
          <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
            {badge}
          </Badge>
        )}
        {item.shortLabel && (
          <span className="text-xs text-muted-foreground">{item.shortLabel}</span>
        )}
      </CommandItem>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Rechercher une page, action ou commande..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          <div className="flex flex-col items-center py-6">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucun résultat trouvé</p>
            <p className="text-xs text-muted-foreground mt-1">
              Essayez avec d'autres mots-clés
            </p>
          </div>
        </CommandEmpty>

        {/* Actions rapides */}
        <CommandGroup heading="Actions rapides">
          {ACTION_ITEMS.map(renderCommandItem)}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation principale */}
        <CommandGroup heading="Navigation">
          {NAVIGATION_ITEMS.map(renderCommandItem)}
        </CommandGroup>

        <CommandSeparator />

        {/* Chaîne de dépense */}
        <CommandGroup heading="Chaîne de la Dépense">
          {CHAINE_DEPENSE_ITEMS.map(renderCommandItem)}
        </CommandGroup>

        <CommandSeparator />

        {/* Budget & Gestion */}
        <CommandGroup heading="Budget & Gestion">
          {BUDGET_ITEMS.map(renderCommandItem)}
        </CommandGroup>

        <CommandSeparator />

        {/* Administration */}
        <CommandGroup heading="Administration">
          {ADMIN_ITEMS.map(renderCommandItem)}
        </CommandGroup>
      </CommandList>

      {/* Footer avec raccourcis */}
      <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
            Naviguer
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
            Sélectionner
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
            Fermer
          </span>
        </div>
        <span className="text-primary">SYGFP v3.0</span>
      </div>
    </CommandDialog>
  );
}

// Hook pour ouvrir la command palette de l'extérieur
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}
