/**
 * NotesSEFTabs - Onglets avec compteurs pour la liste des Notes SEF
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { NoteSEFCounts } from '@/lib/notes-sef/types';
import { getTabCount } from '@/hooks/useNotesSEFCounts';

interface Tab {
  id: string;
  label: string;
  color?: string;
}

const TABS: Tab[] = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'a_valider', label: 'À valider', color: 'bg-blue-100 text-blue-700' },
  { id: 'validees', label: 'Validées', color: 'bg-green-100 text-green-700' },
  { id: 'differees', label: 'Différées', color: 'bg-orange-100 text-orange-700' },
  { id: 'rejetees', label: 'Rejetées', color: 'bg-red-100 text-red-700' },
  { id: 'a_imputer', label: 'À imputer', color: 'bg-purple-100 text-purple-700' },
];

interface NotesSEFTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: NoteSEFCounts;
  isLoading?: boolean;
  className?: string;
}

export function NotesSEFTabs({
  activeTab,
  onTabChange,
  counts,
  isLoading = false,
  className,
}: NotesSEFTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={className}>
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
        {TABS.map((tab) => {
          const count = getTabCount(counts, tab.id);
          const isActive = activeTab === tab.id;

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium',
                'data-[state=active]:bg-background data-[state=active]:shadow-sm'
              )}
            >
              <span>{tab.label}</span>
              {isLoading ? (
                <Skeleton className="h-5 w-8 rounded-full" />
              ) : (
                <Badge
                  variant="secondary"
                  className={cn(
                    'h-5 min-w-[1.5rem] px-1.5 text-xs font-semibold',
                    isActive && tab.color ? tab.color : 'bg-muted-foreground/20'
                  )}
                >
                  {count}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
