/**
 * FileProgress - Barre de progression pour l'upload de fichiers
 */

import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileProgressProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md';
}

export function FileProgress({
  progress,
  className,
  showPercentage = true,
  size = 'md',
}: FileProgressProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <Progress
        value={progress}
        className={cn(size === 'sm' ? 'h-1.5' : 'h-2')}
      />
      {showPercentage && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Téléversement... {Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}
