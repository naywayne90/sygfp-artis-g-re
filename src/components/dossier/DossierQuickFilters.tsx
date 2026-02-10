import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  ListFilter, 
  Clock, 
  CheckCircle, 
  Pause, 
  XCircle,
  AlertTriangle
} from "lucide-react";

interface QuickFilter {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  activeClass: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "all",
    label: "Tous",
    value: "",
    icon: <ListFilter className="h-4 w-4" />,
    color: "text-muted-foreground",
    activeClass: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  {
    id: "en_cours",
    label: "En cours",
    value: "en_cours",
    icon: <Clock className="h-4 w-4" />,
    color: "text-blue-600",
    activeClass: "bg-blue-600 text-white hover:bg-blue-700",
  },
  {
    id: "a_valider",
    label: "À valider",
    value: "a_valider",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-amber-600",
    activeClass: "bg-amber-600 text-white hover:bg-amber-700",
  },
  {
    id: "termine",
    label: "Terminés",
    value: "termine",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600",
    activeClass: "bg-green-600 text-white hover:bg-green-700",
  },
  {
    id: "differe",
    label: "Différés",
    value: "differe",
    icon: <Pause className="h-4 w-4" />,
    color: "text-yellow-600",
    activeClass: "bg-yellow-600 text-white hover:bg-yellow-700",
  },
  {
    id: "rejete",
    label: "Rejetés",
    value: "rejete",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-600",
    activeClass: "bg-red-600 text-white hover:bg-red-700",
  },
];

interface DossierQuickFiltersProps {
  currentStatut: string;
  onStatutChange: (statut: string) => void;
  counts?: Record<string, number>;
}

export function DossierQuickFilters({ 
  currentStatut, 
  onStatutChange,
  counts = {} 
}: DossierQuickFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTERS.map((filter) => {
        const isActive = currentStatut === filter.value;
        const count = filter.value ? counts[filter.value] : undefined;
        
        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onStatutChange(filter.value)}
            className={cn(
              "gap-2 transition-all",
              isActive 
                ? filter.activeClass 
                : `hover:${filter.color} border-border`
            )}
          >
            <span className={cn(!isActive && filter.color)}>
              {filter.icon}
            </span>
            {filter.label}
            {count !== undefined && count > 0 && (
              <Badge 
                variant={isActive ? "secondary" : "outline"} 
                className={cn(
                  "ml-1 h-5 px-1.5 min-w-[20px] text-xs",
                  isActive && "bg-white/20 text-white border-0"
                )}
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
