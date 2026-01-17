/**
 * Composant de badge de statut unifié
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStatutUIConfig } from "@/lib/workflow/workflowEngine";
import { 
  FileEdit, 
  Send, 
  Clock, 
  UserCheck, 
  CheckCircle, 
  XCircle, 
  Tag, 
  PenTool, 
  CheckSquare, 
  Banknote, 
  Archive, 
  Ban,
  Circle,
} from "lucide-react";

const ICONS = {
  FileEdit,
  Send,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
  Tag,
  PenTool,
  CheckSquare,
  Banknote,
  Archive,
  Ban,
  Circle,
};

interface WorkflowStatusBadgeProps {
  statut: string | null | undefined;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function WorkflowStatusBadge({
  statut,
  showIcon = true,
  size = 'md',
  className,
}: WorkflowStatusBadgeProps) {
  if (!statut) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        Inconnu
      </Badge>
    );
  }

  const config = getStatutUIConfig(statut);
  const IconComponent = ICONS[config.icon as keyof typeof ICONS] || Circle;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        config.bgColor,
        config.color,
        config.borderColor,
        sizeClasses[size],
        'font-medium border gap-1 inline-flex items-center',
        className
      )}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}
